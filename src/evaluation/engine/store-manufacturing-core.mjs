/**
 * STORE MANUFACTURING CORE — adopted declared model revision 0.1, 11 October 2026.
 * One dependency-free Node 22 ES module; one evaluation engine for neutral jobs.
 * This is the sole runtime manufacturing planner, occupied-time ledger and Q engine.
 *
 * PUBLIC API
 *   createModel({ routerDiameterIn: 1, routerPassDepthIn: 0.75 })
 *   compileDefinition(request, manifest) -> neutral job, or named refusal
 *   evaluateManufacturingJob(catalog, job, model) -> SKU plan, event ledger, Q
 *   evaluateDefinition(catalog, request, manifest, model) -> the same engine
 *   runSelfChecks(catalog) -> independent assertions; no machine or network I/O
 *
 * MODEL SOURCE
 *   D001 PROJECT1 DIGITAL TRAIL REVIEW 0.2, sections 7–12, Appendices C–F.
 *   Preserved publication: store-zero/docs/project-1-digital-trail/.
 *   D-001 geometry: the current declared envelope, not commissioned workholding.
 *   S-001: current S001-STAGE2-ENVELOPE-0.2 and stencil-tab policy.
 *   Router diameter 1 in and axial pass depth 0.75 in: owner's proposed D-001
 *   revision. Diameter and pass depth are distinct facts. D-001 longitudinal
 *   feed remains an explicit 48 in/min assumption; diameter does not set feed.
 *   S-001 retains its separately declared 0.5 in cutter and 0.5 in pass depth.
 *
 * PROGRAM ALIGNMENT — REVIEWED 11 OCTOBER 2026
 *   3d-solutions-program at 5093b08dfafddfd38b345b816727739dc3bf5285:
 *   governance/authority.md and research/bounded-cell-trial.md govern the
 *   ownership and research scope of this candidate. System owns shared job
 *   meaning; Store owns stock selection, modeled time and manufacturing Q;
 *   Program retains research, candidate engineering and adoption rationale;
 *   the local implementation owns commissioned configuration and execution.
 *   See commercial-sequence-template.md for the separate proposed transaction
 *   contract, its required events, evidence and integration surfaces.
 *
 *   This engine returns evaluated manufacturing facts only. selectedStock is
 *   a proposed SKU/quantity plan, not a reservation or physical allocation.
 *   operations is a predicted occupancy ledger, not observed execution. Q is
 *   material, hardware and declared machine/cut service; the complete service
 *   trial must separately account for preparation, inspection, staging,
 *   handoff, failed attempts, rework and support without double counting.
 *   A seller's offer separately identifies its terms and any additional
 *   charges or allowances. System carries that attributable offer unchanged.
 *
 *   Commercial events consume the exact adopted Store answer and receipt:
 *   project/definition/revision, request/receipt, calculation input/result,
 *   model/release authority, offer/version, decision, order and packet identities.
 *   Keep order, payment, reservation, allocation, capacity, production release,
 *   local admission, execution, inspection and custody records distinct.
 *   Acceptance never manufactures payment or allocation evidence. A revised
 *   requirement requires a fresh Store answer and a new offer or change record.
 *   Hashes establish content identity; they do not authenticate an actor or
 *   establish payment, physical readiness, inspection or custody.
 *   This review changes the integration contract in comments, not the model,
 *   calculation schema, executable behavior, adopted capability or live pins.
 *
 * RUNTIME CONTRACT
 *   STORE-ZERO-REQUEST-2 requires a complete System manifest on every job ask.
 *   The three definition shapes are conversion inputs to this single engine.
 *   Store's sole request layer validates the catalog, supplies the registered
 *   model, and issues one receipt binding definition, manifest, model and release.
 *   Accepted packets use STB-ACCEPTED-JOB-PACKET-2. The machine side consumes this
 *   exact ledger under the same registered model; it never recomputes a price.
 *   Commercial progression uses the shared C01–C16 evidence contract.
 *
 * SEARCH AND TIMING BOUNDARY
 *   Search mixed SKUs/parent lengths, exact quantities, and cumulative inventory.
 *   A board's part order is deterministic (longest first; V1 single-workpiece
 *   definitions preserve their order). Different permutations, cross-section
 *   rotation, route rearrangement, reuse of remnants, and concurrent cells are
 *   outside this declared plan space. A search limit is reported, never concealed.
 *   Trace and Q use the SAME occupied-time events. Per-cut panel-saw billing is
 *   separate from hourly billing so those seconds are not charged twice.
 *   All money rounds once at whole-job service and total boundaries.
 *   Physical release remains false. The paper's contact/face/stroke gaps remain
 *   named; a modeled quote does not resolve them.
 *
 * VERIFICATION
 *   tests/manufacturing-core.test.mjs exercises the guide benchmark, geometry,
 *   inventory, manifest coverage, milling passes and independent Q reconciliation.
 *   Historical answers and Project 1 publications remain unchanged.
 */
import { createHash } from 'node:crypto';

const EPS = 1e-9;
const number = v => typeof v === 'number' && Number.isFinite(v);
const positive = v => number(v) && v > 0;
const text = v => typeof v === 'string' && v.trim().length > 0;
const money = v => Math.round((v + Number.EPSILON) * 100) / 100;
const unique = a => [...new Set(a)];
const clone = v => structuredClone(v);
const object = v => v && typeof v === 'object' && !Array.isArray(v);
function freeze(v) { if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (object(v)) return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  if (v === undefined || (typeof v === 'number' && !Number.isFinite(v))) throw new Error('NON_JSON_CALCULATION_VALUE');
  return JSON.stringify(v);
}
export const calculationHash = v => createHash('sha256').update(canonical(v)).digest('hex');

class Problem extends Error {
  constructor(code, subject = 'job', status = 'REFUSED', details={}) { super(code); this.code = code; this.subject = subject; this.status = status;this.details=details; }
}
function need(test, code, subject = 'job', status = 'REFUSED') { if (!test) throw new Problem(code, subject, status); }
function keys(v, allowed, subject) {
  need(object(v), 'OBJECT_REQUIRED', subject);
  for (const k of Object.keys(v)) need(allowed.includes(k), 'FIELD_NOT_DECLARED:' + k, subject);
}
function identity(v, subject) { need(text(v), 'IDENTITY_REQUIRED', subject, 'UNRESOLVED'); }
function exactSet(a, b, subject) {
  need(Array.isArray(a) && Array.isArray(b), 'MANIFEST_LIST_REQUIRED', subject, 'UNRESOLVED');
  need(a.every(text) && unique(a).length === a.length && unique(b).length === b.length,
    'DUPLICATE_OR_INVALID_IDENTITY', subject);
  need(canonical([...a].sort()) === canonical([...b].sort()), 'MANIFEST_COVERAGE_MISMATCH', subject);
}

export function createModel({ routerDiameterIn = 1, routerPassDepthIn = 0.75,
  longitudinalFeedInPerMin = 48, productiveHours = 600, searchNodeLimit = 200000 } = {}) {
  need([routerDiameterIn, routerPassDepthIn, longitudinalFeedInPerMin, productiveHours].every(positive), 'MODEL_POSITIVE_VALUES_REQUIRED', 'model');
  need(Number.isInteger(searchNodeLimit) && searchNodeLimit > 0, 'SEARCH_LIMIT_INVALID', 'model');
  return freeze({
    id: 'STORE-MANUFACTURING-CORE-0.1', units: { length: 'in', angle: 'deg', time: 's', money: 'USD' },
    basis: 'DECLARED_REFERENCE_MODEL', measured: false, commissioned: false,
    source: 'D001 PROJECT1 DIGITAL TRAIL REVIEW 0.2; separately declared S-001 model',
    economics: { annualCostPoolUsd: 120000, productiveHours, targetGrossMargin: 0.20,
      components: { operator: 50000, capital: 25000, premises: 20000, maintenanceTooling: 15000, energyDustIT: 10000 } },
    dimensional: {
      handling: { loadSeatSec: 36, releaseLabelSec: 24 },
      motion: { X: { velocity: 8, acceleration: 32 }, Y: { velocity: 4, acceleration: 16 },
        A: { velocity: 30, acceleration: 120 }, S: { velocity: 6, acceleration: 24 }, Z: { velocity: 2, acceleration: 16 } },
      allowances: { angleSettleSec: 0.1, clampSec: 0.25, sawOffSec: 0.05,
        referenceCaptureSec: 0.01, positionVerifySec: 0.05, spindleReadySec: 0.5 },
      saw: { diameterIn: 20, rpm: 1800, teeth: 80, chipLoadIn: 0.003, finishFactor: 0.5,
        approachIn: 1.5, kerfIn: 0.125, maxAngleDeg: 45, strokeBasis: 'VIRTUAL_WIDTH_OVER_COSINE_BENCHMARK' },
      spot: { diameterIn: 0.1875, rpm: 3000, feedPerRevIn: 0.008, pointAngleDeg: 118,
        fullDiameterDepthIn: 0.1875, clearanceIn: 0.25, insetsIn: [1.5, 2] },
      router: { diameterIn: routerDiameterIn, axialPassDepthIn: routerPassDepthIn,
        longitudinalFeedInPerMin, plungeFeedInPerMin: 24, clearanceIn: 0.25,
        startupSec: 0.5, plungeBasis: 'EXPLICIT_NEW_REFERENCE_ALLOWANCE', maxProfileLengthIn: 60,
        maxRadialRemovalPerSideIn: 1, maxTravelYIn: 14 },
      stations: { sawXIn: 0, toolXIn: 36, rollersXIn: [24, 48] },
      stock: { minWidthIn: 1.5, maxWidthIn: 12, minThicknessIn: 0.75,
        maxSawThicknessIn: 3.5, maxRouterThicknessIn: 1.5, minRetainedLengthIn: 24 },
      faceConvention: 'NOMINAL_C_REBASE_AFTER_LONGITUDINAL_KERF_ALLOWANCE'
    },
    sheet: {
      field: { lengthIn: 48, widthIn: 36 }, stock: { lengthIn: 96, widthIn: 48, minThicknessIn: 0.25, maxThicknessIn: 0.75 },
      router: { diameterIn: 0.5, axialPassDepthIn: 0.5, feedInPerMin: 60, loadReferenceSec: 120,
        releaseSec: 60, plungeRetractSec: 10, tabTransitionSec: 2, minFeatureIn: 6, minSplitWidthIn: 3 },
      tabs: { bridgeIn: 1, minimumCount: 4, retainedFraction: 0.05, maxUncutSpanIn: 24, minPerSplitHalf: 2 },
      panelSaw: { kerfIn: 0.125, positionToleranceIn: 0.25, minPieceIn: 6, clearanceIn: 1,
        alignSec: 45, feedInPerMin: 150, pricePerCut: 10 },
      labelSecPerPiece: 10
    },
    search: { nodeLimit: searchNodeLimit, maxPartTypesPerGroup: 20,
      planSpace: 'MIXED_PARENTS_FIXED_GROUP_ORDER_FIXED_PART_ORDER_NO_REMNANT_REUSE_NO_CONCURRENCY' }
  });
}

