# LEDGER — public rulings and open-items register

Restarted 2026-09-01 with the fresh public root, on Patrick's ruling that there is no local seat: this file is the
register. It is seeded mechanically from every ruling ID the shipped bytes and NOTES.md already cite, with the first
line in `src/VES_PM.html` that names each one (the full reasoning is in that comment block). Rulings are Patrick's;
a seat adds rows, never rewrites them. Synthetic aliases only — no client, project, address, or job dollar figure.

## RELEASE 2.0.0 — VES 2 (2026-09-15)

Product `src/VES_PM.html`: **sha256 `52a0c0f0a0b11a4324472bf1147b6082d0c9d23b0e29d3ea4de4b369a12d9374` · md5 `b1898283f693a23e3e1040c1d50915fd` · 3845864 bytes · `VES_BUILD = '2.0.0'`** · MIT line inside the
file (first comment) · shipped as `~/Downloads/VES_2.0.0.html` (byte-identical) beside `VES_F18.72_WORKING.html`; `~/BUSINESS/VES_PM.html`
untouched (md5 3eb98577 before and after). Words: `README.md`, `RELEASE_NOTES.md`, `release/README.md`, `research/COLD_TEST_2.0.0.md`
(sonnet agent, 242K); demo `release/demo/demo-two-sheet.{json,pdf}` (v5, 2 sheets, 2 sections) cold-loads on a clean profile with 0
console errors (`probe-b7-demo` 7/7).
**Full regression on the release bytes (orchestrator, foreground chunks):** ves-verify PASS (SYNTAX 20/0 · EGRESS 7/7 0 new) · G0 GREEN 4/4
· vocab-check 0 · b6f ALL GREEN — 17 pass · b5-words 6/6 · b4-print 9/9 · b3-colors 8/8 · b2b-regions 8/8 · b2a-sections 7/7 · b1-pitch 12/12 · b0-fixture 7/7 · b7-demo 7/7 · ae 5/5 · p903-doc 8/8 · p903-aim 7/7 · p903-rail 5/5 · p903-pitch 6/6 · p903-words 5/5 · v 17/17 · x 5/5 · y 4/4 · z 6/6 · aa 5/5 · ac 5/5 · ab 4/4 · ad 5/5 · u 8/8 · af 40/40 · 
**MERGED 2026-09-15 on Patrick's word ("it is good i want this to be on the repo"):** `origin/main` b191423 → d7f683e (fast-forward of
`ves2`, 37 commits), tag `v2.0.0` pushed. The box's pre-push guard first REFUSED the tree for `LEDGER.md` (public on origin/main since
the 9/01 root — the guard's list was stale) and `fixtures/synthetic/` (generator-written, zero client data); **amended on his word**
(one pattern: LEDGER removed from the forbidden names, `^fixtures/synthetic/` allowed; everything else under `fixtures/` still
forbidden; hook is local-only). Local `main` (a stale divergent checkout, 68c8e23) renamed `main-stale-20260901`, new local `main`
tracks origin/main. CI run id recorded below when read.
**Bars:** `research/PLATFORM_BAR.md` §5 (the four asks, each with its RED-first gate) · local GTM_BAR.md B2 restated + re-proven.
**Not done here, by rule:** no push (the box's pre-push guard allows `main` only), no merge to `main`, no `--write-*`. **Patrick's
part:** the 8-step cold test (`research/COLD_TEST_2.0.0.md` = `~/Downloads/VES_2.0.0_NOTES.md`) and one real takeoff on F18.72 vs 2.0.0
to the cent (or a named banner per difference); then the merge word — from `main`: `git merge --ff-only ves2 && git push` (CI runs on
the runner on that push). Candidates on record: F-F7 · E-F4 · C-B2a-1 · C-B5-1.

### VES 2 rulings, collected (R-series; detail in each batch section)
| id | ruling | where |
|---|---|---|
| R-1 | base = F18.72 bytes; branch `ves2`; `main` untouched until the word | B0 |
| R-2 | semver stamp line `2.0.0-rc.N` → `2.0.0`; the F18.x line ended on the stamp collision | B0 |
| R-3 / R-3a / R-3b / R-3c | pitch = one store (rise/12), one `pitchFactor(rise, kind)`, every surface; money reconciled TO the displayed number with named deltas; multiplier reading bounded at `pitchFactor(24)`; flat = absence of a rise | B1, B6F |
| R-4 | `lenKind` on linears (level / slope / hipvalley), migrated as slope | B1 |
| R-5, R-5b..h, R-5i..o | Section = `c.location`; Section → System nested; Unassigned / Project / Multiple named; nested apportion; regions tag at measure time, never retro; anchors; smallest region wins; one `sectionKeyOf` (B6F-C5) | B2a, B2b, B6F |
| R-6, R-6a..e | `descOf`, VOCAB column words, vocab-check in CI; takeoff "Sheets" column → data attribute | B5 |
| R-7, R-7a..f | 24 hues (first 8 fixed), custom hex, patterns, readable ink, paginating legends | B3 |
| R-8 | MIT (Patrick's word 2026-09-14) | — |
| R-9 | out of this run: O1/O2/O3/O8/O12, export-surface collapse | plan |
| R-10, R-10a..h | one print path (`printTakeoff`), per-sheet figures, chooser, latch released after `window.print()` + placeholder as the empty state, identity size recorded, CI probe-ae fatal | B4, B6F |

## Batch B0 — VES 2 · ONE LINEAGE (build 2.0.0-rc.1 on branch `ves2`, 2026-09-14)

Plan (Patrick-approved 2026-09-14, the deliverable of the architect's revisit): `~/.claude/plans/swift-percolating-orbit.md`
(local, not in the repo). Base = F18.72 bytes (`d2bcf6a`). Product after B0: sha256 `f2236808566338d51fd087bf367fcbdeacd4d2b1b6e31dad360fd527f2dae112`, md5 `5c48c64a7d1b89033e2a67816a39340f`, 3685619 bytes.

### VES 2 rulings (orchestrator's, per the 2026-08-23 delegation; reversible on Patrick's word)
| id | ruling |
|---|---|
| R-1 | Base = F18.72 bytes; work branch `ves2` from d2bcf6a; `main` untouched until Patrick's word. |
| R-2 | Stamp line is semver: `VES_BUILD = '2.0.0-rc.N'` → `2.0.0` at release. The F18.x line ended because kind-curie and estimate-sheet-depth both stamped F18.69–F18.71 with different content. |
| R-3 | Pitch stored ONCE as rise-per-12 on `c.pitch` (0 = flat); one `pitchFactor(rise, kind)`; library `pitchDefault` seeds `c.pitch` at creation only; both doors journaled; every surface via `dispQtyOf`. (Batch B1) |
| R-4 | `c.lenKind ∈ {plan, slope, hipvalley}` on linear conditions, default from the name regex D-23.3 already uses, editable; areas always slope-factored; counts never. (B1) |
| R-5 | Section = `c.location` (typed, canonical); drawn regions are an input method resolved by containment at tag time — moving a region never retro-changes money; "Unassigned" is a named section. (B2a/B2b) |
| R-6 | Document columns use Patrick's EDGE report words (Legend · Pitch · Description · SF · LF · EA; Class → cost-code → Subtotal → named adders → Total); app chrome words unchanged; "sheet" stays the chrome word. (B5) |
| R-7 | Palette 24 + custom hex + hatch/dash for grayscale print; the local GTM bar's B2 measure ("8 distinct colors") is restated and re-run, not reworded. (B3) |
| R-8 | Free product (Patrick 2026-09-14: "even if it's just a free program for others"). **RESOLVED 2026-09-14, Patrick's word: "use MIT license."** LICENSE replaced with the MIT text (© 2026 Patrick Moriarty / Bitumen Machina LLC); B7 puts the licence line inside the product file. |
| R-9 | Out of this run (roadmap, not built): downspout LF door reachability · fab+install pairing · mobile · cost per estimated unit on the grid · CEIL/overhead/zero-qty trio · export-surface collapse. A persona P0 on any of them becomes a numbered fix batch. |

### What B0 did, from bytes
- **The port, and the trap it stepped in first.** The two lineages fork at `ad07fff` (F18.66), not at `b191423` (F18.68):
  main carried Batch U (F18.67, Unlink freeze) and its own Batch AE (F18.68, "Print takeoff — the plan as measured")
  that kind-curie never had, while kind-curie carried its own AE (F18.67, "the takeoff is a document"). A first port
  diffed from `b191423` and so replayed REVERTS of Batch U and main's AE onto F18.72 — the sweep caught it (probe-u 2/8,
  probe-ae 2/5, a retired code comment resurrected) and a control run on unpatched F18.72 (probe-u 7/8, probe-ae 5/5)
  proved the port was the cause. Redone as `git diff ad07fff 7dda549 -- src/VES_PM.html` 3-way onto d2bcf6a: 7 conflict
  regions, adjudicated: CSS union (main's takeoff paper rules + kind-curie's `@page takeoff` landscape / `.tk-sheet` /
  `.tk-qty`) · exports menu = Patrick's trade words (P3-R2/R3; BOM/Rollup/Audit CSVs move under Setup as his AI batch
  put them) · command palette + button → `printTakeoff` (his multi-sheet takeoff) · Estimate CSV keeps F18.72's
  derivation columns with his toast wording · BOTH print functions kept (`printTakeoffDoc` main AE, now unwired;
  `printTakeoff` kind-curie AE-2, the door) — one closing brace lost in the concatenation, caught by ves-verify SYNTAX,
  restored · stamp → 2.0.0-rc.1 with both prior stamp comments kept as history.
- **Gates on `5c48c64a7d1b89033e2a67816a39340f`** (Chrome `/usr/bin/google-chrome`, headless): `tools/ves-verify.mjs` PASS (SYNTAX 20 blocks 0 failed ·
  EGRESS 7/7 0 new · FREEZE manifest absent) · `gate/g0.mjs` G0 GREEN 4/4 (A/B/C/D unchanged from F18.72 → the port moved
  no money) · sweep: v 16/17 (V0 read the stamp as `F\d+.\d+` — regex widened to semver, declared) · x 5/5 · y 4/4 ·
  z 6/6 · aa 5/5 · ac 5/5 · ab 4/4 · ad 5/5 · **u 8/8** (F18.72 control: 7/8) · **ae 3/5** (see below) · af 40/40 ·
  Patrick's 9/03 gates ported verbatim as `probe-p903-{doc,aim,rail,pitch,words}`: 8/8 · 7/7 · 5/5 · 6/6 · 5/5.
- **Declared RED until Batch B4 (in CI, non-gating, output still recorded):** probe-ae **AE2** (the takeoff paper carries
  every measured condition with the quantity the app displays) and **AE5** (a typed-only takeoff prints its quantity
  tables; with nothing measured the latch is released and the door says so). The door now prints Patrick's multi-sheet
  takeoff; main's edge behaviours fold into it in B4, which flips the step back to fatal. AE1 re-pointed to the
  trade-word label ("Takeoff…") — wording only.
- `tools/sweep/mkpdf.mjs` takes kind-curie's page-count argument (`<out.pdf> [segments] [pages]`), a superset.
- CLAUDE.md line 42 declares the new stamp. `.github/workflows/verify.yml` runs the five ported gates (code12–code16).
- **B0f — the synthetic fixture (opus agent, 195K tokens; commit `721b4d4`).** `tools/gen/fixture-3sheet.mjs` (zero-dep, seeded)
  → `fixtures/synthetic/three-sheet/{plan.pdf (3 sheets A-1/A-2/A-3), takeoff.v3.json (26 conditions, 29 measurements, 4 sections
  incl. one unassigned, pitches flat/4/6/9, a bare-6 "Cricket framing", a store-B override "SSMR — field area", two conditions
  spanning sheets), golden.cents.json (sell 49,680,067¢ · cost 39,826,894¢ on F18.72 sha d07cd6ad…), README.md}` +
  `tools/sweep/probe-b0-fixture.mjs` F1–F7. **7/7 on F18.72 AND 7/7 on the B0 port** — the port moved no money on the fixture.
  Findings the fixture surfaced (recorded, not fixed here): **R-3a** a library condition whose pitch sits in the plain store
  DISPLAYS pitched but PRICES flat (fixture ids 4/10/11) — D-26.1 broken on that path; B1 reconciles money to the displayed
  number with a named delta banner. **C-B0-1** `identity.fileSize` is always 0 on a PDF-backed save (pdf.js detaches the buffer
  before `buildIdentity` reads byteLength) — the identity door's size test is vacuous; candidate for B4/B6F. No seed-library row
  carries a pitch (45 rows, 0 with the column) — B1-7 seeds one to test. All 8 hues repeat on 26 conditions (B3 evidence).
  `.gitignore` now `fixtures/*` + `!fixtures/synthetic/` (a negation never fires inside an ignored DIRECTORY) + `.scratch/`;
  `.gitattributes` marks the synthetic PDF binary (its xref lines carry required trailing spaces).

## Batch B1 — VES 2 · PITCH: ONE STORE, ONE FUNCTION, ONE CONVENTION (build 2.0.0-rc.2, 2026-09-14)

Rulings R-3 / R-3a / R-4 (LEDGER §Batch B0). Opus agent, RED-first: `tools/sweep/probe-b1-pitch.mjs` **1/12 on the base
(md5 5c48c64a)** → **12/12 on the patch**; applied by md5 contract (declared `9aad053e258e6333f889b95ef04e9055` = applied). Product: sha256 `7e0bac9b6511cd0ea9c7fa56df4d398e1a3d121469b641360736da700e431b74`,
3705692 bytes.
- `c.pitch` = rise per 12 (unrounded — rounding to an eighth would have moved $0.32 on one line silently; the eighth is for
  display and for the divergence test only), the ONLY store. `pitchFactor(rise, kind)` is the one conversion: area/slope
  √(1+(r/12)²) · hipvalley √(1+(r/12)²/2) · level 1 · count 1; `VESCore.rollup` applies it for every condition, library or
  not; `resolveTakeoff` reads the pitched rollup and never multiplies again; `condPitchFactor`/`dispQtyOf`/`factorOf` are thin
  wrappers on it. `conditionOverrides[libRef].pitch` survives only as a non-enumerable read-only VIEW of the one store (never
  serialised, never reaches the engine — kept because AH1–AH5 and the fixture control read that key). Both doors write through
  `parsePitch` (a bare 6 is 6/12), show `fmtPitch`, and are JOURNALED ("pitch 6/12 → 4/12 on <condition>"; Ctrl+Z restores
  pitch and the shown quantity). Linears carry `lenKind` (hipvalley ×1.0607 · level ×1 · slope = area factor; existing
  pitched linears migrate as `slope` so nothing moves). A library row's pitch seeds a new condition once (no seed row carries
  one today; B1-7 seeds one to prove the door).
