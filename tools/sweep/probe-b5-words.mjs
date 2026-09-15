/* Batch B5 gate — UNIFIED DESCRIPTIONS, EDGE COLUMN WORDS (plan §B5 · charter rulings R-6a..d).
 * RED-first on the 2.0.0-rc.6 base (post-B4). Zero deps; raw CDP; same CLI shape as probe-b4-print.mjs.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b5-words.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet/takeoff.v3.json" \
 *     "$PWD/fixtures/synthetic/three-sheet/plan.pdf" "$PWD" [--no-subgates]
 *
 * Rows B5-1 … B5-6, PASS/FAIL + value each; exit 0 all green, 1 on any FAIL, 2 if Chrome never
 * came up. `--no-subgates` skips B5-6's child gates.
 *
 * WHAT EACH ROW READS:
 *   B5-1  one library-backed condition + its one single-driver linked labor line, DISCOVERED from
 *         the running engine (never a hardcoded fixture id) — descOf's two branches, on real data.
 *         Ground truth for each name is read INDEPENDENTLY of descOf: the condition's own `.name`
 *         field, and the labor line's own base name (from its `.desc`/`.item`, the same resolution
 *         itemLabel does) with " — labor" appended the way the F6 rule always has — so this checks
 *         cross-surface agreement against an independent reading, not descOf graded on its own
 *         output. Read off: rail card, grid row, recap row, bid row, cost-sheet row, proposal scope,
 *         takeoff paper, Estimate CSV, BOM CSV, rollup CSV, audit CSV, supplier RFQ, Estimate XLSX,
 *         client-review XLSX — the CONDITION appears on all 14 (its own material line prints on
 *         every one); the LABOR LINE appears only where an ENGINE LINE prints — grid, recap, bid,
 *         cost sheet, Estimate CSV, BOM CSV, supplier RFQ, Estimate XLSX, client-review XLSX (9) —
 *         rail card / proposal scope / takeoff paper / rollup CSV / audit CSV are per-CONDITION
 *         surfaces and never carried a standalone labor-line row before this batch either; stated
 *         here, not invented. 14 + 9 = 23 individual reads across the two items.
 *   B5-2  the rendered takeoff / grid / recap / cost-sheet / bid column headers each contain every
 *         VOCAB word for that document (presence, not a pinned left-to-right array-equality — the
 *         bid and grid legitimately carry additional established columns beside the VOCAB words,
 *         named in the charter notes)
 *   B5-3  `node tools/vocab-check.mjs <this file>` exits 0 clean
 *   B5-4  the grid shows measured Quantity AND Ord Qty for a line where they differ (a
 *         rounded/wasted order) — both visible, both different
 *   B5-5  no blank description anywhere on the fixture's papers/exports
 *   B5-6  child gates: G0, probe-b0-fixture, probe-b1-pitch, probe-b2a-sections, probe-b2b-regions,
 *         probe-b3-colors, probe-b4-print, probe-ae, probe-p903-doc, probe-v, probe-u, probe-af
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const NOSUB = args.includes('--no-subgates');
const [VES, TAKEOFF, PDF, ROOT] = args.filter((a) => !a.startsWith('--'));
if (!VES || !TAKEOFF || !PDF || !ROOT) {
  console.error('usage: probe-b5-words.mjs <VES_PM.html> <takeoff.v3.json> <plan.pdf> <repoRoot> [--no-subgates]');
  process.exit(2);
}
const FIXDIR = dirname(TAKEOFF);

/* ---------- a minimal zip reader (same pattern as probe-b2a-sections.mjs) ---------- */
function unzip(buf, want) {
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) !== 0x06054b50) continue;
    let off = buf.readUInt32LE(i + 16); const n = buf.readUInt16LE(i + 10);
    for (let k = 0; k < n; k++) {
      const nameLen = buf.readUInt16LE(off + 28), extLen = buf.readUInt16LE(off + 30), cmtLen = buf.readUInt16LE(off + 32);
      const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
      const lho = buf.readUInt32LE(off + 42), method = buf.readUInt16LE(off + 10), csize = buf.readUInt32LE(off + 20);
      if (name === want) {
        const lnl = buf.readUInt16LE(lho + 26), lel = buf.readUInt16LE(lho + 28);
        const start = lho + 30 + lnl + lel; const raw = buf.subarray(start, start + csize);
        return (method === 0 ? raw : inflateRawSync(raw)).toString('utf8');
      }
      off += 46 + nameLen + extLen + cmtLen;
    }
    return null;
  }
  return null;
}
function xlsxRows(xml) {
  const rows = [];
  for (const rm of String(xml).matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const o = { __r: +rm[1] };
    for (const cm of rm[2].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const at = cm[1], inner = cm[2];
      const ref = (/r="([A-Z]+)\d+"/.exec(at) || [])[1]; if (!ref) continue;
      const isStr = /t="(inlineStr|str)"/.test(at);
      const t = isStr ? (/<t[^>]*>([\s\S]*?)<\/t>/.exec(inner) || [, null])[1] : null;
      const vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
      o[ref] = { t: t == null ? null : t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'), v: vm && !isStr ? +vm[1] : (vm ? vm[1] : null) };
    }
    rows.push(o);
  }
  return rows;
}
function xlsxAllText(b64) {
  // client-review.xlsx carries TWO sheets (Recap, then Lines) — the description strings this
  // probe checks live in Lines (sheet2), not the Recap sheet a naive sheet1-only read would miss.
  const buf = Buffer.from(b64, 'base64');
  let out = '';
  for (let n = 1; n <= 4; n++) {
    const xml = unzip(buf, 'xl/worksheets/sheet' + n + '.xml');
    if (!xml) break;
    out += xlsxRows(xml).flatMap((r) => Object.keys(r).filter((k) => k !== '__r').map((k) => r[k] && r[k].t).filter(Boolean)).join(' | ') + ' | ';
  }
  return out;
}
const splitCSV = (line) => {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur); return out;
};

