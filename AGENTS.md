# Store Zero — engineering rules for agents and maintainers

Store Zero evaluates identified neutral manufacturing definitions against its own catalog, available stock, declared machine capability, occupied-time model and economics. It returns a complete budgetary Q with attributable evidence, or a specific refusal. The public five-project app is in [System](https://github.com/GeorgePlattDemo/new-system); research and supervised laboratory questions belong to Program.

## Objective and method

*Authority category: Current System Behavior*

1. **Repair the underlying implementation, preserving the intended objective.** Reproduce the actual defect, locate the one responsible evaluator/request/contract, correct its cause and prove that the complete job and unfavorable cases still work. Never introduce a hidden fallback, test-only price, partial work claim or special project-shaped path for a green result.
2. **Leave no unnecessary replacement code behind.** Before introducing an implementation or test, find the existing owner. Retire its genuinely superseded path and duplicate assertions in the same verified change. Keep distinct invariants and original evidence. No parallel evaluator or second price/receipt authority.
3. **Use the protected PR procedure below.** Keep one owner-authorized temporary branch for this repository, preserve required checks and obtain owner review before merging. Cross-repository changes remain limited to the authorized task; runtime pin changes must be explicit and verified.
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

[README.md](README.md) is the public entrance. Preserve Store’s substantial manufacturing engineering and patent-related technical detail, attribution and evidence at their existing owner; do not condense or migrate them into Program or System. Do not merge the Store specification and master. Keep the following existing sources separate:

| Authority | Owns |
| --- | --- |
| [Store specification](docs/STORE-ZERO-SPECIFICATION.md) | Adopted Store admission, evaluation, registration and evidence contracts |
| [Store master](STORE-ZERO-MASTER.md) | Complete manufacturing and technical explanation, functional patent treatment and source context |
| [System definitions](https://github.com/GeorgePlattDemo/new-system/blob/main/docs/DEFINITIONS.md) | The sole authoritative shared manufacturing meanings; Store's executable contracts implement them |
| [Catalog](data/store-zero-catalog.json) and [registered machine](data/machine/manufacturing-core-0.1.json) | Store material/stock facts and declared machine parameters; their executable owners are mapped above |
| [Current and sealed Project 1 evidence](docs/project-1-digital-trail/README.md) | Maintained proof and separately preserved original publications; regenerate current outputs through [the existing generator](scripts/build-contract-examples.mjs) |
| [Issued patent custody](docs/patents/README.md) | Original patent documents, attribution and checksum identities |

When prose and executable code disagree, fix the contradiction at its actual owner and revise the affected tests and references; never choose whichever description is convenient. Program's current [maintenance and ownership instructions](https://github.com/GeorgePlattDemo/3d-solutions-program/blob/main/AGENTS.md) and [supervised trial](https://github.com/GeorgePlattDemo/3d-solutions-program/blob/main/SUPERVISED-LABORATORY-CELL-TRIAL.md) own research and physical validation, rather than Store's detailed engineering.

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

Documentation is maintained engineering authority. Amend affected sections in their existing locations, preserving technical depth, rationale, complete examples and useful cross-references. Update current generated evidence through its generator; retain sealed original bytes. Do not freeze the current proof to preserve old numbers. Link live guidance to its current owner and immutable evidence to its exact revision. Check file and heading destinations whenever editing linked material. Root READMEs preserve their established public argument, technical meaning and tone. Make only owner-authorized, necessary navigation or verified current-state corrections; inspect the complete before/after diff. Existing checks retain exact approved README identities. Update an identity only alongside the specifically authorized, reviewed README change, never merely to obtain a pass. README authorization does not authorize a runtime repin. Preserve historical publication and patent identities independently.

Implementation proceeds only after the affected normative documentation and acceptance obligations are coherent. A change is complete when required checks pass for its exact revisions, all affected operative documents and evidence agree, and deployment identity has been verified where deployment is in scope. The System master's single conformance register identifies open cross-repository obligations and the evidence needed to close each one. Local masters describe their owning details rather than maintaining competing status lists.

## Bounded maintenance procedure

*Authority category: Adopted engineering requirements*

1. Record the authorized outcome, baseline SHA, governing requirement and owning request/contract/evaluator/configuration source from the map above before editing. Reproduce the actual defect and an unfavorable case; for documentary work identify the exact incorrect instruction or reference. Preserve System's customer geometry and independent demand rather than inventing a Store interpretation.
2. Trace callers and consumers before replacing or removing code: admission, shapes, catalog, manufacturing core, registration, receipts, packet verification, lowering, service, System transport and current/historical evidence. Record the old responsibility, surviving owner and checks proving required work remains. Retain uncertain candidates; retire proven superseded paths in the same verified change without adding a parallel evaluator or receipt authority.
3. Put a bounded impact account in the PR linking requirement, source, downstream contracts, registration/catalog when affected, specification/master, maintained Project 1 proof and tests. Reconcile affected System and Program obligations only within authorized scope; explain unaffected items and identify unfinished external dependencies. Use System's existing conformance register for cross-owner closure.
4. Repair the root cause without changing physical meaning, omitting demand, relaxing limits or manufacturing a supportable result. Preserve stock, event/time/Q, search bounds, receipt and refusal fidelity. Do not use hardcoded prices, fixture responses, whole-answer caches, project-specific exceptions or undocumented workarounds. Never weaken, skip or delete tests to pass; a demonstrably wrong expectation needs governing source evidence and explanation, with independent unfavorable coverage retained.
5. Update affected governing sections in place and regenerate maintained examples, source inventory, ledgers and Project 1 proof through the existing generator. Preserve complete specimens and sealed publications, patent bytes, historical answers and checksum identities. A current proof must follow consequential source/model changes; do not hand-edit results or replace historical evidence with current output.
6. Run `npm run check:catalog`, `npm test` and `node scripts/benchmark-evaluation.mjs` on Node 22 and require the exact PR's acceptance workflow. Record full source/dependency SHAs, source digest, test outcomes, benchmark results and links. An authorized behavior change also requires affected System acceptance against the exact Store revision. A Store main commit does not move System's pin; an authorized rollout separately verifies actual runtime/source identity, fresh receipts and rollback. Keep physical admission blocked.

## Protected integration and branch hygiene

*Authority category: Adopted engineering requirements*

1. Start from verified current `main` and record its full SHA. Inspect local changes and concurrent work before editing; preserve work outside the authorized scope. Use exactly one necessary temporary PR branch in each affected repository for the authorized task. Reuse its safe existing task branch; do not create speculative, redundant or parallel branches, branch-creating worktrees or renamed branches to evade this limit.
2. Keep all task changes in one bounded PR per affected repository. Inspect its complete diff, changed-file list and README comparison before publishing. Do not force-push, rewrite history or repositories, bypass protections, weaken required checks, or treat a tool limitation as authority to do so.
3. Run the repository verification commands above and all required PR checks against the exact proposed source and dependency revisions. Record full SHAs and check URLs. A green result from an earlier head is not verification of a later change; reconcile and reverify changed source, dependencies or merge-base consequences.
4. Obtain the owner's review and explicit merge authorization for the exact reviewed change. Permission to implement or open a PR is not permission to merge. Preserve GitHub's required checks and approvals; when the task ends at review, submit the PR and stop. A blocked approval or integration is reported precisely while other independent authorized work continues.
5. After an authorized merge, verify the resulting `main`, checks and content before deleting that task's local and remote branch. For prior merged, abandoned or stray branches, establish their heads, provenance and disposition of every distinct change first; a squash requires content comparison rather than ancestry alone. Delete them only within owner-authorized cleanup after integration or preserved historical custody is established. Retain and report unresolved work instead of discarding it. Report the final branch list and any deletion blocked by access.

## Completion evidence

*Authority category: Adopted engineering requirements*

Report the objective, actual changed and removed files, full source/dependency revisions, exact successful and failed checks with links, reconciled documents/proof, retained historical evidence, branch disposition and unresolved conditions. Label work separately as prepared, committed, verified, submitted for review, merged and deployed. A pending PR is not integrated work; a merge is not a deployment; passing software tests do not establish commissioned capability or inspected output. Write **NOT VERIFIED** for any condition without evidence. Stop at the owner's requested review gate; do not advance to later tasks or deployment without authorization.
