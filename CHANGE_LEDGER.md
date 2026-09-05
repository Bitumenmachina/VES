# CHANGE_LEDGER — Batches AF · AG · AH · AI (F18.69 → F18.72, TEST BUILD on `claude/estimate-sheet-depth-vrhnf6`)

Every product byte moved by this batch, keyed to the finding it answers in
`research/FINDINGS_ESTIMATE_SHEET_b191423.md` (the recon ledger; line numbers there are against F18.68) and to the
commission's rulings R1–R7. Anchors are function names — the durable handle; no line numbers are carried here.
Evidence column names the probe check (`tools/sweep/probe-af.mjs`) that proves the change on the bytes.
Batch AG (F18.70) rows follow the AF table, keyed to LEDGER.md §Batch AG (persona pass 1); Batch AH (F18.71) rows follow
those, keyed to LEDGER.md §Batch AH (persona pass 2); Batch AI (F18.72) rows follow, keyed to §Batch AI (pass 3). An evidence cell names only what the check asserts; a claim the
check does not reach says "by inspection".
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

## Batch AG — persona pass 1 fixes (F18.70)

| # | LEDGER row | surface | what moved | anchor | evidence |
|---|---|---|---|---|---|
| AG-1 | AG-T5 | engine | a line formula evaluating to exactly 0 gates `ZERO_QTY` (flagged, excluded, said); library drivers unchanged | `resolveItem` (after the BAD_QTY gate) | AF16 |
| AG-2 | AG-T8 | engine | the parser names the unexpected token and the one before it | `resolveExpr` | AF29 |
| AG-3 | AG-T7 · AG-G5 | write door | after a commit: the cue clears on a good line; with a typed qty the dormant formula is evaluated against the row's inputs and the cue says the typed qty stands and the verdict | `afterFormulaEdit` | AF20 · AF28 |
| AG-4 | AG-M1 | library | authored-item ids from the library's own counter; the Setup form too | `nextLibraryUserId` · `libraryUpsertItem` · `addAssemblyItem` | AF17 |
| AG-5 | AG-M7 | library | blank CSI / match code default to the assembly's | `libraryUpsertItem` | AF24 |
| AG-6 | AG-T10 | library | edit toast: the book changed, every takeoff priced from it follows, no project override written; desc fallback | `libraryEditItem` | AF29 |
| AG-7 | AG-M6 · AG-M9 · AG-G10 · AG-G9 | Library lens | per-cell accent vs the built-in seed (`.ov`, title carries the seed's value); "authored here" on non-seed items; match-code column instead of a second Description; ＋ Add beside the description; coarse-pointer rule; provenance said once | `renderLibraryLens` · CSS `.libgrid` | AF25 (accent, match code, ＋ Add position, "authored here"); the coarse rule and provenance-once by inspection (AF35 asserts the coarse rule for ＋ Add in AH) |
| AG-8 | AG-G1 · AG-G2 | toolbar | document-door pin `right: 342px` (three sites); segments drop their words under 720 px; the control's title says four lenses | CSS `#dataMenuWrap` pins · `.viewtoggle` media rule · markup | AF18 (1440: no overlap; 390: segments < 200 px); the 720 px breakpoint itself by inspection (AF34 asserts the phone pin in AH) |
| AG-9 | AG-G3 | grid | Escape in a cell reverts, blurs, stops at the cell, says "Reverted" | `moneyCellKeys` | AF19 (control) |
| AG-10 | AG-M2 · AG-T9 · AG-T11 | grid | derivation words carry the item waste; a FIXED formula reads "fixed Q"; "line value" vs "line formula"; the Formula cell title says what Q is; the Waste header says item waste; card and cell titles say "this takeoff's line value" | `derivSummary` · `derivCell` · thead · `recapEditCell` · `overrideInput` | AF21 (item waste in the words; the Waste header); "fixed Q", "line value", the Q title and the card/cell titles by inspection |
| AG-11 | AG-G6 · AG-G7 · AG-G8 · AG-T12 | entry row | measure select after the unit (markup + `GENTRY_WALK`); funnel line in the description cell; empty-row text; closest-name hint; case/dash-forgiving name match | entry-row markup · `libNameKey` · `libCondByLabel` · `libCondClosest` · `entryFunnelWords` | AF22 |
| AG-12 | AG-G12 · AG-T13 | waste door | non-number sentence; a refused value never stays in the box | `setConditionWaste` · `buildCondWasteRow` | AF23 |
| AG-13 | AG-T2 · AG-G16 | exports | qty needed numeric in the workbook; ladder labels "(× Pct)"; BOM trailing headers in Title Case | `exportEstimateXLSX` · `exportBOMCSV` | AF26 (numeric qty needed; a label carrying "Pct" and no "%" — the exact "(× Pct)" text by inspection); AF4 reads the BOM headers case-insensitively, so Title Case is by inspection |
| AG-14 | AG-M5 · AG-M10 · AG-T16 | landing · sheet foot · README | the derivation, the line formula and the Library lens are named; the scope is on the sheet foot | landing `.empty-safe` · `.gaddhint` · README | AF27 |
| AG-15 | AG-S2 | CI | probe-af fetches the F18.68 bytes by full sha; exit captured; step renamed | `.github/workflows/verify.yml` | CI run on the push |
| AG-16 | — | build stamp | `VES_BUILD = 'F18.70'` with the batch entry | `VES_BUILD` | — |

## Batch AH — persona pass 2 fixes (F18.71)

| # | LEDGER row | surface | what moved | anchor | evidence |
|---|---|---|---|---|---|
| AH-1 | AH-T2 · AH-M12a | engine | a number literal is digits with at most one point; anything else throws `bad number "…"` (was parseFloat's silent truncation) | `tokenize` (engine fence) | AF30 |
| AH-2 | AH-M12b | engine | `FUNC_ARITY`: ceil / floor / round / abs take exactly one argument; max / min one or more; a wrong count throws | `resolveExpr` `parseFactor` (engine fence) | AF30 (round/ceil with two arguments refused; max with two evaluates); the zero-argument guard is Batch AF's, by inspection |
| AH-3 | AH-M10 | engine · library | the unit gate prints "(no unit)" for a missing unit; `validateLibrary` refuses an empty unit and a production rate ≤ 0 | `resolveItem` UNIT_GATE · `validateLibrary` rule 3 | AF32 |
| AH-4 | AH-T1 | write door | a qty edit on a line carrying `qty_expr` calls `afterFormulaEdit` — the cue follows the row | `handleMoneyEdit` (numeric branch) | AF31 |
| AH-5 | AH-T3 | new takeoff | the reset clears the lens cue | `newTakeoff` | AF31 |
| AH-6 | AH-M6 | Library lens | `sel()` carries the seed-diff accent and title like `inp()`; `seedText` joins a pipe-list ref as shown; CSS `select.lib-edit.ov` | `renderLibraryLens` · CSS | AF32 (the driven-by select); the pipe-list join by inspection |
| AH-7 | AH-M9 · AH-T6 · AH-G4 | waste words · waste box | `pctWord` (two decimals) at the derivation, item-waste, journal, toast and assembly-waste sites; the box's `change` path toasts `wasteSaid` as Enter does | `pctWord` · `derivSummary` · `setConditionWaste` · `buildCondWasteRow` · `renderLibraryLens` | AF33 (row words, journal, blur toast); the item-waste and assembly-waste sites by inspection |
| AH-8 | AH-G9 | toolbar (phone) | under 720 px the four document-door pins read `right: 184px`; the Plan bar's expanded padding 250 px; `#btnDataMenu` never wraps | CSS media block after the pins | AF34 (the door's rect at 390 px, Estimate lens; AF40 in AI covers all four lenses at 390 and 720); the padding literal by inspection |
| AH-9 | AH-G2 | toolbar | `#segPlan` title; `aria-label` on all four segments | markup | AF34 |
| AH-10 | AH-G1 | grid | `tr.gated` on a gated row; tint + left bar | `renderEstimateGrid` · CSS `.estgrid tr.gated` | AF35 (the class); the tint rule by inspection |
| AH-11 | AH-G6 | Library lens | `button.libAddBtn` in the coarse-pointer rule | CSS `@media (pointer: coarse)` | AF35 (asserted where the emulation reports coarse) |
| AH-12 | AH-G7 | Library lens | `keydown` on `#libBody`: Escape reverts to `defaultValue`, blurs, toasts, stops; Enter commits via the change path with `libFocus` set so the re-render refocuses; Enter on the ＋ Add row clicks ＋ Add | lens key listener (boot) | AF35 (Escape reverts; Enter on a unit-cost cell commits and refocuses); Enter on the ＋ Add row by inspection |
| AH-13 | — | build stamp | `VES_BUILD = 'F18.71'` with the batch entry | `VES_BUILD` | — |

## Batch AI — persona pass 3 fixes (F18.72)

| # | LEDGER row | surface | what moved | anchor | evidence |
|---|---|---|---|---|---|
| AI-1 | AI-T1 · AI-M4 | engine · library | a density resolving to 0 gates `ZERO_QTY` (negative stays `BAD_DRIVER`); `validateLibrary` refuses density ≤ 0 | `resolveItem` (density branch, engine fence) · `validateLibrary` rule 3 | AF36 |
| AI-2 | AI-M2 | library | `validateLibrary` parses `qty_expr` against `ANY_NAME_SCOPE` (a Proxy answering 1 for any name); only the grammar's own refusals refuse | `validateLibrary` · `ANY_NAME_SCOPE` | AF37 ("RAW *" refused, "RAW * width" kept) |
| AI-3 | AI-M1 | identity | `libraryIdentity` names the seed when the fingerprint equals the seed's (`seedFp`, computed once); returns `seed`; the lens header's seed test reads it | `libraryIdentity` · `renderLibraryLens` | AF37 (name and header after change-and-back) |
| AI-4 | AI-M3 | Flags · grid | the Flags list falls back to `lineDisplayName`; `tr.gated` also on `NO_MATCH` rows | `renderAssembly` flags block · `renderEstimateGrid` | AF37 |
| AI-5 | AI-M5 · AI-M12 | waste | `pctWord` at four decimals; the box redisplays through it; `aria-label` on the box | `pctWord` · `buildCondWasteRow` | AF38 (journal, row, box value, aria); the toast sentence unchanged since AH (AF33) |
| AI-6 | AI-T4 · AI-T5 | exports | `basisOf(scope)` — six-decimal numbers, waste as percent — used by every branch incl. manual lines with a scope | `n6` · `basisOf` · `derivColumnsOf` | AF38 (grid CSV basis for a library line and a linked labor line); BOM and .xlsx share the writer, by inspection |
| AI-7 | AI-T6 · AI-M7 | engine · cue | a punct token where a factor is expected → `unexpected "*" — expected a number, a name or "("`; unknown token / function with a case-insensitive match → "names are case-sensitive; did you mean …"; the cue strips a trailing `.?!` before its own sentence | `resolveExpr` `parseFactor` (engine fence) · `afterFormulaEdit` | AF39 |
| AI-8 | AI-G3 | Library lens | Escape: an input with a draft reverts and says so; an untouched input or a select blurs silently; the key never reaches the window layer | lens key listener (boot) | AF39 (untouched cell silent; select keeps the lens — a control, the lens stayed open before too) |
| AI-9 | AI-G5 | toolbar (phone) | `body.sheet-live #brand small { display: none }` and `nowrap` under 720 px | CSS phone media block | AF40 (door clear of brand and segments, four lenses, 390 and 720 px) |
| AI-10 | AI-M8 | landing · README | "a library-priced line can carry its own formula and inputs (a free line is priced as typed)" | landing `.empty-safe` · README | AF40 |
| AI-11 | — | build stamp | `VES_BUILD = 'F18.72'` with the batch entry | `VES_BUILD` | — |

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
