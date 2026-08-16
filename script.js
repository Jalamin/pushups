const DEFAULT_CATEGORIES = [
  { id: 'pushups', name: 'Віджимання', icon: '▱', custom: false },
  { id: 'pullups', name: 'Підтягування', icon: '↑', custom: false }
];

const DEFAULT_EXERCISES = [
  { id: 'push-standard', name: 'Класичні віджимання', categoryId: 'pushups', icon: '▱', hint: 'База', custom: false },
  { id: 'push-wide', name: 'Віджимання широким хватом', categoryId: 'pushups', icon: '↔', hint: 'Груди', custom: false },
  { id: 'push-diamond', name: 'Алмазні віджимання', categoryId: 'pushups', icon: '◇', hint: 'Трицепс', custom: false },
  { id: 'push-decline', name: 'Віджимання з ногами вище', categoryId: 'pushups', icon: '↗', hint: 'Плечі', custom: false },
  { id: 'push-incline', name: 'Віджимання від опори', categoryId: 'pushups', icon: '↘', hint: 'Легший варіант', custom: false },
  { id: 'push-pike', name: 'Віджимання «будиночком»', categoryId: 'pushups', icon: '△', hint: 'Плечі', custom: false },
  { id: 'pull-standard', name: 'Класичні підтягування', categoryId: 'pullups', icon: '↑', hint: 'База', custom: false },
  { id: 'pull-wide', name: 'Підтягування широким хватом', categoryId: 'pullups', icon: '↕', hint: 'Ширина спини', custom: false },
  { id: 'pull-close', name: 'Підтягування вузьким хватом', categoryId: 'pullups', icon: '↟', hint: 'Біцепс', custom: false },
  { id: 'pull-chinup', name: 'Підтягування зворотним хватом', categoryId: 'pullups', icon: '↥', hint: 'Біцепс', custom: false },
  { id: 'pull-neutral', name: 'Підтягування нейтральним хватом', categoryId: 'pullups', icon: '⇅', hint: 'Спина + біцепс', custom: false },
  { id: 'pull-archer', name: 'Підтягування лучника', categoryId: 'pullups', icon: '⟶', hint: 'Складний варіант', custom: false }
];

