# STORE ZERO  
## Operational Specification and System Interface  
### How the public application gets attributable Store answers, how Q is derived, and how accepted definitions reach a bounded machine

**3D Solutions LLC · Store Zero Operational Specification 0.10 · 2026-10-09**

Specification 0.2 (2026-10-07), loaded into this repository with its errors corrected (0.3; every correction is listed in §18), the Store's own HTTP service added (0.4; §6A.14), the exact definition and accepted-job-packet contracts added (0.5; §3.4, §10.4), the machine side's reference lowering and virtual run added (0.6; §10.5), and the Alcove request type retired in favor of cut packages, with the rip rule (0.7; §19), the board-length ceiling removed (0.8; §19), runtime machine validation and the bounded virtual-evidence service completed (0.9; §10.6), and definition completeness, service identity and the deployment verification procedure added (0.10; §6A.14, §17, §19).

By the time a reviewer reaches Store Zero, the broad architecture should already be familiar: Program investigates why; System defines what the job means; Store answers what this Store can actually provide for that definition. This document is the complete human-readable Store contract for that last step. The public application does **not** text-search this Markdown file at runtime. It sends a structured, versioned inquiry to the Store runtime. The Store evaluates that inquiry against Store-owned catalog data, declared availability, capability rules, process models, and economics, and returns a fresh answer attributable to the request. The code and data are the executable version of the rules described here; disagreement between this document and executable behavior is a defect to be fixed, not permission to improvise a result.  
*Trace: `README.md`; `src/requests/store-request.mjs` (`evaluateStoreRequest`); `src/evaluation/`; `data/`; `acceptance/`.*

The Store answer is deliberately narrow. It may report `SUPPORTABLE`, `UNRESOLVED`, `REFUSED`, or `UNAVAILABLE`. It may identify a catalog offering, local fixture availability, a capability fit, an exact refusal reason, a modeled machine time, and a budgetary Q. It does not silently change customer dimensions, wood, grade, hardware meaning, geometry, requested operations, or feature locations to make a request succeed. Current local shortages remain shortages; a future special-order path is separately specified and is not implemented by the current evaluator.  
*Trace: `src/evaluation/store-state.mjs` (`STAGE2_JOB_DISPOSITIONS`, `stockAnswer`, `capabilityAnswer`); `src/evaluation/catalog.mjs` (`offerMaterial`); `src/evaluation/evaluators/cut-package.mjs`; `src/evaluation/evaluators/sheet-package.mjs`; `STORE-ZERO.md` §§14, 16, 17.*

A complete Stage-2 Q is not a page estimate. It is a Store calculation from the selected Store selling-price extensions plus modeled machine service derived from identified work. The current Store Zero catalog uses a declared 5% mark-on over its stored list-reference values; D-001 and S-001 Stage-2 machine service use the declared Store economics object whose $120,000 annual cost pool, 600 forecast productive hours, and 20% target gross margin yield a $200/hour break-even rate and a $250/hour sell rate. Those are fixture/model facts, not measured operating economics and not a commercial quote.  
*Trace: `data/store-zero-catalog.json` (`pricingRule`); `src/evaluation/engine/pricing.mjs` (`sellingPrice`); `src/evaluation/engine/d001-travel-standard.mjs` (`D001_TRAVEL_STANDARD.economics`, `storeMachineSellRate`). Tests: `tests/catalog-pricing.test.mjs` unnamed module-level assertions for `SZ-MARK-ON-5`; `tests/d001-travel-standard.test.mjs` unnamed module-level assertions for $200/$250 rates and zero setup charge.*

For dimensional work, the first physical D-001 target is deliberately bounded: a fixed fence and support reference, two controlled manipulating rollers, two fixed downstroke end saw stations, registered routing/milling functions, registered 3/16-inch spotting, and local control. The physical target is **specified, not built**. The executable Stage-2 D-001 envelope is **modeled**, not a claim that the later iron already exists. The S-001 sheet path is likewise **modeled** and **not commissioned**. Nothing in this document upgrades software evidence into physical production evidence.  
*Trace: `D-001-STAGE2-ENVELOPE-0.1.md`; `src/evaluation/envelopes/d001-stage2-envelope.mjs`; `S-001-STAGE2-ENVELOPE-0.1.md`; `src/evaluation/envelopes/s001-stage2-envelope.mjs`; `STB-STORE-CELL-STAGES-0.1.md`.*

After Store answers, machine execution is still a separate boundary. An accepted machine-neutral definition must be lowered against a versioned machine configuration; datums, station transforms, tools, kerf/kept-face rules, workholding/control assumptions, and controller/postprocessor identity must be explicit; unmapped conditions must fail closed. The separate Project 1 review remains the microscopic end-to-end proof record and is **not** rewritten here: [`docs/project-1-digital-trail/D001_Project1_Review.md`](project-1-digital-trail/D001_Project1_Review.md).  
*Trace: `STORE-MACHINE-BOUNDARY.md`; `STORE-JOB-001.md` §§3–16; Project 1 Review; this specification §10.*

This document uses the status words **implemented and tested**, **implemented, untested**, **modeled**, **specified, not built**, and **not addressed** where a claim/function trace requires one of those exact statuses. Elsewhere, the shorter factual words **implemented**, **modeled**, and **specified, not built** are used. “Modeled” never means commissioned. “Specified” never means built.

---

# Contents

1. Authority and status  
2. System-to-Store contact contract  
3. Order intake and request schemas  
4. Store routing and answer semantics  
5. Inventory, material resolution, Store data, and Store 1  
6. Budgetary Q: material, machine time, and price  
6A. **How the evaluators decide**  
7. D-001 dimensional test machine  
8. S-001 sheet path  
9. Safety, setup validation, and operating authority  
10. Compiler and machine-specific lowering  
11. Five library jobs, start to finish  
12. Project 1 proof and evidence relationship  
13. Claim-to-function matrix  
15. Commissioning and evidence plan  
16. Terms  
17. Open work  
18. Corrections made on load  
Appendix A. Common wire fields  
Appendix B. Request-type field contracts  
Appendix C. Evaluator index  
Appendix D. Store reason-code index

---

# 1. Authority and status

This document is the Store Zero specification; the code under `src/`, the data under `data/`, and the checks under `tests/` and `acceptance/` are its executable implementation. If this document and the executable behavior disagree, the disagreement is a conformance defect to fix. Factual status is stated as **implemented**, **modeled**, or **specified, not built**; the claim matrix uses the stricter allowed status vocabulary stated above. Shared terms are defined once, by System (§16); this repository keeps no definitions file. Earlier Store documents named in traces without a path (for example `STORE-JOB-001.md` or `STORE-MACHINE-BOUNDARY.md`) were absorbed into this specification; their operative substance is stated here, and they are not needed to read or apply it.  
*Trace: `README.md`; `AGENTS.md`; `src/`, `data/`, `tests/`, `acceptance/`; §18.*

Store Zero answers exactly as the Store the live application used when this repository was created: `acceptance/differential` replays 1,786 recorded answers from that Store (its own test suite plus a sweep over every catalog material class, sheet and hardware offering) and requires every one to be reproduced field for field, and `acceptance/project-1` reproduces the Project 1 review's whole Store answer including both calculation hashes. Two behaviors were deliberately not carried over because they were not clean definitions: the count-only Board ticket (`BOARD_SQUARE_V1`) and a project naming a Store SKU for a functional hardware requirement. Both are now refused with a reason (§3.3).  
*Trace: `acceptance/differential/differential.test.mjs`; `acceptance/project-1/project-1.test.mjs`; `tests/store-request.test.mjs`.*

# 2. System-to-Store contact contract

System and Store are separate owners. System owns the job definition and admission of a revision to a particular Store inquiry; Store owns the material, local availability, capability, Store economics, disposition, and Store response. A Store answer does not redefine the job. The Store membrane exists so an outside project can ask bounded questions without receiving possession of the Store’s internal ERP, inventory details, costs, supplier contracts, machine internals, or control systems. The preferred rule is: **ask for the answer, not the database**.  
*Trace: `STORE-ZERO.md` §§3, 8–10, 16–17; System definitions; System `docs/application/ADMISSION-REQUIREMENTS.md`.*

## 2.1 Store identity and correlation

A Store answer names the Store that gave it. Store Zero's identity is its **release**: the identity of the code and data that answered, supplied by whoever runs this Store when it starts, and recorded in every receipt as `authority.storeRevision`. A request cannot set or claim the Store's identity; `storeRevision` and `evaluatedAt` are refused as request fields (§3.3). The application fixes which Store release it expects and rejects an answer from any other; a release, correlation, or freshness mismatch fails closed, and no prior answer or receipt authorizes a new request.  
*Trace: `src/requests/store-request.mjs` (`evaluateStoreRequest` requires `release`; `requestProblems`); System `apps/stb/shared/contracts.mjs` (`STORE_PIN`) on the application side.*

Store Zero's own service carries requests over HTTPS (§6A.14). Every reply names the protocol (`STORE-ZERO-REQUEST-1`), this Store's release, and the SHA-256 digest of the exact bytes received, so the caller can prove that the answer is to what it sent; the answer itself carries the request id and receipt. Correlation of the application's own identities (project, revision, attempt) stays on the application side, which binds them to the request id it sends.  
*Trace: `src/service/server.mjs` (`PROTOCOL`, `createHandler`); `tests/service.test.mjs` — “Project 1 over HTTP: the same answer, bound to the exact bytes sent”.*

## 2.2 Fresh evaluation

For `USER_DEFINED_BOARD_V1`, `CUT_PACKAGE_V1`, and `SHEET_PACKAGE_V1`, each accepted request is a new evaluation against the catalog read for that request. There is one request layer, and no evaluator issues its own receipt. The receipt records the freshness rule (`STB-STORE-FRESH-EVALUATION-0.1`), request type, request id, evaluation time, Store authority (release, catalog hash, and the hashes of the envelope, standards and economics that governed the answer), demand hash, result status, calculation identity when available, and a receipt hash. The same demand may calculate to the same Q, but a prior answer is historical evidence only.  
*Trace: `src/requests/store-request.mjs` (`STORE_EVALUATION_FRESHNESS`, `REQUEST_TYPES[*].authority`, `evaluateStoreRequest`). Tests: `tests/store-request.test.mjs` — “every accepted request is evaluated fresh and its receipt names this Store, this request and this catalog”; `tests/d001-travel-standard.test.mjs` fresh-request, repricing and capability-change assertions; `tests/sheet-package.test.mjs` — “every request is freshly evaluated with a receipt bound to this request and this Store”; `acceptance/boundaries` — “one request layer: no evaluator issues its own receipt”.*

## 2.3 The Store membrane and commercial sovereignty

The Store membrane is a projection boundary, not necessarily a single API. A real implementation may use a native API, EDI, a supported connector, controlled file exchange, a staff-confirmed adapter, or a fixture adapter, provided source, authority, and freshness remain explicit. Publicly callable does not mean publicly visible. Store retains authority over cost, margin, customer-specific pricing, quote validity, tax, payment, credit, supplier terms, reservation, purchasing, and internal allocations. The application may carry an attributable Store result; it may not derive private commercial facts from guesses or expose operational information that the inquiry does not require.  
*Trace: `STORE-ZERO.md` §§8–11, 16, 21–24, 29–30.*

## 2.4 What may cross to the machine

The Store may project selected material/item identity, stock form, part identity, finished part-relative dimensions/features, quantity, bounded operations, applicable capability/envelope identity, Store disposition, and fulfillment relationship. Controller coordinates, homing details, station transforms, servo tuning, tool tables, controller text, postprocessor syntax, safety relay/PLC wiring, real-time interlocks, and local Cycle Start remain machine-local.  
*Trace: `STORE-1 README`; `STORE-MACHINE-BOUNDARY.md`.*

# 3. Order intake and request schemas

Admission answers one question: is this identified System revision complete enough to ask Store this inquiry? Admission is not Store capability and is not machine release. A request may pass System admission and still be refused by Store because the requested material, stock geometry, angle, operation, feature, or process lies outside the Store’s declared envelope.  
*Trace: System `docs/application/ADMISSION-REQUIREMENTS.md`; System `apps/stb/shared/contracts.mjs`; Store evaluators.*

## 3.1 The Store request

Every question to Store Zero is one object with exactly three fields:

| Field | Meaning |
|---|---|
| `requestType` | One of the request types in §3.2. Anything else is refused. |
| `requestId` | The identity of this inquiry; the receipt binds to it. Required and nonblank. |
| `demand` | The definition (for an evaluated type) or the lookup (for `OFFERING_LOOKUP`), with only the fields its type declares. |

The answer repeats `requestType` and `requestId`, carries the evaluator's result, and for an evaluated type carries `freshEvaluation:true` and the receipt of §2.2. A request that is not evaluated carries `freshEvaluation:false`, a `status` of `REFUSED` or `UNRESOLVED`, and `reasonCodes`.  
*Trace: `src/requests/store-request.mjs` (`requestProblems`, `evaluateStoreRequest`, `notEvaluated`). Tests: `tests/store-request.test.mjs`.*

Over HTTP the request is the body of `POST /v1/requests` and the answer is wrapped with the protocol, Store release, payload digest and reply time (§6A.14). The application side of the exchange (attempt identity, expected Store release, correlation checks) is System's.

## 3.2 Request types

| Request type | Function |
|---|---|
| `OFFERING_LOOKUP` | Catalog discovery only. Search or exact lookup returns offered Store facts. It does not run a fabrication evaluator and does not produce Q. |
| `USER_DEFINED_BOARD_V1` | Modern user-defined dimensional work: material demand, identified parts/features, workpiece demand, angle/plane, Datum-C method, operations, and unresolved conditions. |
| `CUT_PACKAGE_V1` | Neutral dimensional packages and item lines: material, parts, end cuts, optional finished width, spots, and item lines that name an exact SKU, a structured hardware requirement, or a functional requirement. |
| `SHEET_PACKAGE_V1` | One sheet plus identified routed/split/crosscut features and return-all-pieces semantics. |

`BOARD_SQUARE_V1`, the count-only Board ticket, is not accepted: a count of cuts is not an identified definition and could only ever be partially priced. It is refused with `REQUEST_TYPE_NOT_ACCEPTED`; the same square-cut work is a `CUT_PACKAGE_V1` line or a `USER_DEFINED_BOARD_V1` definition.

`ALCOVE_INSERT_V1`, the one project-shaped request type, is retired (§19) and refused with `REQUEST_TYPE_NOT_ACCEPTED`. An alcove is sent as cut packages (§11.2).  
*Trace: `src/requests/store-request.mjs` (`REQUEST_TYPES`); `tests/store-request.test.mjs` — “the accepted request types are exactly the three definitions and catalog lookup”, “a count-only Board ticket is not a clean definition and is refused, never partially priced”.*

## 3.3 Clean definitions only

System's admission decides what the application may ask. Store Zero independently refuses anything that is not a clean definition before any evaluator sees it, with the reason:

| Condition | Answer |
|---|---|
| The request is not an object, or carries a field other than `requestType`, `requestId`, `demand` (for example `storeRevision` or `evaluatedAt`) | `REFUSED` · `REQUEST_MUST_BE_AN_OBJECT` / `REQUEST_FIELD_NOT_DECLARED:<field>` |
| The request type is not one of §3.2 | `REFUSED` · `REQUEST_TYPE_NOT_ACCEPTED` |
| The request id is missing or blank | `UNRESOLVED` · `STORE_EVALUATION_REQUEST_ID_REQUIRED` |
| The definition is missing | `UNRESOLVED` · `DEFINITION_REQUIRED` |
| The definition carries machine-local language (`spline`, `toolpath`, `gcode`, `controller`, `servoSteps`) | `REFUSED` · `MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED` |
| The definition carries a field its type does not declare, at any level (§3.4) | `REFUSED` · `DEFINITION_FIELD_NOT_DECLARED:<path>` |
| A declared field has the wrong type (text for a number, a fraction for a count, a list for an object) | `REFUSED` · `DEFINITION_FIELD_TYPE:<path>:<type>` |
| An offering lookup is not exactly one of `{searchText}`, `{storeSku}`, `{query}` within its limits | `REFUSED` with the lookup reason (Appendix D.8) |

A request that passes reaches its evaluator, which validates every fact it consumes and returns `UNRESOLVED`, `REFUSED`, or `UNAVAILABLE` when a required fact is missing or outside a declared rule. A request may pass the gate and still be refused by the evaluator. Every field at every level of every definition is declared (§3.4); an undeclared or mistyped field is refused by its path.  
*Trace: `src/requests/store-request.mjs` (`MACHINE_LOCAL_LANGUAGE`, `REQUEST_TYPES[*].shape`, `requestProblems`); `src/contracts/definitions.mjs`; `src/requests/offering-lookup.mjs` (`lookupProblems`). Tests: `tests/store-request.test.mjs`; `acceptance/contracts/contracts.test.mjs`.*

## 3.4 Exact definition contracts

Each evaluated request type has one exact definition shape: every field it may carry, at every level of nesting, and the type of each (`string`, finite `number`, whole `integer`, `boolean`, list, or object). The shapes are the ones System's own admission already validates, so a definition System admits is a definition Store reads in full; nothing System sends is silently dropped, and nothing outside the shape reaches an evaluator. `null` means "not supplied" for any field. Whether a value is supportable — an angle within the miter range, a spot rule the cell declares, a material the catalog offers — is the evaluator's answer, with its own reason codes, not the shape's.

| Request type | Levels declared |
|---|---|
| `USER_DEFINED_BOARD_V1` | definition; `materialDemand` (species, form, nominal T and W, and grade — required when the wood is offered in more than one); `endRelation`, `lengthDatum`, `endIdentity` (the end geometry the price is for); `parts[]` (`partId`, `lengthIn`, `features[]` with `featureId`, `kind`, `xIn`, `locationRule`, `acrossWidthRule`, `insetFromEdgeIn`) |
| `CUT_PACKAGE_V1` | definition; `cutPackages[]` (`packageId`, `material`, `endCut`, `finishedWidthIn`, `parts[]`, `spots[]`); `itemLines[]` (exactly one of an exact `storeSku`, a structured hardware `requirement`, or a functional `requirementId`) |
| `SHEET_PACKAGE_V1` | definition; `sheet`; `features[]` (aperture, split and crosscut fields) |

Complete serialized examples are committed under `contracts/examples/requests/`: Project 1, the default SPF job, a mixed cut package, the pine alcove as cut packages, the Playhouse sheet, two lookups, and Project 1's sealed inquiry without its grade (which Store answers by asking for one), each with the answer this Store gives it. `contracts/examples/requests/refused.json` lists definitions that are refused and the exact reasons: the count-only Board ticket, a Store identity sent by the caller, an undeclared part field, a part length as text, machine-local language, the retired project-shaped request type, a fractional hardware count, and a missing request id. The examples are generated by `npm run build:examples`, and acceptance fails if a committed example ever differs from what the code produces.  
*Trace: `src/contracts/shape.mjs` (`shapeProblems`); `src/contracts/definitions.mjs` (`DEFINITION_SHAPES`); `scripts/build-contract-examples.mjs`; `contracts/examples/requests/`. Tests: `acceptance/contracts/contracts.test.mjs` — “the committed examples are exactly what the code produces”, “every request example is a clean definition and gets its recorded answer”, “every refused example is refused with its exact reasons”.*

# 4. Store routing and answer semantics

Store routes by request type and structured definition, not by a visual page or customer story. `CUT_PACKAGE_V1` is intentionally project-neutral; its source file is regression-tested not to contain project names such as “picnic”, “bench”, or “table”. Identical structured questions under the same Store facts should therefore receive the same Store answer regardless of the page that originated them.  
*Trace: `src/evaluation/evaluators/cut-package.mjs`; test `tests/cut-package.test.mjs` unnamed assertion “The file carries no project knowledge.”*

## 4.1 Canonical Store dispositions

| Disposition | Meaning |
|---|---|
| `SUPPORTABLE` | Required Store facts are present; the request fits the applicable Store-owned material/capability model; a complete budgetary answer may be produced where the evaluator supports complete Q. |
| `UNRESOLVED` | A required fact is absent or Store cannot establish a required price/capability fact. Nothing is invented. |
| `REFUSED` | The request is sufficiently defined to determine that it violates a declared material, geometry, operation, machine, or policy rule. |
| `UNAVAILABLE` | A matching offering exists or can be identified, but current declared local availability is insufficient. |

`NOT_ALL_LINES_SUPPORTABLE` is the aggregate status used by `CUT_PACKAGE_V1` when at least one line is not supportable; each line still carries its own canonical disposition.  
*Trace: `src/evaluation/store-state.mjs` (`STAGE2_JOB_DISPOSITIONS`); `src/evaluation/evaluators/cut-package.mjs` (`evaluateCutPackageJob`). Test: `tests/store-state.test.mjs` unnamed disposition assertions.*

## 4.2 No silent substitution

Store may choose among offerings only under a declared Store selection rule. It may not change species, grade, nominal size, feature geometry, angle, spot placement, hardware finish/size, or requested operation. Structured hardware requirements are matched exactly on catalog facts; no nearest size or finish swap is permitted. Sheet features are never moved, resized, simplified, or dropped to obtain a pass.  
*Trace: `src/evaluation/evaluators/cut-package.mjs` (`evaluatePackage`, `evaluateRequirement`); `src/evaluation/evaluators/sheet-package.mjs` (`evaluateSheetPackageJob`); tests in both evaluator test files.*

## 4.3 Stock is not one fact

An offering can be cataloged and offered while local availability is short. `stockAnswer` computes `available = onHand - allocated` and returns `ON_HAND_SUFFICIENT`, `ON_HAND_SHORT`, or `NOT_ON_HAND`; the latter two make the Store job unavailable where stock is required. “On hand” in Store Zero is fixture-declared state, not a physical count. Allocation is simulated state. Neither is equivalent to reservation, pick, consumption, staging, or a physical lineage record.  
*Trace: `src/evaluation/store-state.mjs` (`stockAnswer`); `data/store-zero-catalog.json` assertions; System definitions; test `tests/store-state.test.mjs` unnamed on-hand assertions.*

# 5. Inventory, material resolution, Store data, and Store 1

Store Zero is a controlled fictional dealer fixture. It represents enough catalog, stock, supplier-path, capability, and economics facts to make Store questions deterministic and auditable; it is not represented as a physical inventory count, live ERP, named real dealer, or commissioned fabrication operation.  
*Trace: `STORE-ZERO.md` §§1, 4–6; `data/store-zero-catalog.json`; `STB-STORE-CELL-STAGES-0.1.md` Stage 2.*

## 5.1 Selection rules are evaluator-specific

There is no universal “shortest board” rule.

| Path | Current Store rule | Source |
|---|---|---|
| `USER_DEFINED_BOARD_V1` | For the customer-chosen grade, matching offered boards are considered in ascending stock length; the first candidate whose stock, price, D-001 capability, and full travel evaluation are complete is selected. | `matchingBoardOfferings`; `evaluateDimensionalTravelJob` |
| `CUT_PACKAGE_V1` | For the customer-chosen material/grade, candidates are planned and capability-checked; supportable candidates are ranked by lowest material extension, then length, then SKU; if machine execution refuses a candidate, the next supportable material candidate is tried without changing wood. | `evaluatePackage` |
| `SHEET_PACKAGE_V1` | Exact sheet geometry/material constraints and operations are matched; capable priced offerings are ranked by selling price then SKU; the first with sufficient stock is selected. | `resolveSheet` |

*Trace: functions named above; evaluator tests for material selection.*

## 5.2 Store Zero physical and operating baseline

Store Zero models an ordinary local LBM branch with customer/pro sales, warehouse/yard, receiving, staging, pickup/loading, delivery, material handling, limited processing, supplier relationships, and special-order relationships. It also models the human responsibilities of sales, purchasing, receiving, yard/warehouse staff, material-service operator, dispatch/driver, credit/accounting, and Store management. These are fixture declarations showing where Store answers can originate; software does not silently inherit those people’s commercial or operational authority.  
*Trace: `STORE-ZERO.md` §§4–5.*

Store Zero also names functional system classes: `S0-ERP` for dealer commercial records; `S0-YARD` for receiving/counting/picking/staging/loading; `S0-SUPPLY` for supplier and purchasing connections; `S0-PORTAL` for product/account/quote/order access; `S0-TAKEOFF` for contractor estimating; and `S0-DISPATCH` for fulfillment. These labels are fixture labels, not requirements that a real yard use a particular vendor architecture.  
*Trace: `STORE-ZERO.md` §6.*

## 5.3 Store’s data files

### `data/store-zero-catalog.json`

The callable catalog is the runtime Store Zero source for offerings used by the Store evaluators. It currently contains **183 offerings** (137 boards, 9 sheets, 37 hardware rows). Each row carries Store SKU, offered state, form, species/grade, nominal/actual dimensions, stock or sheet dimensions, unit, list reference, mark-on, selling price, on-hand and allocated fixture state, supplier path, cell family, supported operations, limitations, description, and assertion-level provenance; hardware rows may carry structured `fastener` facts, and a hardware row may declare `satisfiesRequirementIds`, the functional hardware requirements it fulfils (today: the Alcove pins-and-screws pack). The catalog’s declared pricing rule is `sellingPrice = ROUND(list_reference × 1.05, 2)`.

The catalog is validated every time it is read, and a catalog that fails is never evaluated. The rules are exact: the fields each form carries and the ones it must leave null; positive dimensions; the selling price equal to the declared mark-on rule; whole, non-negative stock with allocation no greater than on-hand; operations and cell families only from the declared lists; every required assertion present; an observed, reported or plausible list reference equal to its external value, and a calculated one stating its derivation; unique SKUs; and each functional requirement satisfied by at most one offering. There is no hand-maintained offering count. **Adding an offering is adding one row and running `npm run check:catalog`; no code changes.** A new row can legitimately change a live answer — the selection rules may now find a better board — so recorded answers are reproduced against a frozen copy of the catalog they were recorded with, never the live one.  
*Trace: `data/store-zero-catalog.json`; `src/evaluation/catalog.mjs` (`CATALOG_RULES`, `catalogProblems`, `validateCatalog`, `loadCatalog`, `findSku`, `offerMaterial`, `offeringForRequirement`); `scripts/check-catalog.mjs`; `acceptance/fixtures/recorded-catalog.mjs`. Tests: `acceptance/catalog/catalog.test.mjs` (a correct new offering accepted with no code change; a new offering changing a live answer only through the declared selection rule; thirteen kinds of incorrect row refused before any answer); `tests/catalog-pricing.test.mjs` catalog pricing/provenance assertions.*

### `data/sources/store-zero-price-sheet-2026-09-26.csv`

This file contains **122 material price-reference rows** with category, species, grade, nominal and actual dimensions, length, merchant SKU where present, everyday price, basis, and note. Current evaluator code does **not** read this CSV at request time. Its role is source/provenance for catalog values and later audit. A real yard would replace this provenance mechanism with its accountable price source or commerce system while still making the price basis attributable.  
*Trace: CSV header/rows; absence of CSV loading in `src/`; catalog `assertions.externalListPrice.source` references.*

### `data/sources/store-zero-hardware-sheet-2026-09-26.csv`

This file contains **29 hardware reference rows** with tier, item, size, package, pieces per package, merchant SKU where present, everyday price, basis, and note. The structured hardware resolver does **not** parse this CSV at request time; it matches the structured `fastener` facts already carried by offered catalog rows and uses the catalog selling price. A real yard would populate those structured commercial facts from its accountable item master.  
*Trace: CSV header/rows; `src/evaluation/evaluators/cut-package.mjs` (`fastenerMeaning`, `evaluateRequirement`).*

### `data/sources/store-zero-observations.json`

This file contains **20 public list-price observations** and the provenance rule that an observation is not a Store Zero selling price. `loadObservations` loads it; Store evaluator pricing uses the callable catalog, and an offering lookup attaches the observation reference to each offering it reports, for attribution. A real yard may not need this public-observation basket if its own commercial system is the accountable source.  
*Trace: `data/sources/store-zero-observations.json`; `src/evaluation/catalog.mjs` (`loadObservations`); `src/requests/offering-lookup.mjs` (`attributedOffering`).*

