/* Batch B2b gate — SECTIONS, DRAWN: regions on a sheet tag conditions by containment
 * (plan §B2b · rulings R-5e / R-5f / R-5g / R-5h). RED-first on the 2.0.0-rc.3 base.
 * Zero deps; raw CDP; same CLI shape as probe-b2a-sections.mjs.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b2b-regions.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet/takeoff.v3.json" \
 *     "$PWD/fixtures/synthetic/three-sheet/plan.pdf" "$PWD" [--no-subgates] [oldBuild.html]
 *
 * Every region in this probe is DRAWN WITH A REAL POINTER — Input.dispatchMouseEvent through
 * the harness, one press/release per vertex, exactly as a hand does it. No synthetic DOM event
 * creates, moves, renames or deletes a region here, and no row passes on a state poke.
 *
 * The three-sheet fixture's own geometry decides the answers (fixtures/.../README.md):
 *   sheet 3 "A-3 Canopy"  — every measurement on it sits inside x 520…1300, y 587…940.
 *     #14 Hip/valley metal is SECTIONED "Main Roof" and measured there — that is B2b-3.
 *   sheet 2 "A-2 Annex"   — #21 Sheathing repair (UNASSIGNED) has its centroid at ~(884, 678);
 *     #19 Roof access ladder ~(888, 783) and #26 Downspout boot ~(709, 843) sit outside the
 *     box this probe draws, and #22 Snow guard is on sheet 1 where no region is drawn — so
 *     "tag by regions" must move exactly one of the four and leave three Unassigned.
 * The last arg (or `git show 4742d02:src/VES_PM.html` — the rc.3 commit, the last version-4 build; PINNED because once B2b landed `ves2` itself is a version-5 build and the refusal row could never fire — found by the orchestrator's rerun at B3) is the OLD BUILD for the v5 refusal row.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const NOSUB = args.includes('--no-subgates');
const [VES, TAKEOFF, PDF, ROOT, OLDARG] = args.filter((a) => !a.startsWith('--'));
if (!VES || !TAKEOFF || !PDF || !ROOT) {
  console.error('usage: probe-b2b-regions.mjs <VES_PM.html> <takeoff.v3.json> <plan.pdf> <repoRoot> [--no-subgates] [oldBuild.html]');
  process.exit(2);
}
const FIXDIR = dirname(TAKEOFF);
const TMP = mkdtempSync(join(tmpdir(), 'ves-b2b-'));

/* the "old build" — the rc.3 bytes on the branch point, so the v5 refusal is tested against a
   build that really cannot read v5 (never a mock of one). */
let OLD = OLDARG || '';
if (!OLD) {
  // The runner checks out at depth 1, so the pinned commit is not in the object store — fetch it by FULL sha first (the
  // probe-af pattern; GitHub serves reachable objects by sha) and only then `git show`. Found by 2.0.0's first CI run (2026-09-15).
  const OLD_FULL = '4742d02f0131fd7198be462a52deb8947243dd7c';
  let g = spawnSync('git', ['-C', ROOT, 'show', OLD_FULL + ':src/VES_PM.html'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (!(g.status === 0 && g.stdout && g.stdout.length > 1000)) {
    spawnSync('git', ['-C', ROOT, 'fetch', '--no-tags', '--depth=1', 'origin', OLD_FULL], { encoding: 'utf8', timeout: 120000 });
    g = spawnSync('git', ['-C', ROOT, 'show', OLD_FULL + ':src/VES_PM.html'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  }
  if (g.status === 0 && g.stdout && g.stdout.length > 1000) { OLD = join(TMP, 'old-build.html'); writeFileSync(OLD, g.stdout); }
}

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
const port = 9300 + Math.floor(Math.random() * 120);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b2bp-'))}`, '--remote-allow-origins=*',
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
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
};

/* ---------- the pointer ---------- */
const screenPt = (x, y) => ev(`(() => { const p = VESApp.AP(); const [vx, vy] = p.viewport.convertToViewportPoint(${x}, ${y});
  const el = p.els.overlay; const r = el.getBoundingClientRect();
  return { sx: r.left + vx * (r.width / p.viewport.width), sy: r.top + vy * (r.height / p.viewport.height) }; })()`);
async function mouse(type, sx, sy, clickCount = 1) {
  await c.send('Input.dispatchMouseEvent', { type, x: Math.round(sx), y: Math.round(sy), button: 'left', buttons: type === 'mouseMoved' ? 0 : 1, clickCount });
}
async function clickScreen(sx, sy, { clickCount = 1, wait = 130 } = {}) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(sx), y: Math.round(sy), button: 'none', buttons: 0 });
  await sleep(40);
  for (const type of ['mousePressed', 'mouseReleased']) await mouse(type, sx, sy, clickCount);
  await sleep(wait);
}
/* The app tucks the toolbar and the money strip away the first time the pointer enters the sheet,
   which MOVES the sheet under it. A hand sees that happen and re-aims; so does this: hover, let the
   layout settle, then take the aim again before the press. */