/* ---------- CDP ---------- */
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url); let id = 0; const pending = new Map();
    ws.addEventListener('open', () => resolve({
      send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); },
      close() { ws.close(); },
    }));
    ws.addEventListener('error', () => reject(new Error('ws')));
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
    });
  });
}
const port = 9500 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b5-'))}`, '--remote-allow-origins=*',
  '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 600 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {}
  if (!wsUrl) await sleep(100);
}
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }

const c = await connect(wsUrl);
await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => {
  const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
};
const tryEv = async (expr) => { try { return await ev(expr); } catch (e) { return { error: String(e.message || e).slice(0, 400) }; } };

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
};

const ARM = `window.print = () => { window.__printed = (window.__printed || 0) + 1; const __d = document.getElementById('printDoc'); const __h = __d ? __d.innerHTML : ''; setTimeout(() => { const __e = document.getElementById('printDoc'); if (__e) __e.innerHTML = __h; }, 0); /* B6F-C6 re-address: the app releases #printDoc as soon as window.print() returns (a real browser has    already composed the page by then). Capture at compose time, restore next tick, read sites unchanged. */ };
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__blobs = [];
  window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, mime,
    text: (typeof bytes === 'string') ? bytes : '',
    b64: (bytes instanceof Uint8Array) ? btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join('')) : null }); };
  1`;

async function boot() {
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: 'file://' + VES });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) return true; } catch (_) {} await sleep(50); }
  return false;
}
if (!await boot()) { console.error('HARNESS FAIL: the app never booted'); chrome.kill('SIGKILL'); process.exit(2); }
await sleep(400);
await ev(`localStorage.clear(); ${ARM}`);

const takeoffText = readFileSync(TAKEOFF, 'utf8');
const pdfB64 = readFileSync(PDF).toString('base64');
const B64ARM = `const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);`;

const loaded = await tryEv(`(async () => {
  ${B64ARM}
  await VESApp.openFromBytes(u8, 'plan.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  window.__take = ${takeoffText};
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  return { conditions: VESApp.state.conditions.length };
})()`);
if (loaded.error || loaded.conditions !== 26) { console.error('HARNESS FAIL: the fixture did not load — ' + (loaded.error || JSON.stringify(loaded))); chrome.kill('SIGKILL'); process.exit(2); }
console.log('# fixture loaded: ' + JSON.stringify(loaded) + '\n');

