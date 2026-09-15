#!/usr/bin/env node
// vocab-check.mjs — Batch B5 gate (charter R-6c). Zero-dep static scan of src/VES_PM.html.
//
// Scans the HTML's document/export template strings and UI strings for:
//   (1) the banned list — AI-speak and software words Patrick has struck, plus "page" for a PDF
//       sheet specifically ("sheet" is chrome's own word — kind-curie's pass already put it there)
//   (2) the required column words per document, read off VOCAB itself (src/VES_PM.html, beside
//       PALETTE) and matched against a sentinel comment `/* VOCAB:<doc> */` this batch placed
//       immediately before each document's header-building code — the check is "the words this
//       file declares for <doc> actually reach the template that builds <doc>'s columns", not a
//       second, independently-typed copy of the word list that could drift from VOCAB itself
//   (3) any surface that builds a display name straight from an id/item key instead of going
//       through itemLabel()/descOf() — the concatenate-code+name / truncate-with-its-own-rule
//       class of bug R-6a exists to close
//
// Usage:  node tools/vocab-check.mjs <path/to/VES_PM.html>
// Exit 0 clean. Exit 1 with the full list of findings, one per line. Exit 2 on a usage error.
//
// What this does NOT do: touch the DOM, launch Chrome, or re-derive anything the probes already
// check dynamically (probe-b5-words reads the RENDERED papers and blobs; this reads the SOURCE).
// The pdf.js worker blob (`<script data-ves-module="pdfjs">…</script>`) is excluded outright —
// it is vendored, not ours, and its minified body is not a "document/export template string" by
// any reading of R-6c.

import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('usage: vocab-check.mjs <VES_PM.html>'); process.exit(2); }
let src;
try { src = readFileSync(file, 'utf8'); } catch (e) { console.error('cannot read ' + file + ': ' + e.message); process.exit(2); }

const findings = [];

/* ---------- 0. carve out the vendored pdf.js blob before scanning anything ---------- */
function withoutPdfjs(text) {
  const start = text.indexOf('<script data-ves-module="pdfjs">');
  if (start < 0) return text;
  const end = text.indexOf('</script>', start);
  if (end < 0) return text;
  // blank the span (byte-length changes don't matter — only used for scanning, never written back)
  return text.slice(0, start) + text.slice(end + '</script>'.length);
}
const scanSrc = withoutPdfjs(src);

/* ---------- 1. the banned list, read from VOCAB.banned in the file itself ---------- */
// VOCAB is the one place the word list lives (R-6b) — read it out of the bytes rather than
// re-typing a second copy here that could silently drift from what the app actually declares.
function extractVocabBanned(text) {
  const m = /banned:\s*\[([\s\S]*?)\]/.exec(text);
  if (!m) return null;
  const words = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let mm;
  while ((mm = re.exec(m[1]))) words.push(mm[1].replace(/\\'/g, "'"));
  return words.length ? words : null;
}
const BANNED = extractVocabBanned(scanSrc) || [
  'leverage', 'seamless', 'robust', 'utilize', 'journey', 'delve', 'empower',
  'streamline', 'holistic', 'cutting-edge', 'the app', 'the software', 'AI',
];
if (!extractVocabBanned(scanSrc)) findings.push('VOCAB.banned not found in the file — checked the built-in fallback list instead of the file\'s own declaration');

/* Extract string-literal contents from JS (single/double/backtick, minimal escape handling),
   after stripping comments — R-6c scopes the banned-word scan to "document/export template
   strings and the UI strings", i.e. what a viewer actually reads, not code identifiers or the
   build-history prose in comments (which legitimately narrates old mistakes using these very
   words — "the fix removed 'seamless'" would otherwise flag itself forever). */
function stripComments(text) {
  let out = '';
  let i = 0;
  const n = text.length;
  let inStr = null; // ', ", ` — comments cannot start inside a string
  while (i < n) {
    const ch = text[i];
    if (inStr) {
      out += ch;
      if (ch === '\\') { out += text[i + 1] || ''; i += 2; continue; }
      if (ch === inStr) inStr = null;
      i++; continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i);
      i = nl < 0 ? n : nl; // drop the comment, keep the newline on the next pass
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2);
      i = close < 0 ? n : close + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; out += ch; i++; continue; }
    out += ch; i++;
  }
  return out;
}
function extractStringLiterals(text) {
  const strs = [];
  const re = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
  let m;
  while ((m = re.exec(text))) strs.push(m[0].slice(1, -1));
  return strs.join('\n');
}
// HTML comments (build-history banners in the markup, outside any <script>) are comments too —
// R-6c scopes the scan to what a viewer actually reads, and a quoted field note inside an HTML
// comment narrating a PAST mistake ("...a lot of the language is AI speak...") is exactly the kind
// of self-referential false positive that would make this check useless the day it is added.
const withoutHtmlComments = scanSrc.replace(/<!--[\s\S]*?-->/g, ' ');
const codeNoComments = stripComments(withoutHtmlComments);
// VOCAB.banned is DATA (the word list itself) — excise its own array literal before scanning for
// banned words, or the list would flag on its own contents every run.
const codeForBannedScan = codeNoComments.replace(/banned:\s*\[[\s\S]*?\]/, 'banned: []');
const uiText = extractStringLiterals(codeForBannedScan);

