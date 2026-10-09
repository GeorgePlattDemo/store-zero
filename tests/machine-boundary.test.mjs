import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculationHash } from "../src/evaluation/engine/d001-travel-standard.mjs";
import { evaluateStoreRequest } from "../src/requests/store-request.mjs";
import { packetProblems, verifyJobPacket } from "../src/contracts/job-packet.mjs";
import { lowerJobPacket, motionRecords, loadMachineConfig } from "../src/machine/lowering.mjs";
import { machineConfigHash } from "../src/machine/configuration.mjs";
import { evaluateMachineEvidence, machineEvidenceIdentity } from "../src/machine/evidence.mjs";
import { physicalAdmission, runVirtual } from "../src/machine/virtual-run.mjs";
import { localJobContentHash, motionContentHash } from "../src/contracts/machine-records.mjs";
import { machineOutputs, EXAMPLE_RELEASE, EXAMPLE_CLOCK } from "../scripts/build-contract-examples.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";

const packet = JSON.parse(readFileSync(new URL("../contracts/examples/packets/project-1.accepted.json", import.meta.url)));
const at = { release: EXAMPLE_RELEASE, now: () => EXAMPLE_CLOCK, catalog: recordedCatalog() };
const out = machineOutputs(packet);
const edit = (value, fn) => { const copy = structuredClone(value); fn(copy); return copy; };

for (const [name, fn] of [
  ["missing requirements", (p) => { delete p.definition.requirements; }],
  ["missing end relation", (p) => { delete p.definition.requirements.endRelation; }],
  ["null length datum", (p) => { p.definition.requirements.lengthDatum = null; }],
  ["blank decision id", (p) => { p.decision.decisionId = "  "; }],
  ["blank revision id", (p) => { p.definition.revisionId = ""; }],
  ["invalid timestamp", (p) => { p.decision.decidedAt = "banana"; }],
  ["impossible date", (p) => { p.decision.decidedAt = "2026-02-30T12:00:00.000Z"; }]
]) test(`packet validation refuses ${name} before lowering`, () => {
  const altered = edit(packet, fn);
  assert.ok(packetProblems(altered).length);
  assert.equal(verifyJobPacket(altered, at).status, "REFUSED");
  assert.equal(lowerJobPacket(altered, at).status, "REFUSED");
});

for (const [key, value, reason] of [
  ["endRelation", "NONPARALLEL", "END_RELATION_NOT_PRICED:NONPARALLEL"],
  ["lengthDatum", "SHORT_SHORT", "LENGTH_DATUM_NOT_PRICED:SHORT_SHORT"],
  ["endIdentity", "OTHER", "END_IDENTITY_NOT_PRICED"]
]) test(`unsupported ${key} cannot silently produce the same commands`, () => {
  // Requirements that differ from the definition Store priced are refused before lowering, and a definition that
  // states this geometry is refused by Store itself, so no verified packet carries it. The lowerer's own
  // *_NOT_REGISTERED_ON_MACHINE check stays behind both as a second line.
  const altered = edit(packet, (p) => { p.definition.requirements[key] = value; });
  const result = lowerJobPacket(altered, at);
  assert.equal(result.status, "REFUSED");
  assert.deepEqual(result.reasonCodes, ["PACKET_REQUIREMENTS_DIFFER_FROM_DEFINITION"]);
  assert.equal(result.localJob, undefined);
  const stated = evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId: "GEOMETRY", demand: { ...packet.definition.demand, [key]: value } }, at);
  assert.deepEqual([stated.status, stated.materialResolution.reason], ["REFUSED", reason]);
});

test("verification is Store consistency, not authentication of System acceptance", () => {
  const changedProject = edit(packet, (p) => { p.project.projectId = "ANOTHER-PROJECT"; });
  assert.equal(verifyJobPacket(changedProject, at).status, "VERIFIED");
  const local = lowerJobPacket(changedProject, at).localJob;
  assert.notEqual(local.packetHash, out.localJob.packetHash);
  assert.notEqual(local.localJobHash, out.localJob.localJobHash);
});

