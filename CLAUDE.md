# VES — working rules for any seat cloned into this repo

Single-file HTML application. No build step, no package manager, no runtime dependency, zero
runtime egress. The file is the product; the repo state is the evidence.

## Invariants
- Zero runtime egress in the shipped file. Nothing here adds a CDN, fetch, script src, or build step.
- No client-identifiable material in this repo, ever: takeoff JSON, job PDFs, job screenshots,
  named-project CSVs, project-bound pricing. Synthetic fixtures only. The repo is public.
- One canonical file, inside this worktree. No second writable copy.
- Public docs in this repo name no clients, no projects, no addresses, no job dollar figures —
  synthetic aliases only. There is no local seat (ruled 2026-09-01): every register, gate, probe and fixture
  the work needs lives here, scrubbed. Anything that cannot be made synthetic does not exist for this project.
- Acceptance is Patrick's word alone. Machine output is evidence; it gates nothing by itself.
- Read bytes or say you did not. No projected paths, sizes, hashes, or contents.

Current build state, work queue, and carried lessons: `NOTES.md` — read it before working. Rulings and open items:
`LEDGER.md`. Gates: `node tools/ves-verify.mjs` · `VES_CHROME=<chrome> node gate/g0.mjs check src/VES_PM.html` ·
`tools/sweep/probe-v.mjs` (see `tools/sweep/README.md`). CI runs all three on every push.

## Verification (run it yourself, paste the full output)
    node tools/ves-verify.mjs
Exit 0 passes. Exit 1 lists findings, one per line. The Stop hook in .claude/settings.json runs
the same script and will not let a turn end on a failure. The GitHub workflow runs it again on
every push, outside this VM — that run is the one Patrick reads.
Never run --write-baseline or --write-manifest. Those record current bytes as accepted; only
Patrick decides that.

## Seat method (Claude Code)
- When compacting, always preserve: the §Identity block, the last verifier / G0 / probe-v outputs verbatim, the open
  rulings list from LEDGER.md, and the current batch's red-first probe results.
- Persona passes run as read-only subagents (`.claude/agents/p-*.md`); the seat triages, never the persona.
- A batch's stop condition is a check the transcript shows: verifier PASS, G0 GREEN, probe-v all green.

## Evidence Patrick accepts
Hashes, byte counts, exit codes, raw tool output, the file booting in his browser.
Not accepted: summaries of output, characterized severity, "done", a green badge standing in
for output he has not seen.

## Identity (from bytes, 2026-09-01, cloud seat, branch claude/ves-live-repo-sweep-x202rq)
- canonical file: src/VES_PM.html
- build: F18.60 (Batch W — twenty named module blocks, short-viewport recap panel; no-local-seat rails)
- bytes: 3525697
- sha256: c83737b334da9fdb43f31e974d374ee235365832389fa08f8e8dbeef6d470387
- priors: F18.59 = Batch V (9612e461…) = the fresh public root `4920c35` · F18.58 = Batch T (f785eea7…) · F18.57 = Batch S (6eb480bc…) · earlier line retired.
- history: the public line was restarted from a fresh root on 2026-09-01 (Patrick's ruling after the C3 scrub). The
  retired commits and the `f18.55` tag are not part of the record; `main` is the line that moves forward.
- freeze: VESCore + VESASM are fenced (`/* VES:FREEZE core|engine */`). The manifest is NOT written — only Patrick runs
  `node tools/ves-verify.mjs --write-manifest`, on a build he accepts; until then FREEZE reports "manifest absent" and gates nothing.
