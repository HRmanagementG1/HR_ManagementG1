(() => {
  'use strict';
  const sharedUrl = new URL('.', document.currentScript.src);

  function getData(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (error) {
      console.warn(`Could not read ${key}.`, error);
      return null;
    }
  }

  // Shared by standalone employee pages, without starting the index router.
  window.employeeWorkspace = {
    getData,
    saveData(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    getCurrentUser() {
      return getData('site_session');
    },
    async loadEmployees() {
      try {
        const response = await fetch(new URL('../data/employees.json', sharedUrl));
        if (!response.ok) throw new Error('Could not load employees.');
        const saved = getData("site_users");
        return Array.isArray(saved) && saved.length ? saved : (await response.json()).map(employee => ({ ...employee, name: employee.name || employee.username }));
      } catch (error) {
        console.warn('Using saved employees.', error);
        return getData('site_users') || [];
      }
    }
  };

  async function loadHeader() {
    const placeholder = document.querySelector('[data-employee-header]');
    if (placeholder) {
      const response = await fetch(new URL('employee_header.html', sharedUrl));
      if (!response.ok) throw new Error(`Header request failed (${response.status}).`);
      placeholder.innerHTML = await response.text();
    }

    // Also supports the existing index router, which inserts the HTML first.
    const header = document.querySelector('.employee-header');
    if (!header) return;
    header.querySelectorAll('a[href]').forEach(link => {
      link.href = new URL(link.getAttribute('href'), sharedUrl).href;
    });
    header.querySelectorAll('img[src]').forEach(img => img.src = new URL(img.getAttribute('src'), sharedUrl));
    if (window.workspace) await window.workspace.ready;
    const user = getData('site_session');
    header.querySelector('[data-employee-name]').textContent = user?.name || user?.username || '';
    const pathname = window.location.pathname.toLowerCase();
    header.querySelectorAll('[data-employee-page]').forEach(link => {
      const isCurrent = placeholder?.dataset.activePage === link.dataset.employeePage
        || new URL(link.href).pathname.toLowerCase() === pathname;
      if (isCurrent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    header.querySelector('[data-employee-logout]').addEventListener('click', () => {
      localStorage.removeItem('site_session');
      localStorage.removeItem('loggedInUser');
    });
  }

  window.employeeHeaderReady = loadHeader().catch(error => {
    console.error('Could not load the employee header.', error);
    const placeholder = document.querySelector('[data-employee-header]');
    if (placeholder) {
      placeholder.textContent = 'Navigation could not load. Open this page through the project web server and refresh.';
      placeholder.setAttribute('role', 'alert');
    }
  });
})();