## 5.4 Special order: specified, not built

Current Store evaluators end a local mismatch or shortage with the applicable `REFUSED`, `UNRESOLVED`, or `UNAVAILABLE` answer; a synthetic `supplierPath` field does not convert local shortage into supportability. The target Store may add a separately identified special-order option only for a definition-conforming item, with supplier/item identity, required quantity, attributable supplier price or price basis, lead/availability statement, source time, and any Store sell-price transformation actually applied. Procurement occurs only after the yard’s commercial acceptance/payment gate; a viewed configuration does not trigger purchasing. This special-order query/commerce path is **specified, not built** and is therefore listed in Open work.  
*Trace: `src/evaluation/store-state.mjs` header; `STORE-ZERO.md` §§14–16; `STORE-1 README`; patents’ detailed descriptions of special-order flow. No current Store `src/` function implements a general supplier portal query.*

## 5.5 Store 1: from Store Zero to a real yard

Store 1 is not “Store Zero with a real logo.” A real dealer keeps the same bounded questions but answers them from its own authority: its own catalog/SKUs and material classes; real local stock/availability and freshness; actual customer-facing pricing and commerce rules; actual supplier/special-order relationships; its own declared machine/cell capabilities and evidence status; its own operator/steward roles and local procedures; and its own pickup, delivery, staging, reservation, and fulfillment states. Store Zero remains a test oracle, not a template that forces the yard to copy fixture values or system names.  
*Trace: `STORE-1 README`; `STORE-1-EXPANSION-CHECKLIST.md`; `STB-STORE-CELL-STAGES-0.1.md` Stage 3.*

A Store 1 adapter may be a native API, EDI, vendor connector, controlled import/export, or staff-confirmed adapter. The acceptance requirement is not technological fashion; it is that the bounded answer retain source, identity, freshness, authority, and refusal semantics. Store truth must not be reconstructed from machine CAD, controller configuration, or a legacy public-demo heuristic.  
*Trace: `STORE-ZERO.md` §21; `STORE-1-EXPANSION-CHECKLIST.md`.*

# 6. Budgetary Q: material, machine time, and price

## 6.1 Store selling price

Store Zero’s runtime catalog stores `list_reference`, `mark_on`, and `sellingPrice`. The declared fixture rule is:

\[
\text{sellingPrice} = \operatorname{ROUND}(\text{list_reference}\times 1.05,\ 2)
\]

The 5% is a **mark-on**, not a 5% margin. `sellingPrice(list)` in the pricing engine applies the same formula.  
*Trace: `data/store-zero-catalog.json` `pricingRule`; `src/evaluation/engine/pricing.mjs` (`MARK_ON`, `sellingPrice`). Test: `tests/catalog-pricing.test.mjs` unnamed assertions for every priced offering.*

## 6.2 Store machine-service rate

The declared Stage-2 economics are:

- annual cost pool: $120,000;
- forecast productive hours: 600 hours;
- target gross margin: 0.20;
- component amounts: operator burden $50,000; capital recovery $25,000; facility/insurance/admin $20,000; maintenance/tooling $15,000; energy/dust/IT $10,000.

The formulas are:

\[
\text{breakEvenPerHour}=\frac{120000}{600}=\$200/\text{hour}
\]

\[
\text{sellRatePerHour}=\frac{200}{1-0.20}=\$250/\text{hour}
\]

There is no $35 setup charge and no $100/hour fallback in the current engine.  
*Trace: `src/evaluation/engine/d001-travel-standard.mjs` (`D001_TRAVEL_STANDARD.economics`, `storeMachineSellRate`); test `tests/d001-travel-standard.test.mjs` unnamed rate/setup assertions.*

## 6.3 Complete Q

For a complete dimensional or sheet evaluation:

\[
Q=\sum(\text{selected Store material/sourced-item extensions})+\text{machine service}
\]

\[
\text{machine service}=\operatorname{ROUND}(T_{\text{MACHINE,hr}}\times \$250,\ 2)
\]

There is no count-only estimate. Complete dimensional Q exists only for identified travel demand; a request that cannot name its parts and features is not a clean definition (§3.2–§3.3) and is never priced from counts.  
*Trace: `src/evaluation/engine/pricing.mjs` (`estimateUserDefinedBoardTravel`); `src/evaluation/engine/d001-travel-standard.mjs`; evaluator Q code; `acceptance/boundaries` — “no count-only or compatibility pricing path exists”.*


# 6A. How the evaluators decide

This section opens the Store Zero black box. It describes every module under `src/`: the catalog and Store state, the envelopes, geometry and travel, pricing, the request-family evaluators, and the request layer with offering lookup. The order below follows the call chain.

**Verification convention.** Where a test file uses Node `test("name", ...)`, the test name is quoted. Several test files instead execute module-level `assert` statements and have no formal test name. Those are identified below as **“unnamed module-level assertion”** plus the asserted behavior. If no test directly proves a rule, the rule is retained and marked **untested**. Every rule below is also covered by `acceptance/differential`, which requires each recorded answer to be reproduced exactly; “untested” means no test isolates the rule, not that its behavior is unchecked.

## 6A.1 `src/evaluation/catalog.mjs`, `src/evaluation/store-state.mjs`, `src/evaluation/evaluators/user-defined-board.mjs` — catalog, Store state, and user-defined-board material resolution

### What it is for

`catalog.mjs` loads and validates the Store-owned catalog (§5.3) and looks rows up. `store-state.mjs` states the four Stage-2 dispositions and answers stock, price, and capability for one offering, and orders matching boards. `user-defined-board.mjs` resolves candidate boards for a `USER_DEFINED_BOARD_V1` definition and runs the D-001 travel evaluation on each. The fresh-evaluation receipt is the request layer’s (§2.2, §6A.13).  
*Trace: file headers and exports of the three modules.*

### Inputs

| Function | Inputs read | Type / units / required |
|---|---|---|
| `loadCatalog(url)` | catalog file | optional URL; defaults to `data/store-zero-catalog.json`; validated before it is returned |
| `loadObservations(url)` | observation file | optional URL; defaults to `data/sources/store-zero-observations.json` |
| `findSku(catalog, storeSku)` | `catalog.offerings[]`, `storeSku` | catalog object; SKU string |
| `offerMaterial(catalog, q)` | `q.species`, `q.form`, `q.nominalT`, `q.nominalW`, `q.stockL_in` | optional exact-match fields; dimensions are nominal inches where numeric |
| `offeringForRequirement(catalog, requirementId)` | `offerings[].satisfiesRequirementIds` | requirement id string |
| `matchingBoardOfferings(catalog, demand)` | material fields, optional `grade`, plus `definedWorkpieceLengthIn` | minimum parent length in inches; candidates shorter than this minimum are excluded |
| `stockAnswer(item, qtyNeeded, asOf)` | `item.onHand`, `item.allocated`, `item.offered`, `item.supplierPath`, assertion blocks | counts; `asOf` is the catalog clock |
| `priceAnswer(item, asOf)` | `sellingPrice`, `list_reference`, `listReferenceBasis`, `mark_on`, `observationId` | dollars; `sellingPrice` required for a resolved price |
| `capabilityAnswer(item, requiredOps, feature)` | `item.form`, actual dimensions, stock length, supported ops/cell family; feature fields `keptLengthIn`, `sawAngleDeg`, `cutPlane`, `spotDemand`, `millYIn`, `millDepthIn` | dimensions inches, angle degrees, operation strings |
| `evaluateDimensionalTravelJob(catalog, demand)` | `materialDemand`, `definedWorkpieceLengthIn`, `requiredOps`, `sawAngleDeg`, `cutPlane`, `datumCMethod`, `parts`, declared counts, unresolved conditions, configuration identity, Store revision (set by the request layer) | dimensions inches; angle degrees; parts/features identified |

### Decision sequence

1. **Clean request.** The request layer has already refused anything that is not a clean definition and set the Store revision to this Store’s release (§3.3).
2. **Nothing is filled in.** A missing, null or blank miter angle, cut plane or Datum-C method, or a missing or empty operation list, is `UNRESOLVED` with `MITER_ANGLE_REQUIRED`, `CUT_PLANE_REQUIRED`, `DATUM_C_ESTABLISHMENT_METHOD_REQUIRED` or `REQUIRED_OPERATIONS_REQUIRED`, and no price is computed. The declared operations must agree with the parts: spot features if and only if `SPOT_ON_LOCATION`; a nonzero angle needs `MITER_LIMITED`; a board always declares `MITER_LIMITED` or `CROSSCUT`. Otherwise `UNRESOLVED / REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:<op>`. An explicit 0° is a real square cut. The declared saw-cut and spot counts are cross-checks: absent is not checked; a wrong count is `UNRESOLVED` with the mismatch, never overwritten.
3. **End geometry.** The travel model prices parallel ends with the length on the long-long outer edge (`PRICED_BOARD_GEOMETRY`). Missing `endRelation` or `lengthDatum` → `UNRESOLVED / END_RELATION_REQUIRED` or `LENGTH_DATUM_REQUIRED`; another relation or datum → `REFUSED / END_RELATION_NOT_PRICED:<value>` or `LENGTH_DATUM_NOT_PRICED:<value>`; a non-null `endIdentity` (a further end name the datum does not already say) → `REFUSED / END_IDENTITY_NOT_PRICED`. Geometry the model does not price is never priced as if it were parallel. The Datum-C method must be one the plan models: `MECHANICAL_REFERENCE` and `SENSED_FACE` are admitted by the standard but have no plan, so they are `UNRESOLVED / DATUM_C_METHOD_NOT_MODELED:<method>`, never planned as a reference cut.
4. **Grade.** The grade is the customer's choice. If the wood is offered in more than one grade and the definition names none: `UNRESOLVED / GRADE_CHOICE_REQUIRED`, with `offeredGrades`. Store never picks a grade.
5. **Material candidates.** `matchingBoardOfferings` exactly matches species/form/nominal dimensions and grade, requires offered rows, filters to `stockL_in >= demand.definedWorkpieceLengthIn`, and sorts by stock length, then selling price, then SKU.
6. **Candidate stock.** `stockAnswer` calculates `available = onHand - allocated`; sufficient quantity is `ON_HAND_SUFFICIENT`, positive but insufficient is `ON_HAND_SHORT`, zero-or-less is `NOT_ON_HAND`. The answer is dated with the catalog’s own clock.
7. **Candidate price.** Missing `sellingPrice` yields `MISSING_PRICE`; otherwise the catalog selling price is accepted as the Store Zero fixture price.
8. **Candidate capability.** `capabilityAnswer` calls `envelopeCheck` with requested operations and feature facts. Hardware is treated as sourced by the envelope; board/sheet capability is evaluated against the declared cell.
9. **Candidate travel.** A candidate with sufficient stock, a price, and `SUPPORTABLE` capability is passed to `estimateUserDefinedBoardTravel`, which calls the D-001 travel evaluator using the candidate’s **actual stock length as the workpiece length**.
10. **First complete candidate wins.** The first candidate whose travel estimate is complete becomes `SHORTEST_COMPLETE_STORE_OFFERING`.
11. **No complete candidate.** If no candidate exists: `UNAVAILABLE / NO_MATCHING_BOARD_OFFERING`. If any candidate is unresolved: `UNRESOLVED / DIMENSIONAL_CANDIDATE_UNRESOLVED`. Else if any candidate is refused: `REFUSED / NO_COMPLETE_DIMENSIONAL_CANDIDATE`. Else: `UNAVAILABLE / MATCHING_BOARD_NOT_AVAILABLE`.

*Trace: `matchingBoardOfferings`, `stockAnswer`, `priceAnswer`, `capabilityAnswer`, `evaluateDimensionalTravelJob`.*

### Outcomes and reason codes

- `SUPPORTABLE`: a complete candidate and complete D-001 budgetary estimate were found.
- `UNRESOLVED`: `CAPABILITY_INPUT_UNRESOLVED`; `DIMENSIONAL_CANDIDATE_UNRESOLVED`; `CANDIDATE_INPUT_UNRESOLVED`; `MISSING_PRICE`; or any unresolved reason propagated from the envelope/travel evaluator.
- `REFUSED`: `NO_COMPLETE_DIMENSIONAL_CANDIDATE`; `CANDIDATE_CAPABILITY_REFUSED`; or a concrete envelope/travel refusal.
- `UNAVAILABLE`: `NO_MATCHING_BOARD_OFFERING`; `MATCHING_BOARD_NOT_AVAILABLE`; `SKU_NOT_OFFERED`; `ON_HAND_SHORT`; `NOT_ON_HAND` as applicable.

### Formulae

- `available = onHand - allocated`.
- Candidate dimensional ordering: ascending `stockL_in`, then ascending `sellingPrice`, then SKU lexical order.
- Calculation and authority hashes use SHA-256 over a stable key-sorted serialization (`calculationHash`).
- Complete Q is calculated by the travel/pricing path described below.

### It does not do

It does not accept a prior answer as authority for a new request; allocate stock; reserve stock; change the user’s material class; treat supplier path as local stock; infer a missing price; evaluate an invalid catalog; date an answer with anything but the catalog’s clock; create machine coordinates; authorize Cycle Start; claim a physical count; or turn an unavailable candidate into supportability.

### Verification

- `tests/store-state.test.mjs` — unnamed module-level assertions: sufficient, short and absent stock; the catalog clock as the answer date; missing price; refused operation; the four dispositions through exact-SKU lines.
- `tests/d001-travel-standard.test.mjs` — unnamed module-level assertions: shortest complete candidate, 60→72→96 ladder, catalog change, fresh receipts, repricing, capability change, missing request id.
- `tests/catalog-pricing.test.mjs` — unnamed module-level assertions: catalog pricing/provenance and Job 1 complete Q.
- `tests/d001-stage2-envelope.test.mjs` — matching boards ordered shortest first.
- Rules not explicitly asserted: lexical SKU tie-break in `matchingBoardOfferings` is **untested** as an isolated tie case.

### Where it lives

`src/evaluation/catalog.mjs`: `CATALOG_RULES`, `sellingPriceFor`, `catalogProblems`, `validateCatalog`, `loadCatalog`, `loadObservations`, `findSku`, `offerMaterial`, `offeringForRequirement`. `src/evaluation/store-state.mjs`: `STAGE2_JOB_DISPOSITIONS`, `matchingBoardOfferings`, `stockAnswer`, `priceAnswer`, `capabilityAnswer`. `src/evaluation/evaluators/user-defined-board.mjs`: `evaluateDimensionalTravelJob`.

---

## 6A.2 `src/evaluation/envelopes/d001-stage2-envelope.mjs` — D-001 Stage-2 capability envelope

### What it is for

This module states the declared dimensional-cell limits that determine whether a Store board/operation request fits the modeled D-001 capability before travel/economics can be considered.

### Inputs

`envelopeCheck(item, req)` reads an offering `item` and request object `req`.

| Input | Type / units | Required when |
|---|---|---|
| `item.form` | string | always; sheet is refused, hardware is sourced |
| `item.actualW` | inches | when present, checked against width envelope |
| `item.actualT` | inches | when present, checked against operation-dependent thickness |
| `item.stockL_in` | inches | when present, checked against parent-support rule |
| `item.supportedOps[]` | operation strings | required operations must be present |
| `item.cellFamily[]` | strings | if nonempty, must include `D-001` |
| `req.requiredOps[]` | operation strings | defaults to empty array |
| `req.keptLengthIn` | inches | if present, checked against 24-inch control minimum |
| `req.sawAngleDeg` | degrees | required for `MITER_LIMITED` |
| `req.cutPlane` | string | if supplied for miter, must be `miter-face` |
| `req.millYIn` | inches from fence | if present, max 14 |
| `req.millDepthIn` | inches | used only to derive pass count |
| `req.spotDemand` fields | mode/rules/inches | when spot demand supplied |

`millPassesForDepth(totalDepthIn)` reads depth in inches.

### Declared constants

- base length 72 in;
- stock width 1.5–12.0 in;
- stock thickness minimum 0.75 in;
- saw-only maximum thickness 3.5 in;
- milling maximum thickness 1.5 in;
- minimum controlled/kept length: 24 in;
- miter 0–45 degrees inclusive, single-plane face, downstroke;
- spot tool 0.1875 in (3/16), 118° point, 0.1875 in full-diameter depth after point;
- allowed spot across-width rules: centered or inset; allowed insets exactly 1.5 or 2 in;
- X loaded-feed model value 480 in/min; longitudinal mill feed 48 in/min; max Y tool travel 14 in;
- station X positions: `SAW-L=0`, `R1=24`, `MILL_LONG=36`, `R2=48`, `SAW-R=72`, `MILL_END=-6`;
- station-profile mill max length 60 in; max depth/pass 0.375 in; max cut width 1.0 in;
- pass-through edge mill max cut width 1.0 in and depth/pass 0.375 in;
- end mill reach 8 in and max depth 0.5 in.

*Trace: `D001_STAGE2_ENVELOPE` constant.*

### Ordered checks

1. No `item` → `REFUSED / NO_OFFERING`.
2. `form:"sheet"` → `REFUSED / SHEET_NOT_D001`.
3. `form:"hardware"` → `SOURCED`; no D-001 geometry test.
4. Width above 12 → `STOCK_WIDTH_EXCEEDS_D001_STAGE2_ENVELOPE`; below 1.5 → `STOCK_WIDTH_BELOW_D001_STAGE2_ENVELOPE`.
5. If any of `MILL_LONGITUDINAL_PROFILE`, `MILL_END_PROFILE`, `DADO`, `GROOVE`, `RABBET` is required, thickness max is 1.5; otherwise 3.5. Above max → `STOCK_THICKNESS_EXCEEDS_D001_STAGE2_ENVELOPE`; below 0.75 → `STOCK_THICKNESS_BELOW_D001_STAGE2_ENVELOPE`.
6. `keptLengthIn < 24` → `KEPT_LENGTH_BELOW_TWO_ROLLER_CONTROL`.
7. `millYIn > 14` → `MILL_Y_EXCEEDS_TOOL_TRAVEL`.
8. For `MITER_LIMITED`: missing/nonfinite angle → unresolved `MITER_ANGLE_REQUIRED`; angle outside 0–45 → refusal `MITER_ANGLE_OUTSIDE_D001_STAGE2_ENVELOPE`; supplied plane other than `miter-face` → `MITER_PLANE_NOT_DECLARED`.
9. Generic `DRILL` → unresolved `GENERIC_DRILL_ENVELOPE_NOT_DECLARED_BEYOND_SPOT`.
10. Spot checks: wrong mode → `SPOT_MODE_NOT_DECLARED`; wrong location rule → `SPOT_LOCATION_RULE_NOT_DECLARED`; unsupported across-width rule → `SPOT_ACROSS_WIDTH_RULE_NOT_DECLARED`; inset not exactly 1.5 or 2 → `SPOT_INSET_NOT_DECLARED`; missing longitudinal location → unresolved `SPOT_LOCATION_REQUIRED`; location outside 0..kept length → `SPOT_LOCATION_OUTSIDE_WORKPIECE`.
11. Any required operation absent from `item.supportedOps` → `OP_NOT_ON_OFFERING:<comma-joined-ops>`.
12. Nonempty `cellFamily` not containing `D-001` → `CELL_FAMILY_NOT_D001`.
13. Any refusal wins over unresolved; otherwise unresolved wins; otherwise `SUPPORTABLE`.

### Formula

`millPassesForDepth(d) = ceil(d / 0.375)` for positive `d`; zero/absent depth returns 1.

### It does not do

It does not prove workholding; authorize live motion; support sheets; convert generic drilling into spotting; invent external overhang support; widen miter capability; or infer an undeclared operation.

### Verification

- `tests/d001-stage2-envelope.test.mjs` — unnamed module-level assertions for 14-in Y travel, 12-in stock width, downstroke, 45° limit, 3/16 spot, two passes at 0.75 in, 30°/45° support, 46° refusal, missing angle unresolved, generic drill unresolved, width refusal, every offered board length taken, milling thickness distinction, short kept length refusal.
- `tests/spot-inset-depth.test.mjs` — unnamed module-level assertions for tool diameter, 118° point, full-diameter depth, 1.5/2-in inset options.
- Untested as isolated boundaries: 1.5-in minimum width; 0.75-in minimum thickness; 3.5-in saw maximum thickness; exact `CELL_FAMILY_NOT_D001`; exact `SPOT_LOCATION_RULE_NOT_DECLARED`; combined missing-op formatting.

### Where it lives

`src/evaluation/envelopes/d001-stage2-envelope.mjs`: `D001_STAGE2_ENVELOPE`, `millPassesForDepth`, `envelopeCheck`.

---

## 6A.3 `src/evaluation/engine/d001-travel-standard.mjs` — D-001 kinematics, timing, geometry, and machine-service math

### What it is for

This module converts an identified dimensional board or a set of identified components into a deterministic modeled D-001 operation sequence, occupied-cell time, machine-service extension, calculation identity, and low-level completion/refusal result.

### Declared model constants

**Datums and stations.** Datum A: fixed fence, Y=0. Datum B: table/support, Z=0. Datum C: dynamic longitudinal origin; allowed methods are `REFERENCE_CUT`, `MECHANICAL_REFERENCE`, and `SENSED_FACE`, but only `REFERENCE_CUT` has a plan and time; the other two are `UNRESOLVED / DATUM_C_METHOD_NOT_MODELED:<method>`. `SAW-L` is at X=0; `SAW-R` at X=72; `MILL_LONG` at X=36; `SPOT-FACE-REF` at X=36.  
**Motion.** X max loaded velocity 480 in/min, acceleration 32 in/s². Y tool max velocity 240 in/min, acceleration 16 in/s².  
**Handling.** load/seat 36 s; release/label 24 s.  
**Saw.** 20-in diameter, 1800 rpm, 80 teeth, 0.003-in chip load/tooth, finish factor 0.5, deploy 1 s, retract 1 s.  
**Spot.** 0.1875-in diameter, 3000 rpm, 0.008 in/rev, 118° point, full-diameter depth 0.1875 in beyond point, approach 0.35 s, retract 0.35 s.  
**Mill.** 48 in/min cutting feed, max Y 14 in, station-profile max path 60 in, max depth/pass 0.375 in.  
**Control.** minimum retained control 24 in; kerf 0.125 in.  
**Economics.** $120,000 annual pool; 600 productive hours; 20% target gross margin.  
*Trace: `D001_TRAVEL_STANDARD`.*

### Core formulae

For an X or Y move of distance \(D\), velocity \(V\) in in/s, acceleration \(A\) in in/s², threshold \(V^2/A\):

\[
T(D)=
\begin{cases}
0,&D=0\\
2\sqrt{D/A},&D<V^2/A\\
2V/A +(D-V^2/A)/V,&D\ge V^2/A
\end{cases}
\]

Saw feed:

\[
F_{\text{saw}}=0.003\times80\times1800\times0.5=216\ \text{in/min}
\]

Saw traverse at angle \(a\):

\[
L_{\text{traverse}}=\frac{W}{\cos(a)}
\]

\[
T_{\text{saw}}=1+\frac{L_{\text{traverse}}}{216}\times60+1
\]

Spot drill-point length:

\[
L_{\text{point}}=\frac{D_{\text{tool}}/2}{\tan(118^\circ/2)}
\]

and plunge:

\[
L_{\text{plunge}}=L_{\text{point}}+0.1875
\]

With these values `L_point ≈ 0.056331 in` and `L_plunge ≈ 0.243831 in` (the Project 1 review states the same; the test asserts them within 1e-5). Spot plunge feed is `3000 × 0.008 = 24 in/min`; total spot time is Y-position time + 0.35 s approach + plunge time + 0.35 s retract.

Longitudinal mill passes are `ceil(totalDepthIn / 0.375)`. Each pass cuts `pathLengthIn / 48 × 60` seconds; each additional pass returns over X at the X-index model; Y positioning uses the Y model.

Machine-service rate is the §6.2 $250/hour rate. Complete user-defined-board Q is:

\[
Q=\operatorname{ROUND}(\text{item.sellingPrice},2)+
\operatorname{ROUND}(T_{\text{MACHINE,hr}}\times250,2)
\]

*Trace: `xIndexTimeSec`, `yIndexTimeSec`, `sawFeedInPerMin`, `sawCycleSec`, `spotPointLengthIn`, `spotPlungeIn`, `spotCycleSec`, `millLongitudinalCycleSec`, `storeMachineSellRate`, `evaluateD001UserDefinedBoard`.*

### `evaluateD001UserDefinedBoard` inputs

The function reads `item` and `demand`.

- `item.form` must be board; `item.actualW` positive inches; `item.actualT`, `stockL_in`, `sellingPrice`, `storeSku`.
- `demand.configurationId`, `configurationVersion`, `classId`;
- `definedWorkpieceLengthIn` positive inches;
- `cut.angleDeg` finite and 0–45°; `cut.plane` exactly `miter-face`;
- `datumC.method` one of the allowed methods and `datumC.stationId` exactly `SAW-L`;
- nonempty `parts[]`; each part has unique nonblank `partId`, positive `lengthIn`;
- each part `features[]` may contain only `SPOT_ON_LOCATION`, with finite `xIn` within the part and a declared across-width rule; inset mode requires exactly 1.5 or 2 in and the inset must lie within actual board width;
- optional declared saw/spot counts;
- optional unresolved-condition strings are carried into unresolved state.

### `evaluateD001UserDefinedBoard` ordered checks and outcomes

1. Missing demand → `UNRESOLVED / DIMENSIONAL_TRAVEL_DEMAND_REQUIRED`.
2. Missing/non-board offering → `UNRESOLVED / BOARD_OFFERING_REQUIRED`.
3. Invalid workpiece length → `DEFINED_WORKPIECE_LENGTH_REQUIRED`.
4. Missing angle → `MITER_ANGLE_REQUIRED`; outside 0–45 → `REFUSED / MITER_ANGLE_OUTSIDE_D001_STAGE2_ENVELOPE`.
5. Wrong plane → `REFUSED / MITER_PLANE_NOT_DECLARED`.
6. Invalid Datum-C method → `DATUM_C_ESTABLISHMENT_METHOD_REQUIRED`; wrong reference station → `DATUM_C_REFERENCE_STATION_REQUIRED`.
7. Invalid actual width → `ACTUAL_BOARD_WIDTH_REQUIRED`.
8. No parts → `IDENTIFIED_PARTS_REQUIRED`; duplicate/blank IDs → `UNIQUE_PART_ID_REQUIRED`; invalid lengths → `PART_LENGTH_REQUIRED`.
9. Non-spot feature → `UNSUPPORTED_OR_MISSING_FEATURE_KIND` (unresolved); missing spot X → `SPOT_LOCATION_REQUIRED`; spot outside part → `REFUSED / SPOT_LOCATION_OUTSIDE_PART`; undeclared across-width rule → `SPOT_ACROSS_WIDTH_RULE_NOT_DECLARED`; undeclared inset → `SPOT_INSET_NOT_DECLARED`; inset outside board width → `SPOT_INSET_OUTSIDE_BOARD_WIDTH`.
10. Incoming unresolved conditions are appended unchanged.
11. If any unresolved exists, return `UNRESOLVED` before deriving a final complete estimate; if no unresolved but any refusal exists, return `REFUSED`.
12. Derive one reference cut at `SAW-L`; collect/sort spots by workpiece X; index each spot to `SPOT-FACE-REF`; then for each part index to `SAW-L`, cut, subtract part length + 0.125 kerf, and rebase Datum C on the fresh cut face.
13. Derived saw count is `1 + number of parts`; derived spot count is number of accepted spot features. Mismatch against declared counts → `DECLARED_SAW_COUNT_MISMATCH` or `DECLARED_SPOT_COUNT_MISMATCH` (`UNRESOLVED`).
14. After each cutoff, retained remainder must be at least 24 in. Any failure → `REFUSED / LAST_REMAIN_BELOW_TWO_ROLLER_CONTROL`.
15. Sum handling + reference + indexing + saw + spot + mill + release/label. Calculate material, machine service, and Q. Low-level success status is `BUDGETARY_ESTIMATE`, `complete:true`; the Store wrapper maps that to job `SUPPORTABLE`.

