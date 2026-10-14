# Bộ lọc thời gian Dashboard Admin

## Trạng thái và phạm vi

Đã hoàn tất SQL, backend, frontend và kiểm thử ngày 14/10/2026. Sau khi chủ dự án
cho phép chạy SQL và tạo SP hoạt động còn thiếu, đã áp dụng
`Database/dashboard_time_filter.sql`: thay bốn SP và tạo
`sp_GetDashboardWorkoutActivity`. Không sửa bảng, dữ liệu hay SQL gốc.

Đã khởi động lại backend cổng 3000 để nạp code mới và xác nhận cả sáu endpoint
dashboard trả HTTP 200. Frontend mặc định Tháng này; dữ liệu hiện có được giữ
nguyên kèm nhãn kỳ tương ứng khi tải lại/lỗi. Request đang chạy được dùng chung
để tránh gọi trùng, kết quả cũ bị bỏ qua sau khi đổi bộ lọc.

Bản sao định nghĩa SP trước khi cập nhật (chỉ dùng khi cần hoàn tác đồng thời
với backend): `C:/Users/DELL/AppData/Local/Temp/gym-dashboard-sp-backup-1791940565114.sql`.

## 1. Phân tích luồng trước thay đổi

| Thành phần | Vai trò |
| --- | --- |
| `App/FE_GymPlan/Admin/Manage_GymPlan/src/pages/admin/DashboardPage.jsx` | State, fetch 6 endpoint bằng Promise.all khi mount, 5 KPI, biểu đồ CSS, danh sách hoạt động/người dùng/lịch mẫu |
| `src/components/admin/AdminPageHeader.jsx`, `AdminControls.jsx` phía Admin | Header và select theo theme hiện tại; có thể tái sử dụng AdminFilterSelect |
| `src/App.css` phía Admin | Các class dashboard; biểu đồ hiện dùng HTML/CSS, không có thư viện chart |
| `App/BE_GymPlan/src/app.js` | Mount `/api/dashboard` |
| `src/routes/dashboard.route.js` phía backend | 6 GET endpoint |
| `src/controllers/dashboard.controller.js` phía backend | Validate months/limit, gọi model, trả `{ message, data }` |
| `src/models/dashboard.model.js` phía backend | Gọi SP qua mysql2; không có tầng service riêng |
| `src/common/db.js` → `src/config/db.js` phía backend | Pool dùng chung; chưa cấu hình timezone rõ ràng |
| `App/BE_GymPlan/test/admin-procedures.test.js` | Test mock hợp đồng tham số SP, gồm recent-workout-templates; đang đọc chữ ký từ SQL gốc |

| Endpoint | SP hiện được gọi | Hiện trạng |
| --- | --- | --- |
| `/summary` | `sp_GetDashboardSummary()` | Tổng hiện tại; người dùng mới và buổi tập cố định tháng hiện tại |
| `/user-growth?months=6` | `sp_GetDashboardUserGrowth(months)` | Nhóm tháng, chỉ có cận dưới, chưa bù mốc 0 |
| `/exercise-statistics` | `sp_GetDashboardExerciseStatistics()` | Thống kê toàn hệ thống theo độ khó |
| `/workout-activity` | `sp_GetDashboardWorkoutActivity()` | **Không có định nghĩa trong source SQL và database đang kết nối**; model bắt lỗi thiếu SP và trả `[]` |
| `/recent-users?limit=5` | `sp_GetDashboardRecentUsers(limit)` | ORDER BY Accounts.createdAt DESC, LIMIT 5 trên UI |
| `/recent-workout-templates?limit=5` | `sp_GetDashboardRecentWorkoutTemplates(limit)` | ORDER BY WorkoutPlans.createdAt DESC, LIMIT 5 trên UI |

`sp_GetDashboardExercisesByMuscleGroup()` có trong SQL/database nhưng không được
dashboard hiện tại gọi; giữ nguyên. Hai SP thống kê bài tập đều không cần sửa.

