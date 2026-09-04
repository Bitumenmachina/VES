# FINDINGS — Estimate sheet depth · recon on `b191423` (F18.68)

Recon only. No product byte, gate, probe, or register was edited. This file is the sole deliverable.
Every claim below carries `file:line` against the bytes named in §0; a claim with no line reference is in §7
(Remainder) as unverified. No diffs are proposed.

The commission's hard requirement — *formulas editable at the estimate line, and the sheet renders what it is
computing* — is carried into every lane as the question "where would that land, and what is in the way".

---

## 0. Scope — what was actually read

**Bytes.** `src/VES_PM.html`, 3,570,752 bytes, sha256
`494d288baa32a2ee192d28d7668ba87e17c9291607ff03708a5fdcb78cea3760` (matches CLAUDE.md §Identity and NOTES.md
§State for F18.68). HEAD `b191423`. Verifier and G0 were run read-only on these bytes; output verbatim:

```
$ node tools/ves-verify.mjs
IDENTITY 3570752 bytes sha256 494d288baa32a2ee192d28d7668ba87e17c9291607ff03708a5fdcb78cea3760
SYNTAX   20 blocks checked, 2 skipped, 0 failed
EGRESS   7 matches; baseline 7 entries; 0 new, 0 gone
FREEZE   2 regions; manifest absent; 0 mismatched, 0 missing
RESULT   PASS
exit=0

$ VES_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node gate/g0.mjs check src/VES_PM.html
  ✓ A == goldenA (assembly money path)
  ✓ B == goldenB (sell-ladder + R3)
  ✓ C == goldenA (save/reload inert)
  ✓ D == goldenA (schedule inert)
G0 GREEN
exit=0
```

**Module blocks read in full** (line ranges are the `<script data-ves-module=…>` spans):
`core` 2212–2724 · `engine` 2775–3170 · `library` 3171–3540 · `recap` 8875–9328 · `estimate-grid` 9329–9588.

**Read in part** (the named regions only): `interchange` 3560–3800 (column contracts, `libraryToTabs`,
`tabsToLibrary`, `validateLibrary`) · `state` 4130–4160 · `cards` 6740–6960, 7040–7096, 7180–7265, 7491–7519 ·
`assemblies` 7940–8170, 8195–8235, 8403–8513, 8540–8720, 8721–8745, 8780–8872 · `persistence` 9800–9860,
10095–10245, 10325–10348, 10495–10655, 10655–10850, 11310–11336 · `boot` 11650–11680, 11870–12170, 12479–12510 ·
markup 2040–2100.

**Harness and fixtures read in full** (by a read-only subagent, spot-checked here): `gate/g0.mjs`, `gate/gate.mjs`,
`gate/scenarioA–D.js`, `gate/goldens/goldenA.json`, `goldenB.json`, `fingerprints.json`, `tools/ves-verify.mjs`,
`tools/ves-verify.config.json`, `release/demo/demo-flat-roof.json`, `test/selftest.sh`, `test/fixture.html`, and the
money assertions of `tools/sweep/probe-v.mjs`, `probe-u.mjs`, `probe-ab.mjs`, `probe-ad.mjs`, `probe-z.mjs`,
`ladder-fuzz.mjs`. `NOTES.md`, `LEDGER.md`, `CLAUDE.md`, `gate/README.md`, `tools/sweep/README.md` read in full.

**Not read**: `proposal` (10965–11637), `schedule`, `viewer`, `grid-canvas`, `tools`, `condition-set`,
`condition-library`, `ledger`, `pdfjs` blocks; the rest of `cards`, `assemblies`, `persistence`, `boot`. See §7.

---

## 1. Lane 1 — Money path trace

### F1.1 The chain, in call order (measured quantity → sell)

| step | function | where | what it does to the number |
|---|---|---|---|
| 1 | `VESCore.measureValue` | `src/VES_PM.html:2247` | points × calibration → `m.value` (linear ft / SF / count). Manual door writes `value` directly: `addManualQuantity` `:8078`, `addManualLine` `:8143`. |
| 2 | `assemblyMeasured()` | `:8003` | sums `m.value` per `libRef` (`:8010`), pending excluded (`:8009`); a qty-linked adhoc line substitutes `dispQtyOf(rollupRow, source).qty` (`:8036–8041`). |
| 3 | `resolveAssembly()` | `:8057` | `VESASM.resolveTakeoff({ library: mergedLibrary(), measured, project: state.assemblyProject })` (`:8058`). |
| 4 | `resolveTakeoff` | `:3062` | per-condition sum `condValue` (`:3067–3071`); condition waste through the override stack CONDITION > PROJECT(`settings`) > ASSEMBLY(`overrides`) (`:3083–3092`); pitch (`:3096–3099`); `makeCQty(condValue × pitch, waste)` (`:3100`) → `{raw, adj = raw × (1+w)}` (`:2886`). |
| 5 | `resolveItem` | `:2902` | one line per item of each active assembly (`:3108–3116`). Driving base = `raw` for labor, `adj` for material (`:2922`). Override stack LINE > PROJECT > ASSEMBLY > ITEM > SCHEMA (`:2931–2937`). `qtyNeeded` = `qty_expr` → `resolveExpr` (`:2970`) · or `base / coverage` (`:2973`) · or `base × density` (`:2976`) · or `base` (`:2977`). Human `qty` override wins over all of it (`:2966–2967`). |
| 6 | `matchDispatch` | `:2890` | `unit_cost` from the stack; `NO_MATCH` if null/negative/non-finite (`:2892`). |
| 7 | `resolveItem` (cont.) | `:2997–3007` | `ordered`: labor = `qtyNeeded` or `qtyNeeded / production_rate` in hours (`:3002`); material = `CEIL(qtyNeeded × (1 + itemWaste))` (`:3005`). `extended = ordered × unitCost` (`:3007`). |
| 8 | `resolveGeneral` | `:3039` | flat general lines: `extended = qty × unit_cost` (`:3053`), gated on qty 0 / no cost / negative (`:3044–3045`). |
| 9 | `collectPricedLines` | `:9196` | filters `included && extended != null` (`:9202`), drops OFF lines by `lineOmitted(item)` (`:9203`), adds plain conditions from `VESCore.rollup` (`:9207–9212`; rollup at `:2375`, `extended = pQty × uc` `:2405`). |
| 10 | `recapModel` | `:9217` | sums by kind (`:9225–9227`), `cost = material + labor + equipment` (`:9230`), `VESCore.sellLadder(cost, oh, mk, pf)` (`:9231`). |
| 11 | `sellLadder` | `:2365` | multiplicative: `cost → +oh → +mk → +pf` (`:2367`), pct clamped ≥ 0 (`:2366`). Returns `sell` (`:2368`). |
| 12 | faces | HUD strip `:8223`; grid footer `:9552–9559`; recap Summary `:9279–9308`; bid `bidCollect` `:10527` → `bidCents` `:10663` → `bidRate` `:10681`; cost sheet `:10784`; CSV `:9393`; XLSX `:11310`. |

