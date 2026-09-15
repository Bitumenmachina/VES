/* Batch B0f control probe — the synthetic three-sheet fixture loads and prices to its golden.
 * Zero deps; raw CDP; same CLI shape as probe-v.mjs.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b0-fixture.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet/takeoff.v3.json" \
 *     "$PWD/fixtures/synthetic/three-sheet/plan.pdf" "$PWD" [--write-golden]
 *
 * Seven rows, PASS/FAIL + value each; exit 0 all green, 1 on any FAIL, 2 if Chrome never came up.
 * `--write-golden` RECORDS instead of comparing: it writes golden.cents.json next to the takeoff
 * and exits 0. That is a deliberate, hand-run gesture — a probe that silently re-baselines is not
 * a gate. Without the flag the golden is read-only and a missing one is a FAIL, not a rewrite.
 *
 * F6 and F7 DOCUMENT rather than judge. F6 pins the bare-`6` pitch at the factor F18.72 computes
 * (6x, not 6/12) so the day that changes is a visible event; B1 flips it. F7 prints the quantity
 * each display surface shows for the one condition whose pitch lives in conditionOverrides, and
 * says which of them are flat. Neither row is a bug report and neither one fixes anything.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const WRITE = args.includes('--write-golden');
const [VES, TAKEOFF, PDF, ROOT] = args.filter((a) => !a.startsWith('--'));
if (!VES || !TAKEOFF || !PDF || !ROOT) {
  console.error('usage: probe-b0-fixture.mjs <VES_PM.html> <takeoff.v3.json> <plan.pdf> <repoRoot> [--write-golden]');
  process.exit(2);
}
const GOLDEN = join(dirname(TAKEOFF), 'golden.cents.json');

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
const port = 9400 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b0f-'))}`, '--remote-allow-origins=*',
  '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 600 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {}
  if (!wsUrl) await sleep(100);
}
if (!wsUrl) { console.error('HARNESS FAIL: devtools target never appeared (Chrome did not start within 60 s)'); try { chrome.kill('SIGKILL'); } catch (_) {} process.exit(2); }

const consoleErrors = [];
const c = await connect(wsUrl, (msg) => {
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails || {};
    consoleErrors.push('exception: ' + String(d.exception?.description || d.text || '').slice(0, 200));
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push('console.error: ' + msg.params.args.map((a) => String(a.value ?? a.description ?? a.type)).join(' ').slice(0, 200));
  } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push('log: ' + String(msg.params.entry.text || '').slice(0, 200));
  }
});
await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
const ev = async (expr) => {
  const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
};

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
};

/* ---------- boot + load ---------- */
const htmlBytes = readFileSync(VES);
const htmlSha = createHash('sha256').update(htmlBytes).digest('hex');
const takeoffText = readFileSync(TAKEOFF, 'utf8');
const pdfB64 = readFileSync(PDF).toString('base64');

await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file://' + VES });
let booted = false;
for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { booted = true; break; } } catch (_) {} await sleep(50); }
await sleep(400);
const build = booted ? await ev('VESApp.VES_BUILD') : null;
check('F1 the app opens on this build with no console errors', booted && consoleErrors.length === 0,
  { booted, build, errors: consoleErrors.slice(0, 4) });

// Open the plan, then the takeoff — the estimator's own order, and the order the identity gate expects.
const loaded = await ev(`(async () => {
  const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  const openId = JSON.parse(JSON.stringify(VESApp.state.identity));
  window.__take = ${takeoffText};
  loadFromData.confirmed = true;
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  const idModal = document.getElementById('idModal');
  return {
    numPages: VESApp.state.numPages,
    conditions: VESApp.state.conditions.length,
    measurements: VESApp.state.measurements.length,
    version: VESApp.core.TAKEOFF_VERSION,
    fileVersion: window.__take.version,
    normOk: VESApp.core.normalizeSnapshot(window.__take).ok,
    dropped: VESApp.core.normalizeSnapshot(window.__take).dropped,
    idCompare: VESApp.core.compareIdentity(window.__take.identity, openId),
    idModalOpen: !!(idModal && idModal.classList.contains('open')),
    ids: VESApp.state.conditions.map(c => c.id),
    pages: (() => { const p = {}; for (const m of VESApp.state.measurements) p[m.page] = (p[m.page] || 0) + 1; return p; })(),
    condPages: VESApp.core.rollup(VESApp.state.conditions, VESApp.state.measurements).map(r => r.pages.length),
  };
})()`);
/* R-10f (Batch B4) — the change this fixture's own README forecast. This file was written by a build
   that could not read its PDF's byte length (pdf.js detaches the ArrayBuffer before buildIdentity gets
   to it), so its identity.fileSize is 0. 2.0.0-rc.6 reads the size before the hand-off, so the open
   plan now reports 6,366 — and a saved 0 means UNKNOWN, never a mismatch, or every takeoff every earlier
   build saved would raise the identity review on load. The raw core compare still names the difference;
   the LOAD DOOR is what this row is about, and that ONE difference is the only one tolerated here.
   Any other diff, a modal, a drop, or a missing condition still fails the row. */
