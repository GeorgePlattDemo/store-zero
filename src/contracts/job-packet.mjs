/**
 * The accepted job packet: the one object that connects a customer's accepted job to the machine side.
 *
 * System produces it when the customer accepts an offer. It carries the exact definition revision, the Store
 * answer that was presented, and the decision. The machine side reads it directly and nothing in it is retyped.
 *
 *   {
 *     schema: "STB-ACCEPTED-JOB-PACKET-1",
 *     packetId,
 *     project:    { projectId, classId, title },
 *     definition: { definitionId, revisionId, requestType, demand, requirements: { endRelation, lengthDatum, endIdentity } },
 *     storeAnswer: <the answer evaluateStoreRequest gave for { requestType, requestId, demand }>,
 *     decision:   { decisionId, kind: "ACCEPTED", offerId, decidedAt, evidenceClass: "SIMULATED" },
 *     authority:  { physicalRelease: false, evidenceClass: "SIMULATED" }
 *   }
 *
 * `definition.demand` is the definition the Store evaluated; `definition.requirements` are System facts the
 * Store does not evaluate but the machine side must carry (end relation, length datum, end identity).
 * Only an accepted decision makes a packet; a decline, deferral or revision request does not.
 */
import { calculationHash } from "../evaluation/engine/d001-travel-standard.mjs";
import { evaluateStoreRequest } from "../requests/store-request.mjs";
import { shapeProblems } from "./shape.mjs";

export const JOB_PACKET_SCHEMA = "STB-ACCEPTED-JOB-PACKET-1";

export const JOB_PACKET_SHAPE = Object.freeze({
  object: {
    schema: { enum: [JOB_PACKET_SCHEMA], code: "PACKET_SCHEMA_NOT_ACCEPTED" },
    packetId: "string",
    project: { object: { projectId: "string", classId: "string", title: "string" } },
    definition: {
      object: {
        definitionId: "string",
        revisionId: "string",
        requestType: "string",
        demand: { any: true },
        requirements: { object: { endRelation: "string", lengthDatum: "string", endIdentity: "string" } }
      }
    },
    storeAnswer: { any: true },
    decision: {
      object: {
        decisionId: "string",
        kind: { enum: ["ACCEPTED"], code: "PACKET_REQUIRES_ACCEPTED_DECISION" },
        offerId: "string",
        decidedAt: "string",
        evidenceClass: { enum: ["SIMULATED"], code: "PACKET_DECISION_MUST_BE_SIMULATED" }
      }
    },
    authority: {
      object: {
        physicalRelease: { enum: [false], code: "PHYSICAL_RELEASE_NOT_AVAILABLE" },
        evidenceClass: { enum: ["SIMULATED"], code: "PACKET_AUTHORITY_MUST_BE_SIMULATED" }
      }
    }
  }
});

const REQUIRED = [
  ["schema"], ["packetId"], ["project", "projectId"], ["project", "classId"],
  ["definition", "definitionId"], ["definition", "revisionId"], ["definition", "requestType"], ["definition", "demand"],
  ["storeAnswer"], ["decision", "decisionId"], ["decision", "kind"], ["decision", "offerId"], ["decision", "decidedAt"],
  ["decision", "evidenceClass"], ["authority", "physicalRelease"], ["authority", "evidenceClass"]
];

const at = (value, path) => path.reduce((v, key) => (v == null ? undefined : v[key]), value);

/** Shape and required fields of a packet; empty when it is a well-formed accepted packet. */
export function packetProblems(packet) {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) return ["PACKET_MUST_BE_AN_OBJECT"];
  const missing = REQUIRED.filter((path) => at(packet, path) == null).map((path) => `PACKET_FIELD_REQUIRED:${path.join(".")}`);
  return [...missing, ...shapeProblems(packet, JOB_PACKET_SHAPE, "PACKET")];
}

// A packet is a saved file: compare answers as they serialize, so a field that does not survive JSON
// (an undefined value) never makes an intact packet look altered.
const answerIdentity = (answer) => {
  const { evaluationReceipt, ...rest } = answer;
  return calculationHash(JSON.parse(JSON.stringify(rest)));
};

/**
 * Whether this packet may be acted on, checked against this Store. Answers
 *   { status: "VERIFIED" }                         the packet is intact and its Store answer is still current
 *   { status: "REFUSED", reasonCodes }             the packet is malformed, altered, or names another Store
 *   { status: "STALE", reasonCodes }               intact, but this Store would now answer differently: re-quote
 * `release` is the Store release the packet must name; `catalog` defaults to the catalog on disk.
 */
export function verifyJobPacket(packet, { release, catalog, now } = {}) {
  const problems = packetProblems(packet);
  if (problems.length) return { status: "REFUSED", reasonCodes: problems };

  const { definition, storeAnswer: answer } = packet;
  const refuse = (...reasonCodes) => ({ status: "REFUSED", reasonCodes });
  if (!answer || typeof answer !== "object") return refuse("PACKET_STORE_ANSWER_REQUIRED");
  if (answer.requestType !== definition.requestType) return refuse("PACKET_ANSWER_REQUEST_TYPE_MISMATCH");
  if (answer.status !== "SUPPORTABLE") return refuse("PACKET_ANSWER_NOT_SUPPORTABLE");
  const receipt = answer.evaluationReceipt;
  if (answer.freshEvaluation !== true || !receipt || typeof receipt !== "object") return refuse("PACKET_ANSWER_HAS_NO_RECEIPT");

  const { receiptHash, ...receiptCore } = receipt;
  if (calculationHash(receiptCore) !== receiptHash) return refuse("PACKET_RECEIPT_ALTERED");
  if (receipt.requestId !== answer.requestId || receipt.requestType !== answer.requestType) return refuse("PACKET_RECEIPT_ALTERED");
  if (calculationHash(answer.calculationIdentity ?? null) !== calculationHash(receipt.calculationIdentity ?? null)) return refuse("PACKET_ANSWER_ALTERED");
  if (receipt.demandHash !== calculationHash(definition.demand)) return refuse("PACKET_DEMAND_CHANGED");
  if (receipt.authority?.storeRevision !== release) return refuse("PACKET_STORE_RELEASE_MISMATCH");

  // The answer in the packet must be exactly what this Store answers for this definition now.
  const current = evaluateStoreRequest(
    { requestType: definition.requestType, requestId: answer.requestId, demand: definition.demand },
    { release, catalog, now }
  );
  if (current.freshEvaluation !== true) return refuse(...(current.reasonCodes ?? ["PACKET_DEFINITION_NOT_EVALUATED"]));
  if (answerIdentity(current) !== answerIdentity(answer)) {
    return { status: "STALE", reasonCodes: ["PACKET_STORE_ANSWER_NOT_CURRENT"] };
  }
  return { status: "VERIFIED", reasonCodes: [] };
}
