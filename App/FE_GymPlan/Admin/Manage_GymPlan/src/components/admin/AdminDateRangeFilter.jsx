import { useState } from "react";
import { AdminFilterSelect } from "./AdminControls";

const OPTIONS = [
  ["TODAY", "Hôm nay"],
  ["LAST_7_DAYS", "7 ngày qua"],
  ["LAST_30_DAYS", "30 ngày qua"],
  ["THIS_MONTH", "Tháng này"],
  ["THIS_YEAR", "Năm nay"],
  ["CUSTOM", "Tùy chỉnh"],
  ["ALL", "Toàn bộ thời gian"],
];

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01" || value > "9999-12-30") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export default function AdminDateRangeFilter({ value, onChange }) {
  const [selection, setSelection] = useState(value.range);
  const [startDate, setStartDate] = useState(value.startDate || "");
  const [endDate, setEndDate] = useState(value.endDate || "");
  const [error, setError] = useState("");

  const selectRange = (event) => {
    const range = event.target.value;
    setSelection(range);
    setError("");
    if (range !== "CUSTOM") onChange({ range });
  };

  const apply = (event) => {
    event.preventDefault();
    if (selection !== "CUSTOM") return;
    if (!validDate(startDate) || !validDate(endDate)) {
      setError("Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc hợp lệ.");
    } else if (startDate > endDate) {
      setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
    } else {
      setError("");
      onChange({ range: "CUSTOM", startDate, endDate });
    }
  };

  return (
    <form className="admin-card dashboard-date-filter" onSubmit={apply} noValidate>
      <div className="dashboard-date-controls">
        <AdminFilterSelect label="Thời gian" aria-label="Khoảng thời gian" value={selection} onChange={selectRange}>
          {OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </AdminFilterSelect>
        {selection === "CUSTOM" && <>
          <label className="dashboard-date-input">
            <span>Ngày bắt đầu</span>
            <input type="date" min="1000-01-01" max="9999-12-30" value={startDate}
              aria-invalid={Boolean(error)} aria-describedby={error ? "dashboard-date-error" : undefined}
              onChange={(event) => { setStartDate(event.target.value); setError(""); }} />
          </label>
          <label className="dashboard-date-input">
            <span>Ngày kết thúc</span>
            <input type="date" min="1000-01-01" max="9999-12-30" value={endDate}
              aria-invalid={Boolean(error)} aria-describedby={error ? "dashboard-date-error" : undefined}
              onChange={(event) => { setEndDate(event.target.value); setError(""); }} />
          </label>
          <button type="submit" className="admin-button">Áp dụng</button>
        </>}
      </div>
      {error && <p id="dashboard-date-error" className="admin-form-error" role="alert">{error}</p>}
    </form>
  );
}
