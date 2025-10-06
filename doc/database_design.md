# PT1 Stage 2 — Conceptual & Logical Database Design

## 1. ER Model design

### 1.1 Entities

| Entity | Description | Key Attributes (PK & FKs) |
|---|---|---|
| **Term** | Academic term (e.g., Spring 2025) that scopes courses, sections, posts, and teams. | **term_id (PK)** |
| **Course** | A course instance offered in a specific term (e.g., CS 411). | **course_id (PK)**, **term_id (FK)** |
| **Section** | A specific section of a course with instructor/meeting details. | **section_id (PK)**, **course_id (FK)** |
| **User** | Student account (NetID-based) with public/profile info. | **user_id (PK)** |
| **Skill** | Normalized skill tag used in profiles and matching. | **skill_id (PK)** |
| **Post** | Teammate-seeking post tied to term/course/(optional section). | **post_id (PK)**, **user_id (FK)**, **term_id (FK)**, **course_id (FK)**, **section_id (FK)**, **team_id (FK)** |
| **Team** | Project team with capacity/status under a course/(optional section). | **team_id (PK)**, **owner_user_id (FK)**, **term_id (FK)**, **course_id (FK)**, **section_id (FK)** |
| **TeamMember** | Junction for User ↔ Team membership with role/joined time. | **team_id (FK)**, **user_id (FK)** |
| **UserSkill** | Junction for User ↔ Skill with optional level. | **user_id (FK)**, **skill_id (FK)** |
| **MatchRequest** | Join/contact request workflow (target is user *or* team). | **request_id (PK)**, **from_user_id (FK)**, **to_user_id (FK)**, **to_team_id (FK)**, **post_id (FK)** |
| **Comment** | Threaded comments under posts (optional nesting). | **comment_id (PK)**, **post_id (FK)**, **user_id (FK)**, **parent_comment_id (FK)** |


### 1.2 Relationships & Cardinalities 

> Format: **Name** — *Type / Cardinality* — **Participation** — Notes & Business Rules

- **Term ↔ Course** — *1-to-N* — **Term (mandatory), Course (mandatory)** — Each course belongs to exactly one term; a term has many courses.
- **Course ↔ Section** — *1-to-N* — **Course (mandatory), Section (mandatory)** — A section is defined for exactly one course; a course has many sections.
- **Term ↔ Post** — *1-to-N* — **Term (mandatory), Post (mandatory)** — Each post is scoped to one term; a term has many posts.
- **Course ↔ Post** — *1-to-N* — **Course (mandatory), Post (mandatory)** — Each post is tied to one course; a course has many posts.
- **Section ↔ Post** — *1-to-N (optional on Post)* — **Section (optional), Post (optional)** — A post may (optionally) be tied to a specific section; a section can have many posts.
- **User (author) ↔ Post** — *1-to-N* — **User (mandatory), Post (mandatory)** — One user authors many posts; each post has exactly one author.

- **Term ↔ Team** — *1-to-N* — **Term (mandatory), Team (mandatory)** — Each team is scoped to one term; a term has many teams.
- **Course ↔ Team** — *1-to-N* — **Course (mandatory), Team (mandatory)** — Each team is tied to one course; a course has many teams.
- **Section ↔ Team** — *1-to-N (optional on Team)* — **Section (optional), Team (optional)** — A team may be tied to a section; a section can have many teams.
- **User (owner) ↔ Team** — *1-to-N* — **User (mandatory), Team (mandatory)** — A team has exactly one owner; one user can own many teams.

- **User ↔ Team (via TeamMember)** — *N-to-M* — **Both sides optional per row** — Implemented through **TeamMember(team_id, user_id)**; a user can join many teams and a team has many members. Business rule: `(team_id, user_id)` unique; capacity/auto-full enforced at app level.

- **User ↔ Skill (via UserSkill)** — *N-to-M* — **Both sides optional per row** — Implemented through **UserSkill(user_id, skill_id)**; a user can have many skills, a skill can tag many users. Business rule: `(user_id, skill_id)` unique.

- **Post ↔ Comment** — *1-to-N* — **Post (mandatory), Comment (mandatory)** — A post can have many comments; each comment belongs to exactly one post.
- **User ↔ Comment** — *1-to-N* — **User (mandatory), Comment (mandatory)** — A user can write many comments; each comment has exactly one author.
- **Comment (parent) ↔ Comment (reply)** — *1-to-N (optional)* — **Parent optional, Reply optional** — Nested threads via `parent_comment_id`; top-level comments have `NULL` parent.

- **User (sender) ↔ MatchRequest** — *1-to-N* — **User (mandatory), MatchRequest (mandatory)** — Each request has exactly one sender; a user can send many requests.
- **User (target) ↔ MatchRequest** — *1-to-N (optional on MatchRequest)* — **User (optional), MatchRequest (optional)** — Request may target a **user**; many requests can target the same user.  
- **Team (target) ↔ MatchRequest** — *1-to-N (optional on MatchRequest)* — **Team (optional), MatchRequest (optional)** — Request may target a **team**; many requests can target the same team.  
  - **XOR constraint:** exactly one of `to_user_id` or `to_team_id` is non-null per request.
- **Post (source) ↔ MatchRequest** — *1-to-N (optional on MatchRequest)* — **Post (optional), MatchRequest (optional)** — A request may reference the post it came from (for context/audit).


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
