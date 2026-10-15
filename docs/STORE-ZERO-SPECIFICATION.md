# Store Zero specification — adopted manufacturing core

This is the operative protocol 2 specification. The preceding specification remains available at the [immutable source revision](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/migration/previous-specification.md). Historical Project 1 artifacts and differential recordings remain evidence of their original calculations; they are not runtime authorities for this release.

# 1. Authority and input

Machine functions are registered before the customer arrives. System derives customer job meaning, component geometry, required operations/values, feature identity, independent manifest and revision. Store resolves material, supported capability, the manufacturing plan, occupied time and Q. The compilation chain absorbs job-specific programming through these identified stages; it neither invents missing requirements nor creates another project geometry authority.

Job requests have exactly `requestType`, `requestId`, `demand`, and `manifest`. Protocol is **STORE-ZERO-REQUEST-2**. Definition conversion identifiers remain USER_DEFINED_BOARD_V1, CUT_PACKAGE_V1 and SHEET_PACKAGE_V1. These identify input shapes; all three compile into STORE-MANUFACTURING-JOB-1 and call one engine. OFFERING_LOOKUP is discovery, has no manifest and issues no quotation receipt.

Manifest fields are jobId, revision, boardPartIds, sheetPackageIds, featureIds, items (lineId and integer qty), and optional unresolvedRequirements. Manifest identity and exact component/feature/item coverage must match the complete job. Unresolved requirements block a complete Q. The request boundary checks exact types and rejects unknown fields, machine-local language, old answers and receipts.

Angled packages must state parallel ends, long-long-outer-edge length datum and miter-face plane. A centered spot cannot also declare an edge inset or a noncentered coordinate. Unknown or unmodeled requirements are named refusals. No missing angle becomes square; no missing amount becomes zero.

# 2. Catalog and material selection

The owner-directed `D001-STOCKED-WOOD-MILLING-2026-10-13` declaration offers longitudinal milling on every offered board species and grade whose actual section lies within the registered router stock envelope. This is a declared machine model, not commissioned cutting evidence. Species does not create a separate evaluator or a hidden exception. Finished geometry, operation representation, tooling, retained control and available inventory remain mandatory gates. This revision adds no stock, changes no price and offers no new unmodeled operation.

A mixed-length group retains a parent SKU when it can produce at least one required part. Each selected parent pattern must still produce all assigned parts and features. A length-only optimistic capacity bound can prove `ON_HAND_SHORT`; its reported required parts and available capacity explain a shortage but cannot establish feasibility or a Q. The complete cumulative-inventory search governs every successful answer.

`src/evaluation/catalog.mjs` reads and validates `data/store-zero-catalog.json` and `data/sources/store-zero-observations.json`. Catalog offered/onHand/allocated values, species/grade, actual dimensions, compatible cells/operations, current selling prices and hardware packaging are the Store's declared inputs. Contradictory catalog values stop evaluation.

The core searches complete feasible parent-stock plans with cumulative shared inventory, mixed lengths and reused compatible setup state. It minimizes unrounded material, hardware, hourly service and separately billed cut cost within the declared plan space. At final whole-job boundaries it rounds hourly service to cents, then rounds their combined Q; independently rounded parent contributions are not the total authority. A bounded feasible search explicitly reports that it did not establish the optimum. No complete plan means a named refusal/unresolved result with Q and totals absent.

Returned parents/packages expose the selected stock and the same evaluated operation ledger, including per-parent contribution amounts. Individually rounded contributions can differ from the rounded whole by cents; only whole-job totals.Q is the complete Q. A selected parent is a modeled selection, not a reservation, allocation or physical readiness record.

# 3. Manufacturing model

`src/evaluation/engine/store-manufacturing-core.mjs` is the sole Store manufacturing-geometry conversion, stock planner, operation sequencer, occupied-time and Q authority. System's component geometry remains controlling. Store conversion produces the internal neutral job; its evaluated `operations` already contain nominal station-specific moves. `data/machine/manufacturing-core-0.1.json` and `src/machine/configuration.mjs` register and validate the model. Caller-supplied alternate configurations are refused.