### `evaluateD001DimensionalBatch` inputs and ordered checks

This batch path accepts `componentRuns[]`, each containing `item` and `component`.

1. Empty/not-array → `UNRESOLVED / DIMENSIONAL_COMPONENT_RUNS_REQUIRED`.
2. Missing component object → `COMPONENT_PROGRAM_REQUIRED`; missing/non-board item → `COMPONENT_STORE_BOARD_REQUIRED`.
3. Each component requires unique nonblank `componentId`, positive `finishedLengthIn`, positive `finishedWidthIn`.
4. Finished length below 24 → `REFUSED / COMPONENT_LENGTH_BELOW_TWO_ROLLER_CONTROL`; above 72 → `REFUSED / COMPONENT_LENGTH_EXCEEDS_D001_TWO_SAW_SPAN`; finished width above item actual width → `COMPONENT_WIDTH_EXCEEDS_STORE_BOARD_WIDTH`.
5. Spot feature: offering must list `SPOT_ON_LOCATION`; X must be finite and within component; placement must be declared.
6. Any other feature must be `MILL_LONGITUDINAL_PROFILE`; offering must list that operation; `pathLengthIn`, `yIn`, `totalDepthIn` must be finite; path must equal finished length (`MILL_PATH_MUST_MATCH_COMPONENT_LENGTH` unresolved); Y must equal finished width (`MILL_Y_MUST_MATCH_FINISHED_WIDTH` unresolved); depth above stock thickness → `MILL_DEPTH_EXCEEDS_STOCK_THICKNESS`; mill timing may further refuse profile length/Y.
7. Duplicate component ID → `UNIQUE_COMPONENT_ID_REQUIRED`.
8. Unresolved reasons return `UNRESOLVED`; otherwise refusals return `REFUSED`.
9. Each component plan performs load/seat, square reference cut, X index to the `SAW-R` finished cut, finished crosscut, any longitudinal mills, any spots, and release/label.
10. Times are summed across components; machine service is total machine hours × $250. Low-level success is `BUDGETARY_MACHINE_ESTIMATE`, complete for declared component travel.

Additional batch reason codes are `OP_NOT_ON_OFFERING:SPOT_ON_LOCATION`, `SPOT_LOCATION_OUTSIDE_COMPONENT`, `UNSUPPORTED_OR_MISSING_BATCH_FEATURE_KIND`, `OP_NOT_ON_OFFERING:MILL_LONGITUDINAL_PROFILE`, `MILL_FEATURE_GEOMETRY_REQUIRED`, `MILL_DEPTH_EXCEEDS_STOCK_THICKNESS`, plus mill helper reasons `MILL_PROFILE_LENGTH_EXCEEDS_D001_STAGE2_ENVELOPE`, `MILL_Y_EXCEEDS_TOOL_TRAVEL`, and, for pass-through mode, `EDGE_MILL_BOARD_BELOW_TWO_ROLLER_CONTROL`.

### It does not do

The travel standard does not allocate stock; select species; choose hardware; infer unknown part geometry; turn a spot into generic drilling; use project names as machine logic; claim measured feeds; claim commissioned workholding; issue controller motion; authorize Cycle Start; add a setup charge; or apply a species-specific feed multiplier.

### Verification

- `tests/d001-travel-standard.test.mjs` — unnamed module-level assertions: Job 1 Q $8.54, 1.4227 min, 3 saw cuts, 2 spots, final remainder 27.625 in, 60→72→96 candidate ladder, 46° refusal, missing spot X unresolved, count mismatch unresolved, deterministic hashes, no legacy setup/$100 rate.
- `tests/spot-inset-depth.test.mjs` — unnamed module-level assertions: point/plunge geometry, 1.5/2-in spot placement, invalid 1.75 inset refusal, out-of-component spot refusal.
- `tests/alcove-via-cut-packages.test.mjs` — batch use through cut packages, including the rip.
- `tests/cut-package.test.mjs` — unnamed sequence/long-part and edge-mill use.
- `tests/d001-travel-helpers.test.mjs` — the X (2 in) and Y (1 in) triangular/trapezoidal thresholds from V²/A on both sides, the unmodeled Datum-C methods, and the saw helper's invalid-angle `NaN`.

### Where it lives

`src/evaluation/engine/d001-travel-standard.mjs`: `calculationHash`, `xIndexTimeSec`, `yIndexTimeSec`, `sawFeedInPerMin`, `sawCycleSec`, `spotPointLengthIn`, `spotPlungeIn`, `spotCycleSec`, `millLongitudinalCycleSec`, `storeMachineSellRate`, `evaluateD001UserDefinedBoard`, `evaluateD001DimensionalBatch`, and private normalization/planning helpers.

---

## 6A.4 `src/evaluation/engine/pricing.mjs` — price and cycle model identities, and complete user-defined-board Q

### What it is for

This module names the price engine and cycle model that every dimensional estimate reports, and produces the complete estimate for one identified user-defined board on one Store offering. The 5% mark-on is the catalog’s rule and is applied and checked by the catalog (§5.3, `sellingPriceFor`).

### Inputs and decisions

- `ENGINE` — `STB-STORE-ZERO-PRICE-1` version `0.3.0`, document kind `BudgetaryEstimate`, governing standard `DIMENSIONAL-STORE-TRAVEL-STANDARD-0.1.md` (an identifier of the travel standard, not a file in this repository).
- `CYCLE_MODEL` and `ECONOMICS_MODEL` restate the travel standard’s identity and economics with `measured:false`, `commissioned:false`.
- `estimateUserDefinedBoardTravel(catalog, definition)` requires an exact Store SKU (`UNRESOLVED / BOARD_OFFERING_REQUIRED` otherwise) and forwards configuration identity, workpiece length, angle/plane, Datum-C method, parts, declared counts, unresolved conditions, and Store revision to `evaluateD001UserDefinedBoard`; a complete result also reports the cycle (model identity, minutes, hours, saw surface speed and feed).

### Outcomes/reasons

`UNRESOLVED / BOARD_OFFERING_REQUIRED`, and delegated `BUDGETARY_ESTIMATE`, `UNRESOLVED`, or `REFUSED` from the travel evaluator. It does not emit Store job `UNAVAILABLE`; availability is Store/evaluator work.

### It does not do

It does not add a setup charge/time; derive Q from counts (there is no count-only estimate); perform material substitution; or inspect stock availability.

### Verification

- `tests/catalog-pricing.test.mjs` — unnamed selling-price/catalog assertions and the Job 1 complete Q.
- `tests/d001-travel-standard.test.mjs` — unnamed zero setup, $250/h sell rate and complete Job 1 Q assertions.
- `acceptance/boundaries` — “no count-only or compatibility pricing path exists”.

### Where it lives

`src/evaluation/engine/pricing.mjs`: `ENGINE`, `CYCLE_MODEL`, `ECONOMICS_MODEL`, `estimateUserDefinedBoardTravel`.

---

## 6A.5 `src/evaluation/evaluators/cut-package.mjs` — neutral dimensional packages and hardware lines

### What it is for

This evaluator answers each dimensional package or item line independently, preserves the requested wood/hardware meaning, chooses a Store parent/package under declared rules, models D-001 work, and returns each line’s Q or exact failure.

### Inputs

Top-level `demand` reads `configurationId`, `configurationVersion`, optional `storeRevision`, `cutPackages[]`, and `itemLines[]`.

Each cut package reads:

- `packageId` string, required;
- `material.species`, `material.nominalT`, `material.nominalW`, optional `form` default `board`, and `grade` when more than one Store grade is possible;
- `endCut.angleDeg`, default 0 if absent but must be finite after conversion;
- optional `finishedWidthIn` positive inches;
- nonempty `parts[]`; each part requires unique `partId`, positive `lengthIn`, optional `spots[]`;
- each spot reads `xIn`, `acrossWidthRule`, optional `insetFromEdgeIn`.

Each exact-SKU item line reads `lineId`, `storeSku`, and positive whole-number `qty`.

Each structured hardware line reads `lineId`, positive whole-number piece `qty`, and a requirement object containing exactly the recognized fields: `kind`, exactly one of `gauge` or `diameterIn`, positive `lengthIn`, `finish`, and optional/expected `unit:"piece"`.

### Package constants and formulas

- end cleanup minimum: 0.5 in;
- kerf: 0.125 in;
- retained control: 24 in;
- one-board sequence usable length: `stockLength - 0.125 - 24`;
- first-fit-decreasing packing uses `part.length + 0.125` as need; after packing, each board is cut **short pieces first**;
- finished-width edge milling refuses width above the actual board or removal above 1.0 in;
- material extension: `sellingPrice × number of boards`;
- machine service: aggregate D-001 machine seconds / 3600 × $250;
- line `Q = material extension + machine service`;
- structured hardware packages: `ceil(required pieces / piecesPerPackage)`;
- among exact structured hardware matches, select the single package-size SKU with the lowest total Store cost whose stock covers the needed packages; ties by SKU; never mix package sizes.

### Ordered package decision sequence

1. Missing `packageId` → `UNRESOLVED / PACKAGE_ID_REQUIRED`.
2. Validate parts. Duplicate/blank part ID → `UNIQUE_PART_ID_REQUIRED`; invalid length → `PART_LENGTH_REQUIRED`; no valid parts → `PACKAGE_PARTS_REQUIRED`.
3. Missing, null, blank or nonfinite end-cut angle → `END_CUT_ANGLE_REQUIRED`. A package never becomes a square cut by omission; an explicit 0 is a square cut.
4. Present but invalid/nonpositive finished width → `FINISHED_WIDTH_REQUIRED`.
5. Missing species/nominal thickness/nominal width → `MATERIAL_CHOICE_REQUIRED`.
6. Match offered Store material exactly on chosen material class. If more than one grade exists and grade omitted → `GRADE_CHOICE_REQUIRED`. No candidates → `REFUSED / NO_MATCHING_BOARD_OFFERING`.
7. Required ops are `CROSSCUT` for 0°, otherwise `MITER_LIMITED`; add `SPOT_ON_LOCATION` if any spot exists; add `MILL_LONGITUDINAL_PROFILE` when edge mill is required.
8. For each candidate, plan parts:
   - if part + kerf fits sequence capacity, it goes to sequence packing;
   - else if part exceeds `stockLength - 0.5`, refuse `PART_NOT_HALF_INCH_UNDER_BOARD`;
   - else if angle is nonzero, refuse `ANGLED_PART_LEAVES_LESS_THAN_CONTROL_LENGTH`;
   - else if part > 72 in, refuse `COMPONENT_LENGTH_EXCEEDS_D001_TWO_SAW_SPAN`;
   - else if part < 24 in, refuse `COMPONENT_LENGTH_BELOW_TWO_ROLLER_CONTROL`;
   - else use one-board-per-part long-part path.
9. Finished width: width above board → `FINISHED_WIDTH_EXCEEDS_BOARD_WIDTH`. Removal up to 1 in is an edge-mill pass (`EDGE_MILL_PASS_THROUGH`). Removal over 1 in is a rip (`RIP_AT_FINISHED_WIDTH`, rule `STB-CUT-PACKAGE-RIP-0.1`, §19): the router cuts through at the finished width and the far strip is returned to the owner as an offcut, one per board, reported on the line as `edgeMill.offcut`. Either way the board is brought to width before any of its parts is cut, and the same retained-control rules apply.
10. Run `capabilityAnswer`, the same envelope check every path uses.
11. Candidate status: plan refusal first; then capability refusal; then unresolved capability/price; then unavailable stock; else `SUPPORTABLE`.
12. Supportable material candidates are ranked by material extension, then stock length, then SKU. For each in that order, run actual D-001 package timing. Machine refusal/unresolved causes the evaluator to try the next supportable material candidate without changing material class.
13. First machine-complete candidate returns line `SUPPORTABLE`.
14. If machine attempts fail, first machine reason returns `REFUSED` or `UNRESOLVED`.
15. Otherwise rank remaining candidate states `UNRESOLVED` before `UNAVAILABLE` before `REFUSED`. If the longest part exceeds the longest stocked board minus 0.5 in, add `PART_LONGER_THAN_LONGEST_STOCKED_BOARD`.

### Item-line decision sequence

**Exact SKU.** Missing `lineId` → `LINE_ID_REQUIRED`; missing SKU → `STORE_SKU_REQUIRED`; nonwhole/nonpositive qty → `WHOLE_QUANTITY_REQUIRED`; no catalog row → `REFUSED / NO_OFFERING`; row not offered → `REFUSED / NOT_OFFERED`; missing price → `UNRESOLVED / MISSING_PRICE`; insufficient stock → `UNAVAILABLE / ON_HAND_SHORT` or `NOT_ON_HAND`; otherwise `SUPPORTABLE`, Q = selling price × qty.

**Functional requirement** (`requirementId`). The item is the one offering whose catalog row declares the requirement in `satisfiesRequirementIds` (`offeringForRequirement`); the line reports `resolvedBy: FUNCTIONAL_REQUIREMENT_DECLARED_BY_OFFERING`. Nonwhole/nonpositive qty → `WHOLE_QUANTITY_REQUIRED`; no declaring offering → `REFUSED / NO_OFFERING_FOR_REQUIREMENT`; not offered → `REFUSED / NOT_OFFERED`; missing price → `UNRESOLVED / MISSING_PRICE`; insufficient stock → `UNAVAILABLE`; otherwise `SUPPORTABLE`, Q = selling price × qty. A line naming more than one of `storeSku`, `requirement`, `requirementId` → `UNRESOLVED / ITEM_LINE_NAMES_MORE_THAN_ONE_ITEM`.

**Structured hardware.** Invalid object/extra fields/missing kind/finish/length, not exactly one of gauge/diameter, nonpositive size, or unit other than `piece` → `UNRESOLVED / HARDWARE_REQUIREMENT_INCOMPLETE`. Nonwhole/nonpositive piece count → `WHOLE_QUANTITY_REQUIRED`. No exact structured match → `REFUSED / NO_MATCHING_HARDWARE_OFFERING`. Matching rows without price → `UNRESOLVED / MISSING_PRICE`. No matching package SKU with enough stock → `UNAVAILABLE` against the cheapest priced exact match. Otherwise `SUPPORTABLE`.

### Aggregate outcome

Missing configuration identity → definition gap `CONFIGURATION_IDENTITY_REQUIRED`. No lines → `LINES_REQUIRED`. Duplicate package/item IDs → `UNIQUE_LINE_ID_REQUIRED`. If any definition gap exists, aggregate is `UNRESOLVED`; if all lines supportable, aggregate is `SUPPORTABLE`; otherwise `NOT_ALL_LINES_SUPPORTABLE`. Each line retains its own canonical status.

### It does not do

It does not recognize project names; substitute wood or grade; recommend a near hardware match; mix package sizes; create a kit-wide price that hides line status; round an unsupported spot inset; silently drop spots; or treat a page input range as Store stock.

### Verification

`tests/cut-package.test.mjs` contains unnamed module-level assertions covering: project neutrality; mixed independent lines; species/grade preservation; Q formula; both-end cutting/0.5-in rule/short-pieces-first/stub return; 119-in long-stock path; missing grade; 1.5/2-in spots and 1.75 refusal; exact item lines; fresh receipt; exact structured hardware matching; package selection; no near substitute; incomplete requirement; exact-SKU mode; shortage; no SKU/description parsing; whole-board edge milling; rip when more than 1 in comes off; no-mill when width already matches; pass-through over 60 in; pass-through refusal below 24 in.  
Untested as a dedicated fixture: lexical SKU tie in board candidate selection; dynamic `PART_LONGER_THAN_LONGEST_STOCKED_BOARD` addition is asserted in the mixed test; every individual possible D-001 propagated reason is not separately recreated at cut-package level.

### Where it lives

`src/evaluation/evaluators/cut-package.mjs`: `CUT_PACKAGE_STANDARD`, `RIP_RULE`, `evaluateCutPackageJob`, with private package, packing, machine, item, hardware and functional-requirement helpers. Requests reach it through `src/requests/store-request.mjs`.

---

## 6A.6 Retired: the Alcove evaluator

Specification 0.6 described `alcove-insert.mjs`, a project-shaped evaluator for `ALCOVE_INSERT_V1`. It is retired (§19) and the request type is refused. An alcove is now an ordinary `CUT_PACKAGE_V1` definition (§11.2), and the cut-package evaluator (§6A.5) decides its sequence like any other job's: boards are brought to width first, then cut, under the same retained-control rule.

The retired evaluator packed parent boards to full length and did not keep the 24-in two-roller control length while cutting, and it could not express a rip. Its pine answer was $382.55; the same alcove through cut packages is $429.16 (§6A.12 C). The 44 recorded Alcove answers are retired by `acceptance/differential/approved-changes.json`, not replayed. The section number is kept so that references stay valid.

---

## 6A.7 `src/evaluation/envelopes/s001-stage2-envelope.mjs` — S-001 sheet envelope

### What it is for

This module declares the Stage-2 sheet-cell and yard-panel-saw assumptions used by the sheet evaluator and supplies the centered router work field.

### Inputs and constants

`centeredField(parentLengthIn, parentWidthIn, field)` reads sheet length/width in inches and the default field dimensions.

The envelope declares:

- parent sheet exactly 96 × 48 in for the modeled path;
- thickness 0.25–0.75 in;
- centered router field 48 in in X × 36 in in Y;
- router 0.25-in tool, 0.5-in pass depth, 60 in/min feed, 10 s plunge/retract per routed path/pass, 2 s per tab/pass, 120 s load/seat/reference, 60 s release/unload, min routed feature 6 in, min split piece width 3 in;
- panel saw 0.125-in kerf, 45 s set/align per cut, 150 in/min cut feed, min piece 6 in, min routed-feature clearance 1 in;
- label 10 s per returned piece;
- feature kinds only `ARCHED_APERTURE`, `STRAIGHT_SPLIT`, `CROSSCUT`;
- machine-local language fields `spline`, `toolpath`, `gcode`, `controller`, `servoSteps` are not accepted as project definition language.

Centered field:

\[
x_0=(L-48)/2,\quad x_1=(L+48)/2,\quad y_0=(W-36)/2,\quad y_1=(W+36)/2
\]

The economics basis deliberately reuses the Stage-2 Store machine-hour object; that is shared economics, not a claim that S-001 is D-001.

### Outcomes

This envelope object itself returns no job disposition; `centeredField` only computes geometry. All limits are consumed by the sheet evaluator.

### It does not do

It does not claim physical workholding, measured tab retention, commissioned sheet hardware, measured feed/cycle, Cycle Start, generic CNC capability, or exterior rating unless the offering itself establishes it.

### Verification

`tests/sheet-package.test.mjs` named tests collectively assert exact 96×48 behavior, centered-field refusal, half-sheet refusal, operation order, evidence labels, panel-saw route, and no machine-local controller output. Individual constant values such as 45 s set/align and 150 in/min are exercised by Q/time but not separately asserted as literals; those literal constants are **untested** in isolation.

### Where it lives

`src/evaluation/envelopes/s001-stage2-envelope.mjs`: `S001_STAGE2_ENVELOPE`, `centeredField`.

---

## 6A.8 `src/evaluation/engine/circular-segment.mjs` — circular-segment geometry

### What it is for

This module derives and validates the radius of an arched aperture from the canonical pair chord + rise; it is geometry validation, not a CAD kernel or toolpath generator.

### Inputs, sequence, outcomes, and formula

`evaluateCircularSegment({chord_in, rise_in, radius_in})` reads inches.

1. Missing chord or rise → `UNRESOLVED / CURVE_CHORD_OR_RISE_MISSING`.
2. Nonfinite chord/rise → `REFUSED / CURVE_NOT_NUMERIC`.
3. Nonpositive chord/rise → `REFUSED / CURVE_CHORD_OR_RISE_INVALID`.
4. Derive

\[
R=\frac{C^2}{8H}+\frac{H}{2}
\]

If derived radius is nonfinite/nonpositive → `CURVE_RADIUS_NOT_CONSTRUCTIBLE`.
5. Optional supplied radius must be finite and positive or `CURVE_RADIUS_INVALID`.
6. Supplied radius must be within **0.001 in** of the derived radius or `CURVE_RADIUS_CONTRADICTS_CHORD_RISE`.
7. Otherwise `SUPPORTABLE`, geometry class `CURVILINEAR`, kind `CIRCULAR_SEGMENT`.

`referenceArchedAperture` returns the reference 36-in chord, 12-in rise, derived 19.5-in radius within a 48 × 72 reference shape.

### It does not do

It does not apply the sheet work field; refuse rise greater than half width; place tabs; produce toolpaths; or claim physical routing feasibility. Those belong to the sheet evaluator/policies.

### Verification

The canonical sheet test named “canonical playhouse window is SUPPORTABLE with a complete budgetary Q” asserts the 36/12 result radius = **19.5 in**. Direct error branches in `circular-segment.mjs` do not have dedicated tests in the current Store test suite and are therefore **untested** individually.

### Where it lives

`src/evaluation/engine/circular-segment.mjs`: `radiusFromChordRise`, `evaluateCircularSegment`, `referenceArchedAperture`.

---

## 6A.9 `src/evaluation/engine/stencil-tab-policy.mjs` — reference tab planning and split retention

### What it is for

This module produces deterministic **reference** tab geometry for the arched S-001 aperture and, where the retained center is split, ensures each retained half has at least two tabs. It is not a holding-force or safety model.

### Inputs

`archedAperturePerimeter` and `planArchedStencilTabs` read positive inch values `chord_in`, `rise_in`, `radius_in`, `straightHeight_in`; the planner also reads optional integer `requestedTabCount`.

`planSplitStencilTabs(plan, geometry)` reads a successful tab plan plus the same aperture geometry.

### Policy constants and formulas

- `referenceBaseCount = 4`;
- `planningReserveTabs = 1`;
- `maxAllowedGap_in = null`;
- `minBridgeWidth_in = null`;
- `minRemainingThickness_in = null`;
- `cornerKeepout_in = null`;
- `transitionKeepout_in = null`;
- `minTabsPerRetainedPiece = 2`;
- split-line keepout = 0.5 in;
- placement method `DISTRIBUTED_ARCLENGTH_TRANSITION_AVOIDANCE`.

Arched perimeter:

\[
\theta = 2\arcsin(C/(2R))
\]
\[
L_{arc}=R\theta
\]
\[
P=C+2H+L_{arc}
\]

Tab count:

\[
spacingRequired=
\begin{cases}
0,&maxAllowedGap\text{ is null}\\
\lceil P/maxAllowedGap\rceil,&\text{otherwise}
\end{cases}
\]

\[
policyTarget=\max(4,spacingRequired)+1
\]

\[
plannedTabCount=\max(requestedTabCount,\ policyTarget)
\]

The planner chooses an equal-spacing phase that maximizes clearance from the four contour transitions. Split planning classifies tabs by X relative to ±0.5 in around the vertical split line. If one side has fewer than two tabs, a tab is added at the midpoint of that side’s largest open perimeter stretch.

### Outcomes/reasons

Invalid/incomplete perimeter geometry → `UNRESOLVED / TAB_PLAN_GEOMETRY_UNRESOLVED`. Noninteger or <1 requested count → `REFUSED / TAB_PLAN_COUNT_INVALID`. Success → `REFERENCE_PLAN_READY`. Split planning returns the original unsuccessful plan unchanged or an updated `REFERENCE_PLAN_READY`.

### It does not do

It does not assign bridge width, remaining thickness, maximum supported gap, holding force, safety factor, production readiness, or G-code. The one extra tab is a planning reserve only.

### Verification

- `tests/sheet-package.test.mjs` — “every piece comes back to the owner and each split half keeps two tabs” and canonical sheet test.
- The policy’s exact equal-spacing phase/candidate coordinates and added-tab largest-gap algorithm are **untested** as exact coordinate fixtures.
- Null physical-retention constants are source-declared and **untested** as behavior because they intentionally remain unmeasured.

### Where it lives

`src/evaluation/engine/stencil-tab-policy.mjs`: `archedAperturePerimeter`, `planArchedStencilTabs`, `planSplitStencilTabs`.

---

## 6A.10 `src/evaluation/evaluators/sheet-package.mjs` — S-001 sheet material, feature, piece, time, and Q evaluator

### What it is for

This evaluator matches one declared sheet, answers every requested sheet feature, plans reference tabs, enforces S-001/yard-panel-saw constraints, accounts for every returned piece, and returns machine time and Q only when the complete request is supportable.

### Inputs

Top-level `demand` reads `configurationId`, `configurationVersion`, optional `storeRevision`, `sheet`, `features[]`, optional `exteriorRatingRequested`, and machine-local forbidden keys.

`sheet` reads `thicknessIn`, `lengthIn`, `widthIn`, optional `species`, optional `grade`.

Feature forms:

- `ARCHED_APERTURE`: `featureId`, `placement`, `widthIn`, `straightHeightIn`, `riseIn`, `retain`, `requestedTabCount`;
- `STRAIGHT_SPLIT`: `featureId`, `within` aperture id, `line`;
- `CROSSCUT`: `featureId`, `fromEnd`, `distanceIn`.

### Ordered decision sequence

1. Missing configuration id/version → unresolved `CONFIGURATION_IDENTITY_REQUIRED`.
2. If any top-level machine-local key (`spline`, `toolpath`, `gcode`, `controller`, `servoSteps`) is present → refusal `MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED`.
3. Sheet size must contain finite length/width/thickness or `SHEET_SIZE_MISSING` (null is missing, never 0). Every piece cut is returned: `returnAllPieces` missing or null → unresolved `RETURN_ALL_PIECES_REQUIRED`; any value but `true` → refusal `PIECE_DISPOSAL_NOT_OFFERED`.
4. Parent must be exactly 96 × 48 or `SHEET_SIZE_OUTSIDE_S001_ENVELOPE`; thickness outside 0.25–0.75 → `SHEET_THICKNESS_OUTSIDE_S001_ENVELOPE`.
5. Features must be nonempty or `FEATURES_REQUIRED`; IDs must be present/unique or `UNIQUE_FEATURE_ID_REQUIRED`.
6. Any feature kind outside the three declared kinds → `FEATURE_KIND_NOT_DECLARED`.
7. For each aperture:
   - placement must be `CENTERED` or `APERTURE_PLACEMENT_NOT_DECLARED`;
   - retention must be `TABS` or `APERTURE_RETENTION_MUST_BE_TABS`;
   - width/straight height/rise must be finite or `APERTURE_SIZE_MISSING`;
   - each must be >0 or `APERTURE_SIZE_INVALID`;
   - circular-segment geometry must pass, else its curve reasons propagate;
   - rise above width/2 → `ARCH_RISE_EXCEEDS_HALF_WIDTH`;
   - width or straight height below 6 → `ROUTED_FEATURE_BELOW_MINIMUM`;
   - centered bounding box must fit wholly in centered work field or `CENTER_WORK_FIELD_EXCEEDED`;
   - missing requested tab count → `TAB_COUNT_MISSING`; invalid count → `TAB_PLAN_COUNT_INVALID`; tab planner errors propagate.
8. For each split: referenced aperture must exist or `SPLIT_HOST_APERTURE_NOT_DEFINED`; line must be `VERTICAL_CENTERLINE` or `SPLIT_LINE_NOT_DECLARED`; each half’s width `(aperture width - 0.25)/2` must be at least 3 in or `SPLIT_PIECE_BELOW_MINIMUM`.
9. For each crosscut: end must be `LEFT` or `RIGHT` or `CROSSCUT_END_NOT_DECLARED`; missing distance → `CROSSCUT_DISTANCE_MISSING`; X must lie strictly inside sheet or `CROSSCUT_OUTSIDE_SHEET`; cut line must remain at least 1 in clear of routed aperture bounding boxes or `CROSSCUT_INTERSECTS_ROUTED_FEATURE`.
10. Apply split tab planner to successful host apertures.
11. Resolve sheet offering:
    - exact form/thickness/length/width and optional species/grade match; none → `NO_MATCHING_SHEET_OFFERING`;
    - no offered match → `SHEET_NOT_OFFERED`;
    - offered but wrong cell/required op → `OPERATION_NOT_ON_SHEET_OFFERING`;
    - no price → `MISSING_PRICE`;
    - no priced matching sheet with sufficient stock → `UNAVAILABLE` using `ON_HAND_SHORT` or `NOT_ON_HAND`;
    - otherwise select lowest selling price, tie by SKU.
