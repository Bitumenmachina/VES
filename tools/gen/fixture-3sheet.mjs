#!/usr/bin/env node
/* tools/gen/fixture-3sheet.mjs — the synthetic three-sheet fixture (Batch B0f).
 *
 * Writes fixtures/synthetic/three-sheet/{plan.pdf, takeoff.v3.json}. Zero dependencies, one
 * seeded PRNG, byte-identical on every run: the golden in golden.cents.json is only meaningful
 * because re-running this script cannot move the input. The PDF writer is mkpdf.mjs's structure
 * (vector paths, no embedded font, no client data) extended to three pages plus the base-14
 * Helvetica name every sheet needs for its title block.
 *
 *   node tools/gen/fixture-3sheet.mjs [outDir]            # default: <repo>/fixtures/synthetic/three-sheet
 *   node tools/gen/fixture-3sheet.mjs [outDir] --v6       # also writes takeoff.v6.json (Batch Q1)
 *
 * --v6 (Batch Q1) writes a SECOND takeoff beside the v3 one: the same job as the app itself would
 * have re-saved it after the v3 -> v4 pitch migration (factor -> rise, one store, the bare 6 kept
 * as a legacy factor), plus TWO deductions on the SSMR field area and ONE perimeter handoff onto
 * Eave drip. It is the only file in this repo that exercises `m.sign`, and it is what
 * golden.v6.cents.json is recorded from. The v3 file and the PDF are untouched by the flag — they
 * still reproduce byte for byte, which is the only reason golden.cents.json means anything.
 *
 * NOTHING HERE IS A JOB. Every name, dimension and price is invented to exercise a code path.
 *
 * WHAT THE FIXTURE IS FOR — one takeoff that carries, at once: three sheets with measurements on
 * each and two conditions whose measurements span two of them; 26 conditions (12 built on seed
 * library rows, 14 free-standing) against an 8-hue palette; areas, linears and counts; all four
 * pitch shapes F18.72 can store; a `location` axis with an unassigned value in it.
 *
 * THE FORMAT, AS F18.72 READS IT (src/VES_PM.html, read not guessed):
 *   · `version: 3` = TAKEOFF_VERSION (:2636). A higher number is refused at the door.
 *   · normalizeSnapshot (:2638) keeps a condition only if `type` ∈ {linear, area, count}; a
 *     `color` that is not #hex becomes #888888; a `pitch` that is not a finite number > 0 is
 *     DELETED and counted as a dropped field; a measurement whose `value` is not a finite
 *     number ≥ 0, or whose `points` is not an array, is dropped whole.
 *   · PITCH IS A FACTOR, NOT A RISE. It multiplies the measured quantity (VESCore.rollup,
 *     :2489 — counts immune). 4/12 = 1.0541, 6/12 = 1.1180, 9/12 = 1.25. A file that says
 *     `pitch: 6` therefore means SIX TIMES, not 6/12 — see BARE6 below.
 *   · Pitch lives in TWO stores (D-26.1, :7304). Store A is `condition.pitch` and VESCore.rollup
 *     applies it. Store B is `assemblyProject.conditionOverrides[libRef].pitch` and only the
 *     ENGINE (VESASM.resolveTakeoff) applies it — rollup cannot see it; `dispQtyOf` re-applies
 *     it for display. sanitizeMoneyStore's COND_SPEC (:10812) keeps pitch and waste, ≥ 0.
 *   · A measurement's sheet is its `page` (1-based). rollup only collects it into `pages`;
 *     the quantity comes from `value`, which is never recomputed from `points` on load.
 *   · `identity` is compared against the open PDF by compareIdentity (:2602) on four fields:
 *     pdfName, fileSize, numPages, docFingerprint, plus per-page signatures
 *     fnv1a(`${n}:${w}x${h}:${rotate}`). All five are computable here because this script wrote
 *     the PDF — see identityFor(). A mismatch does not fail the load, it raises the review
 *     modal; the fixture ships a MATCH so the probe never has to answer a modal.
 *
 * ONE THING THE FIXTURE CANNOT EXPRESS, stated rather than faked: a takeoff file carries no
 * library rows (normalizeSnapshot keeps only `library.name` + `library.fingerprint`, :2707), and
 * NO seed library condition carries a `pitch` column — verified against the running app's own
 * state.library: 45 conditions, 0 with pitch. So "a library row with a pitchDefault" cannot be
 * put in a takeoff fixture at all. The three conditions marked STOREA_ON_LIBREF below are the
 * honest substitute: library-backed conditions carrying store-A pitch, which is the state that
 * divergence actually produces on disk.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const OUT = resolve(process.argv[2] || join(REPO, 'fixtures', 'synthetic', 'three-sheet'));

/* ── the seeded PRNG (mkpdf.mjs's LCG, same constants) ─────────────────────────────────── */
let _seed = 20260914;
const rnd = () => (_seed = (_seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));   // inclusive integers