const idDiffs = loaded.idCompare.diffs || [];
const idOK = loaded.idCompare.level === 'match'
  || (idDiffs.length === 1 && /^File size differs: 0 bytes saved vs \d+ bytes open\.$/.test(idDiffs[0]));
check('F2 the fixture loads through the load door (a file no newer than the build understands): nothing dropped, 26 conditions in state, and the identity matches the open plan — a saved fileSize of 0 is UNKNOWN, not a mismatch (R-10f)',
  loaded.normOk && loaded.fileVersion <= loaded.version && loaded.dropped === 0
  && !loaded.idModalOpen && idOK && loaded.conditions === 26,
  { conditions: loaded.conditions, measurements: loaded.measurements, version: loaded.version,
    dropped: loaded.dropped, identity: loaded.idCompare.level, idModalOpen: loaded.idModalOpen,
    idDiffs: loaded.idCompare.diffs });

const sheets = Object.keys(loaded.pages).map(Number).sort((a, b) => a - b);
check('F3 three sheets are registered and every one of them carries measurements (two conditions span two sheets)',
  loaded.numPages === 3 && sheets.length === 3 && sheets.join(',') === '1,2,3'
  && sheets.every((p) => loaded.pages[p] > 0) && loaded.condPages.filter((n) => n > 1).length === 2,
  { numPages: loaded.numPages, perSheet: loaded.pages, spanningConditions: loaded.condPages.filter((n) => n > 1).length });

/* ---------- the money and the quantities, as the app has them now ---------- */
const observed = await ev(`(async () => {
  const S = VESApp.state;
  const m = VESApp.recapModel();
  const roll = VESApp.core.rollup(S.conditions, S.measurements);
  const byId = Object.fromEntries(roll.map(r => [r.id, r]));
  const cents = (x) => (x == null ? null : Math.round(x * 100));
  const milli = (x) => (x == null ? null : Math.round(x * 1000));
  // dispQtyOf is module-private; the rail card is its public face. Re-derive it from the two
  // stores the same way D-26.1 does, and cross-check against the card text further down.
  const co = (S.assemblyProject && S.assemblyProject.conditionOverrides) || {};
  const ovOf = (c) => { if (!c.libRef) return 1; const p = co[c.libRef] && co[c.libRef].pitch; return (typeof p === 'number' && isFinite(p) && p > 0) ? p : 1; };
  const conditions = S.conditions.map(c => {
    const r = byId[c.id]; const ov = ovOf(c);
    const disp = (ov !== 1 && r.pitch === 1) ? r.quantity * ov : r.quantity;
    return { id: c.id, name: c.name, libRef: c.libRef || null, type: c.type, location: c.location || '',
      color: c.color, unit: r.unit, count: r.count, pages: r.pages,
      storedPitch: c.pitch === undefined ? null : c.pitch, overridePitch: ov === 1 ? null : ov,
      rollupPitch: r.pitch, dispPitch: r.pitch !== 1 ? r.pitch : ov,
      rollupQtyMilli: milli(r.quantity), dispQtyMilli: milli(disp),
      extendedCents: cents(r.extended), included: r.included };
  });
  return {
    build: VESApp.VES_BUILD,
    library: VESApp.snapshot().library,
    recap: { lineCount: m.lineCount, off: m.off,
      materialCents: cents(m.material), laborCents: cents(m.labor), equipmentCents: cents(m.equipment),
      costCents: cents(m.cost), ohAmtCents: cents(m.ohAmt), mkAmtCents: cents(m.mkAmt),
      pfAmtCents: cents(m.pfAmt), sellCents: cents(m.sell) },
    conditions,
  };
})()`);

