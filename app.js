// ═══════════════════════════════════════════════
//  My Aesthetic Journal — app.js
//  Supabase + Auth + Journal + Todo + Planning + Habit
// ═══════════════════════════════════════════════

// ── Supabase Config ──────────────────────────────
const SUPABASE_URL = 'https://umjurimjzkoondlzurwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtanVyaW1qemtvb25kbHp1cnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTExNDYsImV4cCI6MjA5NDcyNzE0Nn0.y1tjMavekMktPjtiThCSqUGrMxHvpHW7GmsO3hZ6u9o';

// Supabase JS v2 via CDN (loaded inline below)
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Helpers ──────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function showLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
}

function showEl(id) { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id) { document.getElementById(id).classList.add('hidden'); }

// ════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════
let currentUser = null;

// Tab switch login/register
document.querySelectorAll('.auth-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.auth === 'login') {
      showEl('login-form'); hideEl('register-form');
    } else {
      hideEl('login-form'); showEl('register-form');
    }
  });
});

// Login
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.classList.add('hidden');
  showLoading(true);
  const { error } = await sb.auth.signInWithPassword({ email, password });
  showLoading(false);
  if (error) {
    errEl.textContent = 'Wrong email or password. Please try again.';
    errEl.classList.remove('hidden');
  }
});

// Register
document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('reg-error');
  const okEl     = document.getElementById('reg-success');
  errEl.classList.add('hidden');
  okEl.classList.add('hidden');
  showLoading(true);
  const { error } = await sb.auth.signUp({ email, password });
  showLoading(false);
  if (error) {
    errEl.textContent = error.message;
    errEl.classList.remove('hidden');
  } else {
    okEl.textContent = 'Account created! Check your email to confirm, then sign in.';
    okEl.classList.remove('hidden');
    document.getElementById('register-form').reset();
  }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to sign out?')) return;
  await sb.auth.signOut();
});

// Auth state listener
sb.auth.onAuthStateChange(async (event, session) => {
  if (session && session.user) {
    currentUser = session.user;
    document.getElementById('user-email-display').textContent = currentUser.email;
    hideEl('auth-page');
    showEl('app');
    await loadAll();
  } else {
    currentUser = null;
    showEl('auth-page');
    hideEl('app');
  }
});

// ── Tab Navigation ────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Load data — tab aktif dulu, sisanya background ──
async function loadAll() {
  // Render journal tab dulu (tab aktif), langsung tampil
  renderJournal();
  renderMoodStats();
  // Sisanya load di background tanpa blokir UI
  renderTodo();
  renderPlan();
  renderHabit();
}

// ════════════════════════════════════════════════
//  JURNAL
// ════════════════════════════════════════════════
const journalForm   = document.getElementById('journal-form');
const journalList   = document.getElementById('journal-list');
const modal         = document.getElementById('modal');
const journalSearch = document.getElementById('journal-search');

// Cache data journal di memori — tidak perlu fetch ulang untuk modal
let journalCache = [];

async function renderMoodStats() {
  const statsEl = document.getElementById('mood-stats');
  // Pakai cache kalau sudah ada
  const journals = journalCache.length ? journalCache
    : (await sb.from('journals').select('mood').eq('user_id', currentUser.id)).data || [];
  if (!journals.length) {
    statsEl.innerHTML = '<span class="mood-stats-empty">Write your first journal to see mood stats ✦</span>';
    return;
  }
  const counts = {};
  journals.forEach(j => { counts[j.mood] = (counts[j.mood] || 0) + 1; });
  statsEl.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => `
      <div class="mood-stat-item">
        <span>${mood.split(' ')[0]}</span>
        <span>${mood.split(' ').slice(1).join(' ')}</span>
        <span class="mood-stat-count">${count}x</span>
      </div>
    `).join('');
}

