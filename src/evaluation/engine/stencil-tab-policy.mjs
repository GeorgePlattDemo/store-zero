/**
 * REFERENCE stencil-tab planning policy for S-001 Mode-2 arched apertures.
 *
 * This is geometry/planning logic, not a physical holding-force model and not a
 * safety factor. Commercial CAM practice commonly exposes tab count/distance,
 * width/height, and manual/automatic placement. This Stage-2 policy keeps those concerns
 * separate and does not invent unmeasured plywood retention constants.
 */
export const STENCIL_TAB_POLICY_V0 = Object.freeze({
  id: "S001-STENCIL-TAB-POLICY-V1",
  evidenceClass: "REFERENCE",
  physicalRetentionStatus: "NOT_MEASURED",
  placementMethod: "DISTRIBUTED_ARCLENGTH_TRANSITION_AVOIDANCE",
  referenceBaseCount: 4,
  planningReserveTabs: 0,
  maxAllowedGap_in: 24,
  minBridgeWidth_in: 1,
  minRemainingThickness_in: null,
  minimumRetainedFraction: 0.05,
  tabArclengthOrigin: "BOTTOM_LEFT_CCW",
  tabSelection: "AUTO_PLAN_OR_CUSTOM_POSITIONS",
  cornerKeepout_in: null,
  transitionKeepout_in: null,
  userVeto: "PLANNED_RE-SOLVE",
  // A routed piece that is split in two keeps at least this many tabs on each piece.
  minTabsPerRetainedPiece: 2,
  splitCenterKeepoutIn: 0.5,
  note:
    "One-inch geometric tab bridges do not establish measured holding strength or certified workholding."
});

function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

function round6(value) {
  return Number(value.toFixed(6));
}

export function archedAperturePerimeter({
  chord_in,
  rise_in,
  radius_in,
  straightHeight_in
} = {}) {
  if (![chord_in, rise_in, radius_in, straightHeight_in].every(finitePositive)) {
    return null;
  }
  const ratio = chord_in / (2 * radius_in);
  if (!(ratio > 0 && ratio <= 1)) return null;
  const arcAngle_rad = 2 * Math.asin(ratio);
  const arcLength_in = radius_in * arcAngle_rad;
  return {
    perimeter_in: chord_in + 2 * straightHeight_in + arcLength_in,
    arcAngle_rad,
    arcLength_in
  };
}

function transitionAvoidingPhase(perimeter, count, transitions) {
  const spacing = perimeter / count;
  const residues = transitions
    .map((value) => ((value % spacing) + spacing) % spacing)
    .sort((a, b) => a - b)
    .filter((value, index, list) => index === 0 || Math.abs(value - list[index - 1]) > 1e-9);
  if (residues.length === 0) return spacing / 2;

  let bestStart = residues[0];
  let bestGap = -1;
  for (let index = 0; index < residues.length; index += 1) {
    const start = residues[index];
    const end = index + 1 < residues.length ? residues[index + 1] : residues[0] + spacing;
    const gap = end - start;
    if (gap > bestGap) {
      bestGap = gap;
      bestStart = start;
    }
  }
  return (bestStart + bestGap / 2) % spacing;
}

function cyclicDistance(a, b, perimeter) {
  const raw = Math.abs(a - b) % perimeter;
  return Math.min(raw, perimeter - raw);
}

function pointAtArclength({ chord_in, rise_in, radius_in, straightHeight_in }, arclength_in) {
  const half = chord_in / 2;
  const base = chord_in;
  const rightTop = base + straightHeight_in;
  const geometry = archedAperturePerimeter({ chord_in, rise_in, radius_in, straightHeight_in });
  if (!geometry) return null;
  const arcEnd = rightTop + geometry.arcLength_in;
  const perimeter = geometry.perimeter_in;
  const s = ((arclength_in % perimeter) + perimeter) % perimeter;

  if (s < base) {
    return { segment: "BOTTOM", x_in: -half + s, y_in: 0, curved: false };
  }
  if (s < rightTop) {
    return { segment: "RIGHT_SIDE", x_in: half, y_in: s - base, curved: false };
  }
  if (s < arcEnd) {
    const centerY = straightHeight_in + rise_in - radius_in;
    const endpointOffsetY = radius_in - rise_in;
    const startAngle = Math.atan2(endpointOffsetY, half);
    const angle = startAngle + (s - rightTop) / radius_in;
    return {
      segment: "ARCH",
      x_in: radius_in * Math.cos(angle),
      y_in: centerY + radius_in * Math.sin(angle),
      curved: true
    };
  }
  return {
    segment: "LEFT_SIDE",
    x_in: -half,
    y_in: straightHeight_in - (s - arcEnd),
    curved: false
  };
}