export function moveSeconds(distance, velocity, acceleration) {
  need(number(distance) && positive(velocity) && positive(acceleration), 'MOTION_FACT_REQUIRED', 'motion', 'UNRESOLVED');
  const d = Math.abs(distance);
  return d === 0 ? 0 : d >= velocity * velocity / acceleration
    ? d / velocity + velocity / acceleration : 2 * Math.sqrt(d / acceleration);
}
export function machineHourlyRate(model) {
  const e = model.economics;
  need(positive(e.annualCostPoolUsd) && positive(e.productiveHours) && number(e.targetGrossMargin)
    && e.targetGrossMargin >= 0 && e.targetGrossMargin < 1, 'ECONOMICS_INVALID', 'model');
  need(Math.abs(Object.values(e.components).reduce((s, v) => s + v, 0) - e.annualCostPoolUsd) < EPS, 'COST_POOL_DOES_NOT_RECONCILE', 'model');
  return e.annualCostPoolUsd / e.productiveHours / (1 - e.targetGrossMargin);
}

// Exact accepted V1 fields. Their values remain visible in the compiled source.
const MATERIAL_KEYS = ['species', 'form', 'nominalT', 'nominalW', 'grade'];
const SPOT_KEYS = ['featureId', 'kind', 'xIn', 'locationRule', 'acrossWidthRule', 'insetFromEdgeIn', 'toolDiameterIn', 'fullDiameterDepthIn'];
const PROFILE_KEYS = ['featureId', 'kind', 'pathLengthIn', 'yIn', 'totalDepthIn'];
const SHEET_FEATURE_KEYS = ['featureId', 'kind', 'placement', 'widthIn', 'straightHeightIn', 'riseIn', 'retain', 'requestedTabCount',
  'tabMode', 'tabPositionsIn', 'splitTabMode', 'splitTabPositionsIn', 'within', 'line', 'fromEnd', 'fromEdge', 'distanceIn', 'offsetXIn', 'offsetYIn'];
const ITEM_KEYS = ['lineId', 'storeSku', 'requirementId', 'qty', 'requirement'];

export function compileDefinition(request, manifest) {
  try {
    keys(request, ['requestType', 'requestId', 'demand'], 'request'); identity(request.requestId, 'requestId');
    const d = request.demand; need(object(d), 'DEFINITION_REQUIRED', 'demand', 'UNRESOLVED');
    identity(d.configurationId, 'configurationId'); identity(d.configurationVersion, 'configurationVersion');
    const job = { schema: 'STORE-MANUFACTURING-JOB-1', jobId: d.configurationId, revision: d.configurationVersion,
      manifest: clone(manifest ?? null), boards: [], sheets: [], items: [], source: clone(request) };
    if (request.requestType === 'USER_DEFINED_BOARD_V1') {
      keys(d, ['title', 'configurationId', 'configurationVersion', 'classId', 'materialDemand', 'definedWorkpieceLengthIn', 'requiredOps',
        'sawAngleDeg', 'cutPlane', 'datumCMethod', 'endRelation', 'lengthDatum', 'endIdentity', 'declaredSawCuts', 'declaredSpotCount',
        'unresolvedConditions', 'parts'], 'demand');
      need(d.endRelation === 'parallel' && d.lengthDatum === 'long-long-outer-edge' && d.endIdentity == null, 'END_GEOMETRY_NOT_DECLARED', 'demand');
      need(d.cutPlane === 'miter-face' && d.datumCMethod === 'REFERENCE_CUT', 'REFERENCE_PROCESS_NOT_DECLARED', 'demand');
      need(Array.isArray(d.unresolvedConditions) && !d.unresolvedConditions.length, 'CARRIED_REQUIREMENT_UNRESOLVED', 'demand', 'UNRESOLVED');
      need(positive(d.definedWorkpieceLengthIn), 'DEFINED_WORKPIECE_LENGTH_REQUIRED', 'demand', 'UNRESOLVED');
      need(Array.isArray(d.parts) && d.parts.length, 'PARTS_REQUIRED', 'demand', 'UNRESOLVED');
      const parts = d.parts.map(p => {
        keys(p, ['partId', 'lengthIn', 'features'], p.partId || 'part');
        need(Array.isArray(p.features), 'FEATURE_LIST_REQUIRED', p.partId, 'UNRESOLVED');
        p.features.forEach(f => keys(f, SPOT_KEYS, f.featureId || 'feature'));
        need(p.features.every(f => f.kind === 'SPOT_ON_LOCATION'), 'FEATURE_KIND_NOT_HANDLED', p.partId);
        return { partId: p.partId, lengthIn: p.lengthIn, spots: clone(p.features), edgeProfiles: [] };
      });
      need(d.declaredSawCuts === parts.length + 1, 'DECLARED_SAW_COUNT_MISMATCH', 'demand');
      need(d.declaredSpotCount === parts.reduce((s, p) => s + p.spots.length, 0), 'DECLARED_SPOT_COUNT_MISMATCH', 'demand');
      need(Array.isArray(d.requiredOps), 'REQUIRED_OPERATIONS_REQUIRED', 'demand', 'UNRESOLVED');
      job.boards.push({ packageId: d.configurationId, material: clone(d.materialDemand), endCut: { angleDeg: d.sawAngleDeg,
        endRelation: d.endRelation, lengthDatum: d.lengthDatum, plane: d.cutPlane },
        minimumParentLengthIn: d.definedWorkpieceLengthIn, singleParent: true, preserveOrder: true,
        requiredOps: clone(d.requiredOps), parts });
    } else if (request.requestType === 'CUT_PACKAGE_V1') {
      keys(d, ['classId', 'configurationId', 'configurationVersion', 'cutPackages', 'itemLines'], 'demand');
      need(Array.isArray(d.cutPackages), 'CUT_PACKAGES_REQUIRED', 'demand', 'UNRESOLVED');
      job.boards = clone(d.cutPackages); job.items = clone(d.itemLines ?? []);
    } else if (request.requestType === 'SHEET_PACKAGE_V1') {
      keys(d, ['configurationId', 'configurationVersion', 'sheet', 'features', 'returnAllPieces', 'exteriorRatingRequested'], 'demand');
      job.sheets = [{ packageId: d.configurationId, sheet: clone(d.sheet), features: clone(d.features),
        returnAllPieces: d.returnAllPieces, ...(d.exteriorRatingRequested !== undefined ? { exteriorRatingRequested: d.exteriorRatingRequested } : {}) }];
    } else throw new Problem('REQUEST_TYPE_NOT_HANDLED', 'requestType');
    validateJob(job);
    return { status: 'COMPILED', job };
  } catch (p) { if (!(p instanceof Problem)) throw p; return refusal(p); }
}

