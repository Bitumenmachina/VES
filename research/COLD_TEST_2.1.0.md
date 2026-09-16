# Cold test — 2.1.0

Ten hand steps, run in a browser against `src/VES_PM.html` — a headless probe can check the bytes;
it cannot tell you whether a number reads right or a chip reads plain. Each step ends in what you
should see; if you see something else, that is the finding. `RELEASE_NOTES.md` has the gate
(probe name, row count) behind each of these; this list is the one a person runs, not a script.

1. **Press `D` and trace a cutout inside a shingle field** — a chimney shape drawn fully inside one
   of the field's own measured edges.
   You should see the field's own SF total drop by the chimney's area, the cutout itself draw in
   the field's own color with a dashed edge and a cross-hatch fill, and its label read as a
   negative number.

2. **Take the perimeter offer that opens when the cutout closes, and hand it to a flashing
   condition already on the job. Then press Ctrl+Z once.**
   You should see the flashing condition's own linear footage grow by the chimney's perimeter, and
   the single Ctrl+Z remove both the cutout and the new flashing footage together — never one at a
   time.

3. **Trace a cutout bigger than the field itself** (or several overlapping ones that add up past
   it).
   You should see the condition's quantity hold at zero, with a note saying the deductions exceed
   the area — never a negative price on the card, the grid, or anywhere else that quantity is
   priced.

4. **Alt+click a condition's eye.**
   You should see only that one condition on the sheet, an "N hidden" chip appear above the cards
   naming how many are hidden, and — after pressing Shift+H to bring everything back — every
   quantity and dollar figure unchanged from before you hid anything.

5. **Print the takeoff once with several conditions hidden on screen, and once with nothing
   hidden.**
   You should see the identical printed pages both times — hiding a condition from the screen
   never removes it from, or marks it on, the printed paper.

6. **Click directly on a drip-edge line where it runs inside a field area, read the chip beside
   the pointer, then click the same spot again.**
   You should see the chip name the line the first time and the field underneath it the second
   time — each click stepping to the next thing under the pointer.

7. **Drag the body of the line you just selected, then click an unselected part of the plan and
   drag there instead.**
   You should see the selected line move to where you drag it, and the second drag pan the plan
   without moving any shape.

8. **Marquee-select four shapes at once, press Delete, then Ctrl+Z.**
   You should see all four disappear together, and all four come back together on the single
   undo — never a partial return.

9. **Set one line's rounding to the nearest whole unit on the Estimate grid, then read Overhead on
   the recap and on the cost sheet.**
   You should see Overhead print the identical dollar figure, to the cent, on both — whatever the
   line's rounding is set to.

10. **Add a general line to the job and leave its quantity blank.**
    You should see it greyed on the grid with the reason "qty 0 — not included," and listed under
    Not included on both the client bid and the cost sheet — never counted as an included,
    zero-dollar line.

If every step reads as written, the release is ready for your word.
