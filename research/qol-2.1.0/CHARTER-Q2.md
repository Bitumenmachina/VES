# CHARTER Q2 — HIDE / SOLO: finish the screen-only visibility story (VES 2.1 · plan §Q2; Patrick: hide = screen aid only)

BASE: clone `.scratch/q2` at branch `ves2` HEAD after Q1 (md5 in the spawn message). ONE file `src/VES_PM.html` — never Read whole;
`grep -n` then `sed -n` ≤120 lines. No network/npm/egress/second file; nothing client-identifiable; leave `LEDGER.md`/`NOTES.md`;
`.github/workflows/verify.yml` gets ONE new step for the new probe after the probe-deduct step; bump `VES_BUILD` → next `2.1.0-rc.N`
and the `- build:` line in CLAUDE.md. Chrome `/usr/bin/google-chrome`; `rm -rf /tmp/ves-*` after every run; `timeout 240` per probe;
absolute paths; gates in the foreground, one at a time.

TODAY (verified at 2.0.0): per-condition hide EXISTS — rail-card eye (`renderCardsNow` ~:8619-8643) → `state.hiddenConds` (a Set,
~:4698), journaled ("hide X on plan"), card dimmed; `drawOverlay` skips hidden (~:5764); `pickCandidates` skips hidden (~:6970, L-06);
persisted in the `viz` blob (~:12154 / ~:12228 / ~:12667); the takeoff print IGNORES hide by design (~:14032, ~:13724) — Patrick
confirmed 2026-09-15: hide is a screen aid only, paper and money never change. Fills cycle `btnFills` ~:1920 → `cycleFills` ~:6243
(on | faint | off, a pref) is global. Drawn section regions (`state.sections`) have NO hide toggle (R-5o).

RULINGS:
Q2-1  A rail-header strip (above the cards, one lean row) with: **Solo** (also Alt+click on any card's eye) · **Hide others** · **Hide
      measured** · **Show all**; each writes `state.hiddenConds` wholesale through the SAME journal pair the eye uses (~:8636) with a
      name ("solo <condition>", "hide measured (12)", "show all"), one Ctrl+Z reverses the whole gesture. A hidden-count chip
      "N hidden" sits in that strip (hidden when 0); clicking it = Show all.
Q2-2  Keys: `H` hides the ARMED condition (toggle; with nothing armed the toast says why), `Shift+H` = Show all. The ✎ editor carries
      the same eye. The `?` card and the palette list the new keys/commands (check collisions in `keydown` ~:7290-7426 first — `H`
      and `Shift+H` must be free; if not, say so and pick the next free letter, recorded).
Q2-3  Drawn regions: `state.hiddenRegions` (Set of region ids) with an eye on the region chip; hidden regions are skipped by
      `drawOverlay` and `pickCandidates` (chip too), NOT by grouping/subtotals/tagging; journaled ("hide region Annex"). Persisted in
      the `viz` blob beside `hiddenConds` (ids filtered to live regions on load).
Q2-4  Hidden = screen only: `rollup`, cards' quantities, grid, recap, bid, proposal, takeoff paper, every export are IDENTICAL with
      6 conditions hidden and with none. The card shows a "hidden" badge; the takeoff paper does not mention hiding.
Q2-5  Format: no version change (viz-only keys; older readers ignore them). The `hiddenConds` persistence shape is unchanged.

RED-FIRST PROBE `tools/sweep/probe-hide.mjs` (<html> <fixture dir> <repo root>; real pointer for the eye/Alt-click):
  Q2-a  Alt+click the eye on one card → only that condition's shapes drawn; chip reads "25 hidden"; journal top entry names the solo
  Q2-b  Show all (button, then Shift+H) → chip gone, everything drawn, one undo step each way
  Q2-c  hidden condition: its shapes are unpickable at their own coordinates; its qty on card/grid/recap unchanged
  Q2-d  takeoff print with 6 hidden == takeoff print with none hidden (rendered bytes or composed DOM — byte-identical)
  Q2-e  region eye hides the region's outline+chip; its section subtotal and its tagging unchanged
  Q2-f  hide state (conditions + regions) survives save → reload
  Q2-g  `H` with nothing armed → toast says why; `H` with an armed condition toggles it, journaled
  Q2-h  G0 GREEN · probe-b0-fixture 7/7 · b1 · b2a · b2b · b3 · b4 · b5 · b6f · deduct green (each alone)
OUT OF SCOPE: selection/move/duplicate (Q3), per-measurement hide, printing hidden state, any money.
RETURN: `.scratch/q2.patch` (`git diff --cached <base commit>`), post-patch md5, raw probe output base (red) / patch (green), raw G0,
≤300 words of what you SAW. STOP if: G0 moves a cent · ~120K tokens without Q2-a green (return the partial).
