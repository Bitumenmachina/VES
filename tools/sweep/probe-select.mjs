/* Batch Q3 — SELECTION AFFORDANCES (charter .scratch/charter-q3.md, rulings Q3-0…Q3-7). One row per ruling.
 * Reads RENDERED state — the selection chip's own DOM, the pane's chip caches, the journal, the cards,
 * the recap, the measurement geometry — and clicks/drags with a REAL POINTER (including Shift and Ctrl),
 * because every door this batch adds is reached by a hand landing on the sheet.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-select.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet" "$PWD" [--no-subgates] [only]
 *
 * Geometry: every shape this probe traces lives on sheet 3 in x 100…560, y 100…600 — clear of the
 * fixture's own sheet-3 geometry (x 520-1300, y 587-940 per fixtures/synthetic/three-sheet/README.md),
 * so a marquee here never sweeps up work the fixture drew.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NOSUB = process.argv.includes('--no-subgates');
const ARGV = process.argv.slice(2).filter((a) => a !== '--no-subgates');
const [VES, FIX, ROOT, ONLY] = ARGV;
if (!VES || !FIX || !ROOT) { console.error('usage: probe-select.mjs <VES_PM.html> <fixtureDir> <root> [--no-subgates] [only]'); process.exit(2); }
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
const port = 9700 + Math.floor(Math.random() * 90);
const prof = mkdtempSync(join(tmpdir(), 'ves-q3-'));
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
  if (detail !== undefined) console.log('      ' + JSON.stringify(detail).slice(0, 2400));
}

/* ---------- real pointer (probe-hide / probe-deduct idiom) ---------- */
const screenPt = (x, y) => ev(`(() => { const p = VESApp.AP(); const [vx, vy] = p.viewport.convertToViewportPoint(${x}, ${y});
  const r = p.els.overlay.getBoundingClientRect();
  return { sx: r.left + vx, sy: r.top + vy }; })()`);
async function mouse(type, sx, sy, opts = {}) {
  await c.send('Input.dispatchMouseEvent', { type, x: Math.round(sx), y: Math.round(sy), button: 'left',
    buttons: type === 'mouseMoved' ? (opts.held ? 1 : 0) : 1, clickCount: opts.clickCount || 1, modifiers: opts.modifiers || 0 });
}
async function clickScreen(sx, sy, { clickCount = 1, wait = 130, modifiers = 0 } = {}) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(sx), y: Math.round(sy), button: 'none', buttons: 0 });
  await sleep(40);
  for (const t of ['mousePressed', 'mouseReleased']) await mouse(t, sx, sy, { clickCount, modifiers });
  await sleep(wait);
}
/* The stage moves under the pointer the first time it lands (rail/toolbar settle). Move, let it
   settle, re-read where the target IS, and press WITHOUT moving again — the probe-deduct idiom. */
async function clickPdf(x, y, opts = {}) {
  let a = await screenPt(x, y);
  for (let i = 0; i < 6; i++) {
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 });
    await sleep(140);
    const b = await screenPt(x, y);
    if (Math.abs(Math.round(b.sx) - Math.round(a.sx)) < 1 && Math.abs(Math.round(b.sy) - Math.round(a.sy)) < 1) break;
    a = b;
  }
  for (const t of ['mousePressed', 'mouseReleased']) await mouse(t, a.sx, a.sy, { clickCount: opts.clickCount || 1, modifiers: opts.modifiers || 0 });
  await sleep(opts.wait == null ? 130 : opts.wait);
}
async function warmPointer() {
  for (let i = 0; i < 3; i++) { const a = await screenPt(1296, 864);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 }); await sleep(160); }
  await sleep(180);
}
// PDF space is BOTTOM-LEFT origin: convertToViewportPoint flips y. Every drag below is therefore
// expressed in SCREEN space (or converted through the viewport), never by adding to a pdf y.
async function settleAt(from) {
  let a = await screenPt(from[0], from[1]);
  for (let i = 0; i < 4; i++) {
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 });
    await sleep(120);
    const b = await screenPt(from[0], from[1]);
    if (Math.abs(Math.round(b.sx) - Math.round(a.sx)) < 1 && Math.abs(Math.round(b.sy) - Math.round(a.sy)) < 1) break;
    a = b;
  }
  return a;
}
async function dragScreen(sx, sy, tx, ty, { modifiers = 0, wait = 260 } = {}) {
  sx = Math.round(sx); sy = Math.round(sy); tx = Math.round(tx); ty = Math.round(ty);
  await mouse('mousePressed', sx, sy, { modifiers });
  const N = 8;
  for (let i = 1; i <= N; i++) { await mouse('mouseMoved', sx + (tx - sx) * i / N, sy + (ty - sy) * i / N, { modifiers, held: true }); await sleep(18); }
  await mouse('mouseReleased', tx, ty, { modifiers });
  await sleep(wait);
  return { sx, sy, tx, ty };
}
async function dragPdfBy(from, dxCss, dyCss, opts = {}) {
  const a = await settleAt(from);
  return dragScreen(a.sx, a.sy, a.sx + dxCss, a.sy + dyCss, opts);
}
async function dragPdfTo(from, to, opts = {}) {
  const a = await settleAt(from);
  const b = await screenPt(to[0], to[1]);
  return dragScreen(a.sx, a.sy, b.sx, b.sy, opts);
}
// put a sheet point in the middle of the visible wrap, so a zoomed-in drag has room both ways
const centerOn = (x, y) => tryEv(`(() => { const p = VESApp.AP(); const w = p.els.wrap;
  const [vx, vy] = p.viewport.convertToViewportPoint(${x}, ${y});
  const orr = p.els.overlay.getBoundingClientRect(), wr = w.getBoundingClientRect();
  w.scrollLeft += (orr.left + vx - wr.left) - wr.width / 2;
  w.scrollTop  += (orr.top  + vy - wr.top)  - wr.height / 2;
  return { l: w.scrollLeft, t: w.scrollTop }; })()`);
