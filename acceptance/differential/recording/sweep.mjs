// Extra corpus against the recording pin: Project 1, the default SPF job, and parameter sweeps over every
// catalog material class so the new Store is compared on far more than the old tests exercised.
const R = process.argv[2];
const { loadCatalog, evaluateDimensionalTravelJob } = await import(`${R}/store-zero-stage2-store.mjs`);
const { evaluateCutPackageJob } = await import(`${R}/cut-package-evaluator.mjs`);
const { evaluateSheetPackageJob } = await import(`${R}/sheet-package-evaluator.mjs`);
const { evaluateAlcoveJob } = await import(`${R}/alcove-store-evaluator.mjs`);
const { evaluateD001UserDefinedBoard, evaluateD001DimensionalBatch } = await import(`${R}/d001-travel-standard.mjs`);
const { envelopeCheck } = await import(`${R}/d001-stage2-envelope.mjs`);
const { evaluateCircularSegment } = await import(`${R}/circular-segment.mjs`);
const { USER1_DIMENSIONAL_TRAVEL_DEMAND } = await import(`${R}/user1-dimensional-travel-fixture.mjs`);
import fs from 'node:fs';
const catalog = loadCatalog();
const project1 = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')).demand;

evaluateDimensionalTravelJob(catalog, USER1_DIMENSIONAL_TRAVEL_DEMAND);
evaluateDimensionalTravelJob(catalog, project1);
evaluateDimensionalTravelJob(catalog, { ...project1, storeRevision: '9c62d9d6f7775deef83d47196d32c9b5174a352c' });

const boards = catalog.offerings.filter((o) => o.form === 'board');
const classes = [...new Map(boards.map((o) => [`${o.species}|${o.nominalT}|${o.nominalW}`, o])).values()];
const xbrace = (L, material, extra = {}) => ({
  ...project1,
  materialDemand: { species: material.species, form: 'board', nominalT: material.nominalT, nominalW: material.nominalW },
  sawAngleDeg: (Math.asin(8 / L) * 180) / Math.PI,
  parts: ['1', '2'].map((n) => ({ partId: `PART-${n}`, lengthIn: L, features: [{ featureId: `SPOT-${n}`, kind: 'SPOT_ON_LOCATION', xIn: L / 2, locationRule: 'CENTERED_ON_PART', acrossWidthRule: 'CENTERED_ON_WIDE_FACE' }] })),
  ...extra,
});
for (const m of classes) {
  for (let L = 16; L <= 18; L += 0.125) evaluateDimensionalTravelJob(catalog, xbrace(L, m));
  evaluateDimensionalTravelJob(catalog, xbrace(30, m, { definedWorkpieceLengthIn: 72 }));
  evaluateDimensionalTravelJob(catalog, xbrace(17, m, { sawAngleDeg: 46 }));
  evaluateDimensionalTravelJob(catalog, xbrace(17, m, { cutPlane: 'bevel' }));
  evaluateDimensionalTravelJob(catalog, xbrace(17, m, { declaredSawCuts: 4 }));
}
// Malformed and incomplete definitions: each must be answered with a reason, never guessed.
const p = project1;
for (const bad of [
  {}, { ...p, materialDemand: undefined }, { ...p, parts: [] }, { ...p, parts: [{ partId: '', lengthIn: 18 }] },
  { ...p, parts: [{ partId: 'A', lengthIn: -1 }] }, { ...p, sawAngleDeg: undefined }, { ...p, datumCMethod: 'GUESS' },
  { ...p, parts: [{ partId: 'A', lengthIn: 18, features: [{ featureId: 'S', kind: 'DRILL', xIn: 9 }] }] },
  { ...p, parts: [{ partId: 'A', lengthIn: 18, features: [{ featureId: 'S', kind: 'SPOT_ON_LOCATION', xIn: 20, acrossWidthRule: 'CENTERED_ON_WIDE_FACE' }] }] },
  { ...p, parts: [{ partId: 'A', lengthIn: 18, features: [{ featureId: 'S', kind: 'SPOT_ON_LOCATION', xIn: 9, acrossWidthRule: 'INSET_FROM_EDGE', insetFromEdgeIn: 1.75 }] }] },
  { ...p, unresolvedConditions: ['OWNER_HAS_NOT_CONFIRMED_LENGTH'] },
  { ...p, materialDemand: { species: 'walnut', form: 'board', nominalT: 2, nominalW: 4 } },
]) evaluateDimensionalTravelJob(catalog, bad);

// Direct travel evaluation against every board offering.
for (const item of boards) {
  evaluateD001UserDefinedBoard({ item, storeRevision: null, demand: { configurationId: 'SWEEP', configurationVersion: '1', classId: 'sweep', definedWorkpieceLengthIn: item.stockL_in, cut: { angleDeg: 26.387799961243, plane: 'miter-face', kerfIn: 0.125 }, datumC: { method: 'REFERENCE_CUT', stationId: 'SAW-L' }, parts: p.parts, declaredSawCuts: 3, declaredSpotCount: 2, unresolvedConditions: [] } });
  for (const ops of [['CROSSCUT'], ['MITER_LIMITED'], ['MILL_LONGITUDINAL_PROFILE'], ['DRILL'], ['SPOT_ON_LOCATION']]) {
    envelopeCheck(item, { requiredOps: ops, keptLengthIn: 30, sawAngleDeg: 30, cutPlane: 'miter-face', millYIn: 3, millDepthIn: 0.5 });
  }
}
for (const item of catalog.offerings.filter((o) => o.form !== 'board')) envelopeCheck(item, { requiredOps: ['CROSSCUT'] });

