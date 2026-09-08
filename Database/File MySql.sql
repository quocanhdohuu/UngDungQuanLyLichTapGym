CREATE DATABASE IF NOT EXISTS QuanLyLichTapGym
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
use QuanLyLichTapGym;

CREATE TABLE Accounts (
    accountId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'GYM_USER') NOT NULL,
    status TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE LoginSessions (
    loginSessionId BIGINT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL,
    loginTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration DATETIME NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'LOGGED_OUT')
        NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_login_session_account
        FOREIGN KEY (accountId)
        REFERENCES Accounts(accountId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE UserProfiles (
    profileId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL UNIQUE,
    fullName VARCHAR(100) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    level VARCHAR(30),
    goal VARCHAR(100),
    sessionsPerWeek INT,
    status TINYINT(1) NOT NULL DEFAULT 1,

    CONSTRAINT fk_user_profile_account
        FOREIGN KEY (accountId)
        REFERENCES Accounts(accountId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_sessions_per_week
        CHECK (sessionsPerWeek IS NULL OR sessionsPerWeek >= 0)
) ENGINE=InnoDB;

CREATE TABLE BodyMetrics (
    metricId BIGINT AUTO_INCREMENT PRIMARY KEY,
    profileId INT NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    recordedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_body_metric_profile
        FOREIGN KEY (profileId)
        REFERENCES UserProfiles(profileId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_height
        CHECK (height IS NULL OR height > 0),

    CONSTRAINT chk_weight
        CHECK (weight IS NULL OR weight > 0)
) ENGINE=InnoDB;

CREATE TABLE WorkoutPlans (
    planId INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    creatorId INT NOT NULL,
    isTemplate TINYINT(1) NOT NULL DEFAULT 0,
    level VARCHAR(30),

    CONSTRAINT fk_workout_plan_creator
        FOREIGN KEY (creatorId)
        REFERENCES Accounts(accountId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE UserWorkoutPlans (
    accountId INT NOT NULL,
    planId INT NOT NULL,
    joinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'COMPLETED', 'LEFT')
        NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (accountId, planId),

    CONSTRAINT fk_user_plan_account
        FOREIGN KEY (accountId)
        REFERENCES Accounts(accountId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_plan_plan
        FOREIGN KEY (planId)
        REFERENCES WorkoutPlans(planId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE WorkoutDays (
    dayId INT AUTO_INCREMENT PRIMARY KEY,
    planId INT NOT NULL,
    dayName VARCHAR(50) NOT NULL,
    `order` INT NOT NULL,

    CONSTRAINT fk_workout_day_plan
        FOREIGN KEY (planId)
        REFERENCES WorkoutPlans(planId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_workout_day_order
        UNIQUE (planId, `order`)
) ENGINE=InnoDB;

CREATE TABLE Exercises (
    exerciseId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    mediaUrl VARCHAR(500),
    difficulty ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED')
) ENGINE=InnoDB;

CREATE TABLE ExerciseConfigs (
    configId INT AUTO_INCREMENT PRIMARY KEY,
    dayId INT NOT NULL,
    exerciseId INT NOT NULL,
    sets INT NOT NULL,
    reps INT NOT NULL,
    restTime INT,
    `order` INT NOT NULL,

    CONSTRAINT fk_exercise_config_day
        FOREIGN KEY (dayId)
        REFERENCES WorkoutDays(dayId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_exercise_config_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_config_sets
        CHECK (sets > 0),

    CONSTRAINT chk_config_reps
        CHECK (reps > 0),

    CONSTRAINT chk_config_rest
        CHECK (restTime IS NULL OR restTime >= 0),

    CONSTRAINT uq_exercise_config_order
        UNIQUE (dayId, `order`)
) ENGINE=InnoDB;

CREATE TABLE Equipments (
    equipmentId INT AUTO_INCREMENT PRIMARY KEY,
    equipmentName VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE ExerciseEquipments (
    exerciseId INT NOT NULL,
    equipmentId INT NOT NULL,

    PRIMARY KEY (exerciseId, equipmentId),

    CONSTRAINT fk_exercise_equipment_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_exercise_equipment_equipment
        FOREIGN KEY (equipmentId)
        REFERENCES Equipments(equipmentId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE MuscleGroups (
    groupId INT AUTO_INCREMENT PRIMARY KEY,
    groupName VARCHAR(100) NOT NULL UNIQUE,
    `function` TEXT
) ENGINE=InnoDB;

CREATE TABLE ExerciseMuscleGroups (
    exerciseMuscleGroupId INT AUTO_INCREMENT PRIMARY KEY,
    exerciseId INT NOT NULL,
    groupId INT NOT NULL,
    role ENUM('PRIMARY', 'SECONDARY'),

    CONSTRAINT fk_exercise_muscle_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_exercise_muscle_group
        FOREIGN KEY (groupId)
        REFERENCES MuscleGroups(groupId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_exercise_muscle
        UNIQUE (exerciseId, groupId)
) ENGINE=InnoDB;

CREATE TABLE WorkoutSessions (
    workoutSessionId BIGINT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL,
    dayId INT NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    totalDuration INT,
    status ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED')
        NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT fk_workout_session_account
        FOREIGN KEY (accountId)
        REFERENCES Accounts(accountId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_workout_session_day
        FOREIGN KEY (dayId)
        REFERENCES WorkoutDays(dayId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_workout_duration
        CHECK (totalDuration IS NULL OR totalDuration >= 0)
) ENGINE=InnoDB;

CREATE TABLE PerformedExercises (
    performedExerciseId BIGINT AUTO_INCREMENT PRIMARY KEY,
    workoutSessionId BIGINT NOT NULL,
    exerciseId INT NOT NULL,

    CONSTRAINT fk_performed_exercise_session
        FOREIGN KEY (workoutSessionId)
        REFERENCES WorkoutSessions(workoutSessionId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_performed_exercise_exercise
        FOREIGN KEY (exerciseId)
        REFERENCES Exercises(exerciseId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ExerciseSets (
    setId BIGINT AUTO_INCREMENT PRIMARY KEY,
    performedExerciseId BIGINT NOT NULL,
    setNumber INT NOT NULL,
    weight DECIMAL(7,2),
    reps INT,
    rpe DECIMAL(3,1),
    isCompleted TINYINT(1) NOT NULL DEFAULT 0,

    CONSTRAINT fk_exercise_set_performed
        FOREIGN KEY (performedExerciseId)
        REFERENCES PerformedExercises(performedExerciseId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_exercise_set_number
        UNIQUE (performedExerciseId, setNumber),

    CONSTRAINT chk_set_number
        CHECK (setNumber > 0),

    CONSTRAINT chk_set_weight
        CHECK (weight IS NULL OR weight >= 0),

    CONSTRAINT chk_set_reps
        CHECK (reps IS NULL OR reps >= 0),

    CONSTRAINT chk_set_rpe
        CHECK (rpe IS NULL OR (rpe >= 0 AND rpe <= 10))
) ENGINE=InnoDB;