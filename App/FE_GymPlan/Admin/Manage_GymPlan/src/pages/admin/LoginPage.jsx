import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import logo from "../../image/logo.png";
import { isAuthenticatedAdmin, setAdminAuth } from "../../utils/auth";
import "./LoginPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="admin-login-alert-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Nếu đã đăng nhập với vai trò ADMIN, chuyển hướng vào Dashboard
  if (isAuthenticatedAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const validateForm = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email không được để trống.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = "Email không đúng định dạng.";
    }

    if (!password) {
      errors.password = "Mật khẩu không được để trống.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGeneralError(
          result.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
        );
        return;
      }

      const userData = result.data;

      // Kiểm tra quyền: chỉ cho phép tài khoản có role = "ADMIN"
      if (!userData || userData.role !== "ADMIN") {
        setGeneralError("Tài khoản không có quyền truy cập trang quản trị.");

        // Hủy session vừa tạo của tài khoản không phải Admin
        if (userData?.accountId && userData?.loginSessionId) {
          fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountId: userData.accountId,
              loginSessionId: userData.loginSessionId,
            }),
          }).catch(() => {});
        }
        return;
      }

      // Kiểm tra trạng thái tài khoản
      if (userData.status && userData.status !== "ACTIVE") {
        setGeneralError("Tài khoản đang bị khóa hoặc không hoạt động.");
        return;
      }

      // Lưu thông tin đăng nhập admin vào localStorage
      setAdminAuth(userData);

      // Chuyển hướng đến Dashboard (hoặc trang trước đó nếu được điều hướng tới login)
      const redirectPath = location.state?.from?.pathname || "/admin/dashboard";
      navigate(redirectPath, { replace: true });
    } catch {
      setGeneralError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <header className="admin-login-header">
            <div className="admin-login-brand">
              <div className="admin-login-logo">
                <img src={logo} alt="GYMFORLIFE" />
              </div>
              <span className="admin-login-brand-name">GYMF0RLIFE</span>
            </div>

            <span className="admin-login-badge">Hệ thống quản lý lịch tập Gym</span>
            <h1 className="admin-login-title">Đăng nhập quản trị</h1>
            <p className="admin-login-subtitle">
              Nhập tài khoản quản trị viên để truy cập hệ thống
            </p>
          </header>

          {generalError && (
            <div className="admin-login-alert" role="alert">
              <AlertIcon />
              <span>{generalError}</span>
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-login-field">
              <label htmlFor="admin-email-input" className="admin-login-label">
                Email
              </label>
              <div className="admin-login-input-wrap">
                <input
                  id="admin-email-input"
                  type="email"
                  className={`admin-login-input ${
                    fieldErrors.email ? "has-error" : ""
                  }`}
                  placeholder="admin@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="email"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {fieldErrors.email && (
                <p className="admin-login-field-error">{fieldErrors.email}</p>
              )}
            </div>

            <div className="admin-login-field">
              <label htmlFor="admin-password-input" className="admin-login-label">
                Mật khẩu
              </label>
              <div className="admin-login-input-wrap has-toggle">
                <input
                  id="admin-password-input"
                  type={showPassword ? "text" : "password"}
                  className={`admin-login-input ${
                    fieldErrors.password ? "has-error" : ""
                  }`}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              {fieldErrors.password && (
                <p className="admin-login-field-error">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="admin-login-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="admin-login-spinner" aria-hidden="true" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
