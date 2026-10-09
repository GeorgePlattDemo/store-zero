import assert from "node:assert/strict";
import { loadCatalog } from "../src/evaluation/catalog.mjs";
import { evaluateCutPackageJob } from "../src/evaluation/evaluators/cut-package.mjs";
import { alcoveCutPackages } from "./fixtures/alcove-cut-packages.mjs";
import { D001_STAGE2_ENVELOPE } from "../src/evaluation/envelopes/d001-stage2-envelope.mjs";
import { spotPlungeIn, spotPointLengthIn } from "../src/evaluation/engine/d001-travel-standard.mjs";

// Declared spot: 3/16 in wide, one depth of 3/16 in at full diameter measured after the 118 degree point.
// Placement across the board: centered, or inset 1 1/2 in or 2 in from an edge.
// Time = travel to the spot location + travel across the board + plunge to depth at feed + retract.

const catalog = loadCatalog();

assert.equal(D001_STAGE2_ENVELOPE.spot.toolDiameterIn, 0.1875);
assert.equal(D001_STAGE2_ENVELOPE.spot.fullDiameterDepthIn, 0.1875);
assert.equal(D001_STAGE2_ENVELOPE.spot.pointAngleDeg, 118);
assert.equal(D001_STAGE2_ENVELOPE.spot.depthMeasuredFrom, "AFTER_DRILL_POINT");
assert.deepEqual(D001_STAGE2_ENVELOPE.spot.insetFromEdgeOptionsIn, [1.5, 2]);
assert.ok(Math.abs(spotPointLengthIn() - 0.056331) < 1e-6, "118 degree point on a 3/16 in bit is 0.056331 in long");
assert.ok(Math.abs(spotPlungeIn() - 0.243831) < 1e-6, "plunge = point + 3/16 in");

const uprights = (answer) => answer.packages.find((p) => p.packageId === "UPRIGHTS");
const job = (upright) => evaluateCutPackageJob(catalog, alcoveCutPackages({ upright }));

// Baseline: uprights with no spots.
const plain = uprights(job({}));
assert.equal(plain.status, "SUPPORTABLE");
assert.equal(plain.spotCount, 0);

// 1 1/2 in inset: one spot per shelf on each of the four uprights, timed and priced.
const at15 = uprights(job({ inset: 1.5 }));
assert.equal(at15.status, "SUPPORTABLE");
assert.equal(at15.spotCount, 4 * 5);
assert.ok(at15.time.T_DRILL_SPOT_sec > 0, "spot drilling time is not zero");
assert.ok(at15.time.T_MACHINE_sec > plain.time.T_MACHINE_sec);
assert.ok(at15.Q > plain.Q, "spots are priced through machine time");

// 2 in inset: declared, travels further across the board.
const at2 = uprights(job({ inset: 2 }));
assert.equal(at2.status, "SUPPORTABLE");
assert.ok(at2.time.T_DRILL_SPOT_sec > at15.time.T_DRILL_SPOT_sec);

// An inset that is not declared is refused, not rounded.
assert.ok(uprights(job({ inset: 1.75 })).reasonCodes.includes("SPOT_INSET_NOT_DECLARED"));

// A spot beyond the upright is refused.
const past = uprights(job({ inset: 1.5, xIn: 80 }));
assert.equal(past.status, "REFUSED");
assert.ok(past.reasonCodes.some((code) => /SPOT_LOCATION_OUTSIDE/.test(code)));

console.log("spot-inset-depth: ok", {
  plungeIn: Number(spotPlungeIn().toFixed(6)),
  noSpots: { min: plain.time.T_MACHINE_min, Q: plain.Q },
  inset15: { spotSec: at15.time.T_DRILL_SPOT_sec, min: at15.time.T_MACHINE_min, Q: at15.Q },
  inset2: { spotSec: at2.time.T_DRILL_SPOT_sec, min: at2.time.T_MACHINE_min, Q: at2.Q }
});
