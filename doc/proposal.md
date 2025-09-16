# 6. Functionality (What the website delivers & how users interact)

## 6.1 Roles & Permissions
- **Student (NetID-authenticated)**: Navigate by term/course/section; create/browse/search posts; send/receive join requests; create/manage teams; edit profile (skills, availability); comment (optional); bookmark (optional).
- **Team Owner**: Everything a Student can do **plus** lock/close team, remove members, adjust target size, manage role needs (optional).
- **System (ETL/Service)**: Sync public **Term/Course/Section** data; run background jobs (capacity/status updates, request expiry).

---

## 6.2 Feature List (clear list of functionality)

### A) Discover & Navigate
- **Term → Course → Section** navigation to see the space’s Posts and Teams.
- **Search/Filter**: keyword (title/content), skill tags, status (open/locked), remaining slots, recency (updated_at), optionally by section.
- **Course/Section info**: title, instructor, meeting times (from official data).

### B) Posts (teammate-seeking ads)
- **Create**: Student creates one active post within a term/course (section optional).
- **Read**: List & detail views (title, content, skills, target size, author summary).
- **Update**: Author edits title/content/skills, switches `open/locked`, or archives.
- **Delete**: Author deletes or archives; archived posts are hidden from default lists.

### C) Teams (capacity & lifecycle)
- **Create**: From a post or standalone; set `target_size` and notes.
- **Read**: Show members, open slots (`target_size - current_members`), status (`open/locked/full/closed`).
- **Update**: Owner locks/unlocks, changes target size/notes; membership changes trigger **auto-full** when capacity is reached.
- **Delete/Close**: Owner closes (`closed`); hard delete only in dev—production uses close.

### D) Membership (TeamMember)
- **Add**: Accept a request or invite approved user into the team.
- **Read**: Team page lists members & roles.
- **Update**: Owner edits a member’s role (FE/BE/PM…).
- **Delete**: Owner removes member; member can leave team.

### E) Match Requests (contact/join workflow)
- **Create**: **User→User** or **User→Team** (XOR target), with optional message and source post reference.
- **Read**: Inbox (received) and Sent boxes; filter by status/time, paginated.
- **Update**: Target **accept/reject**; sender **withdraw**; system **expire**.
- **Delete**: No hard delete; state transitions to `withdrawn/expired` (audit trail).
- **Side-effects**: `accepted` → auto-add to `TeamMember` and notify both sides.

### F) Profiles (User)
- **Create**: First login initializes a user profile.
- **Read**: Author cards on posts; full profile page for self/others (public fields only).
- **Update**: Edit `display_name`, `bio`, `avatar` (opt); manage **UserSkill** and **AvailabilityBlock**.
- **Deactivate**: Soft-deactivate (hide public info, keep history).

### G) (Optional) Comments, Bookmarks, Notifications
- **Comments**: Threaded discussion under posts; author/admin may hide/delete.
- **Bookmarks**: Save posts or teams for quick access.
- **Notifications**: In-app alerts for new requests, accepted/rejected, team full, etc.

> **Beyond posts & replies (explicitly addressed):**  
> 1) **Team capacity automation** (open slots/full transitions),  
> 2) **Skill-based filters**,  
> 3) **Availability overlap hints** (optional; based on AvailabilityBlock and section meeting times).

---

## 6.3 CRUD Matrix (who does what, when)

### 6.3.1 Posts
| Actor | Action | Data | When (intent) | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| Student | **Create** | Post | Wants to find teammates in a course | `term_id`, `course_id`, `(section_id)`, `title`, `content`, `skills[]`, `target_team_size` | ≤1 active post per `(user, term, course[, section])`; title required; length limits | Create `PostSkill`; optional notifications |
| Any | **Read** | Post | Browse/search | filters: term/course/section/status/skills/q, sort | Respect visibility | — |
| Author | **Update** | Post | Edit info/status | title/content/skills/visibility/status | State machine: `open↔locked`, `→ archived` | Bumps `updated_at` |
| Author | **Delete/Archive** | Post | No longer recruiting | — | Prefer archive (soft) | Hidden from default lists |

### 6.3.2 Teams & Membership
| Actor | Action | Data | When | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| Student | **Create** | Team | Forms a team | `term_id`, `course_id`, `(section_id)`, `target_size`, `notes` | `target_size` ∈ [1,10] | Initial member = owner; status `open` |
| Any | **Read** | Team | Browse | filters: term/course/section/status | — | Show `open_slots`, members |
| Owner | **Update** | Team | Lock/unlock, resize | `target_size`/`status`/`notes` | `status` ∈ {open, locked, full, closed} | Hitting capacity → `full` |
| Owner | **Delete/Close** | Team | Ends or moves off-platform | — | Prefer `closed`; hard delete only in dev | Remove members or preserve history |
| Owner | **Add** | TeamMember | Accept/invite success | `user_id`, `role` | Unique `(team_id, user_id)`; team not full | `open_slots--`; may set `full` |
| Owner/Member | **Delete** | TeamMember | Kick/leave | `user_id` | Owner cannot self-kick without transfer/close | `open_slots++`; may reopen if was `full` |

### 6.3.3 Match Requests
| Actor | Action | Data | When | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| Student | **Create** | MatchRequest | Initiate contact | `from_user_id`, `(to_user_id XOR to_team_id)`, `message`, `post_id?` | XOR target; de-duplicate identical pending (app-level) | Notify target |
| Target | **Update** | MatchRequest | Accept/Reject | `status=accepted|rejected` | Only target may decide | `accepted` → add `TeamMember` |
| Sender | **Update** | MatchRequest | Withdraw | `status=withdrawn` | Only sender may withdraw | Notify target |
| System | **Update** | MatchRequest | Expire | `status=expired` | `expires_at` passed | Hide from default inbox views |
| Any | **Read** | MatchRequest | Inbox/Sent | filters: status/time | — | — |

### 6.3.4 Profiles (User, Skills, Availability)
| Actor | Action | Data | When | Inputs | Validations / Rules | Side-effects |
|---|---|---|---|---|---|---|
| System | **Create** | User | First login | `netid`, `email?` | `netid` unique | Initialize empty profile |
| User | **Update** | User | Edit profile | `display_name`, `bio`, `avatar_url` | Format/length checks | Updates author card |
| User | **Upsert** | UserSkill | Maintain skills | `skills[]`, `level?` | Unique `(user_id, skill_id)` | Enables filtering & match explainability |
| User | **Upsert** | AvailabilityBlock | Maintain availability | `day_of_week`, `start_min`, `end_min` | Valid range; merge overlaps | Drives availability hints |
| Any | **Read** | User/Profile | View self/others | `user_id` | Show public fields only | Used in post/team cards |

> **Optional modules (if included)** — Comments/Bookmarks/Notifications follow the same CRUD pattern: create/read/update(delete)/list with appropriate validations and side-effects.

---

## 6.4 Search / Filter / Sort (typical queries)
- **Posts list**: filter by `term_id`, `course_id`, `(section_id?)`, `status=open`, `skills[]`, `q`; sort by `updated_at DESC`; paginate.
- **Teams list**: filter by `term_id`, `course_id`, `(section_id?)`, `status IN (open, locked)`, `open_slots > 0`; sort by `updated_at DESC`.
- **Inbox**: `to_user_id` **or** `to_team_id` + `status IN (pending)` + `created_at DESC`; paginate.
- **Members view**: `team_id` join `TeamMember` → user cards with roles.
