import { AppError } from '../utils/errors.js';
import { getSession } from '../services/authService.js';

export const sessionCookieName = 'legallens_session';

export function getSessionToken(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`));
  return match ? decodeURIComponent(match.slice(sessionCookieName.length + 1)) : null;
}

export function requireAuth(req, res, next) {
  const session = getSession(getSessionToken(req));
  if (!session) return next(new AppError(401, 'UNAUTHORIZED', 'Please sign in to access this resource.'));
  req.session = session;
  return next();
}
