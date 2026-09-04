# READINESS_ad07fff — HEAD against the trust bar, from bytes

Review under the directive "VES readiness review: directive to the cloud seat" (2026-09-04). Subordinate to
`CLAUDE.md`. This file records evidence for the owner's ruling; it gates nothing, closes nothing, lands nothing.
No product byte, `LICENSE`, `README.md` or landing copy was edited. Every claim carries one of three tags:

- **OBS** — read from bytes or from a run on this seat; the raw output is inline.
- **INF** — inferred from OBS; the inference is stated so it can be refused.
- **null** — not observable on this seat (no Firefox, no headed browser, no owner). Not projected.

Findings and proposals are kept apart: §§1–7 hold findings; §8 alone holds proposals, each as one sentence
the owner can accept or refuse. Fixtures are synthetic (`release/demo/demo-flat-roof.json`,
`tools/sweep/mkpdf.mjs`); identity strings used on paper are `Synthetic Roofing LLC · A. Estimator · License SYN-0000`.

---

## Identity (OBS, from bytes, this seat, 2026-09-04)

```
$ git rev-parse HEAD
ad07fffb1076d8a0ff478ef1df37174f09466919
$ git log --oneline -1
ad07fff Batch AD — F18.66: the estimate still computes in Excel, and the small things are remembered
$ wc -c src/VES_PM.html
3560089 src/VES_PM.html
$ sha256sum src/VES_PM.html
95bfbfd0ac0e3fbde8f0906ad7aa3bf537fcba7d7718f8f5aa4c9960e78ed998  src/VES_PM.html
```

HEAD has not moved from the record in `CLAUDE.md` §Identity (F18.66 · 3,560,089 bytes · `95bfbfd0…`). The
in-app stamp reads `F18.66` (probe-v V0 below). CI on `main` for this sha: workflow `verify` run
`33627096601`, `conclusion: success`, 2026-09-02T11:55Z (GitHub Actions API; the three jobs `verify`, `gate`,
`probes`). A GitHub Pages deployment also ran for this sha (run `33627094772`) — sweep F-01, not part of this
review, noted because it exists.

### The three gates, run on this seat (OBS)

```
$ node --version
v22.22.2
$ node tools/ves-verify.mjs
IDENTITY 3560089 bytes sha256 95bfbfd0ac0e3fbde8f0906ad7aa3bf537fcba7d7718f8f5aa4c9960e78ed998
SYNTAX   20 blocks checked, 2 skipped, 0 failed
EGRESS   7 matches; baseline 7 entries; 0 new, 0 gone
FREEZE   2 regions; manifest absent; 0 mismatched, 0 missing
RESULT   PASS
exit=0

$ /opt/pw-browsers/chromium-1194/chrome-linux/chrome --version
Chromium 141.0.7390.37
$ VES_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node gate/g0.mjs check src/VES_PM.html
  ✓ A == goldenA (assembly money path)
  ✓ B == goldenB (sell-ladder + R3)
  ✓ C == goldenA (save/reload inert)
  ✓ D == goldenA (schedule inert)
G0 GREEN
exit=0

$ node tools/sweep/mkpdf.mjs $S/plan.pdf            → wrote … 49974 bytes   sha256 288f28e90d6643e7…
$ node tools/sweep/mkpdf.mjs $S/plan-dense.pdf 40000 → wrote … 1284543 bytes sha256 b54546fd2cfb5090…
$ node tools/sweep/probe-v.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" $S/plan.pdf "$PWD"
PASS V0 build stamp equals the build CLAUDE.md declares  {"stamp":"F18.66","declared":"F18.66"}
PASS V1 landing data-safety sentence names autosaved takeoffs
PASS V2 control: demo sell on desktop is 64620.46  64620.46
PASS V3a ingress: a string quantity is DROPPED, never priced as zero …  {"sell":0,…,"meas":0,"unitCost":null}
PASS V3b ingress: the drop is said in the load toast AND a standing banner
PASS V3c ingress: a string unitCost / pitch does not survive into state  {"unitCost":null}
PASS V4 proposal legend swatch colors survive printing WITHOUT background graphics  ["1.00,0.36,0.23",…,"0.69,0.49,0.85",…]
PASS V5 phone at rest: the sheet column is at least 300 px wide  {"coarse":true,"railOpen":false,"wrapW":354,"reopenVisible":true}
PASS V5b phone at rest: the rail is one tap away (reopen control visible)
PASS V6 phone: 200% zoom raster capped at 16 MP on a coarse pointer  {"mp":16,"ms":100}
PASS V7 coarse pointer: estimate-grid money cells are at least 40 px tall  {"n":51,"min":40}
PASS V8 coarse pointer: exports-menu items are at least 40 px tall  {"min":40,"n":15,"fits":false}
PASS V9 landscape phone: exports menu stays inside the viewport  {"top":81,"bottom":378,"innerHeight":390,"scrolls":"auto","fits":true}
PASS V12 landscape phone: the summoned recap panel sits inside the viewport …  {…,"documentButtons":3,"closedByOwnControl":true}
PASS V10 verifier sees two freeze regions (core + engine) fenced  {"regions":2,"manifest":"absent","mismatches":[],"missing":[]}
PASS V11 verifier RESULT PASS with 0 new egress  {"ok":true,"added":0}
PASS V13 the application is split into named module blocks …  {"checked":20,"names":["pdfjs","core",…,"boot"]}

probe-v: 17/17 passed, 0 failed
exit=0
```

FREEZE reports "manifest absent"; it gates nothing until the owner writes it (unchanged from the record).

---

## §0 Two rulings recorded against the register (not closed, not reworded)

- **R-1 (owner, in chat).** VES will not be sold; donations are accepted; the price half of F1 is ruled: there is
  no price. Recorded here against **LEDGER M-07** (README/landing "copy the file to any machine" vs LICENSE granting
  no right to copy) and **LEDGER M-10** (price-creep row: no pricing text exists). Both rows stay as written; closure
  is the owner's act.
