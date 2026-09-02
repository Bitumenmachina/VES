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
    node tools/sweep/probe3.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/out
                                               # ingress, injection sinks, print colors, autosave, negative margin
    node tools/sweep/probe4.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" /tmp/plan.pdf /tmp/plan-dense.pdf /tmp/out
    node tools/sweep/probe5.mjs "$PWD/src/VES_PM.html" /tmp/plan.pdf /tmp/out
                                               # mobile feasibility: phone / tablet / desktop profiles

Each script prints PASS/FAIL lines or a JSON report; exit codes are 0 pass / 1 findings / 2 harness.
`probe-sweep.mjs` and `probe2.mjs` are the first-pass runs kept for the record (see SWEEP_68c8e23.md).
