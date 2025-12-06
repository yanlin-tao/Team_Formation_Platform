DELIMITER //

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

DELIMITER ;

DELIMITER //

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

DELIMITER ;

DELIMITER //

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

DELIMITER ;

DELIMITER //

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

DELIMITER ;

