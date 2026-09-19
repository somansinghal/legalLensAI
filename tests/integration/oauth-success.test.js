import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'test-client';
process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://127.0.0.1:3000/api/auth/google/callback';
const { createApp } = await import('../../server/app.js');
function request(server, path) { return new Promise((resolve, reject) => { const req=http.request({hostname:'127.0.0.1',port:server.address().port,path},res=>{res.resume();res.on('end',()=>resolve(res));});req.on('error',reject);req.end();}); }
test('successful OAuth callback uses verified mocked Google identity and creates a session', async () => { const originalFetch = global.fetch; global.fetch = async (url) => url.includes('oauth2.googleapis.com') ? new Response(JSON.stringify({ access_token: 'transient-test-token' }), { status: 200 }) : new Response(JSON.stringify({ sub: 'google-user-1', email: 'verified@example.com', email_verified: true, name: 'Verified User' }), { status: 200 }); process.env.GOOGLE_CLIENT_ID='test-client'; const server=createApp().listen(0); try { const start=await request(server,'/api/auth/google'); assert.equal(start.statusCode,302); const location=new URL(start.headers.location); const callback=await request(server,`/api/auth/google/callback?code=mock-code&state=${location.searchParams.get('state')}`); assert.equal(callback.statusCode,302); assert.equal(callback.headers.location,'/dashboard.html'); assert.match(callback.headers['set-cookie'][0],/HttpOnly/); } finally { global.fetch=originalFetch; server.close(); } });
