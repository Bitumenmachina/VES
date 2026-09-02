// Batch Z gate — "glanceable money" (PASS_2026-09 row G6): hover / long-press on a condition card shows its priced lines
// and its share of the sell without leaving the sheet. RED-first on F18.61.
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, ROOT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } })); ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9300 + Math.floor(Math.random() * 40); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-pz-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 150 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const results = []; const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const demo = readFileSync(DEMO, 'utf8');
async function load(metrics, coarse) { if (metrics) await c.send('Emulation.setDeviceMetricsOverride', metrics); else await c.send('Emulation.clearDeviceMetricsOverride'); await c.send('Emulation.setTouchEmulationEnabled', { enabled: !!coarse, maxTouchPoints: 5 }); await c.send('Emulation.setEmulatedMedia', { features: coarse ? [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }] : [] }); await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); } await ev(`window.print = () => {}; window.__demo = ${demo}; loadFromData.confirmed = true; VESApp.loadFromData(window.__demo); 1`); await sleep(500); }
const cardRect = async (libRef) => ev(`(() => { const c = VESApp.state.conditions.find(x => x.libRef === '${libRef}'); const el = document.querySelector('.card[data-cid="' + c.id + '"]'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 14, w: r.width, name: c.name }; })()`);
const peek = () => ev(`(() => { const p = document.getElementById('moneyPeek'); if (!p || p.hidden || !p.offsetParent && getComputedStyle(p).display === 'none') return { visible: false }; const r = p.getBoundingClientRect(); return { visible: r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, text: p.textContent.replace(/\\s+/g, ' ').trim().slice(0, 400), rows: p.querySelectorAll('.mp-row').length, lens: { grid: document.body.classList.contains('grid-mode') && !!document.getElementById('gridview') && document.getElementById('gridview').offsetParent !== null, drawer: document.body.classList.contains('drawer-open') } }; })()`);
// ---- desktop: hover
await load({ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, false);
const before = await ev(`({ grid: document.body.className, sell: VESApp.recapModel().sell })`);
const r1 = await cardRect('tpo.field');
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r1.x, y: r1.y }); await sleep(600);
const p1 = await peek();
check('Z1 desktop: hovering the measured field condition shows a peek with its priced lines, a sell figure and a share of the total', p1.visible && p1.rows >= 3 && /\$[\d,]+\.\d\d/.test(p1.text) && /\d+(\.\d)?\s?% of/.test(p1.text) && p1.text.includes(r1.name), p1);
const after = await ev(`({ grid: document.body.className, sell: VESApp.recapModel().sell })`);
check('Z2 desktop: the peek changes no lens and no money (body classes and sell identical)', before.grid === after.grid && before.sell === after.sell && !(p1.lens && p1.lens.grid), { before, after });
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 20, y: 400 }); await sleep(250);
const p2 = await peek();
check('Z3 desktop: moving off the card hides the peek', !p2.visible, p2);
const consistency = await ev(`(async () => { if (typeof moneyPeekModel !== 'function') return { defined: false }; const m = VESApp.recapModel(); let condSell = 0; for (const c of VESApp.state.conditions) { const pm = moneyPeekModel(c); condSell += pm.sell || 0; } const fixed = fixedAllowance().sell; return { defined: true, condSell: +condSell.toFixed(2), fixed: +fixed.toFixed(2), recapSell: +m.sell.toFixed(2), diff: +(condSell + fixed - m.sell).toFixed(2) }; })()`);
check('Z4 the per-condition sells plus the fixed allowances reproduce the recap sell to the cent (no line counted twice, none lost)', consistency.defined && Math.abs(consistency.diff) < 0.005, consistency);
// ---- phone: long-press
await load({ width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, true);
await ev('toggleRail(true); 1'); await sleep(300);
const r2 = await cardRect('tpo.field');
await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r2.x, y: r2.y }] }); await sleep(700);
const p3 = await peek();
check('Z5 phone: a long-press on the card shows the peek inside the viewport', p3.visible && p3.rows >= 3, p3);
await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(250);
const p4 = await peek(); const armed = await ev('VESApp.state.activeCond ? VESApp.state.activeCond.name : null');
check('Z6 phone: lifting the finger hides the peek and the long-press did not arm or select anything', !p4.visible && armed === null, { p4, armed });
const fails = results.filter(r => !r.ok).length; console.log(`\nprobe-z: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
