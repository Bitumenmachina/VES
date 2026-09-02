# VES — working rules for any seat cloned into this repo

Single-file HTML application. No build step, no package manager, no runtime dependency, zero
runtime egress. The file is the product; the repo state is the evidence.

## Invariants
- Zero runtime egress in the shipped file. Nothing here adds a CDN, fetch, script src, or build step.
- No client-identifiable material in this repo, ever: takeoff JSON, job PDFs, job screenshots,
  named-project CSVs, project-bound pricing. Synthetic fixtures only. The repo is public.
- One writable copy of the product, ever: the checkout a batch edits. Subagents work in read-only worktrees.
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
Exit 0 passes. Exit 1 lists findings, one per line. The Stop hook runs the same script: it blocks the first attempt
to end a failing turn and prints the findings; the second attempt is allowed so a stuck failure cannot loop (the
hooks guide's cap). A PreToolUse guard hook refuses the two write flags from a seat. The GitHub workflow runs it again on
every push, outside this VM — that run is the one Patrick reads.
The verifier's two write flags record current bytes as accepted; only Patrick runs them, by hand.

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
- build: F18.65 (Batch AB — one set of client numbers; the file names its price book)
- bytes: 3554056
- sha256: 3c3b53def99e533960faada090691c666e28f2fb24fb9c7522d2a1ae1bb43f1c
- priors: see NOTES.md §State (F18.64 Batch AC · F18.63 Batch AA · F18.62 Batch Z · F18.61 Batch X · F18.60 Batch W · F18.59 Batch V = fresh root `4920c35`).
- history: the public line was restarted from a fresh root on 2026-09-01 (Patrick's ruling after the C3 scrub). The
  retired commits and the `f18.55` tag are not part of the record; `main` is the line that moves forward.
- freeze: VESCore + VESASM are fenced (`/* VES:FREEZE core|engine */`). The manifest is NOT written — only Patrick runs
  `node tools/ves-verify.mjs --write-manifest`, on a build he accepts; until then FREEZE reports "manifest absent" and gates nothing.
