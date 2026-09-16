/* Batch Q6 — THE MONEY TRIO (charter .scratch/charter-q6.md). One row per ruling:
 * Q6-a = M-1 (per-line rounding override), Q6-b = the money control (both fixture goldens to the
 * cent under the DEFAULTS), Q6-c = M-2 (Overhead named and EQUAL on five money surfaces),
 * Q6-d = M-3 (a zero-quantity general line is not included, and says so everywhere), Q6-e = the
 * gate row (G0 + the fixture control), run alone.
 *
 * Real pointer for the UI gestures — harness copied from probe-qol.mjs / probe-deduct.mjs
 * (boot, openPdf, loadFixture, clickSel, keys, tryEv, check); the workbook/CSV readers are
 * probe-af.mjs's.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-money-trio.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet" "$PWD" [--no-subgates] [only]
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NOSUB = process.argv.includes('--no-subgates');
const ARGV = process.argv.slice(2).filter((a) => a !== '--no-subgates');
const [VES, FIX, ROOT, ONLY] = ARGV;
if (!VES || !FIX || !ROOT) { console.error('usage: probe-money-trio.mjs <VES_PM.html> <fixtureDir> <root> [--no-subgates] [only]'); process.exit(2); }
const want = (n) => !ONLY || ONLY.split(',').indexOf(n) >= 0;

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url); let id = 0; const pending = new Map();
    ws.addEventListener('open', () => resolve({
      send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); },
      close() { ws.close(); },
    }));
    ws.addEventListener('error', () => reject(new Error('ws')));
    ws.addEventListener('message', (e) => { const msg = JSON.parse(e.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } });
  });
}
const port = 9600 + Math.floor(Math.random() * 90);
const prof = mkdtempSync(join(tmpdir(), 'ves-q6-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
  '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 600 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {}
  if (!wsUrl) await sleep(100);
}
if (!wsUrl) { console.error('HARNESS FAIL: no devtools target'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => {
  const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
};
const tryEv = async (e) => { try { return await ev(e); } catch (x) { return { error: String(x.message || x).slice(0, 300) }; } };

let pass = 0, fail = 0;
const rows = [];
function check(name, ok, detail) {
  rows.push({ name, ok: !!ok });
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
  if (detail !== undefined) console.log('      ' + JSON.stringify(detail).slice(0, 2600));
}

/* ---------- real pointer (probe-qol / probe-hide idiom) ---------- */
async function mouse(type, sx, sy, opts = {}) {
  await c.send('Input.dispatchMouseEvent', { type, x: Math.round(sx), y: Math.round(sy), button: 'left',
    buttons: type === 'mouseMoved' ? 0 : 1, clickCount: opts.clickCount || 1, modifiers: opts.modifiers || 0 });
}
async function clickScreen(sx, sy, { clickCount = 1, wait = 140, modifiers = 0 } = {}) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(sx), y: Math.round(sy), button: 'none', buttons: 0 });
  await sleep(40);
  for (const t of ['mousePressed', 'mouseReleased']) await mouse(t, sx, sy, { clickCount, modifiers });
  await sleep(wait);
}
/* A real pointer has to be able to LAND on the control before the control counts as shipped
   (the AF-1 lesson, and R-14b/R-14d: nothing may paint over what the estimator aimed at).
   elementFromPoint at the control's own centre says what the click would actually hit. */
async function pointerLandsOn(sel) {
  await tryEv(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: 'center', inline: 'center' }); return 1; })()`);
  await sleep(260);
  const r = await tryEv(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
    const b = e.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0)) return { visible: false };
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { visible: true, sx: b.left + b.width / 2, sy: b.top + b.height / 2, hitsSelf: !!(hit && (hit === e || e.contains(hit))),
      hit: hit ? (hit.tagName + (hit.className ? '.' + String(hit.className).split(' ')[0] : '')) : null }; })()`);
  if (!r || r.error || !r.visible || !r.hitsSelf) return { ok: false, r };
  await clickScreen(r.sx, r.sy, { wait: 120 });
  return { ok: true, r };
}
async function key(k, code, vk, mods = 0) {
  for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
  await sleep(220);
}
const ctrlZ = () => key('z', 'KeyZ', 90, 2);

