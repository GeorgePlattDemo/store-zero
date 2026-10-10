/**
 * Store Zero sheet-package evaluator: SHEET_PACKAGE_V1.
 *
 * A project (System) sends one parent sheet and the features it wants made from it. The evaluator
 * knows nothing about any project. Store Zero picks the sheet offering, checks every feature against
 * the S-001 Stage-2 envelope, plans retention tabs, times the router and the panel saw, prices the
 * sheet, non-saw machine service, and individually declared manual saw cuts, and answers SUPPORTABLE, or REFUSED / UNRESOLVED / UNAVAILABLE with
 * named reasons. It never moves, resizes or drops a feature to make the job fit.
 *
 * Definition (machine-neutral, part-relative; X along the sheet's long axis from the left end,
 * Y along the short axis from the bottom edge):
 *   {
 *     configurationId, configurationVersion,
 *     sheet: { thicknessIn, lengthIn, widthIn, species?, grade? },
 *     features: [
 *       { featureId, kind: "ARCHED_APERTURE", placement: "CENTERED", widthIn, straightHeightIn, riseIn,
 *         retain: "TABS", requestedTabCount },
 *       { featureId, kind: "STRAIGHT_SPLIT", within: <ARCHED_APERTURE featureId>, line: "VERTICAL_CENTERLINE" },
 *       { featureId, kind: "CROSSCUT", fromEnd: "LEFT" | "RIGHT", distanceIn },
 *       { featureId, kind: "RIP", fromEdge: "BOTTOM" | "TOP", distanceIn },
 *       { featureId, kind: "PATTERN", within: "OPENING", offsetXIn, offsetYIn }
 *     ],
 *     returnAllPieces: true,
 *     exteriorRatingRequested?: boolean
 *   }
 *
 * Order of work: load and reference the whole sheet → route every aperture (tabs kept) → route every
 * split → release the sheet → full straight cuts at the yard panel saw → label every piece. Routed pieces stay in
 * their frame on their tabs; the owner separates them. Every piece goes back to the owner.
 */
import { statedNumber } from "../stated-number.mjs";
import { priceAnswer, stockAnswer } from "../store-state.mjs";
import { calculationHash, D001_TRAVEL_STANDARD, storeMachineSellRate } from "../engine/d001-travel-standard.mjs";
import { S001_STAGE2_ENVELOPE, centeredField } from "../envelopes/s001-stage2-envelope.mjs";
import { evaluateCircularSegment } from "../engine/circular-segment.mjs";
import { STENCIL_TAB_POLICY_V0, archedAperturePerimeter, planArchedStencilTabs, planSplitStencilTabs } from "../engine/stencil-tab-policy.mjs";

export const SHEET_PACKAGE_STANDARD = Object.freeze({
  id: "STB-SHEET-PACKAGE-0.2",
  classId: "sheet_package.s001",
  rule: "ONE_SHEET_EVERY_FEATURE_ANSWERED_NO_MOVE_NO_RESIZE_NO_DROP",
  order: Object.freeze(["LOAD_REFERENCE", "ROUTE_APERTURES", "ROUTE_SPLITS", "RELEASE", "PANEL_SAW_FULL_CUTS", "LABEL"]),
  disposition: "EVERY_PIECE_RETURNED_TO_OWNER"
});

const ENV = S001_STAGE2_ENVELOPE;
const EPS = 1e-9;

function round(value, places = 2) {
  const m = 10 ** places;
  return Math.round((Number(value) + Number.EPSILON) * m) / m;
}
const finite = (v) => typeof v === "number" && Number.isFinite(v);

function reasonRecord(category, code, subject, explanation) {
  return Object.freeze({ category, code, subject, authority: "STORE_ZERO", explanation });
}

// ---------- Material: the Store picks its own sheet offering from the stated facts ----------
function resolveSheet(catalog, sheet, neededOps) {
  const matches = catalog.offerings.filter((item) =>
    item.form === "sheet" &&
    Math.abs(Number(item.actualT) - Number(sheet.thicknessIn)) < 1e-6 &&
    Number(item.sheetL_in) === Number(sheet.lengthIn) &&
    Number(item.sheetW_in) === Number(sheet.widthIn) &&
    (sheet.species == null || item.species === sheet.species) &&
    (sheet.grade == null || item.grade === sheet.grade)
  );
  if (!matches.length) return { status: "REFUSED", code: "NO_MATCHING_SHEET_OFFERING" };
  const offered = matches.filter((item) => item.offered === true);
  if (!offered.length) return { status: "REFUSED", code: "SHEET_NOT_OFFERED" };
  // The material is the customer's: when the stated sheet matches more than one species or grade, Store asks
  // rather than taking the cheapest.
  const materials = [...new Set(offered.map((item) => `${item.species}/${item.grade}`))].sort();
  if (materials.length > 1) return { status: "UNRESOLVED", code: "SHEET_MATERIAL_CHOICE_REQUIRED", offeredMaterials: materials };
  const capable = offered.filter((item) =>
    (item.cellFamily || []).includes(ENV.cellFamily) &&
    neededOps.every((op) => (item.supportedOps || []).includes(op))
  );
  if (!capable.length) return { status: "REFUSED", code: "OPERATION_NOT_ON_SHEET_OFFERING", missing: neededOps };
  const priced = capable
    .filter((item) => item.sellingPrice != null)
    .sort((a, b) => a.sellingPrice - b.sellingPrice || String(a.storeSku).localeCompare(String(b.storeSku)));
  if (!priced.length) return { status: "UNRESOLVED", code: "MISSING_PRICE" };
  const inStock = priced.find((item) => stockAnswer(item, 1, catalog.clock).sufficient === true);
  if (!inStock) return { status: "UNAVAILABLE", code: stockAnswer(priced[0], 1, catalog.clock).status, item: priced[0] };
  return { status: "SUPPORTABLE", item: inStock, matchedOfferings: priced.map((item) => item.storeSku) };
}

