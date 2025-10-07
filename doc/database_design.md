# PT1 Stage 2 — Conceptual & Logical Database Design

<p align="left">
    <img src="./img_src/label.png" alt="label Diagram"
        style="width:300px; height:auto; max-width:30%;">
</p>

# 1. ER Model design

## 1.1 Entities

---

### **Term**

Represents an academic term (e.g., *Spring 2025*). It serves as the top-level grouping for all courses, sections, posts, and teams, providing a consistent temporal scope for filtering and organization.

**Attributes**
- **term_id (PK)** — Unique identifier for a term.
- **name** — Human-readable label (e.g., “Spring 2025”).
- **start_date** — Beginning date of the term.
- **end_date** — Ending date of the term.

---

### **Course**

Represents a specific course offered within a term (e.g., *sp25CS411*). The `course_id` encodes both the subject and term for uniqueness, while `term_id (FK)` keeps an explicit relational link for joins and normalization.

**Attributes**
- **course_id (PK)** — Unique course key including term information (e.g., “sp25CS411”).
- **term_id (FK)** — References the term the course belongs to.
- **subject** — Department or subject code (e.g., “CS”).
- **number** — Course number (e.g., 411).
- **title** — Official course title.
- **credits** — Credit hours assigned to the course.

---

### **Section** *(Weak Entity)*

Represents a specific section of a course, including its instructor, time, and meeting location. It is modeled as a weak entity since its identity depends on the parent `Course`.

**Attributes**
- **CRN (PK)** — Course Registration Number (section identifier).
- **course_id (FK, PK)** — References the parent course; part of the composite key.
- **instructor** — Instructor name(s).
- **meeting_time** — Time schedule string (e.g., “MWF 10:00–10:50 AM”).
- **location** — Meeting place (building, room, or online).
- **delivery_mode** — Instruction mode (In-person / Online / Hybrid).

---

### **User**

Represents an authenticated student with a UIUC NetID and editable public profile. Users can author posts, join teams, and manage their skills.

**Attributes**
- **user_id (PK)** — Unique user identifier.
- **netid** — Campus NetID for authentication.
- **email** — Email contact.
- **phone_number** — Optional phone contact.
- **display_name** — User’s chosen display name.
- **avatar_url** — URL to the profile image.
- **bio** — Short personal introduction.
- **score** — Reputation or participation score.
- **major** — Academic major.
- **grade** — Academic level or year.

---

### **Team**

Represents a project or study group created within a course or section. Teams maintain size limits, status, and membership, enabling structured team management.

**Attributes**
- **team_id (PK)** — Unique team identifier.
- **course_id (FK)** — Related course context.
- **section_id (FK)** — Related section context, optional.
- **team_name** — Display name of the team.
- **target_size** — Intended maximum number of members.
- **notes** — Free-form team description or notes.
- **status** — Team’s lifecycle state (e.g., open, locked, full, closed).
- **created_at** — Creation timestamp.
- **updated_at** — Last modification timestamp.

---

### **Skill**

Defines a normalized vocabulary of skills that users can claim or that posts can require. Having skills as an entity ensures consistency and supports filtering/matching.

**Attributes**
- **skill_id (PK)** — Unique skill identifier.
- **name** — Name of the skill (unique).
- **category** — Optional category or classification.

---

### **Post**

Represents a public teammate-seeking post created by a user, optionally linked to a team or section. Posts are searchable and serve as the main interaction unit.

**Attributes**
- **post_id (PK)** — Unique identifier for the post.
- **user_id (FK)** — Authoring user.
- **team_id (FK)** — Linked team (optional).
- **title** — Title of the post.
- **content** — Detailed description or requirements.
- **created_at** — Creation timestamp.
- **updated_at** — Last modification timestamp.

---

### **Comment**

Represents threaded discussions under posts. A self-referencing `parent_comment_id` supports nested comment hierarchies and moderation.