const state = {
  categories: loadCategories(),
  exercises: loadExercises(),
  logs: loadLogs(),
  selectedDate: localDateKey(),
  calendarDate: new Date(),
  currentScreen: 'home',
  modalExercise: null,
  builderMode: 'category',
  theme: localStorage.getItem('repTheme') || 'dark',
  settings: loadSettings()
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadCategories() {
  try {
    const raw = JSON.parse(localStorage.getItem('repTrackCategories') || 'null');
    if (Array.isArray(raw) && raw.length) {
      const defaults = new Set(DEFAULT_CATEGORIES.map(c => c.id));
      const migrated = raw.map(c => ({ ...c, custom: defaults.has(c.id) ? false : true }));
      localStorage.setItem('repTrackCategories', JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  const categories = [...DEFAULT_CATEGORIES];
  localStorage.setItem('repTrackCategories', JSON.stringify(categories));
  return categories;
}

function loadExercises() {
  try {
    const raw = JSON.parse(localStorage.getItem('repTrackExercises') || 'null');
    if (Array.isArray(raw) && raw.length) {
      const defaults = new Set(DEFAULT_EXERCISES.map(e => e.id));
      const migrated = raw.map(e => ({ ...e, custom: defaults.has(e.id) ? false : true }));
      localStorage.setItem('repTrackExercises', JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  const exercises = [...DEFAULT_EXERCISES];
  localStorage.setItem('repTrackExercises', JSON.stringify(exercises));
  return exercises;
}

function loadLogs() {
  try {
    const raw = JSON.parse(localStorage.getItem('repTrackLogs') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
}

function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem('repTrackSettings') || 'null');
    if (raw && typeof raw === 'object') return { dailyGoal: Math.max(1, Number(raw.dailyGoal || 50)) };
  } catch {}
  const settings = { dailyGoal: 50 };
  localStorage.setItem('repTrackSettings', JSON.stringify(settings));
  return settings;
}

function saveSettings() {
  localStorage.setItem('repTrackSettings', JSON.stringify(state.settings));
}

function persistLibrary() {
  localStorage.setItem('repTrackCategories', JSON.stringify(state.categories));
  localStorage.setItem('repTrackExercises', JSON.stringify(state.exercises));
}

function saveLogs() { localStorage.setItem('repTrackLogs', JSON.stringify(state.logs)); }

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char]));
}

function makeId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function categoryById(id) { return state.categories.find(c => c.id === id); }
function exerciseById(id) { return state.exercises.find(e => e.id === id); }
function exercisesInCategory(categoryId) { return state.exercises.filter(e => e.categoryId === categoryId); }
function dayData(dateKey) { return state.logs[dateKey] || {}; }
function dayTotal(dateKey) { return Object.values(dayData(dateKey)).reduce((sum, n) => sum + Number(n || 0), 0); }
function exerciseTotal(exerciseId) { return Object.values(state.logs).reduce((sum, day) => sum + Number(day[exerciseId] || 0), 0); }
function formatFullDate(key) { return parseDate(key).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
function formatShortDate(key) { return parseDate(key).toLocaleDateString('uk-UA', { day:'numeric', month:'short' }); }

function setupMobileUX() {
  const ua = navigator.userAgent || '';
  const isIPhone = /iPhone|iPod/i.test(ua) && !/iPad/i.test(ua);
  document.documentElement.classList.toggle('ios-iphone', isIPhone);
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  window.addEventListener('resize', () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`));
  window.addEventListener('orientationchange', () => setTimeout(() => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`), 150));
  setupLiquidNav(isIPhone);
}

function setupLiquidNav(isIPhone) {
  const nav = document.querySelector('.bottom-nav');
  const lens = nav?.querySelector('.liquid-lens');
  if (!nav || !lens || !isIPhone) return;
  const moveLens = (clientX) => {
    const rect = nav.getBoundingClientRect();
    const items = [...nav.querySelectorAll('.nav-item')];
    const index = Math.max(0, Math.min(items.length - 1, Math.floor((clientX - rect.left) / (rect.width / items.length))));
    const item = items[index];
    if (!item) return;
    const ir = item.getBoundingClientRect();
    lens.style.setProperty('--lens-x', `${ir.left - rect.left + 4}px`);
    lens.style.setProperty('--lens-w', `${ir.width - 8}px`);
    lens.classList.add('is-moving');
    return item;
  };
  const settleLens = () => {
    const active = nav.querySelector('.nav-item.active');
    if (active) {
      const rect = nav.getBoundingClientRect(), r = active.getBoundingClientRect();
      lens.style.setProperty('--lens-x', `${r.left - rect.left + 4}px`);
      lens.style.setProperty('--lens-w', `${r.width - 8}px`);
    }
    lens.classList.remove('is-moving');
  };
  nav.addEventListener('touchmove', (e) => {
    const item = moveLens(e.touches[0].clientX);
    if (item) { e.preventDefault(); }
  }, { passive: false });
  nav.addEventListener('touchend', (e) => {
    const item = moveLens(e.changedTouches[0].clientX);
    if (item) item.click();
    setTimeout(settleLens, 30);
  }, { passive: true });
  nav.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') moveLens(e.clientX); });
  window.addEventListener('resize', settleLens);
  setTimeout(settleLens, 40);
}

function init() {
  setupMobileUX();
  registerServiceWorker();
  migrateLegacyData();
  applyTheme(state.theme);
  bindNavigation();
  bindTheme();
  bindModal();
  bindBuilder();
  bindCalendarControls();
  renderSettingsUI();
  $('#today-label').textContent = formatFullDate(state.selectedDate);
  $('#hero-streak').textContent = `🔥 ${currentStreak()} ${pluralDays(currentStreak())} поспіль`;
  renderAll();
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try { await navigator.serviceWorker.register('./sw.js'); } catch {}
}

function migrateLegacyData() {
  // Previous versions used category names inside the exercise records.
  // The default IDs are preserved, so existing logs remain intact.
  persistLibrary();
}

function bindNavigation() {
  $$('.nav-item').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.screen)));
  $('#open-all-exercises').addEventListener('click', () => showScreen('exercises'));
  $('#fab-add').addEventListener('click', () => {
    if (state.exercises.length) openLogModal(state.exercises[0]);
  });
  bindSettings();
}

