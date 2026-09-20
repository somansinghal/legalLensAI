import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { extractDocumentText, MAX_DOCUMENT_BYTES, SUPPORTED_EXTENSIONS } from '../services/documentParserService.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.post('/extract', requireAuth, async (req, res, next) => {
  try {
    const { filename, mimeType, data } = req.body || {};

    if (!filename || typeof filename !== 'string') {
      return next(new AppError(400, 'INVALID_FILENAME', 'A valid document filename is required.'));
    }

    if (!data || typeof data !== 'string') {
      return next(new AppError(400, 'INVALID_PAYLOAD', 'Document content data is missing or invalid.'));
    }

    // Decode base64 payload
    let buffer;
    try {
      // Handle optional data URI prefix e.g. data:application/pdf;base64,...
      const base64Data = data.includes(',') ? data.split(',')[1] : data;
      buffer = Buffer.from(base64Data, 'base64');
    } catch {
      return next(new AppError(400, 'INVALID_ENCODING', 'Could not decode file content. Expected valid Base64 data.'));
    }

    if (buffer.length > MAX_DOCUMENT_BYTES) {
      return next(new AppError(413, 'FILE_TOO_LARGE', `Uploaded document exceeds ${Math.round(MAX_DOCUMENT_BYTES / 1024)} KB limit.`));
    }

    const extracted = await extractDocumentText({ filename, mimeType, buffer });

    res.json({
      success: true,
      requestId: req.requestId,
      document: extracted
    });
  } catch (error) {
    next(error);
  }
});

router.get('/formats', (req, res) => {
  res.json({
    supportedExtensions: SUPPORTED_EXTENSIONS,
    maxBytes: MAX_DOCUMENT_BYTES
  });
});

export default router;