/* ---------- the two documented rows ---------- */
const bare6 = await ev(`(() => {
  const S = VESApp.state;
  const c = S.conditions.find(x => x.pitch === 6);
  if (!c) return null;
  const r = VESApp.core.rollup([c], S.measurements.filter(m => m.conditionId === c.id))[0];
  const raw = S.measurements.filter(m => m.conditionId === c.id).reduce((a, m) => a + m.value, 0);
  return { id: c.id, name: c.name, storedPitch: c.pitch, appliedFactor: r.pitch,
    rawQtyMilli: Math.round(raw * 1000), pricedQtyMilli: Math.round(r.quantity * 1000),
    readsAs: r.pitch === 6 ? '6x multiplier (a bare 6 is NOT 6/12 in this build)' : String(r.pitch) };
})()`);

const storeB = await ev(`(async () => {
  const S = VESApp.state;
  const ref = Object.keys(S.assemblyProject.conditionOverrides).find(k => S.assemblyProject.conditionOverrides[k].pitch != null);
  const c = S.conditions.find(x => x.libRef === ref);
  const ms = S.measurements.filter(m => m.conditionId === c.id);
  const flat = ms.reduce((a, m) => a + m.value, 0);
  const ov = S.assemblyProject.conditionOverrides[ref].pitch;
  const pitched = flat * ov;
  VESApp.renderCards(); await new Promise(r => setTimeout(r, 200));
  const card = document.querySelector('.card[data-cid="' + c.id + '"] .qty');
  const railText = card ? card.firstChild.textContent.trim() : null;
  let proposalQty = null;   // the client Scope list: {assemblies:[{conditions:[{name,qty,unit}]}]}
  try { const pm = await VESApp.proposalModel(); for (const a of (pm.assemblies || [])) for (const x of (a.conditions || [])) if (x.name === c.name) proposalQty = x.qty; } catch (e) { proposalQty = 'ERR ' + e.message; }
  // The Estimate sheet is an ENGINE face: its rows carry l.ordered, not the condition quantity.
  // (The printed bid's re-based clientQty lives in bidCollect(), which is module-private — it is
  // not reachable from VESApp, so this probe cannot read that surface and does not pretend to.)
  let gridQty = null;
  try { for (const r of VESApp.estimateRows()) if (r.srcCid === c.id && r.kind === 'material') { gridQty = r.qty; break; } } catch (e) { gridQty = 'ERR ' + e.message; }
  const res = VESApp.resolveAssembly();
  const driven = (res.lines || []).filter(l => (l.drivingRefs || []).indexOf(ref) >= 0 && l.kind === 'material');
  const near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.005;
  const asNum = (s) => { const n = Number(String(s).replace(/[^0-9.\\-]/g, '')); return isFinite(n) ? n : null; };
  return { condId: c.id, name: c.name, libRef: ref, overridePitch: ov,
    flatMilli: Math.round(flat * 1000), pitchedMilli: Math.round(pitched * 1000),
    surfaces: {
      rollupRowQty: Math.round(VESApp.core.rollup([c], ms)[0].quantity * 1000),
      railCard: railText,
      proposal: proposalQty, estimateGrid: gridQty,
      engineOrderedFirstLine: driven.length ? driven[0].ordered : null,
      engineOrderedOverFlat: driven.length && flat ? +(driven[0].ordered / flat).toFixed(4) : null,
    },
    flatSurfaces: [
      near(asNum(railText), flat) ? 'railCard' : null,
      near(asNum(proposalQty), flat) ? 'proposal' : null,
      near(asNum(gridQty), flat) ? 'estimateGrid' : null,
      'rollupRow(always flat — rollup cannot see store B)',
    ].filter(Boolean),
  };
})()`);

/* ---------- record or compare ---------- */
const record = {
  fixture: 'three-sheet',
  note: 'Money is integer cents; quantities are integer thousandths of the displayed unit. Recorded by tools/sweep/probe-b0-fixture.mjs --write-golden.',
  html: { sha256: htmlSha, bytes: htmlBytes.length, build: observed.build },
  library: observed.library,
  recap: observed.recap,
  conditions: observed.conditions,
  bare6, storeB,
};

