import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createOAuthState } from '../../server/services/authService.js';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-salt-for-oauth';

const { createApp } = await import('../../server/app.js');

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
        body
      }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

test('OAuth unconfigured: returns safe 503 OAUTH_UNAVAILABLE without leaking secrets', async () => {
  const prevId = process.env.GOOGLE_CLIENT_ID;
  const prevSec = process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;

  const server = createApp().listen(0);
  try {
    const res = await request(server, '/api/auth/google');
    assert.equal(res.status, 503);
    const parsed = JSON.parse(res.body);
    assert.equal(parsed.error.code, 'OAUTH_UNAVAILABLE');
    assert.match(parsed.error.message, /Google sign-in is not configured/);
    assert.equal(parsed.error.clientSecret, undefined);
  } finally {
    if (prevId) process.env.GOOGLE_CLIENT_ID = prevId;
    if (prevSec) process.env.GOOGLE_CLIENT_SECRET = prevSec;
    server.close();
  }
});

test('OAuth configured: redirects to accounts.google.com with valid state and scopes', async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
  process.env.GOOGLE_CALLBACK_URL = 'https://legallensai-india.vercel.app/api/auth/google/callback';

  const server = createApp().listen(0);
  try {
    const res = await request(server, '/api/auth/google?returnTo=/dashboard.html');
    assert.equal(res.status, 302);
    assert.ok(res.headers.location);

    const redirectUrl = new URL(res.headers.location);
    assert.equal(redirectUrl.hostname, 'accounts.google.com');
    assert.equal(redirectUrl.pathname, '/o/oauth2/v2/auth');
    assert.equal(redirectUrl.searchParams.get('client_id'), 'test-google-client-id');
    assert.equal(redirectUrl.searchParams.get('response_type'), 'code');
    assert.match(redirectUrl.searchParams.get('scope'), /openid email profile/);
    assert.ok(redirectUrl.searchParams.get('state'), 'OAuth state parameter must be present');
  } finally {
    server.close();
  }
});

test('OAuth invalid state: callback redirects to login with failed indicator', async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

  const server = createApp().listen(0);
  try {
    const res = await request(server, '/api/auth/google/callback?code=mock_code&state=nonexistent_state');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/login.html?oauth=failed');
  } finally {
    server.close();
  }
});

test('OAuth callback failure: upstream token rejection redirects safely', async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

  const validState = await createOAuthState('/dashboard.html');
  const originalFetch = global.fetch;

  // Mock upstream Google token endpoint failure (e.g. invalid code)
  global.fetch = async (url) => {
    if (url.includes('oauth2.googleapis.com')) {
      return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
    }
    return originalFetch(url);
  };

  const server = createApp().listen(0);
  try {
    const res = await request(server, `/api/auth/google/callback?code=invalid_code&state=${validState}`);
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/login.html?oauth=failed');
  } finally {
    global.fetch = originalFetch;
    server.close();
  }
});

test('OAuth successful callback: verifies email, creates session cookie, and enforces safe redirect', async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

  const validState = await createOAuthState('/dashboard.html');
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    if (url.includes('oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'mock-google-token' }), { status: 200 });
    }
    if (url.includes('openidconnect.googleapis.com')) {
      return new Response(JSON.stringify({
        sub: 'google_user_999',
        email: 'legal.tester@example.com',
        email_verified: true,
        name: 'Legal Tester',
        picture: 'https://example.com/avatar.jpg'
      }), { status: 200 });
    }
    return originalFetch(url);
  };

  const server = createApp().listen(0);
  try {
    const res = await request(server, `/api/auth/google/callback?code=valid_code&state=${validState}`);
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/dashboard.html');

    // Verify Set-Cookie header contains HttpOnly session token
    const cookieHeader = res.headers['set-cookie'];
    assert.ok(cookieHeader && cookieHeader.length > 0);
    assert.match(cookieHeader[0], /legallens_session=/);
    assert.match(cookieHeader[0], /HttpOnly/);
    assert.match(cookieHeader[0], /SameSite=Lax/);
  } finally {
    global.fetch = originalFetch;
    server.close();
  }
});

test('OAuth safe redirect validation: prevents open redirects to external domains', async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

  // Attempting malicious open redirect returnTo
  const maliciousReturn = await createOAuthState('https://malicious-phishing.com');
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    if (url.includes('oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'mock-google-token' }), { status: 200 });
    }
    if (url.includes('openidconnect.googleapis.com')) {
      return new Response(JSON.stringify({
        sub: 'google_user_phish_test',
        email: 'phish.test@example.com',
        email_verified: true,
        name: 'Phish Test'
      }), { status: 200 });
    }
    return originalFetch(url);
  };

  const server = createApp().listen(0);
  try {
    const res = await request(server, `/api/auth/google/callback?code=valid_code&state=${maliciousReturn}`);
    assert.equal(res.status, 302);
    // Malicious returnTo must be sanitized to /dashboard.html
    assert.equal(res.headers.location, '/dashboard.html');
  } finally {
    global.fetch = originalFetch;
    server.close();
  }
});
