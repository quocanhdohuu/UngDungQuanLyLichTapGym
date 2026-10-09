import {
  AdminIcon,
  AdminSearchInput,
  AdminFilterSelect,
} from "../../components/admin/AdminControls";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminPagination from "../../components/admin/AdminPagination";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:3000/api/users";
const PAGE_SIZE = 5;
const DEFAULT_USER_PASSWORD = "123456";
const FREQUENCY_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
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
const getStatus = (user) => user.accountStatus || "";
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
    setForm({ ...emptyForm, password: DEFAULT_USER_PASSWORD });
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
      status: getStatus(user),
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
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setFormError("Email không hợp lệ.");
      return;
    }
    if (formMode === "add" && !form.password) {
      setFormError("Mật khẩu không được để trống.");
      return;
    }
    if (
      form.sessionsPerWeek !== "" &&
      (!Number.isInteger(Number(form.sessionsPerWeek)) || Number(form.sessionsPerWeek) < 1 || Number(form.sessionsPerWeek) > 7)
    ) {
      setFormError("Số buổi tập mỗi tuần phải là số nguyên từ 1 đến 7.");
      return;
    }

    setFormLoading(true);
    const payload = {
      ...form,
      username: form.username.trim(),
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      gender: form.gender || null,
      level: form.level || null,
      sessionsPerWeek:
        form.sessionsPerWeek === "" ? null : Number(form.sessionsPerWeek),
    };
    if (formMode === "edit") delete payload.password;
    else delete payload.status;

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
    <div className="admin-page users-page">
      <AdminPageHeader
        eyebrow="Người dùng"
        title="Quản lý người dùng"
        description="Quản lý tài khoản, thể trạng và trạng thái hoạt động của người dùng GYMFORLIFE."
        actions={
          <>
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={exportExcel}
            >
              Xuất file Excel
            </button>
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openAddForm}
            >
              <AdminIcon name="plus" /> Thêm người dùng
            </button>
          </>
        }
      />

      <div className="admin-filter-bar">
        <AdminSearchInput
          value={searchTerm}
          onChange={updateFilter(setSearchTerm)}
          placeholder="Tìm kiếm theo tên, email, ID..."
        />
        <AdminFilterSelect
          label="Trình độ"
          value={levelFilter}
          onChange={updateFilter(setLevelFilter)}
        >
          <option value="ALL">Tất cả</option>
          <option value="BEGINNER">BEGINNER</option>
          <option value="INTERMEDIATE">INTERMEDIATE</option>
          <option value="ADVANCED">ADVANCED</option>
        </AdminFilterSelect>
        <AdminFilterSelect
          label="Trạng thái"
          value={statusFilter}
          onChange={updateFilter(setStatusFilter)}
        >
          <option value="ALL">Tất cả</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect
          label="Tần suất"
          value={frequencyFilter}
          onChange={updateFilter(setFrequencyFilter)}
        >
          {FREQUENCY_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </AdminFilterSelect>
        <button
          type="button"
          className="admin-button admin-button--icon"
          aria-label="Reset"
          onClick={resetFilters}
        >
          <AdminIcon name="refresh" />
        </button>
      </div>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table user-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>NGƯỜI DÙNG</th>
              <th>LIÊN HỆ</th>
              <th>TRÌNH ĐỘ</th>
              <th>TẦN SUẤT</th>
              <th>TRẠNG THÁI</th>
              <th>LỊCH TẬP ĐANG SỬ DỤNG</th>
              <th>LOẠI LỊCH TẬP</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="admin-empty">
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="9" className="admin-empty">
                  {error}
                </td>
              </tr>
            ) : pageUsers.length === 0 ? (
              <tr>
                <td colSpan="9" className="admin-empty">
                  Không có người dùng phù hợp.
                </td>
              </tr>
            ) : (
              pageUsers.map((user, index) => {
                const status = getStatus(user);
                const hasActivePlan = user.activePlanId != null;
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
                        className={`admin-badge level-tag ${String(user.level || "").toLowerCase()}`}
                      >
                        {displayValue(user.level)}
                      </span>
                    </td>
                    <td>{displayValue(user.sessionsPerWeek)} buổi/tuần</td>
                    <td>
                      <span
                        className={`admin-badge status-tag ${String(status).toLowerCase()}`}
                      >
                        {displayValue(status)}
                      </span>
                    </td>
                    <td>
                      <div className="user-active-plan-title">
                        {hasActivePlan ? user.activePlanTitle : "Chưa có lịch tập"}
                      </div>
                    </td>
                    <td>
                      {hasActivePlan && user.activePlanType === "TEMPLATE" ? (
                        <span className="admin-badge admin-badge--success">
                          LỊCH MẪU
                        </span>
                      ) : hasActivePlan && user.activePlanType === "PERSONAL" ? (
                        <span className="admin-badge">LỊCH CÁ NHÂN</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-button admin-button--icon"
                        aria-label={`Sửa ${user.fullName}`}
                        onClick={() => openEditForm(user)}
                      >
                        <AdminIcon name="edit" />
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
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      {notice && <div className="exercise-notice">{notice}</div>}

      {formMode && (
        <div className="admin-modal-backdrop" onMouseDown={closeForm}>
          <form
            className="admin-modal admin-modal--wide"
            onSubmit={submitForm}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>
                {formMode === "edit" ? "Sửa người dùng" : "Thêm người dùng"}
              </h2>
              <button
                type="button"
                className="admin-button admin-button--icon"
                aria-label="Đóng"
                onClick={closeForm}
              >
                <AdminIcon name="close" />
              </button>
            </div>
            {formError && <p className="admin-form-error">{formError}</p>}
            <div className="admin-form-grid">
              <label className="admin-form-field">
                Username *
                <input
                  value={form.username}
                  maxLength={50}
                  onChange={updateForm("username")}
                />
              </label>
              <label className="admin-form-field">
                Email *
                <input
                  type="email"
                  value={form.email}
                  maxLength={100}
                  onChange={updateForm("email")}
                />
              </label>
              {formMode === "add" && (
                <label className="admin-form-field">
                  Mật khẩu *
                  <input
                    type="password"
                    value={form.password}
                    maxLength={255}
                    onChange={updateForm("password")}
                  />
                </label>
              )}
              <label className="admin-form-field">
                Họ tên *
                <input
                  value={form.fullName}
                  maxLength={100}
                  onChange={updateForm("fullName")}
                />
              </label>
              <label className="admin-form-field">
                Giới tính
                <select value={form.gender} onChange={updateForm("gender")}>
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </label>
              <label className="admin-form-field">
                Trình độ
                <select value={form.level} onChange={updateForm("level")}>
                  <option value="">Chọn trình độ</option>
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </label>
              <label className="admin-form-field">
                Mục tiêu
                <input value={form.goal} maxLength={255} onChange={updateForm("goal")} />
              </label>
              <label className="admin-form-field">
                Số buổi/tuần
                <input
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={form.sessionsPerWeek}
                  onChange={updateForm("sessionsPerWeek")}
                />
              </label>
              {formMode === "edit" && (
                <label className="admin-form-field">
                  Trạng thái tài khoản
                  <select value={form.status} onChange={updateForm("status")} required>
                    <option value="" disabled>Chọn trạng thái</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                  <small>Trạng thái hồ sơ hiện tại: {selectedUser?.profileStatus ?? "—"}. LOCKED chỉ khóa tài khoản.</small>
                </label>
              )}
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={closeForm}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="admin-button admin-button--primary"
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
