import * as lawyerService from '../../services/lawyerService.js';

export async function getLawyers(req, res) {
  const lawyers = await lawyerService.listPublicLawyers();
  res.json({
    success: true,
    data: lawyers.map((l) => l.toJSON()),
  });
}
