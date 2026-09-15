/* Batch B1 gate — PITCH: one store, one function, one convention (plan §B1, rulings R-3 / R-3a / R-4).
 * RED-first on the 2.0.0-rc.1 base. Zero deps; raw CDP; same CLI shape as probe-p903-pitch.mjs.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b1-pitch.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD" \
 *     ["$PWD/fixtures/synthetic/three-sheet"]
 *
 * Rows B1-1 … B1-8, PASS/FAIL + value each; exit 0 all green, 1 on any FAIL, 2 if Chrome never came up.
 * The probe never re-derives the app's money: B1-6 reads the migration deltas out of the BANNER TEXT
 * and reconciles them against the fixture golden — the arithmetic is the app's, the check is the probe's.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [VES, DEMO, ROOT, FIXARG] = process.argv.slice(2);
if (!VES || !DEMO || !ROOT) { console.error('usage: probe-b1-pitch.mjs <VES_PM.html> <demo.json> <repoRoot> [fixtureDir]'); process.exit(2); }
const FIX = FIXARG || join(ROOT, 'fixtures', 'synthetic', 'three-sheet');
const SIX = Math.sqrt(36 + 144) / 12;            // 6/12 measured up the slope / over area = 1.1180340
const SIX_HV = Math.sqrt(1 + (36 / 144) / 2);    // 6/12 on a hip or valley               = 1.0606602
const near = (a, b, eps = 1e-4) => a != null && b != null && isFinite(a) && Math.abs(a - b) <= eps;

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

/* ---------- CDP ---------- */
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
const port = 9500 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b1-'))}`, '--remote-allow-origins=*',
  '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 600 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {}
  if (!wsUrl) await sleep(100);
}
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => {
  const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
};
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const safe = async (expr, fallback) => { try { return await ev(expr); } catch (e) { return { error: String(e.message || e).slice(0, 220), ...(fallback || {}) }; } };

/* ---------- boot: a plan, then the demo takeoff (the estimator's own order) ---------- */
const PDF = join(mkdtempSync(join(tmpdir(), 'ves-b1pdf-')), 'plan.pdf');
spawnSync(process.execPath, [join(ROOT, 'tools', 'sweep', 'mkpdf.mjs'), PDF], { stdio: 'ignore' });
const demo = readFileSync(DEMO, 'utf8');
const pdfB64 = existsSync(PDF) ? readFileSync(PDF).toString('base64') : null;

await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file://' + VES });
for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
await ev(`localStorage.clear();
  window.print = () => {};
  window.__demo = ${demo};
  loadFromData.confirmed = true;
  window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__blobs = [];
  window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, mime,
    text: (bytes instanceof Uint8Array) ? null : String(bytes),
    b64: (bytes instanceof Uint8Array) ? btoa(Array.from(bytes, (x) => String.fromCharCode(x)).join('')) : null }); };
  1`);
if (pdfB64) {
  await ev(`(async () => { const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    await VESApp.openFromBytes(u8, 'plan.pdf'); let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; } return 1; })()`);
}
await ev(`VESApp.loadFromData(window.__demo); 1`); await sleep(700);

/* the subject: a LIBRARY-backed AREA condition with measurements on it */
const subject = await ev(`(() => { const S = VESApp.state;
  const c = S.conditions.find(x => x.libRef === 'tpo.field') || S.conditions.find(x => x.libRef && x.type === 'area');
  if (!c) return null;
  const flat = S.measurements.filter(m => m.conditionId === c.id && m.value != null).reduce((a, m) => a + m.value, 0);
  return { id: c.id, name: c.name, libRef: c.libRef, type: c.type, flat }; })()`);
if (!subject) { console.error('HARNESS FAIL: the demo carries no library-backed area condition'); chrome.kill('SIGKILL'); process.exit(2); }
const SUBJ = subject.id, FLAT = subject.flat, PITCHED = FLAT * SIX;

