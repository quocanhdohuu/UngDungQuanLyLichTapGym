# Kết nối dữ liệu User GYMFORLIFE

## Cấu trúc

- Backend dùng lại Express route → controller → model → MySQL pool hiện tại.
- `src/models/user.model.js` gọi bảy Stored Procedure User; `getActivePlan` dùng lại `Workoutplans.getDetail` để lấy `days[].exercises[]`.
- Frontend dùng lại `src/auth-session.ts`, mở rộng bằng subscription React; không tạo AuthContext song song. Phiên được giữ trong bộ nhớ như trước, gồm `accountId`, `profileId`, `loginSessionId`, `accessToken` và thông tin hồ sơ. Đóng ứng dụng/tải lại trang cần đăng nhập lại.
- `src/services/api.ts` quản lý URL, timeout, lỗi HTTP và Authorization. `src/services/user-api.ts` khai báo kiểu dữ liệu và các lời gọi API.
- `src/hooks/use-api-data.ts` tải khi màn hình được focus, hủy request cũ khi đổi filter/phiên hoặc rời màn hình, hỗ trợ refresh. Không dùng dữ liệu mẫu khi request thất bại.

## Endpoint và màn hình sử dụng

Các endpoint `/api/user` bên dưới đều yêu cầu `Authorization: Bearer <accessToken>` nhận từ `POST /auth/login`. Backend kiểm tra chữ ký, phiên còn ACTIVE/chưa hết hạn, trạng thái tài khoản/hồ sơ và quyền sở hữu ID trên URL. Các route Admin hiện có không thay đổi.

| Method / Endpoint | Nguồn dữ liệu | Màn hình |
| --- | --- | --- |
| GET `/api/user/profile/:accountId` | `sp_GetMyProfile` | Trang chủ, Cá nhân |
| PUT `/api/user/profile/:profileId` | `sp_UpdateMyProfile`, đọc lại `sp_GetMyProfile` | Cá nhân |
| GET `/api/user/:profileId/active-plan` | `sp_GetUserActivePlan` + model chi tiết lịch hiện có | Trang chủ, Lịch tập |
| GET `/api/user/:profileId/today-workout` | `sp_GetTodayWorkout` | Trang chủ, Lịch tập |
| GET `/api/user/:profileId/progress-summary` | `sp_GetUserProgressSummary` | Trang chủ, Tiến trình |
| GET `/api/user/:profileId/personal-records` | `sp_GetUserPersonalRecords` | Trang chủ, Tiến trình |
| GET `/api/user/:profileId/workout-history?period=ALL` | `sp_GetUserWorkoutHistory`, chấp nhận `ALL`, `WEEK`, `MONTH` | Trang chủ dùng WEEK; Tiến trình theo filter |
| GET `/api/user/:profileId/workout-history/:workoutSessionId` | WorkoutSessions, PerformedExercises, Exercises, ExerciseSets; giới hạn theo profile | Chi tiết lịch sử trên Tiến trình |
| GET `/api/exercises/summary` **(API có sẵn)** | `sp_GetAllExercises` | Thư viện |

API User trả `{ "data": ... }`. Không có lịch ACTIVE hoặc không có buổi hôm nay trả `{ "data": null }`; danh sách trống trả `{ "data": [] }`. Lỗi trả HTTP 400/401/403/404/500 và `{ "message": "..." }`, không chuyển lỗi database thành dữ liệu rỗng. API thư viện hiện có trả mảng trực tiếp; service đã hỗ trợ định dạng này.

## Cập nhật hồ sơ

Body PUT:

```json
{
  "fullName": "Họ tên người dùng",
  "gender": "MALE",
  "level": "INTERMEDIATE",
  "goal": "Tăng cơ",
  "sessionsPerWeek": 4,
  "height": 175,
  "weight": 67.5
}
```

`gender` nhận `MALE/FEMALE/OTHER/null`; `level` nhận `BEGINNER/INTERMEDIATE/ADVANCED`; số buổi là số nguyên 1–7 hoặc null; height/weight là số dương không quá 999.99 hoặc null. Các giá trị null thể hiện chưa nhập, không thay bằng chỉ số mặc định. `fullName` và chỉ số cơ thể sửa trực tiếp trong vị trí hiển thị hiện có; chạm nhãn giới tính để đổi. Sau khi lưu, cập nhật phiên và tải lại hồ sơ từ server. Các màn hình khác lấy lại dữ liệu khi quay về.

## Ý nghĩa số liệu

- Trang chủ: số buổi tuần từ lịch ACTIVE (hoặc lịch sử WEEK khi chưa có lịch); volume tuần là tổng `totalVolume` từ lịch sử WEEK chia 1000. PR hiển thị thành tích cao nhất từ API, không giả định đó là PR mới trong tuần.
- Lịch tập: hiển thị tất cả ngày/bài của lịch ACTIVE. Nhãn “Hôm nay” đối chiếu `dayId` từ API hôm nay, không phụ thuộc ngày đang mở rộng.
- Tiến trình: ba chỉ số tổng quan là toàn bộ lịch sử; filter chỉ thay đổi danh sách lịch sử. Volume tổng quan dùng `totalVolumeTon`; lịch sử đổi kg sang tấn. Thời lượng phút tính từ `startTime/endTime`, không suy đoán đơn vị `totalDuration` chưa được schema mô tả.
- PR `latestWorkout` là lần tập gần nhất theo Stored Procedure, không phải ngày đạt PR.
- Thư viện: số lượng, nhóm cơ, thiết bị, độ khó, ảnh lấy từ API; tìm kiếm và filter chạy trên danh sách thật. Không hiển thị kcal/sets giả vì thư viện chưa cung cấp các trường này.
- Dữ liệu rỗng có thông báo; lỗi có nút “Thử lại”; màn hình hỗ trợ kéo để refresh. StyleSheet và cấu trúc navigation được giữ lại.

## Chạy và kiểm tra

1. Chạy Backend với cấu hình MySQL hiện tại. Database cần đủ bảy procedure đã có trong `Database/MySQL_GymPlan.sql` và các cột `durationWeeks`, `startedAt`, `weekDay`, `WorkoutSessions.dayId`.
2. Frontend có thể đặt `EXPO_PUBLIC_API_URL=http://<IP-máy-backend>:3000`. Nếu chưa đặt, dùng hostname web hoặc địa chỉ mobile đang có trong source. Khởi động lại Expo sau khi đổi biến môi trường.
3. Đăng nhập lại sau khi cập nhật Backend/Frontend để nhận `accessToken`. Backend dùng khóa ký ngẫu nhiên trong mỗi lần chạy nếu chưa đặt `USER_SESSION_SECRET`; có thể đặt biến này bằng chuỗi bí mật ngẫu nhiên dùng chung khi chạy nhiều instance. Phiên hết hạn/đăng xuất được kiểm tra lại qua LoginSessions ở mỗi request.

Kiểm tra Backend (thư mục `App/BE_GymPlan`):

```sh
node --test --test-isolation=none test/user-api.test.js
```

Kiểm tra Frontend (thư mục `App/FE_GymPlan/Client_GymUser/GymPlan`):

```sh
node node_modules/typescript/bin/tsc --noEmit
node node_modules/expo/bin/cli export --platform web
```

Các test dùng mock database cho payload cập nhật, dữ liệu có lịch/hiệp, dữ liệu rỗng, lỗi, filter, nhiều result set và phân quyền; không thêm fixture vào database ứng dụng. Kiểm tra MySQL trực tiếp chỉ đọc dữ liệu. Luồng ghi hồ sơ trên thiết bị thật cần kiểm tra với tài khoản của người dùng.