The D-001 longitudinal router diameter is **1 in**, axial pass depth **0.75 in**, and feed **48 in/min**. S-001 has its own **0.5 in** cutter and axial pass depth. These are declared model values, not commissioned measurements. The economics model declares $120,000 annual costs, 600 productive hours and 20% gross margin, giving $250/hour. Panel saw cuts occupy modeled time but use the explicitly separate $10/cut charge, without also adding those seconds to hourly service.

Each operation states kind, subject, parent, cell, category, billing basis, seconds, sequence, start and end. Occupancy is serial and returned whole-job time is the sum of this same ledger. MOVE durations use declared acceleration and velocity; cutting feed is explicit. Geometry checks cover kerf, face datums, retained control, tool engagement, milling passes, inset/centered spots, sheet apertures/splits/tabs and returned pieces.

All timing is modeled. Full width saw stroke, rim-cut allowance, nominal datum capture, stock-control evidence and sheet tab strength retain explicit physical gaps. A mathematical quote never establishes machine commissioning or physical production authority.

# 4. Fresh receipts and accepted packets

`src/requests/store-request.mjs` evaluates every job afresh and issues the sole receipt. Its receipt binds demandHash, manifestHash, status, request identity, time, Store release, catalog hash, model and machine configuration hashes and calculation identity. A clock and receipt live at this boundary, outside the engine.

Accepted packet schema is **STB-ACCEPTED-JOB-PACKET-2**. It carries the exact manifest and demand, the complete Store answer, System requirements, an identified SIMULATED accepted customer decision, and physicalRelease false. `src/contracts/job-packet.mjs` verifies exact shape, receipt hashes, identity and temporal ordering, then independently requotes using current catalog/model. Forged or inconsistent packets are REFUSED. An intact packet whose current answer changed is STALE and requires a new quotation. Old packet or saved-record versions are not silently reinterpreted.

# 5. Machine evidence and Railway transport

Existing HTTP paths remain `/health`, `/v1/requests` and `/v1/machine-evidence`. `/v1/commercial-events` adds a bounded SIMULATED source-evidence gate that revalidates the submitted chain, applies one event and returns derived state; it invokes no external commercial action. The service reports its deployed git release and a digest over the exact package/src/data bytes. A STORE_ZERO_RELEASE label that contradicts RAILWAY_GIT_COMMIT_SHA stops startup. Railway service IDs, domains, project and environment remain the existing connections.

Machine evidence protocol is **STORE-ZERO-MACHINE-EVIDENCE-2**. The chain is **accepted job → verified Store plan → registered machine configuration → lowering → virtual instructions and replay**. `src/machine/evidence.mjs` checks the expected configuration and packet; `src/machine/lowering.mjs` binds its exact accepted parents, operations and time rather than replanning. Local schemas are `STB-LOCAL-MANUFACTURING-JOB-1` and `STB-MODELED-OPERATIONS-1`; `src/contracts/machine-records.mjs` validates their binding and ledger shape. `src/machine/virtual-run.mjs` replays nominal dimensional moves, durations and tool states, stopping for altered records, invalid position, tool-down indexing or inconsistent completion. Evidence class is `PREDICTED_OCCUPANCY_ONLY`.

All three manufacturing definition classes can request modeled evidence. Sheet records describe evaluated path/tab/handling occupancy; they do not supply a complete independently replayed XY controller trajectory. Both current Job 1 settings have 51 ledger records and 22 modeled move events; the original 45-command Project 1 controller-oriented reference remains a separate historical representation. Physical admission is always BLOCKED, physicalAuthority false and permitted physical motionCommands zero. The current service invokes no physical controller.

# 6. Commercial and fulfillment sequence

