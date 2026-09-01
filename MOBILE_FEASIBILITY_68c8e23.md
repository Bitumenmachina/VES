# Mobile feasibility — VES F18.58 in the field

Companion to `SWEEP_68c8e23.md`. Same seat, same tags (**OBS** observed here · **INF** inferred · **STD** documented
platform behavior · **null** not checked). Every number below comes from the shipped bytes driven in headless Chromium 141
under device emulation with CPU throttling; no real phone was used (see §7). Acceptance is Patrick's word alone.

## 1 · The answer in four lines
1. **Read and review on a phone: feasible today, with one gesture.** Tap **Hide** on the rail and the sheet, the bid, the
   proposal (with its plan snapshot), the estimate grid and the exports menu all work at 390 px. At rest, without Hide,
   the sheet is a 68 px sliver and nothing measurable fits. OBS.
2. **Measure on a phone: possible, not the lane.** With the rail hidden a two-tap trace lands within 0.5 ft of a 111 ft
   line at fit zoom; each CSS pixel is ~1 ft, so tapping precision, not the engine, is the limit. Zooming in to fix that
   costs 10–20 s per re-raster on a phone-class CPU and allocates 64-megapixel canvases. OBS.
3. **A tablet is the real-time-file device with zero build.** Everything fits, traces land within 0.6%, the recap's three
   document buttons are reachable. OBS.
4. **Printed PDFs stay the field artifact until two small build items land** (rail collapsed at rest under 720 px; touch
   targets) — and a delivery route for the file that is not the public Pages copy is chosen (§5).

## 2 · What was measured (OBS, `probe4.mjs` / `probe5.mjs`, Appendix)
Profiles: phone 390×844 DPR 3 with 4× CPU throttle · tablet 820×1180 DPR 2 with 2× · desktop 1440×900 unthrottled.
Fixture: the synthetic demo takeoff plus a synthetic 36×24 in vector plan (`synthetic-plan.pdf`, 49,974 B, 1,500 segments;
a dense variant, 1,284,543 B, 40,000 segments). No client data. Calibration typed as 1/8" = 1'.

| measure | phone 4× | tablet 2× | desktop |
|---|---|---|---|
| file → `VESApp` ready | 870 ms | 219 ms | 161 ms |
| demo takeoff load → first paint | 625 ms | 163 ms | 32 ms |
| open 50 KB plan → first raster | 861 ms | 507 ms | 154 ms |
| open 1.28 MB dense plan → first raster | 1,217 ms | 516 ms | 226 ms |
| fit zoom / sheet size on screen | 5% · 130×86 px (rail open) · 302×201 px (rail hidden) | 13–14% · 340×227 px | 38% · 986×657 px |
| re-raster at 200% zoom | **20.8 s** (64 MP cap, outScale 1.89) | 10.1 s (64 MP) | 0.48 s (17.9 MP) |
| re-raster at 400% zoom | 9.4 s | 4.6 s | 4.1 s (64 MP) |
| feet per CSS pixel at fit | 2.22 (rail open) · 0.95 (hidden) · 0.79 (landscape) | 0.85 | — |
| two-tap trace of a 111.11 ft line | fails at rest (2nd tap lands outside the 68 px column) · **110.62 ft** rail hidden · landscape: taps not registered (cause not established) | 111.81 ft | 111.23 ft |
| proposal HTML with plan snapshot | 72 ms, 67 KB, 47 KB PNG | 26 ms | — |
| bid rows / total vs recap | 21 rows, $63,331.73 = recap | 21, $63,342.42 = recap | — |
| estimate grid | 25 rows, table 681 px in a 409 px viewport, horizontal scroll inside `.gscroll`, footer on screen, 56 editable cells **22 px tall** | fits (776 px) | fits |
| Files & exports menu | fits portrait (250×672, 12 items, smallest target **28 px**) · **does not fit landscape** (672 > 390) | fits | fits |
| project / identity modal | fits (409×709, 12 inputs) | fits | fits |
| recap drawer + 3 document buttons | not rendered with the rail hidden · landscape: panel at y = −113 (off-screen) | in viewport, buttons 32 px tall | in viewport |
| native touch drag pans the sheet | 0 px (column too narrow) | 28 px | 13 px |
| synthetic pinch | out of bounds | app zoom 0.141 → 0.149, page scale unchanged | app zoom 0.375 → 0.416 |
| JS heap after all of it | 11 MB | 11 MB | 11 MB (canvas bitmaps are outside the heap) |
| console errors | 0 | 0 | 0 |
| autosave slot written | `ves:auto:392968b0`, 4 KB | same | same |

