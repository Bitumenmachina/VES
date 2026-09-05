# HANDOFF — Batches AF · AG · AH · AI · Estimate sheet depth · test build F18.72 on `claude/estimate-sheet-depth-vrhnf6`

Companion to `CHANGE_LEDGER.md` (every product byte moved, keyed to the recon ledger) and to the recon pair
`research/FINDINGS_ESTIMATE_SHEET_b191423.md` / `research/HANDOFF_ESTIMATE_SHEET_b191423.md` (cherry-picked onto this
branch so the rows can cite them). This file exists so a reviewer can check the load-bearing claims in minutes, and
so Patrick's cold run of the coil case (commission §5) needs no document.

Standing: a test build on a branch, never `main`. Acceptance is Patrick's word after his own run; nothing below is
"done", it is built and gated. Synthetic fixtures only — the coil item is a probe fixture, never a real quote.

---

## 1. What this is, in one paragraph

On F18.68 the estimate half showed the engine's results and hid the derivation. F18.69 makes the engine line carry the
derivation it actually ran (driver, layer, expression, parameters, RAW/ADJ inputs), lets an estimator type a quantity
formula and its named inputs on the line from the Estimate grid, reverses the load-door ruling that deleted such a
formula on read (reusing the key so an older build drops it loudly), renders the derivation on every engine row and in
every cost export, and opens a Library lens where every item and assembly is visible and editable under the import's
own validation. The coil case — LF measured, LB bought, `RAW * width * lbsf` with the width typed on the line — prices,
shows, exports, saves, reloads to the cent, and reverts to the library when cleared.

## 0. Pickup for the next seat (written 2026-09-05, this session at its limit)

Read `research/WHATS_NEW_F18.72.md` first — the plain-language version of this section and the Opus work list.

