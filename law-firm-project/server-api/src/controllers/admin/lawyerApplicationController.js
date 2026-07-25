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
  const result = await lawyerApplicationService.approveLawyerApplication(
    req.params.id,
    req.user?.id,
    review_note ?? null
  );
  res.json({
    success: true,
    data: {
      application: result.application.toJSON(),
      email_sent: result.email_sent,
    },
    message: result.email_sent
      ? 'Yêu cầu đã được duyệt và email thông báo đã được gửi.'
      : 'Yêu cầu đã được duyệt nhưng chưa gửi được email thông báo.',
  });
}

export async function reject(req, res) {
  const { review_note } = req.body;
  const result = await lawyerApplicationService.rejectLawyerApplication(
    req.params.id,
    req.user?.id,
    review_note ?? null
  );
  res.json({
    success: true,
    data: {
      application: result.application.toJSON(),
      email_sent: result.email_sent,
    },
    message: result.email_sent
      ? 'Yêu cầu đã bị từ chối và email thông báo đã được gửi.'
      : 'Yêu cầu đã bị từ chối nhưng chưa gửi được email thông báo.',
  });
}