/* ---------- workbook / CSV readers (probe-af's) ---------- */
const sheets = (bytes) => { const s = Buffer.from(bytes).toString('utf8'); const out = []; const re = /<worksheet[^>]*>([\s\S]*?)<\/worksheet>/g; let m; while ((m = re.exec(s)) !== null) out.push(m[1]); return out; };
const cells = (xml) => { const rows = []; const rr = /<row r="(\d+)">([\s\S]*?)<\/row>/g; let m; while ((m = rr.exec(xml)) !== null) { const row = {}; const cr = /<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g; let cm; while ((cm = cr.exec(m[2])) !== null) { const body = cm[3]; const f = /<f>([^<]*)<\/f>/.exec(body); const v = /<v>([^<]*)<\/v>/.exec(body); const t = /<t[^>]*>([^<]*)<\/t>/.exec(body); row[cm[1]] = { f: f ? f[1] : null, v: v ? +v[1] : null, t: t ? t[1] : null }; } rows.push(row); } return rows; };
// A CSV line split on commas that are not inside quotes (rowsToCSV quotes any field carrying one).
const splitCsv = (line) => { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const centsOf = (s) => { const m = /-?[\d,]+\.\d\d/.exec(String(s == null ? '' : s)); return m ? Math.round(parseFloat(m[0].replace(/,/g, '')) * 100) : null; };

/* ---------- boot ---------- */
const pdfB64 = readFileSync(join(FIX, 'plan.pdf')).toString('base64');
const takeoffText = readFileSync(join(FIX, 'takeoff.v3.json'), 'utf8');
const ARM = `
  window.__take = ${takeoffText};
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__printed = 0; window.print = () => { window.__printed++; };
  window.__saved = [];
  window.saveBlob = function (name, data) { window.__saved.push({ name, text: (typeof data === 'string') ? data : null }); return null; };
  window.__jtop = (n) => VESApp.state.journal.undo.slice(-(n||1)).map(x => x.label);
  window.__grand = () => { const m = VESApp.recapModel(); return { costC: Math.round(m.cost*100), sellC: Math.round(m.sell*100) }; };
  window.__doc = () => { const d = document.getElementById('printDoc');
    return (d.textContent || '').replace(/\\s+/g,' ').trim(); };
  window.__line = (item) => { const l = VESApp.resolveAssembly().lines.find(x => x.item === item);
    return l ? { item: l.item, ordered: l.ordered, qtyNeeded: l.qtyNeeded, itemWaste: l.itemWaste, unit: l.unit,
      unitCost: l.unitCost, extendedC: l.extended == null ? null : Math.round(l.extended*100) } : null; };
  window.__ov = (item) => { const o = (VESApp.state.assemblyProject.lineOverrides || {})[item]; return o ? JSON.parse(JSON.stringify(o)) : null; };
  1`;
const openPdf = () => ev(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } return 1; })()`);
async function boot(html = VES) {
  await c.send('Page.navigate', { url: 'file://' + html });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
  await sleep(300);
  await ev(`localStorage.clear(); 1`);
  await ev(ARM);
  await sleep(100);
}
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await boot();
const clearStage = async () => { await tryEv(`try { VESApp.toggleRail(true, { persist: false }); } catch(e){} try { VESApp.collapseDrawer(); } catch(e){} document.body.classList.remove('rail-collapsed'); 1`); await sleep(120); };
const loadFixture = async () => { await openPdf(); await ev(`VESApp.loadFromData(JSON.parse(JSON.stringify(window.__take))); 1`); await sleep(1300);
  await ev(`if (VESApp.state.snap) VESApp.toggleSnap(); 1`); await clearStage(); };
const openGrid = async () => { await tryEv(`VESApp.showEstimate(true); VESApp.renderEstimateGrid(); 1`); await sleep(450); };
const closeGrid = async () => { await tryEv(`VESApp.showEstimate(false); 1`); await sleep(200); };

console.log('# probe-money-trio boot OK\n');

/* ════════ Q6-a (M-1) · a line says how its order quantity rounds ════════════════════════════ */
if (want('a')) {
  await loadFixture();
  await openGrid();
  /* The candidate is chosen from the ENGINE's own numbers, not from a name: a library-backed
     material line the engine derived and rounded, where CEIL and NEAREST are DIFFERENT integers
     (the fractional part of needed × (1 + item waste) is under a half). If no such line exists on
     the fixture the row says so rather than passing on a line where the two modes agree. */
  const cand = await tryEv(`(() => {
    const L = VESApp.resolveAssembly().lines.filter(l => l.included && l.extended != null && l.kind !== 'labor'
      && !l.qtyOverridden && l.qtyNeeded != null && !String(l.item).startsWith('adhoc.'));
    const rows = L.map(l => { const t = l.qtyNeeded * (1 + (l.itemWaste || 0));
      return { item: l.item, desc: l.desc, qtyNeeded: l.qtyNeeded, itemWaste: l.itemWaste || 0, target: t,
        ceil: Math.ceil(t - 1e-9), nearest: Math.round(t), ordered: l.ordered, unit: l.unit, unitCost: l.unitCost }; });
    return { pick: rows.find(r => r.ceil !== r.nearest) || null, n: rows.length };
  })()`);
  const P = cand && cand.pick;
  const sel = P ? `#estgridBody select.rsel[data-item="${P.item}"]` : null;
  const land = P ? await pointerLandsOn(sel) : { ok: false, r: null };
  const set = P && land.ok ? await tryEv(`(() => { const s = document.querySelector(${JSON.stringify(sel)});
    const opts = Array.from(s.options).map(o => o.value);
    s.value = 'NEAREST'; s.dispatchEvent(new Event('change', { bubbles: true })); return { opts }; })()`) : { error: 'no control' };
  await sleep(320);
  const after = P ? await tryEv(`(() => { const s = document.querySelector(${JSON.stringify(sel)});
    const tr = s ? s.closest('tr') : null;
    return { line: window.__line(${JSON.stringify(P.item)}), ov: window.__ov(${JSON.stringify(P.item)}),
      journal: window.__jtop(1), control: s ? s.value : null,
      derivText: tr ? (tr.querySelector('td.deriv .dsum') || {}).textContent : null }; })()`) : null;
  await tryEv(`document.activeElement && document.activeElement.blur(); 1`);
  await ctrlZ();
  await sleep(320);
  const undone = P ? await tryEv(`({ line: window.__line(${JSON.stringify(P.item)}), ov: window.__ov(${JSON.stringify(P.item)}) })`) : null;
  const ok = !!P && land.ok === true && !set.error && Array.isArray(set.opts) && set.opts.join(',') === 'CEIL,EXACT,NEAREST'
    && after && !after.error && after.line && after.line.ordered === P.nearest
    && after.ov && after.ov.rounding === 'NEAREST'
    && /^rounding → NEAREST on /.test(String((after.journal || [])[0] || ''))
    && undone && !undone.error && undone.line && undone.line.ordered === P.ceil
    && !(undone.ov && undone.ov.rounding);
  check('Q6-a (M-1) a real pointer lands on the line’s rounding control in the Formula column, CEIL/EXACT/NEAREST; choosing NEAREST moves the ORDERED quantity from the ceiling to the closest whole unit, is journaled "rounding → NEAREST on <line>", and one Ctrl+Z puts both the quantity and the override back',
    ok, { arithmetic: P && { line: P.desc || P.item, qtyNeeded: P.qtyNeeded, itemWaste: P.itemWaste, target: P.target, CEIL: P.ceil, NEAREST: P.nearest, orderedBefore: P.ordered, unit: P.unit },
      candidates: cand && cand.n, pointer: land.r, set, after, undone });
}

