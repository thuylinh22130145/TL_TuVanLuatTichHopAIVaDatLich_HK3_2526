export default function BookingForm({ lawyer, onSubmit, submitting, customer }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    onSubmit({
      customerName: data.get('customerName'),
      phone: data.get('phone'),
      email: data.get('email'),
      scheduledAt: data.get('scheduledAt'),
      durationMinutes: Number(data.get('durationMinutes')),
      content: data.get('content'),
      lawyerId: lawyer?.id,
      lawyerName: lawyer?.name,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='card space-y-4'>
      <h3 className='font-serif text-lg font-semibold text-law-navy'>
        Đặt lịch {lawyer ? `— ${lawyer.name}` : ''}
      </h3>
      {!lawyer && <p className='text-sm text-amber-700'>Vui lòng chọn luật sư từ danh sách.</p>}
      <div className='grid gap-4 sm:grid-cols-2'>
        <label className='block sm:col-span-2'>
          <span className='mb-1 block text-xs font-medium text-law-slate'>Họ tên *</span>
          <input name='customerName' required className='input-field' defaultValue={customer?.full_name || ''} placeholder='Nguyễn Văn A' />
        </label>
        <label className='block'>
          <span className='mb-1 block text-xs font-medium text-law-slate'>Số điện thoại *</span>
          <input name='phone' required type='tel' className='input-field' defaultValue={customer?.phone || ''} placeholder='090x xxx xxx' />
        </label>
        <label className='block'>
          <span className='mb-1 block text-xs font-medium text-law-slate'>Email *</span>
          <input name='email' required type='email' className='input-field' defaultValue={customer?.email || ''} placeholder='email@domain.com' />
        </label>
        <label className='block sm:col-span-2'>
          <span className='mb-1 block text-xs font-medium text-law-slate'>Ngày giờ hẹn *</span>
          <input name='scheduledAt' required type='datetime-local' className='input-field' />
        </label>
        <label className='block sm:col-span-2'>
          <span className='mb-1 block text-xs font-medium text-law-slate'>Thời lượng tư vấn *</span>
          <select name='durationMinutes' defaultValue='60' className='input-field'>
            <option value='30'>30 phút</option>
            <option value='60'>60 phút</option>
            <option value='90'>90 phút</option>
            <option value='120'>120 phút</option>
          </select>
        </label>
        <label className='block sm:col-span-2'>
          <span className='mb-1 block text-xs font-medium text-law-slate'>Nội dung tư vấn *</span>
          <textarea name='content' required rows={4} className='input-field resize-y' placeholder='Mô tả ngắn vấn đề cần tư vấn...' />
        </label>
      </div>
      <button type='submit' disabled={!lawyer || submitting} className='btn-primary w-full sm:w-auto'>
        {submitting ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}
      </button>
    </form>
  );
}
