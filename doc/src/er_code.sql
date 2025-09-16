// TeamUp UIUC — ERD in DBML
// Docs: https://dbml.dbdiagram.io/docs

//////////////////////////////////////////////////////
// Enums
//////////////////////////////////////////////////////
Enum PostStatus {
  open
  locked
  archived
}

Enum TeamStatus {
  open
  locked
  full
  closed
}

Enum MatchRequestStatus {
  pending
  accepted
  rejected
  withdrawn
  expired
}

Enum Visibility {
  public
  course_only
}

Enum DeliveryMode {
  InPerson
  Online
  Hybrid
}

Enum NotificationType {
  request_received
  request_accepted
  request_rejected
  team_full
  team_updated
}

Enum ReportTargetType {
  post
  comment
  team
  user
  match_request
}

Enum ReviewStatus {
  open
  under_review
  resolved
  dismissed
}

//////////////////////////////////////////////////////
// Core: Term / Course / Section
//////////////////////////////////////////////////////
Table term {
  id bigint [pk, note: 'PK']
  code varchar(8) [not null, unique, note: 'e.g., FA25']
  name varchar(32) [not null]
  start_date date
  end_date date
  created_at timestamp
  updated_at timestamp

  Note: 'Academic term; referenced by course/post/team'
}

Table course {
  id bigint [pk]
  term_id bigint [not null, note: 'FK → term.id']
  subject varchar(16) [not null, note: 'e.g., CS']
  number varchar(16) [not null, note: 'e.g., 411']
  title varchar(255) [not null]
  credits tinyint
  created_at timestamp
  updated_at timestamp

  Indexes {
    (term_id, subject, number) [unique, name: 'uq_course_term_subject_number']
    term_id
  }

  Note: 'Course instance within a term'
}

Table section {
  id bigint [pk]
  course_id bigint [not null, note: 'FK → course.id']
  CRN varchar(16) [null, unique]
  section_code varchar(16) [not null, note: 'A / B1 / OL']
  instructor varchar(255)
  meeting_json json [note: 'e.g., [{"day":"WED","start":"14:00","end":"15:20"}]']
  location varchar(64)
  delivery_mode DeliveryMode
  created_at timestamp
  updated_at timestamp

  Indexes {
    (course_id, section_code) [unique, name: 'uq_section_course_code']
    course_id
  }

  Note: 'Course section; may be optional on posts/teams'
}

//////////////////////////////////////////////////////
// Core: User / Skill / UserSkill
//////////////////////////////////////////////////////
Table user {
  id bigint [pk]
  netid varchar(64) [not null, unique]
  email varchar(255) [unique, note: 'optional']
  display_name varchar(255)
  bio text
  avatar_url varchar(512)
  is_active boolean [not null, note: 'default true (app-level)']
  created_at timestamp
  updated_at timestamp

  Note: 'Authenticated student; stores only voluntary public info'
}

Table skill {
  id bigint [pk]
  name varchar(64) [not null, unique]
  created_at timestamp

  Note: 'Normalized skill vocabulary'
}

Table user_skill {
  user_id bigint [not null, note: 'FK → user.id']
  skill_id bigint [not null, note: 'FK → skill.id']
  level tinyint [note: '1..5 optional']
  created_at timestamp

  Indexes {
    (user_id, skill_id) [pk, name: 'pk_user_skill']
    user_id
    skill_id
  }

  Note: 'Junction: User ↔ Skill'
}

//////////////////////////////////////////////////////
// Core: Post / PostSkill
//////////////////////////////////////////////////////
Table post {
  id bigint [pk]
  user_id bigint [not null, note: 'FK → user.id (author)']
  term_id bigint [not null, note: 'FK → term.id']
  course_id bigint [not null, note: 'FK → course.id']
  section_id bigint [note: 'FK → section.id (nullable)']
  title varchar(255) [not null]
  content text
  roles_json json [note: 'desired roles']
  target_team_size tinyint
  status PostStatus [not null, note: 'default open (app-level)']
  visibility Visibility [not null, note: 'default public (app-level)']
  created_at timestamp
  updated_at timestamp

  Indexes {
    (term_id, course_id, section_id, status, updated_at) [name: 'idx_post_scope_status_time']
    user_id
    // optional fulltext depends on target DB
    // (title, content) [type: fulltext, name: 'ft_post_title_content']
  }

  Note: 'Teammate-seeking post; at most one active per (user, term, course[, section])'
}

