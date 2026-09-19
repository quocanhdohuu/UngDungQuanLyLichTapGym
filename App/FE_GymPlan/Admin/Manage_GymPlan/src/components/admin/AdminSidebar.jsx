import { NavLink } from "react-router-dom";
import logo from "../../image/logo.png";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/users", label: "Người dùng", icon: "users" },
  { to: "/admin/exercises", label: "Bài tập", icon: "exercise" },
  { to: "/admin/workout-templates", label: "Lịch tập", icon: "calendar" },
  { to: "/admin/settings", label: "Cấu hình hệ thống", icon: "settings" },
];

function Icon({ name, className = "" }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": "true",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <path d="M4 13.5h7V20H4zm9-9h7v7h-7zm0 11h7V20h-7zm-9-7h7v4H4z" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <path d="M16.5 18.5a4.5 4.5 0 0 0-9 0" />
          <circle cx="12" cy="8" r="3" />
          <path d="M18.5 18.5a4 4 0 0 0-2.5-3.7" />
          <path d="M5.5 18.5a4 4 0 0 1 2.5-3.7" />
        </svg>
      );
    case "exercise":
      return (
        <svg {...commonProps}>
          <path d="M5 9.5h14" />
          <path d="M7 6.5v6M17 6.5v6M8 12.5v6m8-6v6M8 17h8" />
          <path d="M10 4.5h4v3h-4z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15.7 20a1.7 1.7 0 0 0-1.02 1.52V22a2 2 0 0 1-4 0v-.08A1.7 1.7 0 0 0 9.66 20a1.7 1.7 0 0 0-1.86.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4 15.73 1.7 1.7 0 0 0 2.48 14.7H2.4a2 2 0 1 1 0-4h.08A1.7 1.7 0 0 0 4 9.67 1.7 1.7 0 0 0 3.66 7.8l-.06-.06A2 2 0 1 1 6.42 4.9l.06.06A1.7 1.7 0 0 0 8.29 4.6 1.7 1.7 0 0 0 9.32 3.08V3a2 2 0 0 1 4 0v.08A1.7 1.7 0 0 0 14.34 4.6a1.7 1.7 0 0 0 1.86-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20 8.29 1.7 1.7 0 0 0 21.52 9.32V9.4a2 2 0 0 1 0 4h-.08A1.7 1.7 0 0 0 20 14.34z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case "help":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.1 9a3 3 0 1 1 5.8 1c-.8 1.5-2.2 1.8-2.9 3.1" />
          <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <img src={logo} alt="GYMFORLIFE" />
        </div>
        <div className="brand-copy">
          <span className="brand-name">GYMF0RLIFE</span>
        </div>
      </div>

      <div className="nav-section-title">QUẢN TRỊ HỆ THỐNG</div>
      <nav className="sidebar-nav" aria-label="Admin navigation">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              ["sidebar-nav-item", isActive ? "active" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="nav-icon">
              <Icon name={icon} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-row " style={{ marginTop: "auto" }}>
          <span>Phiên bản</span>
          <span className="version-tag">v1.0.0</span>
        </div>

        <button type="button" className="sidebar-link-button">
          <Icon name="help" className="link-icon" />
          <span>Trợ giúp &amp; Tài liệu</span>
        </button>

        <button type="button" className="sidebar-link-button danger">
          <Icon name="logout" className="link-icon" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
