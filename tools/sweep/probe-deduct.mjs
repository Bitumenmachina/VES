/* Batch Q1 — DEDUCTIONS (charter .scratch/charter-q1.md, rulings Q1-1…Q1-6).
 * One row per ruling. Reads RENDERED output — DOM text, exported blobs, the composed
 * takeoff paper, the saved file's own bytes — and traces with a REAL POINTER, because a
 * deduct is a pointer gesture and the picker that follows it is a pointer target.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-deduct.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet" "$PWD" [oldHtml] [only]
 *
 * `oldHtml` is the 2.0.0 release bytes (git show d7f683e:src/VES_PM.html). Q1-g reads them for
 * the version-6 refusal and for the byte-identical version-5 save; without them that row states
 * what it could not read rather than passing on half the evidence.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARGV = process.argv.slice(2).filter((a) => a !== '--write-golden');
const WRITE_GOLDEN = process.argv.indexOf('--write-golden') >= 0;   // a deliberate hand-run gesture, never automatic
const [VES, FIX, ROOT, OLD_IN, ONLY] = ARGV;
if (!VES || !FIX || !ROOT) { console.error('usage: probe-deduct.mjs <VES_PM.html> <fixtureDir> <root> [oldHtml] [only]'); process.exit(2); }
const OLD = (OLD_IN && existsSync(OLD_IN)) ? OLD_IN : null;
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
const prof = mkdtempSync(join(tmpdir(), 'ves-q1-'));
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

/* ---------- real pointer (probe-b6f / probe-b2b-regions idiom) ---------- */
/* The EXACT inverse of the app's own `evtToPdf` (src :5798): it takes `clientX - rect.left`
   straight into `convertToPdfPoint`, with no rect/viewport ratio in it. The older probes scale by
   r.width / viewport.width, which agrees only while the overlay canvas is laid out at exactly its
   viewport size — open the drawer and the canvas is CSS-clamped narrower than its viewport, the
   ratio stops being 1, and a traced 80-unit box comes back 94 units wide. Same read the app makes,
   or the gate is measuring the probe. */
const screenPt = (x, y) => ev(`(() => { const p = VESApp.AP(); const [vx, vy] = p.viewport.convertToViewportPoint(${x}, ${y});
  const r = p.els.overlay.getBoundingClientRect();
  return { sx: r.left + vx, sy: r.top + vy }; })()`);
async function mouse(type, sx, sy, clickCount = 1) {
  await c.send('Input.dispatchMouseEvent', { type, x: Math.round(sx), y: Math.round(sy), button: 'left', buttons: type === 'mouseMoved' ? 0 : 1, clickCount });
}
async function clickScreen(sx, sy, { clickCount = 1, wait = 130 } = {}) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(sx), y: Math.round(sy), button: 'none', buttons: 0 });
  await sleep(40);
  for (const t of ['mousePressed', 'mouseReleased']) await mouse(t, sx, sy, clickCount);
  await sleep(wait);
}
/* The stage moves under the pointer. The left rack shows its labels on hover and hides them
   otherwise, so #main's left edge walks 13 px in and out while the pointer travels — and the older
   probes' idiom (compute a screen point, move there, move there AGAIN, then press 40 ms later)
   presses after that walk, not before it. Measured on this build: a corner asked for at pdf x=700
   was stored at 671.2, every run, while a direct read of the same screen coordinate mapped to
   700.25. So: move, let it settle, re-read where the target IS, and press WITHOUT moving again. */
