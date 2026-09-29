-- =====================================================
-- Seed Data: ExerciseAlternatives
-- Bổ sung dữ liệu bài tập thay thế thực tế cho ứng dụng GymPlan
-- Thiết kế idempotent (có thể chạy nhiều lần không trùng lặp)
-- =====================================================

INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note)
VALUES
-- 1. Barbell Bench Press
(1, 9, 1, 'Thay thế tốt nhất bằng tạ đơn khi hết ghế tạ đòn hoặc giảm tải áp lực vai'),
(1, 10, 2, 'Máy ép ngực an toàn khi tập một mình không có người đỡ tạ'),
(1, 13, 3, 'Hít đất dùng trọng lượng cơ thể nếu không có dụng cụ tạ'),

-- 7. Incline Barbell Bench Press
(7, 8, 1, 'Đẩy ngực trên với tạ đơn thay thế linh hoạt cho tạ đòn'),
(7, 10, 2, 'Máy đẩy ngực dốc lên'),

-- 9. Dumbbell Bench Press
(9, 1, 1, 'Đổi sang đẩy tạ đòn nằm để tăng tải trọng'),
(9, 10, 2, 'Máy đẩy ngực an toàn'),
(9, 13, 3, 'Hít đất dùng trọng lượng cơ thể'),

-- 11. Cable Fly
(11, 12, 1, 'Máy ép ngực Pec Deck thay thế tương đương'),

-- 12. Pec Deck Fly
(12, 11, 1, 'Kéo cáp ép ngực giữ áp lực cơ liên tục'),

-- 2. Barbell Squat
(2, 40, 1, 'Đạp đùi bằng máy thay cho gánh tạ đòn để giảm áp lực cột sống'),
(2, 41, 2, 'Hack squat với máy cố định quỹ đạo'),
(2, 39, 3, 'Front squat tập trung phát triển đùi trước'),
(2, 42, 4, 'Bulgarian split squat tập từng chân với tạ đơn'),

-- 39. Front Squat
(39, 2, 1, 'Back squat truyền thống gánh tạ sau'),
(39, 41, 2, 'Hack squat với máy'),
(39, 40, 3, 'Đạp đùi bằng máy Leg Press'),

-- 40. Leg Press
(40, 2, 1, 'Gánh tạ đòn tự do'),
(40, 41, 2, 'Hack squat với máy'),

-- 3. Deadlift
(3, 45, 1, 'Romanian Deadlift tập trung cơ đùi sau và mông, kiểm soát tạ tốt'),
(3, 50, 2, 'Good Morning tác động chuỗi cơ sau'),

-- 45. Romanian Deadlift
(45, 3, 1, 'Deadlift truyền thống tăng cường sức mạnh toàn thân'),
(45, 46, 2, 'Nằm cuốn đùi sau máy để cô lập cơ đùi sau'),

-- 4. Lat Pulldown
(4, 14, 1, 'Hít xà đơn thay thế hoàn hảo nếu có đủ thể lực'),
(4, 15, 2, 'Hít xà ngửa tay Chin-up hỗ trợ thêm cơ tay trước'),

-- 14. Pull Up
(14, 4, 1, 'Kéo cáp xô nếu không đủ sức hít xà hoặc muốn kiểm soát mức tạ'),
(14, 15, 2, 'Hít xà ngửa tay Chin-up'),

-- 16. Barbell Bent Over Row
(16, 17, 1, 'Chèo tạ đơn một bên, đỡ áp lực lưng dưới'),
(16, 18, 2, 'Ngồi kéo cáp hẹp tay tập lưng dày'),
(16, 19, 3, 'Chèo thanh chữ T T-Bar Row'),

-- 17. Dumbbell Row
(17, 16, 1, 'Chèo tạ đòn gập người'),
(17, 18, 2, 'Ngồi kéo cáp Seated Cable Row'),

-- 18. Seated Cable Row
(18, 16, 1, 'Chèo tạ đòn gập người'),
(18, 17, 2, 'Chèo tạ đơn Dumbbell Row'),

-- 22. Barbell Overhead Press
(22, 5, 1, 'Ngồi hoặc đứng đẩy tạ đơn qua đầu'),
(22, 24, 2, 'Máy đẩy vai an toàn cho khớp vai'),
(22, 23, 3, 'Đẩy vai xoay tạ Arnold Press'),

-- 5. Dumbbell Shoulder Press
(5, 22, 1, 'Đẩy tạ đòn qua đầu tăng sức mạnh tổng thể'),
(5, 24, 2, 'Máy đẩy vai Machine Shoulder Press'),

-- 6. Latteral Raise
(6, 25, 1, 'Dang vai bằng cáp giữ lực căng liên tục suốt biên độ'),

-- 28. Barbell Curl
(28, 29, 1, 'Cuốn tạ đơn linh hoạt góc cổ tay'),
(28, 30, 2, 'Cuốn tạ búa phát triển tay trước và cẳng tay'),
(28, 33, 3, 'Cuốn tạ kéo cáp giữ áp lực liên tục'),

-- 29. Dumbbell Curl
(29, 28, 1, 'Cuốn tạ đòn Barbell Curl'),
(29, 30, 2, 'Cuốn tạ búa Hammer Curl'),

-- 34. Triceps Pushdown
(34, 35, 1, 'Duỗi tay sau qua đầu kéo dãn cơ tam đầu'),
(34, 36, 2, 'Nằm hạ tạ tay sau Skull Crusher'),
(34, 37, 3, 'Đẩy ngực tay hẹp tác động mạnh tay sau'),

-- 36. Skull Crusher
(36, 34, 1, 'Kéo cáp tay sau an toàn cho khuỷu tay'),
(36, 35, 2, 'Duỗi tay sau qua đầu với tạ đơn'),

-- 44. Leg Extension
(44, 42, 1, 'Bulgarian split squat tập trung đùi trước'),
(44, 43, 2, 'Chùng chân bước đi Walking Lunge'),

-- 46. Lying Leg Curl
(46, 47, 1, 'Ngồi cuốn đùi sau máy'),
(46, 45, 2, 'Romanian Deadlift với tạ đòn hoặc tạ đơn'),

-- 48. Hip Thrust
(48, 49, 1, 'Cầu mông trên thảm dễ tập không cần thanh đòn'),
(48, 45, 2, 'Romanian Deadlift kích hoạt cơ mông và đùi sau'),

-- 53. Plank
(53, 56, 1, 'Lăn con lăn bụng tăng độ khó'),
(53, 54, 2, 'Treo người nâng chân Hanging Leg Raise'),

-- 54. Hanging Leg Raise
(54, 55, 1, 'Gập bụng kéo cáp Cable Crunch'),
(54, 53, 2, 'Plank giữ tĩnh'),

-- 51. Standing Calf Raise
(51, 52, 1, 'Ngồi nhón bắp chuối máy Seated Calf Raise')

ON DUPLICATE KEY UPDATE
    priority = VALUES(priority),
    note = VALUES(note);
