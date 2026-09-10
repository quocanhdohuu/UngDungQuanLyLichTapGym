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
-- 2. ADMINS
-- =====================================================

CREATE TABLE Admins (
    accountId INT PRIMARY KEY,

    CONSTRAINT fk_admin_account
        FOREIGN KEY (accountId)
        REFERENCES Accounts(accountId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =====================================================
-- 3. GYM USERS
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
-- 4. LOGIN SESSIONS
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
-- 5. WORKOUT PLANS
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
-- 6. WORKOUT DAYS
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
-- 7. EXERCISES
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
-- 8. EXERCISE CONFIG
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
-- 9. MUSCLE GROUPS
-- =====================================================

CREATE TABLE MuscleGroups (
    groupId INT AUTO_INCREMENT PRIMARY KEY,
    groupName VARCHAR(100) NOT NULL UNIQUE,
    `function` VARCHAR(255)
);


-- =====================================================
-- 10. EXERCISE - MUSCLE GROUP
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
-- 11. EQUIPMENT
-- =====================================================

CREATE TABLE Equipment (
    equipmentId INT AUTO_INCREMENT PRIMARY KEY,
    equipmentName VARCHAR(100) NOT NULL UNIQUE
);


-- =====================================================
-- 12. EXERCISE - EQUIPMENT
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
-- 13. GYM USER - WORKOUT PLAN
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
-- 14. WORKOUT SESSIONS
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
-- 15. PERFORMED EXERCISES
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
-- 16. EXERCISE SETS
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
-- 17. BODY METRICS
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