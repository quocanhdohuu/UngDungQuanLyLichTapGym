-- Run against the configured gym database.
-- API callers wrap writes in a transaction and lock the GymUsers row first.

-- =====================================================
-- 1. sp_ApplyWorkoutPlanToUser
-- =====================================================
DROP PROCEDURE IF EXISTS sp_ApplyWorkoutPlanToUser;
DELIMITER $$
CREATE PROCEDURE sp_ApplyWorkoutPlanToUser(
    IN p_profileId INT,
    IN p_planId INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM GymUsers WHERE profileId = p_profileId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người dùng không tồn tại';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM WorkoutPlans wp JOIN GymUsers gu ON gu.profileId = p_profileId
        WHERE wp.planId = p_planId AND (wp.isTemplate = TRUE OR wp.creatorId = gu.accountId)) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chương trình tập không tồn tại';
    END IF;

    IF EXISTS (SELECT 1 FROM WorkoutSessions WHERE profileId = p_profileId AND status = 'IN_PROGRESS') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hãy kết thúc buổi tập hiện tại trước khi đổi lịch';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM ExerciseConfigs ec JOIN WorkoutDays wd ON wd.dayId = ec.dayId WHERE wd.planId = p_planId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lịch tập chưa có bài tập';
    END IF;

    -- Deactivate current active plans
    UPDATE GymUserWorkoutPlans
    SET status = 'CANCELLED'
    WHERE profileId = p_profileId AND status = 'ACTIVE';

    -- Insert or update target plan
    INSERT INTO GymUserWorkoutPlans (profileId, planId, joinedAt, startedAt, status)
    VALUES (p_profileId, p_planId, CURRENT_TIMESTAMP, CURDATE(), 'ACTIVE')
    ON DUPLICATE KEY UPDATE
        joinedAt = CURRENT_TIMESTAMP,
        startedAt = CURDATE(),
        status = 'ACTIVE';

    SELECT
        p_planId AS planId,
        p_profileId AS profileId,
        'Áp dụng lịch tập thành công' AS message;
END $$
DELIMITER ;