function showScreen(name) {
  state.currentScreen = name;
  $$('.screen').forEach(screen => screen.classList.toggle('active', screen.id === `screen-${name}`));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.screen === name));
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindTheme() {
  $('#theme-toggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('repTheme', state.theme);
    applyTheme(state.theme);
  });
}

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  $('#theme-toggle').textContent = theme === 'dark' ? '☼' : '☾';
}

function bindSettings() {
  $('#daily-goal-input').addEventListener('change', syncSettingsFromUI);
  $('#save-settings').addEventListener('click', () => {
    syncSettingsFromUI();
    saveSettings();
    renderAll();
    toast('Ціль збережено');
  });
}

function syncSettingsFromUI() {
  const goal = Math.max(1, Math.floor(Number($('#daily-goal-input').value || 50)));
  state.settings.dailyGoal = Math.min(99999, goal);
}

function bindModal() {
  $('#modal-close').addEventListener('click', closeLogModal);
  $('#log-modal').addEventListener('click', e => { if (e.target.id === 'log-modal') closeLogModal(); });
  $('#modal-minus').addEventListener('click', () => changeModalReps(-1));
  $('#modal-plus').addEventListener('click', () => changeModalReps(1));
  $('#modal-save').addEventListener('click', saveModalLog);
}

function openLogModal(exercise) {
  if (!exercise) return;
  state.modalExercise = exercise;
  const current = Number(dayData(state.selectedDate)[exercise.id] || 0);
  const cat = categoryById(exercise.categoryId);
  $('#modal-category').textContent = cat?.name || 'Вправа';
  $('#modal-title').textContent = exercise.name;
  $('#modal-subtitle').textContent = `${exercise.hint || 'Тренування'} · ${formatShortDate(state.selectedDate)}`;
  $('#modal-reps').value = String(Math.max(1, current || 10));
  $('#modal-date').value = state.selectedDate;
  $('#log-modal').classList.remove('hidden');
}

function closeLogModal() { state.modalExercise = null; $('#log-modal').classList.add('hidden'); }
function changeModalReps(delta) {
  const input = $('#modal-reps');
  input.value = String(Math.max(0, Math.floor(Number(input.value || 0)) + delta));
}

function saveModalLog() {
  const exercise = state.modalExercise;
  if (!exercise) return;
  const date = $('#modal-date').value || localDateKey();
  const reps = Math.max(0, Math.floor(Number($('#modal-reps').value || 0)));
  if (!state.logs[date]) state.logs[date] = {};
  if (reps === 0) delete state.logs[date][exercise.id];
  else state.logs[date][exercise.id] = reps;
  if (!Object.keys(state.logs[date]).length) delete state.logs[date];
  state.selectedDate = date;
  state.calendarDate = parseDate(date);
  saveLogs(); closeLogModal(); renderAll();
}

function bindBuilder() {
  $('#builder-close').addEventListener('click', closeBuilder);
  $('#builder-modal').addEventListener('click', e => { if (e.target.id === 'builder-modal') closeBuilder(); });
  $$('.builder-tab').forEach(tab => tab.addEventListener('click', () => setBuilderMode(tab.dataset.builderMode)));
  $('#open-builder').addEventListener('click', () => openBuilder('category'));
  $('#restore-defaults')?.addEventListener('click', restoreDefaultLibrary);
  $('#save-category').addEventListener('click', createCategory);
  $('#save-exercise').addEventListener('click', createExercise);
}

