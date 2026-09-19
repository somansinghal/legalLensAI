import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setFirestoreDbForTests, resetFirebaseForTests } from '../../server/services/firebaseService.js';
import { upsertUserProfile, getUserProfile } from '../../server/services/userService.js';
import { saveAnalysisHistory, listAnalysisHistory, getAnalysisHistoryById, CURRENT_SCHEMA_VERSION } from '../../server/services/historyService.js';
import { getChecklist, updateChecklist } from '../../server/services/checklistService.js';
import { createApp } from '../../server/app.js';
import { createSession, getSession, destroySession, clearSessionsForTests } from '../../server/services/authService.js';
import { sessionCookieName } from '../../server/middleware/auth.js';

/**
 * In-memory Mock Firestore implementation for deterministic testing without external cloud dependencies.
 */
function createMockFirestore() {
  const store = new Map(); // path -> data

  function getPathDoc(path) {
    return {
      get: async () => ({
        exists: store.has(path),
        data: () => store.get(path) ? structuredClone(store.get(path)) : undefined
      }),
      set: async (data, options = {}) => {
        if (options.merge && store.has(path)) {
          store.set(path, { ...store.get(path), ...data });
        } else {
          store.set(path, structuredClone(data));
        }
      },
      delete: async () => {
        store.delete(path);
      },
      collection: (subCol) => getCollection(`${path}/${subCol}`)
    };
  }

  function getCollection(colPath) {
    return {
      doc: (docId) => getPathDoc(`${colPath}/${docId}`),
      orderBy: (field, direction = 'asc') => ({
        limit: (n) => ({
          get: async () => {
            const prefix = `${colPath}/`;
            const docs = [];
            for (const [key, val] of store.entries()) {
              if (key.startsWith(prefix) && !key.slice(prefix.length).includes('/')) {
                const docId = key.slice(prefix.length);
                docs.push({ id: docId, data: () => structuredClone(val) });
              }
            }
            docs.sort((a, b) => {
              const aVal = a.data()[field] || '';
              const bVal = b.data()[field] || '';
              return direction === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
            });
            return {
              forEach: (callback) => docs.slice(0, n).forEach(callback)
            };
          }
        })
      })
    };
  }

  return {
    collection: (colName) => getCollection(colName),
    _rawStore: store
  };
}

test('user profile persistence creates and updates profiles safely without leaking secrets', async () => {
  const mockDb = createMockFirestore();
  setFirestoreDbForTests(mockDb);

  const userId = 'google:1029384756';
  const userData = {
    userId,
    provider: 'google',
    providerUserId: '1029384756',
    email: 'user@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    secretToken: 'DO_NOT_STORE_THIS' // should be ignored
  };

  const created = await upsertUserProfile(userData);
  assert.ok(created);
  assert.equal(created.userId, userId);
  assert.equal(created.email, 'user@example.com');

  const fetched = await getUserProfile(userId);
  assert.ok(fetched);
  assert.equal(fetched.displayName, 'Test User');
  assert.equal(fetched.secretToken, undefined, 'Secret tokens must never be persisted');

  // Updating profile
  const updated = await upsertUserProfile({
    userId,
    provider: 'google',
    email: 'user@example.com',
    displayName: 'Updated Name'
  });
  assert.ok(updated);

  const reFetched = await getUserProfile(userId);
  assert.equal(reFetched.displayName, 'Updated Name');

  await resetFirebaseForTests();
});

test('analysis history persistence stores structured output, enforces schema version, and omits raw text', async () => {
  const mockDb = createMockFirestore();
  setFirestoreDbForTests(mockDb);

  const userId = 'demo:judge-user';
  const sampleAnalysis = {
    document: {
      name: 'Independent Contractor Agreement.txt',
      documentType: 'Independent Contractor Agreement',
      duration: '12 months',
      parties: [{ name: 'Acme Corp', role: 'Client' }]
    },
    context: {
      persona: 'freelancer',
      intent: 'understand_before_signing'
    },
    summary: [{ text: 'This agreement covers freelance consulting.' }],
    attentionItems: [{ level: 'attention', title: 'Payment terms', explanation: 'Net 60 payment window', suggestedAction: 'Request Net 30' }],
    importantClauses: [{ title: 'IP Assignment', explanation: 'All work product transferred to client', attention: 'attention' }],
    obligations: [{ party: 'Contractor', action: 'Deliver milestones on time' }],
    importantDates: [{ value: '2026-10-01', label: 'Commencement', event: 'Start of work', explanation: 'Project start' }],
    lawyerQuestions: ['Can Net 60 be negotiated to Net 30?'],
    checklist: [{ task: 'Confirm payment frequency', completed: false }]
  };

  const saved = await saveAnalysisHistory({ userId, analysisData: sampleAnalysis });
  assert.ok(saved);
  assert.ok(saved.analysisId);
  assert.equal(saved.schemaVersion, CURRENT_SCHEMA_VERSION);

  // Verify raw document text is NOT persisted
  const rawData = mockDb._rawStore.get(`users/${userId}/analysisHistory/${saved.analysisId}`);
  assert.ok(rawData);
  assert.equal(rawData.text, undefined, 'Raw document text must NEVER be persisted to Firestore');
  assert.equal(rawData.rawText, undefined);
  assert.equal(rawData.schemaVersion, 1);

  // List history for user
  const list = await listAnalysisHistory(userId);
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].analysisId, saved.analysisId);
  assert.equal(list.items[0].documentName, 'Independent Contractor Agreement.txt');

  // Verify single retrieval
  const single = await getAnalysisHistoryById(userId, saved.analysisId);
  assert.ok(single);
  assert.equal(single.document.name, 'Independent Contractor Agreement.txt');
  assert.equal(single.attentionItems.length, 1);

  // Cross-user isolation: User B must not access User A's analysis
  const unauthorized = await getAnalysisHistoryById('demo:other-user', saved.analysisId);
  assert.equal(unauthorized, null, 'User B must not access User A analysis record');

  await resetFirebaseForTests();
});

