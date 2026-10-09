// The machine side: an accepted job packet is lowered to a local job, virtual motion records, a virtual run
// and a BLOCKED physical admission. Project 1 must reproduce the review's machine artifacts exactly; a second,
// different job must run through the same code; anything not verified, not registered or inconsistent stops.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lowerJobPacket, motionRecords, loadMachineConfig } from "../../src/machine/lowering.mjs";
import { physicalAdmission, runVirtual } from "../../src/machine/virtual-run.mjs";
import { shapeProblems } from "../../src/contracts/shape.mjs";
import { LOCAL_JOB_SHAPE, MOTION_RECORDS_SHAPE, PHYSICAL_ADMISSION_SHAPE, VIRTUAL_RUN_SHAPE, motionContentHash } from "../../src/contracts/machine-records.mjs";
import { evaluateD001UserDefinedBoard } from "../../src/evaluation/engine/d001-travel-standard.mjs";
import { evaluateStoreRequest } from "../../src/requests/store-request.mjs";
import { findSku } from "../../src/evaluation/catalog.mjs";
import { EXAMPLE_CLOCK, EXAMPLE_RELEASE, machineOutputs } from "../../scripts/build-contract-examples.mjs";
import { recordedCatalog, RECORDED_STORE_PIN } from "../fixtures/recorded-catalog.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const json = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const evidence = (name) => json(`acceptance/project-1/from-evidence/${name}`);
const at = { release: EXAMPLE_RELEASE, catalog: recordedCatalog(), now: () => EXAMPLE_CLOCK };
const PROJECT_1 = json("contracts/examples/packets/project-1.accepted.json");
const SECOND = json("contracts/examples/packets/second-job.accepted.json");
const machine = loadMachineConfig();
const lower = (packet, options = {}) => lowerJobPacket(structuredClone(packet), { ...at, ...options });

// SHA-256 values from D001_Project1_Evidence.zip MANIFEST.json.
const MANIFEST = {
  "local-job.json": "5d7fbdf12566f1e7d31f68cbdffd51c25215e5de415d953497b756f6553aa540",
  "motion-ir.json": "236f6ee36f567a295669c1211836bca3704e04c1d5ea54dcee5d9e04fa946f8c",
  "virtual-trace.json": "04f766108e5a426cd81c0ccb473d74f89a93bc0e76aabd7355bd4b28b956ed9f",
  "physical-admission.json": "5bf5e1e2a92cfb5c354b6dbc203deb65d79cd94beb75ae2f2875544b9ac95607",
  "proof-results.json": "5b7d1bc7259fc19cf20a9785677c86da9bde1beec7f0adf0037e839a0a3a10bc",
  "hypothetical-60-in-check.json": "11d1df1a1a73e772e3cd3721b1ffe8e20f22b6f21067317eba542b0f851073ab"
};

const p1 = machineOutputs(PROJECT_1);

test("the review's machine artifacts are the review's files, byte for byte", () => {
  for (const [name, sha256] of Object.entries(MANIFEST)) {
    assert.equal(createHash("sha256").update(readFileSync(join(ROOT, "acceptance/project-1/from-evidence", name))).digest("hex"), sha256, name);
  }
});

test("Project 1 lowers to the review's local job: every operation, the contact audit and the release blockers", () => {
  const review = evidence("local-job.json");
  assert.deepEqual(p1.localJob.operations, review.operations);
  assert.deepEqual(p1.localJob.contacts, review.contacts);
  assert.deepEqual(p1.localJob.releaseBlockers, review.releaseBlockers);
  for (const key of ["definitionId", "definitionRevision", "demandHash", "machineConfigId", "executionClass", "physicalAuthority"]) {
    assert.deepEqual(p1.localJob[key], review[key], key);
  }
  // The Store identity is this Store's, never the old pin's.
  assert.equal(p1.localJob.storeRelease, EXAMPLE_RELEASE);
  assert.notDeepEqual(p1.localJob.storeCalculationIdentity, review.storeCalculationIdentity);
  assert.deepEqual(p1.localJob.selectedMaterial, { storeSku: "STB-ZERO-PTAG-2X4-72-001", actualT: 1.5, actualW: 3.5, stockL_in: 72, parentLengthIn: 72 });
});

test("Project 1 produces the review's 45 command records, every field of every record", () => {
  const review = evidence("motion-ir.json");
  assert.equal(p1.records.sequence.length, 45);
  assert.deepEqual(p1.records.sequence, review.sequence);
  assert.deepEqual(p1.records.units, review.units);
  assert.equal(p1.records.executionClass, review.executionClass);
});

