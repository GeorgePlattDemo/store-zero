import test from "node:test";
import assert from "node:assert/strict";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { evaluateSheetPackageJob } from "../src/evaluation/evaluators/sheet-package.mjs";

// The canonical playhouse window: one 1/2 in sheet, a centered 36 in arched opening split down the middle,
// and two crosscuts 18 in from each end. Every piece goes back to the owner.
function playhouse({ widthIn = 36, straightHeightIn = 24, riseIn = 12, cuts = [18, 18], ...extra } = {}) {
  const features = [
    { featureId: "OPENING", kind: "ARCHED_APERTURE", placement: "CENTERED", widthIn, straightHeightIn, riseIn, retain: "TABS", requestedTabCount: 4 },
    { featureId: "CENTER-SPLIT", kind: "STRAIGHT_SPLIT", within: "OPENING", line: "VERTICAL_CENTERLINE" }
  ];
  if (cuts[0] != null) features.push({ featureId: "CUT-LEFT", kind: "CROSSCUT", fromEnd: "LEFT", distanceIn: cuts[0] });
  if (cuts[1] != null) features.push({ featureId: "CUT-RIGHT", kind: "CROSSCUT", fromEnd: "RIGHT", distanceIn: cuts[1] });
  return {
    configurationId: "PLAYHOUSE-ARCHED-WINDOW",
    configurationVersion: `w${widthIn}-h${straightHeightIn}-r${riseIn}-c${cuts.join("/")}`,
    sheet: { thicknessIn: 0.5, lengthIn: 96, widthIn: 48 },
    features,
    returnAllPieces: true,
    ...extra
  };
}

const SHEET_SKU = "STB-ZERO-PLY-050-48X96-001";
// A recorded catalog with the playhouse sheet row cloned and changed; the frozen catalog itself is never touched.
function catalogWithSheet(change) {
  const catalog = recordedCatalog();
  catalog.offerings = catalog.offerings.map((row) => {
    if (row.storeSku !== SHEET_SKU) return row;
    const copy = structuredClone(row);
    change(copy);
    return copy;
  });
  return catalog;
}
const evaluate = (demand, catalog = recordedCatalog()) => evaluateSheetPackageJob(catalog, demand);
const feature = (answer, id) => answer.featureAnswers.find((f) => f.featureId === id);
const priceless = (answer) => {
  assert.equal(answer.Q, null);
  assert.equal(answer.totals, null);
  assert.equal(answer.operations, null);
};

test("baseline: the unchanged playhouse against the recorded catalog is SUPPORTABLE", () => {
  // Rule: every branch fixture below differs from this one SUPPORTABLE demand by a single fact.
  const answer = evaluate(playhouse());
  assert.equal(answer.status, "SUPPORTABLE");
  assert.deepEqual(answer.reasonCodes, []);
});

test("an aperture not placed CENTERED is REFUSED", () => {
  // Rule: the sheet cell declares only a centered arched opening; any other placement is APERTURE_PLACEMENT_NOT_DECLARED.
  const demand = playhouse();
  demand.features[0].placement = "LEFT";
  const answer = evaluate(demand);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["APERTURE_PLACEMENT_NOT_DECLARED"]);
  assert.deepEqual(feature(answer, "OPENING").reasonCodes, ["APERTURE_PLACEMENT_NOT_DECLARED"]);
  priceless(answer);
});

test("an aperture retained by anything but TABS is REFUSED", () => {
  // Rule: routed pieces stay attached by tabs; other retention is APERTURE_RETENTION_MUST_BE_TABS.
  const demand = playhouse();
  demand.features[0].retain = "VACUUM";
  const answer = evaluate(demand);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["APERTURE_RETENTION_MUST_BE_TABS"]);
  priceless(answer);
});

test("a zero or negative aperture dimension is REFUSED as APERTURE_SIZE_INVALID", () => {
  // Rule: width, straight height and rise must each be positive.
  for (const key of ["widthIn", "straightHeightIn", "riseIn"]) {
    for (const value of [0, -1]) {
      const demand = playhouse();
      demand.features[0][key] = value;
      const answer = evaluate(demand);
      assert.equal(answer.status, "REFUSED", `${key}=${value}`);
      assert.deepEqual(answer.reasonCodes, ["APERTURE_SIZE_INVALID"], `${key}=${value}`);
      assert.deepEqual(answer.features.apertures, []);
    }
  }
});

