# VES G0 — Golden Money-Path Gate

The proof that a VES build's pricing is byte-identical to a ratified reference.
Lives OUTSIDE the product file (`src/VES_PM.html` carries no proof machinery). Zero
dependencies: Node ≥ 22 (global `WebSocket` + `fetch`; verified on 22.22.2 and 24) drives headless Chrome/Chromium over
raw CDP.

## Contract (Fable 5 / Patrick, 2026-07-05)
- Nothing from anyone is adopted until G0 runs **green on the untouched original
  AND on the candidate**. "Byte-identical pricing" == golden-identical G0 output.
- Canonical reference build: the `VES.html` of 2026-07-05 the goldens were frozen from (not in this repo),
  sha256 `506f80f7…`, 3,172,449 B.
- Acceptance is Patrick's cold run only. G0 is a save point, never a PASS.

## Run
```
node g0.mjs create <ves.html>     # freeze goldens from a ratified build
node g0.mjs check  <candidate>    # gate a candidate; exit 0 GREEN / 1 RED / 2 harness-fail
```

## Scenarios (all drive window.VESApp — the app's own functions, no parallel logic)
- **A** — new takeoff → `loadAssembly('ssmr')` → `addManualQuantity('ssmr.field', 3150.8)`
  → fixed ladder OH/MU/PR = 10/8/5 → full 23-line priced output. **This is the golden.**
  Ratified by Patrick 2026-07-05 against his July-5 screenshots (4/6 lines byte-exact;
  the 2 SF-labor lines differ by input provenance — drawn polygon ≈3150.761 vs typed
  3150.8 — ruling A: the typed-exact 3150.8 output IS the golden; screenshot pennies
  are engine provenance, not targets).
- **B** — one manual priced line (100 EA @ $10) → pins `sellLadder` + `recapModel`-as-truth
  (R3): cost 1000, sell 1247.40.
- **C** — build A → `snapshot()` → JSON → `newTakeoff()` → `loadFromData()` → re-read.
  Must equal goldenA (save/reload never perturbs pricing).
- **D** — build A → inject F18 `sched{start,days}` onto conditions → re-read. Must equal
  goldenA (schedule data is pricing-inert; guards F18 forever).

## Freeze / provenance
`goldens/fingerprints.json` records sha256 of the reference build, both goldens
(money-only, key-sorted), and every harness file. **After freeze, harness edits are
YELLOW — propose to Patrick and wait.** Re-`create` only against a build Patrick has
ratified.

## Verified 2026-07-05
- CREATE on `506f80f7`: goldens frozen, C==A, D==A.
- CHECK on `506f80f7`: **GREEN** (exit 0).
- CHECK on a 1-cent tamper (`ssmr.fastener` 0.18→0.19): **RED** (exit 1), failing A/C/D,
  B unaffected. Red-before-green confirmed — the gate catches a sub-dollar regression.

## Toolchain dep (flagged to Patrick, accepted)
Headless Chrome/Chromium (≥ 141 verified) + raw CDP over Node's built-in WebSocket. No npm installs. Harness
never touches product invariants.
