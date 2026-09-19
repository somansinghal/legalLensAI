import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.DEMO_EMAIL = 'analysis@example.com';
process.env.DEMO_PASSWORD = 'analysis-password';
process.env.NODE_ENV = 'test';
process.env.AI_TEST_MODE = 'true';
const { createApp } = await import('../../server/app.js');

function request(server, path, options = {}) { return new Promise((resolve, reject) => { const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path, method: options.method || 'GET', headers: options.headers || {} }, (res) => { let body = ''; res.on('data', (chunk) => { body += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) })); }); req.on('error', reject); if (options.body) req.write(options.body); req.end(); }); }

test('authenticated analysis returns validated structured data in test mode', async () => { const server = createApp().listen(0); try { const login = await request(server, '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'analysis@example.com', password: 'analysis-password' }) }); const cookie = login.headers['set-cookie'][0].split(';')[0]; const response = await request(server, '/api/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ persona: 'employee', intent: 'understand_before_signing', document: { name: 'demo', text: 'A short synthetic agreement.' } }) }); assert.equal(response.status, 200); assert.equal(response.body.context.persona, 'employee'); assert.ok(Array.isArray(response.body.importantClauses)); } finally { server.close(); } });