The [commercial sequence design map](https://github.com/GeorgePlattDemo/new-system/blob/main/docs/commercial-sequence-template.md) is owned by System and is the same text formerly duplicated here. Its executable gate is `src/contracts/commercial-sequence.js`, byte-identical to System's public/live/stb-commercial-sequence.js. This module records identified source evidence and derives transaction state; it performs no payment, reservation, notification or machine side effects. Only SIMULATED sources are currently installed; ACTUAL source records are refused.

C01 attaches a complete manifest-bound Store answer. C02 requires an identified seller, location, exact offer/version/amount/currency/terms/expiry/fulfillment and explicit policy. C03 records the customer's decision only. Seller order acceptance, financial events, reservation/capacity, queue confirmation and production release are separate records with prerequisites and causal references. Seller extras remain explicit included/separate/waived/unresolved/outside-scope dispositions; Q is not silently repriced into a final commercial total.

Material allocation identifies exact parents/lots/conditions/locations atomically. Issue, release, local plan, readiness/admission, execution, inspection, staging, ready notice, custody and closeout have distinct records. Cancellation, shortage, failure and nonconformance hold progression for identified disposition. Same key plus identical content returns the existing event; changed key content, foreign revisions, stale sequence and missing source evidence are refused. Hash links detect changes but are not actor authentication.

System's existing terms view consumes this gate. Missing seller policy or offer remains pending. Customer acceptance cannot manufacture payment or queue evidence. The removed run-all yard button no longer marks allocation, release, cutting, inspection or custody complete. Existing project design, imagery and six-step navigation remain.

# 9. Safety setup validation and operating authority

A future machine-instruction export must extend the existing verified lowering layer: **accepted job → verified Store plan → registered configuration → lowering layer → controller instructions**. Preserve demand/manifest, receipt/calculation, parent/SKU, component/feature, configuration/mapping version and source-operation identity. Map only registered tooling, axes, units, datum transforms and controller parameters; refuse or report unresolved mappings rather than supplying defaults or dropping work. No exported operation may redesign the component, substitute stock, replace the plan, issue another Q or grant release. Current linear C is a workpiece-reference coordinate, not a conventional rotary G-code C axis.

Physical authority remains blocked pending commissioning, local material/readiness admission and appropriate source adapters. Tool-clearance and clamp-time allowances do not establish sensed physical states. Generated reference data, compiled controller code and executed/inspected results retain distinct evidence status. **NO BLOOD ON WOOD.**

# 15. Commissioning and evidence plan

Preserved records include `acceptance/project-1/from-evidence/`, `acceptance/fixtures/`, `acceptance/differential/pin-9c62d9d-answers.jsonl.gz`, `docs/project-1-digital-trail/` and `docs/patents/`. Historical patent and publication byte identities are checked unchanged. The supplied 22 independent self-checks are in `tests/core-self-checks.mjs`, executed by `tests/manufacturing-core.test.mjs`.

`acceptance/differential/core-replay-baseline.json` explicitly classifies every 1,786 historical recording: 844 public job inputs replay against the new declared model, with no guessed missing facts, and 942 retired internal-export cases are classified as retired. `scripts/build-migration-audit.mjs` reproduces this NEW baseline; it does not claim equality with the old engine. Protocol, forged/stale packets, occupancy faults, catalog rules, independent Q reconciliation, current HTTP transport, exact examples, source digest and commercial prerequisites have current tests.

# 20.2. One authority per decision

One catalog, one manufacturing planner/time/Q, one receipt, one accepted-packet verifier, one lowering path and one shared commercial gate. The removed engine/evaluator/envelope modules and their implementation-specific tests are recorded in the [immutable prior-path register](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/migration/retired-paths.json). The historical test data remain immutable. No parallel legacy evaluation path is retained.

# 23. The Store membrane and commercial sovereignty

A manufacturing answer, seller offer, customer decision, seller order, financial event, reservation, allocation, production release and custody transfer are separate decisions. System owns the complete definition and manifest; Store owns the model and manufacturing answer. Source actors own their commercial or local events. Missing evidence remains pending and cannot be camouflaged as completed work.

# Appendix C. Module index

- `src/contracts/commercial-sequence.js`
- `src/contracts/definitions.mjs`
- `src/contracts/job-packet.mjs`
- `src/contracts/machine-records.mjs`
- `src/contracts/shape.mjs`
- `src/evaluation/catalog.mjs`
- `src/evaluation/engine/store-manufacturing-core.mjs`
- `src/machine/configuration.mjs`
- `src/machine/evidence.mjs`
- `src/machine/lowering.mjs`
- `src/machine/virtual-run.mjs`
- `src/requests/commercial-request.mjs`
- `src/requests/offering-lookup.mjs`
- `src/requests/store-request.mjs`
- `src/service/server.mjs`

# Appendix D. Executable examples

Regenerate protocol requests, accepted/refused packets and machine evidence with `npm run build:examples`. `scripts/build-contract-examples.mjs` authors explicit test manifests; it is not a runtime authority. Acceptance checks that the committed examples exactly match current executable output.
