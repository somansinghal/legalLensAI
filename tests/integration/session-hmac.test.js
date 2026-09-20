import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, getSession, destroySession, clearSessionsForTests } from '../../server/services/authService.js';
import { setFirestoreDbForTests, resetFirebaseForTests } from '../../server/services/firebaseService.js';

test('stateless HMAC session tokens validate across instances without shared in-memory state', async () => {
  clearSessionsForTests();
  // Ensure firestore is null so this tests pure cryptographic resilience
  setFirestoreDbForTests(null);

  try {
    // 1. Instance A creates a session
    const token = await createSession({
      userId: 'demo:stateless-judge',
      email: 'judge@legallensai-india.vercel.app',
      role: 'demo',
      displayName: 'Judge Demo Evaluator'
    });

    assert.ok(token, 'Token generated');
    assert.ok(token.includes('.'), 'Token must be HMAC signed with format payload.signature');

    // 2. Instance A can validate from in-memory cache
    const sessionA = await getSession(token);
    assert.ok(sessionA);
    assert.equal(sessionA.email, 'judge@legallensai-india.vercel.app');

    // 3. Simulate Instance B (new serverless lambda container with EMPTY memory and NO database)
    clearSessionsForTests();

    // 4. Instance B validates token using HMAC secret verification
    const sessionB = await getSession(token);
    assert.ok(sessionB, 'Instance B must validate cryptographic session without memory or database');
    assert.equal(sessionB.userId, 'demo:stateless-judge');
    assert.equal(sessionB.email, 'judge@legallensai-india.vercel.app');
    assert.equal(sessionB.role, 'demo');

    // 5. Tampered token is rejected
    const [payload, sig] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({
      userId: 'demo:hacker',
      email: 'evil@example.com',
      role: 'admin',
      expiresAt: Date.now() + 100000
    })).toString('base64url');
    const forgedToken = `${tamperedPayload}.${sig}`;

    const forgedSession = await getSession(forgedToken);
    assert.equal(forgedSession, null, 'Forged token must be rejected');

    // 6. Destroy session invalidates it
    await destroySession(token);
    const destroyedSession = await getSession(token);
    assert.equal(destroyedSession, null, 'Destroyed session must be rejected');
  } finally {
    clearSessionsForTests();
    await resetFirebaseForTests();
  }
});
