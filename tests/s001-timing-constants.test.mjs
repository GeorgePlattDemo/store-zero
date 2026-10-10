import test from "node:test";
import assert from "node:assert/strict";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { evaluateSheetPackageJob } from "../src/evaluation/evaluators/sheet-package.mjs";
import { S001_STAGE2_ENVELOPE } from "../src/evaluation/envelopes/s001-stage2-envelope.mjs";

const ENV = S001_STAGE2_ENVELOPE;

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

const evaluate = (demand = playhouse()) => evaluateSheetPackageJob(recordedCatalog(), demand);
const r3 = (v) => Math.round(v * 1000) / 1000;

// Hand geometry for the canonical opening: R = 36²/(8·12) + 12/2 = 19.5; the arc spans 2·asin(18/19.5) = 2·asin(12/13),
// so arc = 39·asin(12/13); the profile is bottom 36 + two straight sides 2·24 + arc. The split runs the full 24 + 12 = 36 in.
const ARC_IN = 39 * Math.asin(12 / 13);
const APERTURE_PERIMETER_IN = 36 + 2 * 24 + ARC_IN;
const SPLIT_LENGTH_IN = 24 + 12;
const ROUTED_IN = APERTURE_PERIMETER_IN - Math.PI * (ENV.router.toolDiameterIn / 2) * 2 + SPLIT_LENGTH_IN;

test("load-and-reference is 120 s once per routed sheet", () => {
  // Rule: loadSeatReferenceSec = 120 is charged once when anything is routed.
  assert.equal(ENV.router.loadSeatReferenceSec, 120);
  assert.equal(evaluate().time.T_LOAD_REFERENCE_sec, 120);
});

test("release-and-unload is 60 s once per routed sheet", () => {
  // Rule: releaseUnloadSec = 60 is charged once when anything is routed.
  assert.equal(ENV.router.releaseUnloadSec, 60);
  assert.equal(evaluate().time.T_RELEASE_sec, 60);
});

test("router feed is 60 in/min over the compensated aperture centerline plus the split length", () => {
  // Rule: T_ROUTE = routed inches × passes / 60 in/min × 60 s/min.
  assert.equal(ENV.router.routeFeedInPerMin, 60);
  const answer = evaluate();
  assert.equal(answer.time.routedLengthIn, Math.round(ROUTED_IN * 10000) / 10000);
  assert.equal(answer.time.routedLengthIn, 164.2934);
  assert.equal(answer.time.T_ROUTE_sec, r3((ROUTED_IN * 1 / 60) * 60));
  assert.equal(answer.time.T_ROUTE_sec, 164.293);
  const route = answer.operations.filter((op) => op.opId === "ROUTE_PROFILE");
  assert.deepEqual(route.map((op) => op.lengthIn), [Math.round((APERTURE_PERIMETER_IN - Math.PI * ENV.router.toolDiameterIn) * 1e6) / 1e6, SPLIT_LENGTH_IN]);
});

test("pass depth is 0.5 in: a 1/2 in sheet routes in one pass, a 3/4 in sheet in two", () => {
  // Rule: passes = ceil(thickness / 0.5 in); every per-pass step time scales with it.
  assert.equal(ENV.router.passDepthIn, 0.5);
  const half = evaluate();
  assert.equal(half.time.passes, 1);
  const demand = playhouse();
  demand.sheet = { ...demand.sheet, thicknessIn: 0.75, species: "fir", grade: "ACX-sanded" }; // two 3/4 in materials are offered
  const threeQuarter = evaluate(demand);
  assert.equal(threeQuarter.status, "SUPPORTABLE");
  assert.equal(threeQuarter.time.passes, 2); // ceil(0.75 / 0.5) = 2
  assert.equal(threeQuarter.time.T_ROUTE_sec, r3(ROUTED_IN * 2)); // compensated two-pass route
  assert.equal(threeQuarter.time.T_ROUTE_sec, 328.587);
  assert.equal(threeQuarter.time.T_PLUNGE_sec, 2 * 2 * 10); // 2 profiles × 2 passes × 10 s
  assert.equal(threeQuarter.time.T_TAB_sec, 9 * 2 * 2); // 9 tabs × 2 passes × 2 s
  assert.ok(threeQuarter.operations.filter((op) => op.opId === "ROUTE_PROFILE").every((op) => op.passes === 2));
});

