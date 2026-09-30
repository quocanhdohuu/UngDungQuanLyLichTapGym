-- =====================================================
-- Stored Procedures: Exercise Alternatives & Substituted Workout Flow
-- =====================================================

-- 1. sp_GetExerciseAlternatives
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

-- 2. sp_AddPerformedExercise (Updated to support exercise substitution)
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
