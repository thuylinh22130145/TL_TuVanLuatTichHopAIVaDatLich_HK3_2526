import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import LawyerCard from '../../components/LawyerCard';
import BookingForm from '../../components/BookingForm';
import Modal from '../../components/Modal';
import LawyerAvatar from '../../components/LawyerAvatar';
import * as lawyerService from '../../services/lawyerService';
import * as appointmentService from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

export default function LawyerInfoPage() {
  const { authenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const specializationFilter = searchParams.get('specialization')?.trim() || '';
  const preferredLawyerId = Number(searchParams.get('lawyer')) || null;

  const filteredLawyers = useMemo(() => {
    if (!specializationFilter) return lawyers;
    const matches = lawyers.filter((lawyer) =>
      lawyer.specialty?.toLowerCase().includes(specializationFilter.toLowerCase())
    );
    return matches.length > 0 ? matches : lawyers;
  }, [lawyers, specializationFilter]);

  const noSpecialtyMatch =
    specializationFilter &&
    lawyers.length > 0 &&
    !lawyers.some((lawyer) =>
      lawyer.specialty?.toLowerCase().includes(specializationFilter.toLowerCase())
    );

  useEffect(() => {
    lawyerService
      .fetchPublicLawyers()
      .then((data) => {
        setLawyers(data);
        if (data.length > 0) {
          setSelected(data.find((lawyer) => lawyer.id === preferredLawyerId) || data[0]);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected || !lawyers.some((lawyer) => lawyer.id === selected.id)) {
      setSelected(filteredLawyers[0] ?? null);
    }
  }, [filteredLawyers, lawyers, selected]);

  const handleBooking = async (payload) => {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const createBooking = authenticated && user?.role === 'USER'
        ? appointmentService.createCustomerAppointment
        : appointmentService.createPublicAppointment;
      const result = await createBooking({
        ...payload,
        lawyerId: selected.id,
        lawyerName: selected.name,
      });
      if (authenticated && user?.role === 'USER') {
        navigate('/user/home', {
          replace: true,
          state: {
            bookingSuccess: {
              code: result.code,
              lawyerName: selected.name,
            },
          },
        });
        return;
      }
      setBookingCode(result.code);
      setModalOpen(true);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Đặt lịch thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center text-law-slate">Đang tải danh sách luật sư...</p>;
  }

  return (
    <div>
      <div className="lawyer-info-header">
        <h1 className="font-serif text-3xl font-semibold text-law-navy">Đội ngũ Luật sư</h1>
        <p className="mt-2 text-sm text-law-slate">
          Chọn luật sư phù hợp và điền form đặt lịch tư vấn.
        </p>
      </div>

      {specializationFilter && (
        <div className="mb-4 rounded-xl border border-law-gold/20 bg-law-gold/10 p-4 text-sm text-law-navy">
          <p>
            Hiển thị luật sư phù hợp với chuyên môn&nbsp;
            <strong>{specializationFilter}</strong>.
          </p>
          {noSpecialtyMatch && (
            <p className="mt-2 text-law-red">
              Không tìm thấy luật sư chính xác cho chuyên môn này. Hiển thị toàn bộ danh sách luật sư hiện có.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside className="lawyer-sidebar lg:sticky lg:top-24">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-law-navy">Danh sách luật sư</h2>
            <span className="rounded-full bg-law-gold/10 px-3 py-1 text-xs font-medium text-law-gold">
              {lawyers.length} người
            </span>
          </div>

          <div className="lawyer-sidebar-list">
            {filteredLawyers.map((lawyer) => (
              <LawyerCard
                key={lawyer.id}
                lawyer={lawyer}
                selected={selected?.id === lawyer.id}
                onSelect={setSelected}
              />
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          {selected && (
            <div className="lawyer-detail-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className='flex items-center gap-4'>
                  <LawyerAvatar lawyer={selected} className='h-20 w-20 text-xl ring-2 ring-law-gold/20' />
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-law-navy">{selected.name}</h2>
                    <p className="text-sm text-law-gold">{selected.title}</p>
                  </div>
                </div>
                <span className="rounded-full border border-law-gold/30 bg-law-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-law-gold">
                  Tư vấn chuyên sâu
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm text-law-slate sm:grid-cols-2">
                <div className="rounded-xl bg-law-cream/70 p-3">
                  <dt className="font-medium text-law-navy">Chuyên môn</dt>
                  <dd className="mt-1">{selected.specialty}</dd>
                </div>
                <div className="rounded-xl bg-law-cream/70 p-3">
                  <dt className="font-medium text-law-navy">Kinh nghiệm</dt>
                  <dd className="mt-1">{selected.experience} năm</dd>
                </div>
                {selected.email && (
                  <div className="rounded-xl bg-law-cream/70 p-3">
                    <dt className="font-medium text-law-navy">Email</dt>
                    <dd className="mt-1">{selected.email}</dd>
                  </div>
                )}
                {selected.phone && (
                  <div className="rounded-xl bg-law-cream/70 p-3">
                    <dt className="font-medium text-law-navy">Điện thoại</dt>
                    <dd className="mt-1">{selected.phone}</dd>
                  </div>
                )}
              </dl>
              {selected.bio && (
                <p className="mt-4 rounded-xl border border-law-navy/10 bg-white p-4 text-sm leading-relaxed text-law-slate">
                  {selected.bio}
                </p>
              )}
            </div>
          )}

          <BookingForm
            lawyer={selected}
            onSubmit={handleBooking}
            submitting={submitting}
            customer={authenticated && user?.role === 'USER' ? user : null}
            initialContent={location.state?.consultationSummary || ''}
          />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Đặt lịch thành công">
        <p className="text-sm text-law-slate">
          Yêu cầu của bạn đã được ghi nhận. Vui lòng lưu mã đặt lịch để tra cứu:
        </p>
        <p className="my-4 rounded-lg bg-law-navy/5 py-4 text-center font-mono text-xl font-bold text-law-navy">
          {bookingCode}
        </p>
        <button type="button" onClick={() => setModalOpen(false)} className="btn-primary w-full">
          Đóng
        </button>
      </Modal>
    </div>
  );
}
