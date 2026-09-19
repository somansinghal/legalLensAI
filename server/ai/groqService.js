import { AppError } from '../utils/errors.js';

export async function callGroq(prompt) {
  if (process.env.NODE_ENV === 'test' && process.env.AI_TEST_MODE === 'true') return JSON.stringify({ documentType: 'Synthetic agreement', summary: [{ text: 'This document sets out responsibilities, timing, and termination conditions.', sourceRefs: ['demo'] }], importantClauses: [{ id: 'clause-1', title: 'Termination', category: 'termination', sourceText: 'Either party may end the agreement with 30 days written notice.', explanation: 'The agreement describes a notice-based way to end the relationship.', importance: 'Review the timing and any continuing duties.', attention: 'review_carefully', sourceRefs: ['section-4'] }], attentionItems: [{ level: 'review_carefully', title: 'Termination notice', clause: 'Termination', explanation: 'The notice period may affect planning.', whyItMayMatter: 'It sets a period before the agreement ends.', suggestedAction: 'Ask a legal professional how this applies to your situation.', sourceRefs: ['section-4'] }], obligations: [{ party: 'Employee', action: 'Perform agreed duties', condition: 'During the term', deadline: '', sourceRefs: ['section-2'] }], importantDates: [{ label: 'Notice period', value: '30 days', event: 'Written notice', explanation: 'Either party may give notice.', sourceRefs: ['section-4'] }], lawyerQuestions: ['What continuing obligations apply after termination?'], nextSteps: ['Review the notice provision carefully.'], checklist: [{ task: 'Confirm the notice period' }] });
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_MODEL) throw new AppError(503, 'AI_UNAVAILABLE', 'AI analysis is not configured on this server.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS || 30000));
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.GROQ_MODEL, temperature: 0.1, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }] }) });
    if (!response.ok) throw new AppError(response.status === 429 ? 429 : 503, response.status === 429 ? 'RATE_LIMITED' : 'AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again.');
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new AppError(502, 'AI_RESPONSE_INVALID', 'The AI returned an empty response. Please retry.');
    return content;
  } catch (error) {
    if (error.name === 'AbortError') throw new AppError(504, 'AI_TIMEOUT', 'Analysis took too long. Please retry with a shorter document.');
    if (error instanceof AppError) throw error;
    throw new AppError(503, 'AI_UNAVAILABLE', 'The AI service is temporarily unavailable.');
  } finally { clearTimeout(timeout); }
}
