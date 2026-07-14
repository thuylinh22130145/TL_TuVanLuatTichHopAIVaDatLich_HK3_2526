import bcrypt from 'bcryptjs';
import { connectDatabase, sequelize } from '../config/database.js';
import { User, Lawyer, Booking, LegalCategory } from '../models/index.js';

const CATEGORIES = [
  ['Hình sự', 'hinh-su'], ['Dân sự', 'dan-su'], ['Đất đai', 'dat-dai'],
  ['Hôn nhân và Gia đình', 'hon-nhan-gia-dinh'], ['Doanh nghiệp', 'doanh-nghiep'],
  ['Lao động', 'lao-dong'], ['Hành chính', 'hanh-chinh'], ['Thuế', 'thue'],
];

const LAWYERS = [
  { username: 'lawyer.an', full_name: 'Nguyễn Văn An', email: 'an.nguyen@lawfirm.vn', phone: '0901234567', title: 'Luật sư trưởng', specialization: 'Hôn nhân và Gia đình', experience_years: 15 },
  { username: 'lawyer.bich', full_name: 'Trần Thị Bích', email: 'bich.tran@lawfirm.vn', phone: '0902345678', title: 'Luật sư cao cấp', specialization: 'Doanh nghiệp', experience_years: 12 },
  { username: 'lawyer.cuong', full_name: 'Lê Hoàng Cường', email: 'cuong.le@lawfirm.vn', phone: '0903456789', title: 'Luật sư', specialization: 'Hình sự', experience_years: 8 },
];

async function run() {
  await connectDatabase();
  await sequelize.sync({ alter: true });
  const password_hash = await bcrypt.hash('admin123', 10);

  await User.findOrCreate({
    where: { username: 'admin' },
    defaults: { email: 'admin@lawfirm.vn', password_hash, full_name: 'Quản trị viên', role: 'ADMIN', status: 'ACTIVE' },
  });

  for (const [name, slug] of CATEGORIES) {
    await LegalCategory.findOrCreate({ where: { slug }, defaults: { name, status: 'ACTIVE' } });
  }

  for (const data of LAWYERS) {
    const [user] = await User.findOrCreate({
      where: { username: data.username },
      defaults: { email: data.email, password_hash, full_name: data.full_name, phone: data.phone, role: 'LAWYER', status: 'ACTIVE' },
    });
    await Lawyer.findOrCreate({
      where: { user_id: user.id },
      defaults: { ...data, user_id: user.id, status: 'active', availability_status: 'AVAILABLE' },
    });
  }

  const firstLawyer = await Lawyer.findOne();
  if (firstLawyer && await Booking.count() === 0) {
    await Booking.create({
      booking_code: 'LAW-DEMO', lawyer_id: firstLawyer.id,
      customer_name: 'Khách hàng mẫu', customer_phone: '0912111222',
      customer_email: 'customer@example.com',
      appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      duration_minutes: 60, summary_issue: 'Tư vấn pháp lý mẫu', status: 'PENDING',
    });
  }

  console.log('[Seed] Admin: admin / admin123; lawyer password: admin123');
  await sequelize.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
