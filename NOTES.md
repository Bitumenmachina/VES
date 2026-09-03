# NOTES — build state, queue, and carried lessons

Condensed 2026-08-31 from `WAVE2_QUEUE.md` + `WAVE2_HANDOFF_OPUS.md` (verbatim originals: commit
`8313a26`, retired with the 2026-09-01 fresh root). This file is the pickup document — current
truth first, history compressed.

## State

- **src = F18.68** — sha256 `4bf0a3dbd699514de9cd13539d029960f8058fe79e064da50d38f247ea7dbecc`,
  3573310 bytes. **Batch AF landed 2026-09-03** (Patrick's review, item 2: "unable to easily click items so I can modify
  them, i.e. flashings over field conditions"): `selectAt` ranks what the pointer is ON (a stroke, vertex or marker within
  8 screen px — nearest first, a line or marker before an area, a smaller area before a larger one) ahead of the area that
  merely contains the point (smallest first); a repeat click within 4 px steps through the stack; the message names the
  condition and how many shapes sit under it. `VESCore.distToMeasurement` (fenced) is untouched — the stroke-only distance
  lives in the `tools` block. Gates: probe-af 7/7 (RED-first 4/7 on F18.67 — the edge, nesting and cycle picks fail
  there) · probe-ae 8/8 · probe-ad 5/5 · probe-ab 4/4 · probe-ac 5/5 · probe-aa 5/5 · probe-z 6/6 · probe-v 17/17 ·
  G0 4/4 · verifier PASS 0 new egress.
