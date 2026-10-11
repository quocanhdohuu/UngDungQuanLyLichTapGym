# Kiểm tra trước khi bổ sung dữ liệu mẫu — 11/10/2026

Đây là báo cáo baseline trước seed (bước 1–2). Người dùng đã chốt: **tổng 50–80 buổi, cân nặng đúng 60 kg**. Script và kết quả kiểm tra bước 3–4 nằm trong [SAMPLE_DATA_V2_READY.md](SAMPLE_DATA_V2_READY.md). Bước 5–6 đã hoàn tất sau phê duyệt; xem [kết quả thực thi](SAMPLE_DATA_V2_RESULT.md). Những số liệu bên dưới là số liệu trước seed. Không thay đổi SQL gốc, Backend, Frontend hay bản ghi cũ.

## Nguồn và cách kiểm tra

- Đọc `MySQL_GymPlan.sql` (4.753 dòng), đối chiếu `Diagram_QuanLyLichTapGym.png`, `SHOW CREATE TABLE` của cả 18 bảng và định nghĩa 45 procedure trên MySQL thực tế.
- Kết nối theo `.env` của Backend, database `quanlylichtapgym`, MySQL 8.0.46; giờ máy chủ là UTC+7, khớp ngày 11/10/2026 của người dùng.
- Kiểm kê trong transaction `WITH CONSISTENT SNAPSHOT, READ ONLY`; không xuất mật khẩu Accounts hoặc chi tiết LoginSessions. Dữ liệu kiểm kê lưu ở `sample_data_audit.json`.
- `verify_sample_data.sql` đã chạy thành công trên CSDL thực tế trong transaction READ ONLY, gồm các SELECT đối chiếu và 6 getter được yêu cầu (history được gọi với ALL/WEEK/MONTH). Kết quả lưu ở `sample_data_verification.json`.
- Chạy lại kiểm kê và kiểm tra: `node Database/audit_sample_data.cjs` từ thư mục gốc dự án. Lệnh này cập nhật hai tệp báo cáo JSON trên đĩa, không ghi vào CSDL.

## Baseline thực tế

| Bảng | Số dòng |
|---|---:|
| Accounts | 23 (1 ADMIN, 22 GYM_USER) |
| GymUsers | 22 |
| WorkoutPlans | 18 (9 template, 9 cá nhân) |
| WorkoutDays | 73 |
| Exercises | 57 |
| ExerciseConfigs | 364 |
| GymUserWorkoutPlans | 11 |
| WorkoutSessions | 224 |
| PerformedExercises | 959 |
| ExerciseSets | 3.108 |
| BodyMetrics | 81 |
| ExerciseAlternatives | 64 |
| ExerciseEquipment | 76 |
| ExerciseMuscleGroups | 148 |
| ExerciseMedia | 57 |
| Equipment | 20 |
| MuscleGroups | 15 |
| LoginSessions | 87 |

Nếu thêm đủ 30 tài khoản, dự kiến Accounts = 53, GYM_USER = 52, GymUsers = 52, trong điều kiện không có thay đổi đồng thời.

## Tài khoản ưu tiên

