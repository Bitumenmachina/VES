# SWEEP_68c8e23 — live-repo sweep against `origin/main` @ 68c8e23

Seat: Claude Code cloud session (model id `claude-fable-5-1` as configured; serving model may differ),
branch `claude/ves-live-repo-sweep-x202rq`, 2026-09-01 19:45–20:10 UTC.
Form: open-ended read from the seats named in the directive. Everything below is evidence and proposal.
Acceptance is Patrick's word alone. This seat declares nothing closed and nothing landed.
No baseline, manifest, or product byte was written. The only new file is this one.

Tag key: **OBS** = observed from bytes/output in this session (path or URL and stamp) · **INF** = inferred ·
**STD** = a standard or documented behavior · **null** = not checked. Untagged = does not count.

---

## 1 · State block

| item | value | tag |
|---|---|---|
| repo root | `/home/user/VES` (`git rev-parse --show-toplevel`) | OBS 19:45Z |
| remote | `https://github.com/Bitumenmachina/VES` (fetch + push) | OBS |
| HEAD | `68c8e23bd4c7a613daeb9cca36e8569c05eb7c5b` = `origin/main` ("Checkpoint: Batch U stopped mid-development…") | OBS |
| commits in history | 7 (root `8313a26` → `68c8e23`), single author identity `Patrick Moriarty <patrick@bitumenmachina.com>` | OBS |
| tags | local clone: none. Remote: `refs/tags/f18.55` → `509f311` (`git ls-remote --tags origin`) | OBS |
| canonical file | `src/VES_PM.html` · **3,515,506 bytes** · sha256 `f785eea7964f1b3e18547385d49fac5be4c4792f51ede08efb4c55636ea59e8e` · `VES_BUILD = 'F18.58'` (line 11898) | OBS |
| `.git` size | 6.9 MB (`du -sh`), 68 loose objects / 6.41 MiB, 0 packs | OBS |
| worktree | 26 tracked files (list in §2.1); tree clean at start | OBS |
| Node here | v22.22.2 | OBS |
| browser here | `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` = Chromium 141.0.7390.37 | OBS |

### Verifier — raw output (`node tools/ves-verify.mjs`, exit 0)
```
IDENTITY 3515506 bytes sha256 f785eea7964f1b3e18547385d49fac5be4c4792f51ede08efb4c55636ea59e8e
SYNTAX   3 blocks checked, 2 skipped, 0 failed
EGRESS   7 matches; baseline 7 entries; 0 new, 0 gone
FREEZE   0 regions; manifest absent; 0 mismatched, 0 missing
RESULT   PASS
EXIT=0
```

### Selftest — raw output (`bash test/selftest.sh`, exit 0)
```
PASS  first run, no baseline -> finding (exit 1)
PASS  write baseline+manifest (exit 0)
PASS  clean file -> PASS (exit 0)
PASS  frozen region edited -> FREEZE fail (exit 1)
PASS  new fetch( outside region -> EGRESS fail (exit 1)
PASS  syntax broken -> SYNTAX fail (exit 1)
PASS  no target file -> usage exit 3 (exit 3)
PASS  stop hook, failing file -> block (exit 2) (exit 2)
PASS  stop hook, already blocked once -> allow (exit 0) (exit 0)
PASS  stop hook, passing file -> allow (exit 0) (exit 0)
selftest: 10 passed, 0 failed
```

### Engine gate — raw output, run IN THIS CLOUD VM
(`VES_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node gate/g0.mjs check src/VES_PM.html`, exit 0)
```
  ✓ A == goldenA (assembly money path)
  ✓ B == goldenB (sell-ladder + R3)
  ✓ C == goldenA (save/reload inert)
  ✓ D == goldenA (schedule inert)
G0 GREEN
```
This falsifies the standing NOTES.md claim "no browser binary in cloud VMs" for this environment (see F-06).

### CI at HEAD
`verify` run 33495551456 on `68c8e23`: completed, **success** (GitHub Actions API, OBS 19:58Z). Every push in history
has a green `verify` run. A second workflow, **"pages build and deployment"**, has also run on every push since the root
commit (see F-01).

---

## 2 · First acts

### 2.1 Containment
Root, remote, HEAD as above. Tracked files (`git ls-files`, OBS): `.claude/settings.json`, `.github/workflows/verify.yml`,
`.gitignore`, `CLAUDE.md`, `LICENSE`, `NOTES.md`, `README.md`, `gate/{README.md,g0.mjs,gate.mjs,scenarioA–D.js,goldens/{fingerprints,goldenA,goldenB}.json}`,
`release/demo/demo-flat-roof.json`, `research/PLATFORM_BAR.md`, `src/VES_PM.html`, `test/{fixture.html,selftest.sh}`,
`tools/{egress-baseline.json,ves-stop-hook.mjs,ves-verify.config.json,ves-verify.mjs}`.
`CLAUDE.md`, `.claude/settings.json` (Stop hook → `tools/ves-stop-hook.mjs`) and the verifier are present. `.git/config`
carries no credential; the only auth material is in the seat's own `/root/.gitconfig` (outside the worktree). OBS.

### 2.2 Egress matches — each one read
The 7 baseline entries (`tools/egress-baseline.json`, written from an earlier 3,455,798-byte build `2ffd7d2e…`; the set is
unchanged at F18.58): four are inside the pdf.js UMD bundles (`fetch(`, `XMLHttpRequest`, `importScripts(` in the worker/lib
minified lines 2121/2145); one is the method name `fetch({ filename })` of the app's own `EmbeddedStandardFontDataFactory`
(line 3935 — it reads embedded base64, no network); two are the word `import(` inside a comment and a toast string. None is a
live network call. pdf.js is loaded with `data:` bytes, the worker from a Blob URL (line 3928), and standard fonts from the
embedded JSON, so its internal fetch/XHR paths are not exercised for the app's inputs. OBS from bytes; runtime egress under a
real plan PDF with CMaps: **null** (not exercised — see §7).

### 2.3 Canon read
Read: `CLAUDE.md`, `NOTES.md`, `README.md`, `gate/README.md`, `research/PLATFORM_BAR.md`, the two retired wave docs from the
root commit (`WAVE2_HANDOFF_OPUS.md`, `WAVE2_QUEUE.md`), the `VES_BUILD` stamp chain (line 11898–11899).
**Not present in this repo** (gitignored by ruling 2026-08-31): `LEDGER.md`, `DESIGN_INTENT.md` or successor, `THEORY_REGISTER.md`,
`RECONCILIATION.md`, `GTM_BAR.md`, `MAP.md`. Consequence: findings below reference ledger IDs only where NOTES.md or the
build-stamp chain names them (U1–U4, N-R1, T-Q1, C-R1/2, C-S4, D-24.x/25.x/26.x). New IDs are `SW-nn`; they are this
sweep's sequence, not the LEDGER's, and are renumbered on Patrick's word. See F-08.

### 2.4 Public-history scan (all 68 objects, not only HEAD)
Method (OBS): enumerated every path in every commit; grepped every blob on lines < 400 chars for street addresses, personal
email domains, phone patterns, GitHub/AWS token shapes, private-key headers, `LLC/Inc`, US state names, and `$` figures;
compared the four historical `VES_PM.html` blobs (F18.55 `ff0ecb89`, F18.56 `ca007ff6`, F18.57 `0209efd7`, F18.58 `4d6f77d8`)
for `Prepared by` placeholders (all four read `your name` / `your company` / `912-555-0000` / `name@company.com`).
**No** address, personal email, phone number, token, or key was found. Items that need **Patrick's ruling** (this seat does
not know the client/project list and does not decide):

| # | object(s) | text | question |
|---|---|---|---|
| H1 | `src/VES_PM.html` lines 3151 and 3359, present in all four historical blobs | a named estimate and a named price source in the seed-library comments (text scrubbed in Batch V) | Ruled sensitive 2026-09-01; scrubbed at HEAD of this branch. Remains in every earlier commit (history ruling pending). |
| H2 | lines 3058–3059, 3076, 3079 (all blobs) | a named template with a local path, and the seed library's own name carrying that word (scrubbed in Batch V) | Ruled sensitive 2026-09-01; scrubbed at HEAD of this branch; the region string stays. Remains in earlier commits. |
| H3 | code comments across the file (e.g. lines 4290, 5740, 7897, 8158, 9135, 10169, 11019) | dollar figures from persona runs (`$279,518.37`, `$85,079.16`, `$63,902.74`, `$215,434,861,792.31`, …) | Were the fixtures behind these figures synthetic? CLAUDE.md bars job dollar figures from public docs; code comments are inside the shipped file. |
| H4 | root-commit blobs `WAVE2_HANDOFF_OPUS.md`, `WAVE2_QUEUE.md`; `gate/goldens/fingerprints.json`; `gate/gate.mjs` line 12 | local paths and a machine username in retired docs and two harness files (harness files scrubbed in Batch V) | Machine username and home layout are exposed. Not C3 material, opsec-minor. |