/* ── sheet geometry ────────────────────────────────────────────────────────────────────── */
const PAGE_W = 2592, PAGE_H = 1728;        // 36 × 24 in at 72 units/in
const SCALE_UNITS = 800, SCALE_FT = 100;   // the drawn scale bar
const FT_PER_UNIT = SCALE_FT / SCALE_UNITS;// 0.125 exactly — a power of two, so no rounding drift
const SHEETS = [
  { n: 1, no: 'A-1', title: 'Main Roof', outline: [[240, 300], [1560, 300], [1560, 1020], [980, 1020], [980, 1380], [240, 1380]] },
  { n: 2, no: 'A-2', title: 'Annex', outline: [[300, 360], [1420, 360], [1420, 1180], [300, 1180]] },
  { n: 3, no: 'A-3', title: 'Canopy', outline: [[380, 520], [1340, 520], [1340, 980], [380, 980]] },
];
// where each sheet's traced geometry is allowed to live (inside its outline, with a margin)
const BAND = { 1: [280, 340, 1500, 1320], 2: [340, 400, 1380, 1120], 3: [420, 560, 1300, 940] };

/* ── the palette the app assigns (src :4402) ───────────────────────────────────────────── */
const PALETTE = ['#ff5d3a', '#3d9be9', '#6fd08c', '#ffd166', '#b07cd8', '#f25f8e', '#4ecdc4', '#c8a24b'];

/* ── pitch factors, as F18.72 stores them ──────────────────────────────────────────────── */
const P4_12 = 1.0541, P6_12 = 1.1180, P9_12 = 1.25;

/* ── the 26 conditions ─────────────────────────────────────────────────────────────────────
 *  libRef  — a seed-library condition id (verified present in state.library.conditions)
 *  pitch   — store A: written onto the condition object
 *  ovPitch — store B: written into assemblyProject.conditionOverrides[libRef]
 *  cost    — a free-standing condition's unitCost (library-backed ones are priced by the engine)
 *  sheets  — which sheet(s) carry its measurements
 *  n       — measurements per sheet
 */
