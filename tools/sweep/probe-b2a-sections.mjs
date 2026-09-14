/* Batch B2a gate — SECTIONS, TYPED: Section → System nested subtotals (plan §B2a, rulings R-5 / R-5b / R-5c / R-5d).
 * RED-first on the 2.0.0-rc.2 base. Zero deps; raw CDP; same CLI shape as probe-b0-fixture.mjs.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b2a-sections.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet/takeoff.v3.json" \
 *     "$PWD/fixtures/synthetic/three-sheet/plan.pdf" "$PWD" [--no-subgates]
 *
 * Rows B2a-1 … B2a-7, PASS/FAIL + value each; exit 0 all green, 1 on any FAIL, 2 if Chrome never came up.
 * The probe never re-derives the app's money: every figure it compares is READ OFF A SURFACE —
 * the rendered recap rows, the printed bid and cost sheet, the exported CSV / workbook bytes —
 * and the only arithmetic it does is addition of what those surfaces printed.
 *
 * The fixture carries four sections on its `location` axis: Main Roof (13) · Annex (5) ·
 * Canopy (4) · four conditions with `location: ""` (the named section "Unassigned").
 * B2a-2 adds one General line through the app's own door to see the "Project" section.
 *
 * `--no-subgates` skips B2a-7's three child gates (G0, probe-b0-fixture, probe-b1-pitch), which
 * launch Chrome three more times. Green means nothing without them; the flag exists for the
 * inner loop only, and the row says so in its detail.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const NOSUB = args.includes('--no-subgates');
const [VES, TAKEOFF, PDF, ROOT] = args.filter((a) => !a.startsWith('--'));
if (!VES || !TAKEOFF || !PDF || !ROOT) {
  console.error('usage: probe-b2a-sections.mjs <VES_PM.html> <takeoff.v3.json> <plan.pdf> <repoRoot> [--no-subgates]');
  process.exit(2);
}
const FIXDIR = dirname(TAKEOFF);

/* ---------- a minimal zip reader, so the XLSX surface can be read without a dependency ---------- */
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
// sheet1 cells → [{ref, t (inline/shared text), v (number), f (formula)}] keyed by column letter per row
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
      const fm = /<f>([\s\S]*?)<\/f>/.exec(inner);
      o[ref] = { t: t == null ? null : t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        v: vm && !isStr ? +vm[1] : (vm ? vm[1] : null), f: fm ? fm[1] : null };
    }
    rows.push(o);
  }
  return rows;
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
function connect(url, onEvent) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url); let id = 0; const pending = new Map();
    ws.addEventListener('open', () => resolve({
      send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); },
      close() { ws.close(); },
    }));
    ws.addEventListener('error', () => reject(new Error('ws')));
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
      else if (onEvent) onEvent(msg);
    });
  });
}
const port = 9600 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b2a-'))}`, '--remote-allow-origins=*',
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
const tryEv = async (expr) => { try { return await ev(expr); } catch (e) { return { error: String(e.message || e).slice(0, 300) }; } };

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
};

/* ---------- boot + load the fixture through the app's own doors ---------- */
const takeoffText = readFileSync(TAKEOFF, 'utf8');
const pdfB64 = readFileSync(PDF).toString('base64');

await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file://' + VES });
let booted = false;
for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { booted = true; break; } } catch (_) {} await sleep(50); }
await sleep(400);
if (!booted) { console.error('HARNESS FAIL: the app never booted'); chrome.kill('SIGKILL'); process.exit(2); }

await ev(`localStorage.clear(); window.print = () => { window.__printed = (window.__printed || 0) + 1; };
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__blobs = [];
  window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, mime,
    text: (typeof bytes === 'string') ? bytes : '',
    b64: (bytes instanceof Uint8Array) ? btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join('')) : null }); };
  window.__money = (s) => { const m = /-?\\$?\\s*-?[\\d,]+\\.\\d\\d/.exec(String(s || '')); if (!m) return null;
    const neg = /^\\s*-|\\(\\s*\\$/.test(String(s)); const n = Math.round(Math.abs(parseFloat(m[0].replace(/[^0-9.]/g, ''))) * 100); return neg ? -n : n; };
  1`);