export function planArchedStencilTabs({
  chord_in, rise_in, radius_in, straightHeight_in,
  requestedTabCount, tabMode = "AUTO_PLAN", tabPositionsIn
} = {}) {
  const geometry = archedAperturePerimeter({ chord_in, rise_in, radius_in, straightHeight_in });
  if (!geometry) return { ok: false, status: "UNRESOLVED", reason: "TAB_PLAN_GEOMETRY_UNRESOLVED" };
  const policy = STENCIL_TAB_POLICY_V0;
  const perimeter = geometry.perimeter_in;
  if (requestedTabCount != null && (!Number.isInteger(requestedTabCount) || requestedTabCount < 1)) {
    return { ok: false, status: "REFUSED", reason: "TAB_PLAN_COUNT_INVALID" };
  }
  if (!["AUTO_PLAN", "CUSTOM"].includes(tabMode)) {
    return { ok: false, status: "REFUSED", reason: "TAB_PLACEMENT_MODE_NOT_DECLARED" };
  }
  const requiredForRetention = Math.ceil((perimeter * policy.minimumRetainedFraction - 1e-9) / policy.minBridgeWidth_in);
  const requiredForSpacing = Math.ceil(perimeter / (policy.maxAllowedGap_in + policy.minBridgeWidth_in));
  const policyMinimum = Math.max(policy.referenceBaseCount, requiredForRetention, requiredForSpacing);
  const transitions = [0, chord_in, chord_in + straightHeight_in, chord_in + straightHeight_in + geometry.arcLength_in];
  const minimumBridge = policy.minBridgeWidth_in;
  let positions;
  if (tabMode === "CUSTOM") {
    if (!Array.isArray(tabPositionsIn) || !tabPositionsIn.length) {
      return { ok: false, status: "UNRESOLVED", reason: "TAB_CUSTOM_POSITIONS_REQUIRED" };
    }
    if (tabPositionsIn.some((v) => !Number.isFinite(v) || v < 0 || v >= perimeter)) {
      return { ok: false, status: "REFUSED", reason: "TAB_CUSTOM_POSITION_OUTSIDE_CONTOUR" };
    }
    // Customer arclength coordinates are preserved; Store never moves their specified positions.
    positions = [...tabPositionsIn].sort((a,b) => a-b);
    if (requestedTabCount != null && requestedTabCount !== positions.length) {
      return { ok: false, status: "REFUSED", reason: "TAB_COUNT_POSITION_MISMATCH" };
    }
  } else {
    const count = Math.max(requestedTabCount ?? 0, policyMinimum);
    const phase = transitionAvoidingPhase(perimeter, count, transitions);
    positions = Array.from({ length: count }, (_, i) => (phase + i * perimeter / count) % perimeter).sort((a,b)=>a-b);
  }
  if (positions.length < policyMinimum || positions.length * minimumBridge < perimeter * policy.minimumRetainedFraction - 1e-9) {
    return { ok: false, status: "REFUSED", reason: "TAB_RETAINED_LENGTH_BELOW_FIVE_PERCENT" };
  }
  const gaps = positions.map((v, i) => ((positions[(i+1)%positions.length] + (i+1===positions.length ? perimeter : 0)) - v));
  if (gaps.some((gap) => gap < minimumBridge - 1e-9)) {
    return { ok: false, status: "REFUSED", reason: "TAB_BRIDGES_OVERLAP" };
  }
  if (gaps.some((gap) => gap - minimumBridge > policy.maxAllowedGap_in + 1e-9)) {
    return { ok: false, status: "REFUSED", reason: "TAB_UNCUT_SPAN_EXCEEDS_24_IN" };
  }
  const candidates = positions.map((s, i) => {
    const point = pointAtArclength({ chord_in, rise_in, radius_in, straightHeight_in }, s);
    const distance = Math.min(...transitions.map(v=>cyclicDistance(s,v,perimeter)));
    return {
      index:i+1, arclength_in:round6(s), normalizedArclength:round6(s/perimeter),
      segment:point.segment, curved:point.curved, x_in:round6(point.x_in), y_in:round6(point.y_in),
      distanceToNearestTransition_in:round6(distance),
      bridgeWidthIn:minimumBridge
    };
  });
  // A chosen tab too close to an intersection or sharp transition is not silently repositioned.
  if (candidates.some(c=>c.distanceToNearestTransition_in < minimumBridge/2 - 1e-9)) {
    return { ok:false, status:"REFUSED", reason:"TAB_WITHIN_CORNER_OR_TRANSITION_KEEPOUT" };
  }
  return {
    ok:true, status:"REFERENCE_PLAN_READY", policyId:policy.id, evidenceClass:policy.evidenceClass,
    physicalRetentionStatus:policy.physicalRetentionStatus,
    placementMethod: tabMode === "CUSTOM" ? "CUSTOM_ARCLENGTH" : policy.placementMethod,
    tabMode, tabOrigin:policy.tabArclengthOrigin,
    requestedTabCount:requestedTabCount ?? null,
    referenceBaseCount:policy.referenceBaseCount, spacingRequiredCount:requiredForSpacing,
    planningReserveTabs:policy.planningReserveTabs,
    plannedTabCount:candidates.length,
    perimeter_in:round6(perimeter), arcLength_in:round6(geometry.arcLength_in),
    nominalSpacing_in:round6(perimeter/candidates.length),
    retainedLengthIn:round6(candidates.length*minimumBridge),
    retainedFraction:round6(candidates.length*minimumBridge/perimeter),
    maxUncutSpanIn:round6(Math.max(...gaps)-minimumBridge),
    minimumRetainedFraction:policy.minimumRetainedFraction,
    maxAllowedGap_in:policy.maxAllowedGap_in, minBridgeWidth_in:minimumBridge,
    minRemainingThickness_in:policy.minRemainingThickness_in,
    cornerKeepout_in:minimumBridge/2, transitionKeepout_in:minimumBridge/2,
    userVeto:policy.userVeto,candidates,
    physicalNote:"Geometric tab retention meets declared limits; actual holding force and remaining thickness are not measured."
  };
}

