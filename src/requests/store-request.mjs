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
import { calculationHash, evaluateDefinition } from "../evaluation/engine/store-manufacturing-core.mjs";
import {loadMachineConfig,machineConfigHash} from "../machine/configuration.mjs";
import { loadCatalog, loadObservations, validateCatalog } from "../evaluation/catalog.mjs";
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

const authority = () => {
  const registered=loadMachineConfig();
  return {manufacturingModel:{id:registered.model.id,hash:calculationHash(registered.model)},
    machineConfiguration:{id:registered.machineConfigId,hash:machineConfigHash(registered)}};
};
export const REQUEST_TYPES=Object.freeze({
  USER_DEFINED_BOARD_V1:Object.freeze({shape:DEFINITION_SHAPES.USER_DEFINED_BOARD_V1}),
  CUT_PACKAGE_V1:Object.freeze({shape:DEFINITION_SHAPES.CUT_PACKAGE_V1}),
  SHEET_PACKAGE_V1:Object.freeze({shape:DEFINITION_SHAPES.SHEET_PACKAGE_V1}),
  OFFERING_LOOKUP:Object.freeze({lookup:true})
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
  const extra = Object.keys(request).filter((k) => !["requestType", "requestId", "demand", "manifest"].includes(k));
  if (extra.length) return { status: "REFUSED", reasonCodes: extra.map((k) => `REQUEST_FIELD_NOT_DECLARED:${k}`) };
  const type = REQUEST_TYPES[request.requestType];
  if (!type || !Object.hasOwn(REQUEST_TYPES, request.requestType)) return { status: "REFUSED", reasonCodes: ["REQUEST_TYPE_NOT_ACCEPTED"] };
  if (typeof request.requestId !== "string" || !request.requestId.trim()) return { status: "UNRESOLVED", reasonCodes: ["STORE_EVALUATION_REQUEST_ID_REQUIRED"] };
  const demand = request.demand;
  if (type.lookup) {
    if (request.manifest !== undefined) return {status:"REFUSED",reasonCodes:["DISCOVERY_MANIFEST_NOT_ACCEPTED"]};
    const problems = lookupProblems(demand);
    return problems.length ? { status: "REFUSED", reasonCodes: problems } : null;
  }
  if (!demand || typeof demand !== "object" || Array.isArray(demand)) return { status: "UNRESOLVED", reasonCodes: ["DEFINITION_REQUIRED"] };
  const machineLocal = Object.keys(demand).filter((k) => MACHINE_LOCAL_LANGUAGE.includes(k));
  if (machineLocal.length) return { status: "REFUSED", reasonCodes: ["MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED"] };
  if (!request.manifest || typeof request.manifest !== "object" || Array.isArray(request.manifest)) return {status:"UNRESOLVED",reasonCodes:["INDEPENDENT_SYSTEM_MANIFEST_REQUIRED"]};
  const reasonCodes = shapeProblems(demand, type.shape);
  return reasonCodes.length ? { status: "REFUSED", reasonCodes } : null;
}

/** The catalog identity every receipt and lookup names, and /health reports: one rule. */
export const catalogHash = (catalog) => calculationHash(catalog);

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
    // Discovery carries no receipt (it prices no job), but it names the catalog its offerings and prices came from.
    const answer = lookupOfferings(currentCatalog, observations ?? loadObservations(), request.demand);
    return { requestType: request.requestType, requestId: request.requestId, storeRelease: release, catalogHash: catalogHash(currentCatalog), evaluatedAt, ...answer };
  }

  // Deliberately evaluate every request; no prior answer or receipt is an argument here.
  const registered=loadMachineConfig();
  const evaluation = evaluateDefinition(currentCatalog, {requestType:request.requestType,requestId:request.requestId,demand:request.demand}, request.manifest, registered.model);
  const receiptCore = {
    freshnessRule: STORE_EVALUATION_FRESHNESS.id,
    requestType: request.requestType,
    requestId: request.requestId,
    evaluatedAt,
    authority: { storeRevision: release, catalogHash: catalogHash(currentCatalog), ...authority() },
    demandHash: calculationHash(request.demand),
    manifestHash: calculationHash(request.manifest),
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
