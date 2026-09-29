# Kết quả seed dữ liệu test

Đã chạy `seed_test_data.sql` ngày 29/09/2026 trên MySQL 8.0.46,
database `quanlylichtapgym`. Ngày giờ seed lấy từ MySQL.

## Số bản ghi

| Bảng | Trước | Thêm | Sau |
|---|---:|---:|---:|
| Accounts | 10 | 12 | 22 |
| GymUsers | 9 | 12 | 21 |
| BodyMetrics | 2 | 77 | 79 |
| GymUserWorkoutPlans | 0 | 10 | 10 |
| WorkoutSessions | 0 | 199 | 199 |
| PerformedExercises | 0 | 940 | 940 |
| ExerciseSets | 0 | 3.056 | 3.056 |
| WorkoutPlans | 9 | 9 | 18 |
| WorkoutDays | 36 | 37 | 73 |
| ExerciseConfigs | 176 | 188 | 364 |
| Exercises | 57 | 0 | 57 |
| ExerciseMedia | 11 | 0 | 11 |
| MuscleGroups | 15 | 0 | 15 |
| ExerciseMuscleGroups | 148 | 0 | 148 |
| Equipment | 20 | 0 | 20 |
| ExerciseEquipment | 76 | 0 | 76 |
| LoginSessions | 43 | 0 | 43 |

## Tài khoản dùng thử

Email là `<username>@example.test`; mật khẩu chung **`GymTest@2026!`**.
Định dạng mật khẩu tuân theo phép so sánh hiện tại của `sp_Login`.

| Username | Tình huống |
|---|---|
| seed_gym_minh | Beginner, tăng cơ, một lịch cũ hoàn thành và một lịch đang tập |
| seed_gym_lan | Intermediate, giảm mỡ, có buổi đang dở để tiếp tục tập |
| seed_gym_hung | Intermediate, tăng cơ, lịch 6 buổi/tuần, có buổi đang dở |
| seed_gym_thao | Beginner, sức bền, tập thứ Ba/Năm/Bảy |
| seed_gym_duc | Advanced, sức mạnh, lịch 4 buổi/tuần |
| seed_gym_vy | Intermediate, tăng cơ, lịch 5 buổi/tuần |
| seed_gym_khanh | Giới tính OTHER, lịch đã hoàn thành, không có lịch ACTIVE |
| seed_gym_linh | Advanced, lịch đã hủy, có lịch sử tập |
| seed_gym_tuan | Tài khoản LOCKED, dùng kiểm tra từ chối đăng nhập |
| seed_gym_mai | Tài khoản và hồ sơ INACTIVE |
| seed_gym_an | Mới đăng ký, gender/goal/sessionsPerWeek NULL, chưa có chỉ số/lịch/buổi tập |
| seed_gym_bao | Đã chọn lịch mẫu hiện có, startedAt NULL, chưa có buổi tập, chỉ ghi cân nặng |

Các trạng thái đang dở phản ánh thời điểm seed; chúng sẽ thay đổi khi người test
tiếp tục hoặc kết thúc buổi tập. Chạy lại seed không đặt lại dữ liệu này.

## Phạm vi và quan hệ

Đã đọc `MySQL_GymPlan.sql`, bao gồm các lệnh `ALTER TABLE`, và đối chiếu
`SHOW CREATE TABLE` của cả 17 bảng trong database thực tế.

- `Accounts` → `GymUsers`: một tài khoản có tối đa một hồ sơ (`accountId` UNIQUE).
  Tài khoản còn sở hữu `LoginSessions` và tạo `WorkoutPlans`.
- `WorkoutPlans` → `WorkoutDays` → `ExerciseConfigs` → `Exercises`:
  thứ tự ngày duy nhất trong mỗi lịch; thứ tự bài duy nhất trong mỗi ngày.
- `Exercises` có nhiều `ExerciseMedia`; liên kết nhiều–nhiều với
  `MuscleGroups` và `Equipment` qua hai bảng trung gian.
- `GymUserWorkoutPlans` liên kết hồ sơ với lịch, PK `(profileId, planId)`.
- `GymUsers` → `WorkoutSessions` → `PerformedExercises` → `ExerciseSets`:
  số hiệp duy nhất trong mỗi bài đã tập. `WorkoutSessions.dayId` cho phép NULL.
- `GymUsers` → `BodyMetrics`: nhiều lần đo theo thời gian.
- FK dùng `ON UPDATE CASCADE`; khi xóa, phần lớn dùng `CASCADE`.
  Hai FK dùng `RESTRICT` là người tạo lịch và bài tập đã thực hiện;
  FK từ buổi tập đến ngày tập dùng `SET NULL`.
