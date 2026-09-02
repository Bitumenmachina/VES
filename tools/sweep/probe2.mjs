import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map();
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9600 + Math.floor(Math.random() * 300); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-p2-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 600 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
await c.send('Page.navigate', { url: 'file://' + process.argv[2] }); for (let i = 0; i < 200; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(100); }
const demo = readFileSync(process.argv[3], 'utf8');
const out = await ev(`(async () => { const App = VESApp; window.print = () => { window.__printed = (window.__printed||0)+1; }; App.loadFromData(${demo}); await new Promise(r => setTimeout(r, 400));
  const o = {};
  printBidDoc(); o.firstBid = { projModalOpen: document.getElementById('projModal').classList.contains('open'), printDocText: document.getElementById('printDoc').textContent.trim().slice(0, 160), printed: window.__printed || 0, toast: document.getElementById('toast').textContent };
  App.closeProjModal && App.closeProjModal(); document.getElementById('projModal').classList.remove('open');
  printBidDoc(); o.secondBid = { rows: document.querySelectorAll('#printDoc .divblock tbody tr').length, printed: window.__printed || 0 };
  const res = App.resolveAssembly(); const tgt = res.lines.find(l => l.item === 'tpo.membrane');
  o.membraneBefore = { qtyNeeded: tgt.qtyNeeded, ordered: tgt.ordered, waste: tgt.itemWaste, coverage: tgt.coverage };
  editLine('tpo.membrane', 'waste', 0.15); const t2 = App.resolveAssembly().lines.find(l => l.item === 'tpo.membrane');
  o.membraneAfterWaste15 = { qtyNeeded: t2.qtyNeeded, ordered: t2.ordered, waste: t2.itemWaste, override: App.state.assemblyProject.lineOverrides['tpo.membrane'] };
  editLine('tpo.membrane', 'waste', 0.30); const t3 = App.resolveAssembly().lines.find(l => l.item === 'tpo.membrane'); o.membraneAfterWaste30 = { ordered: t3.ordered, waste: t3.itemWaste };
  // bid row for the membrane after waste 30%: does Qty x Unit reproduce Amount (D-26.4)?
  printBidDoc(); const tr = [...document.querySelectorAll('#printDoc .divblock tbody tr')].find(r => /^TPO Membrane$/i.test(r.children[1].textContent.trim())); const td = [...tr.children].map(x => x.textContent.trim()); o.membraneBidRow = td; const num = s => +s.replace(/[$,]/g,''); o.membraneRowMultiplies = Math.abs(num(td[3]) * num(td[5]) - num(td[6])) < 0.01 * num(td[3]) + 0.01;
  // undo depth: how many undos to get back, and what does the journal call them
  o.journal = App.state.journal.undo.map(j => j.label);
  // exact quantity override then the bid says "measured scope" or the override?
  editLine('tpo.membrane', 'qty', 7); printBidDoc(); const tr2 = [...document.querySelectorAll('#printDoc .divblock tbody tr')].find(r => /^TPO Membrane$/i.test(r.children[1].textContent.trim())); o.membraneBidRowAfterQtyOv = [...tr2.children].map(x => x.textContent.trim());
  o.gridRowAfterQtyOv = (() => { App.showEstimate(true); App.renderEstimateGrid(); const r = [...document.querySelectorAll('#estgridBody tr')].find(tr => /TPO Membrane/i.test(tr.textContent)); const inputs = r ? [...r.querySelectorAll('input')].map(i => ({ f: i.dataset.field, v: i.value, ov: i.classList.contains('ov') })) : null; App.showEstimate(false); return inputs; })();
  return o; })()`);
console.log(JSON.stringify(out, null, 1)); c.close(); chrome.kill('SIGKILL');
