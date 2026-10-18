# Scan-to-Build Store

**Sell the wood. Supply the work that makes it useful.**

<a href="https://system-candidate-production.up.railway.app/"><kbd>▶ OPEN THE APP</kbd></a>

3D Solutions LLC · Greensboro, North Carolina

## What Store Zero is

Store Zero is a declared reference lumberyard. It is not a real dealer and it is not a mock-up. It is a complete, pinned answering surface, built so that a request has something specific to be answered by.

It carries a catalog of SKUs with unit prices and a catalog clock. It carries declared on-hand quantities, which are stated figures and not physical counts. It carries a declared machine envelope for dimensional cell D-001 and sheet cell S-001, a declared list of the secondary operations it will and will not perform, declared economics covering mark-on, cell recovery and the cycle model, and a named owner and cell steward whose resolution authority is declared per condition class.

It is also the controlled research surface for asking what the yard can do now and whether any missing capability is worth adding.

Every answer it returns carries its basis and its pins: which catalog clock, which engine version, which commit. That is what makes receipt of an order auditable rather than merely plausible. Send the same request twice against the same pins and the same number comes back. Send it after something moved and a different number comes back, and the record will say what moved, when, and who declared it.

Store Zero holds no commercial authority, no live inventory, no payment, and no production release.

The complete technical reference is [STORE-ZERO-MASTER.md](STORE-ZERO-MASTER.md), which ties the Store definition, machine references, economics, authority, unresolved conditions, research questions and implementation sources together.