//////////////////////////////////////////////////////
// Core: Team / TeamMember
//////////////////////////////////////////////////////
Table team {
  id bigint [pk]
  owner_user_id bigint [not null, note: 'FK → user.id (owner)']
  term_id bigint [not null, note: 'FK → term.id']
  course_id bigint [not null, note: 'FK → course.id']
  section_id bigint [note: 'FK → section.id (nullable)']
  target_size tinyint [not null, note: '1..10 (app-level check)']
  notes text
  status TeamStatus [not null, note: 'default open (app-level)']
  created_at timestamp
  updated_at timestamp

  Indexes {
    (term_id, course_id, section_id, status, updated_at) [name: 'idx_team_scope_status_time']
    owner_user_id
  }

  Note: 'Team with capacity/status; full/lock/close supported'
}

Table team_member {
  team_id bigint [not null, note: 'FK → team.id']
  user_id bigint [not null, note: 'FK → user.id']
  role varchar(32)
  joined_at timestamp

  Indexes {
    (team_id, user_id) [pk, name: 'pk_team_member']
    user_id
  }

  Note: 'Junction: Team ↔ User (membership)'
}

//////////////////////////////////////////////////////
// Core: MatchRequest
//////////////////////////////////////////////////////
Table match_request {
  id bigint [pk]
  from_user_id bigint [not null, note: 'FK → user.id (sender)']
  to_user_id bigint [note: 'FK → user.id (XOR with to_team_id)']
  to_team_id bigint [note: 'FK → team.id (XOR with to_user_id)']
  post_id bigint [note: 'FK → post.id (optional reference)']
  message varchar(1000)
  status MatchRequestStatus [not null, note: 'default pending (app-level)']
  created_at timestamp
  decision_at timestamp
  expires_at timestamp

  Indexes {
    (to_user_id, status, created_at) [name: 'idx_mr_to_user_status_time']
    (to_team_id, status, created_at) [name: 'idx_mr_to_team_status_time']
    from_user_id
    post_id
  }

  Note: 'Contact/join workflow; XOR: exactly one of to_user_id / to_team_id'
}

//////////////////////////////////////////////////////
// Core: Availability
//////////////////////////////////////////////////////

//////////////////////////////////////////////////////
// Enhancements (optional but aligned to design)
//////////////////////////////////////////////////////

Table comment {
  id bigint [pk]
  post_id bigint [not null, note: 'FK → post.id']
  user_id bigint [not null, note: 'FK → user.id']
  parent_comment_id bigint [note: 'self FK → comment.id (nullable)']
  content text [not null]
  status varchar(16) [not null, note: 'visible/hidden/deleted']
  created_at timestamp
  updated_at timestamp

  Indexes {
    post_id
    user_id
    parent_comment_id
    (post_id, created_at) [name: 'idx_comment_post_time']
  }

  Note: 'Threaded discussion under posts'
}




Table endorsement {
  id bigint [pk]
  from_user_id bigint [not null, note: 'FK → user.id']
  to_user_id bigint [not null, note: 'FK → user.id']
  skill_id bigint [not null, note: 'FK → skill.id']
  note varchar(255)
  created_at timestamp

  Indexes {
    (from_user_id, to_user_id, skill_id) [unique, name: 'uq_endorsement_from_to_skill']
    to_user_id
    skill_id
  }

  Note: 'Lightweight post-project skill endorsements'
}


//////////////////////////////////////////////////////
// References (FKs)
// Use ">" to point to the referenced (one) side (many-to-one)
//////////////////////////////////////////////////////

// Term / Course / Section
Ref: course.term_id > term.id
Ref: section.course_id > course.id

// Post scope
Ref: post.term_id > term.id
Ref: post.course_id > course.id
Ref: post.section_id > section.id
Ref: post.user_id > user.id

// Team scope
Ref: team.term_id > term.id
Ref: team.course_id > course.id
Ref: team.section_id > section.id
Ref: team.owner_user_id > user.id

// Membership & skills
Ref: team_member.team_id > team.id
Ref: team_member.user_id > user.id

Ref: user_skill.user_id > user.id
Ref: user_skill.skill_id > skill.id


// Requests
Ref: match_request.from_user_id > user.id
Ref: match_request.to_user_id > user.id
Ref: match_request.to_team_id > team.id
Ref: match_request.post_id > post.id


// Enhancements
Ref: comment.post_id > post.id
Ref: comment.user_id > user.id
Ref: comment.parent_comment_id > comment.id




Ref: endorsement.from_user_id > user.id
Ref: endorsement.to_user_id > user.id
Ref: endorsement.skill_id > skill.id

