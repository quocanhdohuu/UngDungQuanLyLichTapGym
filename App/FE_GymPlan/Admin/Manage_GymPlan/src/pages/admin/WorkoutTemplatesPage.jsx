import {
  AdminIcon,
  AdminSearchInput,
  AdminFilterSelect,
} from "../../components/admin/AdminControls";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:3000";
const DEFAULT_ADMIN_ID = 2;
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const emptyPlanForm = {
  title: "",
  description: "",
  level: "BEGINNER",
  isTemplate: true,
};
const emptyDayForm = { dayName: "" };
const emptyExerciseForm = { exerciseId: "", sets: 1, reps: 1, restTime: 0 };

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || "Request thất bại";
  } catch {
    return `Request thất bại (${response.status})`;
  }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
};

function Modal({ title, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <div
        className="admin-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="admin-button admin-button--icon"
            aria-label="Đóng"
            onClick={onClose}
          >
            <AdminIcon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DayCard({
  day,
  onEditDay,
  onDeleteDay,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const exercises = [...(day.exercises || [])].sort(
    (a, b) => Number(a.exerciseOrder) - Number(b.exerciseOrder),
  );
  return (
    <section className={`admin-card admin-card--flush workout-day-card ${collapsed ? "collapsed" : ""}`}>
      <div className="workout-day-header">
        <span className="workout-grip">
          <AdminIcon name="grip" />
        </span>
        <span className="admin-badge admin-badge--primary">DAY {day.dayOrder}</span>
        <strong>{day.dayName}</strong>
        <span className="workout-day-meta">{exercises.length} bài tập</span>
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => onEditDay(day)}
        >
          Sửa
        </button>
        <button
          type="button"
          className="admin-button admin-button--danger"
          onClick={() => onDeleteDay(day)}
        >
          Xóa
        </button>
        <button
          type="button"
          className="admin-button admin-button--icon"
          aria-label="Thu gọn"
          onClick={() => setCollapsed((value) => !value)}
        >
          <AdminIcon name="chevron" />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="workout-exercise-list">
            {exercises.map((exercise) => (
              <div className="workout-exercise-row" key={exercise.configId}>
                <span className="workout-row-grip">
                  <AdminIcon name="grip" />
                </span>
                <span className="workout-thumb" />
                <div className="workout-exercise-name">
                  <strong>{exercise.exerciseName}</strong>
                  <span>
                    {exercise.sets} hiệp × {exercise.reps} reps <i>•</i> Nghỉ{" "}
                    {exercise.restTime}s
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => onEditExercise(exercise)}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--danger"
                  onClick={() => onDeleteExercise(exercise)}
                >
                  Xóa
                </button>
              </div>
            ))}
            {exercises.length === 0 && (
              <div className="admin-empty">
                Chưa có bài tập trong ngày này.
              </div>
            )}
          </div>
          <button
            type="button"
            className="admin-button admin-button--secondary workout-add-exercise"
            onClick={() => onAddExercise(day)}
          >
            <AdminIcon name="plus" /> Thêm bài tập vào DAY {day.dayOrder}
          </button>
        </>
      )}
    </section>
  );
}

const WorkoutTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDetail, setPlanDetail] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [daysFilter, setDaysFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPlanForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTemplates = async (preferredId = selectedPlanId) => {
    const data = await request("/workoutplans/templates");
    setTemplates(Array.isArray(data) ? data : []);
    if (
      preferredId &&
      data.some((item) => Number(item.planId) === Number(preferredId))
    ) {
      setSelectedPlanId(Number(preferredId));
    } else if (!preferredId && data.length > 0) {
      setSelectedPlanId(Number(data[0].planId));
    } else {
      setSelectedPlanId(null);
      setPlanDetail(null);
    }
  };

  const loadDetail = async (planId) => {
    if (!planId) return;
    setDetailLoading(true);
    setError("");
    try {
      setPlanDetail(await request(`/workoutplans/${planId}/detail`));
    } catch (requestError) {
      setError(requestError.message);
      setPlanDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      request("/workoutplans/templates"),
      request("/api/exercises/summary"),
    ])
      .then(([templateData, exerciseData]) => {
        if (mounted) {
          const nextTemplates = Array.isArray(templateData) ? templateData : [];
          setTemplates(nextTemplates);
          setExercises(Array.isArray(exerciseData) ? exerciseData : []);
          if (nextTemplates.length > 0) {
            const firstPlanId = Number(nextTemplates[0].planId);
            setSelectedPlanId(firstPlanId);
            loadDetail(firstPlanId);
          }
        }
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !query ||
          `${template.title || ""} ${template.description || ""}`
            .toLowerCase()
            .includes(query);
        const totalDays = Number(template.totalDays || 0);
        const matchesDays =
          daysFilter === "ALL" ||
          (daysFilter === "1-2" && totalDays >= 1 && totalDays <= 2) ||
          (daysFilter === "3-4" && totalDays >= 3 && totalDays <= 4) ||
          (daysFilter === "5-6" && totalDays >= 5 && totalDays <= 6) ||
          (daysFilter === "7" && totalDays === 7);
        return (
          matchesSearch &&
          (levelFilter === "ALL" || template.level === levelFilter) &&
          matchesDays
        );
      }),
    [templates, searchTerm, levelFilter, daysFilter],
  );

  const refreshCurrent = async (message, refreshTemplates = false) => {
    if (refreshTemplates) await loadTemplates(selectedPlanId);
    await loadDetail(selectedPlanId);
    setNotice(message);
    setModal(null);
    setSaving(false);
  };

  const handleDeleteExercise = async () => {
    if (!form?.configId) return;
    setSaving(true);
    setFormError("");
    try {
      await request(`/exerciseconfigs/${form.configId}`, { method: "DELETE" });
      await refreshCurrent("Đã xóa bài tập khỏi ngày tập.");
    } catch (requestError) {
      setFormError(requestError.message);
      setSaving(false);
    }
  };

  const handleDeleteWorkoutDay = async () => {
    if (!form?.dayId) return;
    setSaving(true);
    setFormError("");
    try {
      await request(`/workoutdays/${form.dayId}`, { method: "DELETE" });
      await refreshCurrent("Đã xóa ngày tập.", true);
    } catch (requestError) {
      setFormError(requestError.message);
      setSaving(false);
    }
  };

  const openPlanForm = (mode) => {
    setModal(mode);
    setForm(
      mode === "edit"
        ? {
            title: planDetail.title || "",
            description: planDetail.description || "",
            level: planDetail.level || "BEGINNER",
            isTemplate: Boolean(planDetail.isTemplate),
          }
        : emptyPlanForm,
    );
    setFormError("");
  };
  const updateForm = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submitPlan = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.title.trim())
      return setFormError("Tên chương trình không được để trống");
    setSaving(true);
    try {
      const result = await request(
        modal === "create"
          ? "/workoutplans/procedure"
          : `/workoutplans/${selectedPlanId}/procedure`,
        {
          method: modal === "create" ? "POST" : "PUT",
          body: JSON.stringify({
            ...form,
            ...(modal === "create" ? { creatorId: DEFAULT_ADMIN_ID } : {}),
          }),
        },
      );
      const newId = Number(result.data?.planId || selectedPlanId);
      setSelectedPlanId(Number(newId));
      await loadTemplates(newId);
      await loadDetail(newId);
      setNotice(
        modal === "create"
          ? "Đã tạo chương trình."
          : "Đã cập nhật chương trình.",
      );
      setModal(null);
      setSaving(false);
    } catch (requestError) {
      setFormError(requestError.message);
      setSaving(false);
    }
  };

  const submitAction = async (
    event,
    path,
    payload,
    successMessage,
    refreshTemplates = false,
    method = "POST",
  ) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await request(path, { method, body: JSON.stringify(payload) });
      await refreshCurrent(successMessage, refreshTemplates);
    } catch (requestError) {
      setFormError(requestError.message);
      setSaving(false);
    }
  };
  const formField = (label, key, type = "text") => (
    <label className="admin-form-field">
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={(event) => updateForm(key, event.target.value)}
        required={key !== "description"}
      />
    </label>
  );

  return (
    <div className="admin-page workout-page">
      <AdminPageHeader
        eyebrow="Lịch tập"
        title="Quản lý lịch tập"
        description="Thiết kế, xây dựng và phân phối giáo án tập luyện chuẩn khoa học cho hội viên GYMFORLIFE."
        actions={
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={() => openPlanForm("create")}
          >
            <AdminIcon name="plus" /> Tạo chương trình mới
          </button>
        }
      />
      <div className="admin-filter-bar">
        <AdminSearchInput
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm giáo án theo tên, nhóm cơ, mục tiêu..."
        />
        <AdminFilterSelect
          label="Trình độ"
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
        >
          <option value="ALL">Tất cả</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect
          label="Số buổi"
          value={daysFilter}
          onChange={(event) => setDaysFilter(event.target.value)}
        >
          <option value="ALL">Tất cả</option>
          <option value="1-2">1 - 2 buổi</option>
          <option value="3-4">3 - 4 buổi</option>
          <option value="5-6">5 - 6 buổi</option>
          <option value="7">7 buổi</option>
        </AdminFilterSelect>
      </div>
      {error && <div className="admin-form-error">{error}</div>}
      <div className="workout-builder-grid">
        <div className="workout-left-column">
          <section className="admin-card admin-card--flush workout-library">
            <div className="workout-card-title">
              <strong>THƯ VIỆN GIÁO ÁN MẪU ({filteredTemplates.length})</strong>
              <AdminIcon name="filter" />
            </div>
            <div className="workout-program-list">
              {loading ? (
                <div className="admin-empty">Đang tải giáo án...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="admin-empty">Không có giáo án phù hợp.</div>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    type="button"
                    className={`workout-program ${Number(template.planId) === Number(selectedPlanId) ? "selected" : ""}`}
                    key={template.planId}
                    onClick={() => {
                      const planId = Number(template.planId);
                      setSelectedPlanId(planId);
                      loadDetail(planId);
                    }}
                  >
                    <div className="workout-program-top">
                      <strong>{template.title}</strong>
                      <span className="admin-badge">{template.level}</span>
                    </div>
                    <small>{template.totalDays || 0} ngày tập</small>
                  </button>
                ))
              )}
            </div>
          </section>
          {planDetail && (
            <section className="admin-card workout-detail">
              <div className="workout-detail-heading">
                <strong>CHI TIẾT GIÁO ÁN ĐANG SỬA</strong>
                <button
                  type="button"
                  className="admin-button admin-button--icon"
                  aria-label="Sửa chương trình"
                  onClick={() => openPlanForm("edit")}
                >
                  <AdminIcon name="edit" />
                </button>
              </div>
              <h2>{planDetail.title}</h2>
              <small>Plan ID: {planDetail.planId}</small>
              <div className="workout-detail-stats">
                <div>
                  Độ khó<strong>{planDetail.level}</strong>
                </div>
                <div>
                  Tần suất<strong>{planDetail.totalDays || 0} ngày tập</strong>
                </div>
              </div>
              <h3>MÔ TẢ</h3>
              <p>{planDetail.description || "Chưa có mô tả."}</p>
            </section>
          )}
        </div>
        <div className="workout-right-column">
          <section className="admin-card workout-structure">
            <div>
              <h2>Cấu trúc tuần tập luyện</h2>
              <p>Danh sách ngày tập và bài tập từ dữ liệu giáo án.</p>
            </div>
            <span className="workout-cycle">
              <b>{planDetail?.totalDays || 0} Ngày</b>
            </span>
            <button
              type="button"
              className="admin-button admin-button--secondary"
              disabled={!selectedPlanId}
              onClick={() => {
                setModal("add-day");
                setForm(emptyDayForm);
                setFormError("");
              }}
            >
              <AdminIcon name="plus" /> Thêm ngày tập
            </button>
          </section>
          {detailLoading ? (
            <div className="admin-empty">Đang tải chi tiết...</div>
          ) : !planDetail ? (
            <div className="admin-empty">
              Chọn một giáo án để xem cấu trúc.
            </div>
          ) : planDetail.days?.length ? (
            [...planDetail.days]
              .sort((a, b) => Number(a.dayOrder) - Number(b.dayOrder))
              .map((day) => (
                <DayCard
                  key={day.dayId}
                  day={day}
                  onEditDay={(value) => {
                    setModal("edit-day");
                    setForm(value);
                    setFormError("");
                  }}
                  onDeleteDay={(value) => {
                    setModal("delete-day");
                    setForm(value);
                    setFormError("");
                  }}
                  onAddExercise={(value) => {
                    setModal("add-exercise");
                    setForm({ ...emptyExerciseForm, dayId: value.dayId });
                    setFormError("");
                  }}
                  onEditExercise={(value) => {
                    setModal("edit-exercise");
                    setForm(value);
                    setFormError("");
                  }}
                  onDeleteExercise={(value) => {
                    setModal("delete-exercise");
                    setForm(value);
                    setFormError("");
                  }}
                />
              ))
          ) : (
            <div className="admin-empty">Plan chưa có ngày tập.</div>
          )}
        </div>
      </div>
      {notice && <div className="exercise-notice">{notice}</div>}
      {modal === "create" || modal === "edit" ? (
        <Modal
          title={
            modal === "create" ? "Tạo chương trình mới" : "Sửa chương trình"
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={submitPlan}>
            {formField("Tên chương trình", "title")}
            {formField("Mô tả", "description")}
            <label className="admin-form-field">
              Trình độ
              <select
                value={form.level}
                onChange={(event) => updateForm("level", event.target.value)}
              >
                {LEVELS.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label className="admin-form-field">
              <span>Giáo án mẫu</span>
              <input
                type="checkbox"
                checked={form.isTemplate}
                onChange={(event) =>
                  updateForm("isTemplate", event.target.checked)
                }
              />
            </label>
            {formError && <div className="admin-form-error">{formError}</div>}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setModal(null)}
              >
                Hủy
              </button>
              <button type="submit" className="admin-button admin-button--primary" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {modal === "add-day" || modal === "edit-day" ? (
        <Modal
          title={modal === "add-day" ? "Thêm ngày tập" : "Sửa ngày tập"}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(event) =>
              modal === "add-day"
                ? submitAction(
                    event,
                    `/workoutdays/plan/${selectedPlanId}`,
                    { dayName: form.dayName },
                    "Đã thêm ngày tập.",
                  )
                : submitAction(
                    event,
                    `/workoutdays/${form.dayId}/procedure`,
                    { dayName: form.dayName },
                    "Đã cập nhật ngày tập.",
                  )
            }
          >
            <label className="admin-form-field">
              Tên ngày tập
              <input
                value={form.dayName || ""}
                onChange={(event) =>
                  setForm({ ...form, dayName: event.target.value })
                }
                required
              />
            </label>
            {formError && <div className="admin-form-error">{formError}</div>}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setModal(null)}
              >
                Hủy
              </button>
              <button type="submit" className="admin-button admin-button--primary" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {modal === "add-exercise" || modal === "edit-exercise" ? (
        <Modal
          title={
            modal === "add-exercise" ? "Thêm bài tập" : "Sửa cấu hình bài tập"
          }
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(event) =>
              modal === "add-exercise"
                ? submitAction(
                    event,
                    `/exerciseconfigs/day/${form.dayId}`,
                    {
                      exerciseId: Number(form.exerciseId),
                      sets: Number(form.sets),
                      reps: Number(form.reps),
                      restTime: Number(form.restTime),
                    },
                    "Đã thêm bài tập.",
                  )
                : submitAction(
                    event,
                    `/exerciseconfigs/${form.configId}`,
                    {
                      sets: Number(form.sets),
                      reps: Number(form.reps),
                      restTime: Number(form.restTime),
                    },
                    "Đã cập nhật cấu hình bài tập.",
                    false,
                    "PUT",
                  )
            }
          >
            {modal === "add-exercise" && (
              <label className="admin-form-field">
                Bài tập
                <select
                  value={form.exerciseId}
                  onChange={(event) =>
                    setForm({ ...form, exerciseId: event.target.value })
                  }
                  required
                >
                  <option value="">Chọn bài tập</option>
                  {exercises.map((exercise) => (
                    <option
                      key={exercise.exerciseId}
                      value={exercise.exerciseId}
                    >
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {[
              ["Sets", "sets"],
              ["Reps", "reps"],
              ["Rest Time (giây)", "restTime"],
            ].map(([label, key]) => (
              <label className="admin-form-field" key={key}>
                {label}
                <input
                  type="number"
                  min={key === "restTime" ? 0 : 1}
                  value={form[key] ?? 0}
                  onChange={(event) =>
                    setForm({ ...form, [key]: event.target.value })
                  }
                  required
                />
              </label>
            ))}
            {formError && <div className="admin-form-error">{formError}</div>}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setModal(null)}
              >
                Hủy
              </button>
              <button type="submit" className="admin-button admin-button--primary" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {(modal === "delete-exercise" || modal === "delete-day") && (
        <Modal
          title={
            modal === "delete-exercise"
              ? "Xác nhận xóa bài tập"
              : "Xác nhận xóa ngày tập"
          }
          onClose={() => setModal(null)}
        >
          <div>
            {modal === "delete-exercise" ? (
              <>
                <p className="admin-confirm-message">
                  {`Bạn có chắc chắn muốn xóa "${form?.exerciseName || "bài tập này"}" khỏi ngày tập?`}
                </p>
              </>
            ) : (
              <>
                <p className="admin-confirm-message">
                  {`Bạn có chắc chắn muốn xóa ${form?.dayName ? `DAY ${form.dayOrder} - ${form.dayName}` : "ngày tập này"}?`}
                </p>
                <p className="admin-confirm-message">
                  Toàn bộ bài tập trong ngày này cũng sẽ bị xóa.
                </p>
              </>
            )}
            {formError && <div className="admin-form-error">{formError}</div>}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setModal(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={
                  modal === "delete-exercise"
                    ? handleDeleteExercise
                    : handleDeleteWorkoutDay
                }
                disabled={saving}
                className="admin-button admin-button--danger"
              >
                {saving
                  ? "Đang xóa..."
                  : modal === "delete-exercise"
                    ? "Xóa"
                    : "Xóa ngày tập"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkoutTemplatesPage;
