import * as lawyerApplicationService from '../../services/lawyerApplicationService.js';
import { ApiError } from '../../utils/ApiError.js';

const REQUIRED_FIELDS = {
  full_name: 'Họ và tên',
  email: 'Email',
  phone: 'Số điện thoại',
  date_of_birth: 'Ngày sinh',
  citizen_id: 'Số CCCD',
  address: 'Địa chỉ liên hệ',
  license_number: 'Số thẻ luật sư',
  license_issued_date: 'Ngày cấp thẻ luật sư',
  bar_association: 'Đoàn luật sư',
  education: 'Trình độ/học vấn',
  specialization: 'Lĩnh vực chuyên môn',
  identity_document_url: 'Tài liệu CCCD',
  lawyer_card_url: 'Tài liệu thẻ luật sư',
  degree_document_url: 'Tài liệu bằng cấp',
};

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function submitApplication(req, res) {
  const input = req.body;
  const missing = Object.entries(REQUIRED_FIELDS)
    .filter(([field]) => !String(input[field] ?? '').trim())
    .map(([, label]) => label);

  if (missing.length) {
    throw new ApiError(400, 'Vui lòng bổ sung: ' + missing.join(', ') + '.');
  }

  if (!req.user && (!input.username?.trim() || !input.password)) {
    throw new ApiError(400, 'Vui lòng tạo tên đăng nhập và mật khẩu.');
  }

  if (!req.user && input.password.length < 8) {
    throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự.');
  }

  if (!/^[0-9]{9,12}$/.test(input.citizen_id.trim())) {
    throw new ApiError(400, 'Số CCCD phải gồm từ 9 đến 12 chữ số.');
  }

  if (!/^[0-9+()\s.-]{9,20}$/.test(input.phone.trim())) {
    throw new ApiError(400, 'Số điện thoại không hợp lệ.');
  }

  const experienceYears = Number(input.experience_years);
  if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 60) {
    throw new ApiError(400, 'Số năm kinh nghiệm phải là số nguyên từ 0 đến 60.');
  }

  for (const field of ['identity_document_url', 'lawyer_card_url', 'degree_document_url']) {
    if (!isHttpUrl(input[field])) {
      throw new ApiError(400, REQUIRED_FIELDS[field] + ' phải là liên kết http/https hợp lệ.');
    }
  }

  if (input.declaration_accepted !== true) {
    throw new ApiError(400, 'Bạn phải xác nhận thông tin hồ sơ là chính xác.');
  }

  const application = await lawyerApplicationService.createLawyerApplication({
    user_id: req.user?.id ?? null,
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    date_of_birth: input.date_of_birth,
    citizen_id: input.citizen_id.trim(),
    address: input.address.trim(),
    license_number: input.license_number.trim(),
    license_issued_date: input.license_issued_date,
    bar_association: input.bar_association.trim(),
    practice_organization: input.practice_organization?.trim() || null,
    education: input.education.trim(),
    specialization: input.specialization.trim(),
    experience_years: experienceYears,
    message: input.message?.trim() || null,
    identity_document_url: input.identity_document_url.trim(),
    lawyer_card_url: input.lawyer_card_url.trim(),
    degree_document_url: input.degree_document_url.trim(),
    declaration_accepted_at: new Date(),
    username: input.username?.trim(),
    password: input.password,
  });

  res.status(201).json({
    success: true,
    message: 'Hồ sơ đăng ký luật sư đã được gửi và đang chờ quản trị viên thẩm định.',
    data: application.toJSON(),
  });
}