Các điểm frontend cần xử lý ở giai đoạn 4: effect hiện chỉ chạy lúc mount;
loading/error thay toàn bộ dashboard bằng thông báo; nhãn chart chỉ lấy phần
đầu chuỗi tháng; cột giá trị 0 vẫn có chiều cao tối thiểu 10px. Cần giữ dữ liệu
cũ khi tải/lỗi, gắn nhãn đúng kỳ đang hiển thị, bỏ qua phản hồi lỗi thời và cho
mốc 0 hiển thị đúng giá trị. Giữ các component, màu sắc và điều hướng hiện có.

## 2. Ý nghĩa thống kê và khả năng lọc (đã triển khai)

| Chỉ số | Cách xử lý đề xuất |
| --- | --- |
| Tổng người dùng | Giữ `COUNT(*) FROM GymUsers`, ghi rõ “Toàn hệ thống”; không đổi thành số đăng ký trong kỳ |
| Tổng bài tập | Giữ tổng hiện tại; `Exercises` không có createdAt, kể cả schema thực tế |
| Lịch tập mẫu | Lọc WorkoutPlans.createdAt và isTemplate=TRUE; nhãn “Lịch tập mẫu tạo trong kỳ” (ALL: toàn thời gian) |
| Người dùng mới | Accounts.createdAt, INNER JOIN GymUsers như cũ, bổ sung role='GYM_USER' theo yêu cầu; nhãn theo kỳ |
| Buổi tập | WorkoutSessions.startTime; giữ **tất cả trạng thái** như summary hiện tại; nhãn “Buổi tập trong kỳ” |
| Tăng trưởng người dùng | Cùng điều kiện người dùng mới; nhóm DAY hoặc MONTH; tăng dần; backend bù mốc thiếu bằng 0 |
| Độ khó / nhóm cơ bài tập | Không thể lọc lịch sử chính xác; giữ toàn hệ thống, không thêm cột hay giả lập lịch sử |
| Người dùng mới / lịch mẫu gần đây | Lọc ngày tạo trước ORDER BY và LIMIT; giữ trường dữ liệu, thứ tự và giới hạn hiện tại |
| Hoạt động tập luyện | SP đã được bổ sung sau khi được duyệt; lọc startTime, nhóm ngày và giữ mọi trạng thái |

`GymUsers.accountId` là UNIQUE, nên JOIN với Accounts không nhân bản người dùng.
Lịch mẫu vẫn giữ `COUNT(DISTINCT wd.dayId)` và `COUNT(ec.configId)`.
Buổi tập đếm trực tiếp bảng WorkoutSessions, không join performed exercises.
Không tự thêm điều kiện chỉ lấy ACTIVE/COMPLETED.

Dữ liệu đã xóa không còn trong các bảng hiện tại; thống kê theo ngày tạo phản
ánh các bản ghi còn tồn tại, không thể khôi phục lịch sử đã xóa. Trạng thái tài
khoản, level và nội dung lịch mẫu trong danh sách vẫn là giá trị hiện tại.

## 3. Quy ước ngày và API

- Mặc định THIS_MONTH. TODAY là hôm nay; LAST_7_DAYS/LAST_30_DAYS bao gồm hôm nay
  và 6/29 ngày trước; THIS_MONTH và THIS_YEAR là trọn tháng/năm lịch hiện tại.
- CUSTOM chỉ gửi request sau nút Áp dụng và validate đủ hai ngày.
- API nhận `range`, và `startDate/endDate` định dạng YYYY-MM-DD cho CUSTOM.
  Backend là nơi resolve preset, validate ngày có thật và thứ tự ngày; dùng cùng
  hàm cho mọi endpoint hỗ trợ lọc. ALL ánh xạ thành hai tham số NULL.
- SQL nhận DATE; `>= p_startDate AND < DATE_ADD(p_endDate, INTERVAL 1 DAY)`.
  Khi có ngày thì phải đủ cả hai; giới hạn DATE từ 1000-01-01 tới 9999-12-30
  để cận cuối loại trừ còn biểu diễn được. Ngày bắt đầu bằng ngày kết thúc hợp lệ.
