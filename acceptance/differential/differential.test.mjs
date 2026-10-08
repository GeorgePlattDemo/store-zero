// Store Zero must answer exactly as the Store the live application uses today.
//
// pin-9c62d9d-answers.jsonl.gz holds every evaluator call made by that Store's own test suite plus a sweep over
// every catalog material class, sheet and hardware offering (recording/ shows how it was produced). Each line is
// { name, input, output } serialized from that Store. This test replays every input through this repository's
// code and requires the serialized output to be identical, field for field and digit for digit.
//
// The recorded inputs carry catalogs as differences from the catalog that Store read
// (../fixtures/pin-9c62d9d-catalog.json.gz); toCurrentSchema applies the two deliberate schema changes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { evaluateDimensionalTravelJob } from "../../src/evaluation/evaluators/user-defined-board.mjs";
import { evaluateCutPackageJob } from "../../src/evaluation/evaluators/cut-package.mjs";
import { evaluateAlcoveJob } from "../../src/evaluation/evaluators/alcove-insert.mjs";
import { evaluateSheetPackageJob } from "../../src/evaluation/evaluators/sheet-package.mjs";
import { evaluateD001UserDefinedBoard, evaluateD001DimensionalBatch } from "../../src/evaluation/engine/d001-travel-standard.mjs";
import { envelopeCheck } from "../../src/evaluation/envelopes/d001-stage2-envelope.mjs";
import { evaluateCircularSegment } from "../../src/evaluation/engine/circular-segment.mjs";
import { archedAperturePerimeter, planArchedStencilTabs, planSplitStencilTabs } from "../../src/evaluation/engine/stencil-tab-policy.mjs";
import { recordedCatalogAsRead, toCurrentSchema } from "../fixtures/recorded-catalog.mjs";

const EVALUATORS = {
  evaluateDimensionalTravelJob,
  evaluateCutPackageJob,
  evaluateAlcoveJob,
  evaluateSheetPackageJob,
  evaluateD001UserDefinedBoard,
  evaluateD001DimensionalBatch,
  envelopeCheck,
  evaluateCircularSegment,
  archedAperturePerimeter,
  planArchedStencilTabs,
  planSplitStencilTabs
};

const read = (name) => gunzipSync(readFileSync(new URL(name, import.meta.url))).toString("utf8");
const recordedAsRead = recordedCatalogAsRead();
const recordings = read("pin-9c62d9d-answers.jsonl.gz").trim().split("\n").map((line) => JSON.parse(line));

function rebuildCatalog({ changed, removed, order, top }) {
  const bySku = new Map(recordedAsRead.offerings.map((o) => [o.storeSku, o]));
  for (const o of changed) bySku.set(o.storeSku, o);
  for (const sku of removed) bySku.delete(sku);
  const skus = order ?? recordedAsRead.offerings.map((o) => o.storeSku).filter((s) => bySku.has(s)).concat(changed.map((o) => o.storeSku).filter((s) => !recordedAsRead.offerings.some((b) => b.storeSku === s)));
  return toCurrentSchema({ ...recordedAsRead, ...(top ?? {}), offerings: skus.map((s) => bySku.get(s)) });
}

function decode(text) {
  return JSON.parse(text, (key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if ("$num" in value) return Number(value.$num);
      if ("$catalog" in value) return rebuildCatalog(value.$catalog);
    }
    return value;
  });
}

// The recorder encoded catalogs as differences; outputs are compared in the same encoding.
const encode = (value) => JSON.stringify(value, (key, v) => (typeof v === "number" && !Number.isFinite(v) ? { $num: String(v) } : v));
const translatedOutput = (output) => encode(JSON.parse(output, (key, v) => v));

test("the recording covers every evaluator and every Store disposition", () => {
  const names = new Set(recordings.map((r) => r.name));
  for (const name of ["evaluateDimensionalTravelJob", "evaluateCutPackageJob", "evaluateAlcoveJob", "evaluateSheetPackageJob", "evaluateD001UserDefinedBoard", "envelopeCheck", "evaluateCircularSegment"]) {
    assert.ok(names.has(name), `recording has ${name}`);
  }
  const statuses = new Set(recordings.map((r) => JSON.parse(r.output)?.status));
  for (const status of ["SUPPORTABLE", "UNRESOLVED", "REFUSED", "UNAVAILABLE"]) assert.ok(statuses.has(status), `recording has ${status}`);
  assert.ok(recordings.length > 1500, `recording has ${recordings.length} answers`);
});

for (const name of Object.keys(EVALUATORS)) {
  const cases = recordings.filter((r) => r.name === name);
  if (!cases.length) continue;
  test(`${name}: ${cases.length} recorded answers reproduce exactly`, () => {
    const mismatches = [];
    for (const r of cases) {
      const args = decode(r.input);
      const actual = encode(EVALUATORS[name](...args));
      if (actual !== translatedOutput(r.output)) mismatches.push(`${r.source} ${r.key.slice(0, 12)}`);
    }
    assert.deepEqual(mismatches, [], `${mismatches.length} of ${cases.length} answers differ from the recorded Store`);
  });
}
