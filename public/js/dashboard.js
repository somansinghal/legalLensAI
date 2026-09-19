import { initThemeSwitcher } from './theme.js';

const state = {
  demo: null,
  analysis: null,
  user: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const text = (value) => String(value ?? '');

function escapeHtml(value) {
  return text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function card(title, body, className = '', icon = '') {
  return `
    <article class="result-card ${className}">
      <div class="result-card-header">
        <h3>${icon ? `<span class="result-card-icon" aria-hidden="true">${icon}</span>` : ''}${escapeHtml(title)}</h3>
      </div>
      ${body}
    </article>
  `;
}

function normalizeAttentionLevel(level) {
  const l = String(level || '').toLowerCase().replace(/[\s-]/g, '_');
  if (l.includes('high')) return 'high_attention';
  if (l.includes('review') || l.includes('medium')) return 'review_carefully';
  return 'informational';
}

function renderResults(data) {
  state.analysis = data;
  const doc = data.document || {};
  const ctx = data.context || {};

  const summary = (data.summary || []).map((item) => `<li>${escapeHtml(item.text)}</li>`).join('');

  const attention = (data.attentionItems || []).map((item) => {
    const levelClass = normalizeAttentionLevel(item.level);
    const levelLabel = levelClass === 'high_attention'
      ? 'HIGH ATTENTION'
      : levelClass === 'review_carefully'
      ? 'REVIEW CAREFULLY'
      : 'INFORMATIONAL';

    return `
      <article class="attention-item ${levelClass}">
        <div>
          <span class="status-label">${levelLabel}</span>
          <h4>${escapeHtml(item.title || item.clause || 'Review Item')}</h4>
          <p>${escapeHtml(item.explanation || '')}</p>
        </div>
        ${item.suggestedAction ? `
          <div class="attention-action">
            <strong>Suggested next step</strong>
            ${escapeHtml(item.suggestedAction)}
          </div>
        ` : ''}
      </article>
    `;
  }).join('');

  const clauses = (data.importantClauses || []).map((item) => {
    const levelClass = normalizeAttentionLevel(item.attention);
    const levelLabel = levelClass === 'high_attention'
      ? 'HIGH ATTENTION'
      : levelClass === 'review_carefully'
      ? 'REVIEW CAREFULLY'
      : 'STANDARD';

    return `
      <details class="clause">
        <summary>
          <span>${escapeHtml(item.title || 'Clause')}</span>
          <b>${levelLabel}</b>
        </summary>
        <div class="clause-body">
          <p class="source-label">ORIGINAL DOCUMENT TEXT</p>
          <blockquote>${escapeHtml(item.sourceText || 'No direct excerpt returned.')}</blockquote>
          <p class="source-label">PLAIN-LANGUAGE EXPLANATION</p>
          <p style="margin:0.25rem 0 0.5rem;line-height:1.5;">${escapeHtml(item.explanation || '')}</p>
          ${item.importance ? `<p class="muted" style="font-size:0.78rem;margin:0.5rem 0 0;"><strong>Why this matters:</strong> ${escapeHtml(item.importance)}</p>` : ''}
        </div>
      </details>
    `;
  }).join('');

  const obligations = (data.obligations || []).map((item) => `
    <li class="obligation-item">
      <span class="obligation-party">${escapeHtml(item.party || 'Obligated Party')}</span>
      <div>${escapeHtml(item.action || '')}</div>
      ${item.deadline ? `<span class="obligation-deadline">⏱ Deadline: ${escapeHtml(item.deadline)}</span>` : ''}
      ${item.condition ? `<small class="muted">Condition: ${escapeHtml(item.condition)}</small>` : ''}
    </li>
  `).join('');

  const dates = (data.importantDates || []).map((item) => `
    <li>
      <span class="date-badge">${escapeHtml(item.value || item.date || 'Specified date')}</span>
      <span class="date-event">${escapeHtml(item.label || item.event || '')}</span>
      ${item.explanation ? `<span class="date-explanation">${escapeHtml(item.explanation)}</span>` : ''}
    </li>
  `).join('');

  const questions = (data.lawyerQuestions || []).map((q) => `<li>${escapeHtml(q)}</li>`).join('');

  const checklist = (data.checklist || []).map((item, index) => `
    <label class="check-item ${item.completed ? 'complete' : ''}">
      <input type="checkbox" data-check="${index}" ${item.completed ? 'checked' : ''}>
      <span>${escapeHtml(item.task || '')}</span>
    </label>
  `).join('');

  const persistenceBadge = data.persisted
    ? '<span class="demo-badge" title="Persisted securely to Cloud Firestore">✓ FIRESTORE PERSISTED</span>'
    : '<span class="demo-badge">INFORMATIONAL</span>';

  const partiesList = Array.isArray(doc.parties) && doc.parties.length > 0
    ? doc.parties.map((p) => escapeHtml(`${p.name || 'Party'} (${p.role || 'Role'})`)).join(', ')
    : 'Identified in text';

  $('#results').innerHTML = `
    <div class="results-heading">
      <div>
        <p class="eyebrow">ANALYSIS COMPLETE</p>
        <h2>${escapeHtml(doc.documentType || 'Document Intelligence')}</h2>
        <p>Situation: <strong>${escapeHtml(ctx.persona || 'General')}</strong> · Goal: <strong>${escapeHtml(String(ctx.intent || '').replaceAll('_', ' '))}</strong></p>
      </div>
      <div class="results-badges">
        ${persistenceBadge}
      </div>
    </div>

    <div class="results-grid">
      ${card('Executive Summary', `<ul class="plain-list">${summary || '<li>Summary not returned.</li>'}</ul>`, 'wide', '✦')}

      ${card('Document Metadata', `
        <dl class="info-list">
          <dt>Document Title</dt><dd>${escapeHtml(doc.name || 'Pasted document')}</dd>
          <dt>Document Category</dt><dd>${escapeHtml(doc.documentType || 'Agreement')}</dd>
          <dt>Identified Parties</dt><dd>${partiesList}</dd>
          <dt>Estimated Duration</dt><dd>${escapeHtml(doc.duration || 'Not specified')}</dd>
        </dl>
      `, '', '▤')}

      ${card('Obligations Radar', `<ul class="obligations-list">${obligations || '<li>No specific obligations identified.</li>'}</ul>`, '', '⚖')}

      ${card('Attention Radar', `<div class="attention-list">${attention || '<p>No critical attention points identified.</p>'}</div>`, 'wide', '✧')}

      ${card('Important clauses', `<div class="clauses">${clauses || '<p>No specific clauses extracted.</p>'}</div>`, 'wide', '☷')}

      ${card('Important Dates & Deadlines', `<ul class="dates-list">${dates || '<li>No explicit calendar deadlines identified.</li>'}</ul>`, '', '⏱')}

      ${card('Questions for a Legal Professional', `<ul class="plain-list">${questions || '<li>No tailored questions generated.</li>'}</ul>`, '', '💬')}

      ${card('Action Checklist', `<div class="checklist">${checklist || '<p>No checklist items returned.</p>'}</div>`, 'wide', '☑')}
    </div>

    <aside class="disclaimer section-shell" style="margin-top:2rem;" aria-label="Legal safety disclaimer">
      <span class="disclaimer-icon" aria-hidden="true">ⓘ</span>
      <p><strong>Safety Note:</strong> ${escapeHtml(data.disclaimer || 'LegalLens AI provides legal information and document assistance. It does not provide legal advice and does not replace a qualified legal professional.')}</p>
    </aside>
  `;

  $('#results').hidden = false;

  // Wire interactive checklist syncing
  $('#results').querySelectorAll('[data-check]').forEach((input) => {
    input.addEventListener('change', async (event) => {
      const isChecked = event.target.checked;
      event.target.parentElement.classList.toggle('complete', isChecked);
      const index = Number(event.target.dataset.check);
      if (state.analysis?.analysisId) {
        try {
          await fetch(`/api/checklists/${state.analysis.analysisId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ index, completed: isChecked })
          });
        } catch {
          // Graceful silent degradation
        }
      }
    });
  });
}

async function loadHistory() {
  const historySec = $('#historySection');
  const historyList = $('#historyList');
  if (!historySec || !historyList) return;

  try {
    const res = await fetch('/api/analysis/history');
    if (!res.ok) {
      historySec.hidden = true;
      return;
    }
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) {
      historySec.hidden = true;
      return;
    }

    historyList.innerHTML = items.map((item) => `
      <article class="history-item">
        <div>
          <h4>${escapeHtml(item.documentName || 'Document Analysis')}</h4>
          <div class="history-meta">
            <span class="demo-badge">${escapeHtml(String(item.persona || 'other').toUpperCase())}</span>
            <time>${new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
          </div>
          ${item.summaryPreview ? `<p class="muted" style="font-size:0.78rem;margin:0.6rem 0 0;line-height:1.45;">${escapeHtml(item.summaryPreview.slice(0, 110))}…</p>` : ''}
        </div>
        <button class="history-btn" type="button" data-history-id="${escapeHtml(item.analysisId)}">View insights →</button>
      </article>
    `).join('');

    historyList.querySelectorAll('[data-history-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.historyId;
        const prevText = button.textContent;
        button.textContent = 'Loading…';
        try {
          const detailRes = await fetch(`/api/analysis/history/${id}`);
          if (!detailRes.ok) throw new Error('Could not load analysis record.');
          const detail = await detailRes.json();
          renderResults(detail.item);
          $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {
          button.textContent = 'Error loading';
        } finally {
          button.textContent = prevText;
        }
      });
    });

    historySec.hidden = false;
  } catch {
    historySec.hidden = true;
  }
}

const demoCache = new Map();

async function loadDemos() {
  const demoList = $('#demoList');
  if (!demoList) return;

  try {
    const response = await fetch('/api/demos');
    if (!response.ok) throw new Error('Demo documents could not be loaded.');
    const data = await response.json();
    const demos = data.demos || [];

    demoList.innerHTML = demos.map((demo) => `
      <button class="demo-card" type="button" data-demo="${escapeHtml(demo.id)}">
        <div>
          <div class="demo-card-top">
            <h4 class="demo-card-title">${escapeHtml(demo.title)}</h4>
            <span class="demo-persona-badge">${escapeHtml(demo.persona || 'General')}</span>
          </div>
          <p>${escapeHtml(demo.description || demo.label)}</p>
        </div>
        ${demo.focus ? `<div class="demo-focus-chip"><strong>Focus:</strong> ${escapeHtml(demo.focus)}</div>` : ''}
        <span class="demo-btn" aria-hidden="true">
          Use this demo →
        </span>
      </button>
    `).join('');

    const selectDemo = async (id) => {
      try {
        let demo = demoCache.get(id);
        if (!demo) {
          const res = await fetch(`/api/demos/${id}`);
          if (!res.ok) throw new Error('Could not load demo content.');
          const detail = await res.json();
          demo = detail.demo;
          demoCache.set(id, demo);
        }

        state.demo = demo;
        $('#documentText').value = demo.text;

        if (demo.persona && $('#persona')) $('#persona').value = demo.persona;
        if (demo.intent && $('#intent')) $('#intent').value = demo.intent;

        // Visual selection indicator
        $$('.demo-card').forEach((c) => c.classList.remove('selected'));
        const activeCard = $(`[data-demo="${id}"]`);
        activeCard?.classList.add('selected');

        $('#analysisStatus').textContent = `Loaded “${demo.title}” into workspace. Ready for analysis.`;
        $('#workspaceError').hidden = true;
      } catch (err) {
        $('#workspaceError').textContent = err.message;
        $('#workspaceError').hidden = false;
      }
    };

    demoList.querySelectorAll('[data-demo]').forEach((btn) => {
      btn.addEventListener('click', () => selectDemo(btn.dataset.demo));
    });

    // Prefetch all synthetic demos in background for zero-latency instant loading
    demos.forEach((d) => {
      fetch(`/api/demos/${d.id}`)
        .then((r) => r.json())
        .then((detail) => {
          if (detail.demo) demoCache.set(d.id, detail.demo);
        })
        .catch(() => {});
    });
  } catch (error) {
    demoList.innerHTML = `<p class="form-error">Demo documents could not be loaded. You can still paste any agreement text below.</p>`;
  }
}

function initTabs() {
  const tabs = {
    tabDemo: { tab: $('#tabDemo'), panel: $('#panelDemo') },
    tabPaste: { tab: $('#tabPaste'), panel: $('#panelPaste') },
    tabUpload: { tab: $('#tabUpload'), panel: $('#panelUpload') }
  };

  const activate = (key) => {
    Object.entries(tabs).forEach(([k, { tab, panel }]) => {
      const isTarget = k === key;
      tab?.classList.toggle('active', isTarget);
      tab?.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      if (panel) panel.hidden = !isTarget;
    });
  };

  $('#tabDemo')?.addEventListener('click', () => activate('tabDemo'));
  $('#tabPaste')?.addEventListener('click', () => activate('tabPaste'));
  $('#tabUpload')?.addEventListener('click', () => activate('tabUpload'));

  // File Upload handling
  const dropZone = $('#dropZone');
  const fileInput = $('#fileInput');
  const browseButton = $('#browseButton');
  const uploadFileName = $('#uploadFileName');

  browseButton?.addEventListener('click', () => fileInput?.click());
  dropZone?.addEventListener('click', (e) => {
    if (e.target !== browseButton) fileInput?.click();
  });

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      $('#documentText').value = e.target.result;
      state.demo = { title: file.name };
      if (uploadFileName) {
        uploadFileName.textContent = `Loaded file: ${file.name} (${Math.round(file.size / 1024)} KB)`;
        uploadFileName.hidden = false;
      }
      activate('tabPaste');
      $('#analysisStatus').textContent = `File "${file.name}" loaded into workspace. Ready to analyze.`;
    };
    reader.readAsText(file);
  };

  fileInput?.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
  });

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--cyan)';
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--line)';
  });

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--line)';
    if (e.dataTransfer?.files?.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}

async function analyze() {
  const status = $('#analysisStatus');
  const button = $('#analyzeButton');
  const error = $('#workspaceError');
  const textVal = $('#documentText').value.trim();

  error.hidden = true;

  if (!textVal) {
    error.textContent = 'Please select a synthetic demo agreement, paste document text, or upload a file first.';
    error.hidden = false;
    return;
  }

  button.disabled = true;
  status.textContent = 'Processing your document securely with Groq AI…';

  try {
    const response = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        persona: $('#persona').value,
        intent: $('#intent').value,
        document: {
          name: state.demo?.title || 'Pasted legal document',
          text: textVal
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Analysis could not be completed.');

    renderResults(data);
    status.textContent = 'Analysis ready.';
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    loadHistory().catch(() => {});
  } catch (analysisError) {
    error.textContent = analysisError.message;
    error.hidden = false;
    status.textContent = 'Analysis could not be completed.';
  } finally {
    button.disabled = false;
  }
}

async function loadSession() {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) {
      window.location.assign('/login.html');
      return;
    }
    const data = await response.json();
    state.user = data.user;

    const displayName = data.user.displayName || data.user.email || 'Judge Demo Evaluator';
    const email = data.user.email || 'judge@legallensai-india.vercel.app';
    const initial = displayName.charAt(0).toUpperCase();

    if ($('#userDisplayName')) $('#userDisplayName').textContent = displayName;
    if ($('#dropdownName')) $('#dropdownName').textContent = displayName;
    if ($('#dropdownEmail')) $('#dropdownEmail').textContent = email;
    if ($('#userAvatar')) $('#userAvatar').textContent = initial;

    // Setup user dropdown toggle
    const menuBtn = $('#userMenuButton');
    const dropdown = $('#userDropdown');

    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown.hidden;
      dropdown.hidden = !isHidden;
      menuBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu-container')) {
        if (dropdown) dropdown.hidden = true;
        menuBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dropdown) dropdown.hidden = true;
        menuBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    const doLogout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.assign('/login.html');
    };
    $('#logoutButton')?.addEventListener('click', doLogout);
    $('#topbarLogout')?.addEventListener('click', doLogout);
  } catch {
    window.location.assign('/login.html');
  }
}

// Bootstrap dashboard
initThemeSwitcher();
initTabs();
loadSession();
loadDemos();
loadHistory();
$('#analyzeButton')?.addEventListener('click', analyze);