test("several aperture faults are all named, placement first", () => {
  // Rule: aperture checks run placement → retention → size, and every fault found is reported in that order.
  const demand = playhouse();
  Object.assign(demand.features[0], { placement: "LEFT", retain: "VACUUM", widthIn: 0 });
  const answer = evaluate(demand);
  assert.equal(answer.status, "REFUSED");
  assert.equal(answer.reasonCodes[0], "APERTURE_PLACEMENT_NOT_DECLARED");
  assert.deepEqual(answer.reasonCodes, ["APERTURE_PLACEMENT_NOT_DECLARED", "APERTURE_RETENTION_MUST_BE_TABS", "APERTURE_SIZE_INVALID"]);
});

test("a split on any line but the vertical centerline is REFUSED", () => {
  // Rule: the only declared split is VERTICAL_CENTERLINE; any other is SPLIT_LINE_NOT_DECLARED on the split feature.
  const demand = playhouse();
  demand.features[1].line = "HORIZONTAL_CENTERLINE";
  const answer = evaluate(demand);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["SPLIT_LINE_NOT_DECLARED"]);
  assert.equal(feature(answer, "CENTER-SPLIT").status, "REFUSED");
  assert.equal(feature(answer, "OPENING").status, "ANSWERED");
  priceless(answer);
});

test("a crosscut measured from an end other than LEFT or RIGHT is REFUSED", () => {
  // Rule: crosscuts are measured from the LEFT or RIGHT end; anything else is CROSSCUT_END_NOT_DECLARED.
  const demand = playhouse();
  demand.features[2].fromEnd = "TOP";
  const answer = evaluate(demand);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["CROSSCUT_END_NOT_DECLARED"]);
  assert.deepEqual(feature(answer, "CUT-LEFT").reasonCodes, ["CROSSCUT_END_NOT_DECLARED"]);
  assert.equal(feature(answer, "CUT-RIGHT").status, "ANSWERED");
  // With no distance either, the end refusal comes first and the missing distance is still left open.
  const both = playhouse();
  both.features[2].fromEnd = "TOP";
  delete both.features[2].distanceIn;
  const answer2 = evaluate(both);
  assert.equal(answer2.status, "REFUSED");
  assert.deepEqual(answer2.reasonCodes, ["CROSSCUT_END_NOT_DECLARED", "CROSSCUT_DISTANCE_MISSING"]);
});

test("a matching sheet row with offered:false is REFUSED as SHEET_NOT_OFFERED", () => {
  // Rule: a listed but unoffered sheet is never sold; there is no fallback to another sheet.
  const answer = evaluate(playhouse(), catalogWithSheet((row) => { row.offered = false; }));
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["SHEET_NOT_OFFERED"]);
  assert.equal(answer.material, null);
  priceless(answer);
});

test("a matching sheet with no selling price is UNRESOLVED as MISSING_PRICE", () => {
  // Rule: Store Zero does not price a job on a sheet that has no selling price.
  const answer = evaluate(playhouse(), catalogWithSheet((row) => { row.sellingPrice = null; }));
  assert.equal(answer.status, "UNRESOLVED");
  assert.deepEqual(answer.reasonCodes, ["MISSING_PRICE"]);
  assert.equal(answer.material, null);
  priceless(answer);
});

