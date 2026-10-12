# Store Zero — Complete Technical, Manufacturing and Operational Reference

3D Solutions LLC · 12 October 2026

Store Zero connects a customer's defined woodwork to the material and processing a particular yard can supply. The customer changes dimensions, material and identified features in System. System preserves that definition, identifies every required component and feature, and sends one complete manufacturing inquiry. Store evaluates it afresh against its own catalog, available quantities, registered processing model and economics. Its answer supplies selected parents, required operations, modeled occupied time, budgetary total Q, or the reasons the whole job cannot be supported.

The architecture joins **a bounded, pre-registered machine configuration to the customer's definition**. Project geometry is resolved in the definition; machine geometry, tools, permitted operations, feeds and constraints are registered separately. Software combines those identified facts. For supported work, a designer need not redraw the parts or prepare a separate CAD/CAM program for each order. The specialist work belongs in engineering, registering, validating and maintaining the reusable mappings. A new material, tool, geometry or operation must satisfy those mappings before it becomes an admitted capability.

The current working software makes that proposition inspectable. All three manufacturing definition classes reach one Store-owned engine. It searches complete feasible parent-stock plans, retains component and feature coverage, sequences declared work, accounts for handling and tool movement, and calculates Q from material, hardware, hourly service and separately charged panel cuts. A manifest independent of the translated demand prevents a dropped requirement from disappearing into a favorable answer. Receipts bind the answer to demand, manifest, Store release, catalog and model. Accepted packets preserve that same chain; verification reevaluates rather than trusting a saved amount.

Current machine evidence is a **modeled operation ledger**, schema `STB-MODELED-OPERATIONS-1`, with evidence class `PREDICTED_OCCUPANCY_ONLY`. Its replay checks identity, sequencing, dimensional moves, tool engagement and the time already priced by Store. It does not constitute a commissioned controller program. The preserved Project 1 package contains a separate, more detailed **45-command controller-oriented virtual sequence**, generated Structured Text and a locally executed reference model. Its original $11.09 answer and 85.5001-second Store time remain historical evidence. The adopted-core equivalent is a separate $10.81 evaluation with 86.46953628299116 seconds of modeled occupancy.

The commercial chain preserves the same identities through answer, seller offer, customer decision, order, financial state, material allocation, release, execution, inspection, staging and custody. These are separate source-owned decisions. The shared executable gate records and verifies simulated evidence; Job 1 explicitly enables a demo seller policy. A click or calculation does not establish physical inventory commitment, payment or inspected components.

The proposed supervised laboratory will establish the physical link: measured fence and support references, retained-face and kerf transforms, stock contact and restraint, actual movement, qualified tools, controller behavior, protective functions and independently inspected output. It will compare the complete service burden and operating cost with existing alternatives. The present software supplies defined inquiries, plans, numbers, identities and refusals against which that work can be tested. **Define it once; nobody downstream should have to redraw it.**

## Contents

