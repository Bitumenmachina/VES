/* Batch Q2 — HIDE / SOLO (charter .scratch/charter-q2.md, rulings Q2-1…Q2-5). One row per ruling.
 * Reads RENDERED state — the rail strip's own DOM, the journal, the rollup, the grid/recap text,
 * the composed takeoff paper, the saved file's own bytes — and traces/clicks with a REAL POINTER
 * (including Alt+click), because Solo lives on a card's eye and the region eye lives on a canvas
 * chip a hand has to land on.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-hide.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet" "$PWD" [--no-subgates] [only]
 *
 * No old build: every row here reads the CURRENT bytes only — there is no prior VES_PM.html that
 * ever had Solo/H/the region eye, so there is nothing upstream to diff against.
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
if (!VES || !FIX || !ROOT) { console.error('usage: probe-hide.mjs <VES_PM.html> <fixtureDir> <root> [--no-subgates] [only]'); process.exit(2); }
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
const port = 9600 + Math.floor(Math.random() * 90);
const prof = mkdtempSync(join(tmpdir(), 'ves-q2-'));
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

/* ---------- real pointer (probe-deduct / probe-b2b-regions idiom) ---------- */
const screenPt = (x, y) => ev(`(() => { const p = VESApp.AP(); const [vx, vy] = p.viewport.convertToViewportPoint(${x}, ${y});
  const r = p.els.overlay.getBoundingClientRect();
  return { sx: r.left + vx, sy: r.top + vy }; })()`);
async function mouse(type, sx, sy, opts = {}) {
  await c.send('Input.dispatchMouseEvent', { type, x: Math.round(sx), y: Math.round(sy), button: 'left',
    buttons: type === 'mouseMoved' ? 0 : 1, clickCount: opts.clickCount || 1, modifiers: opts.modifiers || 0 });
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
  await sleep(170);
}
const ctrlZ = () => key('z', 'KeyZ', 90, 2);
const ctrlY = () => key('y', 'KeyY', 89, 2);
async function hoverToolbar() {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 12, button: 'none', buttons: 0 });
  await sleep(360);
}

/* ---------- boot ---------- */
const pdfB64 = readFileSync(join(FIX, 'plan.pdf')).toString('base64');
const takeoffText = readFileSync(join(FIX, 'takeoff.v3.json'), 'utf8');
const ARM = `
  window.__take = ${takeoffText};
  window.__printed = 0;
  window.print = function () { window.__printed++;
    const d = document.getElementById('printDoc'); window.__pdSnap = d ? d.innerHTML : '';
    try { window.dispatchEvent(new Event('beforeprint')); } finally { setTimeout(() => window.dispatchEvent(new Event('afterprint')), 0); }
    setTimeout(() => { const e = document.getElementById('printDoc'); if (e) e.innerHTML = window.__pdSnap; }, 0);
  };
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__blobs = [];
  window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, mime, text: (typeof bytes === 'string') ? bytes : null, len: bytes && bytes.length }); };
  window.__grand = () => { try { const m = VESApp.recapModel(); return { cost: Math.round(m.cost*100), sell: Math.round(m.sell*100) }; } catch (e) { return { error: String(e) }; } };
  window.__toast = () => { const t = document.querySelector('#toast'); return t ? (t.textContent||'').replace(/\\s+/g,' ').trim() : ''; };
  window.__tool = () => { const t = document.querySelector('#toolMsg'); return t ? (t.textContent||'').replace(/\\s+/g,' ').trim() : ''; };
  window.__jtop = (n) => VESApp.state.journal.undo.slice(-(n||1)).map(x => x.label);
  window.__ms = () => VESApp.state.measurements.map(m => ({ id: m.id, cid: m.conditionId, type: m.type, page: m.page, value: m.value, pts: (m.points||[]).length }));
  window.__roll = (cid) => { const r = VESCore.rollup(VESApp.state.conditions, VESApp.state.measurements).find(x => x.id === cid); return r ? JSON.parse(JSON.stringify(r)) : null; };
  window.__card = (cid) => { const el = document.querySelector('#cards .card[data-cid="' + cid + '"]'); if (!el) return null;
    const q = el.querySelector('.qty'); return { qty: q ? (q.textContent||'').replace(/\\s+/g,' ').trim() : null, all: (el.textContent||'').replace(/\\s+/g,' ').trim().slice(0,400) }; };
  window.__hiddenChip = () => { const el = document.querySelector('#hiddenChip'); return el ? { hidden: el.hidden, text: (el.textContent||'').trim() } : null; };
  window.__secs = () => (VESApp.state.sections || []).map(s => ({ id: s.id, name: s.name, page: s.page, pts: (s.points || []).length }));
  window.__locs = () => VESApp.state.conditions.map(c => [c.id, String(c.location || '')]);
  window.__eyePt = (id) => { const p = VESApp.AP(); const ch = ((p && p.__secChips) || []).find(x => x.id === id);
    if (!ch || !ch.eye) return null; const r = p.els.overlay.getBoundingClientRect();
    return { sx: r.left + ch.eye.x + ch.eye.w / 2, sy: r.top + ch.eye.y + ch.eye.h / 2 }; };
  window.__scan = (data, w, h, ink) => { const R = ink[0], G = ink[1], B = ink[2], T = 12;
    let n = 0; for (let i = 0; i < data.length; i += 4) if (data[i+3] > 200 && Math.abs(data[i]-R)<=T && Math.abs(data[i+1]-G)<=T && Math.abs(data[i+2]-B)<=T) n++;
    return n; };
  window.__scanOverlaySec = () => { const p = VESApp.AP(); const o = p.els.overlay; const cx = o.getContext('2d');
    return window.__scan(cx.getImageData(0, 0, o.width, o.height).data, o.width, o.height, [107, 79, 187]); };   // SEC_INK
  1`;