async function clickSel(sel, { wait = 170, modifiers = 0, clickCount = 1 } = {}) {
  const r = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
    const b = e.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0)) return null;
    return { sx: b.left + b.width / 2, sy: b.top + b.height / 2 }; })()`);
  if (!r) return false;
  await clickScreen(r.sx, r.sy, { wait, modifiers, clickCount }); return true;
}
async function typeText(t) { await c.send('Input.insertText', { text: t }); await sleep(60); }
async function key(k, code, vk, mods = 0) {
  for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
  await sleep(200);
}
const ctrlZ = () => key('z', 'KeyZ', 90, 2);
const ctrlD = () => key('d', 'KeyD', 68, 2);
const shiftR = () => key('R', 'KeyR', 82, 8);
const keyDel = () => key('Delete', 'Delete', 46, 0);
const keyEsc = () => key('Escape', 'Escape', 27, 0);
const shiftSpace = () => key(' ', 'Space', 32, 8);

/* ---------- boot ---------- */
const pdfB64 = readFileSync(join(FIX, 'plan.pdf')).toString('base64');
const takeoffText = readFileSync(join(FIX, 'takeoff.v3.json'), 'utf8');
const ARM = `
  window.__take = ${takeoffText};
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__toast = () => { const t = document.querySelector('#toast'); return t ? (t.textContent||'').replace(/\\s+/g,' ').trim() : ''; };
  window.__tool = () => { const t = document.querySelector('#toolMsg'); return t ? (t.textContent||'').replace(/\\s+/g,' ').trim() : ''; };
  window.__jtop = (n) => VESApp.state.journal.undo.slice(-(n||1)).map(x => x.label);
  window.__ms = () => VESApp.state.measurements.map(m => ({ id: m.id, cid: m.conditionId, type: m.type, page: m.page, value: m.value, pts: (m.points||[]).map(q => [q.x, q.y]) }));
  window.__m = (id) => { const m = VESApp.state.measurements.find(x => x.id === id); return m ? { id: m.id, cid: m.conditionId, type: m.type, page: m.page, value: m.value, pts: m.points.map(q => [q.x, q.y]) } : null; };
  window.__sel = () => ({ head: VESApp.state.selectedId,
    set: VESApp.state.selectedIds ? Array.from(VESApp.state.selectedIds) : null,
    grip: VESApp.state.grip ? { mid: VESApp.state.grip.mid, idx: VESApp.state.grip.idx } : null });
  window.__chip = () => { const el = document.querySelector('#selChip'); if (!el) return null;
    return { present: true, hidden: !!el.hidden, text: (el.textContent||'').replace(/\\s+/g,' ').trim(),
      doors: Array.from(el.querySelectorAll('[data-door]')).map(b => b.getAttribute('data-door')),
      left: el.style.left, top: el.style.top }; };
  window.__card = (cid) => { const el = document.querySelector('#cards .card[data-cid="' + cid + '"]'); if (!el) return null;
    const q = el.querySelector('.qty'); return { qty: q ? (q.textContent||'').replace(/\\s+/g,' ').trim() : null }; };
  window.__roll = (cid) => { const r = VESCore.rollup(VESApp.state.conditions, VESApp.state.measurements).find(x => x.id === cid); return r ? { quantity: r.quantity, displayQty: r.displayQty } : null; };
  window.__scroll = () => { const w = VESApp.AP().els.wrap; return { l: w.scrollLeft, t: w.scrollTop, sw: w.scrollWidth, cw: w.clientWidth, sh: w.scrollHeight, ch: w.clientHeight }; };
  window.__scale = () => VESApp.AP().viewport.scale;
  window.__vp = (id) => { const m = VESApp.state.measurements.find(x => x.id === id); if (!m) return null;
    const p = VESApp.AP(); return m.points.map(q => p.viewport.convertToViewportPoint(q.x, q.y)); };
  window.__remeasured = (id) => { const m = VESApp.state.measurements.find(x => x.id === id); if (!m) return null;
    if (m.exact) return true;
    return Math.abs(m.value - VESCore.measureValue(m.type, m.points, VESApp.state.calibrations[m.page] || null)) < 1e-9; };
  window.__sections = () => { try { return JSON.stringify(VESApp.recapModel().sections); } catch (e) { return 'ERR ' + e; } };
  window.__hiddenChip = () => { const el = document.querySelector('#hiddenChip'); return el ? { hidden: el.hidden, text: (el.textContent||'').trim() } : null; };
  window.__secs = () => (VESApp.state.sections || []).map(s => ({ id: s.id, name: s.name, page: s.page, pts: (s.points || []).length }));
  window.__chips = () => ((VESApp.AP() || {}).__secChips || []).map(ch => ch.id);
  window.__ghosts = () => ((VESApp.AP() || {}).__secGhosts || []).map(ch => ch.id);
  window.__ghostPt = (id) => { const p = VESApp.AP(); const all = ((p && p.__secGhosts) || []).concat((p && p.__secChips) || []);
    const ch = all.find(x => x.id === id); if (!ch || !ch.eye) return null; const r = p.els.overlay.getBoundingClientRect();
    return { sx: r.left + ch.eye.x + ch.eye.w / 2, sy: r.top + ch.eye.y + ch.eye.h / 2 }; };
  window.__scan = (data, ink) => { const R = ink[0], G = ink[1], B = ink[2], T = 12;
    let n = 0; for (let i = 0; i < data.length; i += 4) if (data[i+3] > 200 && Math.abs(data[i]-R)<=T && Math.abs(data[i+1]-G)<=T && Math.abs(data[i+2]-B)<=T) n++;
    return n; };
  window.__scanOverlaySec = () => { const p = VESApp.AP(); const o = p.els.overlay; const cx = o.getContext('2d');
    return window.__scan(cx.getImageData(0, 0, o.width, o.height).data, [107, 79, 187]); };
  window.__recap = () => { try { return JSON.stringify(VESApp.recapModel().sections || []); } catch (e) { return 'ERR ' + e; } };
  window.__pick = () => { const el = document.querySelector('#reassignPick'); if (!el) return null;
    return { hidden: !!el.hidden, text: (el.textContent||'').replace(/\\s+/g,' ').trim(),
      opts: Array.from(el.querySelectorAll('[data-cid]')).map(b => b.getAttribute('data-cid')) }; };
  1`;
const openPdf = () => ev(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } return 1; })()`);
async function boot(html = VES) {
  await c.send('Page.navigate', { url: 'file://' + html });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
  await sleep(300);
  await ev(`localStorage.clear(); 1`);
  await ev(ARM);
  await openPdf();
  await sleep(250);
}
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await boot();
const clearStage = async () => { await tryEv(`try { VESApp.toggleRail(true, { persist: false }); } catch(e){} try { VESApp.collapseDrawer(); } catch(e){} try { VESApp.showEstimate(false); } catch(e){} document.body.classList.remove('rail-collapsed'); 1`); await sleep(120); };
const loadFixture = async () => { await ev(`VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); 1`); await sleep(1100);
  await ev(`if (VESApp.state.snap) VESApp.toggleSnap(); 1`); await clearStage(); };
