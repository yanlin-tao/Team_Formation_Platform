# Final Project Report - Team SQLMaster
## Project video link:   
## Changes from the original proposal  
Our TeamUp UIUC platform successfully achieved its core mission of providing a centralized, course-based teammate finder for UIUC students. The overall direction and functionality align perfectly with our original plan, though there are minor adjustments to some specific features.

### Usefulness and achievement
**Achievements regarding usefulness:**  
- **Course-based organization**: Our platform is fundamentally course‑centric. Students begin by searching a course from the integrated catalog, which contains over 1,260 courses and 4,377 sections from real UIUC Spring 2025 schedule data. The dedicated posts and comments system are organized inside each course. Students can directly find the relevant courses and posts they want. 
- **Posts and comments system**: The posting system serves as the primary method for students to present their target team descriptions and target team size within each course. Beyond creating and browsing posts, students can comment on posts to ask questions, negotiate roles, or clarify expectations before sending the request and joining a team. The post system essentially functions as a structured, course‑specific social space for students to showcase their strengths and initiate collaboration.
- **Efficient Team management**: There is a "My Team" team management section designed for efficient management. The page displays the detailed information of the team, including the team name, the cours esection, the target size, the open slots, the team members and their roles. The platform’s backend triggers update team status in real time when members join or leave, ensuring accurate availability without manual updates.
- **Match Request System**: The match request and communication system provides a formal, course‑organized process for joining teams. Students can send a join request to any team with an open seat, attaching a short message explaining their background or asking specific questions. Team leaders receive these requests in an organized notification inbox and can choose to accept or reject the request. This prevents the lost of messages and informal miscommunication that happens on Discord or GroupMe.
- **Comprehensive user profiles**: Each student has a detailed profile showing photos, skills, major, year, the past requests and matches, and historical collaboration score across different UIUC courses. 
This allow students to evaluate compatibility before collaborating. 

**Limitations regarding usefulness**
- **Inconvenience for ongoing communication**: While students can communicate through match requests and post comments, the platform currently does not support private messaging between users. This limits the ability for students to have ongoing, one-on-one conversations and may require them to rely on external tools for detailed coordination. Repeated discussions about roles or schedules can therefore become inconvenient.  
- **Lack of keyword Search**: The platform organizes all features strictly around courses and sections. The posts system only supports course-based search, instead of keyword search. That restricts interactions between different classes but of the similar contents. 

### Schema change

The schema is the same as our design in the stage 2.

### ER diagram and table implementation change

The table implementation is the same as the design in our UML diagram. 

### Functionality changes

**Functionalities Added:**
- **Popular Course and Post Feature**: On the home search page, we implemented a "Popular Posts" section that displays posts most viewed, alongside a "Popular Courses" tab that highlights courses with the most activity. This allows students to quickly identify trending discussions and high-interest courses, helping them discover teammates and projects that are currently active or widely engaging.

**Functionalities Not Implemented:**
- **Integration of Machine Learning Algorithm**: The platform does not currently integrate the machine learning algorithm into the matching process, including using skill and interest matches and synergy scores calculation.
- **Interactive Team Dashboard**: Visualization features like drag-and-drop team management and visual heatmaps of team activity were not implementeded. While these could enhance the user experience and make team formation more visually engaging, they were considered lower priority compared to ensuring reliable and accurate core functionality.   

Although these advanced functionalities were not implemented due to time and resources constraints, the platform prioritizes robust database design, and seamless fundamental workflows. This provides smooth and reliable user experience even without the more visually sophisticated features.

## Advanced database features

Our application incorporates several advanced database features that complement and enhance the platform:

