import {motionRecordProblems} from "../contracts/machine-records.mjs";
/** Check and replay the priced occupancy ledger. This produces no controller commands. */
import {calculationHash,moveSeconds} from '../evaluation/engine/store-manufacturing-core.mjs';
import {loadMachineConfig,machineConfigHash} from './configuration.mjs';
export const VIRTUAL_MODEL='STB-VIRTUAL-OCCUPANCY-MODEL-1';
export function runVirtual(records,{expected,faults={}}={}){
  let elapsed=0,moves=0;const trace=[];
  const stop=reason=>({status:'STOPPED',reason,physicalAuthority:false,model:VIRTUAL_MODEL,timeSec:elapsed,motionCommands:moves,trace});
  if(records?.schema!=='STB-MODELED-OPERATIONS-1' || !Array.isArray(records.sequence) || records.physicalAuthority!==false)return stop('MODELED_RECORDS_REQUIRED');
  const shape=motionRecordProblems(records);if(shape.length)return stop(shape[0]);
  const copy=structuredClone(records),hash=copy.binding?.motionHash;if(copy.binding)delete copy.binding.motionHash;
  if(calculationHash(copy)!==hash)return stop('MOTION_RECORDS_ALTERED');
  if(!expected || Object.keys(expected).some(k=>expected[k]!==records.binding[k]))return stop('MOTION_BINDING_MISMATCH');
  const machine=loadMachineConfig(),d=machine.model.dimensional;
  if(records.binding.machineConfigHash!==machineConfigHash(machine) || records.binding.modelHash!==calculationHash(machine.model))return stop('MOTION_CONFIGURATION_MISMATCH');
  const pose={C:0,Y:0,A:0,S:0,Z:null,RZ:null};let saw=false,spot=false;
  for(let i=0;i<records.sequence.length;i++){
    const e=records.sequence[i],stock=records.stockByParent[e.parentId];
    if(e.sequence!==i+1 || !Number.isFinite(e.seconds) || e.seconds<0 || Math.abs(e.startSec-elapsed)>1e-8 || Math.abs(e.endSec-e.startSec-e.seconds)>1e-8)return stop('OCCUPANCY_SEQUENCE_INVALID');
    if(e.sequence===faults.slipAtSeq)return stop('POSITION_INVALID');
    if(e.sequence===faults.retractUnconfirmedAtSeq)return stop('TOOL_RETRACT_UNCONFIRMED');
    if(e.kind==='LOAD_AND_SEAT'){
      pose.C=0;if(pose.Z===null)pose.Z=stock.actualT+d.spot.clearanceIn;if(pose.RZ===null)pose.RZ=stock.actualT+d.router.clearanceIn;
    }
    if(e.kind==='SAW_ON')saw=true;if(e.kind==='SAW_OFF')saw=false;
    if(e.kind==='SPOT_SPINDLE_ON')spot=true;if(e.kind==='SPOT_SPINDLE_OFF')spot=false;
    if(e.kind==='MOVE'){
      if(!Object.hasOwn(pose,e.axis) || !Number.isFinite(e.from) || !Number.isFinite(e.target) || Math.abs(e.seconds-moveSeconds(e.target-e.from,e.velocity,e.acceleration))>1e-8)return stop('MOVE_MODEL_INVALID');
      // The first per-stock clearance move can precede LOAD; it still must name its actual starting pose.
      if(pose[e.axis]!==null && Math.abs(e.from-pose[e.axis])>1e-8)return stop('POSITION_INVALID');
      if(e.axis==='C' && (pose.S!==0 || pose.Z<stock.actualT+d.spot.clearanceIn-1e-8 || pose.RZ<stock.actualT+d.router.clearanceIn-1e-8))return stop('INDEX_WITH_TOOL_DOWN');
      if(e.axis==='S' && e.target>0&&!saw)return stop('SAW_STROKE_WITH_TOOL_OFF');
      if(e.axis==='Z'&&e.target<stock.actualT&&!spot)return stop('SPOT_PLUNGE_WITH_TOOL_OFF');
      if(e.axis==='A'&&pose.S!==0)return stop('ANGLE_CHANGE_WITH_SAW_DOWN');
      pose[e.axis]=e.target;moves++;
    }else if(e.kind==='ROUTER_CUT'){
      if(pose.S!==0 || pose.RZ>=stock.actualT || Math.abs(e.from-pose.C)>1e-8 || Math.abs(e.seconds-moveSeconds(e.pathLengthIn,e.cuttingFeedInPerMin/60,d.motion.X.acceleration))>1e-8)return stop('ROUTER_MODEL_INVALID');
      pose.C=e.target;moves++;
    }else if(e.kind==='NOMINAL_DATUM_CAPTURE'){
      if(pose.S!==0)return stop('DATUM_CAPTURE_WITH_TOOL_DOWN');pose.C=e.targetCIn;
    }
    trace.push({...e,durationSec:e.seconds,positions:{...pose},evidenceClass:'PREDICTED_OCCUPANCY_ONLY'});elapsed+=e.seconds;
  }
  if(saw||spot||pose.S!==0)return stop('COMPLETE_WITH_TOOL_ACTIVE');
  if(Math.abs(elapsed-records.expectedSeconds)>1e-8)return stop('OCCUPANCY_TOTAL_MISMATCH');
  return {status:'VIRTUAL_MODEL_COMPLETE',physicalAuthority:false,model:VIRTUAL_MODEL,timeSec:elapsed,motionCommands:moves,trace};
}
export function physicalAdmission(localJob){return {status:'BLOCKED',physicalAuthority:false,motionPermitted:false,motionCommands:0,reasonCodes:localJob?.releaseBlockers??['PHYSICAL_AUTHORITY_NOT_REGISTERED']};}
