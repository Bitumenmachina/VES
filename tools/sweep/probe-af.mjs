// Batch AF gate — ESTIMATE SHEET DEPTH: the sheet renders what it computes, and a formula can live on the line.
// Commission: research/HANDOFF_ESTIMATE_SHEET_b191423.md §5 (the coil case) · rulings R1–R7 · ledger findings
// F1.4(m), F2.1, F2.3, F3.3, F3.4, F4.1-1..5, F4.3-4, F5.4. RED-first on F18.68 (b191423).
//   node tools/sweep/probe-af.mjs <ves.html> <demo.json> <repo root> <old ves.html (F18.68 bytes, for AF7)>
//   AF16–AF29: Batch AG (persona pass 1) · AF30–AF35: Batch AH (persona pass 2)
//   exit 0 pass / 1 findings / 2 harness
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const [VES, DEMO, ROOT, OLD] = process.argv.slice(2);
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } })); ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9100 + Math.floor(Math.random() * 40); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-paf-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 600 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
// A missing door on the unpatched build is a FINDING, never a harness failure: every step reports {error} instead of throwing.
const tryEv = async (expr) => { try { return await ev(expr); } catch (e) { return { error: String(e.message || e).slice(0, 200) }; } };
const results = []; const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const near = (a, b, eps = 0.005) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < eps;
const demo = readFileSync(DEMO, 'utf8');
const arm = `window.print = () => { window.__printed = (window.__printed || 0) + 1; }; window.__demo = ${demo}; loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true); window.__blobs = []; window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, bytes: (bytes instanceof Uint8Array) ? Array.from(bytes) : String(bytes), mime }); }; 1`;
async function nav(file, clear) { await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await c.send('Page.navigate', { url: 'file://' + file }); for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); } if (clear) await ev('localStorage.clear(); 1'); await ev(arm); await sleep(300); }
const sheets = (bytes) => { const s = Buffer.from(bytes).toString('utf8'); const out = []; const re = /<worksheet[^>]*>([\s\S]*?)<\/worksheet>/g; let m; while ((m = re.exec(s)) !== null) out.push(m[1]); return out; };
const cells = (xml) => { const rows = []; const rr = /<row r="(\d+)">([\s\S]*?)<\/row>/g; let m; while ((m = rr.exec(xml)) !== null) { const row = {}; const cr = /<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g; let cm; while ((cm = cr.exec(m[2])) !== null) { const body = cm[3]; const f = /<f>([^<]*)<\/f>/.exec(body); const v = /<v>([^<]*)<\/v>/.exec(body); const t = /<t[^>]*>([^<]*)<\/t>/.exec(body); row[cm[1]] = { f: f ? f[1] : null, v: v ? +v[1] : null, t: t ? t[1] : null }; } rows.push(row); } return rows; };
const csvRows = (b) => (typeof b === 'string' ? b : Buffer.from(b).toString('utf8')).split(/\r?\n/).filter(Boolean).map((l) => l.split(','));
const setCell = (sel, value) => `(() => { const i = document.querySelector('${sel}'); if (!i) return { error: 'no cell ${sel}' }; i.focus(); i.value = ${JSON.stringify(value)}; i.dispatchEvent(new Event('change', { bubbles: true })); return { ok: true }; })()`;
const COIL = { kind: 'material', cqty_ref: 'ssmr.eave', unit: 'LB', density: 1.5, unit_cost: 2.10, desc: 'Coil — trim stock (synthetic)', csi: '07 62 00', match_code: '07 62 00', authority: 'OBS', note: 'probe-af fixture' };

await nav(VES, true);
// ── AF1: the engine line says which driver priced it, from where, with what inputs (R1/R2), on the G0 fixture ──
const af1 = await tryEv(`(() => { VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 3150.8);
  const L = VESApp.resolveAssembly().lines; const by = (id) => L.find(l => l.item === id) || {}; const d = (id) => by(id).driver || null;
  return { und: d('ssmr.underlayment'), clips: d('ssmr.clips'), freight: d('ssmr.freight'), panel: d('ssmr.panel'), undOrdered: by('ssmr.underlayment').ordered }; })()`);
check('AF1 engine lines carry driver {kind,value,level,expr,params,scope}: underlayment coverage 200 ITEM · clips density 1 ITEM · freight fixed · panel identity',
  af1.und && af1.und.kind === 'coverage' && af1.und.value === 200 && af1.und.level === 'ITEM' && af1.und.scope && near(af1.und.scope.RAW, 3150.8)
  && af1.clips && af1.clips.kind === 'density' && af1.clips.value === 1 && af1.clips.level === 'ITEM'
  && af1.freight && af1.freight.kind === 'fixed' && af1.panel && af1.panel.kind === 'identity' && af1.undOrdered === 16, af1);

// ── AF2: THE COIL CASE (commission §5) — LF measured, LB bought, LF × width × lb/SF with the width typed ON THE LINE ──
const af2 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms));
  VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.eave', 412.5); await wait(100);
  const proj = VESApp.state.assemblyProject; proj.settings = proj.settings || {}; proj.settings.overheadPct = 10; proj.settings.markupPct = 8; proj.settings.profitPct = 5;
  // the library door (R7): author the coil item through the app's own library edit, not by poking state
  const up = libraryUpsertItem('ssmr', 'ssmr.coil', ${JSON.stringify(COIL)}); if (!up || !up.ok) return { error: 'libraryUpsertItem refused: ' + JSON.stringify(up) };
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(150);
  const before = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil');
  const fx = document.querySelector('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]'); const fxp = document.querySelector('input.fxp[data-item="ssmr.coil"][data-field="params"]');
  if (!fx || !fxp) return { error: 'no formula / params cell on the coil row', before };
  fx.focus(); fx.value = 'RAW * width * lbsf'; fx.dispatchEvent(new Event('change', { bubbles: true })); await wait(150);
  const fxp2 = document.querySelector('input.fxp[data-item="ssmr.coil"][data-field="params"]'); fxp2.focus(); fxp2.value = 'width=1.25 lbsf=1.156'; fxp2.dispatchEvent(new Event('change', { bubbles: true })); await wait(150);
  const line = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil');
  const row = document.querySelector('input.fx[data-item="ssmr.coil"]').closest('tr'); const cell = row.querySelector('td.deriv'); const mark = cell && cell.querySelector('.dmark');
  return { beforeOrdered: before && before.ordered, beforeKind: before && before.driver && before.driver.kind, ordered: line.ordered, extended: line.extended, unit: line.unit, kind: line.driver && line.driver.kind, level: line.driver && line.driver.level, expr: line.driver && line.driver.expr, params: line.driver && line.driver.params, qtyNeeded: line.qtyNeeded, mark: mark && mark.textContent.trim(), markLevel: mark && mark.dataset.level, text: cell && cell.textContent.replace(/\\s+/g, ' ').trim(), qtyOverridden: line.qtyOverridden, sell: VESApp.recapModel().sell }; })()`);
check('AF2 coil: library density prices 619 LB; the LINE formula RAW * width * lbsf with width=1.25 lbsf=1.156 typed in the grid prices 597 LB ($1,253.70), driver qty_expr LINE, marker "line formula", summary shows the inputs',
  af2.beforeOrdered === 619 && af2.beforeKind === 'density' && af2.ordered === 597 && near(af2.extended, 1253.70) && af2.unit === 'LB' && af2.kind === 'qty_expr' && af2.level === 'LINE'
  && af2.expr === 'RAW * width * lbsf' && af2.params && af2.params.width === 1.25 && af2.params.lbsf === 1.156 && near(af2.qtyNeeded, 596.0625)
  && /line formula/i.test(af2.mark || '') && af2.markLevel === 'LINE' && /412\.5/.test(af2.text || '') && /1\.25/.test(af2.text || '') && /1\.156/.test(af2.text || '') && !af2.qtyOverridden, af2);

// ── AF3: change the width on the line — everything downstream follows, nothing else edited ──
const af3 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); const sell0 = VESApp.recapModel().sell;
  const r = ${setCell('input.fxp[data-item="ssmr.coil"][data-field="params"]', 'width=1.5 lbsf=1.156')}; if (r.error) return r; await wait(150);
  const line = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil'); const m = VESApp.recapModel();
  const cell = document.querySelector('input.fx[data-item="ssmr.coil"]').closest('tr').querySelector('td.deriv');
  return { ordered: line.ordered, extended: line.extended, sell0, sell: m.sell, hud: document.getElementById('hudSell').textContent, text: cell && cell.textContent.replace(/\\s+/g, ' ').trim(), overrides: Object.keys(VESApp.state.assemblyProject.lineOverrides['ssmr.coil'] || {}).sort(), journalTop: VESApp.state.journal.undo.length ? VESApp.state.journal.undo[VESApp.state.journal.undo.length - 1].label : null }; })()`);
