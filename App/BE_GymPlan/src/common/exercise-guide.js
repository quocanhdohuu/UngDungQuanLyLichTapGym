// Repository content supplements legacy descriptions without changing the DB schema.
// An explicitly authored guide in description takes precedence over this catalog.
const catalog = {
  "barbell bench press": {
    steps: [
      "Nằm trên ghế phẳng, đặt hai bàn chân vững trên sàn.",
      "Nắm thanh hơi rộng hơn vai, giữ bả vai ổn định và siết cơ bụng.",
      "Đẩy thanh lên có kiểm soát, giữ vai ổn định trong suốt chuyển động.",
      "Hạ thanh chậm về phía ngực, giữ kiểm soát trước lần lặp tiếp theo.",
    ],
    mistakes: ["Hạ tạ quá nhanh.", "Ưỡn lưng quá mức để nâng tạ.", "Chọn mức tạ khiến không giữ được tư thế."],
    source: { title: "NASM — Barbell Bench Press", url: "https://www.nasm.org/resource-center/exercise-library/barbell-bench-press" },
  },
  "barbell squat": {
    steps: [
      "Đặt thanh trên giá thấp hơn vai; tựa thanh lên phần lưng trên, nắm rộng hơn vai.",
      "Giữ ngực nâng và lưng ổn định; đứng lên đưa thanh khỏi giá rồi bước lùi.",
      "Đặt chân hơi rộng hơn vai, đưa hông ra sau và hạ người có kiểm soát.",
      "Ấn bàn chân xuống sàn, duỗi hông và gối để trở lại tư thế đứng.",
    ],
    mistakes: ["Để lưng mất ổn định khi hạ người.", "Đặt thanh trực tiếp lên cổ thay vì phần lưng trên."],
    source: { title: "ACE — Back Squat", url: "https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/" },
  },
  deadlift: {
    steps: [
      "Đứng chân rộng bằng hông, thanh ở trên giữa bàn chân; nắm chắc thanh bằng hai tay.",
      "Siết cơ bụng và tạo lực căng trước khi nhấc thanh khỏi sàn.",
      "Ấn chân xuống sàn, duỗi hông và gối; giữ lưng trung lập và thanh gần người.",
      "Đẩy hông ra sau, gập gối và hạ thanh về sàn có kiểm soát.",
    ],
    mistakes: ["Cong lưng khi kéo tạ.", "Để thanh đi xa khỏi cơ thể.", "Giật mạnh thanh lên bằng đà."],
    source: { title: "NASM — Barbell Deadlift", url: "https://www.nasm.org/resource-center/exercise-library/barbell-deadlift" },
  },
};

const normalize = text => text.trim().toLowerCase().replace(/\s+/g, " ");
const numberedLine = /^(?:bước\s*)?(\d+)[.):\-]\s*(.+)$/i;

function parseGuide(description) {
  const lines = String(description || "").replace(/\r\n?/g, "\n").split("\n").map(line => line.trim()).filter(Boolean);
  const start = lines.findIndex(line => /^(?:hướng dẫn(?: thực hiện)?|instructions):?$/i.test(line));
  const end = lines.findIndex((line, index) => index > start && /^(?:lỗi thường gặp|common mistakes):?$/i.test(line));
  if (start < 0 || end < 0) return null;
  const stepLines = lines.slice(start + 1, end);
  // Reject incomplete, unordered or arbitrary prose rather than manufacture steps.
  if (stepLines.length !== 4) return null;
  const steps = stepLines.map((line, index) => {
    const match = line.match(numberedLine);
    return match && Number(match[1]) === index + 1 ? match[2] : null;
  });
  if (steps.some(step => !step)) return null;
  const mistakes = lines.slice(end + 1).map(line => line.replace(/^(?:[-•*]|\d+[.)])\s*/, "")).filter(Boolean);
  return mistakes.length ? { steps, mistakes } : null;
}

function getExerciseGuide(exercise) {
  const authored = parseGuide(exercise.description);
  const key = normalize(exercise.name || "");
  return authored || (Object.hasOwn(catalog, key) ? catalog[key] : null);
}

module.exports = { getExerciseGuide, parseGuide };
