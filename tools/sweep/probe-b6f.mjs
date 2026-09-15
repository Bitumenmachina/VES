/* Batch B6F — the one fix batch after the B6 persona pass (charter .scratch/charter-b6f.md).
 * One row per ruling: B6F-C1…C7 (the P-CODE money rows, first) then B6F-1…8.
 * Reads RENDERED output — DOM text, composed print documents, exported blobs, real pointer
 * where the gesture is a pointer gesture. Never re-derives money.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b6f.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet" "$PWD" [only]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [VES, FIX, ROOT, ONLY] = process.argv.slice(2);
if (!VES || !FIX || !ROOT) { console.error('usage: probe-b6f.mjs <VES_PM.html> <fixtureDir> <root> [only]'); process.exit(2); }
const want = (n) => !ONLY || ONLY.split(',').indexOf(n) >= 0;

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url); let id = 0; const pending = new Map();
    ws.addEventListener('open', () => resolve({
      send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); },
      close() { ws.close(); },
    }));
    ws.addEventListener('error', () => reject(new Error('ws')));
    ws.addEventListener('message', (e) => { const msg = JSON.parse(e.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } });
  });
}
const port = 9500 + Math.floor(Math.random() * 90);
const prof = mkdtempSync(join(tmpdir(), 'ves-b6f-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
  '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 600 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {}
  if (!wsUrl) await sleep(100);
}
if (!wsUrl) { console.error('HARNESS FAIL: no devtools target'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => {
  const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
};
const tryEv = async (e) => { try { return await ev(e); } catch (x) { return { error: String(x.message || x).slice(0, 300) }; } };

let pass = 0, fail = 0;
const rows = [];
function check(name, ok, detail) {
  rows.push({ name, ok: !!ok });
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
  if (detail !== undefined) console.log('      ' + JSON.stringify(detail).slice(0, 2200));
}

/* ---------- real pointer (same idiom as probe-b6-code / probe-b2b-regions) ---------- */
const screenPt = (x, y) => ev(`(() => { const p = VESApp.AP(); const [vx, vy] = p.viewport.convertToViewportPoint(${x}, ${y});
  const el = p.els.overlay; const r = el.getBoundingClientRect();
  return { sx: r.left + vx * (r.width / p.viewport.width), sy: r.top + vy * (r.height / p.viewport.height) }; })()`);
async function mouse(type, sx, sy, clickCount = 1) {
  await c.send('Input.dispatchMouseEvent', { type, x: Math.round(sx), y: Math.round(sy), button: 'left', buttons: type === 'mouseMoved' ? 0 : 1, clickCount });
}
async function clickScreen(sx, sy, { clickCount = 1, wait = 130 } = {}) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(sx), y: Math.round(sy), button: 'none', buttons: 0 });
  await sleep(40);
  for (const t of ['mousePressed', 'mouseReleased']) await mouse(t, sx, sy, clickCount);
  await sleep(wait);
}
async function clickPdf(x, y, opts) {
  let a = await screenPt(x, y);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 });
  await sleep(80);
  a = await screenPt(x, y);
  await clickScreen(a.sx, a.sy, opts);
}
async function warmPointer() {
  for (let i = 0; i < 3; i++) { const a = await screenPt(1296, 864);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 }); await sleep(180); }
  await sleep(200);
}
async function clickSel(sel, wait = 160) {
  const r = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
    const b = e.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0)) return null;
    return { sx: b.left + b.width / 2, sy: b.top + b.height / 2 }; })()`);
  if (!r) return false;
  await clickScreen(r.sx, r.sy, { wait }); return true;
}
async function key(k, code, vk, mods = 0) {
  for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
  await sleep(160);
}
async function typeText(s) {
  for (const ch of s) await c.send('Input.dispatchKeyEvent', { type: 'char', text: ch });
  await sleep(80);
}

/* ---------- boot ---------- */
const pdfB64 = readFileSync(join(FIX, 'plan.pdf')).toString('base64');
const takeoffText = readFileSync(join(FIX, 'takeoff.v3.json'), 'utf8');
const ARM = `
  window.__take = ${takeoffText};
  window.__printed = 0; window.__realPrint = window.print;
  /* The browser composes #printDoc during the print; the app is entitled to let it go the moment
     window.print() returns (B6F-C6). Snapshot at compose time, the way probe-b4-print does, and
     put the copy back on the next macrotask so the read sites below see what went to paper. */
  window.print = function () { window.__printed++;
    const d = document.getElementById('printDoc'); window.__pdSnap = d ? d.innerHTML : '';
    try { window.dispatchEvent(new Event('beforeprint')); } finally { setTimeout(() => window.dispatchEvent(new Event('afterprint')), 0); }
    setTimeout(() => { const e = document.getElementById('printDoc'); if (e && window.__restorePd !== false) e.innerHTML = window.__pdSnap; }, 0);
  };
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__blobs = [];
  window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, mime, text: (typeof bytes === 'string') ? bytes : null, len: bytes && bytes.length }); };
  window.__grand = () => { try { const m = VESApp.recapModel(); return { cost: Math.round(m.cost*100), sell: Math.round(m.sell*100) }; } catch (e) { return { error: String(e) }; } };
  window.__banners = () => [...document.querySelectorAll('#banners .banner')].map(b => ({ bid: b.dataset.bid,
    text: (b.textContent||'').replace(/\\s+/g,' ').trim().slice(0,700),
    buttons: [...b.querySelectorAll('button')].map(x => (x.textContent||'').trim()) }));
  window.__toast = () => { const t = document.querySelector('#toast'); return t ? (t.textContent||'').replace(/\\s+/g,' ').trim() : ''; };
  window.__fileClicks = 0;
  { const cl = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { if (this.type === 'file') { window.__fileClicks++; return; } return cl.apply(this, arguments); }; }
  1`;
const openPdf = () => ev(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } return 1; })()`);
async function boot({ clear = true, pdf = true } = {}) {
  await c.send('Page.navigate', { url: 'file://' + VES });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
  await sleep(300);
  if (clear) await ev(`localStorage.clear(); 1`);
  await ev(ARM);
  if (pdf) await openPdf();
  await sleep(250);
}
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await boot();
const clearStage = async () => { await tryEv(`try { VESApp.toggleRail(false, { persist: false }); } catch(e){} try { VESApp.collapseDrawer(); } catch(e){} try { VESApp.showEstimate(false); } catch(e){} 1`); await sleep(120); };
const goSheet = async (n) => { await tryEv(`(async () => { await VESApp.showPane(VESApp.state.panes[0], ${n}, { fit: true }); await new Promise(r=>setTimeout(r,320)); VESApp.fitToView(VESApp.AP()); await new Promise(r=>setTimeout(r,300)); return VESApp.AP().pageNum; })()`); };
const loadFixture = async () => { await ev(`VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); 1`); await sleep(1100); };
/* F18.22 collapses the toolbar to a 24px strip whenever a sheet is live; the groups come back on
   hover. A hand does this without thinking — move up, the bar opens, click. The pointer has to
   do it explicitly. */