function validateJob(job) {
  keys(job, ['schema', 'jobId', 'revision', 'manifest', 'boards', 'sheets', 'items', 'source'], 'job');
  need(job.schema === 'STORE-MANUFACTURING-JOB-1', 'JOB_SCHEMA_NOT_HANDLED');
  identity(job.jobId, 'jobId'); identity(job.revision, 'revision');
  for (const k of ['boards', 'sheets', 'items']) need(Array.isArray(job[k]), 'JOB_LIST_REQUIRED', k, 'UNRESOLVED');
  need(job.boards.length + job.sheets.length + job.items.length > 0, 'EMPTY_JOB');
  const m = job.manifest;
  keys(m, ['jobId', 'revision', 'boardPartIds', 'sheetPackageIds', 'featureIds', 'items', 'unresolvedRequirements'], 'manifest');
  need(m.jobId === job.jobId && m.revision === job.revision, 'MANIFEST_REVISION_MISMATCH', 'manifest');
  if (m.unresolvedRequirements !== undefined) need(Array.isArray(m.unresolvedRequirements)
    && m.unresolvedRequirements.length === 0, 'JOB_REQUIREMENTS_REMAIN_UNEVALUATED', 'manifest', 'UNRESOLVED');
  const partIds = [], featureIds = [], packageIds = [];
  for (const b of job.boards) {
    keys(b, ['packageId', 'material', 'endCut', 'finishedWidthIn', 'edgePreparation', 'parts', 'minimumParentLengthIn', 'singleParent', 'preserveOrder', 'requiredOps'], b.packageId || 'board');
    identity(b.packageId, 'packageId'); packageIds.push(b.packageId);
    keys(b.material, MATERIAL_KEYS, b.packageId + '.material');
    need(text(b.material.species) && b.material.form === 'board' && positive(b.material.nominalT) && positive(b.material.nominalW), 'BOARD_MATERIAL_REQUIRED', b.packageId, 'UNRESOLVED');
    if (b.material.grade !== undefined) identity(b.material.grade, b.packageId + '.grade');
    keys(b.endCut, ['angleDeg', 'endRelation', 'lengthDatum', 'plane'], b.packageId + '.endCut');
    need(number(b.endCut.angleDeg) && b.endCut.angleDeg >= 0 && b.endCut.angleDeg <= 45, 'END_ANGLE_OUTSIDE_MODEL', b.packageId);
    if (b.endCut.angleDeg > 0) need(b.endCut.endRelation === 'parallel' && b.endCut.lengthDatum === 'long-long-outer-edge'
      && b.endCut.plane === 'miter-face', 'MITER_END_GEOMETRY_NOT_EVALUATED', b.packageId, 'UNRESOLVED');
    else {
      if (b.endCut.endRelation !== undefined) need(b.endCut.endRelation === 'parallel', 'END_RELATION_NOT_DECLARED', b.packageId);
      if (b.endCut.lengthDatum !== undefined) need(b.endCut.lengthDatum === 'long-long-outer-edge', 'LENGTH_DATUM_NOT_DECLARED', b.packageId);
      if (b.endCut.plane !== undefined) need(b.endCut.plane === 'miter-face', 'CUT_PLANE_NOT_DECLARED', b.packageId);
    }
    if (b.finishedWidthIn !== undefined) need(positive(b.finishedWidthIn), 'FINISHED_WIDTH_INVALID', b.packageId);
    if (b.edgePreparation !== undefined) {
      keys(b.edgePreparation, ['farEdgeRemovalIn', 'fenceEdgeRemovalIn'], b.packageId + '.edgePreparation');
      need(positive(b.finishedWidthIn) && positive(b.edgePreparation.farEdgeRemovalIn) && positive(b.edgePreparation.fenceEdgeRemovalIn), 'TWO_EDGE_GEOMETRY_REQUIRED', b.packageId);
    }
    if (b.minimumParentLengthIn !== undefined) need(positive(b.minimumParentLengthIn), 'MINIMUM_PARENT_LENGTH_INVALID', b.packageId);
    for (const flag of ['singleParent', 'preserveOrder']) if (b[flag] !== undefined) need(typeof b[flag] === 'boolean', 'BOOLEAN_REQUIRED:' + flag, b.packageId);
    if (b.requiredOps !== undefined) need(Array.isArray(b.requiredOps) && b.requiredOps.every(text), 'REQUIRED_OPERATIONS_INVALID', b.packageId);
    need(Array.isArray(b.parts) && b.parts.length, 'PARTS_REQUIRED', b.packageId, 'UNRESOLVED');
    for (const p of b.parts) {
      keys(p, ['partId', 'lengthIn', 'spots', 'edgeProfiles'], p.partId || 'part'); identity(p.partId, 'partId'); partIds.push(p.partId);
      need(positive(p.lengthIn), 'PART_LENGTH_REQUIRED', p.partId, 'UNRESOLVED');
      for (const [name, allowed] of [['spots', SPOT_KEYS], ['edgeProfiles', PROFILE_KEYS]]) {
        if (p[name] === undefined) continue;
        need(Array.isArray(p[name]), 'FEATURE_LIST_REQUIRED', p.partId);
        for (const f of p[name]) { keys(f, allowed, f.featureId || 'feature'); identity(f.featureId, 'featureId'); featureIds.push(f.featureId); }
      }
    }
  }
  for (const s of job.sheets) {
    keys(s, ['packageId', 'sheet', 'features', 'returnAllPieces', 'exteriorRatingRequested'], s.packageId || 'sheet');
    identity(s.packageId, 'sheet.packageId'); packageIds.push(s.packageId);
    keys(s.sheet, ['thicknessIn', 'lengthIn', 'widthIn', 'species', 'grade'], s.packageId + '.sheet');
    need([s.sheet.thicknessIn, s.sheet.lengthIn, s.sheet.widthIn].every(positive), 'SHEET_SIZE_REQUIRED', s.packageId, 'UNRESOLVED');
    need(Array.isArray(s.features), 'SHEET_FEATURES_REQUIRED', s.packageId, 'UNRESOLVED');
    need(s.returnAllPieces === true, 'ALL_PIECES_MUST_BE_RETURNED', s.packageId);
    if (s.exteriorRatingRequested !== undefined) need(typeof s.exteriorRatingRequested === 'boolean', 'EXTERIOR_REQUEST_INVALID', s.packageId);
    for (const f of s.features) { keys(f, SHEET_FEATURE_KEYS, f.featureId || 'feature'); identity(f.featureId, 'featureId'); featureIds.push(f.featureId); }
  }
  for (const i of job.items) {
    keys(i, ITEM_KEYS, i.lineId || 'item'); identity(i.lineId, 'lineId');
    need(Number.isInteger(i.qty) && i.qty > 0, 'ITEM_QUANTITY_INVALID', i.lineId);
    need(['storeSku', 'requirementId', 'requirement'].filter(k => i[k] !== undefined).length === 1, 'ITEM_IDENTITY_AMBIGUOUS', i.lineId);
    if (i.requirement) keys(i.requirement, ['kind', 'gauge', 'diameterIn', 'lengthIn', 'finish', 'unit'], i.lineId + '.requirement');
  }
  need(unique(packageIds).length === packageIds.length, 'PACKAGE_ID_DUPLICATED');
  need(unique(job.items.map(i => i.lineId)).length === job.items.length, 'ITEM_ID_DUPLICATED');
  exactSet(m.boardPartIds, partIds, 'manifest.boardPartIds');
  exactSet(m.sheetPackageIds, job.sheets.map(s => s.packageId), 'manifest.sheetPackageIds');
  exactSet(m.featureIds, featureIds, 'manifest.featureIds');
  need(Array.isArray(m.items), 'MANIFEST_ITEMS_REQUIRED', 'manifest', 'UNRESOLVED');
  m.items.forEach(i => { keys(i, ['lineId', 'qty'], 'manifest.items'); identity(i.lineId, 'manifest.item'); need(Number.isInteger(i.qty) && i.qty > 0, 'MANIFEST_QUANTITY_INVALID', i.lineId); });
  exactSet(m.items.map(i => i.lineId), job.items.map(i => i.lineId), 'manifest.items');
  need(m.items.every(i => job.items.find(l => l.lineId === i.lineId).qty === i.qty), 'MANIFEST_ITEM_QUANTITY_MISMATCH', 'manifest.items');
}

class Ledger {
  constructor(model, previous) {
    this.model = model; this.events = []; this.physicalGaps = [];
    this.state = clone(previous ?? { C: 0, Y: 0, A: 0, S: 0, Z: null, RZ: null });
    this.stock = null; this.parentId = ''; this.cell = 'D-001';
  }
  event(kind, seconds, subject, details = {}, category = 'INDEX', billing = 'HOURLY') {
    need(number(seconds) && seconds >= 0, 'DURATION_UNRESOLVED', subject, 'UNRESOLVED');
    const event = { kind, seconds, subject, parentId: this.parentId, cell: this.cell, category, billing, ...details };
    this.events.push(event); return event;
  }
  delay(kind, seconds, subject, category, details = {}) { return this.event(kind, seconds, subject, details, category); }
  move(axis, target, subject, category = 'INDEX', velocity) {
    const d = this.model.dimensional, axisModel = d.motion[axis === 'C' ? 'X' : axis === 'RZ' ? 'Z' : axis];
    need(number(target) && number(this.state[axis]), 'AXIS_POSE_REQUIRED', subject, 'UNRESOLVED');
    if (axis === 'C') need(this.state.S === 0 && (this.state.Z == null || this.state.Z >= this.stock.actualT + d.spot.clearanceIn - EPS)
      && (this.state.RZ == null || this.state.RZ >= this.stock.actualT + d.router.clearanceIn - EPS), 'INDEX_WITH_TOOL_ENGAGED', subject);
    const from = this.state[axis], seconds = moveSeconds(target - from, velocity ?? axisModel.velocity, axisModel.acceleration);
    this.event('MOVE', seconds, subject, { axis, from, target, velocity: velocity ?? axisModel.velocity, acceleration: axisModel.acceleration }, category);
    this.state[axis] = target;
  }
  contact(subject, remaining) {
    const contacts = this.model.dimensional.stations.rollersXIn.map(x => x >= this.state.C - EPS && x <= this.state.C + remaining + EPS);
    this.event('CONTROL_SCREEN', 0, subject, { nominalCIn: this.state.C, remainingLengthIn: remaining, rollerContacts: contacts });
    if (!contacts.every(Boolean)) this.physicalGaps.push({ code: 'TWO_ROLLER_CONTACT_NOT_ESTABLISHED', subject, nominalCIn: this.state.C, remainingLengthIn: remaining });
  }
  index(target, subject, remaining) {
    this.move('C', target, subject);
    this.delay('VERIFY_POSITION_ALLOWANCE', this.model.dimensional.allowances.positionVerifySec, subject, 'INDEX');
    this.contact(subject, remaining);
  }
}

function sawEvent(ledger, width, angle, subject, category) {
  const d = ledger.model.dimensional, s = d.saw, a = d.allowances;
  const feed = s.rpm * s.teeth * s.chipLoadIn * s.finishFactor / 60;
  ledger.event('SAW_ON', 0, subject, {}, category);
  ledger.move('S', s.approachIn, subject, category);
  ledger.move('S', s.approachIn + width / Math.cos(angle * Math.PI / 180), subject, category, feed);
  ledger.move('S', 0, subject, category);
  ledger.delay('SAW_OFF_ALLOWANCE', a.sawOffSec, subject, category);
  ledger.event('SAW_OFF', 0, subject, {}, category);
}
function captureC(ledger, subject) {
  ledger.event('NOMINAL_DATUM_CAPTURE', ledger.model.dimensional.allowances.referenceCaptureSec, subject,
    { oldCIn: ledger.state.C, targetCIn: 0, convention: ledger.model.dimensional.faceConvention }, 'REFERENCE');
  ledger.state.C = 0;
}
function spotY(feature, width, model) {
  const s = model.dimensional.spot;
  if (feature.kind !== undefined) need(feature.kind === 'SPOT_ON_LOCATION', 'SPOT_KIND_NOT_DECLARED', feature.featureId);
  if (feature.locationRule !== undefined) need(feature.locationRule === 'CENTERED_ON_PART', 'SPOT_LOCATION_RULE_NOT_DECLARED', feature.featureId);
  if (feature.toolDiameterIn !== undefined) need(feature.toolDiameterIn === s.diameterIn, 'SPOT_DIAMETER_NOT_DECLARED', feature.featureId);
  if (feature.fullDiameterDepthIn !== undefined) need(feature.fullDiameterDepthIn === s.fullDiameterDepthIn, 'SPOT_DEPTH_NOT_DECLARED', feature.featureId);
  let y;
  if (feature.acrossWidthRule === 'CENTERED_ON_WIDE_FACE') { need(feature.insetFromEdgeIn === undefined, 'CENTERED_SPOT_HAS_INSET', feature.featureId); y = width / 2; }
  else { need(feature.acrossWidthRule === 'INSET_FROM_EDGE' && s.insetsIn.includes(feature.insetFromEdgeIn), 'SPOT_INSET_NOT_DECLARED', feature.featureId); y = feature.insetFromEdgeIn; }
  need(y >= s.diameterIn / 2 && y + s.diameterIn / 2 <= width + EPS, 'SPOT_TOOL_LEAVES_FACE', feature.featureId);
  return y;
}
function routerPasses(ledger, path, y, depth, startC, subject, remaining) {
  const d = ledger.model.dimensional, r = d.router;
  need(positive(path) && positive(depth) && depth <= ledger.stock.actualT + EPS, 'ROUTER_GEOMETRY_INVALID', subject);
  need(Math.abs(y) <= r.maxTravelYIn + EPS, 'ROUTER_Y_TRAVEL_EXCEEDED', subject);
  const count = Math.ceil(depth / r.axialPassDepthIn - EPS);
  ledger.move('Y', y, subject, 'MILL');
  ledger.delay('ROUTER_READY_ALLOWANCE', r.startupSec, subject, 'MILL');
  for (let pass = 1; pass <= count; pass++) {
    ledger.move('C', startC, subject, 'MILL'); ledger.contact(subject, remaining);
    ledger.move('RZ', ledger.stock.actualT, subject, 'MILL');
    ledger.move('RZ', ledger.stock.actualT - Math.min(depth, pass * r.axialPassDepthIn), subject, 'MILL', r.plungeFeedInPerMin / 60);
    // Cutting X may move with the router engaged. Rapid indexing may not.
    const target = startC - path, from = ledger.state.C;
    ledger.event('ROUTER_CUT', moveSeconds(path, r.longitudinalFeedInPerMin / 60, d.motion.X.acceleration), subject,
      { axis: 'C', from, target, pathLengthIn: path, pass, passes: count,
        axialDepthIn: Math.min(depth, pass * r.axialPassDepthIn), cuttingFeedInPerMin: r.longitudinalFeedInPerMin }, 'MILL');
    ledger.state.C = target; ledger.contact(subject, remaining);
    ledger.move('RZ', ledger.stock.actualT + r.clearanceIn, subject, 'MILL');
  }
  ledger.move('C', 0, subject, 'MILL');
}