const CONDS = [
  { name: 'SSMR — field area',              type: 'area',   libRef: 'ssmr.field',     csi: '07 61 00', loc: 'Main Roof', ovPitch: P6_12, sheets: [1, 2], n: 1, note: 'STOREB — pitch lives in conditionOverrides only' },
  { name: 'SSMR — eave',                    type: 'linear', libRef: 'ssmr.eave',      csi: '07 71 00', loc: 'Main Roof', sheets: [1], n: 1 },
  { name: 'SSMR — ridge',                   type: 'linear', libRef: 'ssmr.ridge',     csi: '07 71 00', loc: 'Main Roof', sheets: [1], n: 1 },
  { name: 'SSMR — hip',                     type: 'linear', libRef: 'ssmr.hip',       csi: '07 71 00', loc: 'Main Roof', pitch: P4_12, sheets: [1], n: 2, note: 'STOREA_ON_LIBREF' },
  { name: 'SSMR — valley',                  type: 'linear', libRef: 'ssmr.valley',    csi: '07 71 00', loc: 'Main Roof', sheets: [1], n: 1 },
  { name: 'SSMR — pipe penetration',        type: 'count',  libRef: 'ssmr.pipe',      csi: '07 72 00', loc: 'Main Roof', sheets: [1], n: 1 },
  { name: 'TPO — membrane field',           type: 'area',   libRef: 'tpo.field',      csi: '07 54 23', loc: 'Annex',     sheets: [2], n: 1 },
  { name: 'TPO — parapet flashing',         type: 'linear', libRef: 'tpo.parapet',    csi: '07 62 00', loc: 'Annex',     sheets: [2], n: 1 },
  { name: 'TPO — drain',                    type: 'count',  libRef: 'tpo.drain',      csi: '07 72 00', loc: 'Annex',     sheets: [2], n: 1 },
  { name: 'Slate — field area',             type: 'area',   libRef: 'slate.field',    csi: '07 31 26', loc: 'Main Roof', pitch: P9_12, sheets: [1], n: 1, note: 'STOREA_ON_LIBREF' },
  { name: 'Slate — valley',                 type: 'linear', libRef: 'slate.valley',   csi: '07 71 00', loc: 'Main Roof', pitch: P6_12, sheets: [1], n: 1, note: 'STOREA_ON_LIBREF' },
  { name: 'Slate — chimney cap',            type: 'count',  libRef: 'slate.chimney',  csi: '07 62 00', loc: 'Main Roof', sheets: [1], n: 1 },
  { name: 'Field membrane',                 type: 'area',   csi: '07 52 00', loc: 'Annex',     cost: 5.40,   sheets: [2], n: 1 },
  { name: 'Hip/valley metal',               type: 'linear', csi: '07 71 00', loc: 'Main Roof', cost: 18.75,  pitch: P6_12, sheets: [1, 3], n: 1 },
  { name: 'Eave drip',                      type: 'linear', csi: '07 71 00', loc: 'Main Roof', cost: 6.20,   pitch: P6_12, sheets: [1], n: 1 },
  { name: 'Curb flashing',                  type: 'linear', csi: '07 62 00', loc: 'Canopy',    cost: 24.00,  sheets: [3], n: 1 },
  { name: 'Ridge vent',                     type: 'linear', csi: '07 72 00', loc: 'Main Roof', cost: 21.50,  pitch: P4_12, sheets: [1], n: 1 },
  { name: 'Skylight curb',                  type: 'count',  csi: '08 62 00', loc: 'Canopy',    cost: 385.00, sheets: [3], n: 1 },
  { name: 'Roof access ladder',             type: 'count',  csi: '05 51 00', loc: '',          cost: 940.00, sheets: [2], n: 1 },
  { name: 'Underlayment — high temp',       type: 'area',   csi: '07 25 00', loc: 'Main Roof', cost: 1.85,   pitch: P9_12, sheets: [1], n: 1 },
  { name: 'Sheathing repair — allowance',   type: 'area',   csi: '06 16 00', loc: '',          cost: 4.75,   sheets: [2], n: 1 },
  { name: 'Snow guard',                     type: 'count',  csi: '07 72 00', loc: '',          cost: 32.00,  sheets: [1], n: 1 },
  { name: 'Counterflashing — reglet',       type: 'linear', csi: '07 62 00', loc: 'Canopy',    cost: 14.25,  sheets: [3], n: 1 },
  { name: 'Cricket framing',                type: 'area',   csi: '06 11 00', loc: 'Canopy',    cost: 9.60,   pitch: 6, sheets: [3], n: 1, note: 'BARE6 — a literal 6, which this build reads as a 6x factor' },
  { name: 'Gutter — box',                   type: 'linear', csi: '07 71 23', loc: 'Annex',     cost: 27.40,  pitch: P4_12, sheets: [2], n: 1 },
  { name: 'Downspout boot',                 type: 'count',  csi: '07 71 23', loc: '',          cost: 46.00,  sheets: [2], n: 1 },
];

