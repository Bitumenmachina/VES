# READINESS — F18.72 against `main`, from bytes · answer to `research/HANDOFF_FABLE_NEXT.md`

Written 2026-09-05 by the next Fable seat (cloud, branch `claude/new-session-ch1yrd`, fast-forwarded onto
`claude/estimate-sheet-depth-vrhnf6` at `df4c97c` so this file sits beside the bytes it judges). Every number below was
produced in this session by the commands shown; nothing is carried from the prior seat's record except where it is named
as a claim being checked. No product byte moved. No persona pass 4. No `--write-*`. No PR. No push to `main`.

Patrick's two questions, answered first; the evidence follows.

## 0. The answer

**Ready to go? — Yes, as far as a seat can take it.** The F18.72 bytes pass every gate the repo has (verifier, G0, all
eleven sweep probes, selftest), CI run 54 on the F18.72 commit is green in all three jobs, the coil case runs end to end
through the interface's own doors exactly as the cold-run script (`HANDOFF_ESTIMATE_SHEET_AF.md` §3) says it will, and on
every synthetic takeoff this seat could build (the demo, the four G0 shapes, a pitched source with linked labor, typed
and item overrides, every assembly in the seed with every condition typed) F18.68 and F18.72 price to the same sell at
full floating-point precision and print the same bid, cost sheet and proposal.

What stands between F18.72 and `main` is Patrick's, not a seat's — three items, none a code fix:

1. **His own §3 run** (his hand, his browser). This seat's run passed all nine steps (§3 below); his word is the acceptance.
2. **One real takeoff on F18.72 beside F18.68**, same PDF. The synthetic sweep says identical (§4); a live job says so for real.
3. **One ruling** (§4, scenario S7): a seed library formula line whose driving condition is present at ZERO quantity
   (the slate Hip/Ridge Nails with a ridge condition activated but not traced) was an included $0 line on F18.68 and is a
   ZERO_QTY line on F18.72 — excluded, flagged, and **listed under "Not included in this bid" on the client bid and proposal**.
   The sell is identical. The batch record (CHANGE_LEDGER AG-1, and the code comment beside the gate) says library drivers
   kept their standing behaviour; for a library-level formula that is not what the bytes do. Either outcome is defensible;
   it is a client-paper wording change on a pinned takeoff and it needs Patrick's yes or no, and one LEDGER row either way.

If he accepts: `HANDOFF_ESTIMATE_SHEET_AF.md` §0 step 4 (registers name `main`, `git merge --ff-only`, push, read CI on `main`).

**Drifted? — In the record, yes; in the product, barely.** Measured on the product diff (§5): of 912 added lines,
737 are the commission, 60 are money-honesty fixes, 115 are wording / marks / tints / phone pins / key grammar. Read
hunk by hunk, almost every one of those 115 answers something an estimator meets in the first week (the em dash in a
library name nobody can type, a lens whose Escape closed nothing, a header that said "edited" for an untouched book, a
gated row that lost its tint when the cue expired). This seat recommends pruning **none** of the product bytes: the cost
of a prune (a new stamp, red-first rows flipped to controls, register rows) exceeds the weight of ~115 lines that do no
harm. The drift is the RECORD: 93 LEDGER rows, 58 CHANGE_LEDGER rows, 79 NOTES lines and 1,045 research lines for 912
product lines — roughly two lines of register per line of product. Collapsing the four ledgers into one table per build
loses nothing (git keeps the originals) and is Patrick's call (§6).

## 1. Identity, from bytes

| item | value |
|---|---|
| `main` | `b191423` · F18.68 · `src/VES_PM.html` 3,570,752 bytes · sha256 `494d288baa32a2ee192d28d7668ba87e17c9291607ff03708a5fdcb78cea3760` |
| branch `claude/estimate-sheet-depth-vrhnf6` | head `df4c97c` (9 commits past `main`); product commit `d95c830` |
| F18.72 product | `src/VES_PM.html` 3,657,712 bytes · sha256 `d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70` — matches the handoff's claim |
| product diff | `git diff --numstat main..HEAD -- src/VES_PM.html` → `912 116` in 79 hunks |
| CI, F18.72 commit `d95c830` | run 54 (id 33971056598) · **success** · jobs `verify` ✓ (ves-verify) · `gate` ✓ (g0 golden money-path gate) · `probes` ✓ (sweep probes probe-v … probe-af) — read through the GitHub API |
| CI, later register-only commits | runs 55, 56, 57, 58 (`b01c496`, `4175fc2`, `68895ab`, `df4c97c`) · all success. Run 51 (`a63af32`, F18.69) failed on the probes job — the shallow-fetch bug AG fixed. |
| freeze manifest | absent (`tools/freeze-manifest.json` does not exist); the `engine` fence carries 11 hunks (+119/−20), `core` carries none |

