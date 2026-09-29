-- MySQL 8.0.16+, database QuanLyLichTapGym.
-- Chạy toàn bộ file trên MỘT kết nối, dừng ngay và ROLLBACK nếu có lỗi.
-- mysql CLI: không dùng --force. Không chạy lại MySQL_GymPlan.sql.
-- Chỉ INSERT dữ liệu mới. Không sửa bảng, procedure hoặc dữ liệu hiện có.
-- Bảng TEMPORARY chỉ tồn tại trên kết nối này, không đổi schema ứng dụng.
-- Chạy lại khi đủ 12 tài khoản seed: thêm 0 dòng, giữ nguyên dữ liệu đã test.
-- Nếu chỉ tồn tại một phần hoặc trùng username/email: dừng để kiểm tra.
-- Tài khoản: seed_gym_<tên>@example.test. Mật khẩu: GymTest@2026!
-- Mật khẩu dạng chuỗi phù hợp với sp_Login hiện tại.
-- Thời gian lấy theo MySQL. totalDuration: phút, weight/preValue: kg.

USE QuanLyLichTapGym;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @seed_now = NOW();
SET @seed_date = DATE(@seed_now);
SET @seed_lock = GET_LOCK('QuanLyLichTapGym.seed_test_data.v1', 10);

DROP TEMPORARY TABLE IF EXISTS seed_assert;
CREATE TEMPORARY TABLE seed_assert (
    message VARCHAR(200) NOT NULL,
    ok INT NOT NULL,
    CONSTRAINT chk_seed_assert CHECK (ok = 1)
) ENGINE = InnoDB;
INSERT INTO seed_assert VALUES
    ('Require seed lock and enabled FK/UNIQUE checks',
     IF(@seed_lock = 1 AND @@foreign_key_checks = 1 AND @@unique_checks = 1, 1, 0)),
    ('Require strict SQL mode',
     IF(FIND_IN_SET('STRICT_TRANS_TABLES', @@sql_mode) > 0
        OR FIND_IN_SET('STRICT_ALL_TABLES', @@sql_mode) > 0, 1, 0));

START TRANSACTION;

-- 1. Danh sách người dùng: ngày tạo trải trên sáu tháng cho dashboard.
DROP TEMPORARY TABLE IF EXISTS seed_users;
CREATE TEMPORARY TABLE seed_users (
    userNo INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    fullName VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    level VARCHAR(20) NOT NULL,
    goal VARCHAR(255),
    frequency INT,
    accountStatus VARCHAR(10) NOT NULL,
    profileStatus VARCHAR(10) NOT NULL,
    ageDays INT NOT NULL,
    height DECIMAL(5,2),
    initialWeight DECIMAL(5,2),
    weeklyChange DECIMAL(4,2)
) ENGINE = InnoDB;
INSERT INTO seed_users VALUES
    (1, 'seed_gym_minh',  'Nguyễn Hoàng Minh', 'MALE',   'BEGINNER',     'Tăng cơ', 3, 'ACTIVE',   'ACTIVE',   170, 175, 64.0,  0.25),
    (2, 'seed_gym_lan',   'Trần Ngọc Lan',     'FEMALE', 'INTERMEDIATE', 'Giảm mỡ', 4, 'ACTIVE',   'ACTIVE',   140, 162, 66.0, -0.30),
    (3, 'seed_gym_hung',  'Lê Quốc Hùng',      'MALE',   'INTERMEDIATE', 'Tăng cơ', 6, 'ACTIVE',   'ACTIVE',   110, 180, 78.0,  0.20),
    (4, 'seed_gym_thao',  'Phạm Thanh Thảo',   'FEMALE', 'BEGINNER',     'Sức bền', 3, 'ACTIVE',   'ACTIVE',    80, 158, 52.0,  0.05),
    (5, 'seed_gym_duc',   'Đỗ Minh Đức',       'MALE',   'ADVANCED',     'Sức mạnh',4, 'ACTIVE',   'ACTIVE',    65, 178, 83.0,  0.10),
    (6, 'seed_gym_vy',    'Võ Tường Vy',       'FEMALE', 'INTERMEDIATE', 'Tăng cơ', 5, 'ACTIVE',   'ACTIVE',    50, 165, 54.0,  0.20),
    (7, 'seed_gym_khanh', 'Bùi Gia Khánh',     'OTHER',  'INTERMEDIATE', 'Sức mạnh',3, 'ACTIVE',   'ACTIVE',   125, 170, 68.0,  0.15),
    (8, 'seed_gym_linh',  'Hoàng Mỹ Linh',     'FEMALE', 'ADVANCED',     'Giảm mỡ', 6, 'ACTIVE',   'ACTIVE',    95, 168, 62.0, -0.20),
    (9, 'seed_gym_tuan',  'Đặng Anh Tuấn',     'MALE',   'BEGINNER',     'Tăng cơ', 3, 'LOCKED',   'ACTIVE',    20, 172, 60.0,  0.10),
    (10,'seed_gym_mai',   'Ngô Phương Mai',    'FEMALE', 'BEGINNER',     'Giảm mỡ', 2, 'INACTIVE', 'INACTIVE',  12, 160, 70.0, -0.10),
    (11,'seed_gym_an',    'Nguyễn Bình An',    NULL,     'BEGINNER',      NULL,   NULL,'ACTIVE',  'ACTIVE',     0, NULL,NULL,  NULL),
    (12,'seed_gym_bao',   'Trịnh Quốc Bảo',    'MALE',   'BEGINNER',     'Sức bền', 3, 'ACTIVE',   'ACTIVE',     2, 176, 72.5,  0.00);

