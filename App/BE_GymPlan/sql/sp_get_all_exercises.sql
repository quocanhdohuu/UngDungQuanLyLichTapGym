DELIMITER $$

CREATE PROCEDURE sp_GetAllExercises()
BEGIN
    SELECT
        e.exerciseId,
        e.name,
        e.description,
        e.difficulty,

        (
            SELECT em.mediaUrl
            FROM ExerciseMedia em
            WHERE em.exerciseId = e.exerciseId
              AND em.mediaType = 'IMAGE'
            ORDER BY em.sortOrder ASC, em.mediaId ASC
            LIMIT 1
        ) AS preview,

        GROUP_CONCAT(
            DISTINCT CASE
                WHEN emg.role = 'PRIMARY'
                THEN mg.groupName
            END
            SEPARATOR ', '
        ) AS primaryMuscles,

        GROUP_CONCAT(
            DISTINCT CASE
                WHEN emg.role = 'SECONDARY'
                THEN mg.groupName
            END
            SEPARATOR ', '
        ) AS secondaryMuscles,

        GROUP_CONCAT(
            DISTINCT eq.equipmentName
            SEPARATOR ', '
        ) AS equipment

    FROM Exercises e

    LEFT JOIN ExerciseMuscleGroups emg
        ON e.exerciseId = emg.exerciseId

    LEFT JOIN MuscleGroups mg
        ON emg.groupId = mg.groupId

    LEFT JOIN ExerciseEquipment ee
        ON e.exerciseId = ee.exerciseId

    LEFT JOIN Equipment eq
        ON ee.equipmentId = eq.equipmentId

    GROUP BY
        e.exerciseId,
        e.name,
        e.description,
        e.difficulty

    ORDER BY e.exerciseId ASC;
END $$

DELIMITER ;

CALL sp_GetAllExercises();
