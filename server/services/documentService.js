import { AppError } from '../utils/errors.js';

export function normalizeDocument(text, name = 'Document') {
  if (typeof text !== 'string') throw new AppError(400, 'INVALID_DOCUMENT', 'Provide document text or choose a demo document.');
  const normalized = text.replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();
  if (!normalized) throw new AppError(422, 'EMPTY_DOCUMENT', 'The document is empty. Add text before analyzing.');
  if (normalized.length > 120000) throw new AppError(413, 'DOCUMENT_TOO_LARGE', 'The document is too large to process.');
  return { name: String(name).slice(0, 120), text: normalized, charCount: normalized.length };
}
