// Authority integrity. Every Store answer has exactly one path: service → request layer → catalog → evaluator →
// receipt; every piece of machine evidence has exactly one path: service → evidence → packet verification (which
// re-evaluates through the request layer) → lowering → virtual run. These tests prove the structure and then try,
// over HTTP, to get an answer or evidence any other way. Every attempt must fail closed.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHandler, PATHS } from "../../src/service/server.mjs";
import { calculationHash } from "../../src/evaluation/engine/d001-travel-standard.mjs";
import { loadCatalog } from "../../src/evaluation/catalog.mjs";
import { machineEvidenceIdentity } from "../../src/machine/evidence.mjs";
import { project1Packet, REQUEST_EXAMPLES } from "../../scripts/build-contract-examples.mjs";
import { project1Demand } from "../../tests/fixtures/project-1.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((name) => {
  const path = `${dir}/${name}`;
  return statSync(join(ROOT, path)).isDirectory() ? walk(path) : path.endsWith(".mjs") ? [path] : [];
});
const SRC = walk("src");
const source = (path) => readFileSync(join(ROOT, path), "utf8");
const importsOf = (path) => [...source(path).matchAll(/^\s*(?:import|export)[^"']*?from\s+["']([^"']+)["']/gm)]
  .map((m) => m[1]).filter((s) => !s.startsWith("node:")).map((s) => relative(ROOT, join(ROOT, path, "..", s)));
const importersOf = (target) => SRC.filter((path) => importsOf(path).includes(target));

// ---------------------------------------------------------------- structure: one path, one definition

test("evaluators and offering lookup are reached only through the request layer", () => {
  for (const module of [...walk("src/evaluation/evaluators"), "src/requests/offering-lookup.mjs"]) {
    assert.deepEqual(importersOf(module), ["src/requests/store-request.mjs"], module);
  }
});

test("the pricing engine is reached only by the evaluator it prices for", () => {
  assert.deepEqual(importersOf("src/evaluation/engine/pricing.mjs"), ["src/evaluation/evaluators/user-defined-board.mjs"]);
});

test("the service carries requests: it reaches answers only through the request layer and the evidence entry point", () => {
  assert.deepEqual(importsOf("src/service/server.mjs").sort(), ["src/evaluation/catalog.mjs", "src/machine/evidence.mjs", "src/requests/store-request.mjs"]);
  // The catalog import is for /health's validation only; no answer is built from it in the service.
  assert.ok(!/evaluate(Dimensional|CutPackage|SheetPackage)|lookupOfferings|sellingPrice/.test(source("src/service/server.mjs")));
});

test("machine evidence re-evaluates through the request layer before anything is lowered", () => {
  assert.deepEqual(importersOf("src/machine/lowering.mjs"), ["src/machine/evidence.mjs"]);
  assert.ok(importsOf("src/machine/lowering.mjs").includes("src/contracts/job-packet.mjs"));
  assert.ok(importsOf("src/contracts/job-packet.mjs").includes("src/requests/store-request.mjs"));
  const body = source("src/machine/lowering.mjs").split("export function lowerJobPacket")[1];
  assert.ok(body.indexOf("verifyJobPacket(") > -1 && body.indexOf("verifyJobPacket(") < body.indexOf("requestType"), "verification comes first");
  const verify = source("src/contracts/job-packet.mjs").split("export function verifyJobPacket")[1];
  assert.ok(verify.includes("evaluateStoreRequest("), "the packet's answer is compared with a fresh evaluation");
});

test("Store data is read in one place each, and nothing in src reads examples, fixtures or recordings", () => {
  const readers = SRC.filter((path) => /readFileSync|readdirSync/.test(source(path))).sort();
  assert.deepEqual(readers, ["src/evaluation/catalog.mjs", "src/machine/configuration.mjs", "src/service/server.mjs"]);
  for (const path of SRC) assert.ok(!/["'`][^"'`\n]*(contracts\/examples|acceptance\/|tests\/|\.jsonl)/.test(source(path)), `${path} reaches stored results`);
  // The service reads its own files only to digest them.
  assert.match(source("src/service/server.mjs"), /function sourceDigest/);
});

test("one receipt builder, one grade rule, one board geometry, one selling price", () => {
  const where = (pattern) => SRC.filter((path) => pattern.test(source(path))).sort();
  assert.deepEqual(where(/receiptHash: calculationHash/), ["src/requests/store-request.mjs"]);
  assert.deepEqual(where(/freshEvaluation: true/), ["src/requests/store-request.mjs"]);
  assert.deepEqual(where(/"GRADE_CHOICE_REQUIRED"/), ["src/evaluation/evaluators/cut-package.mjs", "src/evaluation/evaluators/user-defined-board.mjs"]);
  for (const path of where(/"GRADE_CHOICE_REQUIRED"/)) assert.match(source(path), /offeredGrades\(catalog/, `${path} decides grade through offeredGrades`);
  assert.deepEqual(where(/"long-long-outer-edge"|"parallel"/), ["src/evaluation/engine/d001-travel-standard.mjs"]);
  assert.deepEqual(where(/1 \+ markOn|\* \(1 \+/), ["src/evaluation/catalog.mjs"], "only the catalog validator derives a selling price; evaluators read it");
});

// ---------------------------------------------------------------- over HTTP: try every other way in

const CLOCK = "2026-10-09T00:00:00.000Z";
async function service(release, options = {}) {
  const handle = createHandler({ release, now: () => CLOCK, ...options });
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const send = async (path, body, method = "POST") => {
    const res = await fetch(base + path, { method, headers: { "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  return {
    ask: async (request) => (await send(PATHS.requests, request)).body.answer,
    evidence: async (packet, extra = {}) => (await send(PATHS.machineEvidence, { packet, ...expectedMachine(), ...extra })).body.answer,
    send,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}
const expectedMachine = () => {
  const m = machineEvidenceIdentity();
  return { expectedMachineConfigId: m.machineConfigId, expectedMachineConfigHash: m.machineConfigHash };
};
const P1 = () => ({ requestType: "USER_DEFINED_BOARD_V1", requestId: "AUTH-P1", demand: project1Demand() });
const packetFor = (answer, edit = (p) => p) => {
  const packet = { ...project1Packet(), storeAnswer: answer };
  packet.decision = { ...packet.decision, decidedAt: "2026-10-09T00:05:00.000Z" };
  packet.definition = { ...packet.definition, demand: project1Demand() };
  return edit(structuredClone(packet));
};
const noEvidence = (answer) => {
  assert.notEqual(answer.status, "VIRTUAL_EVIDENCE_READY");
  assert.equal(answer.physicalAuthority, false);
  for (const key of ["localJob", "records", "run", "admission"]) assert.equal(answer[key], undefined, `${key} produced`);
};

test("the control: Project 1 is answered fresh and its packet yields virtual evidence with physical admission blocked", async () => {
  const store = await service("release-a");
  try {
    const answer = await store.ask(P1());
    assert.equal(answer.status, "SUPPORTABLE");
    assert.equal(answer.estimate.totals.Q, 11.09);
    assert.equal(answer.freshEvaluation, true);
    assert.equal(answer.evaluationReceipt.authority.storeRevision, "release-a");
    const evidence = await store.evidence(packetFor(answer));
    assert.equal(evidence.status, "VIRTUAL_EVIDENCE_READY");
    assert.equal(evidence.admission.status, "BLOCKED");
    assert.equal(evidence.physicalAuthority, false);
  } finally {
    await store.close();
  }
});

test("bypass: a request cannot carry an answer, a receipt, a release or a date; no other path answers", async () => {
  const store = await service("release-a");
  try {
    const fresh = await store.ask(P1());
    for (const extra of [{ answer: fresh }, { evaluationReceipt: fresh.evaluationReceipt }, { storeRevision: "release-a" }, { evaluatedAt: CLOCK }, { estimate: fresh.estimate }]) {
      const refused = await store.ask({ ...P1(), ...extra });
      // An admission refusal, not an evaluation: no receipt, no calculation, no price.
      assert.deepEqual([refused.status, refused.freshEvaluation, refused.evaluationReceipt, refused.calculationIdentity], ["REFUSED", false, null, null]);
      assert.deepEqual(refused.reasonCodes, [`REQUEST_FIELD_NOT_DECLARED:${Object.keys(extra)[0]}`]);
      assert.equal(refused.estimate, undefined);
    }
    for (const path of ["/v1/answers", "/v1/quote", "/v1/evaluate", "/v1/requests/AUTH-P1", "/v1/prices", "/v1/catalog"]) {
      assert.equal((await store.send(path, P1())).status, 404, path);
    }
    assert.equal((await store.send(PATHS.requests, null, "GET")).status, 405);
  } finally {
    await store.close();
  }
});

test("a recorded quote cannot be reused: the old Store's sealed answer and a committed example answer give no evidence", async () => {
  const store = await service("release-a");
  try {
    const sealed = JSON.parse(readFileSync(join(ROOT, "acceptance/project-1/from-evidence/store-answer.json"), "utf8"));
    noEvidence(await store.evidence(packetFor(sealed)));
    const example = JSON.parse(readFileSync(join(ROOT, "contracts/examples/packets/project-1.accepted.json"), "utf8"));
    const reused = await store.evidence(example);
    noEvidence(reused);
    assert.deepEqual(reused.reasonCodes, ["PACKET_STORE_RELEASE_MISMATCH"]);
    // Asking twice is two evaluations, not one stored answer: each carries its own receipt for its own request.
    const first = await store.ask(P1());
    const second = await store.ask({ ...P1(), requestId: "AUTH-P1-AGAIN" });
    assert.notEqual(first.evaluationReceipt.receiptHash, second.evaluationReceipt.receiptHash);
    assert.equal(second.evaluationReceipt.requestId, "AUTH-P1-AGAIN");
  } finally {
    await store.close();
  }
});

test("a forged receipt is never accepted: consistent hashes do not make an edited answer this Store's", async () => {
  const store = await service("release-a");
  try {
    const answer = await store.ask(P1());
    const reseal = (a) => {
      const { receiptHash, ...core } = a.evaluationReceipt;
      const next = { ...core, calculationIdentity: a.calculationIdentity };
      a.evaluationReceipt = { ...next, receiptHash: calculationHash(next) };
      return a;
    };
    // Price edited, receipt recomputed to match.
    const cheaper = reseal(Object.assign(structuredClone(answer), { estimate: { ...answer.estimate, totals: { ...answer.estimate.totals, Q: 1 } } }));
    const altered = await store.evidence(packetFor(cheaper));
    noEvidence(altered);
    assert.deepEqual(altered.reasonCodes, ["PACKET_ANSWER_ALTERED"]);
    // Calculation identity forged as well, and resealed.
    const forged = structuredClone(cheaper);
    forged.calculationIdentity = { ...forged.calculationIdentity, resultHash: "0".repeat(64) };
    forged.estimate.calculationIdentity = forged.calculationIdentity;
    const stale = await store.evidence(packetFor(reseal(forged)));
    noEvidence(stale);
    assert.equal(stale.status, "STALE", "a forged calculation reads as not this Store's current answer, and yields nothing");
    // Receipt edited without resealing.
    const edited = structuredClone(answer);
    edited.evaluationReceipt.status = "SUPPORTABLE ";
    noEvidence(await store.evidence(packetFor(edited)));
  } finally {
    await store.close();
  }
});

test("a release mismatch is refused: an answer from one release is not evidence on another", async () => {
  const a = await service("release-a");
  const b = await service("release-b");
  try {
    const fromA = await a.ask(P1());
    const onB = await b.evidence(packetFor(fromA));
    noEvidence(onB);
    assert.deepEqual(onB.reasonCodes, ["PACKET_STORE_RELEASE_MISMATCH"]);
    // The service names its own release on every wrapper; a caller checking it would reject a mix-up.
    assert.equal((await b.send(PATHS.requests, P1())).body.storeRelease, "release-b");
  } finally {
    await a.close();
    await b.close();
  }
});

test("omitted manufacturing facts are asked for by the evaluator, never invented, and no price is given", async () => {
  const store = await service("release-a");
  const omit = (key) => { const d = project1Demand(); delete d[key]; return d; };
  const noGrade = () => { const d = project1Demand(); delete d.materialDemand.grade; return d; };
  try {
    for (const [demand, reason] of [
      [omit("sawAngleDeg"), "MITER_ANGLE_REQUIRED"], [omit("cutPlane"), "CUT_PLANE_REQUIRED"], [omit("datumCMethod"), "DATUM_C_ESTABLISHMENT_METHOD_REQUIRED"],
      [omit("requiredOps"), "REQUIRED_OPERATIONS_REQUIRED"], [omit("endRelation"), "END_RELATION_REQUIRED"], [omit("lengthDatum"), "LENGTH_DATUM_REQUIRED"], [noGrade(), "GRADE_CHOICE_REQUIRED"]
    ]) {
      const answer = await store.ask({ ...P1(), demand });
      // An evaluation (with its receipt), not an admission refusal, and no price.
      assert.deepEqual([answer.status, answer.freshEvaluation, answer.materialResolution.reason, answer.estimate], ["UNRESOLVED", true, reason, null], reason);
    }
    const cut = structuredClone(REQUEST_EXAMPLES["cut-package.alcove-pine"]);
    delete cut.demand.cutPackages[0].endCut;
    assert.deepEqual((await store.ask(cut)).packages[0].reasonCodes, ["END_CUT_ANGLE_REQUIRED"]);
    const sheet = structuredClone(REQUEST_EXAMPLES["sheet-package.playhouse"]);
    delete sheet.demand.returnAllPieces;
    assert.ok((await store.ask(sheet)).reasonCodes.includes("RETURN_ALL_PIECES_REQUIRED"));
    const unnamed = structuredClone(REQUEST_EXAMPLES["sheet-package.playhouse"]);
    unnamed.demand.sheet.thicknessIn = 0.75;
    assert.ok((await store.ask(unnamed)).reasonCodes.includes("SHEET_MATERIAL_CHOICE_REQUIRED"));
    // A mistyped fact is an admission refusal, distinct from an evaluation.
    const typed = await store.ask({ ...P1(), demand: { ...project1Demand(), sawAngleDeg: "26.39" } });
    assert.deepEqual([typed.status, typed.freshEvaluation, typed.reasonCodes], ["REFUSED", false, ["DEFINITION_FIELD_TYPE:sawAngleDeg:number"]]);
  } finally {
    await store.close();
  }
});

test("unsupported operations and geometry are refused or unresolved, never priced as something else", async () => {
  const store = await service("release-a");
  const withOps = (requiredOps) => ({ ...P1(), demand: { ...project1Demand(), requiredOps } });
  try {
    const routed = await store.ask(withOps(["MITER_LIMITED", "SPOT_ON_LOCATION", "ROUTE_PROFILE"]));
    assert.equal(routed.status, "REFUSED");
    assert.ok(routed.materialResolution.consideredCandidates.every((c) => c.reason.startsWith("OP_NOT_ON_OFFERING")));
    // Treated boards do not offer generic drilling: refused on every candidate, not priced as a spot.
    const drilled = await store.ask(withOps(["MITER_LIMITED", "SPOT_ON_LOCATION", "DRILL"]));
    assert.equal(drilled.status, "REFUSED");
    assert.ok(drilled.materialResolution.consideredCandidates.every((c) => c.reason === "OP_NOT_ON_OFFERING:DRILL"));
    assert.equal(drilled.estimate, null);
    for (const [key, value] of [["endRelation", "nonparallel"], ["lengthDatum", "short-short-outer-edge"], ["endIdentity", "miter-face-long-point"], ["datumCMethod", "SENSED_FACE"]]) {
      const answer = await store.ask({ ...P1(), demand: { ...project1Demand(), [key]: value } });
      assert.notEqual(answer.status, "SUPPORTABLE", key);
      assert.equal(answer.estimate?.totals?.Q ?? null, null, key);
    }
    const local = await store.ask({ ...P1(), demand: { ...project1Demand(), gcode: "G1 X10" } });
    assert.deepEqual([local.status, local.freshEvaluation, local.reasonCodes], ["REFUSED", false, ["MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED"]]);
  } finally {
    await store.close();
  }
});

test("machine evidence is never produced for an unverified packet or a caller-supplied machine artifact", async () => {
  const store = await service("release-a");
  try {
    const answer = await store.ask(P1());
    const cases = {
      declined: (p) => { p.decision.kind = "DECLINED"; return p; },
      "physical release claimed": (p) => { p.authority.physicalRelease = true; return p; },
      "definition changed": (p) => { p.definition.demand.parts[0].lengthIn = 17; return p; },
      "requirements differ": (p) => { p.definition.requirements.endRelation = "nonparallel"; return p; },
      "refused answer": (p) => { p.storeAnswer.status = "REFUSED"; return p; },
      "no answer": (p) => { delete p.storeAnswer; return p; }
    };
    for (const [name, edit] of Object.entries(cases)) {
      const result = await store.evidence(packetFor(answer, edit));
      noEvidence(result);
      assert.ok(["REFUSED", "STALE"].includes(result.status), name);
    }
    const planted = await store.send(PATHS.machineEvidence, { packet: packetFor(answer), ...expectedMachine(), localJob: {}, records: [] });
    noEvidence(planted.body.answer);
    const wrongMachine = await store.evidence(packetFor(answer), { expectedMachineConfigHash: "0".repeat(64) });
    noEvidence(wrongMachine);
    assert.deepEqual(wrongMachine.reasonCodes, ["MACHINE_CONFIGURATION_IDENTITY_MISMATCH"]);
  } finally {
    await store.close();
  }
});

test("a changed definition is a new calculation, and an unavailable or incapable offering is a governed result, not a fallback", async () => {
  const empty = loadCatalog();
  for (const row of empty.offerings.filter((o) => o.species === "syp-treated" && o.grade === "above-ground" && o.nominalW === 4)) row.onHand = 0;
  const store = await service("release-a");
  const dry = await service("release-a", { catalog: empty });
  try {
    const base = await store.ask(P1());
    const changed = await store.ask({ ...P1(), demand: { ...project1Demand(), parts: project1Demand().parts.map((p) => ({ ...p, lengthIn: 17, features: p.features.map((f) => ({ ...f, xIn: 8.5 })) })), sawAngleDeg: (Math.asin(8 / 17) * 180) / Math.PI } });
    assert.equal(changed.status, "SUPPORTABLE");
    assert.notEqual(changed.calculationIdentity.inputHash, base.calculationIdentity.inputHash);
    assert.notEqual(changed.evaluationReceipt.demandHash, base.evaluationReceipt.demandHash);
    // Out of stock: the chosen wood is unavailable; Store does not move to another grade or species.
    const out = await dry.ask(P1());
    assert.equal(out.status, "UNAVAILABLE");
    assert.equal(out.estimate, null);
    const gradeOf = (sku) => empty.offerings.find((o) => o.storeSku === sku).grade;
    assert.ok(out.materialResolution.consideredCandidates.length > 0);
    assert.ok(out.materialResolution.consideredCandidates.every((c) => gradeOf(c.storeSku) === "above-ground" && c.candidateStatus === "UNAVAILABLE"), "only the chosen grade is considered");
    // Incapable: oak cannot be edge-milled on this cell; the line is refused, the wood is not changed.
    const oak = structuredClone(REQUEST_EXAMPLES["cut-package.alcove-pine"]);
    for (const p of oak.demand.cutPackages) p.material.species = "oak";
    const refused = (await store.ask(oak)).packages.find((p) => p.finishedWidthIn);
    assert.equal(refused.status, "REFUSED");
    assert.equal(refused.material.species, "oak");
  } finally {
    await store.close();
    await dry.close();
  }
});

// ---------------------------------------------------------------- closure: seams, entry points, identity, unstated facts

test("no hidden entry: no dynamic import or code evaluation in src, one runtime entry point, no injection seam in startServer", () => {
  for (const path of SRC) assert.ok(!/\bimport\s*\(|\beval\s*\(|new Function\s*\(/.test(source(path)), `${path} loads or evaluates code dynamically`);
  assert.match(readFileSync(join(ROOT, "Dockerfile"), "utf8"), /CMD \["node", "src\/service\/server\.mjs"\]/);
  assert.equal(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts.start, "node src/service/server.mjs");
  const server = source("src/service/server.mjs");
  // The started service passes only its release and origins: no catalog, clock or source can be injected at runtime.
  assert.match(server, /createHandler\(\{ release, allowedOrigins: allowedOriginsFromEnvironment\(env\) \}\)/);
  assert.ok(!/source\s*=\s*sourceDigest\(\)\s*\}/.test(server.split("export function createHandler")[1].split("\n")[0]), "the handler takes no source argument");
  // Scripts call the request layer or the public interface; none writes into src or data.
  for (const path of ["scripts/build-contract-examples.mjs", "scripts/verify-deployment.mjs", "scripts/source-digest.mjs", "scripts/check-catalog.mjs"]) {
    assert.ok(!/writeFileSync\([^)]*(src|data)\//.test(source(path)), `${path} writes runtime files`);
  }
});

test("an unstated spot location never becomes a priced spot or machine evidence, over HTTP", async () => {
  const store = await service("release-a");
  try {
    const noLocation = project1Demand();
    noLocation.parts = noLocation.parts.map((p) => ({ ...p, features: p.features.map((f) => ({ ...f, xIn: null })) }));
    const board = await store.ask({ ...P1(), demand: noLocation });
    assert.notEqual(board.status, "SUPPORTABLE");
    assert.equal(board.estimate?.totals?.Q ?? null, null);
    const cut = structuredClone(REQUEST_EXAMPLES["cut-package.mixed"]);
    const spotted = cut.demand.cutPackages.find((p) => p.parts.some((part) => part.spots?.length));
    for (const part of spotted.parts) for (const s of part.spots ?? []) s.xIn = null;
    const line = (await store.ask(cut)).packages.find((p) => p.packageId === spotted.packageId);
    assert.deepEqual([line.status, line.reasonCodes, line.Q], ["UNRESOLVED", ["SPOT_LOCATION_REQUIRED"], null]);
    // A packet whose definition is edited to drop the location after a real answer is refused, with no evidence.
    const answer = await store.ask(P1());
    noEvidence(await store.evidence(packetFor(answer, (p) => { p.definition.demand = noLocation; return p; })));
  } finally {
    await store.close();
  }
});

test("an omitted operation, hardware fact or material is a governed gap over HTTP, never a default", async () => {
  const store = await service("release-a");
  try {
    const noSpotOp = await store.ask({ ...P1(), demand: { ...project1Demand(), requiredOps: ["MITER_LIMITED"] } });
    assert.deepEqual([noSpotOp.status, noSpotOp.materialResolution.reason], ["UNRESOLVED", "REQUIRED_OPERATIONS_DISAGREE_WITH_DEFINITION:SPOT_ON_LOCATION"]);
    const hardware = await store.ask({ requestType: "CUT_PACKAGE_V1", requestId: "AUTH-HW", demand: { configurationId: "C", configurationVersion: "1", cutPackages: [], itemLines: [{ lineId: "H", qty: 4, requirement: { gauge: "8", lengthIn: 2, finish: "exterior", unit: "piece" } }] } });
    assert.deepEqual([hardware.items[0].status, hardware.items[0].reasonCodes, hardware.items[0].Q], ["UNRESOLVED", ["HARDWARE_REQUIREMENT_INCOMPLETE"], null]);
    for (const materialDemand of [undefined, { ...project1Demand().materialDemand, species: null }, { ...project1Demand().materialDemand, nominalT: null }]) {
      const answer = await store.ask({ ...P1(), demand: { ...project1Demand(), materialDemand } });
      assert.deepEqual([answer.status, answer.materialResolution.reason, answer.estimate], ["UNRESOLVED", "MATERIAL_CHOICE_REQUIRED", null]);
    }
    const lookup = await store.ask({ requestType: "OFFERING_LOOKUP", requestId: "AUTH-Q", demand: { query: { species: "", nominalT: 2, nominalW: 4, stockL_in: 60 } } });
    assert.deepEqual([lookup.status, lookup.reasonCodes, lookup.offering], ["REFUSED", ["LOOKUP_QUERY_FIELD_INVALID:species"], undefined]);
  } finally {
    await store.close();
  }
});

test("the catalog identity /health reports is the one every receipt and lookup names", async () => {
  const store = await service("release-a");
  try {
    const health = (await store.send(PATHS.health, null, "GET")).body;
    const answer = await store.ask(P1());
    const lookup = await store.ask({ requestType: "OFFERING_LOOKUP", requestId: "AUTH-SKU", demand: { storeSku: "STB-ZERO-PTAG-2X4-72-001" } });
    assert.match(health.catalog.catalogHash, /^[0-9a-f]{64}$/);
    assert.equal(answer.evaluationReceipt.authority.catalogHash, health.catalog.catalogHash);
    assert.equal(lookup.catalogHash, health.catalog.catalogHash);
    assert.equal(lookup.evaluationReceipt, undefined, "discovery carries no receipt");
  } finally {
    await store.close();
  }
});

test("a Store whose shipped files change while it runs stops answering instead of advertising a stale identity", async () => {
  const { mkdtempSync, cpSync, rmSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { spawn } = await import("node:child_process");
  const copy = mkdtempSync(join(tmpdir(), "store-zero-immutable-"));
  for (const path of ["package.json", "src", "data"]) cpSync(join(ROOT, path), join(copy, path), { recursive: true });
  const child = spawn(process.execPath, ["src/service/server.mjs"], { cwd: copy, env: { ...process.env, STORE_ZERO_RELEASE: "immutable-test", HOST: "127.0.0.1", PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
  try {
    const port = await new Promise((resolve, reject) => {
      child.stdout.on("data", (chunk) => { const m = /listening on (\d+)/.exec(chunk.toString()); if (m) resolve(m[1]); });
      child.on("exit", (code) => reject(new Error(`exited ${code}`)));
    });
    const base = `http://127.0.0.1:${port}`;
    const before = await (await fetch(`${base}/health`)).json();
    assert.equal(before.status, "ok");
    const ask = () => fetch(`${base}/v1/requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(P1()) });
    assert.equal((await ask()).status, 200);
    // Reprice a board on disk under the running process.
    const catalogPath = join(copy, "data/store-zero-catalog.json");
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    const row = catalog.offerings.find((o) => o.storeSku === "STB-ZERO-PTAG-2X4-72-001");
    row.list_reference = 5.29; row.assertions.externalListPrice = { ...row.assertions.externalListPrice, value: 5.29 }; row.sellingPrice = 5.55;
    writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
    const health = await fetch(`${base}/health`);
    assert.deepEqual([health.status, (await health.json()).error], [503, "STORE_SOURCE_CHANGED"]);
    const answer = await ask();
    assert.deepEqual([answer.status, (await answer.json()).error], [503, "STORE_SOURCE_CHANGED"]);
  } finally {
    child.kill();
    rmSync(copy, { recursive: true, force: true });
  }
});