function boardCycle(model, stock, group, parts, previous) {
  const d = model.dimensional, l = new Ledger(model, previous), angle = group.endCut.angleDeg;
  l.stock = stock; l.parentId = stock.storeSku + ':' + parts.map(p => p.partId).join('+');
  for (const [axis, clearance] of [['Z', d.spot.clearanceIn], ['RZ', d.router.clearanceIn]]) {
    if (l.state[axis] === null) l.state[axis] = stock.actualT + clearance;
    else l.move(axis, Math.max(l.state[axis], stock.actualT + clearance), 'NEXT_STOCK_CLEARANCE', 'INDEX');
  }
  l.delay('LOAD_AND_SEAT', d.handling.loadSeatSec, l.parentId, 'LOAD');
  l.state.C = 0; // Nominal newly seated parent, not a servo encoder reset.
  if (l.state.A !== angle) { l.move('A', angle, 'PARENT_END_ANGLE'); l.delay('ANGLE_SETTLE', d.allowances.angleSettleSec, l.parentId, 'INDEX'); }
  l.delay('CLAMP_ALLOWANCE', d.allowances.clampSec, l.parentId, 'INDEX');
  sawEvent(l, stock.actualW, angle, 'REFERENCE_CUT', 'REFERENCE'); captureC(l, 'REFERENCE_CUT');
  let remaining = stock.stockL_in - d.saw.kerfIn;
  const width = group.finishedWidthIn ?? stock.actualW;
  const far = group.edgePreparation?.farEdgeRemovalIn ?? stock.actualW - width, fence = group.edgePreparation?.fenceEdgeRemovalIn ?? 0;
  need(width >= d.stock.minWidthIn - EPS && width <= stock.actualW + EPS, 'PREPARED_WIDTH_OUTSIDE_CONTROL_ENVELOPE', group.packageId);
  need(Math.abs(stock.actualW - far - fence - width) < 1e-6, 'EDGE_REMOVALS_DO_NOT_RECONCILE', group.packageId);
  need(far >= -EPS && fence >= -EPS, 'EDGE_REMOVAL_NEGATIVE', group.packageId);
  if (group.edgePreparation) for (const removal of [far, fence]) need(removal <= Math.min(rimDiameter(model), d.router.maxRadialRemovalPerSideIn) + EPS,
    'RADIAL_REMOVAL_EXCEEDS_DECLARED_TOOL_OR_LIMIT', group.packageId);
  if (!group.edgePreparation && far > rimDiameter(model) + EPS) {
    l.event('RIP_PROCESS_DECLARED', 0, group.packageId, { toolDiameterIn: rimDiameter(model),
      resultingOffcutWidthIn: far - rimDiameter(model), treatment: 'OFFCUT_SEPARATED_NO_MATERIAL_CREDIT' }, 'MILL');
    l.physicalGaps.push({ code: 'LONGITUDINAL_OFFCUT_CONTROL_NOT_ESTABLISHED', subject: group.packageId });
  }
  if (far > EPS) routerPasses(l, remaining, fence + width + d.router.diameterIn / 2, stock.actualT, d.stations.toolXIn, 'FAR_EDGE', remaining);
  if (fence > EPS) {
    l.physicalGaps.push({ code: 'FENCE_EDGE_TOOL_AND_DATUM_CLEARANCE_NOT_ESTABLISHED', subject: group.packageId });
    routerPasses(l, remaining, fence - d.router.diameterIn / 2, stock.actualT, d.stations.toolXIn, 'FENCE_EDGE', remaining);
  }
  let start = 0;
  const spots = [];
  for (const p of parts) {
    for (const f of p.edgeProfiles ?? []) {
      need(f.kind === 'MILL_LONGITUDINAL_PROFILE' && positive(f.pathLengthIn) && positive(f.totalDepthIn) && number(f.yIn), 'PROFILE_GEOMETRY_REQUIRED', f.featureId);
      need(f.pathLengthIn <= p.lengthIn + EPS && f.totalDepthIn <= stock.actualT + EPS, 'PROFILE_EXCEEDS_PART', f.featureId);
      if (far > EPS || fence > EPS) {
        need(Math.abs(f.pathLengthIn - p.lengthIn) < EPS && Math.abs(f.yIn - width) < EPS && Math.abs(f.totalDepthIn - stock.actualT) < EPS,
          'PROFILE_DOES_NOT_MATCH_EDGE_PREPARATION', f.featureId);
        l.event('FEATURE_COVERED_BY_PARENT_EDGE_PREPARATION', 0, f.featureId, { partId: p.partId, featureId: f.featureId, coverage: true }, 'MILL');
      } else {
        need(f.pathLengthIn <= d.router.maxProfileLengthIn, 'STATION_PROFILE_LENGTH_EXCEEDED', f.featureId);
        routerPasses(l, f.pathLengthIn, f.yIn, f.totalDepthIn, d.stations.toolXIn - start, f.featureId, remaining);
        l.event('FEATURE_ANSWERED', 0, f.featureId, { partId: p.partId, featureId: f.featureId, coverage: true }, 'MILL');
      }
    }
    for (const f of p.spots ?? []) {
      need(number(f.xIn) && f.xIn >= d.spot.diameterIn / 2 && f.xIn <= p.lengthIn - d.spot.diameterIn / 2,
        'SPOT_TOOL_LEAVES_PART_END', f.featureId);
      if (f.locationRule === 'CENTERED_ON_PART') need(Math.abs(f.xIn - p.lengthIn / 2) < EPS, 'CENTERED_SPOT_LOCATION_MISMATCH', f.featureId);
      spots.push({ ...f, partId: p.partId, globalXIn: start + f.xIn, yIn: spotY(f, width, model) + fence });
    }
    start += p.lengthIn + d.saw.kerfIn;
  }
  spots.sort((a, b) => a.globalXIn - b.globalXIn || a.featureId.localeCompare(b.featureId));
  let spindleOn = false;
  for (const f of spots) {
    l.index(d.stations.toolXIn - f.globalXIn, f.featureId, remaining);
    l.move('Y', f.yIn, f.featureId, 'SPOT');
    if (!spindleOn) { l.event('SPOT_SPINDLE_ON', 0, f.featureId, {}, 'SPOT'); l.delay('SPOT_READY_ALLOWANCE', d.allowances.spindleReadySec, f.featureId, 'SPOT'); spindleOn = true; }
    const point = (d.spot.diameterIn / 2) / Math.tan(d.spot.pointAngleDeg * Math.PI / 360), plunge = point + d.spot.fullDiameterDepthIn;
    need(plunge <= stock.actualT + EPS, 'SPOT_PENETRATION_EXCEEDS_STOCK', f.featureId);
    l.move('Z', stock.actualT, f.featureId, 'SPOT');
    l.move('Z', stock.actualT - plunge, f.featureId, 'SPOT', d.spot.rpm * d.spot.feedPerRevIn / 60);
    l.move('Z', stock.actualT + d.spot.clearanceIn, f.featureId, 'SPOT');
    l.event('FEATURE_ANSWERED', 0, f.featureId, { partId: f.partId, featureId: f.featureId, coverage: true }, 'SPOT');
  }
  for (const p of parts) {
    l.index(-p.lengthIn, p.partId, remaining);
    sawEvent(l, width, angle, p.partId, 'SAW');
    remaining -= p.lengthIn + d.saw.kerfIn; captureC(l, p.partId);
    need(remaining >= d.stock.minRetainedLengthIn - EPS, 'RETAINED_CONTROL_LENGTH_TOO_SHORT', p.partId);
  }
  if (spindleOn) l.event('SPOT_SPINDLE_OFF', 0, 'PARENT_COMPLETE', {}, 'SPOT');
  l.delay('RELEASE_AND_LABEL', d.handling.releaseLabelSec, l.parentId, 'RELEASE');
  l.physicalGaps.push({ code: 'RETAINED_FACE_AND_KERF_TRANSFORM_NOT_REGISTERED', subject: l.parentId },
    { code: 'SAW_STROKE_IS_VIRTUAL_BENCHMARK', subject: l.parentId });
  return { events: l.events, state: l.state, physicalGaps: l.physicalGaps, remainingLengthIn: remaining,
    parentId: l.parentId, storeSku: stock.storeSku, partIds: parts.map(p => p.partId), preparedWidthIn: width,
    components: parts.map(p => ({ partId: p.partId, nominalFinishedLengthIn: p.lengthIn, nominalFinishedWidthIn: width,
      thicknessIn: stock.actualT, endCut: clone(group.endCut), features: clone([...p.spots, ...p.edgeProfiles]),
      resultClass: 'MODELED_COMPONENT_NOT_INSPECTED' })) };
}
const rimDiameter = m => m.dimensional.router.diameterIn;

