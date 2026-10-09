import test from "node:test";
import assert from "node:assert/strict";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { findSku } from "../src/evaluation/catalog.mjs";
import { matchingBoardOfferings } from "../src/evaluation/store-state.mjs";
import { evaluateDimensionalTravelJob } from "../src/evaluation/evaluators/user-defined-board.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "./fixtures/user1-dimensional-travel-fixture.mjs";

const ORIGINAL = "STB-ZERO-SPF-2X4-60-001";
// A twin of the 60 in SPF 2x4: same length, same price, a SKU that sorts before the original.
const EARLIER = "STB-ZERO-SPF-2X4-60-000";

// The recorded catalog with the twin either before or after the original row.
function catalogWithTwin(twinSku, twinFirst) {
  const catalog = structuredClone(recordedCatalog());
  const original = findSku(catalog, ORIGINAL);
  const twin = { ...structuredClone(original), storeSku: twinSku, description: `${original.description} (twin)` };
  const index = catalog.offerings.indexOf(original);
  catalog.offerings.splice(twinFirst ? index : index + 1, 0, twin);
  return catalog;
}
const SPF_2X4 = { species: "spf", form: "board", nominalT: 2, nominalW: 4, definedWorkpieceLengthIn: 60 };
const demand = () => structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND);

test("offerings with equal stock length and equal price are ordered by SKU, whatever the catalog order", () => {
  // Rule: matchingBoardOfferings sorts by stock length, then price, then SKU; catalog row order never decides a tie.
  for (const twinFirst of [true, false]) {
    const catalog = catalogWithTwin(EARLIER, twinFirst);
    const twin = findSku(catalog, EARLIER);
    const original = findSku(catalog, ORIGINAL);
    assert.equal(twin.stockL_in, original.stockL_in);
    assert.equal(twin.sellingPrice, original.sellingPrice);

    const ordered = matchingBoardOfferings(catalog, SPF_2X4).map((o) => o.storeSku);
    assert.deepEqual(ordered.slice(0, 3), [EARLIER, ORIGINAL, "STB-ZERO-SPF-2X4-72-001"], `twinFirst=${twinFirst}`);
  }
  // A later-sorting twin placed first in the catalog still comes after the original.
  const later = catalogWithTwin("STB-ZERO-SPF-2X4-60-002", true);
  assert.deepEqual(
    matchingBoardOfferings(later, SPF_2X4).map((o) => o.storeSku).slice(0, 2),
    [ORIGINAL, "STB-ZERO-SPF-2X4-60-002"]
  );
});

test("the SKU only breaks a tie: a lower price at the same length still comes first", () => {
  // Rule: SKU is the last key; price is compared before it.
  const catalog = catalogWithTwin(EARLIER, true);
  findSku(catalog, ORIGINAL).sellingPrice = findSku(catalog, EARLIER).sellingPrice - 0.01;
  assert.deepEqual(matchingBoardOfferings(catalog, SPF_2X4).map((o) => o.storeSku).slice(0, 2), [ORIGINAL, EARLIER]);
});

test("the dimensional travel job selects the lexically first SKU when length and price tie", () => {
  // Rule: evaluateDimensionalTravelJob takes the first complete candidate in matchingBoardOfferings order, so a tie goes to the lower SKU.
  for (const twinFirst of [true, false]) {
    const answer = evaluateDimensionalTravelJob(catalogWithTwin(EARLIER, twinFirst), demand());
    assert.equal(answer.status, "SUPPORTABLE", `twinFirst=${twinFirst}`);
    assert.equal(answer.materialResolution.storeSku, EARLIER);
    assert.equal(answer.lines[0].storeSku, EARLIER);
    assert.equal(answer.estimate.calculationIdentity.inputHash, answer.calculationIdentity.inputHash);
    assert.deepEqual(answer.materialResolution.consideredCandidates.map((c) => c.storeSku), [EARLIER]);
  }
  // With the twin sorting after the original, the original is selected even when the twin is listed first.
  const answer = evaluateDimensionalTravelJob(catalogWithTwin("STB-ZERO-SPF-2X4-60-002", true), demand());
  assert.equal(answer.status, "SUPPORTABLE");
  assert.equal(answer.materialResolution.storeSku, ORIGINAL);
});
