import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../server/app.js';
import http from 'node:http';

function get(server, path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port: server.address().port, path }, (res) => {
      res.resume();
      res.on('end', () => resolve(res));
    });
    req.on('error', reject);
  });
}

test('security headers are present and server identity is hidden', async () => {
  const server = createApp().listen(0);
  try {
    const response = await get(server, '/api/health');
    assert.equal(response.headers['x-powered-by'], undefined);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.match(response.headers['content-security-policy'], /default-src/);
    assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN');
  } finally { server.close(); }
});