async function renderJournal(query = '') {
  // Skeleton sementara data dimuat
  if (!journalCache.length) {
    journalList.innerHTML = '<p class="empty-state" style="opacity:0.5">Loading... ✦</p>';
  }
  const { data: journals, error } = await sb.from('journals').select('*')
    .eq('user_id', currentUser.id).order('created_at', { ascending: false });
  if (error) { journalList.innerHTML = '<p class="empty-state">Failed to load journals.</p>'; return; }

  journalCache = journals || [];
  let list = journalCache;
  if (query.trim()) {
    const lq = query.toLowerCase();
    list = list.filter(j =>
      j.title.toLowerCase().includes(lq) ||
      j.content.toLowerCase().includes(lq) ||
      j.mood.toLowerCase().includes(lq)
    );
  }

  if (!list.length) {
    journalList.innerHTML = query
      ? '<p class="empty-state">No journals found ✦</p>'
      : '<p class="empty-state">No journals yet. Start writing today ✦</p>';
    return;
  }

  journalList.innerHTML = list.map(j => {
    const preview = escHtml(j.content.slice(0, 80)) + (j.content.length > 80 ? '…' : '');
    return `
      <div class="card" data-id="${j.id}">
        <div class="card-mood">${j.mood.split(' ')[0]}</div>
        <div class="card-title">${escHtml(j.title)}</div>
        <div class="card-date">${formatDate(j.date)}</div>
        <div class="card-preview">${preview}</div>
        <div class="card-footer">
          <button class="delete-btn" data-id="${j.id}">🗑 Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

journalSearch.addEventListener('input', () => renderJournal(journalSearch.value));

journalForm.addEventListener('submit', async e => {
  e.preventDefault();
  const mood = journalForm.querySelector('input[name="mood"]:checked');
  if (!mood) return;
  const btn = journalForm.querySelector('button[type="submit"]');
  btn.textContent = '⏳ Saving...';
  btn.disabled = true;
  const { error } = await sb.from('journals').insert({
    user_id: currentUser.id,
    title:   document.getElementById('title').value.trim(),
    date:    document.getElementById('date').value,
    mood:    mood.value,
    content: document.getElementById('content').value.trim(),
  });
  btn.textContent = '💾 Save Journal';
  btn.disabled = false;
  if (error) { alert('Failed to save journal: ' + error.message); return; }
  journalForm.reset();
  journalCache = []; // reset cache
  await renderJournal();
  renderMoodStats();
});

journalList.addEventListener('click', async e => {
  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    e.stopPropagation();
    if (!confirm('Delete this journal entry?')) return;
    deleteBtn.textContent = '⏳';
    deleteBtn.disabled = true;
    await sb.from('journals').delete().eq('id', deleteBtn.dataset.id).eq('user_id', currentUser.id);
    journalCache = [];
    await renderJournal(journalSearch.value);
    renderMoodStats();
    return;
  }
  const card = e.target.closest('.card');
  if (card) openModal(card.dataset.id);
});

async function openModal(id) {
  // Pakai cache dulu, tidak perlu fetch ke database
  const data = journalCache.find(j => j.id === id);
  if (!data) return;
  document.getElementById('modal-mood').textContent    = data.mood.split(' ')[0];
  document.getElementById('modal-title').textContent   = data.title;
  document.getElementById('modal-date').textContent    = formatDate(data.date);
  document.getElementById('modal-content').textContent = data.content;
  modal.classList.remove('hidden');
}

document.getElementById('close-modal').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

// ── Export / Import ───────────────────────────────
document.getElementById('btn-export').addEventListener('click', async () => {
  showLoading(true);
  const [j, t, p, h] = await Promise.all([
    sb.from('journals').select('*').eq('user_id', currentUser.id),
    sb.from('todos').select('*').eq('user_id', currentUser.id),
    sb.from('plans').select('*').eq('user_id', currentUser.id),
    sb.from('habits').select('*').eq('user_id', currentUser.id),
  ]);
  showLoading(false);
  const allData = {
    exported_at: new Date().toISOString(),
    journal: j.data || [], todo: t.data || [],
    plan: p.data || [],    habit: h.data || [],
  };
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `my-journal-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!confirm('Import will add data from the backup file. Continue?')) return;
      showLoading(true);
      if (Array.isArray(data.journal) && data.journal.length) {
        const rows = data.journal.map(j => ({ ...j, user_id: currentUser.id, id: undefined }));
        await sb.from('journals').insert(rows);
      }
      if (Array.isArray(data.todo) && data.todo.length) {
        const rows = data.todo.map(t => ({ ...t, user_id: currentUser.id, id: undefined }));
        await sb.from('todos').insert(rows);
      }
      if (Array.isArray(data.plan) && data.plan.length) {
        const rows = data.plan.map(p => ({ ...p, user_id: currentUser.id, id: undefined, description: p.desc || p.description }));
        await sb.from('plans').insert(rows);
      }
      if (Array.isArray(data.habit) && data.habit.length) {
        const rows = data.habit.map(h => ({ ...h, user_id: currentUser.id, id: undefined }));
        await sb.from('habits').insert(rows);
      }
      await loadAll();
      showLoading(false);
      alert('Import successful ✦');
    } catch {
      showLoading(false);
      alert('Invalid file. Please use a backup from this app.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ════════════════════════════════════════════════
//  TO-DO LIST
// ════════════════════════════════════════════════
const todoForm = document.getElementById('todo-form');
const todoList = document.getElementById('todo-list');
let todoFilter = 'all';

async function renderTodo() {
  let q = sb.from('todos').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
  if (todoFilter === 'active') q = q.eq('done', false);
  if (todoFilter === 'done')   q = q.eq('done', true);
  const { data: todos } = await q;
  const list = todos || [];

  if (!list.length) {
    todoList.innerHTML = '<p class="empty-state">No tasks here ✦</p>';
    return;
  }

  const order = { high: 0, medium: 1, low: 2 };
  todoList.innerHTML = list
    .sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1))
    .map(t => `
      <div class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="todo-check ${t.done ? 'checked' : ''}" data-action="toggle" data-id="${t.id}">
          ${t.done ? '✓' : ''}
        </div>
        <span class="todo-text">${escHtml(t.text)}</span>
        <span class="todo-priority priority-${t.priority}">
          ${t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'} ${t.priority}
        </span>
        <button class="delete-btn" data-action="delete" data-id="${t.id}">🗑</button>
      </div>
    `).join('');
}

todoForm.addEventListener('submit', async e => {
  e.preventDefault();
  const text     = document.getElementById('todo-input').value.trim();
  const priority = document.getElementById('todo-priority').value;
  if (!text) return;
  const btn = todoForm.querySelector('button[type="submit"]');
  btn.textContent = '⏳';
  btn.disabled = true;
  await sb.from('todos').insert({ user_id: currentUser.id, text, priority, done: false });
  btn.textContent = 'Add';
  btn.disabled = false;
  todoForm.reset();
  await renderTodo();
});

todoList.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'toggle') {
    const { data } = await sb.from('todos').select('done').eq('id', el.dataset.id).single();
    if (data) {
      await sb.from('todos').update({ done: !data.done }).eq('id', el.dataset.id).eq('user_id', currentUser.id);
      await renderTodo();
    }
  }
  if (el.dataset.action === 'delete') {
    if (!confirm('Delete this task?')) return;
    el.textContent = '⏳';
    el.disabled = true;
    await sb.from('todos').delete().eq('id', el.dataset.id).eq('user_id', currentUser.id);
    await renderTodo();
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    todoFilter = btn.dataset.filter;
    await renderTodo();
  });
});
// ════════════════════════════════════════════════
//  LIFE PLANNING
// ════════════════════════════════════════════════
const planForm = document.getElementById('plan-form');
const planList = document.getElementById('plan-list');

