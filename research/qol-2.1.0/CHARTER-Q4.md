# CHARTER Q4 — FRICTIONS + EXPORTS LIGHT TOUCH (VES 2.1 · plan §Q4)

BASE: clone `.scratch/q4` at `ves2` HEAD after Q3 (md5 in the spawn message). Same constraints as the other Q charters (one file, no
egress, no client data, LEDGER/NOTES untouched, ONE CI step for the new probe after probe-select, stamp bump, Chrome, /tmp cleanup,
timeouts, foreground gates one at a time). Real pointer for UI rows.

ITEMS (each small; do them in this order, commit after each):
Q4-1  Apply this scale to all UNSCALED sheets: when a calibration completes (`state.calibrations[page]` written), offer "Use this
      scale on the N sheets without one" (toast with a button, or the calibrate confirm); scaled sheets keep theirs; ONE journal entry
      ("scale 1/8 in = 1 ft on sheets 2, 3"); pending measurements on those sheets re-price and the pending notes clear.
Q4-2  `L` cycles labels: on → values only → off (a pref like the Fills cycle; shapes unchanged; print unchanged).
Q4-3  Ortho lock: holding Shift while placing a vertex snaps the segment to 0/45/90° from the previous vertex (`maybeSnap` ~:6214
      family); toolMsg shows "ortho".
Q4-4  Duplicate condition: card menu → "Duplicate condition" — same library ref/type/pitch/section, next unused color, name
      "Copy of <name>", zero measurements, journaled; the price book untouched.
Q4-5  Recap dock: opens by default when the loaded/opened project has priced lines (a per-project pref seeded into `drawerOpen`;
      the user's last toggle wins thereafter). `openDrawerAuto` ~:9625 stops being a no-op.
Q4-6  `VOCAB.grid`: EU / Ord Un / Prc Un collapse to ONE `Unit` column on the grid, Estimate CSV and XLSX (declared vocab change —
      re-point `probe-b5-words` B5-2 and any CSV/XLSX header reader; the three-unit chain stays the roadmap target and is written in a
      code comment). Column VALUES unchanged.
Q4-7  Grid at 125–150 % zoom: the Estimate grid scrolls horizontally inside its own container with the Description column sticky
      (reserve its width explicitly — a sticky column reserves nothing by itself; the roofnerd lesson); no page-level horizontal scroll.
Q4-8  Undo after reload: with an empty journal the Undo control's title/toast says "nothing to undo from this session yet — edits
      before the reload are not on the stack" (E-F4), once, not per press.
Q4-9  Tab across grid cells (T-22): Tab/Shift+Tab move between editable cells on a row and wrap to the next row; Enter commits;
      Esc reverts (existing commit/revert semantics untouched).
Q4-10 Manual LF entry reachable from the card: card menu → "Type a quantity…" lands a journaled manual row via `addManualQuantity`
      (O1: "no way to enter 320 lf of DS" — the door existed, not the reachability).
Q4-11 Exports light touch: ONE "Exports" door whose menu lists every file with a one-line trade-word purpose (Estimate CSV — the priced
      lines · BOM CSV — what to buy · Rollup CSV — what each condition totals · Audit CSV — every stroke, with provenance · Supplier RFQ
      — quantities for vendors, no money · Estimate workbook · Client review workbook); same files, same names, nothing merged or
      removed; vocab-check stays 0.

RED-FIRST PROBE `tools/sweep/probe-qol.mjs` (<html> <fixture dir> <repo root>): one row per item above (Q4-a…k), e.g. Q4-a calibrate sheet
1 on a fresh takeoff → offer → sheets 2 and 3 scaled, one journal entry, pending notes cleared; Q4-f grid header shows one `Unit`
column and probe-b5-words B5-2 (re-pointed) green; Q4-k the Exports menu carries the seven purpose lines. Plus Q4-l: G0 GREEN and every
landed probe green (each alone). OUT OF SCOPE: money rules (Q6), selection (Q3), hide (Q2), deductions (Q1).
RETURN: `.scratch/q4.patch`, post-patch md5, raw probe output base/patch, raw G0, ≤300 words. STOP if: G0 moves a cent · ~150K tokens
before Q4-1..Q4-6 green (return the partial with the list of what is left).

## AMENDMENTS at spawn (orchestrator, 2026-09-15 evening, after Q3 landed)
- BASE = `ves2` @ ebbea2c (2.1.0-rc.3), `src/VES_PM.html` md5 `9e077cba861a76f56887838d90796b8f`, 3921025 bytes. Stamp bump → `2.1.0-rc.4`
  (the `const VES_BUILD` line ~:16574: new line on top, the rc.3 line demoted into the history comment the way rc.2 sits under it) +
  the CLAUDE.md `- build:` line. CI: ONE step after probe-select (`code22`) → yours is `code23`, `--no-subgates` if your probe has a
  children row.
- **Q4-2 RULED (R-14a): the labels cycle is `Shift+L`, not `L`.** Plain `L` has opened the Library door since Batch AF (`keydown` ~:8227)
  and keeps doing so. Same shape as `H`/`Shift+H` and `R`/`Shift+R`. Keys now in use, do not collide: b c d e f g h l r s v y z (+Shift on
  h, r), `Shift+click`, `Shift+Space`, `Ctrl+D`, `Ctrl+Z/Y`, Delete, Esc, Space (pan). List your final key rows in the `?` card (~:8538-8564).
- Q3 landed a selection chip (`#selChip`, `renderSelChip`), `state.selectedIds`, marquee, body-drag move, `Shift+R` re-assign picker
  (`#reassignPick`). Your Tab-across-cells (Q4-9) and any keydown you add must leave those alone; check `keydown` for the Q3 branches first.
- Old-build rows: if you run `probe-deduct` yourself, pass the 4th arg `~/Downloads/VES_2.0.0.html` (Q1-g reads it; without it the row passes
  on half the evidence). `probe-z` row Z5 (phone long-press peek) is RED on this box on the base already (OPEN C-Q3-1) — not yours, do not touch it.
- Sweep pattern that works on this box: `.scratch/q3-sweep/run.sh` (sequential, `timeout 300` per probe, `rm -rf /tmp/ves-*` after each,
  tallies from captured output). Copy it, do not run probes in parallel; Chrome is `/usr/bin/google-chrome` (`VES_CHROME`).
- RETURN to files, not only to chat: `.scratch/q4.patch` (git diff incl. the new probe via `git add -N`), `.scratch/q4-notes.md` (≤300 words:
  what you SAW red on base, green on patch, still red, the final key map), `.scratch/q4-probe-base.txt`, `.scratch/q4-probe-patch.txt`,
  `.scratch/q4-g0.txt`. Commit inside the clone after each item (the clone is yours; the orchestrator lands by md5 on `ves2`).
