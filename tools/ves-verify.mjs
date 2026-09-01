#!/usr/bin/env node
// ves-verify.mjs — dependency-free verification for a single-file HTML application.
//
// Exit codes (the contract):
//   0  all checks passed
//   1  a check failed (details on stdout, one line per finding)
//   3  configuration/usage error (missing file, unset config)
//
// Checks:
//   IDENTITY  size in bytes and sha256 of the whole file (reported, never gated)
//   SYNTAX    every <script> block extracted and passed to `node --check`
//   EGRESS    every match of the egress patterns, compared as a SET against a
//             committed baseline; any match not in the baseline fails
//   FREEZE    sha256 of every sentinel-fenced region compared to a committed manifest
//
// Usage:
//   node tools/ves-verify.mjs                      # uses tools/ves-verify.config.json
//   node tools/ves-verify.mjs --file path.html     # override the target file
//   node tools/ves-verify.mjs --write-baseline     # (re)write the egress baseline from current bytes
//   node tools/ves-verify.mjs --write-manifest     # (re)write the freeze manifest from current bytes
//   node tools/ves-verify.mjs --json               # machine-readable report on stdout
//
// Writing a baseline or manifest is a deliberate act that records the CURRENT bytes
// as accepted. It is never run by a hook or a workflow. Only a human runs it, after
// reading the diff of what changed.

import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.CLAUDE_PROJECT_DIR ? resolve(process.env.CLAUDE_PROJECT_DIR) : resolve(HERE, "..");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const configPath = resolve(ROOT, opt("--config") ?? "tools/ves-verify.config.json");
const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : {};

const filePath = opt("--file") ?? config.file;
if (!filePath) {
  console.error("ves-verify: no target file. Set \"file\" in tools/ves-verify.config.json or pass --file <path>.");
  process.exit(3);
}
const target = resolve(ROOT, filePath);
if (!existsSync(target)) {
  console.error(`ves-verify: target not found: ${target}`);
  process.exit(3);
}

const baselinePath = resolve(ROOT, config.egressBaseline ?? "tools/egress-baseline.json");
const manifestPath = resolve(ROOT, config.freezeManifest ?? "tools/freeze-manifest.json");

// Sentinel fences. {name} is the region name. Defaults are HTML comments; override in config.
const sentinelStart = config.sentinelStart ?? "<!-- VES:FREEZE {name} -->";
const sentinelEnd = config.sentinelEnd ?? "<!-- VES:END {name} -->";

// Egress patterns: anything that could make the shipped file reach the network.
// Matched per line, case-insensitive. Extend via config.egressPatterns (array of regex source strings).
const DEFAULT_EGRESS = [
  "\\bfetch\\s*\\(",
  "\\bXMLHttpRequest\\b",
  "\\bsendBeacon\\s*\\(",
  "\\bnew\\s+WebSocket\\s*\\(",
  "\\bnew\\s+EventSource\\s*\\(",
  "\\bimport\\s*\\(",
  "\\bimportScripts\\s*\\(",
  "<script[^>]*\\ssrc\\s*=",
  "<link[^>]*\\shref\\s*=\\s*[\"']?\\s*(https?:)?//",
  "<img[^>]*\\ssrc\\s*=\\s*[\"']?\\s*(https?:)?//",
  "<iframe[^>]*\\ssrc\\s*=",
  "@import\\s+",
  "url\\(\\s*[\"']?\\s*(https?:)?//",
  "\\bnavigator\\.serviceWorker\\b",
];
const egressPatterns = (config.egressPatterns ?? DEFAULT_EGRESS).map((s) => new RegExp(s, "i"));

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const bytes = readFileSync(target);
const text = bytes.toString("utf8");

const report = {
  file: filePath,
  identity: { bytes: bytes.length, sha256: sha256(bytes) },
  syntax: { blocks: 0, checked: 0, skipped: 0, names: [], failures: [] },   // names: data-ves-module of each checked block ('' if unnamed)
  egress: { matches: 0, baseline: null, added: [], removed: [] },
  freeze: { regions: 0, manifest: null, mismatches: [], missing: [] },
  findings: [],
};

