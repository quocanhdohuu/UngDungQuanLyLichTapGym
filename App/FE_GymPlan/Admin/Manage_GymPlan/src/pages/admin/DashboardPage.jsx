import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000/api/dashboard";

const formatNumber = (value) => Number(value ?? 0).toLocaleString("vi-VN");

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || "Request thất bại";
  } catch {
    return `Request thất bại (${response.status})`;
  }
};

const request = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  const payload = await response.json();
  return payload.data ?? payload;
};

const getDifficultyTone = (difficulty) => {
  switch (difficulty) {
    case "EASY":
      return "var(--green)";
    case "MEDIUM":
      return "var(--orange)";
    case "HARD":
      return "var(--red)";
    default:
      return "var(--text-muted)";
  }
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [workoutActivity, setWorkoutActivity] = useState([]);
  const [exerciseStats, setExerciseStats] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTemplates, setRecentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          summaryData,
          growthData,
          activityData,
          statisticsData,
          usersData,
          templatesData,
        ] = await Promise.all([
          request("/summary"),
          request("/user-growth?months=6"),
          request("/workout-activity"),
          request("/exercise-statistics"),
          request("/recent-users?limit=5"),
          request("/recent-workout-templates?limit=5"),
        ]);

        if (!mounted) return;

        setSummary(summaryData || null);
        setUserGrowth(Array.isArray(growthData) ? growthData : []);
        setWorkoutActivity(Array.isArray(activityData) ? activityData : []);
        setExerciseStats(Array.isArray(statisticsData) ? statisticsData : []);
        setRecentUsers(Array.isArray(usersData) ? usersData : []);
        setRecentTemplates(Array.isArray(templatesData) ? templatesData : []);
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || "Không thể tải dữ liệu dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const chartMax = useMemo(() => {
    const values = userGrowth.map((item) => Number(item.totalUsers || 0));
    return Math.max(...values, 1);
  }, [userGrowth]);

  const totalExerciseStats = useMemo(
    () =>
      exerciseStats.reduce(
        (sum, item) => sum + Number(item.totalExercises || 0),
        0,
      ),
    [exerciseStats],
  );

  const handleViewAllUsers = () => {
    navigate("/admin/users", { replace: true });
  };

  const pageHeader = (
    <AdminPageHeader
      eyebrow="Trang chủ"
      title="Tổng quan hệ thống"
      description="Thống kê người dùng, bài tập và lịch tập mẫu đang hoạt động."
    />
  );

  if (loading || error) {
    return (
      <div className="admin-page dashboard-page">
        {pageHeader}
        <div className="admin-card">
          <p className={error ? "admin-form-error" : "admin-empty"}>
            {error || "Đang tải dữ liệu..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page dashboard-page">
      {pageHeader}
      <div className="dashboard-kpis">
        {[
          {
            label: "Tổng người dùng",
            value: formatNumber(summary?.totalUsers),
            accent: "var(--green)",
          },
          {
            label: "Tổng bài tập",
            value: formatNumber(summary?.totalExercises),
            accent: "var(--admin-info)",
          },
          {
            label: "Lịch tập mẫu",
            value: formatNumber(summary?.totalWorkoutTemplates),
            accent: "var(--orange)",
          },
          {
            label: "Người dùng mới",
            value: formatNumber(summary?.newUsersThisMonth),
            accent: "var(--red)",
          },
          {
            label: "Buổi tập tháng này",
            value: formatNumber(summary?.workoutSessionsThisMonth),
            accent: "var(--admin-purple)",
          },
        ].map((item) => (
          <div key={item.label} className="admin-card">
            <div className="dashboard-kpi-label">{item.label}</div>
            <div
              className="dashboard-kpi-value"
              style={{ "--kpi-accent": item.accent }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-columns">
        <section className="admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon">↗</div>
            <div>
              <h2>Tăng trưởng người dùng</h2>
              <p>Đăng ký theo tháng</p>
            </div>
          </div>
          <div className="dashboard-chart">
            {userGrowth.length === 0 ? (
              <div className="admin-empty">Không có dữ liệu tăng trưởng.</div>
            ) : userGrowth.map((item) => (
              <div key={item.monthKey} className="dashboard-chart-item">
                <div className="dashboard-chart-column">
                  <span>{item.totalUsers || 0}</span>
                  <div
                    className="dashboard-chart-bar"
                    title={`${item.monthLabel}: ${item.totalUsers} người dùng`}
                    style={{
                      height: `${Math.max((Number(item.totalUsers || 0) / chartMax) * 120, 10)}px`,
                    }}
                  />
                  <span>{item.monthLabel.split("/")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon">◔</div>
            <div>
              <h2>Thống kê bài tập</h2>
              <p>Theo độ khó</p>
            </div>
          </div>
          <div className="dashboard-statistics">
            {exerciseStats.length === 0 ? (
              <div className="admin-empty">Không có dữ liệu thống kê bài tập.</div>
            ) : exerciseStats.map((item) => {
              const percentage = totalExerciseStats > 0
                ? (Number(item.totalExercises || 0) / totalExerciseStats) * 100 : 0;
              return (
                <div key={item.difficulty}>
                  <div className="dashboard-stat-label">
                    <span>{item.difficulty}</span>
                    <span>{item.totalExercises || 0} ({Number(item.percentage || 0)}%)</span>
                  </div>
                  <div className="dashboard-progress">
                    <div
                      className="dashboard-progress-fill"
                      style={{
                        width: `${percentage}%`,
                        background: getDifficultyTone(item.difficulty),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="dashboard-columns">
        <section className="admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon">▣</div>
            <div>
              <h2>Hoạt động tập luyện</h2>
              <p>Thống kê theo ngày</p>
            </div>
          </div>
          <div className="dashboard-card-content">
            {workoutActivity.length === 0 ? (
              <div className="admin-empty">Không có dữ liệu hoạt động tập luyện.</div>
            ) : (
              <div className="dashboard-list">
                {workoutActivity.map((row, index) => (
                  <div key={`${row.date || index}`} className="dashboard-list-row dashboard-activity-row">
                    <span>{row.date || "-"}</span>
                    <span className="dashboard-meta">{row.totalSessions || 0} buổi</span>
                    <span className="dashboard-accent">{row.activeUsers || 0} user</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon">✓</div>
            <div>
              <h2>Người dùng mới</h2>
              <p>Top 5 gần đây</p>
            </div>
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={handleViewAllUsers}
            >Xem tất cả</button>
          </div>
          <div className="dashboard-card-content">
            {recentUsers.length === 0 ? (
              <div className="admin-empty">Không có người dùng mới.</div>
            ) : (
              <div className="dashboard-list">
                {recentUsers.map((user) => (
                  <div key={user.accountId || user.profileId} className="dashboard-list-row">
                    <div>
                      <div className="dashboard-list-title">{user.fullName || user.username || "-"}</div>
                      <small>{user.email || "-"}</small>
                    </div>
                    <div className="dashboard-user-badges">
                      <span className="admin-badge">{user.level || "-"}</span>
                      <span className={`admin-badge status-tag ${String(user.accountStatus || "").toLowerCase()}`}>{user.accountStatus || "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div className="admin-card-icon">▤</div>
          <div>
            <h2>Lịch tập mẫu gần đây</h2>
            <p>Top 5 được tạo mới nhất</p>
          </div>
        </div>
        <div className="dashboard-card-content">
          {recentTemplates.length === 0 ? (
            <div className="admin-empty">Không có lịch tập mẫu gần đây.</div>
          ) : (
            <div className="dashboard-list">
              {recentTemplates.map((template) => (
                <div key={template.planId} className="dashboard-list-row dashboard-template-row">
                  <div>
                    <div className="dashboard-list-title">{template.title || "-"}</div>
                    <small>{template.description || "-"}</small>
                  </div>
                  <span className="admin-badge">{template.level || "-"}</span>
                  <span className="dashboard-meta">{template.durationWeeks ?? "—"} tuần • {template.totalDays || 0} ngày</span>
                  <span className="dashboard-meta">{template.totalExercises || 0} bài</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
