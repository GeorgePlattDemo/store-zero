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
import {operationProblems} from '../src/contracts/machine-records.mjs';

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
 assert.deepEqual(operationProblems(r.operations),[]);
 const unknown=structuredClone(r.operations);unknown.find(e=>e.kind==='STOCK_ENVELOPE_DERIVED').kind='UNREGISTERED_ENVELOPE';
 assert.ok(operationProblems(unknown).includes('OPERATION_KIND_NOT_DECLARED'));
 const extra=structuredClone(r.operations);extra.find(e=>e.kind==='STOCK_ENVELOPE_DERIVED').machineCommand='MOVE';
 assert.ok(operationProblems(extra).includes('OCCUPANCY_SEQUENCE_INVALID'));
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

// Explicit operands are not defaults, including malformed JSON values.
test('each spot depth independently controls its own move and invalid depths never become nominal',()=>{
 const registration=loadMachineConfig().model.dimensional.spot;
 assert.equal(registration.maximumFullDiameterDepthIn,0.1875);
 const ask=d=>evaluateStoreRequest(identifiedRequest('USER_DEFINED_BOARD_V1',d,'INDEPENDENT-DEPTHS'),{release:'DEPTHS',catalog:loadCatalog(),now:()=> '2026-10-16T12:00:00.000Z'});
 const demand=structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND);
 demand.parts[0].features[0].fullDiameterDepthIn=0.125;
 demand.parts[1].features[0].fullDiameterDepthIn=0.0625;
 const answer=ask(demand);assert.equal(answer.status,'SUPPORTABLE',JSON.stringify(answer.reasonRecords));
 const point=(registration.diameterIn/2)/Math.tan(registration.pointAngleDeg*Math.PI/360);
 const thickness=answer.parents.find(p=>p.kind==='board').actualT;
 for(const [i,depth] of [0.125,0.0625].entries()){
  const moves=answer.operations.filter(o=>o.kind==='MOVE'&&o.axis==='Z'&&o.subject==='SPOT-'+(i+1)&&o.target<thickness);
  assert.equal(moves.length,1);assert.ok(Math.abs(moves[0].target-(thickness-point-depth))<1e-12);
 }
 for(const depth of [null,0,-0.1,'0.125','',false,0.187500000001,NaN,Infinity]){
  const invalid=structuredClone(demand);invalid.parts[1].features[0].fullDiameterDepthIn=depth;
  const refused=ask(invalid);assert.equal(refused.status,'REFUSED',String(depth));assert.equal(refused.Q??null,null);
  if(depth!==null&&(typeof depth!=='number'||!Number.isFinite(depth))){assert.deepEqual(refused.reasonCodes,['DEFINITION_FIELD_TYPE:parts[1].features[0].fullDiameterDepthIn:number']);continue;}
  assert.ok(refused.reasonCodes.includes(typeof depth==='number'&&Number.isFinite(depth)&&depth>0?'SPOT_FULL_DIAMETER_DEPTH_EXCEEDS_MAX':'SPOT_FULL_DIAMETER_DEPTH_INVALID'));
 }
});