// ---------- Features ----------
function evaluateAperture(feature, parent, field, offset = { x: 0, y: 0 }) {
  const refusals = [];
  const unresolved = [];
  if (feature.placement !== "CENTERED") refusals.push("APERTURE_PLACEMENT_NOT_DECLARED");
  if (feature.retain !== "TABS") refusals.push("APERTURE_RETENTION_MUST_BE_TABS");
  const w = feature.widthIn;
  const h = feature.straightHeightIn;
  const rise = feature.riseIn;
  if (![w, h, rise].every(finite)) {
    unresolved.push("APERTURE_SIZE_MISSING");
    return { refusals, unresolved };
  }
  if (!(w > 0 && h > 0 && rise > 0)) {
    refusals.push("APERTURE_SIZE_INVALID");
    return { refusals, unresolved };
  }
  const curve = evaluateCircularSegment({ chord_in: w, rise_in: rise });
  if (!curve.ok) {
    refusals.push(...curve.reasons);
    unresolved.push(...curve.unresolved);
    return { refusals, unresolved };
  }
  if (rise > w / 2 + EPS) refusals.push("ARCH_RISE_EXCEEDS_HALF_WIDTH");
  if (w < ENV.router.minRoutedFeatureIn - EPS || h < ENV.router.minRoutedFeatureIn - EPS) refusals.push("ROUTED_FEATURE_BELOW_MINIMUM");
  const height = h + rise;
  const x0 = (parent.lengthIn - w) / 2 + offset.x;
  const y0 = (parent.widthIn - height) / 2 + offset.y;
  const box = { x0, x1: x0 + w, y0, y1: y0 + height };
  // Finished inside-opening dimensions are the customer's. The 1/2-inch cutter runs on the waste
  // side; its centreline lies one radius inside the nominal profile, and its swept edge may not
  // leave the declared 48 x 36 field.
  const radius = ENV.router.toolDiameterIn / 2;
  const toolCenterlineBox = { x0:box.x0+radius, x1:box.x1-radius, y0:box.y0+radius, y1:box.y1-radius };
  const sweptBox = { x0:toolCenterlineBox.x0-radius, x1:toolCenterlineBox.x1+radius,
                     y0:toolCenterlineBox.y0-radius, y1:toolCenterlineBox.y1+radius };
  const inField = sweptBox.x0 >= field.x0 - EPS && sweptBox.x1 <= field.x1 + EPS &&
                  sweptBox.y0 >= field.y0 - EPS && sweptBox.y1 <= field.y1 + EPS;
  if (w <= ENV.router.toolDiameterIn || height <= ENV.router.toolDiameterIn) refusals.push("TOOL_DIAMETER_EXCEEDS_FEATURE");
  if (!inField) refusals.push("CENTER_WORK_FIELD_EXCEEDED");

  let tabPlan = null;
  const requested = feature.requestedTabCount;
  if (requested == null) unresolved.push("TAB_COUNT_MISSING");
  else if (!Number.isInteger(requested) || requested < 1) refusals.push("TAB_PLAN_COUNT_INVALID");
  const perimeter = archedAperturePerimeter({ chord_in: w, rise_in: rise, radius_in: curve.radius_in, straightHeight_in: h });
  if (!refusals.length && !unresolved.length) {
    tabPlan = planArchedStencilTabs({ chord_in: w, rise_in: rise, radius_in: curve.radius_in, straightHeight_in: h, requestedTabCount: requested, tabMode:feature.tabMode || "AUTO_PLAN", tabPositionsIn:feature.tabPositionsIn });
    if (!tabPlan.ok) (tabPlan.status === "REFUSED" ? refusals : unresolved).push(tabPlan.reason);
  }
  return {
    refusals,
    unresolved,
    geometry: {
      kind: "ARCHED_APERTURE",
      widthIn: w,
      straightHeightIn: h,
      riseIn: rise,
      heightIn: round(height, 6),
      radiusIn: round(curve.radius_in, 6),
      perimeterIn: perimeter ? round(perimeter.perimeter_in, 6) : null,
      box: { x0: round(box.x0, 6), x1: round(box.x1, 6), y0: round(box.y0, 6), y1: round(box.y1, 6) },
      finishedInsideOpeningIn: { widthIn:w, heightIn:height },
      toolDiameterIn: ENV.router.toolDiameterIn,
      toolRadiusCompensationIn: radius,
      toolCenterlineBox, sweptToolBox:sweptBox,
      toolCenterlinePerimeterIn: perimeter ? round(Math.max(0,perimeter.perimeter_in-2*Math.PI*radius),6):null,
      insideWorkField: inField
    },
    tabPlan,
    tabGeometry: { chord_in: w, rise_in: rise, radius_in: curve.radius_in, straightHeight_in: h }
  };
}