DROP TEMPORARY TABLE IF EXISTS seed_new_users;
CREATE TEMPORARY TABLE seed_new_users ENGINE = InnoDB AS
SELECT u.* FROM seed_users u
WHERE NOT EXISTS (
    SELECT 1 FROM Accounts a
    WHERE a.username = u.username OR a.email = CONCAT(u.username, '@example.test')
);
SET @seed_new_count = (SELECT COUNT(*) FROM seed_new_users);
INSERT INTO seed_assert
SELECT 'Require all seed users absent OR all exact username/email pairs present',
    IF(@seed_new_count = 12 OR (
        @seed_new_count = 0 AND
        (SELECT COUNT(*) FROM seed_users u JOIN Accounts a
         ON a.username = u.username AND a.email = CONCAT(u.username, '@example.test')
         WHERE a.role = 'GYM_USER') = 12
    ), 1, 0);

INSERT INTO Accounts (username, email, password, role, status, createdAt)
SELECT username, CONCAT(username, '@example.test'), 'GymTest@2026!',
       'GYM_USER', accountStatus, DATE_SUB(@seed_now, INTERVAL ageDays DAY)
FROM seed_new_users ORDER BY userNo;
SET @added_accounts = ROW_COUNT();

INSERT INTO GymUsers (accountId, fullName, gender, level, goal, sessionsPerWeek, status)
SELECT a.accountId, u.fullName, u.gender, u.level, u.goal, u.frequency, u.profileStatus
FROM seed_new_users u JOIN Accounts a ON a.username = u.username
ORDER BY u.userNo;
SET @added_users = ROW_COUNT();

DROP TEMPORARY TABLE IF EXISTS seed_profiles;
CREATE TEMPORARY TABLE seed_profiles ENGINE = InnoDB AS
SELECT u.*, a.accountId, gu.profileId
FROM seed_new_users u
JOIN Accounts a ON a.username = u.username
JOIN GymUsers gu ON gu.accountId = a.accountId;

