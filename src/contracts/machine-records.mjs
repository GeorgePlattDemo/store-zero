/** Exact model binding and operation-ledger checks. These records are evidence, never controller input. */
import {calculationHash} from '../evaluation/engine/store-manufacturing-core.mjs';
import {shapeProblems} from './shape.mjs';
export const LOCAL_JOB_SCHEMA='STB-LOCAL-MANUFACTURING-JOB-1',MOTION_RECORDS_SCHEMA='STB-MODELED-OPERATIONS-1';
const binding={packetId:'string',demandHash:'string',manifestHash:'string',packetHash:'string',machineConfigId:'string',machineConfigHash:'string',modelHash:'string',localJobHash:'string',motionHash:'string'};
export const LOCAL_JOB_SHAPE=Object.freeze({object:{schema:{enum:[LOCAL_JOB_SCHEMA]},packetId:'string',projectId:'string',definitionId:'string',definitionRevision:'string',demandHash:'string',manifestHash:'string',storeRelease:'string',storeCalculationIdentity:{object:{inputHash:'string',resultHash:'string'}},packetHash:'string',machineConfigId:'string',machineConfigHash:'string',modelHash:'string',executionClass:{enum:['DECLARED_OCCUPANCY_EVENT_MODEL']},physicalAuthority:{enum:[false]},operations:{array:{any:true}},parents:{array:{any:true}},predictedTime:{object:{T_MACHINE_sec:"number",T_MACHINE_min:"number",T_MACHINE_hr:"number",totalSeconds:'number',totalMinutes:'number',hourlyBilledSeconds:'number',fixedPriceOccupiedSeconds:'number',categories:{any:true},concurrency:{enum:['SERIAL_OCCUPANCY']}}},releaseBlockers:{array:'string'},localJobHash:'string'}});
export const MOTION_RECORDS_SHAPE=Object.freeze({object:{schema:{enum:[MOTION_RECORDS_SCHEMA]},binding:{object:binding},evidenceClass:{enum:['PREDICTED_OCCUPANCY_ONLY']},physicalAuthority:{enum:[false]},expectedSeconds:'number',stockByParent:{any:true},sequence:{array:{any:true}}}});
const EVENT_DETAILS={STOCK_ENVELOPE_DERIVED:['partId','finishedLengthIn','stockEnvelopeLengthIn','endOffsetIn','actualCutWidthIn','lengthDatum','kerfIn'],MOVE:['axis','from','target','velocity','acceleration'],NOMINAL_DATUM_CAPTURE:['oldCIn','targetCIn','convention'],CONTROL_SCREEN:['nominalCIn','remainingLengthIn','rollerContacts'],RIP_PROCESS_DECLARED:['toolDiameterIn','resultingOffcutWidthIn','treatment'],ROUTER_CUT:['axis','from','target','pathLengthIn','pass','passes','axialDepthIn','cuttingFeedInPerMin'],FEATURE_ANSWERED:['partId','featureId','coverage','kindEvaluated'],FEATURE_COVERED_BY_PARENT_EDGE_PREPARATION:['partId','featureId','coverage'],SHEET_PLUNGE_RETRACT_ALLOWANCE:['pass','passes'],SHEET_PROFILE_PATH:['pathLengthIn','feedInPerMin','pass','passes','toolDiameterIn'],SHEET_TAB_TRANSITIONS:['tabs','bridgeWidthIn','pass'],PANEL_SAW_CUT:['cutKind','positionIn','pathLengthIn','fixedPrice'],LABEL_RETURNED_PIECES:['pieceCount']};
const DELAYS=['LOAD_AND_SEAT','ANGLE_SETTLE','CLAMP_ALLOWANCE','SAW_ON','SAW_OFF_ALLOWANCE','SAW_OFF','VERIFY_POSITION_ALLOWANCE','ROUTER_READY_ALLOWANCE','SPOT_SPINDLE_ON','SPOT_READY_ALLOWANCE','SPOT_SPINDLE_OFF','RELEASE_AND_LABEL','SHEET_LOAD_AND_REFERENCE','SHEET_RELEASE'];
const BASE=['sequence','kind','seconds','subject','parentId','cell','category','billing','startSec','endSec'];
const nonblank=v=>typeof v==='string'&&v.trim().length>0;
function required(value,fields,prefix){return fields.filter(k=>value?.[k]==null).map(k=>prefix+':'+k);}
export function operationProblems(events){
 if(!Array.isArray(events))return ['OPERATIONS_REQUIRED'];const problems=[];let elapsed=0;
 for(let i=0;i<events.length;i++){const e=events[i],details=EVENT_DETAILS[e?.kind]??(DELAYS.includes(e?.kind)?[]:null);if(!details){problems.push('OPERATION_KIND_NOT_DECLARED');continue;}
 if(BASE.some(k=>e[k]==null)||Object.keys(e).some(k=>![...BASE,...details].includes(k))||e.sequence!==i+1||!Number.isFinite(e.seconds)||e.seconds<0||!Number.isFinite(e.startSec)||!Number.isFinite(e.endSec)||Math.abs(e.startSec-elapsed)>1e-8||Math.abs(e.endSec-e.startSec-e.seconds)>1e-8||!nonblank(e.subject)||!nonblank(e.parentId)||!['D-001','S-001'].includes(e.cell)||!['HOURLY','PER_CUT'].includes(e.billing))problems.push('OCCUPANCY_SEQUENCE_INVALID');
 elapsed=e.endSec;
 }return [...new Set(problems)];
}
export function localJobProblems(job){
 if(!job||typeof job!=='object'||Array.isArray(job))return ['LOCAL_JOB_REQUIRED'];
 const problems=[...required(job,Object.keys(LOCAL_JOB_SHAPE.object),'LOCAL_JOB_FIELD_REQUIRED'),...shapeProblems(job,LOCAL_JOB_SHAPE,'LOCAL_JOB'),...operationProblems(job.operations)];
 if(job.physicalAuthority!==false||!job.releaseBlockers?.length)problems.push('PHYSICAL_ADMISSION_MUST_REMAIN_BLOCKED');
 const {localJobHash,...core}=job;if(calculationHash(core)!==localJobHash)problems.push('LOCAL_JOB_ALTERED');return problems;
}
export function motionRecordProblems(records){
 if(!records||typeof records!=='object'||Array.isArray(records))return ['MODELED_RECORDS_REQUIRED'];
 const problems=[...required(records,Object.keys(MOTION_RECORDS_SHAPE.object),'MOTION_FIELD_REQUIRED'),...required(records.binding,Object.keys(binding),'MOTION_BINDING_REQUIRED'),...shapeProblems(records,MOTION_RECORDS_SHAPE,'MOTION'),...operationProblems(records.sequence)];
 const copy=structuredClone(records),hash=copy.binding?.motionHash;if(copy.binding)delete copy.binding.motionHash;
 if(calculationHash(copy)!==hash)problems.push('MOTION_RECORDS_ALTERED');return problems;
}
