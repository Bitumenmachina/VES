# release/ — what ships beside the file

`src/VES_PM.html` is the product; everything under `release/` is evidence and a way to see it work
without a real job on hand. Nothing here is client work — every name, dimension and price is
invented to exercise VES, not to describe a building anyone owns.

## release/demo/ — two synthetic takeoffs

| file | sheets | format | what it shows |
| --- | --- | --- | --- |
| `demo-flat-roof.json` | none (typed quantities) | version 3 | the plain path: no PDF, ten TPO conditions, two typed measurements. Used by most of `tools/sweep/`'s probes as their standing fixture — do not resize or reprice it; a dozen gates assert against it as-is. |
| `demo-two-sheet.json` + `demo-two-sheet.pdf` | 2 | version 6 (current) | a two-sheet plan (`A-1 Main Roof`, `A-2 Garage`), two typed sections, a pitched roof (6/12) beside a flat one, seven conditions across seven colors. Built for this release to show the things a single flat-roof takeoff cannot: multi-sheet print, Section → System subtotals, and the current rise-per-12 pitch convention with nothing to migrate. As of 2.1.0 it also carries one deduct (a cutout on the field area) and one hidden condition — it needs a 2.1.0 build to open correctly; 2.0.0 refuses it by version number. |

Both are zero-dependency, seeded-random generators — re-running a generator reproduces its file
byte for byte:

    node tools/gen/fixture-3sheet.mjs           # the internal three-sheet stress fixture (not a demo; see fixtures/synthetic/three-sheet/README.md)
    node tools/gen/fixture-demo-2sheet.mjs      # writes release/demo/demo-two-sheet.{json,pdf}

## Load the two-sheet demo by hand

1. Open `src/VES_PM.html` in Chrome or Firefox (`file://…`).
2. Files & exports ▾ → **Open a PDF…** → `release/demo/demo-two-sheet.pdf`.
3. Files & exports ▾ → **Open takeoff…** → `release/demo/demo-two-sheet.json`.
4. You should see two sheets in the sheet index, seven conditions on the rail in seven colors, and
   the recap (▴ to open it) reading two sections — **Main Roof** and **Garage** — each with its own
   subtotal. No banner appears: this file is already in the current format.

## Cold-load proof (0 console errors)

    export VES_CHROME=/usr/bin/google-chrome
    node tools/sweep/probe-b7-demo.mjs \
      "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-two-sheet.json" \
      "$PWD/release/demo/demo-two-sheet.pdf" "$PWD"

Same harness pattern as `tools/sweep/probe-b0-fixture.mjs` (there is no `probe-e2e-smoke.mjs` in
this tree): raw CDP against a headless Chromium, `Runtime.exceptionThrown` /
`Runtime.consoleAPICalled(error)` / `Log.entryAdded(error)` all collected from the instant the
sheet navigates, through the PDF open, the takeoff load, and one pass through the multi-sheet print
door. Seven rows; the last one (D7) is the zero-console-errors claim itself, and D1/D2 also carry
their own error counts so a failure mid-run is not hidden by a later pass. Exit 0 = all seven green;
raw PASS/FAIL output belongs in `RELEASE_NOTES.md` / the commit that lands this, not re-typed here
where it can drift from what actually ran.

`rm -rf /tmp/ves-*` after running it — the harness leaves a headless-Chrome profile directory behind
per run.

## No client data, ever

Nothing under `release/` (or anywhere else in this repo) names a real client, project, address, or
quoted price. If a real takeoff ever needs to be shared for debugging, it is scrubbed to this same
synthetic standard first, or it does not go in the repo — see `CLAUDE.md`.

## License

MIT. Copyright (c) 2026 Patrick Moriarty / Bitumen Machina LLC — `../LICENSE`.
