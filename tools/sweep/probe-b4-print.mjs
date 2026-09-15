/* Batch B4 gate — THE TAKEOFF PRINTS EVERY SHEET (plan §B4 · rulings R-10a … R-10g).
 * Patrick, 2026-09-14, complaint #1: "no ability to print a takeoff that uses multiple pdf pages".
 * RED-first on the 2.0.0-rc.5 base. Zero deps; raw CDP; same CLI shape as probe-b3-colors.mjs.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b4-print.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet/takeoff.v3.json" \
 *     "$PWD/fixtures/synthetic/three-sheet/plan.pdf" "$PWD" [--no-subgates]
 *
 * Rows B4-1 … B4-9, PASS/FAIL + value each; exit 0 all green, 1 on any FAIL, 2 if Chrome never
 * came up. `--no-subgates` skips B4-8's and B4-9's child gates (probe-ae, probe-p903-doc, G0,
 * probe-b0-fixture, probe-b1-pitch, probe-b2a-sections, probe-b2b-regions, probe-b3-colors),
 * which launch Chrome eight more times.
 *
 * WHAT EACH ROW READS (the charter asks this be stated per row):
 *   B4-1  composed #printDoc DOM  +  Page.printToPDF bytes of the live app page (page count and
 *         every /MediaBox orientation — the strand a sheet makes is only visible in the bytes)
 *   B4-2  composed #printDoc DOM, cross-checked against an independent in-page recomputation of
 *         the per-section SF/LF/EA totals from VESCore.rollup + dispQtyOf
 *   B4-3  the chooser's own DOM (real clicks on real checkboxes, a real Escape keydown) then the
 *         composed #printDoc DOM
 *   B4-4  composed #printDoc DOM after a real print event (window.print is stubbed to fire
 *         beforeprint/afterprint exactly as Chrome does, so the latch discipline is real here)
 *   B4-5  the proposal document string proposalHTML() returns
 *   B4-6  composed #printDoc DOM in three states (cancelled chooser · forced raster failure ·
 *         completed print), each read after a real print event
 *   B4-7  state.identity / snapshot().identity, and the #idModal open state on a fixture load
 *   B4-8  the bytes of src/VES_PM.html (grep) + child gates probe-ae, probe-p903-doc
 *   B4-9  child gates: G0, probe-b0-fixture, probe-b1-pitch, probe-b2a-sections,
 *         probe-b2b-regions, probe-b3-colors
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const NOSUB = args.includes('--no-subgates');
const [VES, TAKEOFF, PDF, ROOT] = args.filter((a) => !a.startsWith('--'));
if (!VES || !TAKEOFF || !PDF || !ROOT) {
  console.error('usage: probe-b4-print.mjs <VES_PM.html> <takeoff.v3.json> <plan.pdf> <repoRoot> [--no-subgates]');
  process.exit(2);
}
const FIXDIR = dirname(TAKEOFF);
const TMP = mkdtempSync(join(tmpdir(), 'ves-b4-'));

/* ---------- CDP ---------- */
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url); let id = 0; const pending = new Map();
    ws.addEventListener('open', () => resolve({
      send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); },
      close() { ws.close(); },
    }));
    ws.addEventListener('error', () => reject(new Error('ws')));
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
    });
  });
}
const port = 9300 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b4p-'))}`, '--remote-allow-origins=*',
  '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 600 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {}
  if (!wsUrl) await sleep(100);
}
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }

const c = await connect(wsUrl);
await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => {
  const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
};
const tryEv = async (expr) => { try { return await ev(expr); } catch (e) { return { error: String(e.message || e).slice(0, 400) }; } };

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
};