Two things in this repository are established rather than declared: the issued patents behind the architecture — *Method and System for Consumer Home Projects Ordering and Fabrication*, [US 9,720,401 B2](docs/patents/US9720401B2.pdf) (2017) and [US 10,768,609 B2](docs/patents/US10768609B2.pdf) (2020) — preserved in [docs/patents/](docs/patents/) with [SHA-256 identities](docs/patents/SHA256SUMS.txt); and the [complete 33-claim engineering correspondence](STORE-ZERO-MASTER.md#2-invention-and-issued-patents) connecting customer-facing software, Store evaluation, manufacturing equipment, and remaining physical evidence. The architecture is defined and mapped; its implementation and validation are the work underway.

## What the yard answers

Scan-to-Build Store makes the yard's side of the exchange explicit: **which material, which operations, how much modeled work, and what price?**

System carries the customer's defined requirements. Store evaluates them against its own catalog, declared stock, equipment capability, timing, and economics. The answer tells the customer what this yard can provide and gives the yard an identified job to work from. A supported definition becomes a manufacturing plan; one that doesn't fit is refused or marked unresolved, with the reason.

Every request receives a bounded outcome with its reasons:

- **`SUPPORTABLE`** — the declared material and capability can support the request.
- **`UNRESOLVED`** — a required fact is missing.
- **`REFUSED`** — the request falls outside the declared capability.
- **`UNAVAILABLE`** — the required supply is unavailable under the declared facts.

The yard keeps control of its own service. Another Store can use different suppliers, stock, equipment, pricing, and operating systems through the same bounded request-and-answer interface. The [Store membrane](STORE-ZERO-MASTER.md#3-the-complete-system-to-store-boundary) explains how outside demand calls selected services while the dealer retains its internal systems.

**The software prototype is operational.** The [working application](https://system-candidate-production.up.railway.app/) demonstrates the complete digital path: customer definition, independent manifest, fresh Store evaluation, selected material, ordered manufacturing operations, calculated time and Q, simulated acceptance, verified job packet, registered lowering, and virtual replay. The customer's requirements reach the evaluated manufacturing plan without being redrawn, re-entered, or programmed as a separate CAD/CAM job.

The [current Project 1 manufacturing proof](PROJECT-1-CURRENT-DIGITAL-MANUFACTURING-PROOF.md) demonstrates the consequences: a 16-inch SPF job resolves at **$8.62**, an 18-inch variation at **$9.13**, and an 18-inch variation with independently selected spot positions and depths at **$9.16**. Material selection, operation timing, and Q change together.

| Project 1 reference case | 16-in SPF | 18-in SPF | 18-in SPF, varied spots |
| --- | ---: | ---: | ---: |
| Selected parent | 60 in | 72 in | 72 in |
| Material cost | $2.61 | $3.13 | $3.13 |
| Occupied seconds | 86.52 | 86.47 | 86.84 |
| Machine service | $6.01 | $6.00 | $6.03 |
| **Whole-job Q** | **$8.62** | **$9.13** | **$9.16** |
| Operation records | 51 | 51 | 51 |
| Modeled moves | 22 | 22 | 22 |

**The next engineering frontier is physical execution:** controller-specific machine adapters, registered physical datums and tooling, verified material control, commissioned motion, and inspected components. The digital manufacturing chain is demonstrated. The machinery must now reproduce its results in wood.

## Two material classes, useful work

Store Zero's evaluators run today against declared material and capability facts.

| Class                   | Work represented here                                                                                                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dimensional — D-001** | Cut to length, bounded miters, declared milling profiles, and identified-location shallow spotting with a 3/16-in pointed drill. Current nominal full-diameter penetration is 3/16 in beyond the tip, also its maximum; no general pilot/through-hole or flat-bottom spotface is claimed. |
| **Sheet — S-001**       | A single ½-inch cutter for bounded routed patterns, customer-positioned 1-inch retention tabs, center splits, and yard panel-saw crosscuts **and full-length rips** at $10 per manual full cut with declared ±¼-inch location tolerance.                                                  |

The [D-001 envelope](STORE-ZERO-MASTER.md#62-dimensional-parameter-register) and [S-001 envelope](STORE-ZERO-MASTER.md#63-sheet-parameter-register) give the exact accepted operations and geometry. The sheet plan keeps the routed center pieces attached by planned tabs for later separation. Cut, mill, and drill are operations with material, geometry, tooling, and time behind them.

## Three connected homes

| Repository                                                             | Contribution                                                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [**Program**](https://github.com/GeorgePlattDemo/3d-solutions-program) | Why a small local manufacturing service might be worth pursuing, and how to test its engineering and business case. |
| [**System**](https://github.com/GeorgePlattDemo/new-system)            | The customer's project definition, application, shared job meaning, and consequential records.                      |
| **Store**                                                              | Its material, capability, modeled work, economics, and answers for that definition.                                 |

The replacement application consumes the exact Store version recorded in System's [`STORE_CANDIDATE`](https://github.com/GeorgePlattDemo/new-system/blob/main/src/system/store-candidate.ts). Publishing a Store document does not move that runtime version.

## Explore the implementation

| Surface                                                                                                                                                             | What to inspect                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Catalog](data/store-zero-catalog.json)                                                                                                                     | Offerings, item identities, declared stock, and material prices.                                                                                                                                                           |
| [Pricing engine](src/evaluation/engine/store-manufacturing-core.mjs)                                                                                        | Material and modeled machine-work economics.                                                                                                                                                                               |
| [Dimensional travel standard](src/evaluation/engine/store-manufacturing-core.mjs)                                                                           | Fit, travel, modeled work, and the dimensional completion calculation.                                                                                                                                                     |
| [Cut-package evaluator](src/evaluation/engine/store-manufacturing-core.mjs)                                                                                 | Multi-part dimensional requests, an alcove among them.                                                                                                                                                                     |
| [Sheet-package evaluator](src/evaluation/engine/store-manufacturing-core.mjs)                                                                               | Routed sheet work, tabs, and supported panel cuts.                                                                                                                                                                         |
| [D-001 declarations](src/evaluation/engine/store-manufacturing-core.mjs) · [S-001 declarations](src/evaluation/engine/store-manufacturing-core.mjs) | Machine-readable capability facts.                                                                                                                                                                                         |
| [Adopted shared manufacturing engine](src/evaluation/engine/store-manufacturing-core.mjs)                                                                   | Store-owned engine for neutral-job SKU selection, handling, modeled machine time and Q; active under protocol 2.                                                                                                           |
| [Commercial event contract](src/contracts/commercial-sequence.js)                                                                                           | Executable prerequisites, events, evidence identities and custody; the [System-owned design map](https://github.com/GeorgePlattDemo/new-system/blob/main/docs/commercial-sequence-template.md) retains its source context. |

The active request path is [the Store request layer](src/requests/store-request.mjs), which compiles admitted neutral definitions into [the single manufacturing core](src/evaluation/engine/store-manufacturing-core.mjs). Its catalog, operation sequence, modeled time and Q are Store-owned. Commercial events have their own [executable gate](src/contracts/commercial-sequence.js), separate from evaluation; System owns the definition and shared workflow meaning.

Code is in [`src/`](src/), catalog and price sheets in [`data/`](data/), and checks in [`tests/`](tests/) and [`acceptance/`](acceptance/). [`docs/`](docs/) holds the [Store Zero specification](docs/STORE-ZERO-SPECIFICATION.md), the Project 1 trail, and the [issued patents](docs/patents/).

Run the repository tests on Node 22:

```sh
npm run check:catalog
npm run build:examples
npm test
node scripts/benchmark-evaluation.mjs
```

## Reference status and further reading

Store Zero uses declared reference stock, budgetary prices, and modeled machine time. Physical D-001/S-001 production is not commissioned; the demonstration does not transact real payment or issue a production release. The [commissioning and evidence plan](STORE-ZERO-MASTER.md#68-proposed-physical-apparatus-and-commissioning) separates the software/reference work from physical commissioning.

The [Project 1 current digital manufacturing proof](PROJECT-1-CURRENT-DIGITAL-MANUFACTURING-PROOF.md) exercises this Store through the full path — definition, fresh evaluation, acceptance, exact packet export, registered lowering and virtual replay. It establishes a digital manufacturing path with predicted occupancy; commissioned controller execution and inspected components require separate evidence.

- [**Store Zero**](STORE-ZERO-MASTER.md) — the reference dealer and its service interface.
- [**Store Job 001**](STORE-ZERO-MASTER.md#7-complete-project-1-walkthrough) — a modeled Store-side production narrative.
- [**Store 1**](STORE-ZERO-MASTER.md#4-store-owned-catalog-and-inventory) — the surface for a later real Store implementation.
- [**System definitions**](https://github.com/GeorgePlattDemo/new-system/blob/main/docs/DEFINITIONS.md) — shared job meaning and local yard vocabulary, owned by the System the working application runs.
- [**Candidate machine engineering**](https://github.com/GeorgePlattDemo/3d-solutions-program/blob/main/SUPERVISED-LABORATORY-CELL-TRIAL.md#build-and-verify-the-dimensional-machine) — the broader development work in Program.

**NO BLOOD ON WOOD.**

<sub>Publication grants no patent license. Maintainers: [AGENTS.md](AGENTS.md).</sub>