If any of H1–H3 is ruled client-identifiable, the choice is Patrick's: rewrite-with-residue (all 7 commits carry H1/H2)
or fresh-root orphan. The sweep did not stop other lenses on this, because the ruling is his and the rest of the read
does not depend on it.

---

## 3 · Findings ledger

Severity scale per directive: **blocks money** / **blocks use** / **friction** / **cosmetic**. "Ruling" = not a defect
until Patrick says which way it goes.

### F-01 · Governance/opsec · **ruling** · the product is served publicly by GitHub Pages
- **Evidence (OBS 19:59Z):** `curl -I https://bitumenmachina.github.io/VES/src/VES_PM.html` → HTTP 200, 3,515,506 bytes,
  `text/html`; `…/VES/` → 200 (rendered README, 5,501 bytes); `…/VES/README.md` → 200. Actions shows "pages build and
  deployment" (workflow id 347157912) running on every push since `8313a26`.
- **Reading:** anyone can open the live F18.58 at that URL and estimate with it. `LICENSE` grants "viewing and forking"
  only. README/NOTES do not mention a hosted URL. Under `https://` the app's `file://` banner and autosave keying behave
  as an https origin, untested here (**null**).
- **Falsifies:** Patrick states Pages is intentional (then it is a docs gap: F-06/P-08), or disables Pages in repo settings.

### F-02 · Money-path / Security · **blocks money if reachable** (foreign JSON only) · a string quantity in a takeoff file prices as zero, silently, while every quantity face shows the number
- **Location:** `VESCore.normalizeSnapshot` (2469) passes `measurements[].value` untyped; `VESCore.rollup` (2308)
  `qty += m.value` coerces `"3150.8"` → `"03150.8"` → number on `× pitch`; `assemblyMeasured()` (7687) builds the same string
  and `VESASM.resolveTakeoff` (2949) keeps only `typeof m.value === 'number'`, so the engine sees **0**.
- **Evidence (OBS probe3 §b, fresh load of the synthetic demo with `measurements[0].value = "3150.8"`):**
  rollup field qty `3150.8` (number) · engine input `"03150.8"` (string) · recap sell **$37,878.55** vs **$64,620.46** on the
  unmodified demo · HUD `Material $4,916.00 Labor $25,450.00 Fixed allowances $35,383.75` · toast `Takeoff loaded.` · no banner.
  A $26,741.91 understatement with no signal, and the rail/scope faces still print 3,150.8 SF.
- **Reachability:** the app's own saves write numbers; only a hand-edited or foreign file triggers it. This is the **U2** row
  of the Batch U charter (NOTES §Queue 9, "remaining-arrays validation", scored MED by P-CODE pass 3). The evidence here
  scores it (a) money-honesty under the NOTES triage rubric: two surfaces disagree, silently.
- **Falsifies:** a file written by VES that carries a string `value` (none found in `snapshot()`, 9454 — OBS).

### F-03 · Proposal reader · **friction** (weakens the single selling element) · the plan-legend swatches print without color under Chrome's default print settings
- **Location:** `proposalHTML()` CSS string (10800–10830): `.sw{…}` swatches are `background:` inline; there is **no**
  `print-color-adjust` / `-webkit-print-color-adjust` anywhere in the file (grep count 0, OBS).