- **R-2 (INF from R-1; owner to confirm).** A donated tool is used by people other than its author. `LICENSE` at
  HEAD grants no right to use (§5 quotes it verbatim). Under R-1 that clause contradicts the model. The extent of any
  grant is not ruled; §8 states what the owner gains under each extent and stops. No license text is drafted here.

---

## §1 Money truth

**Method (OBS).** Headless Chromium 141 over raw CDP, `file://`, 1440×900, the app's own functions only. Two states:
(a) the synthetic demo loaded through `loadFromData`; (b) a takeoff built cold on the seat: `mkpdf.mjs` plan opened
via `openFromBytes`, scale typed `1/8"=1'`, the TPO assembly loaded, a 4-click polygon traced on the field
condition and a 2-click line on the drip edge through the overlay's own click handlers, ladder 10/8/5, identity set.
`saveBlob` was intercepted in-page so every export's bytes were read instead of downloaded; `window.print` was
stubbed so the print latch could be read. Every face was reduced to integer cents and compared with
`recapModel().sell`. Exports were parsed from bytes (CSV text; XLSX unzipped, `<v>` and `<f>` read per cell).

### Result: every face agrees to the cent, on both takeoffs (OBS)

```
== demo: engine sell 6462046 cents (64620.45928800001), cost 5180412, lines 22, ladder 0.1/0.08/0.05
   SAME HUD Sell: 6462046  text $64,620.46
   SAME Estimate grid footer Sell: 6462046  Material+Labor[+Equipment]+O&P = 6462046; cost faces = 5180412 vs engine cost 5180412; Σ round(row totals) 5180412 over 22 rows
   SAME Recap summary Sell: 6462046  Cost + ladder rows as printed = 6462045
   SAME Money peek Σ conditions + fixed allowances: 6462046  fixed allowances 3538375
   SAME Bid Total (client paper): 6462046  Σ amounts 6462046; Σ subtotals 6462046; 20 rows; qty×unit−amount residual (cents) [0,-2,0,2,5,-6,0,72,1,-1,-583,910,1292,-53,0,0,0,0,0,0]; margin words false; Prepared by true; License true; Sheet column true
   SAME Proposal (last money figure in the body): 6462046  proposalModel sell 6462046; monies [6462046]; invest table false; margin words false; swatches 0; plan image false
   SAME Cost sheet Total sell (internal): 6462046  Cost+OH+MU+PR as printed = 6462046; Mat+Lab[+Eq] = 5180412 vs printed Cost 5180412; divisions [{"lines":22,"lineSell":1418615,"subSell":6462046,"lineCost":5180412,"subCost":5180412,"subLadder":6462046}]
   SAME Estimate CSV Sell: 6462046  Σ rows 5180412 vs Cost 5180412; Cost+OH+MU+PR 6462046
   SAME Estimate .xlsx Sell (cached value): 6462046  22 line rows, 22 with D*F formulas, recalc mismatches 0; Σ lines 5180412 vs Cost 5180412; ladder recalculated 6462046
   SAME Client review .xlsx Total (cached value): 6462046  Lines Total 6462046 (formula H22); Σ line amounts 6462046 over 20 rows; margin words false
   n/a  Audit CSV: no sell figure on this face by design; 2 measurement rows, 0 extended-cost cells, identity rows ["Project,Demo — Flat Roof Sample","Exported,2026-09-04T04:17:20.720Z","Prepared by,A. Estimator · Synthetic Roofing LLC · License SYN-0000"]
   audit qty mismatches vs state: 0   rows [{"id":11,"qty":3150.8,"cal":"manual entry"},{"id":12,"qty":240,"cal":"manual entry"}]

== cold: engine sell 12255664 cents (122556.64085279999), cost 9824967, lines 22, ladder 0.1/0.08/0.05
   setup {"meas":[{"type":"area","value":10842.48,"pts":4},{"type":"linear","value":111,"pts":2}],"conds":10,"cal":"1/8\"=1'"}
   SAME HUD Sell: 12255664  text $122,556.64
   SAME Estimate grid footer Sell: 12255664  Material+Labor[+Equipment]+O&P = 12255664; cost faces = 9824967 vs engine cost 9824967; Σ round(row totals) 9824967 over 22 rows
   SAME Recap summary Sell: 12255664  Cost + ladder rows as printed = 12255664
   SAME Money peek Σ conditions + fixed allowances: 12255664  fixed allowances 3538375
   SAME Bid Total (client paper): 12255664  Σ amounts 12255664; Σ subtotals 12255664; 20 rows; qty×unit−amount residual (cents) [0,-7,0,2,5,-6,0,33,1,-1,-2006,3133,4445,-24,0,0,0,0,0,0]; margin words false; Prepared by true; License true; Sheet column true
   SAME Proposal (last money figure in the body): 12255664  proposalModel sell 12255664; monies [12255664]; margin words false; swatches 2; plan image true
   SAME Cost sheet Total sell (internal): 12255664  Cost+OH+MU+PR as printed = 12255664; Mat+Lab[+Eq] = 9824967 vs printed Cost 9824967; divisions [{"lines":22,"lineSell":1418615,"subSell":12255664,"lineCost":9824967,"subCost":9824967,"subLadder":12255664}]
   SAME Estimate CSV Sell: 12255664  Σ rows 9824967 vs Cost 9824967; Cost+OH+MU+PR 12255664
   SAME Estimate .xlsx Sell (cached value): 12255664  22 line rows, 22 with D*F formulas, recalc mismatches 0; Σ lines 9824967 vs Cost 9824967; ladder recalculated 12255664
   SAME Client review .xlsx Total (cached value): 12255664  Lines Total 12255664 (formula H22); Σ line amounts 12255664 over 20 rows; margin words false
   n/a  Audit CSV: 2 measurement rows, 0 extended-cost cells; identity rows carry project, export time, prepared-by; qty mismatches vs state 0
```

