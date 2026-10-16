import assert from 'node:assert/strict';
import {createModel,moveSeconds,machineHourlyRate,calculationHash,evaluateManufacturingJob,compileDefinition,evaluateDefinition} from '../src/evaluation/engine/store-manufacturing-core.mjs';
const clone=structuredClone;
const money=v=>Math.round((v+Number.EPSILON)*100)/100;
export async function runSelfChecks(catalog) {
  const results = [];
  const check = async (name, fn) => { await fn(); results.push({ name, pass: true }); };
  const model = createModel(), boardMaterial = { species: 'pine', form: 'board', nominalT: 1, nominalW: 8, grade: 'select' };
  const part = (id, lengthIn, spots = []) => ({ partId: id, lengthIn, spots, edgeProfiles: [] });
  const pkg = (id, parts, rest = {}) => ({ packageId: id, material: clone(boardMaterial), endCut: { angleDeg: 0 }, parts, ...rest });
  function fixture(boards = [], sheets = [], items = []) {
    const job = { schema: 'STORE-MANUFACTURING-JOB-1', jobId: 'NEUTRAL-TEST', revision: '1', boards, sheets, items };
    job.manifest = { jobId: job.jobId, revision: job.revision, boardPartIds: boards.flatMap(b => b.parts.map(p => p.partId)),
      sheetPackageIds: sheets.map(s => s.packageId), featureIds: [...boards.flatMap(b => b.parts.flatMap(p => [...(p.spots ?? []), ...(p.edgeProfiles ?? [])].map(f => f.featureId))),
        ...sheets.flatMap(s => s.features.map(f => f.featureId))], items: items.map(i => ({ lineId: i.lineId, qty: i.qty })) };
    return job;
  }
  const evaluate = (j, c = catalog, m = model) => evaluateManufacturingJob(c, j, m);
  const report = r => JSON.stringify({ status: r.status, reasonCodes: r.reasonCodes, optimization: r.optimization });
  const complete = r => assert.equal(r.status, 'SUPPORTABLE', report(r));
  await check('motion: zero, triangular, threshold, trapezoidal; invalid rates', () => {
    assert.equal(moveSeconds(0, 8, 32), 0); assert.equal(moveSeconds(0.5, 8, 32), 0.25);
    assert.equal(moveSeconds(2, 8, 32), 0.5); assert.equal(moveSeconds(18, 8, 32), 2.5);
    assert.throws(() => moveSeconds(1, 0, 32), /MOTION_FACT_REQUIRED/);
  });
  await check('economics: itemized pool reconciles to 250 USD/hour', () => { assert.equal(machineHourlyRate(model), 250); });
  let reference;
  await check('full digital-trail benchmark: 86.469536 seconds; two spots; three saw strokes', () => {
    const b = pkg('NEUTRAL-MITER', [part('PART-1', 18, [{ featureId: 'SPOT-1', xIn: 9, acrossWidthRule: 'CENTERED_ON_WIDE_FACE' }]),
      part('PART-2', 18, [{ featureId: 'SPOT-2', xIn: 9, acrossWidthRule: 'CENTERED_ON_WIDE_FACE' }])],
      { material: { species: 'syp-treated', form: 'board', nominalT: 2, nominalW: 4, grade: 'above-ground' },
        endCut: { angleDeg: Math.asin(8 / 18) * 180 / Math.PI, endRelation: 'parallel', lengthDatum: 'long-long-outer-edge', plane: 'miter-face' },
        minimumParentLengthIn: 60, singleParent: true, preserveOrder: true });
    reference = evaluate(fixture([b])); complete(reference);
    assert.ok(Math.abs(reference.time.totalSeconds - 86.469536) < 0.000001, String(reference.time.totalSeconds));
    assert.equal(reference.operations.filter(e => e.kind === 'SAW_ON').length, 3);
    assert.equal(reference.operations.filter(e => e.coverage === true).length, 2);
    const ys = reference.operations.filter(e => e.kind === 'MOVE' && e.axis === 'Y' && e.seconds > 0); assert.equal(ys.length, 1);
    assert.ok(reference.physicalGaps.some(g => g.code === 'TWO_ROLLER_CONTACT_NOT_ESTABLISHED'));
    assert.equal(reference.physicalAdmission, 'BLOCKED'); assert.equal(reference.totals.machine_service, 6.00);
    // The trail's 11.15 comparison fixes its 72-inch offering. A fresh optimizer
    // may select a cheaper current offering; its price must not be overwritten.
    const fixedGuideCatalog = { ...clone(catalog), offerings: catalog.offerings.filter(o => o.form !== 'board' || o.storeSku === 'STB-ZERO-PTAG-2X4-72-001') };
    const fixed = evaluate(fixture([b]), fixedGuideCatalog); complete(fixed); assert.equal(fixed.Q, 11.15);
  });
  const five = fixture([pkg('FIVE-STRIPS', Array.from({ length: 5 }, (_, i) => part('STRIP-' + i, 44)))]);
  let mixed;
  await check('five strips: mixed parent lengths beat every homogeneous candidate', () => {
    mixed = evaluate(five); complete(mixed);
    assert.equal(mixed.optimization.searchComplete, true);
    assert.ok(mixed.selectedStock.length > 1, JSON.stringify(mixed.selectedStock));
    const lengths = mixed.selectedStock.map(s => catalog.offerings.find(o => o.storeSku === s.storeSku).stockL_in);
    assert.ok(lengths.includes(72) && lengths.includes(120), JSON.stringify(lengths));
    const skuSet = new Set(mixed.selectedStock.map(s => s.storeSku));
    const alternatives = catalog.offerings.filter(o => o.form === 'board' && o.species === 'pine' && o.nominalT === 1 && o.nominalW === 8 && o.grade === 'select');
    for (const row of alternatives) {
      const limited = { ...clone(catalog), offerings: catalog.offerings.filter(o => o.form !== 'board' || o.storeSku === row.storeSku) };
      const one = evaluate(five, limited); if (one.complete) assert.ok(mixed.Q < one.Q, row.storeSku + ':' + one.Q);
    }
    assert.ok(skuSet.size >= 2);
  });
  await check('equivalent package partitions have the same selected stock, occupied time, and Q', () => {
    const split = fixture([pkg('FOUR', five.boards[0].parts.slice(0, 4)), pkg('ONE', five.boards[0].parts.slice(4))]);
    const r = evaluate(split); complete(r); assert.equal(r.Q, mixed.Q); assert.equal(r.time.totalSeconds, mixed.time.totalSeconds);
    assert.deepEqual(r.selectedStock, mixed.selectedStock);
  });
  await check('cumulative inventory: eight required parents cannot use four available', () => {
    const row = clone(catalog.offerings.find(o => o.form === 'board' && o.species === 'pine' && o.nominalT === 1 && o.nominalW === 8 && o.grade === 'select' && o.stockL_in === 96));
    row.onHand = 4; row.allocated = 0;
    const c = { ...clone(catalog), offerings: [row] };
    // Each 70-inch part plus both kerfs leaves 25.75 inches, independently
    // satisfying the declared 24-inch control minimum on a 96-inch parent.
    const j = fixture([pkg('A', Array.from({ length: 4 }, (_, i) => part('A-' + i, 70))), pkg('B', Array.from({ length: 4 }, (_, i) => part('B-' + i, 70)))]);
    const r = evaluate(j, c); assert.equal(r.status, 'UNAVAILABLE'); assert.equal(r.Q, null);
  });
  await check('mixed lengths keep shorter parents that fit only the shorter parts', () => {
    const rows = [72, 120].map(length => {
      const row = clone(catalog.offerings.find(o => o.form === 'board' && o.species === 'poplar'
        && o.nominalT === 1 && o.nominalW === 8 && o.stockL_in === length));
      row.onHand = 1; row.allocated = 0; return row;
    });
    const c = { ...clone(catalog), offerings: rows };
    const b = pkg('MIXED-LENGTHS', [part('TALL', 94), part('SHORT', 20)]);
    b.material.species = 'poplar';
    const r = evaluate(fixture([b]), c); complete(r);
    assert.equal(r.optimization.searchComplete, true);
    assert.deepEqual(r.selectedStock.map(s => [s.stockL_in, s.qty]).sort((a,b)=>a[0]-b[0]), [[72,1],[120,1]]);
    assert.deepEqual(r.manifestCoverage.boardPartIds, ['SHORT','TALL']);
    const shortParent = r.parents.find(p => p.stockL_in === 72);
    assert.deepEqual(shortParent.partIds, ['SHORT']);
    const split = [pkg('TALL-PACKAGE', [b.parts[0]]), pkg('SHORT-PACKAGE', [b.parts[1]])];
    split.forEach(p => { p.material.species = 'poplar'; });
    const partitioned = evaluate(fixture(split), c); complete(partitioned);
    assert.equal(partitioned.Q, r.Q);
    assert.deepEqual(partitioned.selectedStock, r.selectedStock);
    rows[0].onHand = 0;
    const unavailable = evaluate(fixture([b]), c);
    assert.equal(unavailable.complete, false); assert.equal(unavailable.Q, null);
  });
  await check('manifest rejects missing wood, missing hardware, duplicate components, and missing manifest', () => {
    for (const change of [j => { j.boards[0].parts.pop(); }, j => { j.boards = []; }, j => { j.manifest = null; }, j => { j.boards[0].parts[1].partId = j.boards[0].parts[0].partId; }]) {
      const j = clone(five); change(j); assert.equal(evaluate(j).complete, false);
    }
    const j = clone(five); j.manifest.items.push({ lineId: 'REQUIRED-HARDWARE', qty: 1 }); assert.equal(evaluate(j).complete, false);
  });
  await check('unknown fields and unrepresented operations refuse rather than disappear', () => {
    const j = clone(five); j.boards[0].parts[0].requestedGrooveDepthIn = 0.25;
    assert.ok(evaluate(j).reasonCodes[0].includes('FIELD_NOT_DECLARED'));
    delete j.boards[0].parts[0].requestedGrooveDepthIn; j.boards[0].requiredOps = ['CROSSCUT', 'DRILL'];
    assert.ok(evaluate(j).reasonCodes[0].includes('REQUIRED_OPERATION_NOT_REPRESENTED:DRILL'));
  });
  await check('angle alone and carried unevaluated job requirements cannot complete the job', () => {
    const j = clone(five); j.boards[0].endCut.angleDeg = 25;
    assert.ok(evaluate(j).reasonCodes.includes('END_RELATION_NOT_REGISTERED'));
    j.boards[0].endCut.angleDeg = 0; j.manifest.unresolvedRequirements = ['REQUESTED_SANDING_NOT_EVALUATED'];
    assert.equal(evaluate(j).status, 'UNRESOLVED'); assert.equal(evaluate(j).Q, null);
  });
  await check('V1 conversion requires an independent manifest; it preserves raw source and refuses unknown fields', () => {
    const request = { requestType: 'CUT_PACKAGE_V1', requestId: 'TEST-COMPILE', demand: {
      configurationId: five.jobId, configurationVersion: five.revision, cutPackages: clone(five.boards), itemLines: [] } };
    const compiled = compileDefinition(request, five.manifest); assert.equal(compiled.status, 'COMPILED');
    assert.deepEqual(compiled.job.source, request); complete(evaluateDefinition(catalog, request, five.manifest));
    assert.equal(compileDefinition(request).complete, false);
    const altered = clone(request); altered.demand.requestedGroove = 0.25;
    assert.ok(compileDefinition(altered, five.manifest).reasonCodes.includes('FIELD_NOT_DECLARED:requestedGroove'));
  });
  await check('hardware resolves exact meaning, pools identical piece requirements, and covers each line', () => {
    const row = catalog.offerings.find(o => o.form === 'hardware' && o.fastener?.kind === 'WOOD_SCREW_10' && o.fastener.tier === 'COATED');
    const c = { ...clone(catalog), offerings: [{ ...clone(row), onHand: 1, allocated: 0 }] };
    const meaning = { kind: 'wood-screw', gauge: '#10', lengthIn: row.fastener.lengthIn, finish: 'coated', unit: 'piece' };
    const q = Math.max(1, Math.floor(row.fastener.piecesPerPackage / 3));
    const j = fixture([], [], [{ lineId: 'H1', qty: q, requirement: meaning }, { lineId: 'H2', qty: q, requirement: meaning }]);
    const r = evaluate(j, c); complete(r); assert.equal(r.selectedStock[0].qty, 1);
    assert.deepEqual(r.manifestCoverage.itemLineIds, ['H1', 'H2']); assert.equal(r.Q, row.sellingPrice);
    j.items[1].qty = row.fastener.piecesPerPackage + 1; j.manifest.items[1].qty = j.items[1].qty;
    assert.equal(evaluate(j, c).status, 'UNAVAILABLE');
  });
  await check('prepared-width control envelope applies after milling', () => {
    const j = fixture([pkg('NARROW', [part('N', 44)], { finishedWidthIn: 1 })]);
    const r = evaluate(j); assert.equal(r.complete, false); assert.equal(r.Q, null);
    assert.ok(r.reasonCodes.includes('PREPARED_WIDTH_OUTSIDE_CONTROL_ENVELOPE'));
  });
  let mill;
  await check('router diameter/pass depth are explicit; pass revision changes trace/model/time together', () => {
    const j = fixture([pkg('MILLED', [part('M', 44)], { finishedWidthIn: 6.75 })]);
    mill = evaluate(j); complete(mill);
    const deeper = evaluate(j, catalog, createModel({ routerPassDepthIn: 0.375 })); complete(deeper);
    assert.ok(deeper.time.totalSeconds > mill.time.totalSeconds);
    assert.notEqual(mill.model.hash, deeper.model.hash);
    assert.equal(mill.operations.filter(e => e.kind === 'ROUTER_CUT').length, 1);
    assert.equal(deeper.operations.filter(e => e.kind === 'ROUTER_CUT').length, 2);
    assert.ok(mill.operations.find(e => e.kind === 'ROUTER_CUT').pathLengthIn > 44);
    assert.ok(deeper.totals.machine_service > mill.totals.machine_service);
  });
  await check('fixed stock: slower feed raises service and total Q', () => {
    const j = fixture([pkg('MILLED', [part('M', 44)], { finishedWidthIn: 6.75 })]);
    const only = { ...clone(catalog), offerings: catalog.offerings.filter(o => o.storeSku === mill.selectedStock[0].storeSku) };
    const a = evaluate(j, only), b = evaluate(j, only, createModel({ longitudinalFeedInPerMin: 24 })); complete(a); complete(b);
    assert.equal(a.totals.material, b.totals.material); assert.ok(b.Q > a.Q);
  });
  const sheetRow = catalog.offerings.find(o => o.form === 'sheet' && o.actualT === 0.5 && o.sheetL_in === 96 && o.sheetW_in === 48 && o.supportedOps.includes('ROUTE_PROFILE'));
  const sheetPkg = { packageId: 'SHEET', sheet: { thicknessIn: 0.5, lengthIn: 96, widthIn: 48, species: sheetRow.species, grade: sheetRow.grade }, returnAllPieces: true,
    features: [{ featureId: 'OPENING', kind: 'ARCHED_APERTURE', placement: 'CENTERED', widthIn: 30, straightHeightIn: 18, riseIn: 12, retain: 'TABS', requestedTabCount: 4 },
      { featureId: 'SPLIT', kind: 'STRAIGHT_SPLIT', within: 'OPENING', line: 'VERTICAL_CENTERLINE' },
      { featureId: 'LEFT-CUT', kind: 'CROSSCUT', fromEnd: 'LEFT', distanceIn: 18 },
      { featureId: 'RIGHT-CUT', kind: 'CROSSCUT', fromEnd: 'RIGHT', distanceIn: 18 }] };
  let sheet;
  await check('sheet route, retained halves, two yard cuts, labels, and separate billing', () => {
    sheet = evaluate(fixture([], [sheetPkg])); complete(sheet);
    assert.equal(sheet.totals.manual_cut_service, 20);
    assert.ok(sheet.time.fixedPriceOccupiedSeconds > 0);
    assert.equal(sheet.totals.machine_service, money(sheet.time.hourlyBilledSeconds * 250 / 3600));
    assert.deepEqual(sheet.manifestCoverage.featureIds, ['LEFT-CUT', 'OPENING', 'RIGHT-CUT', 'SPLIT']);
    assert.ok(sheet.parents[0].geometry.routes.every(r => r.tabs >= 2));
  });
  await check('custom split without positions stays unresolved; no complete Q', () => {
    const s = clone(sheetPkg); s.features[1].splitTabMode = 'CUSTOM';
    const r = evaluate(fixture([], [s])); assert.equal(r.status, 'UNRESOLVED'); assert.ok(r.reasonCodes.includes('SPLIT_TAB_POSITIONS_REQUIRED')); assert.equal(r.Q, null);
  });
  await check('board and sheet definition adapters reach the same engine and preserve required features', () => {
    const b = pkg('NEUTRAL-TEST', [part('P1', 18, [{ featureId: 'F1', xIn: 9, acrossWidthRule: 'CENTERED_ON_WIDE_FACE' }]),
      part('P2', 18, [{ featureId: 'F2', xIn: 9, acrossWidthRule: 'CENTERED_ON_WIDE_FACE' }])], {
        material: { species: 'syp-treated', form: 'board', nominalT: 2, nominalW: 4, grade: 'above-ground' },
        endCut: { angleDeg: Math.asin(8 / 18) * 180 / Math.PI, endRelation: 'parallel', lengthDatum: 'long-long-outer-edge', plane: 'miter-face' },
        minimumParentLengthIn: 60, singleParent: true, preserveOrder: true, requiredOps: ['MITER_LIMITED', 'SPOT_ON_LOCATION'] });
    const j = fixture([b]);
    const request = { requestType: 'USER_DEFINED_BOARD_V1', requestId: 'BOARD-ADAPTER', demand: {
      configurationId: j.jobId, configurationVersion: j.revision, materialDemand: b.material, definedWorkpieceLengthIn: 60,
      sawAngleDeg: b.endCut.angleDeg, requiredOps: b.requiredOps, cutPlane: 'miter-face', datumCMethod: 'REFERENCE_CUT',
      endRelation: 'parallel', lengthDatum: 'long-long-outer-edge', declaredSawCuts: 3, declaredSpotCount: 2, unresolvedConditions: [],
      parts: b.parts.map(p => ({ partId: p.partId, lengthIn: p.lengthIn, features: p.spots.map(f => ({ ...f, kind: 'SPOT_ON_LOCATION', locationRule: 'CENTERED_ON_PART' })) })) } };
    const a = evaluateDefinition(catalog, request, j.manifest); complete(a);
    assert.ok(Math.abs(a.time.totalSeconds - 86.469536) < 0.000001); assert.equal(a.manifestCoverage.featureIds.length, 2);
    const s = { ...clone(sheetPkg), packageId: 'NEUTRAL-TEST' }, sj = fixture([], [s]);
    const sheetRequest = { requestType: 'SHEET_PACKAGE_V1', requestId: 'SHEET-ADAPTER', demand: {
      configurationId: sj.jobId, configurationVersion: sj.revision, sheet: s.sheet, features: s.features, returnAllPieces: true } };
    const sr = evaluateDefinition(catalog, sheetRequest, sj.manifest); complete(sr); assert.equal(sr.Q, sheet.Q);
    assert.equal(sr.manifestCoverage.featureIds.length, s.features.length);
  });
  await check('sheet work-field, orthogonal staging, overlapping apertures, and unused fields refuse', () => {
    for (const mutate of [s => { s.features[0].widthIn = 50; }, s => { s.features.push({ featureId: 'RIP', kind: 'RIP', fromEdge: 'BOTTOM', distanceIn: 8 }); },
      s => { s.features[2].riseIn = 2; }, s => { s.features.push({ ...clone(s.features[0]), featureId: 'SECOND-OPENING' }); }]) {
      const s = clone(sheetPkg); mutate(s); assert.equal(evaluate(fixture([], [s])).complete, false);
    }
  });
  await check('complete ledger independently sums to occupied time, hourly charge and Q', () => {
    for (const r of [reference, mixed, mill, sheet]) {
      const total = r.operations.reduce((s, e) => s + e.seconds, 0); assert.equal(total, r.time.totalSeconds);
      assert.equal(r.operations.at(-1).endSec, total);
      const hourlySeconds = r.operations.filter(e => e.billing === 'HOURLY').reduce((s, e) => s + e.seconds, 0);
      const wood = r.parents.filter(p => p.kind !== 'item').reduce((s, p) => s + p.unitPrice * p.qty, 0);
      assert.equal(r.totals.machine_service, money(hourlySeconds * machineHourlyRate(model) / 3600));
      assert.equal(r.Q, money(wood + r.totals.hardware + r.totals.machine_service + r.totals.manual_cut_service));
      assert.ok(r.selectedStock.every(s => s.qty <= s.available)); assert.equal(r.physicalRelease, false);
      assert.equal(r.labels.length, r.components.length + r.parents.filter(p => p.kind === 'sheet').reduce((s, p) => s + p.geometry.pieceCount, 0));
    }
  });
  await check('fresh calculation identity changes with inventory/model; deterministic reevaluation', () => {
    const a = evaluate(five), b = evaluate(five); assert.deepEqual(a, b);
    const c = clone(catalog); c.offerings[0].onHand += 1; const d = evaluate(five, c); complete(d);
    assert.notEqual(a.calculationIdentity.inputHash, d.calculationIdentity.inputHash);
  });
  await check('a bounded search reports its limit instead of claiming an optimum', () => {
    const r = evaluate(five, catalog, createModel({ searchNodeLimit: 1 })); assert.equal(r.status, 'UNRESOLVED'); assert.equal(r.Q, null);
    assert.equal(r.optimization.searchComplete, false);
  });
  return { passed: results.length, checks: results,
    examples: { digitalTrailBenchmark: { seconds: reference.time.totalSeconds, Q: reference.Q, selectedStock: reference.selectedStock },
      fiveStrips: { Q: mixed.Q, seconds: mixed.time.totalSeconds, selectedStock: mixed.selectedStock },
      oneMilledStrip: { Q: mill.Q, seconds: mill.time.totalSeconds }, sheet: { Q: sheet.Q, seconds: sheet.time.totalSeconds } } };
}

