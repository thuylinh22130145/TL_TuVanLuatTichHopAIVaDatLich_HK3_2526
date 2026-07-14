import * as lawyerService from '../../services/lawyerService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function list(req, res) {
  const lawyers = await lawyerService.listAllLawyers();
  res.json({ success: true, data: lawyers.map((lawyer) => lawyer.toJSON()) });
}

export async function getOne(req, res) {
  const lawyer = await lawyerService.getLawyerById(req.params.id);
  res.json({ success: true, data: lawyer.toJSON() });
}

export async function create(req, res) {
  const { user_id, full_name, title, email, phone, bio, avatar_url, specialization, experience_years, availability_status, status } = req.body;
  if (!user_id || !full_name || !email || !specialization) {
    throw new ApiError(400, 'user_id, full_name, email và specialization là bắt buộc.');
  }
  const lawyer = await lawyerService.createLawyer({
    user_id, full_name, title: title ?? 'Luật sư', email, phone: phone ?? null,
    bio: bio ?? null, avatar_url: avatar_url ?? null, specialization,
    experience_years: experience_years ?? 0,
    availability_status: availability_status ?? 'AVAILABLE', status: status ?? 'active',
  });
  res.status(201).json({ success: true, data: lawyer.toJSON() });
}

export async function update(req, res) {
  const lawyer = await lawyerService.updateLawyer(req.params.id, req.body);
  res.json({ success: true, data: lawyer.toJSON() });
}

export async function remove(req, res) {
  await lawyerService.deleteLawyer(req.params.id);
  res.json({ success: true, message: 'Đã xóa luật sư.' });
}