function openBuilder(mode = 'category') {
  setBuilderMode(mode);
  $('#builder-modal').classList.remove('hidden');
  (mode === 'category' ? $('#category-name') : $('#exercise-name')).focus();
}

function closeBuilder() { $('#builder-modal').classList.add('hidden'); }

function setBuilderMode(mode) {
  state.builderMode = mode;
  $$('.builder-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.builderMode === mode));
  $('#category-form').classList.toggle('hidden', mode !== 'category');
  $('#exercise-form').classList.toggle('hidden', mode !== 'exercise');
  $('#builder-title').textContent = mode === 'category' ? 'Створи свій розділ' : 'Додай вправу до розділу';
  $('#builder-subtitle').textContent = mode === 'category' ? 'Наприклад: «Шия», «Прес», «Ноги» або будь-який твій комплекс.' : 'Спочатку створи розділ, а потім додай до нього скільки завгодно вправ.';
  if (mode === 'exercise') fillExerciseCategorySelect();
}

function fillExerciseCategorySelect() {
  const select = $('#exercise-category');
  if (!state.categories.length) {
    select.innerHTML = '<option value="">Спочатку створи розділ</option>';
    return;
  }
  select.innerHTML = state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
}

function createCategory() {
  const name = $('#category-name').value.trim();
  const icon = $('#category-icon').value.trim() || '◉';
  if (!name) { $('#category-name').focus(); return; }
  const category = { id: makeId('cat'), name, icon, custom: true };
  state.categories.push(category);
  persistLibrary();
  $('#category-name').value = '';
  $('#category-icon').value = '';
  closeBuilder();
  renderAll();
  toast(`Розділ «${name}» створено`);
}

function createExercise() {
  const name = $('#exercise-name').value.trim();
  const categoryId = $('#exercise-category').value;
  const hint = $('#exercise-hint').value.trim() || 'Мій комплекс';
  const icon = $('#exercise-icon').value.trim() || '✦';
  if (!name || !categoryId) return;
  const exercise = { id: makeId('ex'), name, categoryId, hint, icon, custom: true };
  state.exercises.push(exercise);
  persistLibrary();
  $('#exercise-name').value = '';
  $('#exercise-hint').value = '';
  $('#exercise-icon').value = '';
  closeBuilder();
  renderAll();
  toast(`Вправу «${name}» додано`);
}

function pluralDays(n) {
  const x = Math.abs(n) % 100, y = x % 10;
  if (x >= 11 && x <= 14) return 'днів';
  if (y === 1) return 'день';
  if (y >= 2 && y <= 4) return 'дні';
  return 'днів';
}

function currentStreak() {
  let date = parseDate(localDateKey());
  let count = 0;
  while (dayTotal(localDateKey(date)) > 0) { count++; date.setDate(date.getDate() - 1); }
  return count;
}

function bestStreak() {
  const days = Object.keys(state.logs).filter(d => dayTotal(d) > 0).sort();
  let best = 0, run = 0, prev = null;
  for (const day of days) {
    if (prev) { const diff = Math.round((parseDate(day)-parseDate(prev))/86400000); if (diff === 1) run++; else run = 1; } else run = 1;
    best = Math.max(best, run); prev = day;
  }
  return best;
}

function renderGoalUI(total = dayTotal(state.selectedDate)) {
  const goal = Math.max(1, Number(state.settings.dailyGoal || 50));
  const percent = Math.min(100, Math.round((total / goal) * 100));
  $('#goal-title').textContent = `${total.toLocaleString('uk-UA')} / ${goal.toLocaleString('uk-UA')} повторень`;
  $('#goal-fill').style.width = `${percent}%`;
  $('#goal-status').textContent = percent >= 100 ? '🎯 Ціль виконана' : `${percent}%`;
  $('#goal-status').classList.toggle('done', percent >= 100);
  $('#goal-left').textContent = percent >= 100 ? 'Сьогодні ціль закрито' : `Залишилось ${(goal-total).toLocaleString('uk-UA')}`;
  if ('setAppBadge' in navigator && percent >= 100) navigator.setAppBadge(1).catch(() => {});
  $('#best-streak-inline').textContent = `Рекорд: ${bestStreak()} ${pluralDays(bestStreak())}`;
}

function renderAll() { renderHome(); renderExercises(); renderCalendar(); renderSummary(); renderSettingsUI(); }

function renderHome() {
  const total = dayTotal(state.selectedDate);
  $('#today-total').textContent = total.toLocaleString('uk-UA');
  $('#today-label').textContent = formatFullDate(state.selectedDate);
  $('#hero-streak').textContent = `🔥 ${currentStreak()} ${pluralDays(currentStreak())} поспіль`;

  const quick = state.exercises.slice(0, 6);
  $('#quick-exercises').innerHTML = quick.length ? quick.map(exercise => {
    const cat = categoryById(exercise.categoryId);
    const amount = Number(dayData(state.selectedDate)[exercise.id] || 0);
    return `<button class="exercise-card hover-lift" data-exercise-id="${exercise.id}">
      <div><div class="exercise-icon">${escapeHtml(exercise.icon || '✦')}</div><div class="exercise-name">${escapeHtml(exercise.name)}</div></div>
      <div class="exercise-meta">${escapeHtml(cat?.name || '')} · ${amount} сьогодні</div>
    </button>`;
  }).join('') : '<div class="empty-card">Створи першу вправу у розділі «Вправи».</div>';

  $$('#quick-exercises [data-exercise-id]').forEach(button => button.addEventListener('click', () => openLogModal(exerciseById(button.dataset.exerciseId))));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = parseDate(state.selectedDate); d.setDate(d.getDate() - (6 - i)); return localDateKey(d);
  });
  const totals = days.map(dayTotal); const max = Math.max(...totals, 1);
  $('#week-total').textContent = totals.reduce((a,b) => a+b, 0).toLocaleString('uk-UA');
  $('#week-chart').innerHTML = days.map((day, i) => `
    <div class="chart-day">
      <span class="chart-num">${totals[i] || ''}</span>
      <div class="chart-value"><div class="chart-bar ${day === state.selectedDate ? 'today' : ''}" style="height:${Math.max(4, Math.round((totals[i]/max)*82))}px"></div></div>
      <span class="chart-label">${parseDate(day).toLocaleDateString('uk-UA',{weekday:'short'}).replace('.','')}</span>
    </div>`).join('');
}

