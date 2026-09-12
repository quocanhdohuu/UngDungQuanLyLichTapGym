const Auth = require("../models/auth.model");

const AuthController = {
  register: (req, res) => {
    const { fullName, email, password, confirmPassword, agreeTerms } = req.body;

    Auth.register(
      fullName,
      email,
      password,
      confirmPassword,
      agreeTerms,
      (error, result) => {
        if (error) {
          return res.status(error.statusCode || 500).json({
            message: error.message || "Đăng ký thất bại",
          });
        }

        res.status(201).json({
          message: "Đăng ký tài khoản thành công",
          data: result,
        });
      },
    );
  },

  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    Auth.login(email, password, (error, result) => {
      if (error) {
        return res.status(error.statusCode || 500).json({
          message: error.message || "Đăng nhập thất bại",
        });
      }

      res.status(200).json({
        message: "Đăng nhập thành công",
        data: result,
      });
    });
  },

  logout: (req, res) => {
    const { accountId, loginSessionId } = req.body;

    if (!accountId || !loginSessionId) {
      return res.status(400).json({
        message: "Vui lòng nhập accountId và loginSessionId",
      });
    }

    Auth.logout(accountId, loginSessionId, (error, result) => {
      if (error) {
        return res.status(error.statusCode || 500).json({
          message: error.message || "Đăng xuất thất bại",
        });
      }

      res.status(200).json({
        message: "Đăng xuất thành công",
        data: result,
      });
    });
  },
};

module.exports = AuthController;