## 2. Gates on the F18.72 bytes, verbatim (this seat's run, this VM, Chromium `/opt/pw-browsers/chromium-1194`)

```
$ sha256sum src/VES_PM.html; wc -c src/VES_PM.html
d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70  src/VES_PM.html
3657712 src/VES_PM.html

$ node tools/ves-verify.mjs
IDENTITY 3657712 bytes sha256 d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70
SYNTAX   20 blocks checked, 2 skipped, 0 failed
EGRESS   7 matches; baseline 7 entries; 0 new, 0 gone
FREEZE   2 regions; manifest absent; 0 mismatched, 0 missing
RESULT   PASS
verifier exit=0

$ VES_CHROME=… node gate/g0.mjs check src/VES_PM.html
  ✓ A == goldenA (assembly money path)
  ✓ B == goldenB (sell-ladder + R3)
  ✓ C == goldenA (save/reload inert)
  ✓ D == goldenA (schedule inert)
G0 GREEN
[G0 exit=0]

$ node tools/sweep/probe-af.mjs src/VES_PM.html release/demo/demo-flat-roof.json "$PWD" <F18.68 bytes from `git show b191423:src/VES_PM.html`>
PASS AF1 … PASS AF40   (every line PASS; the full 40 lines are in the CI job summary of run 54 and reproduce here)
probe-af: 40/40 passed, 0 failed
[probe-af exit=0]

probe-v: 17/17 passed, 0 failed     [exit=0]
probe-x: 5/5 passed, 0 failed       [exit=0]
probe-y: 4/4 passed, 0 failed       [exit=0]
probe-z: 6/6 passed, 0 failed       [exit=0]
probe-aa: 5/5 passed, 0 failed      [exit=0]
probe-ac: 5/5 passed, 0 failed      [exit=0]
probe-ab: 4/4 passed, 0 failed      [exit=0]
probe-ad: 5/5 passed, 0 failed      [exit=0]
probe-u: 8/8 passed, 0 failed       [exit=0]
probe-ae: 5/5 passed, 0 failed      [exit=0]

$ bash test/selftest.sh
selftest: 12 passed, 0 failed       [exit=0]
```

## 3. The cold run (§3 of `HANDOFF_ESTIMATE_SHEET_AF.md`), driven through the UI's own doors

Headless Chromium over CDP, 1440×900, `localStorage` cleared, the file opened cold. Each step used the door §3 names:
the `L` key, the Library lens's ＋ new item row and its ＋ Add button, the `E` key, the Estimate lens's ＋ Line door and
entry row, the Formula and inputs cells (`change` events), Ctrl+Z, the exports menu's three functions, the print doors,
`snapshot()` → new takeoff → `loadFromData()`. No ladder was set (§3 sets none), so the sell moves by line cost.