for (const [name, fn] of [
  ["null configuration", () => null],
  ["physical authority", (m) => { m.physicalAuthority = true; }],
  ["missing axis", (m) => { delete m.axes.X; }],
  ["missing velocity", (m) => { delete m.axes.Z.processInPerSec; }],
  ["zero acceleration", (m) => { m.axes.X.accelerationInPerSec2 = 0; }],
  ["nonfinite velocity", (m) => { m.axes.Y.velocityInPerSec = Infinity; }],
  ["changed axis with same id", (m) => { m.axes.X.velocityInPerSec = 9; }],
  ["changed saw coordinate", (m) => { m.stations.saw.xIn = 1; }],
  ["changed spot coordinate", (m) => { m.stations.spot.xIn = 40; }],
  ["changed contact coordinate", (m) => { m.stations.contacts[0].xIn = 25; }],
  ["missing tool diameter", (m) => { delete m.tooling.spot.diameterIn; }],
  ["changed tool point", (m) => { m.tooling.spot.pointAngleDeg = 120; }],
  ["missing allowance", (m) => { delete m.allowancesSec.clamp; }],
  ["negative allowance", (m) => { m.allowancesSec.loadSeat = -1; }],
  ["removed blockers", (m) => { m.releaseBlockers = []; }],
  ["wrong units", (m) => { m.units.linear = "mm"; }]
]) test(`injected machine configuration refuses ${name}`, () => {
  const m = loadMachineConfig();
  const replaced = fn(m);
  const machine = replaced === null ? null : m;
  assert.equal(lowerJobPacket(packet, { ...at, machine }).status, "REFUSED");
  assert.throws(() => motionRecords(out.localJob, machine));
});

for (const [name, fn] of [
  ["empty sequence", (r) => { r.sequence = []; }],
  ["unknown command", (r) => { r.sequence[0].kind = "UNKNOWN_COMMAND"; }],
  ["null command", (r) => { r.sequence[0] = null; }],
  ["missing completion", (r) => { r.sequence.pop(); }],
  ["early completion", (r) => { r.sequence[0].kind = "COMPLETE"; r.sequence[0].target = 0; }],
  ["duplicate sequence number", (r) => { r.sequence[1].seq = 1; }],
  ["blank source", (r) => { r.sequence[0].source = ""; }],
  ["missing positions", (r) => { delete r.initialPositions; }],
  ["null units", (r) => { r.units = null; }],
  ["missing tool clearance", (r) => { delete r.toolClearZ; }],
  ["wrong physical authority", (r) => { r.physicalAuthority = true; }],
  ["missing config hash", (r) => { delete r.binding.machineConfigHash; }],
  ["missing velocity", (r) => { delete r.sequence.find((c) => c.kind === "MOVE").velocity; }],
  ["negative velocity", (r) => { r.sequence.find((c) => c.kind === "MOVE").velocity = -1; }],
  ["zero acceleration", (r) => { r.sequence.find((c) => c.kind === "MOVE").acceleration = 0; }],
  ["unknown axis", (r) => { r.sequence.find((c) => c.kind === "MOVE").axis = "Q"; }],
  ["nonfinite target", (r) => { r.sequence.find((c) => c.kind === "MOVE").target = Infinity; }],
  ["negative delay", (r) => { r.sequence[0].seconds = -1; }],
  ["changed command content", (r) => { r.sequence.find((c) => c.kind === "MOVE").target += 1; }]
]) test(`virtual runner refuses ${name} with zero executed moves`, () => {
  const altered = edit(out.records, fn);
  const run = runVirtual(altered, { expected: out.records.binding });
  assert.equal(run.status, "REFUSED");
  assert.equal(run.motionCommands, 0);
  assert.equal(run.physicalAuthority, false);
});

test("missing records are a refusal rather than an exception", () => {
  assert.equal(runVirtual(null).status, "REFUSED");
  assert.equal(runVirtual(undefined).status, "REFUSED");
  assert.equal(physicalAdmission(null).status, "BLOCKED");
});

