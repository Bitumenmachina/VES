# CHARTER Q3 — SELECTION AFFORDANCES: the picked thing announces itself and offers its doors (VES 2.1 · plan §Q3)

BASE: clone `.scratch/q3` at branch `ves2` HEAD after Q2 (md5 in the spawn message). ONE file `src/VES_PM.html` — never Read whole;
`grep -n` then `sed -n` ≤120 lines. No network/npm/egress/second file; nothing client-identifiable; leave `LEDGER.md`/`NOTES.md`; ONE
new CI step for the new probe after probe-hide; bump `VES_BUILD` → next `2.1.0-rc.N` + CLAUDE.md line. Chrome `/usr/bin/google-chrome`;
`rm -rf /tmp/ves-*` after every run; `timeout 240`; absolute paths; foreground gates, one at a time. UI rows need a REAL pointer.

TODAY (verified at 2.0.0): `pickCandidates` ~:6964 + `selectAt` ~:6981 (Patrick's AF-1, 2026-09-03): stroke distance ≤ 8 css px
bucketed at 3 px, line/count beats area, smaller area first; pass 2 = containing polygons smallest first; a repeat click within 4 px
cycles the stack (`lastPick` ~:6999); hidden never wins. A click only SELECTS (`selectedId`, grips, `toolMsg` "N more under it") — no arm,
no editor. Edit = grips (`beginGripDrag` ~:6373, journal "move point", Esc aborts; Alt+click inserts a vertex ~:6420; right-click removes
~:6442); exact value via `#keyInput` ~:7211; Delete key ~:7381 / depth-panel ✕ ~:8966 → `deleteMeasurement` ~:7167 (journaled).
MISSING: whole-shape move (body pointerdown pans), duplicate, re-assign (`m.conditionId` never written after creation), multi-select
(single `selectedId`), a chip naming the pick with its doors. Patrick's ask: "click a LF in a SF to delete or edit it" — the pick
already works; the doors after the pick are this batch.

RULINGS:
Q3-0  (R-12a, from Q2) Hidden REGIONS must be recoverable: Show all and the "N hidden" chip also clear `state.hiddenRegions`;
      the chip reads "N hidden · M regions" when regions are hidden; a hidden region keeps a faint ghost chip (name + eye, no outline)
      so its eye can be clicked back; journaled like the rest. Probe row Q3-0: hide a region → ghost chip present → click its eye or Show
      all → region back; after save→reload a hidden region still shows its ghost chip.
Q3-1  `state.selectedIds` (Set) beside `selectedId` (the head; grips render only when the set has one member). Shift+click adds/removes;
      a drag on EMPTY canvas with the select tool draws a marquee and adds every shape whose stroke or vertex lies inside (hidden
      conditions SKIPPED); Esc clears. `pickCandidates` ORDER is untouched (AF-1 stands).
Q3-2  A selection CHIP (small, near the pointer / `toolMsg` position): trade word · condition name · value + unit · "sheet N" ·
      "N more under it" · doors **Edit** (grips, already) · **Delete** · **Move** · **Duplicate** · **Re-assign** · **Cycle**. With N
      selected it reads "N shapes" with Delete · Move · Re-assign. `Shift+Space` cycles the stack under the pointer (Bluebeam parity).
Q3-3  MOVE: pointerdown on the BODY of an already-selected shape starts `beginShapeDrag` (translate all points; live redraw; Esc
      aborts); anywhere else pans as today (Space-pan unchanged); grips win inside 8 px. Journal "move <trade word>" (one entry for a
      multi-move: "move 4 shapes"). Money follows the geometry (a moved line re-measures) — the card qty updates live.
Q3-4  DUPLICATE: `Ctrl+D` (and the chip) clones the selected shape(s) onto the same condition and sheet at +12/+12 css px, lands
      selected; journal "duplicate <trade word>" / "duplicate N shapes"; one undo removes the clones.
Q3-5  RE-ASSIGN: `R` (and the chip) opens a picker of conditions of the SAME type on the job (area→area, linear→linear, count→count;
      a deduct only to an area condition); choosing writes `m.conditionId`, journal "re-assign <trade word> to <condition>"; both
      cards' quantities update; the recap follows (Section/System of the new condition).
Q3-6  Bulk: Delete / Move / Re-assign on a multi-selection = ONE journal entry ("delete 4 shapes"); one Ctrl+Z restores all.
Q3-7  Keys added: `Ctrl+D`, `R`, `Shift+click`, `Esc` (clear), `Shift+Space` (cycle) — check `keydown` ~:7290-7426 + the palette for
      collisions first; list the final map in your notes and in the `?` card. Touch: long-press opens the chip; if the probe cannot
      drive it, say so (a known gap, recorded).

RED-FIRST PROBE `tools/sweep/probe-select.mjs` (<html> <fixture dir> <repo root>; real pointer throughout):
  Q3-a  click a linear that lies inside an area → chip names the linear + its condition + "1 more under it"
  Q3-b  click again at the same spot → chip names the area (cycle); `Shift+Space` cycles back
  Q3-c  drag the selected linear's body 40 px → its points moved 40 px (sheet units), canvas did NOT pan, card qty re-measured,
        journal "move …"; Ctrl+Z restores
  Q3-d  drag an UNSELECTED area's body → the canvas pans, no shape moves
  Q3-e  Ctrl+D on a selected area → a duplicate at +12/+12, selected; one undo removes it
  Q3-f  marquee over 4 shapes → chip "4 shapes"; Delete → gone; one Ctrl+Z restores all 4
  Q3-g  re-assign a linear to another linear condition → both cards' LF change by the same amount, recap section moves with it;
        re-assign an area onto a linear condition → refused, spoken reason
  Q3-h  marquee over a region containing a HIDDEN condition's shapes → they are not selected
  Q3-i  G0 GREEN · probe-b0-fixture 7/7 · b1 · b2a · b2b · b3 · b4 · b5 · b6f · deduct · hide green (each alone)
OUT OF SCOPE: split/join, copy-to-sheet, PDF-linework snap, any money rule.
RETURN: `.scratch/q3.patch`, post-patch md5, raw probe output base/patch, raw G0, ≤300 words of what you SAW (how the chip sits, how the
move feels beside a grip). STOP if: G0 moves a cent · ~150K tokens without Q3-a and Q3-c green (return the partial).
