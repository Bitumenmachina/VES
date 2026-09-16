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
`tools/sweep/probe-v.mjs` and the batch probes (see `tools/sweep/README.md`). CI runs the verifier, G0 and the probe list on every push.

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

## Identity (from bytes, 2026-09-05, cloud seat, branch claude/estimate-sheet-depth-vrhnf6 — a TEST BUILD, not main)
- canonical file: src/VES_PM.html
- build: 2.1.0-rc.6 (Batch Q6, VES 2.1 — THE MONEY TRIO: M-1 CEIL ratified and stateable — order quantities still round UP by default, and a line may now carry a `rounding` override (CEIL / EXACT / NEAREST) resolved off the same override stack as every other line field, applied at the one place the engine rounds, journaled “rounding → NEAREST on <line>”, shown in the line’s Formula column (only on lines the engine actually rounds) and carried as a trailing `rounding` column in the Estimate CSV/XLSX; CEIL is stored as the ABSENCE of an override, so nothing untouched moves. M-2 Overhead is its own named row/column on every money surface — the grid footer’s folded “O&P” column becomes Overhead / Markup / Profit, the recap and cost-sheet Overhead rows no longer toggle on the rate (D-23.8), the condition-totals CSV gains the same named ladder, and ONE `ladderCents()` apportionment feeds all six faces so the printed Overhead is the same integer everywhere and Cost + Overhead + Markup + Profit = Sell to the cent. M-3 a general line with no quantity is greyed on the grid with the reason “qty 0 — not included”, listed under “Not included” on the bid and now the cost sheet, and flagged in the Estimate CSV/XLSX; D-23.9’s gate is unchanged underneath — never an included $0. Gates: probe-money-trio.mjs 5/5 RED-first, G0 GREEN 4/4, probe-b0-fixture 7/7 to the cent, verifier PASS, vocab-check 0 findings.)
- bytes: 3961874
- sha256: 8c27b6f8a4d78f883a7f2b528a6d4dc77b9fc3ef1a84bbb792df4e8cb73ed1ec
- on `main`: F18.68 (Batch AE), 3570752 bytes, sha256 494d288baa32a2ee192d28d7668ba87e17c9291607ff03708a5fdcb78cea3760 — the line that moves forward until Patrick accepts this branch.
- priors: see NOTES.md §State (F18.67 Batch U · F18.66 Batch AD · F18.65 Batch AB · F18.64 Batch AC · F18.63 Batch AA · F18.62 Batch Z · F18.61 Batch X · F18.60 Batch W · F18.59 Batch V = fresh root `4920c35`).
- history: the public line was restarted from a fresh root on 2026-09-01 (Patrick's ruling after the C3 scrub). The
  retired commits and the `f18.55` tag are not part of the record; `main` is the line that moves forward.
- freeze: VESCore + VESASM are fenced (`/* VES:FREEZE core|engine */`). The manifest is NOT written — only Patrick runs
  `node tools/ves-verify.mjs --write-manifest`, on a build he accepts; until then FREEZE reports "manifest absent" and gates nothing.
