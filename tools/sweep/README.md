# tools/sweep — the sweep probes (evidence, not product)

Zero-dependency scripts that drive `src/VES_PM.html` through raw CDP in a headless Chromium and
print what they measured. They never touch product bytes and never write a baseline or manifest.
Fixtures are synthetic: `release/demo/demo-flat-roof.json` and a vector plan `mkpdf.mjs` generates.

    export VES_CHROME=/path/to/chrome          # any Chromium ≥ 141 works; cloud seats: /opt/pw-browsers/chromium-*/chrome-linux/chrome
    node tools/sweep/mkpdf.mjs /tmp/plan.pdf   # synthetic 36x24 in plan (no fonts, no client data)
    node tools/sweep/ladder-fuzz.mjs           # F5 invariant: bid Total == recap sell, 2M random takeoffs
    node tools/sweep/probe-v.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan.pdf "$PWD"
                                               # the batch gate — 17 checks; RED-first on the prior build every batch (see NOTES.md)
    node tools/sweep/mkpdf.mjs /tmp/plan-dense.pdf 40000
    node tools/sweep/probe-x.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan-dense.pdf "$PWD"
                                               # Batch X gate — the absence stated + no lockup (5 checks)
    node tools/sweep/probe-y.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan.pdf "$PWD"
                                               # Batch Y gate — money-face repaint ≤ 200 ms, trace point ≤ 16 ms (4 checks)
    node tools/sweep/probe-z.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD"
                                               # Batch Z gate — glanceable money peek on the cards (6 checks)
    node tools/sweep/probe-aa.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan.pdf "$PWD"
                                               # Batch AA gate — rest-state persistence + UI scale (5 checks)
    node tools/sweep/probe-ac.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD"
                                               # Batch AC gate — the UI scale on phones and paper (5 checks)
    node tools/sweep/probe-ab.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD"
                                               # Batch AB gate — client numbers in sell, library fingerprint, CSV ladder, audit copy (4 checks)
    node tools/sweep/probe-ad.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD"
                                               # Batch AD gate — Estimate workbook with formulas, menu doors, print toasts, keyboard peek, persistence (5 checks)
    node tools/sweep/probe-u.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD"
                                               # Batch U gate — the Unlink freeze keeps the priced quantity, says so, undoes (8 checks; RED-first 2/8 on F18.66)
    node tools/sweep/probe-ae.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan.pdf "$PWD"
                                               # Batch AE gate — Print takeoff: the plan as measured, nothing priced (5 checks; RED-first 1/5 on F18.67)
    git show b191423:src/VES_PM.html > /tmp/VES_F18.68.html
    node tools/sweep/probe-af.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD" /tmp/VES_F18.68.html
                                               # Batch AF gate — estimate sheet depth: the coil case end to end, the derivation on every row and export,
                                               # the old build's loud drop (needs the F18.68 bytes, 4th arg), add-a-line funnel, condition waste, Library lens
                                               # (40 checks: AF1–15 RED-first 1/15 on F18.68; AF16–29 = Batch AG persona-pass-1 fixes, RED-first 16/29 on F18.69;
                                               #  AF30–35 = Batch AH persona-pass-2 fixes, RED-first 29/35 on F18.70; AF36–40 = Batch AI pass-3 fixes, RED-first 35/40 on F18.71)
    node tools/sweep/probe3.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/out
                                               # ingress, injection sinks, print colors, autosave, negative margin
    node tools/sweep/probe4.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan.pdf /tmp/plan-dense.pdf /tmp/out
    node tools/sweep/probe5.mjs "$PWD/src/VES_PM.html" /tmp/plan.pdf /tmp/out
                                               # mobile feasibility: phone / tablet / desktop profiles

Each script prints PASS/FAIL lines or a JSON report; exit codes are 0 pass / 1 findings / 2 harness.
`probe-sweep.mjs` and `probe2.mjs` are the first-pass runs kept for the record (see SWEEP_68c8e23.md).

