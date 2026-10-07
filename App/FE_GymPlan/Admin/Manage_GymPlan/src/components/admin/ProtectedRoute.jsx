import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticatedAdmin } from "../../utils/auth";

function ProtectedRoute() {
  const location = useLocation();
  const isAuth = isAuthenticatedAdmin();

  if (!isAuth) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
