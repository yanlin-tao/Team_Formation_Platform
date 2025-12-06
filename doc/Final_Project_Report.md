# PT1-Stage 4: Final Project Report

<p align="left">
    <img src="./img_src/label.png" alt="label Diagram"
        style="width:300px; height:auto; max-width:30%;">
</p>

## I. Project video link: https://youtu.be/-jaM2hMnwcA

## II. Changes from the original proposal  
Our TeamUp UIUC platform successfully achieved its core mission of providing a centralized, course-based teammate finder for UIUC students. The overall direction and functionality still align with our original plan, but several concrete changes were made during implementation:

- **Unchanged core direction**:  
  The application remains course‑centric and section‑aware. Students still search by term/course/section, create posts to recruit teammates, manage teams, and handle join requests – exactly as envisioned in Stage 1.

- **De‑scoped creative features**:  
  We originally proposed more complex components such as a drag‑and‑drop interactive team dashboard, heatmap‑style visualizations, and a machine‑learning–based synergy score for recommendations. These turned out to be too time‑consuming relative to the required CRUD and advanced SQL work, so they were not implemented in the final product.

- **Reputation system simplification**:  
  The schema still includes a score field on the user profile, but the full peer feedback pipeline and history‑aware reputation design from the proposal were simplified to a single numeric “collaboration score” field and some example stats instead of a full evaluation workflow.

- **Newly emphasized user flows**:  
  In practice we added more concrete, rubric‑driven flows that were only loosely described in the proposal, including **My Teams**, **My Courses**, **Team Detail**, and a **Notifications** page for join requests. These improve day‑to‑day usability even without the more ambitious visualization and recommendation features.

## III. Usefulness and achievement
**Achievements regarding usefulness**  

- **Course-based organization**: Our platform is fundamentally course‑centric. Students begin by searching a course from the integrated catalog, which contains over 1,260 courses and 4,377 sections from real UIUC Spring 2025 schedule data. The dedicated posts and comments system are organized inside each course. Students can directly find the relevant courses and posts they want. 

- **Posts and comments system**: The posting system serves as the primary method for students to present their target team descriptions and target team size within each course. Beyond creating and browsing posts, students can comment on posts to ask questions, negotiate roles, or clarify expectations before sending the request and joining a team. The post system essentially functions as a structured, course‑specific social space for students to showcase their strengths and initiate collaboration.

- **Efficient Team management**: There is a "My Team" team management section designed for efficient management. The page displays the detailed information of the team, including the team name, the cours esection, the target size, the open slots, the team members and their roles. The platform’s backend triggers update team status in real time when members join or leave, ensuring accurate availability without manual updates.

- **Match Request System**: The match request and communication system provides a formal, course‑organized process for joining teams. Students can send a join request to any team with an open seat, attaching a short message explaining their background or asking specific questions. Team leaders receive these requests in an organized notification inbox and can choose to accept or reject the request. This prevents the lost of messages and informal miscommunication that happens on Discord or GroupMe.

- **Rich but focused user profiles**: Each student has a profile page with name, avatar, major, year, phone number, short bio, and a collaboration score field, together with curated statistics (active teams, requests, matches) and example spotlight projects. This gives potential teammates a quick, structured overview of someone’s background before collaborating, even though we do not yet surface a full, queryable history of every past request and match.

**Limitations regarding usefulness**

- **Inconvenience for ongoing communication**: While students can communicate through match requests and post comments, the platform currently does not support private messaging between users. This limits the ability for students to have ongoing, one-on-one conversations and may require them to rely on external tools for detailed coordination. Repeated discussions about roles or schedules can therefore become inconvenient.  

- **Limited keyword search scope**: The platform organizes all features strictly around courses and sections. We support keyword search for **courses** (by subject/number/title) and course‑scoped post search, but we do not offer a global free‑text search across all posts, comments, or skills. This restricts discovery for cross‑course topics that share similar content but live under different course spaces.

### IV. Schema change

After applying the fixes from **Stage 2 revisions** (e.g., making `UserSkill(user_id, skill_id)` a composite primary key and cleaning conceptual vs. logical details), the final physical schema we implemented in MySQL matches that logical design.  
We did not introduce new tables or drop entities between Stage 2 and Stage 4; instead, we focused on adding indexes, stored procedures, transactions, and triggers on top of the existing table definitions.

### V. ER diagram and table implementation change

Our final table implementations closely follow the revised UML/ER model from Stage 2, with only minor pragmatic adjustments:

- The **core entities and relationships** (Term, Course, Section, User, Team, TeamMember, Post, Comment, MatchRequest, Skill, UserSkill, PostSkill) are implemented exactly as in the logical schema and support all current application flows.
- Some entities such as **Endorsement** and the richer parts of the reputation system are present in the ER design and DDL but are not yet actively used by the current UI; we intentionally deferred those features while keeping the schema ready for future extensions.
- In MatchRequest, we primarily use the **user→team** workflow (from_user_id → to_team_id) in our application, which is a practical subset of the more general contact model described conceptually.

Overall, we believe the **implemented schema is a suitable and robust realization** of our conceptual design: it keeps the normalization and flexibility of the original ER diagram, while slightly simplifying how some optional relationships are exercised in this first version of the application.

### VI. Functionality changes

**Functionalities added (beyond the original proposal):**

- **Popular courses and posts**:  
  On the entry page we implemented a “Popular Posts” section backed by an advanced SQL query that aggregates request and comment counts per post, and a “Popular Courses” section that highlights courses with the most active sections. This helps students quickly discover trending course spaces and recruiting activity.

- **My Teams & Team Detail**:  
  We added a dedicated **My Teams** dashboard that lists all teams a user has joined (via the `sp_get_user_teams` stored procedure), and a **Team Detail** page that shows course/section info, team size and status, and the full member list with roles and join times. This makes it much easier to manage existing collaborations.

- **My Courses overview**:  
  The **My Courses** page aggregates courses where the user has teams and/or posts, shows simple engagement stats, and lets users quickly navigate to course‑level posts. This was not fully fleshed out in the original proposal but turned out to be a very practical way to summarize activity.

- **Notifications / Match Request inbox**:  
  We implemented a notifications page where users can see incoming and outgoing join requests, accept or reject them, and trigger transactional updates (TeamMember insertion, request status changes). This formalizes the join‑team workflow that was only briefly mentioned in the proposal.

- **Full comment CRUD on posts**:  
  Beyond simple commenting, we support creating, editing, and deleting comments, with backend logic to soft‑delete comments that have replies. This richer discussion model was not specified in detail originally.

**Functionalities not implemented or simplified relative to proposal:**

- **Integration of machine learning–based matching**:  
  The platform does not currently integrate the machine learning algorithm into the matching process, including using skill and interest matches and synergy scores calculation. We focused instead on robust CRUD, search, and advanced SQL programs.

- **Interactive team dashboard visualizations**:  
  Features like drag‑and‑drop team management, real‑time heatmaps of skill coverage, and more advanced analytics dashboards were not implemented. While they could enhance the user experience and decision‑making, they were considered lower priority than building solid transactional and stored‑procedure support.

Although these advanced functionalities were not implemented due to time and resources constraints, the platform prioritizes **reliable database design, correct transactional workflows, and clear core pages**. This provides a smooth and dependable user experience today, while leaving room for more sophisticated features in future iterations.

## VII. Advanced database features

Our application incorporates several advanced database features that complement and enhance the platform:

### **Transactions**
We use explicit, multi‑statement transactions with the isolation level `READ COMMITTED` for several critical workflows in our backend. These transactions combine **advanced queries** (JOINs, GROUP BY, subqueries) with multiple writes to keep data consistent:

- **User registration (`POST /api/auth/register`)**  
  Inside a transaction we:
  - Run a JOIN + subquery to check for existing users with the same email or NetID.  
  - Use an aggregated query (`SELECT COALESCE(MAX(user_id), 0) + 1`) to generate a new user id.  
  - Insert the new row into `User`.  
  If any step fails, we roll back; otherwise we commit, guaranteeing that we never partially create an inconsistent user.

- **Profile update (`PUT /api/profile/me`)**  
  We:
  - Use a `LEFT JOIN` + `GROUP BY` over `User` and `TeamMember` to compute how many teams a user has joined.  
  - Use a subquery to count how many posts the user has authored.  
  - Then conditionally update multiple profile fields in one `UPDATE` statement.  
  These operations are wrapped in a transaction so that validation and updates are consistent even under concurrent requests.

- **Accepting a join request (`PUT /api/users/{user_id}/requests/{request_id}/accept`)**  
  This transaction:
  - Verifies the request and its post/author via an `INNER JOIN` on `MatchRequest` and `Post`.  
  - Inserts or upserts a row into `TeamMember`.  
  - Runs an aggregated subquery over `TeamMember` to compute the current team size and compare it with `target_size`, potentially updating the team status.  
  All steps are executed under `READ COMMITTED` and either fully applied or rolled back, ensuring we do not end up with a request marked “accepted” but no corresponding membership.