function renderExercises() {
  const root = $('#exercise-sections');
  root.innerHTML = state.categories.length ? state.categories.map(category => {
    const exercises = exercisesInCategory(category.id);
    return `<section class="exercise-section" data-category="${category.id}">
      <div class="section-headline">
        <div class="section-title-wrap"><span class="section-icon">${escapeHtml(category.icon || '◉')}</span><div><h3>${escapeHtml(category.name)}</h3><span>${exercises.length} ${exercises.length === 1 ? 'вправа' : exercises.length < 5 ? 'вправи' : 'вправ'}</span></div></div>
        <div class="section-actions">
          <button class="mini-add" data-add-section="${category.id}" title="Додати вправу" aria-label="Додати вправу до розділу ${escapeHtml(category.name)}">＋</button>
          <button class="mini-more" data-section-menu="${category.id}" title="Керування розділом" aria-label="Керування розділом">•••</button>
        </div>
      </div>
      <div class="exercise-list">${exercises.length ? exercises.map(ex => {
        const amount = Number(dayData(state.selectedDate)[ex.id] || 0);
        return `<div class="exercise-row hover-lift">
          <button class="exercise-row-main" data-log-id="${ex.id}"><span class="row-icon">${escapeHtml(ex.icon || '✦')}</span><span><b>${escapeHtml(ex.name)}</b><small>${escapeHtml(ex.hint || '')} · ${amount} сьогодні</small></span></button>
          <div class="row-actions"><button class="add-small" data-add-id="${ex.id}" aria-label="Додати ${escapeHtml(ex.name)}">＋</button><button class="delete-small" data-delete-exercise="${ex.id}" title="Видалити вправу" aria-label="Видалити вправу">🗑</button></div>
        </div>`;
      }).join('') : '<div class="empty-inline">У цьому розділі поки немає вправ.</div>'}</div>
    </section>`;
  }).join('') : `<div class="empty-card"><strong>Розділів немає</strong><p>Створи свій розділ або віднови стандартні вправи.</p><button class="secondary-btn" id="restore-defaults-inline">↻ Відновити стандартні</button></div>`;

  $$('#exercise-sections [data-log-id]').forEach(btn => btn.addEventListener('click', () => openLogModal(exerciseById(btn.dataset.logId))));
  $$('#exercise-sections [data-add-id]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openLogModal(exerciseById(btn.dataset.addId)); }));
  $$('#exercise-sections [data-add-section]').forEach(btn => btn.addEventListener('click', () => { openBuilder('exercise'); $('#exercise-category').value = btn.dataset.addSection; }));
  $$('#exercise-sections [data-delete-exercise]').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); deleteExercise(btn.dataset.deleteExercise); }));
  $$('#exercise-sections [data-section-menu]').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); openCategoryMenu(btn.dataset.sectionMenu, btn); }));
  $('#restore-defaults-inline')?.addEventListener('click', restoreDefaultLibrary);
}