const CATEGORY_ICONS = {
  career: '💼', health: '💪', finance: '💰',
  education: '📚', relationship: '❤️', hobby: '🎨', other: '✨'
};

async function renderPlan() {
  const { data: plans } = await sb.from('plans').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  const list = plans || [];

  if (!list.length) {
    planList.innerHTML = '<p class="empty-state" style="grid-column:1/-1">No goals yet. Start planning your life ✦</p>';
    return;
  }

  planList.innerHTML = list.map(p => `
    <div class="plan-card" data-id="${p.id}">
      <div class="plan-header">
        <span class="plan-category">${CATEGORY_ICONS[p.category] || '✨'} ${escHtml(p.category)}</span>
        <button class="delete-btn" data-action="delete-plan" data-id="${p.id}">🗑</button>
      </div>
      <div class="plan-title">${escHtml(p.title)}</div>
      ${p.description ? `<div class="plan-desc">${escHtml(p.description)}</div>` : ''}
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
        <button class="plan-status ${p.done ? 'done' : ''}" data-action="toggle-plan" data-id="${p.id}">
          ${p.done ? '✅ Completed' : '⬜ Mark as Done'}
        </button>
      </div>
    </div>
  `).join('');
}

planForm.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = planForm.querySelector('button[type="submit"]');
  btn.textContent = '⏳';
  btn.disabled = true;
  await sb.from('plans').insert({
    user_id:     currentUser.id,
    title:       document.getElementById('plan-title').value.trim(),
    description: document.getElementById('plan-desc').value.trim(),
    category:    document.getElementById('plan-category').value,
    timeline:    document.getElementById('plan-timeline').value,
    progress:    0,
    done:        false,
  });
  btn.textContent = 'Add Goal';
  btn.disabled = false;
  planForm.reset();
  await renderPlan();
});

