// A missing manufacturing fact is never filled in. Each fact the user-defined board path reads is tested missing,
// null, blank, invalid, explicit zero (where zero is a real value) and valid: only the stated fact is priced.
import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDimensionalTravelJob } from "../src/evaluation/evaluators/user-defined-board.mjs";
import { evaluateStoreRequest } from "../src/requests/store-request.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { project1Demand } from "./fixtures/project-1.mjs";

const catalog = recordedCatalog();
const answer = (demand) => evaluateDimensionalTravelJob(catalog, demand);
const without = (key) => { const d = project1Demand(); delete d[key]; return d; };
const withValue = (key, value) => ({ ...project1Demand(), [key]: value });
const reason = (a) => a.materialResolution.reason;
const gap = (a, code) => {
  assert.equal(a.status, "UNRESOLVED");
  assert.equal(reason(a), code);
  assert.equal(a.estimate, null, "no price is computed for an incomplete definition");
};

test("the complete Project 1 definition is priced as stated", () => {
  const a = answer(project1Demand());
  assert.equal(a.status, "SUPPORTABLE");
  assert.equal(a.estimate.totals.Q, 11.09);
});

test("a missing, null or blank miter angle is asked for; it is never a square cut", () => {
  for (const d of [without("sawAngleDeg"), withValue("sawAngleDeg", null), withValue("sawAngleDeg", "")]) gap(answer(d), "MITER_ANGLE_REQUIRED");
  // An explicit 0 is a real angle and is priced as a square cut: it differs from the 26.39 degree answer.
  const square = answer(withValue("sawAngleDeg", 0));
  assert.equal(square.status, "SUPPORTABLE");
  assert.equal(square.estimate.totals.Q, 11.06);
  // Outside the envelope is refused, not clamped.
  assert.equal(answer(withValue("sawAngleDeg", 46)).status, "REFUSED");
});

test("a missing, null or blank cut plane is asked for; a plane the cell does not declare is refused", () => {
  for (const d of [without("cutPlane"), withValue("cutPlane", null), withValue("cutPlane", "")]) gap(answer(d), "CUT_PLANE_REQUIRED");
  const other = answer(withValue("cutPlane", "edge"));
  assert.equal(other.status, "REFUSED");
  assert.ok(other.materialResolution.consideredCandidates.every((c) => c.reason === "MITER_PLANE_NOT_DECLARED"));
});

test("a missing, null or blank Datum-C method is asked for; it never becomes REFERENCE_CUT", () => {
  for (const d of [without("datumCMethod"), withValue("datumCMethod", null), withValue("datumCMethod", "")]) gap(answer(d), "DATUM_C_ESTABLISHMENT_METHOD_REQUIRED");
  // A method the standard does not admit is unresolved by the travel standard with the same reason.
  const bogus = answer(withValue("datumCMethod", "EYEBALL"));
  assert.equal(bogus.status, "UNRESOLVED");
  assert.ok(bogus.estimate.unresolved.includes("DATUM_C_ESTABLISHMENT_METHOD_REQUIRED"));
  // Each admitted method is priced as itself.
  for (const method of ["REFERENCE_CUT", "MECHANICAL_REFERENCE", "SENSED_FACE"]) {
    const a = answer(withValue("datumCMethod", method));
    assert.equal(a.status, "SUPPORTABLE", method);
    assert.equal(a.estimate.travel.datumC.establishmentMethod, method);
  }
});

test("a missing, null or empty operation list is asked for; it never becomes MITER_LIMITED", () => {
  for (const d of [without("requiredOps"), withValue("requiredOps", null), withValue("requiredOps", [])]) gap(answer(d), "REQUIRED_OPERATIONS_REQUIRED");
});

test("the declared operations must agree with the work the parts define", () => {
  // Spots are defined but SPOT_ON_LOCATION is not declared.
  gap(answer(withValue("requiredOps", ["MITER_LIMITED"])), "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:SPOT_ON_LOCATION");
  // A crosscut declared for an angled cut.
  gap(answer(withValue("requiredOps", ["CROSSCUT", "SPOT_ON_LOCATION"])), "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:MITER_LIMITED");
  // SPOT_ON_LOCATION declared with no spot on any part.
  const noSpots = { ...project1Demand(), declaredSpotCount: 0, parts: project1Demand().parts.map((p) => ({ ...p, features: [] })) };
  gap(answer(noSpots), "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:SPOT_ON_LOCATION");
  // A square cut with no saw operation declared at all.
  gap(answer({ ...noSpots, sawAngleDeg: 0, requiredOps: ["DRILL"] }), "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:CROSSCUT");
  // A square cut declared as a crosscut is priced.
  assert.equal(answer({ ...noSpots, sawAngleDeg: 0, requiredOps: ["CROSSCUT"] }).status, "SUPPORTABLE");
});

test("the declared counts are cross-checks: absent is not checked, a wrong count is not overwritten", () => {
  for (const key of ["declaredSawCuts", "declaredSpotCount"]) {
    assert.equal(answer(without(key)).status, "SUPPORTABLE", `${key} absent`);
    assert.equal(answer(withValue(key, null)).estimate.totals.Q, 11.09, `${key} null`);
  }
  const wrong = answer(withValue("declaredSpotCount", 3));
  assert.equal(wrong.status, "UNRESOLVED");
  assert.ok(wrong.estimate.unresolved.includes("DECLARED_SPOT_COUNT_MISMATCH"));
});

test("through the request layer a mistyped fact is refused by its path before any evaluator", () => {
  const typed = evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId: "T", demand: withValue("sawAngleDeg", "26.39") }, { release: "t", catalog });
  assert.equal(typed.status, "REFUSED");
  assert.deepEqual(typed.reasonCodes, ["DEFINITION_FIELD_TYPE:sawAngleDeg:number"]);
  const missing = evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId: "M", demand: without("datumCMethod") }, { release: "t", catalog });
  assert.equal(missing.status, "UNRESOLVED");
  assert.equal(missing.materialResolution.reason, "DATUM_C_ESTABLISHMENT_METHOD_REQUIRED");
});