- **Post and comment lifecycles (create / update / delete)**  
  For creating comments, updating comments, deleting comments, and deleting posts (with cascading actions on comments, requests, and possibly teams), we again use transactions that combine JOINs and subqueries with multiple write statements. This guarantees that complex multi‑table changes either fully succeed or leave the database unchanged.

Across these endpoints, transactions complement our application by **preserving data integrity for multi‑step workflows** such as team joining, profile editing, and post/comment management, while still making use of MySQL’s advanced query capabilities inside each transaction.

### **Stored Procedures**
We design 4 stored procedures. The design complement our application. Those procedures improve the database performance by precompiling. And the procedures keep our code easy to read, reuse and scale. 
- **sp_get_user_teams**  
Retrieves the list of teams a user has joined along with course information, member count, and the user's role in each team.  

```sql
CREATE PROCEDURE sp_get_user_teams(
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
    DECLARE team_count INT DEFAULT 0;
    
    SELECT 
        t.team_id,
        t.team_name,
        c.title AS course_title,
        c.subject,
        c.number,
        COUNT(tu2.user_id) AS member_count,
        t.target_size,
        t.status,
        t.course_id,
        MAX(tu.role) AS role,
        MAX(tu.joined_at) AS joined_at
    FROM Team t
    JOIN Course c ON t.course_id = c.course_id
    JOIN TeamMember tu ON t.team_id = tu.team_id
    LEFT JOIN TeamMember tu2 ON t.team_id = tu2.team_id
    WHERE tu.user_id = p_user_id
    GROUP BY t.team_id, t.team_name, c.title, c.subject, c.number, 
             t.target_size, t.status, t.course_id
    ORDER BY MAX(tu.joined_at) DESC
    LIMIT p_limit;
    
    SELECT COUNT(DISTINCT t.team_id) INTO team_count
    FROM TeamMember tm
    JOIN Team t ON tm.team_id = t.team_id
    WHERE tm.user_id = p_user_id;
    
    IF team_count > 100 THEN
        SET @warning = 'User has many teams';
    END IF;
END //
```
- **sp_get_available_teams_in_section**  
Finds all teams in a given section that are still open for new members.
```sql
CREATE PROCEDURE sp_get_available_teams_in_section(
    IN p_section_id VARCHAR(16),
    IN p_limit INT
)
BEGIN
    DECLARE available_count INT DEFAULT 0;
    
    SELECT
        t.team_id,
        t.team_name,
        COUNT(DISTINCT tm.user_id) AS current_members,
        t.target_size,
        (t.target_size - COUNT(DISTINCT tm.user_id)) AS remaining_slots
    FROM Team AS t
    LEFT JOIN TeamMember AS tm ON tm.team_id = t.team_id
    WHERE t.section_id = p_section_id 
      AND t.status = 'open'
    GROUP BY t.team_id, t.team_name, t.target_size
    HAVING COUNT(DISTINCT tm.user_id) < t.target_size
    ORDER BY remaining_slots DESC, t.team_id
    LIMIT p_limit;
    
    SELECT COUNT(*) INTO available_count
    FROM (
        SELECT t.team_id
        FROM Team AS t
        LEFT JOIN TeamMember AS tm ON tm.team_id = t.team_id
        WHERE t.section_id = p_section_id 
          AND t.status = 'open'
        GROUP BY t.team_id, t.team_name, t.target_size
        HAVING COUNT(DISTINCT tm.user_id) < t.target_size
    ) AS available_teams;
    
    IF available_count > 50 THEN
        SET @warning = 'Many available teams';
    END IF;
END //
```
- **sp_get_user_post_interactions**  
Retrieves a user’s activity on posts, including posts they created and posts they commented on. 
```sql
CREATE PROCEDURE sp_get_user_post_interactions(
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
    DECLARE post_count INT DEFAULT 0;
    DECLARE comment_count INT DEFAULT 0;
    
    (SELECT DISTINCT 
        p.post_id, 
        p.title, 
        p.content, 
        p.created_at, 
        u.display_name,
        p.user_id,
        p.team_id,
        'created' AS interaction_type
     FROM Post p 
     JOIN User u ON p.user_id = u.user_id 
     WHERE p.user_id = p_user_id)
     
     UNION
     
     (SELECT DISTINCT 
         p.post_id, 
         p.title, 
         p.content, 
         p.created_at, 
         u.display_name,
         p.user_id,
         p.team_id,
         'commented' AS interaction_type
      FROM Post p 
      JOIN User u ON p.user_id = u.user_id 
      WHERE p.post_id IN (
          SELECT post_id 
          FROM Comment 
          WHERE user_id = p_user_id
            AND (status IS NULL OR status != 'deleted')
      ))
    ORDER BY created_at DESC
    LIMIT p_limit;
    
    SELECT COUNT(*) INTO post_count
    FROM Post
    WHERE user_id = p_user_id;
    
    SELECT COUNT(DISTINCT post_id) INTO comment_count
    FROM Comment
    WHERE user_id = p_user_id
      AND (status IS NULL OR status != 'deleted');
    
    SET @activity_summary = CASE 
        WHEN post_count = 0 AND comment_count = 0 THEN 'No activity'
        WHEN post_count > 0 AND comment_count = 0 THEN 'Only posts created'
        WHEN post_count = 0 AND comment_count > 0 THEN 'Only comments made'
        ELSE 'Posts and comments'
    END;
END //

```
- **sp_get_section_team_stats**  
Provides statistics for all teams in a specific course section.  
```sql

CREATE PROCEDURE sp_get_section_team_stats(
    IN p_section_id VARCHAR(16),
    IN p_limit INT
)
BEGIN
    DECLARE total_teams INT DEFAULT 0;
    DECLARE total_members INT DEFAULT 0;
    
    SELECT
        s.crn AS section_crn,
        s.instructor,
        t.team_id,
        t.team_name,
        COUNT(tm.user_id) AS member_count,
        t.target_size,
        t.status
    FROM Team t
    JOIN Section s ON t.section_id = s.crn
    LEFT JOIN TeamMember tm ON t.team_id = tm.team_id
    WHERE s.crn = p_section_id
      AND s.instructor IS NOT NULL 
      AND s.instructor <> ''
    GROUP BY s.crn, s.instructor, t.team_id, t.team_name, t.target_size, t.status
    ORDER BY s.crn, t.team_name
    LIMIT p_limit;
    
    SELECT 
        COUNT(DISTINCT t.team_id) AS total_teams,
        COUNT(tm.user_id) AS total_members
    INTO total_teams, total_members
    FROM Team t
    LEFT JOIN TeamMember tm ON t.team_id = tm.team_id
    WHERE t.section_id = p_section_id;
    
    IF total_teams = 0 THEN
        SET @status_message = 'No teams found in this section';
    ELSE
        SET @status_message = CONCAT('Section has ', total_teams, ' teams with ', total_members, ' total members');
    END IF;
END //
```

