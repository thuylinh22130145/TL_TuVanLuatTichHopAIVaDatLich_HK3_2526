import { useState } from 'react';
import { useAppData } from '../../../context/AppDataContext';
import { APPOINTMENT_STATUSES } from '../../../utils/constants';

const emptyApt = {
  customerName: '',
  phone: '',
  email: '',
  lawyerId: '',
  scheduledAt: '',
  content: '',
  status: 'PENDING',
};

export default function AppointmentsTab() {
  const {
    appointments,
    lawyers,
    appointmentService,
    refreshAppointments,
  } = useAppData();
  const [form, setForm] = useState(emptyApt);
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm(emptyApt);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lawyer = lawyers.find((l) => l.id === form.lawyerId);
    const payload = {
      ...form,
      lawyerName: lawyer?.name || '—',
    };
    if (editingId) {
      await appointmentService.updateAppointment(editingId, payload);
    } else {
      await appointmentService.createAppointment(payload);
    }
    await refreshAppointments();
    resetForm();
  };

  const startEdit = (apt) => {
    setEditingId(apt.id);
    setForm({
      customerName: apt.customerName,
      phone: apt.phone,
      email: apt.email,
      lawyerId: apt.lawyerId,
      scheduledAt: apt.scheduledAt?.slice(0, 16) || '',
      content: apt.content,
      status: apt.status,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch hẹn này?')) return;
    await appointmentService.deleteAppointment(id);
    await refreshAppointments();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card grid gap-4 sm:grid-cols-2">
        <h3 className="font-serif text-lg font-semibold sm:col-span-2">
          {editingId ? 'Sửa đặt lịch' : 'Thêm đặt lịch mới'}
        </h3>
        <input
          className="input-field"
          placeholder="Họ tên khách"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          required
        />
        <input
          className="input-field"
          placeholder="SĐT"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="input-field sm:col-span-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <select
          className="input-field"
          value={form.lawyerId}
          onChange={(e) => setForm({ ...form, lawyerId: e.target.value })}
          required
        >
          <option value="">Chọn luật sư</option>
          {lawyers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="input-field sm:col-span-2"
          value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          required
        />
        <textarea
          className="input-field sm:col-span-2"
          placeholder="Nội dung"
          rows={2}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary">
            {editingId ? 'Cập nhật' : 'Thêm mới'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary">
              Hủy
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-law-slate">
              <th className="py-2 pr-4">Mã</th>
              <th className="py-2 pr-4">Khách hàng</th>
              <th className="py-2 pr-4">Luật sư</th>
              <th className="py-2 pr-4">Thời gian</th>
              <th className="py-2 pr-4">Trạng thái</th>
              <th className="py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt.id} className="border-b border-law-navy/5">
                <td className="py-3 pr-4 font-mono text-xs">{apt.code}</td>
                <td className="py-3 pr-4">
                  <div className="font-medium">{apt.customerName}</div>
                  <div className="text-xs text-law-slate">
                    {apt.phone} · {apt.email}
                  </div>
                </td>
                <td className="py-3 pr-4">{apt.lawyerName}</td>
                <td className="py-3 pr-4 text-xs">
                  {new Date(apt.scheduledAt).toLocaleString('vi-VN')}
                </td>
                <td className="py-3 pr-4">
                  {APPOINTMENT_STATUSES.find((s) => s.value === apt.status)?.label || apt.status}
                </td>
                <td className="py-3 space-x-2">
                  <button type="button" onClick={() => startEdit(apt)} className="text-law-gold hover:underline">
                    Sửa
                  </button>
                  <button type="button" onClick={() => handleDelete(apt.id)} className="text-red-600 hover:underline">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && (
          <p className="py-6 text-center text-law-slate">Chưa có lịch hẹn.</p>
        )}
      </div>
    </div>
  );
}
