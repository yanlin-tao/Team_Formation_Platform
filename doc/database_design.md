# PT1 Stage 2 — Conceptual & Logical Database Design

## 1. ER Model design

### 1.1 Entities

| Entity | Description | Attributes (incl. PK/FK) |
|---|---|---|
| **Term** | Academic term that scopes courses, sections, posts, and teams. | **term_id (PK)**, code (unique), name, start_date, end_date, created_at, updated_at |
| **Course** | A course instance offered in a specific term. | **course_id (PK)**, **term_id (FK)**, subject, number, title, credits, created_at, updated_at |
| **Section** | A specific section of a course with instructor/meeting info. | **section_id (PK)**, **course_id (FK)**, crn (unique), section_code, instructor, meeting_time *(or meeting_json)*, location, delivery_mode, created_at, updated_at |
| **User** | Student account (NetID-based) with public/profile info. | **user_id (PK)**, netid (unique), email (unique, opt), phone_number (opt), display_name, avatar_url, bio (opt), score (opt), major (opt), grade (opt), created_at, updated_at |
| **Skill** | Normalized skill tag used for profiles and matching. | **skill_id (PK)**, name (unique), category (opt), created_at |
| **UserSkill** | Junction for User ↔ Skill with optional proficiency. | **user_id (FK)**, **skill_id (FK)**, level (opt), created_at |
| **Post** | Teammate-seeking post tied to term/course/(optional section). | **post_id (PK)**, **user_id (FK)**, **term_id (FK)**, **course_id (FK)**, **section_id (FK, opt)**, **team_id (FK, opt)**, title, content, status, created_at, updated_at |
| **Team** | Project team with capacity/status under a course/(optional section). | **team_id (PK)**, **owner_user_id (FK)**, **term_id (FK)**, **course_id (FK)**, **section_id (FK, opt)**, target_size, notes (opt), status, created_at, updated_at |
| **TeamMember** | Junction for membership of users in teams, with roles. | **team_id (FK)**, **user_id (FK)**, role (opt), joined_at |
| **MatchRequest** | Join/contact request between users or user↔team (XOR target). | **request_id (PK)**, **from_user_id (FK)**, **to_user_id (FK, opt)**, **to_team_id (FK, opt)**, **post_id (FK, opt)**, message (opt), status, created_at, decision_at (opt), expires_at (opt) |
| **Comment** | Threaded comments under posts (optional nesting). | **comment_id (PK)**, **post_id (FK)**, **user_id (FK)**, parent_comment_id (FK self, opt), content, status, created_at, updated_at |


### 1.2 Relationships & Cardinalities


### A) Academic Structure
- **Term → Course** — *1-to-N* — **Term (mandatory), Course (mandatory)** — Each course belongs to exactly one term; a term has many courses.  
- **Course → Section** — *1-to-N* — **Course (mandatory), Section (mandatory)** — A section belongs to one course; a course has many sections.

### B) Content & Communication
- **User (author) → Post** — *1-to-N* — **User (mandatory), Post (mandatory)** — One user authors many posts; each post has exactly one author.  
- **Post → Comment** — *1-to-N* — **Post (mandatory), Comment (mandatory)** — A post can have many comments.  
- **User (author) → Comment** — *1-to-N* — **User (mandatory), Comment (mandatory)** — A user can write many comments.  
- **Comment (parent) → Comment (reply)** — *1-to-N (optional)* — **Parent optional, Reply optional** — Nested threads via `parent_comment_id`; top-level comments have `NULL` parent.

### C) Teaming & Membership
- **User (owner) → Team** — *1-to-N* — **User (mandatory), Team (mandatory)** — A team has exactly one owner; a user may own many teams.  
- **Course → Team** — *1-to-N* — **Course (mandatory), Team (mandatory)** — Team is scoped to a course.  
- **Section → Team** — *1-to-N (optional on Team)* — **Section (optional), Team (optional)** — Teams may optionally be tied to a specific section.  
- **User ↔ Team (via TeamMember)** — *N-to-M* — **Both sides optional per row** — Implemented by `TeamMember(team_id, user_id)`; `(team_id, user_id)` unique; capacity/full logic at app layer.

### D) Skills & Profiles
- **User ↔ Skill (via UserSkill)** — *N-to-M* — **Both sides optional per row** — Implemented by `UserSkill(user_id, skill_id)`; `(user_id, skill_id)` unique.  
- *(If you later model post-required skills as a junction)* **Post ↔ Skill (via PostSkill)** — *N-to-M* — Enables multi-skill requirements per post.

### E) Matching Workflow
- **User (sender) → MatchRequest** — *1-to-N* — **User (mandatory), MatchRequest (mandatory)** — Each request has exactly one sender.  
- **User (target) → MatchRequest** — *1-to-N (optional on request)* — **User (optional), MatchRequest (optional)** — Request may target a user.  
- **Team (target) → MatchRequest** — *1-to-N (optional on request)* — **Team (optional), MatchRequest (optional)** — Request may target a team.  
  - **XOR constraint:** exactly one of `to_user_id` or `to_team_id` is non-null per request.  
- **Post (source) → MatchRequest** — *1-to-N (optional on request)* — **Post (optional), MatchRequest (optional)** — A request may reference its source post (audit/context).

### F) Optional Cross-Scoping (if retained in your design)
- **Term → Post** — *1-to-N* — Post scoped by term (redundant if term is derivable via course; keep only if you choose denormalized convenience).  
- **Term → Team** — *1-to-N* — Same note as above.


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