function openCategoryMenu(id, anchor) {
  const category = categoryById(id);
  if (!category) return;
  closeCategoryMenu();
  const menu = document.createElement('div');
  menu.className = 'category-menu';
  menu.innerHTML = `
    <button data-menu-add>＋ Додати вправу</button>
    <button data-menu-restore>↻ Відновити стандартні</button>
    <button class="danger-menu" data-menu-delete>🗑 Видалити розділ</button>`;
  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = `${Math.min(window.innerHeight - 160, r.bottom + 8)}px`;
  menu.style.left = `${Math.max(12, Math.min(window.innerWidth - 200, r.right - 192))}px`;
  menu.querySelector('[data-menu-add]').addEventListener('click', () => {
    closeCategoryMenu();
    openBuilder('exercise');
    $('#exercise-category').value = id;
  });
  menu.querySelector('[data-menu-restore]').addEventListener('click', () => {
    closeCategoryMenu();
    restoreDefaultLibrary();
  });
  menu.querySelector('[data-menu-delete]').addEventListener('click', () => {
    closeCategoryMenu();
    deleteCategory(id);
  });
  setTimeout(() => document.addEventListener('click', categoryMenuOutside, { once: true }), 0);
  window.__repTrackCategoryMenu = menu;
}
function categoryMenuOutside(e) {
  if (window.__repTrackCategoryMenu && !window.__repTrackCategoryMenu.contains(e.target)) closeCategoryMenu();
}
function closeCategoryMenu() {
  const menu = window.__repTrackCategoryMenu;
  if (menu) menu.remove();
  window.__repTrackCategoryMenu = null;
}

function deleteExercise(id) {
  const ex = exerciseById(id); if (!ex) return;
  if (!confirm(`Видалити вправу «${ex.name}»?\n\nЇї записи в календарі також буде видалено.\n\nНатисни OK, щоб підтвердити.`)) return;
  state.exercises = state.exercises.filter(item => item.id !== id);
  Object.keys(state.logs).forEach(day => { if (state.logs[day]?.[id] != null) delete state.logs[day][id]; if (!Object.keys(state.logs[day] || {}).length) delete state.logs[day]; });
  persistLibrary(); saveLogs(); renderAll(); toast('Вправу видалено');
}