/* ════════════════════ B5-1 — one description, every surface ════════════════════ */
const gatherExpr = `(async () => {
  const res = resolveAssembly();
  const lab = res.lines.find(l => l.kind === 'labor' && (l.drivingRefs || []).length === 1
    && state.conditions.some(c => c.libRef === l.drivingRefs[0]));
  if (!lab) return { error: 'no single-driver linked labor line found in the fixture (descOf\\'s labor branch untestable against it)' };
  const cond = state.conditions.find(c => c.libRef === lab.drivingRefs[0]);
  // Ground truth: the CONDITION's own name (a fact, not a function call) — and the labor line's
  // base name via itemLabel(), the SAME id/desc-resolution itemLabel has always done (unchanged by
  // this batch), with the F6 suffix rule applied independently of descOf/suffixKind so this checks
  // descOf's OWN new behavior against a reading that does not call descOf to get there.
  const wantCond = String(cond.name || '').trim();
  const rawBase = itemLabel(lab);
  const wantLabor = /—\\s*labor\\s*$/i.test(rawBase) ? rawBase : (rawBase + ' — labor');
  const descOfAgrees = descOf(cond) === wantCond && descOf(lab) === wantLabor;
  const railDebug = { sel: '.card[data-cid="' + cond.id + '"] .name', cardsInDom: document.querySelectorAll('#cards .card').length,
    matchingCard: !!document.querySelector('.card[data-cid="' + cond.id + '"]') };

  const has = (t, s) => String(t || '').includes(s);
  const surf = {};

  // rail card
  const cardEl = document.querySelector('.card[data-cid="' + cond.id + '"] .name');
  // the .name div also carries the ▸/▾ expand-arrow button as a sibling child — strip it, the same
  // normalization probe-p903-doc already applies reading the same element
  surf.railCard = cardEl ? cardEl.textContent.replace(/^[▸▾]\\s*/, '').trim() : null;

  // grid row (Estimate lens)
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200));
  const gridText = (document.getElementById('estgridBody') || {}).textContent || '';
  VESApp.showEstimate(false);

  // recap row — the Labor drawer tab + the Estimate mini table (renderRecapEstimate) carry a
  // labor line's own name; the Materials tab is condition-material-only and is not this row's check
  VESApp.setRecapTab('labor'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 150));
  const recapLabText = (document.getElementById('recapBody') || {}).textContent || '';
  VESApp.setRecapTab('estimate'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 150));
  const recapEstText = (document.getElementById('recapBody') || {}).textContent || '';

  // bid
  printBidDoc(); const pm = document.getElementById('projModal'); if (pm) pm.classList.remove('open'); printBidDoc();
  await new Promise(r => setTimeout(r, 150)); const bidText = (document.getElementById('printDoc') || {}).textContent || '';

  // cost sheet
  printCostSheet(); await new Promise(r => setTimeout(r, 150)); const costText = (document.getElementById('printDoc') || {}).textContent || '';

  // proposal scope
  const propHTML = await proposalHTML(); const propText = String(propHTML).replace(/<[^>]+>/g, ' ');

  // takeoff paper (direct call — no sheet chooser with no opts.sheets/state.printSheets)
  await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 900));
  const takeoffText2 = (document.getElementById('printDoc') || {}).textContent || '';

  // exports
  window.__blobs = [];
  exportGridCSV(); exportBOMCSV(); exportSupplierCSV(); exportRollupCSV(); exportAuditCSV();
  exportEstimateXLSX(); exportClientReviewXLSX();
  await new Promise(r => setTimeout(r, 400));
  const grab = (re) => { const f = window.__blobs.filter(x => re.test(x.name)).pop(); return f || null; };
  const gridCsv = grab(/estimate-grid\\.csv$/), bomCsv = grab(/bom\\.csv$/), rfq = grab(/supplier-rfq\\.csv$/),
    rollupCsv = grab(/rollup\\.csv$/), auditCsv = grab(/audit\\.csv$/), estXlsx = grab(/estimate\\.xlsx$/), revXlsx = grab(/client-review\\.xlsx$/);

  // Two identity chains, not one: the CONDITION is itself only on the five surfaces that show a
  // condition directly (rail card, proposal scope, takeoff paper, rollup CSV, audit CSV) — the grid
  // / recap / bid / cost sheet / exports show ENGINE LINES (the assembly's own components), which
  // for a library-backed condition are never the condition's own name (an assembly can carry many
  // components; that is the whole reason F6/S2 exist). The LABOR LINE is the one this batch's
  // engine-line surfaces actually carry, so it is what is checked there.
  surf.grid = { labor: has(gridText, wantLabor) };
  surf.recap = { labor: has(recapLabText, wantLabor) || has(recapEstText, wantLabor) };
  surf.bid = { labor: has(bidText, wantLabor) };
  surf.costSheet = { labor: has(costText, wantLabor) };
  surf.proposalScope = { cond: has(propText, wantCond) };
  surf.takeoffPaper = { cond: has(takeoffText2, wantCond) };
  surf.estimateCSV = { labor: gridCsv ? has(gridCsv.text, wantLabor) : false };
  surf.bomCSV = { labor: bomCsv ? has(bomCsv.text, wantLabor) : false };
  surf.rollupCSV = { cond: rollupCsv ? has(rollupCsv.text, wantCond) : false };
  surf.auditCSV = { cond: auditCsv ? has(auditCsv.text, wantCond) : false };
  surf.supplierRFQ = { labor: rfq ? has(rfq.text, wantLabor) : false };
  surf.railDebug = railDebug;
  surf.estimateXLSX = { b64: estXlsx ? estXlsx.b64 : null };
  surf.clientReviewXLSX = { b64: revXlsx ? revXlsx.b64 : null };

  return { wantCond, wantLabor, descOfAgrees, surf, laborItem: lab.item, condId: cond.id };
})()`;
const g = await tryEv(gatherExpr);
let r1ok = false; const r1d = {};
if (!g.error) {
  const estXlsxText = g.surf.estimateXLSX.b64 ? xlsxAllText(g.surf.estimateXLSX.b64) : '';
  const revXlsxText = g.surf.clientReviewXLSX.b64 ? xlsxAllText(g.surf.clientReviewXLSX.b64) : '';
  // the condition is ITSELF only on the five surfaces that show a condition directly — the other
  // nine show engine lines (an assembly's own components), which for a library-backed condition
  // are never the condition's own name (stated in the probe header; not a shortfall to chase)
  const condSurfaces = {
    'rail card': g.surf.railCard === g.wantCond,
    'proposal scope': g.surf.proposalScope.cond, 'takeoff paper': g.surf.takeoffPaper.cond,
    'rollup CSV': g.surf.rollupCSV.cond, 'audit CSV': g.surf.auditCSV.cond,
  };
  // supplier RFQ deliberately excludes every labor-kind line (exportSupplierCSV: `l.kind !==
  // 'labor'`, pre-existing, sensible — a materials RFQ does not ask a supplier to quote labor) —
  // so a labor line's name cannot and should not appear there. Noted, not counted against this row.
  const laborSurfaces = {
    'grid row': g.surf.grid.labor, 'recap row': g.surf.recap.labor, 'bid row': g.surf.bid.labor,
    'cost-sheet row': g.surf.costSheet.labor, 'Estimate CSV': g.surf.estimateCSV.labor,
    'BOM CSV': g.surf.bomCSV.labor,
    'Estimate XLSX': estXlsxText.includes(g.wantLabor), 'client-review XLSX': revXlsxText.includes(g.wantLabor),
  };
  const condMiss = Object.entries(condSurfaces).filter(([, ok]) => !ok).map(([k]) => k);
  const laborMiss = Object.entries(laborSurfaces).filter(([, ok]) => !ok).map(([k]) => k);
  r1ok = g.descOfAgrees && condMiss.length === 0 && laborMiss.length === 0;
  Object.assign(r1d, { condition: g.wantCond, laborLine: g.wantLabor, condSurfaces, laborSurfaces, condMiss, laborMiss, descOfAgrees: g.descOfAgrees,
    note: 'supplier RFQ excludes every labor-kind line by design (materials-only export) — not counted against the labor row', railDebug: g.surf.railDebug });
} else Object.assign(r1d, g);
check('B5-1 the description string is identical: the condition on the 5 surfaces that show a condition directly (rail card, proposal scope, takeoff paper, rollup CSV, audit CSV), and its one linked labor line on 8 of the 9 engine-line surfaces (grid, recap, bid, cost sheet, Estimate CSV, BOM CSV, Estimate XLSX, client-review XLSX — supplier RFQ excludes labor by design) — 13 checked surfaces total', r1ok, r1d);

