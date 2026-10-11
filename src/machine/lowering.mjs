import {localJobProblems} from "../contracts/machine-records.mjs";
/** Bind the exact accepted Store ledger to the registered declared model. No alternate timing or Q. */
import {calculationHash} from '../evaluation/engine/store-manufacturing-core.mjs';
import {verifyJobPacket} from '../contracts/job-packet.mjs';
import {loadMachineConfig,machineConfigHash,registeredMachineProblems} from './configuration.mjs';
export function lowerJobPacket(packet,{release,catalog,now,machine=loadMachineConfig()}={}){
  const verified=verifyJobPacket(packet,{release,catalog,now});if(verified.status!=='VERIFIED')return verified;
  const problems=registeredMachineProblems(machine);if(problems.length)return {status:'REFUSED',reasonCodes:problems};
  const answer=packet.storeAnswer,model=machine.model;
  if(answer.model?.hash!==calculationHash(model) || answer.model?.id!==model.id)return {status:'REFUSED',reasonCodes:['ACCEPTED_MODEL_CONFIGURATION_MISMATCH']};
  if(!Array.isArray(answer.operations) || !answer.time || !Array.isArray(answer.parents))return {status:'REFUSED',reasonCodes:['ACCEPTED_LEDGER_REQUIRED']};
  const localJob={schema:'STB-LOCAL-MANUFACTURING-JOB-1',packetId:packet.packetId,projectId:packet.project.projectId,
    definitionId:packet.definition.definitionId,definitionRevision:packet.definition.revisionId,
    demandHash:answer.evaluationReceipt.demandHash,manifestHash:answer.evaluationReceipt.manifestHash,
    storeRelease:release,storeCalculationIdentity:answer.calculationIdentity,packetHash:calculationHash(packet),
    machineConfigId:machine.machineConfigId,machineConfigHash:machineConfigHash(machine),modelHash:calculationHash(model),
    executionClass:machine.executionClass,physicalAuthority:false,operations:structuredClone(answer.operations),
    parents:structuredClone(answer.parents),predictedTime:structuredClone(answer.time),
    releaseBlockers:[...new Set(['CONFIGURATION_NOT_COMMISSIONED','LOCAL_MATERIAL_AND_READINESS_NOT_ADMITTED',...(answer.physicalGaps??[]).map(g=>g.code)])]};
  localJob.localJobHash=calculationHash(localJob);return {status:'LOWERED',localJob};
}
export function motionRecords(localJob,machine=loadMachineConfig()){
  const problems=localJobProblems(localJob);if(problems.length)throw new Error(problems.join(','));
  const {localJobHash,...core}=localJob;
  if(calculationHash(core)!==localJobHash)throw new Error('LOCAL_JOB_ALTERED');
  if(localJob.machineConfigHash!==machineConfigHash(machine))throw new Error('LOCAL_MODEL_CONFIGURATION_MISMATCH');
  const records={schema:'STB-MODELED-OPERATIONS-1',binding:{packetId:localJob.packetId,demandHash:localJob.demandHash,
    manifestHash:localJob.manifestHash,packetHash:localJob.packetHash,machineConfigId:machine.machineConfigId,
    machineConfigHash:machineConfigHash(machine),modelHash:localJob.modelHash,localJobHash},
    evidenceClass:'PREDICTED_OCCUPANCY_ONLY',physicalAuthority:false,expectedSeconds:localJob.predictedTime.totalSeconds,
    stockByParent:Object.fromEntries(localJob.parents.filter(p=>p.parentId).map(p=>[p.parentId,{actualT:p.actualT,cell:p.kind==='sheet'?'S-001':'D-001'}])),
    sequence:structuredClone(localJob.operations)};
  records.binding.motionHash=calculationHash(records);return records;
}