- **Evidence (OBS probe3 §d):** demo takeoff with a drawn polygon + polyline on the grid → proposal renders a snapshot
  (2 legend items, swatches `rgb(255,93,58)` and `rgb(176,124,216)`). `Page.printToPDF` of that HTML:
  with `printBackground:true` the PDF fill colors include `1.00,0.36,0.23` and `0.69,0.49,0.85`; with
  `printBackground:false` (Chrome's UI default, "Background graphics" unchecked — STD) **neither color is present**.
  The snapshot `<img>` keeps its colors either way. Files: `proposal-bgon.pdf` 82,854 B / `proposal-bgoff.pdf` 73,801 B
  (scratchpad, not committed).
- **Effect:** the client sees the plan in colors and a legend of empty boxes; the color→condition→quantity loop (L-09)
  breaks on paper unless the estimator knows to tick a print option. Ratified rulings on the proposal's single selling
  element apply.
- **Falsifies:** a headed Chrome/Firefox print with default settings that shows colored swatches.

### F-04 · Money-path (client paper) · **friction** · N-R1 is ALIVE and quantified: cent-rounded unit rates on large-quantity labor rows miss the row amount by up to 1.5%
- **Location:** `printBidDoc` (10283+) prints `rate = amount ÷ qty` rounded to cents (D-26.4).
- **Evidence (OBS probe, demo):** `Primer — labor` 3,150.8 SF × $0.19 = $598.65 vs Amount $589.55 (**$9.10, 1.5%**);
  `TPO Membrane — labor` 3,150.8 × $4.37 = $13,769.00 vs $13,756.08 (**$12.92**); `Surface Prep — labor` $5.83;
  `Drip Edge Metal` $0.72. Totals: bid Total = recap sell = grid footer to the cent in every state tested. Every row on the
  page multiplies within the rounding of its two printed figures, exactly as the basis note says — but at a $0.19 rate the
  rounding is 5% of the rate.
- **Existing ID:** N-R1 (rate precision 2 vs 4 decimals — owner presentation lane, parked at Batch T). No new ID.
- **Falsifies:** nothing to falsify; this is the ruled park with numbers attached.

### F-05 · Money-path · **verified negative (adversary)** · the F5 invariant holds under fuzz
- Claim under test: printed bid Total (sum of per-line ladders, apportioned to cents) equals the recap's `round(ladder(Σcost))`.
- **Evidence (OBS, `ladder-fuzz.mjs`, Appendix A):** 2,000,000 random takeoffs (1–40 lines, costs to $50,000, OH/MU/PR 0–29%):
  `bidVsRecapCentMismatch: 0`, `pctRoundTripCentMismatch: 0` (the `oh/100*100` round-trip in `bidCollect` never moved a cent).
- **Residual:** exhaustive proof is impossible; a mismatch would need an exact sell within ~1e-10 of a half-cent. INF.

### F-06 · Governance / record · **friction** (for the next seat) · public docs describe bytes that are not at HEAD
| doc | says | bytes say | tag |
|---|---|---|---|
| `NOTES.md` §State | "src = F18.57 — sha256 6eb480bc…, 3,503,144 bytes" | F18.58, `f785eea7…`, 3,515,506 (queue item 7 does record Batch T landed) | OBS |
| `README.md` | "`VES_BUILD`, currently F18.57" | F18.58 | OBS |
| `NOTES.md` §Seat notes | "no browser binary in cloud VMs" / "G0/probes need the local seat" | Chromium 141 at `/opt/pw-browsers`; G0 GREEN here | OBS |
| `gate/README.md` | "Node 24 (global WebSocket + fetch)", "Headless Chrome 149" | ran on Node 22.22.2 + Chromium 141: those are floors, not requirements | OBS |
| `gate/README.md`, `gate/goldens/fingerprints.json` | goldens frozen against `~/Downloads/VES.html` sha `506f80f7…` (July 5) | that build is not in this repo; the goldens' provenance points off-repo (the check still passes on F18.58) | OBS |
| `CLAUDE.md` §Identity | F18.58 / 3515506 / `f785eea7…` | matches | OBS |

### F-07 · Governance / verification · **friction** · the FREEZE check fences nothing
- **Evidence (OBS):** verifier prints `FREEZE 0 regions; manifest absent`. No `<!-- VES:FREEZE … -->` sentinel exists in
  `src/VES_PM.html`. `VESCore` (2146–2614, 21,369 B) and `VESASM` (2680–3050) — the money engine — are unfenced, so a
  byte change inside them fails nothing until G0 runs, and G0 runs only where a browser is (see P-01/P-02).

### F-08 · Governance / record · **friction** · the canon this sweep was told to read is off-repo
- `DESIGN_INTENT.md`, `LEDGER.md`, `THEORY_REGISTER.md`, `RECONCILIATION.md`, `GTM_BAR.md` are gitignored (OBS `.gitignore`).
  NOTES.md carries rulings by ID (D-26.4, U1–U4, N-R1…) without their text. A public seat cannot state a finding *against*
  a ruling it cannot read; this document names IDs where NOTES names them and otherwise states behavior from bytes.
  Rulings recorded only in conversation (the directive's "gap to name") cannot be enumerated from here — **null**.

### F-09 · Security / opsec · **cosmetic** (a statement gap) · autosave slots hold client identity in plain `localStorage`, and the landing copy names only the price library as browser-resident
- **Evidence (OBS probe3 §e):** after loading the demo with `client = 'SYNTH-CLIENT-MARKER'`, `address = '1 Synthetic Way'`:
  key `ves:auto:grid:demo-flat-roof-sample` (4,145 B) contains both. Landing copy (line 1708): "Your takeoff saves as a
  JSON file you own; your price library lives in this browser." — true and incomplete: autosaved takeoffs (with client
  name/address/phone/email) live in the browser too, and the "Pick up where you left off" list names them on the empty screen.
- This is by design for a local-first tool; the finding is that the data-safety trio (S-series, B-series bar rows) does not
  say it. Not a vulnerability.

### F-10 · Security · **verified negative (adversary)** · no HTML-injection sink found for foreign strings
- **Method (OBS probe3 §c):** takeoff file with `<img src=x onerror=…>` payloads in `projectMeta.{name,client,address,phone,
  email,notes,proposalNotes,preparedBy.*}`, `conditions[].{name,csi,notes,location,wbs,tags}`, a quote-breaking `color`,
  `measurements[].notes`, `general[].{label,unit,csi,note}`, `pdfName`; then a library import with payloads in condition
  label, item desc/note, assembly label, general label. Drove: cards, depth panel, assemblies modal, all recap tabs, estimate
  grid, schedule, ledger, HUD, inspector, project modal, bid (twice, past the identity gate), cost sheet, proposal HTML,
  client-review HTML, sheet strip, command palette, resume list, four CSV exports.
- **Result:** 0 handlers fired; 0 raw payloads in the bid/proposal/client-review/body HTML; 0 inline event attributes;
  the hostile color was dropped by `COLOR_RE`; CSV filenames slugged. `esc`/`escA`/`textContent` discipline holds on every
  path exercised. `isEvalSupported:false` (line 4528) closes the pdf.js 3.11.174 font-program eval path (CVE-2024-4367, STD).
- **Residual:** pdf.js 3.11.174 is a 2023 bundle; later upstream fixes are not in it (INF, not enumerated). PDF-derived
  strings (outline/metadata) were not fed to any sink in this probe (**null**).

### F-11 · Maintainer · **cosmetic** (latent) · `openAudit()` throws on a grid-calibrated sheet
- **Location:** `openAudit` (6273): `if (c.fromScale) … else { row('parsed', c.realFt + ' ft'); row('pdf dist', c.pdfDist.toFixed(4)…) }`.
  A grid calibration is `{ftPerUnit:1, fromGrid:true, points:null}` (demo file, `startBlankCanvas`) — no `fromGrid` branch.
- **Evidence (OBS probe3 §a):** fresh demo load → `VESApp.openAudit()` → `TypeError: Cannot read properties of undefined (reading 'toFixed')`;
  the modal is left half-built and not opened.
- **Reachability:** the UI door is `$('calStatus').click → state.pdf && openAudit()` (line 11260), gated on a PDF, so an
  estimator on a grid takeoff cannot reach it. Reachable via the `VESApp` seam only. Adversary note: first scored
  "blocks use", downgraded on reading the door.

### F-12 · Maintainer · **cosmetic** · duplicated helpers and known parks, restated from bytes
- Two HTML escapers: `esc()` (7461, DOM-based) and `escA()` (8246, regex). Both correct; two definitions of one rule.
- `printClientReview` / `clientReviewHTML` are dead (T-5, recorded) yet exported on `window.VESApp` (11924).
- Line 11899 is a 34,019-byte comment (the build-log chain) — C-R2 park; it defeats line-based diff and blame for the stamp.
- Each `src` commit adds ~1.6 MB to `.git` (loose blob sizes 1,592,131 → 1,619,073 B for F18.55→F18.58, OBS); at the
  current cadence (4 builds/day on 2026-09-01) the clone grows ~6 MB/day. Not a problem yet; stated so it is on record.
- Byte map (OBS): CSS 388,983 (of which embedded webfonts 270,673) · HTML 31,961 · pdf.js worker 1,087,346 · standard
  fonts 1,032,896 · pdf.js lib 320,022 · VESCore 21,369 · application 632,692 (one `<script>` block, lines 2615–11946).
  The app is 18% of the file; pdf.js + fonts are 69%.

### F-13 · Field / PM · **friction** (queued item, bytes confirm it is not built) · below ~720 px the layout is the desktop layout, compressed
- **Evidence (OBS, CDP device emulation, fresh loads, 0 console errors on all three):**

| viewport | ready | toolbar | rail/dock | sheet column | heap |
|---|---|---|---|---|---|
| 1440×900 desktop | 330 ms | 1440×43 | 360 wide | ~1,020 px | 10 MB |
| 820×1180 tablet | 268 ms | 820×81 (2 rows) | 360 wide | ~460 px | 10 MB |
| 390×844 phone, DPR 3 | 125 ms | 390×**183** (4 rows, 22% of height) | 280 wide (`#dock min-width:280px`, line 1417) | **~110 px** | 10 MB |

  Screenshot of the phone load: the landing copy wraps one or two words per line in the 110 px sheet column beside a full
  desktop rail. Only two `@media` width rules exist (720 px recap columns, 1319 px command hint; lines 396/1458). Touch:
  `pointerdown` returns early for `pointerType === 'touch'` (5518) — no grip-drag or pan; whether a tap places a trace
  point through the overlay `click` handler (5556) was not exercised (**null**). Emulation note: `innerWidth` reported 600
  on the 390-px phone profile while every element measured 390 wide — an emulation artifact, unexplained (INF).
- "It loads on my phone": it does, in 125 ms with no errors. What survives the screen is the question for Patrick (§5).

### F-14 · Estimator at the board · **friction** (INF, needs a real keyboard) · a negative margin typed into OH/MU/PR is silently stored as 0 and the field blanks
- **Location:** margin `input` handler (11155–11178): `Math.max(0, +e.target.value || 0)`; `sellLadder` clamps the same way.
- **Evidence (probe3 §g, dispatched `input`/`change` with value `-5` on `#ohPct`):** stored `overheadPct: 0`, sell moved
  $64,620.46 → $58,745.87, the field re-rendered empty, no toast about the refusal (the toast slot carried the fixed-allowance
  sentence). Inputs have `min="0"`, so a real keyboard may reject the keystroke differently — untested with real keys.

### Observed controls (no finding)
- First bid print on a fresh takeoff with no company: identity modal opens, `#printDoc` holds the release placeholder
  ("Nothing to print — use Files & exports."), `window.print` not called; second print emits 21 rows (D-24.4 / D-24.7a as ruled). OBS.
- Turn a material line OFF → recap, bid total and "Not included" agree; Ctrl+Z restores exactly. Waste 15% on a 4-roll
  line leaves `ordered` 4 (CEIL), 30% → 5, bid row still multiplies. Exact-quantity override 7 ROLL prints 7 × $2,182.95 =
  $15,280.65. Margins 7/12.5/9 → recap = grid footer = bid Total $67,971.54. Journal names every gesture. OBS.
- Schedule lens renders 10 rows + ruler, 14-day horizon, on the demo. OBS.

---

## 4 · The open money-ruling trio — what the bytes decide today (defaults, not rulings)

| ruling | where the code decides | current default (OBS) |
|---|---|---|
| **Rounding policy** | engine: none (`extended = ordered × unitCost`, unrounded). Display: `fmtMoney` 2 dp (2283). Client bid: per-line cents apportioned largest-first so rows sum to subtotals and subtotals to Total; Total = `round(Σ exact)` (10310–10330). Cost sheet: `apportionCents` on OH/MU/PR parts (8220). Proposal: divisions rounded independently with a basis line; single-division shows the recap sell. Export CSVs: cents for money, 4 dp for unit cost (M-D). | rounding is a presentation act; F5 fuzz shows Total == recap to the cent |
| **Overhead column** | `sellLadder` (2298): OH on total cost, MU on cost+OH, PR on that — multiplicative, applied to material+labor+equipment alike ("Margins apply to the total, not to either half", cost-sheet basis). Bid unit price on non-rebased rows = `unitCost × (1+oh)(1+mk)(1+pf)`. | no per-kind or per-division overhead; OH is a ladder step, not a column |
| **General-lane quantity** | `resolveGeneral` (2926): `qty === 0` → `NO_MATCH` "no quantity entered", excluded and flagged (D-23.9); qty < 0 or non-number → gated; cost null → "no unit cost". All display faces read the engine (R2). Sanitiser caps `general[]` at 2,000 entries (T3). | a qty-0 general line exists but never prices; whether it may exist is the (c) ruling NOTES already marks as Patrick's |

Golden-fixture parity: G0 GREEN on the untouched bytes (above). No change is proposed to any of the three here.

---

## 5 · Ask Patrick — at the point each is needed
1. **History (§2.4):** ruled sensitive and scrubbed at HEAD; the history choice (rewrite-with-residue or fresh-root orphan) is still his.
2. **Pages (F-01):** intended? If yes, the README/LICENSE should say so and under what terms; if no, disable in repo settings.
3. **Egress matches:** the 7 baseline entries are explained above; none is new. No ruling needed unless he disagrees with an explanation.
4. **Money trio (§4):** which of the three he wants decided this cycle, and how. This seat proposes nothing on them.
5. **Structural proposals (P-06):** wanted in this cycle at all?
6. **"Loads on my phone":** what counts — a screenshot at 390 px, a real-device open, a traced measurement by touch, or a printed bid from the phone?
7. **U2 severity (F-02):** the evidence scores it (a) under his rubric; he rules.

---

## 6 · Proposals (separated from findings; none lands without his word on the item)

| id | proposal | surface touched | invariants it could threaten | evidence that it landed |
|---|---|---|---|---|
| P-01 | Run G0 in CI: `ubuntu-latest` ships Google Chrome; add a `gate` job to `verify.yml` (`VES_CHROME=google-chrome node gate/g0.mjs check src/VES_PM.html`) and print its output into the job summary. Cloud seats set `VES_CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome`. | `.github/workflows/verify.yml`, NOTES/README seat notes | none in the product; the harness stays outside the file | Actions summary carrying `G0 GREEN` on a push; NOTES seat note corrected |
| P-02 | Fence `VESCore` and `VESASM` with `<!-- VES:FREEZE core -->` / `<!-- VES:END core -->` sentinels; Patrick runs `--write-manifest` himself after reading the diff. | two comment lines in `src/VES_PM.html` (bytes and hash change) | identity (new hash — expected); G0 must stay GREEN | verifier `FREEZE 1 region; manifest 1 entries`; G0 GREEN; CLAUDE.md identity updated |
| P-03 | `print-color-adjust: exact; -webkit-print-color-adjust: exact` on `.sw` (and `.plegend`) in `proposalHTML()`'s CSS string. | one CSS string, client paper only | none (no money, no engine) | `printToPDF` with `printBackground:false` shows the swatch fill colors (the probe in Appendix C, §d) |
| P-04 | Land U2 (Batch U charter): type-check `measurements[].value` / `conditions[].{unitCost,pitch}` at `normalizeSnapshot`/`applySnapshot`, refuse (drop + count + banner, R3/T4 idiom) rather than coerce. | ingress only | none if drops are counted; G0 C-scenario (save→reload) must stay identical | probe3 §b reports the load toast/banner naming 1 dropped value and recap sell equal to the demo's |
| P-05 | Docs realignment: NOTES §State to F18.58 + hash; README build line; NOTES seat note on cloud browsers; gate/README floors (Node ≥ 22, Chrome ≥ 141 observed) and golden provenance sentence; scrub the local path from `fingerprints.json`/`gate.mjs` default. | docs + two harness files | fingerprints.json is part of the frozen harness — a path edit changes a file the gate lists (YELLOW per gate/README) | text matches bytes; G0 GREEN |
| P-06 | **Structural (proposal only, stated at the level of gain):** split the single 632 KB application `<script>` into ordered named blocks in the same file (state+core, engine seed, UI/plan lens, documents, boot). Gain: the verifier's SYNTAX check localizes to a block; FREEZE fences can cover the engine and the money faces separately; diffs and blame stop crossing 9,300 lines; the 34 KB stamp line can become a fenced, machine-readable block. Cost: none at runtime if order is preserved (classic scripts share one global scope); every block boundary is a place a future edit can break implicit ordering. Single-file stays single-file. | `src/VES_PM.html` block boundaries | hash; G0; every probe in the local harness | G0 GREEN + full probe stack green + verifier SYNTAX block count rises; no golden moves |
| P-07 | N-R1 (rate precision) — Patrick's presentation lane; the numbers in F-04 are the input. | bid unit-price column | client paper only | rows multiply within one cent at 4 dp |
| P-08 | If Pages stays: state the hosted URL and terms in README/LICENSE; if not: disable. | repo settings / docs | none | curl 404 or a README sentence |
| P-09 | Workflow hardening: `permissions: contents: read` at the top of `verify.yml`; pin `actions/checkout` and `setup-node` by commit SHA (STD supply-chain practice). | workflow | none | run still green |
| P-10 | Commit the sweep probes under `tools/sweep/` so the evidence in this document is re-runnable by any seat (they are in Appendix A–C in full). | new tool files | none (they never touch product bytes) | a seat re-runs them and pastes output |
| P-11 | Mobile rest layout under 720 px (rail collapsible, toolbar two rows) — queued item per directive; bytes confirm nothing exists. Not drafted. | CSS | none | phone screenshot with a usable sheet |
| P-12 | F-09: add "autosaved takeoffs" to the landing data-safety sentence. | one string | none | text |

---

## 7 · Residual risk — what was not checked, and why
- **Real PDF plans.** Every probe ran the grid path (Path A). pdf.js rendering, calibration by clicked points, the identity
  gate on a mismatched PDF, and the proposal snapshot on a real sheet were not exercised — no synthetic plan PDF is in the repo.
  Runtime egress under a PDF needing CMaps or system fonts: **null**.
- **Firefox / headed browsers / real pointer and keyboard.** All evidence is headless Chromium 141 with dispatched events;
  the D-24.7b headed bench, print dialogs, pop-up handling for the proposal window, and touch tracing are **null**.
- **Persona passes** (P-CODE 4, P-BUYER 2) were not re-run; this is a different lens, not a substitute.
- **History scan** is regex heuristics, not the client/project list — H1–H4 are the only candidates it surfaced; a name that
  matches none of the patterns would be missed.
- **Off-repo canon** was not read (§2.3), so a finding here may duplicate a LEDGER row under another ID.
- **`https://` origin behavior** of the Pages copy (autosave keys, file banner, print) not tested.
- **Phone emulation** `innerWidth` anomaly unexplained; the screenshot and element rects are the evidence, not the number.
- **Third-party skills/plugins:** prior null carried, not re-run, per directive.

---

## 8 · Method note — what this seat did differently
- Probed environment claims instead of carrying them: found the browser, ran G0 in the cloud (NOTES.md said no browser exists there).
- Read the money path end-to-end (engine → recap → bid/cost sheet/proposal → autosave) in one context, then wrote an
  adversarial fuzz for the one invariant a code read cannot prove (F-05).
- Drove the shipped file through raw CDP for the estimator, proposal, field, security and ingress lenses, on fresh loads,
  with the confirm gates passed explicitly (an earlier run was invalidated by the D-25.3a guard and is not reported).
- Vulnerability discovery in scope, exploitation out: injection sinks and ingress typing were tested with inert markers only.
- Every state claim tagged; no baseline, manifest, or product byte written; the Stop hook verifier ran on the untouched file.

---

## Appendix A — `ladder-fuzz.mjs` (F-05), sha256 `6cd3d2b0dbbcb75c039fded92ceade9f7ceaafbf99eceabbe631ac5c707e9d27`
```js
// Adversary check: does round(Σ per-line ladder) ever differ from round(ladder(Σ cost))?
// Also: does oh/100*100 round-trip (bidCollect → sellOf) change a cent vs recapModel's direct pct?
function sellLadder(cost, ohPct, mkPct, pfPct) {
  const oh = Math.max(0, +ohPct || 0) / 100, mk = Math.max(0, +mkPct || 0) / 100, pf = Math.max(0, +pfPct || 0) / 100;
  const ohAmt = cost * oh, base = cost + ohAmt, mkAmt = base * mk, s1 = base + mkAmt, pfAmt = s1 * pf;
  return { cost, oh, mk, pf, ohAmt, mkAmt, pfAmt, sell: s1 + pfAmt };
}
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
let trials = 0, diffSum = 0, diffPct = 0, ex = [];
for (let t = 0; t < 2000000; t++) {
  const n = 1 + Math.floor(rnd() * 40);
  const costs = []; for (let i = 0; i < n; i++) costs.push(Math.round(rnd() * 5000000) / 100);
  const oh = Math.floor(rnd() * 30), mk = Math.floor(rnd() * 30), pf = Math.floor(rnd() * 30);
  const total = costs.reduce((a, b) => a + b, 0);
  const recap = sellLadder(total, oh, mk, pf).sell;
  const ohf = Math.max(0, oh) / 100, mkf = Math.max(0, mk) / 100, pff = Math.max(0, pf) / 100;
  let exact = 0; for (const c of costs) exact += sellLadder(c, ohf * 100, mkf * 100, pff * 100).sell;
  const bidTotal = Math.round(exact * 100), recapC = Math.round(recap * 100);
  trials++;
  if (bidTotal !== recapC) { diffSum++; if (ex.length < 5) ex.push({ n, oh, mk, pf, total, recap, exact, bidTotal, recapC }); }
  const direct = sellLadder(total, oh, mk, pf).sell, rt = sellLadder(total, ohf * 100, mkf * 100, pff * 100).sell;
  if (Math.round(direct * 100) !== Math.round(rt * 100)) diffPct++;
}
console.log(JSON.stringify({ trials, bidVsRecapCentMismatch: diffSum, pctRoundTripCentMismatch: diffPct, examples: ex }, null, 1));
```
Output (OBS): `{"trials":2000000,"bidVsRecapCentMismatch":0,"pctRoundTripCentMismatch":0,"examples":[]}`

## Appendix B — `probe-sweep.mjs` (viewport loads, estimator flow, parity), sha256 `89a70ab161482834a132fc857311d08b4f9313412785f36b6a612218244fee1b`
Run: `VES_CHROME=<chrome> node probe-sweep.mjs <abs path to src/VES_PM.html> <out dir> <abs path to release/demo/demo-flat-roof.json>`.
Note: its §ingress/§xss/§proposalPrint sections ran on a page already carrying measurements and were blocked by the D-25.3a
confirm gate; those three results are superseded by Appendix C and are not cited above.
```js
// Sweep probe: drives the shipped file through raw CDP in the cloud Chromium.
// Lenses: mobile/tablet load, estimator flow on the synthetic demo, bid/proposal parity,
// ingress hostility (string quantities), HTML-injection sinks, proposal print-color test.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
const CHROME = process.env.VES_CHROME; const VES = process.argv[2]; const OUT = process.argv[3];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function connect(url) { return new Promise((resolve, reject) => {
  const ws = new WebSocket(url); let id = 0; const pending = new Map(); const listeners = [];
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, on(fn) { listeners.push(fn); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws error')));
  ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); return msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } for (const fn of listeners) fn(msg); });
}); }
const port = 9300 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), 'ves-sweep-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 150 && !wsUrl; i++) { try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = list.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl);
await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
const consoleErrs = [];
c.on((m) => { if (m.method === 'Runtime.exceptionThrown') consoleErrs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300)); if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) consoleErrs.push(m.params.type + ' ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrs.push('LOG ' + m.params.entry.text.slice(0, 300)); });
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const url = 'file://' + VES; const report = {};
async function load(label, metrics) {
  if (metrics) await c.send('Emulation.setDeviceMetricsOverride', metrics); else await c.send('Emulation.clearDeviceMetricsOverride');
  consoleErrs.length = 0; const t0 = Date.now();
  await c.send('Page.navigate', { url });
  let ready = false; for (let i = 0; i < 300; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) { ready = true; break; } } catch (_) {} await sleep(100); }
  const t1 = Date.now();
  await ev('new Promise(r=>setTimeout(r,800))');
  const info = await ev(`(() => { const se = document.scrollingElement; const tb = document.getElementById('toolbar'); const vis = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), offRight: Math.round(r.right - innerWidth) }; };
    const btns = [...document.querySelectorAll('#toolbar button')].filter(b => b.offsetParent !== null).map(b => ({ t: (b.textContent||'').trim().slice(0,14), r: vis(b) }));
    return { innerWidth, innerHeight, dpr: devicePixelRatio, scrollW: se.scrollWidth, scrollH: se.scrollHeight, bodyOverflowX: se.scrollWidth > innerWidth, toolbar: vis(tb), rail: vis(document.getElementById('rail')), dock: vis(document.getElementById('dock')), visibleToolbarButtons: btns.length, offRightButtons: btns.filter(b => b.r.offRight > 0).map(b => b.t), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null, build: window.VESApp.VES_BUILD, resumeCards: document.querySelectorAll('.rl-card').length }; })()`);
  const { data } = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, `shot-${label}.png`), Buffer.from(data, 'base64'));
  report[label] = { ready, msToReady: t1 - t0, ...info, consoleErrors: consoleErrs.slice() };
}
await load('desktop-1440', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await load('phone-390', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await load('tablet-820', { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
await load('flow', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
// ---------------- estimator flow on the synthetic demo ----------------
const demo = readFileSync(process.argv[4], 'utf8');
consoleErrs.length = 0;
await ev(`window.print = () => { window.__printed = (window.__printed||0)+1; }; window.__demo = ${demo}; VESApp.loadFromData(window.__demo); new Promise(r=>setTimeout(r,400))`);
const flow = await ev(`(async () => {
  const App = VESApp, out = {};
  const money = (v) => VESCore.fmtMoney(v);
  const snap = () => { const m = App.recapModel(); return { lines: m.lineCount, cost: +m.cost.toFixed(2), sell: +m.sell.toFixed(2), off: m.off, excluded: m.excluded.length }; };
  out.afterLoad = snap();
  const res = App.resolveAssembly();
  out.engine = { lines: res.lines.length, included: res.lines.filter(l => l.included).length, gated: res.lines.filter(l => l.gate).map(l => l.item + ': ' + l.matchStatus), warnings: res.warnings };
  out.rollup = VESCore.rollup(App.state.conditions, App.state.measurements).map(r => ({ name: r.name, qty: r.quantity, unit: r.unit, count: r.count }));
  // bid parity: every row Qty×Unit≈Amount, subtotals sum, total == recap sell
  const parseBid = () => { printBidDoc(); const doc = document.getElementById('printDoc'); const rows = [...doc.querySelectorAll('.divblock tbody tr')].filter(tr => !tr.classList.contains('grand')).map(tr => { const td = [...tr.children].map(x => x.textContent.trim()); return { desc: td[1], qty: td[3], unit: td[4], rate: td[5], amt: td[6] }; }); const subs = [...doc.querySelectorAll('tr.grand')].map(tr => tr.lastElementChild.textContent.trim()); const num = (s) => +String(s).replace(/[$,]/g, ''); const rowChecks = rows.map(r => { const q = num(r.qty), u = num(r.rate), a = num(r.amt); return { desc: r.desc, q, u, a, prod: +(q*u).toFixed(2), diff: +((q*u) - a).toFixed(2) }; }); const total = subs.length ? num(subs[subs.length - 1]) : null; const divSum = subs.slice(0, -1).reduce((s, x) => s + num(x), 0); const lineSum = rowChecks.reduce((s, r) => s + r.a, 0); return { rows: rowChecks, subtotals: subs, total, divSumMatchesTotal: Math.abs(divSum - total) < 0.005, lineSumMatchesTotal: Math.abs(lineSum - total) < 0.005, recapSell: +App.recapModel().sell.toFixed(2), totalMatchesRecap: Math.abs(total - +App.recapModel().sell.toFixed(2)) < 0.005, notIncluded: [...doc.querySelectorAll('.exclsec li')].map(li => li.textContent), printed: window.__printed }; };
  out.bid0 = parseBid();
  // proposal parity
  const ph = await App.proposalHTML(); const pdoc = new DOMParser().parseFromString(ph, 'text/html');
  const pm = App.proposalModel();
  out.proposal = { sell: +pm.sell.toFixed(2), matchesRecap: Math.abs(pm.sell - App.recapModel().sell) < 1e-9, scope: [...pdoc.querySelectorAll('section.scope li')].map(li => li.textContent.trim()), invest: (pdoc.querySelector('.big') || pdoc.querySelector('tr.tot .n') || {}).textContent, notIncluded: [...pdoc.querySelectorAll('ul.excl li')].map(li => li.textContent), hasSnapshot: !!pdoc.querySelector('.pviz'), legendItems: pdoc.querySelectorAll('.lgi').length, htmlLen: ph.length };
  window.__proposalHTML = ph;
  // assembly toggle: turn the field membrane material OFF, then undo
  const field = res.lines.find(l => l.kind === 'material' && l.included && l.drivingRefs.includes('tpo.field'));
  out.toggleTarget = field && field.item;
  setLineOmit(field.item, true); out.afterOff = snap(); out.bidOff = { total: parseBid().total, notIncludedHasIt: parseBid().notIncluded.some(n => /membrane|field/i.test(n)) };
  App.undo(); out.afterUndo = snap();
  // exact-quantity override + waste edit on a material line, then re-check bid row multiplication
  const tgt = res.lines.find(l => l.kind === 'material' && l.included && l.drivingRefs.length === 1 && !l.qtyOverridden);
  out.editTarget = tgt && { item: tgt.item, ordered: tgt.ordered, unit: tgt.unit, waste: tgt.itemWaste, unitCost: tgt.unitCost };
  editLine(tgt.item, 'waste', 0.15); out.afterWaste = snap();
  const b1 = parseBid(); out.bidAfterWaste = { total: b1.total, totalMatchesRecap: b1.totalMatchesRecap, worstRowDiff: Math.max(...b1.rows.map(r => Math.abs(r.diff))), rows: b1.rows.filter(r => Math.abs(r.diff) > 0.01) };
  editLine(tgt.item, 'qty', 123); out.afterQtyOv = snap();
  const b2 = parseBid(); out.bidAfterQtyOv = { total: b2.total, totalMatchesRecap: b2.totalMatchesRecap, worstRowDiff: Math.max(...b2.rows.map(r => Math.abs(r.diff))), rows: b2.rows.filter(r => Math.abs(r.diff) > 0.01), theRow: b2.rows.find(r => /membrane/i.test(r.desc)) };
  App.undo(); App.undo(); out.afterUndo2 = snap();
  // margins: set OH/MU/PR and confirm HUD, grid foot and bid agree
  App.state.assemblyProject.settings.overheadPct = 7; App.state.assemblyProject.settings.markupPct = 12.5; App.state.assemblyProject.settings.profitPct = 9; App.renderCards(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));
  App.showEstimate(true); await new Promise(r => setTimeout(r, 100));
  const foot = document.querySelector('#estgridFoot .fb.sell .fv'); const hud = document.querySelector('#hudSell, #sellStrip, [id*=sell]');
  out.margins = { recapSell: +App.recapModel().sell.toFixed(2), gridFootSell: foot && foot.textContent.replace(/\\s/g, ''), bidTotal: parseBid().total };
  App.showEstimate(false);
  // schedule lens
  App.showSchedule(true); await new Promise(r => setTimeout(r, 100)); out.schedule = { rows: document.querySelectorAll('#schedHost .sched-row, #schedHost tr').length, text: (document.getElementById('schedHost') || {}).textContent?.slice(0, 80) }; App.showSchedule(false);
  // autosave contents
  const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  out.localStorage = keys.map(k => ({ k, bytes: (localStorage.getItem(k) || '').length, hasProjectMeta: /projectMeta/.test(localStorage.getItem(k) || '') }));
  return out;
})()`);
report.flow = flow; report.flowConsole = consoleErrs.slice();
// ---------------- ingress hostility: string quantity in a takeoff file ----------------
consoleErrs.length = 0;
report.ingress = await ev(`(async () => {
  const App = VESApp; const d = JSON.parse(JSON.stringify(window.__demo));
  d.measurements[0].value = "3150.8";           // string, not number
  d.measurements.push({ id: 99, conditionId: 5, page: null, type: 'linear', points: null, value: 10, notes: '', manual: true });   // points null
  d.conditions[0].pitch = "1.2";
  App.newTakeoff(); App.loadFromData(d); await new Promise(r => setTimeout(r, 400));
  const roll = VESCore.rollup(App.state.conditions, App.state.measurements);
  const eng = assemblyMeasured();
  const m = App.recapModel();
  return { rollupFieldQty: roll[0].quantity, rollupFieldQtyType: typeof roll[0].quantity, engineFieldQty: (eng.find(e => e.condId === 'tpo.field') || {}).value, recapSell: m.sell, recapLines: m.lineCount, toast: document.getElementById('toast').textContent, banners: [...document.querySelectorAll('.banner .msg')].map(b => b.textContent) };
})()`);
report.ingressConsole = consoleErrs.slice();
// ---------------- HTML-injection sinks ----------------
consoleErrs.length = 0;
report.xss = await ev(`(async () => {
  const App = VESApp; window.__xss = []; const P = (t) => '<img src=x onerror="window.__xss.push(&quot;' + t + '&quot;)">';
  const d = JSON.parse(JSON.stringify(window.__demo));
  d.projectMeta.name = 'Job ' + P('projectMeta.name'); d.projectMeta.client = P('client'); d.projectMeta.address = P('address'); d.projectMeta.notes = P('notes'); d.projectMeta.preparedBy = { company: P('preparedBy.company'), name: P('preparedBy.name') }; d.projectMeta.proposalNotes = P('proposalNotes');
  d.conditions[0].name = 'Cond ' + P('condition.name'); d.conditions[0].csi = P('condition.csi'); d.conditions[0].notes = P('condition.notes'); d.conditions[0].location = P('condition.location'); d.conditions[0].wbs = P('condition.wbs'); d.conditions[0].color = 'red" onmouseover="1';
  d.measurements[0].notes = P('measurement.notes');
  d.assemblyProject.general = [{ id: 'g1', label: P('general.label'), qty: 1, unit: P('general.unit'), unit_cost: 5, csi: P('general.csi'), note: P('general.note') }];
  d.pdfName = P('pdfName');
  App.newTakeoff(); App.loadFromData(d); await new Promise(r => setTimeout(r, 400));
  const steps = [];
  const step = async (n, f) => { try { await f(); await new Promise(r => setTimeout(r, 60)); } catch (e) { steps.push(n + ': threw ' + String(e).slice(0, 120)); } };
  await step('renderCards', () => { App.renderCards(); return new Promise(r => requestAnimationFrame(r)); });
  await step('renderAssembly', () => App.renderAssembly());
  await step('renderRecap', () => { App.renderRecap(); App.setRecapTab('materials'); App.setRecapTab('labor'); App.setRecapTab('equipment'); App.setRecapTab('exceptions'); App.setRecapTab('summary'); });
  await step('estimateGrid', () => { App.showEstimate(true); App.renderEstimateGrid(); });
  await step('schedule', () => { App.showEstimate(false); App.showSchedule(true); App.renderSchedule(); App.showSchedule(false); });
  await step('ledger', () => App.renderLedger());
  await step('hud', () => { App.renderHud(); App.renderInspector(); });
  await step('projModal', () => { App.openProjModal(); });
  await step('bid', () => printBidDoc());
  await step('costSheet', () => printCostSheet());
  await step('proposal', async () => { const h = await App.proposalHTML(); const doc = new DOMParser().parseFromString(h, 'text/html'); window.__proposalHostile = h; });
  await step('clientReview', () => { const h = App.clientReviewHTML(); window.__clientReviewHostile = h; });
  await step('audit', () => App.openAudit());
  await step('cmd', () => { App.openCmd(); App.closeCmd(); });
  await step('activate', () => { App.activateCondition(App.state.conditions[0]); });
  await step('depth', () => { App.state.editingCondId = App.state.conditions[0].id; App.renderCards(); return new Promise(r => requestAnimationFrame(r)); });
  await step('sheetStrip', () => renderSheetStrip());
  await step('resume', () => { App.flushAutosave(); renderResumeList(); });
  await new Promise(r => setTimeout(r, 300));
  // static check on the two generated documents: does the raw payload appear unescaped?
  const rawIn = (h) => h && /<img src=x onerror=/.test(h);
  return { fired: window.__xss, steps, proposalRawInjection: rawIn(window.__proposalHostile), clientReviewRawInjection: rawIn(window.__clientReviewHostile), bidRawInjection: rawIn(document.getElementById('printDoc').innerHTML), bodyRawInjection: rawIn(document.body.innerHTML.replace(document.getElementById('printDoc').innerHTML, '')) };
})()`);
report.xssConsole = consoleErrs.slice();
// ---------------- library import with hostile labels ----------------
report.xssLib = await ev(`(async () => {
  window.__xss = []; const P = (t) => '<img src=x onerror="window.__xss.push(&quot;' + t + '&quot;)">';
  const lib = JSON.parse(JSON.stringify(VESApp.state.library));
  const cid = Object.keys(lib.conditions)[0]; lib.conditions[cid].label = 'L ' + P('lib.condition.label');
  const iid = Object.keys(lib.items)[0]; lib.items[iid].desc = P('lib.item.desc'); lib.items[iid].note = P('lib.item.note');
  const aid = Object.keys(lib.assemblies)[0]; lib.assemblies[aid].label = P('lib.assembly.label');
  let r; try { r = VESApp.importLibraryObject(lib, [], 'hostile.json'); } catch (e) { r = 'threw ' + e; }
  VESApp.newTakeoff(); VESApp.loadAssembly(aid); VESApp.addManualQuantity(cid, 10); await new Promise(res => requestAnimationFrame(() => setTimeout(res, 150)));
  VESApp.renderAssembly(); VESApp.openAssemblies(); VESApp.renderRecap(); VESApp.showEstimate(true); VESApp.renderEstimateGrid(); VESApp.showEstimate(false);
  await new Promise(res => setTimeout(res, 300));
  return { importResult: typeof r === 'string' ? r : (r && (r.ok ?? r)), fired: window.__xss };
})()`);
// ---------------- proposal print: do legend swatch colors survive Chrome's default (no background graphics)? ----------------
async function pdfColors(html, printBackground) {
  const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p = {}) => c.send(m, p); // fallback not used
  // attach a second connection for the new target
  const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const t = list.find((x) => x.id === targetId);
  const c2 = await connect(t.webSocketDebuggerUrl); await c2.send('Page.enable');
  await c2.send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') }); await sleep(600);
  const { data } = await c2.send('Page.printToPDF', { printBackground, preferCSSPageSize: true });
  const buf = Buffer.from(data, 'base64'); const txt = buf.toString('latin1');
  const rg = new Set(); let m; const re = /stream\r?\n([\s\S]*?)endstream/g;
  while ((m = re.exec(txt)) !== null) { let s = Buffer.from(m[1], 'latin1'); let dec = null; try { dec = inflateSync(s).toString('latin1'); } catch (_) { dec = s.toString('latin1'); } for (const mm of dec.matchAll(/([0-9.]+) ([0-9.]+) ([0-9.]+) rg/g)) rg.add(mm.slice(1, 4).map((x) => (+x).toFixed(2)).join(',')); }
  c2.close(); await c.send('Target.closeTarget', { targetId });
  return { bytes: buf.length, fillColors: [...rg] };
}
const ph = await ev('window.__proposalHTML');
const swatches = await ev(`[...new DOMParser().parseFromString(window.__proposalHTML, 'text/html').querySelectorAll('.sw')].map(s => s.style.background)`);
report.proposalPrint = { legendSwatchColors: swatches, withBackgroundGraphics: await pdfColors(ph, true), withoutBackgroundGraphics_chromeDefault: await pdfColors(ph, false) };
writeFileSync(join(OUT, 'sweep-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
c.close(); chrome.kill('SIGKILL');
```