- **Migration 3→4** in `normalizeSnapshot`: a v3 FACTOR becomes a rise; a factor the rise cannot reproduce (the bare 6 →
  implied rise 71) keeps `pitchLegacyFactor`, prices exactly as saved, and shows a per-condition confirm banner; confirming
  re-prices at 6/12 and journals it. **R-3a on the fixture:** three library conditions whose pitch sat in the plain store
  DISPLAYED pitched but PRICED flat — money reconciled TO THE DISPLAYED number and named on one load banner: SSMR — hip
  +$215.08 · Slate — field area +$13,657.08 · Slate — valley +$1,419.33 · sell $496,800.67 → $512,092.16 (+1,529,149¢, the
  probe reads the deltas from the banner text and checks the grand against them). 26/26 other quantities identical to the
  F18.72 golden. A v4 file round-trips through two saves with no repeat banner. The Audit CSV — the one surface with no pitch
  on it (per-measurement raw strokes) — now carries `Pitch` + `Pitch factor` columns.
- **Gates on `9aad053e258e6333f889b95ef04e9055`:** G0 GREEN 4/4 (goldens untouched) · ves-verify PASS · probe-b1-pitch 12/12 · probe-af **40/40** after two
  declared row changes (AF6 "version still 3" → "version ≥ 3 — the build's"; AF7: the F18.68 bytes now REFUSE a version-4 file
  loudly, naming the version — a stronger guarantee than the field-drop the row pinned; the drop path still exists for
  same-version files) · probe-v 17/17 · probe-u 8/8 · probe-p903-pitch 6/6 (+ rail/words/aim/doc per the agent's run) ·
  **fixture control 7/7 against a NEW golden**: `golden.cents.json` re-recorded on rc.2 (`--write-golden`), the F18.72 record
  kept as `golden.f18.72.cents.json` (probe-b1-pitch's delta arithmetic reads it); F2 accepts a file no newer than the build.
- Candidates (not built): C-B1-1 the fixture control's F6 still documents the legacy ×6 hold (its wording updated) — when
  Patrick confirms the banner on a real file the row is his to watch; C-B0-1 (identity fileSize 0) still open.

## Batch B2a — VES 2 · SECTIONS, TYPED: Section → System nested subtotals (build 2.0.0-rc.3, 2026-09-14)

Ruling R-5 (+R-5b..d in the charter). Opus agent, RED-first: `tools/sweep/probe-b2a-sections.mjs` **0/7 on the base (md5 9aad053e)
→ 7/7 on the patch**; applied by md5 contract (declared `2b26e249430e263fb32aadc5418a060f` = applied). Product: sha256 `b588d85ff53b540e9f9a5064a3c98ecaf5223e35088a3eef8f1157a6b94f257c`, 3738095 bytes.
- Every money surface now groups **Section → System → line** with a subtotal at each level: recap summary (the division table
  stays), Estimate grid (the division chip filters inside the grouping), client bid, cost sheet, takeoff paper ("Section: <name>",
  EDGE wording; quantities only), proposal scope; Estimate CSV trailing `section` column, supplier RFQ `section`, workbook Section
  column with live SUM subtotal rows. "Unassigned" is a named section; general lines roll under "Project". The condition editor's
  location field is a section picker (datalist + free text); "Rename section" moves every condition, journaled under both names,
  Ctrl+Z restores, grand unchanged. No format bump.
- **Ratified from the agent's declared decisions (recorded here as rulings):** **R-5i** an engine line whose driving conditions sit
  in different sections rolls under a third named, subtotaled section "Multiple" (never silently filed under its first driver,
  never dumped into Project); **R-5j** a FIXED allowance (no driving refs) inherits its assembly's section and falls to Project only
  if that assembly's conditions disagree; **R-5k** section cost is apportioned NESTED (sections → grand, systems → their section,
  Mat/Lab/Equip → their row) and section Sell rides one hoisted copy of the bid's largest-remainder routine, so the recap's
  section Sell and the bid's section subtotal are the same integers — the agent found sections rounded individually summed to
  41,052,763¢ against a grand of 41,052,762¢ (the S3/F5 round-then-sum class, third time in this file) and fixed it.
- **Gates on `2b26e249430e263fb32aadc5418a060f` (orchestrator rerun):** G0 GREEN 4/4 · ves-verify PASS · probe-b2a-sections 7/7 · probe-b0-fixture 7/7 ·
  probe-b1-pitch 12/12 · probe-v 17/17 · probe-af 40/40 · probe-ae **4/5** (AE2 went green as a side effect — the takeoff paper now
  carries every measured quantity; AE5 still red as declared until B4). Agent's run also: u 8/8 · p903 ×5 green · x/y/z/aa/ab/ac/ad green.
- Seen, not fixed: the fixture's bid drops 4 zero-quantity $0 lines (the existing note says so; bid == recap holds here and would
  need that note read on a job where it does not); the 316 px recap dock shows the new Sell column with Cost scrolled behind the
  sticky column (the Estimate lens is where the table reads whole) — **C-B2a-1**, a layout candidate for B6. `exportClientReviewXLSX`
  stays a division document (unlisted in R-5d; cents unchanged).
- Token note: B1 287K · B2a 331K (the ~150K rail was a stop-and-return-partial rail; both delivered green, neither returned partial).
  B3/B5 charters are narrower and run on sonnet.

## Batch B2b — VES 2 · SECTIONS, DRAWN: regions tag by containment (build 2.0.0-rc.4, 2026-09-14)

Rulings R-5e..h (charter). Opus agent, RED-first with a REAL pointer: `tools/sweep/probe-b2b-regions.mjs` **0/8 on the base
(md5 2b26e249) → 8/8 on the patch**; applied by md5 contract (declared `ec6688af04b4dd318d62e890e93b390a` = applied). Product: sha256 `6fb551cc8510e9b599221d6eb9a36f453a6627f4f20786818e9c6914299f13d7`, 3770833 bytes.
- A Section tool (rack, under REGION, below Rect/Poly) draws a closed polygon exactly like the area tool, then asks a name (datalist
  of existing sections). `state.sections[]` in sheet coordinates; TAKEOFF_VERSION 4 → 5 (absent → []; the rc.3 bytes refuse a v5
  file loudly — tested against the real rc.3 bytes in a second tab). A measurement completed inside a region tags its condition
  ONLY if the condition has no section (journaled "section Annex on <condition> — from the drawn region"); a sectioned condition
  stays and the toast says so; "Tag by regions" does it for every unsectioned condition in one journal entry; moving/renaming/
  deleting a region never changes a section (money never retro-changes; grand read before/after = equal). Regions print on the
  takeoff sheet figures only (lavender wash beneath measurements, violet chip), never on bid or proposal.
- **Ratified from the agent's declared decisions:** **R-5l** anchor = centroid for areas, mean of markers for a multi-point count,
  the point halfway ALONG the run for a line (the mid vertex can sit outside its own section); **R-5m** the smallest containing
  region wins (a canopy nested in a main roof takes what is drawn in it); **R-5n** a condition whose measurements straddle two
  regions is left alone and named in the toast (splitting out of scope); **R-5o** no "hide markup" toggle exists — the region's
  fill follows the Fills cycle, outline and chip survive "No fill".
- Two harness facts recorded in the probe header, neither a product defect: snap pulls a first corner onto a nearby calibration
  mark (the probe draws with snap off and says so); the floating islands settle ~13 px sideways on first pointer entry (the probe
  hovers, waits, re-aims — what a hand does).
