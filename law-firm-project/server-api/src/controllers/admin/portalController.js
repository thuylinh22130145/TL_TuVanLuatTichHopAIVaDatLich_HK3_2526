import * as portalService from '../../services/adminPortalService.js';

export async function overview(req, res) {
  const result = await portalService.getOverview();
  res.json({ success: true, data: { statistics: result.statistics, recentBookings: result.recentBookings.map((row) => row.toJSON()) } });
}

export async function users(req, res) {
  const rows = await portalService.listUsers(req.query);
  res.json({ success: true, data: rows.map((row) => row.toJSON()) });
}

export async function updateUserStatus(req, res) {
  const user = await portalService.updateUserStatus(req.user.id, req.params.id, req.body.status);
  res.json({ success: true, data: user.toJSON(), message: 'Đã cập nhật trạng thái tài khoản.' });
}

export async function deleteUserAccount(req, res) {
  await portalService.deleteUserAccount(req.user.id, req.params.id);
  res.json({
    success: true,
    message: 'Đã xóa tài khoản.',
  });
}

export async function categories(req, res) {
  const rows = await portalService.listCategories();
  res.json({ success: true, data: rows.map((row) => row.toJSON()) });
}

export async function createCategory(req, res) {
  const row = await portalService.createCategory(req.body);
  res.status(201).json({ success: true, data: row.toJSON() });
}

export async function updateCategory(req, res) {
  const row = await portalService.updateCategory(req.params.id, req.body);
  res.json({ success: true, data: row.toJSON() });
}

export async function deleteCategory(req, res) {
  await portalService.deleteCategory(req.params.id);
  res.json({ success: true, message: 'Đã xóa danh mục pháp luật.' });
}