test("a sheet offering that lacks a needed operation or the S-001 cell is REFUSED as OPERATION_NOT_ON_SHEET_OFFERING", () => {
  // Rule: the offering must list ROUTE_PROFILE and CROSSCUT for this package and belong to the S-001 cell family.
  const noRoute = evaluate(playhouse(), catalogWithSheet((row) => { row.supportedOps = ["CROSSCUT", "RIP"]; }));
  assert.equal(noRoute.status, "REFUSED");
  assert.deepEqual(noRoute.reasonCodes, ["OPERATION_NOT_ON_SHEET_OFFERING"]);
  const noCrosscut = evaluate(playhouse(), catalogWithSheet((row) => { row.supportedOps = ["ROUTE_PROFILE"]; }));
  assert.deepEqual(noCrosscut.reasonCodes, ["OPERATION_NOT_ON_SHEET_OFFERING"]);
  // Without crosscuts, CROSSCUT is no longer needed and the same row is accepted.
  const uncut = evaluate(playhouse({ cuts: [null, null] }), catalogWithSheet((row) => { row.supportedOps = ["ROUTE_PROFILE"]; }));
  assert.equal(uncut.status, "SUPPORTABLE");
  const noCell = evaluate(playhouse(), catalogWithSheet((row) => { row.cellFamily = []; }));
  assert.equal(noCell.status, "REFUSED");
  assert.deepEqual(noCell.reasonCodes, ["OPERATION_NOT_ON_SHEET_OFFERING"]);
});

test("returnAllPieces missing or null is UNRESOLVED as RETURN_ALL_PIECES_REQUIRED", () => {
  // Rule: a sheet package must state that every piece is returned; silence is not consent.
  const missing = playhouse();
  delete missing.returnAllPieces;
  for (const demand of [missing, playhouse({ returnAllPieces: null })]) {
    const answer = evaluate(demand);
    assert.equal(answer.status, "UNRESOLVED");
    assert.deepEqual(answer.reasonCodes, ["RETURN_ALL_PIECES_REQUIRED"]);
    priceless(answer);
  }
});

test("returnAllPieces false (or anything but true) is REFUSED as PIECE_DISPOSAL_NOT_OFFERED", () => {
  // Rule: Store Zero returns every piece; it never keeps or discards one, and only the literal true states that.
  for (const value of [false, "true", 1]) {
    const answer = evaluate(playhouse({ returnAllPieces: value }));
    assert.equal(answer.status, "REFUSED", String(value));
    assert.deepEqual(answer.reasonCodes, ["PIECE_DISPOSAL_NOT_OFFERED"]);
    priceless(answer);
  }
  // It is checked before the features, so it is the first reason when a feature also fails.
  const demand = playhouse({ returnAllPieces: false });
  demand.features[0].placement = "LEFT";
  const answer = evaluate(demand);
  assert.equal(answer.reasonCodes[0], "PIECE_DISPOSAL_NOT_OFFERED");
  assert.deepEqual(answer.reasonCodes, ["PIECE_DISPOSAL_NOT_OFFERED", "APERTURE_PLACEMENT_NOT_DECLARED"]);
});

test("a null sheet thickness is UNRESOLVED as SHEET_SIZE_MISSING, never treated as 0", () => {
  // Rule: null/missing inches stay missing; Number(null) = 0 must not turn it into a thickness-envelope refusal or a sheet match.
  for (const thicknessIn of [null, undefined, ""]) {
    const demand = playhouse();
    demand.sheet.thicknessIn = thicknessIn;
    const answer = evaluate(demand);
    assert.equal(answer.status, "UNRESOLVED", String(thicknessIn));
    assert.deepEqual(answer.reasonCodes, ["SHEET_SIZE_MISSING"]);
    assert.deepEqual(answer.refusalConditions, []);
    assert.equal(answer.material, null);
    priceless(answer);
  }
  // A stated 0 is a real thickness, and is refused by the envelope: the two must differ.
  const zero = playhouse();
  zero.sheet.thicknessIn = 0;
  const answer = evaluate(zero);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["SHEET_THICKNESS_OUTSIDE_S001_ENVELOPE", "NO_MATCHING_SHEET_OFFERING"]);
  // With returnAllPieces also missing, the sheet gap is named first.
  const twoGaps = playhouse();
  twoGaps.sheet.thicknessIn = null;
  delete twoGaps.returnAllPieces;
  assert.deepEqual(evaluate(twoGaps).reasonCodes, ["SHEET_SIZE_MISSING", "RETURN_ALL_PIECES_REQUIRED"]);
});
