import { Router } from 'express';
import { createSession, destroySession, verifyDemoCredentials, createOAuthState, consumeOAuthState } from '../services/authService.js';
import { getSessionToken, requireAuth, sessionCookieName } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { upsertUserProfile } from '../services/userService.js';
import crypto from 'node:crypto';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=14400${isProduction ? '; Secure' : ''}`;
const safeReturnTo = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/dashboard.html';

router.get('/google', async (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) return next(new AppError(503, 'OAUTH_UNAVAILABLE', 'Google sign-in is not configured on this server.'));
  const state = await createOAuthState(safeReturnTo(req.query.returnTo));
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: process.env.GOOGLE_CALLBACK_URL, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  const failure = '/login.html?oauth=failed';
  if (req.query.error || !req.query.code || !req.query.state) return res.redirect(failure);
  const state = await consumeOAuthState(req.query.state);
  if (!state || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) return res.redirect(failure);
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: req.query.code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: process.env.GOOGLE_CALLBACK_URL, grant_type: 'authorization_code' }) });
    if (!tokenResponse.ok) return res.redirect(failure);
    const token = await tokenResponse.json();
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!profileResponse.ok) return res.redirect(failure);
    const profile = await profileResponse.json();
    if (!profile.email || profile.email_verified !== true || !profile.sub) return res.redirect(failure);

    const userId = `google:${profile.sub}`;
    const userData = {
      userId,
      provider: 'google',
      providerUserId: profile.sub,
      email: profile.email,
      displayName: profile.name || null,
      photoURL: profile.picture || null,
      role: 'user'
    };

    await upsertUserProfile(userData).catch(() => null);
    const sessionToken = await createSession(userData);
    res.setHeader('Set-Cookie', `${sessionCookieName}=${encodeURIComponent(sessionToken)}; ${cookieOptions}`);
    return res.redirect(safeReturnTo(state.returnTo));
  } catch { return res.redirect(failure); }
});

router.post('/login', async (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password || email.length > 254 || password.length > 256) {
    return next(new AppError(400, 'INVALID_CREDENTIALS', 'Enter a valid email and password.'));
  }
  if (!verifyDemoCredentials(email, password)) {
    return next(new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.'));
  }

  const userId = `demo:${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`;
  const userData = {
    userId,
    provider: 'demo',
    providerUserId: null,
    email,
    displayName: 'Judge Demo User',
    photoURL: null,
    role: 'demo'
  };

  await upsertUserProfile(userData).catch(() => null);
  const token = await createSession(userData);
  res.setHeader('Set-Cookie', `${sessionCookieName}=${encodeURIComponent(token)}; ${cookieOptions}`);
  return res.json({ authenticated: true, user: { userId, email, role: 'demo', displayName: userData.displayName } });
});

router.post('/logout', async (req, res) => {
  await destroySession(getSessionToken(req));
  res.setHeader('Set-Cookie', `${sessionCookieName}=; ${cookieOptions}; Max-Age=0`);
  res.json({ authenticated: false });
});

router.get('/session', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      userId: req.session.userId,
      email: req.session.email,
      role: req.session.role,
      displayName: req.session.displayName || null,
      photoURL: req.session.photoURL || null
    },
    expiresAt: req.session.expiresAt
  });
});

export default router;