/* ════════ Q6-b · THE MONEY CONTROL — both fixture goldens, to the cent, under the DEFAULTS ═══ */
if (want('b')) {
  await loadFixture();
  const gPath = join(FIX, 'golden.cents.json'), g6Path = join(FIX, 'golden.v6.cents.json');
  const v6Path = join(FIX, 'takeoff.v6.json');
  const haveAll = existsSync(gPath) && existsSync(g6Path) && existsSync(v6Path);
  let d = { fixtures: { golden: existsSync(gPath), goldenV6: existsSync(g6Path), takeoffV6: existsSync(v6Path) } }, ok = false;
  if (haveAll) {
    const g = JSON.parse(readFileSync(gPath, 'utf8')), g6 = JSON.parse(readFileSync(g6Path, 'utf8'));
    const v5 = await tryEv(`(() => { const m = VESApp.recapModel(); const cents = (x) => (x == null ? null : Math.round(x * 100));
      return { lineCount: m.lineCount, off: m.off, materialCents: cents(m.material), laborCents: cents(m.labor),
        equipmentCents: cents(m.equipment), costCents: cents(m.cost), ohAmtCents: cents(m.ohAmt), mkAmtCents: cents(m.mkAmt),
        pfAmtCents: cents(m.pfAmt), sellCents: cents(m.sell) }; })()`);
    const v6text = readFileSync(v6Path, 'utf8');
    const v6 = await tryEv(`(async () => { VESApp.loadFromData(${v6text}); await new Promise(r => setTimeout(r, 1300));
      const roll = VESCore.rollup(VESApp.state.conditions, VESApp.state.measurements);
      return { grand: window.__grand(), qty: Object.fromEntries(roll.map(r => [r.id, Math.round(r.quantity * 1000)])) }; })()`);
    const v5Diff = Object.keys(g.recap).filter((k) => g.recap[k] !== (v5 || {})[k]).map((k) => `${k}: golden ${g.recap[k]} vs now ${(v5 || {})[k]}`);
    const v6Diff = [];
    if (!v6 || v6.error) v6Diff.push('v6 did not load: ' + JSON.stringify(v6));
    else {
      if (v6.grand.costC !== g6.recap.costCents) v6Diff.push(`costCents: golden ${g6.recap.costCents} vs now ${v6.grand.costC}`);
      if (v6.grand.sellC !== g6.recap.sellCents) v6Diff.push(`sellCents: golden ${g6.recap.sellCents} vs now ${v6.grand.sellC}`);
      for (const k of Object.keys(g6.quantities)) if (g6.quantities[k] !== v6.qty[k]) v6Diff.push(`qty ${k}: golden ${g6.quantities[k]} vs now ${v6.qty[k]}`);
    }
    ok = v5Diff.length === 0 && v6Diff.length === 0;
    d = { v5, v5Diff, v6: v6 && v6.grand, v6Diff };
  }
  check('Q6-b (the money control) with NO line touching the new rounding cell, CEIL is what every line still does: the v5 fixture prices to golden.cents.json to the cent (every recap figure) and the v6 fixture to golden.v6.cents.json (cost, sell and all 26 quantities)',
    ok, d);
}

