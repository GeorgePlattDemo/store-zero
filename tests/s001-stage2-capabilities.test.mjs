import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSheetPackageJob } from "../src/evaluation/evaluators/sheet-package.mjs";
import { S001_STAGE2_ENVELOPE as E } from "../src/evaluation/envelopes/s001-stage2-envelope.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";

const opening=()=>({featureId:"OPENING",kind:"ARCHED_APERTURE",placement:"CENTERED",
  widthIn:36,straightHeightIn:24,riseIn:12,retain:"TABS",requestedTabCount:4});
const split=()=>({featureId:"CENTER-SPLIT",kind:"STRAIGHT_SPLIT",within:"OPENING",line:"VERTICAL_CENTERLINE"});
const cuts=()=>[{featureId:"CUT-L",kind:"CROSSCUT",fromEnd:"LEFT",distanceIn:18},
  {featureId:"CUT-R",kind:"CROSSCUT",fromEnd:"RIGHT",distanceIn:18}];
const demand=(features=[opening(),split(),...cuts()])=>({
  configurationId:"S001-ACCEPTANCE",configurationVersion:"stage2-0.2",
  sheet:{thicknessIn:0.5,lengthIn:96,widthIn:48,species:"pine",grade:"sheathing-4ply"},
  returnAllPieces:true,features
});
const run=(job=demand())=>evaluateSheetPackageJob(recordedCatalog(),job);

test("S-001 only has the half-inch cutter and exactly the preserved middle 48 x 36 field",()=>{
  assert.equal(E.router.toolDiameterIn,.5);
  assert.equal(E.router.toolPath,"COMPENSATED_INSIDE_FINISHED_APERTURE_TO_WASTE");
  assert.equal(E.workField.horizontalSpanIn,48);
  assert.equal(E.workField.verticalSpanIn,36);
  const a=run();
  assert.deepEqual({x0:a.workField.x0,x1:a.workField.x1,y0:a.workField.y0,y1:a.workField.y1},{x0:24,x1:72,y0:6,y1:42});
  assert.equal(a.features.apertures[0].finishedInsideOpeningIn.widthIn,36);
  assert.equal(a.features.apertures[0].toolRadiusCompensationIn,.25);
  assert.deepEqual(a.features.apertures[0].sweptToolBox,{x0:30,x1:66,y0:6,y1:42});
  assert.equal(a.evidence.commissioned,false);
  assert.equal(a.evidence.measured,false);
});

test("default job has seven retained perimeter tabs, two split tabs and $10 per yard cut with no double charge",()=>{
  const a=run();
  assert.equal(a.status,"SUPPORTABLE");
  assert.equal(a.features.apertures[0].tabPlan.plannedTabCount,7);
  assert.ok(a.features.apertures[0].tabPlan.retainedFraction>=0.05);
  assert.ok(a.features.apertures[0].tabPlan.maxUncutSpanIn<=24);
  assert.deepEqual(a.features.splits[0].splitTabs.positionsIn,[12,24]);
  assert.equal(a.totals.material,26.55);
  assert.equal(a.totals.machine_service,30.02);
  assert.equal(a.totals.manual_cut_service,20);
  assert.equal(a.Q,76.57);
  assert.equal(a.time.T_PANEL_SAW_sec,128.4);
  assert.equal(a.totals.Q,Math.round((a.totals.material+a.totals.machine_service+a.totals.manual_cut_service)*100)/100);
  const saw=a.operations.filter(o=>o.station==="YARD-PANEL-SAW");
  assert.deepEqual(saw.map(o=>o.opId),["CROSSCUT","CROSSCUT"]);
  assert.ok(saw.every(o=>o.price===10&&o.toleranceIn===.25));
  assert.ok(a.pieces.every(p=>p.disposition==="RETURNED_TO_OWNER"));
});

test("a full-length RIP is a supported 96-inch yard operation priced at a single $10 charge",()=>{
  const a=run(demand([{featureId:"RIP1",kind:"RIP",fromEdge:"BOTTOM",distanceIn:12}]));
  assert.equal(a.status,"SUPPORTABLE");
  assert.equal(a.features.rips[0].yIn,12);
  assert.equal(a.features.rips[0].lengthIn,96);
  assert.equal(a.features.rips[0].positionToleranceIn,.25);
  assert.equal(a.totals.manualCutCount,1);
  assert.equal(a.totals.manual_cut_service,10);
  assert.equal(a.Q,37.94);
  assert.deepEqual(a.operations.map(o=>o.opId),["RIP","LABEL"]);
  assert.equal(a.pieces.length,2);
});

