-- Run before sp_exercise_alternatives.sql. Re-running preserves the selected exercise.
SET @addExerciseSelection = NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PerformedExercises' AND COLUMN_NAME = 'isActive'
);
SET @selectionDDL = IF(@addExerciseSelection,
    'ALTER TABLE PerformedExercises ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE AFTER isSubstituted',
    'SELECT 1');
PREPARE selectionMigration FROM @selectionDDL;
EXECUTE selectionMigration;
DEALLOCATE PREPARE selectionMigration;
-- For legacy sessions, use the most recent record in each prescription slot.
UPDATE PerformedExercises pe
JOIN PerformedExercises newer ON newer.workoutSessionId = pe.workoutSessionId
    AND COALESCE(newer.originalExerciseId, newer.exerciseId) = COALESCE(pe.originalExerciseId, pe.exerciseId)
    AND newer.performedExerciseId > pe.performedExerciseId
SET pe.isActive = FALSE
WHERE @addExerciseSelection;
