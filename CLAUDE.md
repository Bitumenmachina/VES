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

Current build state, work queue, and carried lessons: `NOTES.md` — read it before working.

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

## Identity (from bytes, 2026-09-01, cloud seat, branch claude/ves-live-repo-sweep-x202rq)
- canonical file: src/VES_PM.html
- build: F18.59 (Batch V — owner-approved sweep + mobile-feasibility items; U2 file-door typing, freeze fences, scrub)
- bytes: 3522442
- sha256: 9612e4610ddeae6f034384d6937e3068bc3c7551824c0479c8e9ba78bada7ffb
- priors: F18.58 = Batch T (f785eea7…) · F18.57 = Batch S (6eb480bc…) · F18.56 = Batch R (ffde5caa…) · F18.55 (retired tag) · first public root 8313a26 (retired).
- history: the public line was restarted from a fresh root on 2026-09-01 (Patrick's ruling after the C3 scrub); the
  F18.55–F18.58 commits and the `f18.55` tag are no longer on the remote. The full line lives on the owner seat only.
- freeze: VESCore + VESASM are fenced (`/* VES:FREEZE core|engine */`). The manifest is NOT written — only Patrick runs
  `node tools/ves-verify.mjs --write-manifest`, on a build he accepts; until then FREEZE reports "manifest absent" and gates nothing.
