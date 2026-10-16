# Store Zero — engineering rules for agents and maintainers

Store Zero evaluates identified neutral manufacturing definitions against its own catalog, available stock, declared machine capability, occupied-time model and economics. It returns a complete budgetary Q with attributable evidence, or a specific refusal. The public five-project app is in [System](https://github.com/GeorgePlattDemo/new-system); research and supervised laboratory questions belong to Program.

## Objective and method

1. **Repair the underlying implementation, preserving the intended objective.** Reproduce the actual defect, locate the one responsible evaluator/request/contract, correct its cause and prove that the complete job and unfavorable cases still work. Never introduce a hidden fallback, test-only price, partial work claim or special project-shaped path for a green result.
2. **Leave no unnecessary replacement code behind.** Before introducing an implementation or test, find the existing owner. Retire its genuinely superseded path and duplicate assertions in the same verified change. Keep distinct invariants and original evidence. No parallel evaluator or second price/receipt authority.
3. Work on **`main` only**, with fast-forward, truthful incremental commits. No task branches, force pushes, new repositories, silent pin changes or changes in other repos without explicit authorization.
4. Record the objective, changed executable behavior, deleted artifacts, before/after measurement and test evidence. An unexplained change to selected stock, machine events, inventory or Q is a defect, not an optimization.

## Source-of-truth map

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

`README.md` is the public entrance; `STORE-ZERO-MASTER.md` contains the complete explanation; `docs/STORE-ZERO-SPECIFICATION.md` states adopted technical contracts. Shared job vocabulary is governed by System's `docs/DEFINITIONS.md`. When prose and executable code disagree, fix the contradiction at its actual owner and revise the affected tests and references; never choose whichever description is convenient.

## Current integrated proof

Project 1 is a living end-to-end acceptance proof. Every consequential implementation change reconciles the operative specification, both technical masters, shared definitions, affected Program documents and current proof. Run `npm run build:examples`; current JSON/Markdown evidence must exactly match current executable source and catalog. System must repin the inspected Store and pass actual published-browser acceptance, packet export, lowering and virtual replay. Original sealed source evidence remains immutable provenance and cannot substitute for current proof. Operative prose describes current behavior in present tense; repair chronology belongs in Git and verification logs.

## Unbreakable boundaries

- One Store request layer, one catalog, one manufacturing planner, one Q and occupied-time ledger, one receipt authority and one machine-evidence route. The service is a transport; evaluators do not issue receipts, contact the network, read a clock or inspect the environment. `acceptance/boundaries/boundaries.test.mjs` enforces these boundaries.
- System defines the customer job. Store evaluates neutral parts, stock and tools; **never import System, a project name, a tile-specific surrogate or legacy Store code** into runtime evaluation. Missing material/grade/geometry/operation facts remain missing; no selected requirement can disappear.
- Every job request carries an independent manifest. Exact part, sheet, feature and sourced-item coverage must reconcile. If a declared operation, required tool or physical condition cannot be evaluated, report the proper refusal/UNRESOLVED result; do not attach complete Q to an incomplete plan.
- Search considers declared stock and inventory cumulatively and reports its actual search-completion status. Never claim a global optimum beyond the declared search space. Performance optimization must preserve the modeled event sequence, Q, stock selection, search bounds, refusal and manifest coverage. A cycle cache must be evaluation-local, keyed by all relevant machine state; never cache an entire customer answer.
- Catalog/offering changes belong in `data/` and pass `npm run check:catalog`. Changes to definition shapes, examples and machine configuration are explicit contract/model revisions with matching tests. Never relax a shape or insert a catalog row solely to make a test pass.
- Source and contract hash identities trace versions but do not prove physical readiness or actor identity. Payment, reservation, allocation, release, actual machine work, inspection and handoff remain separately recorded. **Physical admission and release are BLOCKED** without commissioned evidence.
- Do not modify issued patents, sealed Project 1 files, their identity manifests, recorded historical answers or replay fixtures to satisfy a current test. Preserve original claims, original revision identities and Git history. **NO BLOOD ON WOOD.**

## Verification and publishing

Run `npm run check:catalog`, `npm test` and `node scripts/benchmark-evaluation.mjs` on Node 22; the existing `.github/workflows/acceptance.yml` runs all three. For a source cleanup, demonstrate consumers are absent and surviving boundaries/tests remain representative; deleting an old test is warranted only when its implementation is also retired or the invariant is independently covered. A performance improvement needs measured before/after data and identical manufacturing facts.

System owns the pinned Store SHA in `src/system/store-candidate.ts`, its published runtime config, its CI checkout and `startup.sh`. Updating this Store's `main` does **not** repin deployed System. Changing that pin requires a separately verified System change. Keep both deployed services independent; no predecessor service or local simulation may replace Store's real response.
