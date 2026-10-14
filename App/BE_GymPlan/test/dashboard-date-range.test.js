const { test, before, after, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const db = require("../src/common/db");
const { resolveDateRange, fillUserGrowth, todayInTimeZone } = require("../src/utils/dashboardDateRange");

const now = new Date("2026-01-01T17:30:00Z"); // Jan 2 in UTC+7.
test("UTC+7 presets include today, cross year boundaries and default to this month", () => {
  assert.equal(todayInTimeZone(now), "2026-01-02");
  for (const [range, start, end, group] of [
    ["TODAY", "2026-01-02", "2026-01-02", "DAY"],
    ["LAST_7_DAYS", "2025-12-27", "2026-01-02", "DAY"],
    ["LAST_30_DAYS", "2025-12-04", "2026-01-02", "DAY"],
    ["THIS_MONTH", "2026-01-01", "2026-01-31", "DAY"],
    ["THIS_YEAR", "2026-01-01", "2026-12-31", "MONTH"],
    ["ALL", null, null, "MONTH"],
  ]) {
    const period = resolveDateRange({ range }, now);
    assert.deepEqual([period.startDate, period.endDate, period.groupBy], [start, end, group]);
  }
  assert.equal(resolveDateRange({}, now).range, "THIS_MONTH");
  assert.equal(resolveDateRange({}, new Date("2024-02-15T12:00:00Z")).endDate, "2024-02-29");
});

test("custom ranges reject malformed, impossible, partial, reversed and out-of-domain dates", () => {
  for (const query of [
    { range: "INVALID" }, { range: ["ALL"] }, { range: "CUSTOM" },
    { range: "CUSTOM", startDate: "2026-01-01" },
    { range: "CUSTOM", startDate: "2026-02-29", endDate: "2026-03-01" },
    { range: "CUSTOM", startDate: "2026-04-31", endDate: "2026-05-01" },
    { range: "CUSTOM", startDate: "2026-1-01", endDate: "2026-01-03" },
    { range: "CUSTOM", startDate: "2026-01-01T00:00:00Z", endDate: "2026-01-03" },
    { range: "CUSTOM", startDate: "2026-01-03", endDate: "2026-01-02" },
    { range: "CUSTOM", startDate: "0999-01-01", endDate: "2026-01-02" },
    { range: "CUSTOM", startDate: "9999-12-30", endDate: "9999-12-31" },
    { range: "CUSTOM", startDate: ["2026-01-01"], endDate: "2026-01-03" },
    { range: "ALL", startDate: "2026-01-01" },
  ]) assert.throws(() => resolveDateRange(query, now), (error) => error.status === 400);
  assert.equal(resolveDateRange({ range: "CUSTOM", startDate: "2024-02-29", endDate: "2024-02-29" }, now).groupBy, "DAY");
});

test("growth fills ordered daily/monthly zeros, including partial and empty periods", () => {
  const daily = resolveDateRange({ range: "CUSTOM", startDate: "2024-02-28", endDate: "2024-03-01" }, now);
  assert.deepEqual(fillUserGrowth([{ monthKey: "2024-02-29", totalUsers: 3 }], daily), [
    { monthKey: "2024-02-28", monthLabel: "28/02/2024", totalUsers: 0 },
    { monthKey: "2024-02-29", monthLabel: "29/02/2024", totalUsers: 3 },
    { monthKey: "2024-03-01", monthLabel: "01/03/2024", totalUsers: 0 },
  ]);
  const monthly = resolveDateRange({ range: "CUSTOM", startDate: "2025-11-17", endDate: "2026-01-03" }, now);
  assert.deepEqual(fillUserGrowth([], monthly).map((row) => row.monthKey), ["2025-11", "2025-12", "2026-01"]);
  const all = resolveDateRange({ range: "ALL" }, now);
  assert.deepEqual(fillUserGrowth([], all, now), [{ monthKey: "2026-01", monthLabel: "01/2026", totalUsers: 0 }]);
  assert.deepEqual(fillUserGrowth([{ monthKey: "2025-11", totalUsers: 1 }], all, now).map(row => row.totalUsers), [1, 0, 0]);
  const upper = resolveDateRange({ range: "CUSTOM", startDate: "9999-11-01", endDate: "9999-12-30" }, now);
  assert.equal(fillUserGrowth([], upper).length, 2);
});

test("legacy growth months parameter remains validated and supported", () => {
  const period = resolveDateRange({ months: "6" }, now);
  assert.deepEqual([period.startDate, period.endDate, period.groupBy], ["2025-08-01", "2026-01-31", "MONTH"]);
  for (const months of ["0", "-1", "1.5", "abc", ["6"], "999999"])
    assert.throws(() => resolveDateRange({ months }, now), (error) => error.status === 400);
});

let server;
let baseUrl;
before(async () => {
  const app = express();
  app.use("/api/dashboard", require("../src/routes/dashboard.route"));
  server = app.listen(0, "127.0.0.1");
  await new Promise((done) => server.once("listening", done));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/dashboard`;
});
afterEach(() => mock.restoreAll());
after(async () => {
  await new Promise((done) => server.close(done));
  await db.promise().end();
});
const paths = ["summary", "user-growth", "workout-activity", "recent-users", "recent-workout-templates"];

test("every filterable endpoint rejects invalid ranges before reaching MySQL", async () => {
  mock.method(db, "promise", () => { throw new Error("Invalid dates reached database"); });
  for (const path of paths) {
    for (const query of ["range=CUSTOM", "range=UNKNOWN", "range=CUSTOM&startDate=2026-02-30&endDate=2026-03-01", "range=CUSTOM&startDate=2026-03-02&endDate=2026-03-01", "range=ALL&range=TODAY"]) {
      assert.equal((await fetch(`${baseUrl}/${path}?${query}`)).status, 400);
    }
  }
});

test("endpoints pass the same bounded range to the intended SP and preserve response fields", async () => {
  const calls = [];
  mock.method(db, "promise", () => ({ query: async (sql, params) => {
    calls.push([sql.replace(/\s/g, ""), params]);
    return [[sql.includes("Summary") ? [{ totalUsers: 52, newUsersThisMonth: 0 }] : []]];
  } }));
  for (const path of paths) {
    const response = await fetch(`${baseUrl}/${path}?range=CUSTOM&startDate=2024-02-28&endDate=2024-03-01&limit=5`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.period.timeZone, "Asia/Ho_Chi_Minh");
    assert.equal(body.period.startDate, "2024-02-28");
    if (path === "user-growth") assert.deepEqual(body.data.map(row => row.totalUsers), [0, 0, 0]);
    if (path === "summary") assert.equal(body.data.totalUsers, 52);
  }
  assert.deepEqual(calls, [
    ["CALLsp_GetDashboardSummary(?,?)", ["2024-02-28", "2024-03-01"]],
    ["CALLsp_GetDashboardUserGrowth(?,?,?)", ["2024-02-28", "2024-03-01", "DAY"]],
    ["CALLsp_GetDashboardWorkoutActivity(?,?)", ["2024-02-28", "2024-03-01"]],
    ["CALLsp_GetDashboardRecentUsers(?,?,?)", [5, "2024-02-28", "2024-03-01"]],
    ["CALLsp_GetDashboardRecentWorkoutTemplates(?,?,?)", [5, "2024-02-28", "2024-03-01"]],
  ]);
});

test("ALL sends NULL bounds; exercise statistics remain global", async () => {
  const calls = [];
  mock.method(db, "promise", () => ({ query: async (sql, params) => { calls.push([sql, params]); return [[[]]]; } }));
  for (const path of paths) assert.equal((await fetch(`${baseUrl}/${path}?range=ALL`)).status, 200);
  assert.deepEqual(calls.map(([,params]) => params), [[null,null], [null,null,"MONTH"], [null,null], [5,null,null], [null,null,null]]);
  const response = await fetch(`${baseUrl}/exercise-statistics`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, []);
  assert.equal(calls.at(-1)[0], "CALL sp_GetDashboardExerciseStatistics()");
});

test("missing activity procedure and database errors are not reported as empty success", async () => {
  mock.method(db, "promise", () => ({ query: async () => { throw new Error("Routine doesn't exist"); } }));
  for (const path of paths) assert.equal((await fetch(`${baseUrl}/${path}?range=TODAY`)).status, 500);
});
