import test from "node:test";
import assert from "node:assert/strict";
import { CIRCULAR_SEGMENT_V0, evaluateCircularSegment } from "../src/evaluation/engine/circular-segment.mjs";

test("the canonical 36 in chord with a 12 in rise derives a 19.5 in radius", () => {
  // Rule: R = c²/(8h) + h/2 = 1296/96 + 6 = 19.5.
  const answer = evaluateCircularSegment({ chord_in: 36, rise_in: 12 });
  assert.equal(answer.ok, true);
  assert.equal(answer.status, "SUPPORTABLE");
  assert.deepEqual(answer.reasons, []);
  assert.deepEqual(answer.unresolved, []);
  assert.equal(answer.derivedRadius_in, 19.5);
  assert.equal(answer.radius_in, 19.5);
  assert.equal(answer.curveKind, "CIRCULAR_SEGMENT");
  // A stated radius that agrees is accepted.
  assert.equal(evaluateCircularSegment({ chord_in: 36, rise_in: 12, radius_in: 19.5 }).status, "SUPPORTABLE");
});

test("a missing chord or rise is UNRESOLVED, never guessed", () => {
  // Rule: chord + rise is the canonical pair; without both the curve is left open with CURVE_CHORD_OR_RISE_MISSING.
  for (const input of [{ rise_in: 12 }, { chord_in: 36 }, { chord_in: null, rise_in: 12 }, { chord_in: 36, rise_in: undefined }, {}]) {
    const answer = evaluateCircularSegment(input);
    assert.equal(answer.ok, false);
    assert.equal(answer.status, "UNRESOLVED");
    assert.deepEqual(answer.unresolved, ["CURVE_CHORD_OR_RISE_MISSING"]);
    assert.deepEqual(answer.reasons, []);
    assert.equal(answer.derivedRadius_in, null);
  }
  assert.equal(evaluateCircularSegment().status, "UNRESOLVED");
  // Missing wins over a non-numeric partner.
  assert.deepEqual(evaluateCircularSegment({ chord_in: null, rise_in: "x" }).unresolved, ["CURVE_CHORD_OR_RISE_MISSING"]);
});

test("a non-numeric chord or rise is REFUSED as CURVE_NOT_NUMERIC", () => {
  // Rule: numbers only; strings, NaN and Infinity are not coerced.
  for (const input of [{ chord_in: "36", rise_in: 12 }, { chord_in: 36, rise_in: "12" }, { chord_in: NaN, rise_in: 12 }, { chord_in: 36, rise_in: Infinity }]) {
    const answer = evaluateCircularSegment(input);
    assert.equal(answer.status, "REFUSED");
    assert.deepEqual(answer.reasons, ["CURVE_NOT_NUMERIC"]);
  }
  // Non-numeric is checked before sign.
  assert.deepEqual(evaluateCircularSegment({ chord_in: NaN, rise_in: -1 }).reasons, ["CURVE_NOT_NUMERIC"]);
});

test("a zero or negative chord or rise is REFUSED as CURVE_CHORD_OR_RISE_INVALID", () => {
  // Rule: both chord and rise must be strictly positive.
  for (const input of [{ chord_in: 0, rise_in: 12 }, { chord_in: 36, rise_in: 0 }, { chord_in: -36, rise_in: 12 }, { chord_in: 36, rise_in: -12 }]) {
    const answer = evaluateCircularSegment(input);
    assert.equal(answer.status, "REFUSED");
    assert.deepEqual(answer.reasons, ["CURVE_CHORD_OR_RISE_INVALID"]);
    assert.equal(answer.derivedRadius_in, null);
  }
});

test("a chord and rise whose radius overflows is REFUSED as CURVE_RADIUS_NOT_CONSTRUCTIBLE", () => {
  // Rule: the derived radius must be a finite positive number; (1e200)²/8 overflows to Infinity.
  const answer = evaluateCircularSegment({ chord_in: 1e200, rise_in: 1 });
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasons, ["CURVE_RADIUS_NOT_CONSTRUCTIBLE"]);
  assert.equal(answer.radius_in, null);
  assert.equal(answer.derivedRadius_in, null);
});

test("a stated radius that is not a positive number is REFUSED as CURVE_RADIUS_INVALID", () => {
  // Rule: an optional radius, when stated, must be finite and positive; the derived radius is still reported.
  for (const radius_in of [0, -19.5, NaN, Infinity, "19.5"]) {
    const answer = evaluateCircularSegment({ chord_in: 36, rise_in: 12, radius_in });
    assert.equal(answer.status, "REFUSED", `radius ${String(radius_in)}`);
    assert.deepEqual(answer.reasons, ["CURVE_RADIUS_INVALID"]);
    assert.equal(answer.derivedRadius_in, 19.5);
  }
});

test("a stated radius that contradicts chord and rise is REFUSED, not silently replaced", () => {
  // Rule: |stated − derived| > 0.001 in refuses with CURVE_RADIUS_CONTRADICTS_CHORD_RISE.
  const answer = evaluateCircularSegment({ chord_in: 36, rise_in: 12, radius_in: 20 });
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasons, ["CURVE_RADIUS_CONTRADICTS_CHORD_RISE"]);
  assert.equal(answer.radius_in, 20);
  assert.equal(answer.derivedRadius_in, 19.5);
});

test("the radius tolerance is 0.001 in on both sides of the derived radius", () => {
  // Rule: within 0.001 in above or below the derived radius is accepted (stated radius echoed); beyond it is refused.
  assert.equal(CIRCULAR_SEGMENT_V0.radiusToleranceIn, 0.001);
  for (const radius_in of [19.5009, 19.4991]) {
    const answer = evaluateCircularSegment({ chord_in: 36, rise_in: 12, radius_in });
    assert.equal(answer.status, "SUPPORTABLE", `radius ${radius_in}`);
    assert.equal(answer.radius_in, radius_in);
    assert.equal(answer.derivedRadius_in, 19.5);
  }
  for (const radius_in of [19.5011, 19.4989]) {
    const answer = evaluateCircularSegment({ chord_in: 36, rise_in: 12, radius_in });
    assert.equal(answer.status, "REFUSED", `radius ${radius_in}`);
    assert.deepEqual(answer.reasons, ["CURVE_RADIUS_CONTRADICTS_CHORD_RISE"]);
  }
  // Current behavior at the nominal edge: 19.501 − 19.5 is 0.0010000000000012 in binary floating point, so a radius
  // stated exactly 0.001 in off is refused on both sides (strict > with no epsilon).
  assert.equal(evaluateCircularSegment({ chord_in: 36, rise_in: 12, radius_in: 19.501 }).status, "REFUSED");
  assert.equal(evaluateCircularSegment({ chord_in: 36, rise_in: 12, radius_in: 19.499 }).status, "REFUSED");
});