async function clickPdf(x, y, opts) {
  let a = await screenPt(x, y);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 });
  await sleep(80);
  a = await screenPt(x, y);
  await clickScreen(a.sx, a.sy, opts);
}
/* Bringing the pointer from the tool rack onto the sheet makes the app's floating islands settle,
   and the sheet slides ~13 px under the pointer while they do. A hand watches that finish before it
   starts drawing; this hovers over the sheet and waits it out, every time the pointer comes back
   from a control. */
async function warmPointer() {
  for (let i = 0; i < 3; i++) {
    const a = await screenPt(1296, 864);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 });
    await sleep(220);
  }
  await sleep(250);
}
async function clickSel(sel, wait = 150) {
  const r = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
    const b = e.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0)) return null;
    return { sx: b.left + b.width / 2, sy: b.top + b.height / 2 }; })()`);
  if (!r) return false;
  await clickScreen(r.sx, r.sy, { wait });
  return true;
}
async function dragPdf(from, to) {   // a vertex in hand, moved with the pointer
  let a = await screenPt(from[0], from[1]);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.sx), y: Math.round(a.sy), button: 'none', buttons: 0 });
  await sleep(80);
  a = await screenPt(from[0], from[1]);
  const b = await screenPt(to[0], to[1]);
  await mouse('mousePressed', a.sx, a.sy);
  const N = 6;
  for (let i = 1; i <= N; i++) await mouse('mouseMoved', a.sx + (b.sx - a.sx) * i / N, a.sy + (b.sy - a.sy) * i / N);
  await mouse('mouseReleased', b.sx, b.sy);
  await sleep(180);
}
async function typeText(t) { await c.send('Input.insertText', { text: t }); await sleep(60); }
async function key(k, code, vk) {
  for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(150);
}
const keyEsc = () => key('Escape', 'Escape', 27);
const keyDel = () => key('Delete', 'Delete', 46);
async function ctrlZ() {
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90, modifiers: 2 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90, modifiers: 2 });
  await sleep(200);
}

/* ---------- boot + the fixture, through the app's own doors ---------- */
const takeoffText = readFileSync(TAKEOFF, 'utf8');
const pdfB64 = readFileSync(PDF).toString('base64');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file://' + VES });
let booted = false;
for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { booted = true; break; } } catch (_) {} await sleep(50); }
await sleep(400);
if (!booted) { console.error('HARNESS FAIL: the app never booted'); chrome.kill('SIGKILL'); process.exit(2); }

const INK = [107, 79, 187];   // the region ink this build paints outlines and chips in
await ev(`localStorage.clear(); window.print = () => { window.__printed = (window.__printed || 0) + 1; const __d = document.getElementById('printDoc'); const __h = __d ? __d.innerHTML : ''; setTimeout(() => { const __e = document.getElementById('printDoc'); if (__e) __e.innerHTML = __h; }, 0); /* B6F-C6 re-address: the app releases #printDoc as soon as window.print() returns (a real browser has    already composed the page by then). Capture at compose time, restore next tick, read sites unchanged. */ };
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__blobs = [];
  window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, mime, text: (typeof bytes === 'string') ? bytes : '' }); };
  window.__scan = (data, w, h) => { const R = ${INK[0]}, G = ${INK[1]}, B = ${INK[2]}, T = 12;
    let n = 0, longest = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) { let run = 0;
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4;
        if (data[i + 3] > 200 && Math.abs(data[i] - R) <= T && Math.abs(data[i + 1] - G) <= T && Math.abs(data[i + 2] - B) <= T) {
          n++; run++; if (run > longest) longest = run;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        } else run = 0; } }
    return { n, longest, bbox: n ? [x0, y0, x1, y1] : null, w, h }; };
  window.__scanOverlay = () => { const p = VESApp.AP(); const o = p.els.overlay; const cx = o.getContext('2d');
    return window.__scan(cx.getImageData(0, 0, o.width, o.height).data, o.width, o.height); };
  window.__scanURL = (src) => new Promise((res) => { if (!src) return res({ n: -1, longest: -1, missing: true });
    const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
      res(window.__scan(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height)); };
    im.onerror = () => res({ n: -2, longest: -2, broken: true }); im.src = src; });
  window.__money = (s) => { const m = /-?\\$?\\s*-?[\\d,]+\\.\\d\\d/.exec(String(s || '')); if (!m) return null;
    const neg = /^\\s*-|\\(\\s*\\$/.test(String(s)); const n = Math.round(Math.abs(parseFloat(m[0].replace(/[^0-9.]/g, ''))) * 100); return neg ? -n : n; };
  window.__secs = () => (VESApp.state.sections || []).map(s => ({ id: s.id, name: s.name, page: s.page, pts: (s.points || []).length,
    points: (s.points || []).map(p => Array.isArray(p) ? p.slice() : [p.x, p.y]) }));
  window.__locs = () => VESApp.state.conditions.map(c => [c.id, String(c.location || '')]);
  window.__jtop = (k) => (VESApp.state.journal.undo.slice(-(k || 1)).map(x => x.label));
  window.__grand = () => { const m = VESApp.recapModel(); return [Math.round(m.cost * 100), Math.round(m.sell * 100), m.lineCount]; };
  1`);

const loaded = await tryEv(`(async () => {
  const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  window.__take = ${takeoffText};
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  return { conditions: VESApp.state.conditions.length, sectionsKey: Array.isArray(VESApp.state.sections) ? 'array' : typeof VESApp.state.sections, grand: window.__grand() };
})()`);
if (loaded.error) { console.error('HARNESS FAIL: the fixture did not load — ' + loaded.error); chrome.kill('SIGKILL'); process.exit(2); }
console.log('# fixture loaded: ' + JSON.stringify(loaded));
console.log('# old build for the v5 refusal row: ' + (OLD || 'NOT AVAILABLE') + '\n');

/* Snap OFF for the whole run. Snap is the app's default and the right one for a hand — it pulled
   this probe's first corner 33 units onto the sheet-3 calibration mark, which is exactly what it
   is for. A gate cannot both use it and assert on exact coordinates, so the pointer here draws
   raw and the containment answers below are the fixture's own arithmetic, not the snap's. */
await ev(`if (VESApp.state.snap) VESApp.toggleSnap(); VESApp.state.snap`);
console.log('# snap: ' + (await ev('VESApp.state.snap') ? 'ON' : 'OFF — the probe draws raw coordinates') + '\n');

/* room to draw: the rail and the drawer are floating islands over the sheet */
const clearStage = async () => { await ev(`try { VESApp.toggleRail(false, { persist: false }); } catch (e) {}
  try { VESApp.collapseDrawer(); } catch (e) {} try { VESApp.showEstimate(false); } catch (e) {} 1`); await sleep(120); };
const goSheet = async (n) => { await ev(`(async () => { await VESApp.showPane(VESApp.state.panes[0], ${n}, { fit: true });
  await new Promise(r => setTimeout(r, 350)); VESApp.fitToView(VESApp.AP()); await new Promise(r => setTimeout(r, 350)); return VESApp.AP().pageNum; })()`); await clearStage(); await warmPointer(); };

// draw one region with the pointer: arm the Section tool from the rack, click each corner,
// close by clicking the FIRST corner again, then name it in the app's own prompt.
async function drawRegion(name, pts, { close = 'first' } = {}) {
  const armed = await clickSel('#btnSection');
  if (!armed) return { noTool: true };
  await warmPointer();
  for (const p of pts) await clickPdf(p[0], p[1], { wait: 130 });
  // close the way a hand does: on the corner it can SEE, which is the one the app stored
  const first = await ev(`(() => { const d = VESApp.state.secDraft; return d && d.points.length ? [d.points[0].x, d.points[0].y] : null; })()`);
  const corners = await ev(`(() => { const d = VESApp.state.secDraft; return d ? d.points.length : 0; })()`);
  if (close === 'first' && first) await clickPdf(first[0], first[1], { wait: 300 });
  else await clickPdf(pts[pts.length - 1][0], pts[pts.length - 1][1], { clickCount: 2, wait: 300 });
  const modal = await ev(`(() => { const m = document.getElementById('secNameModal');
    return !!(m && m.classList.contains('open')); })()`);
  if (!modal) return { noPrompt: true, cornersDrawn: corners, secs: await ev('window.__secs()') };
  await ev(`(() => { const i = document.getElementById('secNameInput'); if (i) { i.focus(); i.select(); } 1 })()`);
  await typeText(name);
  const ok = await clickSel('#secNameOk', 320);
  return { ok, cornersDrawn: corners, secs: await ev('window.__secs()') };
}

const CANOPY = [[480, 560], [1340, 560], [1340, 970], [480, 970]];       // sheet 3, around everything drawn there
const ANNEXBOX = [[640, 610], [1160, 610], [1160, 745], [640, 745]];     // sheet 2, around #21 only

/* ════ B2b-1 — a region is DRAWN, closes on its first point, paints a chip, and is not a condition ════ */
await goSheet(3);
const before1 = await ev('({ cards: document.querySelectorAll("#cards .card").length, grand: window.__grand(), conds: VESApp.state.conditions.length })');
const d1 = await drawRegion('Canopy', CANOPY);
const r1 = await tryEv(`(async () => {
  const secs = window.__secs();
  const ov = window.__scanOverlay();
  window.__blobs = []; try { VESApp.exportAuditCSV(); } catch (e) {} await new Promise(r => setTimeout(r, 250));
  const audit = (window.__blobs.filter(b => /audit\\.csv$/.test(b.name)).pop() || { text: '' }).text;
  window.__blobs = []; try { VESApp.exportGridCSV(); } catch (e) {} await new Promise(r => setTimeout(r, 250));
  const grid = (window.__blobs.filter(b => /\\.csv$/.test(b.name)).pop() || { text: '' }).text;
  return { secs, ov, auditRegionRows: (audit.match(/^section-region,/gm) || []).length, auditHasCanopyRegion: /section-region,\\s*"?Canopy/.test(audit),
    gridHasRegionRow: /section-region/.test(grid), cards: document.querySelectorAll('#cards .card').length,
    grand: window.__grand(), conds: VESApp.state.conditions.length, tool: VESApp.state.tool };
})()`);
const r1d = { drew: d1, cardsBefore: before1.cards, cardsAfter: r1.cards, grandBefore: before1.grand, grandAfter: r1.grand,
  overlayInk: r1.ov, sections: r1.secs, auditRegionRows: r1.auditRegionRows, gridHasRegionRow: r1.gridHasRegionRow };
const sec1 = (r1.secs || [])[0] || null;
const r1ok = !r1.error && !!sec1 && sec1.name === 'Canopy' && sec1.page === 3 && sec1.pts === 4
  && Array.isArray(sec1.points) && sec1.points.length === 4
  && r1.ov && r1.ov.n > 0 && r1.ov.longest >= 24
  && r1.cards === before1.cards && r1.conds === before1.conds
  && JSON.stringify(r1.grand) === JSON.stringify(before1.grand)
  && r1.auditRegionRows === 1 && r1.auditHasCanopyRegion === true && r1.gridHasRegionRow === false;
check('B2b-1 the Section tool draws a region on sheet 3 with the pointer — it closes on its first point like an area (4 clicks, 4 stored vertices), paints a dashed outline and a name chip on the overlay, adds no condition card and moves no money, and shows up in no export but the audit CSV', r1ok, r1d);

/* ════ B2b-2 — measuring inside a region tags the condition's section, and Ctrl+Z takes it back in two named steps ════ */
const r2 = await tryEv(`(async () => {
  const w = document.getElementById('addCondWrap'); if (w) w.hidden = false;
  document.getElementById('condName').value = 'Canopy deck (probe)';
  document.getElementById('condType').value = 'area';
  document.getElementById('addCondForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  await new Promise(r => setTimeout(r, 250));
  const c = VESApp.state.conditions[VESApp.state.conditions.length - 1];
  VESApp.activateCondition(c);
  await new Promise(r => setTimeout(r, 150));
  try { VESApp.collapseDrawer(); } catch (e) {}
  return { id: c.id, name: c.name, loc: String(c.location || ''), type: c.type, jBefore: VESApp.state.journal.undo.length, mBefore: VESApp.state.measurements.length };
})()`);
if (!r2.error) {
  for (const p of [[700, 650], [900, 650], [900, 850], [700, 850]]) await clickPdf(p[0], p[1], { wait: 110 });
  await clickPdf(700, 850, { clickCount: 2, wait: 300 });
}
const r2b = await tryEv(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${r2.id});
  return { loc: String(c.location || ''), labels: window.__jtop(2), toast: document.getElementById('toast').textContent,
    jAfter: VESApp.state.journal.undo.length, mAfter: VESApp.state.measurements.length }; })()`);
await ctrlZ();
const r2c = await tryEv(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${r2.id});
  return { loc: String(c.location || ''), m: VESApp.state.measurements.length }; })()`);
await ctrlZ();
const r2d = await tryEv(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${r2.id});
  return { loc: String(c.location || ''), m: VESApp.state.measurements.length }; })()`);
