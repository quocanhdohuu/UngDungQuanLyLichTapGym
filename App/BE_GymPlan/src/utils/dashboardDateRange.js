const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = "Asia/Ho_Chi_Minh";

const invalid = (message) => Object.assign(new Error(message), { status: 400 });
const calendarDate = (value) => new Date(`${value}T00:00:00.000Z`);
const dateString = (value) => value.toISOString().slice(0, 10);

function todayInTimeZone(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)
      || value < "1000-01-01" || value > "9999-12-30") return false;
  const parsed = calendarDate(value);
  return Number.isFinite(parsed.getTime()) && dateString(parsed) === value;
}

function resolveDateRange(query = {}, now = new Date()) {
  const today = todayInTimeZone(now);
  const range = query.range === undefined ? "THIS_MONTH" : query.range;
  let startDate;
  let endDate;
  let groupBy;

  // Preserve the existing user-growth?months=N request when no new filter is sent.
  if (query.range === undefined && query.months !== undefined) {
    const months = typeof query.months === "string" && /^\d+$/.test(query.months)
      ? Number(query.months) : NaN;
    if (!Number.isInteger(months) || months <= 0 || months > 108000) {
      throw invalid("months không hợp lệ");
    }
    const start = calendarDate(`${today.slice(0, 7)}-01`);
    start.setUTCMonth(start.getUTCMonth() - months + 1);
    startDate = dateString(start);
    const end = calendarDate(`${today.slice(0, 7)}-01`);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    endDate = dateString(end);
    groupBy = "MONTH";
  } else {
    if (range !== "CUSTOM" && (query.startDate !== undefined || query.endDate !== undefined)) {
      throw invalid("Chỉ dùng startDate/endDate với khoảng Tùy chỉnh");
    }
    switch (range) {
      case "ALL":
        return { range, startDate: null, endDate: null, groupBy: "MONTH", timeZone: TIME_ZONE };
      case "TODAY":
        startDate = endDate = today;
        break;
      case "LAST_7_DAYS":
      case "LAST_30_DAYS": {
        const days = range === "LAST_7_DAYS" ? 7 : 30;
        startDate = dateString(new Date(calendarDate(today).getTime() - (days - 1) * DAY_MS));
        endDate = today;
        break;
      }
      case "THIS_MONTH": {
        startDate = `${today.slice(0, 7)}-01`;
        const end = calendarDate(startDate);
        end.setUTCMonth(end.getUTCMonth() + 1, 0);
        endDate = dateString(end);
        break;
      }
      case "THIS_YEAR":
        startDate = `${today.slice(0, 4)}-01-01`;
        endDate = `${today.slice(0, 4)}-12-31`;
        break;
      case "CUSTOM":
        ({ startDate, endDate } = query);
        break;
      default:
        throw invalid("Khoảng thời gian không hợp lệ");
    }
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw invalid("Vui lòng nhập ngày hợp lệ (YYYY-MM-DD), từ 1000-01-01 đến 9999-12-30");
  }
  if (startDate > endDate) throw invalid("Ngày bắt đầu không được lớn hơn ngày kết thúc");
  const days = (calendarDate(endDate) - calendarDate(startDate)) / DAY_MS + 1;
  return {
    range: query.months !== undefined && query.range === undefined ? "CUSTOM" : range,
    startDate, endDate, groupBy: groupBy || (days <= 31 ? "DAY" : "MONTH"), timeZone: TIME_ZONE,
  };
}

function fillUserGrowth(rows, period, now = new Date()) {
  const monthly = period.groupBy === "MONTH";
  const values = new Map(rows.map((row) => [row.monthKey, Number(row.totalUsers)]));
  const keys = [...values.keys()].sort();
  const currentMonth = todayInTimeZone(now).slice(0, 7);
  const first = period.startDate || `${keys[0] || currentMonth}-01`;
  const last = period.endDate || `${[currentMonth, keys.at(-1) || currentMonth].sort().at(-1)}-01`;
  const cursor = calendarDate(monthly ? `${first.slice(0, 7)}-01` : first);
  const endKey = monthly ? last.slice(0, 7) : last;
  const result = [];
  while (true) {
    const key = dateString(cursor).slice(0, monthly ? 7 : 10);
    if (key > endKey) break;
    result.push({ monthKey: key, monthLabel: key.split("-").reverse().join("/"), totalUsers: values.get(key) || 0 });
    if (key === endKey) break;
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

module.exports = { resolveDateRange, fillUserGrowth, todayInTimeZone, isValidDate };
