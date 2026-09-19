import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.DEMO_EMAIL = 'judge@example.com';
process.env.DEMO_PASSWORD = 'test-password';
const { createApp } = await import('../../server/app.js');

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path, method: options.method || 'GET', headers: options.headers || {} }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body ? JSON.parse(body) : null }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

test('valid demo login creates an HttpOnly session cookie', async () => {
  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'judge@example.com', password: 'test-password' }) });
    assert.equal(response.status, 200);
    assert.match(response.headers['set-cookie'][0], /HttpOnly/);
    assert.equal(response.body.user.role, 'demo');
  } finally { server.close(); }
});

test('invalid credentials use a generic unauthorized response', async () => {
  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'wrong@example.com', password: 'wrong' }) });
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
    assert.match(response.body.error.message, /incorrect/i);
  } finally { server.close(); }
});

test('protected workspace rejects requests without a session', async () => {
  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/protected/workspace');
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  } finally { server.close(); }
});

test('POST /api/auth/demo authenticates judge automatically and sets HttpOnly cookie without exposing password', async () => {
  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/auth/demo', { method: 'POST' });
    assert.equal(response.status, 200);
    assert.equal(response.body.authenticated, true);
    assert.equal(response.body.user.role, 'demo');
    assert.equal(response.body.user.email, 'judge@example.com');
    assert.equal(response.body.password, undefined);
    assert.match(response.headers['set-cookie'][0], /HttpOnly/);
    assert.match(response.headers['set-cookie'][0], /legallens_session/);
  } finally { server.close(); }
});

test('POST /api/auth/demo returns 503 safely if demo credentials are not configured', async () => {
  const prevEmail = process.env.DEMO_EMAIL;
  const prevPass = process.env.DEMO_PASSWORD;
  delete process.env.DEMO_EMAIL;
  delete process.env.DEMO_PASSWORD;

  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/auth/demo', { method: 'POST' });
    assert.equal(response.status, 503);
    assert.equal(response.body.error.code, 'DEMO_UNAVAILABLE');
    assert.match(response.body.error.message, /currently unavailable/i);
  } finally {
    process.env.DEMO_EMAIL = prevEmail;
    process.env.DEMO_PASSWORD = prevPass;
    server.close();
  }
});

