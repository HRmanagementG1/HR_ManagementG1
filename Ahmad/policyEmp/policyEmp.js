(async () => {
'use strict';
const root = document.getElementById('employee-policies');
  if (!root) return;
  const get = id => root.querySelector(`#${id}`);
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  // Resolve from this script so the page can be opened from any application route.
  const policiesUrl = new URL('../../data/policies.json', document.currentScript.src);
  const storageKey = 'workforce.policies.v1';
  function employeePolicies(items) {
    if (!Array.isArray(items) || !items.every(item => item && typeof item.title === 'string' && item.id != null && Array.isArray(item.clauses) && item.clauses.every(clause => clause && typeof clause.title === 'string' && typeof clause.body === 'string')) || new Set(items.map(item => String(item.id))).size !== items.length) {
      throw new Error('Invalid saved policy data');
    }
    return items.filter(policy => policy.hidden !== true);
  }
  let policies;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      policies = employeePolicies(JSON.parse(stored));
    } else {
      const response = await fetch(policiesUrl);
      if (!response.ok) throw new Error('Policy request failed: ' + response.status);
      const seed = await response.json();
      policies = employeePolicies(seed);
      localStorage.setItem(storageKey, JSON.stringify(seed));
    }
  } catch (error) {
    console.error('Could not load policies', error);
    get('total-count').textContent = '—';
    get('new-count').textContent = '0';
    get('results-count').textContent = 'Policies unavailable';
    get('empty-state').hidden = false;
    get('empty-state').innerHTML = '<h2>Policies could not be loaded</h2><p>Please refresh the page to try again.</p>';
    get('reader').hidden = true;
    get('policy-search').disabled = true;
    get('show-new').disabled = true;
    return;
  }
  const categories = {all:'All policies',new:'New policies',everyday:'Everyday work',wellbeing:'Wellbeing & Leave',security:'Security & Data',culture:'Culture & Conduct'};
  let category = 'all';
  let selected = policies[0]?.id;
  let statusTimer;
  function renderCounts() {
  const dates = policies.map(policy => policy.updatedAt || policy.effectiveDate || policy.meta?.match(/Effective Date: ([^•]+)/)?.[1]?.trim()).filter(value => value && !Number.isNaN(Date.parse(value)));
  dates.sort((a, b) => Date.parse(b) - Date.parse(a));
  get("latest-update").textContent = dates.length ? "Updated " + new Date(dates[0]).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "No update date available";
  get('total-count').textContent = policies.length;
  get('new-count').textContent = policies.filter(policy => policy.isNew).length;
  get('filters').innerHTML = Object.entries(categories).map(([key, label]) => `<button type="button" class="btn filter-pill${key === 'all' ? ' active' : ''}" data-category="${key}" aria-pressed="${key === 'all'}">${escape(label)} (${policies.filter(policy => key === 'all' || (key === 'new' ? policy.isNew : policy.category === key)).length})</button>`).join('');
  }

  function visiblePolicies() {
    const query = get('policy-search').value.trim().toLowerCase();
    return policies.filter(policy => (category === 'all' || (category === 'new' ? policy.isNew : policy.category === category)) && [policy.title, policy.description, categories[policy.category], ...policy.clauses.flatMap(clause => [clause.title, clause.body])].join(' ').toLowerCase().includes(query));
  }

  function render() {
    renderCounts();
    const visible = visiblePolicies();
    get('download-selected').disabled = visible.length === 0;
    get('print-policy').disabled = visible.length === 0;
    if (visible.length && !visible.some(policy => policy.id === selected)) selected = visible[0].id;
    get('policy-list').innerHTML = visible.map(policy => `<article class="policy-card${selected === policy.id ? ' selected' : ''}">
      <button type="button" class="card-content" data-select="${policy.id}" aria-pressed="${selected === policy.id}">
        <div class="d-flex align-items-start gap-3 justify-content-between"><div>
          <div class="d-flex flex-wrap align-items-center gap-2"><span class="category-tag ${escape(policy.category)}">${escape(categories[policy.category])}</span><small>${policy.updatedAt ? `Updated ${escape(policy.updatedAt)}` : 'Updated Sep 2026'}</small>${policy.isNew ? '<span class="new-tag">New</span>' : ''}</div>
          <h3>${escape(policy.shortTitle)}</h3><p>${escape(policy.description)}</p>
        </div>${selected === policy.id ? '<span class="selection-check" aria-hidden="true">✓</span>' : ''}</div>
      </button>
      <div class="card-actions d-flex flex-wrap justify-content-between align-items-center gap-2"><small>PDF · v${escape(policy.version)}</small><div class="d-flex gap-2"><button type="button" class="btn btn-sm btn-light" data-select="${policy.id}" data-focus-reader>View in reader</button><button type="button" class="btn btn-sm btn-primary-policy" data-download="${policy.id}" aria-label="Download ${escape(policy.shortTitle)} PDF">↓ PDF</button></div></div>
    </article>`).join('');
    get('empty-state').hidden = visible.length !== 0;
    get('reader').hidden = visible.length === 0;
    get('results-count').textContent = `Showing ${visible.length} ${visible.length === 1 ? 'policy' : 'policies'}`;
    root.querySelectorAll('[data-category]').forEach(button => {
      button.classList.toggle('active', button.dataset.category === category);
      button.setAttribute('aria-pressed', button.dataset.category === category);
    });
    if (visible.length) renderReader();
  }

  function renderReader() {
    const policy = policies.find(item => item.id === selected);
    get('doc-code').textContent = policy.code;
    get('doc-title').textContent = policy.title;
    get('doc-meta').textContent = policy.meta;
    get('doc-clauses').innerHTML = policy.clauses.map((clause, index) => `<div class="clause"><span class="clause-number">${index + 1}</span><div><h3>${escape(clause.title)}</h3><p>${escape(clause.body)}</p></div></div>`).join('');
  }

  function status(message) {
    clearTimeout(statusTimer);
    get('policy-status').textContent = message;
    get('policy-status').hidden = false;
    statusTimer = setTimeout(() => { get('policy-status').hidden = true; }, 4500);
  }

  function download(items, filename) {
    if (!window.jspdf?.jsPDF) {
      status('The PDF library could not load. Check your connection and try again, or use Print to save as PDF.');
      return;
    }
    try {
      const pdf = new window.jspdf.jsPDF();
      items.forEach((policy, index) => {
        if (index) pdf.addPage();
        let y = 24;
        const write = (text, size, bold = false) => {
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(size);
          const lines = pdf.splitTextToSize(text.replace(/[–—]/g, '-').replace(/•/g, '|'), 170);
          lines.forEach(line => {
            if (y > 270) { pdf.addPage(); y = 24; }
            pdf.text(line, 20, y);
            y += size * 0.5;
          });
          y += 5;
        };
        pdf.setTextColor(0, 57, 58);
        write('WANDERLY / EMPLOYEE POLICIES', 11, true);
        write(policy.code, 10);
        write(policy.title, 20, true);
        pdf.setTextColor(63, 73, 72);
        write(policy.meta, 10);
        policy.clauses.forEach((clause, clauseIndex) => {
          write(`${clauseIndex + 1}. ${clause.title}`, 12, true);
          write(clause.body, 11);
        });
        write('Demonstration content. Requires HR approval before use.', 9);
      });
      const count = pdf.getNumberOfPages();
      for (let page = 1; page <= count; page++) {
        pdf.setPage(page);
        pdf.setFontSize(9);
        pdf.text(`Wanderly | Page ${page} of ${count}`, 20, 287);
      }
      pdf.save(filename);
      status(`PDF ready: ${filename}`);
    } catch (error) {
      console.error('PDF generation failed', error);
      status('Could not create the PDF. Please try again or use Print to save as PDF.');
    }
  }

  get('policy-search').addEventListener('input', render);
  get('filters').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    render();
  });
  get('policy-list').addEventListener('click', event => {
    const selectButton = event.target.closest('[data-select]');
    const downloadButton = event.target.closest('[data-download]');
    if (selectButton) {
      selected = Number(selectButton.dataset.select);
      render();
      // Restore keyboard focus after replacing the list markup.
      const selector = `[data-select="${selected}"]${selectButton.hasAttribute('data-focus-reader') ? '[data-focus-reader]' : '.card-content'}`;
      get('policy-list').querySelector(selector)?.focus({preventScroll:true});
      if (selectButton.hasAttribute('data-focus-reader')) {
        get('doc-title').tabIndex = -1;
        get('doc-title').focus({preventScroll:true});
        get('reader').scrollIntoView({behavior:'smooth',block:'nearest'});
      }
    }
    if (downloadButton) {
      const policy = policies.find(item => item.id === Number(downloadButton.dataset.download));
      download([policy], policy.fileName);
    }
  });
  get('show-new').addEventListener('click', () => { category = 'new'; get('policy-search').value = ''; render(); });
  get('reset-filters').addEventListener('click', () => { category = 'all'; get('policy-search').value = ''; render(); get('policy-search').focus(); });
  get('download-selected').addEventListener('click', () => { const policy = policies.find(item => item.id === selected); if (policy) download([policy], policy.fileName); });
  get('print-policy').addEventListener('click', () => window.print());
  window.addEventListener('storage', event => {
    if (event.storageArea !== localStorage || (event.key !== storageKey && event.key !== null)) return;
    try {
      policies = event.newValue === null ? [] : employeePolicies(JSON.parse(event.newValue));
      render();
    } catch (error) {
      policies = [];
      render();
      status('Saved policies could not be read. Please check the HR policy library and refresh.');
    }
  });
  render();
})();
