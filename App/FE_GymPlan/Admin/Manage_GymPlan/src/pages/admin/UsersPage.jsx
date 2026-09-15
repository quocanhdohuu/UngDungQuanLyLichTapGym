const users = [
  {
    id: "#GFL-8921",
    name: "Quoc Anh",
    role: "Pro Athlete",
    email: "quocanh.fit@gymforlife.app",
    phone: "+84 908 123 456",
    status: "VIP PRO",
    level: "Intermediate",
    state: "ONLINE",
    avatar: "QA",
    accent: "green",
    details: {
      height: "175 cm",
      weight: "67.0 kg",
      bmi: "21.9",
      goal: "TĂNG CƠ",
      progress: 75,
      currentPlan: "Push Pull Legs Split (PPL)",
      week: "Tuần 4/8",
      completed: "24/32 buổi",
      volume: "185.4T",
      pr: {
        bench: "60 kg",
        squat: "100 kg",
        deadlift: "120 kg",
      },
      workout: "Push Day - Chest & Triceps",
      workoutWeight: "12.5 T",
      workoutMeta: "6 bài tập • 18 sets hoàn thành",
      duration: "45 phút",
    },
  },
  {
    id: "#GFL-8922",
    name: "Tran Hoang Minh",
    role: "Standard Lifter",
    email: "minh.tran@gmail.com",
    phone: "+84 914 345 678",
    status: "ACTIVE",
    level: "Beginner",
    state: "AD",
    avatar: "TM",
    accent: "gray",
  },
  {
    id: "#GFL-8923",
    name: "Le Thu Ha",
    role: "Standard Lifter",
    email: "thuh.a.fitness@gmail.com",
    phone: "+84 983 222 111",
    status: "ACTIVE",
    level: "Intermediate",
    state: "BE",
    avatar: "LH",
    accent: "gray",
  },
  {
    id: "#GFL-8924",
    name: "Đặng Nam",
    role: "Tài khoản bị khóa",
    email: "dangnam.sg@yahoo.com",
    phone: "+84 908 888 999",
    status: "LOCKED",
    level: "Beginner",
    state: "DN",
    avatar: "DN",
    accent: "red",
  },
  {
    id: "#GFL-8925",
    name: "Nguyen Van Huy",
    role: "Standard Lifter",
    email: "huy.nguyen@outlook.com",
    phone: "+84 977 444 333",
    status: "ACTIVE",
    level: "Intermediate",
    state: "BE",
    avatar: "NH",
    accent: "gray",
  },
];

const stats = [
  {
    label: "TỔNG HỘI VIÊN",
    value: "12,450",
    delta: "+12%",
    hint: "So với tháng trước (11,116)",
    accent: "bright",
  },
  { label: "ĐANG HOẠT ĐỘNG", value: "9,820", delta: "78.8%", progress: 78.8 },
  { label: "HỘI VIÊN VIP / PRO", value: "3,240", delta: "26.0%", progress: 26 },
  {
    label: "TRONG PHIÊN TẬP",
    value: "412",
    delta: "athletes active",
    accent: "muted",
  },
];

const selectedUser = users[0];

