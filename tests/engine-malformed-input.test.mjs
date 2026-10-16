import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileDefinition,evaluateManufacturingJob} from '../src/evaluation/engine/store-manufacturing-core.mjs';
import {loadCatalog} from '../src/evaluation/catalog.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('../contracts/examples/requests/user-defined-board.default-spf.json',import.meta.url)));
test('malformed nested manufacturing rows return named refusals through both exported core entry points',()=>{
 const catalog=loadCatalog();
 for(const mutate of [r=>r.demand.parts[0]=null,r=>r.demand.parts[0].features[0]=null]){
  const r=fixture();mutate(r);const result=compileDefinition({requestType:r.requestType,requestId:r.requestId,demand:r.demand},r.manifest);
  assert.equal(result.status,'REFUSED');assert.deepEqual(result.reasonCodes,['OBJECT_REQUIRED']);assert.equal(result.Q,null);
 }
 const r=fixture(),job=compileDefinition({requestType:r.requestType,requestId:r.requestId,demand:r.demand},r.manifest).job;
 for(const mutate of [j=>j.boards[0]=null,j=>j.boards[0].parts[0]=null,j=>j.boards[0].parts[0].spots[0]=null,j=>j.items=[null],j=>j.sheets=[null]]){
  const copy=structuredClone(job);mutate(copy);const result=evaluateManufacturingJob(catalog,copy);
  assert.equal(result.status,'REFUSED');assert.deepEqual(result.reasonCodes,['OBJECT_REQUIRED']);assert.equal(result.Q,null);
 }
});
