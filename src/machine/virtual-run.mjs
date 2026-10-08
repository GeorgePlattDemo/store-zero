/**
 * The virtual runner and the physical admission record for the D-001 reference cell.
 *
 * The runner executes motion records in an acceleration-limited stop-to-stop model. It is not a controller,
 * not the Structured Text, and not EtherCAT or safety behavior: it shows the commands are ordered, bounded and
 * traceable, and that the modeled faults stop the run before the next tool or index command.
 * Physical admission is always BLOCKED here: no configuration with physical authority is registered.
 */
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
  const b = records.binding ?? {};
  if (!expected || b.packetId !== expected.packetId || b.demandHash !== expected.demandHash || b.machineConfigId !== expected.machineConfigId) {
    return { status: "REFUSED", reason: "JOB_IDENTITY_MISMATCH", physicalAuthority: false, motionCommands: 0 };
  }
  const p = { ...records.initialPositions };
  let offset = 0;
  let t = 0;
  let saw = false;
  let spot = false;
  let moves = 0;
  const trace = [];
  const stop = (reason) => ({ status: "FAULT", reason, physicalAuthority: false, model: VIRTUAL_MODEL, timeSec: t, motionCommands: moves, trace });

  for (const op of records.sequence) {
    if (op.seq === faults.retractUnconfirmedAtSeq) return stop("TOOL_RETRACT_UNCONFIRMED");
    let dt = op.seconds || 0;
    let target = op.target;
    if (op.kind === "MOVE" || op.kind === "MOVE_C") {
      if (op.axis === "X" && (p.S !== 0 || Math.abs(p.Z - records.toolClearZ) > 1e-9)) return stop("INDEX_WITH_TOOL_DOWN");
      if (op.kind === "MOVE_C") target = offset + op.target;
      dt = moveTimeSec(target - p[op.axis], op.velocity, op.acceleration);
      p[op.axis] = target;
      moves += 1;
    } else if (op.kind === "CAPTURE_C") {
      offset = p.X;
    } else if (op.kind === "VERIFY_X") {
      if (op.seq === faults.slipAtSeq || Math.abs(p.X - offset - op.target) > 1e-9) return stop("POSITION_INVALID");
    } else if (op.kind === "SET_SAW") {
      saw = !!op.target;
    } else if (op.kind === "SET_SPOT") {
      spot = !!op.target;
    }
    trace.push({ seq: op.seq, kind: op.kind, axis: op.axis, target: op.target, source: op.source, startSec: t, endSec: t + dt, durationSec: dt, positions: { ...p }, cOffset: offset, sawCommand: saw, spotCommand: spot });
    t += dt;
  }
  return { status: "VIRTUAL_MODEL_COMPLETE", physicalAuthority: false, model: VIRTUAL_MODEL, timeSec: t, motionCommands: moves, trace };
}

/** Physical admission for a local job: BLOCKED with every unresolved prerequisite, and zero motion. */
export function physicalAdmission(localJob) {
  const reasons = localJob.releaseBlockers?.length ? [...localJob.releaseBlockers] : ["PHYSICAL_AUTHORITY_NOT_REGISTERED"];
  return { status: "BLOCKED", physicalAuthority: false, reasons, motionCommands: 0 };
}
