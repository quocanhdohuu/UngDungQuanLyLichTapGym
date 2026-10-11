-- MySQL 8+. Chỉ đọc; chạy trên một kết nối đã chọn CSDL của ứng dụng.
-- Dùng được trước và sau seed. Không gọi procedure ghi dữ liệu.
SET @target_profile = (SELECT profileId FROM GymUsers WHERE accountId = 28);

-- 1. Số người dùng. Baseline ngày 11/10/2026: 23 Accounts, 22 GYM_USER, 22 GymUsers.
SELECT COUNT(*) AS accounts, SUM(role = 'GYM_USER') AS gymAccounts,
       (SELECT COUNT(*) FROM GymUsers) AS profiles FROM Accounts;
SELECT 'WorkoutPlans' AS tableName, COUNT(*) AS rowCount FROM WorkoutPlans
UNION ALL SELECT 'WorkoutDays', COUNT(*) FROM WorkoutDays
UNION ALL SELECT 'Exercises', COUNT(*) FROM Exercises
UNION ALL SELECT 'ExerciseConfigs', COUNT(*) FROM ExerciseConfigs
UNION ALL SELECT 'GymUserWorkoutPlans', COUNT(*) FROM GymUserWorkoutPlans
UNION ALL SELECT 'WorkoutSessions', COUNT(*) FROM WorkoutSessions
UNION ALL SELECT 'PerformedExercises', COUNT(*) FROM PerformedExercises
UNION ALL SELECT 'ExerciseSets', COUNT(*) FROM ExerciseSets
UNION ALL SELECT 'BodyMetrics', COUNT(*) FROM BodyMetrics;

-- 2. Namespace dự kiến cho đợt bổ sung; không đọc password.
SELECT a.accountId, a.username, a.email, a.status, a.createdAt, g.*
FROM Accounts a JOIN GymUsers g ON g.accountId = a.accountId
WHERE LEFT(a.username, 12) = 'gym_demo_v2_' ORDER BY a.username;

-- 3. Hồ sơ và tất cả chương trình của accountId 28.
SELECT a.accountId, a.username, a.email, a.createdAt, g.*
FROM Accounts a JOIN GymUsers g ON g.accountId = a.accountId WHERE a.accountId = 28;
SELECT uw.*, p.title, p.level, p.durationWeeks, p.createdAt AS planCreatedAt,
       d.dayId, d.dayName, d.weekDay, d.`order`, COUNT(c.configId) AS exercises
FROM GymUserWorkoutPlans uw JOIN WorkoutPlans p ON p.planId = uw.planId
LEFT JOIN WorkoutDays d ON d.planId = p.planId
LEFT JOIN ExerciseConfigs c ON c.dayId = d.dayId
WHERE uw.profileId = @target_profile
GROUP BY uw.profileId, uw.planId, d.dayId ORDER BY uw.startedAt, d.`order`;

-- 4, 5. Tổng số buổi và lịch sử theo thời gian, gồm cả buổi huỷ.
SELECT status, COUNT(*) AS sessions, MIN(startTime) AS firstSession, MAX(startTime) AS lastSession
FROM WorkoutSessions WHERE profileId = @target_profile GROUP BY status;
SELECT ws.*, d.dayName, d.weekDay, p.title,
       COUNT(DISTINCT pe.performedExerciseId) AS exercises,
       COUNT(es.setId) AS sets, COALESCE(SUM(es.weight * es.reps), 0) AS volumeKg
FROM WorkoutSessions ws LEFT JOIN WorkoutDays d ON d.dayId = ws.dayId
LEFT JOIN WorkoutPlans p ON p.planId = d.planId
LEFT JOIN PerformedExercises pe ON pe.workoutSessionId = ws.workoutSessionId
LEFT JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
WHERE ws.profileId = @target_profile
GROUP BY ws.workoutSessionId, d.dayId, p.planId ORDER BY ws.startTime;

-- 6. Chi tiết buổi COMPLETED mới nhất.
SET @target_session = (SELECT workoutSessionId FROM WorkoutSessions
 WHERE profileId = @target_profile AND status = 'COMPLETED'
 ORDER BY startTime DESC, workoutSessionId DESC LIMIT 1);
SELECT pe.*, e.name, es.setNumber, es.weight, es.reps, es.preValue
FROM PerformedExercises pe JOIN Exercises e ON e.exerciseId = pe.exerciseId
LEFT JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
WHERE pe.workoutSessionId = @target_session ORDER BY pe.performedExerciseId, es.setNumber;

-- 7. Volume: đối chiếu cách tính hiện tại của SP với bài đang active.
SELECT COALESCE(SUM(es.weight * es.reps), 0) AS procedureVolumeKg,
       COALESCE(SUM(CASE WHEN pe.isActive = 1 THEN es.weight * es.reps ELSE 0 END), 0) AS activeExerciseVolumeKg