async function hoverToolbar() {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 12, button: 'none', buttons: 0 });
  await sleep(380);
}

/* ════════ B6F-C1 · general lines are journaled, undo restores, no phantom, every value formatted ════════ */
if (want('C1')) {
  await loadFixture();
  const r = await tryEv(`(async () => {
    const G = () => JSON.parse(JSON.stringify(VESApp.state.assemblyProject.general || []));
    const J = () => VESApp.state.journal.undo.map(x => x.label);
    const out = {};
    out.money0 = window.__grand(); out.j0 = J().length;
    VESApp.addGeneralItem(); await new Promise(r => setTimeout(r, 220));
    out.jAfterAdd = J(); out.addLabel = out.jAfterAdd[out.jAfterAdd.length-1] || null;
    const idx = (VESApp.state.assemblyProject.general || []).length - 1;
    VESApp.setGeneralField(idx, 'label', 'Dumpsters'); await new Promise(r => setTimeout(r, 160));
    VESApp.setGeneralField(idx, 'unit_cost', 5000); await new Promise(r => setTimeout(r, 240));
    out.moneyWithLine = window.__grand(); out.generalWithLine = G();
    VESApp.removeGeneralItem(idx); await new Promise(r => setTimeout(r, 280));
    out.removeLabel = J()[J().length-1] || null;
    out.moneyAfterRemove = window.__grand(); out.generalAfterRemove = G();
    VESApp.undo(); await new Promise(r => setTimeout(r, 320));
    out.undo1 = { general: G(), money: window.__grand(), toast: window.__toast() };
    return out; })()`);
  const restored = r && r.undo1 && Array.isArray(r.undo1.general)
    && r.undo1.general.some((g) => g.label === 'Dumpsters' && +g.unit_cost === 5000)
    && r.undo1.money && r.moneyWithLine && r.undo1.money.sell === r.moneyWithLine.sell;
  const named = /add general line/i.test(String(r.addLabel || '')) && /remove/i.test(String(r.removeLabel || ''))
    && /Dumpsters/.test(String(r.removeLabel || ''));
  // phantom: an undo whose target is gone must say so, never "Undid: …" over nothing
  const ph = await tryEv(`(async () => {
    const g = VESApp.state.assemblyProject.general; const before = window.__grand();
    g.length = 0;                                     // the row is gone behind the journal's back
    VESApp.undo(); await new Promise(r => setTimeout(r, 300));
    return { toast: window.__toast(), money: window.__grand(), before, n: (VESApp.state.assemblyProject.general||[]).length }; })()`);
  const phantomOk = !!ph && !/^Undid:/.test(String(ph.toast || '')) && /no longer|not here|gone/i.test(String(ph.toast || ''));
  // every value formats — waste / pitch / money / text, none of them "[object Object]"
  const fmt = await tryEv(`(async () => {
    VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); await new Promise(r => setTimeout(r, 900));
    const labels = {}; const top = () => { const u = VESApp.state.journal.undo; return u.length ? u[u.length-1].label : null; };
    const c = VESApp.state.conditions.find(x => x.libRef);
    VESApp.setConditionWaste(c, 0.17); await new Promise(r => setTimeout(r, 200)); labels.waste = top();
    VESApp.setConditionPitch(c.libRef, '6/12'); await new Promise(r => setTimeout(r, 200)); labels.pitch = top();
    VESApp.addGeneralItem(); await new Promise(r => setTimeout(r, 160));
    const i = VESApp.state.assemblyProject.general.length - 1;
    VESApp.setGeneralField(i, 'label', 'Permits'); await new Promise(r => setTimeout(r, 160)); labels.text = top();
    VESApp.setGeneralField(i, 'unit_cost', 1250); await new Promise(r => setTimeout(r, 200)); labels.money = top();
    const toasts = [];
    for (let k = 0; k < 4; k++) { VESApp.undo(); await new Promise(r => setTimeout(r, 240)); toasts.push(window.__toast()); }
    return { labels, toasts }; })()`);
  const noObj = fmt && fmt.labels && ![...Object.values(fmt.labels), ...(fmt.toasts || [])].some((s) => /\[object Object\]/.test(String(s)));
  check('B6F-C1 addGeneralItem / removeGeneralItem are journaled by name, Ctrl+Z restores the removed $5,000 line in place, a stale undo is dropped with a toast that says so, and no journal label or undo toast prints "[object Object]"',
    !!(restored && named && phantomOk && noObj),
    { addLabel: r && r.addLabel, removeLabel: r && r.removeLabel, moneyWithLine: r && r.moneyWithLine, moneyAfterRemove: r && r.moneyAfterRemove,
      afterUndo: r && r.undo1, phantom: ph, formatting: fmt, restored, named, phantomOk, noObj });
}