### F1.2 Estimate-unit → order-unit conversion is a formula evaluation, but the formula lives in the library only

The conversion is chosen at `:2969–2977` from three library-item fields — `qty_expr` (a string evaluated by
`resolveExpr` `:2836`), `coverage` (divide), `density` (multiply). Each is resolved through the override stack at
`:2939–2941`, so the engine already accepts a LINE-level formula. Nothing on any surface writes one (§3, F3.4), and the
takeoff load door strips one on read (`LINE_FORBID = ['qty_expr']` `:10144`). With no override, the conversion is a
baked library constant (`coverage: 200` `:3348`, `density: 1` `:3347`) or a baked library expression (`slate.fieldnails`
`qty_expr: '{ADJ * 515 / 100000}'` `:3505`).

### F1.3 Price unit cannot differ from order unit — there is no price-unit field

`unit_cost` is a bare number with no unit attached (item schema `:3574–3577`; `matchDispatch` `:2891`). `extended =
ordered × unitCost` (`:3007`) assumes the price is per `lineUnit`, which is `item.unit` (`:2997`) or `'hr'` when a
labor line carries a positive `production_rate` (`:3000`, `:3003`) — in that one case the same `unit_cost` field is
*reinterpreted* as `$/hr` (`:2992–2994`), and the recap Labor tab relabels the cell `$/hr` (`:8995`). A coil bought by
the pound and measured by the foot has no place to say "price is per LB, order is in LB, measure is in LF" except by
making the item's `unit` LB and pushing the LF→LB conversion into `density` or `qty_expr` (F1.2).

### F1.4 Every rounding, floor, or coercion on the path, in the order the number meets it

| # | where | operation | moves money? |
|---|---|---|---|
| a | `:3070` | `condValue += (typeof value === 'number' && isFinite) ? value : 0` — a non-number measurement contributes 0 | yes (guarded at the load door `:2580`, so only reachable by in-memory tampering) |
| b | `:2885` | condition waste `< 0` or non-finite → `0` | yes |
| c | `:3099` | pitch non-finite or `≤ 0` → `1` | yes |
| d | `:2943` | item waste `< 0` or non-finite → `0` | yes |
| e | `:2899`, `:3005` | `CEIL(n − 1e-9)` on material `ordered` — the **only rounding inside the engine that moves money** | yes |
| f | `:2913` | FIXED item `qty` non-number → `0` | yes |
| g | `:3042` | general `qty` invalid → `0` then gated (`:3045`) | gated, not priced |
| h | `:2366` | `Math.max(0, +pct || 0) / 100` — a string or negative pct coerces to 0 | yes |
| i | `:11658` | margin input `Math.max(0, +value || 0)` written to settings on every keystroke | yes |
| j | `:11883–11884` | money-cell ingress strips `$ , space %`, `Number(raw) / 100` for pct cells; rejects `< 0` (`:11885`) | yes |
| k | `:8827–8829` | pitch `rise/12` → `√(r²+144)/12`; rejects `< 1`; `\|v−1\| < 1e-9` deletes the override | yes |
| l | `:2359` | `fmtQty`: `Math.round(v × 100) / 100` | display only |
| m | `:9478`, `:8965`, `:8994`, `:6865` | qty cell shows `+(Math.round(ordered × 100) / 100)`; the raw edit value is that rounded figure (`data-raw` `:8941`) | display; **an edit commits the 2-dp figure as the `qty` override** |
| n | `:9481` | waste cell shows `(w × 100).toFixed(2)` | display |
| o | `:2350–2353` | `fmtMoney`: sub-cent negatives → `+0`, `toLocaleString` 2 dp | display |
| p | `:10668` | bid: per-line `Math.round(sell × 100)`; remainder walk to `round(exactSell × 100)` (`:10671–10676`) | paper only (Total pinned) |
| q | `:10683` | bid rate on a re-based row = `cents / 100 / qty` (derived), else `unitCost × mult` | paper only |
| r | `:8552–8568` | `apportionCents`: `Math.round(n × 100)` per part, terminal remainder onto the largest part | paper and grid footer (`:9553`) only |
| s | `:10806–10807`, `:10831–10833` | cost sheet: Cost and Sell pinned to `round(exact)`, ladder cells apportioned | paper only |
| t | `:9413–9414`, `:8727–8729`, `:11358` | CSV/XLSX: `unit_cost.toFixed(4)`, `extended.toFixed(2)`, `csvNum(qty, 2|4)`; XLSX rate `Math.round(rate × 100) / 100` | export only |

Finding on (m): the qty cell's `data-raw` is the *rounded* ordered quantity, so a user who focuses a derived qty
cell and presses Enter without typing commits nothing (`changed` test `:11958`), but one who retypes the shown figure
freezes the 2-dp value as a LINE `qty` override (`:6804`) — the derivation is replaced by its own rounded result.

### F1.5 Purity and mutation

`resolveTakeoff` writes nothing outside its own locals (`:3062–3128`); `resolveItem` reads `layers` and returns
(`:2902–3020`). The resolve is a pure function of `(mergedLibrary(), assemblyMeasured(), state.assemblyProject)`.

