// The HTTP service carries requests to the request layer and answers; it computes nothing itself.
import { project1Demand } from "./fixtures/project-1.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createHandler, PATHS, PROTOCOL, releaseFromEnvironment, allowedOriginsFromEnvironment, startServer, sourceDigest } from "../src/service/server.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";

const ALLOWED = "https://georgeplattdemo.github.io";
const PROJECT_1 = project1Demand();

async function withService(options, fn) {
  const handle = createHandler({ release: "store-zero-test", now: () => "2026-10-08T00:00:00Z", ...options });
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const post = (base, body, headers = {}) =>
  fetch(base + PATHS.requests, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

test("health names this Store's release, protocol, catalog and request types", async () => {
  await withService({}, async (base) => {
    const res = await fetch(base + PATHS.health);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.release, "store-zero-test");
    assert.equal(body.protocol, PROTOCOL);
    assert.equal(body.catalog.offerings, 183);
    assert.ok(body.requestTypes.includes("USER_DEFINED_BOARD_V1"));
    assert.ok(!body.requestTypes.includes("BOARD_SQUARE_V1"));
  });
});

test("Project 1 over HTTP: the same answer, bound to the exact bytes sent", async () => {
  await withService({ catalog: recordedCatalog() }, async (base) => {
    const raw = JSON.stringify({ requestType: "USER_DEFINED_BOARD_V1", requestId: "P1-HTTP", demand: PROJECT_1 });
    const res = await post(base, raw, { Origin: ALLOWED });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), ALLOWED);
    const body = await res.json();
    assert.equal(body.protocol, PROTOCOL);
    assert.equal(body.storeRelease, "store-zero-test");
    assert.equal(body.payloadDigest, createHash("sha256").update(raw).digest("hex"));
    assert.equal(body.answer.status, "SUPPORTABLE");
    assert.equal(body.answer.requestId, "P1-HTTP");
    assert.equal(body.answer.estimate.totals.Q, 11.09);
    assert.equal(body.answer.materialResolution.storeSku, "STB-ZERO-PTAG-2X4-72-001");
    assert.equal(body.answer.evaluationReceipt.authority.storeRevision, "store-zero-test");
  });
});

test("a refusal is an answer, not an HTTP error", async () => {
  await withService({}, async (base) => {
    const res = await post(base, { requestType: "BOARD_SQUARE_V1", requestId: "SQ", demand: {} });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).answer.reasonCodes, ["REQUEST_TYPE_NOT_ACCEPTED"]);
  });
});