function boardOps(b, stock) {
  const ops = [b.endCut.angleDeg === 0 ? 'CROSSCUT' : 'MITER_LIMITED'];
  if (b.parts.some(p => p.spots?.length)) ops.push('SPOT_ON_LOCATION');
  if ((b.finishedWidthIn !== undefined && b.finishedWidthIn < stock.actualW - EPS) || b.parts.some(p => p.edgeProfiles?.length)) ops.push('MILL_LONGITUDINAL_PROFILE');
  for (const op of b.requiredOps ?? []) need(ops.includes(op), 'REQUIRED_OPERATION_NOT_REPRESENTED:' + op, b.packageId);
  return unique(ops);
}
function usableRows(catalog, matches, ops, family, subject) {
  need(matches.length, 'NO_MATCHING_OFFERING', subject);
  const offered = matches.filter(o => o.offered === true); need(offered.length, 'NOT_OFFERED', subject);
  const capable = offered.filter(o => (o.cellFamily ?? []).includes(family) && ops.every(op => (o.supportedOps ?? []).includes(op)));
  need(capable.length, 'OPERATIONS_NOT_ON_OFFERING:' + ops.join(','), subject);
  const priced = capable.filter(o => number(o.sellingPrice) && o.sellingPrice >= 0); need(priced.length, 'MISSING_PRICE', subject, 'UNRESOLVED');
  return priced.sort((a, b) => a.storeSku.localeCompare(b.storeSku));
}
function boardCandidates(catalog, b, model) {
  const m = b.material, st = model.dimensional.stock;
  let rows = catalog.offerings.filter(o => o.form === 'board' && o.species === m.species && o.nominalT === m.nominalT && o.nominalW === m.nominalW);
  const grades = unique(rows.filter(o => o.offered).map(o => o.grade));
  if(m.grade===undefined&&grades.length>1)throw new Problem('GRADE_CHOICE_REQUIRED',b.packageId,'UNRESOLVED',{offeredGrades:grades.sort()});
  if (m.grade !== undefined) rows = rows.filter(o => o.grade === m.grade);
  const accepted = [], problems = [];
  for (const row of rows) try {
    const ops = boardOps(b, row);
    usableRows(catalog, [row], ops, 'D-001', b.packageId);
    need(row.actualW >= st.minWidthIn && row.actualW <= st.maxWidthIn && row.actualT >= st.minThicknessIn
      && row.actualT <= (ops.includes('MILL_LONGITUDINAL_PROFILE') ? st.maxRouterThicknessIn : st.maxSawThicknessIn), 'STOCK_OUTSIDE_CONTROL_ENVELOPE', b.packageId);
    if (b.minimumParentLengthIn) need(row.stockL_in >= b.minimumParentLengthIn, 'PARENT_BELOW_DEFINED_WORKPIECE_LENGTH', b.packageId);
    // Validate every part's feature/tool/prepared-width compatibility before search.
    for (const part of b.parts) boardCycle(model, row, b, [part]);
    accepted.push(row);
  } catch (p) { if (!(p instanceof Problem)) throw p; problems.push(p); }
  if (!accepted.length) throw problems.find(p => p.code.startsWith('OPERATIONS_NOT')) ?? problems[0] ?? new Problem('NO_MATCHING_BOARD_OFFERING', b.packageId);
  return accepted.sort((a, b) => a.sellingPrice - b.sellingPrice || a.stockL_in - b.stockL_in || a.storeSku.localeCompare(b.storeSku));
}

