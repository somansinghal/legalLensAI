import crypto from 'node:crypto';

const sessions = new Map();
const oauthStates = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 4;
const OAUTH_STATE_TTL_MS = 1000 * 60 * 10;

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const safeEqual = (a, b) => {
  const left = Buffer.from(hash(a));
  const right = Buffer.from(hash(b));
  return crypto.timingSafeEqual(left, right);
};

export function verifyDemoCredentials(email, password) {
  const expectedEmail = process.env.DEMO_EMAIL;
  const expectedPassword = process.env.DEMO_PASSWORD;
  return Boolean(expectedEmail && expectedPassword && safeEqual(email, expectedEmail) && safeEqual(password, expectedPassword));
}

export function createSession(email) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { email, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { email: session.email, expiresAt: session.expiresAt };
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

export function createOAuthState(returnTo = '/dashboard.html') {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, { returnTo, expiresAt: Date.now() + OAUTH_STATE_TTL_MS });
  return state;
}

export function consumeOAuthState(state) {
  const item = oauthStates.get(state);
  oauthStates.delete(state);
  if (!item || item.expiresAt <= Date.now()) return null;
  return item;
}

export function clearSessionsForTests() {
  sessions.clear();
  oauthStates.clear();
}
