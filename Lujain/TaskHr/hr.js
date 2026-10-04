document.addEventListener('DOMContentLoaded', async () => {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole('HR')) return;
  document.querySelectorAll('.task-subnav a').forEach(link => { if (new URL(link.href).pathname === location.pathname) link.setAttribute('aria-current','page'); });
  const tasks = W.tasks(), employees = W.users().filter(e => e.role === 'Employee' && !e.blocked);
  const $ = id => document.getElementById(id), esc = W.escape;
  const name = id => W.users().find(e => String(e.id) === String(id))?.name || 'Unknown employee';
  const card = t => `<article class="task-row"><span class="pill priority-${esc(String(t.priority).toLowerCase())}">${esc(t.priority)} priority</span><h5>${esc(t.title)}</h5><p>${esc(name(t.employeeId))} · Due ${esc(t.dueDate)}</p><p>${esc(t.status)}</p><a class="btn-teal" href="task-details.html?id=${encodeURIComponent(t.id)}">View details</a></article>`;
  if ($('totalTasks')) {
    $('totalTasks').textContent = tasks.length;
    $('todoTasks').textContent = tasks.filter(t => ['To do','Revision Required'].includes(t.status)).length;
    $('progressTasks').textContent = tasks.filter(t => t.status === 'In progress').length;
    $('pendingTasks').textContent = tasks.filter(t => t.status === 'Submitted').length;
    $('taskList').innerHTML = tasks.slice(-4).reverse().map(card).join('') || 'No tasks yet.';
  }
  if ($('employeeSelect')) {
    $('employeeSelect').required = true;
    $('employeeSelect').innerHTML = employees.map(e => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
  }
  const editId = new URLSearchParams(location.search).get('id');
  const editingTask = editId ? W.tasks().find(task => String(task.id) === editId) : null;
  if ($('taskForm') && editId) {
    if (!editingTask) {
      $('taskForm').hidden = true;
      document.querySelector('.topbar h1').textContent = 'Task not found';
      return;
    }
    const form = $('taskForm');
    const assigned = W.users().find(employee => String(employee.id) === String(editingTask.employeeId));
    if (assigned && !employees.some(employee => employee.id === assigned.id)) {
      employees.push(assigned);
      $('employeeSelect').add(new Option(assigned.name, assigned.id));
    }
    ['title', 'employeeId', 'description', 'priority', 'dueDate'].forEach(key => {
      const field = form.elements[key];
      if (key === 'priority' && editingTask[key] === 'Normal') field.value = 'Medium';
      else field.value = editingTask[key] || '';
    });
    form.elements.visibility.value = editingTask.visibleToEmployee === false ? 'hidden' : 'visible';
    document.querySelector('.topbar h1').textContent = 'Edit task';
    form.querySelector('button').textContent = 'Save changes';
    document.title = 'Edit Task | Wanderly';
  }
  if ($('taskForm')) $('taskForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!W.requireRole('HR') || !event.target.reportValidity()) return;
    const data = {};
    ['title', 'employeeId', 'description', 'priority', 'dueDate', 'visibility'].forEach(key => {
      data[key] = event.target.elements[key].value;
    });
    if (!employees.some(e => String(e.id) === data.employeeId) || !data.title.trim() || !data.description.trim()) return;
    if (editId) {
      if (!W.tasks().some(task => String(task.id) === editId)) return;
      W.updateTask(editId, {
        title: data.title.trim(),
        description: data.description.trim(),
        employeeId: data.employeeId,
        priority: data.priority,
        dueDate: data.dueDate,
        visibleToEmployee: data.visibility !== 'hidden'
      });
    } else {
      const newTask = {
        ...data,
        title: data.title.trim(),
        description: data.description.trim(),
        id: crypto.randomUUID(),
        createdBy: W.session().id,
        visibleToEmployee: data.visibility !== 'hidden',
        status: 'To do',
        submission: '',
        feedback: '',
        comment: ''
      };
      W.saveTasks([...W.tasks(), newTask]);
    }
    location.href = 'all-tasks.html';
  });
  if ($('allTasksBody')) {
    const department = id => W.users().find(e => String(e.id) === String(id))?.department || '';
    [...new Set(employees.map(e => e.department).filter(Boolean))].sort().forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; $('departmentFilter').append(option); });
    const visibility = t => `<button type="button" class="visibility-toggle ${t.visibleToEmployee === false ? 'is-hidden' : ''}" data-visibility="${esc(t.id)}" aria-label="${t.visibleToEmployee === false ? 'Show' : 'Hide'} ${esc(t.title)} for employee">${t.visibleToEmployee === false ? '◌ HR only' : '● Visible'}</button>`;
    const render = () => {
      const all = W.tasks();
      $('activeTaskCount').textContent = all.filter(t => !['Done','Approved'].includes(t.status)).length;
      $('pendingTaskCount').textContent = all.filter(t => ['To do','Revision Required'].includes(t.status)).length;
      $('progressTaskCount').textContent = all.filter(t => t.status === 'In progress').length;
      $('hiddenTaskCount').textContent = all.filter(t => t.visibleToEmployee === false).length;
      const query = $('searchTasks').value.trim().toLowerCase();
      const filtered = all.filter(t => `${t.title} ${name(t.employeeId)} ${t.status}`.toLowerCase().includes(query) && (!$('departmentFilter').value || department(t.employeeId) === $('departmentFilter').value) && (!$('priorityFilter').value || t.priority === $('priorityFilter').value) && (!$('visibilityFilter').value || ($('visibilityFilter').value === 'hidden') === (t.visibleToEmployee === false)));
      $('allTasksBody').innerHTML = filtered.map(t => `<tr><td><strong>${esc(t.title)}</strong><small>${esc(t.description)}</small></td><td>${esc(name(t.employeeId))}<small>${esc(department(t.employeeId))}</small></td><td>${esc(t.dueDate)}<br><span class="priority-badge ${esc(String(t.priority).toLowerCase())}">${esc(t.priority)} priority</span></td><td>${visibility(t)}</td><td><span class="status-badge">${esc(t.status)}</span></td><td><a class="details-link" href="task-details.html?id=${encodeURIComponent(t.id)}">Details</a> <a class="details-link" href="add-task.html?id=${encodeURIComponent(t.id)}">Edit</a></td></tr>`).join('') || '<tr><td colspan="6" class="empty-tasks">No tasks match your filters. Create a task to get started.</td></tr>';
      $('taskBoard').innerHTML = ['To do','In progress','Submitted','Approved'].map(status => `<section><h3>${status}</h3>${filtered.filter(t => (t.status === 'Revision Required' ? 'To do' : t.status === 'Done' ? 'Approved' : t.status) === status).map(t => `<article><span class="priority-badge ${esc(String(t.priority).toLowerCase())}">${esc(t.priority)}</span><h4>${esc(t.title)}</h4><p>${esc(name(t.employeeId))}</p>${visibility(t)}<a href="task-details.html?id=${encodeURIComponent(t.id)}">Details →</a></article>`).join('') || '<p class="muted">No tasks</p>'}</section>`).join('');
    };
    render();
    ['searchTasks','departmentFilter','priorityFilter','visibilityFilter'].forEach(id => $(id).addEventListener(id === 'searchTasks' ? 'input' : 'change',render));
    document.addEventListener('click',event => {
      const button = event.target.closest('[data-visibility]'); if (!button) return;
      const task = W.tasks().find(t => String(t.id) === button.dataset.visibility); if (!task) return;
      W.updateTask(task.id,{visibleToEmployee:task.visibleToEmployee === false}); render();
    });
    const switchView = board => { $('taskBoard').hidden = !board; document.querySelector('.table-wrap').hidden = board; $('boardView').setAttribute('aria-pressed',String(board)); $('tableView').setAttribute('aria-pressed',String(!board)); };
    $('boardView').onclick = () => switchView(true); $('tableView').onclick = () => switchView(false);
  }
  const task = tasks.find(t => String(t.id) === new URLSearchParams(location.search).get('id'));
  if ($('taskDetail')) $('taskDetail').innerHTML = task ? `<h3>${esc(task.title)}</h3><p>${esc(task.description)}</p><p>Employee: ${esc(name(task.employeeId))}</p><p>Priority: ${esc(task.priority)}</p><p>Status: ${esc(task.status)}</p><p>Due: ${esc(task.dueDate)}</p><p>Submission: ${esc(task.submission || 'Not submitted')}</p><p>Employee comment: ${esc(task.comment)}</p><p>HR feedback: ${esc(task.feedback)}</p>${task.status === 'Submitted' ? `<a class="btn-teal" href="review-feedback.html?id=${encodeURIComponent(task.id)}">Review / feedback</a>` : ''}` : 'Task not found.';
  if ($('trackingList')) $('trackingList').innerHTML = employees.map(e => {
    const own = tasks.filter(t => String(t.employeeId) === String(e.id));
    const pct = own.length ? Math.round(own.filter(t => ['Done','Approved'].includes(t.status)).length / own.length * 100) : 0;
    return `<article class="card"><h5>${esc(e.name)}</h5><p>${own.length} tasks</p><div class="progress"><div class="progress-bar" style="width:${pct}%;background:var(--teal)"></div></div><p>${pct}% completed</p></article>`;
  }).join('') || '<p>No employees yet.</p>';
  if ($('submissionList')) $('submissionList').innerHTML = tasks.filter(t => t.status === 'Submitted').map(card).join('') || '<p>No submissions waiting.</p>';
  if ($('reviewTask')) {
    $('reviewTask').innerHTML = task ? `<h4>${esc(task.title)}</h4><p>Employee: ${esc(name(task.employeeId))}</p><p>Submission: ${esc(task.submission || 'Not submitted')}</p><p>Employee comment: ${esc(task.comment)}</p><p>Current feedback: ${esc(task.feedback || '—')}</p>` : 'Task not found.';
    $('reviewForm').elements.feedback.value = task?.feedback || '';
    if (task?.status !== 'Submitted') $('reviewForm').querySelectorAll('button,textarea').forEach(el => el.disabled = true);
    $('reviewForm').addEventListener('submit', event => event.preventDefault());
  }
  for (const id of ['taskDetail','reviewTask']) if ($(id) && task) {
    const files = document.createElement('div'); files.className = 'attachment-list'; $(id).append(files);
    window.taskFiles.render(files, task.attachments);
  }
  if ($('taskDetail') && task) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn-teal';
    button.textContent = task.visibleToEmployee === false ? 'Show to employee' : 'Hide from employee';
    button.onclick = () => { const latest = W.tasks().find(t => t.id === task.id); W.updateTask(task.id,{visibleToEmployee:latest.visibleToEmployee === false}); location.reload(); };
    $('taskDetail').append(button);
  }
  const review = status => {
    const latest = W.tasks().find(t => String(t.id) === String(task?.id));
    if (!latest || latest.status !== 'Submitted') return;
    const feedback = $('reviewForm').elements.feedback.value.trim();
    if (status === 'Revision Required' && !feedback) { $('reviewForm').reportValidity(); return; }
    W.updateTask(task.id, {feedback,status,reviewedAt:new Date().toISOString()});
    location.href = 'submission-review.html';
  };
  if ($('approveBtn')) $('approveBtn').onclick = () => review('Approved');
  if ($('reviseBtn')) $('reviseBtn').onclick = () => review('Revision Required');
});
