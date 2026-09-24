// Run with an Expo web dev server and PLAYWRIGHT_MODULE pointing to playwright.
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const db = require("../src/common/db");
const query = (sql, args = []) => db.promise().query(sql, args).then(([rows]) => rows);

async function run() {
  const fixture = "ui_" + Date.now();
  const password = "FixturePassword123";
  let accountId, profileId, exerciseId, server, browser;
  const screenshots = path.resolve(__dirname, "../../FE_GymPlan/Client_GymUser/GymPlan/.expo/verification");
  fs.mkdirSync(screenshots, { recursive: true });
  try {
    accountId = (await query("INSERT INTO Accounts (username, email, password, role) VALUES (?, ?, ?, 'GYM_USER')", [fixture, fixture + "@example.test", password])).insertId;
    profileId = (await query("INSERT INTO GymUsers (accountId, fullName, sessionsPerWeek) VALUES (?, 'UI Test User', 3)", [accountId])).insertId;
    exerciseId = (await query("INSERT INTO Exercises (name, description, difficulty) VALUES (?, 'Hướng dẫn từ thư viện kiểm thử.', 'EASY')", [fixture + " Exercise"])).insertId;
    const planId = (await query("INSERT INTO WorkoutPlans (title, creatorId, isTemplate, durationWeeks) VALUES (?, ?, TRUE, 8)", [fixture + " Plan", accountId])).insertId;
    const dayId = (await query("INSERT INTO WorkoutDays (planId, dayName, `order`, weekDay) VALUES (?, 'Test Day', 1, WEEKDAY(CURDATE()) + 1)", [planId])).insertId;
    await query("INSERT INTO ExerciseConfigs (exerciseId, dayId, sets, reps, restTime, `order`) VALUES (?, ?, 2, 10, 60, 1)", [exerciseId, dayId]);
    server = require("../src/app").listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    const apiUrl = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(25000);
    page.setDefaultNavigationTimeout(60000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    // Route the frontend's configured localhost API to this isolated test server.
    await page.route(/http:\/\/(localhost|127\.0\.0\.1):3000\//, async route => {
      const url = new URL(route.request().url());
      const response = await route.fetch({ url: apiUrl + url.pathname + url.search });
      await route.fulfill({ response });
    });
    await page.goto(process.env.GYM_WEB_URL || "http://localhost:8082", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Nhập email", { exact: true }).fill(fixture + "@example.test");
    await page.getByPlaceholder("Nhập mật khẩu", { exact: true }).fill(password);
    await page.getByText("ĐĂNG NHẬP  →", { exact: true }).click();
    await page.waitForURL("**/home");
    await page.getByText("Lịch mẫu", { exact: true }).click();
    await page.getByText(fixture + " Plan", { exact: true }).waitFor();
    await page.getByText(fixture + " Plan", { exact: true }).locator("..").getByRole("button", { name: "Xem chi tiết →" }).click();
    await page.getByRole("button", { name: "SỬ DỤNG LỊCH NÀY" }).click();
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.waitForURL("**/plans");
    await page.getByText("START WORKOUT (Test Day)", { exact: true }).click();
    await page.waitForURL("**/workout?**");
    await page.getByLabel("Khối lượng hiệp 1 (kg)").fill("25");
    await page.getByRole("button", { name: "Xác nhận hiệp", exact: true }).first().click();
    await page.getByRole("button", { name: "✓ Đã lưu", exact: true }).waitFor();
    await page.getByRole("button", { name: "+30s", exact: true }).waitFor();
    await page.screenshot({ path: path.join(screenshots, "workout.png"), fullPage: true });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "✓ Đã lưu", exact: true }).waitFor();
    assert.equal(Number(await page.getByLabel("Khối lượng hiệp 1 (kg)").inputValue()), 25);
    await page.getByRole("button", { name: "Hoàn thành bài tập", exact: true }).click();
    await page.getByRole("button", { name: "KẾT THÚC BUỔI TẬP", exact: true }).click();
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.waitForURL(/\/history\/\d+/);
    await page.getByText("25 kg × 10 lần", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Xem tiến trình", exact: true }).click();
    await page.waitForURL("**/progress");
    await page.getByText("PR MỚI", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(screenshots, "progress.png"), fullPage: true });
    await page.getByRole("tab", { name: "Thư viện", exact: true }).click();
    await page.getByPlaceholder("Tìm kiếm bài tập (vd: Bench, Squa...").fill(fixture);
    await page.getByText(fixture + " Exercise", { exact: true }).click();
    await page.waitForURL(/\/exercises\/\d+/);
    await page.getByText("Kỷ lục của bạn", { exact: true }).waitFor();
    await page.getByText("25 KG", { exact: true }).waitFor();
    await page.goto((process.env.GYM_WEB_URL || "http://localhost:8082") + "/plans", { waitUntil: "domcontentloaded" });
    await page.getByText("Tạo lịch mới", { exact: true }).click();
    await page.getByLabel("Tên chương trình", { exact: true }).fill(fixture + " Custom");
    await page.getByRole("button", { name: "+ Thêm bài tập", exact: true }).click();
    await page.getByLabel("Tìm bài tập", { exact: true }).fill(fixture);
    await page.getByRole("button", { name: fixture + " Exercise", exact: true }).click();
    await page.getByRole("button", { name: "LƯU VÀ ÁP DỤNG LỊCH", exact: true }).click();
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.waitForURL("**/plans");
    await page.getByText(fixture + " Custom", { exact: true }).waitFor();
    await page.goto((process.env.GYM_WEB_URL || "http://localhost:8082") + "/profile", { waitUntil: "domcontentloaded" });
    await page.getByText("Đổi mật khẩu & Bảo mật", { exact: true }).click();
    await page.getByLabel("Mật khẩu hiện tại").fill(password);
    await page.getByLabel("Mật khẩu mới (6–255 ký tự)").fill("ChangedPassword123");
    await page.getByLabel("Nhập lại mật khẩu mới").fill("ChangedPassword123");
    await page.getByRole("button", { name: "Lưu mật khẩu", exact: true }).click();
    await page.getByText("✓ Đã đổi mật khẩu thành công.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.getByText("Đăng xuất", { exact: true }).click();
    await page.getByPlaceholder("Nhập email", { exact: true }).waitFor();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Nhập email", { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log("PASS: login → template → workout → reload/resume → history → PR → exercise detail → custom plan → password → logout.");
  } catch (error) {
    if (browser) for (const context of browser.contexts()) for (const page of context.pages()) {
      await page.screenshot({ path: path.join(screenshots, "failure.png"), fullPage: true }).catch(() => {});
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (profileId) await query("DELETE FROM WorkoutSessions WHERE profileId = ?", [profileId]);
    if (accountId) {
      await query("DELETE FROM WorkoutPlans WHERE creatorId = ?", [accountId]);
      await query("DELETE FROM Accounts WHERE accountId = ?", [accountId]);
    }
    if (exerciseId) await query("DELETE FROM Exercises WHERE exerciseId = ?", [exerciseId]);
    await db.promise().end();
  }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