const expectSell3 = af2.sell != null && af3.sell0 != null ? af3.sell0 + (1503.60 - 1253.70) * 1.1 * 1.08 * 1.05 : null;
check('AF3 width 1.25 → 1.5 on the params cell: 716 LB, $1,503.60, sell moves by exactly that line through the ladder, the HUD agrees, the row summary shows 1.5, the edit is journaled under its own name',
  af3.ordered === 716 && near(af3.extended, 1503.60) && near(af3.sell, expectSell3, 0.02) && af3.hud && af3.hud.replace(/[^0-9.]/g, '') === (Math.round(af3.sell * 100) / 100).toFixed(2).replace(/[^0-9.]/g, '')
  && /1\.5\b/.test(af3.text || '') && JSON.stringify(af3.overrides) === '["params","qty_expr"]' && /width/i.test(af3.journalTop || ''), af3);

// ── AF4: every export that carries cost carries the derivation as trailing columns; the workbook ladder references percentage cells ──
const af4 = await tryEv(`(async () => { window.__blobs.length = 0; exportGridCSV(); exportEstimateXLSX(); exportBOMCSV(); await new Promise(r => setTimeout(r, 200));
  const b = (re) => { const f = window.__blobs.find(x => re.test(x.name)); return f ? f.bytes : null; }; const m = VESApp.recapModel();
  return { grid: b(/estimate-grid\\.csv$/), xlsx: b(/estimate.*\\.xlsx$/), bom: b(/bom.*\\.csv$/i), cost: +m.cost.toFixed(2), sell: +m.sell.toFixed(2), oh: m.oh, mk: m.mk, pf: m.pf }; })()`);
let af4ok = false, af4d = { error: af4.error };
if (!af4.error) {
  const grid = af4.grid ? csvRows(af4.grid) : []; const gh = grid[0] || []; const coilG = grid.find((r) => /coil/i.test(r[2] || '')) || [];
  const gi = (k) => gh.indexOf(k); const gridOk = gi('formula') > 7 && gi('params') > 7 && gi('driver') > 7 && /RAW \\* width \\* lbsf|RAW \* width \* lbsf/.test(coilG[gi('formula')] || '') && /width=1\.5/.test(coilG[gi('params')] || '') && /formula \(LINE\)/.test(coilG[gi('driver')] || '');
  const bom = af4.bom ? csvRows(af4.bom) : []; const bh = bom.find((r) => r.includes('Component')) || []; const coilB = bom.find((r) => /coil/i.test(r[1] || '')) || []; const bi = (k) => bh.findIndex((h) => new RegExp('^' + k + '$', 'i').test(h));
  const bomOk = bi('formula') > 10 && /RAW/.test(coilB[bi('formula')] || '') && /width=1\.5/.test(coilB[bi('params')] || '');
  let xl = {}; if (af4.xlsx) { const rows = cells(sheets(af4.xlsx)[0] || ''); const hdr = rows[0] ? Object.entries(rows[0]).map(([k, x]) => [k, x.t]) : []; const col = (re) => (hdr.find(([, t]) => re.test(t || '')) || [])[0];
    const extCol = col(/extended|total/i), fCol = col(/^formula$/i), pCol = col(/^params$/i), dCol = col(/^driver$/i), pctCol = col(/^pct$/i); const coil = rows.find((r) => r.C && /coil/i.test(r.C.t || '')) || {};
    const foot = {}; for (const r of rows) { const lab = r.C && r.C.t; if (lab && /^(Cost|Overhead|Markup|Profit|Sell)/.test(lab)) foot[lab.split(' ')[0]] = { f: r[extCol] && r[extCol].f, v: r[extCol] && r[extCol].v, pct: pctCol && r[pctCol] ? r[pctCol].v : null }; }
    const ladderRefsPct = ['Overhead', 'Markup', 'Profit'].every((k) => foot[k] && foot[k].f && !/\*\s*0?\.\d/.test(foot[k].f) && new RegExp('\\*' + pctCol + '\\d+').test(foot[k].f) && typeof foot[k].pct === 'number');
    xl = { extCol, fCol, pCol, dCol, pctCol, coilFormula: fCol && coil[fCol] && coil[fCol].t, coilParams: pCol && coil[pCol] && coil[pCol].t, coilDriver: dCol && coil[dCol] && coil[dCol].t, foot, ladderRefsPct, pctVals: [foot.Overhead && foot.Overhead.pct, foot.Markup && foot.Markup.pct, foot.Profit && foot.Profit.pct],
      ok: !!(fCol && pCol && dCol && pctCol && /RAW/.test(coil[fCol].t || '') && /width=1\.5/.test(coil[pCol].t || '') && ladderRefsPct && foot.Sell && foot.Sell.f && near(foot.Sell.v, af4.sell) && near(foot.Cost.v, af4.cost) && near(foot.Overhead.pct, af4.oh) && near(foot.Markup.pct, af4.mk) && near(foot.Profit.pct, af4.pf)) }; }
  af4d = { gridHeader: gh, gridCoil: coilG.slice(7), bomHeader: bh.slice(10), bomCoil: coilB.slice(10), xlsx: xl }; af4ok = gridOk && bomOk && !!xl.ok; }
check('AF4 grid CSV, Estimate .xlsx and BOM CSV carry formula / params / driver as trailing columns for the coil line; the workbook ladder multiplies by Pct cells (no baked literal), Sell = SUM as before', af4ok, af4d);

// ── AF5: client paper shows none of it; the cost sheet names the price unit ──
const af5 = await tryEv(`(async () => { const txt = () => { const d = document.getElementById('printDoc'); return d ? d.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ') : ''; };
  printBidDoc(); document.getElementById('projModal') && document.getElementById('projModal').classList.remove('open'); printBidDoc(); const bid = txt(); printCostSheet(); const cost = txt();
  const prop = (await proposalHTML()).replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' '); window.__blobs.length = 0; exportClientReviewXLSX(); const f = window.__blobs.find(x => /client-review\\.xlsx$/.test(x.name)); const rev = f ? String.fromCharCode.apply(null, f.bytes.slice(0, 200000)) : '';
  const leak = (s) => /\\bRAW\\b|\\bADJ\\b|width=|lbsf|qty_expr/.test(s); return { bidLeak: leak(bid), propLeak: leak(prop), revLeak: leak(rev), costHead: /order unit/i.test(cost), costLen: cost.length, bidLen: bid.length, propLen: prop.length }; })()`);
check('AF5 the bid, the proposal and the client review workbook carry no RAW/ADJ/params/formula text; the cost sheet labels unit cost per order unit',
  !af5.error && af5.bidLeak === false && af5.propLeak === false && af5.revLeak === false && af5.costHead === true && af5.bidLen > 200 && af5.propLen > 200, af5);

