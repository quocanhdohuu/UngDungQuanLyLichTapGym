/**
 * TEST PHASE 6: TOÀN DIỆN HỆ THỐNG GỢI Ý LỊCH TẬP VÀ MỤC TIÊU (E2E)
 * Kiểm thử toàn bộ 8 kịch bản theo yêu cầu nghiệp vụ:
 * 1. User BEGINNER, Giảm mỡ, 3 ngày/tuần
 * 2. User INTERMEDIATE, Tăng cơ, 4 ngày/tuần
 * 3. User ADVANCED, Tăng sức mạnh, 4 ngày/tuần
 * 4. User chưa cập nhật mục tiêu (PROFILE_INCOMPLETE)
 * 5. User đã có lịch tập active (HAS_ACTIVE_PLAN)
 * 6. Ràng buộc an toàn: Không gợi ý ADVANCED cho BEGINNER, loại chênh lệch >= 3 buổi, ngưỡng điểm >= 50, max 3
 * 7. Admin Web: Tạo và sửa lịch tập mẫu kèm goal, truy vấn templates
 * 8. Mobile Flow: Áp dụng lịch tập (apply-plan), chuyển đổi trạng thái sang ACTIVE, khôi phục nguyên trạng DB
 */

const assert = require("node:assert/strict");
const app = require("../src/app");
const db = require("../src/common/db");
const { issueToken } = require("../src/services/userSessionService");

let passed = 0;
let failed = 0;

function testPass(name) {
  console.log(`  [PASS] ${name}`);
  passed++;
}

function testFail(name, err) {
  console.error(`  [FAIL] ${name}:`, err);
  failed++;
}

