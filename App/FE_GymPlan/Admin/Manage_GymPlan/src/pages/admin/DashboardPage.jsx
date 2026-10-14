import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDateRangeFilter from "../../components/admin/AdminDateRangeFilter";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Share only in-flight GETs, including React StrictMode's mount cycle.
const pendingRequests = new Map();
const request = (path) => {
  if (!pendingRequests.has(path)) {
    const promise = fetch(`${API_BASE_URL}${path}`).then(async (response) => {
      if (!response.ok) throw new Error(await getErrorMessage(response));
      return response.json();
    }).finally(() => pendingRequests.delete(path));
    pendingRequests.set(path, promise);
  }
  return pendingRequests.get(path);
};

const formatDate = (date) => date.split("-").reverse().join("/");

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
  const [filter, setFilter] = useState({ range: "THIS_MONTH" });
  const [displayedPeriod, setDisplayedPeriod] = useState(null);
  const [retry, setRetry] = useState(0);
  const exerciseRequest = useRef(null);

  const applyFilter = (next) => {
    setFilter((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
  };

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams(filter).toString();
        if (!exerciseRequest.current) {
          exerciseRequest.current = request("/exercise-statistics").catch((requestError) => {
            exerciseRequest.current = null;
            throw requestError;
          });
        }
        const [
          summaryData,
          growthData,
          activityData,
          statisticsData,
          usersData,
          templatesData,
        ] = await Promise.all([
          request(`/summary?${query}`),
          request(`/user-growth?${query}`),
          request(`/workout-activity?${query}`),
          exerciseRequest.current,
          request(`/recent-users?limit=5&${query}`),
          request(`/recent-workout-templates?limit=5&${query}`),
        ]);

        if (!mounted) return;

        // A preset can cross midnight while requests run; never mix two periods.
        if ([growthData, activityData, usersData, templatesData].some(
          (payload) => JSON.stringify(payload.period) !== JSON.stringify(summaryData.period),
        )) throw new Error("Khoảng thời gian vừa thay đổi. Vui lòng thử lại.");

        setSummary(summaryData.data || null);
        setUserGrowth(Array.isArray(growthData.data) ? growthData.data : []);
        setWorkoutActivity(Array.isArray(activityData.data) ? activityData.data : []);
        setExerciseStats(Array.isArray(statisticsData.data) ? statisticsData.data : []);
        setRecentUsers(Array.isArray(usersData.data) ? usersData.data : []);
        setRecentTemplates(Array.isArray(templatesData.data) ? templatesData.data : []);
        setDisplayedPeriod(summaryData.period);
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
  }, [filter, retry]);

  const chartMax = useMemo(() => {
    return userGrowth.reduce((max, item) => Math.max(max, Number(item.totalUsers || 0)), 1);
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

  const periodLabel = !displayedPeriod ? "" : displayedPeriod.range === "ALL"
    ? "Toàn bộ thời gian"
    : `${formatDate(displayedPeriod.startDate)} – ${formatDate(displayedPeriod.endDate)}`;

  return (
    <div className="admin-page dashboard-page">
      {pageHeader}
      <AdminDateRangeFilter value={filter} onChange={applyFilter} />
      <div className="dashboard-load-status" aria-live="polite" aria-atomic="true">
        {displayedPeriod && <p className="dashboard-meta">Dữ liệu đang hiển thị: {periodLabel} (UTC+7).</p>}
        {loading && <p role="status" className="dashboard-meta">Đang tải dữ liệu…</p>}
        {error && <div role="alert">
          <p className="admin-form-error">{error}{summary ? " Dữ liệu kỳ trước vẫn được giữ lại." : ""}</p>
          <button type="button" className="admin-button admin-button--secondary" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>
        </div>}
      </div>
      {summary && <>
      <div className="dashboard-kpis">
        {[
          {
            label: "Tổng người dùng",
            scope: "Toàn hệ thống",
            value: formatNumber(summary?.totalUsers),
            accent: "var(--green)",
          },
          {
            label: "Tổng bài tập",
            scope: "Toàn hệ thống",
            value: formatNumber(summary?.totalExercises),
            accent: "var(--admin-info)",
          },
          {
            label: "Lịch tập mẫu tạo trong kỳ",
            value: formatNumber(summary?.totalWorkoutTemplates),
            accent: "var(--orange)",
          },
          {
            label: "Người dùng mới",
            value: formatNumber(summary?.newUsersThisMonth),
            accent: "var(--red)",
          },
          {
            label: "Buổi tập trong kỳ",
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
            <small className="dashboard-meta">{item.scope || periodLabel}</small>
          </div>
        ))}
      </div>

      <div className="dashboard-columns">
        <section className="admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon">↗</div>
            <div>
              <h2>Tăng trưởng người dùng</h2>
              <p>Đăng ký theo {displayedPeriod?.groupBy === "DAY" ? "ngày" : "tháng"}</p>
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
                      height: `${(Number(item.totalUsers || 0) / chartMax) * 120}px`,
                    }}
                  />
                  <span>{item.monthLabel}</span>
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
              <p>Theo độ khó · Toàn hệ thống</p>
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
              <p>Thống kê theo ngày · {periodLabel}</p>
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
              <p>Top 5 gần đây · {periodLabel}</p>
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
            <p>Top 5 được tạo mới nhất · {periodLabel}</p>
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
      </>}
    </div>
  );
};

export default DashboardPage;