// ── AF6: save → reload — the coil line is identical to the cent, formula and parameters intact, no drop banner ──
const af6 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); const l0 = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil'); const sell0 = VESApp.recapModel().sell;
  const json = JSON.stringify(VESApp.snapshot()); window.__saved = json; VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); await wait(100); await VESApp.loadFromData(JSON.parse(json)); await wait(400);
  const l1 = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil'); const ov = VESApp.state.assemblyProject.lineOverrides['ssmr.coil'] || {};
  return { sell0, sell: VESApp.recapModel().sell, o0: l0.ordered, o1: l1 && l1.ordered, e0: l0.extended, e1: l1 && l1.extended, expr: ov.qty_expr, params: ov.params, banner: [...document.querySelectorAll('.banner .msg')].map(b => b.textContent).join(' | '), toast: document.getElementById('toast').textContent, version: JSON.parse(json).version }; })()`);
check('AF6 save → reload: 716 LB and the cost identical to the cent, formula and params intact on the override record, takeoff version still 3, no drop banner',
  !af6.error && af6.o1 === af6.o0 && near(af6.e1, af6.e0) && near(af6.sell, af6.sell0) && af6.expr === 'RAW * width * lbsf' && af6.params && af6.params.width === 1.5 && af6.version === 3 && !/DROPPED|dropped/i.test(af6.banner || '') && !/DROPPED/.test(af6.toast || ''), af6);
const savedJson = af6.error ? null : await tryEv('window.__saved');

// ── AF8: clear the formula — the line returns to the library derivation with the marker gone ──
const af8 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(150);
  let r = ${setCell('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]', '')}; if (r.error) return r; await wait(150); r = ${setCell('input.fxp[data-item="ssmr.coil"][data-field="params"]', '')}; if (r.error) return r; await wait(150);
  const line = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil'); const cell = document.querySelector('input.fx[data-item="ssmr.coil"]').closest('tr').querySelector('td.deriv'); const mark = cell && cell.querySelector('.dmark');
  return { ordered: line.ordered, kind: line.driver && line.driver.kind, value: line.driver && line.driver.value, level: line.driver && line.driver.level, record: VESApp.state.assemblyProject.lineOverrides['ssmr.coil'] || null, mark: mark && mark.textContent.trim(), markLevel: mark && mark.dataset.level }; })()`);
check('AF8 clearing the formula and params cells deletes both keys; the line is back on the library density (619 LB, density 1.5 ITEM) and the marker says library',
  !af8.error && af8.ordered === 619 && af8.kind === 'density' && af8.value === 1.5 && af8.level === 'ITEM' && af8.record === null && af8.markLevel === 'ITEM', af8);

// ── AF9: a formula that fails to evaluate gates the line, says so on the row, the recap and the export, and never contributes zero ──
const af9 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); const sellOff = (() => { const s = VESApp.recapModel().sell; return s; })();
  const coilBefore = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil').extended;
  const r = ${setCell('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]', 'RAW * widht')}; if (r.error) return r; await wait(150);
  const line = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil'); const m = VESApp.recapModel(); const cell = document.querySelector('input.fx[data-item="ssmr.coil"]').closest('tr').querySelector('td.deriv');
  window.__blobs.length = 0; exportGridCSV(); const b = window.__blobs.find(x => /estimate-grid\\.csv$/.test(x.name)); const csv = b ? String(b.bytes) : ''; const row = csv.split(/\\r?\\n/).find(l => /coil/i.test(l)) || '';
  const cue = (document.getElementById('gridCue') || {}).textContent || ''; const toast = document.getElementById('toast').textContent;
  ${setCell('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]', '')}; await wait(100);
  return { status: line.matchStatus, gate: line.gate, extended: line.extended, included: line.included, sellBefore: sellOff, sellAfter: m.sell, coilBefore, rowText: cell && cell.textContent.replace(/\\s+/g, ' ').trim(), excluded: (m.excluded || []).some(l => l.item === 'ssmr.coil'), csvRow: row, cue, toast, stored: VESApp.state.assemblyProject.lineOverrides['ssmr.coil'] }; })()`);
const expectSell9 = af9.sellBefore != null && af9.coilBefore != null ? af9.sellBefore - af9.coilBefore * 1.1 * 1.08 * 1.05 : null;
check('AF9 "RAW * widht" gates the line as EXPR_ERROR naming the token; the row says it, the recap excludes it by name, the CSV row carries the reason, the sell drops by the whole line (excluded, never $0), and the estimator\'s text was kept until cleared',
  !af9.error && af9.status === 'EXPR_ERROR' && /widht/.test(af9.gate || '') && af9.extended === null && af9.included === false && near(af9.sellAfter, expectSell9, 0.02) && /widht/.test(af9.rowText || '') && af9.excluded === true && /widht/.test(af9.csvRow || '') && /widht/.test((af9.cue || '') + (af9.toast || '')), af9);

// ── AF7: the same file opened in the F18.68 bytes — loud drop, library reprice, never silent ──
let af7 = { error: 'AF6 produced no file' };
if (savedJson && typeof savedJson === 'string') { await nav(OLD, false);
  af7 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); const lib = VESApp.state.library; if (!lib.items['ssmr.coil']) { lib.items['ssmr.coil'] = ${JSON.stringify(COIL)}; lib.assemblies.ssmr.items.push('ssmr.coil'); }
    await VESApp.loadFromData(JSON.parse(${JSON.stringify(savedJson)})); await wait(500); const line = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.coil');
    return { build: VESApp.VES_BUILD, ordered: line && line.ordered, banner: [...document.querySelectorAll('.banner .msg')].map(b => b.textContent).join(' | '), toast: document.getElementById('toast').textContent, record: VESApp.state.assemblyProject.lineOverrides['ssmr.coil'] || null }; })()`);
  await nav(VES, true); }
check('AF7 the F18.68 bytes open the new file with the standing banner naming the dropped override field and reprice the coil line from the library (619 LB) — loud, not silent',
  !af7.error && af7.build === 'F18.68' && af7.ordered === 619 && /unsupported override field/.test(af7.banner || '') && /DROPPED/.test(af7.toast || '') && !(af7.record && af7.record.qty_expr), af7);

// ── AF10: add-a-line says which funnel it is in before commit; a free LF line is linear, not a count ──
const af10 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 1000); await wait(100);
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(150); const open = document.getElementById('gAddInline'); if (!open) return { error: 'no add-a-line row' }; open.click(); await wait(150);
  const desc = document.getElementById('geDesc'); const mode = () => (document.getElementById('geMode') || {}).textContent || '';
  desc.value = 'SSMR — eave'; desc.dispatchEvent(new Event('input', { bubbles: true })); await wait(50); const libMode = mode(); const typeSel = document.getElementById('geType'); const lockedType = typeSel && typeSel.disabled;
  desc.value = 'Coping cap — synthetic'; desc.dispatchEvent(new Event('input', { bubbles: true })); await wait(50); const freeMode = mode();
  const unit = document.getElementById('geUnit'); unit.value = 'LF'; unit.dispatchEvent(new Event('input', { bubbles: true })); await wait(50); const typeAfterUnit = typeSel && typeSel.value;
  document.getElementById('geQty').value = '55'; document.getElementById('gePrice').value = '3'; commitGridEntry(); await wait(200);
  const c = VESApp.state.conditions.find(x => x.adhoc && /Coping/.test(x.name)); const line = c && VESApp.resolveAssembly().lines.find(l => (l.drivingRefs || []).includes(c.libRef));
  return { libMode, lockedType, freeMode, typeAfterUnit, condType: c && c.type, unit: line && line.unit, ordered: line && line.ordered, extended: line && line.extended }; })()`);
check('AF10 the entry row says "Library …" naming the assembly, its item count and its fixed allowances on an exact label match, and "Free line …" otherwise; unit LF sets measure linear and the adhoc condition is linear (55 LF @ $3)',
  !af10.error && /^Library/.test(af10.libMode || '') && /Standing Seam Metal Roof/.test(af10.libMode || '') && /\d+ items/.test(af10.libMode || '') && /\d+ fixed allowance/.test(af10.libMode || '') && af10.lockedType === true
  && /^Free line/.test(af10.freeMode || '') && af10.typeAfterUnit === 'linear' && af10.condType === 'linear' && af10.unit === 'LF' && af10.ordered === 55 && near(af10.extended, 165), af10);

// ── AF11: condition waste has a door; the Flags advisory it answers goes quiet; negatives are refused; the edit is journaled ──
const af11 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.eave', 100); await wait(100); VESApp.showEstimate(false);
  const src = VESApp.state.conditions.find(x => x.libRef === 'ssmr.eave'); const card = document.querySelector('.card[data-cid="' + src.id + '"]'); const pen = true; VESApp.state.expandedCondId = src.id; VESApp.renderCards(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 250)));   /* the Condition detail panel (#depthPanel) carries pitch and waste */
  const inp = document.querySelector('#depthPanel input.cond-waste') || document.querySelector('input.cond-waste'); if (!inp) return { error: 'no condition-waste input on the card editor', pitchInputs: document.querySelectorAll('input.cond-pitch').length, editing: VESApp.state.editingCondId, dp: (document.getElementById('depthPanel') || {}).className, dpText: ((document.getElementById('depthPanel') || {}).textContent || '').slice(0, 160), penFound: !!pen, cardFound: !!card };
  const flags0 = (() => { VESApp.setRecapTab('exceptions'); VESApp.renderRecap(); return document.getElementById('recapBody').textContent; })(); const depth0 = VESApp.state.journal.undo.length;
  const line0 = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.eavedrip');
  inp.focus(); inp.value = '5'; inp.dispatchEvent(new Event('change', { bubbles: true })); await wait(150);
  const co = VESApp.state.assemblyProject.conditionOverrides['ssmr.eave'] || {}; const line1 = VESApp.resolveAssembly().lines.find(l => l.item === 'ssmr.eavedrip');
  VESApp.setRecapTab('exceptions'); VESApp.renderRecap(); const flags1 = document.getElementById('recapBody').textContent; const depth1 = VESApp.state.journal.undo.length; const top = depth1 ? VESApp.state.journal.undo[depth1 - 1].label : null;
  const neg = setConditionWaste('ssmr.eave', -1); const coNeg = (VESApp.state.assemblyProject.conditionOverrides['ssmr.eave'] || {}).waste;
  return { waste: co.waste, adj0: line0 && line0.driver && line0.driver.scope && line0.driver.scope.ADJ, adj1: line1 && line1.driver && line1.driver.scope && line1.driver.scope.ADJ, ordered1: line1 && line1.ordered, advisory0: /waste not set/.test(flags0) && /eave/i.test(flags0), advisory1: /waste not set[^]*eave/i.test(flags1), depth0, depth1, top, neg, coNeg, toast: document.getElementById('toast').textContent }; })()`);
