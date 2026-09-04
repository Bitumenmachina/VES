# HANDOFF — Estimate sheet depth recon · review guide and pickup

Companion to `research/FINDINGS_ESTIMATE_SHEET_b191423.md` (the ledger). This file exists so a reviewer can check the
ledger's load-bearing claims in minutes, and so the next seat can pick the work up cold. It adds no finding the ledger
does not carry; every line reference is against the same bytes.

Standing: recon only. Nothing in the product, gates, probes or registers was edited by this commission. The branch
carries two research files and nothing else. No pull request was opened.

---

## 1. What this is, in one paragraph

The takeoff half of VES resolves a measured quantity into money through one pure engine call, and every money face reads
that call. The estimate half shows the engine's *results* and hides the *derivation*: the conversion from measured unit
to ordered unit is a library constant or a library expression, no surface renders which one ran or with what, and no
door — cell, button, or `VESApp` export — lets an estimator put a formula on a line. The engine itself already accepts
one at the LINE level; the load door deletes it on read under a recorded ruling. The regression boundary that would fence
a change here is narrower than its name: the golden gate pins no line identity, and the freeze fence compares its hashes
to a manifest that does not exist.

---

## 2. Identity of what was reviewed

| item | value |
|---|---|
| product | `src/VES_PM.html` · 3,570,752 bytes · sha256 `494d288baa32a2ee192d28d7668ba87e17c9291607ff03708a5fdcb78cea3760` |
| build / HEAD | F18.68 · `b191423` (Batch AE) |
| verifier on those bytes | `RESULT PASS` · `FREEZE 2 regions; manifest absent` · exit 0 |
| G0 on those bytes | `G0 GREEN` 4/4 · exit 0 |
| ledger | `research/FINDINGS_ESTIMATE_SHEET_b191423.md` — 8 sections, 5 lanes, §7 remainder, §8 residual risk |
| this file | `research/HANDOFF_ESTIMATE_SHEET_b191423.md` |
| branch | `claude/ves-estimate-sheet-recon-pe0sbr` |

If `src/VES_PM.html` no longer carries that sha256, every `:NNNN` below and in the ledger is stale; the function names
beside each reference are the durable anchor.

---

## 3. Reviewer's checklist — the ten claims that carry the weight, and how to see each one

Each row is one claim, the bytes that prove it, and a command that shows those bytes without trusting either document.
Run from the repo root. Expected output is stated so a mismatch is a finding against the ledger.

| # | claim (ledger §) | see it | expect |
|---|---|---|---|
| 1 | The engine resolves a LINE-level `qty_expr` (F1.2) | `sed -n '2939,2941p' src/VES_PM.html` | three `ov(...)` lines for `coverage`, `density`, `qty_expr` |
| 2 | The load door forbids exactly that key (F1.2, F5.4) | `sed -n '10141,10144p' src/VES_PM.html` | `LINE_SPEC` without `qty_expr`; `LINE_FORBID = ['qty_expr']` |
| 3 | No door writes `qty_expr` — no cell, no export (F3.4) | `grep -n "qty_expr" src/VES_PM.html \| awk -F: '$1>4045'` | hits only at 6758 (a label map), 6774/6852 (comments), 10102–10144 (the door), 12440 (the build-stamp comment); no `data-field`, no `editLine(...,'qty_expr'` |
| 4 | `editLine` is not on `VESApp` (F3.4) | `sed -n '12479,12506p' src/VES_PM.html \| grep -c editLine` | `0` |
| 5 | The expression scope is four names (F2.3) | `sed -n '2914p;2923p' src/VES_PM.html` | `{ Q, RAW, ADJ, WASTE }` and `{ RAW, ADJ, WASTE, Q }` |
| 6 | The qty cell's accent follows a numeric `qty` override only (F3.4, §6) | `sed -n '2951p;3013p;8945p' src/VES_PM.html` | `hasQtyOv` is a number test; the line carries `qtyOverridden: hasQtyOv`; the cell reads `line.qtyOverridden` for `qty` |
| 7 | Condition-level waste has no UI writer (F4.1 item 4) | `grep -nE "conditionOverrides\[[^]]+\]\s*=" src/VES_PM.html` then `sed -n '9075,9076p'` | one writer at 8095 (`{ waste: 0 }`); the Flags advisory reads that store |
| 8 | Golden A pins no line identity (F5.1) | `grep -c '"desc"' gate/goldens/goldenA.json; sed -n '30p' gate/g0.mjs` | `0`; `money = (o) => stable({ recap: o.recap, lines: o.lines })` |
| 9 | The freeze fence compares to nothing (F5.1) | `ls tools/freeze-manifest.json; sed -n '191,193p' tools/ves-verify.mjs` | no such file; the absent branch pushes no finding |
| 10 | Price has no unit of its own (F1.3) | `sed -n '3574,3577p;3007p' src/VES_PM.html` | item columns carry `unit` and `unit_cost`, no price unit; `extended = ordered * match.unitCost` |

A reviewer who disputes any row should record the disagreement against the ledger's finding number, not rewrite the
finding; the ledger's §8 already names the ways each class of claim could be wrong.

---

## 4. What the ledger puts to Patrick

These are his calls. The recon reports where each lands in code and what each costs; it decides none of them.

