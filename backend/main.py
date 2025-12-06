from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG, CORS_ORIGINS, API_HOST, API_PORT, validate_config

# checking the configuration: if the error msg is printed, check the requirement.txt, config.py
try:
    validate_config()
except ValueError as e:
    print(f"Warning: {e}")

app = FastAPI(title="TeamUp UIUC API", version="1.0.0")

# CORS middleware, connect frontend and backend, config.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# connect with MySQL
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if not conn.is_connected():
            raise Error("Connection established but not connected")
        conn.autocommit = False
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}.",
        )


# Pydantic models, restrictions
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
    from_user_id: Optional[int] = None


class RegisterRequest(BaseModel):
    display_name: str
    email: EmailStr
    netid: Optional[str] = None
    password: Optional[str] = None


class LoginRequest(BaseModel):
    identifier: str  # email or netid
    password: Optional[str] = None


class AuthUser(BaseModel):
    user_id: int
    display_name: str
    email: EmailStr
    netid: Optional[str] = None
    avatar_url: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: AuthUser


class CommentResponse(BaseModel):
    comment_id: int
    post_id: int
    user_id: int
    author_name: Optional[str] = None
    avatar_url: Optional[str] = None
    content: str
    parent_comment_id: Optional[int] = None
    created_at: Optional[str] = None


class CommentCreate(BaseModel):
    user_id: int
    content: str
    parent_comment_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    major: Optional[str] = None
    grade: Optional[str] = None
    score: Optional[float] = None


class PostCreate(BaseModel):
    user_id: int
    term_id: str
    course_id: str
    section_id: Optional[str] = None  # CRN
    team_name: str
    target_size: int
    title: str
    content: str


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class RejectRequestPayload(BaseModel):
    rejection_reason: Optional[str] = None


# just for testing
MOCK_USER = {
    "user_id": 101,
    "display_name": "Avery Chen",
    "email": "avery.chen@illinois.edu",
    "netid": "achen12",
    "avatar_url": "https://avatars.githubusercontent.com/u/1763434?v=4",
}


def get_mock_profile_payload() -> Dict[str, Any]:
    return {
        "profile": {
            "name": "Avery Chen",
            "title": "Product-focused CS + Advertising Student",
            "major": "Computer Science + Advertising Minor",
            "graduation": "Spring 2025",
            "location": "Urbana-Champaign, IL",
            "bio": "I blend user research with rapid prototyping to ship course project MVPs. Currently leading matchmaking initiatives for CS 411 and co-hosting peer onboarding workshops.",
            "availability": "Weekdays after 5 PM & weekends",
        },
        "stats": [
            {"label": "Active Courses", "value": 5, "trend": "+1 this term"},
            {"label": "Open Requests", "value": 3, "trend": "2 waiting replies"},
            {"label": "Successful Matches", "value": 14, "trend": "92% response rate"},
            {
                "label": "Collaboration Score",
                "value": "4.8/5",
                "trend": "Consistently high",
            },
        ],
        "activeTeams": [
            {
                "name": "CS 411 • Team Atlas",
                "role": "Product Lead",
                "focus": "Matching dashboard with predictive ranking",
                "progress": 72,
                "spots": 1,
            },
            {
                "name": "ECE 484 • Resonance Lab",
                "role": "UX Researcher",
                "focus": "Signal optimization visualizer",
                "progress": 45,
                "spots": 2,
            },
        ],
        "spotlightProjects": [
            {
                "course": "CS 412 • Data Mining",
                "title": "Peer Mentor Matching Engine",
                "summary": "Combined MySQL window functions with FastAPI streaming to cut match time by 63%.",
            },
            {
                "course": "INFO 490 • Design Studio",
                "title": "TeamUp Brand Refresh",
                "summary": "Partnered with 4 designers to craft UIUC-themed system with reusable tokens.",
            },
        ],
        "skills": {
            "core": [
                "Product Strategy",
                "Data Storytelling",
                "Team Facilitation",
                "Rapid Prototyping",
            ],
            "tools": ["Figma", "FastAPI", "MySQL", "Supabase", "Vite", "Zustand"],
        },
        "recentActivity": [
            {
                "title": "Launched skill tags for CS 411",
                "time": "2h ago",
                "detail": "Shared tagged templates with 28 teammates.",
            },
            {
                "title": "Reviewed 3 join requests",
                "time": "Yesterday",
                "detail": "Left feedback for students in INFO 303.",
            },
            {
                "title": "Published sprint recap",
                "time": "Mon, 10:45 PM",
                "detail": "Outlined blockers + unblocked tasks for Atlas.",
            },
        ],
        "learningTargets": [
            {
                "topic": "GraphQL Federation",
                "detail": "Scalable gateway for course data mesh",
            },
            {
                "topic": "LLM Prompt Chaining",
                "detail": "Auto-generate teammate intros & outreach tips",
            },
            {
                "topic": "Service Reliability",
                "detail": "Add SLO dashboards for matching backlog",
            },
        ],
    }


@app.get("/")
def root():
    return {"message": "TeamUp UIUC API", "version": "1.0.0"}


@app.get("/api/terms")
async def get_terms():
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

        for term in terms:
            if term["start_date"]:
                if isinstance(term["start_date"], str):
                    pass
                else:
                    term["start_date"] = term["start_date"].isoformat()
            if term["end_date"]:
                if isinstance(term["end_date"], str):
                    pass
                else:
                    term["end_date"] = term["end_date"].isoformat()

        # print(f"[DEBUG] Returning {len(terms)} terms to client")
        return terms

    except Error as e:
        print(f"[ERROR] Database error: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def _build_auth_user(row: Dict[str, Any]) -> AuthUser:
    return AuthUser(
        user_id=row["user_id"],
        display_name=row.get("display_name") or row.get("netid") or row.get("email"),
        email=row["email"],
        netid=row.get("netid"),
        avatar_url=row.get("avatar_url"),
    )


def _fetch_user_by_identifier(cursor, identifier: str):
    query = """
        SELECT user_id, display_name, email, netid, avatar_url
        FROM User
        WHERE email = %s OR netid = %s
        LIMIT 1
    """
    cursor.execute(query, (identifier, identifier))
    return cursor.fetchone()


# register new user
@app.post("/api/auth/register", response_model=AuthResponse)
async def register_user(payload: RegisterRequest):
    if not payload.email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not payload.display_name:
        raise HTTPException(status_code=400, detail="Display name is required")
    if not payload.netid:
        raise HTTPException(status_code=400, detail="NetID is required")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Check for existing user using JOIN with email/netid check and subquery
        check_existing_query = """
            SELECT 
                u.user_id,
                u.email,
                u.netid
            FROM User u
            WHERE (u.email = %s OR u.netid = %s)
            AND u.user_id IN (
                SELECT user_id FROM User WHERE email = %s OR netid = %s
            )
            LIMIT 1
        """
        cursor.execute(
            check_existing_query,
            (payload.email, payload.netid, payload.email, payload.netid),
        )
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="An account with this email or NetID already exists.",
            )

        # Get max user_id using aggregation
        max_id_query = """
            SELECT COALESCE(MAX(user_id), 0) + 1 AS next_id
            FROM User
            WHERE user_id IN (
                SELECT user_id FROM User
            )
        """
        cursor.execute(max_id_query)
        next_id_result = cursor.fetchone()
        next_id = next_id_result["next_id"] if next_id_result else 1

        cursor.execute(
            """
            INSERT INTO User (
                user_id, netid, email, phone_number, display_name,
                avatar_url, bio, score, major, grade
            ) VALUES (%s, %s, %s, NULL, %s, NULL, NULL, NULL, NULL, NULL)
            """,
            (next_id, payload.netid, payload.email, payload.display_name),
        )
        conn.commit()

        user = AuthUser(
            user_id=next_id,
            display_name=payload.display_name,
            email=payload.email,
            netid=payload.netid,
            avatar_url=None,
        )
        token = f"mock-token-{next_id}-{uuid.uuid4().hex[:6]}"
        return AuthResponse(token=token, user=user)
    except Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to register user")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# user login
