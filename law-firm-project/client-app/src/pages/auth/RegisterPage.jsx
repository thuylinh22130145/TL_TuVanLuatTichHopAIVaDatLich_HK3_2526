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
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      if (!challenge) {
        if (formData.password !== formData.confirmPassword) {
          setError("Mật khẩu xác nhận không khớp.");
          return;
        }

        const result = await authService.register({
          username: formData.username.trim(),
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        });
        setChallenge(result);
        return;
      }

      if (!/^\d{6}$/.test(otp)) {
        setError("Vui lòng nhập mã OTP gồm 6 chữ số.");
        return;
      }

      await authService.verifyRegistrationOtp(challenge.challenge_token, otp);
      alert("Xác thực email và đăng ký thành công!");
      navigate("/login", { replace: true });
    } catch (err) {
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
            <div className="register-badge">Hệ thống tư vấn pháp lý AI</div>
            <h1 className="register-hero-title">
              Tạo tài khoản để bắt đầu trải nghiệm dịch vụ tư vấn pháp lý thông minh.
            </h1>
            <p className="register-hero-text">
              Đăng ký nhanh chóng để truy cập hỗ trợ pháp lý, đặt lịch với luật sư và theo dõi tiến trình tư vấn.
            </p>
          </div>
          <div className="register-highlight">
            <p className="register-highlight-title">Điểm nổi bật</p>
            <ul className="register-highlight-list">
              <li>• Tư vấn ban đầu bằng trí tuệ nhân tạo</li>
              <li>• Kết nối với luật sư chuyên môn</li>
              <li>• Xác thực email bảo vệ tài khoản</li>
            </ul>
          </div>
        </div>

        <div className="register-card">
          <div className="register-header">
            <p className="register-subtitle">
              {challenge ? "Xác thực email" : "Đăng ký tài khoản"}
            </p>
            <h2 className="register-title">
              {challenge ? "Nhập mã OTP" : "Chào mừng bạn đến với hệ thống"}
            </h2>
            <p className="register-description">
              {challenge
                ? "Mã OTP đã được gửi đến " + challenge.email + " và có hiệu lực trong 5 phút."
                : "Vui lòng điền đầy đủ thông tin để tạo tài khoản."}
            </p>
          </div>

          {error && <div className="register-error">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            {!challenge ? (
              <>
                <div className="register-grid">
                  <div>
                    <label className="register-label">Tên đăng nhập</label>
                    <input className="register-input" name="username" value={formData.username} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="register-label">Họ và tên đầy đủ</label>
                    <input className="register-input" name="full_name" value={formData.full_name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="register-grid">
                  <div>
                    <label className="register-label">Địa chỉ email</label>
                    <input type="email" className="register-input" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="register-label">Số điện thoại</label>
                    <input className="register-input" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="register-grid">
                  <div>
                    <label className="register-label">Mật khẩu</label>
                    <input type="password" className="register-input" name="password" value={formData.password} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="register-label">Xác nhận mật khẩu</label>
                    <input type="password" className="register-input" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                  </div>
                </div>
              </>
            ) : (
              <div className="register-otp-field">
                <label className="register-label">Mã OTP gồm 6 chữ số</label>
                <input
                  className="register-input register-otp-input"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="register-submit">
              {loading
                ? "Đang xử lý..."
                : challenge
                  ? "Xác thực và hoàn tất"
                  : "Gửi mã OTP"}
            </button>
          </form>

          <p className="register-login-link">
            Bạn đã có tài khoản?
            <Link to="/login" className="register-login-anchor">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