test("tolerance-extreme collisions, narrow pieces, and unpriced orthogonal staging are refused",()=>{
  const near=run(demand([opening(),split(),{featureId:"CUT",kind:"CROSSCUT",fromEnd:"LEFT",distanceIn:29}]));
  assert.ok(near.reasonCodes.includes("CROSSCUT_INTERSECTS_ROUTED_FEATURE"));
  const narrow=run(demand([{featureId:"RIP",kind:"RIP",fromEdge:"BOTTOM",distanceIn:6}]));
  assert.ok(narrow.reasonCodes.includes("RIP_PIECE_BELOW_MINIMUM"));
  const intersection=run(demand([opening(),split(),...cuts(),{featureId:"RIP",kind:"RIP",fromEdge:"BOTTOM",distanceIn:12}]));
  assert.ok(intersection.reasonCodes.includes("RIP_INTERSECTS_ROUTED_FEATURE"));
  assert.ok(intersection.reasonCodes.includes("ORTHOGONAL_SAW_STAGING_NOT_DEFINED"));
  assert.equal(intersection.Q,null);
});

test("PATTERN translates a placement of the original opening, not a duplicate routing operation",()=>{
  const add=(x,y)=>demand([opening(),split(),...cuts(),{featureId:"PATTERN",kind:"PATTERN",within:"OPENING",offsetXIn:x,offsetYIn:y}]);
  const within=run(add(1,0));
  assert.equal(within.status,"SUPPORTABLE");
  assert.equal(within.features.apertures.length,1);
  assert.equal(within.features.apertures[0].box.x0,31);
  assert.equal(within.operations.filter(o=>o.opId==="ROUTE_PROFILE").length,2);
  assert.equal(within.featureAnswers.find(f=>f.featureId==="PATTERN").status,"ANSWERED");
  const beyond=run(add(7,0));
  assert.ok(beyond.reasonCodes.includes("CENTER_WORK_FIELD_EXCEEDED"));
  assert.equal(beyond.Q,null);
  const vertical=run(add(0,.5));
  assert.ok(vertical.reasonCodes.includes("CENTER_WORK_FIELD_EXCEEDED"));
  const lacking=run(demand([opening(),{featureId:"P",kind:"PATTERN",within:"OPENING"}]));
  assert.ok(lacking.reasonCodes.includes("PATTERN_OFFSETS_REQUIRED"));
});

test("CUSTOM tab positions survive unchanged; underspecified tabs and oversized gaps are refused",()=>{
  const chosen=[4,22,40,58,76,94,112];
  const custom=run(demand([{...opening(),tabMode:"CUSTOM",requestedTabCount:7,tabPositionsIn:chosen},split(),...cuts()]));
  assert.equal(custom.status,"SUPPORTABLE");
  assert.deepEqual(custom.features.apertures[0].tabPlan.candidates.map(t=>t.arclength_in),chosen);
  const tooFew=run(demand([{...opening(),tabMode:"CUSTOM",requestedTabCount:4,tabPositionsIn:chosen.slice(0,4)},split(),...cuts()]));
  assert.ok(tooFew.reasonCodes.includes("TAB_RETAINED_LENGTH_BELOW_FIVE_PERCENT"));
  assert.equal(tooFew.Q,null);
});

test("other materials retain distinct catalog pricing and half panels are refused",()=>{
  const fir=demand();fir.sheet={thicknessIn:.625,lengthIn:96,widthIn:48,species:"fir",grade:"BCX-sanded"};
  const a=run(fir);assert.equal(a.status,"SUPPORTABLE");assert.equal(a.material.storeSku,"STB-ZERO-PLY-063-48X96-001");
  assert.equal(a.time.passes,2);
  assert.equal(a.totals.manual_cut_service,20);
  const half=demand();half.sheet={thicknessIn:.375,lengthIn:48,widthIn:48,species:"fir",grade:"ACX"};
  assert.ok(run(half).reasonCodes.includes("SHEET_SIZE_OUTSIDE_S001_ENVELOPE"));
});
