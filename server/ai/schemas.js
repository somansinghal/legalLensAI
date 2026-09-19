import { ATTENTION_LEVELS, DISCLAIMER, MAX_ITEMS } from '../utils/constants.js';

const text = (value, fallback = '') => typeof value === 'string' ? value.slice(0, 2000) : fallback;
const list = (value) => Array.isArray(value) ? value.slice(0, MAX_ITEMS) : [];

export function validateAnalysis(value, context, document) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('AI response must be an object');
  const clauses = list(value.importantClauses).map((item, index) => ({
    id: text(item?.id, `clause-${index + 1}`), title: text(item?.title, 'Untitled clause'), category: text(item?.category, 'general'),
    sourceText: text(item?.sourceText), explanation: text(item?.explanation), importance: text(item?.importance, 'Review the supplied text carefully.'),
    attention: ATTENTION_LEVELS.includes(item?.attention) ? item.attention : 'informational', sourceRefs: list(item?.sourceRefs).map((ref) => text(ref).slice(0, 80))
  }));
  const attentionItems = list(value.attentionItems).map((item) => ({ level: ATTENTION_LEVELS.includes(item?.level) ? item.level : 'informational', title: text(item?.title, 'Review item'), clause: text(item?.clause), explanation: text(item?.explanation), whyItMayMatter: text(item?.whyItMayMatter), suggestedAction: text(item?.suggestedAction), sourceRefs: list(item?.sourceRefs).map((ref) => text(ref).slice(0, 80)) }));
  return {
    context, document: { name: document.name, documentType: text(value.documentType, 'Legal document'), parties: list(value.parties).map((p) => ({ name: text(p?.name), role: text(p?.role), sourceRefs: list(p?.sourceRefs).map((r) => text(r)) })), duration: text(value.duration, 'Not identified') },
    summary: list(value.summary).map((item) => ({ text: text(item?.text, text(item)), sourceRefs: list(item?.sourceRefs).map((r) => text(r)) })),
    importantClauses: clauses,
    attentionItems,
    obligations: list(value.obligations).map((item) => ({ party: text(item?.party, 'Unspecified party'), action: text(item?.action), condition: text(item?.condition), deadline: text(item?.deadline), sourceRefs: list(item?.sourceRefs).map((r) => text(r)) })),
    importantDates: list(value.importantDates).map((item) => ({ label: text(item?.label, 'Important date'), value: text(item?.value), event: text(item?.event), explanation: text(item?.explanation), sourceRefs: list(item?.sourceRefs).map((r) => text(r)) })),
    lawyerQuestions: list(value.lawyerQuestions).map((item) => text(item)),
    nextSteps: list(value.nextSteps).map((item) => text(item)),
    checklist: list(value.checklist).map((item) => ({ task: text(item?.task, text(item)), done: false })),
    disclaimer: DISCLAIMER
  };
}

export function parseAIJson(raw) { const cleaned = String(raw).replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim(); return JSON.parse(cleaned); }
