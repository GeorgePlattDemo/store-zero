# Agent instructions — Store Zero

This repository is Store Zero: the catalog, capability, modeled work and time, economics, and answers for identified job definitions. The [specification](docs/STORE-ZERO-SPECIFICATION.md) states every rule; the code, data and checks here implement it. When they disagree, that is a defect to fix, not a choice to make.

## Who owns what

- **System** owns every shared definition, in `docs/definitions/README.md` of `scan-to-build-system`. Store keeps no definitions file and does not define, rename or redefine a term. If a term is missing there, say so; do not define it here.
- **System** owns the job's meaning and the application. Store answers the definition it is sent and never rewrites it to make it fit.
- **Program** is the menu, not the meal: it points here for the Store, the Project 1 trail and the patents.

## Rules

- Clean definitions only. A request that is not one is refused with its reason. "No" is an answer. Never add a compatibility request type, a count-only price, a default, a fallback, or a second path to get a pass.
- One request layer (`src/requests/store-request.mjs`). Evaluators never issue receipts, read the clock or environment, or import the request layer.
- No project or tile names in Store code. A project is sent as neutral definitions; there are no project-shaped evaluators.
- Store answers the definition it is sent and never chooses for the user. When a job can be made several ways (board widths for a depth, for example), each way is its own definition with its own answer, and the user chooses in System.
- Adding or changing an offering is a data change in `data/store-zero-catalog.json`, checked with `npm run check:catalog`. It needs no code change. Do not loosen a catalog rule to admit a row; fix the row.
- Recorded answers are evidence. Do not edit `acceptance/differential/*.gz`, `acceptance/fixtures/`, `acceptance/project-1/from-evidence/`, `docs/project-1-digital-trail/` or `docs/patents/` to make a test pass. A deliberate change to an answer needs the owner's approval in that change, and the specification must say what changed and why.
- The contracts (`src/contracts/`, `contracts/examples/`) are what System and the machine side build against. Change them only deliberately, regenerate the examples with `npm run build:examples`, and say in the specification what changed. Never loosen a shape to admit a definition; fix the definition.
- Machine facts live in `data/machine/` as a registered configuration. The machine side reads the accepted job packet and that configuration and nothing else; it never changes what was accepted, and it refuses when the configuration and the Store's plan disagree. Physical admission stays BLOCKED until a commissioned configuration exists.
- Delete a replaced path in the same change. Keep comments and the specification current with the code.
- If a check fails on untouched `main`, say so; do not fix it inside another task.

## Checks

Run both before and after every change, on Node 22:

```sh
npm run check:catalog
npm test
```

## Not from here

The live application still answers through the predecessor Store at System's `STORE_PIN`, on Railway. Do not change System, its pin, its workflows, or any Railway setting from this repository. If a task seems to need that, stop and ask.

## Working

Keep authorized work on `main`, in a few meaningful commits after the checks pass. Publish only a fast-forward from the reviewed main head; if main changes, inspect and retest before publishing. Do not create task branches or other repositories.

**NO BLOOD ON WOOD.**
