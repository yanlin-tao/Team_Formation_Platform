# TEAMUP! UIUC!

<p align="left">
    <img src="./img_src/label.png" alt="label Diagram"
        style="width:300px; height:auto; max-width:30%;">
</p>

**Repository:** `fa25-cs411-team001-SQLMaster`

---

## Team Members
- Ning Wei -ningwei3
- Jack Jiang -jackj6
- Lixuan Gu -lixuang2
- Yanlin Tao -tao17

---

# I. Project Summary
Team Up! UIUC! is a course-based teammate finder organized by term, course and section web platform for University of Illinois students to efficiently connect and form project teams within their classes. Organized by semester, course, and section, it allows users to post or search for teammates based on skills, availability, and preferences. Beyond simple posting, the platform supports team management, enabling students to track team formation progress and join groups that match their strengths. We hope our platform will create a collaborative and efficient environment for students to have better communication with peers and a more positive experience on classes and interesting projects. 

---

# II. Description
Motivated by students’ common concern—“I want to find good project teammates in my class”—our application addresses a recurring problem at UIUC: the difficulty of finding and organizing project teammates within the same course section. TeamUp! UIUC! provides a centralized, course-based teammate finder where students can create and browse posts by term, course, and section, filter by personal preferences on skills, availability and group work habits, and track team status throughout the formation process. By offering organized posts, personal profiles, and a progress tracker, the platform makes team formation more transparent and efficient.

On the technical side, the frontend is implemented in React and JavaScript for a clear user interface, while the backend uses Python to handle authentication, post and team lifecycle management, and join requests. Data is stored in MySQL to support our featured functions. Together, this system helps students with the current team formation concerns. 

---

# III. Usefulness

# IV. Creative Component

# V. Data Sources

**Source A — Real (Primary): UIUC Course Catalog / Schedule (Spring 2025)**  
- **Provenance.** Exported last term from the UIUC catalog/schedule dataset (collected via STAT107 course resources), covering *all* Spring 2025 offerings.  
- **Format.** CSV (originally from JSON), with rich section-level details.  
- **Fields captured (partial).** `Year`, `Term`, `YearTerm`, `Subject`, `Number`, `Name`, `Description`, `Credit Hours`, `Section Info`, `Degree Attributes`, `Schedule Information`, `CRN`, `Section`, `Status Code`, `Part of Term`, `Section Title`, `Section Credit Hours`, `Section Status`, `Enrollment Status`, `Type`, `Type Code`, `Start Time`, `End Time`, `Days of Week`, `Room`, `Building`, `Instructors`.  
- **Cardinality (rows).** **12,000+ rows** (≥ 1k requirement satisfied by *real* data).  
- **Degree (columns).** ≈ 26+ columns.  
- **Use in our app.** This is the authoritative real source for our **Term / Course / Section** backbone and for search/filter metadata in the course spaces (e.g., instructor, meeting time, delivery mode).  
- **Refresh & snapshots.** We treat Spring 2025 as a **frozen snapshot** for Stage 1/2; subsequent terms can be added as additional snapshots. We will keep the raw CSV in `data/raw/` and a normalized export in `data/processed/`.

## Data Preview

📁 **[View Full Dataset: `course-catalog.csv`](../data/course-catalog.csv)** *(12,000+ rows)*

Below is a sample of our real course catalog data showing the structure and content we're working with:

<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-size: 0.9em;">

| Year | Term | Subject | Number | Name | Credit Hours | CRN | Section | Type | Start Time | End Time | Days | Room | Building | Instructors |
|------|------|---------|--------|------|--------------|-----|---------|------|------------|----------|------|------|----------|-------------|
| 2025 | Spring | AAS | 100 | Intro Asian American Studies | 3 hours | 69781 | AB | Lecture-Discussion | 02:00 PM | 03:20 PM | MW | 304 | Noyes Laboratory | Geng, C |
| 2025 | Spring | AAS | 100 | Intro Asian American Studies | 3 hours | 30107 | AD1 | Discussion/Recitation | 09:00 AM | 09:50 AM | F | 1030 | Literatures, Cultures, & Ling | Siglos, D;Wang, Y |
| 2025 | Spring | AAS | 100 | Intro Asian American Studies | 3 hours | 41729 | AD2 | Discussion/Recitation | 10:00 AM | 10:50 AM | F | 1030 | Literatures, Cultures, & Ling | Siglos, D;Wang, Y |
| 2025 | Spring | AAS | 200 | U.S. Race and Empire | 3 hours | 64396 | A | Lecture-Discussion | 12:30 PM | 01:50 PM | TR | 148 | Armory | Sawada, E |
| 2025 | Spring | AAS | 201 | US Racial & Ethnic Politics | 3 hours | 66639 | OL1 | Online | ARRANGED | ARRANGED | - | - | - | Lee, Y |

