/* Batch B7 — the public release demo cold-loads clean.
 * Zero deps; raw CDP; same shape as probe-b0-fixture.mjs (the harness pattern this file follows —
 * no tools/sweep/probe-e2e-smoke.mjs exists in this tree to reuse instead).
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b7-demo.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-two-sheet.json" \
 *     "$PWD/release/demo/demo-two-sheet.pdf" "$PWD"
 *
 * Seven rows, PASS/FAIL each; exit 0 all green, 1 on any FAIL, 2 if Chrome never came up.
 * This is the release demo, not the three-sheet stress fixture (fixtures/synthetic/three-sheet):
 * nothing here is deliberately wrong — no bare-factor pitch, no legacy version, no dropped field.
 * The point is the opposite of that fixture's: a first-time open with the current format, and
 * zero console errors the whole way through.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [VES, TAKEOFF, PDF, ROOT] = process.argv.slice(2);
if (!VES || !TAKEOFF || !PDF || !ROOT) {
  console.error('usage: probe-b7-demo.mjs <VES_PM.html> <demo-two-sheet.json> <demo-two-sheet.pdf> <repoRoot>');
  process.exit(2);
}

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
const port = 9500 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b7d-'))}`, '--remote-allow-origins=*',
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
  results.push({ name, ok: !!ok });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
};

const takeoffText = readFileSync(TAKEOFF, 'utf8');
const pdfB64 = readFileSync(PDF).toString('base64');

await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file://' + VES });
let booted = false;
for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { booted = true; break; } } catch (_) {} await sleep(50); }
await sleep(400);
const build = booted ? await ev('VESApp.VES_BUILD') : null;
check('D1 the app opens with no console errors before anything is loaded', booted && consoleErrors.length === 0, { booted, build, errors: consoleErrors.slice(0, 4) });

const loaded = await ev(`(async () => {
  const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'demo-two-sheet.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  const openId = JSON.parse(JSON.stringify(VESApp.state.identity));
  window.__take = ${takeoffText};
  loadFromData.confirmed = true;
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  const idModal = document.getElementById('idModal');
  const banners = [...document.querySelectorAll('.banner .msg')].map(b => b.textContent);
  return {
    numPages: VESApp.state.numPages,
    conditions: VESApp.state.conditions.length,
    measurements: VESApp.state.measurements.length,
    deducts: VESApp.state.measurements.filter((m) => m.sign === -1).length,   // 2.1.0: the demo carries one cutout
    hidden: (() => { const h = VESApp.state.hiddenConds; return !h ? 0 : (h.size != null ? h.size : h.length); })(),   // 2.1.0: one hidden condition (a Set on this build)
    version: VESApp.core.TAKEOFF_VERSION,
    fileVersion: window.__take.version,
    // Q1-5: what THIS build would write for THIS state — the number that has to match the file
    wouldSaveAs: VESApp.snapshot().version,
    normOk: VESApp.core.normalizeSnapshot(window.__take).ok,
    dropped: VESApp.core.normalizeSnapshot(window.__take).dropped,
    idCompare: VESApp.core.compareIdentity(window.__take.identity, openId),
    idModalOpen: !!(idModal && idModal.classList.contains('open')),
    banners,
    pages: (() => { const p = {}; for (const m of VESApp.state.measurements) p[m.page] = (p[m.page] || 0) + 1; return p; })(),
  };
})()`);
check('D2 the demo loads through the load door on the current version: nothing dropped, no migration banner, identity matches the open plan (0-diff, not the fileSize-0 tolerance the older fixture needs)',
  /* DECLARED ROW CHANGE, Batch Q1 (ruling Q1-5), the shape B1 gave probe-af's AF6: the file's
     number is no longer the build's ceiling, it is the number this build would WRITE for this
     state — a takeoff with no deduct in it still says 5 while the build understands 6. Checked
     against `snapshot().version` rather than a constant, so a demo saved at the wrong number
     still fails this row. */
  loaded.normOk && loaded.fileVersion === loaded.wouldSaveAs && loaded.fileVersion <= loaded.version
  && loaded.dropped === 0 && loaded.banners.length === 0
  && !loaded.idModalOpen && loaded.idCompare.level === 'match' && loaded.conditions === 7 && loaded.measurements === 8   // 2.1.0 (declared): 7 + the demo's one deduct
  && loaded.deducts === 1 && loaded.hidden === 1,
  { conditions: loaded.conditions, measurements: loaded.measurements, deducts: loaded.deducts, hidden: loaded.hidden, version: loaded.version,
    fileVersion: loaded.fileVersion, wouldSaveAs: loaded.wouldSaveAs, dropped: loaded.dropped,
    identity: loaded.idCompare.level, idModalOpen: loaded.idModalOpen, banners: loaded.banners });

const sheets = Object.keys(loaded.pages).map(Number).sort((a, b) => a - b);
check('D3 two sheets are registered and both carry measurements',
  loaded.numPages === 2 && sheets.join(',') === '1,2' && sheets.every((p) => loaded.pages[p] > 0),
  { numPages: loaded.numPages, perSheet: loaded.pages });

const sections = await ev(`(() => {
  const m = VESApp.recapModel();
  const names = (m.sections || []).map(s => s.name).filter(Boolean);
  return { names, count: names.length };
})()`);
check('D4 two named sections group the takeoff (Main Roof, Garage), not "Unassigned"',
  sections.count === 2 && sections.names.includes('Main Roof') && sections.names.includes('Garage'),
  sections);

const pitch = await ev(`(() => {
  const S = VESApp.state;
  const c = S.conditions.find(x => x.name === 'SSMR — field area');
  const r = VESApp.core.rollup([c], S.measurements.filter(m => m.conditionId === c.id))[0];
  return { storedPitch: c.pitch, appliedFactor: r.pitch, rise: r.rise };
})()`);
const expectFactor = Math.sqrt(1 + (6 / 12) * (6 / 12)); // 1.118033989 — the current rise/12 convention, not a bare 6x factor
check('D5 pitch on the demo reads as a rise per 12 (the current convention) — 6 applies a ~1.118 slope factor, not a 6x factor',
  pitch.storedPitch === 6 && Math.abs(pitch.appliedFactor - expectFactor) < 1e-6,
  pitch);

const door = await ev(`(async () => {
  const b = document.getElementById('btnMenuTakeoff');
  if (!b) return { error: 'no btnMenuTakeoff' };
  b.click();
  await new Promise(r => setTimeout(r, 250));
  const modal = document.getElementById('tkSheetModal');
  const open = !!(modal && modal.classList.contains('open'));
  const boxes = open ? [...modal.querySelectorAll('input[type=checkbox]')].map(x => ({ page: +x.value, checked: x.checked })) : [];
  if (open) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 100));
  return { open, boxes };
})()`);
check('D6 Files & exports ▾ → Takeoff… opens a sheet chooser listing both sheets (the multi-sheet print door is reachable)',
  door.open && door.boxes.length === 2 && door.boxes.every((x) => x.checked),
  door);

check('D7 zero console errors through the whole run (boot, PDF open, takeoff load, sheet-chooser door)', consoleErrors.length === 0, { errors: consoleErrors.slice(0, 8) });

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b7-demo: ${results.length - fails}/${results.length} passed, ${fails} failed`);
c.close(); chrome.kill('SIGKILL');
process.exit(fails ? 1 : 0);