## Appendix C — `probe3.mjs` (fresh-load probes: audit, ingress, injection, drawn-proposal print colors, autosave, negative margin), sha256 `c31ee28297410e47cab2911607023119bcef668dda7da55087a9b1cdd2591579`
Run: `VES_CHROME=<chrome> node probe3.mjs <abs src> <abs demo json> <out dir>`.
```js
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path'; import { inflateSync } from 'node:zlib';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const VES = process.argv[2]; const OUT = process.argv[4];
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map(); const ls = [];
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, on(f) { ls.push(f); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } for (const f of ls) f(msg); }); }); }
const port = 9900 + Math.floor(Math.random() * 90); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-p3-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 150 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable'); const errs = [];
c.on((m) => { if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 200)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('console.error ' + m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 200)); });
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
const demo = readFileSync(process.argv[3], 'utf8');
async function fresh() { errs.length = 0; await c.send('Page.navigate', { url: 'file://' + VES }); for (let i = 0; i < 200; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(100); } await ev(`window.print = () => { window.__printed = (window.__printed||0)+1; }; window.__demo = ${demo}; loadFromData.confirmed = true; 1`); }
const R = {};
// (a) audit on a clean grid takeoff, via the UI door
await fresh(); R.audit = await ev(`(async () => { VESApp.loadFromData(window.__demo); await new Promise(r => setTimeout(r, 400)); const btn = document.getElementById('btnVerify') || [...document.querySelectorAll('button')].find(b => /audit|check/i.test(b.textContent)); let clickErr = null; try { VESApp.openAudit(); } catch (e) { clickErr = String(e); } return { cal: VESApp.state.calibrations[1], clickErr, auditOpen: document.getElementById('audit').classList.contains('open'), auditText: document.getElementById('audit').textContent.slice(0, 120), doorButton: btn && (btn.id + ' "' + btn.textContent.trim() + '" visible=' + (btn.offsetParent !== null)) }; })()`); R.auditErrs = errs.slice();
// (b) ingress: string quantity, string pitch, null points
await fresh(); R.ingress = await ev(`(async () => { const d = JSON.parse(JSON.stringify(window.__demo)); d.measurements[0].value = "3150.8"; d.conditions[0].pitch = "1.2"; d.measurements.push({ id: 99, conditionId: 5, page: null, type: 'linear', points: null, value: 10, notes: '', manual: true });
  VESApp.loadFromData(d); await new Promise(r => setTimeout(r, 500)); const roll = VESCore.rollup(VESApp.state.conditions, VESApp.state.measurements); const eng = assemblyMeasured(); const m = VESApp.recapModel();
  return { rollupFieldQty: roll[0].quantity, rollupType: typeof roll[0].quantity, engineFieldQtyRaw: (eng.find(e => e.condId === 'tpo.field') || {}).value, engineFieldType: typeof (eng.find(e => e.condId === 'tpo.field') || {}).value, resolvedLines: VESApp.resolveAssembly().lines.length, recapSell: m.sell, recapLines: m.lineCount, hudSell: (document.querySelector('#hud') || {}).textContent?.replace(/\\s+/g, ' ').slice(0, 80), toast: document.getElementById('toast').textContent, banners: [...document.querySelectorAll('.banner .msg')].map(b => b.textContent.slice(0, 80)) }; })()`); R.ingressErrs = errs.slice();
// (c) injection sinks with hostile strings in a takeoff file + library
await fresh(); R.xss = await ev(`(async () => { window.__xss = []; const P = (t) => '<img src=x onerror="window.__xss.push(&quot;' + t + '&quot;)">'; const d = JSON.parse(JSON.stringify(window.__demo));
  d.projectMeta = { name: 'Job ' + P('projectMeta.name'), client: P('client'), address: P('address'), phone: P('phone'), email: P('email'), notes: P('notes'), preparedBy: { company: P('preparedBy.company'), name: P('preparedBy.name'), license: P('license'), phone: P('pbphone'), email: P('pbemail') }, proposalNotes: P('proposalNotes') };
  d.conditions[0].name = 'Cond ' + P('condition.name'); d.conditions[0].csi = P('condition.csi'); d.conditions[0].notes = P('condition.notes'); d.conditions[0].location = P('condition.location'); d.conditions[0].wbs = P('condition.wbs'); d.conditions[0].tags = [P('tag')]; d.conditions[1].color = 'red" onmouseover="window.__xss.push(1)';
  d.measurements[0].notes = P('measurement.notes'); d.assemblyProject.general = [{ id: 'g1', label: P('general.label'), qty: 1, unit: P('general.unit'), unit_cost: 5, csi: P('general.csi'), note: P('general.note') }]; d.pdfName = P('pdfName'); d.schedule = { rows: { 1: { start: 0, dur: 3 } } };
  VESApp.loadFromData(d); await new Promise(r => setTimeout(r, 500)); const steps = []; const step = async (n, f) => { try { await f(); await new Promise(r => setTimeout(r, 60)); } catch (e) { steps.push(n + ': threw ' + String(e).slice(0, 140)); } }; const raf = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
  await step('cards', async () => { VESApp.renderCards(); await raf(); }); await step('assembly', () => { VESApp.renderAssembly(); VESApp.openAssemblies(); VESApp.closeAssemblies(); }); await step('recapTabs', () => { for (const t of ['materials','labor','equipment','exceptions','estimate','summary']) VESApp.setRecapTab(t); });
  await step('grid', async () => { VESApp.showEstimate(true); VESApp.renderEstimateGrid(); await raf(); VESApp.showEstimate(false); }); await step('schedule', async () => { VESApp.showSchedule(true); VESApp.renderSchedule(); await raf(); VESApp.showSchedule(false); }); await step('ledger', () => VESApp.renderLedger()); await step('hud', () => { VESApp.renderHud(); VESApp.renderInspector(); });
  await step('projModal', () => { VESApp.openProjModal(); }); await step('bid', () => printBidDoc()); await step('bid2', () => printBidDoc()); await step('cost', () => printCostSheet()); await step('proposal', async () => { window.__ph = await VESApp.proposalHTML(); }); await step('clientReview', () => { window.__cr = VESApp.clientReviewHTML(); });
  await step('activate', async () => { VESApp.activateCondition(VESApp.state.conditions[0]); await raf(); }); await step('depth', async () => { VESApp.state.editingCondId = VESApp.state.conditions[0].id; VESApp.renderCards(); await raf(); }); await step('sheetStrip', () => renderSheetStrip()); await step('cmd', () => { VESApp.openCmd(); VESApp.closeCmd(); }); await step('resume', async () => { VESApp.flushAutosave(); renderResumeList(); await raf(); });
  await step('csvs', () => { const save = window.saveBlob; window.__csv = []; window.saveBlob = (n, t) => window.__csv.push(n); VESApp.exportRollupCSV(); VESApp.exportAuditCSV(); VESApp.exportBOMCSV(); exportGridCSV(); window.saveBlob = save; });
  await new Promise(r => setTimeout(r, 400)); const rawIn = (h) => !!h && /<img src=x onerror=/.test(h);
  return { fired: window.__xss, steps, proposalRaw: rawIn(window.__ph), clientReviewRaw: rawIn(window.__cr), bidRaw: rawIn(document.getElementById('printDoc').innerHTML), bodyRaw: rawIn(document.body.innerHTML), inlineHandlerAttrs: [...document.querySelectorAll('[onmouseover],[onerror],[onclick]')].length, styleAttrWithQuote: [...document.querySelectorAll('[style]')].filter(e => /onmouseover/.test(e.getAttribute('style'))).length, csvs: window.__csv }; })()`); R.xssErrs = errs.slice();
await fresh(); R.xssLib = await ev(`(async () => { window.__xss = []; const P = (t) => '<img src=x onerror="window.__xss.push(&quot;' + t + '&quot;)">'; const lib = JSON.parse(JSON.stringify(VESApp.state.library)); const cid = Object.keys(lib.conditions)[0]; lib.conditions[cid].label = 'L ' + P('lib.condition.label'); const iid = Object.keys(lib.items)[0]; lib.items[iid].desc = P('lib.item.desc'); lib.items[iid].note = P('lib.item.note'); const aid = Object.keys(lib.assemblies)[0]; lib.assemblies[aid].label = P('lib.assembly.label');
  let r; try { r = VESApp.importLibraryObject(lib, [{ id: 'gg', label: P('gen.label'), qty: 1, unit: 'LS', unit_cost: 1 }], 'hostile.json'); } catch (e) { r = 'threw ' + e; } VESApp.loadAssembly(aid); VESApp.addManualQuantity(cid, 10); await new Promise(res => requestAnimationFrame(() => setTimeout(res, 150))); VESApp.renderAssembly(); VESApp.openAssemblies(); VESApp.renderRecap(); VESApp.showEstimate(true); VESApp.renderEstimateGrid(); VESApp.showEstimate(false); VESApp.openProjModal(); printBidDoc(); printBidDoc(); printCostSheet(); await new Promise(res => setTimeout(res, 400)); return { importResult: r && r.ok !== undefined ? r.ok : r, fired: window.__xss, libProvText: (document.getElementById('libProv') || {}).textContent }; })()`); R.xssLibErrs = errs.slice();
// (d) proposal with a DRAWN polygon on the grid → legend swatches → print with and without background graphics
await fresh(); R.proposalDrawn = await ev(`(async () => { const d = JSON.parse(JSON.stringify(window.__demo)); d.measurements = [{ id: 11, conditionId: 1, page: 1, type: 'area', points: [{x:20,y:20},{x:120,y:20},{x:120,y:90},{x:20,y:90}], value: 7000, notes: '', manual: false }, { id: 12, conditionId: 5, page: 1, type: 'linear', points: [{x:20,y:20},{x:120,y:20}], value: 100, notes: '', manual: false }]; d.projectMeta.preparedBy = { company: 'Synthetic Roofing Co', name: 'Sample Estimator' };
  VESApp.loadFromData(d); await new Promise(r => setTimeout(r, 600)); const h = await VESApp.proposalHTML(); window.__ph = h; const doc = new DOMParser().parseFromString(h, 'text/html'); return { hasSheet: hasSheet(), hasSnapshot: !!doc.querySelector('.pviz img'), snapshotFailed: !!doc.querySelector('.pviz-miss'), legend: [...doc.querySelectorAll('.lgi')].map(l => ({ text: l.textContent, sw: l.querySelector('.sw').style.background })), caption: (doc.querySelector('figcaption') || {}).textContent, scope: [...doc.querySelectorAll('section.scope li')].map(li => li.textContent.trim()), investment: (doc.querySelector('.big') || {}).textContent, toast: document.getElementById('toast').textContent }; })()`);
async function pdfColors(html, printBackground) { const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' }); const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const t = list.find((x) => x.id === targetId); const c2 = await connect(t.webSocketDebuggerUrl); await c2.send('Page.enable'); await c2.send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') }); await sleep(800);
  const { data } = await c2.send('Page.printToPDF', { printBackground, preferCSSPageSize: true }); const buf = Buffer.from(data, 'base64'); writeFileSync(join(OUT, `proposal-bg${printBackground ? 'on' : 'off'}.pdf`), buf); const txt = buf.toString('latin1'); const rg = new Set(); let m; const re = /stream\r?\n([\s\S]*?)endstream/g; let pages = (txt.match(/\/Type\s*\/Page[^s]/g) || []).length;
  while ((m = re.exec(txt)) !== null) { let dec; try { dec = inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch (_) { dec = m[1]; } for (const mm of dec.matchAll(/([0-9.]+) ([0-9.]+) ([0-9.]+) rg/g)) rg.add(mm.slice(1, 4).map((x) => (+x).toFixed(2)).join(',')); } c2.close(); await c.send('Target.closeTarget', { targetId }); return { bytes: buf.length, pages, fillColors: [...rg] }; }
const ph = await ev('window.__ph'); R.proposalPrint = { backgroundGraphicsOn: await pdfColors(ph, true), backgroundGraphicsOff_chromeDefault: await pdfColors(ph, false) };
// (e) autosave contents + (f) schedule + (g) negative margin typed into the OH input
await fresh(); R.autosaveAndMargins = await ev(`(async () => { const d = JSON.parse(JSON.stringify(window.__demo)); d.projectMeta.client = 'SYNTH-CLIENT-MARKER'; d.projectMeta.address = '1 Synthetic Way'; VESApp.loadFromData(d); await new Promise(r => setTimeout(r, 300)); VESApp.setProjectMeta({ ...VESApp.state.projectMeta, phone: '000-000-0000' }); markDirty(); await new Promise(r => setTimeout(r, 1300));
  const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); const slots = keys.map(k => ({ k, bytes: localStorage.getItem(k).length, hasClient: /SYNTH-CLIENT-MARKER/.test(localStorage.getItem(k)), hasAddress: /Synthetic Way/.test(localStorage.getItem(k)) }));
  VESApp.showSchedule(true); VESApp.renderSchedule(); await new Promise(r => setTimeout(r, 100)); const sched = { rows: document.querySelectorAll('#schedBody .sched-row').length, meta: (document.getElementById('sMeta') || {}).textContent }; VESApp.showSchedule(false);
  const oh = document.getElementById('ohPct'); const before = VESApp.recapModel().sell; oh.value = '-5'; oh.dispatchEvent(new Event('input', { bubbles: true })); oh.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 200));
  const after = VESApp.recapModel(); return { slots, sched, negMargin: { inputValue: oh.value, validity: oh.validity.valid, storedOverheadPct: VESApp.state.assemblyProject.settings.overheadPct, ladderOh: after.oh, sellBefore: before, sellAfter: after.sell, toast: document.getElementById('toast').textContent, cue: (document.getElementById('gridCue') || {}).textContent } }; })()`); R.autosaveErrs = errs.slice();
writeFileSync(join(OUT, 'probe3-report.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); c.close(); chrome.kill('SIGKILL');
```

