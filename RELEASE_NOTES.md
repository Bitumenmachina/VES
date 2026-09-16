# RELEASE_NOTES

One section per release. Every claim here names the gate that proved it — probe name, pass count,
and the count on the build before the batch landed ("RED-first"), read from `LEDGER.md`. No time
estimates, no promises: what is here landed and is gated; what is not built is named as open.

## 2.1.0

The stamp moves from `2.0.0` to `2.1.0` here — five batches plus one fix batch, closing out the
quality-of-life items opened after the 2.0.0 release: deductions, hide/solo, selection, frictions
and exports, and the money trio. Batch stamps ran `2.1.0-rc.1` … `2.1.0-rc.6`, `2.1.0` at this
release (`LEDGER.md` §Batch Q1…Q6).

### The batches

**Q1 — Deductions.** Trace a cutout inside a measured area — a chimney, a curb, a skylight — with
`D` and it subtracts from that area's own quantity instead of needing a second, offsetting
condition. The cutout draws in the field's own color with a dashed edge and a cross-hatch fill,
labeled with a minus sign, and the card, the grid, and the recap all read the net figure
(`1,156.7 SF (−101.2)`). Closing the cutout offers to hand its perimeter straight to a flashing
condition; the cutout and the flashing footage land as one entry, so one Ctrl+Z removes both. Cut
past the field itself and the quantity holds at zero with a note saying so — never a negative
price. **Gate:** `probe-deduct` 10/10 (1/10 on the release 2.0.0 build) — `LEDGER.md` §Batch Q1,
build `2.1.0-rc.1`.

