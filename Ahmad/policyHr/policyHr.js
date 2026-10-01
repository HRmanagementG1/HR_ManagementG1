(async () => {
  'use strict';
  const storageKey = 'workforce.policies.v1';
  const policiesUrl = new URL('../../data/policies.json', document.currentScript.src);
  try {
    await window.hrDashboardReady;
  } catch (cause) {
    console.error('Could not initialize the policy dashboard.', cause);
    return;
  }
  const get = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const categories = { everyday: 'HR & Culture', culture: 'Conduct', security: 'Security & IT', wellbeing: 'Benefits' };
  const pageSize = 6;
  let policies = [], category = 'all', page = 1, editingId = null;
  const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  function error(message) {
    get('load-error').textContent = message;
    get('load-error').hidden = !message;
  }
  function valid(items) {
    return Array.isArray(items) && items.every(item => item && typeof item.title === 'string' && item.id != null && Array.isArray(item.clauses) && item.clauses.every(clause => clause && typeof clause.title === 'string' && typeof clause.body === 'string')) && new Set(items.map(item => String(item.id))).size === items.length;
  }
  function save(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      policies = next;
      error('');
      render();
      return true;
    } catch (cause) {
      error('Could not save policies in this browser. Check that local storage is available and has free space, then try again.');
      return false;
    }
  }
  const dateLabel = policy => policy.effectiveDate || policy.meta?.match(/Effective Date:\s*([^•]+)/)?.[1]?.trim() || '—';
  function render() {
    const query = `${get('global-search').value} ${get('search').value}`.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const filtered = policies.filter(policy => (category === 'all' || policy.category === category) && terms.every(term => `${policy.title} ${policy.description || ''} ${categories[policy.category] || policy.category}`.toLowerCase().includes(term)));
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    get('categories').innerHTML = Object.entries({ all: 'All Categories', ...categories }).map(([key, label]) => `<button type="button" data-category="${key}" aria-pressed="${key === category}" class="btn rounded-pill px-3 py-1 fw-medium border-0${key === category ? '' : ' text-secondary'}" style="background-color: ${key === category ? '#18554a' : '#f6f7f4'}; color: ${key === category ? '#ffffff' : '#6c757d'}; font-size: 0.9rem;">${label}</button>`).join('');
    get('rows').innerHTML = filtered.slice(start, start + pageSize).map(policy => {
      const author = policy.author || 'HR administrator';
      const initials = author.split(/\s+/).slice(0, 2).map(part => part[0]).join('');
      const hidden = policy.hidden === true;
      return `<tr>
        <td class="py-3 border-bottom text-secondary"><div class="d-flex align-items-center gap-3"><div class="d-flex align-items-center justify-content-center rounded-3 fs-5 flex-shrink-0" style="width:40px;height:40px;background-color:#f6f7f4;color:#18554a;"><i class="bi bi-journal-text"></i></div><div><div class="fw-semibold text-dark fs-6">${escape(policy.title)}</div><div style="font-size:0.75rem;">v${escape(policy.version || '1.0')}${policy.updatedAt ? ` • Updated ${escape(policy.updatedAt)}` : ''}</div></div></div></td>
        <td class="py-3 border-bottom text-secondary"><span class="bg-light px-2 py-1 rounded" style="font-size:0.8rem;">${escape(categories[policy.category] || policy.category)}</span></td>
        <td class="py-3 border-bottom text-secondary" style="font-size:0.9rem;">${escape(dateLabel(policy))}</td>
        <td class="py-3 border-bottom"><span class="badge rounded-pill px-3 py-2 fw-medium" style="background-color:${hidden ? '#f6f7f4' : '#eaf0eb'};color:${hidden ? '#6c757d' : '#2b7a63'};">● ${hidden ? 'Hidden' : 'Visible'}</span></td>
        <td class="py-3 border-bottom"><div class="d-flex align-items-center gap-2"><span class="rounded-circle d-flex align-items-center justify-content-center fw-semibold flex-shrink-0" style="width:32px;height:32px;background-color:#f6f7f4;color:#6c757d;font-size:0.75rem;">${escape(initials)}</span><span style="font-size:0.85rem;">${escape(author)}</span></div></td>
        <td class="py-3 border-bottom text-end"><div class="d-flex justify-content-end gap-2"><button type="button" class="btn btn-sm text-secondary" data-action="visibility" data-id="${escape(policy.id)}" title="${hidden ? 'Show' : 'Hide'} policy" aria-label="${hidden ? 'Show' : 'Hide'} ${escape(policy.title)}"><i class="bi bi-eye${hidden ? '-slash' : ''}"></i></button><button type="button" class="btn btn-sm text-secondary" data-action="edit" data-id="${escape(policy.id)}" title="Edit policy" aria-label="Edit ${escape(policy.title)}"><i class="bi bi-pencil"></i></button></div></td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center text-secondary py-5">No policies match your search.</td></tr>';
    get('summary').textContent = `Showing ${filtered.length ? start + 1 : 0}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} policies (${policies.filter(policy => policy.hidden).length} hidden)`;
    get('pagination').innerHTML = `<button class="btn btn-sm text-secondary" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button><span class="rounded px-2 py-1 bg-dark text-white">${page} / ${pages}</span><button class="btn btn-sm text-secondary" data-page="${page + 1}" ${page === pages ? 'disabled' : ''}>Next</button>`;
    const lastUpdate = policies.map(policy => policy.updatedAt).filter(Boolean).sort().at(-1);
    get('updated').textContent = lastUpdate ? `Updated ${lastUpdate}` : 'Policy library';
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'border rounded-4 p-4 shadow';
  dialog.style.cssText = 'width: min(680px, 94vw); max-height: 90vh; color: #212529;';
  dialog.setAttribute('aria-labelledby', 'editor-title');
  dialog.innerHTML = `<form id="policy-form">
    <div class="d-flex justify-content-between align-items-center mb-4"><h2 id="editor-title" class="h4 fw-bold mb-0">Add New Policy</h2><button type="button" id="editor-close" class="btn-close" aria-label="Close editor"></button></div>
    <div id="editor-error" class="alert alert-danger" role="alert" hidden></div>
    <label class="form-label" for="policy-title">Policy title</label><input id="policy-title" class="form-control mb-3" required maxlength="200">
    <div class="row"><div class="col-sm-6"><label class="form-label" for="policy-category">Category</label><select id="policy-category" class="form-select mb-3">${Object.entries(categories).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></div><div class="col-sm-6"><label class="form-label" for="policy-date">Effective date</label><input id="policy-date" type="date" class="form-control mb-3" required></div></div>
    <div class="row"><div class="col-sm-6"><label class="form-label" for="policy-version">Version</label><input id="policy-version" class="form-control mb-3" required maxlength="30"></div><div class="col-sm-6"><label class="form-label" for="policy-author">Author</label><input id="policy-author" class="form-control mb-3" required maxlength="100"></div></div>
    <label class="form-label" for="policy-description">Description</label><textarea id="policy-description" class="form-control mb-3" rows="2"></textarea>
    <div class="d-flex justify-content-between align-items-center mb-2"><label class="form-label mb-0">Policy sections</label><button id="add-clause" type="button" class="btn btn-sm btn-light">+ Add section</button></div><div id="policy-clauses"></div>
    <div class="form-check my-3"><input id="policy-hidden" type="checkbox" class="form-check-input"><label class="form-check-label" for="policy-hidden">Hide this policy</label></div>
    <div class="d-flex justify-content-end gap-2 mt-4"><button type="button" id="editor-cancel" class="btn rounded-pill border px-4">Cancel</button><button type="submit" class="btn rounded-pill px-4 fw-semibold" style="background-color:#fbd36b;">Save Policy</button></div>
  </form>`;
  document.body.append(dialog);
  function addClause(clause = { title: '', body: '' }) {
    const section = document.createElement('fieldset');
    section.className = 'border rounded-3 p-3 mb-3';
    section.innerHTML = `<legend class="float-none w-auto fs-6 px-1">Section</legend><label class="d-block mb-2">Section title<input class="form-control clause-title mt-1" required value="${escape(clause.title)}"></label><label class="d-block mb-2">Content<textarea class="form-control clause-body mt-1" rows="3" required>${escape(clause.body)}</textarea></label><button type="button" class="btn btn-sm text-secondary remove-clause">Remove section</button>`;
    get('policy-clauses').append(section);
  }
  function openEditor(policy) {
    editingId = policy?.id ?? null;
    get('editor-title').textContent = policy ? 'Edit Policy' : 'Add New Policy';
    get('editor-error').hidden = true;
    get('policy-title').value = policy?.title || '';
    get('policy-category').value = policy?.category || 'everyday';
    const parsed = policy && new Date(dateLabel(policy));
    get('policy-date').value = policy?.effectiveDate || (parsed && !Number.isNaN(parsed.getTime()) ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` : today());
    get('policy-version').value = policy?.version || '1.0';
    get('policy-author').value = policy?.author || 'HR administrator';
    get('policy-description').value = policy?.description || '';
    get('policy-hidden').checked = policy?.hidden === true;
    get('policy-clauses').replaceChildren();
    (policy?.clauses.length ? policy.clauses : [{ title: '', body: '' }]).forEach(addClause);
    dialog.showModal();
  }
  ['editor-close', 'editor-cancel'].forEach(id => get(id).addEventListener('click', () => dialog.close()));
  get('add-clause').addEventListener('click', () => addClause());
  get('policy-clauses').addEventListener('click', event => {
    if (event.target.closest('.remove-clause')) event.target.closest('fieldset').remove();
  });
  get('policy-form').addEventListener('submit', event => {
    event.preventDefault();
    const clauses = Array.from(get('policy-clauses').children, section => ({ title: section.querySelector('.clause-title').value.trim(), body: section.querySelector('.clause-body').value.trim() }));
    const title = get('policy-title').value.trim(), version = get('policy-version').value.trim(), author = get('policy-author').value.trim();
    if (!title || !version || !author || !clauses.length || clauses.some(clause => !clause.title || !clause.body)) {
      get('editor-error').textContent = 'Enter a title, version, author, and at least one complete policy section.';
      get('editor-error').hidden = false;
      return;
    }
    const original = policies.find(policy => policy.id === editingId);
    const id = original?.id ?? Math.max(0, ...policies.map(policy => Number(policy.id) || 0)) + 1;
    const effectiveDate = get('policy-date').value;
    const item = { ...original, id, title, shortTitle: title, category: get('policy-category').value, effectiveDate, version, author, description: get('policy-description').value.trim(), clauses, hidden: get('policy-hidden').checked, updatedAt: today(), code: original?.code || `POL-${new Date().getFullYear()}-${id}`, fileName: original?.fileName || `Policy_${id}.pdf`, meta: `Effective Date: ${effectiveDate} • ${original?.meta?.split('•').slice(1).join('•').trim() || 'Applies to: All Employees'}`, isNew: original?.isNew ?? true };
    if (save(original ? policies.map(policy => policy.id === editingId ? item : policy) : [...policies, item])) dialog.close();
    else {
      get('editor-error').textContent = get('load-error').textContent;
      get('editor-error').hidden = false;
    }
  });
  get('add').disabled = true;
  get('add').addEventListener('click', () => openEditor());
  get('rows').addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const policy = policies.find(item => String(item.id) === button.dataset.id);
    if (!policy) return;
    if (button.dataset.action === 'edit') openEditor(policy);
    else save(policies.map(item => item === policy ? { ...item, hidden: !item.hidden, updatedAt: today() } : item));
  });
  ['search', 'global-search'].forEach(id => get(id).addEventListener('input', () => { page = 1; render(); }));
  get('categories').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (button) { category = button.dataset.category; page = 1; render(); }
  });
  get('pagination').addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button && !button.disabled) { page = Number(button.dataset.page); render(); }
  });
  get('rows').innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-5">Loading policies…</td></tr>';
  get('pagination').replaceChildren();
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      policies = JSON.parse(stored);
      if (!valid(policies)) throw new Error('Saved policy data is invalid.');
    } else {
      const response = await fetch(policiesUrl);
      if (!response.ok) throw new Error(`Policy request failed (${response.status}).`);
      const seed = await response.json();
      if (!valid(seed)) throw new Error('The policy file is invalid.');
      policies = seed;
      localStorage.setItem(storageKey, JSON.stringify(policies));
    }
    get('add').disabled = false;
    render();
  } catch (cause) {
    get('rows').innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-5">Policies unavailable</td></tr>';
    get('summary').textContent = 'Policies unavailable';
    error(`Could not load policies: ${cause.message} Ensure browser local storage is available and open this page through the project web server, then refresh. Existing saved data has been kept.`);
  }
})();
