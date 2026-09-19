import { errorResponse } from '../utils/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.', requestId: req.requestId }
  });
}

export function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  const isBodyLimit = error.type === 'entity.too.large';
  const statusCode = isBodyLimit ? 413 : (error.statusCode || 500);
  const safeError = isBodyLimit
    ? { code: 'PAYLOAD_TOO_LARGE', publicMessage: 'The request is too large.' }
    : error.code
      ? error
      : statusCode >= 500
        ? { code: 'INTERNAL_ERROR', publicMessage: 'An internal error occurred.' }
        : error;

  if (process.env.NODE_ENV !== 'test') {
    console.error(JSON.stringify({ requestId: req.requestId, code: safeError.code || 'INTERNAL_ERROR', status: statusCode }));
  }
  res.status(statusCode).json(errorResponse(safeError, req.requestId));
}