function evaluateSplit(feature, apertures) {
  const refusals = [];
  const host = apertures.get(feature.within);
  if (!host) return { refusals: ["SPLIT_HOST_APERTURE_NOT_DEFINED"], unresolved: [] };
  if (feature.line !== "VERTICAL_CENTERLINE") refusals.push("SPLIT_LINE_NOT_DECLARED");
  // A refused or incomplete host cannot produce a derived split; do not add a spurious
  // split-tab reason to the actual workfield or aperture refusal.
  if (!host.geometry || host.refusals?.length || host.unresolved?.length) return { refusals, unresolved: [] };
  const length=host.geometry.heightIn;
  let positions;
  if(feature.splitTabMode==="CUSTOM"){
    positions=feature.splitTabPositionsIn;
    if(!Array.isArray(positions)||!positions.length)return {refusals,unresolved:["SPLIT_TAB_POSITIONS_REQUIRED"]};
  } else if(!feature.splitTabMode||feature.splitTabMode==="AUTO_PLAN"){
    positions=[length/3,2*length/3];
  } else refusals.push("SPLIT_TAB_MODE_NOT_DECLARED");
  if(Array.isArray(positions)){
    if(positions.some(p=>!finite(p)||p<0.5||p>length-0.5))refusals.push("SPLIT_TAB_OUTSIDE_OR_AT_END");
    const sorted=[...positions].sort((a,b)=>a-b);
    if(sorted.some((p,i)=>i&&p-sorted[i-1]<1-EPS))refusals.push("SPLIT_TAB_BRIDGES_OVERLAP");
    if(sorted.length < Math.ceil(length*0.05-EPS))refusals.push("SPLIT_TAB_RETAINED_LENGTH_BELOW_FIVE_PERCENT");
    if([sorted[0],...sorted.slice(1).map((p,i)=>p-sorted[i]),length-sorted.at(-1)].some(gap=>gap-1>24+EPS))refusals.push("SPLIT_TAB_UNCUT_SPAN_EXCEEDS_24_IN");
    positions=sorted;
  }
  const pieceW = (host.geometry.widthIn - ENV.router.toolDiameterIn) / 2;
  if (pieceW < ENV.router.minSplitPieceWidthIn - EPS) refusals.push("SPLIT_PIECE_BELOW_MINIMUM");
  return {
    refusals,
    unresolved: [],
    host,
    geometry: {
      kind: "STRAIGHT_SPLIT",
      line: "VERTICAL_CENTERLINE",
      xIn: round((host.geometry.box.x0 + host.geometry.box.x1) / 2, 6),
      lengthIn: host.geometry.heightIn,
      pieceWidthIn: round(pieceW, 6),
      splitTabs: { mode:feature.splitTabMode||"AUTO_PLAN", positionsIn:(positions||[]).map(p=>round(p,6)), bridgeWidthIn:1, nominalRetentionFraction:positions?.length/length ?? null }
    }
  };
}

function evaluateCrosscut(feature, parent, apertureBoxes) {
  const refusals = [], unresolved = [];
  if (!["LEFT","RIGHT"].includes(feature.fromEnd)) refusals.push("CROSSCUT_END_NOT_DECLARED");
  if (!finite(feature.distanceIn)) return { refusals, unresolved:["CROSSCUT_DISTANCE_MISSING"] };
  const x = feature.fromEnd==="RIGHT" ? parent.lengthIn-feature.distanceIn : feature.distanceIn;
  if (!(x>0 && x<parent.lengthIn)) return { refusals:[...refusals,"CROSSCUT_OUTSIDE_SHEET"],unresolved };
  const t=ENV.panelSaw.nominalPositionToleranceIn, halfKerf=ENV.panelSaw.kerfIn/2;
  const minEdge=Math.min(x,parent.lengthIn-x)-t-halfKerf;
  if (minEdge < ENV.panelSaw.minPieceIn - EPS) refusals.push("CROSSCUT_PIECE_BELOW_MINIMUM");
  const clear=ENV.panelSaw.minClearanceToRoutedFeatureIn+t+halfKerf;
  if (apertureBoxes.some(box=>x>=box.x0-clear-EPS && x<=box.x1+clear+EPS)) refusals.push("CROSSCUT_INTERSECTS_ROUTED_FEATURE");
  return { refusals,unresolved,geometry:{kind:"CROSSCUT",xIn:round(x,6),lengthIn:parent.widthIn,
    datum:feature.fromEnd, nominalPositionIn:feature.distanceIn,
    positionToleranceIn:t, toleranceBasis:"DECLARED_NOT_MEASURED",kerfIn:ENV.panelSaw.kerfIn}};
}
function evaluateRip(feature,parent,apertureBoxes) {
  const refusals=[],unresolved=[];
  if (!["BOTTOM","TOP"].includes(feature.fromEdge)) refusals.push("RIP_EDGE_NOT_DECLARED");
  if (!finite(feature.distanceIn)) return {refusals,unresolved:["RIP_DISTANCE_MISSING"]};
  const y=feature.fromEdge==="TOP" ? parent.widthIn-feature.distanceIn : feature.distanceIn;
  if (!(y>0&&y<parent.widthIn)) return {refusals:[...refusals,"RIP_OUTSIDE_SHEET"],unresolved};
  const t=ENV.panelSaw.nominalPositionToleranceIn, halfKerf=ENV.panelSaw.kerfIn/2;
  if (Math.min(y,parent.widthIn-y)-t-halfKerf < ENV.panelSaw.minPieceIn-EPS) refusals.push("RIP_PIECE_BELOW_MINIMUM");
  const clear=ENV.panelSaw.minClearanceToRoutedFeatureIn+t+halfKerf;
  if (apertureBoxes.some(box=>y>=box.y0-clear-EPS&&y<=box.y1+clear+EPS)) refusals.push("RIP_INTERSECTS_ROUTED_FEATURE");
  return {refusals,unresolved,geometry:{kind:"RIP",yIn:round(y,6),lengthIn:parent.lengthIn,
    datum:feature.fromEdge,nominalPositionIn:feature.distanceIn,
    positionToleranceIn:t,toleranceBasis:"DECLARED_NOT_MEASURED",kerfIn:ENV.panelSaw.kerfIn}};
}