## Batch B0 (VES 2, 2026-09-14) — Patrick's 9/03 gates, ported from branch kind-curie
The kind-curie lineage (F18.67→F18.71) and this lineage (F18.69→F18.72) both named batches AE–AI, so its
probe-ae/probe-af collided with ours by file name with different content. Ported verbatim under new names:

    node tools/sweep/mkpdf.mjs /tmp/plan2.pdf 1500 2      # two synthetic sheets (third arg = page count, from kind-curie)
    node tools/sweep/probe-p903-doc.mjs   <html> <json> /tmp/plan2.pdf "$PWD" [prior-build.html]   # was kc probe-ae: the takeoff prints one landscape sheet per measured page, legends, quantities page, no money
    node tools/sweep/probe-p903-aim.mjs   <html> <json> /tmp/plan.pdf  "$PWD"                      # was kc probe-af: the click picks what you aimed at
    node tools/sweep/probe-p903-rail.mjs  <html> <json> "$PWD"                                     # was kc probe-ag: one click means one thing on the conditions rail
    node tools/sweep/probe-p903-pitch.mjs <html> <json> "$PWD"                                     # was kc probe-ah: pitch reads as rise over 12; a bare 6 is 6/12
    node tools/sweep/probe-p903-words.mjs <html> <json> "$PWD"                                     # was kc probe-ai: the two dropdowns in trade words

## Batch B1 / B2a / B2b (VES 2) — the fixture gates

    node tools/sweep/probe-b0-fixture.mjs   <html> fixtures/synthetic/three-sheet/takeoff.v3.json  <plan.pdf> "$PWD"
    node tools/sweep/probe-b1-pitch.mjs     <html> release/demo/demo-flat-roof.json "$PWD" fixtures/synthetic/three-sheet
    node tools/sweep/probe-b2a-sections.mjs <html> fixtures/synthetic/three-sheet/takeoff.v3.json  <plan.pdf> "$PWD" [--no-subgates]
    node tools/sweep/probe-b2b-regions.mjs  <html> fixtures/synthetic/three-sheet/takeoff.v3.json  <plan.pdf> "$PWD" [--no-subgates] [old-build.html]
                                            # Batch B2b gate — SECTIONS, DRAWN (R-5e…h): the Section tool outlines a roof
                                            # section and what is measured inside it files that condition under it, once,
                                            # at tag time. 8 rows, RED-first 0/8 on 2.0.0-rc.3. Every region is drawn with a
                                            # REAL pointer (Input.dispatchMouseEvent); snap is turned OFF for the run so the
                                            # containment answers are the fixture's arithmetic and not the snap's. The v5
                                            # refusal row opens a second tab on the OLD build — the last argument, or
                                            # `git show ves2:src/VES_PM.html` when it is left out.

## Batch B3 / B4 (VES 2) — the print gates

    node tools/sweep/probe-b3-colors.mjs <html> fixtures/synthetic/three-sheet/takeoff.v3.json <plan.pdf> "$PWD" [--no-subgates]
                                            # Batch B3 gate — COLORS (R-7): 24 hues, custom hex, dash×hatch patterns,
                                            # readableInk, paginating legends. 8 rows, RED-first 1/8 on 2.0.0-rc.4.
    node tools/sweep/probe-b4-print.mjs  <html> fixtures/synthetic/three-sheet/takeoff.v3.json <plan.pdf> "$PWD" [--no-subgates]
                                            # Batch B4 gate — THE TAKEOFF PRINTS EVERY SHEET (R-10a…g): one print path,
                                            # one per-sheet figure builder, a sheet chooser, the latch released in all
                                            # three states, identity.fileSize read before pdf.js detaches the buffer.
                                            # 9 rows, RED-first 1/9 on 2.0.0-rc.5 (the one green row is B4-9, the
                                            # "B0–B3 still hold" subgate, which was already green on that base).
                                            # --no-subgates skips B4-8/B4-9's eight child gates (probe-ae,
                                            # probe-p903-doc, G0, probe-b0-fixture, -b1-pitch, -b2a, -b2b, -b3).
