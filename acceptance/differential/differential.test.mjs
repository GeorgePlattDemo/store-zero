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
import { existsSync } from "node:fs";
import { evaluateSheetPackageJob } from "../../src/evaluation/evaluators/sheet-package.mjs";
import { evaluateD001UserDefinedBoard, evaluateD001DimensionalBatch } from "../../src/evaluation/engine/d001-travel-standard.mjs";
import { envelopeCheck } from "../../src/evaluation/envelopes/d001-stage2-envelope.mjs";
import { evaluateCircularSegment } from "../../src/evaluation/engine/circular-segment.mjs";
import { archedAperturePerimeter, planArchedStencilTabs, planSplitStencilTabs } from "../../src/evaluation/engine/stencil-tab-policy.mjs";
import { recordedCatalogAsRead, toCurrentSchema } from "../fixtures/recorded-catalog.mjs";
import { matchingBoardOfferings } from "../../src/evaluation/store-state.mjs";

const EVALUATORS = {
  evaluateDimensionalTravelJob,
  evaluateCutPackageJob,
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
const APPROVED = JSON.parse(readFileSync(new URL("approved-changes.json", import.meta.url), "utf8")).changes;
const changedKeys = new Map(APPROVED.filter((c) => c.keys).flatMap((c) => c.keys.map((k) => [k, c])));
const retired = new Set(APPROVED.filter((c) => c.retiredEvaluator).map((c) => c.retiredEvaluator));
const removals = APPROVED.filter((c) => c.removedReason);
// A user-defined board that names no grade for wood offered in several is the grade change.
const gradeNotNamed = (r) => {
  if (r.name !== "evaluateDimensionalTravelJob") return false;
  const [catalog, demand] = decode(r.input);
  if (demand?.materialDemand?.grade != null) return false;
  return new Set(matchingBoardOfferings(catalog, { ...demand?.materialDemand, grade: null }).map((item) => item.grade)).size > 1;
};
const removalFor = (r) => removals.find((c) => c.evaluators.includes(r.name) && r.output.includes(`"${c.removedReason}"`));

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
  const cases = recordings.filter((r) => r.name === name && !changedKeys.has(r.key) && !gradeNotNamed(r) && !removalFor(r));
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

test("every recorded evaluator is either replayed or retired by an approved change", () => {
  for (const name of new Set(recordings.map((r) => r.name))) {
    assert.ok(Object.hasOwn(EVALUATORS, name) || retired.has(name), `${name} is neither replayed nor retired`);
    assert.ok(!(Object.hasOwn(EVALUATORS, name) && retired.has(name)), `${name} is both replayed and retired`);
  }
  assert.ok(!existsSync(new URL("../../src/evaluation/evaluators/alcove-insert.mjs", import.meta.url)), "the retired Alcove evaluator is gone");
  assert.equal(recordings.filter((r) => retired.has(r.name)).length, 44, "the 44 recorded Alcove answers are the retired ones");
});

test("approved change RIP-AT-FINISHED-WIDTH: the only difference is that over-width removals are now rips", () => {
  const changed = recordings.filter((r) => changedKeys.get(r.key)?.id === "RIP-AT-FINISHED-WIDTH");
  assert.equal(changed.length, 1);
  for (const r of changed) {
    const actual = JSON.parse(encode(evaluateCutPackageJob(...decode(r.input))));
    const recorded = JSON.parse(r.output);
    const lines = (answer) => [...answer.packages, ...answer.items];
    let ripped = 0;
    lines(recorded).forEach((was, i) => {
      const now = lines(actual)[i];
      // A line refused because its only boards able to hold the parts needed more than 1 in off now rips them.
      if (was.status === "REFUSED" && was.reasonCodes.includes("EDGE_MILL_REMOVAL_EXCEEDS_D001_MAX_CUT_WIDTH")) {
        assert.equal(now.status, "SUPPORTABLE", was.packageId);
        assert.equal(now.edgeMill.mode, "RIP_AT_FINISHED_WIDTH");
        ripped += 1;
      } else {
        assert.deepEqual(now, was, `${was.packageId ?? was.lineId} is unchanged`);
      }
    });
    assert.ok(ripped > 0);
  }
});


test("approved change NO-BOARD-LENGTH-CEILING: the removed reason is the only difference, and no price changes", () => {
  const change = APPROVED.find((c) => c.id === "NO-BOARD-LENGTH-CEILING");
  const without = (reasons) => reasons.filter((code) => code !== change.removedReason);
  const affected = recordings.filter((r) => removalFor(r) === change && !gradeNotNamed(r));
  assert.ok(affected.length > 0);
  for (const r of affected) {
    const now = JSON.parse(encode(EVALUATORS[r.name](...decode(r.input))));
    const was = JSON.parse(translatedOutput(r.output));
    assert.ok(!JSON.stringify(now).includes(change.removedReason), "the reason is never issued");
    if (r.name === "envelopeCheck") {
      assert.deepEqual(now.reasons, without(was.reasons));
      if (now.reasons.length) assert.equal(now.status, was.status);
      else assert.notEqual(now.status, "REFUSED", "a board refused for that reason alone is now taken");
      assert.deepEqual({ ...now, status: null, reasons: null }, { ...was, status: null, reasons: null });
    } else {
      // The chosen board, status and Q are unchanged; only boards passed over for that reason read differently.
      const strip = (a) => ({ ...a, materialResolution: { ...a.materialResolution, consideredCandidates: null } });
      assert.deepEqual(strip(now), strip(was));
      const before = was.materialResolution.consideredCandidates;
      const after = now.materialResolution.consideredCandidates;
      assert.deepEqual(after.map((c) => c.storeSku), before.map((c) => c.storeSku));
      before.forEach((c, i) => { if (c.reason !== change.removedReason) assert.deepEqual(after[i], c); });
    }
  }
});

test("approved change GRADE-IS-THE-CUSTOMERS: Store asks for the grade, and the named grade gives the recorded board and Q", () => {
  const ceiling = APPROVED.find((c) => c.id === "NO-BOARD-LENGTH-CEILING").removedReason;
  const affected = recordings.filter(gradeNotNamed);
  assert.ok(affected.length > 0);
  let repriced = 0;
  for (const r of affected) {
    const [catalog, demand] = decode(r.input);
    const now = evaluateDimensionalTravelJob(catalog, demand);
    assert.equal(now.status, "UNRESOLVED");
    assert.equal(now.materialResolution.reason, "GRADE_CHOICE_REQUIRED");
    assert.ok(now.materialResolution.offeredGrades.length > 1);
    const was = JSON.parse(translatedOutput(r.output));
    if (was.status !== "SUPPORTABLE") continue;
    // The grade the recording priced, named by the customer, gives the recorded answer.
    const grade = catalog.offerings.find((o) => o.storeSku === was.materialResolution.storeSku).grade;
    const graded = JSON.parse(encode(evaluateDimensionalTravelJob(catalog, { ...demand, materialDemand: { ...demand.materialDemand, grade } })));
    const strip = (a) => ({ ...a, materialResolution: { ...a.materialResolution, consideredCandidates: null } });
    assert.deepEqual(strip(graded), strip(was));
    const sameGrade = new Set(catalog.offerings.filter((o) => o.grade === grade).map((o) => o.storeSku));
    const kept = was.materialResolution.consideredCandidates.filter((c) => sameGrade.has(c.storeSku));
    assert.deepEqual(graded.materialResolution.consideredCandidates.map((c) => c.storeSku), kept.map((c) => c.storeSku));
    kept.forEach((c, i) => { if (c.reason !== ceiling) assert.deepEqual(graded.materialResolution.consideredCandidates[i], c); });
    repriced += 1;
  }
  assert.ok(repriced > 0);
});
