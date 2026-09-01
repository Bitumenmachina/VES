#!/usr/bin/env node
// ves-stop-hook.mjs — Claude Code Stop hook. Refuses to let a turn end while verification fails.
// Wire it in .claude/settings.json (committed, so it travels into cloud sessions).
//
// Protocol (hooks reference, code.claude.com/docs/en/hooks):
//   exit 0 -> allow the stop
//   exit 2 -> block the stop; stderr is fed back to Claude as the reason
//   stop_hook_active=true on stdin means a previous Stop hook already blocked once;
//   we allow the stop then, so a persistent failure cannot loop forever. The failure
//   is still printed, so it is in the transcript and in Patrick's view.

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
let input = {};
try { input = JSON.parse(await new Promise((r) => { let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => r(d || "{}")); })); } catch { input = {}; }

const r = spawnSync(process.execPath, [resolve(HERE, "ves-verify.mjs")], { encoding: "utf8", env: process.env });
const out = (r.stdout || "") + (r.stderr || "");

if (r.status === 0) process.exit(0);

if (input.stop_hook_active === true) {
  // Already blocked once this turn cycle. Let the stop happen, but leave the evidence.
  process.stderr.write(`ves-verify still failing after one block; allowing stop so this does not loop.\n${out}`);
  process.exit(0);
}

process.stderr.write(`ves-verify FAILED (exit ${r.status}). Do not stop. Fix the findings below, re-run node tools/ves-verify.mjs, and paste its full output.\n${out}`);
process.exit(2);
