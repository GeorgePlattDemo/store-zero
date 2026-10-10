import test from "node:test";
import assert from "node:assert/strict";
import { STENCIL_TAB_POLICY_V0 as POLICY, planArchedStencilTabs, planSplitStencilTabs, archedAperturePerimeter } from "../src/evaluation/engine/stencil-tab-policy.mjs";
import { referenceArchedAperture } from "../src/evaluation/engine/circular-segment.mjs";

const ref=referenceArchedAperture();
const geometry={chord_in:ref.chord_in,rise_in:ref.rise_in,radius_in:ref.radius_in,straightHeight_in:ref.apertureStraightH_in};
const make=(options={})=>planArchedStencilTabs({...geometry,requestedTabCount:4,...options});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,String(a)+" != "+String(b));

test("one-inch tab bridges cover at least five percent of the reference contour and never exceed 24 inches of free cut",()=>{
  const p=make(),g=archedAperturePerimeter(geometry);
  assert.equal(POLICY.minBridgeWidth_in,1);
  assert.equal(POLICY.maxAllowedGap_in,24);
  assert.equal(POLICY.minimumRetainedFraction,0.05);
  assert.equal(p.ok,true);
  assert.equal(p.tabMode,"AUTO_PLAN");
  assert.equal(p.plannedTabCount,8);
  close(p.perimeter_in,g.perimeter_in);
  assert.ok(p.retainedFraction>=0.05);
  assert.ok(p.maxUncutSpanIn<=24);
  assert.equal(p.candidates.length,p.plannedTabCount);
  assert.ok(p.candidates.every(t=>t.bridgeWidthIn===1&&t.distanceToNearestTransition_in>=0.5));
  for(const c of p.candidates)close(c.arclength_in/p.perimeter_in,c.normalizedArclength);
});

test("a customer chooses exact arclength positions and Store does not reposition them",()=>{
  const placed=[9,28,47,66,85,104,123,142];
  const p=make({tabMode:"CUSTOM",requestedTabCount:8,tabPositionsIn:placed});
  assert.equal(p.ok,true);
  assert.equal(p.placementMethod,"CUSTOM_ARCLENGTH");
  assert.deepEqual(p.candidates.map(t=>t.arclength_in),placed);
  assert.ok(p.retainedFraction>=0.05);
  assert.ok(p.maxUncutSpanIn<=24);
});

test("bad custom tab geometry is refused without a fallback",()=>{
  assert.equal(make({tabMode:"CUSTOM",tabPositionsIn:null}).reason,"TAB_CUSTOM_POSITIONS_REQUIRED");
  assert.equal(make({tabMode:"CUSTOM",requestedTabCount:4,tabPositionsIn:[9,27,45,63]}).reason,"TAB_RETAINED_LENGTH_BELOW_FIVE_PERCENT");
  assert.equal(make({tabMode:"CUSTOM",requestedTabCount:8,tabPositionsIn:[9,10,30,50,70,90,110,130]}).reason,"TAB_UNCUT_SPAN_EXCEEDS_24_IN");
  assert.equal(make({tabMode:"CUSTOM",requestedTabCount:8,tabPositionsIn:[0,19,38,57,76,95,114,133]}).reason,"TAB_WITHIN_CORNER_OR_TRANSITION_KEEPOUT");
  assert.equal(make({tabMode:"CUSTOM",requestedTabCount:8,tabPositionsIn:[9,9.5,38,57,76,95,114,133]}).reason,"TAB_BRIDGES_OVERLAP");
});

test("split retains two perimeter tabs on each half; CUSTOM cannot be silently repaired",()=>{
  const p=make(),result=planSplitStencilTabs(p,geometry);
  assert.equal(result.ok,true);
  assert.ok(result.split.leftPieceTabs>=2);
  assert.ok(result.split.rightPieceTabs>=2);
  const selected=make({tabMode:"CUSTOM",requestedTabCount:8,tabPositionsIn:[9,28,47,66,85,104,123,142]});
  assert.equal(selected.ok,true);
  // A later split/collision constraint removes the right-side supports. CUSTOM may not add hidden tabs.
  const rejected=planSplitStencilTabs({...selected,candidates:selected.candidates.filter(t=>t.x_in<=0)},geometry);
  assert.equal(rejected.ok,false);
  assert.equal(rejected.reason,"CUSTOM_TAB_LOCATIONS_DO_NOT_RETAIN_EACH_HALF");
});