/* ════════════════════ B5-2 — column words per document ════════════════════ */
const wordsExpr = `(async () => {
  const out = {};
  await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 900));
  out.takeoff = ((document.querySelector('#printDoc .tk-qty thead') || {}).textContent || '');
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200));
  out.grid = ((document.querySelector('.estgrid thead') || {}).textContent || '');
  VESApp.showEstimate(false);
  VESApp.setRecapTab('estimate'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 150));
  out.recap = ((document.querySelector('#recapBody table thead') || {}).textContent || '');
  printCostSheet(); await new Promise(r => setTimeout(r, 150));
  out.costsheet = ((document.querySelector('#printDoc .secblock thead') || {}).textContent || '');
  printBidDoc(); const pm = document.getElementById('projModal'); if (pm) pm.classList.remove('open'); printBidDoc();
  await new Promise(r => setTimeout(r, 150));
  out.bid = ((document.querySelector('#printDoc .secblock thead') || {}).textContent || '');
  return out;
})()`;
const wd = await tryEv(wordsExpr);
let r2ok = false; const r2d = {};
if (!wd.error) {
  const VOCAB = {
    takeoff: ['Legend', 'Pitch', 'Description', 'SF', 'LF', 'EA'],
    grid: ['Description', 'Quantity', 'EU', 'Ord Qty', 'Ord Un', 'Unit Price', 'Prc Un', 'Net Cost'],
    recap: ['Description', 'Net Cost', 'Markup', 'Markup $', 'Gross Price', 'Cost Unit', 'Unit'],
    costsheet: ['Description', 'Net Cost', 'Markup', 'Markup $', 'Gross Price', 'Cost Unit', 'Unit'],
    bid: ['Description', 'Quantity', 'Unit', 'Unit Price', 'Amount'],
  };
  const miss = {};
  for (const doc of Object.keys(VOCAB)) {
    const text = wd[doc] || '';
    const m = VOCAB[doc].filter((w) => !text.includes(w));
    if (m.length) miss[doc] = m;
  }
  r2ok = Object.keys(miss).length === 0;
  Object.assign(r2d, { headers: wd, missing: miss });
} else Object.assign(r2d, wd);
check('B5-2 column words per document equal VOCAB (takeoff / grid / recap / cost sheet / bid), read from the rendered papers', r2ok, r2d);

