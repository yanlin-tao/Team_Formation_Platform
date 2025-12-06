DELIMITER //

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

DELIMITER ;

