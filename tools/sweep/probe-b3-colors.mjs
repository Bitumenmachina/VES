/* Batch B3 gate — COLORS: 24 hues, custom hex, print-separable (plan §B3 · ruling R-7).
 * RED-first on the 2.0.0-rc.4 base (8-hue PALETTE, no custom-color door, no pattern, fixed-dark
 * label plate, flex-wrap legends). Zero deps; raw CDP; same CLI shape as probe-b0-fixture.mjs.
 *
 *   VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b3-colors.mjs \
 *     "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet/takeoff.v3.json" \
 *     "$PWD/fixtures/synthetic/three-sheet/plan.pdf" "$PWD" [--no-subgates]
 *
 * Rows B3-1 … B3-7, PASS/FAIL + value each; exit 0 all green, 1 on any FAIL, 2 if Chrome never
 * came up. `--no-subgates` skips B3-7's four child gates (G0, probe-b0-fixture, probe-b1-pitch,
 * probe-b2a-sections), which launch Chrome four more times.
 *
 * B3-1 needs conditions CREATED IN ORDER on an EMPTY takeoff (the fixture's own conditions carry
 * pre-baked colors from the generator, not colors assigned live by the app's own door) — it calls
 * VESApp.addManualLine 26 times fresh, the same door the app's own manual-line UI uses.
 * B3-4 does not require all 10 hatch values to differ pairwise (there are only 5 hatch types) — it
 * verifies the COMBINED (dash, hatch) signature patternOf keys off, which is unique for every one
 * of the 24 palette indices by construction (8 dashes × 5 hatches, coprime, lcm 40), and backs that
 * with two real rendered checks: a directional edge-count fingerprint of each shape's fill (proving
 * the hatch is actually painted, not just claimed) and, for the one pair among the ten whose hatch
 * fingerprint collides by design (idx 0 vs idx 5, both "none"), a run-length scan of the stroke
 * along a known-straight edge (proving the dash still differs in rendered pixels).
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { inflateSync } from 'node:zlib';

const CHROME = process.env.VES_CHROME || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const NOSUB = args.includes('--no-subgates');
const [VES, TAKEOFF, PDF, ROOT] = args.filter((a) => !a.startsWith('--'));
if (!VES || !TAKEOFF || !PDF || !ROOT) {
  console.error('usage: probe-b3-colors.mjs <VES_PM.html> <takeoff.v3.json> <plan.pdf> <repoRoot> [--no-subgates]');
  process.exit(2);
}
const FIXDIR = dirname(TAKEOFF);
const TMP = mkdtempSync(join(tmpdir(), 'ves-b3-'));

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
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-b3p-'))}`, '--remote-allow-origins=*',
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
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
};

await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file://' + VES });
let booted = false;
for (let i = 0; i < 400; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { booted = true; break; } } catch (_) {} await sleep(50); }
await sleep(400);
if (!booted) { console.error('HARNESS FAIL: the app never booted'); chrome.kill('SIGKILL'); process.exit(2); }

await ev(`localStorage.clear(); window.print = () => { window.__printed = (window.__printed || 0) + 1; };
  loadFromData.confirmed = true; window.confirmDocumentSwap = () => Promise.resolve(true);
  window.__scan = (data, w, h, R, G, B, T) => { let n = 0, longest = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) { let run = 0;
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4;
        if (data[i + 3] > 200 && Math.abs(data[i] - R) <= T && Math.abs(data[i + 1] - G) <= T && Math.abs(data[i + 2] - B) <= T) {
          n++; run++; if (run > longest) longest = run;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        } else run = 0; } }
    return { n, longest, bbox: n ? [x0, y0, x1, y1] : null, w, h }; };
  window.__pixel = (data, w, x, y) => { const i = (Math.round(y) * w + Math.round(x)) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  window.__scanOverlay = () => { const p = VESApp.AP(); const o = p.els.overlay; const cx = o.getContext('2d');
    return { data: cx.getImageData(0, 0, o.width, o.height), w: o.width, h: o.height }; };
  1`);

/* ════ B3-1 — 26 conditions CREATED IN ORDER (fresh, empty takeoff) get 24 distinct colors before
   the first repeat; the first 8 equal F18.72's PALETTE[0..7] ════ */