### **Transactions**
We utilized numerous advanced queries during the implementation of the database functionality. We list two of the transactions here. 
- This query retrieves popular posts along with their author, team, course, and section details, and counts the number of join requests and comments for each post, filtering only open or unassigned teams and ordering by popularity and recency.
```sql
SELECT 
        p.post_id,
        p.title,
        p.content,
        p.created_at,
        t.target_size AS target_team_size,
        u.display_name AS author_name,
        c.title AS course_title,
        c.subject AS course_subject,
        c.number AS course_number,
        s.crn AS section_code,
        c.term_id,
        COUNT(DISTINCT mr.request_id) AS request_count,  # 聚合
        COUNT(DISTINCT cm.comment_id) AS comment_count,  # 聚合
        0 AS view_count,
        t.status
    FROM Post p
    LEFT JOIN User u ON p.user_id = u.user_id           # JOIN 1
    LEFT JOIN Team t ON p.team_id = t.team_id           # JOIN 2
    LEFT JOIN Course c ON t.course_id = c.course_id     # JOIN 3
    LEFT JOIN Section s ON t.section_id = s.crn AND t.course_id = c.course_id  # JOIN 4
    LEFT JOIN MatchRequest mr ON p.post_id = mr.post_id # JOIN 5
    LEFT JOIN Comment cm ON p.post_id = cm.comment_id   # JOIN 6
    WHERE (t.status IS NULL OR t.status = 'open')
    GROUP BY p.post_id, p.title, p.content, p.created_at, t.target_size,  # GROUP BY
             u.display_name, c.title, c.subject, c.number, s.crn, c.term_id, t.status
    ORDER BY request_count DESC, comment_count DESC, p.created_at DESC
    LIMIT %s
```
- Get the course information and the total number of sections associated with it. 
```sql
SELECT 
    c.course_id,
    c.subject,
    c.number,
    c.title,
    COUNT(s.crn) as section_count
FROM Course c
LEFT JOIN Section s ON c.course_id = s.course_id
WHERE c.course_id = %s
GROUP BY c.course_id, c.subject, c.number, c.title
```

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
FOREIGN KEY (name) REFERENCES Table(name)
```

## Technical challenges and advice
**Ning Wei (ningwei3)**  
One major challenge we faced was ensuring that our backend could reliably connect to the database hosted on Google Cloud Platform (GCP). A Cloud SQL instance lives inside a controlled network environment. The backend cannot connect unless your client machine or server has an approved IP address. This resulted in significant time spent connecting everyone to the backend, and required extensive team communication. Our recommendation is to get this step right before starting the design and always remember to maintain effective team communication.

**Jack Jiang (jackj6)**  
Another significant challenge was synthetic data generation that required to be consistent to the real data. Our database contained many interconnected tables linked by foreign keys. Almost each of our table contains a foreign key. Because of these dependencies, generating synthetic data was not as simple as inserting random rows. Every insertion had to follow strict relational rules. The mistakes in data are fatal, as it becomes extremely difficult to identify errors in the subsequent functional design. We have repeatedly tested and verified the accuracy of our data and dependencies. This is exactly what we recommend.

**Lixuan Gu (lixuang2)**  
One major challenge we faced on the frontend was managing asynchronous state updates across multiple pages, such as notifications, user profiles, and team details. Rapid user actions or dependent API calls often caused stale or inconsistent UI states, making it difficult to ensure that all components reflected the latest backend data. We add global processing state prevents duplicate clicks while a request is in progress. We strongly recommend paying close attention to concurrent requests.

**Yanlin Tao (tao17)**  
One of the technical challenge we met is the cross platform environment setup as I am a Windows system while my teammates are all MacOS. Many of the shell scripts behaved differently across these platforms due to differences in path formats, executable permissions, and default shell behavior. The environemnt setup and the frontend-backend connection is also different. Our advice is to create a containerized environments for better consistency.

## Future work
- **Skills Matching Algorithm Implementation**  
We could complete the skill matching algorithm, which integrates deep learning or LLM to review skill overlap, skill levels, and required vs. possessed skills. The ideal implementation is to generate a "synergy scores", considering collaboration preferences, skill match and work styles. This creates a more personalized user experience. 

- **Reputation and Feedback System**  
We would create a more comprehensive system for feedback. We may develop a weighted scoring algorithm to adjust user's collaboration score and provide peer evaluation of each aspects of the team worker. This may allow other students to track the historical performance of their potential team member over time and avoid free riders. 

- **Communication System**  
Current communications are delivered mainly through posts, comments, and match request, which are either short or public message. In the future work, our platform will implement a direct message system to support more private one-to-one ongoing conversations. We may also update the notification part according the messages preference. 


## Division of Labor
- **Ning Wei (ningwei3)**: GCP database and environment setup, backend CRUD management and debugging
- **Jack Jiang (jackj6)**: synthetic data design, backend–frontend API connections, final video recording 
- **Lixuan Gu (lixuang2)**: frontend tab layout and main UI components, integration of frontend features with backend logic 
- **Yanlin Tao (tao17)**: real data design, advanced database logic, writing design and report documents

Overall, the team collaboration is very effective. Each member takes different components at each stage and maintain well communication through weekly meetings. All the responsibilities are well divided, and the communication is smooth. 