State on the branch, from bytes: `src/VES_PM.html` = **F18.72** (Batch AI), 3,657,712 bytes, sha256
`d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70`, commit `d95c830`, pushed. `main` is still `b191423`
(F18.68). Nothing has been pushed to `main`. The freeze manifest is not written (Patrick's act).

The loop under Patrick's word ("run persona pass; if accepted finalize build and push to main; run in loop") has used its
three fix iterations: pass 1 → Batch AG (F18.70), pass 2 → Batch AH (F18.71), pass 3 → Batch AI (F18.72). Every finding and
its triage is in `LEDGER.md` §Batch AG / AH / AI; every product change in `CHANGE_LEDGER.md`; probe rows AF1–AF40 in
`tools/sweep/probe-af.mjs`, each batch RED-first on the prior bytes. **Pass 4 (the acceptance pass) was launched on
F18.72 but its four reports are NOT on record** — the session ended with the agents in flight. Treat pass 4 as not run.

What the next seat does, in order:
1. Verify the bytes: `sha256sum src/VES_PM.html` must print the sha above; `node tools/ves-verify.mjs` → RESULT PASS;
   `VES_CHROME=<chrome> node gate/g0.mjs check src/VES_PM.html` → G0 GREEN; probe-af per `tools/sweep/README.md` → 40/40.
2. Read the CI run on `d95c830` (run 54, `.github/workflows/verify.yml`, three jobs) and record its conclusion here.
3. Patrick's own test is §3 below (the coil case, cold, no document). His word decides acceptance — not a persona pass.
4. If Patrick accepts: NOTES.md §State names `main = F18.72`; CLAUDE.md §Identity names `main`; LEDGER carries the
   acceptance line quoting his word; then
   `git checkout main && git merge --ff-only claude/estimate-sheet-depth-vrhnf6 && git push origin main` and
   `git push origin claude/estimate-sheet-depth-vrhnf6`. No PR. Read the CI run on `main`.
5. If he wants a persona pass 4 first: launch the four `.claude/agents/p-*.md` personas on F18.72 by absolute path with
   the sha above, each re-checking its §Batch AI rows; the cap of three fix batches is spent, so a new (a)/(b) P0/HIGH is
   Patrick's call to build or to carry as an open row.

Open, recorded, not built: C-AG1…C-AG13 (LEDGER), §7 below.

Pass-4 reports that did land before the session closed (the others did not): **P-SEAT** — every pass-3 row DEAD; verifier
PASS and selftest 12/12 re-run by it on the bytes; eight new items, all register wording, none on the product: CHANGE_LEDGER
AI-1 / AI-3 / AI-5 / AI-6 / AI-7 evidence cells claim a little more than AF36–AF39 drive (a negative density, the `.`/`!`
seam cases, a six-decimal value, a fourth waste decimal, "computed once" — each "by inspection"); NOTES "36 items" and
"40 ids" are not derivable from the LEDGER tables (31 and 30 ids); NOTES's refutation tally omits AH-M14; the harness
worktree guard also refuses non-git compound commands (not a repo hook — no register names it). The next seat words those
cells and counts when it next touches the registers; nothing gates on them.

## 2. Identity of what was built

| item | value |
|---|---|
| product | `src/VES_PM.html` · **F18.72** · 3,657,712 bytes · sha256 `d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70` (F18.71 = Batch AH was 3,652,594 · `4e7be4b2…`, commit `d49ec56`; F18.70 = Batch AG 3,646,306 · `dea73046…`, commit `82652fa`; F18.69 = Batch AF 3,633,084 · `0ba7e3c4…`, commit `a63af32`) |
| build | F18.72 · Batch AF + AG (pass 1 answered) + AH (pass 2 answered) + AI (pass 3 answered) · branch `claude/estimate-sheet-depth-vrhnf6` (base `b191423` = F18.68 on `main`) |
| verifier on those bytes | `RESULT PASS` · `EGRESS 7 matches; baseline 7 entries; 0 new, 0 gone` · `FREEZE 2 regions; manifest absent` · exit 0 |
| G0 on those bytes | `G0 GREEN` 4/4 · exit 0 |
| batch gate | `tools/sweep/probe-af.mjs` 40/40 · exit 0 — AF1–AF15 **RED-first 1/15 on the F18.68 bytes**; AF16–AF29 (Batch AG) **RED-first 16/29 on the F18.69 bytes** (13 of the 14 new rows red; AF19 a control); AF30–AF35 (Batch AH) **RED-first 29/35 on the F18.70 bytes** (all 6 new rows red); AF36–AF40 (Batch AI) **RED-first 35/40 on the F18.71 bytes** (all 5 new rows red) |
| the CI probe list, run by the seat on those bytes (not a CI result) | probe-v 17/17 · probe-x 5/5 · probe-y 4/4 · probe-z 6/6 · probe-aa 5/5 · probe-ac 5/5 · probe-ab 4/4 · probe-ad 5/5 · probe-u 8/8 · probe-ae 5/5 |
| CI on the branch | run 51 (`a63af32`, F18.69): verify ✓ · gate ✓ · **probes ✗** — the probe-af step fetched the F18.68 bytes by an abbreviated sha, which `git fetch` does not accept on a shallow checkout (P-SEAT pass 1 finding 2); fixed in Batch AG. Run 33940876949 (`82652fa`, F18.70): verify ✓ · gate ✓ · probes ✓ (read by the seat through the GitHub API). Run 33970096369 (`d49ec56`, F18.71): verify ✓ · gate ✓ · probes ✓. The run on the F18.72 push is the next to read. |
| registers | `CHANGE_LEDGER.md` (new, 18 AF + 16 AG + 13 AH + 11 AI rows) · `LEDGER.md` §Batch AF (7 rows) + §Batch AG (pass 1, 35 rows) + §Batch AH (pass 2, 26 rows) + §Batch AI (pass 3, 25 rows) · `NOTES.md` §State · `CLAUDE.md` §Identity · `tools/sweep/README.md` · `.github/workflows/verify.yml` (probe-af in the probes job) |

If `src/VES_PM.html` no longer carries that sha256, this identity block is stale; `CHANGE_LEDGER.md` carries function
names, not line numbers, so its anchors survive.

RED-first record, verbatim head (F18.68 bytes, before any product edit):
```
FAIL AF1 engine lines carry driver {kind,value,level,expr,params,scope}: … {"und":null,"clips":null,"freight":null,"panel":null,"undOrdered":16}
FAIL AF2 coil: … {"error":"ReferenceError: libraryUpsertItem is not defined …"}
… (AF3–AF14 FAIL)
PASS AF15 control: a verify-flagged line paints the "estimated" dot, an OBS-priced line the "manual" dot, a STD line the firm dot (holds on F18.68)
probe-af: 1/15 passed, 14 failed
```

## 3. The cold run — the coil case, exactly (commission §5), with no document

1. Open the file. Press **L** (or the Library segment). In the Standing Seam Metal Roof group's **＋ new item** row: description
   `Coil`, kind material, driven by `SSMR — eave`, unit `LB`, driver `density ×` value `1.5`, unit $ `2.10`. Click **＋ Add**.
2. Press **L** again (or Esc) to return to the Plan. Add the SSMR assembly (Setup, or type a quantity on the eave: the
   Estimate lens's ＋ Add a line with the exact library name `SSMR — eave` and quantity `412.5` — the row says, before ✓ Add,
   that it is the library funnel, which assembly it activates and what its fixed allowances cost).
3. Press **E**. The Coil row reads `library · ADJ 412.5 LF × 1.5 LB/LF = 618.75 → 619 LB`, $1,299.90.
4. In its **Formula** cell type `RAW * width * lbsf`; in **inputs** type `width=1.25 lbsf=1.156`. The chip turns to
   **line formula**; the row reads `RAW 412.5 · ADJ 412.5 LF · width 1.25 · lbsf 1.156 = 596.06 → 597 LB`, $1,253.70. The
   HUD sell and the recap move with it. The journal names the edit (Ctrl+Z takes it back).
5. Change the inputs to `width=1.5 lbsf=1.156`: 716 LB, $1,503.60, nothing else touched.
6. Files & exports → Grid CSV / Estimate .xlsx / BOM CSV: the coil row carries `formula (LINE)`, the formula, the inputs,
   the quantity needed and the basis as trailing columns; the workbook's Overhead/Markup/Profit multiply by the Pct cells
   in column I. Print the bid or the proposal: none of it appears.
7. Save the takeoff, start a new one, open the file: 716 LB, same cents, formula and inputs still on the line.
8. Clear both cells: the chip says **library**, 619 LB again.
9. Type `RAW * widht`: the row goes red with `EXPR_ERROR: unknown token "widht"`, the lens cue says it, the recap's Flags
   list it, the sell drops by the whole line — it never prices as $0.

If any step needs something the interface does not say, the batch fails on that step.

## 4. Reviewer's checklist — the claims that carry the weight, and how to see each one

Run from the repo root on the branch. `VES=src/VES_PM.html`.

| # | claim | see it | expect |
|---|---|---|---|
| 1 | the engine line carries `driver` (R1/R2) | `grep -n "driver: driverOf()" $VES` | one hit inside `resolveItem`'s return |
| 2 | the item's drivers sit on the ITEM layer (level truth) | `grep -n "coverage: item.coverage, density: item.density, qty_expr: item.qty_expr, params: item.params" $VES` | one hit in `layers.ITEM` |
| 3 | params merge outside `resolveOverride` | `grep -n "OVERRIDE_LEVELS.slice().reverse()" $VES` | one hit, the params loop |
| 4 | the function set and the reserved names | `grep -n "const FUNCS = " $VES; grep -n "RESERVED_NAMES" $VES` | `ceil floor round abs max min`; five hits — three in the engine, one in `validateLibrary`, one in `parseParamsText` |
| 5 | NEW-4 reversed, typed at the door | `grep -n "const LINE_FORBID = \[\];" $VES; grep -n "qty_expr: 'expr', params: 'params'" $VES` | both hit once |
| 6 | the old build drops it loudly | `git show b191423:src/VES_PM.html > /tmp/VES_F18.68.html` (a full clone; CI fetches the same commit by full sha), then `VES_CHROME=<chrome> node tools/sweep/probe-af.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD" /tmp/VES_F18.68.html` — AF7 | banner text contains `unsupported override field`; `build: "F18.68"`; `ordered: 619` |
| 7 | the grid's 8th column and its cells | `grep -c 'colspan="8"' $VES; grep -n 'data-field="qty_expr"' $VES` | 4 colspans; the `.fx` cell in `derivCell` |
| 8 | the qty cell edits from full precision | AF13 | `data-raw` = `450.11428571428576`, shown `450.11` |
| 9 | exports carry the derivation; the ladder references Pct cells | AF4 | `G{c}*I{o}` … no literal `*0.` |
| 10 | client paper carries none of it | AF5 | `bidLeak/propLeak/revLeak` all false |
| 11 | condition waste door, journaled | AF11; `grep -n "function setConditionWaste" $VES` | `conditionOverrides['ssmr.eave'].waste === 0.05`, journal depth +1 |
| 12 | ＋ labor OFF-note by reference | AF14 | the note names `Standing Seam Panel — labor` |
| 13 | Library lens: one driver per item, refused with the validator's words; edits hit the library, not the project | AF12 | `2 drivers set (coverage, density) — at most one …`; `lineOverrides['ssmr.eavedrip']` undefined; fingerprint moved |
| 14 | desc + params survive the workbook | AF12 (`rtDesc`, `rtParams`) | both present after `tabsToLibrary(libraryToTabs(lib))` |
| 15 | nothing pinned moved | `node gate/g0.mjs check $VES`; probe-v V2; probe-ab AB3; probe-ad AD2 | G0 GREEN; 64620.46; both pass |

## 5. What was not done, stated plainly

- **Three persona passes ran** (P-GAME · P-TRADE · P-MARKET · P-SEAT, read-only, synthetic): pass 1 on F18.69 → Batch AG
  (LEDGER §Batch AG, AF16–AF29); pass 2 on F18.70 → Batch AH (§Batch AH, AF30–AF35); pass 3 on F18.71 → Batch AI (§Batch AI,
  AF36–AF40). Every fixed row was re-run DEAD by its filing persona in the following pass. The owner's cap is three fix
  iterations; pass 4 on F18.72 is the acceptance pass — zero new (a)/(b) P0/HIGH moves `main`; otherwise the loop stops
  with the open rows on record.

- **The freeze fence gated nothing.** `tools/freeze-manifest.json` does not exist; the `engine` region was edited on
  purpose (D1, D2) and the verifier reports `manifest absent`. Patrick writes the manifest by hand on the accepted
  pre-batch build (`b191423`) before this branch is reviewed for merge; until then "inside the fence" is a description.
- **The card depth row's qty input** (`buildDepthRow`) still edits the 2-dp figure — a number input with no raw/display
  split. The grid and both recap tabs are fixed (F1.4 m named four sites; three moved).
- **The money peek** shows `ordered` only, as before.
- **Assembly-level `itemOverrides`** from a JSON library import remain unsanitized (F2.1) — out of this batch.
- ~~`parseFloat('1.2.3') → 1.2`~~ — fixed in Batch AH (a malformed literal gates; AF30). Still open in the grammar: no `^`, `%`,
  comparison or conditional (refused loudly, by design — the grammar is closed); inputs are case-sensitive (`WIDTH` ≠ `width`).
- The Library lens has no undo: library edits are not on the takeoff journal (as `addAssemblyItem` never was). Each edit
  toasts and persists; the workbook export is the recovery path.

## 6. Residual risk, in plain words

1. **Line references drift.** `CHANGE_LEDGER.md` cites function names; the recon ledger's `:NNNN` are against F18.68.
2. **The grid is wider.** The Formula column adds ~280 px; at 1440 the table scrolls horizontally inside `.gscroll`; in
   split mode the column is hidden with the other secondary columns. Not measured on a phone (the Field lens is the
   phone lane).
3. **Two-assembly item sharing** (F2.5) is unchanged: an item listed under two assemblies would share one override record,
   now including its formula and params.
4. **A library `params` object with a key named `value`** is handled (the merge bypasses `resolveOverride`), but a library
   item whose `coverage` is stored as a `{value, authority}` wrapper still resolves as before — no change, noted.
5. **The `L` hotkey** was unbound and is now the Library lens; a future binding must move it.
6. **Old files, new build**: a takeoff saved by F18.58–F18.68 never carries `qty_expr` (the door dropped it), so nothing
   re-prices on open. A file hand-edited to carry one now prices it — and says so on the row, which is the point.

## 7. Follow-ons — OPEN, not done

- From persona pass 3 (LEDGER §Batch AI): the internal cost sheet without the derivation (C-AG11, with the recap drawer);
  the 720/719 px breakpoint pair (C-AG12); one vocabulary per field across the lens (C-AG13); `007` as a literal; the waste
  box's JS number grammar; a refused lens draft that stays for correction.
- From persona pass 2 (LEDGER §Batch AH, CANDIDATE rows): live quantity math in the workbook (the ladder is live; the
  quantities are literals) — C-AG8; ordering the lens's refusals (two-driver vs parse) — C-AG9; one header casing across
  the three exports — C-AG10; the lens's 2,193 px table and the rest-state ruling; the guard hook's quoted-text false
  positive (with C-AG7).
- From persona pass 1 (LEDGER §Batch AG, CANDIDATE rows): cost per estimated unit on the row (with the price unit);
  an auto-round control (CEIL is always on for material); item creation from the grid beyond a manual line; the recap
  drawer's derivation; the grid's CSI column and group-header code; the caret-after-commit grammar; the Library lens's
  full re-render per edit (218 ms on 164 rows) and 265 ms first frame; 20 px segments on the phone (with G-08, Field lens);
  the guard hook's text match; stale D-series line citations in LEDGER (Patrick's to prune).