/* ---------- the two doors ---------- */
const openDepth = `(async () => { const S = VESApp.state; S.editingCondId = null; S.expandedCondId = ${SUBJ}; VESApp.renderCards();
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));
  return !!document.querySelector('#depthPanel input.cond-pitch'); })()`;
const openEditor = `(async () => { const S = VESApp.state; S.expandedCondId = null; S.editingCondId = ${SUBJ}; VESApp.renderCards();
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));
  return !!document.querySelector('input[title*="rise over 12"]:not(.cond-pitch)'); })()`;
const typeInto = (sel, val) => `(async () => { const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return { error: 'no field' };
  el.value = ${JSON.stringify(val)}; el.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 120)));
  return { ok: true }; })()`;
const readState = `(async () => { const S = VESApp.state; const c = S.conditions.find(x => x.id === ${SUBJ});
  const r = VESApp.core.rollup([c], S.measurements.filter(m => m.conditionId === c.id))[0];
  const snap = JSON.parse(JSON.stringify(VESApp.snapshot()));
  const co = (snap.assemblyProject && snap.assemblyProject.conditionOverrides) || {};
  const live = (S.assemblyProject && S.assemblyProject.conditionOverrides) || {};
  const fld = document.querySelector('#depthPanel input.cond-pitch') || document.querySelector('input[title*="rise over 12"]:not(.cond-pitch)');
  const card = document.querySelector('.card[data-cid="' + c.id + '"]');
  return { stored: c.pitch, lenKind: c.lenKind || null, rollupPitch: r.pitch, rollupQty: r.quantity,
    field: fld ? fld.value : null, chip: card ? card.querySelector('.meta').textContent : '',
    snapOverridePitches: Object.keys(co).filter(k => co[k] && co[k].pitch != null),
    liveMirror: (live[c.libRef] || {}).pitch ?? null }; })()`;

