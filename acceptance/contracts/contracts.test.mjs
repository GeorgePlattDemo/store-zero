// The contracts System and the machine side build against: exact definitions and the accepted job packet,
// each with complete serialized examples that this Store answers or refuses exactly as recorded here.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateStoreRequest, requestProblems } from "../../src/requests/store-request.mjs";
import { packetProblems, verifyJobPacket } from "../../src/contracts/job-packet.mjs";
import { buildExamples, EXAMPLE_CLOCK, EXAMPLE_RELEASE } from "../../scripts/build-contract-examples.mjs";
import { recordedCatalog } from "../fixtures/recorded-catalog.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const json = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const at = { release: EXAMPLE_RELEASE, catalog: recordedCatalog(), now: () => EXAMPLE_CLOCK };

test("the committed examples are exactly what the code produces", () => {
  for (const [path, text] of Object.entries(buildExamples())) {
    assert.equal(readFileSync(join(ROOT, path), "utf8"), text, `${path} is out of date: run npm run build:examples`);
  }
});

const EXPECTED = {
  "user-defined-board.project-1.json": { status: "SUPPORTABLE", Q: (a) => a.estimate.totals.Q, value: 11.09 },
  "user-defined-board.default-spf.json": { status: "SUPPORTABLE", Q: (a) => a.estimate.totals.Q, value: 8.54 },
  "cut-package.mixed.json": { status: "NOT_ALL_LINES_SUPPORTABLE", Q: (a) => a.totals.sumOfSupportableLines, value: 170.01 },
  "cut-package.alcove-pine.json": { status: "SUPPORTABLE", Q: (a) => a.totals.sumOfSupportableLines, value: 429.16 },
  "sheet-package.playhouse.json": { status: "SUPPORTABLE", Q: (a) => a.totals.Q, value: 65.04 },
  "offering-lookup.search.json": { status: "ANSWERED" },
  "offering-lookup.sku.json": { status: "ANSWERED" }
};

test("every request example is a clean definition and gets its recorded answer", () => {
  const files = readdirSync(join(ROOT, "contracts/examples/requests")).filter((f) => f !== "refused.json").sort();
  assert.deepEqual(files, Object.keys(EXPECTED).sort());
  for (const file of files) {
    const request = json(`contracts/examples/requests/${file}`);
    assert.equal(requestProblems(request), null, file);
    const answer = evaluateStoreRequest(request, at);
    assert.equal(answer.status, EXPECTED[file].status, file);
    if (EXPECTED[file].Q) assert.equal(EXPECTED[file].Q(answer), EXPECTED[file].value, file);
  }
});

test("every refused example is refused with its exact reasons", () => {
  const refused = json("contracts/examples/requests/refused.json");
  assert.ok(refused.length >= 9);
  for (const { name, request, answer } of refused) {
    const now = evaluateStoreRequest(request, at);
    assert.equal(now.freshEvaluation, false, name);
    assert.deepEqual({ status: now.status, reasonCodes: now.reasonCodes }, answer, name);
  }
});

test("the Project 1 packet is well formed and verifies against this Store", () => {
  const packet = json("contracts/examples/packets/project-1.accepted.json");
  assert.deepEqual(packetProblems(packet), []);
  assert.deepEqual(verifyJobPacket(packet, at), { status: "VERIFIED", reasonCodes: [] });
  assert.equal(packet.storeAnswer.estimate.totals.Q, 11.09);
  assert.equal(packet.storeAnswer.materialResolution.storeSku, "STB-ZERO-PTAG-2X4-72-001");
  assert.equal(packet.definition.revisionId, "SYO-USER1-XBRACE-0.1-v5");
  assert.equal(packet.authority.physicalRelease, false);
});

const EXPECTED_PACKET_REASONS = {
  "declined offer": ["PACKET_REQUIRES_ACCEPTED_DECISION"],
  "physical release claimed": ["PHYSICAL_RELEASE_NOT_AVAILABLE"],
  "price edited after the answer": ["PACKET_STORE_ANSWER_NOT_CURRENT"],
  "receipt edited": ["PACKET_RECEIPT_ALTERED"],
  "definition changed after the answer": ["PACKET_DEMAND_CHANGED"],
  "answer from another Store": ["PACKET_STORE_RELEASE_MISMATCH"],
  "refused answer": ["PACKET_ANSWER_NOT_SUPPORTABLE"]
};

test("a packet that is declined, altered, changed, foreign or refused is never acted on", () => {
  const refused = json("contracts/examples/packets/refused.json");
  assert.deepEqual(refused.map((r) => r.name).sort(), Object.keys(EXPECTED_PACKET_REASONS).sort());
  for (const { name, packet } of refused) {
    const result = verifyJobPacket(packet, at);
    assert.notEqual(result.status, "VERIFIED", name);
    assert.deepEqual(result.reasonCodes, EXPECTED_PACKET_REASONS[name], name);
  }
});

test("an intact packet whose Store answer is no longer current is STALE and must be re-quoted", () => {
  const packet = json("contracts/examples/packets/project-1.accepted.json");
  const repriced = recordedCatalog();
  const row = repriced.offerings.find((o) => o.storeSku === "STB-ZERO-PTAG-2X4-72-001");
  // A real price change: the list reference, its stated basis, and the selling price by the declared rule.
  row.list_reference = 5.29;
  row.assertions.externalListPrice = { ...row.assertions.externalListPrice, value: 5.29 };
  row.sellingPrice = 5.55;
  const result = verifyJobPacket(packet, { ...at, catalog: repriced });
  assert.deepEqual(result, { status: "STALE", reasonCodes: ["PACKET_STORE_ANSWER_NOT_CURRENT"] });
});

test("required packet fields are named when missing", () => {
  const packet = json("contracts/examples/packets/project-1.accepted.json");
  delete packet.decision.offerId;
  delete packet.definition.revisionId;
  assert.deepEqual(packetProblems(packet), ["PACKET_FIELD_REQUIRED:definition.revisionId", "PACKET_FIELD_REQUIRED:decision.offerId"]);
  assert.deepEqual(packetProblems([]), ["PACKET_MUST_BE_AN_OBJECT"]);
});