test("Project 1's virtual run is the review's: 86.469536 s, 21 axis moves, the same trace", () => {
  const review = evidence("virtual-trace.json");
  assert.equal(p1.run.status, "VIRTUAL_MODEL_COMPLETE");
  assert.equal(p1.run.timeSec, 86.46953628299116);
  assert.equal(p1.run.timeSec, review.timeSec);
  assert.equal(p1.run.motionCommands, 21);
  assert.deepEqual(p1.run.trace, review.trace);
  // The virtual benchmark and the Store's modeled time are related models, kept distinct: 86.469536 vs 85.5001 s.
  const storeSec = PROJECT_1.storeAnswer.estimate.travel.time.T_MACHINE_sec;
  assert.equal(storeSec, 85.5001);
  assert.ok(Math.abs(p1.run.timeSec - storeSec - 0.969436282991154) < 1e-9);
});

test("Project 1's physical admission is the review's: BLOCKED, every blocker named, zero motion", () => {
  assert.deepEqual(p1.admission, evidence("physical-admission.json"));
});

test("every output has its exact shape", () => {
  for (const out of [p1, machineOutputs(SECOND)]) {
    assert.deepEqual(shapeProblems(out.localJob, LOCAL_JOB_SHAPE, "LOCAL_JOB"), []);
    assert.deepEqual(shapeProblems(out.records, MOTION_RECORDS_SHAPE, "MOTION"), []);
    assert.deepEqual(shapeProblems(out.run, VIRTUAL_RUN_SHAPE, "RUN"), []);
    assert.deepEqual(shapeProblems(out.admission, PHYSICAL_ADMISSION_SHAPE, "ADMISSION"), []);
  }
});

// The review's fourteen checks (proof-results.json), each answered here or named as System's.
test("the review's fourteen checks: thirteen are proved by Store, one is System's", () => {
  const names = evidence("proof-results.json").tests.map((t) => t.name);
  assert.equal(names.length, 14);
  assert.ok(names.includes("Outside-range and off-grid length rejected by System rule"), "check 6 is the System rule's (H02), proved in System");
});

test("check 2 — the 18 in definition has 9 in spots and the Store answers Q $11.09", () => {
  assert.ok(PROJECT_1.definition.demand.parts.every((p) => p.lengthIn === 18 && p.features[0].xIn === 9));
  assert.equal(PROJECT_1.storeAnswer.estimate.totals.Q, 11.09);
});

test("check 3 — a hypothetical 60 in workpiece fails the retained-length rule; the offered 72 in parent is selected", () => {
  const item = findSku(recordedCatalog(), PROJECT_1.storeAnswer.materialResolution.storeSku);
  const d = PROJECT_1.definition.demand;
  const r = evaluateD001UserDefinedBoard({
    item: { ...item, stockL_in: 60 },
    storeRevision: RECORDED_STORE_PIN,
    demand: { configurationId: d.configurationId, configurationVersion: d.configurationVersion, classId: d.classId, definedWorkpieceLengthIn: 60, cut: { angleDeg: d.sawAngleDeg, plane: "miter-face", kerfIn: 0.125 }, datumC: { method: "REFERENCE_CUT", stationId: "SAW-L" }, parts: d.parts, declaredSawCuts: 3, declaredSpotCount: 2, unresolvedConditions: [] }
  });
  assert.equal(r.status, "REFUSED");
  assert.ok(r.reasons.includes("LAST_REMAIN_BELOW_TWO_ROLLER_CONTROL"));
  assert.deepEqual(JSON.parse(JSON.stringify(r)), evidence("hypothetical-60-in-check.json").result);
  assert.equal(PROJECT_1.storeAnswer.materialResolution.workpieceLengthIn, 72);
});

test("check 4 — forward spot placement: each index target plus the feature coordinate is the spot station", () => {
  for (const job of [p1.localJob, machineOutputs(SECOND).localJob]) {
    job.operations.forEach((op, i) => {
      if (op.kind !== "SPOT_ON_LOCATION") return;
      assert.ok(Math.abs(job.operations[i - 1].toCIn + op.workpieceFeatureXIn - machine.stations.spot.xIn) < 1e-9, op.opId);
    });
  }
});

