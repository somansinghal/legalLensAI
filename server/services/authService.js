import crypto from 'node:crypto';
import { getFirestoreDb } from './firebaseService.js';

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

const getTokenHash = (token) => {
  const secret = process.env.SESSION_SECRET || 'legallens-session-salt';
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
};

const getStateHash = (state) => {
  const secret = process.env.SESSION_SECRET || 'legallens-oauth-salt';
  return crypto.createHmac('sha256', secret).update(state).digest('hex');
};

const revokedTokens = new Set();

const signToken = (payload) => {
  const secret = process.env.SESSION_SECRET || 'legallens-session-salt';
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
};

const verifySignedToken = (token) => {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSig] = parts;
  const secret = process.env.SESSION_SECRET || 'legallens-session-salt';
  const expectedSig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  if (providedSig.length !== expectedSig.length) return null;
  const left = Buffer.from(providedSig);
  const right = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.expiresAt !== 'number' || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export function verifyDemoCredentials(email, password) {
  const expectedEmail = process.env.DEMO_EMAIL;
  const expectedPassword = process.env.DEMO_PASSWORD;
  return Boolean(expectedEmail && expectedPassword && safeEqual(email, expectedEmail) && safeEqual(password, expectedPassword));
}

export async function createSession(userData) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const isString = typeof userData === 'string';
  const email = isString ? userData : userData.email;
  const userId = (!isString && userData.userId)
    ? userData.userId
    : `demo:${hash(email || 'anonymous').slice(0, 16)}`;

  const sessionRecord = {
    userId,
    email,
    role: (!isString && userData.role) ? userData.role : 'demo',
    provider: (!isString && userData.provider) ? userData.provider : 'demo',
    providerUserId: (!isString && userData.providerUserId) ? userData.providerUserId : null,
    displayName: (!isString && userData.displayName) ? userData.displayName : null,
    photoURL: (!isString && userData.photoURL) ? userData.photoURL : null,
    expiresAt: Date.now() + SESSION_TTL_MS,
    createdAt: Date.now()
  };

  const token = signToken({ ...sessionRecord, nonce });
  sessions.set(token, sessionRecord);

  const db = getFirestoreDb();
  if (db) {
    try {
      const tokenHash = getTokenHash(token);
      await db.collection('sessions').doc(tokenHash).set(sessionRecord);
    } catch {
      // Graceful fallback to in-memory / cryptographic verification
    }
  }

  return token;
}

export async function getSession(token) {
  if (!token) return null;
  if (revokedTokens.has(token)) return null;

  // 1. Fast in-memory cache check
  const cached = sessions.get(token);
  if (cached) {
    if (cached.expiresAt <= Date.now()) {
      sessions.delete(token);
      const db = getFirestoreDb();
      if (db) {
        db.collection('sessions').doc(getTokenHash(token)).delete().catch(() => null);
      }
      return null;
    }
    return { ...cached };
  }

  // 2. Cryptographic signature check (ensures zero session loss across serverless instances)
  const verified = verifySignedToken(token);
  if (verified) {
    const db = getFirestoreDb();
    if (db) {
      try {
        const tokenHash = getTokenHash(token);
        const doc = await db.collection('sessions').doc(tokenHash).get();
        if (!doc.exists) {
          // Explicitly removed from persistent store
          return null;
        }
        const remoteData = doc.data();
        if (remoteData.expiresAt <= Date.now()) {
          await db.collection('sessions').doc(tokenHash).delete().catch(() => null);
          return null;
        }
        sessions.set(token, remoteData);
        return { ...remoteData };
      } catch {
        // Firestore unreachable/offline; fall back gracefully to verified cryptographic token
        sessions.set(token, verified);
        return { ...verified };
      }
    }
    sessions.set(token, verified);
    return { ...verified };
  }

  // 3. Fallback for raw/legacy tokens via Firestore
  const db = getFirestoreDb();
  if (db) {
    try {
      const tokenHash = getTokenHash(token);
      const doc = await db.collection('sessions').doc(tokenHash).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.expiresAt > Date.now()) {
          sessions.set(token, data);
          return { ...data };
        } else {
          await db.collection('sessions').doc(tokenHash).delete().catch(() => null);
          return null;
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function destroySession(token) {
  if (!token) return;
  revokedTokens.add(token);
  sessions.delete(token);

  const db = getFirestoreDb();
  if (db) {
    try {
      const tokenHash = getTokenHash(token);
      await db.collection('sessions').doc(tokenHash).delete().catch(() => null);
    } catch {
      // In-memory cleanup already done
    }
  }
}

export async function createOAuthState(returnTo = '/dashboard.html') {
  const state = crypto.randomBytes(32).toString('hex');
  const record = { returnTo, expiresAt: Date.now() + OAUTH_STATE_TTL_MS, createdAt: Date.now() };
  oauthStates.set(state, record);

  const db = getFirestoreDb();
  if (db) {
    try {
      const stateHash = getStateHash(state);
      await db.collection('oauthStates').doc(stateHash).set(record);
    } catch {
      // In-memory fallback
    }
  }

  return state;
}

export async function consumeOAuthState(state) {
  if (!state) return null;

  let item = oauthStates.get(state);
  oauthStates.delete(state);

  const db = getFirestoreDb();
  if (db) {
    try {
      const stateHash = getStateHash(state);
      if (!item) {
        const doc = await db.collection('oauthStates').doc(stateHash).get();
        if (doc.exists) {
          item = doc.data();
        }
      }
      await db.collection('oauthStates').doc(stateHash).delete().catch(() => null);
    } catch {
      // ignore
    }
  }

  if (!item || item.expiresAt <= Date.now()) return null;
  return item;
}

export function clearSessionsForTests() {
  sessions.clear();
  oauthStates.clear();
  revokedTokens.clear();
}