- **Price unit / price formula** (R5): `unit_cost` is per order unit everywhere it is shown; an EDGE-style price unit and
  price formula are a schema change.
- **Labor as a sub-record of a material line** (R6, Wave-3 N1/N2): labor stays its own item; the OFF-note now finds the
  sibling by reference.
- **General-line drivers** (F4.3-1): a general line is still `qty × unit_cost`.
- **Two-assembly item sharing** (F2.5).
- **Assembly `itemOverrides` sanitizing on JSON import** (F2.1).
- **Card depth qty raw/display split**; **money peek derivation**; **library-edit undo**.
- **Golden coverage** (recon handoff §4 item 4): golden A pins no line identity; re-freezing is a gate-harness change
  (YELLOW after freeze) and Patrick's call.

## 8. Files on this branch (beyond `main`)

```
src/VES_PM.html                                  F18.72 (the product)
tools/sweep/probe-af.mjs                         the batch gate (40 checks; 4th arg = the F18.68 bytes)
tools/sweep/README.md · .github/workflows/verify.yml
CHANGE_LEDGER.md                                 new
LEDGER.md · NOTES.md · CLAUDE.md                 registers
research/FINDINGS_ESTIMATE_SHEET_b191423.md      cherry-picked from the recon branch
research/HANDOFF_ESTIMATE_SHEET_b191423.md       cherry-picked from the recon branch
research/HANDOFF_ESTIMATE_SHEET_AF.md            this file
```
