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
import { materialProblem, offeredGrades } from "../../src/evaluation/store-state.mjs";

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
// A user-defined board whose definition states no complete material (species and nominal size) is the material change.
const materialNotStated = (r) => r.name === "evaluateDimensionalTravelJob" && materialProblem(decode(r.input)[1]?.materialDemand) !== null;
const gradeNotNamed = (r) => {
  if (materialNotStated(r)) return false;
  if (r.name !== "evaluateDimensionalTravelJob") return false;
  const [catalog, demand] = inputFor(r);
  if (demand?.materialDemand?.grade != null) return false;
  return offeredGrades(catalog, demand?.materialDemand ?? {}).length > 1;
};
// A cut package that stated no end-cut angle, or a user-defined board missing a fact, is the defaults change.
const DEFAULTS = APPROVED.find((c) => c.id === "NO-SILENT-DEFINITION-DEFAULTS");
const angleMissing = (pkg) => pkg?.endCut?.angleDeg == null || pkg.endCut.angleDeg === "";
const endCutNotStated = (r) => r.name === "evaluateCutPackageJob" && (decode(r.input)[1]?.cutPackages || []).some(angleMissing);
const boardDefinitionGap = (r) => r.name === "evaluateDimensionalTravelJob" && !materialNotStated(r) && DEFAULTS.definitionGapCodes.includes(evaluateDimensionalTravelJob(...decode(r.input)).materialResolution?.reason);
const defaultsChanged = (r) => endCutNotStated(r) || boardDefinitionGap(r);
// A cut package that stated no material form, or a spot with no featureId, is the identity-and-form change.
const blank = (v) => !(typeof v === "string" && v.trim());
const formMissing = (pkg) => blank(pkg?.material?.form);
const spotIdMissing = (pkg) => (pkg?.parts || []).some((part) => (part?.spots || []).some((spot) => blank(spot?.featureId)));
const identityOrFormNotStated = (r) => r.name === "evaluateCutPackageJob" && (decode(r.input)[1]?.cutPackages || []).some((pkg) => formMissing(pkg) || spotIdMissing(pkg));
// What the recording assumed for a cut package, stated: a square cut, a board, and each spot named by its position.
const statedAsRecorded = (pkg) => ({
  ...pkg,
  ...(angleMissing(pkg) ? { endCut: { angleDeg: 0 } } : {}),
  ...(formMissing(pkg) ? { material: { ...pkg.material, form: "board" } } : {}),
  ...(spotIdMissing(pkg) ? { parts: pkg.parts.map((part) => ({ ...part, spots: (part.spots || []).map((spot, n) => (blank(spot?.featureId) ? { ...spot, featureId: `${part.partId}-SPOT-${n + 1}` } : spot)) })) } : {})
});
const withoutInputHash = (text) => { const a = JSON.parse(text); delete a.calculationIdentity.inputHash; return a; };
// The answer echoes each package's material, so a stated form is echoed and changes the result hash; every other field
// must equal the recording.
function asRecordedEcho(text, demand) {
  const a = withoutInputHash(text);
  const restated = demand.cutPackages.map(formMissing);
  if (!restated.some(Boolean)) return a;
  delete a.calculationIdentity.resultHash;
  a.packages.forEach((line, i) => { if (restated[i] && line.material) delete line.material.form; });
  return a;
}
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