async function main() {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log("=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 6: TOÀN DIỆN E2E ===");

  try {
    // -------------------------------------------------------------------------
    // KỊCH BẢN 1: User BEGINNER, mục tiêu Giảm mỡ, tập 3 ngày/tuần
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 1: User BEGINNER, Giảm mỡ, 3 ngày/tuần ---");
    // Sử dụng user 4 (Đỗ Văn Vinh, BEGINNER, Giảm mỡ, 3 ngày/tuần, chưa có lịch)
    const [u4Rows] = await db.promise().query(
      "SELECT gu.profileId, gu.accountId, gu.level, gu.goal, gu.sessionsPerWeek FROM GymUsers gu WHERE gu.profileId = 4"
    );
    const u4 = u4Rows[0];
    assert.equal(u4.level, "BEGINNER");

    const [u4Active] = await db.promise().query(
      "SELECT planId FROM GymUserWorkoutPlans WHERE profileId = 4 AND status = 'ACTIVE'"
    );
    assert.equal(u4Active.length, 0, "User 4 ban đầu không có active plan");

    const [s4Res] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [u4.accountId]
    );
    const token4 = issueToken({
      accountId: u4.accountId,
      profileId: u4.profileId,
      loginSessionId: s4Res.insertId,
    });

    const res1 = await fetch(`${baseUrl}/api/user/4/recommendations`, {
      headers: { Authorization: `Bearer ${token4}` },
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.data?.status, "SUCCESS");
    const plans1 = data1.data?.plans;
    assert(Array.isArray(plans1) && plans1.length > 0);
    console.log(`    Gợi ý cho User 1:`);
    plans1.forEach((p, idx) => console.log(`      ${idx + 1}. [${p.matchScore} điểm] ${p.title} (${p.level}, ${p.goal}, ${p.totalDays} ngày) - Lý do: ${p.recommendReason}`));

    // Điểm số của giáo án số 1 phải cao nhất (100đ cho Push Pull Legs 3 Days - planId: 4)
    assert.equal(plans1[0].planId, 4);
    assert.equal(plans1[0].matchScore, 100);
    // Beginner Full Body 3 Days cũng phải có mặt với điểm cao (85đ)
    assert(plans1.some(p => p.planId === 1 && p.matchScore >= 80));
    // Không có bất kỳ giáo án ADVANCED nào
    assert(!plans1.some(p => p.level === "ADVANCED"));
    testPass("Kịch bản 1: Đề xuất chính xác Push Pull Legs 3 Days (100đ) & Beginner Full Body 3 Days (85đ)");

    // -------------------------------------------------------------------------
    // KỊCH BẢN 2: User INTERMEDIATE, mục tiêu Tăng cơ, tập 4 ngày/tuần
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 2: User INTERMEDIATE, Tăng cơ, tập 4 ngày/tuần ---");
    const [acc2] = await db.promise().query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_e2e_user2', 'user2@e2e.test', '123456', 'GYM_USER')"
    );
    const [prof2] = await db.promise().query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'User Intermediate Muscle', 'INTERMEDIATE', 'Tăng cơ', 4)",
      [acc2.insertId]
    );
    const [s2Res] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [acc2.insertId]
    );
    const token2 = issueToken({
      accountId: acc2.insertId,
      profileId: prof2.insertId,
      loginSessionId: s2Res.insertId,
    });

    const res2 = await fetch(`${baseUrl}/api/user/${prof2.insertId}/recommendations`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.data?.status, "SUCCESS");
    const plans2 = data2.data?.plans;
    console.log(`    Gợi ý cho User 2:`);
    plans2.forEach((p, idx) => console.log(`      ${idx + 1}. [${p.matchScore} điểm] ${p.title} (${p.level}, ${p.goal}, ${p.totalDays} ngày) - Lý do: ${p.recommendReason}`));

    // Giáo án top 1 phải là Upper Lower 4 Days (Plan 2: INTERMEDIATE, MUSCLE_GAIN, 4 days) đạt 100đ
    assert.equal(plans2[0].planId, 2);
    assert.equal(plans2[0].matchScore, 100);
    testPass("Kịch bản 2: Đề xuất hoàn hảo Upper Lower 4 Days (100đ, Trùng khớp toàn diện)");

    // -------------------------------------------------------------------------
    // KỊCH BẢN 3: User ADVANCED, mục tiêu Tăng sức mạnh, tập 4 ngày/tuần
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 3: User ADVANCED, Tăng sức mạnh, tập 4 ngày/tuần ---");
    const [acc3] = await db.promise().query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_e2e_user3', 'user3@e2e.test', '123456', 'GYM_USER')"
    );
    const [prof3] = await db.promise().query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'User Advanced Strength', 'ADVANCED', 'Tăng sức mạnh', 4)",
      [acc3.insertId]
    );
    const [s3Res] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [acc3.insertId]
    );
    const token3 = issueToken({
      accountId: acc3.insertId,
      profileId: prof3.insertId,
      loginSessionId: s3Res.insertId,
    });

    const res3 = await fetch(`${baseUrl}/api/user/${prof3.insertId}/recommendations`, {
      headers: { Authorization: `Bearer ${token3}` },
    });
    assert.equal(res3.status, 200);
    const data3 = await res3.json();
    assert.equal(data3.data?.status, "SUCCESS");
    const plans3 = data3.data?.plans;
    console.log(`    Gợi ý cho User 3:`);
    plans3.forEach((p, idx) => console.log(`      ${idx + 1}. [${p.matchScore} điểm] ${p.title} (${p.level}, ${p.goal}, ${p.totalDays} ngày) - Lý do: ${p.recommendReason}`));

    // Giáo án top 1 phải là PHUL 4 Days (Plan 5: ADVANCED, STRENGTH, 4 days) đạt 100đ
    assert.equal(plans3[0].planId, 5);
    assert.equal(plans3[0].matchScore, 100);
    testPass("Kịch bản 3: Đề xuất hoàn hảo PHUL 4 Days (100đ, ADVANCED, Tăng sức mạnh)");

    // -------------------------------------------------------------------------
    // KỊCH BẢN 4: User chưa cập nhật mục tiêu (PROFILE_INCOMPLETE)
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 4: User chưa cập nhật mục tiêu ---");
    const [acc4Inc] = await db.promise().query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_e2e_user4', 'user4@e2e.test', '123456', 'GYM_USER')"
    );
    const [prof4Inc] = await db.promise().query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'User Missing Goal', 'BEGINNER', NULL, 3)",
      [acc4Inc.insertId]
    );
    const [s4IncRes] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [acc4Inc.insertId]
    );
    const token4Inc = issueToken({
      accountId: acc4Inc.insertId,
      profileId: prof4Inc.insertId,
      loginSessionId: s4IncRes.insertId,
    });

    const res4Inc = await fetch(`${baseUrl}/api/user/${prof4Inc.insertId}/recommendations`, {
      headers: { Authorization: `Bearer ${token4Inc}` },
    });
    assert.equal(res4Inc.status, 200);
    const data4Inc = await res4Inc.json();
    assert.equal(data4Inc.data?.status, "PROFILE_INCOMPLETE");
    assert.equal(data4Inc.data?.plans?.length, 0);
    testPass("Kịch bản 4: Trả về trạng thái PROFILE_INCOMPLETE khi người dùng thiếu mục tiêu");

    // -------------------------------------------------------------------------
    // KỊCH BẢN 5: User đã có lịch tập ACTIVE (HAS_ACTIVE_PLAN)
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 5: User đã có lịch tập ACTIVE ---");
    const [u27Active] = await db.promise().query(
      "SELECT planId FROM GymUserWorkoutPlans WHERE profileId = 27 AND status = 'ACTIVE'"
    );
    assert(u27Active.length > 0, "User 27 phải có active plan trong DB");

    const [u27Acc] = await db.promise().query(
      "SELECT accountId FROM GymUsers WHERE profileId = 27"
    );
    const [s27Res] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [u27Acc[0].accountId]
    );
    const token27 = issueToken({
      accountId: u27Acc[0].accountId,
      profileId: 27,
      loginSessionId: s27Res.insertId,
    });

    const res27 = await fetch(`${baseUrl}/api/user/27/recommendations`, {
      headers: { Authorization: `Bearer ${token27}` },
    });
    assert.equal(res27.status, 200);
    const data27 = await res27.json();
    assert.equal(data27.data?.status, "HAS_ACTIVE_PLAN");
    assert.equal(data27.data?.plans?.length, 0);
    testPass("Kịch bản 5: Nhận diện chính xác HAS_ACTIVE_PLAN, không đè giao diện lịch hiện tại");

    // -------------------------------------------------------------------------
    // KỊCH BẢN 6: Ràng buộc an toàn & Thuật toán chấm điểm
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 6: Kiểm tra các ràng buộc an toàn ---");
    // 6.1. BEGINNER tuyệt đối không nhận lịch ADVANCED
    // Tạo user BEGINNER có goal = 'STRENGTH' và sessions = 4 (trùng khớp Plan 5 PHUL 4 Days)
    const [accBegStr] = await db.promise().query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_beg_str', 'beg_str@e2e.test', '123456', 'GYM_USER')"
    );
    const [profBegStr] = await db.promise().query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'Beginner Strength', 'BEGINNER', 'Tăng sức mạnh', 4)",
      [accBegStr.insertId]
    );
    const [sBegStr] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [accBegStr.insertId]
    );
    const tokenBegStr = issueToken({
      accountId: accBegStr.insertId,
      profileId: profBegStr.insertId,
      loginSessionId: sBegStr.insertId,
    });

    const resBegStr = await fetch(`${baseUrl}/api/user/${profBegStr.insertId}/recommendations`, {
      headers: { Authorization: `Bearer ${tokenBegStr}` },
    });
    const dataBegStr = await resBegStr.json();
    const plansBegStr = dataBegStr.data?.plans || [];
    // Plan 5 (PHUL 4 Days) là ADVANCED -> Bắt buộc KHÔNG được xuất hiện
    assert(!plansBegStr.some(p => p.planId === 5 || p.level === "ADVANCED"));
    testPass("Ràng buộc 1: BEGINNER tuyệt đối không bao giờ nhận giáo án ADVANCED");

    // 6.2. Không gợi ý lịch tập chênh lệch >= 3 buổi
    // User muốn tập 6 buổi/tuần -> Các lịch 3 buổi (|6 - 3| = 3) phải bị loại bỏ hoàn toàn
    await db.promise().query("UPDATE GymUsers SET sessionsPerWeek = 6 WHERE profileId = ?", [profBegStr.insertId]);
    const res6Days = await fetch(`${baseUrl}/api/user/${profBegStr.insertId}/recommendations`, {
      headers: { Authorization: `Bearer ${tokenBegStr}` },
    });
    const data6Days = await res6Days.json();
    const plans6Days = data6Days.data?.plans || [];
    assert(!plans6Days.some(p => Math.abs(p.totalDays - 6) >= 3));
    testPass("Ràng buộc 2: Loại bỏ hoàn toàn giáo án chênh lệch >= 3 buổi/tuần");

    // 6.3. Giới hạn tối đa 3 gợi ý và điểm sàn >= 50
    assert(plans1.length <= 3);
    assert(plans2.length <= 3);
    assert(plans3.length <= 3);
    assert(plans1.every(p => p.matchScore >= 50));
    assert(plans2.every(p => p.matchScore >= 50));
    assert(plans3.every(p => p.matchScore >= 50));
    testPass("Ràng buộc 3 & 4: Danh sách gợi ý luôn tối đa 3 giáo án và matchScore >= 50");

    // 6.4. Chỉ gợi ý giáo án mẫu (isTemplate = 1)
    assert(plans1.every(p => p.planId !== undefined));
    const [nonTemplates] = await db.promise().query("SELECT planId FROM WorkoutPlans WHERE isTemplate = 0");
    const nonTemplateIds = new Set(nonTemplates.map(r => r.planId));
    assert(!plans1.some(p => nonTemplateIds.has(p.planId)));
    assert(!plans2.some(p => nonTemplateIds.has(p.planId)));
    assert(!plans3.some(p => nonTemplateIds.has(p.planId)));
    testPass("Ràng buộc 5: Chỉ gợi ý các giáo án mẫu chính thức (isTemplate = 1)");

    // -------------------------------------------------------------------------
    // KỊCH BẢN 7: Quản trị Lịch tập mẫu trên Admin Web
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 7: Kiểm thử chức năng Quản trị Admin Web ---");
    // 7.1. Tạo mới lịch tập mẫu có trường goal
    const resAdminCreate = await fetch(`${baseUrl}/workoutplans/procedure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "E2E Admin Sample Plan",
        description: "Mô tả giáo án mẫu kiểm thử E2E",
        level: "INTERMEDIATE",
        goal: "FAT_LOSS",
        durationWeeks: 12,
        isTemplate: true,
        creatorId: 2,
      }),
    });
    assert.equal(resAdminCreate.status, 201);
    const adminCreateData = await resAdminCreate.json();
    const testAdminPlanId = adminCreateData.data?.planId;
    assert(testAdminPlanId > 0);

    const [dbCheck1] = await db.promise().query(
      "SELECT goal, level, durationWeeks, isTemplate FROM WorkoutPlans WHERE planId = ?",
      [testAdminPlanId]
    );
    assert.equal(dbCheck1[0].goal, "FAT_LOSS");
    testPass("Admin 1: Tạo mới giáo án mẫu kèm goal 'FAT_LOSS' thành công");

    // 7.2. Chỉnh sửa goal của lịch tập mẫu
    const resAdminUpdate = await fetch(`${baseUrl}/workoutplans/${testAdminPlanId}/procedure`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "E2E Admin Sample Plan Updated",
        description: "Mô tả đã sửa",
        level: "ADVANCED",
        goal: "STRENGTH",
        durationWeeks: 16,
        isTemplate: true,
      }),
    });
    assert.equal(resAdminUpdate.status, 200);

    const [dbCheck2] = await db.promise().query(
      "SELECT goal, level, durationWeeks FROM WorkoutPlans WHERE planId = ?",
      [testAdminPlanId]
    );
    assert.equal(dbCheck2[0].goal, "STRENGTH");
    assert.equal(dbCheck2[0].level, "ADVANCED");
    assert.equal(dbCheck2[0].durationWeeks, 16);
    testPass("Admin 2: Chỉnh sửa goal thành 'STRENGTH' và cập nhật thành công");

    // 7.3. Lọc lịch tập mẫu theo goal qua API templates
    const resTemplates = await fetch(`${baseUrl}/workoutplans/templates`);
    assert.equal(resTemplates.status, 200);
    const templatesList = await resTemplates.json();
    const foundTestPlan = templatesList.find(t => t.planId === testAdminPlanId);
    assert(Boolean(foundTestPlan));
    assert.equal(foundTestPlan.goal, "STRENGTH");
    testPass("Admin 3: Danh sách Templates trả về đầy đủ goal phục vụ lọc trên UI");

    // Dọn dẹp plan kiểm thử admin
    await db.promise().query("DELETE FROM WorkoutPlans WHERE planId = ?", [testAdminPlanId]);

    // -------------------------------------------------------------------------
    // KỊCH BẢN 8: Luồng Mobile - Áp dụng lịch tập & Chuyển đổi trạng thái
    // -------------------------------------------------------------------------
    console.log("\n--- KỊCH BẢN 8: Luồng Mobile - Áp dụng lịch tập & Chuyển đổi trạng thái ---");
    // Sử dụng user 4: ban đầu chưa có active plan
    // 8.1. Áp dụng giáo án gợi ý (Plan 2: Push Pull Legs 3 Days)
    const resApply = await fetch(`${baseUrl}/api/user/4/apply-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token4}`,
      },
      body: JSON.stringify({ planId: 2 }),
    });
    assert.equal(resApply.status, 200);
    testPass("Mobile 1: Gọi API áp dụng lịch tập (apply-plan) thành công");

    // 8.2. Kiểm tra DB: User 4 có Plan 2 là ACTIVE trong GymUserWorkoutPlans
    const [u4AfterApply] = await db.promise().query(
      "SELECT planId FROM GymUserWorkoutPlans WHERE profileId = 4 AND status = 'ACTIVE'"
    );
    assert.equal(u4AfterApply[0].planId, 2);

    // 8.3. Kiểm tra API active-plan: trả về chính xác giáo án vừa kích hoạt
    const resActivePlan = await fetch(`${baseUrl}/api/user/4/active-plan`, {
      headers: { Authorization: `Bearer ${token4}` },
    });
    assert.equal(resActivePlan.status, 200);
    const activePlanData = await resActivePlan.json();
    assert.equal(activePlanData.data?.planId, 2);
    assert.equal(activePlanData.data?.status, "ACTIVE");
    testPass("Mobile 2: API active-plan phản hồi chính xác giáo án vừa kích hoạt");

    // 8.4. Kiểm tra API recommendations: sau khi áp dụng, tự động chuyển thành HAS_ACTIVE_PLAN
    const resRecAfterApply = await fetch(`${baseUrl}/api/user/4/recommendations`, {
      headers: { Authorization: `Bearer ${token4}` },
    });
    const dataAfterApply = await resRecAfterApply.json();
    assert.equal(dataAfterApply.data?.status, "HAS_ACTIVE_PLAN");
    testPass("Mobile 3: API recommendations phản hồi HAS_ACTIVE_PLAN, bảo vệ giao diện routine");

    // 8.5. KHÔI PHỤC NGUYÊN TRẠNG DỮ LIỆU USER 4
    await db.promise().query("DELETE FROM GymUserWorkoutPlans WHERE profileId = 4 AND planId = 2");
    const [u4Restored] = await db.promise().query(
      "SELECT planId FROM GymUserWorkoutPlans WHERE profileId = 4 AND status = 'ACTIVE'"
    );
    assert.equal(u4Restored.length, 0);
    testPass("Bảo toàn dữ liệu: Đã hoàn nguyên trạng thái gốc cho User 4 an toàn");

    // -------------------------------------------------------------------------
    // DỌN DẸP TOÀN BỘ TÀI NGUYÊN TEST
    // -------------------------------------------------------------------------
    await db.promise().query("DELETE FROM Accounts WHERE accountId IN (?, ?, ?, ?)", [
      acc2.insertId,
      acc3.insertId,
      acc4Inc.insertId,
      accBegStr.insertId,
    ]);
    await db.promise().query("DELETE FROM LoginSessions WHERE loginSessionId IN (?, ?, ?, ?, ?, ?)", [
      s4Res.insertId,
      s2Res.insertId,
      s3Res.insertId,
      s4IncRes.insertId,
      s27Res.insertId,
      sBegStr.insertId,
    ]);

    console.log(`\n========================================================`);
    console.log(`=== TỔNG KẾT GIAI ĐOẠN 6: ${passed} PASSED, ${failed} FAILED ===`);
    console.log(`========================================================\n`);

  } catch (err) {
    testFail("Lỗi ngoài dự kiến trong bài kiểm thử E2E:", err);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.promise().end();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
