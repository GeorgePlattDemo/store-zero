import test from 'node:test';
import assert from 'node:assert/strict';
import { createModel, evaluateManufacturingJob } from '../src/evaluation/engine/store-manufacturing-core.mjs';
import { loadCatalog } from '../src/evaluation/catalog.mjs';

const catalog = loadCatalog();
const model = createModel();
const material = (nominalW) => ({ species: 'syp-treated', form: 'board', nominalT: 2,
  nominalW, grade: 'above-ground' });
const angled = (packageId, nominalW, lengthIn, quantity) => ({
  packageId, material: material(nominalW),
  endCut: { angleDeg: 25, endRelation: 'parallel',
    lengthDatum: 'long-point-to-short-point', plane: 'miter-face' },
  parts: Array.from({ length: quantity }, (_, i) => ({
    partId: packageId + '-' + String(i + 1).padStart(2, '0'), lengthIn
  }))
});
function job(boards) {
  const boardPartIds = boards.flatMap(b => b.parts.map(p => p.partId));
  return { schema: 'STORE-MANUFACTURING-JOB-1', jobId: 'OUTDOOR-ANGLED-PARTS',
    revision: 'geometry-1', boards, sheets: [], items: [],
    manifest: { jobId: 'OUTDOOR-ANGLED-PARTS', revision: 'geometry-1',
      boardPartIds, sheetPackageIds: [], featureIds: [], items: [] } };
}
function evaluate(boards, rows=catalog.offerings) {
  return evaluateManufacturingJob({ ...catalog, offerings: rows }, job(boards), model);
}
function supportable(result) {
  assert.equal(result.status, 'SUPPORTABLE',
    JSON.stringify({ status: result.status, reasons: result.reasonCodes }));
  assert.equal(result.complete, true);
  assert.ok(result.Q > 0);
  assert.equal(result.physicalRelease, false);
}

test('four source-length 2x6 legs have actual parallel end planes and a 20-inch modeled saw span', () => {
  const legs = angled('LEGS', 6, 31.375, 4);
  const result = evaluate([legs]);
  supportable(result);
  assert.deepEqual(result.manifestCoverage.boardPartIds.sort(),
    legs.parts.map(p => p.partId).sort());
  const ends = result.operations.filter(e => e.kind === 'DEFINED_END_PLANES');
  assert.ok(ends.length >= 5);
  const partEnds = ends.filter(e => e.subject.startsWith('LEGS-'));
  assert.equal(partEnds.length, 4);
  for (const e of partEnds) {
    const source = result.parents.find(p => p.parentId === e.parentId);
    const stock = catalog.offerings.find(row => row.storeSku === source.storeSku);
    const sweep = stock.actualW * Math.tan(25 * Math.PI / 180);
    assert.ok(Math.abs(e.atFenceEdgeXIn - 31.375) < 1e-9);
    assert.ok(Math.abs(e.atOppositeEdgeXIn - (31.375 + sweep)) < 1e-9);
    assert.ok(Math.abs(e.axialKerfIn - 0.125 / Math.cos(25 * Math.PI / 180)) < 1e-9);
    assert.ok(e.cutPathIn <= e.bladeChordIn);
  }
  assert.ok(result.components.every(c => c.nominalFinishedLengthIn === 31.375));
});

test('two source-length 2x4 cross supports resolve without a thickness-plane operation', () => {
  const braces = angled('BRACES', 4, 32.875, 2);
  const result = evaluate([braces]);
  supportable(result);
  assert.ok(result.operations.some(e => e.kind === 'DEFINED_END_PLANES' && e.subject === 'BRACES-01'));
  assert.ok(result.components.every(c => c.nominalFinishedLengthIn === 32.875));
  assert.ok(result.operations.some(e => e.kind === 'SAW_ON'));
});

test('a false cut-plane label remains unresolved; the datum cannot mask it', () => {
  const braces = angled('BRACES', 4, 32.875, 2);
  braces.endCut.plane = 'bevel-edge';
  const result = evaluate([braces]);
  assert.equal(result.status, 'UNRESOLVED');
  assert.equal(result.Q, null);
  assert.ok(result.reasonCodes.includes('MITER_END_GEOMETRY_NOT_EVALUATED'));
});

test('geometric end sweep and projected kerf cannot be omitted to fit short stock', () => {
  const legs = angled('LEGS', 6, 31.375, 1);
  const stock = catalog.offerings.find(o => o.form === 'board' && o.species === 'syp-treated'
    && o.nominalT === 2 && o.nominalW === 6 && o.grade === 'above-ground'
    && o.offered && o.supportedOps.includes('MITER_LIMITED'));
  assert.ok(stock);
  const restricted = { ...stock, stockL_in: 57, onHand: 10, allocated: 0 };
  const result = evaluate([legs], [restricted]);
  assert.equal(result.complete, false);
  assert.equal(result.Q, null);
});

test('unsupported end relationship is not converted into parallel geometry', () => {
  const legs = angled('LEGS', 6, 31.375, 1);
  legs.endCut.endRelation = 'opposed';
  const result = evaluate([legs]);
  assert.equal(result.status, 'UNRESOLVED');
  assert.ok(result.reasonCodes.includes('MITER_END_GEOMETRY_NOT_EVALUATED'));
  assert.equal(result.Q, null);
});