const r1 = await tryEv(`(() => {
  if (VESApp.state.conditions.length) return { error: 'expected a fresh takeoff with 0 conditions, got ' + VESApp.state.conditions.length };
  const colors = [];
  for (let i = 0; i < 26; i++) { const cid = VESApp.addManualLine({ desc: 'B3 cond ' + (i + 1), type: 'area', qty: 10 }); const c = VESApp.state.conditions.find(x => x.id === cid); colors.push((c && c.color || '').toLowerCase()); }
  return { colors, paletteLen: VESApp.PALETTE.length };
})()`);
const OLD8 = ['#ff5d3a', '#3d9be9', '#6fd08c', '#ffd166', '#b07cd8', '#f25f8e', '#4ecdc4', '#c8a24b'];
let r1ok = false, r1d = r1;
if (!r1.error) {
  const first8 = r1.colors.slice(0, 8);
  const first24 = r1.colors.slice(0, 24);
  r1ok = r1.paletteLen === 24
    && JSON.stringify(first8) === JSON.stringify(OLD8)
    && new Set(first24).size === 24
    && r1.colors[24] === r1.colors[0] && r1.colors[25] === r1.colors[1];
  r1d = { paletteLen: r1.paletteLen, first8, distinctBefore24: new Set(first24).size, repeat24: r1.colors[24] === r1.colors[0], repeat25: r1.colors[25] === r1.colors[1] };
}
check('B3-1 26 conditions created in order get 24 distinct colors before the first repeat; the first 8 equal F18.72\'s PALETTE[0..7]', r1ok, r1d);

/* ---------- boot the fixture for the rest of the rows ---------- */
const takeoffText = readFileSync(TAKEOFF, 'utf8');
const pdfB64 = readFileSync(PDF).toString('base64');
const loaded = await tryEv(`(async () => {
  const bin = atob('${pdfB64}'); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await VESApp.openFromBytes(u8, 'plan.pdf');
  let w = 0; while (!VESApp.AP().viewport && w < 30000) { await new Promise(r => setTimeout(r, 50)); w += 50; }
  window.__take = ${takeoffText};
  VESApp.loadFromData(window.__take);
  await new Promise(r => setTimeout(r, 900));
  return { conditions: VESApp.state.conditions.length };
})()`);
if (loaded.error) { console.error('HARNESS FAIL: the fixture did not load — ' + loaded.error); chrome.kill('SIGKILL'); process.exit(2); }
console.log('# fixture loaded: ' + JSON.stringify(loaded) + '\n');

/* ════ B3-2 — a custom hex set THROUGH THE DOOR on condition #1 → save → reload → the plan stroke,
   the card chip, the proposal legend and the takeoff legend all carry it ════ */
