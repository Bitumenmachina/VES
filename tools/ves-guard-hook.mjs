#!/usr/bin/env node
// ves-guard-hook.mjs — Claude Code PreToolUse hook (matcher: Bash). Blocks, deterministically, the two flags
// that record current bytes as accepted: --write-baseline and --write-manifest. Only Patrick runs those, by hand.
// exit 0 -> allow · exit 2 -> block, stderr is the reason. Advisory prose in CLAUDE.md said the same; a hook means it.
let input = {};
try { input = JSON.parse(await new Promise((r) => { let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => r(d || "{}")); })); } catch { input = {}; }
const cmd = String((input.tool_input && input.tool_input.command) || "");
// Match an INVOCATION of the verifier carrying the flag (line start or after ; & |), not a mention of the flag in text.
const INVOKE = /(^|[;&|]\s*)(?:node\s+)?\S*ves-verify\.mjs\b[^;&|\n]*--write-(?:baseline|manifest)\b/m;
if (INVOKE.test(cmd)) {
  process.stderr.write("ves-guard: --write-baseline / --write-manifest record current bytes as accepted; only Patrick runs them. Blocked.\n");
  process.exit(2);
}
process.exit(0);