const loaded = await tryEv(`(async () => {
  const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  window.__take = ${takeoffText};
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  const m = VESApp.recapModel();
  return { conditions: VESApp.state.conditions.length, sections: [...new Set(VESApp.state.conditions.map(c => (c.location || '').trim()))],
    costCents: Math.round(m.cost * 100), sellCents: Math.round(m.sell * 100), lineCount: m.lineCount };
})()`);
if (loaded.error) { console.error('HARNESS FAIL: the fixture did not load — ' + loaded.error); chrome.kill('SIGKILL'); process.exit(2); }
console.log('# fixture loaded: ' + JSON.stringify(loaded) + '\n');

/* ════ B2a-1 — the recap groups Section → System, and every subtotal adds ════════════════════════════ */
const recapRead = `(async () => {
  VESApp.setRecapTab('summary'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 200));
  const host = document.getElementById('recapBody');
  const tbl = host && host.querySelector('table.recap-sections');
  if (!tbl) return { present: false, tables: [...(host ? host.querySelectorAll('table.recap') : [])].map(t => t.className) };
  const cellC = (tr, i) => window.__money((tr.children[i] || {}).textContent);
  const secs = [], syss = [];
  for (const tr of tbl.querySelectorAll('tr.sech')) secs.push({ sec: tr.dataset.sec,
    text: tr.children[0].textContent.replace(/\\s+/g, ' ').trim(), cost: cellC(tr, 4), sell: cellC(tr, 5) });
  for (const tr of tbl.querySelectorAll('tr.sysr')) syss.push({ sec: tr.dataset.sec, sys: tr.dataset.sys,
    text: tr.children[0].textContent.replace(/\\s+/g, ' ').trim(), cost: cellC(tr, 4), sell: cellC(tr, 5) });
  const foot = tbl.querySelector('tfoot tr');
  const m = VESApp.recapModel();
  return { present: true, secs, syss,
    footCost: foot ? window.__money((foot.children[4] || {}).textContent) : null,
    footSell: foot ? window.__money((foot.children[5] || {}).textContent) : null,
    grandCost: Math.round(m.cost * 100), grandSell: Math.round(m.sell * 100),
    head: [...tbl.querySelectorAll('thead th')].map(th => th.textContent.trim()) };
})()`;
const r1 = await tryEv(recapRead);
let r1ok = false; const r1d = {};
if (!r1.error && r1.present) {
  const sumSecCost = r1.secs.reduce((a, s) => a + (s.cost || 0), 0);
  const sumSecSell = r1.secs.reduce((a, s) => a + (s.sell || 0), 0);
  const bad = [];
  for (const s of r1.secs) {
    const kids = r1.syss.filter((y) => y.sec === s.sec);
    if (!kids.length) { bad.push(s.sec + ': no system rows'); continue; }
    const kc = kids.reduce((a, y) => a + (y.cost || 0), 0), ks = kids.reduce((a, y) => a + (y.sell || 0), 0);
    if (kc !== s.cost) bad.push(`${s.sec}: Σ system cost ${kc} vs section ${s.cost}`);
    if (ks !== s.sell) bad.push(`${s.sec}: Σ system sell ${ks} vs section ${s.sell}`);
  }
  Object.assign(r1d, { sections: r1.secs.map((s) => s.sec), systems: r1.syss.length,
    sumSecCost, grandCost: r1.grandCost, sumSecSell, grandSell: r1.grandSell, head: r1.head, nested: bad.slice(0, 6) });
  r1ok = r1.secs.length >= 4 && sumSecCost === r1.grandCost && sumSecSell === r1.grandSell
    && r1.footCost === r1.grandCost && r1.footSell === r1.grandSell && bad.length === 0;
} else Object.assign(r1d, r1);
check('B2a-1 the recap summary groups Section → System with a subtotal at each level; Σ section subtotals == the grand, Σ system subtotals == their section, to the cent', r1ok, r1d);