async function clickPdf(x, y, opts = {}) {
  let a = await screenPt(x, y);
  for (let i = 0; i < 6; i++) {
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 });
    await sleep(140);
    const b = await screenPt(x, y);
    if (Math.abs(Math.round(b.sx) - Math.round(a.sx)) < 1 && Math.abs(Math.round(b.sy) - Math.round(a.sy)) < 1) break;
    a = b;
  }
  for (const t of ['mousePressed', 'mouseReleased']) await mouse(t, a.sx, a.sy, opts.clickCount || 1);
  await sleep(opts.wait == null ? 130 : opts.wait);
}
async function warmPointer() {
  for (let i = 0; i < 3; i++) { const a = await screenPt(1296, 864);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 }); await sleep(160); }
  await sleep(180);
}
async function clickSel(sel, wait = 170) {
  const r = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
    const b = e.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0)) return null;
    return { sx: b.left + b.width / 2, sy: b.top + b.height / 2 }; })()`);
  if (!r) return false;
  await clickScreen(r.sx, r.sy, { wait }); return true;
}
async function key(k, code, vk, mods = 0) {
  for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
  await sleep(170);
}
const ctrlZ = () => key('z', 'KeyZ', 90, 2);
async function hoverToolbar() {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 12, button: 'none', buttons: 0 });
  await sleep(360);
}

/* ---------- boot ---------- */
const pdfB64 = readFileSync(join(FIX, 'plan.pdf')).toString('base64');
const takeoffText = readFileSync(join(FIX, 'takeoff.v3.json'), 'utf8');
const golden = JSON.parse(readFileSync(join(FIX, 'golden.cents.json'), 'utf8'));
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
  window.__ms = () => VESApp.state.measurements.map(m => ({ id: m.id, cid: m.conditionId, type: m.type, page: m.page, value: m.value, sign: m.sign === undefined ? undefined : m.sign, pts: (m.points||[]).length }));
  window.__roll = (cid) => { const r = VESCore.rollup(VESApp.state.conditions, VESApp.state.measurements).find(x => x.id === cid); return r ? JSON.parse(JSON.stringify(r)) : null; };
  window.__card = (cid) => { const el = document.querySelector('#cards .card[data-cid="' + cid + '"]'); if (!el) return null;
    const q = el.querySelector('.qty'); return { qty: q ? (q.textContent||'').replace(/\\s+/g,' ').trim() : null, all: (el.textContent||'').replace(/\\s+/g,' ').trim().slice(0,400) }; };
  window.__csv = async (fn) => { window.__blobs = []; try { VESApp[fn](); } catch (e) { return { error: String(e) }; }
    await new Promise(r => setTimeout(r, 300)); const b = window.__blobs.slice(-1)[0]; return b ? { name: b.name, text: b.text } : null; };
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
const clearStage = async () => { await tryEv(`try { VESApp.toggleRail(false, { persist: false }); } catch(e){} try { VESApp.collapseDrawer(); } catch(e){} try { VESApp.showEstimate(false); } catch(e){} 1`); await sleep(120); };
const loadFixture = async () => { await ev(`VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); 1`); await sleep(1100);
  await ev(`if (VESApp.state.snap) VESApp.toggleSnap(); 1`); };
const goSheet = async (n) => { await tryEv(`(async () => { await VESApp.showPane(VESApp.state.panes[0], ${n}, { fit: true }); await new Promise(r=>setTimeout(r,340)); VESApp.fitToView(VESApp.AP()); await new Promise(r=>setTimeout(r,320)); return VESApp.AP().pageNum; })()`); await clearStage(); await warmPointer(); };

/* Add a free-standing condition through the app's own add form (the b2b idiom), arm it, and
   put the sheet back under the pointer. Returns its id. */
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
    try { VESApp.toggleRail(false, { persist: false }); } catch (e) {}
    VESApp.renderCards();
    return { id: c.id, name: c.name, type: c.type };
  })()`);
  await sleep(120);
  return r;
}
const armCond = async (cid) => { await ev(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${cid}); VESApp.activateCondition(c); return 1; })()`); await sleep(150); };
const rectOn = async () => { await ev(`if (!VESApp.state.rectMode) VESApp.toggleRect(); VESApp.state.rectMode`); };
/* Two opposite corners, the way the Rect tool takes them.
   Two things move the stage under a dispatched pointer that a hand never has to think about:
   `addMeasurement` opens the drawer on every add (it is meant to — the estimator should see the
   consequence) and the sheet re-fits smaller; and the left rack shows its labels on hover, so
   #main's left edge walks ~13 px in and out while the pointer travels. Measured on this build: a
   first corner asked for at pdf x=700 was stored at 671.2 while a direct read of the same screen
   coordinate mapped to 700.25 — the layout moved between the read and the press. So the probe
   AIMS: put the stage back, click the first corner, read where it actually landed, and if the
   sheet moved, drop the draft (no journal entry, no measurement) and aim again. Two passes is
   always enough, because by then the pointer has been over the stage long enough for the rack to
   settle. The second corner is checked the same way and reported in the row's detail. */
async function traceRect(a, b) {
  let landed = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await clearStage();
    await tryEv('VESApp.fitToView(VESApp.AP()); 1'); await sleep(280);
    await warmPointer();
    await clickPdf(a[0], a[1], { wait: 170 });
    landed = await tryEv('(() => { const d = VESApp.state.draft; return (d && d.points && d.points.length) ? [d.points[0].x, d.points[0].y] : null; })()');
    if (Array.isArray(landed) && Math.abs(landed[0] - a[0]) <= 1.5 && Math.abs(landed[1] - a[1]) <= 1.5) break;
    await tryEv('VESApp.state.draft = null; VESApp.drawOverlays(); 1');   // not clearDraft(): that is a journal entry a hand never made
    await sleep(160);
  }
  await clickPdf(b[0], b[1], { wait: 440 });
  return landed;
}

/* The Deduct toggle, pressed the way a hand presses it: the rack collapses to a strip while a
   sheet is live, so the pointer has to open it first. */
async function armDeduct() {
  await hoverToolbar();
  const clicked = await clickSel('#btnDeduct', 260);
  return { clicked, armed: await tryEv('!!VESApp.state.deductArmed'), msg: await tryEv('window.__tool()') };
}
/* The handoff picker at the pointer: choose a linear condition by name, or "none". */
async function pickHandoff(nameOrNone) {
  const seen = await tryEv(`(() => { const p = document.getElementById('deductPick');
    if (!p || p.hidden) return null;
    const b = p.getBoundingClientRect();
    return { open: b.width > 0 && b.height > 0, text: (p.textContent||'').replace(/\\s+/g,' ').trim().slice(0,400),
      opts: [...p.querySelectorAll('button')].map(x => (x.textContent||'').trim()) }; })()`);
  if (!seen || !seen.open) return { picker: seen, clicked: false };
  const sel = nameOrNone === null ? '#deductPick button[data-cid=""]'
    : `#deductPick button[data-cid="${nameOrNone}"]`;
  const clicked = await clickSel(sel, 420);
  return { picker: seen, clicked };
}