- UTC+7 / Asia/Ho_Chi_Minh: kiểm tra chỉ đọc cho thấy MySQL 8.0.46,
  session/global timezone SYSTEM, system timezone SE Asia Standard Time và
  chênh NOW() với UTC_TIMESTAMP() đúng 420 phút. Các cột liên quan là DATETIME.
  Đây là bằng chứng cấu hình hiện tại, không chứng minh nguồn mọi bản ghi lịch sử.
- Backend tính ngày lịch UTC+7, truyền chuỗi ngày vào SP, tránh round-trip
  `new Date('YYYY-MM-DD').toISOString()`. Không đổi timezone chung của pool
  hoặc đổi dữ liệu đã lưu chỉ để thêm bộ lọc. Các phép so sánh DATETIME với
  ngày truyền vào không cần dựa vào CURRENT_DATE() của session.
- Khoảng <=31 ngày nhóm DAY; dài hơn nhóm MONTH; ALL nhóm MONTH. Giữ field
  monthKey/monthLabel/totalUsers để giảm thay đổi hợp đồng hiện tại. Trong chế
  độ DAY, key là YYYY-MM-DD và label là DD/MM/YYYY; UI dùng nhãn đầy đủ.
- Backend tạo các mốc 0 trong phạm vi đã chọn. Với ALL, từ tháng đăng ký đầu
  tiên tới tháng lớn hơn giữa hiện tại và dữ liệu cuối cùng; không có bản ghi
  thì một mốc tháng hiện tại bằng 0. SQL chỉ trả các nhóm có dữ liệu thật.
- Giữ wrapper `{ message, data }` và tên KPI newUsersThisMonth /
  workoutSessionsThisMonth để tương thích field; ý nghĩa mới là kỳ đã chọn,
  cần ghi rõ trong nhãn UI. Trường totalWorkoutTemplates là số tạo trong kỳ.
- Bổ sung `period: { range, startDate, endDate, groupBy, timeZone }` cạnh data.
  Frontend dùng period của dữ liệu đã tải thành công để hiển thị nhãn; không
  gắn nhãn kỳ mới lên số liệu kỳ cũ khi lỗi. Các endpoint không có bộ lọc mặc
  định THIS_MONTH; user-growth vẫn nhận `months=N` cũ nếu không truyền range.
- Ví dụ: `/api/dashboard/summary?range=LAST_7_DAYS`,
  `/api/dashboard/user-growth?range=CUSTOM&startDate=2026-10-01&endDate=2026-10-14`,
  `/api/dashboard/recent-users?range=ALL&limit=5`.

## 4. Script SQL chính

Tệp hoàn chỉnh: `Database/dashboard_time_filter.sql`.

| SP sửa | Chữ ký mới |
| --- | --- |
| sp_GetDashboardSummary | `(p_startDate DATE, p_endDate DATE)` |
| sp_GetDashboardUserGrowth | `(p_startDate DATE, p_endDate DATE, p_groupBy VARCHAR(5))` |
| sp_GetDashboardRecentUsers | `(p_limit INT, p_startDate DATE, p_endDate DATE)` |
| sp_GetDashboardRecentWorkoutTemplates | `(p_limit INT, p_startDate DATE, p_endDate DATE)` |

Chỉ DROP/CREATE bốn procedure này và CREATE SP hoạt động mới được duyệt,
không ALTER/DROP TABLE, không ghi/xóa dữ liệu.
Giữ nguyên default limit=5 khi NULL hoặc <=0 trong SP. Kiểm tra ngày lặp lại
trong từng SP để không tạo thêm routine chỉ phục vụ validation.

**Chữ ký CALL thay đổi:** triển khai SQL và backend mới cùng nhau, khởi động lại
backend nếu không chạy chế độ watch. Không chạy lại toàn bộ MySQL_GymPlan.sql.
Script tạo activity không DROP procedure này; nếu đã chạy thành công thì không
cần chạy lại script. Đã xác nhận biên dịch SP và kiểm tra nhánh SIGNAL trên MySQL.

