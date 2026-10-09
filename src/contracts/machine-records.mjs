/**
 * Exact shapes of the machine side's outputs: the local job, the motion records, the virtual run result and
 * the physical admission record. They are produced by src/machine and checked by acceptance/machine.
 */
import { shapeProblems } from "./shape.mjs";
import { D001_TRAVEL_STANDARD, calculationHash, BOARD_END_GEOMETRY } from "../evaluation/engine/d001-travel-standard.mjs";

const number = "number";
const STORE_OPERATION = {
  object: {
    sequence: "integer", opId: "string", kind: "string", stationId: "string", datumEffect: "string", angleDeg: number,
    indexDistanceIn: number, timeSec: number, purpose: "string", fromCIn: number, toCIn: number, distanceIn: number,
    partId: "string", partRelativeXIn: number, workpieceFeatureXIn: number, acrossWidthRule: "string", acrossWidthIn: number,
    insetFromEdgeIn: number, fullDiameterDepthIn: number, plungeIn: number, depthIsPartRequirement: "boolean",
    partLengthIn: number, kerfIn: number, retainedAfterIn: number, controlPass: "boolean", method: "string",
    sourceStoreOperationId: "string", sourceDemandHash: "string"
  }
};

export const LOCAL_JOB_SHAPE = Object.freeze({
  object: {
    schema: { enum: ["STB-LOCAL-JOB-2"] },
    packetId: "string",
    projectId: "string",
    definitionId: "string",
    definitionRevision: "string",
    requirements: { object: { endRelation: "string", lengthDatum: "string", endIdentity: "string" } },
    demandHash: "string",
    storeRelease: "string",
    storeCalculationIdentity: { object: { inputHash: "string", resultHash: "string" } },
    packetHash: "string",
    machineConfigHash: "string",
    localJobHash: "string",
    machineConfigId: "string",
    executionClass: "string",
    physicalAuthority: { enum: [false] },
    selectedMaterial: { object: { storeSku: "string", actualT: number, actualW: number, stockL_in: number, parentLengthIn: number } },
    miterAngleDeg: number,
    kerfIn: number,
    operations: { array: STORE_OPERATION },
    contacts: { array: { object: { operationId: "string", kind: "string", cMachineIn: number, remainingIn: number, R1: "boolean", M1: "boolean", R2: "boolean" } } },
    releaseBlockers: { array: "string" }
  }
});

export const COMMAND_KINDS = Object.freeze(["DELAY", "MOVE", "MOVE_C", "VERIFY_X", "CAPTURE_C", "SET_SAW", "SET_SPOT", "COMPLETE"]);
const AXES = { X: "number", Y: "number", Z: "number", A: "number", S: "number" };

export const MOTION_RECORDS_SHAPE = Object.freeze({
  object: {
    schema: { enum: ["STB-MOTION-RECORDS-2"] },
    binding: { object: { packetId: "string", demandHash: "string", packetHash: "string", machineConfigId: "string", machineConfigHash: "string", localJobHash: "string", motionHash: "string" } },
    units: { object: { linear: { enum: ["in"] }, angular: { enum: ["deg"] }, time: { enum: ["s"] } } },
    executionClass: { enum: ["VIRTUAL_BENCH_ONLY"] },
    physicalAuthority: { enum: [false] },
    initialPositions: { object: AXES },
    toolClearZ: number,
    sequence: {
      array: {
        object: {
          seq: "integer", kind: { enum: COMMAND_KINDS }, axis: { enum: ["X", "Y", "Z", "A", "S"] }, target: number,
          velocity: number, acceleration: number, source: "string", seconds: number, assumption: "string"
        }
      }
    }
  }
});

export const VIRTUAL_RUN_SHAPE = Object.freeze({
  object: {
    status: { enum: ["VIRTUAL_MODEL_COMPLETE", "FAULT", "REFUSED"] },
    reason: "string",
    physicalAuthority: { enum: [false] },
    model: "string",
    timeSec: number,
    motionCommands: "integer",
    trace: {
      array: {
        object: {
          seq: "integer", kind: "string", axis: "string", target: number, source: "string", startSec: number, endSec: number,
          durationSec: number, positions: { object: AXES }, cOffset: number, sawCommand: "boolean", spotCommand: "boolean"
        }
      }
    }
  }
});