test("valid records require the full expected binding, not just the three old ids", () => {
  const { packetId, demandHash, machineConfigId } = out.records.binding;
  assert.equal(runVirtual(out.records, { expected: { packetId, demandHash, machineConfigId } }).status, "REFUSED");
  const changed = { ...out.records.binding, packetHash: "0".repeat(64) };
  assert.equal(runVirtual(out.records, { expected: changed }).status, "REFUSED");
});

test("runtime completes only with tools off and retracted", () => {
  const records = edit(out.records, (r) => { r.sequence.findLast((c) => c.kind === "SET_SPOT").target = 1; });
  records.binding.motionHash = motionContentHash(records);
  assert.equal(runVirtual(records, { expected: records.binding }).reason, "COMPLETE_WITH_TOOL_ACTIVE");
});

test("finite operands that overflow the time model fault, never complete", () => {
  const records = edit(out.records, (r) => { const c = r.sequence.find((c) => c.kind === "MOVE"); c.target = Number.MAX_VALUE; c.velocity = Number.MIN_VALUE; c.acceleration = Number.MIN_VALUE; });
  records.binding.motionHash = motionContentHash(records);
  assert.equal(runVirtual(records, { expected: records.binding }).reason, "MOTION_MODEL_OVERFLOW");
});

for (const [name, fn] of [
  ["absent local job", () => null],
  ["empty operations", (j) => { j.operations = []; }],
  ["unknown operation", (j) => { j.operations[0].kind = "INVENTED"; }],
  ["missing material", (j) => { delete j.selectedMaterial; }],
  ["null operation", (j) => { j.operations[0] = null; }],
  ["changed operation", (j) => { j.operations[0].angleDeg = 1; }]
]) test(`motion generation refuses ${name}`, () => {
  const job = structuredClone(out.localJob);
  const replaced = fn(job);
  assert.throws(() => motionRecords(replaced === null ? null : job));
});

test("valid lowering binds the complete packet, configuration and local job content", () => {
  assert.equal(out.localJob.machineConfigHash, machineConfigHash(loadMachineConfig()));
  assert.equal(out.localJob.localJobHash, localJobContentHash(out.localJob));
  assert.equal(out.records.binding.localJobHash, out.localJob.localJobHash);
  assert.equal(out.records.binding.motionHash, motionContentHash(out.records));
});

const request = () => ({ packet: structuredClone(packet), expectedMachineConfigId: loadMachineConfig().machineConfigId, expectedMachineConfigHash: machineConfigHash(loadMachineConfig()) });

test("the bounded evidence interface produces all four valid records and keeps physical admission blocked", () => {
  const result = evaluateMachineEvidence(request(), at);
  assert.equal(result.status, "VIRTUAL_EVIDENCE_READY");
  assert.deepEqual(result.localJob, out.localJob);
  assert.deepEqual(result.records, out.records);
  assert.deepEqual(result.run, out.run);
  assert.deepEqual(result.admission, out.admission);
  assert.equal(machineEvidenceIdentity().physicalAuthority, false);
});

test("evidence refuses caller configuration overrides, mismatches and malformed packets", () => {
  assert.equal(evaluateMachineEvidence({ ...request(), machine: loadMachineConfig() }, at).status, "REFUSED");
  assert.equal(evaluateMachineEvidence({ ...request(), expectedMachineConfigHash: "0".repeat(64) }, at).status, "REFUSED");
  assert.equal(evaluateMachineEvidence({ ...request(), packet: null }, at).status, "REFUSED");
  assert.equal(evaluateMachineEvidence({ ...request(), packet: edit(packet, (p) => { delete p.definition.requirements; }) }, at).status, "REFUSED");
});

