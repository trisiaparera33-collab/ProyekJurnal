// ═══════════════════════════════════════════════
//  My Aesthetic Journal — app.js
//  Features: Journal, To-Do, Life Planning, Habit Tracker
//  Storage: localStorage only
// ═══════════════════════════════════════════════

const KEYS = {
  journal: 'my_aesthetic_journal',
  todo:    'my_aesthetic_todo',
  plan:    'my_aesthetic_plan',
  habit:   'my_aesthetic_habit',
};

// ── Helpers ──────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function loadData(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Tab Navigation ────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ════════════════════════════════════════════════
//  JURNAL
// ════════════════════════════════════════════════
const journalForm = document.getElementById('journal-form');
const journalList = document.getElementById('journal-list');
const modal       = document.getElementById('modal');

function renderJournal() {
  const journals = loadData(KEYS.journal);
  if (!journals.length) {
    journalList.innerHTML = '<p class="empty-state">Belum ada jurnal. Mulai tulis hari ini ✦</p>';
    return;
  }
  journalList.innerHTML = journals
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(j => `
      <div class="card" data-id="${j.id}">
        <div class="card-mood">${j.mood.split(' ')[0]}</div>
        <div class="card-title">${escHtml(j.title)}</div>
        <div class="card-date">${formatDate(j.date)}</div>
        <div class="card-preview">${escHtml(j.content.slice(0, 80))}${j.content.length > 80 ? '…' : ''}</div>
        <div class="card-footer">
          <button class="delete-btn" data-id="${j.id}">🗑 Hapus</button>
        </div>
      </div>
    `).join('');
}

journalForm.addEventListener('submit', e => {
  e.preventDefault();
  const mood = journalForm.querySelector('input[name="mood"]:checked');
  if (!mood) return;
  const entry = {
    id: crypto.randomUUID(),
    title: document.getElementById('title').value.trim(),
    date: document.getElementById('date').value,
    mood: mood.value,
    content: document.getElementById('content').value.trim(),
    created_at: new Date().toISOString()
  };
  const journals = loadData(KEYS.journal);
  journals.push(entry);
  saveData(KEYS.journal, journals);
  journalForm.reset();
  renderJournal();
});

journalList.addEventListener('click', e => {
  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    e.stopPropagation();
    if (!confirm('Hapus jurnal ini?')) return;
    saveData(KEYS.journal, loadData(KEYS.journal).filter(j => j.id !== deleteBtn.dataset.id));
    renderJournal();
    return;
  }
  const card = e.target.closest('.card');
  if (card) openModal(card.dataset.id);
});

function openModal(id) {
  const j = loadData(KEYS.journal).find(j => j.id === id);
  if (!j) return;
  document.getElementById('modal-mood').textContent = j.mood.split(' ')[0];
  document.getElementById('modal-title').textContent = j.title;
  document.getElementById('modal-date').textContent = formatDate(j.date);
  document.getElementById('modal-content').textContent = j.content;
  modal.classList.remove('hidden');
}

document.getElementById('close-modal').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

// ════════════════════════════════════════════════
//  TO-DO LIST
// ════════════════════════════════════════════════
const todoForm   = document.getElementById('todo-form');
const todoList   = document.getElementById('todo-list');
let todoFilter   = 'semua';

function renderTodo() {
  let todos = loadData(KEYS.todo);
  if (todoFilter === 'aktif')   todos = todos.filter(t => !t.done);
  if (todoFilter === 'selesai') todos = todos.filter(t => t.done);

  if (!todos.length) {
    todoList.innerHTML = '<p class="empty-state">Tidak ada tugas di sini ✦</p>';
    return;
  }

  todoList.innerHTML = todos
    .sort((a, b) => {
      const order = { tinggi: 0, sedang: 1, rendah: 2 };
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    })
    .map(t => `
      <div class="todo-item ${t.done ? 'selesai' : ''}" data-id="${t.id}">
        <div class="todo-check ${t.done ? 'checked' : ''}" data-action="toggle" data-id="${t.id}">
          ${t.done ? '✓' : ''}
        </div>
        <span class="todo-text">${escHtml(t.text)}</span>
        <span class="todo-priority priority-${t.priority}">
          ${t.priority === 'tinggi' ? '🔴' : t.priority === 'sedang' ? '🟡' : '🟢'} ${t.priority}
        </span>
        <button class="delete-btn" data-action="delete" data-id="${t.id}">🗑</button>
      </div>
    `).join('');
}

todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = document.getElementById('todo-input').value.trim();
  const priority = document.getElementById('todo-priority').value;
  if (!text) return;
  const todos = loadData(KEYS.todo);
  todos.push({ id: crypto.randomUUID(), text, priority, done: false, created_at: new Date().toISOString() });
  saveData(KEYS.todo, todos);
  todoForm.reset();
  renderTodo();
});

todoList.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const todos = loadData(KEYS.todo);
  if (el.dataset.action === 'toggle') {
    const idx = todos.findIndex(t => t.id === el.dataset.id);
    if (idx !== -1) todos[idx].done = !todos[idx].done;
    saveData(KEYS.todo, todos);
    renderTodo();
  }
  if (el.dataset.action === 'delete') {
    if (!confirm('Hapus tugas ini?')) return;
    saveData(KEYS.todo, todos.filter(t => t.id !== el.dataset.id));
    renderTodo();
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    todoFilter = btn.dataset.filter;
    renderTodo();
  });
});

// ════════════════════════════════════════════════
//  LIFE PLANNING
// ════════════════════════════════════════════════
const planForm = document.getElementById('plan-form');
const planList = document.getElementById('plan-list');

const CATEGORY_ICONS = {
  karir: '💼', kesehatan: '💪', keuangan: '💰',
  pendidikan: '📚', hubungan: '❤️', hobi: '🎨', lainnya: '✨'
};

function renderPlan() {
  const plans = loadData(KEYS.plan);
  if (!plans.length) {
    planList.innerHTML = '<p class="empty-state" style="grid-column:1/-1">Belum ada goal. Yuk mulai rencanakan hidupmu ✦</p>';
    return;
  }
  planList.innerHTML = plans
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(p => `
      <div class="plan-card" data-id="${p.id}">
        <div class="plan-header">
          <span class="plan-category">${CATEGORY_ICONS[p.category] || '✨'} ${escHtml(p.category)}</span>
          <button class="delete-btn" data-action="delete-plan" data-id="${p.id}">🗑</button>
        </div>
        <div class="plan-title">${escHtml(p.title)}</div>
        ${p.desc ? `<div class="plan-desc">${escHtml(p.desc)}</div>` : ''}
        <div class="plan-timeline">⏳ ${escHtml(p.timeline)}</div>
        <div class="plan-progress-wrap">
          <div class="plan-progress-label">
            <span>Progress</span>
            <span>${p.progress || 0}%</span>
          </div>
          <div class="plan-progress-bar">
            <div class="plan-progress-fill" style="width:${p.progress || 0}%"></div>
          </div>
          <input type="range" class="plan-progress-input" min="0" max="100" value="${p.progress || 0}"
            data-action="progress" data-id="${p.id}" />
        </div>
        <div class="plan-footer">
          <button class="plan-status ${p.done ? 'selesai' : ''}" data-action="toggle-plan" data-id="${p.id}">
            ${p.done ? '✅ Selesai' : '⬜ Tandai Selesai'}
          </button>
        </div>
      </div>
    `).join('');
}

planForm.addEventListener('submit', e => {
  e.preventDefault();
  const plan = {
    id: crypto.randomUUID(),
    title: document.getElementById('plan-title').value.trim(),
    desc: document.getElementById('plan-desc').value.trim(),
    category: document.getElementById('plan-category').value,
    timeline: document.getElementById('plan-timeline').value,
    progress: 0,
    done: false,
    created_at: new Date().toISOString()
  };
  const plans = loadData(KEYS.plan);
  plans.push(plan);
  saveData(KEYS.plan, plans);
  planForm.reset();
  renderPlan();
});

planList.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const plans = loadData(KEYS.plan);
  if (el.dataset.action === 'toggle-plan') {
    const idx = plans.findIndex(p => p.id === el.dataset.id);
    if (idx !== -1) plans[idx].done = !plans[idx].done;
    saveData(KEYS.plan, plans);
    renderPlan();
  }
  if (el.dataset.action === 'delete-plan') {
    if (!confirm('Hapus goal ini?')) return;
    saveData(KEYS.plan, plans.filter(p => p.id !== el.dataset.id));
    renderPlan();
  }
});

