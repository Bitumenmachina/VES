#!/usr/bin/env node
/* tools/gen/fixture-demo-2sheet.mjs — the public release demo (Batch B7).
 *
 * Writes release/demo/{demo-two-sheet.pdf, demo-two-sheet.json}. Zero dependencies, one seeded
 * PRNG, byte-identical on every run — same technique as tools/gen/fixture-3sheet.mjs (the PDF
 * writer below is that script's writer, trimmed to two sheets), kept as its own small variant
 * rather than an edit to that file: the three-sheet fixture is a stress asset a dozen probes pin
 * exact numbers against (26 conditions, specific pitch shapes, a deliberately-wrong bare-6 case);
 * this one is a plain first-open demo — small, current-format, nothing intentionally wrong in it.
 *
 * NOTHING HERE IS A JOB. Every name, dimension and price is invented to exercise a code path.
 *
 *   node tools/gen/fixture-demo-2sheet.mjs [outDir]   # default: <repo>/release/demo
 *
 * THE FORMAT, AS THE CURRENT BUILD READS IT (src/VES_PM.html, TAKEOFF_VERSION 5, read not guessed):
 *   · `version: 5` — the current format. No migration path runs; nothing to reconcile, no banner.
 *   · `c.pitch` is a RISE PER 12, the only store (Batch B1) — a bare 6 here means 6/12, not ×6.
 *   · Section = `c.location` (Batch B2a); this file uses TYPED sections only — `sections: []`
 *     (Batch B2b's drawn regions) is present and empty on purpose, to say so rather than omit it.
 *   · A measurement's sheet is its `page` (1-based); `identity` carries the real fileSize (the
 *     detach bug fixture-3sheet.mjs's identity works around was fixed in Batch B4 — this file is
 *     written fresh against the fixed build, so it carries the true byte length, not 0).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const OUT = resolve(process.argv[2] || join(REPO, 'release', 'demo'));

/* ── the seeded PRNG (mkpdf.mjs / fixture-3sheet.mjs's LCG, same constants — a different seed so
   this geometry is its own, not a coincidental re-derivation of the other fixture's) ────────── */