/* The print latch is only honest if the print event is real: Chrome fires beforeprint then
   afterprint around window.print(). Every probe in this lineage stubs window.print to a bare counter,
   which suppresses both — so a release wired to afterprint would never be exercised, and a row that
   reads #printDoc after the print would be reading a document the real browser had already let go of.
   This stub does three things: it counts, it SNAPSHOTS the document at the instant it goes to paper
   (window.__snap — what the printer actually got), and, when window.__fire is on, it dispatches the
   beforeprint/afterprint pair synchronously exactly where Chrome dispatches them. __fire is OFF for
   the rows that read the composed document or ask Chrome to render it (they need the latch still
   holding, the way every gate in this lineage reads it) and ON for B4-6, which is the row about the
   release itself. */
const ARM = `window.__printed = 0; window.__fire = false; window.__snap = null;
  window.print = () => { window.__printed++;
    window.__snap = document.getElementById('printDoc').cloneNode(true);
    if (window.__fire) { window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('afterprint')); } };
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__latch = () => { const d = document.getElementById('printDoc');
    const t = d.innerHTML.replace(/<img[^>]*>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\\s+/g, ' ').trim();
    return { text: t, len: d.innerHTML.length, img: /<img src="data:image\\/png/.test(d.innerHTML),
      sheets: d.querySelectorAll('.tk-sheet').length, tables: d.querySelectorAll('table').length,
      released: /print-ph/.test(d.innerHTML) && d.querySelectorAll('.tk-sheet, table').length === 0,
      money: /\\$\\s?\\d/.test(t) || /\\b(Cost|Sell|Overhead|Markup|Profit|Unit price|Amount|Total)\\b/.test(t),
      toast: document.getElementById('toast').textContent, printed: window.__printed }; };
  /* the door, then the chooser if this build has one. leave = pages to UNCHECK. act: 'print' | 'esc' | 'outside' */
  window.__door = async (leave, act) => {
    leave = leave || []; act = act || 'print';
    const b = document.getElementById('btnMenuTakeoff');
    if (!b) return { error: 'no btnMenuTakeoff' };
    const wasDisabled = b.disabled;
    b.click();
    await new Promise(r => setTimeout(r, 250));
    const modal = document.getElementById('tkSheetModal');
    const open = !!(modal && modal.classList.contains('open'));
    let boxes = [];
    if (open) {
      boxes = [...modal.querySelectorAll('input[type=checkbox]')].map(x => ({ page: +x.value, checked: x.checked, disabled: x.disabled, label: (x.closest('label') || x.parentElement).textContent.replace(/\\s+/g, ' ').trim() }));
      for (const n of leave) { const x = modal.querySelector('input[type=checkbox][value="' + n + '"]'); if (x && x.checked) x.click(); }
      await new Promise(r => setTimeout(r, 60));
      if (act === 'esc') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      else if (act === 'outside') modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      else modal.querySelector('#tkSheetPrint').click();
    }
    await new Promise(r => setTimeout(r, 3000));
    return { wasDisabled, chooser: open, boxes, stillOpen: !!(modal && modal.classList.contains('open')) };
  };
  1`;

async function boot() {
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: 'file://' + VES });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) return true; } catch (_) {} await sleep(50); }
  return false;
}
if (!await boot()) { console.error('HARNESS FAIL: the app never booted'); chrome.kill('SIGKILL'); process.exit(2); }
await sleep(400);
await ev(`localStorage.clear(); ${ARM}`);

const takeoffText = readFileSync(TAKEOFF, 'utf8');
const pdfB64 = readFileSync(PDF).toString('base64');
const PDFBYTES = readFileSync(PDF).length;
const B64ARM = `const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);`;

const loaded = await tryEv(`(async () => {
  ${B64ARM}
  await VESApp.openFromBytes(u8, 'plan.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  window.__take = ${takeoffText};
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  const pages = {}; for (const m of VESApp.state.measurements) if (m.page != null) pages[m.page] = (pages[m.page] || 0) + 1;
  return { conditions: VESApp.state.conditions.length, numPages: VESApp.state.numPages, pages,
    labels: [1, 2, 3].map(n => pageLabel(n)) };
})()`);
if (loaded.error) { console.error('HARNESS FAIL: the fixture did not load — ' + loaded.error); chrome.kill('SIGKILL'); process.exit(2); }
console.log('# fixture loaded: ' + JSON.stringify(loaded) + '\n');

