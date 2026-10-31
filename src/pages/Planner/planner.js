/*
 * Dough planner: services, dough plan, pizza picks, shopping list and prep list.
 *
 * Plain DOM code (no React) so it matches the version prototyped in Claude.
 * mountPlanner(root, deps) renders into `root` and returns a cleanup function.
 *
 * deps.store     - {doc(path) -> {set(data), onSnapshot(next, error)}} over Firestore
 *                  (paths: 'ref/snapshot', 'plan/current', 'plan/checks')
 * deps.canWrite  - whether this person may change the plan
 * deps.isAdmin   - shows "Refresh from sheets"
 * deps.refresh   - async () => re-read the Google Sheets on the server
 */

const MARKUP = '<div class="wrap">\n  <header class="top">\n    <h1>Dough planner</h1>\n    <div class="status"><span id="data-status">Loading recipe and menu…</span><button type="button" class="btn quiet" id="refresh" hidden>Refresh from sheets</button><span id="save-status"></span></div>\n    <nav class="tabs" role="tablist" aria-label="Planner pages">\n      <button type="button" role="tab" id="tab-plan" aria-controls="page-plan" aria-selected="true" data-tab="plan">Plan</button>\n      <button type="button" role="tab" id="tab-shop" aria-controls="page-shop" aria-selected="false" data-tab="shop">Shopping list</button>\n      <button type="button" role="tab" id="tab-prep" aria-controls="page-prep" aria-selected="false" data-tab="prep">Prep</button>\n    </nav>\n  </header>\n\n  <p class="ro" id="readonly" hidden>You can look but not change this plan. Ask Jaron to add your account to the staff list.</p>\n\n  <section id="page-plan" role="tabpanel" aria-labelledby="tab-plan" class="wrap" style="padding:0;max-width:none">\n    <article class="card">\n      <h2>Services</h2>\n      <p class="note">Pizza Friday uses recent demand. Events use guests × pizzas per guest. Type a count to override.</p>\n      <div id="services"></div>\n      <div class="row">\n        <button type="button" class="btn" id="add-svc">Add a service</button>\n      </div>\n      <details class="tweaks">\n        <summary>Yeast, water and timing</summary>\n        <div class="row">\n          <label class="field">Extra for safety (%)<input type="number" id="t-buffer" min="0" max="100" step="5" inputmode="numeric"></label>\n          <label class="field">Mix days before service<input type="number" id="t-lead" min="0" max="5" step="1" inputmode="numeric"></label>\n          <label class="field">Yeast (% of recipe)<input type="number" id="t-yeast" min="10" max="300" step="5" inputmode="numeric"></label>\n          <label class="field">Cold water (% of recipe)<input type="number" id="t-water" min="50" max="150" step="1" inputmode="numeric"></label>\n          <button type="button" class="btn" id="t-reset">Reset to saved settings</button>\n        </div>\n      </details>\n    </article>\n\n    <article class="card">\n      <h2>Dough plan</h2>\n      <p class="note" id="plan-note">Shared mix days are combined. Big days split into even mixer batches.</p>\n      <div id="plan"></div>\n    </article>\n\n    <article class="card">\n      <h2>Pizzas</h2>\n      <p class="note">Tap the pizzas on the menu. The planned dough splits evenly across them.</p>\n      <div class="chips" id="chips"></div>\n      <div class="row">\n        <button type="button" class="btn" id="split">Split evenly again</button>\n        <button type="button" class="btn" id="clear">Clear</button>\n        <span class="seg" role="group" aria-label="Each tap">Each tap\n          <button type="button" class="btn" data-step="1" aria-pressed="false">1</button>\n          <button type="button" class="btn" data-step="5" aria-pressed="true">5</button>\n          <button type="button" class="btn" data-step="10" aria-pressed="false">10</button>\n        </span>\n      </div>\n      <p class="note" id="count-line"></p>\n      <div id="counters"></div>\n    </article>\n\n    <article class="card">\n      <h2>Recent Pizza Fridays</h2>\n      <p class="note" id="hist-note">Demand is sold + comped + could have sold more.</p>\n      <div style="overflow-x:auto"><table class="hist" id="hist"></table></div>\n    </article>\n  </section>\n\n  <section id="page-shop" role="tabpanel" aria-labelledby="tab-shop" hidden>\n    <article class="card">\n      <h2>Shopping list</h2>\n      <p class="note" id="shop-line"></p>\n      <div class="row"><button type="button" class="btn quiet" id="uncheck">Uncheck everything</button></div>\n      <div class="list" id="shoplist"></div>\n    </article>\n  </section>\n\n  <section id="page-prep" role="tabpanel" aria-labelledby="tab-prep" hidden>\n    <article class="card">\n      <h2>Prep list</h2>\n      <p class="note">Day by day for the services on the Plan tab. Amounts split each service\'s share of the pizzas you picked.</p>\n      <div class="row"><button type="button" class="btn quiet" id="prep-uncheck">Uncheck everything</button></div>\n      <div class="list" id="preplist"></div>\n    </article>\n  </section>\n</div>';

