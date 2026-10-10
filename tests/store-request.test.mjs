// The request layer: one way in, clean definitions only, a fresh receipt for every accepted request.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { CATALOG_RULES, loadCatalog } from "../src/evaluation/catalog.mjs";
import { evaluateStoreRequest, REQUEST_TYPES, requestProblems } from "../src/requests/store-request.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "./fixtures/user1-dimensional-travel-fixture.mjs";

const at = { release: "STORE-ZERO-TEST", now: () => "2026-10-08T12:00:00.000Z" };
const board = (demand = structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND), requestId = "REQ-BOARD") =>
  evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId, demand }, at);

test("the accepted request types are exactly the three definitions and catalog lookup", () => {
  assert.deepEqual(Object.keys(REQUEST_TYPES).sort(), ["CUT_PACKAGE_V1", "OFFERING_LOOKUP", "SHEET_PACKAGE_V1", "USER_DEFINED_BOARD_V1"]);
});

test("a count-only Board ticket is not a clean definition and is refused, never partially priced", () => {
  const answer = evaluateStoreRequest({ requestType: "BOARD_SQUARE_V1", requestId: "REQ-SQ", demand: { storeSku: "STB-ZERO-SPF-2X4-96-001", qty: 1 } }, at);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["REQUEST_TYPE_NOT_ACCEPTED"]);
  assert.equal(answer.freshEvaluation, false);
  assert.equal(answer.estimate, undefined);
});

test("an undeclared request type, even a prototype name, is refused", () => {
  for (const requestType of ["constructor", "toString", "", undefined, "SHEET_PACKAGE_V2"]) {
    assert.deepEqual(evaluateStoreRequest({ requestType, requestId: "R", demand: {} }, at).reasonCodes, ["REQUEST_TYPE_NOT_ACCEPTED"]);
  }
});

test("a request may not carry its own clock, Store identity, or anything undeclared", () => {
  const answer = evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId: "R", demand: USER1_DIMENSIONAL_TRAVEL_DEMAND, storeRevision: "PRETEND", evaluatedAt: "1999-01-01" }, at);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["REQUEST_FIELD_NOT_DECLARED:storeRevision", "REQUEST_FIELD_NOT_DECLARED:evaluatedAt"]);
  const inDemand = board({ ...structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND), storeRevision: "PRETEND" });
  assert.deepEqual(inDemand.reasonCodes, ["DEFINITION_FIELD_NOT_DECLARED:storeRevision"]);
});

test("a definition field the Store does not declare is refused by name rather than ignored", () => {
  const answer = board({ ...structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND), kerfIn: 0.0625, rush: true });
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["DEFINITION_FIELD_NOT_DECLARED:kerfIn", "DEFINITION_FIELD_NOT_DECLARED:rush"]);
});

test("machine-local language is refused for every request type", () => {
  for (const requestType of ["USER_DEFINED_BOARD_V1", "CUT_PACKAGE_V1", "SHEET_PACKAGE_V1"]) {
    const answer = evaluateStoreRequest({ requestType, requestId: "R", demand: { configurationId: "X", configurationVersion: "1", gcode: "G0 X0" } }, at);
    assert.deepEqual(answer.reasonCodes, ["MACHINE_LOCAL_LANGUAGE_NOT_ACCEPTED"], requestType);
  }
});

test("the retired project-shaped Alcove request type is refused like any undeclared type", () => {
  const answer = evaluateStoreRequest({ requestType: "ALCOVE_INSERT_V1", requestId: "R", demand: { configurationId: "A", configurationVersion: "1" } }, at);
  assert.deepEqual([answer.status, answer.reasonCodes], ["REFUSED", ["REQUEST_TYPE_NOT_ACCEPTED"]]);
});

test("a missing request identity or definition is UNRESOLVED and nothing is evaluated", () => {
  assert.deepEqual(evaluateStoreRequest({ requestType: "CUT_PACKAGE_V1", demand: {} }, at).reasonCodes, ["STORE_EVALUATION_REQUEST_ID_REQUIRED"]);
  assert.deepEqual(evaluateStoreRequest({ requestType: "CUT_PACKAGE_V1", requestId: "  " , demand: {} }, at).reasonCodes, ["STORE_EVALUATION_REQUEST_ID_REQUIRED"]);
  assert.deepEqual(evaluateStoreRequest({ requestType: "CUT_PACKAGE_V1", requestId: "R" }, at).reasonCodes, ["DEFINITION_REQUIRED"]);
  for (const notEvaluated of [null, [], "text"]) {
    assert.equal(evaluateStoreRequest(notEvaluated, at).status, "REFUSED");
  }
});