const openPdf = () => ev(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } return 1; })()`);
async function boot(html = VES, { pdf = true } = {}) {
  await c.send('Page.navigate', { url: 'file://' + html });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
  await sleep(300);
  await ev(`localStorage.clear(); 1`);
  await ev(ARM);
  if (pdf) await openPdf();
  await sleep(250);
}
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await boot();
const clearStage = async () => { await tryEv(`try { VESApp.toggleRail(true, { persist: false }); } catch(e){} try { VESApp.collapseDrawer(); } catch(e){} try { VESApp.showEstimate(false); } catch(e){} document.body.classList.remove('rail-collapsed'); 1`); await sleep(120); };
const loadFixture = async () => { await ev(`VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); 1`); await sleep(1100);
  await ev(`if (VESApp.state.snap) VESApp.toggleSnap(); 1`); await clearStage(); };
const goSheet = async (n) => { await tryEv(`(async () => { await VESApp.showPane(VESApp.state.panes[0], ${n}, { fit: true }); await new Promise(r=>setTimeout(r,340)); VESApp.fitToView(VESApp.AP()); await new Promise(r=>setTimeout(r,320)); return VESApp.AP().pageNum; })()`); await clearStage(); await warmPointer(); };

async function addCond(name, type, unitCost) {
  const r = await tryEv(`(async () => {
    const w = document.getElementById('addCondWrap'); if (w) w.hidden = false;
    document.getElementById('condName').value = ${JSON.stringify(name)};
    document.getElementById('condType').value = ${JSON.stringify(type)};
    document.getElementById('addCondForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 260));
    const c = VESApp.state.conditions[VESApp.state.conditions.length - 1];
    c.unitCost = ${JSON.stringify(unitCost)};
    VESApp.activateCondition(c);
    await new Promise(r => setTimeout(r, 160));
    try { VESApp.collapseDrawer(); } catch (e) {}
    document.activeElement && document.activeElement.blur();
    VESApp.renderCards();
    return { id: c.id, name: c.name, type: c.type };
  })()`);
  await sleep(120);
  return r;
}
const rectOn = async () => { await ev(`if (!VESApp.state.rectMode) VESApp.toggleRect(); VESApp.state.rectMode`); };
async function traceRect(a, b) {
  let landed = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await clearStage();
    await tryEv('VESApp.fitToView(VESApp.AP()); 1'); await sleep(280);
    await warmPointer();
    await clickPdf(a[0], a[1], { wait: 170 });
    landed = await tryEv('(() => { const d = VESApp.state.draft; return (d && d.points && d.points.length) ? [d.points[0].x, d.points[0].y] : null; })()');
    if (Array.isArray(landed) && Math.abs(landed[0] - a[0]) <= 1.5 && Math.abs(landed[1] - a[1]) <= 1.5) break;
    await tryEv('VESApp.state.draft = null; VESApp.drawOverlays(); 1');
    await sleep(160);
  }
  await clickPdf(b[0], b[1], { wait: 440 });
  return landed;
}
// draw one region with the pointer (probe-b2b-regions idiom): arm the Section tool, click each
// corner, close on the first corner, name it in the app's own prompt.
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

const FIXQ = await tryEv(`(async () => { VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); await new Promise(r=>setTimeout(r,1000));
  if (VESApp.state.snap) VESApp.toggleSnap();
  return { conditions: VESApp.state.conditions.length, measurements: VESApp.state.measurements.length }; })()`);
if (FIXQ.error) { console.error('HARNESS FAIL: the fixture did not load — ' + FIXQ.error); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
await clearStage();
console.log('# fixture loaded: ' + JSON.stringify(FIXQ) + ' (three-sheet: 26 conditions, 29 measurements)\n');

/* ════════ Q2-a · Alt+click a card's eye = Solo — only that condition draws, the chip counts the rest ════════ */
let SOLO_ID = 1;   // "SSMR — field area" — measured on two sheets, present in the rail from boot
if (want('a')) {
  await goSheet(1);
  const before = await tryEv(`(() => ({ hidden: VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0, n: VESApp.state.conditions.length }))()`);
  const eyeBox = await ev(`(() => { const el = document.querySelector('#cards .card[data-cid="${SOLO_ID}"] .card-eye'); if (!el) return null;
    const b = el.getBoundingClientRect(); return { sx: b.left + b.width/2, sy: b.top + b.height/2 }; })()`);
  if (eyeBox) await clickScreen(eyeBox.sx, eyeBox.sy, { modifiers: 1, wait: 260 });   // Alt (modifiers bit 1)
  const r = await tryEv(`(() => {
    const hc = VESApp.state.hiddenConds;
    return { eyeFound: true, hiddenSize: hc ? hc.size : 0, soloVisible: !hc || !hc.has(${SOLO_ID}),
      allOthersHidden: VESApp.state.conditions.filter(c => c.id !== ${SOLO_ID}).every(c => hc && hc.has(c.id)),
      chip: window.__hiddenChip(), journal: window.__jtop(1), soloCard: window.__card(${SOLO_ID}) }; })()`);
  const wantHidden = (before.n || 26) - 1;
  const ok = !!eyeBox && !r.error && r.hiddenSize === wantHidden && r.soloVisible === true && r.allOthersHidden === true
    && r.chip && r.chip.hidden === false && new RegExp('^' + wantHidden + ' hidden$').test(r.chip.text || '')
    && /solo/i.test(String((r.journal || [])[0] || ''))
    && /SSMR/i.test(String((r.journal || [])[0] || ''));
  check(`Q2-a Alt+click the eye on condition #${SOLO_ID}'s card is Solo — only it stays visible (${wantHidden} others hidden, matching the fixture's ${before.n || 26} conditions minus one), the "N hidden" chip reads "${wantHidden} hidden", and the journal's top entry names the solo`,
    ok, { before, eyeFound: !!eyeBox, after: r, wantHidden });
}

