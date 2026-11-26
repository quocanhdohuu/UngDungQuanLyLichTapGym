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

test("1. GET /api/nutrition/ingredients - Tìm kiếm nguyên liệu chuẩn", async () => {
  const res = await fetch(`${baseUrl}/api/nutrition/ingredients?q=gà`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, "success");
  assert(data.total > 0, "Phải tìm thấy ít nhất 1 nguyên liệu gà");
  const chicken = data.data.find((item) => item.code === "chicken_breast");
  assert(chicken, "Phải có ức gà phi lê trong danh sách");
  assert.equal(Number(chicken.proteinPerGram), 0.31);
});

test("2. POST /api/nutrition/analyze-image - Phân tích ảnh và quy đổi Macros", async () => {
  // Tạo 1 ảnh giả lập PNG nhỏ 10x10 byte
  const dummyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGqCYAAGv0B/0gqW4YAAAAAElFTkSuQmCC",
    "base64"
  );

  const formData = new FormData();
  formData.append("image", new Blob([dummyPng], { type: "image/png" }), "dish.png");

  const res = await fetch(`${baseUrl}/api/nutrition/analyze-image`, {
    method: "POST",
    body: formData,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, "success");
  assert(data.predictions.length > 0, "Phải trả về ít nhất 1 nguyên liệu dự đoán");
  assert(data.summary.totalKcal > 0, "Tổng calo ước tính phải > 0");

  const first = data.predictions[0];
  assert(first.code, "Dự đoán phải có mã code nguyên liệu");
  assert(first.calculatedKcal > 0, "Phải tính toán trước calo cho từng món");
});

test("3. POST /api/nutrition/log-meal - Lưu nhật ký bữa ăn & tính toán CSDL", async () => {
  // Lấy 1 profileId có thực trong DB
  const [userRows] = await db.promise().query("SELECT profileId FROM GymUsers LIMIT 1");
  const profileId = userRows[0]?.profileId || 1;

  // Lấy 2 nguyên liệu: ức gà (chicken_breast) và cơm trắng (white_rice)
  const [ingRows] = await db.promise().query(
    "SELECT ingredientId, code FROM NutritionIngredients WHERE code IN ('chicken_breast', 'white_rice')"
  );
  const chickenId = ingRows.find((i) => i.code === "chicken_breast")?.ingredientId;
  const riceId = ingRows.find((i) => i.code === "white_rice")?.ingredientId;

  const payload = {
    profileId,
    mealType: "LUNCH",
    mealDate: new Date().toISOString().slice(0, 10),
    note: "Bữa trưa tăng cơ (150g ức gà + 200g cơm trắng)",
    items: [
      {
        ingredientId: chickenId,
        aiConfidence: 0.95,
        aiEstimatedGrams: 140,
        userFinalGrams: 150, // 150g * 1.65 = 247.5 kcal
      },
      {
        ingredientId: riceId,
        aiConfidence: 0.88,
        aiEstimatedGrams: 200,
        userFinalGrams: 200, // 200g * 1.30 = 260.0 kcal
      },
    ],
  };

  const res = await fetch(`${baseUrl}/api/nutrition/log-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.status, "success");
  const meal = data.data;

  // Tổng calo kỳ vọng: 247.5 + 260 = 507.5 kcal
  assert.equal(meal.totalKcal, 507.5);
  assert(meal.totalProtein > 50, "Protein phải > 50g");
  assert.equal(meal.items.length, 2);

  // 4. Test GET /daily-summary
  const summaryRes = await fetch(
    `${baseUrl}/api/nutrition/daily-summary?profileId=${profileId}&date=${payload.mealDate}`
  );
  assert.equal(summaryRes.status, 200);
  const summaryData = await summaryRes.json();
  assert.equal(summaryData.status, "success");
  assert(summaryData.data.summary.totalKcal >= 507.5);
  assert(summaryData.data.meals.length >= 1);

  // 5. Test GET /meal/:mealLogId
  const detailRes = await fetch(
    `${baseUrl}/api/nutrition/meal/${meal.mealLogId}?profileId=${profileId}`
  );
  assert.equal(detailRes.status, 200);
  const detailData = await detailRes.json();
  assert.equal(detailData.data.mealLogId, meal.mealLogId);

  // 6. Test DELETE /meal/:mealLogId
  const deleteRes = await fetch(`${baseUrl}/api/nutrition/meal/${meal.mealLogId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId }),
  });
  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.status, "success");
});