## 5. Hoạt động tập luyện — đã được duyệt và triển khai

Không có quy tắc trạng thái cũ của SP hoạt động để giữ nguyên vì routine chưa
tồn tại. Đã tạo đúng tên endpoint đã gọi, đếm tất cả trạng thái như summary,
nhóm theo ngày, `COUNT(*)` cho buổi tập, `COUNT(DISTINCT profileId)` cho người dùng.
Đã đưa phần này vào script chính sau khi chủ dự án cho phép rõ ràng.

SQL dưới đây đã có trong script chính; không cần chạy thêm lần nữa.

```sql
USE QuanLyLichTapGym;
DELIMITER $$
CREATE PROCEDURE sp_GetDashboardWorkoutActivity(
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE v_endExclusive DATETIME;
    IF (p_startDate IS NULL) <> (p_endDate IS NULL) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Both dates are required, or both NULL for ALL';
    END IF;
    IF p_startDate IS NOT NULL AND (
        p_startDate < '1000-01-01' OR p_endDate > '9999-12-30'
        OR MONTH(p_startDate) = 0 OR DAY(p_startDate) = 0
        OR MONTH(p_endDate) = 0 OR DAY(p_endDate) = 0
        OR LAST_DAY(p_startDate) IS NULL OR LAST_DAY(p_endDate) IS NULL
        OR DAY(p_startDate) > DAY(LAST_DAY(p_startDate))
        OR DAY(p_endDate) > DAY(LAST_DAY(p_endDate))
        OR p_startDate > p_endDate
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid date range';
    END IF;
    SET v_endExclusive = DATE_ADD(p_endDate, INTERVAL 1 DAY);
    SELECT DATE_FORMAT(ws.startTime, '%Y-%m-%d') AS date,
           COUNT(*) AS totalSessions,
           COUNT(DISTINCT ws.profileId) AS activeUsers
    FROM WorkoutSessions ws
    WHERE (p_startDate IS NULL OR ws.startTime >= p_startDate)
      AND (v_endExclusive IS NULL OR ws.startTime < v_endExclusive)
    GROUP BY DATE_FORMAT(ws.startTime, '%Y-%m-%d')
    ORDER BY date ASC;
END$$
DELIMITER ;
```

## 6. File đã cập nhật

- Backend: `src/controllers/dashboard.controller.js`, `src/models/dashboard.model.js`;
  thêm `src/utils/dashboardDateRange.js` để resolve/validate ngày và bù mốc chart.
  Giữ routes và cấu trúc controller/model hiện tại.
- Frontend Admin: `src/pages/admin/DashboardPage.jsx`, `src/App.css`;
  thêm `src/components/admin/AdminDateRangeFilter.jsx`, tái sử dụng AdminFilterSelect.
  Tách state ngày đang nhập và bộ lọc đã áp dụng; quản lý request đang chạy theo
  bộ lọc, tránh kết quả cũ ghi đè kết quả mới và tránh fetch lại thống kê bài tập.
- Test: cập nhật phần dashboard trong `test/admin-procedures.test.js` để đọc
  chữ ký script mới; thêm `test/dashboard-date-range.test.js` cho validate,
  preset, UTC+7, mốc 0, bộ lọc và phản hồi API. Giữ các test khác.
- Thêm `test/dashboard-time-filter.ui.js`: kiểm tra trình duyệt với API thật,
  chỉ đọc dữ liệu; mô phỏng lỗi mạng và phản hồi trễ ở lớp trình duyệt.

## 7. Kiểm tra đã thực hiện trong giai đoạn 2

Đã trích riêng phần SELECT của cả bốn SP trong script và chạy **chỉ đọc**
trên MySQL đang kết nối, thay tham số bằng giá trị ngày cụ thể. Cả 9 trường hợp
đều đạt: TODAY, LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, THIS_YEAR, CUSTOM,
ngày nhuận không có dữ liệu, một ngày có dữ liệu và ALL.

