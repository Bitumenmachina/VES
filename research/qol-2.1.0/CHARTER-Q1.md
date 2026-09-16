# CHARTER Q1 — DEDUCTIONS: a cutout inside a field area subtracts its SF; optional perimeter handoff (VES 2.1 · plan §Q1)

BASE: clone `.scratch/q1` at branch `ves2` HEAD (= release 2.0.0, src md5 b1898283f693a23e3e1040c1d50915fd). ONE file
`src/VES_PM.html` (3.8 MB — never Read whole; `grep -n` then `sed -n` ≤120 lines; skip the pdf.js blob). No network/npm/egress/second
file; nothing client-identifiable; leave `LEDGER.md`/`NOTES.md`/`.github/` (except ONE new CI step for the new probe after the
probe-b6f step); bump `VES_BUILD` → `2.1.0-rc.1` and the `- build:` line in CLAUDE.md. Chrome `/usr/bin/google-chrome`; `rm -rf
/tmp/ves-*` after every run; `timeout 240` per probe; absolute paths; gates in the foreground. F18.68 bytes for probe-af:
`git show b191423:src/VES_PM.html > /tmp/claude-1000/-home-BuildOs/46e46591-1ce9-4d4e-be02-06c8c756587d/scratchpad/VES_F18.68.html`.

GOAL (Patrick 2026-09-15: "deduct roof area"): an estimator traces a skylight, chimney or curb inside a field area and the field's SF
drops by it; one click can hand the cutout's perimeter to a flashing condition as its own linear measurement.

TODAY (verified; line refs at release 2.0.0): no deduction concept. Measurement record `{id, conditionId, page, type, points, value,
notes}` (+`manual`, `exact`) ~:4653; `VESCore.polygonArea` returns `Math.abs` ~:2471; `VESCore.rollup` sums `qty += m.value` ~:2688
with no sign or clamp; `setMeasurementExact` ~:7221 refuses `< 0`; tools ~:1809/:4968/:14704 = select · pan · calibrate/2-pt · verify ·
section · measure (poly / rect / linear / count); `addMeasurement` ~:7189 takes opts; `drawShape` ~:5890 + labels ~:5766; snapshot /
import ~:12154 / ~:12667; `state.viz` carries screen prefs.

RULINGS (build to these):
Q1-1  `m.sign ∈ {+1, -1}`, default +1, set only through `addMeasurement` opts. `value` stays a positive magnitude everywhere
      (`polygonArea` abs and the exact-door floor stand). `rollup`: `qty += m.value * (m.sign ?? 1)`, then a named clamp
      `NET_FLOOR_ZERO` when the net would go below 0 — never silent: an audit note, the card, the grid row and the takeoff paper all say
      "deductions exceed the area — held at 0".
Q1-2  A deduct is a poly/rect traced while the **Deduct** toggle is armed (rack, beside Fills; key `D`; the toggle names itself "Deduct:
      next trace subtracts" and disarms after one trace unless Shift-clicked to stay armed). It lands on the SAME condition as the area
      it cuts (the armed condition) — no parent link; not required to lie inside any polygon (a soft toolMsg note says "not inside any
      area on this condition" but allows it); two overlapping deducts both subtract (market parity: Bluebeam/PlanSwift are naive here).
      Deduct armed on a linear or count condition → refused with a spoken reason, nothing created.
Q1-3  Look: hatch fill + dashed outline in the condition's color, label `−160 SF` with the sign. Card reads `1,240 SF (−160)`. Grid and
      recap show NET with a small "2 deducts" badge on the row. Audit CSV and rollup CSV carry ONE signed row per deduct (`Deduct` in
      the type column, negative value) so a consumer summing the column gets net — grep EVERY export/print writer for `Math.abs`,
      `abs(`, `.value` sums and make each honour `sign`. Takeoff paper (quantities page): gross · Deductions · net per condition that
      has any. Proposal/bid: net only (they never showed measurements).
Q1-4  Perimeter handoff: when a deduct closes, a small picker appears at the pointer listing the job's LINEAR conditions (+ "none");
      choosing one creates a sibling LINEAR measurement from the same closed points (perimeter LF) on that condition. Deduct + sibling =
      ONE journal entry "deduct + perimeter to <condition>" — one Ctrl+Z removes both. "None" leaves just the deduct (entry "deduct on
      <condition>"). Deleting the area a deduct sat under does nothing to the deduct (the clamp + note cover the orphan case).
Q1-5  Format: `TAKEOFF_VERSION` becomes 6 but is WRITTEN as 6 only when some measurement has `sign !== 1` (`fileVersionNeeded()`);
      otherwise the file still says 5 and is BYTE-IDENTICAL to what 2.0.0 writes. Reading 5 defaults sign +1 (no cent moves). The
      2.0.0 refusal of a version-6 file must read "…newer than this build understands — save it with VES 2.1.0 or later" — check the
      refusal text path and improve it if it is generic.
Q1-6  Exact door: `setMeasurementExact` accepts a positive magnitude on a signed row (typing 160 on a deduct keeps it −160).

RED-FIRST PROBE `tools/sweep/probe-deduct.mjs` (<html> <fixture dir> <repo root>; real pointer for the trace and the picker):
  Q1-a  arm Deduct, trace a rectangle inside an area condition → card qty = gross − cutout; grid + recap net; badge "1 deduct"
  Q1-b  audit CSV and rollup CSV carry the deduct as a NEGATIVE row typed Deduct; summing the column gives net
  Q1-c  two deducts summing past gross → net 0, "held at 0" note on card, grid row, audit note and takeoff paper
  Q1-d  Deduct armed on a linear condition and on a count condition → refused with the spoken reason; nothing created
  Q1-e  handoff picker → choose a linear condition → exactly one LINEAR row on it, LF == the cutout's perimeter at the sheet scale
  Q1-f  one Ctrl+Z after a deduct+handoff removes BOTH; the journal names it
  Q1-g  save with a deduct → file version 6 and the 2.0.0 bytes (the base html) refuse it naming 2.1.0; save without → version 5,
        byte-identical to the base's save of the same state; the v3 and v5 fixtures still price to their goldens
  Q1-h  G0 GREEN · probe-b0-fixture 7/7 · b1 · b2a · b2b · b3 · b4 · b5 · b6f green (run each alone)
Also add `fixtures/synthetic/three-sheet/takeoff.v6.json` (the v5 fixture + two deducts + one handoff, generated by extending
`tools/gen/fixture-3sheet.mjs` with a flag) and its own `golden.v6.cents.json` recorded on the patched build; probe-b0-fixture's
controls stay on the v3/v5 files untouched.

OUT OF SCOPE: hide/solo (Q2), selection chip/move/duplicate (Q3), any money rule (Q6), touch.

RETURN: `.scratch/q1.patch` (`git add -A && git diff --cached <base commit> > ../q1.patch`), post-patch md5, raw probe output on base
(red) and patch (green), raw G0, ≤300 words of what you SAW (what a deduct looks like beside its field, how the picker reads, anything
you had to decide). No mechanism narration.
STOP if: G0 moves a cent · a writer cannot honour sign without the pdf.js blob · ~150K tokens without Q1-a green (return the partial).