-- 0..159: tạo chuỗi ngày/tuần, không cần procedure hay vòng lặp.
DROP TEMPORARY TABLE IF EXISTS seed_numbers;
CREATE TEMPORARY TABLE seed_numbers (n INT PRIMARY KEY) ENGINE = InnoDB;
INSERT INTO seed_numbers
WITH RECURSIVE numbers AS (
    SELECT 0 AS n UNION ALL SELECT n + 1 FROM numbers WHERE n < 159
)
SELECT n FROM numbers;

-- 2. Chỉ số mỗi tuần trong tối đa 9 tuần gần nhất, không trước ngày đăng ký.
-- An chưa có chỉ số. Bảo có một chỉ số chỉ ghi cân nặng để test height NULL.
INSERT INTO BodyMetrics (profileId, height, weight, recordedAt)
SELECT p.profileId, IF(p.userNo = 12, NULL, p.height),
       ROUND(p.initialWeight + p.weeklyChange * (8 - n.n), 2),
       DATE_SUB(@seed_now, INTERVAL (n.n * 7 + 1) DAY)
FROM seed_profiles p CROSS JOIN seed_numbers n
WHERE p.userNo <> 11 AND n.n <= 8 AND n.n * 7 + 1 <= p.ageDays
ORDER BY p.userNo, n.n DESC;
SET @added_metrics = ROW_COUNT();

-- 3. Lịch cá nhân sao chép bài/cấu hình hiện có, có weekDay cụ thể.
-- Không sửa lịch mẫu. Một người tối đa một lịch ACTIVE.
DROP TEMPORARY TABLE IF EXISTS seed_plan_specs;
CREATE TEMPORARY TABLE seed_plan_specs (
    planKey VARCHAR(20) PRIMARY KEY,
    userNo INT NOT NULL,
    sourceTitle VARCHAR(150) NOT NULL,
    startAgo INT NOT NULL,
    historyDays INT NOT NULL,
    status VARCHAR(20) NOT NULL
) ENGINE = InnoDB;
INSERT INTO seed_plan_specs VALUES
    ('minh_current',1, 'Beginner Full Body 3 Days',    35, 35, 'ACTIVE'),
    ('lan_current', 2, 'Upper Lower 4 Days',           35, 35, 'ACTIVE'),
    ('hung_current',3, 'Push Pull Legs 6 Days',        35, 35, 'ACTIVE'),
    ('thao_current',4, 'Push Pull Legs 3 Days',        35, 35, 'ACTIVE'),
    ('duc_current', 5, 'Upper Lower Strength 4 Days',  35, 35, 'ACTIVE'),
    ('vy_current',  6, 'Hypertrophy 5 Days',           35, 35, 'ACTIVE'),
    ('khanh_past',  7, 'Strength Foundation 3 Days',  105, 56, 'COMPLETED'),
    ('linh_past',   8, 'Advanced Push Pull Legs',      70, 28, 'CANCELLED'),
    ('minh_past',   1, 'Beginner Full Body 3 Days',   147, 56, 'COMPLETED');

-- Tên giáo án không có UNIQUE: chỉ chấp nhận đúng một nguồn cho mỗi tên.
INSERT INTO seed_assert
SELECT 'Require exactly one template with configured days for each source',
    IF(COUNT(*) = 0, 1, 0)
FROM seed_plan_specs s
WHERE (SELECT COUNT(*) FROM WorkoutPlans wp
       WHERE wp.title = s.sourceTitle AND wp.isTemplate = TRUE) <> 1
   OR NOT EXISTS (
       SELECT 1 FROM WorkoutPlans wp JOIN WorkoutDays wd ON wd.planId = wp.planId
       JOIN ExerciseConfigs ec ON ec.dayId = wd.dayId
       WHERE wp.title = s.sourceTitle AND wp.isTemplate = TRUE
   );