@app.post("/api/auth/login", response_model=AuthResponse)
async def login_user(payload: LoginRequest):
    identifier = (payload.identifier or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or NetID is required")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        user_row = _fetch_user_by_identifier(cursor, identifier)
        if not user_row:
            raise HTTPException(status_code=401, detail="Account not found")

        user = _build_auth_user(user_row)
        token = f"mock-token-{user.user_id}-{uuid.uuid4().hex[:6]}"
        return AuthResponse(token=token, user=user)
    except Error as e:
        raise HTTPException(status_code=500, detail="Failed to login")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# user logout
@app.post("/api/auth/logout")
async def logout_user():
    return {"message": "Logged out"}


# user profile: get the user's information
@app.get("/api/auth/me", response_model=AuthUser)
async def get_current_user(
    user_id: Optional[int] = None, identifier: Optional[str] = None
):
    if not user_id and not identifier:
        raise HTTPException(status_code=400, detail="user_id or identifier is required")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        if user_id:
            cursor.execute(
                """
                SELECT user_id, display_name, email, netid, avatar_url
                FROM User
                WHERE user_id = %s
                LIMIT 1
                """,
                (user_id,),
            )
            row = cursor.fetchone()
        else:
            row = _fetch_user_by_identifier(cursor, identifier.strip())

        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return _build_auth_user(row)
    except Error as e:
        print(f"[ERROR] Failed to fetch current user: {e}")
        raise HTTPException(status_code=500)
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# user profile: establish all the information of the user
@app.get("/api/profile/me")
async def get_profile(user_id: Optional[int] = None):
    payload = get_mock_profile_payload()
    user_payload = AuthUser(**MOCK_USER).dict()

    if not user_id:
        payload["user"] = user_payload
        return payload

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get user basic info
        cursor.execute(
            """
            SELECT user_id, display_name, email, netid, avatar_url, bio, major, grade, phone_number, score
            FROM User
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        user_payload = _build_auth_user(row).dict()
        user_payload["phone_number"] = row.get("phone_number")
        user_payload["score"] = (
            float(row.get("score")) if row.get("score") is not None else None
        )

        profile = payload["profile"]
        profile["name"] = row.get("display_name") or profile["name"]
        profile["bio"] = row.get("bio") or profile["bio"]
        profile["major"] = row.get("major") or profile["major"]
        profile["graduation"] = row.get("grade") or profile["graduation"]

        # Use stored procedure: sp_get_user_teams
        cursor.callproc("sp_get_user_teams", [user_id, 100])

        teams_data = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            if not teams_data:
                teams_data = rows

        # Filter for open teams only
        teams_data = [
            t for t in teams_data if not t.get("status") or t.get("status") == "open"
        ]

        # Map member_count to current_size for compatibility
        for team in teams_data:
            team["current_size"] = team.get("member_count", 0)

        active_teams = []
        for team in teams_data:
            course_name = f"{team.get('subject', '')} {team.get('number', '')}"
            # Use member_count or current_size
            current_size = team.get("member_count") or team.get("current_size") or 0
            active_teams.append(
                {
                    "name": f"{course_name} • {team.get('team_name', 'Team')}",
                    "role": team.get("role") or "member",
                    "focus": team.get("course_title") or "Course project",
                    "progress": 0,  # Can be calculated later if needed
                    "spots": max(
                        0,
                        (team.get("target_size") or 0) - current_size,
                    ),
                    "team_id": team.get("team_id"),
                    "course_id": team.get("course_id"),
                }
            )
        payload["activeTeams"] = active_teams

        cursor.execute(
            """
            SELECT 
                mr.request_id,
                mr.from_user_id,
                mr.to_team_id,
                mr.post_id,
                mr.message,
                mr.status,
                mr.created_at,
                t.team_name,
                c.subject,
                c.number
            FROM MatchRequest mr
            LEFT JOIN Team t ON mr.to_team_id = t.team_id
            LEFT JOIN Course c ON t.course_id = c.course_id
            WHERE mr.from_user_id = %s
            ORDER BY mr.created_at DESC
            LIMIT 20
        """,
            (user_id,),
        )
        requests_data = cursor.fetchall()

        open_requests = sum(1 for r in requests_data if r.get("status") == "pending")
        successful_matches = sum(
            1 for r in requests_data if r.get("status") == "accepted"
        )

        team_course_ids = set(
            team.get("course_id") for team in teams_data if team.get("course_id")
        )

        cursor.execute(
            """
            SELECT DISTINCT c.course_id
            FROM Post p
            JOIN Team t ON p.team_id = t.team_id
            JOIN Course c ON t.course_id = c.course_id
            WHERE p.user_id = %s
            """,
            (user_id,),
        )
        post_courses = cursor.fetchall()
        post_course_ids = set(
            item["course_id"] for item in post_courses if item.get("course_id")
        )

        unique_courses = len(team_course_ids.union(post_course_ids))

        cursor.execute(
            "SELECT COUNT(*) as post_count FROM Post WHERE user_id = %s", (user_id,)
        )
        user_post_count = cursor.fetchone().get("post_count", 0)

        payload["stats"] = [
            {
                "label": "Active Courses",
                "value": unique_courses,
                "trend": f"{len(teams_data)} teams, {user_post_count} posts",
            },
            {
                "label": "Open Requests",
                "value": open_requests,
                "trend": f"{len(requests_data)} total requests",
            },
            {
                "label": "Successful Matches",
                "value": successful_matches,
                "trend": f"{len(requests_data)} total requests",
            },
            {
                "label": "Collaboration Score",
                "value": "4.8/5",
                "trend": "Consistently high",
            },
        ]

        cursor.execute(
            """
            SELECT s.name, s.category, us.level
            FROM UserSkill us
            JOIN Skill s ON us.skill_id = s.skill_id
            WHERE us.user_id = %s
            ORDER BY s.category, s.name
        """,
            (user_id,),
        )
        skills_data = cursor.fetchall()

        core_skills = [
            s["name"]
            for s in skills_data
            if not s.get("category") or s.get("category") == "core"
        ]
        tool_skills = [s["name"] for s in skills_data if s.get("category") == "tool"]

        if core_skills or tool_skills:
            payload["skills"] = {
                "core": core_skills or payload["skills"].get("core", []),
                "tools": tool_skills or payload["skills"].get("tools", []),
            }

        recent_activity = []
        for req in requests_data[:5]:
            course_code = f"{req.get('subject', '')} {req.get('number', '')}"
            team_name = req.get("team_name", "team")
            if req.get("status") == "pending":
                recent_activity.append(
                    {
                        "title": f"Request sent to {course_code}",
                        "detail": f"Waiting for response from {team_name}",
                        "time": "Recently" if req.get("created_at") else "Unknown",
                    }
                )
            elif req.get("status") == "accepted":
                recent_activity.append(
                    {
                        "title": f"Match accepted: {course_code}",
                        "detail": f"Joined {team_name}",
                        "time": "Recently" if req.get("created_at") else "Unknown",
                    }
                )

        if recent_activity:
            payload["recentActivity"] = recent_activity[:5]

    except HTTPException:
        raise
    except Error as e:
        print(f"[ERROR] Failed to load profile: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to load profile")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

    payload["user"] = user_payload
    return payload


# update function in the user profile page
@app.put("/api/profile/me")
async def update_profile(user_id: int, payload: ProfileUpdate):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Get user info using JOIN to get team membership count
        user_check_query = """
            SELECT 
                u.user_id,
                u.display_name,
                COUNT(DISTINCT tm.team_id) as team_count
            FROM User u
            LEFT JOIN TeamMember tm ON u.user_id = tm.user_id
            WHERE u.user_id = %s
            GROUP BY u.user_id, u.display_name
        """
        cursor.execute(user_check_query, (user_id,))
        user_info = cursor.fetchone()
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if user has posts using subquery
        check_posts_query = """
            SELECT COUNT(*) as post_count
            FROM Post
            WHERE user_id = %s
            AND post_id IN (
                SELECT post_id FROM Post WHERE user_id = %s
            )
        """
        cursor.execute(check_posts_query, (user_id, user_id))
        posts_result = cursor.fetchone()
        post_count = posts_result["post_count"] if posts_result else 0

        update_fields = []
        update_values = []

        if payload.display_name is not None:
            if len(payload.display_name.strip()) > 128:
                raise HTTPException(
                    status_code=400, detail="Display name cannot exceed 128 characters"
                )
            update_fields.append("display_name = %s")
            update_values.append(
                payload.display_name.strip() if payload.display_name.strip() else None
            )

        if payload.phone_number is not None:
            if payload.phone_number and len(payload.phone_number.strip()) > 32:
                raise HTTPException(
                    status_code=400, detail="Phone number cannot exceed 32 characters"
                )
            update_fields.append("phone_number = %s")
            update_values.append(
                payload.phone_number.strip()
                if payload.phone_number and payload.phone_number.strip()
                else None
            )

        if payload.avatar_url is not None:
            if payload.avatar_url and len(payload.avatar_url.strip()) > 256:
                raise HTTPException(
                    status_code=400, detail="Avatar URL cannot exceed 256 characters"
                )
            update_fields.append("avatar_url = %s")
            update_values.append(
                payload.avatar_url.strip()
                if payload.avatar_url and payload.avatar_url.strip()
                else None
            )

        if payload.bio is not None:
            if payload.bio and len(payload.bio.strip()) > 1024:
                raise HTTPException(
                    status_code=400, detail="Bio cannot exceed 1024 characters"
                )
            update_fields.append("bio = %s")
            update_values.append(
                payload.bio.strip() if payload.bio and payload.bio.strip() else None
            )

        if payload.major is not None:
            if payload.major and len(payload.major.strip()) > 64:
                raise HTTPException(
                    status_code=400, detail="Major cannot exceed 64 characters"
                )
            update_fields.append("major = %s")
            update_values.append(
                payload.major.strip()
                if payload.major and payload.major.strip()
                else None
            )

        if payload.grade is not None:
            if payload.grade and len(payload.grade.strip()) > 16:
                raise HTTPException(
                    status_code=400, detail="Grade cannot exceed 16 characters"
                )
            update_fields.append("grade = %s")
            update_values.append(
                payload.grade.strip()
                if payload.grade and payload.grade.strip()
                else None
            )

        if payload.score is not None:
            update_fields.append("score = %s")
            update_values.append(payload.score if payload.score is not None else None)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_values.append(user_id)
        update_query = f"UPDATE User SET {', '.join(update_fields)} WHERE user_id = %s"
        cursor.execute(update_query, tuple(update_values))
        conn.commit()

        cursor.execute(
            """
            SELECT user_id, display_name, email, netid, avatar_url, bio, major, grade, phone_number, score
            FROM User
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,),
        )
        updated_user = cursor.fetchone()

        if updated_user and updated_user.get("score") is not None:
            updated_user["score"] = float(updated_user["score"])

        return {"message": "Profile updated successfully", "user": updated_user}
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# user's teams page
@app.get("/api/users/{user_id}/teams")
async def get_user_teams(user_id: int):
    # Get all teams a user has joined using stored procedure
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Call stored procedure: sp_get_user_teams
        cursor.callproc("sp_get_user_teams", [user_id, 50])

        # Get results from stored procedure
        teams = []
        for result in cursor.stored_results():
            teams = result.fetchall()

        # Map member_count to current_size for backward compatibility
        for team in teams:
            team["current_size"] = team.get("member_count", 0)

        return teams

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# get the user's team information -> My teams page backend(team members etc.)
@app.get("/api/teams/{team_id}")
async def get_team_details(team_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT 
            t.team_id,
            t.team_name,
            t.target_size,
            t.status,
            t.course_id,
            t.section_id,
            c.subject,
            c.number,
            c.title AS course_title,
            s.crn AS section_code,
            s.instructor,
            s.meeting_time,
            s.location,
            s.delivery_mode,
            COUNT(DISTINCT tm.user_id) AS member_count
        FROM Team t
        JOIN Course c ON t.course_id = c.course_id
        LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = s.course_id
        LEFT JOIN TeamMember tm ON t.team_id = tm.team_id
        WHERE t.team_id = %s
        GROUP BY t.team_id, t.team_name, t.target_size, t.status, t.course_id, t.section_id,
                 c.subject, c.number, c.title, s.crn, s.instructor, s.meeting_time, s.location, s.delivery_mode
        """
        cursor.execute(query, (team_id,))
        team = cursor.fetchone()

        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        team["current_size"] = team.get("member_count", 0)

        members_query = """
        SELECT 
            tm.user_id,
            tm.role,
            tm.joined_at,
            u.display_name,
            u.netid,
            u.email,
            u.avatar_url,
            u.major,
            u.grade,
            u.score
        FROM TeamMember tm
        JOIN User u ON tm.user_id = u.user_id
        WHERE tm.team_id = %s
        ORDER BY tm.joined_at ASC
        """
        cursor.execute(members_query, (team_id,))
        members = cursor.fetchall()

        for member in members:
            if member.get("joined_at"):
                member["joined_at"] = member["joined_at"].isoformat()

        team["members"] = members

        return team
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# Get all posts a user has written or commented
@app.get("/api/users/{user_id}/posts")
async def get_user_posts(user_id: int, limit: int = 50):
    # Get all posts a user has written or commented on using stored procedure
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Call stored procedure: sp_get_user_post_interactions
        cursor.callproc("sp_get_user_post_interactions", [user_id, limit])

        # Get results from stored procedure
        posts = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            # First result set is the posts
            if not posts:
                posts = rows

        # Extract additional info from posts if needed
        # The stored procedure returns interaction_type, but we need to match original format
        for post in posts:
            # Get course and section info if team_id exists
            if post.get("team_id"):
                cursor.execute(
                    """
                    SELECT t.course_id, t.team_name, c.subject, c.number, c.title AS course_title, c.term_id, s.crn AS section_code
                    FROM Team t
                    LEFT JOIN Course c ON t.course_id = c.course_id
                    LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = c.course_id
                    WHERE t.team_id = %s
                """,
                    (post["team_id"],),
                )
                team_info = cursor.fetchone()
                if team_info:
                    post.update(team_info)

        return posts
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# My course page backend
@app.get("/api/users/{user_id}/courses")
async def get_user_courses(user_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query_teams = """
            SELECT DISTINCT
                c.course_id,
                c.term_id,
                c.subject,
                c.number,
                c.title AS course_title,
                c.credits,
                t.team_id,
                t.team_name,
                tm.role,
                tm.joined_at
            FROM TeamMember tm
            JOIN Team t ON tm.team_id = t.team_id
            JOIN Course c ON t.course_id = c.course_id
            WHERE tm.user_id = %s
        """

        cursor.execute(query_teams, (user_id,))
        team_courses = cursor.fetchall()

        query_posts = """
            SELECT DISTINCT
                c.course_id,
                c.term_id,
                c.subject,
                c.number,
                c.title AS course_title,
                c.credits,
                p.post_id,
                p.title AS post_title,
                p.created_at AS post_created_at
            FROM Post p
            JOIN Team t ON p.team_id = t.team_id
            JOIN Course c ON t.course_id = c.course_id
            WHERE p.user_id = %s
        """

        cursor.execute(query_posts, (user_id,))
        post_courses = cursor.fetchall()

        courses_map = {}

        for item in team_courses:
            course_id = item["course_id"]
            if course_id not in courses_map:
                courses_map[course_id] = {
                    "course_id": course_id,
                    "term_id": item["term_id"],
                    "subject": item["subject"],
                    "number": item["number"],
                    "title": item["course_title"],
                    "credits": item["credits"],
                    "teams": [],
                    "posts": [],
                }
            courses_map[course_id]["teams"].append(
                {
                    "team_id": item["team_id"],
                    "team_name": item["team_name"],
                    "role": item["role"],
                    "joined_at": item["joined_at"],
                }
            )

        for item in post_courses:
            course_id = item["course_id"]
            if course_id not in courses_map:
                courses_map[course_id] = {
                    "course_id": course_id,
                    "term_id": item["term_id"],
                    "subject": item["subject"],
                    "number": item["number"],
                    "title": item["course_title"],
                    "credits": item["credits"],
                    "teams": [],
                    "posts": [],
                }
            courses_map[course_id]["posts"].append(
                {
                    "post_id": item["post_id"],
                    "post_title": item["post_title"],
                    "created_at": item["post_created_at"],
                }
            )

        courses_list = list(courses_map.values())
        courses_list.sort(key=lambda x: (x["subject"], x["number"]))

        return courses_list
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# send out(create new) match requests -> send in the post page to a user's notification page
@app.get("/api/users/{user_id}/match-requests")
async def get_user_match_requests(user_id: int, status: Optional[str] = None):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                mr.request_id,
                mr.from_user_id,
                mr.to_team_id,
                mr.post_id,
                mr.message,
                mr.status,
                mr.created_at,
                t.team_name,
                c.subject,
                c.number,
                c.title AS course_title,
                p.title AS post_title
            FROM MatchRequest mr
            LEFT JOIN Team t ON mr.to_team_id = t.team_id
            LEFT JOIN Course c ON t.course_id = c.course_id
            LEFT JOIN Post p ON mr.post_id = p.post_id
            WHERE mr.from_user_id = %s
        """

        params = [user_id]
        if status:
            query += " AND mr.status = %s"
            params.append(status)

        query += " ORDER BY mr.created_at DESC"

        cursor.execute(query, tuple(params))
        requests = cursor.fetchall()

        return requests
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# receive the match requests -> notification page
@app.get("/api/users/{user_id}/received-requests")
async def get_user_received_requests(user_id: int, status: Optional[str] = None):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                mr.request_id,
                mr.from_user_id,
                mr.to_team_id,
                mr.post_id,
                mr.message,
                mr.status,
                mr.created_at,
                t.team_name,
                c.subject,
                c.number,
                c.title AS course_title,
                p.title AS post_title,
                p.user_id AS post_author_id,
                u.display_name AS sender_name,
                u.netid AS sender_netid
            FROM MatchRequest mr
            INNER JOIN Post p ON mr.post_id = p.post_id
            LEFT JOIN Team t ON mr.to_team_id = t.team_id
            LEFT JOIN Course c ON t.course_id = c.course_id
            LEFT JOIN User u ON mr.from_user_id = u.user_id
            WHERE p.user_id = %s
        """

        params = [user_id]
        if status:
            query += " AND mr.status = %s"
            params.append(status)

        query += " ORDER BY mr.created_at DESC"

        cursor.execute(query, tuple(params))
        requests = cursor.fetchall()
        return requests

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# accept match request in notification page: if accept, update user's teams and team table
@app.put("/api/users/{user_id}/requests/{request_id}/accept")
async def accept_join_request(user_id: int, request_id: int):
    """Accept a join request - add user to team and update request status"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Verify the request exists and belongs to a post authored by the user
        verify_query = """
            SELECT 
                mr.request_id,
                mr.from_user_id,
                mr.to_team_id,
                mr.post_id,
                mr.status,
                p.user_id AS post_author_id
            FROM MatchRequest mr
            INNER JOIN Post p ON mr.post_id = p.post_id
            WHERE mr.request_id = %s AND p.user_id = %s
        """
        cursor.execute(verify_query, (request_id, user_id))
        request_info = cursor.fetchone()

        if not request_info:
            raise HTTPException(status_code=404, detail="Request not found")

        if request_info["status"] != "pending":
            raise HTTPException(
                status_code=400, detail=f"Request already {request_info['status']}"
            )

        from_user_id = request_info["from_user_id"]
        to_team_id = request_info["to_team_id"]

        # Check if user is already a member of the team
        check_member_query = """
            SELECT team_id, user_id FROM TeamMember 
            WHERE team_id = %s AND user_id = %s
        """
        cursor.execute(check_member_query, (to_team_id, from_user_id))
        existing_member = cursor.fetchone()

        # Switch to regular cursor for updates
        cursor.close()
        cursor = conn.cursor()

        if not existing_member:
            # Add user to team
            team_member_insert_query = """
                INSERT INTO TeamMember (team_id, user_id, role, joined_at)
                VALUES (%s, %s, 'member', NOW())
                ON DUPLICATE KEY UPDATE role = 'member', joined_at = NOW()
            """
            cursor.execute(team_member_insert_query, (to_team_id, from_user_id))

            # Check if team is now full and update status
            check_team_capacity_query = """
                SELECT 
                    t.target_size,
                    (SELECT COUNT(*) FROM TeamMember WHERE team_id = %s) AS current_size
                FROM Team t
                WHERE t.team_id = %s
            """
            cursor.execute(check_team_capacity_query, (to_team_id, to_team_id))
            team_capacity = cursor.fetchone()

            if team_capacity and len(team_capacity) >= 2:
                target_size = team_capacity[0]
                current_size = team_capacity[1]
                if current_size >= target_size:
                    # Team is full, update status to 'full'
                    update_team_status_query = """
                        UPDATE Team
                        SET status = 'full'
                        WHERE team_id = %s
                    """
                    cursor.execute(update_team_status_query, (to_team_id,))

        # Update request status to accepted
        update_request_query = """
            UPDATE MatchRequest
            SET status = 'accepted'
            WHERE request_id = %s
        """
        cursor.execute(update_request_query, (request_id,))

        conn.commit()

        return {
            "message": "Join request accepted successfully",
            "request_id": request_id,
            "status": "accepted",
            "user_added_to_team": not existing_member,
        }

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# reject match request in notification page: if reject, update the request msg and delete
@app.put("/api/users/{user_id}/requests/{request_id}/reject")
async def reject_join_request(
    user_id: int, request_id: int, payload: Optional[RejectRequestPayload] = None
):
    """Reject a join request - update request status and optionally save rejection reason"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Verify the request exists and belongs to a post authored by the user
        verify_query = """
            SELECT 
                mr.request_id,
                mr.status,
                mr.message,
                p.user_id AS post_author_id
            FROM MatchRequest mr
            INNER JOIN Post p ON mr.post_id = p.post_id
            WHERE mr.request_id = %s AND p.user_id = %s
        """
        cursor.execute(verify_query, (request_id, user_id))
        request_info = cursor.fetchone()

        if not request_info:
            raise HTTPException(
                status_code=404, detail="Request not found or unauthorized"
            )

        if request_info["status"] != "pending":
            raise HTTPException(
                status_code=400, detail=f"Request already {request_info['status']}"
            )

        # Check if there are other pending requests for this team using subquery
        check_other_requests_query = """
            SELECT COUNT(*) as other_pending_count
            FROM MatchRequest
            WHERE to_team_id = (
                SELECT to_team_id FROM MatchRequest WHERE request_id = %s
            )
            AND status = 'pending'
            AND request_id != %s
        """
        cursor.execute(check_other_requests_query, (request_id, request_id))
        other_requests = cursor.fetchone()
        other_pending_count = (
            other_requests["other_pending_count"] if other_requests else 0
        )

        # Switch to regular cursor for updates
        cursor.close()
        cursor = conn.cursor()

        # Update request status to rejected
        # If rejection_reason is provided, append it to the message
        if payload and payload.rejection_reason:
            # Append rejection reason to existing message
            existing_message = request_info.get("message") or ""
            if existing_message:
                new_message = f"{existing_message}\n\n[Rejection reason: {payload.rejection_reason}]"
            else:
                new_message = f"[Rejection reason: {payload.rejection_reason}]"

            update_request_query = """
                UPDATE MatchRequest
                SET status = 'rejected', message = %s
                WHERE request_id = %s
            """
            cursor.execute(update_request_query, (new_message, request_id))
        else:
            update_request_query = """
                UPDATE MatchRequest
                SET status = 'rejected'
                WHERE request_id = %s
            """
            cursor.execute(update_request_query, (request_id,))

        conn.commit()

        return {
            "message": "Join request rejected successfully",
            "request_id": request_id,
            "status": "rejected",
        }

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# home page: popular posts(10 -> influenced in frontend) will be show at the home
@app.get("/api/posts/popular")
async def get_popular_posts(limit: int = 10, term_id: Optional[str] = None):
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
            COUNT(DISTINCT cm.comment_id) AS comment_count,
            0 AS view_count,
            t.status
        FROM Post p
        LEFT JOIN User u ON p.user_id = u.user_id
        LEFT JOIN Team t ON p.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = c.course_id
        LEFT JOIN MatchRequest mr ON p.post_id = mr.post_id
        LEFT JOIN Comment cm ON p.post_id = cm.post_id
        WHERE (t.status IS NULL OR t.status = 'open')
        """

        params = []
        if term_id:
            query += " AND c.term_id = %s"
            params.append(term_id)

        query += """
        GROUP BY p.post_id, p.title, p.content, p.created_at, t.target_size,
                 u.display_name, c.title, c.subject, c.number, s.crn, c.term_id, t.status
        ORDER BY request_count DESC, comment_count DESC, p.created_at DESC
        LIMIT %s
        """
        params.append(limit)

        cursor.execute(query, tuple(params))
        posts = cursor.fetchall()

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

        for post in posts:
            if post["created_at"]:
                post["created_at"] = post["created_at"].isoformat()

        return posts

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# search the posts: based on term_id and course_id
@app.get("/api/posts/search")
async def search_posts(
    term_id: Optional[str] = None, course_id: Optional[str] = None, limit: int = 100
):
    conn = None
    try:
        if not term_id or not course_id:
            print(
                f"Missing required parameters: term_id={term_id}, course_id={course_id}"
            )
            raise HTTPException(status_code=400)

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        verify_query = """
        SELECT course_id, term_id, subject, number, title
        FROM Course
        WHERE course_id = %s AND term_id = %s
        """
        cursor.execute(verify_query, (course_id, term_id))
        course_info = cursor.fetchone()

        if not course_info:
            print(f"[WARNING] Course {course_id} not found for term {term_id}")
            similar_query = """
            SELECT course_id, term_id, subject, number, title
            FROM Course
            WHERE course_id = %s OR (subject = %s AND number = %s)
            LIMIT 5
            """
            import re

            match = re.match(r"^[a-z]+\d+([A-Z]+)(\d+)$", course_id)
            if match:
                subject = match.group(1)
                number = match.group(2)
                cursor.execute(similar_query, (course_id, subject, number))
                similar_courses = cursor.fetchall()
            return []

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

        cursor.execute(query, tuple(params))
        posts = cursor.fetchall()

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


# search the posts: based on post_id -> then we can get access to a specific post
@app.get("/api/posts/{post_id}")
async def get_post_by_id(post_id: int):
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

        if post["created_at"]:
            post["created_at"] = post["created_at"].isoformat()

        return post

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# update the post information by the owner of the post
@app.put("/api/posts/{post_id}")
async def update_post(post_id: int, payload: PostUpdate, user_id: Optional[int] = None):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    if payload.title is not None:
        if not payload.title.strip():
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        if len(payload.title.strip()) > 128:
            raise HTTPException(
                status_code=400, detail="Title cannot exceed 128 characters"
            )

    if payload.content is not None:
        if not payload.content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        if len(payload.content.strip()) > 4000:
            raise HTTPException(
                status_code=400, detail="Content cannot exceed 4000 characters"
            )

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Verify post exists and belongs to the user using JOIN with Team and Course
        verify_query = """
            SELECT 
                p.post_id,
                p.user_id,
                p.team_id,
                t.team_name,
                c.subject,
                c.number
            FROM Post p
            JOIN Team t ON p.team_id = t.team_id
            JOIN Course c ON t.course_id = c.course_id
            WHERE p.post_id = %s
        """
        cursor.execute(verify_query, (post_id,))
        post_info = cursor.fetchone()

        if not post_info:
            raise HTTPException(status_code=404, detail="Post not found")

        if post_info["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only edit your own posts"
            )

        # Check if post has any pending requests using subquery
        check_requests_query = """
            SELECT COUNT(*) as pending_count
            FROM MatchRequest
            WHERE post_id = %s
            AND status = 'pending'
            AND request_id IN (
                SELECT request_id FROM MatchRequest WHERE post_id = %s
            )
        """
        cursor.execute(check_requests_query, (post_id, post_id))
        requests_result = cursor.fetchone()
        pending_count = requests_result["pending_count"] if requests_result else 0

        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []

        if payload.title is not None:
            update_fields.append("title = %s")
            update_values.append(payload.title.strip())

        if payload.content is not None:
            update_fields.append("content = %s")
            update_values.append(payload.content.strip())

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Add updated_at
        update_fields.append("updated_at = NOW()")
        update_values.append(post_id)

        # Switch to regular cursor for update
        cursor.close()
        cursor = conn.cursor()

        update_query = f"""
            UPDATE Post
            SET {', '.join(update_fields)}
            WHERE post_id = %s
        """
        cursor.execute(update_query, tuple(update_values))
        conn.commit()

        return {
            "message": "Post updated successfully",
            "post_id": post_id,
        }

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# delete a post
@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: int, user_id: Optional[int] = None):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Verify post exists and belongs to the user
        verify_query = """
            SELECT post_id, user_id, team_id
            FROM Post
            WHERE post_id = %s
        """
        cursor.execute(verify_query, (post_id,))
        post_info = cursor.fetchone()

        if not post_info:
            raise HTTPException(status_code=404, detail="Post not found")

        if post_info["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only delete your own posts"
            )

        team_id = post_info["team_id"]

        # Check team member count and get team details using JOIN
        check_members_query = """
            SELECT 
                COUNT(tm.user_id) as member_count,
                t.target_size,
                t.status as team_status
            FROM Team t
            LEFT JOIN TeamMember tm ON t.team_id = tm.team_id
            WHERE t.team_id = %s
            GROUP BY t.team_id, t.target_size, t.status
        """
        cursor.execute(check_members_query, (team_id,))
        member_result = cursor.fetchone()
        member_count = member_result["member_count"] if member_result else 0

        # Check if there are active match requests for this post using subquery
        check_active_requests_query = """
            SELECT COUNT(*) as active_request_count
            FROM MatchRequest
            WHERE post_id = %s 
            AND status = 'pending'
            AND request_id IN (
                SELECT request_id 
                FROM MatchRequest 
                WHERE post_id = %s AND status != 'withdrawn'
            )
        """
        cursor.execute(check_active_requests_query, (post_id, post_id))
        active_requests = cursor.fetchone()
        active_request_count = (
            active_requests["active_request_count"] if active_requests else 0
        )

        # Switch to regular cursor for deletes
        cursor.close()
        cursor = conn.cursor()

        # Delete related data first
        # 1. Soft delete comments (set status to 'deleted')
        cursor.execute(
            """
            UPDATE Comment
            SET status = 'deleted', updated_at = NOW()
            WHERE post_id = %s
            """,
            (post_id,),
        )

        # 2. Update pending match requests to 'withdrawn'
        cursor.execute(
            """
            UPDATE MatchRequest
            SET status = 'withdrawn'
            WHERE post_id = %s AND status = 'pending'
            """,
            (post_id,),
        )

        # 3. Delete PostSkill relationships
        cursor.execute("DELETE FROM PostSkill WHERE post_id = %s", (post_id,))

        # 4. Delete the Post
        cursor.execute("DELETE FROM Post WHERE post_id = %s", (post_id,))

        # 5. If team has only 1 member (the owner), delete the team and team members
        if member_count == 1:
            # Withdraw all pending requests for this team
            cursor.execute(
                """
                UPDATE MatchRequest
                SET status = 'withdrawn'
                WHERE to_team_id = %s AND status = 'pending'
                """,
                (team_id,),
            )
            cursor.execute("DELETE FROM TeamMember WHERE team_id = %s", (team_id,))
            cursor.execute("DELETE FROM Team WHERE team_id = %s", (team_id,))
            team_deleted = True
        else:
            # If team has other members, keep the team but update any pending requests
            cursor.execute(
                """
                UPDATE MatchRequest
                SET status = 'withdrawn'
                WHERE to_team_id = %s AND status = 'pending'
                """,
                (team_id,),
            )
            team_deleted = False

        conn.commit()

        return {
            "message": "Post deleted successfully",
            "post_id": post_id,
            "team_deleted": team_deleted,
            "team_id": team_id if not team_deleted else None,
        }

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# establish post comments
@app.get("/api/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_post_comments(post_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT post_id FROM Post WHERE post_id = %s", (post_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Post not found")

        comment_query = """
        SELECT 
            c.comment_id,
            c.post_id,
            c.user_id,
            c.parent_comment_id,
            c.content,
            c.created_at,
            u.display_name AS author_name,
            u.avatar_url
        FROM Comment c
        LEFT JOIN User u ON c.user_id = u.user_id
        WHERE c.post_id = %s AND (c.status IS NULL OR c.status != 'deleted')
        ORDER BY c.created_at ASC, c.comment_id ASC
        """
        cursor.execute(comment_query, (post_id,))
        comments = cursor.fetchall()

        for comment in comments:
            if comment.get("created_at"):
                comment["created_at"] = comment["created_at"].isoformat()

        return comments
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# add comments
@app.post("/api/posts/{post_id}/comments", response_model=CommentResponse)
async def create_post_comment(post_id: int, payload: CommentCreate):
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Verify post exists and get post details using JOIN
        post_check_query = """
            SELECT 
                p.post_id,
                p.title,
                p.user_id as post_author_id,
                t.team_id,
                t.team_name,
                c.subject,
                c.number
            FROM Post p
            JOIN Team t ON p.team_id = t.team_id
            JOIN Course c ON t.course_id = c.course_id
            WHERE p.post_id = %s
        """
        cursor.execute(post_check_query, (post_id,))
        post_info = cursor.fetchone()
        if not post_info:
            raise HTTPException(status_code=404, detail="Post not found")

        # Get user info using subquery to verify user exists
        user_check_query = """
            SELECT user_id, display_name, avatar_url
            FROM User
            WHERE user_id = %s
            AND user_id IN (
                SELECT user_id FROM User WHERE user_id = %s
            )
        """
        cursor.execute(user_check_query, (payload.user_id, payload.user_id))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute(
            "SELECT COALESCE(MAX(comment_id), 0) + 1 AS next_id FROM Comment"
        )
        next_id_row = cursor.fetchone()
        next_comment_id = next_id_row["next_id"] if next_id_row else 1

        insert_query = """
        INSERT INTO Comment (comment_id, post_id, user_id, parent_comment_id, content, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, 'visible', NOW(), NOW())
        """
        cursor.execute(
            insert_query,
            (
                next_comment_id,
                post_id,
                payload.user_id,
                payload.parent_comment_id,
                payload.content.strip(),
            ),
        )
        conn.commit()

        from datetime import datetime

        return CommentResponse(
            comment_id=next_comment_id,
            post_id=post_id,
            user_id=payload.user_id,
            author_name=user_row.get("display_name"),
            avatar_url=user_row.get("avatar_url"),
            content=payload.content.strip(),
            parent_comment_id=payload.parent_comment_id,
            created_at=datetime.utcnow().isoformat(),
        )

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# add then update comment
@app.put("/api/posts/{post_id}/comments/{comment_id}")
async def update_comment(
    post_id: int, comment_id: int, payload: CommentUpdate, user_id: Optional[int] = None
):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Verify comment exists and belongs to the user using JOIN with Post
        verify_query = """
            SELECT 
                c.comment_id,
                c.user_id,
                c.status,
                c.content,
                p.post_id,
                p.title as post_title
            FROM Comment c
            JOIN Post p ON c.post_id = p.post_id
            WHERE c.comment_id = %s AND c.post_id = %s
        """
        cursor.execute(verify_query, (comment_id, post_id))
        comment_info = cursor.fetchone()

        if not comment_info:
            raise HTTPException(status_code=404, detail="Comment not found")

        if comment_info["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only edit your own comments"
            )

        if comment_info["status"] == "deleted":
            raise HTTPException(status_code=400, detail="Cannot edit deleted comment")

        # Check if comment has child comments using subquery
        check_children_query = """
            SELECT COUNT(*) as child_count
            FROM Comment
            WHERE parent_comment_id = %s
            AND comment_id IN (
                SELECT comment_id FROM Comment WHERE parent_comment_id = %s
            )
        """
        cursor.execute(check_children_query, (comment_id, comment_id))
        children_result = cursor.fetchone()
        has_children = children_result["child_count"] > 0 if children_result else False

        # Switch to regular cursor for update
        cursor.close()
        cursor = conn.cursor()

        # Update comment content
        update_query = """
            UPDATE Comment
            SET content = %s, updated_at = NOW()
            WHERE comment_id = %s
        """
        cursor.execute(update_query, (payload.content.strip(), comment_id))
        conn.commit()

        return {
            "message": "Comment updated successfully",
            "comment_id": comment_id,
        }

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# delete a comment
@app.delete("/api/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: int, comment_id: int, user_id: Optional[int] = None):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        # Verify comment exists and belongs to the user
        verify_query = """
            SELECT comment_id, user_id, status
            FROM Comment
            WHERE comment_id = %s AND post_id = %s
        """
        cursor.execute(verify_query, (comment_id, post_id))
        comment_info = cursor.fetchone()

        if not comment_info:
            raise HTTPException(status_code=404, detail="Comment not found")

        if comment_info["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only delete your own comments"
            )

        if comment_info["status"] == "deleted":
            raise HTTPException(status_code=400, detail="Comment already deleted")

        # Check if comment has child comments using JOIN and aggregation
        check_child_query = """
            SELECT 
                c.comment_id,
                COUNT(child.comment_id) as child_count,
                c.post_id
            FROM Comment c
            LEFT JOIN Comment child ON c.comment_id = child.parent_comment_id
            WHERE c.comment_id = %s AND c.post_id = %s
            GROUP BY c.comment_id, c.post_id
        """
        cursor.execute(check_child_query, (comment_id, post_id))
        child_result = cursor.fetchone()
        has_children = (
            (child_result and child_result["child_count"] > 0)
            if child_result
            else False
        )

        # Get comment author info using subquery for validation
        author_check_query = """
            SELECT user_id, display_name
            FROM User
            WHERE user_id = %s 
            AND user_id IN (
                SELECT user_id FROM Comment WHERE comment_id = %s
            )
        """
        cursor.execute(author_check_query, (user_id, comment_id))
        author_info = cursor.fetchone()

        # Switch to regular cursor for updates/deletes
        cursor.close()
        cursor = conn.cursor()

        if has_children:
            # Has child comments: soft delete (set status to 'deleted')
            update_query = """
                UPDATE Comment
                SET status = 'deleted', updated_at = NOW()
                WHERE comment_id = %s
            """
            cursor.execute(update_query, (comment_id,))
            delete_type = "soft"
        else:
            # No child comments: hard delete (remove from database)
            delete_query = """
                DELETE FROM Comment
                WHERE comment_id = %s
            """
            cursor.execute(delete_query, (comment_id,))
            delete_type = "hard"

        conn.commit()

        return {
            "message": "Comment deleted successfully",
            "comment_id": comment_id,
            "delete_type": delete_type,
        }
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# join request create
@app.post("/api/requests")
async def create_join_request(request: JoinRequest):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

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

        # Get user_id from request body or default to 1 for now
        from_user_id = request.from_user_id if request.from_user_id else 1
        if not from_user_id:
            raise HTTPException(status_code=400, detail="User ID is required")

        # Check if user is the post author
        if post_author_id == from_user_id:
            raise HTTPException(
                status_code=400,
                detail="You cannot send a join request to your own post",
            )

        # Check if user is already a member of the team using JOIN
        check_member_query = """
        SELECT tm.team_id, tm.user_id, t.status as team_status
        FROM TeamMember tm
        JOIN Team t ON tm.team_id = t.team_id
        WHERE tm.team_id = %s AND tm.user_id = %s
        """
        cursor.execute(check_member_query, (team_id, from_user_id))
        existing_member = cursor.fetchone()

        if existing_member:
            raise HTTPException(
                status_code=400, detail="You are already a member of this team"
            )

        # Check for existing pending request using subquery
        check_query = """
        SELECT request_id
        FROM MatchRequest
        WHERE from_user_id = %s 
        AND to_team_id = %s 
        AND post_id = %s 
        AND status = 'pending'
        AND request_id IN (
            SELECT request_id 
            FROM MatchRequest 
            WHERE post_id = %s AND status != 'withdrawn'
        )
        """
        cursor.execute(
            check_query, (from_user_id, team_id, request.post_id, request.post_id)
        )
        existing = cursor.fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Request already exists")

        cursor.execute(
            "SELECT COALESCE(MAX(request_id), 0) + 1 AS next_id FROM MatchRequest"
        )
        next_id_row = cursor.fetchone()
        next_request_id = next_id_row[0] if next_id_row else 1

        insert_query = """
        INSERT INTO MatchRequest (request_id, from_user_id, to_team_id, post_id, message, status, created_at)
        VALUES (%s, %s, %s, %s, %s, 'pending', NOW())
        """
        cursor.execute(
            insert_query,
            (next_request_id, from_user_id, team_id, request.post_id, request.message),
        )
        conn.commit()

        request_id = next_request_id

        return {
            "request_id": request_id,
            "message": "Join request created successfully",
            "status": "pending",
        }

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# fn: search course
@app.get("/api/courses/search")
async def search_courses(
    term_id: Optional[str] = None, q: Optional[str] = None, limit: int = 50
):
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

        if term_id:
            query += " AND c.term_id = %s"
            params.append(term_id)

        if q and q.strip():
            search_term = f"%{q.strip()}%"
            exact_search = q.strip().upper()
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
                    exact_search,
                    starts_with_term_upper,
                    exact_search,
                    f"%{q.strip().upper()}%",
                    exact_search,
                    exact_search,
                ]
            )
        else:
            query += " ORDER BY c.subject, c.number"

        query += " LIMIT %s"
        params.append(limit)

        cursor.execute(query, tuple(params))
        courses = cursor.fetchall()

        return courses

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# popular course: home page(5 -> frontend)
@app.get("/api/courses/popular")
async def get_popular_courses(term_id: Optional[str] = None, limit: int = 5):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

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

        for course in courses:
            print(
                f"  - {course['subject']} {course['number']}: {course['post_count']} posts"
            )

        return courses

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# when create post -> choose specific section needed
@app.get("/api/courses/{course_id}/sections")
async def get_course_sections(course_id: str):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT 
            s.crn,
            s.instructor,
            s.location,
            s.delivery_mode,
            s.meeting_time,
            s.course_id
        FROM Section s
        WHERE s.course_id = %s
        ORDER BY s.crn ASC
        """

        cursor.execute(query, (course_id,))
        sections = cursor.fetchall()
        return sections

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# create new post
@app.post("/api/posts")
async def create_post(payload: PostCreate):
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    if payload.target_size < 1 or payload.target_size > 10:
        raise HTTPException(
            status_code=400, detail="Target size must be between 1 and 10"
        )
    if len(payload.title) > 128:
        raise HTTPException(
            status_code=400, detail="Title cannot exceed 128 characters"
        )
    if len(payload.content) > 4000:
        raise HTTPException(
            status_code=400, detail="Content cannot exceed 4000 characters"
        )
    if not payload.team_name or not payload.team_name.strip():
        raise HTTPException(status_code=400, detail="Team name cannot be empty")
    if len(payload.team_name.strip()) > 128:
        raise HTTPException(
            status_code=400, detail="Team name cannot exceed 128 characters"
        )

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")

        cursor.execute(
            "SELECT user_id FROM User WHERE user_id = %s", (payload.user_id,)
        )
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify course exists and get course details using JOIN
        course_check_query = """
            SELECT 
                c.course_id,
                c.subject,
                c.number,
                c.title,
                COUNT(s.crn) as section_count
            FROM Course c
            LEFT JOIN Section s ON c.course_id = s.course_id
            WHERE c.course_id = %s
            GROUP BY c.course_id, c.subject, c.number, c.title
        """
        cursor.execute(course_check_query, (payload.course_id,))
        course = cursor.fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if payload.section_id:
            # Verify section belongs to the course using subquery
            section_check_query = """
                SELECT crn, course_id
                FROM Section
                WHERE crn = %s 
                AND course_id = %s
                AND crn IN (
                    SELECT crn FROM Section WHERE course_id = %s
                )
            """
            cursor.execute(
                section_check_query,
                (payload.section_id, payload.course_id, payload.course_id),
            )
            section = cursor.fetchone()
            if not section:
                raise HTTPException(
                    status_code=404, detail="Section not found for this course"
                )

        # Check for existing team name using JOIN to get team details
        existing_team_query = """
            SELECT 
                t.team_id,
                t.team_name,
                c.subject,
                c.number
            FROM Team t
            JOIN Course c ON t.course_id = c.course_id
            WHERE t.team_name = %s
        """
        cursor.execute(existing_team_query, (payload.team_name.strip(),))
        existing_team = cursor.fetchone()
        if existing_team:
            raise HTTPException(
                status_code=400,
                detail="Team name already exists. Please choose a different name.",
            )

        cursor.execute("SELECT COALESCE(MAX(team_id), 0) + 1 AS next_id FROM Team")
        next_team_id = cursor.fetchone()["next_id"]

        team_insert_query = """
        INSERT INTO Team (
            team_id, course_id, section_id, team_name, target_size, status
        ) VALUES (%s, %s, %s, %s, %s, 'open')
        """

        section_id_value = payload.section_id if payload.section_id else None

        cursor.execute(
            team_insert_query,
            (
                next_team_id,
                payload.course_id,
                section_id_value,
                payload.team_name.strip(),
                payload.target_size,
            ),
        )

        cursor.execute("SELECT COALESCE(MAX(post_id), 0) + 1 AS next_id FROM Post")
        next_post_id = cursor.fetchone()["next_id"]

        post_insert_query = """
        INSERT INTO Post (
            post_id, user_id, team_id, title, content, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        """
        cursor.execute(
            post_insert_query,
            (
                next_post_id,
                payload.user_id,
                next_team_id,
                payload.title.strip(),
                payload.content.strip(),
            ),
        )

        team_member_insert_query = """
        INSERT INTO TeamMember (team_id, user_id, role, joined_at)
        VALUES (%s, %s, 'owner', NOW())
        ON DUPLICATE KEY UPDATE role = 'owner'
        """
        cursor.execute(
            team_member_insert_query,
            (next_team_id, payload.user_id),
        )

        conn.commit()

        return {
            "post_id": next_post_id,
            "team_id": next_team_id,
            "message": "Post created successfully",
        }

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# just for safe connection debugging here...
@app.get("/api/health")
def health_check():
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except:
        return {"status": "unhealthy", "database": "disconnected"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=API_HOST, port=API_PORT)