// ---------- Pieces ----------
function piecesFor(parent,crosscutXs,apertures,splits,ripYs=[]) {
  const t=ENV.panelSaw.nominalPositionToleranceIn,kerf=ENV.panelSaw.kerfIn;
  // Orthogonal *full parent* saw lines require separate setups after the first cut breaks the
  // parent. They are refused until a per-piece saw plan prices the actual additional strokes.
  const axis=ripYs.length ? "y" : "x";
  const boundaries=axis==="y" ? [...ripYs].sort((a,b)=>a-b) : [...crosscutXs].sort((a,b)=>a-b);
  const limit=axis==="y" ? parent.widthIn : parent.lengthIn;
  const cuts=[0,...boundaries,limit];
  const pieces=[],refusals=[];
  for(let i=0;i+1<cuts.length;i++) {
    const from=cuts[i]+(i===0?0:kerf/2);
    const to=cuts[i+1]-(i+1===cuts.length-1?0:kerf/2);
    const size=to-from;
    const worst=size - (i===0?0:t) - (i+1===cuts.length-1?0:t);
    if(worst<ENV.panelSaw.minPieceIn-EPS) refusals.push(axis==="y"?"RIP_PIECE_BELOW_MINIMUM":"CROSSCUT_PIECE_BELOW_MINIMUM");
    const bounds=axis==="y" ?
      {x0:0,x1:parent.lengthIn,y0:from,y1:to} :
      {x0:from,x1:to,y0:0,y1:parent.widthIn};
    const holds=apertures.filter(a=>a.geometry.box.x0>=bounds.x0-EPS&&a.geometry.box.x1<=bounds.x1+EPS&&a.geometry.box.y0>=bounds.y0-EPS&&a.geometry.box.y1<=bounds.y1+EPS);
    pieces.push({
      pieceId:"P"+(i+1),kind:holds.length?"FRAME":"PANEL",
      lengthIn:round(bounds.x1-bounds.x0,4),widthIn:round(bounds.y1-bounds.y0,4),
      fromXIn:round(bounds.x0,4),toXIn:round(bounds.x1,4),
      ...(axis==="y"?{fromYIn:round(from,4),toYIn:round(to,4)}:{}),
      carries:holds.map(a=>a.featureId), disposition:"RETURNED_TO_OWNER",
      manualCutPositionToleranceIn:t
    });
  }
  for(const a of apertures){
    const frame=pieces.find(p=>p.carries.includes(a.featureId));
    const split=splits.find(v=>v.host===a);
    if(split){
      for(const side of ["LEFT","RIGHT"]){
        pieces.push({
          pieceId:a.featureId+"-"+side,kind:"RETAINED_CENTER_PIECE",
          widthIn:split.geometry.pieceWidthIn,heightIn:a.geometry.heightIn,
          retainedBy:"TABS",
          tabs:(side==="LEFT"?a.tabPlan?.split?.leftPieceTabs:a.tabPlan?.split?.rightPieceTabs)??null,
          splitRetainedBridgeCount:split.geometry.splitTabs?.positionsIn?.length??null,
          inFrame:frame?.pieceId??null,disposition:"RETURNED_TO_OWNER"
        });
      }
    }else{
      pieces.push({
        pieceId:a.featureId+"-CENTER",kind:"RETAINED_CENTER_PIECE",
        widthIn:round(a.geometry.widthIn-ENV.router.toolDiameterIn,4),
        heightIn:a.geometry.heightIn,retainedBy:"TABS",tabs:a.tabPlan?.plannedTabCount??null,
        inFrame:frame?.pieceId??null,disposition:"RETURNED_TO_OWNER"
      });
    }
  }
  return {pieces,refusals};
}

// ---------- Time and price ----------
function timeFor(sheetItem, apertures, splits, crosscuts, rips, pieceCount) {
  const r = ENV.router;
  const passes = Math.max(1, Math.ceil(Number(sheetItem.actualT) / r.passDepthIn - EPS));
  const routed = apertures.length + splits.length;
  const routeLengthIn = apertures.reduce((sum,a)=>sum+a.geometry.toolCenterlinePerimeterIn,0)
    + splits.reduce((sum,s)=>sum+s.geometry.lengthIn,0);
  const tabs = apertures.reduce((sum, a) => sum + (a.tabPlan?.plannedTabCount || 0), 0) + splits.reduce((sum,s)=>sum+(s.geometry.splitTabs?.positionsIn.length||0),0);
  const t = {
    T_LOAD_REFERENCE_sec: routed ? r.loadSeatReferenceSec : 0,
    T_ROUTE_sec: round((routeLengthIn * passes / r.routeFeedInPerMin) * 60, 3),
    T_PLUNGE_sec: routed * passes * r.plungeRetractSec,
    T_TAB_sec: tabs * passes * r.tabLiftSec,
    T_RELEASE_sec: routed ? r.releaseUnloadSec : 0,
    T_PANEL_SAW_sec: round([...crosscuts,...rips].reduce((sum,c)=>sum+ENV.panelSaw.setAndAlignSec+(c.geometry.lengthIn/ENV.panelSaw.cutFeedInPerMin)*60,0), 3),
    T_LABEL_sec: pieceCount * ENV.label.perPieceSec
  };
  const total = Object.values(t).reduce((sum, v) => sum + v, 0);
  return {
    ...t,
    T_MACHINE_sec: round(total, 3),
    T_MACHINE_min: round(total / 60, 4),
    routedLengthIn: round(routeLengthIn, 4),
    passes,
    basis: "DECLARED_STAGE2_MODEL",
    measured: false
  };
}