1. **Override or marker** (ledger §6). When a line formula is edited, is the library value silently replaced, or does the
   line carry a visible mark? Under both options the engine needs no arithmetic change; the difference is whether the
   engine line exports the expression it used (a freeze-fence edit at `:3013`) or a display surface re-reads the override
   store (the pattern the code warns against at `:9270`). The commission's own requirement — the sheet renders what it
   computes — needs the expression on the line under either option.
2. **The NEW-4 ruling** (`:10100–10109`, `:10144`). Any line-level formula on a takeoff file reverses the P-CODE pass-2
   ruling that dropped `qty_expr` at the door as "rendered on no surface". The premise of that ruling is exactly what a
   formula batch would change. It needs a LEDGER row either way.
3. **The freeze manifest.** The fence over `core` and `engine` gates nothing until `node tools/ves-verify.mjs
   --write-manifest` is run by hand on an accepted build (CLAUDE.md §Verification; the guard hook refuses it from a seat).
   Any batch that must "stay out of the fence" is unenforced until then. This was already on the open list; the recon
   adds that it is the single largest hole in the boundary a formula batch would rely on.
4. **Golden coverage.** Golden A carries no `item`, `desc` or `drivingRefs` (ledger F5.1). Whether the goldens should be
   re-frozen to carry line identity is a change to the gate harness, which is YELLOW after freeze (gate/README.md).
5. **Condition waste** (ledger F4.1 item 4). The Flags tab asks for a value no door can set. Whether the advisory is wrong
   or the door is missing is a design call; either is a small batch.

---

## 5. Pickup for the next seat — what a batch would have to settle before a byte moves

Not a plan and not a diff. The order below is the dependency order the ledger's evidence implies.

1. **Read the ledger §§1–3 against the bytes**, using §3 of this file. Do not start from the ledger's prose.
2. **Get the two rulings** (§4 items 1 and 2) in writing in `LEDGER.md` before designing a cell. The write door, the load
   door and the render all branch on them.
3. **Decide the key.** Reusing `qty_expr` on `lineOverrides` means F18.68 and earlier drop it loudly with a banner
   (`:10129`, `:10225`, `:10316–10320`); a new key name passes those builds silently (`:10133–10134`); a takeoff version
   bump makes them refuse the file (`:2540–2541`). Ledger F5.4 has the three cases. The takeoff `version` should not move.
4. **Decide what the engine line carries.** Today: `coverage`, `density`, `qtyNeeded`, `productionRate`, `laborHours`,
   `qtyOverridden` (`:3013–3014`). Not: the expression string or which driver ran. Emitting them is inside the fence and
   invisible to G0 (its mapper copies nine named keys, `gate/scenarioA.js:20–23`).
5. **Write the probe red-first.** Per NOTES.md §Method rails. The probe must assert on the rendered grid cell and on the
   CSV/XLSX trailing column, because nothing pins the row shape today (ledger F5.2). Probe-u is the closest model: it
   drives the entry row and reads `resolveAssembly().lines` by `drivingRefs` (`tools/sweep/probe-u.mjs:36–84`).
6. **Keep the coil case as the acceptance.** A line whose driving condition is LF, whose item unit is LB, whose
   conversion is `LF × width × lb/SF` with the width typed *on the line*, priced, shown with its formula, exported with it,
   saved, reloaded, and still the same to the cent. Ledger F4.1 item 5 says why nothing on HEAD can do it.
7. **Surfaces a marker must reach** (ledger §6, option B): grid cell and title (`:8944–8948`, `:9499–9503`), row model
   (`:9357`), grid CSV (`:9412–9433`), Estimate XLSX (`:11320–11331`), BOM CSV (`:8724–8731`), cost sheet (`:10798`); the
   client bid must not (D-24.2, `:10522–10526`); the peek is unread (`:6636`).
8. **What must not move.** G0's 12 recap keys and 8 line keys on the ssmr/10-8-5/no-override fixture (ledger F5.1);
   probe-v V2's demo sell `64620.46`; probe-u's four quantities; probe-z Z4's cent identity. The list of every rounding
   point is ledger F1.4 — a formula batch adds no rounding of its own if it lands before `CEIL` at `:3005`.

---

## 6. What was not done, stated plainly

- No probe was written and no lane claim was exercised at runtime. G0 and the verifier were run; nothing else was.
- Nine script blocks were not read (ledger §0, §7 item 2). A door or a surface in them would not appear in this recon's
  greps unless it used the literal strings searched for.
- Two read-only subagents contributed the harness and persistence tables; their headline claims were re-read here (§3
  rows 2, 8, 9), their remaining citations were not.
- The proposed-batch material in §5 is dependency order, not scope. Scope is Patrick's.

---

## 7. Files on this branch

```
research/FINDINGS_ESTIMATE_SHEET_b191423.md   the ledger — scope, findings by lane, ruling sites, remainder, risk
research/HANDOFF_ESTIMATE_SHEET_b191423.md    this file — review checklist, rulings, pickup order
```

Nothing under `src/`, `gate/`, `tools/`, `test/`, `release/` or the root registers is touched. `git diff b191423 --stat`
(the branch base; a checkout's local `main` may be stale) should show exactly the two files above.