DROP TEMPORARY TABLE IF EXISTS seed_plan_sources;
CREATE TEMPORARY TABLE seed_plan_sources ENGINE = InnoDB AS
SELECT s.*, p.accountId, p.profileId, p.level, wp.planId AS sourcePlanId,
       CONCAT('[SEED] ', p.fullName, ' - ', s.planKey) AS title,
       DATE_SUB(@seed_date, INTERVAL s.startAgo DAY) AS startedAt,
       (SELECT COUNT(*) FROM WorkoutDays wd WHERE wd.planId = wp.planId) AS dayCount
FROM seed_plan_specs s
JOIN seed_profiles p ON p.userNo = s.userNo
JOIN WorkoutPlans wp ON wp.title = s.sourceTitle AND wp.isTemplate = TRUE;

INSERT INTO WorkoutPlans (title, description, creatorId, isTemplate, level, durationWeeks, createdAt)
SELECT title, CONCAT('Dữ liệu test cá nhân, tham khảo ', sourceTitle),
       accountId, FALSE, level, 8, DATE_SUB(startedAt, INTERVAL 1 DAY)
FROM seed_plan_sources ORDER BY planKey;
SET @added_plans = ROW_COUNT();

DROP TEMPORARY TABLE IF EXISTS seed_plans;
CREATE TEMPORARY TABLE seed_plans ENGINE = InnoDB AS
SELECT s.*, wp.planId FROM seed_plan_sources s
JOIN WorkoutPlans wp ON wp.creatorId = s.accountId AND wp.title = s.title;

INSERT INTO WorkoutDays (planId, dayName, `order`, weekDay)
SELECT p.planId, wd.dayName, wd.`order`,
       CASE
           WHEN p.dayCount = 3 AND p.userNo = 4 THEN wd.`order` * 2
           WHEN p.dayCount = 3 THEN wd.`order` * 2 - 1
           WHEN p.dayCount = 4 THEN CASE wd.`order` WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 4 ELSE 5 END
           ELSE wd.`order`
       END
FROM seed_plans p JOIN WorkoutDays wd ON wd.planId = p.sourcePlanId
ORDER BY p.planId, wd.`order`;
SET @added_days = ROW_COUNT();

INSERT INTO ExerciseConfigs (exerciseId, dayId, sets, reps, restTime, `order`)
SELECT ec.exerciseId, target.dayId, ec.sets, ec.reps, ec.restTime,
       ROW_NUMBER() OVER (PARTITION BY target.dayId ORDER BY ec.`order`, ec.configId)
FROM seed_plans p
JOIN WorkoutDays source ON source.planId = p.sourcePlanId
JOIN WorkoutDays target ON target.planId = p.planId AND target.`order` = source.`order`
JOIN ExerciseConfigs ec ON ec.dayId = source.dayId
ORDER BY target.dayId, ec.`order`;
SET @added_configs = ROW_COUNT();

INSERT INTO GymUserWorkoutPlans (profileId, planId, joinedAt, startedAt, status)
SELECT profileId, planId, startedAt, startedAt, status FROM seed_plans;
SET @added_memberships = ROW_COUNT();

-- Bảo mới chọn lịch mẫu có sẵn, chưa bắt đầu tập (startedAt NULL).
INSERT INTO GymUserWorkoutPlans (profileId, planId, joinedAt, startedAt, status)
SELECT p.profileId, wp.planId, DATE_SUB(@seed_now, INTERVAL 1 DAY), NULL, 'ACTIVE'
FROM seed_profiles p JOIN WorkoutPlans wp
    ON wp.title = 'Beginner Full Body 3 Days' AND wp.isTemplate = TRUE
WHERE p.userNo = 12;
SET @added_memberships = @added_memberships + ROW_COUNT();

