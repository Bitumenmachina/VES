# FIELD_LANE — charter for measuring in the field (roofing today, interiors next)

Owner-approved in principle 2026-09-01 from the mobile feasibility memo; revised the same day on Patrick's
correction that roofing is one portion of VES and interior takeoff is coming. Nothing in this charter is built.
Each item lands as its own batch: red-first probe under `tools/sweep/`, G0 absolute, verifier PASS, docs updated.

## 1 · The premise, restated for two trades
The engine prices any measured quantity against a library assembly; it does not know or care whether the
condition is a roof eave in LF or a bedroom wall in SF. What differs by trade is **where the number comes from
in the field** and **how the phone is involved**:

| trade | field source of the number | the phone's role | comparable practice |
|---|---|---|---|
| roofing / envelope | aerial report (Roofr $13–19, EagleView $15–87, RoofSnap), laser/tape, walk-around photos (Hover) | receives numbers, checks the plan, types what the report lacks | nobody traces a roof plan on a phone |
| interiors (coming) | LiDAR room scan (iPhone Pro / iPad Pro: RoomPlan, magicplan, Canvas, Polycam; 1–5 cm), laser, tape | **is the measuring instrument** — the scan happens on it | room scan → floor plan → areas/perimeters is the interior norm |

So the earlier line "LiDAR apps are interior tools, not roof takeoff" was a boundary, not a dismissal: for the
interior lane the phone is where measurement happens, and the field format has to accept a room scan as
naturally as it accepts a roof report. That moves the **import door** to the front of the queue — it is the one
item that serves both trades and it is file-only (zero egress by construction).

## 2 · Items, in build order

### F-2 · Import door: reports and room scans become typed quantities
- **What:** a mapping layer from an external measurement file to library conditions. Sources, in order of
  reach: (a) roof reports — CSV/XML line items (ridge LF, eave LF, valley LF, hip LF, rake LF, area SF by
  pitch, penetrations EA); (b) room-scan exports — per-room floor SF, ceiling SF, wall SF net of openings,
  perimeter LF, doors/windows EA (magicplan CSV/XLSX, Apple RoomPlan JSON, Canvas/Polycam exports; exact
  schemas to be pinned from real export files, synthetic samples in `release/demo/`); (c) a plain CSV
  `condition,quantity,unit,room,note` for tape-and-laser work and for the laser apps' own exports on iOS.
- **How it lands in the engine:** every imported quantity is a manual measurement (`manual: true`, `points: []`,
  `page: null`) through the existing `addManualQuantity` door — MATCHED/OBS, journaled at the caller like the
  entry row (D-25.2a), pitch applied by the engine exactly as for a trace. A new `source` field on the
  measurement (`report:<file>`, `scan:<file>`, `field:typed`, `laser`) rides into the audit CSV's provenance.
  The mapping (report line name → libRef) is saved with the library, not the takeoff, so it is reused per trade.
- **Interior specifics:** `location` on the condition is the room. One condition per (scope, room) is the
  engine-honest shape (the engine sums measurements per condition; a per-room proposal needs per-room
  conditions). The importer creates conditions per room from a template row when the mapping says so.
- **Invariants:** zero egress (file input only); G0 unchanged (the door already exists); nothing priced at $0
  silently — an unmapped report line is listed in the load banner, never dropped quietly.
- **Probe:** synthetic report CSV + synthetic room-scan JSON → recap sell equals the hand-typed equivalent to the
  cent; audit CSV carries the source; unmapped rows named in the banner. RED on F18.59 by construction.

### F-1 · Field lens
- **What:** a fourth lens beside Plan / Estimate / Schedule, chosen automatically under 720 px on a coarse
  pointer and available on any screen: the condition list grouped by room/assembly, big rows, a numeric keypad
  into the typed-quantity door, a note per condition, and an as-built status in three words (matches plan ·
  differs · not on plan). Sell/recap strip stays at the bottom. No new pricing surface: the lens reads
  `recapModel()` and writes through `addManualQuantity` / `setLineOmit` only.
- **Invariants:** every write journaled and named; typed quantities OBS; the L-05 single-intent grammar (no
  silent keystroke sinks — D-24.8 lesson); no canvas needed, so nothing about rasters or caps.
- **Probe:** phone profile: keypad entry lands as a measurement with `source: field:typed`, Ctrl+Z (or the
  lens's Undo) takes it back by name; status and note survive save→reload (G0 scenario-C style).

### F-3 · Field delta
- **What:** Save exports a small JSON of field-sourced measurements, notes and as-built status only; Open at the
  desk merges by appending (the door's existing semantics), lists what was appended, and never overwrites a
  desk measurement. Shared through the OS share sheet where available (`navigator.share` with files — https
  only; on `file://` it falls back to the existing download). The verifier's egress list gains `navigator.share`
  as a ruled baseline entry so the decision is on record: a device share sheet is not a network call by the app.
- **Probe:** desk takeoff + field delta → merged sell equals desk + field lines; a second import of the same
  delta is refused as a duplicate (by measurement id + source).

### F-4 · Plan as a reference sheet on the phone (partly landed in Batch V)
- Landed: rail rests collapsed under 720 px; coarse-pointer targets; 16 MP raster cap; exports menu fits.
- Remaining: **jump-to-condition** (frame a condition's measurements with the legend, one tap from the Field
  lens); **touch pinch** through the existing `gestureZoom` (CSS transform until settle, one raster) — today the
  gesture path is wheel-driven; **recap panel at short viewport heights** (C-N1 class; needs the local probe
  stack, held).
- Tap tracing stays a sanity check (about 1 ft per tap at fit), never a bid basis; the lens says so.

### F-5 · Laser input
- Android/Chrome: Web Bluetooth to a DISTO/Bosch meter feeding the keypad (DISTO D2's BLE characteristic is
  readable by open code). iOS: no Web Bluetooth (Apple has said it will not ship it) — the meter app's export
  goes through F-2's plain CSV. `navigator.bluetooth` joins the egress baseline as a ruled entry if built.

### F-6 · Private hosted copy (ruling, not a build)
- The only phone route today is the public Pages URL (sweep F-01). Options: Pages on a private repo (paid
  plan), the laptop serving over a hotspot (the app's own banner already suggests it), or nothing hosted and the
  file carried on the device (Android proven; iOS Quick Look unverified).

## 3 · What each item must not change
- G0 goldens; the sell ladder; the one-collection money model (`collectPricedLines`).
- Zero egress: device APIs (share sheet, Bluetooth) are ruled in explicitly or not used.
- Provenance: field numbers are OBS and say where they came from; no number is silently rounded, coerced or dropped.
- Single file, no build step, no dependency.

## 4 · Evidence each item ships with
Red-first probe output, G0 GREEN, verifier PASS with the egress delta named, updated CLAUDE.md identity and
NOTES.md state, and — for anything on a phone — a screenshot at 390 px plus the same run on a tablet profile.
Real-device evidence (an iPhone scan import, a laser paired on Android) is Patrick's to produce; the charter
names it as the falsifier for F-2 and F-5 rather than assuming it.
