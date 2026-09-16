/* Batch Q4 — FRICTIONS + EXPORTS LIGHT TOUCH (charter .scratch/charter-q4.md). One row per item,
 * Q4-a..Q4-f cover Q4-1..Q4-6 (the checkpoint items); Q4-l is the G0 gate, run alone.
 * Real pointer for UI rows — harness pattern copied from probe-select.mjs / probe-hide.mjs
 * (boot, openPdf, loadFixture, clickPdf, keys, tryEv, check).
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-qol.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet" "$PWD" [--no-subgates] [only]
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
if (!VES || !FIX || !ROOT) { console.error('usage: probe-qol.mjs <VES_PM.html> <fixtureDir> <root> [--no-subgates] [only]'); process.exit(2); }
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
const port = 9800 + Math.floor(Math.random() * 90);
const prof = mkdtempSync(join(tmpdir(), 'ves-q4-'));
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

/* ---------- real pointer (probe-hide / probe-select idiom) ---------- */
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
  await sleep(200);
}
const ctrlZ = () => key('z', 'KeyZ', 90, 2);
const keyEnter = () => key('Enter', 'Enter', 13, 0);
const shiftL = () => key('L', 'KeyL', 76, 8);
const plainL = () => key('l', 'KeyL', 76, 0);

/* ---------- boot ---------- */
const pdfB64 = readFileSync(join(FIX, 'plan.pdf')).toString('base64');
const takeoffText = readFileSync(join(FIX, 'takeoff.v3.json'), 'utf8');
const ARM = `
  window.__take = ${takeoffText};
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__toast = () => { const t = document.querySelector('#toast'); return t ? (t.textContent||'').replace(/\\s+/g,' ').trim() : ''; };
  window.__tool = () => { const t = document.querySelector('#toolMsg'); return t ? (t.textContent||'').replace(/\\s+/g,' ').trim() : ''; };
  window.__jtop = (n) => VESApp.state.journal.undo.slice(-(n||1)).map(x => x.label);
  window.__m = (id) => { const m = VESApp.state.measurements.find(x => x.id === id); return m ? { id: m.id, cid: m.conditionId, type: m.type, page: m.page, value: m.value, pts: m.points.map(q => [q.x, q.y]) } : null; };
  window.__banner = (id) => { const b = document.querySelector('#banners [data-bid="' + id + '"]'); if (!b) return null;
    return { text: (b.textContent||'').replace(/\\s+/g,' ').trim(), buttons: Array.from(b.querySelectorAll('button')).map(x => x.textContent) }; };
  window.__card = (cid) => { const el = document.querySelector('#cards .card[data-cid="' + cid + '"]'); if (!el) return null;
    const q = el.querySelector('.qty'); const meta = el.querySelector('.meta');
    return { qty: q ? (q.textContent||'').replace(/\\s+/g,' ').trim() : null, meta: meta ? (meta.textContent||'').replace(/\\s+/g,' ').trim() : null }; };
  window.__labelWidth = (id) => { const p = VESApp.AP(); const m = VESApp.state.measurements.find(x => x.id === id); if (!m || !p.viewport) return -1;
    const pts = m.points.map(q => { const [vx, vy] = p.viewport.convertToViewportPoint(q.x, q.y); return { x: vx, y: vy }; });
    if (pts.length < 2) return -1;
    const mid = pts[Math.floor((pts.length - 1) / 2)];
    const c = VESApp.state.conditions.find(x => x.id === m.conditionId); if (!c) return -1;
    const dpr = p.oScale || 1;
    const ctx = p.els.overlay.getContext('2d');
    const y = Math.max(0, Math.round((mid.y - 10) * dpr));
    const w = p.els.overlay.width;
    let data; try { data = ctx.getImageData(0, y, w, 1).data; } catch (e) { return -2; }
    const hex = (c.color || '#888888').replace('#', '');
    const R = parseInt(hex.slice(0,2),16)||0, G = parseInt(hex.slice(2,4),16)||0, B = parseInt(hex.slice(4,6),16)||0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i+3] > 200 && Math.abs(data[i]-R)<=24 && Math.abs(data[i+1]-G)<=24 && Math.abs(data[i+2]-B)<=24) n++;
    return n; };
  1`;