// A straight split along the aperture's vertical centerline turns the retained center into two pieces.
// Each piece keeps at least minTabsPerRetainedPiece tabs. Tabs within the keepout of the split line
// count for neither piece. Missing tabs are added at the middle of that piece's largest open stretch.
export function planSplitStencilTabs(plan, geometry) {
  if (!plan || !plan.ok) return plan;
  const keepout = STENCIL_TAB_POLICY_V0.splitCenterKeepoutIn;
  const need = STENCIL_TAB_POLICY_V0.minTabsPerRetainedPiece;
  const perimeter = plan.perimeter_in;
  const candidates = plan.candidates.map((tab) => ({ ...tab, addedForSplit: false }));
  const sideOf = (tab) => (tab.x_in > keepout ? "RIGHT" : tab.x_in < -keepout ? "LEFT" : "ON_SPLIT");
  // The split line meets the perimeter at the bottom center and at the arch apex.
  const bottomCenter = geometry.chord_in / 2;
  const apex = geometry.chord_in + geometry.straightHeight_in + plan.arcLength_in / 2;
  const sides = {
    RIGHT: [bottomCenter, apex],
    LEFT: [apex, perimeter + bottomCenter]
  };
  const added = [];
  for (const side of ["RIGHT", "LEFT"]) {
    let count=candidates.filter(tab=>sideOf(tab)===side).length;
    if(plan.tabMode==="CUSTOM" && count<need)
      return {...plan,ok:false,status:"REFUSED",reason:"CUSTOM_TAB_LOCATIONS_DO_NOT_RETAIN_EACH_HALF"};
    while (count < need) {
      const [start, end] = sides[side];
      const marks = [start, end, ...candidates
        .map((tab) => tab.arclength_in)
        .map((s) => (s < start ? s + perimeter : s))
        .filter((s) => s > start && s < end)].sort((a, b) => a - b);
      let best = { gap: -1, at: null };
      for (let i = 0; i + 1 < marks.length; i += 1) {
        const gap = marks[i + 1] - marks[i];
        if (gap > best.gap) best = { gap, at: marks[i] + gap / 2 };
      }
      const s = best.at % perimeter;
      const point = pointAtArclength(geometry, s);
      const tab = {
        index: candidates.length + 1,
        arclength_in: round6(s),
        normalizedArclength: round6(s / perimeter),
        segment: point.segment,
        curved: point.curved,
        x_in: round6(point.x_in),
        y_in: round6(point.y_in),
        distanceToNearestTransition_in: null,
        addedForSplit: true
      };
      candidates.push(tab);
      added.push(tab.index);
      count += 1;
    }
  }
  const tabsOnSide = (side) => candidates.filter((tab) => sideOf(tab) === side).length;
  return {
    ...plan,
    status: "REFERENCE_PLAN_READY",
    plannedTabCount: candidates.length,
    candidates,
    split: {
      line: "VERTICAL_CENTERLINE",
      minTabsPerRetainedPiece: need,
      keepout_in: keepout,
      leftPieceTabs: tabsOnSide("LEFT"),
      rightPieceTabs: tabsOnSide("RIGHT"),
      tabsOnSplitLine: tabsOnSide("ON_SPLIT"),
      addedForSplit: added
    }
  };
}
