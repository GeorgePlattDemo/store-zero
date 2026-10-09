// The HTTP service carries requests to the request layer and answers; it computes nothing itself.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createHandler, PATHS, PROTOCOL, releaseFromEnvironment, allowedOriginsFromEnvironment, startServer } from "../src/service/server.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";

const ALLOWED = "https://georgeplattdemo.github.io";
const { demand: PROJECT_1 } = JSON.parse(readFileSync(new URL("../acceptance/project-1/from-evidence/definition-and-demand.json", import.meta.url)));

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
  assert.equal(releaseFromEnvironment({ STORE_ZERO_RELEASE: "v1", RAILWAY_GIT_COMMIT_SHA: "abc123" }), "v1");
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
