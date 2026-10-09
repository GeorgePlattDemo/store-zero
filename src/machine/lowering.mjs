/**
 * Machine-local lowering for the D-001 reference cell: an accepted job packet in, a local job and its virtual
 * motion records out. This is the machine side of the Store boundary (specification §10): it never changes
 * what was accepted. Every operation comes from the Store's operation plan in the packet; every command traces
 * to one of those operations or to a named machine allowance; every machine fact comes from the registered
 * machine configuration (data/machine/); the board's actual dimensions come from the Store-selected offering.
 *
 * Nothing here issues physical motion. Commands are virtual records for the reference model only.
 */
import { loadMachineConfig, machineConfigHash, machineConfigProblems, registeredMachineProblems } from "./configuration.mjs";
import { localJobProblems, localJobContentHash, motionContentHash } from "../contracts/machine-records.mjs";
import { BOARD_END_GEOMETRY, D001_TRAVEL_STANDARD, calculationHash, spotPointLengthIn as storeSpotPointLengthIn } from "../evaluation/engine/d001-travel-standard.mjs";
import { findSku, loadCatalog } from "../evaluation/catalog.mjs";
import { verifyJobPacket } from "../contracts/job-packet.mjs";

export { loadMachineConfig } from "./configuration.mjs";

export const LOCAL_JOB_SCHEMA = "STB-LOCAL-JOB-2";
export const MOTION_RECORDS_SCHEMA = "STB-MOTION-RECORDS-2";
const LOWERED_KINDS = new Set(["REFERENCE_CUT", "INDEX", "SPOT_ON_LOCATION", "MITER_CUTOFF", "REBASE_DATUM_C"]);
// The registered tool, read through the Store's own drill-point formula: one formula for plan and lowering.
const spotPointLengthIn = (tool) => storeSpotPointLengthIn({ toolDiameterIn: tool.diameterIn, pointAngleDeg: tool.pointAngleDeg });

// This lowerer implements one reference cut, all spots, then index/cut/rebase for each part.
// A well-typed local job still needs that ordering and the declared station transforms.
function planProblems(job, machine) {
  const problems = [];
  // The Store rounds operands independently to six decimals; allow their combined rounding error.
  const close = (a, b) => Math.abs(a - b) <= 2e-6;
  let c = 0;
  let remaining = job.selectedMaterial.parentLengthIn - job.kerfIn;
  let phase = "SPOTS";
  for (let i = 1; i < job.operations.length;) {
    const index = job.operations[i];
    const op = job.operations[i + 1];
    if (index?.kind !== "INDEX" || !op || !["SPOT_ON_LOCATION", "MITER_CUTOFF"].includes(op.kind)) return ["LOCAL_JOB_OPERATION_ORDER_INVALID"];
    if (!close(index.fromCIn, c) || !close(index.distanceIn, Math.abs(index.toCIn - c))) problems.push("LOCAL_JOB_INDEX_GEOMETRY_INVALID");
    c = index.toCIn;
    if (op.kind === "SPOT_ON_LOCATION") {
      if (phase !== "SPOTS") problems.push("LOCAL_JOB_OPERATION_ORDER_INVALID");
      if (op.stationId !== machine.stations.spot.id || !close(c + op.workpieceFeatureXIn, machine.stations.spot.xIn)) problems.push("LOCAL_JOB_SPOT_TRANSFORM_INVALID");
      if (!close(op.plungeIn, spotPointLengthIn(machine.tooling.spot) + op.fullDiameterDepthIn) || op.fullDiameterDepthIn !== D001_TRAVEL_STANDARD.spot.fullDiameterDepthIn) problems.push("SPOT_TOOL_DIFFERS_FROM_STORE_PLAN");
      i += 2;
    } else {
      phase = "CUTS";
      if (op.stationId !== machine.stations.saw.id || !close(c + op.partLengthIn, machine.stations.saw.xIn)) problems.push("LOCAL_JOB_CUTOFF_TRANSFORM_INVALID");
      remaining -= op.partLengthIn + job.kerfIn;
      if (!close(remaining, op.retainedAfterIn)) problems.push("LOCAL_JOB_RETAINED_LENGTH_INVALID");
      const rebase = job.operations[i + 2];
      if (rebase?.kind !== "REBASE_DATUM_C" || rebase.stationId !== machine.stations.saw.id) return ["LOCAL_JOB_OPERATION_ORDER_INVALID"];
      c = 0;
      i += 3;
    }
  }
  if (phase !== "CUTS" || job.operations[0].stationId !== machine.stations.saw.id) problems.push("LOCAL_JOB_OPERATION_ORDER_INVALID");
  return problems;
}

