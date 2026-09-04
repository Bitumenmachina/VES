// Batch U gate — U1: the Unlink freeze keeps the quantity the line was priced on, says what it did, and is undoable.
// Reproduces research/READINESS_ad07fff.md §2 (U1) from the UI's own controls: SSMR field 1,000 SF typed, pitch 6/12 on
// the card's ✎ editor (store B), "＋ labor" on the Standing Seam Panel row, ✓ Add at $2.50, then the labor card's Unlink.
// RED-first on F18.66: the freeze wrote the FLAT 1,000 (engine had priced 1,118.03), sell moved 80506.89 → 80138.80
// silently, the journal stayed at depth 1 and Ctrl+Z removed the whole line.
//   node tools/sweep/probe-u.mjs <ves.html> <demo.json> <repo root>      exit 0 pass / 1 findings / 2 harness
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, , ROOT] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } })); ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9100 + Math.floor(Math.random() * 40); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-pu-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 600 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const results = []; const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
async function load() { await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); } await ev('localStorage.clear(); 1'); await sleep(300); }
const near = (a, b, eps = 0.005) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < eps;
await load();
// Build the §2 state through the UI's own doors and link a labor line to the pitched field.
const linked = await ev(`(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 1000); await wait(150);
  const proj = VESApp.state.assemblyProject; proj.settings = proj.settings || {}; proj.settings.overheadPct = 10; proj.settings.markupPct = 8; proj.settings.profitPct = 5;
  const pitch = setConditionPitch('ssmr.field', '6/12');
  const src = VESApp.state.conditions.find(x => x.libRef === 'ssmr.field');
  const roll = VESCore.rollup([src], VESApp.state.measurements.filter(m => m.conditionId === src.id))[0];
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(200);
  const laddm = [...document.querySelectorAll('#estgridBody .laddm')].find(b => b.dataset.src != null && /Standing Seam Panel/i.test(b.dataset.lab || ''));
  if (!laddm) return { error: 'no ＋ labor button on the Standing Seam Panel row' };
  laddm.click(); await wait(150);
  document.getElementById('gePrice').value = '2.50'; commitGridEntry(); await wait(200);
  const lab = VESApp.state.conditions.find(x => x.adhoc && x.qtyLink);
  if (!lab) return { error: 'no linked labor condition after ✓ Add' };
  const line = resolveAssembly().lines.find(l => (l.drivingRefs || []).includes(lab.libRef));
  VESApp.showEstimate(false); await wait(100);
  return { pitch, srcRaw: roll.quantity, srcPriced: dispQtyOf(roll, src).qty, labId: lab.id, labName: lab.name, engineQty: line && line.ordered, extended: line && line.extended, sell: VESApp.recapModel().sell, journalDepth: VESApp.state.journal.undo.length };
})()`);
if (linked.error) { console.error('HARNESS FAIL:', linked.error); c.close(); chrome.kill('SIGKILL'); process.exit(2); }
check('U0 control: a ＋labor line linked to a 6/12 library source is priced on the pitched quantity (NEW-2 holds)', near(linked.engineQty, linked.srcPriced) && near(linked.srcPriced, 1118.0339887) && near(linked.extended, 2795.0849719), linked);
// The labor card's ✎ → Unlink
const unlinked = await ev(`(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms)); const lab = VESApp.state.conditions.find(x => x.id === ${linked.labId});
  const card = document.querySelector('.card[data-cid="' + lab.id + '"]'); const pen = card && [...card.querySelectorAll('button')].find(b => b.textContent.trim() === '\u270e');
  if (pen) pen.click(); else openCondPopover(lab.id); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 200)));
  const ub = [...document.querySelectorAll('#depthPanel button, #cards button')].find(b => b.textContent.trim() === 'Unlink');
  if (!ub) return { error: 'no Unlink button in the card editor' };
  const title = ub.title; ub.click(); await wait(250);
  const own = VESApp.state.measurements.find(m => m.conditionId === lab.id && m.manual);
  const line = resolveAssembly().lines.find(l => (l.drivingRefs || []).includes(lab.libRef));
  return { title, qtyLink: lab.qtyLink, value: own && own.value, engineQty: line && line.ordered, extended: line && line.extended, sell: VESApp.recapModel().sell, hud: document.getElementById('hudSell').textContent, toast: document.getElementById('toast').textContent, journalDepth: VESApp.state.journal.undo.length, top: VESApp.state.journal.undo.length ? VESApp.state.journal.undo[VESApp.state.journal.undo.length - 1].label : null };
})()`);
if (unlinked.error) { console.error('HARNESS FAIL:', unlinked.error); c.close(); chrome.kill('SIGKILL'); process.exit(2); }
check('U1a after Unlink the frozen measurement IS the quantity the line was priced on (1,118.03, not the flat 1,000) and the line\'s cost does not move', unlinked.qtyLink == null && near(unlinked.value, linked.srcPriced) && near(unlinked.engineQty, linked.engineQty) && near(unlinked.extended, linked.extended), { value: unlinked.value, engineQty: unlinked.engineQty, extended: unlinked.extended, title: unlinked.title });
check('U1b sell is unchanged across the Unlink (the control\'s own promise: "the current quantity freezes")', near(unlinked.sell, linked.sell), { before: +linked.sell.toFixed(2), after: +unlinked.sell.toFixed(2), hud: unlinked.hud });
check('U1c the Unlink says what it did — the toast names the frozen quantity', /unlink/i.test(unlinked.toast) && /1,118\.0/.test(unlinked.toast), { toast: unlinked.toast });
check('U1d the Unlink is on the journal under its own name', unlinked.journalDepth === linked.journalDepth + 1 && /unlink/i.test(unlinked.top || ''), { before: linked.journalDepth, after: unlinked.journalDepth, top: unlinked.top });
const undone = await ev(`(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms)); const lab = VESApp.state.conditions.find(x => x.id === ${linked.labId});
  VESApp.undo(); await wait(150);
  const own = VESApp.state.measurements.find(m => m.conditionId === lab.id && m.manual);
  const line = resolveAssembly().lines.find(l => (l.drivingRefs || []).includes(lab.libRef));
  const u = { stillExists: VESApp.state.conditions.includes(lab), qtyLink: lab.qtyLink, value: own && own.value, engineQty: line && line.ordered, sell: VESApp.recapModel().sell };
  VESApp.redo(); await wait(150);
  const line2 = resolveAssembly().lines.find(l => (l.drivingRefs || []).includes(lab.libRef));
  const r = { qtyLink: lab.qtyLink, value: own && own.value, engineQty: line2 && line2.ordered, sell: VESApp.recapModel().sell };
  return { undo: u, redo: r };
})()`);
check('U1e Ctrl+Z restores the link (the line stays, follows its source again, sell unchanged); redo re-freezes at the priced quantity', undone.undo.stillExists && undone.undo.qtyLink != null && near(undone.undo.engineQty, linked.engineQty) && near(undone.undo.sell, linked.sell) && undone.redo.qtyLink == null && near(undone.redo.value, linked.srcPriced) && near(undone.redo.sell, linked.sell), undone);
// The statements that called the freeze safe: the qty-link site's comment must not claim the engine pitches the frozen measurement again.
const src = readFileSync(join(ROOT, 'src', 'VES_PM.html'), 'utf8');
check('U1f the qty-link comment no longer asserts "writes a MEASUREMENT the engine pitches again"', !/writes a MEASUREMENT the engine pitches again/.test(src), { present: /writes a MEASUREMENT the engine pitches again/.test(src) });
// Control — the grid entry row's ✕ (geUnlink) leaves a box the estimator types into, and what is typed is what is priced (the :9482 statement).
await load();
const typed = await ev(`(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 1000); await wait(150); setConditionPitch('ssmr.field', '6/12');
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(200);
  const laddm = [...document.querySelectorAll('#estgridBody .laddm')].find(b => b.dataset.src != null && /Standing Seam Panel/i.test(b.dataset.lab || '')); laddm.click(); await wait(150);
  const x = document.getElementById('geUnlink'); const disabledBefore = document.getElementById('geQty').disabled; if (x) x.click(); await wait(100);
  const q = document.getElementById('geQty'); const enabledAfter = !q.disabled; q.value = '777'; document.getElementById('gePrice').value = '2.50'; commitGridEntry(); await wait(200);
  const lab = VESApp.state.conditions.find(x => x.adhoc && /labor/.test(x.name)); const line = resolveAssembly().lines.find(l => (l.drivingRefs || []).includes(lab.libRef));
  return { disabledBefore, enabledAfter, qtyLink: lab.qtyLink, engineQty: line && line.ordered, extended: line && line.extended };
})()`);
check('U1g control: the entry row\'s ✕ leaves an editable quantity, and the typed value is what the line is priced on (no link)', typed.disabledBefore && typed.enabledAfter && typed.qtyLink == null && near(typed.engineQty, 777) && near(typed.extended, 1942.5), typed);
const fails = results.filter(r => !r.ok).length; console.log(`\nprobe-u: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