- **Gates on `ec6688af04b4dd318d62e890e93b390a` (orchestrator rerun):** G0 GREEN 4/4 · ves-verify PASS · probe-b2b-regions 8/8 · probe-b2a-sections 7/7 ·
  probe-b0-fixture 7/7 (F2 "≥ 3" holds) · probe-b1-pitch 12/12 · probe-u 8/8 · probe-p903-aim 7/7 · probe-af 40/40 (AF7 "newer
  file refused loudly" holds for v5). Agent's run also: v 17/17 · p903 doc/rail/pitch/words green. Token note: 339K.

## Batch B3 — VES 2 · COLORS: 24 hues, custom hex, print-separable (build 2.0.0-rc.5, 2026-09-14)

Ruling R-7 (+R-7a..f in the charter). Sonnet agent (second spawn — the first was stopped by the auto-mode classifier before any
work; a pre-made clone and a plainer prompt fixed it), RED-first: `tools/sweep/probe-b3-colors.mjs` **1/8 on the base (md5
ec6688af) → 8/8 on the patch**; applied by md5 contract (declared `62a2031c1c11443bb415e3262c89ca0f` = applied). Product: sha256 `bafd32ae64095c932a242769d5705f3e3fbdf5b1f5d57ce8f36a56ca9257cb59`, 3786425 bytes.
- `PALETTE` = 24 hues, the shipped 8 byte-identical and first (existing files keep their colors); the 16 new built from the
  existing 8's HSL with ≥135° hue separation between consecutive picks, alternating light/dark bands. `readableInk(hex)` picks
  black/white by WCAG luminance — proven for ANY sRGB color (the two curves cross at luminance ≈0.179 at ≈4.58:1), so every label
  plate, card chip and legend glyph clears 4.5:1, custom included. `patternOf(i)`: 8 dash signatures × 5 hatch orientations, coprime
  cycle (lcm 40) so all 24 palette indices carry a unique (dash, hatch) pair; custom colors get a persisted `patternIdx`. Custom door
  lives in `colorSwatches()` (both callers — ✎ editor and create form): 24 buttons, native `<input type="color">`, hex field, one
  `onPick`, journaled like a unit-cost edit. `CUSTOM_COLOR_RE` mirrors the frozen `COLOR_RE` (private to VESCore's freeze region).
- **Real find:** the takeoff sheet box (`.tk-sheet { height: 7.4in; overflow: hidden }`, kind-curie AE-3) silently CLIPPED a long
  legend on printed media — proven by emulating print media at the real 10.2 in column width (a 1440 px window hides it); the last
  legend row sat 20 px past the box on the base. Legends now paginate past 20 items (R-7e); B4 keeps this row.
- **Gates on `62a2031c1c11443bb415e3262c89ca0f` (orchestrator rerun):** G0 GREEN 4/4 · ves-verify PASS · probe-b3-colors 8/8 · probe-b0-fixture 7/7 ·
  probe-b1-pitch 12/12 · probe-b2a-sections 7/7 · probe-b2b-regions **7/8 at the B3 commit `a26f133` — the harness fix this row claimed had NOT applied** (the orchestrator's edit script asserted on a pattern it did not find, the shell did not abort, and the record was written from the intended result, not the observed one — the Assumed-vs-Verified class; corrected in the next commit, which pins the old build and carries the real rerun). The defect: its "old build" defaulted to
  `git show ves2:…`, which after B2b landed IS a version-5 build, so the refusal row could never fire — pinned to `4742d02`, the
  last v4 commit; the agent's run had passed only because its clone's `ves2` still pointed at the pre-B2b base — harness defect
  #1 of VES 2, the R-04 class) · probe-p903-doc 8/8 (its optional prior-build AE7 row is not in CI) · probe-af 40/40 · probe-ae
  4/5 (AE5 declared red until B4).
- **Correction commit (orchestrator, 2026-09-14):** `probe-b2b-regions.mjs` old build pinned to `4742d02`; rerun on the landed rc.5 bytes: **probe-b2b-regions: 8/8 passed, 0 failed** (raw in the commit). The LEDGER line above was wrong when committed; this line is the observed result.
- Token note: sonnet 464K / 230 tool uses — more than any opus batch (B1 287K, B2a 331K, B2b 339K). Remaining code batches run
  on opus (Patrick 2026-09-14: "use opus if sonnet trips again"; cost per token is higher but the burn was not lower).

## Batch B4 — VES 2 · THE TAKEOFF PRINTS EVERY SHEET (build 2.0.0-rc.6, 2026-09-14)

Rulings R-10a..g (charter). Opus agent, RED-first: `tools/sweep/probe-b4-print.mjs` **1/9 on the base (md5 62a2031c) → 9/9 on
the patch**; applied by md5 contract (declared `961cf1f5499cd98da5e0f9bb64986d67` = applied). Product: sha256 `556db7f6e193c98584b12ad3bcc0a4524257694cb385eed4cffe8a26225193b2`, 3797877 bytes. **Patrick's
complaint #1 (2026-09-14, "no ability to print a takeoff that uses multiple pdf pages") is closed on rendered pages.**
- One print path: `printTakeoffDoc` (main's AE) folded into `printTakeoff` (kind-curie AE-2) and DELETED (grep: comments only).
  `visualFiguresHTML(pages)` is the one per-sheet figure builder: raster + markup + region outlines/chips + per-sheet legend
  (pattern glyphs, only that sheet's conditions, that sheet's own quantity — a spanning condition reads its own number on each
  sheet) + "Sheet N of M"; one landscape `@page` for the whole document; a computed image ceiling keeps every sheet on ONE page
  (the base stranded sheet 1 onto a 4th page). Quantities page: Section bands with SF · LF · EA subtotals, a "Sheets" column, one
  basis line saying the quantities are for the whole takeoff, no money. Sheet chooser (2+ measured sheets only; unmeasured listed
  greyed, not selectable; `state.printSheets` one-shot, never saved; Cancel/Esc releases the latch); "Sheets shown: 1, 3 of 3" on
  the paper when a sheet is left out (the fixture PDF carries no page labels). Typed-only takeoff prints its tables with no figure;
  nothing measured → latch released, toast names it (the AE5 semantics — the takeoff door is no longer `gateCtl`-disabled so it can
  say so). Proposal: one figure per measured sheet in the estimator's colors with pattern swatches, legends keep ROLLUP totals
  (D-26.1: never page-partial); the bid carries no figure, as before. Latch release is armed only around the app's own
  `window.print()` — `Page.printToPDF` fires `afterprint` too (measured), so an unconditional release would have blanked every
  rendered-bytes gate. **C-B0-1 closed:** `identity.fileSize` is read before pdf.js detaches the buffer (6,366 for the fixture
  PDF); a file saved with 0 still loads with no modal.
- Sibling gate change, declared: `probe-b0-fixture` F2 asserted identity "match" by a direct core call, which the size fix makes
  false for the fixture's own pre-rc.6 file (saved with fileSize 0); F2 now tolerates exactly that one diff and nothing else.
  R-10d's figure-scoped `page-break-inside` was already true on the base — nothing changed. CI: probe-ae step FATAL again (B0's
  declared-red block removed); `probe-b4-print` step added.
- **Gates on `961cf1f5499cd98da5e0f9bb64986d67` (orchestrator rerun):** G0 GREEN 4/4 · ves-verify PASS · **probe-b4-print: 9/9 passed, 0 failed** · **probe-ae: 5/5 passed, 0 failed** · probe-p903-doc 8/8 ·
  probe-b0-fixture 7/7 · probe-b3-colors 8/8 · probe-b2b-regions 8/8 · probe-u 8/8 · probe-af 40/40. Agent's run also: b1 12/12 ·
  b2a 7/7 · v · x/y/z/aa/ab/ac/ad · p903 ×5 green. Token note: 325K.

## Batch B5 — VES 2 · ONE DESCRIPTION PER ITEM, EDGE COLUMN WORDS (build 2.0.0-rc.7, 2026-09-14)

Ruling R-6 (+R-6a..d in the charter; Patrick 2026-09-14: one description everywhere + EDGE column names, chrome untouched).
Sonnet agent, RED-first: `tools/sweep/probe-b5-words.mjs` **1/6 on the base (md5 961cf1f5) → 6/6 on the patch** (B5-6 made
neutral under `--no-subgates` by the orchestrator — its children each run as their own step); `tools/vocab-check.mjs` **6
findings on the base → 0 on the patch**, wired into CI. Applied by md5 contract (declared `0df93f7b508caa3c44c5045bbe342a30` = applied). Product: sha256
`9c606215699ff5d938b6d34d8d6adca50e4f47f860b7bdb07e5443e93529dece`, 3809150 bytes.
- `descOf(x)` is THE description for a library item, a condition, an engine line or a general line; before it, five surfaces built
  a linked labor line's name their own way (`itemLabel` + ad-hoc kind ternaries, a recap mini-table reading a library line's
  often-blank `.desc`). B5-1 reads one condition on 5 condition-native surfaces and its labor line on 8 of 9 engine-line surfaces
  (the supplier RFQ is materials-only by design). `const VOCAB` carries the document words: takeoff `Legend | Pitch | Description |
  SF | LF | EA` (a condition fills one of the three; the others print "—"); grid/Estimate CSV/XLSX `Description | Quantity | EU |
  Ord Qty | Ord Un | Unit Price | Prc Un | Net Cost` + the Formula columns; recap/cost sheet Class → cost-code → Subtotal → named
  adders → Total with `Description | Net Cost | Markup | Markup $ | Gross Price | Cost Unit | Unit`; bid `Description | Quantity |
  Unit | Unit Price | Amount`. Save-file and library ids unchanged; no money math touched.
- **Ratified deviations (agent-declared):** **R-6e** the takeoff quantities page's "Sheets" column (B4) moves to a `data-sheets`
  attribute — EDGE's Drawing report has no such column and the per-sheet figure legends already carry it. **C-B5-1 (candidate,
  B6F):** EU / Ord Un / Prc Un are always equal today — this engine resolves ONE unit per line — so three unit columns read the
  same word on every grid row; collapse to one `Unit` until the engine gains order-unit conversion (the three-unit chain stays
  the VOCAB target). **Four sibling probes re-addressed, assertions unchanged** (`probe-b1-pitch` + `probe-p903-doc` read the
  takeoff row by column position — now by the non-dash SF/LF/EA cell and `data-sheets`; `probe-af` + `probe-ad` found the
  workbook's cost column by /extended|total/ and the grid's Waste `<th>` by nth-child(6) — now /net cost/ and nth-child(7)).
- **Gates on `0df93f7b508caa3c44c5045bbe342a30` (orchestrator rerun, sequential background sweep):** G0 GREEN 4/4 · ves-verify PASS · vocab-check 0 ·
  **probe-b5-words: 6/6 passed, 0 failed** · probe-b4-print 9/9 · b2a 7/7 · b1 12/12 · b0-fixture 7/7 · b3 8/8 · b2b 8/8 · probe-ae 5/5 · p903-doc 8/8 ·
  p903-words 5/5 · ad 5/5 · af 40/40 · u 8/8 · v 17/17.
- **Incident, on the record (harness, not product):** the first rerun's `probe-b5-words` hung 19 min (its child-gate branch ran
  every sibling probe inside one process); the orchestrator's `pkill -f` matched its own shell (the roofnerd lesson, re-paid),
  three parallel probe slices then collided on Chrome's devtools port, and ~80 leftover `/tmp/ves-*` Chrome profiles filled the
  tmpfs quota so every shell call failed silently. Fixes: sweeps run as ONE sequential background job with a per-probe `timeout`
  and `rm -rf /tmp/ves-*` after each; kills by PID from `ps` on `comm`; B5-6 neutral under the flag. Token note: sonnet 588K /
  300 tool uses (B3 sonnet 464K) — the two sonnet batches burned more than any opus batch.

