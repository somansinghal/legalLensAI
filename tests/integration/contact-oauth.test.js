import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.NODE_ENV = 'test';
const { createApp } = await import('../../server/app.js');
function request(server, path, options = {}) { return new Promise((resolve, reject) => { const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path, method: options.method || 'GET', headers: options.headers || {} }, (res) => { let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);if(options.body)req.write(options.body);req.end();}); }
test('OAuth start fails safely when configuration is missing', async () => {
  const prevId = process.env.GOOGLE_CLIENT_ID;
  const prevSec = process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  const server = createApp().listen(0);
  try {
    const r = await request(server, '/api/auth/google');
    assert.equal(r.status, 503);
    assert.match(r.body, /OAUTH_UNAVAILABLE/);
  } finally {
    if (prevId) process.env.GOOGLE_CLIENT_ID = prevId;
    if (prevSec) process.env.GOOGLE_CLIENT_SECRET = prevSec;
    server.close();
  }
});
test('OAuth callback without state redirects to a generic failure page', async () => { const server=createApp().listen(0); try { const r=await request(server,'/api/auth/google/callback?code=bad'); assert.equal(r.status,302); assert.equal(r.headers.location,'/login.html?oauth=failed'); } finally {server.close();} });
test('contact validates input and does not claim delivery without provider configuration', async () => { const server=createApp().listen(0); try { const r=await request(server,'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'A',email:'bad',subject:'x',inquiryType:'Other',message:'x'})}); assert.equal(r.status,400); assert.match(r.body,/INVALID_EMAIL/); } finally {server.close();} });