/* ════════ Q6-c (M-2) · Overhead, named and EQUAL, on five money surfaces ════════════════════ */
if (want('c')) {
  await loadFixture();
  await openGrid();
  const gridFoot = await tryEv(`(() => { const f = document.getElementById('estgridFoot');
    const tiles = Array.from(f.querySelectorAll('.fb')).map(b => ({ k: (b.querySelector('.fk')||{}).textContent, v: (b.querySelector('.fv')||{}).textContent }));
    return { tiles, text: (f.textContent || '').replace(/\\s+/g, ' ').trim() }; })()`);
  await closeGrid();
  const recap = await tryEv(`(() => { VESApp.setRecapTab('summary'); VESApp.renderRecap();
    const rows = Array.from(document.querySelectorAll('#recapBody table.recap-ladder tr')).map(t => ({
      k: (t.children[0]||{}).textContent, v: (t.children[1]||{}).textContent }));
    return { rows, text: (document.getElementById('recapBody').textContent || '').replace(/\\s+/g,' ').slice(0, 400) }; })()`);
  const sheet = await tryEv(`(() => { VESApp.printCostSheet(); return { printed: window.__printed, text: window.__doc() }; })()`);
  const xl = await tryEv(`(() => { const b = VESApp.exportEstimateXLSX(); return b ? Array.from(b) : null; })()`);
  const rollCsv = await tryEv(`(() => { window.__saved = []; VESApp.exportRollupCSV(); const s = window.__saved.find(x => /rollup/.test(x.name)); return s ? s.text : null; })()`);
  const model = await tryEv(`(() => { const m = VESApp.recapModel(); return { ohAmt: m.ohAmt, oh: m.oh, cost: m.cost, sell: m.sell }; })()`);

  const pick = (rowsArr) => { const r = (rowsArr || []).find((x) => /^\s*Overhead/.test(String(x.k || ''))); return r ? centsOf(r.v) : null; };
  const gridC = pick(gridFoot && gridFoot.tiles);
  const recapC = pick(recap && recap.rows);
  const sheetC = (() => { const m = /Overhead \([^)]*\)\s*(\$[\d,]+\.\d\d)/.exec((sheet && sheet.text) || ''); return m ? centsOf(m[1]) : null; })();
  let xlC = null, xlRow = null;
  if (Array.isArray(xl)) { const rws = cells(sheets(Buffer.from(xl))[0] || '');
    xlRow = rws.find((r) => r.C && /^Overhead/.test(r.C.t || '')) || null;
    xlC = xlRow && xlRow.G ? Math.round(xlRow.G.v * 100) : null; }
  let rollC = null, rollRow = null;
  if (typeof rollCsv === 'string') { const lines = rollCsv.split(/\r?\n/).filter(Boolean).map(splitCsv);
    rollRow = lines.find((f) => f[0] === 'LADDER' && /^Overhead/.test(f[1] || '')) || null;
    rollC = rollRow ? centsOf(rollRow[12]) : null; }
  const five = { recap: recapC, costSheet: sheetC, gridFooter: gridC, xlsxLadder: xlC, rollupCSV: rollC };
  const vals = Object.values(five);
  const ok = vals.every((v) => typeof v === 'number') && new Set(vals).size === 1;
  check('Q6-c (M-2) Overhead is its own NAMED row/column on all five money surfaces — the recap ladder, the cost sheet, the Estimate grid footer (never folded into an "O&P" column again), the workbook ladder and the condition-totals CSV — and the five print the SAME integer cents',
    ok, { five, modelOhCents: model && Math.round(model.ohAmt * 100), gridTiles: (gridFoot && gridFoot.tiles || []).map((t) => t.k),
      recapRows: (recap && recap.rows || []).map((r) => r.k), costSheetPrinted: sheet && sheet.printed,
      xlsxRow: xlRow && { label: xlRow.C && xlRow.C.t, f: xlRow.G && xlRow.G.f, v: xlRow.G && xlRow.G.v }, rollupRow: rollRow && rollRow.slice(0, 2).concat([rollRow[12]]) });
}