// Nominal arch geometry and exact inward-offset centerline for the declared profile.
function archGeometry(w, h, rise, cutterRadius) {
  need([w, h, rise].every(positive) && rise <= w / 2 + EPS, 'ARCH_GEOMETRY_INVALID', 'arch');
  const R = w * w / (8 * rise) + rise / 2, theta = 2 * Math.asin(w / (2 * R));
  const nominalPerimeter = w + 2 * h + R * theta;
  const r = cutterRadius, innerR = R - r, innerHalf = w / 2 - r;
  need(innerR > 0 && innerHalf > 0 && innerHalf <= innerR + EPS, 'ROUTER_TOO_LARGE_FOR_ARCH', 'arch');
  const centerY = h + rise - R, innerTop = centerY + Math.sqrt(Math.max(0, innerR * innerR - innerHalf * innerHalf));
  need(innerTop > r, 'OFFSET_PROFILE_COLLAPSES', 'arch');
  const innerArc = innerR * 2 * Math.asin(innerHalf / innerR);
  return { w, h, rise, R, theta, nominalPerimeter, nominalArc: R * theta, centerY,
    centerlineLengthIn: w - 2 * r + 2 * (innerTop - r) + innerArc,
    nominalSegments: [w, h, R * theta, h], centerlineSegments: [w - 2 * r, innerTop - r, innerArc, innerTop - r],
    insideCornerRadiusIn: r };
}
function archPoint(g, s) {
  s = ((s % g.nominalPerimeter) + g.nominalPerimeter) % g.nominalPerimeter;
  if (s < g.w) return { x: -g.w / 2 + s, y: 0 };
  if (s < g.w + g.h) return { x: g.w / 2, y: s - g.w };
  if (s < g.w + g.h + g.nominalArc) {
    const initial = Math.atan2(g.R - g.rise, g.w / 2), a = initial + (s - g.w - g.h) / g.R;
    return { x: g.R * Math.cos(a), y: g.centerY + g.R * Math.sin(a) };
  }
  return { x: -g.w / 2, y: g.h - (s - g.w - g.h - g.nominalArc) };
}
function arclengthPhase(g, count) {
  const spacing = g.nominalPerimeter / count, residues = unique([0, g.w, g.w + g.h, g.w + g.h + g.nominalArc].map(v => v % spacing)).sort((a, b) => a - b);
  let best = { gap: -1, phase: 0 };
  for (let i = 0; i < residues.length; i++) { const next = residues[i + 1] ?? residues[0] + spacing, gap = next - residues[i];
    if (gap > best.gap) best = { gap, phase: (residues[i] + gap / 2) % spacing }; }
  return best.phase;
}
function validateTabs(g, positions, policy, split, subject) {
  const P = g.nominalPerimeter, bridge = policy.bridgeIn, transitions = [0, g.w, g.w + g.h, g.w + g.h + g.nominalArc];
  need(positions.every(v => number(v) && v >= 0 && v < P), 'TAB_OUTSIDE_CONTOUR', subject);
  const sorted = [...positions].sort((a, b) => a - b);
  const gaps = sorted.map((v, i) => (sorted[i + 1] ?? sorted[0] + P) - v);
  need(gaps.every(v => v >= bridge - EPS), 'TAB_BRIDGES_OVERLAP', subject);
  need(gaps.every(v => v - bridge <= policy.maxUncutSpanIn + EPS), 'TAB_UNCUT_SPAN_EXCEEDED', subject);
  need(sorted.length * bridge / P >= policy.retainedFraction - EPS, 'TAB_RETENTION_FRACTION_TOO_SMALL', subject);
  const cyclic = (a, b) => Math.min(Math.abs(a - b), P - Math.abs(a - b));
  need(sorted.every(s => transitions.every(t => cyclic(s, t) >= bridge / 2 - EPS)), 'TAB_AT_PROFILE_TRANSITION', subject);
  if (split) { const xs = sorted.map(s => archPoint(g, s).x);
    need(xs.filter(x => x < -bridge / 2).length >= policy.minPerSplitHalf && xs.filter(x => x > bridge / 2).length >= policy.minPerSplitHalf,
      'TAB_LOCATIONS_DO_NOT_RETAIN_BOTH_HALVES', subject); }
  return sorted;
}
function archTabs(feature, geometry, policy, split) {
  need(Number.isInteger(feature.requestedTabCount) && feature.requestedTabCount > 0, 'TAB_COUNT_REQUIRED', feature.featureId, 'UNRESOLVED');
  const mode = feature.tabMode ?? 'AUTO_PLAN'; need(['AUTO_PLAN', 'CUSTOM'].includes(mode), 'TAB_MODE_NOT_DECLARED', feature.featureId);
  if (mode === 'CUSTOM') {
    need(Array.isArray(feature.tabPositionsIn) && feature.tabPositionsIn.length, 'TAB_CUSTOM_POSITIONS_REQUIRED', feature.featureId, 'UNRESOLVED');
    need(feature.tabPositionsIn.length === feature.requestedTabCount, 'TAB_CUSTOM_COUNT_MISMATCH', feature.featureId);
    return validateTabs(geometry, feature.tabPositionsIn, policy, split, feature.featureId);
  }
  need(feature.tabPositionsIn === undefined, 'CUSTOM_TAB_POSITIONS_WITH_AUTO_MODE', feature.featureId);
  const P = geometry.nominalPerimeter;
  const minimum = Math.max(feature.requestedTabCount, policy.minimumCount, Math.ceil(P * policy.retainedFraction / policy.bridgeIn - EPS), Math.ceil(P / (policy.maxUncutSpanIn + policy.bridgeIn)));
  for (let n = minimum; n <= minimum + 64; n++) {
    const phase = arclengthPhase(geometry, n), positions = Array.from({ length: n }, (_, i) => (phase + i * P / n) % P);
    try { return validateTabs(geometry, positions, policy, split, feature.featureId); } catch (p) { if (!(p instanceof Problem)) throw p; }
  }
  throw new Problem('AUTO_TAB_PLAN_NOT_FOUND', feature.featureId, 'UNRESOLVED');
}
function sheetGeometry(pkg, model) {
  const e = model.sheet, parent = pkg.sheet, features = pkg.features;
  need(parent.lengthIn === e.stock.lengthIn && parent.widthIn === e.stock.widthIn && parent.thicknessIn >= e.stock.minThicknessIn
    && parent.thicknessIn <= e.stock.maxThicknessIn, 'SHEET_OUTSIDE_ENVELOPE', pkg.packageId);
  const kinds = ['ARCHED_APERTURE', 'STRAIGHT_SPLIT', 'CROSSCUT', 'RIP', 'PATTERN'];
  const fieldsByKind = {
    ARCHED_APERTURE: ['featureId', 'kind', 'placement', 'widthIn', 'straightHeightIn', 'riseIn', 'retain', 'requestedTabCount', 'tabMode', 'tabPositionsIn'],
    STRAIGHT_SPLIT: ['featureId', 'kind', 'within', 'line', 'splitTabMode', 'splitTabPositionsIn'],
    CROSSCUT: ['featureId', 'kind', 'fromEnd', 'distanceIn'], RIP: ['featureId', 'kind', 'fromEdge', 'distanceIn'],
    PATTERN: ['featureId', 'kind', 'within', 'offsetXIn', 'offsetYIn']
  };
  features.forEach(f => { need(kinds.includes(f.kind), 'SHEET_FEATURE_KIND_NOT_HANDLED', f.featureId); keys(f, fieldsByKind[f.kind], f.featureId); });
  const modifiers = new Map(), splits = new Map();
  for (const f of features.filter(f => f.kind === 'PATTERN')) {
    need(features.some(a => a.kind === 'ARCHED_APERTURE' && a.featureId === f.within), 'PATTERN_HOST_REQUIRED', f.featureId);
    need(!modifiers.has(f.within) && number(f.offsetXIn) && number(f.offsetYIn), 'PATTERN_DEFINITION_INVALID', f.featureId);
    modifiers.set(f.within, f);
  }
  for (const f of features.filter(f => f.kind === 'STRAIGHT_SPLIT')) {
    need(features.some(a => a.kind === 'ARCHED_APERTURE' && a.featureId === f.within), 'SPLIT_HOST_REQUIRED', f.featureId);
    need(!splits.has(f.within) && f.line === 'VERTICAL_CENTERLINE', 'SPLIT_DEFINITION_INVALID', f.featureId); splits.set(f.within, f);
  }
  const field = { x0: (parent.lengthIn - e.field.lengthIn) / 2, x1: (parent.lengthIn + e.field.lengthIn) / 2,
    y0: (parent.widthIn - e.field.widthIn) / 2, y1: (parent.widthIn + e.field.widthIn) / 2 };
  const apertures = [], routes = [];
  for (const f of features.filter(f => f.kind === 'ARCHED_APERTURE')) {
    need(f.placement === 'CENTERED' && f.retain === 'TABS', 'APERTURE_PLACEMENT_OR_RETENTION_NOT_DECLARED', f.featureId);
    need(f.widthIn >= e.router.minFeatureIn && f.straightHeightIn >= e.router.minFeatureIn, 'APERTURE_TOO_SMALL', f.featureId);
    const g = archGeometry(f.widthIn, f.straightHeightIn, f.riseIn, e.router.diameterIn / 2), mod = modifiers.get(f.featureId);
    const x0 = (parent.lengthIn - f.widthIn) / 2 + (mod?.offsetXIn ?? 0), y0 = (parent.widthIn - f.straightHeightIn - f.riseIn) / 2 + (mod?.offsetYIn ?? 0);
    const box = { x0, x1: x0 + f.widthIn, y0, y1: y0 + f.straightHeightIn + f.riseIn };
    need(box.x0 >= field.x0 - EPS && box.x1 <= field.x1 + EPS && box.y0 >= field.y0 - EPS && box.y1 <= field.y1 + EPS, 'ROUTED_PROFILE_OUTSIDE_WORK_FIELD', f.featureId);
    const tabPositions = archTabs(f, g, e.tabs, splits.has(f.featureId));
    const a = { featureId: f.featureId, box, geometry: g, tabPositionsIn: tabPositions,
      nominalBridgeWidthIn: e.tabs.bridgeIn, tabRetentionBasis: 'GEOMETRIC_FULL_THICKNESS_BRIDGES_NOT_MEASURED' };
    apertures.push(a); routes.push({ featureId: f.featureId, pathLengthIn: g.centerlineLengthIn, tabs: tabPositions.length, aperture: a });
  }
  for (const f of splits.values()) {
    const host = apertures.find(a => a.featureId === f.within), length = host.box.y1 - host.box.y0;
    need((host.geometry.w - e.router.diameterIn) / 2 >= e.router.minSplitWidthIn - EPS, 'SPLIT_HALF_TOO_NARROW', f.featureId);
    const mode = f.splitTabMode ?? 'AUTO_PLAN'; need(['AUTO_PLAN', 'CUSTOM'].includes(mode), 'SPLIT_TAB_MODE_NOT_DECLARED', f.featureId);
    let positions;
    if (mode === 'CUSTOM') { need(Array.isArray(f.splitTabPositionsIn) && f.splitTabPositionsIn.length, 'SPLIT_TAB_POSITIONS_REQUIRED', f.featureId, 'UNRESOLVED'); positions = [...f.splitTabPositionsIn]; }
    else { need(f.splitTabPositionsIn === undefined, 'SPLIT_POSITIONS_WITH_AUTO_MODE', f.featureId);
      const count = Math.max(2, Math.ceil(length * e.tabs.retainedFraction / e.tabs.bridgeIn - EPS), Math.ceil(length / (e.tabs.maxUncutSpanIn + e.tabs.bridgeIn)));
      positions = Array.from({ length: count }, (_, i) => length * (i + 1) / (count + 1)); }
    positions.sort((a, b) => a - b);
    need(positions.every(v => number(v) && v >= e.tabs.bridgeIn / 2 && v <= length - e.tabs.bridgeIn / 2), 'SPLIT_TAB_OUTSIDE_PATH', f.featureId);
    const gaps = [positions[0], ...positions.slice(1).map((v, i) => v - positions[i]), length - positions.at(-1)];
    need(gaps.every(v => v >= e.tabs.bridgeIn - EPS && v - e.tabs.bridgeIn <= e.tabs.maxUncutSpanIn + EPS), 'SPLIT_TAB_SPACING_INVALID', f.featureId);
    need(positions.length * e.tabs.bridgeIn / length >= e.tabs.retainedFraction - EPS, 'SPLIT_RETENTION_TOO_SMALL', f.featureId);
    routes.push({ featureId: f.featureId, pathLengthIn: length, tabs: positions.length, splitTabPositionsIn: positions, within: f.within });
  }
  // Every saw line remains a full-parent, parallel line. Orthogonal staging is not invented.
  const cuts = features.filter(f => f.kind === 'CROSSCUT' || f.kind === 'RIP').map(f => {
    const vertical = f.kind === 'CROSSCUT', limit = vertical ? parent.lengthIn : parent.widthIn;
    need(number(f.distanceIn) && (vertical ? ['LEFT', 'RIGHT'].includes(f.fromEnd) : ['BOTTOM', 'TOP'].includes(f.fromEdge)), 'PANEL_CUT_DATUM_REQUIRED', f.featureId);
    const reverse = vertical ? f.fromEnd === 'RIGHT' : f.fromEdge === 'TOP', at = reverse ? limit - f.distanceIn : f.distanceIn;
    need(at > 0 && at < limit, 'PANEL_CUT_OUTSIDE_SHEET', f.featureId);
    const clear = e.panelSaw.clearanceIn + e.panelSaw.positionToleranceIn + e.panelSaw.kerfIn / 2;
    need(apertures.every(a => vertical ? at < a.box.x0 - clear - EPS || at > a.box.x1 + clear + EPS : at < a.box.y0 - clear - EPS || at > a.box.y1 + clear + EPS), 'PANEL_CUT_INTERSECTS_ROUTED_FEATURE', f.featureId);
    return { featureId: f.featureId, kind: f.kind, at, lengthIn: vertical ? parent.widthIn : parent.lengthIn };
  });
  need(!cuts.some(c => c.kind === 'CROSSCUT') || !cuts.some(c => c.kind === 'RIP'), 'ORTHOGONAL_PANEL_STAGING_NOT_DEFINED', pkg.packageId);
  const boundaries = [0, ...cuts.map(c => c.at).sort((a, b) => a - b), cuts[0]?.kind === 'RIP' ? parent.widthIn : parent.lengthIn];
  for (let i = 1; i < boundaries.length; i++) {
    const allowances = (i > 1 ? e.panelSaw.positionToleranceIn + e.panelSaw.kerfIn / 2 : 0)
      + (i < boundaries.length - 1 ? e.panelSaw.positionToleranceIn + e.panelSaw.kerfIn / 2 : 0);
    need(boundaries[i] - boundaries[i - 1] - allowances >= e.panelSaw.minPieceIn - EPS, 'PANEL_PIECE_BELOW_MINIMUM', pkg.packageId);
  }
  for (let i = 0; i < apertures.length; i++) for (let j = i + 1; j < apertures.length; j++) {
    const a = apertures[i].box, b = apertures[j].box;
    need(a.x1 < b.x0 - EPS || b.x1 < a.x0 - EPS || a.y1 < b.y0 - EPS || b.y1 < a.y0 - EPS, 'APERTURES_OVERLAP', pkg.packageId);
  }
  const pieces = [];
  for (let i = 1; i < boundaries.length; i++) {
    const from = boundaries[i - 1] + (i > 1 ? e.panelSaw.kerfIn / 2 : 0), to = boundaries[i] - (i < boundaries.length - 1 ? e.panelSaw.kerfIn / 2 : 0);
    const horizontal = cuts[0]?.kind === 'RIP';
    const box = horizontal ? { x0: 0, x1: parent.lengthIn, y0: from, y1: to } : { x0: from, x1: to, y0: 0, y1: parent.widthIn };
    const carries = apertures.filter(a => a.box.x0 >= box.x0 - EPS && a.box.x1 <= box.x1 + EPS && a.box.y0 >= box.y0 - EPS && a.box.y1 <= box.y1 + EPS).map(a => a.featureId);
    pieces.push({ pieceId: pkg.packageId + ':PANEL-' + i, kind: carries.length ? 'FRAME' : 'PANEL',
      nominalLengthIn: box.x1 - box.x0, nominalWidthIn: box.y1 - box.y0, box, carries,
      positionToleranceIn: e.panelSaw.positionToleranceIn, disposition: 'RETURN_ALL_PIECES', resultClass: 'MODELED_NOT_INSPECTED' });
  }
  for (const a of apertures) {
    const split = splits.get(a.featureId), frame = pieces.find(p => p.carries.includes(a.featureId));
    for (const side of split ? ['LEFT', 'RIGHT'] : ['CENTER']) pieces.push({ pieceId: pkg.packageId + ':' + a.featureId + ':' + side,
      kind: 'RETAINED_ROUTED_PIECE', nominalBoundingWidthIn: split ? (a.geometry.w - e.router.diameterIn) / 2 : a.geometry.w - e.router.diameterIn,
      nominalBoundingHeightIn: a.geometry.h + a.geometry.rise - e.router.diameterIn,
      retainedBy: 'FULL_THICKNESS_TAB_BRIDGES', inFrame: frame.pieceId, disposition: 'RETURN_ALL_PIECES', resultClass: 'MODELED_NOT_INSPECTED' });
  }
  return { field, apertures, routes, cuts, pieces, pieceCount: pieces.length,
    operations: unique(features.map(f => f.kind === 'CROSSCUT' || f.kind === 'RIP' ? f.kind : 'ROUTE_PROFILE')) };
}
function sheetCycle(model, row, pkg, geometry) {
  const l = new Ledger(model), e = model.sheet; l.cell = 'S-001'; l.parentId = pkg.packageId + ':' + row.storeSku;
  const passes = Math.ceil(row.actualT / e.router.axialPassDepthIn - EPS);
  if (geometry.routes.length) l.delay('SHEET_LOAD_AND_REFERENCE', e.router.loadReferenceSec, pkg.packageId, 'LOAD');
  for (const r of geometry.routes) for (let pass = 1; pass <= passes; pass++) {
    l.delay('SHEET_PLUNGE_RETRACT_ALLOWANCE', e.router.plungeRetractSec, r.featureId, 'ROUTE', { pass, passes });
    // Declared constant-path-feed S-001 allowance, not a servo command trace.
    // Full path time is conservative: nominal bridges are traversed clear, while
    // explicit tab transitions are charged as well; no bridge time is subtracted.
    l.delay('SHEET_PROFILE_PATH', r.pathLengthIn / e.router.feedInPerMin * 60, r.featureId, 'ROUTE',
      { pathLengthIn: r.pathLengthIn, feedInPerMin: e.router.feedInPerMin, pass, passes, toolDiameterIn: e.router.diameterIn });
    l.delay('SHEET_TAB_TRANSITIONS', r.tabs * e.router.tabTransitionSec, r.featureId, 'ROUTE', { tabs: r.tabs, bridgeWidthIn: e.tabs.bridgeIn, pass });
  }
  if (geometry.routes.length) l.delay('SHEET_RELEASE', e.router.releaseSec, pkg.packageId, 'RELEASE');
  for (const c of geometry.cuts) l.event('PANEL_SAW_CUT', e.panelSaw.alignSec + c.lengthIn / e.panelSaw.feedInPerMin * 60,
    c.featureId, { cutKind: c.kind, positionIn: c.at, pathLengthIn: c.lengthIn, fixedPrice: e.panelSaw.pricePerCut }, 'PANEL_SAW', 'PER_CUT');
  l.delay('LABEL_RETURNED_PIECES', geometry.pieceCount * e.labelSecPerPiece, pkg.packageId, 'LABEL', { pieceCount: geometry.pieceCount });
  for (const f of pkg.features) l.event('FEATURE_ANSWERED', 0, f.featureId, { featureId: f.featureId, coverage: true, kindEvaluated: f.kind }, 'ROUTE');
  return { parentId: l.parentId, storeSku: row.storeSku, packageId: pkg.packageId, events: l.events,
    geometry, physicalGaps: [{ code: 'SHEET_CONTROL_TAB_STRENGTH_AND_ROUTING_TRANSITIONS_NOT_COMMISSIONED', subject: pkg.packageId }] };
}