**Attributes**
- **comment_id (PK)** — Unique identifier for the comment.
- **post_id (FK)** — Associated post.
- **user_id (FK)** — Comment author.
- **parent_comment_id (FK self)** — Parent comment reference for nesting (nullable).
- **content** — Comment text.
- **status** — Visibility status (visible, hidden, deleted).
- **created_at** — Creation timestamp.
- **updated_at** — Last modification timestamp.

---

### **Match_request**

Represents a join or contact request from a user to a team, optionally referencing a related post. Although conceptually a relationship, it is modeled as an entity to store its own attributes (status, message, timestamps).

**Attributes**
- **request_id (PK)** — Unique request identifier.
- **from_user_id (FK)** — Sender of the request.
- **to_team_id (FK)** — Target team.
- **post_id (FK)** — Source post context (optional).
- **status** — Request state (pending, accepted, rejected, withdrawn).
- **message** — Optional message body.
- **created_at** — Creation timestamp.

---

## 1.2 Relationships & Cardinalities

### A) Posts & Comments

#### **User — Post (1–M)**
**Assumptions & Rationale**  
A user authors posts to recruit teammates. Each post has exactly one author; a user can author many posts.

- **Cardinality:** 1 (User) — M (Post)
- **Participation:** **Post** side mandatory (every post must have an author); **User** side optional per row (a user may have zero posts)
- **Keys involved:** `Post.user_id (FK)` → `User.user_id (PK)`
- **Notes/Constraints:** Author cannot be changed without updating the FK.

#### **Team — Post (1–M)**
**Assumptions & Rationale**  
Every post is associated with one team (e.g., recruiting into a specific team), while a team can have multiple posts across time.

- **Cardinality:** 1 (Team) — M (Post)
- **Participation:** **Post** side mandatory; **Team** side optional per row
- **Keys involved:** `Post.team_id (FK)` → `Team.team_id (PK)`
- **Notes/Constraints:** Enforces single-team context per post.

#### **Post — Comment (1–M)**
**Assumptions & Rationale**  
Comments belong to a single post; a post can have many comments.

- **Cardinality:** 1 (Post) — M (Comment)
- **Participation:** **Comment** side mandatory; **Post** side optional per row
- **Keys involved:** `Comment.post_id (FK)` → `Post.post_id (PK)`
- **Notes/Constraints:** Deleting/archiving a post should hide or cascade per policy.

#### **User — Comment (1–M)**
**Assumptions & Rationale**  
A user writes comments; each comment has exactly one author.

- **Cardinality:** 1 (User) — M (Comment)
- **Participation:** **Comment** side mandatory; **User** side optional per row
- **Keys involved:** `Comment.user_id (FK)` → `User.user_id (PK)`
- **Notes/Constraints:** Supports moderation and audit trails.

#### **Comment — Comment (1–M)**
**Assumptions & Rationale**  
Nested/threaded comments: a comment may reply to a single parent; a parent can have many replies.

- **Cardinality:** 1 (Parent Comment) — M (Child Comments)
- **Participation:** **Child** mandatory; **Parent** optional (top-level comments have `NULL parent_comment_id`)
- **Keys involved:** `Comment.parent_comment_id (FK self)` → `Comment.comment_id (PK)`
- **Notes/Constraints:** Depth constraints (if any) are handled at the application layer.

---

### B) University Enrollments

#### **Term — Course (1–M)**
**Assumptions & Rationale**  
Courses are offered in specific academic terms; a term includes many courses.

- **Cardinality:** 1 (Term) — M (Course)
- **Participation:** **Course** side mandatory; **Term** side optional per row
- **Keys involved:** `Course.term_id (FK)` → `Term.term_id (PK)`
- **Notes/Constraints:** Matches source catalog structure.

#### **Course — Section (1–M)**
**Assumptions & Rationale**  
A course has multiple sections; each section belongs to exactly one course.

- **Cardinality:** 1 (Course) — M (Section)
- **Participation:** **Section** side mandatory; **Course** side optional per row
- **Keys involved:** `Section.course_id (FK, PK component)` → `Course.course_id (PK)`
- **Notes/Constraints:** Section uses composite identity per design (`CRN` + `course_id`).

