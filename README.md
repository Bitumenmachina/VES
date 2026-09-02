# VES — Visual Estimating Substrate

A construction estimating application in **one HTML file**: plan takeoff (PDF sheets, scale
calibration, traced measurement), condition-based pricing, assemblies, margins/OH ladder, and
client documents (bid, proposal, cost sheet) — no build step, no package manager, no runtime
network egress. Open the file in a browser; that is the whole install. **No seat fee, no report fee, no
device limit, no login** — copy the file to any machine and it works there.

**The product is `src/VES_PM.html`** — the build stamp in the app's own chrome (`VES_BUILD`, shown in the
corner) is the authority; `CLAUDE.md` §Identity carries the current hash. The repo around it
is evidence and verification, not tooling the file needs.

## Verify (any seat, including CI)

    node tools/ves-verify.mjs

Exit 0 = pass. Checks: per-`<script>` syntax (`node --check`), egress pattern set vs the
committed baseline, sentinel-region freeze (two regions, `core` and `engine`; the manifest is written only by
Patrick), and file identity (size + sha256).
`.github/workflows/verify.yml` runs the same script on every push and PR; read the job summary,
not the badge. `bash test/selftest.sh` proves the verifier's exit-code contract (10 checks).

## Engine gate (needs a headless Chrome or Chromium)

    VES_CHROME=google-chrome node gate/g0.mjs check src/VES_PM.html

Drives the app's own functions over CDP and diffs money output byte-for-byte against ratified
goldens (`gate/README.md` has the contract). It runs anywhere a Chromium exists — Claude cloud sessions
(`VES_CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome`), a laptop, and on every push as the `gate`
job of `.github/workflows/verify.yml`; the `probes` job runs the batch gate `tools/sweep/probe-v.mjs` the same
way. Read the job summaries alongside `verify`.

## Working here

- `CLAUDE.md` — seat rules and invariants. Read first.
- `NOTES.md` — current build state, the work queue, and carried lessons. This is the pickup
  document for any new session.
- `release/demo/demo-flat-roof.json` — synthetic demo takeoff. All fixtures here are synthetic;
  client-identifiable material never enters this repo.
- `LEDGER.md` — rulings by ID and the open-items register. `tools/sweep/` — the probes and the synthetic-plan
  generator. There is no local seat: this repository is the whole record.

## License

Proprietary; all rights reserved. Source is public for verification and owner-authorized
collaboration — see `LICENSE`.