function deleteCategory(id) {
  const category = categoryById(id); if (!category) return;
  const exs = exercisesInCategory(id);
  const detail = exs.length ? `Буде видалено також ${exs.length} ${exs.length === 1 ? 'вправу' : exs.length < 5 ? 'вправи' : 'вправ'} та їхню історію.` : 'Розділ порожній.';
  const ok = confirm(`Видалити розділ «${category.name}»?\n\n${detail}\n\nЦю дію можна скасувати лише вручну, відновивши стандартну бібліотеку.`);
  if (!ok) return;
  const ids = new Set(exs.map(e => e.id));
  state.categories = state.categories.filter(c => c.id !== id);
  state.exercises = state.exercises.filter(e => e.categoryId !== id);
  Object.keys(state.logs).forEach(day => { ids.forEach(exId => delete state.logs[day]?.[exId]); if (!Object.keys(state.logs[day] || {}).length) delete state.logs[day]; });
  persistLibrary(); saveLogs(); renderAll(); toast('Розділ видалено');
}

function restoreDefaultLibrary() {
  const existingCategoryIds = new Set(state.categories.map(c => c.id));
  const existingExerciseIds = new Set(state.exercises.map(e => e.id));
  for (const cat of DEFAULT_CATEGORIES) if (!existingCategoryIds.has(cat.id)) state.categories.push({...cat});
  for (const ex of DEFAULT_EXERCISES) if (!existingExerciseIds.has(ex.id)) state.exercises.push({...ex});
  persistLibrary(); renderAll(); toast('Стандартні розділи та вправи відновлено');
}

function bindCalendarControls() {
  $('#prev-month').addEventListener('click', () => { state.calendarDate.setMonth(state.calendarDate.getMonth() - 1); renderCalendar(); });
  $('#next-month').addEventListener('click', () => { state.calendarDate.setMonth(state.calendarDate.getMonth() + 1); renderCalendar(); });
}

function renderCalendar() {
  const y = state.calendarDate.getFullYear(), m = state.calendarDate.getMonth();
  $('#calendar-month').textContent = state.calendarDate.toLocaleDateString('uk-UA', { month:'long', year:'numeric' });
  const first = new Date(y,m,1); const firstWeekday = (first.getDay()+6)%7; const daysInMonth = new Date(y,m+1,0).getDate(); const cells=[];
  for (let i=0;i<firstWeekday;i++) cells.push('<div class="calendar-cell empty"></div>');
  for (let day=1;day<=daysInMonth;day++) {
    const key=localDateKey(new Date(y,m,day)), total=dayTotal(key), selected=key===state.selectedDate, today=key===localDateKey();
    const intensity=Math.min(100,total?25+Math.round(Math.min(total,200)/200*75):0);
    cells.push(`<button class="calendar-cell ${selected?'selected':''} ${today?'today':''} ${total?'has-data':''}" data-date="${key}"><span class="calendar-date">${day}</span>${total?`<span class="calendar-count">${total>999?'999+':total}</span>`:''}<span class="calendar-dot"><i style="width:${intensity}%"></i></span></button>`);
  }
  $('#calendar-grid').innerHTML=cells.join('');
  $$('#calendar-grid [data-date]').forEach(btn=>btn.addEventListener('click',()=>{state.selectedDate=btn.dataset.date; renderCalendar(); renderHome(); renderExercises();}));
  renderDayDetail();
}