#### **Section — Team (1–M)**
**Assumptions & Rationale**  
Teams can be tied to a specific section; a section can host many teams.

- **Cardinality:** 1 (Section) — M (Team)
- **Participation:** **Team** side mandatory; **Section** side optional per row
- **Keys involved:** `Team.section_id (FK)` → `Section.course_id/CRN` (per entity definition `section_id/CRN+course_id`)
- **Notes/Constraints:** Ensures team context aligns with section scheduling.

#### **Course — Team (1–M)**
**Assumptions & Rationale**  
Each team is associated with one course; a course can have many teams.

- **Cardinality:** 1 (Course) — M (Team)
- **Participation:** **Team** side mandatory; **Course** side optional per row
- **Keys involved:** `Team.course_id (FK)` → `Course.course_id (PK)`
- **Notes/Constraints:** Coexists with Section–Team for finer scoping.

---

### C) Match Request

#### **User — Match_request (1–M)**
**Assumptions & Rationale**  
A user can send multiple match requests; each request has exactly one sender.

- **Cardinality:** 1 (User) — M (Match_request)
- **Participation:** **Match_request** side mandatory; **User** side optional per row
- **Keys involved:** `Match_request.from_user_id (FK)` → `User.user_id (PK)`
- **Notes/Constraints:** Sender is immutable after creation.

#### **Team — Match_request (1–M)**
**Assumptions & Rationale**  
Requests target a specific team; a team can receive many requests.

- **Cardinality:** 1 (Team) — M (Match_request)
- **Participation:** **Match_request** side mandatory; **Team** side optional per row
- **Keys involved:** `Match_request.to_team_id (FK)` → `Team.team_id (PK)`
- **Notes/Constraints:** Team inbox is derived by filtering on this FK.

#### **Post — Match_request (0..1 – M)**
**Assumptions & Rationale**  
A request may reference the originating post for context (optional); a post can have many associated requests.

- **Cardinality:** 0..1 (Post) — M (Match_request)
- **Participation:** **Match_request** side optional (reference may be NULL); **Post** side optional per row
- **Keys involved:** `Match_request.post_id (FK)` → `Post.post_id (PK)`
- **Notes/Constraints:** Useful for analytics/audit; not required for workflow execution.

---

### D) Relationship Sets (N–M)

> These are modeled conceptually as relationships with attributes (if any) and are implemented as junction tables.

#### **User — Team (M–M) via `team_member`**
**Assumptions & Rationale**  
Users can join many teams; teams have multiple members. Membership has attributes (role, joined_at).

- **Cardinality:** M (User) — M (Team)
- **Participation:** Both sides optional per row
- **Keys involved:** `team_member.team_id (FK)`, `team_member.user_id (FK)`; composite key `(team_id, user_id)` (implied)
- **Notes/Constraints:** `roles`, `joined_at` belong to the relationship.

#### **User — Skill (M–M) via `user_skill`**
**Assumptions & Rationale**  
A user can hold multiple skills; a skill can be held by many users.

- **Cardinality:** M (User) — M (Skill)
- **Participation:** Both sides optional per row
- **Keys involved:** `user_skill.user_id (FK)`, `user_skill.skill_id (FK)`; composite key `(user_id, skill_id)` (implied)
- **Notes/Constraints:** `level` is an attribute of the relationship.

#### **Post — Skill (M–M) via `post_skill`**
**Assumptions & Rationale**  
A post can require multiple skills; a skill can be required by many posts.

- **Cardinality:** M (Post) — M (Skill)
- **Participation:** Both sides optional per row
- **Keys involved:** `post_skill.post_id (FK)`, `post_skill.skill_id (FK)`; composite key `(post_id, skill_id)` (implied)
- **Notes/Constraints:** Keeps `Post` in 1NF; supports filtering and matching.


### 1.3 ER diagram

## 2. Normalization (3NF / BCNF)


## 3. Logical Design — Relational Schema


## 4. Appendix

