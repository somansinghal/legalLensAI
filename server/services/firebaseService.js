import { getApps, getApp, initializeApp, cert, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let appInstance = null;
let firestoreDb = null;
let isInitialized = false;

function formatPrivateKey(key) {
  if (!key || typeof key !== 'string') return null;
  return key.replace(/\\n/g, '\n');
}

/**
 * Initializes the Firebase Admin SDK singleton using environment configuration.
 * Supports explicit service account credentials, Application Default Credentials (ADC),
 * or the local Firestore emulator.
 *
 * If credentials are not present, returns null gracefully without crashing or logging errors.
 */
export function initFirebase() {
  if (isInitialized && firestoreDb) {
    return firestoreDb;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    appInstance = getApp();
    firestoreDb = getFirestore(appInstance);
    try { firestoreDb.settings({ preferRest: true }); } catch {}
    isInitialized = true;
    return firestoreDb;
  }

  // Check if any configuration is provided
  const hasExplicitCreds = Boolean(projectId && clientEmail && privateKey);
  const hasAdc = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const hasEmulator = Boolean(emulatorHost);

  if (!hasExplicitCreds && !hasAdc && !hasEmulator) {
    isInitialized = false;
    firestoreDb = null;
    return null;
  }

  try {
    // 1. Emulator mode
    if (hasEmulator) {
      appInstance = initializeApp({
        projectId: projectId || 'demo-legallens-ai'
      });
      firestoreDb = getFirestore(appInstance);
      isInitialized = true;
      return firestoreDb;
    }

    // 2. Explicit server credentials
    if (hasExplicitCreds) {
      appInstance = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      firestoreDb = getFirestore(appInstance);
      try { firestoreDb.settings({ preferRest: true }); } catch {}
      isInitialized = true;
      return firestoreDb;
    }

    // 3. Application Default Credentials (ADC)
    if (hasAdc) {
      appInstance = initializeApp({
        credential: applicationDefault(),
        projectId
      });
      firestoreDb = getFirestore(appInstance);
      try { firestoreDb.settings({ preferRest: true }); } catch {}
      isInitialized = true;
      return firestoreDb;
    }

    return null;
  } catch (error) {
    console.warn('[Firebase] Initialization skipped:', error.message);
    isInitialized = false;
    firestoreDb = null;
    return null;
  }
}

/**
 * Returns the active Firestore database instance or null if unconfigured/unavailable.
 */
export function getFirestoreDb() {
  if (!isInitialized || !firestoreDb) {
    return initFirebase();
  }
  return firestoreDb;
}

/**
 * Checks whether Firebase / Firestore persistence is active and available.
 */
export function isFirebaseAvailable() {
  return Boolean(getFirestoreDb());
}

/**
 * Test helper to inject a mock Firestore instance.
 */
export function setFirestoreDbForTests(mockDb) {
  firestoreDb = mockDb;
  isInitialized = Boolean(mockDb);
}

/**
 * Test helper to reset the Firebase service singleton.
 */
export async function resetFirebaseForTests() {
  const existingApps = getApps();
  for (const app of existingApps) {
    try {
      await deleteApp(app);
    } catch {
      // Ignore cleanup error
    }
  }
  appInstance = null;
  firestoreDb = null;
  isInitialized = false;
}
