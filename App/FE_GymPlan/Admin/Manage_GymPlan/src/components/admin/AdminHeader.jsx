import { AdminIcon } from "./AdminControls";
import { getAdminAuth } from "../../utils/auth";

const AdminHeader = () => {
  const admin = getAdminAuth();
  const displayName = admin?.username
    ? `Admin ${admin.username}`
    : "Admin Quoc Anh";
  const initials = admin?.username
    ? admin.username.slice(0, 2).toUpperCase()
    : "QA";

  return (
    <header className="admin-header">
      <div className="header-title-wrap">
        <span className="header-workspace">WORKSPACE</span>
        <div className="header-crumbs">
          <span>Quản trị viên GYMF0RLIFE</span>
        </div>
      </div>

      <div className="header-actions">
        <label className="admin-search header-search" aria-label="Search">
          <AdminIcon name="search" />
          <input
            type="text"
            value="Tìm nhanh Ctrl + K..."
            readOnly
            aria-label="Search input"
          />
        </label>

        <button
          type="button"
          className="admin-button admin-button--icon"
          aria-label="Notifications"
        >
          <span>🔔</span>
        </button>

        <div className="header-user-block">
          <div className="user-avatar-small">{initials}</div>
          <div className="user-meta">
            <span className="user-name">{displayName}</span>
          </div>
          <span className="dropdown-caret">▾</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
