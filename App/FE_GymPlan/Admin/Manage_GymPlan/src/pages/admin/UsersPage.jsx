import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:3000/api/users";
const PAGE_SIZE = 5;
const FREQUENCY_OPTIONS = [
  { value: "ALL", label: "Tất cả lịch" },
  { value: "1-2", label: "1-2 buổi/tuần" },
  { value: "3-4", label: "3-4 buổi/tuần" },
  { value: "5-7", label: "5-7 buổi/tuần" },
];

const emptyForm = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  gender: "",
  level: "",
  goal: "",
  sessionsPerWeek: "",
  status: "ACTIVE",
};

const displayValue = (value) => value || "-";
const getStatus = (user) => user.accountStatus || user.profileStatus || "";
const getInitials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch {
    return fallback;
  }
};

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [formMode, setFormMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Không thể tải danh sách người dùng.",
          ),
        );
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || "Không thể tải danh sách người dùng.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              "Không thể tải danh sách người dùng.",
            ),
          );
        }
        const data = await response.json();
        if (isMounted) setUsers(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.message || "Không thể tải danh sách người dùng.",
          );
          setUsers([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const statusOptions = useMemo(
    () => [...new Set(users.map(getStatus).filter(Boolean))],
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const searchable = [
        user.profileId,
        user.accountId,
        user.fullName,
        user.username,
        user.email,
      ]
        .join(" ")
        .toLowerCase();
      const sessions = Number(user.sessionsPerWeek);
      const matchesFrequency =
        frequencyFilter === "ALL" ||
        (frequencyFilter === "1-2" && sessions >= 1 && sessions <= 2) ||
        (frequencyFilter === "3-4" && sessions >= 3 && sessions <= 4) ||
        (frequencyFilter === "5-7" && sessions >= 5 && sessions <= 7);

      return (
        (!query || searchable.includes(query)) &&
        (levelFilter === "ALL" || user.level === levelFilter) &&
        (statusFilter === "ALL" || getStatus(user) === statusFilter) &&
        matchesFrequency
      );
    });
  }, [users, searchTerm, levelFilter, statusFilter, frequencyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setLevelFilter("ALL");
    setStatusFilter("ALL");
    setFrequencyFilter("ALL");
    setCurrentPage(1);
  };

  const openAddForm = () => {
    setFormMode("add");
    setSelectedUser(null);
    setForm({ ...emptyForm });
    setFormError("");
  };

  const openEditForm = (user) => {
    setFormMode("edit");
    setSelectedUser(user);
    setForm({
      ...emptyForm,
      username: user.username || "",
      email: user.email || "",
      fullName: user.fullName || "",
      gender: user.gender || "",
      level: user.level || "",
      goal: user.goal || "",
      sessionsPerWeek: user.sessionsPerWeek ?? "",
      status: getStatus(user) || "ACTIVE",
    });
    setFormError("");
  };

  const closeForm = () => {
    if (!formLoading) setFormMode(null);
  };
  const updateForm = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submitForm = async (event) => {
    event.preventDefault();
    if (formLoading) return;
    setFormError("");
    if (!form.username.trim() || !form.email.trim() || !form.fullName.trim()) {
      setFormError("Vui lòng nhập username, email và họ tên.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setFormError("Email không hợp lệ.");
      return;
    }
    if (formMode === "add" && !form.password) {
      setFormError("Mật khẩu không được để trống.");
      return;
    }
    if (
      form.sessionsPerWeek !== "" &&
      (Number(form.sessionsPerWeek) < 0 || Number(form.sessionsPerWeek) > 7)
    ) {
      setFormError("Số buổi tập mỗi tuần phải từ 0 đến 7.");
      return;
    }

    setFormLoading(true);
    const payload = {
      ...form,
      sessionsPerWeek:
        form.sessionsPerWeek === "" ? null : Number(form.sessionsPerWeek),
    };
    if (formMode === "edit") delete payload.password;

    try {
      const response = await fetch(
        formMode === "edit" ? `${API_URL}/${selectedUser.profileId}` : API_URL,
        {
          method: formMode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Không thể lưu người dùng."),
        );
      }
      await loadUsers();
      setFormMode(null);
      setNotice(
        formMode === "edit"
          ? "Cập nhật người dùng thành công."
          : "Thêm người dùng thành công.",
      );
      window.setTimeout(() => setNotice(""), 3000);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setFormLoading(false);
    }
  };

  const exportExcel = () => {
    const rows = filteredUsers.map((user, index) => ({
      STT: index + 1,
      "Họ tên": user.fullName,
      Username: user.username,
      Email: user.email,
      "Giới tính": user.gender,
      "Trình độ": user.level,
      "Mục tiêu": user.goal,
      "Số buổi/tuần": user.sessionsPerWeek,
      "Trạng thái": getStatus(user),
      "Ngày tạo": user.createdAt,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gym Users");
    XLSX.writeFile(workbook, "gymforlife-users.xlsx");
  };

  return (
    <div className="users-page">
      <div className="page-header-row">
        <div className="breadcrumbs">
          <span className="current">Người dùng</span>
        </div>
        <div className="page-header-actions">
          <button type="button" className="secondary-btn" onClick={exportExcel}>
            Xuất file Excel
          </button>
          <button type="button" className="primary-btn" onClick={openAddForm}>
            THÊM NGƯỜI DÙNG
          </button>
        </div>
      </div>

      <div className="page-title-row">
        <div>
          <h1>Quản lý người dùng</h1>
        </div>
      </div>
      <p className="page-description">
        Quản lý tài khoản, thể trạng và trạng thái hoạt động của người dùng
        GYMFORLIFE.
      </p>

      <div className="user-controls">
        <div className="search-box">
          <span className="search-inline">⌕</span>
          <input
            value={searchTerm}
            onChange={updateFilter(setSearchTerm)}
            placeholder="Tìm kiếm theo tên, email, ID..."
          />
        </div>
        <label className="filter-chip">
          TRÌNH ĐỘ:
          <select value={levelFilter} onChange={updateFilter(setLevelFilter)}>
            <option value="ALL">Tất cả</option>
            <option value="BEGINNER">BEGINNER</option>
            <option value="INTERMEDIATE">INTERMEDIATE</option>
            <option value="ADVANCED">ADVANCED</option>
          </select>
        </label>
        <label className="filter-chip">
          TRẠNG THÁI:
          <select value={statusFilter} onChange={updateFilter(setStatusFilter)}>
            <option value="ALL">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-chip">
          TẦN SUẤT:
          <select
            value={frequencyFilter}
            onChange={updateFilter(setFrequencyFilter)}
          >
            {FREQUENCY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-tools">
          <button
            type="button"
            className="icon-btn"
            aria-label="Reset"
            onClick={resetFilters}
          >
            ↻
          </button>
        </div>
      </div>

      <div className="user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>NGƯỜI DÙNG</th>
              <th>LIÊN HỆ</th>
              <th>TRÌNH ĐỘ</th>
              <th>TẦN SUẤT</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="user-empty-row">
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="user-empty-row">
                  {error}
                </td>
              </tr>
            ) : pageUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="user-empty-row">
                  Không có người dùng phù hợp.
                </td>
              </tr>
            ) : (
              pageUsers.map((user, index) => {
                const status = getStatus(user);
                return (
                  <tr key={user.profileId || user.accountId}>
                    <td className="stt-cell">{startIndex + index + 1}</td>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="member-copy">
                          <span className="name-line">
                            {displayValue(user.fullName)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-email">
                          {displayValue(user.email)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`level-tag ${String(user.level || "").toLowerCase()}`}
                      >
                        {displayValue(user.level)}
                      </span>
                    </td>
                    <td>{displayValue(user.sessionsPerWeek)} buổi/tuần</td>
                    <td>
                      <span
                        className={`status-tag ${String(status).toLowerCase()}`}
                      >
                        {displayValue(status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="action-icon-button"
                        aria-label={`Sửa ${user.fullName}`}
                        onClick={() => openEditForm(user)}
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && filteredUsers.length > 0 && (
        <div className="pagination-row">
          <span>
            Hiển thị {startIndex + 1}-
            {Math.min(startIndex + PAGE_SIZE, filteredUsers.length)} trên{" "}
            {filteredUsers.length} người dùng
          </span>
          <div className="pagination">
            <button
              className="page-arrow"
              disabled={page === 1}
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (number) => (
                <button
                  key={number}
                  className={`page-number ${number === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(number)}
                >
                  {number}
                </button>
              ),
            )}
            <button
              className="page-arrow"
              disabled={page === totalPages}
              onClick={() =>
                setCurrentPage((value) => Math.min(totalPages, value + 1))
              }
            >
              ›
            </button>
          </div>
        </div>
      )}
      {notice && <div className="exercise-notice">{notice}</div>}

      {formMode && (
        <div className="user-modal-backdrop" onMouseDown={closeForm}>
          <form
            className="user-modal"
            onSubmit={submitForm}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="exercise-modal-header">
              <h2>
                {formMode === "edit" ? "SỬA NGƯỜI DÙNG" : "THÊM NGƯỜI DÙNG"}
              </h2>
              <button
                type="button"
                className="exercise-modal-close"
                onClick={closeForm}
              >
                ×
              </button>
            </div>
            {formError && <p className="exercise-form-error">{formError}</p>}
            <div className="user-form-grid">
              <label className="user-form-field">
                Username *
                <input
                  value={form.username}
                  onChange={updateForm("username")}
                />
              </label>
              <label className="user-form-field">
                Email *
                <input
                  type="email"
                  value={form.email}
                  onChange={updateForm("email")}
                />
              </label>
              {formMode === "add" && (
                <label className="user-form-field">
                  Mật khẩu *
                  <input
                    type="password"
                    value={form.password}
                    onChange={updateForm("password")}
                  />
                </label>
              )}
              <label className="user-form-field">
                Họ tên *
                <input
                  value={form.fullName}
                  onChange={updateForm("fullName")}
                />
              </label>
              <label className="user-form-field">
                Giới tính
                <select value={form.gender} onChange={updateForm("gender")}>
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </label>
              <label className="user-form-field">
                Trình độ
                <select value={form.level} onChange={updateForm("level")}>
                  <option value="">Chọn trình độ</option>
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </label>
              <label className="user-form-field">
                Mục tiêu
                <input value={form.goal} onChange={updateForm("goal")} />
              </label>
              <label className="user-form-field">
                Số buổi/tuần
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={form.sessionsPerWeek}
                  onChange={updateForm("sessionsPerWeek")}
                />
              </label>
              {formMode === "edit" && (
                <label className="user-form-field">
                  Trạng thái
                  <select value={form.status} onChange={updateForm("status")}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                </label>
              )}
            </div>
            <div className="exercise-modal-actions">
              <button
                type="button"
                className="exercise-cancel-button"
                onClick={closeForm}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="exercise-save-button"
                disabled={formLoading}
              >
                {formLoading ? "Đang lưu..." : "Lưu người dùng"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
