# Database Design 

## 1. Database Implementation

### 1.1 Environment Setup

Our database is deployed on **Google Cloud SQL (Enterprise Edition)**.  
The following table summarizes our instance configuration and connection details.

| **Category** | **Configuration** |
|---------------|------------------|
| **Cloud SQL Edition** | Enterprise Edition |
| **Region** | us-central1 (Iowa) |
| **Database Engine** | MySQL 8.0 |
| **vCPU** | 1 vCPU |
| **RAM** | 628.74 MB |
| **Storage Type** | 10 GB SSD |
| **Cache** | Disabled |
| **Network Throughput (MB/s)** | 125 / 125 |
| **IOPS** | Read 6,300 ( max 12,000 ), Write 6,300 ( max 10,000 ) |
| **Disk Throughput (MB/s)** | Read 4.8 ( max 125 ), Write 4.8 ( max 107.8 ) |
| **Connection Type** | Public IP |
| **Public IP Address** | `34.172.159.62` |
| **Default TCP Port** | `3306` |
| **Connection Name** | `cs411-sqlmaster:us-central1:fa25-cs411-team001-sqlmaster` |
| **Backup Policy** | Automatic |
| **Availability Type** | Single Zone |
| **Point-in-Time Recovery** | Enabled |

**Description:**  
This Cloud SQL instance hosts our team database (`team001_db`) for Stage 3.  
We connect using the public IP address `34.172.159.62` on port `3306`.  
Each team member can access the instance via MySQL Workbench or CLI using their assigned credentials.

**Screenshots:**

- **Cloud SQL Instance Summary:**  
<p align="center">
    <img src="./img_src/cloudsql_summary.png" alt="cloudsql_summary"
        style="width:60%; height:auto; max-width:100%;">
  <br><em>Figure 1. cloudsql_summary</em>
</p>

- **Connection Details:**  
<p align="center">
    <img src="./img_src/cloudsql_connection.png" alt="cloudsql_connection"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 2. cloudsql_connection</em>
</p>



### 1.2 Table Creation (DDL)

The following Data Definition Language (DDL) commands were executed to create all main tables for our application database on MySQL 8.0 (GCP Cloud SQL).  
Each table includes primary keys, foreign keys, and attribute constraints consistent with our logical schema from Stage 2.  
All commands were successfully executed in the Cloud SQL instance, as shown in the screenshots below.

---

#### **Table 1 — Term**
Stores academic term information such as name, start date, and end date.
```sql
CREATE TABLE Term (
    term_id      VARCHAR(32) PRIMARY KEY,
    name         VARCHAR(64) NOT NULL UNIQUE,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL
);
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/Term.png" alt="term"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 3. Table create for Term </em>
</p>

#### **Table 2 — Course**
Defines course metadata and links each course to a term.
```sql
CREATE TABLE Course (
    course_id    VARCHAR(32) PRIMARY KEY,
    term_id      VARCHAR(32) NOT NULL,
    subject      VARCHAR(16) NOT NULL,
    number       VARCHAR(16) NOT NULL,
    title        VARCHAR(128) NOT NULL,
    credits      DECIMAL(3,1) NOT NULL,
    FOREIGN KEY (term_id) REFERENCES Term(term_id)
);
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/Course.png" alt="course"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 4. Table create for Course</em>
</p>

#### **Table 3 — Section**
Represents individual course sections and class meeting details.
```sql
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
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/Section.png" alt="section"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 5. Table create for Section</em>
</p>

#### **Table 4 — User**
Stores platform user profiles and academic information.
```sql
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
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/User.png" alt="user"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 6. Table create for User</em>
</p>

#### **Table 5 — Skill**
Maintains a catalog of skills that users or posts may reference.
```sql
CREATE TABLE Skill (
    skill_id   INT PRIMARY KEY,
    name       VARCHAR(64) UNIQUE NOT NULL,
    category   VARCHAR(64)
);
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/Skill.png" alt="skill"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 7. Table create for Skill</em>
</p>

#### **Table 6 — UserSkill**
Implements a many-to-many relationship between User and Skill, including skill proficiency level.
```sql
CREATE TABLE UserSkill (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    level VARCHAR(16),
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (skill_id) REFERENCES Skill(skill_id)
);
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/UserSkill.png" alt="userskill"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 8. Table create for UserSkill</em>
</p>

#### **Table 7 — Team**
Represents project teams within specific course sections.
```sql
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
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/Team.png" alt="team"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 9. Table create for Team</em>
</p>

#### **Table 8 — TeamMember**
Links users to teams and records their role and join time.
```sql
CREATE TABLE TeamMember (
    team_id   INT NOT NULL,
    user_id   INT NOT NULL,
    role      VARCHAR(32),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES Team(team_id),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/TeamMember.png" alt="teammember"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 10. Table create for TeamMember</em>
</p>

#### **Table 9 — Post**
Contains posts created by users within teams.
```sql
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
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/Post.png" alt="post"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 11. Table create for Post</em>
</p>

#### **Table 10 — Comment**
Stores user comments on posts, supporting nested replies.
```sql
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
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/Comment.png" alt="comment"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 12. Table create for Comment</em>
</p>

#### **Table 11 — MatchRequest**
Records users' join requests to teams via posts.
```sql
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
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/MatchRequest.png" alt="matchrequest"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 13. Table create for MatchRequest</em>
</p>

#### **Table 12 — PostSkill**
Defines the many-to-many relation between posts and required skills.
```sql
CREATE TABLE PostSkill (
    post_id  INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (post_id, skill_id),
    FOREIGN KEY (post_id) REFERENCES Post(post_id),
    FOREIGN KEY (skill_id) REFERENCES Skill(skill_id)
);
```

- **Operation Screenshot:**  
<p align="center">
    <img src="./img_src/PostSkill.png" alt="postskill"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 14. Table create for PostSkill</em>
</p>