check('AF11 a waste % typed on the library condition\'s card writes conditionOverrides[libRef].waste = 0.05, ADJ lifts 100 → 105 and the drip orders 105 LF, the Flags "waste not set" row for that condition clears, the edit is journaled, and −1 is refused',
  !af11.error && near(af11.waste, 0.05) && near(af11.adj0, 100) && near(af11.adj1, 105) && af11.ordered1 === 105 && af11.advisory0 === true && af11.advisory1 === false && af11.depth1 === af11.depth0 + 1 && /waste/i.test(af11.top || '') && near(af11.coNeg, 0.05), af11);

// ── AF12: the Library lens — every item with its full field set; library edits go to the library, refused when the schema says so; desc + params survive the workbook ──
const af12 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); showLibrary(true); await wait(200);
  const view = document.getElementById('libview'); const visible = view && getComputedStyle(view).display !== 'none' && view.getBoundingClientRect().height > 100;
  const ids = Object.keys(VESApp.state.library.items); const rows = [...document.querySelectorAll('#libBody tr[data-item]')].map(r => r.dataset.item); const once = ids.every(id => rows.filter(x => x === id).length === 1);
  const fields = [...document.querySelectorAll('#libBody tr[data-item="ssmr.clips"] [data-field]')].map(e => e.dataset.field);
  const need = ['kind','cqty_ref','unit','unit_cost','coverage','density','qty_expr','params','waste','production_rate','csi','authority','verify','desc']; const missing = need.filter(f => !fields.includes(f));
  const head = (document.querySelector('#libview .gtop') || {}).textContent || ''; const fp0 = libraryIdentity().fingerprint;
  const refused = libraryEditItem('ssmr.clips', 'coverage', 5); const clipsCov = VESApp.state.library.items['ssmr.clips'].coverage;
  const rowMsg = (document.querySelector('#libBody tr[data-item="ssmr.clips"] .lib-msg') || {}).textContent || '';
  const ok = libraryEditItem('ssmr.eavedrip', 'unit_cost', 4.25); const uc = VESApp.state.library.items['ssmr.eavedrip'].unit_cost; const fp1 = libraryIdentity().fingerprint; const lo = VESApp.state.assemblyProject.lineOverrides['ssmr.eavedrip'];
  libraryUpsertItem('ssmr', 'ssmr.coil', ${JSON.stringify(COIL)}); libraryEditItem('ssmr.coil', 'params', { lbsf: 1.156 }); const back = VESX.tabsToLibrary(VESX.libraryToTabs(VESApp.state.library)); const bl = back && (back.library || back); const it = bl && bl.items && bl.items['ssmr.coil'];
  const stored = JSON.parse(localStorage.getItem('ves:library') || '{}'); showLibrary(false);
  return { visible, count: ids.length, rowCount: rows.length, once, missing, head: head.replace(/\\s+/g, ' ').slice(0, 200), refused, clipsCov, rowMsg, ok, uc, fpChanged: fp0 !== fp1, lo, rtDesc: it && it.desc, rtParams: it && it.params, persistedUc: stored.items && stored.items['ssmr.eavedrip'] && stored.items['ssmr.eavedrip'].unit_cost }; })()`);
check('AF12 the Library lens lists every item once with its full field set, names the library and its provenance; a second driver on ssmr.clips is refused with the reason and the library is unchanged; a unit-cost edit changes the LIBRARY (persisted, fingerprint moves) and never the project; desc + params survive the .xlsx round-trip',
  !af12.error && af12.visible && af12.once && af12.rowCount === af12.count && af12.missing.length === 0 && /seed|library/i.test(af12.head) && af12.refused && af12.refused.ok === false && /at most one/i.test(af12.refused.error || '') && af12.clipsCov == null && /at most one/i.test(af12.rowMsg)
  && af12.ok && af12.ok.ok === true && af12.uc === 4.25 && af12.fpChanged && af12.lo === undefined && af12.rtDesc === COIL.desc && af12.rtParams && af12.rtParams.lbsf === 1.156 && af12.persistedUc === 4.25, af12);

// ── AF13: the qty cell's edit source carries full precision (F1.4 m) ──
const af13 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 3150.8); await wait(100);
  editLine('lab.ssmr.panel', 'production_rate', 7); await wait(100); const line = VESApp.resolveAssembly().lines.find(l => l.item === 'lab.ssmr.panel');
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(150); const g = document.querySelector('#estgridBody input.recap-edit[data-item="lab.ssmr.panel"][data-field="qty"]');
  VESApp.showEstimate(false); VESApp.setRecapTab('labor'); VESApp.renderRecap(); await wait(100); const r = document.querySelector('#recapBody input.recap-edit[data-item="lab.ssmr.panel"][data-field="qty"]');
  const src = VESApp.state.conditions.find(x => x.libRef === 'ssmr.field'); const card = document.querySelector('.card[data-cid="' + src.id + '"]'); const pen = card && [...card.querySelectorAll('button')].find(b => b.textContent.trim() === '\\u270e'); if (pen) pen.click(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 200)));
  const d = [...document.querySelectorAll('input')].find(i => i.placeholder === 'hr' && Math.abs(parseFloat(i.value) - 450.11) < 0.01);
  return { ordered: line.ordered, gridRaw: g && g.dataset.raw, gridShown: g && g.value, recapRaw: r && r.dataset.raw, cardVal: d && d.value }; })()`);
check('AF13 a labor line at 3150.8 SF ÷ 7 SF/hr orders 450.1142857… hr: the grid and recap qty cells show 450.11 but edit from the full-precision value (data-raw), and the card shows the same figure',
  !af13.error && near(af13.ordered, 3150.8 / 7, 1e-9) && af13.gridRaw === String(3150.8 / 7) && /^450\.11/.test(af13.gridShown || '') && af13.recapRaw === String(3150.8 / 7) && /^450\.11/.test(af13.cardVal || ''), af13);