/* what the paper OUGHT to say, computed in the page from the model and nothing else */
const expectExpr = `(() => {
  const st = VESApp.state, roll = VESCore.rollup(st.conditions, st.measurements);
  const byId = Object.fromEntries(st.conditions.map(c => [c.id, c]));
  const rollById = Object.fromEntries(roll.map(r => [r.id, r]));
  const pages = [...new Set(st.measurements.filter(m => m.page != null && m.points && m.points.length).map(m => m.page))].sort((a, b) => a - b);
  // per sheet: the conditions measured on it, and that sheet's own quantity for each
  const perSheet = pages.map(n => {
    const on = st.measurements.filter(m => m.page === n && m.points && m.points.length && byId[m.conditionId]);
    const seen = [], out = [];
    for (const m of on) { const cd = byId[m.conditionId]; if (seen.indexOf(cd.id) >= 0) continue; seen.push(cd.id);
      const f = dispQtyOf(rollById[cd.id], cd).pitch || 1;
      let sum = 0; for (const mm of on) { if (mm.conditionId !== cd.id) continue; if (mm.type === 'count') sum += mm.points.length; else if (mm.value != null) sum += mm.value; }
      out.push({ id: cd.id, name: cd.name, qty: cd.type === 'count' ? (sum + ' EA') : VESCore.formatValue(cd.type, sum * f) }); }
    return { page: n, label: pageLabel(n), conds: out };
  });
  // per section: the SF/LF/EA totals the quantities page must print
  const TYPE_ORDER = { area: 0, linear: 1, count: 2 };
  const secs = jobSections().map(sn => {
    const mine = st.conditions.filter(cd => sectionOfCondition(cd) === sn && rollById[cd.id] && rollById[cd.id].count > 0);
    if (!mine.length) return null;
    const tot = new Map();
    for (const cd of mine) { const r = rollById[cd.id]; const u = displayUnit(r.unit) || '';
      const k = (TYPE_ORDER[cd.type] == null ? 3 : TYPE_ORDER[cd.type]) + '|' + u;
      tot.set(k, (tot.get(k) || 0) + dispQtyOf(r, cd).qty); }
    return { sec: sn, parts: [...tot.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => VESCore.fmtQty(v) + ' ' + k.split('|')[1]).join(' · ') };
  }).filter(Boolean);
  return { pages, perSheet, secs };
})()`;
const want = await tryEv(expectExpr);

/* read the composed takeoff document */
const readDocExpr = `(() => {
  const d = document.getElementById('printDoc');
  const secs = [...d.querySelectorAll('.tk-sheet')];
  return {
    meta: [...d.querySelectorAll('.meta')].map(x => x.textContent.replace(/\\s+/g, ' ').trim()).join(' | '),
    heads: secs.map(s => ((s.querySelector('h2') || {}).textContent || '').replace(/\\s+/g, ' ').trim()),
    imgs: secs.map(s => { const im = s.querySelector('img'); return im ? { png: /^data:image\\/png/.test(im.src), nw: im.naturalWidth } : null; }),
    legends: secs.map(s => ([...s.querySelectorAll('table.plegend tbody td.lgnm')].map(td => td.textContent.replace(/\\s+/g, ' ').trim()))),
    miss: secs.map(s => !!s.querySelector('.pviz-miss')),
    qtyHeads: [...new Set([...d.querySelectorAll('.tk-qty tr.sech')].map(t => t.dataset.sec))],
    qtySubs: [...d.querySelectorAll('.tk-qty tr.secsub')].map(t => ({ sec: t.dataset.sec, text: t.textContent.replace(/\\s+/g, ' ').trim() })),
    qtyBasis: ([...d.querySelectorAll('.tk-qty .basis')].map(x => x.textContent.replace(/\\s+/g, ' ').trim()).join(' ')),
    latch: window.__latch(),
  };
})()`;

