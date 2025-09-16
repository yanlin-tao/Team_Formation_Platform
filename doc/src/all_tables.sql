CREATE TABLE `term` (
  `id` bigint PRIMARY KEY COMMENT 'PK',
  `code` varchar(8) UNIQUE NOT NULL COMMENT 'e.g., FA25',
  `name` varchar(32) NOT NULL,
  `start_date` date,
  `end_date` date,
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `course` (
  `id` bigint PRIMARY KEY,
  `term_id` bigint NOT NULL COMMENT 'FK → term.id',
  `subject` varchar(16) NOT NULL COMMENT 'e.g., CS',
  `number` varchar(16) NOT NULL COMMENT 'e.g., 411',
  `title` varchar(255) NOT NULL,
  `credits` tinyint,
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `section` (
  `id` bigint PRIMARY KEY,
  `course_id` bigint NOT NULL COMMENT 'FK → course.id',
  `CRN` varchar(16) UNIQUE,
  `section_code` varchar(16) NOT NULL COMMENT 'A / B1 / OL',
  `instructor` varchar(255),
  `meeting_json` json COMMENT 'e.g., [{"day":"WED","start":"14:00","end":"15:20"}]',
  `location` varchar(64),
  `delivery_mode` ENUM ('InPerson', 'Online', 'Hybrid'),
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `user` (
  `id` bigint PRIMARY KEY,
  `netid` varchar(64) UNIQUE NOT NULL,
  `email` varchar(255) UNIQUE COMMENT 'optional',
  `display_name` varchar(255),
  `bio` text,
  `avatar_url` varchar(512),
  `is_active` boolean NOT NULL COMMENT 'default true (app-level)',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `skill` (
  `id` bigint PRIMARY KEY,
  `name` varchar(64) UNIQUE NOT NULL,
  `created_at` timestamp
);

CREATE TABLE `user_skill` (
  `user_id` bigint NOT NULL COMMENT 'FK → user.id',
  `skill_id` bigint NOT NULL COMMENT 'FK → skill.id',
  `level` tinyint COMMENT '1..5 optional',
  `created_at` timestamp,
  PRIMARY KEY (`user_id`, `skill_id`)
);

CREATE TABLE `post` (
  `id` bigint PRIMARY KEY,
  `user_id` bigint NOT NULL COMMENT 'FK → user.id (author)',
  `term_id` bigint NOT NULL COMMENT 'FK → term.id',
  `course_id` bigint NOT NULL COMMENT 'FK → course.id',
  `section_id` bigint COMMENT 'FK → section.id (nullable)',
  `title` varchar(255) NOT NULL,
  `content` text,
  `roles_json` json COMMENT 'desired roles',
  `target_team_size` tinyint,
  `status` ENUM ('open', 'locked', 'archived') NOT NULL COMMENT 'default open (app-level)',
  `visibility` ENUM ('public', 'course_only') NOT NULL COMMENT 'default public (app-level)',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `team` (
  `id` bigint PRIMARY KEY,
  `owner_user_id` bigint NOT NULL COMMENT 'FK → user.id (owner)',
  `term_id` bigint NOT NULL COMMENT 'FK → term.id',
  `course_id` bigint NOT NULL COMMENT 'FK → course.id',
  `section_id` bigint COMMENT 'FK → section.id (nullable)',
  `target_size` tinyint NOT NULL COMMENT '1..10 (app-level check)',
  `notes` text,
  `status` ENUM ('open', 'locked', 'full', 'closed') NOT NULL COMMENT 'default open (app-level)',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `team_member` (
  `team_id` bigint NOT NULL COMMENT 'FK → team.id',
  `user_id` bigint NOT NULL COMMENT 'FK → user.id',
  `role` varchar(32),
  `joined_at` timestamp,
  PRIMARY KEY (`team_id`, `user_id`)
);

CREATE TABLE `match_request` (
  `id` bigint PRIMARY KEY,
  `from_user_id` bigint NOT NULL COMMENT 'FK → user.id (sender)',
  `to_user_id` bigint COMMENT 'FK → user.id (XOR with to_team_id)',
  `to_team_id` bigint COMMENT 'FK → team.id (XOR with to_user_id)',
  `post_id` bigint COMMENT 'FK → post.id (optional reference)',
  `message` varchar(1000),
  `status` ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired') NOT NULL COMMENT 'default pending (app-level)',
  `created_at` timestamp,
  `decision_at` timestamp,
  `expires_at` timestamp
);

CREATE TABLE `comment` (
  `id` bigint PRIMARY KEY,
  `post_id` bigint NOT NULL COMMENT 'FK → post.id',
  `user_id` bigint NOT NULL COMMENT 'FK → user.id',
  `parent_comment_id` bigint COMMENT 'self FK → comment.id (nullable)',
  `content` text NOT NULL,
  `status` varchar(16) NOT NULL COMMENT 'visible/hidden/deleted',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `endorsement` (
  `id` bigint PRIMARY KEY,
  `from_user_id` bigint NOT NULL COMMENT 'FK → user.id',
  `to_user_id` bigint NOT NULL COMMENT 'FK → user.id',
  `skill_id` bigint NOT NULL COMMENT 'FK → skill.id',
  `note` varchar(255),
  `created_at` timestamp
);

CREATE UNIQUE INDEX `uq_course_term_subject_number` ON `course` (`term_id`, `subject`, `number`);

CREATE INDEX `course_index_1` ON `course` (`term_id`);

CREATE UNIQUE INDEX `uq_section_course_code` ON `section` (`course_id`, `section_code`);

CREATE INDEX `section_index_3` ON `section` (`course_id`);

CREATE INDEX `user_skill_index_4` ON `user_skill` (`user_id`);

CREATE INDEX `user_skill_index_5` ON `user_skill` (`skill_id`);

CREATE INDEX `idx_post_scope_status_time` ON `post` (`term_id`, `course_id`, `section_id`, `status`, `updated_at`);

CREATE INDEX `post_index_7` ON `post` (`user_id`);

CREATE INDEX `idx_team_scope_status_time` ON `team` (`term_id`, `course_id`, `section_id`, `status`, `updated_at`);

CREATE INDEX `team_index_9` ON `team` (`owner_user_id`);

CREATE INDEX `team_member_index_10` ON `team_member` (`user_id`);

CREATE INDEX `idx_mr_to_user_status_time` ON `match_request` (`to_user_id`, `status`, `created_at`);

CREATE INDEX `idx_mr_to_team_status_time` ON `match_request` (`to_team_id`, `status`, `created_at`);

CREATE INDEX `match_request_index_13` ON `match_request` (`from_user_id`);

CREATE INDEX `match_request_index_14` ON `match_request` (`post_id`);

CREATE INDEX `comment_index_15` ON `comment` (`post_id`);

CREATE INDEX `comment_index_16` ON `comment` (`user_id`);

CREATE INDEX `comment_index_17` ON `comment` (`parent_comment_id`);

CREATE INDEX `idx_comment_post_time` ON `comment` (`post_id`, `created_at`);

CREATE UNIQUE INDEX `uq_endorsement_from_to_skill` ON `endorsement` (`from_user_id`, `to_user_id`, `skill_id`);

CREATE INDEX `endorsement_index_20` ON `endorsement` (`to_user_id`);

CREATE INDEX `endorsement_index_21` ON `endorsement` (`skill_id`);

ALTER TABLE `term` COMMENT = 'Academic term; referenced by course/post/team';

ALTER TABLE `course` COMMENT = 'Course instance within a term';

ALTER TABLE `section` COMMENT = 'Course section; may be optional on posts/teams';

ALTER TABLE `user` COMMENT = 'Authenticated student; stores only voluntary public info';

ALTER TABLE `skill` COMMENT = 'Normalized skill vocabulary';

ALTER TABLE `user_skill` COMMENT = 'Junction: User ↔ Skill';

ALTER TABLE `post` COMMENT = 'Teammate-seeking post; at most one active per (user, term, course[, section])';

ALTER TABLE `team` COMMENT = 'Team with capacity/status; full/lock/close supported';

ALTER TABLE `team_member` COMMENT = 'Junction: Team ↔ User (membership)';

ALTER TABLE `match_request` COMMENT = 'Contact/join workflow; XOR: exactly one of to_user_id / to_team_id';

ALTER TABLE `comment` COMMENT = 'Threaded discussion under posts';

ALTER TABLE `endorsement` COMMENT = 'Lightweight post-project skill endorsements';

ALTER TABLE `course` ADD FOREIGN KEY (`term_id`) REFERENCES `term` (`id`);

ALTER TABLE `section` ADD FOREIGN KEY (`course_id`) REFERENCES `course` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`term_id`) REFERENCES `term` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`course_id`) REFERENCES `course` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`section_id`) REFERENCES `section` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

ALTER TABLE `team` ADD FOREIGN KEY (`term_id`) REFERENCES `term` (`id`);

ALTER TABLE `team` ADD FOREIGN KEY (`course_id`) REFERENCES `course` (`id`);

ALTER TABLE `team` ADD FOREIGN KEY (`section_id`) REFERENCES `section` (`id`);

ALTER TABLE `team` ADD FOREIGN KEY (`owner_user_id`) REFERENCES `user` (`id`);

ALTER TABLE `team_member` ADD FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);

ALTER TABLE `team_member` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

ALTER TABLE `user_skill` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

ALTER TABLE `user_skill` ADD FOREIGN KEY (`skill_id`) REFERENCES `skill` (`id`);

ALTER TABLE `match_request` ADD FOREIGN KEY (`from_user_id`) REFERENCES `user` (`id`);

ALTER TABLE `match_request` ADD FOREIGN KEY (`to_user_id`) REFERENCES `user` (`id`);

ALTER TABLE `match_request` ADD FOREIGN KEY (`to_team_id`) REFERENCES `team` (`id`);

ALTER TABLE `match_request` ADD FOREIGN KEY (`post_id`) REFERENCES `post` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`post_id`) REFERENCES `post` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`parent_comment_id`) REFERENCES `comment` (`id`);

ALTER TABLE `endorsement` ADD FOREIGN KEY (`from_user_id`) REFERENCES `user` (`id`);

ALTER TABLE `endorsement` ADD FOREIGN KEY (`to_user_id`) REFERENCES `user` (`id`);

ALTER TABLE `endorsement` ADD FOREIGN KEY (`skill_id`) REFERENCES `skill` (`id`);