// ── AF14: the ＋ labor coupling reads the reference, not the display name (R6) ──
const af14 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 1000); await wait(100);
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(150); const laddm = [...document.querySelectorAll('#estgridBody .laddm')].find(b => b.dataset.src != null && /Standing Seam Panel/i.test(b.dataset.lab || '')); if (!laddm) return { error: 'no ＋ labor button' }; laddm.click(); await wait(150);
  document.getElementById('gePrice').value = '2.50'; commitGridEntry(); await wait(200); const lab = VESApp.state.conditions.find(x => x.adhoc && x.qtyLink); if (!lab) return { error: 'no linked labor line' };
  setLineOmit('ssmr.panel', true); await wait(150); const cue = ((document.getElementById('gridCue') || {}).textContent || '') + ' | ' + document.getElementById('toast').textContent;
  return { labName: lab.name, cue }; })()`);
check('AF14 turning the Standing Seam Panel material OFF says its ＋ labor sibling (linked by reference) is still priced — the note no longer depends on a name match that never fired',
  !af14.error && /still priced/i.test(af14.cue || '') && /Standing Seam Panel — labor/.test(af14.cue || ''), af14);

// ── AF15: control — provenance colours already distinguish OBS / INF+verify / STD (holds on F18.68) ──
const af15 = await tryEv(`(() => { VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff(); VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 1000); editLine('ssmr.panel', 'unit_cost', 3.25);
  const rows = estimateRows(); const by = (id) => (rows.find(r => r.item === id) || {}).conf; return { clips: by('ssmr.clips'), panel: by('ssmr.panel'), und: by('ssmr.underlayment') }; })()`);
check('AF15 control: a verify-flagged line paints the "estimated" dot, an OBS-priced line the "manual" dot, a STD line the firm dot (holds on F18.68)',
  !af15.error && af15.clips === 'var(--est)' && af15.panel === 'var(--assumed)' && af15.und === 'var(--firm)', af15);

// ═══ Batch AG — persona pass 1 fixes (RED-first on F18.69 = a63af32; the 1st arg is the build under test, the 4th the F18.68 bytes) ═══
const RESET = `VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.newTakeoff();`;
const COILBUILD = `${RESET} VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.eave', 412.5); const proj = VESApp.state.assemblyProject; proj.settings = proj.settings || {}; proj.settings.overheadPct = 10; proj.settings.markupPct = 8; proj.settings.profitPct = 5;
  if (!VESApp.state.library.items['ssmr.coil']) libraryUpsertItem('ssmr', 'ssmr.coil', ${JSON.stringify(COIL)});
  editLine('ssmr.coil', 'qty_expr', 'RAW * width * lbsf'); editLine('ssmr.coil', 'params', { width: 1.25, lbsf: 1.156 }); VESApp.showEstimate(true); VESApp.renderEstimateGrid();`;
// AF16 — a formula that evaluates to 0 is a gate, never a silent $0 (P-TRADE 5)
const af16 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} await wait(150);
  editLine('ssmr.coil', 'params', { width: 0, lbsf: 1.156 }); await wait(150); const l = VESApp.resolveAssembly().lines.find(x => x.item === 'ssmr.coil'); const m = VESApp.recapModel();
  const cell = document.querySelector('input.fx[data-item="ssmr.coil"]'); const row = cell && cell.closest('tr'); const txt = row ? row.querySelector('td.deriv').textContent : '';
  return { status: l.matchStatus, gate: l.gate, included: l.included, extended: l.extended, excluded: (m.excluded || []).some(x => x.item === 'ssmr.coil'), rowText: txt.replace(/\\s+/g, ' ').slice(0, 200) }; })()`);
check('AF16 a line formula that evaluates to 0 gates the line (ZERO_QTY) — flagged, excluded, said on the row — never an included $0',
  !af16.error && af16.status === 'ZERO_QTY' && /evaluated to 0/.test(af16.gate || '') && af16.included === false && af16.extended === null && af16.excluded === true && /ZERO_QTY/.test(af16.rowText || ''), af16);
// AF17 — the authored-item id comes from the library, so a fresh takeoff's counter never replaces yesterday's item (P-MARKET 1)
const af17 = await tryEv(`(() => { ${RESET} VESApp.state.nextId = 1; const a = libraryUpsertItem('ssmr', null, { desc: 'First (synthetic)', cqty_ref: 'FIXED', unit: 'EA', unit_cost: 1 }); VESApp.state.nextId = 1;
  const b = libraryUpsertItem('ssmr', null, { desc: 'Second (synthetic)', cqty_ref: 'FIXED', unit: 'EA', unit_cost: 2 }); const it = VESApp.state.library.items;
  return { idA: a.id, idB: b.id, firstKept: !!(it[a.id] && it[a.id].desc === 'First (synthetic)'), secondKept: !!(it[b.id] && it[b.id].desc === 'Second (synthetic)') }; })()`);
check('AF17 two ＋ Adds with the takeoff counter reset between them (a reload) give two items — the first is kept', !af17.error && af17.idA !== af17.idB && af17.firstKept && af17.secondKept, af17);
// AF18 — the fourth segment does not cover the document door; on the phone the segments shed their words (P-GAME 1)
const af18 = await tryEv(`(() => { const r = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }; const vt = document.querySelector('.viewtoggle'), fb = document.getElementById('btnDataMenu');
  const fr = fb.getBoundingClientRect(), vr = vt.getBoundingClientRect(); const overlap = Math.max(0, Math.min(fr.right, vr.right) - Math.max(fr.left, vr.left)); const hit = document.elementFromPoint(fr.left + fr.width / 2, fr.top + fr.height / 2);
  return { vt: r(vt), files: r(fb), overlap, hitIsDoor: !!(hit && (hit.id === 'btnDataMenu' || hit.closest('#dataMenuWrap'))), title: vt.title }; })()`);
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }); await sleep(300);
const af18m = await tryEv(`(() => { const vt = document.querySelector('.viewtoggle').getBoundingClientRect(); const br = (document.getElementById('brand') || document.querySelector('#brand')); const b = br ? br.getBoundingClientRect() : { right: 0 }; return { vtW: vt.width, vtLeft: vt.left, brandRight: b.right, overlapBrand: Math.max(0, b.right - vt.left) }; })()`);
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await sleep(300);
check('AF18 at 1440 the Files & exports button is not under the lens segments and is the element at its own centre; the segment title says four lenses; on a 390 px phone the segments are under 200 px wide and clear of the brand',
  !af18.error && af18.overlap === 0 && af18.hitIsDoor && /four lenses/.test(af18.title || '') && !af18m.error && af18m.vtW < 200 && af18m.overlapBrand === 0, { desktop: af18, phone: af18m });
// AF19 — Escape in a grid cell reverts the cell and leaves the lens open (P-GAME 3) — a real key through CDP
await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} await wait(150); const fx = document.querySelector('input.fx[data-item="ssmr.coil"]'); fx.focus(); fx.value = 'RAW * 9'; return 1; })()`);
await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(200);
const af19 = await tryEv(`(() => { const fx = document.querySelector('input.fx[data-item="ssmr.coil"]'); return { lensOpen: !!VESApp.state.gridView, value: fx ? fx.value : null, stored: (VESApp.state.assemblyProject.lineOverrides['ssmr.coil'] || {}).qty_expr }; })()`);
check('AF19 control: a real Escape in the Formula cell reverts the draft, keeps the stored formula, and the Estimate lens stays open (holds on F18.69 — P-GAME pass 1 finding 3 is refuted by its own body class; AG adds the cue and stops the key at the cell)', !af19.error && af19.lensOpen && af19.value === 'RAW * width * lbsf' && af19.stored === 'RAW * width * lbsf', af19);
// AF20 — the lens cue clears after a good commit (P-GAME 5)
const af20 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} await wait(150);
  ${setCell('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]', 'RAW * widht')}; await wait(150); const cueBad = (document.getElementById('gridCue') || {}).textContent || '';
  ${setCell('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]', 'RAW * width * lbsf')}; await wait(150); const cue = document.getElementById('gridCue');
  return { cueBad: cueBad.slice(0, 80), cueAfter: (cue.textContent || '').slice(0, 80), hidden: cue.hidden }; })()`);