if (WRITE) {
  writeFileSync(GOLDEN, JSON.stringify(record, null, 2) + '\n');
  console.log('\nWROTE ' + GOLDEN + '  (html sha256 ' + htmlSha + ')');
  check('F4 recap grand total matches the golden', true, { recorded: observed.recap });
  check('F5 per-condition displayed quantities match the golden', true, { recorded: observed.conditions.length });
  check('F6 the bare-6 condition prices at the factor the golden records', true, { recorded: bare6 });
  check('F7 the conditionOverrides-pitch condition shows the quantity the golden records on every surface', true, { recorded: storeB.surfaces });
} else if (!existsSync(GOLDEN)) {
  check('F4 recap grand total matches the golden', false, { error: 'no golden at ' + GOLDEN + ' — run once with --write-golden' });
  check('F5 per-condition displayed quantities match the golden', false, { error: 'no golden' });
  check('F6 the bare-6 condition prices at the factor the golden records', false, { error: 'no golden' });
  check('F7 the conditionOverrides-pitch condition shows the quantity the golden records on every surface', false, { error: 'no golden' });
} else {
  const g = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const sameHtml = g.html.sha256 === htmlSha;
  const rk = Object.keys(g.recap);
  const recapDiff = rk.filter((k) => g.recap[k] !== observed.recap[k]).map((k) => `${k}: golden ${g.recap[k]} vs now ${observed.recap[k]}`);
  check('F4 recap grand total matches the golden', recapDiff.length === 0,
    { sellCents: observed.recap.sellCents, costCents: observed.recap.costCents,
      goldenSellCents: g.recap.sellCents, goldenCostCents: g.recap.costCents,
      diffs: recapDiff, goldenHtmlSha: g.html.sha256.slice(0, 16), sameHtml });

  const gi = Object.fromEntries(g.conditions.map((x) => [x.id, x]));
  const qDiff = [];
  if (g.conditions.length !== observed.conditions.length) qDiff.push(`condition count: golden ${g.conditions.length} vs now ${observed.conditions.length}`);
  for (const o of observed.conditions) {
    const x = gi[o.id];
    if (!x) { qDiff.push(`condition id ${o.id} is not in the golden`); continue; }
    if (x.name !== o.name) qDiff.push(`#${o.id} name: "${x.name}" -> "${o.name}"`);
    if (x.dispQtyMilli !== o.dispQtyMilli) qDiff.push(`#${o.id} ${o.name}: displayed qty ${x.dispQtyMilli} -> ${o.dispQtyMilli} (milli-${o.unit})`);
    if (x.rollupQtyMilli !== o.rollupQtyMilli) qDiff.push(`#${o.id} ${o.name}: rollup qty ${x.rollupQtyMilli} -> ${o.rollupQtyMilli}`);
    if (x.extendedCents !== o.extendedCents) qDiff.push(`#${o.id} ${o.name}: extended ${x.extendedCents} -> ${o.extendedCents} cents`);
  }
  const missing = g.conditions.filter((x) => !observed.conditions.some((o) => o.id === x.id)).map((x) => x.id);
  if (missing.length) qDiff.push('golden condition ids missing from state: ' + missing.join(','));
  check('F5 per-condition displayed quantities match the golden', qDiff.length === 0,
    { conditions: observed.conditions.length, ids: observed.conditions.map((o) => o.id).join(','), diffs: qDiff.slice(0, 8) });

  check('F6 the bare-6 condition prices at the factor the golden records (since B1: reads 6/12, legacy ×6 held behind a confirm banner)',
    !!bare6 && !!g.bare6 && bare6.appliedFactor === g.bare6.appliedFactor && bare6.pricedQtyMilli === g.bare6.pricedQtyMilli,
    { name: bare6 && bare6.name, storedPitch: bare6 && bare6.storedPitch, appliedFactor: bare6 && bare6.appliedFactor,
      goldenFactor: g.bare6 && g.bare6.appliedFactor, readsAs: bare6 && bare6.readsAs });

  const sDiff = Object.keys(g.storeB.surfaces).filter((k) => JSON.stringify(g.storeB.surfaces[k]) !== JSON.stringify(storeB.surfaces[k]));
  check('F7 the conditionOverrides-pitch condition shows the golden quantity on every surface (reports which are flat; does not fix them)',
    sDiff.length === 0,
    { condition: storeB.name, overridePitch: storeB.overridePitch,
      flat: storeB.flatMilli / 1000, pitched: storeB.pitchedMilli / 1000,
      surfaces: storeB.surfaces, showingFlat: storeB.flatSurfaces, changedSinceGolden: sDiff });
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b0-fixture: ${results.length - fails}/${results.length} passed, ${fails} failed`);
c.close(); chrome.kill('SIGKILL');
process.exit(fails ? 1 : 0);
