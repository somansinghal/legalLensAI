import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';
const { createApp } = await import('../../server/app.js');

function request(server, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method: 'GET'
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
    req.end();
  });
}

test('GET /api/demos returns all 5 synthetic agreements publicly without requiring login', async () => {
  const server = createApp().listen(0);
  try {
    const res = await request(server, '/api/demos');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.demos));
    assert.equal(res.body.demos.length, 5);

    const ids = res.body.demos.map((d) => d.id);
    assert.ok(ids.includes('employment'));
    assert.ok(ids.includes('freelancer'));
    assert.ok(ids.includes('internship'));
    assert.ok(ids.includes('nda'));
    assert.ok(ids.includes('service'));

    // Verify synthetic labeling and security: text is omitted in listing
    for (const demo of res.body.demos) {
      assert.match(demo.label, /Synthetic demo document/i);
      assert.ok(demo.title);
      assert.ok(demo.persona);
      assert.ok(demo.description);
      assert.equal(demo.text, undefined);
    }
  } finally {
    server.close();
  }
});

test('GET /api/demos/:id returns realistic synthetic agreement text for each supported document', async () => {
  const server = createApp().listen(0);
  try {
    for (const id of ['employment', 'freelancer', 'internship', 'nda', 'service']) {
      const res = await request(server, `/api/demos/${id}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.demo);
      assert.equal(res.body.demo.id, id);
      assert.ok(res.body.demo.text.length > 200, 'Demo document text must be substantial and realistic');
      assert.match(res.body.demo.label, /Synthetic demo document/i);
    }
  } finally {
    server.close();
  }
});

test('GET /api/demos/:id returns safe 404 for unknown demo identifier', async () => {
  const server = createApp().listen(0);
  try {
    const res = await request(server, '/api/demos/unknown_document_id');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'DEMO_NOT_FOUND');
  } finally {
    server.close();
  }
});