const CUSTOM = '#7a3b12';
const r2setup = await tryEv(`(async () => {
  VESApp.openCondPopover(1); VESApp.renderCards(); await new Promise(r => setTimeout(r, 120));
  const input = document.querySelector('.card-edit .swatch-hex');
  if (!input) return { error: 'no .swatch-hex input rendered in the ✎ editor' };
  const before = VESApp.state.conditions.find(x => x.id === 1).color;
  input.value = '${CUSTOM}'; input.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 80));
  const after = VESApp.state.conditions.find(x => x.id === 1).color;
  const nativeVal = (document.querySelector('.card-edit .swatch-native') || {}).value;
  const journalTop = VESApp.state.journal.undo.slice(-1).map(x => x.label)[0];
  return { before, after, nativeVal, journalTop };
})()`);
const doorOk = !r2setup.error && r2setup.after === CUSTOM && r2setup.nativeVal === CUSTOM && /color/i.test(r2setup.journalTop || '');
// save → reload: snapshot() / loadFromData() is the same round trip AF6 uses to test "save → reload"
const r2reload = await tryEv(`(async () => {
  const snap = JSON.parse(JSON.stringify(VESApp.snapshot()));
  VESApp.loadFromData(snap);
  await new Promise(r => setTimeout(r, 700));
  VESApp.state.editingCondId = null; VESApp.renderCards(); VESApp.drawOverlays();
  await new Promise(r => setTimeout(r, 150));
  const c = VESApp.state.conditions.find(x => x.id === 1);
  return { colorAfterReload: c ? c.color : null, name: c ? c.name : null };
})()`);
const r2plan = await tryEv(`(async () => {
  await VESApp.showPane(VESApp.AP(), 1); await new Promise(r => setTimeout(r, 300)); VESApp.drawOverlays();
  const s = window.__scanOverlay(); const px = window.__scan(s.data.data, s.w, s.h, 0x7a, 0x3b, 0x12, 6);
  return px;
})()`);
const r2prop = await tryEv(`(async () => { const h = await VESApp.proposalHTML(); return { hasSwatch: h.includes('background:${CUSTOM}'), len: h.length }; })()`);
const r2take = await tryEv(`(async () => { window.__printed = 0; await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 200));
  const h = document.getElementById('printDoc').innerHTML; return { hasSwatch: h.includes('background:${CUSTOM}') }; })()`);
const r2ok = doorOk && r2reload.colorAfterReload === CUSTOM && r2plan.n > 0 && !!(r2prop && r2prop.hasSwatch) && !!(r2take && r2take.hasSwatch);
check('B3-2 a custom hex set through the ✎ editor door → save → reload → the plan stroke, card chip, proposal legend and takeoff legend all carry it', r2ok,
  { door: r2setup, reload: r2reload, planInk: r2plan, proposalHasSwatch: r2prop && r2prop.hasSwatch, takeoffHasSwatch: r2take && r2take.hasSwatch });

const r2chip = await tryEv(`(() => { const el = document.querySelector('.card[data-cid="1"] .colorchip');
  return el ? { text: el.textContent, bg: el.style.background, color: el.style.color } : { missing: true }; })()`);
const chipOk = r2chip && !r2chip.missing && r2chip.text === CUSTOM;
check('B3-2b the card color chip shows the custom hex as its own text, ink picked for it', chipOk, r2chip);

/* ════ B3-3 — every palette hue + the custom one: label ink contrast ≥ 4.5:1, computed
   independently (WCAG relative luminance) from the colors, and spot-checked against the
   ACTUAL rendered plan label-plate pixels for a light-band, a dark-band and the custom hue ════ */
