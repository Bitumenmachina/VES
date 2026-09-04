# CHANGE_LEDGER — Batch AF (F18.69, TEST BUILD on `claude/estimate-sheet-depth-vrhnf6`)

Every product byte moved by this batch, keyed to the finding it answers in
`research/FINDINGS_ESTIMATE_SHEET_b191423.md` (the recon ledger; line numbers there are against F18.68) and to the
commission's rulings R1–R7. Anchors are function names — the durable handle — with the F18.69 line as of this write.
Evidence column names the probe check (`tools/sweep/probe-af.mjs`) that proves the change on the bytes.
Synthetic aliases only. No client, project, address, or job dollar figure.

Standing: branch, never `main`. Acceptance is Patrick's cold run of the coil case (commission §5); nothing here is
"done", it is built and gated.

| # | finding / ruling | surface | what moved | anchor | evidence |
|---|---|---|---|---|---|
| AF-1 | F3.4 · R1 · R2 | engine | `resolveItem` emits `driver` {kind, value, level, exprLevel, paramsLevel, expr, params, scope}; `gateLine` carries the driver it tried (or `NO_DRIVER` for the FIXED gate that fires before a scope exists); `resolveGeneral` emits `flat` | `resolveItem` · `gateLine` · `resolveGeneral` (engine fence) | AF1 · AF2 · AF9 |
| AF-2 | F2.5 · R1 (level truth) | engine | the item's own coverage / density / qty_expr / params sit on `layers.ITEM` instead of riding in as `resolveOverride`'s SCHEMA default — resolved values identical, level reads ITEM | `resolveItem` layers | AF1 (`level: 'ITEM'`) · G0 4/4 |
| AF-3 | F2.3 · F4.1-5 · R4 | engine | per-line `params` merged key by key ITEM < ASSEMBLY < PROJECT < LINE **outside** `resolveOverride` (it misreads an object with a key named `value`); names checked at evaluation only, inside the branch a typed qty does not take; scope = RAW ADJ WASTE Q + params | `resolveItem` (params block) | AF2 · AF3 · AF8 |
| AF-4 | F2.3 · R4 (executor's call) | engine | closed function set `ceil floor round abs max min`; tokenizer accepts `,`; `IDENT (` was already an error, so no valid expression changes meaning; `VESASM` exports FUNCS · SCOPE_NAMES · RESERVED_NAMES · PARAM_NAME | `tokenize` · `resolveExpr` · VESASM export | AF2 (scope) · G0 4/4 |
| AF-5 | F1.2 · F5.4 · R3 (NEW-4 reversed) | load door | `LINE_FORBID = []`; `LINE_SPEC` gains typed rules `qty_expr: 'expr'` (string ≤ 500) and `params: 'params'` (≤ 50 identifier-named finite numbers, rebuilt clean); rationale block rewritten; banner wording "out-of-range or malformed value"; both `lineOverrides` and `settings.itemOverrides` covered | `sanitizeMoneyStore` · `scrubFields` | AF6 · AF7 (old build: "unsupported override field") |
| AF-6 | F3.2 · F3.4 | write door | `editLine` accepts `qty_expr` (string) and `params` (object) with journal labels in the estimator's words; a manual line gets a toast instead of a silent no-op; `handleMoneyEdit` gains a text branch before the money strip (no `$,%` coercion, same `gridFocus`); `parseParamsText` names a bad pair; `afterFormulaEdit` says the engine's gate reason in the lens cue | `lineEditLabel` · `editLine` · `parseParamsText` · `afterFormulaEdit` · `handleMoneyEdit` | AF2 · AF3 · AF9 |
| AF-7 | F3.1 · F3.4 · R1 | Estimate grid | 8th column **Formula**: marker chip (`.dmark[data-level]`: library / project / line formula / typed qty / manual line), the derivation in trade voice (`derivSummary`), the gate reason, two text cells `.fx[data-field=qty_expr]` and `.fxp[data-field=params]` (none on manual lines); every `colspan` 7 → 8, subtotal spacer, entry row cell; split-mode CSS hides column 7 with the other secondary columns | `estimateRows` (driver, gate, status, qtyNeeded, condUnit) · `derivCell` · `renderEstimateGrid` · thead · CSS `.estgrid td.deriv` | AF2 · AF3 · AF8 · AF9 |
| AF-8 | F1.4 (m) | grid · recap Materials · recap Labor | the qty cell's `data-raw` carries the full-precision `ordered`; the display stays 2 dp | `moneyInputAttrs(rawOverride)` · `qtyDisp2` · `recapEditCell` · `renderEstimateGrid` · `renderRecapMaterials` · `renderRecapLabor` | AF13 |
| AF-9 | F1.3 · R5 | grid · recap · cost sheet | "Unit $ / order unit" (title: $/hr where a rate is set; no separate price unit exists) | thead · `renderRecapMaterials` · recap summary · `printCostSheet` header · Estimate .xlsx header | AF5 (`costHead`) |
| AF-10 | F3.3 | add-a-line | `#geMode` states the funnel before ✓ Add — a library match names the assembly, item count and fixed allowances with their sum (each priced by `VESASM.resolveItem`, never re-implemented) and whether the assembly is already on the estimate; `#geType` (count / area / linear) follows the unit (`measureForUnit`) and is editable; `commitGridEntry` passes it instead of the forced `'count'`; `GENTRY_WALK` and the label-lock list include it | `entryFunnelWords` · `refreshEntryMode` · `measureForUnit` · entry-row markup · input listener · `commitGridEntry` · `GENTRY_WALK` | AF10 |
| AF-11 | F4.1-4 (executor's pick: add the door) | Condition detail panel | `setConditionWaste(libRef, pct)` — pct as typed, 0/blank deletes, negative refused (D-26.2 parity), **journaled** with prior/next (unlike the pitch setter's unjournaled fallback); `input.cond-waste` row beside pitch, library conditions only (plain conditions are priced by `VESCore.rollup` with no waste — a door there would be dead) | `setConditionWaste` · `buildCondWasteRow` · `buildDepthPanel` | AF11 |
| AF-12 | F3.4 (precedent) · F4.3-4 | exports | grid CSV: trailing `driver, formula, params, qty_needed, basis`; Estimate .xlsx: A–H unchanged, **I = Pct** holding the ladder fractions with the formulas multiplying by that cell (`G{c}*I{o}` …), then J–N the derivation; BOM CSV: the same five trailing columns on the engine record | `DERIV_HEADERS` · `derivColumnsOf` · `exportGridCSV` · `exportEstimateXLSX` · `exportBOMCSV` | AF4 · AF9 (CSV gate text) · probe-ab AB3 · probe-ad AD2 |
| AF-13 | D-24.2 (client paper shows none of it) | bid · proposal · client review .xlsx | no change — asserted | — | AF5 |
| AF-14 | F4.2-2 · R6 | ＋ labor coupling | `offLineLaborNote` reads the reference first (the labor line's adhoc condition `qtyLink` → the material's driving condition); display-name match stays as the fallback for library pairs; the note names each sibling | `offLineLaborNote` | AF14 |
| AF-15 | F2.1 · F4.1-3 · R7 | Library lens | third full-screen lens `#libview` (segment, `L`, Esc, back; toolbar frozen like the other lenses): header names the library, its fingerprint and provenance (built-in seed labelled "standards, not quotes"); every item with every field editable in place; every assembly's list, waste override and item-override count; a ＋ item row per assembly in EDGE order; edits validated by `VESX.validateLibrary` on a clone and refused with its words on the row (one driver per item), then `persistLibrary()` — the library, never the project | `showLibrary` · `renderLibraryLens` · `libraryCommit` · `libraryEditItem` · `libraryUpsertItem` · `libEditValue` · markup `#libview` · CSS | AF12 |
| AF-16 | F2.1 (desc lost on round-trip) | interchange | `COLS.items` gains `desc` and `params` (`kv` column, `name=value|…`); `tabsToLibrary` reads both; `validateLibrary` checks params (identifier names, not reserved, finite) and `qty_expr` type | `COLS` · `libraryToTabs` `cell()` · `tabsToLibrary` · `validateLibrary` rule 3 | AF12 (`rtDesc`, `rtParams`) |
| AF-17 | commission ("no … VESApp export") | VESApp | additive: `editLine, isLineOverridden, setConditionWaste, showLibrary, renderLibraryLens, libraryEditItem, libraryUpsertItem, exportGridCSV, exportEstimateXLSX, estimateRows, parseParamsText` | `window.VESApp` | (probes call the globals; the doors exist) |
| AF-18 | — | build stamp | `VES_BUILD = 'F18.69'` with the batch entry; hotkey card row for `L`; seed `tildes` comment states the scope | `VES_BUILD` · `openHotkeys` · `VES_LIBRARY.tildes` | — |

## What did not move (commission §6)
G0's twelve recap keys and eight line keys (4/4 on every commit) · probe-v V2 demo sell 64,620.46 · probe-u's four
quantities · probe-z Z4 · probe-ab AB1–AB4 · probe-ad AD1–AD5 · the rounding inventory (F1.4: the batch adds no
rounding; a line formula lands before `CEIL` at the material `ordered` step; the six DSL functions are the
estimator's own rounding, typed) · takeoff JSON `version` 3 · egress baseline 7 entries, 0 new · the seed library
object (so `libraryIdentity()` on an untouched browser is unchanged).

## Not done, stated plainly
- No `.claude/agents/p-*` persona pass was run on this build (the commission asked for red-first probes per surface;
  persona passes are the wave's, not the batch's).
- The card depth row's qty input (`buildDepthRow`) still shows and edits the 2-dp figure — it is a number input with no
  raw/display split; the grid and recap cells are the sites the ledger named (F1.4 m lists four; three are fixed, this
  one is recorded).
- The money peek shows `ordered` only (unchanged).
- Assembly-level `itemOverrides` from a JSON library import are still unsanitized (F2.1 note) — out of this batch.
