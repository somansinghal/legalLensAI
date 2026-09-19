import { getFirestoreDb } from './firebaseService.js';

/**
 * Creates or updates an authenticated user profile in `users/{userId}`.
 * Only minimal non-sensitive application identity data is persisted.
 *
 * Never stores OAuth tokens, credentials, or document content.
 */
export async function upsertUserProfile(userData) {
  const db = getFirestoreDb();
  if (!db || !userData?.userId) {
    return null;
  }

  const { userId, provider = 'demo', providerUserId = null, email = null, displayName = null, photoURL = null } = userData;

  try {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    const now = new Date().toISOString();
    const payload = {
      userId,
      provider,
      providerUserId,
      email,
      displayName,
      photoURL,
      lastLoginAt: now,
      updatedAt: now
    };

    if (!doc.exists) {
      payload.createdAt = now;
      await userRef.set(payload);
    } else {
      await userRef.set(payload, { merge: true });
    }

    return { userId, email, displayName, provider, lastLoginAt: now };
  } catch (error) {
    console.warn('[UserService] User profile persistence failed gracefully:', error.message);
    return null;
  }
}

/**
 * Retrieves a user profile by stable user ID.
 */
export async function getUserProfile(userId) {
  const db = getFirestoreDb();
  if (!db || !userId) return null;

  try {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) return null;

    const data = doc.data();
    // Return sanitized profile
    return {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      provider: data.provider,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt
    };
  } catch (error) {
    console.warn('[UserService] Unable to fetch user profile:', error.message);
    return null;
  }
}
