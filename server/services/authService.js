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

export function verifyDemoCredentials(email, password) {
  const expectedEmail = process.env.DEMO_EMAIL;
  const expectedPassword = process.env.DEMO_PASSWORD;
  return Boolean(expectedEmail && expectedPassword && safeEqual(email, expectedEmail) && safeEqual(password, expectedPassword));
}

export async function createSession(userData) {
  const token = crypto.randomBytes(32).toString('hex');
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

  sessions.set(token, sessionRecord);

  const db = getFirestoreDb();
  if (db) {
    try {
      const tokenHash = getTokenHash(token);
      await db.collection('sessions').doc(tokenHash).set(sessionRecord);
    } catch {
      // Graceful fallback to in-memory cache
    }
  }

  return token;
}

export async function getSession(token) {
  if (!token) return null;

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

  // 2. Serverless instance retrieval from Firestore
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
}
