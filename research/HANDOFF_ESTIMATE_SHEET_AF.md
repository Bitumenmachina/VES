# HANDOFF — Batch AF · Estimate sheet depth · test build F18.69 on `claude/estimate-sheet-depth-vrhnf6`

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

## 2. Identity of what was built

| item | value |
|---|---|
| product | `src/VES_PM.html` · 3,633,084 bytes · sha256 `0ba7e3c4c95b9a88f900902612d47fc867354b8b657d81926402db1eea177661` |
| build | F18.69 · Batch AF · branch `claude/estimate-sheet-depth-vrhnf6` (base `b191423` = F18.68 on `main`) |
| verifier on those bytes | `RESULT PASS` · `EGRESS 7 matches; baseline 7 entries; 0 new, 0 gone` · `FREEZE 2 regions; manifest absent` · exit 0 |
| G0 on those bytes | `G0 GREEN` 4/4 · exit 0 |
| batch gate | `tools/sweep/probe-af.mjs` 15/15 · exit 0 — **RED-first 1/15 on the F18.68 bytes** (only the provenance-colour control passed, stated as a control) |
| CI probe list on those bytes | probe-v 17/17 · probe-x 5/5 · probe-y 4/4 · probe-z 6/6 · probe-aa 5/5 · probe-ac 5/5 · probe-ab 4/4 · probe-ad 5/5 · probe-u 8/8 · probe-ae 5/5 |
| registers | `CHANGE_LEDGER.md` (new, 18 rows) · `LEDGER.md` §Batch AF (7 rows) · `NOTES.md` §State · `CLAUDE.md` §Identity · `tools/sweep/README.md` · `.github/workflows/verify.yml` (probe-af in the probes job) |

If `src/VES_PM.html` no longer carries that sha256, the line references in `CHANGE_LEDGER.md` are stale; the function
names beside each are the durable anchor.

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
| 4 | the function set and the reserved names | `grep -n "const FUNCS = " $VES; grep -n "RESERVED_NAMES" $VES \| head -3` | `ceil floor round abs max min`; used by the engine, the door and the validator |
| 5 | NEW-4 reversed, typed at the door | `grep -n "const LINE_FORBID = \[\];" $VES; grep -n "qty_expr: 'expr', params: 'params'" $VES` | both hit once |
| 6 | the old build drops it loudly | `node tools/sweep/probe-af.mjs … <F18.68 bytes>` AF7 | banner text contains `unsupported override field` |
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

- **The freeze fence gated nothing.** `tools/freeze-manifest.json` does not exist; the `engine` region was edited on
  purpose (D1, D2) and the verifier reports `manifest absent`. Patrick writes the manifest by hand on the accepted
  pre-batch build (`b191423`) before this branch is reviewed for merge; until then "inside the fence" is a description.
- **No persona pass** (`.claude/agents/p-*`) was run on this build.
- **The card depth row's qty input** (`buildDepthRow`) still edits the 2-dp figure — a number input with no raw/display
  split. The grid and both recap tabs are fixed (F1.4 m named four sites; three moved).
- **The money peek** shows `ordered` only, as before.
- **Assembly-level `itemOverrides`** from a JSON library import remain unsanitized (F2.1) — out of this batch.
- **`parseFloat('1.2.3') → 1.2`** in the tokenizer is pre-existing and unchanged (no new parsing rule).
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
src/VES_PM.html                                  F18.69 (the product)
tools/sweep/probe-af.mjs                         the batch gate (15 checks; 4th arg = the F18.68 bytes)
tools/sweep/README.md · .github/workflows/verify.yml
CHANGE_LEDGER.md                                 new
LEDGER.md · NOTES.md · CLAUDE.md                 registers
research/FINDINGS_ESTIMATE_SHEET_b191423.md      cherry-picked from the recon branch
research/HANDOFF_ESTIMATE_SHEET_b191423.md       cherry-picked from the recon branch
research/HANDOFF_ESTIMATE_SHEET_AF.md            this file
```