function operationsFor(apertures, splits, crosscuts, rips, passes) {
  const ops=[];
  // Yard-saw-only work never pretends the sheet was loaded into the router.
  if(apertures.length||splits.length)
    ops.push({seq:1,opId:"LOAD_REFERENCE",station:ENV.router.station,note:"whole sheet seated and referenced to the router centerline"});
  for (const a of apertures) {
    ops.push({ seq: ops.length + 1, opId: "ROUTE_PROFILE", station: ENV.router.station, featureId: a.featureId, profile: "ARCHED_APERTURE", lengthIn: a.geometry.toolCenterlinePerimeterIn, passes, tabs: a.tabPlan.plannedTabCount, toolDiameterIn: ENV.router.toolDiameterIn, toolpathConvention:ENV.router.toolPath });
  }
  for (const s of splits) {
    ops.push({ seq: ops.length + 1, opId: "ROUTE_PROFILE", station: ENV.router.station, featureId: s.featureId, profile: "STRAIGHT_SPLIT", lengthIn: s.geometry.lengthIn, passes, tabs:s.geometry.splitTabs?.positionsIn.length });
  }
  if (apertures.length || splits.length) ops.push({ seq: ops.length + 1, opId: "RELEASE", station: ENV.router.station });
  for (const c of [...crosscuts].sort((a, b) => a.geometry.xIn - b.geometry.xIn)) {
    ops.push({ seq: ops.length + 1, opId: "CROSSCUT", station: ENV.panelSaw.station, featureId: c.featureId, xIn: c.geometry.xIn, lengthIn: c.geometry.lengthIn, toleranceIn:c.geometry.positionToleranceIn, datum:c.geometry.datum, price:ENV.panelSaw.servicePricePerCompletedCut });
  }
  for(const c of [...rips].sort((a,b)=>a.geometry.yIn-b.geometry.yIn)){
    ops.push({seq:ops.length+1,opId:"RIP",station:ENV.panelSaw.station,featureId:c.featureId,
      yIn:c.geometry.yIn,lengthIn:c.geometry.lengthIn,datum:c.geometry.datum,
      toleranceIn:c.geometry.positionToleranceIn,price:ENV.panelSaw.servicePricePerCompletedCut});
  }
  ops.push({ seq: ops.length + 1, opId: "LABEL", station: "YARD" });
  return ops;
}

