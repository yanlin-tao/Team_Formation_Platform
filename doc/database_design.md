# PT1 Stage 2 — Conceptual & Logical Database Design

<p align="left">
    <img src="./img_src/label.png" alt="label Diagram"
        style="width:300px; height:auto; max-width:30%;">
</p>

# 1. ER Model design

## 1.1 Entities

---

### **Term**

**Assumptions & Rationale**  
Represents an academic term (e.g., *Spring 2025*). It serves as the top-level grouping for all courses, sections, posts, and teams, providing a consistent temporal scope for filtering and organization.

**Attributes**
- **term_id (PK)** — Unique identifier for a term.
- **name** — Human-readable label (e.g., “Spring 2025”).
- **start_date** — Beginning date of the term.
- **end_date** — Ending date of the term.

---

### **Course**

**Assumptions & Rationale**  
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

**Assumptions & Rationale**  
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

**Assumptions & Rationale**  
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

**Assumptions & Rationale**  
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

**Assumptions & Rationale**  
Defines a normalized vocabulary of skills that users can claim or that posts can require. Having skills as an entity ensures consistency and supports filtering/matching.

**Attributes**
- **skill_id (PK)** — Unique skill identifier.
- **name** — Name of the skill (unique).
- **category** — Optional category or classification.

---

### **Post**

**Assumptions & Rationale**  
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

**Assumptions & Rationale**  
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

**Assumptions & Rationale**  
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



### 1.3 ER diagram

## 2. Normalization (3NF / BCNF)


## 3. Logical Design — Relational Schema


## 4. Appendix