The path *around* it mutates state:

- `synthRegister` writes `conditionOverrides[cid] = { waste: 0 }` and `lineOverrides[itemId]` for every adhoc line
  (`:8095–8102`); `rebuildAdhoc` deletes and rewrites every `adhoc.*` override key (`:8104–8115`), and runs at load
  (`:10237`), on every adhoc line edit (`:6790`), and on undo/redo (`:6794–6795`, `:8158`, `:8163`).
- `bidCollect` mutates the line objects it receives with `pages`, `clientQty`, `clientQtyMeasured` (`:10541`,
  `:10582`, `:10591–10592`) — these are fresh objects from `collectPricedLines` (`:9204`), not engine lines.
- `mergedLibrary()` builds a fresh spread of the library on every resolve when adhoc lines exist (`:8047–8055`).
- `resolveAssembly()` appears at 14 call sites; one Estimate-grid render calls it at least twice (`estimateRows` →
  `recapData` `:9349`/`:8888`, then `recapModel` → `collectPricedLines` `:9439`/`:9197`), plus once per OFF-toggle
  note (`:9166`) and per fixed-allowance note (`:9248`). No memoisation (NOTES.md C-R1, parked).

---

## 2. Lane 2 — Library schema, as it exists on disk

### F2.1 Full field list an item carries today

From the seed (`:3346–3533`), the engine's reads (`:2902–3020`), the workbook column contract
(`COLS.items` `:3574–3577`) and the import parser (`:3705–3707`):

| field | type | read by engine at | in `.xlsx` contract | notes |
|---|---|---|---|---|
| `kind` | `material \| labor \| equipment` | `:2922`, `:2995`, `:3001` | yes | enum `:3563` |
| `cqty_ref` | condition id, `id[]`, or `'FIXED'` | `:2905–2906` | yes (pipe-list) | |
| `qty` | number | `:2911–2913` | yes | FIXED only (`:3787–3796`) |
| `unit` | free string | `:2960`, `:2997` | yes | validated only against the workbook's own declared set (`:3745`, `:3775`) |
| `unit_cost` | number ≥ 0 | `:2935`, `:2891` | yes | |
| `coverage` | number > 0 | `:2939`, `:2972` | yes | driver |
| `density` | number ≥ 0 | `:2940`, `:2975` | yes | driver |
| `qty_expr` | string (DSL) | `:2941`, `:2970` | yes | driver |
| `waste` | number | `:2942` | yes | **must be 0 in an imported library** (`:3779`) |
| `production_rate` | number | `:2944`, `:2995` | yes | labor only; seed all `null` |
| `crew_size` | number | — | yes | **read by no engine code** (only `:3576`, `:3707`, seed) |
| `csi` | string | `:3012` | yes | |
| `match_code` | string | `:3012` | yes | |
| `authority` | `OBS \| INF \| STD` | `:2935` | yes | |
| `note` | string | `:2904` | yes | |
| `verify` | string | `:3017` | yes | |
| `desc` | string | `:3011` | **no** | not in `COLS.items`; seed carries none; UI-authored items set it (`:8860`). **Lost on an `.xlsx` round-trip** (`libraryToTabs` writes only `COLS` columns `:3626–3633`; `tabsToLibrary` reads only the listed fields `:3705–3707`). Kept by the JSON export (`:8617`). |

Assembly: `label`, `csi`, `conditions[]`, `items[]`, `overrides.waste` (`:3683–3684`), and `itemOverrides`
(read by the engine at `:2934`; **no workbook column** — `COLS.assemblies` `:3569` carries `override_waste` only; reaches
the engine only via a JSON library import `:8689` or a hand-edited `ves:library`; never sanitized).

Condition: `assembly`, `label`, `geometry_type`, `unit`, `csi`, `tilde_schema[]`, optional `pitch` (`:3691–3694`);
`order` exists only in the workbook (`:3571`, `:3696`).

Library root: `schemaVersion: 'spec-v2'` (`:3190`, enforced on import `:3734–3735`, **not** on the localStorage
restore `:7951–7952`), `meta{name,trade,region,source,note}` (`:3191–3197`), `tildes.WASTE{label,default,authority}`
(`:3201–3203`).

### F2.2 Formulas versus baked constants

Three fields are formulas in the sense that the engine *computes* with them: `coverage` (divide `:2973`), `density`
(multiply `:2976`), `qty_expr` (evaluate `:2970`). They are mutually exclusive on import (`:3789–3796`). `unit_cost`,
`qty`, `waste`, `production_rate` are constants. Every seed conversion is a constant or a one-line expression; no seed
expression references anything but `ADJ` (`:3505`, `:3506`).

### F2.3 The expression language, as the evaluator actually accepts it (`:2819–2875`)

- **Tokens** (`tokenize` `:2822–2833`): whitespace (space, tab only); `+ - * / ( )`; a number is `[0-9.]+` fed to
  `parseFloat` (so `1.2.3` → `1.2` silently, no exponent form, no leading sign in the token); an identifier is
  `[A-Za-z_][A-Za-z0-9_]*`. **Any other character throws** (`:2830`) → `EXPR_ERROR` gate (`:2979`).
- **Grammar** (`:2820–2821`, `:2846–2870`): `expr := term (('+'|'-') term)*` · `term := factor (('*'|'/') factor)*` ·
  `factor := number | ident | '(' expr ')' | ('-'|'+') factor`. No functions (no `ceil`, `round`, `max`), no
  comparison, no conditional, no strings, no exponent operator.
- **Sugar**: outer `{…}` stripped (`:2840`); `~TOKEN~` rewritten to `TOKEN` (`:2841`).
- **Identifiers**: resolved against `scope` only (`:2864–2867`); unknown → throw. The scope is exactly four names —
  `RAW`, `ADJ`, `WASTE`, `Q` (`:2923`; FIXED items `:2914`). `library.tildes` is **not** injected: the comment "Tilde tokens
  usable in {expr}" (`:3199`) is true only for `WASTE`, and only because `cqty.waste` is put in scope. No reference to
  another condition, another item, the item's own `coverage`/`unit_cost`, or any per-line variable is possible.