FROM WorkoutSessions ws JOIN PerformedExercises pe ON pe.workoutSessionId = ws.workoutSessionId
JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
WHERE ws.profileId = @target_profile AND ws.status = 'COMPLETED';

-- 8. PR kèm ngày đạt mức tạ lớn nhất (SP hiện tại trả ngày tập gần nhất).
WITH ranked AS (
 SELECT e.name, es.weight, es.reps, ws.endTime,
 ROW_NUMBER() OVER (PARTITION BY e.exerciseId ORDER BY es.weight DESC, es.reps DESC, ws.endTime DESC, es.setId DESC) rn
 FROM WorkoutSessions ws JOIN PerformedExercises pe ON pe.workoutSessionId = ws.workoutSessionId
 JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
 JOIN Exercises e ON e.exerciseId = pe.exerciseId
 WHERE ws.profileId = @target_profile AND ws.status = 'COMPLETED' AND pe.isActive = 1
)
SELECT name, weight AS maxWeight, reps, endTime AS recordAchievedAt FROM ranked WHERE rn = 1 ORDER BY maxWeight DESC;

-- 9. Thể trạng và mức thay đổi so với mốc trước.
SELECT *, weight - LAG(weight) OVER (ORDER BY recordedAt, metricId) AS weightChangeKg
FROM BodyMetrics WHERE profileId = @target_profile ORDER BY recordedAt, metricId;

-- 10. Kiểm tra tính toàn vẹn trên toàn bộ dữ liệu, tách lỗi sẵn có khỏi seed sau này.
SELECT 'duplicateUsername' AS issue, COUNT(*) AS violations FROM
 (SELECT username FROM Accounts GROUP BY username HAVING COUNT(*) > 1) x
UNION ALL SELECT 'duplicateEmail', COUNT(*) FROM
 (SELECT email FROM Accounts GROUP BY email HAVING COUNT(*) > 1) x
UNION ALL SELECT 'multipleActivePlans', COUNT(*) FROM
 (SELECT profileId FROM GymUserWorkoutPlans WHERE status = 'ACTIVE' GROUP BY profileId HAVING COUNT(*) > 1) x
UNION ALL SELECT 'duplicateSetNumber', COUNT(*) FROM
 (SELECT performedExerciseId, setNumber FROM ExerciseSets GROUP BY performedExerciseId, setNumber HAVING COUNT(*) > 1) x
UNION ALL SELECT 'duplicateMetricTimestamp', COUNT(*) FROM
 (SELECT profileId, recordedAt FROM BodyMetrics GROUP BY profileId, recordedAt HAVING COUNT(*) > 1) x
UNION ALL SELECT 'nonContiguousSets', COUNT(*) FROM
 (SELECT performedExerciseId FROM ExerciseSets GROUP BY performedExerciseId HAVING MIN(setNumber) <> 1 OR MAX(setNumber) <> COUNT(*)) x
UNION ALL SELECT 'sessionBeforeAccount', COUNT(*) FROM WorkoutSessions ws
 JOIN GymUsers g ON g.profileId = ws.profileId JOIN Accounts a ON a.accountId = g.accountId WHERE ws.startTime < a.createdAt
UNION ALL SELECT 'futureSession', COUNT(*) FROM WorkoutSessions WHERE startTime > NOW() OR endTime > NOW()
UNION ALL SELECT 'invalidSessionTime', COUNT(*) FROM WorkoutSessions WHERE endTime < startTime
 OR (totalDuration IS NOT NULL AND totalDuration <> TIMESTAMPDIFF(MINUTE, startTime, endTime))
 OR (status = 'COMPLETED' AND (endTime IS NULL OR totalDuration IS NULL))
UNION ALL SELECT 'negativeSetValues', COUNT(*) FROM ExerciseSets WHERE weight < 0 OR reps < 0 OR preValue < 0
UNION ALL SELECT 'orphanProfile', COUNT(*) FROM GymUsers g LEFT JOIN Accounts a ON a.accountId = g.accountId WHERE a.accountId IS NULL
UNION ALL SELECT 'orphanSession', COUNT(*) FROM WorkoutSessions ws LEFT JOIN GymUsers g ON g.profileId = ws.profileId WHERE g.profileId IS NULL
UNION ALL SELECT 'orphanPerformedExercise', COUNT(*) FROM PerformedExercises pe
 LEFT JOIN WorkoutSessions ws ON ws.workoutSessionId = pe.workoutSessionId
 LEFT JOIN Exercises e ON e.exerciseId = pe.exerciseId WHERE ws.workoutSessionId IS NULL OR e.exerciseId IS NULL
UNION ALL SELECT 'orphanSet', COUNT(*) FROM ExerciseSets es
 LEFT JOIN PerformedExercises pe ON pe.performedExerciseId = es.performedExerciseId WHERE pe.performedExerciseId IS NULL