let _seed = 20260915;
const rnd = () => (_seed = (_seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/* ── sheet geometry (same page size and scale-bar convention as fixture-3sheet.mjs) ──────── */
const PAGE_W = 2592, PAGE_H = 1728;         // 36 x 24 in at 72 units/in
const SCALE_UNITS = 800, SCALE_FT = 100;
const FT_PER_UNIT = SCALE_FT / SCALE_UNITS; // 0.125 exactly
const SHEETS = [
  { n: 1, no: 'A-1', title: 'Main Roof', outline: [[240, 300], [1560, 300], [1560, 1020], [240, 1020]] },
  { n: 2, no: 'A-2', title: 'Garage', outline: [[300, 360], [1200, 360], [1200, 900], [300, 900]] },
];
const BAND = { 1: [280, 340, 1500, 960], 2: [340, 400, 1140, 840] };
const PALETTE = ['#ff5d3a', '#3d9be9', '#6fd08c', '#ffd166', '#b07cd8', '#f25f8e', '#4ecdc4', '#c8a24b'];

/* ── the seven conditions — two sections, two sheets, one pitched roof, one flat one ──────── */
const CONDS = [
  { name: 'SSMR — field area',        type: 'area',   libRef: 'ssmr.field',  csi: '07 61 00', loc: 'Main Roof', pitch: 6, page: 1 },
  { name: 'SSMR — ridge',             type: 'linear', libRef: 'ssmr.ridge',  csi: '07 71 00', loc: 'Main Roof', pitch: 6, page: 1 },
  { name: 'SSMR — eave',              type: 'linear', libRef: 'ssmr.eave',   csi: '07 71 00', loc: 'Main Roof', pitch: 6, page: 1 },
  { name: 'SSMR — pipe penetration',  type: 'count',  libRef: 'ssmr.pipe',   csi: '07 72 00', loc: 'Main Roof', page: 1 },
  { name: 'TPO — membrane field',     type: 'area',   libRef: 'tpo.field',   csi: '07 54 23', loc: 'Garage',    page: 2 },
  { name: 'TPO — parapet flashing',   type: 'linear', libRef: 'tpo.parapet', csi: '07 62 00', loc: 'Garage',    page: 2 },
  { name: 'TPO — drain',              type: 'count',  libRef: 'tpo.drain',   csi: '07 72 00', loc: 'Garage',    page: 2 },
];

/* ── geometry helpers (fixture-3sheet.mjs's, unchanged) ───────────────────────────────────── */
function rectilinearArea(page) {
  const [x0, y0, x1, y1] = BAND[page];
  const w = pick(28, 46) * 10, h = pick(20, 34) * 10;
  const x = pick(x0, Math.max(x0, x1 - w)), y = pick(y0, Math.max(y0, y1 - h));
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}
function orthoPolyline(page) {
  const [x0, y0, x1, y1] = BAND[page];
  const segs = pick(2, 3);
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
const polylineLength = (p) => { let t = 0; for (let i = 1; i < p.length; i++) t += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return t; };
const polygonArea = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
function measureValue(type, pts) {
  if (type === 'count') return pts.length;
  if (type === 'linear') return polylineLength(pts) * FT_PER_UNIT;
  return polygonArea(pts) * FT_PER_UNIT * FT_PER_UNIT;
}

/* ── the takeoff (v5: pitch is a rise, sections typed, `sections: []` present and empty) ──── */
function buildTakeoff(identity) {
  const WHEN = '2026-09-15T00:00:00.000Z';
  const conditions = [], measurements = [];
  let mid = 100;
  CONDS.forEach((s, i) => {
    const id = i + 1;
    const c = {
      id, name: s.name, color: PALETTE[i % PALETTE.length], type: s.type,
      csi: s.csi, wbs: '', location: s.loc, unitCost: null,
      notes: '', tags: [s.libRef.split('.')[0]], sortOrder: id,
      libRef: s.libRef, assembly: s.libRef.split('.')[0],
      createdAt: WHEN, updatedAt: WHEN,
    };
    if (s.pitch !== undefined) c.pitch = s.pitch;
    conditions.push(c);
    const pts = s.type === 'area' ? rectilinearArea(s.page)
      : s.type === 'linear' ? orthoPolyline(s.page)
      : markers(s.page, pick(2, 4));
    measurements.push({
      id: ++mid, conditionId: id, page: s.page, type: s.type,
      points: pts.map(([x, y]) => ({ x, y })),
      value: measureValue(s.type, pts), notes: '', manual: false,
    });
  });
  const cal = (page) => ({
    ftPerUnit: FT_PER_UNIT, fromGrid: false,
    points: [{ x: 300, y: 1560 }, { x: 300 + SCALE_UNITS, y: 1560 }],
    typed: `${SCALE_FT} ft over the printed scale bar`, page, when: WHEN, verifications: [],
  });
  return {
    app: 'VES', kind: 'takeoff', version: 5, savedAt: WHEN,
    pdfName: 'demo-two-sheet.pdf',
    projectMeta: {
      name: 'Demo — Two-Sheet Sample', client: '', address: '', phone: '', email: '',
      notes: 'Synthetic demo takeoff. Two sheets, two sections, a pitched roof and a flat one. No job, no client, no quoted price.',
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
    calibrations: { 1: cal(1), 2: cal(2) },
    sections: [],
    conditions, measurements,
    assemblyProject: {
      lineOverrides: {}, conditionOverrides: {},
      settings: { overheadPct: 10, markupPct: 8, profitPct: 5 },
      general: [],
    },
    nextId: mid + 1,
  };
}

/* ── the PDF (fixture-3sheet.mjs's writer, two pages) ─────────────────────────────────────── */
const esc = (s) => String(s).replace(/([()\\])/g, '\\$1');
function sheetContent(sh) {
  let s = '';
  s += '0.5 w 0.75 G\n';
  for (let x = 72; x < PAGE_W; x += 72) s += `${x} 0 m ${x} ${PAGE_H} l S\n`;
  for (let y = 72; y < PAGE_H; y += 72) s += `0 ${y} m ${PAGE_W} ${y} l S\n`;
  s += '4 w 0 G\n';
  sh.outline.forEach(([x, y], i) => { s += `${x} ${y} ${i ? 'l' : 'm'}\n`; });
  s += 'h S\n';
  s += '2 w 0 G\n';
  s += `${PAGE_W - 700} 96 m ${PAGE_W - 96} 96 l ${PAGE_W - 96} 300 l ${PAGE_W - 700} 300 l h S\n`;
  s += '3 w 0 G\n';
  s += `300 1560 m ${300 + SCALE_UNITS} 1560 l S\n`;
  s += `300 1536 m 300 1584 l S\n${300 + SCALE_UNITS} 1536 m ${300 + SCALE_UNITS} 1584 l S\n`;
  for (let i = 1; i < 5; i++) { const x = 300 + (SCALE_UNITS / 5) * i; s += `${x} 1548 m ${x} 1572 l S\n`; }
  s += 'BT /F1 48 Tf 0 g ' + `${PAGE_W - 660} 200 Td (${esc(sh.no + '  ' + sh.title)}) Tj ET\n`;
  s += 'BT /F1 22 Tf 0 g ' + `${PAGE_W - 660} 140 Td (SYNTHETIC DEMO - NOT A PROJECT) Tj ET\n`;
  s += 'BT /F1 22 Tf 0 g ' + `300 1600 Td (SCALE BAR - ${SCALE_FT} FT) Tj ET\n`;
  return s;
}
function buildPdf() {
  const streams = SHEETS.map(sheetContent);
  const nP = SHEETS.length;
  const objs = [];
  const pageObj = (i) => 3 + i;
  const contObj = (i) => 3 + nP + i;
  const fontObj = 3 + nP * 2;
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push(`<< /Type /Pages /Kids [${SHEETS.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] /Count ${nP} >>`);
  SHEETS.forEach((_, i) => objs.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contObj(i)} 0 R `
    + `/Resources << /Font << /F1 ${fontObj} 0 R >> >> >>`));
  streams.forEach((s) => objs.push(`<< /Length ${Buffer.byteLength(s)} >>\nstream\n${s}endstream`));
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const ID = 'd2f053ee7c41d9a2680fe0ee0c0de0f2';   // 32 hex nibbles = 16 bytes; distinct from fixture-3sheet.mjs's
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')
    + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /ID [<${ID}> <${ID}>] >>\nstartxref\n${xref}\n%%EOF\n`;
  return { bytes: Buffer.from(out, 'latin1'), id: ID.toLowerCase() };
}

/* ── identity, computed the way buildIdentity (src) computes it — real fileSize on purpose ──── */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ('0000000' + h.toString(16)).slice(-8);
}
function identityFor(pdf) {
  return {
    pdfName: 'demo-two-sheet.pdf', fileSize: pdf.bytes.length, numPages: SHEETS.length,
    docFingerprint: pdf.id,
    pageSignatures: SHEETS.map((s) => fnv1a(`${s.n}:${PAGE_W.toFixed(2)}x${PAGE_H.toFixed(2)}:0`)),
  };
}

/* ── write ─────────────────────────────────────────────────────────────────────────────── */
mkdirSync(OUT, { recursive: true });
const pdf = buildPdf();
writeFileSync(join(OUT, 'demo-two-sheet.pdf'), pdf.bytes);
const takeoff = buildTakeoff(identityFor(pdf));
writeFileSync(join(OUT, 'demo-two-sheet.json'), JSON.stringify(takeoff, null, 2) + '\n');
const pages = {};
for (const m of takeoff.measurements) pages[m.page] = (pages[m.page] || 0) + 1;
console.log(`wrote ${join(OUT, 'demo-two-sheet.pdf')} ${pdf.bytes.length} bytes, ${SHEETS.length} sheets, fingerprint ${pdf.id}`);
console.log(`wrote ${join(OUT, 'demo-two-sheet.json')} — ${takeoff.conditions.length} conditions, `
  + `${takeoff.measurements.length} measurements, per sheet ${JSON.stringify(pages)}, sections Main Roof + Garage`);