const goSheet = async (n) => { await tryEv(`(async () => { await VESApp.showPane(VESApp.state.panes[0], ${n}, { fit: true }); await new Promise(r=>setTimeout(r,340)); VESApp.fitToView(VESApp.AP()); await new Promise(r=>setTimeout(r,320)); return VESApp.AP().pageNum; })()`); await clearStage(); await warmPointer(); };

async function addCond(name, type, unitCost, location) {
  const r = await tryEv(`(async () => {
    const w = document.getElementById('addCondWrap'); if (w) w.hidden = false;
    document.getElementById('condName').value = ${JSON.stringify(name)};
    document.getElementById('condType').value = ${JSON.stringify(type)};
    document.getElementById('addCondForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 260));
    const c = VESApp.state.conditions[VESApp.state.conditions.length - 1];
    c.unitCost = ${JSON.stringify(unitCost)};
    ${location ? `c.location = ${JSON.stringify(location)};` : ''}
    VESApp.activateCondition(c);
    await new Promise(r => setTimeout(r, 160));
    try { VESApp.collapseDrawer(); } catch (e) {}
    document.activeElement && document.activeElement.blur();
    VESApp.renderCards();
    return { id: c.id, name: c.name, type: c.type };
  })()`);
  await sleep(140);
  return r;
}
const armCond = async (cid) => { await tryEv(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${cid}); VESApp.activateCondition(c);
  VESApp.setTool('measure'); try { VESApp.collapseDrawer(); } catch(e){} document.activeElement && document.activeElement.blur(); return 1; })()`); await sleep(160); };
const rectOn = async () => { await ev(`if (!VESApp.state.rectMode) VESApp.toggleRect(); VESApp.state.rectMode`); };
const rectOff = async () => { await ev(`if (VESApp.state.rectMode) VESApp.toggleRect(); !VESApp.state.rectMode`); };
async function traceRect(a, b) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await clearStage();
    await tryEv('VESApp.fitToView(VESApp.AP()); 1'); await sleep(280);
    await warmPointer();
    await clickPdf(a[0], a[1], { wait: 170 });
    const landed = await tryEv('(() => { const d = VESApp.state.draft; return (d && d.points && d.points.length) ? [d.points[0].x, d.points[0].y] : null; })()');
    if (Array.isArray(landed) && Math.abs(landed[0] - a[0]) <= 1.5 && Math.abs(landed[1] - a[1]) <= 1.5) break;
    await tryEv('VESApp.state.draft = null; VESApp.drawOverlays(); 1');
    await sleep(160);
  }
  await clickPdf(b[0], b[1], { wait: 420 });
}
async function traceLine(a, b) {
  await rectOff();
  await clearStage();
  await tryEv('VESApp.fitToView(VESApp.AP()); 1'); await sleep(260);
  await warmPointer();
  await clickPdf(a[0], a[1], { wait: 180 });
  await clickPdf(b[0], b[1], { wait: 180 });
  await key('Enter', 'Enter', 13, 0);
  await sleep(220);
}
async function drawRegion(name, pts) {
  const armed = await clickSel('#btnSection');
  if (!armed) return { noTool: true };
  await warmPointer();
  for (const p of pts) await clickPdf(p[0], p[1], { wait: 130 });
  const first = await ev(`(() => { const d = VESApp.state.secDraft; return d && d.points.length ? [d.points[0].x, d.points[0].y] : null; })()`);
  if (first) await clickPdf(first[0], first[1], { wait: 300 });
  const modal = await ev(`(() => { const m = document.getElementById('secNameModal'); return !!(m && m.classList.contains('open')); })()`);
  if (!modal) return { noPrompt: true, secs: await ev('window.__secs()') };
  await ev(`(() => { const i = document.getElementById('secNameInput'); if (i) { i.focus(); i.select(); } 1 })()`);
  await typeText(name);
  const ok = await clickSel('#secNameOk', { wait: 320 });
  await ev(`VESApp.setTool('select'); 1`); await sleep(120);
  return { ok, secs: await ev('window.__secs()') };
}
const selectTool = async () => { await ev(`VESApp.setTool('select'); document.activeElement && document.activeElement.blur(); 1`); await sleep(140); };

const FIXQ = await tryEv(`(async () => { VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); await new Promise(r=>setTimeout(r,1000));
  if (VESApp.state.snap) VESApp.toggleSnap();
  return { conditions: VESApp.state.conditions.length, measurements: VESApp.state.measurements.length }; })()`);
if (FIXQ.error) { console.error('HARNESS FAIL: the fixture did not load — ' + FIXQ.error); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
await clearStage();
console.log('# fixture loaded: ' + JSON.stringify(FIXQ) + ' (three-sheet: 26 conditions, 29 measurements)\n');

/* ════════ Q3-0 · a hidden REGION keeps a ghost chip, and Show all brings regions back too (R-12a) ════════ */
if (want('0')) {
  await loadFixture();
  await goSheet(3);
  const REG = await drawRegion('Ghost (Q3-0)', [[1500, 200], [2200, 200], [2200, 520], [1500, 520]]);
  const sec = (REG.secs || [])[0];
  await selectTool();
  const eyePt = sec ? await tryEv(`window.__ghostPt(${sec.id})`) : null;
  if (eyePt && !eyePt.error) await clickScreen(eyePt.sx, eyePt.sy, { wait: 300 });
  const hid = await tryEv(`(() => ({ hiddenRegions: VESApp.state.hiddenRegions ? Array.from(VESApp.state.hiddenRegions) : [],
    chips: window.__chips(), ghosts: window.__ghosts(), ink: window.__scanOverlaySec(),
    hiddenChip: window.__hiddenChip(), journal: window.__jtop(1) }))()`);
  // the ghost's own eye clicks the region back
  const gPt = sec ? await tryEv(`window.__ghostPt(${sec.id})`) : null;
  if (gPt && !gPt.error) await clickScreen(gPt.sx, gPt.sy, { wait: 300 });
  const back = await tryEv(`(() => ({ hiddenRegions: VESApp.state.hiddenRegions ? Array.from(VESApp.state.hiddenRegions) : [],
    chips: window.__chips(), ghosts: window.__ghosts(), ink: window.__scanOverlaySec() }))()`);
  // hide again → save → reload → the ghost chip is still there, and "N hidden · M regions" counts it
  const after = await tryEv(`(async () => {
    VESApp.toggleRegionHidden(${sec ? sec.id : -1});
    const c1 = VESApp.state.conditions.find(x => x.type !== 'count');
    VESApp.state.hiddenConds = new Set([c1.id]); VESApp.renderCards(); VESApp.drawOverlays();
    await new Promise(r => setTimeout(r, 200));
    const chipText = (document.querySelector('#hiddenChip')||{}).textContent;
    const json = JSON.stringify(VESApp.snapshot());
    VESApp.loadFromData(JSON.parse(json));
    await new Promise(r => setTimeout(r, 1100));
    VESApp.drawOverlays();
    await new Promise(r => setTimeout(r, 250));
    return { chipText: String(chipText||'').trim(),
      hiddenRegions: VESApp.state.hiddenRegions ? Array.from(VESApp.state.hiddenRegions) : [],
      ghosts: window.__ghosts(), chips: window.__chips() }; })()`);
  // Show all clears the region half too
  const shown = await tryEv(`(() => { VESApp.showAllHiddenConds(); return { hiddenRegions: VESApp.state.hiddenRegions ? Array.from(VESApp.state.hiddenRegions) : [],
    hiddenConds: VESApp.state.hiddenConds ? Array.from(VESApp.state.hiddenConds) : [], chips: window.__chips(), ghosts: window.__ghosts() }; })()`);
  const ok = !!sec && !hid.error && hid.hiddenRegions.indexOf(sec.id) >= 0 && hid.ink === 0
    && hid.chips.indexOf(sec.id) < 0 && hid.ghosts.indexOf(sec.id) >= 0
    && !back.error && back.hiddenRegions.length === 0 && back.chips.indexOf(sec.id) >= 0 && back.ink > 40
    && !after.error && / · 1 region/.test(after.chipText) && /^1 hidden/.test(after.chipText)
    && after.hiddenRegions.indexOf(sec.id) >= 0 && after.ghosts.indexOf(sec.id) >= 0
    && !shown.error && shown.hiddenRegions.length === 0 && shown.hiddenConds.length === 0 && shown.chips.indexOf(sec.id) >= 0;
  check('Q3-0 a hidden region keeps a faint GHOST chip carrying its own eye (no outline: the section ink scan is 0 and the live chip cache does not hold it) — clicking that eye brings the region back, the ghost survives save → reload, the rail chip counts it as "N hidden · M regions", and Show all clears the region half of hidden as well as the condition half',
    ok, { region: sec, hidden: hid, backFromGhost: back, afterReload: after, showAll: shown });
}

/* ---------- the Q3-a…Q3-e stage: one area with one line lying inside it, on clear sheet-3 paper ---------- */
let AREA = null, LINE = null, AM = null, LM = null;
async function buildStack() {
  await loadFixture();
  await goSheet(3);
  AREA = await addCond('Field (Q3)', 'area', 5);
  await armCond(AREA.id); await rectOn();
  await traceRect([140, 140], [460, 520]);
  LINE = await addCond('Flash (Q3)', 'linear', 3);
  await armCond(LINE.id);
  await traceLine([200, 300], [400, 300]);
  await selectTool();
  const ms = await tryEv(`(() => ({ area: (VESApp.state.measurements.find(m => m.conditionId === ${AREA.id})||{}).id,
    line: (VESApp.state.measurements.find(m => m.conditionId === ${LINE.id})||{}).id }))()`);
  AM = ms.area; LM = ms.line;
  return ms;
}

/* ════════ Q3-a · the click picks the line inside the area, and the CHIP names it ════════ */
if (want('a') || want('b') || want('c') || want('d') || want('e')) {
  const built = await buildStack();
  if (want('a')) {
    await warmPointer();
    await clickPdf(300, 300, { wait: 320 });
    const r = await tryEv(`({ sel: window.__sel(), chip: window.__chip(), tool: window.__tool() })`);
    const ok = !!AM && !!LM && !r.error && r.sel.head === LM && r.chip && r.chip.hidden === false
      && /\bline\b/i.test(r.chip.text) && /Flash \(Q3\)/.test(r.chip.text)
      && /1 more under it/i.test(r.chip.text) && /sheet 3/i.test(r.chip.text)
      && ['edit', 'delete', 'move', 'duplicate', 'reassign', 'cycle'].every((d) => (r.chip.doors || []).indexOf(d) >= 0);
    check('Q3-a a click on a linear that lies INSIDE an area selects the linear (AF-1 pick order untouched) and the selection chip names it — trade word · condition · value + unit · "sheet 3" · "1 more under it" — carrying all six doors (Edit · Delete · Move · Duplicate · Re-assign · Cycle)',
      ok, { built, areaMid: AM, lineMid: LM, after: r });
  }

  /* ════════ Q3-b · a second click at the same spot cycles to the area; Shift+Space cycles back ════════ */
  if (want('b')) {
    await clickPdf(300, 300, { wait: 320 });
    const r1 = await tryEv(`({ sel: window.__sel(), chip: window.__chip() })`);
    await shiftSpace();
    const r2 = await tryEv(`({ sel: window.__sel(), chip: window.__chip() })`);
    const ok = !r1.error && r1.sel.head === AM && r1.chip && /Field \(Q3\)/.test(r1.chip.text) && /\barea\b/i.test(r1.chip.text)
      && !r2.error && r2.sel.head === LM && r2.chip && /Flash \(Q3\)/.test(r2.chip.text);
    check('Q3-b clicking the same spot again steps to the area under the line and the chip renames itself to it; Shift+Space steps the same stack back to the line without moving the pointer (Bluebeam parity)',
      ok, { secondClick: r1, afterShiftSpace: r2, areaMid: AM, lineMid: LM });
  }

  /* ════════ Q3-c · the selected line's BODY drags the whole shape; the canvas does not pan ════════ */
  if (want('c')) {
    await tryEv(`VESApp.setZoom(VESApp.AP(), VESApp.AP().zoom * 2); 1`); await sleep(460);
    await centerOn(300, 330); await sleep(200);
    await warmPointer();
    let sel0 = null;
    for (let i = 0; i < 4; i++) {                 // step the stack until the LINE is the head again
      await clickPdf(300, 300, { wait: 300 });
      sel0 = await tryEv('window.__sel()');
      if (sel0 && sel0.head === LM) break;
    }
    const before = await tryEv(`({ m: window.__m(${JSON.stringify(LM)}), vp: window.__vp(${JSON.stringify(LM)}),
      scroll: window.__scroll(), scale: window.__scale(), card: window.__card(${LINE ? LINE.id : -1}) })`);
    await dragPdfBy([300, 300], -40, 0, { wait: 360 });
    const after = await tryEv(`({ m: window.__m(${JSON.stringify(LM)}), vp: window.__vp(${JSON.stringify(LM)}),
      scroll: window.__scroll(), journal: window.__jtop(1), card: window.__card(${LINE ? LINE.id : -1}),
      remeasured: window.__remeasured(${JSON.stringify(LM)}) })`);
    await ctrlZ();
    const undone = await tryEv(`window.__m(${JSON.stringify(LM)})`);
    // the delta is read in VIEWPORT (css) space — pdf space is bottom-left origin, so a css dx/dy is
    // not a pdf dx/dy, and a rotated sheet would swap the axes outright.
    const dxs = (after.vp && before.vp) ? after.vp.map((p, i) => p[0] - before.vp[i][0]) : [];
    const dys = (after.vp && before.vp) ? after.vp.map((p, i) => p[1] - before.vp[i][1]) : [];
    const movedRight = dxs.length > 0 && dxs.every((d) => Math.abs(d - (-40)) <= 2) && dys.every((d) => Math.abs(d) <= 2);
    const didNotPan = !!before.scroll && !!after.scroll && Math.abs(after.scroll.l - before.scroll.l) < 3 && Math.abs(after.scroll.t - before.scroll.t) < 3;
    const restored = !!undone && !undone.error && !!before.m && JSON.stringify(undone.pts) === JSON.stringify(before.m.pts);
    const ok = sel0 && sel0.head === LM && movedRight && didNotPan && restored
      && /^move\b/i.test(String((after.journal || [])[0] || '')) && /line/i.test(String((after.journal || [])[0] || ''))
      && after.card && before.card && after.card.qty === before.card.qty && after.remeasured === true
      && (before.scroll.sw - before.scroll.cw - before.scroll.l) > 60;   // a -40 px hand would have panned scrollLeft +40 — there WAS room, so "did not pan" is not vacuous
    check('Q3-c a pointerdown on the BODY of the already-selected line drags the whole shape 40 css px (every point moves by the same sheet-unit delta, the canvas scroll does not move a pixel although there was room to pan), the card\'s quantity is the re-measured geometry, the journal reads "move line", and one Ctrl+Z puts every point back exactly',
      ok, { sel0, before: { pts: before.m && before.m.pts, scroll: before.scroll, scale: before.scale, card: before.card },
        after: { scroll: after.scroll, journal: after.journal, card: after.card, remeasured: after.remeasured },
        dxs, dys, movedRight, didNotPan, restored });
  }

  /* ════════ Q3-d · an UNSELECTED shape's body still pans, and moves nothing ════════ */
  if (want('d')) {
    await keyEsc();
    await centerOn(300, 330); await sleep(200);
    await keyEsc();                               // nothing armed, nothing selected
    const sel0 = await tryEv('window.__sel()');
    const before = await tryEv(`({ ms: window.__ms(), scroll: window.__scroll() })`);
    await dragPdfBy([300, 400], -60, -40, { wait: 360 });   // inside the area, nothing selected
    const after = await tryEv(`({ ms: window.__ms(), scroll: window.__scroll(), sel: window.__sel() })`);
    const panned = !!before.scroll && !!after.scroll
      && (Math.abs(after.scroll.l - before.scroll.l) >= 20 || Math.abs(after.scroll.t - before.scroll.t) >= 20);
    const nothingMoved = JSON.stringify((before.ms || []).map((m) => m.pts)) === JSON.stringify((after.ms || []).map((m) => m.pts));
    const ok = sel0 && sel0.head == null && panned && nothingMoved;
    check('Q3-d dragging the body of an UNSELECTED area pans the sheet exactly as it always did and moves no geometry at all — move is a door the selection opens, never a thing the pointer does by accident',
      ok, { sel0, before: before.scroll, after: after.scroll, panned, nothingMoved });
  }

  /* ════════ Q3-e · Ctrl+D duplicates the selected shape at +12/+12, selected; one undo removes it ════════ */
  if (want('e')) {
    await tryEv(`VESApp.fitToView(VESApp.AP()); 1`); await sleep(320);
    await warmPointer();
    await clickPdf(300, 450, { wait: 300 });      // inside the area, off the line → the area
    const sel0 = await tryEv('window.__sel()');
    const before = await tryEv(`({ n: VESApp.state.measurements.length, m: window.__m(${JSON.stringify(AM)}), vp: window.__vp(${JSON.stringify(AM)}), scale: window.__scale() })`);
    await ctrlD();
    const after = await tryEv(`({ n: VESApp.state.measurements.length, sel: window.__sel(), journal: window.__jtop(1),
      ms: window.__ms() })`);
    const dup = (after.ms || []).find((m) => m.id !== AM && m.cid === (AREA ? AREA.id : -1));
    const dupVp = dup ? await tryEv(`window.__vp(${JSON.stringify(dup.id)})`) : null;
    await ctrlZ();
    const undone = await tryEv(`({ n: VESApp.state.measurements.length, sel: window.__sel() })`);
    const off = (dupVp && before.vp && !dupVp.error) ? dupVp.map((q, i) => [q[0] - before.vp[i][0], q[1] - before.vp[i][1]]) : [];
    const offOk = off.length > 0 && off.every(([dx, dy]) => Math.abs(dx - 12) <= 1.5 && Math.abs(dy - 12) <= 1.5);
    const ok = sel0 && sel0.head === AM && !after.error && after.n === before.n + 1 && !!dup
      && offOk && after.sel.head === dup.id && dup.page === 3
      && /duplicate/i.test(String((after.journal || [])[0] || ''))
      && !undone.error && undone.n === before.n;
    check('Q3-e Ctrl+D on the selected area clones it onto the SAME condition and sheet at +12/+12 css px, lands the clone selected, journals "duplicate …", and one Ctrl+Z removes the clone',
      ok, { sel0, before, after: { n: after.n, sel: after.sel, journal: after.journal }, dup, off, offOk, undone });
  }
}

/* ════════ Q3-f · a marquee over four shapes reads "4 shapes"; Delete is ONE entry; one undo restores all ════════ */
if (want('f')) {
  await loadFixture();
  await goSheet(3);
  const C4 = await addCond('Marquee (Q3f)', 'area', 4);
  await armCond(C4.id); await rectOn();
  const boxes = [[[160, 160], [260, 240]], [[300, 160], [400, 240]], [[160, 300], [260, 380]], [[300, 300], [400, 380]]];
  for (const b of boxes) { await armCond(C4.id); await rectOn(); await traceRect(b[0], b[1]); }
  await selectTool();
  await tryEv(`VESApp.fitToView(VESApp.AP()); 1`); await sleep(320);
  await warmPointer();
  const mine = await tryEv(`VESApp.state.measurements.filter(m => m.conditionId === ${C4.id}).map(m => m.id)`);
  await dragPdfTo([110, 110], [470, 440], { wait: 460 });
  const marq = await tryEv(`({ sel: window.__sel(), chip: window.__chip() })`);
  await keyDel();
  const gone = await tryEv(`({ n: VESApp.state.measurements.length, mine: VESApp.state.measurements.filter(m => m.conditionId === ${C4.id}).length,
    journal: window.__jtop(1) })`);
  await ctrlZ();
  const back = await tryEv(`({ mine: VESApp.state.measurements.filter(m => m.conditionId === ${C4.id}).length, undoDepthTop: window.__jtop(1) })`);
  const ok = Array.isArray(mine) && mine.length === 4 && !marq.error
    && marq.sel.set && marq.sel.set.length === 4 && mine.every((id) => marq.sel.set.indexOf(id) >= 0)
    && marq.chip && marq.chip.hidden === false && /\b4 shapes\b/i.test(marq.chip.text)
    && ['delete', 'move', 'reassign'].every((d) => (marq.chip.doors || []).indexOf(d) >= 0)
    && !gone.error && gone.mine === 0 && /^delete 4 shapes$/i.test(String((gone.journal || [])[0] || ''))
    && !back.error && back.mine === 4;
  check('Q3-f a drag on EMPTY canvas draws a marquee that takes all four traced shapes (chip reads "4 shapes" with Delete · Move · Re-assign), Delete removes all four as ONE journal entry "delete 4 shapes", and one Ctrl+Z restores all four',
    ok, { traced: mine, marquee: marq, afterDelete: gone, afterUndo: back });
}

/* ════════ Q3-g · re-assign moves the quantity between two conditions of the same type; the wrong type is refused ════════ */
if (want('g')) {
  await loadFixture();
  await goSheet(3);
  const L1 = await addCond('Drip A (Q3g)', 'linear', 3, 'Main Roof');
  const L2 = await addCond('Drip B (Q3g)', 'linear', 3, 'Annex Q3g');
  const A1 = await addCond('Field B (Q3g)', 'area', 6, 'Main Roof');
  await armCond(L1.id);
  await traceLine([160, 200], [460, 200]);
  await armCond(A1.id); await rectOn();
  await traceRect([160, 380], [460, 560]);
  await selectTool();
  await tryEv(`VESApp.fitToView(VESApp.AP()); 1`); await sleep(300);
  const before = await tryEv(`({ l1: window.__roll(${L1.id}), l2: window.__roll(${L2.id}),
    c1: window.__card(${L1.id}), c2: window.__card(${L2.id}), recap: window.__recap(),
    lm: (VESApp.state.measurements.find(m => m.conditionId === ${L1.id})||{}).id })`);
  await warmPointer();
  await clickPdf(300, 200, { wait: 320 });
  const picked = await tryEv('window.__sel()');
  await shiftR();
  const pick = await tryEv('window.__pick()');
  const clicked = await clickSel(`#reassignPick [data-cid="${L2.id}"]`, { wait: 360 });
  const after = await tryEv(`({ l1: window.__roll(${L1.id}), l2: window.__roll(${L2.id}),
    c1: window.__card(${L1.id}), c2: window.__card(${L2.id}), recap: window.__recap(),
    m: window.__m(${JSON.stringify(before.lm)}), journal: window.__jtop(1) })`);
  // the wrong type, refused with the reason spoken and nothing written
  const refuse = await tryEv(`(() => { const am = VESApp.state.measurements.find(m => m.conditionId === ${A1.id});
    VESApp.state.selectedId = am.id; VESApp.state.selectedIds = new Set([am.id]);
    document.getElementById('toast').textContent = '';
    const ok = VESApp.reassignTo(VESApp.state.conditions.find(c => c.id === ${L2.id}));
    return { ok, cid: VESApp.state.measurements.find(m => m.id === am.id).conditionId, toast: window.__toast(), tool: window.__tool() }; })()`);
  const moved = (before.l1 && after.l1 && before.l2 && after.l2)
    ? Math.abs((before.l1.quantity - after.l1.quantity) - (after.l2.quantity - before.l2.quantity)) < 1e-9
      && (before.l1.quantity - after.l1.quantity) > 0
    : false;
  // the recap files by Section; an unmeasured condition's section already sits on it at $0, so the
  // proof is the COST moving: Annex gains exactly what Main Roof loses, and Annex was 0 before
  const secCost = (json, name) => { try { const s = JSON.parse(json).find((x) => x.name === name); return s ? (Number(s.cost) || 0) : 0; } catch (_) { return NaN; } };
  const annexB = secCost(before.recap, 'Annex Q3g'), annexA = secCost(after.recap, 'Annex Q3g');
  const mainB = secCost(before.recap, 'Main Roof'), mainA = secCost(after.recap, 'Main Roof');
  const recapMoved = annexB === 0 && annexA > 0 && (mainB - mainA) > 0 && Math.abs((annexA - annexB) - (mainB - mainA)) < 1e-6;
  const ok = !before.error && !after.error && picked && picked.head === before.lm
    && pick && pick.hidden === false && (pick.opts || []).indexOf(String(L2.id)) >= 0 && (pick.opts || []).indexOf(String(A1.id)) < 0
    && clicked === true && after.m && after.m.cid === L2.id && moved
    && /re-assign/i.test(String((after.journal || [])[0] || ''))
    && recapMoved
    && !refuse.error && refuse.ok === false && refuse.cid === A1.id && /area/i.test(refuse.toast || '') && (refuse.toast || '').length > 10;
  check('Q3-g Shift+R opens a picker of the SAME-type conditions only (the area condition is not offered), choosing one writes m.conditionId so both cards\' LF change by the same amount and the recap grows the new condition\'s section; an area pushed onto a linear condition is refused with the reason spoken and m.conditionId unchanged',
    ok, { before: { l1: before.l1, l2: before.l2, annexCost: annexB, mainCost: mainB },
      picker: pick, clicked, after: { l1: after.l1, l2: after.l2, cid: after.m && after.m.cid, journal: after.journal, annexCost: annexA, mainCost: mainA },
      moved, recapMoved, refusal: refuse });
}