-- 4. Lịch sử theo đúng ngày trong tuần, trải qua tuần/tháng/nhiều tháng.
-- Không tạo buổi hoàn thành trong tương lai hoặc trước khi đăng ký lịch.
DROP TEMPORARY TABLE IF EXISTS seed_session_specs;
CREATE TEMPORARY TABLE seed_session_specs (
    profileId INT NOT NULL,
    dayId INT NOT NULL,
    startTime DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration INT NULL
) ENGINE = InnoDB;
INSERT INTO seed_session_specs
SELECT p.profileId, wd.dayId,
       TIMESTAMP(DATE_ADD(p.startedAt, INTERVAL n.n DAY),
                 MAKETIME(6 + MOD(p.userNo, 3) * 6, 15, 0)) AS startTime,
       CASE WHEN MOD(n.n + p.userNo, 13) = 0 THEN 'CANCELLED' ELSE 'COMPLETED' END AS status,
       CASE WHEN MOD(n.n + p.userNo, 13) = 0 THEN IF(MOD(n.n, 2) = 0, 0, 12)
            ELSE 40 + MOD(n.n + p.userNo, 6) * 5 END AS duration
FROM seed_plans p CROSS JOIN seed_numbers n
JOIN WorkoutDays wd ON wd.planId = p.planId
    AND wd.weekDay = WEEKDAY(DATE_ADD(p.startedAt, INTERVAL n.n DAY)) + 1
WHERE n.n < p.historyDays
  AND DATE_ADD(p.startedAt, INTERVAL n.n DAY) < @seed_date;

-- Buổi đang dở cho Lan/Hùng nếu hôm nay có ngày tập trong lịch cá nhân.
INSERT INTO seed_session_specs (profileId, dayId, startTime, status, duration)
SELECT p.profileId, wd.dayId, DATE_SUB(@seed_now, INTERVAL 15 MINUTE), 'IN_PROGRESS', NULL
FROM seed_plans p JOIN WorkoutDays wd ON wd.planId = p.planId
WHERE p.userNo IN (2, 3) AND p.status = 'ACTIVE'
  AND wd.weekDay = WEEKDAY(DATE_SUB(@seed_now, INTERVAL 15 MINUTE)) + 1;

INSERT INTO WorkoutSessions (profileId, dayId, startTime, endTime, totalDuration, status)
SELECT profileId, dayId, startTime,
       IF(status = 'IN_PROGRESS', NULL, DATE_ADD(startTime, INTERVAL duration MINUTE)),
       duration, status
FROM seed_session_specs ORDER BY profileId, startTime;
SET @added_sessions = ROW_COUNT();

-- 5. Bài đã tập lấy đúng ExerciseConfigs của ngày tập.
-- Buổi hủy ngay: không có bài/hiệp. Hủy sau 12 phút: một bài chưa hoàn thành.
-- Buổi đang dở: bài đầu hoàn thành, bài thứ hai mới ghi một hiệp.
DROP TEMPORARY TABLE IF EXISTS seed_performance;
CREATE TEMPORARY TABLE seed_performance ENGINE = InnoDB AS
SELECT ws.workoutSessionId, ws.profileId, ws.startTime, ws.status,
       ec.exerciseId, ec.sets, ec.reps, ec.`order` AS exerciseOrder,
       p.userNo, p.level,
       CASE
           WHEN e.name IN ('Plank', 'Push Up', 'Pull Up', 'Chin Up', 'Bench Dips',
                           'Hanging Leg Raise', 'Ab Wheel Rollout', 'Glute Bridge') THEN 0
           WHEN e.name LIKE '%Calf%' THEN 25
           WHEN e.name = 'Leg Press' THEN 60
           WHEN e.name IN ('Barbell Squat', 'Deadlift', 'Romanian Deadlift', 'Hip Thrust') THEN 40
           WHEN e.name LIKE '%Raise%' OR e.name LIKE '%Fly%' OR e.name LIKE '%Curl%' THEN 7.5
           WHEN e.name LIKE '%Dumbbell%' OR e.name = 'Bulgarian Split Squat' THEN 10
           WHEN e.name = 'Russian Twist' THEN 5
           ELSE 20
       END AS baseWeight