UNION ALL SELECT 'orphanMetric', COUNT(*) FROM BodyMetrics bm LEFT JOIN GymUsers g ON g.profileId = bm.profileId WHERE g.profileId IS NULL
UNION ALL SELECT 'sessionMissingMembership', COUNT(*) FROM WorkoutSessions ws
 LEFT JOIN WorkoutDays d ON d.dayId = ws.dayId
 LEFT JOIN GymUserWorkoutPlans uw ON uw.profileId = ws.profileId AND uw.planId = d.planId
 WHERE uw.profileId IS NULL
UNION ALL SELECT 'sessionBeforeMembership', COUNT(*) FROM WorkoutSessions ws
 JOIN WorkoutDays d ON d.dayId = ws.dayId JOIN GymUserWorkoutPlans uw ON uw.profileId = ws.profileId AND uw.planId = d.planId
 WHERE ws.startTime < uw.joinedAt OR DATE(ws.startTime) < uw.startedAt
UNION ALL SELECT 'weekdayMismatch', COUNT(*) FROM WorkoutSessions ws JOIN WorkoutDays d ON d.dayId = ws.dayId
 WHERE d.weekDay IS NOT NULL AND d.weekDay <> WEEKDAY(ws.startTime) + 1
UNION ALL SELECT 'overlappingSessions', COUNT(*) FROM WorkoutSessions s1 JOIN WorkoutSessions s2
 ON s1.profileId = s2.profileId AND s1.workoutSessionId < s2.workoutSessionId
 AND s1.startTime < COALESCE(s2.endTime, NOW()) AND s2.startTime < COALESCE(s1.endTime, NOW())
UNION ALL SELECT 'exerciseOutsideDay', COUNT(*) FROM PerformedExercises pe JOIN WorkoutSessions ws ON ws.workoutSessionId = pe.workoutSessionId
 WHERE NOT EXISTS (SELECT 1 FROM ExerciseConfigs c WHERE c.dayId = ws.dayId AND c.exerciseId = COALESCE(pe.originalExerciseId, pe.exerciseId))
UNION ALL SELECT 'invalidSubstitution', COUNT(*) FROM PerformedExercises pe WHERE
 (pe.isSubstituted = 1 AND (pe.originalExerciseId IS NULL OR pe.originalExerciseId = pe.exerciseId OR NOT EXISTS
 (SELECT 1 FROM ExerciseAlternatives ea WHERE ea.exerciseId = pe.originalExerciseId AND ea.alternativeExerciseId = pe.exerciseId)))
 OR (pe.isSubstituted = 0 AND pe.originalExerciseId IS NOT NULL AND pe.originalExerciseId <> pe.exerciseId)
UNION ALL SELECT 'invalidMetricTimeOrValue', COUNT(*) FROM BodyMetrics bm JOIN GymUsers g ON g.profileId = bm.profileId
 JOIN Accounts a ON a.accountId = g.accountId
 WHERE bm.recordedAt > NOW() OR bm.recordedAt < a.createdAt OR bm.height <= 0 OR bm.weight <= 0;

-- Các mốc cân thay đổi >2 kg trong vòng 7 ngày: cờ kiểm tra, không tự sửa.
WITH metrics AS (
 SELECT *, LAG(weight) OVER (PARTITION BY profileId ORDER BY recordedAt, metricId) previousWeight,
 LAG(recordedAt) OVER (PARTITION BY profileId ORDER BY recordedAt, metricId) previousAt FROM BodyMetrics
)
SELECT * FROM metrics WHERE ABS(weight - previousWeight) > 2 AND TIMESTAMPDIFF(HOUR, previousAt, recordedAt) < 168;

-- Nguồn tái sử dụng: ngày thiếu weekday hoặc thiếu cấu hình cần được xem xét.
SELECT p.title, p.level, p.isTemplate, p.createdAt, d.dayId, d.`order`, d.weekDay,
 COUNT(c.configId) AS exercises, MIN(c.sets) AS minSets, MAX(c.sets) AS maxSets
FROM WorkoutPlans p LEFT JOIN WorkoutDays d ON d.planId = p.planId
LEFT JOIN ExerciseConfigs c ON c.dayId = d.dayId
GROUP BY p.planId, d.dayId ORDER BY p.planId, d.`order`;

-- Chỉ gọi các procedure đã đối chiếu là đọc dữ liệu.
CALL sp_GetMyProfile(28);
CALL sp_GetUserActivePlan(@target_profile);
CALL sp_GetTodayWorkout(@target_profile);
CALL sp_GetUserProgressSummary(@target_profile);
CALL sp_GetUserPersonalRecords(@target_profile);
CALL sp_GetUserWorkoutHistory(@target_profile, 'ALL');
CALL sp_GetUserWorkoutHistory(@target_profile, 'WEEK');
CALL sp_GetUserWorkoutHistory(@target_profile, 'MONTH');
