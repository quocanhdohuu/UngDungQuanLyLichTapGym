import {
  AdminIcon,
  AdminSearchInput,
  AdminFilterSelect,
} from "../../components/admin/AdminControls";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminPagination from "../../components/admin/AdminPagination";
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
  alternatives: [],
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

const getExercisePreviewMedia = (exercise) => {
  const media = Array.isArray(exercise?.media)
    ? [...exercise.media]
        .filter((item) => item?.mediaUrl)
        .sort(
          (a, b) =>
            Number(a.sortOrder) - Number(b.sortOrder) ||
            Number(a.mediaId) - Number(b.mediaId),
        )
    : [];

  return (
    media.find((item) => String(item.mediaType).toUpperCase() === "IMAGE") ||
    media.find((item) => String(item.mediaType).toUpperCase() === "VIDEO") ||
    (exercise?.preview ? { mediaUrl: exercise.preview } : null)
  );
};

const loadExerciseMedia = async (exerciseList) =>
  Promise.all(
    exerciseList.map(async (exercise) => {
      if (!exercise.exerciseId) return exercise;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/exercises/${exercise.exerciseId}`,
        );
        if (!response.ok) return exercise;

        const detail = await response.json();
        return {
          ...exercise,
          media: Array.isArray(detail.media) ? detail.media : [],
        };
      } catch {
        return exercise;
      }
    }),
  );

function ExercisePreview({ exercise }) {
  const [failed, setFailed] = useState(false);
  const previewMedia = getExercisePreviewMedia(exercise);

  if (!previewMedia || failed) {
    return (
      <div
        className="exercise-preview empty"
        aria-label={`Preview ${exercise.name}`}
      />
    );
  }

  const mediaType =
    String(previewMedia.mediaType).toUpperCase() === "VIDEO"
      ? "video"
      : getMediaType(previewMedia.mediaUrl);

  if (mediaType === "video") {
    return (
      <video
        className="exercise-video-preview"
        src={previewMedia.mediaUrl}
        muted
        preload="metadata"
        playsInline
        onError={() => setFailed(true)}
        aria-label={`Preview ${exercise.name}`}
      />
    );
  }

  return (
    <img
      className="exercise-image-preview"
      src={previewMedia.mediaUrl}
      alt={exercise.name}
      onError={() => setFailed(true)}
      aria-label={`Preview ${exercise.name}`}
    />
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
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [altSearchTerm, setAltSearchTerm] = useState("");
  const [selectedAltCandidateId, setSelectedAltCandidateId] = useState("");

  useEffect(() => {
    if (!selectedMedia) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedMedia(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMedia]);

  const loadExercises = async () => {
    const response = await fetch(EXERCISES_API_URL);
    if (!response.ok)
      throw new Error(`Request failed with status ${response.status}`);
    const data = await response.json();
    setExercises(await loadExerciseMedia(Array.isArray(data) ? data : []));
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
        if (isMounted) {
          setExercises(
            await loadExerciseMedia(Array.isArray(data) ? data : []),
          );
        }
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
    setAltSearchTerm("");
    setSelectedAltCandidateId("");
  };

  const openEditForm = async (exerciseId) => {
    setFormMode("edit");
    setFormLoading(true);
    setFormError("");
    setAltSearchTerm("");
    setSelectedAltCandidateId("");
    try {
      const [response, altResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/exercises/${exerciseId}`),
        fetch(`${API_BASE_URL}/api/exercises/${exerciseId}/alternatives`).catch(
          () => null,
        ),
      ]);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể tải bài tập");

      let rawAlternatives = Array.isArray(data.alternatives)
        ? data.alternatives
        : [];
      if (rawAlternatives.length === 0 && altResponse && altResponse.ok) {
        try {
          const altData = await altResponse.json();
          const list = Array.isArray(altData.data)
            ? altData.data
            : Array.isArray(altData)
              ? altData
              : [];
          if (list.length > 0) {
            rawAlternatives = list;
          }
        } catch {
          // ignore fallback error
        }
      }

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
        alternatives: rawAlternatives.map((item, index) => {
          const targetId = Number(
            item.alternativeExerciseId || item.exerciseId,
          );
          const matched = exercises.find(
            (ex) => Number(ex.exerciseId) === targetId,
          );
          return {
            alternativeExerciseId: targetId,
            exerciseName:
              item.exerciseName ||
              item.name ||
              matched?.name ||
              `Bài tập #${targetId}`,
            difficulty: item.difficulty || matched?.difficulty || "",
            priority: Number(item.priority || index + 1),
            note: item.note || "",
          };
        }),
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

  const availableCandidates = useMemo(() => {
    const selectedAltIds = new Set(
      (form.alternatives || []).map((alt) =>
        Number(alt.alternativeExerciseId),
      ),
    );
    const currentExerciseId =
      formMode === "edit" ? Number(form.exerciseId) : null;

    return exercises.filter((ex) => {
      const exId = Number(ex.exerciseId);
      if (currentExerciseId && exId === currentExerciseId) return false;
      if (selectedAltIds.has(exId)) return false;
      if (altSearchTerm.trim()) {
        const query = altSearchTerm.trim().toLowerCase();
        return (
          ex.name.toLowerCase().includes(query) ||
          (ex.description && ex.description.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [exercises, form.alternatives, form.exerciseId, formMode, altSearchTerm]);

  const handleAddAlternative = () => {
    if (!selectedAltCandidateId) return;
    const targetId = Number(selectedAltCandidateId);
    const candidate = exercises.find(
      (ex) => Number(ex.exerciseId) === targetId,
    );
    if (!candidate) return;

    const nextPriority =
      form.alternatives.length > 0
        ? Math.max(
            ...form.alternatives.map((a) => Number(a.priority) || 0),
          ) + 1
        : 1;

    setForm((current) => ({
      ...current,
      alternatives: [
        ...current.alternatives,
        {
          alternativeExerciseId: targetId,
          exerciseName: candidate.name,
          difficulty: candidate.difficulty || "",
          priority: nextPriority,
          note: "",
        },
      ],
    }));

    setSelectedAltCandidateId("");
    setAltSearchTerm("");
  };

  const handleRemoveAlternative = (index) => {
    setForm((current) => ({
      ...current,
      alternatives: current.alternatives.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateAlternativePriority = (index, value) => {
    setForm((current) => ({
      ...current,
      alternatives: current.alternatives.map((item, i) =>
        i === index ? { ...item, priority: value } : item,
      ),
    }));
  };

  const handleUpdateAlternativeNote = (index, value) => {
    setForm((current) => ({
      ...current,
      alternatives: current.alternatives.map((item, i) =>
        i === index ? { ...item, note: value } : item,
      ),
    }));
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

    for (const alt of form.alternatives) {
      const priorityNum = Number(alt.priority);
      if (!Number.isInteger(priorityNum) || priorityNum <= 0) {
        return setFormError(
          "Độ ưu tiên của bài tập thay thế phải là số nguyên lớn hơn 0.",
        );
      }
      if (alt.note && alt.note.length > 255) {
        return setFormError(
          "Ghi chú bài tập thay thế không được vượt quá 255 ký tự.",
        );
      }
    }

    const altIds = form.alternatives.map((a) =>
      Number(a.alternativeExerciseId),
    );
    if (new Set(altIds).size !== altIds.length) {
      return setFormError("Danh sách bài tập thay thế không được trùng lặp.");
    }
    if (
      formMode === "edit" &&
      form.exerciseId &&
      altIds.includes(Number(form.exerciseId))
    ) {
      return setFormError(
        "Không thể chọn chính bài tập hiện tại làm bài tập thay thế.",
      );
    }

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
      alternatives: form.alternatives.map((item) => ({
        alternativeExerciseId: Number(item.alternativeExerciseId),
        priority: Number(item.priority),
        note: item.note ? item.note.trim() : null,
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

  const shownStart = filteredExercises.length === 0 ? 0 : startIndex + 1;
  const shownEnd = Math.min(startIndex + PAGE_SIZE, filteredExercises.length);

  return (
    <div className="admin-page exercises-page">
      <AdminPageHeader
        eyebrow="Bài tập"
        title="Quản lý bài tập"
        description="Kho bài tập chuẩn khoa học, video hướng dẫn và phân loại nhóm cơ của GYMFORLIFE."
        actions={
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={openAddForm}
          >
            <AdminIcon name="plus" /> Thêm bài tập mới
          </button>
        }
      />

      <div className="admin-filter-bar">
        <AdminSearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm tên bài tập, nhóm cơ, thiết bị..."
        />

        <AdminFilterSelect
          label="Nhóm cơ"
          value={muscleFilter}
          onChange={handleMuscleChange}
        >
          <option value="ALL">Tất cả</option>
          {muscleOptions.map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          label="Thiết bị"
          value={equipmentFilter}
          onChange={handleEquipmentChange}
        >
          <option value="ALL">Tất cả</option>
          {equipmentOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          label="Độ khó"
          value={difficultyFilter}
          onChange={handleDifficultyChange}
        >
          <option value="ALL">Tất cả</option>
          {difficultyOptions.map((item) => (
            <option key={item} value={item}>
              {getDifficultyLabel(item)}
            </option>
          ))}
        </AdminFilterSelect>

        <button
          type="button"
          className="admin-button admin-button--icon"
          onClick={handleResetFilters}
          aria-label="Làm mới"
        >
          <AdminIcon name="refresh" />
        </button>
      </div>

      <div className="admin-card exercise-table-panel">
        <div className="exercise-table-scroll">
          <table className="admin-table exercise-table">
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
                  <td colSpan="9" className="admin-empty">
                    Đang tải danh sách bài tập...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="admin-empty">
                    {error}
                  </td>
                </tr>
              ) : paginatedExercises.length === 0 ? (
                <tr>
                  <td colSpan="9" className="admin-empty">
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
                      <td>
                        <ExercisePreview exercise={exercise} />
                      </td>
                      <td className="exercise-name-cell">
                        <strong>{exercise.name}</strong>
                      </td>
                      <td className="exercise-description-cell">
                        {exercise.description || "-"}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge--success">
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
                          className={`admin-badge difficulty-tag ${String(
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
                          <button
                            type="button"
                            className="admin-button admin-button--icon"
                            aria-label="Chỉnh sửa"
                            onClick={() => openEditForm(exercise.exerciseId)}
                          >
                            <AdminIcon name="edit" />
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
            <AdminPagination
              page={pageForDisplay}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {notice && <div className="exercise-notice">{notice}</div>}

      {formMode && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={closeForm}
        >
          <form
            className="admin-modal"
            onSubmit={submitForm}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>
                {formMode === "edit" ? "Chỉnh sửa bài tập" : "Thêm bài tập"}
              </h2>
              <button
                type="button"
                className="admin-button admin-button--icon"
                onClick={closeForm}
                aria-label="Đóng"
              >
                <AdminIcon name="close" />
              </button>
            </div>
            {formError && <p className="admin-form-error">{formError}</p>}
            {formLoading && formMode === "edit" ? (
              <p className="admin-empty">Đang tải dữ liệu...</p>
            ) : (
              <>
                <label className="admin-form-field">
                  Tên bài tập *
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    required
                  />
                </label>
                <label className="admin-form-field">
                  Mô tả
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    rows="3"
                  />
                </label>
                <label className="admin-form-field">
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
                <div className="admin-form-grid">
                  <label className="admin-form-field">
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
                  <label className="admin-form-field">
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
                <label className="admin-form-field">
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
                <div className="admin-form-field">
                  <div className="exercise-section-header">
                    <span>Bài tập thay thế</span>
                    {form.alternatives.length > 0 && (
                      <span className="admin-badge admin-badge--success">
                        {form.alternatives.length} bài tập
                      </span>
                    )}
                  </div>

                  <div className="exercise-alt-picker-row">
                    <input
                      type="text"
                      className="exercise-alt-search-input"
                      placeholder="Tìm kiếm bài tập thay thế..."
                      value={altSearchTerm}
                      onChange={(event) => {
                        setAltSearchTerm(event.target.value);
                        setSelectedAltCandidateId("");
                      }}
                    />
                    <select
                      className="exercise-alt-select"
                      value={selectedAltCandidateId}
                      onChange={(event) =>
                        setSelectedAltCandidateId(event.target.value)
                      }
                    >
                      <option value="">
                        {availableCandidates.length === 0
                          ? "-- Không có bài tập phù hợp --"
                          : `-- Chọn bài tập thay thế (${availableCandidates.length}) --`}
                      </option>
                      {availableCandidates.map((cand) => (
                        <option key={cand.exerciseId} value={cand.exerciseId}>
                          {cand.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="admin-button admin-button--secondary exercise-alt-add-btn"
                      onClick={handleAddAlternative}
                      disabled={!selectedAltCandidateId}
                    >
                      <AdminIcon name="plus" /> Thêm
                    </button>
                  </div>

                  {form.alternatives.length === 0 ? (
                    <div className="exercise-alt-empty">
                      Chưa có bài tập thay thế nào. Tìm kiếm hoặc chọn bài tập ở trên và nhấn "Thêm".
                    </div>
                  ) : (
                    <div className="exercise-alt-list">
                      {form.alternatives.map((altItem, index) => (
                        <div
                          key={`${altItem.alternativeExerciseId}-${index}`}
                          className="exercise-alt-item"
                        >
                          <div className="exercise-alt-item-header">
                            <div className="exercise-alt-item-name">
                              <strong>
                                {altItem.exerciseName ||
                                  `Bài tập #${altItem.alternativeExerciseId}`}
                              </strong>
                              {altItem.difficulty && (
                                <span
                                  className={`admin-badge difficulty-tag ${String(
                                    altItem.difficulty,
                                  )
                                    .trim()
                                    .toLowerCase()}`}
                                >
                                  {getDifficultyLabel(altItem.difficulty)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="admin-button admin-button--danger"
                              onClick={() => handleRemoveAlternative(index)}
                              aria-label={`Xóa bài tập thay thế ${altItem.exerciseName}`}
                            >
                              Xóa
                            </button>
                          </div>
                          <div className="exercise-alt-item-body">
                            <label className="exercise-alt-control exercise-alt-priority">
                              <span className="exercise-alt-label">Ưu tiên:</span>
                              <input
                                type="number"
                                min="1"
                                max="127"
                                value={altItem.priority}
                                onChange={(event) =>
                                  handleUpdateAlternativePriority(
                                    index,
                                    event.target.value,
                                  )
                                }
                                required
                              />
                            </label>
                            <label className="exercise-alt-control exercise-alt-note">
                              <span className="exercise-alt-label">Ghi chú:</span>
                              <input
                                type="text"
                                placeholder="Ghi chú (vd: Thay thế khi không có thiết bị...)"
                                value={altItem.note}
                                onChange={(event) =>
                                  handleUpdateAlternativeNote(
                                    index,
                                    event.target.value,
                                  )
                                }
                                maxLength={255}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="admin-form-field">
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
                        <button
                          type="button"
                          className="exercise-media-thumbnail"
                          onClick={() => setSelectedMedia(item)}
                          aria-label="Xem media bài tập"
                        >
                          {item.mediaType === "VIDEO" ? (
                            <video
                              src={item.mediaUrl}
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <img src={item.mediaUrl} alt="Media bài tập" />
                          )}
                        </button>
                        <span>
                          {item.mediaType} {item.mediaUrl.split("/").pop()}
                        </span>
                        <button
                          type="button"
                          className="admin-button admin-button--danger"
                          onClick={() => removeMedia(item)}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
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

      {selectedMedia && (
        <div
          className="exercise-media-preview-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedMedia(null)}
        >
          <div
            className="exercise-media-preview"
            role="dialog"
            aria-modal="true"
            aria-label="Xem media bài tập"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="admin-button admin-button--icon exercise-media-preview-close"
              onClick={() => setSelectedMedia(null)}
              aria-label="Đóng xem media"
            >
              <AdminIcon name="close" />
            </button>
            {selectedMedia.mediaType === "VIDEO" ? (
              <video
                className="exercise-media-preview-content"
                src={selectedMedia.mediaUrl}
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                className="exercise-media-preview-content"
                src={selectedMedia.mediaUrl}
                alt="Media bài tập"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisesPage;