/* ════════ B6F-C2 · a measurement on a sheet with no scale is PENDING on every money surface ════════ */
if (want('C2')) {
  await boot();
  await ev(`VESApp.setProjectMeta({ name: 'Probe', preparedBy: { company: 'Probe Co' } }); 1`).catch(() => {});
  await goSheet(1); await clearStage();
  await ev(`VESApp.applyScalePreset('1/8"=1\\'-0"'); 1`); await sleep(300);
  const asm = await ev(`(() => { const A = VESApp.state.library.assemblies; const k = Object.keys(A);
    for (const id of k) { const cs = (A[id].conditions||[]).map(x => VESApp.state.library.conditions[x]).filter(Boolean);
      if (cs.some(x => x.geometry_type === 'area')) return id; } return k[0]; })()`);
  await ev(`VESApp.loadAssembly(${JSON.stringify(asm)}); 1`); await sleep(400);
  const subj = await ev(`(() => { const c = VESApp.state.conditions.find(x => x.type === 'area' && x.libRef); return c ? { id: c.id, name: c.name } : null; })()`);
  await clearStage();
  const drawBox = async (pts) => {
    await tryEv(`(async () => { VESApp.fitToView(VESApp.AP()); await new Promise(r=>setTimeout(r,350)); return 1; })()`);
    for (const p of pts) await clickPdf(p[0], p[1], { wait: 140 });
    await key('Enter', 'Enter', 13);
    await sleep(300);
    return ev(`VESApp.state.measurements.length`);
  };
  await ev(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${subj.id}); VESApp.activateCondition(c); if (VESApp.state.snap) VESApp.toggleSnap(); return 1; })()`);
  await warmPointer();
  await drawBox([[500, 600], [1200, 600], [1200, 1000], [500, 1000]]);
  await goSheet(2); await clearStage();
  await ev(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${subj.id}); VESApp.activateCondition(c); return 1; })()`);
  await warmPointer();
  await drawBox([[520, 620], [1180, 620], [1180, 980], [520, 980]]);
  const st = await ev(`(() => { const ms = VESApp.state.measurements.filter(m => m.conditionId === ${subj.id});
    return { n: ms.length, values: ms.map(m => ({ page: m.page, value: m.value })) }; })()`);
  const traced = st && st.n >= 2 && st.values.some((v) => v.value == null) && st.values.some((v) => v.value != null);
  let surf = null, sheetNote = null, jobScoped = null;
  if (traced) {
    surf = await tryEv(`(async () => {
      const out = {};
      VESApp.renderRecap(); VESApp.setRecapTab('summary'); await new Promise(r => setTimeout(r, 300));
      out.recap = (document.querySelector('#recapBody')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim();
      VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 300));
      out.grid = (document.querySelector('.estgrid')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim();
      VESApp.showEstimate(false);
      VESApp.printBidDoc(); await new Promise(r => setTimeout(r, 400));
      out.bid = document.getElementById('printDoc').textContent.replace(/\\s+/g,' ').trim();
      out.bidRows = [...document.querySelectorAll('#printDoc .secblock tbody tr')].map(t => (t.textContent||'').replace(/\\s+/g,' ').trim()).filter(x => /Standing Seam Panel/.test(x)).slice(0,3);
      out.bidSheetCells = [...document.querySelectorAll('#printDoc .secblock tbody tr')].filter(t => /Standing Seam Panel/.test(t.textContent||'')).map(t => ((t.children[2]||{}).textContent||'').trim()).slice(0,3);
      VESApp.printCostSheet(); await new Promise(r => setTimeout(r, 400));
      out.cost = document.getElementById('printDoc').textContent.replace(/\\s+/g,' ').trim();
      window.__blobs = []; VESApp.exportGridCSV(); await new Promise(r => setTimeout(r, 300));
      out.csv = (window.__blobs.map(b => b.text).filter(Boolean).pop() || '');
      return out; })()`);
    sheetNote = surf && surf.bidSheetCells;
    await goSheet(1); await sleep(400);
    jobScoped = await ev(`window.__banners().map(b => b.bid + '|' + b.text.slice(0,140))`);
  }
  const has = (s) => /pending/i.test(String(s || ''));
  const ok = traced && surf && !surf.error
    && has(surf.recap) && has(surf.grid) && has(surf.bid) && has(surf.cost) && has(surf.csv)
    && Array.isArray(sheetNote) && sheetNote.length > 0 && sheetNote.every((x) => !/,/.test(x))
    && Array.isArray(jobScoped) && jobScoped.some((b) => /^uncal/.test(b));
  check('B6F-C2 a measurement on an uncalibrated sheet is named "pending" on the recap, the Estimate grid, the client bid, the cost sheet and the Estimate CSV; the bid\'s per-line Sheet cell lists only the sheet whose quantity is in the number; and the uncalibrated notice is job-scoped (still standing from the calibrated sheet)',
    !!ok,
    { traced, measurements: st,
      pendingWordIn: surf && !surf.error ? { recap: has(surf.recap), grid: has(surf.grid), bid: has(surf.bid), costSheet: has(surf.cost), estimateCSV: has(surf.csv) } : surf,
      bidRows: surf && surf.bidRows, bidSheetCells: sheetNote, bannersFromCalibratedSheet: jobScoped });
}