### **Triggers**
We design for triggers for now. Those triggers allow the data to update in real time instead of manual updating. 

- **Team Status Triggers**     
The trigger automatically update the status based on the number of members in the team. The trigger runs after a new team member is added. If the number of members reaches or exceeds the target size, the team status is set to `'full'`.
```sql
CREATE TRIGGER trg_team_status_full
AFTER INSERT ON TeamMember
FOR EACH ROW
BEGIN
    DECLARE current_count INT;
    DECLARE target_size_val INT;
    
    SELECT COUNT(*) INTO current_count
    FROM TeamMember
    WHERE team_id = NEW.team_id;
    
    SELECT target_size INTO target_size_val
    FROM Team
    WHERE team_id = NEW.team_id;
    
    IF current_count >= target_size_val THEN
        UPDATE Team
        SET status = 'full'
        WHERE team_id = NEW.team_id
        AND status != 'full';
    END IF;
END //
```
The trigger automatically update the status based on the number of members in the team. The trigger runs after a team member is removed. If the team is originally `'full'`, we set it to `'open'`.
```sql
CREATE TRIGGER trg_team_status_open
AFTER DELETE ON TeamMember
FOR EACH ROW
BEGIN
    DECLARE current_count INT;
    DECLARE target_size_val INT;
    DECLARE current_status VARCHAR(16);
    
    SELECT COUNT(*) INTO current_count
    FROM TeamMember
    WHERE team_id = OLD.team_id;
    
    SELECT target_size, status INTO target_size_val, current_status
    FROM Team
    WHERE team_id = OLD.team_id;
    
    IF current_count < target_size_val AND current_status = 'full' THEN
        UPDATE Team
        SET status = 'open'
        WHERE team_id = OLD.team_id;
    END IF;
END //
```