/* ════ B2a-2 — "Unassigned" is a named section; a General line lands under "Project" ═══════════════ */
const r2 = await tryEv(`(async () => {
  const before = VESApp.recapModel();
  const rows0 = [...document.querySelectorAll('#recapBody table.recap-sections tr.sech')].map(t => t.dataset.sec);
  // add one General line through the app's own door (the fixture carries none)
  VESApp.addGeneralItem();
  const g = VESApp.state.assemblyProject.general; const gi = g.length - 1;
  setGeneralField(gi, 'label', 'Site supervision (probe)');
  setGeneralField(gi, 'qty', 2); setGeneralField(gi, 'unit_cost', 500); setGeneralField(gi, 'csi', '01 31 00');
  VESApp.setRecapTab('summary'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 250));
  const tbl = document.querySelector('#recapBody table.recap-sections');
  const secs = tbl ? [...tbl.querySelectorAll('tr.sech')].map(t => ({ sec: t.dataset.sec, cost: window.__money((t.children[4] || {}).textContent) })) : [];
  const syss = tbl ? [...tbl.querySelectorAll('tr.sysr')].map(t => ({ sec: t.dataset.sec, sys: t.dataset.sys, cost: window.__money((t.children[4] || {}).textContent) })) : [];
  const after = VESApp.recapModel();
  // put the job back the way it was
  VESApp.removeGeneralItem(gi); VESApp.setRecapTab('summary'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 200));
  const restored = VESApp.recapModel();
  return { rows0, secs, syss, unassignedConds: VESApp.state.conditions.filter(c => !String(c.location || '').trim()).length,
    genCostCents: Math.round((after.cost - before.cost) * 100),
    restoredCents: Math.round(restored.cost * 100), beforeCents: Math.round(before.cost * 100) };
})()`);
let r2ok = false; const r2d = {};
if (!r2.error) {
  const un = (r2.secs || []).find((s) => s.sec === 'Unassigned');
  const pj = (r2.secs || []).find((s) => s.sec === 'Project');
  const pjSys = (r2.syss || []).filter((y) => y.sec === 'Project');
  Object.assign(r2d, { sections: (r2.secs || []).map((s) => s.sec), unassigned: un || null, project: pj || null,
    projectSystems: pjSys.map((y) => y.sys), unassignedConditions: r2.unassignedConds,
    generalLineCents: r2.genCostCents, restoredEqualsBefore: r2.restoredCents === r2.beforeCents });
  r2ok = !!un && un.cost != null && r2.unassignedConds === 4
    && !!pj && pj.cost === r2.genCostCents && pj.cost === 100000
    && pjSys.some((y) => /General/.test(y.sys || ''))
    && r2.restoredCents === r2.beforeCents;
} else Object.assign(r2d, r2);
check('B2a-2 "Unassigned" is a named section with its own subtotal (never dropped); a General line rolls under the named section "Project"', r2ok, r2d);

