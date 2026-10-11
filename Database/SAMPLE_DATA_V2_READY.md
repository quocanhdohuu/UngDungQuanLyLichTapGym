# Bộ dữ liệu mẫu v2 — bản đã được phê duyệt

Đã áp dụng câu trả lời: **50–80 là tổng số buổi**, cân nặng đúng của Minh là **60 kg**. Script: [seed_sample_data_v2.sql](seed_sample_data_v2.sql). Người dùng đã phê duyệt và script đã COMMIT thành công ngày 11/10/2026; xem [kết quả thực thi và kiểm tra chạy lại](SAMPLE_DATA_V2_RESULT.md). Các mục dưới lưu phương án và kiểm tra tại thời điểm chuẩn bị để duyệt.

## Phạm vi và số lượng cụ thể

| Bảng | Dự kiến thêm | Tổng sau khi thêm |
|---|---:|---:|
| Accounts | 30 | 53 |
| GymUsers | 30 | 52 |
| WorkoutPlans | 39 | 57 |
| WorkoutDays | 153 | 226 |
| ExerciseConfigs | 783 | 1.147 |
| GymUserWorkoutPlans | 39 | 50 |
| WorkoutSessions | 506 | 730 |
| PerformedExercises | 2.580 | 3.539 |
| ExerciseSets | 8.377 | 11.485 |
| BodyMetrics | 122 | 203 |

Số lượng dựa trên baseline 11/10/2026. Có **30 GYM_USER mới**, nâng tổng GYM_USER từ 22 lên 52; giữ 1 ADMIN. Không thêm Exercises, Alternatives, Media, thiết bị hoặc nhóm cơ.

39 chương trình là các bản sao cá nhân cần thiết: 30 lịch hiện tại và 9 lịch trước đây. Các template tiêu chuẩn hiện thiếu weekDay, trong khi schema không có lịch tuần riêng theo từng người; vì vậy cần sao chép cấu hình để gán thứ mà vẫn giữ nguyên mẫu dùng chung. Riêng template Upper Lower 4 Days có cấu hình Bench Press 10 hiệp do dữ liệu hiện có; chỉ bản sao mới được giới hạn còn 5 hiệp. Không sửa template gốc.

24 tài khoản ACTIVE, 4 INACTIVE, 2 LOCKED; 15 BEGINNER, 11 INTERMEDIATE, 4 ADVANCED. Quan hệ chương trình mới gồm 24 ACTIVE, 6 COMPLETED, 9 CANCELLED. Toàn bộ buổi mới là COMPLETED; 8 buổi CANCELLED của Minh được giữ nguyên. Mỗi người mới có lịch sử riêng, ngày nghỉ, tuần ít buổi; người dùng lâu có tăng tải, giữ tải và giảm tải. Thời lượng tính từ số hiệp, thời gian nghỉ, vận động và khởi động, trong khoảng 45–100 phút.

## Riêng Minh

- Truy vấn profile qua accountId 28, không hardcode profileId/dayId/planId.
- Giữ nguyên 1 plan ACTIVE và 1 plan COMPLETED đang có.
- Thêm 3 buổi: 02/10 (65 phút), 07/10 (58 phút), 09/10 (68 phút), đều bắt đầu 12:15, khớp lịch Thứ Tư/Sáu. Tổng **51 buổi: 43 COMPLETED, 8 CANCELLED**.
- Thêm 15 bài đã thực hiện, 43 hiệp; tổng tương ứng 214 bài và 592 hiệp. Mức tạ dựa trên các buổi đầy đủ trước đó, có buổi giảm tải ngày 07/10.
- preValue lấy mức tạ của cùng số hiệp ở buổi COMPLETED gần nhất trước thời điểm buổi mới, gồm cả các buổi test đã có. Không viết lại preValue của bản ghi cũ khi bổ sung lịch sử lùi ngày.
- Volume dự kiến tăng 13.260 kg, từ 127.195 lên 140.455 kg; phải đối chiếu getter thật sau thực thi.
- Thêm đo thể trạng ngày 07/10 lúc 07:15: 175 cm / 60,1 kg; ngày 10/10 lúc 07:15: 175 cm / **60 kg**. Tổng **13 bản ghi**. Mục tiêu vẫn là Sức bền.
- Giữ nguyên các bản ghi 64–66 kg cũ theo yêu cầu không sửa dữ liệu. Biểu đồ vẫn có bước nhảy 66 → 60 kg đã tồn tại; seed chỉ nối tiếp mốc 60 kg đã được xác nhận.

## Danh sách 30 người mới

Email = username + @example.test. Mật khẩu thử nghiệm chung: **GymDemoV2@2026!**, phù hợp sp_Login hiện tại. Mật khẩu của Minh không thay đổi.

