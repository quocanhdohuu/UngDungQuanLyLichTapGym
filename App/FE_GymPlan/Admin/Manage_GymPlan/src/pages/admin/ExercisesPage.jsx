import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 5;
const EXERCISES_API_URL = "http://localhost:3000/exercises/summary";

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

  useEffect(() => {
    let isMounted = true;

    const loadExercises = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(EXERCISES_API_URL);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setExercises(Array.isArray(data) ? data : []);
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

    loadExercises();

    return () => {
      isMounted = false;
    };
  }, []);

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
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedExercises = filteredExercises.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        <button type="button" className="exercise-add-button">
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
                          <button type="button" aria-label="Chỉnh sửa">
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
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Trang trước
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === currentPage ? "active" : ""}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={currentPage === totalPages}
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
    </div>
  );
};

export default ExercisesPage;