/* ── geometry: orthogonal integer paths, so every quantity is exact in binary floating point ─ */
function rectilinearArea(page) {
  const [x0, y0, x1, y1] = BAND[page];
  const w = pick(28, 46) * 10, h = pick(20, 34) * 10;
  const x = pick(x0, Math.max(x0, x1 - w)), y = pick(y0, Math.max(y0, y1 - h));
  if (rnd() < 0.5) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];          // rectangle
  const cw = pick(6, 12) * 10, ch = pick(6, 12) * 10;                                 // L-shape
  return [[x, y], [x + w, y], [x + w, y + h - ch], [x + w - cw, y + h - ch], [x + w - cw, y + h], [x, y + h]];
}
function orthoPolyline(page) {
  const [x0, y0, x1, y1] = BAND[page];
  const segs = pick(2, 4);
  let x = pick(x0, x0 + 200), y = pick(y0, y0 + 200);
  const pts = [[x, y]];
  for (let i = 0; i < segs; i++) {
    const len = pick(24, 60) * 10;
    if (i % 2 === 0) x = Math.min(x1, x + len); else y = Math.min(y1, y + len);
    pts.push([x, y]);
  }
  return pts;
}
function markers(page, k) {
  const [x0, y0, x1, y1] = BAND[page];
  const pts = [];
  for (let i = 0; i < k; i++) pts.push([pick(x0, x1), pick(y0, y1)]);
  return pts;
}
// src :2325/:2331/:2349 — the same three expressions the app uses, no rounding applied here.
const polylineLength = (p) => { let t = 0; for (let i = 1; i < p.length; i++) t += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return t; };
const polygonArea = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
function measureValue(type, pts) {
  if (type === 'count') return pts.length;
  if (type === 'linear') return polylineLength(pts) * FT_PER_UNIT;
  return polygonArea(pts) * FT_PER_UNIT * FT_PER_UNIT;
}

/* ── the takeoff ───────────────────────────────────────────────────────────────────────── */
function buildTakeoff(identity) {
  const WHEN = '2026-09-14T00:00:00.000Z';   // fixed: a fixture with a clock is not a fixture
  const conditions = [], measurements = [], conditionOverrides = {};
  let mid = 1000;
  CONDS.forEach((s, i) => {
    const id = i + 1;
    const c = {
      id, name: s.name, color: PALETTE[i % PALETTE.length], type: s.type,
      csi: s.csi, wbs: '', location: s.loc, unitCost: s.cost != null ? s.cost : null,
      notes: '', tags: s.libRef ? [s.libRef.split('.')[0]] : [], sortOrder: id,
      createdAt: WHEN, updatedAt: WHEN,
    };
    if (s.pitch !== undefined) c.pitch = s.pitch;
    if (s.libRef) { c.libRef = s.libRef; c.assembly = s.libRef.split('.')[0]; }
    conditions.push(c);
    if (s.ovPitch !== undefined) conditionOverrides[s.libRef] = { pitch: s.ovPitch };
    for (const page of s.sheets) {
      for (let k = 0; k < (s.n || 1); k++) {
        const pts = s.type === 'area' ? rectilinearArea(page)
          : s.type === 'linear' ? orthoPolyline(page)
          : markers(page, pick(3, 9));
        measurements.push({
          id: ++mid, conditionId: id, page, type: s.type,
          points: pts.map(([x, y]) => ({ x, y })),
          value: measureValue(s.type, pts), notes: '', manual: false,
        });
      }
    }
  });
  const cal = (page) => ({
    pdfDist: SCALE_UNITS, realFt: SCALE_FT, ftPerUnit: FT_PER_UNIT,
    points: [{ x: 300, y: 1560 }, { x: 300 + SCALE_UNITS, y: 1560 }],
    typed: `${SCALE_FT} ft over the printed scale bar`, page, when: WHEN, verifications: [],
  });
  return {
    app: 'VES', kind: 'takeoff', version: 3, savedAt: WHEN,
    library: { name: 'Roofing & Envelope — Coastal SE Georgia', fingerprint: '7e4e6a2a' },
    pdfName: 'plan.pdf',
    projectMeta: {
      name: 'Synthetic Three-Sheet Fixture', client: '', address: '', phone: '', email: '',
      notes: 'Invented takeoff. Three sheets, 26 conditions, all four pitch shapes. No job, no client, no quoted price.',
    },
    schedule: { rows: {} },
    view: { tool: 'select', armedId: null },
    viz: { hidden: [], fillMode: 'on' },
    sheetDone: {},
    identity,
    grid: null,
    mode: 'single',
    activePane: 0,
    panes: [{ pageNum: 1, zoom: 1, scroll: { l: 0, t: 0 } }, { pageNum: 0, zoom: 1, scroll: { l: 0, t: 0 } }],
    rotations: {},
    calibrations: { 1: cal(1), 2: cal(2), 3: cal(3) },
    conditions, measurements,
    assemblyProject: {
      lineOverrides: {}, conditionOverrides,
      settings: { overheadPct: 10, markupPct: 8, profitPct: 5 },
      general: [],
    },
    nextId: mid + 1,
  };
}

