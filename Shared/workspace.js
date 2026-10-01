(() => {
  'use strict';
  const base = new URL('.', document.currentScript?.src || new URL('/Shared/workspace.js', location.href));
  const read = (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const normalizeRole = role => String(role || '').trim().toLowerCase() === 'hr' ? 'HR' : 'Employee';
  const normalize = person => ({ ...person, id: String(person.id), name: person.name || person.username || '',
    username: person.username || person.name || '', role: normalizeRole(person.role) });
  const ready = (async () => {
    const response = await fetch(new URL('../data/employees.json', base));
    if (!response.ok) throw new Error('Could not load employees.');
    const defaults = await response.json();
    const saved = read('site_users', []);
    const users = defaults.map(person => normalize({ ...person, ...saved.find(item => String(item.id) === String(person.id) && typeof item.password === 'string') }));
    [...saved, ...read('employees', [])].forEach(person => {
      if (!users.some(item => String(item.id) === String(person.id) || item.email?.toLowerCase() === person.email?.toLowerCase())) {
        users.push(normalize(person));
      }
    });
    save('site_users', users);
    const session = read('site_session');
    if (session) {
      const account = users.find(person => session.email ? person.email?.toLowerCase() === session.email.toLowerCase() : person.id === String(session.id));
      if (account) {
        const { password, ...details } = account;
        save('site_session', details);
      }
    }
    return users;
  })();
  // Pages await ready before reading the same employee directory used by login.
  window.workspace = {
    ready, read, save, escape,
    users: () => read('site_users', []),
    session: () => { const session = read('site_session'); return session ? { ...session, role: normalizeRole(session.role) } : null; },
    requireRole(role) {
      const session = this.session();
      if (!session || session.role !== role) {
        location.replace(new URL(role === 'HR' ? '../Ahmad/loginHr/LoginHr.html' : '../Ahmad/LoginEmp/LoginEmp.html', base));
        return false;
      }
      return true;
    },
    tasks: () => read('site_tasks', []),
    saveTasks: tasks => save('site_tasks', tasks),
    updateTask(id, changes) {
      const tasks = this.tasks();
      const task = tasks.find(item => String(item.id) === String(id));
      if (!task) return null;
      Object.assign(task, changes);
      this.saveTasks(tasks);
      return task;
    }
  };
  ready.catch(error => console.error('Workspace failed to load:', error));
})();
