import { consultWithAI } from './aiService.js';
import { findLawyersBySpecialization } from './lawyerService.js';

export async function processChatMessage(message, caseContext = null, conversationHistory = []) {
  const aiResult = await consultWithAI(message, caseContext, conversationHistory);
  const suggestedLawyers = aiResult.needsMoreContext
    ? []
    : await findLawyersBySpecialization(aiResult.specialization, 3);
  return {
    ...aiResult,
    suggestedLawyers: suggestedLawyers.map((lawyer) => lawyer.toJSON()),
  };
}
