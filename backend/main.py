from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG, CORS_ORIGINS, API_HOST, API_PORT, validate_config

try:
    validate_config()
except ValueError as e:
    print(f"Warning: {e}")

# Test database connection on startup
def test_db_connection_on_startup():
    """Test database connection when application starts"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            cursor = conn.cursor()
            cursor.execute("SELECT VERSION();")
            version = cursor.fetchone()
            cursor.close()
            conn.close()
            print(f"✅ Database connection successful! MySQL version: {version[0]}")
            print(f"   Connected to: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']} as user '{DB_CONFIG['user']}'")
            return True
    except Error as e:
        print(f"❌ Database connection failed on startup: {e}")
        print(f"   Configuration: host={DB_CONFIG['host']}, port={DB_CONFIG['port']}, "
              f"user={DB_CONFIG['user']}, database={DB_CONFIG['database']}")
        print(f"   Password: {'*' * len(DB_CONFIG.get('password', '')) if DB_CONFIG.get('password') else 'NOT SET'}")
        print(f"   Please check your .env file or environment variables")
        print(f"   Default values in config.py: user='admin', database='CS411-teamup'")
        return False

# Test connection on startup
test_db_connection_on_startup()

app = FastAPI(title="TeamUp UIUC API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if not conn.is_connected():
            raise Error("Connection established but not connected")
        return conn
    except Error as e:
        error_msg = f"Error connecting to MySQL: {e}"
        print(error_msg)
        print(f"Database config used: host={DB_CONFIG['host']}, port={DB_CONFIG['port']}, "
              f"user={DB_CONFIG['user']}, database={DB_CONFIG['database']}, "
              f"password={'*' * len(DB_CONFIG.get('password', '')) if DB_CONFIG.get('password') else 'NOT SET'}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database connection failed: {str(e)}. Check your database configuration in .env file or config.py"
        )


def get_default_terms():
    """Get default terms if database is empty"""
    from datetime import date

    return [
        {
            "term_id": "SP25",
            "name": "Spring 2025",
            "start_date": date(2025, 1, 21).isoformat(),
            "end_date": date(2025, 5, 14).isoformat(),
        },
        {
            "term_id": "FA25",
            "name": "Fall 2025",
            "start_date": date(2025, 8, 25).isoformat(),
            "end_date": date(2025, 12, 18).isoformat(),
        },
        {
            "term_id": "SP24",
            "name": "Spring 2024",
            "start_date": date(2024, 1, 16).isoformat(),
            "end_date": date(2024, 5, 10).isoformat(),
        },
        {
            "term_id": "FA24",
            "name": "Fall 2024",
            "start_date": date(2024, 8, 26).isoformat(),
            "end_date": date(2024, 12, 19).isoformat(),
        },
        {
            "term_id": "SP23",
            "name": "Spring 2023",
            "start_date": date(2023, 1, 17).isoformat(),
            "end_date": date(2023, 5, 12).isoformat(),
        },
        {
            "term_id": "FA23",
            "name": "Fall 2023",
            "start_date": date(2023, 8, 21).isoformat(),
            "end_date": date(2023, 12, 14).isoformat(),
        },
    ]


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


@app.get("/api/terms")
async def get_terms():
    """
    Get all available terms
    Returns default terms if database is empty
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT term_id, name, start_date, end_date
        FROM Term
        ORDER BY start_date DESC
        """

        cursor.execute(query)
        terms = cursor.fetchall()

        # Debug: Print database query results
        print(f"[DEBUG] Database query returned {len(terms)} terms")
        for term in terms:
            print(f"[DEBUG] Term: {term}")

        # If no terms in database, return default terms
        if not terms:
            print("[DEBUG] No terms found in database, returning default terms")
            return get_default_terms()

        # Convert datetime to string
        for term in terms:
            if term["start_date"]:
                if isinstance(term["start_date"], str):
                    # Already a string, keep as is
                    pass
                else:
                    term["start_date"] = term["start_date"].isoformat()
            if term["end_date"]:
                if isinstance(term["end_date"], str):
                    # Already a string, keep as is
                    pass
                else:
                    term["end_date"] = term["end_date"].isoformat()

        print(f"[DEBUG] Returning {len(terms)} terms to client")
        return terms

    except Error as e:
        print(f"[ERROR] Database error: {e}")
        import traceback

        traceback.print_exc()
        # If database error, return default terms as fallback
        return get_default_terms()
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.get("/api/posts/popular")
async def get_popular_posts(limit: int = 10, term_id: Optional[str] = None):
    """
    Get popular posts sorted by view count and request count
    Optionally filter by term_id
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
            c.subject AS course_subject,
            c.number AS course_number,
            s.crn AS section_code,
            c.term_id,
            COUNT(DISTINCT mr.request_id) AS request_count,
            0 AS view_count,
            t.status
        FROM Post p
        LEFT JOIN User u ON p.user_id = u.user_id
        LEFT JOIN Team t ON p.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = c.course_id
        LEFT JOIN MatchRequest mr ON p.post_id = mr.post_id
        WHERE (t.status IS NULL OR t.status = 'open')
        """

        params = []
        if term_id:
            query += " AND c.term_id = %s"
            params.append(term_id)

        query += """
        GROUP BY p.post_id, p.title, p.content, p.created_at, t.target_size,
                 u.display_name, c.title, c.subject, c.number, s.crn, c.term_id, t.status
        ORDER BY request_count DESC, p.created_at DESC
        LIMIT %s
        """
        params.append(limit)

        cursor.execute(query, tuple(params))
        posts = cursor.fetchall()

        # Get skills for each post
        for post in posts:
            skills_query = """
            SELECT s.name
            FROM PostSkill ps
            JOIN Skill s ON ps.skill_id = s.skill_id
            WHERE ps.post_id = %s
            """
            cursor.execute(skills_query, (post["post_id"],))
            skills = cursor.fetchall()
            post["skills"] = [skill["name"] for skill in skills]

        # Convert datetime to string
        for post in posts:
            if post["created_at"]:
                post["created_at"] = post["created_at"].isoformat()

        return posts

    except Error as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.get("/api/posts/search")
async def search_posts(
    term_id: Optional[str] = None, course_id: Optional[str] = None, limit: int = 100
):
    """
    Search posts by term_id and course_id
    Returns all posts for a specific course in a specific term
    """
    conn = None
    try:
        # Debug: Print input parameters
        print(
            f"[DEBUG] search_posts called with term_id={term_id}, course_id={course_id}, limit={limit}"
        )

        if not term_id or not course_id:
            print(
                f"[ERROR] Missing required parameters: term_id={term_id}, course_id={course_id}"
            )
            raise HTTPException(
                status_code=400, detail="Both term_id and course_id are required"
            )

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # First verify that the course exists and matches the term_id
        verify_query = """
        SELECT course_id, term_id, subject, number, title
        FROM Course
        WHERE course_id = %s AND term_id = %s
        """
        cursor.execute(verify_query, (course_id, term_id))
        course_info = cursor.fetchone()

        if not course_info:
            print(f"[WARNING] Course {course_id} not found for term {term_id}")
            # Try to find similar courses
            similar_query = """
            SELECT course_id, term_id, subject, number, title
            FROM Course
            WHERE course_id = %s OR (subject = %s AND number = %s)
            LIMIT 5
            """
            # Extract subject and number from course_id if possible
            # course_id format: sp25CS411 -> subject=CS, number=411
            import re

            match = re.match(r"^[a-z]+\d+([A-Z]+)(\d+)$", course_id)
            if match:
                subject = match.group(1)
                number = match.group(2)
                cursor.execute(similar_query, (course_id, subject, number))
                similar_courses = cursor.fetchall()
                print(f"[DEBUG] Found similar courses: {similar_courses}")
            return []  # Return empty list if course not found

        print(f"[DEBUG] Verified course: {course_info}")

        # Build the query to search for posts
        query = """
        SELECT 
            p.post_id,
            p.title,
            p.content,
            p.created_at,
            t.target_size AS target_team_size,
            u.display_name AS author_name,
            c.title AS course_title,
            c.course_id,
            c.subject AS course_subject,
            c.number AS course_number,
            s.crn AS section_code,
            c.term_id,
            COUNT(DISTINCT mr.request_id) AS request_count,
            0 AS view_count,
            t.status
        FROM Post p
        INNER JOIN Team t ON p.team_id = t.team_id
        INNER JOIN Course c ON t.course_id = c.course_id
        LEFT JOIN User u ON p.user_id = u.user_id
        LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = c.course_id
        LEFT JOIN MatchRequest mr ON p.post_id = mr.post_id
        WHERE (t.status IS NULL OR t.status = 'open')
          AND c.term_id = %s
          AND c.course_id = %s
        GROUP BY p.post_id, p.title, p.content, p.created_at, t.target_size,
                 u.display_name, u.user_id, c.title, c.course_id, c.subject, c.number, 
                 s.crn, c.term_id, t.status
        ORDER BY p.created_at DESC
        LIMIT %s
        """

        params = [term_id, course_id, limit]

        # Debug: Print query and params
        print(f"[DEBUG] Executing query with params: {params}")

        cursor.execute(query, tuple(params))
        posts = cursor.fetchall()

        print(
            f"[DEBUG] Found {len(posts)} posts for term_id={term_id}, course_id={course_id}"
        )

        # Get skills for each post
        for post in posts:
            try:
                skills_query = """
                SELECT s.name
                FROM PostSkill ps
                JOIN Skill s ON ps.skill_id = s.skill_id
                WHERE ps.post_id = %s
                """
                cursor.execute(skills_query, (post["post_id"],))
                skills = cursor.fetchall()
                post["skills"] = [skill["name"] for skill in skills] if skills else []
            except Error as e:
                print(
                    f"[WARNING] Error fetching skills for post {post['post_id']}: {e}"
                )
                post["skills"] = []

        # Convert datetime to string
        for post in posts:
            if post["created_at"]:
                if isinstance(post["created_at"], str):
                    pass
                else:
                    post["created_at"] = post["created_at"].isoformat()

        return posts

    except HTTPException:
        raise
    except Error as e:
        error_msg = str(e)
        print(f"[ERROR] Database error in search_posts: {error_msg}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {error_msg}")
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Unexpected error in search_posts: {error_msg}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {error_msg}")
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
            c.subject AS course_subject,
            c.number AS course_number,
            s.crn AS section_code,
            COUNT(DISTINCT mr.request_id) AS request_count,
            0 AS view_count,
            t.status
        FROM Post p
        LEFT JOIN User u ON p.user_id = u.user_id
        LEFT JOIN Team t ON p.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = c.course_id
        LEFT JOIN MatchRequest mr ON p.post_id = mr.post_id
        WHERE p.post_id = %s
        GROUP BY p.post_id, p.title, p.content, p.created_at, t.target_size,
                 u.display_name, u.user_id, c.title, c.course_id, c.subject, c.number, s.crn, 
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
        post["skills"] = [skill["name"] for skill in skills]

        # Note: view_count is not stored in Post table,
        # it's calculated on the fly or stored separately if needed

        # Convert datetime to string
        if post["created_at"]:
            post["created_at"] = post["created_at"].isoformat()

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
        cursor.execute(
            insert_query, (from_user_id, team_id, request.post_id, request.message)
        )
        conn.commit()

        request_id = cursor.lastrowid

        return {
            "request_id": request_id,
            "message": "Join request created successfully",
            "status": "pending",
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


@app.get("/api/courses/search")
async def search_courses(
    term_id: Optional[str] = None, q: Optional[str] = None, limit: int = 50
):
    """
    Search courses by term_id and query string
    Supports searching by course code (e.g., "CS 411") or course title
    If q is not provided, returns all courses for the term (up to limit)
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT DISTINCT
            c.course_id,
            c.term_id,
            c.subject,
            c.number,
            c.title,
            c.credits,
            CONCAT(c.subject, ' ', c.number) AS course_code
        FROM Course c
        WHERE 1=1
        """

        params = []

        # Filter by term_id if provided
        if term_id:
            query += " AND c.term_id = %s"
            params.append(term_id)

        # Search by query if provided
        if q and q.strip():
            search_term = f"%{q.strip()}%"
            exact_search = q.strip().upper()  # Case-insensitive exact match
            starts_with_term = f"{q.strip()}%"
            query += """
            AND (
                CONCAT(c.subject, ' ', c.number) LIKE %s
                OR c.title LIKE %s
                OR c.subject LIKE %s
                OR c.number LIKE %s
            )
            """
            params.extend([search_term, search_term, search_term, search_term])

            # Order by match relevance: exact match first, then starts with, then contains
            # Use UPPER() for case-insensitive comparison
            query += """
            ORDER BY
                CASE 
                    WHEN UPPER(CONCAT(c.subject, ' ', c.number)) = %s THEN 1
                    WHEN UPPER(CONCAT(c.subject, ' ', c.number)) LIKE %s THEN 2
                    WHEN UPPER(c.title) = %s THEN 3
                    WHEN UPPER(c.title) LIKE %s THEN 4
                    WHEN UPPER(c.subject) = %s THEN 5
                    WHEN UPPER(c.number) = %s THEN 6
                    ELSE 7
                END,
                c.subject, c.number
            """
            starts_with_term_upper = f"{q.strip().upper()}%"
            params.extend(
                [
                    exact_search,  # Exact match course code
                    starts_with_term_upper,  # Starts with course code
                    exact_search,  # Exact match title
                    f"%{q.strip().upper()}%",  # Contains in title
                    exact_search,  # Exact match subject
                    exact_search,  # Exact match number
                ]
            )
        else:
            query += " ORDER BY c.subject, c.number"

        query += " LIMIT %s"
        params.append(limit)

        cursor.execute(query, tuple(params))
        courses = cursor.fetchall()

        return courses

    except Error as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.get("/api/courses/popular")
async def get_popular_courses(term_id: Optional[str] = None, limit: int = 5):
    """
    Get popular courses for a term (courses that have posts)
    Returns courses sorted by number of posts in descending order
    Priority: Courses with the most posts in the specified term
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Ensure term_id is provided for popular courses
        if not term_id:
            return []

        query = """
        SELECT 
            c.course_id,
            c.term_id,
            c.subject,
            c.number,
            c.title,
            c.credits,
            CONCAT(c.subject, ' ', c.number) AS course_code,
            COUNT(DISTINCT p.post_id) AS post_count
        FROM Course c
        INNER JOIN Team t ON c.course_id = t.course_id
        INNER JOIN Post p ON t.team_id = p.team_id
        WHERE c.term_id = %s
          AND (t.status IS NULL OR t.status = 'open')
        GROUP BY c.course_id, c.term_id, c.subject, c.number, c.title, c.credits
        HAVING post_count > 0
        ORDER BY post_count DESC, c.subject ASC, c.number ASC
        LIMIT %s
        """

        params = [term_id, limit]

        cursor.execute(query, tuple(params))
        courses = cursor.fetchall()

        # Debug: Print popular courses with post counts
        print(f"[DEBUG] Popular courses for term {term_id}:")
        for course in courses:
            print(
                f"  - {course['subject']} {course['number']}: {course['post_count']} posts"
            )

        return courses

    except Error as e:
        print(f"Database error: {e}")
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

    uvicorn.run(app, host=API_HOST, port=API_PORT)
