import { Outlet, useLocation } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const adminPathLabelMap = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Người dùng",
  "/admin/exercises": "Bài tập",
  "/admin/workout-templates": "Lịch tập mẫu",
  "/admin/settings": "Cấu hình hệ thống",
};

function AdminLayout() {
  const location = useLocation();

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main-panel">
        <AdminHeader
          pageLabel={adminPathLabelMap[location.pathname] || "Quản trị"}
        />
        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