planList.addEventListener('input', e => {
  if (e.target.dataset.action === 'progress') {
    const plans = loadData(KEYS.plan);
    const idx = plans.findIndex(p => p.id === e.target.dataset.id);
    if (idx !== -1) {
      plans[idx].progress = parseInt(e.target.value, 10);
      saveData(KEYS.plan, plans);
      // Update display without full re-render
      const card = e.target.closest('.plan-card');
      if (card) {
        card.querySelector('.plan-progress-fill').style.width = e.target.value + '%';
        card.querySelector('.plan-progress-label span:last-child').textContent = e.target.value + '%';
      }
    }
  }
});

// ════════════════════════════════════════════════
//  HABIT TRACKER
// ════════════════════════════════════════════════
const habitForm = document.getElementById('habit-form');
const habitList = document.getElementById('habit-list');

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7)); // start from Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function renderHabit() {
  const habits = loadData(KEYS.habit);
  const weekDates = getWeekDates();

  // Update week label
  const label = document.getElementById('habit-week-label');
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  label.textContent = `Minggu ini: ${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;

  if (!habits.length) {
    habitList.innerHTML = '<p class="empty-state">Belum ada kebiasaan. Mulai bangun rutinmu ✦</p>';
    return;
  }

  habitList.innerHTML = habits.map(h => {
    const streak = calcStreak(h);
    const days = weekDates.map((date, i) => {
      const done = (h.log || []).includes(date);
      const today = new Date().toISOString().slice(0, 10);
      const isFuture = date > today;
      return `
        <div class="habit-day ${done ? 'done' : ''} ${isFuture ? 'future' : ''}"
          data-action="${isFuture ? '' : 'toggle-habit'}"
          data-id="${h.id}" data-date="${date}"
          title="${date}">
          <span class="day-name">${DAY_NAMES[(i + 1) % 7]}</span>
          ${done ? '✓' : new Date(date + 'T00:00:00').getDate()}
        </div>
      `;
    }).join('');

    return `
      <div class="habit-item" data-id="${h.id}">
        <div class="habit-header">
          <span class="habit-name">${escHtml(h.icon)} ${escHtml(h.name)}</span>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <span class="habit-streak">🔥 ${streak} hari</span>
            <button class="delete-btn" data-action="delete-habit" data-id="${h.id}">🗑</button>
          </div>
        </div>
        <div class="habit-days">${days}</div>
      </div>
    `;
  }).join('');
}

function calcStreak(habit) {
  const log = (habit.log || []).sort().reverse();
  if (!log.length) return 0;
  let streak = 0;
  let check = new Date();
  check.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const dateStr = check.toISOString().slice(0, 10);
    if (log.includes(dateStr)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

habitForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('habit-input').value.trim();
  const icon = document.getElementById('habit-icon').value;
  if (!name) return;
  const habits = loadData(KEYS.habit);
  habits.push({ id: crypto.randomUUID(), name, icon, log: [], created_at: new Date().toISOString() });
  saveData(KEYS.habit, habits);
  habitForm.reset();
  renderHabit();
});

habitList.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || !el.dataset.action) return;

  const habits = loadData(KEYS.habit);

  if (el.dataset.action === 'toggle-habit') {
    const idx = habits.findIndex(h => h.id === el.dataset.id);
    if (idx === -1) return;
    const date = el.dataset.date;
    const log = habits[idx].log || [];
    if (log.includes(date)) {
      habits[idx].log = log.filter(d => d !== date);
    } else {
      habits[idx].log = [...log, date];
    }
    saveData(KEYS.habit, habits);
    renderHabit();
  }

  if (el.dataset.action === 'delete-habit') {
    if (!confirm('Hapus kebiasaan ini?')) return;
    saveData(KEYS.habit, habits.filter(h => h.id !== el.dataset.id));
    renderHabit();
  }
});

// ════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════
renderJournal();
renderTodo();
renderPlan();
renderHabit();