export const PHYSICAL_ADMISSION_SHAPE = Object.freeze({
  object: {
    status: { enum: ["BLOCKED"] },
    physicalAuthority: { enum: [false] },
    reasons: { array: "string" },
    motionCommands: { enum: [0] }
  }
});

const nonblank = (value) => typeof value === "string" && !!value.trim();
const hash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const positive = (value) => finite(value) && value > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const required = (value, fields, prefix) => fields.filter((key) => value?.[key] == null).map((key) => `${prefix}_FIELD_REQUIRED:${key}`);

/** Integrity hashes detect changed content; they are not signatures or user authorization. */
export function localJobContentHash(job) {
  const { localJobHash, ...core } = job;
  return calculationHash(core);
}

export function motionContentHash(records) {
  const { motionHash, ...binding } = records.binding;
  return calculationHash({ ...records, binding });
}

/** Required values as well as exact shapes: a shape alone permits absent/null values. */
export function localJobProblems(job) {
  if (!object(job)) return ["LOCAL_JOB_MUST_BE_AN_OBJECT"];
  const problems = [...shapeProblems(job, LOCAL_JOB_SHAPE, "LOCAL_JOB"), ...required(job, Object.keys(LOCAL_JOB_SHAPE.object), "LOCAL_JOB")];
  for (const key of ["packetId", "projectId", "definitionId", "definitionRevision", "storeRelease", "machineConfigId"]) {
    if (!nonblank(job[key])) problems.push(`LOCAL_JOB_IDENTITY_REQUIRED:${key}`);
  }
  for (const key of ["demandHash", "packetHash", "machineConfigHash", "localJobHash"]) {
    if (!hash(job[key])) problems.push(`LOCAL_JOB_HASH_REQUIRED:${key}`);
  }
  if (job.executionClass !== "NOMINAL_COORDINATE_MODEL") problems.push("LOCAL_JOB_EXECUTION_CLASS_NOT_REGISTERED");
  if (job.requirements?.endRelation !== BOARD_END_GEOMETRY.endRelation || job.requirements?.lengthDatum !== BOARD_END_GEOMETRY.lengthDatum || (job.requirements?.endIdentity ?? null) !== BOARD_END_GEOMETRY.endIdentity) problems.push("LOCAL_JOB_REQUIREMENTS_NOT_REGISTERED");
  for (const key of ["inputHash", "resultHash"]) if (!hash(job.storeCalculationIdentity?.[key])) problems.push(`LOCAL_JOB_CALCULATION_HASH_REQUIRED:${key}`);
  if (!nonblank(job.selectedMaterial?.storeSku)) problems.push("LOCAL_JOB_MATERIAL_ID_REQUIRED");
  for (const key of ["actualT", "actualW", "stockL_in", "parentLengthIn"]) if (!positive(job.selectedMaterial?.[key])) problems.push(`LOCAL_JOB_MATERIAL_DIMENSION_REQUIRED:${key}`);
  if (job.selectedMaterial?.parentLengthIn > job.selectedMaterial?.stockL_in) problems.push("LOCAL_JOB_PARENT_EXCEEDS_STOCK");
  if (!finite(job.miterAngleDeg) || job.miterAngleDeg < 0 || job.miterAngleDeg > 45 || !positive(job.kerfIn)) problems.push("LOCAL_JOB_CUT_GEOMETRY_INVALID");
  if (!Array.isArray(job.operations) || !job.operations.length) problems.push("LOCAL_JOB_OPERATIONS_REQUIRED");
  else {
    const ids = new Set();
    const kinds = new Set(["REFERENCE_CUT", "INDEX", "SPOT_ON_LOCATION", "MITER_CUTOFF", "REBASE_DATUM_C"]);
    for (const [i, op] of job.operations.entries()) {
      if (!object(op)) { problems.push(`LOCAL_JOB_OPERATION_REQUIRED:${i}`); continue; }
      if (op.sequence !== i + 1 || !nonblank(op.opId) || ids.has(op.opId)) problems.push(`LOCAL_JOB_OPERATION_IDENTITY_INVALID:${i}`);
      ids.add(op.opId);
      if (!kinds.has(op.kind)) problems.push(`OPERATION_NOT_REGISTERED_ON_MACHINE:${op.kind}`);
      if (op.sourceStoreOperationId !== op.opId || op.sourceDemandHash !== job.demandHash) problems.push(`LOCAL_JOB_OPERATION_SOURCE_MISMATCH:${i}`);
      if (!finite(op.timeSec) || op.timeSec < 0) problems.push(`LOCAL_JOB_OPERATION_TIME_INVALID:${i}`);
      const fields = op.kind === "INDEX" ? ["fromCIn", "toCIn", "distanceIn"] : op.kind === "SPOT_ON_LOCATION" ? ["partRelativeXIn", "workpieceFeatureXIn", "acrossWidthIn", "fullDiameterDepthIn", "plungeIn"] : op.kind === "MITER_CUTOFF" ? ["partLengthIn", "angleDeg", "kerfIn", "retainedAfterIn"] : op.kind === "REFERENCE_CUT" ? ["angleDeg", "indexDistanceIn"] : [];
      for (const key of fields) if (!finite(op[key])) problems.push(`LOCAL_JOB_OPERATION_VALUE_REQUIRED:${i}:${key}`);
      if (["MITER_CUTOFF", "SPOT_ON_LOCATION"].includes(op.kind) && !nonblank(op.partId)) problems.push(`LOCAL_JOB_PART_ID_REQUIRED:${i}`);
      if (["REFERENCE_CUT", "MITER_CUTOFF", "REBASE_DATUM_C", "SPOT_ON_LOCATION"].includes(op.kind) && !nonblank(op.stationId)) problems.push(`LOCAL_JOB_STATION_ID_REQUIRED:${i}`);
      if (op.kind === "MITER_CUTOFF" && (op.controlPass !== true || op.kerfIn !== job.kerfIn || op.angleDeg !== job.miterAngleDeg || op.partLengthIn <= 0 || op.retainedAfterIn < D001_TRAVEL_STANDARD.control.minRetainedControlIn)) problems.push(`LOCAL_JOB_CUTOFF_INVALID:${i}`);
      if (op.kind === "REFERENCE_CUT" && op.angleDeg !== job.miterAngleDeg) problems.push(`LOCAL_JOB_REFERENCE_ANGLE_MISMATCH:${i}`);
      if (op.kind === "REBASE_DATUM_C" && op.method !== "FRESH_CUT_FACE") problems.push(`LOCAL_JOB_REBASE_NOT_REGISTERED:${i}`);
      if (op.kind === "SPOT_ON_LOCATION" && (op.depthIsPartRequirement !== true || op.fullDiameterDepthIn <= 0 || op.plungeIn <= 0 || op.acrossWidthIn < 0 || op.acrossWidthIn > job.selectedMaterial?.actualW)) problems.push(`LOCAL_JOB_SPOT_INVALID:${i}`);
    }
    if (job.operations[0]?.kind !== "REFERENCE_CUT" || job.operations.at(-1)?.kind !== "REBASE_DATUM_C") problems.push("LOCAL_JOB_OPERATION_ORDER_INVALID");
    if (!Array.isArray(job.contacts) || job.contacts.length !== job.operations.length) problems.push("LOCAL_JOB_CONTACT_AUDIT_REQUIRED");
    else job.contacts.forEach((c, i) => {
      if (!object(c) || c.operationId !== job.operations[i]?.opId || c.kind !== job.operations[i]?.kind || !finite(c.cMachineIn) || !positive(c.remainingIn) || ["R1", "M1", "R2"].some((key) => typeof c[key] !== "boolean")) problems.push(`LOCAL_JOB_CONTACT_INVALID:${i}`);
    });
  }
  if (!Array.isArray(job.releaseBlockers) || !job.releaseBlockers.length || job.releaseBlockers.some((r) => !nonblank(r))) problems.push("LOCAL_JOB_RELEASE_BLOCKERS_REQUIRED");
  if (!problems.length && localJobContentHash(job) !== job.localJobHash) problems.push("LOCAL_JOB_CONTENT_CHANGED");
  return problems;
}

