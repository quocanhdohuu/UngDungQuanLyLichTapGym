const programs = [
  {
    name: "Push Pull Legs (PPL)",
    meta: "6 buổi/tuần • Hypertrophy",
    badge: "Active",
    stats: "4,820    4.9",
    id: "GF-PPL-01",
    active: true,
  },
  {
    name: "Beginner Full Body",
    meta: "3 buổi/tuần • Adaptation",
    badge: "Cơ bản",
    stats: "8,110    4.8",
  },
  {
    name: "Upper / Lower Split",
    meta: "4 buổi/tuần • Powerbuilding",
    badge: "Trung cấp",
  },
  {
    name: "Advanced Strength 5/3/1",
    meta: "5 buổi/tuần • Pure Strength",
    badge: "Chuyên sâu",
    stats: "1,290    5.0",
  },
];

const dayOneExercises = [
  [
    "Barbell Bench Press",
    "4 hiệp × 10 reps",
    "Nghỉ 90s",
    "Progressive Overload",
  ],
  ["Incline Dumbbell Press", "3 hiệp × 12 reps", "Nghỉ 60s", "RPE 8.0"],
  ["Dips (Xà kép bodyweight / tạ)", "3 hiệp × 15 reps", "Nghỉ 45s", ""],
];

const dayTwoExercises = [
  ["Conventional Deadlift", "4 hiệp × 8 reps", "120s"],
  ["Wide-Grip Lat Pulldown", "3 hiệp × 12 reps", "60s"],
  ["Bent-Over Barbell Row", "3 hiệp × 10 reps", "75s"],
  ["Incline Dumbbell Bicep Curls", "3 hiệp × 12 reps", "45s"],
];

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
    mobile: (
      <>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M10 18h4" />
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
    save: (
      <>
        <path d="M5 4h12l2 2v14H5z" />
        <path d="M8 4v6h8V4M9 20v-5h6v5" />
      </>
    ),
  };
  return <svg {...props}>{paths[type] || paths.plus}</svg>;
}

function DayCard({
  day,
  title,
  subtitle,
  duration,
  exercises,
  collapsed = false,
}) {
  return (
    <section className={`workout-day-card ${collapsed ? "collapsed" : ""}`}>
      <div className="workout-day-header">
        <span className="workout-grip">
          <WorkoutIcon type="grip" />
        </span>
        <span className="workout-day-number">{day}</span>
        <strong>{title}</strong>
        <span className="workout-day-subtitle">{subtitle}</span>
        <span className="workout-day-meta">
          {exercises.length + 1} bài tập • ~{duration} phút
        </span>
        <button type="button" className="workout-chevron" aria-label="Thu gọn">
          <WorkoutIcon type="chevron" />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="workout-exercise-list">
            {exercises.map(([name, sets, rest, note]) => (
              <div className="workout-exercise-row" key={name}>
                <span className="workout-row-grip">
                  <WorkoutIcon type="grip" />
                </span>
                <span className="workout-thumb" />
                <div className="workout-exercise-name">
                  <strong>{name}</strong>
                  <span>
                    {sets} <i>•</i> {rest}
                  </span>
                </div>
                {note && (
                  <span
                    className={`workout-note ${note.startsWith("RPE") ? "plain" : ""}`}
                  >
                    {note}
                  </span>
                )}
                <span className="workout-row-actions">☷⋮</span>
              </div>
            ))}
          </div>
          <button type="button" className="workout-add-exercise">
            <WorkoutIcon type="plus" /> Thêm bài tập vào {day}
          </button>
        </>
      )}
    </section>
  );
}

