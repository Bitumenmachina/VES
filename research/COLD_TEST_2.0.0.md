# Cold test — 2.0.0

Eight hand steps, one per acceptance row on the 2.0.0 plan. Run them in a browser, against
`src/VES_PM.html` — a headless probe can check the bytes; it cannot tell you whether a number reads
right or a banner reads plain. Each step ends in what you should see; if you see something else,
that is the finding.

1. **Open your most recent real takeoff on this build.**
   You should see the exact same Sell total it had before — or, if any condition's pitch used to
   show one number on screen while pricing off another, a banner naming which conditions changed,
   the pitch each now reads, and the dollar shift, with nothing changed until you answer it.

2. **Type `6` into a pitch field twice** — once on a library-backed condition's card (the pitch chip
   on the card face), once on a different condition's detail-panel pitch row.
   You should see both read back `6/12`, and the same quantity and dollar change reflected on the
   card, the recap, and the bid — not two different pitches from two different doors.

3. **Press Ctrl+Z once for each of those two edits.**
   You should see each condition's pitch, quantity and price return to exactly what they were
   before you typed — one edit undone per press, in reverse order.

4. **Print the takeoff with every measured sheet checked** (Files & exports ▾ → Takeoff…, or the
   command palette).
   You should see one landscape page per measured sheet, each carrying its own legend and only that
   sheet's markup, a whole-job quantities page after them, and no dollar figure anywhere on any of
   it.

5. **Open the sheet chooser again and uncheck one sheet before printing.**
   You should see that sheet missing from the printed pages and the header reading "Sheets shown:
   …" naming only the sheets you left checked — never a silent drop.

6. **Give two or more conditions a Section** (type one, or draw a Section region and measure inside
   it), then open the recap (▴).
   You should see Section → System subtotals: each system's dollars under its section, each
   section's total, and every section's total adding up to the recap's grand Sell — to the cent.

7. **Add or recolor conditions until more than 8 are on the rail, including one custom hex color.**
   You should see every condition keep its own distinct color past the 9th — no repeats among the
   24 built-in hues — and the custom color hold on the card chip, the plan stroke, and the print
   legend, same as any built-in color.

8. **Pick one item that shows up on the takeoff, the Estimate grid, the recap, the bid, and the cost
   sheet — read its description on all five.**
   You should see the identical wording every time. The one allowed difference is a linked line's
   own "— labor" / "— equipment" suffix, and only where that line is in fact linked to another.

If every step reads as written, the release is ready for your word. `RELEASE_NOTES.md` has the gate
(probe name, row count) behind each of these; this list is the one a person runs, not a script.
