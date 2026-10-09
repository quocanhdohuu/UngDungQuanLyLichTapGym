-- Run manually against the existing database. Only this procedure is replaced.
-- No tables or application data are changed.
USE QuanLyLichTapGym;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_GetAllGymUsers $$

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
        a.createdAt,
        wp.planId AS activePlanId,
        wp.title AS activePlanTitle,
        CASE
            WHEN wp.planId IS NULL THEN NULL
            WHEN wp.isTemplate = TRUE THEN 'TEMPLATE'
            ELSE 'PERSONAL'
        END AS activePlanType
    FROM Accounts a
    INNER JOIN GymUsers gu
        ON a.accountId = gu.accountId
    LEFT JOIN WorkoutPlans wp
        ON wp.planId = (
            SELECT guwp.planId
            FROM GymUserWorkoutPlans guwp
            WHERE guwp.profileId = gu.profileId
              AND guwp.status = 'ACTIVE'
            ORDER BY guwp.joinedAt DESC, guwp.planId DESC
            LIMIT 1
        )
    WHERE a.role = 'GYM_USER'
    ORDER BY a.createdAt DESC;
END $$

DELIMITER ;

-- Read-only verification after updating the procedure:
CALL sp_GetAllGymUsers();
