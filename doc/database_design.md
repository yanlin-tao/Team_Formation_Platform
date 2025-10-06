# PT1 Stage 2 — Conceptual & Logical Database Design

## 1. ER Model design

### 1.1 Entities

# 1.1 Entities — Normalized Data Model

| **Entity** | **Purpose** | **Primary Key** | **Key Attributes** | **Relationships** | **Relational Schema (Conceptual → Logical)** |
|-------------|--------------|-----------------|--------------------|-------------------|---------------------------------------------|
| **Term** | Represents an academic term (e.g., FA25) that scopes all courses, posts, and teams. | `term_id` | `code` (unique, e.g. FA25), `name`, `start_date`, `end_date`, `created_at`, `updated_at` | 1–N → **Course** | `Term(term_id: INT [PK], code: VARCHAR(8) UNIQUE, name: VARCHAR(32), start_date: DATE, end_date: DATE, created_at: DATETIME, updated_at: DATETIME)` |
| **Course** | A course instance offered in a specific term (e.g., CS 411 in FA25). | `course_id` | `term_id` (FK), `subject`, `number`, `title`, `credits`, `created_at`, `updated_at` | N–1 → **Term**; 1–N → **Section**, **Post**, **Team** | `Course(course_id: INT [PK], term_id: INT [FK → Term.term_id], subject: VARCHAR(16), number: VARCHAR(16), title: VARCHAR(255), credits: INT, created_at: DATETIME, updated_at: DATETIME)` |
| **Section** | A particular section of a course with its instructor and meeting info. | `section_id` | `course_id` (FK), `crn` (unique), `section_code`, `instructor`, `meeting_json`, `location`, `delivery_mode`, `created_at`, `updated_at` | N–1 → **Course**; 1–N (opt) → **Post**, **Team** | `Section(section_id: INT [PK], course_id: INT [FK → Course.course_id], crn: VARCHAR(16), section_code: VARCHAR(16), instructor: VARCHAR(255), meeting_json: JSON, location: VARCHAR(64), delivery_mode: VARCHAR(16), created_at: DATETIME, updated_at: DATETIME)` |
| **User** | Authenticated student profile (NetID-based) storing minimal public information. | `user_id` | `netid` (unique), `email` (unique opt), `phone_number`, `display_name`, `avatar_url`, `created_at`, `updated_at` | 1–N → **Post**, **Comment**, **MatchRequest (from)**; N–M ↔ **Team** (via TeamMember); N–M ↔ **Skill** (via UserSkill) | `User(user_id: INT [PK], netid: VARCHAR(64) UNIQUE, email: VARCHAR(255) UNIQUE, phone_number: VARCHAR(32), display_name: VARCHAR(255), avatar_url: VARCHAR(512), created_at: DATETIME, updated_at: DATETIME)` |
| **Skill** | Normalized vocabulary of skills for users and posts (used for filtering / matching). | `skill_id` | `name` (unique), `category`, `created_at` | 1–N → **UserSkill**, **PostSkill** | `Skill(skill_id: INT [PK], name: VARCHAR(64) UNIQUE, category: VARCHAR(64), created_at: DATETIME)` |
| **UserSkill** | Junction table linking users and skills with optional proficiency level. | `(user_id, skill_id)` | `level`, `created_at` | N–1 → **User**, **Skill** (implements N–M) | `UserSkill(user_id: INT [FK → User.user_id], skill_id: INT [FK → Skill.skill_id], level: INT, created_at: DATETIME, [PK user_id, skill_id])` |
| **Post** | Teammate-seeking post under a course/section; visible to other students. | `post_id` | `user_id` (FK), `course_id` (FK), `section_id` (FK opt), `title`, `content`, `team_id` (FK opt), `created_at`, `updated_at` | N–1 → **User/Course/Section**; 1–N → **Comment**, **MatchRequest**; N–M ↔ **Skill** (via PostSkill) | `Post(post_id: INT [PK], user_id: INT [FK → User.user_id], course_id: INT [FK → Course.course_id], section_id: INT [FK → Section.section_id], title: VARCHAR(255), content: TEXT, team_id: INT [FK → Team.team_id], created_at: DATETIME, updated_at: DATETIME)` |
| **PostSkill** | Junction table connecting posts to desired skills (keeps schema in 1NF). | `(post_id, skill_id)` | — | N–1 → **Post**, **Skill** (implements N–M) | `PostSkill(post_id: INT [FK → Post.post_id], skill_id: INT [FK → Skill.skill_id], [PK post_id, skill_id])` |
| **Team** | Represents a project team with capacity, membership, and status. | `team_id` | `course_id` (FK), `section_id` (FK opt), `target_size`, `notes`, `status` (ENUM), `created_at`, `updated_at` | N–1 → **Course/Section**; 1–N → **TeamMember**, **MatchRequest**; N–M ↔ **User** (via TeamMember) | `Team(team_id: INT [PK], course_id: INT [FK → Course.course_id], section_id: INT [FK → Section.section_id], target_size: INT, notes: TEXT, status: VARCHAR(16), created_at: DATETIME, updated_at: DATETIME)` |
| **TeamMember** | Junction table representing team membership and member roles. | `(team_id, user_id)` | `role`, `joined_at` | N–1 → **Team**, **User** (implements N–M) | `TeamMember(team_id: INT [FK → Team.team_id], user_id: INT [FK → User.user_id], role: VARCHAR(32), joined_at: DATETIME, [PK team_id, user_id])` |
| **MatchRequest** | Workflow entity for join/contact requests between users or teams (XOR target). | `request_id` | `from_user_id` (FK), `to_user_id` (FK opt), `to_team_id` (FK opt), `post_id` (FK opt), `message`, `status` (ENUM), `created_at`, `decision_at`, `expires_at` | N–1 → **User(from)**; N–1 (XOR) → **User(to)** / **Team(to)**; N–1 (opt) → **Post** | `MatchRequest(request_id: INT [PK], from_user_id: INT [FK → User.user_id], to_user_id: INT [FK → User.user_id], to_team_id: INT [FK → Team.team_id], post_id: INT [FK → Post.post_id], message: VARCHAR(1000), status: VARCHAR(16), created_at: DATETIME, decision_at: DATETIME, expires_at: DATETIME)` |
| **Comment** | Threaded comment entity for post discussions (with optional nesting). | `comment_id` | `post_id` (FK), `user_id` (FK), `parent_comment_id` (FK self opt), `content`, `status`, `created_at`, `updated_at` | N–1 → **Post**, **User**; 1–N → **Comment** (self-replies) | `Comment(comment_id: INT [PK], post_id: INT [FK → Post.post_id], user_id: INT [FK → User.user_id], parent_comment_id: INT [FK → Comment.comment_id], content: TEXT, status: VARCHAR(16), created_at: DATETIME, updated_at: DATETIME)` |