</div>

**Source B — Synthetic (Development/Test): Users & Activity (Posts / Teams / MatchRequests / Comments)**  
- **Why synthetic.** Actual enrollment/teaming and user-generated posts are private; before public launch we have no real user content.  
- **What we generate.**  
  - `user` (NetID-like ids, display_name, bio),  
  - `post` (course-scoped teammate-seeking posts),  
  - `team` and `team_member` (capacity-driven teams),  
  - `match_request` (user↔user or user↔team requests),  
  - `comment` (threaded discussions, optional).  
- **Format.** CSV/JSON seed files ingested via scripts; we will tag these rows with a **seed batch id** and/or set a **`provenance = 'synthetic'`** flag (app-level) to keep them clearly separated from real data.  
- **Planned volume (for testing).** e.g., ~1,500–2,000 posts, ~800–1,200 teams, ~3,000+ match requests, balanced across multiple subjects/sections to exercise search, pagination, and capacity logic. *(Exact counts are configurable; real ≥1k is already satisfied by Source A.)*  
- **Scope limitation.** Synthetic data is **dev/demo only** and will not be mixed with real production user content.

---

# VI. Data Model

| Entity | Purpose | Key Attributes | Primary Relationships |
|---|---|---|---|
| **Term** | Academic term; scopes courses, posts, and teams. | id (PK)<br>code<br>name<br>start_date<br>end_date<br>created_at<br>updated_at | **1–N:** Term → Course<br>**1–N:** Term → Post<br>**1–N:** Term → Team |
| **Course** | Course instance within a term (e.g., CS 411). | id (PK)<br>term_id (FK→Term.id)<br>subject<br>number<br>title<br>credits<br>created_at<br>updated_at | **N–1:** Course → Term<br>**1–N:** Course → Section<br>**1–N:** Course → Post<br>**1–N:** Course → Team |
| **Section** | Specific section/instructor/time slot of a course. | id (PK)<br>course_id (FK→Course.id)<br>CRN (unique, opt)<br>section_code<br>instructor<br>meeting_json<br>location<br>delivery_mode<br>created_at<br>updated_at | **N–1:** Section → Course<br>**1–N (opt):** Section → Post<br>**1–N (opt):** Section → Team |
| **User** | NetID-authenticated student profile (public, voluntary info only). | id (PK)<br>netid (unique)<br>email (unique, opt)<br>display_name<br>bio<br>avatar_url<br>is_active<br>created_at<br>updated_at | **1–N:** User → Post (author)<br>**1–N:** User → Team (as owner via owner_user_id)<br>**1–N:** User → MatchRequest (as sender)<br>**1–N:** User → MatchRequest (as target user)<br>**1–N:** User → Comment<br>**1–N:** User → Endorsement (sent)<br>**1–N:** User → Endorsement (received)<br>**1–N:** User → UserSkill<br>**1–N:** User → TeamMember (membership rows)<br>**N–M:** User ↔ Team (via TeamMember) |
| **Skill** | Normalized skill vocabulary for profiles/search. | id (PK)<br>name (unique)<br>created_at | **1–N:** Skill → UserSkill<br>**1–N:** Skill → Endorsement |
| **UserSkill** | Junction linking users to skills (optional level). | user_id (FK→User.id)<br>skill_id (FK→Skill.id)<br>level (opt)<br>created_at | **N–1:** UserSkill → User<br>**N–1:** UserSkill → Skill<br>**Implements N–M:** User ↔ Skill |
| **Post** | Teammate-seeking post within a term/course (section optional). | id (PK)<br>user_id (FK→User.id)<br>term_id (FK→Term.id)<br>course_id (FK→Course.id)<br>section_id (FK→Section.id, opt)<br>title<br>content<br>roles_json<br>target_team_size<br>status (ENUM: PostStatus)<br>visibility (ENUM: Visibility)<br>created_at<br>updated_at | **N–1:** Post → User<br>**N–1:** Post → Term<br>**N–1:** Post → Course<br>**N–1 (opt):** Post → Section<br>**1–N:** Post → MatchRequest (referenced by post_id)<br>**1–N:** Post → Comment |
| **Team** | Recruiting/formed team with capacity & status. | id (PK)<br>owner_user_id (FK→User.id)<br>term_id (FK→Term.id)<br>course_id (FK→Course.id)<br>section_id (FK→Section.id, opt)<br>target_size<br>notes<br>status (ENUM: TeamStatus)<br>created_at<br>updated_at | **N–1:** Team → User (owner)<br>**N–1:** Team → Term<br>**N–1:** Team → Course<br>**N–1 (opt):** Team → Section<br>**1–N:** Team → TeamMember<br>**1–N:** Team → MatchRequest (as target team)<br>**N–M:** Team ↔ User (via TeamMember) |
| **TeamMember** | Junction linking users to teams (role, joined time). | team_id (FK→Team.id)<br>user_id (FK→User.id)<br>role (opt)<br>joined_at | **N–1:** TeamMember → Team<br>**N–1:** TeamMember → User<br>**Implements N–M:** Team ↔ User |
| **MatchRequest** | Contact/join workflow (User→User **or** User→Team). | id (PK)<br>from_user_id (FK→User.id)<br>to_user_id (FK→User.id, XOR)<br>to_team_id (FK→Team.id, XOR)<br>post_id (FK→Post.id, opt)<br>message (opt)<br>status (ENUM: MatchRequestStatus)<br>created_at<br>decision_at (opt)<br>expires_at (opt) | **N–1:** MatchRequest → User (sender)<br>**N–1 (XOR):** MatchRequest → User (target user)<br>**N–1 (XOR):** MatchRequest → Team (target team)<br>**N–1 (opt):** MatchRequest → Post |
| **Comment** | Threaded discussion under posts (optional nesting). | id (PK)<br>post_id (FK→Post.id)<br>user_id (FK→User.id)<br>parent_comment_id (self-FK, opt)<br>content<br>status (visible/hidden/deleted)<br>created_at<br>updated_at | **N–1:** Comment → Post<br>**N–1:** Comment → User<br>**1–N:** Comment (parent) → Comment (replies) |
| **Endorsement** | Lightweight skill endorsement between users. | id (PK)<br>from_user_id (FK→User.id)<br>to_user_id (FK→User.id)<br>skill_id (FK→Skill.id)<br>note (opt)<br>created_at | **N–1:** Endorsement → User (from)<br>**N–1:** Endorsement → User (to)<br>**N–1:** Endorsement → Skill |