// Cut packages over every material class, square and angled, with spots and finished width.
for (const m of classes) {
  const material = { species: m.species, nominalT: m.nominalT, nominalW: m.nominalW, grade: m.grade };
  evaluateCutPackageJob(catalog, { configurationId: 'SWEEP', configurationVersion: '1', cutPackages: [
    { packageId: 'SQ', material, endCut: { angleDeg: 0 }, parts: [1, 2, 3].map((i) => ({ partId: `SQ-${i}`, lengthIn: 20 + 7 * i, spots: [{ xIn: 5, acrossWidthRule: 'CENTERED_ON_WIDE_FACE' }] })) },
    { packageId: 'ANG', material, endCut: { angleDeg: 22.5 }, parts: [1, 2].map((i) => ({ partId: `ANG-${i}`, lengthIn: 31.375 })) },
    { packageId: 'W', material, endCut: { angleDeg: 0 }, finishedWidthIn: Math.max(0.5, (m.actualW ?? 3) - 0.5), parts: [{ partId: 'W-1', lengthIn: 40 }] },
    { packageId: 'NOGRADE', material: { ...material, grade: undefined }, endCut: { angleDeg: 0 }, parts: [{ partId: 'N-1', lengthIn: 30 }] },
  ], itemLines: [] });
}
for (const item of catalog.offerings.filter((o) => o.form === 'hardware')) {
  evaluateCutPackageJob(catalog, { configurationId: 'SWEEP', configurationVersion: '1', cutPackages: [], itemLines: [{ lineId: 'L', storeSku: item.storeSku, qty: 3 }] });
  if (item.fastener) evaluateCutPackageJob(catalog, { configurationId: 'SWEEP', configurationVersion: '1', cutPackages: [], itemLines: [{ lineId: 'H', qty: 37, requirement: { ...item.fastener, unit: 'piece', ...(item.fastener.piecesPerPackage ? {} : {}) } }] });
}

// Sheets: every sheet thickness, a range of apertures and crosscuts.
for (const s of catalog.offerings.filter((o) => o.form === 'sheet')) {
  for (const [w, h, r, cuts] of [[36, 24, 12, [18, 18]], [30, 20, 10, [12, null]], [48, 24, 12, [18, 18]], [36, 24, 20, [18, 18]], [36, 24, 12, [40, 18]], [36, 24, 12, [3, 18]], [10, 8, 4, [null, null]]]) {
    const features = [
      { featureId: 'OPENING', kind: 'ARCHED_APERTURE', placement: 'CENTERED', widthIn: w, straightHeightIn: h, riseIn: r, retain: 'TABS', requestedTabCount: 4 },
      { featureId: 'SPLIT', kind: 'STRAIGHT_SPLIT', within: 'OPENING', line: 'VERTICAL_CENTERLINE' },
    ];
    if (cuts[0] != null) features.push({ featureId: 'CL', kind: 'CROSSCUT', fromEnd: 'LEFT', distanceIn: cuts[0] });
    if (cuts[1] != null) features.push({ featureId: 'CR', kind: 'CROSSCUT', fromEnd: 'RIGHT', distanceIn: cuts[1] });
    evaluateSheetPackageJob(catalog, { configurationId: 'SWEEP', configurationVersion: `${s.storeSku}-${w}-${h}-${r}-${cuts}`, sheet: { thicknessIn: s.actualT ?? s.nominalT, lengthIn: s.sheetL_in, widthIn: s.sheetW_in, species: s.species, grade: s.grade }, features, returnAllPieces: true });
  }
}
for (const [c, h, r] of [[36, 12, undefined], [36, 12, 19.5], [36, 12, 19.6], [undefined, 12], [0, 1], ['x', 1], [10, 1, -2]]) evaluateCircularSegment({ chord_in: c, rise_in: h, radius_in: r });

// Alcove across species and sizes.
const alcove = (species, { height = 65, depth = 14, span = 44, shelfCount = 5 } = {}) => {
  const programs = [];
  for (let i = 0; i < 4; i++) programs.push({ componentId: `U-${i}`, requirementId: 'UPRIGHTS', finishedLengthIn: height, finishedWidthIn: 5.5, features: [] });
  for (let s = 0; s < shelfCount; s++) for (let k = 0; k < Math.ceil(depth / 5.5); k++) {
    const w = Math.min(5.5, depth - 5.5 * k);
    programs.push({ componentId: `S-${s}-${k}`, requirementId: 'SHELVES', finishedLengthIn: span, finishedWidthIn: w, features: w < 5.5 ? [{ featureId: `R-${s}`, kind: 'MILL_LONGITUDINAL_PROFILE', pathLengthIn: span, yIn: w, totalDepthIn: 0.75 }] : [] });
  }
  return { title: 'sweep', classId: 'alcove', configurationId: 'SWEEP', configurationVersion: `${species}-${height}-${depth}-${span}-${shelfCount}`,
    materialDemand: { species, form: 'board', nominalT: 1, nominalW: 6, grade: 'select' },
    boardRequirements: [{ requirementId: 'UPRIGHTS', role: 'UPRIGHT', requiredOps: ['CROSSCUT'] }, { requirementId: 'SHELVES', role: 'SHELF', requiredOps: ['CROSSCUT'] }],
    componentPrograms: programs, hardwareDemand: { requirementId: 'ALCOVE-PINS-AND-SCREWS', qty: 1 }, unresolvedConditions: [] };
};
for (const sp of ['pine', 'poplar', 'oak', 'cherry', 'walnut']) for (const dims of [{}, { height: 72 }, { height: 30, span: 24 }, { depth: 11, shelfCount: 3 }, { span: 90 }]) evaluateAlcoveJob(catalog, alcove(sp, dims));
