/** Registered declared model; this configuration authorizes no physical motion. */
import {readFileSync} from 'node:fs';
import {createModel,calculationHash} from '../evaluation/engine/store-manufacturing-core.mjs';
const CONFIG_URL=new URL('../../data/machine/manufacturing-core-0.1.json',import.meta.url);
const PARAMS=['routerDiameterIn','routerPassDepthIn','longitudinalFeedInPerMin','productiveHours','searchNodeLimit'];
export function machineConfigProblems(config){
  if(!config || typeof config!=='object' || Array.isArray(config))return ['MACHINE_CONFIGURATION_REQUIRED'];
  const keys=['machineConfigId','executionClass','physicalAuthority','parameters','model'];
  if(Object.keys(config).some(k=>!keys.includes(k)) || config.machineConfigId!=='STORE-MANUFACTURING-CORE-0.1'
    || config.executionClass!=='DECLARED_OCCUPANCY_EVENT_MODEL' || config.physicalAuthority!==false)return ['MACHINE_CONFIGURATION_NOT_DECLARED'];
  if(!config.parameters || Object.keys(config.parameters).some(k=>!PARAMS.includes(k)) || PARAMS.some(k=>!Object.hasOwn(config.parameters,k)))return ['MACHINE_PARAMETERS_REQUIRED'];
  try{const model=createModel(config.parameters);if(config.model && calculationHash(config.model)!==calculationHash(model))return ['MACHINE_MODEL_CONTENT_CHANGED'];}catch{return ['MACHINE_PARAMETERS_INVALID'];}
  return [];
}
export function loadMachineConfig(url=CONFIG_URL){
  const config=JSON.parse(readFileSync(url,'utf8')),problems=machineConfigProblems(config);
  if(problems.length)throw new Error(problems.join(','));
  return Object.freeze({...config,model:createModel(config.parameters)});
}
export const machineConfigHash=config=>calculationHash(config);
export function registeredMachineProblems(config){
  const problems=machineConfigProblems(config);if(problems.length)return problems;
  return machineConfigHash(config)===machineConfigHash(loadMachineConfig())?[]:['MACHINE_CONFIGURATION_CONTENT_CHANGED'];
}