Notes on the row above marked `lineSell 1418615` (OBS): the cost sheet prints each line's Sell rounded, and the
sum of those printed line Sells is $14,186.15 against a division subtotal of $64,620.46 — this is not a
discrepancy: the cost sheet's per-line Sell column is `sellOf(l.cost).sell` per line and the subtotal is pinned to
round(Σ exact); the 20 printed lines' cells were read in the wrong column by the harness for that one field
(`sellIdx` landed on Profit for rows with an OH column). The three subtotal identities that matter were read
correctly: `subLadder == subSell` (Cost+OH+Markup+Profit = Sell on the subtotal row) and `lineCost == subCost`
on both takeoffs. The two takeoffs in §1 and §3 are different traces (snap caught different geometry at 1440 vs
1920 wide); within each run all faces agree.

### What a G0 golden already proves, and what no golden covers (OBS on `gate/`)

- Covered by G0: the engine's `recapModel()` money and every resolved line (`resolveAssembly().lines`) on scenario
  A (SSMR, typed 3,150.8 SF, ladder 10/8/5), scenario B (one manual line, ladder pin), C (snapshot → JSON →
  `loadFromData` inert), D (schedule inert). `gate/README.md` contract; `goldens/fingerprints.json`.
- Covered by no golden: every face *downstream* of the engine — HUD, grid footer, recap panel, money peek, bid,
  proposal, cost sheet, both CSVs, both XLSX. probe-ab/ad/z/y assert some of them against `recapModel` on the demo
  (client XLSX total, CSV ladder, peek sum, repaint timing) but none is a frozen golden and none covers the bid's
  printed rows or the cost sheet's printed cells. This review's run above is the first record of all twelve faces
  on one HEAD; it is a run, not a golden.
- `tools/sweep/ladder-fuzz.mjs` (OBS, this seat, 2.8 s):

```
{"trials": 2000000, "bidVsRecapCentMismatch": 0, "pctRoundTripCentMismatch": 0, "examples": []}
```

### One on-screen face does not add up to itself (OBS)

The recap panel's ladder on the demo prints `Cost $51,804.12 · Overhead $5,180.41 · Markup $4,558.76 · Profit
$3,077.16 · Sell $64,620.46`; the four rows above Sell sum to **$64,620.45**. The Sell figure is right; the
rows are each `round(exact)` with no apportionment (`renderRecapSummary`, `src/VES_PM.html:9241–9262`). The cost
sheet, the estimate CSV and the estimate grid footer were given apportionment for exactly this (S3, AB-3); the
recap panel was not. On the cold takeoff the rows happened to sum exactly. Screen face, not paper.

### N-R1 is alive and quantified on HEAD (OBS)

On the bid, `Qty × Unit price` differs from `Amount` on the three labor rows priced per SF because the printed rate
is rounded to cents (D-26.4 derived rate). Worst rows:

```
demo: "TPO Membrane — labor"  3,150.8 SF × $4.37 = $13,769.00  printed Amount $13,756.08  (+$12.92, +0.094%)
cold: "TPO Membrane — labor" 10,842.48 SF × $4.37 = $47,381.64  printed Amount $47,337.19  (+$44.45, +0.094%)
```

Amounts, subtotals and the Total are exact; the basis note under the Total names the rounding. A client who
multiplies that row lands $44.45 high on a $122,556.64 bid. LEDGER row N-R1 (owner's lane) stands; §7 triages it.

### U3 — apportionCents total guard (OBS + INF)

`apportionCents` (`src/VES_PM.html:8515`) lifted verbatim from the bytes and fuzzed on this seat:

```
{"apportion": {"trials": 500000, "sumMismatch": 0, "nonFiniteLeak": 0, "offByMoreThanOneCentNonLargest": 0,
  "samples": [
   {"badTotal":"NaN",       "parts":[1234.56,78.9,10], "result":[-8882,7886,996], "sum":0},
   {"badTotal":"undefined", "parts":[1234.56,78.9,10], "result":[-8882,7886,996], "sum":0},
   {"badTotal":"null",      "parts":[1234.56,78.9,10], "result":[-8882,7886,996], "sum":0},
   {"badTotal":"Infinity",  "parts":[1234.56,78.9,10], "result":[null,7894,1004], "sum":null},
   {"badTotal":"abc",       "parts":[1234.56,78.9,10], "result":[-8882,7886,996], "sum":0}]}}
```

- OBS: with finite parts and a finite total the contract holds on 500,000 random inputs (sum exact, non-finite parts
  excluded as `null`, no non-largest part more than one cent off).
- OBS: a non-finite or missing **total** is coerced to 0 (`(+total || 0)`), and the walk then drives the parts to
  sum to zero — a $1,234.56 part is printed as −$88.82. That is the "total guard" U3 names: the function trusts its
  total.
- INF, reachability: the five callers (`:9386` estimate CSV ladder, `:9516` grid footer, `:10770` and `:10795–10796`
  cost sheet) pass totals built from `Math.round(money*100)` differences of engine sums; the engine gates
  non-finite line money (`:3022` "a negative qty would subtract money — gate it") and `bidCollect` clamps
  percentages with `Math.max(0, +S.x || 0)`. No UI path found on HEAD that hands `apportionCents` a non-finite total.
  **Not reproducible from the UI on this seat.** The guard's absence is a latent contract gap, not a reachable wrong
  number.

### U4 — printBidDoc's inline F5 walk (OBS + INF)

Since AB-1 (F18.65) the bid and the client XLSX both read one helper, `bidCents` (`:10626`), whose walk is still a
second implementation beside `apportionCents`. Lifted and fuzzed against each other:

```
{"bid": {"trials": 300000, "residualLeft": 0, "notEqualApportion": 0, "maxAbsD": 4}}
```

- OBS: on 300,000 random line sets (1–40 lines, ladders 0–29%) `bidCents` leaves no residual and returns exactly what
  `apportionCents` returns on the same amounts.
- INF: `bidCents` lacks `apportionCents`'s terminal `if (d !== 0) c[order[0]] += d`; its loop bound is `4 × n` steps
  and the starting residual is at most `n/2 + 0.5` cents (each rounded amount is within half a cent of exact), so
  the bound cannot be hit for n ≥ 1. The observed maximum residual was 4 cents. **Cannot put a wrong number on
  paper on HEAD**; the bytes still carry two apportioning implementations (unification is the LEDGER U4 charter,
  after-list in §8).

---

## §2 Loss

**Method (OBS).** Same Chromium, `file://`, a persistent user-data-dir so `localStorage` survives relaunch; real
`Page.reload`, real target close, real `SIGKILL` of the browser process; the JSON door driven through the real
`<input type=file>` with `DOM.setFileInputFiles`.

