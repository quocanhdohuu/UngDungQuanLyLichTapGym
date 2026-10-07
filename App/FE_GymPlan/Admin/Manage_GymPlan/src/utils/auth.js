const ADMIN_AUTH_KEY = "admin_auth";

export const getAdminAuth = () => {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.role === "ADMIN" && data.status === "ACTIVE") {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

export const setAdminAuth = (authData) => {
  try {
    if (!authData) return;
    const safeData = {
      accountId: authData.accountId,
      username: authData.username,
      email: authData.email,
      role: authData.role,
      status: authData.status,
      loginSessionId: authData.loginSessionId,
      loginTime: authData.loginTime,
      expiration: authData.expiration,
    };
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(safeData));
  } catch (error) {
    console.error("Lỗi khi lưu thông tin admin vào localStorage:", error);
  }
};

export const clearAdminAuth = () => {
  try {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  } catch (error) {
    console.error("Lỗi khi xóa thông tin admin khỏi localStorage:", error);
  }
};

export const isAuthenticatedAdmin = () => {
  return Boolean(getAdminAuth());
};