async function pdfPages() {
  try {
    const { data } = await Promise.race([
      c.send('Page.printToPDF', { printBackground: false, preferCSSPageSize: true }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('printToPDF did not return within 90 s')), 90000)),
    ]);
    const txt = Buffer.from(data, 'base64').toString('latin1');
    const boxes = [...txt.matchAll(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g)]
      .map((m) => ({ w: Math.round(+m[3] - +m[1]), h: Math.round(+m[4] - +m[2]) }));
    return { n: boxes.length, landscape: boxes.filter((b) => b.w > b.h).length, boxes };
  } catch (e) { return { error: String(e.message || e).slice(0, 160) }; }
}

/* ════ B4-1 — every measured sheet is a figure, in sheet order, captioned, with its own legend;
   the rendered document is one landscape page per sheet plus the quantities page ════ */
const d1 = await tryEv(`(async () => { const r = await window.__door([], 'print'); return { door: r, doc: ${readDocExpr} }; })()`);
const pdf1 = d1.error ? { error: 'door failed' } : await pdfPages();
/* The strand check on its own terms: a long job's quantity tables may legitimately run to a second
   page (R-10d says "page(s)"), so the total alone cannot say whether a SHEET stranded. Hide the
   closing section and render again — the sheet block must be exactly one page per sheet. */
await tryEv(`(() => { const q = document.querySelector('#printDoc .tk-qty'); if (q) q.style.display = 'none'; return 1; })()`);
const pdfSheets = d1.error ? { error: 'door failed' } : await pdfPages();
await tryEv(`(() => { const q = document.querySelector('#printDoc .tk-qty'); if (q) q.style.display = ''; return 1; })()`);
let r1ok = false; const r1d = {};
if (!d1.error && !want.error) {
  const doc = d1.doc, W = want;
  const heads = W.perSheet.map((s) => 'Sheet ' + s.label + ' of ' + W.pages.length);
  const legendOk = W.perSheet.map((s, i) => {
    const got = (doc.legends[i] || []).join(' | ');
    const mineIn = s.conds.every((cd) => got.includes(cd.name) && got.includes(cd.qty));
    const strangers = W.perSheet.filter((x, j) => j !== i).flatMap((x) => x.conds.map((cd) => cd.name))
      .filter((n) => !s.conds.some((cd) => cd.name === n) && got.includes(n));
    return { page: s.page, mineIn, strangers };
  });
  // the two conditions the fixture measures on two sheets must show each sheet's OWN number
  const spanning = W.perSheet[0].conds.filter((cd) => W.perSheet.some((s, j) => j > 0 && s.conds.some((x) => x.id === cd.id)));
  const spanOk = spanning.length >= 1 && spanning.every((cd) => {
    const where = W.perSheet.map((s, i) => ({ i, c: s.conds.find((x) => x.id === cd.id) })).filter((x) => x.c);
    return where.length >= 2 && where.every((x) => (doc.legends[x.i] || []).join(' | ').includes(x.c.qty))
      && new Set(where.map((x) => x.c.qty)).size === where.length;
  });
  r1ok = doc.heads.length === W.pages.length
    && doc.heads.every((h, i) => h.indexOf(heads[i]) === 0)
    && doc.imgs.every((im) => im && im.png && im.nw > 400)
    && legendOk.every((x) => x.mineIn && x.strangers.length === 0)
    && spanOk
    && !pdf1.error && pdf1.n === W.pages.length + 1 && pdf1.landscape === pdf1.n
    && !pdfSheets.error && pdfSheets.n === W.pages.length;
  Object.assign(r1d, { sheets: doc.heads, wantHeads: heads, imgs: doc.imgs, legendOk, spanning: spanning.map((x) => x.name), spanOk, rendered: pdf1, sheetBlockPages: pdfSheets, printed: doc.latch.printed });
} else Object.assign(r1d, { door: d1.error || d1.door, want: want.error });
check('B4-1 the takeoff door prints one landscape page per measured sheet, in sheet order, each captioned "Sheet N of 3" with its own legend (only that sheet\'s conditions, that sheet\'s quantity) and the quantities page after them — rendered: 3 sheet pages + 1, and the sheet block alone renders as exactly 3 pages, so no sheet strands onto a second one', r1ok, r1d);