function UsersPage() {
  return (
    <div className="users-page">
      <div className="page-header-row">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="crumb-separator">›</span>
          <span>Quản lý</span>
          <span className="crumb-separator">›</span>
          <span className="current">Người dùng</span>
        </div>

        <div className="page-header-actions">
          <button type="button" className="secondary-btn">
            Xuất file Excel
          </button>
          <button type="button" className="primary-btn">
            THÊM NGƯỜI DÙNG
          </button>
        </div>
      </div>

      <div className="page-title-row">
        <div>
          <h1>Quản lý người dùng</h1>
        </div>
        <div className="title-badge">12,450 TỔNG</div>
      </div>

      <p className="page-description">
        Quản lý tài khoản, thể trạng và trạng thái hoạt động của người dùng
        GYMFORLIFE.
      </p>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.accent || ""}`}>
            <div className="stat-head">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-icon">◌</span>
            </div>
            <div className="stat-main-row">
              <div className="stat-value">{stat.value}</div>
              {stat.delta && <div className="stat-delta">{stat.delta}</div>}
            </div>
            {stat.hint && <div className="stat-hint">{stat.hint}</div>}
            {typeof stat.progress === "number" && (
              <div className="mini-progress">
                <span style={{ width: `${stat.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="user-controls">
        <div className="search-box">
          <span className="search-inline">⌕</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, ID..."
            readOnly
          />
        </div>

        <div className="filter-chip">TRÌNH ĐỘ: Intermediate</div>
        <div className="filter-chip">TRẠNG THÁI: Tất cả</div>
        <div className="filter-chip">TẦN SUẤT: Tất cả lịch</div>

        <div className="filter-tools">
          <button type="button" className="icon-btn" aria-label="Reset">
            ↻
          </button>
          <button type="button" className="icon-btn" aria-label="Filter">
            ⎇
          </button>
        </div>
      </div>

      <div className="table-panel">
        <div className="user-table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th className="stt-col">STT</th>
                <th>HỘI VIÊN</th>
                <th>LIÊN HỆ</th>
                <th>TRÌNH ĐỘ</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={index === 0 ? "selected" : ""}>
                  <td className="stt-cell">{index + 1}</td>
                  <td className="member-cell">
                    <div className="member-avatar">{user.avatar}</div>
                    <div className="member-copy">
                      <div className="name-line">{user.name}</div>
                      <div className="role-line">{user.role}</div>
                    </div>
                  </td>
                  <td className="contact-cell">
                    <div className="contact-email">{user.email}</div>
                    <div className="contact-phone">{user.phone}</div>
                  </td>
                  <td>
                    <span
                      className={`level-tag ${user.level === "Intermediate" ? "intermediate" : "regular"}`}
                    >
                      {user.level}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-tag ${user.status === "Tài khoản bị khóa" || user.status === "LOCKED" ? "locked" : "active"}`}
                    >
                      {user.status === "LOCKED"
                        ? "Khóa"
                        : user.status === "Tài khoản bị khóa"
                          ? "Tài khoản bị khóa"
                          : "Hoạt động"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="detail-panel">
          <div className="detail-panel-header">
            <span>HỒ SƠ CHI TIẾT</span>
            <span className="panel-id">
              #{selectedUser.id.replace("#", "")}
            </span>
          </div>

          <div className="detail-top">
            <div className="user-avatar-large">QA</div>
            <div className="detail-user-main">
              <div className="detail-name-row">
                <h3>Quoc Anh</h3>
                <span className="vip-tag">VIP PRO</span>
              </div>
              <div className="detail-email">quocanh.fit@gymforlife.app</div>
              <div className="detail-role">Pro Athlete</div>
              <div className="detail-meta">Gia nhập: 12/04/2024 (7 tháng)</div>
            </div>
          </div>

          <div className="stats-detail-grid">
            <div className="body-metric">
              <span>CHIỀU CAO</span>
              <strong>175 cm</strong>
            </div>
            <div className="body-metric">
              <span>CÂN NẶNG</span>
              <strong>67.0 kg</strong>
            </div>
            <div className="body-metric">
              <span>BMI</span>
              <strong>21.9</strong>
            </div>
            <div className="body-metric">
              <span>MỤC TIÊU</span>
              <strong>TĂNG CƠ</strong>
            </div>
          </div>

          <div className="detail-section">
            <div className="section-label-row">
              <span>Lịch tập hiện tại</span>
              <span className="progress-text">75% Tiến độ</span>
            </div>
            <div className="plan-name">Push Pull Legs Split (PPL)</div>
            <div className="week-row">
              <span>Tuần 4/8</span>
            </div>
            <div className="mini-progress dark">
              <span style={{ width: "75%" }} />
            </div>
            <div className="session-meta">Đã hoàn thành 24/32 buổi</div>
            <div className="weight-meta">Khối lượng: 185.4T</div>
          </div>

          <div className="detail-section">
            <div className="section-title-row">
              <span>KỶ LỤC CÁ NHÂN (PERSONAL RECORDS)</span>
            </div>
            <div className="pr-grid">
              <div className="pr-item">
                <div className="pr-name">Bench Press</div>
                <div className="pr-value">60 kg</div>
                <span className="pr-badge">PR 1RM</span>
              </div>
              <div className="pr-item">
                <div className="pr-name">Squat</div>
                <div className="pr-value">100 kg</div>
                <span className="pr-badge">PR 1RM</span>
              </div>
              <div className="pr-item">
                <div className="pr-name">Deadlift</div>
                <div className="pr-value">120 kg</div>
                <span className="pr-badge">PR 1RM</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="section-title-row">
              <span>PHIÊN TẬP GẦN NHẤT</span>
              <span>Hôm nay</span>
            </div>
            <div className="recent-workout-title">
              Push Day - Chest & Triceps
            </div>
            <div className="recent-workout-stats">
              <span>12.5 T</span>
              <span>45 phút</span>
            </div>
            <div className="session-meta">6 bài tập • 18 sets hoàn thành</div>
          </div>

          <div className="detail-actions">
            <button type="button" className="secondary-action">
              Chỉnh sửa thông tin
            </button>
            <button type="button" className="secondary-action">
              Đặt lại MK
            </button>
            <button type="button" className="danger-action">
              Khóa tài khoản
            </button>
          </div>
        </aside>
      </div>

      <div className="pagination-row">
        <span>Hiển thị 1–10 của 12,450 người dùng</span>
        <div className="pagination">
          <button type="button" className="page-arrow">
            ‹
          </button>
          <button type="button" className="page-number active">
            1
          </button>
          <button type="button" className="page-number">
            2
          </button>
          <button type="button" className="page-number">
            3
          </button>
          <button type="button" className="page-number dots">
            ...
          </button>
          <button type="button" className="page-number">
            124
          </button>
          <button type="button" className="page-arrow">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
