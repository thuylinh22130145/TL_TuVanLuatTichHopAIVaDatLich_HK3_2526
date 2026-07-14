import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      await authService.register({
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      alert("Đăng ký thành công!");

      setFormData({
        username: "",
        full_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      navigate("/login");
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Đăng ký thất bại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-shell">
        <div className="register-hero">
          <div>
            <div className="register-badge">
              Hệ thống tư vấn pháp lý AI
            </div>
            <h1 className="register-hero-title">
              Tạo tài khoản để bắt đầu trải nghiệm dịch vụ tư vấn pháp lý thông minh.
            </h1>
            <p className="register-hero-text">
              Đăng ký nhanh chóng để truy cập hỗ trợ pháp lý, đặt lịch với luật sư và theo dõi tiến trình tư vấn một cách thuận tiện và bảo mật.
            </p>
          </div>

          <div className="register-highlight">
            <p className="register-highlight-title">Điểm nổi bật</p>
            <ul className="register-highlight-list">
              <li>• Tư vấn ban đầu bằng trí tuệ nhân tạo</li>
              <li>• Kết nối với luật sư chuyên môn</li>
              <li>• Bảo mật thông tin cá nhân</li>
            </ul>
          </div>
        </div>

        <div className="register-card">
          <div className="register-header">
            <p className="register-subtitle">
              Đăng ký tài khoản
            </p>
            <h2 className="register-title">
              Chào mừng bạn đến với hệ thống của chúng tôi
            </h2>
            <p className="register-description">
              Vui lòng điền đầy đủ thông tin để hoàn tất việc tạo tài khoản.
            </p>
          </div>

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-grid">
              <div>
                <label className="register-label">Tên đăng nhập</label>
                <input
                  className="register-input"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="register-label">Họ và tên đầy đủ</label>
                <input
                  className="register-input"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="register-grid">
              <div>
                <label className="register-label">Địa chỉ email</label>
                <input
                  type="email"
                  className="register-input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="register-label">Số điện thoại</label>
                <input
                  className="register-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="register-note">
              <p>
                Đăng ký công khai này chỉ dành cho khách hàng. Nếu bạn là luật sư,
                vui lòng liên hệ quản trị viên để được kích hoạt tài khoản chuyên viên.
              </p>
            </div>

            <div className="register-grid">
              <div>
                <label className="register-label">Mật khẩu</label>
                <input
                  type="password"
                  className="register-input"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="register-label">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  className="register-input"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="register-submit"
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <p className="register-login-link">
            Bạn đã có tài khoản?
            <Link to="/login" className="register-login-anchor">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}