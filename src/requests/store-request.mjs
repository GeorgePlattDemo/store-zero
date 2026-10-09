/**
 * The one way into Store Zero: a request names its type, its identity, and a clean definition.
 *
 *   { requestType, requestId, demand }
 *
 * Every accepted request is evaluated fresh against the catalog read for that request; no prior answer or
 * receipt is an input. A request that is not a clean definition is answered with the reason and never reaches
 * an evaluator: an undeclared request type, an undeclared or mistyped definition field, or machine-local
 * language. "No" is an answer.
 *
 * Store identity is the Store's own release, supplied by whoever runs this Store; a request cannot set it.
 */
import { calculationHash, D001_TRAVEL_STANDARD } from "../evaluation/engine/d001-travel-standard.mjs";
import { D001_STAGE2_ENVELOPE } from "../evaluation/envelopes/d001-stage2-envelope.mjs";
import { S001_STAGE2_ENVELOPE } from "../evaluation/envelopes/s001-stage2-envelope.mjs";
import { STENCIL_TAB_POLICY_V0 } from "../evaluation/engine/stencil-tab-policy.mjs";
import { loadCatalog, loadObservations, validateCatalog } from "../evaluation/catalog.mjs";
import { evaluateDimensionalTravelJob } from "../evaluation/evaluators/user-defined-board.mjs";
import { CUT_PACKAGE_STANDARD, evaluateCutPackageJob } from "../evaluation/evaluators/cut-package.mjs";
import { SHEET_PACKAGE_STANDARD, evaluateSheetPackageJob } from "../evaluation/evaluators/sheet-package.mjs";
import { lookupOfferings, lookupProblems } from "./offering-lookup.mjs";
import { DEFINITION_SHAPES } from "../contracts/definitions.mjs";
import { shapeProblems } from "../contracts/shape.mjs";

export const STORE_EVALUATION_FRESHNESS = Object.freeze({
  id: "STB-STORE-FRESH-EVALUATION-0.1",
  rule: "EVERY_STORE_REQUEST_REEVALUATES_CURRENT_STORE_STATE",
  priorAnswerMayAuthorizeNewRequest: false,
  priorReceiptMayAuthorizeNewRequest: false
});

// Machine-local language belongs to the machine, never to a project definition.
export const MACHINE_LOCAL_LANGUAGE = Object.freeze(["spline", "toolpath", "gcode", "controller", "servoSteps"]);

const authorityOf = (thing, withVersion = false) => ({
  id: thing.id,
  ...(withVersion ? { version: thing.version } : {}),
  hash: calculationHash(thing)
});

// Each accepted request type: the exact definition shape it accepts (src/contracts/definitions.mjs), the
// evaluator that answers it, and the Store facts the receipt names as the basis of the answer.
export const REQUEST_TYPES = Object.freeze({
  USER_DEFINED_BOARD_V1: Object.freeze({
    shape: DEFINITION_SHAPES.USER_DEFINED_BOARD_V1,
    evaluate: evaluateDimensionalTravelJob,
    authority: () => ({
      machineEnvelope: authorityOf(D001_STAGE2_ENVELOPE),
      travelStandard: authorityOf(D001_TRAVEL_STANDARD, true),
      economics: authorityOf(D001_TRAVEL_STANDARD.economics, true)
    })
  }),
  CUT_PACKAGE_V1: Object.freeze({
    shape: DEFINITION_SHAPES.CUT_PACKAGE_V1,
    evaluate: evaluateCutPackageJob,
    authority: () => ({
      machineEnvelope: authorityOf(D001_STAGE2_ENVELOPE),
      travelStandard: authorityOf(D001_TRAVEL_STANDARD, true),
      cutPackageStandard: authorityOf(CUT_PACKAGE_STANDARD)
    })
  }),
  SHEET_PACKAGE_V1: Object.freeze({
    shape: DEFINITION_SHAPES.SHEET_PACKAGE_V1,
    evaluate: evaluateSheetPackageJob,
    authority: () => ({
      machineEnvelope: authorityOf(S001_STAGE2_ENVELOPE),
      tabPolicy: authorityOf(STENCIL_TAB_POLICY_V0),
      economics: authorityOf(D001_TRAVEL_STANDARD.economics),
      sheetPackageStandard: authorityOf(SHEET_PACKAGE_STANDARD)
    })
  }),
  OFFERING_LOOKUP: Object.freeze({ lookup: true })
});