/**
 * Lowers a packet to a local job for this machine. Answers { status: "LOWERED", localJob } or
 * { status: "REFUSED" | "STALE", reasonCodes } — a packet is lowered only after it verifies against this Store.
 */
export function lowerJobPacket(packet, { release, catalog, now, machine = loadMachineConfig() } = {}) {
  const verified = verifyJobPacket(packet, { release, catalog, now });
  if (verified.status !== "VERIFIED") return verified;
  const refuse = (...reasonCodes) => ({ status: "REFUSED", reasonCodes });

  const configProblems = machineConfigProblems(machine);
  if (configProblems.length) return refuse(...configProblems);
  const { definition, storeAnswer: answer } = packet;
  if (definition.requestType !== "USER_DEFINED_BOARD_V1") return refuse(`LOWERING_NOT_REGISTERED_FOR:${definition.requestType}`);
  // The geometry this lowerer implements is the travel model's (BOARD_END_GEOMETRY); nothing else is lowered.
  if (definition.requirements.endRelation !== BOARD_END_GEOMETRY.endRelation) return refuse("END_RELATION_NOT_REGISTERED_ON_MACHINE");
  if (definition.requirements.lengthDatum !== BOARD_END_GEOMETRY.lengthDatum) return refuse("LENGTH_DATUM_NOT_REGISTERED_ON_MACHINE");
  if ((definition.requirements.endIdentity ?? null) !== BOARD_END_GEOMETRY.endIdentity) return refuse("END_IDENTITY_NOT_REGISTERED_ON_MACHINE");
  const plan = answer.estimate?.travel?.operationPlan;
  if (!Array.isArray(plan) || !plan.length) return refuse("STORE_OPERATION_PLAN_REQUIRED");
  const unknown = [...new Set(plan.filter((op) => !LOWERED_KINDS.has(op.kind)).map((op) => op.kind))];
  if (unknown.length) return refuse(...unknown.map((kind) => `OPERATION_NOT_REGISTERED_ON_MACHINE:${kind}`));

  // The board is the Store-selected offering, read from the catalog the packet was just verified against.
  const item = findSku(catalog ?? loadCatalog(), answer.materialResolution?.storeSku);
  if (!item || item.form !== "board") return refuse("SELECTED_BOARD_NOT_IN_CATALOG");
  const parentLengthIn = answer.materialResolution.workpieceLengthIn;

  // Machine facts must agree with the facts the Store planned with, or the plan is not this machine's.
  const kerfs = [...new Set(plan.filter((op) => op.kerfIn != null).map((op) => op.kerfIn))];
  if (kerfs.length !== 1) return refuse("BLADE_KERF_NOT_STATED_BY_STORE_PLAN");
  const kerfIn = kerfs[0];
  if (machine.stations.saw.xIn !== D001_TRAVEL_STANDARD.stations.sawMiter.xIn || machine.stations.spot.xIn !== D001_TRAVEL_STANDARD.stations.spotFace.xIn) return refuse("STATION_TRANSFORM_DIFFERS_FROM_STORE_PLAN");
  const pointIn = spotPointLengthIn(machine.tooling.spot);
  for (const op of plan.filter((o) => o.kind === "SPOT_ON_LOCATION")) {
    if (machine.tooling.spot.diameterIn !== D001_TRAVEL_STANDARD.spot.toolDiameterIn || machine.tooling.spot.pointAngleDeg !== D001_TRAVEL_STANDARD.spot.pointAngleDeg || Math.abs(pointIn + op.fullDiameterDepthIn - op.plungeIn) > 1e-6) return refuse("SPOT_TOOL_DIFFERS_FROM_STORE_PLAN");
    if (op.stationId !== machine.stations.spot.id) return refuse(`STATION_NOT_REGISTERED:${op.stationId}`);
  }
  for (const op of plan.filter((o) => o.kind === "REFERENCE_CUT" || o.kind === "MITER_CUTOFF" || o.kind === "REBASE_DATUM_C")) {
    if (op.stationId !== machine.stations.saw.id) return refuse(`STATION_NOT_REGISTERED:${op.stationId}`);
  }
  const angles = [...new Set(plan.filter((o) => o.angleDeg != null).map((o) => o.angleDeg))];
  if (angles.length !== 1) return refuse("ONE_MITER_ANGLE_PER_BOARD_REQUIRED");

  const registryProblems = registeredMachineProblems(machine);
  if (registryProblems.length) return refuse(...registryProblems);
  const demandHash = calculationHash(definition.demand);
  const operations = plan.map((op) => ({ ...op, sourceStoreOperationId: op.opId, sourceDemandHash: demandHash }));

  // Nominal contact audit: which registered contacts lie under the retained stock before each operation.
  // Point contact is a screening test, not roller engagement, pressure or traction.
  const contacts = [];
  let c = 0;
  let remaining = parentLengthIn;
  for (const op of operations) {
    if (op.kind === "REFERENCE_CUT") remaining -= kerfIn;
    if (op.kind === "INDEX") c = op.toCIn;
    if (op.kind === "REBASE_DATUM_C") c = 0;
    const under = Object.fromEntries(machine.stations.contacts.map((s) => [s.id, c <= s.xIn && s.xIn <= c + remaining]));
    contacts.push({ operationId: op.opId, kind: op.kind, cMachineIn: c, remainingIn: remaining, ...under });
    if (op.kind === "MITER_CUTOFF") remaining = op.retainedAfterIn;
  }

  const localJob = {
    schema: LOCAL_JOB_SCHEMA,
    packetId: packet.packetId,
    projectId: packet.project.projectId,
    definitionId: definition.definitionId,
    definitionRevision: definition.revisionId,
    requirements: { ...definition.requirements },
    demandHash,
    storeRelease: answer.evaluationReceipt.authority.storeRevision,
    storeCalculationIdentity: answer.calculationIdentity,
    packetHash: calculationHash(packet),
    machineConfigHash: machineConfigHash(machine),
    machineConfigId: machine.machineConfigId,
    executionClass: machine.executionClass,
    physicalAuthority: false,
    selectedMaterial: { storeSku: item.storeSku, actualT: item.actualT, actualW: item.actualW, stockL_in: item.stockL_in, parentLengthIn },
    miterAngleDeg: angles[0],
    kerfIn,
    operations,
    contacts,
    releaseBlockers: [...machine.releaseBlockers]
  };
  localJob.localJobHash = localJobContentHash(localJob);
  const problems = localJobProblems(localJob);
  if (problems.length) return refuse(...problems);
  const geometryProblems = planProblems(localJob, machine);
  if (geometryProblems.length) return refuse(...geometryProblems);
  return { status: "LOWERED", localJob };
}

