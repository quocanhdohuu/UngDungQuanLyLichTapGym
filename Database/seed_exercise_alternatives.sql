-- Resolve exercises by name so IDs may differ between databases. Safe to run repeatedly.

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Barbell Bench Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Bench Press' AND e2.name = 'Dumbbell Bench Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Barbell Bench Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Bench Press' AND e2.name = 'Chest Press Machine'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Lựa chọn thay thế cho Barbell Bench Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Bench Press' AND e2.name = 'Push Up'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Incline Barbell Bench Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Incline Barbell Bench Press' AND e2.name = 'Incline Dumbbell Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Incline Barbell Bench Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Incline Barbell Bench Press' AND e2.name = 'Chest Press Machine'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Đổi sang đẩy tạ đòn nằm để tăng tải trọng'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Bench Press' AND e2.name = 'Barbell Bench Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Máy đẩy ngực an toàn'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Bench Press' AND e2.name = 'Chest Press Machine'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Hít đất dùng trọng lượng cơ thể'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Bench Press' AND e2.name = 'Push Up'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Máy ép ngực Pec Deck thay thế tương đương'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Cable Fly' AND e2.name = 'Pec Deck Fly'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Kéo cáp ép ngực giữ áp lực cơ liên tục'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Pec Deck Fly' AND e2.name = 'Cable Fly'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Barbell Squat.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Squat' AND e2.name = 'Leg Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Lựa chọn thay thế cho Barbell Squat.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Squat' AND e2.name = 'Hack Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Barbell Squat.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Squat' AND e2.name = 'Front Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 4, 'Lựa chọn thay thế cho Barbell Squat.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Squat' AND e2.name = 'Bulgarian Split Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Back squat truyền thống gánh tạ sau'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Front Squat' AND e2.name = 'Barbell Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Hack squat với máy'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Front Squat' AND e2.name = 'Hack Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Đạp đùi bằng máy Leg Press'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Front Squat' AND e2.name = 'Leg Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Lựa chọn thay thế cho Leg Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Leg Press' AND e2.name = 'Barbell Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Leg Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Leg Press' AND e2.name = 'Hack Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Romanian Deadlift tập trung cơ đùi sau và mông, kiểm soát tạ tốt'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Deadlift' AND e2.name = 'Romanian Deadlift'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Good Morning tác động chuỗi cơ sau'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Deadlift' AND e2.name = 'Good Morning'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Deadlift truyền thống tăng cường sức mạnh toàn thân'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Romanian Deadlift' AND e2.name = 'Deadlift'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Nằm cuốn đùi sau máy để cô lập cơ đùi sau'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Romanian Deadlift' AND e2.name = 'Lying Leg Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Lat Pulldown.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Lat Pulldown' AND e2.name = 'Pull Up'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Lat Pulldown.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Lat Pulldown' AND e2.name = 'Chin Up'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Kéo cáp xô nếu không đủ sức hít xà hoặc muốn kiểm soát mức tạ'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Pull Up' AND e2.name = 'Lat Pulldown'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Hít xà ngửa tay Chin-up'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Pull Up' AND e2.name = 'Chin Up'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Barbell Bent Over Row.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Bent Over Row' AND e2.name = 'Dumbbell Row'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Lựa chọn thay thế cho Barbell Bent Over Row.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Bent Over Row' AND e2.name = 'Seated Cable Row'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Barbell Bent Over Row.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Bent Over Row' AND e2.name = 'T-Bar Row'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Chèo tạ đòn gập người'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Row' AND e2.name = 'Barbell Bent Over Row'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Ngồi kéo cáp Seated Cable Row'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Row' AND e2.name = 'Seated Cable Row'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Chèo tạ đòn gập người'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Seated Cable Row' AND e2.name = 'Barbell Bent Over Row'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Chèo tạ đơn Dumbbell Row'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Seated Cable Row' AND e2.name = 'Dumbbell Row'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Lựa chọn thay thế cho Barbell Overhead Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Overhead Press' AND e2.name = 'Dumbbell Shoulder Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Barbell Overhead Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Overhead Press' AND e2.name = 'Machine Shoulder Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Barbell Overhead Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Overhead Press' AND e2.name = 'Arnold Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Đẩy tạ đòn qua đầu tăng sức mạnh tổng thể'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Shoulder Press' AND e2.name = 'Barbell Overhead Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Máy đẩy vai Machine Shoulder Press'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Shoulder Press' AND e2.name = 'Machine Shoulder Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Dang vai bằng cáp giữ lực căng liên tục suốt biên độ'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Latteral Raise' AND e2.name = 'Cable Lateral Raise'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Barbell Curl.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Curl' AND e2.name = 'Dumbbell Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 4, 'Lựa chọn thay thế cho Barbell Curl.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Curl' AND e2.name = 'Hammer Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Barbell Curl.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Curl' AND e2.name = 'Cable Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Cuốn tạ đòn Barbell Curl'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Curl' AND e2.name = 'Barbell Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Cuốn tạ búa Hammer Curl'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Dumbbell Curl' AND e2.name = 'Hammer Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lựa chọn thay thế cho Triceps Pushdown.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Triceps Pushdown' AND e2.name = 'Overhead Triceps Extension'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Triceps Pushdown.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Triceps Pushdown' AND e2.name = 'Skull Crusher'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Lựa chọn thay thế cho Triceps Pushdown.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Triceps Pushdown' AND e2.name = 'Close Grip Bench Press'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Kéo cáp tay sau an toàn cho khuỷu tay'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Skull Crusher' AND e2.name = 'Triceps Pushdown'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Duỗi tay sau qua đầu với tạ đơn'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Skull Crusher' AND e2.name = 'Overhead Triceps Extension'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Bulgarian split squat tập trung đùi trước'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Leg Extension' AND e2.name = 'Bulgarian Split Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Chùng chân bước đi Walking Lunge'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Leg Extension' AND e2.name = 'Walking Lunge'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Ngồi cuốn đùi sau máy'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Lying Leg Curl' AND e2.name = 'Seated Leg Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Romanian Deadlift với tạ đòn hoặc tạ đơn'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Lying Leg Curl' AND e2.name = 'Romanian Deadlift'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Cầu mông trên thảm dễ tập không cần thanh đòn'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Hip Thrust' AND e2.name = 'Glute Bridge'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Romanian Deadlift kích hoạt cơ mông và đùi sau'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Hip Thrust' AND e2.name = 'Romanian Deadlift'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Lăn con lăn bụng tăng độ khó'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Plank' AND e2.name = 'Ab Wheel Rollout'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Treo người nâng chân Hanging Leg Raise'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Plank' AND e2.name = 'Hanging Leg Raise'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Gập bụng kéo cáp Cable Crunch'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Hanging Leg Raise' AND e2.name = 'Cable Crunch'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Plank giữ tĩnh'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Hanging Leg Raise' AND e2.name = 'Plank'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 1, 'Ngồi nhón bắp chuối máy Seated Calf Raise'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Standing Calf Raise' AND e2.name = 'Seated Calf Raise'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 2, 'Lựa chọn thay thế cho Leg Press.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Leg Press' AND e2.name = 'Bulgarian Split Squat'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
SELECT e1.exerciseId, e2.exerciseId, 3, 'Lựa chọn thay thế cho Barbell Curl.'
FROM Exercises e1 CROSS JOIN Exercises e2
WHERE e1.name = 'Barbell Curl' AND e2.name = 'Preacher Curl'
ON DUPLICATE KEY UPDATE priority = VALUES(priority), note = VALUES(note);
