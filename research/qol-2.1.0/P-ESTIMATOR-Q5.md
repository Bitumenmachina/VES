# Q5-P findings — P-ESTIMATOR persona pass, VES 2.1.0-rc.6 (a3da297)

Clone: `.scratch/q5p`, branch `ves2` @ `a3da297`, `src/VES_PM.html` md5 `0d055e3e5b8f1efd723f4d0b092de4de` (verified
with `md5sum` before starting — matches the amendment). Fixture: `fixtures/synthetic/three-sheet/`
(`plan.pdf`, `takeoff.v3.json`, `takeoff.v6.json`). Driven with a real pointer/keyboard through the
Chrome DevTools Protocol, copying the boot/click/key harness pattern from `tools/sweep/probe-qol.mjs`
and `tools/sweep/probe-select.mjs` (not the probe files themselves — a separate script,
`.scratch/q5-drive.mjs`, one Chrome at a time, `timeout 300`, `/tmp/ves-*` cleared after each run).
Walked every numbered item in charter Q5-P (Deduct, Hide, Select, Frictions, Money trio) plus a few
extra gestures along the same lines. Screenshots in `.scratch/q5-shots/` (58 total, named
`<section>-<step>-<label>.png`).

Two things I checked myself and did NOT file, because the disagreement was in my own driving script,
not the product, and I re-verified against the corrected script before writing this file:
- My first pass misread the printed takeoff as 39 characters long because my `window.print` override
  didn't restore `#printDoc`'s contents the way the app's own probes do. Fixed, re-ran — see Q5-01.
- My first pass showed the client bid missing a zero-quantity general line because my own text-reader
  cached a stale prior print. Fixed, re-ran — the bid, cost sheet, grid footer, recap ladder and the
  exported XLSX all named the same line and the same $41,052.77 Overhead figure to the cent once I
  read each one fresh. Not filed.

Per the amendments: I did not re-file R-14d (recap not open by default), R-15b, C-Q2F-1, or C-Q4-1.

| id | severity | what I did | what I saw | what I expected |
|---|---|---|---|---|
| Q5-01 | MED | Hid 4 conditions on screen (`SSMR — field area`, `SSMR — eave`, `SSMR — ridge`, `SSMR — hip` — via the card eye and Hide-others/Hide-measured strip), then Files & exports ▾ → Print → Takeoff… with all sheets checked, and read the composed takeoff document's text. Screenshots `hide-09-before_print_with_hidden.png`, `hide-10-printed_with_hidden.png`. | All 4 hidden condition names appear in the printed takeoff's text exactly as if nothing were hidden — hiding them from the plan did not remove them from, or flag them on, the printed pages. | Since I hid those conditions specifically so I would not have to look at them, I expected the printed takeoff to leave them off too, or at minimum say on the paper that something was hidden when I printed. |
| Q5-02 | LOW | Saved a takeoff with a deduct (version 6, via `takeoff.v6.json`) and opened it in the 2.0.0 build, both through the internal loader and through the on-screen Open door. Screenshot `deduct-11-old_2_0_0_refusal.png`. | Verbatim refusal text (toast and internal error, word-for-word identical): "This takeoff is version 6, newer than this build understands (5). Refusing to guess at it — open it in the build that wrote it." | A plain refusal in the same register as the rest of the app's client-facing text (e.g. naming which VES version can open it) — "Refusing to guess at it" reads like an engineer's comment, not a sentence written for the person who just double-clicked the wrong file. |
| Q5-03 | LOW | Opened the Estimate grid and read the Formula/derivation column for library-priced material lines (Standing Seam Panel, TPO Membrane, others). Screenshots `frictions-13-tab_across_grid_cells.png`, `money-02-rounding_control_before.png`. | Verbatim: "library ADJ 4,021.31 SF as is = 4,021.31 → 4,021 SF (nearest)" and "library ADJ 1,943.75 SF ÷ 1,000 SF/ROLL = 1.94 → 2 ROLL." | Either the word spelled out ("Adjusted") or a legend/tooltip somewhere on the grid. I did not find "ADJ" explained anywhere on screen. |
| Q5-04 | MED | Deducted a cutout inside a field area and, at the hand-off picker ("Cutout perimeter — hand it to a flashing condition?"), read the full list of linear conditions offered before picking mine. Screenshot `deduct-06-recap_after_cutout1.png` (card/recap state around the same gesture) and the raw picker text captured in the driver log. | The picker listed 13 linear conditions in rail order — SSMR — eave, SSMR — ridge, SSMR — hip, SSMR — valley, TPO — parapet flashing, Slate — valley, Hip/valley metal, Eave drip, Curb flashing, Ridge vent, Counterflashing — reglet, Gutter — box, then the condition I had just created ("Perimeter Flashing (Q5)"), then "None." Not alphabetical, not the condition I just made first. | On a real job with two dozen-plus linear conditions, I expected either alphabetical order or my just-created condition pinned near the top, so I am not reading down a long unsorted list every time I hand off a deduct's perimeter. |
| Q5-05 | LOW | Selected an area (`Field (Q5-sel)`) and pressed Ctrl+D to duplicate it, then read the selection chip before and after. Screenshot `select-06-ctrl_d_duplicate.png`. | The chip text is byte-identical before and after ("area · Field (Q5-sel) · 1897.0 SF · sheet 3…"), even though the click landed on the new duplicate (measurement count went from 31 to 32, one new shape at +12/+12 px, confirmed in the driver log). | Since the duplicate is now the selected shape, I expected the chip to say something distinguishing it as the copy (or at least confirm which of the two same-named shapes is under the pointer) rather than reading exactly like the original. |

## What worked as documented (no finding filed)

Deduct (D key, cutout inside a field, "None" and hand-off-to-a-linear pickers, one journal entry for
deduct+hand-off, single Ctrl+Z reverting both, "deductions exceed the area — held at 0" on the card
and rollup, save→reload holding the same numbers); Hide (Alt+click Solo, Hide measured, Show all, a
region's own eye + ghost chip surviving save→reload); Select (line-over-area pick order, Cycle /
Shift+Space, drag-selected moves the shape, drag-unselected pans without moving geometry, marquee
"4 shapes" + Delete as one journal entry + one Ctrl+Z restoring all four, Shift+R re-assign offering
only same-type conditions and refusing an area onto a linear); Frictions (calibrate-one-sheet →
"apply to the other N sheets" offer naming them by number, Shift+L cycling value labels on/values/off
while plain L still opens the Library screen, Shift-held ortho lock snapping a ~20° drag to dead
horizontal at the same length, card ⋮ → Duplicate condition, card ⋮ → "Type a quantity…" landing a
journaled manual measurement, the Estimate grid's single Unit column, the Exports door listing every
file with the plain-English purpose line from the charter); Money trio (rounding CEIL/EXACT/NEAREST
control moves the ordered quantity and is journaled by name with one Ctrl+Z reverting both the
quantity and the override; Overhead reads the identical $41,052.77 on the recap ladder, the cost
sheet, the grid footer and the exported XLSX in the base state, and the same figure after a rounding
change on all three surfaces I re-checked; a zero-quantity general line greys out on the grid with
"qty 0 — not included," is listed under "Not included in this bid" on the client bid, and appears on
the cost sheet too — confirmed on a corrected re-read after I found and fixed a caching bug in my own
script).
