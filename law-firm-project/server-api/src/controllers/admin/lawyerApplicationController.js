import * as lawyerApplicationService from '../../services/lawyerApplicationService.js';

export async function list(req, res) {
  const applications = await lawyerApplicationService.listLawyerApplications();
  res.json({ success: true, data: applications.map((app) => app.toJSON()) });
}

export async function getOne(req, res) {
  const application = await lawyerApplicationService.getLawyerApplicationById(req.params.id);
  res.json({ success: true, data: application.toJSON() });
}

export async function approve(req, res) {
  const { review_note } = req.body;
  const application = await lawyerApplicationService.approveLawyerApplication(
    req.params.id,
    req.user?.id,
    review_note ?? null
  );
  res.json({ success: true, data: application.toJSON(), message: 'Yêu cầu đã được duyệt.' });
}

export async function reject(req, res) {
  const { review_note } = req.body;
  const application = await lawyerApplicationService.rejectLawyerApplication(
    req.params.id,
    req.user?.id,
    review_note ?? null
  );
  res.json({ success: true, data: application.toJSON(), message: 'Yêu cầu đã bị từ chối.' });
}
