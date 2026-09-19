const state = { demo: null, analysis: null };
const $ = (selector) => document.querySelector(selector);
const text = (value) => String(value ?? '');

function escapeText(value) {
  return text(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function card(title, body, className = '') {
  return `<article class="result-card ${className}"><h3>${escapeText(title)}</h3>${body}</article>`;
}

function renderResults(data) {
  state.analysis = data;
  const summary = (data.summary || []).map((item) => `<li>${escapeText(item.text)}</li>`).join('');
  const attention = (data.attentionItems || []).map((item) => `<article class="attention-item ${escapeText(item.level)}"><span class="status-label">${escapeText(item.level.replaceAll('_', ' ').toUpperCase())}</span><h4>${escapeText(item.title)}</h4><p>${escapeText(item.explanation)}</p><small>${escapeText(item.suggestedAction)}</small></article>`).join('');
  const clauses = (data.importantClauses || []).map((item) => `<details class="clause"><summary><span>${escapeText(item.title)}</span><b>${escapeText((item.attention || 'standard').replaceAll('_', ' ').toUpperCase())}</b></summary><div class="clause-body"><p class="source-label">ORIGINAL DOCUMENT TEXT</p><blockquote>${escapeText(item.sourceText || 'No source excerpt returned.')}</blockquote><p class="source-label">AI EXPLANATION</p><p>${escapeText(item.explanation)}</p><p>${escapeText(item.importance || '')}</p></div></details>`).join('');
  const obligations = (data.obligations || []).map((item) => `<li><strong>${escapeText(item.party)}:</strong> ${escapeText(item.action)}${item.deadline ? ` <small>Deadline: ${escapeText(item.deadline)}</small>` : ''}</li>`).join('');
  const dates = (data.importantDates || []).map((item) => `<li><strong>${escapeText(item.value)}</strong><span>${escapeText(item.label)} ${escapeText(item.event)}</span><small>${escapeText(item.explanation)}</small></li>`).join('');
  const questions = (data.lawyerQuestions || []).map((q) => `<li>${escapeText(q)}</li>`).join('');
  const checklist = (data.checklist || []).map((item, index) => `<label class="check-item ${item.completed ? 'complete' : ''}"><input type="checkbox" data-check="${index}" ${item.completed ? 'checked' : ''}><span>${escapeText(item.task)}</span></label>`).join('');

  const persistenceBadge = data.persisted
    ? '<span class="demo-badge" title="Saved to Firestore">FIRESTORE PERSISTED</span>'
    : '<span class="demo-badge">INFORMATIONAL</span>';

  $('#results').innerHTML = `<div class="results-heading"><div><p class="eyebrow">ANALYSIS COMPLETE</p><h2>${escapeText(data.document.documentType)}</h2><p>Context: ${escapeText(data.context.persona)} · Goal: ${escapeText(data.context.intent.replaceAll('_', ' '))}</p></div>${persistenceBadge}</div><div class="results-grid">${card('Plain-language summary', `<ul class="plain-list">${summary || '<li>No summary items returned.</li>'}</ul>`, 'wide')}${card('Document information', `<dl class="info-list"><dt>Document</dt><dd>${escapeText(data.document.name)}</dd><dt>Duration</dt><dd>${escapeText(data.document.duration)}</dd><dt>Parties</dt><dd>${data.document.parties.map((p) => escapeText(`${p.name} (${p.role})`)).join(', ') || 'Not identified'}</dd></dl>`)}${card('Attention radar', `<div class="attention-list">${attention || '<p>No attention items returned.</p>'}</div>`, 'wide')}${card('Important clauses', `<div class="clauses">${clauses || '<p>No clauses returned.</p>'}</div>`, 'wide')}${card('Obligations', `<ul class="plain-list">${obligations || '<li>No obligations returned.</li>'}</ul>`)}${card('Important dates', `<ul class="dates-list">${dates || '<li>No dates identified.</li>'}</ul>`)}${card('Questions for a legal professional', `<ul class="plain-list">${questions || '<li>No questions returned.</li>'}</ul>`, 'wide')}${card('Action checklist', `<div class="checklist">${checklist || '<p>No checklist items returned.</p>'}</div>`, 'wide')}</div><p class="dashboard-notice"><strong>Safety note:</strong> ${escapeText(data.disclaimer || 'LegalLens AI provides legal information and document assistance. It does not provide legal advice or replace a qualified legal professional.')}</p>`;
  $('#results').hidden = false;

  $('#results').querySelectorAll('[data-check]').forEach((input) => input.addEventListener('change', async (event) => {
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
        // Safe silent sync
      }
    }
  }));
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
          <h4>${escapeText(item.documentName)}</h4>
          <div class="history-meta">
            <span class="status-label">${escapeText(item.persona.toUpperCase())}</span>
            <time>${new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
          </div>
          ${item.summaryPreview ? `<p class="muted" style="font-size:0.75rem;margin:0.5rem 0 0;line-height:1.4;">${escapeText(item.summaryPreview.slice(0, 90))}…</p>` : ''}
        </div>
        <button class="history-btn" type="button" data-history-id="${escapeText(item.analysisId)}">View insights →</button>
      </article>
    `).join('');

    historyList.querySelectorAll('[data-history-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.historyId;
        button.textContent = 'Loading…';
        try {
          const detailRes = await fetch(`/api/analysis/history/${id}`);
          if (!detailRes.ok) throw new Error('Could not load analysis record.');
          const detail = await detailRes.json();
          renderResults(detail.item);
          $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
          button.textContent = 'Error loading';
        } finally {
          button.textContent = 'View insights →';
        }
      });
    });

    historySec.hidden = false;
  } catch {
    historySec.hidden = true;
  }
}

async function loadDemos() {
  const response = await fetch('/api/demos');
  if (!response.ok) throw new Error('Demo documents could not be loaded.');
  const data = await response.json();
  $('#demoList').innerHTML = data.demos.map((demo) => `<button class="demo-document" type="button" data-demo="${escapeText(demo.id)}"><span>${escapeText(demo.title)}</span><small>${escapeText(demo.label)}</small></button>`).join('');
  $('#demoList').querySelectorAll('[data-demo]').forEach((button) => button.addEventListener('click', async () => {
    const response = await fetch(`/api/demos/${button.dataset.demo}`);
    const data = await response.json();
    state.demo = data.demo;
    $('#documentText').value = data.demo.text;
    $('#analysisStatus').textContent = `${data.demo.title} selected.`;
  }));
}

async function analyze() {
  const status = $('#analysisStatus');
  const button = $('#analyzeButton');
  const error = $('#workspaceError');
  error.hidden = true;
  button.disabled = true;
  status.textContent = 'Processing your document securely…';

  try {
    const response = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        persona: $('#persona').value,
        intent: $('#intent').value,
        document: {
          name: state.demo?.title || 'Pasted document',
          text: $('#documentText').value
        }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Analysis failed.');
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
  const response = await fetch('/api/auth/session');
  if (!response.ok) return window.location.assign('/login.html');
  const data = await response.json();
  $('#userEmail').textContent = data.user.displayName || data.user.email;
}

$('#logoutButton')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.assign('/login.html');
});

$('#analyzeButton')?.addEventListener('click', analyze);
loadSession();
loadDemos().catch((error) => { $('#demoList').textContent = error.message; });
loadHistory().catch(() => {});
