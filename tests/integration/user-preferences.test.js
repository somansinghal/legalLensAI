import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createSession } from '../../server/services/authService.js';
import { setFirestoreDbForTests } from '../../server/services/firebaseService.js';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';

const { createApp } = await import('../../server/app.js');

function createMockFirestore() {
  const store = new Map();
  return {
    collection: (col) => ({
      doc: (id) => ({
        get: async () => ({
          exists: store.has(`${col}/${id}`),
          data: () => store.get(`${col}/${id}`)
        }),
        set: async (data, options = {}) => {
          const key = `${col}/${id}`;
          const current = store.get(key) || {};
          const merged = options.merge ? { ...current, ...data } : data;
          store.set(key, merged);
          return true;
        },
        collection: (subCol) => ({
          doc: (subId) => ({
            get: async () => ({
              exists: store.has(`${col}/${id}/${subCol}/${subId}`),
              data: () => store.get(`${col}/${id}/${subCol}/${subId}`)
            }),
            set: async (data, options = {}) => {
              const subKey = `${col}/${id}/${subCol}/${subId}`;
              const current = store.get(subKey) || {};
              const merged = options.merge ? { ...current, ...data } : data;
              store.set(subKey, merged);
              return true;
            }
          })
        })
      })
    })
  };
}

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: body ? JSON.parse(body) : null
      }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

test('User API requires authentication: rejects unauthenticated requests with 401', async () => {
  const server = createApp().listen(0);
  try {
    const profileRes = await request(server, '/api/user/profile');
    assert.equal(profileRes.status, 401);
    assert.equal(profileRes.body.error.code, 'UNAUTHORIZED');

    const prefRes = await request(server, '/api/user/preferences');
    assert.equal(prefRes.status, 401);
  } finally {
    server.close();
  }
});

test('User preferences and profile work with authenticated session and persist theme', async () => {
  const mockDb = createMockFirestore();
  setFirestoreDbForTests(mockDb);

  const token = await createSession({
    userId: 'test_judge_user_1',
    email: 'judge@example.com',
    role: 'demo',
    displayName: 'Judge Demo Evaluator',
    provider: 'demo'
  });

  const authHeaders = {
    Cookie: `legallens_session=${token}`,
    'Content-Type': 'application/json'
  };

  const server = createApp().listen(0);
  try {
    // 1. Get user profile
    const profileRes = await request(server, '/api/user/profile', { headers: authHeaders });
    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.user.userId, 'test_judge_user_1');
    assert.equal(profileRes.body.user.email, 'judge@example.com');
    assert.equal(profileRes.body.user.role, 'demo');

    // 2. Get initial default preferences
    const prefRes = await request(server, '/api/user/preferences', { headers: authHeaders });
    assert.equal(prefRes.status, 200);
    assert.equal(prefRes.body.preferences.theme, 'system');
    assert.equal(prefRes.body.preferences.persona, 'employee');

    // 3. Update theme preference to dark with reduced motion
    const updateRes = await request(server, '/api/user/preferences', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ theme: 'dark', reducedMotion: true, persona: 'freelancer' })
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.preferences.theme, 'dark');
    assert.equal(updateRes.body.preferences.reducedMotion, true);
    assert.equal(updateRes.body.preferences.persona, 'freelancer');

    // 4. Retrieve updated preferences to confirm Firestore persistence
    const verifyRes = await request(server, '/api/user/preferences', { headers: authHeaders });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.preferences.theme, 'dark');
    assert.equal(verifyRes.body.preferences.reducedMotion, true);
    assert.equal(verifyRes.body.preferences.persona, 'freelancer');
  } finally {
    setFirestoreDbForTests(null);
    server.close();
  }
});
