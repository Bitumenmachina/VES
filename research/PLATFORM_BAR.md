# PLATFORM_BAR — what a functioning estimating platform does, researched (2026-08-24, W2 Phase 1)

Written under the standing GTM delegation before the W2 Batch B design was allowed to land.
Every bar row is phrased as an ARTIFACT OUTCOME (the D1 lesson: "mechanism exists" ≠ "the paper
is right"). Zero client data left the machine for this research.

## 1 · The client bid / proposal (drives W2-02/03/04 → D-24.2)

What professional practice puts on client paper (bidproposaltemplate.com/templates/roofing ·
allthingsconstructionpm.com/construction-bid-example · federalestimating.com/blog/how-to-write-
bid-proposal-for-construction-projects · conwize.io on exclusions · smartsheet.com bid templates):

- **Identity first**: contractor name/license/contact + client + project + date. A blank
  "Contractor: ____" line on a rendered bid is a defect, not a feature.
- **Referenced documents**: plan set + sheet refs (VES already carries Sheet — keep).
- **Scope of work**, stated; **inclusions/exclusions as a named section** — an excluded item is
  named in words ("Deck repair not included"), never leaked as internal status jargon
  ("NO_MATCH: placeholder price").
- **Price presentation**: line items with extended amounts build trust in residential work
  (truebiddata.com, mastt.com on unit-price transparency); lump-sum-by-scope protects against
  line-item shopping (sjcivil.com, universeestimating.com). Either way, ONE rule is universal:
  **the client sees SELL prices only. Cost, overhead, markup, and profit columns are internal
  and never print on client paper** — even unit-price contracts show unit SELL, not the margin
  split. (His F18.41 bid printed Cost/Markup/Profit = $0.00 per line: internals on client paper
  AND an implied zero-margin story. Both wrong.)
- **Terms**: validity/expiration ("valid 30 days"), deposit/payment terms, and an acceptance
  signature block — the proposal often becomes the contract (allthingsconstructionpm).
- Zero-quantity lines are noise on client paper; they live on internal sheets.

## 2 · The estimate grid (drives W2-05/06 → Batch C)

The Excel bar, from data-grid practice (pencilandpaper.io enterprise-table patterns ·
uxdworld.com inline-editing ×2 · eleken.co table-design UX):

- **Display formatted, edit raw**: cells show `$1,506.00` / `1,204.5`; activation reveals the
  raw value ready to type over; commit re-formats.
- **Activation grammar**: click into the cell = caret + selected value; type-over replaces;
  Enter commits and walks down; Tab commits and walks across (VES has this — L-21); Esc
  reverts; blur commits. Hover shows a text cursor on editable cells.
- **Locked cells are communicated, never silent**: an engine-driven value the user cannot edit
  shows dimmed + a lock affordance + WHY on hover ("engine-priced — edit the library item / the
  measurement"), and rejects input loudly, not silently.
- **Errors stay in the cell**: invalid input flags at the cell, value not clobbered.
- **Spinners are not a data-entry affordance** at compact sizes (the W2-08 lesson; a 502-unit
  qty is typed, not clicked 502 times).
- Delete-row is visible per row and severed from browse actions (the L-06 33px rule extends to
  the grid).

## 3 · The buyer's check (drives P-BUYER charter)

What buyers actually evaluate (beck-technology.com complete guide · getclue.com top-13 ·
conest.com how-to-choose · webuildcs.com selection · impactbuying.com + mitratech.com vendor
due-diligence frameworks):

- **Workflow fit over feature count** — the recorded regret pattern is buying features; buyers
  test against their own project mix. VES must demo ITS lane (single-file local takeoff →
  priced bid) in minutes, not claim breadth.
- **Time-to-first-bid is measured** during evaluation: cold open → priced, printed bid without
  help = the P-FRESH pass, and the README's claim must survive it.
- **Data safety story stated, not implied**: where data lives, what leaves the machine (VES:
  nothing — file://, zero egress, no account), backup story (takeoff JSON files the user owns).
  Buyers look for certifications on cloud products; local-first sidesteps the entire category —
  SAY SO on the landing/README.
- **Auditability**: who measured what, when, from which sheet, at what calibration — the Audit
  CSV + provenance line is a differentiator; it must stay client-clean and complete.
- **Versioning/support**: stamped builds, release notes beside the file, a README a stranger
  can run from. TCO frame vs the market: GTM_BAR.md market table (PlanSwift $1,749 one-time is
  the comp; cloud seats run $2.2–3K/user/yr).

## Bar rows added to GTM_BAR.md (v2, artifact-outcome phrased)

B5–B8 + C4–C5 + D4 — see GTM_BAR.md. The wave is not done while any is unmet.

## Sources
bidproposaltemplate.com/templates/roofing · localcommercialroofing.org/guides/how-to-read-a-
commercial-roofing-proposal · allthingsconstructionpm.com/construction-bid-example ·
federalestimating.com/blog/how-to-write-bid-proposal-for-construction-projects ·
smartsheet.com/content/construction-bid-templates-and-forms · conwize.io/glossary/exclusions ·
mastt.com/blogs/unit-price-contract · truebiddata.com/blog/unit-price-estimating-construction ·
sjcivil.com/whats-the-difference-between-unit-price-and-lump-sum-bids ·
universeestimating.com/lump-sum-vs-unit-price-contracts · procore.com/library/unit-price-contracts ·
pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables ·
uxdworld.com/inline-editing-in-tables-design · uxdworld.com/inline-editing-and-validation-in-tables ·
eleken.co/blog-posts/table-design-ux · beck-technology.com/blog/complete-guide-construction-
estimating-software · getclue.com/blog/top-construction-estimating-software ·
conest.com/how-to-choose-electrical-estimating-software-in-2026 ·
webuildcs.com/blog/how-to-select-the-best-construction-software-for-you-in-2026 ·
impactbuying.com/software-vendor-due-diligence-checklist · mitratech.com/resource-hub/blog/vendor-due-diligence
