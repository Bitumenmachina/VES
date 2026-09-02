// Batch Y gate — "feedback and latency" (PASS_2026-09 rows G1, G2). Measures, then asserts. RED-first on F18.61.
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, PDF, ROOT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } })); ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9350 + Math.floor(Math.random() * 40); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-py-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 600 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const results = []; const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const demo = readFileSync(DEMO, 'utf8'); const pdfB64 = readFileSync(PDF).toString('base64');
async function load(metrics, throttle, coarse) { if (metrics) await c.send('Emulation.setDeviceMetricsOverride', metrics); else await c.send('Emulation.clearDeviceMetricsOverride'); await c.send('Emulation.setTouchEmulationEnabled', { enabled: !!coarse, maxTouchPoints: 5 }); await c.send('Emulation.setEmulatedMedia', { features: coarse ? [{ name: 'pointer', value: 'coarse' }] : [] }); await c.send('Emulation.setCPUThrottlingRate', { rate: throttle }); await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); } await ev(`window.print = () => {}; window.__demo = ${demo}; loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true); 1`); }
// G2 — a sell change is perceivable within 200 ms on every money face that is on screen
const G2 = `(async () => { VESApp.loadFromData(window.__demo); await new Promise(r => setTimeout(r, 500));
  const faces = { hudSell: () => (document.querySelector('#hud') || {}).textContent, sellStrip: () => (document.getElementById('sellVal') || document.querySelector('.sell') || {}).textContent, gridFoot: () => (document.getElementById('estgridFoot') || {}).textContent, recap: () => (document.getElementById('recapBody') || {}).textContent };
  const measure = async (label, act, wantFaces) => { const before = {}; for (const k of wantFaces) before[k] = faces[k](); const t0 = performance.now(); act(); const seen = {}; let w = 0; while (w < 1500 && Object.keys(seen).length < wantFaces.length) { await new Promise(r => requestAnimationFrame(r)); for (const k of wantFaces) if (!(k in seen) && faces[k]() !== before[k]) seen[k] = Math.round(performance.now() - t0); w = performance.now() - t0; } return { label, ms: seen, missing: wantFaces.filter(k => !(k in seen)) }; };
  const out = [];
  out.push(await measure('plan lens: editLine unit_cost', () => editLine('tpo.membrane', 'unit_cost', 1999), ['hudSell']));
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200));
  out.push(await measure('estimate lens: editLine unit_cost', () => editLine('tpo.membrane', 'unit_cost', 2100), ['gridFoot']));
  out.push(await measure('estimate lens: margin input', () => { const i = document.getElementById('mkPct') || document.getElementById('muPct'); i.value = '15'; i.dispatchEvent(new Event('input', { bubbles: true })); }, ['gridFoot']));
  VESApp.showEstimate(false); VESApp.openDrawer(); VESApp.setRecapTab('summary'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 200));
  out.push(await measure('plan lens + recap open: setLineOmit', () => setLineOmit('tpo.membrane', true), ['hudSell', 'recap']));
  VESApp.collapseDrawer(); return out; })()`;
// G1 — a trace point's first paint within one frame of the click at fit zoom
const G1 = `(async () => { const u8 = new Uint8Array(await (await fetch('data:application/pdf;base64,${pdfB64}')).arrayBuffer()); await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } await new Promise(r => setTimeout(r, 300));
  VESApp.applyScaleCalibration(VESApp.parseScale('1/8" = 1\\''), 1); VESApp.loadAssembly('tpo'); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 100)));
  const cond = VESApp.state.conditions.find(x => x.libRef === 'tpo.dripedge'); VESApp.activateCondition(cond); await new Promise(r => setTimeout(r, 100));
  const p = VESApp.AP(); const o = p.els.overlay; const rect = o.getBoundingClientRect(); const pt = (x, y) => { const [vx, vy] = p.viewport.convertToViewportPoint(x, y); return { x: rect.left + vx, y: rect.top + vy }; };
  const samples = []; const pts = [pt(300, 1500), pt(700, 1500), pt(1100, 1500)];
  for (const q of pts) { const before = VESApp.state.draft ? VESApp.state.draft.points.length : 0; const t0 = performance.now(); o.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: q.x, clientY: q.y })); const tHandler = performance.now() - t0; await new Promise(r => requestAnimationFrame(r)); const tFrame = performance.now() - t0; const after = VESApp.state.draft ? VESApp.state.draft.points.length : 0; samples.push({ handlerMs: +tHandler.toFixed(2), toNextFrameMs: +tFrame.toFixed(1), pointAdded: after === before + 1 }); }
  VESApp.finishDraft(); return { zoom: +p.zoom.toFixed(3), samples, maxHandlerMs: Math.max(...samples.map(s => s.handlerMs)) }; })()`;
await load({ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, 1, false);
const g2d = await ev(G2);
check('Y1 desktop: every on-screen money face repaints within 200 ms of a sell change (editLine, margin input, line off)', g2d.every(o => o.missing.length === 0 && Object.values(o.ms).every(v => v <= 200)), g2d);
const g1d = await ev(G1);
check('Y2 desktop: a trace point is placed and painted within 16 ms of the click at fit zoom', g1d.samples.every(s => s.pointAdded) && g1d.maxHandlerMs <= 16, g1d);
await load({ width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, 4, true);
const g2p = await ev(G2);
check('Y3 phone 4x: every on-screen money face repaints within 200 ms of a sell change', g2p.every(o => o.missing.length === 0 && Object.values(o.ms).every(v => v <= 200)), g2p);
const g1p = await ev(G1);
check('Y4 phone 4x: trace point handler under 16 ms and painted by the next frame', g1p.samples.every(s => s.pointAdded) && g1p.maxHandlerMs <= 16, g1p);
const fails = results.filter(r => !r.ok).length; console.log(`\nprobe-y: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