| step | expected (§3) | observed |
|---|---|---|
| 1 | Coil added on SSMR: material, driven by SSMR — eave, LB, density × 1.5, $2.10 | toast `Library: "Coil" added on Standing Seam Metal Roof.` · id `ssmr.user.1` from the library's counter · item `{kind material, cqty_ref ssmr.eave, unit LB, density 1.5, unit_cost 2.1, csi 07 41 13}` · header reads `edited in this browser · fingerprint 1d14b7a1` |
| 2 | entry row says the funnel before ✓ Add; 412.5 on `SSMR — eave` | funnel line: `Library — the quantity becomes a measurement on "SSMR — eave" (LF) and the Standing Seam Metal Roof assembly prices it: 46 items, including 17 fixed allowances ($50,630.00) — added to the estimate with this line.` · toast `Manual quantity: 412.5 → SSMR — eave.` · one condition, one measurement 412.5, 22 lines |
| 3 | `library · ADJ 412.5 LF × 1.5 LB/LF = 618.75 → 619 LB`, $1,299.90 | chip `library` (level ITEM) · `ADJ 412.5 LF × 1.5 LB/LF = 618.75 → 619 LB` · ordered 619 · extended **1299.90** · HUD $56,801.65 |
| 4 | formula + inputs → `line formula`, `… width 1.25 · lbsf 1.156 = 596.06 → 597 LB`, $1,253.70; HUD/recap move; journaled; Ctrl+Z | after the formula alone (inputs not yet typed): `EXPR_ERROR: unknown token "width"`, cue says it — correct. After the inputs: chip `line formula` (LINE) · `RAW 412.5 · ADJ 412.5 LF · width 1.25 · lbsf 1.156 = 596.06 → 597 LB` · ordered 597 · extended **1253.70** · qtyNeeded 596.0625 · HUD $56,755.45 (Δ −46.20 = 1299.90 − 1253.70) · journal `quantity formula RAW * width * lbsf → Coil`, `formula inputs width=1.25 lbsf=1.156 → Coil` · Ctrl+Z toast `Undid: formula inputs …` · redo restores 597 / 1253.70 |
| 5 | width 1.5 → 716 LB, $1,503.60, nothing else touched | `… width 1.5 · lbsf 1.156 = 715.28 → 716 LB` · ordered 716 · extended **1503.60** · 0 of the other 21 lines moved · HUD $57,005.35 |
| 6 | exports carry `formula (LINE)`, formula, inputs, qty needed, basis; ladder × Pct cells; client paper carries none | grid CSV coil row: `…,716,LB,2.1000,1503.60,material,formula (LINE),RAW * width * lbsf,width=1.5 lbsf=1.156,715.275,RAW=412.5;ADJ=412.5;WASTE=0%` · BOM CSV same five trailing cells · .xlsx ladder `G24*I25`, `(G24+G25)*I26`, `(G24+G25+G26)*I27`, 0 baked `*0.` literals · bid / proposal / cost sheet leak test (`RAW|ADJ|width=|lbsf|qty_expr`) all **false** · cost sheet header says `order unit` · bid row reads `Coil — 716 LB $2.10` |
| 7 | save → new → open: 716 LB, same cents, formula and inputs on the line | version 3 · blank takeoff 0 lines · after load: ordered 716 → 716, extended 1503.60 → 1503.60 · override `{qty_expr: "RAW * width * lbsf", params: {width 1.5, lbsf 1.156}}` · chip `line formula` · no drop banner (only the standing file:// banner) · toast `Takeoff loaded.` |
| 8 | clear both cells → chip `library`, 619 LB | chip `library` (ITEM) · 619 · $1,299.90 · override record deleted |
| 9 | `RAW * widht` → red row naming `widht`, cue says it, Flags list it, sell drops by the whole line, never $0 | status `EXPR_ERROR` · row text `EXPR_ERROR: unknown token "widht"` · `tr.gated` true · cue `Coil: EXPR_ERROR — unknown token "widht". The line is flagged and left out of the total until the formula evaluates.` · Flags `⚠ 1 line(s) excluded from the subtotal (never counted as zero): Coil — unknown token "widht"` · sell 56,801.65 → 55,501.75, drop **1,299.90** = the line's cost · extended `null`, never 0 |

Nine of nine as written. One thing §3 does not say that the seat hit: on an empty takeoff the Estimate lens reads
"No priced lines yet — measure a condition in the Plan view" and the entry row opens from the lens's ＋ Line button (same
on F18.68). §3 names Setup first and the entry row second; both work; the sentence could name the button.

## 4. Nothing pinned moves — the synthetic stand-in for a real takeoff

Both builds driven by the same script (scratch, not a repo probe: `sidebyside.mjs` + `compare.mjs`, the run log below),
each scenario built through `VESApp`'s own doors, then every money face dumped: `recapModel()`, every
`resolveAssembly().lines` field, the rollup / BOM / audit / grid CSVs, the Estimate and client-review workbooks (cell by
cell), the bid, the cost sheet and the proposal as text, the HUD, the Flags list. Compared after removing only the
changes the batch declares: the five trailing derivation columns, the `Unit $ / order unit` header words, keys the old
line lacked (`driver`, `flat`), and the audit CSV's export timestamp.

