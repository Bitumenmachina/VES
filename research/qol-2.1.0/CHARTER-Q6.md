# CHARTER Q6 — THE MONEY TRIO (VES 2.1 · plan §Q6; Patrick 2026-09-15: "yes, rule them in this pass"; defaults his to reverse)

BASE: clone `.scratch/q6` at `ves2` HEAD after Q4 (md5 in the spawn message). Same constraints as the other Q charters; ONE CI step for
the new probe after probe-qol; stamp bump. THIS BATCH TOUCHES MONEY SURFACES: G0 must stay GREEN and the fixture controls must
reproduce their goldens to the cent under the DEFAULTS below — if any golden moves, STOP and report the exact cents (the orchestrator
halts for Patrick's word).

RULINGS:
M-1  CEIL ratified: order quantities keep rounding UP to the order unit (today's behaviour). NEW: a per-line rounding override on the
     Estimate grid — `CEIL` (default) / `EXACT` (no rounding) / `NEAREST` — stored on the line override record, journaled ("rounding →
     NEAREST on <item>"), shown in the line's derivation/Formula column and carried in Estimate CSV/XLSX as a `rounding` column; the
     engine honours it in the ordered quantity. Default unchanged → no cents move on any golden.
M-2  Overhead as its own named row/column on EVERY money surface: recap ladder row "Overhead", cost sheet row/column, Estimate grid
     footer + an always-visible "Overhead" column (D-23.8's OH column no longer toggled), XLSX ladder row, rollup CSV — never folded
     into markup or profit. Display of the number the ladder already computes; the reconcile invariant (recap == bid to the cent)
     holds.
M-3  Zero-quantity general lines: shown GREYED on the grid with the reason "qty 0 — not included", listed under "Not included" on the
     bid and the cost sheet (the D-23.9 gate stands: never an included $0), carried with a `not_included` flag in Estimate CSV/XLSX;
     typing a quantity un-greys and includes it (journaled).

RED-FIRST PROBE `tools/sweep/probe-money-trio.mjs` (<html> <fixture dir> <repo root>):
  Q6-a  override NEAREST on one line → ordered qty changes as expected (state the arithmetic), journaled, reverts on Ctrl+Z
  Q6-b  CEIL default: recap cents on the v5 fixture == `golden.cents.json`; on the v6 fixture == `golden.v6.cents.json`
  Q6-c  the Overhead figure is present and EQUAL on recap, cost sheet, grid footer, XLSX ladder, rollup CSV
  Q6-d  a zero-qty general line is greyed with its reason, under "Not included" on bid + cost sheet, flagged in CSV/XLSX; typing 3
        includes it and the bid gains the line
  Q6-e  G0 GREEN 4/4 · probe-b0-fixture 7/7 · every landed probe green (each alone)
OUT OF SCOPE: SQ pass, export collapse, mobile, any new price math.
RETURN: `.scratch/q6.patch`, post-patch md5, raw probe output base/patch, raw G0 + fixture control output, ≤300 words. STOP if any
golden moves (report the cents) · ~150K tokens before Q6-a..c green (return the partial).

## AMENDMENTS at spawn (orchestrator, 2026-09-15 late, after Q4 landed)
- BASE = `ves2` @ 56db1fc (2.1.0-rc.5), `src/VES_PM.html` md5 `9155cd3c`. Stamp bump → `2.1.0-rc.6` (new line on top of the `const VES_BUILD`
  block ~:16891, rc.5 demoted into the history comment the way rc.4/rc.3 sit under it) + the CLAUDE.md `- build:` line. CI: ONE step after
  probe-qol (`code23`) → yours is `code24`; `--no-subgates` if your probe has a children row.
- The Estimate grid now carries ONE `Unit` column (Q4-6; `VOCAB.grid` = Description · Quantity · Ord Qty · Unit · Unit Price · Net Cost, plus
  Kind/Waste/… as before). Any column you add (rounding, Overhead) shifts indices that `probe-b5-words` (B5-2/B5-4), `probe-af` (AF21) and
  `probe-qol` (Q4-f: exactly one `Unit` th) read — re-point them in the same patch and SAY so in your notes; values asserted stay the same.
- **Do not touch `openDrawerAuto` (R-14d, a no-op by ruling) or anything that paints over the rail's cards (R-14b).** The recap is a summoned
  overlay; your Overhead row goes into `recapModel`/the `.recap` table and the bid/cost-sheet ladders, not into new chrome.
- Keys in use (do not collide): b c d e f g h l r s v y z; Shift+h/l/r; Shift+click; Shift+Space; Ctrl+D/Z/Y; Delete; Esc; Space. A per-line
  rounding override is a grid control, not a key.
- Money rule of the batch, repeated: G0 GREEN and both fixture goldens to the cent under the DEFAULTS. `probe-deduct` needs its 4th arg
  `~/Downloads/VES_2.0.0.html`. Sweep pattern that works: `.scratch/q4-sweep/run.sh` (sequential, `timeout 300`, `rm -rf /tmp/ves-*` after each,
  tallies from captured output) — copy it, never run probes in parallel; Chrome = `/usr/bin/google-chrome`.
- RETURN to files: `.scratch/q6.patch` (git diff incl. the new probe via `git add -N`), `.scratch/q6-notes.md` (≤300 words: red on base, green
  on patch, still red, any re-point, the arithmetic behind Q6-a), `.scratch/q6-probe-base.txt`, `.scratch/q6-probe-patch.txt`, `.scratch/q6-g0.txt`,
  `.scratch/q6-fixture.txt` (probe-b0-fixture on your bytes). Commit inside the clone after each ruling lands.