- **Result** must be a finite number (`:2873`); trailing tokens throw (`:2872`).

### F2.4 Where labor lives

- Labor is a **per-item** line in an assembly's `items[]` (`:3212–3229`), `kind: 'labor'`, priced `unit_cost` per unit
  of the driving condition (`:3374–3386`) on the **raw** (un-wasted) quantity (`:2922`, `:2878`).
- **Production rate** is additive and optional: a positive `production_rate` turns `ordered` into hours
  (`qtyNeeded / rate` `:3002`), sets `unit = 'hr'` (`:3003`), and the same `unit_cost` becomes `$/hr` (`:2993`). Seed
  rates are all `null` (`:3375–3386`). A labor line may also carry `coverage` (slate labor per SQ `:3512–3514`), applied
  before the rate.
- **Fixed labor allowances** (mob, staging, super, fab) are FIXED items on the assembly (`:3388–3394`), emitted once the
  assembly has any traced condition (`:3106–3116`, `:3184`).
- **Adders**: none. There is no labor burden, no labor-specific markup, no labor-in-material factor. Downstream, the
  ladder applies to `cost = material + labor + equipment` as one number (`:9230–9231`; stated on the cost sheet
  `:10844`).
- `crew_size` is scaffolding the engine never reads (F2.1).

### F2.5 Per-line override: the schema has three of them, all keyed by library item id

| store | key | fields honoured | writer today |
|---|---|---|---|
| `assemblyProject.lineOverrides[itemId]` | item id | `unit_cost{value,authority}`, `qty`, `waste`, `coverage`, `density`, `production_rate`, `qty_expr` (engine `:2932`; door allows the first six `:10141`, forbids `qty_expr` `:10144`); `omit` (app-only, `:9146–9150`, never seen by the engine `:9142–9143`) | `editLine` `:6775–6815` (fields reachable from a cell: `unit_cost`, `qty`, `waste`, `production_rate`); `setLineOmit` `:9177`; `synthRegister` `:8098–8101` |
| `assemblyProject.settings.itemOverrides[itemId]` | item id | same fields, PROJECT level (`:2933`) | **none** — only the load door (`:10175`) and the engine touch it |
| `library.assemblies[asm].itemOverrides[itemId]` | item id | same fields, ASSEMBLY level (`:2934`) | none in the UI; JSON import only |
| `assemblyProject.conditionOverrides[libRef]` | condition id | `pitch`, `waste` (`:3092`, `:3098`; door `:10142`) | `setConditionPitch` `:8818`; `waste` written only as `0` by `synthRegister` `:8095` |

"Per line" and "per item" coincide today because each item resolves once per active assembly (`:3111–3115`). An item id
listed in two assemblies' `items[]` (validation requires membership in *some* assembly `:3761–3762`, not exactly one)
would emit two lines sharing one override record — see §8.

---

## 3. Lane 3 — Estimate grid render and edit path

### F3.1 What the grid reads, and how a row is assembled

`renderEstimateGrid` (`:9436`) → `estimateRows` (`:9348`) → `recapData` (`:8887`: `resolveAssembly()` + `VESCore.rollup`)
plus `state.assemblyProject.general` (`:9352`). Three row shapes:

- **engine row** (`:9354–9366`): `group, csi, sortKey, label = itemLabel(l), qty = l.ordered, unit, unitCost, waste =
  l.itemWaste (material only), total = l.extended, conf, np, div, edit: 'engine', item, kind, qtyOverridden, okey,
  omitted, srcCid, linkedTo`. Engine general lines are skipped here (`:9355`) in favour of the editable lane copy.
- **plain row** (`:9368–9372`): from the rollup, `edit: 'plain'`, `condId`, `kind: 'material'`.
- **general row** (`:9373–9385`): `edit: 'gen'`, money from `generalExt` (`:9380`), cells echo the store (`:9382`).

Seven rendered columns (`:9499–9503`): [omit box + confidence dot + label] · [kind + gesture buttons] · [qty] · [unit]
· [unit $] · [waste] · [total]. Footer from `recapModel()` with `apportionCents` (`:9552–9559`).

### F3.2 Which cells are editable, and how edits persist

| cell | rows | writer | persists as |
|---|---|---|---|
| qty | engine (`:9479`), gen | `handleMoneyEdit` `:11875` → `editLine(item,'qty')` `:11900` → `lineOverrides[item].qty` (`:6804`); gen → `setGeneralField` `:8797` | takeoff JSON `assemblyProject.lineOverrides` / `.general` (`:9842`, `:9845`) |
| unit $ | engine, plain (`:9484`), gen | engine → `lineOverrides[item].unit_cost = {value, authority:'OBS'}` (`:6804`); plain → `c.unitCost` (`:11891`); gen → `g.unit_cost` (`:8804`) | JSON `lineOverrides` / `conditions[].unitCost` / `general[]` |
| waste | engine **material only** (`:9480–9482`) | `lineOverrides[item].waste` (fraction; cell is pct `:9481`, `/100` at `:11884`) | JSON `lineOverrides` |
| on/off | every row (`:9492`) | `setLineOmit(okey)` `:9177` → `lineOverrides[key].omit` (`:9183`) | JSON `lineOverrides` (survives the door: non-numeric unknown keys pass `:10133–10134`) |
| ⌀ zero labor | labor rows (`:9489`) | sets the unit $ cell to `0` and dispatches `change` (`:12144–12147`) → `unit_cost` override `0` | JSON `lineOverrides` |
| production rate | **recap Labor tab only** (`:8992`), not the grid | `lineOverrides[item].production_rate` | JSON `lineOverrides` |
| pitch | card depth panel (`:6881–6928`) / plain ✎ editor (`:7528–7551`), not the grid | `conditionOverrides[libRef].pitch` (`:8829`) / `c.pitch` (`:7547`) | JSON `conditionOverrides` / `conditions[].pitch` |
| name, kind, unit, CSI (engine rows) | locked; the title says to edit in Setup (`:9496–9498`) | — | — |
| label, unit, CSI (general rows) | recap Equipment tab only (`:9024–9028`) | `setGeneralField` | JSON `general[]` |

