import test from "node:test";
import assert from "node:assert/strict";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { findSku } from "../src/evaluation/catalog.mjs";
import {
  D001_TRAVEL_STANDARD,
  xIndexTimeSec,
  yIndexTimeSec,
  sawCycleSec,
  evaluateD001UserDefinedBoard
} from "../src/evaluation/engine/d001-travel-standard.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "./fixtures/user1-dimensional-travel-fixture.mjs";

const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-12, `${label}: ${actual} != ${expected}`);

// Threshold = V^2 / A (V in in/s). X: (480/60)^2 / 32 = 2 in. Y: (240/60)^2 / 16 = 1 in.
// Below it the move is triangular, 2*sqrt(D/A); at or above it trapezoidal, 2V/A + (D - threshold)/V.
const X = { V: 480 / 60, A: 32, threshold: 2 };
const Y = { V: 240 / 60, A: 16, threshold: 1 };
const triangular = (m, D) => 2 * Math.sqrt(D / m.A);
const trapezoidal = (m, D) => (2 * m.V) / m.A + (D - m.threshold) / m.V;

test("the declared X and Y motion models give a 2 in and a 1 in triangular/trapezoidal threshold", () => {
  // Rule: the threshold is derived from the declared velocity and acceleration, not stored separately.
  assert.equal(D001_TRAVEL_STANDARD.motion.x.maxLoadedVelocityInPerMin, 480);
  assert.equal(D001_TRAVEL_STANDARD.motion.x.accelerationInPerSec2, 32);
  assert.equal(D001_TRAVEL_STANDARD.motion.yTool.maxVelocityInPerMin, 240);
  assert.equal(D001_TRAVEL_STANDARD.motion.yTool.accelerationInPerSec2, 16);
  assert.equal(X.V ** 2 / X.A, X.threshold);
  assert.equal(Y.V ** 2 / Y.A, Y.threshold);
});

test("an X index shorter than 2 in is triangular, 2 in or longer is trapezoidal", () => {
  // Rule: xIndexTimeSec switches profile exactly at V^2/A; the two formulas meet there (0.5 s), and differ either side.
  close(xIndexTimeSec(1), triangular(X, 1), "below");
  assert.notEqual(Math.round(xIndexTimeSec(1) * 1e9), Math.round(trapezoidal(X, 1) * 1e9));
  close(xIndexTimeSec(1.999), triangular(X, 1.999), "just below");
  assert.equal(xIndexTimeSec(2), 0.5);
  close(xIndexTimeSec(2), trapezoidal(X, 2), "at");
  close(xIndexTimeSec(10), trapezoidal(X, 10), "above");
  assert.equal(xIndexTimeSec(10), 1.5);
  assert.notEqual(Math.round(xIndexTimeSec(10) * 1e9), Math.round(triangular(X, 10) * 1e9));
  // Distance is unsigned; zero is zero; non-numbers are NaN, never 0.
  assert.equal(xIndexTimeSec(-10), 1.5);
  assert.equal(xIndexTimeSec(0), 0);
  assert.ok(Number.isNaN(xIndexTimeSec("far")));
});

test("a Y move shorter than 1 in is triangular, 1 in or longer is trapezoidal", () => {
  // Rule: yIndexTimeSec uses the same profile switch at the Y tool's own V^2/A.
  close(yIndexTimeSec(0.5), triangular(Y, 0.5), "below");
  assert.notEqual(Math.round(yIndexTimeSec(0.5) * 1e9), Math.round(trapezoidal(Y, 0.5) * 1e9));
  assert.equal(yIndexTimeSec(1), 0.5);
  close(yIndexTimeSec(1), trapezoidal(Y, 1), "at");
  close(yIndexTimeSec(1.75), trapezoidal(Y, 1.75), "above");
  assert.equal(yIndexTimeSec(1.75), 0.6875);
  assert.notEqual(Math.round(yIndexTimeSec(1.75) * 1e9), Math.round(triangular(Y, 1.75) * 1e9));
});

test("the threshold follows a supplied motion model rather than a fixed distance", () => {
  // Rule: threshold = V^2/A for whatever model is passed. V = 1 in/s, A = 0.25 in/s^2 gives a 4 in threshold.
  const model = { maxLoadedVelocityInPerMin: 60, accelerationInPerSec2: 0.25 };
  close(xIndexTimeSec(3, model), 2 * Math.sqrt(3 / 0.25), "triangular below 4");
  assert.equal(xIndexTimeSec(4, model), 8);
  assert.equal(xIndexTimeSec(6, model), 10);
});