function notEvaluated(request, status, reasonCodes) {
  return {
    requestType: typeof request?.requestType === "string" ? request.requestType : null,
    requestId: typeof request?.requestId === "string" ? request.requestId : null,
    status,
    complete: false,
    freshEvaluation: false,
    reasonCodes,
    calculationIdentity: null,
    evaluationReceipt: null
  };
}

/** Why this request is not a clean definition for its type ({ status, reasonCodes }), or null when it is. */
export function requestProblems(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) return { status: "REFUSED", reasonCodes: ["REQUEST_MUST_BE_AN_OBJECT"] };
  const extra = Object.keys(request).filter((k) => !["requestType", "requestId", "demand"].includes(k));
  if (extra.length) return { status: "REFUSED", reasonCodes: extra.map((k) => `REQUEST_FIELD_NOT_DECLARED:${k}`) };
  const type = REQUEST_TYPES[request.requestType];
  if (!type || !Object.hasOwn(REQUEST_TYPES, request.requestType)) return { status: "REFUSED", reasonCodes: ["REQUEST_TYPE_NOT_ACCEPTED"] };
  if (typeof request.requestId !== "string" || !request.requestId.trim()) return { status: "UNRESOLVED", reasonCodes: ["STORE_EVALUATION_REQUEST_ID_REQUIRED"] };
  const demand = request.demand;
  if (type.lookup) {
    const problems = lookupProblems(demand);
    return problems.length ? { status: "REFUSED", reasonCodes: problems } : null;
  }
  if (!demand || typeof demand !== "object" || Array.isArray(demand)) return { status: "UNRESOLVED", reasonCodes: ["DEFINITION_REQUIRED"] };
  const machineLocal = Object.keys(demand).filter((k) => MACHINE_LOCAL_LANGUAGE.includes(k));
  if (machineLocal.length) return { status: "REFUSED", reasonCodes: ["MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED"] };
  const reasonCodes = shapeProblems(demand, type.shape);
  return reasonCodes.length ? { status: "REFUSED", reasonCodes } : null;
}

/**
 * Answers one request. `release` is this Store's release identity (required); `catalog` and `observations`
 * default to the data on disk, read for this request; `now` is the evaluation clock.
 */
export function evaluateStoreRequest(request, { release, catalog, observations, now = () => new Date().toISOString() } = {}) {
  if (typeof release !== "string" || !release.trim()) throw new Error("evaluateStoreRequest needs this Store's release identity");
  const problem = requestProblems(request);
  if (problem) return notEvaluated(request, problem.status, problem.reasonCodes);

  const type = REQUEST_TYPES[request.requestType];
  // A supplied catalog is held to the same rules as the one on disk.
  const currentCatalog = catalog ? validateCatalog(catalog) : loadCatalog();
  const evaluatedAt = now();
  if (type.lookup) {
    const answer = lookupOfferings(currentCatalog, observations ?? loadObservations(), request.demand);
    return { requestType: request.requestType, requestId: request.requestId, storeRelease: release, evaluatedAt, ...answer };
  }

  // Deliberately evaluate every request; no prior answer or receipt is an argument here.
  const evaluation = type.evaluate(currentCatalog, { ...request.demand, storeRevision: release });
  const receiptCore = {
    freshnessRule: STORE_EVALUATION_FRESHNESS.id,
    requestType: request.requestType,
    requestId: request.requestId,
    evaluatedAt,
    authority: { storeRevision: release, catalogHash: calculationHash(currentCatalog), ...type.authority() },
    demandHash: calculationHash(request.demand),
    status: evaluation.status,
    calculationIdentity: evaluation.calculationIdentity || null
  };
  return {
    requestType: request.requestType,
    requestId: request.requestId,
    ...evaluation,
    freshEvaluation: true,
    evaluationReceipt: Object.freeze({ ...receiptCore, receiptHash: calculationHash(receiptCore) })
  };
}