- `accountId = 28`, username `gym_minh`, email `minh@example.test`, ACTIVE, đăng ký `2026-04-12 07:29:31`.
- `profileId = 27`, Nguyễn Hoàng Minh, MALE, BEGINNER, mục tiêu thực tế **Sức bền**, 3 buổi/tuần. Không đổi mục tiêu sang tăng cơ/giảm mỡ.
- 48 buổi: 40 COMPLETED, 8 CANCELLED, từ 06/05 đến 06/10/2026; 199 PerformedExercises và 549 ExerciseSets.
- 11 BodyMetrics, cao 175 cm. Chuỗi đầu tăng từ 64 đến 66 kg. Ngày 03/10 có 66 kg lúc 21:11:28, rồi 60 kg lúc 21:12:10.
- Plan ACTIVE: `Nguyễn Hoàng Minh - minh_current`, planId 46, bắt đầu 25/08/2026, 8 tuần; Thứ Hai/Tư/Sáu, mỗi ngày 5 bài, 2–3 hiệp/bài.
- Plan COMPLETED: `Nguyễn Hoàng Minh - minh_past`, planId 47, bắt đầu 05/05/2026, 8 tuần; lịch Thứ Hai/Tư/Sáu, cấu hình đầy đủ.
- Nếu giữ thời lượng 8 tuần và tối đa một buổi/ngày theo lịch, lịch cũ đã kín; lịch ACTIVE còn **02/10, 07/10, 09/10** chưa có buổi. Thêm 3 buổi này sẽ đạt **51 buổi**, 43 COMPLETED; thêm 15 PerformedExercises và 43 ExerciseSets. Không cần thêm chương trình cho Minh theo phương án này.
- Thêm mới 50–80 buổi ngoài 48 buổi hiện có sẽ không phù hợp với các khoảng chương trình hiện có nếu vẫn giữ lịch 3 buổi/tuần và không dồn nhiều buổi/ngày. Cần thống nhất phương án lịch sử trước khi viết phần này.

## Schema, Diagram và quy ước đã xác minh

- Diagram thể hiện quan hệ chính phù hợp schema hiện tại nhưng thiếu cột `PerformedExercises.isActive` đang có trên MySQL và trong SQL gốc.
- PK quan hệ chương trình: `(profileId, planId)`; không biểu diễn nhiều lần tham gia cùng một plan thành nhiều dòng. Không có `endedAt` để biết chính xác ngày kết thúc/cancel.
- UNIQUE: username, email, GymUsers.accountId, `(planId, order)`, `(dayId, order)`, `(performedExerciseId, setNumber)`, `(exerciseId, alternativeExerciseId)` và các bảng mapping theo SHOW CREATE TABLE.
- Một plan ACTIVE/người là nghiệp vụ; DB chưa có UNIQUE bắt buộc điều này. Hiện không có người dùng nào có nhiều plan ACTIVE.
- Không có UNIQUE cho buổi tập theo ngày/giờ, cho BodyMetrics theo thời điểm, hoặc cho tên WorkoutPlans/Exercises. Seed cần tự kiểm tra các khóa nghiệp vụ và dừng khi trùng mơ hồ; không dùng INSERT IGNORE.
- Các CHECK đang có chỉ đảm bảo số hiệp/reps/rest, thứ trong tuần và các số đo cơ bản; không thay thế kiểm tra toàn bộ logic lịch sử.
- `weekDay`: 1 = Thứ Hai, 7 = Chủ nhật. `totalDuration`: phút; xác minh ở `sp_CompleteWorkoutSession` và giao diện history.
- `preValue`: mức tạ của cùng `setNumber` trong lần thực hiện trước của bài tập ở buổi COMPLETED. Mobile truyền `prior.weight` ở `src/app/workout/index.tsx:148`; `sp_GetPreviousExercisePerformance` lấy các hiệp của buổi hoàn thành gần nhất. Lần đầu hoặc không có hiệp tương ứng: NULL. Khi chèn lịch sử lùi ngày phải tìm buổi **trước thời điểm buổi mới**, không lấy buổi tương lai so với bản ghi đang tạo.
- Auth thực tế: Backend gọi `sp_Login`, procedure so sánh trực tiếp `password = p_password`; không có bước bcrypt trong luồng này. Mật khẩu giả dự kiến `GymDemoV2@2026!`, dùng đúng cơ chế hiện tại, không đổi auth hoặc mật khẩu tài khoản cũ.
- Thư viện chứa tên `Latteral Raise`; seed gốc tìm `Lateral Raise`, nên một số template có ít cấu hình hơn VALUES trong file. Phải dùng cấu hình thực tế. Không tự thêm bài chỉ để bù tên.
- Plank được cấu hình reps = 30 nhưng schema không có đơn vị thời gian cho từng hiệp. Không tự chuyển dữ liệu cũ; nếu tái sử dụng giữ cấu hình hiện tại, weight = 0; volume theo kg × reps của bài này bằng 0.