test("check 5 — all 17 admitted lengths propagate through the Store: SUPPORTABLE, three saw cuts, two spots", () => {
  const d = PROJECT_1.definition.demand;
  for (let i = 0; i <= 16; i += 1) {
    const L = 16 + i / 8;
    const demand = { ...d, sawAngleDeg: (Math.asin(8 / L) * 180) / Math.PI, parts: d.parts.map((p) => ({ ...p, lengthIn: L, features: p.features.map((f) => ({ ...f, xIn: L / 2 })) })) };
    const a = evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId: `L-${L}`, demand }, at);
    assert.equal(a.status, "SUPPORTABLE", `${L}`);
    assert.equal(a.estimate.travel.derivedSawCuts, 3);
    assert.equal(a.estimate.travel.derivedSpotCount, 2);
  }
});

test("check 7 — a changed definition cannot reuse the earlier answer: no local job", () => {
  const changed = structuredClone(PROJECT_1);
  changed.definition.demand.parts[0].lengthIn = 16;
  assert.deepEqual(lower(changed), { status: "REFUSED", reasonCodes: ["PACKET_DEMAND_CHANGED"] });
});

test("check 8 — an altered calculation identity is refused", () => {
  const altered = structuredClone(PROJECT_1);
  altered.storeAnswer.calculationIdentity.resultHash = "0".repeat(64);
  assert.equal(lower(altered).status, "REFUSED");
});

test("check 9 — a wrong job identity stops before any motion", () => {
  const run = runVirtual(p1.records, { expected: { ...p1.records.binding, packetId: "SOMEONE-ELSES-JOB" } });
  assert.deepEqual([run.status, run.reason, run.motionCommands], ["REFUSED", "JOB_IDENTITY_MISMATCH", 0]);
});

test("check 10 — a position fault stops the run before the following tool command", () => {
  const firstVerify = p1.records.sequence.find((r) => r.kind === "VERIFY_X").seq;
  const run = runVirtual(p1.records, { expected: p1.records.binding, faults: { slipAtSeq: firstVerify } });
  assert.deepEqual([run.status, run.reason], ["FAULT", "POSITION_INVALID"]);
  assert.ok(run.trace.every((t) => t.seq < firstVerify));
});

test("check 11 — an unconfirmed tool retract stops the run before the next index", () => {
  const retract = p1.records.sequence.find((r) => r.kind === "MOVE" && r.axis === "S" && r.target === 0).seq;
  const run = runVirtual(p1.records, { expected: p1.records.binding, faults: { retractUnconfirmedAtSeq: retract } });
  assert.deepEqual([run.status, run.reason], ["FAULT", "TOOL_RETRACT_UNCONFIRMED"]);
  assert.ok(!run.trace.some((t) => t.kind === "MOVE_C"));
});

test("check 12 — the contact audit finds the single-roller states", () => {
  assert.ok(p1.localJob.contacts.some((c) => c.kind === "SPOT_ON_LOCATION" && !c.R1 && c.R2));
  assert.ok(p1.localJob.contacts.some((c) => c.kind === "MITER_CUTOFF" && c.R1 && !c.R2));
});

test("check 13 — the finite kerf is not erased by relabelling: the retained-face blocker stays", () => {
  assert.equal(p1.localJob.kerfIn, 0.125);
  assert.ok(p1.records.sequence.filter((r) => r.kind === "CAPTURE_C").every((r) => r.assumption === "NOMINAL_ZERO_REBASE"));
  assert.ok(p1.admission.reasons.includes("KERF_FACE_AND_REBASE_UNRESOLVED"));
});

test("check 14 — physical admission remains blocked with zero motion", () => {
  assert.equal(p1.localJob.physicalAuthority, false);
  assert.deepEqual([p1.admission.status, p1.admission.motionCommands], ["BLOCKED", 0]);
});

test("a tool-down index is rejected by the model", () => {
  const records = structuredClone(p1.records);
  const firstIndex = records.sequence.findIndex((r) => r.kind === "MOVE_C");
  records.sequence.splice(firstIndex, 0,
    { seq: 0, kind: "SET_SPOT", target: 1, source: "INJECTED" },
    { seq: 0, kind: "MOVE", axis: "Z", target: 1.4, velocity: 2, acceleration: 16, source: "INJECTED" });
  records.sequence.forEach((r, i) => { r.seq = i + 1; });
  records.binding.motionHash = motionContentHash(records);
  assert.equal(runVirtual(records, { expected: records.binding }).reason, "INDEX_WITH_TOOL_DOWN");
});

