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
  theme: localStorage.getItem('repTheme') || 'dark'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadCategories() {
  try {
    const raw = JSON.parse(localStorage.getItem('repTrackCategories') || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch {}
  const categories = [...DEFAULT_CATEGORIES];
  localStorage.setItem('repTrackCategories', JSON.stringify(categories));
  return categories;
}

function loadExercises() {
  try {
    const raw = JSON.parse(localStorage.getItem('repTrackExercises') || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
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

function init() {
  migrateLegacyData();
  applyTheme(state.theme);
  bindNavigation();
  bindTheme();
  bindModal();
  bindBuilder();
  bindCalendarControls();
  $('#today-label').textContent = formatFullDate(state.selectedDate);
  renderAll();
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
  setTimeout(() => $('#modal-reps').select(), 50);
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
  $('#save-category').addEventListener('click', createCategory);
  $('#save-exercise').addEventListener('click', createExercise);
}

function openBuilder(mode = 'category') {
  setBuilderMode(mode);
  $('#builder-modal').classList.remove('hidden');
  $('#category-name').focus();
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

function renderAll() { renderHome(); renderExercises(); renderCalendar(); renderSummary(); }

function renderHome() {
  const total = dayTotal(state.selectedDate);
  $('#today-total').textContent = total.toLocaleString('uk-UA');
  $('#today-label').textContent = formatFullDate(state.selectedDate);

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
  root.innerHTML = state.categories.map(category => {
    const exercises = exercisesInCategory(category.id);
    return `<section class="exercise-section" data-category="${category.id}">
      <div class="section-headline">
        <div class="section-title-wrap"><span class="section-icon">${escapeHtml(category.icon || '◉')}</span><div><h3>${escapeHtml(category.name)}</h3><span>${exercises.length} ${exercises.length === 1 ? 'вправа' : exercises.length < 5 ? 'вправи' : 'вправ'}</span></div></div>
        <div class="section-actions">
          <button class="mini-add" data-add-section="${category.id}" title="Додати вправу">＋</button>
          ${category.custom ? `<button class="mini-delete" data-delete-section="${category.id}" title="Видалити розділ">⌫</button>` : ''}
        </div>
      </div>
      <div class="exercise-list">${exercises.length ? exercises.map(ex => {
        const amount = Number(dayData(state.selectedDate)[ex.id] || 0);
        return `<div class="exercise-row hover-lift">
          <button class="exercise-row-main" data-log-id="${ex.id}"><span class="row-icon">${escapeHtml(ex.icon || '✦')}</span><span><b>${escapeHtml(ex.name)}</b><small>${escapeHtml(ex.hint || '')} · ${amount} сьогодні</small></span></button>
          <div class="row-actions"><button class="add-small" data-add-id="${ex.id}" aria-label="Додати ${escapeHtml(ex.name)}">＋</button>${ex.custom ? `<button class="remove-small" data-delete-exercise="${ex.id}" aria-label="Видалити вправу">×</button>` : ''}</div>
        </div>`;
      }).join('') : '<div class="empty-inline">У цьому розділі поки немає вправ.</div>'}</div>
    </section>`;
  }).join('');

  $$('#exercise-sections [data-log-id]').forEach(btn => btn.addEventListener('click', () => openLogModal(exerciseById(btn.dataset.logId))));
  $$('#exercise-sections [data-add-id]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openLogModal(exerciseById(btn.dataset.addId)); }));
  $$('#exercise-sections [data-add-section]').forEach(btn => btn.addEventListener('click', () => { openBuilder('exercise'); $('#exercise-category').value = btn.dataset.addSection; }));
  $$('#exercise-sections [data-delete-exercise]').forEach(btn => btn.addEventListener('click', () => deleteCustomExercise(btn.dataset.deleteExercise)));
  $$('#exercise-sections [data-delete-section]').forEach(btn => btn.addEventListener('click', () => deleteCustomCategory(btn.dataset.deleteSection)));
}

function deleteCustomExercise(id) {
  const ex = exerciseById(id); if (!ex) return;
  if (!confirm(`Видалити вправу «${ex.name}»?`)) return;
  state.exercises = state.exercises.filter(item => item.id !== id);
  Object.keys(state.logs).forEach(day => { if (state.logs[day]?.[id] != null) delete state.logs[day][id]; if (!Object.keys(state.logs[day] || {}).length) delete state.logs[day]; });
  persistLibrary(); saveLogs(); renderAll(); toast('Вправу видалено');
}

function deleteCustomCategory(id) {
  const category = categoryById(id); if (!category || !category.custom) return;
  const exs = exercisesInCategory(id);
  if (!confirm(`Видалити розділ «${category.name}»${exs.length ? ` разом із ${exs.length} вправами` : ''}?`)) return;
  const ids = new Set(exs.map(e => e.id));
  state.categories = state.categories.filter(c => c.id !== id);
  state.exercises = state.exercises.filter(e => e.categoryId !== id);
  Object.keys(state.logs).forEach(day => { ids.forEach(exId => delete state.logs[day]?.[exId]); if (!Object.keys(state.logs[day] || {}).length) delete state.logs[day]; });
  persistLibrary(); saveLogs(); renderAll(); toast('Розділ видалено');
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

function renderSummary() {
  const allDays=Object.keys(state.logs), allReps=allDays.reduce((sum,day)=>sum+dayTotal(day),0), activeDays=allDays.filter(day=>dayTotal(day)>0).length;
  const sorted=[...allDays].sort((a,b)=>dayTotal(b)-dayTotal(a)); const bestDay=sorted[0];
  const topExercise=[...state.exercises].map(ex=>({ex,total:exerciseTotal(ex.id)})).sort((a,b)=>b.total-a.total)[0];
  $('#summary-grid').innerHTML=`<div class="summary-card"><span class="summary-value">${allReps.toLocaleString('uk-UA')}</span><span class="summary-label">усі повторення</span></div><div class="summary-card"><span class="summary-value">${activeDays}</span><span class="summary-label">активних днів</span></div><div class="summary-card"><span class="summary-value">${bestDay?dayTotal(bestDay):0}</span><span class="summary-label">рекорд за день${bestDay?` · ${formatShortDate(bestDay)}`:''}</span></div><div class="summary-card"><span class="summary-value">${topExercise?.total||0}</span><span class="summary-label">топ вправа${topExercise?.total?` · ${escapeHtml(topExercise.ex.name)}`:''}</span></div>`;

  const totals=[...state.exercises].map(ex=>({ex,total:exerciseTotal(ex.id)})).filter(item=>item.total>0).sort((a,b)=>b.total-a.total); const max=Math.max(...totals.map(x=>x.total),1);
  $('#exercise-summary').innerHTML=totals.length?totals.map(item=>`<div class="summary-row"><div class="summary-main"><div class="summary-row-top"><strong>${escapeHtml(item.ex.name)}</strong><span>${item.total}</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.round((item.total/max)*100)}%"></div></div></div></div>`).join(''):'<p class="muted">Поки немає статистики. Додай перший підхід.</p>';
}

function toast(text) {
  const existing=$('.toast'); if(existing) existing.remove();
  const el=document.createElement('div'); el.className='toast'; el.textContent=text; document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show')); setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220);},1800);
}

init();
