/**
 * The virtual runner and the physical admission record for the D-001 reference cell.
 *
 * The runner executes motion records in an acceleration-limited stop-to-stop model. It is not a controller,
 * not the Structured Text, and not EtherCAT or safety behavior: it shows the commands are ordered, bounded and
 * traceable, and that the modeled faults stop the run before the next tool or index command.
 * Physical admission is always BLOCKED here: no configuration with physical authority is registered.
 */
import { motionRecordProblems } from "../contracts/machine-records.mjs";

export const VIRTUAL_MODEL = "ACCELERATION_LIMITED_STOP_TO_STOP";

export function moveTimeSec(distance, velocity, acceleration) {
  const d = Math.abs(distance);
  if (d === 0) return 0;
  return d <= (velocity * velocity) / acceleration ? 2 * Math.sqrt(d / acceleration) : (2 * velocity) / acceleration + (d - (velocity * velocity) / acceleration) / velocity;
}

/**
 * Runs the records. `expected` is the binding the operator's job names (packet, demand hash, machine): a
 * mismatch runs nothing. `faults` injects modeled faults: `slipAtSeq` (position invalid at that verify) and
 * `retractUnconfirmedAtSeq` (tool retract not confirmed at that record).
 */
export function runVirtual(records, { expected, faults = {} } = {}) {
  const problems = motionRecordProblems(records);
  if (problems.length) return { status: "REFUSED", reason: problems[0], physicalAuthority: false, motionCommands: 0 };
  const b = records.binding;
  if (!expected || Object.keys(b).some((key) => b[key] !== expected[key])) {
    return { status: "REFUSED", reason: "JOB_IDENTITY_MISMATCH", physicalAuthority: false, motionCommands: 0 };
  }
  const p = { ...records.initialPositions };
  let offset = 0;
  let t = 0;
  let saw = false;
  let spot = false;
  let moves = 0;
  let sawStroke = false;
  const trace = [];
  const stop = (reason) => ({ status: "FAULT", reason, physicalAuthority: false, model: VIRTUAL_MODEL, timeSec: t, motionCommands: moves, trace });
  if (p.S !== 0 || Math.abs(p.Z - records.toolClearZ) > 1e-9) return stop("INITIAL_TOOL_POSITION_INVALID");

  for (const op of records.sequence) {
    if (op.seq === faults.retractUnconfirmedAtSeq) return stop("TOOL_RETRACT_UNCONFIRMED");
    let dt = op.seconds ?? 0;
    let target = op.target;
    if (op.kind === "MOVE" || op.kind === "MOVE_C") {
      if (op.axis === "X" && (p.S !== 0 || Math.abs(p.Z - records.toolClearZ) > 1e-9)) return stop("INDEX_WITH_TOOL_DOWN");
      if (op.axis === "S" && op.target > 0 && !saw) return stop("SAW_STROKE_WITH_TOOL_OFF");
      if (op.axis === "Z" && op.target < records.toolClearZ && !spot) return stop("SPOT_PLUNGE_WITH_TOOL_OFF");
      if (op.axis === "Y" && Math.abs(p.Z - records.toolClearZ) > 1e-9) return stop("TRAVERSE_WITH_SPOT_DOWN");
      if (op.axis === "A" && p.S !== 0) return stop("ANGLE_CHANGE_WITH_SAW_DOWN");
      if (op.kind === "MOVE_C") target = offset + op.target;
      dt = moveTimeSec(target - p[op.axis], op.velocity, op.acceleration);
      if (!Number.isFinite(target) || !Number.isFinite(dt) || !Number.isFinite(t + dt)) return stop("MOTION_MODEL_OVERFLOW");
      p[op.axis] = target;
      if (op.axis === "S" && target > 0) sawStroke = true;
      moves += 1;
    } else if (op.kind === "CAPTURE_C") {
      if (p.S !== 0 || Math.abs(p.Z - records.toolClearZ) > 1e-9) return stop("DATUM_CAPTURE_WITH_TOOL_DOWN");
      offset = p.X;
    } else if (op.kind === "VERIFY_X") {
      if (op.seq === faults.slipAtSeq || Math.abs(p.X - offset - op.target) > 1e-9) return stop("POSITION_INVALID");
    } else if (op.kind === "SET_SAW") {
      saw = !!op.target;
    } else if (op.kind === "SET_SPOT") {
      spot = !!op.target;
    } else if (op.kind === "COMPLETE") {
      if (saw || spot || p.S !== 0 || Math.abs(p.Z - records.toolClearZ) > 1e-9) return stop("COMPLETE_WITH_TOOL_ACTIVE");
      if (!sawStroke) return stop("COMPLETE_WITHOUT_WORK");
    }
    if (!Number.isFinite(t + dt)) return stop("MOTION_MODEL_OVERFLOW");
    trace.push({ seq: op.seq, kind: op.kind, axis: op.axis, target: op.target, source: op.source, startSec: t, endSec: t + dt, durationSec: dt, positions: { ...p }, cOffset: offset, sawCommand: saw, spotCommand: spot });
    t += dt;
  }
  return { status: "VIRTUAL_MODEL_COMPLETE", physicalAuthority: false, model: VIRTUAL_MODEL, timeSec: t, motionCommands: moves, trace };
}

/** Physical admission for a local job: BLOCKED with every unresolved prerequisite, and zero motion. */
export function physicalAdmission(localJob) {
  const reasons = Array.isArray(localJob?.releaseBlockers) && localJob.releaseBlockers.length && localJob.releaseBlockers.every((r) => typeof r === "string" && r.trim()) ? [...localJob.releaseBlockers] : ["PHYSICAL_AUTHORITY_NOT_REGISTERED"];
  return { status: "BLOCKED", physicalAuthority: false, reasons, motionCommands: 0 };
}
