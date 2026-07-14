import { consultWithAI } from './aiService.js';
import { findLawyersBySpecialization } from './lawyerService.js';

export async function processChatMessage(message, caseContext = null) {
  const aiResult = await consultWithAI(message, caseContext);
  const suggestedLawyers = await findLawyersBySpecialization(aiResult.specialization, 3);
  return {
    ...aiResult,
    suggestedLawyers: suggestedLawyers.map((lawyer) => lawyer.toJSON()),
  };
}