planList.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'toggle-plan') {
    const { data } = await sb.from('plans').select('done').eq('id', el.dataset.id).single();
    if (data) {
      await sb.from('plans').update({ done: !data.done }).eq('id', el.dataset.id).eq('user_id', currentUser.id);
      await renderPlan();
    }
  }
  if (el.dataset.action === 'delete-plan') {
    if (!confirm('Delete this goal?')) return;
    el.textContent = '⏳';
    el.disabled = true;
    await sb.from('plans').delete().eq('id', el.dataset.id).eq('user_id', currentUser.id);
    await renderPlan();
  }
});

planList.addEventListener('input', async e => {
  if (e.target.dataset.action === 'progress') {
    const val = parseInt(e.target.value, 10);
    const card = e.target.closest('.plan-card');
    if (card) {
      card.querySelector('.plan-progress-fill').style.width = val + '%';
      card.querySelector('.plan-progress-label span:last-child').textContent = val + '%';
    }
    await sb.from('plans').update({ progress: val }).eq('id', e.target.dataset.id).eq('user_id', currentUser.id);
  }
});

// ════════════════════════════════════════════════
//  HABIT TRACKER
// ════════════════════════════════════════════════
const habitForm = document.getElementById('habit-form');
const habitList = document.getElementById('habit-list');
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function calcStreak(log) {
  if (!log || !log.length) return 0;
  let streak = 0;
  const check = new Date();
  check.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    if (log.includes(check.toISOString().slice(0, 10))) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else break;
  }
  return streak;
}

async function renderHabit() {
  const { data: habits } = await sb.from('habits').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
  const list = habits || [];
  const weekDates = getWeekDates();
  const today = new Date().toISOString().slice(0, 10);

  const label = document.getElementById('habit-week-label');
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  label.textContent = `This week: ${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;

  if (!list.length) {
    habitList.innerHTML = '<p class="empty-state">No habits yet. Start building your routine ✦</p>';
    return;
  }

  habitList.innerHTML = list.map(h => {
    const streak = calcStreak(h.log);
    const days = weekDates.map((date, i) => {
      const done     = (h.log || []).includes(date);
      const isFuture = date > today;
      return `
        <div class="habit-day ${done ? 'done' : ''}"
          data-action="${isFuture ? '' : 'toggle-habit'}"
          data-id="${h.id}" data-date="${date}" data-log='${JSON.stringify(h.log || [])}'
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
            <span class="habit-streak">🔥 ${streak} days</span>
            <button class="delete-btn" data-action="delete-habit" data-id="${h.id}">🗑</button>
          </div>
        </div>
        <div class="habit-days">${days}</div>
      </div>
    `;
  }).join('');
}

habitForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('habit-input').value.trim();
  const icon = document.getElementById('habit-icon').value;
  if (!name) return;
  const btn = habitForm.querySelector('button[type="submit"]');
  btn.textContent = '⏳';
  btn.disabled = true;
  await sb.from('habits').insert({ user_id: currentUser.id, name, icon, log: [] });
  btn.textContent = 'Add';
  btn.disabled = false;
  habitForm.reset();
  await renderHabit();
});

habitList.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el || !el.dataset.action) return;

  if (el.dataset.action === 'toggle-habit') {
    const date    = el.dataset.date;
    const log     = JSON.parse(el.dataset.log || '[]');
    const newLog  = log.includes(date) ? log.filter(d => d !== date) : [...log, date];
    // Optimistic UI — update tampilan dulu, baru sync ke DB
    el.classList.toggle('done');
    el.dataset.log = JSON.stringify(newLog);
    el.innerHTML = `<span class="day-name">${el.querySelector('.day-name').textContent}</span>${newLog.includes(date) ? '✓' : new Date(date + 'T00:00:00').getDate()}`;
    sb.from('habits').update({ log: newLog }).eq('id', el.dataset.id).eq('user_id', currentUser.id);
  }

  if (el.dataset.action === 'delete-habit') {
    if (!confirm('Delete this habit?')) return;
    el.textContent = '⏳';
    el.disabled = true;
    await sb.from('habits').delete().eq('id', el.dataset.id).eq('user_id', currentUser.id);
    await renderHabit();
  }
});
