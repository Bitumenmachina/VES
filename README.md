# VES — Visual Estimating Substrate

A construction estimating tool in **one HTML file**: plan takeoff (PDF sheets, scale calibration,
traced measurement), condition-based pricing, assemblies, margins/OH ladder, and client documents
(bid, proposal, cost sheet, takeoff) — no build step, no package manager, no runtime network
egress. Nothing you measure or price ever leaves the machine it runs on.

## Open it

Open `src/VES_PM.html` directly in Chrome or Firefox (`file://…VES_PM.html` — double-click it, or
drag it into a browser tab). That is the whole install: **no seat fee, no report fee, no device
limit, no login.** Copy the file to any machine and it works there, offline.

One thing worth knowing before you load a real job: VES keeps its price book (the Library) in the
browser's own storage, not in the file. If you have edited the Library in this browser before, that
edited copy — not the built-in seed — is what prices the next takeoff you open. The Library lens
(`L`) tells you which one is governing: its header line reads **"Governing prices: built-in seed"**
or **"Governing prices: edited in this browser…"**. A clean profile (a fresh browser profile, or
"Reset to built-in library" in the Library lens) always starts from the built-in seed.

## What 2.0 adds for an estimator

- **The takeoff prints every sheet you measured on**, not just one. Files & exports ▾ → Takeoff…
  opens a sheet chooser when more than one sheet has measurements on it — check the ones you want,
  print — and each sheet comes out as its own landscape page: the marked-up plan, its own legend,
  its own quantities. Leave a sheet out and the paper's header says so ("Sheets shown: 1, 3 of 3")
  so nobody downstream mistakes a partial print for the whole job.
- **Pitch is one number, typed once, read the same way everywhere.** Type a rise per 12 — `6`,
  `6/12`, `6:12`, or `6"/12` all mean the same thing — on the condition's pitch field or the
  detail-panel row, and that is the number the plan, the card, the recap, the bid, and every export
  read back. There is no second, hidden pitch store to fall out of step with the one you see.
  Bounded 0–24; anything outside that (a stray `999`, a typo like `abc`) is refused and nothing
  changes until you type something the field accepts.
- **Sections, typed or drawn.** Give a condition a Section (type a name, or draw a Section region on
  the sheet and measure inside it — the region tags the condition once, at measure time). Every
  money surface — recap, Estimate grid, client bid, cost sheet, takeoff quantities, proposal, the
  Estimate CSV and workbook — groups **Section → System → line**, with a subtotal at each level.
  Renaming a section moves every condition under it; nothing re-prices.
- **24 colors, plus any hex you pick.** The built-in palette grew from 8 to 24 (your existing
  conditions keep the colors they already have — nothing repaints on open). Need a 25th? The color
  editor has a native color picker and a hex field for any custom color you want, saved with the
  condition. Every color also carries its own dash-and-hatch pattern, so a legend printed in
  grayscale still tells two conditions apart even if the ink looks the same.
  See `RELEASE_NOTES.md` for the gate that proves each of the four items above, with row counts.
- **One description per item, everywhere.** A condition's name, a general line's label, a
  library-linked line's "— labor"/"— equipment" suffix — the same wording reaches the takeoff, the
  Estimate grid, the recap, the bid, the cost sheet, and every export. And the document columns now
  use the words a printed EDGE report uses (Legend · Pitch · Description · SF · LF · EA on the
  takeoff; Description · Quantity · EU · Ord Qty · Ord Un · Unit Price · Prc Un · Net Cost on the
  grid and its exports) — the on-screen chrome (menu labels, buttons, "sheet") is unchanged.

Every quantity stays auditable the way it always has: the Audit CSV records who measured it, on
which sheet, at what calibration; the bid prints the sheet beside each line; every priced line shows
how its quantity was derived (the measurement, the library's coverage / density / formula, the
inputs, the ordered figure) and a library-priced line can carry its own formula and inputs.

## Opening an older file

VES 2.0 reads every file an earlier build saved — nothing you have on disk stops working. What
changes is what you see on that first open:

- **A file saved before pitch became one rise-per-12 number** (anything from before this release
  line) may raise one or two banners the first time you open it, never again after you answer them:
  a **reconcile banner**, naming any condition that showed a pitch on screen but was priced flat in
  the old file — it prices at the pitch you see from here on, and the banner names the dollar shift
  and offers "Keep" or "Set these flat instead"; and, on a condition whose old pitch number could
  never have been a rise (a stray multiplier), a **confirm banner** per condition — "Read it as
  `n`/12?" or "Keep `×n.nnn` as saved" — nothing about that one condition changes until you pick one.
  Both banners are Ctrl+Z-reachable like any other edit; picking "Keep… as saved" is itself an
  answer, on the record, not a postponement.
- **A file saved by this release line already reads clean** — no banner, nothing to confirm.
- **A newer file opened in an older build is refused, loudly**, naming the version it cannot
  understand, rather than guessing at it or dropping data silently. Open it in the build that wrote
  it, or in this one.

## The demo

`release/demo/` has two synthetic takeoffs, neither one a real job:

- `demo-flat-roof.json` — a small typed-quantity takeoff (no PDF), the one the sweep probes in
  `tools/sweep/` load against every gate.
- `demo-two-sheet.json` + `demo-two-sheet.pdf` — a two-sheet plan with two sections (a pitched roof
  and a flat one), current format (version 5). `release/README.md` has the load steps and the
  cold-load proof.

## Verify (any seat, including CI)

    node tools/ves-verify.mjs

Exit 0 = pass. Checks: per-`<script>` syntax (`node --check`), egress pattern set vs the
committed baseline, sentinel-region freeze (two regions, `core` and `engine`; the manifest is written only by
Patrick), and file identity (size + sha256).
`.github/workflows/verify.yml` runs the same script on every push and PR; read the job summary,
not the badge. `bash test/selftest.sh` proves the verifier's exit-code contract (12 checks).

## Engine gate (needs a headless Chrome or Chromium)

    VES_CHROME=google-chrome node gate/g0.mjs check src/VES_PM.html

Drives VES's own functions over CDP and diffs money output byte-for-byte against ratified
goldens (`gate/README.md` has the contract). It runs anywhere a Chromium exists — Claude cloud sessions
(`VES_CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome`), a laptop, and on every push as the `gate`
job of `.github/workflows/verify.yml`; the `probes` job runs every batch gate in `tools/sweep/` (probe-v … probe-b6f) the same
way. Read the job summaries alongside `verify`.

## Working here

- `CLAUDE.md` — seat rules and invariants. Read first.
- `NOTES.md` — current build state, the work queue, and carried lessons. This is the pickup
  document for any new session.
- `RELEASE_NOTES.md` — what changed release over release, and the gate that proves each claim.
- `release/demo/` — synthetic demo takeoffs. All fixtures here are synthetic;
  client-identifiable material never enters this repo.
- `LEDGER.md` — rulings by ID and the open-items register. `tools/sweep/` — the probes and the
  synthetic-plan generators.

## License

MIT. Copyright (c) 2026 Patrick Moriarty / Bitumen Machina LLC — see `LICENSE`. Free to use, copy,
modify and redistribute, including for commercial work; no warranty.