test("a second, different job runs through the same code: not a Project 1 replay", () => {
  const out = machineOutputs(SECOND);
  assert.equal(SECOND.storeAnswer.status, "SUPPORTABLE");
  assert.equal(out.localJob.selectedMaterial.storeSku, "STB-ZERO-SPF-2X6-96-001");
  assert.equal(out.localJob.selectedMaterial.actualW, 5.5);
  assert.equal(out.localJob.miterAngleDeg, 15);
  assert.notEqual(out.records.sequence.length, 45);
  // Every command traces to a Store operation or a named machine allowance.
  const opIds = new Set(out.localJob.operations.map((o) => o.opId));
  const allowances = new Set(["STORE_HANDLING_LOAD", "DEFINITION_ANGLE", "REFERENCE_ANGLE_SETTLE", "REFERENCE_CLAMP", "REFERENCE_END", "STORE_HANDLING_RELEASE"]);
  assert.ok(out.records.sequence.every((r) => opIds.has(r.source) || allowances.has(r.source)));
  // Every Store operation is carried into commands.
  const sources = new Set(out.records.sequence.map((r) => r.source));
  assert.ok([...opIds].filter((id) => !id.startsWith("OP-REBASE")).every((id) => sources.has(id)));
  // The centred and the inset spots are placed across the 5.5 in board from the Store's plan, not from Project 1.
  assert.deepEqual(out.records.sequence.filter((r) => r.axis === "Y").map((r) => r.target), [2.75, 1.5]);
  const stroke = out.records.sequence.find((r) => r.assumption === "UNVERIFIED_SAW_STROKE").target - machine.axes.S.approachIn;
  assert.ok(Math.abs(stroke - 5.5 / Math.cos((15 * Math.PI) / 180)) < 1e-12);
  assert.equal(out.run.status, "VIRTUAL_MODEL_COMPLETE");
  assert.ok(out.run.timeSec > 0 && out.run.timeSec !== p1.run.timeSec);
  assert.equal(out.admission.status, "BLOCKED");
});

test("a packet that is stale, of an unregistered type, or for a different tool is not lowered", () => {
  const repriced = recordedCatalog();
  const row = repriced.offerings.find((o) => o.storeSku === "STB-ZERO-PTAG-2X4-72-001");
  row.list_reference = 5.29;
  row.assertions.externalListPrice = { ...row.assertions.externalListPrice, value: 5.29 };
  row.sellingPrice = 5.55;
  assert.deepEqual(lower(PROJECT_1, { catalog: repriced }), { status: "STALE", reasonCodes: ["PACKET_STORE_ANSWER_NOT_CURRENT"] });

  // A verified packet of a type the D-001 lowering does not register is refused by the lowering, by name.
  const sheet = json("contracts/examples/requests/sheet-package.playhouse.json");
  const sheetPacket = {
    ...structuredClone(PROJECT_1),
    definition: { definitionId: "PLAYHOUSE", revisionId: "PLAYHOUSE-v1", requestType: "SHEET_PACKAGE_V1", demand: sheet.demand },
    storeAnswer: JSON.parse(JSON.stringify(evaluateStoreRequest(sheet, at)))
  };
  assert.deepEqual(lower(sheetPacket), { status: "REFUSED", reasonCodes: ["LOWERING_NOT_REGISTERED_FOR:SHEET_PACKAGE_V1"] });

  const otherTool = { ...machine, tooling: { spot: { diameterIn: 0.25, pointAngleDeg: 118 } } };
  assert.deepEqual(lower(PROJECT_1, { machine: otherTool }), { status: "REFUSED", reasonCodes: ["SPOT_TOOL_DIFFERS_FROM_STORE_PLAN"] });
  assert.throws(() => motionRecords(p1.localJob, { ...machine, machineConfigId: "ANOTHER-CELL" }));
});

test("the committed machine examples are what the machine side produces", () => {
  for (const [name, packet] of [["project-1", PROJECT_1], ["second-job", SECOND]]) {
    const out = machineOutputs(packet);
    assert.deepEqual(json(`contracts/examples/machine/${name}.local-job.json`), JSON.parse(JSON.stringify(out.localJob)));
    assert.deepEqual(json(`contracts/examples/machine/${name}.motion-records.json`), JSON.parse(JSON.stringify(out.records)));
    assert.deepEqual(json(`contracts/examples/machine/${name}.physical-admission.json`), out.admission);
  }
});