const r2ok = !r2.error && !r2b.error && r2.loc === '' && r2b.loc === 'Canopy'
  && /Canopy/.test((r2b.labels || [])[1] || '') && /drawn region/.test((r2b.labels || [])[1] || '')
  && /Canopy/.test(r2b.toast || '') && r2b.mAfter === r2.mBefore + 1
  && r2c.loc === '' && r2c.m === r2b.mAfter
  && r2d.loc === '' && r2d.m === r2.mBefore;
check('B2b-2 an area measured with the pointer inside "Canopy", on a condition with no section, sets that condition\'s section to Canopy and says so; the journal names it as coming from the drawn region; Ctrl+Z clears the section and a second Ctrl+Z removes the measurement — two steps, each named', r2ok,
  { created: r2, afterMeasure: r2b, afterUndo1: r2c, afterUndo2: r2d });

/* ════ B2b-3 — a condition that already has a section keeps it ════════════════════════════════════ */
const r3a = await tryEv(`(async () => { const c = VESApp.state.conditions.find(x => x.name === 'Hip/valley metal');
  VESApp.activateCondition(c); await new Promise(r => setTimeout(r, 150)); try { VESApp.collapseDrawer(); } catch (e) {}
  document.getElementById('toast').textContent = '';
  return { id: c.id, loc: String(c.location || ''), j: VESApp.state.journal.undo.length }; })()`);