---

### Summary of Relationship Cardinalities

- **Term (1) — ( N ) Course**  
- **Course (1) — ( N ) Section**, **Post**, **Team**  
- **User (1) — ( N ) Post**, **Comment**, **MatchRequest (from)**  
- **User (N) — (M) Team** (via TeamMember)  
- **User (N) — (M) Skill** (via UserSkill)  
- **Post (N) — (M) Skill** (via PostSkill)  
- **MatchRequest (XOR)** target: User *or* Team  
- **Comment (self)** 1–N hierarchy through `parent_comment_id`


### 1.2 Relationships & Cardinalities
- Term (1) — (N) Course: description, optionality, rationale
- Course (1) — (N) Section: ...
- User (1) — (N) Post: ...
- Team (N) — (M) User via TeamMember: ...
- User (N) — (M) Skill via UserSkill: ...
- MatchRequest: User→User / User→Team (XOR): ...
- (Any other relationships you draw on the ERD)

### 1.3 ER diagram

## 2. Normalization (3NF / BCNF)
- Functional dependencies & keys: give for 4–6 core tables
- Decomposition steps (if any) and why
- Proof or argument each table is in 3NF/BCNF (or justified denormalization)
- Summary table: which NF each table satisfies

## 3. Logical Design — Relational Schema (not SQL)
- One line per table using: Table(col:Domain [PK], col:Domain [FK to t.c], ...)
- Cover all tables present in ERD

## 4. Appendix
- Mapping notes (ER→Relational)
- Terminology (ENUM domain values)
