-- this file is for creating table STAGE3

CREATE TABLE Term (
    term_id      VARCHAR(32) PRIMARY KEY,
    name         VARCHAR(64) NOT NULL UNIQUE,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL
);

CREATE TABLE Course (
    course_id    VARCHAR(32) PRIMARY KEY,
    term_id      VARCHAR(32) NOT NULL,
    subject      VARCHAR(16) NOT NULL,
    number       VARCHAR(16) NOT NULL,
    title        VARCHAR(128) NOT NULL,
    credits      DECIMAL(3,1) NOT NULL,
    FOREIGN KEY (term_id) REFERENCES Term(term_id)
);

CREATE TABLE Section (
    course_id     VARCHAR(32) NOT NULL,
    crn           VARCHAR(16) NOT NULL,
    instructor    VARCHAR(128),
    meeting_time  VARCHAR(128),
    location      VARCHAR(128),
    delivery_mode VARCHAR(32),
    PRIMARY KEY (course_id, crn),
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

CREATE TABLE User (
    user_id       INT PRIMARY KEY,
    netid         VARCHAR(64) UNIQUE NOT NULL,
    email         VARCHAR(128) UNIQUE NOT NULL,
    phone_number  VARCHAR(32),
    display_name  VARCHAR(128),
    avatar_url    VARCHAR(256),
    bio           VARCHAR(1024),
    score         DECIMAL(4,1),
    major         VARCHAR(64),
    grade         VARCHAR(16)
);

CREATE TABLE Skill (
    skill_id   INT PRIMARY KEY,
    name       VARCHAR(64) UNIQUE NOT NULL,
    category   VARCHAR(64),
);

CREATE TABLE UserSkill (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    level VARCHAR(16),
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (skill_id) REFERENCES Skill(skill_id)
);

CREATE TABLE Team (
    team_id      INT PRIMARY KEY,
    course_id    VARCHAR(32) NOT NULL,
    section_id   VARCHAR(16) NOT NULL,
    team_name    VARCHAR(128) UNIQUE NOT NULL,
    target_size  INT,
    notes        VARCHAR(1024),
    status       VARCHAR(16),
    FOREIGN KEY (course_id, section_id) REFERENCES Section(course_id, crn)
);

CREATE TABLE TeamMember (
    team_id   INT NOT NULL,
    user_id   INT NOT NULL,
    role      VARCHAR(32),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES Team(team_id),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Post (
    post_id     INT PRIMARY KEY,
    user_id     INT NOT NULL,
    team_id     INT NOT NULL,
    title       VARCHAR(128) NOT NULL,
    content     VARCHAR(4000) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
);

CREATE TABLE Comment (
    comment_id         INT PRIMARY KEY,
    post_id            INT NOT NULL,
    user_id            INT NOT NULL,
    parent_comment_id  INT,
    content            VARCHAR(2000) NOT NULL,
    status             VARCHAR(16),
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Post(post_id),
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (parent_comment_id) REFERENCES Comment(comment_id)
);

CREATE TABLE MatchRequest (
    request_id    INT PRIMARY KEY,
    from_user_id  INT NOT NULL,
    to_team_id    INT NOT NULL,
    post_id       INT,
    message       VARCHAR(1024),
    status        VARCHAR(16),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES User(user_id),
    FOREIGN KEY (to_team_id) REFERENCES Team(team_id),
    FOREIGN KEY (post_id) REFERENCES Post(post_id)
);

CREATE TABLE PostSkill (
    post_id  INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (post_id, skill_id),
    FOREIGN KEY (post_id) REFERENCES Post(post_id),
    FOREIGN KEY (skill_id) REFERENCES Skill(skill_id)
);