12. If exterior rating requested but selected grade text does not establish exterior → unresolved `EXTERIOR_RATING_NOT_ESTABLISHED_BY_SKU`.
13. Piece accounting: sort crosscut X values; apply half-kerf at interior cut boundaries; any resulting panel length under 6 in → `CROSSCUT_PIECE_BELOW_MINIMUM`. Create panel/frame pieces and retained center piece(s), all `RETURNED_TO_OWNER`.
14. Every requested feature gets `featureAnswers[]`; refusal/unresolved is attributed by feature id. Nothing is silently dropped.
15. Status precedence: any refusal → `REFUSED`; else any unresolved → `UNRESOLVED`; else stock shortage → `UNAVAILABLE`; else `SUPPORTABLE`.
16. Only `SUPPORTABLE` receives time, operations, totals, and Q.

### Sheet time formula

Passes:

\[
passes=\max(1,\lceil actualThickness/0.5 - 10^{-9}\rceil)
\]

Route length:

\[
L_{route}=\sum aperturePerimeters+\sum splitLengths
\]

Time components:

- load/reference: 120 s if any routed path;
- route: `L_route × passes / 60 in/min × 60 s/min`;
- plunge/retract: `number of routed paths × passes × 10 s`;
- tabs: `planned tab count × passes × 2 s`;
- release: 60 s if routed;
- each panel-saw cut: `45 s + (48 in / 150 in/min × 60)` for the canonical full-width cut;
- label: `10 s × returned piece count`.

Machine service = total seconds/3600 × $250, rounded to cents. Sheet material = selected catalog `sellingPrice`. Q = material + machine service.

### Outcomes/reasons

`REFUSED`: `MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED`, `SHEET_SIZE_OUTSIDE_S001_ENVELOPE`, `SHEET_THICKNESS_OUTSIDE_S001_ENVELOPE`, `FEATURE_KIND_NOT_DECLARED`, aperture/circular-segment refusals, `ARCH_RISE_EXCEEDS_HALF_WIDTH`, `ROUTED_FEATURE_BELOW_MINIMUM`, `CENTER_WORK_FIELD_EXCEEDED`, `TAB_PLAN_COUNT_INVALID`, `SPLIT_HOST_APERTURE_NOT_DEFINED`, `SPLIT_LINE_NOT_DECLARED`, `SPLIT_PIECE_BELOW_MINIMUM`, `CROSSCUT_END_NOT_DECLARED`, `CROSSCUT_OUTSIDE_SHEET`, `CROSSCUT_INTERSECTS_ROUTED_FEATURE`, `CROSSCUT_PIECE_BELOW_MINIMUM`, `NO_MATCHING_SHEET_OFFERING`, `SHEET_NOT_OFFERED`, `OPERATION_NOT_ON_SHEET_OFFERING`.

`UNRESOLVED`: `CONFIGURATION_IDENTITY_REQUIRED`, `SHEET_SIZE_MISSING`, `FEATURES_REQUIRED`, `UNIQUE_FEATURE_ID_REQUIRED`, `APERTURE_SIZE_MISSING`, `TAB_COUNT_MISSING`, circular-segment unresolved reasons, `CROSSCUT_DISTANCE_MISSING`, `MISSING_PRICE`, `EXTERIOR_RATING_NOT_ESTABLISHED_BY_SKU`, and missing formal request id `STORE_EVALUATION_REQUEST_ID_REQUIRED`.

`UNAVAILABLE`: selected conforming/priced sheet lacks sufficient fixture stock (`ON_HAND_SHORT` or `NOT_ON_HAND`).

`SUPPORTABLE`: all above pass and complete Q is calculated.

### It does not do

It does not move a crosscut away from an opening; shrink an aperture; drop an unsupported feature; turn G-code into accepted definition language; claim exterior rating from inference; route an edge outside the centered field; use D-001 for a sheet; claim physical tab holding; or authorize Cycle Start.

### Verification

Every named test in `tests/sheet-package.test.mjs` is directly relevant:

- “canonical playhouse window is SUPPORTABLE with a complete budgetary Q”;
- “every piece comes back to the owner and each split half keeps two tabs”;
- “an opening past the centered working field is REFUSED with a reason and no price”;
- “a crosscut through the routed opening is REFUSED, never moved”;
- “a crosscut piece under the panel-saw minimum is REFUSED”;
- “an arch taller than half its width is REFUSED”;
- “missing tab count is UNRESOLVED; machine-local language and undeclared features are REFUSED”;
- “exterior rating on a sheathing sheet stays UNRESOLVED”;
- “no sheet on hand makes the job UNAVAILABLE, not a fallback”;
- “a sheet the cell cannot route is REFUSED; a half sheet is outside the S-001 envelope”;
- “every request is freshly evaluated with a receipt bound to this request and this Store”;
- “D-001 still refuses sheets: a sheet never falls through dimensional cut packages”;
- “every requested feature is answered; nothing is silently dropped”;
- “assumptions are labeled as newly adopted Stage-2 reference, not measured or quoted”.

Untested as dedicated cases: wrong aperture placement; wrong retention mode; zero/negative aperture dimensions; split line other than vertical centerline; crosscut from-end value other than left/right; exact `SHEET_NOT_OFFERED`; exact missing-price sheet case; exact operation-not-on-sheet-offering case.

### Where it lives

`src/evaluation/evaluators/sheet-package.mjs`: `SHEET_PACKAGE_STANDARD`, `evaluateSheetPackageJob`, with material, feature, piece, time, and operation helpers. Requests reach it through `src/requests/store-request.mjs`.

---

## 6A.11 `src/requests/offering-lookup.mjs` — offering lookup over Store-owned catalog facts

### What it is for

`OFFERING_LOOKUP` is catalog discovery, not a fabrication evaluator. It reports offered Store rows with their price and stock basis and attached observation reference. It is Store code over Store data; the System adapter previously carried the same search and now only needs to call it.

### Inputs and search limits

The lookup is exactly one of: `{ searchText }` — a nonblank string of at most 80 characters; `{ storeSku }` — a nonblank SKU; `{ query }` — exact-match material fields (`species`, `form`, `nominalT`, `nominalW`, `stockL_in`). Anything else is refused with its reason (Appendix D.8). Search returns at most 20 rows plus `totalMatches` and `truncated`.  
*Trace: `src/requests/offering-lookup.mjs` (`OFFERING_SEARCH_LIMITS`, `lookupProblems`). Test: `tests/store-request.test.mjs` — “a malformed lookup is refused, never reported as nothing found”.*

### Search algorithm

1. Normalize lower case; convert `×` to `x`; remove spaces around the first dimension `x`; collapse whitespace.
2. Tokenize on whitespace and punctuation; hyphenated tokens also contribute their parts.
3. Build each row’s tokens from the row’s description, species, grade, form, nominal `TxW`, stock length, sheet dimensions, full SKU, and hyphen-separated SKU parts. Nothing is inferred beyond the row’s own structured fields/description.
4. Rank 0: exact SKU string. Rank 1: no-space query that is a SKU prefix. Rank 2: **all** query tokens are row tokens (AND, not OR).
5. Exclude `offered !== true`.
6. Sort by rank, then stable catalog order. Return first 20; report total before truncation.

### Outcomes

Search with no matches is still a valid answer: `offerings:[]`, `totalMatches:0`, `truncated:false`. An exact SKU or query lookup returns `found:true/false` and a single attributed row when exactly one offered row answers it. Lookup answers contain no evaluation or estimate; there is no machine time and no Q.

### It does not do

It does not fuzzy-match, apply synonyms, infer material capability, decide a job fits, change the project, or evaluate a job merely because a user searches.

### Verification

`tests/store-request.test.mjs` — “offering lookup: search, exact SKU and material query, offered rows only, no Q” (dimension normalization and AND semantics, exact SKU first, offered-only, zero-result validity, cap at 20 with truncation) and “a malformed lookup is refused, never reported as nothing found”.

### Where it lives

`src/requests/offering-lookup.mjs`: `OFFERING_SEARCH_LIMITS`, `normalizeOfferingSearchText`, `searchOfferedCatalog`, `attributedOffering`, `lookupProblems`, `lookupOfferings`.

---

## 6A.13 `src/requests/store-request.mjs` — the request layer

### What it is for

The one way into Store Zero. It refuses anything that is not a clean definition (§3.3), routes each accepted request type to its evaluator or to offering lookup, reads and validates the catalog for the request, and issues the fresh-evaluation receipt (§2.2).

### Inputs

`evaluateStoreRequest(request, { release, catalog, observations, now })`: the request of §3.1; `release`, this Store’s release identity (required — the function throws without it); optional `catalog` (validated like the one on disk) and `observations`; optional `now`, the evaluation clock.

### Decision sequence

1. `requestProblems` applies the gate of §3.3 in order: request shape, declared request type, request id, definition presence, machine-local language, declared definition fields, type-specific checks.
2. A refused or unresolved request is answered with `freshEvaluation:false`, `reasonCodes`, and no receipt.
3. The catalog is validated (`STORE_CATALOG_INVALID` is thrown, never answered around).
4. Offering lookup answers from the catalog and observations.
5. An evaluated type is answered by its evaluator with `storeRevision` set to `release`, and the receipt is built from the type’s declared authority.

### It does not do

It does not accept a Store identity or clock from the request; reuse a prior answer or receipt; evaluate an invalid catalog; or pass an undeclared field to an evaluator.

### Verification

`tests/store-request.test.mjs` (all named tests); `acceptance/boundaries` — “one request layer: no evaluator issues its own receipt”, “evaluation never depends on the request layer”.

### Where it lives

`src/requests/store-request.mjs`: `STORE_EVALUATION_FRESHNESS`, `MACHINE_LOCAL_LANGUAGE`, `REQUEST_TYPES`, `requestProblems`, `evaluateStoreRequest`.

---

## 6A.14 `src/service/server.mjs` — the Store service

### What it is for

Carries Store requests and bounded virtual-evidence requests over HTTPS. It computes no evaluation or machine model itself: evaluation comes from the request layer (§6A.13) against the catalog read for that request; machine evidence comes from the downstream entry point (§10.6). It is deployed from this repository as it stands — no dependency is installed and nothing is fetched at start, so the code that was built is the code that answers.

### Inputs

| Endpoint | Input | Answer |
|---|---|---|
| `GET /health` | none | `status`, `store`, `release`, `source` (the digest of the files this process runs), `protocol`, accepted `requestTypes`, catalog `clock` and offering count, and registered `machineEvidence` identity (§10.6) |
| `POST /v1/requests` | a JSON body that is the request of §3.1, `Content-Type: application/json`, at most 256 KiB | `protocol`, `storeRelease`, `payloadDigest` (SHA-256 of the bytes received), `respondedAt`, `answer` |
| `POST /v1/machine-evidence` | an accepted packet and expected configuration ID/hash (§10.6), same body limits | a correlated virtual-evidence answer, or explicit refusal/staleness |
| `OPTIONS /v1/requests` or `/v1/machine-evidence` | a browser preflight from an allowed origin | `204` with the allowed methods and headers |

Configuration: the commit the host deployed — Render's `RENDER_GIT_COMMIT` or Railway's `RAILWAY_GIT_COMMIT_SHA` — or `STORE_ZERO_RELEASE` where the host supplies none (required: the service refuses to start without a release). A `STORE_ZERO_RELEASE` that contradicts the host's commit refuses to start. `STORE_ZERO_ALLOWED_ORIGINS` (comma-separated) replaces the default allowed browser origin, `https://georgeplattdemo.github.io`.

### Decision sequence

1. A request from a browser `Origin` that is not allowed → `403 ORIGIN_NOT_ALLOWED`. Callers without an `Origin` (servers, health checks) are served.
2. `/health` answers `GET`/`HEAD` only.
3. Any path other than `/health`, `/v1/requests` and `/v1/machine-evidence` → `404 NOT_FOUND`.
4. Both POST endpoints: `OPTIONS` → preflight; any method but `POST` → `405`; a body that is not `application/json` → `415`; over 256 KiB → `413 REQUEST_TOO_LARGE`; unreadable or not JSON → `400`.
5. The request layer or bounded machine-evidence entry point answers. A refusal, stale packet or unresolved request is an answer: `200`, with the reason in `answer.reasonCodes`.
6. An invalid catalog → `503 STORE_CATALOG_INVALID`; any other failure → `500` with no answer. The service never answers around a failure.

At start it requires a release identity, valid catalog and registered reference machine configuration, or it exits. Health validates the catalog and configuration; an invalid one returns `503` rather than claiming health. Request and header timeouts are 15 s and 10 s.

### It does not do

It does not calculate, cache, or retry an answer; accept a Store identity, clock or answer date from a caller; serve browsers on other sites; or reach any other service.

### Verification

`tests/service.test.mjs` (all named tests, over a real HTTP listener); `acceptance/boundaries` — “the service only carries requests: evaluation and evidence use their bounded entry points”.

### Deployment

`Dockerfile` builds the image from `package.json`, `src/` and `data/` only. `render.yaml` is a Render Blueprint (New → Blueprint → this repository → Apply) and `railway.json` the equivalent for Railway; each builds that Dockerfile and checks `/health` before sending traffic, and the host supplies the release identity. Set `STORE_ZERO_ALLOWED_ORIGINS` when the candidate System uses a different browser origin; the default does not admit a new origin automatically.

### Proving what is running

A release label is only a claim. `/health.source` is `STORE-ZERO-SOURCE-DIGEST-1`: SHA-256 over sorted lines `<path> NUL <sha256 of file> LF` for `package.json` and every file under `src/` and `data/`, which is exactly what the `Dockerfile` copies, computed by the running process from its own disk. `npm run source-digest` computes the same value from any checkout. Equal digests mean the running code and data are that commit's; a different digest means they are not, whatever the label says. It detects difference; it is not a signature, and it trusts the host to run the process it reports.

### Verifying a candidate

From a clean checkout of the candidate commit:

```sh
npm run verify:deployment -- https://<candidate-address> --commit <sha>
```

`scripts/verify-deployment.mjs` uses only the public interface and prints PASS or FAIL for each check: health answers; release is the commit; the source digest is the checkout's; the advertised request types; machine evidence advertised with `physicalAuthority:false`; Project 1 `SUPPORTABLE` at $11.09 with a fresh receipt naming this release and a response bound to the exact bytes sent; Project 1 without its grade asked for it; the default SPF board at $8.54; the pine cut package at $429.16; the Playhouse sheet at $65.04; the count-only ticket refused; a missing end-cut angle asked for; virtual machine evidence for Project 1 (45 records, 86.469536 s, admission `BLOCKED`, physical authority false); an altered answer, an answer from another release, and a wrong machine configuration refused. It exits non-zero on any failure. `tests/verify-deployment.test.mjs` runs it against a real local service, a service naming another commit and running other code, and a proxy that alters responses; that is local evidence, not a hosted result.

### Where it lives

`src/service/server.mjs`: `PROTOCOL`, `PATHS`, `LIMITS`, `DEFAULT_ALLOWED_ORIGINS`, `releaseFromEnvironment`, `allowedOriginsFromEnvironment`, `sourceDigest`, `createHandler`, `startServer`. `scripts/source-digest.mjs`; `scripts/verify-deployment.mjs`. `Dockerfile`; `railway.json`.

## 6A.12 Worked examples — one complete example per request type

### A. `USER_DEFINED_BOARD_V1` — Job 1, two 16-in SPF braces

**Input.** Species `spf`, board, nominal 2×4; minimum defined workpiece 60 in; two parts of 16 in each; each part has one `SPOT_ON_LOCATION` at X=8 in, centered across the 3.5-in wide face; 30° `miter-face`; Datum C by `REFERENCE_CUT`; declared 3 saw cuts and 2 spots.  
*Trace: `tests/fixtures/user1-dimensional-travel-fixture.mjs`.*

**Checks.** The 60-in SPF offering is offered, in stock, priced, D-001 compatible, and is the first matching candidate. Angle 30° is inside 0–45. Each spot is within its 16-in part and centered at 1.75 in across the 3.5-in face. Derived counts equal 3 saw cuts and 2 spots. After the 0.125-in reference kerf and two 16-in parts plus cut kerfs, final retained remainder is **27.625 in**, above the 24-in control minimum; the candidate therefore remains complete.  
*Trace: `evaluateDimensionalTravelJob`; `evaluateD001UserDefinedBoard`; test `d001-travel-standard.test.mjs` unnamed Job 1 assertions.*

**Board chosen.** `STB-ZERO-SPF-2X4-60-001`, 60 in; catalog selling price **$2.61**.  
**Machine time.** **1.4227 min**.  
**Machine service.** **$5.93** at $250/hour.  
**Final answer.** `SUPPORTABLE`; low-level estimate `BUDGETARY_ESTIMATE`; **Q = $8.54**.  
*Trace: `tests/d001-travel-standard.test.mjs` and `tests/catalog-pricing.test.mjs` unnamed exact assertions.*

**Material variant.** The same 16-in/30° geometry with `syp-treated`, grade `above-ground`, has no 60-in matching Store offering. Store selects `STB-ZERO-PTAG-2X4-72-001`, selling price **$5.15**; the same modeled machine service is $5.93 and Q is **$11.08**. This is not the Project 1 specimen: Project 1 is treated SYP with two **18-in** parts at 26.387799961243°, Q **$11.09** (§12). The two are kept as distinct cases and neither is adjusted to match the other; changing the species (and naming its grade) on the default job is how a reviewer reaches a treated-lumber answer. `acceptance/project-1` — “the default job is a different specimen: SPF, two 16 in parts, 30 degrees, $8.54” asserts both the $8.54 and $11.08 answers; System test `apps/stb/test/integration/start-own-shared-host.test.mjs` asserts the same treated answer through the application.

### B. `CUT_PACKAGE_V1` — mixed-test `LONG` package

**Input.** Package `LONG`: treated SYP, nominal 2×6, `ground-contact`, square ends, six parts each **71.5 in**, each part carrying centered spots at **4.75, 35.75, and 66.75 in**.  
*Trace: `tests/cut-package.test.mjs` mixed fixture.*

**Checks.** Grade is explicit. Each 71.5-in part is exactly 0.5 in shorter than a 72-in parent, so it passes the end-cleanup rule. It cannot use the sequence path because the 24-in retained-control reserve would not remain; because the cut angle is square, the part is not refused for angled-control loss. At 71.5 in it is within the 72-in D-001 two-saw span and above the 24-in minimum, so it uses the one-part-per-board long-part batch path. All 18 spots are declared and supported.  
*Trace: `planForBoard`, `machineForPackage`; test assertions for support, spot count, and both-end/board rules.*

**Board chosen.** Six `STB-ZERO-PTGC-2X6-72-001` parents. Current catalog selling price is **$11.33 each**, so material extension is **$67.98**.  
**Machine time.** The accepted test execution prints line Q **$103.98**. Under the declared $250/hour rate, the line’s machine extension is $36.00, corresponding to **8.64 modeled minutes**.  
**Final answer.** Line `SUPPORTABLE`, Q **$103.98**. The surrounding mixed order remains `NOT_ALL_LINES_SUPPORTABLE` because other independent lines include refusals.  
*Trace: workflow execution of `tests/cut-package.test.mjs` prints `LONG":"6xPTGC-2X6-72-001 $103.98"`; source Q formula; catalog row.*

### C. `CUT_PACKAGE_V1` — pine alcove, one shelf layout

**Input.** Select pine 1×6. Four 65-in uprights. Five 44-in shelves across a 14-in depth, laid out as two whole 1×6 strips and one 1×6 brought to 3 in. One item line for the functional requirement `ALCOVE-PINS-AND-SCREWS`. No pilot spots. The layout is the user's choice (§11.2); this is one of several.  
*Trace: `tests/fixtures/alcove-cut-packages.mjs` (`alcoveCutPackages`); `contracts/examples/requests/cut-package.alcove-pine.json`.*

**Checks.** Every package names pine/select/1×6. Removing 2.5 in from a 5.5-in board is more than the 1-in router cut width, so the narrow strips are a rip at 3 in, with a 2.5-in offcut per board returned to the owner; each of those boards is ripped before its parts are cut. Every board keeps the 24-in two-roller control length while it is cut. The kit is the offering that declares the requirement.  
*Trace: `evaluatePackage`, `edgeMillFor`, `evaluateFunctionalRequirement`; `tests/alcove-via-cut-packages.test.mjs`.*

**Boards chosen.** Uprights: `STB-ZERO-PINE-1X6-72-001`, qty 4. Whole strips: `STB-ZERO-PINE-1X6-120-001`, qty 5. Ripped strips: `STB-ZERO-PINE-1X6-72-001`, qty 5.  
**Material.** **$272.86**.  
**Kit.** `STB-ZERO-HW-ALCOVE-PACK-001`, **$18.00**.  
**Machine service and time.** **$138.30**; at $250/hour, **33.192 modeled minutes**.  
**Final answer.** Every line `SUPPORTABLE`; Q = **$429.16**.  
*Trace: exact assertions in `tests/alcove-via-cut-packages.test.mjs`.*

### D. `SHEET_PACKAGE_V1` — canonical Playhouse arched window

**Input.** One 0.5-in × 96 × 48 sheet; centered 36-in-wide arched aperture with 24-in straight sides and 12-in rise, tab retention, requested 4 tabs; vertical center split; crosscuts 18 in from left and right; all pieces returned.  
*Trace: `tests/sheet-package.test.mjs` `playhouse()`.*

**Checks.** Configuration identity is present. Sheet is exact 96×48 and 0.5 in thick. All four feature IDs are unique and declared. Aperture width/height/rise are positive; derived radius is **19.5 in**; rise 12 ≤ 18; width and straight height exceed the 6-in routed-feature minimum; centered box is within the 48×36 field. The tab policy plans at least 5 tabs (4 base request plus one planning reserve); the split retains at least two tabs per half. Split piece width is `(36 - 0.25)/2 = 17.875 in`, above 3 in. Crosscuts resolve to X=18 and X=78 and remain clear of the routed opening. Sheet resolves to `STB-ZERO-PLY-050-48X96-001`, material **$26.55**. Crosscuts leave valid pieces and every piece is returned.  
*Trace: named canonical and returned-piece tests.*

For this exact current-code input, aperture perimeter is **129.864203 in**, center-split route length is 36 in, so routed length is **165.864203 in**. With one 0.5-in pass, five tabs, two routed paths, two full-width panel-saw cuts, and five returned pieces, modeled total is **554.264203 s = 9.2377 min**. Machine service is **$38.49** and Q is **$65.04**. The canonical test directly asserts the material price, radius, operation order, crosscut positions, and the exact formula `Q = round(material + machine_service, 2)`; the literal `$65.04` is reproduced from the current source constants rather than separately hard-coded as a test expectation.  
*Trace: `timeFor`; `S001_STAGE2_ENVELOPE`; `STENCIL_TAB_POLICY_V0`; named canonical test.*

**Final answer.** `SUPPORTABLE`, complete budgetary Q **$65.04** under the declared Stage-2 model; measured and commissioned remain false.

### E. `OFFERING_LOOKUP` — exact Store SKU search

**Input.** Search text `STB-ZERO-SPF-2X4-96-001`.  
**Checks.** Payload is a nonblank search-only string within 80 characters. Normalization makes case irrelevant. Exact offered SKU receives rank 0 and therefore precedes token matches. The row is offered and returned with Store attribution.  
**Offering returned.** Exactly `STB-ZERO-SPF-2X4-96-001`.  
**Board chosen.** None: lookup reports an offering; it does not select a board for a job.  
**Machine time.** Not applicable.  
**Q.** Not applicable. No evaluation or estimate is returned.  
**Final answer.** The exact SKU is the first row of the answer, `truncated:false`.  
*Trace: `src/requests/offering-lookup.mjs` (`searchOfferedCatalog`); `tests/store-request.test.mjs` — “offering lookup: search, exact SKU and material query, offered rows only, no Q”.*


# 7. D-001 dimensional test machine

The physical D-001 described in this section is a **specified, not built** target. It is not the same thing as the executable Stage-2 D-001 reference envelope in §6A.2. The executable envelope presently has one miter-capable left saw and one square right saw, two manipulating-roller stations, one longitudinal mill station, one modeled wide-face spot station, and the declared numeric limits listed in §6A.2. The physical target below may not be represented as implemented until its machine configuration, controls, protective functions, commissioning evidence, and conformance tests exist.  
*Trace: `src/evaluation/envelopes/d001-stage2-envelope.mjs` `D001_STAGE2_ENVELOPE`; `src/evaluation/engine/d001-travel-standard.mjs` `D001_TRAVEL_STANDARD`; `STB-STORE-CELL-STAGES-0.1.md` Stage 2/Stage 3; draft §7 retained as target and corrected to preserve implementation status.*

## 7.1 Physical target

| Element | Specified target | Present executable status |
|---|---|---|
| Base/support | Approximately six-foot bounded dimensional cell with a rigid support structure and fixed reference surfaces; exact structural design is not specified in the present sources. | Stage-2 fixture declares a 72-in base geometry only. |
| Fence / Datum A | Fixed longitudinal fence; lateral reference, Y = 0. | Implemented in the Stage-2 coordinate model. |
| Support plane / Datum B | Fixed support plane; vertical reference, Z = 0. | Implemented in the Stage-2 coordinate model. |
| Manipulating rollers | Two servo-controlled manipulating rollers maintaining controlled longitudinal feed while the work remains referenced to fence/support. | Modeled as R1 at X=24 in and R2 at X=48 in. Physical restraint, force and slip evidence do not exist. |
| Saw L | Fixed downstroke miter saw, registered station, target miter range through ±45° from square. | Stage-2 `SAW-L` at X=0 supports single-plane face miter 0–45°. Negative-angle/dual-saw semantics are not implemented. |
| Saw R | Fixed downstroke miter saw, registered station, target miter range through ±45° from square. | Stage-2 `SAW-R` at X=72 is square-finished-cut only. Target is not implemented. |
| Router 1 | Registered longitudinal corner/profile function referenced to the machine datums. | Stage-2 has `MILL_LONG` abstraction; exact Router-1 hardware and transform are not built. |
| Router 2 | Registered edge-sizing function with a bounded Y position and longitudinal feed. | Stage-2 pass-through edge mill uses `MILL_LONG`; executable Y maximum is 14 in, with 12-in maximum stock width. Physical Router-2 station is not built. |
| Router 3 | Registered end-working function for a bounded end feature after its transform and tool geometry are qualified. | Stage-2 declares `MILL_END` geometry but no complete physical Router-3 implementation. |
| Spot 1 | Registered 3/16-in wide-face spotting station. | Modeled as `SPOT-FACE-REF`; executable Stage-2 spot geometry and timing exist. |
| Spot 2 | Registered 3/16-in end-face spotting station. | Not implemented in the present Stage-2 code. |
| Controller | Local controller receiving only locally admitted, machine-specific instructions. | Controller/postprocessor target is specified; no commissioned physical controller is established by Store sources. |

*Trace: `D001_STAGE2_ENVELOPE`; `D001_TRAVEL_STANDARD`; `STORE-JOB-001.md` §§3–4, 8–16; `STORE-MACHINE-BOUNDARY.md`; draft §7 target. Where a target row exceeds executable Stage-2 behavior, the row says so expressly.*

## 7.2 Coordinates and workpiece references

D-001 uses X along the fence/workpiece-feed direction, Y across the board from the fence, and Z vertically from the support plane. Datum A is the fixed fence reference at Y=0. Datum B is the support reference at Z=0. Datum C is the dynamic longitudinal workpiece origin. The travel standard permits Datum C to be established by `REFERENCE_CUT`, `MECHANICAL_REFERENCE`, or `SENSED_FACE`; the modern Job 1 path uses `REFERENCE_CUT` at `SAW-L`.  
*Trace: `D001_TRAVEL_STANDARD.datums`; `normalizedDemand`; `tests/d001-travel-standard.test.mjs` Job 1 fixture and operation assertions.*

