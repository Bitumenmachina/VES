// Mobile feasibility probe: phone profile (390x844, DPR 3) with 4x CPU throttling vs desktop; PDF open + render,
// typed-scale calibration, touch tracing via CDP touch events, native touch pan, lenses at 390px, proposal with snapshot.
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, PDF, PDFD, OUT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); const ls = [];
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, on(f) { ls.push(f); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } for (const f of ls) f(msg); }); }); }
const port = 9700 + Math.floor(Math.random() * 90); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-p4-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 600 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
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