## Entity–Relationship Diagram

<p align="center">
    <img src="./img_src/entity_relation.png" alt="ER Diagram"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 1. ER Diagram</em>
</p>

---

# VII. Functionality 

## 1. Roles & Permissions
- **Student (NetID-authenticated)**: Navigate by term/course/section; create/browse/search posts; send/receive join requests; create/manage teams; edit profile (skills, availability); comment (optional); bookmark (optional).
- **Team Owner**: Everything a Student can do **plus** lock/close team, remove members, adjust target size, manage role needs (optional).
- **System (ETL/Service)**: Sync public **Term/Course/Section** data; run background jobs (capacity/status updates, request expiry).

---

## 2. Feature List 

### A) Discover & Navigate
- **Term → Course → Section** navigation to see the space’s Posts and Teams.
- **Search/Filter**: keyword (title/content), skill tags, status (open/locked), remaining slots, recency (updated_at), optionally by section.
- **Course/Section info**: title, instructor, meeting times (from official data).

### B) Posts 
- **Create**: Student creates one active post within a term/course (section optional).
- **Read**: List & detail views (title, content, skills, target size, author summary).
- **Update**: Author edits title/content/skills, switches `open/locked`, or archives.
- **Delete**: Author deletes or archives; archived posts are hidden from default lists.

