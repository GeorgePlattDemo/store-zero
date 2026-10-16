import test from 'node:test';
import assert from 'node:assert/strict';
import {runSelfChecks} from './core-self-checks.mjs';
import {loadCatalog} from '../src/evaluation/catalog.mjs';
test('declared manufacturing core: 22 independent guide, inventory, geometry and Q checks',async()=>{const result=await runSelfChecks(loadCatalog());assert.equal(result.passed,22);});

import {evaluateStoreRequest} from '../src/requests/store-request.mjs';
import {identifiedRequest} from './fixtures/manifest.mjs';
import {compileDefinition,evaluateManufacturingJob} from '../src/evaluation/engine/store-manufacturing-core.mjs';
import {USER1_DIMENSIONAL_TRAVEL_DEMAND} from './fixtures/user1-dimensional-travel-fixture.mjs';
import {loadMachineConfig} from '../src/machine/configuration.mjs';

function angledBraces(angleDeg=25) {
 const demand={configurationId:'OUTDOOR-BRACE-GEOMETRY',configurationVersion:'geometry-1',
  cutPackages:[{packageId:'BRACES',material:{species:'syp-treated',form:'board',nominalT:2,nominalW:4,grade:'above-ground'},
  endCut:{angleDeg,endRelation:'parallel',lengthDatum:'long-point-to-short-point',
    endPointOrientation:'long-to-short',plane:'miter-face'},
  parts:[{partId:'BRACE-01',lengthIn:32.875},{partId:'BRACE-02',lengthIn:32.875}]}]};
 return identifiedRequest('CUT_PACKAGE_V1',demand,'OUTDOOR-GEOMETRY-TEST');
}
test('the 25-degree parallel cross support derives stock envelope from the actual 2x4 width',()=>{
 const r=evaluateStoreRequest(angledBraces(),{release:'GEOMETRY-TEST',catalog:loadCatalog(),now:()=>new Date().toISOString()});
 assert.equal(r.status,'SUPPORTABLE',JSON.stringify(r.reasonRecords));
 const envelope=32.875+3.5*Math.tan(25*Math.PI/180);
 const events=r.operations.filter(e=>e.kind==='STOCK_ENVELOPE_DERIVED');
 assert.equal(events.length,2);
 for(const event of events){
  assert.ok(Math.abs(event.stockEnvelopeLengthIn-envelope)<1e-9);
  assert.ok(Math.abs(event.endOffsetIn-(envelope-32.875))<1e-9);
  assert.equal(event.lengthDatum,'long-point-to-short-point');
 }
 assert.ok(r.components.every(c=>Math.abs(c.stockEnvelopeLengthIn-envelope)<1e-9));
 const parents=r.parents.filter(p=>p.components?.length);
 for(const p of parents)assert.ok(p.remainingLengthIn<=p.stockL_in-p.components.length*envelope-0.125*(p.components.length+1)+1e-9);
});
test('inventory capacity rejects two angled parts that fit only when their offsets are ignored',()=>{
 const request=angledBraces(),compiled=compileDefinition({requestType:request.requestType,requestId:request.requestId,demand:request.demand},request.manifest);
 assert.equal(compiled.status,'COMPILED');
 const row=loadCatalog().offerings.find(o=>o.storeSku==='STB-ZERO-PT-2X4-96-001');
 assert.ok(row);
 const r=evaluateManufacturingJob({offerings:[{...row,stockL_in:92,onHand:1,allocated:0}]},compiled.job);
 assert.equal(r.status,'UNAVAILABLE',JSON.stringify(r.reasonRecords));
 assert.ok(r.reasonCodes.includes('ON_HAND_SHORT'));
 assert.equal(r.stockShortage.eligibleStock[0].maxPartsPerParent,1);
 assert.ok(r.stockShortage.eligibleStock[0].partStockEnvelopeIn>34.5);
});
test('unsupported end angle is refused with an actual reason code and human-readable message',()=>{
 const r=evaluateStoreRequest(angledBraces(50),{release:'GEOMETRY-TEST',catalog:loadCatalog(),now:()=>new Date().toISOString()});
 assert.equal(r.status,'REFUSED');
 assert.deepEqual(r.reasonCodes,['END_ANGLE_OUTSIDE_MODEL']);
 assert.equal(r.reasonRecords[0].message,r.reasonMessage);
 assert.equal(r.reasonMessage,'Requested end angle 50° exceeds the registered saw limit of 45°.');
 assert.equal(r.Q,null);
});
test('an unrecognized measurement datum stays unresolved without a guessed conversion',()=>{
 const request=angledBraces();
 request.demand.cutPackages[0].endCut.lengthDatum='midpoint-to-midpoint';
 delete request.demand.cutPackages[0].endCut.endPointOrientation;
 const r=evaluateStoreRequest(request,{release:'GEOMETRY-TEST',catalog:loadCatalog(),now:()=>new Date().toISOString()});
 assert.equal(r.status,'UNRESOLVED');
 assert.ok(r.reasonCodes.includes('LENGTH_DATUM_GEOMETRY_UNRESOLVED'));
 assert.ok(r.reasonMessage.length>20);
 assert.equal(r.Q,null);
});