## Vấn đề đã có trước seed

- 9 buổi lệch weekDay: sessionId 288–293 (profile 1), 301, 317, 322 (profile 27). Đây là các buổi test cũ; không sửa.
- 2 bài có số hiệp không liên tục: performedExerciseId 1065 chỉ còn hiệp 3 (buổi CANCELLED 298 của Minh), 1070 chỉ còn hiệp 2 (buổi CANCELLED 306 của profile 29). Không tự điền các hiệp vào buổi đã huỷ.
- Hai lần cân của Minh lệch 6 kg trong 42 giây. Getter hồ sơ đang hiển thị **60 kg** vì đây là bản ghi mới nhất. Cần người dùng xác định mốc đúng; cả hai bản ghi cũ vẫn giữ nguyên theo phạm vi công việc.
- Minh có buổi test hoàn thành 0 phút và 4 phút; có buổi chỉ ghi một bài. Không thể làm toàn bộ lịch sử cũ đạt 45–100 phút/4–7 bài chỉ bằng bổ sung, nếu đồng thời phải giữ nguyên dữ liệu cũ.
- Kiểm tra hiện tại không phát hiện trùng username/email, nhiều ACTIVE plan, trùng số hiệp, trùng thời điểm cân, buổi trước đăng ký hoặc trước tham gia plan, buổi tương lai, thời gian chồng lấn, duration sai đơn vị phút, số âm, bài ngoài cấu hình/quan hệ thay thế sai; các kiểm tra bản ghi mồ côi trong file SELECT cũng trả 0.

## Kết quả getter và lưu ý logic

| Getter | Kết quả trước khi bổ sung |
|---|---|
| sp_GetMyProfile(28) | Đúng profile 27, BEGINNER, Sức bền, 175 cm, 60 kg |
| sp_GetUserActivePlan(27) | Plan 46, tuần 7/8, 2 buổi hoàn thành trong tuần |
| sp_GetTodayWorkout(27) | dayId NULL, 0 bài; đúng ngày nghỉ Chủ nhật 11/10/2026 |
| sp_GetUserProgressSummary(27) | 40 buổi hoàn thành, 127,2 tấn, streak 0 |
| sp_GetUserPersonalRecords(27) | 13 bài; Leg Press cao nhất 56,25 kg |
| sp_GetUserWorkoutHistory(27, ALL/WEEK/MONTH) | 40 / 2 / 2 buổi |

Các điểm cần lưu ý, chỉ báo cáo, không sửa:

1. Summary, PR và History không lọc `pe.isActive`. Bài đã được thay thế nhưng còn hiệp có thể vẫn được tính. Với Minh, volume hiện tại của hai cách tính đang bằng nhau: 127.195 kg.
2. `latestWorkout` trong PR là ngày tập gần nhất của bài, không nhất thiết là ngày đạt maxWeight. File kiểm tra có SELECT riêng lấy đúng ngày đạt PR.
3. Streak là chuỗi ngày liên tiếp, không phải chuỗi buổi tuân thủ giáo án có ngày nghỉ; streak 0 có thể hoàn toàn đúng dù tập đều.
4. ActivePlan đếm mọi buổi COMPLETED trong tuần của người dùng, không lọc theo plan; không tự đổi trạng thái khi hết durationWeeks.
5. TodayWorkout không suy ra weekDay từ order. Trong 9 template, 8 template tiêu chuẩn đều có weekDay NULL; template QA_Split có weekday nhưng chỉ 1–2 bài/ngày, không đủ dữ liệu mục tiêu.
6. History chỉ trả COMPLETED; các buổi CANCELLED kiểm tra bằng SELECT riêng.

## Phương án 30 người mới