function renderDayDetail() {
  const entries=Object.entries(dayData(state.selectedDate)).filter(([,reps])=>Number(reps)>0);
  if (!entries.length) { $('#day-detail').className='day-detail empty'; $('#day-detail').innerHTML=`<div><strong>${escapeHtml(formatFullDate(state.selectedDate))}</strong><p class="muted" style="margin-top:5px">У цей день ще немає записів.</p></div>`; return; }
  $('#day-detail').className='day-detail';
  const total=entries.reduce((sum,[,reps])=>sum+Number(reps),0);
  $('#day-detail').innerHTML=`<div class="detail-head"><div><p class="eyebrow">Обраний день</p><strong>${escapeHtml(formatFullDate(state.selectedDate))}</strong></div><div class="detail-total">${total}</div></div>${entries.map(([id,reps])=>{
    const ex=exerciseById(id); if(!ex) return '';
    const cat=categoryById(ex.categoryId);
    return `<div class="detail-row"><div><div class="detail-name">${escapeHtml(ex.name)}</div><div class="detail-type">${escapeHtml(cat?.name||'Вправа')}</div></div><div class="detail-actions"><button class="detail-edit" data-edit-log="${ex.id}">${Number(reps)}</button><button class="detail-delete" data-delete-log="${ex.id}" aria-label="Видалити запис">×</button></div></div>`;
  }).join('')}`;
  $$('#day-detail [data-edit-log]').forEach(btn=>btn.addEventListener('click',()=>openLogModal(exerciseById(btn.dataset.editLog))));
  $$('#day-detail [data-delete-log]').forEach(btn=>btn.addEventListener('click',()=>deleteLogEntry(btn.dataset.deleteLog,state.selectedDate)));
}

function deleteLogEntry(exerciseId,date) {
  const ex=exerciseById(exerciseId); if(!ex || !state.logs[date]?.[exerciseId]) return;
  delete state.logs[date][exerciseId];
  if(!Object.keys(state.logs[date]).length) delete state.logs[date];
  saveLogs(); renderAll(); toast('Запис видалено');
}

function renderSettingsUI() {
  $('#daily-goal-input').value = state.settings.dailyGoal;
}

function renderSummary() {
  const allDays=Object.keys(state.logs), allReps=allDays.reduce((sum,day)=>sum+dayTotal(day),0), activeDays=allDays.filter(day=>dayTotal(day)>0).length;
  const sorted=[...allDays].sort((a,b)=>dayTotal(b)-dayTotal(a)); const bestDay=sorted[0];
  const current = currentStreak(), best = bestStreak();
  const topExercise=[...state.exercises].map(ex=>({ex,total:exerciseTotal(ex.id)})).sort((a,b)=>b.total-a.total)[0];
  $('#summary-grid').innerHTML=`<div class="summary-card"><span class="summary-value">${current}</span><span class="summary-label">🔥 поточний streak</span></div><div class="summary-card"><span class="summary-value">${best}</span><span class="summary-label">🏆 найкращий streak</span></div><div class="summary-card"><span class="summary-value">${allReps.toLocaleString('uk-UA')}</span><span class="summary-label">усі повторення</span></div><div class="summary-card"><span class="summary-value">${activeDays}</span><span class="summary-label">активних днів</span></div><div class="summary-card"><span class="summary-value">${bestDay?dayTotal(bestDay):0}</span><span class="summary-label">рекорд за день${bestDay?` · ${formatShortDate(bestDay)}`:''}</span></div><div class="summary-card"><span class="summary-value">${topExercise?.total||0}</span><span class="summary-label">топ вправа${topExercise?.total?` · ${escapeHtml(topExercise.ex.name)}`:''}</span></div>`;

  const totals=[...state.exercises].map(ex=>({ex,total:exerciseTotal(ex.id)})).filter(item=>item.total>0).sort((a,b)=>b.total-a.total); const max=Math.max(...totals.map(x=>x.total),1);
  $('#exercise-summary').innerHTML=totals.length?totals.map(item=>`<div class="summary-row"><div class="summary-main"><div class="summary-row-top"><strong>${escapeHtml(item.ex.name)}</strong><span>${item.total}</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.round((item.total/max)*100)}%"></div></div></div></div>`).join(''):'<p class="muted">Поки немає статистики. Додай перший підхід.</p>';
}

function toast(text) {
  const existing=$('.toast'); if(existing) existing.remove();
  const el=document.createElement('div'); el.className='toast'; el.textContent=text; document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show')); setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220);},1800);
}

init();