| Username | Họ tên | Level | Mục tiêu | Buổi/tuần | Trạng thái | Ngày tạo | Buổi đã tập | Số đo |
|---|---|---|---|---:|---|---|---:|---:|
| gym_demo_v2_01 | Nguyễn Đức Anh | BEGINNER | Tăng cơ | 3 | ACTIVE | 2026-10-04 | 3 | 1 |
| gym_demo_v2_02 | Trần Thùy Dương | BEGINNER | Giảm mỡ | 3 | ACTIVE | 2026-10-05 | 3 | 1 |
| gym_demo_v2_03 | Lê Minh Khang | BEGINNER | Tăng sức mạnh | 3 | ACTIVE | 2026-10-06 | 2 | 1 |
| gym_demo_v2_04 | Phạm Ngọc Hân | BEGINNER | Cải thiện sức khỏe | 2 | ACTIVE | 2026-10-07 | 1 | 1 |
| gym_demo_v2_05 | Hoàng Quốc Bảo | BEGINNER | Tăng cơ | 3 | ACTIVE | 2026-10-08 | 0 | 1 |
| gym_demo_v2_06 | Đặng Yến Nhi | BEGINNER | Giảm mỡ | 3 | ACTIVE | 2026-10-09 | 0 | 1 |
| gym_demo_v2_07 | Vũ Thành Đạt | BEGINNER | Tăng sức mạnh | 3 | ACTIVE | 2026-09-19 | 9 | 4 |
| gym_demo_v2_08 | Bùi Khánh Linh | BEGINNER | Cải thiện sức khỏe | 2 | ACTIVE | 2026-09-17 | 6 | 4 |
| gym_demo_v2_09 | Đỗ Quang Huy | BEGINNER | Tăng cơ | 3 | ACTIVE | 2026-09-15 | 11 | 4 |
| gym_demo_v2_10 | Hồ Diệu Trang | BEGINNER | Giảm mỡ | 3 | ACTIVE | 2026-09-13 | 12 | 4 |
| gym_demo_v2_11 | Ngô Tiến Dũng | BEGINNER | Tăng sức mạnh | 3 | ACTIVE | 2026-09-11 | 12 | 4 |
| gym_demo_v2_12 | Dương Bảo Ngọc | BEGINNER | Cải thiện sức khỏe | 2 | INACTIVE | 2026-09-09 | 8 | 4 |
| gym_demo_v2_13 | Lý Gia Hưng | BEGINNER | Tăng cơ | 3 | ACTIVE | 2026-09-07 | 10 | 4 |
| gym_demo_v2_14 | Trịnh Thu Hà | BEGINNER | Giảm mỡ | 3 | ACTIVE | 2026-09-05 | 11 | 4 |
| gym_demo_v2_15 | Đinh Anh Tuấn | BEGINNER | Tăng sức mạnh | 3 | LOCKED | 2026-09-03 | 12 | 4 |
| gym_demo_v2_16 | Mai Phương Thảo | INTERMEDIATE | Cải thiện sức khỏe | 3 | ACTIVE | 2026-09-01 | 13 | 4 |
| gym_demo_v2_17 | Phan Văn Nam | INTERMEDIATE | Tăng cơ | 4 | ACTIVE | 2026-08-30 | 14 | 4 |
| gym_demo_v2_18 | Cao Thanh Trúc | INTERMEDIATE | Giảm mỡ | 5 | INACTIVE | 2026-08-28 | 15 | 4 |
| gym_demo_v2_19 | Tạ Hoàng Long | INTERMEDIATE | Tăng sức mạnh | 6 | ACTIVE | 2026-08-26 | 16 | 4 |
| gym_demo_v2_20 | Lâm Mỹ Duyên | INTERMEDIATE | Cải thiện sức khỏe | 3 | ACTIVE | 2026-08-24 | 17 | 4 |
| gym_demo_v2_21 | Trương Hải Đăng | INTERMEDIATE | Tăng cơ | 4 | ACTIVE | 2026-08-22 | 18 | 4 |
| gym_demo_v2_22 | Nguyễn Hoài An | INTERMEDIATE | Giảm mỡ | 5 | ACTIVE | 2026-06-18 | 37 | 6 |
| gym_demo_v2_23 | Trần Quốc Việt | INTERMEDIATE | Tăng sức mạnh | 6 | ACTIVE | 2026-06-12 | 40 | 6 |
| gym_demo_v2_24 | Lê Quỳnh Chi | INTERMEDIATE | Cải thiện sức khỏe | 3 | INACTIVE | 2026-06-06 | 30 | 6 |
| gym_demo_v2_25 | Phạm Trung Kiên | INTERMEDIATE | Tăng cơ | 4 | ACTIVE | 2026-05-31 | 32 | 6 |
| gym_demo_v2_26 | Hoàng Minh Châu | INTERMEDIATE | Giảm mỡ | 5 | ACTIVE | 2026-05-25 | 39 | 6 |
| gym_demo_v2_27 | Võ Nhật Tân | ADVANCED | Tăng sức mạnh | 4 | ACTIVE | 2026-05-19 | 31 | 6 |
| gym_demo_v2_28 | Bùi Ngọc Mai | ADVANCED | Cải thiện sức khỏe | 6 | ACTIVE | 2026-05-13 | 38 | 6 |
| gym_demo_v2_29 | Đỗ Tuấn Phong | ADVANCED | Tăng cơ | 4 | LOCKED | 2026-05-07 | 26 | 6 |
| gym_demo_v2_30 | Đặng Hà My | ADVANCED | Giảm mỡ | 6 | INACTIVE | 2026-05-01 | 37 | 6 |

