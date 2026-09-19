import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../../server/app.js';

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request({ hostname: '127.0.0.1', port: address.port, path, method: options.method || 'GET', headers: options.headers || {} }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

test('GET /api/health returns a public service status', async () => {
  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok', service: 'LegalLens AI' });
    assert.ok(response.headers['x-request-id']);
  } finally { server.close(); }
});

test('unknown routes return the documented error shape', async () => {
  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/not-real');
    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, 'NOT_FOUND');
    assert.match(response.body.error.message, /not found/i);
  } finally { server.close(); }
});

test('oversized JSON requests return a safe 413 response', async () => {
  const server = createApp().listen(0);
  try {
    const response = await request(server, '/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(599000) })
    });
    assert.equal(response.status, 413);
    assert.equal(response.body.error.code, 'PAYLOAD_TOO_LARGE');
    assert.doesNotMatch(JSON.stringify(response.body), /stack|node_modules/i);
  } finally { server.close(); }
});
