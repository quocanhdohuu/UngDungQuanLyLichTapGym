-- GYMFORLIFE: Dashboard date filtering, phase 2 (review before running).
-- Replaces four existing dashboard procedures and creates the missing activity procedure.
-- No table/data changes. Approved for execution by the user.
-- IMPORTANT: signatures change; deploy together with the dashboard API update.
-- Dates are calendar dates in Asia/Ho_Chi_Minh (UTC+07:00), matching existing
-- DATETIME values. Do not convert those values to UTC again.
-- Both dates NULL = ALL. Otherwise both required; endDate is inclusive.
-- Exercise totals and totalUsers retain their current-system meaning.
-- Growth zero buckets are filled by the backend using the requested range.

USE QuanLyLichTapGym;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_GetDashboardSummary$$
CREATE PROCEDURE sp_GetDashboardSummary(
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE v_endExclusive DATETIME;

    IF (p_startDate IS NULL) <> (p_endDate IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Both dates are required, or both NULL for ALL';
    END IF;
    IF p_startDate IS NOT NULL AND (
        p_startDate < '1000-01-01' OR p_endDate > '9999-12-30'
        OR MONTH(p_startDate) = 0 OR DAY(p_startDate) = 0
        OR MONTH(p_endDate) = 0 OR DAY(p_endDate) = 0
        OR LAST_DAY(p_startDate) IS NULL OR LAST_DAY(p_endDate) IS NULL
        OR DAY(p_startDate) > DAY(LAST_DAY(p_startDate))
        OR DAY(p_endDate) > DAY(LAST_DAY(p_endDate))
        OR p_startDate > p_endDate
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid date range';
    END IF;
    SET v_endExclusive = DATE_ADD(p_endDate, INTERVAL 1 DAY);

    SELECT
        (SELECT COUNT(*) FROM GymUsers) AS totalUsers,
        (SELECT COUNT(*) FROM Exercises) AS totalExercises,
        (
            SELECT COUNT(*) FROM WorkoutPlans wp
            WHERE wp.isTemplate = TRUE
              AND (p_startDate IS NULL OR wp.createdAt >= p_startDate)
              AND (v_endExclusive IS NULL OR wp.createdAt < v_endExclusive)
        ) AS totalWorkoutTemplates,
        (
            SELECT COUNT(*) FROM Accounts a
            INNER JOIN GymUsers gu ON gu.accountId = a.accountId
            WHERE a.role = 'GYM_USER'
              AND (p_startDate IS NULL OR a.createdAt >= p_startDate)
              AND (v_endExclusive IS NULL OR a.createdAt < v_endExclusive)
        ) AS newUsersThisMonth,
        (
            -- Preserve existing summary semantics: all session statuses.
            SELECT COUNT(*) FROM WorkoutSessions ws
            WHERE (p_startDate IS NULL OR ws.startTime >= p_startDate)
              AND (v_endExclusive IS NULL OR ws.startTime < v_endExclusive)
        ) AS workoutSessionsThisMonth;
END$$

DROP PROCEDURE IF EXISTS sp_GetDashboardUserGrowth$$
CREATE PROCEDURE sp_GetDashboardUserGrowth(
    IN p_startDate DATE,
    IN p_endDate DATE,
    IN p_groupBy VARCHAR(5)
)
BEGIN
    DECLARE v_endExclusive DATETIME;
    DECLARE v_keyFormat VARCHAR(10);
    DECLARE v_labelFormat VARCHAR(10);

    IF (p_startDate IS NULL) <> (p_endDate IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Both dates are required, or both NULL for ALL';
    END IF;
    IF p_startDate IS NOT NULL AND (
        p_startDate < '1000-01-01' OR p_endDate > '9999-12-30'
        OR MONTH(p_startDate) = 0 OR DAY(p_startDate) = 0
        OR MONTH(p_endDate) = 0 OR DAY(p_endDate) = 0
        OR LAST_DAY(p_startDate) IS NULL OR LAST_DAY(p_endDate) IS NULL
        OR DAY(p_startDate) > DAY(LAST_DAY(p_startDate))
        OR DAY(p_endDate) > DAY(LAST_DAY(p_endDate))
        OR p_startDate > p_endDate
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid date range';
    END IF;
    IF p_groupBy IS NULL OR BINARY p_groupBy NOT IN ('DAY', 'MONTH') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'groupBy must be DAY or MONTH';
    END IF;
    SET v_endExclusive = DATE_ADD(p_endDate, INTERVAL 1 DAY);
    SET v_keyFormat = IF(p_groupBy = 'DAY', '%Y-%m-%d', '%Y-%m');
    SET v_labelFormat = IF(p_groupBy = 'DAY', '%d/%m/%Y', '%m/%Y');

    -- Keep existing field names for API compatibility, including daily mode.
    SELECT
        DATE_FORMAT(a.createdAt, v_keyFormat) AS monthKey,
        DATE_FORMAT(a.createdAt, v_labelFormat) AS monthLabel,
        COUNT(*) AS totalUsers
    FROM Accounts a
    INNER JOIN GymUsers gu ON gu.accountId = a.accountId
    WHERE a.role = 'GYM_USER'
      AND (p_startDate IS NULL OR a.createdAt >= p_startDate)
      AND (v_endExclusive IS NULL OR a.createdAt < v_endExclusive)
    GROUP BY monthKey, monthLabel
    ORDER BY monthKey ASC;
END$$

DROP PROCEDURE IF EXISTS sp_GetDashboardRecentUsers$$
CREATE PROCEDURE sp_GetDashboardRecentUsers(
    IN p_limit INT,
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE v_endExclusive DATETIME;

    IF (p_startDate IS NULL) <> (p_endDate IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Both dates are required, or both NULL for ALL';
    END IF;
    IF p_startDate IS NOT NULL AND (
        p_startDate < '1000-01-01' OR p_endDate > '9999-12-30'
        OR MONTH(p_startDate) = 0 OR DAY(p_startDate) = 0
        OR MONTH(p_endDate) = 0 OR DAY(p_endDate) = 0
        OR LAST_DAY(p_startDate) IS NULL OR LAST_DAY(p_endDate) IS NULL
        OR DAY(p_startDate) > DAY(LAST_DAY(p_startDate))
        OR DAY(p_endDate) > DAY(LAST_DAY(p_endDate))
        OR p_startDate > p_endDate
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid date range';
    END IF;
    SET v_endExclusive = DATE_ADD(p_endDate, INTERVAL 1 DAY);
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 5;
    END IF;

    SELECT
        gu.profileId, a.accountId, gu.fullName, a.username, a.email,
        gu.gender, gu.level, a.status AS accountStatus, a.createdAt
    FROM GymUsers gu
    INNER JOIN Accounts a ON a.accountId = gu.accountId
    WHERE a.role = 'GYM_USER'
      AND (p_startDate IS NULL OR a.createdAt >= p_startDate)
      AND (v_endExclusive IS NULL OR a.createdAt < v_endExclusive)
    ORDER BY a.createdAt DESC
    LIMIT p_limit;
END$$

DROP PROCEDURE IF EXISTS sp_GetDashboardRecentWorkoutTemplates$$
CREATE PROCEDURE sp_GetDashboardRecentWorkoutTemplates(
    IN p_limit INT,
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE v_endExclusive DATETIME;

    IF (p_startDate IS NULL) <> (p_endDate IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Both dates are required, or both NULL for ALL';
    END IF;
    IF p_startDate IS NOT NULL AND (
        p_startDate < '1000-01-01' OR p_endDate > '9999-12-30'
        OR MONTH(p_startDate) = 0 OR DAY(p_startDate) = 0
        OR MONTH(p_endDate) = 0 OR DAY(p_endDate) = 0
        OR LAST_DAY(p_startDate) IS NULL OR LAST_DAY(p_endDate) IS NULL
        OR DAY(p_startDate) > DAY(LAST_DAY(p_startDate))
        OR DAY(p_endDate) > DAY(LAST_DAY(p_endDate))
        OR p_startDate > p_endDate
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid date range';
    END IF;
    SET v_endExclusive = DATE_ADD(p_endDate, INTERVAL 1 DAY);
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 5;
    END IF;

    SELECT
        wp.planId, wp.title, wp.description, wp.level, wp.durationWeeks,
        wp.creatorId, wp.createdAt,
        COUNT(DISTINCT wd.dayId) AS totalDays,
        COUNT(ec.configId) AS totalExercises
    FROM WorkoutPlans wp
    LEFT JOIN WorkoutDays wd ON wd.planId = wp.planId
    LEFT JOIN ExerciseConfigs ec ON ec.dayId = wd.dayId
    WHERE wp.isTemplate = TRUE
      AND (p_startDate IS NULL OR wp.createdAt >= p_startDate)
      AND (v_endExclusive IS NULL OR wp.createdAt < v_endExclusive)
    GROUP BY wp.planId, wp.title, wp.description, wp.level, wp.durationWeeks,
             wp.creatorId, wp.createdAt
    ORDER BY wp.createdAt DESC
    LIMIT p_limit;
END$$

DELIMITER ;

-- Optional manual checks AFTER applying (not run automatically):
-- CALL sp_GetDashboardSummary('2026-10-01', '2026-10-31');
-- CALL sp_GetDashboardSummary(NULL, NULL);
-- CALL sp_GetDashboardUserGrowth('2026-10-01', '2026-10-31', 'DAY');
-- CALL sp_GetDashboardUserGrowth(NULL, NULL, 'MONTH');
-- CALL sp_GetDashboardRecentUsers(5, '2026-10-01', '2026-10-31');
-- CALL sp_GetDashboardRecentWorkoutTemplates(5, '2026-10-01', '2026-10-31');
-- Expected errors:
-- CALL sp_GetDashboardSummary('2026-10-31', '2026-10-01');
-- CALL sp_GetDashboardSummary(NULL, '2026-10-01');
-- CALL sp_GetDashboardUserGrowth('2026-10-01', '2026-10-31', 'WEEK');

-- Missing activity procedure, explicitly approved by the user.
USE QuanLyLichTapGym;
DELIMITER $$
CREATE PROCEDURE sp_GetDashboardWorkoutActivity(
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE v_endExclusive DATETIME;
    IF (p_startDate IS NULL) <> (p_endDate IS NULL) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Both dates are required, or both NULL for ALL';
    END IF;
    IF p_startDate IS NOT NULL AND (
        p_startDate < '1000-01-01' OR p_endDate > '9999-12-30'
        OR MONTH(p_startDate) = 0 OR DAY(p_startDate) = 0
        OR MONTH(p_endDate) = 0 OR DAY(p_endDate) = 0
        OR LAST_DAY(p_startDate) IS NULL OR LAST_DAY(p_endDate) IS NULL
        OR DAY(p_startDate) > DAY(LAST_DAY(p_startDate))
        OR DAY(p_endDate) > DAY(LAST_DAY(p_endDate))
        OR p_startDate > p_endDate
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid date range';
    END IF;
    SET v_endExclusive = DATE_ADD(p_endDate, INTERVAL 1 DAY);
    SELECT DATE_FORMAT(ws.startTime, '%Y-%m-%d') AS date,
           COUNT(*) AS totalSessions,
           COUNT(DISTINCT ws.profileId) AS activeUsers
    FROM WorkoutSessions ws
    WHERE (p_startDate IS NULL OR ws.startTime >= p_startDate)
      AND (v_endExclusive IS NULL OR ws.startTime < v_endExclusive)
    GROUP BY DATE_FORMAT(ws.startTime, '%Y-%m-%d')
    ORDER BY date ASC;
END$$
DELIMITER ;
