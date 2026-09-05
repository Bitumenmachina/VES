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
                                               # (35 checks: AF1–15 RED-first 1/15 on F18.68; AF16–29 = Batch AG persona-pass-1 fixes, RED-first 16/29 on F18.69;
                                               #  AF30–35 = Batch AH persona-pass-2 fixes, RED-first 29/35 on F18.70)
    node tools/sweep/probe3.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/out
                                               # ingress, injection sinks, print colors, autosave, negative margin
    node tools/sweep/probe4.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan.pdf /tmp/plan-dense.pdf /tmp/out
    node tools/sweep/probe5.mjs "$PWD/src/VES_PM.html" /tmp/plan.pdf /tmp/out
                                               # mobile feasibility: phone / tablet / desktop profiles

Each script prints PASS/FAIL lines or a JSON report; exit codes are 0 pass / 1 findings / 2 harness.
`probe-sweep.mjs` and `probe2.mjs` are the first-pass runs kept for the record (see SWEEP_68c8e23.md).