FROM seed_session_specs ss
JOIN WorkoutSessions ws ON ws.profileId = ss.profileId AND ws.dayId = ss.dayId AND ws.startTime = ss.startTime
JOIN seed_profiles p ON p.profileId = ws.profileId
JOIN ExerciseConfigs ec ON ec.dayId = ws.dayId
JOIN Exercises e ON e.exerciseId = ec.exerciseId
WHERE ws.status = 'COMPLETED'
   OR (ws.status = 'IN_PROGRESS' AND ec.`order` <= 2)
   OR (ws.status = 'CANCELLED' AND ws.totalDuration > 0 AND ec.`order` = 1);

INSERT INTO PerformedExercises (workoutSessionId, exerciseId, isCompleted)
SELECT workoutSessionId, exerciseId,
       IF(status = 'COMPLETED' OR (status = 'IN_PROGRESS' AND exerciseOrder = 1), TRUE, FALSE)
FROM seed_performance ORDER BY workoutSessionId, exerciseOrder;
SET @added_performed = ROW_COUNT();

-- 6. Tạ thay đổi theo trình độ và tiến trình; số hiệp đúng cấu hình.
-- preValue là khối lượng cùng hiệp của lần tập hoàn thành gần nhất, NULL ở lần đầu.
DROP TEMPORARY TABLE IF EXISTS seed_set_values;
CREATE TEMPORARY TABLE seed_set_values ENGINE = InnoDB AS
SELECT pe.performedExerciseId, p.profileId, p.exerciseId, p.startTime, p.status,
       n.n + 1 AS setNumber,
       CASE WHEN p.baseWeight = 0 THEN 0 ELSE
           ROUND((p.baseWeight * CASE p.level WHEN 'ADVANCED' THEN 1.8 WHEN 'INTERMEDIATE' THEN 1.3 ELSE 0.8 END
               + LEAST(6, FLOOR(DATEDIFF(p.startTime, a.createdAt) / 21)) * 1.25
               + IF(n.n = 0, 0, 1.25)) / 1.25) * 1.25 END AS weight,
       GREATEST(1, p.reps - IF(n.n >= 2 AND MOD(p.workoutSessionId, 3) = 0, 1, 0)) AS reps
FROM seed_performance p
JOIN PerformedExercises pe ON pe.workoutSessionId = p.workoutSessionId AND pe.exerciseId = p.exerciseId
JOIN GymUsers gu ON gu.profileId = p.profileId
JOIN Accounts a ON a.accountId = gu.accountId
CROSS JOIN seed_numbers n
WHERE n.n < CASE WHEN p.status = 'COMPLETED' OR (p.status = 'IN_PROGRESS' AND p.exerciseOrder = 1)
                THEN p.sets ELSE 1 END;

-- MySQL không cho mở một TEMPORARY TABLE nhiều lần trong cùng truy vấn.
DROP TEMPORARY TABLE IF EXISTS seed_previous_sets;
CREATE TEMPORARY TABLE seed_previous_sets ENGINE = InnoDB AS
SELECT * FROM seed_set_values WHERE status = 'COMPLETED';

INSERT INTO ExerciseSets (performedExerciseId, setNumber, weight, reps, preValue)
SELECT s.performedExerciseId, s.setNumber, s.weight, s.reps,
       (SELECT prev.weight FROM seed_previous_sets prev
        WHERE prev.profileId = s.profileId AND prev.exerciseId = s.exerciseId
          AND prev.setNumber = s.setNumber AND prev.startTime < s.startTime
        ORDER BY prev.startTime DESC, prev.performedExerciseId DESC LIMIT 1)
FROM seed_set_values s ORDER BY s.performedExerciseId, s.setNumber;
SET @added_sets = ROW_COUNT();

