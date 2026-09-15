# RELEASE_NOTES

One section per release. Every claim here names the gate that proved it — probe name, pass count,
and the count on the build before the batch landed ("RED-first"), read from `LEDGER.md`. No time
estimates, no promises: what is here landed and is gated; what is not built is named as open.

## 2.0.0

The stamp changes from `F18.x` to semver here (R-2, `LEDGER.md` §Batch B0). The F18 line ended
because two branches — kind-curie and estimate-sheet-depth — both reused build numbers F18.69–F18.71
for different content; there was no longer one line to count. `main` still carries F18.68
(3,570,752 bytes, sha256 `494d288b…`) until this branch is reviewed and fast-forwarded; the F18.69–
F18.72 test-build lineage (branch `claude/estimate-sheet-depth-vrhnf6`) is not part of this history.
From Batch B0 forward the stamp is `2.0.0-rc.1` … `2.0.0-rc.8`, `2.0.0` at this release — one lineage,
built from F18.72 content-merged with Patrick's 9/03 fixes (`LEDGER.md` §Batch B0).

### The four asks

**1. Print a takeoff that spans more than one PDF sheet.** Files & exports ▾ → Takeoff… opens a
sheet chooser when more than one sheet carries measurements; each measured sheet prints as its own
landscape page — the marked-up plan, its own legend, its own quantities — and leaving a sheet out
puts "Sheets shown: 1, 3 of 3" on the paper so a partial print is never mistaken for the whole job.
One print path builds both the takeoff's per-sheet figures and the proposal's (`visualFiguresHTML`);
the older `printTakeoffDoc` path is gone. **Gate:** `probe-b4-print` 9/9 (1/9 on the pre-batch build)
· `probe-ae` 5/5 · Batch B4, build `2.0.0-rc.6` (`LEDGER.md` §Batch B4).

**2. Pitch as one number, read the same way everywhere.** `c.pitch` is the rise per 12 and the only
store — a bare `6`, `6/12`, `6:12`, `6"/12` all mean the same thing, on either pitch door (the
card's own field or the condition detail panel), and the plan, the card, every money surface and
every export read that one value back. A prior two-store design (a plain field the display read and
a separate override the pricing engine read) could show a pitch on screen and price flat — B1's
migration finds and reconciles every case of that on an old file (see Migration, below). Bounded
0–24; out-of-range input (`999`, `1e9`, `abc`) is refused, the value unchanged, nothing journaled.
**Gate:** `probe-b1-pitch` 12/12 (1/12 on the pre-batch build) · `probe-p903-pitch` 6/6 · Batch B1,
build `2.0.0-rc.2` (`LEDGER.md` §Batch B1).

**3. Sections, typed or drawn.** Section is `c.location` — type a name, or draw a Section region on
a sheet (a rack tool beside the measuring tools) and measure inside it, which tags the condition
once, at measure time, and never re-files it later even if the region moves. Every money surface —
recap, Estimate grid, client bid, cost sheet, takeoff quantities, proposal, the Estimate CSV and
workbook — now groups **Section → System → line** with a subtotal at each level; "Unassigned" is a
named section, never a dropped one. **Gate:** `probe-b2a-sections` 7/7 (0/7 on the pre-batch build,
typed sections) + `probe-b2b-regions` 8/8 (0/8, drawn regions) · Batch B2a build `2.0.0-rc.3` / Batch
B2b build `2.0.0-rc.4` (`LEDGER.md` §Batch B2a, §Batch B2b).

**4. More colors, and any color, that still separates in grayscale.** The palette grows from 8 to 24
hues — the first 8 are byte-identical to before, so an existing file's colors never move — plus a
native color picker and hex field for any custom color, journaled and saved like any other edit.
Every color (palette or custom) carries a unique dash-and-hatch pattern, drawn as a subtle on-screen
hatch and a print-legend glyph, so two conditions that read the same in grayscale still print
distinguishable. Label ink (on the plan plate, the card chip, the legend glyph) is picked by WCAG
contrast against the color underneath it, for any hex. **Gate:** `probe-b3-colors` 8/8 (1/8 on the
pre-batch build) · Batch B3, build `2.0.0-rc.5` (`LEDGER.md` §Batch B3).

### Also in this release

- **One description per item, and the printed words of an EDGE report** (Batch B5, build
  `2.0.0-rc.7`): a single function (`descOf`) is now the name every document and export prints for a
  condition, a general line, or a library-linked line, replacing five surfaces that each built that
  name their own way. Document columns match Patrick's EDGE report wording (takeoff: Legend · Pitch
  · Description · SF · LF · EA; grid/CSV/XLSX: Description · Quantity · EU · Ord Qty · Ord Un · Unit
  Price · Prc Un · Net Cost); on-screen chrome (menus, buttons, "sheet") is untouched. `probe-b5-words`
  6/6 (1/6 on the pre-batch build); `tools/vocab-check.mjs` (new, in CI) found 6 banned/inconsistent
  words on the pre-batch build, 0 on the patch. **Gate:** `LEDGER.md` §Batch B5.