- Namespace ổn định dự kiến: `gym_demo_v2_01` … `gym_demo_v2_30`, email tương ứng `@example.test`; kiểm kê chưa có tiền tố này. Kiểm tra lại theo collation DB ngay trước thực thi, không suy ra ID từ MAX hoặc thứ tự insert.
- Phân bổ đúng 6 người mới, 15 người thường xuyên, 9 người có lịch sử dài hơn; ngày đăng ký rải từ tháng 5 đến tháng 10/2026. 24 ACTIVE, 4 INACTIVE, 2 LOCKED; trạng thái GymUsers của LOCKED vẫn ACTIVE theo nghiệp vụ hiện tại.
- Cả nam và nữ, dự kiến 15 BEGINNER / 11 INTERMEDIATE / 4 ADVANCED; 4 nhóm mục tiêu tăng cơ, giảm mỡ, sức mạnh, sức khỏe; 2–6 buổi/tuần.
- Người mới 0–3 buổi, thường xuyên khoảng 8–24, lâu hơn khoảng 25–40; điều chỉnh lịch cụ thể theo ngày đăng ký, weekday, trạng thái tham gia và khoảng chương trình. Minh vẫn nhiều lịch sử nhất theo phương án tổng 51 buổi.
- Tái sử dụng toàn bộ Exercises và cấu hình phù hợp trong 8 template tiêu chuẩn. Template chưa có weekday và schema không có lịch tuần riêng trên GymUserWorkoutPlans, nên cần bản sao chương trình cá nhân có weekday cho người mới, tương tự các plan cá nhân hiện có. Không gán plan cá nhân của người khác, không UPDATE template dùng chung, không thêm Exercises mới.
- Lịch 2 buổi sẽ chọn hai ngày full-body hoàn chỉnh từ mẫu beginner; lịch 3/4/5/6 buổi theo mẫu và level tương ứng. Chỉ sao chép cần thiết để tạo lịch tuần hợp lệ, không tạo thêm template thư viện.
- Người lâu năm có giai đoạn COMPLETED hoặc CANCELLED trước ACTIVE khi thích hợp; mỗi người tối đa một ACTIVE, chương trình không chồng khoảng sử dụng.
- Mỗi buổi mới có 4–7 bài theo cấu hình thật, 2–5 hiệp; 45–100 phút, không sinh IN_PROGRESS giả trong quá khứ. Progressive overload theo bậc tuần, giữ tải và giảm tải định kỳ; bodyweight = 0; mức tạ phù hợp từng loại bài, level và lịch sử.
- BodyMetrics 2–6/người (người rất mới có thể 1), cao ổn định, cân biến động từ từ theo mục tiêu. Với Minh cần chốt mốc cân; 11 bản ghi hiện có đã nằm trong khoảng tổng 10–20.
- Transaction duy nhất, khóa tránh seed đồng thời, kiểm tra FK/UNIQUE/strict mode, dùng ID truy vấn theo username/email và mapping thực tế; NOT EXISTS theo khóa nghiệp vụ và kiểm tra xung đột. Khi chạy lại phải giữ lịch sử người dùng đã tương tác sau seed, không ghi đè. Dừng và rollback nếu có xung đột/seed dở dang thay vì bỏ qua lỗi.
- Kiểm tra khả năng chạy lại trên dữ liệu dự kiến và kiểm tra SQL đọc trước phê duyệt; không chạy thử INSERT rồi rollback khi chưa được đồng ý. Sau phê duyệt mới thực thi, kiểm đếm thay đổi và chạy lại bộ đối chiếu.

## Hai thông tin đã được chốt sau báo cáo baseline

1. **Tổng sau bổ sung là 50–80 buổi.** Giữ nguyên cả hai chương trình, thêm 3 buổi hợp lịch để tổng thành 51.
2. **Cân nặng đúng là 60 kg.** Thêm hai mốc 60,1 và 60 kg sau mốc được xác nhận; dữ liệu cũ không bị sửa.

Câu trả lời này làm rõ dữ liệu theo mục 12, chưa phải phê duyệt INSERT. Xem bộ script hoàn chỉnh để duyệt theo bước 5 tại báo cáo v2.
