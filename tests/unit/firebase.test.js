import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initFirebase, getFirestoreDb, isFirebaseAvailable, setFirestoreDbForTests, resetFirebaseForTests } from '../../server/services/firebaseService.js';

test('firebase initialization handles unconfigured environments gracefully', async () => {
  await resetFirebaseForTests();
  // Ensure env vars are unset
  const prevProject = process.env.FIREBASE_PROJECT_ID;
  const prevEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const prevKey = process.env.FIREBASE_PRIVATE_KEY;
  const prevHost = process.env.FIRESTORE_EMULATOR_HOST;
  const prevAdc = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    const db = initFirebase();
    assert.equal(db, null, 'Unconfigured environment should return null without throwing');
    assert.equal(isFirebaseAvailable(), false, 'isFirebaseAvailable should return false');
    assert.equal(getFirestoreDb(), null, 'getFirestoreDb should return null');
  } finally {
    if (prevProject) process.env.FIREBASE_PROJECT_ID = prevProject;
    if (prevEmail) process.env.FIREBASE_CLIENT_EMAIL = prevEmail;
    if (prevKey) process.env.FIREBASE_PRIVATE_KEY = prevKey;
    if (prevHost) process.env.FIRESTORE_EMULATOR_HOST = prevHost;
    if (prevAdc) process.env.GOOGLE_APPLICATION_CREDENTIALS = prevAdc;
    await resetFirebaseForTests();
  }
});

test('firebase mock injection works for deterministic unit testing', async () => {
  const mockDb = { collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) };
  setFirestoreDbForTests(mockDb);
  assert.equal(isFirebaseAvailable(), true, 'Mock injection should make firebase available');
  assert.equal(getFirestoreDb(), mockDb, 'getFirestoreDb should return mock instance');
  await resetFirebaseForTests();
  assert.equal(isFirebaseAvailable(), false, 'Resetting should clear mock');
});
