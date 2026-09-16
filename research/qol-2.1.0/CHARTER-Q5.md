# CHARTER Q5 — scoped persona on the QoL gestures, one fix batch, release 2.1.0 (VES 2.1 · plan §Q5)

## Q5-P · P-ESTIMATOR (sonnet; opus on a trip), observations only, real pointer, clone `.scratch/q5p` at `ves2` HEAD after Q6.
Scope = ONLY the gestures Q1–Q4/Q6 added; report what you SAW (steps, verbatim text, numbers, screenshots), never a cause, never a
fix. Findings file `.scratch/q5-findings.md`, one row per finding `id | severity (P0 money-wrong / HIGH blocks / MED slows / LOW
taste) | what I did | what I saw | what I expected`, cap 25; screenshots `.scratch/q5-shots/`.
Do, on a fresh takeoff of the synthetic fixture PDF and on `takeoff.v6.json`:
 1. Deduct: `D`, trace a cutout inside a field; read card/grid/recap; take the perimeter offer onto a flashing condition; Ctrl+Z once;
    cut past the field; save → reload; open the v6 file in the 2.0.0 bytes (the refusal text).
 2. Hide: Alt+click an eye; Hide measured; Show all; hide a region and get it back after a reload; print the takeoff with things hidden.
 3. Select: click a line inside an area; cycle; drag the selected body; drag an unselected area; Ctrl+D; marquee 4 + Delete + Ctrl+Z;
    re-assign a line to another linear condition; try re-assigning an area onto a linear.
 4. Frictions: calibrate sheet 1 and take the all-sheets offer; `L`; Shift while drawing; Duplicate condition; the recap on a priced
    project; the grid's Unit column and Tab across cells; "Type a quantity…" from a card; the Exports door.
 5. Money trio: set a line's rounding to NEAREST and read the ordered qty; find Overhead on recap, cost sheet, grid footer, XLSX; add a
    general line with qty 0 and find it on the grid, bid, cost sheet.
Every place two surfaces disagree, every silent thing, every word you did not understand.
Triage (orchestrator): money → Q5F · bar-backed (a Q ruling or Patrick's four asks) → Q5F · taste → CANDIDATE. Q5F is ONE batch (opus);
a surviving P0/HIGH halts with `HANDOFF_Q5.md`.

## Q5-R · release 2.1.0 (orchestrator + a sonnet words agent on `.scratch/q5r`)
Agent: `RELEASE_NOTES.md` 2.1.0 section (each Q batch in one paragraph with its gate + row count from LEDGER §Batch Q1…Q6; the v6 file
rule in plain words; the money trio defaults and how to reverse a rounding on a line; candidates left open), README additions (deduct,
hide/solo, selection chip and keys, Exports door, Unit column), `research/COLD_TEST_2.1.0.md` (8 hand steps = plan §QoL acceptance,
each ending "you should see …"), demo: `release/demo/demo-two-sheet.json` gains one deduct + one hidden condition (v6; prove cold-load
0 errors with `probe-b7-demo`). vocab-check 0. ≤200 words back.
Orchestrator: stamp `VES_BUILD = '2.1.0'` + the file's header comment + CLAUDE.md; full regression on the stamped bytes (every Phase-1
probe + deduct · hide · select · qol · money-trio · b7-demo, foreground chunks); cold profile; ship `~/Downloads/VES_2.1.0.html` +
`VES_2.1.0_NOTES.md` + demo beside the others (BUSINESS untouched, md5 before/after); `research/qol-2.1.0/` gets the Q charters +
persona file; LEDGER §RELEASE 2.1.0 + R-series additions (R-11…R-14); NOTES; memory stamps. Merge to `main` + tag `v2.1.0` on
Patrick's word (the guard now allows the tree; local main tracks origin/main).

## AMENDMENTS at spawn (orchestrator, 2026-09-15 late, after Q6 landed)
- BASE for Q5-P = `ves2` @ a3da297 (2.1.0-rc.6), `src/VES_PM.html` md5 `0d055e3e`. Clone `.scratch/q5p` is pre-made. You OBSERVE only: no source
  edits, no probe edits, no commits. Fixture: `fixtures/synthetic/three-sheet/` (plan.pdf, takeoff.v3.json, takeoff.v6.json); demo:
  `release/demo/demo-flat-roof.json`. Chrome `/usr/bin/google-chrome` via the DevTools pattern in `tools/sweep/probe-qol.mjs`; one Chrome at a time;
  `rm -rf /tmp/ves-*` after each run; `timeout 300`; absolute paths. Screenshots via `Page.captureScreenshot` to `.scratch/q5-shots/`.
- What landed since the charter was written, so you test what exists: Q3 selection chip + Shift+R re-assign + Ctrl+D + marquee + Shift+Space;
  Q4 scale-to-all offer, `Shift+L` labels (plain L = Library), Shift ortho lock, card ⋮ menu (Duplicate condition · Type a quantity…), ONE Unit
  column, grid scroll container, undo sentence once, Tab wraps, exports door with BOM / Condition totals / Audit CSVs; **Q4-5 (recap open by
  default) was REVERTED (R-14d)** — do not file its absence; Q6 rounding override `SELECT.rsel` on the grid, Overhead row on every face,
  zero-qty general lines greyed. Do not file R-14d, R-15b (the one printed cent) or C-Q2F-1 / C-Q4-1 again — they are on record.
- Findings file `.scratch/q5-findings.md`, one row per finding: `id | severity (P0 money-wrong / HIGH blocks / MED slows / LOW taste) | what I did |
  what I saw (verbatim text, numbers) | what I expected`, cap 25. Severity is yours to propose; the orchestrator triages. ≤300 words of chat.
