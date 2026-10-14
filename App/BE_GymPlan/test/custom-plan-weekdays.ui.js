// Requires Expo web; API responses are isolated fixtures and never write to MySQL.
// Run: GYM_WEB_URL=http://localhost:8081 PLAYWRIGHT_MODULE=... node test/custom-plan-weekdays.ui.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(25000);
    const saves = [];
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => sessionStorage.setItem("gymplan.session.v1", JSON.stringify({
      accountId: 71, profileId: 93, loginSessionId: 123, accessToken: "weekday-ui-fixture",
    })));
    await page.route(/http:\/\/[^/]+:3000\//, async route => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      let data = null;
      if (request.method() === "POST" && pathname === "/api/user/93/plans") {
        saves.push(request.postDataJSON());
        data = { planId: 28 };
      } else if (pathname.includes("exercises")) {
        data = [{ exerciseId: 19, name: "Weekday test exercise", difficulty: "EASY" }];
      }
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data }) });
    });
    await page.goto((process.env.GYM_WEB_URL || "http://localhost:8081") + "/plans/create", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Tên chương trình", { exact: true }).fill("Weekday regression test");
    await page.getByRole("button", { name: "+ Thêm ngày tập", exact: true }).click();
    for (let index = 0; index < 2; index++) {
      await page.getByRole("button", { name: "+ Thêm bài tập", exact: true }).nth(index).click();
      await page.getByRole("button", { name: "Weekday test exercise", exact: true }).click();
    }
    await page.getByRole("button", { name: "T2", exact: true }).nth(1).click();
    await page.getByRole("button", { name: "LƯU VÀ ÁP DỤNG LỊCH", exact: true }).click();
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Các ngày tập không được trùng thứ." }).waitFor();
    assert.equal(saves.length, 0, "duplicate weekdays must be rejected before an API request");
    assert.ok(new URL(page.url()).pathname.endsWith("/plans/create"));
    const screenshots = path.resolve(__dirname, "../../FE_GymPlan/Client_GymUser/GymPlan/.expo/verification");
    fs.mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: path.join(screenshots, "custom-plan-duplicate-monday.png"), fullPage: true });
    await page.getByRole("button", { name: "Quay lại", exact: true }).click();
    await page.getByRole("button", { name: "T3", exact: true }).nth(1).click();
    await page.getByRole("button", { name: "LƯU VÀ ÁP DỤNG LỊCH", exact: true }).click();
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.waitForURL("**/plans");
    assert.equal(saves.length, 1);
    assert.deepEqual(saves[0].days.map(day => day.weekDay), [1, 2]);
    assert.deepEqual(errors, []);
    console.log("PASS: two Mondays show validation error without POST; changing to Tuesday submits successfully (mock API).");
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
