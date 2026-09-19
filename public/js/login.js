import { initThemeSwitcher } from './theme.js';

const form = document.querySelector('#loginForm');
const error = document.querySelector('#loginError');
const demoButton = document.querySelector('#demoAccess');

function showError(message) {
  if (error) {
    error.textContent = message;
    error.hidden = false;
  }
}

// Check for OAuth failure flag in query params
try {
  const params = new URLSearchParams(window.location.search);
  if (params.get('oauth') === 'failed') {
    showError('Google sign-in was not completed or configuration was unavailable. Please use Judge Demo access below or check your connection.');
  }
} catch {}

demoButton?.addEventListener('click', async () => {
  if (error) error.hidden = true;
  const originalHtml = demoButton.innerHTML;
  demoButton.disabled = true;
  demoButton.setAttribute('aria-busy', 'true');
  demoButton.textContent = 'Starting judge demo...';

  try {
    const response = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || 'Judge demo access is currently unavailable. Please use the provided credentials.');
    }
    window.location.assign('/dashboard.html');
  } catch {
    demoButton.disabled = false;
    demoButton.removeAttribute('aria-busy');
    demoButton.innerHTML = originalHtml;
    showError('Judge demo access is currently unavailable. Please use the provided credentials.');
  }
});

document.querySelector('.google-button')?.addEventListener('click', () => {
  document.querySelector('.google-button')?.classList.add('is-loading');
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (error) error.hidden = true;
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value;
  if (!email || !password) return showError('Enter both your email and password.');

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Unable to sign in.');
    window.location.assign('/dashboard.html');
  } catch (loginError) {
    showError(loginError.message);
    button.disabled = false;
  }
});

initThemeSwitcher();
