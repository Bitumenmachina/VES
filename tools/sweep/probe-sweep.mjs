// Sweep probe: drives the shipped file through raw CDP in the cloud Chromium.
// Lenses: mobile/tablet load, estimator flow on the synthetic demo, bid/proposal parity,
// ingress hostility (string quantities), HTML-injection sinks, proposal print-color test.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
const CHROME = process.env.VES_CHROME; const VES = process.argv[2]; const OUT = process.argv[3];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function connect(url) { return new Promise((resolve, reject) => {
  const ws = new WebSocket(url); let id = 0; const pending = new Map(); const listeners = [];
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, on(fn) { listeners.push(fn); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws error')));
  ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); return msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } for (const fn of listeners) fn(msg); });
}); }
const port = 9300 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), 'ves-sweep-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 150 && !wsUrl; i++) { try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = list.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl);
await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
const consoleErrs = [];
c.on((m) => { if (m.method === 'Runtime.exceptionThrown') consoleErrs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300)); if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) consoleErrs.push(m.params.type + ' ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrs.push('LOG ' + m.params.entry.text.slice(0, 300)); });
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const url = 'file://' + VES; const report = {};
async function load(label, metrics) {
  if (metrics) await c.send('Emulation.setDeviceMetricsOverride', metrics); else await c.send('Emulation.clearDeviceMetricsOverride');
  consoleErrs.length = 0; const t0 = Date.now();
  await c.send('Page.navigate', { url });
  let ready = false; for (let i = 0; i < 300; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { ready = true; break; } } catch (_) {} await sleep(100); }
  const t1 = Date.now();
  await ev('new Promise(r=>setTimeout(r,800))');
  const info = await ev(`(() => { const se = document.scrollingElement; const tb = document.getElementById('toolbar'); const vis = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), offRight: Math.round(r.right - innerWidth) }; };
    const btns = [...document.querySelectorAll('#toolbar button')].filter(b => b.offsetParent !== null).map(b => ({ t: (b.textContent||'').trim().slice(0,14), r: vis(b) }));
    return { innerWidth, innerHeight, dpr: devicePixelRatio, scrollW: se.scrollWidth, scrollH: se.scrollHeight, bodyOverflowX: se.scrollWidth > innerWidth, toolbar: vis(tb), rail: vis(document.getElementById('rail')), dock: vis(document.getElementById('dock')), visibleToolbarButtons: btns.length, offRightButtons: btns.filter(b => b.r.offRight > 0).map(b => b.t), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null, build: window.VESApp.VES_BUILD, resumeCards: document.querySelectorAll('.rl-card').length }; })()`);
  const { data } = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, `shot-${label}.png`), Buffer.from(data, 'base64'));
  report[label] = { ready, msToReady: t1 - t0, ...info, consoleErrors: consoleErrs.slice() };
}
await load('desktop-1440', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await load('phone-390', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await load('tablet-820', { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
await load('flow', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
// ---------------- estimator flow on the synthetic demo ----------------
const demo = readFileSync(process.argv[4], 'utf8');
consoleErrs.length = 0;
await ev(`window.print = () => { window.__printed = (window.__printed||0)+1; }; window.__demo = ${demo}; VESApp.loadFromData(window.__demo); new Promise(r=>setTimeout(r,400))`);
const flow = await ev(`(async () => {
  const App = VESApp, out = {};
  const money = (v) => VESCore.fmtMoney(v);
  const snap = () => { const m = App.recapModel(); return { lines: m.lineCount, cost: +m.cost.toFixed(2), sell: +m.sell.toFixed(2), off: m.off, excluded: m.excluded.length }; };
  out.afterLoad = snap();
  const res = App.resolveAssembly();
  out.engine = { lines: res.lines.length, included: res.lines.filter(l => l.included).length, gated: res.lines.filter(l => l.gate).map(l => l.item + ': ' + l.matchStatus), warnings: res.warnings };
  out.rollup = VESCore.rollup(App.state.conditions, App.state.measurements).map(r => ({ name: r.name, qty: r.quantity, unit: r.unit, count: r.count }));
  // bid parity: every row Qty×Unit≈Amount, subtotals sum, total == recap sell
  const parseBid = () => { printBidDoc(); const doc = document.getElementById('printDoc'); const rows = [...doc.querySelectorAll('.divblock tbody tr')].filter(tr => !tr.classList.contains('grand')).map(tr => { const td = [...tr.children].map(x => x.textContent.trim()); return { desc: td[1], qty: td[3], unit: td[4], rate: td[5], amt: td[6] }; }); const subs = [...doc.querySelectorAll('tr.grand')].map(tr => tr.lastElementChild.textContent.trim()); const num = (s) => +String(s).replace(/[$,]/g, ''); const rowChecks = rows.map(r => { const q = num(r.qty), u = num(r.rate), a = num(r.amt); return { desc: r.desc, q, u, a, prod: +(q*u).toFixed(2), diff: +((q*u) - a).toFixed(2) }; }); const total = subs.length ? num(subs[subs.length - 1]) : null; const divSum = subs.slice(0, -1).reduce((s, x) => s + num(x), 0); const lineSum = rowChecks.reduce((s, r) => s + r.a, 0); return { rows: rowChecks, subtotals: subs, total, divSumMatchesTotal: Math.abs(divSum - total) < 0.005, lineSumMatchesTotal: Math.abs(lineSum - total) < 0.005, recapSell: +App.recapModel().sell.toFixed(2), totalMatchesRecap: Math.abs(total - +App.recapModel().sell.toFixed(2)) < 0.005, notIncluded: [...doc.querySelectorAll('.exclsec li')].map(li => li.textContent), printed: window.__printed }; };
  out.bid0 = parseBid();
  // proposal parity
  const ph = await App.proposalHTML(); const pdoc = new DOMParser().parseFromString(ph, 'text/html');
  const pm = App.proposalModel();
  out.proposal = { sell: +pm.sell.toFixed(2), matchesRecap: Math.abs(pm.sell - App.recapModel().sell) < 1e-9, scope: [...pdoc.querySelectorAll('section.scope li')].map(li => li.textContent.trim()), invest: (pdoc.querySelector('.big') || pdoc.querySelector('tr.tot .n') || {}).textContent, notIncluded: [...pdoc.querySelectorAll('ul.excl li')].map(li => li.textContent), hasSnapshot: !!pdoc.querySelector('.pviz'), legendItems: pdoc.querySelectorAll('.lgi').length, htmlLen: ph.length };
  window.__proposalHTML = ph;
  // assembly toggle: turn the field membrane material OFF, then undo
  const field = res.lines.find(l => l.kind === 'material' && l.included && l.drivingRefs.includes('tpo.field'));
  out.toggleTarget = field && field.item;
  setLineOmit(field.item, true); out.afterOff = snap(); out.bidOff = { total: parseBid().total, notIncludedHasIt: parseBid().notIncluded.some(n => /membrane|field/i.test(n)) };
  App.undo(); out.afterUndo = snap();
  // exact-quantity override + waste edit on a material line, then re-check bid row multiplication
  const tgt = res.lines.find(l => l.kind === 'material' && l.included && l.drivingRefs.length === 1 && !l.qtyOverridden);
  out.editTarget = tgt && { item: tgt.item, ordered: tgt.ordered, unit: tgt.unit, waste: tgt.itemWaste, unitCost: tgt.unitCost };
  editLine(tgt.item, 'waste', 0.15); out.afterWaste = snap();
  const b1 = parseBid(); out.bidAfterWaste = { total: b1.total, totalMatchesRecap: b1.totalMatchesRecap, worstRowDiff: Math.max(...b1.rows.map(r => Math.abs(r.diff))), rows: b1.rows.filter(r => Math.abs(r.diff) > 0.01) };
  editLine(tgt.item, 'qty', 123); out.afterQtyOv = snap();
  const b2 = parseBid(); out.bidAfterQtyOv = { total: b2.total, totalMatchesRecap: b2.totalMatchesRecap, worstRowDiff: Math.max(...b2.rows.map(r => Math.abs(r.diff))), rows: b2.rows.filter(r => Math.abs(r.diff) > 0.01), theRow: b2.rows.find(r => /membrane/i.test(r.desc)) };
  App.undo(); App.undo(); out.afterUndo2 = snap();
  // margins: set OH/MU/PR and confirm HUD, grid foot and bid agree
  App.state.assemblyProject.settings.overheadPct = 7; App.state.assemblyProject.settings.markupPct = 12.5; App.state.assemblyProject.settings.profitPct = 9; App.renderCards(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));
  App.showEstimate(true); await new Promise(r => setTimeout(r, 100));
  const foot = document.querySelector('#estgridFoot .fb.sell .fv'); const hud = document.querySelector('#hudSell, #sellStrip, [id*=sell]');
  out.margins = { recapSell: +App.recapModel().sell.toFixed(2), gridFootSell: foot && foot.textContent.replace(/\\s/g, ''), bidTotal: parseBid().total };
  App.showEstimate(false);
  // schedule lens
  App.showSchedule(true); await new Promise(r => setTimeout(r, 100)); out.schedule = { rows: document.querySelectorAll('#schedHost .sched-row, #schedHost tr').length, text: (document.getElementById('schedHost') || {}).textContent?.slice(0, 80) }; App.showSchedule(false);
  // autosave contents
  const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  out.localStorage = keys.map(k => ({ k, bytes: (localStorage.getItem(k) || '').length, hasProjectMeta: /projectMeta/.test(localStorage.getItem(k) || '') }));
  return out;
})()`);
report.flow = flow; report.flowConsole = consoleErrs.slice();
// ---------------- ingress hostility: string quantity in a takeoff file ----------------
consoleErrs.length = 0;
report.ingress = await ev(`(async () => {
  const App = VESApp; const d = JSON.parse(JSON.stringify(window.__demo));
  d.measurements[0].value = "3150.8";           // string, not number
  d.measurements.push({ id: 99, conditionId: 5, page: null, type: 'linear', points: null, value: 10, notes: '', manual: true });   // points null
  d.conditions[0].pitch = "1.2";
  App.newTakeoff(); App.loadFromData(d); await new Promise(r => setTimeout(r, 400));
  const roll = VESCore.rollup(App.state.conditions, App.state.measurements);
  const eng = assemblyMeasured();
  const m = App.recapModel();
  return { rollupFieldQty: roll[0].quantity, rollupFieldQtyType: typeof roll[0].quantity, engineFieldQty: (eng.find(e => e.condId === 'tpo.field') || {}).value, recapSell: m.sell, recapLines: m.lineCount, toast: document.getElementById('toast').textContent, banners: [...document.querySelectorAll('.banner .msg')].map(b => b.textContent) };
})()`);
report.ingressConsole = consoleErrs.slice();
// ---------------- HTML-injection sinks ----------------
consoleErrs.length = 0;
report.xss = await ev(`(async () => {
  const App = VESApp; window.__xss = []; const P = (t) => '<img src=x onerror="window.__xss.push(&quot;' + t + '&quot;)">';
  const d = JSON.parse(JSON.stringify(window.__demo));
  d.projectMeta.name = 'Job ' + P('projectMeta.name'); d.projectMeta.client = P('client'); d.projectMeta.address = P('address'); d.projectMeta.notes = P('notes'); d.projectMeta.preparedBy = { company: P('preparedBy.company'), name: P('preparedBy.name') }; d.projectMeta.proposalNotes = P('proposalNotes');
  d.conditions[0].name = 'Cond ' + P('condition.name'); d.conditions[0].csi = P('condition.csi'); d.conditions[0].notes = P('condition.notes'); d.conditions[0].location = P('condition.location'); d.conditions[0].wbs = P('condition.wbs'); d.conditions[0].color = 'red" onmouseover="1';
  d.measurements[0].notes = P('measurement.notes');
  d.assemblyProject.general = [{ id: 'g1', label: P('general.label'), qty: 1, unit: P('general.unit'), unit_cost: 5, csi: P('general.csi'), note: P('general.note') }];
  d.pdfName = P('pdfName');
  App.newTakeoff(); App.loadFromData(d); await new Promise(r => setTimeout(r, 400));
  const steps = [];
  const step = async (n, f) => { try { await f(); await new Promise(r => setTimeout(r, 60)); } catch (e) { steps.push(n + ': threw ' + String(e).slice(0, 120)); } };
  await step('renderCards', () => { App.renderCards(); return new Promise(r => requestAnimationFrame(r)); });
  await step('renderAssembly', () => App.renderAssembly());
  await step('renderRecap', () => { App.renderRecap(); App.setRecapTab('materials'); App.setRecapTab('labor'); App.setRecapTab('equipment'); App.setRecapTab('exceptions'); App.setRecapTab('summary'); });
  await step('estimateGrid', () => { App.showEstimate(true); App.renderEstimateGrid(); });
  await step('schedule', () => { App.showEstimate(false); App.showSchedule(true); App.renderSchedule(); App.showSchedule(false); });
  await step('ledger', () => App.renderLedger());
  await step('hud', () => { App.renderHud(); App.renderInspector(); });
  await step('projModal', () => { App.openProjModal(); });
  await step('bid', () => printBidDoc());
  await step('costSheet', () => printCostSheet());
  await step('proposal', async () => { const h = await App.proposalHTML(); const doc = new DOMParser().parseFromString(h, 'text/html'); window.__proposalHostile = h; });
  await step('clientReview', () => { const h = App.clientReviewHTML(); window.__clientReviewHostile = h; });
  await step('audit', () => App.openAudit());
  await step('cmd', () => { App.openCmd(); App.closeCmd(); });
  await step('activate', () => { App.activateCondition(App.state.conditions[0]); });
  await step('depth', () => { App.state.editingCondId = App.state.conditions[0].id; App.renderCards(); return new Promise(r => requestAnimationFrame(r)); });
  await step('sheetStrip', () => renderSheetStrip());
  await step('resume', () => { App.flushAutosave(); renderResumeList(); });
  await new Promise(r => setTimeout(r, 300));
  // static check on the two generated documents: does the raw payload appear unescaped?
  const rawIn = (h) => h && /<img src=x onerror=/.test(h);
  return { fired: window.__xss, steps, proposalRawInjection: rawIn(window.__proposalHostile), clientReviewRawInjection: rawIn(window.__clientReviewHostile), bidRawInjection: rawIn(document.getElementById('printDoc').innerHTML), bodyRawInjection: rawIn(document.body.innerHTML.replace(document.getElementById('printDoc').innerHTML, '')) };
})()`);
report.xssConsole = consoleErrs.slice();
// ---------------- library import with hostile labels ----------------
report.xssLib = await ev(`(async () => {
  window.__xss = []; const P = (t) => '<img src=x onerror="window.__xss.push(&quot;' + t + '&quot;)">';
  const lib = JSON.parse(JSON.stringify(VESApp.state.library));
  const cid = Object.keys(lib.conditions)[0]; lib.conditions[cid].label = 'L ' + P('lib.condition.label');
  const iid = Object.keys(lib.items)[0]; lib.items[iid].desc = P('lib.item.desc'); lib.items[iid].note = P('lib.item.note');
  const aid = Object.keys(lib.assemblies)[0]; lib.assemblies[aid].label = P('lib.assembly.label');
  let r; try { r = VESApp.importLibraryObject(lib, [], 'hostile.json'); } catch (e) { r = 'threw ' + e; }
  VESApp.newTakeoff(); VESApp.loadAssembly(aid); VESApp.addManualQuantity(cid, 10); await new Promise(res => requestAnimationFrame(() => setTimeout(res, 150)));
  VESApp.renderAssembly(); VESApp.openAssemblies(); VESApp.renderRecap(); VESApp.showEstimate(true); VESApp.renderEstimateGrid(); VESApp.showEstimate(false);
  await new Promise(res => setTimeout(res, 300));
  return { importResult: typeof r === 'string' ? r : (r && (r.ok ?? r)), fired: window.__xss };
})()`);
// ---------------- proposal print: do legend swatch colors survive Chrome's default (no background graphics)? ----------------
async function pdfColors(html, printBackground) {
  const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p = {}) => c.send(m, p); // fallback not used
  // attach a second connection for the new target
  const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const t = list.find((x) => x.id === targetId);
  const c2 = await connect(t.webSocketDebuggerUrl); await c2.send('Page.enable');
  await c2.send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') }); await sleep(600);
  const { data } = await c2.send('Page.printToPDF', { printBackground, preferCSSPageSize: true });
  const buf = Buffer.from(data, 'base64'); const txt = buf.toString('latin1');
  const rg = new Set(); let m; const re = /stream\r?\n([\s\S]*?)endstream/g;
  while ((m = re.exec(txt)) !== null) { let s = Buffer.from(m[1], 'latin1'); let dec = null; try { dec = inflateSync(s).toString('latin1'); } catch (_) { dec = s.toString('latin1'); } for (const mm of dec.matchAll(/([0-9.]+) ([0-9.]+) ([0-9.]+) rg/g)) rg.add(mm.slice(1, 4).map((x) => (+x).toFixed(2)).join(',')); }
  c2.close(); await c.send('Target.closeTarget', { targetId });
  return { bytes: buf.length, fillColors: [...rg] };
}
const ph = await ev('window.__proposalHTML');
const swatches = await ev(`[...new DOMParser().parseFromString(window.__proposalHTML, 'text/html').querySelectorAll('.sw')].map(s => s.style.background)`);
report.proposalPrint = { legendSwatchColors: swatches, withBackgroundGraphics: await pdfColors(ph, true), withoutBackgroundGraphics_chromeDefault: await pdfColors(ph, false) };
writeFileSync(join(OUT, 'sweep-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
c.close(); chrome.kill('SIGKILL');