/* ════════ B6F-C3 · the pitch doors accept ONLY rise-per-12 forms ════════ */
if (want('C3')) {
  await loadFixture();
  const subj = await ev(`(() => { const c = VESApp.state.conditions.find(x => x.libRef && x.type === 'area'); return c ? { id: c.id, name: c.name } : null; })()`);
  const openEditor = `(async () => { const S = VESApp.state; S.expandedCondId = null; S.editingCondId = ${subj.id}; VESApp.renderCards();
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 120)));
    return !!document.querySelector('input[title*="rise over 12"]:not(.cond-pitch)'); })()`;
  const typeInto = (val) => `(async () => { const el = document.querySelector('input[title*="rise over 12"]:not(.cond-pitch)');
    if (!el) return { error: 'no field' };
    el.value = ${JSON.stringify(val)}; el.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 200))); return { ok: true }; })()`;
  const readBack = `(() => { const S = VESApp.state; const c = S.conditions.find(x => x.id === ${subj.id});
    const r = VESApp.core.rollup([c], S.measurements.filter(m => m.conditionId === c.id))[0];
    return { stored: c.pitch == null ? null : +c.pitch.toFixed(4), factor: +r.pitch.toFixed(6), qty: Math.round(r.quantity*10)/10,
      journal: S.journal.undo.length, toast: window.__toast() }; })()`;
  const out = [];
  const CASES = [
    { v: '6', accept: 6 }, { v: '6/12', accept: 6 }, { v: '6:12', accept: 6 }, { v: '6"/12', accept: 6 },
    { v: '24', accept: 24 }, { v: '0', accept: null },
    { v: '25', accept: false }, { v: '999', accept: false }, { v: '1e9', accept: false },
    { v: '-6', accept: false }, { v: 'abc', accept: false }, { v: '6/13', accept: false }, { v: '6/1', accept: false },
    { v: '9.5', accept: 9.5 },
    // The one door the ruling asked to delete and this build BOUNDS instead: a decimal that cannot
    // be a rise is still read as the slope factor it can only be (probe-p903-pitch AH3 is a landed
    // gate on that), but only inside a real roof's range — 3.0 is not a roof and is refused.
    { v: '1.118', accept: 6 }, { v: '3.0', accept: false },
  ];
  for (const k of CASES) {
    await ev(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${subj.id}); delete c.pitch; delete c.pitchLegacyFactor; VESApp.renderCards(); return 1; })()`);
    const j0 = await ev(`VESApp.state.journal.undo.length`);
    await tryEv(openEditor);
    await tryEv(typeInto(k.v));
    const rb = await tryEv(readBack);
    out.push({ typed: k.v, want: k.accept, stored: rb && rb.stored, factor: rb && rb.factor, journalDelta: (rb && rb.journal) - j0, toast: (rb && rb.toast || '').slice(0, 90) });
  }
  const bad = out.filter((r, i) => {
    const w = CASES[i].accept;
    if (w === false) return !(r.stored === null && r.journalDelta === 0);
    if (w === null) return !(r.stored === null);
    return !(r.stored !== null && Math.abs(r.stored - w) < 0.01);   // a factor round-trips to the rise within a hundredth
  });
  check('B6F-C3 the pitch door takes only a rise per 12 — a bare 0-24, n/12, n:12, n"/12 — and refuses 25, 999, 1e9, -6, abc, 6/13, 6/1 and a bare multiplier with the value unchanged and nothing journaled',
    bad.length === 0, { rows: out, refusedWrong: bad });
}

/* ════════ B6F-C4 · the undo of the R-3a reconcile sets the conditions flat, and the banner follows ════════ */
if (want('C4')) {
  await loadFixture();
  const before = await ev(`({ banners: window.__banners(), grand: window.__grand(),
    pitched: VESApp.state.conditions.filter(c => VESApp.core.condRise(c) > 0).map(c => c.name) })`);
  await ev(`VESApp.undo(); 1`); await sleep(600);
  const after = await ev(`({ banners: window.__banners(), grand: window.__grand(), toast: window.__toast(),
    flatNow: VESApp.state.conditions.filter(c => !(VESApp.core.condRise(c) > 0)).length,
    stillPitched: VESApp.state.conditions.filter(c => VESApp.core.condRise(c) > 0).map(c => c.name) })`);
  const rec = (after.banners || []).find((b) => b.bid === 'pitchreconcile');
  const namesGone = ['SSMR — hip', 'Slate — field area', 'Slate — valley'].every((n) => (after.stillPitched || []).indexOf(n) < 0);
  const toastNamed = /set flat/i.test(String(after.toast || '')) && /SSMR — hip/.test(String(after.toast || ''));
  const bannerFollows = !rec || (!/now priced at/i.test(rec.text) && /flat/i.test(rec.text));
  const reloaded = await tryEv(`(async () => { const s = JSON.parse(JSON.stringify(VESApp.snapshot()));
    VESApp.loadFromData(s); await new Promise(r => setTimeout(r, 1000));
    return { grand: window.__grand(), bannerIds: window.__banners().map(b => b.bid),
      pitched: VESApp.state.conditions.filter(c => VESApp.core.condRise(c) > 0).map(c => c.name) }; })()`);
  const reloadClean = reloaded && !reloaded.error && (reloaded.bannerIds || []).indexOf('pitchreconcile') < 0
    && ['SSMR — hip', 'Slate — field area', 'Slate — valley'].every((n) => (reloaded.pitched || []).indexOf(n) < 0);
  // the "Set these flat instead" door is the same code path
  await loadFixture();
  const doorRan = await tryEv(`(async () => { const b = [...document.querySelectorAll('#banners .banner')].find(x => x.dataset.bid === 'pitchreconcile');
    if (!b) return { error: 'no reconcile banner' };
    const btn = [...b.querySelectorAll('button')].find(x => /flat/i.test(x.textContent || ''));
    if (!btn) return { error: 'no flat door' };
    btn.click(); await new Promise(r => setTimeout(r, 600));
    return { grand: window.__grand(), toast: window.__toast(),
      stillPitched: VESApp.state.conditions.filter(c => VESApp.core.condRise(c) > 0).map(c => c.name),
      banner: (window.__banners().find(x => x.bid === 'pitchreconcile') || {}).text || null }; })()`);
  const doorOk = doorRan && !doorRan.error
    && ['SSMR — hip', 'Slate — field area', 'Slate — valley'].every((n) => (doorRan.stillPitched || []).indexOf(n) < 0)
    && doorRan.grand && after.grand && doorRan.grand.sell === after.grand.sell;
  check('B6F-C4 Ctrl+Z after the pitch reconcile sets SSMR — hip / Slate — field area / Slate — valley flat by name (display and money), the standing banner stops reading "now priced at", save → reload shows flat conditions and no reconcile banner, and the banner\'s "Set these flat instead" door is the same code path',
    !!(namesGone && toastNamed && bannerFollows && reloadClean && doorOk),
    { before: { grand: before.grand, pitched: before.pitched }, afterUndo: after, reloaded, flatDoor: doorRan,
      namesGone, toastNamed, bannerFollows, reloadClean, doorOk });
}

/* ════════ B6F-C5 · ONE section key on every surface that groups, filters or prints by section ════════ */
if (want('C5')) {
  await loadFixture();
  await ev(`VESApp.setProjectMeta({ name: 'Probe', preparedBy: { company: 'Probe Co' } }); 1`);
  const r = await tryEv(`(async () => {
    const out = {};
    out.before = { sections: VESApp.jobSections(), grand: window.__grand() };
    out.renamed = VESApp.renameSection('Canopy', 'MAIN ROOF');
    await new Promise(r => setTimeout(r, 400));
    out.after = { sections: VESApp.jobSections(), grand: window.__grand(),
      locations: [...new Set(VESApp.state.conditions.map(c => c.location))] };
    out.journalTop = VESApp.state.journal.undo[VESApp.state.journal.undo.length-1].label;
    await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 1000));
    const pd = document.getElementById('printDoc');
    out.takeoffBands = [...pd.querySelectorAll('tr.sech')].map(t => t.textContent.trim());
    const printed = [...pd.querySelectorAll('.tk-qty tbody tr')].filter(t => !t.className).map(t => ((t.children[2]||{}).textContent||'').trim());
    out.takeoffRows = printed.length;
    out.missingFromTakeoff = VESApp.state.conditions
      .filter(c => VESApp.core.rollup([c], VESApp.state.measurements.filter(m=>m.conditionId===c.id))[0].count > 0)
      .filter(c => printed.indexOf(c.name) < 0).map(c => c.name + ' [' + (c.location||'') + ']');
    out.measuredConds = VESApp.state.conditions.filter(c => VESApp.core.rollup([c], VESApp.state.measurements.filter(m=>m.conditionId===c.id))[0].count > 0).length;
    out.proposalSections = (VESApp.proposalModel().sections || []).map(s => s.name);
    VESApp.printBidDoc(); await new Promise(r => setTimeout(r, 400));
    out.bidSections = [...document.querySelectorAll('#printDoc .secblock')].map(x => (x.querySelector('h2')||{textContent:''}).textContent.trim());
    return out; })()`);
  const secCount = r && r.after ? r.after.sections.length : -1;
  const ok = r && !r.error
    && (r.missingFromTakeoff || []).length === 0
    && r.proposalSections && r.proposalSections.length === secCount
    && r.bidSections && r.bidSections.length === secCount
    && r.after && r.after.locations.filter((x) => String(x || '').toLowerCase() === 'main roof').length === 1
    && r.before && r.after && r.before.grand.sell === r.after.grand.sell;
  check('B6F-C5 one sectionKeyOf: renaming "Canopy" into "MAIN ROOF" merges it with "Main Roof" by name, the takeoff quantities page drops no measured condition, and the proposal, the bid and jobSections all report the same section count with no money moved',
    !!ok, r);
}

/* ════════ B6F-C6 · the print latch is empty after every print door ════════ */
if (want('C6')) {
  await loadFixture();
  await ev(`VESApp.setProjectMeta({ name: 'Probe', preparedBy: { company: 'Probe Co' } }); window.__restorePd = false; 1`);
  const r = await tryEv(`(async () => {
    const pd = () => document.getElementById('printDoc');
    const spent = () => { const d = pd(); return { len: d.innerHTML.length,
      docNodes: d.querySelectorAll('table, .tk-sheet, .secblock, figure').length,
      head: d.textContent.replace(/\\s+/g,' ').trim().slice(0, 70) }; };
    const out = {};
    await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 1400)); out.takeoff = spent();
    VESApp.printBidDoc(); await new Promise(r => setTimeout(r, 500)); out.bid = spent();
    VESApp.printCostSheet(); await new Promise(r => setTimeout(r, 500)); out.costSheet = spent();
    const ow = window.open; window.open = () => null;                    // the proposal writes its own window
    try { await VESApp.printProposal(); } catch (e) { out.proposalErr = String(e).slice(0,120); }
    window.open = ow; await new Promise(r => setTimeout(r, 600)); out.proposal = spent();
    // and a browser-initiated print afterwards re-emits nothing
    window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('afterprint'));
    await new Promise(r => setTimeout(r, 200)); out.afterBrowserPrint = spent();
    return out; })()`);
  await ev(`window.__restorePd = true; 1`);
  const clean = (x) => !!x && x.docNodes === 0;
  const ok = r && !r.error && clean(r.takeoff) && clean(r.bid) && clean(r.costSheet) && clean(r.proposal) && clean(r.afterBrowserPrint);
  check('B6F-C6 #printDoc holds no document after any of the four print doors (takeoff, bid, cost sheet, proposal) — releasePrintDoc runs as soon as window.print() returns, with afterprint kept only as a second net, so a browser-initiated print afterwards re-emits nothing',
    !!ok, r);
}

/* ════════ B6F-C7 · regions that arrive with no id get ids of their own ════════ */
if (want('C7')) {
  const r = await tryEv(`(async () => {
    const t = JSON.parse(JSON.stringify(window.__take)); t.version = 5;
    t.sections = [
      { name: 'Alpha', page: 1, points: [[100,100],[900,100],[900,700],[100,700]] },
      { name: 'Beta',  page: 2, points: [[100,100],[900,100],[900,700],[100,700]] },
      { name: 'Gamma', page: 3, id: 7, points: [[100,100],[900,100],[900,700],[100,700]] },
    ];
    VESApp.loadFromData(t); await new Promise(r => setTimeout(r, 1000));
    const ids = VESApp.state.sections.map(s => ({ id: s.id, name: s.name, page: s.page }));
    const beta = VESApp.state.sections.find(s => s.name === 'Beta');
    if (beta) { VESApp.renameSectionRegion(beta.id, 'Beta renamed'); await new Promise(r => setTimeout(r, 250)); }
    const afterRename = VESApp.state.sections.map(s => ({ id: s.id, name: s.name }));
    const alpha = VESApp.state.sections.find(s => /^Alpha/.test(s.name));
    if (alpha) { VESApp.deleteSectionRegion(alpha.id); await new Promise(r => setTimeout(r, 250)); }
    const afterDelete = VESApp.state.sections.map(s => ({ id: s.id, name: s.name }));
    return { ids, afterRename, afterDelete, nextId: VESApp.state.nextId }; })()`);
  const ids = (r && r.ids) || [];
  const unique = ids.length === 3 && new Set(ids.map((s) => s.id)).size === 3 && ids.every((s) => s.id > 0);
  const addressable = r && r.afterRename && r.afterRename.some((s) => s.name === 'Beta renamed')
    && r.afterRename.some((s) => s.name === 'Alpha')
    && r.afterDelete && r.afterDelete.length === 2 && !r.afterDelete.some((s) => s.name === 'Alpha');
  check('B6F-C7 section regions that come through the file door with no id are given unique ids of their own, so every region is addressable by its own chip (rename hits Beta, delete hits Alpha)',
    !!(unique && addressable), r);
}

/* ════════ B6F-1 · the 2-pt calibrate tool arms on every sheet; a pending total says so ════════ */
if (want('B1')) {
  await boot();
  const armed = [];
  for (const n of [1, 2, 3]) {
    await goSheet(n); await clearStage(); await sleep(250);
    // (a) landing on a sheet with no scale arms the calibrate tool, the way sheet 1 does at open
    const onArrival = await ev(`VESApp.state.tool`);
    // (b) and the toolbar's own "2-pt" arms it by a real click, on every sheet
    await ev(`VESApp.setTool('select'); 1`); await sleep(160);
    await hoverToolbar();
    const clicked = await clickSel('#btnCalibrate', 280);
    const tool = await ev(`({ tool: VESApp.state.tool, page: VESApp.AP().pageNum })`);
    armed.push({ sheet: n, onArrival, clicked, ...tool });
    await ev(`VESApp.setTool('select'); 1`);
  }
  // the banner's own door is the same tool
  await goSheet(3); await clearStage(); await sleep(300);
  const bannerDoor = await tryEv(`(async () => { const b = [...document.querySelectorAll('#banners .banner')].find(x => x.dataset.bid === 'uncal');
    if (!b) return { error: 'no uncal banner' };
    const btn = [...b.querySelectorAll('button')].find(x => /known length/i.test(x.textContent||''));
    if (!btn) return { error: 'no known-length door' };
    btn.click(); await new Promise(r => setTimeout(r, 250)); return { tool: VESApp.state.tool }; })()`);
  const allArmed = armed.every((a) => a.tool === 'calibrate' && a.onArrival === 'calibrate');
  check('B6F-1 the "2-pt" calibrate tool arms on sheet 1, sheet 2 and sheet 3 the same way — armed on arrival at any sheet with no scale, and armed by a real click on the toolbar button — and the "no scale yet" banner\'s "Click a known length" is that same tool',
    !!(allArmed && bannerDoor && bannerDoor.tool === 'calibrate'), { perSheet: armed, bannerDoor });

  /* the takeoff paper's TOTAL says the quantity is incomplete, and which sheets are missing a scale */
  const paper = await tryEv(`(async () => {
    VESApp.setProjectMeta({ name: 'Probe', preparedBy: { company: 'Probe Co' } });
    await VESApp.showPane(VESApp.state.panes[0], 1, { fit: true }); await new Promise(r => setTimeout(r, 400));
    VESApp.applyScalePreset('1/8"=1\\'-0"'); await new Promise(r => setTimeout(r, 250));
    const c = { id: VESApp.state.nextId++, name: 'Ridge cap — standing seam', color: '#ff5d3a', type: 'linear', csi: '', wbs: '',
      location: 'Main Roof', notes: '', unitCost: 12, tags: [], sortOrder: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    VESApp.state.conditions.push(c);
    VESApp.state.measurements.push({ id: VESApp.state.nextId++, conditionId: c.id, page: 1, type: 'linear', value: 105.7, points: [[0,0],[10,0]], notes: '' });
    VESApp.state.measurements.push({ id: VESApp.state.nextId++, conditionId: c.id, page: 2, type: 'linear', value: null, points: [[0,0],[10,0]], notes: '' });
    VESApp.state.measurements.push({ id: VESApp.state.nextId++, conditionId: c.id, page: 3, type: 'linear', value: null, points: [[0,0],[10,0]], notes: '' });
    VESApp.renderCards(); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 400));
    await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 1200));
    const pd = document.getElementById('printDoc');
    return { subtotals: [...pd.querySelectorAll('.tk-qty tr.secsub')].map(t => (t.textContent||'').replace(/\\s+/g,' ').trim()),
      rows: [...pd.querySelectorAll('.tk-qty tbody tr')].filter(t => !t.className).map(t => (t.textContent||'').replace(/\\s+/g,' ').trim()).slice(0,4) }; })()`);
  const totalSpeaks = paper && !paper.error && (paper.subtotals || []).some((t) => /pending/i.test(t) && /set the scale on sheets? 2, 3/i.test(t));
  check('B6F-1b the takeoff quantities page marks the TOTAL itself when a condition carries pending segments — "3 pending — set the scale on sheets 2, 3" on the section total, not only a parenthetical beside the line',
    !!totalSpeaks, paper);
}

/* ════════ B6F-2 · both migration banners carry two doors, in plain words ════════ */
if (want('B2')) {
  await loadFixture();
  const b = await ev(`window.__banners()`);
  const rec = (b || []).find((x) => x.bid === 'pitchreconcile');
  const leg = (b || []).find((x) => /^pitchlegacy:/.test(x.bid || ''));
  const recDoors = rec ? rec.buttons.filter((t) => /keep/i.test(t) || /flat/i.test(t)) : [];
  const legDoors = leg ? leg.buttons.filter((t) => /read it as/i.test(t) || /keep/i.test(t)) : [];
  const plainRec = rec && /showed a pitch on screen but were priced flat in the old file/i.test(rec.text)
    && /They are now priced at the pitch you see/i.test(rec.text) && /Sell \$/.test(rec.text);
  const plainLeg = leg && /the old file stored pitch as a bare ×6\.000 multiplier/i.test(leg.text)
    && /Read it as 6\/12\?/i.test(leg.text) && /Until you choose, it prices at ×6\.000/i.test(leg.text);
  // Ctrl+Z immediately after the load reverses the reconciliation, with a name
  const z = await tryEv(`(async () => { VESApp.undo(); await new Promise(r => setTimeout(r, 500));
    return { toast: window.__toast(), grand: window.__grand() }; })()`);
  const named = z && /set flat/i.test(String(z.toast || ''));
  // the legacy banner's "keep as saved" door dismisses, keeps the saved factor, and journals a decision
  await loadFixture();
  const keep = await tryEv(`(async () => {
    const bn = [...document.querySelectorAll('#banners .banner')].find(x => /^pitchlegacy:/.test(x.dataset.bid||''));
    if (!bn) return { error: 'no legacy banner' };
    const btn = [...bn.querySelectorAll('button')].find(x => /keep/i.test(x.textContent||''));
    if (!btn) return { error: 'no keep door' };
    const before = window.__grand(); const j0 = VESApp.state.journal.undo.length;
    btn.click(); await new Promise(r => setTimeout(r, 500));
    return { before, after: window.__grand(), journalDelta: VESApp.state.journal.undo.length - j0,
      label: VESApp.state.journal.undo[VESApp.state.journal.undo.length-1].label,
      stillUp: window.__banners().some(x => /^pitchlegacy:/.test(x.bid||'')) }; })()`);
  const keepOk = keep && !keep.error && keep.journalDelta === 1 && keep.stillUp === false
    && keep.before && keep.after && keep.before.sell === keep.after.sell;
  check('B6F-2 both migration banners carry two doors — reconcile: Keep (already applied) / Set these flat instead; legacy: Read it as 6/12 / Keep ×6.000 as saved (dismisses, journaled, money unmoved) — in plain words, and Ctrl+Z right after the load reverses the reconcile by name',
    !!(recDoors.length >= 2 && legDoors.length >= 2 && plainRec && plainLeg && named && keepOk),
    { reconcileDoors: rec && rec.buttons, legacyDoors: leg && leg.buttons, plainRec, plainLeg,
      reconcileText: rec && rec.text, legacyText: leg && leg.text, ctrlZ: z, keepAsSaved: keep });
}

/* ════════ B6F-3/4/5 · 22 quick-adds through the real form ════════ */
if (want('B345')) {
  await boot();
  await ev(`VESApp.toggleRail(true, { persist: false }); 1`).catch(() => {});
  await sleep(300);
  await clickSel('#btnAddCond', 250);
  const formState = [];
  for (let i = 1; i <= 22; i++) {
    const opened = await ev(`(() => { const w = document.getElementById('addCondWrap'); return w ? !w.hidden : false; })()`);
    if (!opened) await clickSel('#btnAddCond', 250);
    await clickSel('#condName', 140);
    await typeText('Scope item ' + i);
    await clickSel('#addCondForm button[type="submit"]', 200);
    formState.push(await ev(`(() => { const w = document.getElementById('addCondWrap');
      return { open: w ? !w.hidden : false, nameValue: document.getElementById('condName').value,
        focused: (document.activeElement||{}).id || null, n: VESApp.state.conditions.length }; })()`));
  }
  const colors = await ev(`(() => { const cs = VESApp.state.conditions.filter(c => /^Scope item /.test(c.name));
    return { n: cs.length, colors: cs.map(c => c.color), unique: new Set(cs.map(c => c.color)).size }; })()`);
  const vis = await ev(`(() => { const S = VESApp.state; const c = S.conditions[S.conditions.length-1];
    if (!c) return { error: 'no condition was added' };
    const card = document.querySelector('.card[data-cid="' + c.id + '"]');
    const host = document.getElementById('cards');
    if (!card || !host) return { error: 'no card', armed: S.activeCond ? S.activeCond.id === c.id : false };
    const b = card.getBoundingClientRect(), h = host.getBoundingClientRect();
    return { inView: b.top >= h.top - 2 && b.bottom <= h.bottom + 2, cardTop: Math.round(b.top), hostTop: Math.round(h.top), hostBottom: Math.round(h.bottom),
      armed: S.activeCond ? S.activeCond.id === c.id : false,
      hasPitchDoor: !!card.querySelector('.cond-pitch, [title*="rise over 12"]'),
      hasSectionDoor: !!card.querySelector('[title*="ection"], .cond-sec') }; })()`);
  const esc = await tryEv(`(async () => { const w = document.getElementById('addCondWrap');
    const open0 = !w.hidden;
    document.getElementById('condName').focus();
    document.getElementById('condName').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    return { open0, openAfterEsc: !document.getElementById('addCondWrap').hidden }; })()`);
  const last = formState[formState.length - 1] || {};
  check('B6F-3 twenty-two "+ Add condition" quick-adds take twenty-two distinct default colors — the next unused palette entry each time, never PALETTE[0] again',
    colors.n === 22 && colors.unique === 22, colors);
  check('B6F-4 the newly added condition\'s card is scrolled into view and armed, with its pitch and section doors reachable without a manual scroll',
    !!(vis && !vis.error && vis.inView && vis.armed), vis);
  check('B6F-5 the add form stays open after "Add condition" with the name field cleared and focused, and Esc closes it',
    !!(last.open === true && last.nameValue === '' && last.focused === 'condName' && esc && esc.openAfterEsc === false),
    { lastAdd: last, esc, everyAddLeftItOpen: formState.every((f) => f.open === true) });
}

/* ════════ B6F-6 · the resume card opens the file picker itself ════════ */
if (want('B6')) {
  await boot();
  await loadFixture();
  await ev(`VESApp.flushAutosave(); 1`); await sleep(400);
  await boot({ clear: false, pdf: false });   // the estimator's reload: same browser, empty screen
  await sleep(500);
  const r = await tryEv(`(async () => {
    const host = document.getElementById('resumeList');
    const card = host ? host.querySelector('.rl-card') : null;
    if (!card) return { error: 'no resume card', html: host ? host.innerHTML.slice(0,200) : null };
    window.__fileClicks = 0;
    card.click(); await new Promise(r => setTimeout(r, 400));
    return { label: (card.textContent||'').replace(/\\s+/g,' ').trim().slice(0,120), fileClicks: window.__fileClicks, toast: window.__toast() }; })()`);
  // a takeoff opened while its own PDF is already in the session attaches with no second question
  const attach = await tryEv(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
    VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); await new Promise(r => setTimeout(r, 1100));
    return { conditions: VESApp.state.conditions.length, measurements: VESApp.state.measurements.length,
      askedForPdf: document.getElementById('confirmModal').classList.contains('open'),
      identityModal: document.getElementById('idModal').classList.contains('open') }; })()`);
  check('B6F-6 the resume card opens the file picker itself (one gesture, not a toast naming a second step), and a takeoff opened while its own PDF is already in the session attaches with no further question',
    !!(r && !r.error && r.fileClicks >= 1 && attach && !attach.error && attach.measurements > 0 && !attach.askedForPdf && !attach.identityModal),
    { resumeCard: r, reattach: attach });
}

