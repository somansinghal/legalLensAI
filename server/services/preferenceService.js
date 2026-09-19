import { getFirestoreDb } from './firebaseService.js';

/**
 * Retrieves user preferences (e.g. favorite persona, default intent).
 */
export async function getUserPreferences(userId) {
  const db = getFirestoreDb();
  if (!db || !userId) return { persona: 'employee', intent: 'understand_before_signing', theme: 'system', reducedMotion: false };

  try {
    const prefRef = db.collection('users').doc(userId).collection('preferences').doc('settings');
    const doc = await prefRef.get();
    if (!doc.exists) return { persona: 'employee', intent: 'understand_before_signing', theme: 'system', reducedMotion: false };
    return {
      persona: 'employee',
      intent: 'understand_before_signing',
      theme: 'system',
      reducedMotion: false,
      ...doc.data()
    };
  } catch (error) {
    console.warn('[PreferenceService] Error reading preferences:', error.message);
    return { persona: 'employee', intent: 'understand_before_signing', theme: 'system', reducedMotion: false };
  }
}

/**
 * Updates user preferences.
 */
export async function setUserPreferences(userId, prefs) {
  const db = getFirestoreDb();
  if (!userId || !prefs) return null;

  const now = new Date().toISOString();
  const data = {
    persona: typeof prefs.persona === 'string' ? prefs.persona : 'employee',
    intent: typeof prefs.intent === 'string' ? prefs.intent : 'understand_before_signing',
    theme: ['dark', 'light', 'system'].includes(prefs.theme) ? prefs.theme : 'system',
    reducedMotion: Boolean(prefs.reducedMotion),
    updatedAt: now
  };

  if (db) {
    try {
      const prefRef = db.collection('users').doc(userId).collection('preferences').doc('settings');
      await prefRef.set(data, { merge: true });
    } catch (error) {
      console.warn('[PreferenceService] Error setting preferences:', error.message);
    }
  }

  return data;
}
