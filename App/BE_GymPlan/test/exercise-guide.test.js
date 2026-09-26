const test = require("node:test");
const assert = require("node:assert/strict");
const { getExerciseGuide, parseGuide } = require("../src/common/exercise-guide");
const authored = "Mô tả.\r\nHướng dẫn thực hiện:\r\n1. Chuẩn bị.\r\n2. Vào vị trí.\r\n3. Thực hiện.\r\n4. Trở lại.\r\nLỗi thường gặp:\r\n- Lỗi đã biên soạn.";
test("authored description overrides catalog with four ordered steps", () => {
  const guide = getExerciseGuide({ name: "Barbell Bench Press", description: authored });
  assert.deepEqual(guide.steps, ["Chuẩn bị.", "Vào vị trí.", "Thực hiện.", "Trở lại."]);
  assert.deepEqual(guide.mistakes, ["Lỗi đã biên soạn."]);
  assert.equal(guide.source, undefined);
});
test("plain or incomplete descriptions do not become four-step guides", () => {
  for (const value of [null, "Bài tập ngực.", authored.replace("3. Thực hiện.\r\n", ""), authored.replace("3. Thực hiện.", "2. Sai thứ tự."), authored.split("Lỗi thường gặp:")[0]]) assert.equal(parseGuide(value), null);
  assert.equal(getExerciseGuide({ name: "Unrecognized exercise", description: "No guide" }), null);
});
test("curated guides match exact normalized names and include sources", () => {
  for (const name of ["  BARBELL   BENCH PRESS  ", "Barbell Squat", "Deadlift"]) {
    const guide = getExerciseGuide({ name });
    assert.equal(guide.steps.length, 4);
    assert.ok(guide.mistakes.length > 0);
    assert.match(guide.source.url, /^https:\/\/(www\.nasm\.org|www\.acefitness\.org)\//);
  }
  assert.equal(getExerciseGuide({ name: "Incline Barbell Bench Press" }), null);
  for (const name of ["constructor", "__proto__", "toString"]) assert.equal(getExerciseGuide({ name }), null);
});