const FIXQ = await tryEv(`(async () => { VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); await new Promise(r=>setTimeout(r,1000));
  if (VESApp.state.snap) VESApp.toggleSnap();
  return { conditions: VESApp.state.conditions.length, measurements: VESApp.state.measurements.length, grand: window.__grand() }; })()`);
if (FIXQ.error) { console.error('HARNESS FAIL: the fixture did not load — ' + FIXQ.error); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
console.log('# fixture loaded: ' + JSON.stringify(FIXQ));
console.log('# 2.0.0 bytes for Q1-g: ' + (OLD || 'NOT SUPPLIED'));
console.log('# scale: 0.125 ft/unit on every sheet — 400 units = 50 ft\n');

/* The pointer dispatches at integer SCREEN pixels, so a traced rectangle lands within a few
   tenths of a percent of the coordinates asked for — never exactly on them. Every row below
   therefore asserts the ARITHMETIC against the figures the app itself measured, and only sanity-
   checks the absolute size against what 400 × 200 units at 0.125 ft/unit should be. */
const nearPct = (got, want, pct) => typeof got === 'number' && isFinite(got) && Math.abs(got - want) <= Math.abs(want) * pct;
const near = (a, b, eps) => typeof a === 'number' && isFinite(a) && Math.abs(a - b) <= (eps == null ? 1e-6 : eps);

/* ════════ Q1-a · a deduct traced inside a field area subtracts its SF, everywhere ════════ */
let A = null, A_NET = null;
if (want('a')) {
  await loadFixture();
  await goSheet(3);
  A = await addCond('Field probe (Q1)', 'area', 4);
  await rectOn();
  await warmPointer();
  await traceRect([600, 600], [1000, 800]);          // 400 x 200 units = 50 x 25 ft = 1,250 SF
  const gross = await tryEv(`window.__roll(${A.id})`);
  const arm = await armDeduct();
  await warmPointer();
  await traceRect([700, 650], [780, 730]);           // 80 x 80 units = 10 x 10 ft = 100 SF
  const picked = await pickHandoff(null);            // "none" — the deduct alone
  await sleep(300);
  const r = await tryEv(`(async () => {
    VESApp.renderCards(); await new Promise(r => setTimeout(r, 260));
    const roll = window.__roll(${A.id});
    const rowsG = VESApp.estimateRows().filter(x => x.condId === ${A.id} || x.srcCid === ${A.id});
    VESApp.showEstimate(true); await new Promise(r => setTimeout(r, 420));
    const gridTxt = [...document.querySelectorAll('#estgridBody tr')].map(t => (t.textContent||'').replace(/\\s+/g,' ').trim())
      .filter(t => t.indexOf('Field probe (Q1)') >= 0);
    VESApp.showEstimate(false); await new Promise(r => setTimeout(r, 200));
    VESApp.setRecapTab('estimate'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 300));
    const recapTxt = [...document.querySelectorAll('#recapBody tr')].map(t => (t.textContent||'').replace(/\\s+/g,' ').trim())
      .filter(t => t.indexOf('Field probe (Q1)') >= 0);
    return { roll, card: window.__card(${A.id}), ms: window.__ms().filter(m => m.cid === ${A.id}),
      rowsG: rowsG.map(x => ({ qty: x.qty, deducts: x.deducts, deductQty: x.deductQty, netHeld: x.netHeld })),
      gridTxt, recapTxt, armedAfter: !!VESApp.state.deductArmed, journal: window.__jtop(1) };
  })()`);
  const ms = (r && r.ms) || [];
  const ded = ms.filter((m) => m.sign === -1);
  const add = ms.filter((m) => m.sign !== -1);
  const gVal = add.length === 1 ? add[0].value : null;
  const dVal = ded.length === 1 ? ded[0].value : null;
  const netVal = (gVal != null && dVal != null) ? gVal - dVal : null;
  A_NET = netVal;
  const cardTxt = String((r && r.card && r.card.qty) || '');
  const ok = !!r && !r.error
    && arm.clicked === true && arm.armed === true
    && nearPct(gross && gross.quantity, 1250, 0.02)
    && ms.length === 2 && ded.length === 1 && nearPct(dVal, 100, 0.08) && ded[0].type === 'area'
    && near(r.roll && r.roll.quantity, netVal) && near(r.roll && r.roll.gross, gVal)
    && r.roll && r.roll.deducts === 1 && r.roll.netHeld === false
    && cardTxt.indexOf(netVal.toFixed(1)) >= 0
    && cardTxt.indexOf('(\u2212' + dVal.toFixed(1) + ')') >= 0
    && (r.rowsG || []).some((x) => near(x.qty, netVal) && x.deducts === 1)
    && (r.gridTxt || []).some((t) => /1 deduct/.test(t))
    && (r.recapTxt || []).some((t) => /1 deduct/.test(t))
    && r.armedAfter === false;
  check('Q1-a a rectangle traced with the Deduct toggle armed, inside a 1,250 SF field area on the same condition, subtracts its 100 SF: the rollup reads 1,150 net against a 1,250 gross, the card reads the net with "(−100)" beside it, the Estimate grid row and the recap line read the net and carry a "1 deduct" badge, and the toggle disarms itself after the one trace',
    ok, { arm, traced: { gross: gVal, deduct: dVal, net: netVal }, grossRoll: gross && { q: gross.quantity, gross: gross.gross, deducts: gross.deducts }, picked, after: r });
}

/* ════════ Q1-b · the two CSVs carry ONE signed row per deduct ════════ */
if (want('b') && A) {
  const r = await tryEv(`(async () => {
    const audit = await window.__csv('exportAuditCSV');
    const roll = await window.__csv('exportRollupCSV');
    return { audit: audit && audit.text, roll: roll && roll.text }; })()`);
  const auditLines = String((r && r.audit) || '').split(/\r?\n/);
  const auditDed = auditLines.filter((l) => /Field probe \(Q1\)/.test(l) && /Deduct/.test(l));
  const auditAll = auditLines.filter((l) => /Field probe \(Q1\)/.test(l));
  // sum the Quantity column (index 8) over this condition's measurement rows
  const cells = (l) => (l.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g) || []).map((x) => x.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
  const auditSum = auditAll.reduce((a, l) => a + (parseFloat(cells(l)[8]) || 0), 0);
  const rollLines = String((r && r.roll) || '').split(/\r?\n/).filter((l) => /Field probe \(Q1\)/.test(l));
  const rollDed = rollLines.filter((l) => /(^|,)"?Deduct"?,/.test(l) || /,Deduct,/.test(l));
  const rollSum = rollLines.reduce((a, l) => a + (parseFloat(cells(l)[9]) || 0), 0);
  const ok = auditDed.length === 1 && /,-\d/.test(auditDed[0])
    && A_NET != null && Math.abs(auditSum - A_NET) < 0.001
    && rollDed.length === 1 && /,-\d/.test(rollDed[0])
    && Math.abs(rollSum - A_NET) < 0.001;
  check('Q1-b the audit CSV and the condition-rollup CSV each carry exactly ONE row for the deduct, typed "Deduct", with a NEGATIVE quantity — so a consumer summing the quantity column over that condition reads the 1,150 net, not the 1,250 gross',
    ok, { auditDeductRows: auditDed, auditRowsForCond: auditAll.length, auditSum, rollDeductRows: rollDed, rollSum, netFromTheApp: A_NET });
}

/* ════════ Q1-c · deductions past the gross hold at 0, out loud, on every face ════════ */
let C = null;
if (want('c')) {
  await clearStage(); await goSheet(3);
  C = await addCond('Small bay (Q1c)', 'area', 3);
  await rectOn(); await warmPointer();
  await traceRect([1100, 600], [1200, 700]);        // 100 x 100 units = 12.5 x 12.5 ft = 156.25 SF
  for (let i = 0; i < 2; i++) {
    const a = await armDeduct();
    if (!a.armed) break;
    await warmPointer();
    await traceRect([1105 + i, 605], [1205 + i, 705]);
    await pickHandoff(null);
    await sleep(240);
  }
  const r = await tryEv(`(async () => {
    VESApp.renderCards(); await new Promise(r => setTimeout(r, 300));
    const roll = window.__roll(${C.id});
    VESApp.showEstimate(true); await new Promise(r => setTimeout(r, 420));
    const gridTxt = [...document.querySelectorAll('#estgridBody tr')].map(t => (t.textContent||'').replace(/\\s+/g,' ').trim())
      .filter(t => t.indexOf('Small bay (Q1c)') >= 0);
    VESApp.showEstimate(false); await new Promise(r => setTimeout(r, 200));
    const audit = await window.__csv('exportAuditCSV');
    VESApp.printTakeoff({ sheets: 'all' }); await new Promise(r => setTimeout(r, 1400));
    const paper = (window.__pdSnap || document.getElementById('printDoc').innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g,' ').replace(/\\s+/g,' ');
    return { roll, card: window.__card(${C.id}), gridTxt, audit: audit && audit.text, paper: paper.slice(0, 20000),
      ms: window.__ms().filter(m => m.cid === ${C.id}) };
  })()`);
  const HELD = /deductions exceed the area\s*[—-]\s*held at 0/i;
  const paperC = String((r && r.paper) || '');
  const secIdx = paperC.indexOf('Small bay (Q1c)');
  const ok = !!r && !r.error
    && r.roll && Math.abs(r.roll.quantity - 0) < 1e-9 && r.roll.netHeld === true && r.roll.deducts === 2
    && nearPct(r.roll.gross, 156.25, 0.04)
    && HELD.test(String(r.card && r.card.all))
    && (r.gridTxt || []).some((t) => HELD.test(t))
    && HELD.test(String(r.audit))
    && secIdx >= 0 && /Deduction/i.test(paperC) && HELD.test(paperC);
  check('Q1-c two deducts summing past the 156.25 SF gross hold the net at 0 and SAY so in the same words on all four faces — the card, the Estimate grid row, the audit CSV\'s warning block and the takeoff paper: "deductions exceed the area — held at 0"',
    ok, { roll: r && r.roll, card: r && r.card, gridTxt: r && r.gridTxt,
      auditHeld: HELD.test(String(r && r.audit)), paperHasCond: secIdx >= 0,
      paperHeld: HELD.test(paperC), paperDeductWord: /Deduction/i.test(paperC),
      paperCut: secIdx >= 0 ? paperC.slice(Math.max(0, secIdx - 120), secIdx + 320) : paperC.slice(0, 300) });
}

/* ════════ Q1-d · Deduct on a linear or a count condition is refused, out loud, and creates nothing ════════ */
if (want('d')) {
  await clearStage(); await goSheet(3);
  const L = await addCond('Edge probe (Q1d)', 'linear', 9);
  const before = await tryEv('VESApp.state.measurements.length');
  const aL = await armDeduct();
  const N = await addCond('Vent probe (Q1d)', 'count', 40);
  const aC = await armDeduct();
  const after = await tryEv(`({ n: VESApp.state.measurements.length, armed: !!VESApp.state.deductArmed, msg: window.__tool(), toast: window.__toast() })`);
  const spoken = (s) => /deduct/i.test(String(s || '')) && /(area|square feet|SF)/i.test(String(s || ''));
  const ok = aL.armed === false && aC.armed === false
    && spoken(aL.msg) && spoken(aC.msg)
    && /linear/i.test(String(aL.msg)) && /count/i.test(String(aC.msg))
    && after && after.n === before && after.armed === false;
  check('Q1-d arming Deduct while a LINEAR condition is armed, and again while a COUNT condition is armed, is refused each time with a reason that names the condition\'s own kind and says a deduct subtracts area — the toggle does not arm and no measurement is created',
    ok, { linear: aL, count: aC, measurementsBefore: before, after });
}

/* ════════ Q1-e · the perimeter handoff writes ONE linear sibling at the sheet's scale ════════ */
let E = null;
if (want('e')) {
  await clearStage(); await goSheet(3);
  E = await addCond('Curb probe (Q1e)', 'area', 5);
  const LIN = await tryEv(`(() => { const c = VESApp.state.conditions.find(x => x.type === 'linear' && /Eave drip/i.test(x.name))
      || VESApp.state.conditions.find(x => x.type === 'linear');
    return c ? { id: c.id, name: c.name, before: VESApp.state.measurements.filter(m => m.conditionId === c.id).length } : null; })()`);
  await rectOn(); await warmPointer();
  const arm = await armDeduct();
  await warmPointer();
  await traceRect([500, 850], [580, 930]);          // 80 x 80 units = 10 x 10 ft: 100 SF, 40 LF around
  const picked = await pickHandoff(LIN && LIN.id);
  await sleep(400);
  const r = await tryEv(`(() => {
    const mine = VESApp.state.measurements.filter(m => m.conditionId === ${LIN ? LIN.id : -1});
    const last = mine[mine.length - 1] || null;
    const d = VESApp.state.measurements.filter(m => m.conditionId === ${E.id} && m.sign === -1)[0] || null;
    let per = null;
    if (d) { const cal = VESApp.state.calibrations[d.page]; let t = 0;
      for (let i = 0; i < d.points.length; i++) { const a = d.points[i], b = d.points[(i + 1) % d.points.length]; t += Math.hypot(b.x - a.x, b.y - a.y); }
      per = t * cal.ftPerUnit; }
    return { linCount: mine.length, last: last && { type: last.type, value: last.value, pts: last.points.length, sign: last.sign === undefined ? 1 : last.sign, page: last.page },
      cutoutPerimeterFt: per, ded: window.__ms().filter(m => m.cid === ${E.id}), journal: window.__jtop(1),
      linRoll: window.__roll(${LIN ? LIN.id : -1}) }; })()`);
  const ok = !!r && !r.error && !!LIN && arm.armed === true
    && picked.picker && picked.picker.open === true
    && /none/i.test(String(picked.picker.text)) && new RegExp(LIN.name.slice(0, 10).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(String(picked.picker.text))
    && r.linCount === LIN.before + 1
    && r.last && r.last.type === 'linear' && r.last.sign === 1
    && near(r.last.value, r.cutoutPerimeterFt) && nearPct(r.cutoutPerimeterFt, 40, 0.08)
    && (r.ded || []).filter((m) => m.sign === -1).length === 1;
  check('Q1-e when the deduct closes, a picker opens at the pointer listing the job\'s LINEAR conditions and "none"; choosing one writes exactly ONE new linear measurement on that condition whose length is the cutout\'s perimeter at the sheet\'s scale (10 ft × 10 ft cutout → 40 LF), sign +1',
    ok, { linear: LIN, arm, picked, after: r });
}

/* ════════ Q1-f · deduct + handoff is ONE journal entry ════════ */
if (want('f') && E) {
  const before = await tryEv(`({ n: VESApp.state.measurements.length, j: window.__jtop(1), depth: VESApp.state.journal.undo.length })`);
  await ctrlZ();
  await sleep(420);
  const after = await tryEv(`({ n: VESApp.state.measurements.length, deducts: VESApp.state.measurements.filter(m => m.sign === -1).length,
    toast: window.__toast(), depth: VESApp.state.journal.undo.length })`);
  const label = String(((before && before.j) || [])[0] || '');
  const ok = !!before && !!after && /deduct/i.test(label) && /perimeter to/i.test(label)
    && after.n === before.n - 2 && after.depth === before.depth - 1;
  check('Q1-f a deduct and the perimeter it handed off are ONE journal entry named "deduct + perimeter to <condition>" — a single Ctrl+Z takes both measurements back and pops one entry, not two',
    ok, { before, after, label });
}

/* ════════ Q1-g · the file says 6 only when it has to, and 5 is byte-for-byte what 2.0.0 writes ════════ */
if (want('g')) {
  await loadFixture();
  const clean = await tryEv(`(() => { const s = VESApp.snapshot();
    return { version: s.version, anySign: VESApp.state.measurements.some(m => m.sign !== undefined),
      json: JSON.stringify({ ...s, savedAt: null, identity: null }) }; })()`);
  // one deduct, added through the core door, and the version moves
  const dirty = await tryEv(`(async () => {
    const c = VESApp.state.conditions.find(x => x.type === 'area' && VESApp.state.measurements.some(m => m.conditionId === x.id));
    const src = VESApp.state.measurements.find(m => m.conditionId === c.id && m.points && m.points.length > 2);
    VESApp.activateCondition(c); await new Promise(r => setTimeout(r, 200));
    const pts = src.points.map(p => ({ x: p.x, y: p.y }));
    VESApp.addMeasurement(c, pts, { sign: -1 });
    await new Promise(r => setTimeout(r, 300));
    const s = VESApp.snapshot();
    return { version: s.version, text: JSON.stringify(s) }; })()`);
  let oldRefusal = null, oldClean = null;
  if (OLD) {
    await ev(`window.__v6 = ${JSON.stringify((dirty && dirty.text) || '{}')}; window.__v5 = ${JSON.stringify((clean && clean.json) || '{}')}; 1`);
    const v6 = (dirty && dirty.text) || '{}';
    await boot(OLD);
    oldRefusal = await tryEv(`(() => { const d = JSON.parse(${JSON.stringify(v6)});
      const res = VESCore.normalizeSnapshot(d); return { ok: res.ok, error: res.error || null, ceiling: VESCore.TAKEOFF_VERSION }; })()`);
    oldClean = await tryEv(`(async () => { VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); await new Promise(r => setTimeout(r, 1000));
      const s = VESApp.snapshot(); return { version: s.version, json: JSON.stringify({ ...s, savedAt: null, identity: null }) }; })()`);
    await boot();
  }
  // Re-addressed at the Q3 landing (R-13d): Q2 (2.1.0-rc.2) put `viz.hiddenRegions` in the file beside
  // `viz.hidden`, so a 2.1 save of a deduct-free takeoff is 2.0.0's bytes PLUS that one empty key and
  // nothing else. The row asserts exactly that — byte identity minus the keys later batches declared —
  // rather than a byte identity Q2 made impossible. Any other difference, or a non-empty added key, is red.
  const ADDED_SINCE_2_0_0 = ['viz.hiddenRegions'];   // dotted paths into the snapshot
  const stripAdded = (json) => { try { const o = JSON.parse(json); const extra = {};
    for (const path of ADDED_SINCE_2_0_0) { const ks = path.split('.'); let h = o; for (let i = 0; i < ks.length - 1 && h; i++) h = h[ks[i]];
      const last = ks[ks.length - 1]; if (h && typeof h === 'object' && last in h) { extra[path] = h[last]; delete h[last]; } }
    return { json: JSON.stringify(o), extra }; } catch (_) { return { json: null, extra: null }; } };
  const cleanCmp = (clean && clean.json) ? stripAdded(clean.json) : { json: null, extra: null };
  const identical = !!(oldClean && cleanCmp.json && oldClean.json === cleanCmp.json
    && cleanCmp.extra && Object.keys(cleanCmp.extra).every((k) => Array.isArray(cleanCmp.extra[k]) && cleanCmp.extra[k].length === 0));
  const firstDiff = (a, b) => { if (!a || !b) return null; let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i >= a.length && i >= b.length ? null : { at: i, new: a.slice(Math.max(0, i - 60), i + 80), old: b.slice(Math.max(0, i - 60), i + 80) }; };
  const diff = identical ? null : firstDiff(cleanCmp.json, oldClean && oldClean.json);
  const ok = clean && clean.version === 5 && clean.anySign === false
    && dirty && dirty.version === 6
    && (!OLD || (oldRefusal && oldRefusal.ok === false && /version 6/.test(String(oldRefusal.error)) && identical));
  check('Q1-g TAKEOFF_VERSION is WRITTEN as 6 only when some measurement carries a sign — the fixture with no deduct still saves version 5 and its JSON is byte-for-byte what the 2.0.0 bytes write for the same state plus only the empty `viz.hiddenRegions` key Q2 added; a saved file with a deduct says 6 and the 2.0.0 bytes refuse it by name',
    ok, { cleanVersion: clean && clean.version, cleanHasSign: clean && clean.anySign, cleanBytes: clean && clean.json ? clean.json.length : null,
      dirtyVersion: dirty && dirty.version, old: OLD ? { refusal: oldRefusal, identicalMinusAddedKeys: identical, addedKeys: cleanCmp.extra, firstDiff: diff, oldVersion: oldClean && oldClean.version, oldBytes: oldClean && oldClean.json ? oldClean.json.length : null } : 'NOT SUPPLIED' });
}

/* ════════ Q1-h · the exact door takes a magnitude and the sign survives it ════════ */
if (want('h')) {
  await loadFixture(); await goSheet(3);
  const H = await addCond('Exact probe (Q1h)', 'area', 2);
  await rectOn(); await warmPointer();
  await traceRect([600, 600], [1000, 800]);
  await armDeduct();
  await warmPointer();
  await traceRect([700, 650], [780, 730]);
  await pickHandoff(null);
  await sleep(300);
  const r = await tryEv(`(async () => {
    const all = VESApp.state.measurements.filter(m => m.conditionId === ${H.id});
    const d = all.filter(m => m.sign === -1)[0];
    const g = all.filter(m => m.sign !== -1)[0];
    if (!d || !g) return { missing: { n: all.length } };
    const grossVal = g.value;
    const okSet = VESApp.setMeasurementExact(d.id, '160');
    await new Promise(r => setTimeout(r, 300));
    const neg = VESApp.setMeasurementExact(d.id, '-20');
    await new Promise(r => setTimeout(r, 200));
    return { okSet, neg, grossVal, value: d.value, sign: d.sign, exact: !!d.exact, roll: window.__roll(${H.id}), toast: window.__toast() }; })()`);
  const ok = !!r && !r.error && r.okSet === true && r.neg === false
    && Math.abs(r.value - 160) < 1e-9 && r.sign === -1
    && r.roll && near(r.roll.quantity, r.grossVal - 160);
  check('Q1-h typing 160 into a deduct\'s exact-quantity door keeps it a DEDUCT of 160 (the stored value is the positive magnitude, the sign is untouched, the rollup drops to 1,090) and a typed −20 is still refused',
    ok, r);
}

/* ════════ Q1-i · the v6 fixture loads and prices to its own golden ════════ */
if (want('i')) {
  const v6path = join(FIX, 'takeoff.v6.json');
  const gpath = join(FIX, 'golden.v6.cents.json');
  if (!existsSync(v6path) || (!existsSync(gpath) && !WRITE_GOLDEN)) {
    check('Q1-i fixtures/synthetic/three-sheet/takeoff.v6.json (the fixture plus two deducts and one perimeter handoff) loads clean and prices to golden.v6.cents.json', false,
      { takeoff_v6: existsSync(v6path), golden_v6: existsSync(gpath) });
  } else {
    const v6 = readFileSync(v6path, 'utf8');
    const r = await tryEv(`(async () => { VESApp.loadFromData(${v6}); await new Promise(r => setTimeout(r, 1200));
      const roll = VESCore.rollup(VESApp.state.conditions, VESApp.state.measurements);
      return { grand: window.__grand(), version: VESApp.snapshot().version,
        deducts: VESApp.state.measurements.filter(m => m.sign === -1).length,
        held: roll.filter(r => r.netHeld).length,
        qty: Object.fromEntries(roll.map(r => [r.id, Math.round(r.quantity * 1000)])) }; })()`);
  /* The two deducts in this file sit on a LIBRARY-backed condition, which is the one quantity the
     display never computes: `assemblyMeasured` hands it to the engine. Loading the same file with
     the cutouts taken out has to cost MORE — otherwise the cards would read the net while the
     assembly bought the gross, which is the exact shape of the defect this batch exists to close. */
  const gross = !want('i') ? null : await tryEv(`(async () => { const d = ${v6};
      d.measurements = d.measurements.filter(m => m.sign !== -1);
      VESApp.loadFromData(d); await new Promise(r => setTimeout(r, 1200));
      return window.__grand(); })()`);
    if (WRITE_GOLDEN) {
      const bytes = readFileSync(VES);
      const rec = {
        fixture: 'three-sheet', takeoff: 'takeoff.v6.json',
        note: 'Money is integer cents; quantities are integer thousandths of the displayed unit. Recorded by tools/sweep/probe-deduct.mjs --write-golden.',
        html: { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, build: await ev('VESApp.VES_BUILD') },
        library: { name: 'Roofing & Envelope \u2014 Coastal SE Georgia', fingerprint: '7e4e6a2a', seed: true },
        deducts: r.deducts, heldAtZero: r.held,
        recap: { costCents: r.grand.cost, sellCents: r.grand.sell },
        quantities: r.qty,
      };
      writeFileSync(gpath, JSON.stringify(rec, null, 2) + '\n');
      console.log('# WROTE ' + gpath);
    }
    const g6 = JSON.parse(readFileSync(gpath, 'utf8'));
    const qtyOk = !!r && !r.error && !!g6.quantities && Object.keys(g6.quantities).every((k) => g6.quantities[k] === (r.qty || {})[k]);
    const enginePaidNet = !!(gross && !gross.error && r && r.grand && gross.cost > r.grand.cost && gross.sell > r.grand.sell);
    const ok = !!r && !r.error && r.version === 6 && r.deducts === g6.deducts
      && r.grand && g6.recap && r.grand.cost === g6.recap.costCents && r.grand.sell === g6.recap.sellCents && qtyOk
      && enginePaidNet;
    check('Q1-i fixtures/synthetic/three-sheet/takeoff.v6.json (the fixture plus two deducts and one perimeter handoff) loads clean, re-saves as version 6, and prices to every cent and every thousandth of golden.v6.cents.json — and the same file with its two cutouts removed costs MORE, so the ENGINE (not just the display) was handed the net',
      ok, { got: r && { grand: r.grand, version: r.version, deducts: r.deducts, held: r.held },
        want: { grand: g6.recap && { cost: g6.recap.costCents, sell: g6.recap.sellCents }, deducts: g6.deducts },
        quantitiesMatch: qtyOk, sameFileWithTheCutoutsRemoved: gross, enginePaidNet });
  }
}

/* ════════ Q1-j · the v3 fixture still prices to its own golden — no deduct, no cent moved ════════ */
if (want('j')) {
  await loadFixture();
  const r = await tryEv(`(() => ({ grand: window.__grand(), deducts: VESApp.state.measurements.filter(m => m.sign !== undefined).length }))()`);
  const ok = !!r && !r.error && r.deducts === 0
    && r.grand.cost === golden.recap.costCents && r.grand.sell === golden.recap.sellCents;
  check('Q1-j the untouched v3 fixture still carries no signed measurement and still prices to golden.cents.json to the cent',
    ok, { got: r, want: { cost: golden.recap.costCents, sell: golden.recap.sellCents } });
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'RED') + ' — ' + pass + ' pass, ' + fail + ' fail, ' + rows.length + ' rows');
try { c.close(); } catch (_) {}
try { chrome.kill('SIGKILL'); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