### Autosave keying under file:// (OBS)

```
after a traced line on the synthetic plan:   localStorage keys {"ves:auto:392968b0": 4080 bytes, "ves:prefs": 17}
identity: {"pdfName":"synthetic-plan.pdf","fileSize":0,"numPages":1,"docFingerprint":"47775f62efd7701db261b5149cd8a18a","pageSignatures":["691ce58c"]}
autosaveKey() = "ves:auto:392968b0"            (fnv1a of fileSize|numPages|docFingerprint — VESCore.identityKey)
grid takeoff, unnamed:  key "ves:auto:grid"
grid takeoff, renamed "Grid Job Alpha": key "ves:auto:grid:grid-job-alpha"; the unnamed slot was superseded (removed) after the named write landed
```

Keying is by PDF document identity, not by path, so the same PDF opened from any folder finds its slot (INF). The
seat's harness opened the PDF from bytes (`fileSize 0` both times); a picker open carries the real size — same
key across sessions as long as the same file is picked (INF, not measured here).

### Tab close mid-edit (OBS)

An edit (`addManualQuantity`) inside the 700 ms debounce, then the tab target closed via CDP:

```
before close: stored measurements 0 → state 2       after reopening the file: stored 2, savedAt 2026-09-04T04:03:11.649Z
```

`pagehide` flushes (`src/VES_PM.html:11543`); the edit survived. What the stranger sees on return: the landing's
"Pick up where you left off" card for a grid takeoff (one click restores), or for a PDF takeoff a card reading
`synthetic-plan.pdf · 1 meas · needs synthetic-plan.pdf` — the document must be opened again, then the banner
`Found autosaved work for this PDF (1 measurement(s), 2026-09-04 04:03:06). [Restore] [Discard]` offers it.

### Browser killed mid-edit — two results (OBS), one inference

```
profile with many writes in the preceding seconds (door tests), then localStorage.clear(), a new PDF slot written twice (stored 1 → 2), SIGKILL <1 s later:
   after relaunch: stored null; the resume list shows the slot that clear() had removed
fresh profile, one grid slot written, SIGKILL after 500 / 3000 / 8000 / 15000 ms:
   after relaunch: stored 1 in all four runs ("● autosaved" dot was lit before the kill in each)
```

INF: Chromium batches `localStorage` commits to disk under write pressure; the app's "● autosaved" dot reports the
in-memory write (`flushAutosave`, `:11326`), not the disk. On a crash or power loss the last seconds of autosave may
not exist; the JSON Save is the durable path and the landing already says autosaves "live in this browser".

### Reload during a trace (OBS)

```
before: polygon draft with 3 points, live readout "5421.2 SF", 1 finished measurement
after Page.reload: pdf false, measurements 0, draft null; landing visible; resume card "synthetic-plan.pdf · 1 meas · needs synthetic-plan.pdf"
after re-opening the same PDF: banner "Found autosaved work for this PDF (1 measurement(s), …)" → Restore → measurements 1, values [111], sell 29254
```

The unfinished draft is lost (not serialized; `snapshot()` carries `measurements`, not `state.draft`). The finished
measurement survives via the slot. The stranger sees the landing, not the sheet, and must re-open the PDF by hand.

### Reload during a drag (OBS)

```
line measured at 111 ft; grip pressed and moved 120 css px without release → state.grip armed, gripDrag live, m.value now 147, points[1].x 1622.7
Page.reload during the drag → re-open PDF → Restore: measurements 1, value 147, points[1].x 1622.7
```

The mid-drag geometry was committed by the `pagehide` flush and restored as the measurement's new shape; the
pre-drag 111 ft is gone and the journal does not survive a load (`journalReset()` in `applySnapshot`). A reload
mid-gesture silently finishes the gesture at the pointer's last position.

### The file door, clean session per fixture, through the real `<input type=file>` (OBS)

```
corrupt (demo truncated at 60%):  toast "Not valid JSON: Unterminated string in JSON at position 3642 (line 177 column 25)"; state untouched (0/0, sell 0); landing stays
foreign ({app:'Other',…}):        toast "Not a VES takeoff file."; state untouched
demo as shipped (version 3, no `library` block — the pre-F18.65 shape):  toast "Takeoff loaded."; no banner; 2 measurements, 10 conditions, sell 64620.46
v2-shape (version 2, no assemblyProject/panes/view/viz/schedule):        toast "Takeoff loaded."; no banner; sell 51804.12  (= cost: no ladder in the file)
v4 (version 4):                   toast "This takeoff is version 4, newer than this build understands (3). Refusing to guess at it — open it in the build that wrote it."; state untouched
vstring (version "3", a string):  toast "Takeoff loaded."; sell 64620.46 (the version check tests typeof number; a string version is treated as unversioned)
otherlib (library {name:"Someone else’s book", fingerprint:"deadbeef"}):  toast "Takeoff loaded."; banner "This takeoff was last priced with the library “Someone else’s book” (deadbeef); this browser prices with “Roofing & Envelope — Coastal SE Georgia” (7e4e6a2a). Figures can differ from the file’s last save — check the Estimate grid before you bid."
stringqty (one measurement value as "3150.8"):  toast "Takeoff loaded — 1 value in this file could not be priced and was DROPPED, not applied (1 measurement with a quantity or points the engine cannot read). Re-check…"; standing banner "This takeoff was changed on the way in — …"
```

- OBS: a takeoff saved by an F18.5x build (no `library` block) loads with `Takeoff loaded.` and no library banner:
  AB-2's mismatch check runs only when the file names a library (`applySnapshot`, `:10268–10273`). INF: such a file
  re-prices silently under whatever book this browser holds — the T-02 class, for every file written before F18.65.
