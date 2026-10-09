/**
 * USER_DEFINED_BOARD_V1: one identified board job — material demand, identified parts and spot features,
 * one miter angle and plane, a Datum-C method — answered against matching Store boards.
 *
 * Nothing the definition leaves out is filled in. A missing miter angle, cut plane, Datum-C method or operation
 * list is UNRESOLVED with its reason, and the declared operations must agree with the work the parts define (a
 * spot needs SPOT_ON_LOCATION, an angled cut needs MITER_LIMITED, and neither is declared without its work).
 *
 * The end geometry is stated too. The travel model prices parallel ends with the length on the long-long outer edge
 * (PRICED_BOARD_GEOMETRY); a missing relation or datum is asked for, and any other geometry, or an end identity the
 * datum does not already say, is refused rather than priced as if it were parallel.
 *
 * The grade is the customer's choice: when the wood is offered in more than one grade and none is named, the
 * answer is UNRESOLVED with GRADE_CHOICE_REQUIRED and the grades on offer. Store never picks a grade.
 *
 * Matching offered boards of that grade are considered in ascending stock length (then price, then SKU); the first whose
 * stock, price, D-001 capability and full travel evaluation are complete is selected. The requested parts,
 * angle and spot locations are never changed to make a candidate fit.
 */
import { statedNumber } from "../stated-number.mjs";
import { matchingBoardOfferings, stockAnswer, priceAnswer, capabilityAnswer } from "../store-state.mjs";
import { estimateUserDefinedBoardTravel } from "../engine/pricing.mjs";

export const PRICED_BOARD_GEOMETRY = Object.freeze({ endRelation: "parallel", lengthDatum: "long-long-outer-edge" });

export function evaluateDimensionalTravelJob(catalog, demand = {}) {
  const parts = Array.isArray(demand.parts) ? demand.parts : [];
  const firstSpot = parts
    .flatMap((part) => Array.isArray(part?.features) ? part.features : [])
    .find((feature) => feature?.kind === "SPOT_ON_LOCATION") || null;

  const requiredOps = Array.isArray(demand.requiredOps) ? [...demand.requiredOps] : [];

  const materialDemand = {
    ...(demand.materialDemand || {}),
    definedWorkpieceLengthIn: demand.definedWorkpieceLengthIn
  };
  const notSupplied = (value) => (typeof value === "string" ? value.trim() === "" : value == null);
  const definitionGap = definitionProblem(demand, parts, requiredOps, notSupplied);
  if (definitionGap) return definitionAnswer(demand, definitionGap);
  const geometry = geometryProblem(demand, notSupplied);
  if (geometry) return definitionAnswer(demand, geometry.reason, {}, geometry.status);

  const grades = [...new Set(matchingBoardOfferings(catalog, { ...materialDemand, grade: null }).map((item) => item.grade))].sort();
  if (materialDemand.grade == null && grades.length > 1) return definitionAnswer(demand, "GRADE_CHOICE_REQUIRED", { offeredGrades: grades });
  const candidates = matchingBoardOfferings(catalog, materialDemand);
  const candidateEvaluations = [];
  let firstIncompleteEstimate = null;

  for (const item of candidates) {
    const candidateWorkpieceLengthIn = Number(item.stockL_in);
    const stock = stockAnswer(item, 1, catalog.clock);
    const price = priceAnswer(item, catalog.clock);
    const capability = capabilityAnswer(item, requiredOps, {
      keptLengthIn: candidateWorkpieceLengthIn,
      sawAngleDeg: demand.sawAngleDeg,
      cutPlane: demand.cutPlane,
      spotDemand: firstSpot
        ? {
            required: true,
            mode: "SPOT_ON_LOCATION",
            locationRule: "CENTERED_ON_PART",
            locationAlongLengthIn: firstSpot.xIn,
            acrossWidthRule: firstSpot.acrossWidthRule
          }
        : null
    });

    let estimate = null;
    let candidateStatus = "UNAVAILABLE";
    let reason = stock.sufficient === true ? null : stock.status;

    if (stock.sufficient === true && price.status !== "UNRESOLVED" && capability.status === "SUPPORTABLE") {
      estimate = estimateUserDefinedBoardTravel(catalog, {
        title: demand.title || "Dimensional travel job",
        classId: demand.classId || "user_defined_board",
        configurationId: demand.configurationId,
        configurationVersion: demand.configurationVersion,
        storeSku: item.storeSku,
        definedWorkpieceLengthIn: candidateWorkpieceLengthIn,
        sawAngleDeg: demand.sawAngleDeg,
        cutPlane: demand.cutPlane,
        datumCMethod: demand.datumCMethod,
        parts,
        declaredSawCuts: demand.declaredSawCuts,
        declaredSpotCount: demand.declaredSpotCount,
        unresolvedConditions: demand.unresolvedConditions || [],
        storeRevision: demand.storeRevision || null
      });
      candidateStatus = estimate.complete
        ? "SUPPORTABLE"
        : estimate.status === "REFUSED"
          ? "REFUSED"
          : "UNRESOLVED";
      reason = estimate.complete
        ? null
        : estimate.reason ||
          (Array.isArray(estimate.reasons) ? estimate.reasons[0] : null) ||
          (Array.isArray(estimate.unresolved) ? estimate.unresolved[0] : null) ||
          candidateStatus;
      if (estimate.complete !== true && firstIncompleteEstimate === null) {
        firstIncompleteEstimate = estimate;
      }
    } else if (price.status === "UNRESOLVED" || capability.status === "UNRESOLVED") {
      candidateStatus = "UNRESOLVED";
      reason = price.reason || capability.unresolved?.[0] || "CANDIDATE_INPUT_UNRESOLVED";
    } else if (capability.status === "REFUSED") {
      candidateStatus = "REFUSED";
      reason = capability.missing?.[0] || capability.reason || "CANDIDATE_CAPABILITY_REFUSED";
    }

    const trace = {
      storeSku: item.storeSku,
      stockLengthIn: candidateWorkpieceLengthIn,
      candidateStatus,
      reason,
      stockStatus: stock.status,
      priceStatus: price.status,
      capabilityStatus: capability.status
    };
    candidateEvaluations.push(trace);

    if (estimate?.complete === true) {
      return {
        title: demand.title || "Dimensional travel job",
        stage: 2,
        store: "Store Zero",
        status: "SUPPORTABLE",
        lines: [{
          storeSku: item.storeSku,
          description: item.description,
          qty: 1,
          stock,
          price,
          capability
        }],
        materialResolution: {
          status: "MAPPED",
          storeSku: item.storeSku,
          pricingReferenceSku: item.storeSku,
          pricingReferenceStockLengthIn: item.stockL_in,
          allocationClaimed: false,
          requestedMinimumWorkpieceLengthIn: Number(demand.definedWorkpieceLengthIn),
          workpieceLengthIn: candidateWorkpieceLengthIn,
          selectionPolicy: "SHORTEST_COMPLETE_STORE_OFFERING",
          consideredCandidates: candidateEvaluations
        },
        estimate,
        calculationIdentity: estimate.calculationIdentity || null,
        not_claimed: ["commercial quote", "physical fabrication", "live motion", "measured machine performance"]
      };
    }
  }

  const status = candidateEvaluations.length === 0
    ? "UNAVAILABLE"
    : candidateEvaluations.some((entry) => entry.candidateStatus === "UNRESOLVED")
      ? "UNRESOLVED"
      : candidateEvaluations.some((entry) => entry.candidateStatus === "REFUSED")
        ? "REFUSED"
        : "UNAVAILABLE";
  const reason = candidateEvaluations.length === 0
    ? "NO_MATCHING_BOARD_OFFERING"
    : status === "REFUSED"
      ? "NO_COMPLETE_DIMENSIONAL_CANDIDATE"
      : status === "UNRESOLVED"
        ? "DIMENSIONAL_CANDIDATE_UNRESOLVED"
        : "MATCHING_BOARD_NOT_AVAILABLE";

  return {
    title: demand.title || "Dimensional travel job",
    stage: 2,
    store: "Store Zero",
    status,
    materialResolution: {
      status,
      reason,
      requestedMinimumWorkpieceLengthIn: Number(demand.definedWorkpieceLengthIn),
      selectionPolicy: "SHORTEST_COMPLETE_STORE_OFFERING",
      consideredCandidates: candidateEvaluations
    },
    estimate: firstIncompleteEstimate,
    calculationIdentity: null,
    not_claimed: ["commercial quote", "physical fabrication", "live motion"]
  };
}

