# fixtures/synthetic/three-sheet — the VES 2 three-sheet fixture

One invented takeoff that carries, at once, every complaint Batch B0 has to be able to reproduce:
three sheets, measurements on all three, two conditions whose measurements span two of them,
26 conditions against an 8-hue palette, areas + linears + counts, library-backed and free-standing
conditions side by side, all four pitch shapes F18.72 can store, and a `location` axis with an
unassigned value in it.

**Nothing here is a job.** Every name, dimension, price and sheet title is invented to exercise a
code path. No client, no address, no quoted price, no real drawing.

## Files

| file | what it is |
| --- | --- |
| `plan.pdf` | 3 vector sheets, 36 × 24 in (2592 × 1728 units), `A-1 Main Roof` / `A-2 Annex` / `A-3 Canopy`. Each carries a drawn roof outline, a title block, and a scale bar 800 units long labelled 100 FT. No embedded font (base-14 Helvetica by name only), no raster, no JavaScript, no external reference. 6,366 bytes. |
| `takeoff.v3.json` | the takeoff, in the v3 shape `snapshot()` writes — 26 conditions, 29 measurements, calibrations on all three sheets at 0.125 ft/unit. |
| `takeoff.v6.json` | **Batch Q1.** The same job, in the v6 shape: pitch already migrated to a rise per 12 (one store; the bare 6 kept as a legacy factor), `sections: []`, plus **two deductions** on `SSMR — field area` and **one perimeter handoff** onto `Eave drip`. The only file in this repo that carries `m.sign`. Written by `node tools/gen/fixture-3sheet.mjs --v6`; the v3 file and the PDF are untouched by the flag. |
| `golden.v6.cents.json` | what **2.1.0-rc.1** computes from `takeoff.v6.json` + `plan.pdf` — cost/sell in integer cents and every condition's quantity in integer thousandths. Recorded by `node tools/sweep/probe-deduct.mjs … --write-golden` (a hand-run gesture) and pinned by probe row Q1-i. |
| `golden.cents.json` | what F18.72 computes from the two files above. Money in integer cents, quantities in integer thousandths of the displayed unit, plus the sha256 of the HTML it was computed on. |
| (generator) | `tools/gen/fixture-3sheet.mjs` — zero dependencies, one seeded PRNG. Re-running it reproduces both files byte for byte; that is the only reason the golden means anything. |

## Deductions — what the v6 file holds (Batch Q1)

Two cutouts inside the SSMR field area's own traced rectangle on sheet 1, at eighth-fractions of
that rectangle so the arithmetic stays exact in binary floating point, and one linear measurement
on `Eave drip` whose points are the **closed ring** of the first cutout — the perimeter handoff, as
`finishDeduct` writes it. Neither cutout is big enough to push its condition past zero: the
`NET_FLOOR_ZERO` clamp is proven by probe row Q1-c on traced geometry, not by this file.

A v6 file runs **no** migration on load, so what the generator writes is what the app prices —
which is the only reason a golden recorded against it means anything. Reading it in 2.0.0 is
refused at the door by version number; a takeoff with no deduct in it is still written as version
5 and still opens there.

## Rebuild and re-gate

    node tools/gen/fixture-3sheet.mjs
    node tools/gen/fixture-3sheet.mjs "$PWD/fixtures/synthetic/three-sheet" --v6
    VES_CHROME=/usr/bin/google-chrome node tools/sweep/probe-b0-fixture.mjs \
      "$PWD/src/VES_PM.html" "$PWD/fixtures/synthetic/three-sheet/takeoff.v3.json" \
      "$PWD/fixtures/synthetic/three-sheet/plan.pdf" "$PWD"

Seven rows, PASS/FAIL each, exit 1 on any FAIL. `--write-golden` re-records instead of comparing —
a deliberate hand-run gesture, never automatic.

## What is in the takeoff