// ---------- The answer ----------
export function evaluateSheetPackageJob(catalog, demand = {}) {
  const identity = {
    configurationId: String(demand.configurationId || ""),
    configurationVersion: String(demand.configurationVersion || ""),
    storeRevision: demand.storeRevision || null
  };
  const refusals = [];
  const unresolved = [];
  const records = [];
  const refuse = (code, subject, text, category = "CAPABILITY_GAP") => { refusals.push(code); records.push(reasonRecord(category, code, subject, text)); };
  const leave = (code, subject, text) => { unresolved.push(code); records.push(reasonRecord("DEFINITION_GAP", code, subject, text)); };

  if (!identity.configurationId || !identity.configurationVersion) leave("CONFIGURATION_IDENTITY_REQUIRED", "definition", "A sheet package names its configuration and version.");
  for (const key of ENV.machineLocalLanguage) {
    if (demand[key] != null) refuse("MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED", key, "Store Zero takes part definitions, not machine instructions.", "DEFINITION_GAP");
  }

  const sheet = demand.sheet || {};
  const parent = { lengthIn: statedNumber(sheet.lengthIn), widthIn: statedNumber(sheet.widthIn), thicknessIn: statedNumber(sheet.thicknessIn) };
  if (![parent.lengthIn, parent.widthIn, parent.thicknessIn].every(Number.isFinite)) {
    leave("SHEET_SIZE_MISSING", "sheet", "The sheet needs a length, a width and a thickness in inches.");
  } else {
    if (parent.lengthIn !== ENV.stock.parentLengthIn || parent.widthIn !== ENV.stock.parentWidthIn) refuse("SHEET_SIZE_OUTSIDE_S001_ENVELOPE", "sheet", "The S-001 sheet cell takes a full 48 × 96 in sheet.");
    if (parent.thicknessIn > ENV.stock.maxThicknessIn + EPS || parent.thicknessIn < ENV.stock.minThicknessIn - EPS) refuse("SHEET_THICKNESS_OUTSIDE_S001_ENVELOPE", "sheet", "S-001 routes sheets from 1/4 in to 3/4 in thick.");
  }

  // Every piece cut from the sheet goes back to the customer; the definition says so, and nothing else is offered.
  if (demand.returnAllPieces == null) leave("RETURN_ALL_PIECES_REQUIRED", "definition", "A sheet package states that every piece is returned.");
  else if (demand.returnAllPieces !== true) refuse("PIECE_DISPOSAL_NOT_OFFERED", "definition", "Store Zero returns every piece cut from the sheet; it does not keep or discard pieces.");

  const features = Array.isArray(demand.features) ? demand.features : [];
  if (!features.length) leave("FEATURES_REQUIRED", "definition", "A sheet package names at least one feature.");
  const ids = features.map((f) => String(f?.featureId || ""));
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) leave("UNIQUE_FEATURE_ID_REQUIRED", "features", "Every feature needs its own id.");

  const field = Number.isFinite(parent.lengthIn) && Number.isFinite(parent.widthIn) ? centeredField(parent.lengthIn, parent.widthIn) : null;
  const apertures = [];
  const apertureById = new Map();
  const splits = [];
  const crosscuts = [], rips=[];
  const patternRows=features.filter(f=>f?.kind==="PATTERN");
  const patterns=new Map();
  for(const pattern of patternRows){
    if(!pattern.within || !features.some(f=>f.kind==="ARCHED_APERTURE"&&f.featureId===pattern.within)){
      refuse("PATTERN_HOST_APERTURE_REQUIRED",pattern.featureId||"feature","A pattern positions a defined aperture from this same job.");
    }else if(patterns.has(pattern.within)){
      refuse("PATTERN_DUPLICATE_FOR_APERTURE",pattern.featureId,"Only one placement modifier may govern an aperture.");
    }else if(!finite(pattern.offsetXIn)||!finite(pattern.offsetYIn)){
      leave("PATTERN_OFFSETS_REQUIRED",pattern.featureId,"A pattern states its X and Y offset in inches.");
    }else{
      patterns.set(pattern.within,pattern);
    }
  }
  for (const feature of features) {
    if (!ENV.featureKinds.includes(feature?.kind)) {
      refuse("FEATURE_KIND_NOT_DECLARED", feature?.featureId || "feature", "Store Zero's sheet cell does not declare this kind of feature.");
    }
  }
  if (field) {
    for (const feature of features.filter((f) => f?.kind === "ARCHED_APERTURE")) {
      const pattern=patterns.get(feature.featureId);
      const result=evaluateAperture(feature,parent,field,
        {x:pattern?.offsetXIn??0,y:pattern?.offsetYIn??0});
      result.refusals.forEach((code) => refuse(code, feature.featureId, apertureText(code)));
      result.unresolved.forEach((code) => leave(code, feature.featureId, apertureText(code)));
      const entry = { featureId: feature.featureId, ...result };
      if (result.geometry) apertures.push(entry);
      apertureById.set(feature.featureId, entry);
    }
    for (const feature of features.filter((f) => f?.kind === "STRAIGHT_SPLIT")) {
      const result = evaluateSplit(feature, apertureById);
      result.refusals.forEach((code) => refuse(code, feature.featureId, splitText(code)));
      result.unresolved.forEach((code) => leave(code, feature.featureId, splitText(code)));
      if (result.geometry) splits.push({ featureId: feature.featureId, ...result });
    }
    for (const feature of features.filter((f) => f?.kind === "CROSSCUT")) {
      const result = evaluateCrosscut(feature, parent, apertures.map((a) => a.geometry.box));
      result.refusals.forEach((code) => refuse(code, feature.featureId, crosscutText(code)));
      result.unresolved.forEach((code) => leave(code, feature.featureId, crosscutText(code)));
      if (result.geometry) crosscuts.push({ featureId: feature.featureId, ...result });
    }
    for(const feature of features.filter(f=>f?.kind==="RIP")){
      const result=evaluateRip(feature,parent,apertures.map(a=>a.geometry.box));
      result.refusals.forEach(code=>refuse(code,feature.featureId,ripText(code)));
      result.unresolved.forEach(code=>leave(code,feature.featureId,ripText(code)));
      if(result.geometry)rips.push({featureId:feature.featureId,...result});
    }
  }
  if(crosscuts.length&&rips.length)
    refuse("ORTHOGONAL_SAW_STAGING_NOT_DEFINED","features","Intersecting full-width and full-length saw lines require separate per-piece strokes; this package does not yet define or price that staging.");
  // A parallel pair can produce a sub-minimum strip even when each cut is far enough from a sheet edge.
  for(const [cuts,limit,code] of [[crosscuts.map(c=>c.geometry.xIn),parent.lengthIn,"CROSSCUT_PIECE_BELOW_MINIMUM"],[rips.map(c=>c.geometry.yIn),parent.widthIn,"RIP_PIECE_BELOW_MINIMUM"]]){
    if(!Number.isFinite(limit))continue;
    const xs=[0,...cuts.sort((a,b)=>a-b),limit];
    for(let i=1;i+1<xs.length;i++)
      if(xs[i+1]-xs[i]-ENV.panelSaw.kerfIn-2*ENV.panelSaw.nominalPositionToleranceIn<ENV.panelSaw.minPieceIn-EPS)
        refuse(code,"features","The worst-case cut positions leave a piece shorter than the yard saw minimum.");
  }
  // Splits make two retained pieces out of one center: each piece keeps its own tabs.
  for (const s of splits) {
    const host = s.host;
    if(host.tabPlan?.ok){
      host.tabPlan=planSplitStencilTabs(host.tabPlan,host.tabGeometry);
      if(!host.tabPlan.ok)refuse(host.tabPlan.reason,s.featureId,"Customer tab positions do not hold both split pieces; Store did not move them.");
    }
  }

  const neededOps = [...new Set(features.map((f) => ENV.requiredOps[f?.kind]).filter(Boolean))];
  const material = Number.isFinite(parent.thicknessIn) ? resolveSheet(catalog, { ...sheet, thicknessIn: parent.thicknessIn }, neededOps) : null;
  if (material && material.status === "REFUSED") refuse(material.code, "sheet", materialText(material.code), "MATERIAL_GAP");
  if (material && material.status === "UNRESOLVED") {
    leave(material.code, "sheet", material.code === "SHEET_MATERIAL_CHOICE_REQUIRED"
      ? `More than one sheet material matches (${material.offeredMaterials.join(", ")}); the customer's species and grade must be sent.`
      : "Store Zero has no selling price for this sheet.");
  }
  if (demand.exteriorRatingRequested === true && material?.item && !/exterior/i.test(String(material.item.grade))) {
    leave("EXTERIOR_RATING_NOT_ESTABLISHED_BY_SKU", "sheet", "This sheet is not sold as exterior rated.");
  }

  let pieces = [];
  if (field && Number.isFinite(parent.lengthIn)) {
    const cut=piecesFor(parent,crosscuts.map(c=>c.geometry.xIn),apertures,splits,rips.map(c=>c.geometry.yIn));
    pieces = cut.pieces;
    // A piece too short to cut belongs to the crosscuts that make it.
    [...new Set(cut.refusals)].forEach(code=>refuse(code,"features",code==="RIP_PIECE_BELOW_MINIMUM"?ripText(code):crosscutText(code)));
  }

  // Every requested feature gets its own answer, so nothing is silently dropped.
  const featureAnswers = features.map((feature) => {
    const id = feature?.featureId || "feature";
    const codes = records.filter((r) => r.subject === id).map((r) => r.code);
    const refused = codes.some((code) => refusals.includes(code));
    const open = codes.some((code) => unresolved.includes(code));
    return {
      featureId: id,
      kind: feature?.kind ?? null,
      status: refused ? "REFUSED" : open ? "UNRESOLVED" : "ANSWERED",
      reasonCodes: [...new Set(codes)]
    };
  });

  const uniqueRefusals = [...new Set(refusals)];
  const uniqueUnresolved = [...new Set(unresolved)];
  const stockShort = material?.status === "UNAVAILABLE";
  const status = uniqueRefusals.length ? "REFUSED" : uniqueUnresolved.length ? "UNRESOLVED" : stockShort ? "UNAVAILABLE" : "SUPPORTABLE";
  if (stockShort) records.push(reasonRecord("AVAILABILITY_GAP", material.code, "sheet", "Store Zero does not have this sheet on hand."));

  const item = material?.item || null;
  let time = null;
  let totals = null;
  let operations = null;
  if (status === "SUPPORTABLE") {
    time = timeFor(item, apertures, splits, crosscuts, rips, pieces.length);
    const rate = storeMachineSellRate(D001_TRAVEL_STANDARD.economics);
    const hourlySeconds=time.T_MACHINE_sec-time.T_PANEL_SAW_sec;
    const machine=round(hourlySeconds/3600*rate.sellRatePerHour,2);
    const manualCutService=round((crosscuts.length+rips.length)*ENV.panelSaw.servicePricePerCompletedCut,2);
    const materialPrice = round(Number(item.sellingPrice), 2);
    totals = {
      material: materialPrice,
      machine_service: machine,
      manual_cut_service:manualCutService,
      manualCutCount:crosscuts.length+rips.length,
      manualCutRate:ENV.panelSaw.servicePricePerCompletedCut,
      Q: round(materialPrice + machine + manualCutService, 2),
      sellRatePerHour: rate.sellRatePerHour,
      basis: "CALCULATED_FROM_DECLARED_STAGE2_MODEL"
    };
    operations = operationsFor(apertures, splits, crosscuts, rips, time.passes);
  }

  const answerMaterial = item ? {
    storeSku: item.storeSku,
    description: item.description || null,
    thicknessIn: item.actualT,
    lengthIn: item.sheetL_in,
    widthIn: item.sheetW_in,
    species: item.species || null,
    grade: item.grade || null,
    price: priceAnswer(item, catalog.clock),
    stock: stockAnswer(item, 1, catalog.clock),
    matchedOfferings: material.matchedOfferings || null
  } : null;

  const resultCore = {
    standard: SHEET_PACKAGE_STANDARD.id,
    status,
    refusals: uniqueRefusals,
    unresolved: uniqueUnresolved,
    material: answerMaterial ? { storeSku: answerMaterial.storeSku } : null,
    features: [...apertures.map(a=>a.geometry),...splits.map(s=>s.geometry),...crosscuts.map(c=>c.geometry),...rips.map(c=>c.geometry),
      ...patternRows.map(f=>({kind:"PATTERN",featureId:f.featureId,within:f.within,offsetXIn:f.offsetXIn,offsetYIn:f.offsetYIn}))],
    pieces,
    totals
  };
  return {
    classId: SHEET_PACKAGE_STANDARD.classId,
    standard: SHEET_PACKAGE_STANDARD.id,
    stage: 2,
    store: "Store Zero",
    cellFamily: ENV.cellFamily,
    envelope: ENV.id,
    configurationId: identity.configurationId,
    configurationVersion: identity.configurationVersion,
    status,
    complete: status === "SUPPORTABLE",
    refusalConditions: uniqueRefusals,
    unresolvedConditions: uniqueUnresolved,
    reasonCodes: [...uniqueRefusals, ...uniqueUnresolved, ...(stockShort ? [material.code] : [])],
    reasonRecords: records,
    material: answerMaterial,
    workField: field ? { id: ENV.workField.id, ...field } : null,
    featureAnswers,
    features: {
      apertures: apertures.map((a) => ({ featureId: a.featureId, ...a.geometry, tabPlan: a.tabPlan })),
      splits: splits.map((s) => ({ featureId: s.featureId, within: s.host.featureId, ...s.geometry })),
      crosscuts:crosscuts.map(c=>({featureId:c.featureId,...c.geometry})),
      rips:rips.map(c=>({featureId:c.featureId,...c.geometry})),
      patterns:patternRows.map(f=>({featureId:f.featureId,within:f.within,offsetXIn:f.offsetXIn,offsetYIn:f.offsetYIn,
        status:records.some(r=>r.subject===f.featureId)?"REFUSED_OR_UNRESOLVED":"ANSWERED"}))
    },
    operations,
    pieces,
    time,
    totals,
    Q: totals ? totals.Q : null,
    evidence: {
      evidenceClass: ENV.evidenceClass,
      capabilityBasis: ENV.assumptions.capabilityBasis,
      timingBasis: ENV.assumptions.timingBasis,
      assumptions: ENV.assumptions.status,
      measured: false,
      commissioned: false,
      physicalStatus: ENV.physicalStatus,
      physicalMachineEvidence: false,
      commercialQuote: false,
      replacedBy: ENV.assumptions.replacedBy,
      economics: ENV.economicsBasis,
      tabRetention: STENCIL_TAB_POLICY_V0.physicalRetentionStatus
    },
    note: "Budgetary estimate from declared Stage-2 reference capability. Not a commercial quote, not a cut.",
    not_claimed: [...ENV.notClaimed, "commercial quote", "seller-of-record"],
    calculationIdentity: {
      inputHash: calculationHash({ standard: SHEET_PACKAGE_STANDARD.id, demand }),
      resultHash: calculationHash(resultCore)
    }
  };
}