/* ════ B2a-3 — the three papers carry Section headings, and their subtotals are the recap's ════════ */
const r3 = await tryEv(`(async () => {
  const txt = () => { const d = document.getElementById('printDoc'); return d ? d.textContent.replace(/\\s+/g, ' ') : ''; };
  const readDoc = () => {
    const d = document.getElementById('printDoc');
    const heads = [...d.querySelectorAll('[data-sec]')].map(e => e.dataset.sec);
    const subs = [...d.querySelectorAll('tr.secsub')].map(tr => ({ sec: tr.dataset.sec,
      cells: [...tr.children].map(td => window.__money(td.textContent)).filter(x => x != null),
      text: tr.textContent.replace(/\\s+/g, ' ').trim() }));
    const total = (() => { const t = [...d.querySelectorAll('tr.grand')].filter(tr => /^\\s*Total\\b/.test(tr.textContent.trim())).pop();
      return t ? window.__money(t.children[t.children.length - 1].textContent) : null; })();
    return { heads: [...new Set(heads)], subs, total, headingText: (d.textContent.match(/Section: [^$\\n]{1,40}/g) || []).slice(0, 12) };
  };
  const out = {};
  printBidDoc(); const pm = document.getElementById('projModal'); if (pm) pm.classList.remove('open'); printBidDoc();
  await new Promise(r => setTimeout(r, 120)); out.bid = readDoc();
  out.bidZeroSkipped = /zero-quantity line/.test(document.getElementById('toast').textContent) ? document.getElementById('toast').textContent.slice(0, 60) : 'none';
  printCostSheet(); await new Promise(r => setTimeout(r, 120)); out.cost = readDoc();
  await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 1200));
  const d = document.getElementById('printDoc');
  out.takeoff = { heads: [...new Set([...d.querySelectorAll('.tk-qty [data-sec]')].map(e => e.dataset.sec))],
    subs: [...d.querySelectorAll('.tk-qty tr.secsub')].map(tr => tr.textContent.replace(/\\s+/g, ' ').trim()),
    money: /\\$/.test(d.textContent), headingText: (d.textContent.match(/Section: [^\\n]{1,40}/g) || []).slice(0, 8) };
  return out;
})()`);
const r3d = {}; let r3ok = false;
if (!r3.error) {
  const secOf = (r1.secs || []).reduce((o, s) => { o[s.sec] = s; return o; }, {});
  const bidSubs = (r3.bid.subs || []), costSubs = (r3.cost.subs || []);
  const bidSum = bidSubs.reduce((a, s) => a + (s.cells[s.cells.length - 1] || 0), 0);
  const mism = [];
  for (const s of costSubs) { const want = secOf[s.sec]; if (!want) { mism.push('cost sheet: unknown section ' + s.sec); continue; }
    if (s.cells[0] !== want.cost) mism.push(`cost sheet ${s.sec}: Cost ${s.cells[0]} vs recap ${want.cost}`);
    if (s.cells[s.cells.length - 1] !== want.sell) mism.push(`cost sheet ${s.sec}: Sell ${s.cells[s.cells.length - 1]} vs recap ${want.sell}`); }
  for (const s of bidSubs) { const want = secOf[s.sec]; if (!want) { mism.push('bid: unknown section ' + s.sec); continue; }
    const v = s.cells[s.cells.length - 1];
    if (v !== want.sell) mism.push(`bid ${s.sec}: ${v} vs recap sell ${want.sell}`); }
  Object.assign(r3d, { bidSections: r3.bid.heads, bidTotal: r3.bid.total, bidSumOfSections: bidSum,
    bidZeroSkipped: r3.bidZeroSkipped, costSections: r3.cost.heads, takeoffSections: r3.takeoff.heads,
    takeoffSubtotals: r3.takeoff.subs.slice(0, 5), takeoffHasMoney: r3.takeoff.money,
    bidHeadings: r3.bid.headingText.slice(0, 4), mismatches: mism.slice(0, 6) });
  const want4 = ['Main Roof', 'Annex', 'Canopy', 'Unassigned'];
  const has = (a) => want4.every((n) => (a || []).indexOf(n) >= 0);
  r3ok = has(r3.bid.heads) && has(r3.cost.heads) && has(r3.takeoff.heads)
    && r3.bid.headingText.some((t) => /^Section: /.test(t))
    && r3.takeoff.headingText.some((t) => /^Section: /.test(t))
    && r3.takeoff.money === false
    && r3.takeoff.subs.length >= 4 && r3.takeoff.subs.every((t) => /SF|LF|EA/.test(t))
    && bidSum === r3.bid.total && mism.length === 0;
} else Object.assign(r3d, r3);
check('B2a-3 the client bid, the cost sheet and the takeoff paper carry "Section: <name>" headings; the money papers print the recap\'s own section subtotals and add to their Total; the takeoff carries SF/LF/EA subtotals and no money', r3ok, r3d);