Code facts behind the numbers (OBS, line numbers in `src/VES_PM.html`): `MAX_PIXELS = 64e6` per canvas (4023) and three
canvases per pane (back, visible, overlay: 4752–4800) → up to 768 MB of bitmap at deep zoom; touch pointers are refused for
grip-drag and manual pan (5518) but the overlay `click` handler places trace points from a tap (5556); only two width media
rules exist, 720 px and 1319 px (396, 1458); `#dock` has `min-width: 280px` (1417); the viewport meta allows pinch (line 5).

## 3 · Field review — what works, what does not (phone, rail hidden unless noted)

| field task | phone | tablet | evidence |
|---|---|---|---|
| Open the takeoff you left at the desk | works if the JSON and the same PDF are on the device (identity gate re-attaches; F18.5 door) | same | OBS door read; **null** on a real phone file picker |
| Read quantities per condition (rail cards) | works with rail open; sheet then unusable — toggle | works, both at once | OBS |
| Read the sell / recap / margins | works (HUD + grid footer); drawer only with rail open | works | OBS |
| Check a line on the estimate grid, turn a line off, change a unit price | works; cells 22 px tall — fat-finger risk (STD 44 px guideline) | works | OBS |
| Add a typed quantity from the site (＋ line, manual qty) | works (entry row, project modal fit) | works | OBS |
| Trace a new measurement on the plan | at fit: ±1 ft per tap; zoom to 200% costs ~20 s per raster | at fit ±0.85 ft/tap; 200% ~10 s | OBS |
| Move a vertex, pan with a drag while measuring | **no** — touch is refused for grips and manual pan; native scroll pans | no / native scroll | OBS 5518 |
| Print the bid from the phone | `window.print` → the phone's print/share sheet (STD); layout is page-based | same | **null** on device |
| Client proposal | opens a new tab (`window.open`); snapshot renders (72 ms) | same | OBS render; **null** pop-up policy on mobile Safari |
| Exports (CSV/XLSX/JSON) | download via Blob link — lands in the phone's Downloads (STD) | same | **null** on device |
| Landscape phone | sheet is bigger (364×243) but the exports menu overflows and the recap panel is off-screen | n/a | OBS |
| Autosave between visits | per browser origin; iOS Safari may evict script-written storage after 7 days without use (STD, ITP) | same | STD |

## 4 · ROI — printed reports vs the live file in the field
No dollar or hour figures are asserted here; those are Patrick's inputs. The frame:

**What a printed set gives you today** (bid + cost sheet + proposal with plan snapshot, all from the desk): zero device
risk, every number frozen at print time, readable in sun, markable with a pen. Cost: the round trip — every field
observation is a pen note that someone re-keys at the desk, and the client never sees a revised number on site.

**What the live file gives you** (phone with Hide, or a tablet): the same numbers plus the ability to (a) turn a line off
or change a quantity and see the sell move on the spot, (b) type a field-measured quantity into the engine, (c) print or
share the revised bid before leaving. Cost: the file has to be on the device with its PDF; edits made in the field must
travel back by hand (Save JSON → send → open over the desk copy; no merge, last writer wins); glare and battery; the
two build items in §6 before a phone is comfortable.

**Decision rule (INF):** the live file pays for itself on visits where a number changes on site — a scope walk with the
client, a re-measure, a substitution. On visits that only confirm the paper, print. In practice: tablet for scope walks
where a revised figure is worth saying out loud; phone for reading and the occasional line toggle; paper as the fallback
that never fails. Inputs Patrick can fill in: visits per month where a figure changes · the re-key cost per visit ·
the value of a same-day revised bid · the device he already carries.

| | printed set | phone (today, Hide) | phone (after §6 items) | tablet (today) |
|---|---|---|---|---|
| read the numbers | ✓ | ✓ | ✓ | ✓ |
| see the plan with markup | ✓ (snapshot) | ✓ small | ✓ | ✓ |
| change a line / quantity on site | ✗ | ✓ (fiddly) | ✓ | ✓ |
| re-measure on site | ✗ | ±1 ft/tap | ±1 ft/tap (zoom slow) | ±0.85 ft/tap |
| revised bid to the client on site | ✗ | ✓ via share sheet (null on device) | ✓ | ✓ |
| gets the edit back to the desk | pen → re-key | Save JSON → send | same | same |
| build items required | 0 | 0 | 2 (+1 optional) | 0 |

