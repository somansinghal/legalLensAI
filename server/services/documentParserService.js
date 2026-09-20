import { AppError } from '../utils/errors.js';

export const MAX_DOCUMENT_BYTES = Number(process.env.MAX_DOCUMENT_BYTES) || 500_000;
export const MAX_DOCUMENT_CHARS = Number(process.env.MAX_DOCUMENT_CHARS) || 120_000;

export const SUPPORTED_EXTENSIONS = Object.freeze(['.pdf', '.docx', '.txt', '.md', '.rtf']);

export const SUPPORTED_MIME_TYPES = Object.freeze([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'text/rtf',
  'text/plain',
  'text/markdown',
  'application/octet-stream'
]);

export function getFileExtension(filename) {
  const name = String(filename || '').trim().toLowerCase();
  const extMatch = name.match(/\.[a-z0-9]+$/);
  return extMatch ? extMatch[0] : '';
}

/**
 * Validates magic bytes / file signature to verify file content matches extension.
 */
export function validateFileSignature(buffer, extension) {
  if (!buffer || buffer.length < 4) return false;

  switch (extension) {
    case '.pdf':
      // %PDF-
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    case '.docx':
      // PK\x03\x04 (ZIP archive header)
      return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

    case '.rtf':
      // {\rt
      return buffer[0] === 0x7B && buffer[1] === 0x5C && buffer[2] === 0x72 && buffer[3] === 0x74;

    case '.txt':
    case '.md':
      // Plain text: reject binary null bytes in initial sample
      for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
        if (buffer[i] === 0x00) return false;
      }
      return true;

    default:
      return false;
  }
}

/**
 * Extracts plain text from RTF content without external dependencies.
 */
export function extractRtfText(rtfString) {
  if (typeof rtfString !== 'string') return '';
  let text = rtfString;

  // Remove pict / shppict blocks
  text = text.replace(/\{\\\*(?:pict|shppict)[^}]*\}/g, '');
  // Remove font table, color table, stylesheet, and info metadata groups
  text = text.replace(/\{\\(?:fonttbl|colortbl|stylesheet|info)[^}]*\}/g, '');
  // Convert newlines and tabs
  text = text.replace(/\\(?:par|line)\b\s?/g, '\n');
  text = text.replace(/\\tab\b\s?/g, '\t');
  // Decode hex characters \'hh
  text = text.replace(/\\\'([0-9a-fA-F]{2})/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return '';
    }
  });
  // Preserve escaped symbols: \\, \{, \}
  text = text.replace(/\\\\/g, '\u0000').replace(/\\\{/g, '\u0001').replace(/\\\}/g, '\u0002');
  // Strip control words
  text = text.replace(/\\[a-zA-Z]+-?[0-9]*\s?/g, '');
  // Strip remaining braces
  text = text.replace(/[{}]/g, '');
  // Restore escaped symbols
  text = text.replace(/\u0000/g, '\\').replace(/\u0001/g, '{').replace(/\u0002/g, '}');

  return text;
}

/**
 * Extracts raw text from supported legal document formats transiently in-memory.
 * Raw file data is NEVER stored on disk or in Firestore.
 */
export async function extractDocumentText({ filename, mimeType, buffer }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new AppError(400, 'INVALID_FILE', 'No file data received. Please select a file to upload.');
  }

  if (buffer.length === 0) {
    throw new AppError(422, 'EMPTY_FILE', 'The uploaded file is empty. Please select a valid document.');
  }

  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new AppError(
      413,
      'FILE_TOO_LARGE',
      `The uploaded file exceeds the ${Math.round(MAX_DOCUMENT_BYTES / 1024)} KB limit. Please upload a smaller agreement excerpt.`
    );
  }

  const cleanFilename = String(filename || 'Uploaded Document').trim();
  const extension = getFileExtension(cleanFilename);
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new AppError(
      415,
      'UNSUPPORTED_FORMAT',
      `Unsupported file format. LegalLens AI accepts PDF, DOCX, TXT, MD, and RTF documents.`
    );
  }

  // Magic-byte signature verification
  const isValidSignature = validateFileSignature(buffer, extension);
  if (!isValidSignature) {
    throw new AppError(
      400,
      'CORRUPTED_FILE',
      `The file header does not match the "${extension}" extension. The file may be damaged or renamed.`
    );
  }

  let rawExtractedText = '';

  try {
    switch (extension) {
      case '.pdf': {
        try {
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
          const uint8 = new Uint8Array(buffer);
          const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
          const pageTexts = [];
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            const pageStr = content.items.map((it) => it.str).join(' ');
            if (pageStr.trim()) pageTexts.push(pageStr.trim());
          }
          rawExtractedText = pageTexts.join('\n\n');
        } catch (pdfErr) {
          const msg = String(pdfErr?.message || pdfErr?.name || '').toLowerCase();
          if (msg.includes('password') || msg.includes('encrypted')) {
            throw new AppError(422, 'ENCRYPTED_PDF', 'This PDF is encrypted or password-protected. Please upload an unencrypted document.');
          }
          throw new AppError(422, 'PDF_PARSE_FAILED', 'Could not read PDF contents. Please verify the file is a valid text PDF.');
        }

        const cleanCheck = rawExtractedText.replace(/\s+/g, '');
        if (!cleanCheck) {
          throw new AppError(
            422,
            'EMPTY_PDF_TEXT',
            'This PDF appears to be empty, scanned, or image-only without selectable text. Please upload a text-based document or paste text directly.'
          );
        }
        break;
      }

      case '.docx': {
        try {
          const mammoth = await import('mammoth');
          const result = await (mammoth.default || mammoth).extractRawText({ buffer });
          rawExtractedText = result.value || '';
        } catch (docxErr) {
          throw new AppError(422, 'DOCX_PARSE_FAILED', 'The DOCX file could not be parsed. Please verify the document is valid and not corrupted.');
        }

        const cleanCheck = rawExtractedText.replace(/\s+/g, '');
        if (!cleanCheck) {
          throw new AppError(422, 'EMPTY_DOCX_TEXT', 'The DOCX file contains no extractable text.');
        }
        break;
      }

      case '.rtf': {
        const rtfString = buffer.toString('latin1');
        rawExtractedText = extractRtfText(rtfString);
        const cleanCheck = rawExtractedText.replace(/\s+/g, '');
        if (!cleanCheck) {
          throw new AppError(422, 'EMPTY_RTF_TEXT', 'The RTF file contains no readable text.');
        }
        break;
      }

      case '.txt':
      case '.md': {
        rawExtractedText = buffer.toString('utf-8');
        break;
      }

      default:
        throw new AppError(415, 'UNSUPPORTED_FORMAT', 'Unsupported format.');
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(500, 'EXTRACTION_FAILED', `Failed to process ${extension.toUpperCase().slice(1)} file: ${err.message}`);
  }

  // Normalize extracted text
  const normalizedText = rawExtractedText
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalizedText) {
    throw new AppError(422, 'EMPTY_DOCUMENT', 'No readable text could be extracted from this document.');
  }

  if (normalizedText.length > MAX_DOCUMENT_CHARS) {
    throw new AppError(
      413,
      'DOCUMENT_TOO_LONG',
      `The extracted text exceeds the maximum character limit (${MAX_DOCUMENT_CHARS.toLocaleString()} characters). Please upload a shorter excerpt.`
    );
  }

  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;

  return {
    filename: cleanFilename.slice(0, 120),
    extension: extension.slice(1).toUpperCase(),
    characterCount: normalizedText.length,
    wordCount,
    text: normalizedText
  };
}