// The first fact the definition is missing or contradicts, or null when it states everything this path reads.
function definitionProblem(demand, parts, requiredOps, notSupplied) {
  if (!Number.isFinite(statedNumber(demand.sawAngleDeg))) return "MITER_ANGLE_REQUIRED";
  if (notSupplied(demand.cutPlane)) return "CUT_PLANE_REQUIRED";
  if (notSupplied(demand.datumCMethod)) return "DATUM_C_ESTABLISHMENT_METHOD_REQUIRED";
  if (!requiredOps.length) return "REQUIRED_OPERATIONS_REQUIRED";
  const hasSpots = parts.some((part) => (Array.isArray(part?.features) ? part.features : []).some((f) => f?.kind === "SPOT_ON_LOCATION"));
  if (hasSpots !== requiredOps.includes("SPOT_ON_LOCATION")) return "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:SPOT_ON_LOCATION";
  const angled = Number(demand.sawAngleDeg) !== 0;
  if (angled && !requiredOps.includes("MITER_LIMITED")) return "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:MITER_LIMITED";
  if (!requiredOps.includes("MITER_LIMITED") && !requiredOps.includes("CROSSCUT")) return "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:CROSSCUT";
  return null;
}

// Missing end geometry is asked for; geometry the travel model does not price is refused.
function geometryProblem(demand, notSupplied) {
  if (notSupplied(demand.endRelation)) return { status: "UNRESOLVED", reason: "END_RELATION_REQUIRED" };
  if (notSupplied(demand.lengthDatum)) return { status: "UNRESOLVED", reason: "LENGTH_DATUM_REQUIRED" };
  if (demand.endRelation !== PRICED_BOARD_GEOMETRY.endRelation) return { status: "REFUSED", reason: `END_RELATION_NOT_PRICED:${demand.endRelation}` };
  if (demand.lengthDatum !== PRICED_BOARD_GEOMETRY.lengthDatum) return { status: "REFUSED", reason: `LENGTH_DATUM_NOT_PRICED:${demand.lengthDatum}` };
  if (demand.endIdentity != null) return { status: "REFUSED", reason: "END_IDENTITY_NOT_PRICED" };
  return null;
}

function definitionAnswer(demand, reason, extra = {}, status = "UNRESOLVED") {
  return {
    title: demand.title || "Dimensional travel job",
    stage: 2,
    store: "Store Zero",
    status,
    materialResolution: {
      status,
      reason,
      ...extra,
      requestedMinimumWorkpieceLengthIn: Number(demand.definedWorkpieceLengthIn),
      selectionPolicy: "SHORTEST_COMPLETE_STORE_OFFERING",
      consideredCandidates: []
    },
    estimate: null,
    calculationIdentity: null,
    not_claimed: ["commercial quote", "physical fabrication", "live motion"]
  };
}
