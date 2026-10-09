/**
 * Machine-local lowering for the D-001 reference cell: an accepted job packet in, a local job and its virtual
 * motion records out. This is the machine side of the Store boundary (specification §10): it never changes
 * what was accepted. Every operation comes from the Store's operation plan in the packet; every command traces
 * to one of those operations or to a named machine allowance; every machine fact comes from the registered
 * machine configuration (data/machine/); the board's actual dimensions come from the Store-selected offering.
 *
 * Nothing here issues physical motion. Commands are virtual records for the reference model only.
 */
import { readFileSync } from "node:fs";
import { calculationHash } from "../evaluation/engine/d001-travel-standard.mjs";
import { findSku, loadCatalog } from "../evaluation/catalog.mjs";
import { verifyJobPacket } from "../contracts/job-packet.mjs";

export const LOCAL_JOB_SCHEMA = "STB-LOCAL-JOB-1";
export const MOTION_RECORDS_SCHEMA = "STB-MOTION-RECORDS-1";
const REFERENCE_MACHINE_URL = new URL("../../data/machine/d001-reference-review-0.2.json", import.meta.url);

/** The registered reference machine configuration. A configuration that claims physical authority is refused. */
export function loadMachineConfig(url = REFERENCE_MACHINE_URL) {
  const machine = JSON.parse(readFileSync(url, "utf8"));
  if (machine.physicalAuthority !== false) throw new Error("A machine configuration with physical authority is not registered here.");
  for (const key of ["machineConfigId", "stations", "axes", "tooling", "allowancesSec", "assumptions", "releaseBlockers"]) {
    if (machine[key] == null) throw new Error(`Machine configuration is missing ${key}.`);
  }
  return machine;
}

const LOWERED_KINDS = new Set(["REFERENCE_CUT", "INDEX", "SPOT_ON_LOCATION", "MITER_CUTOFF", "REBASE_DATUM_C"]);
const spotPointLengthIn = (tool) => tool.diameterIn / 2 / Math.tan((tool.pointAngleDeg * Math.PI) / 360);

/**
 * Lowers a packet to a local job for this machine. Answers { status: "LOWERED", localJob } or
 * { status: "REFUSED" | "STALE", reasonCodes } — a packet is lowered only after it verifies against this Store.
 */
export function lowerJobPacket(packet, { release, catalog, now, machine = loadMachineConfig() } = {}) {
  const verified = verifyJobPacket(packet, { release, catalog, now });
  if (verified.status !== "VERIFIED") return verified;
  const refuse = (...reasonCodes) => ({ status: "REFUSED", reasonCodes });

  const { definition, storeAnswer: answer } = packet;
  if (definition.requestType !== "USER_DEFINED_BOARD_V1") return refuse(`LOWERING_NOT_REGISTERED_FOR:${definition.requestType}`);
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
  const pointIn = spotPointLengthIn(machine.tooling.spot);
  for (const op of plan.filter((o) => o.kind === "SPOT_ON_LOCATION")) {
    if (Math.abs(pointIn + op.fullDiameterDepthIn - op.plungeIn) > 1e-6) return refuse("SPOT_TOOL_DIFFERS_FROM_STORE_PLAN");
    if (op.stationId !== machine.stations.spot.id) return refuse(`STATION_NOT_REGISTERED:${op.stationId}`);
  }
  for (const op of plan.filter((o) => o.kind === "REFERENCE_CUT" || o.kind === "MITER_CUTOFF" || o.kind === "REBASE_DATUM_C")) {
    if (op.stationId !== machine.stations.saw.id) return refuse(`STATION_NOT_REGISTERED:${op.stationId}`);
  }
  const angles = [...new Set(plan.filter((o) => o.angleDeg != null).map((o) => o.angleDeg))];
  if (angles.length !== 1) return refuse("ONE_MITER_ANGLE_PER_BOARD_REQUIRED");

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

  return {
    status: "LOWERED",
    localJob: {
      schema: LOCAL_JOB_SCHEMA,
      packetId: packet.packetId,
      projectId: packet.project.projectId,
      definitionId: definition.definitionId,
      definitionRevision: definition.revisionId,
      requirements: definition.requirements ?? {},
      demandHash,
      storeRelease: answer.evaluationReceipt.authority.storeRevision,
      storeCalculationIdentity: answer.calculationIdentity,
      machineConfigId: machine.machineConfigId,
      executionClass: machine.executionClass,
      physicalAuthority: false,
      selectedMaterial: { storeSku: item.storeSku, actualT: item.actualT, actualW: item.actualW, stockL_in: item.stockL_in, parentLengthIn },
      miterAngleDeg: angles[0],
      kerfIn,
      operations,
      contacts,
      releaseBlockers: [...machine.releaseBlockers]
    }
  };
}

/** The virtual command records for a local job: every record names its source operation or allowance. */
export function motionRecords(localJob, machine = loadMachineConfig()) {
  if (localJob?.machineConfigId !== machine.machineConfigId) throw new Error("Motion records need the machine the job was lowered for.");
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

  return {
    schema: MOTION_RECORDS_SCHEMA,
    binding: { packetId: localJob.packetId, demandHash: localJob.demandHash, machineConfigId: localJob.machineConfigId },
    units: { ...machine.units },
    executionClass: "VIRTUAL_BENCH_ONLY",
    physicalAuthority: false,
    initialPositions: { X: 0, Y: 0, Z: clearZ, A: 0, S: 0 },
    toolClearZ: clearZ,
    sequence
  };
}