/** Validate all records before the runner executes even the first command. */
export function motionRecordProblems(records) {
  if (!object(records)) return ["MOTION_MUST_BE_AN_OBJECT"];
  const problems = [...shapeProblems(records, MOTION_RECORDS_SHAPE, "MOTION"), ...required(records, Object.keys(MOTION_RECORDS_SHAPE.object), "MOTION")];
  for (const key of ["packetId", "machineConfigId"]) if (!nonblank(records.binding?.[key])) problems.push(`MOTION_BINDING_REQUIRED:${key}`);
  for (const key of ["demandHash", "packetHash", "machineConfigHash", "localJobHash", "motionHash"]) if (!hash(records.binding?.[key])) problems.push(`MOTION_BINDING_HASH_REQUIRED:${key}`);
  for (const [key, value] of Object.entries({ linear: "in", angular: "deg", time: "s" })) if (records.units?.[key] !== value) problems.push(`MOTION_UNITS_INVALID:${key}`);
  for (const key of Object.keys(AXES)) if (!finite(records.initialPositions?.[key])) problems.push(`MOTION_INITIAL_POSITION_REQUIRED:${key}`);
  if (!finite(records.toolClearZ)) problems.push("MOTION_TOOL_CLEARANCE_REQUIRED");
  if (!Array.isArray(records.sequence) || !records.sequence.length) problems.push("MOTION_SEQUENCE_REQUIRED");
  else {
    for (const [i, op] of records.sequence.entries()) {
      if (!object(op)) { problems.push(`MOTION_COMMAND_REQUIRED:${i}`); continue; }
      if (op.seq !== i + 1) problems.push(`MOTION_SEQUENCE_ORDER_INVALID:${i}`);
      if (!nonblank(op.source)) problems.push(`MOTION_SOURCE_REQUIRED:${i}`);
      if (!COMMAND_KINDS.includes(op.kind)) problems.push(`MOTION_COMMAND_NOT_REGISTERED:${op.kind}`);
      if (op.seconds != null && (!finite(op.seconds) || op.seconds < 0)) problems.push(`MOTION_DELAY_INVALID:${i}`);
      if (["MOVE", "MOVE_C"].includes(op.kind)) {
        if (!Object.hasOwn(AXES, op.axis ?? "") || !finite(op.target) || !positive(op.velocity) || !positive(op.acceleration)) problems.push(`MOTION_OPERANDS_INVALID:${i}`);
        if (op.kind === "MOVE_C" && op.axis !== "X") problems.push(`MOTION_DATUM_AXIS_INVALID:${i}`);
        if (op.seconds != null) problems.push(`MOTION_FIELD_NOT_APPLICABLE:${i}:seconds`);
      } else {
        for (const key of ["axis", "velocity", "acceleration"]) if (op[key] != null) problems.push(`MOTION_FIELD_NOT_APPLICABLE:${i}:${key}`);
        if (!finite(op.target)) problems.push(`MOTION_TARGET_REQUIRED:${i}`);
        if (op.kind === "DELAY" && (!finite(op.seconds) || op.seconds < 0 || op.target !== op.seconds)) problems.push(`MOTION_DELAY_INVALID:${i}`);
        if (["SET_SAW", "SET_SPOT"].includes(op.kind) && ![0, 1].includes(op.target)) problems.push(`MOTION_TOOL_STATE_INVALID:${i}`);
        if (["CAPTURE_C", "COMPLETE"].includes(op.kind) && op.target !== 0) problems.push(`MOTION_DATUM_TARGET_INVALID:${i}`);
      }
      if (op.kind === "COMPLETE" && i !== records.sequence.length - 1) problems.push("MOTION_COMPLETE_MUST_BE_FINAL");
    }
    if (records.sequence.at(-1)?.kind !== "COMPLETE") problems.push("MOTION_COMPLETE_REQUIRED");
  }
  if (!problems.length && motionContentHash(records) !== records.binding.motionHash) problems.push("MOTION_CONTENT_CHANGED");
  return problems;
}
