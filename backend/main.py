from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TeamUp UIUC API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '34.172.159.62'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'team001_db'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}


def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")


# Pydantic models
class PostResponse(BaseModel):
    post_id: int
    title: str
    content: str
    author_name: Optional[str] = None
    course_title: Optional[str] = None
    section_code: Optional[str] = None
    target_team_size: Optional[int] = None
    view_count: Optional[int] = 0
    request_count: Optional[int] = 0
    status: Optional[str] = None
    created_at: Optional[str] = None
    skills: Optional[List[str]] = []


class JoinRequest(BaseModel):
    post_id: int
    message: str


# API Routes
@app.get("/")
def root():
    return {"message": "TeamUp UIUC API", "version": "1.0.0"}


@app.get("/api/posts/popular")
async def get_popular_posts(limit: int = 10):
    """
    Get popular posts sorted by view count and request count
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            p.post_id,
            p.title,
            p.content,
            p.created_at,
            t.target_size AS target_team_size,
            u.display_name AS author_name,
            c.title AS course_title,
            s.crn AS section_code,
            COUNT(DISTINCT mr.request_id) AS request_count,
            0 AS view_count,
            t.status
        FROM Post p
        LEFT JOIN User u ON p.user_id = u.user_id
        LEFT JOIN Team t ON p.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = s.course_id
        LEFT JOIN MatchRequest mr ON p.post_id = mr.post_id
        WHERE t.status IS NULL OR t.status = 'open'
        GROUP BY p.post_id, p.title, p.content, p.created_at, t.target_size,
                 u.display_name, c.title, s.crn, t.status
        ORDER BY request_count DESC, p.created_at DESC
        LIMIT %s
        """
        
        cursor.execute(query, (limit,))
        posts = cursor.fetchall()
        
        # Get skills for each post
        for post in posts:
            skills_query = """
            SELECT s.name
            FROM PostSkill ps
            JOIN Skill s ON ps.skill_id = s.skill_id
            WHERE ps.post_id = %s
            """
            cursor.execute(skills_query, (post['post_id'],))
            skills = cursor.fetchall()
            post['skills'] = [skill['name'] for skill in skills]
        
        # Convert datetime to string
        for post in posts:
            if post['created_at']:
                post['created_at'] = post['created_at'].isoformat()
        
        return posts
        
    except Error as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.get("/api/posts/{post_id}")
async def get_post_by_id(post_id: int):
    """
    Get a specific post by ID
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            p.post_id,
            p.title,
            p.content,
            p.created_at,
            t.target_size AS target_team_size,
            u.display_name AS author_name,
            u.user_id AS author_id,
            c.title AS course_title,
            c.course_id,
            s.crn AS section_code,
            COUNT(DISTINCT mr.request_id) AS request_count,
            0 AS view_count,
            t.status
        FROM Post p
        LEFT JOIN User u ON p.user_id = u.user_id
        LEFT JOIN Team t ON p.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = s.course_id
        LEFT JOIN MatchRequest mr ON p.post_id = mr.post_id
        WHERE p.post_id = %s
        GROUP BY p.post_id, p.title, p.content, p.created_at, t.target_size,
                 u.display_name, u.user_id, c.title, c.course_id, s.crn, 
                 t.status
        """
        
        cursor.execute(query, (post_id,))
        post = cursor.fetchone()
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get skills for the post
        skills_query = """
        SELECT s.name
        FROM PostSkill ps
        JOIN Skill s ON ps.skill_id = s.skill_id
        WHERE ps.post_id = %s
        """
        cursor.execute(skills_query, (post_id,))
        skills = cursor.fetchall()
        post['skills'] = [skill['name'] for skill in skills]
        
        # Note: view_count is not stored in Post table, 
        # it's calculated on the fly or stored separately if needed
        
        # Convert datetime to string
        if post['created_at']:
            post['created_at'] = post['created_at'].isoformat()
        
        return post
        
    except HTTPException:
        raise
    except Error as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.post("/api/requests")
async def create_join_request(request: JoinRequest):
    """
    Create a join request for a post
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get post and team information
        post_query = """
        SELECT p.user_id AS post_author_id, t.team_id
        FROM Post p
        JOIN Team t ON p.team_id = t.team_id
        WHERE p.post_id = %s
        """
        cursor.execute(post_query, (request.post_id,))
        post_info = cursor.fetchone()
        
        if not post_info:
            raise HTTPException(status_code=404, detail="Post not found")
        
        post_author_id, team_id = post_info
        
        # For now, we'll use a mock user_id (in production, get from JWT token)
        from_user_id = 1  # TODO: Get from authenticated user
        
        # Check if request already exists
        check_query = """
        SELECT request_id
        FROM MatchRequest
        WHERE from_user_id = %s AND to_team_id = %s AND post_id = %s 
        AND status = 'pending'
        """
        cursor.execute(check_query, (from_user_id, team_id, request.post_id))
        existing = cursor.fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Request already exists")
        
        # Create the match request
        insert_query = """
        INSERT INTO MatchRequest (from_user_id, to_team_id, post_id, message, status, created_at)
        VALUES (%s, %s, %s, %s, 'pending', NOW())
        """
        cursor.execute(insert_query, (
            from_user_id,
            team_id,
            request.post_id,
            request.message
        ))
        conn.commit()
        
        request_id = cursor.lastrowid
        
        return {
            "request_id": request_id,
            "message": "Join request created successfully",
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Error as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except:
        return {"status": "unhealthy", "database": "disconnected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