function hardwareRows(catalog, line) {
  let rows;
  if (line.storeSku) rows = catalog.offerings.filter(o => o.form === 'hardware' && o.storeSku === line.storeSku);
  else if (line.requirementId) rows = catalog.offerings.filter(o => o.form === 'hardware' && o.satisfiesRequirementIds?.includes(line.requirementId));
  else {
    const r = line.requirement;
    need(text(r.kind) && text(r.finish) && positive(r.lengthIn) && ((r.gauge !== undefined) !== (r.diameterIn !== undefined))
      && (r.unit === undefined || r.unit === 'piece'), 'HARDWARE_REQUIREMENT_INCOMPLETE', line.lineId, 'UNRESOLVED');
    if (r.diameterIn !== undefined) need(positive(r.diameterIn), 'HARDWARE_DIAMETER_INVALID', line.lineId);
    if (r.gauge !== undefined) identity(r.gauge, line.lineId + '.gauge');
    const kinds = { WOOD_SCREW_8: ['wood-screw', '#8'], WOOD_SCREW_10: ['wood-screw', '#10'], CARRIAGE_BOLT_3_8_NUT_WASHER: ['carriage-bolt', 0.375] };
    const finishes = { COATED: 'coated', HOT_DIP_GALVANIZED: 'hot-dip-galvanized', STAINLESS: 'stainless', SILICON_BRONZE: 'silicon-bronze', ZINC_INTERIOR: 'zinc-interior' };
    rows = catalog.offerings.filter(o => { const f = o.fastener, k = kinds[f?.kind];
      return o.form === 'hardware' && k && k[0] === r.kind && k[1] === (r.gauge ?? r.diameterIn) && f.lengthIn === r.lengthIn && finishes[f.tier] === r.finish; });
  }
  need(rows.length, 'NO_MATCHING_HARDWARE_OFFERING', line.lineId);
  const offered = rows.filter(o => o.offered); need(offered.length, 'HARDWARE_NOT_OFFERED', line.lineId);
  const priced = offered.filter(o => number(o.sellingPrice) && o.sellingPrice >= 0); need(priced.length, 'HARDWARE_PRICE_MISSING', line.lineId, 'UNRESOLVED');
  return priced.map(row => ({ row, qty: line.requirement ? Math.ceil(line.qty / row.fastener.piecesPerPackage) : line.qty }))
    .sort((a, b) => a.qty * a.row.sellingPrice - b.qty * b.row.sellingPrice || a.row.storeSku.localeCompare(b.row.storeSku));
}

function groupsFor(job, catalog, model) {
  const merged = new Map();
  for (const pkg of job.boards) {
    const b = { ...clone(pkg), minimumParentLengthIn: pkg.minimumParentLengthIn ?? 0,
      singleParent: pkg.singleParent ?? false, preserveOrder: pkg.preserveOrder ?? false };
    // Grouping ignores package IDs, so repartitioning identical requirements does
    // not hide an eligible stock plan. Single-workpiece requests remain atomic.
    const { packageId, parts, ...criteria } = b, key = canonical(criteria) + (b.singleParent ? ':' + packageId : '');
    if (!merged.has(key)) merged.set(key, { ...b, parts: [] });
    merged.get(key).parts.push(...parts.map(p => ({ ...p, spots: p.spots ?? [], edgeProfiles: p.edgeProfiles ?? [] })));
  }
  const boards = [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, group]) => {
    if (!group.preserveOrder) group.parts.sort((a, b) => b.lengthIn - a.lengthIn || a.partId.localeCompare(b.partId));
    const rows = boardCandidates(catalog, group, model);
    return { kind: 'board', group, rows, remaining: group.parts.map((_, i) => i) };
  });
  const sheets = job.sheets.map(pkg => {
    const geometry = sheetGeometry(pkg, model), sh = pkg.sheet;
    let rows = catalog.offerings.filter(o => o.form === 'sheet' && o.actualT === sh.thicknessIn && o.sheetL_in === sh.lengthIn && o.sheetW_in === sh.widthIn
      && (sh.species === undefined || o.species === sh.species) && (sh.grade === undefined || o.grade === sh.grade));
    need(unique(rows.filter(o => o.offered).map(o => o.species + '/' + o.grade)).length <= 1, 'SHEET_MATERIAL_CHOICE_REQUIRED', pkg.packageId, 'UNRESOLVED');
    rows = usableRows(catalog, rows, geometry.operations, 'S-001', pkg.packageId);
    if (pkg.exteriorRatingRequested) { rows = rows.filter(o => /exterior/i.test(o.grade)); need(rows.length, 'EXTERIOR_RATING_NOT_ESTABLISHED', pkg.packageId, 'UNRESOLVED'); }
    return { kind: 'sheet', pkg, geometry, rows };
  });
  const itemGroups = new Map();
  for (const line of job.items) {
    const selector = line.requirement ? { requirement: { unit: 'piece', ...line.requirement } }
      : line.storeSku ? { storeSku: line.storeSku } : { requirementId: line.requirementId };
    const key = canonical(selector);
    if (!itemGroups.has(key)) itemGroups.set(key, { line: { ...clone(line), qty: 0 }, lines: [] });
    itemGroups.get(key).line.qty += line.qty; itemGroups.get(key).lines.push(clone(line));
  }
  const items = [...itemGroups.values()].map(({ line, lines }) => ({ kind: 'item', line, lines, choices: hardwareRows(catalog, line) }));
  return [...boards, ...sheets, ...items];
}

function partSignature(p) {
  return canonical({ lengthIn: p.lengthIn, spots: p.spots.map(({ featureId, ...f }) => f), edgeProfiles: p.edgeProfiles.map(({ featureId, ...f }) => f) });
}
function* parentPatterns(task, remaining, row, model) {
  const d = model.dimensional, capacity = row.stockL_in - d.saw.kerfIn - d.stock.minRetainedLengthIn;
  const parts = task.group.parts, weight = i => parts[i].lengthIn + d.saw.kerfIn;
  if (task.group.singleParent) { if (remaining.reduce((s, i) => s + weight(i), 0) <= capacity + EPS) yield remaining; return; }
  const kinds = new Map();
  for (const i of remaining) { const key = partSignature(parts[i]); if (!kinds.has(key)) kinds.set(key, []); kinds.get(key).push(i); }
  need(kinds.size <= model.search.maxPartTypesPerGroup, 'SEARCH_PART_TYPE_LIMIT_EXCEEDED', task.group.packageId, 'UNRESOLVED');
  const types = [...kinds.values()];
  // First remaining part must be covered. Equal geometry/feature patterns have
  // equal costs; choose the first identified instances without losing coverage.
  function* counts(at, used, selected) {
    if (at === types.length) { if (selected.length) yield selected; return; }
    const members = types[at], minimum = members.includes(remaining[0]) ? 1 : 0;
    const max = Math.min(members.length, Math.floor((capacity - used + EPS) / weight(members[0])));
    for (let n = max; n >= minimum; n--) yield* counts(at + 1, used + n * weight(members[0]), [...selected, ...members.slice(0, n)]);
  }
  for (const indices of counts(0, 0, [])) yield indices.sort((a, b) => a - b);
}

function refusal(p, extra = {}) {
  return { status: p.status, complete: false, Q: null, totals: null, reasonCodes: [p.code],
    reasonRecords: [{ code: p.code, subject: p.subject, authority: 'STORE', status: p.status }],
    physicalRelease: false, physicalAdmission: 'BLOCKED', ...p.details,...extra };
}