/* ════ B4-2 — the quantities page: Section headings, the SF/LF/EA subtotals the model computes,
   and no money anywhere on the paper ════ */
let r2ok = false; const r2d = {};
if (!d1.error && !want.error) {
  const doc = d1.doc;
  const wantSecs = want.secs.map((s) => s.sec);
  const mism = [];
  for (const s of want.secs) {
    const got = doc.qtySubs.find((x) => x.sec === s.sec);
    if (!got) { mism.push('no subtotal row for ' + s.sec); continue; }
    if (!got.text.includes(s.parts)) mism.push(s.sec + ': printed "' + got.text + '" wanted "' + s.parts + '"');
  }
  r2ok = wantSecs.every((n) => doc.qtyHeads.indexOf(n) >= 0)
    && doc.qtySubs.length >= 4 && doc.qtySubs.every((x) => /SF|LF|EA/.test(x.text))
    && mism.length === 0 && doc.latch.money === false
    && /whole takeoff/i.test(doc.qtyBasis);
  Object.assign(r2d, { sections: doc.qtyHeads, wantSections: wantSecs, subs: doc.qtySubs.map((x) => x.text), mismatches: mism, money: doc.latch.money, basis: doc.qtyBasis.slice(0, 200) });
} else Object.assign(r2d, { door: d1.error, want: want.error });
check('B4-2 the closing quantities page carries "Section: <name>" headings and the SF/LF/EA subtotals the model computes, says the quantities are for the whole takeoff, and no money word or $ figure reaches the paper', r2ok, r2d);

/* ════ B4-3 — the chooser: leave a sheet out, and say so on the paper; Esc prints nothing ════ */
const d3 = await tryEv(`(async () => { const r = await window.__door([2], 'print'); return { door: r, doc: ${readDocExpr} }; })()`);
const d3esc = await tryEv(`(async () => { const before = window.__printed; const r = await window.__door([], 'esc'); return { door: r, printedBefore: before, latch: window.__latch() }; })()`);
let r3ok = false; const r3d = {};
if (!d3.error && !d3esc.error && !want.error) {
  const doc = d3.doc;
  const shown = want.pages.filter((n) => n !== 2).map((n) => want.perSheet.find((s) => s.page === n).label);
  const line = 'Sheets shown: ' + shown.join(', ') + ' of ' + want.pages.length;
  const subsSame = JSON.stringify(doc.qtySubs.map((x) => x.text)) === JSON.stringify((d1.doc ? d1.doc.qtySubs : []).map((x) => x.text));
  r3ok = d3.door.chooser === true
    && doc.heads.length === want.pages.length - 1
    && doc.meta.indexOf(line) >= 0
    && subsSame && /whole takeoff/i.test(doc.qtyBasis)
    && d3esc.door.chooser === true && d3esc.latch.printed === d3esc.printedBefore && d3esc.latch.released === true;
  Object.assign(r3d, { chooser: d3.door.chooser, boxes: d3.door.boxes, sheets: doc.heads, meta: doc.meta.slice(0, 160), wantLine: line, subtotalsUnchanged: subsSame, esc: { chooser: d3esc.door.chooser, printed: d3esc.latch.printed, before: d3esc.printedBefore, released: d3esc.latch.released, text: d3esc.latch.text.slice(0, 80) } });
} else Object.assign(r3d, { d3: d3.error, esc: d3esc.error });
check('B4-3 the door opens a sheet chooser (measured sheets checked, unmeasured listed and greyed): unchecking one prints the other two and the paper\'s first line names which sheets are shown, the quantity subtotals do not move; Escape cancels — nothing printed, the latch released', r3ok, r3d);

/* ════ B4-4 — typed-only prints its tables with no figure; empty releases the latch and says so
   (the AE5 semantics, folded in from the deleted printTakeoffDoc) ════ */