/* ════════ Q2-b · Show all (button, then Shift+H) — chip gone, everything drawn, ONE undo step each way ════════ */
if (want('b')) {
  const beforeBtn = await tryEv(`(() => VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0)()`);
  const clickedShowAll = await clickSel('#btnShowAll', { wait: 260 });
  const afterBtn = await tryEv(`(() => ({ hidden: VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0, chip: window.__hiddenChip(), label: window.__jtop(1)[0] }))()`);
  await ctrlZ();
  const afterUndoBtn = await tryEv(`(() => VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0)()`);
  await ctrlY();
  const afterRedoBtn = await tryEv(`(() => VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0)()`);
  // fresh nonzero hidden set through a DIFFERENT gesture, then Shift+H
  await ctrlZ();   // back to the solo(1) state so there is something real to hide-measured over
  const preMeasured = await clickSel('#btnHideMeasured', { wait: 260 });
  const beforeShiftH = await tryEv(`(() => VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0)()`);
  await key('h', 'KeyH', 72, 8);   // Shift+H (modifiers bit 8)
  const afterShiftH = await tryEv(`(() => ({ hidden: VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0, chip: window.__hiddenChip(), label: window.__jtop(1)[0] }))()`);
  await ctrlZ();
  const afterUndoShiftH = await tryEv(`(() => VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0)()`);
  const ok = clickedShowAll === true && beforeBtn > 0 && afterBtn.hidden === 0 && afterBtn.chip && afterBtn.chip.hidden === true
    && /^show all$/i.test(String(afterBtn.label || '')) && afterUndoBtn === beforeBtn && afterRedoBtn === 0
    && preMeasured === true && beforeShiftH > 0
    && afterShiftH.hidden === 0 && afterShiftH.chip && afterShiftH.chip.hidden === true && /^show all$/i.test(String(afterShiftH.label || ''))
    && afterUndoShiftH === beforeShiftH;
  check('Q2-b Show all (the strip button, then Shift+H from a different hidden set) each clear every hidden condition in one gesture — the "N hidden" chip disappears, the journal names it "show all", and ONE Ctrl+Z restores the whole prior hidden set (not a partial one) either way',
    ok, { button: { before: beforeBtn, after: afterBtn, afterUndo: afterUndoBtn, afterRedo: afterRedoBtn },
      shiftH: { before: beforeShiftH, after: afterShiftH, afterUndo: afterUndoShiftH } });
}