test("the saw helper returns NaN for an angle outside [0, 90) or a non-number; never a time", () => {
  // Rule: sawCycleSec refuses to time a cut whose angle is negative, 90 or more, or not finite.
  for (const angle of [-0.001, 90, 120, NaN, Infinity, "steep"]) {
    assert.ok(Number.isNaN(sawCycleSec(3.5, angle)), `angle ${String(angle)}`);
  }
  for (const width of [0, -1, NaN]) {
    assert.ok(Number.isNaN(sawCycleSec(width, 0)), `width ${String(width)}`);
  }
  // Valid angles are timed; 0 is a square cut, not "missing". Feed 0.003*80*1800*0.5 = 216 in/min; width 3.5 at 0 deg: 1 + (3.5/216)*60 + 1.
  close(sawCycleSec(3.5, 0), 2 + (3.5 / 216) * 60, "square");
  assert.ok(Number.isFinite(sawCycleSec(3.5, 89.9)));
  assert.ok(sawCycleSec(3.5, 45) > sawCycleSec(3.5, 0));
});

const item = () => structuredClone(findSku(recordedCatalog(), "STB-ZERO-SPF-2X4-60-001"));
const engineDemand = (method) => ({
  configurationId: USER1_DIMENSIONAL_TRAVEL_DEMAND.configurationId,
  configurationVersion: USER1_DIMENSIONAL_TRAVEL_DEMAND.configurationVersion,
  classId: USER1_DIMENSIONAL_TRAVEL_DEMAND.classId,
  definedWorkpieceLengthIn: 60,
  cut: { angleDeg: 30, plane: "miter-face" },
  datumC: { method, stationId: "SAW-L" },
  parts: structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND.parts),
  declaredSawCuts: 3,
  declaredSpotCount: 2
});

test("MECHANICAL_REFERENCE and SENSED_FACE are admitted but not modeled: never planned as a reference cut", () => {
  // Rule: the operation plan establishes Datum C with a reference saw cut. A mechanical or sensed reference has no
  // plan or time in this model, so it is UNRESOLVED with its own reason instead of being priced as REFERENCE_CUT.
  const reference = evaluateD001UserDefinedBoard({ item: item(), demand: engineDemand("REFERENCE_CUT") });
  assert.equal(reference.status, "BUDGETARY_ESTIMATE");
  assert.equal(reference.travel.operationPlan[0].kind, "REFERENCE_CUT");
  assert.equal(reference.travel.time.T_REFERENCE_sec, 3.1226);
  for (const method of ["MECHANICAL_REFERENCE", "SENSED_FACE"]) {
    const result = evaluateD001UserDefinedBoard({ item: item(), demand: engineDemand(method) });
    assert.equal(result.complete, false, method);
    assert.deepEqual(result.unresolved, [`DATUM_C_METHOD_NOT_MODELED:${method}`], method);
    assert.equal(result.travel, undefined, `${method} has no plan`);
  }
});

test("a Datum-C method outside the admitted three is unresolved, not defaulted", () => {
  // Rule: only REFERENCE_CUT, MECHANICAL_REFERENCE and SENSED_FACE establish Datum C.
  const result = evaluateD001UserDefinedBoard({ item: item(), demand: engineDemand("TAPE_MEASURE") });
  assert.equal(result.status, "UNRESOLVED");
  assert.deepEqual(result.unresolved, ["DATUM_C_ESTABLISHMENT_METHOD_REQUIRED"]);
});

test("the saw helper's invalid-angle branch is shielded by the evaluator: an out-of-range angle is refused before timing", () => {
  // Rule: the evaluator refuses angles outside 0..45 itself, so a NaN saw time never reaches a priced plan.
  // (sawCycleSec's NaN branch is reachable directly as an export; through the evaluator it is not.)
  for (const angleDeg of [-5, 46, 90]) {
    const demand = { ...engineDemand("REFERENCE_CUT"), cut: { angleDeg, plane: "miter-face" } };
    const result = evaluateD001UserDefinedBoard({ item: item(), demand });
    assert.equal(result.status, "REFUSED", String(angleDeg));
    assert.deepEqual(result.reasons, ["MITER_ANGLE_OUTSIDE_D001_STAGE2_ENVELOPE"], String(angleDeg));
    assert.equal(result.operationPlan, undefined);
  }
});
