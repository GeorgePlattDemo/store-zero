import test from "node:test";
import assert from "node:assert/strict";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { findSku } from "../src/evaluation/catalog.mjs";
import { envelopeCheck, D001_STAGE2_ENVELOPE } from "../src/evaluation/envelopes/d001-stage2-envelope.mjs";
import { capabilityAnswer } from "../src/evaluation/store-state.mjs";

const catalog = recordedCatalog();
// A recorded 2x4 board (1.5 x 3.5, D-001, saw + mill ops), cloned so each test edits its own row.
const board = (changes = {}) => ({ ...structuredClone(findSku(catalog, "STB-ZERO-SPF-2X4-60-001")), ...changes });
const SPOT = Object.freeze({
  required: true,
  mode: "SPOT_ON_LOCATION",
  locationRule: "CENTERED_ON_PART",
  locationAlongLengthIn: 8,
  acrossWidthRule: "CENTERED_ON_WIDE_FACE"
});

test("the declared stock limits are the ones these branches are tested against", () => {
  // Rule: the envelope declares 1.5 in min width, 0.75 in min thickness, 3.5 in saw / 1.5 in mill max thickness.
  assert.equal(D001_STAGE2_ENVELOPE.stock.minWidthIn, 1.5);
  assert.equal(D001_STAGE2_ENVELOPE.stock.minThicknessIn, 0.75);
  assert.equal(D001_STAGE2_ENVELOPE.stock.maxThicknessSawIn, 3.5);
  assert.equal(D001_STAGE2_ENVELOPE.stock.maxThicknessMillIn, 1.5);
});

test("stock narrower than 1.5 in is refused; exactly 1.5 in is inside the envelope", () => {
  // Rule: width < minWidthIn refuses with STOCK_WIDTH_BELOW_D001_STAGE2_ENVELOPE; the limit itself is allowed.
  const narrow = envelopeCheck(board({ actualW: 1.49 }), { requiredOps: ["CROSSCUT"] });
  assert.equal(narrow.status, "REFUSED");
  assert.deepEqual(narrow.reasons, ["STOCK_WIDTH_BELOW_D001_STAGE2_ENVELOPE"]);

  const atLimit = envelopeCheck(board({ actualW: 1.5 }), { requiredOps: ["CROSSCUT"] });
  assert.equal(atLimit.status, "SUPPORTABLE");
  assert.deepEqual(atLimit.reasons, []);

  const answer = capabilityAnswer(board({ actualW: 1.49 }), ["CROSSCUT"]);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.missing, ["STOCK_WIDTH_BELOW_D001_STAGE2_ENVELOPE"]);
  assert.equal(capabilityAnswer(board({ actualW: 1.5 }), ["CROSSCUT"]).status, "SUPPORTABLE");
});

test("stock thinner than 0.75 in is refused for sawing and for milling; exactly 0.75 in passes both", () => {
  // Rule: thickness < minThicknessIn refuses regardless of which maximum (saw or mill) applies.
  for (const ops of [["CROSSCUT"], ["MILL_LONGITUDINAL_PROFILE"]]) {
    const thin = envelopeCheck(board({ actualT: 0.74 }), { requiredOps: ops });
    assert.equal(thin.status, "REFUSED", ops.join());
    assert.deepEqual(thin.reasons, ["STOCK_THICKNESS_BELOW_D001_STAGE2_ENVELOPE"], ops.join());

    const atLimit = envelopeCheck(board({ actualT: 0.75 }), { requiredOps: ops });
    assert.equal(atLimit.status, "SUPPORTABLE", ops.join());
  }
});

test("saw-only work allows up to 3.5 in thick stock; any mill operation caps thickness at 1.5 in", () => {
  // Rule: maxThicknessSawIn applies unless a mill-family op (mill/dado/groove/rabbet) is required, then maxThicknessMillIn.
  assert.equal(envelopeCheck(board({ actualT: 3.5 }), { requiredOps: ["CROSSCUT"] }).status, "SUPPORTABLE");
  const overSaw = envelopeCheck(board({ actualT: 3.51 }), { requiredOps: ["CROSSCUT"] });
  assert.equal(overSaw.status, "REFUSED");
  assert.deepEqual(overSaw.reasons, ["STOCK_THICKNESS_EXCEEDS_D001_STAGE2_ENVELOPE"]);

  assert.equal(envelopeCheck(board({ actualT: 1.5 }), { requiredOps: ["MILL_LONGITUDINAL_PROFILE"] }).status, "SUPPORTABLE");
  const overMill = envelopeCheck(board({ actualT: 1.51 }), { requiredOps: ["MILL_LONGITUDINAL_PROFILE"] });
  assert.equal(overMill.status, "REFUSED");
  assert.deepEqual(overMill.reasons, ["STOCK_THICKNESS_EXCEEDS_D001_STAGE2_ENVELOPE"]);

  // The same 3.5 in stock that saws is refused once milling is required.
  const sawThickMilled = envelopeCheck(board({ actualT: 3.5, supportedOps: ["CROSSCUT", "MILL_END_PROFILE"] }), {
    requiredOps: ["CROSSCUT", "MILL_END_PROFILE"]
  });
  assert.deepEqual(sawThickMilled.reasons, ["STOCK_THICKNESS_EXCEEDS_D001_STAGE2_ENVELOPE"]);
});

