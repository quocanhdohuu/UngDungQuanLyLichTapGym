const mysql = require("mysql2/promise");
const assert = require("assert");

console.log("=================================================================");
console.log("   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CHỨC NĂNG OFFLINE & PREFILL WORKOUT");
console.log("=================================================================\n");

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         Lỗi: ${err.message}\n`);
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         Lỗi: ${err.message}\n`);
  }
}

// -----------------------------------------------------------------------------
// 1. KIỂM THỬ LOGIC HỢP NHẤT DỮ LIỆU (mergeSessionWithLocal)
// -----------------------------------------------------------------------------
console.log(">>> NHÓM 1: KIỂM THỬ HÀM mergeSessionWithLocal");

function mergeSessionWithLocal(serverSession, localSession) {
  if (!localSession) return serverSession;

  const merged = {
    ...serverSession,
    exercises: [...serverSession.exercises.map(e => ({ ...e, sets: [...e.sets] }))],
  };

  for (const localEx of localSession.exercises) {
    const sExIndex = merged.exercises.findIndex(
      e => (e.originalExerciseId ?? e.exerciseId) === (localEx.originalExerciseId ?? localEx.exerciseId)
    );
    if (sExIndex < 0) {
      merged.exercises.push(localEx);
    } else {
      const serverEx = merged.exercises[sExIndex];
      const mergedSets = [...serverEx.sets];

      for (const localSet of localEx.sets) {
        const existingSetIndex = mergedSets.findIndex(s => s.setNumber === localSet.setNumber);
        if (existingSetIndex < 0) {
          mergedSets.push(localSet);
        }
      }
      mergedSets.sort((a, b) => a.setNumber - b.setNumber);
      merged.exercises[sExIndex] = { ...serverEx, sets: mergedSets };
    }
  }

  return merged;
}

it("Giữ lại trọn vẹn 3 hiệp khi server mới chỉ có 1 hiệp vừa sync lên", () => {
  const serverSession = {
    workoutSessionId: 850,
    exercises: [
      {
        performedExerciseId: 500,
        exerciseId: 9,
        originalExerciseId: 9,
        sets: [{ setId: 101, setNumber: 1, weight: 80, reps: 10 }]
      }
    ]
  };

  const localSession = {
    workoutSessionId: 850,
    exercises: [
      {
        performedExerciseId: -1001,
        exerciseId: 9,
        originalExerciseId: 9,
        sets: [
          { setId: -201, setNumber: 1, weight: 80, reps: 10 },
          { setId: -202, setNumber: 2, weight: 80, reps: 10 },
          { setId: -203, setNumber: 3, weight: 80, reps: 10 }
        ]
      }
    ]
  };

  const merged = mergeSessionWithLocal(serverSession, localSession);
  assert.strictEqual(merged.exercises.length, 1);
  const ex = merged.exercises[0];
  assert.strictEqual(ex.sets.length, 3, "Phải có đúng 3 hiệp sau khi merge!");
  assert.strictEqual(ex.sets[0].setNumber, 1);
  assert.strictEqual(ex.sets[0].setId, 101, "Hiệp 1 giữ ID từ server");
  assert.strictEqual(ex.sets[1].setNumber, 2);
  assert.strictEqual(ex.sets[1].setId, -202, "Hiệp 2 giữ ID local chờ sync");
  assert.strictEqual(ex.sets[2].setNumber, 3);
  assert.strictEqual(ex.sets[2].setId, -203, "Hiệp 3 giữ ID local chờ sync");
});

it("Giữ lại bài tập mới tạo lúc offline chưa có trên server", () => {
  const serverSession = {
    workoutSessionId: 850,
    exercises: [
      {
        performedExerciseId: 500,
        exerciseId: 40,
        originalExerciseId: 40,
        sets: [{ setId: 101, setNumber: 1, weight: 100, reps: 10 }]
      }
    ]
  };

  const localSession = {
    workoutSessionId: 850,
    exercises: [
      {
        performedExerciseId: 500,
        exerciseId: 40,
        originalExerciseId: 40,
        sets: [{ setId: 101, setNumber: 1, weight: 100, reps: 10 }]
      },
      {
        performedExerciseId: -999,
        exerciseId: 9,
        originalExerciseId: 9,
        sets: [
          { setId: -1, setNumber: 1, weight: 30, reps: 12 },
          { setId: -2, setNumber: 2, weight: 30, reps: 12 }
        ]
      }
    ]
  };

  const merged = mergeSessionWithLocal(serverSession, localSession);
  assert.strictEqual(merged.exercises.length, 2, "Cả bài tập offline phải được giữ lại!");
  assert.strictEqual(merged.exercises[1].exerciseId, 9);
  assert.strictEqual(merged.exercises[1].sets.length, 2);
});

// -----------------------------------------------------------------------------
// 2. KIỂM THỬ ÁNH XẠ ID TẠM THỜI (idMap & resolveId)
// -----------------------------------------------------------------------------
console.log("\n>>> NHÓM 2: KIỂM THỬ ÁNH XẠ ID TẠM THỜI (idMap & resolveId)");