Đã đối chiếu KPI với truy vấn độc lập dùng DATE/BETWEEN, tổng growth với KPI
người dùng mới, thứ tự growth và số lượng bản ghi top 5. Một CTE SELECT dùng
bốn thời điểm biên xác nhận nhận đầu ngày/cuối ngày tới microsecond và loại
ngày trước/đầu ngày kế tiếp. Dữ liệu biên chỉ tồn tại trong truy vấn SELECT,
không ghi vào bảng ứng dụng và không dùng làm số liệu dashboard.

Các kiểm tra trên thực hiện trước khi được phép cập nhật SQL. Sau khi được
duyệt đã kiểm tra thêm kết quả cuối cùng dưới đây. Không chạy bộ test tích hợp
có khả năng ghi dữ liệu ứng dụng.

## 8. Kiểm thử giai đoạn 5

Kết quả:

- `node --test test/dashboard-date-range.test.js test/admin-procedures.test.js`:
  28/28 đạt, dùng mock database cho kiểm thử hợp đồng API.
- API + SP thật: đối chiếu độc lập 8 khoảng thời gian, tổng growth = người dùng
  mới, tổng hoạt động = số buổi tập, distinct profile từng ngày, top 5 và các KPI.
  Sáu trường hợp tham số SP không hợp lệ đều trả SIGNAL 45000.
- `npm.cmd run build` và `npm.cmd run lint` ở frontend: đạt. Build có thông báo
  bundle lớn hơn 500 kB; không thay cơ chế chia bundle ngoài phạm vi bộ lọc.
- Edge/Playwright: đủ 7 lựa chọn, default THIS_MONTH, ngày nháp không gọi API,
  ngày đảo/thừa thiếu, CUSTOM rỗng dữ liệu, cột 0px, không fetch trùng ở StrictMode,
  thống kê toàn hệ thống giữ nguyên, giữ dữ liệu khi lỗi, thử lại, bỏ phản hồi cũ.
- Giao diện kiểm tra ở 1440px và chiều rộng tối thiểu 760px hiện có của Admin.
  Không sửa min-width chung/sidebar/header để mở rộng sang mobile.
- Cả sáu endpoint trên backend đang chạy ở cổng 3000 trả HTTP 200 sau restart.

Chạy lại kiểm thử trình duyệt: khởi động frontend ở cổng 5175, sau đó từ backend
chạy `node test/dashboard-time-filter.ui.js`. Có thể đặt `GYM_ADMIN_URL` để đổi
URL, `PLAYWRIGHT_MODULE` để trỏ tới Playwright đã có trong máy. Không cài thêm
dependency vào dự án để chạy kiểm tra này. Test khởi tạo router backend tại
cổng ngẫu nhiên, dùng SELECT/CALL chỉ đọc; không tạo tài khoản hay dữ liệu mẫu.

Các tình huống kiểm tra:

- Cả 7 lựa chọn, default THIS_MONTH; 7/30 ngày đi qua đầu tháng/năm; năm nhuận.
- CUSTOM thiếu ngày, ngày không tồn tại, đảo ngày, một ngày, ngoài miền DATE.
- Đúng đầu ngày, cuối ngày có phần giây lẻ, đúng 00:00 ngày kế tiếp bị loại.
- Không có bản ghi: KPI=0, mốc growth=0, danh sách rỗng; tổng toàn hệ thống giữ nguyên.
- Loại ADMIN khỏi đăng ký mới; tổng growth bằng KPI người dùng mới cùng kỳ.
- Giữ mọi trạng thái buổi tập; tổng hoạt động bằng KPI buổi tập, distinct profile.
- Đổi nhanh bộ lọc, lỗi mạng, reload, CUSTOM chưa áp dụng: không nhảy dữ liệu,
  không hiển thị dữ liệu kỳ cũ dưới nhãn kỳ mới, không gọi API vì đổi ngày nháp.
- Kiểm tra top 5/thứ tự/điều hướng, build/lint frontend và test backend liên quan.