The production target is that a qualifying first cut creates a fresh longitudinal origin face so downstream part and feature locations derive from that origin rather than from a rough commercial end. If the reference relationship is lost, the machine-side position state must no longer be treated as valid. Store Job 001 states the modeled local rule as `POSITION_VALID = false` when the declared workpiece-position basis is no longer supportable.  
*Trace: `STORE-JOB-001.md` §§9–12 and §16.*

## 7.3 Saw datum, blade and retained-face target

The specified physical target keeps machine station identity separate from the cutting edge of a replaceable blade: the station transform, blade identity, kerf and retained-face rule belong to the machine configuration/lowering layer. The present Store evaluator does **not** implement a complete invariant-center-plane plus retained-face compensation model for two ±45° saws. That work is therefore **specified, not built** and appears in Open work.  
*Trace: `STORE-MACHINE-BOUNDARY.md` identifies kerf/local kept-face compensation and station transforms as machine-local; `D001_TRAVEL_STANDARD.control.kerfIn` implements a modeled 0.125-in kerf; draft §7.3 target; no present Store function implements the full target.*

## 7.4 Workpiece control and longer stock

The executable Stage-2 envelope requires at least 24 in of retained control and does not claim commissioned workholding. The physical target must replace those fixture assumptions only with evidence from the installed cell: support geometry, contact, restraint, roller traction/slip behavior, commanded-versus-actual positioning and the conditions under which the reference chain is valid. Until those facts are commissioned, the present Stage-2 limits remain the executable Store rules.  
*Trace: `D001_STAGE2_ENVELOPE.stock`; `envelopeCheck`; `D001_TRAVEL_STANDARD.control`; `STB-STORE-CELL-STAGES-0.1.md` Stage 3; `tests/d001-stage2-envelope.test.mjs` 96-in and 24-in rules.*

## 7.5 Milling and spotting boundaries

The executable longitudinal mill accepts a positive path, Y and depth; a station-profile path over 60 in is refused, Y over 14 in is refused, and pass-through edge milling instead uses the two-roller control rule. Mill depth is split into 0.375-in passes. The executable spot operation is a 3/16-in, 118° point tool with 3/16-in full-diameter depth after the point, centered on the wide face or inset exactly 1.5 or 2 in from an edge. No generic drilling envelope is thereby created.  
*Trace: `millLongitudinalCycleSec`; `D001_STAGE2_ENVELOPE.millLong`, `.millPassThrough`, `.spot`; `spotPointLengthIn`; `spotPlungeIn`; `tests/spot-inset-depth.test.mjs` and `tests/d001-stage2-envelope.test.mjs`.*

The target second, end-face spot station and distinct registered Router 1/2/3 physical functions are not implemented by the present evaluator. They may not be inferred from the generic words “router” or “drill”; each requires a machine configuration, transform, tooling definition, admission rule and test before it becomes executable capability.  
*Trace: present `src/` tree and `D001_STAGE2_ENVELOPE`; no executable end-face spot station exists; `STORE-MACHINE-BOUNDARY.md` keeps transforms/tool tables machine-local.*

## 7.6 Tooling authority

The first-cell target has no ordinary per-job tool change. Jobs are admitted to the released machine configuration or refused. Store Job 001 already states that no operator creates per-job tool offsets or a per-job tool-location map; the Store/machine boundary also keeps tool tables, tool-change mechanics, offsets and controller details local to the cell. The exact physical tool-installation and maintenance procedure is **not specified in sources** and is a safety/commissioning gap.  
*Trace: `STORE-JOB-001.md` “Fixed tool geometry” and §§12, 15; `STORE-MACHINE-BOUNDARY.md`.*

# 8. S-001 sheet path

S-001 is the separate sheet-machine family. Its present status is **modeled**: a declared Stage-2 reference envelope and evaluator execute the bounded Playhouse path, while `measured:false`, `commissioned:false`, and `physicalStatus:"NOT_CLAIMED"` remain explicit. Sheet work does not fall through D-001.  
*Trace: `src/evaluation/envelopes/s001-stage2-envelope.mjs`; `src/evaluation/evaluators/sheet-package.mjs`; tests “D-001 still refuses sheets” and “assumptions are labeled as newly adopted Stage-2 reference, not measured or quoted”.*

The modeled S-001 process is: load/reference a full 96×48-in sheet; route admitted internal aperture profiles while the parent remains registered; retain the cut center with reference tabs; route a declared vertical center split if requested; release the sheet; perform declared full-width crosscuts at `YARD-PANEL-SAW`; and label/return every resulting piece. The executable limits and timing constants are stated exhaustively in §6A.7–§6A.10.  
*Trace: `S001_STAGE2_ENVELOPE`; `SHEET_PACKAGE_STANDARD.order`; `operationsFor`; named canonical Playhouse test.*

Routing precedes panel-saw crosscutting because the executable model keeps the sheet whole and registered for routed geometry. A crosscut that enters the routed feature plus the declared 1-in clearance is refused as `CROSSCUT_INTERSECTS_ROUTED_FEATURE`; the evaluator does not move the requested line to make it fit.  
*Trace: `evaluateCrosscut`; `S001_STAGE2_ENVELOPE.panelSaw.minClearanceToRoutedFeatureIn`; named test “a crosscut through the routed opening is REFUSED, never moved”.*

The stencil-tab policy is only a reference geometry planner. It does not establish holding force, bridge width, retained thickness or maximum proven gap; those physical values remain null/unmeasured. A physical S-001 cell therefore requires separate workholding, guarding, access-control and retention evidence before the modeled path can become commissioned capability.  
*Trace: `STENCIL_TAB_POLICY_V0`; `STENCIL-TAB-POLICY-0.1.md`; `STB-STORE-CELL-STAGES-0.1.md` Stage 3.*

# 9. Safety, setup validation and operating authority

This section states only requirements supported by the repository or cited safety sources. It does not invent a machine-specific safety procedure. Store Zero Stage 2 is software/model evidence; a real cell requires the protective design, energy-control program, commissioning and training appropriate to the installed equipment before physical production.  
*Trace: `STB-STORE-CELL-STAGES-0.1.md`; OSHA 29 CFR 1910.212, 1910.147 and 1910.213.*

