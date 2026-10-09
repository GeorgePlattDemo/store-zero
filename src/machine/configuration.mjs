/** Registered reference configuration, validated identically for disk and injected values. */
import { readFileSync } from "node:fs";
import { calculationHash } from "../evaluation/engine/d001-travel-standard.mjs";
import { shapeProblems } from "../contracts/shape.mjs";

const CONFIG_URL = new URL("../../data/machine/d001-reference-review-0.2.json", import.meta.url);
const number = "number";
const station = { object: { id: "string", xIn: number } };
const xy = { object: { velocityInPerSec: number, accelerationInPerSec2: number } };
const shape = { object: {
  machineConfigId: "string", cellFamily: { enum: ["D-001"] }, executionClass: { enum: ["NOMINAL_COORDINATE_MODEL"] },
  evidenceClass: { enum: ["REFERENCE_SELECTION_NOT_COMMISSIONED"] }, physicalAuthority: { enum: [false] }, source: "string",
  units: { object: { linear: { enum: ["in"] }, angular: { enum: ["deg"] }, time: { enum: ["s"] } } },
  stations: { object: { saw: station, spot: station, contacts: { array: { object: { id: "string", xIn: number, role: "string" } } } } },
  axes: { object: { X: xy, Y: xy, A: { object: { velocityDegPerSec: number, accelerationDegPerSec2: number } },
    S: { object: { rapidInPerSec: number, processInPerSec: number, accelerationInPerSec2: number, approachIn: number } },
    Z: { object: { rapidInPerSec: number, processInPerSec: number, accelerationInPerSec2: number, clearanceAboveStockIn: number } } } },
  tooling: { object: { spot: { object: { diameterIn: number, pointAngleDeg: number } } } },
  allowancesSec: { object: Object.fromEntries(["loadSeat", "releaseLabel", "angleSettle", "clamp", "sawDwell", "positionVerify", "spotSpindleReady", "captureC"].map((key) => [key, number])) },
  assumptions: { object: { sawStroke: { object: { rule: { enum: ["STOCK_WIDTH_OVER_COS_MITER_ANGLE"] }, label: "string" } }, rebase: { object: { label: "string" } } } },
  releaseBlockers: { array: "string" }
} };

export function machineConfigProblems(machine) {
  const problems = shapeProblems(machine, shape, "MACHINE");
  const visit = (value, node, path) => {
    if (value == null) { problems.push(`MACHINE_FIELD_REQUIRED:${path || "(root)"}`); return; }
    if (node.object && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(node.object)) visit(value[key], child, path ? `${path}.${key}` : key);
    } else if (node.array && Array.isArray(value)) {
      if (!value.length) problems.push(`MACHINE_LIST_REQUIRED:${path}`);
      value.forEach((item, i) => visit(item, node.array, `${path}[${i}]`));
    } else if (node === "string" && typeof value === "string" && !value.trim()) problems.push(`MACHINE_FIELD_NONBLANK:${path}`);
    else if (node === "number" && typeof value === "number" && Number.isFinite(value)) {
      const min = path.startsWith("stations.") || path.startsWith("allowancesSec.") ? 0 : Number.MIN_VALUE;
      if (value < min || (path === "tooling.spot.pointAngleDeg" && value >= 180)) problems.push(`MACHINE_VALUE_OUT_OF_RANGE:${path}`);
    }
  };
  visit(machine, shape, "");
  const ids = machine?.stations?.contacts?.map?.((s) => s?.id);
  if (!Array.isArray(ids) || ids.length !== 3 || ["R1", "M1", "R2"].some((id) => !ids.includes(id))) problems.push("MACHINE_CONTACTS_NOT_REGISTERED");
  return problems;
}

export const machineConfigHash = (machine) => calculationHash(machine);

export function loadMachineConfig(url = CONFIG_URL) {
  const machine = JSON.parse(readFileSync(url, "utf8"));
  const problems = machineConfigProblems(machine);
  if (problems.length) throw new Error(`Machine configuration refused: ${problems.join(", ")}`);
  return machine;
}

/** Only the complete configuration on disk is registered; an ID cannot stand in for its content. */
export function registeredMachineProblems(machine) {
  const problems = machineConfigProblems(machine);
  if (problems.length) return problems;
  const registered = loadMachineConfig();
  if (machine.machineConfigId !== registered.machineConfigId) return ["MACHINE_CONFIGURATION_NOT_REGISTERED"];
  if (machineConfigHash(machine) !== machineConfigHash(registered)) return ["MACHINE_CONFIGURATION_CONTENT_CHANGED"];
  return [];
}