## Batch B6 — VES 2 · PERSONA PASS on 2.0.0-rc.7 (2026-09-14) → triage → B6F

Three personas, serial, fresh context, observations only (`research/persona-2.0.0/`): **P-ESTIMATOR** (sonnet, 320K; a full takeoff
from blank across 3 sheets: P0 1 · HIGH 2 · MED 4 · LOW 4, three LOWs being clean confirmations — pitch typing, migration banners,
sheet chooser) · **P-FRESH** (sonnet, 266K; clean profile, no docs: the four asks all achievable from the screen; P0 2 · HIGH 1 · MED 3
· LOW 1) · **P-CODE** (opus, 226K; adversarial reader of d2bcf6a..HEAD with proofs: **P0 3 · HIGH 5 · MED 3**, plus a
could-not-break list: v5 round-trip, version refusal, descOf consistency, case-insensitive money grouping, empty-print returns,
setGeneralField/editLine/setConditionWaste journaling).
**Money rows (fix):** B6C-1 `removeGeneralItem` un-journaled — Ctrl+Z gives two phantom undos then reverses the load reconcile
(−$15,291.49); B6C-2 a traced area on a sheet with no scale contributes 0 to recap/grid/bid/cost sheet/CSV and the word "pending"
reaches only the takeoff paper, while the bid prints "Sheet 1, 2" for a quantity measured on sheet 1 alone (E-F2's "(3 pending)" is
the same defect from the paper side); B6C-3 the pitch door's multiplier fallback accepts any finite ≥ 1 — `1e9` prices a job at
$3.69 trillion; B6C-5/6 Ctrl+Z of the reconcile deletes `c.pitch` (save → reload: pitches gone, banner stale); B6C-4 `addGeneralItem`
un-journaled; B6C-7 rename into a case-variant name drops 4 of 26 conditions from the takeoff page; B6C-9 `#printDoc` left
populated (706 KB) after `printTakeoff` — headless Chrome fires no `afterprint`. **Bar-backed rows (fix):** E-F1 the 2-pt scale tool
would not arm on sheets 2–3 (a banner offered two other doors); E-F5 22 quick-added conditions all `#ff5d3a`; F-F4 a new card renders
off-screen, its doors unreachable; E-F3/E-F7 the resume card names the PDF but does not open it, and Open takeoff asks for a PDF
already open; E-F6 the bid's refusal names no unpriced line; F-F1/F-F2 the migration banners move money as ruled (R-3a) but offer
only a dismiss — two doors each; F-F3 banner wording. **Taste (candidates):** F-F7 recap collapsed by default; E-F4 undo after
reload; C-B2a-1; F-F5 form collapses per add (cheap → built). Rulings B6F-1…9 and B6F-C1…C7 in `.scratch/charter-b6f.md`
(copied into this section's commit as `research/persona-2.0.0/CHARTER-B6F.md`). One fix batch; if a P0/HIGH remains after it, the
run halts per the plan.

## Batch B6F — VES 2 · THE PERSONA FIX BATCH (build 2.0.0-rc.8, 2026-09-15)

Rulings B6F-1…9 + B6F-C1…C7 (`research/persona-2.0.0/CHARTER-B6F.md`). Opus agent (454K), RED-first: `tools/sweep/probe-b6f.mjs`
**1/17 on the base (md5 0df93f7b) → 17/17 on the patch**; applied by md5 contract (declared `354191718ade3f573ab4bc9eea5aa990` = applied). Product: sha256
`74b33ac897f46c28cc3aaf34f4038c64842dd2cfd82e4a9bf0b0fcb6f8760107`, 3845254 bytes.
- Money/journal: `addGeneralItem`/`removeGeneralItem` journaled by name, phantom undos gone, undo toast formats every value; a
  measurement on a sheet with no scale is PENDING on every money surface (recap, grid, bid, cost sheet, CSV/XLSX — named, never a
  silent 0; the bid's "Sheet" note lists only sheets IN the number; the scale notice is job-scoped); the reconcile undo sets the
  three conditions flat by name and the banner rewrites itself (reload: flat, no banner); one `sectionKeyOf` (trim, case-fold) on
  every grouping surface — renaming into a case-variant MERGES, the takeoff page never drops a condition, proposal/recap/bid agree
  on the section count; regions loaded without ids get their own; `releasePrintDoc()` runs unconditionally after `window.print()`
  returns (headless Chrome fires no `afterprint`).
- Bar-backed: the 2-pt scale tool arms on EVERY unscaled sheet on arrival (E-F1's cause: `openDocument` armed it on sheet 1 only, and
  the collapsed 24 px toolbar measured the button 0×0 until hovered); quick-add takes the next unused palette entry (22 adds → 22
  colors); a new card scrolls into view and arms; the add form stays open for the next one; the resume card opens the picker and a
  matching open PDF reattaches without asking; the bid's refusal names the unpriced lines; recap strip reads "by section, then
  system, then CSI"; both migration banners carry two doors in plain words.
- **Ratified deviations (agent-declared, orchestrator-accepted):** **R-3b** the pitch door's decimal-multiplier reading stays (Patrick's
  9/03 gate AH3 pins it) but is BOUNDED at `pitchFactor(24)` — 25, 999, 1e9, -6, abc, 6/13, 6/1 all refuse; **R-10h** after a print
  `#printDoc` holds B4's placeholder, never a document (seven landed probes that read `#printDoc` after the print were re-addressed
  to snapshot inside the print stub — assertions unchanged); **R-3c** flat is the ABSENCE of a rise (`pitch: 0` would make every
  `c.pitch != null` reader count flat conditions) — the reconcile undo deletes the rise by name and the banner says so. B6F-6 was
  already met at HEAD. **C-B5-1 stays a candidate** (collapsing the three identical unit columns changes `VOCAB.grid` → B5-2 red).
- **Gates on `354191718ade3f573ab4bc9eea5aa990` (orchestrator rerun, foreground chunks after the harness memory guard killed the background sweep — page
  cache read as used, 25 GB actually free):** G0 GREEN 4/4 · ves-verify PASS · vocab-check 0 · b6f ALL GREEN — 17 pass · b5-words 6/6 · b4-print 9/9 · b3-colors 8/8 · b2b-regions 8/8 · b2a-sections 7/7 · b1-pitch 12/12 · b0-fixture 7/7 · ae 5/5 · p903-doc 8/8 · p903-aim 7/7 · p903-rail 5/5 · p903-pitch 6/6 · p903-words 5/5 · v 17/17 · x 5/5 · y 4/4 · z 6/6 · aa 5/5 · ac 5/5 · ab 4/4 · ad 5/5 · u 8/8 · af 40/40 · 
- **Wave verdict:** after ONE fix batch every proven P0/HIGH from the three personas is closed by a RED-first row, and no new
  P0/HIGH surfaced in the rerun — the plan's bar for release is met. Candidates left open (taste, on record): F-F7 recap collapsed
  by default · E-F4 undo-after-reload wording · C-B2a-1 recap dock width · C-B5-1 unit columns.

## Rulings cited in the bytes (D-series)