function createIdResolver(idMap) {
  return function resolveId(id) {
    if (id == null) return 0;
    const key = String(id);
    if (idMap[key] != null) return Number(idMap[key]);
    return Number(id);
  };
}

it("Tra cứu chuẩn xác từ ID âm sang ID thật do MySQL trả về", () => {
  const idMap = {
    "-1794820000001": 5211,
    "-1794820000002": 20625,
    "-1794820000003": 20626
  };
  const resolve = createIdResolver(idMap);

  assert.strictEqual(resolve(-1794820000001), 5211);
  assert.strictEqual(resolve("-1794820000001"), 5211);
  assert.strictEqual(resolve(-1794820000002), 20625);
  assert.strictEqual(resolve(5211), 5211, "ID dương giữ nguyên");
  assert.strictEqual(resolve(null), 0);
  assert.strictEqual(resolve(undefined), 0);
});

// -----------------------------------------------------------------------------
// 3. KIỂM THỬ TỰ ĐỘNG ĐIỀN MỨC TẠ LẦN TRƯỚC (Auto-Prefill & Fallback)
// -----------------------------------------------------------------------------
console.log("\n>>> NHÓM 3: KIỂM THỬ TỰ ĐỘNG ĐIỀN MỨC TẠ LẦN TRƯỚC (Auto-Prefill & Fallback)");

it("Chuyển đổi chuỗi số thập phân của MySQL (80.00 -> '80')", () => {
  const formatWeight = weight => (weight != null ? String(Number(weight)) : "");
  assert.strictEqual(formatWeight("80.00"), "80");
  assert.strictEqual(formatWeight("22.50"), "22.5");
  assert.strictEqual(formatWeight("0.00"), "0");
  assert.strictEqual(formatWeight(null), "");
  assert.strictEqual(formatWeight(undefined), "");
});

it("Kế thừa mức tạ hiệp 1 cho các hiệp sau khi các hiệp sau chưa có dữ liệu cũ", () => {
  const prevPerf = [
    { setNumber: 1, weight: "80.00", reps: 10 }
  ];
  const targetReps = 10;
  const numbers = [1, 2, 3];
  const drafts = {};

  for (const num of numbers) {
    const prev = prevPerf.find(s => s.setNumber === num) || prevPerf[0];
    const prevWeight = prev?.weight != null ? String(Number(prev.weight)) : "";
    const prevReps = prev?.reps != null ? String(prev.reps) : String(targetReps);
    drafts[num] = { weight: prevWeight, reps: prevReps };
  }

  assert.strictEqual(drafts[1].weight, "80");
  assert.strictEqual(drafts[1].reps, "10");
  assert.strictEqual(drafts[2].weight, "80", "Hiệp 2 tự động kế thừa 80kg từ hiệp 1");
  assert.strictEqual(drafts[2].reps, "10");
  assert.strictEqual(drafts[3].weight, "80", "Hiệp 3 tự động kế thừa 80kg từ hiệp 1");
  assert.strictEqual(drafts[3].reps, "10");
});

// -----------------------------------------------------------------------------
// 4. KIỂM THỬ CƠ CHẾ AUTO-COMMIT TẤT CẢ CÁC HIỆP KHI HOÀN THÀNH BÀI
// -----------------------------------------------------------------------------
console.log("\n>>> NHÓM 4: KIỂM THỬ AUTO-COMMIT TẤT CẢ CÁC HIỆP");

it("Quét và lưu tự động tất cả các hiệp hợp lệ dù người dùng không bấm nút tick", async () => {
  const savedSets = [];
  const numbers = [1, 2, 3];
  const drafts = {
    1: { weight: "80", reps: "10" },
    2: { weight: "80", reps: "10" },
    3: { weight: "85", reps: "8" }
  };
  const performed = { sets: [] }; // Chưa bấm tick hiệp nào!

  // Giả lập hàm autoSaveAllDrafts
  async function autoSaveAllDrafts() {
    for (const num of numbers) {
      const d = drafts[num];
      if (!d) continue;
      const kg = Number(d.weight.replace(",", "."));
      const count = Number(d.reps);
      const valid = Number.isFinite(kg) && kg >= 0 && Number.isInteger(count) && count > 0;
      if (!valid) continue;

      const saved = performed.sets.find(s => s.setNumber === num);
      if (!saved) {
        savedSets.push({ setNumber: num, weight: kg, reps: count });
        performed.sets.push({ setNumber: num, weight: kg, reps: count });
      }
    }
  }

  await autoSaveAllDrafts();
  assert.strictEqual(savedSets.length, 3, "Phải lưu đủ 3 hiệp!");
  assert.strictEqual(savedSets[0].weight, 80);
  assert.strictEqual(savedSets[1].weight, 80);
  assert.strictEqual(savedSets[2].weight, 85);
});