test("unreadable requests are HTTP errors with a code", async () => {
  await withService({}, async (base) => {
    assert.equal((await post(base, "{not json")).status, 400);
    assert.equal((await fetch(base + PATHS.requests, { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" })).status, 415);
    assert.equal((await post(base, JSON.stringify({ pad: "x".repeat(300 * 1024) }))).status, 413);
    assert.equal((await fetch(base + PATHS.requests)).status, 405);
    assert.equal((await fetch(base + "/api/store-zero/job", { method: "POST" })).status, 404);
  });
});

test("browsers on other sites are refused; the allowed site gets a preflight", async () => {
  await withService({}, async (base) => {
    assert.equal((await post(base, {}, { Origin: "https://evil.example" })).status, 403);
    const pre = await fetch(base + PATHS.requests, { method: "OPTIONS", headers: { Origin: ALLOWED } });
    assert.equal(pre.status, 204);
    assert.equal(pre.headers.get("access-control-allow-origin"), ALLOWED);
  });
});

test("an invalid catalog is never answered around", async () => {
  const broken = { ...recordedCatalog(), skuCount: 1 };
  await withService({ catalog: broken }, async (base) => {
    const res = await post(base, { requestType: "OFFERING_LOOKUP", requestId: "L", demand: { searchText: "2x4" } });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, "STORE_CATALOG_INVALID");
  });
});

test("the Store will not start without naming itself; the host's deployed commit names it", async () => {
  assert.throws(() => releaseFromEnvironment({}), /release identity/);
  assert.equal(releaseFromEnvironment({ RAILWAY_GIT_COMMIT_SHA: "abc123" }), "abc123");
  assert.equal(releaseFromEnvironment({ RENDER_GIT_COMMIT: "def456" }), "def456");
  // A label may name a release only where the host names none; it can never contradict the deployed commit.
  assert.equal(releaseFromEnvironment({ STORE_ZERO_RELEASE: "v1" }), "v1");
  assert.equal(releaseFromEnvironment({ STORE_ZERO_RELEASE: "abc123", RAILWAY_GIT_COMMIT_SHA: "abc123" }), "abc123");
  assert.throws(() => releaseFromEnvironment({ STORE_ZERO_RELEASE: "v1", RAILWAY_GIT_COMMIT_SHA: "abc123" }), /contradicts the commit the host deployed/);
  await assert.rejects(startServer({ env: {}, port: 0 }), /release identity/);
  assert.deepEqual(allowedOriginsFromEnvironment({}), [ALLOWED]);
  assert.deepEqual(allowedOriginsFromEnvironment({ STORE_ZERO_ALLOWED_ORIGINS: "https://a.example, https://b.example" }), ["https://a.example", "https://b.example"]);
});

test("the started service answers on its port", async () => {
  const { server, port } = await startServer({ env: { STORE_ZERO_RELEASE: "store-zero-start-test" }, host: "127.0.0.1", port: 0 });
  try {
    const body = await (await fetch(`http://127.0.0.1:${port}${PATHS.health}`)).json();
    assert.equal(body.release, "store-zero-start-test");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

const packetExample = (name) => JSON.parse(readFileSync(new URL(`../contracts/examples/packets/${name}.accepted.json`, import.meta.url)));
const packetRelease = packetExample("project-1").storeAnswer.evaluationReceipt.authority.storeRevision;
const evidencePost = (base, body, origin = ALLOWED) => fetch(base + PATHS.machineEvidence, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: typeof body === "string" ? body : JSON.stringify(body) });

test("machine evidence over HTTP binds exact request bytes, release, configuration and both independent jobs", async () => {
  await withService({ release: packetRelease, catalog: recordedCatalog() }, async (base) => {
    const health = await (await fetch(base + PATHS.health)).json();
    const identity = health.machineEvidence;
    assert.equal(identity.protocol, "STORE-ZERO-MACHINE-EVIDENCE-1");
    assert.deepEqual(identity.requestTypes, ["USER_DEFINED_BOARD_V1"]);
    assert.equal(identity.physicalAuthority, false);
    for (const name of ["project-1", "second-job"]) {
      const raw = JSON.stringify({ packet: packetExample(name), expectedMachineConfigId: identity.machineConfigId, expectedMachineConfigHash: identity.machineConfigHash });
      const response = await evidencePost(base, raw);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), ALLOWED);
      const reply = await response.json();
      assert.equal(reply.protocol, identity.protocol);
      assert.equal(reply.storeRelease, packetRelease);
      assert.equal(reply.payloadDigest, createHash("sha256").update(raw).digest("hex"));
      assert.equal(reply.answer.status, "VIRTUAL_EVIDENCE_READY");
      assert.equal(reply.answer.records.binding.machineConfigHash, identity.machineConfigHash);
      assert.equal(reply.answer.run.status, "VIRTUAL_MODEL_COMPLETE");
      assert.equal(reply.answer.admission.status, "BLOCKED");
      assert.equal(reply.answer.admission.motionCommands, 0);
      assert.equal(reply.answer.physicalAuthority, false);
    }
  });
});

test("machine evidence refuses incomplete packets, changed demands, wrong releases and unsupported lowering over HTTP", async () => {
  await withService({ release: packetRelease, catalog: recordedCatalog() }, async (base) => {
    const { machineEvidence: identity } = await (await fetch(base + PATHS.health)).json();
    const request = () => ({ packet: packetExample("project-1"), expectedMachineConfigId: identity.machineConfigId, expectedMachineConfigHash: identity.machineConfigHash });
    const cases = [
      (r) => { delete r.packet.definition.requirements; },
      (r) => { r.packet.definition.requirements.endRelation = "nonparallel"; },
      (r) => { r.packet.definition.demand.parts[0].lengthIn = 16; },
      (r) => { r.expectedMachineConfigHash = "0".repeat(64); },
      (r) => { r.storeRelease = packetRelease; }
    ];
    for (const modify of cases) {
      const body = request(); modify(body);
      const reply = await (await evidencePost(base, body)).json();
      assert.equal(reply.answer.status, "REFUSED");
      assert.equal(reply.answer.records, undefined);
      assert.equal(reply.answer.physicalAuthority, false);
    }
    const sheet = JSON.parse(readFileSync(new URL("../contracts/examples/requests/sheet-package.playhouse.json", import.meta.url)));
    const sheetReply = await (await post(base, sheet)).json();
    const body = request();
    body.packet.definition = { definitionId: "SHEET", revisionId: "SHEET-1", requestType: sheet.requestType, demand: sheet.demand };
    body.packet.storeAnswer = sheetReply.answer;
    const reply = await (await evidencePost(base, body)).json();
    assert.deepEqual(reply.answer.reasonCodes, ["LOWERING_NOT_REGISTERED_FOR:SHEET_PACKAGE_V1"]);
  });
  await withService({ release: "another-release", catalog: recordedCatalog() }, async (base) => {
    const identity = (await (await fetch(base + PATHS.health)).json()).machineEvidence;
    const reply = await (await evidencePost(base, { packet: packetExample("project-1"), expectedMachineConfigId: identity.machineConfigId, expectedMachineConfigHash: identity.machineConfigHash })).json();
    assert.deepEqual(reply.answer.reasonCodes, ["PACKET_STORE_RELEASE_MISMATCH"]);
  });
});

test("candidate origin and machine evidence preflight obey configured origin policy", async () => {
  const candidate = "https://system-candidate.example";
  await withService({ allowedOrigins: [candidate] }, async (base) => {
    assert.equal((await evidencePost(base, {}, ALLOWED)).status, 403);
    const preflight = await fetch(base + PATHS.machineEvidence, { method: "OPTIONS", headers: { Origin: candidate } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), candidate);
    assert.equal((await evidencePost(base, {}, candidate)).status, 200);
  });
});

test("health refuses an invalid catalog rather than advertising a healthy Store", async () => {
  await withService({ catalog: { ...recordedCatalog(), skuCount: 1 } }, async (base) => {
    const response = await fetch(base + PATHS.health);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "STORE_CATALOG_INVALID");
  });
});

test("health proves the code it runs: the digest of its own files, recomputable from a checkout", async () => {
  await withService({}, async (base) => {
    const health = await (await fetch(base + PATHS.health)).json();
    assert.deepEqual(health.source, sourceDigest());
    assert.match(health.source.digest, /^[0-9a-f]{64}$/);
    assert.ok(health.source.files > 20);
  });
});

test("the source digest covers exactly the shipped files and changes when any of them changes", async () => {
  const { mkdtempSync, cpSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const root = new URL("../", import.meta.url).pathname;
  const copy = mkdtempSync(join(tmpdir(), "store-zero-digest-"));
  try {
    for (const path of ["package.json", "src", "data"]) cpSync(join(root, path), join(copy, path), { recursive: true });
    assert.deepEqual(sourceDigest(copy), sourceDigest(), "the shipped set alone gives the same digest");
    writeFileSync(join(copy, "README.md"), "not shipped");
    assert.deepEqual(sourceDigest(copy), sourceDigest(), "files outside the shipped set do not count");
    writeFileSync(join(copy, "data/store-zero-catalog.json"), "{}");
    assert.notEqual(sourceDigest(copy).digest, sourceDigest().digest, "a changed catalog is a different Store");
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
});
