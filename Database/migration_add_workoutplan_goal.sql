-- =============================================================================
-- MIGRATION: BỔ SUNG CỘT GOAL VÀ STORED PROCEDURES CHO GỢI Ý LỊCH TẬP CÁ NHÂN HÓA
-- =============================================================================

USE QuanLyLichTapGym;

-- 1. Bổ sung an toàn cột goal vào WorkoutPlans nếu chưa tồn tại
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'WorkoutPlans'
      AND COLUMN_NAME = 'goal'
);

SET @sql_add_col = IF(
    @col_exists = 0,
    'ALTER TABLE WorkoutPlans ADD COLUMN goal VARCHAR(255) NULL AFTER level',
    'SELECT "Column goal already exists in WorkoutPlans" AS info'
);

PREPARE stmt_col FROM @sql_add_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- 2. Cập nhật goal cho các lịch tập mẫu (isTemplate = TRUE) hiện có
UPDATE WorkoutPlans
SET goal = 'GENERAL_FITNESS'
WHERE title = 'Beginner Full Body 3 Days' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'MUSCLE_GAIN'
WHERE title = 'Upper Lower 4 Days' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'MUSCLE_GAIN'
WHERE title = 'Push Pull Legs 6 Days' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'FAT_LOSS'
WHERE title = 'Push Pull Legs 3 Days' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'STRENGTH'
WHERE title = 'Upper Lower Strength 4 Days' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'MUSCLE_GAIN'
WHERE title = 'Hypertrophy 5 Days' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'STRENGTH'
WHERE title = 'Strength Foundation 3 Days' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'MUSCLE_GAIN'
WHERE title = 'Advanced Push Pull Legs' AND isTemplate = TRUE;

UPDATE WorkoutPlans
SET goal = 'GENERAL_FITNESS'
WHERE title = 'QA_Split' AND isTemplate = TRUE;


-- 3. Hàm chuẩn hóa mục tiêu fn_NormalizeGoal
DROP FUNCTION IF EXISTS fn_NormalizeGoal;

DELIMITER $$

CREATE FUNCTION fn_NormalizeGoal(p_goal VARCHAR(255))
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE v_clean VARCHAR(255);
    IF p_goal IS NULL OR TRIM(p_goal) = '' THEN
        RETURN NULL;
    END IF;

    SET v_clean = LOWER(TRIM(p_goal));

    -- MUSCLE_GAIN: Tăng cơ
    IF v_clean = 'muscle_gain'
       OR v_clean LIKE '%tăng cơ%'
       OR v_clean LIKE '%tang co%'
       OR v_clean LIKE '%bulking%'
       OR v_clean LIKE '%build_muscle%' THEN
        RETURN 'MUSCLE_GAIN';
    END IF;

    -- FAT_LOSS: Giảm mỡ
    IF v_clean = 'fat_loss'
       OR v_clean LIKE '%giảm mỡ%'
       OR v_clean LIKE '%giam mo%'
       OR v_clean LIKE '%cutting%'
       OR v_clean LIKE '%gi?m m?%' THEN
        RETURN 'FAT_LOSS';
    END IF;

    -- STRENGTH: Tăng sức mạnh
    IF v_clean = 'strength'
       OR v_clean LIKE '%sức mạnh%'
       OR v_clean LIKE '%suc manh%'
       OR v_clean LIKE '%tăng sức mạnh%'
       OR v_clean LIKE '%tang s?c m?nh%' THEN
        RETURN 'STRENGTH';
    END IF;

    -- GENERAL_FITNESS: Cải thiện thể lực / Sức bền / Sức khỏe
    IF v_clean = 'general_fitness'
       OR v_clean LIKE '%thể lực%'
       OR v_clean LIKE '%the luc%'
       OR v_clean LIKE '%sức khỏe%'
       OR v_clean LIKE '%suc khoe%'
       OR v_clean LIKE '%sức bền%'
       OR v_clean LIKE '%suc ben%'
       OR v_clean LIKE '%endurance%'
       OR v_clean LIKE '%fitness%'
       OR v_clean LIKE '%c?i thi?n%'
       OR v_clean LIKE '%thi đấu%' THEN
        RETURN 'GENERAL_FITNESS';
    END IF;

    RETURN 'OTHER';
END $$

DELIMITER ;


-- 4. Cập nhật sp_GetWorkoutPlanTemplates (bổ sung cột goal)
DROP PROCEDURE IF EXISTS sp_GetWorkoutPlanTemplates;

DELIMITER $$