const WorkoutTemplatesPage = () => (
  <div className="workout-page">
    <div className="workout-page-header">
      <div>
        <div className="workout-breadcrumb">
          <span>HOME</span>
          <b>/</b>
          <span>CHƯƠNG TRÌNH</span>
          <b>/</b>
          <strong>QUẢN LÝ LỊCH TẬP MẪU</strong>
        </div>
        <h1>Quản lý lịch tập mẫu & Program Builder</h1>
        <p>
          Thiết kế, xây dựng và phân phối giáo án tập luyện chuẩn khoa học cho
          hội viên GYMFORLIFE.
        </p>
      </div>
      <div className="workout-header-actions">
        <div className="workout-version">
          <b>V2.4</b>
          <span>LIVE</span>
        </div>
        <button type="button" className="workout-import">
          ⇧ Import CSV
        </button>
        <button type="button" className="workout-create">
          <WorkoutIcon type="plus" /> TẠO CHƯƠNG TRÌNH MỚI
        </button>
      </div>
    </div>

    <div className="workout-filter-bar">
      <label className="workout-search">
        <WorkoutIcon type="search" />
        <input
          readOnly
          placeholder="Tìm giáo án theo tên, nhóm cơ, mục tiêu..."
        />
      </label>
      <button type="button">
        <span>
          <WorkoutIcon type="filter" />
        </span>
        Intermediate (Trung cấp)<b>⌄</b>
      </button>
      <button type="button">
        <span>
          <WorkoutIcon type="calendar" />
        </span>
        5 - 6 buổi / tuần<b>⌄</b>
      </button>
    </div>

    <div className="workout-builder-grid">
      <div className="workout-left-column">
        <section className="workout-library workout-card">
          <div className="workout-card-title">
            <strong>THƯ VIỆN GIÁO ÁN MẪU (4)</strong>
            <WorkoutIcon type="filter" />
          </div>
          <div className="workout-program-list">
            {programs.map((program) => (
              <div
                className={`workout-program ${program.active ? "selected" : ""}`}
                key={program.name}
              >
                <div className="workout-program-top">
                  <strong>{program.name}</strong>
                  <span>{program.badge}</span>
                </div>
                <small>{program.meta}</small>
                {program.stats && (
                  <div className="workout-program-stats">♟ {program.stats}</div>
                )}
                {program.id && <em>ID: {program.id}</em>}
              </div>
            ))}
          </div>
        </section>

        <section className="workout-detail workout-card">
          <div className="workout-detail-heading">
            <strong>CHI TIẾT GIÁO ÁN ĐANG SỬA</strong>
            <WorkoutIcon type="edit" />
          </div>
          <h2>Push Pull Legs (PPL Split)</h2>
          <small>Mã định danh khoa học: PPL-HYP-6D</small>
          <div className="workout-detail-stats">
            <div>
              Độ khó<strong>◈ Intermediate</strong>
            </div>
            <div>
              Tần suất<strong>6 buổi / tuần</strong>
            </div>
          </div>
          <h3>MỤC TIÊU &amp; CƠ CHẾ</h3>
          <p>
            Tối ưu hóa phát triển cơ bắp toàn diện với tần suất 2 lần/tuần cho
            mỗi nhóm cơ. Sử dụng progressive overload có kiểm soát cho
            hypertrophy.
          </p>
          <div className="workout-athlete-stat">
            <strong>4,820</strong>
            <span>Athletes</span>
            <b>★ 4.9 / 5.0</b>
          </div>
          <div className="workout-completion">
            <span>Độ hoàn thiện nội dung</span>
            <b>100% Sẵn sàng</b>
            <i>
              <em />
            </i>
          </div>
        </section>
      </div>

      <div className="workout-right-column">
        <section className="workout-structure workout-card">
          <div>
            <h2>Cấu trúc tuần tập luyện (PPL Split)</h2>
            <p>
              Kéo thả các bài tập để điều chỉnh thứ tự hoặc chuyển chuyển giữa
              các ngày tập.
            </p>
          </div>
          <span className="workout-cycle">
            <b>6 Ngày</b>Microcycle
          </span>
          <button type="button" className="workout-mobile">
            <WorkoutIcon type="mobile" /> Xem trước Mobile
          </button>
          <button type="button" className="workout-add-day">
            <WorkoutIcon type="plus" /> Thêm ngày tập
          </button>
        </section>
        <DayCard
          day="DAY 1"
          title="PUSH"
          subtitle="(Ngực, Vai, Tay sau)"
          duration="65"
          exercises={dayOneExercises}
        />
        <DayCard
          day="DAY 2"
          title="PULL"
          subtitle="(Lưng, Xô, Tay trước)"
          duration="70"
          exercises={dayTwoExercises}
        />
        <DayCard
          day="DAY 3"
          title="LEGS"
          subtitle="(Đùi trước, Đùi sau, Bắp chân)"
          duration="75"
          exercises={[]}
          collapsed
        />
      </div>
    </div>

    <div className="workout-save-bar">
      <div>
        <span className="workout-warning-dot" />
        <strong>Trạng thái: Có 3 thay đổi chưa lưu</strong>
        <small>Lần tự động lưu gần nhất: 14:32:10 hôm nay</small>
      </div>
      <button type="button">Hủy thay đổi</button>
      <button type="button" className="workout-save">
        <WorkoutIcon type="save" /> LƯU CHƯƠNG TRÌNH
      </button>
    </div>
  </div>
);

export default WorkoutTemplatesPage;