check('AF20 a bad formula puts its reason in the lens cue; fixing it clears the cue', !af20.error && /widht/.test(af20.cueBad) && af20.cueAfter === '' && af20.hidden === true, af20);
// AF21 — item waste is in the derivation words (P-MARKET 2)
const af21 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} editLine('ssmr.eavedrip', 'waste', 0.10); await wait(150);
  const cell = document.querySelector('input.fx[data-item="ssmr.eavedrip"]'); const txt = cell ? cell.closest('tr').querySelector('td.deriv').textContent.replace(/\\s+/g, ' ') : ''; const l = VESApp.resolveAssembly().lines.find(x => x.item === 'ssmr.eavedrip');
  return { txt: txt.slice(0, 160), ordered: l.ordered, wasteTitle: (document.querySelector('.estgrid thead th:nth-child(6)') || {}).title || '' }; })()`);
check('AF21 the derivation says the item waste that turns needed into ordered (412.5 + 10% item waste → 454 LF) and the Waste header says it is item waste',
  !af21.error && /10% item waste/.test(af21.txt) && af21.ordered === 454 && /Item waste/.test(af21.wasteTitle), af21);
// AF22 — entry row: the funnel line sits under the description, the measure select follows the unit, the matcher forgives case and dash, a partial names the closest name (P-GAME 6/7/8, P-TRADE 12)
const af22 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${RESET} VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 1000); await wait(100); gridEntry = false; VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(150); document.getElementById('gAddInline').click(); await wait(150);
  const mode = document.getElementById('geMode'); const inFirstCell = mode.closest('td') === mode.closest('tr').firstElementChild; const ids = [...document.querySelectorAll('tr.gentry input, tr.gentry select')].map(e => e.id).filter(Boolean);
  const desc = document.getElementById('geDesc'); const t = () => mode.textContent; const empty = t();
  desc.value = 'ssmr ea'; desc.dispatchEvent(new Event('input', { bubbles: true })); await wait(50); const partial = t();
  desc.value = 'ssmr - eave'; desc.dispatchEvent(new Event('input', { bubbles: true })); await wait(50); const loose = t();
  return { inFirstCell, order: ids.join(','), empty: empty.slice(0, 60), partial: partial.slice(-90), loose: loose.slice(0, 40) }; })()`);
check('AF22 the funnel line is in the description cell; the walk is desc, csi, kind, qty, unit, measure, price; an empty row explains both paths; a partial names the closest library name; "ssmr - eave" matches the library name',
  !af22.error && af22.inFirstCell && /geDesc,geCsi,geKind,geQty,geUnit,geType,gePrice/.test(af22.order) && /^Type a description/.test(af22.empty) && /Closest library name/.test(af22.partial) && /^Library/.test(af22.loose), af22);
// AF23 — a refused waste value never stays in the box; a non-number gets its own sentence (P-GAME 12, P-TRADE 13)
const af23 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${RESET} VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.eave', 100); await wait(100); VESApp.showEstimate(false);
  const src = VESApp.state.conditions.find(x => x.libRef === 'ssmr.eave'); VESApp.state.expandedCondId = src.id; VESApp.renderCards(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 250)));
  const inp = document.querySelector('#depthPanel input.cond-waste') || document.querySelector('input.cond-waste'); if (!inp) return { error: 'no waste input' };
  inp.value = 'abc'; inp.dispatchEvent(new Event('change', { bubbles: true })); await wait(100); const toastAbc = document.getElementById('toast').textContent; const valAbc = inp.value;
  inp.value = '-1'; inp.dispatchEvent(new Event('change', { bubbles: true })); await wait(100); const valNeg = inp.value; const store = VESApp.state.assemblyProject.conditionOverrides['ssmr.eave'];
  return { toastAbc, valAbc, valNeg, store: store || null }; })()`);
check('AF23 "abc" in the waste box is refused as not a number and the box returns to what it showed; "-1" likewise; nothing is stored',
  !af23.error && /is not a number/.test(af23.toastAbc) && af23.valAbc === '' && af23.valNeg === '' && af23.store === null, af23);
// AF24 — a new library item with no CSI lands under the assembly's code (P-MARKET 7)
const af24 = await tryEv(`(() => { ${RESET} const r = libraryUpsertItem('ssmr', null, { desc: 'No-CSI (synthetic)', cqty_ref: 'FIXED', unit: 'EA', unit_cost: 1 }); const it = VESApp.state.library.items[r.id]; return { csi: it && it.csi, match: it && it.match_code, asm: VESApp.state.library.assemblies.ssmr.csi }; })()`);
check('AF24 a new item added without a CSI carries the assembly\'s CSI and match code', !af24.error && af24.csi === af24.asm && af24.match === af24.asm && !!af24.asm, af24);
// AF25 — the Library lens marks a cell that differs from the seed, carries match code, and its ＋ Add button sits by the description (P-MARKET 6/9, P-GAME 10)
const af25 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${RESET} libraryEditItem('ssmr.eavedrip', 'unit_cost', 4.25); showLibrary(true); await wait(200);
  const edited = document.querySelector('#libBody input.lib-edit.ov[data-item="ssmr.eavedrip"][data-field="unit_cost"]'); const plain = document.querySelector('#libBody input.lib-edit[data-item="ssmr.clips"][data-field="unit_cost"]');
  const mc = document.querySelector('#libBody [data-item="ssmr.clips"][data-field="match_code"]'); const addBtn = document.querySelector('#libBody tr.libadd[data-asm="ssmr"] button.libAddBtn'); const inFirst = addBtn && addBtn.closest('td') === addBtn.closest('tr').firstElementChild;
  const coilRow = document.querySelector('#libBody tr[data-item="ssmr.coil"]'); const authored = coilRow ? /authored here/.test(coilRow.textContent) : null; showLibrary(false);
  return { edited: !!edited, plainOv: !!(plain && plain.classList.contains('ov')), matchCode: !!mc, addInFirst: !!inFirst, authored }; })()`);
check('AF25 Library lens: an edited seed value reads in the accent, an untouched one does not; match code is a column; ＋ Add sits in the description cell; an item the seed lacks says "authored here"',
  !af25.error && af25.edited && af25.plainOv === false && af25.matchCode && af25.addInFirst && af25.authored === true, af25);
// AF26 — the workbook's qty-needed cell is numeric and the ladder labels do not bake a percentage (P-TRADE 2a/2b)
const af26 = await tryEv(`(async () => { ${COILBUILD} await new Promise(r => setTimeout(r, 150)); window.__blobs.length = 0; exportEstimateXLSX(); const f = window.__blobs.find(x => /estimate.*\\.xlsx$/.test(x.name)); return { bytes: f ? f.bytes : null }; })()`);
let af26ok = false, af26d = {};
if (!af26.error && af26.bytes) { const rows = cells(sheets(af26.bytes)[0] || ''); const coil = rows.find((r) => r.C && /coil/i.test(r.C.t || '')) || {}; const oh = rows.find((r) => r.C && /^Overhead/.test(r.C.t || '')) || {};
  af26d = { M: coil.M, ohLabel: oh.C && oh.C.t, ohF: oh.G && oh.G.f }; af26ok = !!(coil.M && typeof coil.M.v === 'number' && Math.abs(coil.M.v - 596.0625) < 1e-9 && coil.M.t === null && /Pct/.test(af26d.ohLabel || '') && !/%/.test(af26d.ohLabel || '') && /I\d+/.test(af26d.ohF || '')); }