**Safety source set used here.** OSHA 29 CFR [1910.212 — General requirements for all machines](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212), [1910.213 — Woodworking machinery requirements](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.213), and [1910.147 — Control of hazardous energy (lockout/tagout)](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147) establish the U.S. regulatory sources cited below. ISO [12100:2010](https://www.iso.org/standard/51528.html) supplies the machinery risk-assessment/risk-reduction framework; ISO [13850:2015](https://www.iso.org/standard/59970.html) supplies emergency-stop design principles; and ISO [19085-1:2021](https://www.iso.org/standard/77655.html) supplies common woodworking-machinery safety requirements across operation, adjustment and maintenance. These sources establish the need and design domains; this specification does not reproduce their procedures or substitute itself for the applicable installed-machine safety engineering.

## 9.1 Guarding

A real D-001/S-001 cell must guard machine hazards including the point of operation, ingoing nip points, rotating parts and flying chips/sparks. OSHA 29 CFR 1910.212(a)(1) requires one or more guarding methods for those hazards; 1910.212(a)(2) requires guards to be affixed where possible or otherwise secured; and 1910.212(a)(3)(ii) requires guarding where the point of operation exposes an employee to injury. The Store sources do not define the physical guard geometry, access-door design or interlock architecture for D-001 or S-001. Those details are **not specified in sources** and are Open work.  
*Trace: OSHA 29 CFR 1910.212(a)(1)–(3); `STB-STORE-CELL-STAGES-0.1.md` Stage 3 names guarding, access control and interlocks as physical work.*

## 9.2 Emergency stop, ordinary stop and restart prevention

A real woodworking cell requires local means to stop the machine and prevent an unsafe automatic restart. OSHA 29 CFR 1910.213(b)(1) requires a machine power control reachable from the operator's position, and 1910.213(b)(3) requires prevention of automatic restart after restoration of power where injury might result. ISO 13850:2015 supplies functional requirements and design principles for the emergency-stop function. The exact D-001/S-001 emergency-stop device locations, stopping behavior, circuit architecture and reset logic are **not specified in sources**.  
*Trace: OSHA 29 CFR 1910.213(b)(1), (b)(3); ISO 13850:2015; Store Stage-3 roadmap.*

## 9.3 Lockout/tagout and hazardous energy

Maintenance, repair and servicing that expose personnel to unexpected energization, start-up or stored energy fall under the hazardous-energy control requirements of OSHA 29 CFR 1910.147. That standard requires an energy-control program and procedures, training and periodic inspection; its scope covers servicing/maintenance where unexpected energization or stored-energy release could injure employees. It also distinguishes control-circuit devices from energy-isolating devices. The Store sources do not provide an equipment-specific D-001/S-001 lockout/tagout procedure, energy-source inventory, isolation-point map or stored-energy dissipation method. Those are **not specified in sources** and must be created for the real equipment.  
*Trace: OSHA 29 CFR 1910.147(a)(1), (a)(2), (a)(3), (b); no Store file supplies an equipment-specific LOTO procedure.*

## 9.4 Maintenance and tool-change boundary

The first-cell production concept does not assign ordinary per-job cutter changes, tool offsets or machine reconfiguration to the production operator. Store Job 001 expressly excludes per-job tool offsets and part programming by the operator. For physical maintenance or tool work that falls within servicing/maintenance, the real yard must apply its equipment-specific hazardous-energy controls; the sources do not define an exception or a step-by-step tool-change procedure.  
*Trace: `STORE-JOB-001.md` “Fixed tool geometry” and §15; OSHA 1910.147(a)(2), including the limited normal-production minor-servicing exception only where its conditions and effective alternative protection are met.*

The project role name **Cell Steward** is an internal authority concept, not an automatic substitute for OSHA's term “authorized employee.” OSHA defines an authorized employee by the employee's lockout/tagout duties. A real employer must assign and train roles under the applicable energy-control program; this specification does not declare that every Cell Steward is OSHA-authorized merely by title.  
*Trace: OSHA 1910.147(b) definitions; Store role model in draft §9 and Store Job 001 operator boundary.*

## 9.5 Cell Steward and operator roles

The specified Cell Steward owns machine configuration release, calibration/tooling qualification, setup validation, fault investigation and deliberate post-fault re-enable. The production operator's normal Store Job 001 role is to obtain the identified stock, verify its physical suitability, load it in the declared orientation, press local Ready/Cycle Start, observe the cycle, respond to abnormal conditions, remove/label the completed part and preserve its job association. The operator does not redefine the project, choose finished dimensions, lay out features, create machine offsets, program the part or silently change the accepted configuration. The Steward-specific physical authority is **specified, not built** until the real controls and operating procedure enforce it.  
*Trace: `STORE-JOB-001.md` §15; draft §9 retained as target; Stage-3 roadmap.*

## 9.6 Cycle Start belongs at the cell

Cycle Start is local. Store Job 001 places Ready/Cycle Start after the identified stock is presented and physically loaded at D-001. `STORE-MACHINE-BOUNDARY.md` classifies local Cycle Start and real-time safety/interlock state as machine-local facts rather than Store/network authority. Therefore a Store response, web request or network-connected project definition may prepare work but may not itself supply the production Cycle Start. The specified operating model assigns the ordinary Cycle Start to the person physically at the released cell.  
*Trace: `STORE-JOB-001.md` §8 and §15; `STORE-MACHINE-BOUNDARY.md`; `STB-STORE-CELL-STAGES-0.1.md` (“Network presence is still not Cycle Start”).*

## 9.7 Fail-closed recovery

Store Job 001 already states that loss of stable fence contact, support, feed-position chain, a tool/axis fault, incomplete saw/mill/drill operation, interruption or physical damage makes the cycle suspect; when the claimed workpiece position can no longer be supported, `POSITION_VALID = false`, and the affected stock is not silently promoted to a completed part. The specified physical target adds the stricter role boundary that post-fault re-enable is a Cell Steward action, not an ordinary operator shortcut. The source set does not yet contain commissioned controls proving this rule.  
*Trace: `STORE-JOB-001.md` §16; draft §9.3 target; Open work records missing physical proof.*

## 9.8 Setup-validation chain

Before a machine configuration is released for ordinary production, the specified target requires validation of the facts on which lowering and safe operation depend. The source-supported checkpoints are: (1) machine/configuration and controller/postprocessor identity; (2) Datum A fence and Datum B support condition; (3) saw/tool identity, registered station facts and kerf/retained-face data used by the program; (4) roller/work-support state required for the intended stock; (5) registered router/spot transforms and tooling facts used by the job; (6) guarding/access protection, local stopping and restart-prevention functions in their released state; and (7) a reference/first-part inspection sufficient to establish that the released configuration produces the required geometry before ordinary production. The **method**, acceptance measurements, inspection frequency and sign-off form for these checkpoints are not fully specified in the present sources and therefore remain Open work.  
*Trace: `STORE-JOB-001.md` §§3–16; `STORE-MACHINE-BOUNDARY.md`; draft §9.4; OSHA 1910.212 and 1910.213 for guarding/stopping/restart; Stage-3 roadmap for commissioning and validation.*

## 9.9 Safety gaps that must be closed for a real cell

The following items are required design/operating work because the present sources do not establish them as commissioned procedures or hardware. Listing them is not a prescription for how to design them.

| Gap | Source that establishes the need or boundary | Present status |
|---|---|---|
| Machine-specific risk assessment and hazard analysis | ISO 12100:2010; ISO 19085-1:2021; Stage-3 roadmap | not specified in sources |
| Physical point-of-operation, nip-point, rotating-part and chip guards | OSHA 1910.212 | not specified in sources |
| Guard-door/access-control architecture and any safety-rated interlocks | Stage-3 roadmap; OSHA 1910.212 | not specified in sources |
| Emergency-stop locations, circuit architecture, stopping behavior and reset rules | ISO 13850:2015; OSHA 1910.213(b) | not specified in sources |
| Restart-prevention implementation after power restoration | OSHA 1910.213(b)(3) | not specified in sources |
| Energy-source inventory and equipment-specific LOTO procedure | OSHA 1910.147 | not specified in sources |
| Isolation devices, stored-energy control and verification method | OSHA 1910.147 | not specified in sources |
| Electrical design, disconnects, enclosures and required listing/inspection basis | Store sources do not define them; applicable electrical requirements must be determined for the installed cell | not specified in sources |
| Dust/chip collection and fire/explosion controls appropriate to the actual equipment/material | OSHA 1910.213(s)(6) addresses cleanliness around woodworking machinery and fire hazards; ISO 12100 risk assessment supplies the broader design method | not specified in sources |
| Noise evaluation and required hearing/PPE program | Store sources do not define them | not specified in sources |
| Saw/blade/router/drill guarding specific to the selected components | OSHA 1910.212/1910.213 establish general/woodworking guarding duties; exact component design absent | not specified in sources |
| Workholding force, clamp/roller pressure, slip detection and loss-of-reference detection | Store Job 001 requires stable reference; Stage 3 requires restraint/workholding evidence | not specified in sources |
| Commissioned safe speeds/accelerations and stop performance | Stage-2 values are modeled, not measured | not specified in sources |
| Maintenance, setup, jog/manual-mode and tool-change procedure | OSHA 1910.147; Store machine boundary | not specified in sources |
| Training/qualification records for operator, Steward and LOTO-authorized personnel | OSHA 1910.147 training requirement; project role split | not specified in sources |
| Periodic inspection/validation intervals for energy control and released machine setup | OSHA 1910.147 periodic inspection; Store sources lack cell interval | not specified in sources |
| Emergency response and abnormal-condition procedure | Store Job 001 identifies abnormal conditions but not complete emergency procedure | not specified in sources |
| Applicable local code/AHJ, fire, electrical and building approvals | not established by Store sources | not specified in sources |
| S-001 physical tab retention/workholding strength and separation procedure | stencil policy expressly says retention is not measured | not specified in sources |
| Physical commissioning evidence tying protective state to machine Ready | Stage-3 roadmap | not built |

*Trace: sources cited row by row. Every unprovided method remains a gap rather than an invented procedure.*

**Official safety sources cited in this section:** OSHA 29 CFR 1910.212, [General requirements for all machines](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212); OSHA 29 CFR 1910.147, [The control of hazardous energy (lockout/tagout)](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147); OSHA 29 CFR 1910.213, [Woodworking machinery requirements](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.213); OSHA Woodworking eTool, [Safety Hazards — Electrical](https://www.osha.gov/etools/woodworking/safety-hazards/electrical).

# 10. Compiler and machine-specific lowering

There is no permitted semantic jump from an accepted project definition to arbitrary controller coordinates. The compiler/lowering layer receives identified machine-neutral work, an attributable Store answer and a released machine configuration, then maps only declared operations to the registered cell. Controller syntax is an output representation; it is not allowed to invent missing project meaning.  
*Trace: `STORE-MACHINE-BOUNDARY.md`; `STORE-JOB-001.md` §§3–7; Project 1 review; issued-patent CAD/CAM instruction disclosures.*

## 10.1 Required inputs

A conforming lowering pass requires: the frozen definition revision; the Store answer for that revision; the selected material/item identities; typed part/feature operations; the released machine configuration; datum rules; station/tool identities and transforms; kerf/tool offsets and retained-face semantics applicable to the operation; workpiece-control/reference rules; and the controller/postprocessor version. If one of those facts is required by the selected operation and absent, the lowering path must refuse rather than derive a plausible default.  
*Trace: `STORE-MACHINE-BOUNDARY.md`; `D001_TRAVEL_STANDARD`; draft §10.2; Project 1 review instruction chain.*

## 10.2 Deterministic lowering sequence

1. Verify definition identity, Store answer identity, machine-configuration identity and compiler/postprocessor version compatibility.
2. Expand the accepted definition into typed operations tied to identified parts/features.
3. Assign each operation to a registered station/process; refuse an operation for which no registered station exists.
4. Establish the permitted coordinate frame and Datum-C method.
5. Derive machine positions from part/feature geometry and registered station/tool transforms, applying the operation's explicit kerf, retained-face and tool-offset rules.
6. Recheck machine-local travel, angle, tool, workholding/reference and approach constraints. Store supportability does not waive local admission.
7. Order operations so required references and parent-control relationships remain valid.
8. Emit a typed intermediate instruction ledger that retains source part/feature identity.
9. Postprocess that ledger to the selected controller representation.
10. Verify that every required source operation is accounted for and bind the output to the accepted definition and machine configuration by version/hash identity.
11. Load only the locally admitted program; machine protective state establishes Ready, and local Cycle Start remains outside Store/network authority.

*Trace: draft §10.3; `STORE-JOB-001.md` §§3–14; `STORE-MACHINE-BOUNDARY.md`; Project 1 review. The complete physical implementation of this target is **specified, not built**.*

## 10.3 Present executable lowering versus target compiler

The current Store code already performs bounded semantic lowering inside its models: Job 1 is expanded into `REFERENCE_CUT`, `INDEX`, `SPOT_ON_LOCATION`, `MITER_CUTOFF` and `REBASE_DATUM_C`; dimensional batch work emits reference/index/cut/mill/spot operations; sheet work emits `LOAD_REFERENCE`, route, release, panel-saw crosscut and label operations. Those operation records are **modeled machine/work records**, not controller programs and not Cycle Start.  
*Trace: `deriveOperationPlan`; `deriveBatchComponentPlan`; `operationsFor`; Store tests asserting operation kinds and absence of G-code/Cycle Start.*

The full controller-specific compiler target—registered physical two-saw transforms, physical Router 1/2/3 and Spot 1/2 transforms, retained-face compensation, controller serialization, local admission and physical execution—is not present under Store `src/`. It remains **specified, not built** and is listed in Open work.  
*Trace: the `src/` tree contains only the twenty-one modules indexed in Appendix C; `STORE-MACHINE-BOUNDARY.md` assigns controller program/postprocessor syntax to the local machine layer.*

## 10.4 The accepted job packet

The accepted job packet is the one object that connects a customer's accepted job to the machine side. System produces it when the customer accepts an offer; the machine side reads it directly, and nothing in it is retyped or reconstructed by a project-specific script.

| Field | Content |
|---|---|
| `schema` | `STB-ACCEPTED-JOB-PACKET-1` |
| `packetId` | Identity of this packet |
| `project` | `projectId`, `classId`, `title` — the customer's working project, distinct from the recipe or tile |
| `definition` | `definitionId`, `revisionId`, `requestType`, the exact `demand` the Store evaluated, and `requirements` — the end geometry the machine side reads (`endRelation`, `lengthDatum`, `endIdentity`). For a board these must equal the values the definition states, which Store priced; otherwise `PACKET_REQUIREMENTS_DIFFER_FROM_DEFINITION` |
| `storeAnswer` | The answer this Store gave for that definition, with its receipt, unchanged |
| `decision` | `decisionId`, `kind` (`ACCEPTED` only), `offerId`, `decidedAt`, `evidenceClass` (`SIMULATED`) |
| `authority` | `physicalRelease: false`, `evidenceClass: "SIMULATED"` |

Required identities are nonblank. `decision.decidedAt` is a valid UTC ISO instant (`YYYY-MM-DDTHH:mm:ssZ` or with three fractional digits); impossible calendar dates are refused. For `USER_DEFINED_BOARD_V1`, `requirements.endRelation` and `requirements.lengthDatum` are required nonblank values. Other request types have their own lowerer admission; these board facts are not invented for a sheet. A non-null supplied `endIdentity` remains a declared System fact; no mapping for it is registered in this reference lowerer, so it is refused before commands.

Only an accepted decision makes a packet: a decline, deferral or revision request does not. A packet is acted on only after `verifyJobPacket` checks it against this Store, which answers:

- `VERIFIED` — Store content consistency only, not authentication of the user decision or project membership. System must bind the packet to its saved acceptance of this exact revision and answer. Well formed; the answer is `SUPPORTABLE` and of the definition's request type; its receipt hash recomputes; its calculation identity matches its receipt; the receipt's demand hash is the hash of the packet's definition; the receipt names the expected Store release; the receipt has the exact declared fields, registered freshness rule, valid evaluation time and matching status; acceptance does not precede the answer; and this Store, asked again now, gives exactly the same answer and authority content.
- `REFUSED` — with the reason: `PACKET_FIELD_REQUIRED:<path>`, `PACKET_REQUIRES_ACCEPTED_DECISION`, `PHYSICAL_RELEASE_NOT_AVAILABLE`, `PACKET_ANSWER_NOT_SUPPORTABLE`, `PACKET_RECEIPT_ALTERED`, `PACKET_ANSWER_ALTERED`, `PACKET_DEMAND_CHANGED`, `PACKET_STORE_RELEASE_MISMATCH`, among others in Appendix D.9.
- `STALE` — intact, but this Store would now answer differently (for example the board was repriced): `PACKET_STORE_ANSWER_NOT_CURRENT`. An answer whose body differs from what this Store gives for the same calculation identity was edited after it was given, and is `REFUSED / PACKET_ANSWER_ALTERED`, not stale. A stale packet is re-quoted; a late answer never authorizes a changed job.

A board's end geometry is stated in its definition and priced by Store (§6A.1 step 3), so geometry Store does not price never reaches a `SUPPORTABLE` answer. The packet's `requirements` must equal the definition's values (`PACKET_REQUIREMENTS_DIFFER_FROM_DEFINITION`). The lowerer's own registration check (§10.6) remains behind both.

The complete Project 1 packet is `contracts/examples/packets/project-1.accepted.json`; `contracts/examples/packets/refused.json` holds a declined offer, a claimed physical release, a price edited after the answer, an edited receipt, a definition changed after the answer, an answer from another Store, and a refused answer, each refused with its exact reason.  
*Trace: `src/contracts/job-packet.mjs` (`JOB_PACKET_SCHEMA`, `JOB_PACKET_SHAPE`, `packetProblems`, `verifyJobPacket`); `contracts/examples/packets/`. Tests: `acceptance/contracts/contracts.test.mjs` — “the Project 1 packet is well formed and verifies against this Store”, “a packet that is declined, altered, changed, foreign or refused is never acted on”, “an intact packet whose Store answer is no longer current is STALE and must be re-quoted”.*

## 10.5 The machine side: reference lowering and virtual run

`src/machine/` is the machine-local side of the Store boundary for the D-001 reference cell. It takes an accepted job packet and produces four records, each with an exact shape (`src/contracts/machine-records.mjs`):

1. **Local job** (`STB-LOCAL-JOB-2`) — `lowerJobPacket` lowers a packet only after `verifyJobPacket` answers `VERIFIED` (a `REFUSED` or `STALE` packet produces nothing). It carries the Store's operation plan unchanged, each operation tagged with its source operation and the definition's demand hash; the Store-selected board's actual dimensions, read from the catalog the packet was verified against; the miter angle and kerf; the nominal contact audit (which registered contacts lie under the retained stock before each operation); and the release blockers.
2. **Motion records** (`STB-MOTION-RECORDS-2`) — `motionRecords` emits the ordered virtual commands (`DELAY`, `MOVE`, `MOVE_C`, `VERIFY_X`, `CAPTURE_C`, `SET_SAW`, `SET_SPOT`, `COMPLETE`), bound to the complete accepted packet hash, demand hash, machine configuration ID and content hash, local-job content hash and motion-record content hash. Every record names its source: a Store operation, or a named machine allowance (load, angle, settle, clamp, end, release).
3. **Virtual run** — `runVirtual` executes the records in the acceleration-limited stop-to-stop model. A binding that does not match the job runs nothing; a position fault, an unconfirmed retract, or an index with the tool down stops the run before the next tool or index command.
4. **Physical admission** — `physicalAdmission` is always `BLOCKED` with every unresolved prerequisite named and zero motion: no configuration with physical authority is registered.

Every machine fact comes from the registered configuration `data/machine/d001-reference-review-0.2.json`: stations and contact points, axis velocities and accelerations, approach and clearance heights, the spot tool, allowances, the saw-stroke and rebase assumptions, and the release blockers. The lowering refuses rather than adapts when the configuration and the Store's plan disagree: a different spot tool (`SPOT_TOOL_DIFFERS_FROM_STORE_PLAN`), an unregistered station (`STATION_NOT_REGISTERED:<id>`), an operation the cell does not register (`OPERATION_NOT_REGISTERED_ON_MACHINE:<kind>`), more than one miter angle on a board (`ONE_MITER_ANGLE_PER_BOARD_REQUIRED`), or a request type the D-001 lowering does not register (`LOWERING_NOT_REGISTERED_FOR:<type>`; today only `USER_DEFINED_BOARD_V1` is lowered).

**Project 1 reproduces exactly.** From the Project 1 packet the machine side produces the review's local job (every operation, the contact audit, the blockers), all 45 command records field for field, the virtual run (86.46953628299116 s, 21 axis moves, the same trace) and the `BLOCKED` admission — compared against the review's own generated files, verified against its manifest. The virtual benchmark and the Store's modeled 85.5001 s are kept as distinct values; their 0.969436 s difference is asserted, as the review explains it. Of the review's fourteen checks, thirteen are proved here, each by name; check 6 (off-range and off-grid part lengths rejected) is the System rule's (derivation, H02) and is proved in System.

**A second, different job runs through the same code.** `contracts/examples/packets/second-job.accepted.json` is a three-part bracket set on SPF 2×6 at 15°, with two centred spots on one part, none on the second and one 1.5-in inset spot on the third. The Store refuses the 72-in board (the last remainder would fall below the 24-in control length) and selects the 96-in board; the machine side produces 60 records, places the spots at 2.75 and 1.5 in across the 5.5-in board, and runs in 97.632177 s. Every command traces to a Store operation or a named allowance, and every Store operation is carried into commands.  
*Trace: `src/machine/lowering.mjs` (`loadMachineConfig`, `lowerJobPacket`, `motionRecords`); `src/machine/virtual-run.mjs` (`runVirtual`, `physicalAdmission`, `moveTimeSec`); `src/contracts/machine-records.mjs`; `data/machine/d001-reference-review-0.2.json`; `contracts/examples/machine/`. Tests: `acceptance/machine/machine.test.mjs` (all named tests).*

## 10.6 Runtime validation and callable virtual evidence (0.9)

### Required meaning before commands

The current reference lowerer implements the same geometry as the two committed specimens: parallel ends, length measured on the long-long outer edge, one miter-face angle per board, reference-cut establishment of Datum C, registered spotting, and index/cut/fresh-face rebase for each part. It does not reinterpret nonparallel ends or short-short length as that geometry. Missing required facts are packet errors; unsupported values return `END_RELATION_NOT_REGISTERED_ON_MACHINE`, `LENGTH_DATUM_NOT_REGISTERED_ON_MACHINE` or `END_IDENTITY_NOT_REGISTERED_ON_MACHINE`. The registered request type remains only `USER_DEFINED_BOARD_V1`. A supportable cut or sheet package remains commercially evaluable and receives `LOWERING_NOT_REGISTERED_FOR:<type>` at this machine boundary. Unsupported lowering neither invalidates a valid Store Q nor creates machine evidence.

Packet consistency does not authenticate a user's decision. System owns the saved acceptance event, binds its project/definition revision and presented Store answer to the packet, and checks that binding before submission and before attaching returned evidence. Store hashes and re-evaluation cannot prove that an unauthenticated caller actually obtained that acceptance.

### Configuration and local-job validation

`src/machine/configuration.mjs` checks the same exact shape for a disk-loaded or injected configuration. Every declared field is required; text is nonblank, numbers finite, station coordinates and allowances nonnegative, motion/tool dimensions positive, drill point angle less than 180 degrees, units exactly inches/degrees/seconds, and contacts exactly one each of R1/M1/R2. Only D-001, the nominal coordinate execution class, reference-selection evidence class and `physicalAuthority:false` are registered. Assumption rules/labels are required; contact and blocker lists cannot be absent or empty. Unknown fields are refused. A loaded invalid configuration throws; an injected invalid configuration produces refusal at lowering and an error at direct motion generation.

An ID cannot stand in for the configuration's facts. Only the full configuration in `data/machine/d001-reference-review-0.2.json` is registered. Same-ID content changes are refused (`MACHINE_CONFIGURATION_CONTENT_CHANGED`); another ID is unregistered. Saw/spot station coordinates must agree with the Store standard, and spotting tool diameter, point angle and resulting plunge must agree with the Store plan. A changed station transform returns `STATION_TRANSFORM_DIFFERS_FROM_STORE_PLAN`; a changed tool returns `SPOT_TOOL_DIFFERS_FROM_STORE_PLAN`. Configuration changes are deliberate registered data revisions, with a new ID and regenerated evidence; they are never caller overrides.

Before motion generation, a local job must have the exact version-2 shape and required identities, content hashes, material dimensions, calculation hashes, requirements, cut geometry, ordered operations, contact audit and blockers. The parent cannot exceed the selected stock length. Each operation names its own Store source and demand hash, has a nonnegative time, and supplies its kind's required operands. Parts/stations are identified. Cutoffs preserve angle/kerf, positive part length and retained-control compliance; spotting preserves depth and wide-face bounds. The first operation is the reference cut, spots precede cutoffs, and every part cutoff has its index and fresh-face rebase. Index distance/from coordinates, forward feature-to-station placement and retained lengths are checked, not inferred from an ID. An incomplete, reordered, changed or unsupported local job emits no commands.

`packetHash` hashes the full accepted packet, including requirements, project and decision; `machineConfigHash` hashes the full registered configuration. `localJobHash` hashes the local job excluding that field. `binding.motionHash` hashes the records excluding that binding field. Hashing uses the same `calculationHash` serialization as Store; exact HTTP payload correlation separately uses raw-byte SHA-256. These hashes detect content changes; they are not digital signatures. The new required bindings deliberately advance local-job and motion schemas to `STB-LOCAL-JOB-2` and `STB-MOTION-RECORDS-2`. The unaltered published review retains its original schemas; the new contract examples carry version 2. Operation records, 45/60 command sequences, modeled traces, Q and published evidence remain unchanged.

### Virtual runner admission and faults

`motionRecordProblems` validates the complete input before the first command. Required schema, units, execution class, false physical authority, full binding, finite initial positions and tool clearance cannot be omitted or null. Sequence numbers are consecutive from one; sources are nonblank; commands and axes are registered. MOVE/MOVE_C need finite target, positive velocity and acceleration; MOVE_C uses X only. DELAY has a nonnegative duration equal to its target. VERIFY_X needs a finite target. Tool-state commands use 0 or 1. CAPTURE_C and COMPLETE use zero; non-motion commands do not carry motion axes/rates. A completion marker is required and must be final. Absent, null, empty, unknown, reordered, incomplete, nonfinite or content-altered records return `REFUSED`, the first reason and zero executed moves. The expected binding must include all version-2 fields; the three earlier IDs alone are insufficient.

After admission the runner starts with saw stroke retracted and spot at clearance. It faults before a saw stroke with the saw command off, a spot plunge with the spindle command off, Y travel with the spot down, angle change with the saw down, datum capture or X indexing with tools down, a modeled position/retract fault, or numerical overflow. COMPLETE requires a modeled saw stroke and both tool commands off with tools retracted; a terminal marker alone is not a completed job. Faults retain only the trace before the failing command. These checks constrain the nominal virtual model; the named physical commissioning/kerf/workholding/stroke blockers remain.

### HTTP evidence contract

`GET /health` adds `machineEvidence`: protocol `STORE-ZERO-MACHINE-EVIDENCE-1`, supported lowering `requestTypes`, `machineConfigId`, `machineConfigHash`, and `physicalAuthority:false`. This publishes reference identity, not a commissioned-machine capability claim.

`POST /v1/machine-evidence` accepts exactly three fields:

| Field | Meaning |
|---|---|
| `packet` | Complete accepted packet of §10.4, with its unchanged Store answer |
| `expectedMachineConfigId` | Reference configuration selected by the caller |
| `expectedMachineConfigHash` | Content identity of that configuration |

No caller-supplied release, machine configuration, local job, motion sequence, clock or physical authority is accepted. The service selects its registered configuration and own release. A configuration mismatch is `MACHINE_CONFIGURATION_IDENTITY_MISMATCH`. It verifies/re-evaluates the packet through the existing Store request layer, then lowers, generates records, runs the validated virtual model and produces blocked physical admission. REFUSED/STALE produces reasons and no machine artifacts. A failed virtual run cannot become successful evidence. Success is `VIRTUAL_EVIDENCE_READY`, not fabrication completion: it carries `localJob`, `records`, `run`, `admission` and `physicalAuthority:false`.

The response wrapper contains the evidence protocol, `storeRelease`, raw request-byte `payloadDigest`, `respondedAt` and `answer`. The caller checks the exact bytes sent, expected release/configuration and full packet binding before attaching evidence to its saved revision. The same 256-KiB limit, origin policy, content type, timeout and non-2xx rules apply as for evaluation. A business refusal/staleness is HTTP 200; invalid catalog is 503, unexpected evidence failure 500. Transport-error bodies use the service protocol and contain no answer. No-origin server calls are allowed; CORS is a browser-origin restriction, not user authentication. Only published reference virtual records are returned; real controller, PLC, commissioning, private tooling and physical-release interfaces are not provided.

*Trace: `src/machine/configuration.mjs`; `src/machine/evidence.mjs`; `src/contracts/machine-records.mjs`; `src/contracts/job-packet.mjs`; `src/service/server.mjs`. Verification: `tests/machine-boundary.test.mjs`, `tests/service.test.mjs`, `acceptance/machine/machine.test.mjs` and unchanged differential/Project 1 evidence checks.*

# 11. Five library jobs, start to finish

## 11.1 Start Your Own — `USER_DEFINED_BOARD_V1`

System owns the selected material class, identified parts, finished lengths, miter meaning, spots and unresolved project facts. Store walks matching board offerings in ascending parent length and returns the first **complete** candidate under stock, price, capability, retained-control and travel rules. For the canonical two-16-in SPF example, that is the 60-in Store board and Q $8.54; for treated SYP above-ground, the first matching complete Store board is 72 in and Q $11.08. The grade is the customer's; Store asks for it when the wood comes in more than one. Nothing in the evaluator changes the requested part lengths, angle or spot locations.  
*Trace: §6A.12A; `evaluateDimensionalTravelJob`; Store tests; System Start Own integration test.*

## 11.2 Critical Fit — `CUT_PACKAGE_V1`

System owns the alcove's meaning and geometry and sends it as neutral cut packages: uprights, shelf strips, and a functional-requirement item line for the pins and screws. Store knows nothing about alcoves.

The shelf layout is the user's choice, not the yard's. The same depth can be reached many ways from the widths on offer: whole boards that land a little over or under it, or boards brought to an exact width by an edge mill or a rip. Different widths need different operations; an inch either way can remove a machining step, or make a layout infeasible. Store does not choose among layouts or round a depth toward one. System sends each layout that meets the user's acceptance criteria as its own definition. Store answers each with its operations, its status and reasons, and its Q. The user chooses. Within one package, Store still chooses the parent board length, because that changes the cut plan, not the part.

For a 14-in pine shelf, the same Store answers, for example:

| Layout across the depth | Depth | Operation on the strips | Q |
|---|---|---|---|
| 1×8 + 1×8 | 14.5 in | none | $301.86 |
| 1×6 + 1×6 + 1×3 | 13.5 in | none | $303.45 |
| 1×6 + 1×6 + 1×4 | 14.5 in | none | $327.74 |
| 1×10 + 1×6 | 14.75 in | none | $353.28 |
| 1×6 + 1×6 + 1×4 milled to 3 | 14 in | edge mill | $393.71 |
| 1×8 + 1×8 milled to 7 | 14 in | edge mill | $411.94 |
| 1×6 + 1×6 + 1×6 ripped to 3 | 14 in | rip | $429.16 |

*Trace: §6A.5 and §6A.12 C; `tests/alcove-via-cut-packages.test.mjs` (`LAYOUTS`); `tests/fixtures/alcove-cut-packages.mjs` (`shelfStrips`).*

## 11.3 Space Utilization — `CUT_PACKAGE_V1`

The Window Seat path submits neutral cut packages. Store evaluates the actual material class, identified parts, end angle, optional finished-width mill, optional spots and structured/exact-SKU item lines; every line receives its own answer. Whole-board edge sizing, when requested, occurs before the board's parts are cut. Structured fastener requirements are exact-match questions against catalog fastener facts, not permission for a near-size or finish substitution.  
*Trace: `CUT_PACKAGE_STANDARD`; `evaluatePackage`; `evaluateRequirement`; `tests/cut-package.test.mjs`.*

## 11.4 Outdoor Build — `CUT_PACKAGE_V1`

Outdoor uses the same neutral cut-package evaluator rather than a project-specific Store surrogate. The evaluator has no picnic-table or bench knowledge: it sees the packages it is sent, independently resolves each material/part line and returns line-level Q or named failure. The source-level neutrality test asserts that project names and table/bench vocabulary do not appear in the evaluator. System's Outdoor admission (profile 0.4) requires each package's identified material and a nonempty list of identified parts with positive lengths in both inquiry scopes, so a package missing either never reaches Store; Store independently validates what it consumes (`MATERIAL_CHOICE_REQUIRED`, `PACKAGE_PARTS_REQUIRED`).  
*Trace: `tests/cut-package.test.mjs` source-neutrality assertion; System `apps/stb/shared/tile-host-admission-contract.mjs` (`OUTDOOR_MATERIAL`, `OUTDOOR_PACKAGES`); Store `validateParts`/`evaluatePackage`.*

## 11.5 Playhouse — `SHEET_PACKAGE_V1`

System supplies one identified sheet definition and identified features. Store matches the sheet, derives the circular segment, plans reference tabs, checks the centered S-001 work field and split/crosscut rules, routes while the sheet remains registered, applies the declared panel-saw crosscuts, accounts for every returned piece and calculates material plus modeled machine service. The canonical current example is §6A.12D. Physical tab retention and a physical S-001 cell remain unmeasured/uncommissioned.  
*Trace: `evaluateSheetPackageJob`; `S001_STAGE2_ENVELOPE`; `STENCIL_TAB_POLICY_V0`; sheet-package tests.*

# 12. Project 1 proof and evidence relationship

The Project 1 review remains a separate evidence document and is not rewritten by this specification: [`docs/project-1-digital-trail/D001_Project1_Review.md`](project-1-digital-trail/D001_Project1_Review.md). This specification explains the general Store contract and executable rules; the Project 1 review is the microscopic end-to-end record for its identified specimen.  
*Trace: `docs/project-1-digital-trail/D001_Project1_Review.md`; owner instruction to preserve the review unchanged.*

This Store reproduces the review’s Store answer from the review’s own inquiry: `acceptance/project-1` feeds `definition-and-demand.json` (copied unchanged from the evidence package, verified against its manifest) to this code, against the catalog the review used and with the review’s recorded Store revision, and requires every field of the review’s `store-answer.json` — selected 72-in treated parent, $5.15 material, $5.94 machine service, Q $11.09, 85.5001 s, and both calculation hashes. Through the request layer the same inquiry gets the same totals under this Store’s own release identity, and therefore a different calculation identity: this Store never claims the old one.  
The review's inquiry named no grade. Treated 2×4 is offered in three, and the grade is the customer's choice (§19), so this Store answers the sealed inquiry as it is with `UNRESOLVED / GRADE_CHOICE_REQUIRED`. With the grade the review priced, `above-ground`, named, it gives the review's whole answer, both calculation hashes included. The local job differs from the review's only in the demand hash, which is the hash of the demand sent.  
*Trace: `acceptance/project-1/project-1.test.mjs`; `acceptance/project-1/from-evidence/`; `tests/fixtures/project-1.mjs`; `acceptance/machine/machine.test.mjs`.*

Where the Project 1 evidence uses a modeled machine/instruction representation, that evidence remains evidence of that represented chain; it is not retroactively evidence that the specified physical D-001 target has been built or commissioned. A later physical proof must bind the then-current definition, Store answer, released machine configuration, lowering/postprocessor identity, local release/Cycle Start and inspection records without rewriting the existing review.  
*Trace: Project 1 review status/evidence structure; Stage-2/Stage-3 distinction in `STB-STORE-CELL-STAGES-0.1.md`; user rule “Do not edit or summarize away the Project 1 review.”*

# 13. Claim-to-function matrix

## 13.1 Patent source location

The two issued patents cited by this specification are in this repository at `docs/patents/`: **US 9,720,401 B2** (`docs/patents/US9720401B2.pdf`) and **US 10,768,609 B2** (`docs/patents/US10768609B2.pdf`), with their SHA-256 values in `docs/patents/SHA256SUMS.txt`. The claim text used for this matrix was read from those issued patent PDFs; the matrix does not infer claim text from the Store code.  
*Trace: `docs/patents/`; issued PDFs US 9,720,401 B2 pp. 30–33 and US 10,768,609 B2 pp. 31–33.*

This matrix is a **function trace, not a legal opinion on claim construction, validity, infringement, coverage or scope**. “Status” means only the implementation/evidence state of the function described in this specification. A row is not upgraded because related software exists elsewhere.  
*Trace: owner instruction for this specification.*

## 13.2 US 9,720,401 B2

| Patent / claim | Claim element in plain words | Function in this specification | Code implementing it | Test proving it | Status |
|---|---|---|---|---|---|
| US 9,720,401 B2, claim 1 | Integrated customer interface plus tandem sheet and dimensional machines; selected project instructions control cutting/shaping/forming; sheet machine has the claimed support/roller/yoke/rail/tooling-platform arrangement. | §§2–4, 8, 10–12 | Store sheet/dimensional models: `src/evaluation/evaluators/sheet-package.mjs` `evaluateSheetPackageJob`; `src/evaluation/engine/d001-travel-standard.mjs` `evaluateD001UserDefinedBoard`; no physical tandem-machine code | `tests/sheet-package.test.mjs`; `tests/d001-travel-standard.test.mjs`; no physical-machine test | **modeled** |
| claim 2 | Each machine has a control panel and can operate manually or automatically from computer control. | §§7, 9–10 | none | none | **specified, not built** |
| claim 3 | Sheet-machine tooling platform can accept selectively installed tooling heads. | §8 | none; S-001 Stage-2 uses a fixed reference router model, not selectable physical heads | none | **not addressed** |
| claim 4 | Dimensional machine has support surface, fence, clamping roller, servo manipulating roller and servo-controlled saw station. | §§7, 9 | none for physical machine; modeled geometry in `src/evaluation/envelopes/d001-stage2-envelope.mjs` | `tests/d001-stage2-envelope.test.mjs` proves modeled envelope only | **specified, not built** |
| claim 5 | Dimensional machine additionally has fixed rigid vertical and horizontal ways positioning tooling heads under servo control. | §7 | none | none | **not addressed** |
| claim 6 | Claimed dimensional surface is a rigid metal base with predrilled mounting holes for the listed machine elements. | §7 | none | none | **not addressed** |
| claim 7 | Prefinishing/finishing station applies selected finishing material to project components. | §11 / Open work | none | none | **not addressed** |
| claim 8 | Secondary-operations station permits further manual Store processing. | §11 / Open work | none | none | **not addressed** |
| claim 9 | Labeling station identifies components and prints assembly instructions. | §§10, 12, 15 | Store models label time/output identity but no physical labeling station: `src/evaluation/engine/d001-travel-standard.mjs` `deriveBatchComponentPlan`; `src/evaluation/evaluators/sheet-package.mjs` `operationsFor` | Store tests assert label-related modeled operation/time only; no physical station test | **specified, not built** |
| claim 10 | Independent method: customer project interface/database-or-CAD; tandem sheet/dimensional machines; estimated price; final machine instructions; retail-store implementation; CAD/CAM instructions; operator loading and tool-head changes. | §§2–12 | Partial software models exist, but no code implements the complete claimed combination and ordinary per-job tool-head changes are excluded from the first-cell target | none for the complete claim | **not addressed** |
| claim 11 | Customer changes project requirements; estimated price is recalculated and returned. | §§2–6, 11 | System handoff/runtime plus Store request layer and evaluators; `src/requests/store-request.mjs` and the request-specific evaluators calculate new answers from new demand | System `apps/stb/test/integration/start-own-shared-host.test.mjs` “a wood change updates the bench price…”; Store deterministic-recalculation tests | **implemented and tested** |
| claim 12 | After customer accepts fabrication, determine materials and develop machining instructions. | §§5, 10, 12, 15 | Material resolution is implemented; complete post-acceptance physical instruction-generation path is not built as one production chain | material-resolution tests exist; no complete production-acceptance-to-machine test | **specified, not built** |
| claim 13 | Transmit machining instructions to the tandem machine. | §§10, 12 | none for a commissioned machine; Project 1 carries a virtual instruction representation | Project 1 evidence only; no commissioned machine test | **modeled** |
| claim 14 | Prepare/affix component labels and prepare assembly instructions. | §§10, 12, 15 | modeled label records exist; no complete physical label/assembly-instruction implementation under Store `src/` | no complete claim test | **specified, not built** |
| claim 15 | Provide a list of additional project components not fabricated by the two machines. | §§4–6, 11 | `src/evaluation/evaluators/cut-package.mjs` `evaluateItem`, `evaluateRequirement`, `evaluateFunctionalRequirement` | `tests/cut-package.test.mjs` hardware requirement/exact-SKU assertions; `tests/alcove-via-cut-packages.test.mjs` functional-requirement assertions | **implemented and tested** |
| claim 16 | After machining, remove component and perform one or more of labeling, finishing, secondary operations or packaging with additional components. | §§11–12 / Open work | none for the complete physical post-machine workflow | none | **not addressed** |
| claim 17 | Implement the claim-10 method as machine-readable instructions on a non-transitory storage medium. | §§10, 12 | software/instruction artifacts exist as models; no commissioned controller chain | Project 1 evidence; no physical machine test | **modeled** |
| claim 18 | Estimated price uses prices from a Store pricing database. | §§5–6, 6A | `src/evaluation/catalog.mjs` `sellingPriceFor`, `validateCatalog`; `src/evaluation/engine/pricing.mjs` `estimateUserDefinedBoardTravel`; Store catalog data | `tests/catalog-pricing.test.mjs`; `tests/d001-travel-standard.test.mjs`; `acceptance/catalog/catalog.test.mjs`; evaluator pricing tests | **implemented and tested** |

*Trace for claim wording: US 9,720,401 B2 claims 1–18. Implementation/test paths are the files named in each row.*

## 13.3 US 10,768,609 B2

| Patent / claim | Claim element in plain words | Function in this specification | Code implementing it | Test proving it | Status |
|---|---|---|---|---|---|
| US 10,768,609 B2, claim 1 | Independent method: project interface/database-or-CAD, estimated price, final instructions, tandem sheet and dimensional machines; dimensional stock can move fore/aft for end operations; detailed sheet-machine structure. | §§2–12 | Store models both machine families and Q; `evaluateSheetPackageJob`; `evaluateD001UserDefinedBoard`; no physical tandem machine | sheet and dimensional Store tests; no physical-machine test | **modeled** |
| claim 2 | Claim-1 method implemented by a retail business entity. | §§2, 5.2, 5.5 | Store Zero dealer/yard is a declared fixture; no real retail business adapter is production evidence | Store fixture tests only | **modeled** |
| claim 3 | Customer varies requirements; system recalculates and outputs revised estimated price. | §§2–6, 11 | System request path plus Store fresh evaluators | System Start Own integration test; Store fresh-evaluation/repricing assertions | **implemented and tested** |
| claim 4 | Customer accepts fabrication; system determines materials and develops machining instructions. | §§5, 10, 12, 15 | material resolution implemented; complete accepted-order-to-physical-program chain not built | partial tests only | **specified, not built** |
| claim 5 | Transmit machining instructions; operator loads the identified stock; machine performs component operations. | §§9–12 | Store emits modeled operations; no commissioned physical transmission/execution code | Project 1 evidence and Store operation-plan tests, not a physical execution test | **modeled** |
| claim 6 | Prepare component labels and assembly instructions. | §§10, 12, 15 | modeled label behavior only; no complete physical label/assembly-instruction implementation | no complete claim test | **specified, not built** |
| claim 7 | Prepare listing of additional nonfabricated project components. | §§4–6, 11 | `evaluateItem`, `evaluateRequirement`, `evaluateFunctionalRequirement` | cut-package hardware and functional-requirement tests | **implemented and tested** |
| claim 8 | CAD includes CAM; instructions direct operator loading and tool-head changes. | §§7, 10 | complete per-job tool-head-change behavior is intentionally outside the first-cell target; no implementing code | none | **not addressed** |
| claim 9 | Customer interface permits interaction with both project database and CAD design module. | §§2–3, 11 | System has library and user-defined project paths, but no literal claim-wide CAD module is established in Store code | System app tests cover library/user-defined paths, not the complete claim element | **modeled** |
| claim 10 | After machining, label and/or finish, perform secondary operations, package fabricated and additional components for pickup. | §§11–12 / Open work | none for the complete physical workflow | none | **not addressed** |
| claim 11 | Claim-1 method embodied in machine-readable instructions on a non-transitory storage medium. | §§10, 12 | software artifacts exist; no commissioned physical chain | Project 1 evidence; no physical test | **modeled** |
| claim 12 | Estimated price is based on prices from a pricing database at the Store where the tandem machine is located. | §§5–6, 6A | Store catalog/pricing engine | Store pricing and evaluator tests | **implemented and tested** |
| claim 13 | Tandem machine system is located in a home-improvement retail store. | §§5.5, 15, 17 / Open work | none; Store Zero is fictional and no physical tandem cell in a real home-improvement store is established | none | **not addressed** |
| claim 14 | CAD module includes CAM and generates the tandem-machine instruction set. | §§10, 12 | modeled lowering/instruction artifacts exist; no complete physical CAD/CAM-to-controller implementation | Project 1 evidence only | **modeled** |
| claim 15 | Operator sequentially loads raw materials and changes tooling-head attachments based on CAD/CAM instructions. | §§7, 9–10 / Open work | no code; first-cell target deliberately excludes ordinary per-job tool changes | none | **not addressed** |

*Trace for claim wording: US 10,768,609 B2 claims 1–15. Implementation/test paths are the files named in each row.*

# 15. Commissioning and evidence plan

Commissioning exists to replace declared reference assumptions with measured facts without rewriting results calculated under a modeled evidence basis. The first physical D-001 may advance only by creating a released machine configuration and evidence for the functions that the installed machine actually performs. S-001 follows the same evidence discipline if and when a physical sheet cell is built.  
*Trace: `STB-STORE-CELL-STAGES-0.1.md` Stages 2–3; `D001_STAGE2_ENVELOPE.measured=false/commissioned=false`; `S001_STAGE2_ENVELOPE.measured=false/commissioned=false`.*

1. **Freeze the buildable machine configuration.** Record the actual base/fence/support references, roller locations, saw stations, router/spot stations, tool identities, motion/controller architecture and protective-system design that will be built. A fact that is still an engineering choice remains unresolved rather than becoming an assumed coordinate.  
   *Trace: §7; `STORE-MACHINE-BOUNDARY.md`; Stage-3 roadmap.*
2. **Build and inspect the physical cell.** Measure the installed Datum A/B geometry and station relationships rather than treating modeled coordinates as physical truth.  
   *Trace: Stage-3 roadmap; `STORE-JOB-001.md` reference-chain model.*
3. **Establish the released tooling/configuration.** Record installed blade/cutter/spot identities, the machine values needed for lowering, and the responsible release identity. Per-job production changes do not silently modify the configuration.  
   *Trace: §§7.6, 9, 10; `STORE-MACHINE-BOUNDARY.md`.*
4. **Implement and validate local lowering/controller admission.** The machine-neutral operation ledger must map to the released machine configuration and controller representation without dropping or inventing operations. Simulation precedes physical tool motion.  
   *Trace: §10; Project 1 evidence relationship.*
5. **Commission protective functions and energy-control boundaries.** Guarding, local stopping, restart prevention, hazardous-energy control, access protection and fault/recovery behavior must be established for the installed equipment before ordinary production.  
   *Trace: §9; OSHA 29 CFR 1910.212, 1910.147, 1910.213; Stage-3 roadmap.*
6. **Commission workpiece control and reference validity.** Demonstrate loading/reference establishment, roller/workholding control, Datum-C establishment, commanded-versus-actual travel and the events that invalidate position.  
   *Trace: `STORE-JOB-001.md` §§9–16; `D001_TRAVEL_STANDARD`; Stage-3 roadmap.*
7. **Run first-part/reference specimens and inspect them.** Measure the dimensions, angles and feature locations that the released capability claims. The draft’s provisional first-stage linear criterion of ±1/32 in is a **specified test criterion only**, not measured capability; angular acceptance is **not specified in sources** and must be established before it is claimed.  
   *Trace: source draft §9.5 and §15; no Store test establishes commissioned physical tolerance.*
8. **Revise the physical envelope only from evidence.** A failed test or unsupported condition remains a refusal/unresolved result until the configuration or evidence changes; a software limit is not widened merely to obtain a pass.  
   *Trace: Stage-2/Stage-3 evidence rule; Store refusal doctrine.*
9. **Run a conformed end-to-end Project 1 physical proof without altering the existing review.** The new evidence must identify the definition, Store answer, selected material, machine configuration, lowering/controller identity, local release/Cycle Start and inspection result.  
   *Trace: §12; Project 1 review; user instruction to preserve the existing review.*
10. **Publish commissioned capability only after acceptance.** Only measured/accepted facts may replace the corresponding modeled assumptions for the released machine configuration. Modeled results keep the model identity under which they were calculated.  
   *Trace: `STB-STORE-CELL-STAGES-0.1.md`; D-001/S-001 evidence fields.*

# 16. Terms

Store Zero keeps no definitions of its own. Every shared term — including the yard, merchant and Store Zero terms this specification uses — is defined once, in System's definitions. Today these are the [predecessor System's definitions](https://github.com/GeorgePlattDemo/scan-to-build-system/blob/main/docs/definitions/README.md), which the live application runs; the [replacement System's definitions](https://github.com/GeorgePlattDemo/new-system/blob/main/docs/DEFINITIONS.md) become the authority when the owner accepts them. That candidate already defines the dispositions, grade, the end-geometry fields and most terms below; it does not yet define Cell Steward, `SPECIAL_ORDER_OPTION` or Store membrane. This specification uses those terms and does not redefine them; a term it needs that System does not yet define is a System definitions gap, recorded in Open work, not permission to define it here.  
*Trace: `AGENTS.md`; `acceptance/boundaries` — “Store Zero keeps no definitions file of its own: System owns shared definitions”.*

Terms this specification relies on that System must carry: admission; allocated; available; budgetary Q; capability; Cell Steward; Datum A, B and C; fresh evaluation; inventory; machine configuration; modeled; on hand; operator; offering; order; reservation; Store release; `SPECIAL_ORDER_OPTION`; Store membrane; and the four dispositions `SUPPORTABLE`, `UNRESOLVED`, `REFUSED`, `UNAVAILABLE`.

# 17. Open work

Every row states the present defect or gap, the required end state, and the evidence that will close it. A test name marked **new** does not exist yet; it is the required proof target, not a claim that the work is done. Rows are grouped by who closes them and what kind of evidence closes them. Running virtual operations is never evidence that physical machine work is done.

## 17.1 Closed and verified software work

| Item | What was wrong | What is true now | Evidence |
|---|---|---|---|
| One request layer, one pricing authority | The predecessor carried count-only and project wrappers and a second request path. | One request layer (§6A.13); every Q comes from the catalog selling price and the declared machine economics; no evaluator issues a receipt. | `acceptance/boundaries`; `acceptance/differential` (every recorded answer replayed or retired by a named approved change). |
| Silent definition defaults | A missing miter angle priced as 0°, a missing end cut as square, a missing Datum-C method as `REFERENCE_CUT`, a missing operation list as `MITER_LIMITED`, a missing plane as `miter-face`; `returnAllPieces` unread; null read as 0. | Each is asked for with its reason; declared operations must agree with the parts; one rule decides what a stated number is (`src/evaluation/stated-number.mjs`). §19 `NO-SILENT-DEFINITION-DEFAULTS`. | `tests/definition-completeness.test.mjs`; `tests/cut-package-branches.test.mjs`; `tests/sheet-package-branches.test.mjs`; differential approved-change test. |
| Unstated board geometry and grade | Boards were priced as parallel, long-long, at whichever grade was shortest, without the definition saying so. | The definition states end relation, length datum and grade; Store prices only what it models and asks or refuses otherwise. §19 `END-GEOMETRY-IS-STATED`, `GRADE-IS-THE-CUSTOMERS`. | `acceptance/project-1`; `acceptance/differential`; `tests/machine-boundary.test.mjs`. |
| Datum-C method substitution | `MECHANICAL_REFERENCE` and `SENSED_FACE` were planned and priced as a reference saw cut. | `UNRESOLVED / DATUM_C_METHOD_NOT_MODELED:<method>` until modeled. No recorded answer used them. | `tests/d001-travel-helpers.test.mjs`; `tests/definition-completeness.test.mjs`. |
| Edited answers read as stale | A packet whose answer body was edited but whose calculation identity was kept answered `STALE` (re-quote). | `REFUSED / PACKET_ANSWER_ALTERED`; only a genuinely different calculation is stale. | `acceptance/contracts` (price edited after the answer; repriced board). |
| Radius tolerance at its edge | Binary rounding refused a radius exactly 0.001 in from the derived one. | Inclusive as written. | `tests/circular-segment.test.mjs`. |
| Isolated rule coverage | Catalog tie-break, S-001 timing literals, circular-segment branches, stencil coordinates, D-001 envelope branches, travel thresholds and helpers, cut-package ties and propagation, sheet branches had no direct tests. | Each rule has a test that fails when it is broken. | `tests/catalog-tie-break.test.mjs`, `tests/s001-timing-constants.test.mjs`, `tests/circular-segment.test.mjs`, `tests/stencil-tab-geometry.test.mjs`, `tests/d001-envelope-branches.test.mjs`, `tests/d001-travel-helpers.test.mjs`, `tests/cut-package-branches.test.mjs`, `tests/sheet-package-branches.test.mjs`. |
| Service identity | A release label proved nothing about the code running, and a manual label could override the host's commit. | `/health` reports the digest of the files the process runs; a contradicting label refuses to start; `scripts/verify-deployment.mjs` checks a running Store from outside. | `tests/service.test.mjs`; `tests/verify-deployment.test.mjs` (local service only; §17.4). |
| Machine evidence boundary (0.9) | Runtime machine validation and a bounded evidence interface were missing. | §10.6. | `tests/machine-boundary.test.mjs`; `acceptance/machine`. |

## 17.2 Store software defects and unbuilt software remaining

| Item | What is wrong or absent today | What it must become | Test/evidence that proves closure |
|---|---|---|---|
| Spot past the end of a part, two codes | The same out-of-range spot is `SPOT_LOCATION_OUTSIDE_PART` on the sequence path and `SPOT_LOCATION_OUTSIDE_COMPONENT` on the long-part path, so the code depends on which board was cheapest. Both refuse; recorded answers carry both codes. | One code for one condition, as an owner-approved change. | Differential evidence for every recorded answer that carries either code. |
| Cut-package failed line names one candidate | A line whose machine run fails on every candidate reports only the cheapest candidate's reason; the others are listed only in `machineRefusals`. | Decide whether the line names every candidate's reason. | Cut-package test asserting the chosen reporting. |
| Cut-package spot identity | A spot without `featureId` is given `<partId>-SPOT-<n>`. It names no manufacturing fact, but it is a value the definition did not supply. | Require a spot identity, or keep the derived name and state it as the rule. | Cut-package definition test. |
| Cut-package end geometry | A cut package states one angle and is cut parallel at both ends on the miter face; the answer says so (`endCut.plane`, `endCut.ends`), but the definition cannot ask for anything else. | Keep as the type's declared meaning, or add end geometry to the package with the same rule as boards. | Contract decision; then tests. |
| Split-tab additions unreachable | The arched planner always plans at least five symmetric tabs, so the split planner never adds a tab from the evaluator; its numbering would also repeat a number if a plan's tabs were not numbered 1..n. | Keep the branch tested directly, or remove it. | `tests/stencil-tab-geometry.test.mjs` covers it directly today. |
| Lowering for other request types | Virtual lowering, motion records and runs exist only for `USER_DEFINED_BOARD_V1`; supportable cut and sheet packages answer `LOWERING_NOT_REGISTERED_FOR:<type>`. Sheet lowering needs the S-001 machine facts registered as data first. | Register lowering for `CUT_PACKAGE_V1` on the D-001 reference configuration; register an S-001 reference configuration from owner-supplied facts, then its lowering. | Golden local-job, motion-record and virtual-run tests per type. |
| Special-order commerce | `supplierPath` is fixture metadata; no general supplier query/price/lead-time/payment-gated procurement exists. | Return a separate attributable special-order option without changing local `UNAVAILABLE`; order only after commercial acceptance. | **new:** supplier-option contract tests: exact conforming match, no match, source/price/lead time, no automatic purchase. |
| Store 1 adapter | Store Zero is the callable fixture; no real dealer adapter is established here. | Real yard answers the same bounded questions from its own catalog, stock, price, suppliers, capabilities and fulfillment authority. | **new:** Store-1 contract suite against a real/test dealer adapter with source/freshness assertions. |

## 17.3 System integration responsibilities

These belong to System. Store's side of each is built and tested; the row records what System must send or carry. Checked against the replacement System candidate (`new-system`).

| Item | What is wrong or absent today | What it must become | Test/evidence that proves closure |
|---|---|---|---|
| Board definitions state grade and end geometry | `new-system` builds a board's `materialDemand` without a grade, and carries `endRelation`, `lengthDatum` and `endIdentity` in its revision requirements, outside the Store demand. Its published-wire adapter keeps them off the demand, and sends `datumCMethod: ""` and `requiredOps: []` when the page omits them. Store now asks for every one of these (§6A.1). | System sends the grade the user chose and copies its end geometry into the demand, the same values it puts in the packet's `requirements`; it never sends blank operations or Datum-C methods. | System acceptance: the Start-your-own and treated boards answer `SUPPORTABLE` from the replacement Store with grade and geometry stated; a packet whose requirements differ is refused. |
| Published end identity | The published board line carries `endIdentity: "both"`; System's definitions say a non-null end identity is refused. | System omits it where the length datum already says it, and sends any genuine end identity to be refused. | System test on the published line. |
| Application cutover | The application's adapter, `STORE_PIN`, hosted-Store start script and CI Store reference point at the predecessor Store. Its count-only square-stick Board (`BOARD_SQUARE_V1`) and the request fields `storeRevision`/`evaluatedAt` are refused here. | One owner change in System that points the application at this Store's service and nothing else, after System sends clean definitions for every tile. | Application acceptance through the public entry against this Store's release. |
| Shelf layouts in System | System sends one alcove layout. Different board widths for the same depth need different operations and prices, and the choice is the user's (§11.2). | System lists the layouts the yard's widths allow against the user's acceptance criteria (for example, a depth tolerance), sends each as its own definition, shows every answer with its operations and Q, and records the user's choice. | System acceptance: several layouts answered, the chosen one carried into the accepted job packet. |
| System definitions | System's definitions §8 delegates yard, merchant and Store terms to the predecessor Store's `DEFINITIONS.md`, and System's Store request type list still names `BOARD_SQUARE_V1`. | System §8 defines those terms itself (§16 lists the ones this specification uses) and its request type list matches §3.2. | System definitions review. |

## 17.4 Independent deployment and release gates

| Item | What is wrong or absent today | What it must become | Test/evidence that proves closure |
|---|---|---|---|
| Store service deployment | The service (§6A.14) is built and tested here. A Railway `store-zero` service is staged but not deployed; the live `store-zero-runtime` service and System's pin are unchanged. The hosted Store the application uses today is System's adapter loading the predecessor Store at a pinned commit. | A hosted service built from this repository (Render Blueprint `render.yaml`, or Railway `railway.json`), separate from the existing one, answering at its own address under this repository's release identity. | `npm run verify:deployment -- <address> --commit <sha>` passes every check from a clean checkout of that commit: release, source digest, Project 1, a second board, a cut package, a sheet, refusals, machine evidence, altered and foreign answers refused. Not yet run against a hosted candidate. || Promotion | No candidate has been promoted. | The owner promotes a verified candidate and moves System's pin, separately from any code change. | The verification output for the promoted commit, recorded with the promotion. |

## 17.5 Future physical engineering and commissioning

No row here is closed by software. Virtual records and runs are reference evidence only; physical admission stays `BLOCKED`.

| Item | What is wrong or absent today | What it must become | Test/evidence that proves closure |
|---|---|---|---|
| D-001 dual-miter target | Executable Stage-2 has miter `SAW-L` and square-only `SAW-R`; physical target specifies two registered end miter saws. | Define physical saw transforms, signed angle semantics, admitted ranges and lowering for both end stations. | **new:** `d001-physical-saw-envelope.test` proves both registered saws, signed limits and refusal outside them. |
| Saw datum / retained-face compensation | Store model carries kerf but not the complete physical station-zero/blade/kept-face target. | Released machine configuration and lowering must bind station datum, blade identity, kerf and retained-face compensation. | **new:** `d001-saw-kept-face-lowering.test` with both retained sides and blade/kerf change. |
| Physical Router 1/2/3 | Stage-2 has `MILL_LONG`, pass-through edge mill and `MILL_END` abstractions, not three commissioned physical router stations. | Register each installed router/tool transform and map only admitted operations to it. | **new:** machine-configuration and lowering tests for all three installed router functions. |
| End-face spot station | Executable Store has one wide-face spot station only. | Add a separately registered end-face spot operation only after the tool/transform/workholding are engineered. | **new:** end-face spot envelope/lowering/refusal test. |
| Physical compiler/postprocessor | The reference lowering, virtual motion records and virtual run exist for the D-001 reference cell (§10.5), but only for `USER_DEFINED_BOARD_V1`, only virtually, and with the saw stroke, retained-face rebase and one-roller states as named blockers. There is no commissioned controller-specific lowering. | Register a commissioned machine configuration; resolve the blockers; lower every admitted request type; compile and exercise the controller project; bind output to the accepted packet and configuration. | Golden lowering tests per request type, controller simulation and admission tests, and physical proof evidence. |
| Project 1 physical conformance | Existing Project 1 review is software/model evidence and is not evidence of the specified physical D-001. | Preserve it unchanged; add a separate conformed physical evidence record when a cell is commissioned. | **new:** evidence-bundle acceptance check binds definition, Store, machine config, program identity, Cycle Start and inspection. |
| Linear/angular acceptance evidence | ±1/32 in exists only as a provisional draft criterion; angular criterion is not specified. | Establish accepted physical tolerances from engineering/commissioning and publish them only for the released configuration. | **new:** first-part metrology acceptance records; angular criterion explicitly defined before test. |
| Stencil physical retention values | Maximum gap, bridge width, remaining thickness and physical holding performance are intentionally unmeasured/null. | Establish values only through physical S-001 workholding evidence or keep them unresolved. | **new:** commissioned retention/workholding test; no value is accepted from software alone. |
| Safety — risk assessment | No machine-specific risk assessment exists in the Store sources. | Complete and control a risk assessment for the installed D-001/S-001 equipment. | Commissioning evidence: approved risk assessment tied to machine configuration. |
| Safety — guarding | Physical point-of-operation/nip/rotating/chip guards are not designed in sources. | Installed guarding must satisfy the applicable machine hazards and released design. | Guard inspection/validation record against OSHA 1910.212 and applicable equipment requirements. |
| Safety — access/interlocks | No guard-door/access or safety-rated interlock architecture is specified. | Define, install and validate access protection appropriate to the hazard analysis. | Protective-function validation record; machine Ready cannot be asserted when required protection is open/invalid. |
| Safety — emergency stop | E-stop locations, architecture, stopping behavior and reset logic are absent. | Define and validate the local emergency-stop function for the installed cell. | Functional stop/reset validation tied to the released controls. |
| Safety — restart prevention | No commissioned automatic-restart prevention is established. | Implement and validate restart prevention after power restoration where required. | Power-loss/restoration acceptance test consistent with OSHA 1910.213(b)(3). |
| Safety — LOTO program | No equipment-specific energy-control procedure exists. | Real employer must establish the applicable hazardous-energy program/procedure and role training. | LOTO procedure approval, training record and periodic-inspection evidence under OSHA 1910.147. |
| Safety — isolation/stored energy | Energy sources, isolating devices and stored-energy verification are not mapped. | Identify and validate all required energy-isolation and stored-energy controls for the installed equipment. | Equipment-specific isolation verification record. |
| Safety — electrical basis | Store sources do not define disconnects, enclosures, power distribution or required listing/inspection basis. | Engineer and approve the electrical installation under applicable requirements for the site/equipment. | Electrical inspection/acceptance evidence; exact governing requirements recorded for the installation. |
| Safety — dust/fire/explosion | Dust/chip collection and fire/explosion controls are absent from Store sources. | Determine and implement controls required by the actual material/process/site risk assessment. | Commissioning/inspection evidence for the installed collection/fire controls. |
| Safety — noise/PPE | No exposure assessment or PPE/hearing program is specified. | Evaluate actual exposure and establish required PPE/hearing controls. | Measured exposure/approved program records where required. |
| Safety — selected-tool guarding | Exact saw/router/drill guard design for selected components is absent. | Validate tool-specific guarding and access protection after component selection. | Tool/station guarding validation records. |
| Safety — restraint/slip detection | No measured workholding force, roller pressure, slip limit or loss-of-reference detector is established. | Commission workpiece restraint/reference validity and define fail criteria. | Physical traction/slip/reference-loss test suite. |
| Safety — safe speeds and stops | Stage-2 speeds/accelerations are modeled, not commissioned. | Establish allowed physical motion and stopping performance from installed-cell evidence. | Motion/stop commissioning records; configuration version updated. |
| Safety — maintenance/jog/tool-change procedure | Sources define boundaries but no equipment-specific procedure. | Write and approve machine-specific maintenance, setup, jog/manual-mode and tool-change procedures consistent with energy control/protective design. | Procedure review plus practical qualification records. |
| Safety — training/qualification | No physical-cell operator/Steward/LOTO qualification records exist. | Train and qualify personnel for assigned duties under the real employer's program. | Training/qualification records tied to roles and machine version. |
| Safety — periodic inspection | No inspection interval/program for released setup/protective/energy-control state is specified. | Establish the inspections required by the employer's program and applicable rules. | Periodic-inspection records, including OSHA 1910.147 requirements where applicable. |
| Safety — emergency/abnormal response | Store Job 001 names abnormal conditions but not a complete emergency procedure. | Create the site/equipment-specific abnormal/emergency response procedure without weakening fail-closed rules. | Drill/review/approval evidence for the installed cell. |
| Safety — local approvals | Store sources do not establish AHJ, fire, electrical or building approvals for a physical installation. | Identify and satisfy the approvals applicable to the actual site. | Recorded permits/approvals/inspection evidence where applicable. |
| Safety — S-001 retention | Stencil planner explicitly does not prove physical retention. | Validate actual sheet workholding/tab-retention behavior before energized production. | Physical S-001 retention/workholding commissioning tests. |
| Safety — protective state to Ready | No commissioned controls prove that required protective functions gate machine Ready. | Bind Ready/motion permission to the released protective state and validate the fail-closed behavior. | Integrated protective-function/Ready acceptance test. |
| Claim 401-3 | Selectively installed tooling-head function is not part of the fixed first-cell production target. | Address only if a future machine deliberately implements the claimed selectable-head function; otherwise leave it outside the implementation. | If implemented: dedicated tooling-head configuration/change test; otherwise documented `not addressed` remains. |
| Claim 401-5 | Exact fixed vertical/horizontal tooling ways are not implemented. | Implement only if chosen for a physical design; otherwise preserve `not addressed`. | Physical configuration/evidence if adopted. |
| Claim 401-6 | Rigid metal base with the claimed predrilled mounting-hole arrangement is not implemented. | Implement only if selected in the physical design; otherwise preserve `not addressed`. | Mechanical drawing/inspection evidence if adopted. |
| Claim 401-7 | Prefinishing/finishing station is not addressed. | Add only as a separately specified capability if the program chooses to build it. | Capability/physical acceptance test if adopted. |
| Claim 401-8 | Secondary-operations station is not addressed. | Add only as a separately specified capability if adopted. | Process/capability test if adopted. |
| Claim 401-10 | Complete claim combination, including its physical tandem details and operator tool-head changes, is not implemented as a whole. | Do not upgrade status unless every mapped function is actually built/tested; the present fixed-tool target may remain narrower. | Claim-trace review plus the actual implementation tests for any adopted functions. |
| Claim 401-16 | Physical post-machining finishing/secondary/package workflow is not addressed as a complete function. | Specify/build only if adopted. | Physical workflow acceptance test if adopted. |
| Claim 609-8 | CAD/CAM-directed ordinary tool-head changes are not part of the first-cell target. | Preserve `not addressed` unless deliberately adopted later. | Tool-change/role test if adopted. |
| Claim 609-10 | Complete post-machining label/finish/secondary/package path is not addressed. | Specify/build only if adopted. | Physical workflow acceptance test if adopted. |
| Claim 609-13 | No physical tandem system in a real home-improvement retail store is established. | A real deployment may address this only through actual installation evidence. | Site/commissioning evidence if deployed. |
| Claim 609-15 | Operator tool-head-change sequence is intentionally absent from the first-cell target. | Preserve `not addressed` unless a later released design deliberately changes that authority. | Tool-change/role test if adopted. |

*Trace: each row points to the governing source in §§7–15, the claim matrix, Store/System code/tests, OSHA sources, or the explicit absence of a physical source. No row is closed merely by prose.*

# Appendix A. Request and answer fields

The Store request is §3.1: `requestType`, `requestId`, `demand`, and nothing else. An evaluated answer carries `requestType`, `requestId`, the evaluator's result (status, lines or packages or features, material resolution, estimate or totals, calculation identity, not-claimed list), `freshEvaluation:true`, and the frozen `evaluationReceipt` of §2.2. A request that is not evaluated carries `requestType`, `requestId`, `status`, `complete:false`, `freshEvaluation:false`, `reasonCodes`, `calculationIdentity:null`, `evaluationReceipt:null`. An offering lookup answer carries `requestType`, `requestId`, `storeRelease`, `evaluatedAt`, `status:"ANSWERED"`, `kind`, and either `offerings`/`totalMatches`/`truncated` or `found`/`offering`.  
*Trace: `src/requests/store-request.mjs`; `src/requests/offering-lookup.mjs`; `tests/store-request.test.mjs`.*

# Appendix B. Request-type field contracts

Each type lists the top-level definition fields it declares; the exact nested shape is §3.4 and `src/contracts/definitions.mjs`, and anything outside it is refused (§3.3).

## B.1 `USER_DEFINED_BOARD_V1`

Declared fields: `title`, `configurationId`, `configurationVersion`, `classId`, `materialDemand`, `definedWorkpieceLengthIn`, `requiredOps`, `sawAngleDeg`, `cutPlane`, `datumCMethod`, `endRelation`, `lengthDatum`, `endIdentity`, `declaredSawCuts`, `declaredSpotCount`, `parts`, `unresolvedConditions`.

The definition carries configuration identity, material demand, the defined workpiece length, required operations, saw angle and cut plane, the Datum-C method, declared saw-cut and spot counts, identified parts with their spot features, and unresolved conditions. System's admitted payload (`definitionKind:user_defined_board.v1`, one identified line) is System's form of the same facts; System maps it to these fields and adds no Store calculation of its own.
*Trace: System `contracts.mjs`; `stb-store-handoff-contract.js`; System admission requirements; Store `evaluateDimensionalTravelJob`.*

## B.2 `ALCOVE_INSERT_V1` (retired)

Refused with `REQUEST_TYPE_NOT_ACCEPTED` (§19). An alcove is a `CUT_PACKAGE_V1` definition (§11.2).  
*Trace: `src/requests/store-request.mjs` (`REQUEST_TYPES`); `tests/alcove-via-cut-packages.test.mjs`.*

## B.3 `CUT_PACKAGE_V1`

Declared fields: `classId`, `configurationId`, `configurationVersion`, `cutPackages`, `itemLines`.

The definition carries configuration identity, one or more cut packages and optional item lines. A cut package requires package identity, material identity sufficient for exact Store matching, identified parts with positive lengths, end-cut meaning, and any declared finished-width or spot features. An item line is exactly one of: an exact Store SKU plus whole-number quantity; a structured hardware requirement plus whole-number piece quantity; or a functional `requirementId` plus whole-number quantity, fulfilled by the offering that declares it. Store answers lines independently.  
*Trace: `CUT_PACKAGE_STANDARD`; `validateParts`; `evaluatePackage`; `evaluateItem`; `evaluateRequirement`; `evaluateFunctionalRequirement`; System contract/admission files.*

## B.4 `SHEET_PACKAGE_V1`

Declared fields: `configurationId`, `configurationVersion`, `sheet`, `features`, `returnAllPieces`, `exteriorRatingRequested`.

The definition carries configuration identity, sheet thickness/length/width and optional species/grade, an identified feature array, and return-all-pieces semantics. The present bounded feature vocabulary is `ARCHED_APERTURE`, `STRAIGHT_SPLIT`, and `CROSSCUT`; machine-local fields such as G-code, controller or servo steps are not accepted as sheet-definition inputs.  
*Trace: `SHEET_PACKAGE_STANDARD`; `S001_STAGE2_ENVELOPE.featureKinds` and `.machineLocalLanguage`; System contract/admission files.*

## B.5 `OFFERING_LOOKUP`

Exactly one of `{ searchText }` (nonblank, at most 80 characters), `{ storeSku }`, or `{ query }` with only `species`, `form`, `nominalT`, `nominalW`, `stockL_in`. Search normalization is case-insensitive, normalizes 1×6/1 x 6/1x6 dimensions, ranks exact SKU before SKU prefix before all-token catalog matches, returns offered rows only, caps returned search rows at 20, and reports `totalMatches` plus `truncated`. It does not produce Q.  
*Trace: `src/requests/offering-lookup.mjs`; `tests/store-request.test.mjs`.*

## B.6 `BOARD_SQUARE_V1` (not accepted)

The count-only Board ticket is refused with `REQUEST_TYPE_NOT_ACCEPTED`. It could only ever return a partial material estimate without complete Q, which is not a clean definition. Square-cut work is a `CUT_PACKAGE_V1` package (0° end cut) or a `USER_DEFINED_BOARD_V1` definition.  
*Trace: `src/requests/store-request.mjs` (`REQUEST_TYPES`); `tests/store-request.test.mjs`.*

# Appendix C. Module index

| Executable/source surface | Full decision description |
|---|---|
| `src/evaluation/catalog.mjs` | §5.3, §6A.1 |
| `src/evaluation/stated-number.mjs` | §6A.1 (what counts as a stated number) |
| `src/evaluation/store-state.mjs` | §6A.1 |
| `src/evaluation/evaluators/user-defined-board.mjs` | §6A.1 |
| `src/evaluation/envelopes/d001-stage2-envelope.mjs` | §6A.2 |
| `src/evaluation/engine/d001-travel-standard.mjs` | §6A.3 |
| `src/evaluation/engine/pricing.mjs` | §6A.4 |
| `src/evaluation/evaluators/cut-package.mjs` | §6A.5 |
| `src/evaluation/envelopes/s001-stage2-envelope.mjs` | §6A.7 |
| `src/evaluation/engine/circular-segment.mjs` | §6A.8 |
| `src/evaluation/engine/stencil-tab-policy.mjs` | §6A.9 |
| `src/evaluation/evaluators/sheet-package.mjs` | §6A.10 |
| `src/requests/offering-lookup.mjs` | §6A.11 |
| One worked example per accepted request type | §6A.12 |
| `src/requests/store-request.mjs` | §6A.13 |
| `src/service/server.mjs` | §6A.14 |
| `src/contracts/shape.mjs` | §3.4 |
| `src/contracts/definitions.mjs` | §3.4 |
| `src/contracts/job-packet.mjs` | §10.4 |
| `src/contracts/machine-records.mjs` | §10.5 |
| `src/machine/configuration.mjs` | §10.6; exact registered configuration validation and content identity |
| `src/machine/evidence.mjs` | §10.6; one bounded virtual-evidence entry point |
| `src/machine/lowering.mjs` | §§10.5–10.6 |
| `src/machine/virtual-run.mjs` | §10.5 |

`src/` contains exactly these twenty-three modules. No module under `src/` is omitted from §6A.  
*Trace: `src/` tree; `acceptance/boundaries`.*

# Appendix D. Store reason-code index

This appendix is an index, not a substitute for §6A. The deciding condition, order, outcome and test status for each code are stated in the referenced module subsection.

## D.1 Store state/material/disposition — §6A.1

`SKU_NOT_OFFERED`; `MISSING_PRICE`; `ON_HAND_SHORT`; `NOT_ON_HAND`; `NO_OFFERING`; `SHEET_NOT_D001`; `STOCK_WIDTH_EXCEEDS_D001_STAGE2_ENVELOPE`; `STOCK_WIDTH_BELOW_D001_STAGE2_ENVELOPE`; `STOCK_THICKNESS_EXCEEDS_D001_STAGE2_ENVELOPE`; `STOCK_THICKNESS_BELOW_D001_STAGE2_ENVELOPE`; `KEPT_LENGTH_BELOW_TWO_ROLLER_CONTROL`; `MILL_Y_EXCEEDS_TOOL_TRAVEL`; `MITER_ANGLE_REQUIRED`; `MITER_ANGLE_OUTSIDE_D001_STAGE2_ENVELOPE`; `MITER_PLANE_NOT_DECLARED`; `GENERIC_DRILL_ENVELOPE_NOT_DECLARED_BEYOND_SPOT`; `SPOT_MODE_NOT_DECLARED`; `SPOT_LOCATION_RULE_NOT_DECLARED`; `SPOT_ACROSS_WIDTH_RULE_NOT_DECLARED`; `SPOT_INSET_NOT_DECLARED`; `SPOT_LOCATION_REQUIRED`; `SPOT_LOCATION_OUTSIDE_WORKPIECE`; `OP_NOT_ON_OFFERING:<ops>`; `CELL_FAMILY_NOT_D001`; `NO_MATCHING_BOARD_OFFERING`; `MATCHING_BOARD_NOT_AVAILABLE`; `GRADE_CHOICE_REQUIRED`; `END_RELATION_REQUIRED`; `LENGTH_DATUM_REQUIRED`; `END_RELATION_NOT_PRICED:<value>`; `LENGTH_DATUM_NOT_PRICED:<value>`; `END_IDENTITY_NOT_PRICED`; `DATUM_C_METHOD_NOT_MODELED:<method>`; `MITER_ANGLE_REQUIRED`; `CUT_PLANE_REQUIRED`; `DATUM_C_ESTABLISHMENT_METHOD_REQUIRED`; `REQUIRED_OPERATIONS_REQUIRED`; `REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:<op>`; `CANDIDATE_INPUT_UNRESOLVED`; `CANDIDATE_CAPABILITY_REFUSED`; `NO_COMPLETE_DIMENSIONAL_CANDIDATE`; `DIMENSIONAL_CANDIDATE_UNRESOLVED`.

## D.2 D-001 travel/batch — §6A.3

`DIMENSIONAL_TRAVEL_DEMAND_REQUIRED`; `BOARD_OFFERING_REQUIRED`; `DEFINED_WORKPIECE_LENGTH_REQUIRED`; `MITER_ANGLE_REQUIRED`; `MITER_ANGLE_OUTSIDE_D001_STAGE2_ENVELOPE`; `MITER_PLANE_NOT_DECLARED`; `DATUM_C_ESTABLISHMENT_METHOD_REQUIRED`; `DATUM_C_REFERENCE_STATION_REQUIRED`; `ACTUAL_BOARD_WIDTH_REQUIRED`; `IDENTIFIED_PARTS_REQUIRED`; `UNIQUE_PART_ID_REQUIRED`; `PART_LENGTH_REQUIRED`; `UNSUPPORTED_OR_MISSING_FEATURE_KIND`; `SPOT_LOCATION_REQUIRED`; `SPOT_LOCATION_OUTSIDE_PART`; `SPOT_ACROSS_WIDTH_RULE_NOT_DECLARED`; `SPOT_INSET_NOT_DECLARED`; `SPOT_INSET_OUTSIDE_BOARD_WIDTH`; `DECLARED_SAW_COUNT_MISMATCH`; `DECLARED_SPOT_COUNT_MISMATCH`; `LAST_REMAIN_BELOW_TWO_ROLLER_CONTROL`; `MILL_FEATURE_GEOMETRY_REQUIRED`; `EDGE_MILL_BOARD_BELOW_TWO_ROLLER_CONTROL`; `MILL_PROFILE_LENGTH_EXCEEDS_D001_STAGE2_ENVELOPE`; `MILL_Y_EXCEEDS_TOOL_TRAVEL`; `DIMENSIONAL_COMPONENT_RUNS_REQUIRED`; `COMPONENT_PROGRAM_REQUIRED`; `COMPONENT_STORE_BOARD_REQUIRED`; `COMPONENT_ID_REQUIRED`; `COMPONENT_FINISHED_LENGTH_REQUIRED`; `COMPONENT_FINISHED_WIDTH_REQUIRED`; `COMPONENT_LENGTH_BELOW_TWO_ROLLER_CONTROL`; `COMPONENT_LENGTH_EXCEEDS_D001_TWO_SAW_SPAN`; `COMPONENT_WIDTH_EXCEEDS_STORE_BOARD_WIDTH`; `OP_NOT_ON_OFFERING:SPOT_ON_LOCATION`; `SPOT_LOCATION_OUTSIDE_COMPONENT`; `UNSUPPORTED_OR_MISSING_BATCH_FEATURE_KIND`; `OP_NOT_ON_OFFERING:MILL_LONGITUDINAL_PROFILE`; `MILL_PATH_MUST_MATCH_COMPONENT_LENGTH`; `MILL_Y_MUST_MATCH_FINISHED_WIDTH`; `MILL_DEPTH_EXCEEDS_STOCK_THICKNESS`; `UNIQUE_COMPONENT_ID_REQUIRED`.

## D.3 Pricing — §6A.4

`BOARD_OFFERING_REQUIRED`.

## D.4 Cut packages / hardware — §6A.5

`PACKAGE_ID_REQUIRED`; `UNIQUE_PART_ID_REQUIRED`; `PART_LENGTH_REQUIRED`; `PACKAGE_PARTS_REQUIRED`; `END_CUT_ANGLE_REQUIRED`; `FINISHED_WIDTH_REQUIRED`; `MATERIAL_CHOICE_REQUIRED`; `GRADE_CHOICE_REQUIRED`; `NO_MATCHING_BOARD_OFFERING`; `FINISHED_WIDTH_EXCEEDS_BOARD_WIDTH`; `PART_NOT_HALF_INCH_UNDER_BOARD`; `ANGLED_PART_LEAVES_LESS_THAN_CONTROL_LENGTH`; `COMPONENT_LENGTH_EXCEEDS_D001_TWO_SAW_SPAN`; `COMPONENT_LENGTH_BELOW_TWO_ROLLER_CONTROL`; `PART_LONGER_THAN_LONGEST_STOCKED_BOARD`; `MACHINE_REFUSED`; `MACHINE_UNRESOLVED`; `STORE_INPUT_UNRESOLVED`; `LINE_ID_REQUIRED`; `STORE_SKU_REQUIRED`; `WHOLE_QUANTITY_REQUIRED`; `NO_OFFERING`; `NOT_OFFERED`; `HARDWARE_REQUIREMENT_INCOMPLETE`; `NO_MATCHING_HARDWARE_OFFERING`; `NO_OFFERING_FOR_REQUIREMENT`; `ITEM_LINE_NAMES_MORE_THAN_ONE_ITEM`; `CONFIGURATION_IDENTITY_REQUIRED`; `LINES_REQUIRED`; `UNIQUE_LINE_ID_REQUIRED`. Line stock failure may also report `ON_HAND_SHORT` or `NOT_ON_HAND`.

## D.5 Alcove — retired

The retired Alcove evaluator's codes are not issued (§6A.6, §19).

## D.6 S-001 envelope, circular geometry and tabs — §§6A.7–§6A.9

`CURVE_CHORD_OR_RISE_MISSING`; `CURVE_NOT_NUMERIC`; `CURVE_CHORD_OR_RISE_INVALID`; `CURVE_RADIUS_NOT_CONSTRUCTIBLE`; `CURVE_RADIUS_INVALID`; `CURVE_RADIUS_CONTRADICTS_CHORD_RISE`; `TAB_PLAN_GEOMETRY_UNRESOLVED`; `TAB_PLAN_COUNT_INVALID`.

## D.7 Sheet package — §6A.10

`CONFIGURATION_IDENTITY_REQUIRED`; `MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED`; `SHEET_SIZE_MISSING`; `RETURN_ALL_PIECES_REQUIRED`; `PIECE_DISPOSAL_NOT_OFFERED`; `SHEET_SIZE_OUTSIDE_S001_ENVELOPE`; `SHEET_THICKNESS_OUTSIDE_S001_ENVELOPE`; `FEATURES_REQUIRED`; `UNIQUE_FEATURE_ID_REQUIRED`; `FEATURE_KIND_NOT_DECLARED`; `APERTURE_PLACEMENT_NOT_DECLARED`; `APERTURE_RETENTION_MUST_BE_TABS`; `APERTURE_SIZE_MISSING`; `APERTURE_SIZE_INVALID`; circular-segment reasons from D.6; `ARCH_RISE_EXCEEDS_HALF_WIDTH`; `ROUTED_FEATURE_BELOW_MINIMUM`; `CENTER_WORK_FIELD_EXCEEDED`; `TAB_COUNT_MISSING`; `TAB_PLAN_COUNT_INVALID`; `TAB_PLAN_GEOMETRY_UNRESOLVED`; `SPLIT_HOST_APERTURE_NOT_DEFINED`; `SPLIT_LINE_NOT_DECLARED`; `SPLIT_PIECE_BELOW_MINIMUM`; `CROSSCUT_END_NOT_DECLARED`; `CROSSCUT_DISTANCE_MISSING`; `CROSSCUT_OUTSIDE_SHEET`; `CROSSCUT_INTERSECTS_ROUTED_FEATURE`; `CROSSCUT_PIECE_BELOW_MINIMUM`; `NO_MATCHING_SHEET_OFFERING`; `SHEET_NOT_OFFERED`; `OPERATION_NOT_ON_SHEET_OFFERING`; `MISSING_PRICE`; `EXTERIOR_RATING_NOT_ESTABLISHED_BY_SKU`; `ON_HAND_SHORT`; `NOT_ON_HAND`.

## D.8 Request layer and catalog — §3.3, §5.3, §6A.11, §6A.13

`REQUEST_MUST_BE_AN_OBJECT`; `REQUEST_FIELD_NOT_DECLARED:<field>`; `REQUEST_TYPE_NOT_ACCEPTED`; `STORE_EVALUATION_REQUEST_ID_REQUIRED`; `DEFINITION_REQUIRED`; `MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED`; `DEFINITION_FIELD_NOT_DECLARED:<path>`; `DEFINITION_FIELD_TYPE:<path>:<type>`; `LOOKUP_DEMAND_REQUIRED`; `LOOKUP_NEEDS_EXACTLY_ONE_OF_SEARCHTEXT_STORESKU_QUERY`; `SEARCH_TEXT_MUST_BE_1_TO_80_CHARACTERS`; `STORE_SKU_REQUIRED`; `LOOKUP_QUERY_REQUIRED`; `LOOKUP_QUERY_FIELD_NOT_DECLARED:<field>`. An invalid catalog is not answered: it throws `STORE_CATALOG_INVALID` with every problem listed.


## D.9 Accepted job packet — §10.4

`PACKET_MUST_BE_AN_OBJECT`; `PACKET_FIELD_REQUIRED:<path>`; `PACKET_FIELD_NOT_DECLARED:<path>`; `PACKET_FIELD_TYPE:<path>:<type>`; `PACKET_SCHEMA_NOT_ACCEPTED`; `PACKET_REQUIRES_ACCEPTED_DECISION`; `PACKET_DECISION_MUST_BE_SIMULATED`; `PHYSICAL_RELEASE_NOT_AVAILABLE`; `PACKET_AUTHORITY_MUST_BE_SIMULATED`; `PACKET_STORE_ANSWER_REQUIRED`; `PACKET_ANSWER_REQUEST_TYPE_MISMATCH`; `PACKET_REQUIREMENTS_DIFFER_FROM_DEFINITION`; `PACKET_ANSWER_NOT_SUPPORTABLE`; `PACKET_ANSWER_HAS_NO_RECEIPT`; `PACKET_RECEIPT_ALTERED`; `PACKET_ANSWER_ALTERED`; `PACKET_DEMAND_CHANGED`; `PACKET_STORE_RELEASE_MISMATCH`; `PACKET_DEFINITION_NOT_EVALUATED`; `PACKET_STORE_ANSWER_NOT_CURRENT` (status `STALE`); `PACKET_FIELD_NONBLANK:<path>`; `PACKET_DECISION_TIME_INVALID`; `PACKET_DECISION_PRECEDES_ANSWER`; `PACKET_STORE_AUTHORITY_NOT_CURRENT` (status `STALE`).
## D.10 Machine admission and virtual evidence — §10.6

| Boundary | Refusal/fault reasons |
|---|---|
| Configuration shape/completeness | `MACHINE_FIELD_REQUIRED:<path>`, `MACHINE_FIELD_TYPE:<path>:<type>`, `MACHINE_FIELD_NOT_DECLARED:<path>`, `MACHINE_FIELD_VALUE:<path>`, `MACHINE_FIELD_NONBLANK:<path>`, `MACHINE_LIST_REQUIRED:<path>`, `MACHINE_VALUE_OUT_OF_RANGE:<path>`, `MACHINE_CONTACTS_NOT_REGISTERED` |
| Configuration authority/content | `MACHINE_CONFIGURATION_NOT_REGISTERED`, `MACHINE_CONFIGURATION_CONTENT_CHANGED`, `MACHINE_CONFIGURATION_IDENTITY_MISMATCH`, `STATION_TRANSFORM_DIFFERS_FROM_STORE_PLAN`, `SPOT_TOOL_DIFFERS_FROM_STORE_PLAN`, `STATION_NOT_REGISTERED:<id>` |
| Definition admission | `END_RELATION_NOT_REGISTERED_ON_MACHINE`, `LENGTH_DATUM_NOT_REGISTERED_ON_MACHINE`, `END_IDENTITY_NOT_REGISTERED_ON_MACHINE`, `LOWERING_NOT_REGISTERED_FOR:<type>`, `STORE_OPERATION_PLAN_REQUIRED`, `OPERATION_NOT_REGISTERED_ON_MACHINE:<kind>`, `SELECTED_BOARD_NOT_IN_CATALOG`, `BLADE_KERF_NOT_STATED_BY_STORE_PLAN`, `ONE_MITER_ANGLE_PER_BOARD_REQUIRED` |
| Local-job completeness and content | `LOCAL_JOB_MUST_BE_AN_OBJECT`, exact shape errors prefixed `LOCAL_JOB`, `LOCAL_JOB_FIELD_REQUIRED:<key>`, `LOCAL_JOB_IDENTITY_REQUIRED:<key>`, `LOCAL_JOB_HASH_REQUIRED:<key>`, `LOCAL_JOB_EXECUTION_CLASS_NOT_REGISTERED`, `LOCAL_JOB_REQUIREMENTS_NOT_REGISTERED`, `LOCAL_JOB_CALCULATION_HASH_REQUIRED:<key>`, `LOCAL_JOB_MATERIAL_ID_REQUIRED`, `LOCAL_JOB_MATERIAL_DIMENSION_REQUIRED:<key>`, `LOCAL_JOB_PARENT_EXCEEDS_STOCK`, `LOCAL_JOB_CUT_GEOMETRY_INVALID`, `LOCAL_JOB_OPERATIONS_REQUIRED`, `LOCAL_JOB_RELEASE_BLOCKERS_REQUIRED`, `LOCAL_JOB_CONTENT_CHANGED` |
| Local operations/audit | Indexed reasons `LOCAL_JOB_OPERATION_REQUIRED`, `LOCAL_JOB_OPERATION_IDENTITY_INVALID`, `LOCAL_JOB_OPERATION_SOURCE_MISMATCH`, `LOCAL_JOB_OPERATION_TIME_INVALID`, `LOCAL_JOB_OPERATION_VALUE_REQUIRED`, `LOCAL_JOB_PART_ID_REQUIRED`, `LOCAL_JOB_STATION_ID_REQUIRED`, `LOCAL_JOB_CUTOFF_INVALID`, `LOCAL_JOB_REFERENCE_ANGLE_MISMATCH`, `LOCAL_JOB_REBASE_NOT_REGISTERED`, `LOCAL_JOB_SPOT_INVALID`, `LOCAL_JOB_CONTACT_INVALID`; also `LOCAL_JOB_CONTACT_AUDIT_REQUIRED`, `LOCAL_JOB_OPERATION_ORDER_INVALID`, `LOCAL_JOB_INDEX_GEOMETRY_INVALID`, `LOCAL_JOB_SPOT_TRANSFORM_INVALID`, `LOCAL_JOB_CUTOFF_TRANSFORM_INVALID`, `LOCAL_JOB_RETAINED_LENGTH_INVALID` |
| Motion completeness/binding | `MOTION_MUST_BE_AN_OBJECT`, exact shape errors prefixed `MOTION`, `MOTION_FIELD_REQUIRED:<key>`, `MOTION_BINDING_REQUIRED:<key>`, `MOTION_BINDING_HASH_REQUIRED:<key>`, `MOTION_UNITS_INVALID:<key>`, `MOTION_INITIAL_POSITION_REQUIRED:<axis>`, `MOTION_TOOL_CLEARANCE_REQUIRED`, `MOTION_SEQUENCE_REQUIRED`, `MOTION_CONTENT_CHANGED`, `JOB_IDENTITY_MISMATCH` |
| Motion commands | Indexed reasons `MOTION_COMMAND_REQUIRED`, `MOTION_SEQUENCE_ORDER_INVALID`, `MOTION_SOURCE_REQUIRED`, `MOTION_DELAY_INVALID`, `MOTION_OPERANDS_INVALID`, `MOTION_DATUM_AXIS_INVALID`, `MOTION_FIELD_NOT_APPLICABLE`, `MOTION_TARGET_REQUIRED`, `MOTION_TOOL_STATE_INVALID`, `MOTION_DATUM_TARGET_INVALID`; also `MOTION_COMMAND_NOT_REGISTERED:<kind>`, `MOTION_COMPLETE_MUST_BE_FINAL`, `MOTION_COMPLETE_REQUIRED` |
| Runtime faults | `INITIAL_TOOL_POSITION_INVALID`, `TOOL_RETRACT_UNCONFIRMED`, `INDEX_WITH_TOOL_DOWN`, `SAW_STROKE_WITH_TOOL_OFF`, `SPOT_PLUNGE_WITH_TOOL_OFF`, `TRAVERSE_WITH_SPOT_DOWN`, `ANGLE_CHANGE_WITH_SAW_DOWN`, `DATUM_CAPTURE_WITH_TOOL_DOWN`, `POSITION_INVALID`, `MOTION_MODEL_OVERFLOW`, `COMPLETE_WITH_TOOL_ACTIVE`, `COMPLETE_WITHOUT_WORK` |
| Evidence request | `MACHINE_EVIDENCE_REQUEST_REQUIRED`, exact shape errors prefixed `MACHINE_EVIDENCE`, `MACHINE_EVIDENCE_FIELD_REQUIRED:<key>`, `VIRTUAL_EVIDENCE_NOT_COMPLETE:<reason>`; packet/configuration/lowering reasons pass through |

Indexed reasons carry the zero-based input index and, where applicable, the offending key. Direct motion generation throws with the reasons and emits no record; the service accepts packets only and translates unexpected failures into HTTP errors. Physical admission always produces `BLOCKED`, zero commands and declared blockers; absent/invalid blocker lists use `PHYSICAL_AUTHORITY_NOT_REGISTERED`.

# 18. Corrections made on load

Specification 0.2 was loaded into this repository on 2026-10-08. It described the predecessor Store, so each statement was checked against the code and data adopted here, and the following were corrected. Behavior is unchanged except where a row says a path was removed or refused; `acceptance/differential` is the evidence that everything else answers exactly as before.

| # | What 0.2 said | What is true here, and where |
|---|---|---|
| 1 | Store code lived in ten modules: one combined Store-state module plus engine, envelope and evaluator folders; tests in engine and evaluator folders; price sheets and observations beside the catalog. | Fourteen modules under `src/evaluation/` (catalog, Store state, envelopes, engine, evaluators) and `src/requests/` (request layer, offering lookup); tests in `tests/` and `acceptance/`; source sheets and observations in `data/sources/`. Every trace was remapped. Appendix C. |
| 2 | `BOARD_SQUARE_V1` was a public request type: a count-only compatibility ticket returning a partial estimate. | Not accepted: refused with `REQUEST_TYPE_NOT_ACCEPTED`. A count of cuts is not a clean definition. §3.2, B.6. |
| 3 | The pricing engine carried count-only and project wrappers (`estimateJob` without travel demand, `estimateBoardSequence`, `estimatePineAlcove`, `estimateCut001`, picnic-leg wrappers), the SKU-line `evaluateJob`, `resolveBoardMaterial`, `pineAlcoveEvaluation`, and convenience exports (`sfm`, `feedFpm`, `sawCycleMin`, `indexMin`, `spotCycleMin`). | Removed; none was reached by a clean definition. The pricing module keeps the model identities and complete user-defined-board Q. §6.3, §6A.4. |
| 4 | Each of four evaluators issued its own receipt through its own request wrapper; a missing request id was answered in three different shapes. | One request layer issues every receipt; a request that is not evaluated has one shape with `reasonCodes`; receipts also name the request type. §2.2, §6A.13. |
| 5 | The Store revision came from the request, then an environment variable, then the demand, then `LOCAL_UNPINNED_STORE_REVISION`. | This Store's release is supplied by whoever runs it and is required; a request cannot set it, and `storeRevision`/`evaluatedAt` are refused as request fields. §2.1, §3.3. |
| 6 | The Alcove evaluator mapped `ALCOVE-PINS-AND-SCREWS` to a SKU through a table in code, and accepted a project-supplied `hardwareDemand.storeSku` (“legacy explicit SKU”). | The catalog row declares `satisfiesRequirementIds`; a project naming a Store SKU was refused. In 0.7 the request type itself is retired and the kit is a functional-requirement item line. §6A.5, §19. |
| 7 | Stock and price answers carried the date `2026-09-10` written into code. | They carry the clock of the catalog they were read from. §6A.1. |
| 8 | The catalog carried a hand-maintained `skuCount` and was read without validation. | No count; validated whenever it is read, and never evaluated when invalid; stored one field per line so an added offering is a readable change. Adding an offering needs no code change. §5.3. |
| 9 | Offering search was System adapter code over Store rows. | Store code: `src/requests/offering-lookup.mjs`, same search rules. §6A.11. |
| 10 | System's Outdoor admission did not require each package's material and parts (§11.4 and an Open-work row). | Stale: System's Outdoor profile 0.4 requires both in both scopes. Corrected; row removed. §11.4. |
| 11 | The issued patents were not in Store (§13.1 and an Open-work row). | They are at `docs/patents/`. Corrected; row removed. §13.1. |
| 12 | The 3/16-in, 118° spot point is ≈ 0.056333 in and the plunge ≈ 0.243833 in. | 0.056331 in and 0.243831 in, as the Project 1 review states; the test literal was corrected to match. §6A.3. |
| 13 | §16 defined Store terms, pointing to the Store's own `DEFINITIONS.md`. | Store keeps no definitions; System owns them. §16 names the terms System must carry; Open work records System's §8 gap. |
| 14 | The treated-lumber Q $11.08 appeared beside the Project 1 Q $11.09 without saying why they differ. | They are different specimens (16-in parts at 30° vs 18-in parts at 26.387799961243°), both kept and both asserted. §6A.12 A, §12. |
| 15 | An Absorption table, a Change record from draft 0.1, and a Self-audit described how the document was assembled from earlier Store documents. | Removed as history. Absorbed documents are cited by name only; §1 says so. |
| 16 | The section numbering skips 14. | Kept, so that every existing section reference stays valid. |

Not re-verified on load, and carried as written in 0.2: the claim-to-function matrix wording and statuses beyond the code paths in rows 1 and 3 (§13); the safety section and its regulatory citations (§9); and the physical-target, lowering and commissioning text (§§7, 8, 10, 15), which describe work that is specified, not built.

# 19. Deliberate changes approved by the owner

The recorded Store answers (`acceptance/differential`) are never edited. A deliberate change to an answer is approved by the owner, named in `acceptance/differential/approved-changes.json` with its reason and the records it affects, and checked by `acceptance/differential/differential.test.mjs`.

| Change | Approved | What changed and why | Evidence |
|---|---|---|---|
| `RIP-AT-FINISHED-WIDTH` (rule `STB-CUT-PACKAGE-RIP-0.1`) | 2026-10-08 | When a board must be brought to a finished width and more than the router's 1-in cut width comes off, the router cuts through at the finished width and the far strip is returned to the owner as an offcut, instead of the line being refused with `EDGE_MILL_REMOVAL_EXCEEDS_D001_MAX_CUT_WIDTH`. Boards are brought to width before any part is cut. Common sense: the operation exists, and refusing it hid a feasible layout from the user (§6A.5 step 9). | One recorded cut-package answer changes; only lines whose refusal included that code differ, and they are now `SUPPORTABLE` rips. |
| `ALCOVE-THROUGH-CUT-PACKAGES` | 2026-10-08 | `ALCOVE_INSERT_V1` and its evaluator are retired; an alcove is sent as cut packages and runs in the sequence the shared model decides, with no project-specific logic. The retired model packed boards to full length and ignored the 24-in two-roller control while cutting, so it underpriced: pine $382.55 then, $429.16 now for the same layout. The shelf layout is the user's choice (§11.2). | 44 recorded Alcove answers retired, not replayed; `alcove-insert.mjs` absent; no project or tile names anywhere under `src/`. |
| `NO-BOARD-LENGTH-CEILING` | 2026-10-09 | A board-length ceiling with no basis in the machine is removed. Every board length the Store offers is a board the cell takes, under the same rules on every path. | No selected board, status or Q changes. Envelope checks lose the reason, and user-defined board answers list the longer boards they passed over differently; the differential test proves nothing else moved. |
| `GRADE-IS-THE-CUSTOMERS` | 2026-10-09 | A user-defined board names its grade. When the wood is offered in more than one and none is named, Store asks (`GRADE_CHOICE_REQUIRED`, with the grades on offer) instead of choosing by length. The grade is the customer's choice, never the yard's. | 93 recorded answers that named no grade now ask for one; sent again with the grade the recording priced, every supportable one gives the same board, estimate and Q. Project 1 with `above-ground` gives the review's whole answer. |
| `NO-SILENT-DEFINITION-DEFAULTS` | 2026-10-09 | A missing manufacturing fact is never filled in. Before this, a missing or null miter angle priced as 0°, a missing end cut as a square cut, a missing Datum-C method as `REFERENCE_CUT`, a missing operation list as `MITER_LIMITED`, a missing cut plane as `miter-face`, and `returnAllPieces` was not read. Each now answers with its reason (§6A.1 step 2, §6A.5 step 3, §6A.10 step 3), and declared operations must agree with the parts. | 5 recorded cut-package answers sent no end-cut angle; each such package is now `UNRESOLVED / END_CUT_ANGLE_REQUIRED`, and with 0° stated the answer is the recorded one (result hash included). 6 recorded user-defined board answers were already `UNRESOLVED` and now name the missing fact. No published example, Project 1, $8.54 or alcove answer changes. |
| `END-GEOMETRY-IS-STATED` | 2026-10-09 | A user-defined board states its end relation and length datum, and the price is only for geometry the travel model covers: parallel ends, long-long outer edge. Before this, the definition could not carry them and Store priced every board as parallel without saying so. A packet's machine requirements must equal what the definition states. | Every recorded user-defined board answer named no geometry: without it each is now asked for its end relation; with parallel / long-long stated, each is the recorded answer, every field and both calculation hashes. Project 1 with its geometry and grade stated still gives the review's whole answer. |

### 0.10 — definition completeness, service identity and closure

No missing manufacturing fact is filled in (§6A.1, §6A.5, §6A.10); boards state grade and end geometry and are priced only on geometry the model covers; unmodeled Datum-C methods are asked about; an edited answer is refused as altered; one rule decides a stated number. Each change to a recorded answer is named in §19 and proved by the differential test. The service proves the code it runs, and `scripts/verify-deployment.mjs` is the hosted verification procedure (§6A.14). Section 17 is grouped by who closes each row.

### 0.9 — runtime machine validation and evidence interface

Completed the runtime gaps described in §10.6: missing required board semantics and blank identities/date values are refused; unsupported semantics cannot produce the original commands; configuration contents are validated and bound; local jobs and full virtual sequences are validated before use; completion requires actual modeled work and safe final tool states. Added the bounded virtual-evidence endpoint and its HTTP acceptance checks. The service remains independent; no live System pin, deployment, README, price rule, catalog row or published evidence was changed. Structural tests now permit only the service to call the single downstream evidence entry point; evaluation/request/contracts still cannot import the machine side. The owner directs authorized changes to remain on main, with fast-forward publication after checks.
