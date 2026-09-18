import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 5;
const API_BASE_URL = "http://localhost:3000";
const EXERCISES_API_URL = "http://localhost:3000/api/exercises/summary";
const DIFFICULTIES = [
  { value: "EASY", label: "Beginner" },
  { value: "MEDIUM", label: "Intermediate" },
  { value: "HARD", label: "Advanced" },
];

const emptyForm = () => ({
  name: "",
  description: "",
  difficulty: "EASY",
  muscleGroups: [],
  equipmentIds: [],
  media: [],
});

const splitValues = (value) => {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getDifficultyLabel = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  const labels = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };

  return labels[normalized] || normalized || "Unknown";
};

const getMediaType = (url) => {
  if (!url || !String(url).trim()) return "empty";

  const normalized = String(url).trim().toLowerCase();

  if (
    normalized.includes("/video/") ||
    /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(normalized)
  ) {
    return "video";
  }

  return "image";
};

function ExerciseIcon({ name }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "eye") {
    return (
      <svg {...props}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...props}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M5 9.5h14" />
      <path d="M7 6.5v6M17 6.5v6M8 12.5v6m8-6v6M8 17h8" />
    </svg>
  );
}

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("ALL");
  const [equipmentFilter, setEquipmentFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const loadExercises = async () => {
    const response = await fetch(EXERCISES_API_URL);
    if (!response.ok)
      throw new Error(`Request failed with status ${response.status}`);
    const data = await response.json();
    setExercises(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let isMounted = true;

    const loadExerciseList = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(EXERCISES_API_URL);
        if (!response.ok)
          throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        if (isMounted) setExercises(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch exercises:", err);

        if (isMounted) {
          setError("Không thể tải danh sách bài tập.");
          setExercises([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExerciseList();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/musclegroups`),
      fetch(`${API_BASE_URL}/equipment`),
    ])
      .then(async ([groupsResponse, equipmentResponse]) => {
        if (!groupsResponse.ok || !equipmentResponse.ok)
          throw new Error("Không thể tải tùy chọn form");
        const [groups, equipmentItems] = await Promise.all([
          groupsResponse.json(),
          equipmentResponse.json(),
        ]);
        setMuscleGroups(Array.isArray(groups) ? groups : []);
        setEquipment(Array.isArray(equipmentItems) ? equipmentItems : []);
      })
      .catch(() => setFormError("Không thể tải nhóm cơ hoặc thiết bị."));
  }, []);

  const openAddForm = () => {
    setFormMode("add");
    setForm(emptyForm());
    setFormError("");
  };

  const openEditForm = async (exerciseId) => {
    setFormMode("edit");
    setFormLoading(true);
    setFormError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/exercises/${exerciseId}`,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể tải bài tập");
      setForm({
        name: data.name || "",
        description: data.description || "",
        difficulty: data.difficulty || "EASY",
        muscleGroups: Array.isArray(data.muscleGroups) ? data.muscleGroups : [],
        equipmentIds: Array.isArray(data.equipmentIds)
          ? data.equipmentIds.map(Number)
          : [],
        media: (Array.isArray(data.media) ? data.media : []).map((item) => ({
          ...item,
          _existing: true,
        })),
        exerciseId: data.exerciseId,
      });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const closeForm = () => {
    if (!formLoading && !mediaLoading) setFormMode(null);
  };

  const updateMuscleGroups = (role, event) => {
    const selectedIds = [...event.target.selectedOptions].map((option) =>
      Number(option.value),
    );
    const otherRole = role === "PRIMARY" ? "SECONDARY" : "PRIMARY";
    const otherGroups = form.muscleGroups.filter(
      (item) => item.role === otherRole,
    );
    setForm((current) => ({
      ...current,
      muscleGroups: [
        ...otherGroups,
        ...selectedIds
          .filter(
            (id) => !otherGroups.some((item) => Number(item.groupId) === id),
          )
          .map((groupId) => ({ groupId, role })),
      ],
    }));
  };

  const toggleSecondaryMuscle = (groupId) => {
    setForm((current) => {
      const normalizedGroupId = Number(groupId);
      const isPrimary = current.muscleGroups.some(
        (item) =>
          item.role === "PRIMARY" && Number(item.groupId) === normalizedGroupId,
      );

      if (isPrimary) return current;

      const isSelected = current.muscleGroups.some(
        (item) =>
          item.role === "SECONDARY" &&
          Number(item.groupId) === normalizedGroupId,
      );

      return {
        ...current,
        muscleGroups: isSelected
          ? current.muscleGroups.filter(
              (item) =>
                !(
                  item.role === "SECONDARY" &&
                  Number(item.groupId) === normalizedGroupId
                ),
            )
          : [
              ...current.muscleGroups,
              { groupId: normalizedGroupId, role: "SECONDARY" },
            ],
      };
    });
  };

  const toggleEquipment = (equipmentId) => {
    const normalizedEquipmentId = Number(equipmentId);
    setForm((current) => ({
      ...current,
      equipmentIds: current.equipmentIds.includes(normalizedEquipmentId)
        ? current.equipmentIds.filter((id) => id !== normalizedEquipmentId)
        : [...current.equipmentIds, normalizedEquipmentId],
    }));
  };

  const handleMediaUpload = async (event) => {
    const files = [...event.target.files];
    if (files.length === 0) return;
    setMediaLoading(true);
    setFormError("");
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const body = new FormData();
          body.append("file", file);
          const response = await fetch(
            `${API_BASE_URL}/api/exercises/media/upload`,
            { method: "POST", body },
          );
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.message || "Upload media thất bại");
          return data.data;
        }),
      );
      setForm((current) => ({
        ...current,
        media: [...current.media, ...uploaded],
      }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setMediaLoading(false);
      event.target.value = "";
    }
  };

  const removeMedia = async (media) => {
    setForm((current) => ({
      ...current,
      media: current.media.filter((item) => item !== media),
    }));
    if (!media._existing && media.publicId) {
      await fetch(`${API_BASE_URL}/api/exercises/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: media.publicId,
          mediaType: media.mediaType,
        }),
      });
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (formLoading || mediaLoading) return;
    const primaryCount = form.muscleGroups.filter(
      (item) => item.role === "PRIMARY",
    ).length;
    if (!form.name.trim())
      return setFormError("Tên bài tập không được để trống.");
    if (primaryCount === 0)
      return setFormError("Phải chọn ít nhất một cơ chính.");

    setFormLoading(true);
    setFormError("");
    const payload = {
      name: form.name.trim(),
      description: form.description,
      difficulty: form.difficulty,
      muscleGroups: form.muscleGroups.map((item) => ({
        groupId: Number(item.groupId),
        role: item.role,
      })),
      equipmentIds: form.equipmentIds.map(Number),
      media: form.media.map((item, index) => ({
        mediaUrl: item.mediaUrl,
        publicId: item.publicId,
        mediaType: item.mediaType,
        sortOrder: index + 1,
      })),
    };

    try {
      const isEdit = formMode === "edit";
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/exercises/${form.exerciseId}`
          : `${API_BASE_URL}/api/exercises`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể lưu bài tập");
      await loadExercises();
      setFormMode(null);
      setForm(emptyForm());
      setNotice(
        isEdit ? "Cập nhật bài tập thành công." : "Thêm bài tập thành công.",
      );
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const muscleOptions = useMemo(() => {
    const values = new Set();

    exercises.forEach((exercise) => {
      splitValues(exercise.primaryMuscles).forEach((item) => values.add(item));
    });

    return [...values].sort((a, b) => a.localeCompare(b));
  }, [exercises]);

  const equipmentOptions = useMemo(() => {
    const values = new Set();

    exercises.forEach((exercise) => {
      splitValues(exercise.equipment).forEach((item) => values.add(item));
    });

    return [...values].sort((a, b) => a.localeCompare(b));
  }, [exercises]);

  const difficultyOptions = useMemo(() => {
    const values = new Set();

    exercises.forEach((exercise) => {
      if (exercise.difficulty) {
        values.add(String(exercise.difficulty).trim());
      }
    });

    return [...values].sort((a, b) => a.localeCompare(b));
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const searchableText = [
        exercise.name,
        exercise.primaryMuscles,
        exercise.secondaryMuscles,
        exercise.equipment,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const primaryMuscles = splitValues(exercise.primaryMuscles).map((item) =>
        item.toLowerCase(),
      );

      const matchesMuscle =
        muscleFilter === "ALL" ||
        primaryMuscles.includes(muscleFilter.toLowerCase());

      const equipmentValues = splitValues(exercise.equipment).map((item) =>
        item.toLowerCase(),
      );

      const matchesEquipment =
        equipmentFilter === "ALL" ||
        equipmentValues.includes(equipmentFilter.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === "ALL" ||
        String(exercise.difficulty || "").toUpperCase() ===
          String(difficultyFilter).toUpperCase();

      return (
        matchesSearch && matchesMuscle && matchesEquipment && matchesDifficulty
      );
    });
  }, [exercises, searchTerm, muscleFilter, equipmentFilter, difficultyFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExercises.length / PAGE_SIZE),
  );
  const pageForDisplay = Math.min(currentPage, totalPages);
  const startIndex = (pageForDisplay - 1) * PAGE_SIZE;
  const paginatedExercises = filteredExercises.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleMuscleChange = (event) => {
    setMuscleFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleEquipmentChange = (event) => {
    setEquipmentFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (event) => {
    setDifficultyFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setMuscleFilter("ALL");
    setEquipmentFilter("ALL");
    setDifficultyFilter("ALL");
    setCurrentPage(1);
  };

  const renderPreview = (exercise) => {
    if (!exercise.preview || !String(exercise.preview).trim()) {
      return (
        <div
          className="exercise-preview empty"
          aria-label={`Preview ${exercise.name}`}
        />
      );
    }

    const mediaType = getMediaType(exercise.preview);

    if (mediaType === "video") {
      return (
        <video
          className="exercise-video-preview"
          src={exercise.preview}
          muted
          preload="metadata"
          playsInline
          aria-label={`Preview ${exercise.name}`}
        />
      );
    }

    return (
      <img
        className="exercise-image-preview"
        src={exercise.preview}
        alt={exercise.name}
        aria-label={`Preview ${exercise.name}`}
      />
    );
  };

  const shownStart = filteredExercises.length === 0 ? 0 : startIndex + 1;
  const shownEnd = Math.min(startIndex + PAGE_SIZE, filteredExercises.length);

  return (
    <div className="exercises-page">
      <div className="exercise-page-header">
        <div>
          <div className="exercise-breadcrumbs">
            <span>Home</span>
            <span>/</span>
            <span>Thư viện</span>
            <span>/</span>
            <strong>Quản lý bài tập</strong>
          </div>
          <h1>QUẢN LÝ BÀI TẬP</h1>
          <p>
            Kho bài tập chuẩn khoa học, video hướng dẫn và phân loại nhóm cơ của
            GYMFORLIFE.
          </p>
        </div>
        <button
          type="button"
          className="exercise-add-button"
          onClick={openAddForm}
        >
          + THÊM BÀI TẬP MỚI
        </button>
      </div>

      <div className="exercise-filter-panel">
        <label className="exercise-search">
          <span>⌕</span>
          <input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm tên bài tập, nhóm cơ, thiết bị..."
          />
        </label>

        <select
          className="exercise-filter"
          value={muscleFilter}
          onChange={handleMuscleChange}
        >
          <option value="ALL">Nhóm cơ: Tất cả</option>
          {muscleOptions.map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle}
            </option>
          ))}
        </select>

        <select
          className="exercise-filter"
          value={equipmentFilter}
          onChange={handleEquipmentChange}
        >
          <option value="ALL">Thiết bị: Tất cả</option>
          {equipmentOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="exercise-filter"
          value={difficultyFilter}
          onChange={handleDifficultyChange}
        >
          <option value="ALL">Độ khó: Tất cả</option>
          {difficultyOptions.map((item) => (
            <option key={item} value={item}>
              {getDifficultyLabel(item)}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="exercise-refresh"
          onClick={handleResetFilters}
          aria-label="Làm mới"
        >
          ↻
        </button>
      </div>

      <div className="exercise-table-panel">
        <div className="exercise-table-scroll">
          <table className="exercise-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>PREVIEW</th>
                <th>TÊN BÀI TẬP</th>
                <th>MÔ TẢ</th>
                <th>CƠ CHÍNH</th>
                <th>CƠ PHỤ</th>
                <th>THIẾT BỊ</th>
                <th>ĐỘ KHÓ</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="exercise-empty-row">
                    Đang tải danh sách bài tập...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="exercise-empty-row">
                    {error}
                  </td>
                </tr>
              ) : paginatedExercises.length === 0 ? (
                <tr>
                  <td colSpan="9" className="exercise-empty-row">
                    Không tìm thấy bài tập phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedExercises.map((exercise, index) => {
                  const rowNumber = startIndex + index + 1;

                  return (
                    <tr
                      key={
                        exercise.exerciseId ?? `${exercise.name}-${rowNumber}`
                      }
                    >
                      <td className="exercise-stt">{rowNumber}</td>
                      <td>{renderPreview(exercise)}</td>
                      <td className="exercise-name-cell">
                        <strong>{exercise.name}</strong>
                        <span>{exercise.description}</span>
                      </td>
                      <td className="exercise-description-cell">
                        {exercise.description || "-"}
                      </td>
                      <td>
                        <span className="muscle-tag">
                          {splitValues(exercise.primaryMuscles)[0] || "-"}
                        </span>
                      </td>
                      <td className="exercise-secondary">
                        {splitValues(exercise.secondaryMuscles).join(", ") ||
                          "-"}
                      </td>
                      <td className="exercise-equipment">
                        ⚒ {splitValues(exercise.equipment).join(", ") || "-"}
                      </td>
                      <td>
                        <span
                          className={`difficulty-tag ${String(
                            exercise.difficulty || "",
                          )
                            .trim()
                            .toLowerCase()}`}
                        >
                          {getDifficultyLabel(exercise.difficulty)}
                        </span>
                      </td>
                      <td>
                        <div className="exercise-actions">
                          <button type="button" aria-label="Xem">
                            <ExerciseIcon name="eye" />
                          </button>
                          <button
                            type="button"
                            aria-label="Chỉnh sửa"
                            onClick={() => openEditForm(exercise.exerciseId)}
                          >
                            <ExerciseIcon name="edit" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && filteredExercises.length > 0 && (
          <div className="exercise-pagination">
            <span>
              Hiển thị {shownStart} - {shownEnd} trên {filteredExercises.length}{" "}
              bài tập
            </span>
            <div>
              <button
                type="button"
                disabled={pageForDisplay === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Trang trước
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === pageForDisplay ? "active" : ""}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={pageForDisplay === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {notice && <div className="exercise-notice">{notice}</div>}

      {formMode && (
        <div
          className="exercise-modal-backdrop"
          role="presentation"
          onMouseDown={closeForm}
        >
          <form
            className="exercise-modal"
            onSubmit={submitForm}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="exercise-modal-header">
              <h2>
                {formMode === "edit" ? "CHỈNH SỬA BÀI TẬP" : "THÊM BÀI TẬP"}
              </h2>
              <button
                type="button"
                className="exercise-modal-close"
                onClick={closeForm}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            {formError && <p className="exercise-form-error">{formError}</p>}
            {formLoading && formMode === "edit" ? (
              <p className="exercise-form-loading">Đang tải dữ liệu...</p>
            ) : (
              <>
                <label className="exercise-form-field">
                  Tên bài tập *
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    required
                  />
                </label>
                <label className="exercise-form-field">
                  Mô tả
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    rows="3"
                  />
                </label>
                <label className="exercise-form-field">
                  Độ khó
                  <select
                    value={form.difficulty}
                    onChange={(event) =>
                      setForm({ ...form, difficulty: event.target.value })
                    }
                  >
                    {DIFFICULTIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="exercise-form-grid">
                  <label className="exercise-form-field">
                    Cơ chính *
                    <select
                      multiple
                      value={form.muscleGroups
                        .filter((item) => item.role === "PRIMARY")
                        .map((item) => String(item.groupId))}
                      onChange={(event) => updateMuscleGroups("PRIMARY", event)}
                    >
                      {muscleGroups.map((item) => (
                        <option key={item.groupId} value={item.groupId}>
                          {item.groupName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="exercise-form-field">
                    Cơ phụ
                    <div className="exercise-choice-list">
                      {muscleGroups.map((item) => (
                        <button
                          type="button"
                          key={item.groupId}
                          className={`exercise-choice-item ${
                            form.muscleGroups.some(
                              (group) =>
                                group.role === "SECONDARY" &&
                                Number(group.groupId) === Number(item.groupId),
                            )
                              ? "selected"
                              : ""
                          }`}
                          disabled={form.muscleGroups.some(
                            (group) =>
                              group.role === "PRIMARY" &&
                              Number(group.groupId) === Number(item.groupId),
                          )}
                          onClick={() => toggleSecondaryMuscle(item.groupId)}
                        >
                          <span
                            className="exercise-choice-check"
                            aria-hidden="true"
                          >
                            {form.muscleGroups.some(
                              (group) =>
                                group.role === "SECONDARY" &&
                                Number(group.groupId) === Number(item.groupId),
                            )
                              ? "✓"
                              : ""}
                          </span>
                          {item.groupName}
                        </button>
                      ))}
                    </div>
                    <div className="exercise-selected-items">
                      {form.muscleGroups
                        .filter((item) => item.role === "SECONDARY")
                        .map((item) => {
                          const group = muscleGroups.find(
                            (option) =>
                              Number(option.groupId) === Number(item.groupId),
                          );
                          return (
                            <button
                              type="button"
                              className="exercise-selected-chip"
                              key={item.groupId}
                              onClick={() =>
                                toggleSecondaryMuscle(item.groupId)
                              }
                            >
                              {group?.groupName || item.groupId} ×
                            </button>
                          );
                        })}
                    </div>
                  </label>
                </div>
                <label className="exercise-form-field">
                  Thiết bị
                  <div className="exercise-choice-list equipment-choice-list">
                    {equipment.map((item) => (
                      <button
                        type="button"
                        key={item.equipmentId}
                        className={`exercise-choice-item ${
                          form.equipmentIds.includes(Number(item.equipmentId))
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => toggleEquipment(item.equipmentId)}
                      >
                        <span
                          className="exercise-choice-check"
                          aria-hidden="true"
                        >
                          {form.equipmentIds.includes(Number(item.equipmentId))
                            ? "✓"
                            : ""}
                        </span>
                        {item.equipmentName}
                      </button>
                    ))}
                  </div>
                  <div className="exercise-selected-items">
                    {form.equipmentIds.map((equipmentId) => {
                      const item = equipment.find(
                        (option) =>
                          Number(option.equipmentId) === Number(equipmentId),
                      );
                      return (
                        <button
                          type="button"
                          className="exercise-selected-chip"
                          key={equipmentId}
                          onClick={() => toggleEquipment(equipmentId)}
                        >
                          {item?.equipmentName || equipmentId} ×
                        </button>
                      );
                    })}
                  </div>
                </label>
                <div className="exercise-form-field">
                  <span>Media</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    multiple
                    onChange={handleMediaUpload}
                    disabled={mediaLoading}
                  />
                  <div className="exercise-media-list">
                    {form.media.map((item) => (
                      <div
                        className="exercise-media-item"
                        key={`${item.publicId}-${item.sortOrder}`}
                      >
                        {item.mediaType === "VIDEO" ? (
                          <video src={item.mediaUrl} muted preload="metadata" />
                        ) : (
                          <img src={item.mediaUrl} alt="Media bài tập" />
                        )}
                        <span>
                          {item.mediaType} {item.mediaUrl.split("/").pop()}
                        </span>
                        <button type="button" onClick={() => removeMedia(item)}>
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
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
                    disabled={formLoading || mediaLoading}
                  >
                    {formLoading ? "Đang lưu..." : "Lưu bài tập"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ExercisesPage;
