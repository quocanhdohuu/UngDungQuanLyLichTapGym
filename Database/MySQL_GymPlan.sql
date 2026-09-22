CREATE DATABASE IF NOT EXISTS QuanLyLichTapGym
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE QuanLyLichTapGym;

-- =====================================================
-- 1. ACCOUNTS
-- =====================================================

CREATE TABLE Accounts (
    accountId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'GYM_USER') NOT NULL DEFAULT 'GYM_USER',
    status ENUM('ACTIVE', 'LOCKED', 'INACTIVE')
        NOT NULL DEFAULT 'ACTIVE',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. GYM USERS
-- =====================================================

CREATE TABLE GymUsers (
    profileId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL UNIQUE,
    fullName VARCHAR(100) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED')
        DEFAULT 'BEGINNER',
    goal VARCHAR(255),
    sessionsPerWeek INT,
    status ENUM('ACTIVE', 'INACTIVE')
        NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_gymuser_account
        FOREIGN KEY (accountId)
        REFERENCES Accounts(accountId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_sessions_per_week
        CHECK (sessionsPerWeek IS NULL OR sessionsPerWeek > 0)
);


-- =====================================================
-- 3. LOGIN SESSIONS
-- =====================================================

CREATE TABLE LoginSessions (
    loginSessionId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL,
    loginTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration DATETIME NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'LOGGED_OUT')
        NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_login_account
        FOREIGN KEY (accountId)
        REFERENCES Accounts(accountId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =====================================================
-- 4. WORKOUT PLANS
-- =====================================================

CREATE TABLE WorkoutPlans (
    planId INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    creatorId INT NOT NULL,
    isTemplate BOOLEAN NOT NULL DEFAULT FALSE,
    level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED')
        DEFAULT 'BEGINNER',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_plan_creator
        FOREIGN KEY (creatorId)
        REFERENCES accounts(accountId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =====================================================
-- 5. WORKOUT DAYS
-- =====================================================

CREATE TABLE WorkoutDays (
    dayId INT AUTO_INCREMENT PRIMARY KEY,
    planId INT NOT NULL,
    dayName VARCHAR(100) NOT NULL,
    `order` INT NOT NULL,

    CONSTRAINT fk_workoutday_plan
        FOREIGN KEY (planId)
        REFERENCES WorkoutPlans(planId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_workoutday_order
        UNIQUE (planId, `order`)
);


-- =====================================================
-- 6. EXERCISES
-- =====================================================

CREATE TABLE Exercises (
    exerciseId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    mediaUrl VARCHAR(500),
    difficulty ENUM('EASY', 'MEDIUM', 'HARD')
        DEFAULT 'MEDIUM'
);
ALTER TABLE Exercises
DROP COLUMN mediaUrl;
CREATE TABLE ExerciseMedia (
    mediaId INT AUTO_INCREMENT PRIMARY KEY,

    exerciseId INT NOT NULL,

    mediaUrl VARCHAR(500) NOT NULL,

    mediaType ENUM('IMAGE', 'VIDEO') NOT NULL,

    sortOrder INT DEFAULT 0,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exercise_media
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
ALTER TABLE ExerciseMedia
ADD COLUMN publicId VARCHAR(255) NULL AFTER mediaUrl;

-- =====================================================
-- 7. EXERCISE CONFIG
-- =====================================================

CREATE TABLE ExerciseConfigs (
    configId INT AUTO_INCREMENT PRIMARY KEY,
    exerciseId INT NOT NULL,
    dayId INT NOT NULL,
    sets INT NOT NULL,
    reps INT NOT NULL,
    restTime INT DEFAULT 60,
    `order` INT NOT NULL,

    CONSTRAINT fk_config_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_config_day
        FOREIGN KEY (dayId)
        REFERENCES WorkoutDays(dayId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_config_order
        UNIQUE (dayId, `order`),

    CONSTRAINT chk_config_sets
        CHECK (sets > 0),

    CONSTRAINT chk_config_reps
        CHECK (reps > 0),

    CONSTRAINT chk_config_rest
        CHECK (restTime >= 0)
);


-- =====================================================
-- 8. MUSCLE GROUPS
-- =====================================================

CREATE TABLE MuscleGroups (
    groupId INT AUTO_INCREMENT PRIMARY KEY,
    groupName VARCHAR(100) NOT NULL UNIQUE,
    `function` VARCHAR(255)
);


-- =====================================================
-- 9. EXERCISE - MUSCLE GROUP
-- =====================================================

CREATE TABLE ExerciseMuscleGroups (
    exerciseMuscleGroupId INT AUTO_INCREMENT PRIMARY KEY,
    exerciseId INT NOT NULL,
    groupId INT NOT NULL,
    role ENUM('PRIMARY', 'SECONDARY') NOT NULL DEFAULT 'PRIMARY',

    CONSTRAINT fk_emg_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_emg_group
        FOREIGN KEY (groupId)
        REFERENCES MuscleGroups(groupId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_exercise_muscle
        UNIQUE (exerciseId, groupId)
);


-- =====================================================
-- 10. EQUIPMENT
-- =====================================================

CREATE TABLE Equipment (
    equipmentId INT AUTO_INCREMENT PRIMARY KEY,
    equipmentName VARCHAR(100) NOT NULL UNIQUE
);


-- =====================================================
-- 11. EXERCISE - EQUIPMENT
-- =====================================================

CREATE TABLE ExerciseEquipment (
    exerciseId INT NOT NULL,
    equipmentId INT NOT NULL,

    PRIMARY KEY (exerciseId, equipmentId),

    CONSTRAINT fk_ee_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_ee_equipment
        FOREIGN KEY (equipmentId)
        REFERENCES Equipment(equipmentId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =====================================================
-- 12. GYM USER - WORKOUT PLAN
-- =====================================================

CREATE TABLE GymUserWorkoutPlans (
    profileId INT NOT NULL,
    planId INT NOT NULL,
    joinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED')
        NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (profileId, planId),

    CONSTRAINT fk_guwp_user
        FOREIGN KEY (profileId)
        REFERENCES GymUsers(profileId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_guwp_plan
        FOREIGN KEY (planId)
        REFERENCES WorkoutPlans(planId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =====================================================
-- 13. WORKOUT SESSIONS
-- =====================================================

CREATE TABLE WorkoutSessions (
    workoutSessionId INT AUTO_INCREMENT PRIMARY KEY,
    profileId INT NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    totalDuration INT,
    status ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED')
        NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT fk_session_user
        FOREIGN KEY (profileId)
        REFERENCES GymUsers(profileId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_session_duration
        CHECK (totalDuration IS NULL OR totalDuration >= 0)
);


-- =====================================================
-- 14. PERFORMED EXERCISES
-- =====================================================

CREATE TABLE PerformedExercises (
    performedExerciseId INT AUTO_INCREMENT PRIMARY KEY,
    workoutSessionId INT NOT NULL,
    exerciseId INT NOT NULL,
    isCompleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_performed_session
        FOREIGN KEY (workoutSessionId)
        REFERENCES WorkoutSessions(workoutSessionId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_performed_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =====================================================
-- 15. EXERCISE SETS
-- =====================================================

CREATE TABLE ExerciseSets (
    setId INT AUTO_INCREMENT PRIMARY KEY,
    performedExerciseId INT NOT NULL,
    setNumber INT NOT NULL,
    weight DECIMAL(6,2),
    reps INT,
    preValue DECIMAL(6,2),

    CONSTRAINT fk_set_performed_exercise
        FOREIGN KEY (performedExerciseId)
        REFERENCES PerformedExercises(performedExerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_performed_set
        UNIQUE (performedExerciseId, setNumber),

    CONSTRAINT chk_set_number
        CHECK (setNumber > 0),

    CONSTRAINT chk_set_weight
        CHECK (weight IS NULL OR weight >= 0),

    CONSTRAINT chk_set_reps
        CHECK (reps IS NULL OR reps >= 0)
);


-- =====================================================
-- 16. BODY METRICS
-- =====================================================

CREATE TABLE BodyMetrics (
    metricId INT AUTO_INCREMENT PRIMARY KEY,
    profileId INT NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    recordedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_metric_user
        FOREIGN KEY (profileId)
        REFERENCES GymUsers(profileId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_height
        CHECK (height IS NULL OR height > 0),

    CONSTRAINT chk_weight
        CHECK (weight IS NULL OR weight > 0)
);

-- =====================================================
-- 1. Số tuần của một chương trình
-- Ví dụ PPL chạy trong 8 tuần
-- =====================================================
ALTER TABLE WorkoutPlans
ADD COLUMN durationWeeks INT NOT NULL DEFAULT 8 AFTER level;


-- =====================================================
-- 2. Ngày bắt đầu sử dụng lịch của User
-- =====================================================
ALTER TABLE GymUserWorkoutPlans
ADD COLUMN startedAt DATE NULL AFTER joinedAt;


-- Có thể cập nhật dữ liệu cũ
UPDATE GymUserWorkoutPlans
SET startedAt = DATE(joinedAt)
WHERE startedAt IS NULL;


-- =====================================================
-- 3. Ngày trong tuần của từng WorkoutDay
-- Quy ước:
-- 1 = Thứ 2
-- 2 = Thứ 3
-- ...
-- 7 = Chủ nhật
-- =====================================================
ALTER TABLE WorkoutDays
ADD COLUMN weekDay TINYINT NULL AFTER `order`;

ALTER TABLE WorkoutDays
ADD CONSTRAINT chk_workout_day_weekday
CHECK (weekDay IS NULL OR weekDay BETWEEN 1 AND 7);


-- =====================================================
-- 4. WorkoutSession thuộc ngày tập nào
-- =====================================================
ALTER TABLE WorkoutSessions
ADD COLUMN dayId INT NULL AFTER profileId;

ALTER TABLE WorkoutSessions
ADD CONSTRAINT fk_workoutsession_day
FOREIGN KEY (dayId)
REFERENCES WorkoutDays(dayId)
ON DELETE SET NULL
ON UPDATE CASCADE;


SELECT * FROM `accounts`;
SELECT * FROM `gymusers`;
SELECT * FROM `loginsessions`;

-- ===================================================================== --
-- =========== DỮ LIỆU MẪU CHO LỊCH TẬP ================================ --
-- ===================================================================== --
START TRANSACTION;

-- ============================================================
-- 0. ADMIN TẠO GIÁO ÁN
-- ============================================================

SET @adminId = (
    SELECT accountId
    FROM Accounts
    WHERE role = 'ADMIN'
    ORDER BY accountId
    LIMIT 1
);

-- Kiểm tra trước khi tiếp tục
SELECT @adminId AS AdminCreatorId;


-- ============================================================
-- 1. BỔ SUNG THƯ VIỆN EXERCISES
-- ============================================================
-- Không insert lại nếu exercise có cùng name đã tồn tại.

DROP TEMPORARY TABLE IF EXISTS TempExercises;

CREATE TEMPORARY TABLE TempExercises (
    name VARCHAR(150),
    description TEXT,
    difficulty VARCHAR(20)
);

INSERT INTO TempExercises
(name, description, difficulty)
VALUES

-- =========================
-- CHEST
-- =========================
('Incline Barbell Bench Press',
 'Bài tập đẩy ngực trên với thanh đòn, tập trung vào phần ngực trên và hỗ trợ phát triển sức mạnh đẩy.',
 'MEDIUM'),

('Incline Dumbbell Press',
 'Bài tập đẩy ngực trên bằng tạ đơn giúp tăng biên độ chuyển động và cải thiện cân bằng hai bên.',
 'MEDIUM'),

('Dumbbell Bench Press',
 'Bài tập đẩy ngực với tạ đơn giúp phát triển cơ ngực và tăng khả năng kiểm soát từng bên.',
 'MEDIUM'),

('Chest Press Machine',
 'Bài tập đẩy ngực trên máy, phù hợp để tập trung vào cơ ngực với độ ổn định cao.',
 'EASY'),

('Cable Fly',
 'Bài tập khép tay với cáp giúp cô lập cơ ngực và duy trì lực căng trong suốt biên độ chuyển động.',
 'MEDIUM'),

('Pec Deck Fly',
 'Bài tập ép ngực trên máy giúp cô lập cơ ngực và kiểm soát chuyển động tốt.',
 'EASY'),

('Push Up',
 'Bài tập trọng lượng cơ thể phát triển cơ ngực, vai trước, tay sau và khả năng ổn định thân người.',
 'EASY'),


-- =========================
-- BACK
-- =========================
('Pull Up',
 'Bài tập kéo trọng lượng cơ thể giúp phát triển cơ xô, lưng trên và sức mạnh kéo.',
 'HARD'),

('Chin Up',
 'Bài tập kéo xà với lòng bàn tay hướng vào người, tác động mạnh vào cơ xô và tay trước.',
 'HARD'),

('Barbell Bent Over Row',
 'Bài tập kéo thanh đòn khi gập thân giúp phát triển độ dày của lưng và sức mạnh chuỗi sau.',
 'HARD'),

('Dumbbell Row',
 'Bài tập kéo tạ đơn một tay giúp phát triển cơ xô và cải thiện cân bằng sức mạnh hai bên.',
 'MEDIUM'),

('Seated Cable Row',
 'Bài tập kéo cáp ngang giúp phát triển lưng giữa, cơ xô và khả năng kiểm soát xương bả vai.',
 'MEDIUM'),

('T-Bar Row',
 'Bài tập kéo T-bar tập trung phát triển độ dày lưng giữa và cơ xô.',
 'HARD'),

('Straight Arm Pulldown',
 'Bài tập kéo cáp tay thẳng giúp cô lập cơ xô và cải thiện khả năng cảm nhận cơ.',
 'MEDIUM'),

('Face Pull',
 'Bài tập kéo dây về mặt giúp phát triển vai sau, lưng trên và hỗ trợ sức khỏe khớp vai.',
 'MEDIUM'),


-- =========================
-- SHOULDERS
-- =========================
('Barbell Overhead Press',
 'Bài tập đẩy thanh đòn qua đầu giúp phát triển sức mạnh vai, tay sau và thân trên.',
 'HARD'),

('Arnold Press',
 'Bài tập đẩy vai với chuyển động xoay giúp phát triển toàn diện cơ vai.',
 'MEDIUM'),

('Machine Shoulder Press',
 'Bài tập đẩy vai trên máy giúp tập trung vào cơ vai với độ ổn định cao.',
 'EASY'),

('Cable Lateral Raise',
 'Bài tập nâng tay ngang bằng cáp giúp duy trì lực căng liên tục lên vai giữa.',
 'MEDIUM'),

('Reverse Pec Deck',
 'Bài tập mở vai sau trên máy giúp phát triển vai sau và lưng trên.',
 'EASY'),

('Rear Delt Fly',
 'Bài tập dang tay tập trung vào vai sau và hỗ trợ cân bằng cơ vai.',
 'MEDIUM'),


-- =========================
-- BICEPS
-- =========================
('Barbell Curl',
 'Bài tập cuốn thanh đòn giúp phát triển sức mạnh và khối lượng cơ tay trước.',
 'EASY'),

('Dumbbell Curl',
 'Bài tập cuốn tạ đơn giúp phát triển cơ tay trước và cải thiện cân bằng hai bên.',
 'EASY'),

('Hammer Curl',
 'Bài tập cuốn tạ kiểu búa tác động vào brachialis, brachioradialis và cơ tay trước.',
 'EASY'),

('Incline Dumbbell Curl',
 'Bài tập cuốn tạ trên ghế nghiêng giúp cơ tay trước làm việc ở vị trí kéo giãn lớn.',
 'MEDIUM'),

('Preacher Curl',
 'Bài tập cuốn tay trên ghế preacher giúp hạn chế gian lận và cô lập cơ tay trước.',
 'MEDIUM'),

('Cable Curl',
 'Bài tập cuốn tay với cáp duy trì lực căng liên tục trên cơ tay trước.',
 'EASY'),


-- =========================
-- TRICEPS
-- =========================
('Triceps Pushdown',
 'Bài tập duỗi tay với cáp giúp cô lập và phát triển cơ tay sau.',
 'EASY'),

('Overhead Triceps Extension',
 'Bài tập duỗi tay qua đầu tập trung nhiều vào đầu dài của cơ tay sau.',
 'MEDIUM'),

('Skull Crusher',
 'Bài tập duỗi khuỷu với thanh tạ giúp phát triển toàn diện cơ tay sau.',
 'MEDIUM'),

('Close Grip Bench Press',
 'Biến thể bench press với tay hẹp giúp phát triển sức mạnh cơ tay sau và khả năng đẩy.',
 'HARD'),

('Bench Dips',
 'Bài tập dips trên ghế sử dụng trọng lượng cơ thể để tác động vào cơ tay sau.',
 'MEDIUM'),


-- =========================
-- QUADRICEPS / LEGS
-- =========================
('Front Squat',
 'Biến thể squat đặt thanh đòn phía trước giúp tăng tác động lên cơ đùi trước và yêu cầu thân người thẳng hơn.',
 'HARD'),

('Leg Press',
 'Bài tập đạp chân trên máy giúp phát triển đùi trước, mông và đùi sau với độ ổn định cao.',
 'MEDIUM'),

('Hack Squat',
 'Bài tập squat trên máy hack giúp tập trung mạnh vào cơ đùi trước.',
 'MEDIUM'),

('Bulgarian Split Squat',
 'Bài tập squat một chân giúp phát triển đùi, mông và cải thiện cân bằng hai bên.',
 'HARD'),

('Walking Lunge',
 'Bài tập bước chùng chân giúp phát triển đùi trước, đùi sau, mông và khả năng thăng bằng.',
 'MEDIUM'),

('Leg Extension',
 'Bài tập duỗi gối trên máy giúp cô lập cơ đùi trước.',
 'EASY'),


-- =========================
-- HAMSTRINGS / GLUTES
-- =========================
('Romanian Deadlift',
 'Bài tập hip hinge tập trung vào cơ đùi sau, mông và chuỗi cơ phía sau.',
 'HARD'),

('Lying Leg Curl',
 'Bài tập gập gối nằm giúp cô lập và phát triển cơ đùi sau.',
 'EASY'),

('Seated Leg Curl',
 'Bài tập gập gối ngồi giúp phát triển cơ đùi sau trong vị trí kéo giãn tốt.',
 'EASY'),

('Hip Thrust',
 'Bài tập duỗi hông với thanh tạ tập trung mạnh vào cơ mông.',
 'MEDIUM'),

('Glute Bridge',
 'Bài tập nâng hông giúp phát triển cơ mông và cải thiện khả năng kiểm soát hông.',
 'EASY'),

('Good Morning',
 'Bài tập hip hinge với thanh đòn giúp phát triển đùi sau, mông và nhóm cơ dựng sống.',
 'HARD'),


-- =========================
-- CALVES
-- =========================
('Standing Calf Raise',
 'Bài tập nhón chân đứng giúp phát triển cơ bắp chân, đặc biệt là gastrocnemius.',
 'EASY'),

('Seated Calf Raise',
 'Bài tập nhón chân ngồi tập trung nhiều vào cơ soleus của bắp chân.',
 'EASY'),


-- =========================
-- CORE
-- =========================
('Plank',
 'Bài tập giữ thân người tĩnh giúp phát triển khả năng ổn định core.',
 'EASY'),

('Hanging Leg Raise',
 'Bài tập nâng chân khi treo người giúp phát triển cơ bụng và khả năng kiểm soát vùng chậu.',
 'HARD'),

('Cable Crunch',
 'Bài tập gập bụng với cáp cho phép tăng tải có kiểm soát lên cơ bụng.',
 'MEDIUM'),

('Ab Wheel Rollout',
 'Bài tập rollout giúp phát triển khả năng chống duỗi của core và sức mạnh thân người.',
 'HARD'),

('Russian Twist',
 'Bài tập xoay thân giúp phát triển khả năng kiểm soát và sức mạnh xoay của core.',
 'MEDIUM');


-- Chỉ thêm exercise chưa tồn tại

INSERT INTO Exercises (
    name,
    description,
    difficulty
)
SELECT
    te.name,
    te.description,
    te.difficulty
FROM TempExercises te
WHERE NOT EXISTS (
    SELECT 1
    FROM Exercises e
    WHERE e.name = te.name
);


-- ============================================================
-- 2. TẠO WORKOUT PLANS
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS TempPlans;

CREATE TEMPORARY TABLE TempPlans (
    title VARCHAR(150),
    description TEXT,
    isTemplate BOOLEAN,
    level VARCHAR(20)
);

INSERT INTO TempPlans
(title, description, isTemplate, level)
VALUES

(
 'Beginner Full Body 3 Days',
 'Giáo án toàn thân 3 buổi mỗi tuần dành cho người mới, tập trung xây dựng kỹ thuật, nền tảng sức mạnh và khả năng thích nghi với tập luyện.',
 TRUE,
 'BEGINNER'
),

(
 'Upper Lower 4 Days',
 'Giáo án Upper/Lower 4 buổi mỗi tuần giúp phân bổ khối lượng tập hợp lý giữa thân trên và thân dưới.',
 TRUE,
 'INTERMEDIATE'
),

(
 'Push Pull Legs 6 Days',
 'Giáo án Push Pull Legs 6 buổi mỗi tuần, phân chia nhóm cơ theo chức năng đẩy, kéo và chân.',
 TRUE,
 'INTERMEDIATE'
),

(
 'Push Pull Legs 3 Days',
 'Biến thể Push Pull Legs 3 buổi mỗi tuần phù hợp với người có thời gian tập hạn chế nhưng vẫn muốn tập toàn diện.',
 TRUE,
 'BEGINNER'
),

(
 'Upper Lower Strength 4 Days',
 'Giáo án Upper/Lower thiên về phát triển sức mạnh ở các compound lift kết hợp bài bổ trợ.',
 TRUE,
 'ADVANCED'
),

(
 'Hypertrophy 5 Days',
 'Giáo án 5 buổi tập trung phát triển cơ bắp với sự kết hợp giữa bài compound và isolation.',
 TRUE,
 'INTERMEDIATE'
),

(
 'Strength Foundation 3 Days',
 'Giáo án xây dựng nền tảng sức mạnh với Squat, Bench Press, Deadlift và các bài hỗ trợ.',
 TRUE,
 'INTERMEDIATE'
),

(
 'Advanced Push Pull Legs',
 'Giáo án PPL khối lượng cao dành cho người tập có kinh nghiệm và khả năng phục hồi tốt.',
 TRUE,
 'ADVANCED'
);


INSERT INTO WorkoutPlans (
    title,
    description,
    creatorId,
    isTemplate,
    level
)
SELECT
    tp.title,
    tp.description,
    @adminId,
    tp.isTemplate,
    tp.level
FROM TempPlans tp
WHERE NOT EXISTS (
    SELECT 1
    FROM WorkoutPlans wp
    WHERE wp.title = tp.title
);


-- ============================================================
-- 3. WORKOUT DAYS
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS TempDays;

CREATE TEMPORARY TABLE TempDays (
    planTitle VARCHAR(150),
    dayName VARCHAR(100),
    dayOrder INT
);

INSERT INTO TempDays
(planTitle, dayName, dayOrder)
VALUES

-- Beginner Full Body
('Beginner Full Body 3 Days', 'FULL BODY A', 1),
('Beginner Full Body 3 Days', 'FULL BODY B', 2),
('Beginner Full Body 3 Days', 'FULL BODY C', 3),

-- Upper Lower
('Upper Lower 4 Days', 'UPPER A', 1),
('Upper Lower 4 Days', 'LOWER A', 2),
('Upper Lower 4 Days', 'UPPER B', 3),
('Upper Lower 4 Days', 'LOWER B', 4),

-- PPL 6
('Push Pull Legs 6 Days', 'PUSH A', 1),
('Push Pull Legs 6 Days', 'PULL A', 2),
('Push Pull Legs 6 Days', 'LEGS A', 3),
('Push Pull Legs 6 Days', 'PUSH B', 4),
('Push Pull Legs 6 Days', 'PULL B', 5),
('Push Pull Legs 6 Days', 'LEGS B', 6),

-- PPL 3
('Push Pull Legs 3 Days', 'PUSH', 1),
('Push Pull Legs 3 Days', 'PULL', 2),
('Push Pull Legs 3 Days', 'LEGS', 3),

-- Strength Upper Lower
('Upper Lower Strength 4 Days', 'UPPER STRENGTH', 1),
('Upper Lower Strength 4 Days', 'LOWER STRENGTH', 2),
('Upper Lower Strength 4 Days', 'UPPER VOLUME', 3),
('Upper Lower Strength 4 Days', 'LOWER VOLUME', 4),

-- Hypertrophy 5
('Hypertrophy 5 Days', 'CHEST & TRICEPS', 1),
('Hypertrophy 5 Days', 'BACK & BICEPS', 2),
('Hypertrophy 5 Days', 'LEGS', 3),
('Hypertrophy 5 Days', 'SHOULDERS & ARMS', 4),
('Hypertrophy 5 Days', 'UPPER BODY', 5),

-- Strength Foundation
('Strength Foundation 3 Days', 'SQUAT FOCUS', 1),
('Strength Foundation 3 Days', 'BENCH FOCUS', 2),
('Strength Foundation 3 Days', 'DEADLIFT FOCUS', 3),

-- Advanced PPL
('Advanced Push Pull Legs', 'PUSH STRENGTH', 1),
('Advanced Push Pull Legs', 'PULL STRENGTH', 2),
('Advanced Push Pull Legs', 'LEGS STRENGTH', 3),
('Advanced Push Pull Legs', 'PUSH HYPERTROPHY', 4),
('Advanced Push Pull Legs', 'PULL HYPERTROPHY', 5),
('Advanced Push Pull Legs', 'LEGS HYPERTROPHY', 6);


INSERT INTO WorkoutDays (
    planId,
    dayName,
    `order`
)
SELECT
    wp.planId,
    td.dayName,
    td.dayOrder
FROM TempDays td

INNER JOIN WorkoutPlans wp
    ON wp.title = td.planTitle

WHERE NOT EXISTS (
    SELECT 1
    FROM WorkoutDays wd
    WHERE wd.planId = wp.planId
      AND wd.`order` = td.dayOrder
);


-- ============================================================
-- 4. EXERCISE CONFIGS
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS TempConfigs;

CREATE TEMPORARY TABLE TempConfigs (
    planTitle VARCHAR(150),
    dayOrder INT,
    exerciseName VARCHAR(150),
    sets INT,
    reps INT,
    restTime INT,
    exerciseOrder INT
);


-- ============================================================
-- BEGINNER FULL BODY 3 DAYS
-- ============================================================

INSERT INTO TempConfigs VALUES

('Beginner Full Body 3 Days',1,'Barbell Squat',3,8,120,1),
('Beginner Full Body 3 Days',1,'Barbell Bench Press',3,8,120,2),
('Beginner Full Body 3 Days',1,'Lat Pulldown',3,10,90,3),
('Beginner Full Body 3 Days',1,'Dumbbell Shoulder Press',2,10,90,4),
('Beginner Full Body 3 Days',1,'Plank',3,30,60,5),

('Beginner Full Body 3 Days',2,'Leg Press',3,10,120,1),
('Beginner Full Body 3 Days',2,'Dumbbell Bench Press',3,10,90,2),
('Beginner Full Body 3 Days',2,'Seated Cable Row',3,10,90,3),
('Beginner Full Body 3 Days',2,'Lateral Raise',2,12,60,4),
('Beginner Full Body 3 Days',2,'Dumbbell Curl',2,12,60,5),
('Beginner Full Body 3 Days',2,'Triceps Pushdown',2,12,60,6),

('Beginner Full Body 3 Days',3,'Barbell Squat',3,10,120,1),
('Beginner Full Body 3 Days',3,'Incline Dumbbell Press',3,10,90,2),
('Beginner Full Body 3 Days',3,'Lat Pulldown',3,12,90,3),
('Beginner Full Body 3 Days',3,'Romanian Deadlift',3,10,120,4),
('Beginner Full Body 3 Days',3,'Cable Crunch',3,12,60,5);


-- ============================================================
-- UPPER LOWER 4 DAYS
-- ============================================================

INSERT INTO TempConfigs VALUES

('Upper Lower 4 Days',1,'Barbell Bench Press',4,6,150,1),
('Upper Lower 4 Days',1,'Barbell Bent Over Row',4,8,120,2),
('Upper Lower 4 Days',1,'Incline Dumbbell Press',3,10,90,3),
('Upper Lower 4 Days',1,'Lat Pulldown',3,10,90,4),
('Upper Lower 4 Days',1,'Lateral Raise',3,15,60,5),
('Upper Lower 4 Days',1,'Triceps Pushdown',3,12,60,6),

('Upper Lower 4 Days',2,'Barbell Squat',4,6,180,1),
('Upper Lower 4 Days',2,'Romanian Deadlift',3,8,150,2),
('Upper Lower 4 Days',2,'Leg Press',3,10,120,3),
('Upper Lower 4 Days',2,'Lying Leg Curl',3,12,90,4),
('Upper Lower 4 Days',2,'Standing Calf Raise',4,12,60,5),

('Upper Lower 4 Days',3,'Barbell Overhead Press',4,6,150,1),
('Upper Lower 4 Days',3,'Pull Up',3,8,120,2),
('Upper Lower 4 Days',3,'Dumbbell Bench Press',3,10,90,3),
('Upper Lower 4 Days',3,'Seated Cable Row',3,10,90,4),
('Upper Lower 4 Days',3,'Face Pull',3,15,60,5),
('Upper Lower 4 Days',3,'Barbell Curl',3,10,60,6),

('Upper Lower 4 Days',4,'Deadlift',3,5,180,1),
('Upper Lower 4 Days',4,'Front Squat',3,8,150,2),
('Upper Lower 4 Days',4,'Bulgarian Split Squat',3,10,90,3),
('Upper Lower 4 Days',4,'Seated Leg Curl',3,12,90,4),
('Upper Lower 4 Days',4,'Seated Calf Raise',4,15,60,5);


-- ============================================================
-- PUSH PULL LEGS 6 DAYS
-- ============================================================

INSERT INTO TempConfigs VALUES

-- PUSH A
('Push Pull Legs 6 Days',1,'Barbell Bench Press',4,6,150,1),
('Push Pull Legs 6 Days',1,'Incline Dumbbell Press',3,10,90,2),
('Push Pull Legs 6 Days',1,'Dumbbell Shoulder Press',3,10,90,3),
('Push Pull Legs 6 Days',1,'Lateral Raise',3,15,60,4),
('Push Pull Legs 6 Days',1,'Triceps Pushdown',3,12,60,5),

-- PULL A
('Push Pull Legs 6 Days',2,'Barbell Bent Over Row',4,8,120,1),
('Push Pull Legs 6 Days',2,'Lat Pulldown',3,10,90,2),
('Push Pull Legs 6 Days',2,'Seated Cable Row',3,10,90,3),
('Push Pull Legs 6 Days',2,'Face Pull',3,15,60,4),
('Push Pull Legs 6 Days',2,'Barbell Curl',3,10,60,5),
('Push Pull Legs 6 Days',2,'Hammer Curl',3,12,60,6),

-- LEGS A
('Push Pull Legs 6 Days',3,'Barbell Squat',4,6,180,1),
('Push Pull Legs 6 Days',3,'Romanian Deadlift',3,8,150,2),
('Push Pull Legs 6 Days',3,'Leg Press',3,10,120,3),
('Push Pull Legs 6 Days',3,'Leg Extension',3,12,60,4),
('Push Pull Legs 6 Days',3,'Lying Leg Curl',3,12,60,5),
('Push Pull Legs 6 Days',3,'Standing Calf Raise',4,15,60,6),

-- PUSH B
('Push Pull Legs 6 Days',4,'Barbell Overhead Press',4,6,150,1),
('Push Pull Legs 6 Days',4,'Incline Barbell Bench Press',3,8,120,2),
('Push Pull Legs 6 Days',4,'Chest Press Machine',3,12,75,3),
('Push Pull Legs 6 Days',4,'Cable Lateral Raise',4,15,60,4),
('Push Pull Legs 6 Days',4,'Overhead Triceps Extension',3,12,60,5),

-- PULL B
('Push Pull Legs 6 Days',5,'Pull Up',4,8,120,1),
('Push Pull Legs 6 Days',5,'T-Bar Row',3,10,120,2),
('Push Pull Legs 6 Days',5,'Straight Arm Pulldown',3,12,60,3),
('Push Pull Legs 6 Days',5,'Reverse Pec Deck',3,15,60,4),
('Push Pull Legs 6 Days',5,'Incline Dumbbell Curl',3,12,60,5),

-- LEGS B
('Push Pull Legs 6 Days',6,'Front Squat',4,8,150,1),
('Push Pull Legs 6 Days',6,'Hip Thrust',4,10,120,2),
('Push Pull Legs 6 Days',6,'Bulgarian Split Squat',3,10,90,3),
('Push Pull Legs 6 Days',6,'Seated Leg Curl',3,12,60,4),
('Push Pull Legs 6 Days',6,'Leg Extension',3,15,60,5),
('Push Pull Legs 6 Days',6,'Seated Calf Raise',4,15,60,6);


-- ============================================================
-- PPL 3 DAYS
-- ============================================================

INSERT INTO TempConfigs VALUES

('Push Pull Legs 3 Days',1,'Barbell Bench Press',3,8,120,1),
('Push Pull Legs 3 Days',1,'Incline Dumbbell Press',3,10,90,2),
('Push Pull Legs 3 Days',1,'Dumbbell Shoulder Press',3,10,90,3),
('Push Pull Legs 3 Days',1,'Lateral Raise',3,15,60,4),
('Push Pull Legs 3 Days',1,'Triceps Pushdown',3,12,60,5),

('Push Pull Legs 3 Days',2,'Deadlift',3,5,180,1),
('Push Pull Legs 3 Days',2,'Lat Pulldown',3,10,90,2),
('Push Pull Legs 3 Days',2,'Seated Cable Row',3,10,90,3),
('Push Pull Legs 3 Days',2,'Face Pull',3,15,60,4),
('Push Pull Legs 3 Days',2,'Dumbbell Curl',3,12,60,5),

('Push Pull Legs 3 Days',3,'Barbell Squat',4,8,150,1),
('Push Pull Legs 3 Days',3,'Romanian Deadlift',3,10,120,2),
('Push Pull Legs 3 Days',3,'Leg Press',3,12,90,3),
('Push Pull Legs 3 Days',3,'Lying Leg Curl',3,12,60,4),
('Push Pull Legs 3 Days',3,'Standing Calf Raise',4,15,60,5);


-- ============================================================
-- STRENGTH FOUNDATION
-- ============================================================

INSERT INTO TempConfigs VALUES

('Strength Foundation 3 Days',1,'Barbell Squat',5,5,180,1),
('Strength Foundation 3 Days',1,'Barbell Bench Press',3,6,150,2),
('Strength Foundation 3 Days',1,'Barbell Bent Over Row',3,8,120,3),
('Strength Foundation 3 Days',1,'Romanian Deadlift',3,8,120,4),

('Strength Foundation 3 Days',2,'Barbell Bench Press',5,5,180,1),
('Strength Foundation 3 Days',2,'Barbell Overhead Press',3,6,150,2),
('Strength Foundation 3 Days',2,'Lat Pulldown',3,8,90,3),
('Strength Foundation 3 Days',2,'Triceps Pushdown',3,10,60,4),

('Strength Foundation 3 Days',3,'Deadlift',3,5,210,1),
('Strength Foundation 3 Days',3,'Front Squat',3,6,150,2),
('Strength Foundation 3 Days',3,'Pull Up',3,8,120,3),
('Strength Foundation 3 Days',3,'Face Pull',3,15,60,4);


-- ============================================================
-- HYPERTROPHY 5 DAYS
-- ============================================================

INSERT INTO TempConfigs VALUES

-- CHEST + TRICEPS
('Hypertrophy 5 Days',1,'Barbell Bench Press',4,8,120,1),
('Hypertrophy 5 Days',1,'Incline Dumbbell Press',3,10,90,2),
('Hypertrophy 5 Days',1,'Chest Press Machine',3,12,75,3),
('Hypertrophy 5 Days',1,'Cable Fly',3,15,60,4),
('Hypertrophy 5 Days',1,'Triceps Pushdown',3,12,60,5),
('Hypertrophy 5 Days',1,'Overhead Triceps Extension',3,12,60,6),

-- BACK + BICEPS
('Hypertrophy 5 Days',2,'Pull Up',3,8,120,1),
('Hypertrophy 5 Days',2,'Lat Pulldown',3,10,90,2),
('Hypertrophy 5 Days',2,'T-Bar Row',3,10,90,3),
('Hypertrophy 5 Days',2,'Seated Cable Row',3,12,75,4),
('Hypertrophy 5 Days',2,'Barbell Curl',3,10,60,5),
('Hypertrophy 5 Days',2,'Hammer Curl',3,12,60,6),

-- LEGS
('Hypertrophy 5 Days',3,'Barbell Squat',4,8,150,1),
('Hypertrophy 5 Days',3,'Romanian Deadlift',4,8,150,2),
('Hypertrophy 5 Days',3,'Leg Press',3,12,90,3),
('Hypertrophy 5 Days',3,'Leg Extension',3,15,60,4),
('Hypertrophy 5 Days',3,'Seated Leg Curl',3,15,60,5),
('Hypertrophy 5 Days',3,'Standing Calf Raise',4,15,60,6),

-- SHOULDERS + ARMS
('Hypertrophy 5 Days',4,'Dumbbell Shoulder Press',4,10,90,1),
('Hypertrophy 5 Days',4,'Lateral Raise',4,15,60,2),
('Hypertrophy 5 Days',4,'Reverse Pec Deck',3,15,60,3),
('Hypertrophy 5 Days',4,'Incline Dumbbell Curl',3,12,60,4),
('Hypertrophy 5 Days',4,'Skull Crusher',3,12,60,5),
('Hypertrophy 5 Days',4,'Hammer Curl',3,12,60,6),

-- UPPER
('Hypertrophy 5 Days',5,'Incline Barbell Bench Press',3,8,120,1),
('Hypertrophy 5 Days',5,'Barbell Bent Over Row',3,8,120,2),
('Hypertrophy 5 Days',5,'Dumbbell Bench Press',3,12,75,3),
('Hypertrophy 5 Days',5,'Lat Pulldown',3,12,75,4),
('Hypertrophy 5 Days',5,'Cable Lateral Raise',3,15,60,5),
('Hypertrophy 5 Days',5,'Face Pull',3,15,60,6);


-- ============================================================
-- UPPER LOWER STRENGTH
-- ============================================================

INSERT INTO TempConfigs VALUES

('Upper Lower Strength 4 Days',1,'Barbell Bench Press',5,5,180,1),
('Upper Lower Strength 4 Days',1,'Barbell Overhead Press',4,6,150,2),
('Upper Lower Strength 4 Days',1,'Barbell Bent Over Row',4,6,150,3),
('Upper Lower Strength 4 Days',1,'Pull Up',3,8,120,4),

('Upper Lower Strength 4 Days',2,'Barbell Squat',5,5,210,1),
('Upper Lower Strength 4 Days',2,'Romanian Deadlift',4,6,180,2),
('Upper Lower Strength 4 Days',2,'Leg Press',3,8,120,3),
('Upper Lower Strength 4 Days',2,'Standing Calf Raise',4,12,60,4),

('Upper Lower Strength 4 Days',3,'Incline Barbell Bench Press',4,8,120,1),
('Upper Lower Strength 4 Days',3,'Seated Cable Row',4,8,120,2),
('Upper Lower Strength 4 Days',3,'Dumbbell Shoulder Press',3,10,90,3),
('Upper Lower Strength 4 Days',3,'Lat Pulldown',3,10,90,4),
('Upper Lower Strength 4 Days',3,'Barbell Curl',3,10,60,5),
('Upper Lower Strength 4 Days',3,'Triceps Pushdown',3,10,60,6),

('Upper Lower Strength 4 Days',4,'Deadlift',3,5,210,1),
('Upper Lower Strength 4 Days',4,'Front Squat',4,8,150,2),
('Upper Lower Strength 4 Days',4,'Bulgarian Split Squat',3,10,90,3),
('Upper Lower Strength 4 Days',4,'Lying Leg Curl',3,12,60,4),
('Upper Lower Strength 4 Days',4,'Seated Calf Raise',4,15,60,5);


-- ============================================================
-- ADVANCED PPL
-- ============================================================

INSERT INTO TempConfigs VALUES

('Advanced Push Pull Legs',1,'Barbell Bench Press',5,5,180,1),
('Advanced Push Pull Legs',1,'Barbell Overhead Press',4,6,150,2),
('Advanced Push Pull Legs',1,'Incline Dumbbell Press',3,8,120,3),
('Advanced Push Pull Legs',1,'Close Grip Bench Press',3,8,120,4),
('Advanced Push Pull Legs',1,'Lateral Raise',4,12,60,5),

('Advanced Push Pull Legs',2,'Deadlift',3,4,240,1),
('Advanced Push Pull Legs',2,'Barbell Bent Over Row',4,6,150,2),
('Advanced Push Pull Legs',2,'Pull Up',4,6,150,3),
('Advanced Push Pull Legs',2,'Face Pull',3,15,60,4),
('Advanced Push Pull Legs',2,'Barbell Curl',3,8,75,5),

('Advanced Push Pull Legs',3,'Barbell Squat',5,5,210,1),
('Advanced Push Pull Legs',3,'Romanian Deadlift',4,6,180,2),
('Advanced Push Pull Legs',3,'Leg Press',3,8,120,3),
('Advanced Push Pull Legs',3,'Standing Calf Raise',4,12,60,4),

('Advanced Push Pull Legs',4,'Incline Barbell Bench Press',4,10,90,1),
('Advanced Push Pull Legs',4,'Dumbbell Bench Press',3,12,75,2),
('Advanced Push Pull Legs',4,'Machine Shoulder Press',3,12,75,3),
('Advanced Push Pull Legs',4,'Cable Fly',3,15,60,4),
('Advanced Push Pull Legs',4,'Cable Lateral Raise',4,15,45,5),
('Advanced Push Pull Legs',4,'Overhead Triceps Extension',3,15,60,6),

('Advanced Push Pull Legs',5,'Lat Pulldown',4,10,90,1),
('Advanced Push Pull Legs',5,'T-Bar Row',4,10,90,2),
('Advanced Push Pull Legs',5,'Seated Cable Row',3,12,75,3),
('Advanced Push Pull Legs',5,'Straight Arm Pulldown',3,15,60,4),
('Advanced Push Pull Legs',5,'Reverse Pec Deck',4,15,45,5),
('Advanced Push Pull Legs',5,'Incline Dumbbell Curl',3,12,60,6),

('Advanced Push Pull Legs',6,'Front Squat',4,10,120,1),
('Advanced Push Pull Legs',6,'Hip Thrust',4,10,120,2),
('Advanced Push Pull Legs',6,'Bulgarian Split Squat',3,12,90,3),
('Advanced Push Pull Legs',6,'Leg Extension',3,15,60,4),
('Advanced Push Pull Legs',6,'Seated Leg Curl',3,15,60,5),
('Advanced Push Pull Legs',6,'Seated Calf Raise',4,15,60,6);


-- ============================================================
-- INSERT CONFIG THỰC TẾ
-- ============================================================

INSERT INTO ExerciseConfigs (
    exerciseId,
    dayId,
    sets,
    reps,
    restTime,
    `order`
)
SELECT
    e.exerciseId,
    wd.dayId,
    tc.sets,
    tc.reps,
    tc.restTime,
    tc.exerciseOrder

FROM TempConfigs tc

INNER JOIN WorkoutPlans wp
    ON wp.title = tc.planTitle

INNER JOIN WorkoutDays wd
    ON wd.planId = wp.planId
   AND wd.`order` = tc.dayOrder

INNER JOIN Exercises e
    ON e.name = tc.exerciseName

WHERE NOT EXISTS (
    SELECT 1
    FROM ExerciseConfigs ec
    WHERE ec.dayId = wd.dayId
      AND ec.`order` = tc.exerciseOrder
);


COMMIT;



SELECT
    wp.planId,
    wp.title,
    wp.level,

    wd.dayId,
    wd.dayName,
    wd.`order` AS dayOrder,

    ec.configId,
    e.exerciseId,
    e.name AS exerciseName,

    ec.sets,
    ec.reps,
    ec.restTime,
    ec.`order` AS exerciseOrder

FROM WorkoutPlans wp

INNER JOIN WorkoutDays wd
    ON wd.planId = wp.planId

INNER JOIN ExerciseConfigs ec
    ON ec.dayId = wd.dayId

INNER JOIN Exercises e
    ON e.exerciseId = ec.exerciseId

ORDER BY
    wp.planId,
    wd.`order`,
    ec.`order`;



USE QuanLyLichTapGym;

START TRANSACTION;

-- ============================================================
-- 1. BỔ SUNG MUSCLE GROUP NẾU CHƯA CÓ
-- ============================================================

INSERT IGNORE INTO MuscleGroups (groupName, `function`) VALUES
('Chest', 'Thực hiện các chuyển động đẩy và khép cánh tay ngang thân.'),
('Front Delts', 'Hỗ trợ nâng cánh tay về phía trước và các chuyển động đẩy.'),
('Side Delts', 'Thực hiện động tác dạng cánh tay sang hai bên.'),
('Rear Delts', 'Hỗ trợ đưa cánh tay ra sau và ổn định vai.'),
('Triceps', 'Duỗi khuỷu tay và hỗ trợ các động tác đẩy.'),
('Biceps', 'Gập khuỷu tay và hỗ trợ các động tác kéo.'),
('Forearms', 'Hỗ trợ lực nắm, gập và duỗi cổ tay.'),
('Lats', 'Thực hiện kéo cánh tay xuống và về phía thân.'),
('Upper Back', 'Hỗ trợ kéo, thu xương bả vai và ổn định thân trên.'),
('Lower Back', 'Hỗ trợ duỗi và ổn định cột sống.'),
('Quadriceps', 'Duỗi khớp gối và hỗ trợ các động tác squat.'),
('Hamstrings', 'Gập gối và duỗi hông.'),
('Glutes', 'Duỗi hông, dạng hông và ổn định vùng chậu.'),
('Calves', 'Thực hiện động tác gập bàn chân xuống.'),
('Abs', 'Ổn định thân người và hỗ trợ gập thân.');


-- ============================================================
-- 2. BỔ SUNG EQUIPMENT NẾU CHƯA CÓ
-- ============================================================

INSERT IGNORE INTO Equipment (equipmentName) VALUES
('Barbell'),
('Dumbbell'),
('Bench'),
('Cable Machine'),
('Chest Press Machine'),
('Pec Deck Machine'),
('Pull Up Bar'),
('T-Bar'),
('Shoulder Press Machine'),
('Preacher Bench'),
('Leg Press Machine'),
('Hack Squat Machine'),
('Leg Extension Machine'),
('Leg Curl Machine'),
('Calf Raise Machine'),
('Ab Wheel'),
('Bodyweight');


-- ============================================================
-- 3. BẢNG TẠM MAPPING PRIMARY / SECONDARY MUSCLES
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS TempExerciseMuscles;

CREATE TEMPORARY TABLE TempExerciseMuscles (
    exerciseName VARCHAR(150),
    muscleName VARCHAR(100),
    muscleRole ENUM('PRIMARY', 'SECONDARY')
);


INSERT INTO TempExerciseMuscles VALUES

-- =========================
-- CHEST
-- =========================

('Dumbbell Bench Press','Chest','PRIMARY'),
('Dumbbell Bench Press','Front Delts','SECONDARY'),
('Dumbbell Bench Press','Triceps','SECONDARY'),

('Chest Press Machine','Chest','PRIMARY'),
('Chest Press Machine','Front Delts','SECONDARY'),
('Chest Press Machine','Triceps','SECONDARY'),

('Cable Fly','Chest','PRIMARY'),
('Cable Fly','Front Delts','SECONDARY'),

('Pec Deck Fly','Chest','PRIMARY'),
('Pec Deck Fly','Front Delts','SECONDARY'),

('Push Up','Chest','PRIMARY'),
('Push Up','Triceps','SECONDARY'),
('Push Up','Front Delts','SECONDARY'),


-- =========================
-- BACK
-- =========================

('Pull Up','Lats','PRIMARY'),
('Pull Up','Upper Back','SECONDARY'),
('Pull Up','Biceps','SECONDARY'),
('Pull Up','Forearms','SECONDARY'),

('Chin Up','Lats','PRIMARY'),
('Chin Up','Biceps','SECONDARY'),
('Chin Up','Upper Back','SECONDARY'),
('Chin Up','Forearms','SECONDARY'),

('Barbell Bent Over Row','Upper Back','PRIMARY'),
('Barbell Bent Over Row','Lats','SECONDARY'),
('Barbell Bent Over Row','Rear Delts','SECONDARY'),
('Barbell Bent Over Row','Biceps','SECONDARY'),
('Barbell Bent Over Row','Lower Back','SECONDARY'),

('Dumbbell Row','Lats','PRIMARY'),
('Dumbbell Row','Upper Back','SECONDARY'),
('Dumbbell Row','Rear Delts','SECONDARY'),
('Dumbbell Row','Biceps','SECONDARY'),

('Seated Cable Row','Upper Back','PRIMARY'),
('Seated Cable Row','Lats','SECONDARY'),
('Seated Cable Row','Rear Delts','SECONDARY'),
('Seated Cable Row','Biceps','SECONDARY'),

('T-Bar Row','Upper Back','PRIMARY'),
('T-Bar Row','Lats','SECONDARY'),
('T-Bar Row','Rear Delts','SECONDARY'),
('T-Bar Row','Biceps','SECONDARY'),

('Straight Arm Pulldown','Lats','PRIMARY'),
('Straight Arm Pulldown','Triceps','SECONDARY'),

('Face Pull','Rear Delts','PRIMARY'),
('Face Pull','Upper Back','SECONDARY'),


-- =========================
-- SHOULDERS
-- =========================

('Barbell Overhead Press','Front Delts','PRIMARY'),
('Barbell Overhead Press','Side Delts','SECONDARY'),
('Barbell Overhead Press','Triceps','SECONDARY'),

('Arnold Press','Front Delts','PRIMARY'),
('Arnold Press','Side Delts','SECONDARY'),
('Arnold Press','Triceps','SECONDARY'),

('Machine Shoulder Press','Front Delts','PRIMARY'),
('Machine Shoulder Press','Side Delts','SECONDARY'),
('Machine Shoulder Press','Triceps','SECONDARY'),

('Cable Lateral Raise','Side Delts','PRIMARY'),

('Reverse Pec Deck','Rear Delts','PRIMARY'),
('Reverse Pec Deck','Upper Back','SECONDARY'),

('Rear Delt Fly','Rear Delts','PRIMARY'),
('Rear Delt Fly','Upper Back','SECONDARY'),


-- =========================
-- BICEPS
-- =========================

('Barbell Curl','Biceps','PRIMARY'),
('Barbell Curl','Forearms','SECONDARY'),

('Dumbbell Curl','Biceps','PRIMARY'),
('Dumbbell Curl','Forearms','SECONDARY'),

('Hammer Curl','Biceps','PRIMARY'),
('Hammer Curl','Forearms','SECONDARY'),

('Incline Dumbbell Curl','Biceps','PRIMARY'),
('Incline Dumbbell Curl','Forearms','SECONDARY'),

('Preacher Curl','Biceps','PRIMARY'),
('Preacher Curl','Forearms','SECONDARY'),

('Cable Curl','Biceps','PRIMARY'),
('Cable Curl','Forearms','SECONDARY'),


-- =========================
-- TRICEPS
-- =========================

('Triceps Pushdown','Triceps','PRIMARY'),

('Overhead Triceps Extension','Triceps','PRIMARY'),

('Skull Crusher','Triceps','PRIMARY'),

('Close Grip Bench Press','Triceps','PRIMARY'),
('Close Grip Bench Press','Chest','SECONDARY'),
('Close Grip Bench Press','Front Delts','SECONDARY'),

('Bench Dips','Triceps','PRIMARY'),
('Bench Dips','Chest','SECONDARY'),
('Bench Dips','Front Delts','SECONDARY'),


-- =========================
-- LEGS
-- =========================

('Front Squat','Quadriceps','PRIMARY'),
('Front Squat','Glutes','SECONDARY'),

('Leg Press','Quadriceps','PRIMARY'),
('Leg Press','Glutes','SECONDARY'),
('Leg Press','Hamstrings','SECONDARY'),

('Hack Squat','Quadriceps','PRIMARY'),
('Hack Squat','Glutes','SECONDARY'),

('Bulgarian Split Squat','Quadriceps','PRIMARY'),
('Bulgarian Split Squat','Glutes','SECONDARY'),
('Bulgarian Split Squat','Hamstrings','SECONDARY'),

('Walking Lunge','Quadriceps','PRIMARY'),
('Walking Lunge','Glutes','SECONDARY'),
('Walking Lunge','Hamstrings','SECONDARY'),

('Leg Extension','Quadriceps','PRIMARY'),


-- =========================
-- HAMSTRINGS / GLUTES
-- =========================

('Romanian Deadlift','Hamstrings','PRIMARY'),
('Romanian Deadlift','Glutes','SECONDARY'),
('Romanian Deadlift','Lower Back','SECONDARY'),

('Lying Leg Curl','Hamstrings','PRIMARY'),

('Seated Leg Curl','Hamstrings','PRIMARY'),

('Hip Thrust','Glutes','PRIMARY'),
('Hip Thrust','Hamstrings','SECONDARY'),

('Glute Bridge','Glutes','PRIMARY'),
('Glute Bridge','Hamstrings','SECONDARY'),

('Good Morning','Hamstrings','PRIMARY'),
('Good Morning','Glutes','SECONDARY'),
('Good Morning','Lower Back','SECONDARY'),


-- =========================
-- CALVES
-- =========================

('Standing Calf Raise','Calves','PRIMARY'),

('Seated Calf Raise','Calves','PRIMARY'),


-- =========================
-- CORE
-- =========================

('Plank','Abs','PRIMARY'),

('Hanging Leg Raise','Abs','PRIMARY'),

('Cable Crunch','Abs','PRIMARY'),

('Ab Wheel Rollout','Abs','PRIMARY'),

('Russian Twist','Abs','PRIMARY');


-- ============================================================
-- 4. INSERT MUSCLE RELATION
-- ============================================================
-- UNIQUE(exerciseId, groupId) trong schema sẽ ngăn duplicate.
-- NOT EXISTS giúp script chạy lại an toàn hơn.

INSERT INTO ExerciseMuscleGroups (
    exerciseId,
    groupId,
    role
)
SELECT
    e.exerciseId,
    mg.groupId,
    tem.muscleRole
FROM TempExerciseMuscles tem

INNER JOIN Exercises e
    ON e.name = tem.exerciseName

INNER JOIN MuscleGroups mg
    ON mg.groupName = tem.muscleName

WHERE NOT EXISTS (
    SELECT 1
    FROM ExerciseMuscleGroups emg
    WHERE emg.exerciseId = e.exerciseId
      AND emg.groupId = mg.groupId
);


-- ============================================================
-- 5. TẠO MAPPING EQUIPMENT
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS TempExerciseEquipment;

CREATE TEMPORARY TABLE TempExerciseEquipment (
    exerciseName VARCHAR(150),
    equipmentName VARCHAR(100)
);


INSERT INTO TempExerciseEquipment VALUES

-- CHEST
('Dumbbell Bench Press','Dumbbell'),
('Dumbbell Bench Press','Bench'),

('Chest Press Machine','Chest Press Machine'),

('Cable Fly','Cable Machine'),

('Pec Deck Fly','Pec Deck Machine'),

('Push Up','Bodyweight'),


-- BACK
('Pull Up','Pull Up Bar'),
('Pull Up','Bodyweight'),

('Chin Up','Pull Up Bar'),
('Chin Up','Bodyweight'),

('Barbell Bent Over Row','Barbell'),

('Dumbbell Row','Dumbbell'),
('Dumbbell Row','Bench'),

('Seated Cable Row','Cable Machine'),

('T-Bar Row','T-Bar'),

('Straight Arm Pulldown','Cable Machine'),

('Face Pull','Cable Machine'),


-- SHOULDERS
('Barbell Overhead Press','Barbell'),

('Arnold Press','Dumbbell'),

('Machine Shoulder Press','Shoulder Press Machine'),

('Cable Lateral Raise','Cable Machine'),

('Reverse Pec Deck','Pec Deck Machine'),

('Rear Delt Fly','Dumbbell'),


-- BICEPS
('Barbell Curl','Barbell'),

('Dumbbell Curl','Dumbbell'),

('Hammer Curl','Dumbbell'),

('Incline Dumbbell Curl','Dumbbell'),
('Incline Dumbbell Curl','Bench'),

('Preacher Curl','Barbell'),
('Preacher Curl','Preacher Bench'),

('Cable Curl','Cable Machine'),


-- TRICEPS
('Triceps Pushdown','Cable Machine'),

('Overhead Triceps Extension','Cable Machine'),

('Skull Crusher','Barbell'),
('Skull Crusher','Bench'),

('Close Grip Bench Press','Barbell'),
('Close Grip Bench Press','Bench'),

('Bench Dips','Bench'),
('Bench Dips','Bodyweight'),


-- LEGS
('Front Squat','Barbell'),

('Leg Press','Leg Press Machine'),

('Hack Squat','Hack Squat Machine'),

('Bulgarian Split Squat','Dumbbell'),
('Bulgarian Split Squat','Bench'),

('Walking Lunge','Dumbbell'),

('Leg Extension','Leg Extension Machine'),

('Romanian Deadlift','Barbell'),

('Lying Leg Curl','Leg Curl Machine'),

('Seated Leg Curl','Leg Curl Machine'),

('Hip Thrust','Barbell'),
('Hip Thrust','Bench'),

('Glute Bridge','Bodyweight'),

('Good Morning','Barbell'),


-- CALVES
('Standing Calf Raise','Calf Raise Machine'),

('Seated Calf Raise','Calf Raise Machine'),


-- CORE
('Plank','Bodyweight'),

('Hanging Leg Raise','Pull Up Bar'),
('Hanging Leg Raise','Bodyweight'),

('Cable Crunch','Cable Machine'),

('Ab Wheel Rollout','Ab Wheel'),

('Russian Twist','Bodyweight');


-- ============================================================
-- 6. INSERT EQUIPMENT RELATION
-- ============================================================

INSERT INTO ExerciseEquipment (
    exerciseId,
    equipmentId
)
SELECT
    e.exerciseId,
    eq.equipmentId

FROM TempExerciseEquipment tee

INNER JOIN Exercises e
    ON e.name = tee.exerciseName

INNER JOIN Equipment eq
    ON eq.equipmentName = tee.equipmentName

WHERE NOT EXISTS (
    SELECT 1
    FROM ExerciseEquipment ee
    WHERE ee.exerciseId = e.exerciseId
      AND ee.equipmentId = eq.equipmentId
);


COMMIT;

-- ===================================================================== --
-- ===================================================================== --
-- ===================================================================== --




-- =====================================================
-- STORE PROCEDURE
-- =====================================================
-- 1.Store Đăng nhập
DELIMITER $$

CREATE PROCEDURE sp_Login(
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_accountId INT;
    DECLARE v_role VARCHAR(20);
    DECLARE v_status VARCHAR(20);
    DECLARE v_loginSessionId INT;

    -- =====================================================
    -- 1. Tìm tài khoản theo Email + Password
    -- =====================================================

    SELECT 
        accountId,
        role,
        status
    INTO
        v_accountId,
        v_role,
        v_status
    FROM Accounts
    WHERE email = p_email
      AND password = p_password
    LIMIT 1;


    -- =====================================================
    -- 2. Không tìm thấy tài khoản
    -- =====================================================

    IF v_accountId IS NULL THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email hoặc mật khẩu không chính xác';

    -- =====================================================
    -- 3. Tài khoản không ACTIVE
    -- =====================================================

    ELSEIF v_status <> 'ACTIVE' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tài khoản đang bị khóa hoặc không hoạt động';

    ELSE

        -- =================================================
        -- 4. Tạo Login Session
        -- =================================================

        INSERT INTO LoginSessions (
            accountId,
            loginTime,
            expiration,
            status
        )
        VALUES (
            v_accountId,
            CURRENT_TIMESTAMP,
            DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR),
            'ACTIVE'
        );

        SET v_loginSessionId = LAST_INSERT_ID();


        -- =================================================
        -- 5. Nếu là ADMIN
        -- =================================================

        IF v_role = 'ADMIN' THEN

            SELECT
                a.*,
                v_loginSessionId AS loginSessionId,
                ls.loginTime,
                ls.expiration,
                ls.status AS sessionStatus
            FROM Accounts a
            INNER JOIN LoginSessions ls
                ON ls.loginSessionId = v_loginSessionId
            WHERE a.accountId = v_accountId;


        -- =================================================
        -- 6. Nếu là GYM_USER
        -- =================================================

        ELSEIF v_role = 'GYM_USER' THEN

            SELECT
                a.*,
                g.profileId,
                g.fullName,
                g.gender,
                g.level,
                g.goal,
                g.sessionsPerWeek,
                g.status AS gymUserStatus,
                v_loginSessionId AS loginSessionId,
                ls.loginTime,
                ls.expiration,
                ls.status AS sessionStatus
            FROM Accounts a
            INNER JOIN GymUsers g
                ON g.accountId = a.accountId
            INNER JOIN LoginSessions ls
                ON ls.loginSessionId = v_loginSessionId
            WHERE a.accountId = v_accountId;

        END IF;

    END IF;

END $$

DELIMITER ;

-- 2. Store Đăng xuất
DELIMITER $$

CREATE PROCEDURE sp_Logout(
    IN p_accountId INT,
    IN p_loginSessionId INT
)
BEGIN

    UPDATE LoginSessions
    SET status = 'LOGGED_OUT'
    WHERE loginSessionId = p_loginSessionId
      AND accountId = p_accountId
      AND status = 'ACTIVE';


    -- Kiểm tra có cập nhật được hay không
    IF ROW_COUNT() = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phiên đăng nhập không tồn tại hoặc đã đăng xuất';

    ELSE

        SELECT
            loginSessionId,
            accountId,
            loginTime,
            expiration,
            status
        FROM LoginSessions
        WHERE loginSessionId = p_loginSessionId;

    END IF;

END $$

DELIMITER ;

-- 3. Store Đăng Ký
DELIMITER $$

CREATE PROCEDURE RegisterGymUser(
    IN p_fullName VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_confirmPassword VARCHAR(255),
    IN p_agreeTerms BOOLEAN
)
BEGIN
    DECLARE v_accountId INT;
    DECLARE v_username VARCHAR(50);

    -- ================================
    -- 1. Kiểm tra họ tên
    -- ================================
    IF p_fullName IS NULL OR TRIM(p_fullName) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Họ và tên không được để trống';
    END IF;

    -- ================================
    -- 2. Kiểm tra email
    -- ================================
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email không được để trống';
    END IF;

    -- ================================
    -- 3. Kiểm tra mật khẩu
    -- ================================
    IF p_password IS NULL OR p_password = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mật khẩu không được để trống';
    END IF;

    -- ================================
    -- 4. Kiểm tra xác nhận mật khẩu
    -- ================================
    IF p_confirmPassword IS NULL OR p_confirmPassword = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Vui lòng xác nhận mật khẩu';
    END IF;

    IF p_password <> p_confirmPassword THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mật khẩu xác nhận không khớp';
    END IF;

    -- ================================
    -- 5. Kiểm tra đồng ý điều khoản
    -- ================================
    IF p_agreeTerms = FALSE OR p_agreeTerms IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bạn phải đồng ý với điều khoản sử dụng và chính sách bảo mật';
    END IF;

    -- ================================
    -- 6. Kiểm tra email đã tồn tại
    -- ================================
    IF EXISTS (
        SELECT 1
        FROM Accounts
        WHERE email = TRIM(p_email)
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email đã được sử dụng';
    END IF;

    -- ================================
    -- 7. Username = email
    -- ================================
    SET v_username = LEFT(TRIM(p_email), 50);

    -- ================================
    -- 8. Transaction
    -- ================================
    START TRANSACTION;

    -- Tạo tài khoản
    INSERT INTO Accounts (
        username,
        email,
        password,
        role,
        status
    )
    VALUES (
        v_username,
        TRIM(p_email),
        p_password,
        'GYM_USER',
        'ACTIVE'
    );

    SET v_accountId = LAST_INSERT_ID();

    -- ================================
    -- 9. Tạo hồ sơ Gym User
    -- ================================
    INSERT INTO GymUsers (
        accountId,
        fullName,
        level,
        status
    )
    VALUES (
        v_accountId,
        TRIM(p_fullName),
        'BEGINNER',
        'ACTIVE'
    );

    COMMIT;

    -- ================================
    -- 10. Trả kết quả
    -- ================================
    SELECT
        v_accountId AS accountId,
        p_fullName AS fullName,
        p_email AS email,
        'Đăng ký tài khoản thành công' AS message;

END $$

DELIMITER ;
select * from `accounts`;
select * from `gymusers`;

SELECT * FROM exercises;
SELECT * FROM exercisemedia;


-- 4. Load các bài tập --
DELIMITER $$

CREATE PROCEDURE sp_GetAllExercises()
BEGIN
    SELECT
        e.exerciseId,
        e.name,
        e.description,
        e.difficulty,

        -- Lấy ảnh đại diện đầu tiên của bài tập
        (
            SELECT em.mediaUrl
            FROM ExerciseMedia em
            WHERE em.exerciseId = e.exerciseId
              AND em.mediaType = 'IMAGE'
            ORDER BY em.sortOrder ASC, em.mediaId ASC
            LIMIT 1
        ) AS preview,

        -- Cơ chính
        GROUP_CONCAT(
            DISTINCT CASE
                WHEN emg.role = 'PRIMARY'
                THEN mg.groupName
            END
            SEPARATOR ', '
        ) AS primaryMuscles,

        -- Cơ phụ
        GROUP_CONCAT(
            DISTINCT CASE
                WHEN emg.role = 'SECONDARY'
                THEN mg.groupName
            END
            SEPARATOR ', '
        ) AS secondaryMuscles,

        -- Thiết bị
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

-- 5. Thêm bài tập --
DELIMITER $$

CREATE PROCEDURE sp_AddExercise(
    IN p_name VARCHAR(150),
    IN p_description TEXT,
    IN p_difficulty VARCHAR(20),
    IN p_muscleGroups JSON,
    IN p_equipmentIds JSON,
    IN p_media JSON
)
BEGIN
    DECLARE v_exerciseId INT;

    -- Nếu có lỗi thì rollback toàn bộ
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- =============================================
    -- 1. Kiểm tra dữ liệu cơ bản
    -- =============================================

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tên bài tập không được để trống';
    END IF;

    IF p_difficulty NOT IN ('EASY', 'MEDIUM', 'HARD') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Độ khó không hợp lệ';
    END IF;

    -- =============================================
    -- 2. Thêm Exercise
    -- =============================================

    INSERT INTO Exercises (
        name,
        description,
        difficulty
    )
    VALUES (
        TRIM(p_name),
        p_description,
        p_difficulty
    );

    SET v_exerciseId = LAST_INSERT_ID();

    -- =============================================
    -- 3. Thêm nhóm cơ
    -- =============================================

    IF p_muscleGroups IS NOT NULL
       AND JSON_LENGTH(p_muscleGroups) > 0 THEN

        INSERT INTO ExerciseMuscleGroups (
            exerciseId,
            groupId,
            role
        )
        SELECT
            v_exerciseId,
            jt.groupId,
            jt.role
        FROM JSON_TABLE(
            p_muscleGroups,
            '$[*]'
            COLUMNS (
                groupId INT PATH '$.groupId',
                role VARCHAR(20) PATH '$.role'
            )
        ) AS jt;

    END IF;

    -- =============================================
    -- 4. Thêm thiết bị
    -- =============================================

    IF p_equipmentIds IS NOT NULL
       AND JSON_LENGTH(p_equipmentIds) > 0 THEN

        INSERT INTO ExerciseEquipment (
            exerciseId,
            equipmentId
        )
        SELECT
            v_exerciseId,
            jt.equipmentId
        FROM JSON_TABLE(
            p_equipmentIds,
            '$[*]'
            COLUMNS (
                equipmentId INT PATH '$'
            )
        ) AS jt;

    END IF;

    -- =============================================
    -- 5. Thêm Media
    -- =============================================

    IF p_media IS NOT NULL
       AND JSON_LENGTH(p_media) > 0 THEN

        INSERT INTO ExerciseMedia (
            exerciseId,
            mediaUrl,
            publicId,
            mediaType,
            sortOrder
        )
        SELECT
            v_exerciseId,
            jt.mediaUrl,
            jt.publicId,
            jt.mediaType,
            jt.sortOrder
        FROM JSON_TABLE(
            p_media,
            '$[*]'
            COLUMNS (
                mediaUrl VARCHAR(500) PATH '$.mediaUrl',
                publicId VARCHAR(255) PATH '$.publicId',
                mediaType VARCHAR(20) PATH '$.mediaType',
                sortOrder INT PATH '$.sortOrder'
            )
        ) AS jt;

    END IF;

    COMMIT;

    -- Trả exerciseId vừa tạo
    SELECT
        v_exerciseId AS exerciseId,
        'Thêm bài tập thành công' AS message;

END $$

DELIMITER ;

-- 6. Update bài tập --
DELIMITER $$

CREATE PROCEDURE sp_UpdateExercise(
    IN p_exerciseId INT,
    IN p_name VARCHAR(150),
    IN p_description TEXT,
    IN p_difficulty VARCHAR(20),
    IN p_muscleGroups JSON,
    IN p_equipmentIds JSON,
    IN p_media JSON
)
BEGIN

    DECLARE v_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- =============================================
    -- 1. Kiểm tra Exercise
    -- =============================================

    SELECT COUNT(*)
    INTO v_exists
    FROM Exercises
    WHERE exerciseId = p_exerciseId;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bài tập không tồn tại';
    END IF;

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tên bài tập không được để trống';
    END IF;

    IF p_difficulty NOT IN ('EASY', 'MEDIUM', 'HARD') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Độ khó không hợp lệ';
    END IF;

    -- =============================================
    -- 2. Update Exercise
    -- =============================================

    UPDATE Exercises
    SET
        name = TRIM(p_name),
        description = p_description,
        difficulty = p_difficulty
    WHERE exerciseId = p_exerciseId;

    -- =============================================
    -- 3. Xóa nhóm cơ cũ
    -- =============================================

    DELETE FROM ExerciseMuscleGroups
    WHERE exerciseId = p_exerciseId;

    -- Thêm lại nhóm cơ
    IF p_muscleGroups IS NOT NULL
       AND JSON_LENGTH(p_muscleGroups) > 0 THEN

        INSERT INTO ExerciseMuscleGroups (
            exerciseId,
            groupId,
            role
        )
        SELECT
            p_exerciseId,
            jt.groupId,
            jt.role
        FROM JSON_TABLE(
            p_muscleGroups,
            '$[*]'
            COLUMNS (
                groupId INT PATH '$.groupId',
                role VARCHAR(20) PATH '$.role'
            )
        ) AS jt;

    END IF;

    -- =============================================
    -- 4. Xóa thiết bị cũ
    -- =============================================

    DELETE FROM ExerciseEquipment
    WHERE exerciseId = p_exerciseId;

    -- Thêm lại thiết bị
    IF p_equipmentIds IS NOT NULL
       AND JSON_LENGTH(p_equipmentIds) > 0 THEN

        INSERT INTO ExerciseEquipment (
            exerciseId,
            equipmentId
        )
        SELECT
            p_exerciseId,
            jt.equipmentId
        FROM JSON_TABLE(
            p_equipmentIds,
            '$[*]'
            COLUMNS (
                equipmentId INT PATH '$'
            )
        ) AS jt;

    END IF;

    -- =============================================
    -- 5. Xóa Media cũ trong DB
    -- =============================================

    DELETE FROM ExerciseMedia
    WHERE exerciseId = p_exerciseId;

    -- Thêm lại Media
    IF p_media IS NOT NULL
       AND JSON_LENGTH(p_media) > 0 THEN

        INSERT INTO ExerciseMedia (
            exerciseId,
            mediaUrl,
            publicId,
            mediaType,
            sortOrder
        )
        SELECT
            p_exerciseId,
            jt.mediaUrl,
            jt.publicId,
            jt.mediaType,
            jt.sortOrder
        FROM JSON_TABLE(
            p_media,
            '$[*]'
            COLUMNS (
                mediaUrl VARCHAR(500) PATH '$.mediaUrl',
                publicId VARCHAR(255) PATH '$.publicId',
                mediaType VARCHAR(20) PATH '$.mediaType',
                sortOrder INT PATH '$.sortOrder'
            )
        ) AS jt;

    END IF;

    COMMIT;

    SELECT
        p_exerciseId AS exerciseId,
        'Cập nhật bài tập thành công' AS message;

END $$

DELIMITER ;

-- 7. Load GymUser --
DELIMITER $$

CREATE PROCEDURE sp_GetAllGymUsers()
BEGIN

    SELECT
        gu.profileId,
        a.accountId,

        gu.fullName,
        a.username,
        a.email,

        gu.gender,
        gu.level,
        gu.goal,
        gu.sessionsPerWeek,

        a.role,

        a.status AS accountStatus,
        gu.status AS profileStatus,

        a.createdAt

    FROM Accounts a

    INNER JOIN GymUsers gu
        ON a.accountId = gu.accountId

    WHERE a.role = 'GYM_USER'

    ORDER BY a.createdAt DESC;

END $$

DELIMITER ;
CALL sp_GetAllGymUsers();

-- 8. Thêm Gym_User --
DROP PROCEDURE IF EXISTS sp_AddGymUser;

DELIMITER $$

CREATE PROCEDURE sp_AddGymUser(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),

    IN p_fullName VARCHAR(100),
    IN p_gender VARCHAR(20),
    IN p_level VARCHAR(20),
    IN p_goal VARCHAR(255),
    IN p_sessionsPerWeek INT
)
BEGIN

    DECLARE v_accountId INT;
    DECLARE v_profileId INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- ============================================
    -- Validate
    -- ============================================

    IF p_username IS NULL OR TRIM(p_username) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username không được để trống';
    END IF;

    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email không được để trống';
    END IF;

    IF p_password IS NULL OR p_password = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mật khẩu không được để trống';
    END IF;

    IF p_fullName IS NULL OR TRIM(p_fullName) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Họ tên không được để trống';
    END IF;

    IF p_gender IS NOT NULL
       AND p_gender NOT IN ('MALE', 'FEMALE', 'OTHER') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Giới tính không hợp lệ';
    END IF;

    IF p_level IS NOT NULL
       AND p_level NOT IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trình độ không hợp lệ';
    END IF;

    IF p_sessionsPerWeek IS NOT NULL
       AND (p_sessionsPerWeek < 1 OR p_sessionsPerWeek > 7) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số buổi tập mỗi tuần phải từ 1 đến 7';
    END IF;

    -- ============================================
    -- Kiểm tra username
    -- ============================================

    IF EXISTS (
        SELECT 1
        FROM Accounts
        WHERE username = TRIM(p_username)
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username đã tồn tại';
    END IF;

    -- ============================================
    -- Kiểm tra email
    -- ============================================

    IF EXISTS (
        SELECT 1
        FROM Accounts
        WHERE email = TRIM(p_email)
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email đã tồn tại';
    END IF;

    START TRANSACTION;

    -- ============================================
    -- Tạo Account
    -- ============================================

    INSERT INTO Accounts (
        username,
        email,
        password,
        role,
        status
    )
    VALUES (
        TRIM(p_username),
        TRIM(p_email),
        p_password,
        'GYM_USER',
        'ACTIVE'
    );

    SET v_accountId = LAST_INSERT_ID();

    -- ============================================
    -- Tạo GymUser
    -- ============================================

    INSERT INTO GymUsers (
        accountId,
        fullName,
        gender,
        level,
        goal,
        sessionsPerWeek,
        status
    )
    VALUES (
        v_accountId,
        TRIM(p_fullName),
        p_gender,
        COALESCE(p_level, 'BEGINNER'),
        p_goal,
        p_sessionsPerWeek,
        'ACTIVE'
    );

    SET v_profileId = LAST_INSERT_ID();

    COMMIT;

    SELECT
        v_accountId AS accountId,
        v_profileId AS profileId,
        'Thêm người dùng thành công' AS message;

END $$

DELIMITER ;

-- 9. Sửa thông tin Gym_User --
DROP PROCEDURE IF EXISTS sp_UpdateGymUser;

DELIMITER $$

CREATE PROCEDURE sp_UpdateGymUser(
    IN p_profileId INT,

    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),

    IN p_fullName VARCHAR(100),
    IN p_gender VARCHAR(20),
    IN p_level VARCHAR(20),
    IN p_goal VARCHAR(255),
    IN p_sessionsPerWeek INT,

    IN p_status VARCHAR(20)
)
BEGIN

    DECLARE v_accountId INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- ============================================
    -- Lấy accountId
    -- ============================================

    SELECT accountId
    INTO v_accountId
    FROM GymUsers
    WHERE profileId = p_profileId
    LIMIT 1;

    IF v_accountId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người dùng không tồn tại';
    END IF;

    -- ============================================
    -- Validate
    -- ============================================

    IF p_username IS NULL OR TRIM(p_username) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username không được để trống';
    END IF;

    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email không được để trống';
    END IF;

    IF p_fullName IS NULL OR TRIM(p_fullName) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Họ tên không được để trống';
    END IF;

    IF p_gender IS NOT NULL
       AND p_gender NOT IN ('MALE', 'FEMALE', 'OTHER') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Giới tính không hợp lệ';
    END IF;

    IF p_level IS NOT NULL
       AND p_level NOT IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trình độ không hợp lệ';
    END IF;

    IF p_sessionsPerWeek IS NOT NULL
       AND (p_sessionsPerWeek < 1 OR p_sessionsPerWeek > 7) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số buổi tập mỗi tuần phải từ 1 đến 7';
    END IF;

    IF p_status NOT IN ('ACTIVE', 'LOCKED', 'INACTIVE') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trạng thái tài khoản không hợp lệ';
    END IF;

    -- ============================================
    -- Kiểm tra username trùng
    -- ============================================

    IF EXISTS (
        SELECT 1
        FROM Accounts
        WHERE username = TRIM(p_username)
          AND accountId <> v_accountId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username đã tồn tại';
    END IF;

    -- ============================================
    -- Kiểm tra email trùng
    -- ============================================

    IF EXISTS (
        SELECT 1
        FROM Accounts
        WHERE email = TRIM(p_email)
          AND accountId <> v_accountId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email đã tồn tại';
    END IF;

    START TRANSACTION;

    -- ============================================
    -- Account
    -- LOCKED chỉ áp dụng cho Account
    -- ============================================

    UPDATE Accounts
    SET
        username = TRIM(p_username),
        email = TRIM(p_email),
        status = p_status
    WHERE accountId = v_accountId;

    -- ============================================
    -- GymUser
    --
    -- Nếu LOCKED:
    -- chỉ khóa Account, không thay đổi profileStatus.
    --
    -- ACTIVE / INACTIVE:
    -- đồng bộ profileStatus.
    -- ============================================

    UPDATE GymUsers
    SET
        fullName = TRIM(p_fullName),
        gender = p_gender,
        level = p_level,
        goal = p_goal,
        sessionsPerWeek = p_sessionsPerWeek,

        status = CASE
            WHEN p_status = 'LOCKED' THEN status
            WHEN p_status = 'ACTIVE' THEN 'ACTIVE'
            WHEN p_status = 'INACTIVE' THEN 'INACTIVE'
            ELSE status
        END

    WHERE profileId = p_profileId;

    COMMIT;

    SELECT
        p_profileId AS profileId,
        v_accountId AS accountId,
        p_status AS accountStatus,
        'Cập nhật người dùng thành công' AS message;

END $$

DELIMITER ;

-- 10. Load all Lịch tập --
DROP PROCEDURE IF EXISTS sp_GetWorkoutPlanTemplates;

DELIMITER $$

CREATE PROCEDURE sp_GetWorkoutPlanTemplates()
BEGIN

    SELECT
        wp.planId,
        wp.title,
        wp.description,
        wp.level,
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
        wp.durationWeeks,
        wp.isTemplate,
        wp.creatorId,
        wp.createdAt

    ORDER BY wp.createdAt DESC;

END $$

DELIMITER ;
CALL sp_GetWorkoutPlanTemplates();

-- 11. Load chi tiết lịch tập --
DROP PROCEDURE IF EXISTS sp_GetWorkoutPlanDetail;

DELIMITER $$

CREATE PROCEDURE sp_GetWorkoutPlanDetail(
    IN p_planId INT
)
BEGIN

    -- ============================================
    -- Kiểm tra Plan
    -- ============================================

    IF NOT EXISTS (
        SELECT 1
        FROM WorkoutPlans
        WHERE planId = p_planId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chương trình không tồn tại';
    END IF;


    -- ============================================
    -- RESULT SET 1: Thông tin Plan
    -- ============================================

    SELECT
        wp.planId,
        wp.title,
        wp.description,
        wp.creatorId,
        wp.isTemplate,
        wp.level,
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
        wp.durationWeeks,
        wp.createdAt;


    -- ============================================
    -- RESULT SET 2: Days + Exercises
    -- ============================================

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


    -- ============================================
    -- RESULT SET 3: Media
    -- ============================================

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

CALL sp_GetWorkoutPlanDetail(1);

-- 12.Tạo lịch tập mới --
DROP PROCEDURE IF EXISTS sp_CreateWorkoutPlan;

DELIMITER $$

CREATE PROCEDURE sp_CreateWorkoutPlan(
    IN p_title VARCHAR(150),
    IN p_description TEXT,
    IN p_creatorId INT,
    IN p_isTemplate BOOLEAN,
    IN p_level VARCHAR(20),
    IN p_durationWeeks INT
)
BEGIN

    DECLARE v_planId INT;

    -- ============================================
    -- Validate
    -- ============================================

    IF p_title IS NULL OR TRIM(p_title) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tên chương trình không được để trống';
    END IF;

    IF p_level NOT IN (
        'BEGINNER',
        'INTERMEDIATE',
        'ADVANCED'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trình độ không hợp lệ';
    END IF;

    IF p_durationWeeks IS NULL
       OR p_durationWeeks <= 0 THEN

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

    -- ============================================
    -- Insert
    -- ============================================

    INSERT INTO WorkoutPlans (
        title,
        description,
        creatorId,
        isTemplate,
        level,
        durationWeeks
    )
    VALUES (
        TRIM(p_title),
        p_description,
        p_creatorId,
        p_isTemplate,
        p_level,
        p_durationWeeks
    );

    SET v_planId = LAST_INSERT_ID();

    SELECT
        v_planId AS planId,
        'Tạo chương trình thành công' AS message;

END $$

DELIMITER ;

-- 13.Update lịch tập --
DROP PROCEDURE IF EXISTS sp_UpdateWorkoutPlan;

DELIMITER $$

CREATE PROCEDURE sp_UpdateWorkoutPlan(
    IN p_planId INT,
    IN p_title VARCHAR(150),
    IN p_description TEXT,
    IN p_level VARCHAR(20),
    IN p_isTemplate BOOLEAN,
    IN p_durationWeeks INT
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

    IF p_level NOT IN (
        'BEGINNER',
        'INTERMEDIATE',
        'ADVANCED'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trình độ không hợp lệ';
    END IF;

    IF p_durationWeeks IS NULL
       OR p_durationWeeks <= 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số tuần của chương trình phải lớn hơn 0';

    END IF;

    UPDATE WorkoutPlans
    SET
        title = TRIM(p_title),
        description = p_description,
        level = p_level,
        durationWeeks = p_durationWeeks,
        isTemplate = p_isTemplate

    WHERE planId = p_planId;

    SELECT
        p_planId AS planId,
        'Cập nhật chương trình thành công' AS message;

END $$

DELIMITER ;

-- 14.Thêm ngày tập cho lịch tập --
DROP PROCEDURE IF EXISTS sp_AddWorkoutDay;

DELIMITER $$

CREATE PROCEDURE sp_AddWorkoutDay(
    IN p_planId INT,
    IN p_dayName VARCHAR(100),
    IN p_weekDay TINYINT
)
BEGIN

    DECLARE v_dayId INT;
    DECLARE v_order INT;

    -- ============================================
    -- Check plan
    -- ============================================

    IF NOT EXISTS (
        SELECT 1
        FROM WorkoutPlans
        WHERE planId = p_planId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chương trình không tồn tại';
    END IF;

    -- ============================================
    -- Validate
    -- ============================================

    IF p_dayName IS NULL
       OR TRIM(p_dayName) = '' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tên ngày tập không được để trống';

    END IF;

    IF p_weekDay IS NOT NULL
       AND (p_weekDay < 1 OR p_weekDay > 7) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày trong tuần phải từ 1 đến 7';

    END IF;

    -- ============================================
    -- Không để 2 WorkoutDay cùng một weekday
    -- trong cùng Plan
    -- ============================================

    IF p_weekDay IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM WorkoutDays
            WHERE planId = p_planId
              AND weekDay = p_weekDay
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày này đã có buổi tập trong chương trình';

    END IF;

    -- ============================================
    -- Tạo order tiếp theo
    -- ============================================

    SELECT COALESCE(MAX(`order`), 0) + 1
    INTO v_order
    FROM WorkoutDays
    WHERE planId = p_planId;

    -- ============================================
    -- Insert
    -- ============================================

    INSERT INTO WorkoutDays (
        planId,
        dayName,
        `order`,
        weekDay
    )
    VALUES (
        p_planId,
        TRIM(p_dayName),
        v_order,
        p_weekDay
    );

    SET v_dayId = LAST_INSERT_ID();

    SELECT
        v_dayId AS dayId,
        v_order AS dayOrder,
        p_weekDay AS weekDay,
        'Thêm ngày tập thành công' AS message;

END $$

DELIMITER ;

-- 15.Sửa ngày tập cho lịch tập --
DROP PROCEDURE IF EXISTS sp_UpdateWorkoutDay;

DELIMITER $$

CREATE PROCEDURE sp_UpdateWorkoutDay(
    IN p_dayId INT,
    IN p_dayName VARCHAR(100),
    IN p_weekDay TINYINT
)
BEGIN

    DECLARE v_planId INT;

    -- ============================================
    -- Check Day
    -- ============================================

    SELECT planId
    INTO v_planId
    FROM WorkoutDays
    WHERE dayId = p_dayId
    LIMIT 1;

    IF v_planId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày tập không tồn tại';
    END IF;

    -- ============================================
    -- Validate
    -- ============================================

    IF p_dayName IS NULL
       OR TRIM(p_dayName) = '' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tên ngày tập không được để trống';

    END IF;

    IF p_weekDay IS NOT NULL
       AND (p_weekDay < 1 OR p_weekDay > 7) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày trong tuần phải từ 1 đến 7';

    END IF;

    -- ============================================
    -- Check trùng weekday
    -- ============================================

    IF p_weekDay IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM WorkoutDays
            WHERE planId = v_planId
              AND weekDay = p_weekDay
              AND dayId <> p_dayId
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày này đã có buổi tập trong chương trình';

    END IF;

    -- ============================================
    -- Update
    -- ============================================

    UPDATE WorkoutDays
    SET
        dayName = TRIM(p_dayName),
        weekDay = p_weekDay
    WHERE dayId = p_dayId;

    SELECT
        p_dayId AS dayId,
        p_weekDay AS weekDay,
        'Cập nhật ngày tập thành công' AS message;

END $$

DELIMITER ;

-- 16.Add bài tập vào ngày tập --
DELIMITER $$

CREATE PROCEDURE sp_AddExerciseToWorkoutDay(
    IN p_dayId INT,
    IN p_exerciseId INT,
    IN p_sets INT,
    IN p_reps INT,
    IN p_restTime INT
)
BEGIN

    DECLARE v_configId INT;
    DECLARE v_order INT;

    IF NOT EXISTS (
        SELECT 1
        FROM WorkoutDays
        WHERE dayId = p_dayId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày tập không tồn tại';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM Exercises
        WHERE exerciseId = p_exerciseId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bài tập không tồn tại';
    END IF;

    IF p_sets <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số hiệp phải lớn hơn 0';
    END IF;

    IF p_reps <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lần lặp phải lớn hơn 0';
    END IF;

    IF p_restTime < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Thời gian nghỉ không hợp lệ';
    END IF;

    SELECT COALESCE(MAX(`order`), 0) + 1
    INTO v_order
    FROM ExerciseConfigs
    WHERE dayId = p_dayId;

    INSERT INTO ExerciseConfigs (
        exerciseId,
        dayId,
        sets,
        reps,
        restTime,
        `order`
    )
    VALUES (
        p_exerciseId,
        p_dayId,
        p_sets,
        p_reps,
        p_restTime,
        v_order
    );

    SET v_configId = LAST_INSERT_ID();

    SELECT
        v_configId AS configId,
        v_order AS exerciseOrder,
        'Thêm bài tập vào ngày tập thành công' AS message;

END $$

DELIMITER ;

-- 17.Update cấu hình bài tập --
DELIMITER $$

CREATE PROCEDURE sp_UpdateExerciseConfig(
    IN p_configId INT,
    IN p_sets INT,
    IN p_reps INT,
    IN p_restTime INT
)
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM ExerciseConfigs
        WHERE configId = p_configId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cấu hình bài tập không tồn tại';
    END IF;

    IF p_sets <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số hiệp phải lớn hơn 0';
    END IF;

    IF p_reps <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lần lặp phải lớn hơn 0';
    END IF;

    IF p_restTime < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Thời gian nghỉ không hợp lệ';
    END IF;

    UPDATE ExerciseConfigs
    SET
        sets = p_sets,
        reps = p_reps,
        restTime = p_restTime
    WHERE configId = p_configId;

    SELECT
        p_configId AS configId,
        'Cập nhật cấu hình bài tập thành công' AS message;

END $$

DELIMITER ;

-- 18. Xoá bài tập khỏi ngày tập --
DELIMITER $$

CREATE PROCEDURE sp_RemoveExerciseFromWorkoutDay(
    IN p_configId INT
)
BEGIN
    DECLARE v_dayId INT;

    -- ============================================
    -- 1. Kiểm tra ExerciseConfig có tồn tại không
    -- ============================================
    IF NOT EXISTS (
        SELECT 1
        FROM ExerciseConfigs
        WHERE configId = p_configId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bài tập không tồn tại trong ngày tập';
    END IF;


    -- ============================================
    -- 2. Lấy dayId trước khi xóa
    -- ============================================
    SELECT dayId
    INTO v_dayId
    FROM ExerciseConfigs
    WHERE configId = p_configId;


    -- ============================================
    -- 3. Xóa bài tập khỏi ngày tập
    -- ============================================
    DELETE FROM ExerciseConfigs
    WHERE configId = p_configId;


    -- ============================================
    -- 4. Đánh lại thứ tự bài tập
    -- ============================================
    SET @exerciseOrder := 0;

    UPDATE ExerciseConfigs
    SET `order` = (@exerciseOrder := @exerciseOrder + 1)
    WHERE dayId = v_dayId
    ORDER BY `order`;


    -- ============================================
    -- 5. Trả kết quả
    -- ============================================
    SELECT
        p_configId AS deletedConfigId,
        v_dayId AS dayId,
        'Xóa bài tập khỏi ngày tập thành công' AS message;

END $$

DELIMITER ;

CALL sp_RemoveExerciseFromWorkoutDay(1);


-- 19. Xoá ngày tập khỏi lịch tập --
DELIMITER $$

CREATE PROCEDURE sp_DeleteWorkoutDay(
    IN p_dayId INT
)
BEGIN
    DECLARE v_planId INT;

    -- ============================================
    -- 1. Kiểm tra ngày tập tồn tại
    -- ============================================
    IF NOT EXISTS (
        SELECT 1
        FROM WorkoutDays
        WHERE dayId = p_dayId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày tập không tồn tại';
    END IF;


    -- ============================================
    -- 2. Lấy planId trước khi xóa
    -- ============================================
    SELECT planId
    INTO v_planId
    FROM WorkoutDays
    WHERE dayId = p_dayId;


    -- ============================================
    -- 3. Xóa WorkoutDay
    -- ============================================
    DELETE FROM WorkoutDays
    WHERE dayId = p_dayId;

    /*
        ExerciseConfigs thuộc ngày này sẽ tự động
        bị xóa do FK:

        FOREIGN KEY (dayId)
        REFERENCES WorkoutDays(dayId)
        ON DELETE CASCADE
    */


    -- ============================================
    -- 4. Đánh lại thứ tự DAY
    -- ============================================
    SET @dayOrder := 0;

    UPDATE WorkoutDays
    SET `order` = (@dayOrder := @dayOrder + 1)
    WHERE planId = v_planId
    ORDER BY `order`;


    -- ============================================
    -- 5. Trả kết quả
    -- ============================================
    SELECT
        p_dayId AS deletedDayId,
        v_planId AS planId,
        'Xóa ngày tập thành công' AS message;

END $$

DELIMITER ;
CALL sp_DeleteWorkoutDay(5);

-- 20. Load API tổng quan --
DELIMITER $$

CREATE PROCEDURE sp_GetDashboardSummary()
BEGIN
    SELECT
        (
            SELECT COUNT(*)
            FROM gymusers
        ) AS totalUsers,

        (
            SELECT COUNT(*)
            FROM exercises
        ) AS totalExercises,

        (
            SELECT COUNT(*)
            FROM workoutplans
            WHERE isTemplate = 1
        ) AS totalWorkoutTemplates,

        (
            SELECT COUNT(*)
            FROM accounts a
            INNER JOIN gymusers gu
                ON gu.accountId = a.accountId
            WHERE YEAR(a.createdAt) = YEAR(CURRENT_DATE())
              AND MONTH(a.createdAt) = MONTH(CURRENT_DATE())
        ) AS newUsersThisMonth,

        (
            SELECT COUNT(*)
            FROM workoutsessions
            WHERE YEAR(startTime) = YEAR(CURRENT_DATE())
              AND MONTH(startTime) = MONTH(CURRENT_DATE())
        ) AS workoutSessionsThisMonth;
END $$

DELIMITER ;
CALL sp_GetDashboardSummary();

-- 21. User đăng ký theo tháng --
DELIMITER $$

CREATE PROCEDURE sp_GetDashboardUserGrowth(
    IN p_months INT
)
BEGIN
    IF p_months IS NULL OR p_months <= 0 THEN
        SET p_months = 6;
    END IF;

    SELECT
        DATE_FORMAT(a.createdAt, '%Y-%m') AS monthKey,
        DATE_FORMAT(a.createdAt, '%m/%Y') AS monthLabel,
        COUNT(*) AS totalUsers
    FROM accounts a
    INNER JOIN gymusers gu
        ON gu.accountId = a.accountId
    WHERE a.createdAt >= DATE_SUB(
        DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'),
        INTERVAL (p_months - 1) MONTH
    )
    GROUP BY
        DATE_FORMAT(a.createdAt, '%Y-%m'),
        DATE_FORMAT(a.createdAt, '%m/%Y')
    ORDER BY monthKey ASC;
END $$

DELIMITER ;
CALL sp_GetDashboardUserGrowth(9);

-- 22. Thống kê bài tập theo độ khó --
DELIMITER $$

CREATE PROCEDURE sp_GetDashboardExerciseStatistics()
BEGIN
    SELECT
        difficulty,
        COUNT(*) AS totalExercises,
        ROUND(
            COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM exercises), 0),
            2
        ) AS percentage
    FROM exercises
    GROUP BY difficulty
    ORDER BY
        CASE difficulty
            WHEN 'EASY' THEN 1
            WHEN 'MEDIUM' THEN 2
            WHEN 'HARD' THEN 3
            ELSE 4
        END;
END $$

DELIMITER ;
CALL sp_GetDashboardExerciseStatistics();

-- 23. Bài tập theo nhóm cơ --
DELIMITER $$

CREATE PROCEDURE sp_GetDashboardExercisesByMuscleGroup()
BEGIN
    SELECT
        mg.groupId,
        mg.groupName,
        COUNT(DISTINCT emg.exerciseId) AS totalExercises
    FROM musclegroups mg

    LEFT JOIN exercisemusclegroups emg
        ON emg.groupId = mg.groupId
        AND emg.role = 'PRIMARY'

    GROUP BY
        mg.groupId,
        mg.groupName

    ORDER BY
        totalExercises DESC,
        mg.groupName ASC;
END $$

DELIMITER ;
CALL sp_GetDashboardExercisesByMuscleGroup();

-- 24. Load người dùng mới --
DELIMITER $$

CREATE PROCEDURE sp_GetDashboardRecentUsers(
    IN p_limit INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 5;
    END IF;

    SELECT
        gu.profileId,
        a.accountId,
        gu.fullName,
        a.username,
        a.email,
        gu.gender,
        gu.level,
        a.status AS accountStatus,
        a.createdAt
    FROM gymusers gu

    INNER JOIN accounts a
        ON a.accountId = gu.accountId

    ORDER BY a.createdAt DESC
    LIMIT p_limit;
END $$

DELIMITER ;
CALL sp_GetDashboardRecentUsers(9);

-- 25. Lịch tập mẫu gần đây --
DROP PROCEDURE IF EXISTS sp_GetDashboardRecentWorkoutTemplates;

DELIMITER $$

CREATE PROCEDURE sp_GetDashboardRecentWorkoutTemplates(
    IN p_limit INT
)
BEGIN

    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 5;
    END IF;

    SELECT
        wp.planId,
        wp.title,
        wp.description,
        wp.level,
        wp.durationWeeks,
        wp.creatorId,
        wp.createdAt,

        COUNT(DISTINCT wd.dayId) AS totalDays,

        COUNT(ec.configId) AS totalExercises

    FROM WorkoutPlans wp

    LEFT JOIN WorkoutDays wd
        ON wd.planId = wp.planId

    LEFT JOIN ExerciseConfigs ec
        ON ec.dayId = wd.dayId

    WHERE wp.isTemplate = TRUE

    GROUP BY
        wp.planId,
        wp.title,
        wp.description,
        wp.level,
        wp.durationWeeks,
        wp.creatorId,
        wp.createdAt

    ORDER BY wp.createdAt DESC

    LIMIT p_limit;

END $$

DELIMITER ;
CALL sp_GetDashboardRecentWorkoutTemplates(2);


-- =========================================================== --
-- ========== STORE PHÍA CLIENTS ============================= --
-- =========================================================== --
-- 1. Load toàn bộ hồ sơ User --
DELIMITER $$

CREATE PROCEDURE sp_GetMyProfile(
    IN p_accountId INT
)
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM Accounts
        WHERE accountId = p_accountId
          AND role = 'GYM_USER'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người dùng không tồn tại';
    END IF;

    SELECT
        a.accountId,
        a.username,
        a.email,
        a.role,
        a.status AS accountStatus,
        a.createdAt,

        gu.profileId,
        gu.fullName,
        gu.gender,
        gu.level,
        gu.goal,
        gu.sessionsPerWeek,
        gu.status AS profileStatus,

        bm.height,
        bm.weight,
        bm.recordedAt AS bodyMetricUpdatedAt

    FROM Accounts a

    INNER JOIN GymUsers gu
        ON gu.accountId = a.accountId

    LEFT JOIN BodyMetrics bm
        ON bm.metricId = (
            SELECT bm2.metricId
            FROM BodyMetrics bm2
            WHERE bm2.profileId = gu.profileId
            ORDER BY
                bm2.recordedAt DESC,
                bm2.metricId DESC
            LIMIT 1
        )

    WHERE a.accountId = p_accountId;

END $$

DELIMITER ; 
CALL sp_GetMyProfile(1);

-- 2. Cập nhật thông tin Cá nhân --
DELIMITER $$

CREATE PROCEDURE sp_UpdateMyProfile(
    IN p_profileId INT,
    IN p_fullName VARCHAR(100),
    IN p_gender VARCHAR(20),
    IN p_level VARCHAR(20),
    IN p_goal VARCHAR(255),
    IN p_sessionsPerWeek INT,
    IN p_height DECIMAL(5,2),
    IN p_weight DECIMAL(5,2)
)
BEGIN

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM GymUsers
        WHERE profileId = p_profileId
    ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người dùng không tồn tại';

    END IF;


    IF p_fullName IS NULL OR TRIM(p_fullName) = '' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Họ tên không được để trống';

    END IF;


    IF p_level NOT IN (
        'BEGINNER',
        'INTERMEDIATE',
        'ADVANCED'
    ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trình độ tập luyện không hợp lệ';

    END IF;


    IF p_sessionsPerWeek IS NOT NULL
       AND (p_sessionsPerWeek < 1 OR p_sessionsPerWeek > 7) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số buổi tập mỗi tuần phải từ 1 đến 7';

    END IF;


    IF p_height IS NOT NULL AND p_height <= 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chiều cao không hợp lệ';

    END IF;


    IF p_weight IS NOT NULL AND p_weight <= 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cân nặng không hợp lệ';

    END IF;


    START TRANSACTION;


    -- ========================================
    -- Update GymUser
    -- ========================================

    UPDATE GymUsers
    SET
        fullName = TRIM(p_fullName),
        gender = p_gender,
        level = p_level,
        goal = p_goal,
        sessionsPerWeek = p_sessionsPerWeek

    WHERE profileId = p_profileId;


    -- ========================================
    -- Lưu lịch sử chiều cao/cân nặng
    -- ========================================

    INSERT INTO BodyMetrics (
        profileId,
        height,
        weight,
        recordedAt
    )
    VALUES (
        p_profileId,
        p_height,
        p_weight,
        NOW()
    );


    COMMIT;


    SELECT
        p_profileId AS profileId,
        'Cập nhật hồ sơ thành công' AS message;

END $$

DELIMITER ;

-- 3. Lấy chương trình đang tập --
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
        wp.durationWeeks,

        guwp.joinedAt,
        guwp.startedAt,
        guwp.status,

        COUNT(DISTINCT wd.dayId) AS totalDays,

        CASE
            WHEN guwp.startedAt IS NULL THEN 1
            ELSE LEAST(
                wp.durationWeeks,
                TIMESTAMPDIFF(
                    WEEK,
                    guwp.startedAt,
                    CURDATE()
                ) + 1
            )
        END AS currentWeek,

        (
            SELECT COUNT(*)
            FROM WorkoutSessions ws
            WHERE ws.profileId = p_profileId
              AND ws.status = 'COMPLETED'
              AND YEARWEEK(ws.startTime, 1)
                  = YEARWEEK(CURDATE(), 1)
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
        wp.durationWeeks,
        guwp.joinedAt,
        guwp.startedAt,
        guwp.status

    ORDER BY guwp.joinedAt DESC

    LIMIT 1;

END $$

DELIMITER ;

-- 4. Load bài tập hôm nay --
DELIMITER $$

CREATE PROCEDURE sp_GetTodayWorkout(
    IN p_profileId INT
)
BEGIN

    DECLARE v_planId INT;
    DECLARE v_dayId INT;


    -- ========================================
    -- Tìm plan đang active
    -- ========================================

    SELECT guwp.planId
    INTO v_planId

    FROM GymUserWorkoutPlans guwp

    WHERE guwp.profileId = p_profileId
      AND guwp.status = 'ACTIVE'

    ORDER BY guwp.joinedAt DESC
    LIMIT 1;


    IF v_planId IS NULL THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người dùng chưa có lịch tập đang hoạt động';

    END IF;


    -- ========================================
    -- Tìm ngày tập hôm nay
    -- WEEKDAY:
    -- Monday = 0
    -- => +1 thành 1-7
    -- ========================================

    SELECT dayId
    INTO v_dayId

    FROM WorkoutDays

    WHERE planId = v_planId
      AND weekDay = WEEKDAY(CURDATE()) + 1

    LIMIT 1;


    -- ========================================
    -- RESULT SET 1: Thông tin buổi tập
    -- ========================================

    SELECT
        wp.planId,
        wp.title AS planTitle,

        wd.dayId,
        wd.dayName,

        COUNT(ec.configId) AS totalExercises,

        COALESCE(
            SUM(ec.sets),
            0
        ) AS totalSets

    FROM WorkoutPlans wp

    LEFT JOIN WorkoutDays wd
        ON wd.dayId = v_dayId

    LEFT JOIN ExerciseConfigs ec
        ON ec.dayId = wd.dayId

    WHERE wp.planId = v_planId

    GROUP BY
        wp.planId,
        wp.title,
        wd.dayId,
        wd.dayName;


    -- ========================================
    -- RESULT SET 2: Exercises
    -- ========================================

    SELECT
        ec.configId,
        ec.exerciseId,

        e.name AS exerciseName,
        e.description,
        e.difficulty,

        ec.sets,
        ec.reps,
        ec.restTime,
        ec.`order` AS exerciseOrder,

        (
            SELECT em.mediaUrl

            FROM ExerciseMedia em

            WHERE em.exerciseId = e.exerciseId

            ORDER BY
                CASE
                    WHEN em.mediaType = 'IMAGE' THEN 0
                    ELSE 1
                END,
                em.sortOrder,
                em.mediaId

            LIMIT 1

        ) AS preview

    FROM ExerciseConfigs ec

    INNER JOIN Exercises e
        ON e.exerciseId = ec.exerciseId

    WHERE ec.dayId = v_dayId

    ORDER BY ec.`order`;

END $$

DELIMITER ;

-- 5. Tổng quan Tiến trình --
DELIMITER $$

CREATE PROCEDURE sp_GetUserProgressSummary(
    IN p_profileId INT
)
BEGIN

    DECLARE v_totalSessions INT DEFAULT 0;
    DECLARE v_totalVolume DECIMAL(12,2) DEFAULT 0;
    DECLARE v_streak INT DEFAULT 0;
    DECLARE v_latestWorkout DATE;


    -- ========================================
    -- Tổng số buổi hoàn thành
    -- ========================================

    SELECT COUNT(*)

    INTO v_totalSessions

    FROM WorkoutSessions

    WHERE profileId = p_profileId
      AND status = 'COMPLETED';


    -- ========================================
    -- Tổng volume
    -- weight * reps
    -- ========================================

    SELECT
        COALESCE(
            SUM(es.weight * es.reps),
            0
        )

    INTO v_totalVolume

    FROM WorkoutSessions ws

    INNER JOIN PerformedExercises pe
        ON pe.workoutSessionId = ws.workoutSessionId

    INNER JOIN ExerciseSets es
        ON es.performedExerciseId =
           pe.performedExerciseId

    WHERE ws.profileId = p_profileId
      AND ws.status = 'COMPLETED';


    -- ========================================
    -- Ngày tập gần nhất
    -- ========================================

    SELECT MAX(DATE(startTime))

    INTO v_latestWorkout

    FROM WorkoutSessions

    WHERE profileId = p_profileId
      AND status = 'COMPLETED';


    -- ========================================
    -- Streak
    -- MySQL 8+
    -- ========================================

    IF v_latestWorkout IS NOT NULL
       AND DATEDIFF(
           CURDATE(),
           v_latestWorkout
       ) <= 1 THEN

        WITH workout_dates AS (

            SELECT DISTINCT
                DATE(startTime) AS workoutDate

            FROM WorkoutSessions

            WHERE profileId = p_profileId
              AND status = 'COMPLETED'

        ),

        ranked AS (

            SELECT
                workoutDate,

                ROW_NUMBER() OVER (
                    ORDER BY workoutDate DESC
                ) AS rn,

                MAX(workoutDate) OVER () AS maxDate

            FROM workout_dates

        )

        SELECT COUNT(*)

        INTO v_streak

        FROM ranked

        WHERE DATEDIFF(
            maxDate,
            workoutDate
        ) = rn - 1;

    END IF;


    SELECT
        v_totalSessions AS totalSessions,

        ROUND(
            v_totalVolume / 1000,
            1
        ) AS totalVolumeTon,

        v_streak AS currentStreak;

END $$

DELIMITER ;

-- 6. Personal Record / PR --
DELIMITER $$

CREATE PROCEDURE sp_GetUserPersonalRecords(
    IN p_profileId INT
)
BEGIN

    SELECT
        e.exerciseId,
        e.name AS exerciseName,

        MAX(es.weight) AS maxWeight,

        MAX(ws.endTime) AS latestWorkout

    FROM WorkoutSessions ws

    INNER JOIN PerformedExercises pe
        ON pe.workoutSessionId =
           ws.workoutSessionId

    INNER JOIN Exercises e
        ON e.exerciseId =
           pe.exerciseId

    INNER JOIN ExerciseSets es
        ON es.performedExerciseId =
           pe.performedExerciseId

    WHERE ws.profileId = p_profileId
      AND ws.status = 'COMPLETED'

    GROUP BY
        e.exerciseId,
        e.name

    ORDER BY maxWeight DESC;

END $$

DELIMITER ;

-- 7. Lịch sử tập luyện --
DELIMITER $$

CREATE PROCEDURE sp_GetUserWorkoutHistory(
    IN p_profileId INT,
    IN p_period VARCHAR(20)
)
BEGIN

    SELECT
        ws.workoutSessionId,

        ws.startTime,
        ws.endTime,
        ws.totalDuration,
        ws.status,

        wd.dayId,
        wd.dayName,

        wp.planId,
        wp.title AS planTitle,

        COUNT(
            DISTINCT pe.performedExerciseId
        ) AS totalExercises,

        COALESCE(
            SUM(es.weight * es.reps),
            0
        ) AS totalVolume

    FROM WorkoutSessions ws

    LEFT JOIN WorkoutDays wd
        ON wd.dayId = ws.dayId

    LEFT JOIN WorkoutPlans wp
        ON wp.planId = wd.planId

    LEFT JOIN PerformedExercises pe
        ON pe.workoutSessionId =
           ws.workoutSessionId

    LEFT JOIN ExerciseSets es
        ON es.performedExerciseId =
           pe.performedExerciseId

    WHERE ws.profileId = p_profileId

      AND ws.status = 'COMPLETED'

      AND (

          p_period = 'ALL'

          OR

          (
              p_period = 'WEEK'
              AND YEARWEEK(ws.startTime, 1)
                  = YEARWEEK(CURDATE(), 1)
          )

          OR

          (
              p_period = 'MONTH'
              AND YEAR(ws.startTime)
                    = YEAR(CURDATE())
              AND MONTH(ws.startTime)
                    = MONTH(CURDATE())
          )

      )

    GROUP BY
        ws.workoutSessionId,
        ws.startTime,
        ws.endTime,
        ws.totalDuration,
        ws.status,
        wd.dayId,
        wd.dayName,
        wp.planId,
        wp.title

    ORDER BY ws.startTime DESC;

END $$

DELIMITER ;