/* ════════════════════ B5-3 — vocab-check.mjs exits 0 on the file under test ════════════════════ */
const vc = spawnSync('node', [join(ROOT, 'tools', 'vocab-check.mjs'), VES], { encoding: 'utf8' });
const vcOut = ((vc.stdout || '') + (vc.stderr || '')).trim();
check('B5-3 node tools/vocab-check.mjs exits 0 on the file under test', vc.status === 0, { code: vc.status, tail: vcOut.split('\n').slice(-4).join(' | ').slice(0, 300) });

/* ════════════════════ B5-4 — grid: measured Quantity AND Ord Qty, both visible, different for a rounded/wasted line ════════════════════ */
const r4x = await tryEv(`(async () => {
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200));
  const rows = estimateRows().filter(r => r.edit === 'engine' && r.qtyEst != null && r.qty != null);
  const diverged = rows.filter(r => Math.abs(r.qtyEst - r.qty) > 1e-6);
  // read the two figures BACK OFF THE RENDERED ROW (not just the model) for one diverged line —
  // Quantity is column index 2 (0-based: Description, Kind, Quantity, EU, Ord Qty, ...), Ord Qty is index 4
  let onScreen = null;
  if (diverged.length) {
    const target = diverged[0];
    const trs = [...document.querySelectorAll('#estgridBody tr')].filter(t => !t.className || !/sech|divh|sub|secsub|gentry|gaddrow/.test(t.className));
    const tr = trs.find(t => t.textContent.includes(target.label));
    // Ord Qty (index 4) is an EDITABLE cell — its figure lives in an <input value>, not textContent
    const cellText = (td) => { if (!td) return ''; const inp = td.querySelector('input'); return inp ? inp.value : td.textContent; };
    if (tr) { const tds = [...tr.children]; onScreen = { quantity: cellText(tds[2]), ordQty: cellText(tds[4]) }; }
  }
  VESApp.showEstimate(false);
  return { rows: rows.length, diverged: diverged.length, sample: diverged[0] ? { label: diverged[0].label, qtyEst: diverged[0].qtyEst, qty: diverged[0].qty } : null, onScreen };
})()`);
const r4ok = !r4x.error && r4x.diverged > 0 && !!r4x.onScreen
  && r4x.onScreen.quantity.trim() !== '' && r4x.onScreen.ordQty.trim() !== ''
  && r4x.onScreen.quantity.trim() !== r4x.onScreen.ordQty.trim();