- UNIQUE còn bao gồm username, email, tên nhóm cơ, tên thiết bị,
  cặp bài–nhóm cơ; cặp bài–thiết bị là khóa chính ghép.
- CHECK kiểm soát số buổi/tuần, số hiệp/lần lặp, thời gian nghỉ,
  thời lượng buổi, số thứ tự hiệp, tải tập, chiều cao/cân nặng và weekDay.
  Các giá trị NULL được giữ đúng theo từng cột/ràng buộc.
- ENUM đã đối chiếu trực tiếp cho role/status, gender, level, difficulty,
  loại media, vai trò nhóm cơ và trạng thái đăng ký/buổi tập.

34/36 ngày tập cũ chưa có `weekDay`. Seed thêm 9 lịch cá nhân từ 8 giáo án
hiện có, sao chép 37 ngày và 188 cấu hình bài; ngày trong tuần được gán trên
các dòng mới để test lịch hôm nay. Thư viện bài tập và các lịch cũ giữ nguyên.
Tên giáo án không có UNIQUE nên seed kiểm tra mỗi tên nguồn khớp đúng một lịch.

12 người dùng trải trên sáu tháng đăng ký. 199 buổi gồm 185 COMPLETED,
12 CANCELLED và 2 IN_PROGRESS, từ 06/05 đến 29/09/2026. Đăng ký lịch gồm
7 ACTIVE, 2 COMPLETED và 1 CANCELLED. Chỉ số cơ thể thay đổi theo tuần;
tải tập và số lần lặp thay đổi theo trình độ/tiến trình. `preValue` lấy từ
cùng số hiệp của lần tập hoàn thành gần nhất, NULL nếu chưa có lần trước.
Các bài dùng trọng lượng cơ thể có tải ngoài bằng 0.

## Kiểm tra đã thực hiện

- Trước seed: SELECT số dòng cả 17 bảng, người dùng, lịch, ngày, bài tập,
  trạng thái buổi tập; kiểm tra metadata schema và ràng buộc.
- Chạy tuần tự từng câu SQL trên một kết nối, trong transaction;
  bật FK/UNIQUE checks và strict SQL mode. Nếu lỗi thì dừng và rollback.
- Trước COMMIT và sau khi chạy: SELECT kiểm tra **19 FK, 26 PRIMARY/UNIQUE,
  11 CHECK và 12 cột ENUM: 0 vi phạm**.
- So sánh từng dòng cũ theo khóa chính: toàn bộ dữ liệu cũ giữ nguyên.
  Cấu trúc bảng giữ nguyên, ngoài bộ đếm AUTO_INCREMENT tăng khi INSERT.
- So sánh định nghĩa: **44 stored procedure giữ nguyên**.
- Chạy lại toàn bộ seed: **thêm 0 dòng**, dữ liệu lần chạy đầu giữ nguyên.
- 96 lời gọi procedure đọc cho 12 tài khoản: hồ sơ, lịch đang tập,
  tổng quan tiến trình, PR, chỉ số cơ thể, lịch sử ALL/WEEK/MONTH đều thành công.
- Dashboard: 21 hồ sơ, 57 bài tập, 9 lịch mẫu, 13 người dùng mới tháng 9,
  102 buổi tập tháng 9; biểu đồ đăng ký có dữ liệu từ tháng 4 đến tháng 9.
- Lịch hôm nay: Lan có 5 bài, Thảo có 4 bài; Minh là ngày nghỉ,
  trả về ngày tập NULL và danh sách bài trống đúng lịch thứ Hai/Tư/Sáu.

Kiểm tra chức năng ở mức dữ liệu và procedure đọc; chưa chạy giao diện hoặc HTTP API.
Không gọi procedure đăng nhập khi kiểm tra để tránh thêm LoginSessions ngoài seed.

## Chạy lại

Chạy toàn bộ `seed_test_data.sql` trên một kết nối MySQL với tài khoản có quyền
SELECT, INSERT và CREATE TEMPORARY TABLES. Với MySQL CLI, chạy batch và không
dùng `--force`; với công cụ khác, bật dừng khi lỗi và ROLLBACK nếu thất bại.
Không chạy lại file schema gốc để seed.

Seed tự lấy ID bằng JOIN theo tài khoản/lịch đã tạo, không gán ID cứng.
Nếu đủ 12 username/email seed đã tồn tại thì không thêm dữ liệu.
Nếu chỉ tồn tại một phần hoặc có xung đột tên/email, seed dừng để kiểm tra;
không ghi đè hoặc tự sửa dữ liệu đang có.
