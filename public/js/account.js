import { initThemeSwitcher, applyTheme, getTheme } from './theme.js';

const $ = (selector) => document.querySelector(selector);

async function loadAccountData() {
  try {
    const res = await fetch('/api/user/profile');
    if (!res.ok) {
      // Fallback to session
      const sessRes = await fetch('/api/auth/session');
      if (!sessRes.ok) return window.location.assign('/login.html');
      const sessData = await sessRes.json();
      populateProfile(sessData.user, sessData.session || {});
      return;
    }

    const data = await res.json();
    populateProfile(data.user, data.session);
  } catch {
    window.location.assign('/login.html');
  }
}

function populateProfile(user, session) {
  if (!user) return;
  const name = user.displayName || user.email || 'Judge Demo Evaluator';
  const email = user.email || 'judge@legallensai-india.vercel.app';
  const role = String(user.role || 'user').toUpperCase();
  const provider = user.provider === 'google' ? 'Google OAuth 2.0 (Verified)' : 'Judge Demo Credentials';

  if ($('#profileName')) $('#profileName').textContent = name;
  if ($('#profileEmail')) $('#profileEmail').textContent = email;
  if ($('#profileRole')) $('#profileRole').textContent = role;
  if ($('#profileProvider')) $('#profileProvider').textContent = provider;

  if ($('#profileCreated')) {
    $('#profileCreated').textContent = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Active competition session';
  }

  if ($('#sessionExpires')) {
    const expiresAt = session?.expiresAt || user.expiresAt;
    if (expiresAt) {
      const remainingHours = Math.max(0, Math.round((expiresAt - Date.now()) / (1000 * 60 * 60)));
      $('#sessionExpires').textContent = `Valid (expires in ~${remainingHours} hour${remainingHours === 1 ? '' : 's'})`;
    } else {
      $('#sessionExpires').textContent = '4-hour rolling session';
    }
  }
}

async function loadPreferences() {
  try {
    const res = await fetch('/api/user/preferences');
    if (res.ok) {
      const data = await res.json();
      const prefs = data.preferences || {};
      if (prefs.theme && $('#prefTheme')) $('#prefTheme').value = prefs.theme;
      if (typeof prefs.reducedMotion === 'boolean' && $('#prefReducedMotion')) {
        $('#prefReducedMotion').checked = prefs.reducedMotion;
      }
      if (prefs.persona && $('#prefPersona')) $('#prefPersona').value = prefs.persona;
    }
  } catch {
    // Fallback to local theme
    if ($('#prefTheme')) $('#prefTheme').value = getTheme();
  }
}

// Live preview when dropdown changes
$('#prefTheme')?.addEventListener('change', (e) => {
  applyTheme(e.target.value);
});

$('#prefForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = $('#prefStatus');
  const theme = $('#prefTheme').value;
  const reducedMotion = $('#prefReducedMotion').checked;
  const persona = $('#prefPersona').value;

  applyTheme(theme);
  status.textContent = 'Saving…';

  try {
    const res = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ theme, reducedMotion, persona })
    });
    if (!res.ok) throw new Error('Could not save preferences to server.');
    status.textContent = '✓ Preferences saved successfully.';
  } catch {
    status.textContent = '✓ Theme saved locally.';
  } finally {
    setTimeout(() => { status.textContent = ''; }, 3500);
  }
});

$('#accountLogoutBtn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.assign('/login.html');
});

initThemeSwitcher();
loadAccountData();
loadPreferences();
