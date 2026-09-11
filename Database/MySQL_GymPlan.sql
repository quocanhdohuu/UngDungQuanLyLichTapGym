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
        REFERENCES Admins(accountId)
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


SELECT * FROM `accounts`
SELECT * FROM `gymusers`
SELECT * FROM `loginsessions`

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