### C) Teams
- **Create**: From a post or standalone; set `target_size` and notes.
- **Read**: Show members, open slots (`target_size - current_members`), status (`open/locked/full/closed`).
- **Update**: Owner locks/unlocks, changes target size/notes; membership changes trigger **auto-full** when capacity is reached.
- **Delete/Close**: Owner closes (`closed`); hard delete only in dev—production uses close.

### D) Membership 
- **Add**: Accept a request or invite approved user into the team.
- **Read**: Team page lists members & roles.
- **Update**: Owner edits a member’s role (FE/BE/PM…).
- **Delete**: Owner removes member; member can leave team.

### E) Match Requests 
- **Create**: **User→User** or **User→Team** (XOR target), with optional message and source post reference.
- **Read**: Inbox (received) and Sent boxes; filter by status/time, paginated.
- **Update**: Target **accept/reject**; sender **withdraw**; system **expire**.
- **Delete**: No hard delete; state transitions to `withdrawn/expired` (audit trail).
- **Side-effects**: `accepted` → auto-add to `TeamMember` and notify both sides.

### F) Profiles 
- **Create**: First login initializes a user profile.
- **Read**: Author cards on posts; full profile page for self/others (public fields only).
- **Update**: Edit `display_name`, `bio`, `avatar` (opt); manage **UserSkill** and **AvailabilityBlock**.
- **Deactivate**: Soft-deactivate (hide public info, keep history).

### G) Comments, Bookmarks, Notifications
- **Comments**: Threaded discussion under posts; author/admin may hide/delete.
- **Bookmarks**: Save posts or teams for quick access.
- **Notifications**: In-app alerts for new requests, accepted/rejected, team full, etc.

---

## 3. CRUD Matrix

### Posts
| Actor | Action | Data | When (intent) | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| Student | **Create** | Post | Wants to find teammates in a course | `term_id`, `course_id`, `(section_id)`, `title`, `content`, `skills[]`, `target_team_size` | ≤1 active post per `(user, term, course[, section])`; title required; length limits | Create `PostSkill`; optional notifications |
| Any | **Read** | Post | Browse/search | filters: term/course/section/status/skills/q, sort | Respect visibility | — |
| Author | **Update** | Post | Edit info/status | title/content/skills/visibility/status | State machine: `open↔locked`, `→ archived` | Bumps `updated_at` |
| Author | **Delete/Archive** | Post | No longer recruiting | — | Prefer archive (soft) | Hidden from default lists |

### Teams & Membership
| Actor | Action | Data | When | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| Student | **Create** | Team | Forms a team | `term_id`, `course_id`, `(section_id)`, `target_size`, `notes` | `target_size` ∈ [1,10] | Initial member = owner; status `open` |
| Any | **Read** | Team | Browse | filters: term/course/section/status | — | Show `open_slots`, members |
| Owner | **Update** | Team | Lock/unlock, resize | `target_size`/`status`/`notes` | `status` ∈ {open, locked, full, closed} | Hitting capacity → `full` |
| Owner | **Delete/Close** | Team | Ends or moves off-platform | — | Prefer `closed`; hard delete only in dev | Remove members or preserve history |
| Owner | **Add** | TeamMember | Accept/invite success | `user_id`, `role` | Unique `(team_id, user_id)`; team not full | `open_slots--`; may set `full` |
| Owner/Member | **Delete** | TeamMember | Kick/leave | `user_id` | Owner cannot self-kick without transfer/close | `open_slots++`; may reopen if was `full` |

### Match Requests
| Actor | Action | Data | When | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| Student | **Create** | MatchRequest | Initiate contact | `from_user_id`, `(to_user_id XOR to_team_id)`, `message`, `post_id?` | XOR target; de-duplicate identical pending (app-level) | Notify target |
| Target | **Update** | MatchRequest | Accept/Reject | `status=accepted|rejected` | Only target may decide | `accepted` → add `TeamMember` |
| Sender | **Update** | MatchRequest | Withdraw | `status=withdrawn` | Only sender may withdraw | Notify target |
| System | **Update** | MatchRequest | Expire | `status=expired` | `expires_at` passed | Hide from default inbox views |
| Any | **Read** | MatchRequest | Inbox/Sent | filters: status/time | — | — |

