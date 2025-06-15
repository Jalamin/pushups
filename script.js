const countEl = document.getElementById('count');
const incrementBtn = document.getElementById('increment');
const decrementBtn = document.getElementById('decrement');
const statsList = document.getElementById('week-stats');
const themeBtn = document.getElementById('theme-toggle');

let count = 0;
let today = new Date().toISOString().split('T')[0];
let stats = JSON.parse(localStorage.getItem('pushupStats')) || {};

// Очистити або створити сьогоднішній день
if (!stats[today]) {
  stats[today] = 0;
  localStorage.setItem('pushupStats', JSON.stringify(stats));
}

count = stats[today];
updateCount();
updateStats();

incrementBtn.addEventListener('click', () => {
  count++;
  save();
});

decrementBtn.addEventListener('click', () => {
  if (count > 0) count--;
  save();
});

function save() {
  stats[today] = count;
  localStorage.setItem('pushupStats', JSON.stringify(stats));
  updateCount();
  updateStats();
}

function updateCount() {
  countEl.textContent = count;
}

function updateStats() {
  statsList.innerHTML = '';
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  days.forEach(day => {
    const reps = stats[day] || 0;
    const li = document.createElement('li');
    li.innerHTML = `<span>${formatDate(day)}</span><span>${reps}</span>`;
    statsList.appendChild(li);
  });
}

function formatDate(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Тема
const body = document.body;
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeBtn.addEventListener('click', () => {
  const newTheme = body.classList.contains('light') ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});

function applyTheme(theme) {
  body.classList.toggle('light', theme === 'light');
}

// Вимкнення масштабування, скролу, дабл кліку
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