/* ── the PDF (mkpdf.mjs's writer, three pages + a base-14 font) ────────────────────────── */
const esc = (s) => String(s).replace(/([()\\])/g, '\\$1');
function sheetContent(sh) {
  let s = '';
  s += '0.5 w 0.75 G\n';                                                     // grid
  for (let x = 72; x < PAGE_W; x += 72) s += `${x} 0 m ${x} ${PAGE_H} l S\n`;
  for (let y = 72; y < PAGE_H; y += 72) s += `0 ${y} m ${PAGE_W} ${y} l S\n`;
  s += '4 w 0 G\n';                                                          // roof outline
  sh.outline.forEach(([x, y], i) => { s += `${x} ${y} ${i ? 'l' : 'm'}\n`; });
  s += 'h S\n';
  s += '2 w 0 G\n';                                                          // title block border
  s += `${PAGE_W - 700} 96 m ${PAGE_W - 96} 96 l ${PAGE_W - 96} 300 l ${PAGE_W - 700} 300 l h S\n`;
  s += '3 w 0 G\n';                                                          // scale bar + end ticks
  s += `300 1560 m ${300 + SCALE_UNITS} 1560 l S\n`;
  s += `300 1536 m 300 1584 l S\n${300 + SCALE_UNITS} 1536 m ${300 + SCALE_UNITS} 1584 l S\n`;
  for (let i = 1; i < 5; i++) { const x = 300 + (SCALE_UNITS / 5) * i; s += `${x} 1548 m ${x} 1572 l S\n`; }
  s += 'BT /F1 48 Tf 0 g ' + `${PAGE_W - 660} 200 Td (${esc(sh.no + '  ' + sh.title)}) Tj ET\n`;
  s += 'BT /F1 22 Tf 0 g ' + `${PAGE_W - 660} 140 Td (SYNTHETIC FIXTURE - NOT A PROJECT) Tj ET\n`;
  s += 'BT /F1 22 Tf 0 g ' + `300 1600 Td (SCALE BAR - ${SCALE_FT} FT) Tj ET\n`;
  return s;
}
function buildPdf() {
  const streams = SHEETS.map(sheetContent);
  const nP = SHEETS.length;
  const objs = [];
  const pageObj = (i) => 3 + i;                  // 3..3+nP-1
  const contObj = (i) => 3 + nP + i;             // then the content streams
  const fontObj = 3 + nP * 2;
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push(`<< /Type /Pages /Kids [${SHEETS.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] /Count ${nP} >>`);
  SHEETS.forEach((_, i) => objs.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contObj(i)} 0 R `
    + `/Resources << /Font << /F1 ${fontObj} 0 R >> >> >>`));
  streams.forEach((s) => objs.push(`<< /Length ${Buffer.byteLength(s)} >>\nstream\n${s}endstream`));
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  // A fixed /ID makes the document fingerprint a property of this script, not of the clock.
  // PURE HEX ONLY: pdf.js parses a PDF hex string by keeping hex digits and discarding everything
  // else, so a mnemonic with letters in it silently shortens the fingerprint.
  const ID = 'b0f53ee7c41d9a2680fe0ee0c0de0f11';   // 32 hex nibbles = 16 bytes
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')
    + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /ID [<${ID}> <${ID}>] >>\nstartxref\n${xref}\n%%EOF\n`;
  return { bytes: Buffer.from(out, 'latin1'), id: ID.toLowerCase() };
}

