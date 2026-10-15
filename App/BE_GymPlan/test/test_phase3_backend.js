const assert = require("node:assert/strict");
const express = require("express");
const app = require("../src/app");
const db = require("../src/common/db");
const User = require("../src/models/user.model");
const { issueToken } = require("../src/services/userSessionService");

async function main() {
  console.log("=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 3: BACKEND API ===\n");

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  function testPass(msg) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  }

  function testFail(msg, err) {
    console.error(`  [FAIL] ${msg}`, err || "");
    failed++;
  }

  try {
    // -------------------------------------------------------------
    // 1. Kiểm tra GET /workoutplans/templates
    // -------------------------------------------------------------
    console.log("Test 1: GET /workoutplans/templates trả về goal");
    const resTemplates = await fetch(`${baseUrl}/workoutplans/templates`);
    assert.equal(resTemplates.status, 200);
    const templates = await resTemplates.json();
    assert(Array.isArray(templates) && templates.length > 0);
    assert(templates[0].hasOwnProperty("goal"), "Cột goal có trong kết quả templates");
    assert(templates.some((t) => t.goal === "GENERAL_FITNESS"));
    assert(templates.some((t) => t.goal === "MUSCLE_GAIN"));
    testPass("GET /workoutplans/templates trả về đầy đủ goal");

    // -------------------------------------------------------------
    // 2. Kiểm tra GET /workoutplans/:planId/detail
    // -------------------------------------------------------------
    console.log("\nTest 2: GET /workoutplans/1/detail trả về goal");
    const resDetail = await fetch(`${baseUrl}/workoutplans/1/detail`);
    assert.equal(resDetail.status, 200);
    const detail = await resDetail.json();
    assert.equal(detail.planId, 1);
    assert.equal(detail.goal, "GENERAL_FITNESS");
    assert(Array.isArray(detail.days) && detail.days.length > 0);
    testPass("GET /workoutplans/1/detail trả về goal = GENERAL_FITNESS và cấu trúc days");

    // -------------------------------------------------------------
    // 3. Kiểm tra POST /workoutplans/procedure (tạo plan với goal)
    // -------------------------------------------------------------
    console.log("\nTest 3: POST /workoutplans/procedure lưu goal");
    const resCreate = await fetch(`${baseUrl}/workoutplans/procedure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Backend Plan",
        description: "Mo ta test backend",
        level: "BEGINNER",
        durationWeeks: 8,
        isTemplate: true,
        goal: "FAT_LOSS",
      }),
    });
    assert.equal(resCreate.status, 201);
    const createData = await resCreate.json();
    const createdPlanId = createData.data?.planId;
    assert(createdPlanId > 0, "Tạo plan thành công có planId");

    // Kiểm tra DB
    const [dbPlanRows] = await db.promise().query(
      "SELECT goal FROM WorkoutPlans WHERE planId = ?",
      [createdPlanId]
    );
    assert.equal(dbPlanRows[0].goal, "FAT_LOSS");
    testPass("POST /workoutplans/procedure lưu goal thành công");

    // -------------------------------------------------------------
    // 4. Kiểm tra PUT /workoutplans/:planId/procedure (sửa plan kèm goal)
    // -------------------------------------------------------------
    console.log("\nTest 4: PUT /workoutplans/:planId/procedure cập nhật goal");
    const resUpdate = await fetch(`${baseUrl}/workoutplans/${createdPlanId}/procedure`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Backend Plan Updated",
        description: "Mo ta sua test backend",
        level: "INTERMEDIATE",
        durationWeeks: 10,
        isTemplate: true,
        goal: "MUSCLE_GAIN",
      }),
    });
    assert.equal(resUpdate.status, 200);

    const [dbPlanUpdated] = await db.promise().query(
      "SELECT level, durationWeeks, goal FROM WorkoutPlans WHERE planId = ?",
      [createdPlanId]
    );
    assert.equal(dbPlanUpdated[0].goal, "MUSCLE_GAIN");
    assert.equal(dbPlanUpdated[0].level, "INTERMEDIATE");
    assert.equal(dbPlanUpdated[0].durationWeeks, 10);
    testPass("PUT /workoutplans/:planId/procedure cập nhật goal thành công");

    // Dọn dẹp plan test vừa tạo
    await db.promise().query("DELETE FROM WorkoutPlans WHERE planId = ?", [createdPlanId]);

    // -------------------------------------------------------------
    // 5. Chuẩn bị session xác thực cho các kiểm thử Recommendation
    // -------------------------------------------------------------
    console.log("\nTest 5: Kiểm thử phân quyền & xác thực API Gợi ý lịch tập");

    // Lấy thông tin user 4 (Đỗ Văn Vinh, BEGINNER, Giảm mỡ, 3 ngày, không có active plan)
    const [user4Rows] = await db.promise().query(
      "SELECT gu.profileId, gu.accountId, a.username FROM GymUsers gu JOIN Accounts a ON a.accountId = gu.accountId WHERE gu.profileId = 4"
    );
    const user4 = user4Rows[0];

    // Tạo LoginSession hợp lệ cho user 4
    const [session4Res] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [user4.accountId]
    );
    const token4 = issueToken({
      accountId: user4.accountId,
      profileId: user4.profileId,
      loginSessionId: session4Res.insertId,
    });

    // Lấy thông tin user 27 (Nguyễn Hoàng Minh, đã có active plan)
    const [user27Rows] = await db.promise().query(
      "SELECT gu.profileId, gu.accountId FROM GymUsers gu WHERE gu.profileId = 27"
    );
    const user27 = user27Rows[0];
    const [session27Res] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [user27.accountId]
    );
    const token27 = issueToken({
      accountId: user27.accountId,
      profileId: user27.profileId,
      loginSessionId: session27Res.insertId,
    });

    // 5.1. Gọi không có token -> 401
    const resNoAuth = await fetch(`${baseUrl}/api/user/4/recommendations`);
    assert.equal(resNoAuth.status, 401);
    testPass("Từ chối 401 khi không có Authorization header");

    // 5.2. Token của user 4 gọi sang profile của user 27 -> 403 Forbidden
    const resForbidden = await fetch(`${baseUrl}/api/user/27/recommendations`, {
      headers: { Authorization: `Bearer ${token4}` },
    });
    assert.equal(resForbidden.status, 403);
    testPass("Ngăn chặn 403 Forbidden khi client cố truy cập gợi ý của người dùng khác");

    // -------------------------------------------------------------
    // 6. Kiểm tra GET /api/user/:profileId/recommendations (Trạng thái SUCCESS)
    // -------------------------------------------------------------
    console.log("\nTest 6: GET /api/user/4/recommendations (User chưa có lịch, BEGINNER, Giảm mỡ, 3 ngày)");
    const resRec4 = await fetch(`${baseUrl}/api/user/4/recommendations`, {
      headers: { Authorization: `Bearer ${token4}` },
    });
    assert.equal(resRec4.status, 200);
    const rec4Data = await resRec4.json();
    assert.equal(rec4Data.data?.status, "SUCCESS");
    assert(Array.isArray(rec4Data.data?.plans) && rec4Data.data.plans.length > 0);
    assert(rec4Data.data.plans.length <= 3);
    assert(rec4Data.data.plans[0].matchScore >= 50);
    assert(rec4Data.data.plans[0].hasOwnProperty("recommendReason"));
    console.log("    Kết quả gợi ý:", rec4Data.data.plans.map(p => `${p.title} (${p.matchScore}đ)`).join(", "));
    testPass("Gợi ý thành công danh sách giáo án phù hợp chuẩn hóa JSON");

    // -------------------------------------------------------------
    // 7. Kiểm tra alias GET /api/workout-plans/recommendations
    // -------------------------------------------------------------
    console.log("\nTest 7: Alias GET /api/workout-plans/recommendations");
    const resAlias = await fetch(`${baseUrl}/api/workout-plans/recommendations`, {
      headers: { Authorization: `Bearer ${token4}` },
    });
    assert.equal(resAlias.status, 200);
    const aliasData = await resAlias.json();
    assert.equal(aliasData.data?.status, "SUCCESS");
    assert.equal(aliasData.data?.plans?.length, rec4Data.data.plans.length);
    testPass("Endpoint /api/workout-plans/recommendations hoạt động chuẩn xác với session token");

    // -------------------------------------------------------------
    // 8. Kiểm tra GET /api/user/:profileId/recommendations (Trạng thái HAS_ACTIVE_PLAN)
    // -------------------------------------------------------------
    console.log("\nTest 8: GET /api/user/27/recommendations (User đã có lịch ACTIVE)");
    const resRec27 = await fetch(`${baseUrl}/api/user/27/recommendations`, {
      headers: { Authorization: `Bearer ${token27}` },
    });
    assert.equal(resRec27.status, 200);
    const rec27Data = await resRec27.json();
    assert.equal(rec27Data.data?.status, "HAS_ACTIVE_PLAN");
    assert.equal(rec27Data.data?.plans?.length, 0);
    testPass("Xác định chính xác trạng thái HAS_ACTIVE_PLAN");

    // -------------------------------------------------------------
    // 9. Kiểm tra người dùng hồ sơ chưa hoàn thiện (PROFILE_INCOMPLETE)
    // -------------------------------------------------------------
    console.log("\nTest 9: Người dùng hồ sơ chưa hoàn thiện (PROFILE_INCOMPLETE)");
    // Tạo user test thiếu goal
    const [accInc] = await db.promise().query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_inc', 'inc@test.com', '123456', 'GYM_USER')"
    );
    const [profInc] = await db.promise().query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'User Incomplete', 'BEGINNER', NULL, 3)",
      [accInc.insertId]
    );
    const [sessInc] = await db.promise().query(
      "INSERT INTO LoginSessions (accountId, expiration, status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'ACTIVE')",
      [accInc.insertId]
    );
    const tokenInc = issueToken({
      accountId: accInc.insertId,
      profileId: profInc.insertId,
      loginSessionId: sessInc.insertId,
    });

    const resInc = await fetch(`${baseUrl}/api/user/${profInc.insertId}/recommendations`, {
      headers: { Authorization: `Bearer ${tokenInc}` },
    });
    assert.equal(resInc.status, 200);
    const incData = await resInc.json();
    assert.equal(incData.data?.status, "PROFILE_INCOMPLETE");
    testPass("Phản hồi đúng trạng thái PROFILE_INCOMPLETE khi người dùng thiếu mục tiêu");

    // Dọn dẹp user incomplete
    await db.promise().query("DELETE FROM Accounts WHERE accountId = ?", [accInc.insertId]);

    // Dọn dẹp sessions test
    await db.promise().query("DELETE FROM LoginSessions WHERE loginSessionId IN (?, ?)", [
      session4Res.insertId,
      session27Res.insertId,
    ]);

    console.log(`\n=== TỔNG KẾT GIAI ĐOẠN 3: ${passed} PASSED, ${failed} FAILED ===`);
  } catch (error) {
    testFail("Lỗi không mong muốn trong test:", error);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.promise().end();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