/* ════════ Q6-d (M-3) · a zero-quantity general line is not included, and says so ═════════════ */
if (want('d')) {
  await loadFixture();
  /* The bid door runs D-24.4's identity gate first and DEFERS once on a job with no company name,
     which leaves the placeholder on the paper rather than the bid. Name the preparer, the way an
     estimator does before printing one — this row is about what the bid SAYS, not about that gate. */
  await tryEv(`(() => { VESApp.state.projectMeta = VESApp.state.projectMeta || {};
    VESApp.state.projectMeta.preparedBy = { company: 'Probe Roofing Co', name: 'Q6' }; return 1; })()`);
  const made = await tryEv(`(() => { const row = VESApp.addGeneralItem();
    const gs = VESApp.state.assemblyProject.general; const i = gs.indexOf(row);
    VESApp.setGeneralField(i, 'label', 'Permit allowance Q6');
    VESApp.setGeneralField(i, 'csi', '01 41 00');
    VESApp.setGeneralField(i, 'unit_cost', '250');
    VESApp.setGeneralField(i, 'qty', '0');
    return { i, row: JSON.parse(JSON.stringify(gs[i])) }; })()`);
  await openGrid();
  const grid = await tryEv(`(() => { const trs = Array.from(document.querySelectorAll('#estgridBody tr'));
    const tr = trs.find(t => /Permit allowance Q6/.test(t.textContent || ''));
    return tr ? { cls: tr.className, text: (tr.textContent || '').replace(/\\s+/g,' ').trim(),
      greyOpacity: getComputedStyle(tr).opacity, netCost: (tr.children[tr.children.length-1] || {}).textContent } : null; })()`);
  const csv = await tryEv(`(() => { window.__saved = []; VESApp.exportGridCSV(); const s = window.__saved.find(x => /estimate-grid/.test(x.name)); return s ? s.text : null; })()`);
  const xl = await tryEv(`(() => { const b = VESApp.exportEstimateXLSX(); return b ? Array.from(b) : null; })()`);
  const bid = await tryEv(`(() => { VESApp.printBidDoc(); return window.__doc(); })()`);
  const sheetTxt = await tryEv(`(() => { VESApp.printCostSheet(); return window.__doc(); })()`);
  const before = await tryEv(`window.__grand()`);

  let csvRow = null, csvHdr = null;
  if (typeof csv === 'string') { const ls = csv.split(/\r?\n/).filter(Boolean).map(splitCsv);
    csvHdr = ls[0]; csvRow = ls.find((f) => f.indexOf('Permit allowance Q6') >= 0) || null; }
  let xlHdr = null, xlRow = null;
  if (Array.isArray(xl)) { const rws = cells(sheets(Buffer.from(xl))[0] || '');
    xlHdr = rws[0] ? Object.values(rws[0]).map((x) => x.t) : null;
    xlRow = rws.find((r) => r.C && /Permit allowance Q6/.test(r.C.t || '')) || null; }
  const notInclIdx = csvHdr ? csvHdr.indexOf('not_included') : -1;

  // typing 3 through the grid's own cell — the door the estimator uses
  await openGrid();
  const typed = await tryEv(`(() => { const i = document.querySelector('#estgridBody input.gen-edit[data-gen="${made && made.i}"][data-field="qty"]');
    if (!i) return { error: 'no qty cell' }; i.focus(); i.value = '3'; i.dispatchEvent(new Event('change', { bubbles: true })); return { ok: true }; })()`);
  await sleep(400);
  await tryEv(`VESApp.renderEstimateGrid(); 1`); await sleep(250);
  const gridAfter = await tryEv(`(() => { const trs = Array.from(document.querySelectorAll('#estgridBody tr'));
    const tr = trs.find(t => /Permit allowance Q6/.test(t.textContent || ''));
    return tr ? { cls: tr.className, text: (tr.textContent || '').replace(/\\s+/g,' ').trim() } : null; })()`);
  const bidAfter = await tryEv(`(() => { VESApp.printBidDoc(); return window.__doc(); })()`);
  const after = await tryEv(`window.__grand()`);
  const journal = await tryEv(`window.__jtop(1)`);

  const R = 'qty 0 — not included';
  const greyed = !!(grid && !grid.error && /\bgated\b/.test(grid.cls || '') && (grid.text || '').indexOf(R) >= 0);
  const bidLists = typeof bid === 'string' && /Not included in this bid/.test(bid) && bid.indexOf('Permit allowance Q6') >= 0;
  const sheetLists = typeof sheetTxt === 'string' && /Not included/.test(sheetTxt) && sheetTxt.indexOf('Permit allowance Q6') >= 0;
  const csvFlag = !!(csvRow && notInclIdx >= 0 && (csvRow[notInclIdx] || '').indexOf(R) >= 0);
  const xlFlag = !!(xlHdr && xlHdr.indexOf('Not included') >= 0 && xlRow && Object.values(xlRow).some((x) => (x.t || '').indexOf(R) >= 0));
  const included = !!(gridAfter && !/\bgated\b/.test(gridAfter.cls || '') && (gridAfter.text || '').indexOf(R) < 0)
    && typeof bidAfter === 'string' && bidAfter.indexOf('Permit allowance Q6') >= 0
    && before && after && (after.costC - before.costC) === 75000;
  const ok = greyed && bidLists && sheetLists && csvFlag && xlFlag && included && typed && typed.ok === true;
  check('Q6-d (M-3) a general line with no quantity is GREYED on the grid with the reason "qty 0 — not included", listed under "Not included" on the client bid AND the cost sheet, and flagged in the Estimate CSV (not_included) and the workbook (Not included) — typing 3 in its grid cell un-greys it, puts it on the bid and adds exactly 3 × $250 to the job',
    ok, { made: made && made.row, greyed, gridCls: grid && grid.cls, gridHasReason: !!(grid && (grid.text || '').indexOf(R) >= 0),
      bidLists, bidIsString: typeof bid === 'string', bidHasHeading: typeof bid === 'string' && /Not included in this bid/.test(bid),
      bidSample: typeof bid === 'string' ? bid.slice(0, 200) : bid,
      bidExcerpt: typeof bid === 'string' ? bid.slice(Math.max(0, bid.indexOf('Not included in this bid')), bid.indexOf('Not included in this bid') + 300) : null,
      sheetLists, csvFlag, csvHeaderTail: csvHdr && csvHdr.slice(-3), csvNotIncl: csvRow && notInclIdx >= 0 ? csvRow[notInclIdx] : null,
      xlFlag, xlHeaderTail: xlHdr && xlHdr.slice(-3), typed, gridAfterCls: gridAfter && gridAfter.cls,
      costDeltaCents: before && after ? after.costC - before.costC : null, journal });
}

