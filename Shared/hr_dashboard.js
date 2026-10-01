(() => {
  'use strict';

  // Paths are relative to this script, so the component works in any page folder.
  const sharedUrl = new URL('.', document.currentScript.src);
  const sessionKey = 'site_session';

  function readCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(sessionKey));
    } catch (error) {
      console.warn('Could not read the login session.', error);
      return null;
    }
  }

  function getInitials(name) {
    return name.split(/\s+/)
      .slice(0, 2)
      .map(word => Array.from(word)[0])
      .join('')
      .toUpperCase();
  }

  function showCurrentUser(header) {
    const user = readCurrentUser();
    let name = 'Guest';
    let role = 'Not signed in';
    let initials = '?';

    if (user && typeof user.name === 'string' && user.name.trim()) {
      name = user.name.trim();
      initials = getInitials(name);
    }
    if (user) {
      role = user.role === 'HR' ? 'HR administrator' : user.position || user.role || 'Employee';
    }

    header.querySelector('[data-hr-user-name]').textContent = name;
    header.querySelector('[data-hr-user-role]').textContent = role;
    const avatar = header.querySelector('[data-hr-user-initials]');
    avatar.textContent = initials;
    avatar.title = `${name} — ${role}`;
  }

  function setupSidebar(sidebar, activePage) {
    // Navigation links in the HTML are relative to the Shared folder.
    sidebar.querySelectorAll('a[href]').forEach(link => {
      link.href = new URL(link.getAttribute('href'), sharedUrl).href;
    });

    sidebar.querySelectorAll('[data-hr-nav]').forEach(link => {
      if (link.dataset.hrNav === activePage) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    sidebar.querySelector('[data-hr-logout]').addEventListener('click', () => {
      localStorage.removeItem(sessionKey);
      window.location.href = new URL('../Ahmad/loginHr/LoginHr.html', sharedUrl).href;
    });
  }

  function setupHeader(header, placeholder) {
    const search = header.querySelector('#global-search');
    search.placeholder = placeholder.dataset.searchPlaceholder || 'Search workspace…';
    search.setAttribute('aria-label', placeholder.dataset.searchLabel || 'Search workspace');
    showCurrentUser(header);

    // Existing pages can point the shared search at their own filter input.
    const pageSearch = document.querySelector(placeholder.dataset.searchTarget || '#global-search');
    if (pageSearch && pageSearch !== search) {
      search.value = pageSearch.value;
      search.addEventListener('input', () => {
        pageSearch.value = search.value;
        pageSearch.dispatchEvent(new Event('input', { bubbles: true }));
      });
      pageSearch.addEventListener('input', () => {
        search.value = pageSearch.value;
      });
    }

    // Refresh the displayed user when another tab changes the login session.
    window.addEventListener('storage', event => {
      if (event.key === sessionKey || event.key === null) {
        showCurrentUser(header);
      }
    });
  }

  async function loadDashboard() {
    const sidebarPlaceholder = document.querySelector('[data-hr-dashboard-sidebar]');
    const headerPlaceholder = document.querySelector('[data-hr-dashboard-topbar]');
    if (!sidebarPlaceholder && !headerPlaceholder) return;

    const response = await fetch(new URL('hr_dashboard.html', sharedUrl));
    if (!response.ok) {
      throw new Error(`Dashboard request failed (${response.status}).`);
    }

    const template = document.createElement('template');
    template.innerHTML = await response.text();

    if (sidebarPlaceholder) {
      const sidebar = template.content.querySelector('[data-hr-sidebar]');
      const currentPath = window.location.pathname.toLowerCase();
      const currentLink = Array.from(sidebar.querySelectorAll('[data-hr-nav]')).find(link => {
        return new URL(link.getAttribute('href'), sharedUrl).pathname.toLowerCase() === currentPath;
      });
      setupSidebar(sidebar, sidebarPlaceholder.dataset.activePage || currentLink?.dataset.hrNav);
      sidebarPlaceholder.replaceChildren(sidebar);
    }
    if (headerPlaceholder) {
      const header = template.content.querySelector('[data-hr-topbar]');
      setupHeader(header, headerPlaceholder);
      headerPlaceholder.replaceChildren(header);
    }
  }

  function showLoadingError(error) {
    const placeholders = document.querySelectorAll('[data-hr-dashboard-sidebar], [data-hr-dashboard-topbar]');
    placeholders.forEach(placeholder => {
      placeholder.textContent = 'Could not load the dashboard. Open this page through the project web server and refresh.';
      placeholder.setAttribute('role', 'alert');
    });
    throw error;
  }

  // Page scripts await this before using the shared search input.
  window.hrDashboardReady = loadDashboard().catch(showLoadingError);
})();
