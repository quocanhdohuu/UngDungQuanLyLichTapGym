const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../src/app");
const db = require("../src/common/db");

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await db.promise().end();
});

test("E2E KIỂM THỬ TOÀN TRÌNH LUỒNG TÍNH CALO QUA ẢNH (HUMAN-IN-THE-LOOP)", async (t) => {
  console.log("\n==================================================================");
  console.log("  BẮT ĐẦU KIỂM THỬ TOÀN TRÌNH E2E PHÂN HỆ DINH DƯỠNG GYMPLAN");
  console.log("==================================================================");

  // GIAI ĐOẠN 1: Kiểm tra CSDL Master Ingredients
  await t.test("Giai đoạn 1: Kiểm tra CSDL Master Ingredients", async () => {
    const [rows] = await db.promise().query("SELECT COUNT(*) as count FROM NutritionIngredients");
    assert(rows[0].count >= 50, "Bảng nguyên liệu phải có ít nhất 50 món chuẩn");
    console.log(`[E2E] [✓] Đã sẵn sàng ${rows[0].count} nguyên liệu trong CSDL.`);
  });

  // GIAI ĐOẠN 2: Người dùng chụp & gửi ảnh phân tích qua API
  let analyzedData = null;
  await t.test("Giai đoạn 2: Gửi ảnh phân tích (POST /api/nutrition/analyze-image)", async () => {
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGqCYAAGv0B/0gqW4YAAAAAElFTkSuQmCC",
      "base64"
    );

    const formData = new FormData();
    formData.append("image", new Blob([dummyPng], { type: "image/png" }), "meal_plate.png");

    const tStart = Date.now();
    const res = await fetch(`${baseUrl}/api/nutrition/analyze-image`, {
      method: "POST",
      body: formData,
    });
    const totalLatencyMs = Date.now() - tStart;

    assert.equal(res.status, 200, "API phân tích ảnh phải trả về HTTP 200");
    analyzedData = await res.json();

    console.log(`[E2E] [✓] Phản hồi phân tích ảnh trong: ${totalLatencyMs} ms (Mục tiêu: < 2000 ms)`);
    assert(totalLatencyMs < 2000, "Độ trễ toàn trình phân tích ảnh phải < 2 giây");
    assert(analyzedData.predictions.length > 0, "AI phải trả về ít nhất 1 nguyên liệu");
    console.log(`[E2E] [✓] AI phát hiện ${analyzedData.predictions.length} nguyên liệu:`, 
      analyzedData.predictions.map(p => `${p.nameVi} (~${p.estimatedGrams}g)`).join(", ")
    );
  });

  // GIAI ĐOẠN 3: Người dùng hiệu chỉnh số gram (Human-in-the-Loop) & Lưu vào nhật ký
  let savedMeal = null;
  await t.test("Giai đoạn 3: Hiệu chỉnh gram & Lưu bữa ăn (POST /api/nutrition/log-meal)", async () => {
    const [userRows] = await db.promise().query("SELECT profileId FROM GymUsers LIMIT 1");
    const profileId = userRows[0]?.profileId || 1;

    // Giả lập người dùng kiểm tra các món AI gợi ý và điều chỉnh lại số gram
    const [ingRows] = await db.promise().query(
      "SELECT ingredientId, code, nameVi, kcalPerGram, proteinPerGram, carbPerGram, fatPerGram FROM NutritionIngredients WHERE code IN ('chicken_breast', 'white_rice', 'broccoli')"
    );

    const chicken = ingRows.find(i => i.code === "chicken_breast");
    const rice = ingRows.find(i => i.code === "white_rice");
    const broccoli = ingRows.find(i => i.code === "broccoli");

    // Người dùng chốt: 180g ức gà (AI đoán 150g) + 220g cơm trắng (AI đoán 200g) + 120g bông cải (AI đoán 100g)
    const adjustedItems = [
      {
        ingredientId: chicken.ingredientId,
        aiConfidence: 0.92,
        aiEstimatedGrams: 150,
        userFinalGrams: 180, // 180 * 1.65 = 297 kcal | P: 55.8g | C: 0g | F: 6.48g
      },
      {
        ingredientId: rice.ingredientId,
        aiConfidence: 0.89,
        aiEstimatedGrams: 200,
        userFinalGrams: 220, // 220 * 1.30 = 286 kcal | P: 5.94g | C: 62.04g | F: 0.66g
      },
      {
        ingredientId: broccoli.ingredientId,
        aiConfidence: 0.85,
        aiEstimatedGrams: 100,
        userFinalGrams: 120, // 120 * 0.35 = 42 kcal | P: 2.88g | C: 8.64g | F: 0.48g
      },
    ];

    const payload = {
      profileId,
      mealType: "LUNCH",
      mealDate: new Date().toISOString().slice(0, 10),
      note: "Bữa trưa tăng cơ (E2E Test Case)",
      items: adjustedItems,
    };

    const res = await fetch(`${baseUrl}/api/nutrition/log-meal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201, "Lưu bữa ăn phải trả về HTTP 201");
    const result = await res.json();
    savedMeal = result.data;

    // Tổng calo kỳ vọng: 297 + 286 + 42 = 625 kcal
    assert.equal(savedMeal.totalKcal, 625);
    assert(savedMeal.totalProtein >= 64, "Protein phải đạt chuẩn tính toán");
    console.log(`[E2E] [✓] Đã lưu bữa ăn vào CSDL: ${savedMeal.totalKcal} kcal | P: ${savedMeal.totalProtein}g | C: ${savedMeal.totalCarb}g | F: ${savedMeal.totalFat}g`);
  });

  // GIAI ĐOẠN 4: Kiểm tra cập nhật trên Dashboard & Lịch sử
  await t.test("Giai đoạn 4: Cập nhật Dashboard (GET /api/nutrition/daily-summary)", async () => {
    const res = await fetch(
      `${baseUrl}/api/nutrition/daily-summary?profileId=${savedMeal.profileId}&date=${savedMeal.mealDate}`
    );
    assert.equal(res.status, 200);
    const data = await res.json();

    assert(data.data.summary.totalKcal >= 625);
    assert(data.data.meals.length >= 1);
    console.log(`[E2E] [✓] Dashboard ghi nhận: ${data.data.summary.totalKcal} kcal qua ${data.data.summary.totalMeals} bữa ăn.`);
  });

  // GIAI ĐOẠN 5: Xóa bữa ăn dọn dẹp
  await t.test("Giai đoạn 5: Dọn dẹp dữ liệu test (DELETE /api/nutrition/meal/:id)", async () => {
    const res = await fetch(`${baseUrl}/api/nutrition/meal/${savedMeal.mealLogId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: savedMeal.profileId }),
    });
    assert.equal(res.status, 200);
    console.log(`[E2E] [✓] Đã xóa bữa ăn test ID: ${savedMeal.mealLogId} và các items liên quan thành công.`);
  });

  console.log("==================================================================");
  console.log("  [HOÀN TẤT E2E] HỆ THỐNG ĐÃ VƯỢT QUA TOÀN BỘ KỊCH BẢN THỰC TẾ 100%!");
  console.log("==================================================================\n");
});