// ---------------------------------------------------------------- SYNTAX
{
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  const tmp = mkdtempSync(join(tmpdir(), "ves-verify-"));
  let m, index = 0;
  while ((m = re.exec(text)) !== null) {
    index += 1;
    report.syntax.blocks += 1;
    const attrs = m[1] ?? "";
    const body = m[2] ?? "";
    const typeMatch = /\btype\s*=\s*["']?\s*([^"'\s>]+)/i.exec(attrs);
    const type = typeMatch ? typeMatch[1].toLowerCase() : "";
    const isJs = type === "" || type === "text/javascript" || type === "application/javascript" || type === "module";
    if (!isJs) { report.syntax.skipped += 1; continue; }
    if (body.trim() === "") { report.syntax.skipped += 1; continue; }
    const nameMatch = /\bdata-ves-module\s*=\s*["']?([^"'\s>]+)/i.exec(attrs);
    const name = nameMatch ? nameMatch[1] : "";
    report.syntax.names.push(name);
    const ext = type === "module" ? "mjs" : "cjs";
    const p = join(tmp, `block-${index}.${ext}`);
    writeFileSync(p, body);
    const r = spawnSync(process.execPath, ["--check", p], { encoding: "utf8" });
    report.syntax.checked += 1;
    if (r.status !== 0) {
      const line = (text.slice(0, m.index).match(/\n/g) ?? []).length + 1;
      const err = (r.stderr || r.stdout || "");
      const errLine = err.split("\n").find((l) => /^\w*Error\b/.test(l.trim())) ?? err.trim().split("\n").slice(-1)[0] ?? "node --check failed";
      const posMatch = /:(\d+)\s*$/m.exec(err.split("\n")[0] ?? "");
      const blockLine = posMatch ? Number(posMatch[1]) : null;
      const htmlLine = blockLine ? line + blockLine - 1 : line;
      report.syntax.failures.push({ block: index, name, htmlLine, error: errLine.trim() });
      report.findings.push(`SYNTAX block ${index}${name ? ` (${name})` : ""} html line ${htmlLine}: ${errLine.trim()}`);
    }
  }
  rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------- EGRESS
{
  const lines = text.split("\n");
  const current = new Map(); // key -> {pattern, line, sample}
  lines.forEach((ln, i) => {
    for (const re of egressPatterns) {
      if (re.test(ln)) {
        const trimmed = ln.trim();
        const key = sha256(Buffer.from(`${re.source}\u0000${trimmed}`)).slice(0, 24);
        if (!current.has(key)) current.set(key, { pattern: re.source, line: i + 1, sample: trimmed.slice(0, 160) });
      }
    }
  });
  report.egress.matches = current.size;

  if (flag("--write-baseline")) {
    const out = { writtenFrom: report.identity, entries: Object.fromEntries([...current].map(([k, v]) => [k, { pattern: v.pattern, sample: v.sample }])) };
    writeFileSync(baselinePath, JSON.stringify(out, null, 2) + "\n");
    report.egress.baseline = "written";
  } else if (existsSync(baselinePath)) {
    const base = JSON.parse(readFileSync(baselinePath, "utf8"));
    const baseKeys = new Set(Object.keys(base.entries ?? {}));
    report.egress.baseline = { entries: baseKeys.size, writtenFrom: base.writtenFrom ?? null };
    for (const [k, v] of current) if (!baseKeys.has(k)) report.egress.added.push({ key: k, ...v });
    for (const k of baseKeys) if (!current.has(k)) report.egress.removed.push({ key: k, ...base.entries[k] });
    for (const a of report.egress.added) report.findings.push(`EGRESS new match line ${a.line} [${a.pattern}]: ${a.sample}`);
  } else {
    report.egress.baseline = "absent";
    if (current.size > 0) report.findings.push(`EGRESS ${current.size} matches and no baseline at ${config.egressBaseline ?? "tools/egress-baseline.json"}; review them, then --write-baseline`);
  }
}

// ---------------------------------------------------------------- FREEZE
{
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const startRe = new RegExp(esc(sentinelStart).replace(esc("{name}"), "([A-Za-z0-9_.-]+)"), "g");
  const regions = new Map();
  let m;
  while ((m = startRe.exec(text)) !== null) {
    const name = m[1];
    const endToken = sentinelEnd.replace("{name}", name);
    const from = m.index + m[0].length;
    const to = text.indexOf(endToken, from);
    if (to < 0) { report.findings.push(`FREEZE region ${name} has no end sentinel`); continue; }
    regions.set(name, sha256(Buffer.from(text.slice(from, to), "utf8")));
  }
  report.freeze.regions = regions.size;

  if (flag("--write-manifest")) {
    const out = { writtenFrom: report.identity, sentinelStart, sentinelEnd, regions: Object.fromEntries(regions) };
    writeFileSync(manifestPath, JSON.stringify(out, null, 2) + "\n");
    report.freeze.manifest = "written";
  } else if (existsSync(manifestPath)) {
    const man = JSON.parse(readFileSync(manifestPath, "utf8"));
    report.freeze.manifest = { regions: Object.keys(man.regions ?? {}).length, writtenFrom: man.writtenFrom ?? null };
    for (const [name, h] of Object.entries(man.regions ?? {})) {
      if (!regions.has(name)) { report.freeze.missing.push(name); report.findings.push(`FREEZE region ${name} in manifest but not in file`); }
      else if (regions.get(name) !== h) { report.freeze.mismatches.push(name); report.findings.push(`FREEZE region ${name} hash mismatch`); }
    }
  } else {
    report.freeze.manifest = "absent";
  }
}

// ---------------------------------------------------------------- REPORT
const ok = report.findings.length === 0;
if (flag("--json")) {
  console.log(JSON.stringify({ ok, ...report }, null, 2));
} else {
  console.log(`IDENTITY ${report.identity.bytes} bytes sha256 ${report.identity.sha256}`);
  console.log(`SYNTAX   ${report.syntax.checked} blocks checked, ${report.syntax.skipped} skipped, ${report.syntax.failures.length} failed`);
  console.log(`EGRESS   ${report.egress.matches} matches; baseline ${typeof report.egress.baseline === "string" ? report.egress.baseline : report.egress.baseline.entries + " entries"}; ${report.egress.added.length} new, ${report.egress.removed.length} gone`);
  console.log(`FREEZE   ${report.freeze.regions} regions; manifest ${typeof report.freeze.manifest === "string" ? report.freeze.manifest : report.freeze.manifest.regions + " entries"}; ${report.freeze.mismatches.length} mismatched, ${report.freeze.missing.length} missing`);
  for (const f of report.findings) console.log(`FAIL     ${f}`);
  console.log(ok ? "RESULT   PASS" : "RESULT   FAIL");
}
process.exit(ok ? 0 : 1);
