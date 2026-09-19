import { INTENTS, PERSONAS } from '../utils/constants.js';

const profiles = {
  employee: ['compensation', 'notice period', 'termination', 'confidentiality', 'restrictions', 'employee obligations', 'important dates'],
  freelancer: ['payment', 'deliverables', 'deadlines', 'intellectual property', 'liability', 'termination', 'client obligations'],
  student: ['fees', 'deadlines', 'termination', 'confidentiality', 'personal obligations', 'support'],
  business_owner: ['payment', 'liability', 'deliverables', 'responsibilities', 'termination', 'intellectual property'],
  other: ['parties', 'obligations', 'dates', 'termination', 'unclear provisions']
};

export function isValidContext(persona, intent) { return PERSONAS.includes(persona) && INTENTS.includes(intent); }
export function getPriorityProfile(persona, intent) { return { persona, intent, priorities: profiles[persona] || profiles.other }; }