<!-- TOC START -->
- [1. Source record and authority](#1-source-record-and-authority)
  - [1.1 Frozen repository revisions](#11-frozen-repository-revisions)
  - [1.2 Registered versions and identity rules](#12-registered-versions-and-identity-rules)
  - [1.3 Reading and verification basis](#13-reading-and-verification-basis)
  - [1.4 Owners and the single answer path](#14-owners-and-the-single-answer-path)
- [2. Invention and issued patents](#2-invention-and-issued-patents)
  - [2.1 The manufacturing architecture](#21-the-manufacturing-architecture)
  - [2.2 Figures and disclosed machine modes](#22-figures-and-disclosed-machine-modes)
  - [2.3 Evidence configurations compared](#23-evidence-configurations-compared)
  - [2.4 Current correspondence evidence keys](#24-current-correspondence-evidence-keys)
  - [2.5 US 9720401 B2 claims 1 through 18](#25-us-9720401-b2-claims-1-through-18)
  - [2.6 US 10768609 B2 claims 1 through 15](#26-us-10768609-b2-claims-1-through-15)
  - [2.7 Registered engineering and per-order preparation](#27-registered-engineering-and-per-order-preparation)
- [3. The complete System-to-Store boundary](#3-the-complete-system-to-store-boundary)
  - [3.1 Idea Intent and Bench](#31-idea-intent-and-bench)
  - [3.2 Three definition classes and discovery](#32-three-definition-classes-and-discovery)
  - [3.3 Protocol 2 admission](#33-protocol-2-admission)
  - [3.4 Independent complete manifest](#34-independent-complete-manifest)
  - [3.5 Complete board request example](#35-complete-board-request-example)
  - [3.6 Cut and sheet contracts](#36-cut-and-sheet-contracts)
  - [3.7 Answer receipt and transport](#37-answer-receipt-and-transport)
  - [3.8 Revision custody and accepted packets](#38-revision-custody-and-accepted-packets)
- [4. Store-owned catalog and inventory](#4-store-owned-catalog-and-inventory)
  - [4.1 Catalog identity and provenance](#41-catalog-identity-and-provenance)
  - [4.2 Board material categories](#42-board-material-categories)
  - [4.3 Sheet and hardware categories](#43-sheet-and-hardware-categories)
  - [4.4 Eligibility and supply decisions](#44-eligibility-and-supply-decisions)
  - [4.5 Discovery and attribution](#45-discovery-and-attribution)
  - [4.6 Complete SKU register](#46-complete-sku-register)
- [5. Manufacturing engine from request to Q](#5-manufacturing-engine-from-request-to-q)
  - [5.1 Compilation and validation](#51-compilation-and-validation)
  - [5.2 Task grouping and operation requirements](#52-task-grouping-and-operation-requirements)
  - [5.3 Candidate eligibility](#53-candidate-eligibility)
  - [5.4 Parent patterns and whole-job search](#54-parent-patterns-and-whole-job-search)
  - [5.5 Ledger state and occupancy](#55-ledger-state-and-occupancy)
  - [5.6 Motion timing](#56-motion-timing)
  - [5.7 Reference and saw operations](#57-reference-and-saw-operations)
  - [5.8 Width preparation and profiles](#58-width-preparation-and-profiles)
  - [5.9 Spot geometry and timing](#59-spot-geometry-and-timing)
  - [5.10 Sheet geometry and compensation](#510-sheet-geometry-and-compensation)
  - [5.11 Retention tabs and split rules](#511-retention-tabs-and-split-rules)
  - [5.12 Panel cuts and returned pieces](#512-panel-cuts-and-returned-pieces)
  - [5.13 Sheet operation time](#513-sheet-operation-time)
  - [5.14 Hardware package selection](#514-hardware-package-selection)
  - [5.15 Whole-job economics and rounding](#515-whole-job-economics-and-rounding)
  - [5.16 Completion and calculation identity](#516-completion-and-calculation-identity)
  - [5.17 Worked calculations and sensitivities](#517-worked-calculations-and-sensitivities)
- [6. Registered machine functions](#6-registered-machine-functions)
  - [6.1 Registered model and units](#61-registered-model-and-units)
  - [6.2 Dimensional parameter register](#62-dimensional-parameter-register)
  - [6.3 Sheet parameter register](#63-sheet-parameter-register)
  - [6.4 Datums and controlled stock movement](#64-datums-and-controlled-stock-movement)
  - [6.5 Kerf faces and reference retention](#65-kerf-faces-and-reference-retention)
  - [6.6 Contact screens and physical restraint](#66-contact-screens-and-physical-restraint)
  - [6.7 Fixed tooling and local lowering](#67-fixed-tooling-and-local-lowering)
  - [6.8 Proposed physical apparatus and commissioning](#68-proposed-physical-apparatus-and-commissioning)
- [7. Complete historical Project 1 walkthrough](#7-complete-historical-project-1-walkthrough)
  - [7.1 Specimen sources and identities](#71-specimen-sources-and-identities)
  - [7.2 Customer geometry and System derivation](#72-customer-geometry-and-system-derivation)
  - [7.3 Historical material and parent decision](#73-historical-material-and-parent-decision)
  - [7.4 Historical Store route and Q](#74-historical-store-route-and-q)
  - [7.5 Neutral requirements and local coordinates](#75-neutral-requirements-and-local-coordinates)
  - [7.6 Every historical virtual command](#76-every-historical-virtual-command)
  - [7.7 Controller interpreter and state lifecycle](#77-controller-interpreter-and-state-lifecycle)
  - [7.8 Historical virtual timing reconciliation](#78-historical-virtual-timing-reconciliation)
  - [7.9 Contact face and stroke findings](#79-contact-face-and-stroke-findings)
  - [7.10 Reproduction and fourteen checks](#710-reproduction-and-fourteen-checks)
  - [7.11 Separate current adopted-core evaluation](#711-separate-current-adopted-core-evaluation)
  - [7.12 Transaction handoffs and resulting record](#712-transaction-handoffs-and-resulting-record)
- [8. Five current public project paths](#8-five-current-public-project-paths)
  - [8.1 Exact inquiry and evaluation basis](#81-exact-inquiry-and-evaluation-basis)
  - [8.2 Start Your Own](#82-start-your-own)
  - [8.3 Alcove](#83-alcove)
  - [8.4 Window Seat](#84-window-seat)
  - [8.5 Outdoor](#85-outdoor)
  - [8.6 Playhouse](#86-playhouse)
  - [8.7 Variations refusals and commercial scope](#87-variations-refusals-and-commercial-scope)
- [9. Lowering packets and virtual evidence](#9-lowering-packets-and-virtual-evidence)
  - [9.1 Accepted packet verification](#91-accepted-packet-verification)
  - [9.2 Current local job](#92-current-local-job)
  - [9.3 Modeled operation records](#93-modeled-operation-records)
  - [9.4 Independent virtual replay](#94-independent-virtual-replay)
  - [9.5 Evidence request and response](#95-evidence-request-and-response)
  - [9.6 Complete reproducible examples](#96-complete-reproducible-examples)
  - [9.7 Source digest and deployment verification](#97-source-digest-and-deployment-verification)
- [10. Commercial sequence and full transaction](#10-commercial-sequence-and-full-transaction)
  - [10.1 Contract ownership and installed scope](#101-contract-ownership-and-installed-scope)
  - [10.2 Event envelope and identity binding](#102-event-envelope-and-identity-binding)
  - [10.3 Answer offer decision and order](#103-answer-offer-decision-and-order)
  - [10.4 Finance reservation capacity and queue](#104-finance-reservation-capacity-and-queue)
  - [10.5 Allocation issue release and local admission](#105-allocation-issue-release-and-local-admission)
  - [10.6 Execution inspection staging and handoff](#106-execution-inspection-staging-and-handoff)
  - [10.7 Idempotency hash chains and concurrency](#107-idempotency-hash-chains-and-concurrency)
  - [10.8 Job 1 demo and other pending flows](#108-job-1-demo-and-other-pending-flows)
  - [10.9 Intended workflow and executable limits](#109-intended-workflow-and-executable-limits)
- [11. Refusal interruption and recovery](#11-refusal-interruption-and-recovery)
  - [11.1 Current result states](#111-current-result-states)
  - [11.2 Admission and manufacturing reason register](#112-admission-and-manufacturing-reason-register)
  - [11.3 Packet evidence and transport failures](#113-packet-evidence-and-transport-failures)
  - [11.4 Commercial holds and exceptions](#114-commercial-holds-and-exceptions)
  - [11.5 Physical interruption datum invalidation and recovery](#115-physical-interruption-datum-invalidation-and-recovery)
- [12. Acceptance inspection and evidence custody](#12-acceptance-inspection-and-evidence-custody)
  - [12.1 Test evidence and proof scope](#121-test-evidence-and-proof-scope)
  - [12.2 Physical component acceptance](#122-physical-component-acceptance)
  - [12.3 Identity labels and remnants](#123-identity-labels-and-remnants)
  - [12.4 Custody and historical reproduction](#124-custody-and-historical-reproduction)
  - [12.5 Release responsibility](#125-release-responsibility)
- [13. Economics and operating implications](#13-economics-and-operating-implications)
  - [13.1 Current declared cost pool](#131-current-declared-cost-pool)
  - [13.2 Productive utilization and service burden](#132-productive-utilization-and-service-burden)
  - [13.3 Complete customer amount and internal cost](#133-complete-customer-amount-and-internal-cost)
  - [13.4 Waste maintenance and alternatives](#134-waste-maintenance-and-alternatives)
  - [13.5 Laboratory and yard validation](#135-laboratory-and-yard-validation)
- [14. Exact source and verification register](#14-exact-source-and-verification-register)
  - [14.1 Store runtime source register](#141-store-runtime-source-register)
  - [14.2 System handoff source register](#142-system-handoff-source-register)
  - [14.3 Program and historical source register](#143-program-and-historical-source-register)
  - [14.4 Content identities](#144-content-identities)
  - [14.5 Reproduction commands and verification results](#145-reproduction-commands-and-verification-results)
- [15. Historical reconciliation and consolidation appendix](#15-historical-reconciliation-and-consolidation-appendix)
  - [15.1 Architectural migration](#151-architectural-migration)
  - [15.2 Audit issues and resolution status](#152-audit-issues-and-resolution-status)
  - [15.3 Additional source discrepancies](#153-additional-source-discrepancies)
  - [15.4 Protected evidence and future consolidation](#154-protected-evidence-and-future-consolidation)
  - [15.5 Master completion and navigation checks](#155-master-completion-and-navigation-checks)
<!-- TOC END -->

## 1. Source record and authority

### 1.1 Frozen repository revisions

This reference describes the following source record. All three remote `main` heads were read before authoring; none had moved from the audit's revisions. Subsequent commits in Store add this document only. They do not replace the executable baseline or System's operating pin.

| Owner | Repository | Frozen source revision | Movement since audit |
| --- | --- | --- | --- |
| Store | [GeorgePlattDemo/store-zero](https://github.com/GeorgePlattDemo/store-zero/tree/f7123a73c1ca60aa7eb180a86a1c365eaffe95db) | `f7123a73c1ca60aa7eb180a86a1c365eaffe95db` | None before writing |
| System | [GeorgePlattDemo/new-system](https://github.com/GeorgePlattDemo/new-system/tree/ab09777d6f27d4b70a2193abc8564ebce611746f) | `ab09777d6f27d4b70a2193abc8564ebce611746f` | None |
| Program | [GeorgePlattDemo/3d-solutions-program](https://github.com/GeorgePlattDemo/3d-solutions-program/tree/04ec327df39a54e92aae65ef4b07d10f2c8a8985) | `04ec327df39a54e92aae65ef4b07d10f2c8a8985` | None |

The primary reconciliation input is *Scan-to-Build-Read-Only-Audit-2026-10-12(1).md*, including its 34-document inventory, all-claim correspondence, source checks and ten ordered repair groups. Its findings were checked against the frozen code and original evidence. A historical statement in the audit is not made current merely by appearing here.

This document is the consolidated explanation of the source record. Enforceable Store behavior remains in the [operative specification](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/STORE-ZERO-SPECIFICATION.md), exact contracts and executable source. System owns [shared definitions](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/docs/DEFINITIONS.md). The [shared commercial contract](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/commercial-sequence-template.md) retains its original custody; this reference explains the installed gate and identifies drift in that contract's prose. An unresolved disagreement is recorded, not silently settled by editorial authority.

### 1.2 Registered versions and identity rules

| Surface | Exact installed identifier | Source |
| --- | --- | --- |
| Request protocol | `STORE-ZERO-REQUEST-2` | [HTTP service](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/service/server.mjs) |
| Definition conversion shapes | `USER_DEFINED_BOARD_V1`, `CUT_PACKAGE_V1`, `SHEET_PACKAGE_V1` | [Definition contracts](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/definitions.mjs) |
| Neutral manufacturing job | `STORE-MANUFACTURING-JOB-1` | [Manufacturing core](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/evaluation/engine/store-manufacturing-core.mjs) |
| Manufacturing model | `STORE-MANUFACTURING-CORE-0.1` | Core `createModel`; [registered parameters](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/data/machine/manufacturing-core-0.1.json) |
| Configuration execution class | `DECLARED_OCCUPANCY_EVENT_MODEL` | [Configuration reader](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/configuration.mjs) |
| Catalog | `StoreZeroCallableCatalog`; declared clock `2026-09-10` | [Catalog](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/data/store-zero-catalog.json) |
| Freshness rule | `STB-STORE-FRESH-EVALUATION-0.1` | [Request and receipt owner](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/requests/store-request.mjs) |
| Accepted packet | `STB-ACCEPTED-JOB-PACKET-2` | [Packet contract](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/job-packet.mjs) |
| Local job | `STB-LOCAL-MANUFACTURING-JOB-1` | [Lowering](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/lowering.mjs) |
| Operation records | `STB-MODELED-OPERATIONS-1` | [Machine-record contracts](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/machine-records.mjs) |
| Virtual model | `STB-VIRTUAL-OCCUPANCY-MODEL-1` | [Replay](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/virtual-run.mjs) |
| Evidence protocol | `STORE-ZERO-MACHINE-EVIDENCE-2` | [Evidence entry point](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/evidence.mjs) |
| Commercial record | `STB-COMMERCIAL-EVENT-1` | [Shared executable gate](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/commercial-sequence.js) |
| Commercial transport | `STORE-ZERO-COMMERCIAL-EVIDENCE-1` | [Commercial request boundary](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/requests/commercial-request.mjs) |
| System owner record | `STB-SYSTEM-RECORD-2` | [System source/pin record](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/src/system/store-candidate.ts) |
| Historical review | `D001 PROJECT1 DIGITAL TRAIL REVIEW 0.2` | [Preserved manuscript](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/project-1-digital-trail/D001_Project1_Review.md) |
| Historical virtual IR | `D001-VIRTUAL-IR-0.2` | Evidence ZIP `generated/motion-ir.json` |

Version labels identify a declared surface; content hashes establish which bytes or canonical object it contained. The registered model hash covers the full object returned by `createModel(parameters)`. The configuration hash covers the loaded configuration **including that expanded model**. It is not the SHA-256 of the 315-byte JSON parameter file. System records configuration hash `87542b1d56d7e5624d6d85557a0d213b226b9ffc4454d561fd8616379c1e6884` for this baseline. File-byte SHA-256 and Git blob identities are registered in Chapter 14.

### 1.3 Reading and verification basis

The source base includes the current operative specification; the complete 31,684-word archived specification; issued grants, claim sets and all nine drawing sheets; the Project 1 manuscript and Word presentation; the ZIP source identities, generator, controller reference and generated records; current engine and independent checks; catalog and source sheets; request, packet, machine and commercial contracts; service transport; fixtures and acceptance records. Corresponding System translation, manifest, interpretation, acceptance and public definition generators supply the cross-repository explanation. Program's current evidence and laboratory trial supply the research and physical-validation context.

The preserved Word review has 158 paragraphs and 20 tables. Its manuscript, publication identities and rendered 22-page presentation were available for comparison. The original evidence is preserved; running reproduction occurs only in an extracted working copy. Both issued patent checksums pass. Baseline catalog validation and all 87 Store tests pass on **Node 22.23.3**. Detailed final verification and numerical rechecks are recorded in Chapter 14.

### 1.4 Owners and the single answer path

| Owner | Adds authoritative facts | Does not acquire authority by receiving a record |
| --- | --- | --- |
| Customer and System | Controlling requirements, part/feature identities, derivations, revisions, complete manifest, application and owner custody | Store pricing, stock, machine economics or physical readiness |
| Store | Catalog, offered/available material, parent plans, processing constraints, modeled work/time, Q and refusal | Permission to reinterpret customer geometry |
| Responsible seller and financial source | Offer, policy, order acceptance and attributable financial records | Local machine admission or inspected conformance |
| Local implementation | Registered physical configuration, tooling, transforms, material readiness, local permission, controller execution | Customer design changes or substitute Store prices |
| Inspection and fulfillment | Measurements, conformance disposition, physical labels, package inventory and transfer | Proof from model completion alone |
| Program | Investigation, proposed engineering, trials, findings and development rationale | Runtime capability, source-owned commercial acts or operating release |

The current answering path is:

```mermaid
flowchart TD
    A["Published definition and independent manifest"] --> B["System translation and shared transport"]
    B --> C["Store request admission"]
    C --> D["Validated catalog and registered model"]
    D --> E["One manufacturing core"]
    E --> F["Store answer and sole receipt"]
    F --> G["System identity checks and presentation"]
    G --> H["Identified customer decision"]
    H --> I["Packet verification and ledger evidence"]
    I --> J["Separate local admission and inspection"]
```

Only Store's request layer issues the receipt. Discovery has its own bounded retrieval path and supplies no job Q. Historical source copies are reproduction inputs, never a fallback for the current answering path. Source digest checks cover shipped `package.json`, `src/` and `data/`; documentation changes do not alter that shipped byte set.

## 2. Invention and issued patents

### 2.1 The manufacturing architecture

[US 9,720,401 B2](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/patents/US9720401B2.pdf), issued 1 August 2017, and [US 10,768,609 B2](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/patents/US10768609B2.pdf), issued 8 September 2020, share the title *Method and System for Consumer Home Projects Ordering and Fabrication*. The latter identifies itself as a continuation of application 14/094,074 filed 2 December 2013, which became the first grant. Each issued claim set is read independently; a common disclosure does not make the claims identical.

The disclosed integration begins with a customer's project inquiry. A customer selects or modifies a database project, or uses the design interface to develop requirements. Material, features, machining time and optional services inform an estimated price. The chosen project is converted into component requirements, material lists and instructions. Local stock is loaded into the appropriate dimensional or sheet machine. Additional components, secondary work, finishing, labels, assembly instructions, staging and pickup complete the described service.

Dimensional and sheet processing form two cooperating material streams. A particular order may need only one. Dimensional stock moves along a fence between known operations. The sheet architecture supports direct straight cuts, sheet movement under a fixed longitudinal tooling station, and a separate mode in which a fixed workpiece receives two-axis tool-platform movement. Material retrieval and loading can remain human tasks while positioning and processing follow generated instructions.

The patent disclosure also discusses custom tools, supplier or special-order merchants, optional delivery and assembly, contractor use and local service economics. Those are disclosed possibilities. Store's current fixed tool, declared inventory and bounded operation vocabulary determine what this implementation actually answers. A patent's examples of savings or commercial benefit are propositions; current Q is a declared calculation and the laboratory trial will measure the complete service.

### 2.2 Figures and disclosed machine modes

The drawings in both grants are schematic and explicitly not a dimensioned fabrication drawing. The figure numbers are the drawing-sheet labels, not PDF page indices.

| Figure | Subject | Relevance to this reference |
| --- | --- | --- |
| 1 | Customer input, retailer/project data, controller, tandem machine, raw material and finished components | The complete information-to-component chain |
| 2 | Store interface, mobile/home access, supplier/merchant, stock, operator, tandem cell, secondary work, finishing, labeler and staging | Source-owned transaction and fulfillment responsibilities |
| 3 | Production cell within retail inventory bays | Footprint, manual handling and phased investment proposition |
| 4 | Conveyor, spray and drying arrangement | A separately engineered finishing service, absent from the current core |
| 5 | Dimensional support, fence, manipulating and clamping rollers, saw stations and tooling ways | Datum and station architecture; illustrated three manipulating rollers differ from the two-roller model |
| 6 | Sheet backing plates, bottom/top rollers, rotating yokes, guide rails and tooling platform | Particular physical structure included in independent claims |
| 7 | Tool platform, receiver and pressure-sensing plate | Physical depth reference and tooling interface |
| 8 | Interchangeable tool attachment and contour tooling | Tooling embodiments; no automatic adoption into Store |
| 9 | Computer, communication, I/O and storage | Computer implementation and stored instruction aspects |

In disclosed sheet **mode 1**, operator panel settings control straight cuts. In **mode 2**, the sheet supplies X movement and the tool supplies Y movement at a fixed longitudinal centerline; attachment bridges retain routed shapes for later separation. In **mode 3**, components are pinned/clamped to backing or carrier plates and the tool platform moves in both planar axes for finishing or other precision work. S-001 currently evaluates a bounded routed field and occupancy; it does not implement every one of those physical modes or their protective systems.

### 2.3 Evidence configurations compared

| Configuration | Dimensional arrangement | Sheet arrangement | Evidence stage |
| --- | --- | --- | --- |
| Issued disclosure and claims | Support/fence, manipulating and clamping rollers, saw(s), rigid ways and tool heads; illustrated preferred arrangement has three manipulating rollers | Backing/support, rollers, yokes, rails and moveable tooling platform with disclosed modes | Issued text and schematic disclosure |
| Historical Project 1 review | Nominal saw X=0, spot X=36, rollers X=24/48, measuring wheel X=30; controller-oriented A/S/X/Y/Z sequence | No sheet specimen in this package | Reproduced original Q and executed Node virtual sequence; uncompiled Structured Text |
| Adopted Store core | One nominal saw station X=0, tool X=36, roller screen X=24/48; A/S/C/Y/Z/RZ timing state | Center 48×36 routed field in 96×48 sheet; separate manual full cuts | Implemented declared occupancy/economics model; current replay |
| Program laboratory proposal | Two downstroke saw stations, two manipulating rollers, up to three routing functions, one initial spot station; second spot added if justified | Added when demonstrated demand warrants it | Proposed apparatus and measured acceptance work |

These arrangements cannot be exchanged merely because they use similar tooling words. The adopted core does not have the archived separate right-saw batch path. The laboratory's future station locations and signed-angle transforms must come from its released engineering record. The patents do not supply the core's hourly rate, feed constants, 24-inch screen or tab policy.

### 2.4 Current correspondence evidence keys

The matrices below describe engineering correspondence to issued functions. Each dependent claim includes its inherited limitations. A successful price or hardware test demonstrates that function under its proof scope; it does not establish the full inherited apparatus or method. The issued PDF controls the claim wording.

| Key | Current code and evidence |
| --- | --- |
| I | System [published translator](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/src/system/store/published-wire.ts), [compiler](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/src/system/compile.ts), [manifest](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/src/system/manifest.ts); published-wire and [HTTP integration checks](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/src/system/store/http.integration.test.ts) |
| Q | Store [manufacturing core](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/evaluation/engine/store-manufacturing-core.mjs), [catalog reader](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/evaluation/catalog.mjs), catalog/model data; [21 self-checks](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/tests/core-self-checks.mjs) and manufacturing test |
| R | [Request/receipt layer](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/requests/store-request.mjs), [definition contract](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/definitions.mjs), [packet verifier](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/job-packet.mjs); [protocol 2 tests](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/tests/protocol2.test.mjs) and contract acceptance |
| V | [Lowering](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/lowering.mjs), [record validation](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/machine-records.mjs), [virtual replay](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/virtual-run.mjs), [evidence boundary](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/evidence.mjs); current protocol/contract examples |
| C | [Shared commercial gate](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/commercial-sequence.js), [commercial tests](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/tests/commercial-sequence.test.mjs); System's byte-identical gate and explicitly simulated source adapters |
| H | [Original Project 1 manuscript](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/docs/project-1-digital-trail/D001_Project1_Review.md), DOCX, ZIP, seven pinned sources and fourteen reference checks; [historical acceptance](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/acceptance/project-1/project-1.test.mjs) |

### 2.5 US 9720401 B2 claims 1 through 18

Claim text appears on PDF pages 30–33, printed columns 40–46. Parent is the **immediate** dependency.

| Claim | Parent | Issued function or combination in plain language | Current correspondence | Physical requirement and evidence stage |
| --- | --- | --- | --- | --- |
| 1 | Independent | Customer project/database-or-CAD interface; instructions control tandem dimensional/sheet fabrication; detailed sheet support, plates, rollers, yokes, rails and platform | I/Q/R/V implement selected information and model functions | Claimed physical tandem and sheet structure not established |
| 2 | 1 | Control panel for each machine; manual and computer-controlled modes | Local operating target | No installed panel/mode validation |
| 3 | 1 | Tooling platform accepts selectively installed heads | Registered fixed tool models only | Physical attachment/interface absent from current implementation |
| 4 | 1 | Dimensional support surface, fence, clamp roller, servo manipulation and servo saw | Q/V positioning, saw and contact screens | Installed mechanism/restraint not established |
| 5 | 4 | Fixed rigid vertical/horizontal ways with servo-positioned tool heads | Program candidate engineering | Complete physical ways/tool assembly unbuilt |
| 6 | 5 | Rigid metal base with predrilled element mounting holes | Proposed structural registration | No base manufacture or mounting inspection |
| 7 | 1 | Prefinishing/finishing station | Optional service/disposition context in C | No installed or executed finishing process |
| 8 | 1 | Manual secondary-operations station | C can retain responsibility and disposition | No commissioned physical secondary station |
| 9 | 1 | Component labels and printed assembly instructions | Q identity/label records; source project information in I | Complete print/affix/instruction station absent |
| 10 | Independent | Project interface, price and instructions; tandem structure; home-improvement retail location; CAD/CAM; operator loading and tool-head changes | I/Q/R/V are partial software correspondence | Full physical/retail/method combination and tool changes not demonstrated |
| 11 | 10 | Customer variation produces recalculated estimate | I/Q/R fresh evaluation of changed revisions | Implemented and tested information function; claim 10 inheritance remains |
| 12 | 10 | Acceptance followed by material list and machining instructions | C/R/V simulated decision, material selection and bound ledger | Full actual accepted-order fabrication chain absent |
| 13 | 12 | Transmit instructions to tandem machine | V/H generated virtual artifacts | No commissioned controller transmission |
| 14 | 13 | Labels associated with components and assembly instructions | Q/H identity and label intent | Complete actual print/affix and assembly chain absent |
| 15 | 14 | List additional components not fabricated by either machine | Q hardware selection and I presentation | Implemented tested listing; inherited manufacture/label chain absent |
| 16 | 13 | Remove machined component; label, finish, secondary work and/or package fabricated/additional components | C simulated execution/inspection/custody records | Actual post-machine work not demonstrated |
| 17 | 10 | Claim 10 implemented as stored computer-readable instructions | Software and H artifacts exist | Existence of software does not establish full inherited method |
| 18 | 10 | Estimated price uses pricing database at Store with tandem machine | Q/R Store-owned catalog pricing | Tested price function; real co-located tandem arrangement absent |

### 2.6 US 10768609 B2 claims 1 through 15

Claim text appears on PDF pages 31–33, printed columns 40–44. Claim 1 includes both manufacturing families, fore/aft dimensional end work, sheet curvilinear work and the detailed sheet apparatus.

| Claim | Parent | Issued function or combination in plain language | Current correspondence | Physical requirement and evidence stage |
| --- | --- | --- | --- | --- |
| 1 | Independent | Project/database-or-CAD interaction; estimate and instructions; curvilinear sheet work; dimensional end operations by fore/aft stock movement; detailed sheet apparatus | I/Q/R/V information, stock and modeled processing functions | Complete physical combination not established |
| 2 | 1 | Implementation by retail business entity | Declared reference yard | Operational retailer implementation absent |
| 3 | 1 | Customer variation and revised estimate | I/Q/R fresh changed-definition evaluations | Implemented/tested function; parent apparatus/method absent |
| 4 | 1 | Acceptance, material list and machining instructions | C/R/V simulated decision and bound plan | Complete actual production chain absent |
| 5 | 4 | Transmit instructions; display appropriate stock-loading request and component machining instructions | V/H identified component/material artifacts | Commissioned loading, transmission and execution absent |
| 6 | 5 | Component labels and printed assembly instructions | Q/H identity/label modeling | Full physical label/instruction chain absent |
| 7 | 6 | Listing additional nonfabricated components | Q hardware requirements and I presentation | Tested listing; inherited chain absent |
| 8 | 7 | CAD includes CAM; generated instructions; sequential loading and tool-head changes | Bounded generated/model artifacts | Ordinary per-order head changes outside current fixed-tool model |
| 9 | 8 | Interface permits interaction with both project database and CAD design module | I library and user-defined paths | Claim-wide CAD/CAM and inherited physical combination not established |
| 10 | 5 | Remove component and label/finish/secondary-process/package it | C explicit simulated lifecycle | No observed physical post-machine workflow |
| 11 | 1 | Method embodied in stored computer-readable instructions | Software artifacts exist | Complete inherited method not established by storage |
| 12 | 1 | Pricing database at Store where tandem machine is located | Q/R Store pricing | Physical co-location/tandem requirement absent |
| 13 | 1 | Tandem machine in home-improvement retail store | Proposed local service setting | No installed retail tandem machine |
| 14 | 1 | CAD includes CAM and generates tandem instructions | V/H bounded generated sequence/model | General commissioned CAD/CAM-to-machine path absent |
| 15 | 14 | Operator sequentially loads stock and changes head attachments from CAD/CAM instructions | Proposed loading records and H reference | Actual loading/tool-change execution absent |

### 2.7 Registered engineering and per-order preparation

The disclosed dimensional embodiment places drilling and routing heads on known ways so moving stock can bring features to those tools without installing different heads for routine work. This supports the engineering rationale for reusable station registration. Some issued combinations separately include tool-head changes. Current fixed-tool capability is a chosen narrower operating model, not a reinterpretation of those limitations.

A supported definition provides part geometry, operation and feature identities. Store supplies stock and the evaluated processing plan. Local registration supplies actual machine references, tools, signs, offsets, travel limits, controller mapping and readiness. When those mappings are qualified, software can generate per-job instructions from the definition. Eliminating a professional's ordinary per-order preparation does not eliminate the professional work of building and qualifying the mapping. Unknown capture geometry, unsupported features and invalid physical references must still be resolved or refused.

## 3. The complete System-to-Store boundary

### 3.1 Idea Intent and Bench

Idea carries source material, observations and the customer's intended result. Intent establishes which facts control the job and which wood/tools or requirements are selected. The Bench changes identified values under a project rule and exposes their resulting components and features. The six customer steps begin at Intent; Idea is intake. Those UI steps are System-owned, not Store request types.

A project may use a named derivation such as the X-brace rule, the Window Seat elevation rule, or a published plan's part list. That derivation turns customer values into an identified definition. It must preserve provenance and unresolved facts. A visual layout is not itself manufacturing demand. The Store inquiry contains typed values and a complete expected manifest. Store never derives a project by its title or by reading a picture.

System's public pages use an outer `stb-store-zero-http/1` page wire carrying attempt, project, revision, scope and payload identities. The server [published-wire translator](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/src/system/store/published-wire.ts) maps that wire to Store's protocol 2 request. These are distinct protocol layers. The server's [inspected Store pin](https://github.com/GeorgePlattDemo/new-system/blob/ab09777d6f27d4b70a2193abc8564ebce611746f/src/system/store-candidate.ts) governs; a caller-supplied different pin is rejected with `CALLER_PIN_DOES_NOT_GOVERN`.

### 3.2 Three definition classes and discovery

| Store request type | Meaning and conversion | Important constraints |
| --- | --- | --- |
| `USER_DEFINED_BOARD_V1` | One identified workpiece demand with ordered parts and spots becomes one atomic board group | Explicit material, angle, parallel long-long miter-face geometry, reference cut, counts and required operations; parent minimum retained separately |
| `CUT_PACKAGE_V1` | Neutral dimensional packages and sourced item lines become board and item tasks | Every part identified; angle numeric; angled end meaning explicit; optional width preparation, spot and through-profile requirements |
| `SHEET_PACKAGE_V1` | One sheet and features become a sheet task | Exact sheet dimensions, identified features, retention and all-pieces-returned requirement |
| `OFFERING_LOOKUP` | Deterministic catalog search or exact lookup | No manifest, fabrication plan, machine time, Q or quotation receipt |

`BOARD_SQUARE_V1` and Store-native `ALCOVE_INSERT_V1` are retired and refused. The public Alcove still uses a System-facing insert label; System converts it to `CUT_PACKAGE_V1`. This is not a fourth Store evaluator. The engine's `compileDefinition` preserves the conversion request as `job.source`, adds neutral `boards`, `sheets` and `items`, and validates expected coverage before evaluation.

### 3.3 Protocol 2 admission

The formal job request has exactly four top-level fields: `requestType`, `requestId`, `demand`, `manifest`. Request type and inquiry identity must be valid. Machine-local `spline`, `toolpath`, `gcode`, `controller` or `servoSteps` in the demand are refused. Unknown fields are not ignored. A prior answer, receipt, release or evaluation timestamp cannot be submitted as authority.

The [shape checker](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/contracts/shape.mjs) checks declared JSON types and unknown nested fields. It treats null or absent values as unsupplied; completeness is checked in the core. A numeric-looking string from a UI may be explicitly converted by System before Store submission; Store's contract does not accept that string as a finite number. The same distinction applies to whole quantities.

A missing independent manifest fails before engine execution: `UNRESOLVED`, `INDEPENDENT_SYSTEM_MANIFEST_REQUIRED`, `freshEvaluation:false`, null calculation identity and null receipt. A clean request that reaches the engine can still receive a refusal, unresolved result or unavailable result with a **fresh evaluation receipt**. The receipt identifies that evaluation; it does not guarantee supportability.

### 3.4 Independent complete manifest

System constructs the manifest from the controlling definition before published-wire translation. Store does not create it from whatever happens to arrive after translation. The core checks coverage again after planning. These two comparisons connect original requirements to consumed demand and fulfilled work.

| Manifest field | Required content and check |
| --- | --- |
| `jobId`, `revision` | Exactly equal demand `configurationId`, `configurationVersion` |
| `boardPartIds` | Unique nonblank set of every dimensional part ID |
| `sheetPackageIds` | Unique nonblank set of sheet package IDs; one sheet conversion uses its configuration ID |
| `featureIds` | Every required spot, profile or sheet feature ID, with no duplicate or missing identity |
| `items` | Every sourced `lineId` and positive integer requested quantity; quantities must match |
| `unresolvedRequirements` | Optional array; must be empty for a complete Q |

Set equality ignores list order but rejects duplicated identities; meaningful part order is retained elsewhere. Board and sheet package IDs are checked for uniqueness. The result exposes `manifestCoverage` for parts, sheet packages, features and item lines. `FEATURE_ANSWERED` or `FEATURE_COVERED_BY_PARENT_EDGE_PREPARATION` events carry the feature coverage witness. Hardware grouping preserves the assignments to each source item line.

A manifest proves coverage of what System listed. It cannot prove that System identified every physical installation requirement correctly. For Alcove, a spot summary contradictory to component spots is retained as an unresolved requirement. For Outdoor, the datum correspondence remains a source-meaning issue even when the transmitted manifest is complete.

### 3.5 Complete board request example

The following runnable protocol 2 example states the Start Your Own 16-inch SPF demand. Its inquiry identity `MASTER-SYO-16` is an example identity; dimensions and required operations reproduce the current declared calculation. System remains the runtime issuer of the manifest. This example uses the public-page geometry and omits the redundant end-identity string.

```json
{
  "requestType": "USER_DEFINED_BOARD_V1",
  "requestId": "MASTER-SYO-16",
  "demand": {
    "title": "Start your own",
    "configurationId": "SYO-USER1-XBRACE",
    "configurationVersion": "0.1",
    "classId": "user_defined_board",
    "materialDemand": {"species":"spf","form":"board","nominalT":2,"nominalW":4},
    "definedWorkpieceLengthIn": 60,
    "requiredOps": ["MITER_LIMITED","SPOT_ON_LOCATION"],
    "sawAngleDeg": 30,
    "cutPlane": "miter-face",
    "datumCMethod": "REFERENCE_CUT",
    "endRelation": "parallel",
    "lengthDatum": "long-long-outer-edge",
    "declaredSawCuts": 3,
    "declaredSpotCount": 2,
    "unresolvedConditions": [],
    "parts": [
      {"partId":"PART-1","lengthIn":16,"features":[{"featureId":"SPOT-1","kind":"SPOT_ON_LOCATION","xIn":8,"locationRule":"CENTERED_ON_PART","acrossWidthRule":"CENTERED_ON_WIDE_FACE"}]},
      {"partId":"PART-2","lengthIn":16,"features":[{"featureId":"SPOT-2","kind":"SPOT_ON_LOCATION","xIn":8,"locationRule":"CENTERED_ON_PART","acrossWidthRule":"CENTERED_ON_WIDE_FACE"}]}
    ]
  },
  "manifest": {
    "jobId":"SYO-USER1-XBRACE","revision":"0.1",
    "boardPartIds":["PART-1","PART-2"],"sheetPackageIds":[],
    "featureIds":["SPOT-1","SPOT-2"],"items":[],"unresolvedRequirements":[]
  }
}
```

This inquiry calls the registered core through the sole request layer and returns $8.62 on the baseline catalog. Changing request ID changes the retained source object and therefore calculation input identity even if geometry and Q remain equal. A reproducible example must preserve its whole request, not only the dollar amount.

### 3.6 Cut and sheet contracts

A cut package contains `packageId`, `material`, `endCut`, and nonempty `parts`. Material names species, form `board`, positive nominal thickness and width, and grade when required by offered choices. Square work states `angleDeg:0`; omission is not square. Angled work states angle 0–45, `endRelation:parallel`, `lengthDatum:long-long-outer-edge`, `plane:miter-face`. Finished width must be positive and compatible with actual stock. Two-edge preparation states both positive removals and finished width; Store validates their sum against actual width.

Each part names `partId`, positive `lengthIn`, and optional `spots` and `edgeProfiles`. Spots carry identity, longitudinal coordinate and centered/inset placement, with optional exact diameter/depth constraints. Profiles carry identity, `MILL_LONGITUDINAL_PROFILE`, path length, Y and total depth. A source-specific profile is fulfilled by whole-parent edge preparation only when its path, prepared width and through depth agree exactly under the code's tolerance.

Each item line carries `lineId`, positive integer `qty`, and exactly one selector: `storeSku`, `requirementId`, or structured `requirement`. An exact SKU quantity is a selling-unit/package quantity. A structured fastener requirement's quantity is a piece count; Store chooses enough complete packages. A functional requirement's quantity is the identified offered unit count.

A sheet demand contains `sheet` dimensions and optional species/grade, `features`, `returnAllPieces:true`, and optional Boolean exterior requirement. Current feature kinds are `ARCHED_APERTURE`, `STRAIGHT_SPLIT`, `CROSSCUT`, `RIP`, `PATTERN`. Each kind has its own allowed operands. PATTERN offsets one named aperture; it is not arbitrary controller code or a second priced profile. Custom tab positions remain literal. A custom split without positions remains `UNRESOLVED` with no complete Q.

Complete committed input examples are [cut package](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/contracts/examples/requests/cut-package.alcove-pine.json), [sheet package](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/contracts/examples/requests/sheet-package.playhouse.json), and [refused inputs](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/contracts/examples/requests/refused.json). Their identities and fixtures are distinct from the public starting definitions in Chapter 8.

### 3.7 Answer receipt and transport

A supportable current answer includes `status`, `complete`, `configurationId/version`, `jobId/revision`, `Q`, `totals`, `time`, `selectedStock`, `parents`, `operations`, `optimization`, `model`, physical release/admission fields, physical gaps, coverage, packages/items/pieces/components/labels, calculation identity, `freshEvaluation` and receipt. Aliases are presentation projections of the same evaluated plans, not competing calculations.

`totals` separates material, hardware, hourly `machine_service`, `manual_cut_service`, total Q, manual cut count and hourly rate. `time` carries total seconds/minutes/hours, hourly-billed seconds, fixed-price occupied seconds, category sums and `SERIAL_OCCUPANCY`. Selected stock carries requested quantities, declared available and remaining quantities, dimensions, unit price and offering capability labels. A selection is not an inventory mutation.

The receipt's exact fields are `freshnessRule`, `requestType`, `requestId`, `evaluatedAt`, `authority`, `demandHash`, `manifestHash`, `status`, `calculationIdentity`, `receiptHash`. Authority binds Store revision, canonical catalog hash, manufacturing model ID/hash and machine configuration ID/hash. The receipt hash is SHA-256 over canonical key-sorted JSON of the other receipt fields. Engine code reads no clock; the request boundary supplies the evaluation instant.

HTTP `POST /v1/requests` wraps the answer in `protocol`, `storeRelease`, raw-byte `payloadDigest`, `respondedAt`, `answer`. A business refusal is HTTP 200 with reasons. A transport failure is not a Store refusal or a zero-dollar quote. System verifies protocol, expected release, exact sent bytes, request ID/type, demand/manifest hashes, receipt shape/hash/status/time/authority and calculation identity before presentation. It carries Store numbers rather than recomputing them.

### 3.8 Revision custody and accepted packets

System retains supplied facts, derivation trace, revision, sent bytes, attempts, received response, decision and packet separately. Editing the definition invalidates current-answer use; the earlier answer remains history. Delayed replies must match their original attempt and revision. Reopening an owner record restores its definition and history, not a current price by assertion.

An accepted packet carries schema 2, packet/project identity, definition ID/revision/type/demand/**manifest**/requirements, unchanged Store answer, accepted simulated decision with offer/time identity, and false physical release. Packet definition revision is the owner-record revision; demand `configurationVersion` is the manufacturing configuration revision. They can differ and are carried as separate identities. Store checks demand-manifest configuration identity and receipt binding; System binds its saved decision to the owner revision.

Packet verification rejects malformed, altered, foreign or temporally inconsistent content, and freshly evaluates the same demand and manifest. An edited answer under an unchanged calculation identity is refused. An intact answer whose current calculation/authority changed is stale and must be requoted. Verification establishes consistency, not actor authentication. Detailed packet checks and replay are in Chapter 9; commercial offer/order authority is in Chapter 10.


## 4. Store-owned catalog and inventory

### 4.1 Catalog identity and provenance

The runtime reads [data/store-zero-catalog.json](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/data/store-zero-catalog.json), validates it, and hashes its entire canonical JSON value for every inquiry. This is the callable supply record, not a live warehouse integration. Its `documentKind` is `StoreZeroCallableCatalog`, stage is 2, declared clock is `2026-09-10`, and price rule is `SZ-MARK-ON-5`. The frozen record contains **183 offerings: 137 boards, 9 sheets and 37 hardware lines**. The clock is metadata carried by this record, not the date on which every source price was observed. Later source CSV filenames carry 2026-09-26; their dates must not be used to relabel the runtime catalog.

The declared material-price relationship is:

$$p_{sell}=\operatorname{round}_{0.01}(p_{reference}(1+0.05)).$$

Five percent is a **mark-on** to reference price. It is not a five-percent gross margin: a $100 reference becomes $105, whose $5 spread is 4.7619% of selling price. Material mark-on and machine-service margin are separate calculations.

Each offering carries SKU, offered flag, form, species/grade where applicable, nominal and actual dimensions, parent length or sheet size, unit, reference and selling price, on-hand and allocated counts, supplier-path label, compatible cell families, supported-operation declarations, limitations, and provenance assertions. The reader checks required shape, prices, finite dimensions and whole nonnegative inventory, and requires `allocated <= onHand`. A supplied test catalog must pass the same validation as the disk catalog. No customer can replace the catalog by putting stock facts in a definition.

The stock language is explicitly **fixture-declared on-hand stock — not a physical count**. `onHand` assertions are synthetic fixtures, allocations are simulated state, material mapping is mapped evidence, compatibility is declared stage-2 capability, and some external list prices are observed evidence. These different assertion bases are retained in discovery. A selected SKU plan does not reserve anything. Actual yard availability requires a seller/inventory-owned count, lot, location, condition and allocation record.

[data/sources/store-zero-price-sheet-2026-09-26.csv](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/data/sources/store-zero-price-sheet-2026-09-26.csv), [hardware sheet](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/data/sources/store-zero-hardware-sheet-2026-09-26.csv) and [20 observations](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/data/sources/store-zero-observations.json) preserve price provenance. They are not additional runtime price calculators. The JSON catalog is the current evaluated supply authority; source CSV rows and observations support attribution.

### 4.2 Board material categories

The board register represents SPF construction stock, treated southern yellow pine, pine/select boards, and the additional species/grades explicitly listed below. The engine matches **species, board form, nominal thickness and nominal width exactly**; grade is exact when specified. It processes the actual width/thickness on the selected row. Nominal 2×4 therefore means the row's actual 1.5×3.5 inches, not a 2×4-inch solid. Nominal 1×8 pine uses 0.75×7.25 inches. Changing nominal width changes material candidates, actual cutting width, potential preparation and price.

Board parents may have different offered lengths and costs. A definition can require a minimum parent length; it does not thereby force Store to buy that exact length. `USER_DEFINED_BOARD_V1` requires all its parts from one parent in the stated order. Cut packages normally allow several parents and deterministic longest-first part ordering. Store pays the **whole selected parent price**, including the retained end and unused material. There is no automatic remnant credit or reuse in this model.

For example, current Project 1's treated 2×4 above-ground definition selects `STB-ZERO-PT-2X4-96-001` at $4.81. The historical specimen selected the preserved older 72-inch parent at $5.15. That specific change is a catalog/evaluation fact, not a universal rule that treated jobs always buy 96 inches. Similarly, a 96-inch pine 1×8 row is $27.67, a 120-inch row is $34.59, and the search must account for usable length and cumulative quantity before deciding which combination to use.

A blank grade is not permission for Store to choose among materially different offered grades. When more than one offered grade matches the other board criteria, the answer is `UNRESOLVED / GRADE_CHOICE_REQUIRED`, with the offered alternatives. System must return a definite material requirement after the customer's choice. Treatment category, strength, exposure and intended structural use remain meaningful customer/design requirements; Store's dimensional costing does not establish their suitability for a building application.

### 4.3 Sheet and hardware categories

Sheet rows cover the declared thickness/species/grade combinations in the register. The adopted S-001 model accepts 96×48-inch parents and thickness from 0.25 to 0.75 inches. The parent size is distinct from the smaller 48×36-inch registered router field. A sheet definition can name species and grade; absent those, multiple offered species/grade combinations yield `SHEET_MATERIAL_CHOICE_REQUIRED`. The default Playhouse inquiry matches the frozen 0.5-inch pine sheet, priced at $26.55. An exterior-rating request additionally requires an eligible catalog grade containing the exterior designation; missing evidence yields `EXTERIOR_RATING_NOT_ESTABLISHED`, rather than a fabricated exterior approval.

Hardware supports three selector forms: an exact Store SKU, a functional `requirementId` such as `ALCOVE-PINS-AND-SCREWS`, or a structured fastener requirement. Structured selection distinguishes wood screw #8, wood screw #10, and 3/8-inch carriage bolt/nut/washer assemblies; it matches length and finish exactly. Finish tiers map to coated, hot-dip-galvanized, stainless, silicon-bronze or zinc-interior. An unstructured historical hardware row can be purchased by exact SKU or its registered functional requirement but cannot acquire missing semantic fastener facts by inference.

A structured requirement's quantity is a number of pieces. Store pools identical selectors across line identities, then buys whole packages: `ceil(total pieces / pieces per package)`. Exact-SKU and functional-kit quantities are package quantities. The plan preserves which item lines are covered and the number of packages, pieces requested and surplus where represented. It selects an eligible package SKU with adequate cumulative inventory; it does not split one structured requirement across different package SKUs in the current plan space.

Catalog `treatedLumberRated` and attribution fields provide compatibility evidence. The engine does not independently prove an exposure-specific corrosion rule merely because a row has such a flag. The customer's required finish, the seller's compatibility admission and physical material acceptance must state the appropriate rule. The Outdoor default explicitly requests coated screws. This is its encoded selection, not a general recommendation for every treated-lumber environment.

### 4.4 Eligibility and supply decisions

Selection proceeds through distinct gates:

1. Match the material or hardware selector.
2. Retain offerings with `offered: true`.
3. Establish a finite selling price and declared cell/operation compatibility.
4. Check actual stock dimensions, required finished geometry and any minimum parent length.
5. Generate feasible parent patterns or a feasible sheet route.
6. Enforce `available = onHand - allocated` **cumulatively across the entire job**.
7. Compare complete alternatives by material, hardware, hourly work and separately priced cuts.

Failure at an earlier stage is not an inventory shortfall. No matching species is different from matching stock that is not offered; an unresolved price is different from an offered row with zero available units; a geometrically impossible part is different from a search that exhausts stock. The reason register in chapter 11 preserves these distinctions.

An offering's `supportedOps` is necessary supply metadata, not proof that the engine implements every named operation. Several dimensional rows still list `DRILL` and `MILL_END_PROFILE`; the adopted core does not offer arbitrary through drilling or end-profile machining. The current implementation recognizes the narrower operations explained in chapter 5. Required operations outside that representation are refused. Store does not let optimistic catalog labels create a new process.

### 4.5 Discovery and attribution

`OFFERING_LOOKUP` is discovery, not a manufacturing job, and accepts no manifest. An exact SKU query asks for a row; a search query asks for potential offerings. Search text is limited to 80 characters and results to 20. Text normalization handles case and dimension separators such as `×` and `x`; punctuation/space tokenization and hyphen-derived tokens are applied by [offering-lookup.mjs](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/requests/offering-lookup.mjs). Rank is exact SKU, SKU prefix, then all-token text match. Ties retain catalog order. Only offered rows appear.

A search finding several candidates does not mean one material has been chosen. The answer identifies the catalog hash, release and evaluation time and includes mapped/observed/calculated assertion provenance. It carries no evaluated-job receipt. System owns turning a customer's selection into an exact manufacturing requirement, and a subsequent Store inquiry evaluates that full definition afresh.

### 4.6 Complete SKU register

This is the frozen runtime register, generated directly from the 183 catalog rows. Dimensions are inches. Board dimensions show **actual thickness × actual width × parent length**; sheet dimensions show **thickness × sheet width × sheet length**. Price is USD per catalog unit, usually one parent or one hardware package. `H/A` means declared on-hand/allocated, not inspected yard count. All details and assertions remain independently inspectable in the commit-specific catalog linked above. The operation/cell columns preserve catalog declarations, including broader declarations that are not implemented by the current core.


**Board offerings**

| SKU | Material or description | Actual dimensions or fastener | USD | H/A | Offered | Cells | Declared operations |
|---|---|---|---:|---:|---|---|---|
| STB-ZERO-SPF-2X4-96-001 | spf/construction | 1.5 × 3.5 × 96 | 4.18 | 84/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X4-120-001 | spf/construction | 1.5 × 3.5 × 120 | 5.69 | 48/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X4-144-001 | spf/construction | 1.5 × 3.5 × 144 | 6.8 | 36/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X6-96-001 | spf/construction | 1.5 × 5.5 × 96 | 7.55 | 40/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X4-60-001 | spf/construction | 1.5 × 3.5 × 60 | 2.61 | 60/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X4-72-001 | spf/construction | 1.5 × 3.5 × 72 | 3.13 | 60/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X4-108-001 | spf/construction | 1.5 × 3.5 × 108 | 4.7 | 20/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X4-168-001 | spf/construction | 1.5 × 3.5 × 168 | 7.31 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X4-192-001 | spf/construction | 1.5 × 3.5 × 192 | 8.36 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X6-72-001 | spf/construction | 1.5 × 5.5 × 72 | 5.66 | 28/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X6-120-001 | spf/construction | 1.5 × 5.5 × 120 | 9.44 | 22/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X6-144-001 | spf/construction | 1.5 × 5.5 × 144 | 11.33 | 18/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X6-192-001 | spf/construction | 1.5 × 5.5 × 192 | 15.1 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X8-96-001 | spf/construction | 1.5 × 7.25 × 96 | 9.95 | 24/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X8-120-001 | spf/construction | 1.5 × 7.25 × 120 | 12.44 | 16/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X8-144-001 | spf/construction | 1.5 × 7.25 × 144 | 14.93 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X8-192-001 | spf/construction | 1.5 × 7.25 × 192 | 19.91 | 6/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-4X4-96-001 | spf/construction | 3.5 × 3.5 × 96 | 9.2 | 20/0 | false | D-001 | CROSSCUT, MITER_LIMITED |
| STB-ZERO-SPF-4X4-120-001 | spf/construction | 3.5 × 3.5 × 120 | 11.5 | 12/0 | false | D-001 | CROSSCUT, MITER_LIMITED |
| STB-ZERO-SPF-4X4-144-001 | spf/construction | 3.5 × 3.5 × 144 | 13.79 | 10/0 | false | D-001 | CROSSCUT, MITER_LIMITED |
| STB-ZERO-PINE-1X4-72-001 | pine/select | 0.75 × 3.5 × 72 | 8.65 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X4-96-001 | pine/select | 0.75 × 3.5 × 96 | 11.54 | 36/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X4-120-001 | pine/select | 0.75 × 3.5 × 120 | 14.43 | 18/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X4-144-001 | pine/select | 0.75 × 3.5 × 144 | 17.3 | 10/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X6-72-001 | pine/select | 0.75 × 5.5 × 72 | 15.74 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X6-96-001 | pine/select | 0.75 × 5.5 × 96 | 20.99 | 36/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X6-120-001 | pine/select | 0.75 × 5.5 × 120 | 26.24 | 18/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X6-144-001 | pine/select | 0.75 × 5.5 × 144 | 31.48 | 10/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X8-72-001 | pine/select | 0.75 × 7.25 × 72 | 20.75 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X8-96-001 | pine/select | 0.75 × 7.25 × 96 | 27.67 | 36/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X8-120-001 | pine/select | 0.75 × 7.25 × 120 | 34.59 | 18/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X8-144-001 | pine/select | 0.75 × 7.25 × 144 | 41.51 | 10/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINEQ-1X4-96-001 | pine/quality | 0.75 × 3.5 × 96 | 6.27 | 50/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL |
| STB-ZERO-PINESTD-1X4-96-001 | pine/standard | 0.75 × 3.5 × 96 | 2.87 | 80/0 | true | D-001 | CROSSCUT |
| STB-ZERO-PINEQ-1X8-96-001 | pine/quality | 0.75 × 7.25 × 96 | 12.58 | 22/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL |
| STB-ZERO-POP-1X6-72-001 | poplar/select | 0.75 × 5.5 × 72 | 24.14 | 18/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X4-96-001 | poplar/select | 0.75 × 3.5 × 96 | 18.89 | 16/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X8-120-001 | poplar/select | 0.75 × 7.25 × 120 | 49.04 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE |
| STB-ZERO-POP-1X4-72-001 | poplar/select | 0.75 × 3.5 × 72 | 14.16 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X4-120-001 | poplar/select | 0.75 × 3.5 × 120 | 23.61 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X4-144-001 | poplar/select | 0.75 × 3.5 × 144 | 28.33 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X6-96-001 | poplar/select | 0.75 × 5.5 × 96 | 32.18 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X6-120-001 | poplar/select | 0.75 × 5.5 × 120 | 40.24 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X6-144-001 | poplar/select | 0.75 × 5.5 × 144 | 48.28 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X8-72-001 | poplar/select | 0.75 × 7.25 × 72 | 29.42 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X8-96-001 | poplar/select | 0.75 × 7.25 × 96 | 39.23 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-POP-1X8-144-001 | poplar/select | 0.75 × 7.25 × 144 | 58.84 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-OAK-1X4-96-001 | oak/select | 0.75 × 3.5 × 96 | 24.14 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X6-72-001 | oak/select | 0.75 × 5.5 × 72 | 26.24 | 10/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X4-72-001 | oak/select | 0.75 × 3.5 × 72 | 18.1 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X4-120-001 | oak/select | 0.75 × 3.5 × 120 | 30.18 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X6-96-001 | oak/select | 0.75 × 5.5 × 96 | 34.99 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X6-120-001 | oak/select | 0.75 × 5.5 × 120 | 43.73 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X8-72-001 | oak/select | 0.75 × 7.25 × 72 | 34.59 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X8-96-001 | oak/select | 0.75 × 7.25 × 96 | 46.12 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-OAK-1X8-120-001 | oak/select | 0.75 × 7.25 × 120 | 57.65 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-CHR-1X4-72-001 | cherry/select | 0.75 × 3.5 × 72 | 28.97 | 6/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-CHR-1X4-96-001 | cherry/select | 0.75 × 3.5 × 96 | 38.62 | 6/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-CHR-1X6-72-001 | cherry/select | 0.75 × 5.5 × 72 | 41.98 | 6/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-CHR-1X6-96-001 | cherry/select | 0.75 × 5.5 × 96 | 55.98 | 6/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_END_PROFILE |
| STB-ZERO-PT-2X4-96-001 | syp-treated/above-ground | 1.5 × 3.5 × 96 | 4.81 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PT-2X4-120-001 | syp-treated/above-ground | 1.5 × 3.5 × 120 | 6.01 | 18/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PT-2X4-144-001 | syp-treated/above-ground | 1.5 × 3.5 × 144 | 7.21 | 12/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PT-4X4-96-001 | syp-treated/ground-contact | 3.5 × 3.5 × 96 | 9.96 | 10/0 | false | D-001 | CROSSCUT, SPOT_ON_LOCATION |
| STB-ZERO-PT-4X4-120-001 | syp-treated/ground-contact | 3.5 × 3.5 × 120 | 12.45 | 10/0 | false | D-001 | CROSSCUT, SPOT_ON_LOCATION |
| STB-ZERO-PT-4X4-144-001 | syp-treated/ground-contact | 3.5 × 3.5 × 144 | 14.94 | 10/0 | false | D-001 | CROSSCUT, SPOT_ON_LOCATION |
| STB-ZERO-PINE-1X10-96-001 | pine/select | 0.75 × 9.25 × 96 | 35.3 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X10-120-001 | pine/select | 0.75 × 9.25 × 120 | 44.12 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X10-144-001 | pine/select | 0.75 × 9.25 × 144 | 52.95 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PINE-1X2-72-001 | pine/select | 0.75 × 1.5 × 72 | 1.67 | 20/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL |
| STB-ZERO-PINE-1X2-96-001 | pine/select | 0.75 × 1.5 × 96 | 2.23 | 20/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL |
| STB-ZERO-PINE-1X3-72-001 | pine/select | 0.75 × 2.5 × 72 | 3.83 | 20/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL |
| STB-ZERO-PINE-1X3-96-001 | pine/select | 0.75 × 2.5 × 96 | 5.11 | 20/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL |
| STB-ZERO-SPF-2X10-96-001 | spf/construction | 1.5 × 9.25 × 96 | 12.69 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X10-120-001 | spf/construction | 1.5 × 9.25 × 120 | 15.88 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X10-144-001 | spf/construction | 1.5 × 9.25 × 144 | 19.05 | 8/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, DRILL, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PTGC-2X6-72-001 | syp-treated/ground-contact | 1.5 × 5.5 × 72 | 11.33 | 24/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X6-96-001 | syp-treated/ground-contact | 1.5 × 5.5 × 96 | 12.57 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X6-120-001 | syp-treated/ground-contact | 1.5 × 5.5 × 120 | 16.28 | 20/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X6-144-001 | syp-treated/ground-contact | 1.5 × 5.5 × 144 | 20.45 | 20/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X2-96-001 | syp-treated/above-ground | 1.5 × 1.5 × 96 | 5.54 | 40/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X6-168-001 | syp-treated/ground-contact | 1.5 × 5.5 × 168 | 23.72 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X4-72-001 | syp-treated/ground-contact | 1.5 × 3.5 × 72 | 6.81 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X4-96-001 | syp-treated/ground-contact | 1.5 × 3.5 × 96 | 7.5 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X4-120-001 | syp-treated/ground-contact | 1.5 × 3.5 × 120 | 11.41 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X4-144-001 | syp-treated/ground-contact | 1.5 × 3.5 × 144 | 14.07 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X4-168-001 | syp-treated/ground-contact | 1.5 × 3.5 × 168 | 17.21 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X4-192-001 | syp-treated/ground-contact | 1.5 × 3.5 × 192 | 19.15 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-SPF-2X2-96-001 | spf/construction | 1.5 × 1.5 × 96 | 3.3 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X6-168-001 | spf/construction | 1.5 × 5.5 × 168 | 13.86 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X8-168-001 | spf/construction | 1.5 × 7.25 × 168 | 19.43 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X10-168-001 | spf/construction | 1.5 × 9.25 × 168 | 26.78 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X10-192-001 | spf/construction | 1.5 × 9.25 × 192 | 35.91 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X12-96-001 | spf/construction | 1.5 × 11.25 × 96 | 18.69 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X12-120-001 | spf/construction | 1.5 × 11.25 × 120 | 24.05 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X12-144-001 | spf/construction | 1.5 × 11.25 × 144 | 29.4 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X12-168-001 | spf/construction | 1.5 × 11.25 × 168 | 35.18 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-SPF-2X12-192-001 | spf/construction | 1.5 × 11.25 × 192 | 47.15 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-PTAG-2X4-72-001 | syp-treated/above-ground | 1.5 × 3.5 × 72 | 5.15 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X4-168-001 | syp-treated/above-ground | 1.5 × 3.5 × 168 | 12.08 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X4-192-001 | syp-treated/above-ground | 1.5 × 3.5 × 192 | 15.96 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X6-72-001 | syp-treated/above-ground | 1.5 × 5.5 × 72 | 7.77 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X6-96-001 | syp-treated/above-ground | 1.5 × 5.5 × 96 | 10.29 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X6-120-001 | syp-treated/above-ground | 1.5 × 5.5 × 120 | 13.23 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X6-144-001 | syp-treated/above-ground | 1.5 × 5.5 × 144 | 16.17 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X6-168-001 | syp-treated/above-ground | 1.5 × 5.5 × 168 | 19.43 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X6-192-001 | syp-treated/above-ground | 1.5 × 5.5 × 192 | 25.73 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X8-96-001 | syp-treated/above-ground | 1.5 × 7.25 × 96 | 14.49 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X8-120-001 | syp-treated/above-ground | 1.5 × 7.25 × 120 | 18.69 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X8-144-001 | syp-treated/above-ground | 1.5 × 7.25 × 144 | 22.89 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-2X8-192-001 | syp-treated/above-ground | 1.5 × 7.25 × 192 | 36.54 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-54X6-96-001 | syp-treated/above-ground-decking | 1 × 5.5 × 96 | 6.83 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-54X6-120-001 | syp-treated/above-ground-decking | 1 × 5.5 × 120 | 8.82 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-54X6-144-001 | syp-treated/above-ground-decking | 1 × 5.5 × 144 | 10.82 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTAG-54X6-192-001 | syp-treated/above-ground-decking | 1 × 5.5 × 192 | 14.91 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X6-192-001 | syp-treated/ground-contact | 1.5 × 5.5 × 192 | 30.98 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X8-96-001 | syp-treated/ground-contact | 1.5 × 7.25 × 96 | 17.33 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X8-120-001 | syp-treated/ground-contact | 1.5 × 7.25 × 120 | 20.58 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X8-144-001 | syp-treated/ground-contact | 1.5 × 7.25 × 144 | 25.2 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTGC-2X8-192-001 | syp-treated/ground-contact | 1.5 × 7.25 × 192 | 33.67 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X4-96-001 | syp-treated/ground-contact-cedartone | 1.5 × 3.5 × 96 | 10.29 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X4-120-001 | syp-treated/ground-contact-cedartone | 1.5 × 3.5 × 120 | 14.18 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X4-144-001 | syp-treated/ground-contact-cedartone | 1.5 × 3.5 × 144 | 17.64 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X4-192-001 | syp-treated/ground-contact-cedartone | 1.5 × 3.5 × 192 | 23.63 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X6-96-001 | syp-treated/ground-contact-cedartone | 1.5 × 5.5 × 96 | 16.59 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X6-120-001 | syp-treated/ground-contact-cedartone | 1.5 × 5.5 × 120 | 21.53 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X6-144-001 | syp-treated/ground-contact-cedartone | 1.5 × 5.5 × 144 | 26.46 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-PTCT-2X6-192-001 | syp-treated/ground-contact-cedartone | 1.5 × 5.5 × 192 | 35.49 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION |
| STB-ZERO-WRC-2X4-96-001 | cedar/S4S | 1.5 × 3.5 × 96 | 13.13 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-2X4-120-001 | cedar/S4S | 1.5 × 3.5 × 120 | 17.64 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-2X4-144-001 | cedar/S4S | 1.5 × 3.5 × 144 | 21.95 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-2X6-96-001 | cedar/S4S | 1.5 × 5.5 × 96 | 23.1 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-2X6-120-001 | cedar/S4S | 1.5 × 5.5 × 120 | 30.98 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-2X6-144-001 | cedar/S4S | 1.5 × 5.5 × 144 | 38.33 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-54X6-96-001 | cedar/S4S-decking | 1 × 5.5 × 96 | 15.23 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-54X6-144-001 | cedar/S4S-decking | 1 × 5.5 × 144 | 23.94 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |
| STB-ZERO-WRC-54X6-192-001 | cedar/S4S-decking | 1 × 5.5 × 192 | 33.08 | 30/0 | true | D-001 | CROSSCUT, MITER_LIMITED, SPOT_ON_LOCATION, MILL_LONGITUDINAL_PROFILE, MILL_END_PROFILE |

**Sheet offerings**

| SKU | Material or description | Actual dimensions or fastener | USD | H/A | Offered | Cells | Declared operations |
|---|---|---|---:|---:|---|---|---|
| STB-ZERO-PLY-050-48X96-001 | pine/sheathing-4ply | 0.5 × 48 × 96 | 26.55 | 18/0 | true | S-001 | CROSSCUT, RIP, ROUTE_PROFILE |
| STB-ZERO-PLY-063-48X96-001 | fir/BCX-sanded | 0.625 × 48 × 96 | 50.28 | 12/0 | true | S-001 | CROSSCUT, RIP, ROUTE_PROFILE |
| STB-ZERO-OSB-075-48X96-001 | osb/square-edge | 0.75 × 48 × 96 | 28.46 | 20/0 | true | S-001 | CROSSCUT, RIP, ROUTE_PROFILE |
| STB-ZERO-PLY-025-48X96-001 | fir/sanded-utility | 0.25 × 48 × 96 | 14.61 | 14/0 | true | S-001 | CROSSCUT, RIP, ROUTE_PROFILE |
| STB-ZERO-PLY-025-48X48-001 | fir/sanded-utility | 0.25 × 48 × 48 | 8.47 | 10/0 | true | S-001 | CROSSCUT, RIP |
| STB-ZERO-PLY-038-48X96-001 | fir/ACX | 0.375 × 48 × 96 | 19.12 | 14/0 | true | S-001 | CROSSCUT, RIP, ROUTE_PROFILE |
| STB-ZERO-PLY-038-48X48-001 | fir/ACX | 0.375 × 48 × 48 | 11.09 | 10/0 | true | S-001 | CROSSCUT, RIP |
| STB-ZERO-PLY-075-48X96-001 | fir/ACX-sanded | 0.75 × 48 × 96 | 57.82 | 14/0 | true | S-001 | CROSSCUT, RIP, ROUTE_PROFILE |
| STB-ZERO-PLY-075-48X48-001 | fir/ACX-sanded | 0.75 × 48 × 48 | 33.54 | 10/0 | true | S-001 | CROSSCUT, RIP |

**Hardware offerings**

| SKU | Material or description | Actual dimensions or fastener | USD | H/A | Offered | Cells | Declared operations |
|---|---|---|---:|---:|---|---|---|
| STB-ZERO-HW-SHELFPIN-5MM-12-001 | 5 mm nickel angle shelf support — 12 pack | registered kit | 2.61 | 40/0 | true |  |  |
| STB-ZERO-HW-SHELFPIN-5MM-100-001 | 5 mm shelf pins — 100 box | registered kit | 15.25 | 8/0 | true |  |  |
| STB-ZERO-HW-SCREW-8X150-110-001 | #8 x 1-1/2 in wood screw 110 count (GRK-class reference) | registered kit | 15 | 20/0 | true |  |  |
| STB-ZERO-HW-ALCOVE-PACK-001 | Alcove hardware pack — pins + screws | registered kit | 18 | 25/0 | true |  |  |
| STB-ZERO-HW-CARRIAGE-BOLT-PACK-001 | Carriage-bolt pack | registered kit | 13.13 | 15/0 | true |  |  |
| STB-ZERO-HW-HINGE-CONCEAL-2-001 | Concealed hinge pair — alcove door option later | registered kit | 9.44 | 20/0 | true |  |  |
| STB-ZERO-HW-SCREW-10X300-LB-001 | #10 x 3 in construction screw 1 lb | registered kit | 12.58 | 12/0 | true |  |  |
| STB-ZERO-HW-CARR-BOLT-516-4-001 | 5/16 x 4 in carriage bolt box | registered kit | 6.81 | 18/0 | true |  |  |
| STB-ZERO-HW-COATED-SCR10-2P5-90-001 | Coated Wood screw #10 2.5" - 1 lb box (90) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=COATED; piecesPerPackage=90; treatedLumberRated=True | 9.44 | 40/0 | true |  |  |
| STB-ZERO-HW-COATED-SCR10-2P5-450-001 | Coated Wood screw #10 2.5" - 5 lb box (450) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=COATED; piecesPerPackage=450; treatedLumberRated=True | 36.74 | 40/0 | true |  |  |
| STB-ZERO-HW-COATED-SCR10-3P0-75-001 | Coated Wood screw #10 3" - 1 lb box (75) | kind=WOOD_SCREW_10; lengthIn=3; tier=COATED; piecesPerPackage=75; treatedLumberRated=True | 10.49 | 40/0 | true |  |  |
| STB-ZERO-HW-COATED-SCR10-3P0-375-001 | Coated Wood screw #10 3" - 5 lb box (375) | kind=WOOD_SCREW_10; lengthIn=3; tier=COATED; piecesPerPackage=375; treatedLumberRated=True | 40.94 | 40/0 | true |  |  |
| STB-ZERO-HW-COATED-SCR10-4P5-50-001 | Coated Wood screw #10 4.5" - 1 lb box (50) | kind=WOOD_SCREW_10; lengthIn=4.5; tier=COATED; piecesPerPackage=50; treatedLumberRated=True | 13.64 | 40/0 | true |  |  |
| STB-ZERO-HW-COATED-CB38-5P0-1-001 | Coated Carriage bolt 3/8 with nut+washer 5" - each (1) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=COATED; piecesPerPackage=1; treatedLumberRated=True | 1.35 | 40/0 | true |  |  |
| STB-ZERO-HW-COATED-CB38-5P0-25-001 | Coated Carriage bolt 3/8 with nut+washer 5" - 25-pack (25) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=COATED; piecesPerPackage=25; treatedLumberRated=True | 30.44 | 40/0 | true |  |  |
| STB-ZERO-HW-HOTDIP-SCR10-2P5-90-001 | Hot-dip galvanized Wood screw #10 2.5" - 1 lb box (90) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=HOT_DIP_GALVANIZED; piecesPerPackage=90; treatedLumberRated=True | 13.64 | 40/0 | true |  |  |
| STB-ZERO-HW-HOTDIP-SCR10-2P5-450-001 | Hot-dip galvanized Wood screw #10 2.5" - 5 lb box (450) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=HOT_DIP_GALVANIZED; piecesPerPackage=450; treatedLumberRated=True | 52.49 | 40/0 | true |  |  |
| STB-ZERO-HW-HOTDIP-SCR10-3P0-75-001 | Hot-dip galvanized Wood screw #10 3" - 1 lb box (75) | kind=WOOD_SCREW_10; lengthIn=3; tier=HOT_DIP_GALVANIZED; piecesPerPackage=75; treatedLumberRated=True | 15.74 | 40/0 | true |  |  |
| STB-ZERO-HW-HOTDIP-SCR10-3P0-375-001 | Hot-dip galvanized Wood screw #10 3" - 5 lb box (375) | kind=WOOD_SCREW_10; lengthIn=3; tier=HOT_DIP_GALVANIZED; piecesPerPackage=375; treatedLumberRated=True | 57.74 | 40/0 | true |  |  |
| STB-ZERO-HW-HOTDIP-SCR10-4P5-50-001 | Hot-dip galvanized Wood screw #10 4.5" - 1 lb box (50) | kind=WOOD_SCREW_10; lengthIn=4.5; tier=HOT_DIP_GALVANIZED; piecesPerPackage=50; treatedLumberRated=True | 19.94 | 40/0 | true |  |  |
| STB-ZERO-HW-HOTDIP-CB38-5P0-1-001 | Hot-dip galvanized Carriage bolt 3/8 with nut+washer 5" - each (1) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=HOT_DIP_GALVANIZED; piecesPerPackage=1; treatedLumberRated=True | 1.88 | 40/0 | true |  |  |
| STB-ZERO-HW-HOTDIP-CB38-5P0-25-001 | Hot-dip galvanized Carriage bolt 3/8 with nut+washer 5" - 25-pack (25) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=HOT_DIP_GALVANIZED; piecesPerPackage=25; treatedLumberRated=True | 41.99 | 40/0 | true |  |  |
| STB-ZERO-HW-STAINL-SCR10-2P5-90-001 | Stainless Wood screw #10 2.5" - 1 lb box (90) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=STAINLESS; piecesPerPackage=90; treatedLumberRated=True | 26.24 | 40/0 | true |  |  |
| STB-ZERO-HW-STAINL-SCR10-2P5-450-001 | Stainless Wood screw #10 2.5" - 5 lb box (450) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=STAINLESS; piecesPerPackage=450; treatedLumberRated=True | 104.99 | 40/0 | true |  |  |
| STB-ZERO-HW-STAINL-SCR10-3P0-75-001 | Stainless Wood screw #10 3" - 1 lb box (75) | kind=WOOD_SCREW_10; lengthIn=3; tier=STAINLESS; piecesPerPackage=75; treatedLumberRated=True | 30.44 | 40/0 | true |  |  |
| STB-ZERO-HW-STAINL-SCR10-3P0-375-001 | Stainless Wood screw #10 3" - 5 lb box (375) | kind=WOOD_SCREW_10; lengthIn=3; tier=STAINLESS; piecesPerPackage=375; treatedLumberRated=True | 120.74 | 40/0 | true |  |  |
| STB-ZERO-HW-STAINL-SCR10-4P5-50-001 | Stainless Wood screw #10 4.5" - 1 lb box (50) | kind=WOOD_SCREW_10; lengthIn=4.5; tier=STAINLESS; piecesPerPackage=50; treatedLumberRated=True | 38.84 | 40/0 | true |  |  |
| STB-ZERO-HW-STAINL-CB38-5P0-1-001 | Stainless Carriage bolt 3/8 with nut+washer 5" - each (1) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=STAINLESS; piecesPerPackage=1; treatedLumberRated=True | 3.66 | 40/0 | true |  |  |
| STB-ZERO-HW-STAINL-CB38-5P0-25-001 | Stainless Carriage bolt 3/8 with nut+washer 5" - 25-pack (25) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=STAINLESS; piecesPerPackage=25; treatedLumberRated=True | 78.74 | 40/0 | true |  |  |
| STB-ZERO-HW-SILICO-SCR10-2P5-90-001 | Silicon bronze Wood screw #10 2.5" - 1 lb box (90) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=SILICON_BRONZE; piecesPerPackage=90; treatedLumberRated=True | 41.99 | 40/0 | true |  |  |
| STB-ZERO-HW-SILICO-SCR10-2P5-450-001 | Silicon bronze Wood screw #10 2.5" - 5 lb box (450) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=SILICON_BRONZE; piecesPerPackage=450; treatedLumberRated=True | 167.99 | 40/0 | true |  |  |
| STB-ZERO-HW-SILICO-SCR10-3P0-75-001 | Silicon bronze Wood screw #10 3" - 1 lb box (75) | kind=WOOD_SCREW_10; lengthIn=3; tier=SILICON_BRONZE; piecesPerPackage=75; treatedLumberRated=True | 47.24 | 40/0 | true |  |  |
| STB-ZERO-HW-SILICO-SCR10-3P0-375-001 | Silicon bronze Wood screw #10 3" - 5 lb box (375) | kind=WOOD_SCREW_10; lengthIn=3; tier=SILICON_BRONZE; piecesPerPackage=375; treatedLumberRated=True | 188.99 | 40/0 | true |  |  |
| STB-ZERO-HW-SILICO-SCR10-4P5-50-001 | Silicon bronze Wood screw #10 4.5" - 1 lb box (50) | kind=WOOD_SCREW_10; lengthIn=4.5; tier=SILICON_BRONZE; piecesPerPackage=50; treatedLumberRated=True | 57.74 | 40/0 | true |  |  |
| STB-ZERO-HW-SILICO-CB38-5P0-1-001 | Silicon bronze Carriage bolt 3/8 with nut+washer 5" - each (1) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=SILICON_BRONZE; piecesPerPackage=1; treatedLumberRated=True | 6.29 | 40/0 | true |  |  |
| STB-ZERO-HW-SILICO-CB38-5P0-25-001 | Silicon bronze Carriage bolt 3/8 with nut+washer 5" - 25-pack (25) | kind=CARRIAGE_BOLT_3_8_NUT_WASHER; lengthIn=5; tier=SILICON_BRONZE; piecesPerPackage=25; treatedLumberRated=True | 136.49 | 40/0 | true |  |  |
| STB-ZERO-HW-ZINCIN-SCR10-2P5-90-001 | Reference Wood screw #10 2.5" - 1 lb box (90) | kind=WOOD_SCREW_10; lengthIn=2.5; tier=ZINC_INTERIOR; piecesPerPackage=90; treatedLumberRated=False | 5.24 | 40/0 | true |  |  |

## 5. Manufacturing engine from request to Q

The sole adopted planner, occupancy calculator and Q engine is [store-manufacturing-core.mjs](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/evaluation/engine/store-manufacturing-core.mjs). The public definition validators, catalog reader and request layer guard its inputs; they are not competing estimators. The machine layer consumes its selected ledger. It does not independently invent a route or recalculate a different quote.

### 5.1 Compilation and validation

The outer request boundary admits `{requestType, requestId, demand, manifest}`. The compiler receives the three request fields and the manifest as a separate argument. It converts the definition into `STORE-MANUFACTURING-JOB-1`: `jobId`, `revision`, the independent manifest, `boards`, `sheets`, `items` and an unchanged source copy. The neutral job is an internal calculation representation, not a second customer meaning authority.

For a user-defined board, the compiler requires parallel ends, long-long outer-edge length, miter-face cutting, reference-cut datum establishment, a positive defined workpiece length, a nonempty part list and an empty unresolved-condition list. Only declared spot features are accepted in that class. Declared saw count must be parts plus one reference cut; spot count must equal all named spot features. It makes one atomic board package with `singleParent: true`, `preserveOrder: true`, and the required minimum parent length. A cut-package definition becomes neutral board packages and item lines. A sheet definition becomes one identified sheet package with all its features and returned-piece requirement.

Validation establishes unique, nonblank component, feature, package and item identities; positive lengths; valid integer quantities; allowed fields; complete independent manifest coverage; and absence of unhandled requirements. Equality of coverage is a set comparison, not merely equal counts. Each manifest component must be represented with its own identity/quantity. A feature cannot disappear because the planner can price the remaining lines. The engine either produces a complete whole-job result or returns a disposition without Q.

Numbers must be finite JSON numbers, not text that happens to parse as a number. Undeclared data are refused rather than discarded. Consequently an extra finish, arbitrary controller instruction or unsupported geometry cannot be silently excluded from the quote. The internal canonical serializer rejects undefined/nonfinite calculation values, sorts object keys recursively and preserves array order.

### 5.2 Task grouping and operation requirements

Board requirements are derived from geometry: square ends require `CROSSCUT`, nonzero declared face miters require `MITER_LIMITED`, named spots add `SPOT_ON_LOCATION`, and narrowing/profile requirements add `MILL_LONGITUDINAL_PROFILE`. An explicitly supplied required-operation list must be representable by those actual requirements. An additional operation with no implemented representation yields `REQUIRED_OPERATION_NOT_REPRESENTED:<operation>`.

Packages with identical material, end geometry, width preparation and other selection criteria are grouped together. Their package IDs do not prevent shared parent selection. Atomic single-parent definitions retain a package-specific group key. Group keys are sorted canonically. Within ordinary groups, parts are sorted longest first, then by part ID; atomic user-board order is preserved. Thus changing a customer's partition of identical packages does not hide a better parent pattern, while the meaningful single-workpiece order remains binding.

Tasks run as sorted board groups, then sheet packages, then pooled hardware selectors. This is a fixed plan order. Different part permutations, section rotation, interleaving of cells, concurrent machines and remnant reuse are outside the modeled plan space. “Best” below always means best among the enumerated, declared alternatives.

### 5.3 Candidate eligibility

`boardCandidates` matches material and grade, calls the catalog eligibility rules, filters dimensional envelope and minimum parent length, and evaluates each part's required geometry against a candidate's actual section. A material row must support all derived operations on D-001. Rows sort by selling price, parent length and SKU, but that is only search order: a cheapest individual row may require more parents or more preparation and lose at whole-job cost.

Angles must be numeric from 0 to 45 degrees. A nonzero angle requires parallel, long-long, miter-face end meaning. Missing nonzero end meaning is unresolved; an out-of-model angle is refused. Square packages can omit those redundant end facts, but supplied facts must agree. Actual width must be 1.5–12 inches; actual thickness must be at least 0.75 and at most 3.5 inches for sawing, and at most 1.5 inches for routing. Prepared width must remain at least 1.5 inches and cannot exceed the parent width.

Hardware and sheet eligibility use their own selector and model rules. The engine does not substitute a different wood grade, change a customer's fastener finish, or shrink an aperture to rescue feasibility.

### 5.4 Parent patterns and whole-job search

For a board parent of length $L_s$, kerf $k=0.125$ inches and required controlled retained end $L_r=24$ inches, the assignable capacity is

$$C=L_s-k-L_r,$$

and each part consumes $L_i+k$. A pattern fits only when

$$\sum_i(L_i+k)\le C.$$

The first kerf accounts for reference-cut establishment; subsequent kerfs account for every part separation. The retained end is part of stock consumption economics and control assumptions. A 72-inch parent with two 18-inch parts consumes $0.125+2(18+0.125)=36.375$ inches and leaves 35.625 inches. A hypothetical 60-inch parent leaves 23.625 inches and fails the retained-control-length rule. Minimum parent length and capacity are separate checks.

For a non-atomic group, parts are clustered into geometry/feature signatures excluding feature IDs. Enumeration chooses counts from each signature, retaining the first identified instances of equal geometry. Every next parent pattern must cover the first remaining part, avoiding equivalent empty/redundant branches. A group may contain at most 20 distinct part signatures. Atomic jobs test the entire remaining list as one pattern.

A depth-first whole-job search chooses parent patterns, sheet rows and hardware packages together. It maintains cumulative SKU usage and rejects any assignment exceeding `onHand - allocated`. It accumulates **unrounded** material, hardware, occupied hourly service and fixed cut costs, carries the previous dimensional axis state between parents, memoizes remaining tasks/inventory/state, and prunes branches whose accumulated cost exceeds the best complete result within `EPS=1e-9`. Equal-cost alternatives retain the first deterministic result encountered.

The default node limit is 200,000. Exhaustive completion returns the best complete plan in this space. A limit reached after finding a complete feasible plan is reported as `BOUNDED_FEASIBLE_PLAN`; it is not a claim of global optimality. A limit reached without a complete plan is `UNRESOLVED / SEARCH_LIMIT_WITHOUT_COMPLETE_PLAN`. Exhausted feasible stock combinations without a complete answer are `UNAVAILABLE / NO_COMPLETE_PLAN_WITH_AVAILABLE_INVENTORY`, unless a more specific planning problem governs the disposition. Partial support does not produce a customer whole-job Q.

### 5.5 Ledger state and occupancy

A dimensional state contains nominal longitudinal coordinate `C`, transverse `Y`, angle `A`, saw stroke `S`, spot `Z` and router `RZ`. Initial C/Y/A/S are zero; vertical tool clearances are established for the parent thickness. Parent transitions raise tools if necessary, then record a 36-second load/seat allowance and nominal C=0. The reference operation does not claim an encoder reset or inspected datum.

Each event records `kind`, seconds, subject, parent, cell, category, billing class and relevant coordinates/tool/feature facts. Events become a single global sequence with cumulative `startSec` and `endSec`. Their summed duration is the reported occupancy. Processing allowances, loading, reference, motion, cuts, spotting, milling, release and labeling all contribute; zero-duration identity/coverage/tool-state events remain visible.

The complete ledger is **serial occupancy**. Even though D-001 and S-001 are separate cell families, the quote does not subtract overlap for simultaneous use. Fixed-price panel work has occupancy but belongs to a separate billing class. The engine cannot charge those same seconds again at the hourly rate.

### 5.6 Motion timing

For a distance $d=|x_1-x_0|$, speed limit $v$ and acceleration $a$, symmetric accelerate/decelerate motion is:

$$t(d,v,a)=\begin{cases}0&d=0\\2\sqrt{d/a}&d<v^2/a\\d/v+v/a&d\ge v^2/a.\end{cases}$$

Distance is inches for linear axes and degrees for A; velocity is units/second and acceleration units/second². Short moves use a triangular profile; long moves attain the commanded limit. C uses the declared X-axis kinematics, router Z uses the Z-axis kinematics. No jerk limit, blending, servo-following error, real safety delay or machine-controller cycle resolution is established by this equation.

For X/C, $v=8$, $a=32$: a 27-inch index takes $27/8+8/32=3.625$ seconds; a two-inch move is at the transition and takes 0.5 seconds. An angle move to 26.387799961243 degrees at 30 degrees/s and 120 degrees/s² takes about 0.93710 seconds before the 0.1-second angle-settle allowance.

Saw processing speed is declared from tooling:

$$v_{saw}=1800\,\text{rev/min}\times80\,\text{teeth/rev}\times0.003\,\text{in/tooth}\times0.5=216\,\text{in/min}=3.6\,\text{in/s}.$$

Spot feed is $3000\times0.008=24$ in/min = 0.4 in/s. Dimensional router feed is independently declared 48 in/min = 0.8 in/s; cutter diameter does not determine it. Sheet routing is 60 in/min, with a separate geometric path model.

### 5.7 Reference and saw operations

The engine positions A when its target differs from current A, waits 0.1 seconds to settle, and adds a 0.25-second clamp allowance. A saw cycle records spindle on, approach S=1.5 inches at rapid 6 in/s and 24 in/s², processing through a virtual distance $W/\cos\theta$ at 3.6 in/s and the same acceleration, retract S to zero at rapid, 0.05-second off allowance and spindle off. Reference and separation cycles use the actual prepared width.

The saw-stroke coordinate is the declared **virtual width-over-cosine benchmark**. It does not establish the travel of an actual downward-moving circular blade or clearance for an apparatus. Blade center, sweep, tooth entry/exit, support and measured machine stroke require separate registration.

After each cut, the engine subtracts the nominal longitudinal kerf and records `NOMINAL_DATUM_CAPTURE` with 0.01 seconds, convention `NOMINAL_C_REBASE_AFTER_LONGITUDINAL_KERF_ALLOWANCE`. The retained face/kerf transformation is a named physical gap. A nominal relabeling is not proof that the new retained physical face lies at the correct zero.

For each finished part, stock indexes to C=`-lengthIn`, receives a 0.05-second position-verification allowance, records the contact screen, runs the saw cycle, subtracts length plus kerf from remaining stock, and rebases nominal C. Remaining stock must be at least 24 inches. The part geometry records modeled dimensions and named features, with result class `MODELED_COMPONENT_NOT_INSPECTED`.

### 5.8 Width preparation and profiles

A cut package may leave actual width unchanged, specify a narrower finished width, or declare a two-edge preparation. Finished width and removals must reconcile within $10^{-6}$ inch. An explicitly declared two-edge removal is limited per side to the lesser of cutter diameter and the one-inch registered radial-removal maximum. Y travel must remain within ±14 inches. The router thickness envelope is 1.5 inches.

By default, narrowing removes stock from the far edge while the fence edge stays at zero. If that implicit removal exceeds the cutter diameter, a `RIP_PROCESS_DECLARED` event identifies a longitudinal offcut width `removal - diameter`; it is not valued as recovered material. `LONGITUDINAL_OFFCUT_CONTROL_NOT_ESTABLISHED` remains a physical gap. Removing material at the fence edge similarly requires establishment of the new fence datum. The modeled path cannot resolve restraint of the separated strip.

Parent edge preparation is routed over the **remaining parent length**, not merely the sum of requested finished-part lengths. This explains some otherwise surprising time changes when a longer purchased parent is selected. For far-edge removal, cutter center Y is `fenceRemoval + preparedWidth + diameter/2`; the fence-edge center is `fenceRemoval - diameter/2`. The starting C is the tool station at 36 inches. A routing pass moves C from the start to `start - pathLength` while the cutter is at its pass depth, then raises RZ and resets C. Transverse placement and a 0.5-second ready allowance precede an edge's passes.

For thickness/depth $D$ and registered axial pass depth $p=0.75$, passes are `ceil(D/p - EPS)`. RZ first reaches the stock surface, then the successive target `thickness - min(D, pass*p)` at 24 in/min plunge feed and Z acceleration 16 in/s²; routing traverses at 48 in/min and X acceleration 32; each pass retracts to thickness+0.25 inches. Diameter, axial pass depth, radial engagement and feed are distinct facts.

Named standalone longitudinal profiles are limited to 60 inches and the containing part length. A feature already covered by complete parent preparation must match the implemented meaning: path equals part length, Y equals finished width and depth equals stock thickness. It then receives a zero-time coverage event instead of a second milling charge. A profile that does not match that representation is refused; arbitrary profile geometry is not generalized by the feature name.

### 5.9 Spot geometry and timing

Spots are customer-named features, not a generic hole count. Across-width rule is either centered on the prepared wide face or an allowed 1.5/2-inch inset from its edge. Centered spots cannot also carry a contradictory inset. Tool diameter and full-diameter depth, when supplied, must match the registered operation. A spot must fit within the part length by at least cutter radius at each end; an explicit longitudinal center rule also requires X=`length/2`.

The 3/16-inch drill has a 118-degree point. Point height is

$$h_p={0.1875/2\over\tan(118^\circ/2)}=0.056330683\ldots\ \text{in}.$$

A 3/16-inch **full-diameter** spot depth therefore requires total plunge

$$d_z=0.1875+h_p=0.243830683\ldots\ \text{in}.$$

On 1.5-inch stock, Z reaches surface 1.5, then target 1.256169316966 inches above the support plane, then retracts to 1.75. Full-diameter depth is not total drill-tip travel. The operation is a spot, not a claimed through-hole or fastener pilot adequate for every use.

The engine constructs global longitudinal spot positions before separating parts. A part starts after all earlier lengths and kerfs; global feature X equals that start plus local X. Spots are sorted by global X and feature ID. To place a feature under the fixed station at X=36, C=`36-globalX`. The first spot on a parent starts the spindle and waits 0.5 seconds; Y moves only as needed. Every feature indexes C, adds position verification, records contact, approaches stock at rapid, plunges at 0.4 in/s and retracts to clearance. All spots on that parent precede its part-separation cuts. This prevents a released part from being assumed controllable as uncut stock.

### 5.10 Sheet geometry and compensation

An arched aperture has width $w$, straight-side height $h$ and rise $r$, with positive dimensions and $r\le w/2$. Its circular-arc radius and sweep are

$$R={w^2\over8r}+{r\over2},\qquad \theta=2\arcsin{w\over2R}.$$

The nominal outline comprises bottom edge, two straight sides and arc. S-001 uses a 0.5-inch cutter with radius $c=0.25$. The adopted cutter-center perimeter is calculated from an inward-offset arc and trimmed straight segments, not by blindly subtracting $\pi$ times tool diameter. Define

$$R_i=R-c,\quad b_i=w/2-c,\quad y_o=h+r-R,$$
$$y_t=y_o+\sqrt{R_i^2-b_i^2}.$$

Then the routed centerline perimeter is

$$P=(w-2c)+2(y_t-c)+R_i\,2\arcsin(b_i/R_i).$$

For the default 36×24-inch opening with 12-inch rise, $R=19.5$ inches. These relationships explicitly include the cutter radius in both arc and side/bottom intersections. The older approximation discussed in the archive must not replace this current calculation.

Placement is centered on the 96×48 parent unless an admitted pattern offset supplies a different declared location. Every aperture bounding box must fit the registered central field X=24..72 and Y=6..42. Apertures may not overlap. The engine retains feature identity and calculated geometry; it does not construct a commissioned XY controller program from this perimeter alone.

### 5.11 Retention tabs and split rules

The arched center is retained by tabs. One-inch bridges, at least four tabs, at least five-percent retained perimeter and no more than 24 inches of free span are declared constraints. Perimeter locations are developed distances starting at the bottom-left, then bottom, right side, arc and left side. AUTO mode selects a count sufficient for count, retained fraction and spacing; phase is chosen from transition residues to avoid locating bridges across geometric transitions. It can increase count through at most 64 additional attempts. The resulting tab count can exceed the customer's requested minimum.

CUSTOM positions are literal developed arclengths. Count must match; positions must be finite in `[0,P)`; bridges must not overlap; free spans and retained fraction must pass; and bridges must clear transitions by at least half bridge length. A center split additionally requires at least two perimeter tabs on each half with sufficient distance from the split corridor. Calling four evenly spaced points “tabs” is insufficient if one falls at a contour transition or leaves a split half uncontrolled.

A straight split is supported only as one vertical centerline within a named aperture. Its path length is $h+r$. The nominal half-width after the cutter corridor is `(w - 0.5)/2`, which must be at least three inches. AUTO split tabs choose at least two, satisfy five-percent retention and maximum spacing, and lie at `L*(i+1)/(n+1)`. CUSTOM split mode needs explicit positions or returns `UNRESOLVED / SPLIT_TAB_POSITIONS_REQUIRED`. Positions must clear endpoints, bridges may not overlap, and maximum free spans/fraction must pass.

Tabs are modeled retention bridges. Their strength, workholding, cutter loads, release method and physical safety are not established by geometric spacing. Returned centers/halves remain attached by those bridges in the modeled result.

### 5.12 Panel cuts and returned pieces

Panel crosscuts use distances from LEFT/RIGHT ends; rips use BOTTOM/TOP edges. Coordinates are resolved against the original parent, not a repeatedly relabeled intermediate sheet. Crosscut travel is 48 inches; rip travel is 96. A panel-saw path must clear the routed aperture by `1 + 0.25 + 0.125/2 = 1.3125` inches: declared clearance, positioning tolerance and half kerf. Cut results must remain at least six inches even under worst-case tolerance/kerf at each affected edge.

Current staging does not mix crosscut and rip sequences in one job: that is `ORTHOGONAL_PANEL_STAGING_NOT_DEFINED`. The engine cannot silently choose a transfer/reorientation process it has not registered.

Returned piece bounds use half-kerf actual nominal cut coordinates; eligibility uses the more conservative tolerance bounds. Return-all means all panel pieces and the retained arched center, or retained split halves, are represented. The aperture center's nominal bounding width is `w - 0.5`, height `h+r-0.5`; split half width is `(w - 0.5)/2`. These are cutter-corridor-adjusted modeled bounds. Tab bridges remain in those components. There is no claim that they have been manually separated, trimmed or inspected.

### 5.13 Sheet operation time

A routed sheet receives 120 seconds load/reference and 60 seconds release. Each contour/split pass has 10 seconds plunge/retract, centerline path divided by 60 in/min, and two seconds per tab transition. Number of passes is `ceil(thickness/0.5 - EPS)`. The timing retains the full centerline distance even through tab bridges and then adds the transition allowances; it is conservative on travel and does not subtract bridges as absent path.

A panel cut takes 45 seconds alignment plus path/feed travel:

- Crosscut: $45+48/150\times60=64.2$ seconds.
- Rip: $45+96/150\times60=83.4$ seconds.

Each costs a separately declared $10. Those occupied seconds are classified `PER_CUT` and excluded from hourly-billed seconds. Labels take 10 seconds per returned piece and are hourly work. Feature-answered events, including the pattern identity, carry coverage without an additional processing charge. Chapter 8 works through the five-piece default Playhouse result.

### 5.14 Hardware package selection

For a structured selector the engine matches kind, gauge **or** diameter, positive length, finish and optional unit `piece`. It requires exactly one dimensional selector, not simultaneous gauge and diameter. Matching rows must be offered and priced. An exact SKU query is restricted to a hardware row; a functional ID must be listed in `satisfiesRequirementIds`.

Identical selector lines pool their quantities. Package cost is `ceil(pieces / piecesPerPackage) * sellingPrice`; choices sort by this extended amount, then SKU. The global search enforces inventory together with board/sheet usage. An exact-SKU or functional-kit request uses its quantity directly as package count. The engine does not charge machine occupancy for merely buying hardware. Delivery, assembly and site installation are separate commercial scope.

### 5.15 Whole-job economics and rounding

The declared annual machine/service pool is $120,000 over 600 productive hours. Break-even occupied-hour cost is $200. Target gross margin is 20%, giving

$$R_h={120000\over600(1-0.20)}=250\ \text{USD/hour}.$$

Let $T_h$ be hourly-billed occupied seconds and $N_c$ fixed-price panel cuts. Whole-job service and Q follow the actual implementation:

$$S_h=\operatorname{round}_{0.01}(250T_h/3600),\qquad S_c=10N_c,$$
$$Q=\operatorname{round}_{0.01}(M_{raw}+H_{raw}+S_h+S_c).$$

Material/hardware totals are also reported rounded to cents; catalog unit prices already carry cents. The important implementation detail is that hourly service is rounded **before** total Q, at the whole-job service boundary. Search comparisons use unrounded service costs. It is inaccurate to say every intermediate value remains unrounded until one final Q rounding.

Parent-support summaries may round local service/Q individually. Their cents need not sum to the whole-job rounded amount. The complete result's Q is authoritative. `totals.sumOfSupportableLines` is retained as an alias of complete Q; it is not authority to purchase only the supported part of an incomplete definition. `manual_cut_service` is the field name for fixed-price panel cuts, not a measurement of free operator labor.

### 5.16 Completion and calculation identity

A successful result is `SUPPORTABLE`, `complete: true`, with verified manifest coverage, selected stock, parent plans, modeled operations, components, labels/returned pieces, time, cost totals and Q. All requested components/features/items must be answered. Selected stock is a proposed plan; components are modeled and not inspected. Unsupported/unresolved/unavailable jobs have no whole-job Q or totals authorizing an order.

Calculation identity binds model and inputs using canonical SHA-256. `inputHash` covers `{job, model, catalog}`. `resultHash` covers the complete engine result **before** its `calculationIdentity` is added. That avoids hashing a value containing its own hash. The Store request layer then adds a receipt binding request/demand/manifest, catalog, registered model/configuration, Store release, timestamp, disposition and calculation identity. Repeated identical calculation inputs yield identical calculation identities; a new inquiry's receipt can differ by request identity or timestamp.

A hash is content identity. It cannot establish that an actor is authenticated, material is physically available, motion occurred, a component passed inspection or payment settled. Those facts require the separately owned commercial and local evidence explained later.

### 5.17 Worked calculations and sensitivities

Current Project 1 selects one $4.81 parent, no hardware, 86.46953628299116 hourly-billed seconds and no fixed cuts:

$$S_h=\operatorname{round}_{0.01}(86.46953628299116\times250/3600)=6.00,$$
$$Q=4.81+6.00=10.81.$$

Its occupancy categories are load 36, index 13.929593332041435, reference 2.9664862842489175, spot 3.7004840982030034, saw 5.872972568497836 and release 24 seconds. These categories sum to the single declared ledger total. The historical $11.09 answer has its own stock, service calculation and hashes in chapter 7.

Changing part length changes index distance, feature coordinates when System derives them from length, available parent patterns, retained stock and possibly parent SKU/count. Crossing a capacity boundary can add an entire parent, another reference cycle and another 60 seconds load/release. Changing angle changes A motion and the virtual saw span `width/cos(angle)`; changing nominal width can change both material price and saw time. Narrowing changes routing geometry/pass count and can add physical datum/offcut gaps. Changing stock thickness changes vertical motion and axial pass count. Adding a spot adds approach/plunge/retract and indexing but may reuse a started spindle and unchanged Y.

Changing a sheet aperture changes circular geometry, compensated perimeter, tab count and field/clearance eligibility. Changing hardware quantity within a package boundary may leave Q unchanged; crossing that boundary adds a package. Changing a seller charge or tax is not a manufacturing-engine sensitivity: it changes the seller's offer under commercial authority. A customer's revised supported value always requires a fresh definition, independent manifest, Store inquiry and appropriately bound answer; an old price label is not revalidation.

## 6. Registered machine functions

### 6.1 Registered model and units

[configuration.mjs](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/configuration.mjs) reads [manufacturing-core-0.1.json](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/data/machine/manufacturing-core-0.1.json), admits only the declared configuration fields, and constructs the deeply frozen engine model. The configuration ID and model ID are both `STORE-MANUFACTURING-CORE-0.1`, but their hashes cover different objects. Configuration parameters override the permitted model inputs; the expanded model includes the remaining declared geometry, time, economics and assumptions. Its execution class is `DECLARED_OCCUPANCY_EVENT_MODEL`; measured and commissioned are false and physical authority is false.

All lengths are inches, angles degrees, times seconds and money USD. Cell identifiers D-001 and S-001 classify modeled operations. They are not asset serial numbers of commissioned physical machines. The expanded model returned by `createModel()` is the exact parameter authority for the frozen engine; the JSON is its current registration input.

### 6.2 Dimensional parameter register

| Function | Current registered values | Meaning and owner |
|---|---|---|
| Handling | Load/seat 36 s; release/label 24 s per parent | Store declared occupancy; actual handling measured by laboratory/local operator |
| Longitudinal X/C | 8 in/s, 32 in/s² | Store benchmark kinematics; actual gearing/encoder/limits local |
| Transverse Y | 4 in/s, 16 in/s² | Tool placement across the wide face |
| Angle A | 30 deg/s, 120 deg/s² | Face-miter angle position |
| Saw S | Rapid 6 in/s, 24 in/s² | Virtual stroke, not commissioned saw travel |
| Spot Z and router RZ | Rapid 2 in/s, 16 in/s² | Vertical approach/retract benchmark |
| Allowances | A settle .1 s; clamp .25; saw off .05; datum capture .01; position verify .05; spot ready .5 | Explicit process delays; no sensor proof created by waiting |
| Saw tooling | 20-in blade; 1800 rpm; 80 teeth; .003 in/tooth; .5 finish factor | Declared processing speed 216 in/min |
| Saw geometry | Approach 1.5 in; kerf .125; maximum angle 45 deg | Stroke basis `VIRTUAL_WIDTH_OVER_COSINE_BENCHMARK` |
| Spot tooling | Diameter .1875 in; 3000 rpm; .008 in/rev; 118-deg point | 24 in/min feed; full-diameter depth .1875 in |
| Spot placement | Clearance .25 in; allowed edge insets 1.5 or 2 in | Center placement also supported |
| Router tooling | Diameter 1 in; axial pass depth .75 in | Separate diameter and depth registration |
| Router feeds | Longitudinal 48 in/min; plunge 24 in/min | Explicit assumptions, not derived from diameter |
| Router limits | Startup .5 s; clearance .25 in; standalone profile length 60 in; radial removal per side 1 in; Y travel ±14 in | Parent preparation and standalone profile rules differ as explained in 5.8 |
| Fixed stations | Saw X=0; tool X=36; rollers X=24 and 48 | Registered benchmark longitudinal locations |
| Stock section | W 1.5..12 in; T .75..3.5 in sawing, T ≤1.5 in routing | Actual dimensions, not nominal lumber labels |
| Retained stock | At least 24 in after reference and separations | Control-length screen, not proof of two-roller contact |
| Face convention | `NOMINAL_C_REBASE_AFTER_LONGITUDINAL_KERF_ALLOWANCE` | Physical retained-face transform remains unregistered |

D-001 sawing, spots and profiles share the same parent movement and reference chain. Operation ordering prevents longitudinal indexes with a tool modeled in the stock. The engine raises vertical tools between passes/indexes and retracts the saw before nominal capture. Replay checks those state relationships. Tool power events are model states; they do not prove actual spindle speed, guard closure or stock restraint.

### 6.3 Sheet parameter register

| Function | Current registered values | Meaning |
|---|---|---|
| Parent | 96×48 in; thickness .25..75 in | Declared sheet envelope |
| Router field | 48×36 in, centered at X=48/Y=24 | Field bounds X=24..72/Y=6..42 |
| Cutter/pass | .5-in diameter; .5-in axial pass depth | S-001 independent of D-001's one-inch cutter |
| Routing | 60 in/min; load/reference 120 s; release 60 s | Full geometric path timing |
| Per pass | Plunge/retract 10 s; tab transition 2 s each | Declared occupancy allowances |
| Features | Minimum feature dimension 6 in; split half width at least 3 in | Geometry admission |
| Tabs | One-inch bridges; at least 4 contour tabs; retained fraction .05; free span ≤24 in; at least 2 outer tabs per split half | Geometric retention constraints |
| Panel saw | Kerf .125 in; position tolerance ±.25 in; minimum piece 6 in; clearance 1 in | Conservative routing/cut separation |
| Panel occupancy | Align 45 s; feed 150 in/min | 64.2 s crosscut, 83.4 s rip |
| Panel charge | $10 per cut | Separately billed; occupancy excluded from hourly charge |
| Labels | 10 s per returned piece | Hourly occupancy |

The model describes contour lengths, tabs, panel-cut coordinates, returned bounds and timing. Current lowering transports those evaluated facts as occupancy records. A physical sheet apparatus still needs registered clamping/vacuum/support, fixture origin, tool length/radius measurements, tabs suitable for actual cutting loads, safe panel transfer and demonstrated clearance. A correct perimeter does not establish these physical prerequisites.

### 6.4 Datums and controlled stock movement

The proposed dimensional apparatus has three references:

- **Datum A, fence:** locates the longitudinal side of the stock and establishes across-width coordinates. Fence straightness, parallelism, tool clearances and stock contact must be inspected.
- **Datum B, support plane:** establishes the vertical zero used for actual thickness, tool surface and plunge coordinates. Support flatness, tool offsets and stock seating are physical facts.
- **Datum C, longitudinal workpiece reference:** establishes where locations measured along the part occur relative to fixed stations. A reference cut creates the intended end face; the machine must register how that physical face relates to its measured travel coordinate.

The model's `A` **axis** is miter angle; it is not Datum A. This naming collision must not make an angle command look like fence calibration. Likewise C is a local workpiece coordinate convention, not a new physical actuator.

The fixed-station concept moves restrained stock under registered tools. A spot at global part coordinate $x_f$ reaches a station at $x_t$ when nominal stock offset is $C=x_t-x_f$. A finished-length separation reaches the saw at zero when nominal C=`-length`. These are geometric transforms within an established reference system. Their reliability depends on controlled stock advance, roller synchronization, verified seating and no unobserved slip.

The historical Project 1 controller uses a continuous X master and a local C offset: `C = Xmaster - offset`; a local target becomes `XmasterTarget = offset + Ctarget`. Reference capture changes the local offset, not encoder zero. Current occupancy records use nominal C directly and do not instantiate that controller's geared servo sequence. Both require the physical face transform to be established before a production length is trusted.

### 6.5 Kerf faces and reference retention

A saw has two cut faces separated by kerf. “Saw at zero” is incomplete unless the registered reference names blade center/face, retained face, discarded face, approach direction, angle and material side. Long-long, long-short and short-short dimensions differ for angled faces. A model must preserve the customer's stated datum; it cannot switch length conventions because one expression is easier to price.

Project 1 revealed the exact issue: after a reference cut represented at nominal zero, the retained physical face may lie at the kerf offset. Relabeling travel C=0 does not physically move that face. Depending on the registered face convention, a target nominally described as -18 might require an additional .125-inch transformation. The record gives this as an unresolved engineering correspondence, not a correction to be inserted into the sealed sequence or the adopted engine without authority.

Reliable dynamic retention needs the reference face's relationship to X/roller travel maintained throughout feeding, spotting and cutting. An observed slip, loss of contact, restraint disturbance, removed/reseated parent or changed fence invalidates that relation. Recovery requires stop, record the event, establish what material remains, inspect/reseat, reestablish the necessary datum and admit a newly appropriate local plan. Blindly restarting the next sequence number would presume a reference that may no longer exist.

### 6.6 Contact screens and physical restraint

For remaining length $L$ at nominal C, the model screens occupied stock interval `[C, C+L]` against rollers at 24/48 and tool station at 36 inches. It records whether each station lies within that interval. At Project 1's first spot C=27, the 24-inch roller lies outside; at its second separation, the 48-inch roller can lie beyond the remaining stock. Thus retaining 24 inches is not equivalent to continuous two-roller contact.

The adopted model carries `TWO_ROLLER_CONTACT_NOT_ESTABLISHED` as a physical gap when that arrangement lacks demonstrated contact. The original review calls its related blocker `ONE_ROLLER_CONTROL_UNRESOLVED`. These are stage-specific records, not interchangeable proof that the proposed apparatus must fail. Suitable supplemental restraint or a differently verified feeding arrangement may be engineered; it has not been commissioned by this software calculation.

A roller's coordinate being inside the stock interval proves only longitudinal overlap in the declared geometry. It does not prove normal force, friction, torsional restraint, traction under cutter loads, resistance to stock bow, synchronization of two feeds, safe separation or retention of an offcut. Physical admission must verify these conditions with appropriate instrumentation and repeatable disturbance tests.

### 6.7 Fixed tooling and local lowering

Before supported orders can eliminate separate per-order CAD/CAM preparation, engineering must register: supported definition meanings and transformations; actual stock envelopes; fixture and datum establishment; tool identity/radius/length/kerf; station/axis transforms; end-face conventions; safe approach/retract; cutter engagement and pass rules; velocity/acceleration/feed; restraint/contact conditions; limits/interlocks; expected component identities; inspection tolerances; interruption/recovery; and evidence custody.

A supported customer's definition then supplies variable dimensions, feature locations and material requirements to those pre-engineered functions. Store selects a feasible stock/operation plan and predicts occupancy; a commissioned local lowering would translate admitted machine-neutral facts using that apparatus's registered coordinates and safety state. The customer does not design a new cutter path manually for every instance. The gain comes from **reusing verified engineering within a bounded envelope**, not from allowing an unbounded natural-language request to bypass manufacturing engineering.

Current [lowering.mjs](https://github.com/GeorgePlattDemo/store-zero/blob/f7123a73c1ca60aa7eb180a86a1c365eaffe95db/src/machine/lowering.mjs) binds the exact evaluated occupancy ledger to the registered configuration and packet. It has no commissioned motion authority. The historical controller reference demonstrates a more detailed candidate interpreter and is preserved separately. Neither a patent drawing nor a virtual replay substitutes for local registration and physical acceptance.

### 6.8 Proposed physical apparatus and commissioning

Program's [bounded-cell trial](https://github.com/GeorgePlattDemo/3d-solutions-program/blob/04ec327df39a54e92aae65ef4b07d10f2c8a8985/research/bounded-cell-trial.md) proposes supervised dimensional verification and whole-service measurement. Its research authority defines questions, experiment scope and adoption rationale. Store owns the declared manufacturing answer, System the customer's meaning/decision record, and the local apparatus owner commissioned configuration, material admission, motion and inspection.

The first useful trial must establish the reference cut and face transformation, repeatable A/B/C references, stock seating and controlled movement, contact/roller restraint under representative loads, tool calibration and real saw stroke, actual spot depth, profile/offcut control, guarded release/labeling and interruption behavior. Measurements compare predicted occupancy with observed operation/handling time and compare modeled geometry with inspected components. Failed attempts and rework remain in the record rather than disappearing from the economic comparison.

Physical authority remains blocked in the adopted code. This is an actual evidence-stage result: the model is declared, not measured or commissioned. Program's proposed cell is a route to resolve these named questions; the master does not appoint it as an already operational Store machine.