/* ── identity, computed the way buildIdentity (:5045) computes it ──────────────────────── */
function fnv1a(str) {          // src :2588 — 32-bit FNV-1a, 8 hex chars
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ('0000000' + h.toString(16)).slice(-8);
}
function identityFor(pdf) {
  return {
    /* fileSize is 0 ON PURPOSE, and it is not a typo — and it STAYS 0 after Batch B4 fixed the
       detach (R-10f). This file is the repo's only pre-2.0.0-rc.6 identity, and a saved 0 now means
       UNKNOWN: it is the artifact that proves every takeoff written by an earlier build still loads
       with no identity review (probe-b4-print B4-7). Re-running this generator must keep reproducing
       these bytes, so the number below does not move. Original note follows.
       buildIdentity reads `meta.size`, which
       openFromBytes sets to `data.byteLength` (:4945) AFTER pdf.js has already handed the same
       Uint8Array to its worker — the transfer DETACHES the buffer, so byteLength is 0 by the time
       it is read. Measured, not assumed: opening this very PDF in F18.72 produces
       {fileSize: 0, docFingerprint: 'b0f53ee7c41d9a2680fe0ee0c0de0f11', pageSignatures: [...]}.
       Every PDF-backed takeoff this build saves therefore carries fileSize 0. compareIdentity
       (:2602) calls a fileSize difference MAJOR, so writing the true 6,366 here would raise the
       identity-review modal on every load and the fixture would never reach the app. If a later
       build fixes the detach, this field becomes 0-vs-6366 and the probe's F2 says so in its
       detail; the one-line repair is to put the real length here (or set identity to null). */
    pdfName: 'plan.pdf', fileSize: 0, numPages: SHEETS.length,
    docFingerprint: pdf.id,
    pageSignatures: SHEETS.map((s) => fnv1a(`${s.n}:${PAGE_W.toFixed(2)}x${PAGE_H.toFixed(2)}:0`)),
  };
}

/* ── Batch Q1 · the v6 shape: migrated pitch + deductions ─────────────────────────────
   The pitch half replays `normalizeSnapshot`'s v3 -> v4 migration exactly as the app performs it
   (src :2900): a stored FACTOR becomes a rise per 12, store B is consumed into the one store, a
   factor no rise can reproduce (the bare 6) keeps `pitchLegacyFactor` and prices as saved. A v6
   file runs NO migration on load, so what is written here is what the app prices — which is the
   point of recording a golden against it.
   The deduct half is the Batch Q1 format: `sign: -1` on two cutouts inside the SSMR field area's
   own traced rectangle, and one sibling LINEAR measurement on Eave drip whose points are the
   closed ring of the first cutout — the perimeter handoff, as `finishDeduct` writes it. ────── */
