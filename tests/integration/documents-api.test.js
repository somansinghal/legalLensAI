import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../../server/app.js';
import { createSession, clearSessionsForTests } from '../../server/services/authService.js';
import { sessionCookieName } from '../../server/middleware/auth.js';

let app;
let server;
let baseUrl;
let sessionCookie;

test('setup documents API test server', async () => {
  clearSessionsForTests();
  app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const token = await createSession({
    userId: 'demo:doc-tester',
    email: 'doc.tester@legallensai.com',
    role: 'demo',
    displayName: 'Doc Tester'
  });
  sessionCookie = `${sessionCookieName}=${encodeURIComponent(token)}`;
});

test('POST /api/documents/extract requires authentication', async () => {
  const res = await fetch(`${baseUrl}/api/documents/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ filename: 'test.txt', data: Buffer.from('hello').toString('base64') })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error.code, 'UNAUTHORIZED');
});

test('POST /api/documents/extract extracts text from sample DOCX', async () => {
  const docxBuf = fs.readFileSync(path.resolve('tests/fixtures/sample-employment-agreement.docx'));
  const res = await fetch(`${baseUrl}/api/documents/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      filename: 'sample-employment-agreement.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      data: docxBuf.toString('base64')
    })
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.document.extension, 'DOCX');
  assert.ok(json.document.text.includes('LEGAL LENS AI EVALUATION EMPLOYMENT AGREEMENT'));
  assert.ok(json.document.text.includes('Acme Corporation'));
});

test('POST /api/documents/extract extracts text from sample PDF', async () => {
  const pdfBuf = fs.readFileSync(path.resolve('tests/fixtures/sample-nda.pdf'));
  const res = await fetch(`${baseUrl}/api/documents/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      filename: 'sample-nda.pdf',
      mimeType: 'application/pdf',
      data: pdfBuf.toString('base64')
    })
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.document.extension, 'PDF');
  assert.ok(json.document.text.includes('MUTUAL NON-DISCLOSURE AGREEMENT'));
});

test('POST /api/documents/extract extracts text from sample RTF', async () => {
  const rtfBuf = fs.readFileSync(path.resolve('tests/fixtures/sample-consulting.rtf'));
  const res = await fetch(`${baseUrl}/api/documents/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      filename: 'sample-consulting.rtf',
      mimeType: 'application/rtf',
      data: rtfBuf.toString('base64')
    })
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.document.extension, 'RTF');
  assert.ok(json.document.text.includes('CONSULTING SERVICES AGREEMENT'));
});

test('GET /api/documents/formats returns supported formats metadata', async () => {
  const res = await fetch(`${baseUrl}/api/documents/formats`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.supportedExtensions));
  assert.ok(json.supportedExtensions.includes('.pdf'));
  assert.ok(json.supportedExtensions.includes('.docx'));
});

test('teardown documents API test server', async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  clearSessionsForTests();
});
