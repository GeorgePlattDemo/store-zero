# How the recorded answers were produced

`../pin-9c62d9d-answers.jsonl.gz` was recorded once, on 2026-10-08, from the Store the live application used at that time: `scan-to-build-store` at commit `9c62d9d6f7775deef83d47196d32c9b5174a352c` (System's `STORE_PIN`).

1. `instrument.mjs` copied that commit and wrapped its job-level evaluators (`evaluateDimensionalTravelJob`, `evaluateCutPackageJob`, `evaluateAlcoveJob`, `evaluateSheetPackageJob`, `evaluateD001UserDefinedBoard`, `evaluateD001DimensionalBatch`, `envelopeCheck`, `evaluateCircularSegment`, and the stencil-tab planners) with `recorder.mjs`.
2. That Store's own 22 tests ran against the wrapped copy, recording every outermost evaluator call.
3. `sweep.mjs` then ran the Project 1 inquiry, the default SPF job, and sweeps over every catalog material class, sheet and hardware offering, plus malformed and incomplete definitions.
4. Calls were de-duplicated by input. Each line is `{ name, key, source, input, output }`; catalogs are stored as differences from `../../fixtures/pin-9c62d9d-catalog.json.gz`, the catalog that Store read, and non-finite numbers as `{ "$num": … }`. The recorder evaluated exactly the input it recorded, so every output belongs to its recorded input.

These scripts are provenance. They need the predecessor repository and are not part of this repository's build or tests; `../differential.test.mjs` needs only the recorded files.