const openPdf = () => ev(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } return 1; })()`);
async function boot(html = VES) {
  await c.send('Page.navigate', { url: 'file://' + html });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
  await sleep(300);
  await ev(`localStorage.clear(); 1`);
  await ev(ARM);
  await sleep(100);
}
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await boot();
const clearStage = async () => { await tryEv(`try { VESApp.toggleRail(true, { persist: false }); } catch(e){} try { VESApp.collapseDrawer(); } catch(e){} try { VESApp.showEstimate(false); } catch(e){} document.body.classList.remove('rail-collapsed'); 1`); await sleep(120); };
const loadFixture = async () => { await openPdf(); await ev(`VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); 1`); await sleep(1200);
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
    return { id: c.id, name: c.name, type: c.type, color: c.color };
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
async function traceLine(a, b, opts = {}) {
  await rectOff();
  await clearStage();
  await tryEv('VESApp.fitToView(VESApp.AP()); 1'); await sleep(260);
  await warmPointer();
  await clickPdf(a[0], a[1], { wait: 180 });
  await clickPdf(b[0], b[1], { wait: 180, modifiers: opts.modifiers || 0 });
  await keyEnter();
  await sleep(220);
}
const selectTool = async () => { await ev(`VESApp.setTool('select'); document.activeElement && document.activeElement.blur(); 1`); await sleep(140); };

console.log('# probe-qol boot OK\n');

/* ════════ Q4-a (Q4-1) · calibrating one sheet offers the scale to unscaled sheets ════════ */
if (want('a')) {
  await openPdf();
  await ev(`if (VESApp.state.snap) VESApp.toggleSnap(); 1`); await clearStage();
  const A = await addCond('Field OfferQ4', 'area', 5);
  await armCond(A.id); await rectOn();
  await goSheet(2);
  await traceRect([160, 160], [420, 420]);
  const B = await addCond('Edge OfferQ4', 'linear', 3);
  await armCond(B.id);
  await goSheet(3);
  await traceLine([160, 200], [460, 200]);
  const pendingBefore = await tryEv(`({ a: window.__m(${JSON.stringify((await tryEv(`(VESApp.state.measurements.find(m=>m.conditionId===${A.id})||{}).id`)))}), })`);
  const amId = await tryEv(`(VESApp.state.measurements.find(m=>m.conditionId===${A.id})||{}).id`);
  const bmId = await tryEv(`(VESApp.state.measurements.find(m=>m.conditionId===${B.id})||{}).id`);
  const beforeVals = await tryEv(`({ a: window.__m(${JSON.stringify(amId)}), b: window.__m(${JSON.stringify(bmId)}),
    cardA: window.__card(${A.id}) })`);
  await goSheet(1);
  await selectTool();
  await ev(`VESApp.setTool('calibrate'); 1`); await sleep(150);
  await clickPdf(200, 200, { wait: 220 });
  await clickPdf(600, 200, { wait: 260 });
  const modalOpen = await tryEv(`document.getElementById('calModalBack').classList.contains('open')`);
  await ev(`(() => { const i = document.getElementById('calInput'); i.value = "100'"; i.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()`);
  await clickSel('#calOK', { wait: 300 });
  const banner = await tryEv(`window.__banner('scale-offer')`);
  const clickedApply = await clickSel('#banners [data-bid="scale-offer"] button.armed', { wait: 350 });
  const after = await tryEv(`({ cal2: !!VESApp.state.calibrations[2], cal3: !!VESApp.state.calibrations[3],
    a: window.__m(${JSON.stringify(amId)}), b: window.__m(${JSON.stringify(bmId)}),
    cardA: window.__card(${A.id}), journal: window.__jtop(1), bannerGone: !document.querySelector('#banners [data-bid="scale-offer"]') })`);
  const ok = !!modalOpen && !!banner && !banner.error && /2/.test(banner.text) && /sheet/i.test(banner.text)
    && clickedApply === true && !after.error && after.cal2 === true && after.cal3 === true
    && beforeVals.a && beforeVals.a.value == null && after.a && typeof after.a.value === 'number'
    && beforeVals.b && beforeVals.b.value == null && after.b && typeof after.b.value === 'number'
    && after.cardA && !/pending/i.test(after.cardA.meta || '')
    && /^scale/i.test(String((after.journal || [])[0] || '')) && /2/.test(String((after.journal || [])[0] || '')) && /3/.test(String((after.journal || [])[0] || ''))
    && after.bannerGone === true;
  check('Q4-a calibrating sheet 1 (typed length) offers "use this scale on the N sheets without one" — accepting scales sheets 2 and 3 in ONE journal entry naming both, and the pending measurements traced on them re-price to real numbers (the card\'s "pending" note clears)',
    ok, { modalOpen, banner, beforeVals, after });
}

/* ════════ Q4-b (Q4-2) · Shift+L cycles labels on → values → off; plain L still opens Library ════════ */
if (want('b')) {
  await loadFixture();
  await goSheet(3);
  const L = await addCond('Label Q4b', 'linear', 3);
  await armCond(L.id);
  await traceLine([180, 250], [480, 250]);
  await selectTool();
  const mid = await tryEv(`(VESApp.state.measurements.find(m=>m.conditionId===${L.id})||{}).id`);
  await tryEv('VESApp.fitToView(VESApp.AP()); 1'); await sleep(260);
  await tryEv(`VESApp.drawOverlays(); 1`);
  const wOn = await tryEv(`window.__labelWidth(${JSON.stringify(mid)})`);
  await shiftL();
  const modeValues = await tryEv('VESApp.state.labelMode');
  const wValues = await tryEv(`window.__labelWidth(${JSON.stringify(mid)})`);
  await shiftL();
  const modeOff = await tryEv('VESApp.state.labelMode');
  const wOff = await tryEv(`window.__labelWidth(${JSON.stringify(mid)})`);
  await shiftL();
  const modeOn = await tryEv('VESApp.state.labelMode');
  const wOn2 = await tryEv(`window.__labelWidth(${JSON.stringify(mid)})`);
  const libBefore = await tryEv('VESApp.state.libView');
  await plainL();
  const libAfter = await tryEv('VESApp.state.libView');
  await ev(`VESApp.showLibrary(false); 1`); await sleep(120);
  const ok = typeof wOn === 'number' && wOn > 0
    && modeValues === 'values' && typeof wValues === 'number' && wValues > 0 && wValues < wOn
    && modeOff === 'off' && (wOff === 0 || wOff < wValues * 0.15)
    && modeOn === 'on' && wOn2 > wValues
    && libAfter === !libBefore;
  check('Q4-b Shift+L cycles the plan’s value labels on → values only → off → on (the label plate’s own rendered width shrinks then vanishes then returns — shapes untouched) and persists as a pref like Fills; plain L is unaffected and still opens the Library door',
    ok, { wOn, modeValues, wValues, modeOff, wOff, modeOn, wOn2, libBefore, libAfter });
}

/* ════════ Q4-c (Q4-3) · ortho lock: Shift while placing a vertex snaps to 0/45/90° ════════ */
if (want('c')) {
  await loadFixture();
  await goSheet(3);
  const L = await addCond('Ortho Q4c', 'linear', 3);
  await armCond(L.id);
  await rectOff();
  await tryEv('VESApp.fitToView(VESApp.AP()); 1'); await sleep(260);
  await warmPointer();
  const a = [200, 300];
  await clickPdf(a[0], a[1], { wait: 200 });
  const hoverPt = await screenPt(a[0] + 100, a[1] - 37);   // raw angle ~20.3° off horizontal — not a 45° multiple
  await mouse('mouseMoved', hoverPt.sx, hoverPt.sy, { modifiers: 8 });
  await sleep(200);
  const toolWhileOrtho = await tryEv('window.__tool()');
  await clickPdf(a[0] + 100, a[1] - 37, { wait: 260, modifiers: 8 });
  const draft = await tryEv(`(() => { const d = VESApp.state.draft; return d && d.points ? d.points.map(p => [p.x, p.y]) : null; })()`);
  await keyEnter();
  const mid = await tryEv(`(VESApp.state.measurements.find(m=>m.conditionId===${L.id})||{}).id`);
  const m = await tryEv(`window.__m(${JSON.stringify(mid)})`);
  const dx = 100, dy = -37, dist = Math.sqrt(dx * dx + dy * dy);
  const p1 = draft && draft[1];
  const gotDist = p1 ? Math.hypot(p1[0] - a[0], p1[1] - a[1]) : -1;
  const orthoOk = !!p1 && Math.abs(p1[1] - a[1]) < 1.5 && Math.abs(gotDist - dist) < 1.5;   // snapped to 0° (horizontal), same length as the raw drag
  const ok = /ortho/i.test(toolWhileOrtho || '') && orthoOk && !!m && m.pts && m.pts.length === 2
    && Math.abs(m.pts[1][1] - m.pts[0][1]) < 1.5;
  check('Q4-c holding Shift while placing a vertex locks the new segment to 0/45/90° from the previous vertex (a raw ~20° drag lands dead horizontal at the same drawn length) and toolMsg names it "ortho"',
    ok, { toolWhileOrtho, draft, m, expectedDist: dist, gotDist });
}

/* ════════ Q4-d (Q4-4) · card menu → Duplicate condition ════════ */
if (want('d')) {
  await loadFixture();
  await goSheet(3);
  const src = await addCond('Dup Source Q4d', 'linear', 4.5, 'Main Roof');
  await armCond(src.id);
  await traceLine([180, 350], [460, 350]);
  await selectTool();
  await tryEv(`(() => { const c = VESApp.state.conditions.find(x=>x.id===${src.id}); c.pitch = 6; return 1; })()`);
  await ev(`VESApp.renderCards(); 1`); await sleep(160);
  const before = await tryEv(`({ n: VESApp.state.conditions.length, ms: VESApp.state.measurements.filter(m=>m.conditionId===${src.id}).length,
    proj: JSON.stringify(VESApp.state.assemblyProject) })`);
  // Q4-5 fires openDrawerAuto() on every priced trace now (this fixture prices immediately) --
  // clear the stage first so the summoned recap panel is not sitting over the rail's own card.
  await clearStage();
  const opened = await clickSel(`.card[data-cid="${src.id}"] .card-menu`, { wait: 260 });
  const menuVisible = await tryEv(`(() => { const el = document.getElementById('condMenu'); return el && !el.hidden; })()`);
  const clickedDup = await clickSel('#condMenu [data-act="dup"]', { wait: 320 });
  await ev(`VESApp.renderCards(); 1`); await sleep(150);
  const after = await tryEv(`(() => { const n = VESApp.state.conditions[VESApp.state.conditions.length-1];
    return { n: VESApp.state.conditions.length, newest: n ? { name: n.name, type: n.type, libRef: n.libRef||null, pitch: n.pitch||null, location: n.location, color: n.color, id: n.id } : null,
      ms: n ? VESApp.state.measurements.filter(m=>m.conditionId===n.id).length : -1,
      journal: window.__jtop(1), proj: JSON.stringify(VESApp.state.assemblyProject) }; })()`);
  await ctrlZ();
  const undone = await tryEv(`VESApp.state.conditions.length`);
  const ok = opened === true && menuVisible === true && clickedDup === true
    && !before.error && !after.error && after.n === before.n + 1
    && after.newest && after.newest.name === 'Copy of Dup Source Q4d' && after.newest.type === 'linear'
    && after.newest.pitch === 6 && after.newest.location === 'Main Roof' && after.newest.color !== src.color
    && after.ms === 0 && /duplicate/i.test(String((after.journal || [])[0] || ''))
    && after.proj === before.proj && undone === before.n;
  check('Q4-d card menu → "Duplicate condition" clones the SAME type/pitch/section onto the next unused color as "Copy of <name>", zero measurements, one journal entry naming duplicate, the price book (assemblyProject) byte-identical, and one Ctrl+Z removes it',
    ok, { before, opened, menuVisible, clickedDup, after, undone });
}

/* ════════ Q4-e (Q4-5) · recap dock opens by default on a project with priced lines; the user’s last toggle wins ════════ */
if (want('e')) {
  // NOT the shared loadFixture() helper: its own clearStage() unconditionally collapses the
  // drawer as housekeeping for the OTHER rows' pointer setup, which would erase the very signal
  // this row reads. Same load, minus that one step.
  await openPdf();
  await ev(`VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); 1`); await sleep(1200);
  await ev(`if (VESApp.state.snap) VESApp.toggleSnap(); 1`);
  await tryEv(`try { VESApp.toggleRail(true, { persist: false }); } catch(e){} try { VESApp.showEstimate(false); } catch(e){} document.body.classList.remove('rail-collapsed'); 1`);
  await sleep(120);
  // R-14d (Q4 landing): the summoned recap must NOT open by itself on a priced load — it paints
  // over the rail's cards and eats the first click. The row now proves the ruling: priced project,
  // drawer CLOSED, the second card's name row is reachable by a pointer, the user's own toggle opens
  // and closes it, and openDrawerAuto() stays a no-op either way.
  const afterLoad = await tryEv(`({ open: VESApp.state.drawerOpen, sell: (typeof recapModel === "function") ? recapModel().cost : null })`);
  const reach = await tryEv(`(() => { const card = document.querySelectorAll('#cards .card')[1]; if (!card) return { hit: 'no card' };
    const nm = card.querySelector('.card-main .name'); nm.scrollIntoView({ block: 'center' }); const r = nm.getBoundingClientRect();
    const x = r.x + 40, y = r.y + r.height / 2; const h = document.elementFromPoint(x, y);
    return { at: [Math.round(x), Math.round(y)], vp: [innerWidth, innerHeight], hit: h ? h.tagName + '.' + String(h.className).split(' ')[0] : null, inCard: !!(h && card.contains(h)) }; })()`);
  await selectTool();
  const opened = await clickSel('#drawerToggle', { wait: 260 });
  const afterOpen = await tryEv('VESApp.state.drawerOpen');
  const closed = await clickSel('#drawerToggle', { wait: 260 });
  const afterClose = await tryEv('VESApp.state.drawerOpen');
  await tryEv(`(() => { if (typeof openDrawerAuto === "function") openDrawerAuto(); return 1; })()`);
  const staysClosed = await tryEv('VESApp.state.drawerOpen');
  // isolate the SECOND gate (an unpriced project) from the first (the user's own toggle):
  // reset drawerOpen/drawerCollapsedByUser to "never touched", THEN blank the project and
  // call openDrawerAuto() again explicitly — it must stay closed on cost alone, not on the
  // leftover toggle from the paragraph above.
  await tryEv(`(() => { VESApp.state.drawerOpen = false; VESApp.state.drawerCollapsedByUser = false; VESApp.collapseDrawer(); return 1; })()`);
  await ev(`(() => { VESApp.state.conditions = []; VESApp.state.measurements = [];
    VESApp.startBlankCanvas(10);
    return 1; })()`);
  await sleep(300);
  await tryEv(`(() => { if (typeof openDrawerAuto === "function") openDrawerAuto(); return 1; })()`);
  const blankState = await tryEv('({ open: VESApp.state.drawerOpen, cost: (typeof recapModel === "function") ? recapModel().cost : null })');
  const ok = !afterLoad.error && afterLoad.open === false && afterLoad.sell > 0
    && !reach.error && reach.inCard === true
    && opened === true && afterOpen === true && closed === true && afterClose === false && staysClosed === false
    && !blankState.error && blankState.cost === 0 && blankState.open === false;
  check('Q4-e (R-14d) a loaded project with priced lines opens with the recap CLOSED and the second card\'s name row reachable by a pointer (nothing paints over the cards); the user\'s own toggle opens and closes it; openDrawerAuto() stays a no-op on a priced and on a blank canvas — openDrawerAuto is no longer a no-op',
    ok, { afterLoad, reach, opened, afterOpen, closed, afterClose, staysClosed, blankState });
}

/* ════════ Q4-f (Q4-6) · VOCAB.grid: EU / Ord Un / Prc Un collapse to ONE Unit column ════════ */
if (want('f')) {
  await loadFixture();
  await ev(`VESApp.showEstimate(true); VESApp.renderEstimateGrid(); 1`); await sleep(220);
  const head = await tryEv(`(() => { const ths = Array.from(document.querySelectorAll('table.estgrid:not(.libgrid) thead th')).map(th => th.textContent.trim());
    return { ths, text: (document.querySelector('table.estgrid:not(.libgrid) thead')||{}).textContent || '' }; })()`);
  const rowCells = await tryEv(`(() => { const tr = document.querySelector('table.estgrid:not(.libgrid) tbody tr:not(.sech):not(.divh)'); return tr ? tr.children.length : -1; })()`);
  await ev(`VESApp.showEstimate(false); 1`);
  const vc = spawnSync('node', [join(ROOT, 'tools', 'vocab-check.mjs'), VES], { encoding: 'utf8' });
  const vcOut = ((vc.stdout || '') + (vc.stderr || '')).trim();
  const ok = !head.error && head.ths.filter((t) => t === 'Unit').length === 1
    && head.ths.indexOf('EU') < 0 && head.ths.indexOf('Prc Un') < 0 && head.ths.indexOf('Ord Un') < 0
    && head.ths.length === rowCells && vc.status === 0;
  check('Q4-f the Estimate grid header collapses EU / Ord Un / Prc Un into ONE "Unit" column (header cell count equals a priced row’s own cell count) and tools/vocab-check.mjs still exits 0 against VOCAB.grid’s own declared words',
    ok, { head, rowCells, vocabCheck: vc.status, vcOut: vcOut.slice(0, 600) });
}

/* ════════ Q4-g (Q4-7) · grid scrolls horizontally inside .gscroll at 125–150% zoom, Description sticky ════════ */
if (want('g')) {
  await loadFixture();
  await ev(`VESApp.showEstimate(true); VESApp.renderEstimateGrid(); 1`); await sleep(220);
  await ev(`setUiScale(1.5); 1`); await sleep(300);
  const before = await tryEv(`(() => {
    const gs = document.querySelector('.gscroll'); const doc = document.documentElement;
    const th0 = document.querySelector('table.estgrid:not(.libgrid) thead th:first-child');
    const td0 = document.querySelector('table.estgrid:not(.libgrid) tbody tr:not(.sech):not(.divh) td:first-child');
    const r0h = th0 ? th0.getBoundingClientRect() : null, r0b = td0 ? td0.getBoundingClientRect() : null;
    return {
      containerOverflow: gs ? (gs.scrollWidth - gs.clientWidth) : -1,
      pageOverflow: doc.scrollWidth - doc.clientWidth,
      headSticky: th0 ? getComputedStyle(th0).position : null,
      headLeft: r0h ? r0h.left : null, headW: r0h ? r0h.width : null,
      bodySticky: td0 ? getComputedStyle(td0).position : null,
      bodyLeft: r0b ? r0b.left : null, bodyW: r0b ? r0b.width : null,
    }; })()`);
  await ev(`(() => { document.querySelector('.gscroll').scrollLeft = 200; return 1; })()`); await sleep(150);
  const after = await tryEv(`(() => {
    const gs = document.querySelector('.gscroll');
    const th0 = document.querySelector('table.estgrid:not(.libgrid) thead th:first-child');
    const td0 = document.querySelector('table.estgrid:not(.libgrid) tbody tr:not(.sech):not(.divh) td:first-child');
    const netCostCell = document.querySelector('table.estgrid:not(.libgrid) thead th:last-child');
    const r0h = th0 ? th0.getBoundingClientRect() : null, r0b = td0 ? td0.getBoundingClientRect() : null;
    return { scrollLeft: gs.scrollLeft, headLeft: r0h ? r0h.left : null, bodyLeft: r0b ? r0b.left : null,
      netCostText: netCostCell ? netCostCell.textContent.trim() : null,
      netCostLeft: netCostCell ? netCostCell.getBoundingClientRect().left : null }; })()`);
  const ok = !before.error && before.containerOverflow > 20 && before.pageOverflow <= 1
    && before.headSticky === 'sticky' && before.bodySticky === 'sticky'
    && before.headW === before.bodyW && before.headW > 100
    && !after.error && after.scrollLeft >= 150
    && Math.abs(after.headLeft - before.headLeft) < 1 && Math.abs(after.bodyLeft - before.bodyLeft) < 1;
  check('Q4-g at 150% zoom the Estimate grid overflows and scrolls INSIDE .gscroll (not the page), and the Description column (header + body, both position:sticky, same explicitly reserved width) stays put at the left edge across a 200px scroll while the rest of the row moves under it',
    ok, { before, after });
  await ev(`setUiScale(1); 1`); await sleep(150);
}

/* ════════ Q4-h (Q4-8) · undo after reload: the empty-stack sentence fires once, not per press ════════ */
if (want('h')) {
  await ev(`VESApp.startBlankCanvas(10); 1`); await sleep(200);   // journalReset() guarantees an empty stack
  await clearStage();
  const before = await tryEv(`({ n: VESApp.state.journal.undo.length, title: (document.getElementById('btnUndo')||{}).title })`);
  const armed = await tryEv(`(() => { window.__toastCalls = 0; const orig = window.toast;
    window.toast = function () { window.__toastCalls++; return orig.apply(this, arguments); };
    return 1; })()`);
  await ctrlZ();
  const after1 = await tryEv(`({ calls: window.__toastCalls, text: (document.getElementById('toast')||{}).textContent })`);
  await ctrlZ();
  const after2 = await tryEv(`({ calls: window.__toastCalls, text: (document.getElementById('toast')||{}).textContent })`);
  await ctrlZ();
  const after3 = await tryEv(`({ calls: window.__toastCalls })`);
  const ok = armed === 1 && !before.error && before.n === 0
    && /this session/i.test(before.title || '') && /reload|opened|session/i.test(before.title || '')
    && after1.calls === 1 && /this session/i.test(after1.text || '')
    && after2.calls === 1 && after3.calls === 1;
  check('Q4-h with an empty journal the Undo control’s title already names the session boundary and Ctrl+Z toasts it ONCE — a second and third press against the same empty stack stay silent, not re-toasting the identical fact each time',
    ok, { before, after1, after2, after3 });
}

/* ════════ Q4-i (Q4-9, T-22) · Tab across grid cells wraps to the next row; Enter/Esc untouched ════════ */
if (want('i')) {
  await loadFixture();
  await ev(`VESApp.showEstimate(true); VESApp.renderEstimateGrid(); 1`); await sleep(220);
  const scan = await tryEv(`(() => { const cells = Array.from(document.querySelectorAll('#estgridBody input.recap-edit, #estgridBody input.gen-edit'));
    const keyOf = (x) => x.dataset.item || x.dataset.cond || x.dataset.gen;
    const k0 = keyOf(cells[0]);
    let boundary = -1;
    for (let idx = 1; idx < cells.length; idx++) { if (keyOf(cells[idx]) !== k0) { boundary = idx; break; } }
    return { n: cells.length, k0, boundary, k1: boundary >= 0 ? keyOf(cells[boundary]) : null }; })()`);
  const ok0 = !scan.error && scan.n >= 4 && scan.boundary > 0;
  let after = null, changedCellId = null, revBack = null, escOk = null;
  if (ok0) {
    // focus the LAST cell of row 0 (index boundary-1), Tab across the row edge
    changedCellId = await tryEv(`(() => { const cells = Array.from(document.querySelectorAll('#estgridBody input.recap-edit, #estgridBody input.gen-edit'));
      const c = cells[${scan.boundary - 1}]; c.focus(); c.select(); return c.dataset.item || c.dataset.cond || c.dataset.gen; })()`);
    await key('Tab', 'Tab', 9, 0);
    await sleep(200);
    after = await tryEv(`(() => { const a = document.activeElement; return { tag: a && a.tagName, key: a ? (a.dataset.item || a.dataset.cond || a.dataset.gen) : null, cls: a ? a.className : null }; })()`);
    // Shift+Tab from there should walk straight back onto the row-0 cell we started from
    await key('Tab', 'Tab', 9, 8);
    await sleep(200);
    revBack = await tryEv(`(() => { const a = document.activeElement; return a ? (a.dataset.item || a.dataset.cond || a.dataset.gen) : null; })()`);
    // Esc still reverts in place (existing semantics untouched) — type junk, Escape, check it reverted and focus never left the cell
    await ev(`(() => { const a = document.activeElement; a.value = a.value + '999'; return 1; })()`);
    await key('Escape', 'Escape', 27, 0);
    // Esc's pre-existing contract (L-21) blurs the field on revert ("leaves any text box" per the
    // keys card) and blur then re-formats it for display ("5.4" -> "$5.40") — that whole chain is
    // untouched by Q4-9; the row's own business is only that the typed "999" never survived.
    escOk = await tryEv(`(() => { const cells = Array.from(document.querySelectorAll('#estgridBody input.recap-edit, #estgridBody input.gen-edit'));
      const c = cells[${scan.boundary - 1}]; return { reverted: !c.value.includes('999') }; })()`);
  }
  const ok = ok0 && !after.error && after.tag === 'INPUT' && after.key === scan.k1
    && revBack === changedCellId && !escOk.error && escOk.reverted === true;
  check('Q4-i (T-22) Tab from the LAST editable cell of a grid row lands on the FIRST editable cell of the NEXT row (row-major wrap, not the browser’s own tab order landing on a checkbox), Shift+Tab from there walks straight back, and Esc still reverts the cell’s draft in place without leaving the grid',
    ok, { scan, changedCellId, after, revBack, escOk });
}

/* ════════ Q4-j (Q4-10) · card menu → Type a quantity… lands a journaled manual row ════════ */
if (want('j')) {
  await loadFixture();
  await goSheet(3);
  const src = await addCond('Manual LF Q4j', 'linear', 3.25, 'Annex');
  await selectTool();
  await clearStage();
  const before = await tryEv(`({ n: VESApp.state.measurements.length, ms: VESApp.state.measurements.filter(m=>m.conditionId===${src.id}).length })`);
  const opened = await clickSel(`.card[data-cid="${src.id}"] .card-menu`, { wait: 260 });
  const clickedQty = await clickSel('#condMenu [data-act="qty"]', { wait: 320 });
  const modalOpenRaw = await tryEv(`(() => { const el = document.getElementById('qtyModalBack'); return el ? el.classList.contains('open') : null; })()`);
  const modalOpen = modalOpenRaw === true;
  if (modalOpen) {
    await tryEv(`(() => { const i = document.getElementById('qtyModalInput'); if (i) { i.value = '320'; i.dispatchEvent(new Event('input',{bubbles:true})); } return 1; })()`);
  }
  const clickedAdd = modalOpen ? await clickSel('#qtyModalOK', { wait: 300 }) : false;
  const after = await tryEv(`(() => { const m = VESApp.state.measurements.find(x=>x.conditionId===${src.id}); const back = document.getElementById('qtyModalBack');
    return { n: VESApp.state.measurements.length, m: m ? { value: m.value, manual: m.manual, page: m.page } : null,
    journal: window.__jtop(1), modalOpen: back ? back.classList.contains('open') : null }; })()`);
  await ctrlZ();
  const undone = await tryEv(`VESApp.state.measurements.filter(m=>m.conditionId===${src.id}).length`);
  const ok = opened === true && clickedQty === true && modalOpen === true && clickedAdd === true
    && !before.error && before.ms === 0 && !after.error && after.n === before.n + 1
    && after.m && after.m.value === 320 && after.m.manual === true && after.modalOpen === false
    && /typed quantity/i.test(String((after.journal || [])[0] || '')) && /320/.test(String((after.journal || [])[0] || ''))
    && undone === 0;
  check('Q4-j (O1) card menu → "Type a quantity…" lands a journaled manual measurement (320 LF) via addManualQuantity/addManualQtyForCard without arming the condition or touching the sheet, one Ctrl+Z removes it',
    ok, { before, opened, clickedQty, modalOpen, clickedAdd, after, undone });
}

/* ════════ Q4-k (Q4-11) · one Exports door lists every file with a one-line trade-word purpose ════════ */
if (want('k')) {
  await loadFixture();
  await selectTool();
  await clearStage();
  await ev(`(() => { window.__saved = []; const orig = window.saveBlob;
    window.saveBlob = function (name) { window.__saved.push(name); return orig.apply(this, arguments); };
    return 1; })()`);
  const ensureOpen = async () => { const isOpen = await tryEv(`document.getElementById('dataMenu').classList.contains('open')`);
    if (!isOpen) return clickSel('#btnDataMenu', { wait: 260 }); return true; };
  const opened = await ensureOpen();
  const menuText = await tryEv(`(document.getElementById('dataMenu')||{}).textContent.replace(/\\s+/g,' ')`);
  const wanted = ['the priced lines', 'what to buy', 'what each condition totals', 'every stroke, with its sheet and scale', 'quantities for vendors, no money'];
  const missing = wanted.filter((w) => !(menuText || '').includes(w));
  await ensureOpen();
  const clickedBom = await clickSel('#btnMenuBOM', { wait: 280 });
  await ensureOpen();
  const clickedRoll = await clickSel('#btnMenuRoll', { wait: 280 });
  await ensureOpen();
  const clickedAudit = await clickSel('#btnMenuAudit', { wait: 280 });
  const saved = await tryEv(`window.__saved`);
  const vc = spawnSync('node', [join(ROOT, 'tools', 'vocab-check.mjs'), VES], { encoding: 'utf8' });
  const ok = opened === true && missing.length === 0
    && clickedBom === true && clickedRoll === true && clickedAudit === true
    && Array.isArray(saved) && saved.length === 3
    && saved.some((n) => /bom|materials/i.test(n)) && saved.some((n) => /rollup|condition/i.test(n)) && saved.some((n) => /audit/i.test(n))
    && vc.status === 0;
  check('Q4-k (Exports light touch) the Files & exports door lists every file with a one-line trade-word purpose (BOM/Rollup/Audit CSVs joining Estimate CSV and Supplier RFQ there, same files, same names, same functions as their Setup doors — nothing merged or removed) and vocab-check stays 0',
    ok, { opened, missing, clickedBom, clickedRoll, clickedAudit, saved, vocabCheck: vc.status });
}

/* ════════ Q4-l · G0 (run alone; the other batches’ probes are their own steps) ════════ */
if (NOSUB) {
  check('Q4-l G0 not run here (--no-subgates); it runs as its own CI step', true, { skipped: '--no-subgates was passed' });
} else if (want('l')) {
  const t0 = Date.now();
  const r = spawnSync('node', [join(ROOT, 'gate', 'g0.mjs'), 'check', join(ROOT, 'src', 'VES_PM.html')],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
  const out = String(r.stdout || '') + String(r.stderr || '');
  check('Q4-l G0 GREEN (money path untouched by this batch)', r.status === 0 && /G0 GREEN/.test(out), { code: r.status, ms: Date.now() - t0, tail: out.trim().split('\n').slice(-6).join(' | ') });
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'RED') + ' — ' + pass + ' pass, ' + fail + ' fail, ' + rows.length + ' rows');
try { c.close(); } catch (_) {}
try { chrome.kill('SIGKILL'); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
