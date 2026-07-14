import { useCallback, useEffect, useState } from 'react';
import * as lawyerService from '../../../services/lawyerService';

const STATUS_LABELS = {
  pending: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
};

export default function LawyerApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await lawyerService.fetchLawyerApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được danh sách hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleAction = async (id, action) => {
    const label = action === 'approve' ? 'duyệt' : 'từ chối';
    if (!window.confirm('Bạn chắc chắn muốn ' + label + ' hồ sơ này?')) return;

    setSavingId(id);
    setError('');
    try {
      if (action === 'approve') await lawyerService.approveLawyerApplication(id);
      else await lawyerService.rejectLawyerApplication(id);
      await loadApplications();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Thao tác thất bại.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-law-slate">
        Kiểm tra thông tin nhân thân, thẻ luật sư và tài liệu chứng minh trước khi duyệt hồ sơ.
      </p>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="py-6 text-center text-law-slate">Đang tải...</p>
        ) : applications.length === 0 ? (
          <p className="py-6 text-center text-law-slate">Chưa có hồ sơ đăng ký luật sư.</p>
        ) : (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b text-law-slate">
                <th className="py-2 pr-4">Ứng viên</th>
                <th className="py-2 pr-4">Thông tin hành nghề</th>
                <th className="py-2 pr-4">Tài liệu</th>
                <th className="py-2 pr-4">Trạng thái</th>
                <th className="py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-law-navy/5">
                  <td className="py-3 pr-4">
                    <strong>{app.full_name}</strong>
                    <div className="mt-1 text-xs text-law-slate">{app.email}</div>
                    <div className="text-xs text-law-slate">{app.phone}</div>
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-law-gold">Xem thông tin nhân thân</summary>
                      <div className="mt-2 space-y-1 text-law-slate">
                        <div>Ngày sinh: {app.date_of_birth || 'Chưa có'}</div>
                        <div>CCCD: {app.citizen_id || 'Chưa có'}</div>
                        <div>Địa chỉ: {app.address || 'Chưa có'}</div>
                      </div>
                    </details>
                  </td>
                  <td className="py-3 pr-4">
                    <div>Số thẻ: <strong>{app.license_number}</strong></div>
                    <div className="mt-1 text-xs text-law-slate">Ngày cấp: {app.license_issued_date || 'Chưa có'}</div>
                    <div className="text-xs text-law-slate">{app.bar_association || 'Chưa có đoàn luật sư'}</div>
                    <div className="mt-1">{app.specialization} · {app.experience_years ?? 0} năm</div>
                    <div className="mt-1 text-xs text-law-slate">{app.education || ''}</div>
                  </td>
                  <td className="py-3 pr-4 text-xs">
                    <div><a className="text-law-gold hover:underline" href={app.identity_document_url} target="_blank" rel="noreferrer">CCCD</a></div>
                    <div><a className="text-law-gold hover:underline" href={app.lawyer_card_url} target="_blank" rel="noreferrer">Thẻ luật sư</a></div>
                    <div><a className="text-law-gold hover:underline" href={app.degree_document_url} target="_blank" rel="noreferrer">Bằng cấp</a></div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-law-cream px-2 py-1 text-xs font-medium text-law-navy">
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                    <div className="mt-2 text-xs text-law-slate">
                      {new Date(app.created_at).toLocaleString('vi-VN')}
                    </div>
                  </td>
                  <td className="py-3 space-x-2">
                    <button
                      type="button"
                      disabled={app.status !== 'pending' || savingId === app.id}
                      onClick={() => handleAction(app.id, 'approve')}
                      className="text-law-gold hover:underline disabled:text-law-slate disabled:cursor-not-allowed"
                    >
                      Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={app.status !== 'pending' || savingId === app.id}
                      onClick={() => handleAction(app.id, 'reject')}
                      className="text-red-600 hover:underline disabled:text-law-slate disabled:cursor-not-allowed"
                    >
                      Từ chối
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}