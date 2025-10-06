# PT1 Stage 2 — Conceptual & Logical Database Design

## 1. ER Model (choose ERD)
- Embedded image (Figure 1)
- One-sentence note: we use ERD (not UML).

## 2. Assumptions & Justifications
### 2.1 Entities
### 1.1 Entities Overview

| **Entity** | **Purpose** | **Primary Key** | **Key Attributes** | **Relationships (Summary)** | **Notes / Rationale** |
|-------------|-------------|----------------|--------------------|-----------------------------|------------------------|
| **Term** | Defines academic semester context for all course-related data. | `name` | `start_date`, `end_date`, `created_at`, `updated_at` | 1–N: Term → Course; Term → Post; Term → Team | Needed to support course/section scoping. |
| **Course** | Represents a course instance within a term. | `course_id` | `term_name (FK)`, `subject`, `title`, `credits`, `created_at`, `updated_at` | N–1: Course → Term; 1–N: Course → Section/Post/Team | Modeled separately since multiple courses exist per term. |
| **Section** | Represents individual sections (CRN) of a course. | `CRN` | `course_id (FK)`, `term_name (FK)`, `instructor`, `meeting_time`, `location`, `delivery_mode` | N–1: Section → Course; 1–N(opt): Section → Post/Team | Contains instructor/time info, hence not an attribute of Course. |
| **User** | Authenticated student profile (via NetID). | `UID` | `netid (unique)`, `email`, `display_name`, `avatar_url`, `created_at`, `updated_at` | 1–N: User → Post/MatchRequest; N–M: User ↔ Team; 1–N: User → user_skill | Central participant in all social interactions. |
| **Skill** | Standardized skill tag vocabulary. | `id` | `name (unique)`, `category` | 1–N: Skill → user_skill | Enables skill-based matching. |
| **user_skill** | Junction table for User–Skill association. | `(user_id, skill_id)` | `level` | N–1: → User; N–1: → Skill | Captures proficiency; implements N–M. |
| **Post** | Teammate-seeking ad within term/course/section. | `post_id` | `user_id (FK)`, `term_name (FK)`, `section_id (FK)`, `title`, `content`, `skills (FK)`, `team_id (FK)`, `created_at`, `updated_at` | N–1: → User/Term/Section; 1–N: → Match_request/Comment | Core activity entity enabling discovery. |
| **Team** | Group of students forming a project team. | `team_id` | `term_id (FK)`, `course_id (FK)`, `section_id (FK,opt)`, `target_size`, `notes`, `status`, `created_at`, `updated_at` | N–1: → Term/Course/Section; 1–N: → team_member/Match_request | Tracks membership & capacity. |
| **team_member** | Junction table for Team–User linkage. | `(team_id, user_id)` | `role`, `joined_at` | N–1: → Team; N–1: → User | Implements N–M Team–User relation. |
| **Match_request** | Contact/join workflow between users and teams. | `id` | `from_user_id (FK)`, `to_user_id (XOR FK)`, `to_team_id (XOR FK)`, `post_id (FK)`, `status`, `created_at` | N–1: → User/Team/Post (dep. on target) | Supports request/accept/reject logic. |
| **Comment** | Threaded discussion under posts. | `id` | `post_id (FK)`, `user_id (FK)`, `parent_comment_id (FK,opt)`, `content`, `status`, `created_at`, `updated_at` | N–1: → Post/User; 1–N: → self(replies) | Supports hierarchical replies. |


### 2.2 Relationships & Cardinalities
- Term (1) — (N) Course: description, optionality, rationale
- Course (1) — (N) Section: ...
- User (1) — (N) Post: ...
- Team (N) — (M) User via TeamMember: ...
- User (N) — (M) Skill via UserSkill: ...
- MatchRequest: User→User / User→Team (XOR): ...
- (Any other relationships you draw on the ERD)

## 3. Normalization (3NF / BCNF)
- Functional dependencies & keys: give for 4–6 core tables
- Decomposition steps (if any) and why
- Proof or argument each table is in 3NF/BCNF (or justified denormalization)
- Summary table: which NF each table satisfies

## 4. Logical Design — Relational Schema (not SQL)
- One line per table using: Table(col:Domain [PK], col:Domain [FK to t.c], ...)
- Cover all tables present in ERD

## 5. Appendix
- Mapping notes (ER→Relational)
- Terminology (ENUM domain values)
