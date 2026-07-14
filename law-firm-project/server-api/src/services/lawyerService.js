import { Lawyer, LegalCategory, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

const categoryInclude = [{
  model: LegalCategory,
  as: 'categories',
  attributes: ['id', 'name', 'slug'],
  through: { attributes: [] },
  required: false,
}];

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function matchesSpecialization(lawyer, label) {
  const target = normalize(label);
  const values = [lawyer.specialization, ...(lawyer.categories || []).map((category) => category.name)];
  return values.some((value) => {
    const normalized = normalize(value);
    return normalized.includes(target) || target.includes(normalized);
  });
}

export async function listPublicLawyers() {
  return Lawyer.findAll({
    where: { status: 'active' },
    include: categoryInclude,
    order: [['availability_status', 'ASC'], ['experience_years', 'DESC']],
  });
}

export async function listAllLawyers() {
  return Lawyer.findAll({ include: categoryInclude, order: [['id', 'ASC']] });
}

export async function getLawyerById(id) {
  const lawyer = await Lawyer.findByPk(id, { include: categoryInclude });
  if (!lawyer) throw new ApiError(404, 'Không tìm thấy luật sư.');
  return lawyer;
}

export async function createLawyer(payload) {
  const user = await User.findByPk(payload.user_id);
  if (!user) throw new ApiError(404, 'Không tìm thấy tài khoản luật sư.');
  if (user.role !== 'LAWYER') throw new ApiError(409, 'Tài khoản phải có vai trò LAWYER.');
  if (await Lawyer.findOne({ where: { user_id: user.id } })) {
    throw new ApiError(409, 'Tài khoản đã có hồ sơ luật sư.');
  }
  return Lawyer.create(payload);
}

export async function updateLawyer(id, payload) {
  const lawyer = await getLawyerById(id);
  await lawyer.update(payload);
  return getLawyerById(id);
}

export async function deleteLawyer(id) {
  const lawyer = await getLawyerById(id);
  await lawyer.destroy();
  return true;
}

export async function findLawyersBySpecialization(specializationLabel, limit = 3) {
  const label = (specializationLabel || '').trim();
  const lawyers = await listPublicLawyers();
  const ranked = label && normalize(label) !== normalize('Tổng quát')
    ? lawyers.filter((lawyer) => matchesSpecialization(lawyer, label))
    : lawyers;

  return ranked
    .sort((left, right) => {
      const availability = { AVAILABLE: 0, BUSY: 1, OFFLINE: 2 };
      return (availability[left.availability_status] ?? 3) - (availability[right.availability_status] ?? 3)
        || right.experience_years - left.experience_years;
    })
    .slice(0, Math.max(1, Math.min(Number(limit) || 3, 10)));
}