- OBS: a file with no ladder (`v2-shape`) prints a bid whose Total equals cost; nothing on the bid says the
  markup is 0% (the recap panel shows "— set above"; the cost sheet's ladder rows print at 0.0%).
- OBS: the door refuses what it cannot parse or cannot version, and says so in a toast only; the landing stays.

### U1 — the Unlink freeze writes flat (OBS, reproduced from the UI)

LEDGER U1 (HIGH): "Unlink freeze writes flat + two false comments assert it safe." Reproduction on HEAD, every step
through the UI's own controls (SSMR assembly, 1,000 SF typed on the field, ladder 10/8/5):

```
pitch set on the field card's ✎ editor to 6/12          → setConditionPitch('ssmr.field','6/12') = 1.118033988749895 (store B, conditionOverrides)
rollup of the field: raw 1000, displayed (dispQtyOf) 1118.033988749895
Estimate lens → "＋ labor" on the Standing Seam Panel row → entry row prefilled qty "1119", qty input disabled, chip "⛓ follows Standing Seam Panel ✕" → $2.50 → ✓ Add
   linked labor line: measurement.value 1119, engine qty 1118.033988749895, extended $2,795.08, HUD $80,506.89, recap sell 80506.8928
Plan lens → labor card ✎ → button "Unlink" (title: "Break the link — the current quantity freezes and becomes yours to edit.")
   after Unlink: measurement.value 1000, engine qty 1000, extended $2,500.00, HUD $80,138.80, recap sell 80138.8038
delta: sell −$368.09 (−0.46% of this fixture; −10.56% of the unlinked line); toast still reads the earlier "“Standing Seam Panel — labor” added under …"; no banner
Ctrl+Z after Unlink: journal depth 1 (only "add line"); undo removes the whole labor line (sell → 77020.30); the link is not restored
```

- OBS: the Unlink handler (`:7477–7486`) writes `own.value = sr.quantity` where `sr` is `VESCore.rollup` of the
  source — store A only; the pitched quantity the line was priced on is store B (`condPitchFactor`). The frozen copy
  is the flat 1,000, not the 1,118.03 the button's title promises to keep. The computed `frozen` rollup is
  discarded (`void frozen`).
- OBS, the two statements that assert safety: the comment at `:7983–7984` ("the Unlink FREEZE at :Qty link, which
  writes a MEASUREMENT the engine pitches again" — the adhoc labor condition carries no pitch, so the engine prices it
  flat) and the control text at `:7478` / `:9482` ("the current quantity freezes" / "keep a frozen copy").
- INF: reachable in three gestures from the Estimate lens; the money change is silent (no toast, no banner, no
  journal entry); it lands on every face and every paper thereafter as a truthful-looking number. Only a library
  source with a pitch override is affected; a flat source or a plain condition is not (factor 1). Three quantities
  for one line are shown along the way (1,119 in the entry row, 1,118.03 in the engine, 1,000 after Unlink).

---

## §3 Paper

**Method (OBS).** `Page.printToPDF` (Chromium 141, `preferCSSPageSize`, background graphics off unless stated) on
the app page after each print door wrote the latch; the proposal printed from its own document (written to a file
and opened as `file://`, because a 2 MB `data:` URL rendered blank — a harness limit, not the product's). UI scale
set through `setUiScale` at 1920×1080 so the 150% step is in range (`uiScaleBounds`: <600 px caps at 115%, <900 px at
130%). Page counts from the PDF's `/Count`; fill colours from the decompressed content streams (probe-v V4's method).

```
print zoom rule present true      (@media print { html { zoom: 1 !important } } — src/VES_PM.html:770)
== demo (identity set: company, name, license, phone, email, client, address)
  bid  @100% pages 1 bytes 131789 mediaBox [612,792] total $64,620.46 preparedBy true license true client true acceptance true marginWords false
  bid  @115% pages 1 bytes 131789 …  bid @130% pages 1 …  bid @150% pages 1 …  bid @90% pages 1 bytes 131789   (byte-identical at every scale)
  cost @100% pages 1 bytes 154062 total $64,620.46 INTERNAL true ladder true   (identical at 115/130/150/90)
  proposal (own document): swatches 0, images 0 (typed quantities — no plan snapshot), preparedBy true, license true, marginWords false
    bg OFF: pages 1 bytes 58665   bg ON: pages 1 bytes 66107
== cold (traced plan, identity set)
  bid  @100% pages 1 bytes 131580 total $122,674.20 preparedBy true license true client true acceptance true marginWords false   (identical at 115/130/150/90)
  cost @100% pages 1 bytes 153808 total $122,674.20 INTERNAL true ladder true   (identical at every scale)
  proposal (own document): html 1,997,189 bytes; plan snapshot image 2718×1612; 2 legend swatches rgb(255,93,58) / rgb(176,124,216); legend "TPO — membrane field · 10,842.48 SF · TPO — drip edge · 111 LF"; preparedBy true; license true; marginWords false
    bg OFF: pages 2 bytes 1284601 fills ["1.00,0.36,0.23","0.00,0.00,0.00","0.69,0.49,0.85",…]   ← both swatch colours present with background graphics OFF
    bg ON : pages 2 bytes 1294055
sha256 (first 16): paper-demo-bid-100 1cd7f6ae2ba31122 · paper-demo-bid-150 9c105a2a7ac5cfc0 · paper-cold-bid-100 0c576d9c670d07fd · paper-cold-proposal-file-bgoff 73fa6a39e4a84aa8
```

- OBS: pagination does not follow the UI scale (G-01 fix holds); bid and cost sheet are one letter page each on
  both fixtures; the proposal with a plan snapshot is two pages.
- OBS: identity block prints on bid, cost sheet and proposal (company · license · name · phone · email; client and
  address on the head line); the Acceptance block identifies itself with project, client, date.
- OBS: client paper (bid, proposal, client XLSX) carries no Cost / Overhead / Markup / Profit word; the cost sheet
  carries `INTERNAL — margins print on this sheet; not for client distribution.`
- OBS: the bid's `Sheet` column reads `—` on the demo (typed quantities) and `1` on the traced takeoff.
- Print-media screenshots of the three documents were taken and read on this seat (bid: one division table,
  subtotal, Total, basis note, "Not included in this bid" list of eight, Terms, Acceptance with two signature
  lines; cost sheet: Unit $ / Cost / OH / Markup / Profit / Sell columns and the Recap ladder; proposal: header,
  plan snapshot with legend, Scope, Investment, Not included, Terms, footer).
- **Firefox: null.** No Firefox on this seat. D-24.7b (headed bench, Chrome + Firefox) remains the owner's bench.
- **Headed Chrome print dialog: null.** `window.print` was stubbed; the latch's contents were read and printed via
  CDP. The real dialog's behaviour is not observed here.

---

## §4 The cold open

**Method (OBS).** A fresh `git worktree` of HEAD (`sha256 95bfbfd0…`, 3,560,089 bytes, detached at `ad07fff`),
a fresh Chromium profile, `file://`, 1440×900, real pointer input (`Input.dispatchMouseEvent`), the demo JSON picked
through the real file input. No `NOTES.md`, no hotkey knowledge. Screenshots at every step were taken and read.

**What the stranger sees, in the stranger's words, with the screen state:**

1. **Open.** A dark screen; a large amber box across the top of the content reads *"VES wants to be served, not
   double-clicked. Under file:// some browsers block PDF loading — if Open PDF fails, from this folder run
   `python3 -m http.server 8765` and open `localhost:8765/VES_PM.html`."* with a Dismiss button. The heading
   *"Measure a plan, get a priced estimate"* sits half under it. — *"The first thing it tells me is to run a Python
   command. Did I open it wrong?"* (OBS: banner unconditional under `file://`, `:11627–11651`; CANDIDATE C-S3 stands.)
2. **Where is the demo?** The landing text (verbatim in the run) mentions grid squares, Open a PDF, New takeoff,
   "or just enter a priced quantity". Nothing on the landing or in the toolbar names a demo or a sample file. —
   *"It says measure a plan. I don't have a plan. Is there an example?"* The demo exists only as
   `release/demo/demo-flat-roof.json`, named in `README.md`, which the stranger who has only the file never reads.
   **Stall 1.**
3. **Files & exports ▾ → Load takeoff (JSON).** The menu lists 15 items under Project / Documents / Share; "Load
   takeoff (JSON)" is second. The picker opens; the demo is chosen. Toast `Takeoff loaded.` A grey 1 ft grid, ten
   condition cards on the right (two priced: 3,150.8 SF `$21,518.12`; 240'-0" `$1,920.00`), a recap footer `Div 07
   $51,804.12` and `MATERIAL $14,096.00`. The toolbar and money strip have tucked away (sheet-live). — *"Where's
   the total? I see $51,804.12 by 'Div 07' and the cards say $21,518."* (OBS: HUD Sell `$64,620.46` appears at the
   bottom edge only when the pointer reaches it; the recap panel's `$51,804.12` is labelled `RECAP · COST BY CSI`.)
4. **Pointer to the bottom edge.** The strip shows `$64,620.46 $35,383.75 $14,096.00 $37,708.12` and a long toast
   about *"$35,383.75 in fixed allowances at sell … Deliberately narrower than the Rollup CSV's PROJECT-LEVEL
   line…"* — *"Four numbers, one of them is the bid, and a paragraph about a Rollup CSV I haven't seen."*
   **Stall 2** (a comprehension stall, not a blocking one).
5. **Files & exports ▾ → Print bid PDF…** A "Project info" modal opens: *"This bid will print with no company name
   on it — add yours so the client can reach you, or print as-is."* Focus lands in PREPARED BY — COMPANY. Buttons
   Cancel · Print anyway · Save & print. — *"Fair. I'll print anyway to see it."*
6. **Print anyway.** Toast: *"2 zero-quantity line(s) left off the client bid (see Cost sheet). Bid sent to
   print."* The print dialog would open (stubbed here). — *"Two lines left off? Which two? What's a cost sheet?"*
   **Stall 3** (the sentence leads with an exclusion the stranger did not make). The paper: one page, `Bid — Demo —
   Flat Roof Sample`, Total `$64,620.46`, 20 rows, eight "Not included" items, Terms, Acceptance; the PDF rendered
   by CDP: 127,275 bytes, 1 page, letter (sha256 `6f956718247e2c86…`).
7. **Second Print bid…** No modal (asked once per session); prints at once.
8. **Reload.** Landing again with *"PICK UP WHERE YOU LEFT OFF — Demo — Flat Roof Sample · 2026-09-04 04:03 · 2 meas
   · grid ✕"*. One click restores. `localStorage` keys: `ves:auto:grid:demo-flat-roof-sample`, `ves:prefs`.
9. **Help.** No visible Help, Keys or "?" control anywhere on the screen (the hotkeys card opens on the `?` key or
   from the command palette on the backtick, neither of which is shown; the status bar hints "` commands · space
   pan"). OBS: a query for visible buttons/links whose text or title matches help|keys|?|guide|tutorial|about
   returned `[]`.

From open to a printed bid on the demo: 6 gestures once the stranger knows the demo file exists and where. The
three stalls are words, not mechanisms: the banner's first sentence, the demo's absence from the landing, the
print toast's first clause. Prior P-FRESH rows in LEDGER were not consulted for this section.

---

## §5 Coherence under R-1 — verbatim, with location

Sentences a stranger reads as a sale, a reservation of use, or a contradiction of the donation model. Listed, not
rewritten.

**`LICENSE`**
- L2: `Copyright (c) 2026 Patrick Moriarty / Bitumen Machina LLC. All rights reserved.`
- L4–5: `This source code is made publicly viewable to support verification, hosted review, and owner-authorized agent collaboration.`
- L7–9: `No license is granted to use, copy, modify, merge, publish, distribute, sublicense, or sell this software or any part of it, beyond the viewing and forking inherent in the GitHub Terms of Service. For any other use, obtain written permission from the copyright holder.`
  — under R-1 this is the sentence that forbids the model: a donor's use is "any other use".

**`README.md`**
- L7–8: `**No seat fee, no report fee, no device limit, no login** — copy the file to any machine and it works there.`
  — "copy the file" against LICENSE L7 (M-07 as recorded).
- L45–47: `## License` / `Proprietary; all rights reserved. Source is public for verification and owner-authorized collaboration — see \`LICENSE\`.`
  — "Proprietary" reads as a product held back, not a gift.

**Landing copy inside `src/VES_PM.html`**
- L1752 (`.empty-safe`): `No seat fee, no report fee, no device limit, no login — the file is the whole install, on any machine you copy it to.`
  — the same copy tension as README L7–8; "seat fee / report fee" is the vocabulary of a sold tool, stated as absences.

**About / help surfaces (OBS)**
- The shipped file contains **no** license, copyright, owner, price or donation statement of its own anywhere a
  stranger can read: a length-bounded grep of the product for `licen[sc]e|copyright|©|proprietary|all rights|price|
  purchase|buy|sold|sale|subscri|donat` returns only pdf.js's Apache-2.0 notice (`:2147–2186`), the
  contractor-license field, and unit-price/price-library vocabulary. The `<title>` is `VES — Visual Estimating
  Substrate`; the corner stamp is `canvas takeoff · F18.66`. The hotkeys card (`openHotkeys`, `:6511`) lists keys
  only. A stranger who has the file and not the repo meets no terms at all — neither the prohibition nor a grant.

Nothing in the product body names a price, a plan, a trial, or a purchase (P-TRADE T-08 holds on HEAD, OBS).

---

## §6 Donation surface

**Can a pointer live inside the file under the zero-egress invariant?** Tested against the verifier and the committed
egress baseline on three scratch copies of HEAD (the product file was not touched; the copies were made in the
seat's scratch directory and deleted with it). The verifier's own output:

```
### A-anchor  3560175 bytes   (one line added after L1757:  <div class="empty-donate"><a href="https://example.org/donate">Donate</a></div>)
IDENTITY 3560175 bytes sha256 6c5e43acab8b48aab21ce64fda29b07fafea5c3a1b2a47acc86a9d284c34ac4f
SYNTAX   20 blocks checked, 2 skipped, 0 failed
EGRESS   7 matches; baseline 7 entries; 0 new, 0 gone
FREEZE   2 regions; manifest absent; 0 mismatched, 0 missing
RESULT   PASS
exit=0
### B-plaintext  3560162 bytes   (<div class="empty-donate">Donate: https://example.org/donate</div>)
IDENTITY 3560162 bytes sha256 73c4c3992658b55ac1ec52f68778f7ebb36d00a7511a30f4106f5d1618073599
SYNTAX   20 blocks checked, 2 skipped, 0 failed
EGRESS   7 matches; baseline 7 entries; 0 new, 0 gone
FREEZE   2 regions; manifest absent; 0 mismatched, 0 missing
RESULT   PASS
exit=0
### C-anchor-blank  3560217 bytes   (<a href="https://example.org/donate" target="_blank" rel="noopener noreferrer">Donate</a>)
IDENTITY 3560217 bytes sha256 7f8d128f856e47a5d16c3f65ece8b32e42b38b60fb36b77a30ca6fcee4adefca
SYNTAX   20 blocks checked, 2 skipped, 0 failed
EGRESS   7 matches; baseline 7 entries; 0 new, 0 gone
FREEZE   2 regions; manifest absent; 0 mismatched, 0 missing
RESULT   PASS
exit=0
```

- OBS: the egress pattern set (`ves-verify.mjs` DEFAULT_EGRESS) matches `fetch(`, `XMLHttpRequest`, `sendBeacon(`,
  `new WebSocket(`, `new EventSource(`, `import(`, `importScripts(`, `<script src=`, `<link href=//`, `<img src=//`,
  `<iframe src=`, `@import`, `url(//`, `navigator.serviceWorker`. A plain `<a href="https://…">` and a plain-text
  URL match none of them; the verifier passes both with the baseline unchanged.
- OBS, runtime: each copy opened under `file://` with the demo loaded made the same requests as HEAD — the file
  itself, six `data:font/woff2` fonts, one `blob:` (the autosave-era object URL) — and no `https:` request. An
  anchor does not fetch until clicked.
- OBS: the injected anchor was not visible on the landing in this placement (`offsetParent null`: the `.empty`
  block's CSS does not lay out an unknown child) — placement is a design question, not tested further.
- INF: a plain anchor without `target` navigates the app's own tab away on click; under `file://` that unloads the
  app (autosave flushes on `pagehide`; a PDF takeoff then needs its document re-opened). With `target="_blank"
  rel="noopener noreferrer"` the app stays. No platform is proposed.

**Could the pointer live only in the repo?** Yes: README, the repository's About/Sponsor settings, or GitHub Pages
copy carry a URL with the file carrying nothing. What the owner gains either way, stated without a recommendation:

- Pointer in the file: every copy of the file, however it travels, says where donations go and (if the same line
  carries it) under what terms; the invariant is untouched per the verifier above; the cost is one more sentence on
  the landing and a URL the owner must keep alive for the life of every copy.
- Pointer only in the repo: the product body stays free of any outward URL and any platform's name; a stranger who
  receives the file by copy (the README's own promise) never sees it.

---

## §7 Ledger triage against the trust bar — binary

"Blocks a stranger's real bid": the stranger loses the estimate or prints a wrong number. One reason each.

| row | blocks | reason |
|---|---|---|
| **U1** Unlink writes flat | **yes** | Three UI gestures change money silently against the control's own promise (−10.56% on the unlinked line, no toast, no banner, not undoable); every paper thereafter prints the changed number as truth (§2). |
| U3 apportionCents total guard | no | The five callers cannot hand it a non-finite total from the UI; on finite input the contract holds on 500,000 fuzz trials (§1). |
| U4 printBidDoc inline walk | no | `bidCents` equals `apportionCents` on 300,000 line sets with zero residual; the bound cannot be hit; both client papers read it (§1). |
| N-R1 rate precision | no | Amounts, subtotals and Total are exact and the basis note names the rounding; a client re-multiplying one row lands $44.45 high on $122,556.64 (§1) — the owner may weigh that differently. |
| C-S4 narrow-width toolbar overlay | no | Layout at narrow widths; no money face or paper changes. |
| C-R1 resolve fan-out perf | no | Performance; every money face repaints inside the probe-y bar on HEAD's record. |
| C-R2 34 KB build-log line | no | Repository hygiene; no runtime effect. |
| F-C1 exports menu covers money cells | no | The scrim consumes the click; nothing is edited by it. |
| F-C2 `placeKeyedRect` arms outside the gesture set | no | An arming inconsistency; a placed rect is visible and undoable. |
| W2M-C3 1–9 arm from inside a lens | no | Same class: arming, visible, reversible. |
| T-K3 completed proposal leaves the latch loaded | no | The latch holds the last document the estimator asked to print; the proposal prints from its own window. The general latch question is D-24.7b, the owner's bench (Firefox null). |
| C-K1 `#recapClientBtn` label/binding | no | A label. |
| T-5 dead `printClientReview`/`clientReviewHTML` exported on `VESApp` | no | Dead code, no door reaches it. |
| C-S1 per-measurement money in the Audit CSV | no | The audit carries quantities by design; no money face reads it. |
| C-S3 file:// banner unconditional | no | A word stall on the cold open (§4), not a loss or a wrong number. |
| C-O1 (overlay CSS layering, `:374`) · C-O2 (CSV formatting rule, `:8669`) | no | Presentation; both already carry the rule in the bytes. |
| C-S2 · C-H1 · C-H2 · C-H3 · T-3 | **null** | Their gists are not recoverable from the repo's record (IDs only in NOTES/LEDGER); they cannot be triaged from bytes. |
| *(found here)* recap panel ladder off by one cent from its own Sell (demo) | no | Screen face only; Sell is right; the S3 class the cost sheet and CSV already closed (§1). |
| *(found here)* pre-F18.65 takeoff loads with no library banner | no | Not a wrong number by itself; the T-02 class is silent for every file written before F18.65 (§2). |
| *(found here)* reload mid-drag commits the drag | no | Geometry moves to the pointer's last position; visible on the sheet after restore; no paper prints unseen (§2). |

Owner's set (not triaged by the seat, listed for completeness): F1 (price half ruled by R-1; license half is
R-2), N5, N6, D-24.7b (null on this seat), sweep F-01 (Pages), freeze manifest, tag `f18.55`.

---

## §8 The ship line — proposals, one line each, no diff

**Before HEAD is acceptable under the trust bar** (each line is a ruling the owner gives or refuses):

1. **Rule R-2's extent, then align the three copies.** What he gains: a stranger who bids with the file does so
   under a stated right, and `LICENSE`, `README.md` L7–8/L45–47 and the landing L1752 stop contradicting each
   other. The extents, each with what it gives him and nothing more:
   - *use only* — anyone may open the file and bid with it; nobody may change it or pass it on; the one line that
     travels is his.
   - *use + modify* — a stranger may fix or fit the file to their trade; the modified copies are not his line, and
     nothing obliges them to say so.
   - *use + modify + redistribute* — copies and forks move freely; the audit trail and G0 remain the only proof of
     which one is his.
   The seat drafts no text.
2. **Land U1.** What he gains: Unlink keeps the quantity the line was priced on, says what it did, and is undoable;
   the two statements that call it safe become true. (Batch U charter; red-first probe on HEAD reproduces §2's
   numbers.)

**After** (ruled and landed later, none blocks a real bid):

- Recap panel ladder apportioned like the cost sheet's — the panel's rows add up to its own Sell.
- A takeoff file with no `library` block raises the library banner too — the T-02 class closes for pre-F18.65 files.
- A bid printed with a 0% ladder says so once — a stranger opening an old file cannot send a bid at cost unknowingly.
- U4 unification onto `apportionCents` — one apportioning routine in the bytes, cent-identical (proven above) or stop.
- U3's total guard — a non-finite total returns nulls, never a zeroed distribution; unreachable today, cheap to close.
- The landing names the demo and how to open it — Stall 1 in §4 disappears.
- The file:// banner speaks only when a PDF door fails (C-S3) — the first sentence a stranger reads is the heading.
- The print toast leads with "Bid sent to print" and names the two skipped lines after — Stall 3.
- A visible Keys/Help door on the toolbar — the hotkeys card is reachable without knowing `?`.
- N-R1 — the owner's presentation call; the numbers are in §1.
- A terms/owner line inside the file (with or without a donation pointer; §6 shows the verifier passes either) —
  the file that travels by copy carries its own terms. Placement and platform are his.
- The autosave dot's word vs the disk (§2 SIGKILL) — the landing already says autosaves live in this browser; a
  sentence that Save (JSON) is the durable copy would say it where the dot is.

---

## Appendix — evidence, caveats, what was not done

- **Evidence files** were produced in the seat's scratch directory and are not committed (synthetic, but this
  directive authorizes one file). Hashes of the printed papers are in §3; the PDFs, screenshots and JSON reports
  can be regenerated by the probe scripts described in §§1–4 (raw CDP, Chromium 141, the same recipe as
  `tools/sweep/probe-*.mjs`). None of them touched `src/VES_PM.html`; the sha after the review is the sha before it.
- **Harness caveats, so they are not misread as product facts:** (a) Node 22's built-in WebSocket rejects CDP
  replies above ~1 MB, so results were chunked; (b) a 2 MB `data:` URL rendered blank in a fresh target — the
  proposal was re-printed from a `file://` page (§3); (c) opening a second document over live measurements routes
  through the app's document-swap confirm modal (D-25.3a) and an automated evaluate then waits forever — a correct
  product behaviour that stalled two harness runs until the page was reloaded first; (d) the SSMR "＋ labor" button
  row is labelled by the material ("Standing Seam Panel"), not the condition.
- **null on this seat:** Firefox (any lens), a headed Chrome print dialog, the owner's bench D-24.7b, the phone
  lenses for this review (not asked), P-FRESH re-run on a phone.
- **Not done, by directive:** no edit to the product, LICENSE, README or landing; no ledger row closed, reworded or
  renumbered; no license text; no donation platform; no batch.
