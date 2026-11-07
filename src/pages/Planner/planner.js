/*
 * Planner: services, dough plan, pizza picks, shopping list and prep list.
 *
 * Plain DOM code (no React) so it matches the version prototyped in Claude.
 * mountPlanner(root, deps) renders into `root` and returns a cleanup function.
 *
 * deps.store     - {doc(path) -> {set(data), onSnapshot(next, error)}} over Firestore
 *                  (paths: 'ref/snapshot', 'plan/current', 'plan/checks')
 * deps.canWrite  - whether this person may change the plan
 * deps.pizzas    - (onChange) => unsubscribe; the website's pizzas, live
 * deps.isAdmin   - shows "Refresh now" (under Yeast, water and timing)
 * deps.refresh   - async () => re-read the Google Sheets on the server
 * deps.wrapUps   - admins only: {due() -> {items: [{key, date, title}]}}; shows the Wrap up tab
 *                  (index.js draws the form into #wrapup-slot; fire 'wrapups-changed' on root to recount)
 * deps.calendar  - async () => { items: [{id, title, date, time, location, notes}], problem? }, upcoming calendar entries
 */

const MARKUP = '<div class="wrap">\n  <header class="top">\n    <div class="title-row"><h1>Planner</h1>\n    <div class="status"><span id="data-warn"></span><span id="save-status"></span><span id="keep-awake-slot"></span></div></div>\n    <nav class="tabs" role="tablist" aria-label="Planner pages">\n      <button type="button" role="tab" id="tab-plan" aria-controls="page-plan" aria-selected="true" data-tab="plan">Plan</button>\n      <button type="button" role="tab" id="tab-shop" aria-controls="page-shop" aria-selected="false" data-tab="shop">Shopping</button>\n      <button type="button" role="tab" id="tab-prep" aria-controls="page-prep" aria-selected="false" data-tab="prep">Prep</button>\n      <button type="button" role="tab" id="tab-bring" aria-controls="page-bring" aria-selected="false" data-tab="bring">Bring</button>\n      <button type="button" role="tab" id="tab-wrapup" aria-controls="page-wrapup" aria-selected="false" data-tab="wrapup" hidden>Wrap up</button>\n    </nav>\n  </header>\n\n  <p class="ro" id="readonly" hidden>You can look but not change this plan. Ask Jaron to add your account to the staff list.</p>\n\n  <section id="page-plan" role="tabpanel" aria-labelledby="tab-plan" class="panel">\n    <article class="card">\n      <h2>Services</h2>\n      <p class="note">Pizza Friday uses recent demand. Events use guests × pizzas per guest. Type a count to override. Bread uses the same dough, by the loaf.</p>\n      <div id="services"></div>\n      <div id="cal-suggest" class="cal"></div>\n      <div class="row">\n        <button type="button" class="btn" id="add-svc">Add a service</button>\n        <button type="button" class="btn quiet" id="clear-done" hidden>Clear finished services</button>\n      </div>\n      <details class="tweaks">\n        <summary>Yeast, water and timing</summary>\n        <div class="row">\n          <label class="field">Extra for safety (%)<input type="number" id="t-buffer" min="0" max="100" step="5" inputmode="numeric"></label>\n          <label class="field">Mix days before service<input type="number" id="t-lead" min="0" max="5" step="1" inputmode="numeric"></label>\n          <label class="field">Yeast (% of recipe)<input type="number" id="t-yeast" min="10" max="300" step="5" inputmode="numeric"></label>\n          <label class="field">Cold water (% of recipe)<input type="number" id="t-water" min="50" max="150" step="1" inputmode="numeric"></label>\n          <button type="button" class="btn" id="t-reset">Reset to saved settings</button>\n        </div>\n        <p class="note sheets-line"><span id="data-status">Loading recipe and menu…</span> <button type="button" class="linkbtn" id="refresh" hidden>Refresh now</button></p>\n      </details>\n      <details class="tweaks">\n        <summary>Recent Pizza Fridays</summary>\n        <p class="note" id="hist-note">Demand is sold + comped + could have sold more.</p>\n        <div style="overflow-x:auto"><table class="hist" id="hist"></table></div>\n      </details>\n    </article>\n\n    <article class="card">\n      <h2>Dough plan</h2>\n      <p class="note" id="plan-note">Shared mix days are combined. Big days split into even mixer batches.</p>\n      <div id="plan"></div>\n    </article>\n\n    <article class="card">\n      <h2>Pizzas</h2>\n      <p class="note">Each service has its own pizzas. Pick the service, then tap the pizzas it\'s getting; its dough splits evenly across them. Pizzas that are off the website are under Older pizzas.</p>\n      <div class="svc-switch" id="svc-switch" role="group" aria-label="Pizzas for"></div>\n      <div class="row" id="same-row" hidden><label class="field">Same pizzas as<select id="same-as"></select></label></div>\n      <div class="pick-groups" id="chips"></div>\n      <div class="row">\n        <button type="button" class="btn" id="split">Split evenly again</button>\n        <button type="button" class="btn" id="clear">Clear</button>\n        <span class="seg" role="group" aria-label="Each tap">Each tap\n          <button type="button" class="btn" data-step="1" aria-pressed="false">1</button>\n          <button type="button" class="btn" data-step="5" aria-pressed="true">5</button>\n          <button type="button" class="btn" data-step="10" aria-pressed="false">10</button>\n        </span>\n      </div>\n      <p class="note" id="count-line"></p>\n      <div id="counters"></div>\n    </article>\n  </section>\n\n  <section id="page-shop" role="tabpanel" aria-labelledby="tab-shop" class="panel" hidden>\n    <article class="card">\n      <h2>Shopping list</h2>\n      <p class="note" id="shop-line"></p>\n      <form class="row" id="shop-form">\n        <label class="field">Add an item<input type="text" id="shop-new" enterkeyhint="done" autocomplete="off" placeholder="e.g. Paper plates"></label>\n        <label class="field" style="flex:0 1 7rem">How much<input type="text" id="shop-qty" autocomplete="off" placeholder="optional"></label>\n        <button type="submit" class="btn" id="shop-add">Add</button>\n      </form>\n      <div class="row"><button type="button" class="btn quiet" id="uncheck">Uncheck everything</button></div>\n      <div class="list" id="shoplist"></div>\n    </article>\n  </section>\n\n  <section id="page-bring" role="tabpanel" aria-labelledby="tab-bring" class="panel" hidden>\n    <article class="card">\n      <h2>What to bring</h2>\n      <p class="note" id="bring-line">What to pack for the services on the Plan tab. Your own items show only for the kinds of services you have planned; counts follow guests or dough balls.</p>\n      <div class="list" id="bringauto"></div>\n      <div class="list" id="bringlist"></div>\n      <div class="row"><button type="button" class="btn quiet" id="bring-edit" aria-pressed="false">Edit list</button><button type="button" class="btn quiet" id="bring-uncheck">Uncheck everything</button></div>\n      <div class="row" id="bring-form" hidden>\n        <label class="field">Item<input type="text" id="bring-new" enterkeyhint="done" autocomplete="off" placeholder="e.g. Pizza peels"></label>\n        <label class="field">For<select id="bring-for"></select></label>\n        <label class="field">How many<select id="bring-per"><option value="">Just bring it</option><option value="guest">1 per … guests</option><option value="ball">1 per … dough balls</option></select></label>\n        <label class="field" id="bring-every-wrap" hidden>Every<input type="number" id="bring-every" min="1" inputmode="numeric" value="10"></label>\n        <button type="button" class="btn" id="bring-add">Add</button>\n      </div>\n    </article>\n  </section>\n\n  <section id="page-wrapup" role="tabpanel" aria-labelledby="tab-wrapup" hidden>\n    <div id="wrapup-slot"></div>\n  </section>\n\n  <section id="page-prep" role="tabpanel" aria-labelledby="tab-prep" hidden>\n    <article class="card">\n      <h2>Prep list</h2>\n      <p class="note">Day by day for the services on the Plan tab. Amounts split each service\'s share of the pizzas you picked.</p>\n      <div class="row"><button type="button" class="btn quiet" id="prep-uncheck">Uncheck everything</button></div>\n      <div class="list" id="preplist"></div>\n    </article>\n  </section>\n</div>';