- **F18.67 = Batch AE, landed 2026-09-03** — sha256 `e85f693e615469b88f427a02e98ed4014f9d09ee6a54f94e78cab666f85dc2f7`,
  3569896 bytes. **Batch AE landed 2026-09-03** (Patrick's review of F18.66, first item: "there is no way to just print a
  takeoff"): **Print takeoff…** in the exports menu and the palette prints every sheet that carries measurements whole and
  landscape with the markup the screen shows, a per-sheet legend (that sheet's quantities, pitched per D-26.1) and a closing
  quantities page — the card numbers, never money. The proposal's plan snapshot and the takeoff share one compositor
  (`compositeSheet`; the proposal's bytes are unchanged — probe-ae AE7 compares against the prior build). No identity gate;
  every early return releases the latch (D-24.7a); a sheet that fails composes a marked placeholder (MED-4); the toast names
  the document (AD-3). `mkpdf.mjs` takes a page count. Gates: probe-ae 8/8 (RED-first 1/8 on F18.66 — only the AE7 regression guard passes there) · probe-ad 5/5 · probe-ab 4/4 · probe-ac 5/5 ·
  probe-aa 5/5 · probe-z 6/6 · probe-v 17/17 · G0 4/4 · verifier PASS 0 new egress.
  **Patrick's 2026-09-03 review queue (his order): AE print takeoff ✅ → AF canvas pick ✅ → AG card click arms (his ruling) →
  AH pitch as rise/12 → AI the two dropdowns, CSVs under Setup, plain words. HELD on his word: .xlsx table formatting,
  the schedule/Gantt review, the roofing-knowledge import.** Plan of record: LEDGER.md §"Patrick's review of F18.66".
- **F18.66 = Batch AD, landed 2026-09-02** — sha256 `95bfbfd0ac0e3fbde8f0906ad7aa3bf537fcba7d7718f8f5aa4c9960e78ed998`,
  3,560,089 bytes (the personas' cheap candidates + bar M2's internal half, under
  the owner's standing word): an internal **Estimate .xlsx** with every line's Qty × Unit as a live formula, Cost as
  SUM, the ladder as formulas and Sell as their sum (values cached); the exports menu carries it and the client
  review workbook (T-05); a print sets the toast to say what went to print (T-06); the money peek has a keyboard
  door (G-10); snap, split mode and the dock width persist (G-12). Gates: probe-ad 5/5 (RED-first 0/5 on F18.65) ·
  probe-ab 4/4 · probe-aa 5/5 · probe-z 6/6 · probe-v 17/17 · G0 4/4 · verifier PASS 0 new egress.
- **F18.65 = Batch AB, landed 2026-09-02** — 2026-09-02** (owner-approved: P-TRADE T-01/T-02/T-03 + P-MARKET M-08): the
  client-review .xlsx is now the bid in SELL only — the bid's cent apportionment and derived rate are one helper
  (`bidCents` / `bidRate`) both papers read, subtotals and the Total are live SUM formulas (bar M2, client half);
  a takeoff file carries the library's name + fingerprint and a different book here raises the standing banner
  instead of silently re-pricing; the estimate CSV footer shows Overhead / Markup / Profit apportioned so Cost +
  ladder = Sell; landing and README name the audit trail. Gates: probe-ab 4/4 (RED-first 0/4 on F18.64) ·
  probe-v 17/17 · probe-z 6/6 · G0 4/4 · verifier PASS 0 new egress.
- **F18.64 = Batch AC, landed 2026-09-02** — 2026-09-02** (P-GAME rows G1–G7 on Batch AA's UI scale — the same approval):
  print media resets the root zoom (a bid at 150% paginated onto two pages); the scale range follows the viewport
  (narrow ≤ 115%, mid ≤ 130%) and coarse pointers floor at 100%, so the rail's controls, Hide, the exports menu and
  the money peek stay on a 390 px screen; the exports menu carries a Text size item (the toolbar control sits in the
  rest sliver on a phone); the menu cap is measured again after the toolbar expands; peek width in zoomed px;
  schedule inputs join the coarse-pointer rule. Gates: probe-ac 5/5 (RED-first 1/5 on F18.63) · probe-aa 5/5 ·
  probe-z 6/6 · probe-v 17/17 · G0 4/4 · verifier PASS 0 new egress.
- **F18.63 = Batch AA, landed 2026-09-02** — 2026-09-02** (PASS rows G5 + G7, owner-approved B5): one store the app owns
  (`ves:prefs`, never the takeoff) keeps the rail, the drawer pin, the fill mode, the grid's feet-per-square and the
  new UI scale across reloads (theme keeps `ves:theme`); a UI-scale control beside the theme toggle cycles
  100 → 115 → 130 → 150 → 90 % via CSS zoom on the root — a two-click trace at 1.5x still reads 111 ft and every lens,
  the exports menu (its height cap is now computed in zoomed px) and the money peek stay inside a 1440x900 viewport.
  The narrow-screen rail default yields to a saved choice and never records itself as one. Gates: probe-aa 5/5
  (RED-first 0/5 on F18.62) · probe-z 6/6 · probe-v 17/17 · G0 4/4 · verifier PASS 0 new egress.
  **B2–B5 are landed; the approved list is complete.**
  **PASS_2026-09 personas:** P-SEAT (13 rows, folded into Batch X) and P-TRADE (12 rows) are on record in LEDGER.md;
  P-TRADE found two money-honesty rows — the client-review .xlsx exports COST (T-01) and a takeoff file re-prices
  silently on another machine (T-02) — proposed as **Batch AB** (AB-1 review sheet in sell · AB-2 library fingerprint
  + banner · AB-3 ladder rows in the estimate CSV · AB-4 the landing/README name the audit trail) — ✅ approved and
  landed as F18.65. P-MARKET (10 rows) and P-GAME (19 rows) are on record in LEDGER.md; P-GAME's scale regressions
  became Batch AC. Owner 2026-09-02: "make these changes and anything else you see fit" — the seat continues with
  the cheap candidates (Batch AD) and reports.
- **F18.62 = Batch Z, landed 2026-09-02** (PASS row G6, owner-approved B4): hover (350 ms) or long-press
  (500 ms) on a condition card floats a read-only money peek beside it — priced lines with quantity and amount, off
  lines struck, gated lines named, cost, sell, share of the total — without arming, selecting or opening a lens.
  Shared lines attributed 1/N, so per-condition sells + fixed allowances reproduce the recap sell to the cent
  (probe-z Z4: diff 0.00 on the demo). Gates: probe-z 6/6 (RED-first on F18.61) · probe-v 17/17 · G0 4/4 · verifier
  PASS 0 new egress.
- **F18.61 = Batch X, landed 2026-09-01** (PASS_2026-09 rows T1 + T2, owner-approved B2): landing and README
  state no seat fee / no report fee / no device limit / no login; **root cause of every slow open under file://** —
  pdf.js's same-origin test reads a file:// page as origin "null" and silently parsed every PDF on the main thread
  (fake worker); the app now starts one Worker at boot and hands pdf.js the port: 40k-segment sheet, longest
  main-thread task 552 ms → 0 on desktop, 1,484 → 194 ms at 4x throttle, first raster 3.0 → 1.7 s. Deterministic
  guard hook (PreToolUse) refuses the verifier's two write flags from a seat; selftest 12/12. P-SEAT pass
  findings folded in (README/NOTES/LEDGER drift, selftest config restore, agents in worktrees). Gates: probe-x 5/5
  (RED-first 0/5 on F18.60) · probe-v 17/17 · G0 4/4 · verifier PASS 0 new egress.
- **Batch Y (PASS rows G1 + G2, owner-approved B3) landed 2026-09-01 as a gate only — the bytes already met the bar:**
  `tools/sweep/probe-y.mjs` measures every on-screen money face after a sell change (HUD, grid footer, recap) and
  the trace-point click handler at fit zoom. Desktop: faces repaint in 9–33 ms, handler 0.5–1.7 ms. Phone 4x: faces
  27–184 ms (the margin `input` path is the slow one at 184 ms — under the bar, on the record), handler ≤ 11.8 ms.
  No product byte changed; the gate runs in CI's `probes` job. src stays F18.61.
- **F18.60 = Batch W, landed 2026-09-01** (Patrick's ruling: there is no local seat): the application script
  is split at its own module banners into twenty named `<script data-ves-module=…>` blocks (proof: a reverse
  transform reproduces the F18.59 bytes exactly; 0 top-level statements call a later-defined function; G0 4/4);
  the verifier names the block in every SYNTAX finding; under 560px of viewport height the summoned recap panel
  takes the dock column with its own scroll and close (C-N1 class closed); `LEDGER.md` is public and seeded from
  every ruling the bytes cite; CI runs verifier + G0 + probe-v. Gates: G0 4/4 · probe-v 17/17 (V12/V13 RED-first
  on F18.59) · selftest 10/10 · verifier PASS 0 new egress, FREEZE 2 regions.
- **F18.59 = Batch V, landed 2026-09-01 (the fresh public root `4920c35`)** (owner-approved
  from `SWEEP_68c8e23.md` + `MOBILE_FEASIBILITY_68c8e23.md`): U2 file-door typing of measurements/conditions
  (drop + count + toast + standing banner; a string quantity priced as $0 silently on F18.58) · proposal legend
  swatches print under "background graphics off" · rail rests collapsed under 720px (one tap back) · coarse
  pointers: 40px money cells/menu items, 16px inputs, 16MP raster cap · exports menu scrolls in a short viewport ·
  VESCore + VESASM freeze-fenced (manifest = owner's act) · seed-library provenance scrubbed of names and local
  paths · CI: `gate` job runs G0 on the runner's Chrome, actions SHA-pinned, token read-only · `tools/sweep/`
  carries the probes. Gates: G0 4/4 · probe-v 15/15 (RED-first 13/15 on F18.58) · selftest 10/10 · verifier PASS
  0 new egress, FREEZE 2 regions. F18.58 = Batch T (queue 7). Batch S landed 2026-09-01 (P-BUYER pass 1 fixes S1–S12: audit-CSV identity +
  calibration scale, license field, components-sum-to-totals, one quantity on client paper,
  cost labels, landing data-safety trio, provenance legend, banner self-filename decoded,
  elastic name chip, Hide control, proposal caption, cdp.mjs popup awareness) **+ D-26.3**
  (Ctrl+Z from a money cell routes to the journal; drafted cell reverts the draft, named —
  closes the D-25.2a silence that R5's caret-walk restoration exposed; w2p 143/143 RESTORED).
  Batch R landed same day (F18.56: D-26.1 pitch one-convention, engine-only general lines,
  validated money ingress, loud render failures, D-26.2). Gates at F18.57 land: G0 4/4 · w2s
  147/147 · w2p 143/143 · w211 · w2j · w2e · w2q 95/95 · w2r 177/177 · print-pdf · smoke ·
  verifier PASS 0 new egress.
- Wave 2 (buyer's-eyes loop) is mid-flight and **cannot ship yet**: it owes the remaining persona
  passes. Eight build batches (E·G·H·J·F·M·N·O) plus P and Q are LANDED and gated:
  G=F18.46 client paper · H=F18.47 honest faces · J=F18.48/49 print-latch P0 · F=F18.50
  interaction safety · M=F18.51 typed-door scoping · N=F18.52 endgame items · O=F18.53 honest
  faces 2 · P=F18.54 undo-truth (141/141) · Q=F18.55 guarded doors + autosave-deletion fix.
- Persona record: pass 2 killed 11/22 pass-1 findings but the wave's own Batch F opened two P0s
  (typed-qty buffer committed $215B invisibly; undo deleted traced measurements) — both DEAD by
  pass 3 (12/15, 0 alive). P-FRESH done: discoverability HOLDS; its P0 (doc-open guard) + 2 HIGH
  closed by Batch Q.

## Queue (in order)

1. ✅ **P-CODE** pass 1 DONE 2026-09-01 (15 findings: 3 P0 · 3 HIGH · 6 MED · 3 LOW; zero-egress
   positively verified at code level). All BUILD-scored rows fixed in **Batch R** same day.
   Parked: C-R1 (resolve fan-out perf — needs real ms before any money-path memoization) ·
   C-R2 (25KB build-log line) · C-R3 (persistent banner for the R3 drop notice — toast-only
   today) · H-R1 (bidi.mjs async-evaluate gap; worked around in-probe as `evalAsync`) ·
   MED-3 (MAP.md/mapgen regen — CC task, in flight).
2. ✅ **P-BUYER** pass 1 DONE 2026-09-01 on F18.56 (16 findings: 1 P0 · 4 HIGH · 6 MED · 5 LOW;
   seller side verified the wave's spine — cent-exact bid, identity guard, internal/external
   separation, nothing-bids-at-zero). Triage in LEDGER §"P-BUYER PASS 1 TRIAGE".
3. ✅ **B-01 forensics DONE: REFUTED-environmental** — the proposal renders in full both engines;
   it emits into its own window (by design, off the latch, D-24.9b standing) and the persona's
   driver photographs only the first window. Buyer's own bytes prove it (1,205-byte untouched-
   latch fingerprint). Fallout: H-S1 (cdp.mjs popup-target awareness) + B-15 caption amendment.
4. ✅ **Batch S LANDED — F18.57** (S1–S12 + D-26.3; w2s 147/147, w2p 143/143 RESTORED after the
   D-25.2a silence was root-caused to R5's caret-walk restoration; full gate stack green; CI
   green on `476ad0c`). CANDIDAtes parked: C-S1 · C-S2 · C-S3 · **C-S4** narrow-width toolbar
   overlay (happens with NO name; design call) · per-line cost-sheet pennies (with B-16).
5. ✅ **Phase 4 release repackage DONE** (historical) — the release folder was never public and is not at HEAD
   (`.gitignore` keeps `release/*` except the synthetic demo); the public README defers to the in-app stamp.
6. ✅ **P-CODE pass 2 DONE** — 9/15 DEAD by the finder (all P0 mechanisms), R1/R2/R3/R5 DEAD,
   zero-egress re-proven; ALIVE = the four ruled parks. **But 1 new P0 + 1 new HIGH, both
   created by wave fixes** (NEW-1: bid Qty×Unit≠Amount by the waste factor, S4's own class;
   NEW-2: qty-linked labor prices FLAT on a pitched library source — engine money). Triage +
   D-26.4 in LEDGER.
7. ✅ **Batch T LANDED — F18.58** (T1 D-26.4 derived rate, Amount pinned, ONE cell changed ·
   T2 qty-link pitch truth · T3 qty_expr drop + caps · T4 persistent drop banner, C-R3 closed ·
   T5 apportionCents enforcement; w2t 131/131 RED-first, full stack green). New parks: N-R1
   (rate precision 2 vs 4 decimals — owner presentation lane) · T-Q1 (unify printBidDoc's
   inline F5 walk onto the hardened helper, LOW).
8. ✅ **P-CODE pass 3 DONE — 7/7 DEAD** (NEW-1/2/4/5/7 + both residues; egress re-proven).
   4 new rows (1 HIGH: the Unlink freeze writes flat + two false comments assert it safe;
   1 MED: conditions/measurements arrays unvalidated at the door; 2 LOW). Triage in LEDGER.
9. **Batch U — STOPPED MID-DEVELOPMENT 2026-09-01 (operator interrupt; agent killed cleanly,
   src untouched at F18.58).** COLD PICKUP: charter = LEDGER.md §Open items (U1 freeze truth + both false-comment corrections · ✅ U2 landed in Batch V ·
   U3 apportionCents total guard · U4 bid walk unified, cent-identical or stop). The pass-3 findings file and the
   partial Batch U scratch were never pushed; U1/U3/U4 restart from the charter text with fresh red-first probes. Then **P-CODE pass 4** (scoped) → **P-BUYER
   pass 2** on the final build → GTM_BAR reconciliation → WAVE2_CLOSEOUT; release re-cut at the
   wave-close build.
   Wave then closes pending the owner's set: F1 · N5 · N6 · D-24.7b headed bench · C-S4 · N-R1.
10. ✅ **Batch V LANDED — F18.59** (see State). Open from it, all Patrick's: (a) ✅ **history ruling: fresh root**
   (2026-09-01) — `main` restarted from a single root carrying the F18.59 tree; the earlier public commits are
   unreachable from any branch, but **`refs/tags/f18.55` is still on the remote** (a seat cannot delete a remote ref;
   Patrick runs `git push origin --delete f18.55`); GitHub may serve old SHAs until its cache clears — a support
   request purges that; (b) **freeze
   manifest** — `--write-manifest` on a build he accepts; (c) **GitHub Pages** serves `src/VES_PM.html` publicly
   (sweep F-01) — keep and say so, or disable; (d) N-R1 rate precision (numbers in sweep F-04); (e) ✅ the structural
   split and the short-viewport recap panel landed in **Batch W (F18.60)** once the no-local-seat ruling removed
   their only blocker.
11. **Field lane charter — `FIELD_LANE.md`** (owner-approved in principle 2026-09-01, interior lane included):
   import door for reports and room scans → Field lens → field delta → laser input → private host. Each item
   ships red-first with its own probe under `tools/sweep/`, G0 absolute, typed quantities OBS.
12. Wave ends when a full 4-persona pass yields zero new P0/HIGH **and** the bar rows close. The w2* persona
   probes and GTM_BAR were never pushed; if they still exist anywhere they are re-created here, synthetic, under
   `tools/sweep/` and `LEDGER.md` — otherwise the sweep probes are the stack and `LEDGER.md` is the bar.

**Owner's blocking set (his calls, not buildable):** N5 · N6 · D-24.7b general print-latch
release (needs a HEADED Chrome+Firefox bench — the one open leak-class hole) · F1 price/license.

**Open CANDIDATEs (design calls, none built):** F-C1 exports dropdown covers live money cells
(highest-value open interaction item) · F-C2 `placeKeyedRect` arms outside the D-24.5c gesture
set · W2M-C3 1–9 arm from inside a lens · T-K3 completed proposal leaves the latch loaded ·
C-K1 `#recapClientBtn` label/binding · C-H1/C-H2/C-H3 · T-3 · T-5 · C-O1/C-O2.

**Pre-wave open:** F2 = 39 placeholder library quotes + CRS freight window · roadmap L-17..L-20,
L-23, L-24 (+M-10 schedule), G1-7 LOCKED-PICKS, L-25, L-14 repro · M-7 lump-sum-by-scope bid
option.

## Method rails (standing; do not regress)

- A seat applies exact anchored edits to `src/VES_PM.html` (anchor count asserted, never a regex over the file),
  gates, commits, and pushes — push is the save; `main` is the line that moves forward.
- Every new gate is proven RED on unpatched src first. Every commit: G0 GREEN + the batch's
  probe GREEN; UI/print claims need real pointer / rendered bytes, both engines where stated.
- Money paths: G0 goldens are absolute — a patch that moves them is wrong.
- **Triage rubric for persona findings:** (a) money-honesty (surfaces disagree, silent $ change,
  margin leak) → P0/HIGH, fix this wave · (b) backed by a written bar row or D-ruling → severity
  per the bar · (c) taste/design with no bar row → CANDIDATE, park, don't build · (d) contradicts
  a recorded ruling → don't build, record the tension. A finding closes only by the filing
  persona's re-run seeing it dead, or REFUTED-with-evidence.
- No self-declared PASS; acceptance is the owner's word alone. No time estimates.

## Carried lessons (paid for; keep)

1. **Probes asserted what a document CONTAINS; none asserted what the NEXT print emits.**
   Whole-session state, not per-artifact state, was the gate blindspot behind the print-latch P0.
2. **A rule naming a surface is not a rule stating a principle.** "Buffer in the banner" shipped
   a silent global keystroke sink everywhere the banner wasn't visible. Name the principle.
3. **An agent flagging a money door scores (a) by default.** F-C3 was parked as a CANDIDATE and
   the persona then found it at $215 billion.
4. **Personas report what they SAW, never a mechanism.** Nine findings had real observations
   under wrong stated causes; four repro lanes chased mis-titles.
5. Harness: `normalizeUrl()` lives in `cdp.mjs`+`bidi.mjs` — 24 of 38 entry points once loaded
   nothing on a relative path and read as product breaks. Failure-path code must be tested by
   success, too.

## Seat notes

- There is no local seat (ruled 2026-09-01). Verifier + selftest run anywhere; G0 and the probe gate run wherever a
  Chromium exists (`VES_CHROME=…`; the Claude cloud VM ships one at `/opt/pw-browsers/chromium-*/chrome-linux/chrome`)
  and in CI on every push (`verify`, `gate`, `probes` jobs). Fixtures are synthetic and live in `release/demo/` and
  `tools/sweep/mkpdf.mjs`; the register is `LEDGER.md`. Client material never enters the repo and has no other home.
- Public docs carry no client names, projects, addresses, or job dollar figures (CLAUDE.md rule).
