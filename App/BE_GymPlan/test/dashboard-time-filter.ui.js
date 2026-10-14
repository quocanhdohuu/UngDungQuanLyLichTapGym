// Read-only browser regression against the dashboard SPs. No database writes.
// Start Admin Vite first, then set GYM_ADMIN_URL / PLAYWRIGHT_MODULE if needed.
const assert = require("node:assert/strict");
const express = require("express");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const db = require("../src/common/db");

async function run() {
  const app = express();
  app.use("/api/dashboard", require("../src/routes/dashboard.route"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((done) => server.once("listening", done));
  const api = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const requests = [];
    const pageErrors = [];
    let failRange;
    let delayRange;
    const held = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript(() => localStorage.setItem("admin_auth", JSON.stringify({
      accountId: 0, username: "Dashboard QA", role: "ADMIN", status: "ACTIVE",
    })));
    await page.route("http://localhost:3000/api/dashboard/**", async (route) => {
      const url = new URL(route.request().url());
      requests.push(url.pathname + url.search);
      if (url.searchParams.get("range") === failRange) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Lỗi mạng kiểm thử" }) });
        return;
      }
      const response = await fetch(api + url.pathname + url.search);
      const body = await response.text();
      if (url.searchParams.get("range") === delayRange) {
        await new Promise((resolve) => held.push(resolve));
      }
      await route.fulfill({ status: response.status, contentType: "application/json", body });
    });
    await page.goto((process.env.GYM_ADMIN_URL || "http://127.0.0.1:5175") + "/admin/dashboard");
    await page.locator(".dashboard-kpis").waitFor();
    assert.equal(await page.getByLabel("Khoảng thời gian").inputValue(), "THIS_MONTH");
    assert.equal(requests.length, 6, "StrictMode should not duplicate initial requests");
    const screenshot = path.join(os.tmpdir(), "gym-dashboard-time-filter.png");
    await page.screenshot({ path: screenshot, fullPage: true });

    const settle = () => page.waitForFunction(() => !document.querySelector(".dashboard-load-status [role=status]"));
    const select = async (range) => {
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("/recent-workout-templates?") && new URL(response.url()).searchParams.get("range") === range),
        page.getByLabel("Khoảng thời gian").selectOption(range),
      ]);
      await settle();
    };
    const originalTotalUsers = await page.locator(".dashboard-kpi-value").nth(0).innerText();
    const originalExercises = await page.locator(".dashboard-kpi-value").nth(1).innerText();
    for (const range of ["TODAY", "LAST_7_DAYS", "LAST_30_DAYS", "THIS_YEAR", "ALL", "THIS_MONTH"]) {
      const count = requests.length;
      await select(range);
      assert.equal(requests.length - count, 5, range + " should fetch only time-filtered endpoints");
      assert.equal(await page.locator(".dashboard-kpi-value").nth(0).innerText(), originalTotalUsers);
      assert.equal(await page.locator(".dashboard-kpi-value").nth(1).innerText(), originalExercises);
      assert.equal(await page.locator(".dashboard-load-status [role=alert]").count(), 0);
    }
    const beforeDraft = requests.length;
    await page.getByLabel("Khoảng thời gian").selectOption("CUSTOM");
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    await page.locator("#dashboard-date-error").waitFor();
    await page.getByLabel("Ngày bắt đầu", { exact: true }).fill("2026-10-10");
    await page.getByLabel("Ngày kết thúc", { exact: true }).fill("2026-10-01");
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    assert.match(await page.locator("#dashboard-date-error").innerText(), /lớn hơn/);
    assert.equal(requests.length, beforeDraft, "unfinished and reversed custom dates must not request data");
    await page.getByLabel("Ngày bắt đầu", { exact: true }).fill("2024-02-29");
    await page.getByLabel("Ngày kết thúc", { exact: true }).fill("2024-02-29");
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/recent-workout-templates?") && response.url().includes("range=CUSTOM")),
      page.getByRole("button", { name: "Áp dụng", exact: true }).click(),
    ]);
    await settle();
    assert.match(await page.locator(".dashboard-load-status").innerText(), /29\/02\/2024/);
    assert.deepEqual((await page.locator(".dashboard-kpi-value").allInnerTexts()).slice(2), ["0", "0", "0"]);
    assert.equal(await page.locator(".dashboard-chart-bar").count(), 1);
    assert.equal(await page.locator(".dashboard-chart-bar").evaluate((element) => element.style.height), "0px");
    const beforeRepeat = requests.length;
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    await page.getByLabel("Ngày bắt đầu", { exact: true }).fill("2024-02-28");
    assert.equal(requests.length, beforeRepeat, "same applied filter and changed drafts should not request data");

    const beforeError = await page.locator(".dashboard-kpis").innerText();
    failRange = "THIS_YEAR";
    await select("THIS_YEAR");
    await page.locator(".dashboard-load-status [role=alert]").waitFor();
    assert.equal(await page.locator(".dashboard-kpis").innerText(), beforeError);
    assert.match(await page.locator(".dashboard-load-status").innerText(), /29\/02\/2024/);
    failRange = undefined;
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/recent-workout-templates?")),
      page.getByRole("button", { name: "Thử lại", exact: true }).click(),
    ]);
    await settle();
    assert.equal(await page.locator(".dashboard-load-status [role=alert]").count(), 0);

    delayRange = "LAST_30_DAYS";
    await page.getByLabel("Khoảng thời gian").selectOption(delayRange);
    await page.locator(".dashboard-load-status [role=status]").waitFor();
    await select("TODAY");
    const newestData = await page.locator(".dashboard-kpis").innerText();
    // Wait for all old requests to reach the delay, then release their stale responses.
    for (let attempt = 0; held.length < 5 && attempt < 100; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(held.length, 5);
    const staleResponses = page.waitForResponse((response) => response.url().includes("/recent-workout-templates?") && response.url().includes("LAST_30_DAYS"));
    held.forEach((resolve) => resolve());
    await staleResponses;
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator(".dashboard-kpis").innerText(), newestData);
    // Existing Admin layout has a 760px minimum width; preserve that contract.
    await page.setViewportSize({ width: 760, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "page should fit the existing minimum Admin width");
    await page.getByLabel("Khoảng thời gian").selectOption("CUSTOM");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "custom controls should fit the existing Admin layout");
    await page.locator(".dashboard-date-filter").screenshot({ path: path.join(os.tmpdir(), "gym-dashboard-custom-filter.png") });
    assert.deepEqual(pageErrors, []);
    console.log("PASS: real dashboard UI, all presets, custom validation, zeros, deduplication, unchanged global totals, failed reload/retry, stale-response protection, existing Admin minimum width.");
    console.log("Screenshot: " + screenshot);
  } finally {
    if (browser) await browser.close();
    await new Promise((done) => server.close(done));
    await db.promise().end();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