for (const [name, fn] of [
  ["cutoff transform", (j) => { j.operations.find((op) => op.kind === "MITER_CUTOFF").partLengthIn += 1; }],
  ["spot transform", (j) => { j.operations.find((op) => op.kind === "SPOT_ON_LOCATION").workpieceFeatureXIn += 1; }],
  ["operation order", (j) => { j.operations[2].kind = "MITER_CUTOFF"; }]
]) test(`a recomputed local hash cannot authorize an invalid ${name}`, () => {
  const job = edit(out.localJob, fn);
  job.localJobHash = localJobContentHash(job);
  assert.throws(() => motionRecords(job));
});

test("a terminal marker alone is not a completed reference job", () => {
  const records = edit(out.records, (r) => { r.sequence = [{ seq: 1, kind: "COMPLETE", target: 0, source: "REFERENCE_END" }]; });
  records.binding.motionHash = motionContentHash(records);
  assert.equal(runVirtual(records, { expected: records.binding }).reason, "COMPLETE_WITHOUT_WORK");
});

test("a saw stroke with its tool command removed faults before tool motion", () => {
  const records = edit(out.records, (r) => { r.sequence.find((c) => c.kind === "SET_SAW").target = 0; });
  records.binding.motionHash = motionContentHash(records);
  const result = runVirtual(records, { expected: records.binding });
  assert.equal(result.reason, "SAW_STROKE_WITH_TOOL_OFF");
  assert.ok(!result.trace.some((c) => c.axis === "S"));
});

for (const [name, fn, reason] of [
  ["invalid receipt time", (r) => { r.evaluatedAt = "banana"; }, "PACKET_RECEIPT_ALTERED"],
  ["wrong receipt status", (r) => { r.status = "REFUSED"; }, "PACKET_RECEIPT_ALTERED"],
  ["unregistered freshness rule", (r) => { r.freshnessRule = "OTHER"; }, "PACKET_RECEIPT_ALTERED"],
  ["invented authority hash", (r) => { r.authority.catalogHash = "0".repeat(64); }, "PACKET_STORE_AUTHORITY_NOT_CURRENT"],
  ["extra receipt field", (r) => { r.invented = true; }, "PACKET_RECEIPT_ALTERED"]
]) test(`recomputed receipt hash cannot conceal ${name}`, () => {
  const changed = edit(packet, (p) => { fn(p.storeAnswer.evaluationReceipt); });
  const { receiptHash, ...core } = changed.storeAnswer.evaluationReceipt;
  changed.storeAnswer.evaluationReceipt.receiptHash = calculationHash(core);
  assert.ok(verifyJobPacket(changed, at).reasonCodes.includes(reason));
  assert.equal(lowerJobPacket(changed, at).localJob, undefined);
});

test("acceptance cannot precede the answer it claims to accept", () => {
  const changed = edit(packet, (p) => { p.decision.decidedAt = "2026-10-08T11:59:00.000Z"; });
  assert.deepEqual(verifyJobPacket(changed, at), { status: "REFUSED", reasonCodes: ["PACKET_DECISION_PRECEDES_ANSWER"] });
});

test("all admitted eighth-inch lengths and fractional precision still lower and run honestly", () => {
  for (const length of [...Array.from({ length: 17 }, (_, i) => 16 + i / 8), 16.123456789]) {
    const job = edit(packet, (p) => {
      p.definition.demand.sawAngleDeg = Math.asin(8 / length) * 180 / Math.PI;
      p.definition.demand.parts.forEach((part) => { part.lengthIn = length; part.features.forEach((f) => { f.xIn = length / 2; }); });
    });
    job.storeAnswer = JSON.parse(JSON.stringify(evaluateStoreRequest({ requestType: job.definition.requestType, requestId: `PRECISION-${length}`, demand: job.definition.demand }, at)));
    assert.equal(job.storeAnswer.status, "SUPPORTABLE");
    const lowered = lowerJobPacket(job, at);
    assert.equal(lowered.status, "LOWERED", `${length}: ${lowered.reasonCodes}`);
    const records = motionRecords(lowered.localJob);
    assert.equal(runVirtual(records, { expected: records.binding }).status, "VIRTUAL_MODEL_COMPLETE", `${length}`);
  }
});