function apertureText(code) {
  return {
    APERTURE_PLACEMENT_NOT_DECLARED: "The sheet cell routes an arched opening centered on the sheet.",
    APERTURE_RETENTION_MUST_BE_TABS: "Routed pieces stay attached by tabs.",
    APERTURE_SIZE_MISSING: "The opening needs a width, a straight-side height and an arch rise.",
    APERTURE_SIZE_INVALID: "Opening sizes must be positive.",
    ARCH_RISE_EXCEEDS_HALF_WIDTH: "An arch on straight sides rises at most half the opening width.",
    ROUTED_FEATURE_BELOW_MINIMUM: "The opening is smaller than the smallest routed feature the sheet cell declares (6 in).",
    CENTER_WORK_FIELD_EXCEEDED: "The whole opening must fit inside the centered 48 × 36 in working field.",
    TAB_COUNT_MISSING: "State how many tabs should hold the center.",
    TAB_PLAN_COUNT_INVALID: "The tab count must be a whole number of at least one."
  }[code] || "The arch geometry is not constructible as stated.";
}
function splitText(code) {
  return {
    SPLIT_HOST_APERTURE_NOT_DEFINED: "A split runs inside an opening defined in the same package.",
    SPLIT_LINE_NOT_DECLARED: "The sheet cell declares only a split on the opening's vertical centerline.",
    SPLIT_PIECE_BELOW_MINIMUM: "Each split piece would be narrower than 3 in."
  }[code] || code;
}
function crosscutText(code) {
  return {
    CROSSCUT_END_NOT_DECLARED: "Measure a crosscut from the LEFT or RIGHT end of the sheet.",
    CROSSCUT_DISTANCE_MISSING: "State how far from the end to cut.",
    CROSSCUT_OUTSIDE_SHEET: "The cut line is off the sheet.",
    CROSSCUT_INTERSECTS_ROUTED_FEATURE: "The saw line would run through, or within 1 in of, a routed opening.",
    CROSSCUT_PIECE_BELOW_MINIMUM: "A crosscut would leave a piece shorter than the panel saw's 6 in minimum."
  }[code] || code;
}
function ripText(code){
  return {
    RIP_EDGE_NOT_DECLARED:"A rip is measured from TOP or BOTTOM of the original sheet.",
    RIP_DISTANCE_MISSING:"State the rip distance from the declared sheet edge.",
    RIP_OUTSIDE_SHEET:"The rip lies outside the sheet.",
    RIP_INTERSECTS_ROUTED_FEATURE:"The 1/4-inch tolerance and saw kerf may intersect the routed profile.",
    RIP_PIECE_BELOW_MINIMUM:"The worst-case rip produces a piece below the panel saw's six-inch minimum."
  }[code]||code;
}
function materialText(code) {
  return {
    NO_MATCHING_SHEET_OFFERING: "Store Zero stocks no sheet of this size and thickness.",
    SHEET_NOT_OFFERED: "Store Zero lists this sheet but does not offer it.",
    OPERATION_NOT_ON_SHEET_OFFERING: "The matching sheet is not offered for every operation this package needs."
  }[code] || code;
}
