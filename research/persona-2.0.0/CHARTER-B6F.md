# CHARTER B6F — THE ONE FIX BATCH after the persona pass (VES 2 · plan §B6). Triage by the orchestrator: money → fix ·
# bar-backed (a plan ruling or Patrick's four asks) → fix · taste → CANDIDATE. Rows come from P-ESTIMATOR (E-*), P-FRESH (F-*),
# P-CODE (C-*, appended below when its file lands).

BASE: clone `.scratch/b6f` at branch `ves2` HEAD (md5 in the spawn message; build 2.0.0-rc.7). ONE file `src/VES_PM.html` — never
Read whole; `grep -n` then `sed -n` windows ≤120 lines. No network/npm/egress/second file; nothing client-identifiable; leave
`LEDGER.md`/`NOTES.md`; bump the `- build:` line in CLAUDE.md with `VES_BUILD` (→ `2.0.0-rc.8`). Chrome `/usr/bin/google-chrome`;
`rm -rf /tmp/ves-*` after every run; `timeout 240` per probe; absolute paths; foreground gates. Findings files with the exact
observations + screenshots: `.scratch/b6-estimator-findings.md`, `.scratch/b6-fresh-findings.md`, `.scratch/b6-code-findings.md`.

RULINGS (build to these):
B6F-1 (E-F1 HIGH + E-F2 P0 — scale per sheet). The "2-pt" toolbar calibrate tool arms on EVERY sheet exactly as on sheet 1; the
      "no scale yet" banner's "Click a known length" IS that tool (one gesture, two doors). A measurement on a sheet with no scale is
      a PENDING measurement: it contributes NOTHING to money and its condition is flagged on EVERY money surface — rail chip, recap
      row, bid row (line marked "pending scale — not priced", never a silent 0), cost sheet, XLSX/CSV (a `pending` column or note) —
      and the takeoff quantities page marks the TOTAL itself ("105'-8½" + 3 pending segments — set the scale on sheets 2, 3"), not
      a small parenthetical. Setting the scale later re-prices those segments and journals it.
B6F-2 (F-F1/F-F2 P0-by-persona; R-3/R-3a stand — money is announced, not silent, but the estimator had no choice). Both migration
      banners carry TWO doors: reconciliation banner → "Keep (priced at the displayed pitch)" [default, already applied] and
      "Set these flat instead" (display AND money flat on the named conditions, journaled, undoable); legacy-factor banner →
      "Read it as 6/12" and "Keep ×6.000 as saved" (dismisses, stays as saved, journaled as a decision). Ctrl+Z immediately after
      load reverses the reconciliation with a name. Banner wording in plain words (F-F3): "3 conditions showed a pitch on screen but
      were priced flat in the old file. They are now priced at the pitch you see: … Sell $496,800.67 → $512,092.16." and "Cricket
      framing: the old file stored pitch as a bare ×6.000 multiplier. Read it as 6/12? Until you choose, it prices at ×6.000."
B6F-3 (E-F5 MED → bar-backed, complaint #3). "+ Add condition" defaults the color to the NEXT UNUSED palette entry (the same
      cycle the library path uses), never PALETTE[0] again; the swatch row shows the pick. 22 quick-adds → 22 distinct colors.
B6F-4 (F-F4 HIGH). A newly added condition's card scrolls into view and is armed/selected; the pitch and section doors on it are
      reachable without a manual scroll (real-pointer row).
B6F-5 (F-F5 MED). The add form stays open after "Add condition" with a cleared name field focused ("add another"); Esc or the
      × closes it. (E-F5's 22-in-a-row flow is the test.)
B6F-6 (E-F3 HIGH + E-F7 MED — reattach). The resume card ("Pick up where you left off … needs plan.pdf") OPENS the file picker
      itself; when the matching PDF is already open in the session, "Open takeoff…" attaches immediately without asking. Identity
      match = the B4 identity (size + page count + name); a mismatch still asks.
B6F-7 (E-F6 MED). The bid's refusal names the conditions that need a price (toast + the printed refusal page list them by
      `descOf`), and the rail's "need price" pill scrolls to the first one on click.
B6F-8 (F-F6 MED). Recap strip label reads "Recap · by section, then system, then CSI" (vocab-check stays 0).
B6F-9 (E-F4 MED, CANDIDATE unless cheap): after reload the Undo control says "nothing from this session yet" instead of a toast
      per press. (F-F7 LOW recap collapsed by default → CANDIDATE, not built.) (C-B5-1 three identical unit columns → collapse to one
      `Unit` column on the grid when EU = Ord Un = Prc Un, which is always today — small, do it.)
B6F-C (P-CODE rows, all proven with rendered numbers — `.scratch/b6-code-findings.md`, raw `.scratch/b6-code-raw.json`):
B6F-C1 (B6C-1 P0 + B6C-4 HIGH — general lines). `addGeneralItem` and `removeGeneralItem` are JOURNALED with names ("add general
      line Dumpsters $5,000" / "remove …"); Ctrl+Z restores the removed line in place. No phantom entries: an undo whose target no
      longer exists is dropped with a toast that says so, never "Undid: … " over nothing. (B6C-10 MED) the undo toast formats
      every value — "[object Object]" never prints (a formatter for waste/pitch/money/text; test each kind).
B6F-C2 (B6C-2 P0 — unscaled = pending everywhere; supersedes the money half of B6F-1 above). A measurement on a sheet with no
      scale is PENDING: it contributes nothing to money, and the word reaches EVERY money surface — recap row, grid row, bid row,
      cost sheet, XLSX/CSV — as a named state ("pending scale on sheet 2"), never a silent 0; the bid's per-line "Sheet 1, 2"
      note lists only sheets whose quantity is IN the number; the `uncal` notice is job-scoped (visible from any sheet while any
      measured sheet has no scale), not page-scoped. Setting the scale re-prices and journals.
B6F-C3 (B6C-3 P0 — pitch door bounds). The pitch doors accept ONLY rise-per-12 forms: a bare number 0–24 (rise), `n/12`, `n:12`,
      `n"/12`; NOTHING else — the raw-multiplier fallback is removed (a factor is never typed; the rise is). Out of range or
      unparsable → refused with the existing toast, value unchanged, nothing journaled. `999`, `1e9`, `-6`, `abc`, `6/13` all refuse.
B6F-C4 (B6C-5/6 HIGH — undo of the reconcile). Ctrl+Z after the R-3a reconcile does NOT delete `c.pitch`: it sets the three
      conditions FLAT explicitly (display and money), named "set flat: SSMR — hip, Slate — field area, Slate — valley (undo of
      pitch reconcile)", the banner updates to say so (or dismisses) and never again reads a stale "now priced at …"; save → reload
      after that undo shows flat conditions and no reconcile banner (nothing left to reconcile). Same for the "Set these flat
      instead" door in B6F-2 — one code path.
B6F-C5 (B6C-7 HIGH + B6C-8 MED — one section key). ONE `sectionKeyOf(name)` (trim, case-fold) used by every surface that groups,
      filters or prints by section — recap, grid, bid, cost sheet, proposal, takeoff quantities page, CSV/XLSX, region tagging,
      rename. Renaming into a name that keys equal to an existing section MERGES them (journaled, named). The takeoff page never
      drops a condition: every measured condition lands under exactly one band. Proposal, recap and bid show the SAME section count.
B6F-C6 (B6C-9 HIGH — latch). `releasePrintDoc()` runs unconditionally right after `window.print()` returns (synchronous in real
      browsers; immediate in headless), with `afterprint` kept only as a second net; after ANY print path completes, `#printDoc` is
      empty. Probe row reads `#printDoc.innerHTML.length === 0` after each of the four print doors in headless Chrome.
B6F-C7 (B6C-11 MED). Regions loaded without ids get unique ids at load (never all 0); every region is addressable by its chip.
Probe rows for each (B6F-C1…C7) go in `probe-b6f.mjs`; the P-CODE probe `.scratch/b6-code/tools/sweep/probe-b6-code.mjs` shows
the exact reproductions — reuse its snippets as the RED rows.

RED-FIRST PROBE `tools/sweep/probe-b6f.mjs` (<html> <fixture json> <fixture pdf> <repo root>): one row per ruling above (B6F-1 needs
a fresh takeoff from the blank project across 3 sheets with real-pointer calibration on each; B6F-2 loads the v3 fixture and drives
both banners' doors and Ctrl+Z; B6F-3/4/5 add 22 conditions with the pointer; B6F-6 save → reload → resume card; B6F-7 unpriced
bid; B6F-8 label text). Run on the unpatched base first; record the reds. Then every landed gate stays green: G0 · ves-verify ·
vocab-check 0 · probe-b0-fixture · b1 · b2a · b2b · b3 · b4 · b5 · ae · p903-* · v · u · af · ad.

RETURN: `.scratch/b6f.patch`, post-patch md5, raw probe output on base (red) and patch (green), raw G0, ≤300 words of what you SAW.
STOP if: G0 moves a cent · a ruling cannot be met without a second file or the pdf.js blob · ~150K tokens without B6F-1 and B6F-2 green (return the partial).
