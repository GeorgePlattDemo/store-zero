import assert from "node:assert/strict";
import { loadCatalog, loadObservations, findSku, sellingPriceFor as sellingPrice } from "../src/evaluation/catalog.mjs";
import { evaluateDimensionalTravelJob } from "../src/evaluation/evaluators/user-defined-board.mjs";
import { ENGINE } from "../src/evaluation/engine/pricing.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "./fixtures/user1-dimensional-travel-fixture.mjs";

const catalog = loadCatalog();
const observations = loadObservations();

assert.equal(new Set(catalog.offerings.map((o) => o.storeSku)).size, catalog.offerings.length, "Store SKU ids must be unique");
assert.equal(observations.observations.length, 20);
assert.equal(catalog.pricingRule.ruleId, "SZ-MARK-ON-5");
assert.equal(catalog.pricingRule.basis, "DECLARED_FIXTURE");

const spf60 = findSku(catalog, "STB-ZERO-SPF-2X4-60-001");
assert.ok(spf60, "60-in SPF 2x4 offering is missing");
assert.equal(spf60.stockL_in, 60);
assert.equal(spf60.listReferenceBasis, "CALCULATED");
assert.equal(spf60.list_reference, 2.49);
assert.equal(spf60.sellingPrice, 2.61);
assert.equal(spf60.assertions.listReferenceDerivation.basis, "CALCULATED");
assert.equal(spf60.assertions.listReferenceDerivation.sourceObservationId, "OBS-001");


const spf72Modeled = findSku(catalog, "STB-ZERO-SPF-2X4-72-001");
const spf96Observed = findSku(catalog, "STB-ZERO-SPF-2X4-96-001");
assert.ok(spf72Modeled && spf96Observed);
assert.ok(spf60.sellingPrice < spf72Modeled.sellingPrice);
assert.ok(spf72Modeled.sellingPrice < spf96Observed.sellingPrice);
const sameClassPricePerIn = [spf60, spf72Modeled, spf96Observed].map((o) => o.sellingPrice / o.stockL_in);
assert.ok(
  Math.max(...sameClassPricePerIn) - Math.min(...sameClassPricePerIn) < 0.001,
  "modeled SPF 2x4 length ladder lost its declared price/length correlation"
);

for (const o of catalog.offerings) {
  assert.ok(o.assertions, o.storeSku);
  assert.equal(o.assertions.sellingPrice.basis, "CALCULATED");
  assert.equal(o.assertions.pricingRule.basis, "DECLARED_FIXTURE");
  assert.equal(o.assertions.onHand.basis, "SYNTHETIC_FIXTURE");
  assert.equal(o.assertions.allocation.basis, "SIMULATED_STATE");
  assert.equal(o.assertions.supplierPath.basis, "SYNTHETIC_FIXTURE");
  assert.equal(o.assertions.cellCompatibility.basis, "DECLARED_STAGE2_CAPABILITY");
  if (o.list_reference != null) {
    assert.equal(o.sellingPrice, sellingPrice(o.list_reference));
  }
  if (o.listReferenceBasis === "OBSERVED") {
    assert.equal(o.assertions.externalListPrice.basis, "OBSERVED");
    assert.ok(o.observationId, o.storeSku);
    assert.ok(observations.observations.find((x) => x.id === o.observationId), o.observationId);
  } else {
    assert.notEqual(o.assertions.externalListPrice.basis, "OBSERVED");
  }
}

const cherry = catalog.offerings.filter((o) => o.species === "cherry");
assert.ok(cherry.length >= 1);
for (const c of cherry) {
  assert.equal(c.listReferenceBasis, "CALCULATED");
  assert.equal(c.assertions.externalListPrice.basis, "NONE");
  assert.equal(c.assertions.listReferenceDerivation.basis, "CALCULATED");
}

const pine72 = findSku(catalog, "STB-ZERO-PINE-1X6-72-001");
const pine96 = findSku(catalog, "STB-ZERO-PINE-1X6-96-001");
assert.equal(pine72.list_reference, 14.99);
assert.equal(pine72.sellingPrice, 15.74);
assert.equal(pine72.listReferenceBasis, "OBSERVED");
assert.equal(pine96.list_reference, 19.99);
assert.equal(pine96.sellingPrice, 20.99);

// User 1 is the first complete job under the new governing standard.
const user1 = evaluateDimensionalTravelJob(catalog, {
  ...structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND),
  storeRevision: "STORE-ZERO-TEST-RELEASE"
});
assert.equal(user1.status, "SUPPORTABLE");
assert.equal(user1.estimate.complete, true);
assert.equal(user1.estimate.travel.derivedSawCuts, 3);
assert.equal(user1.estimate.travel.derivedSpotCount, 2);
assert.equal(user1.materialResolution.pricingReferenceSku, "STB-ZERO-SPF-2X4-60-001");
assert.equal(user1.materialResolution.pricingReferenceStockLengthIn, 60);
assert.equal(user1.materialResolution.selectionPolicy, "SHORTEST_COMPLETE_STORE_OFFERING");
assert.equal(user1.estimate.totals.material, 2.61);
assert.equal(user1.estimate.totals.machine_service, 5.93);
assert.equal(user1.estimate.totals.Q, 8.54);
assert.equal(user1.estimate.travel.time.T_MACHINE_min, 1.4227);
assert.equal(user1.estimate.engine.version, "0.3.0");
assert.equal(ENGINE.version, "0.3.0");

console.log("catalog-pricing.test.mjs ok");
console.log("offerings", catalog.offerings.length);
console.log("observations", observations.observations.length);
console.log("User 1 Q", user1.estimate.totals.Q);
