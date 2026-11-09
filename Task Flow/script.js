/* TaskFlow – To-Do List Management System
   Sections: 1) Helpers  2) State & storage  3) Filtering  4) Rendering  5) Actions  6) Events */
(() => {
  'use strict';

  /* ---------- 1) Helpers ---------- */
  const KEY = 'taskflow.tasks';
  const THEME_KEY = 'taskflow.theme';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return fmt(d); };
  const todayStr = () => dayOffset(0);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CATEGORY_ICON = { Personal: 'fa-user', Work: 'fa-briefcase', Study: 'fa-book-open', Other: 'fa-ellipsis' };
  const CATEGORIES = Object.keys(CATEGORY_ICON);

  /* ---------- 2) State & storage ---------- */
  const state = {
    tasks: loadTasks(),
    view: 'dashboard',
    filter: 'all',
    category: 'All',
    search: '',
    sort: 'recent',
    editId: null,
    deleteId: null,
    confirmAction: null,
  };

  function loadTasks() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return seedTasks();          // first visit: show a few examples
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }

  function seedTasks() {
    const make = (title, description, priority, category, due, completed = false) =>
      ({ id: uid(), title, description, priority, category, due, completed, createdAt: Date.now() });
    const tasks = [
      make('Finish portfolio project', 'Polish the README and add screenshots.', 'High', 'Work', dayOffset(0)),
      make('Revise JavaScript arrays', 'Practice map, filter and reduce.', 'Medium', 'Study', dayOffset(2)),
      make('Buy groceries', 'Fruits, rice and milk.', 'Low', 'Personal', dayOffset(-1)),
      make('Book dentist appointment', '', 'Medium', 'Personal', dayOffset(5)),
      make('Set up GitHub profile', 'Add a profile photo and bio.', 'Low', 'Other', dayOffset(-3), true),
    ];
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch { /* ignore */ }
    return tasks;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state.tasks)); }
    catch { toast('Could not save – browser storage is unavailable.', 'error'); }
  }

  /* ---------- 3) Filtering & sorting ---------- */
  const isOverdue = (t) => !t.completed && !!t.due && t.due < todayStr();
  const FILTERS = {
    all: () => true,
    today: (t) => t.due === todayStr(),
    upcoming: (t) => !t.completed && !!t.due && t.due > todayStr(),
    completed: (t) => t.completed,
    pending: (t) => !t.completed,
    overdue: isOverdue,
  };
  const VIEWS = {
    dashboard: { filter: 'all', title: 'Your tasks' },
    all: { filter: 'all', title: 'All tasks' },
    today: { filter: 'today', title: "Today's tasks" },
    upcoming: { filter: 'upcoming', title: 'Upcoming tasks' },
    completed: { filter: 'completed', title: 'Completed tasks' },
    categories: { filter: 'all', title: 'Tasks by category' },
    settings: { title: 'Settings' },
  };
  const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

  function visibleTasks() {
    let list = state.tasks.filter(FILTERS[state.filter]);
    if (state.view === 'categories' && state.category !== 'All') list = list.filter((t) => t.category === state.category);
    const q = state.search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
    const byDue = (a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99');
    if (state.sort === 'due') list.sort(byDue);
    else if (state.sort === 'priority') list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b));
    else list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }

  /* ---------- 4) Rendering ---------- */
  function dueLabel(t) {
    if (!t.due) return 'No due date';
    if (t.due === todayStr()) return 'Today';
    if (t.due === dayOffset(1)) return 'Tomorrow';
    return new Date(t.due + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function taskCard(t) {
    const late = isOverdue(t);
    return `
      <li class="task ${t.completed ? 'done' : ''} ${late ? 'late' : ''}" data-id="${t.id}">
        <button class="check" data-act="toggle" aria-pressed="${t.completed}" aria-label="${t.completed ? 'Mark as pending' : 'Mark as completed'}"><i class="fa-solid fa-check"></i></button>
        <div class="body">
          <h3>${esc(t.title)}</h3>
          ${t.description ? `<p>${esc(t.description)}</p>` : ''}
          <div class="meta">
            <span class="badge ${t.priority.toLowerCase()}">${t.priority}</span>
            <span><i class="fa-solid ${CATEGORY_ICON[t.category] || 'fa-ellipsis'}"></i>${esc(t.category)}</span>
            <span class="due"><i class="fa-regular fa-calendar"></i>${dueLabel(t)}</span>
            ${late ? '<span class="badge over">Overdue</span>' : ''}
          </div>
        </div>
        <div class="acts">
          <button class="icon-btn" data-act="edit" aria-label="Edit task"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn danger" data-act="delete" aria-label="Delete task"><i class="fa-solid fa-trash"></i></button>
        </div>
      </li>`;
  }

  function emptyState() {
    if (state.tasks.length === 0) {
      return `<li class="empty"><i class="fa-regular fa-clipboard"></i><h3>No tasks yet</h3><p>Add your first task and start getting things done.</p><button class="btn primary" data-act="add"><i class="fa-solid fa-plus"></i>Add task</button></li>`;
    }
    return `<li class="empty"><i class="fa-solid fa-magnifying-glass"></i><h3>Nothing to show here</h3><p>No tasks match this view. Try another filter or clear the search.</p></li>`;
  }

  function renderStats() {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    $('#statTotal').textContent = total;
    $('#statDone').textContent = done;
    $('#statPending').textContent = total - done;
    $('#statOverdue').textContent = state.tasks.filter(isOverdue).length;
    $('#progressPct').textContent = pct + '%';
    $('#progressFill').style.width = pct + '%';
    $('#progressBar').setAttribute('aria-valuenow', pct);
    $('#progressText').textContent = total
      ? `${done} of ${total} tasks completed. ${pct === 100 ? 'Great job, everything is done!' : 'Keep going!'}`
      : 'Add a task to start tracking your progress.';
  }

  function renderCategories() {
    const card = (name, icon, list) => `
      <button class="cat-card ${state.category === name ? 'active' : ''}" data-cat="${name}">
        <i class="fa-solid ${icon}"></i><strong>${name}</strong>
        <span>${list.filter((t) => !t.completed).length} pending · ${list.length} total</span>
      </button>`;
    $('#categoryGrid').innerHTML = card('All', 'fa-layer-group', state.tasks) +
      CATEGORIES.map((c) => card(c, CATEGORY_ICON[c], state.tasks.filter((t) => t.category === c))).join('');
  }

  function render() {
    const v = state.view;
    const hour = new Date().getHours();
    $('#greeting').textContent = (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening') + ', welcome back!';
    $('#todayDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · Here is your day at a glance.';

    $('#statsSection').hidden = v !== 'dashboard';
    $('#categorySection').hidden = v !== 'categories';
    $('#settingsSection').hidden = v !== 'settings';
    $('#tasksSection').hidden = v === 'settings';
    $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
    $$('.chip').forEach((b) => b.classList.toggle('active', b.dataset.filter === state.filter));

    if (v === 'dashboard') renderStats();
    if (v === 'categories') renderCategories();
    if (v === 'settings') return;

    const list = visibleTasks();
    $('#listTitle').textContent = VIEWS[v].title;
    $('#listCount').textContent = `${list.length} ${list.length === 1 ? 'task' : 'tasks'}`;
    $('#taskList').innerHTML = list.length ? list.map(taskCard).join('') : emptyState();
  }

  function toast(message, type = 'success') {
    const icon = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' }[type];
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${esc(message)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  /* ---------- 5) Actions ---------- */
  function openTaskDialog(id = null) {
    state.editId = id;
    const t = id ? state.tasks.find((x) => x.id === id) : null;
    $('#dialogTitle').textContent = t ? 'Edit task' : 'Add task';
    $('#saveBtn').textContent = t ? 'Save changes' : 'Add task';
    $('#fTitle').value = t ? t.title : '';
    $('#fDesc').value = t ? t.description : '';
    $('#fPriority').value = t ? t.priority : 'Medium';
    $('#fCategory').value = t ? t.category : 'Personal';
    $('#fDue').value = t ? t.due : todayStr();
    clearErrors();
    $('#taskDialog').showModal();
    $('#fTitle').focus();
  }

  function clearErrors() {
    $('#errTitle').textContent = '';
    $('#errDue').textContent = '';
    $('#fTitle').classList.remove('invalid');
    $('#fDue').classList.remove('invalid');
  }

  function submitTask(e) {
    e.preventDefault();
    clearErrors();
    const title = $('#fTitle').value.trim();
    const due = $('#fDue').value;
    let ok = true;
    if (!title) { $('#errTitle').textContent = 'Please enter a task title.'; $('#fTitle').classList.add('invalid'); ok = false; }
    else if (title.length < 3) { $('#errTitle').textContent = 'Title must be at least 3 characters.'; $('#fTitle').classList.add('invalid'); ok = false; }
    if (!due) { $('#errDue').textContent = 'Please choose a due date.'; $('#fDue').classList.add('invalid'); ok = false; }
    if (!ok) return;

    const data = {
      title,
      description: $('#fDesc').value.trim(),
      priority: $('#fPriority').value,
      category: $('#fCategory').value,
      due,
    };
    if (state.editId) {
      Object.assign(state.tasks.find((t) => t.id === state.editId), data);
      toast('Task updated successfully.');
    } else {
      state.tasks.push({ id: uid(), completed: false, createdAt: Date.now(), ...data });
      toast('Task added successfully.');
    }
    save();
    $('#taskDialog').close();
    render();
  }

  function toggleTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    toast(t.completed ? 'Task marked as completed.' : 'Task marked as pending.', 'info');
    render();
  }

  function askConfirm({ title, text, button, action }) {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmYes').textContent = button;
    state.confirmAction = action;
    $('#confirmDialog').showModal();
  }

  function deleteTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    askConfirm({
      title: 'Delete this task?',
      text: `"${t.title}" will be permanently removed.`,
      button: 'Delete',
      action: () => {
        state.tasks = state.tasks.filter((x) => x.id !== id);
        save(); render(); toast('Task deleted successfully.');
      },
    });
  }

  function clearCompleted() {
    const count = state.tasks.filter((t) => t.completed).length;
    if (!count) { toast('There are no completed tasks to clear.', 'info'); return; }
    askConfirm({
      title: 'Clear completed tasks?',
      text: `${count} completed ${count === 1 ? 'task' : 'tasks'} will be permanently removed.`,
      button: 'Clear',
      action: () => {
        state.tasks = state.tasks.filter((t) => !t.completed);
        save(); render(); toast('Completed tasks cleared.');
      },
    });
  }

  function resetAll() {
    if (!state.tasks.length) { toast('There is no data to delete.', 'info'); return; }
    askConfirm({
      title: 'Delete all tasks?',
      text: 'Every task will be permanently removed. This cannot be undone.',
      button: 'Delete all',
      action: () => { state.tasks = []; save(); render(); toast('All tasks deleted.'); },
    });
  }

  function setView(view) {
    state.view = view;
    if (VIEWS[view].filter) state.filter = VIEWS[view].filter;
    closeSidebar();
    render();
    window.scrollTo({ top: 0 });
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    $('#themeBtn i').className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }
  const toggleTheme = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

  const openSidebar = () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); };
  const closeSidebar = () => { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); };

  /* ---------- 6) Events (each registered once) ---------- */
  function init() {
    let savedTheme = 'light';
    try { savedTheme = localStorage.getItem(THEME_KEY) || 'light'; } catch { /* ignore */ }
    applyTheme(savedTheme);

    $('#nav').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (btn) setView(btn.dataset.view);
    });
    $('#chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      state.filter = chip.dataset.filter;
      if (['today', 'upcoming', 'completed'].includes(state.view)) state.view = 'all';
      render();
    });
    $('#categoryGrid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-cat]');
      if (card) { state.category = card.dataset.cat; render(); }
    });
    $('#taskList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const id = btn.closest('.task')?.dataset.id;
      if (btn.dataset.act === 'add') openTaskDialog();
      else if (btn.dataset.act === 'toggle') toggleTask(id);
      else if (btn.dataset.act === 'edit') openTaskDialog(id);
      else if (btn.dataset.act === 'delete') deleteTask(id);
    });

    $('#searchInput').addEventListener('input', (e) => { state.search = e.target.value; render(); });
    $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
    $('#addBtn').addEventListener('click', () => openTaskDialog());
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#themeBtn2').addEventListener('click', toggleTheme);
    $('#clearDoneBtn').addEventListener('click', clearCompleted);
    $('#clearDoneBtn2').addEventListener('click', clearCompleted);
    $('#resetBtn').addEventListener('click', resetAll);
    $('#menuBtn').addEventListener('click', openSidebar);
    $('#scrim').addEventListener('click', closeSidebar);

    $('#taskForm').addEventListener('submit', submitTask);
    $('#taskDialog').addEventListener('click', (e) => {
      if (e.target === e.currentTarget || e.target.closest('[data-close]')) $('#taskDialog').close();
    });
    $('#confirmNo').addEventListener('click', () => $('#confirmDialog').close());
    $('#confirmYes').addEventListener('click', () => {
      const action = state.confirmAction;
      state.confirmAction = null;
      $('#confirmDialog').close();
      if (action) action();
    });
    $('#confirmDialog').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

    render();
  }

  init();
})();
