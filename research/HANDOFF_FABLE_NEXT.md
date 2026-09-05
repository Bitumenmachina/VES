# HANDOFF — to the next Fable seat · "is this ready to go, and have we drifted from usable?"

Written 2026-09-05 by the seat that built Batches AF–AI, at the end of its limits. Patrick's charge, in his words:

> "Pass a handoff to another Fable that I suspect with a more rigorous search of existing repo and code this could be
> ready to go and we have drifted too far from usable."

Read that as two questions the next seat must answer from bytes, not from this seat's record:
1. **Ready to go?** Is the branch build (F18.72) acceptable to move to `main` as the product Patrick uses for real
   takeoffs — and if not, what is the SHORTEST list that stands between it and that?
2. **Drifted?** Did the three persona-driven fix batches (AG, AH, AI) add surface, words, rules and registers beyond
   what the commission (R1–R7) and usable work need? What should be pruned, and what is fine?

This seat's own answer, offered not asserted: the product bytes are gated green everywhere and the coil case works;
the drift is in the RECORD (four ledgers, 40 probe rows, 90+ finding rows) and in a few wording/marking rules that a
working estimator will not notice either way. But this seat is the one that built it; the next seat searches.

## The state, from bytes (verify before anything else)

- Branch `claude/estimate-sheet-depth-vrhnf6`, 9 commits beyond `main` (`git log --oneline main..HEAD`),
  `17 files changed, 2688 insertions(+), 132 deletions(-)`.
- Product `src/VES_PM.html` = F18.72, 3,657,712 bytes, sha256 `d07cd6ad1fe1a215fdaf38897fc30f3ec6bce90c43f6c4e4b4e20d52b3b15a70`.
- `main` = F18.68 (`b191423`), untouched. No PR. No freeze manifest (only Patrick writes it).
- Gates on the F18.72 bytes, run by this seat and by CI (run 54 on `d95c830`): verifier PASS (0 new egress), G0 GREEN
  4/4, probe-af 40/40, probe-v/x/y/z/aa/ac/ab/ad/u/ae all green, selftest 12/12.
- Patrick has NOT run the cold test (`research/HANDOFF_ESTIMATE_SHEET_AF.md` §3). His word is the only acceptance.

## The rigorous search — what to read, in this order, and what each answers

1. `research/WHATS_NEW_F18.72.md` — the plain-language map (10 minutes). Then `CLAUDE.md` for the rules that bind you.
2. **The commission** (`research/HANDOFF_ESTIMATE_SHEET_b191423.md` §5 the coil case, rulings R1–R7, §6 must-not-move).
   This is the yardstick for "usable": LF measured → LB bought, `RAW * width * lbsf`, width typed on the line, priced,
   shown, exported, saved, reloaded. Everything else is secondary.
3. **The product itself, driven, not read**: run `tools/sweep/probe-af.mjs` (README in `tools/sweep/`) and READ its
   output line by line — AF2/AF3/AF6 are the coil case. Then open the file in Chromium yourself and do §3 by hand.
   If that passes, question 1 is most of the way to "yes".
4. **The diff**: `git diff main..HEAD -- src/VES_PM.html`. 2,688 lines. Sort each hunk into one of three bins:
   (a) the commission (engine `driver`, params, the Formula column, the load door, exports, the Library lens, the
   waste door, the labor coupling); (b) a money-honesty fix (a silent $0, a silent mis-parse, a `undefined` on a
   sheet) — these stay; (c) wording, marks, tints, tooltips, aria, phone pins, key grammar — these are the drift
   candidates. Count the lines per bin. This seat's estimate: (a) ~1,900, (b) ~250, (c) ~500. Measure, do not trust.
5. **The registers**: `LEDGER.md` §Batch AF/AG/AH/AI (93 rows), `CHANGE_LEDGER.md` (58 rows), NOTES §State. Ask of each
   AG/AH/AI row: would Patrick have asked for this? A row that answers a persona's taste and nothing an estimator would
   hit in a week of takeoffs is drift. Rows marked (a) are not drift by definition — check that the (a) label is earned.
6. **What the personas never tested**: a REAL takeoff shape. Every probe and every persona used the synthetic demo and
   one coil item. Patrick has five takeoffs to do this week; the honest test of "usable" is one of those on F18.72
   beside F18.68, same PDF, same conditions, compare the sell to the cent (the AF batch promised nothing pinned moves;
   G0 says so for the goldens; a live job says so for real).

## How to decide

- **Ready** = §3 cold run passes by Patrick's hand + one real takeoff prices identically on F18.68 and F18.72 (or
  differs only where a line formula was typed) + no open (a) row. Then finalize per `HANDOFF_ESTIMATE_SHEET_AF.md` §0
  step 4 (registers name `main`, `git merge --ff-only`, push, read CI on `main`). Pruning the record can follow.
- **Not ready** = name the blocking items in ONE list, each with a probe row that proves it red first, and nothing
  else. Do not run another persona pass; three fix iterations were the cap and are spent.
- **Drift to prune** (if Patrick wants it): candidates in bin (c) above. Pruning product bytes means a new build stamp,
  RED-first probe rows flipped to controls, and the registers saying what was removed and why — the same discipline
  as adding. Pruning RECORD (collapsing the four ledgers into one table per build) is cheaper and loses nothing if the
  git history keeps the originals. Ask Patrick which he means before touching either.

## What not to do

- No PR, no push to `main` without Patrick's word, no `--write-manifest` / `--write-baseline` (the guard hook refuses
  seats; do not route around it), no client data in the repo (synthetic fixtures only), no persona pass 4 (its reports
  are not on record and the cap is spent).
- Do not trust this seat's counts, severities or "by inspection" cells. Re-run the gates; read the diff; drive the file.

## Commands

    sha256sum src/VES_PM.html                                   # d07cd6ad…15a70
    node tools/ves-verify.mjs                                   # RESULT PASS
    VES_CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome node gate/g0.mjs check src/VES_PM.html
    git show b191423:src/VES_PM.html > /tmp/VES_F18.68.html
    node tools/sweep/probe-af.mjs "$PWD/src/VES_PM.html" "$PWD/release/demo/demo-flat-roof.json" "$PWD" /tmp/VES_F18.68.html
    git diff --stat main..HEAD; git diff main..HEAD -- src/VES_PM.html | less

Report to Patrick in his terms: ready or not, the shortest list, what drifted, hashes and outputs verbatim.
