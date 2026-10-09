/**
 * Exact shapes of the machine side's outputs: the local job, the motion records, the virtual run result and
 * the physical admission record. They are produced by src/machine and checked by acceptance/machine.
 */
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
    schema: { enum: ["STB-LOCAL-JOB-1"] },
    packetId: "string",
    projectId: "string",
    definitionId: "string",
    definitionRevision: "string",
    requirements: { object: { endRelation: "string", lengthDatum: "string", endIdentity: "string" } },
    demandHash: "string",
    storeRelease: "string",
    storeCalculationIdentity: { object: { inputHash: "string", resultHash: "string" } },
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
    schema: { enum: ["STB-MOTION-RECORDS-1"] },
    binding: { object: { packetId: "string", demandHash: "string", machineConfigId: "string" } },
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
