# Kết quả bổ sung dữ liệu mẫu v2

Đã thực thi script được người dùng phê duyệt và COMMIT thành công ngày **11/10/2026**. Đối chiếu lần cuối lúc **14:54:43, UTC+7**. Chạy lại cùng script trên kết nối mới đã thành công, thêm **0 dòng** ở tất cả các bảng.

## Số dòng thực tế

| Bảng | Trước | Đã thêm | Sau |
|---|---:|---:|---:|
| Accounts | 23 | 30 | 53 |
| GymUsers | 22 | 30 | 52 |
| WorkoutPlans | 18 | 39 | 57 |
| WorkoutDays | 73 | 153 | 226 |
| ExerciseConfigs | 364 | 783 | 1.147 |
| GymUserWorkoutPlans | 11 | 39 | 50 |
| WorkoutSessions | 224 | 506 | 730 |
| PerformedExercises | 959 | 2.580 | 3.539 |
| ExerciseSets | 3.108 | 8.377 | 11.485 |
| BodyMetrics | 81 | 122 | 203 |

Hiện có **52 tài khoản GYM_USER và 1 ADMIN**. Thư viện Exercises, Alternatives, Media, thiết bị và nhóm cơ được giữ nguyên. 39 chương trình thêm là các lịch cá nhân cần weekday và lịch sử tham gia; không thêm template thư viện.

## Minh — accountId 28, profileId 27

- **51 buổi**: 43 COMPLETED, 8 CANCELLED; thêm đúng ba buổi 02/10, 07/10 và 09/10/2026.
- **214 bài đã thực hiện, 592 hiệp**; thêm 15 bài và 43 hiệp.
- **13 bản ghi thể trạng**; mới nhất ngày 10/10/2026 lúc 07:15: **175 cm, 60 kg**.
- Volume của buổi COMPLETED: **140.455 kg**, getter làm tròn **140,5 tấn**.
- Giữ nguyên chương trình ACTIVE, chương trình COMPLETED và mục tiêu **Sức bền**; không đổi tài khoản/mật khẩu.

## Stored Procedure đã kiểm tra trên dữ liệu sau COMMIT

| Procedure | Kết quả |
|---|---|
| sp_GetMyProfile(28) | Đúng profile 27; 175 cm, 60 kg, ngày cập nhật 10/10 |
| sp_GetUserActivePlan(27) | Một plan ACTIVE, tuần 7/8, 4 buổi COMPLETED trong tuần |
| sp_GetTodayWorkout(27) | Chủ nhật 11/10 là ngày nghỉ: dayId NULL, 0 bài |
| sp_GetUserProgressSummary(27) | 43 buổi, 140,5 tấn, streak 0 |
| sp_GetUserPersonalRecords(27) | 13 bài; Leg Press 56,25 kg |
| sp_GetUserWorkoutHistory(27, ALL) | 43 buổi hoàn thành |
| sp_GetUserWorkoutHistory(27, WEEK) | 4 buổi hoàn thành |
| sp_GetUserWorkoutHistory(27, MONTH) | 5 buổi hoàn thành |

Số buổi trong tuần có cả buổi test cũ ngày 06/10, nên là 4 dù lịch là 3 buổi/tuần. Streak 0 phù hợp vì buổi gần nhất ngày 09/10, tiếp theo là hai ngày nghỉ. Không sửa procedure để thay đổi các kết quả này.

## Đối chiếu tính toàn vẹn và dữ liệu cũ

- Kiểm tra toàn bộ **22 khóa ngoại**: **0 bản ghi mồ côi**.
- Đối chiếu **37.578 giá trị** của dữ liệu đã ghi với manifest; đúng các cấu hình, quan hệ, timestamps, mức tạ/reps/preValue và số đo dự kiến.
- So sánh từng bản ghi cũ thuộc 17 bảng được kiểm kê với snapshot trước seed: **không thay đổi hoặc mất bản ghi cũ**. Snapshot Accounts không chứa mật khẩu; script chỉ INSERT tài khoản mới.
- Định nghĩa 17 bảng được đối chiếu không đổi (bỏ qua giá trị bộ đếm AUTO_INCREMENT); **45 Stored Procedure giữ nguyên**.
- Không phát sinh lỗi mới trong các truy vấn kiểm tra trùng lặp, thời gian, lịch tuần, số hiệp, liên kết chương trình và bài tập.
- Hai bài có số hiệp không liên tục và chín buổi lệch weekday vẫn là các bản ghi cũ đã báo cáo. Hai lần cân 66 → 60 kg ngày 03/10 cũng giữ nguyên; các số đo mới tiếp nối 60 kg theo xác nhận của người dùng.
- Chạy lại script thật lần hai: không tạo thêm tài khoản, chương trình, lịch sử, hiệp hoặc số đo.

## Tài khoản thử nghiệm

- Email: `gym_demo_v2_01@example.test` đến `gym_demo_v2_30@example.test`.
- Mật khẩu chung cho tài khoản mới: `GymDemoV2@2026!`.
- Có 24 ACTIVE, 4 INACTIVE, 2 LOCKED. Dùng tài khoản ACTIVE, ví dụ `gym_demo_v2_01@example.test`, để thử đăng nhập; chưa gọi login trong quá trình đối chiếu để tránh phát sinh LoginSessions không cần thiết.
- Danh sách họ tên, mục tiêu, level và trạng thái: [SAMPLE_DATA_V2_READY.md](SAMPLE_DATA_V2_READY.md).

## Bằng chứng và truy vấn

- [sample_seed_first_apply.json](sample_seed_first_apply.json): kết quả lần COMMIT đầu và 24 truy vấn đối chiếu.
- [sample_seed_applied.json](sample_seed_applied.json): kết quả chạy lại, mọi added_* = 0, cùng kết quả getter.
- [sample_seed_reconciled.json](sample_seed_reconciled.json): kết quả so sánh từng bản ghi, khóa ngoại, schema/procedure và thông số Minh.
- [verify_sample_data.sql](verify_sample_data.sql): SELECT kiểm tra danh sách người mới, chương trình, buổi, chi tiết hiệp, volume, PR, thể trạng và lỗi dữ liệu.
- [verify_sample_seed_result.cjs](verify_sample_seed_result.cjs): tái chạy đối chiếu chỉ đọc bằng `node Database/verify_sample_seed_result.cjs`. Dùng để đối chiếu ngay sau seed; nếu sau này người dùng sửa dữ liệu qua app thì khác biệt với manifest cần được xem xét, không tự khôi phục.

Không sửa Backend, Frontend, SQL gốc hoặc Stored Procedure.