const demoPath = join(ROOT, 'release', 'demo', 'demo-flat-roof.json');
let demoText = null; try { demoText = readFileSync(demoPath, 'utf8'); } catch (_) {}
let r4ok = false; let r4d = {};
if (!demoText) r4d = { error: 'no demo at ' + demoPath };
else {
  await boot(); await sleep(300); await ev(`localStorage.clear(); ${ARM}`);
  const typed = await tryEv(`(async () => { VESApp.loadFromData(${demoText}); await new Promise(r => setTimeout(r, 600)); const r = await window.__door([], 'print'); return { door: r, latch: window.__latch() }; })()`);
  await boot(); await sleep(300); await ev(`localStorage.clear(); ${ARM}`);
  const empty = await tryEv(`(async () => { const r = await window.__door([], 'print'); return { door: r, latch: window.__latch() }; })()`);
  if (!typed.error && !empty.error) {
    r4ok = typed.latch.printed === 1 && typed.latch.img === false && typed.latch.money === false
      && typed.latch.text.includes('3,150.8 SF') && typed.latch.text.includes('240 LF')
      && empty.latch.printed === 0 && /nothing measured/i.test(empty.latch.toast)
      && /open a plan|start a grid/i.test(empty.latch.toast) && empty.latch.released === true;
  }
  r4d = { typed: typed.error || { printed: typed.latch.printed, img: typed.latch.img, money: typed.latch.money, has: [typed.latch.text.includes('3,150.8 SF'), typed.latch.text.includes('240 LF')], chooser: typed.door.chooser, text: typed.latch.text.slice(0, 160) },
    empty: empty.error || { printed: empty.latch.printed, toast: empty.latch.toast, released: empty.latch.released, doorDisabled: empty.door.wasDisabled, text: empty.latch.text.slice(0, 80) } };
}
check('B4-4 a typed-only takeoff prints its quantity tables (3,150.8 SF · 240 LF) with no figure and no money; with nothing measured at all the door prints nothing, releases the latch, and the toast says what is missing', r4ok, r4d);

/* ---------- back to the fixture for the remaining in-page rows ---------- */
await boot(); await sleep(300); await ev(`localStorage.clear(); ${ARM}`);
const reload = await tryEv(`(async () => {
  ${B64ARM}
  await VESApp.openFromBytes(u8, 'plan.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  window.__take = ${takeoffText};
  const idOpenBefore = !!document.getElementById('idModal').classList.contains('open');
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  return { conds: VESApp.state.conditions.length, idOpenBefore,
    idModalOpen: !!document.getElementById('idModal').classList.contains('open'),
    openSize: VESApp.state.identity ? VESApp.state.identity.fileSize : null,
    savedSize: (VESApp.snapshot ? VESApp.snapshot().identity.fileSize : null),
    fileSavedSize: window.__take.identity.fileSize };
})()`);

/* ════ B4-5 — the proposal carries one figure per measured sheet ════ */
const r5 = await tryEv(`(async () => {
  const h = await VESApp.proposalHTML();
  const figs = h.match(/<figure class="pviz">[\\s\\S]*?<\\/figure>/g) || [];
  const i = h.indexOf('Plan snapshot'); const j = h.indexOf('<h2 class="sec">', i + 10);
  const section = i >= 0 ? h.slice(i, j > i ? j : h.length) : '';
  return { figs: figs.length, pngs: figs.filter(f => /<img src="data:image\\/png/.test(f)).length,
    swatches: (section.match(/class="sw"/g) || []).length,
    glyphs: (section.match(/class="sw"[^>]*>[^<\\s]/g) || []).length,
    captions: (section.match(/<figcaption>[^<]*/g) || []).map(s => s.replace('<figcaption>', '').slice(0, 60)),
    money: /\\$\\s?\\d/.test(section.replace(/<[^>]+>/g, ' ')), len: h.length };
})()`);
const wantFigs = want.error ? 0 : want.pages.length;
const r5ok = !r5.error && r5.figs === wantFigs && r5.pngs === wantFigs && r5.swatches >= 10 && r5.glyphs >= 10 && r5.money === false;
check('B4-5 the proposal carries one plan figure per measured sheet, each a PNG with its own pattern-glyph legend, and no money inside the plan-snapshot section', r5ok, { want: wantFigs, ...(r5.error ? { error: r5.error } : r5) });

