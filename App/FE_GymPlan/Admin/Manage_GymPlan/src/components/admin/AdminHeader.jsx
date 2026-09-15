const AdminHeader = () => {
  return (
    <header className="admin-header">
      <div className="header-title-wrap">
        <span className="header-workspace">WORKSPACE</span>
        <div className="header-crumbs">
          <span>Quản trị viên GYMF0RLIFE</span>
        </div>
      </div>

      <div className="header-actions">
        <label className="header-search" aria-label="Search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            value="Tìm nhanh Ctrl + K..."
            readOnly
            aria-label="Search input"
          />
        </label>

        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          <span>🔔</span>
        </button>

        <div className="header-user-block">
          <div className="user-avatar-small">QA</div>
          <div className="user-meta">
            <span className="user-name">Admin Quoc Anh</span>
            <span className="user-role">Super Admin</span>
          </div>
          <span className="dropdown-caret">▾</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
