/**
 * USER_DEFINED_BOARD_V1: one identified board job — material demand, identified parts and spot features,
 * one miter angle and plane, a Datum-C method — answered against matching Store boards.
 *
 * The grade is the customer's choice: when the wood is offered in more than one grade and none is named, the
 * answer is UNRESOLVED with GRADE_CHOICE_REQUIRED and the grades on offer. Store never picks a grade.
 *
 * Matching offered boards of that grade are considered in ascending stock length (then price, then SKU); the first whose
 * stock, price, D-001 capability and full travel evaluation are complete is selected. The requested parts,
 * angle and spot locations are never changed to make a candidate fit.
 */
import { matchingBoardOfferings, stockAnswer, priceAnswer, capabilityAnswer } from "../store-state.mjs";
import { estimateUserDefinedBoardTravel } from "../engine/pricing.mjs";

export function evaluateDimensionalTravelJob(catalog, demand = {}) {
  const parts = Array.isArray(demand.parts) ? demand.parts : [];
  const firstSpot = parts
    .flatMap((part) => Array.isArray(part?.features) ? part.features : [])
    .find((feature) => feature?.kind === "SPOT_ON_LOCATION") || null;

  const requiredOps = Array.isArray(demand.requiredOps) && demand.requiredOps.length
    ? [...demand.requiredOps]
    : ["MITER_LIMITED"];

  const materialDemand = {
    ...(demand.materialDemand || {}),
    definedWorkpieceLengthIn: demand.definedWorkpieceLengthIn
  };
  const grades = [...new Set(matchingBoardOfferings(catalog, { ...materialDemand, grade: null }).map((item) => item.grade))].sort();
  if (materialDemand.grade == null && grades.length > 1) {
    return {
      title: demand.title || "Dimensional travel job",
      stage: 2,
      store: "Store Zero",
      status: "UNRESOLVED",
      materialResolution: {
        status: "UNRESOLVED",
        reason: "GRADE_CHOICE_REQUIRED",
        offeredGrades: grades,
        requestedMinimumWorkpieceLengthIn: Number(demand.definedWorkpieceLengthIn),
        selectionPolicy: "SHORTEST_COMPLETE_STORE_OFFERING",
        consideredCandidates: []
      },
      estimate: null,
      calculationIdentity: null,
      not_claimed: ["commercial quote", "physical fabrication", "live motion"]
    };
  }
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
        datumCMethod: demand.datumCMethod || "REFERENCE_CUT",
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