test("plunge-and-retract is 10 s per routed profile per pass", () => {
  // Rule: T_PLUNGE = (apertures + splits) × passes × 10 s; the playhouse routes 2 profiles in 1 pass.
  assert.equal(ENV.router.plungeRetractSec, 10);
  assert.equal(evaluate().time.T_PLUNGE_sec, 2 * 1 * 10);
});

test("tab lift is 2 s per planned tab per pass", () => {
  // Rule: T_TAB = planned tabs × passes × 2 s; 4 requested + 1 reserve = 7 aperture tabs and two split tabs.
  assert.equal(ENV.router.tabLiftSec, 2);
  const answer = evaluate();
  assert.equal(answer.features.apertures[0].tabPlan.plannedTabCount, 7);
  assert.equal(answer.time.T_TAB_sec, 9 * 1 * 2);
});

test("panel-saw set-and-align is 45 s per crosscut", () => {
  // Rule: every crosscut costs 45 s of set-and-align on top of its feed time.
  assert.equal(ENV.panelSaw.setAndAlignSec, 45);
  const one = evaluate(playhouse({ cuts: [18, null] }));
  assert.equal(one.time.T_PANEL_SAW_sec, r3(45 + (48 / 150) * 60)); // 64.2
  const none = evaluate(playhouse({ cuts: [null, null] }));
  assert.equal(none.time.T_PANEL_SAW_sec, 0);
  assert.equal(r3(evaluate().time.T_PANEL_SAW_sec - 2 * (48 / 150) * 60), 2 * 45);
});

test("panel-saw feed is 150 in/min across the full 48 in sheet width", () => {
  // Rule: each crosscut feeds 48 in at 150 in/min = 19.2 s.
  assert.equal(ENV.panelSaw.cutFeedInPerMin, 150);
  const answer = evaluate();
  assert.deepEqual(answer.operations.filter((op) => op.opId === "CROSSCUT").map((op) => op.lengthIn), [48, 48]);
  assert.equal(answer.time.T_PANEL_SAW_sec, r3(2 * (45 + (48 / 150) * 60)));
  assert.equal(answer.time.T_PANEL_SAW_sec, 128.4);
});

test("labeling is 10 s per returned piece", () => {
  // Rule: T_LABEL = returned pieces × 10 s; 3 sheet pieces + 2 split centers = 5, and with no crosscuts 1 frame + 2 centers = 3.
  assert.equal(ENV.label.perPieceSec, 10);
  const answer = evaluate();
  assert.equal(answer.pieces.length, 5);
  assert.equal(answer.time.T_LABEL_sec, 5 * 10);
  const uncut = evaluate(playhouse({ cuts: [null, null] }));
  assert.equal(uncut.pieces.length, 3);
  assert.equal(uncut.time.T_LABEL_sec, 3 * 10);
});

test("machine time is the sum of every step, and machine service prices it at the shared hourly rate", () => {
  // Rule: T_MACHINE = load + route + plunge + tab + release + saw + label; hourly service excludes saw time, which is charged flat per cut.
  const answer = evaluate();
  const total = 120 + ROUTED_IN + 20 + 18 + 60 + 2 * (45 + (48 / 150) * 60) + 50;
  assert.equal(answer.time.T_MACHINE_sec, r3(total));
  assert.equal(answer.time.T_MACHINE_sec, 560.693);
  assert.equal(answer.time.T_MACHINE_min, Math.round((total / 60) * 10000) / 10000);
  assert.equal(answer.time.T_MACHINE_min, 9.3449);
  assert.equal(answer.totals.sellRatePerHour, 250);
  assert.equal(answer.totals.machine_service, Math.round(((560.693 - 128.4) / 3600) * 250 * 100) / 100);
  assert.equal(answer.totals.machine_service, 30.02);
  assert.equal(answer.totals.material, 26.55);
  assert.equal(answer.totals.manual_cut_service, 20);
  assert.equal(answer.totals.Q, 76.57);
});