/* ════ B2a-4 — the exports carry the section, and a save→reload keeps the names ══════════════════ */
const r4 = await tryEv(`(async () => {
  const grab = (re) => { const f = window.__blobs.filter(x => re.test(x.name)).pop(); return f || null; };
  window.__blobs = [];
  exportGridCSV(); await new Promise(r => setTimeout(r, 200));
  const gridCsv = grab(/estimate-grid\\.csv$/);
  window.__blobs = []; exportSupplierCSV(); await new Promise(r => setTimeout(r, 200));
  const rfq = grab(/supplier-rfq\\.csv$/);
  window.__blobs = []; exportEstimateXLSX(); await new Promise(r => setTimeout(r, 300));
  const xl = grab(/\\.xlsx$/);
  // save → reload: the section names must survive the round trip untouched
  const before = VESApp.state.conditions.map(c => [c.id, String(c.location || '')]);
  const json = JSON.stringify(VESApp.snapshot());
  VESApp.newTakeoff(); await new Promise(r => setTimeout(r, 150));
  VESApp.loadFromData(JSON.parse(json)); await new Promise(r => setTimeout(r, 700));
  const after = VESApp.state.conditions.map(c => [c.id, String(c.location || '')]);
  return { gridCsv: gridCsv ? gridCsv.text : null, rfq: rfq ? rfq.text : null, xlsxB64: xl ? xl.b64 : null,
    roundTrip: JSON.stringify(before) === JSON.stringify(after), before: before.slice(0, 3), after: after.slice(0, 3),
    version: JSON.parse(json).version, sellCents: Math.round(VESApp.recapModel().sell * 100) };
})()`);
const r4d = {}; let r4ok = false;
if (!r4.error) {
  // grid CSV — a trailing `section` column, and the fixture's four names in it
  const gl = String(r4.gridCsv || '').split(/\r?\n/).filter(Boolean).map(splitCSV);
  const gh = gl[0] || []; const gsi = gh.indexOf('section');
  const gsecs = [...new Set(gl.slice(1).map((r) => r[gsi]).filter(Boolean))];
  // RFQ — same, trailing
  const rl = String(r4.rfq || '').split(/\r?\n/).filter(Boolean).map(splitCSV);
  const rh = rl[0] || []; const rsi = rh.indexOf('section');
  const rsecs = [...new Set(rl.slice(1).map((r) => r[rsi]).filter(Boolean))];
  // XLSX — a Section column and section subtotal rows that are live SUMs
  let xl = { ok: false };
  if (r4.xlsxB64) {
    const xml = unzip(Buffer.from(r4.xlsxB64, 'base64'), 'xl/worksheets/sheet1.xml') || '';
    const rows = xlsxRows(xml);
    const hdr = rows[0] || {};
    const secCol = Object.keys(hdr).find((k) => k !== '__r' && /^section$/i.test(hdr[k].t || ''));
    const qnCol = Object.keys(hdr).find((k) => k !== '__r' && /^qty needed$/i.test(hdr[k].t || ''));
    const subs = rows.filter((r) => r.C && /section subtotal/i.test(r.C.t || ''));
    const live = subs.filter((r) => r.G && r.G.f && /^SUM\(G\d+:G\d+\)$/.test(r.G.f));
    const costRow = rows.find((r) => r.C && /^Cost/.test(r.C.t || ''));
    const names = [...new Set(rows.slice(1).map((r) => secCol && r[secCol] ? r[secCol].t : null).filter(Boolean))];
    xl = { secCol, qtyNeededCol: qnCol, subtotalRows: subs.length, liveSums: live.length,
      costFormula: costRow && costRow.G ? costRow.G.f : null, names,
      ok: !!secCol && subs.length >= 4 && live.length === subs.length && names.length >= 4 };
  }
  Object.assign(r4d, { gridHeader: gh, gridSectionCol: gsi, gridSections: gsecs,
    rfqHeader: rh, rfqSectionCol: rsi, rfqSections: rsecs, xlsx: xl,
    roundTrip: r4.roundTrip, version: r4.version });
  const want4 = ['Main Roof', 'Annex', 'Canopy', 'Unassigned'];
  r4ok = gsi === gh.length - 1 && gsi > 7 && want4.every((n) => gsecs.indexOf(n) >= 0)
    && rsi === rh.length - 1 && rsi > 0 && rsecs.length > 0
    && xl.ok && xl.qtyNeededCol === 'M'
    && r4.roundTrip === true && r4.version >= 4;
} else Object.assign(r4d, r4);
check('B2a-4 the Estimate CSV gains a trailing `section` column, the supplier RFQ gains `section`, the workbook gains a Section column with live SUM section subtotals (Qty needed stays column M), and save → reload keeps every section name', r4ok, r4d);

