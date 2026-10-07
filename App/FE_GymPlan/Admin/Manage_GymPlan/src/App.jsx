import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./admin-ui.css";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import DashboardPage from "./pages/admin/DashboardPage";
import UsersPage from "./pages/admin/UsersPage";
import ExercisesPage from "./pages/admin/ExercisesPage";
import WorkoutTemplatesPage from "./pages/admin/WorkoutTemplatesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import LoginPage from "./pages/admin/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/exercises" element={<ExercisesPage />} />
            <Route
              path="/admin/workout-templates"
              element={<WorkoutTemplatesPage />}
            />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