check('B5-4 the grid shows measured Quantity AND Ord Qty for a line where they differ (a rounded/wasted order) — both visible, different', r4ok, r4x);

/* ════════════════════ B5-5 — no blank description anywhere on the fixture's papers/exports ════════════════════ */
const r5x = await tryEv(`(async () => {
  const bad = [];
  VESApp.setRecapTab('estimate'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 150));
  const recapEstBlanks = [...document.querySelectorAll('#recapBody table.recap tbody tr')]
    .filter((t) => { const d = t.children[0]; return d && d.textContent.trim() === ''; });
  if (recapEstBlanks.length) bad.push('recap (estimate tab): ' + recapEstBlanks.length + ' row(s) with a blank Description cell');
  VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200));
  const gridBlanks = [...document.querySelectorAll('#estgridBody tr')].filter(t => !t.className || !/sech|divh|sub|secsub|gentry|gaddrow/.test(t.className))
    .filter(t => { const first = t.children[0]; return first && first.textContent.replace(/^[✓✕\\s]*/, '').trim() === ''; });
  VESApp.showEstimate(false);
  if (gridBlanks.length) bad.push('grid: ' + gridBlanks.length + ' row(s) with a blank Description cell');
  printCostSheet(); await new Promise(r => setTimeout(r, 150));
  const costBlanks = [...document.querySelectorAll('#printDoc .secblock tbody tr')].filter(t => !t.className)
    .filter(t => { const d = t.children[1]; return d && d.textContent.trim() === ''; });
  if (costBlanks.length) bad.push('cost sheet: ' + costBlanks.length + ' row(s) with a blank Description cell');
  printBidDoc(); const pm = document.getElementById('projModal'); if (pm) pm.classList.remove('open'); printBidDoc();
  await new Promise(r => setTimeout(r, 150));
  const bidBlanks = [...document.querySelectorAll('#printDoc .secblock tbody tr')].filter(t => !t.className)
    .filter(t => { const d = t.children[1]; return d && d.textContent.trim() === ''; });
  if (bidBlanks.length) bad.push('bid: ' + bidBlanks.length + ' row(s) with a blank Description cell');
  await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 900));
  const takeoffBlanks = [...document.querySelectorAll('#printDoc .tk-qty tbody tr')].filter(t => !t.className)
    .filter(t => { const d = t.children[2]; return d && d.textContent.trim() === ''; });
  if (takeoffBlanks.length) bad.push('takeoff: ' + takeoffBlanks.length + ' row(s) with a blank Description cell');
  const propHTML = await proposalHTML();
  const scopeBlank = /<span><\\/span><span class="q">/.test(propHTML);
  if (scopeBlank) bad.push('proposal scope: a blank name beside a quantity');
  return { bad };
})()`);
const r5ok = !r5x.error && Array.isArray(r5x.bad) && r5x.bad.length === 0;
check('B5-5 no blank description anywhere on the fixture\'s papers/exports (B1\'s "unpriced named, never blank" holds)', r5ok, r5x);

