/** One bounded virtual-evidence entry point; System never needs a copy of Store's machine engine. */
import { shapeProblems } from "../contracts/shape.mjs";
import { lowerJobPacket, motionRecords } from "./lowering.mjs";
import { loadMachineConfig, machineConfigHash, registeredMachineProblems } from "./configuration.mjs";
import { physicalAdmission, runVirtual } from "./virtual-run.mjs";

export const MACHINE_EVIDENCE_PROTOCOL = "STORE-ZERO-MACHINE-EVIDENCE-1";
export const MACHINE_EVIDENCE_REQUEST_SHAPE = Object.freeze({ object: {
  packet: { any: true }, expectedMachineConfigId: "string", expectedMachineConfigHash: "string"
} });

export function machineEvidenceIdentity(machine = loadMachineConfig()) {
  const problems = registeredMachineProblems(machine);
  if (problems.length) throw new Error(`Machine evidence unavailable: ${problems.join(", ")}`);
  return {
    protocol: MACHINE_EVIDENCE_PROTOCOL,
    requestTypes: ["USER_DEFINED_BOARD_V1"],
    machineConfigId: machine.machineConfigId,
    machineConfigHash: machineConfigHash(machine),
    physicalAuthority: false
  };
}

export function evaluateMachineEvidence(request, { release, catalog, now, machine = loadMachineConfig() } = {}) {
  const refuse = (...reasonCodes) => ({ status: "REFUSED", physicalAuthority: false, reasonCodes });
  if (!request || typeof request !== "object" || Array.isArray(request)) return refuse("MACHINE_EVIDENCE_REQUEST_REQUIRED");
  const problems = shapeProblems(request, MACHINE_EVIDENCE_REQUEST_SHAPE, "MACHINE_EVIDENCE");
  for (const key of Object.keys(MACHINE_EVIDENCE_REQUEST_SHAPE.object)) if (request[key] == null) problems.push(`MACHINE_EVIDENCE_FIELD_REQUIRED:${key}`);
  if (problems.length) return refuse(...problems);
  const configProblems = registeredMachineProblems(machine);
  if (configProblems.length) return refuse(...configProblems);
  if (request.expectedMachineConfigId !== machine.machineConfigId || request.expectedMachineConfigHash !== machineConfigHash(machine)) return refuse("MACHINE_CONFIGURATION_IDENTITY_MISMATCH");
  const lowered = lowerJobPacket(request.packet, { release, catalog, now, machine });
  if (lowered.status !== "LOWERED") return { ...lowered, physicalAuthority: false };
  const records = motionRecords(lowered.localJob, machine);
  const run = runVirtual(records, { expected: records.binding });
  if (run.status !== "VIRTUAL_MODEL_COMPLETE") return refuse(`VIRTUAL_EVIDENCE_NOT_COMPLETE:${run.reason}`);
  return {
    status: "VIRTUAL_EVIDENCE_READY", physicalAuthority: false,
    localJob: lowered.localJob, records, run, admission: physicalAdmission(lowered.localJob)
  };
}
