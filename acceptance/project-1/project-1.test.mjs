// Project 1: the specimen in docs/project-1-digital-trail, answered by this Store.
//
// from-evidence/ holds three files copied unchanged from D001_Project1_Evidence.zip (their SHA-256 values are
// the ones in that package's MANIFEST.json): the definition and Store inquiry, the reproduced Store answer, and
// the review summary. This test feeds the review's own inquiry to this Store and requires the review's answer.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { evaluateDimensionalTravelJob } from "../../src/evaluation/evaluators/user-defined-board.mjs";
import { evaluateStoreRequest } from "../../src/requests/store-request.mjs";
import { recordedCatalog, RECORDED_STORE_PIN } from "../fixtures/recorded-catalog.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "../../tests/fixtures/user1-dimensional-travel-fixture.mjs";

const evidence = (name) => readFileSync(new URL(`./from-evidence/${name}`, import.meta.url));
const MANIFEST_SHA256 = {
  "definition-and-demand.json": "eb99eebe4e92cf1dea25c68fd5e8a4b84353af46c6e375577f814720a9854b26",
  "store-answer.json": "aef7c3facbc060c70d4b585457c6d8213b6d2c36f3612f14f1bf8dd3d423b34c",
  "review-summary.json": "777619ae564145ddbb92ada2140a2d3951d40d86e3f7ff23e1d30ab86b47d2ec"
};
const { demand } = JSON.parse(evidence("definition-and-demand.json"));
const recordedAnswer = JSON.parse(evidence("store-answer.json"));
const summary = JSON.parse(evidence("review-summary.json"));

test("the evidence files are the review's files, byte for byte", () => {
  for (const [name, sha256] of Object.entries(MANIFEST_SHA256)) {
    assert.equal(createHash("sha256").update(evidence(name)).digest("hex"), sha256, name);
  }
});

test("the review's inquiry reproduces the review's whole Store answer under its recorded inputs", () => {
  // The review evaluated against the pinned Store's catalog with that pin as the Store revision; the same
  // inputs here must give the same answer in every field, including both calculation hashes.
  const answer = evaluateDimensionalTravelJob(recordedCatalog(), { ...demand, storeRevision: RECORDED_STORE_PIN });
  const { freshEvaluation, evaluationReceipt, ...recordedEvaluation } = recordedAnswer;
  assert.deepEqual(JSON.parse(JSON.stringify(answer)), recordedEvaluation);
  assert.deepEqual(answer.calculationIdentity, summary.storeIdentity);
});

test("the Project 1 numbers: 72 in treated parent, $5.15 + $5.94 = $11.09, 85.5001 s", () => {
  const answer = evaluateDimensionalTravelJob(recordedCatalog(), { ...demand, storeRevision: RECORDED_STORE_PIN });
  assert.equal(answer.status, "SUPPORTABLE");
  assert.equal(answer.materialResolution.storeSku, "STB-ZERO-PTAG-2X4-72-001");
  assert.equal(answer.materialResolution.workpieceLengthIn, 72);
  assert.deepEqual(answer.estimate.totals, summary.storeTotals);
  assert.equal(answer.estimate.totals.Q, 11.09);
  const t = answer.estimate.travel.time;
  assert.deepEqual(
    [t.T_LOAD_SEAT_sec, t.T_REFERENCE_sec, t.T_INDEX_sec, t.T_SAW_sec, t.T_DRILL_SPOT_sec, t.T_RELEASE_LABEL_sec, t.T_MACHINE_sec],
    [36, 3.0853, 12.25, 6.1706, 3.9942, 24, 85.5001]
  );
  assert.equal(t.T_MACHINE_sec, summary.storeTimeSec);
  assert.equal(answer.estimate.travel.derivedSawCuts, 3);
  assert.equal(answer.estimate.travel.derivedSpotCount, 2);
});

test("the default job is a different specimen: SPF, two 16 in parts, 30 degrees, $8.54", () => {
  // The two answers differ because the definitions differ (species, part length, angle). Neither is adjusted
  // to match the other; changing the species on the default job is how a reviewer reaches the treated answer.
  const spf = evaluateDimensionalTravelJob(recordedCatalog(), { ...structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND), storeRevision: RECORDED_STORE_PIN });
  assert.equal(spf.status, "SUPPORTABLE");
  assert.equal(spf.materialResolution.storeSku, "STB-ZERO-SPF-2X4-60-001");
  assert.equal(spf.estimate.totals.Q, 8.54);
  const treated = evaluateDimensionalTravelJob(recordedCatalog(), {
    ...structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND),
    materialDemand: { ...USER1_DIMENSIONAL_TRAVEL_DEMAND.materialDemand, species: "syp-treated" },
    storeRevision: RECORDED_STORE_PIN
  });
  assert.equal(treated.materialResolution.storeSku, "STB-ZERO-PTAG-2X4-72-001");
  assert.equal(treated.estimate.totals.Q, 11.08);
});

test("all 17 permitted part lengths (16 to 18 in by 1/8) are answered SUPPORTABLE with a complete Q", () => {
  for (let i = 0; i <= 16; i += 1) {
    const L = 16 + i / 8;
    const answer = evaluateDimensionalTravelJob(recordedCatalog(), {
      ...demand,
      sawAngleDeg: (Math.asin(8 / L) * 180) / Math.PI,
      parts: demand.parts.map((p) => ({ ...p, lengthIn: L, features: p.features.map((f) => ({ ...f, xIn: L / 2 })) }))
    });
    assert.equal(answer.status, "SUPPORTABLE", `${L} in`);
    assert.ok(Number.isFinite(answer.estimate.totals.Q), `${L} in`);
  }
});

test("through the request layer the same inquiry gets the same answer with this Store's own identity", () => {
  const formal = evaluateStoreRequest(
    { requestType: "USER_DEFINED_BOARD_V1", requestId: "PROJECT-1-ACCEPTANCE", demand },
    { release: "store-zero-acceptance", catalog: recordedCatalog(), now: () => "2026-10-08T00:00:00Z" }
  );
  assert.equal(formal.status, "SUPPORTABLE");
  assert.equal(formal.freshEvaluation, true);
  assert.deepEqual(formal.estimate.totals, summary.storeTotals);
  assert.equal(formal.evaluationReceipt.authority.storeRevision, "store-zero-acceptance");
  // A different Store identity is a different calculation identity: this Store never claims the old pin's.
  assert.notEqual(formal.calculationIdentity.resultHash, summary.storeIdentity.resultHash);
});

test("a changed definition is a new calculation, never the old answer", () => {
  const changed = { ...demand, parts: demand.parts.map((p) => ({ ...p, lengthIn: 17, features: p.features.map((f) => ({ ...f, xIn: 8.5 })) })), sawAngleDeg: (Math.asin(8 / 17) * 180) / Math.PI };
  const answer = evaluateDimensionalTravelJob(recordedCatalog(), { ...changed, storeRevision: RECORDED_STORE_PIN });
  assert.equal(answer.status, "SUPPORTABLE");
  assert.notEqual(answer.calculationIdentity.inputHash, summary.storeIdentity.inputHash);
  assert.notEqual(answer.calculationIdentity.resultHash, summary.storeIdentity.resultHash);
  assert.ok(Number.isFinite(answer.estimate.totals.Q));
});