/** The virtual command records for a local job: every record names its source operation or allowance. */
export function motionRecords(localJob, machine = loadMachineConfig()) {
  const problems = [...registeredMachineProblems(machine), ...localJobProblems(localJob)];
  if (problems.length) throw new Error(`Motion records refused: ${problems.join(", ")}`);
  if (localJob.machineConfigId !== machine.machineConfigId || localJob.machineConfigHash !== machineConfigHash(machine)) throw new Error("Motion records need the exact machine configuration the job was lowered for.");
  const geometryProblems = planProblems(localJob, machine);
  if (geometryProblems.length) throw new Error(`Motion records refused: ${geometryProblems.join(", ")}`);
  const { axes, allowancesSec: wait, assumptions } = machine;
  const { actualT: topIn, actualW: widthIn } = localJob.selectedMaterial;
  const plungeBase = spotPointLengthIn(machine.tooling.spot);
  const clearZ = topIn + axes.Z.clearanceAboveStockIn;
  const strokeIn = widthIn / Math.cos((localJob.miterAngleDeg * Math.PI) / 180);

  const sequence = [];
  const add = (kind, axis, target, velocity, acceleration, source, extra = {}) =>
    sequence.push({ seq: sequence.length + 1, kind, axis, target, velocity, acceleration, source, ...extra });
  const delay = (seconds, source, extra = {}) => add("DELAY", null, seconds, null, null, source, { seconds, ...extra });

  delay(wait.loadSeat, "STORE_HANDLING_LOAD");
  add("MOVE", "A", localJob.miterAngleDeg, axes.A.velocityDegPerSec, axes.A.accelerationDegPerSec2, "DEFINITION_ANGLE");
  delay(wait.angleSettle, "REFERENCE_ANGLE_SETTLE");
  delay(wait.clamp, "REFERENCE_CLAMP");

  let y = null;
  let spindle = false;
  for (const op of localJob.operations) {
    const source = op.opId;
    if (op.kind === "REFERENCE_CUT" || op.kind === "MITER_CUTOFF") {
      add("SET_SAW", null, 1, null, null, source);
      add("MOVE", "S", axes.S.approachIn, axes.S.rapidInPerSec, axes.S.accelerationInPerSec2, source);
      add("MOVE", "S", axes.S.approachIn + strokeIn, axes.S.processInPerSec, axes.S.accelerationInPerSec2, source, { assumption: assumptions.sawStroke.label });
      add("MOVE", "S", 0, axes.S.rapidInPerSec, axes.S.accelerationInPerSec2, source);
      delay(wait.sawDwell, source);
      add("SET_SAW", null, 0, null, null, source);
      if (op.kind === "REFERENCE_CUT") add("CAPTURE_C", null, 0, null, null, source, { seconds: wait.captureC, assumption: assumptions.rebase.label });
    } else if (op.kind === "INDEX") {
      add("MOVE_C", "X", op.toCIn, axes.X.velocityInPerSec, axes.X.accelerationInPerSec2, source);
      add("VERIFY_X", null, op.toCIn, null, null, source, { seconds: wait.positionVerify });
    } else if (op.kind === "SPOT_ON_LOCATION") {
      if (y !== op.acrossWidthIn) {
        add("MOVE", "Y", op.acrossWidthIn, axes.Y.velocityInPerSec, axes.Y.accelerationInPerSec2, source);
        y = op.acrossWidthIn;
      }
      if (!spindle) {
        add("SET_SPOT", null, 1, null, null, source);
        delay(wait.spotSpindleReady, source);
        spindle = true;
      }
      add("MOVE", "Z", topIn, axes.Z.rapidInPerSec, axes.Z.accelerationInPerSec2, source);
      add("MOVE", "Z", topIn - (plungeBase + op.fullDiameterDepthIn), axes.Z.processInPerSec, axes.Z.accelerationInPerSec2, source);
      add("MOVE", "Z", clearZ, axes.Z.rapidInPerSec, axes.Z.accelerationInPerSec2, source);
    } else if (op.kind === "REBASE_DATUM_C") {
      add("CAPTURE_C", null, 0, null, null, source, { seconds: wait.captureC, assumption: assumptions.rebase.label });
    }
  }
  if (spindle) add("SET_SPOT", null, 0, null, null, "REFERENCE_END");
  delay(wait.releaseLabel, "STORE_HANDLING_RELEASE");
  add("COMPLETE", null, 0, null, null, "REFERENCE_END");

  const records = {
    schema: MOTION_RECORDS_SCHEMA,
    binding: { packetId: localJob.packetId, demandHash: localJob.demandHash, packetHash: localJob.packetHash, machineConfigId: localJob.machineConfigId, machineConfigHash: localJob.machineConfigHash, localJobHash: localJob.localJobHash },
    units: { ...machine.units },
    executionClass: "VIRTUAL_BENCH_ONLY",
    physicalAuthority: false,
    initialPositions: { X: 0, Y: 0, Z: clearZ, A: 0, S: 0 },
    toolClearZ: clearZ,
    sequence
  };
  records.binding.motionHash = motionContentHash(records);
  return records;
}