export function mountPlanner(root, deps) {
  root.innerHTML = MARKUP;

  const POOLISH_YEAST_PER_G = 0.12 / 84; /* class recipe: 42 g water + 42 g flour + 0.12 g yeast */
  const PPG_SETTING = {wedding: 'pizzas per guest wedding', sides: 'pizzas per guest with other food', meal: 'pizzas per guest pizza only'};
  const PPG_FALLBACK = {wedding: 0.5, sides: 0.45, meal: 0.8};
  const TYPES = [['pf', 'Pizza Friday'], ['wedding', 'Wedding'], ['sides', 'Party with other food'], ['meal', 'Pizza is the meal'], ['bread', 'Bread']];
  /* Bread uses the same dough, weighed out as loaves instead of pizza balls. */
  const LOAF_G = 575;
  const isBread = (s) => s.type === 'bread';

  /* ---------- State ---------- */
  let REF = null;      /* shared copy of sheet data */
  let MENU = null;     /* live website pizzas (deps.pizzas), on and off the menu */
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
  /* Service headings: "Wedding · Sat Nov 14", with Today/Tomorrow when close. */
  const svcName = (s) => (s.name && s.name.trim()) || (TYPES.find(([v]) => v === s.type) || [null, 'Service'])[1];
  const svcWhen = (d) => { const r = rel(d); return day(d) + (r === 'Today' || r === 'Tomorrow' ? ' (' + r.toLowerCase() + ')' : ''); };

  const g = (v) => (v >= 100 ? Math.round(v).toLocaleString('en-US') : (Math.round(v * 10) / 10).toLocaleString('en-US')) + ' g';
  /* Shopping amounts as rough store sizes, always rounded up: ounces under a pound,
     then half pounds, then whole pounds from 10 lb. */
  const shopAmount = (v) => {
    const oz = v / 28.3495;
    if (oz < 15) return 'about ' + Math.max(1, Math.ceil(oz)) + ' oz';
    const lb = oz / 16;
    if (lb < 10) { const r = Math.ceil(lb * 2) / 2; return 'about ' + (r % 1 ? Math.floor(r) + '½' : r) + ' lb'; }
    return 'about ' + Math.ceil(lb).toLocaleString('en-US') + ' lb';
  };
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
    if (isBread(s)) return null;
    const raw = s.type === 'pf' ? avgDemand() : (s.guests || 0) * (perGuest(s) || 0);
    return raw ? Math.ceil(raw * (1 + (Number(tweaks().buffer) || 0) / 100)) : null;
  };
  const ballsFor = (s) => (isBread(s) ? 0 : (s.balls != null && s.balls !== '' ? Number(s.balls) : suggestion(s)) || 0);
  const loafG = (s) => (Number(s.loafG) > 0 ? Number(s.loafG) : setting('bread loaf weight (grams)') || LOAF_G);
  const loavesFor = (s) => (isBread(s) ? Math.max(0, Number(s.loaves) || 0) : 0);
  /* Dough in pizza-ball units, so loaves and balls share mixer batches and the recipe math. */
  const doughFor = (s) => {
    if (!isBread(s)) return ballsFor(s);
    const per = perBall();
    return per ? (loavesFor(s) * loafG(s)) / per.ball : 0;
  };
  const doughText = (list) => {
    const balls = list.reduce((a, s) => a + ballsFor(s), 0), loaves = list.reduce((a, s) => a + loavesFor(s), 0);
    return [balls ? balls.toLocaleString('en-US') + ' balls' : '', loaves ? loaves.toLocaleString('en-US') + (loaves === 1 ? ' loaf' : ' loaves') : ''].filter(Boolean).join(' + ');
  };
  const plannedBalls = () => (PLAN ? PLAN.services.filter((s) => s.date).reduce((t, s) => t + ballsFor(s), 0) : 0);

  /* Pizzas are per service: s.picked (names), s.counts ({name: n}), s.manualCounts.
     CUR is the service the Pizzas card is showing (this tab only). */
  let CUR = null;
  const pizzaSvcs = () => (PLAN ? PLAN.services.filter((s) => !isBread(s)) : []);
  const cur = () => { const l = pizzaSvcs(); return l.find((s) => s.id === CUR) || l.find((s) => s.date && s.date >= todayStr()) || l[0] || null; };
  const pickedOf = (s) => (s && s.picked) || [];
  const countsOf = (s) => (s && s.counts) || {};
  const pizzaTotal = (s) => Object.entries(countsOf(s)).filter(([k]) => !isDessert(k)).reduce((a, [, v]) => a + (Number(v) || 0), 0);
  /* Every planned service's pizzas added up, for shopping and bring. */
  const allCounts = () => {
    const out = {};
    plannedServices().forEach((s) => Object.entries(countsOf(s)).forEach(([k, v]) => { out[k] = (out[k] || 0) + (Number(v) || 0); }));
    return out;
  };
  const anyPicked = () => plannedServices().some((s) => pickedOf(s).length);
  /* Older plans had one pizza list for everything: give each service a copy, then split per service. */
  const migratePizzas = () => {
    if (!PLAN || PLAN.perService) return false;
    const picked = PLAN.picked || [];
    PLAN.services.forEach((s) => { if (!isBread(s) && !s.picked) { s.picked = picked.slice(); s.counts = {}; spreadSvc(s); } });
    /* The old picked/counts stay put (unused from here on) so the live site keeps working until this ships. */
    PLAN.perService = true;
    return true;
  };

  /* Website pizzas: on the menu now, and older ones that are off the website. */
  const allPizzas = () => MENU || (REF ? REF.menu : []).map((p) => ({...p, active: p.active !== false}));

  /* Ingredients per pizza, sauces broken down by their batch recipe. */
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
    allPizzas().forEach((p) => {
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
    root.querySelectorAll('#page-plan input, #page-plan select, #page-plan button, #uncheck, #prep-uncheck, #bring-uncheck, #shop-new, #shop-qty, #shop-add, #bring-new, #bring-add, #bring-for, #bring-per, #bring-every').forEach((x) => { x.disabled = ro; });
    root.querySelectorAll('.item input, .item .rm').forEach((x) => { x.disabled = ro; });
  };

  /* ---------- Rendering ---------- */
  const busy = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'SELECT') && a.closest('#services, details.tweaks, #counters'); };
  let pending = false;
  /* Pizza counts follow the planned dough until someone adjusts a count by hand. */
  const syncCounts = () => {
    if (!PLAN || !REF || !canWrite) return false;
    let changed = false;
    pizzaSvcs().forEach((s) => {
      if (s.manualCounts || !pickedOf(s).some((n) => !isDessert(n)) || pizzaTotal(s) === ballsFor(s)) return;
      spreadSvc(s); changed = true;
    });
    if (changed) savePlan();
    return changed;
  };
  const renderAll = () => {
    if (busy()) { pending = true; return; }
    pending = false;
    syncCounts();
    renderServices(); renderCal(); renderTweaks(); renderPlan(); renderSwitch(); renderChips(); renderCounters(); renderHist(); renderShop();
  };
  const onFocusOut = () => setTimeout(() => { if (pending && !busy()) renderAll(); }, 0);
  root.addEventListener('focusout', onFocusOut);

  const renderServices = () => {
    const box = $('#services');
    box.replaceChildren();
    if (!PLAN) return;
    if (!PLAN.services.length) box.append(el('p', 'empty', 'No services yet.'));
    const done = PLAN.services.filter((s) => s.date && s.date < todayStr()).length;
    $('#clear-done').hidden = !done;
    $('#clear-done').textContent = done === 1 ? 'Clear the finished service' : 'Clear ' + done + ' finished services';
    PLAN.services.forEach((s) => {
      const wrap = el('div', 'svc');
      const head = el('div', 'svc-head');
      const title = el('h3');
      const label = () => { title.textContent = svcName(s) + (s.date ? ' · ' + svcWhen(s.date) : ' · no date yet'); };
      label();
      head.append(title);
      const r1 = el('div', 'row');
      const f = (label, input) => { const l = el('label', 'field', label); l.append(input); return l; };
      const date = el('input'); date.type = 'date'; date.value = s.date || ''; date.id = 'd-' + s.id;
      date.addEventListener('change', () => { s.date = date.value; label(); savePlan(); renderLive(); });
      const type = el('select'); type.id = 't-' + s.id;
      TYPES.forEach(([v, t]) => { const o = el('option', null, t); o.value = v; if (s.type === v) o.selected = true; type.append(o); });
      type.addEventListener('change', () => { s.type = type.value; savePlan(); type.blur(); renderAll(); });
      const nameIn = el('input'); nameIn.type = 'text'; nameIn.value = s.name || ''; nameIn.placeholder = (TYPES.find(([v]) => v === s.type) || [null, 'Service'])[1]; nameIn.id = 'n-' + s.id; nameIn.autocomplete = 'off';
      nameIn.addEventListener('input', () => { s.name = nameIn.value; label(); savePlan(); });
      const nameField = f('Name', nameIn); nameField.style.flexBasis = '100%';
      r1.append(nameField, f('Service date', date), f('Type', type));
      const r2 = el('div', 'row');
      if (isBread(s)) {
        const loaves = el('input'); loaves.type = 'number'; loaves.min = '0'; loaves.inputMode = 'numeric'; loaves.value = s.loaves ?? ''; loaves.id = 'l-' + s.id;
        loaves.addEventListener('input', () => { s.loaves = loaves.value === '' ? null : Number(loaves.value); savePlan(); renderLive(); });
        const weight = el('input'); weight.type = 'number'; weight.min = '1'; weight.inputMode = 'numeric'; weight.value = s.loafG ?? ''; weight.placeholder = String(loafG({})); weight.id = 'w-' + s.id;
        weight.addEventListener('input', () => { s.loafG = weight.value === '' ? null : Number(weight.value); savePlan(); renderLive(); });
        r2.append(f('Loaves', loaves), f('Grams per loaf', weight));
      } else if (s.type !== 'pf') {
        const guests = el('input'); guests.type = 'number'; guests.min = '0'; guests.inputMode = 'numeric'; guests.value = s.guests ?? ''; guests.id = 'g-' + s.id;
        guests.addEventListener('input', () => { s.guests = Number(guests.value) || 0; savePlan(); renderLive(); });
        const ppg = el('input'); ppg.type = 'number'; ppg.min = '0'; ppg.step = '0.05'; ppg.inputMode = 'decimal'; ppg.value = s.ppg ?? ''; ppg.placeholder = String(setting(PPG_SETTING[s.type]) ?? PPG_FALLBACK[s.type]); ppg.id = 'p-' + s.id;
        ppg.addEventListener('input', () => { s.ppg = ppg.value === '' ? null : Number(ppg.value); savePlan(); renderLive(); });
        r2.append(f('Guests', guests), f('Per guest', ppg));
      }
      if (!isBread(s)) {
        const balls = el('input'); balls.type = 'number'; balls.min = '0'; balls.inputMode = 'numeric'; balls.placeholder = 'Suggested'; balls.value = s.balls ?? ''; balls.id = 'b-' + s.id;
        balls.addEventListener('input', () => { s.balls = balls.value === '' ? null : Number(balls.value); savePlan(); renderLive(); });
        r2.append(f('Dough balls', balls));
      }
      const rm = el('button', 'btn quiet', 'Remove'); rm.type = 'button';
      rm.addEventListener('click', () => { PLAN.services = PLAN.services.filter((x) => x !== s); savePlan(); renderAll(); });
      head.append(rm);
      const sugg = el('div', 'sugg'); sugg.dataset.svc = s.id;
      wrap.append(head, r1, r2, sugg);
      if (s.type === 'pf') { const h = pfHistory(s); if (h) wrap.append(h); }
      /* Linked to a calendar entry whose date has moved: offer the new date. */
      const cal = s.calId && CAL && CAL.items.find((c) => c.id === s.calId);
      if (cal && cal.date !== s.date) {
        const moved = el('div', 'row note');
        moved.append(document.createTextNode('The calendar now says ' + day(cal.date) + '. '));
        const use = el('button', 'btn quiet', 'Use that date'); use.type = 'button';
        use.addEventListener('click', () => { s.date = cal.date; savePlan(); renderAll(); });
        moved.append(use);
        wrap.append(moved);
      }
      box.append(wrap);
    });
    renderSuggs();
    if (!canWrite) setReadOnly(true);
  };
  /* "From your calendar": upcoming entries that aren't planned yet. Add makes a normal, editable
     service (type and guests guessed from the title and notes); Skip hides an entry for good. */
  let CAL = null;
  const guessType = (text) => (/pizza\s*friday/i.test(text) ? 'pf' : /wedding|reception/i.test(text) ? 'wedding' : 'meal');
  const guessGuests = (title, notes) => {
    const m = /(\d{2,4})\s*(?:people|guests|ppl|pax|persons)/i.exec(title + ' ' + notes) || /[-–]\s*(\d{2,4})\s*$/.exec(title);
    return m ? Number(m[1]) : null;
  };
  const isPlanned = (c) => PLAN.services.some((s) => s.calId === c.id || (!s.calId && s.date === c.date));
  const renderCal = () => {
    const box = $('#cal-suggest');
    box.replaceChildren();
    if (!CAL || !PLAN) return;
    const skipped = PLAN.calSkipped || [];
    const list = CAL.items.filter((c) => c.date && !/\bprep\b/i.test(c.title) && !skipped.includes(c.id) && !isPlanned(c));
    if (CAL.problem) box.append(el('p', 'note', CAL.problem));
    if (!list.length) return;
    const head = el('div', 'svc-head');
    head.append(el('h3', null, 'From your calendar'));
    if (list.length > 1) {
      const all = el('button', 'btn quiet', 'Add all'); all.type = 'button'; all.disabled = !canWrite;
      all.addEventListener('click', () => { list.forEach(addFromCal); savePlan(); renderAll(); });
      head.append(all);
    }
    box.append(head);
    list.forEach((c) => {
      const row = el('div', 'cal-row');
      const info = el('div', 'nm');
      const type = guessType(c.title + ' ' + c.notes);
      const guests = guessGuests(c.title, c.notes);
      info.append(el('b', null, c.title || '(no title)'));
      info.append(el('span', 'sub', [day(c.date) + (c.time ? ', ' + c.time : ''), (TYPES.find(([v]) => v === type) || [])[1], type !== 'pf' && guests ? guests + ' guests' : ''].filter(Boolean).join(' · ')));
      const add = el('button', 'btn primary', 'Add'); add.type = 'button'; add.disabled = !canWrite;
      add.addEventListener('click', () => { addFromCal(c); savePlan(); renderAll(); });
      const skip = el('button', 'btn quiet', 'Skip'); skip.type = 'button'; skip.disabled = !canWrite;
      skip.addEventListener('click', () => { PLAN.calSkipped = [...skipped, c.id]; savePlan(); renderCal(); });
      const btns = el('div', 'row'); btns.append(add, skip);
      row.append(info, btns);
      box.append(row);
    });
  };
  const addFromCal = (c) => {
    const type = guessType(c.title + ' ' + c.notes);
    PLAN.services = [...PLAN.services, {id: uid(), date: c.date, type, guests: type === 'pf' ? 100 : guessGuests(c.title, c.notes) || 50, ppg: null, balls: null, name: c.title, calId: c.id}];
  };

  /* Wrap up tab (admins): the form is drawn by React into #wrapup-slot (index.js). The tab
     shows how many recent events still need one. */
  const loadWrapCount = () => {
    if (!deps.wrapUps) return;
    deps.wrapUps.due().then((d) => {
      const n = ((d && d.items) || []).length;
      $('#tab-wrapup').textContent = n ? 'Wrap up (' + n + ')' : 'Wrap up';
    }).catch(() => {});
  };

  /* Pizza Friday cards: the last two nights, and the Friday closest to this date a year ago. */
  const nightLine = (r, withYear) => (withYear ? day(r.date) + ', ' + r.date.slice(0, 4) : day(r.date)) + ': ' + r.sold + ' sold' + (r.demand !== r.sold ? ' (' + r.demand + ' demand)' : '');
  const pfHistory = (s) => {
    if (!REF || !REF.nights || !REF.nights.length) return null;
    const box = el('div', 'pf-hist');
    const recent = REF.nights.slice(0, 2);
    box.append(el('div', null, 'Last ' + (recent.length > 1 ? 'two' : 'one') + ': ' + recent.map((r) => nightLine(r)).join(' · ')));
    if (s.date) {
      const target = parse(s.date).getTime() - 364 * 864e5;
      const near = REF.nights
        .map((r) => ({r, off: Math.abs(parse(r.date).getTime() - target)}))
        .filter((x) => x.off <= 10 * 864e5)
        .sort((a, b) => a.off - b.off)[0];
      if (near) box.append(el('div', null, 'Last year: ' + nightLine(near.r, true)));
    }
    return box;
  };
  const renderSuggs = () => {
    root.querySelectorAll('.sugg[data-svc]').forEach((n) => {
      const s = PLAN.services.find((x) => x.id === n.dataset.svc);
      if (!s) return;
      if (isBread(s)) {
        const kg = (loavesFor(s) * loafG(s)) / 1000;
        n.replaceChildren(document.createTextNode(loavesFor(s) ? 'Dough: ' : 'Type how many loaves.'));
        if (loavesFor(s)) n.append(el('b', null, kg.toFixed(2) + ' kg'), document.createTextNode(' (' + loavesFor(s) + ' × ' + loafG(s) + ' g, same recipe as the pizza dough)'));
        return;
      }
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

  /* Dough recipe cards start closed. Which ones are open is remembered on this device, because the plan redraws often. */
  const RECIPE_KEY = 'bybo-open-recipes';
  const recipeOpen = new Set((() => { try { return JSON.parse(localStorage.getItem(RECIPE_KEY)) || []; } catch (e) { return []; } })());
  const setRecipeOpen = (key, open) => {
    if (recipeOpen.has(key) === open) return;
    if (open) recipeOpen.add(key); else recipeOpen.delete(key);
    try { localStorage.setItem(RECIPE_KEY, JSON.stringify([...recipeOpen].slice(-20))); } catch (e) { /* private window: stays open until reload */ }
  };

  const renderPlan = () => {
    const box = $('#plan');
    box.replaceChildren();
    const per = perBall();
    if (!per || !PLAN) { box.append(el('p', 'empty', REF ? 'The dough recipe tab is missing its ball weight or total.' : 'Waiting for the recipe.')); return; }
    const t = tweaks();
    const lead = Math.max(0, Math.min(5, Number(t.lead) || 0));
    const svcs = PLAN.services.filter((s) => s.date).map((s) => ({...s, use: doughFor(s)})).filter((s) => s.use > 0);
    if (!svcs.length) { box.append(el('p', 'empty', 'Add a service date to see the plan.')); return; }
    const groups = new Map();
    svcs.forEach((s) => { const k = addDays(s.date, -lead); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); });
    [...groups.keys()].sort().forEach((mix) => {
      const list = groups.get(mix);
      const balls = list.reduce((a, s) => a + s.use, 0);
      const n = Math.max(1, Math.ceil(balls / mixerCap()));
      const size = Math.ceil(balls / n);
      const p = per.poolish * size;
      const hasBread = list.some(isBread);
      const sec = el('section', 'batch');
      const bh = el('div', 'batch-head');
      bh.append(el('h3', null, list.map((s) => svcName(s) + ' · ' + svcWhen(s.date)).join(' + ')), el('span', 'pill', doughText(list)));
      sec.append(bh);
      if (hasBread) sec.append(el('p', 'note', 'Bread: weigh out ' + list.filter(isBread).map((s) => loavesFor(s) + ' × ' + loafG(s) + ' g').join(' and ') + (list.some((s) => !isBread(s)) ? ', and the rest into ' + Math.round(per.ball) + ' g balls.' : '.')));
      const steps = el('div', 'steps');
      const card = (key, title, when, rows) => {
        const c = el('details', 'stepcard');
        c.open = recipeOpen.has(key);
        c.addEventListener('toggle', () => setRecipeOpen(key, c.open));
        const sum = el('summary');
        const head = el('span', 'step-title');
        head.append(el('h4', null, title), el('div', 'when', when));
        sum.append(head);
        c.append(sum);
        const tb = el('table', 'g');
        rows.forEach(([name, v, sub]) => { const tr = el('tr'); const a = el('td', null, name); if (sub) { a.append(el('div', 'when', sub)); } tr.append(a, el('td', 'n', g(v))); tb.append(tr); });
        c.append(tb); steps.append(c);
      };
      card('poolish|' + mix, n === 1 ? 'Start poolish' : 'Start poolish: ' + n + ' containers', rel(addDays(mix, -1)) + ', evening' + (n === 1 ? '' : ' · per container'), [
        ['Water', p / 2], ['Flour', p / 2], ['Yeast', p * POOLISH_YEAST_PER_G]
      ]);
      card('mix|' + mix, n === 1 ? 'Mix dough' : 'Mix dough: ' + n + ' batches' + (hasBread ? '' : ' of ' + size), rel(mix) + (n === 1 ? '' : ' · per batch'), [
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

  const names = () => allPizzas().map((p) => p.name);
  /* Split one service's dough balls evenly across its picked pizzas (desserts keep their own count). */
  function spreadSvc(s) {
    s.picked = pickedOf(s); s.counts = {...countsOf(s)};
    const picked = names().filter((n) => s.picked.includes(n) && !isDessert(n));
    const balls = ballsFor(s);
    Object.keys(s.counts).forEach((k) => { if (!s.picked.includes(k) || !isDessert(k)) delete s.counts[k]; });
    if (!picked.length || !balls) return;
    picked.forEach((n, i) => { s.counts[n] = Math.floor(balls / picked.length) + (i < balls % picked.length ? 1 : 0); });
  }
  const renderPizzas = () => { renderSwitch(); renderChips(); renderCounters(); renderShop(); };
  const togglePick = (n) => {
    const s = cur(); if (!s) return;
    s.picked = pickedOf(s).includes(n) ? pickedOf(s).filter((x) => x !== n) : [...pickedOf(s), n];
    s.manualCounts = false; spreadSvc(s); savePlan(); renderPizzas();
  };
  /* Which service the Pizzas card is showing, and "Same pizzas as" another one. */
  const renderSwitch = () => {
    const box = $('#svc-switch');
    box.replaceChildren();
    const list = pizzaSvcs();
    const c = cur();
    list.forEach((s) => {
      const b = el('button', 'btn', svcName(s) + (s.date ? ' · ' + rel(s.date) : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(c && s.id === c.id));
      if (!pickedOf(s).length) b.append(el('span', 'none', ' · none yet'));
      b.addEventListener('click', () => { CUR = s.id; renderPizzas(); });
      box.append(b);
    });
    box.hidden = list.length < 2;
    const others = list.filter((s) => c && s.id !== c.id && pickedOf(s).length);
    $('#same-row').hidden = !others.length || !canWrite;
    const sel = $('#same-as');
    sel.replaceChildren();
    const o0 = el('option', null, 'Pick a service…'); o0.value = ''; sel.append(o0);
    others.forEach((s) => { const o = el('option', null, svcName(s) + (s.date ? ' · ' + day(s.date) : '')); o.value = s.id; sel.append(o); });
  };
  const chip = (p) => {
    const b = el('button', 'chip', p.name); b.type = 'button';
    b.setAttribute('aria-pressed', String(pickedOf(cur()).includes(p.name)));
    if (p.toppings) b.title = p.toppings;
    b.addEventListener('click', () => togglePick(p.name));
    return b;
  };
  const renderChips = () => {
    const box = $('#chips');
    box.replaceChildren();
    if (!PLAN) return;
    const all = allPizzas();
    if (!all.length) { box.append(el('p', 'empty', 'Waiting for the menu.')); return; }
    if (!cur()) { box.append(el('p', 'empty', 'Add a service to pick its pizzas.')); return; }
    const group = (title, list, wrap) => {
      if (!list.length) return;
      const g = el(wrap ? 'details' : 'div', 'pick-group');
      g.append(el(wrap ? 'summary' : 'p', 'group-title', title + (wrap ? ' (' + list.length + ')' : '')));
      const chips = el('div', 'chips');
      list.forEach((p) => chips.append(chip(p)));
      g.append(chips);
      if (wrap && list.some((p) => pickedOf(cur()).includes(p.name))) g.open = true;
      box.append(g);
    };
    group('On the website', all.filter((p) => p.active));
    group('Older pizzas, not on the website now', all.filter((p) => !p.active), true);
    if (!canWrite) setReadOnly(true);
  };
  const renderCountLine = () => {
    if (!PLAN) return;
    const s = cur();
    if (!s) { $('#count-line').textContent = ''; return; }
    const total = pizzaTotal(s);
    const planned = ballsFor(s);
    $('#count-line').textContent = 'For ' + svcName(s) + ': ' + total.toLocaleString('en-US') + ' pizzas picked · ' + planned.toLocaleString('en-US') + ' dough balls planned' + (s.manualCounts && total !== planned ? '. Counts were set by hand; tap Split evenly again to match the dough.' : '');
  };
  const renderCounters = () => {
    const box = $('#counters');
    box.replaceChildren();
    renderCountLine();
    const s = cur();
    if (!PLAN || !s) return;
    s.counts = countsOf(s);
    const picked = names().filter((n) => pickedOf(s).includes(n));
    if (!picked.length) { box.append(el('p', 'empty', 'No pizzas picked for ' + svcName(s) + ' yet.')); return; }
    picked.forEach((n, i) => {
      const row = el('div', 'counter');
      const lab = el('label', 'nm', n); lab.htmlFor = 'c-' + i;
      const ctl = el('span', 'step');
      const inp = el('input'); inp.type = 'number'; inp.min = '0'; inp.inputMode = 'numeric'; inp.id = 'c-' + i; inp.value = String(s.counts[n] || 0);
      const set = (v) => { s.counts[n] = Math.max(0, Math.round(v) || 0); s.manualCounts = true; inp.value = String(s.counts[n]); savePlan(); renderCountLine(); renderShop(); };
      inp.addEventListener('input', () => { s.counts[n] = Math.max(0, Number(inp.value) || 0); s.manualCounts = true; savePlan(); renderCountLine(); renderShop(); });
      inp.addEventListener('focus', () => inp.select());
      const btn = (t, aria, d) => { const b = el('button', null, t); b.type = 'button'; b.setAttribute('aria-label', aria + ' ' + n); b.addEventListener('click', () => set((s.counts[n] || 0) + d * step)); return b; };
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
    REF.nights.slice(0, 6).forEach((r) => { const tr = el('tr'); [day(r.date), r.dough_made ?? '', r.sold, r.comped, r.more, r.demand].forEach((v) => tr.append(el('td', null, String(v)))); tb.append(tr); });
  };

  /* Bring list (PLAN.bring): items to pack, each tagged with which services it is for
     (`for`: all, pf, event = any catered event, or one service type) and an optional
     count rule (`per`: guest or ball, one per `every`). Items without `for` are for every service.
     Above them, items that come straight from the plan: dough, sauces and toppings for the picked pizzas. */
  const BRING_FOR = [['all', 'Every service'], ['pf', 'Pizza Friday'], ['event', 'Any catered event'], ...TYPES.filter(([v]) => v !== 'pf')];
  const bringForLabel = (v) => (BRING_FOR.find(([k]) => k === (v || 'all')) || BRING_FOR[0])[1];
  let bringEditing = false;
  const plannedServices = () => (PLAN ? PLAN.services.filter((s) => s.date) : []);
  const servicesFor = (f) => plannedServices().filter((s) => !f || f === 'all' || (f === 'event' ? s.type !== 'pf' : s.type === f));
  const bringCount = (item, svcs) => {
    const every = Math.max(1, Number(item.every) || 1);
    if (item.per === 'guest') { const n = svcs.filter((s) => s.type !== 'pf').reduce((a, s) => a + (Number(s.guests) || 0), 0); return n ? Math.ceil(n / every) : null; }
    if (item.per === 'ball') { const n = svcs.reduce((a, s) => a + ballsFor(s), 0); return n ? Math.ceil(n / every) : null; }
    return null;
  };
  const checkRow = (key, name, sub, amt) => {
    const lab = el('label', 'item' + (CHECKED.includes(key) ? ' done' : ''));
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = CHECKED.includes(key); cb.disabled = !canWrite;
    cb.addEventListener('change', () => {
      CHECKED = cb.checked ? [...new Set([...CHECKED, key])] : CHECKED.filter((x) => x !== key);
      lab.classList.toggle('done', cb.checked); saveChecks();
    });
    const nm = el('span', 'nm', name);
    if (sub) nm.append(el('span', 'sub', sub));
    lab.append(cb, nm);
    if (amt != null) lab.append(el('span', 'amt', String(amt)));
    return lab;
  };
  /* Where each Bring item is packed from (PLAN.where: {key: 'home' | 'commissary'}), set in Edit list. */
  const LOCS = [['home', 'At home'], ['commissary', 'At the commissary']];
  const whereOf = (key) => (PLAN.where || {})[key] || '';
  const whereSelect = (key, name) => {
    const sel = el('select', 'where');
    sel.setAttribute('aria-label', 'Where ' + name + ' comes from');
    [['', 'Where?'], ['home', 'Home'], ['commissary', 'Commissary']].forEach(([v, t]) => {
      const o = el('option', null, t); o.value = v; if (whereOf(key) === v) o.selected = true; sel.append(o);
    });
    sel.disabled = !canWrite;
    sel.addEventListener('change', () => { PLAN.where = {...(PLAN.where || {}), [key]: sel.value}; if (!sel.value) delete PLAN.where[key]; savePlan(); renderBring(); });
    return sel;
  };
  /* Everything to bring, from the plan (dough, sauces, each topping) and your own gear. */
  const bringEntries = () => {
    const out = [];
    const doughSvcs = plannedServices().filter((s) => ballsFor(s) || loavesFor(s));
    if (doughSvcs.length) out.push({key: 'bring|auto|dough', name: 'Dough', sub: 'For ' + doughSvcs.map((s) => svcName(s) + ' · ' + day(s.date)).join(' + '), amt: doughText(doughSvcs)});
    const picked = new Set(plannedServices().flatMap(pickedOf));
    const rows = pizzaRows().filter((r) => picked.has(r.pizza));
    [...new Set(rows.map((r) => r.sauce).filter(Boolean))].sort().forEach((sauce) => out.push({key: 'bring|auto|sauce|' + norm(sauce), name: sauce, sub: 'Sauce for the picked pizzas'}));
    [...new Set(rows.filter((r) => !r.sauce).map((r) => r.topping))].sort((a, b) => a.localeCompare(b))
      .forEach((t) => out.push({key: 'bring|auto|top|' + norm(t), name: t, topping: true}));
    (PLAN.bring || []).forEach((item) => {
      const svcs = servicesFor(item.for);
      out.push({key: 'bring|' + item.id, name: item.name, gear: item, hiddenNow: !svcs.length,
        sub: item.for && item.for !== 'all' ? bringForLabel(item.for) : '', amt: svcs.length ? bringCount(item, svcs) : null});
    });
    return out;
  };
  /* Your order for the Bring list (PLAN.bringOrder: keys). New items go to the end of their group. */
  const ordered = (entries) => {
    const pos = new Map((PLAN.bringOrder || []).map((k, i) => [k, i]));
    return entries.map((e, i) => ({e, i})).sort((a, b) => (pos.has(a.e.key) ? pos.get(a.e.key) : 1e6 + a.i) - (pos.has(b.e.key) ? pos.get(b.e.key) : 1e6 + b.i)).map((x) => x.e);
  };
  const moveBring = (all, group, key, dir) => {
    const keys = group.map((e) => e.key);
    const i = keys.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= keys.length) return;
    const full = all.map((e) => e.key);
    const a = full.indexOf(keys[i]), b = full.indexOf(keys[j]);
    [full[a], full[b]] = [full[b], full[a]];
    PLAN.bringOrder = full;
    savePlan(); renderBring();
  };
  const SECTIONS = [...LOCS, ['', 'Not sorted yet']];
  /* Move a block of keys (one item, or all the toppings together) past its neighbor block in the same section. */
  const moveBlock = (all, blocks, index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    const swapped = blocks.slice(); [swapped[index], swapped[j]] = [swapped[j], swapped[index]];
    const inSection = new Set(blocks.flat());
    const full = all.map((e) => e.key);
    const slots = full.map((k, i) => (inSection.has(k) ? i : -1)).filter((i) => i >= 0);
    const flat = swapped.flat();
    slots.forEach((slot, n) => { full[slot] = flat[n]; });
    PLAN.bringOrder = full;
    savePlan(); renderBring();
  };
  const arrowPair = (name, first, last, onMove) => {
    const arrows = el('span', 'move');
    [['↑', -1, 'Move up'], ['↓', 1, 'Move down']].forEach(([t, dir, label]) => {
      const b = el('button', 'btn quiet', t); b.type = 'button'; b.setAttribute('aria-label', label + ' ' + name);
      b.disabled = !canWrite || (dir < 0 ? first : last);
      b.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); onMove(dir); });
      arrows.append(b);
    });
    return arrows;
  };

  /* "Toppings" ticks every topping at once, and shows ticked once they all are. */
  const toppingGroup = (list, arrows, everything) => {
    const keys = list.map((t) => t.key);
    const all = keys.every((k) => CHECKED.includes(k));
    const some = keys.some((k) => CHECKED.includes(k));
    const wrap = el('div', 'group');
    const lab = el('label', 'item parent' + (all ? ' done' : ''));
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = all; cb.indeterminate = some && !all; cb.disabled = !canWrite;
    cb.addEventListener('change', () => {
      CHECKED = cb.checked ? [...new Set([...CHECKED, ...keys])] : CHECKED.filter((x) => !keys.includes(x));
      saveChecks(); renderBring();
    });
    const nm = el('span', 'nm', 'Toppings');
    nm.append(el('span', 'sub', keys.filter((k) => CHECKED.includes(k)).length + ' of ' + keys.length + ' packed'));
    lab.append(cb, nm);
    if (arrows) lab.append(arrows);
    const kids = el('div', 'kids');
    const blocks = list.map((t) => [t.key]);
    list.forEach((t, i) => {
      const row = checkRow(t.key, t.name, '', null);
      row.querySelector('input').addEventListener('change', () => renderBring());
      if (everything) row.append(arrowPair(t.name, i === 0, i === list.length - 1, (dir) => moveBlock(everything, blocks, i, dir)));
      kids.append(row);
    });
    wrap.append(lab, kids);
    return wrap;
  };
  const renderBringAuto = () => { $('#bringauto').replaceChildren(); };
  const renderBring = () => {
    renderBringAuto();
    const box = $('#bringlist');
    box.replaceChildren();
    if (!PLAN || !REF) return;
    const editBtn = $('#bring-edit');
    editBtn.textContent = bringEditing ? 'Done editing' : 'Edit list';
    editBtn.setAttribute('aria-pressed', String(bringEditing));
    $('#bring-form').hidden = !bringEditing;
    const entries = ordered(bringEntries());
    if (bringEditing) {
      box.append(el('p', 'note', 'Pick where each thing is packed from, and use ↑ ↓ to put them in packing order. Your own gear can also be removed or set to only some kinds of services.'));
      SECTIONS.forEach(([loc, title]) => {
      const group = entries.filter((e) => whereOf(e.key) === loc);
      if (!group.length) return;
      box.append(el('h3', null, title));
      group.forEach((e, gi) => {
        const row = el('div', 'item edit-row');
        const arrows = el('span', 'move');
        [['↑', -1, 'Move up'], ['↓', 1, 'Move down']].forEach(([t, dir, label]) => {
          const b = el('button', 'btn quiet', t); b.type = 'button'; b.setAttribute('aria-label', label + ' ' + e.name);
          b.disabled = !canWrite || (dir < 0 ? gi === 0 : gi === group.length - 1);
          b.addEventListener('click', () => moveBring(entries, group, e.key, dir));
          arrows.append(b);
        });
        row.append(arrows);
        const nm = el('span', 'nm', e.name);
        const rule = e.gear && e.gear.per ? '1 per ' + (Number(e.gear.every) || 1) + (e.gear.per === 'guest' ? ' guests' : ' dough balls') : '';
        if (e.topping) nm.append(el('span', 'sub', 'Topping'));
        else if (rule) nm.append(el('span', 'sub', rule));
        const ctl = el('span', 'ctl');
        ctl.append(whereSelect(e.key, e.name));
        row.append(nm, ctl);
        if (e.gear) {
          const item = e.gear;
          const sel = el('select', 'for');
          sel.setAttribute('aria-label', 'Who ' + item.name + ' is for');
          BRING_FOR.forEach(([v, t]) => { const o = el('option', null, t); o.value = v; if ((item.for || 'all') === v) o.selected = true; sel.append(o); });
          sel.disabled = !canWrite;
          sel.addEventListener('change', () => { item.for = sel.value; savePlan(); });
          const rm = el('button', 'btn quiet rm', '✕'); rm.type = 'button'; rm.disabled = !canWrite;
          rm.setAttribute('aria-label', 'Remove ' + item.name); rm.title = 'Remove';
          rm.addEventListener('click', () => {
            PLAN.bring = PLAN.bring.filter((x) => x.id !== item.id);
            CHECKED = CHECKED.filter((x) => x !== e.key);
            savePlan(); saveChecks(); renderBring();
          });
          ctl.append(sel, rm);
        }
        box.append(row);
      });
      });
      if (!entries.length) box.append(el('p', 'empty', 'Add the gear you pack below.'));
      return;
    }
    const shown = entries.filter((e) => !e.hiddenNow);
    $('#bring-line').textContent = 'What to pack for the services on the Plan tab, by where it comes from. Use ↑ ↓ to put things in packing order.';
    const hidden = entries.length - shown.length;
    if (!shown.length) { box.append(el('p', 'empty', 'Nothing to bring yet. Plan a service and pick pizzas, or tap Edit list to add gear.')); }
    SECTIONS.forEach(([loc, title]) => {
      const here = shown.filter((e) => whereOf(e.key) === loc);
      if (!here.length) return;
      box.append(el('h3', null, title));
      if (!loc) box.append(el('p', 'note', 'Tap Edit list to say whether these come from home or the commissary.'));
      const tops = here.filter((e) => e.topping);
      /* Each item is a block; all the toppings move together as one block. */
      const units = [];
      here.forEach((e) => {
        if (!e.topping) units.push({e});
        else if (!units.some((u) => u.tops)) units.push({tops});
      });
      const blocks = units.map((u) => (u.tops ? u.tops.map((t) => t.key) : [u.e.key]));
      units.forEach((u, i) => {
        const arrows = arrowPair(u.tops ? 'Toppings' : u.e.name, i === 0, i === units.length - 1, (dir) => moveBlock(entries, blocks, i, dir));
        if (u.tops) { box.append(toppingGroup(u.tops, arrows, entries)); return; }
        const row = checkRow(u.e.key, u.e.name, u.e.sub, u.e.amt);
        row.append(arrows);
        box.append(row);
      });
    });
    if (hidden) box.append(el('p', 'empty', hidden + (hidden === 1 ? ' item is' : ' items are') + ' for services that aren’t planned right now.'));
  };
  const addBring = () => {
    const input = $('#bring-new');
    const name = input.value.trim();
    if (!name || !PLAN || !canWrite) return;
    const per = $('#bring-per').value;
    PLAN.bring = [...PLAN.bring, {id: uid(), name, for: $('#bring-for').value || 'all', per, every: per ? Math.max(1, Number($('#bring-every').value) || 1) : null}];
    input.value = '';
    savePlan(); renderBring();
  };

  /* Your own shopping items (PLAN.extras: [{id, name, qty}]), shown first under "Added". They stay until removed. */
  const renderExtras = (box) => {
    if (!PLAN.extras.length) return;
    box.append(el('h3', null, 'Added'));
    PLAN.extras.forEach((item) => {
      const key = 'buy|extra|' + item.id;
      const lab = el('label', 'item' + (CHECKED.includes(key) ? ' done' : ''));
      const cb = el('input'); cb.type = 'checkbox'; cb.checked = CHECKED.includes(key); cb.disabled = !canWrite;
      cb.addEventListener('change', () => {
        CHECKED = cb.checked ? [...new Set([...CHECKED, key])] : CHECKED.filter((x) => x !== key);
        lab.classList.toggle('done', cb.checked); saveChecks();
      });
      const rm = el('button', 'btn quiet rm', '✕'); rm.type = 'button'; rm.disabled = !canWrite; rm.setAttribute('aria-label', 'Remove ' + item.name);
      rm.addEventListener('click', (e) => {
        e.preventDefault();
        PLAN.extras = PLAN.extras.filter((x) => x.id !== item.id);
        CHECKED = CHECKED.filter((x) => x !== key);
        savePlan(); saveChecks(); renderShop();
      });
      lab.append(cb, el('span', 'nm', item.name), el('span', 'amt', item.qty || ''), rm);
      box.append(lab);
    });
  };
  const addExtra = () => {
    const name = $('#shop-new').value.trim();
    if (!name || !PLAN) return;
    PLAN.extras = [...PLAN.extras, {id: uid(), name, qty: $('#shop-qty').value.trim()}];
    $('#shop-new').value = ''; $('#shop-qty').value = '';
    savePlan(); renderShop();
    $('#shop-new').focus();
  };

  const renderShop = () => {
    renderBring();
    const box = $('#shoplist');
    box.replaceChildren();
    if (!PLAN || !REF) return;
    const per = perBall();
    const balls = plannedBalls();
    const t = tweaks();
    const counts = allCounts();
    const total = Object.entries(counts).filter(([k]) => !isDessert(k)).reduce((a, [, v]) => a + v, 0);
    const loaves = plannedServices().reduce((a, sv) => a + loavesFor(sv), 0);
    $('#shop-line').textContent = total.toLocaleString('en-US') + ' pizzas · ' + balls.toLocaleString('en-US') + ' dough balls' + (loaves ? ' · ' + loaves.toLocaleString('en-US') + (loaves === 1 ? ' loaf' : ' loaves') : '');
    const dough = plannedServices().reduce((a, sv) => a + doughFor(sv), 0);
    /* Everything to buy, in grams, keyed by ingredient name; dough items join the toppings. */
    const totals = new Map(), from = new Map(), makes = new Map(), missing = new Set();
    const add = (k, v) => totals.set(k, (totals.get(k) || 0) + v);
    if (per && dough) {
      const pool = per.poolish * dough;
      add('flour', per.flour * dough + pool / 2);
      add('salt', per.salt * dough);
      add('yeast', (per.yeast * dough * (Number(t.yeast) || 100)) / 100 + pool * POOLISH_YEAST_PER_G);
      ['flour', 'salt', 'yeast'].forEach((k) => { if (!from.has(k)) from.set(k, new Set()); from.get(k).add('dough'); });
    }
    /* F'Zookies come from their own tab (REF.dessert), in store packs, not from the menu toppings. */
    const zookies = Object.entries(counts).filter(([k]) => isDessert(k)).reduce((a, [, v]) => a + (Number(v) || 0), 0);
    const dessertRows = REF.dessert && zookies ? REF.dessert.items.map((d) => {
      const packs = (d.share * zookies) / REF.dessert.batch;
      const buy = Math.max(1, Math.ceil(packs - 0.02));
      const tenth = Math.round(packs * 10) / 10;
      const uses = packs < 0.95 ? 'uses about ' + Math.max(1, Math.round(packs * 100)) + '% of it' : 'uses about ' + tenth + (tenth === 1 ? ' pack' : ' packs');
      return [d.item, buy + (buy === 1 ? ' pack' : ' packs'), uses];
    }) : [];
    pizzaRows().forEach((r) => {
      const n = counts[r.pizza] || 0;
      if (!n) return;
      if (REF.dessert && isDessert(r.pizza)) return;
      if (r.grams == null) { missing.add(r.topping); return; }
      add(r.topping, r.grams * n);
      if (r.sauce) { if (!from.has(r.topping)) from.set(r.topping, new Set()); from.get(r.topping).add(r.sauce); makes.set(r.sauce, (makes.get(r.sauce) || 0) + r.grams * n); }
    });
    renderExtras(box);
    if (!totals.size && !missing.size && !dessertRows.length) { box.append(el('p', 'empty', 'Add a service and pick pizzas on the Plan tab to build the rest of the list.')); renderPrep(); return; }

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
    [...buy].sort((a, b) => b[1].grams - a[1].grams).forEach(([k, b]) => push(b.section, [k, shopAmount(b.grams), b.uses.size ? 'for ' + [...b.uses].join(', ') : '']));
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
    group('For ' + zookies + " F'Zookies", dessertRows, 'buy|zookie');
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
    const svcs = PLAN.services.filter((s) => s.date).map((s) => ({...s, use: doughFor(s)})).filter((s) => s.use > 0);
    if (!svcs.length) { box.append(el('p', 'empty', 'Add a service on the Plan tab to see the prep list.')); return; }
    const label = (s) => svcName(s) + ' · ' + day(s.date);
    const days = new Map();
    /* Same task on the same day is one line: amounts add up and the services are listed together. */
    const task = (date, rank, key, title, amt, note, unitName, fmt) => {
      if (!days.has(date)) days.set(date, []);
      const list = days.get(date);
      const same = typeof amt === 'number' && list.find((x) => x.title === title && typeof x.grams === 'number');
      if (same) { same.grams += amt; if (note && !same.notes.includes(note)) same.notes.push(note); return; }
      list.push({rank, key, title, unitName, fmt, grams: typeof amt === 'number' ? amt : null, amt: typeof amt === 'number' ? null : amt, notes: note ? [note] : []});
    };

    const mixes = new Map();
    svcs.forEach((s) => { const k = addDays(s.date, -lead); if (!mixes.has(k)) mixes.set(k, []); mixes.get(k).push(s); });
    mixes.forEach((list, mix) => {
      const balls = list.reduce((a, s) => a + s.use, 0);
      const n = Math.max(1, Math.ceil(balls / mixerCap()));
      const size = Math.ceil(balls / n);
      const bread = list.some(isBread);
      task(addDays(mix, -1), 0, 'poolish|' + mix, n === 1 ? 'Start poolish (evening)' : 'Start poolish (evening): ' + n + ' containers', doughText(list), list.map(label).join(' + '));
      task(mix, 1, 'mix|' + mix, n === 1 ? 'Mix dough' : 'Mix dough: ' + n + ' batches' + (bread ? '' : ' of ' + size), bread ? doughText(list) : (n * size).toLocaleString('en-US') + ' balls', list.map(label).join(' + '));
    });

    /* Toppings follow pizzas only; bread takes no share. */
    const rows = pizzaRows();
    const prepOf = new Map(REF.amounts.map((a) => [norm(a.topping), a]));
    const prepDays = setting('prep days before service') ?? setting('sauce days before service') ?? 1;
    /* Prep amounts in kitchen containers only (no weights): cups under a pint, pints under a quart, then quarts, rounded up to the half. */
    const half = (n) => { const r = Math.ceil(n * 2) / 2; const w = Math.floor(r); return (w ? String(w) : '') + (r % 1 ? '½' : '') || '0'; };
    const volume = (grams, name) => {
      const a = prepOf.get(norm(name));
      /* No container size on the Topping amounts tab: a rough weight, rounded up to the half pound. */
      if (!a || !a.gpq) return 'about ' + half(grams / 453.592) + ' lb';
      const cups = (grams / a.gpq) * 4;
      /* Round up first, then move to the next size once it fills it: 2 cups is 1 pt, 2 pt is 1 qt. */
      const c = Math.ceil(cups * 2) / 2;
      const pt = Math.ceil(cups) / 2;
      const qt = cups / 4;
      /* A topping with a set container (mozzarella in 8 qt Cambros) counts containers once it fills one. */
      const v = a.box && qt > a.box * 0.75 ? Math.ceil(qt / a.box - 0.02) + ' × ' + a.box + ' qt' : c < 2 ? half(c) + (c > 1 ? ' cups' : ' cup') : pt < 2 ? half(pt) + ' pt' : half(qt) + ' qt';
      return v;
    };
    svcs.forEach((s) => {
      const own = countsOf(s);
      const direct = new Map(), sauces = new Map();
      rows.forEach((r) => {
        const n = own[r.pizza] || 0;
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
      /* F'Zookies: cookie dough and whipped cream on the prep day, counted in F'Zookies (batches when the tab gives a batch size). */
      const zookies = Object.entries(own).filter(([k]) => isDessert(k)).reduce((a, [, v]) => a + (Number(v) || 0), 0);
      if (zookies) {
        const batch = REF.dessert && REF.dessert.batch;
        const dough = (n) => (batch ? half(n / batch) + (n / batch > 1 ? ' batches' : ' batch') + ' · ' : '') + n + " F'Zookies";
        task(addDays(s.date, -prepDays), 4, 'zookie|dough', "Make F'Zookie dough", zookies, label(s), null, dough);
        task(addDays(s.date, -prepDays), 4, 'zookie|cream', 'Make whipped cream', zookies, label(s), null, (n) => 'for ' + n + " F'Zookies");
      }
    });

    /* Past days drop off once everything on them is checked. Anything left unchecked stays, under
       "Missed", until it's checked off or its service is cleared. */
    const today = todayStr();
    const left = (d) => days.get(d).some((x) => !CHECKED.includes('prep|' + d + '|' + x.key));
    const past = [...days.keys()].filter((d) => d < today);
    const done = past.filter((d) => !left(d)).length;
    if (done) box.append(el('p', 'empty', done === 1 ? 'One earlier prep day is done.' : done + ' earlier prep days are done.'));
    [...days.keys()].filter((d) => d >= today || left(d)).sort().forEach((d) => {
      /* The day's heading names the services its prep is for, so items stay one line. */
      const fors = [...new Set(days.get(d).flatMap((x) => x.notes.join(' + ').split(' + ')).filter(Boolean))];
      box.append(el('h3', d < today ? 'missed' : null, (d < today ? 'Missed: ' : '') + rel(d) + (fors.length ? ' — for ' + fors.join(', ') : '')));
      days.get(d).sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title)).forEach((x) => {
        const key = 'prep|' + d + '|' + x.key;
        const lab = el('label', 'item' + (CHECKED.includes(key) ? ' done' : ''));
        const cb = el('input'); cb.type = 'checkbox'; cb.checked = CHECKED.includes(key); cb.disabled = !canWrite;
        cb.addEventListener('change', () => {
          CHECKED = cb.checked ? [...new Set([...CHECKED, key])] : CHECKED.filter((k) => k !== key);
          lab.classList.toggle('done', cb.checked); saveChecks();
        });
        const nm = el('span', 'nm', x.title);
        lab.append(cb, nm, el('span', 'amt', x.grams != null ? (x.fmt ? x.fmt(x.grams) : volume(x.grams, x.unitName)) : x.amt));
        box.append(lab);
      });
    });
    if (!anyPicked()) box.append(el('p', 'empty', "Pick pizzas or F'Zookies on the Plan tab to add sauce, topping and dessert prep."));
  };

  /* ---------- Controls ---------- */
  root.querySelectorAll('.tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('.tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    ['plan', 'shop', 'prep', 'bring', 'wrapup'].forEach((p) => { $('#page-' + p).hidden = b.dataset.tab !== p; });
    try { window.history.replaceState(null, '', '#' + b.dataset.tab); } catch (e) { /* hash is optional */ }
  }));
  /* Swipe left or right anywhere in the middle of the screen to go to the next or previous tab.
     Edges are left alone (the phone's own back swipe), and so are sliders, the text box you're
     typing in, and anything that scrolls sideways. */
  let swipe = null;
  root.addEventListener('touchstart', (e) => {
    swipe = null;
    if (e.touches.length !== 1) return;
    const t = e.touches[0], edge = 28;
    if (t.clientX < edge || t.clientX > window.innerWidth - edge) return;
    for (let n = e.target; n && n !== root; n = n.parentElement) {
      if (n === document.activeElement && /^(INPUT|TEXTAREA)$/.test(n.tagName)) return; // typing: leave the cursor alone
      if (n.type === 'range' || n.isContentEditable) return;
      if (n.scrollWidth > n.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return;
    }
    swipe = {x: t.clientX, y: t.clientY, at: Date.now()};
  }, {passive: true});
  root.addEventListener('touchcancel', () => { swipe = null; }, {passive: true});
  root.addEventListener('touchend', (e) => {
    const s0 = swipe; swipe = null;
    if (!s0 || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0], dx = t.clientX - s0.x, dy = t.clientY - s0.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - s0.at > 700) return;
    if (String(window.getSelection && window.getSelection()).trim()) return;
    const tabs = [...root.querySelectorAll('.tabs [data-tab]')].filter((b) => !b.hidden);
    const at = tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const next = tabs[at + (dx < 0 ? 1 : -1)];
    if (!next) return;
    next.click();
    const page = $('#page-' + next.dataset.tab);
    page.classList.remove('swipe-in-left', 'swipe-in-right');
    void page.offsetWidth;
    page.classList.add(dx < 0 ? 'swipe-in-left' : 'swipe-in-right');
    page.addEventListener('animationend', () => page.classList.remove('swipe-in-left', 'swipe-in-right'), {once: true});
  }, {passive: true});
  if (['#shop', '#bring', '#prep'].includes(window.location.hash) || (window.location.hash === '#wrapup' && deps.wrapUps)) root.querySelector('.tabs [data-tab="' + window.location.hash.slice(1) + '"]').click();
  /* Between rounds: drop services whose day has passed (their prep goes with them). Upcoming
     services, picked pizzas, your own lists and all checkmarks stay. */
  $('#clear-done').addEventListener('click', () => {
    if (!PLAN || !canWrite) return;
    const today = todayStr();
    PLAN.services = PLAN.services.filter((s) => !s.date || s.date >= today);
    savePlan(); renderAll(); renderPrep();
  });
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
  $('#split').addEventListener('click', () => { const s = cur(); if (!s) return; s.manualCounts = false; spreadSvc(s); savePlan(); renderCounters(); renderShop(); });
  $('#clear').addEventListener('click', () => { const s = cur(); if (!s) return; s.picked = []; s.counts = {}; s.manualCounts = false; savePlan(); renderPizzas(); });
  $('#same-as').addEventListener('change', () => {
    const s = cur(), from = pizzaSvcs().find((x) => x.id === $('#same-as').value);
    if (!s || !from) return;
    s.picked = pickedOf(from).slice(); s.counts = {}; Object.entries(countsOf(from)).forEach(([k, v]) => { if (isDessert(k)) s.counts[k] = v; });
    s.manualCounts = false; spreadSvc(s); savePlan(); renderPizzas();
  });
  $('#uncheck').addEventListener('click', () => { CHECKED = CHECKED.filter((k) => !k.startsWith('buy|') && !k.startsWith('make|')); saveChecks(); renderShop(); });
  $('#bring-uncheck').addEventListener('click', () => { CHECKED = CHECKED.filter((k) => !k.startsWith('bring|')); saveChecks(); renderBring(); });
  $('#shop-form').addEventListener('submit', (e) => { e.preventDefault(); addExtra(); });
  $('#bring-add').addEventListener('click', addBring);
  BRING_FOR.forEach(([v, t]) => { const o = el('option', null, t); o.value = v; $('#bring-for').append(o); });
  $('#bring-per').addEventListener('change', () => { $('#bring-every-wrap').hidden = !$('#bring-per').value; });
  $('#bring-edit').addEventListener('click', () => { bringEditing = !bringEditing; renderBring(); });
  $('#bring-new').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addBring(); } });
  /* Today and later only: unchecking past days would bring them all back as missed. */
  $('#prep-uncheck').addEventListener('click', () => { const t = todayStr(); CHECKED = CHECKED.filter((k) => !k.startsWith('prep|') || k.split('|')[1] < t); saveChecks(); renderPrep(); });
  root.querySelectorAll('.seg [data-step]').forEach((b) => b.addEventListener('click', () => {
    step = Number(b.dataset.step) || 1;
    root.querySelectorAll('.seg [data-step]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));

  const defaultPlan = () => ({services: [{id: uid(), date: nextFriday(), type: 'pf', guests: 100, ppg: null, balls: null, picked: [], counts: {}}], tweaks: {}, perService: true});

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
  // Problems show in the header; the normal "last changed" line sits quietly
  // under Yeast, water and timing (the sheets re-read every hour on their own).
  const dataProblem = (msg) => {
    $('#data-warn').replaceChildren(msg ? el('span', 'warn', msg) : '');
    $('#data-status').textContent = msg || '';
  };
  const showDataStatus = () => {
    if (!REF) { dataProblem(deps.isAdmin ? 'No recipe or menu saved yet. Open "Yeast, water and timing" and tap Refresh now.' : 'No recipe or menu saved yet. Ask Jaron to refresh the planner.'); return; }
    dataProblem('');
    const d = new Date(REF.at || 0);
    $('#data-status').textContent = 'Recipe, toppings and Pizza Friday history come from your sheets and update every hour. Last changed ' + d.toLocaleString('en-US', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) + '.';
  };

  /* ---------- Boot ---------- */
  db = deps.store;
  const unsubs = [];
  if (!deps.canWrite) setReadOnly(true);
  let firstPlan = true;
  unsubs.push(db.doc('ref/snapshot').onSnapshot((snap) => {
    if (snap.exists) { REF = snap.data(); if (PLAN && migratePizzas() && canWrite) savePlan(); renderAll(); }
    showDataStatus();
  }, () => { dataProblem('The saved recipe and menu couldn\'t load. Reload the page.'); }));
  unsubs.push(db.doc('plan/current').onSnapshot((snap) => {
    if (snap.metadata.hasPendingWrites) return;
    if (localPending) return;
    if (snap.exists && snap.data()._by === TAB && !firstPlan) return;
    if (snap.exists) { const d = JSON.parse(JSON.stringify(snap.data())); delete d._by; delete d._rev; PLAN = d; }
    else if (firstPlan) PLAN = defaultPlan();
    PLAN.services = PLAN.services || []; PLAN.tweaks = PLAN.tweaks || {}; PLAN.bring = PLAN.bring || []; PLAN.extras = PLAN.extras || []; PLAN.where = PLAN.where || {};
    firstPlan = false;
    if (REF && migratePizzas() && canWrite) savePlan();
    renderAll();
  }, () => { $('#save-status').textContent = 'The plan couldn\'t load. Reload the page.'; }));
  unsubs.push(db.doc('plan/checks').onSnapshot((snap) => {
    if (snap.metadata.hasPendingWrites) return;
    if (snap.exists && snap.data()._by === TAB) return;
    CHECKED = snap.exists && Array.isArray(snap.data().checked) ? snap.data().checked.slice() : [];
    if (!busy()) renderShop();
  }));
  if (deps.wrapUps) {
    $('#tab-wrapup').hidden = false;
    loadWrapCount();
    root.addEventListener('wrapups-changed', loadWrapCount);
  }
  if (deps.calendar) {
    deps.calendar().then((d) => { CAL = d || {items: []}; if (!busy()) renderAll(); else renderCal(); }).catch(() => { CAL = {items: [], problem: "Couldn't read the calendar right now."}; renderCal(); });
  }
  /* The pizza list straight from the website menu, so menu edits and older pizzas show right away. */
  if (deps.pizzas) {
    unsubs.push(deps.pizzas((val) => {
      MENU = Object.values(val || {})
        .filter((p) => p && p.name)
        .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.name).localeCompare(String(b.name)))
        .map((p) => ({name: String(p.name).trim(), toppings: String(p.toppings || ''), active: !!p.active}));
      if (!busy()) renderAll();
    }));
  }
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