| ruling | first cited at | gist as the bytes state it |
|---|---|---|
| D-23.2 | line 4097 | L-11 (D-23.2): slate / SSMR / Brava / Kemper era. Display only — ids never rename. |
| D-23.3 | line 8804 | D-23.3 (L-15a): pitch-policy advisory — hips and valleys are the same diagonal family; |
| D-23.6 | line 1256 | appears — internal words (D-23.6), no number moved. */ |
| D-23.8 | line 10472 | .map((h, i) => `<th${i >= 3 ? ' class="n"' : ''}>${h}</th>`).join('') + '</tr></thead><tbody>';   // D-23.8: with OH set, the column appears so line c |
| D-23.9 | line 2985 | const noQty = qtyOK && qty === 0;   // D-23.9: blank/zero qty gates — flagged, never a silent $0 (the one recorded leak) |
| D-24.2 | line 10210 | W2-02/03/04 (D-24.2): client paper shows SELL only — Cost/OH/Markup/Profit are |
| D-24.3 | line 4066 | settings: {},                 //   overheadPct / markupPct / profitPct (D-24.3 single authority) + itemOverrides |
| D-24.4 | line 9649 | W2 Batch G (D-24.4 / H-5): identity routing. Client paper with no company and no |
| D-24.5 | line 1226 | D-24.5f was REFUTED on the record with "the condition-detail panel is a STATIC sibling in |
| D-24.5a | line 1476 | D-24.5a — the measuring pill is a CONTROL. It was pointer-events:none, so every |
| D-24.5b | line 11962 | (cited in the build-stamp chain, line 11962) |
| D-24.5c | line 4420 | is quiet. It must not fall through to re-arming a card either (D-24.5c: arming changes |
| D-24.5d | line 4030 | qtyBuf: '',                     // D-24.5d: digits typed at the canvas while ARMED — session-only, never serialized |
| D-24.5e | line 1504 | D-24.5e — ⌖ is the arm control on EVERY card and must READ as one; ◉ (hide on plan) |
| D-24.5f | line 1226 | D-24.5f was REFUTED on the record with "the condition-detail panel is a STATIC sibling in |
| D-24.6 | line 178 | D-24.6g (L-4): the sheet label opens the sheet index — say so on hover/focus. */ |
| D-24.6a | line 740 | D-24.6a (M-5): OFF is a chosen state, struck and kept — the same face the estimate |
| D-24.6b | line 1254 | D-24.6b (M-8): a 645-SF partial trace can bid five figures because a 50-day |
| D-24.6c | line 828 | D-24.6c (M-4): …EXCEPT a sentence. The dock is 360px; a toast laid out at 524px was cut |
| D-24.6d | line 9157 | D-24.6d (M-6): the chips are recapModel().divs — the SAME list the meta line counts one |
| D-24.6e | line 6665 | D-24.6e (L-1): Enter commits HERE. It was left to the browser's change-on-Enter |
| D-24.6f | line 973 | D-24.6f (L-2): the 6px top padding was scrollport, not gutter — Chrome sticks |
| D-24.6g | line 178 | D-24.6g (L-4): the sheet label opens the sheet index — say so on hover/focus. */ |
| D-24.7a | line 9669 | any print, so every print path that returns without writing it must also clear it. D-24.7a |
| D-24.7b | general print-latch release — still needs a HEADED bench (Chrome + Firefox); CI runs headless Chrome only — open |
| D-24.7c | line 4844 | D-24.7c: the overlay gets the SAME backing-store cap the raster canvas got above — the one |
| D-24.7d | line 9670 | and D-24.7d found and closed all six live returns — but each of them wrote `''` on its own |
| D-24.7e | line 9667 | T-J3 + D-24.7e · ONE RELEASE FOR THE PRINT LATCH. |
| D-24.8a | line 4252 | D-24.8a: the buffer belongs to the ARMED condition. disarmCondition() already cleared it, |
| D-24.8b | line 11222 | D-24.8b: Batch E (D-24.3) fixed WHERE margins live — assemblyProject.settings, one |
| D-24.9a | line 4447 | D-24.9a · THE NARROW BOUNDARY. This fork and the plain one below are two |
| D-24.9b | line 10685 | the printed document: no toast, no gap, nothing to notice. D-24.9b already ruled this |
| D-24.9c | line 1561 | D-24.9c (HD-C1) · THE DOCUMENT DOOR REACHES THE PLAN LENS TOO. |
| D-24.10 | line 8990 | D-24.10 (M-A): T-H6 said this figure is DELIBERATELY narrower than the Rollup CSV's |
| D-25.1 | line 11962 | (cited in the build-stamp chain, line 11962) |
| D-25.2a | line 1004 | D-25.2a · THE LENS CUE. Same mechanism L-A proved and the same reason: #toast lives in |
| D-25.2b | line 5636 | D-25.2b (mechanical half of N-4) · A PENDING TYPED QUANTITY DOES NOT SURVIVE THE |
| D-25.2c | line 8884 | D-25.2c (the toggle half) · The client bid billed "Primer — labor $1,093.75" on the same |
| D-25.3a | line 4594 | D-25.3a · THE OPEN DOOR ASKS THE QUESTION THE NEW DOOR ALREADY ASKS. |
| D-25.3b | line 11496 | D-25.3b · THE NEW-LINE ENTRY ROW IS NOT A MONEY-GRID ROW. Its five inputs carry |
| D-25.3c | line 5793 | D-25.3c: "once per takeoff" needs a takeoff boundary, and the app already has exactly one — |
| D-26.1 | line 6787 | D-26.1 (Batch R1) · ONE QUANTITY CONVENTION ON EVERY SURFACE ═══════════════════════════ |
| D-26.2 | line 2823 | D-26.2 (Batch R follow-on): refuse a NEGATIVE condition waste — parity with itemWaste's |
| D-26.3 | line 6000 | D-26.3 · CTRL+Z FROM A MONEY CELL IS THE ESTIMATOR'S UNDO, NOT THE FIELD'S. |
| D-26.4 | line 10247 | NEW-1 / D-26.4 (Batch T1) · ON THE CLIENT BID, A ROW'S THREE NUMBERS MULTIPLY ────── |

## Open items carried in NOTES.md (as of F18.60)

| id | what | status |
|---|---|---|
| U1 | Unlink freeze writes flat + two false comments assert it safe (P-CODE pass 3, HIGH) | **closed in F18.67** (Batch U; probe-u U1a–U1f; READINESS_ad07fff §2) |
| U2 | conditions/measurements arrays unvalidated at the file door | **closed in F18.59** (Batch V; probe-v V3a–c) |
| U3 | apportionCents total guard | open, Batch U charter |
| U4 | printBidDoc's inline F5 walk unified onto the hardened helper, cent-identical or stop (was T-Q1) | open |
| N-R1 | bid unit-rate precision 2 vs 4 decimals — presentation lane; worst measured row 1.5% (sweep F-04) | Patrick's call |
| C-S4 | narrow-width toolbar overlay with NO name — design call | open |
| C-N1 | recap panel anchoring at short viewport heights | **closed in F18.60** (probe-v V12) |
| C-R1 | resolve fan-out perf — needs real ms before any money-path memoization | parked |
| C-R2 | the build-log comment line (34 KB) | parked; the split (F18.60) leaves it in the `boot` block |
| F-C1 · F-C2 · W2M-C3 · T-K3 · C-K1 · C-H1/2/3 · T-3 · T-5 · C-O1/C-O2 | design candidates, none built | parked |
| F1 · N5 · N6 · D-24.7b | owner's blocking set (price/license; headed print-latch bench (Chrome + Firefox) — still open; CI runs headless Chrome only| Patrick's call |
| AE · Print takeoff | owner (2026-09-04, chat: "it should be print takeoff only … you choose") | A Print takeoff door: the marked-up sheet with its legend and every measured quantity, nothing priced; the shape was the seat's choice under the owner's word. **landed in F18.68** (Batch AE; probe-ae AE1–AE5; RED-first 1/5 on F18.67) | landed |
| R-1 → F1 | owner (2026-09-04, READINESS_ad07fff §0) | The price half of F1 is ruled: there is no price; donations are accepted. The license half (R-2 extent) is not ruled. Recorded against F1 | recorded, row stands |
| sweep F-01 | GitHub Pages serves `src/VES_PM.html` publicly | ruling pending |
| freeze manifest | `node tools/ves-verify.mjs --write-manifest` on an accepted build | Patrick's act |
| tag f18.55 | still on the remote, points at retired history | Patrick deletes (`git push origin --delete f18.55`) |

## Batch AF — Estimate sheet depth (TEST BUILD F18.69 on `claude/estimate-sheet-depth-vrhnf6`; not `main`)

Architect commission "Estimate sheet depth · branch a test build" (2026-09-04), executed by the cloud seat against
`b191423`. The commission made rulings R1–R7 in lane from Patrick's stated requirement ("unless you're able to see it,
you can't trust it"); each is his to veto — a veto is a row here, not a redesign. Product changes are journaled in
`CHANGE_LEDGER.md`; the reviewer's checklist is `research/HANDOFF_ESTIMATE_SHEET_AF.md`.

| id | ruling / choice | what the bytes now say | status |
|---|---|---|---|
| AF-R3 | **NEW-4 reversed** (P-CODE pass 2, Batch T3: `qty_expr` dropped at the load door as "rendered on NO surface, no UI door writes it"). Both premises are false on F18.69: the Estimate grid renders the driver, expression, inputs and result on every engine row and its Formula cell writes it; every cost export carries it. The key name `qty_expr` is **reused**, so F18.68 and earlier drop it under "unsupported override field" with the standing banner (probe-af AF7) — loud beats silent. The door types it (string ≤ 500) and its `params` (≤ 50 identifier-named finite numbers). Takeoff `version` stays 3. | `sanitizeMoneyStore`: `LINE_FORBID = []`, `LINE_SPEC` typed rules; rationale block rewritten in place | recorded; Patrick's veto open |
| AF-R4 | **Function set added** to the closed DSL (executor's call under R4): `ceil floor round abs max min`. The estimator's own rounding, typed on purpose; the engine adds none (CEIL at the material `ordered` step unchanged). A parameter may not shadow RAW/ADJ/WASTE/Q or a function — the line gates EXPR_ERROR and says which. | `resolveExpr` · `RESERVED_NAMES` | recorded |
| AF-R1 | **Level truth**: the item's own drivers moved from `resolveOverride`'s SCHEMA default onto the ITEM layer so the marker can say "library" truthfully. Resolved values identical (G0 4/4). | `resolveItem` layers | recorded |
| AF-W | **Condition waste: the door was added** (F4.1 item 4; the commission left the pick to the executor). The Flags advisory was right — waste is keyed per condition per takeoff (seed :tildes comment) and the engine reads `conditionOverrides[libRef].waste`; the grid's waste cell is ITEM waste, a different figure. The door lives on the Condition detail panel beside pitch, library conditions only (plain conditions are priced by `VESCore.rollup` with no waste — a door there would be dead), journaled, negatives refused. | `setConditionWaste` · `buildCondWasteRow` | recorded |
| AF-L | **Library lens host**: a third full-screen lens (`L`), not a recap-drawer tab — the drawer is 344 px and cannot hold a 15-field editable row, and R7 says the library is not hidden. The built-in seed is labelled "built-in seed library — estimator-authored standards, not quotes" (the guardrail's "demo library" wording was not used: the seed is the owned standard, per its own provenance comment). | `#libview` · `renderLibraryLens` | recorded; wording Patrick's to change |
| AF-P | **Price unit** (R5): out of scope, not added; every surface showing a unit cost now says "per order unit". Follow-on named in the handoff. | headers | open (follow-on) |
| AF-F | **Freeze fence**: the `engine` region was edited on purpose. The manifest does not exist, so the fence gated nothing on F18.68 and gates nothing here; the verifier reports `manifest absent`. Patrick writes the manifest on the accepted pre-batch build before this branch is reviewed for merge. | — | Patrick's act |

## Batch AG — persona pass 1 on F18.69 (TEST BUILD F18.70 on the same branch)

Owner's word 2026-09-04: "You may run persona pass if accepted finalize build and push to main run in loop." Four
read-only personas ran on the F18.69 bytes (main checkout, absolute paths; synthetic fixtures). The seat triaged by the
NOTES.md rubric: (a) money-honesty → fixed · (b) bar-backed → fixed if P0/HIGH · (c) taste → CANDIDATE · (d) contradicts a
ruling → tension. A finding closes only by the filing persona's re-run (pass 2). Product rows are in `CHANGE_LEDGER.md`
(AG-1…); probe rows AF16–AF29 are RED-first on F18.69 (13 of 14 red; AF19 a control).

| id | persona | finding (what was SEEN) | disposition |
|---|---|---|---|
| AG-T5 | P-TRADE | `width=0` in a line formula priced the coil as $0, included, unflagged — sell down by the whole line with nothing in Flags | (a) FIXED F18.70 — a formula evaluating to 0 gates `ZERO_QTY` (excluded, said on the row); library drivers keep their standing behaviour (AF16) |
| AG-T7 | P-TRADE | with a typed Qty on the row, `RAW * widht` was stored silently; the typo surfaced only when the Qty was cleared | (a) FIXED F18.70 — the formula is checked against the row's inputs at commit; the cue says the typed qty stands and whether the dormant formula evaluates (AF28) |
| AG-T8 | P-TRADE | `RAW width` gated as "trailing tokens in expression" — a parser word naming no token | (b) FIXED F18.70 — `unexpected "width" after "RAW" — missing an operator` (AF29) |
| AG-M1 | P-MARKET | Library ＋ new item after a reload reused `ssmr.user.1` and silently replaced the first item (id from the takeoff's counter) | (a) FIXED F18.70 — id from the library's own counter (`nextLibraryUserId`); the Setup form uses it too (AF17) |
| AG-G1 | P-GAME | the fourth lens segment painted over Files & exports at every scale and on the phone (regression from F18.68) | (a) FIXED F18.70 — the document-door pin moved with the wider control; segments shed their words under 720 px (AF18) |
| AG-M2 | P-MARKET | the derivation read "as is = 433.13 → 477 LF" — the 10 % item waste between needed and ordered was in no words | (a) FIXED F18.70 — `= 433.13 + 10% item waste → 477 LF`; the Waste header says it is item waste (AF21) |
| AG-T10 · AG-G10 | P-TRADE · P-GAME | the Library toast said "not this takeoff" while the open takeoff's sell moved by the edit | (a) FIXED F18.70 — "every takeoff priced from it (this one included) now reads that value; no project override was written" (AF29) |
| AG-G5 | P-GAME | the lens cue kept the last error after a good commit | (b) FIXED F18.70 — cleared on a good commit (AF20) |
| AG-G3 | P-GAME | Escape in a Formula cell "closed the whole Estimate lens" | REFUTED-with-evidence — the persona's own output carries `body: "… grid-view …"`, i.e. the lens stayed open; the draft revert is the designed Escape (D-25.2a). AG still stops the key at the cell and says "Reverted" (AF19, a control) |
| AG-G6 · AG-T12 | P-GAME · P-TRADE | the measure select sat before the unit in the Tab walk, and the unit typed after it overwrote it | (b) FIXED F18.70 — measure follows the unit in the row and the walk (AF22) |
| AG-G7 | P-GAME | the funnel line said "Free line" before anything was typed; the library funnel needed exact case and the em dash | (b) FIXED F18.70 — an empty row explains both paths; a partial names the closest library name; the name match forgives case and dash (AF22) |
| AG-G8 | P-GAME | phone: the funnel line and ✓ Add were three screens to the right of the description | (b) FIXED F18.70 — the funnel line sits in the description cell (AF22); ✓ Add stays in the Total column (recorded) |
| AG-G9 | P-GAME | Library lens cells 26 px tall on the phone; segments 20 px | (b) FIXED F18.70 for the lens cells (coarse-pointer rule); the 20 px segments sit in a 24 px bar — queued with G-08 for the Field lens |
| AG-G10 | P-GAME | Library lens ＋ Add button 1,721 px to the right; 164 rows re-render in 218 ms per edit | (b) FIXED F18.70 — the button sits by the description (AF25); the re-render cost is a CANDIDATE (C-AG1) |
| AG-M6 | P-MARKET | the Library lens had no seed-vs-edited colouring per cell | (b) FIXED F18.70 — a cell that differs from the built-in seed reads in the accent with the seed's value in its title; an item the seed lacks says "authored here" (AF25) |
| AG-M7 | P-MARKET | a new item with a blank CSI exported under the division only and printed "—" | (b) FIXED F18.70 — blank CSI lands under the assembly's code (AF24); the grid's group header borrowing its first row's CSI is pre-existing — CANDIDATE (C-AG2) |
| AG-M9 | P-MARKET | the lens listed `desc` twice and lacked `match_code` | (b) FIXED F18.70 (AF25) |
| AG-M5 | P-MARKET | the formula scope names were tooltip-only on the sheet | (b) FIXED F18.70 — the sheet foot names RAW · ADJ · WASTE · Q (by kind) · inputs · the six functions (AF27) |
| AG-T9 | P-TRADE | `Q` changes meaning by kind (RAW for labor, ADJ for material) and the title did not say; a FIXED formula showed "RAW 1 · ADJ 1  =" | (b) FIXED F18.70 — the cell title says it; a FIXED formula reads "fixed Q 1" (AF29 area, by inspection) |
| AG-T11 | P-TRADE | the chip said "line formula" for any LINE-level number; card titles said "project override" for the same record | (b) FIXED F18.70 — "line value" for a line-level number, "line formula" for a formula; card and cell titles say "this takeoff's line value" |
| AG-G12 · AG-T13 | P-GAME · P-TRADE | the waste box kept "-1" after refusal and gave "abc" the negative-number sentence | (b) FIXED F18.70 (AF23) |
| AG-T2 | P-TRADE | workbook: qty needed written as a string; ladder labels bake "(10%)" beside a live Pct cell | (b) FIXED F18.70 — number cell; labels "(× Pct)" (AF26) |
| AG-G16 | P-GAME | BOM CSV header mixed Title Case and lowercase | (c) FIXED F18.70 — Title Case |
| AG-M10 · AG-T16 | P-MARKET · P-TRADE | landing and README said nothing of the derivation, the line formula or the Library lens (VES claims less than it does); the lens header said "edited in this browser" twice | (b) FIXED F18.70 (AF27); header said once |
| AG-S2 | P-SEAT | CI's probe-af step fetched `b191423` (an abbreviation) on a shallow checkout — git fetch takes a full object name; the branch's first run (51) was red on the probes job | (a) FIXED F18.70 — full sha, exit captured, the step and summary renamed "sweep probes" |
| AG-S3 | P-SEAT | handoff checklist row 4 `head -3` could not show the three users it claimed; row 6 gave no route to the F18.68 bytes | (b) FIXED in the handoff |
| AG-S4 | P-SEAT | CHANGE_LEDGER.md line 5 promised line numbers the table does not carry | (b) FIXED — sentence corrected |
| AG-S14 | P-SEAT | the handoff's "CI probe list on those bytes" read as a CI result with no run recorded | (b) FIXED — worded as the seat's run; the CI run and its failure are recorded |
| AG-M3 · AG-M4 · AG-M8 | P-MARKET | cost per estimated unit on no surface; no auto-round control (CEIL always); item creation from the grid stops at a manual line | (c) CANDIDATE / follow-on — with the price unit (R5); recorded in the handoff §7 |
| AG-T14 · AG-T15 | P-TRADE | recap drawer carries no derivation; grid CSV names a labor line like its material sibling | (c) CANDIDATE — the grid and exports are the batch's surfaces; the CSV naming is pre-existing (C-AG3) |
| AG-G4 | P-GAME | caret after a change-commit lands at position 0 (select-all); Enter on the last row's formula cell leaves focus on body | (c) CANDIDATE — the grid's existing select-on-refocus grammar (C-AG4) |
| AG-G13 · AG-G14 | P-GAME | at 115–150 % the Formula and Total columns leave the viewport (horizontal scroll); the Library lens's first frame is 265 ms on 164 rows | (c) CANDIDATE (C-AG5, C-AG1) — recorded in the handoff §6 |
| AG-S5 · AG-S16 | P-SEAT | LEDGER's D-series "first cited at" line numbers are stale against F18.69 (carried from main); NOTES carries doubled date fragments | (d) recorded — a seat adds rows, never rewrites; the function names beside each citation are the durable anchor (C-AG6, Patrick's to prune) |
| AG-S7 | P-SEAT | the PreToolUse guard matches the flag text — evadable by `sh -c`, a variable, or `node -e`; README says selftest has 10 checks, NOTES 12 | (d) recorded — S-03's rail is a text match; hardening is a hook change (Patrick's call, C-AG7); the count drift is noted |
| AG-S13 | P-SEAT | PASS_2026-09 §5.4 says findings go under `evidence/`; the agents return lists and have no Write tool; no `evidence/` at HEAD | (d) tension recorded — the agent definitions are the rail that runs; the pass charter's workflow shape is unbuilt |

## Batch AH — persona pass 2 on F18.70 (TEST BUILD F18.71 on the same branch)

The same owner's word (2026-09-04), iteration 2 of 3. All four personas re-ran on the F18.70 bytes (sha verified by each;
main checkout, absolute paths). Pass-1 rows on the filing persona's re-run: DEAD — AG-T5, T7, T8, T10, T9, T13, T2, T16;
AG-M1, M2, M7, M9, M5, M10; AG-G1, G5, G6, G7, G12, G16; AG-S2, S3, S4, S14. ALIVE-as-recorded — AG-G8 (✓ Add on the
phone), AG-G13/G14 (candidates), AG-M6 for `<select>` cells (fixed here). AG-G3's refutation agreed by P-GAME. Not
re-run by P-TRADE (its pass-2 module never assembled under the worktree guard): AG-T11, T12, T14, T15 — AF22 and the
seat's inspection stand as the evidence, stated as such. Product rows: `CHANGE_LEDGER.md` AH-1…; probe rows AF30–AF35
RED-first on F18.70 (6 of 6 red).

| id | persona | finding (what was SEEN) | disposition |
|---|---|---|---|
| AH-T2 · AH-M12a | P-TRADE · P-MARKET | `RAW * 1.2.3` priced 495 (= 412.5 × 1.2) with no gate, no cue — parseFloat's truncation | (a) FIXED F18.71 — a literal is digits with at most one point; `bad number "1.2.3"` gates (AF30) |
| AH-M12b | P-MARKET | `round(RAW * width * lbsf, 1)` priced 596, the second argument dropped silently | (a) FIXED F18.71 — ceil/floor/round/abs take exactly one argument, max/min one or more; `round() takes one argument (got 2)` gates (AF30) |
| AH-M10 | P-MARKET | the Library lens accepted an empty unit and the next takeoff's row read `item unit undefined`; a labor production rate of 0 was accepted | (a) FIXED F18.71 — `validateLibrary` refuses an empty unit and a rate ≤ 0 with its reason; the unit gate says "(no unit)" (AF32). Free-text CSI stays free text (the seed's own CSI strings are not validated either — recorded) |
| AH-T1 | P-TRADE | after the Qty cell was cleared the row read EXPR_ERROR while the cue and toast still said "the typed quantity 600 LB stands" (seat reproduced) | (b) FIXED F18.71 — a qty edit on a line carrying a formula re-runs the formula check (AF31) |
| AH-T3 | P-TRADE | a new takeoff kept the previous takeoff's cue | (b) FIXED F18.71 — the reset clears it (AF31) |
| AH-M6 | P-MARKET | kind / driven-by selects that differed from the seed carried no accent and no seed value | (b) FIXED F18.71 — the same mark as the inputs; a pipe-list ref compares as shown (the old string compare marked every multi-condition labor item as edited) (AF32) |
| AH-M9 · AH-T6 · AH-G4 | P-MARKET · P-TRADE · P-GAME | 0.05 % condition waste read "0.1 % waste" (one-decimal rounding at five sites); a value committed by leaving the box said nothing; 150 % was stored with no word | (b) FIXED F18.71 — `pctWord` at two decimals everywhere; the blur path toasts the same sentence as Enter (AF33). 100 %+ stays legal (D-26.2 refuses negatives only) |
| AH-G9 | P-GAME | phone 390 px, sheet live: Files & exports at `left −10.6`, its words wrapped inside the 24 px band — the AG pin (342 px) sized for worded segments | (b) HIGH FIXED F18.71 — under 720 px the four pins follow the wordless segments (184 px); the button never wraps (AF34) |
| AH-G2 | P-GAME | the Plan segment had no title and no aria-label; wordless under 720 px | (b) FIXED F18.71 — title + aria-label on all four (AF34) |
| AH-G1 | P-GAME | after the 6 s cue expired the only sign of a gated row was the cell text | (b) FIXED F18.71 — `tr.gated` with a tint and a left bar (AF35) |
| AH-G6 | P-GAME | the Library ＋ Add button was 30 px on a coarse pointer | (b) FIXED F18.71 — joins the coarse rule (AF35) |
| AH-G7 | P-GAME | Escape in a Library cell closed nothing and committed the draft on blur; Enter did nothing | (b) FIXED F18.71 — Escape reverts and says so, Enter commits and the re-render puts focus back; Enter on the ＋ Add row adds (AF35) |
| AH-T5 | P-TRADE | "the Flags list was empty in both gated states" | REFUTED-with-evidence — `#asmFlags` is filled by `renderAssembly`, which the persona did not call; the seat's run: "1 line(s) excluded … Coil — unknown token "widht"" (AF31 control) |
| AH-M13 | P-MARKET | "a free line has no derivation cell, so the landing sentence overreaches" | REFUTED-with-evidence — the free line's row reads `manual line · ADJ 55 LF as is = 55 → 55 LF`; the persona's text match landed on the group header and subtotal rows, which have none |
| AH-G10 | P-GAME | "the Formula header carries no tooltip" | REFUTED-with-evidence — the 7th header does (the persona read the 8th, Total) |
| AH-M14 | P-MARKET | "the waste box has no unit word" | REFUTED for the label (`Waste % (this condition)` sits beside it); the fraction-typed-as-fraction case is the labelled percent grammar — recorded |
| AH-T4 | P-TRADE | the workbook carries the derivation as words and the quantities as literals; only the ladder is live | (c) CANDIDATE C-AG8 — by design this batch (R1: the sheet renders what it computes; live quantity math in the workbook is a follow-on) |
| AH-M11 | P-MARKET | `RAW *` on an item with a density is refused as "2 drivers" before the parse | (c) CANDIDATE C-AG9 — both facts are true; ordering the refusals is taste |
| AH-M15 | P-MARKET | round trip: `production_rate: null → undefined` on labor items | (c) recorded — no behaviour rides on the difference |
| AH-G3 | P-GAME | the five trailing export columns carry three header casings (grid CSV lowercase, BOM Title Case, workbook Sentence case) | (c) CANDIDATE C-AG10 — the grid CSV's lowercase headers are pre-existing and read by probe-ab |
| AH-G5 · AH-G8 | P-GAME | the Library lens table is 2,193 px wide (scrolls inside `.gscroll`); the open lens is not remembered on reload | (c) recorded with C-AG5; the rest state is the Plan (probe-aa) |
| AH-S1 · S2 · S3 · S8 · S9 | P-SEAT | handoff §8 still said F18.69 / 15 checks; handoff :36 promised line references CHANGE_LEDGER :5 disclaims; "33 rows" was 35; CLAUDE.md header date; verify.yml header says one probe | (b) FIXED in the registers this batch |
| AH-S4 · S5 · S6 · S7 | P-SEAT | CHANGE_LEDGER AG-10 / AG-7 / AG-13 / AG-8 evidence cells cited checks that assert less than the row (fixed Q, line value, provenance-once, Title Case, the 720 px breakpoint) | (b) FIXED — the cells now say which claims are asserted and which are by inspection |
| AH-S10 | P-SEAT | the agent definitions say "read CLAUDE.md, NOTES.md and LEDGER.md first" while a worktree is cut from `origin/main` | (b) FIXED — each definition says: read the build and the registers from the main checkout by absolute path, verify the sha first |
| AH-S11 | P-SEAT | the guard hook blocks an invocation-shaped string inside quotes (a false positive) and lets `sh -c` / a variable through (S7, recorded) | (d) recorded — hardening is a hook change, Patrick's (C-AG7) |
| AH-S12 · S13 · S14 · S15 · S16 | P-SEAT | hooks vs the protocol, probe README vs argv, counts across NOTES/LEDGER/handoff: nothing found; `.claude/loop.md` step 1 needs GitHub access the seat may lack | (c) recorded; README's selftest count corrected to 12 |

