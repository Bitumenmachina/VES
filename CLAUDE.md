# VES — working rules for any seat cloned into this repo

Single-file HTML application. No build step, no package manager, no runtime dependency, zero
runtime egress. The file is the product; the repo state is the evidence.

## Invariants
- Zero runtime egress in the shipped file. Nothing here adds a CDN, fetch, script src, or build step.
- No client-identifiable material in this repo, ever: takeoff JSON, job PDFs, job screenshots,
  named-project CSVs, project-bound pricing. Synthetic fixtures only. The repo is public.
- One canonical file, inside this worktree. No second writable copy.
- Public docs in this repo name no clients, no projects, no addresses, no job dollar figures —
  synthetic aliases only. The deep registers live locally, off this branch.
- Acceptance is Patrick's word alone. Machine output is evidence; it gates nothing by itself.
- Read bytes or say you did not. No projected paths, sizes, hashes, or contents.

## Verification (run it yourself, paste the full output)
    node tools/ves-verify.mjs
Exit 0 passes. Exit 1 lists findings, one per line. The Stop hook in .claude/settings.json runs
the same script and will not let a turn end on a failure. The GitHub workflow runs it again on
every push, outside this VM — that run is the one Patrick reads.
Never run --write-baseline or --write-manifest. Those record current bytes as accepted; only
Patrick decides that.

## Evidence Patrick accepts
Hashes, byte counts, exit codes, raw tool output, the file booting in his browser.
Not accepted: summaries of output, characterized severity, "done", a green badge standing in
for output he has not seen.

## Identity (filled from bytes 2026-08-31 by the local seat)
- canonical file: src/VES_PM.html
- bytes: 3455798
- sha256: 2ffd7d2ee255708b8b9b06a89c6c1bdd1cec20105713a60361713b1042c54a09
- baseline tag: f18.22b (root baseline, commit 0b0bc88). Current src is the F18.55 line at
  commit b112108, untagged as of this fill.
