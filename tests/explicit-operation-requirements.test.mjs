import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStoreRequest } from '../src/requests/store-request.mjs';
const at = {release:'STORE-ZERO-TEST',now:()=> '2026-10-10T12:00:00.000Z'};
const profile = {featureId:'PROFILE-1',kind:'MILL_LONGITUDINAL_PROFILE',pathLengthIn:44,yIn:3,totalDepthIn:.75};
function demand(lengthIn=44) { return {configurationId:'EXPLICIT-OPS',configurationVersion:'1',cutPackages:[{
 packageId:'PARTS',material:{species:'pine',form:'board',nominalT:1,nominalW:6,grade:'select'},endCut:{angleDeg:0},finishedWidthIn:3,
 parts:[{partId:'PART-1',lengthIn,edgeProfiles:[{...profile,pathLengthIn:lengthIn}]}]
}]}; }
const ask=d=>evaluateStoreRequest({requestType:'CUT_PACKAGE_V1',requestId:'EXPLICIT-OPS-1',demand:d},at);
test('literal edge profile is fulfilled by the existing whole-board preparation without a second charge',()=>{
 const d=demand(), explicit=ask(d); const plain=structuredClone(d);delete plain.cutPackages[0].parts[0].edgeProfiles;const baseline=ask(plain);
 assert.equal(explicit.status,'SUPPORTABLE');assert.equal(explicit.freshEvaluation,true);
 assert.equal(explicit.packages[0].Q,baseline.packages[0].Q);
 assert.deepEqual(explicit.packages[0].requirementAnswers,[{partId:'PART-1',...profile,status:'SUPPORTABLE',reason:null,fulfilledBy:'EDGE_MILL_WHOLE_BOARD_BEFORE_PARTS'}]);
 assert.ok(explicit.packages[0].time.T_MILL_sec>0);
});
test('a groove, wrong path, missing depth, missing identity or unknown operand never passes as an edge profile',()=>{
 for(const [edit,code] of [[{totalDepthIn:.25},'EDGE_PROFILE_REQUIRES_STOCK_THROUGH_DEPTH'],[{pathLengthIn:30},'EDGE_PROFILE_PATH_MUST_MATCH_PART_LENGTH'],[{totalDepthIn:undefined},'EDGE_PROFILE_GEOMETRY_REQUIRED'],[{featureId:''},'FEATURE_ID_REQUIRED'],[{feedInPerMin:120},'DEFINITION_FIELD_NOT_DECLARED:cutPackages[0].parts[0].edgeProfiles[0].feedInPerMin']]) {
  const d=demand();Object.assign(d.cutPackages[0].parts[0].edgeProfiles[0],edit);const answer=ask(d);
  assert.notEqual(answer.status,'SUPPORTABLE',code);assert.equal(answer.totals?.Q ?? null,null,code);
  assert.ok((answer.packages?.[0].reasonCodes||answer.reasonCodes).includes(code),JSON.stringify(answer));
 }
});
test('explicit spot size and depth are evaluated on both short-sequence and long-part paths',()=>{
 for(const lengthIn of [30,71.5]) {
  const d=demand(lengthIn);delete d.cutPackages[0].finishedWidthIn;delete d.cutPackages[0].parts[0].edgeProfiles;
  const spot={featureId:'SPOT-1',xIn:4,acrossWidthRule:'CENTERED_ON_WIDE_FACE',toolDiameterIn:.1875,fullDiameterDepthIn:.1875};
  d.cutPackages[0].parts[0].spots=[spot];const valid=ask(d);assert.equal(valid.status,'SUPPORTABLE',JSON.stringify(valid));assert.equal(valid.packages[0].spotCount,1);
  const plain=structuredClone(d);delete plain.cutPackages[0].parts[0].spots[0].toolDiameterIn;delete plain.cutPackages[0].parts[0].spots[0].fullDiameterDepthIn;
  assert.equal(valid.packages[0].Q,ask(plain).packages[0].Q);
  for(const [field,code] of [['toolDiameterIn','SPOT_TOOL_DIAMETER_NOT_DECLARED'],['fullDiameterDepthIn','SPOT_DEPTH_NOT_DECLARED']]) {
   const bad=structuredClone(d);bad.cutPackages[0].parts[0].spots[0][field]=.5;const refused=ask(bad);assert.notEqual(refused.status,'SUPPORTABLE');assert.equal(refused.packages[0].status,'REFUSED');assert.ok(refused.packages[0].reasonCodes.includes(code));assert.equal(refused.packages[0].Q,null);
  }
 }
});

test('spot and edge profile identities cannot collide',()=>{const d=demand();d.cutPackages[0].parts[0].spots=[{featureId:'PROFILE-1',xIn:4,acrossWidthRule:'CENTERED_ON_WIDE_FACE'}];const answer=ask(d);assert.equal(answer.packages[0].status,'UNRESOLVED');assert.deepEqual(answer.packages[0].reasonCodes,['UNIQUE_FEATURE_ID_REQUIRED']);assert.equal(answer.packages[0].Q,null);});