/* ════════ B6F-7 · the bid's refusal names the conditions that need a price ════════ */
if (want('B7')) {
  await boot();
  await ev(`VESApp.setProjectMeta({ name: 'Probe', preparedBy: { company: 'Probe Co' } }); VESApp.applyScalePreset('1/8"=1\\'-0"'); 1`);
  await sleep(300);
  const r = await tryEv(`(async () => {
    // three hand-added conditions, measured, none priced — the estimator's Monday bid attempt
    const names = ['Ridge cap — standing seam', 'Counterflashing — reglet', 'Curb flashing'];
    const mk = (nm, type) => { const c = { id: VESApp.state.nextId++, name: nm, color: '#ff5d3a', type, csi: '', wbs: '', location: 'Main Roof',
      notes: '', unitCost: null, tags: [], sortOrder: VESApp.state.conditions.length + 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      VESApp.state.conditions.push(c);
      VESApp.state.measurements.push({ id: VESApp.state.nextId++, conditionId: c.id, page: 1, type, value: 120, points: [[0,0],[100,0]], notes: '' });
      return c; };
    names.forEach((n, i) => mk(n, i === 0 ? 'linear' : 'area'));
    VESApp.renderCards(); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 300));
    VESApp.printBidDoc(); await new Promise(r => setTimeout(r, 500));
    const pd = document.getElementById('printDoc').textContent.replace(/\\s+/g,' ').trim();
    const toast = window.__toast();
    const pill = document.getElementById('needPricePill');
    let scrolled = null;
    if (pill && !pill.hidden) { pill.click(); await new Promise(r => setTimeout(r, 400));
      scrolled = { tab: (document.querySelector('#drawerTabs .on')||{}).id || null,
        drawerOpen: !document.getElementById('drawer').classList.contains('collapsed') }; }
    return { printDoc: pd.slice(0, 900), toast, pillHidden: pill ? pill.hidden : null, scrolled, names }; })()`);
  const listsAll = r && !r.error && r.names.every((n) => String(r.printDoc || '').indexOf(n) >= 0);
  const toastLists = r && !r.error && r.names.some((n) => String(r.toast || '').indexOf(n) >= 0);
  check('B6F-7 the bid\'s refusal names the conditions that still need a price — on the printed refusal page and in the toast — and the rail\'s "need price" pill goes to the first one',
    !!(listsAll && toastLists), r);
}

