# VES — Visual Estimating Substrate

A construction estimating application in **one HTML file**: plan takeoff (PDF sheets, scale
calibration, traced measurement), condition-based pricing, assemblies, margins/OH ladder, and
client documents (bid, proposal, cost sheet) — no build step, no package manager, no runtime
network egress. Open the file in a browser; that is the whole install.

**The product is `src/VES_PM.html`** (build F18.55). The repo around it is evidence and
verification, not tooling the file needs.

## Verify (any seat, including CI)

    node tools/ves-verify.mjs

Exit 0 = pass. Checks: per-`<script>` syntax (`node --check`), egress pattern set vs the
committed baseline, sentinel-region freeze (none currently), and file identity (size + sha256).
`.github/workflows/verify.yml` runs the same script on every push and PR; read the job summary,
not the badge. `bash test/selftest.sh` proves the verifier's exit-code contract (10 checks).

## Engine gate (local seat only — needs headless Chrome)

    node gate/g0.mjs check src/VES_PM.html

Drives the app's own functions over CDP and diffs money output byte-for-byte against ratified
goldens (`gate/README.md` has the contract). Cloud sessions have no browser binary; the gate
runs on the local seat.

## Working here

- `CLAUDE.md` — seat rules and invariants. Read first.
- `NOTES.md` — current build state, the work queue, and carried lessons. This is the pickup
  document for any new session.
- `release/demo/demo-flat-roof.json` — synthetic demo takeoff. All fixtures here are synthetic;
  client-identifiable material never enters this repo.
- Deep QA archives (probe evidence, defect ledger, fixtures) live on the owner's local seat,
  off this branch.

## License

Proprietary; all rights reserved. Source is public for verification and owner-authorized
collaboration — see `LICENSE`.