test('checklist persistence supports querying and updating task completion state', async () => {
  const mockDb = createMockFirestore();
  setFirestoreDbForTests(mockDb);

  const userId = 'demo:checklist-user';
  const analysisData = {
    document: { name: 'NDA.pdf' },
    checklist: [
      { task: 'Verify definition of confidential info', completed: false },
      { task: 'Check non-compete duration', completed: false }
    ]
  };

  const saved = await saveAnalysisHistory({ userId, analysisData });
  assert.ok(saved);

  // Fetch initial checklist
  const initialChecklist = await getChecklist(userId, saved.analysisId);
  assert.ok(initialChecklist);
  assert.equal(initialChecklist.items.length, 2);
  assert.equal(initialChecklist.items[0].completed, false);

  // Update first item to completed
  const updated = await updateChecklist(userId, saved.analysisId, { index: 0, completed: true });
  assert.ok(updated);
  assert.equal(updated.items[0].completed, true);
  assert.equal(updated.items[1].completed, false);

  // Cross-user isolation: User B cannot modify User A's checklist
  const invalidUpdate = await updateChecklist('demo:attacker', saved.analysisId, { index: 0, completed: false });
  assert.equal(invalidUpdate, null, 'Cross-user checklist updates must be rejected');

  await resetFirebaseForTests();
});

test('HTTP API endpoints protect analysis history and checklist routes', async () => {
  clearSessionsForTests();
  const mockDb = createMockFirestore();
  setFirestoreDbForTests(mockDb);

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unauthenticated request to /api/analysis/history returns 401
    const unauthRes = await fetch(`${baseUrl}/api/analysis/history`);
    assert.equal(unauthRes.status, 401);

    // 2. Authenticated request with session cookie returns history items
    const userId = 'demo:api-test-user';
    const sessionToken = await createSession({
      userId,
      email: 'api-user@example.com',
      role: 'demo'
    });

    const authRes = await fetch(`${baseUrl}/api/analysis/history`, {
      headers: {
        Cookie: `${sessionCookieName}=${encodeURIComponent(sessionToken)}`
      }
    });
    assert.equal(authRes.status, 200);
    const data = await authRes.json();
    assert.ok(Array.isArray(data.items));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await resetFirebaseForTests();
  }
});

test('session persistence persists sessions to Firestore and survives in-memory cache clear', async () => {
  clearSessionsForTests();
  const mockDb = createMockFirestore();
  setFirestoreDbForTests(mockDb);

  try {
    // 1. Create a session
    const token = await createSession({
      userId: 'demo:serverless-user',
      email: 'serverless@example.com',
      role: 'demo',
      displayName: 'Serverless User'
    });
    assert.ok(token, 'Session token should be generated');

    // 2. Retrieve session from cache
    const initialSession = await getSession(token);
    assert.ok(initialSession);
    assert.equal(initialSession.userId, 'demo:serverless-user');

    // 3. Clear in-memory Map (simulating serverless cold-start or new lambda instance)
    clearSessionsForTests();

    // 4. Retrieve session again: must be restored from Firestore
    const restoredSession = await getSession(token);
    assert.ok(restoredSession, 'Session should be restored from Firestore when cache is empty');
    assert.equal(restoredSession.userId, 'demo:serverless-user');
    assert.equal(restoredSession.email, 'serverless@example.com');

    // 5. Destroy session
    await destroySession(token);

    // 6. Verify destroyed session is gone from both cache and Firestore
    clearSessionsForTests();
    const destroyedSession = await getSession(token);
    assert.equal(destroyedSession, null, 'Destroyed session must not be retrievable');
  } finally {
    clearSessionsForTests();
    await resetFirebaseForTests();
  }
});