check('AF26 the Estimate .xlsx writes Qty needed as a number cell and labels the ladder rows by the Pct cell, not a baked percentage', af26ok, af26d);
// AF27 — landing, README and the sheet say what the batch does (P-MARKET 5/10, P-TRADE 16)
const af27 = await tryEv(`(() => { const land = (document.querySelector('.empty-safe') || {}).textContent || ''; ${RESET} VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.field', 1000); gridEntry = false; VESApp.showEstimate(true); VESApp.renderEstimateGrid(); const hint = (document.querySelector('.gaddhint') || {}).textContent || ''; VESApp.showEstimate(false); return { landing: /how its quantity was derived/.test(land) && /Library lens/.test(land), hint: /RAW \\(measured\\)/.test(hint) && /ceil floor round/.test(hint) }; })()`);
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
check('AF27 the landing and the README name the derivation on every line and the Library lens; the sheet foot names the formula scope', !af27.error && af27.landing && af27.hint && /how its quantity was derived/.test(readme) && /Library lens/.test(readme), { ...af27, readme: /Library lens/.test(readme) });
// AF28 — a formula typed while a qty is typed is checked and the cue says the typed qty stands (P-TRADE 7)
const af28 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} editLine('ssmr.coil', 'qty', 600); await wait(150);
  ${setCell('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]', 'RAW * widht')}; await wait(150); const cue = (document.getElementById('gridCue') || {}).textContent || ''; const l = VESApp.resolveAssembly().lines.find(x => x.item === 'ssmr.coil');
  return { cue: cue.slice(0, 200), ordered: l.ordered, status: l.matchStatus }; })()`);
check('AF28 with a typed qty on the row, a bad formula is still checked: the cue says the typed 600 stands and that the formula does NOT evaluate; the line prices on 600', !af28.error && /typed quantity 600/.test(af28.cue) && /does NOT evaluate/.test(af28.cue) && af28.ordered === 600 && af28.status === 'MATCHED', af28);
// AF29 — a dropped operator names the token (P-TRADE 8); the Library toast says the takeoff follows the book (P-TRADE 10)
const af29 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} editLine('ssmr.coil', 'qty_expr', 'RAW width'); await wait(100); const l = VESApp.resolveAssembly().lines.find(x => x.item === 'ssmr.coil');
  libraryEditItem('ssmr.eavedrip', 'unit_cost', 4.5); const toast = document.getElementById('toast').textContent; return { gate: l.gate, toast }; })()`);
check('AF29 "RAW width" gates as unexpected "width" after "RAW" — missing an operator; a library edit\'s toast says every takeoff priced from the book follows',
  !af29.error && /unexpected "width" after "RAW"/.test(af29.gate || '') && /every takeoff priced from it/.test(af29.toast || ''), af29);
// ═══ Batch AH — persona pass 2 fixes (RED-first on F18.70 = 82652fa; the 1st arg is the build under test) ═══
// AF30 — a malformed number literal and a wrong function arity gate the line with the reason, never a silent other number (P-TRADE 2, P-MARKET 12)
const af30 = await tryEv(`(() => { const sc = { RAW: 412.5, ADJ: 412.5, WASTE: 0, Q: 412.5 }; const t = (e) => { try { return VESASM.resolveExpr(e, sc); } catch (x) { return 'ERR ' + x.message; } };
  return { dots: t('RAW * 1.2.3'), arity: t('round(RAW * 1.156, 1)'), ceil2: t('ceil(RAW, 2)'), half: t('RAW * .5'), max2: t('max(RAW, 100)'), one: t('RAW * 1.') }; })()`);
check('AF30 "RAW * 1.2.3" gates as a bad number and "round(x, 1)" as a wrong argument count — the line never prices on a number the estimator did not type; ".5", "1." and max(a, b) still evaluate',
  !af30.error && /^ERR .*bad number "1\.2\.3"/.test(String(af30.dots)) && /^ERR .*round\(\) takes one argument/.test(String(af30.arity)) && /^ERR .*ceil\(\) takes one argument/.test(String(af30.ceil2))
  && af30.half === 206.25 && af30.max2 === 412.5 && af30.one === 412.5, af30);
// AF31 — clearing the Qty cell on a formula line re-checks the formula, so the cue follows the row into its gate; a new takeoff clears the cue; the Flags list names the gated line (P-TRADE 1/3/5)
const af31 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} editLine('ssmr.coil', 'qty', 600); await wait(150);
  ${setCell('input.fx[data-item="ssmr.coil"][data-field="qty_expr"]', 'RAW * widht')}; await wait(150); const cueTyped = (document.getElementById('gridCue') || {}).textContent || '';
  ${setCell('input.recap-edit[data-item="ssmr.coil"][data-field="qty"]', '')}; await wait(150); const cueCleared = (document.getElementById('gridCue') || {}).textContent || '';
  const l = VESApp.resolveAssembly().lines.find(x => x.item === 'ssmr.coil'); renderAssembly(); const flags = (document.getElementById('asmFlags') || {}).textContent || '';
  ${RESET} await wait(100); const cue = document.getElementById('gridCue');
  return { cueTyped: cueTyped.slice(0, 80), cueCleared: cueCleared.slice(0, 120), status: l.matchStatus, included: l.included, flags: flags.slice(0, 120), cueAfterNew: cue.textContent, hiddenAfterNew: cue.hidden }; })()`);
check('AF31 after the Qty cell is cleared the cue names the EXPR_ERROR (not "the typed quantity stands"); the Flags list names the line (control); a new takeoff leaves no cue behind',
  !af31.error && /typed quantity 600/.test(af31.cueTyped) && af31.status === 'EXPR_ERROR' && af31.included === false && /widht/.test(af31.cueCleared) && !/stands/.test(af31.cueCleared)
  && /widht/.test(af31.flags) && af31.cueAfterNew === '' && af31.hiddenAfterNew === true, af31);
// AF32 — the Library lens: a select that differs from the seed is marked like an input; an empty unit and a zero production rate are refused; the unit gate never prints a JS word (P-MARKET 6/10)
const af32 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${RESET} const r1 = libraryEditItem('ssmr.eavedrip', 'cqty_ref', 'ssmr.rake'); showLibrary(true); await wait(200);
  const sel = document.querySelector('#libBody select.lib-edit[data-item="ssmr.eavedrip"][data-field="cqty_ref"]'); const plain = document.querySelector('#libBody select.lib-edit[data-item="ssmr.clips"][data-field="cqty_ref"]');
  const selInfo = { ov: !!(sel && sel.classList.contains('ov')), title: sel ? sel.title : null, plainOv: !!(plain && plain.classList.contains('ov')) }; libraryEditItem('ssmr.eavedrip', 'cqty_ref', 'ssmr.eave'); showLibrary(false);
  const unitBefore = VESApp.state.library.items['ssmr.clips'].unit; const r2 = libraryEditItem('ssmr.clips', 'unit', null); const unitAfter = VESApp.state.library.items['ssmr.clips'].unit;
  const r3 = libraryEditItem('lab.ssmr.panel', 'production_rate', 0); const prAfter = VESApp.state.library.items['lab.ssmr.panel'].production_rate;
  VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.eave', 100); await wait(100); const it = VESApp.state.library.items['ssmr.eavedrip']; const keep = it.unit; delete it.unit;   // an identity item: no conversion, so the unit gate is the one that speaks
  const l = VESApp.resolveAssembly().lines.find(x => x.item === 'ssmr.eavedrip'); it.unit = keep;
  return { r1ok: r1.ok, sel: selInfo, r2: r2.error || 'ok', unitKept: unitAfter === unitBefore, r3: r3.error || 'ok', prKept: prAfter == null, gate: l.gate, status: l.matchStatus }; })()`);
check('AF32 a "driven by" select that differs from the seed reads in the accent with the seed value in its title; an empty unit is refused and kept; production rate 0 is refused; a unit-less item gates without the word "undefined"',
  !af32.error && af32.r1ok && af32.sel.ov && /seed has/.test(af32.sel.title || '') && af32.sel.plainOv === false && /unit/i.test(af32.r2) && af32.r2 !== 'ok' && af32.unitKept && /production/i.test(af32.r3) && af32.r3 !== 'ok' && af32.prKept
  && af32.status === 'UNIT_GATE' && !/undefined/.test(af32.gate || '') && /no unit/.test(af32.gate || ''), af32);