test("a board whose cell family does not include D-001 is refused with CELL_FAMILY_NOT_D001", () => {
  // Rule: a non-empty cellFamily without D-001 is outside this cell; an otherwise-capable board is still refused.
  const other = envelopeCheck(board({ cellFamily: ["S-001"] }), { requiredOps: ["CROSSCUT"] });
  assert.equal(other.status, "REFUSED");
  assert.deepEqual(other.reasons, ["CELL_FAMILY_NOT_D001"]);
  const answer = capabilityAnswer(board({ cellFamily: ["S-001"] }), ["CROSSCUT"]);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.missing, ["CELL_FAMILY_NOT_D001"]);
  assert.deepEqual(answer.cellFamily, ["S-001"]);
});

test("a spot whose along-length location rule is not CENTERED_ON_PART is refused", () => {
  // Rule: the only declared spot location rule is CENTERED_ON_PART; any other is SPOT_LOCATION_RULE_NOT_DECLARED.
  for (const locationRule of ["FROM_END", undefined, ""]) {
    const answer = capabilityAnswer(board(), ["SPOT_ON_LOCATION"], {
      keptLengthIn: 60,
      spotDemand: { ...SPOT, locationRule }
    });
    assert.equal(answer.status, "REFUSED", String(locationRule));
    assert.deepEqual(answer.missing, ["SPOT_LOCATION_RULE_NOT_DECLARED"], String(locationRule));
  }
  assert.equal(capabilityAnswer(board(), ["SPOT_ON_LOCATION"], { keptLengthIn: 60, spotDemand: SPOT }).status, "SUPPORTABLE");
});

test("several operations missing from the offering are named in one reason, in request order", () => {
  // Rule: missing ops are reported as exactly `OP_NOT_ON_OFFERING:<op>,<op>` (requested order, comma-joined, no spaces).
  const crosscutOnly = structuredClone(findSku(catalog, "STB-ZERO-PINESTD-1X4-96-001"));
  assert.deepEqual(crosscutOnly.supportedOps, ["CROSSCUT"]);
  const answer = capabilityAnswer(crosscutOnly, ["CROSSCUT", "MITER_LIMITED", "SPOT_ON_LOCATION"], {
    keptLengthIn: 60,
    sawAngleDeg: 30,
    cutPlane: "miter-face",
    spotDemand: SPOT
  });
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.missing, ["OP_NOT_ON_OFFERING:MITER_LIMITED,SPOT_ON_LOCATION"]);

  const reversed = envelopeCheck(crosscutOnly, { requiredOps: ["SPOT_ON_LOCATION", "MITER_LIMITED"], sawAngleDeg: 30, spotDemand: SPOT });
  assert.deepEqual(reversed.reasons, ["OP_NOT_ON_OFFERING:SPOT_ON_LOCATION,MITER_LIMITED"]);
});

test("a MITER_LIMITED request with a null, missing or blank angle is MITER_ANGLE_REQUIRED, never 0; an explicit 0 passes", () => {
  // Rule: null/undefined/"" mean "not supplied" and leave the request UNRESOLVED; only a stated number is an angle.
  for (const sawAngleDeg of [null, undefined, ""]) {
    const env = envelopeCheck(board(), { requiredOps: ["MITER_LIMITED"], sawAngleDeg, cutPlane: "miter-face" });
    assert.equal(env.status, "UNRESOLVED", JSON.stringify(sawAngleDeg));
    assert.deepEqual(env.reasons, []);
    assert.deepEqual(env.unresolved, ["MITER_ANGLE_REQUIRED"]);
    assert.equal(env.derived.miter.requestedDeg, null);

    const answer = capabilityAnswer(board(), ["MITER_LIMITED"], { sawAngleDeg, cutPlane: "miter-face" });
    assert.equal(answer.status, "UNRESOLVED");
    assert.deepEqual(answer.unresolved, ["MITER_ANGLE_REQUIRED"]);
  }

  const zero = envelopeCheck(board(), { requiredOps: ["MITER_LIMITED"], sawAngleDeg: 0, cutPlane: "miter-face" });
  assert.equal(zero.status, "SUPPORTABLE");
  assert.deepEqual(zero.unresolved, []);
  assert.equal(zero.derived.miter.requestedDeg, 0);
  assert.equal(capabilityAnswer(board(), ["MITER_LIMITED"], { sawAngleDeg: 0, cutPlane: "miter-face" }).status, "SUPPORTABLE");
});
