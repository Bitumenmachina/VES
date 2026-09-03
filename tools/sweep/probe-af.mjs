// Batch AF gate — the click picks what you aimed at (Patrick, 2026-09-03: flashings over field conditions could not be clicked). RED-first on F18.67.
// args: <VES_PM.html> <demo.json> <plan.pdf> <repo root>
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, PDF, ROOT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } })); ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9100 + Math.floor(Math.random() * 40); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-paf-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 600 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const results = []; const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const pdfB64 = readFileSync(PDF).toString('base64');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
await ev(`localStorage.clear(); window.confirmDocumentSwap = () => Promise.resolve(true); 1`);
// one synthetic sheet; a field area A1, a flashing line L1 along A1's top edge, a small area A2 inside A1. Array order puts the big field LAST so the old nearest-wins loop (ties → later) picks it.
const ids = await ev(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); await VESApp.openFromBytes(u8, 'synthetic-plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } VESApp.loadAssembly('tpo'); await new Promise(r => setTimeout(r, 200)); const st = VESApp.state; const area = st.conditions.find(c => c.type === 'area'), lin = st.conditions.find(c => c.type === 'linear'); st.measurements.push({ id: 9101, conditionId: lin.id, page: 1, type: 'linear', points: [{x:200,y:200},{x:1400,y:200}], value: 100, notes: '', manual: false }, { id: 9102, conditionId: area.id, page: 1, type: 'area', points: [{x:400,y:400},{x:700,y:400},{x:700,y:600},{x:400,y:600}], value: 500, notes: '', manual: false }, { id: 9103, conditionId: area.id, page: 1, type: 'area', points: [{x:200,y:200},{x:1400,y:200},{x:1400,y:1000},{x:200,y:1000}], value: 7000, notes: '', manual: false }); VESApp.renderCards(); VESApp.setTool('select'); VESApp.fitToView(VESApp.AP()); await new Promise(r => setTimeout(r, 600)); return { L1: 9101, A2: 9102, A1: 9103, linCond: lin.id, scale: VESApp.AP().viewport.scale }; })()`);
const screenPt = (x, y) => ev(`(() => { const p = VESApp.AP(); const [vx, vy] = p.viewport.convertToViewportPoint(${x}, ${y}); const el = p.els.overlay || p.els.canvas; const r = el.getBoundingClientRect(); return { sx: r.left + vx * (r.width / p.viewport.width), sy: r.top + vy * (r.height / p.viewport.height) }; })()`);
async function clickPdf(x, y) { const { sx, sy } = await screenPt(x, y); for (const type of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: Math.round(sx), y: Math.round(sy), button: 'left', clickCount: 1 }); await sleep(150); return await ev(`({ sel: VESApp.state.selectedId, msg: (document.getElementById('toolMsg') || document.getElementById('toolmsg') || document.getElementById('cmdhint') || { textContent: '' }).textContent.slice(0, 160) })`); }
const e1 = await clickPdf(800, 200);
check('AF1 a click on a flashing line lying on the field area\'s edge selects the LINE (the area\'s interior no longer wins)', e1.sel === ids.L1, { picked: e1.sel, want: ids.L1, msg: e1.msg });
const e2 = await clickPdf(550, 500);
check('AF2 a click inside a small area nested in the field selects the SMALL area', e2.sel === ids.A2, { picked: e2.sel, want: ids.A2 });
const e3 = await clickPdf(550, 500);
check('AF3 a second click on the same spot steps to the field area under it', e3.sel === ids.A1, { picked: e3.sel, want: ids.A1, msg: e3.msg });
const e3b = await clickPdf(550, 500);
check('AF3b a third click wraps back to the small area', e3b.sel === ids.A2, { picked: e3b.sel, want: ids.A2 });
await ev(`VESApp.state.hiddenConds = new Set([${ids.linCond}]); VESApp.renderCards(); 1`);
const e4 = await clickPdf(800, 200);
check('AF4 a hidden condition\'s line is never picked — the edge click falls through to the field area', e4.sel === ids.A1, { picked: e4.sel, want: ids.A1 });
await ev(`VESApp.state.hiddenConds = new Set(); VESApp.renderCards(); 1`);
const e5 = await clickPdf(1200, 850);
check('AF5 a click deep inside the field, away from every edge, still selects the field', e5.sel === ids.A1, { picked: e5.sel, want: ids.A1 });
const e6 = await clickPdf(2000, 1500);
check('AF6 a click on empty sheet selects nothing', e6.sel == null, { picked: e6.sel });
const fails = results.filter(r => !r.ok).length; console.log(`\nprobe-af: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