// AF33 — condition-waste words carry the figure as typed (0.05 %, not 0.1 %); a value committed by leaving the box says what it did (P-MARKET 9/14, P-TRADE 6, P-GAME 4)
const af33 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${RESET} VESApp.loadAssembly('ssmr'); VESApp.addManualQuantity('ssmr.eave', 412.5); await wait(100); setConditionWaste('ssmr.eave', 0.05);
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await wait(150); const cell = document.querySelector('input.fx[data-item="ssmr.eavedrip"]'); const words = cell ? cell.closest('tr').querySelector('td.deriv').textContent.replace(/\\s+/g, ' ') : '';
  const jl = VESApp.state.journal.undo.length ? VESApp.state.journal.undo[VESApp.state.journal.undo.length - 1].label : ''; VESApp.showEstimate(false);
  const src = VESApp.state.conditions.find(x => x.libRef === 'ssmr.eave'); VESApp.state.expandedCondId = src.id; VESApp.renderCards(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 250)));
  const inp = document.querySelector('#depthPanel input.cond-waste') || document.querySelector('input.cond-waste'); if (!inp) return { error: 'no waste input' };
  inp.value = '7'; inp.dispatchEvent(new Event('change', { bubbles: true })); await wait(120); const toast = document.getElementById('toast').textContent; const stored = VESApp.state.assemblyProject.conditionOverrides['ssmr.eave'].waste;
  return { words: words.slice(0, 120), journal: jl, toast: toast.slice(0, 120), stored }; })()`);
check('AF33 a 0.05 % condition waste reads "0.05% waste" on the row and in the journal; leaving the box after typing 7 toasts "Waste 7% applied" and stores 0.07',
  !af33.error && /0\.05% waste/.test(af33.words) && !/0\.1% waste/.test(af33.words) && /0\.05%/.test(af33.journal) && /Waste 7% applied/.test(af33.toast) && near(af33.stored, 0.07, 1e-9), af33);
// AF34 — on a 390 px phone with a sheet live, the document door sits inside the screen on one line beside the wordless segments; every segment carries a name (P-GAME G9/G2)
await tryEv(`VESApp.loadFromData(window.__demo); 1`); await sleep(400);
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }); await sleep(300);
const af34 = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); VESApp.showEstimate(true); await wait(200); const b = document.getElementById('btnDataMenu').getBoundingClientRect(); const v = document.querySelector('.viewtoggle').getBoundingClientRect();
  const overlap = Math.max(0, Math.min(b.right, v.right) - Math.max(b.left, v.left)); const titles = [...document.querySelectorAll('.viewtoggle .vseg')].map(e => (e.title || '').slice(0, 24)); const aria = [...document.querySelectorAll('.viewtoggle .vseg')].map(e => e.getAttribute('aria-label') || '');
  const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); VESApp.showEstimate(false);
  return { sheetLive: document.body.classList.contains('sheet-live'), left: b.left, right: b.right, height: b.height, vtLeft: v.left, overlap, hitIsDoor: !!(hit && (hit.id === 'btnDataMenu' || hit.closest('#dataMenuWrap'))), titles, ariaAll: aria.every(Boolean) }; })()`);
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await sleep(300);
check('AF34 390 px phone, sheet live, Estimate lens: Files & exports is wholly on screen (left ≥ 0, right ≤ 390), one line tall (≤ 26 px), clear of the segments, and the element at its own centre; all four segments have a title and an aria-label',
  !af34.error && af34.sheetLive && af34.left >= 0 && af34.right <= 390 && af34.height <= 26 && af34.overlap === 0 && af34.hitIsDoor && af34.titles.every(Boolean) && af34.ariaAll, af34);
// AF35 — a gated row carries a class the eye can find after the cue expires; ＋ Add joins the coarse-pointer rule; Escape in a Library cell reverts and the lens stays, Enter commits and stays (P-GAME G1/G6/G7)
await nav(VES, true);
const af35a = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); ${COILBUILD} editLine('ssmr.coil', 'qty_expr', 'RAW * widht'); VESApp.renderEstimateGrid(); await wait(150);
  const tr = document.querySelector('input.fx[data-item="ssmr.coil"]').closest('tr'); const ok = document.querySelector('input.fx[data-item="ssmr.eavedrip"]').closest('tr'); return { gated: tr.classList.contains('gated'), plain: ok.classList.contains('gated') }; })()`);
await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }); await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }); await sleep(200);
const af35b = await tryEv(`(async () => { const wait = (ms) => new Promise(r => setTimeout(r, ms)); showLibrary(true); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 300))); const coarse = matchMedia('(pointer: coarse)').matches; const b = document.querySelector('#libBody tr.libadd[data-asm="ssmr"] button.libAddBtn'); const cell = document.querySelector('#libBody input.lib-edit[data-item="ssmr.clips"][data-field="unit_cost"]');
  const out = { coarse, btnH: b ? b.getBoundingClientRect().height : null, cellH: cell ? cell.getBoundingClientRect().height : null }; showLibrary(false); return out; })()`);
await c.send('Emulation.setTouchEmulationEnabled', { enabled: false }); await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await sleep(200);
// real typing (CDP insertText sets the dirty flag a programmatic .value never does — blur then fires change, as a keyboard does);
// the 2 s wait lets the deferred fixed-allowance toast of the build gesture (1.8 s, by design) land before the toast under test
await sleep(2000);
await tryEv(`(async () => { showLibrary(true); await new Promise(r => setTimeout(r, 250)); const i = document.querySelector('#libBody input.lib-edit[data-item="ssmr.clips"][data-field="unit_cost"]'); i.focus(); i.select(); return 1; })()`);
await c.send('Input.insertText', { text: '9.99' }); await sleep(50);
await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(200);
const af35c = await tryEv(`(() => { const i = document.querySelector('#libBody input.lib-edit[data-item="ssmr.clips"][data-field="unit_cost"]'); return { lensOpen: !!VESApp.state.libView, value: i ? i.value : null, stored: VESApp.state.library.items['ssmr.clips'].unit_cost, toast: (document.getElementById('toast').textContent || '').slice(0, 60) }; })()`);
await tryEv(`(() => { const i = document.querySelector('#libBody input.lib-edit[data-item="ssmr.clips"][data-field="unit_cost"]'); i.focus(); i.select(); return 1; })()`);
await c.send('Input.insertText', { text: '8.88' }); await sleep(50);
await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await sleep(300);
const af35d = await tryEv(`(() => { const a = document.activeElement; const r = { lensOpen: !!VESApp.state.libView, stored: VESApp.state.library.items['ssmr.clips'].unit_cost, activeInLens: !!(a && a.closest && a.closest('#libview')), activeField: a && a.dataset ? a.dataset.field : null }; libraryEditItem('ssmr.clips', 'unit_cost', ${JSON.stringify(0)}); showLibrary(false); return r; })()`);
const seedClips = await tryEv(`VES_LIBRARY.items['ssmr.clips'].unit_cost`);
await tryEv(`libraryEditItem('ssmr.clips', 'unit_cost', ${JSON.stringify(1)}); 1`);
check('AF35 a gated row carries tr.gated (a priced one does not); on a coarse pointer the Library ＋ Add button is ≥ 40 px tall (asserted only where the emulation reports pointer: coarse); Escape in a Library cell reverts the draft, keeps the stored value, says so, and the lens stays open; Enter commits and focus stays in the lens',
  !af35a.error && af35a.gated && af35a.plain === false && !af35b.error && (af35b.coarse ? af35b.btnH >= 40 : true) && !af35c.error && af35c.lensOpen && af35c.value !== '9.99' && af35c.stored === seedClips && /Reverted/.test(af35c.toast)
  && !af35d.error && af35d.lensOpen && af35d.stored === 8.88 && af35d.activeInLens, { a: af35a, b: af35b, c: af35c, d: af35d, seedClips });
const fails = results.filter((r) => !r.ok).length; console.log(`\nprobe-af: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
