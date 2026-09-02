// Batch AC gate — the phone consequences of the UI scale (P-GAME rows G1–G7): client paper ignores the UI scale;
// on a narrow / coarse-pointer viewport the scale is clamped so every control, the exports menu and the money peek
// stay on screen; the scale is reachable from the exports menu on a phone. RED-first on F18.63.
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, ROOT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } })); ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9200 + Math.floor(Math.random() * 40); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-pac-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 600 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const results = []; const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const demo = readFileSync(DEMO, 'utf8');
async function load(metrics, coarse) { if (metrics) await c.send('Emulation.setDeviceMetricsOverride', metrics); else await c.send('Emulation.clearDeviceMetricsOverride'); await c.send('Emulation.setTouchEmulationEnabled', { enabled: !!coarse, maxTouchPoints: 5 }); await c.send('Emulation.setEmulatedMedia', { features: coarse ? [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }] : [] }); await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); } await ev(`localStorage.removeItem('ves:prefs'); window.print = () => {}; window.__demo = ${demo}; loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true); VESApp.loadFromData(window.__demo); 1`); await sleep(500); }
// AC1 — client paper does not follow the UI scale
await load({ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, false);
await ev(`VESApp.setProjectMeta({ name: 'Demo', preparedBy: { company: 'Synthetic Roofing Co', name: 'Sample Estimator' } }); 1`);
const pages = async (z) => { await ev(`setUiScale(${z}); printBidDoc(); document.getElementById('projModal').classList.remove('open'); printBidDoc(); 1`); await sleep(200); const { data } = await c.send('Page.printToPDF', { printBackground: false, preferCSSPageSize: true }); const txt = Buffer.from(data, 'base64').toString('latin1'); return (txt.match(/\/Type\s*\/Page[^s]/g) || []).length; };
const p1 = await pages(1), p15 = await pages(1.5);
check('AC1 the printed bid has the same page count at UI scale 100% and 150% (paper ignores the UI scale)', p1 === p15 && p1 > 0, { pagesAt1: p1, pagesAt1_5: p15 });
await ev('setUiScale(1); 1');
// AC2 — phone: the scale is clamped so the rail's controls, the exports menu and the money peek stay on screen
await load({ width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, true);
const ph = await ev(`(async () => { const applied = setUiScale(1.5); await new Promise(r => setTimeout(r, 150)); toggleRail(true); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 100)));
  const inV = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; };
  const card = document.querySelector('#cards .card'); const ctl = card ? [...card.querySelectorAll('button')] : []; const ctlIn = ctl.length > 0 && ctl.every(inV);
  const hide = document.getElementById('railCollapse'); const hideIn = inV(hide);
  setDataMenu(true); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 120))); const m = document.getElementById('dataMenu'); const mr = m.getBoundingClientRect(); const items = [...m.querySelectorAll('button')].filter(b => b.offsetParent); const menuOk = mr.top >= 0 && mr.bottom <= innerHeight && mr.right <= innerWidth + 1 && (items.every(inV) || (m.scrollHeight > m.clientHeight && getComputedStyle(m).overflowY === 'auto')); setDataMenu(false);
  showMoneyPeek(card); const pk = document.getElementById('moneyPeek'); const peekIn = inV(pk); hideMoneyPeek();
  return { applied, label: (document.getElementById('btnUiScale') || {}).textContent, ctlIn, hideIn, menuOk, peekIn, zoom: document.documentElement.style.zoom }; })()`);
check('AC2 phone: asking for 150% applies a clamped scale and every card control, Hide, the exports menu and the money peek stay inside the viewport', ph.applied <= 1.16 && ph.ctlIn && ph.hideIn && ph.menuOk && ph.peekIn, ph);
const lo = await ev(`(() => { const a = setUiScale(0.9); const cells = 40; return { applied: a, coarse: matchMedia('(pointer: coarse)').matches }; })()`);
check('AC3 phone (coarse pointer): 90% is refused — the scale never goes below 100% where the 40 px targets are the floor', lo.applied >= 1, lo);
const menuItem = await ev(`(async () => { setUiScale(1); setDataMenu(true); await new Promise(r => setTimeout(r, 100)); const b = document.getElementById('btnMenuScale'); const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'; }; const visibleOpen = vis(b); const before = document.documentElement.style.zoom || '1'; if (b) b.click(); await new Promise(r => setTimeout(r, 100)); const after = document.documentElement.style.zoom || '1'; setDataMenu(false); return { present: !!b, visible: visibleOpen, before, after, label: b && b.textContent.replace(/\\s+/g, ' ').trim() }; })()`);
check('AC4 phone: the exports menu carries a "Text size" item that cycles the UI scale (the toolbar control sits in the hidden sliver)', menuItem.present && menuItem.visible && menuItem.before !== menuItem.after, menuItem);
await ev('setUiScale(1); 1');
// AC5 — desktop keeps the full range
await load({ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, false);
const dk = await ev(`({ hi: setUiScale(1.5), lo: setUiScale(0.9), back: setUiScale(1) })`);
check('AC5 desktop: 150% and 90% remain available', dk.hi === 1.5 && dk.lo === 0.9, dk);
const fails = results.filter(r => !r.ok).length; console.log(`\nprobe-ac: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
