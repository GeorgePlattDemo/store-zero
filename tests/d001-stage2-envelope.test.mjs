import assert from "node:assert/strict";
import { loadCatalog, findSku } from "../src/evaluation/catalog.mjs";
import { capabilityAnswer, matchingBoardOfferings } from "../src/evaluation/store-state.mjs";
import { envelopeCheck, millPassesForDepth, D001_STAGE2_ENVELOPE } from "../src/evaluation/envelopes/d001-stage2-envelope.mjs";

const catalog = loadCatalog();
assert.equal(D001_STAGE2_ENVELOPE.id, "D001-STAGE2-ENVELOPE-0.3");
assert.equal(D001_STAGE2_ENVELOPE.motion.Y_MILL_TRAVEL_MAX_IN, 14);
assert.equal(D001_STAGE2_ENVELOPE.stock.maxWidthIn, 12);
assert.equal(D001_STAGE2_ENVELOPE.saw.motion, "DOWNSTROKE");
assert.equal(D001_STAGE2_ENVELOPE.saw.miter.maxDeg, 45);
assert.equal(D001_STAGE2_ENVELOPE.spot.toolDiameterIn, 0.1875);
assert.equal(millPassesForDepth(0.75), 2);

const pine = findSku(catalog, "STB-ZERO-PINE-1X6-96-001");
assert.equal(capabilityAnswer(pine, ["CROSSCUT"]).status, "SUPPORTABLE");

const spf72 = findSku(catalog, "STB-ZERO-SPF-2X4-72-001");
const spot = {
  required: true,
  mode: "SPOT_ON_LOCATION",
  countPerPart: 1,
  totalCount: 2,
  locationRule: "CENTERED_ON_PART",
  locationAlongLengthIn: 8,
  acrossWidthRule: "CENTERED_ON_WIDE_FACE"
};

assert.equal(
  capabilityAnswer(spf72, ["MITER_LIMITED"], {
    keptLengthIn: 60,
    sawAngleDeg: 30,
    cutPlane: "miter-face",
    spotDemand: spot
  }).status,
  "SUPPORTABLE"
);
assert.equal(
  capabilityAnswer(spf72, ["MITER_LIMITED"], {
    keptLengthIn: 60,
    sawAngleDeg: 45,
    cutPlane: "miter-face",
    spotDemand: spot
  }).status,
  "SUPPORTABLE"
);
const over45 = capabilityAnswer(spf72, ["MITER_LIMITED"], {
  keptLengthIn: 60,
  sawAngleDeg: 46,
  cutPlane: "miter-face",
  spotDemand: spot
});
assert.equal(over45.status, "REFUSED");
assert.ok(over45.missing.includes("MITER_ANGLE_OUTSIDE_D001_STAGE2_ENVELOPE"));

const missingAngle = capabilityAnswer(spf72, ["MITER_LIMITED"], {
  keptLengthIn: 60,
  cutPlane: "miter-face",
  spotDemand: spot
});
assert.equal(missingAngle.status, "UNRESOLVED");
assert.ok(missingAngle.unresolved.includes("MITER_ANGLE_REQUIRED"));

const genericDrill = capabilityAnswer(spf72, ["DRILL"], { keptLengthIn: 60 });
assert.equal(genericDrill.status, "UNRESOLVED");
assert.ok(genericDrill.unresolved.includes("GENERIC_DRILL_ENVELOPE_NOT_DECLARED_BEYOND_SPOT"));

// Matching boards are ordered shortest first; the 60 in SPF board is the first candidate for a 60 in workpiece
// and it fits the declared envelope for the 30 degree miter with centered spots.
const candidates = matchingBoardOfferings(catalog, { species: "spf", form: "board", nominalT: 2, nominalW: 4, definedWorkpieceLengthIn: 60 });
assert.equal(candidates[0].storeSku, "STB-ZERO-SPF-2X4-60-001");
assert.ok(candidates.every((c, i) => i === 0 || c.stockL_in >= candidates[i - 1].stockL_in));
assert.equal(capabilityAnswer(candidates[0], ["MITER_LIMITED"], { keptLengthIn: 60, sawAngleDeg: 30, cutPlane: "miter-face", spotDemand: spot }).status, "SUPPORTABLE");

const wide = { ...pine, actualW: 13.25 };
assert.equal(envelopeCheck(wide, { requiredOps: ["CROSSCUT"] }).status, "REFUSED");
assert.ok(envelopeCheck(wide, { requiredOps: ["CROSSCUT"] }).reasons.includes("STOCK_WIDTH_EXCEEDS_D001_STAGE2_ENVELOPE"));

const long = findSku(catalog, "STB-ZERO-SPF-2X4-144-001");
const longCap = capabilityAnswer(long, ["CROSSCUT"]);
assert.equal(longCap.status, "REFUSED");
assert.ok(longCap.missing.includes("PARENT_LENGTH_REQUIRES_UNDECLARED_EXTERNAL_SUPPORT"));

const post = findSku(catalog, "STB-ZERO-SPF-4X4-96-001");
assert.equal(capabilityAnswer(post, ["CROSSCUT"]).status, "SUPPORTABLE");
assert.equal(capabilityAnswer(post, ["MILL_LONGITUDINAL_PROFILE"]).status, "REFUSED");

const shortKept = capabilityAnswer(findSku(catalog, "STB-ZERO-SPF-2X4-96-001"), ["CROSSCUT"], { keptLengthIn: 16 });
assert.equal(shortKept.status, "REFUSED");
assert.ok(shortKept.missing.includes("KEPT_LENGTH_BELOW_TWO_ROLLER_CONTROL"));

// Milling capability is declared on the offering and checked by the envelope.
const spf96 = findSku(catalog, "STB-ZERO-SPF-2X4-96-001");
assert.ok(spf96.supportedOps.includes("MILL_LONGITUDINAL_PROFILE"));
assert.ok(spf96.supportedOps.includes("MILL_END_PROFILE"));
assert.equal(capabilityAnswer(spf96, ["CROSSCUT", "MILL_LONGITUDINAL_PROFILE", "MILL_END_PROFILE"]).status, "SUPPORTABLE");

console.log("d001-stage2-envelope.test.mjs ok");
