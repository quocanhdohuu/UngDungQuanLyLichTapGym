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

function WorkoutIcon({ type }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    grip: (
      <>
        <path d="M8 7h.01M8 12h.01M8 17h.01M14 7h.01M14 12h.01M14 17h.01" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
  };
  return <svg {...props}>{paths[type] || paths.plus}</svg>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="exercise-modal-backdrop" onMouseDown={onClose}>
      <div
        className="exercise-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="exercise-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="exercise-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DayCard({ day, onEditDay, onAddExercise, onEditExercise }) {
  const [collapsed, setCollapsed] = useState(false);
  const exercises = [...(day.exercises || [])].sort(
    (a, b) => Number(a.exerciseOrder) - Number(b.exerciseOrder),
  );
  return (
    <section className={`workout-day-card ${collapsed ? "collapsed" : ""}`}>
      <div className="workout-day-header">
        <span className="workout-grip">
          <WorkoutIcon type="grip" />
        </span>
        <span className="workout-day-number">DAY {day.dayOrder}</span>
        <strong>{day.dayName}</strong>
        <span className="workout-day-meta">{exercises.length} bài tập</span>
        <button
          type="button"
          className="workout-row-actions"
          onClick={() => onEditDay(day)}
        >
          Sửa
        </button>
        <button
          type="button"
          className="workout-chevron"
          aria-label="Thu gọn"
          onClick={() => setCollapsed((value) => !value)}
        >
          <WorkoutIcon type="chevron" />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="workout-exercise-list">
            {exercises.map((exercise) => (
              <div className="workout-exercise-row" key={exercise.configId}>
                <span className="workout-row-grip">
                  <WorkoutIcon type="grip" />
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
                  className="workout-row-actions"
                  onClick={() => onEditExercise(exercise)}
                >
                  Sửa
                </button>
              </div>
            ))}
            {exercises.length === 0 && (
              <div className="workout-empty">
                Chưa có bài tập trong ngày này.
              </div>
            )}
          </div>
          <button
            type="button"
            className="workout-add-exercise"
            onClick={() => onAddExercise(day)}
          >
            <WorkoutIcon type="plus" /> Thêm bài tập vào DAY {day.dayOrder}
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
    <label className="exercise-form-field">
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
    <div className="workout-page">
      <div className="workout-page-header">
        <div>
          <div className="workout-breadcrumb">
            <strong>QUẢN LÝ LỊCH TẬP</strong>
          </div>
          <h1>Quản lý lịch tập</h1>
          <p>
            Thiết kế, xây dựng và phân phối giáo án tập luyện chuẩn khoa học cho
            hội viên GYMFORLIFE.
          </p>
        </div>
        <div className="workout-header-actions">
          <button
            type="button"
            className="workout-create"
            onClick={() => openPlanForm("create")}
          >
            <WorkoutIcon type="plus" /> TẠO CHƯƠNG TRÌNH MỚI
          </button>
        </div>
      </div>
      <div className="workout-filter-bar">
        <label className="workout-search">
          <WorkoutIcon type="search" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm giáo án theo tên, nhóm cơ, mục tiêu..."
          />
        </label>
        <label className="workout-filter-select">
          <WorkoutIcon type="filter" />
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="ALL">Tất cả trình độ</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="workout-filter-select">
          <WorkoutIcon type="calendar" />
          <select
            value={daysFilter}
            onChange={(event) => setDaysFilter(event.target.value)}
          >
            <option value="ALL">Tất cả số buổi</option>
            <option value="1-2">1 - 2 buổi</option>
            <option value="3-4">3 - 4 buổi</option>
            <option value="5-6">5 - 6 buổi</option>
            <option value="7">7 buổi</option>
          </select>
        </label>
      </div>
      {error && <div className="workout-error">{error}</div>}
      <div className="workout-builder-grid">
        <div className="workout-left-column">
          <section className="workout-library workout-card">
            <div className="workout-card-title">
              <strong>THƯ VIỆN GIÁO ÁN MẪU ({filteredTemplates.length})</strong>
              <WorkoutIcon type="filter" />
            </div>
            <div className="workout-program-list">
              {loading ? (
                <div className="workout-empty">Đang tải giáo án...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="workout-empty">Không có giáo án phù hợp.</div>
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
                      <span>{template.level}</span>
                    </div>
                    <small>{template.totalDays || 0} ngày tập</small>
                  </button>
                ))
              )}
            </div>
          </section>
          {planDetail && (
            <section className="workout-detail workout-card">
              <div className="workout-detail-heading">
                <strong>CHI TIẾT GIÁO ÁN ĐANG SỬA</strong>
                <button
                  type="button"
                  className="workout-icon-button"
                  onClick={() => openPlanForm("edit")}
                >
                  <WorkoutIcon type="edit" />
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
          <section className="workout-structure workout-card">
            <div>
              <h2>Cấu trúc tuần tập luyện</h2>
              <p>Danh sách ngày tập và bài tập từ dữ liệu giáo án.</p>
            </div>
            <span className="workout-cycle">
              <b>{planDetail?.totalDays || 0} Ngày</b>
            </span>
            <button
              type="button"
              className="workout-add-day"
              disabled={!selectedPlanId}
              onClick={() => {
                setModal("add-day");
                setForm(emptyDayForm);
                setFormError("");
              }}
            >
              <WorkoutIcon type="plus" /> Thêm ngày tập
            </button>
          </section>
          {detailLoading ? (
            <div className="workout-empty">Đang tải chi tiết...</div>
          ) : !planDetail ? (
            <div className="workout-empty">
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
                />
              ))
          ) : (
            <div className="workout-empty">Plan chưa có ngày tập.</div>
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
            <label className="exercise-form-field">
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
            <label className="exercise-form-field">
              <span>Giáo án mẫu</span>
              <input
                type="checkbox"
                checked={form.isTemplate}
                onChange={(event) =>
                  updateForm("isTemplate", event.target.checked)
                }
              />
            </label>
            {formError && <div className="workout-form-error">{formError}</div>}
            <div className="exercise-modal-actions">
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button type="submit" disabled={saving}>
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
            <label className="exercise-form-field">
              Tên ngày tập
              <input
                value={form.dayName || ""}
                onChange={(event) =>
                  setForm({ ...form, dayName: event.target.value })
                }
                required
              />
            </label>
            {formError && <div className="workout-form-error">{formError}</div>}
            <div className="exercise-modal-actions">
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button type="submit" disabled={saving}>
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
              <label className="exercise-form-field">
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
              <label className="exercise-form-field" key={key}>
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
            {formError && <div className="workout-form-error">{formError}</div>}
            <div className="exercise-modal-actions">
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default WorkoutTemplatesPage;