-- =====================================================
-- 2. sp_StartWorkoutSession
-- =====================================================
DROP PROCEDURE IF EXISTS sp_StartWorkoutSession;
DELIMITER $$
CREATE PROCEDURE sp_StartWorkoutSession(
    IN p_profileId INT,
    IN p_dayId INT
)
BEGIN
    DECLARE v_sessionId INT;

    IF NOT EXISTS (SELECT 1 FROM GymUsers WHERE profileId = p_profileId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người dùng không tồn tại';
    END IF;

    -- Check if an in-progress session already exists
    SELECT workoutSessionId INTO v_sessionId
    FROM WorkoutSessions
    WHERE profileId = p_profileId AND status = 'IN_PROGRESS'
    ORDER BY startTime DESC
    LIMIT 1;

    IF v_sessionId IS NULL THEN
        IF p_dayId IS NULL OR NOT EXISTS (
            SELECT 1 FROM WorkoutDays wd JOIN GymUserWorkoutPlans gp ON gp.planId = wd.planId
            WHERE wd.dayId = p_dayId AND gp.profileId = p_profileId AND gp.status = 'ACTIVE'
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ngày tập không thuộc lịch đang hoạt động';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM ExerciseConfigs WHERE dayId = p_dayId) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ngày tập chưa có bài tập';
        END IF;
        INSERT INTO WorkoutSessions (profileId, dayId, startTime, status)
        VALUES (p_profileId, p_dayId, CURRENT_TIMESTAMP, 'IN_PROGRESS');
        SET v_sessionId = LAST_INSERT_ID();
    END IF;

    SELECT
        ws.workoutSessionId,
        ws.profileId,
        ws.dayId,
        ws.startTime,
        ws.endTime,
        ws.totalDuration,
        ws.status,
        wd.dayName,
        wp.planId,
        wp.title AS planTitle
    FROM WorkoutSessions ws
    LEFT JOIN WorkoutDays wd ON wd.dayId = ws.dayId
    LEFT JOIN WorkoutPlans wp ON wp.planId = wd.planId
    WHERE ws.workoutSessionId = v_sessionId;
END $$
DELIMITER ;

-- =====================================================
-- 3. sp_AddPerformedExercise
-- =====================================================
DROP PROCEDURE IF EXISTS sp_AddPerformedExercise;
DELIMITER $$
CREATE PROCEDURE sp_AddPerformedExercise(
    IN p_workoutSessionId INT,
    IN p_exerciseId INT,
    IN p_originalExerciseId INT
)
BEGIN
    DECLARE v_performedId INT;
    DECLARE v_effectiveOriginalId INT;

    IF NOT EXISTS (SELECT 1 FROM WorkoutSessions WHERE workoutSessionId = p_workoutSessionId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Buổi tập không tồn tại';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM WorkoutSessions WHERE workoutSessionId = p_workoutSessionId AND status = 'IN_PROGRESS') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Buổi tập không ở trạng thái đang tập';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Exercises WHERE exerciseId = p_exerciseId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập không tồn tại';
    END IF;

    SET v_effectiveOriginalId = COALESCE(p_originalExerciseId, p_exerciseId);

    IF p_originalExerciseId IS NOT NULL AND p_originalExerciseId != p_exerciseId THEN
        -- Bài tập thay thế
        IF NOT EXISTS (SELECT 1 FROM Exercises WHERE exerciseId = p_originalExerciseId) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập gốc không tồn tại';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM WorkoutSessions ws
            JOIN ExerciseConfigs ec ON ec.dayId = ws.dayId
            WHERE ws.workoutSessionId = p_workoutSessionId AND ec.exerciseId = p_originalExerciseId
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập gốc không thuộc buổi đang tập';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM ExerciseAlternatives
            WHERE exerciseId = p_originalExerciseId AND alternativeExerciseId = p_exerciseId
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập thay thế không hợp lệ cho bài tập gốc';
        END IF;
    ELSE
        -- Bài tập gốc trong buổi tập
        IF NOT EXISTS (
            SELECT 1 FROM WorkoutSessions ws
            JOIN ExerciseConfigs ec ON ec.dayId = ws.dayId
            WHERE ws.workoutSessionId = p_workoutSessionId AND ec.exerciseId = p_exerciseId
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập không thuộc buổi đang tập';
        END IF;
    END IF;

    -- Reuse the requested exercise only within its original prescription slot.
    SELECT performedExerciseId INTO v_performedId
    FROM PerformedExercises
    WHERE workoutSessionId = p_workoutSessionId
      AND COALESCE(originalExerciseId, exerciseId) = v_effectiveOriginalId
      AND exerciseId = p_exerciseId
    ORDER BY isActive DESC, performedExerciseId DESC
    LIMIT 1;

    IF v_performedId IS NULL THEN
        -- Only an empty record can be repurposed. Saved sets keep their exercise.
        SELECT pe.performedExerciseId INTO v_performedId
        FROM PerformedExercises pe
        WHERE pe.workoutSessionId = p_workoutSessionId
          AND COALESCE(pe.originalExerciseId, pe.exerciseId) = v_effectiveOriginalId
          AND NOT EXISTS (SELECT 1 FROM ExerciseSets es WHERE es.performedExerciseId = pe.performedExerciseId)
        ORDER BY pe.isActive DESC, pe.performedExerciseId DESC
        LIMIT 1;
        IF v_performedId IS NOT NULL THEN
            UPDATE PerformedExercises SET exerciseId = p_exerciseId, isCompleted = FALSE
            WHERE performedExerciseId = v_performedId;
        END IF;
    END IF;

    IF v_performedId IS NULL THEN
        INSERT INTO PerformedExercises (workoutSessionId, exerciseId, originalExerciseId, isSubstituted, isCompleted)
        VALUES (p_workoutSessionId, p_exerciseId, v_effectiveOriginalId, p_exerciseId <> v_effectiveOriginalId, FALSE);
        SET v_performedId = LAST_INSERT_ID();
    END IF;

    UPDATE PerformedExercises
    SET originalExerciseId = v_effectiveOriginalId,
        isSubstituted = (exerciseId <> v_effectiveOriginalId),
        isActive = (performedExerciseId = v_performedId)
    WHERE workoutSessionId = p_workoutSessionId
      AND (COALESCE(originalExerciseId, exerciseId) = v_effectiveOriginalId OR performedExerciseId = v_performedId);

    SELECT
        pe.performedExerciseId,
        pe.workoutSessionId,
        pe.exerciseId,
        pe.originalExerciseId,
        pe.isSubstituted,
        pe.isActive,
        pe.isCompleted,
        e.name AS exerciseName,
        orig.name AS originalExerciseName,
        e.description,
        e.difficulty
    FROM PerformedExercises pe
    JOIN Exercises e ON e.exerciseId = pe.exerciseId
    LEFT JOIN Exercises orig ON orig.exerciseId = pe.originalExerciseId
    WHERE pe.performedExerciseId = v_performedId;
END $$
DELIMITER ;

-- =====================================================
-- 4. sp_AddExerciseSet
-- =====================================================
DROP PROCEDURE IF EXISTS sp_AddExerciseSet;
DELIMITER $$
CREATE PROCEDURE sp_AddExerciseSet(
    IN p_performedExerciseId INT,
    IN p_setNumber INT,
    IN p_weight DECIMAL(6,2),
    IN p_reps INT,
    IN p_preValue DECIMAL(6,2)
)
BEGIN
    DECLARE v_setId INT;

    IF NOT EXISTS (SELECT 1 FROM PerformedExercises WHERE performedExerciseId = p_performedExerciseId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập trong buổi tập không tồn tại';
    END IF;

    IF p_setNumber IS NULL OR p_setNumber <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số thứ tự hiệp phải lớn hơn 0';
    END IF;

    SELECT setId INTO v_setId
    FROM ExerciseSets
    WHERE performedExerciseId = p_performedExerciseId AND setNumber = p_setNumber
    LIMIT 1;

    IF v_setId IS NOT NULL THEN
        UPDATE ExerciseSets
        SET weight = p_weight,
            reps = p_reps,
            preValue = COALESCE(p_preValue, preValue)
        WHERE setId = v_setId;
    ELSE
        INSERT INTO ExerciseSets (performedExerciseId, setNumber, weight, reps, preValue)
        VALUES (p_performedExerciseId, p_setNumber, p_weight, p_reps, p_preValue);
        SET v_setId = LAST_INSERT_ID();
    END IF;

    UPDATE PerformedExercises SET isCompleted = FALSE WHERE performedExerciseId = p_performedExerciseId;
    SELECT * FROM ExerciseSets WHERE setId = v_setId;
END $$
DELIMITER ;

-- =====================================================
-- 5. sp_UpdateExerciseSet
-- =====================================================
DROP PROCEDURE IF EXISTS sp_UpdateExerciseSet;
DELIMITER $$
CREATE PROCEDURE sp_UpdateExerciseSet(
    IN p_setId INT,
    IN p_weight DECIMAL(6,2),
    IN p_reps INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ExerciseSets WHERE setId = p_setId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hiệp tập không tồn tại';
    END IF;

    UPDATE ExerciseSets
    SET weight = p_weight, reps = p_reps
    WHERE setId = p_setId;

    UPDATE PerformedExercises SET isCompleted = FALSE
    WHERE performedExerciseId = (SELECT performedExerciseId FROM ExerciseSets WHERE setId = p_setId);

    SELECT * FROM ExerciseSets WHERE setId = p_setId;
END $$
DELIMITER ;

-- =====================================================
-- 6. sp_DeleteExerciseSet
-- =====================================================
DROP PROCEDURE IF EXISTS sp_DeleteExerciseSet;
DELIMITER $$
CREATE PROCEDURE sp_DeleteExerciseSet(
    IN p_setId INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ExerciseSets WHERE setId = p_setId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hiệp tập không tồn tại';
    END IF;

    UPDATE PerformedExercises SET isCompleted = FALSE
    WHERE performedExerciseId = (SELECT performedExerciseId FROM ExerciseSets WHERE setId = p_setId);
    DELETE FROM ExerciseSets WHERE setId = p_setId;

    SELECT p_setId AS setId, 'Xóa hiệp tập thành công' AS message;
END $$
DELIMITER ;

-- =====================================================
-- 7. sp_CompletePerformedExercise
-- =====================================================
DROP PROCEDURE IF EXISTS sp_CompletePerformedExercise;
DELIMITER $$
CREATE PROCEDURE sp_CompletePerformedExercise(
    IN p_performedExerciseId INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM PerformedExercises WHERE performedExerciseId = p_performedExerciseId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập trong buổi tập không tồn tại';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ExerciseSets WHERE performedExerciseId = p_performedExerciseId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hãy lưu ít nhất một hiệp trước khi hoàn thành bài';
    END IF;
    UPDATE PerformedExercises
    SET isCompleted = TRUE
    WHERE performedExerciseId = p_performedExerciseId;

    SELECT * FROM PerformedExercises WHERE performedExerciseId = p_performedExerciseId;
END $$
DELIMITER ;

-- =====================================================
-- 8. sp_CompleteWorkoutSession
-- =====================================================
DROP PROCEDURE IF EXISTS sp_CompleteWorkoutSession;
DELIMITER $$
CREATE PROCEDURE sp_CompleteWorkoutSession(
    IN p_workoutSessionId INT,
    IN p_totalDuration INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM WorkoutSessions WHERE workoutSessionId = p_workoutSessionId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Buổi tập không tồn tại';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM PerformedExercises pe JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
        WHERE pe.workoutSessionId = p_workoutSessionId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hãy lưu ít nhất một hiệp trước khi kết thúc';
    END IF;
    UPDATE WorkoutSessions
    SET endTime = CURRENT_TIMESTAMP,
        totalDuration = COALESCE(p_totalDuration, TIMESTAMPDIFF(MINUTE, startTime, CURRENT_TIMESTAMP)),
        status = 'COMPLETED'
    WHERE workoutSessionId = p_workoutSessionId;

    SELECT * FROM WorkoutSessions WHERE workoutSessionId = p_workoutSessionId;
END $$
DELIMITER ;

-- =====================================================
-- 9. sp_CancelWorkoutSession
-- =====================================================
DROP PROCEDURE IF EXISTS sp_CancelWorkoutSession;
DELIMITER $$
CREATE PROCEDURE sp_CancelWorkoutSession(
    IN p_workoutSessionId INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM WorkoutSessions WHERE workoutSessionId = p_workoutSessionId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Buổi tập không tồn tại';
    END IF;

    UPDATE WorkoutSessions
    SET endTime = CURRENT_TIMESTAMP,
        status = 'CANCELLED'
    WHERE workoutSessionId = p_workoutSessionId;

    SELECT * FROM WorkoutSessions WHERE workoutSessionId = p_workoutSessionId;
END $$
DELIMITER ;

-- =====================================================
-- 10. sp_GetPreviousExercisePerformance
-- =====================================================
DROP PROCEDURE IF EXISTS sp_GetPreviousExercisePerformance;
DELIMITER $$
CREATE PROCEDURE sp_GetPreviousExercisePerformance(
    IN p_profileId INT,
    IN p_exerciseId INT
)
BEGIN
    SELECT
        es.setNumber,
        es.weight,
        es.reps
    FROM ExerciseSets es
    INNER JOIN PerformedExercises pe ON pe.performedExerciseId = es.performedExerciseId
    INNER JOIN WorkoutSessions ws ON ws.workoutSessionId = pe.workoutSessionId
    WHERE ws.profileId = p_profileId
      AND pe.exerciseId = p_exerciseId
      AND ws.status = 'COMPLETED'
      AND ws.workoutSessionId = (
          SELECT ws2.workoutSessionId
          FROM WorkoutSessions ws2
          INNER JOIN PerformedExercises pe2 ON pe2.workoutSessionId = ws2.workoutSessionId
          WHERE ws2.profileId = p_profileId
            AND pe2.exerciseId = p_exerciseId
            AND ws2.status = 'COMPLETED'
          ORDER BY ws2.endTime DESC, ws2.workoutSessionId DESC
          LIMIT 1
      )
    ORDER BY es.setNumber ASC;
END $$
DELIMITER ;

-- =====================================================
-- 11. sp_ChangePassword
-- =====================================================
DROP PROCEDURE IF EXISTS sp_ChangePassword;
DELIMITER $$
CREATE PROCEDURE sp_ChangePassword(
    IN p_accountId INT,
    IN p_oldPassword VARCHAR(255),
    IN p_newPassword VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM Accounts WHERE accountId = p_accountId AND BINARY password = BINARY p_oldPassword
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mật khẩu hiện tại không chính xác';
    END IF;

    IF p_newPassword IS NULL OR CHAR_LENGTH(p_newPassword) < 6 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    END IF;

    UPDATE Accounts
    SET password = p_newPassword
    WHERE accountId = p_accountId;

    SELECT p_accountId AS accountId, 'Đổi mật khẩu thành công' AS message;
END $$
DELIMITER ;

-- =====================================================
-- 12. sp_GetUserBodyMetrics
-- =====================================================
DROP PROCEDURE IF EXISTS sp_GetUserBodyMetrics;
DELIMITER $$
CREATE PROCEDURE sp_GetUserBodyMetrics(
    IN p_profileId INT
)
BEGIN
    SELECT
        metricId,
        profileId,
        height,
        weight,
        recordedAt
    FROM BodyMetrics
    WHERE profileId = p_profileId
    ORDER BY recordedAt DESC, metricId DESC;
END $$
DELIMITER ;

-- =====================================================
-- 13. sp_GetExerciseAlternatives
-- =====================================================
DROP PROCEDURE IF EXISTS sp_GetExerciseAlternatives;
DELIMITER $$
CREATE PROCEDURE sp_GetExerciseAlternatives(
    IN p_exerciseId INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Exercises WHERE exerciseId = p_exerciseId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bài tập không tồn tại';
    END IF;

    SELECT
        ea.alternativeId,
        ea.exerciseId AS originalExerciseId,
        ea.alternativeExerciseId,
        e.exerciseId,
        e.name,
        e.name AS exerciseName,
        e.description,
        e.difficulty,
        (SELECT em.mediaUrl FROM ExerciseMedia em
         WHERE em.exerciseId = e.exerciseId AND em.mediaType = 'IMAGE'
         ORDER BY em.sortOrder, em.mediaId LIMIT 1) AS preview,
        (
            SELECT GROUP_CONCAT(DISTINCT mg.groupName ORDER BY mg.groupName SEPARATOR ', ')
            FROM ExerciseMuscleGroups emg
            JOIN MuscleGroups mg ON mg.groupId = emg.groupId
            WHERE emg.exerciseId = e.exerciseId AND emg.role = 'PRIMARY'
        ) AS primaryMuscles,
        (SELECT GROUP_CONCAT(DISTINCT mg.groupName ORDER BY mg.groupName SEPARATOR ', ')
         FROM ExerciseMuscleGroups emg JOIN MuscleGroups mg ON mg.groupId = emg.groupId
         WHERE emg.exerciseId = e.exerciseId AND emg.role = 'SECONDARY') AS secondaryMuscles,
        (
            SELECT GROUP_CONCAT(DISTINCT eq.equipmentName ORDER BY eq.equipmentName SEPARATOR ', ')
            FROM ExerciseEquipment ee
            JOIN Equipment eq ON eq.equipmentId = ee.equipmentId
            WHERE ee.exerciseId = e.exerciseId
        ) AS equipment,
        ea.priority,
        ea.note
    FROM ExerciseAlternatives ea
    JOIN Exercises e ON e.exerciseId = ea.alternativeExerciseId
    WHERE ea.exerciseId = p_exerciseId
    ORDER BY ea.priority ASC, e.name ASC;
END $$
DELIMITER ;