/* ════ B4-6 — the latch in all three states ════ */
const r6 = await tryEv(`(async () => {
  window.__fire = true;   // from here the stub fires beforeprint/afterprint like Chrome does
  // (a) cancelled chooser
  const a = await window.__door([], 'esc');
  const latchA = window.__latch();
  // (b) a sheet whose raster throws — a marked placeholder is printed and the toast counts it
  const orig = window.compositeSheet;
  window.compositeSheet = async (n, o) => (n === 2 ? { fail: 'forced raster failure (probe)' } : orig(n, o));
  const b = await window.__door([], 'print');
  const latchB = window.__latch();
  // what the printer GOT, not what is left behind afterwards
  const misses = window.__snap ? window.__snap.querySelectorAll('.tk-sheet .pviz-miss').length : -1;
  const sheetsPrinted = window.__snap ? window.__snap.querySelectorAll('.tk-sheet').length : -1;
  window.compositeSheet = orig;
  // (c) a full, successful print
  const cc = await window.__door([], 'print');
  const latchC = window.__latch();
  return { a: { chooser: a.chooser, released: latchA.released, text: latchA.text.slice(0, 70) },
    b: { misses, sheetsPrinted, toast: latchB.toast, released: latchB.released, printed: latchB.printed },
    c: { released: latchC.released, text: latchC.text.slice(0, 70), printed: latchC.printed } };
})()`);
const r6ok = !r6.error && r6.a.released === true && r6.b.misses === 1 && r6.b.sheetsPrinted === 3
  && /did not render/i.test(r6.b.toast || '') && r6.b.released === true && r6.c.released === true;
check('B4-6 the print latch is released in all three states: after a cancelled chooser, after a sheet whose raster fails (a marked placeholder prints and the toast counts it), and after a completed print — #printDoc holds the release placeholder and nothing else', r6ok, r6);

/* ════ B4-7 — C-B0-1: identity.fileSize is the PDF's real byte length; a 0 on an existing file
   is UNKNOWN and still loads with no identity modal ════ */
const r7ok = !reload.error && reload.openSize === PDFBYTES && reload.savedSize === PDFBYTES
  && reload.fileSavedSize === 0 && reload.idModalOpen === false && reload.conds === 26;
check('B4-7 identity.fileSize on a fresh PDF-backed takeoff is the file\'s real byte length (the pdf.js detach is read before the hand-off), and the fixture\'s own v3 file (fileSize 0 = unknown) still loads with no identity modal', r7ok, { wantBytes: PDFBYTES, ...reload });

