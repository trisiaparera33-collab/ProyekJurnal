const STORAGE_KEY = 'my_aesthetic_journal';

const form = document.getElementById('journal-form');
const list = document.getElementById('journal-list');
const modal = document.getElementById('modal');

// --- Storage ---
function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function save(journals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
}

// --- Render ---
function render() {
  const journals = load();
  if (!journals.length) {
    list.innerHTML = '<p class="empty-state">Belum ada jurnal. Mulai tulis hari ini ✦</p>';
    return;
  }
  list.innerHTML = journals
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

// --- Helpers ---
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// --- Add ---
form.addEventListener('submit', e => {
  e.preventDefault();
  const mood = form.querySelector('input[name="mood"]:checked');
  if (!mood) return;

  const entry = {
    id: crypto.randomUUID(),
    title: document.getElementById('title').value.trim(),
    date: document.getElementById('date').value,
    mood: mood.value,
    content: document.getElementById('content').value.trim(),
    created_at: new Date().toISOString()
  };

  const journals = load();
  journals.push(entry);
  save(journals);
  form.reset();
  render();
});

// --- Delete & Open ---
list.addEventListener('click', e => {
  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    e.stopPropagation();
    if (!confirm('Hapus jurnal ini?')) return;
    const journals = load().filter(j => j.id !== deleteBtn.dataset.id);
    save(journals);
    render();
    return;
  }

  const card = e.target.closest('.card');
  if (card) openModal(card.dataset.id);
});

// --- Modal ---
function openModal(id) {
  const j = load().find(j => j.id === id);
  if (!j) return;
  document.getElementById('modal-mood').textContent = j.mood.split(' ')[0];
  document.getElementById('modal-title').textContent = j.title;
  document.getElementById('modal-date').textContent = formatDate(j.date);
  document.getElementById('modal-content').textContent = j.content;
  modal.classList.remove('hidden');
}

document.getElementById('close-modal').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

// --- Init ---
render();