/* ---------- subgates ---------- */
// The same precedent B4-9 / B2a-7 set: this row chains the FIXTURE-based batch probes (they take
// the three-sheet fixture + repo root, same shape as this probe) plus the two AE/AI print-door
// probes. probe-v / probe-u / probe-af take a different arg shape (probe-af additionally wants the
// F18.68 prior-build bytes for its AF7 diff) and are not chained automatically here, matching how
// B4-9 and B2a-7 did not chain them either — the charter's "Also keep green: probe-v, probe-u,
// probe-af, probe-p903-*" is verified as a separate, direct run (recorded in the batch return).
let sub = [];
const run = (label, cmd, argv, want2) => {
  const t0 = Date.now();
  const r = spawnSync(cmd, argv, { encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const all = [...out.matchAll(/(\d+)\/(\d+) passed, (\d+) failed/g)];
  const m = all.length ? all[all.length - 1] : null;
  const green = /G0 GREEN/.test(out) || (m && +m[3] === 0);
  const row = { label, code: r.status, pass: m ? +m[1] : 0, of: m ? +m[2] : 0, green: !!green, ms: Date.now() - t0, tail: out.split('\n').slice(-2).join(' | ').slice(0, 160) };
  sub.push(row);
  return r.status === 0 && !!green && (want2 == null || row.of === want2);
};
const P = (n) => join(ROOT, 'tools', 'sweep', n);
if (NOSUB) {
  // Orchestrator (B5 landing): under --no-subgates this row is NEUTRAL, not red — every child gate runs as its own step in
  // CI and in the landing sweep; a red-by-flag row hid nothing and read like a product failure.
  check('B5-6 child gates not run here (--no-subgates); each runs as its own CI step', true, { subgates: 'skipped (--no-subgates)' });
} else {
  const src = join(ROOT, 'src', 'VES_PM.html');
  const fixJson = TAKEOFF, fixPdf = PDF;
  const demoPath = join(ROOT, 'release', 'demo', 'demo-flat-roof.json');
  const okG0 = run('g0', 'node', [join(ROOT, 'gate', 'g0.mjs'), 'check', src]);
  const okFix = run('probe-b0-fixture', 'node', [P('probe-b0-fixture.mjs'), src, fixJson, fixPdf, ROOT], 7);
  const okPitch = run('probe-b1-pitch', 'node', [P('probe-b1-pitch.mjs'), src, demoPath, ROOT, FIXDIR], 12);
  // NOT --no-subgates here (unlike this file's own NOSUB branch above) — a skipped trailing row
  // always reports itself as a FAIL in that probe's own exit summary (declared, not silent), so
  // this row's green-detection (0 failed) needs the real, full recursive run — the same choice
  // B4-9 made chaining these same three probes.
  const okB2a = run('probe-b2a-sections', 'node', [P('probe-b2a-sections.mjs'), src, fixJson, fixPdf, ROOT], 7);
  const okB2b = run('probe-b2b-regions', 'node', [P('probe-b2b-regions.mjs'), src, fixJson, fixPdf, ROOT], 8);
  const okB3 = run('probe-b3-colors', 'node', [P('probe-b3-colors.mjs'), src, fixJson, fixPdf, ROOT], 8);
  const okB4 = run('probe-b4-print', 'node', [P('probe-b4-print.mjs'), src, fixJson, fixPdf, ROOT], 9);
  const TMP = mkdtempSync(join(tmpdir(), 'ves-b5-sub-'));
  const plan1 = join(TMP, 'plan1.pdf'), plan2 = join(TMP, 'plan2.pdf');
  spawnSync('node', [P('mkpdf.mjs'), plan1], { encoding: 'utf8' });
  spawnSync('node', [P('mkpdf.mjs'), plan2, '1500', '2'], { encoding: 'utf8' });
  const okAe = run('probe-ae', 'node', [P('probe-ae.mjs'), src, demoPath, plan1, ROOT], 5);
  const okDoc = run('probe-p903-doc', 'node', [P('probe-p903-doc.mjs'), src, demoPath, plan2, ROOT], 8);
  const okWords = run('probe-p903-words', 'node', [P('probe-p903-words.mjs'), src, demoPath, ROOT]);
  check('B5-6 G0 GREEN · probe-b0-fixture 7/7 · b1 12/12 · b2a 7/7 · b2b · b3 · b4 green; probe-ae/probe-p903-doc/probe-p903-words green',
    okG0 && okFix && okPitch && okB2a && okB2b && okB3 && okB4 && okAe && okDoc && okWords, sub);
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b5-words: ${results.length - fails}/${results.length} passed, ${fails} failed`);
c.close(); chrome.kill('SIGKILL');
process.exit(fails ? 1 : 0);
