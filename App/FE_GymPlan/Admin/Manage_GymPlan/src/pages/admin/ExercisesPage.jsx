const exercises = [
  {
    id: "#EX-101",
    name: "Barbell Bench Press",
    description: "Đẩy ngực ngang đòn",
    primary: "Ngực - Chest",
    secondary: "Tay sau, Vai trước",
    equipment: "Đòn Barbell",
    difficulty: "Intermediate",
    status: "Đang dùng",
  },
  {
    id: "#EX-102",
    name: "Incline Dumbbell Press",
    description: "Đẩy ngực trên tạ đơn",
    primary: "Ngực trên",
    secondary: "Vai trước, Tay sau",
    equipment: "Tạ Dumbbell",
    difficulty: "Beginner",
    status: "Đang dùng",
  },
  {
    id: "#EX-103",
    name: "Barbell Back Squat",
    description: "Gánh tạ đòn sau lưng",
    primary: "Đùi trước - Quads",
    secondary: "Mông (Glutes), Lưng dưới",
    equipment: "Đòn Barbell",
    difficulty: "Advanced",
    status: "Đang dùng",
  },
  {
    id: "#EX-104",
    name: "Romanian Deadlift (RDL)",
    description: "Kéo tạ chân thẳng đùi sau",
    primary: "Đùi sau - Hamstrings",
    secondary: "Mông, Lưng dưới",
    equipment: "Đòn Barbell",
    difficulty: "Intermediate",
    status: "Bản nháp",
  },
  {
    id: "#EX-105",
    name: "Overhead Shoulder Press",
    description: "Đẩy vai qua đầu",
    primary: "Vai - Shoulders",
    secondary: "Tay sau, Cơ vai",
    equipment: "Đòn Barbell",
    difficulty: "Intermediate",
    status: "Đang dùng",
  },
];

const statCards = [
  {
    label: "TỔNG SỐ BÀI TẬP",
    value: "342",
    detail: "bài trong kho",
    icon: "exercise",
  },
  {
    label: "ĐÃ CÓ VIDEO 4K",
    value: "310",
    detail: "90.6%",
    icon: "video",
    accent: "green",
  },
  {
    label: "COMPOUND LIFT",
    value: "48",
    detail: "Đa khớp chính",
    icon: "compound",
    accent: "orange",
  },
  {
    label: "ĐANG KÍCH HOẠT",
    value: "338",
    detail: "4 Bản nháp",
    icon: "active",
    accent: "green",
  },
];

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

  if (name === "video") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    );
  }

  if (name === "compound") {
    return (
      <svg {...props}>
        <circle cx="7" cy="12" r="3" />
        <circle cx="17" cy="12" r="3" />
        <path d="M10 12h4" />
      </svg>
    );
  }

  if (name === "active") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.3 2.3 4.7-5" />
      </svg>
    );
  }

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

      <div className="exercise-stats-grid">
        {statCards.map((stat) => (
          <div className="exercise-stat-card" key={stat.label}>
            <div className="exercise-stat-label">{stat.label}</div>
            <div className={`exercise-stat-icon ${stat.accent || ""}`}>
              <ExerciseIcon name={stat.icon} />
            </div>
            <div className="exercise-stat-value-row">
              <strong className={stat.accent || ""}>{stat.value}</strong>
              <span>{stat.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="exercise-filter-panel">
        <div className="exercise-search">
          <span>⌕</span>
          <input readOnly placeholder="Tìm tên bài tập, nhóm cơ, thiết bị..." />
        </div>
        <button type="button" className="exercise-filter">
          Nhóm cơ: Tất cả (Toàn thân)<span>⌄</span>
        </button>
        <button type="button" className="exercise-filter">
          Thiết bị: Tất cả<span>⌄</span>
        </button>
        <button type="button" className="exercise-filter">
          Độ khó: Tất cả<span>⌄</span>
        </button>
        <button type="button" className="exercise-refresh" aria-label="Làm mới">
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
                <th>CƠ CHÍNH</th>
                <th>CƠ PHỤ</th>
                <th>THIẾT BỊ</th>
                <th>ĐỘ KHÓ</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise, index) => (
                <tr key={exercise.id}>
                  <td className="exercise-stt">{index + 1}</td>
                  <td>
                    <div
                      className="exercise-preview"
                      aria-label={`Preview ${exercise.name}`}
                    />
                  </td>
                  <td className="exercise-name-cell">
                    <strong>{exercise.name}</strong>
                    <span>{exercise.description}</span>
                  </td>
                  <td>
                    <span className="muscle-tag">{exercise.primary}</span>
                  </td>
                  <td className="exercise-secondary">{exercise.secondary}</td>
                  <td className="exercise-equipment">⚒ {exercise.equipment}</td>
                  <td>
                    <span
                      className={`difficulty-tag ${exercise.difficulty.toLowerCase()}`}
                    >
                      {exercise.difficulty}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`exercise-status ${exercise.status === "Bản nháp" ? "draft" : "active"}`}
                    >
                      <i />
                      {exercise.status}
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
              ))}
            </tbody>
          </table>
        </div>
        <div className="exercise-pagination">
          <span>Hiển thị 1 - 5 trên 342 bài tập</span>
          <div>
            <button type="button" disabled>
              Trang trước
            </button>
            <button type="button" className="active">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>...</span>
            <button type="button">69</button>
            <button type="button">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExercisesPage;
