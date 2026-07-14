import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as lawyerService from '../../services/lawyerService';
import { useAuth } from '../../context/AuthContext';
import './RequestLawyerPage.css';

const SPECIALIZATIONS = [
  'Dân sự',
  'Hình sự',
  'Hôn nhân và gia đình',
  'Đất đai và bất động sản',
  'Doanh nghiệp và thương mại',
  'Lao động',
  'Hành chính',
  'Sở hữu trí tuệ',
  'Thuế và tài chính',
  'Lĩnh vực khác',
];

function createInitialForm(user) {
  return {
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    date_of_birth: '',
    citizen_id: '',
    address: '',
    username: '',
    password: '',
    confirm_password: '',
    license_number: '',
    license_issued_date: '',
    bar_association: '',
    practice_organization: '',
    education: '',
    specialization: '',
    experience_years: '',
    identity_document_url: '',
    lawyer_card_url: '',
    degree_document_url: '',
    message: '',
    declaration_accepted: false,
  };
}

export default function LawyerRegisterPage() {
  const { authenticated, user } = useAuth();
  const [formData, setFormData] = useState(() => createInitialForm(user));
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!authenticated && formData.password !== formData.confirm_password) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!formData.declaration_accepted) {
      setError('Bạn cần xác nhận thông tin hồ sơ là chính xác.');
      return;
    }

    setSubmitting(true);
    try {
      const { confirm_password, ...payload } = formData;
      await lawyerService.submitLawyerApplication({
        ...payload,
        experience_years: Number(payload.experience_years),
      });
      setStatus('Hồ sơ đã được gửi thành công và đang chờ quản trị viên thẩm định.');
      setFormData(createInitialForm(user));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Không thể gửi hồ sơ. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputProps = {
    className: 'lawyer-application-input',
    onChange: handleChange,
  };

  return (
    <main className="lawyer-application-page">
      <header className="lawyer-application-hero">
        <p className="lawyer-application-eyebrow">Hồ sơ gia nhập đội ngũ</p>
        <h1>Đăng ký trở thành luật sư</h1>
        <p>
          Cung cấp đầy đủ thông tin nhân thân, nghề nghiệp và tài liệu chứng minh.
          Hồ sơ chỉ được kích hoạt quyền luật sư sau khi quản trị viên thẩm định.
        </p>
      </header>

      <div className="lawyer-application-layout">
        <section className="lawyer-application-card">
          {status && <div className="lawyer-application-alert success">{status}</div>}
          {error && <div className="lawyer-application-alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="lawyer-application-form">
            <fieldset>
              <legend>1. Thông tin cá nhân</legend>
              <p className="lawyer-application-section-note">Các trường có dấu * là bắt buộc.</p>
              <div className="lawyer-application-grid">
                <label>
                  <span>Họ và tên *</span>
                  <input {...inputProps} name="full_name" value={formData.full_name} required />
                </label>
                <label>
                  <span>Ngày sinh *</span>
                  <input {...inputProps} type="date" name="date_of_birth" value={formData.date_of_birth} max={new Date().toISOString().slice(0, 10)} required />
                </label>
                <label>
                  <span>Số CCCD *</span>
                  <input {...inputProps} name="citizen_id" value={formData.citizen_id} inputMode="numeric" pattern="[0-9]{9,12}" maxLength="12" required />
                </label>
                <label>
                  <span>Số điện thoại *</span>
                  <input {...inputProps} type="tel" name="phone" value={formData.phone} minLength="9" maxLength="20" required />
                </label>
                <label>
                  <span>Email *</span>
                  <input {...inputProps} type="email" name="email" value={formData.email} readOnly={authenticated} required />
                </label>
                <label className="full-width">
                  <span>Địa chỉ liên hệ *</span>
                  <input {...inputProps} name="address" value={formData.address} maxLength="500" required />
                </label>
              </div>
            </fieldset>

            {!authenticated && (
              <fieldset>
                <legend>2. Tài khoản đăng nhập</legend>
                <p className="lawyer-application-section-note">
                  Tài khoản được tạo ở vai trò khách hàng và chỉ chuyển thành luật sư sau khi hồ sơ được duyệt.
                </p>
                <div className="lawyer-application-grid">
                  <label>
                    <span>Tên đăng nhập *</span>
                    <input {...inputProps} name="username" value={formData.username} minLength="4" maxLength="50" autoComplete="username" required />
                  </label>
                  <label>
                    <span>Mật khẩu *</span>
                    <input {...inputProps} type="password" name="password" value={formData.password} minLength="8" autoComplete="new-password" required />
                  </label>
                  <label>
                    <span>Xác nhận mật khẩu *</span>
                    <input {...inputProps} type="password" name="confirm_password" value={formData.confirm_password} minLength="8" autoComplete="new-password" required />
                  </label>
                </div>
              </fieldset>
            )}

            <fieldset>
              <legend>{authenticated ? '2' : '3'}. Thông tin hành nghề</legend>
              <div className="lawyer-application-grid">
                <label>
                  <span>Số thẻ luật sư *</span>
                  <input {...inputProps} name="license_number" value={formData.license_number} maxLength="100" required />
                </label>
                <label>
                  <span>Ngày cấp thẻ *</span>
                  <input {...inputProps} type="date" name="license_issued_date" value={formData.license_issued_date} max={new Date().toISOString().slice(0, 10)} required />
                </label>
                <label>
                  <span>Đoàn luật sư *</span>
                  <input {...inputProps} name="bar_association" value={formData.bar_association} placeholder="Ví dụ: Đoàn Luật sư TP. Hồ Chí Minh" maxLength="150" required />
                </label>
                <label>
                  <span>Tổ chức hành nghề hiện tại</span>
                  <input {...inputProps} name="practice_organization" value={formData.practice_organization} placeholder="Văn phòng luật/Công ty luật" maxLength="255" />
                </label>
                <label>
                  <span>Trình độ, học vấn *</span>
                  <input {...inputProps} name="education" value={formData.education} placeholder="Ví dụ: Cử nhân Luật, Học viện Tư pháp" maxLength="255" required />
                </label>
                <label>
                  <span>Lĩnh vực chuyên môn *</span>
                  <select {...inputProps} name="specialization" value={formData.specialization} required>
                    <option value="">Chọn lĩnh vực</option>
                    {SPECIALIZATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span>Số năm kinh nghiệm *</span>
                  <input {...inputProps} type="number" name="experience_years" value={formData.experience_years} min="0" max="60" step="1" required />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>{authenticated ? '3' : '4'}. Tài liệu chứng minh</legend>
              <p className="lawyer-application-section-note">
                Cung cấp liên kết chỉ người có quyền xem được tới bản chụp hoặc PDF rõ nét.
              </p>
              <div className="lawyer-application-grid">
                <label className="full-width">
                  <span>Liên kết bản chụp CCCD *</span>
                  <input {...inputProps} type="url" name="identity_document_url" value={formData.identity_document_url} placeholder="https://..." required />
                </label>
                <label className="full-width">
                  <span>Liên kết thẻ luật sư/chứng chỉ hành nghề *</span>
                  <input {...inputProps} type="url" name="lawyer_card_url" value={formData.lawyer_card_url} placeholder="https://..." required />
                </label>
                <label className="full-width">
                  <span>Liên kết bằng cấp/chứng nhận đào tạo *</span>
                  <input {...inputProps} type="url" name="degree_document_url" value={formData.degree_document_url} placeholder="https://..." required />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>{authenticated ? '4' : '5'}. Giới thiệu và cam kết</legend>
              <label>
                <span>Giới thiệu kinh nghiệm nghề nghiệp</span>
                <textarea
                  className="lawyer-application-input"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  maxLength="3000"
                  placeholder="Mô tả vụ việc tiêu biểu, thế mạnh chuyên môn và kinh nghiệm tư vấn..."
                />
              </label>
              <label className="lawyer-application-consent">
                <input
                  type="checkbox"
                  name="declaration_accepted"
                  checked={formData.declaration_accepted}
                  onChange={handleChange}
                  required
                />
                <span>
                  Tôi cam kết thông tin và tài liệu cung cấp là chính xác; đồng ý để hệ thống
                  sử dụng chúng cho mục đích xác minh hồ sơ hành nghề. *
                </span>
              </label>
            </fieldset>

            <button type="submit" className="lawyer-application-submit" disabled={submitting}>
              {submitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ đăng ký'}
            </button>
          </form>
        </section>

        <aside className="lawyer-application-aside">
          <h2>Hồ sơ cần chuẩn bị</h2>
          <ul>
            <li>CCCD còn hiệu lực và thông tin liên hệ chính xác.</li>
            <li>Thẻ luật sư hoặc chứng chỉ hành nghề hợp lệ.</li>
            <li>Bằng cử nhân luật và chứng nhận đào tạo liên quan.</li>
            <li>Thông tin Đoàn luật sư, tổ chức hành nghề và kinh nghiệm.</li>
          </ul>
          <h3>Quy trình xử lý</h3>
          <ol>
            <li>Gửi hồ sơ đầy đủ.</li>
            <li>Quản trị viên đối chiếu tài liệu.</li>
            <li>Hồ sơ được duyệt hoặc yêu cầu bổ sung.</li>
            <li>Tài khoản được kích hoạt quyền luật sư.</li>
          </ol>
          <p className="lawyer-application-login">
            Đã có tài khoản? <Link to="/login">Đăng nhập trước khi gửi hồ sơ</Link>.
          </p>
        </aside>
      </div>
    </main>
  );
}