CREATE PROCEDURE sp_GetWorkoutPlanTemplates()
BEGIN
    SELECT
        wp.planId,
        wp.title,
        wp.description,
        wp.level,
        wp.goal,
        wp.durationWeeks,
        wp.isTemplate,
        wp.creatorId,
        wp.createdAt,
        COUNT(DISTINCT wd.dayId) AS totalDays
    FROM WorkoutPlans wp
    LEFT JOIN WorkoutDays wd
        ON wd.planId = wp.planId
    WHERE wp.isTemplate = TRUE
    GROUP BY
        wp.planId,
        wp.title,
        wp.description,
        wp.level,
        wp.goal,
        wp.durationWeeks,
        wp.isTemplate,
        wp.creatorId,
        wp.createdAt
    ORDER BY wp.createdAt DESC;
END $$

DELIMITER ;


-- 5. Cập nhật sp_GetWorkoutPlanDetail (bổ sung cột goal vào Result Set 1)
DROP PROCEDURE IF EXISTS sp_GetWorkoutPlanDetail;

DELIMITER $$

CREATE PROCEDURE sp_GetWorkoutPlanDetail(
    IN p_planId INT
)
BEGIN
    -- Kiểm tra Plan
    IF NOT EXISTS (
        SELECT 1
        FROM WorkoutPlans
        WHERE planId = p_planId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chương trình không tồn tại';
    END IF;

    -- RESULT SET 1: Thông tin Plan (đã có goal)
    SELECT
        wp.planId,
        wp.title,
        wp.description,
        wp.creatorId,
        wp.isTemplate,
        wp.level,
        wp.goal,
        wp.durationWeeks,
        wp.createdAt,
        COUNT(DISTINCT wd.dayId) AS totalDays
    FROM WorkoutPlans wp
    LEFT JOIN WorkoutDays wd
        ON wd.planId = wp.planId
    WHERE wp.planId = p_planId
    GROUP BY
        wp.planId,
        wp.title,
        wp.description,
        wp.creatorId,
        wp.isTemplate,
        wp.level,
        wp.goal,
        wp.durationWeeks,
        wp.createdAt;

    -- RESULT SET 2: Days + Exercises (giữ nguyên cấu trúc)
    SELECT
        wd.dayId,
        wd.dayName,
        wd.`order` AS dayOrder,
        wd.weekDay,
        ec.configId,
        ec.exerciseId,
        ec.sets,
        ec.reps,
        ec.restTime,
        ec.`order` AS exerciseOrder,
        e.name AS exerciseName,
        e.description AS exerciseDescription,
        e.difficulty
    FROM WorkoutDays wd
    LEFT JOIN ExerciseConfigs ec
        ON ec.dayId = wd.dayId
    LEFT JOIN Exercises e
        ON e.exerciseId = ec.exerciseId
    WHERE wd.planId = p_planId
    ORDER BY
        wd.`order`,
        ec.`order`;

    -- RESULT SET 3: Media (giữ nguyên cấu trúc)
    SELECT DISTINCT
        em.mediaId,
        em.exerciseId,
        em.mediaUrl,
        em.publicId,
        em.mediaType,
        em.sortOrder,
        em.createdAt
    FROM WorkoutDays wd
    INNER JOIN ExerciseConfigs ec
        ON ec.dayId = wd.dayId
    INNER JOIN ExerciseMedia em
        ON em.exerciseId = ec.exerciseId
    WHERE wd.planId = p_planId
    ORDER BY
        em.exerciseId,
        em.sortOrder,
        em.mediaId;
END $$

DELIMITER ;


-- 6. Cập nhật sp_CreateWorkoutPlan (hỗ trợ lưu goal)
DROP PROCEDURE IF EXISTS sp_CreateWorkoutPlan;

DELIMITER $$

CREATE PROCEDURE sp_CreateWorkoutPlan(
    IN p_title VARCHAR(150),
    IN p_description TEXT,
    IN p_creatorId INT,
    IN p_isTemplate BOOLEAN,
    IN p_level VARCHAR(20),
    IN p_durationWeeks INT,
    IN p_goal VARCHAR(255)
)
BEGIN
    DECLARE v_planId INT;

    IF p_title IS NULL OR TRIM(p_title) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tên chương trình không được để trống';
    END IF;

    IF p_level NOT IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trình độ không hợp lệ';
    END IF;

    IF p_durationWeeks IS NULL OR p_durationWeeks <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số tuần của chương trình phải lớn hơn 0';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM Accounts
        WHERE accountId = p_creatorId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người tạo chương trình không tồn tại';
    END IF;

    INSERT INTO WorkoutPlans (
        title,
        description,
        creatorId,
        isTemplate,
        level,
        durationWeeks,
        goal
    )
    VALUES (
        TRIM(p_title),
        p_description,
        p_creatorId,
        p_isTemplate,
        p_level,
        p_durationWeeks,
        TRIM(p_goal)
    );

    SET v_planId = LAST_INSERT_ID();

    SELECT
        v_planId AS planId,
        'Tạo chương trình thành công' AS message;
END $$

DELIMITER ;


-- 7. Cập nhật sp_UpdateWorkoutPlan (hỗ trợ cập nhật goal)
DROP PROCEDURE IF EXISTS sp_UpdateWorkoutPlan;

DELIMITER $$

CREATE PROCEDURE sp_UpdateWorkoutPlan(
    IN p_planId INT,
    IN p_title VARCHAR(150),
    IN p_description TEXT,
    IN p_level VARCHAR(20),
    IN p_isTemplate BOOLEAN,
    IN p_durationWeeks INT,
    IN p_goal VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM WorkoutPlans
        WHERE planId = p_planId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chương trình không tồn tại';
    END IF;

    IF p_title IS NULL OR TRIM(p_title) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tên chương trình không được để trống';
    END IF;

    IF p_level NOT IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trình độ không hợp lệ';
    END IF;

    IF p_durationWeeks IS NULL OR p_durationWeeks <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số tuần của chương trình phải lớn hơn 0';
    END IF;

    UPDATE WorkoutPlans
    SET
        title = TRIM(p_title),
        description = p_description,
        level = p_level,
        durationWeeks = p_durationWeeks,
        isTemplate = p_isTemplate,
        goal = TRIM(p_goal)
    WHERE planId = p_planId;

    SELECT
        p_planId AS planId,
        'Cập nhật chương trình thành công' AS message;
END $$

DELIMITER ;


-- 8. Cập nhật sp_GetUserActivePlan (bổ sung cột goal)
DROP PROCEDURE IF EXISTS sp_GetUserActivePlan;

DELIMITER $$

CREATE PROCEDURE sp_GetUserActivePlan(
    IN p_profileId INT
)
BEGIN
    SELECT
        wp.planId,
        wp.title,
        wp.description,
        wp.level,
        wp.goal,
        wp.durationWeeks,
        guwp.joinedAt,
        guwp.startedAt,
        guwp.status,
        COUNT(DISTINCT wd.dayId) AS totalDays,
        CASE
            WHEN guwp.startedAt IS NULL THEN 1
            ELSE LEAST(
                wp.durationWeeks,
                TIMESTAMPDIFF(WEEK, guwp.startedAt, CURDATE()) + 1
            )
        END AS currentWeek,
        (
            SELECT COUNT(*)
            FROM WorkoutSessions ws
            WHERE ws.profileId = p_profileId
              AND ws.status = 'COMPLETED'
              AND YEARWEEK(ws.startTime, 1) = YEARWEEK(CURDATE(), 1)
        ) AS completedThisWeek
    FROM GymUserWorkoutPlans guwp
    INNER JOIN WorkoutPlans wp
        ON wp.planId = guwp.planId
    LEFT JOIN WorkoutDays wd
        ON wd.planId = wp.planId
    WHERE guwp.profileId = p_profileId
      AND guwp.status = 'ACTIVE'
    GROUP BY
        wp.planId,
        wp.title,
        wp.description,
        wp.level,
        wp.goal,
        wp.durationWeeks,
        guwp.joinedAt,
        guwp.startedAt,
        guwp.status
    ORDER BY guwp.joinedAt DESC
    LIMIT 1;
END $$

DELIMITER ;


-- 9. STORED PROCEDURE MỚI: sp_GetRecommendedWorkoutPlans
-- Gợi ý lịch tập cá nhân hóa theo quy tắc Rule-Based (Level 40%, Goal 35%, Sessions 25%)
DROP PROCEDURE IF EXISTS sp_GetRecommendedWorkoutPlans;

DELIMITER $$

CREATE PROCEDURE sp_GetRecommendedWorkoutPlans(
    IN p_profileId INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_hasActivePlan INT DEFAULT 0;
    DECLARE v_userLevel VARCHAR(20);
    DECLARE v_userGoal VARCHAR(255);
    DECLARE v_userSessions INT;
    DECLARE v_normUserGoal VARCHAR(50);
    DECLARE v_userLevelNum INT;

    -- 1. Kiểm tra tồn tại người dùng
    SELECT COUNT(*), MAX(level), MAX(goal), MAX(sessionsPerWeek)
    INTO v_exists, v_userLevel, v_userGoal, v_userSessions
    FROM GymUsers
    WHERE profileId = p_profileId;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người dùng không tồn tại';
    END IF;

    -- 2. Kiểm tra nếu người dùng ĐÃ CÓ lịch tập ACTIVE
    SELECT COUNT(*)
    INTO v_hasActivePlan
    FROM GymUserWorkoutPlans
    WHERE profileId = p_profileId
      AND status = 'ACTIVE';

    IF v_hasActivePlan > 0 THEN
        -- Trả về status HAS_ACTIVE_PLAN để client không hiển thị gợi ý
        SELECT 'HAS_ACTIVE_PLAN' AS status, 'Người dùng đã có lịch tập đang hoạt động' AS message;
    ELSE
        -- 3. Kiểm tra hồ sơ hoàn chỉnh (level, goal, sessionsPerWeek)
        IF v_userLevel IS NULL
           OR v_userGoal IS NULL
           OR TRIM(v_userGoal) = ''
           OR v_userSessions IS NULL
           OR v_userSessions <= 0 THEN
            SELECT
                'PROFILE_INCOMPLETE' AS status,
                'Người dùng chưa hoàn thiện hồ sơ tập luyện (thiếu mục tiêu hoặc số buổi tập)' AS message;
        ELSE
            -- 4. Chuẩn bị tham số tính điểm
            SET v_normUserGoal = fn_NormalizeGoal(v_userGoal);
            SET v_userLevelNum = CASE v_userLevel
                WHEN 'BEGINNER' THEN 1
                WHEN 'INTERMEDIATE' THEN 2
                WHEN 'ADVANCED' THEN 3
                ELSE 1
            END;

            -- Result Set 1: Báo trạng thái SUCCESS
            SELECT 'SUCCESS' AS status, 'Gợi ý lịch tập thành công' AS message;

            -- Result Set 2: Danh sách lịch tập gợi ý tối đa 3 lịch tập
            SELECT
                scored.planId,
                scored.title,
                scored.description,
                scored.level,
                scored.goal,
                scored.durationWeeks,
                scored.totalDays,
                scored.matchScore,
                scored.recommendReason
            FROM (
                SELECT
                    wp.planId,
                    wp.title,
                    wp.description,
                    wp.level,
                    wp.goal,
                    wp.durationWeeks,
                    COUNT(DISTINCT wd.dayId) AS totalDays,

                    -- Tính điểm tổng hợp (thang 100)
                    (
                        -- A. Điểm Level (Tối đa 40)
                        (CASE
                            WHEN wp.level = v_userLevel THEN 40
                            WHEN (v_userLevelNum = 2 AND wp.level = 'BEGINNER') OR (v_userLevelNum = 3 AND wp.level = 'INTERMEDIATE') THEN 25
                            WHEN (v_userLevelNum = 2 AND wp.level = 'ADVANCED') THEN 20
                            WHEN (v_userLevelNum = 1 AND wp.level = 'INTERMEDIATE') THEN 15
                            WHEN (v_userLevelNum = 3 AND wp.level = 'BEGINNER') THEN 10
                            ELSE 0
                        END)
                        +
                        -- B. Điểm Goal (Tối đa 35)
                        (CASE
                            WHEN wp.goal IS NULL OR fn_NormalizeGoal(wp.goal) = 'OTHER' THEN 10
                            WHEN fn_NormalizeGoal(wp.goal) = v_normUserGoal THEN 35
                            WHEN (v_normUserGoal = 'MUSCLE_GAIN' AND fn_NormalizeGoal(wp.goal) = 'STRENGTH')
                              OR (v_normUserGoal = 'STRENGTH' AND fn_NormalizeGoal(wp.goal) = 'MUSCLE_GAIN') THEN 20
                            WHEN (v_normUserGoal = 'FAT_LOSS' AND fn_NormalizeGoal(wp.goal) = 'GENERAL_FITNESS')
                              OR (v_normUserGoal = 'GENERAL_FITNESS' AND fn_NormalizeGoal(wp.goal) = 'FAT_LOSS') THEN 20
                            WHEN (v_normUserGoal = 'MUSCLE_GAIN' AND fn_NormalizeGoal(wp.goal) = 'GENERAL_FITNESS')
                              OR (v_normUserGoal = 'GENERAL_FITNESS' AND fn_NormalizeGoal(wp.goal) = 'MUSCLE_GAIN') THEN 15
                            WHEN (v_normUserGoal = 'FAT_LOSS' AND fn_NormalizeGoal(wp.goal) = 'MUSCLE_GAIN')
                              OR (v_normUserGoal = 'MUSCLE_GAIN' AND fn_NormalizeGoal(wp.goal) = 'FAT_LOSS') THEN 10
                            WHEN (v_normUserGoal = 'STRENGTH' AND fn_NormalizeGoal(wp.goal) = 'FAT_LOSS')
                              OR (v_normUserGoal = 'FAT_LOSS' AND fn_NormalizeGoal(wp.goal) = 'STRENGTH') THEN 5
                            ELSE 5
                        END)
                        +
                        -- C. Điểm SessionsPerWeek (Tối đa 25)
                        (CASE
                            WHEN ABS(v_userSessions - COUNT(DISTINCT wd.dayId)) = 0 THEN 25
                            WHEN ABS(v_userSessions - COUNT(DISTINCT wd.dayId)) = 1 THEN 18
                            WHEN ABS(v_userSessions - COUNT(DISTINCT wd.dayId)) = 2 THEN 8
                            ELSE 0
                        END)
                    ) AS matchScore,

                    -- Lý do gợi ý
                    CONCAT(
                        CASE
                            WHEN wp.level = v_userLevel AND ABS(v_userSessions - COUNT(DISTINCT wd.dayId)) = 0 AND fn_NormalizeGoal(wp.goal) = v_normUserGoal
                                THEN 'Khớp hoàn hảo: Cùng trình độ, đúng số buổi và khớp mục tiêu.'
                            WHEN fn_NormalizeGoal(wp.goal) = v_normUserGoal AND wp.level = v_userLevel
                                THEN CONCAT('Phù hợp mục tiêu ', CASE fn_NormalizeGoal(wp.goal) WHEN 'MUSCLE_GAIN' THEN 'Tăng cơ' WHEN 'FAT_LOSS' THEN 'Giảm mỡ' WHEN 'STRENGTH' THEN 'Tăng sức mạnh' ELSE 'Thể lực' END, ' ở trình độ ', wp.level, '.')
                            WHEN ABS(v_userSessions - COUNT(DISTINCT wd.dayId)) = 0 AND wp.level = v_userLevel
                                THEN CONCAT('Tối ưu cho thời gian ', v_userSessions, ' buổi/tuần ở trình độ ', wp.level, '.')
                            WHEN fn_NormalizeGoal(wp.goal) = v_normUserGoal
                                THEN CONCAT('Đúng mục tiêu ', CASE fn_NormalizeGoal(wp.goal) WHEN 'MUSCLE_GAIN' THEN 'Tăng cơ' WHEN 'FAT_LOSS' THEN 'Giảm mỡ' WHEN 'STRENGTH' THEN 'Tăng sức mạnh' ELSE 'Thể lực' END, ' mong muốn.')
                            ELSE CONCAT('Giáo án nền tảng phù hợp với tần suất ', COUNT(DISTINCT wd.dayId), ' buổi/tuần.')
                        END
                    ) AS recommendReason

                FROM WorkoutPlans wp
                LEFT JOIN WorkoutDays wd
                    ON wd.planId = wp.planId
                WHERE wp.isTemplate = TRUE
                  -- Điều kiện an toàn: BEGINNER không gợi ý ADVANCED
                  AND NOT (v_userLevelNum = 1 AND wp.level = 'ADVANCED')
                  -- Có bài tập cấu hình
                  AND EXISTS (
                      SELECT 1
                      FROM ExerciseConfigs ec
                      JOIN WorkoutDays d ON d.dayId = ec.dayId
                      WHERE d.planId = wp.planId
                  )
                GROUP BY
                    wp.planId,
                    wp.title,
                    wp.description,
                    wp.level,
                    wp.goal,
                    wp.durationWeeks
                -- Lọc chênh lệch quá lớn (>= 3 buổi)
                HAVING ABS(v_userSessions - totalDays) <= 2
                   AND matchScore >= 50
            ) AS scored
            ORDER BY
                scored.matchScore DESC,
                (scored.level = v_userLevel) DESC,
                ABS(v_userSessions - scored.totalDays) ASC,
                scored.planId ASC
            LIMIT 3;

        END IF;
    END IF;
END $$

DELIMITER ;
