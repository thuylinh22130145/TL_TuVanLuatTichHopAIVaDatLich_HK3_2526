import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) {
      setError('Vui l�ng nh?p t�n dang nh?p v� m?t kh?u.');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(normalizedUsername, password);

      switch (result.user.role) {
        case "ADMIN":
          navigate("/admin/dashboard", { replace: true });
          break;

        case "LAWYER":
          navigate("/lawyer/dashboard", { replace: true });
          break;

        case "USER":
          navigate("/user/home", { replace: true });
          break;

        default:
          setError("Invalid account role.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          '�ang nh?p th?t b?i.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-hero">
          <div>
            <span className="login-badge">Hệ thống tư vấn pháp lý AI</span>
            <h1 className="login-hero-title">Đăng nhập vào hệ thống</h1>
            <p className="login-hero-text">
              Đăng nhập để tiếp cận dịch vụ tư vấn, quản lý lịch hẹn và kết nối với luật sư chuyên môn.
            </p>
          </div>
        </div>

        <div className="login-form-shell">
          <h2 className="login-title">Chào mừng trở lại</h2>
          <p className="login-subtitle">Nhập tài khoản để tiếp tục sử dụng dịch vụ.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">Tên đăng nhập</label>
              <input
                className="login-input"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            <div className="login-field">
              <label className="login-label">Mật khẩu</label>
              <input
                type="password"
                className="login-input"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button className="login-button" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="login-footer">
            Chưa có tài khoản?
            <Link className="login-link" to="/register">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