await ev(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${SUBJ}); delete c.pitch;
  const co = VESApp.state.assemblyProject.conditionOverrides || {}; if (co[c.libRef]) delete co[c.libRef].pitch; VESApp.renderCards(); return 1; })()`);
const depthOpen = await safe(openDepth);
await safe(typeInto('#depthPanel input.cond-pitch', '6'));
const afterDepth = await safe(readState, {});

await ev(`(() => { const c = VESApp.state.conditions.find(x => x.id === ${SUBJ}); delete c.pitch; delete c.pitchLegacyFactor;
  const co = VESApp.state.assemblyProject.conditionOverrides || {}; if (co[c.libRef]) { try { delete co[c.libRef].pitch; } catch (_) {} } VESApp.renderCards(); return 1; })()`);
const editorOpen = await safe(openEditor);
await safe(typeInto('input[title*="rise over 12"]:not(.cond-pitch)', '6'));
const afterEditor = await safe(readState, {});

check('B1-1 a bare "6" in the ✎ card door AND in the depth-panel door on a LIBRARY condition both read 6/12 (×1.1180) and land on the same SF',
  depthOpen === true && editorOpen === true
  && near(afterDepth.rollupPitch, SIX, 1e-6) && near(afterEditor.rollupPitch, SIX, 1e-6)
  && afterDepth.field === '6/12' && afterEditor.field === '6/12'
  && near(afterDepth.rollupQty, afterEditor.rollupQty, 1e-6) && near(afterDepth.rollupQty, PITCHED, 1e-6),
  { depthDoorPresent: depthOpen, editorDoorPresent: editorOpen,
    depth: { stored: afterDepth.stored, factor: afterDepth.rollupPitch, qty: afterDepth.rollupQty, field: afterDepth.field },
    editor: { stored: afterEditor.stored, factor: afterEditor.rollupPitch, qty: afterEditor.rollupQty, field: afterEditor.field },
    flat: FLAT, pitchedExpected: PITCHED });

check('B1-2 after either door the snapshot carries NO conditionOverrides[*].pitch, c.pitch === 6, and rollup().quantity is the pitched figure',
  afterEditor.stored === 6 && (afterEditor.snapOverridePitches || ['?']).length === 0 && near(afterEditor.rollupQty, PITCHED, 1e-6),
  { storedPitch: afterEditor.stored, snapshotOverridePitchKeys: afterEditor.snapOverridePitches,
    liveMirrorFactor: afterEditor.liveMirror, rollupQty: afterEditor.rollupQty, expected: PITCHED });

/* ---------- B1-4 · the length a linear is measured along ---------- */
const kinds = await safe(`(async () => {
  const mk = (name, type) => { const f = document.getElementById('addCondForm'); document.getElementById('condName').value = name;
    document.getElementById('condType').value = type; f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    const c = VESApp.state.conditions[VESApp.state.conditions.length - 1];
    VESApp.state.measurements.push({ id: VESApp.state.nextId++, conditionId: c.id, page: 1, type, points: [], value: type === 'count' ? 1 : 100, notes: '', manual: true });
    c.pitch = 6; return c; };
  const out = {};
  for (const [label, name, type] of [['hipvalley', 'Hip/valley metal', 'linear'], ['level', 'Eave drip', 'linear'],
       ['count', 'Snow guard', 'count'], ['area', 'Shed roof field', 'area'], ['slope', 'Standing seam panel run', 'linear']]) {
    const c = mk(name, type);
    const r = VESApp.core.rollup([c], VESApp.state.measurements.filter(m => m.conditionId === c.id))[0];
    out[label] = { name, lenKind: c.lenKind || null, factor: +r.pitch.toFixed(4) };
  }
  return out; })()`);
check('B1-4 at 6/12 a hip/valley linear reads ×1.0607, an eave drip ×1.0000, a count ×1.0000, an area ×1.1180, a panel run ×1.1180',
  near(kinds.hipvalley && kinds.hipvalley.factor, +SIX_HV.toFixed(4), 5e-4)
  && near(kinds.level && kinds.level.factor, 1, 1e-9)
  && near(kinds.count && kinds.count.factor, 1, 1e-9)
  && near(kinds.area && kinds.area.factor, +SIX.toFixed(4), 5e-4)
  && near(kinds.slope && kinds.slope.factor, +SIX.toFixed(4), 5e-4),
  kinds);

/* ---------- B1-5 · both doors are on the journal ---------- */
const undoRow = await safe(`(async () => {
  const S = VESApp.state; const c = S.conditions.find(x => x.id === ${SUBJ});
  const qtyNow = () => VESApp.core.rollup([c], S.measurements.filter(m => m.conditionId === c.id))[0].quantity;
  const out = {};
  for (const door of ['depth', 'editor']) {
    c.pitch = 6; S.journal.undo.length = 0; S.journal.redo.length = 0;
    S.expandedCondId = door === 'depth' ? c.id : null; S.editingCondId = door === 'editor' ? c.id : null;
    VESApp.renderCards(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 90)));
    const before = qtyNow();
    const el = door === 'depth' ? document.querySelector('#depthPanel input.cond-pitch')
                                : document.querySelector('input[title*="rise over 12"]:not(.cond-pitch)');
    if (!el) { out[door] = { error: 'no field' }; continue; }
    el.value = '4'; el.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 120)));
    const mid = { pitch: c.pitch, qty: qtyNow(), label: (S.journal.undo[S.journal.undo.length - 1] || {}).label || null, depth: S.journal.undo.length };
    VESApp.undo(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 120)));
    out[door] = { ...mid, afterUndoPitch: c.pitch, afterUndoQty: qtyNow(), qtyBefore: before };
  }
  return out; })()`);
const okUndo = (o) => o && o.pitch === 4 && o.afterUndoPitch === 6 && near(o.afterUndoQty, o.qtyBefore, 1e-6)
  && typeof o.label === 'string' && /pitch/i.test(o.label) && /6\/12/.test(o.label) && /4\/12/.test(o.label);
check('B1-5 Ctrl+Z after either door restores the pitch AND the displayed quantity, and the journal\'s top entry names the change',
  okUndo(undoRow.depth) && okUndo(undoRow.editor), undoRow);

/* ---------- B1-7 · a library row\'s pitchDefault seeds a new condition ---------- */
const seedRow = await safe(`(async () => {
  const out = {};
  out.seedRowsWithPitch = Object.values(VESApp.state.library.conditions).filter(x => x.pitch != null || x.pitchDefault != null).length;
  out.seedRowCount = Object.keys(VESApp.state.library.conditions).length;
  const wipe = () => { VESApp.state.conditions.length = 0; VESApp.state.measurements.length = 0; VESApp.state.assemblyProject.conditionOverrides = {}; };
  wipe(); VESApp.loadAssembly('tpo');
  const a = VESApp.state.conditions.find(x => x.libRef === 'tpo.field');
  out.fromSeed = a ? (a.pitch === undefined ? 'flat' : a.pitch) : 'missing';
  out.seedErrors = 0;
  VESApp.state.library.conditions['tpo.field'].pitchDefault = 6;
  wipe(); VESApp.loadAssembly('tpo');
  const b = VESApp.state.conditions.find(x => x.libRef === 'tpo.field');
  out.fromPitchedRow = b ? b.pitch : 'missing';
  out.fromPitchedRowFactor = b ? VESApp.core.rollup([b], [])[0].pitch : null;
  delete VESApp.state.library.conditions['tpo.field'].pitchDefault;
  return out; })()`);
check('B1-7 no seed row carries a pitch and a fresh condition starts flat; give a library row pitchDefault 6 and a condition created from it starts at 6/12',
  seedRow.seedRowsWithPitch === 0 && seedRow.fromSeed === 'flat' && seedRow.fromPitchedRow === 6 && near(seedRow.fromPitchedRowFactor, SIX, 1e-6),
  seedRow);

/* ---------- B1-6 · the fixture through the v3 → v4 door ---------- */
const takeoffPath = join(FIX, 'takeoff.v3.json'), planPath = join(FIX, 'plan.pdf'), goldenPath = join(FIX, 'golden.f18.72.cents.json')   // the F18.72 record — B1's delta arithmetic reads the PRE-migration money;
let fixRow = { skipped: 'fixture not found at ' + FIX };
if (existsSync(takeoffPath) && existsSync(planPath) && existsSync(goldenPath)) {
  const golden = JSON.parse(readFileSync(goldenPath, 'utf8'));
  const takeoffText = readFileSync(takeoffPath, 'utf8');
  const planB64 = readFileSync(planPath).toString('base64');
  await c.send('Page.navigate', { url: 'file://' + VES });
  for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(50); }
  await ev(`localStorage.clear(); window.print = () => {}; loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
    window.__blobs = [];
    window.saveBlob = (name, bytes, mime) => { window.__blobs.push({ name, mime,
      text: (bytes instanceof Uint8Array) ? null : String(bytes),
      b64: (bytes instanceof Uint8Array) ? btoa(Array.from(bytes, (x) => String.fromCharCode(x)).join('')) : null }); };
    1`);
  fixRow = await safe(`(async () => {
    const bin = atob('${planB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    await VESApp.openFromBytes(u8, 'plan.pdf');
    let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
    window.__take = ${takeoffText};
    VESApp.loadFromData(window.__take);
    await new Promise(r => setTimeout(r, 1200));
    const S = VESApp.state;
    const banners = [...document.querySelectorAll('#banners .banner')].map(b => ({ id: b.dataset.bid, msg: b.querySelector('.msg').textContent,
      buttons: [...b.querySelectorAll('button')].map(x => x.textContent) }));
    const roll = VESApp.core.rollup(S.conditions, S.measurements);
    const byId = Object.fromEntries(roll.map(r => [r.id, r]));
    const m = VESApp.recapModel();
    const cents = (x) => (x == null ? null : Math.round(x * 100));
    const q = S.conditions.map(cd => ({ id: cd.id, name: cd.name, storedPitch: cd.pitch ?? null, legacy: cd.pitchLegacyFactor ?? null,
      lenKind: cd.lenKind || null, factor: byId[cd.id].pitch, qtyMilli: Math.round(byId[cd.id].quantity * 1000), extendedCents: cents(byId[cd.id].extended) }));
    return { version: VESApp.core.TAKEOFF_VERSION, fileVersion: window.__take.version, banners,
      recap: { costCents: cents(m.cost), sellCents: cents(m.sell) }, conditions: q,
      journalTop: (S.journal.undo[S.journal.undo.length - 1] || {}).label || null };
  })()`);

  // (a) the bare-6 condition holds its legacy factor and its cents
  const cricket = (fixRow.conditions || []).find((x) => x.name === 'Cricket framing') || {};
  const gCricket = (golden.conditions || []).find((x) => x.name === 'Cricket framing') || {};
  const cricketBanner = (fixRow.banners || []).find((b) => /×\s*6|x\s*6\.0|stored as/i.test(b.msg) && /Cricket/i.test(b.msg));
  check('B1-6a the bare-6 condition keeps its legacy ×6 with a per-condition confirm banner — its quantity and cents are the golden\'s',
    !!cricketBanner && near(cricket.factor, 6, 1e-9) && cricket.qtyMilli === gCricket.dispQtyMilli && cricket.extendedCents === gCricket.extendedCents,
    { banner: cricketBanner ? cricketBanner.msg : null, stored: cricket.storedPitch, legacy: cricket.legacy,
      factor: cricket.factor, qtyMilli: cricket.qtyMilli, goldenQtyMilli: gCricket.dispQtyMilli,
      cents: cricket.extendedCents, goldenCents: gCricket.extendedCents });

  // confirming the legacy factor re-prices it at 6/12 and journals it
  const confirmed = await safe(`(async () => {
    const b = [...document.querySelectorAll('#banners .banner')].find(x => /Cricket/i.test(x.querySelector('.msg').textContent));
    if (!b) return { error: 'no per-condition banner' };
    const btn = [...b.querySelectorAll('button')].find(x => !/^✕$/.test(x.textContent));
    if (!btn) return { error: 'no confirm button' };
    btn.click(); await new Promise(r => setTimeout(r, 400));
    const S = VESApp.state; const cd = S.conditions.find(x => x.name === 'Cricket framing');
    const r = VESApp.core.rollup([cd], S.measurements.filter(m => m.conditionId === cd.id))[0];
    return { stored: cd.pitch, legacy: cd.pitchLegacyFactor ?? null, factor: r.pitch,
      journalTop: (S.journal.undo[S.journal.undo.length - 1] || {}).label || null }; })()`);
  check('B1-6a2 confirming the legacy factor re-prices that condition at 6/12 (×1.1180) and puts the change on the journal',
    near(confirmed.factor, SIX, 1e-6) && confirmed.legacy == null && typeof confirmed.journalTop === 'string' && /pitch/i.test(confirmed.journalTop),
    confirmed);

  // (b) the store-B condition prices exactly as the golden
  const ssmr = (fixRow.conditions || []).find((x) => x.name === 'SSMR — field area') || {};
  const gSsmr = (golden.conditions || []).find((x) => x.name === 'SSMR — field area') || {};
  check('B1-6b the store-B override condition (SSMR — field area) prices exactly as the golden — it was already pitched in money',
    ssmr.qtyMilli === gSsmr.dispQtyMilli && near(ssmr.factor, gSsmr.dispPitch, 1e-6) && ssmr.legacy == null,
    { qtyMilli: ssmr.qtyMilli, goldenDispQtyMilli: gSsmr.dispQtyMilli, goldenRollupQtyMilli: gSsmr.rollupQtyMilli,
      factor: ssmr.factor, goldenDispPitch: gSsmr.dispPitch, storedPitch: ssmr.storedPitch });

  // (c) the store-A-on-libRef conditions are named in the load banner with their cent deltas
  const loadBanner = (fixRow.banners || []).find((b) => /priced flat|was priced flat|now priced at/i.test(b.msg));
  const bannerText = loadBanner ? loadBanner.msg : '';
  const named = ['SSMR — hip', 'Slate — field area', 'Slate — valley'].filter((n) => bannerText.indexOf(n) >= 0);
  const deltas = [...bannerText.matchAll(/([+-])\$([0-9][0-9,]*\.[0-9]{2})/g)].map((m) => (m[1] === '-' ? -1 : 1) * Math.round(+m[2].replace(/,/g, '') * 100));
  const sumDelta = deltas.reduce((a, b) => a + b, 0);
  check('B1-6c the three store-A-on-libRef conditions are named in ONE load banner with their cent deltas, and the recap grand == golden grand + Σ deltas',
    named.length === 3 && deltas.length >= 3 && fixRow.recap && (fixRow.recap.sellCents === golden.recap.sellCents + sumDelta),
    { bannerFound: !!loadBanner, banner: bannerText.slice(0, 400), namedConditions: named,
      deltasCents: deltas, sumDeltaCents: sumDelta, goldenSellCents: golden.recap && golden.recap.sellCents,
      sellCents: fixRow.recap && fixRow.recap.sellCents,
      expected: golden.recap ? golden.recap.sellCents + sumDelta : null });

  // (d) every other per-condition quantity is the golden's
  const gq = Object.fromEntries((golden.conditions || []).map((x) => [x.id, x]));
  const moved = (fixRow.conditions || []).filter((o) => gq[o.id] && gq[o.id].dispQtyMilli !== o.qtyMilli)
    .map((o) => `#${o.id} ${o.name}: ${gq[o.id].dispQtyMilli} → ${o.qtyMilli}`);
  check('B1-6d every other per-condition quantity is exactly the golden\'s (the migration moves quantities on no other condition)',
    moved.length === 0 && (fixRow.conditions || []).length === (golden.conditions || []).length,
    { conditions: (fixRow.conditions || []).length, moved, fileVersion: fixRow.fileVersion, buildVersion: fixRow.version });

  /* ---------- B1-3 · every surface shows the same number, on the fixture's own library condition ---------- */
  const gS = (golden.conditions || []).find((x) => x.name === 'SSMR — field area') || {};
  const FLATF = (gS.rollupQtyMilli || 0) / 1000, PITCHF = (gS.dispQtyMilli || 0) / 1000;
  const surf = await safe(`(async () => {
    const S = VESApp.state; const c = S.conditions.find(x => x.libRef === 'ssmr.field');
    const num = (s) => { const n = Number(String(s == null ? '' : s).replace(/[^0-9.\\-]/g, '')); return isFinite(n) ? n : null; };
    const out = {};
    VESApp.renderCards(); await new Promise(r => setTimeout(r, 250));
    const card = document.querySelector('.card[data-cid="' + c.id + '"] .qty');
    out.railChip = card ? num(card.firstChild.textContent) : null;
    try { let q = null; for (const r of VESApp.estimateRows()) if (r.srcCid === c.id && r.qtyNeeded != null) { q = +r.qtyNeeded; break; } out.gridAndRecapEstimateTab = q; } catch (e) { out.gridAndRecapEstimateTab = 'ERR ' + e.message; }
    try { const pm = await VESApp.proposalModel(); for (const a of (pm.assemblies || [])) for (const x of (a.conditions || [])) if (x.name === c.name) out.proposal = num(x.qty); } catch (e) { out.proposal = 'ERR ' + e.message; }
    const paperSays = (flat, pitched) => { const t = (document.getElementById('printDoc') || {}).textContent || '';
      const fmt = (v) => [v.toFixed(1), v.toFixed(2), (Math.round(v * 100) / 100).toLocaleString('en-US'),
        v.toFixed(1).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ','), v.toFixed(0), Math.round(v).toLocaleString('en-US')];
      const hasP = fmt(pitched).some(x => t.indexOf(x) >= 0), hasF = fmt(flat).some(x => t.indexOf(x) >= 0);
      return hasP ? pitched : hasF ? flat : null; };
    S.projectMeta = { ...(S.projectMeta || {}), preparedBy: { ...((S.projectMeta || {}).preparedBy || {}), company: 'B1 probe' } };
    try { await VESApp.printBidDoc(); await new Promise(r => setTimeout(r, 400)); out.bidPaper = paperSays(${FLATF}, ${PITCHF}); } catch (e) { out.bidPaper = 'ERR ' + e.message; }
    try { await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 900));
      const tr = [...document.querySelectorAll('#printDoc .tk-qty tr')].find(t => t.textContent.indexOf(c.name) >= 0);
      // R-6b (Batch B5): the takeoff quantities row is now Legend | Pitch | Description | SF | LF | EA —
      // a condition fills exactly ONE of the three trailing columns (td[3..5]) and the other two print
      // "—"; read whichever one is not the dash, instead of a column index pinned to the old
      // single "Quantity" column.
      out.takeoffPaper = tr ? (() => {
        const tds = [...tr.querySelectorAll('td')];
        for (const i of [3, 4, 5]) { const t = tds[i]; if (t && t.textContent.trim() !== '—' && t.textContent.trim() !== '') return num(t.textContent); }
        return null;
      })() : paperSays(${FLATF}, ${PITCHF});
    } catch (e) { out.takeoffPaper = 'ERR ' + e.message; }
    const split = (l) => { const o = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(cur); cur = ''; } else cur += ch; } o.push(cur); return o; };
    const grab = (re) => { const f = window.__blobs.filter(x => re.test(x.name)).pop(); return f || null; };
    window.__blobs = []; VESApp.exportRollupCSV(); await new Promise(r => setTimeout(r, 250));
    { const f = grab(/rollup\\.csv$/); if (f) { const ls = f.text.split(/\\r?\\n/).map(split); const h = ls[0];
        const row = ls.find(r => r[0] === c.name); out.rollupCSV = row ? num(row[h.indexOf('Quantity')]) : null;
        out.rollupCSVPitchWord = row ? row[h.indexOf('Pitch')] : null; } else out.rollupCSV = null; }
    /* the Audit is the per-MEASUREMENT record: it reconciles to the condition quantity only if it
       carries the pitch beside each stroke. Read Σ(raw strokes) × the factor the sheet itself states. */
    window.__blobs = []; VESApp.exportAuditCSV(); await new Promise(r => setTimeout(r, 250));
    { const f = grab(/audit\\.csv$/); if (f) { const ls = f.text.split(/\\r?\\n/).map(split);
        const hdr = ls.findIndex(r => r.indexOf('Quantity') >= 0 && r.indexOf('Condition') >= 0);
        const h = hdr >= 0 ? ls[hdr] : []; const qi = h.indexOf('Quantity'), ci = h.indexOf('Condition');
        const pi = h.indexOf('Pitch'), fi = h.indexOf('Pitch factor');
        const mine = ls.filter((r, i) => i > hdr && r[ci] === c.name);
        const raw = mine.reduce((a, r) => a + (num(r[qi]) || 0), 0);
        const word = pi >= 0 && mine.length ? mine[0][pi] : null;
        const fac = fi >= 0 && mine.length ? num(mine[0][fi]) : null;   // the exact factor the sheet publishes beside the fraction
        out.auditCSVPitchWord = word; out.auditCSV = (pi < 0 || fi < 0) ? null : raw * (fac || 1);
      } else out.auditCSV = null; }
    window.__blobs = []; VESApp.exportBOMCSV(); await new Promise(r => setTimeout(r, 250));
    { const f = grab(/bom\\.csv$/); if (f) { const ls = f.text.split(/\\r?\\n/).map(split);
        const row = ls.find(r => num(r[14]) != null && (Math.abs(num(r[14]) - ${PITCHF}) < 0.05 || Math.abs(num(r[14]) - ${FLATF}) < 0.05));
        out.bomCSV = row ? num(row[14]) : null; } else out.bomCSV = null; }
    window.__blobs = []; try { VESApp.exportEstimateXLSX(); } catch (e) {} await new Promise(r => setTimeout(r, 300));
    { const f = grab(/\\.xlsx$/); out.xlsxB64 = f ? f.b64 : null; }
    return out; })()`);
  let xlsxQty = null;
  if (surf && surf.xlsxB64) {
    try {
      const xml = unzip(Buffer.from(surf.xlsxB64, 'base64'), 'xl/worksheets/sheet1.xml') || '';
      const nums = [...xml.matchAll(/<v>([0-9]+\.?[0-9]*)<\/v>/g)].map((m) => +m[1]);
      xlsxQty = nums.find((n) => near(n, PITCHF, 0.05)) ?? nums.find((n) => near(n, FLATF, 0.05)) ?? null;
    } catch (e) { xlsxQty = 'ERR ' + e.message; }
  }
  const shown = { railChip: surf.railChip, gridAndRecapEstimateTab: surf.gridAndRecapEstimateTab, proposal: surf.proposal,
    bidPaper: surf.bidPaper, takeoffPaper: surf.takeoffPaper, rollupCSV: surf.rollupCSV, auditCSV: surf.auditCSV,
    bomCSV: surf.bomCSV, xlsx: xlsxQty };
  const agree = Object.entries(shown).filter(([, v]) => typeof v === 'number' && near(v, PITCHF, 0.05)).map(([k]) => k);
  const stillFlat = Object.entries(shown).filter(([, v]) => typeof v === 'number' && near(v, FLATF, 0.05)).map(([k]) => k);
  check('B1-3 a library condition at 6/12 shows ONE quantity on rail chip · grid/recap · proposal · bid · takeoff paper · rollup CSV · audit CSV · BOM · XLSX',
    agree.length === Object.keys(shown).length,
    { flatMeasured: FLATF, pitched: PITCHF, shown, pitched_surfaces: agree, STILL_FLAT: stillFlat,
      rollupCSVPitchWord: surf.rollupCSVPitchWord, auditCSVPitchWord: surf.auditCSVPitchWord, error: surf.error });

} else {
  check('B1-6a the bare-6 condition keeps its legacy ×6 with a per-condition confirm banner — its quantity and cents are the golden\'s', false, fixRow);
  check('B1-6a2 confirming the legacy factor re-prices that condition at 6/12 (×1.1180) and puts the change on the journal', false, fixRow);
  check('B1-6b the store-B override condition (SSMR — field area) prices exactly as the golden — it was already pitched in money', false, fixRow);
  check('B1-6c the three store-A-on-libRef conditions are named in ONE load banner with their cent deltas, and the recap grand == golden grand + Σ deltas', false, fixRow);
  check('B1-6d every other per-condition quantity is exactly the golden\'s (the migration moves quantities on no other condition)', false, fixRow);
  check('B1-3 a library condition at 6/12 shows ONE quantity on rail chip · grid/recap · proposal · bid · takeoff paper · rollup CSV · audit CSV · BOM · XLSX', false, fixRow);
}

c.close(); chrome.kill('SIGKILL');
await sleep(400);

/* ---------- B1-8 · the standing gates, run on this same file ---------- */
const SKIP = !!process.env.B1_SKIP_GATES;   // dev-loop only; CI and the batch gate never set it
const g0 = SKIP ? { status: 0, stdout: 'skipped' } : spawnSync(process.execPath, [join(ROOT, 'gate', 'g0.mjs'), 'check', VES], { encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME } });
const ah = SKIP ? { status: 0, stdout: 'skipped' } : spawnSync(process.execPath, [join(ROOT, 'tools', 'sweep', 'probe-p903-pitch.mjs'), VES, DEMO, ROOT], { encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME } });
check('B1-8 G0 is GREEN 4/4 on the patched file and probe-p903-pitch is still 6/6',
  g0.status === 0 && ah.status === 0,
  { g0: (g0.stdout || '').trim().split('\n').slice(-1)[0], g0exit: g0.status,
    p903pitch: (ah.stdout || '').trim().split('\n').slice(-1)[0], p903exit: ah.status });

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b1-pitch: ${results.length - fails}/${results.length} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
