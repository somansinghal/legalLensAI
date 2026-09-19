import { AppError } from '../utils/errors.js';
import { getSession } from '../services/authService.js';

export const sessionCookieName = 'legallens_session';

export function getSessionToken(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`));
  return match ? decodeURIComponent(match.slice(sessionCookieName.length + 1)) : null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getSessionToken(req);
    const session = await getSession(token);
    if (!session) return next(new AppError(401, 'UNAUTHORIZED', 'Please sign in to access this resource.'));
    req.session = session;
    return next();
  } catch (error) {
    return next(error);
  }
}