## Batch AI — persona pass 3 on F18.71 (TEST BUILD F18.72 on the same branch — iteration 3 of 3)

All four personas re-ran on the F18.71 bytes (sha verified by each; main checkout, absolute paths). Pass-2 rows on the
filing persona's re-run: every fixed row DEAD (AH-T1/T2/T3/T6, AH-M6/M9/M10/M12a/M12b, AH-G1/G2/G4/G6/G7/G9, AH-S1…S10);
the refutations AH-T5, AH-M13, AH-M14, AH-G10 agreed by their filers; AG-T11 and AG-T12 now DEAD by P-TRADE's own run;
AG-T14/T15 alive as candidates. Product rows: `CHANGE_LEDGER.md` AI-1…; probe rows AF36–AF40 RED-first on F18.71 (5 of 5
red). P-GAME's four-lens phone sweep could not assemble under the worktree guard — AF40 is the seat's, run on the bytes.

| id | persona | finding (what was SEEN) | disposition |
|---|---|---|---|
| AI-T1 · AI-M4 | P-TRADE · P-MARKET | a library density of 0 was accepted (coverage 0 is refused) and the line priced MATCHED, included, $0.00, no flag — the AG-T5 rule (never an included $0) was open for the density driver; CHANGE_LEDGER AG-1 had said "library drivers unchanged" | (a) FIXED F18.72 — `validateLibrary` refuses density ≤ 0 as it does coverage; a density resolving to 0 at any layer gates ZERO_QTY (AF36) |
| AI-M3 | P-MARKET | with a library unit cost cleared, the Flags list read `undefined — no library match — needs price` and the excluded row carried no tint | (a) FIXED F18.72 — the list names the line; NO_MATCH rows carry `tr.gated` (AF37). Clearing a unit cost stays legal: "needs price" is a true state, said |
| AI-M2 | P-MARKET | the book stored `RAW *` (no other driver) and every takeoff from it would gate that line | (b) FIXED F18.72 — the validator parses a library formula against a scope answering 1 for any name; the grammar's own refusals refuse, an unknown name (a per-line input) does not (AF37) |
| AI-M1 | P-MARKET | after a change and a change-back the header read "edited in this browser · fingerprint 7e4e6a2a" — the seed's fingerprint under the edited word; the seed header never said "built-in seed library" (its test `!prov.source` was never true) | (b) FIXED F18.72 — `libraryIdentity` names the seed when the fingerprint is the seed's; the lens header follows the identity (AF37) |
| AI-M5 | P-MARKET | waste 0.001 % read "0%" in the toast, journal and row while CEIL moved 100 → 101 LF | (b) FIXED F18.72 — four decimals, trailing zeros dropped, at every site and in the box (AF38) |
| AI-T4 · AI-T5 | P-TRADE | the basis column wrote `ADJ=418.68749999999994;WASTE=0.015`; a linked ＋ labor line wrote no basis | (b) FIXED F18.72 — one writer: six-decimal numbers, waste as a percent, a manual line with a scope carries it (AF38) |
| AI-T6 · AI-M7 | P-TRADE · P-MARKET | `RAW ** 2` gated as `unknown token "*"`; `RAW*WIDTH` / `ROUND(RAW)` said nothing of case; the cue read "between them?. The line is flagged" | (b) FIXED F18.72 — a stray operator is named as unexpected; a name matching a known one in another case says so; the cue strips the seam (AF39). `007` evaluating as 7 is recorded, not changed |
| AI-G3 | P-GAME | Escape in an untouched Library cell still said "Reverted" | (b) FIXED F18.72 — nothing typed, nothing said (AF39) |
| AI-G1 | P-GAME | (SRC/INF) Escape on a Library `<select>` would fall through to the window layer and close the lens | REFUTED-with-evidence — a real Escape on the kind select leaves the lens open (AF39, now a control); the handler stops at the cell anyway |
| AI-G5 | P-GAME | the four-lens phone sweep at 390 / 720 px was not measured (harness) | seat's run (AF40): the document door was clear of the segments in every lens, but at 390 px the BRAND ran 157 px under it in the Estimate / Schedule / Library lenses and wrapped to two lines on Plan — (b) FIXED F18.72: the brand's suffix hides under 720 px with a sheet live |
| AI-M8 | P-MARKET | landing and README: "every priced line … can carry its own formula and inputs" — a free line has no formula cells (by ruling AF-6: a manual line has no library formula) | (b) FIXED F18.72 — both say a library-priced line carries one; a free line is priced as typed (AF40) |
| AI-M12 | P-MARKET | the waste box had no programmatic name (label is a sibling div) | (b) FIXED F18.72 — `aria-label` (AF38) |
| AI-T2 | P-TRADE | a library unit cost of 0 prices an included $0.00 line with "unit cost set" as the only word | (c) recorded — a free item is legal (`unit_cost ≥ 0`); the row shows $0.00 and the derivation |
| AI-T3 | P-TRADE | the printed cost sheet carries the ordered quantity and no basis (1,032 LF at 150 % waste with nothing between it and 412.5 measured) | (c) CANDIDATE C-AG11 — the internal cost sheet joins the recap drawer (AG-T14) as a surface without the derivation; the grid and every export carry it |
| AI-T7 | P-TRADE | the grid CSV writes a formula starting with `-` as `'-RAW * width` | recorded — csvSafe's formula-injection guard, stated in CHANGE_LEDGER AF-12 |
| AI-G2 | P-GAME | segments go wordless at ≤ 720 px while the rail's rest-collapse uses ≤ 719 px | (c) CANDIDATE C-AG12 — one pixel, two rules |
| AI-G4 | P-GAME | the cue leads with the status code ("EXPR_ERROR — unknown token …") | (c) recorded — the row reads the same way; taste |
| AI-M6 | P-MARKET | the waste box takes `1e1` (JS Number) while the formula cell refuses `1e3` | (c) recorded — two grammars for two doors; the formula's is closed on purpose |
| AI-M9 | P-MARKET | three vocabularies for one field across headers, refusals and toasts (`Prod. rate` / `production_rate` / `production rate`) | (c) CANDIDATE C-AG13 |
| AI-M10 | P-MARKET | a refused lens draft stays in the cell (`.bad`, message, focus) while the book keeps its value | (c) recorded — by design: the draft stays for correction, marked; Escape reverts it |
| AI-M11 | P-MARKET | a blank description is accepted; the sheet shows the id-derived name | (c) recorded — the same fallback every seed item without a desc uses |
| AI-S1 | P-SEAT | the CLAUDE.md a worktree persona is handed in its context carried the F18.70 identity while the file on disk read F18.71 and the worktree's copy F18.68 | (d) recorded — the injected copy is the SESSION's CLAUDE.md as loaded at session start (harness), neither file; the seat read the three worktrees' CLAUDE.md: all F18.68. The definition's rule (read by absolute path, verify the sha) is the right guard |
| AI-S2 · S4 | P-SEAT | six AH evidence cells and AG-13's "(× Pct)" claimed more than their checks assert | (b) FIXED in CHANGE_LEDGER — worded to the assertions, "by inspection" where so |
| AI-S3 · S5 · S6 | P-SEAT | handoff title and §5 still described pass 1; README named one probe where the job runs eleven; "39 items" vs 40 ids; S14 missing from the P-SEAT row | (b) FIXED in the registers |
| AI-S7 | P-SEAT | handoff §4 checklist rows 1–5, 7 re-run on the bytes: all match | nothing found |