Every engine edit is journaled (`:6806–6812`) and marked with the `ov` class + "project override — clear to revert"
(`:8946–8948`). A cleared cell deletes the key and, when the record is empty, the record (`:6803`).

### F3.3 The add-a-line flow, as built

Doors: `＋ Add a line` last row (`:9539–9542`), toolbar `#gAddLine` (`:12096`), and `＋ labor` on a material row
(`:9490`, `:12148–12158`). All open the same entry row (`:9513–9531`) with `geDesc` (datalist of library **condition
labels** `:9510–9512`), `geCsi`, `geKind`, `geQty`, `geUnit`, `gePrice`. Commit is `commitGridEntry` (`:12026`):

- **Library funnel** — if `geDesc` equals a library condition's label *exactly* (`libCondByLabel` `:11990–11996`):
  `addManualQuantity(condId, qty)` (`:12039`). Kind, unit, price and CSI are disabled while the name matches
  (`:12122–12131`). The typed quantity becomes a manual measurement on that condition (`:8078`), which **activates the
  whole assembly** — every item in its `items[]`, including every FIXED allowance (mob, super, freight, shop drawings)
  (`:3106–3116`, `:3184`). Nothing in the row says so.
- **Free line** — otherwise `addManualLine` (`:12062`): `type` is forced to `'count'` (`:12062`), `unit` is free text
  (`:8124`), kind material|labor (`:8125`), price → LINE override `{value, authority:'OBS'}` (`:8098–8100`) on a synthesized
  adhoc assembly/condition/item (`:8087–8103`). The quantity is a typed constant on a synthetic measurement (`:8143`).
- **＋ labor** — prefills the free-line path with `"<material> — labor"`, kind labor, the material's `ordered` qty and unit
  (`:12153–12155`), and arms a qty link (`geLinkArm` `:12150`) so the new adhoc condition follows the source condition's
  `dispQtyOf` quantity (`:8139`, `:8036–8041`). Unlink (entry row `:12159–12163`; card editor `:7492–7519`) freezes it.

What a user has to know that the row does not say: (1) an exact label match silently switches funnels and pulls in the
assembly's fixed allowances; (2) a free line has no formula and no waste (`conditionOverrides[cid] = {waste: 0}`
`:8095`); (3) a ＋ labor line is a separate adhoc line, not a property of the material item, so turning the material OFF
leaves the labor priced (D-25.2c note `:9165–9176`); (4) `type` is always `count`, so a free "LF" line is a count
condition wearing an LF label (`:12062`, `:8123`).

### F3.4 Nowhere in the render layer holds a formula string; the override marker exists per cell, not per row

- The engine line carries `coverage`, `density`, `qtyNeeded`, `productionRate`, `laborHours`, `qtyOverridden`
  (`:3013–3014`) but **not** the resolved `qty_expr` string (`qtyExpr` is a local at `:2941`, never emitted).
- `estimateRows` copies none of `coverage`/`density`/`qtyNeeded` into the row (`:9357–9366`); no render surface reads
  them (grep across the file: only `:6732`, `:8988–8995` read `laborHours`/`productionRate`; nothing reads `.coverage`,
  `.density`, `.qtyNeeded`).
- The only per-line "why" channels today are `title` attributes (`:8948`, `:9497`, `:9493`) and the `ov` class
  (`:8946`). The qty cell's accent is driven by the engine's `qtyOverridden` flag (`:8945`, `:3013`), which the engine
  sets **only for a numeric `qty` override** (`:2951`) — a `coverage`/`density`/`qty_expr` override would price the line
  and paint no accent on the qty cell.
- `editLine` accepts `qty_expr` by contract (`:6774`, `FIELD_WORD` `:6758`) but no cell, button or `VESApp` export
  (`:12479–12506`) calls it with that field. There is no programmatic door either.
- Precedents for adding a column or a trailing export field without breaking consumers: the conditional OH column on
  the cost sheet (`:10793–10794`), the trailing `kind` column on the grid CSV (`:9429–9433`), the trailing `Off` column on
  the BOM CSV (`:8724`).

---

## 4. Lane 4 — Gap report, by column

### F4.1 Material

**Exists.** Three conversion drivers in the library (F2.2); per-line `qty`, `unit_cost`, `waste` overrides from the grid
(F3.2); `CEIL` to whole buyable units (`:3005`); the client bid re-bases the row to the measured scope with a derived
rate (`:10577–10593`, `:10683`).

**Missing.**
1. The sheet shows `ordered` and `extended` only. `qtyNeeded`, the driver and its value are on no surface (F3.4).
2. No line-level formula edit exists (F3.4), and the takeoff door would drop one on reload (`:10144`, under the NEW-4
   ruling recorded at `:10100–10109`).
3. The in-app author form writes `coverage` or a FIXED `qty` only (`:8863–8864`); `density`, `qty_expr`, `production_rate`
   are reachable solely by exporting the workbook, editing it, and re-importing — which **replaces the whole library**
   behind a confirm (`:8663–8677`) and re-fingerprints every saved takeoff (`:9814`, banner `:10307–10310`).
4. **Condition-level waste has no UI door.** The Flags tab advises "key a waste %" when
   `conditionOverrides[cond].waste` is `null` or `0` (`:9072–9076`), but the only writer of that store is
   `synthRegister` setting `0` for adhoc lines (`:8095`); the grid's waste cell writes *item-level* `lineOverrides[item].waste`
   (`:9481`, `:6804`), which is applied at `:3005` and is not what the advisory reads. The advisory cannot be cleared
   from the UI on HEAD. (No other writer found by grep for `.waste =` / `waste:` outside the engine and interchange —
   see §7 for the limit of that search.)