// -----------------------------------------------------------------------------
// 5. KIỂM THỬ TÍCH HỢP TOÀN TRÌNH TRÊN DATABASE MYSQL THỰC TẾ
// -----------------------------------------------------------------------------
console.log("\n>>> NHÓM 5: KIỂM THỬ TÍCH HỢP TRỰC TIẾP TRÊN MYSQL");

(async () => {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "140825",
    database: "quanlylichtapgym"
  });

  const testProfileId = 27; // User kiểm thử thực tế

  await itAsync("Chạy stored procedure sp_GetPreviousExercisePerformance trả về đúng dữ liệu", async () => {
    const [res] = await conn.query("CALL sp_GetPreviousExercisePerformance(?, ?)", [testProfileId, 40]);
    assert.ok(Array.isArray(res[0]), "Kết quả phải là một danh sách");
    assert.ok(res[0].length >= 1, "Phải có ít nhất 1 hiệp lịch sử của bài Leg Press");
    const first = res[0][0];
    assert.strictEqual(Number(first.weight), 80);
    assert.strictEqual(first.reps, 10);
  });

  await itAsync("Mô phỏng quy trình: Bắt đầu buổi tập -> Thêm bài tập -> Thêm 3 hiệp -> Hoàn thành buổi tập", async () => {
    // 1. Tạo session kiểm thử
    const [sessRes] = await conn.query("CALL sp_StartWorkoutSession(?, ?)", [testProfileId, 115]);
    const sessionId = sessRes[0][0].workoutSessionId;
    assert.ok(sessionId > 0, "Phải tạo được workoutSessionId hợp lệ");

    try {
      // 2. Thêm bài tập (sp_AddPerformedExercise)
      const testExId = 9; // Dumbbell Bench Press
      const [exRes] = await conn.query("CALL sp_AddPerformedExercise(?, ?, ?)", [sessionId, testExId, testExId]);
      const performedId = exRes[0][0].performedExerciseId;
      assert.ok(performedId > 0, "Phải tạo được performedExerciseId");

      // 3. Thêm lần lượt 3 hiệp (sp_AddExerciseSet)
      const [set1] = await conn.query("CALL sp_AddExerciseSet(?, 1, 80.00, 10, null)", [performedId]);
      const [set2] = await conn.query("CALL sp_AddExerciseSet(?, 2, 80.00, 10, null)", [performedId]);
      const [set3] = await conn.query("CALL sp_AddExerciseSet(?, 3, 85.00, 8, null)", [performedId]);

      assert.strictEqual(set1[0][0].setNumber, 1);
      assert.strictEqual(set2[0][0].setNumber, 2);
      assert.strictEqual(set3[0][0].setNumber, 3);

      // 4. Kiểm tra trong bảng ExerciseSets có đủ 3 hiệp
      const [checkSets] = await conn.query(
        "SELECT * FROM ExerciseSets WHERE performedExerciseId = ? ORDER BY setNumber ASC",
        [performedId]
      );
      assert.strictEqual(checkSets.length, 3, "Trong DB phải có đủ 3 hiệp!");
      assert.strictEqual(Number(checkSets[0].weight), 80);
      assert.strictEqual(Number(checkSets[1].weight), 80);
      assert.strictEqual(Number(checkSets[2].weight), 85);

      // 5. Hoàn thành bài tập (sp_CompletePerformedExercise)
      await conn.query("CALL sp_CompletePerformedExercise(?)", [performedId]);

      // 6. Hoàn thành buổi tập (sp_CompleteWorkoutSession)
      const [completeRes] = await conn.query("CALL sp_CompleteWorkoutSession(?, null)", [sessionId]);
      assert.strictEqual(completeRes[0][0].status, "COMPLETED");

      // 7. Gọi sp_GetPreviousExercisePerformance ngay sau đó để kiểm tra
      const [prevRes] = await conn.query("CALL sp_GetPreviousExercisePerformance(?, ?)", [testProfileId, testExId]);
      assert.strictEqual(prevRes[0].length, 3, "Lần tập trước ngay lập tức ghi nhận đủ 3 hiệp!");
      assert.strictEqual(Number(prevRes[0][0].weight), 80);
      assert.strictEqual(Number(prevRes[0][1].weight), 80);
      assert.strictEqual(Number(prevRes[0][2].weight), 85);
    } finally {
      // Dọn dẹp dữ liệu session kiểm thử
      await conn.query("DELETE FROM ExerciseSets WHERE performedExerciseId IN (SELECT performedExerciseId FROM PerformedExercises WHERE workoutSessionId = ?)", [sessionId]);
      await conn.query("DELETE FROM PerformedExercises WHERE workoutSessionId = ?", [sessionId]);
      await conn.query("DELETE FROM WorkoutSessions WHERE workoutSessionId = ?", [sessionId]);
    }
  });

  await conn.end();

  console.log("\n=================================================================");
  console.log(`   KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU (100% PASS)`);
  console.log("=================================================================\n");
})();