Nhóm 01–06: mới đăng ký (0–3 buổi), 07–21: thường xuyên (6–18 buổi), 22–30: lịch sử dài (26–40 buổi). Có nam/nữ xen kẽ, đăng ký từ tháng 5 đến tháng 10/2026. Mọi dữ liệu được cố định đến 2026-10-10 23:59:59 theo UTC+7 để chạy lại không phát sinh ngày mới.

## Kiểm tra và giới hạn

- [validate_sample_seed.cjs](validate_sample_seed.cjs): kiểm tra độc lập khóa tự nhiên, quan hệ, lịch tuần, khoảng tham gia, thời gian, số bài/hiệp, số đo, preValue theo lịch sử và progression. Có ca cố tình làm sai để xác nhận bộ kiểm tra phát hiện lỗi.
- [run_sample_seed.cjs](run_sample_seed.cjs) mặc định hoặc --check: tạo bảng tạm bằng SELECT và chạy **EXPLAIN INSERT**, không thực thi INSERT. MySQL không cho CREATE TEMPORARY TABLE hoặc EXPLAIN INSERT lên bảng thường trong READ ONLY, nên các câu đó chạy ngoài transaction READ ONLY; chỉ tạo bảng tạm của kết nối, không thay đổi schema hay dữ liệu ứng dụng.
- Kết quả: [sample_seed_validation.json](sample_seed_validation.json), [sample_seed_sql_check.json](sample_seed_sql_check.json). EXPLAIN xác minh MySQL phân tích được câu lệnh, không thay thế thử INSERT thật.
- Mô phỏng chạy lại: lần đầu chọn thêm, lần hai chọn bỏ qua toàn bộ; tình trạng dở dang/trùng danh tính bị từ chối. Chưa chạy INSERT lần nào trên MySQL nên chưa tuyên bố đã thử rollback/lặp lại bằng ghi thật.
- Kiểm kê và 6 getter đã được chạy trước seed. [verify_sample_data.sql](verify_sample_data.sql) dùng để đối chiếu sau seed; runner tự thực hiện ngay sau COMMIT, lưu kết quả và số dòng thêm vào sample_seed_applied.json.
- Các lỗi dữ liệu/procedure cũ trong [SAMPLE_DATA_REVIEW.md](SAMPLE_DATA_REVIEW.md) không bị sửa. Getter không lọc isActive, ngày PR có giới hạn như báo cáo; Backend hiện có bổ sung achievedAt khi trả PR.

## Transaction, chống trùng và thực thi sau phê duyệt

- Script dùng transaction SERIALIZABLE, khóa tên cho cả batch, khóa profile và các kiểm tra CHECK trên bảng tạm. Lỗi bất kỳ trước COMMIT khiến runner ROLLBACK và đóng kết nối.
- Kiểm tra SHA-256 nội dung 12 bảng nguồn khi chạy lần đầu. Nếu baseline đổi, dừng để kiểm kê lại; không tiếp tục dùng dữ liệu nguồn cũ. Không xuất mật khẩu thật để tính baseline Accounts.
- Dùng namespace và ngày tạo cố định, kiểm tra tất cả 30 danh tính cùng tồn tại hoặc cùng chưa có; chạy lại đủ batch sẽ thêm 0 dòng. Nếu người dùng xoá/sửa khóa nhận diện, lịch hoặc bản ghi seed, script có thể dừng để kiểm tra thay vì tự dựng lại lịch sử. Thay đổi số đo/mức tạ không bị ghi đè.
- ID tự tăng đều được lấy qua SELECT/JOIN sau INSERT, không gán cứng. Các quan hệ thiếu hoặc mapping nhiều dòng làm CHECK thất bại; không INSERT IGNORE.
- Không DROP, TRUNCATE, DELETE, ALTER hoặc sửa Stored Procedure. SQL và manifest được đối chiếu SHA-256 trước khi runner chạy.
- Kiểm tra không ghi: `node Database/run_sample_seed.cjs --check`.
- **Chỉ sau khi người dùng xác nhận INSERT:** `node Database/run_sample_seed.cjs --apply-approved`. Runner bật cờ phê duyệt trên một kết nối mới, dừng/rollback khi lỗi, báo số dòng chính xác, rồi gọi các SELECT/getter đối chiếu.
- Nếu chạy SQL trực tiếp: dùng kết nối riêng, đặt @seed_authorized=1 chỉ sau phê duyệt và dừng/ROLLBACK ngay khi có lỗi. Không dùng chế độ tiếp tục sau lỗi. Khuyến nghị dùng runner.

SHA-256 script được duyệt: `2f1a935ebae600b71c2ba0fc5d126ad13ca6103e5074f90f0bef0e724eb5af7e`.