5. **The coil case.** LF of profile → LB of coil needs `LF × stretch-out width (ft) × lb/SF(gauge)`. Stretch-out is per
   detail. Today it can be expressed only as (a) a library `density` in lb/LF for one fixed profile, or (b) a library
   `qty_expr` such as `{ADJ * 1.25 * 1.06}` with the width baked into the string. The DSL scope has no per-line variable
   (`:2923`) and no per-line override for one exists at the grid. The workaround the commission predicts (a side
   spreadsheet) is the only path on HEAD.

**What would have to change to surface the formula rather than the result.** The engine line must carry the driver it
used (a string or `{kind, value}`) — today that means emitting `qtyExpr` and the chosen driver at `:3013` (inside the
`engine` FREEZE fence, `:2794–3167`); `estimateRows` must copy it (`:9357`); the grid must render it (a cell or a title;
`:9499–9503`); the CSV/XLSX must carry it (trailing column, precedent `:9429–9433`); and either `editLine` gains a cell
calling it with `qty_expr` (`:6775`) and the door stops forbidding the key (`:10144`), or a new key is chosen (see §5,
F5.4). Whether that is an override or a marker is §6.

### F4.2 Labor

**Exists.** Per-line ON/OFF for every engine line including labor (`lineOmitted` `:9146`, checkbox `:9492`); ⌀ zero
(`:9489`, `:12144`); `production_rate` override (recap Labor tab `:8992`); ＋ labor adhoc line with a qty link (F3.3);
labor paid on raw, never on waste (`:2922`).

**On/off per line — is it expressible today?** Yes, at the granularity of a library item: `lineOverrides[itemId].omit`
(`:9183`), rendered struck (`:9499`), excluded from every money face at `collectPricedLines` (`:9203`), CSV (`:9400`), XLSX
(`:11317`), bid (`:10633`), and named on the bid's "Not included" list (`:10633`).

**What is not expressible, and what blocks it.**
1. *Labor as a property of a material line* (one row, labor on or off) — labor is always its own item (`:3212–3229`);
   there is no field on a material item that names its labor, and no line→line reference in the DSL (`:2923`). Blocker:
   schema, not UI. The codebase names this "Wave-3 N1/N2 schema territory" (`:9162–9164`, `:12079–12080`).
2. *Turning off the labor half from the material row* — D-25.2c only *says* the labor is still priced (`:9175`); the
   coupling is by display-name match (`:9172`), not by schema.
3. *A labor rate as a formula of the material* (e.g. `$/hr × hours-per-unit`) — `unit_cost` is a constant (`:2891`);
   `production_rate` is the one computed input and it only divides (`:3002`). No expression is evaluated for a price
   anywhere.
4. *Labor markup separate from material* — the ladder is one number over total cost (`:9231`, `:10844`).
5. *Crew size* — carried, never read (F2.1).

**What would have to change.** For the on/off question at line level, nothing — it is built. For labor to appear *inside*
a priced line as a factor, the item schema needs a labor sub-record or a cross-line reference in the DSL scope, both of
which are engine edits inside the FREEZE fence and outside anything G0 pins (§5).

### F4.3 General / recap

**Exists.** Flat general lines `qty × unit_cost` (`:3053`), editable on the recap Equipment tab and the grid (F3.2), gated on
zero qty and missing cost (`:3044–3045`); one margin authority (`:10527–10533`, `:11655–11658`); the ladder is multiplicative
and rendered as three rows on the recap (`:9292–9298`), the grid CSV (`:9422–9428`), the XLSX as live formulas
(`:11326–11330`), and the cost sheet (`:10835–10844`); paper components are apportioned to the pinned totals
(`:8552–8568`).

**Missing.**
1. A general line has no formula and no driver: `qty` is a number (`:8803–8804`; the door nulls anything else `:10191`).
2. No per-division or per-kind margin; no separate labor burden (F4.2 item 4).
3. The margin inputs write on every keystroke and are marked unjournaled (`:11658`, `:11676`).
4. The recap XLSX ladder formulas bake the percentages in as literals (`G${cRow}*${m.oh}` `:11327`) rather than
   referencing a cell — the workbook cannot be re-margined in Excel without editing three formulas.

**What would have to change to surface the formula.** The ladder's formula is already rendered as three labelled rows
with percentages (`:9289–9298`); the gap is the general line's *quantity*, which would need the same driver treatment as
F4.1 — or a `qty_expr` on a general line, which `resolveGeneral` does not read (`:3041–3042`).

---

## 5. Lane 5 — Regression boundary

### F5.1 Which golden fixtures cover the money path, and what they assert

G0 (`gate/g0.mjs`) compares **only** `{ recap, lines }` with keys sorted (`gate/g0.mjs:25–30`); `inputs` is discarded.
Four assertions (`gate/g0.mjs:128–131`): A == goldenA, B == goldenB, C (snapshot → `loadFromData`) == goldenA, D (schedule
injected) == goldenA.

- **recap**: 12 keys — `material, labor, equipment, cost, oh, mk, pf, ohAmt, mkAmt, pfAmt, sell, lineCount`
  (`gate/scenarioA.js:26–31`; `gate/goldens/goldenA.json:10–23`). `groups`, `divs`, `off`, `excluded` are dropped by the
  mapper.
- **lines**: the mapper picks 9 keys — `desc, csi, kind, ordered, unit, unitCost, extended, included, matchStatus`
  (`gate/scenarioA.js:20–23`). **Golden A carries 8**: `desc` is absent from all 23 lines
  (`gate/goldens/goldenA.json:25–34`; `grep -c '"desc"' goldenA.json` → 0) because seed items have `note` and no `desc`
  (`src/VES_PM.html:3346`) and `JSON.stringify` drops `undefined`. Golden B has it (`goldenB.json`, 1 match). So golden A
  pins **no line identity**: not `item`, not `desc`, not `drivingRefs`, not `qtyNeeded`, not `itemWaste`, not
  `qtyOverridden`.
- Fixture: one SSMR assembly at a typed 3150.8 SF, ladder 10/8/5, **no overrides of any kind**
  (`gate/scenarioA.js:10–17`). Scenario B: one manual line 100 × $10 (`gate/scenarioB.js:9`).