### Profiles
| Actor | Action | Data | When | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| System | **Create** | User | First login | `netid`, `email?` | `netid` unique | Initialize empty profile |
| User | **Update** | User | Edit profile | `display_name`, `bio`, `avatar_url` | Format/length checks | Updates author card |
| User | **Upsert** | UserSkill | Maintain skills | `skills[]`, `level?` | Unique `(user_id, skill_id)` | Enables filtering & match explainability |
| User | **Upsert** | AvailabilityBlock | Maintain availability | `day_of_week`, `start_min`, `end_min` | Valid range; merge overlaps | Drives availability hints |
| Any | **Read** | User/Profile | View self/others | `user_id` | Show public fields only | Used in post/team cards |

---

## 4. Search / Filter / Sort 
- **Posts list**: filter by `term_id`, `course_id`, `(section_id?)`, `status=open`, `skills[]`, `q`; sort by `updated_at DESC`; paginate.
- **Teams list**: filter by `term_id`, `course_id`, `(section_id?)`, `status IN (open, locked)`, `open_slots > 0`; sort by `updated_at DESC`.
- **Inbox**: `to_user_id` **or** `to_team_id` + `status IN (pending)` + `created_at DESC`; paginate.
- **Members view**: `team_id` join `TeamMember` → user cards with roles.

---

# VIII. UI Mockups

Our Team Up! platform gives students a simple way to find teammates. The left menu has main tools like notifications, search, direct messages (DMs), My Courses, and My Teams, so students can quickly reach what they need.

<p align="center">
    <img src="./img_src/entry.png" alt="UI Diagram"
        style="width:60%; height:auto; max-width:100%;">
       <br><em>Figure 2. entry page </em>
</p>

At the top, a large search bar lets students look up courses by name or code, or browse by course tags. Below, popular posts are shown with team requests and view counts. Students can open these posts to learn more and send a join request or message.

<p align="center">
    <img src="./img_src/post.png" alt="UI Diagram"
        style="width:60%; height:auto; max-width:100%;">
       <br><em>Figure 3. post page </em>
</p>

The "Course Section" page is for working within one class. Students can filter posts by skills, time, or role, and see posts ranked by best match. They can also create new posts for assignments. This setup is more than just posting and replying—it supports profiles, skill filters, and reputation-based teamwork.

<p align="center">
    <img src="./img_src/profile.png" alt="UI Diagram"
        style="width:60%; height:auto; max-width:100%;">
       <br><em>Figure 4. profile page </em>
</p>

On the "Profile" page, students can list their courses, skills, groups, and add a short description with a reputation score. They can edit skills, manage groups, and share their profile, which makes teaming more open and fair.

---

# IX. Architecture & APIs

### Frontend
- Built with React and JavaScript.
- Lets students browse courses, make posts, join teams, and manage applications.
- Talks to the backend using REST APIs.

### Backend
- Built with FastAPI (Python).
- Handles main logic like login, posts, teams, and applications.
- Calculates match scores and gives APIs for the frontend.

### Database
- Uses MySQL 8 to keep data such as Users, Courses, Sections, Posts, Teams, Applications, Skills, and Availability.
- Keeps data linked, supports filters, and powers the matching system.

### Deployment
- Runs in Docker for easy setup.
- Uses Docker Compose locally and AWS/Render in the cloud.
- GitHub Actions pipeline for tests and auto builds.

### Main APIs

#### Auth APIs
- Login with NetID (SSO) and create JWT tokens for sessions.

#### Course & Section APIs
- Get semesters, courses, and sections.
- Manage student enrollments.

#### Profile APIs
- Edit skills, role choices, time slots, and self-intro.

#### Post & Search APIs
- Make or update team-finding posts.
- Search/filter by course, section, skill, date, or time.

#### Team APIs
- Form and manage teams.
- Add members, set team size, and auto-close when full.

#### Application APIs
- Send and track join requests.
- Approve, reject, or cancel requests.


# X. Project Work Distribution