## Appendix D — `probe2.mjs` (first-print identity gate, waste/qty override, D-26.4 row multiplication), sha256 `ab72b4f6bcf7e7277d54e0916e9d0152726762647eb031fbfdcb8fadbc3e034d`
```js
import { spawn } from 'node:child_process'; import { mkdtempSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const CHROME = process.env.VES_CHROME; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function connect(url) { return new Promise((resolve, reject) => { const ws = new WebSocket(url); let id = 0; const pending = new Map();
  ws.addEventListener('open', () => resolve({ send(m, p = {}) { return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }, close() { ws.close(); } }));
  ws.addEventListener('error', () => reject(new Error('ws'))); ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } }); }); }
const port = 9600 + Math.floor(Math.random() * 300); const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ves-p2-'))}`, '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 150 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {} if (!wsUrl) await sleep(100); }
const c = await connect(wsUrl); await c.send('Page.enable'); await c.send('Runtime.enable');
const ev = async (expr) => { const { result, exceptionDetails } = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text); return result.value; };
await c.send('Page.navigate', { url: 'file://' + process.argv[2] }); for (let i = 0; i < 200; i++) { try { if (await ev('document.readyState==="complete" && !!window.VESApp')) break; } catch (_) {} await sleep(100); }
const demo = readFileSync(process.argv[3], 'utf8');
const out = await ev(`(async () => { const App = VESApp; window.print = () => { window.__printed = (window.__printed||0)+1; }; App.loadFromData(${demo}); await new Promise(r => setTimeout(r, 400));
  const o = {};
  printBidDoc(); o.firstBid = { projModalOpen: document.getElementById('projModal').classList.contains('open'), printDocText: document.getElementById('printDoc').textContent.trim().slice(0, 160), printed: window.__printed || 0, toast: document.getElementById('toast').textContent };
  App.closeProjModal && App.closeProjModal(); document.getElementById('projModal').classList.remove('open');
  printBidDoc(); o.secondBid = { rows: document.querySelectorAll('#printDoc .divblock tbody tr').length, printed: window.__printed || 0 };
  const res = App.resolveAssembly(); const tgt = res.lines.find(l => l.item === 'tpo.membrane');
  o.membraneBefore = { qtyNeeded: tgt.qtyNeeded, ordered: tgt.ordered, waste: tgt.itemWaste, coverage: tgt.coverage };
  editLine('tpo.membrane', 'waste', 0.15); const t2 = App.resolveAssembly().lines.find(l => l.item === 'tpo.membrane');
  o.membraneAfterWaste15 = { qtyNeeded: t2.qtyNeeded, ordered: t2.ordered, waste: t2.itemWaste, override: App.state.assemblyProject.lineOverrides['tpo.membrane'] };
  editLine('tpo.membrane', 'waste', 0.30); const t3 = App.resolveAssembly().lines.find(l => l.item === 'tpo.membrane'); o.membraneAfterWaste30 = { ordered: t3.ordered, waste: t3.itemWaste };
  // bid row for the membrane after waste 30%: does Qty x Unit reproduce Amount (D-26.4)?
  printBidDoc(); const tr = [...document.querySelectorAll('#printDoc .divblock tbody tr')].find(r => /^TPO Membrane$/i.test(r.children[1].textContent.trim())); const td = [...tr.children].map(x => x.textContent.trim()); o.membraneBidRow = td; const num = s => +s.replace(/[$,]/g,''); o.membraneRowMultiplies = Math.abs(num(td[3]) * num(td[5]) - num(td[6])) < 0.01 * num(td[3]) + 0.01;
  // undo depth: how many undos to get back, and what does the journal call them
  o.journal = App.state.journal.undo.map(j => j.label);
  // exact quantity override then the bid says "measured scope" or the override?
  editLine('tpo.membrane', 'qty', 7); printBidDoc(); const tr2 = [...document.querySelectorAll('#printDoc .divblock tbody tr')].find(r => /^TPO Membrane$/i.test(r.children[1].textContent.trim())); o.membraneBidRowAfterQtyOv = [...tr2.children].map(x => x.textContent.trim());
  o.gridRowAfterQtyOv = (() => { App.showEstimate(true); App.renderEstimateGrid(); const r = [...document.querySelectorAll('#estgridBody tr')].find(tr => /TPO Membrane/i.test(tr.textContent)); const inputs = r ? [...r.querySelectorAll('input')].map(i => ({ f: i.dataset.field, v: i.value, ov: i.classList.contains('ov') })) : null; App.showEstimate(false); return inputs; })();
  return o; })()`);
console.log(JSON.stringify(out, null, 1)); c.close(); chrome.kill('SIGKILL');
```