- `fingerprints.json` is written at `create` and **never read by `check`** (`gate/g0.mjs:110–115` vs `:125–136`): the
  scenario files and the reference build hash are not verified at gate time.
- The FREEZE fence over `core` (`:2216–2723`) and `engine` (`:2794–3167`) computes hashes but compares them to nothing —
  `tools/freeze-manifest.json` does not exist (`ls` → no such file), and the verifier's absent-manifest branch pushes no
  finding (`tools/ves-verify.mjs:191–193`). Today an edit inside either fence passes the verifier; only G0 would catch it,
  and only on the ssmr/10-8-5/no-override fixture.

Money assertions outside the gate (sweep probes, run by CI's `probes` job but not part of G0): probe-v V2 pins the demo
sell `64620.46` (`tools/sweep/probe-v.mjs:22`); probe-u U0/U1a/U1b/U1e/U1g pin the qty-link and Unlink quantities and
`extended` (`probe-u.mjs:39, 53, 54, 68, 84`); probe-z Z4 pins Σ peek sells == recap sell (`probe-z.mjs:29`); probe-ab AB1–AB3
pin the client workbook, the fingerprint banner and the CSV ladder (`probe-ab.mjs:27, 33, 38`); probe-ad AD2 pins the
Estimate XLSX formulas (`probe-ad.mjs:29`); `ladder-fuzz.mjs` tests a local copy of `sellLadder`, not the product.

### F5.2 Which lanes touch code those fixtures depend on

| lane | code it would touch | fixture that pins it |
|---|---|---|
| L1 engine arithmetic (`CEIL` `:3005`, `matchDispatch` `:2890`, `sellLadder` `:2365`) | G0 A/B/C/D on `ordered/extended/unitCost/sell` | a change here is RED by design ("goldens are absolute", NOTES.md §Method rails) |
| L1/L2 engine **line object shape** (`:3009–3019`) | none — G0's mapper copies 9 named keys; a new key is invisible | adding `qtyExpr`/`driver` to the line is G0-neutral; it is only a FREEZE question, and FREEZE gates nothing today (F5.1) |
| L2 `resolveExpr` scope (`:2923`) | none on the seed (no seed expression uses anything but `ADJ`) | probe-u exercises no expression either |
| L3 `estimateRows` / `renderEstimateGrid` (`:9348–9571`) | probe-u U1g (entry row), probe-ab AB3 (CSV footer), probe-ad AD2 (XLSX) | all read the footer/exports, not the row shape |
| L3 `editLine` (`:6775`) | probe-u (qty via the entry row), none for `qty_expr` | |
| L4 `lineOmitted` (`:9146`) | probe-z Z4 attributes OFF lines; G0 sets none | |
| L5 door `sanitizeMoneyStore` (`:10119`) | G0 C round-trips an override-free file; probe-v V3 asserts drops on conditions/measurements, not overrides | a change to `LINE_FORBID` is covered by **no** probe on HEAD |

### F5.3 Serialized takeoff JSON: what line-level formula state would change

`snapshot()` writes `assemblyProject.lineOverrides` verbatim (`:9842`); a new key on an override record is serialized
with no code change. The takeoff `version` stays `3` (`:2534`, `:9819`).

### F5.4 Would legacy saves still load clean — both directions

- **New build reading old files**: a file with no formula key resolves to the library default at `:2941` (`ov(...,
  item.qty_expr)`); `assemblyProject: null` on v1/v2 files is skipped (`:2613`, `:10209`). Clean.
- **Old build (F18.68) reading new files**:
  - if the new state reuses the key `qty_expr` on `lineOverrides` or `settings.itemOverrides`: F18.68 deletes it, counts it
    under "unsupported override field" (`:10129`, `:10225`) and raises the persistent drop banner (`:10231`, `:10316–10320`).
    The line re-prices from the library. Loud, not silent — but the estimator's formula is gone on that machine.
  - if a new key name is used (any string-valued key): F18.68's `scrubFields` passes an unknown non-numeric key
    through (`:10133–10134`) and the engine ignores it. Silent, and the line prices from the library.
  - if `TAKEOFF_VERSION` were bumped to 4: F18.68 **refuses the file** (`:2540–2541`). Note the ceiling is checked only
    when `version` is a number — `"4"` or `null` passes (`:2540`).
  - `conditionOverrides` has no forbid list (`:10162`): a formula key placed there would survive F18.68's door untouched
    — but `resolveItem` builds no `CONDITION` layer (`:2931–2937`), so it would be inert there anyway.
- Golden C (`snapshot → loadFromData`) stays green as long as the *serialization of existing keys* is unchanged; it does
  not assert the file's shape (`gate/g0.mjs:30` drops `inputs`; no schema compare anywhere — `tools/ves-verify.mjs` has no
  JSON check).

---

## 6. Ruling deferred to Patrick — where the decision would land, and what each costs

The question: when a line formula is edited, is it a silent override of the library value, or does the line carry a
visible override marker? Under each option, the sites the decision touches on HEAD:

### Option A — silent override (formula replaces the library derivation; the sheet shows the result)

| what | where | cost |
|---|---|---|
| engine | nothing — `resolveOverride` already returns a LINE `qty_expr` first (`:2804–2813`, `:2941`) | none inside the FREEZE fence |
| write door | `editLine(item, 'qty_expr', string)` (`:6804` stores non-`unit_cost` values raw) from a new cell | one cell + one handler branch (`:11884` currently coerces every `recap-edit` value to a number — the string must bypass that) |
| load door | remove `'qty_expr'` from `LINE_FORBID` (`:10144`) and rewrite the NEW-4 rationale (`:10100–10109`) | **reverses a recorded P-CODE ruling** (NEW-4, LEDGER via NOTES.md queue item 7); needs a LEDGER row |
| render | the qty cell shows `ordered` as today; `over` for the qty cell reads `line.qtyOverridden` (`:8945`), which the engine sets only for a numeric `qty` (`:2951`, `:3013`) → **no accent**, unless the cell also reads `isLineOverridden(item, 'qty_expr')` (`:6747`) | one condition in `recapEditCell`; or a new engine flag (fence) |
| exports | grid CSV / XLSX / BOM write the result only (`:9412`, `:11320`, `:8727`) | none |
| what the estimator sees | a number that no longer follows the library, distinguishable only if the accent is wired | the failure the commission names: the sheet shows results, not the math |