**Q2 — Hide / solo.** A strip above the condition cards adds Solo, Hide others, Hide measured, and
Show all, plus an "N hidden" chip that is itself a Show-all button. Alt+click any card's own eye to
solo that one condition; a plain click keeps the existing single toggle. `H` hides whatever
condition is armed, `Shift+H` brings everything back. Hiding is a screen aid only — the rollup,
every card's quantity, the grid, the recap, the bid, and the printed takeoff itself read exactly
the same whether a condition is shown or hidden. **Gate:** `probe-hide` 8/8 (red on the build
before this batch — the strip's own functions did not exist yet) — `LEDGER.md` §Batch Q2, build
`2.1.0-rc.2`.

**Q3 — Selection.** Clicking a condition now names what you hit in a chip beside the pointer —
trade word, condition name, value, sheet — with buttons to edit, delete, move, duplicate, or
re-assign it. Shift+click adds more to the selection; dragging on empty paper sweeps a marquee
around several shapes; `Ctrl+D` duplicates in place, landing selected; `Shift+R` re-assigns the
selection to another condition of the same kind (the wrong kind is refused, with the reason
spoken); `Shift+Space` steps through whatever is stacked under the pointer; `Esc` clears the
selection. Dragging the body of a selected shape moves it; dragging an unselected one still pans
the sheet. A bulk delete, move, or re-assign is one entry on the undo stack, whole. **Gate:**
`probe-select` 10/10 (2/10 on the Q2 build, before this batch) — `LEDGER.md` §Batch Q3, build
`2.1.0-rc.3`.

**Q4 — Frictions and exports.** Calibrate one sheet and it now offers to apply the same scale to
every other unscaled sheet in one step. `Shift+L` cycles the on-plan value labels (plain `L` still
opens the Library, unchanged). Holding Shift while drawing locks the line to level, plumb, or a
45° angle. A condition card's `⋮` menu gains Duplicate condition and Type a quantity…. The
Estimate grid's three unit columns (estimating, ordering, pricing) fold into one Unit column, the
grid scrolls inside its own frame with the Description column pinned, Tab now wraps row by row
across the grid's cells, and the empty-undo sentence prints once per takeoff instead of on every
press. Files & exports now lists the BOM, condition-totals, and audit spreadsheets with a plain
sentence saying what each one holds. **Gate:** `probe-qol` 12/12 (11/12 red on the rc.4 bytes
before the landing edits, one neutral) — `LEDGER.md` §Batch Q4, build `2.1.0-rc.5`.

**Q6 — The money trio.** Three rulings on how a job's dollars are shown and rounded. Order
quantities keep rounding up by default; any line can now carry its own override to round to the
nearest whole unit or to the exact figure instead. Overhead becomes its own named row everywhere
money is shown, instead of riding folded inside a combined markup figure. A general line with no
quantity typed into it greys out on the grid with the reason stated, is listed under Not included
on the bid and the cost sheet, and comes back the moment a quantity is typed. **Gate:**
`probe-money-trio` 5/5 (3/5 red on the rc.5 bytes before this batch, one green by design, one
neutral) — `LEDGER.md` §Batch Q6, build `2.1.0-rc.6`.

### The version-6 file rule

The first time a takeoff has a deduct on it, saving writes format version 6, and opening that file
in 2.0.0 is refused, by name — 2.0.0 says the file's version is newer than it understands rather
than silently dropping the deduction. A takeoff with no deduct on it still saves exactly the way
2.0.0 always saved it — version 5, byte for byte the same file 2.0.0 would have written — and opens
in 2.0.0 with nothing to reconcile.

### The money trio's defaults, and how to put one back

Order quantities round up by default — CEIL, the safer number when buying material — unchanged
from before this release. Any line on the Estimate grid can be set instead to round to the nearest
whole unit, or to the exact figure with no rounding at all; making the change is logged by name
("rounding → NEAREST on `<line>`"), shown in that line's own derivation, and carried as its own
column in the Estimate CSV and workbook. To put a line back, set it back to round-up on the same
control, or press Ctrl+Z right after changing it — either one clears the override and the line
prices exactly as it did before.

### The one printed cent (R-15b)

Before this release, the recap's Overhead line and the cost sheet's Overhead line could print a
cent apart — on the release fixture, the recap read Overhead as \$41,052.76 while the cost sheet
read \$41,052.77 — because each of the six money surfaces rounded its own share of Overhead
separately, and the recap's own rounding came up a cent short of Cost + Overhead + Markup + Profit
actually adding to Sell. One shared rounding step now feeds all six surfaces — the recap ladder,
the cost sheet, the grid's totals, the XLSX ladder, and the two CSVs — so Overhead prints
\$41,052.77 everywhere. Flagged for Patrick at the batch; his to reverse if he wants the old
per-surface rounding back.

### Also in this release

- **The Q2F phone fix.** On a phone-width screen, Q2's new strip above the cards had pushed the
  first condition card down into the same band a file-notice banner sits in, so a long-press meant
  to show that card's numbers hit the notice instead of the card. Fixed with one rule that keeps
  the condition cards on top of anything the screen draws over them at phone width — the same rule
  that already holds at full width. **Gate:** `probe-z` 6/6 (5/6 on the Q3 bytes, row Z5, before
  the fix) — `LEDGER.md` §Batch Q2F, build `2.1.0-rc.4`.

### Candidates left open

Taste and layout items surfaced along the way; none of them move money or block a takeoff:

- **C-Q2F-1** — at phone width, a notice banner (the kind that tells you this file is open over
  `file://`) still has no place of its own; it now sits behind the condition cards instead of on
  top of them, but giving it a proper spot at that width is still open.
- **C-Q4-1** — the recap panel stays closed until you open it, even on a job that already has
  priced conditions in it; it needs a place of its own on screen before it can open on its own
  without covering the cards.
- **Q5-02** — the sentence 2.0.0 uses to refuse a newer file ("Refusing to guess at it") reads like
  an engineer's note rather than a plain sentence for whoever just opened the wrong file. Left as
  it ships in the 2.0.0 bytes; a candidate for plainer wording going forward.

Full detail and IDs: `LEDGER.md` §Batch Q1, §Batch Q2, §Batch Q2F, §Batch Q3, §Batch Q4, §Batch Q6.

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
