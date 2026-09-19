import { normalizeDocument } from './documentService.js';
import { isValidContext } from './contextService.js';
import { buildAnalysisPrompt } from '../ai/promptService.js';
import { callGroq } from '../ai/groqService.js';
import { parseAIJson, validateAnalysis } from '../ai/schemas.js';
import { AppError } from '../utils/errors.js';

export async function analyzeDocument({ persona, intent, text, name }) {
  if (!isValidContext(persona, intent)) throw new AppError(400, 'INVALID_CONTEXT', 'Select a supported situation and goal.');
  const document = normalizeDocument(text, name);
  const prompt = buildAnalysisPrompt({ persona, intent, document });
  let parsed;
  try { parsed = parseAIJson(await callGroq(prompt)); } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'AI_RESPONSE_INVALID', 'The AI response could not be understood. Please retry.');
  }
  try { return validateAnalysis(parsed, { persona, intent }, document); } catch { throw new AppError(502, 'AI_RESPONSE_INVALID', 'The AI response did not match the expected format. Please retry.'); }
}
