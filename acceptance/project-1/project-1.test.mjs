import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {project1Packet,machineOutputs} from '../../scripts/build-contract-examples.mjs';
import {currentProject1Proof} from '../../scripts/build-contract-examples.mjs';
import {verifyJobPacket} from '../../src/contracts/job-packet.mjs';
import {runVirtual} from '../../src/machine/virtual-run.mjs';
import {loadCatalog} from '../../src/evaluation/catalog.mjs';
test('current Project 1 binds both public settings to one verified plan, priced ledger and blocked replay',()=>{
 const proof=currentProject1Proof();
 for(const [index,s] of proof.specimens.entries()){
  const a=s.packet.storeAnswer,context={release:proof.release,catalog:loadCatalog()};
  assert.equal(a.Q,[8.62,9.13][index]);assert.equal(s.verification.status,'VERIFIED');
  assert.deepEqual(s.localJob.operations,a.operations);assert.equal(s.run.timeSec,a.time.totalSeconds);
  assert.equal(s.run.status,'VIRTUAL_MODEL_COMPLETE');assert.equal(s.admission.motionCommands,0);
  assert.deepEqual(s.request.manifest.featureIds,['SPOT-1','SPOT-2']);
  const changed=structuredClone(s.packet);changed.definition.demand.parts[0].lengthIn++;
  assert.equal(verifyJobPacket(changed,context).status,'REFUSED');
  const altered=structuredClone(s.records);altered.sequence[0].seconds++;
  assert.notEqual(runVirtual(altered,{expected:s.records.binding}).status,'VIRTUAL_MODEL_COMPLETE');
 }
 assert.notEqual(proof.specimens[0].packet.storeAnswer.calculationIdentity.resultHash,proof.specimens[1].packet.storeAnswer.calculationIdentity.resultHash);
});
test('sealed Project 1 evidence remains historical; adopted model produces its own Q and exact benchmark duration',()=>{const old=JSON.parse(readFileSync(new URL('./from-evidence/store-answer.json',import.meta.url))),p=project1Packet(),e=machineOutputs(p);assert.equal(old.estimate.totals.Q,11.09);assert.equal(p.storeAnswer.Q,10.81);assert.equal(e.run.timeSec,86.46953628299116);assert.equal(e.admission.status,'BLOCKED');assert.equal(e.admission.motionCommands,0);assert.notEqual(p.storeAnswer.calculationIdentity.resultHash,old.calculationIdentity.resultHash);});
