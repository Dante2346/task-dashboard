document.addEventListener('DOMContentLoaded', () => {
  // ====== Update footer year ======
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ====== Navigation Toggle ======
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-list');

  if (toggle && menu) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent immediate outside click closing
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('active');
      toggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (
        menu.classList.contains('active') &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ====== Theme Toggle ======
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme');

  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeToggle) themeToggle.textContent = '🌙';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggle.textContent = isLight ? '🌙' : '☀️';
    });
  }

  // ====== Collapsible Projects ======
  const projectToggles = document.querySelectorAll('.project-toggle');
  projectToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling;
      const isOpen = content.classList.contains('open');

      // Close all other open projects
      document.querySelectorAll('.project-content.open').forEach(openContent => {
        openContent.classList.remove('open');
      });

      // Toggle the clicked one
      if (!isOpen) content.classList.add('open');
    });
  });

  // ====== Task Manager (CRUD + localStorage) ======
  class TaskManager {
    constructor(listEl, counters = {}) {
      this.listEl = listEl;
      this.counters = counters;
      this.storageKey = 'task_manager_tasks';
      this.tasks = this.load() || [];
      this.render();
    }

    load() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Failed reading tasks', e);
        return [];
      }
    }

    save() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    addTask(title, desc) {
      if (!title || !title.trim()) return;
      const task = {
        id: Date.now().toString(),
        title: title.trim(),
        desc: (desc || '').trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      this.tasks.unshift(task);
      this.save();
      this.render();
    }

    updateTask(id, fields = {}) {
      const task = this.tasks.find(t => t.id === id);
      if (!task) return;
      Object.assign(task, fields);
      this.save();
      this.render();
    }

    toggleComplete(id) {
      const task = this.tasks.find(t => t.id === id);
      if (!task) return;
      task.completed = !task.completed;
      this.save();
      this.render();
    }

    deleteTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.save();
      this.render();
    }

    clearAll() {
      this.tasks = [];
      this.save();
      this.render();
    }

    getCounts() {
      const total = this.tasks.length;
      const completed = this.tasks.filter(t => t.completed).length;
      return { total, completed };
    }

    createTaskElement(task) {
      const li = document.createElement('li');
      li.className = 'task-item';
      if (task.completed) li.classList.add('completed');
      li.dataset.id = task.id;

      // Checkbox
      const cbWrap = document.createElement('div');
      cbWrap.className = 'task-checkbox';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.completed;
      checkbox.addEventListener('change', () => this.toggleComplete(task.id));
      cbWrap.appendChild(checkbox);

      // Body
      const body = document.createElement('div');
      body.className = 'task-body';
      const title = document.createElement('div');
      title.className = 'task-title';
      title.textContent = task.title;
      const desc = document.createElement('div');
      desc.className = 'task-desc';
      desc.textContent = task.desc || '';
      body.appendChild(title);
      body.appendChild(desc);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.title = 'Edit';
      editBtn.innerHTML = '✏️';
      editBtn.addEventListener('click', () => this.openEdit(li, task));
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn';
      delBtn.title = 'Delete';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', () => {
        if (confirm('Delete this task?')) this.deleteTask(task.id);
      });
      actions.appendChild(delBtn);

      li.appendChild(cbWrap);
      li.appendChild(body);
      li.appendChild(actions);

      return li;
    }

    openEdit(li, task) {
      li.classList.add('editing');
      li.innerHTML = '';

      const cbWrap = document.createElement('div');
      cbWrap.className = 'task-checkbox';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.completed;
      checkbox.addEventListener('change', () => this.toggleComplete(task.id));
      cbWrap.appendChild(checkbox);

      const body = document.createElement('div');
      body.className = 'task-body';
      const titleInput = document.createElement('input');
      titleInput.value = task.title;
      const descInput = document.createElement('textarea');
      descInput.value = task.desc || '';
      descInput.rows = 2;
      body.appendChild(titleInput);
      body.appendChild(descInput);

      const actions = document.createElement('div');
      actions.className = 'task-actions';
      const saveBtn = document.createElement('button');
      saveBtn.className = 'icon-btn';
      saveBtn.textContent = '💾';
      saveBtn.addEventListener('click', () => {
        const newTitle = titleInput.value.trim();
        const newDesc = descInput.value.trim();
        if (!newTitle) return alert('Title cannot be empty');
        this.updateTask(task.id, { title: newTitle, desc: newDesc });
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'icon-btn';
      cancelBtn.textContent = '✖';
      cancelBtn.addEventListener('click', () => this.render());

      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);

      li.appendChild(cbWrap);
      li.appendChild(body);
      li.appendChild(actions);
      titleInput.focus();
    }

    render() {
      this.listEl.innerHTML = '';
      this.tasks.forEach(task => {
        const el = this.createTaskElement(task);
        this.listEl.appendChild(el);
      });

      if (this.counters.total)
        this.counters.total.textContent = this.getCounts().total;
      if (this.counters.completed)
        this.counters.completed.textContent = this.getCounts().completed;
    }
  }

  // ====== Initialize Task Manager ======
  const listEl = document.getElementById('tasks-list');
  const totalCounter = document.getElementById('total-tasks');
  const completedCounter = document.getElementById('completed-tasks');

  if (listEl) {
    const tm = new TaskManager(listEl, {
      total: totalCounter,
      completed: completedCounter
    });

    const form = document.getElementById('new-task-form');
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    const clearAllBtn = document.getElementById('clear-all-btn');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      tm.addTask(titleInput.value, descInput.value);
      titleInput.value = '';
      descInput.value = '';
      titleInput.focus();
    });

    clearAllBtn.addEventListener('click', () => {
      if (confirm('Clear all tasks?')) tm.clearAll();
    });

    descInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }
});