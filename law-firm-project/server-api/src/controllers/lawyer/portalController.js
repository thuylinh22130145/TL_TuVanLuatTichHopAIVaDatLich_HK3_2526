import * as portalService from '../../services/lawyerPortalService.js';

function serializeProfile(result) {
  return { lawyer: result.lawyer.toJSON(), statistics: result.statistics };
}

export async function profile(req, res) {
  res.json({ success: true, data: serializeProfile(await portalService.getPortalProfile(req.user.id)) });
}

export async function updateProfile(req, res) {
  const result = await portalService.updatePortalProfile(req.user.id, req.body);
  res.json({ success: true, data: serializeProfile(result), message: 'Đã cập nhật hồ sơ luật sư.' });
}

export async function schedules(req, res) {
  const rows = await portalService.listSchedules(req.user.id);
  res.json({ success: true, data: rows.map((row) => row.toJSON()) });
}

export async function replaceSchedules(req, res) {
  const rows = await portalService.replaceSchedules(req.user.id, req.body.schedules);
  res.json({ success: true, data: rows.map((row) => row.toJSON()), message: 'Đã cập nhật lịch làm việc.' });
}