/* ════ B2a-5 — the rename door moves every condition, is journaled by name, and Ctrl+Z restores ═══ */
const r5 = await tryEv(`(async () => {
  const sellBefore = Math.round(VESApp.recapModel().sell * 100);
  const annexBefore = VESApp.state.conditions.filter(c => String(c.location || '').trim() === 'Annex').map(c => c.id);
  const jBefore = VESApp.state.journal.undo.length;
  const doorInRecap = (() => { VESApp.setRecapTab('summary'); VESApp.renderRecap();
    return !!document.querySelector('#recapBody [data-secrename]'); })();
  if (typeof VESApp.renameSection !== 'function') return { noDoor: true, doorInRecap, annexBefore: annexBefore.length };
  const moved = VESApp.renameSection('Annex', 'East Annex');
  await new Promise(r => setTimeout(r, 250));
  const afterNames = VESApp.state.conditions.filter(c => annexBefore.indexOf(c.id) >= 0).map(c => c.location);
  const sellAfter = Math.round(VESApp.recapModel().sell * 100);
  const label = VESApp.state.journal.undo.length ? VESApp.state.journal.undo[VESApp.state.journal.undo.length - 1].label : null;
  const jAfter = VESApp.state.journal.undo.length;
  // the recap follows on the same pass
  VESApp.setRecapTab('summary'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 200));
  const secsAfter = [...document.querySelectorAll('#recapBody table.recap-sections tr.sech')].map(t => t.dataset.sec);
  VESApp.undo(); await new Promise(r => setTimeout(r, 250));
  const restored = VESApp.state.conditions.filter(c => annexBefore.indexOf(c.id) >= 0).map(c => c.location);
  const sellBack = Math.round(VESApp.recapModel().sell * 100);
  VESApp.setRecapTab('summary'); VESApp.renderRecap(); await new Promise(r => setTimeout(r, 200));
  const secsBack = [...document.querySelectorAll('#recapBody table.recap-sections tr.sech')].map(t => t.dataset.sec);
  return { doorInRecap, moved, count: annexBefore.length, afterNames: [...new Set(afterNames)], restored: [...new Set(restored)],
    label, journalGrew: jAfter - jBefore, sellBefore, sellAfter, sellBack, secsAfter, secsBack,
    caseInsensitive: VESApp.renameSection('annex', 'Annex') };
})()`);
const r5d = {}; let r5ok = false;
if (!r5.error) {
  Object.assign(r5d, r5);
  r5ok = !r5.noDoor && r5.doorInRecap === true && r5.count === 5 && r5.moved === 5
    && JSON.stringify(r5.afterNames) === '["East Annex"]'
    && JSON.stringify(r5.restored) === '["Annex"]'
    && /Annex/.test(r5.label || '') && /East Annex/.test(r5.label || '') && r5.journalGrew === 1
    && r5.sellBefore === r5.sellAfter && r5.sellAfter === r5.sellBack
    && (r5.secsAfter || []).indexOf('East Annex') >= 0 && (r5.secsBack || []).indexOf('Annex') >= 0;
} else Object.assign(r5d, r5);
check('B2a-5 the "Rename section" door moves every condition in Annex → East Annex, is journaled under both names, Ctrl+Z restores it, and the grand total never moves', r5ok, r5d);