export function mountPlanner(root, deps) {
  root.innerHTML = MARKUP;

  const POOLISH_YEAST_PER_G = 0.12 / 84; /* class recipe: 42 g water + 42 g flour + 0.12 g yeast */
  const PPG_SETTING = {wedding: 'pizzas per guest wedding', sides: 'pizzas per guest with other food', meal: 'pizzas per guest pizza only'};
  const PPG_FALLBACK = {wedding: 0.5, sides: 0.45, meal: 0.8};
  const TYPES = [['pf', 'Pizza Friday'], ['wedding', 'Wedding'], ['sides', 'Party with other food'], ['meal', 'Pizza is the meal']];
  const TYPE_SHORT = {pf: 'Pizza Friday', wedding: 'wedding', sides: 'party', meal: 'party'};

  /* ---------- State ---------- */
  let REF = null;      /* shared copy of sheet data */
  let PLAN = null;     /* shared plan */
  let CHECKED = [];    /* shared shopping checkmarks */
  let db = null, canWrite = true, step = 5;
  const $ = (s) => root.querySelector(s);

  /* ---------- Helpers ---------- */
  const parse = (s) => new Date(s + 'T00:00:00Z');
  const addDays = (s, n) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = (s) => { const d = parse(s); return DAYS[d.getUTCDay()] + ' ' + MONS[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
  /* Dates relative to today: Today, Tomorrow, Tuesday (this week), Next Tue, otherwise the date. */
  const FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayStr = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };
  const rel = (s) => {
    const diff = Math.round((parse(s) - parse(todayStr())) / 86400000);
    const d = parse(s);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1 && diff < 7) return FULL[d.getUTCDay()];
    if (diff >= 7 && diff < 14) return 'Next ' + DAYS[d.getUTCDay()];
    return day(s);
  };
  const g = (v) => (v >= 100 ? Math.round(v).toLocaleString('en-US') : (Math.round(v * 10) / 10).toLocaleString('en-US')) + ' g';
  const amount = (v) => (v < 100 ? g(v) : kgLb(v));
  const kgLb = (v) => (v >= 1000 ? (v / 1000).toFixed(2) + ' kg' : Math.round(v) + ' g') + ' · ' + (v / 453.592).toFixed(1) + ' lb';
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const uid = () => Math.random().toString(36).slice(2, 9);
  const nextFriday = () => { const n = new Date(); const t = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); t.setUTCDate(t.getUTCDate() + ((5 - t.getUTCDay() + 7) % 7)); return t.toISOString().slice(0, 10); };
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().replace(/s\b/g, '');
  const isDessert = (n) => /zookie/i.test(n);

  const setting = (name) => { if (!REF) return null; const r = REF.settings.find((x) => x.setting.toLowerCase() === name); return r ? r.value : null; };
  const savedTweaks = () => ({
    buffer: setting('safety percent') ?? 10,
    lead: setting('mix days before service') ?? 2,
    yeast: setting('yeast percent') ?? 100,
    water: setting('cold water percent') ?? 100
  });
  const tweaks = () => ({...savedTweaks(), ...(PLAN && PLAN.tweaks ? PLAN.tweaks : {})});
  const mixerCap = () => { const v = setting('mixer capacity'); return v && v > 0 ? v : 120; };

  /* ---------- Recipe math ---------- */
  const perBall = () => {
    if (!REF) return null;
    const get = (item) => { const r = REF.recipe.find((x) => x.item.toLowerCase() === item); return r ? r.amount : 0; };
    const ball = get('pizza dough weight (grams)'), total = get('total weight');
    if (!ball || !total) return null;
    const f = ball / total, out = {ball};
    ['cold water', 'warm water', 'yeast', 'salt', 'poolish', 'flour'].forEach((k) => { out[k] = get(k) * f; });
    return out;
  };
  const avgDemand = () => { if (!REF || !REF.nights.length) return null; const r = REF.nights.slice(0, 4); return r.reduce((s, x) => s + x.demand, 0) / r.length; };
  const perGuest = (s) => (s.ppg > 0 ? s.ppg : (setting(PPG_SETTING[s.type]) || PPG_FALLBACK[s.type] || null));
  const suggestion = (s) => {
    const raw = s.type === 'pf' ? avgDemand() : (s.guests || 0) * (perGuest(s) || 0);
    return raw ? Math.ceil(raw * (1 + (Number(tweaks().buffer) || 0) / 100)) : null;
  };
  const ballsFor = (s) => (s.balls != null && s.balls !== '' ? Number(s.balls) : suggestion(s)) || 0;
  const plannedBalls = () => (PLAN ? PLAN.services.filter((s) => s.date).reduce((t, s) => t + ballsFor(s), 0) : 0);

  /* Ingredients per active pizza, sauces broken down by their batch recipe. */
  const pizzaRows = () => {
    if (!REF) return [];
    const byKey = REF.amounts.map((a) => ({key: norm(a.topping), a}));
    const find = (t) => {
      const k = norm(t);
      return (byKey.find((x) => x.key === k) || byKey.filter((x) => k.endsWith(' ' + x.key)).sort((p, q) => q.key.length - p.key.length)[0] || {}).a || null;
    };
    const recipe = new Map();
    REF.sauces.forEach((s) => { const k = norm(s.sauce); if (!recipe.has(k)) recipe.set(k, {name: s.sauce, parts: []}); recipe.get(k).parts.push(s); });
    const alias = (name) => { let cur = name; for (let i = 0; i < 4; i++) { const r = recipe.get(norm(cur)); if (!r || r.parts.length !== 1 || !recipe.has(norm(r.parts[0].ingredient))) break; cur = recipe.get(norm(r.parts[0].ingredient)).name; } return cur; };
    const expand = (name, grams, top, depth) => {
      const r = recipe.get(norm(name));
      if (!r || depth > 4) return [{ingredient: name, grams, sauce: top}];
      const total = r.parts.reduce((s, p) => s + p.grams, 0) || 1;
      return r.parts.flatMap((p) => expand(p.ingredient, (grams * p.grams) / total, top || r.name, depth + 1));
    };
    const rows = [];
    REF.menu.forEach((p) => {
      p.toppings.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => {
        const hit = find(t);
        if (!hit || hit.grams == null) { rows.push({pizza: p.name, topping: hit ? hit.topping : t, grams: null, sauce: null}); return; }
        expand(alias(hit.topping), hit.grams, null, 0).forEach((x) => rows.push({pizza: p.name, topping: x.ingredient, grams: x.grams, sauce: x.sauce}));
      });
    });
    return rows;
  };

  /* ---------- Saving (debounced, one write at a time per document) ---------- */
  let planTimer = null, planWriting = false, planDirty = false, localPending = false;
  /* Each save is stamped with this tab's id and a counter, so late echoes of our own older saves are ignored. */
  const TAB = uid();
  let planRev = 0, checkRev = 0;
  const flushPlan = async () => {
    if (!db || !canWrite || !PLAN) return;
    if (planWriting) { planDirty = true; return; }
    planWriting = true; planDirty = false;
    $('#save-status').textContent = 'Saving…';
    try { planRev += 1; await db.doc('plan/current').set({...JSON.parse(JSON.stringify(PLAN)), _by: TAB, _rev: planRev}); $('#save-status').textContent = 'Saved'; if (!planDirty) localPending = false; }
    catch (e) { handleWriteError(e); }
    planWriting = false;
    if (planDirty) flushPlan();
  };
  const savePlan = () => { localPending = true; clearTimeout(planTimer); planTimer = setTimeout(flushPlan, 600); };
  let checkWriting = Promise.resolve();
  const saveChecks = () => {
    if (!db || !canWrite) return;
    checkRev += 1;
    const body = {checked: CHECKED.slice(), _by: TAB, _rev: checkRev};
    checkWriting = checkWriting.then(() => db.doc('plan/checks').set(body)).catch(handleWriteError);
  };
  const handleWriteError = (e) => {
    if (e && (e.code === 'invalid_argument' || e.code === 'permission-denied')) { setReadOnly(true); $('#save-status').textContent = ''; return; }
    if (e && e.code === 'quota_exceeded') { $('#save-status').textContent = 'Not saved: storage is full.'; return; }
    $('#save-status').textContent = 'Not saved. Check your connection and try again.';
  };
  const setReadOnly = (ro) => {
    canWrite = !ro;
    $('#readonly').hidden = !ro;
    root.querySelectorAll('#page-plan input, #page-plan select, #page-plan button, #uncheck, #prep-uncheck').forEach((x) => { x.disabled = ro; });
    root.querySelectorAll('.item input').forEach((x) => { x.disabled = ro; });
  };

  /* ---------- Rendering ---------- */
  const busy = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'SELECT') && a.closest('#services, details.tweaks, #counters'); };
  let pending = false;
  /* Pizza counts follow the planned dough until someone adjusts a count by hand. */
  const syncCounts = () => {
    if (!PLAN || !REF || PLAN.manualCounts || !canWrite) return false;
    const total = Object.entries(PLAN.counts).filter(([k]) => !isDessert(k)).reduce((a, [, v]) => a + v, 0);
    if (!PLAN.picked.some((n) => !isDessert(n)) || total === plannedBalls()) return false;
    spread(); savePlan();
    return true;
  };
  const renderAll = () => {
    if (busy()) { pending = true; return; }
    pending = false;
    syncCounts();
    renderServices(); renderTweaks(); renderPlan(); renderChips(); renderCounters(); renderHist(); renderShop();
  };
  const onFocusOut = () => setTimeout(() => { if (pending && !busy()) renderAll(); }, 0);
  root.addEventListener('focusout', onFocusOut);

  const renderServices = () => {
    const box = $('#services');
    box.replaceChildren();
    if (!PLAN) return;
    if (!PLAN.services.length) box.append(el('p', 'empty', 'No services yet.'));
    PLAN.services.forEach((s) => {
      const wrap = el('div', 'svc');
      const r1 = el('div', 'row');
      const f = (label, input) => { const l = el('label', 'field', label); l.append(input); return l; };
      const date = el('input'); date.type = 'date'; date.value = s.date || ''; date.id = 'd-' + s.id;
      date.addEventListener('change', () => { s.date = date.value; savePlan(); renderLive(); });
      const type = el('select'); type.id = 't-' + s.id;
      TYPES.forEach(([v, t]) => { const o = el('option', null, t); o.value = v; if (s.type === v) o.selected = true; type.append(o); });
      type.addEventListener('change', () => { s.type = type.value; savePlan(); type.blur(); renderAll(); });
      r1.append(f('Service date', date), f('Type', type));
      const r2 = el('div', 'row');
      if (s.type !== 'pf') {
        const guests = el('input'); guests.type = 'number'; guests.min = '0'; guests.inputMode = 'numeric'; guests.value = s.guests ?? ''; guests.id = 'g-' + s.id;
        guests.addEventListener('input', () => { s.guests = Number(guests.value) || 0; savePlan(); renderLive(); });
        const ppg = el('input'); ppg.type = 'number'; ppg.min = '0'; ppg.step = '0.05'; ppg.inputMode = 'decimal'; ppg.value = s.ppg ?? ''; ppg.placeholder = String(setting(PPG_SETTING[s.type]) ?? PPG_FALLBACK[s.type]); ppg.id = 'p-' + s.id;
        ppg.addEventListener('input', () => { s.ppg = ppg.value === '' ? null : Number(ppg.value); savePlan(); renderLive(); });
        r2.append(f('Guests', guests), f('Per guest', ppg));
      }
      const balls = el('input'); balls.type = 'number'; balls.min = '0'; balls.inputMode = 'numeric'; balls.placeholder = 'Suggested'; balls.value = s.balls ?? ''; balls.id = 'b-' + s.id;
      balls.addEventListener('input', () => { s.balls = balls.value === '' ? null : Number(balls.value); savePlan(); renderLive(); });
      r2.append(f('Dough balls', balls));
      const rm = el('button', 'btn quiet', 'Remove'); rm.type = 'button';
      rm.addEventListener('click', () => { PLAN.services = PLAN.services.filter((x) => x !== s); savePlan(); renderAll(); });
      r2.append(rm);
      const sugg = el('div', 'sugg'); sugg.dataset.svc = s.id;
      wrap.append(r1, r2, sugg);
      box.append(wrap);
    });
    renderSuggs();
    if (!canWrite) setReadOnly(true);
  };
  const renderSuggs = () => {
    root.querySelectorAll('.sugg[data-svc]').forEach((n) => {
      const s = PLAN.services.find((x) => x.id === n.dataset.svc);
      if (!s) return;
      const v = suggestion(s);
      n.replaceChildren(document.createTextNode('Suggested: '));
      const b = el('b', null, v ? v.toLocaleString('en-US') + ' balls' : '—');
      n.append(b);
      if (s.type !== 'pf' && v) n.append(document.createTextNode(' (' + perGuest(s) + ' per guest)'));
    });
  };
  /* Values that change while typing: update outputs without rebuilding inputs. */
  const renderLive = () => { if (syncCounts() && !document.activeElement?.closest('#counters')) renderCounters(); renderSuggs(); renderPlan(); renderCountLine(); renderShop(); };

  const renderTweaks = () => {
    const t = tweaks();
    [['#t-buffer', 'buffer'], ['#t-lead', 'lead'], ['#t-yeast', 'yeast'], ['#t-water', 'water']].forEach(([id, k]) => { const i = $(id); if (document.activeElement !== i) i.value = t[k]; });
  };

  const renderPlan = () => {
    const box = $('#plan');
    box.replaceChildren();
    const per = perBall();
    if (!per || !PLAN) { box.append(el('p', 'empty', REF ? 'The dough recipe tab is missing its ball weight or total.' : 'Waiting for the recipe.')); return; }
    const t = tweaks();
    const lead = Math.max(0, Math.min(5, Number(t.lead) || 0));
    const svcs = PLAN.services.filter((s) => s.date).map((s) => ({...s, use: ballsFor(s)})).filter((s) => s.use > 0);
    if (!svcs.length) { box.append(el('p', 'empty', 'Add a service date to see the plan.')); return; }
    const groups = new Map();
    svcs.forEach((s) => { const k = addDays(s.date, -lead); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); });
    [...groups.keys()].sort().forEach((mix) => {
      const list = groups.get(mix);
      const balls = list.reduce((a, s) => a + s.use, 0);
      const n = Math.max(1, Math.ceil(balls / mixerCap()));
      const size = Math.ceil(balls / n);
      const p = per.poolish * size;
      const sec = el('section', 'batch');
      sec.append(el('h3', null, balls.toLocaleString('en-US') + ' balls for ' + list.map((s) => TYPE_SHORT[s.type] + ' ' + rel(s.date)).join(' + ')));
      const steps = el('div', 'steps');
      const card = (title, when, rows) => {
        const c = el('div', 'stepcard');
        c.append(el('h4', null, title), el('div', 'when', when));
        const tb = el('table', 'g');
        rows.forEach(([name, v, sub]) => { const tr = el('tr'); const a = el('td', null, name); if (sub) { a.append(el('div', 'when', sub)); } tr.append(a, el('td', 'n', g(v))); tb.append(tr); });
        c.append(tb); steps.append(c);
      };
      card(n === 1 ? 'Start poolish' : 'Start poolish: ' + n + ' containers', rel(addDays(mix, -1)) + ', evening' + (n === 1 ? '' : ' · per container'), [
        ['Water', p / 2], ['Flour', p / 2], ['Yeast', p * POOLISH_YEAST_PER_G]
      ]);
      card(n === 1 ? 'Mix dough' : 'Mix dough: ' + n + ' batches of ' + size, rel(mix) + (n === 1 ? '' : ' · per batch'), [
        ['Cold water', (per['cold water'] * size * (Number(t.water) || 100)) / 100],
        ['Warm water', per['warm water'] * size],
        ['Yeast', (per.yeast * size * (Number(t.yeast) || 100)) / 100],
        ['Salt', per.salt * size],
        ['Poolish', p, n === 1 ? 'All of it' : 'One container'],
        ['Flour', per.flour * size, ((per.flour * size) / 1000).toFixed(2) + ' kg']
      ]);
      sec.append(steps);
      box.append(sec);
    });
  };

  const names = () => (REF ? REF.menu.map((p) => p.name) : []);
  const spread = () => {
    const picked = names().filter((n) => PLAN.picked.includes(n) && !isDessert(n));
    const balls = plannedBalls();
    Object.keys(PLAN.counts).forEach((k) => { if (!PLAN.picked.includes(k)) delete PLAN.counts[k]; });
    if (!picked.length || !balls) return;
    picked.forEach((n, i) => { PLAN.counts[n] = Math.floor(balls / picked.length) + (i < balls % picked.length ? 1 : 0); });
  };
  const renderChips = () => {
    const box = $('#chips');
    box.replaceChildren();
    if (!PLAN) return;
    if (!names().length) { box.append(el('p', 'empty', 'Waiting for the menu.')); return; }
    names().forEach((n) => {
      const b = el('button', 'chip', n); b.type = 'button';
      b.setAttribute('aria-pressed', String(PLAN.picked.includes(n)));
      b.addEventListener('click', () => {
        if (PLAN.picked.includes(n)) PLAN.picked = PLAN.picked.filter((x) => x !== n); else PLAN.picked.push(n);
        PLAN.manualCounts = false; spread(); savePlan(); renderChips(); renderCounters(); renderShop();
      });
      box.append(b);
    });
    if (!canWrite) setReadOnly(true);
  };
  const renderCountLine = () => {
    if (!PLAN) return;
    const total = Object.entries(PLAN.counts).filter(([k]) => !isDessert(k)).reduce((a, [, v]) => a + v, 0);
    const planned = plannedBalls();
    $('#count-line').textContent = total.toLocaleString('en-US') + ' pizzas picked · ' + planned.toLocaleString('en-US') + ' dough balls planned' + (PLAN.manualCounts && total !== planned ? '. Counts were set by hand; tap Split evenly again to match the dough.' : '');
  };
  const renderCounters = () => {
    const box = $('#counters');
    box.replaceChildren();
    renderCountLine();
    if (!PLAN) return;
    const picked = names().filter((n) => PLAN.picked.includes(n));
    if (!picked.length) { box.append(el('p', 'empty', 'No pizzas picked yet.')); return; }
    picked.forEach((n, i) => {
      const row = el('div', 'counter');
      const lab = el('label', 'nm', n); lab.htmlFor = 'c-' + i;
      const ctl = el('span', 'step');
      const inp = el('input'); inp.type = 'number'; inp.min = '0'; inp.inputMode = 'numeric'; inp.id = 'c-' + i; inp.value = String(PLAN.counts[n] || 0);
      const set = (v) => { PLAN.counts[n] = Math.max(0, Math.round(v) || 0); PLAN.manualCounts = true; inp.value = String(PLAN.counts[n]); savePlan(); renderCountLine(); renderShop(); };
      inp.addEventListener('input', () => { PLAN.counts[n] = Math.max(0, Number(inp.value) || 0); PLAN.manualCounts = true; savePlan(); renderCountLine(); renderShop(); });
      inp.addEventListener('focus', () => inp.select());
      const btn = (t, aria, d) => { const b = el('button', null, t); b.type = 'button'; b.setAttribute('aria-label', aria + ' ' + n); b.addEventListener('click', () => set((PLAN.counts[n] || 0) + d * step)); return b; };
      ctl.append(btn('−', 'Fewer', -1), inp, btn('+', 'More', 1));
      row.append(lab, ctl);
      box.append(row);
    });
    if (!canWrite) setReadOnly(true);
  };

  const renderHist = () => {
    const tb = $('#hist');
    tb.replaceChildren();
    if (!REF) return;
    const a = avgDemand();
    $('#hist-note').textContent = 'Demand is sold + comped + could have sold more.' + (a ? ' Suggestion: average of the last ' + Math.min(4, REF.nights.length) + ' nights, ' + Math.round(a) + ' pizzas.' : '');
    const head = el('tr'); ['Night', 'Made', 'Sold', 'Comped', 'More', 'Demand'].forEach((h) => head.append(el('th', null, h))); tb.append(head);
    REF.nights.forEach((r) => { const tr = el('tr'); [day(r.date), r.dough_made ?? '', r.sold, r.comped, r.more, r.demand].forEach((v) => tr.append(el('td', null, String(v)))); tb.append(tr); });
  };

  const renderShop = () => {
    const box = $('#shoplist');
    box.replaceChildren();
    if (!PLAN || !REF) return;
    const per = perBall();
    const balls = plannedBalls();
    const t = tweaks();
    const total = Object.entries(PLAN.counts).filter(([k]) => !isDessert(k)).reduce((a, [, v]) => a + v, 0);
    $('#shop-line').textContent = total.toLocaleString('en-US') + ' pizzas · ' + balls.toLocaleString('en-US') + ' dough balls';
    /* Everything to buy, in grams, keyed by ingredient name; dough items join the toppings. */
    const totals = new Map(), from = new Map(), makes = new Map(), missing = new Set();
    const add = (k, v) => totals.set(k, (totals.get(k) || 0) + v);
    if (per && balls) {
      const pool = per.poolish * balls;
      add('flour', per.flour * balls + pool / 2);
      add('salt', per.salt * balls);
      add('yeast', (per.yeast * balls * (Number(t.yeast) || 100)) / 100 + pool * POOLISH_YEAST_PER_G);
      ['flour', 'salt', 'yeast'].forEach((k) => { if (!from.has(k)) from.set(k, new Set()); from.get(k).add('dough'); });
    }
    pizzaRows().forEach((r) => {
      const n = PLAN.counts[r.pizza] || 0;
      if (!n) return;
      if (r.grams == null) { missing.add(r.topping); return; }
      add(r.topping, r.grams * n);
      if (r.sauce) { if (!from.has(r.topping)) from.set(r.topping, new Set()); from.get(r.topping).add(r.sauce); makes.set(r.sauce, (makes.get(r.sauce) || 0) + r.grams * n); }
    });
    if (!totals.size && !missing.size) { box.append(el('p', 'empty', 'Add a service and pick pizzas on the Plan tab to build the list.')); return; }

    /* Group by store section, in the order sections first appear on the Store sections tab. */
    const sec = new Map();
    const order = [];
    (REF.sections || []).forEach((s) => { sec.set(norm(s.ingredient), s.section); if (!order.includes(s.section)) order.push(s.section); });
    const sectionOf = (k) => sec.get(norm(k)) || 'Other';
    /* Merge related items into what you actually buy ("buy as" column): caramelized onions + onions -> onions. */
    const buyAs = new Map();
    (REF.sections || []).forEach((s) => { if (s.buyAs) buyAs.set(norm(s.ingredient), s.buyAs); });
    const buy = new Map();
    [...totals].forEach(([k, v]) => {
      const name = buyAs.get(norm(k)) || k;
      if (!buy.has(name)) buy.set(name, {grams: 0, section: sectionOf(k), uses: new Set()});
      const b = buy.get(name);
      b.grams += v;
      if (from.has(k)) from.get(k).forEach((x) => b.uses.add(x));
      if (norm(name) !== norm(k)) b.uses.add(k);
    });
    const groups = new Map();
    const push = (s, row) => { if (!groups.has(s)) groups.set(s, []); groups.get(s).push(row); };
    [...buy].sort((a, b) => b[1].grams - a[1].grams).forEach(([k, b]) => push(b.section, [k, amount(b.grams), b.uses.size ? 'for ' + [...b.uses].join(', ') : '']));
    missing.forEach((k) => push(sectionOf(k), [k, 'No amount set', 'Add it to the Topping amounts tab', true]));

    const group = (title, rows, keyPrefix) => {
      if (!rows.length) return;
      box.append(el('h3', null, title));
      rows.forEach(([name, amt, note, miss]) => {
        const key = keyPrefix + '|' + name;
        const lab = el('label', 'item' + (CHECKED.includes(key) ? ' done' : ''));
        const cb = el('input'); cb.type = 'checkbox'; cb.checked = CHECKED.includes(key); cb.disabled = !canWrite;
        cb.addEventListener('change', () => {
          CHECKED = cb.checked ? [...new Set([...CHECKED, key])] : CHECKED.filter((x) => x !== key);
          lab.classList.toggle('done', cb.checked); saveChecks();
        });
        const nm = el('span', 'nm', name); if (note) nm.append(el('span', 'sub', note));
        lab.append(cb, nm, el('span', 'amt' + (miss ? ' missing' : ''), amt));
        box.append(lab);
      });
    };
    [...order, ...[...groups.keys()].filter((s) => !order.includes(s) && s !== 'Other'), 'Other'].forEach((s) => group(s, groups.get(s) || [], 'buy'));
    renderPrep();
  };

  /* Prep list: dough steps per mix day, then sauces and topping prep per service, scaled by that service's share of the dough. */
  const renderPrep = () => {
    const box = $('#preplist');
    box.replaceChildren();
    if (!PLAN || !REF) return;
    const per = perBall();
    const t = tweaks();
    const lead = Math.max(0, Math.min(5, Number(t.lead) || 0));
    const svcs = PLAN.services.filter((s) => s.date).map((s) => ({...s, use: ballsFor(s)})).filter((s) => s.use > 0);
    if (!svcs.length) { box.append(el('p', 'empty', 'Add a service on the Plan tab to see the prep list.')); return; }
    const label = (s) => TYPE_SHORT[s.type] + ' ' + rel(s.date);
    const days = new Map();
    /* Same task on the same day is one line: amounts add up and the services are listed together. */
    const task = (date, rank, key, title, amt, note, unitName) => {
      if (!days.has(date)) days.set(date, []);
      const list = days.get(date);
      const same = typeof amt === 'number' && list.find((x) => x.title === title && typeof x.grams === 'number');
      if (same) { same.grams += amt; if (note && !same.notes.includes(note)) same.notes.push(note); return; }
      list.push({rank, key, title, unitName, grams: typeof amt === 'number' ? amt : null, amt: typeof amt === 'number' ? null : amt, notes: note ? [note] : []});
    };

    const mixes = new Map();
    svcs.forEach((s) => { const k = addDays(s.date, -lead); if (!mixes.has(k)) mixes.set(k, []); mixes.get(k).push(s); });
    mixes.forEach((list, mix) => {
      const balls = list.reduce((a, s) => a + s.use, 0);
      const n = Math.max(1, Math.ceil(balls / mixerCap()));
      const size = Math.ceil(balls / n);
      task(addDays(mix, -1), 0, 'poolish|' + mix, n === 1 ? 'Start poolish (evening)' : 'Start poolish (evening): ' + n + ' containers', balls.toLocaleString('en-US') + ' balls', list.map(label).join(' + '));
      task(mix, 1, 'mix|' + mix, n === 1 ? 'Mix dough' : 'Mix dough: ' + n + ' batches of ' + size, (n * size).toLocaleString('en-US') + ' balls', list.map(label).join(' + '));
    });

    const totalBalls = svcs.reduce((a, s) => a + s.use, 0);
    const rows = pizzaRows();
    const prepOf = new Map(REF.amounts.map((a) => [norm(a.topping), a]));
    const prepDays = setting('prep days before service') ?? setting('sauce days before service') ?? 1;
    /* Prep amounts in kitchen containers: cups under a pint, pints under a quart, then quarts, rounded up to the half. */
    const half = (n) => { const r = Math.ceil(n * 2) / 2; const w = Math.floor(r); return (w ? String(w) : '') + (r % 1 ? '½' : '') || '0'; };
    const volume = (grams, name) => {
      const a = prepOf.get(norm(name));
      const wt = grams >= 1000 ? (grams / 1000).toFixed(1) + ' kg' : Math.round(grams) + ' g';
      if (!a || !a.gpq) return wt;
      const cups = (grams / a.gpq) * 4;
      /* Round up first, then move to the next size once it fills it: 2 cups is 1 pt, 2 pt is 1 qt. */
      const c = Math.ceil(cups * 2) / 2;
      const pt = Math.ceil(cups) / 2;
      const qt = cups / 4;
      /* A topping with a set container (mozzarella in 8 qt Cambros) counts containers once it fills one. */
      const v = a.box && qt > a.box * 0.75 ? Math.ceil(qt / a.box - 0.02) + ' × ' + a.box + ' qt' : c < 2 ? half(c) + (c > 1 ? ' cups' : ' cup') : pt < 2 ? half(pt) + ' pt' : half(qt) + ' qt';
      return v + ' · ' + wt;
    };
    svcs.forEach((s) => {
      const share = s.use / totalBalls;
      const direct = new Map(), sauces = new Map();
      rows.forEach((r) => {
        const n = (PLAN.counts[r.pizza] || 0) * share;
        if (!n || r.grams == null) return;
        if (r.sauce) sauces.set(r.sauce, (sauces.get(r.sauce) || 0) + r.grams * n);
        else direct.set(r.topping, (direct.get(r.topping) || 0) + r.grams * n);
      });
      sauces.forEach((v, name) => task(addDays(s.date, -prepDays), 2, 'sauce|' + name, 'Make ' + name, v, label(s), name));
      direct.forEach((v, name) => {
        const a = prepOf.get(norm(name));
        if (!a || !a.prep) return;
        const title = norm(a.prep).includes(norm(name)) ? a.prep : a.prep + ' ' + name;
        task(addDays(s.date, -prepDays), 3, 'top|' + name, title, v, label(s), name);
      });
    });

    /* Days already past are done (or missed): leave them off so the list starts at today. */
    const today = todayStr();
    const past = [...days.keys()].filter((d) => d < today).length;
    if (past) box.append(el('p', 'empty', past === 1 ? 'One earlier prep day is hidden.' : past + ' earlier prep days are hidden.'));
    [...days.keys()].filter((d) => d >= today).sort().forEach((d) => {
      /* The day's heading names the services its prep is for, so items stay one line. */
      const fors = [...new Set(days.get(d).flatMap((x) => x.notes.join(' + ').split(' + ')).filter(Boolean))];
      box.append(el('h3', null, rel(d) + (fors.length ? ' — for ' + fors.join(', ') : '')));
      days.get(d).sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title)).forEach((x) => {
        const key = 'prep|' + d + '|' + x.key;
        const lab = el('label', 'item' + (CHECKED.includes(key) ? ' done' : ''));
        const cb = el('input'); cb.type = 'checkbox'; cb.checked = CHECKED.includes(key); cb.disabled = !canWrite;
        cb.addEventListener('change', () => {
          CHECKED = cb.checked ? [...new Set([...CHECKED, key])] : CHECKED.filter((k) => k !== key);
          lab.classList.toggle('done', cb.checked); saveChecks();
        });
        const nm = el('span', 'nm', x.title);
        lab.append(cb, nm, el('span', 'amt', x.grams != null ? volume(x.grams, x.unitName) : x.amt));
        box.append(lab);
      });
    });
    if (!PLAN.picked.length) box.append(el('p', 'empty', 'Pick pizzas on the Plan tab to add sauce and topping prep.'));
  };

  /* ---------- Controls ---------- */
  root.querySelectorAll('.tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('.tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    ['plan', 'shop', 'prep'].forEach((p) => { $('#page-' + p).hidden = b.dataset.tab !== p; });
    try { window.history.replaceState(null, '', '#' + b.dataset.tab); } catch (e) { /* hash is optional */ }
  }));
  if (['#shop', '#prep'].includes(window.location.hash)) root.querySelector('.tabs [data-tab="' + window.location.hash.slice(1) + '"]').click();
  $('#add-svc').addEventListener('click', () => {
    if (!PLAN) return;
    const last = PLAN.services[PLAN.services.length - 1];
    PLAN.services.push({id: uid(), date: last ? last.date : nextFriday(), type: 'sides', guests: 100, ppg: null, balls: null});
    savePlan(); renderAll();
  });
  [['#t-buffer', 'buffer'], ['#t-lead', 'lead'], ['#t-yeast', 'yeast'], ['#t-water', 'water']].forEach(([id, k]) => {
    $(id).addEventListener('input', () => { if (!PLAN) return; PLAN.tweaks = {...(PLAN.tweaks || {}), [k]: Number($(id).value)}; savePlan(); renderLive(); });
  });
  $('#t-reset').addEventListener('click', () => { if (!PLAN) return; PLAN.tweaks = {}; savePlan(); renderTweaks(); renderLive(); });
  $('#split').addEventListener('click', () => { if (!PLAN) return; PLAN.manualCounts = false; spread(); savePlan(); renderCounters(); renderShop(); });
  $('#clear').addEventListener('click', () => { if (!PLAN) return; PLAN.picked = []; PLAN.counts = {}; PLAN.manualCounts = false; savePlan(); renderChips(); renderCounters(); renderShop(); });
  $('#uncheck').addEventListener('click', () => { CHECKED = CHECKED.filter((k) => !k.startsWith('buy|') && !k.startsWith('make|')); saveChecks(); renderShop(); });
  $('#prep-uncheck').addEventListener('click', () => { CHECKED = CHECKED.filter((k) => !k.startsWith('prep|')); saveChecks(); renderPrep(); });
  root.querySelectorAll('.seg [data-step]').forEach((b) => b.addEventListener('click', () => {
    step = Number(b.dataset.step) || 1;
    root.querySelectorAll('.seg [data-step]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));

  const defaultPlan = () => ({services: [{id: uid(), date: nextFriday(), type: 'pf', guests: 100, ppg: null, balls: null}], picked: [], counts: {}, tweaks: {}});

  /* ---------- Admin view: ask the server to re-read the sheets ---------- */
  const refreshFromSheets = async () => {
    if (!deps.refresh) return;
    $('#refresh').disabled = true;
    $('#data-status').textContent = 'Reading your sheets…';
    try {
      await deps.refresh();
      showDataStatus();
    } catch (e) {
      $('#data-status').replaceChildren(el('span', 'warn', (e && e.message) || 'Couldn\'t read your sheets right now. Showing the last saved copy.'));
    }
    $('#refresh').disabled = false;
  };
  const showDataStatus = () => {
    if (!REF) { $('#data-status').textContent = 'No recipe or menu saved yet. An admin needs to tap Refresh from sheets once.'; return; }
    const d = new Date(REF.at || 0);
    $('#data-status').textContent = 'Recipe and menu last changed ' + d.toLocaleString('en-US', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
  };

  /* ---------- Boot ---------- */
  db = deps.store;
  const unsubs = [];
  if (!deps.canWrite) setReadOnly(true);
  let firstPlan = true;
  unsubs.push(db.doc('ref/snapshot').onSnapshot((snap) => {
    if (snap.exists) { REF = snap.data(); renderAll(); }
    showDataStatus();
  }, () => { $('#data-status').textContent = 'The saved recipe and menu couldn\'t load. Reload the page.'; }));
  unsubs.push(db.doc('plan/current').onSnapshot((snap) => {
    if (snap.metadata.hasPendingWrites) return;
    if (localPending) return;
    if (snap.exists && snap.data()._by === TAB && !firstPlan) return;
    if (snap.exists) { const d = JSON.parse(JSON.stringify(snap.data())); delete d._by; delete d._rev; PLAN = d; }
    else if (firstPlan) PLAN = defaultPlan();
    PLAN.services = PLAN.services || []; PLAN.picked = PLAN.picked || []; PLAN.counts = PLAN.counts || {}; PLAN.tweaks = PLAN.tweaks || {};
    firstPlan = false;
    renderAll();
  }, () => { $('#save-status').textContent = 'The plan couldn\'t load. Reload the page.'; }));
  unsubs.push(db.doc('plan/checks').onSnapshot((snap) => {
    if (snap.metadata.hasPendingWrites) return;
    if (snap.exists && snap.data()._by === TAB) return;
    CHECKED = snap.exists && Array.isArray(snap.data().checked) ? snap.data().checked.slice() : [];
    if (!busy()) renderShop();
  }));
  if (deps.isAdmin && deps.refresh) {
    $('#refresh').hidden = false;
    $('#refresh').addEventListener('click', refreshFromSheets);
  }

  return () => {
    unsubs.forEach((u) => { try { u(); } catch (e) { /* already closed */ } });
    root.removeEventListener('focusout', onFocusOut);
    clearTimeout(planTimer);
    root.replaceChildren();
  };
}