function toV6(t) {
  const v = JSON.parse(JSON.stringify(t));
  const ovs = (v.assemblyProject && v.assemblyProject.conditionOverrides) || {};
  for (const c of v.conditions) {
    let f = (typeof c.pitch === 'number' && isFinite(c.pitch) && c.pitch > 0) ? c.pitch : 0;
    const ov = c.libRef ? ovs[c.libRef] : null;
    if (ov && typeof ov === 'object') {
      if (!f && typeof ov.pitch === 'number' && ov.pitch > 0) f = ov.pitch;
      delete ov.pitch;
      if (!Object.keys(ov).length) delete ovs[c.libRef];
    }
    if (c.type === 'linear' && f) c.lenKind = 'slope';
    if (!f || c.type === 'count') { delete c.pitch; delete c.pitchLegacyFactor; continue; }
    const rise = 12 * Math.sqrt(Math.max(f * f - 1, 0));
    const eighth = Math.round(rise * 8) / 8;
    const back = Math.sqrt(1 + (eighth / 12) * (eighth / 12));
    if (Math.abs(back - f) > 1e-4) { c.pitch = f; c.pitchLegacyFactor = f; }
    else { c.pitch = rise; delete c.pitchLegacyFactor; }
  }
  v.sections = [];

  const field = v.conditions.find((c) => c.name === 'SSMR — field area');
  const eave = v.conditions.find((c) => c.name === 'Eave drip');
  const host = v.measurements.find((m) => m.conditionId === field.id && m.page === 1);
  const xs = host.points.map((q) => q.x), ys = host.points.map((q) => q.y);
  const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  const y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  const W = x1 - x0, H = y1 - y0;
  // both cutouts sit well inside the traced rectangle, on integer-eighth fractions of it so the
  // arithmetic stays exact in binary floating point (the same rule the rest of this fixture keeps)
  const box = (fx, fy, fw, fh) => {
    const ax = x0 + W * fx, ay = y0 + H * fy, bx = ax + W * fw, by = ay + H * fh;
    return [[ax, ay], [bx, ay], [bx, by], [ax, by]];
  };
  const cut1 = box(0.125, 0.125, 0.25, 0.25);
  const cut2 = box(0.5, 0.5, 0.125, 0.25);
  const ring = cut1.concat([cut1[0]]);   // the cutout's PERIMETER: the closed ring
  let mid = v.nextId - 1;
  const meas = (cid, page, type, pts, extra) => Object.assign({
    id: ++mid, conditionId: cid, page, type,
    points: pts.map(([x, y]) => ({ x, y })), value: measureValue(type, pts), notes: '', manual: false,
  }, extra || {});
  v.measurements.push(meas(field.id, 1, 'area', cut1, { sign: -1 }));
  v.measurements.push(meas(eave.id, 1, 'linear', ring));
  v.measurements.push(meas(field.id, 1, 'area', cut2, { sign: -1 }));
  v.version = 6;
  v.nextId = mid + 1;
  return v;
}

/* ── write ─────────────────────────────────────────────────────────────────────────────── */
mkdirSync(OUT, { recursive: true });
const pdf = buildPdf();
writeFileSync(join(OUT, 'plan.pdf'), pdf.bytes);
const takeoff = buildTakeoff(identityFor(pdf));
writeFileSync(join(OUT, 'takeoff.v3.json'), JSON.stringify(takeoff, null, 2) + '\n');
const pages = {};
for (const m of takeoff.measurements) pages[m.page] = (pages[m.page] || 0) + 1;
console.log(`wrote ${join(OUT, 'plan.pdf')} ${pdf.bytes.length} bytes, ${SHEETS.length} sheets, fingerprint ${pdf.id}`);
console.log(`wrote ${join(OUT, 'takeoff.v3.json')} — ${takeoff.conditions.length} conditions, `
  + `${takeoff.measurements.length} measurements, per sheet ${JSON.stringify(pages)}`);
if (process.argv.includes('--v6')) {
  const v6 = toV6(takeoff);
  writeFileSync(join(OUT, 'takeoff.v6.json'), JSON.stringify(v6, null, 2) + '\n');
  const ded = v6.measurements.filter((m) => m.sign === -1);
  console.log(`wrote ${join(OUT, 'takeoff.v6.json')} — version 6, ${v6.measurements.length} measurements, `
    + `${ded.length} deduction(s) totalling ${ded.reduce((a, m) => a + m.value, 0).toFixed(2)} SF, 1 perimeter handoff`);
}