/* ════ B2a-6 — the division chip still filters inside the new grouping ══════════════════════════ */
const r6 = await tryEv(`(async () => {
  VESApp.showEstimate(true); state.gridDiv = 'all'; VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 250));
  const readGrid = () => {
    const b = document.getElementById('estgridBody');
    const secs = [...b.querySelectorAll('tr.sech')].map(t => t.dataset.sec);
    const syss = [...b.querySelectorAll('tr.divh')].map(t => ({ sec: t.dataset.sec, sys: t.dataset.sys }));
    const secSubs = [...b.querySelectorAll('tr.secsub')].map(t => ({ sec: t.dataset.sec, v: window.__money(t.children[t.children.length - 1].textContent) }));
    const sysSubs = [...b.querySelectorAll('tr.sub')].map(t => ({ sec: t.dataset.sec, sys: t.dataset.sys, v: window.__money(t.children[t.children.length - 1].textContent) }));
    const lineRows = [...b.querySelectorAll('tr')].filter(t => !t.className || !/sech|divh|sub|secsub|gaddrow|gentry/.test(t.className));
    const order = [...b.querySelectorAll('tr.sech, tr.divh')].map(t => t.classList.contains('sech') ? 'SEC' : 'SYS').join(',');
    const foot = document.getElementById('estgridFoot').textContent.replace(/\\s+/g, ' ');
    return { secs, syss, secSubs, sysSubs, lineRows: lineRows.length, order, foot };
  };
  const all = readGrid();
  const divs = VESApp.recapModel().divs;
  const pick = divs.find(d => d !== '—') || divs[0];
  state.gridDiv = pick; VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 250));
  const filtered = readGrid();
  const rowsDiv = VESApp.estimateRows().filter(r => r.div === pick && !r.omitted);
  const wantCents = Math.round(rowsDiv.reduce((a, r) => a + (r.total || 0), 0) * 100);
  state.gridDiv = 'all'; VESApp.renderEstimateGrid(); await new Promise(r => setTimeout(r, 200));
  VESApp.showEstimate(false);
  const m = VESApp.recapModel();
  return { all, filtered, pick, wantCents, divs, grandSellCents: Math.round(m.sell * 100),
    footSellCents: window.__money((filtered.foot.match(/Sell\\s*\\$?\\s*[\\d,]+\\.\\d\\d/) || [])[0] || '') };
})()`);
const r6d = {}; let r6ok = false;
if (!r6.error) {
  const filteredSum = (r6.filtered.secSubs || []).reduce((a, s) => a + (s.v || 0), 0);
  const allSum = (r6.all.secSubs || []).reduce((a, s) => a + (s.v || 0), 0);
  // R-5b: the SYSTEM subtotals a section shows must add to the SECTION subtotal it shows
  const nest = [];
  for (const sc of (r6.all.secSubs || [])) {
    const kids = (r6.all.sysSubs || []).filter((y) => y.sec === sc.sec);
    if (!kids.length) { nest.push(sc.sec + ': no system subtotal rows'); continue; }
    const k = kids.reduce((a, y) => a + (y.v || 0), 0);
    if (k !== sc.v) nest.push(`${sc.sec}: \u03a3 system ${k} vs section ${sc.v}`);
  }
  Object.assign(r6d, { sectionsAll: r6.all.secs, systemsAll: r6.all.syss.length, headerOrder: (r6.all.order || '').slice(0, 60),
    chip: r6.pick, sectionsFiltered: r6.filtered.secs, filteredSectionSum: filteredSum, filteredRowsSum: r6.wantCents,
    allSectionSum: allSum, footSellCents: r6.footSellCents, grandSellCents: r6.grandSellCents,
    filteredLineRows: r6.filtered.lineRows, allLineRows: r6.all.lineRows, nested: nest.slice(0, 6) });
  r6ok = (r6.all.secs || []).length >= 4 && /^SEC,SYS/.test(r6.all.order || '')
    && (r6.all.syss || []).every((y) => y.sec && y.sys) && nest.length === 0
    && filteredSum === r6.wantCents && r6.filtered.lineRows < r6.all.lineRows
    && r6.footSellCents === r6.grandSellCents;
} else Object.assign(r6d, r6);
check('B2a-6 the Estimate grid heads Section → System with a subtotal at each level; the division chip filters rows inside that grouping (section subtotals follow the filter) and the footer still shows the whole-project recap Sell', r6ok, r6d);

/* ════ B2a-7 — grouping moved no money: the money gates hold ════════════════════════════════════ */
const sub = [];
if (NOSUB) {
  check('B2a-7 G0 4/4 · probe-b0-fixture 7/7 · probe-b1-pitch 12/12 — grouping moves no money', false,
    { skipped: '--no-subgates was passed; this row proves nothing until it is run without it' });
} else {
  const run = (label, cmd, a) => { const t0 = Date.now();
    const r = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
    const out = String(r.stdout || '') + String(r.stderr || '');
    const pass = (out.match(/^PASS /gm) || []).length, fail = (out.match(/^FAIL /gm) || []).length;
    const green = /G0 GREEN/.test(out);
    sub.push({ label, code: r.status, pass, fail, green, ms: Date.now() - t0, tail: out.trim().split('\n').slice(-2).join(' | ').slice(0, 200) });
    return r.status === 0; };
  const okG0 = run('g0', 'node', [join(ROOT, 'gate', 'g0.mjs'), 'check', join(ROOT, 'src', 'VES_PM.html')]);
  const okFix = run('probe-b0-fixture', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b0-fixture.mjs'),
    join(ROOT, 'src', 'VES_PM.html'), join(FIXDIR, 'takeoff.v3.json'), join(FIXDIR, 'plan.pdf'), ROOT]);
  const demo = join(ROOT, 'release', 'demo', 'demo-flat-roof.json');
  const okPitch = existsSync(demo)
    ? run('probe-b1-pitch', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b1-pitch.mjs'), join(ROOT, 'src', 'VES_PM.html'), demo, ROOT, FIXDIR])
    : (sub.push({ label: 'probe-b1-pitch', error: 'no demo at ' + demo }), false);
  check('B2a-7 G0 4/4 · probe-b0-fixture 7/7 · probe-b1-pitch 12/12 — grouping moves no money', okG0 && okFix && okPitch, sub);
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b2a-sections: ${results.length - fails}/${results.length} passed, ${fails} failed`);
c.close(); chrome.kill('SIGKILL');
process.exit(fails ? 1 : 0);
