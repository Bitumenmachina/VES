# B6 — P-FRESH persona findings

Clone: `.scratch/b6-fresh`, branch `ves2`, HEAD `9f1a5a9`, `src/VES_PM.html` md5
`0df93f7b508caa3c44c5045bbe342a30`, build `2.0.0-rc.7`. Driven headless via `tools/sweep/`-style raw
CDP (real pointer for every click, real `DOM.setFileInputFiles` for both file opens, real
`Page.printToPDF` to read what actually goes to paper) — no internal shortcuts except a
`window.print` stub to capture the composed document, the same technique
`tools/sweep/probe-b4-print.mjs` uses because headless Chrome cannot show an OS print dialog.
Fresh `--user-data-dir` per run, empty localStorage, no persona notes, no docs read until after
all four tasks. Asset used: `fixtures/synthetic/three-sheet/plan.pdf` +
`fixtures/synthetic/three-sheet/takeoff.v3.json` — the demo (`release/demo/demo-flat-roof.json`) has
no PDF and only 2 measurements on one pane, so it cannot exercise "print a takeoff that spans
several PDF sheets" or section subtotals at all; the three-sheet fixture is the only shipped asset
that can. Screenshots: `.scratch/b6-fresh-shots/`.

## Findings

| id | severity | what I did | what I saw | what I expected |
|---|---|---|---|---|
| F1 | P0 | Opened `plan.pdf` (Open a PDF), then Files & exports ▾ → Open takeoff… → `takeoff.v3.json`. Touched nothing else yet. | Two banners appeared over the canvas, unprompted, before I clicked anything else (screenshot `05-takeoff-loaded.png`). First, verbatim: "Pitch reconciled to the displayed quantity on 3 conditions — SSMR — hip: displayed 4/12, was priced flat; now priced at 4/12, +$215.08. Slate — field area: displayed 9/12, was priced flat; now priced at 9/12, +$13,657.08. Slate — valley: displayed 6/12, was priced flat; now priced at 6/12, +$1,419.33. Sell $496,800.67 → $512,092.16. These lines showed a pitched quantity and were priced flat; the quantity on the page is the quantity the money is computed on." The bid Sell total had already moved by +$15,291.49 by the time I read it; the only control offered was a dismiss (×), not an accept/keep-as-saved choice. | Opening a file to review it would show me the numbers as saved, or ask before changing the total — not tell me, after the fact, that ~$15.3K already moved. |
| F2 | P0 | Same load as F1, read the second banner sitting directly under the first. | Verbatim, still open and unconfirmed for the rest of my session (present in `05-takeoff-loaded.png`, `T1-sheet-chooser.png`, `T4-recap-summary.png`): "Cricket framing — pitch was stored as ×6.000 — reads as 6/12; confirm. Until you do it is priced at ×6.000, exactly as the file was saved." with a button "Read it as 6/12". I never clicked it, so for my entire session that one condition stayed priced at a bare 6.000× factor. | A 6/12 pitch to price at roughly a 1.118× slope factor everywhere else in this build (that is what F1's own banner just did to three other conditions) — not to see one condition sitting at 6.000× (~5× too much) pending a single small click I could easily miss among the other banner. |
| F3 | MED | Read both banners above as a first-time user would, with no other context. | Dense, technical phrasing — "Pitch reconciled to the displayed quantity", "was priced flat", "stored as ×6.000 — reads as 6/12" — stacked two banners deep over the drawing area, no link to an explanation. | I could tell money had moved and one condition needed a decision, but had to re-read both banners twice to be sure which of the four affected conditions was which. |
| F4 | HIGH | Task 2, new-condition half: clicked "+" in the rail, typed "Fresh Ridge Cap", picked Linear, clicked "Add condition". Then tried to click its quantity to open the pitch editor, using the position the browser itself reported for that element. | The new card rendered at the bottom of the (now 27-row) rail, off-screen — its quantity control's own reported position was `top: 2278.5` against a 900px-tall window. A click at that real, reported position hit nothing (no element there); nothing scrolled it into view and nothing on screen flagged that it had been added below the fold. Only after I manually scrolled the rail did the same click open the editor. | Either the rail to scroll the new condition into view (the way arming it for measuring — which happened automatically — implies it's now the thing I'm working with), or some on-screen cue that "Fresh Ridge Cap" had, in fact, been added. |
| F5 | MED | Task 3: added eight more conditions one at a time, each via "+", to use palette colors past the first 8 (swatches #8, #10, #12, #14, #16, #18, #20, #22 of 24), then a ninth with a custom hex. | After every single "Add condition", the form collapsed itself again (`addCondWrap.hidden` went back to `true`); the next color required clicking "+" again from scratch. No "add another" or "keep open" affordance. | To build a small set of differently-colored conditions in one sitting without re-opening the same form every time. |
| F6 | MED | Task 4: clicked the ▴ toggle on the bottom strip to open the recap panel, since it was collapsed by default after the takeoff loaded with 26 conditions and 29 measurements already on it. | The strip's own label reads "RECAP · COST BY CSI" (screenshot `T4-drawer-open.png`). Once open, the Summary tab's FIRST table is not CSI at all — it's grouped Section → System, with its own subtotal per section: "Section: Annex … $76,106.21", "Section: Canopy … $117,507.73", "Section: Main Roof … $296,239.47" (screenshot `T4-recap-summary.png`); the CSI-division table (Div 02/05/06/07…) is second, further down. | The label to mention the section breakdown that's actually shown first — or, scanning only the label, I'd have guessed this panel could not answer "subtotals by roof section" at all. |
| F7 | LOW | Task 4, continued. | The panel a fresh user needs for section subtotals is closed by default even when a takeoff already has 26 priced conditions across 4 sections loaded into it — it takes one extra click (▴) to see it. | Nothing strongly — a chevron toggle is a familiar affordance and I found it quickly — but for a takeoff already this full, I expected it open by default. |

## Where I got stuck, per task

- **Task 1 — print a takeoff spanning several sheets:** No real stuck point. Files & exports ▾ →
  "Takeoff…" opened a sheet chooser on the first click (3 sheets listed, each with its own
  measurement count, screenshot `T1-sheet-chooser.png`); printing produced 4 landscape pages (one
  per sheet + one quantities page, confirmed via `Page.printToPDF`, matching the 3+1 the on-screen
  document itself showed). Unchecking a sheet and printing again correctly dropped it and changed
  the header to "Sheets shown: 1, 2 of 3 · plan.pdf". This is the one task that worked exactly as
  asked, start to finish.
- **Task 2 — pitch on a library-backed vs. a new condition:** Library-backed ("SSMR — field
  area"): the pitch chip is right on the card face — one click, type, Enter, done, no stuck point.
  New condition: stuck exactly where F4 says — the freshly added card was off-screen with nothing
  telling me so, and my first click (at the position the page itself reported) hit nothing.
- **Task 3 — more than 8 colors + one custom color:** No stuck point finding the colors — all 24
  swatches show at once, in 3 rows of 8, in both the "+" form and a condition's own editor
  (screenshot `T2n-new-condition-editor-scrolled.png`), and the custom hex box sits right beside
  them. Stuck point was purely repetition: F5's form-closes-every-time behavior.
- **Task 4 — subtotals by roof section:** Stuck for one extra click on the collapsed panel (F7),
  and the panel's own label undersold what was inside it (F6); once open, the section subtotals
  themselves were immediately there and correctly totaled.

## Summary (10 lines)

- 7 findings: 2 P0, 1 HIGH, 3 MED, 1 LOW.
- Top three by money: (1) F1 — the bid Sell total moved +$15,291.49 (496,800.67 → 512,092.16) on
  a plain file-open, before I did anything else, with only a dismiss control offered. (2) F2 — one
  condition ("Cricket framing") sits priced at a raw ×6.000 pitch factor instead of the ~×1.118 a
  6/12 pitch gets everywhere else in this same build, pending one small "Read it as 6/12" click I
  never made; no isolated dollar figure for that line surfaced on screen to size it by. (3) No
  third money-affecting item turned up in this pass — the remaining findings are workflow friction
  (F4–F7), not price changes.
- Task 1 (multi-sheet print) is the one Patrick explicitly flagged before this batch
  ("no ability to print a takeoff that uses multiple pdf pages") and it worked cleanly end to end
  in this build — all 3 sheets, correct sheet-leave-out behavior, no friction.
- Task 2 and Task 3 both work, but each has one piece of friction: a new condition can render
  off-screen with no cue (F4), and the color form won't stay open across repeated adds (F5).
- Task 4 answers the ask correctly (Section → System subtotals, per-section dollars) but is one
  click deeper than its own label implies (F6, F7).
- Nothing I clicked was silently a dead end except the off-screen new-condition click in F4 — that
  one genuinely did nothing until I scrolled manually.
- README/landing-copy check: the in-app empty-state copy is close to word-for-word the README's
  "Nothing is transmitted… No seat fee, no report fee, no device limit, no login… Every quantity is
  auditable… Every priced line shows how its quantity was derived" paragraph — I did not exercise
  the Audit CSV or Library lens this pass, so I can't confirm or contradict those two specific
  sub-claims from direct use; nothing I saw on screen contradicted the rest.