/* ════════ Q3-h · a marquee never takes a HIDDEN condition's shapes ════════ */
if (want('h')) {
  await loadFixture();
  await goSheet(3);
  const SHOW = await addCond('Seen (Q3h)', 'area', 4);
  await armCond(SHOW.id); await rectOn(); await traceRect([160, 160], [280, 260]);
  const HIDE = await addCond('Unseen (Q3h)', 'area', 4);
  await armCond(HIDE.id); await rectOn(); await traceRect([320, 160], [440, 260]);
  await selectTool();
  await tryEv(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${HIDE.id}); VESApp.toggleCondHidden(c); return 1; })()`);
  await sleep(240);
  await tryEv(`VESApp.fitToView(VESApp.AP()); 1`); await sleep(300);
  await warmPointer();
  const ids = await tryEv(`({ shown: (VESApp.state.measurements.find(m => m.conditionId === ${SHOW.id})||{}).id,
    hidden: (VESApp.state.measurements.find(m => m.conditionId === ${HIDE.id})||{}).id })`);
  await dragPdfTo([120, 120], [500, 320], { wait: 460 });
  const r = await tryEv(`({ sel: window.__sel(), chip: window.__chip(),
    isHidden: !!(VESApp.state.hiddenConds && VESApp.state.hiddenConds.has(${HIDE.id})) })`);
  const ok = !r.error && r.isHidden === true && r.sel.set && r.sel.set.length === 1
    && r.sel.set[0] === ids.shown && r.sel.set.indexOf(ids.hidden) < 0;
  check('Q3-h a marquee drawn over both shapes takes only the visible one — a hidden condition is skipped by the marquee exactly as it is skipped by the click (Q2-c), so nothing invisible can be deleted or moved in bulk',
    ok, { ids, after: r });
}

/* ════════ Q3-i · the money gates and the batches before this one ════════ */
if (NOSUB) {
  check('Q3-i child gates not run here (--no-subgates); each runs as its own step', true,
    { skipped: '--no-subgates was passed; the children run separately' });
} else if (want('i')) {
  const sub = [];
  const run = (label, cmd, a) => { const t0 = Date.now();
    const r = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
    const out = String(r.stdout || '') + String(r.stderr || '');
    const p = (out.match(/^PASS /gm) || []).length, f = (out.match(/^FAIL /gm) || []).length;
    sub.push({ label, code: r.status, pass: p, fail: f, ms: Date.now() - t0, green: /G0 GREEN/.test(out) || /ALL GREEN/.test(out), tail: out.trim().split('\n').slice(-2).join(' | ').slice(0, 200) });
    return r.status === 0; };
  const S = (n) => join(ROOT, 'tools', 'sweep', n);
  const okG0 = run('g0', 'node', [join(ROOT, 'gate', 'g0.mjs'), 'check', join(ROOT, 'src', 'VES_PM.html')]);
  const okFix = run('probe-b0-fixture', 'node', [S('probe-b0-fixture.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const demo = join(ROOT, 'release', 'demo', 'demo-flat-roof.json');
  const okPitch = run('probe-b1-pitch', 'node', [S('probe-b1-pitch.mjs'), join(ROOT, 'src', 'VES_PM.html'), demo, ROOT, FIX]);
  const okB2a = run('probe-b2a-sections', 'node', [S('probe-b2a-sections.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB2b = run('probe-b2b-regions', 'node', [S('probe-b2b-regions.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB3 = run('probe-b3-colors', 'node', [S('probe-b3-colors.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB4 = run('probe-b4-print', 'node', [S('probe-b4-print.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB5 = run('probe-b5-words', 'node', [S('probe-b5-words.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT, '--no-subgates']);
  const okB6f = run('probe-b6f', 'node', [S('probe-b6f.mjs'), join(ROOT, 'src', 'VES_PM.html'), FIX, ROOT]);
  const okDeduct = run('probe-deduct', 'node', [S('probe-deduct.mjs'), join(ROOT, 'src', 'VES_PM.html'), FIX, ROOT]);
  const okHide = run('probe-hide', 'node', [S('probe-hide.mjs'), join(ROOT, 'src', 'VES_PM.html'), FIX, ROOT, '--no-subgates']);
  const allOk = okG0 && okFix && okPitch && okB2a && okB2b && okB3 && okB4 && okB5 && okB6f && okDeduct && okHide;
  check('Q3-i G0 4/4 · probe-b0-fixture 7/7 · b1-pitch · b2a-sections · b2b-regions · b3-colors · b4-print · b5-words · b6f · deduct · hide — selection affordances move no money', allOk, sub);
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'RED') + ' — ' + pass + ' pass, ' + fail + ' fail, ' + rows.length + ' rows');
try { c.close(); } catch (_) {}
try { chrome.kill('SIGKILL'); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
