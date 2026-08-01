import { useEffect, useMemo, useState } from 'react';
import { fetchLawyerProfile, updateLawyerProfile } from '../../services/lawyerPortalService';
import './LawyerProfilePage.css';

const AVAILABILITY = {
  AVAILABLE: { label: 'Sẵn sàng tư vấn', className: 'is-available' },
  BUSY: { label: 'Đang bận', className: 'is-busy' },
  OFFLINE: { label: 'Ngoại tuyến', className: 'is-offline' },
};

function createForm(lawyer) {
  return {
    full_name: lawyer.full_name || lawyer.user?.full_name || '',
    title: lawyer.title || 'Luật sư',
    phone: lawyer.phone || lawyer.user?.phone || '',
    email: lawyer.email || lawyer.user?.email || '',
    username: lawyer.user?.username || '',
    specialization: lawyer.specialization || '',
    experience_years: lawyer.experience_years ?? 0,
    availability_status: lawyer.availability_status || 'AVAILABLE',
    bio: lawyer.bio || '',
    avatar_url: lawyer.avatar_url || lawyer.user?.avatar_url || '',
  };
}

function getInitials(name) {
  const parts = String(name || 'Luật sư').trim().split(/\s+/);
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase();
}

export default function LawyerProfilePage() {
  const [form, setForm] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    fetchLawyerProfile()
      .then((data) => {
        const normalized = createForm(data.lawyer);
        setForm(normalized);
        setOriginalForm(normalized);
        setStatistics(data.statistics || {});
        setCategories(data.lawyer.categories || []);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || requestError.message || 'Không tải được hồ sơ.'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
    if (field === 'avatar_url') setAvatarError(false);
  };

  const completion = useMemo(() => {
    if (!form) return 0;
    const fields = [form.full_name, form.title, form.phone, form.specialization, form.bio, form.avatar_url];
    const completed = fields.filter((value) => String(value || '').trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [form]);

  const changed = useMemo(
    () => Boolean(form && originalForm && JSON.stringify(form) !== JSON.stringify(originalForm)),
    [form, originalForm],
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        full_name: form.full_name.trim(),
        title: form.title.trim(),
        phone: form.phone.trim(),
        specialization: form.specialization.trim(),
        experience_years: Number(form.experience_years),
        availability_status: form.availability_status,
        bio: form.bio.trim(),
        avatar_url: form.avatar_url.trim() || null,
      };
      const data = await updateLawyerProfile(payload);
      const normalized = createForm(data.lawyer);
      setForm(normalized);
      setOriginalForm(normalized);
      setStatistics(data.statistics || statistics);
      setCategories(data.lawyer.categories || categories);
      setMessage('Hồ sơ đã được cập nhật thành công.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không cập nhật được hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(originalForm);
    setAvatarError(false);
    setError('');
    setMessage('');
  };

  const availability = AVAILABILITY[form?.availability_status] || AVAILABILITY.OFFLINE;

  return (
    <div className='lawyer-profile-page'>
      <header className='lawyer-profile-heading'>
        <div>
          <p className='lawyer-profile-eyebrow'>Quản lý tài khoản</p>
          <h1>Hồ sơ luật sư</h1>
          <p>Thông tin này được hiển thị cho khách hàng khi xem và lựa chọn luật sư.</p>
        </div>
        {!loading && (
          <div className='profile-completion-card'>
            <div>
              <strong>{completion}%</strong>
              <span>Hoàn thiện hồ sơ</span>
            </div>
            <div className='profile-completion-track' aria-label={`Hồ sơ hoàn thiện ${completion}%`}>
              <span style={{ width: `${completion}%` }} />
            </div>
          </div>
        )}
      </header>

      {error && <div className='profile-alert is-error' role='alert'><strong>Có lỗi xảy ra.</strong> {error}</div>}
      {message && <div className='profile-alert is-success' role='status'><strong>Đã lưu.</strong> {message}</div>}

      {loading ? (
        <div className='profile-loading' aria-live='polite'>
          <span />
          <p>Đang tải thông tin hồ sơ...</p>
        </div>
      ) : form && (
        <div className='lawyer-profile-layout'>
          <aside className='profile-preview-column'>
            <section className='profile-preview-card'>
              <p className='profile-preview-label'>Xem trước hồ sơ công khai</p>
              <div className='profile-avatar'>
                {form.avatar_url && !avatarError ? (
                  <img src={form.avatar_url} alt={`Ảnh đại diện của ${form.full_name}`} onError={() => setAvatarError(true)} />
                ) : (
                  <span>{getInitials(form.full_name)}</span>
                )}
              </div>
              <h2>{form.full_name || 'Tên luật sư'}</h2>
              <p className='profile-preview-title'>{form.title || 'Luật sư'}</p>
              <span className={`profile-availability ${availability.className}`}>
                <i aria-hidden='true' /> {availability.label}
              </span>

              <dl className='profile-preview-details'>
                <div>
                  <dt>Chuyên môn</dt>
                  <dd>{form.specialization || 'Chưa cập nhật'}</dd>
                </div>
                <div>
                  <dt>Kinh nghiệm</dt>
                  <dd>{Number(form.experience_years) || 0} năm</dd>
                </div>
              </dl>

              {categories.length > 0 && (
                <div className='profile-category-list'>
                  {categories.map((category) => <span key={category.id}>{category.name}</span>)}
                </div>
              )}

              <p className='profile-preview-bio'>
                {form.bio || 'Bổ sung phần giới thiệu để khách hàng hiểu rõ hơn về kinh nghiệm và định hướng tư vấn của bạn.'}
              </p>
            </section>

            <section className='profile-statistics-card'>
              <h3>Hoạt động tư vấn</h3>
              <div>
                <article><strong>{statistics.total || 0}</strong><span>Tổng lịch hẹn</span></article>
                <article><strong>{statistics.completed || 0}</strong><span>Đã hoàn thành</span></article>
                <article><strong>{statistics.confirmed || 0}</strong><span>Sắp tư vấn</span></article>
              </div>
            </section>
          </aside>

          <form onSubmit={submit} className='profile-edit-card'>
            <section className='profile-form-section'>
              <div className='profile-section-heading'>
                <span aria-hidden='true'>01</span>
                <div><h2>Thông tin cá nhân</h2><p>Thông tin liên hệ và nhận diện tài khoản.</p></div>
              </div>
              <div className='profile-form-grid'>
                <label className='profile-field'>
                  <span>Họ và tên <b>*</b></span>
                  <input required value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder='Nhập họ và tên' />
                </label>
                <label className='profile-field'>
                  <span>Số điện thoại</span>
                  <input type='tel' value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder='Ví dụ: 0901 234 567' />
                </label>
                <label className='profile-field'>
                  <span>Email</span>
                  <input type='email' value={form.email} disabled />
                  <small>Email gắn với tài khoản không thể thay đổi tại đây.</small>
                </label>
                <label className='profile-field'>
                  <span>Tên đăng nhập</span>
                  <input value={form.username} disabled />
                </label>
              </div>
            </section>

            <section className='profile-form-section'>
              <div className='profile-section-heading'>
                <span aria-hidden='true'>02</span>
                <div><h2>Thông tin chuyên môn</h2><p>Nội dung giúp khách hàng lựa chọn luật sư phù hợp.</p></div>
              </div>
              <div className='profile-form-grid'>
                <label className='profile-field'>
                  <span>Chức danh <b>*</b></span>
                  <input required value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder='Ví dụ: Luật sư cao cấp' />
                </label>
                <label className='profile-field'>
                  <span>Số năm kinh nghiệm</span>
                  <input type='number' min='0' max='80' value={form.experience_years} onChange={(event) => updateField('experience_years', event.target.value)} />
                </label>
                <label className='profile-field profile-field-wide'>
                  <span>Chuyên môn chính <b>*</b></span>
                  <input required value={form.specialization} onChange={(event) => updateField('specialization', event.target.value)} placeholder='Ví dụ: Hôn nhân và gia đình' />
                </label>
                <label className='profile-field profile-field-wide'>
                  <span>Trạng thái nhận tư vấn</span>
                  <select value={form.availability_status} onChange={(event) => updateField('availability_status', event.target.value)}>
                    <option value='AVAILABLE'>Sẵn sàng tư vấn</option>
                    <option value='BUSY'>Đang bận</option>
                    <option value='OFFLINE'>Ngoại tuyến</option>
                  </select>
                </label>
              </div>
            </section>

            <section className='profile-form-section'>
              <div className='profile-section-heading'>
                <span aria-hidden='true'>03</span>
                <div><h2>Hình ảnh và giới thiệu</h2><p>Hoàn thiện phần hiển thị công khai của hồ sơ.</p></div>
              </div>
              <div className='profile-form-grid'>
                <label className='profile-field profile-field-wide'>
                  <span>Đường dẫn ảnh đại diện</span>
                  <input value={form.avatar_url} onChange={(event) => updateField('avatar_url', event.target.value)} placeholder='https://example.com/avatar.jpg' />
                  <small>Dùng liên kết ảnh HTTPS để ảnh hiển thị ổn định với khách hàng.</small>
                </label>
                <label className='profile-field profile-field-wide'>
                  <span>Giới thiệu bản thân</span>
                  <textarea rows={7} maxLength={3000} value={form.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder='Giới thiệu kinh nghiệm, thế mạnh chuyên môn và cách bạn hỗ trợ khách hàng...' />
                  <small className='profile-character-count'>{form.bio.length}/3.000 ký tự</small>
                </label>
              </div>
            </section>

            <footer className='profile-form-actions'>
              <p>{changed ? 'Bạn có thay đổi chưa được lưu.' : 'Mọi thay đổi đã được lưu.'}</p>
              <div>
                <button type='button' className='profile-reset-button' onClick={resetForm} disabled={!changed || saving}>Hoàn tác</button>
                <button type='submit' className='profile-save-button' disabled={!changed || saving}>
                  {saving && <span className='profile-button-spinner' aria-hidden='true' />}
                  {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