| scenario | shape | F18.68 sell | F18.72 sell | lines | differences after normalisation |
|---|---|---|---|---|---|
| S1 | `release/demo/demo-flat-roof.json` | 64620.45928800001 | 64620.45928800001 | 22 = 22 | ladder labels/formulas only (below) |
| S2 | G0 scenario A (SSMR field 3150.8, 10/8/5) | 102067.5420072 | 102067.5420072 | 23 = 23 | same |
| S3 | SSMR field 1000 at 6/12 + ＋ labor linked at $2.50 (probe-u's shape) | 80506.89282560365 | 80506.89282560365 | 24 = 24 | same |
| S4 | S2 + eave 412.5 + typed qty on clips, unit cost on underlayment, item override on panel, condition waste 5 % on eave | 110111.63791320001 | 110111.63791320001 | 27 = 27 | same |
| S5 | slate, field 1000 | 74850.23700000001 | 74850.23700000001 | 21 = 21 | same |
| S6 ×4 | every seed assembly (ssmr, tpo, wp, slate), every library condition typed 1000+250i+0.37 | 994102.91633268 · 6208067.783194199 · 2445626.4179886 · 49312354.257243 | identical, all four | 45 · 34 · 32 · 52 | same |
| S7 | slate, field 1000, **ridge condition present at 0** | 74850.23700000001 | 74850.23700000001 | 25 = 25 | **the Hip/Ridge Nails line: see below** |
| S8 | SSMR field 1000 + a free line "Deck patch (synthetic)" 250 SF @ $3.25 via the entry row | 78302.41649999999 | 78302.41649999999 | 24 = 24 | the free line's measure: `count`/`EA` → `area`/`SF` (below) |

The one difference every scenario shares is the batch's own (AF-12, AG-13): the Estimate .xlsx ladder rows read
`Overhead (× Pct)` instead of `Overhead (10%)` and their formulas read `G24*I25` instead of `G24*0.1`; every cached value
is identical (`5180.412`, `4558.762560000001`, `3077.1647280000007` on the demo). Recap keys, every line field the old build
carried, every CSV row on the old width, every workbook cell A–H, the bid, the cost sheet and the proposal: identical.

**S7 — the ruling.** The seed's `slate.hipridgenails` carries the library formula `{ADJ * 4 / 1000}` driven by hip and
ridge. With a ridge condition on the takeoff at zero quantity:

```
F18.68  nails: {ordered: 0, extended: 0, included: true,  status: "MATCHED"}   recap.lineCount 25
F18.72  nails: {ordered: null, extended: null, included: false, status: "ZERO_QTY"}   recap.lineCount 24
        gate: "the formula evaluated to 0 — check its inputs (turn the line OFF instead if nothing is needed)"
        Flags: "⚠ 1 line(s) excluded from the subtotal (never counted as zero): Hip/Ridge Nails — …"
        bid text:      "… Not included in this bid  Hip/Ridge Nails  Slate — chimney cap …"   (F18.68: no such entry)
        proposal text: "… Not included  Hip/Ridge Nails  Slate — chimney cap …"              (F18.68: no such entry)
        cost sheet:    the row "07 31 26 Hip/Ridge Nails — 0 M $415.00 $0.00 …" is gone     (F18.68: printed at $0.00)
        sell: identical on both builds
```

The gate in `resolveItem` (`if (!hasQtyOv && qtyExpr != null && qtyNeeded === 0) … ZERO_QTY`) tests the expression
without asking which layer it came from, so the seed's own two formula items (`slate.fieldnails`, `slate.hipridgenails`)
gate at zero exactly as a typed line formula does. The comment beside the gate and CHANGE_LEDGER AG-1 both say library
drivers keep their standing behaviour; for the density driver Batch AI already found and closed the same gap on purpose
(AI-T1); for a library formula the bytes changed and the record did not say so. Money-honest (nothing counted as zero
silently), but the client bid now names an item as "Not included" that the estimator never excluded. Patrick's call:
keep (and add the LEDGER row), or scope the gate to LINE-level expressions (a small engine edit, a red-first probe row).

**S8 — by design.** The entry row now takes a measure from the unit (`measureForUnit`, AF-10): an SF free line is an
`area` condition (pitch- and waste-eligible) where F18.68 forced `count`/`EA` and printed `250 EA` on the proposal for a
line typed as SF. The new proposal reads `250 SF`. The sell is identical. This is the commission's EDGE order, correct,
and it changes what a NEW free line can do; existing saved lines keep their stored type.

## 5. The diff, binned (handoff step 4)

A read-only agent read all 79 hunks of `git diff main..HEAD -- src/VES_PM.html` and binned each; the seat re-read
every engine-fence hunk (#14–#24) and the load/write doors by eye and agrees with the table. Totals reconcile with
`git diff --numstat` (912 / 116) exactly. The handoff's own estimate was (a) ~1,900 (b) ~250 (c) ~500 of 2,688 across
all files; measured on the product alone:

| bin | added | removed | share of added |
|---|---:|---:|---:|
| (a) the commission | 737 | 86 | 80.8 % |
| (b) money-honesty | 60 | 6 | 6.6 % |
| (c) wording · marks · tints · pins · keys | 115 | 24 | 12.6 % |

Inside the `engine` fence: hunks 14–24 (+119/−20): the function set and literal grammar, `resolveItem`'s driver
emission and params merge, the two ZERO_QTY gates, `gateLine`'s driver argument, the export list. Inside `core`: nothing.
No new egress pattern in any added line (fetch / XHR / WebSocket / import() / http src: zero matches).

The (c) hunks, each with this seat's recommendation (keep unless said):

| hunk | anchor | what | keep? |
|---|---|---|---|
| 4, 55 | `.estgrid tr.gated` | tint + left bar on a gated row after the cue expires | keep — the cue dies in 6 s; the tint is the only sign left |
| 5, 8, 6, 7c | `.viewtoggle` @720px, door pins | wordless phone segments; the document-door pin follows the fourth segment | keep — AG-G1/AH-G9 were the 4th segment covering Files & exports; the pin must move with it |
| 9 | `@media (pointer: coarse)` | lens cells / ＋ Add at 40 px | keep |
| 10c, 38c | aria-labels (segments, waste box) | 4 lines | keep |
| 11 | landing sentence | names the derivation, the line formula, the lens | keep — the file claims what it does |
| 15c, 16 | `resolveExpr` words | stray operator named; case hint; the token named after "RAW" | keep — a typo in a formula is a weekly event |
| 32, 70c | `lensCue('')` | the cue dies with the takeoff / after a good commit | keep — a stale cue is a false statement |
| 35 | hotkey card | the `L` row | keep (1 line) |
| 37, 44c, 48c | title / sentence wording | "this takeoff's line value"; the OFF-note sentence | taste — either way |
| 42c | `pctWord` four decimals | 0.001 % no longer reads "0%" beside a moved figure | keep |
| 46, 49, 66 | `Unit $ / order unit` | the header says what the price is per (R5's stand-in) | keep |
| 52c, 74 | `libCondClosest`, `libNameKey` | case/dash-forgiving library-name match; closest-name hint | keep — `SSMR — eave` carries an em dash no keyboard types |
| 59c | lens toast + seed accent | the toast said "not this takeoff" while the sell moved; edited cells in the accent | keep the toast (it was false); the accent is taste but cheap |
| 61 | `libraryIdentity` | a book equal to the seed reads as the seed | keep — the header said "edited" for an untouched book |
| 65 | drop-notice wording | "out-of-range or malformed" | keep (1 word) |
| 68c, 73 | Escape / Enter in the lens and the cell | Escape reverts and says so; Enter commits and refocuses | keep — Escape that closes nothing and a blur that commits silently is a trap |

Prune candidates if Patrick wants the product thinner: hunks 37, 44c, 48c (about 6 lines of title wording) and the
seed accent in 59c (~10 lines). Not worth a build stamp on their own.

## 6. The registers, row by row (handoff step 5)

LEDGER §Batch AF/AG/AH/AI = 7 + 35 + 26 + 25 = **93 rows**; CHANGE_LEDGER = 18 + 16 + 13 + 11 = **58 rows**. Dispositions
across AG/AH/AI as the tables mark them: (a) 12 · (b) 41 · (c) 19 · (d) 5 · REFUTED-with-evidence 6 · recorded-only 12 ·
nothing-found 2. Of the fixed rows, the ones a persona's taste alone produced and an estimator would not meet in a week
of takeoffs: AG-G16 (BOM header casing), AH-G2 (segment aria-labels), AI-M12 (waste box aria-label), AI-G3 (Escape in an
untouched cell says nothing), AG-T11 (chip word "line value" vs "line formula"), the three title wordings above. Eight
rows, ~25 product lines. Everything else fixed answers a false statement, a silent number, a blocked door, or a phone
overlap.

**(a) labels not earned** (the row says money-honesty; the defect was not): AG-G1 (a segment covering the exports button —
a blocked door, (b)), AG-M2 (the derivation words omitted the item waste — the number was right, (b)), AG-S2 (a CI fetch
fix — not product). Three of twelve. The other nine are earned: each is an included $0, a silent mis-parse, an
`undefined` on a sheet, an overwrite, or a toast that lied about money.

**P-SEAT's pass-4 items** (recorded by the prior seat, not fixed), checked here: NOTES says "Pass 3 filed 36 items";
§Batch AI has 25 rows naming 28 ids — the 36 is not derivable from the table. NOTES's "40 ids (39 findings)" for pass 2
against §Batch AH's 26 rows / 43 id tokens — likewise not derivable. CHANGE_LEDGER AI-1/3/5/6/7 evidence cells claim a
negative density, the `.`/`!` seam, a six-decimal value, a fourth decimal, "computed once" beyond what AF36–AF39 assert —
by inspection, as P-SEAT said. None of these gate anything. They are wording; a seat words them when it next touches the
registers, per the handoff.

**One register error this seat adds to that list:** CHANGE_LEDGER AG-1 "library drivers unchanged" and the code comment
at the ZERO_QTY formula gate — false for a library-level `qty_expr` (§4 S7). The row for it is Patrick's ruling.

**Record drift, measured.** Added on the branch beyond the product: LEDGER +138 lines, CHANGE_LEDGER 105, NOTES +79,
`research/` 1,045 (FINDINGS 536, HANDOFF 134 + 200, WHATS_NEW 97, HANDOFF_FABLE_NEXT 78), `tools/sweep/probe-af.mjs` 442,
README/CLAUDE/workflow/agents 54. About 1,860 lines of register and research for 912 lines of product. The four ledgers
say the same things four times (a finding in LEDGER, its fix in CHANGE_LEDGER, its summary in NOTES §State, its plain
words in WHATS_NEW). If Patrick wants it collapsed: one table per build (finding · what moved · anchor · probe row ·
status), LEDGER as the only register, NOTES §State one paragraph per build, the research files left as history. Git
keeps the originals; nothing is lost. This seat did not do it — the handoff says ask first.

## 7. What this seat did not do, stated plainly

- No real takeoff (client data never enters this repo); the synthetic sweep in §4 is the stand-in.
- No run by Patrick's hand; §3 here is a headless run through the same doors.
- No persona pass 4 (the cap is spent; its reports are not on record and stay off it).
- No product edit, no F18.73, no probe file added to `tools/sweep/` (the side-by-side and cold-run drivers are scratch;
  their reproduction is fully described above and runs from `VESApp` calls anyone can type).
- No register rewrite: NOTES gains one line pointing here; LEDGER / CHANGE_LEDGER / the handoffs are untouched.
- The freeze manifest is still absent; only Patrick writes it, on the build he accepts.

## 8. Commands (from the repo root, on this branch)

```
sha256sum src/VES_PM.html                                             # d07cd6ad…15a70
node tools/ves-verify.mjs                                             # RESULT PASS
VES_CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome node gate/g0.mjs check src/VES_PM.html
git show b191423:src/VES_PM.html > /tmp/VES_F18.68.html
node tools/sweep/probe-af.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD" /tmp/VES_F18.68.html
bash test/selftest.sh
git diff --numstat main..HEAD -- src/VES_PM.html                      # 912 116
# S7, on either build, in the console after opening the file:
#   VESApp.newTakeoff(); VESApp.loadAssembly('slate'); VESApp.addManualQuantity('slate.field', 1000);
#   VESApp.addManualQuantity('slate.ridge', 0); VESApp.resolveAssembly().lines.find(l => l.item === 'slate.hipridgenails')
```
