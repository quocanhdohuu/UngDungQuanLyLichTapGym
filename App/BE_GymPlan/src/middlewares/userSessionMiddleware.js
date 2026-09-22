const User = require("../models/user.model");
const { verifyToken } = require("../services/userSessionService");

const requireUserSession = async (req, res, next) => {
  const authorization = req.get("Authorization") || "";
  const session = verifyToken(authorization.startsWith("Bearer ") ? authorization.slice(7) : null);
  if (!session) return res.status(401).json({ message: "Vui lòng đăng nhập lại." });
  try {
    const active = await User.getLoginSession(session.accountId, session.loginSessionId);
    if (!active || Number(active.profileId) !== session.profileId) {
      return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
    }
    req.userSession = session;
    next();
  } catch {
    res.status(500).json({ message: "Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại." });
  }
};

const ownId = (field) => (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }
  if (Number(value) !== req.userSession[field]) {
    return res.status(403).json({ message: "Bạn không có quyền truy cập hồ sơ này." });
  }
  next();
};

module.exports = { requireUserSession, ownId };