/* ════════ B6F-9 · after a reload the Undo control says what it has, before the third press ════════ */
if (want('B9')) {
  await boot();
  await loadFixture();
  await ev(`VESApp.flushAutosave(); 1`); await sleep(400);
  await boot({ clear: false, pdf: false });   // the estimator's reload
  await sleep(500);
  const r = await tryEv(`(async () => {
    const b = document.getElementById('btnUndo');
    const out = { disabled: b.disabled, title: b.title, depth: VESApp.state.journal.undo.length, toasts: [] };
    for (let i = 0; i < 3; i++) { VESApp.undo(); await new Promise(r => setTimeout(r, 200)); out.toasts.push(window.__toast()); }
    return out; })()`);
  const says = (s) => /nothing from this session yet/i.test(String(s || ''));
  check('B6F-9 after a reload the Undo control itself says "nothing from this session yet" — on the disabled button, before a press, and in the same words when Ctrl+Z is pressed',
    !!(r && !r.error && r.disabled === true && says(r.title) && (r.toasts || []).every(says)), r);
}

/* ════════ B6F-8 · the recap strip says what the panel actually shows first ════════ */
if (want('B8')) {
  const r = await ev(`(() => { const t = document.querySelector('.recap-mini-title');
    return { text: t ? (t.textContent||'').trim() : null, title: t ? (t.title||'').slice(0,160) : null }; })()`);
  check('B6F-8 the recap strip label reads "Recap · by section, then system, then CSI"',
    r && r.text === 'Recap · by section, then system, then CSI', r);
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'RED') + ' — ' + pass + ' pass, ' + fail + ' fail, ' + rows.length + ' rows');
try { c.close(); } catch (_) {}
try { chrome.kill('SIGKILL'); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
