// Batch X gate — "the absence stated + no lockup" (PASS_2026-09 rows T1, T2). RED-first on F18.60.
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, PDFDENSE, ROOT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } })); ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9450 + Math.floor(Math.random() * 40); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-px-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 150 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const results = []; const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const pdfB64 = readFileSync(PDFDENSE).toString('base64');
async function load(metrics, throttle) { if (metrics) await c.send('Emulation.setDeviceMetricsOverride', metrics); else await c.send('Emulation.clearDeviceMetricsOverride'); await c.send('Emulation.setTouchEmulationEnabled', { enabled: !!(metrics && metrics.mobile), maxTouchPoints: 5 }); await c.send('Emulation.setCPUThrottlingRate', { rate: throttle }); await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); } await ev('window.print = () => {}; loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true); 1'); }
// T1 — the absence stated, on the landing and in the README
await load(null, 1);
const landing = await ev(`(document.querySelector('.empty-safe') || {}).textContent || ''`);
const T1 = (t) => /no seat fee/i.test(t) && /no (per-)?report fee/i.test(t) && /no device limit/i.test(t) && /no login/i.test(t);
check('X1 landing states: no seat fee, no report fee, no device limit, no login', T1(landing), landing.slice(0, 200));
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8').replace(/\s+/g, ' ');
check('X2 README states the same four absences', T1(readme));
// T2 — no lockup: dense synthetic sheet (40k segments) on a 4x-throttled phone profile and on desktop
async function openDense(label) {
  return ev(`(async () => { const u8 = new Uint8Array(await (await fetch('data:application/pdf;base64,${pdfB64}')).arrayBuffer());   // native decode, outside the measurement
    await new Promise(r => setTimeout(r, 200));
    const tasks = []; let po = null; try { po = new PerformanceObserver((l) => { for (const e of l.getEntries()) tasks.push(Math.round(e.duration)); }); po.observe({ type: 'longtask', buffered: false }); } catch (_) {}
    const t0 = performance.now(); await VESApp.openFromBytes(u8, 'dense.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 60000) { await new Promise(r => setTimeout(r, 25)); w += 25; } const ms = Math.round(performance.now() - t0);
    await new Promise(r => setTimeout(r, 300)); if (po) po.disconnect();
    return { msToFirstRaster: ms, longestTaskMs: tasks.length ? Math.max(...tasks) : 0, longTasks: tasks.length, observerAvailable: !!po, segments: 40000 }; })()`);
}
await load({ width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, 4);
const p4 = await openDense('phone');
check('X3 phone 4x: 40k-segment sheet reaches first raster under 2 s', p4.msToFirstRaster < 2000, p4);
check('X4 phone 4x: no main-thread task over 200 ms during open + raster (input never blocked)', p4.observerAvailable && p4.longestTaskMs <= 200, p4);
await load(null, 1);
const d1 = await openDense('desktop');
check('X5 desktop: first raster under 1 s and no task over 200 ms', d1.msToFirstRaster < 1000 && d1.longestTaskMs <= 200, d1);
const fails = results.filter(r => !r.ok).length; console.log(`\nprobe-x: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