-- 7. Kiểm tra nghiệp vụ trước COMMIT, ràng buộc DB luôn được bật khi INSERT.
INSERT INTO seed_assert
SELECT 'New users must have matching profiles', IF(@added_accounts = @added_users, 1, 0);
INSERT INTO seed_assert
SELECT 'At most one active plan per new user', IF(COUNT(*) = 0, 1, 0)
FROM (SELECT gp.profileId FROM GymUserWorkoutPlans gp
      JOIN seed_profiles p ON p.profileId = gp.profileId WHERE gp.status = 'ACTIVE'
      GROUP BY gp.profileId HAVING COUNT(*) > 1) invalid;
INSERT INTO seed_assert
SELECT 'Session time, duration, weekday and membership must agree', IF(COUNT(*) = 0, 1, 0)
FROM WorkoutSessions ws JOIN seed_profiles p ON p.profileId = ws.profileId
JOIN WorkoutDays wd ON wd.dayId = ws.dayId
LEFT JOIN GymUserWorkoutPlans gp ON gp.profileId = ws.profileId AND gp.planId = wd.planId
WHERE gp.profileId IS NULL OR DATE(ws.startTime) < gp.startedAt
   OR ws.startTime > @seed_now OR ws.endTime > @seed_now
   OR wd.weekDay <> WEEKDAY(ws.startTime) + 1
   OR (ws.status = 'IN_PROGRESS' AND (ws.endTime IS NOT NULL OR ws.totalDuration IS NOT NULL OR gp.status <> 'ACTIVE'))
   OR (ws.status <> 'IN_PROGRESS' AND (ws.endTime IS NULL
       OR ws.endTime < ws.startTime OR ws.totalDuration <> TIMESTAMPDIFF(MINUTE, ws.startTime, ws.endTime)));
INSERT INTO seed_assert
SELECT 'All completed exercises must have their configured sets', IF(COUNT(*) = 0, 1, 0)
FROM PerformedExercises pe
JOIN WorkoutSessions ws ON ws.workoutSessionId = pe.workoutSessionId
JOIN seed_profiles p ON p.profileId = ws.profileId
JOIN ExerciseConfigs ec ON ec.dayId = ws.dayId AND ec.exerciseId = pe.exerciseId
WHERE pe.isCompleted = TRUE AND ec.sets <>
    (SELECT COUNT(*) FROM ExerciseSets es WHERE es.performedExerciseId = pe.performedExerciseId);

COMMIT;
DO RELEASE_LOCK('QuanLyLichTapGym.seed_test_data.v1');

-- Số dòng vừa thêm, chạy lại sẽ trả về 0 ở mọi bảng.
SELECT 'Accounts' AS tableName, @added_accounts AS addedRows
UNION ALL SELECT 'GymUsers', @added_users
UNION ALL SELECT 'BodyMetrics', @added_metrics
UNION ALL SELECT 'WorkoutPlans', @added_plans
UNION ALL SELECT 'WorkoutDays', @added_days
UNION ALL SELECT 'ExerciseConfigs', @added_configs
UNION ALL SELECT 'GymUserWorkoutPlans', @added_memberships
UNION ALL SELECT 'WorkoutSessions', @added_sessions
UNION ALL SELECT 'PerformedExercises', @added_performed
UNION ALL SELECT 'ExerciseSets', @added_sets;

SELECT a.username, a.email, a.status AS accountStatus, gu.profileId,
       gu.fullName, gu.level, gu.gender, gu.status AS profileStatus
FROM seed_users u JOIN Accounts a ON a.username = u.username
JOIN GymUsers gu ON gu.accountId = a.accountId ORDER BY u.userNo;

SELECT ws.status, COUNT(*) AS totalSessions,
       MIN(ws.startTime) AS firstSession, MAX(ws.startTime) AS lastSession
FROM WorkoutSessions ws JOIN GymUsers gu ON gu.profileId = ws.profileId
JOIN Accounts a ON a.accountId = gu.accountId
JOIN seed_users u ON u.username = a.username GROUP BY ws.status;
