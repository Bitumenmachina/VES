# What's new in F18.72 — plain language, for Patrick and the next seat

Written 2026-09-05. This is the test build on branch `claude/estimate-sheet-depth-vrhnf6`. `main` is still F18.68.
Everything here is built and gated (verifier PASS, G0 GREEN, probe-af 40/40, CI green on every push); nothing is
"accepted" until you say so after using it.

## Get the file

- GitHub: branch `claude/estimate-sheet-depth-vrhnf6` → `src/VES_PM.html` → "Download raw file". One file, no install.
- Check it is the right one: 3,657,712 bytes; the landing page footer says **F18.72**; sha256
  `d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70`.
- It opens the same way as before. Your library edits and prefs live in the browser (localStorage), as before.

## Using it for real takeoffs this week — what to know

- Takeoff files are still version 3. A takeoff saved by F18.72 opens in F18.68 and prices the same, **except** a line
  that carries its own formula or inputs: F18.68 drops those with a red banner ("unsupported override field") and prices
  that line from the library. So if you write a line formula, stay on F18.72 for that job.
- Library edits are in the browser, not in the takeoff file. If you edit the price book, export it once
  (Library lens → ⤓ Library .xlsx) so you have a copy.
- The freeze manifest is not written. Only you run `node tools/ves-verify.mjs --write-manifest`, on a build you accept.

## What changed since F18.68 (main), build by build

**F18.69 — Batch AF — "the sheet renders what it computes, and a formula can live on the line"**
- Every priced line on the Estimate grid has a new **Formula** column: a chip saying where the quantity came from
  (library / project / line formula / typed qty / manual line), the derivation in words
  (`ADJ 412.5 LF · width 1.25 · lbsf 1.156 = 596.06 → 597 LB`), and two cells you can type in: a **formula** and its
  **inputs** (`width=1.25 lbsf=1.156`). Formula words: RAW, ADJ, WASTE, Q, your inputs, and ceil floor round abs max min.
- The coil case works end to end: LF measured, LB bought, `RAW * width * lbsf` typed on the line, saved, reloaded, exported.
- The load door accepts a line formula again (the old rule that deleted it is reversed). Old builds drop it loudly.
- Add-a-line row says which funnel it is in (library name → the library prices it; anything else → a free line), and
  asks measure (count / area / linear) after the unit.
- Condition waste has a door: on a condition's detail panel beside pitch, "Waste % (this condition)". Journaled (undo).
- Exports carry the derivation: grid CSV, BOM CSV and the Estimate .xlsx get driver · formula · params · qty needed ·
  basis columns; the .xlsx ladder multiplies by a Pct cell so it re-margins in Excel. Client paper prints none of it.
- The **Library lens** (segment or hotkey **L**): the whole price book, every field editable in place, validated before
  it is kept; a ＋ Add row per assembly; desc and inputs survive the workbook round trip.
- "Unit $ / order unit" headers say what the price is per.

**F18.70 — Batch AG — persona pass 1 answered** (33 findings, 14 red-first probes)
- A formula that evaluates to 0 is flagged and left out (never a silent $0). A typo in a formula behind a typed qty is
  said at once. Parser names the token ("unexpected "width" after "RAW" — missing an operator?").
- Library ＋ Add ids come from the library (a reload no longer overwrites yesterday's item); blank CSI lands under the
  assembly's code; edited cells read in the accent against the seed; match-code column; the toast says the takeoff follows
  the book.
- Derivation words carry item waste; Q's meaning by kind on the cell title; scope legend on the sheet foot.
- Entry row: funnel line under the description; case- and dash-forgiving library names; closest-name hint.
- Phone: the fourth lens segment no longer covers Files & exports. Waste box refuses "abc" and negatives in its own words.
- Workbook: qty needed numeric, ladder labels "(× Pct)". CI fetches the old bytes by full sha.

**F18.71 — Batch AH — persona pass 2 answered** (26 rows, 6 red-first probes)
- `1.2.3` in a formula is refused (it used to price as 1.2 silently); `round(x, 1)` is refused (the 1 was dropped).
- Library lens refuses an empty unit and a zero production rate; the unit gate never prints "undefined".
- Clearing the Qty cell re-checks the formula so the cue follows the row; a new takeoff clears the cue.
- Lens dropdowns show the edited-vs-seed mark; waste words at two decimals; the waste box says what it did on blur.
- Phone: the document door sat past the left edge with a sheet live — fixed; Plan segment has a name; a gated row is
  tinted; ＋ Add is touch-sized; Escape in a lens cell reverts and says so, Enter commits.

**F18.72 — Batch AI — persona pass 3 answered** (25 rows, 5 red-first probes)
- A library **density of 0** is refused, and a density resolving to 0 on a line is flagged and left out (it used to
  price an included $0 with no word).
- The book refuses a formula that cannot parse (`RAW *`); a name it does not know is still allowed (a per-line input).
- A book edited and changed back reads as the seed again; the lens header says "built-in seed library" when it is.
- Flags list names an unpriced line (was "undefined"); that row is tinted too.
- Waste words at four decimals (0.001 % no longer reads "0%"); basis column in exports has clean numbers and the waste
  as a percent; a linked ＋ labor line carries its basis.
- Parser: `RAW ** 2` is named as an unexpected `*`; `RAW*WIDTH` and `ROUND(RAW)` say names are case-sensitive and
  name the match. Escape in an untouched lens cell says nothing.
- Phone: the brand's suffix no longer runs under the document door. Landing and README say a library-priced line
  carries a formula (a free line is priced as typed).

## Where the record is

- `LEDGER.md` §Batch AF / AG / AH / AI — every persona finding and what was done with it (fixed / refuted with
  evidence / candidate / recorded).
- `CHANGE_LEDGER.md` — every product change, its anchor (function name), and the probe check that proves it.
- `tools/sweep/probe-af.mjs` — 40 checks, each batch proved red on the prior build first.
- `research/HANDOFF_ESTIMATE_SHEET_AF.md` — §0 pickup for the next seat, §3 your cold-run test of the coil case.

## What the next seat (Opus) can work on — candidates, none blocking your use

Recorded in LEDGER as C-AG1 … C-AG13; the next seat asks you which, if any, before building:
1. **Cost per estimated unit** on the row, with a price unit (R5 follow-on) — the biggest open item on the sheet.
2. **Live quantity math in the Estimate .xlsx** (today quantities are literals; Extended and the ladder are live).
3. **Recap drawer and the internal cost sheet** carry no derivation (the grid and every export do).
4. **Library lens performance**: full re-render per edit (~50–90 ms on 172 rows), first frame ~260 ms.
5. **Grid at 125–150 % zoom** scrolls the Formula/Total columns off; the lens table is 2,200 px wide.
6. **Item creation from the grid** beyond a manual line; an auto-round control (CEIL is always on).
7. **Vocabulary**: one name per field across lens headers, refusals and toasts (`Prod. rate` / `production_rate`).
8. **Rails**: the guard hook is a text match (evadable, and it has a false positive on quoted text); the 720/719 px
   breakpoint pair; the CLAUDE.md a worktree persona is handed is the session's stale copy (read by absolute path).
9. **Registers**: P-SEAT's last wording items (a few CHANGE_LEDGER evidence cells claim slightly more than their checks
   drive; two NOTES counts not derivable from the tables).

Then, on your word after your test: fast-forward `main` to this branch (the commands are in the handoff §0) and write
the freeze manifest on the accepted build.