/* ---------- subgates ---------- */
let sub = [];
const run = (label, cmd, argv, want2) => {
  const t0 = Date.now();
  const r = spawnSync(cmd, argv, { encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  // the LAST summary line, not the first: a probe that runs its own subgates echoes their
  // "n/n passed" inside a row's detail long before it prints its own.
  const all = [...out.matchAll(/(\d+)\/(\d+) passed, (\d+) failed/g)];
  const m = all.length ? all[all.length - 1] : null;
  const green = /G0 GREEN/.test(out) || (m && +m[3] === 0);
  const row = { label, code: r.status, pass: m ? +m[1] : 0, of: m ? +m[2] : 0, green: !!green, ms: Date.now() - t0, tail: out.split('\n').slice(-2).join(' | ').slice(0, 160) };
  sub.push(row);
  return r.status === 0 && !!green && (want2 == null || row.of === want2);
};
const P = (n) => join(ROOT, 'tools', 'sweep', n);
const srcText = readFileSync(join(ROOT, 'src', 'VES_PM.html'), 'utf8');
/* The FUNCTION must be gone — declaration, every call site, and the VESApp export. Its NAME still
   appears in two comments (the fold that deleted it, and the 2.0.0-rc.1 build note that recorded it
   surviving into B4): the build history is a record and is not edited to make a grep quieter. So the
   row asks the two questions that are about behaviour, not about prose. */
const ptdDecl = (srcText.match(/function printTakeoffDoc/g) || []).length;
const ptdExport = /^\s*(?:[\w$]+\s*,\s*)*printTakeoffDoc\s*,/m.test(srcText) || /\bprintTakeoffDoc\s*\(/.test(srcText);
const ptdLive = await tryEv(`typeof printTakeoffDoc`);
const ptdCount = { declarations: ptdDecl, calledOrExported: ptdExport, typeofInApp: ptdLive };
if (NOSUB) {
  check('B4-8 printTakeoffDoc no longer exists (no declaration, no call, no export, undefined in the running app); probe-ae 5/5 (AE5 included) and probe-p903-doc 8/8', false, { printTakeoffDoc: ptdCount, subgates: 'skipped (--no-subgates)' });
  check('B4-9 G0 GREEN 4/4 · probe-b0-fixture 7/7 · probe-b1-pitch 12/12 · probe-b2a-sections 7/7 · probe-b2b-regions 8/8 · probe-b3-colors 8/8', false, { subgates: 'skipped (--no-subgates)' });
} else {
  const plan1 = join(TMP, 'plan.pdf'), plan2 = join(TMP, 'plan2.pdf');
  spawnSync('node', [P('mkpdf.mjs'), plan1], { encoding: 'utf8' });
  spawnSync('node', [P('mkpdf.mjs'), plan2, '1500', '2'], { encoding: 'utf8' });
  const src = join(ROOT, 'src', 'VES_PM.html');
  const okAe = run('probe-ae', 'node', [P('probe-ae.mjs'), src, demoPath, plan1, ROOT], 5);
  const okDoc = run('probe-p903-doc', 'node', [P('probe-p903-doc.mjs'), src, demoPath, plan2, ROOT], 8);
  check('B4-8 printTakeoffDoc no longer exists (no declaration, no call, no export, undefined in the running app); probe-ae 5/5 (AE5 included) and probe-p903-doc 8/8', ptdDecl === 0 && ptdExport === false && ptdLive === 'undefined' && okAe && okDoc, { printTakeoffDoc: ptdCount, subgates: sub.slice() });
  sub = [];
  const fixJson = TAKEOFF, fixPdf = PDF;
  const okG0 = run('g0', 'node', [join(ROOT, 'gate', 'g0.mjs'), 'check', src]);
  const okFix = run('probe-b0-fixture', 'node', [P('probe-b0-fixture.mjs'), src, fixJson, fixPdf, ROOT], 7);
  const okPitch = run('probe-b1-pitch', 'node', [P('probe-b1-pitch.mjs'), src, demoPath, ROOT, FIXDIR], 12);
  const okB2a = run('probe-b2a-sections', 'node', [P('probe-b2a-sections.mjs'), src, fixJson, fixPdf, ROOT], 7);
  const okB2b = run('probe-b2b-regions', 'node', [P('probe-b2b-regions.mjs'), src, fixJson, fixPdf, ROOT], 8);
  const okB3 = run('probe-b3-colors', 'node', [P('probe-b3-colors.mjs'), src, fixJson, fixPdf, ROOT], 8);
  check('B4-9 G0 GREEN 4/4 · probe-b0-fixture 7/7 · probe-b1-pitch 12/12 · probe-b2a-sections 7/7 · probe-b2b-regions 8/8 · probe-b3-colors 8/8', okG0 && okFix && okPitch && okB2a && okB2b && okB3, sub);
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b4-print: ${results.length - fails}/${results.length} passed, ${fails} failed`);
c.close(); chrome.kill('SIGKILL');
process.exit(fails ? 1 : 0);
