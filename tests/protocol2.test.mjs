import {recordedCatalog} from "../acceptance/fixtures/recorded-catalog.mjs";
import test from 'node:test';import assert from 'node:assert/strict';
import {evaluateStoreRequest,requestProblems} from '../src/requests/store-request.mjs';
import {loadCatalog} from '../src/evaluation/catalog.mjs';
import {calculationHash} from '../src/evaluation/engine/store-manufacturing-core.mjs';
import {project1Demand} from './fixtures/project-1.mjs';
import {identifiedRequest} from './fixtures/manifest.mjs';
import {project1Packet,secondJobPacket,EXAMPLE_RELEASE,EXAMPLE_CLOCK} from '../scripts/build-contract-examples.mjs';
import {verifyJobPacket} from '../src/contracts/job-packet.mjs';
import {loadMachineConfig,machineConfigHash} from '../src/machine/configuration.mjs';
import {evaluateMachineEvidence} from '../src/machine/evidence.mjs';
import {lowerJobPacket,motionRecords} from '../src/machine/lowering.mjs';
import {runVirtual} from '../src/machine/virtual-run.mjs';
const at={release:EXAMPLE_RELEASE,catalog:recordedCatalog(),now:()=>EXAMPLE_CLOCK};
const request=()=>identifiedRequest('USER_DEFINED_BOARD_V1',project1Demand());
test('one fresh Q binds manifest, demand, registered model, catalog and release',()=>{const r=request(),a=evaluateStoreRequest(r,at);assert.equal(a.status,'SUPPORTABLE');assert.equal(a.Q,10.81);assert.equal(a.time.totalSeconds,86.46953628299116);assert.equal(a.evaluationReceipt.manifestHash,calculationHash(r.manifest));assert.equal(a.evaluationReceipt.demandHash,calculationHash(r.demand));assert.equal(a.evaluationReceipt.authority.manufacturingModel.hash,a.model.hash);assert.equal(a.model.measured,false);assert.equal(a.physicalRelease,false);assert.equal(a.physicalAdmission,'BLOCKED');const {receiptHash,...receipt}=a.evaluationReceipt;assert.equal(receiptHash,calculationHash(receipt));});
const failures=[
 ['missing manifest',r=>delete r.manifest,'INDEPENDENT_SYSTEM_MANIFEST_REQUIRED'],
 ['omitted feature',r=>r.manifest.featureIds.pop(),'MANIFEST_COVERAGE_MISMATCH'],
 ['extra part',r=>r.manifest.boardPartIds.push('UNSENT'),'MANIFEST_COVERAGE_MISMATCH'],
 ['wrong manifest revision',r=>r.manifest.revision='foreign','MANIFEST_REVISION_MISMATCH'],
 ['unevaluated requirement',r=>r.manifest.unresolvedRequirements.push('paint'),'JOB_REQUIREMENTS_REMAIN_UNEVALUATED'],
 ['machine language',r=>r.demand.toolpath='G1 X1','MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED'],
 ['prior receipt',r=>r.evaluationReceipt={receiptHash:'copied'},'REQUEST_FIELD_NOT_DECLARED:evaluationReceipt'],
 ['prior answer',r=>r.answer={Q:0},'REQUEST_FIELD_NOT_DECLARED:answer'],
 ['count mismatch',r=>r.demand.declaredSawCuts=2,'DECLARED_SAW_COUNT_MISMATCH'],
 ['unknown spot operation',r=>r.demand.parts[0].features[0].kind='DRILL_FULL','FEATURE_KIND_NOT_HANDLED'],
 ['unknown part field',r=>r.demand.parts[0].paint='red','DEFINITION_FIELD_NOT_DECLARED:parts[0].paint'],
 ['missing grade',r=>delete r.demand.materialDemand.grade,'GRADE_CHOICE_REQUIRED'],
 ['missing end geometry',r=>delete r.demand.endRelation,'END_GEOMETRY_NOT_DECLARED'],
 ['unpriced operation',r=>r.demand.requiredOps.push('PAINT'),'REQUIRED_OPERATION_NOT_REPRESENTED:PAINT'],
 ['spot outside part',r=>r.demand.parts[0].features[0].xIn=40,'SPOT_TOOL_LEAVES_PART_END'],
 ['center contradicts inset',r=>r.demand.parts[0].features[0].insetFromEdgeIn=0.75,'CENTERED_SPOT_HAS_INSET']
];
for(const [name,edit,reason]of failures)test(name+' cannot become a complete Q',()=>{const r=request();edit(r);const a=evaluateStoreRequest(r,at);assert.notEqual(a.status,'SUPPORTABLE');assert.ok(a.reasonCodes.includes(reason),JSON.stringify(a.reasonCodes));assert.ok(a.Q==null);});
test('every request reevaluates catalog inventory and price',()=>{const r=request(),a=evaluateStoreRequest(r,at),catalog=structuredClone(at.catalog);for(const row of catalog.offerings)if(row.form==='board')row.onHand=0;const b=evaluateStoreRequest(r,{...at,catalog});assert.notEqual(b.status,'SUPPORTABLE');assert.notEqual(b.evaluationReceipt.authority.catalogHash,a.evaluationReceipt.authority.catalogHash);assert.notEqual(b.evaluationReceipt.receiptHash,a.evaluationReceipt.receiptHash);});
test('accepted packet carries independent manifest and stale packets cannot be lowered',()=>{const p=project1Packet();assert.equal(verifyJobPacket(p,at).status,'VERIFIED');const altered=structuredClone(p);altered.definition.manifest.featureIds.pop();assert.equal(verifyJobPacket(altered,at).status,'REFUSED');const forged=structuredClone(p);forged.storeAnswer.Q=1;assert.equal(verifyJobPacket(forged,at).status,'REFUSED');const catalog=structuredClone(at.catalog);const row=catalog.offerings.find(o=>o.storeSku===p.storeAnswer.selectedStock[0].storeSku);row.allocated=row.onHand;assert.equal(verifyJobPacket(p,{...at,catalog}).status,'STALE');});
for(const packet of [project1Packet,secondJobPacket])test('bound ledger replay: '+packet().packetId,()=>{const p=packet(),machine=loadMachineConfig(),e=evaluateMachineEvidence({packet:p,expectedMachineConfigId:machine.machineConfigId,expectedMachineConfigHash:machineConfigHash(machine)},at);assert.equal(e.status,'VIRTUAL_EVIDENCE_READY',JSON.stringify(e.reasonCodes));assert.equal(e.run.timeSec,p.storeAnswer.time.totalSeconds);assert.deepEqual(e.records.sequence,p.storeAnswer.operations);assert.equal(e.admission.status,'BLOCKED');assert.equal(e.admission.motionCommands,0);assert.equal(e.admission.physicalAuthority,false);const records=motionRecords(lowerJobPacket(p,at).localJob);assert.equal(runVirtual(records,{expected:{...records.binding,packetId:'foreign'}}).reason,'MOTION_BINDING_MISMATCH');assert.equal(runVirtual(records,{expected:records.binding,faults:{slipAtSeq:2}}).reason,'POSITION_INVALID');const bad=structuredClone(records);bad.sequence[0].kind='GCODE';delete bad.binding.motionHash;bad.binding.motionHash=calculationHash(bad);assert.equal(runVirtual(bad,{expected:bad.binding}).status,'STOPPED');});
test('caller cannot alter registered cutter or supply controller commands',()=>{const machine=loadMachineConfig(),r={packet:project1Packet(),expectedMachineConfigId:machine.machineConfigId,expectedMachineConfigHash:machineConfigHash(machine)},mutant=structuredClone(machine);mutant.model.dimensional.router.diameterIn=0.5;assert.equal(evaluateMachineEvidence(r,{...at,machine:mutant}).status,'REFUSED');assert.equal(evaluateMachineEvidence({...r,gcode:'G1 X1'},at).status,'REFUSED');assert.equal(machine.model.dimensional.router.diameterIn,1);assert.equal(machine.model.dimensional.router.axialPassDepthIn,0.75);assert.equal(machine.model.sheet.router.diameterIn,0.5);});
