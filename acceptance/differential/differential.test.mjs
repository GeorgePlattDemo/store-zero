import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {buildAudit} from '../../scripts/build-migration-audit.mjs';
test('all 1786 immutable historical cases retain the baseline with four explained mixed-length repairs',()=>{
  const expected=JSON.parse(readFileSync(new URL('./core-replay-baseline.json',import.meta.url)));
  const repair=JSON.parse(readFileSync(new URL('./mixed-length-planner-repair.json',import.meta.url)));
  assert.equal(expected.historicalRecords,1786);
  assert.equal(expected.historicalCorpusSha256,'61696ab3f777b86a38adb7289afe65f8dae48db7defc659b08d16a16b7b5cbe0');
  assert.equal(repair.changes.length,4);
  const corrections=new Map(repair.changes.map(({before,after})=>{
    assert.deepEqual(expected.results.find(r=>r.key===before.key),before);
    assert.equal(after.key,before.key); assert.equal(after.status,'SUPPORTABLE');
    assert.ok(after.Q<before.Q); assert.ok(after.totalSeconds<=before.totalSeconds);
    return [before.key,after];
  }));
  assert.equal(corrections.size,4);
  const corrected={...expected,results:expected.results.map(r=>corrections.get(r.key)??r)};
  assert.deepEqual(buildAudit(),corrected);
  assert.equal(expected.results.filter(r=>r.disposition==='NEW_MODEL_REPLAY').length,844);
});