- **Sheets.** 15 measurements on sheet 1, 9 on sheet 2, 5 on sheet 3. `SSMR — field area` (#1) is
  measured on sheets 1 and 2; `Hip/valley metal` (#14) on sheets 1 and 3.
- **Conditions.** 12 built on seed-library rows (`libRef` present: `ssmr.*`, `tpo.*`, `slate.*`),
  14 free-standing with their own `unitCost`. Library-backed ones are priced by the engine against
  the seed price book (`Roofing & Envelope — Coastal SE Georgia`, fingerprint `7e4e6a2a`);
  free-standing ones are priced by `unitCost × quantity` on the plain path.
- **Geometry.** Every traced path is orthogonal with integer coordinates, so every quantity is exact
  in binary floating point and the golden cannot drift on rounding.
- **Calibration.** All three sheets at `ftPerUnit = 0.125` (the drawn 800-unit bar = 100 ft). 0.125
  is a power of two on purpose.
- **Locations.** `Main Roof` 13, `Annex` 5, `Canopy` 4, and 4 conditions deliberately left
  **unassigned** (`location: ""`) — #19 Roof access ladder, #21 Sheathing repair — allowance,
  #22 Snow guard, #26 Downspout boot. Unassigned is the fourth value on that axis, not an omission.
- **The two named linears B1 will treat differently:** #14 `Hip/valley metal` and #15 `Eave drip`,
  both free-standing linears at 6/12.

## Pitch — all four shapes, and the one that is wrong on purpose

F18.72 stores pitch as a **FACTOR**, not a rise: it multiplies the measured quantity
(`VESCore.rollup`, counts immune). 4/12 = `1.0541`, 6/12 = `1.1180`, 9/12 = `1.25`.

| shape | where it lives | in this fixture |
| --- | --- | --- |
| flat | no `pitch` key at all | 17 conditions |
| store A | `condition.pitch` | #4 (1.0541) #10 (1.25) #11 (1.1180) #14 (1.1180) #15 (1.1180) #17 (1.0541) #20 (1.25) #25 (1.0541) |
| store B | `assemblyProject.conditionOverrides["ssmr.field"].pitch` | #1, factor 1.1180 |
| **the bare 6** | `condition.pitch: 6` | **#24 `Cricket framing`** |

**#24 is INTENTIONAL and is not to be "fixed" here.** A takeoff that says `pitch: 6` meaning "6/12"
is read by this build as a **6× multiplier**: 1,531.25 SF measured prices as 9,187.5 SF. That is the
P0 this fixture exists to hold still. `golden.cents.json` records the factor as computed (6), and
probe row **F6** pins it. B1 flips that row; until then, a green F6 means the P0 is still exactly
where it was.

## Colors — 26 conditions, 8 hues

The palette is 8 (`src/VES_PM.html` `PALETTE`), so the fixture deliberately runs past it. Assignment
is `PALETTE[i % 8]`, which is what the app's own add-a-condition paths do. Every hue repeats:

| hue | conditions sharing it |
| --- | --- |
| `#ff5d3a` | 1 SSMR — field area · 9 TPO — drain · 17 Ridge vent · 25 Gutter — box |
| `#3d9be9` | 2 SSMR — eave · 10 Slate — field area · 18 Skylight curb · 26 Downspout boot |
| `#6fd08c` | 3 SSMR — ridge · 11 Slate — valley · 19 Roof access ladder |
| `#ffd166` | 4 SSMR — hip · 12 Slate — chimney cap · 20 Underlayment — high temp |
| `#b07cd8` | 5 SSMR — valley · 13 Field membrane · 21 Sheathing repair — allowance |
| `#f25f8e` | 6 SSMR — pipe penetration · 14 Hip/valley metal · 22 Snow guard |
| `#4ecdc4` | 7 TPO — membrane field · 15 Eave drip · 23 Counterflashing — reglet |
| `#c8a24b` | 8 TPO — parapet flashing · 16 Curb flashing · 24 Cricket framing |

The worst collision on the sheet is `#ff5d3a`: an **area** on sheet 1 and a **linear** on sheet 2
in the same hue.

## Two things the fixture cannot say, stated rather than faked

1. **No seed-library row carries a pitch default.** The charter for this batch asked for library rows
   with a `pitchDefault`. A takeoff file cannot carry library rows at all — `normalizeSnapshot` keeps
   only `library.name` and `library.fingerprint` — and the seed book has **45 conditions, 0 with a
   `pitch` column** (read from the running app's own `state.library`, not assumed). The app's own
   source says as much: "No seed library carries one, so this branch is inert today."
   The honest substitute is #4, #10 and #11: **library-backed conditions carrying store-A pitch**,
   which is the on-disk state that divergence actually produces. Watch them — `VESCore.rollup`
   applies store A to the display, while the engine is handed raw unpitched sums and applies only
   store B, so those three price flat and display pitched. That is real, it is in the golden, and it
   is not something this fixture invented.
2. **`identity.fileSize` is 0, and it is not a typo.** `buildIdentity` reads `meta.size`, which
   `openFromBytes` set from `data.byteLength` *after* pdf.js had already transferred the same
   `Uint8Array` to its worker — the transfer detaches the buffer, so the length read 0. Measured on
   this PDF, not assumed. Every PDF-backed takeoff F18.72 … 2.0.0-rc.5 saved therefore carries
   `fileSize: 0`, and `compareIdentity` calls a fileSize difference MAJOR — so writing the true 6,366
   here would have raised the identity-review modal on every load and the fixture would never have
   reached the app.

   **Fixed in 2.0.0-rc.6 (Batch B4, R-10f / C-B0-1), and this file deliberately still carries 0.**
   `openFromBytes` now reads `byteLength` BEFORE handing the buffer to pdf.js, so a takeoff saved from
   here on records the real size (6,366 for this PDF). A saved **0 means UNKNOWN** and is never compared,
   so every takeoff written by an earlier build still loads with no review — and THIS FILE IS THE ONE
   THAT PROVES IT. It is the repo's only pre-rc.6 identity, so the generator keeps writing 0 on purpose
   and re-running it still reproduces these bytes. Probe row F2 now reads `fileSize: 0 saved vs 6366
   open` in its detail and tolerates exactly that one difference; probe-b4-print row B4-7 checks both
   halves — a fresh save carries 6,366, and this file still loads with no identity modal.

## The golden, on F18.72

`golden.cents.json` was recorded against `src/VES_PM.html`
sha256 `d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70` (build `F18.72`):

- 101 priced lines, 0 turned off
- cost **$398,268.94** → sell **$496,800.67** (OH 10 / MU 8 / PR 5, the same ladder as the demo file)
- 26 condition ids, 1…26, each with its rollup quantity, its displayed quantity, and its extended
  cost where the plain path prices it

Those dollars are synthetic arithmetic over a synthetic price book. They are a fingerprint of the
build, not a bid.