/* ════════ Q2-c · a hidden condition is unpickable at its own coordinates; its qty is unchanged ════════ */
let PEEK = null;
if (want('c')) {
  await tryEv(`VESApp.state.hiddenConds = new Set(); VESApp.renderCards(); VESApp.drawOverlays(); 1`);   // clean slate — this row is not testing Q2-a/b again
  await goSheet(3);
  PEEK = await addCond('Peek probe (Q2c)', 'area', 5);
  await rectOn(); await warmPointer();
  await traceRect([160, 160], [340, 300]);   // clear of the fixture's own geometry on sheet 3 (x520-1300, y587-940 per the fixture README)
  const before = await tryEv(`(() => ({ card: window.__card(${PEEK.id}), roll: window.__roll(${PEEK.id}),
    mid: (VESApp.state.measurements.find(m => m.conditionId === ${PEEK.id}) || {}).id }))()`);
  await ev(`VESApp.setTool('select'); 1`); await sleep(150);
  const mid = [(160 + 340) / 2, (160 + 300) / 2];
  await clickPdf(mid[0], mid[1], { wait: 200 });
  const pickedBefore = await tryEv('VESApp.state.selectedId');
  await ev(`VESApp.state.selectedId = null; VESApp.drawOverlays(); 1`);
  await ev(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${PEEK.id}); VESApp.toggleCondHidden(c); return 1; })()`);
  await sleep(200);
  await clickPdf(mid[0], mid[1], { wait: 200 });
  const r = await tryEv(`(() => ({ selectedId: VESApp.state.selectedId, card: window.__card(${PEEK.id}), roll: window.__roll(${PEEK.id}),
    isHidden: !!(VESApp.state.hiddenConds && VESApp.state.hiddenConds.has(${PEEK.id})) }))()`);
  // pickedBefore/r.selectedId are MEASUREMENT ids (state.selectedId), never the condition id — the
  // proof is the same click landing on the same measurement id before hiding and on NOTHING after.
  const ok = !!before && !before.error && before.mid != null && pickedBefore === before.mid
    && !!r && !r.error && r.isHidden === true && r.selectedId == null && r.selectedId !== before.mid
    && r.card && r.card.qty === before.card.qty
    && r.roll && before.roll && Math.abs(r.roll.quantity - before.roll.quantity) < 1e-9;
  check('Q2-c a hidden condition\'s own shape is unpickable at its own plan coordinates (the same click that selected its measurement before hiding selects nothing after) while its card quantity and its rollup are byte-for-byte the same as before it was hidden',
    ok, { pickedBefore, measurementId: before && before.mid, after: r, qtyBefore: before && before.card, qtyAfter: r && r.card });
}

/* ════════ Q2-d · the takeoff print does not know or care what is hidden ════════ */
if (want('d')) {
  await loadFixture();
  const rNone = await tryEv(`(async () => { VESApp.state.hiddenConds = new Set(); VESApp.renderCards(); VESApp.drawOverlays();
    await VESApp.printTakeoff({ sheets: 'all' }); await new Promise(r => setTimeout(r, 1400));
    return { html: (window.__pdSnap || document.getElementById('printDoc').innerHTML || '') }; })()`);
  const idsResp = await tryEv(`VESApp.state.conditions.slice(0, 6).map(c => c.id)`);
  const rSix = await tryEv(`(async () => { VESApp.state.hiddenConds = new Set(${JSON.stringify(idsResp)}); VESApp.renderCards(); VESApp.drawOverlays();
    await VESApp.printTakeoff({ sheets: 'all' }); await new Promise(r => setTimeout(r, 1400));
    return { html: (window.__pdSnap || document.getElementById('printDoc').innerHTML || '') }; })()`);
  await tryEv(`VESApp.state.hiddenConds = new Set(); VESApp.renderCards(); VESApp.drawOverlays(); 1`);
  const ok = !!rNone && !rNone.error && !!rSix && !rSix.error && idsResp && idsResp.length === 6
    && typeof rNone.html === 'string' && rNone.html.length > 200 && rNone.html === rSix.html;
  check('Q2-d the takeoff paper composed with 6 conditions hidden is byte-for-byte identical (rendered DOM) to the same paper with none hidden — hide is screen-only, and the print never consults hiddenConds',
    ok, { hiddenIds: idsResp, noneLen: rNone && rNone.html && rNone.html.length, sixLen: rSix && rSix.html && rSix.html.length,
      identical: rNone && rSix && rNone.html === rSix.html });
}

/* ════════ Q2-e · the region eye hides the outline+chip; the section and its subtotal never move ════════ */
if (want('e')) {
  await loadFixture();
  await goSheet(3);
  const REG = await drawRegion('Canopy (Q2e)', [[480, 560], [1340, 560], [1340, 970], [480, 970]]);
  const sec = (REG.secs || [])[0];
  const r0 = await tryEv(`(async () => {
    const inkBefore = window.__scanOverlaySec();
    return { inkBefore, secsBefore: window.__secs(), locsBefore: window.__locs(), grandBefore: window.__grand() }; })()`);
  const eyePt = sec ? await tryEv(`window.__eyePt(${sec.id})`) : null;
  if (eyePt && !eyePt.error) await clickScreen(eyePt.sx, eyePt.sy, { wait: 260 });
  const r1 = await tryEv(`(async () => {
    const inkAfter = window.__scanOverlaySec();
    const chipGone = !((VESApp.AP().__secChips || []).some(ch => ch.id === ${sec ? sec.id : -1}));
    return { inkAfter, chipGone, secsAfter: window.__secs(), locsAfter: window.__locs(), grandAfter: window.__grand(),
      hiddenRegions: VESApp.state.hiddenRegions ? Array.from(VESApp.state.hiddenRegions) : [], journal: window.__jtop(1) }; })()`);
  const ok = !!REG.ok && !!sec && !!eyePt && !eyePt.error
    && r0.inkBefore > 40 && r1.inkAfter === 0 && r1.chipGone === true
    && JSON.stringify(r1.secsAfter) === JSON.stringify(r0.secsBefore)   // R-5e/R-5h untouched: the region itself, not deleted
    && JSON.stringify(r1.locsAfter) === JSON.stringify(r0.locsBefore)   // no section/tagging moved
    && JSON.stringify(r1.grandAfter) === JSON.stringify(r0.grandBefore) // no subtotal/money moved
    && r1.hiddenRegions.indexOf(sec.id) >= 0
    && /hide region/i.test(String((r1.journal || [])[0] || ''));
  check('Q2-e clicking the eye on the "Canopy (Q2e)" region\'s own chip hides both the region\'s outline and its chip on the plan (ink scan drops to 0) while state.sections, every condition\'s location and the recap grand total do not move a pixel or a cent',
    ok, { region: sec, before: r0, after: r1 });
}

/* ════════ Q2-f · hide state (conditions + regions) survives save → reload ════════ */
if (want('f')) {
  const r = await tryEv(`(async () => {
    const c1 = VESApp.state.conditions.find(x => x.type !== 'count');
    if (c1) { VESApp.state.hiddenConds = VESApp.state.hiddenConds || new Set(); VESApp.state.hiddenConds.add(c1.id); }
    const before = { hidden: Array.from(VESApp.state.hiddenConds || []), hiddenRegions: Array.from(VESApp.state.hiddenRegions || []) };
    const snap = VESApp.snapshot();
    const json = JSON.stringify(snap);
    VESApp.loadFromData(JSON.parse(json));
    await new Promise(r => setTimeout(r, 1000));
    const after = { hidden: Array.from(VESApp.state.hiddenConds || []), hiddenRegions: Array.from(VESApp.state.hiddenRegions || []) };
    return { before, after, savedHiddenRegions: snap.viz && snap.viz.hiddenRegions }; })()`);
  const setEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.slice().sort().join(',') === b.slice().sort().join(',');
  const ok = !!r && !r.error && r.before.hidden.length > 0 && setEq(r.before.hidden, r.after.hidden)
    && setEq(r.before.hiddenRegions, r.after.hiddenRegions) && Array.isArray(r.savedHiddenRegions);
  check('Q2-f both hidden sets — conditions and regions — round-trip through snapshot() → loadFromData() verbatim; hiddenRegions rides the viz blob beside hiddenConds',
    ok, r);
  await tryEv(`VESApp.state.hiddenConds = new Set(); VESApp.state.hiddenRegions = new Set(); VESApp.renderCards(); VESApp.drawOverlays(); 1`);
}

/* ════════ Q2-g · H with nothing armed says why; H with an armed condition toggles it, journaled ════════ */
if (want('g')) {
  await loadFixture();
  await ev(`VESApp.setTool('select'); document.activeElement && document.activeElement.blur(); document.getElementById('toast').textContent = ''; 1`);
  await sleep(150);
  const disarmed = await tryEv(`(() => { VESApp.state.activeCond = null; return 1; })()`);
  await key('h', 'KeyH', 72, 0);
  const nothingArmed = await tryEv(`({ toast: window.__toast(), hidden: VESApp.state.hiddenConds ? VESApp.state.hiddenConds.size : 0 })`);
  const target = await tryEv(`(() => { const c = VESApp.state.conditions[0]; VESApp.activateCondition(c); return c.id; })()`);
  await sleep(150);
  const beforeArmed = await tryEv(`!!(VESApp.state.hiddenConds && VESApp.state.hiddenConds.has(${target}))`);
  await key('h', 'KeyH', 72, 0);
  const afterArmed = await tryEv(`({ hid: !!(VESApp.state.hiddenConds && VESApp.state.hiddenConds.has(${target})), label: window.__jtop(1)[0] })`);
  const ok = !!nothingArmed && !nothingArmed.error && /h/i.test(nothingArmed.toast || '') && /arm/i.test(nothingArmed.toast || '')
    && nothingArmed.hidden === 0
    && beforeArmed === false && afterArmed.hid === true && /hide/i.test(String(afterArmed.label || ''));
  check('Q2-g H with nothing armed changes nothing and the toast says why (names H and arming); H with a condition armed hides exactly that one, journaled the same as the eye',
    ok, { nothingArmed, target, beforeArmed, afterArmed });
  await tryEv(`VESApp.state.hiddenConds = new Set(); VESApp.renderCards(); VESApp.drawOverlays(); 1`);
}

/* ════════ Q2-h · the money gates and the batches before this one ════════ */
if (NOSUB) {
  // Orchestrator (Q2 landing): NEUTRAL under --no-subgates — the landing sweep and CI run every child gate as its own step;
  // a red-by-flag row reads like a product failure (the B5-6 precedent).
  check('Q2-h child gates not run here (--no-subgates); each runs as its own step', true,
    { skipped: '--no-subgates was passed; the children run separately' });
} else if (want('h')) {
  const sub = [];
  const run = (label, cmd, a) => { const t0 = Date.now();
    const r = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
    const out = String(r.stdout || '') + String(r.stderr || '');
    const p = (out.match(/^PASS /gm) || []).length, f = (out.match(/^FAIL /gm) || []).length;
    sub.push({ label, code: r.status, pass: p, fail: f, green: /G0 GREEN/.test(out) || /ALL GREEN/.test(out), tail: out.trim().split('\n').slice(-2).join(' | ').slice(0, 200) });
    return r.status === 0; };
  const okG0 = run('g0', 'node', [join(ROOT, 'gate', 'g0.mjs'), 'check', join(ROOT, 'src', 'VES_PM.html')]);
  const okFix = run('probe-b0-fixture', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b0-fixture.mjs'),
    join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const demo = join(ROOT, 'release', 'demo', 'demo-flat-roof.json');
  const okPitch = run('probe-b1-pitch', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b1-pitch.mjs'), join(ROOT, 'src', 'VES_PM.html'), demo, ROOT, FIX]);
  // A skipped trailing subgates row reports itself as FAIL in that probe's own exit summary
  // (declared, not silent) for every one of these EXCEPT probe-b5-words, whose own NOSUB branch
  // is neutral ("each runs as its own CI step") — the same split probe-b5-words' own B5-6 row
  // documents verbatim. So --no-subgates is safe ONLY on the b5-words call; the rest run FULL,
  // exactly the chain probe-b5-words' own B5-6 row already runs in CI.
  const okB2a = run('probe-b2a-sections', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b2a-sections.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB2b = run('probe-b2b-regions', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b2b-regions.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB3 = run('probe-b3-colors', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b3-colors.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB4 = run('probe-b4-print', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b4-print.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT]);
  const okB5 = run('probe-b5-words', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b5-words.mjs'), join(ROOT, 'src', 'VES_PM.html'), join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT, '--no-subgates']);
  const okB6f = run('probe-b6f', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b6f.mjs'), join(ROOT, 'src', 'VES_PM.html'), FIX, ROOT]);
  const okDeduct = run('probe-deduct', 'node', [join(ROOT, 'tools', 'sweep', 'probe-deduct.mjs'), join(ROOT, 'src', 'VES_PM.html'), FIX, ROOT]);
  const allOk = okG0 && okFix && okPitch && okB2a && okB2b && okB3 && okB4 && okB5 && okB6f && okDeduct;
  check('Q2-h G0 4/4 · probe-b0-fixture 7/7 · b1-pitch · b2a-sections · b2b-regions · b3-colors · b4-print · b5-words · b6f · deduct — hide/solo moves no money', allOk, sub);
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'RED') + ' — ' + pass + ' pass, ' + fail + ' fail, ' + rows.length + ' rows');
try { c.close(); } catch (_) {}
try { chrome.kill('SIGKILL'); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