if (!r3a.error) { await clickPdf(760, 700, { wait: 110 }); await clickPdf(1000, 700, { clickCount: 2, wait: 320 }); }
const r3b = await tryEv(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${r3a.id});
  return { loc: String(c.location || ''), toast: document.getElementById('toast').textContent, labels: window.__jtop(1), j: VESApp.state.journal.undo.length }; })()`);
const r3ok = !r3a.error && !r3b.error && r3a.loc === 'Main Roof' && r3b.loc === 'Main Roof'
  && /Canopy/.test(r3b.toast || '') && /Main Roof/.test(r3b.toast || '')
  && !/drawn region/.test((r3b.labels || [])[0] || '');
check('B2b-3 the same region, a condition already filed in "Main Roof": the section does not move, and the toast says the measurement landed inside Canopy while the condition stays in Main Roof', r3ok, { before: r3a, after: r3b });

/* ════ B2b-4 — "Tag by regions" fills in every unsectioned condition it can, and moves no money ════ */
await goSheet(2);
const d4 = await drawRegion('Annex', ANNEXBOX);
const r4 = await tryEv(`(async () => {
  const locsBefore = window.__locs(), grandBefore = window.__grand(), jBefore = VESApp.state.journal.undo.length;
  const unassignedBefore = VESApp.state.conditions.filter(c => !String(c.location || '').trim()).map(c => c.id);
  return { locsBefore, grandBefore, jBefore, unassignedBefore, secs: window.__secs() };
})()`);
await ev(`try { VESApp.openAssemblies(); } catch (e) {} 1`); await sleep(250);
const tagged = await clickSel('#btnTagRegions', 400);
await ev(`try { VESApp.closeAssemblies(); } catch (e) {} 1`); await sleep(200);
const r4b = await tryEv(`(() => ({ locsAfter: window.__locs(), grandAfter: window.__grand(),
  jAfter: VESApp.state.journal.undo.length, label: window.__jtop(1)[0] || null,
  unassignedAfter: VESApp.state.conditions.filter(c => !String(c.location || '').trim()).map(c => c.id),
  c21: String((VESApp.state.conditions.find(x => x.id === 21) || {}).location || ''),
  toast: document.getElementById('toast').textContent }))()`);
let moved4 = [];
if (!r4.error && !r4b.error) {
  const wasBy = new Map(r4.locsBefore.map((p) => [p[0], p[1]]));
  for (const [id, now] of r4b.locsAfter) { const was = wasBy.get(id); if (was !== now) moved4.push(id + ': "' + was + '" -> "' + now + '"'); }
}
const unaAfter = new Set(r4b.unassignedAfter || []);
const r4ok = !r4.error && !r4b.error && tagged === true
  && r4b.c21 === 'Annex' && !unaAfter.has(21)
  && [19, 22, 26].every((i) => unaAfter.has(i))
  && moved4.length === 1
  && r4b.jAfter === r4.jBefore + 1 && /region/i.test(r4b.label || '') && /Annex/.test(r4b.label || '')
  && JSON.stringify(r4.grandBefore) === JSON.stringify(r4b.grandAfter);
check('B2b-4 "Tag by regions" files every unsectioned condition whose measurements sit inside one region (#21 → Annex), leaves the three whose measurements do not (#19, #22, #26) in Unassigned, writes ONE journal entry that names them, and the recap grand total does not move a cent', r4ok,
  { drew: d4, unassignedBefore: r4.unassignedBefore, unassignedAfter: r4b.unassignedAfter, cond21: r4b.c21,
    journalGrew: (r4b.jAfter || 0) - (r4.jBefore || 0), label: r4b.label, moved: moved4,
    grandBefore: r4.grandBefore, grandAfter: r4b.grandAfter, toast: (r4b.toast || '').slice(0, 160) });

/* ════ B2b-5 — a region is editable, and editing it never re-files money; Ctrl+Z ×3 restores it ════ */
await goSheet(3);
const r5a = await tryEv(`(() => { const s = (VESApp.state.sections || []).find(x => x.page === 3) || null;
  return { sec: s ? { id: s.id, name: s.name, points: s.points.map(p => p.slice ? p.slice() : [p.x, p.y]) } : null,
    locs: window.__locs(), count: (VESApp.state.sections || []).length }; })()`);
let r5b = { error: 'no region to edit' };
if (r5a.sec) {
  const chipPt = async (id) => ev(`(() => { const p = VESApp.AP(); const ch = ((p && p.__secChips) || []).find(x => x.id === ${id}); if (!ch) return null;
    const r = p.els.overlay.getBoundingClientRect(); const k = r.width / p.viewport.width;
    return { sx: r.left + (ch.x + ch.w / 2) * k, sy: r.top + (ch.y + ch.h / 2) * k }; })()`);
  await ev(`VESApp.setTool('select'); 1`); await sleep(150);
  const chip0 = await chipPt(r5a.sec.id);
  if (chip0) await clickScreen(chip0.sx, chip0.sy, { wait: 220 });
  const selected = await ev(`(VESApp.state.selectedSectionId == null ? null : VESApp.state.selectedSectionId)`);
  const v0 = r5a.sec.points[0];
  await dragPdf(v0, [v0[0] + 60, v0[1] - 40]);                     // move a vertex with the pointer
  const afterMove = await ev(`(() => { const s = (VESApp.state.sections || []).find(x => x.id === ${r5a.sec.id});
    return { points: s ? s.points.map(p => p.slice ? p.slice() : [p.x, p.y]) : null, locs: window.__locs() }; })()`);
  const chip1 = await chipPt(r5a.sec.id);
  if (chip1) await clickScreen(chip1.sx, chip1.sy, { clickCount: 2, wait: 320 });   // rename: double-click the chip
  const renaming = await ev(`(() => { const m = document.getElementById('secNameModal'); return !!(m && m.classList.contains('open')); })()`);
  if (renaming) { await ev(`(() => { const i = document.getElementById('secNameInput'); if (i) { i.focus(); i.select(); } 1 })()`);
    await typeText('Canopy West'); await clickSel('#secNameOk', 320); }
  const afterRename = await ev(`(() => { const s = (VESApp.state.sections || []).find(x => x.id === ${r5a.sec.id});
    return { name: s ? s.name : null, locs: window.__locs() }; })()`);
  const chip2 = await chipPt(r5a.sec.id);
  if (chip2) await clickScreen(chip2.sx, chip2.sy, { wait: 220 });
  await keyDel();
  const afterDelete = await ev(`({ count: (VESApp.state.sections || []).length, locs: window.__locs(), ids: (VESApp.state.sections || []).map(s => s.id) })`);
  await ctrlZ(); await ctrlZ(); await ctrlZ();
  const restored = await ev(`(() => { const s = (VESApp.state.sections || []).find(x => x.id === ${r5a.sec.id});
    return { present: !!s, name: s ? s.name : null, points: s ? s.points.map(p => p.slice ? p.slice() : [p.x, p.y]) : null, locs: window.__locs() }; })()`);
  r5b = { selected, chipFound: !!chip0, renaming, afterMove, afterRename, afterDelete, restored };
}
const r5ok = !r5b.error && r5b.chipFound === true && r5b.selected === (r5a.sec || {}).id
  && JSON.stringify(r5b.afterMove.points) !== JSON.stringify(r5a.sec.points)
  && r5b.afterRename.name === 'Canopy West'
  && r5b.afterDelete.ids.indexOf(r5a.sec.id) < 0
  && r5b.restored.present === true && r5b.restored.name === 'Canopy'
  && JSON.stringify(r5b.restored.points) === JSON.stringify(r5a.sec.points)
  && [r5b.afterMove, r5b.afterRename, r5b.afterDelete, r5b.restored].every((x) => JSON.stringify(x.locs) === JSON.stringify(r5a.locs));
check('B2b-5 the region is selectable by its chip, a vertex moves under the pointer, the chip renames it and Del removes it — and not one condition\'s section changes through any of it (money never retro-files); Ctrl+Z ×3 puts the region back, name and vertices verbatim', r5ok,
  { before: r5a.sec ? { name: r5a.sec.name, p0: r5a.sec.points[0] } : null, steps: r5b.error ? r5b : {
    selected: r5b.selected, movedTo: r5b.afterMove.points && r5b.afterMove.points[0], renamedTo: r5b.afterRename.name,
    regionsAfterDelete: r5b.afterDelete.count, restored: { present: r5b.restored.present, name: r5b.restored.name, p0: r5b.restored.points && r5b.restored.points[0] },
    sectionsUnchanged: [r5b.afterMove, r5b.afterRename, r5b.afterDelete, r5b.restored].map((x) => JSON.stringify(x.locs) === JSON.stringify(r5a.locs)) } });

/* ════ B2b-7 — the takeoff paper carries the regions; the client papers do not ══════════════════ */
const r7 = await tryEv(`(async () => {
  await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 1600));
  const imgs = [...document.querySelectorAll('#printDoc .tk-sheet img')];
  const takeoff = [];
  for (const im of imgs) takeoff.push(await window.__scanURL(im.getAttribute('src')));
  const html = await VESApp.proposalHTML();
  const psrc = (/<img[^>]+src="([^"]+)"/.exec(html) || [])[1] || null;
  const proposal = psrc ? await window.__scanURL(psrc) : { n: -1, none: true };
  printBidDoc(); const pm = document.getElementById('projModal'); if (pm) pm.classList.remove('open'); printBidDoc();
  await new Promise(r => setTimeout(r, 200));
  const bidImgs = document.querySelectorAll('#printDoc img').length;
  return { sheets: imgs.length, takeoff, proposal, bidImgs, proposalHadFigure: !!psrc };
})()`);
/* A chip can legitimately sit UNDER an area fill — regions paint beneath measurements, which is
   the ruling. So the row asks the honest questions: every sheet that carries a region shows region
   ink, a sheet that carries none shows none, and at least one chip survives at full strength. */
const regionPages = await ev(`[...new Set((VESApp.state.sections || []).map(x => x.page))].sort((a, b) => a - b)`);
const takeoffPages = await ev(`(() => { const live = new Set(VESApp.state.conditions.map(c => c.id));
  return [...new Set(VESApp.state.measurements.filter(m => m.page != null && m.points && m.points.length && live.has(m.conditionId)).map(m => m.page))].sort((a, b) => a - b); })()`);
const perSheet = (takeoffPages || []).map((pg, i) => ({ page: pg, hasRegion: (regionPages || []).indexOf(pg) >= 0, scan: (r7.takeoff || [])[i] || null }));
const withRegion = perSheet.filter((x) => x.hasRegion).length;
const inked = perSheet.filter((x) => x.hasRegion && x.scan && x.scan.n > 0).length;
const bledOntoClean = perSheet.filter((x) => !x.hasRegion && x.scan && x.scan.n > 0).length;
const chips = perSheet.filter((x) => x.hasRegion && x.scan && x.scan.longest >= 20).length;
const r7ok = !r7.error && r7.sheets >= 1 && withRegion >= 1 && inked === withRegion
  && chips >= 1 && bledOntoClean === 0
  && (r7.takeoff || []).length === r7.sheets
  && r7.proposalHadFigure === true && r7.proposal && r7.proposal.n === 0
  && r7.bidImgs === 0;
check('B2b-7 the printed takeoff sheet figure carries the region outline and its chip in the rendered bytes; the proposal\'s plan snapshot carries none of that ink, and the client bid carries no sheet figure at all', r7ok,
  { sheetFigures: r7.sheets, sheetsWithARegion: withRegion, figuresCarryingRegionInk: inked, figuresCarryingAChip: chips,
    inkOnASheetWithNoRegion: bledOntoClean,
    perSheet: perSheet.map((x) => ({ page: x.page, region: x.hasRegion, n: x.scan && x.scan.n, longest: x.scan && x.scan.longest })),
    proposalScan: r7.proposal && { n: r7.proposal.n, longest: r7.proposal.longest }, bidImages: r7.bidImgs, error: r7.error });

/* ════ B2b-6 — v5 round-trips here, and the old build refuses a v5 file loudly ══════════════════ */
const r6 = await tryEv(`(async () => {
  const before = window.__secs();
  const snap = VESApp.snapshot();
  const json = JSON.stringify(snap);
  VESApp.state.sections = [];                     // poke it empty so the reload has something to prove
  VESApp.drawOverlays ? VESApp.drawOverlays() : 0;
  const poked = window.__secs().length;
  VESApp.loadFromData(JSON.parse(json)); await new Promise(r => setTimeout(r, 900));
  const after = window.__secs();
  window.__v5 = json;
  return { version: snap.version, coreVersion: VESApp.core.TAKEOFF_VERSION, before, poked, after,
    savedKey: Array.isArray(snap.sections) ? snap.sections.length : null,
    roundTrip: JSON.stringify(before) === JSON.stringify(after),
    absentOK: (() => { const d = JSON.parse(json); delete d.sections; const n = VESApp.core.normalizeSnapshot(d);
      return !!(n.ok && Array.isArray(n.data.sections) && n.data.sections.length === 0); })() };
})()`);
const v5json = r6.error ? null : await ev('window.__v5');
let oldSide = { harnessError: 'old build not available' };
if (OLD && v5json) {
  try {
    const t = await (await fetch(`http://127.0.0.1:${port}/json/new?file://${OLD}`, { method: 'PUT' })).json();
    const c2 = await connect(t.webSocketDebuggerUrl);
    await c2.send('Runtime.enable');
    const ev2 = async (expr) => { const { result, exceptionDetails } = await c2.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
    for (let i = 0; i < 400; i++) { try { if (await ev2('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
    await c2.send('Runtime.evaluate', { expression: `window.__v5 = ${JSON.stringify(v5json)}; 1`, returnByValue: true });
    oldSide = await ev2(`(() => { const d = JSON.parse(window.__v5);
      const n = VESApp.core.normalizeSnapshot(d);
      document.getElementById('toast').textContent = '';
      VESApp.loadFromData(d);
      return { oldVersion: VESApp.core.TAKEOFF_VERSION, oldBuild: VESApp.VES_BUILD, ok: n.ok, error: n.error || null,
        toast: document.getElementById('toast').textContent, conditionsApplied: VESApp.state.conditions.length }; })()`);
    c2.close();
  } catch (e) { oldSide = { harnessError: String(e.message || e).slice(0, 200) }; }
}
/* DECLARED ROW CHANGE, Batch Q1 (ruling Q1-5), the same shape B1 gave probe-af's AF6 and B4 gave
   probe-b0-fixture's F2: this row pinned the build's format CEILING at 5, and Q1-5 raises it to 6
   for a takeoff that carries a deduct. What the row is ABOUT is unchanged and is checked harder —
   a takeoff with no deduct in it must still SAY 5 (`r6.version === 5`), which is what makes the
   file this row saves readable by every 2.0.0 seat. The ceiling is now read as "at least 5, and
   never below what the file says". */
const r6ok = !r6.error && r6.version === 5 && r6.coreVersion >= 5 && r6.coreVersion >= r6.version && r6.poked === 0
  && (r6.before || []).length > 0 && r6.roundTrip === true && r6.absentOK === true
  && !oldSide.harnessError && oldSide.ok === false && /version 5/.test(oldSide.error || '')
  && /newer than this build/.test(oldSide.error || '') && /version 5/.test(oldSide.toast || '')
  && oldSide.conditionsApplied === 0;
check('B2b-6 a takeoff with no deduct in it still SAYS version 5 (the build understands 5 or newer), regions persist and come back verbatim through save → poke-empty → load (a file without `sections` loads as none), and the rc.3 bytes refuse the v5 file out loud and apply nothing', r6ok,
  { version: r6.version, core: r6.coreVersion, regionsSaved: (r6.before || []).length, pokedToEmpty: r6.poked,
    roundTrip: r6.roundTrip, absentReadsEmpty: r6.absentOK, oldBuild: oldSide, error: r6.error });

/* ════ B2b-8 — the money gates and the batches before this one ═════════════════════════════════ */
const sub = [];
if (NOSUB) {
  check('B2b-8 G0 4/4 · probe-b0-fixture 7/7 · probe-b1-pitch 12/12 · probe-b2a-sections 7/7 — drawing regions moves no money', false,
    { skipped: '--no-subgates was passed; this row proves nothing until it is run without it' });
} else {
  const run = (label, cmd, a) => { const t0 = Date.now();
    const r = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
    const out = String(r.stdout || '') + String(r.stderr || '');
    const pass = (out.match(/^PASS /gm) || []).length, fail = (out.match(/^FAIL /gm) || []).length;
    sub.push({ label, code: r.status, pass, fail, green: /G0 GREEN/.test(out), ms: Date.now() - t0, tail: out.trim().split('\n').slice(-2).join(' | ').slice(0, 200) });
    return r.status === 0; };
  const okG0 = run('g0', 'node', [join(ROOT, 'gate', 'g0.mjs'), 'check', join(ROOT, 'src', 'VES_PM.html')]);
  const okFix = run('probe-b0-fixture', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b0-fixture.mjs'),
    join(ROOT, 'src', 'VES_PM.html'), join(FIXDIR, 'takeoff.v3.json'), join(FIXDIR, 'plan.pdf'), ROOT]);
  const demo = join(ROOT, 'release', 'demo', 'demo-flat-roof.json');
  const okPitch = existsSync(demo)
    ? run('probe-b1-pitch', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b1-pitch.mjs'), join(ROOT, 'src', 'VES_PM.html'), demo, ROOT, FIXDIR])
    : (sub.push({ label: 'probe-b1-pitch', error: 'no demo at ' + demo }), false);
  const okB2a = run('probe-b2a-sections', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b2a-sections.mjs'),
    join(ROOT, 'src', 'VES_PM.html'), join(FIXDIR, 'takeoff.v3.json'), join(FIXDIR, 'plan.pdf'), ROOT]);
  check('B2b-8 G0 4/4 · probe-b0-fixture 7/7 · probe-b1-pitch 12/12 · probe-b2a-sections 7/7 — drawing regions moves no money', okG0 && okFix && okPitch && okB2a, sub);
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b2b-regions: ${results.length - fails}/${results.length} passed, ${fails} failed`);
c.close(); chrome.kill('SIGKILL');
process.exit(fails ? 1 : 0);