// The recording priced user-defined boards on parallel ends measured long-long without stating it; replay states it.
const GEOMETRY = APPROVED.find((c) => c.id === "END-GEOMETRY-IS-STATED").pricedGeometry;
const geometryNotStated = (demand) => demand && typeof demand === "object" && demand.endRelation == null && demand.lengthDatum == null;
function inputFor(r) {
  const args = decode(r.input);
  if (r.name === "evaluateDimensionalTravelJob" && geometryNotStated(args[1])) args[1] = { ...args[1], ...GEOMETRY };
  return args;
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
  const cases = recordings.filter((r) => r.name === name && !changedKeys.has(r.key) && !materialNotStated(r) && !defaultsChanged(r) && !identityOrFormNotStated(r) && !gradeNotNamed(r) && !removalFor(r));
  if (!cases.length) continue;
  test(`${name}: ${cases.length} recorded answers reproduce exactly`, () => {
    const mismatches = [];
    for (const r of cases) {
      const args = inputFor(r);
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
  const affected = recordings.filter((r) => removalFor(r) === change && !gradeNotNamed(r) && !materialNotStated(r));
  assert.ok(affected.length > 0);
  for (const r of affected) {
    const now = JSON.parse(encode(EVALUATORS[r.name](...inputFor(r))));
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
  const affected = recordings.filter((r) => gradeNotNamed(r) && !boardDefinitionGap(r));
  assert.ok(affected.length > 0);
  let repriced = 0;
  for (const r of affected) {
    const [catalog, demand] = inputFor(r);
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

test("approved change NO-SILENT-DEFINITION-DEFAULTS: a missing fact is asked for, and stating it gives the recorded answer", () => {
  const cut = recordings.filter(endCutNotStated);
  const board = recordings.filter(boardDefinitionGap);
  assert.equal(cut.length, 5);
  // Six recorded boards were already unresolved for a missing fact; one of them states no material at all, so it is
  // now asked for its material first and is proved under MATERIAL-IS-STATED.
  assert.equal(board.length, 5);
  assert.equal(recordings.filter((r) => materialNotStated(r) && JSON.parse(translatedOutput(r.output)).status === "UNRESOLVED").length, 1);
  for (const r of cut) {
    const [catalog, demand] = decode(r.input);
    const now = evaluateCutPackageJob(catalog, demand);
    demand.cutPackages.forEach((pkg, i) => {
      // A spot with no featureId is asked for first (IDENTITY-AND-FORM-ARE-STATED).
      if (angleMissing(pkg) && !spotIdMissing(pkg)) assert.deepEqual([now.packages[i].status, now.packages[i].reasonCodes], ["UNRESOLVED", ["END_CUT_ANGLE_REQUIRED"]]);
    });
    // The recording assumed a square cut; stated explicitly, the answer is the recorded one, result hash included.
    // Only the input hash differs, because the input now states the angle.
    const stated = { ...demand, cutPackages: demand.cutPackages.map(statedAsRecorded) };
    assert.deepEqual(asRecordedEcho(encode(evaluateCutPackageJob(catalog, stated)), demand), asRecordedEcho(translatedOutput(r.output), demand));
  }
  for (const r of board) {
    const now = evaluateDimensionalTravelJob(...decode(r.input));
    assert.equal(JSON.parse(translatedOutput(r.output)).status, "UNRESOLVED", "only answers that were already unresolved now name the missing fact");
    assert.equal(now.status, "UNRESOLVED");
    assert.equal(now.estimate, null);
  }
});

test("approved change END-GEOMETRY-IS-STATED: without its end geometry a board is asked for it; stated, the answer is the recorded one", () => {
  const boards = recordings.filter((r) => r.name === "evaluateDimensionalTravelJob");
  assert.ok(boards.length > 600);
  assert.ok(boards.every((r) => geometryNotStated(decode(r.input)[1])), "the recording never stated geometry");
  for (const r of boards.filter((x) => !boardDefinitionGap(x) && !materialNotStated(x))) {
    const now = evaluateDimensionalTravelJob(...decode(r.input));
    assert.equal(now.materialResolution?.reason, "END_RELATION_REQUIRED", r.key.slice(0, 12));
    assert.equal(now.estimate, null);
  }
  // Other geometry is refused, not priced as parallel.
  const [catalog, demand] = inputFor(boards.find((r) => JSON.parse(r.output).status === "SUPPORTABLE" && !gradeNotNamed(r)));
  for (const [change, reason] of [[{ endRelation: "nonparallel" }, "END_RELATION_NOT_PRICED:nonparallel"], [{ lengthDatum: "short-short-outer-edge" }, "LENGTH_DATUM_NOT_PRICED:short-short-outer-edge"], [{ endIdentity: "miter-face-long-point" }, "END_IDENTITY_NOT_PRICED"]]) {
    const refused = evaluateDimensionalTravelJob(catalog, { ...demand, ...change });
    assert.deepEqual([refused.status, refused.materialResolution.reason], ["REFUSED", reason]);
  }
});

test("approved change MATERIAL-IS-STATED: a board that states no complete material is asked for it, never matched against every board", () => {
  const affected = recordings.filter(materialNotStated);
  assert.equal(affected.length, 2);
  const before = affected.map((r) => JSON.parse(translatedOutput(r.output)).status).sort();
  assert.deepEqual(before, ["SUPPORTABLE", "UNRESOLVED"], "one was priced on a board Store chose; one was already unresolved");
  for (const r of affected) {
    const now = evaluateDimensionalTravelJob(...inputFor(r));
    assert.deepEqual([now.status, now.materialResolution.reason, now.estimate], ["UNRESOLVED", "MATERIAL_CHOICE_REQUIRED", null]);
  }
});

test("approved change IDENTITY-AND-FORM-ARE-STATED: a spot with no featureId or a package with no form is asked for it; stated, the answer is the recorded one", () => {
  const change = APPROVED.find((c) => c.id === "IDENTITY-AND-FORM-ARE-STATED");
  const affected = recordings.filter(identityOrFormNotStated);
  assert.equal(affected.length, change.recordedAnswers);
  let priced = 0;
  for (const r of affected) {
    const [catalog, demand] = decode(r.input);
    const now = evaluateCutPackageJob(catalog, demand);
    demand.cutPackages.forEach((pkg, i) => {
      const line = now.packages[i];
      if (spotIdMissing(pkg)) assert.deepEqual([line.status, line.reasonCodes], ["UNRESOLVED", ["FEATURE_ID_REQUIRED"]], r.key.slice(0, 12));
      else if (formMissing(pkg) && !angleMissing(pkg)) assert.deepEqual([line.status, line.reasonCodes], ["UNRESOLVED", ["MATERIAL_FORM_REQUIRED"]], r.key.slice(0, 12));
      if (spotIdMissing(pkg) || formMissing(pkg)) assert.equal(line.Q, null, "no price for a package missing a fact");
    });
    assert.notEqual(now.status, "SUPPORTABLE");
    if (JSON.parse(r.output).status === "SUPPORTABLE") priced += 1;
    // What the recording assumed, stated explicitly, gives the recorded answer; only the input hash differs.
    const stated = { ...demand, cutPackages: demand.cutPackages.map(statedAsRecorded) };
    assert.deepEqual(asRecordedEcho(encode(evaluateCutPackageJob(catalog, stated)), demand), asRecordedEcho(translatedOutput(r.output), demand), r.key.slice(0, 12));
  }
  assert.equal(priced, change.recordedSupportable, "recorded answers that were priced and now ask for the missing fact");
});