for (const w of BANNED) {
  if (w === 'AI') {
    const re = /\bAI\b/; // case-sensitive: the standalone word only, never a substring of "maintain"/"chair"/etc.
    if (re.test(uiText)) {
      const m = re.exec(uiText);
      findings.push(`banned word "AI" found in a document/UI string: …${uiText.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\n/g, ' ')}…`);
    }
    continue;
  }
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = /[a-z]/i.test(w[0]) && !w.includes(' ') && !w.includes('-')
    ? new RegExp('\\b' + escaped + '\\b', 'i')
    : new RegExp(escaped, 'i');
  const m = re.exec(uiText);
  if (m) findings.push(`banned word "${w}" found in a document/UI string: …${uiText.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\n/g, ' ')}…`);
}
// "page" for a PDF sheet specifically — the concrete way this mistake manifests ("PDF page(s)");
// plain pagination language ("Page 1 of 3", "printed page") is not this rule and is not scanned for.
{
  const re = /\bpdf\s+pages?\b/i;
  const m = re.exec(uiText);
  if (m) findings.push(`banned: "page" used for a PDF sheet ("${m[0]}") — "sheet" is the chrome word: …${uiText.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\n/g, ' ')}…`);
}

/* ---------- 2. required column words per document, via the VOCAB:<doc> sentinels ---------- */
function extractVocabList(text, key) {
  const re = new RegExp(key + ':\\s*\\[([\\s\\S]*?)\\]');
  const m = re.exec(text);
  if (!m) return null;
  const words = [];
  const wre = /'((?:[^'\\]|\\.)*)'/g;
  let mm;
  while ((mm = wre.exec(m[1]))) words.push(mm[1].replace(/\\'/g, "'"));
  return words;
}
// sentinel name -> VOCAB key it must carry. Recap + cost sheet share ONE word list (R-6b bundles
// them as "Recap + cost sheet (internal)") but print from two different templates, so both get
// their own sentinel, checked against the same VOCAB.recap words.
const SENTINELS = [['takeoff', 'takeoff'], ['grid', 'grid'], ['recap', 'recap'], ['costsheet', 'recap'], ['bid', 'bid']];
const vocabCache = {};
for (const [sentinelName, vocabKey] of SENTINELS) {
  const words = vocabCache[vocabKey] || (vocabCache[vocabKey] = extractVocabList(scanSrc, vocabKey));
  if (!words || !words.length) { findings.push(`VOCAB.${vocabKey} not found or empty in the file`); continue; }
  // the sentinel is the substring "VOCAB:<name>" inside a comment near the header-building code —
  // not required to be its own standalone `/* VOCAB:x */` comment, since several sites carry it
  // inside a longer explanatory comment instead.
  const sentinel = 'VOCAB:' + sentinelName;
  const at = scanSrc.indexOf(sentinel);
  if (at < 0) { findings.push(`no "${sentinel}" sentinel found — nothing anchors VOCAB.${vocabKey} to the template that builds ${sentinelName}`); continue; }
  const window_ = scanSrc.slice(at, at + 4000); // the header-building call sits within a few lines of its sentinel
  const missing = words.filter((w) => !window_.includes("'" + w + "'") && !window_.includes('"' + w + '"') && !window_.includes('>' + w + '<'));
  if (missing.length) findings.push(`VOCAB.${vocabKey} word(s) not found near the ${sentinelName} sentinel: ${missing.map((w) => JSON.stringify(w)).join(', ')}`);
}

/* ---------- 3. a surface building a name from an id, bypassing itemLabel()/descOf() ---------- */
// The concrete anti-pattern this file used to carry (and the F6/S2 rulings closed): a label built
// by string-gluing `.item` or a split-on-'.' id segment directly, outside itemLabel/descOf/
// displayComponent. Heuristic, not a parser — it looks for the known shape (a `label`/`name`/
// `desc`/`text` assignment or template slot built from `.item`/`.id` within ~60 chars) OUTSIDE the
// three functions that are allowed to do it.
{
  const allowedFns = ['itemLabel', 'descOf', 'displayComponent', 'lineDisplayName'];
  const lines = codeNoComments.split('\n');
  let curFn = null;
  const fnOpen = /^\s*(?:function\s+([A-Za-z_$][\w$]*)|const\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*{)/;
  const badPattern = /\b(label|name|desc|text)\s*[:=]\s*[^;,)]{0,10}\.(item|id)\b/;
  for (let i = 0; i < lines.length; i++) {
    const fm = fnOpen.exec(lines[i]);
    if (fm) curFn = fm[1] || fm[2];
    if (curFn && allowedFns.includes(curFn)) continue;
    const bm = badPattern.exec(lines[i]);
    if (bm) findings.push(`possible id-built label outside itemLabel/descOf near "${curFn || '(top level)'}": ${lines[i].trim().slice(0, 140)}`);
  }
}

const fails = findings.length;
if (fails) { for (const f of findings) console.log('FAIL ' + f); }
console.log(`\nvocab-check: ${fails} finding(s)`);
process.exit(fails ? 1 : 0);