### Option B — visible marker (the line says it is on its own formula; optionally shows the formula)

Everything in A, plus:

| what | where | cost |
|---|---|---|
| marker source | either the engine emits `qtyExpr` / a `driver` field at `:3013` (FREEZE fence; G0-neutral per F5.2), or a consumption-side helper reads `lineOverrides[item].qty_expr` on the pattern of `lineOmitted` (`:9146`) — no engine touch | fence edit vs. a second read of the override stack outside the engine (the "M-5" pattern the code warns against at `:9270`) |
| row model | `estimateRows` adds the field (`:9357–9366`) | one line |
| grid | a marker in the qty cell (pattern: `linkMark` ⛓ `:9493`) and/or a title (`:8948`); a formula cell would be an 8th column (`:9499–9503`; `colspan="7"` at `:9476`, `:9531`, `:9539`, `:9544`; the subtotal row's six spacer cells `:9505`) | every `colspan`, the subtotal row and the footer |
| exports | trailing column on the grid CSV (`:9412–9415`, header `:9433`) and XLSX (`:11320`, `:11331`); BOM CSV (`:8724–8731`) | additive, precedent `:9429–9431` |
| card depth row | `buildDepthRow` has no slot (`:6834–6876`) | optional |
| client paper | must **not** show it (D-24.2 sell-only `:10522–10526`); cost sheet may (`:10798–10801`) | one conditional |
| peek | `moneyPeekModel` (`:6636`, not read) | unverified |
| probe | a red-first probe row per surface (NOTES.md §Method rails) | ~6 surfaces |

**The commission's own requirement decides more than the marker.** "The sheet renders what it is computing" is not met
by either option unless the engine line carries the expression and its inputs (`RAW`/`ADJ`, the driver value) — today
the line carries `coverage`, `density`, `qtyNeeded` (`:3013–3014`) but not the expression string. That is a FREEZE-fence
edit under both options, or a second evaluation of the override stack outside the engine.

---

## 7. Remainder — not verified, and why

1. **No runtime exercise of any lane claim beyond G0 and the verifier.** Every "editable / not editable", "no UI door",
   "no surface renders X" statement is from reading bytes and grep, not from driving the file. A probe could confirm F4.1
   item 4 (condition waste unreachable) and F3.4 (no formula door) in minutes; none was written (recon only).
2. **Modules not read** (§0): `proposal`, `schedule`, `viewer`, `grid-canvas`, `tools`, `condition-set`,
   `condition-library`, `ledger`, `pdfjs`, and the unread spans of `cards`, `assemblies`, `persistence`, `boot`. A writer
   of `conditionOverrides[…].waste`, a reader of `qtyNeeded`, or a formula surface could exist there. The grep for
   `\bwaste\b`, `\.coverage|\.density|\.qtyNeeded|\.productionRate|\.qty_expr`, `editLine`, `lineOverrides[` was
   file-wide, so a *literal* reference elsewhere would have shown; a dynamic access (`o[field]`) would not.
3. **`moneyPeekModel`** (`:6636`) and the proposal's scope list were not read; whether they render any derivation is
   unverified.
4. **XLSX `desc` loss (F2.1)** is inferred from the column contract and both parsers; no round-trip was performed.
5. **Two-assembly item sharing (F2.5, §8)** — validation permits it (`:3761–3762`); whether the seed or any real
   library does it was not checked.
6. **`layers.CONDITION` absence in `resolveItem`** (F5.4) was read at `:2931–2937`; whether any other caller of
   `resolveOverride` supplies one for items was not traced.
7. The subagents' reports were spot-checked (G0 compare key, golden A `desc`, `fingerprints.json` unread at check,
   `freeze-manifest.json` absent, `LINE_SPEC`/`LINE_FORBID`, `scrubFields` pass-through); their remaining line citations
   were not individually re-read.
8. **CI's `probes` job composition** (which probes run on push) was not read past the workflow's first 60 lines.

---

## 8. Residual risk — what could still be wrong in the above

1. **Grep negatives.** "No UI door writes X" rests on literal-string search of one 12,523-line file. A door built as
   `editLine(id, someVariable, v)` or `store[key][field]` with `field` from data would not match. The `handleMoneyEdit`
   path is data-driven (`i.dataset.field` `:11900`), so a cell with `data-field="qty_expr"` anywhere in unread markup would
   reach `editLine` — the grep for `data-field=` was not exhaustive over the unread modules.
2. **The FREEZE fence gates nothing on HEAD** (F5.1). Any recommendation phrased as "that is inside the fence" is a
   statement about the *intended* boundary, not an enforced one, until Patrick writes the manifest.
3. **Golden A pins no line identity** (F5.1). A change that re-points a line at a different item while preserving
   `csi/kind/ordered/unit/unitCost/extended` is G0-green; the boundary is narrower than "byte-identical pricing" reads.
4. **Item-id-keyed overrides** (F2.5). If a library lists one item id under two assemblies, both lines share one
   override record and one `omit` flag; the grid keys rows by `item` (`:9363`, `:9568`). Not observed, not excluded.
5. **Rounding (m) in F1.4** — the claim that retyping a shown 2-dp qty freezes it as an override follows from
   `data-raw` (`:8941`) and the `changed` test (`:11958`); the exact keystroke sequence was not exercised.
6. **Line references drift.** Every `:NNNN` is against the sha256 in §0. Any later batch invalidates them; the function
   names beside each reference are the durable anchor.
7. **Subagent scope.** Two read-only agents contributed the harness and persistence tables; where their reading and
   mine could be compared they agreed, but their unchecked citations carry their own error rate.