## Sweep and batch records
- `SWEEP_68c8e23.md` — the live-repo sweep (findings F-01…F-14, proposals P-01…P-12).
- `MOBILE_FEASIBILITY_68c8e23.md` — phone/tablet measurements and the ROI frame.
- `FIELD_LANE.md` — the field-lane charter, interior lane included.
- Batch V (F18.59) and Batch W (F18.60) — see NOTES.md §State and the build-stamp chain in `src/VES_PM.html`.
- Batch U (F18.67, U1) and Batch AE (F18.68, Print takeoff) — see NOTES.md §State and the build-stamp chain.

## PASS_2026-09 — findings on record (triage: NOTES.md rubric; owner rules)

| id | persona | finding (what was SEEN) | disposition |
|---|---|---|---|
| X-T2 | seat (probe) | Under file:// pdf.js parsed every PDF on the main thread (fake worker after a null-origin same-origin test); longest task 552 ms desktop / 1,484 ms at 4x on a 40k-segment sheet | (a) FIXED F18.61 — one Worker started at boot, port handed to pdf.js; probe-x X3–X5 |
| S-01 | P-SEAT | "Read-only" persona agents carry Bash, which can write; prose, not a rail | (b) agents now run in `isolation: worktree`; Bash stays (probes need it) — the worktree is the rail |
| S-02 | P-SEAT | CLAUDE.md said the Stop hook "will not let a turn end on a failure"; it blocks once, then allows (docs' cap) | (b) FIXED — CLAUDE.md states the real contract |
| S-03 | P-SEAT | the verifier's two write flags were forbidden in prose only | (b) FIXED — PreToolUse guard hook, selftest rows 11–12 |
| S-04 | P-SEAT | selftest copied over the tracked verifier config and restored it only on a clean exit | (b) FIXED — trap restores on any exit |
| S-05 | P-SEAT | README named F18.59 while bytes were F18.60; README said "freeze (none currently)" with two regions fenced | (b) FIXED — README names no build; freeze sentence true |
| S-06 | P-SEAT | NOTES said the `f18.55` tag was gone; LEDGER said it remains; remote still has it | (b) FIXED in NOTES; the deletion is Patrick's (a seat cannot delete a remote ref) |
| S-07 | P-SEAT | NOTES named `release/VES_F18.57.html` and `evidence/w2/…` paths not at HEAD | (b) FIXED — historical wording |
| S-08 | P-SEAT | LEDGER D-24.7b row claimed a Chrome+Firefox bench runs in CI; CI is headless Chrome only | (b) FIXED — row corrected; the bench stays open |
| S-09 | P-SEAT | gate/README called the product `VES.html` | (b) FIXED |
| S-10 | P-SEAT | CLAUDE.md carries content derivable from the verifier (bytes, sha, exit codes, freeze names) and repeats priors held in NOTES | (c) CANDIDATE — §Identity is the owner's convention; prune is his call; priors now point to NOTES |
| S-11 | P-SEAT | No committed `/goal` text; S1 has no fixed condition to show met | (c) CANDIDATE — the batch stop condition is stated in CLAUDE.md §Seat method; a `/goal` string is typed per session |
| S-12 | P-SEAT | A `CLAUDE_PROJECT_DIR`-rooted Stop hook verifies the parent checkout, not a worktree | (c) CANDIDATE — worktree subagents are read-only by rail; note carried |
| S-13 | P-SEAT | "inside this worktree" names a surface; the principle is one writable copy of the product | (b) FIXED — CLAUDE.md wording |
| Y-G1/G2 | seat (probe) | Sell-change repaint 9–33 ms desktop / 27–184 ms phone-4x on HUD, grid footer, recap; trace-point handler ≤ 1.7 ms desktop / ≤ 11.8 ms phone-4x | (b) bar met on F18.61 with no change; probe-y is the standing gate; the 184 ms margin-input path is the one to watch |
| Z-G6 | seat (probe) | Hover / long-press money peek: priced lines, cost, sell, share; no lens or arm change; Σ condition sells + fixed allowances = recap sell (diff 0.00) | (b) LANDED F18.62; probe-z is the standing gate |
| AA-G5/G7 | seat (probe) | Rail, drawer pin, fill mode, grid ft, theme and UI scale restore after reload; 1.5x scale keeps every lens hittable and the pointer math true (111 ft trace) | (b) LANDED F18.63; probe-aa is the standing gate |
| T-01 | P-TRADE | The "client review" .xlsx (recap Summary tab door, file `*-client-review.xlsx`) exports COST — Recap tab TOTAL 51,804.12 while the bid for the same state prints Total $64,620.46; two client-labelled surfaces $12,816.34 apart; `clientReviewModel` buckets `l.extended` with no ladder (confirmed in bytes) | (a) FIXED F18.65 (Batch AB-1) — the workbook is the bid in sell, live SUM formulas; probe-ab AB1 |
| T-02 | P-TRADE | A saved takeoff re-prices on another machine with no signal: the JSON carries conditions, measurements and overrides but no library and no library fingerprint; loaded into a fresh profile it silently priced $64,620.46 where it was saved at $73,352.26 (edited library) — toast "Takeoff loaded." | (a) FIXED F18.65 (Batch AB-2) — library name + fingerprint in the file; mismatch raises the standing banner (probe-ab AB2). Embedding the whole library in the takeoff stays a design CANDIDATE |
| T-03 | P-TRADE | Estimate CSV footer carries Cost and Sell but no Overhead / Markup / Profit rows — the reader cannot see how the sell was reached; the ladder exists as values only on the cost-sheet PDF | (b) FIXED F18.65 (Batch AB-3) — Overhead / Markup / Profit rows, apportioned cents, Cost + ladder = Sell (probe-ab AB3) |
| T-04 | P-TRADE | Every XLSX carries values only, no `<f>` formulas (client review 2 sheets, library 5 sheets) | (b) FIXED F18.66 (Batch AD-2) — internal Estimate .xlsx with live formulas; the client review workbook carries live sums since F18.65 (probe-ad AD2) |
| T-05 | P-TRADE | Files & exports menu offers no .xlsx; "Review .xlsx" lives on the recap Summary tab, "Export library (.xlsx)" sits at y=947 in the Setup modal (scrolls) | (c) FIXED F18.66 (Batch AD-1) — both workbooks in the exports menu (probe-ad AD1) |
| T-06 | P-TRADE | Toast text stays stale across a print (RFQ export text still showing after the cost sheet printed) | (c) FIXED F18.66 (Batch AD-3) — prints name themselves (probe-ad AD3) |
| T-07 | P-TRADE | First bid from the demo: three gestures, one identity gate, bid Total == recap == grid CSV == cost sheet; N-R1 row rounding on the record ($976.75 vs $982.58) | holds; N-R1 open (owner's lane) |
| T-08 | P-TRADE | Landing carries the four absences verbatim; no price/subscription/login words on the body; zero http(s) requests across boot, demo, bid and all exports (one data: font) | holds (T1 met) |
| T-09 | P-TRADE | probe-x 5/5 on F18.63: phone 4x first raster 1,489 ms, longest task 98 ms; desktop 310 ms / 0 | holds (T2 met) |
| T-10 | P-TRADE | Landscape phone two-tap trace lands (111.56 ft) with touch events unthrottled; the earlier landscape null was harness timing under 4x | INF — refutes the memo's open landscape hole as a product defect |
| T-11 | P-TRADE | No bid-alternate surface anywhere | (b) bar row M3 — B9, held unless asked |
| T-12 | P-TRADE | JSON round-trip within one browser: sell identical to the float | holds |
| G-01 | P-GAME | The printed bid followed the UI scale: 2 pages at 150%, 1 at 100% | (b) client paper — FIXED F18.64 (print media resets root zoom; probe-ac AC1) |
| G-02 | P-GAME | On a phone the UI-scale control lives in the hidden rest sliver; reached only after the exports menu expands the toolbar, and a tap there fired an export | (b) FIXED F18.64 — "Text size" item in the exports menu (AC4) |
| G-03 | P-GAME | Phone at 130/150%: dock, card ✎ ◉ ⌖, Hide and the exports door left the 390 px screen | (b) FIXED F18.64 — scale range follows the viewport (narrow ≤ 115%); AC2 |
| G-04 | P-GAME | Phone at 130/150%: the money peek's amount column was off-screen | (b) FIXED F18.64 — peek width in zoomed px + the clamp; AC2 |
| G-05 | P-GAME | Phone at 130/150%: exports-menu items below the screen, menu not scrolling | (b) FIXED F18.64 — cap measured after the toolbar expands + the clamp; AC2 |
| G-06 | P-GAME | Phone at 130/150%: the measure bar painted over card 1 | (b) closed by the clamp (≤ 115% on narrow); re-check under the Field lens |
| G-07 | P-GAME | Phone at 90%: coarse-pointer targets shrank to 36 px | (b) FIXED F18.64 — coarse pointers floor at 100%; AC3 |
| G-08 | P-GAME | Touch targets at 100% on the phone: card ⌖ 23×24, ◉ 19×18, ✎ 25×22, Hide 44×22, rack tools 29×34, drawer buttons h 24–32, schedule rows h 16 — the §3 bar is 44 | (b) bar row — queued for the Field lens (FIELD_LANE F-1), where the card geometry is redrawn for touch |
| G-09 | P-GAME | Unpinned recap: the click that dismisses it also acts on the sheet (added a count marker); the exports scrim consumes its click (F-C1) — two rules for one gesture | (d) tension recorded — src comment at the dismiss site says "both dismisses AND proceeds" by design; Patrick's call |
| G-10 | P-GAME | The money peek has no keyboard door (focus on ⌖ shows nothing) | (c) FIXED F18.66 (Batch AD-4) — focus on a card control shows the peek (probe-ad AD4) |
| G-11 | P-GAME | No remap surface exists (G4) | (b) B9, held |
| G-12 | P-GAME | Dock width, snap, split mode do not persist | (c) FIXED F18.66 (Batch AD-5) — snap, split mode, dock width persist (probe-ad AD5) |
| G-13 | P-GAME | Phone control reminders at rest: only "⌖ or 1–9 to measure" (a keyboard hint on a keyboardless lens) | (b) Field lens (FIELD_LANE F-1) |
| G-14 | P-GAME | Expanded toolbar stays expanded across a drawer tap; the file:// banner takes 19% of a grid takeoff's screen; C-S4 overprint at 390 px | (c) CANDIDATE — banner shown only when a PDF path is relevant; C-S4 stands |
| G-15 | P-GAME | Schedule start/dur inputs 11.5 px / 22 px tall on a coarse pointer | (b) FIXED F18.64 — schedule inputs join the coarse-pointer rule |
| G-16 | P-GAME | Feedback timing: scale click 40–45 ms to first frame; theme 17 ms; lens switches 7–99 ms; phone tap 48 ms | holds (G2 met) |
| G-17 | P-GAME | Peek honesty under a typed money change: peek = HUD = recap | holds |
| G-18 | P-GAME | Desktop HUD tiers at rest and at 150%: every control hittable | holds |
| G-19 | P-GAME | Estimate lens on the phone: opens in 48 ms, returns to Plan, cells 40 px | holds |
| M-01 | P-MARKET | Client-labelled Review .xlsx carries COST (Recap total 51,804.12) while the bid carries SELL (64,620.46) — corroborates T-01 | (a) FIXED F18.65 with T-01 |
| M-02 | P-MARKET | No Estimate XLSX exists; every export is values-only; `csvSafe` prefixes `'` to any cell starting with `=`, so a CSV cannot carry a formula — a recorded tension between bar M2 and the injection guard | (b) FIXED F18.66 for the workbook (Batch AD-2); CSVs stay values by design (csvSafe) — the seat's reading stands unless Patrick rules otherwise |
| M-03 | P-MARKET | Opening a revised PDF over a takeoff clears the traced measurements after a confirm; no "what moved" list | (b) B8 held (revision delta) |
| M-04 | P-MARKET | No bid-alternate surface; the only "Alternates" heading lives in dead code (`clientReviewHTML`) | (b) B9 held; M-7 open |
| M-05 | P-MARKET | T2's 2 s first-raster figure is met best-of-3 but missed on single loads in a loaded VM; the input-never-blocked half held every run | INF — the 2 s bar is the seat's choice; the buyer's complaint is blocked input (met) |
| M-06 | P-MARKET | T1 met on landing and README | holds |
| M-07 | P-MARKET | README/landing say "copy the file to any machine and it works there" while LICENSE grants no right to copy or use | (d) tension recorded — F1 price/license is Patrick's open call; the copy is not changed by the seat |
| R-1 → M-07 | owner (2026-09-04, READINESS_ad07fff §0) | VES will not be sold; donations are accepted; the price half of F1 is ruled. Recorded against M-07; the license half (R-2 extent) is not ruled and the copy is unchanged | recorded, row M-07 stands |
| M-08 | P-MARKET | VES claims less than it does: the audit trail (Audit CSV with identity rows, calibration and warning status; the bid's Sheet column), per-item quantity formulas and per-location breakdown are named nowhere on landing or README | (b) FIXED F18.65 (Batch AB-4) — one sentence on the landing and in the README (probe-ab AB4) |
| M-09 | P-MARKET | Tablet row: nothing observed either way | — |
| M-10 | P-MARKET | Price-creep row: no pricing text exists beyond the four absences | — (F1) |
| R-1 → M-10 | owner (2026-09-04, READINESS_ad07fff §0) | There is no price (R-1). Recorded against M-10 | recorded, row M-10 stands |