export function evaluateManufacturingJob(catalog, job, model = createModel()) {
  try {
    validateJob(job); need(object(catalog) && Array.isArray(catalog.offerings), 'CATALOG_REQUIRED', 'catalog', 'UNRESOLVED');
    // Full production catalog validation stays in the existing single reader.
    // These invariants are also necessary for an injected standalone snapshot.
    const seen = new Set(), inventory = new Map();
    for (const o of catalog.offerings) {
      identity(o.storeSku, 'catalog.sku'); need(!seen.has(o.storeSku), 'CATALOG_SKU_DUPLICATED', o.storeSku); seen.add(o.storeSku);
      need(Number.isInteger(o.onHand) && Number.isInteger(o.allocated) && o.allocated >= 0 && o.onHand >= o.allocated, 'CATALOG_INVENTORY_INVALID', o.storeSku);
      inventory.set(o.storeSku, o.onHand - o.allocated);
    }
    const hourly = machineHourlyRate(model), tasks = groupsFor(job, catalog, model), nodes = { count: 0, limited: false };
    let best = null; const memo = new Map(); const planningProblems = [],consideredCandidates=[];
    function search(at, remaining, used, plans, state, rawCost) {
      if (++nodes.count > model.search.nodeLimit) { nodes.limited = true; return; }
      if (best && rawCost > best.rawCost + EPS) return;
      if (at === tasks.length) { if (!best || rawCost < best.rawCost - EPS) best = { rawCost, plans, used }; return; }
      const t = tasks[at];
      if (t.kind === 'board' && remaining === null) remaining = t.remaining;
      if (t.kind === 'board' && !remaining.length) { search(at + 1, null, used, plans, state, rawCost); return; }
      const memoKey = canonical([at, remaining, [...used.entries()].sort(), state]);
      if ((memo.get(memoKey) ?? Infinity) <= rawCost + EPS) return; memo.set(memoKey, rawCost);
      const tryChoice = (row, qty, cycle, nextRemaining, item) => {
        if ((used.get(row.storeSku) ?? 0) + qty > inventory.get(row.storeSku)) return;
        const nextUsed = new Map(used); nextUsed.set(row.storeSku, (used.get(row.storeSku) ?? 0) + qty);
        const seconds = cycle?.events.filter(e => e.billing === 'HOURLY').reduce((s, e) => s + e.seconds, 0) ?? 0;
        const fixed = cycle?.events.filter(e => e.billing === 'PER_CUT').reduce((s, e) => s + e.fixedPrice, 0) ?? 0;
        if(t.kind==='board'&&t.group.singleParent)consideredCandidates.push({storeSku:row.storeSku,stockLengthIn:row.stockL_in,candidateStatus:'SUPPORTABLE',reason:null});
        const plan = { packageId:t.group?.packageId??t.pkg?.packageId??null, kind: t.kind, storeSku: row.storeSku, qty, description:row.description, stockL_in:row.stockL_in??row.sheetL_in??null, actualW:row.actualW??row.sheetW_in??null, actualT:row.actualT??null, cellFamily:row.cellFamily, supportedOps:row.supportedOps, unitPrice: row.sellingPrice, materialExtension: row.sellingPrice * qty,
          status:'SUPPORTABLE',boards:t.kind==='board'?qty:null,stockLengthIn:row.stockL_in??null, Q:money(row.sellingPrice*qty+seconds*hourly/3600+fixed), time:{T_MACHINE_sec:cycle?.events.reduce((n,e)=>n+e.seconds,0)??0,T_MACHINE_min:(cycle?.events.reduce((n,e)=>n+e.seconds,0)??0)/60}, spotCount:cycle?.events.filter(e=>e.kind==='FEATURE_ANSWERED'&&e.category==='SPOT').length??0,
          priceBasis: row.assertions?.sellingPrice?.basis ?? row.priceBasis ?? 'STATED_CATALOG_PRICE',
          stockBasis: row.assertions?.onHand?.basis ?? 'STATED_CATALOG_INVENTORY', ...cycle, ...(item ? { item } : {}) };
        search(nextRemaining !== null ? at : at + 1, nextRemaining, nextUsed, [...plans, plan],
          cycle?.state ?? state, rawCost + plan.materialExtension + seconds * hourly / 3600 + fixed);
      };
      if (t.kind === 'board') {
        for (const row of t.rows) {
          if ((used.get(row.storeSku) ?? 0) >= inventory.get(row.storeSku)) continue;
          for (const subset of parentPatterns(t, remaining, row, model)) {
          if (nodes.limited) return;
          try {
            const cycle = boardCycle(model, row, t.group, subset.map(i => t.group.parts[i]), state);
            tryChoice(row, 1, cycle, remaining.filter(i => !subset.includes(i)), null);
          } catch (p) { if (!(p instanceof Problem)) throw p; planningProblems.push(p);if(t.group.singleParent)consideredCandidates.push({storeSku:row.storeSku,stockLengthIn:row.stockL_in,candidateStatus:p.status,reason:p.code}); }
          }
        }
      } else if (t.kind === 'sheet') for (const row of t.rows) { if (nodes.limited) return; tryChoice(row, 1, sheetCycle(model, row, t.pkg, t.geometry), null, null); }
      else for (const c of t.choices) { if (nodes.limited) return;
        tryChoice(c.row, c.qty, null, null, { ...t.line, assignments: t.lines,
          piecesPerPackage: t.line.requirement ? c.row.fastener.piecesPerPackage : null,
          piecesSupplied: t.line.requirement ? c.qty * c.row.fastener.piecesPerPackage : null }); }
    }
    search(0, null, new Map(), [], null, 0);
    if (!best) {
      const p = nodes.limited ? new Problem('SEARCH_LIMIT_WITHOUT_COMPLETE_PLAN', 'job', 'UNRESOLVED')
        : planningProblems[0] ?? new Problem('NO_COMPLETE_PLAN_WITH_AVAILABLE_INVENTORY', 'job', 'UNAVAILABLE');
      const reasons = nodes.limited ? [p] : planningProblems.length ? planningProblems : [p];
      const records = [...new Map(reasons.map(r => [r.code + ':' + r.subject, {code:r.code, subject:r.subject, authority:'STORE', status:r.status}])).values()];
      return refusal(p, {reasonCodes: unique(records.map(r => r.code)), reasonRecords:records,
        optimization:{nodes:nodes.count, searchComplete:!nodes.limited, planSpace:model.search.planSpace}});
    }
    const events = best.plans.flatMap(p => p.events ?? []).map((e, i) => ({ sequence: i + 1, ...e }));
    let elapsed = 0; events.forEach(e => { e.startSec = elapsed; elapsed += e.seconds; e.endSec = elapsed; });
    const seconds = events.filter(e => e.billing === 'HOURLY').reduce((s, e) => s + e.seconds, 0);
    const material = best.plans.filter(p => p.kind !== 'item').reduce((s, p) => s + p.materialExtension, 0);
    const hardware = best.plans.filter(p => p.kind === 'item').reduce((s, p) => s + p.materialExtension, 0);
    const fixed = events.filter(e => e.billing === 'PER_CUT').reduce((s, e) => s + e.fixedPrice, 0);
    const service = money(seconds * hourly / 3600);
    const totals = { material: money(material), hardware: money(hardware), machine_service: service, manual_cut_service: money(fixed),
      Q: money(material + hardware + service + fixed), sumOfSupportableLines:money(material+hardware+service+fixed),manualCutCount:events.filter(e=>e.billing==='PER_CUT').length, hourlyRate: hourly };
    const breakdown = {}; for (const e of events) breakdown[e.category] = (breakdown[e.category] ?? 0) + e.seconds;
    const time = { T_MACHINE_sec:elapsed,T_MACHINE_min:elapsed/60,T_MACHINE_hr:elapsed/3600, totalSeconds: elapsed, totalMinutes: elapsed / 60, hourlyBilledSeconds: seconds,
      fixedPriceOccupiedSeconds: elapsed - seconds, categories: breakdown, concurrency: 'SERIAL_OCCUPANCY' };
    const selectedStock = [...best.used].sort(([a], [b]) => a.localeCompare(b)).map(([storeSku, qty]) => ({ storeSku, qty,
      available: inventory.get(storeSku), remainingAvailable: inventory.get(storeSku) - qty, ...(() => {const row=catalog.offerings.find(o=>o.storeSku===storeSku);return {unitPrice:row.sellingPrice, stockL_in:row.stockL_in??row.sheetL_in??null, actualW:row.actualW??row.sheetW_in??null, actualT:row.actualT??null, description:row.description, cellFamily:row.cellFamily, supportedOps:row.supportedOps};})() }));
    const result = { status: 'SUPPORTABLE', complete: true, configurationId:job.jobId,configurationVersion:job.revision, jobId: job.jobId, revision: job.revision, Q: totals.Q, totals, time,
      selectedStock, parents: best.plans, operations: events, reasonCodes: [], reasonRecords: [],
      optimization: { status: nodes.limited ? 'BOUNDED_FEASIBLE_PLAN' : 'MINIMUM_WITHIN_DECLARED_PLAN_SPACE', searchComplete: !nodes.limited,
        nodes: nodes.count, planSpace: model.search.planSpace, globalManufacturingOptimalityClaimed: false },
      model: { id: model.id, hash: calculationHash(model), basis: model.basis, measured: false },
      physicalRelease: false, physicalAdmission: 'BLOCKED', physicalGaps: best.plans.flatMap(p => p.physicalGaps ?? []),
      manifestCoverage: { boardPartIds: best.plans.flatMap(p => p.partIds ?? []).sort(), sheetPackageIds: best.plans.filter(p => p.kind === 'sheet').map(p => p.packageId).sort(),
        itemLineIds: best.plans.filter(p => p.kind === 'item').flatMap(p => p.item.assignments.map(l => l.lineId)).sort(),
        featureIds: events.filter(e => e.coverage === true).map(e => e.featureId).sort() } };
    exactSet(job.manifest.boardPartIds, result.manifestCoverage.boardPartIds, 'result.parts');
    exactSet(job.manifest.sheetPackageIds, result.manifestCoverage.sheetPackageIds, 'result.sheets');
    exactSet(job.manifest.items.map(i => i.lineId), result.manifestCoverage.itemLineIds, 'result.items');
    exactSet(job.manifest.featureIds, result.manifestCoverage.featureIds, 'result.features');
    if(job.boards.length===1&&job.boards[0].singleParent){const parent=best.plans.find(p=>p.kind==='board');result.materialResolution={storeSku:parent.storeSku,workpieceLengthIn:parent.stockL_in,requestedMinimumWorkpieceLengthIn:job.boards[0].minimumParentLengthIn,selectionPolicy:'MINIMUM_WHOLE_MODELED_Q_WITHIN_DECLARED_PLAN_SPACE',consideredCandidates:[...new Map(consideredCandidates.map(c=>[c.storeSku,c])).values()]};}
    result.packages=best.plans.filter(p=>p.kind!=='item');
    result.items=best.plans.filter(p=>p.kind==='item').map(p=>({...p,...p.item}));
    result.pieces=best.plans.filter(p=>p.kind==='sheet').flatMap(p=>p.geometry.pieces);
    result.components = best.plans.flatMap(p => p.components ?? []);
    result.labels = [...result.components.map(p => ({ componentId: p.partId, jobId: job.jobId, revision: job.revision, evidenceClass: 'MODEL_LABEL_RECORD_ONLY' })),
      ...best.plans.filter(p => p.kind === 'sheet').flatMap(p => p.geometry.pieces.map(piece => ({ componentId: piece.pieceId, jobId: job.jobId, revision: job.revision, evidenceClass: 'MODEL_LABEL_RECORD_ONLY' })))];
    result.calculationIdentity = { inputHash: calculationHash({ job, model, catalog }), resultHash: calculationHash(result) };
    return result;
  } catch (p) { if (!(p instanceof Problem)) throw p; return refusal(p); }
}

export function evaluateDefinition(catalog, request, manifest, model = createModel()) {
  const c = compileDefinition(request, manifest);
  return c.job ? evaluateManufacturingJob(catalog, c.job, model) : c;
}