- **The persona fix batch** (Batch B6F, build `2.0.0-rc.8`): three read-only personas ran a full
  takeoff, a clean-profile first look, and an adversarial read of the diff against `2.0.0-rc.7`
  (`research/persona-2.0.0/`), filing 6 P0 and 8 HIGH findings between them. Every one is closed here
  — a measurement on an unscaled sheet is named PENDING on every money surface instead of silently
  reading 0; `addGeneralItem`/`removeGeneralItem` are journaled (Ctrl+Z no longer produces phantom
  undos); the reconcile undo (below) sets conditions flat by name instead of deleting the pitch;
  section keys are compared case- and whitespace-folded so a takeoff never drops a condition from a
  group; the 2-point scale tool now arms on every unscaled sheet, not sheet 1 alone; a new condition
  scrolls into view; the bid's refusal names the lines that still need a price. **Gate:** `probe-b6f`
  17/17 (1/17 on the pre-batch build) · full sweep green · `LEDGER.md` §Batch B6F.

### Migration — what you will see on an old file

A file this release line itself wrote (`2.0.0-rc.2` and later, or this release) opens with no
banner — there is nothing to reconcile. A file from before that (any earlier build, `F18.x`
included) may raise one or two banners, **once**, the first time it is opened:

- **The reconcile banner** — named conditions that showed a pitch on screen but were priced flat in
  the old two-store design. They now price at the pitch shown, and the banner names each one, its
  new pitch, the dollar shift, and the running Sell before/after; **"Keep (priced at the displayed
  pitch)"** (the default) or **"Set these flat instead"** are the two doors, and Ctrl+Z reaches the
  same choice.
- **The legacy-factor confirm** — per condition, only for a pitch number that could never have been
  a rise (a bare multiplier from an older format): **"Read it as `n`/12?"** or **"Keep `×n.nnn` as
  saved"**. Nothing about that one condition changes until you answer; answering either way is
  recorded on the undo stack, not left standing.

A file **newer** than a build understands (a 2.0 file opened in an older build) is refused, by name
— "This takeoff is version 5, newer than this build understands" — never guessed at or silently
dropped. **Gate:** `probe-b1-pitch` (reconcile + legacy rows) · `probe-af` AF7 (version refusal) ·
`LEDGER.md` §Batch B1.

### Known candidates, left open

Taste and layout items a persona pass surfaced and Patrick has not ruled on; none of them move
money or block a takeoff:

- **F-F7** — the recap panel is collapsed by default even on a takeoff that already has many priced
  conditions in it.
- **E-F4** — the wording an estimator sees when undoing right after a reload could be plainer.
- **C-B2a-1** — the recap dock (316px) shows the Sell column with Cost scrolled behind the sticky
  column at that width; the Estimate lens is where the same table reads whole.
- **C-B5-1** — the Estimate grid's EU / Ord Un / Prc Un columns read the same unit on every row
  today (this engine resolves one unit per line); collapsing them to one `Unit` column is a
  candidate until the engine gains order-unit conversion.

Full detail and IDs: `LEDGER.md` §Batch B6, §Batch B6F.

### License

MIT. Copyright (c) 2026 Patrick Moriarty / Bitumen Machina LLC (R-8, `LEDGER.md` §Batch B0) — see
`LICENSE`.