test('D-001 registered 3/16-in pointed-drill spot is never modeled deeper than its full-diameter reference',()=>{
 const registered=loadMachineConfig().model.dimensional.spot;
 assert.equal(registered.diameterIn,0.1875);
 assert.equal(registered.fullDiameterDepthIn,0.1875);
 assert.equal(registered.pointAngleDeg,118);
 const nominal=structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND);
 nominal.materialDemand.grade='construction';
 const ask=(d,requestId)=>evaluateStoreRequest(identifiedRequest('USER_DEFINED_BOARD_V1',d,requestId),
   {release:'SPOT-BOUNDARY-TEST',catalog:loadCatalog(),now:()=>new Date().toISOString()});
 const answer=ask(nominal,'nominal');
 assert.equal(answer.status,'SUPPORTABLE',JSON.stringify(answer.reasonCodes));
 const pointHeight=(registered.diameterIn/2)/Math.tan(registered.pointAngleDeg*Math.PI/360);
 const plunge=registered.fullDiameterDepthIn+pointHeight;
 const parent=answer.parents.find(p=>p.kind==='board');
 assert.ok(parent);
 const spotMoves=answer.operations.filter(e=>e.kind==='MOVE'&&e.axis==='Z'&&e.category==='SPOT'&&e.target<parent.actualT);
 assert.equal(spotMoves.length,2);
 for(const move of spotMoves) assert.ok(Math.abs(move.target-(parent.actualT-plunge))<1e-9);
 const explicitlySame=structuredClone(nominal);
 explicitlySame.parts[0].features[0].fullDiameterDepthIn=0.1875;
 assert.equal(ask(explicitlySame,'exact').status,'SUPPORTABLE');
 const deeper=structuredClone(nominal);
 deeper.parts[0].features[0].fullDiameterDepthIn=0.25;
 const refused=ask(deeper,'deeper');
 assert.equal(refused.status,'REFUSED');
 assert.ok(refused.reasonCodes.includes('SPOT_FULL_DIAMETER_DEPTH_EXCEEDS_MAX'));
 assert.equal(refused.Q,null);
 const shallower=structuredClone(nominal);
 shallower.parts[0].features[0].fullDiameterDepthIn=0.125;
 shallower.parts[0].features[0].locationRule='PART_RELATIVE_FROM_START';
 shallower.parts[0].features[0].xIn=5.25;
 const shortened=ask(shallower,'shallower');
 assert.equal(shortened.status,'SUPPORTABLE',JSON.stringify(shortened.reasonRecords));
 const spotDrillZ=shortened.operations.filter(e=>e.kind==='MOVE'&&e.axis==='Z'&&e.category==='SPOT'&&e.subject==='SPOT-1'&&e.target<parent.actualT);
 assert.equal(spotDrillZ.length,1);
 assert.ok(Math.abs(spotDrillZ[0].target-(parent.actualT-pointHeight-0.125))<1e-9);
 const defaultDepthMove=answer.operations.find(e=>e.kind==='MOVE'&&e.axis==='Z'&&e.category==='SPOT'&&e.subject==='SPOT-1'&&e.target<parent.actualT);
 assert.ok(defaultDepthMove,'the default depth must produce a modeled plunge');
 assert.ok(spotDrillZ[0].seconds < defaultDepthMove.seconds,
   'the shallower plunge must be shorter even when the selected X changes indexed travel time');
 assert.notEqual(shortened.time.totalSeconds,answer.time.totalSeconds,'changing the job must recalculate whole-job timing');
 assert.notEqual(shortened.calculationIdentity.resultHash,answer.calculationIdentity.resultHash);
 const invalidLocation=structuredClone(shallower);
 invalidLocation.parts[0].features[0].xIn=0;
 const locationRefusal=ask(invalidLocation,'off-board');
 assert.equal(locationRefusal.status,'REFUSED');
 assert.ok(locationRefusal.reasonCodes.includes('SPOT_TOOL_LEAVES_PART_END'));
 const wrongDiameter=structuredClone(nominal);
 wrongDiameter.parts[0].features[0].toolDiameterIn=0.25;
 const wrongDrill=ask(wrongDiameter,'wrong-drill');
 assert.equal(wrongDrill.status,'REFUSED');
 assert.ok(wrongDrill.reasonCodes.includes('SPOT_DIAMETER_NOT_DECLARED'));
 const missingInterpretation=structuredClone(nominal);
 missingInterpretation.parts[0].features[0].kind='FLAT_BOTTOM_SPOTFACE';
 const flat=ask(missingInterpretation,'flat-surface');
 assert.equal(flat.status,'REFUSED');
 assert.ok(flat.reasonCodes.includes('FEATURE_KIND_NOT_HANDLED'));
});
