export function getTheme() {
  try {
    return localStorage.getItem('legallens_theme') || 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  const normalized = ['dark', 'light', 'system'].includes(theme) ? theme : 'system';

  if (normalized === 'dark' || normalized === 'light') {
    root.setAttribute('data-theme', normalized);
  } else {
    root.setAttribute('data-theme', 'system');
  }

  try {
    localStorage.setItem('legallens_theme', normalized);
  } catch {}

  // Sync to server preferences if authenticated
  fetch('/api/user/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: normalized })
  }).catch(() => {});

  // Update theme UI dropdowns
  document.querySelectorAll('[data-theme-value]').forEach((el) => {
    const isSelected = el.dataset.themeValue === normalized;
    el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    el.classList.toggle('active', isSelected);
  });

  const label = document.querySelector('#currentThemeLabel');
  if (label) {
    label.textContent = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}

export function initThemeSwitcher() {
  const current = getTheme();
  applyTheme(current);

  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const switcher = btn.closest('.theme-switcher');
      const menu = switcher?.querySelector('.theme-menu');
      if (menu) {
        const isClosed = menu.hidden;
        // Close other menus first
        document.querySelectorAll('.theme-menu').forEach((m) => { m.hidden = true; });
        menu.hidden = !isClosed;
        btn.setAttribute('aria-expanded', isClosed ? 'true' : 'false');
      }
    });
  });

  document.querySelectorAll('[data-theme-value]').forEach((item) => {
    item.addEventListener('click', () => {
      const theme = item.dataset.themeValue;
      applyTheme(theme);
      const menu = item.closest('.theme-menu');
      if (menu) {
        menu.hidden = true;
        const btn = menu.closest('.theme-switcher')?.querySelector('[data-theme-btn]');
        btn?.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-switcher')) {
      document.querySelectorAll('.theme-menu').forEach((menu) => {
        menu.hidden = true;
        const btn = menu.closest('.theme-switcher')?.querySelector('[data-theme-btn]');
        btn?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.theme-menu').forEach((menu) => {
        menu.hidden = true;
        const btn = menu.closest('.theme-switcher')?.querySelector('[data-theme-btn]');
        btn?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getTheme() === 'system') {
        applyTheme('system');
      }
    });
  } catch {}
}
