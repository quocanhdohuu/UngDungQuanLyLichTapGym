const path = require('path');
const bePath = path.resolve(__dirname, '../App/BE_GymPlan');
const mysql = require(path.join(bePath, 'node_modules/mysql2/promise'));
require(path.join(bePath, 'node_modules/dotenv')).config({ path: path.join(bePath, '.env'), quiet: true });

async function runTests() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'quanlylichtapgym'
  });

  console.log('=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 2: DATABASE & STORED PROCEDURES ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Tạo tài khoản test tạm trong transaction
  await connection.beginTransaction();

  try {
    // 1. Kiểm tra sp_GetWorkoutPlanTemplates trả về cột goal
    console.log('Test 1: sp_GetWorkoutPlanTemplates trả về cột goal và totalDays');
    const [templates] = await connection.query('CALL sp_GetWorkoutPlanTemplates()');
    assert(Array.isArray(templates[0]) && templates[0].length > 0, 'Templates list không rỗng');
    assert(templates[0][0].hasOwnProperty('goal'), 'Template có trường goal');
    assert(templates[0][0].hasOwnProperty('totalDays'), 'Template có trường totalDays');

    // 2. Kiểm tra sp_GetWorkoutPlanDetail trả về goal ở Result Set 1
    console.log('\nTest 2: sp_GetWorkoutPlanDetail(1) trả về goal ở Result Set 1');
    const [detailSets] = await connection.query('CALL sp_GetWorkoutPlanDetail(1)');
    assert(detailSets[0][0].goal === 'GENERAL_FITNESS', 'Plan 1 có goal = GENERAL_FITNESS');
    assert(detailSets[1].length > 0, 'Result Set 2 (Days + Exercises) không bị ảnh hưởng');
    assert(detailSets[2].length > 0, 'Result Set 3 (Media) không bị ảnh hưởng');

    // 3. Tạo các profile test tạm thời
    // 3.1. User Test Beginner, Tăng cơ, 3 buổi
    const [acc1] = await connection.query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_rec_01', 'rec01@test.com', '123456', 'GYM_USER')"
    );
    const [prof1] = await connection.query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'Test User 1', 'BEGINNER', 'Tăng cơ', 3)",
      [acc1.insertId]
    );
    const pId1 = prof1.insertId;

    // 3.2. User Test Intermediate, Giảm mỡ, 4 buổi
    const [acc2] = await connection.query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_rec_02', 'rec02@test.com', '123456', 'GYM_USER')"
    );
    const [prof2] = await connection.query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'Test User 2', 'INTERMEDIATE', 'Giảm mỡ', 4)",
      [acc2.insertId]
    );
    const pId2 = prof2.insertId;

    // 3.3. User Test Advanced, Tăng sức mạnh, 4 buổi
    const [acc3] = await connection.query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_rec_03', 'rec03@test.com', '123456', 'GYM_USER')"
    );
    const [prof3] = await connection.query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'Test User 3', 'ADVANCED', 'Tăng sức mạnh', 4)",
      [acc3.insertId]
    );
    const pId3 = prof3.insertId;

    // 3.4. User Test thiếu Goal
    const [acc4] = await connection.query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_rec_04', 'rec04@test.com', '123456', 'GYM_USER')"
    );
    const [prof4] = await connection.query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'Test User 4', 'BEGINNER', NULL, 3)",
      [acc4.insertId]
    );
    const pId4 = prof4.insertId;

    // 3.5. User Test thiếu SessionsPerWeek
    const [acc5] = await connection.query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_rec_05', 'rec05@test.com', '123456', 'GYM_USER')"
    );
    const [prof5] = await connection.query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'Test User 5', 'INTERMEDIATE', 'Tăng cơ', NULL)",
      [acc5.insertId]
    );
    const pId5 = prof5.insertId;

    // 3.6. User Test Đã có Active Plan
    const [acc6] = await connection.query(
      "INSERT INTO Accounts (username, email, password, role) VALUES ('test_rec_06', 'rec06@test.com', '123456', 'GYM_USER')"
    );
    const [prof6] = await connection.query(
      "INSERT INTO GymUsers (accountId, fullName, level, goal, sessionsPerWeek) VALUES (?, 'Test User 6', 'BEGINNER', 'Tăng cơ', 3)",
      [acc6.insertId]
    );
    const pId6 = prof6.insertId;
    await connection.query(
      "INSERT INTO GymUserWorkoutPlans (profileId, planId, status) VALUES (?, 1, 'ACTIVE')",
      [pId6]
    );

    // TEST CASES GỢI Ý LỊCH TẬP:

    // Test Case 1: Người mới, BEGINNER, muốn tăng cơ, 3 buổi/tuần
    console.log('\nTest Case 1: Người mới (BEGINNER, Tăng cơ, 3 buổi/tuần)');
    const [res1] = await connection.query('CALL sp_GetRecommendedWorkoutPlans(?)', [pId1]);
    assert(res1[0][0].status === 'SUCCESS', 'Status là SUCCESS');
    const plans1 = res1[1];
    assert(plans1.length <= 3, 'Tối đa 3 lịch tập gợi ý');
    assert(plans1.every(p => p.level !== 'ADVANCED'), 'An toàn: Tuyệt đối không có lịch ADVANCED cho Beginner');
    console.log('    Các lịch được gợi ý:', plans1.map(p => `${p.title} (${p.level}, ${p.totalDays}d, ${p.goal}) - Điểm: ${p.matchScore}`).join(' | '));

    // Test Case 2: INTERMEDIATE, muốn giảm mỡ, 4 buổi/tuần
    console.log('\nTest Case 2: INTERMEDIATE, Giảm mỡ, 4 buổi/tuần');
    const [res2] = await connection.query('CALL sp_GetRecommendedWorkoutPlans(?)', [pId2]);
    assert(res2[0][0].status === 'SUCCESS', 'Status là SUCCESS');
    const plans2 = res2[1];
    assert(plans2.length > 0, 'Tìm thấy gợi ý phù hợp');
    console.log('    Các lịch được gợi ý:', plans2.map(p => `${p.title} (${p.level}, ${p.totalDays}d, ${p.goal}) - Điểm: ${p.matchScore}`).join(' | '));

    // Test Case 3: ADVANCED, muốn tăng sức mạnh, 4 buổi/tuần
    console.log('\nTest Case 3: ADVANCED, Tăng sức mạnh, 4 buổi/tuần');
    const [res3] = await connection.query('CALL sp_GetRecommendedWorkoutPlans(?)', [pId3]);
    assert(res3[0][0].status === 'SUCCESS', 'Status là SUCCESS');
    const plans3 = res3[1];
    assert(plans3[0].title === 'Upper Lower Strength 4 Days', 'Lịch top 1 là Upper Lower Strength 4 Days (100 điểm khớp tuyệt đối)');
    assert(plans3[0].matchScore === 100, 'Điểm đạt tối đa 100');
    console.log('    Các lịch được gợi ý:', plans3.map(p => `${p.title} (${p.level}, ${p.totalDays}d, ${p.goal}) - Điểm: ${p.matchScore}`).join(' | '));

    // Test Case 4: Người dùng chưa nhập Goal (NULL)
    console.log('\nTest Case 4: Người dùng chưa nhập Goal (hồ sơ chưa hoàn chỉnh)');
    const [res4] = await connection.query('CALL sp_GetRecommendedWorkoutPlans(?)', [pId4]);
    assert(res4[0][0].status === 'PROFILE_INCOMPLETE', 'Trả về status PROFILE_INCOMPLETE');

    // Test Case 5: Người dùng chưa nhập Số buổi (NULL)
    console.log('\nTest Case 5: Người dùng chưa nhập Số buổi (hồ sơ chưa hoàn chỉnh)');
    const [res5] = await connection.query('CALL sp_GetRecommendedWorkoutPlans(?)', [pId5]);
    assert(res5[0][0].status === 'PROFILE_INCOMPLETE', 'Trả về status PROFILE_INCOMPLETE');

    // Test Case 6: Người dùng ĐÃ CÓ lịch tập ACTIVE
    console.log('\nTest Case 6: Người dùng đã có lịch tập ACTIVE');
    const [res6] = await connection.query('CALL sp_GetRecommendedWorkoutPlans(?)', [pId6]);
    assert(res6[0][0].status === 'HAS_ACTIVE_PLAN', 'Trả về status HAS_ACTIVE_PLAN');

    // Test Case 7: Người dùng không tồn tại
    console.log('\nTest Case 7: Người dùng không tồn tại');
    try {
      await connection.query('CALL sp_GetRecommendedWorkoutPlans(999999)');
      assert(false, 'Phải ném ngoại lệ khi user không tồn tại');
    } catch (err) {
      assert(err.sqlState === '45000' && err.message.includes('Người dùng không tồn tại'), 'Ném lỗi SQLSTATE 45000: Người dùng không tồn tại');
    }

    // 4. Kiểm tra sp_CreateWorkoutPlan và sp_UpdateWorkoutPlan với goal
    console.log('\nTest 8: sp_CreateWorkoutPlan và sp_UpdateWorkoutPlan với cột goal');
    const [createRes] = await connection.query(
      "CALL sp_CreateWorkoutPlan('Test Plan Goal', 'Mo ta test', 2, TRUE, 'BEGINNER', 8, 'FAT_LOSS')"
    );
    const newPlanId = createRes[0][0].planId;
    assert(newPlanId > 0, 'Tạo plan mới thành công');

    const [createdPlan] = await connection.query('SELECT goal FROM WorkoutPlans WHERE planId = ?', [newPlanId]);
    assert(createdPlan[0].goal === 'FAT_LOSS', 'Goal được lưu đúng là FAT_LOSS');

    await connection.query(
      "CALL sp_UpdateWorkoutPlan(?, 'Test Plan Goal Updated', 'Mo ta cap nhat', 'INTERMEDIATE', TRUE, 12, 'MUSCLE_GAIN')",
      [newPlanId]
    );
    const [updatedPlan] = await connection.query('SELECT title, level, durationWeeks, goal FROM WorkoutPlans WHERE planId = ?', [newPlanId]);
    assert(updatedPlan[0].goal === 'MUSCLE_GAIN' && updatedPlan[0].level === 'INTERMEDIATE' && updatedPlan[0].durationWeeks === 12, 'Cập nhật goal, level, durationWeeks thành công');

    console.log(`\n=== TỔNG KẾT: ${passed} PASSED, ${failed} FAILED ===`);
  } finally {
    // Rollback để dọn sạch dữ liệu test tạm thời
    await connection.rollback();
    await connection.end();
  }
}

runTests().catch(err => {
  console.error('Lỗi khi chạy test:', err);
  process.exit(1);
});
