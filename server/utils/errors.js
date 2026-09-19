export class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorResponse = (error, requestId) => ({
  error: {
    code: error.code || 'INTERNAL_ERROR',
    message: error.publicMessage || error.message || 'An unexpected error occurred.',
    ...(requestId ? { requestId } : {})
  }
});