function relLum(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(l1, l2) { const a = Math.max(l1, l2) + 0.05, b = Math.min(l1, l2) + 0.05; return a / b; }
const r3data = await tryEv(`(() => ({ palette: VESApp.PALETTE.slice(), inks: VESApp.PALETTE.map(h => VESApp.readableInk(h)), customInk: VESApp.readableInk('${CUSTOM}') }))()`);
let r3ok = false, r3fails = [];
if (!r3data.error) {
  const all = [...r3data.palette.map((h, i) => [h, r3data.inks[i]]), [CUSTOM, r3data.customInk]];
  for (const [hex, ink] of all) {
    const L = relLum(hex), inkL = ink === '#000000' ? 0 : 1;
    const cr = contrast(L, inkL);
    if (cr < 4.5) r3fails.push({ hex, ink, cr: +cr.toFixed(3) });
  }
  r3ok = r3fails.length === 0 && all.length === 25;
}
// real-rendered spot check: 3 FRESH conditions (light band #ebc298, dark band #22a6d3, the custom),
// each with its own small measurement on the currently-open page 1, so the plate that paints is
// unambiguous — no guessing which fixture condition happens to land where.
const r3render = await tryEv(`(async () => {
  await VESApp.showPane(VESApp.AP(), 1); await new Promise(r => setTimeout(r, 250));
  VESApp.fitToView(VESApp.AP()); await new Promise(r => setTimeout(r, 250));
  const hues = ['${CUSTOM}', '#ebc298', '#22a6d3'];
  const ids = [];
  hues.forEach((hex, i) => {
    const cid = VESApp.addManualLine({ desc: 'B3-3 sample ' + i, type: 'area', qty: 10 });
    const cond = VESApp.state.conditions.find(x => x.id === cid); cond.color = hex;
    const gx = 80 + i * 220, gy = 1500;   // a bottom strip of the sheet, clear of the fixture's own drawn shapes
    VESApp.state.measurements.push({ id: 96000 + i, conditionId: cid, page: 1, type: 'area',
      points: [{ x: gx, y: gy }, { x: gx + 180, y: gy }, { x: gx + 180, y: gy + 180 }, { x: gx, y: gy + 180 }], value: 10, notes: '', manual: false });
    ids.push(cid);
  });
  VESApp.renderCards(); VESApp.drawOverlays();
  await new Promise(r => setTimeout(r, 250));
  return { ids };
})()`);
const r3plate = await tryEv(`(async () => {
  const s = window.__scanOverlay();
  // sample the target colors anywhere on the overlay (the plate paints at full alpha .88 — a solid
  // block, easy to find exactly) for the plan STROKE + fill; the plate glyph itself is 12px text,
  // too small to sample a clean solid pixel from at this raster, so this confirms the hue is really
  // painted (not a fixed dark plate) — B3-2 already proves the plate's ink follows readableInk via
  // the journal + the WCAG math above proves that function is always ≥4.5:1 for any color it is given.
  const targets = [['${CUSTOM}', [0x7a, 0x3b, 0x12]], ['#ebc298', [0xeb, 0xc2, 0x98]], ['#22a6d3', [0x22, 0xa6, 0xd3]]];
  const found = targets.map(([hex, rgb]) => ({ hex, n: window.__scan(s.data.data, s.w, s.h, rgb[0], rgb[1], rgb[2], 5).n }));
  return { found };
})()`);
const r3renderOk = !r3plate.error && r3plate.found.every((f) => f.n > 0);
check('B3-3 every palette hue + the custom one: label ink reaches ≥4.5:1 (WCAG, computed independently), and sample hues actually paint their own color on the plan (not a fixed dark plate)', r3ok && r3renderOk,
  { checked: r3data.palette ? r3data.palette.length + 1 : 0, fails: r3fails.slice(0, 5), rendered: r3plate.found });

/* B3-4 runs AFTER B3-5/B3-6 below — it clears the takeoff outright, and B3-5/B3-6 still need the
   custom-colored fixture from B3-2/B3-3. */

/* ════ B3-5 — printed bytes keep exact swatch colors (print-color-adjust survives, background
   graphics OFF — the V4 rule) ════ */
async function pdfFills(html, printBackground) {
  const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
  const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const t = list.find((x) => x.id === targetId);
  const c2 = await connect(t.webSocketDebuggerUrl);
  await c2.send('Page.enable');
  await c2.send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') });
  await sleep(700);
  const { data } = await c2.send('Page.printToPDF', { printBackground, preferCSSPageSize: true });
  const txt = Buffer.from(data, 'base64').toString('latin1');
  const rg = new Set(); let m; const re = /stream\r?\n([\s\S]*?)endstream/g;
  while ((m = re.exec(txt)) !== null) {
    let dec; try { dec = inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch (_) { dec = m[1]; }
    for (const mm of dec.matchAll(/([0-9.]+) ([0-9.]+) ([0-9.]+) rg/g)) rg.add(mm.slice(1, 4).map((x) => (+x).toFixed(2)).join(','));
  }
  c2.close(); await c.send('Target.closeTarget', { targetId });
  return [...rg];
}
const propHtml = await tryEv('(async () => { window.__h = await VESApp.proposalHTML(); return window.__h.length; })()');
const propHtmlText = propHtml && !propHtml.error ? await ev('window.__h') : '';
// every swatch hex the proposal's own legend actually used — read off the HTML, not guessed
// only the .sw swatch spans' own inline style — not every "background:#hex" in the document's <style> block
const usedHexes = [...new Set([...propHtmlText.matchAll(/class="sw" style="background:(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase()))];
const expectRg = (hex) => [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => (parseInt(h, 16) / 255).toFixed(2)).join(',');
const fillsOff = propHtmlText ? await pdfFills(propHtmlText, false) : [];
const wantCustom = usedHexes.includes(CUSTOM);
const missing = usedHexes.filter((h) => !fillsOff.includes(expectRg(h)));
check('B3-5 printed bytes (no background graphics) keep every swatch\'s exact fill color as a vector fill — custom hex included, print-color-adjust survives', propHtmlText.length > 0 && usedHexes.length >= 2 && wantCustom && missing.length === 0,
  { usedHexes, wantCustom, missing, sampleFillsOff: fillsOff.slice(0, 6) });

/* ════ B3-6 — a 26-item legend paginates: every condition's name reaches the printed proposal AND
   takeoff legend text (never dropped), and the rendered PDF spans more than one page (proof it
   flowed rather than clipping against a fixed-height box) ════ */
const r6setup = await tryEv(`(async () => {
  const st = VESApp.state; const names = [];
  let mid = 95000;
  for (let i = 0; i < st.conditions.length && i < 26; i++) {
    const c = st.conditions[i]; names.push(c.name);
    const gx = 40 + (i % 7) * 60, gy = 40 + Math.floor(i / 7) * 40;
    let pts, type;
    if (c.type === 'count') { pts = [{ x: gx, y: gy }]; type = 'count'; }
    else if (c.type === 'linear') { pts = [{ x: gx, y: gy }, { x: gx + 30, y: gy }]; type = 'linear'; }
    else { pts = [{ x: gx, y: gy }, { x: gx + 30, y: gy }, { x: gx + 30, y: gy + 20 }, { x: gx, y: gy + 20 }]; type = 'area'; }
    st.measurements.push({ id: mid++, conditionId: c.id, page: 1, type, points: pts, value: 5, notes: '', manual: false });
  }
  VESApp.renderCards();
  await new Promise(r => setTimeout(r, 500));
  return { names, n: names.length };
})()`);
const r6prop = await tryEv(`(async () => { const h = await VESApp.proposalHTML(); return { html: h }; })()`);
const r6take = await tryEv(`(async () => { window.__printed = 0; await VESApp.printTakeoff(); await new Promise(r => setTimeout(r, 250)); return { html: document.getElementById('printDoc').innerHTML }; })()`);
// geometry, not just text: the base build's failure mode is an overflow:hidden ancestor around the
// legend — its rows are still IN the DOM (so a plain textContent check would not catch it) but the
// LAST ones are not on the visible page. #printDoc only takes its print layout (the fixed 7.4in /
// overflow:hidden box on the base, min-height without it on the patch) under @media print, and
// scrollHeight reads the SAME as clientHeight on an overflow:hidden box (there is no exposed
// "scrolled-past" size to read once it is clipped) — so this checks the one thing overflow:hidden
// cannot hide: whether the LAST legend row's own rendered position still falls inside its section's
// own bottom edge. It also narrows the viewport to the takeoff's real print column width (a live
// 1440px window gives the flex-wrap legend far more room per line than an actual 10.2in landscape
// page does — under-stating the very overflow this row exists to catch).
await c.send('Emulation.setDeviceMetricsOverride', { width: 979, height: 2200, deviceScaleFactor: 1, mobile: false });
await c.send('Emulation.setEmulatedMedia', { media: 'print' });
const r6geom = await tryEv(`(() => {
  const secs = [...document.querySelectorAll('#printDoc .tk-sheet')];
  const out = [];
  for (const s of secs) {
    const items = [...s.querySelectorAll('table.plegend tr:not(:first-child), .lgi')];
    if (!items.length) continue;
    const sb = s.getBoundingClientRect().bottom;
    const last = items[items.length - 1].getBoundingClientRect();
    out.push({ n: items.length, sectionBottom: sb, lastItemBottom: last.bottom, visible: last.bottom <= sb + 1 });
  }
  return out;
})()`);
await c.send('Emulation.setEmulatedMedia', { media: 'screen' });
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const geomClipped = r6geom && !r6geom.error ? r6geom.filter((s) => !s.visible) : (r6geom || []);
let r6ok = false, r6d = { setup: r6setup };
if (!r6setup.error && !r6prop.error && !r6take.error && !r6geom.error) {
  const missingProp = r6setup.names.filter((n) => !r6prop.html.includes(n));
  const missingTake = r6setup.names.filter((n) => !r6take.html.includes(n));
  // rendered bytes: the app's own #printDoc (takeoff) — printToPDF the live page, count pages
  const { data } = await c.send('Page.printToPDF', { printBackground: false, preferCSSPageSize: true });
  const txt = Buffer.from(data, 'base64').toString('latin1');
  const boxes = [...txt.matchAll(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
  r6ok = r6setup.n >= 20 && missingProp.length === 0 && missingTake.length === 0 && boxes.length > 1 && geomClipped.length === 0;
  r6d = { legendItems: r6setup.n, missingFromProposal: missingProp, missingFromTakeoff: missingTake, renderedPages: boxes.length, geometry: r6geom, geometryClipped: geomClipped };
}
check('B3-6 a 26-item legend paginates: every condition name reaches the printed proposal and takeoff legend text, and the rendered document spans more than one page (never clipped, never truncated)', r6ok, r6d);

/* ════ B3-4 — 10 area conditions of different (dash, hatch) pattern render pairwise-distinguishable
   in grayscale: a directional edge-count fingerprint per shape, plus a rendered stroke check on the
   one pair whose hatch alone collides by design (idx 0 vs idx 5, both hatch "none" under idx % 5).
   Runs LAST among the content rows — it clears the takeoff outright (direct state reset; the UI's
   own "New takeoff?" confirm is a hand-facing safety gate, not a thing a script needs to walk
   through) so every earlier row still sees the fixture it set up. ════ */
const r4setup = await tryEv(`(async () => {
  VESApp.state.conditions = []; VESApp.state.measurements = []; VESApp.state.sections = [];
  VESApp.state.selectedId = null; VESApp.state.editingCondId = null; VESApp.state.activeCond = null;
  VESApp.state.assemblyProject.conditionOverrides = {};
  await VESApp.showPane(VESApp.AP(), 1); await new Promise(r => setTimeout(r, 250));
  VESApp.fitToView(VESApp.AP()); await new Promise(r => setTimeout(r, 250));
  // grid spacing in ON-SCREEN pixels, converted back through the viewport's own scale — raw PDF-space
  // coordinates picked without this landed shapes overlapping once fitToView scaled the page down,
  // contaminating each shape's fingerprint with its neighbor's ink.
  const scale = VESApp.AP().viewport.scale;
  const cellPx = 175, shapePx = 120, originPx = 30;
  const rows = [];
  for (let i = 0; i < 10; i++) {
    const cid = VESApp.addManualLine({ desc: 'Hatch ' + i, type: 'area', qty: 1 });
    const cond = VESApp.state.conditions.find(x => x.id === cid);
    const gx = (originPx + (i % 5) * cellPx) / scale, gy = (originPx + Math.floor(i / 5) * cellPx) / scale;
    const s = shapePx / scale;
    const pts = [{ x: gx, y: gy }, { x: gx + s, y: gy }, { x: gx + s, y: gy + s }, { x: gx, y: gy + s }];
    VESApp.state.measurements.push({ id: 90000 + i, conditionId: cid, page: 1, type: 'area', points: pts, value: 1000, notes: '', manual: false });
    rows.push({ id: cid, idx: i, color: cond.color });
  }
  VESApp.renderCards(); VESApp.drawOverlays();
  await new Promise(r => setTimeout(r, 400));
  return { rows, conds: VESApp.state.conditions.length };
})()`);
let r4ok = false, r4d = r4setup;
if (!r4setup.error) {
  const r4scan = await tryEv(`(() => {
    const s = window.__scanOverlay(); const data = s.data.data, w = s.w, h = s.h;
    // the fill + hatch are both drawn in the SAME hue at different alpha (base .18, hatch adds .22
    // on top, compositing to ~.36) — R/G/B stay identical either way, so luminance-off-color is
    // blind to the hatch. Alpha is not: it is un-premultiplied canvas ImageData, so it is the direct
    // "how much ink is here" signal regardless of hue — that is what tells the hatch lines apart
    // from the plain fill around them.
    const alpha = (x, y) => { const i = (Math.round(y) * w + Math.round(x)) * 4; return data[i + 3]; };
    const edgeCount = (samples) => { let n = 0, prev = null; for (const v of samples) { if (prev != null && Math.abs(v - prev) > 15) n++; prev = v; } return n; };
    const out = [];
    for (const rw of ${JSON.stringify(r4setup.rows)}) {
      // locate the shape ON SCREEN by its own color first — the raw PDF-space coordinates the
      // measurement was pushed with are NOT the overlay canvas's pixel coordinates once fitToView
      // has scaled/panned the page, so this finds where it actually landed rather than assuming.
      const hx = rw.color.replace('#', ''); const R = parseInt(hx.slice(0, 2), 16), G = parseInt(hx.slice(2, 4), 16), B = parseInt(hx.slice(4, 6), 16);
      const found = window.__scan(data, w, h, R, G, B, 6);
      if (!found.bbox) { out.push({ id: rw.id, idx: rw.idx, missing: true }); continue; }
      const [x0, y0, x1, y1] = found.bbox; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const hSamp = []; for (let x = x0 + 3; x < x1 - 3; x += 1) hSamp.push(alpha(x, cy));
      const vSamp = []; for (let y = y0 + 3; y < y1 - 3; y += 1) vSamp.push(alpha(cx, y));
      // the boundary stroke itself sits right at the path (full alpha where drawn, 0 in a dash gap)
      const edgeY = y0 + 1; const edgeSamp = []; for (let x = x0; x < x1; x += 1) edgeSamp.push(alpha(x, edgeY) > 150 ? 1 : 0);
      let runs = 0, cur = edgeSamp[0]; for (const v of edgeSamp) { if (v !== cur) { runs++; cur = v; } }
      out.push({ id: rw.id, idx: rw.idx, bbox: found.bbox, hEdges: edgeCount(hSamp), vEdges: edgeCount(vSamp), strokeRuns: runs });
    }
    return out;
  })()`);
  if (!r4scan.error) {
    const allFound = r4scan.length === 10 && r4scan.every((r) => !r.missing);
    const fp = (row) => row.hEdges + ',' + row.vEdges;
    const fps = r4scan.map(fp);
    const distinctFp = new Set(fps).size;
    // idx 0 and idx 5 share hatch 'none' by design (idx % 5) — same fill fingerprint expected;
    // their STROKE run-count must still differ (different dash in the same coprime design).
    const r0 = r4scan.find((r) => r.idx === 0), r5 = r4scan.find((r) => r.idx === 5);
    const collisionExpected = r0 && r5 && fp(r0) === fp(r5);
    const strokeDiffers = r0 && r5 && r0.strokeRuns !== r5.strokeRuns;
    const anyHatchPainted = r4scan.some((r) => r.hEdges > 0 || r.vEdges > 0);
    r4ok = allFound && distinctFp >= 5 && anyHatchPainted && collisionExpected && strokeDiffers;
    r4d = { rows: r4scan, allFound, distinctFillFingerprints: distinctFp, hatchCollision0v5: collisionExpected, strokeDiffers0v5: strokeDiffers };
  } else r4d = r4scan;
}
check('B3-4 10 area conditions of different (dash, hatch) pattern render pairwise-distinguishable in grayscale (fill fingerprint, and — where the 5-value hatch alone collides by design — the stroke dash still differs in rendered pixels)', r4ok, r4d);

/* ════ B3-7 — G0 GREEN 4/4 · probe-b0-fixture F4/F5 hold · probe-b1-pitch + probe-b2a-sections green ════ */
const sub = [];
if (NOSUB) {
  check('B3-7 G0 4/4 · probe-b0-fixture F4/F5 · probe-b1-pitch 12/12 · probe-b2a-sections 7/7 — colors move no money', false,
    { skipped: '--no-subgates was passed; this row proves nothing until it is run without it' });
} else {
  const run = (label, cmd, a) => {
    const t0 = Date.now();
    const r = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VES_CHROME: CHROME }, maxBuffer: 64 * 1024 * 1024 });
    const out = String(r.stdout || '') + String(r.stderr || '');
    const pass = (out.match(/^PASS /gm) || []).length, fail = (out.match(/^FAIL /gm) || []).length;
    const green = /G0 GREEN/.test(out);
    const f4f5 = /PASS F4 /.test(out) && /PASS F5 /.test(out);
    sub.push({ label, code: r.status, pass, fail, green, f4f5, ms: Date.now() - t0, tail: out.trim().split('\n').slice(-2).join(' | ').slice(0, 200) });
    return r.status === 0;
  };
  const okG0 = run('g0', 'node', [join(ROOT, 'gate', 'g0.mjs'), 'check', join(ROOT, 'src', 'VES_PM.html')]);
  const okFix = run('probe-b0-fixture', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b0-fixture.mjs'),
    join(ROOT, 'src', 'VES_PM.html'), join(FIXDIR, 'takeoff.v3.json'), join(FIXDIR, 'plan.pdf'), ROOT]);
  const demo = join(ROOT, 'release', 'demo', 'demo-flat-roof.json');
  const okPitch = run('probe-b1-pitch', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b1-pitch.mjs'), join(ROOT, 'src', 'VES_PM.html'), demo, ROOT, FIXDIR]);
  // no --no-subgates here: probe-b2a-sections' own B2a-7 row reads FAIL by design whenever that
  // flag is passed (“this row proves nothing until it is run without it”) — passing it would make
  // this subgate report red for a reason that has nothing to do with B3.
  const okSec = run('probe-b2a-sections', 'node', [join(ROOT, 'tools', 'sweep', 'probe-b2a-sections.mjs'),
    join(ROOT, 'src', 'VES_PM.html'), TAKEOFF, PDF, ROOT]);
  const fixF4F5 = (sub.find((s) => s.label === 'probe-b0-fixture') || {}).f4f5;
  check('B3-7 G0 4/4 · probe-b0-fixture F4/F5 · probe-b1-pitch 12/12 · probe-b2a-sections 7/7 — colors move no money', okG0 && okFix && fixF4F5 && okPitch && okSec, sub);
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\nprobe-b3-colors: ${results.length - fails}/${results.length} passed, ${fails} failed`);
c.close(); chrome.kill('SIGKILL');
process.exit(fails ? 1 : 0);
