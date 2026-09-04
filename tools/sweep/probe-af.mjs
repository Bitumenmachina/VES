// Batch AF gate — ESTIMATE SHEET DEPTH: the sheet renders what it computes, and a formula can live on the line.
// Commission: research/HANDOFF_ESTIMATE_SHEET_b191423.md §5 (the coil case) · rulings R1–R7 · ledger findings
// F1.4(m), F2.1, F2.3, F3.3, F3.4, F4.1-1..5, F4.3-4, F5.4. RED-first on F18.68 (b191423).
//   node tools/sweep/probe-af.mjs <ves.html> <demo.json> <repo root> <old ves.html (F18.68 bytes, for AF7)>
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

const fails = results.filter((r) => !r.ok).length; console.log(`\nprobe-af: ${results.length - fails}/${results.length} passed, ${fails} failed`); c.close(); chrome.kill('SIGKILL'); process.exit(fails ? 1 : 0);
