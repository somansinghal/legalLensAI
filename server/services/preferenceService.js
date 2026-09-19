import { getFirestoreDb } from './firebaseService.js';

/**
 * Retrieves user preferences (e.g. favorite persona, default intent).
 */
export async function getUserPreferences(userId) {
  const db = getFirestoreDb();
  if (!db || !userId) return null;

  try {
    const prefRef = db.collection('users').doc(userId).collection('preferences').doc('settings');
    const doc = await prefRef.get();
    if (!doc.exists) return { persona: 'employee', intent: 'understand_before_signing' };
    return doc.data();
  } catch (error) {
    console.warn('[PreferenceService] Error reading preferences:', error.message);
    return null;
  }
}

/**
 * Updates user preferences.
 */
export async function setUserPreferences(userId, prefs) {
  const db = getFirestoreDb();
  if (!db || !userId || !prefs) return null;

  try {
    const prefRef = db.collection('users').doc(userId).collection('preferences').doc('settings');
    const now = new Date().toISOString();
    const data = {
      persona: prefs.persona || 'employee',
      intent: prefs.intent || 'understand_before_signing',
      updatedAt: now
    };
    await prefRef.set(data, { merge: true });
    return data;
  } catch (error) {
    console.warn('[PreferenceService] Error setting preferences:', error.message);
    return null;
  }
}