test("every accepted request is evaluated fresh and its receipt names this Store, this request and this catalog", () => {
  const a = board(undefined, "REQ-A");
  const b = board(undefined, "REQ-B");
  assert.equal(a.status, "SUPPORTABLE");
  assert.equal(a.freshEvaluation, true);
  assert.equal(a.requestType, "USER_DEFINED_BOARD_V1");
  assert.equal(a.evaluationReceipt.requestId, "REQ-A");
  assert.equal(a.evaluationReceipt.requestType, "USER_DEFINED_BOARD_V1");
  assert.equal(a.evaluationReceipt.evaluatedAt, "2026-10-08T12:00:00.000Z");
  assert.equal(a.evaluationReceipt.authority.storeRevision, "STORE-ZERO-TEST");
  assert.equal(a.evaluationReceipt.authority.travelStandard.id, "STB-D001-DIMENSIONAL-TRAVEL-0.1");
  assert.ok(/^[0-9a-f]{64}$/.test(a.evaluationReceipt.authority.catalogHash));
  assert.notEqual(a.evaluationReceipt.receiptHash, b.evaluationReceipt.receiptHash);
  assert.deepEqual(a.calculationIdentity, b.calculationIdentity);
  assert.ok(Object.isFrozen(a.evaluationReceipt));
});

test("this Store's release identity is required to answer at all", () => {
  assert.throws(() => evaluateStoreRequest({ requestType: "CUT_PACKAGE_V1", requestId: "R", demand: {} }, {}), /release identity/);
});

test("offering lookup: search, exact SKU and material query, offered rows only, no Q", () => {
  const search = evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "L1", demand: { searchText: "1 x 6 pine" } }, at);
  assert.equal(search.kind, "SEARCH");
  assert.ok(search.offerings.length > 0 && search.offerings.length <= 20);
  assert.ok(search.offerings.every((o) => o.offered === true && o.nominalT === 1 && o.nominalW === 6 && /pine/.test(o.species)));
  assert.equal(search.estimate, undefined);
  const exact = evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "L2", demand: { searchText: "stb-zero-spf-2x4-96-001" } }, at);
  assert.equal(exact.offerings[0].storeSku, "STB-ZERO-SPF-2X4-96-001");
  const sku = evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "L3", demand: { storeSku: "STB-ZERO-SPF-2X4-96-001" } }, at);
  assert.equal(sku.found, true);
  assert.equal(sku.offering.catalogClock, loadCatalog().clock);
  const notOffered = evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "L4", demand: { storeSku: "STB-ZERO-SPF-4X4-96-001" } }, at);
  assert.equal(notOffered.found, false);
  const none = evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "L5", demand: { searchText: "unobtainium" } }, at);
  assert.deepEqual([none.offerings, none.totalMatches, none.truncated], [[], 0, false]);
  const capped = evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "L6", demand: { searchText: "pine" } }, at);
  assert.equal(capped.offerings.length, 20);
  assert.equal(capped.truncated, capped.totalMatches > 20);
});

test("a malformed lookup is refused, never reported as nothing found", () => {
  for (const demand of [{}, { searchText: "" }, { searchText: "x".repeat(81) }, { searchText: "pine", storeSku: "X" }, { query: {} }, { query: { color: "red" } }]) {
    assert.equal(evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "L", demand }, at).status, "REFUSED", JSON.stringify(demand));
  }
});

test("Store offers only operations it handles: every offered operation has handling outside the vocabulary list", () => {
  // Fails if an operation is added to the vocabulary or the catalog with nothing in Store that handles it.
  const sources = readdirSync(new URL("../src/evaluation/", import.meta.url), { recursive: true })
    .filter((file) => String(file).endsWith(".mjs") && String(file) !== "catalog.mjs")
    .map((file) => readFileSync(new URL(`../src/evaluation/${file}`, import.meta.url), "utf8"))
    .join("\n");
  for (const op of CATALOG_RULES.supportedOps) assert.ok(sources.includes(`"${op}"`), `${op} is offered but nothing handles it`);
  for (const offering of loadCatalog().offerings) {
    for (const op of offering.supportedOps || []) assert.ok(CATALOG_RULES.supportedOps.includes(op), `${offering.storeSku} offers ${op}`);
  }
  const answer = board({ ...structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND), requiredOps: [...USER1_DIMENSIONAL_TRAVEL_DEMAND.requiredOps, "UNDECLARED_OPERATION"] }, "REQ-UNDECLARED-OP");
  assert.equal(answer.status, "REFUSED");
  const reasons = answer.materialResolution.consideredCandidates.map((candidate) => candidate.reason);
  assert.ok(reasons.length > 0 && reasons.every((reason) => reason === "OP_NOT_ON_OFFERING:UNDECLARED_OPERATION"));
  assert.equal(answer.estimate ?? null, null);
});
