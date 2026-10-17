# Store Zero — engineering rules for agents and maintainers

Store Zero evaluates identified neutral manufacturing definitions against its own catalog, available stock, declared machine capability, occupied-time model and economics. It returns a complete budgetary Q with attributable evidence, or a specific refusal. The public five-project app is in [System](https://github.com/GeorgePlattDemo/new-system); research and supervised laboratory questions belong to Program.

## Objective and method

*Authority category: Current System Behavior*

1. **Repair the underlying implementation, preserving the intended objective.** Reproduce the actual defect, locate the one responsible evaluator/request/contract, correct its cause and prove that the complete job and unfavorable cases still work. Never introduce a hidden fallback, test-only price, partial work claim or special project-shaped path for a green result.
2. **Leave no unnecessary replacement code behind.** Before introducing an implementation or test, find the existing owner. Retire its genuinely superseded path and duplicate assertions in the same verified change. Keep distinct invariants and original evidence. No parallel evaluator or second price/receipt authority.
3. **`main` is the only permitted working branch.** Do not create additional local or remote branches, including task, review, feature, repair or documentation branches. Do not create a branch-creating worktree, rename a branch to evade the rule, or change these instructions to accommodate a tool. If an authorized change cannot proceed on `main`, stop and report the exact blocker. Preserve the prepared work and wait for the conflicting condition to be resolved. Do not force-push, bypass protection or rewrite a repository as a workaround. Cross-repository changes remain limited to the authorized task; runtime pin changes must be explicit and verified.
4. Record the objective, changed executable behavior, deleted artifacts, before/after measurement and test evidence. An unexplained change to selected stock, machine events, inventory or Q is a defect, not an optimization.

## Source-of-truth map

*Authority category: Current System Behavior*

| Function | Authoritative executable source |
| --- | --- |
| Service transport, request routing and health | `src/service/server.mjs` |
| Job admission, independent manifest, receipt and Store release | `src/requests/store-request.mjs` |
| Offering discovery and commercial-event requests | `src/requests/offering-lookup.mjs`, `src/requests/commercial-request.mjs` |
| One complete stock planner, modeled machine work and Q | `src/evaluation/engine/store-manufacturing-core.mjs` |
| Catalog interpretation and price basis | `src/evaluation/catalog.mjs`, `data/store-zero-catalog.json`, `data/sources/` |
| Declared machine configuration and accepted packet lowering | `data/machine/`, `src/machine/configuration.mjs`, `lowering.mjs`, `evidence.mjs`, `virtual-run.mjs` |
| Definition, packet, machine and commercial data contracts | `src/contracts/`; published fixture exchanges in `contracts/examples/` |
| Structural and document authority checks | `acceptance/boundaries/`, `acceptance/contracts/` |
| Catalog and manufacturing invariants | `acceptance/catalog/`, `tests/manufacturing-core.test.mjs`, `tests/core-self-checks.mjs` |
| Protocol, service, commercial and runtime verification | `tests/protocol2.test.mjs`, `tests/service.test.mjs`, `tests/commercial-sequence.test.mjs` |
| Historical replay and independently preserved source evidence | `acceptance/differential/`, `acceptance/project-1/`, `docs/project-1-digital-trail/`, `docs/patents/` |
| Fresh performance measurement | `scripts/benchmark-evaluation.mjs` |
| Deployment verification | `scripts/verify-deployment.mjs`, `Dockerfile`, `railway.json`, `.github/workflows/acceptance.yml` |

[README.md](README.md) is the public entrance. Keep the following existing sources separate:

| Authority | Owns |
| --- | --- |
| [Store specification](docs/STORE-ZERO-SPECIFICATION.md) | Adopted Store admission, evaluation, registration and evidence contracts |
| [Store master](STORE-ZERO-MASTER.md) | Complete manufacturing and technical explanation, functional patent treatment and source context |
| [System definitions](https://github.com/GeorgePlattDemo/new-system/blob/main/docs/DEFINITIONS.md) | The sole authoritative shared manufacturing meanings; Store's executable contracts implement them |
| [Catalog](data/store-zero-catalog.json) and [registered machine](data/machine/manufacturing-core-0.1.json) | Store material/stock facts and declared machine parameters; their executable owners are mapped above |
| [Current and sealed Project 1 evidence](docs/project-1-digital-trail/README.md) | Maintained proof and separately preserved original publications; regenerate current outputs through [the existing generator](scripts/build-contract-examples.mjs) |
| [Issued patent custody](docs/patents/README.md) | Original patent documents, attribution and checksum identities |

When prose and executable code disagree, fix the contradiction at its actual owner and revise the affected tests and references; never choose whichever description is convenient. Program's current [maintenance and ownership instructions](https://github.com/GeorgePlattDemo/3d-solutions-program/blob/main/AGENTS.md) and [supervised trial](https://github.com/GeorgePlattDemo/3d-solutions-program/blob/main/SUPERVISED-LABORATORY-CELL-TRIAL.md) own research and physical validation, rather than Store's detailed engineering.

## Current integrated proof

*Authority category: Current System Behavior*

The adopted definitions and specifications govern required behavior. Executable source, identified configuration and verified outputs establish what a particular revision actually implements. A disagreement is a conformance defect: preserve the requirement, identify the affected owner and evidence, and repair the implementation or obtain an explicit requirement decision. Neither a passing test nor existing code silently overrides the adopted contract. Documentation must distinguish adopted requirements, verified implementation, proposed capability and physical qualification.

The current Project 1 proof is maintained acceptance evidence, regenerated from the operative source and configuration when consequential behavior changes. Original sealed publications retain their source identities and historical results. Consequential changes must reconcile the affected definitions, specifications, masters, Program descriptions, current proof, tests, links and operational identities before completion. Preserve full technical content and distinguish modeled results, simulated commerce, commissioned execution and inspected output.

## Unbreakable boundaries

*Authority category: Current System Behavior*

- One Store request layer, one catalog, one manufacturing planner, one Q and occupied-time ledger, one receipt authority and one machine-evidence route. The service is a transport; evaluators do not issue receipts, contact the network, read a clock or inspect the environment. `acceptance/boundaries/boundaries.test.mjs` enforces these boundaries.
- System defines the customer job. Store evaluates neutral parts, stock and tools; **never import System, a project name, a tile-specific surrogate or legacy Store code** into runtime evaluation. Missing material/grade/geometry/operation facts remain missing; no selected requirement can disappear.
- Every job request carries an independent manifest. Exact part, sheet, feature and sourced-item coverage must reconcile. If a declared operation, required tool or physical condition cannot be evaluated, report the proper refusal/UNRESOLVED result; do not attach complete Q to an incomplete plan.
- Search considers declared stock and inventory cumulatively and reports its actual search-completion status. Never claim a global optimum beyond the declared search space. Performance optimization must preserve the modeled event sequence, Q, stock selection, search bounds, refusal and manifest coverage. A cycle cache must be evaluation-local, keyed by all relevant machine state; never cache an entire customer answer.
- Catalog/offering changes belong in `data/` and pass `npm run check:catalog`. Changes to definition shapes, examples and machine configuration are explicit contract/model revisions with matching tests. Never relax a shape or insert a catalog row solely to make a test pass.
- Source and contract hash identities trace versions but do not prove physical readiness or actor identity. Payment, reservation, allocation, release, actual machine work, inspection and handoff remain separately recorded. **Physical admission and release are BLOCKED** without commissioned evidence.
- Do not modify issued patents, sealed Project 1 files, their identity manifests, recorded historical answers or replay fixtures to satisfy a current test. Preserve original claims, original revision identities and Git history. **NO BLOOD ON WOOD.**

## Verification and publishing

*Authority category: Current System Behavior*

Run `npm run check:catalog`, `npm test` and `node scripts/benchmark-evaluation.mjs` on Node 22; the existing `.github/workflows/acceptance.yml` runs all three. For a source cleanup, demonstrate consumers are absent and surviving boundaries/tests remain representative; deleting an old test is warranted only when its implementation is also retired or the invariant is independently covered. A performance improvement needs measured before/after data and identical manufacturing facts.

System owns the pinned Store SHA in `src/system/store-candidate.ts`, its published runtime config, its CI checkout and `startup.sh`. Updating this Store's `main` does **not** repin deployed System. Changing that pin requires a separately verified System change. Keep both deployed services independent; no predecessor service or local simulation may replace Store's real response.

## Documentation authority and completion contract

*Authority category: Adopted engineering requirements*

Read the shared [manufacturing meaning contract](https://github.com/GeorgePlattDemo/new-system/blob/main/docs/DEFINITIONS.md#manufacturing-terminology-source-words-versus-physical-requirements), the affected owner's specification/master and the existing conformance register before changing behavior. Definitions govern common meaning; System master chapter 8 governs definition and handoff obligations; Store specification sections 1, 3 and 15 govern registration, evaluation and evidence; Program owns research and laboratory claims. A project name, a source word, existing code or a green test cannot override those responsibilities.

The adopted definitions and specifications govern required behavior. Executable source, identified configuration and verified outputs establish what a particular revision actually implements. A disagreement is a conformance defect: preserve the requirement, identify the affected owner and evidence, and repair the implementation or obtain an explicit requirement decision. Neither a passing test nor existing code silently overrides the adopted contract. Documentation must distinguish adopted requirements, verified implementation, proposed capability and physical qualification.

The current Project 1 proof is maintained acceptance evidence, regenerated from the operative source and configuration when consequential behavior changes. Original sealed publications retain their source identities and historical results. Consequential changes must reconcile the affected definitions, specifications, masters, Program descriptions, current proof, tests, links and operational identities before completion. Preserve full technical content and distinguish modeled results, simulated commerce, commissioned execution and inspected output.

For each bounded change, identify the requirement, owning executable path, failing behavior or missing evidence, affected readers and acceptance condition. Preserve component and feature identities, exact parameter constraints, unresolved requirements and attributable refusals. Do not infer a convenient feature from vocabulary, weaken an assertion, omit work, create a fallback answer, duplicate an evaluator or introduce a project-specific capability exception. If the contract itself must change, state the substantive reason and its consequences explicitly; obtain any necessary owner decision rather than silently redefining success.

Documentation is maintained engineering authority. Amend affected sections in their existing locations, preserving technical depth, rationale, complete examples and useful cross-references. Update current generated evidence through its generator; retain sealed original bytes. Do not freeze the current proof to preserve old numbers. Link live guidance to its current owner and immutable evidence to its exact revision. Check file and heading destinations whenever editing linked material. For the authorized documentation/conformance work, all three repository-root READMEs are frozen byte-for-byte; preserve their destinations and report a conflict rather than editing them.

Implementation proceeds only after the affected normative documentation and acceptance obligations are coherent. A change is complete when required checks pass for its exact revisions, all affected operative documents and evidence agree, and deployment identity has been verified where deployment is in scope. The System master's single conformance register identifies open cross-repository obligations and the evidence needed to close each one. Local masters describe their owning details rather than maintaining competing status lists.

Apply authorized, verified changes to `main` only. If repository settings require a pull request, another branch or unavailable approval, stop and report that exact conflict; do not create or use an additional working branch, bypass protection, weaken verification, or amend the single-branch rule. Preserve the prepared change and its evidence. A pending commit is not integrated work, and successful source checks do not establish deployment.