- **Post and Comment Update Triggers**  
The trigger updates the timestamp of the post and comments. If the title or the contents of the posts are about to change, we update the `'updated_at'` for the posts and comments.

```sql
CREATE TRIGGER trg_post_updated_at
BEFORE UPDATE ON Post
FOR EACH ROW
BEGIN
    IF NEW.content != OLD.content OR NEW.title != OLD.title THEN
        SET NEW.updated_at = NOW();
    END IF;
END //

CREATE TRIGGER trg_comment_updated_at
BEFORE UPDATE ON Comment
FOR EACH ROW
BEGIN
    IF NEW.content != OLD.content THEN
        SET NEW.updated_at = NOW();
    END IF;
END //
```

### **Constraints**
We define appropriate **primary keys** for each table and establish **foreign key constraints** for nearly all related entities, ensuring data integrity and relational consistency throughout the database. These constraints are clearly documented in our database design. For each table, foreign keys are specified to enforce relationships, preventing invalid references and maintaining the logical structure of the data. For example, we define foreign key constraints as follows:

```sql
FOREIGN KEY (course_id, section_id) REFERENCES Section(course_id, crn);

FOREIGN KEY (user_id) REFERENCES User(user_id);

FOREIGN KEY (post_id) REFERENCES Post(post_id);
```

## VIII. Technical challenges and advice

**Ning Wei (ningwei3)**  
One major challenge we faced was ensuring that our backend could reliably connect to the database hosted on Google Cloud Platform (GCP). A Cloud SQL instance lives inside a controlled network environment. The backend cannot connect unless your client machine or server has an approved IP address. This resulted in significant time spent connecting everyone to the backend, and required extensive team communication. Our recommendation is to get this step right before starting the design and always remember to maintain effective team communication.

**Jack Jiang (jackj6)**  
Another significant challenge was synthetic data generation that required to be consistent to the real data. Our database contained many interconnected tables linked by foreign keys. Almost each of our table contains a foreign key. Because of these dependencies, generating synthetic data was not as simple as inserting random rows. Every insertion had to follow strict relational rules. The mistakes in data are fatal, as it becomes extremely difficult to identify errors in the subsequent functional design. We have repeatedly tested and verified the accuracy of our data and dependencies. This is exactly what we recommend.

**Lixuan Gu (lixuang2)**  
One major challenge we faced on the frontend was managing asynchronous state updates across multiple pages, such as notifications, user profiles, and team details. Rapid user actions or dependent API calls often caused stale or inconsistent UI states, making it difficult to ensure that all components reflected the latest backend data. We add global processing state prevents duplicate clicks while a request is in progress. We strongly recommend paying close attention to concurrent requests.

**Yanlin Tao (tao17)**  
One of the technical challenge we met is the cross platform environment setup as I am a Windows system while my teammates are all MacOS. Many of the shell scripts behaved differently across these platforms due to differences in path formats, executable permissions, and default shell behavior. The environemnt setup and the frontend-backend connection is also different. Our advice is to create a containerized environments for better consistency.

## IX. Future work

- **Skills Matching Algorithm Implementation**  
We could complete the skill matching algorithm, which integrates deep learning or LLM to review skill overlap, skill levels, and required vs. possessed skills. The ideal implementation is to generate a "synergy scores", considering collaboration preferences, skill match and work styles. This creates a more personalized user experience. 

- **Reputation and Feedback System**  
We would create a more comprehensive system for feedback. We may develop a weighted scoring algorithm to adjust user's collaboration score and provide peer evaluation of each aspects of the team worker. This may allow other students to track the historical performance of their potential team member over time and avoid free riders. 

- **Communication System**  
Current communications are delivered mainly through posts, comments, and match request, which are either short or public message. In the future work, our platform will implement a direct message system to support more private one-to-one ongoing conversations. We may also update the notification part according the messages preference. 


## X. Division of Labor

- **Ning Wei (ningwei3)**: GCP database and environment setup, backend CRUD management and debugging
- **Jack Jiang (jackj6)**: synthetic data design, backend–frontend API connections, final video recording 
- **Lixuan Gu (lixuang2)**: frontend tab layout and main UI components, integration of frontend features with backend logic 
- **Yanlin Tao (tao17)**: real data design, advanced database logic, writing design and report documents

Overall, the team collaboration is very effective. Each member takes different components at each stage and maintain well communication through weekly meetings. All the responsibilities are well divided, and the communication is smooth. 