## 5 · Delivery routes for the file (the part that is a ruling, not a build)
- **R1 · File on the device.** Android Chrome opens a local `.html` from a file manager with JS and `localStorage`
  (STD). iOS: a local `.html` from Files opens in Quick Look; whether JS runs there is **not verified** by this seat
  (null) — treat iPhone-as-file-host as unproven.
- **R2 · Hosted copy over https.** Today that copy exists: the public GitHub Pages URL (SWEEP F-01), which anyone can use.
  A private host (Pages on a private repo needs a paid GitHub plan — STD; or a laptop serving the file over a phone
  hotspot with `python3 -m http.server`, which the app's own banner already suggests). "Add to Home Screen" works without
  a service worker but the 3.5 MB file reloads from the host each cold start; offline needs a service worker, which the
  verifier flags as egress by design — so **offline-install is not a free step**.
- **R3 · Printed PDFs.** No route needed.

The zero-egress invariant is about what the file does, not where it is served from; R2 does not change the bytes. The
public-vs-private question is F-01's ruling.

## 6 · Build items a phone lane would need (proposals; none drafted, none landed)
1. **Rail collapsed at rest under 720 px** (one `@media` rule + the existing Hide state as default; keep the rail one tap
   away). Surface: CSS + `toggleRail` default. Threatens nothing in money. Evidence: phone screenshot with a ≥300 px sheet at rest.
2. **Touch targets on the two money surfaces**: estimate-grid cells (22 px) and exports-menu items (28 px) to ≥ 40 px on
   coarse pointers (`@media (pointer: coarse)`). Surface: CSS. Evidence: measured heights.
3. *(optional)* **Lower `MAX_PIXELS` on coarse-pointer devices** (e.g. 16e6) so deep zoom re-rasters in seconds, not
   tens of seconds, and never asks a phone for 768 MB of canvas. Surface: one constant, device-conditional. Threatens
   nothing in money; softer raster at extreme zoom on phones only.
4. *(optional)* **Landscape phone**: exports menu max-height with scroll; recap panel anchoring at short heights (C-N1 class).
5. *(queued, not for this lane)* the mobile field-companion gate as NOTES.md carries it.

## 7 · What this does not prove
- No physical phone or tablet: iOS Safari canvas limits, pop-up handling for the proposal tab, the print/share sheet, file
  picker behavior for JSON + PDF, storage eviction, sunlight readability — all **null**.
- Landscape-phone taps did not register at the computed coordinates; the cause was not established (could be the
  emulated bar geometry). Not a finding, a hole.
- Real plan PDFs are raster scans of 5–50 MB; the synthetic plan is vector. Parse time on a phone for a scanned set is null.
- Throttling factors (4×, 2×) are proxies for device class, not measurements of any device.

## Appendix — probe sources
`mkpdf.mjs` builds the synthetic plan; `probe4.mjs` and `probe5.mjs` are the runs. Run:
`VES_CHROME=<chrome> node probe4.mjs <abs src> <abs demo json> <abs plan.pdf> <abs dense.pdf> <out>` and
`VES_CHROME=<chrome> node probe5.mjs <abs src> <abs plan.pdf> <out>`.

### mkpdf.mjs
```js
// Synthetic 36x24in "plan" PDF: vector paths only, no fonts, no client data. Output: absolute path arg.
import { writeFileSync } from 'node:fs';
const W = 2592, H = 1728; let s = '';
s += '1 w 0.6 G\n'; for (let x = 72; x < W; x += 72) s += `${x} 0 m ${x} ${H} l S\n`; for (let y = 72; y < H; y += 72) s += `0 ${y} m ${W} ${y} l S\n`;
s += '3 w 0 G\n'; s += `200 200 m 1400 200 l 1400 900 l 900 900 l 900 1300 l 200 1300 l h S\n`; s += `1500 300 m 2300 300 l 2300 1400 l 1500 1400 l h S\n`;
s += '1.5 w 0.3 G\n'; let seed = 7; const r = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
for (let i = 0; i < 1500; i++) { const x = 200 + r() * 2100, y = 200 + r() * 1300; s += `${x.toFixed(1)} ${y.toFixed(1)} m ${(x + r() * 120).toFixed(1)} ${(y + r() * 120).toFixed(1)} l S\n`; }
s += '0 0 1 RG 4 w 300 1500 m 1300 1500 l S\n'; // a 1000-unit "dimension line" for calibration
const objs = [];
objs.push('<< /Type /Catalog /Pages 2 0 R >>'); objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources << >> >>`); objs.push(`<< /Length ${Buffer.byteLength(s)} >>\nstream\n${s}endstream`);
let out = '%PDF-1.4\n'; const offs = [];
objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
const xref = Buffer.byteLength(out); out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(process.argv[2], out); console.log('wrote', process.argv[2], Buffer.byteLength(out), 'bytes');
```

### probe4.mjs
```js
// Mobile feasibility probe: phone profile (390x844, DPR 3) with 4x CPU throttling vs desktop; PDF open + render,
// typed-scale calibration, touch tracing via CDP touch events, native touch pan, lenses at 390px, proposal with snapshot.
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, PDF, PDFD, OUT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); const ls = [];
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, on(f) { ls.push(f); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } for (const f of ls) f(msg); }); }); }
const port = 9700 + Math.floor(Math.random() * 90); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-p4-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 150 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable'); const errs = [];
c.on((m) => { if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 200)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('console.error ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 200)); });
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const demo = readFileSync(DEMO, 'utf8'); const pdfB64 = readFileSync(PDF).toString('base64'); const pdfDB64 = readFileSync(PDFD).toString('base64');
const shot = async (n) => { const { data } = await c.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n + '.png'), Buffer.from(data, 'base64')); };
async function scenario(label, metrics, throttle) {
  const R = { label, throttle }; errs.length = 0;
  if (metrics) await c.send('Emulation.setDeviceMetricsOverride', metrics); else await c.send('Emulation.clearDeviceMetricsOverride');
  if (metrics && metrics.mobile) await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); else await c.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await c.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  const t0 = Date.now(); await c.send('Page.navigate', { url: 'file://' + VES }); let ready = false; for (let i = 0; i < 600; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { ready = true; break; } } catch (_) {} await sleep(50); }
  R.msToReady = Date.now() - t0; R.ready = ready;
  await ev(`window.print = () => {}; window.__demo = ${demo}; loadFromData.confirmed = true; 1`);
  R.demoLoadMs = await ev(`(async () => { const t = performance.now(); VESApp.loadFromData(window.__demo); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return Math.round(performance.now() - t); })()`);
  // open the synthetic PDF through the app's own door (the guard is passed by confirming the swap)
  for (const [name, b64] of [['synthetic-plan.pdf', pdfB64], ['synthetic-plan-dense.pdf', pdfDB64]]) {
    const r = await ev(`(async () => { const bin = atob('${b64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const prevOk = window.confirmDocumentSwap; window.confirmDocumentSwap = () => Promise.resolve(true);
      const t = performance.now(); await VESApp.openFromBytes(u8, '${name}'); const tOpen = performance.now() - t;
      let waited = 0; while (!(VESApp.AP().viewport) && waited < 60000) { await new Promise(r => setTimeout(r, 50)); waited += 50; }
      const tRender = performance.now() - t; const p = VESApp.AP(); const cv = p.els.canvas;
      window.confirmDocumentSwap = prevOk;
      return { name, bytes: u8.length, msOpen: Math.round(tOpen), msFirstRaster: Math.round(tRender), numPages: VESApp.state.numPages, zoom: +p.zoom.toFixed(3), cssSize: [Math.round(p.viewport.width), Math.round(p.viewport.height)], canvasPx: [cv.width, cv.height], megapixels: +((cv.width * cv.height) / 1e6).toFixed(1), outScale: +p.oScale.toFixed(3), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }; })()`);
    R['pdf_' + (name.includes('dense') ? 'dense' : 'light')] = r;
    if (!name.includes('dense')) {
      // zoom to 200% and 400%: re-raster time and canvas cap
      for (const z of [2, 4]) { R['zoom' + z] = await ev(`(async () => { const p = VESApp.AP(); const t = performance.now(); VESApp.setZoom(p, ${z}); let w = 0; while ((p.renderTask || Math.abs(p.zoom - ${z}) > 0.001 || !p.viewport || Math.abs(p.viewport.scale - ${z}) > 0.001) && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } const cv = p.els.canvas; return { ms: Math.round(performance.now() - t), canvasPx: [cv.width, cv.height], megapixels: +((cv.width * cv.height) / 1e6).toFixed(1), outScale: +p.oScale.toFixed(3), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }; })()`); }
      await ev(`VESApp.fitToView(VESApp.AP()); new Promise(r => setTimeout(r, 800))`);
      // typed-scale calibration then touch tracing
      R.calibration = await ev(`(() => { const parsed = VESApp.parseScale('1/8" = 1\\''); VESApp.applyScaleCalibration(parsed, 1); const c = VESApp.state.calibrations[1]; return { parsed, ftPerUnit: c && c.ftPerUnit, typed: c && c.typed }; })()`);
      const tp = await ev(`(async () => { const App = VESApp; App.loadAssembly('tpo'); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 100))); const cond = App.state.conditions.find(x => x.libRef === 'tpo.dripedge'); App.activateCondition(cond); await new Promise(r => setTimeout(r, 100)); const p = App.AP(); const o = p.els.overlay; const rect = o.getBoundingClientRect(); const toCss = (pt) => { const [x, y] = p.viewport.convertToViewportPoint(pt.x, pt.y); return { x: rect.left + x, y: rect.top + y }; }; return { tool: App.state.tool, armed: App.state.activeCond && App.state.activeCond.name, rect: { l: rect.left, t: rect.top, w: rect.width, h: rect.height }, pts: [toCss({ x: 300, y: 1500 }), toCss({ x: 1300, y: 1500 })], innerW: innerWidth, innerH: innerHeight }; })()`);
      R.touchSetup = tp;
      const tap = async (x, y) => { await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(40); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(120); };
      const inView = tp.pts.every(p => p.x >= 0 && p.x < tp.innerW && p.y >= 0 && p.y < tp.innerH);
      R.touchPointsInView = inView;
      if (inView) { await tap(tp.pts[0].x, tp.pts[0].y); const afterOne = await ev(`({ draft: VESApp.state.draft && VESApp.state.draft.points.length, meas: VESApp.state.measurements.length })`); await tap(tp.pts[1].x, tp.pts[1].y); const afterTwo = await ev(`({ draft: VESApp.state.draft && VESApp.state.draft.points.length, meas: VESApp.state.measurements.length })`);
        const fin = await ev(`(() => { VESApp.finishDraft(); const m = VESApp.state.measurements[VESApp.state.measurements.length - 1]; return { meas: VESApp.state.measurements.length, lastValueFt: m && m.value && +m.value.toFixed(2), lastType: m && m.type, lastPoints: m && m.points && m.points.length, toast: document.getElementById('toast').textContent, liveVal: (document.getElementById('liveVal') || {}).textContent }; })()`);
        R.touchTrace = { afterOneTap: afterOne, afterTwoTaps: afterTwo, afterFinish: fin }; }
      await shot(label + '-plan'); 
      // native touch pan: drag on the sheet, does the wrap scroll?
      const pan = await ev(`(() => { const p = VESApp.AP(); const w = p.els.wrap; w.scrollLeft = 0; w.scrollTop = 0; const r = p.els.overlay.getBoundingClientRect(); return { x: Math.round(r.left + Math.min(r.width, innerWidth - r.left) / 2), y: Math.round(r.top + Math.min(r.height, innerHeight - r.top) / 2), sw: w.scrollWidth, cw: w.clientWidth }; })()`);
      await ev('VESApp.setTool("select")');
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pan.x, y: pan.y }] }); for (let i = 1; i <= 8; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pan.x - i * 12, y: pan.y - i * 8 }] }); await sleep(16); } await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(300);
      R.touchPan = { ...pan, after: await ev(`({ scrollLeft: VESApp.AP().els.wrap.scrollLeft, scrollTop: VESApp.AP().els.wrap.scrollTop, measurements: VESApp.state.measurements.length })`) };
      // pinch: synthetic two-finger pinch via Input.synthesizePinchGesture — does the page zoom (viewport meta allows) and does the app react?
      let pinch = null; try { const before = await ev('({ vv: visualViewport.scale, zoom: VESApp.AP().zoom })'); await c.send('Input.synthesizePinchGesture', { x: pan.x, y: pan.y, scaleFactor: 2, relativeSpeed: 400 }); await sleep(600); pinch = { before, after: await ev('({ vv: visualViewport.scale, zoom: VESApp.AP().zoom })') }; } catch (e) { pinch = 'unsupported: ' + String(e).slice(0, 80); } R.pinch = pinch;
      await c.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 }).catch(() => {});
    }
  }
  // lenses at this width
  R.estimateLens = await ev(`(async () => { VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200)); const t = document.querySelector('#estgridBody').closest('table'); const sc = t && t.closest('.gscroll, .estgrid-scroll, [style*=overflow], div'); const foot = document.getElementById('estgridFoot'); const fr = foot && foot.getBoundingClientRect(); const rows = document.querySelectorAll('#estgridBody tr').length; const tw = t && t.getBoundingClientRect().width; let scroller = t; while (scroller && getComputedStyle(scroller).overflowX !== 'auto' && getComputedStyle(scroller).overflowX !== 'scroll') scroller = scroller.parentElement; return { rows, tableWidth: Math.round(tw), innerWidth, horizontalScroller: scroller ? (scroller.id || scroller.className) : null, footer: fr && { y: Math.round(fr.y), h: Math.round(fr.height), inViewport: fr.bottom <= innerHeight && fr.top >= 0 }, footText: foot && foot.textContent.replace(/\\s+/g, ' ').trim().slice(0, 120) }; })()`);
  await shot(label + '-estimate');
  await ev('VESApp.showEstimate(false)');
  R.drawer = await ev(`(async () => { VESApp.openDrawer(); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 200)); const b = document.getElementById('drawerBody'); const r = b && b.getBoundingClientRect(); return { rect: r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, inViewport: r && r.top >= 0 && r.bottom <= innerHeight, buttons: [...b.querySelectorAll('button')].filter(x => x.offsetParent).length }; })()`);
  await shot(label + '-drawer'); await ev('VESApp.collapseDrawer()');
  R.schedule = await ev(`(async () => { VESApp.showSchedule(true); VESApp.renderSchedule(); await new Promise(r => setTimeout(r, 150)); const h = document.getElementById('schedBody'); const r = h.getBoundingClientRect(); const out = { rows: h.querySelectorAll('.sched-row').length, width: Math.round(r.width), nameColPx: 220 }; VESApp.showSchedule(false); return out; })()`);
  R.proposal = await ev(`(async () => { const t = performance.now(); const h = await VESApp.proposalHTML(); const d = new DOMParser().parseFromString(h, 'text/html'); return { ms: Math.round(performance.now() - t), htmlKB: Math.round(h.length / 1024), snapshot: !!d.querySelector('.pviz img'), snapshotFailed: !!d.querySelector('.pviz-miss'), legend: d.querySelectorAll('.lgi').length, sell: (d.querySelector('.big') || d.querySelector('tr.tot .n') || {}).textContent }; })()`);
  R.bid = await ev(`(() => { printBidDoc(); document.getElementById('projModal').classList.remove('open'); printBidDoc(); return { rows: document.querySelectorAll('#printDoc .divblock tbody tr').length, total: (document.querySelector('#printDoc .total-line .n') || {}).textContent }; })()`);
  R.heapMB = await ev('performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null');
  R.errors = errs.slice(); return R;
}
const out = {};
out.phoneThrottled4x = await scenario('phone', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, 4);
out.tabletThrottled2x = await scenario('tablet', { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true }, 2);
out.desktop = await scenario('desktop', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, 1);
writeFileSync(join(OUT, 'probe4-report.json'), JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1)); c.close(); chrome.kill('SIGKILL');
```

### probe5.mjs
```js
// Mobile feasibility, pass 2: a priced takeoff ON a real (synthetic) sheet, phone with the rail hidden, landscape phone,
// exports menu / project modal fit, proposal snapshot on the sheet, bid rows — all on the throttled phone profile.
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, PDF, OUT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); const ls = [];
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, on(f) { ls.push(f); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } for (const f of ls) f(msg); }); }); }
const port = 9800 + Math.floor(Math.random() * 90); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-p5-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 150 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable'); const errs = [];
c.on((m) => { if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 200)); });
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const pdfB64 = readFileSync(PDF).toString('base64'); const shot = async (n) => { const { data } = await c.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n + '.png'), Buffer.from(data, 'base64')); };
const tap = async (x, y) => { await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(40); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(150); };
async function setup(metrics, throttle) { errs.length = 0; await c.send('Emulation.setDeviceMetricsOverride', metrics); await c.send('Emulation.setTouchEmulationEnabled', { enabled: !!metrics.mobile, maxTouchPoints: 5 }); await c.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 600; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
  return ev(`(async () => { window.print = () => {}; const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); await VESApp.openFromBytes(u8, 'synthetic-plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
    VESApp.applyScaleCalibration(VESApp.parseScale('1/8" = 1\\''), 1); VESApp.loadAssembly('tpo'); VESApp.addManualQuantity('tpo.field', 3150.8); VESApp.setProjectMeta({ name: 'Synthetic Field Review', client: 'Synthetic Client', preparedBy: { company: 'Synthetic Roofing Co', name: 'Sample Estimator' } });
    VESApp.state.assemblyProject.settings = { overheadPct: 10, markupPct: 8, profitPct: 5 }; VESApp.renderCards(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 200)));
    return { sell: +VESApp.recapModel().sell.toFixed(2), lines: VESApp.recapModel().lineCount }; })()`); }