/* ════════ Q6-e · the gate row (run alone; --no-subgates skips it in CI) ═════════════════════ */
if (NOSUB) {
  check('Q6-e G0 + the fixture control not run here (--no-subgates); each runs as its own CI step', true, { skipped: '--no-subgates was passed' });
} else if (want('e')) {
  const g0 = spawnSync('node', [join(ROOT, 'gate', 'g0.mjs'), 'check', join(ROOT, 'src', 'VES_PM.html')],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
  const g0out = String(g0.stdout || '') + String(g0.stderr || '');
  const fx = spawnSync('node', [join(ROOT, 'tools', 'sweep', 'probe-b0-fixture.mjs'), join(ROOT, 'src', 'VES_PM.html'),
    join(FIX, 'takeoff.v3.json'), join(FIX, 'plan.pdf'), ROOT],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
  const fxout = String(fx.stdout || '') + String(fx.stderr || '');
  const fxPass = (fxout.match(/^PASS /gm) || []).length;
  check('Q6-e the money path did not move under this batch: G0 GREEN 4/4 and probe-b0-fixture 7/7 on these bytes',
    g0.status === 0 && /G0 GREEN/.test(g0out) && fx.status === 0 && fxPass === 7,
    { g0: g0.status, g0tail: g0out.trim().split('\n').slice(-5).join(' | '), fixture: fx.status, fixturePass: fxPass });
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'RED') + ' — ' + pass + ' pass, ' + fail + ' fail, ' + rows.length + ' rows');
try { c.close(); } catch (_) {}
try { chrome.kill('SIGKILL'); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