async function traceDripEdge(label) {
  const tp = await ev(`(async () => { const App = VESApp; const cond = App.state.conditions.find(x => x.libRef === 'tpo.dripedge'); App.activateCondition(cond); await new Promise(r => setTimeout(r, 100)); const p = App.AP(); const rect = p.els.overlay.getBoundingClientRect(); const wrap = p.els.wrap.getBoundingClientRect(); const toCss = (pt) => { const [x, y] = p.viewport.convertToViewportPoint(pt.x, pt.y); return { x: rect.left + x, y: rect.top + y }; }; return { zoom: +p.zoom.toFixed(3), sheetCss: [Math.round(rect.width), Math.round(rect.height)], wrapCss: [Math.round(wrap.width), Math.round(wrap.height)], pts: [toCss({ x: 300, y: 1500 }), toCss({ x: 1300, y: 1500 })], innerW: innerWidth, innerH: innerHeight, ftPerCssPx: +((1 / p.viewport.scale) * App.state.calibrations[1].ftPerUnit).toFixed(2) }; })()`);
  const inView = tp.pts.every(p => p.x >= 0 && p.x < tp.innerW && p.y >= 0 && p.y < tp.innerH); let trace = null;
  if (inView) { await tap(tp.pts[0].x, tp.pts[0].y); await tap(tp.pts[1].x, tp.pts[1].y); trace = await ev(`(() => { const d = VESApp.state.draft && VESApp.state.draft.points.length; VESApp.finishDraft(); const m = VESApp.state.measurements[VESApp.state.measurements.length - 1]; return { draftPointsBeforeFinish: d, measurements: VESApp.state.measurements.length, valueFt: m && m.value != null && +m.value.toFixed(2), expectedFt: 111.11 }; })()`); }
  else await ev('VESApp.setTool("select")');
  return { ...tp, pointsInView: inView, trace };
}
async function surfaces(label) {
  const R = {};
  R.proposal = await ev(`(async () => { const t = performance.now(); const h = await VESApp.proposalHTML(); const d = new DOMParser().parseFromString(h, 'text/html'); const img = d.querySelector('.pviz img'); return { ms: Math.round(performance.now() - t), htmlKB: Math.round(h.length / 1024), snapshot: !!img, snapshotPngKB: img ? Math.round(img.getAttribute('src').length * 3 / 4 / 1024) : 0, failed: !!d.querySelector('.pviz-miss'), legend: [...d.querySelectorAll('.lgi')].map(l => l.textContent), sell: (d.querySelector('.big') || d.querySelector('tr.tot .n') || {}).textContent, toast: document.getElementById('toast').textContent }; })()`);
  R.bid = await ev(`(() => { printBidDoc(); const gate = document.getElementById('projModal').classList.contains('open'); document.getElementById('projModal').classList.remove('open'); if (gate) printBidDoc(); return { identityGateFired: gate, rows: document.querySelectorAll('#printDoc .divblock tbody tr').length, total: (document.querySelector('#printDoc .total-line .n') || {}).textContent }; })()`);
  R.exportsMenu = await ev(`(async () => { setDataMenu(true); await new Promise(r => setTimeout(r, 100)); const m = document.getElementById('dataMenu'); const r = m.getBoundingClientRect(); const items = [...m.querySelectorAll('button, a, [role=menuitem]')].filter(b => b.offsetParent); const out = { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, fits: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, items: items.length, smallestTargetPx: Math.min(...items.map(b => Math.round(b.getBoundingClientRect().height))) }; return out; })()`);
  await shot(label + '-exports'); await ev('setDataMenu(false)');
  R.projModal = await ev(`(async () => { VESApp.openProjModal(); await new Promise(r => setTimeout(r, 100)); const m = document.querySelector('#projModal .modal, #projModal > div') || document.getElementById('projModal'); const r = m.getBoundingClientRect(); const out = { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, fits: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, inputs: m.querySelectorAll('input,textarea').length }; document.getElementById('projModal').classList.remove('open'); return out; })()`);
  R.estimate = await ev(`(async () => { VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200)); const t = document.querySelector('#estgridBody').closest('table'); const foot = document.getElementById('estgridFoot'); const inputs = [...document.querySelectorAll('#estgridBody input.recap-edit')]; const hs = inputs.map(i => Math.round(i.getBoundingClientRect().height)); return { rows: document.querySelectorAll('#estgridBody tr').length, tableWidth: Math.round(t.getBoundingClientRect().width), innerWidth, editableCells: inputs.length, cellHeightPx: hs.length ? Math.min(...hs) : null, foot: foot.textContent.replace(/\\s+/g, ' ').trim().slice(0, 100) }; })()`);
  await shot(label + '-estimate'); await ev('VESApp.showEstimate(false)');
  R.drawer = await ev(`(async () => { VESApp.openDrawer(); VESApp.setRecapTab('summary'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 200)); const b = document.getElementById('drawerBody'); const r = b.getBoundingClientRect(); const btns = [...b.querySelectorAll('button')].filter(x => x.offsetParent).map(x => ({ t: x.textContent.trim().slice(0, 18), fits: x.getBoundingClientRect().right <= innerWidth, h: Math.round(x.getBoundingClientRect().height) })); return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, inViewport: r.top >= 0 && r.bottom <= innerHeight, buttons: btns, sellText: (document.querySelector('#drawerBody .sell, #drawerBody .rs-sell') || {}).textContent }; })()`);
  await shot(label + '-drawer'); await ev('VESApp.collapseDrawer()');
  R.autosave = await ev(`(async () => { markDirty(); await new Promise(r => setTimeout(r, 1200)); const ks = []; for (let i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i)); return ks.filter(k => k.startsWith('ves:auto')).map(k => ({ k, kb: Math.round(localStorage.getItem(k).length / 1024) })); })()`);
  R.errors = errs.slice(); return R;
}
const out = {};
// Phone portrait, rail visible (rest state)
out.phoneRest = { ...(await setup({ width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, 4)) }; out.phoneRest.trace = await traceDripEdge('phone-rest'); await shot('phone-rest-plan');
// Phone portrait, rail hidden (the app's own Hide control)
out.phoneRailHidden = await ev(`(async () => { VESApp.toggleRail(false); await new Promise(r => setTimeout(r, 300)); VESApp.fitToView(VESApp.AP()); let w = 0; while ((VESApp.AP().renderTask) && w < 20000) { await new Promise(r => setTimeout(r, 50)); w += 50; } await new Promise(r => setTimeout(r, 300)); const p = VESApp.AP(); const wr = p.els.wrap.getBoundingClientRect(); return { railOpen: VESApp.state.railOpen, wrapCss: [Math.round(wr.width), Math.round(wr.height)], zoom: +p.zoom.toFixed(3) }; })()`);
out.phoneRailHidden.trace = await traceDripEdge('phone-hidden'); await shot('phone-hidden-plan'); Object.assign(out.phoneRailHidden, await surfaces('phone-hidden'));
// Phone landscape
out.phoneLandscape = { ...(await setup({ width: 844, height: 390, deviceScaleFactor: 3, mobile: true }, 4)) }; out.phoneLandscape.trace = await traceDripEdge('phone-land'); await shot('phone-land-plan'); Object.assign(out.phoneLandscape, await surfaces('phone-land'));
// Tablet portrait for the same surfaces
out.tablet = { ...(await setup({ width: 820, height: 1180, deviceScaleFactor: 2, mobile: true }, 2)) }; out.tablet.trace = await traceDripEdge('tablet'); Object.assign(out.tablet, await surfaces('tablet'));
writeFileSync(join(OUT, 'probe5-report.json'), JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1)); c.close(); chrome.kill('SIGKILL');
```
