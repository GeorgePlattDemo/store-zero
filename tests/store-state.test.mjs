// Stock, price and capability answers, and the four Store dispositions.
import assert from "node:assert/strict";
import { loadCatalog, findSku } from "../src/evaluation/catalog.mjs";
import { STAGE2_JOB_DISPOSITIONS, capabilityAnswer, priceAnswer, stockAnswer } from "../src/evaluation/store-state.mjs";
import { CYCLE_MODEL } from "../src/evaluation/engine/pricing.mjs";
import { evaluateCutPackageJob } from "../src/evaluation/evaluators/cut-package.mjs";

const catalog = loadCatalog();
assert.deepEqual([...STAGE2_JOB_DISPOSITIONS].sort(), ["REFUSED", "SUPPORTABLE", "UNAVAILABLE", "UNRESOLVED"]);
assert.equal(CYCLE_MODEL.id, "STB-D001-DIMENSIONAL-TRAVEL-0.1");
assert.equal(CYCLE_MODEL.measured, false);

const pine = findSku(catalog, "STB-ZERO-PINE-1X6-96-001");

// Stock is declared fixture state: available = onHand - allocated, answered against the quantity needed.
assert.equal(stockAnswer(pine, 1, catalog.clock).status, "ON_HAND_SUFFICIENT");
assert.equal(stockAnswer({ ...pine, onHand: 3, allocated: 0 }, 10, catalog.clock).status, "ON_HAND_SHORT");
assert.equal(stockAnswer({ ...pine, onHand: 5, allocated: 5 }, 1, catalog.clock).status, "NOT_ON_HAND");
assert.equal(stockAnswer({ ...pine, onHand: 0, allocated: 0 }, 1, catalog.clock).sufficient, false);
assert.equal(stockAnswer(null, 1, catalog.clock).reason, "SKU_NOT_OFFERED");
assert.equal(stockAnswer(pine, 1, catalog.clock).assertions.onHand.basis, "SYNTHETIC_FIXTURE");

// The answer's date is the catalog's own clock, never a date written into code.
assert.equal(stockAnswer(pine, 1, catalog.clock).asOf, catalog.clock);
assert.equal(priceAnswer(pine, catalog.clock).asOf, catalog.clock);
assert.equal(stockAnswer(pine, 1, "2027-01-01").asOf, "2027-01-01");

assert.equal(priceAnswer(pine, catalog.clock).sellingPrice, 20.99);
assert.equal(priceAnswer({ ...pine, sellingPrice: null }, catalog.clock).reason, "MISSING_PRICE");
assert.equal(capabilityAnswer(null, ["CROSSCUT"]).status, "REFUSED");
assert.equal(capabilityAnswer(findSku(catalog, "STB-ZERO-PINESTD-1X4-96-001"), ["MILL_LONGITUDINAL_PROFILE"]).status, "REFUSED");

// The four dispositions through an exact-SKU line: sufficient, short, absent, and not offered.
const withStock = (onHand) => ({ ...catalog, offerings: catalog.offerings.map((o) => (o.storeSku === pine.storeSku ? { ...o, onHand, allocated: 0 } : o)) });
const line = (c, storeSku, qty) => evaluateCutPackageJob(c, { configurationId: "T", configurationVersion: "1", cutPackages: [], itemLines: [{ lineId: "L", storeSku, qty }] }).items[0];
assert.equal(line(catalog, pine.storeSku, 1).status, "SUPPORTABLE");
assert.equal(line(withStock(3), pine.storeSku, 10).status, "UNAVAILABLE");
assert.deepEqual(line(withStock(3), pine.storeSku, 10).reasonCodes, ["ON_HAND_SHORT"]);
assert.deepEqual(line(withStock(0), pine.storeSku, 1).reasonCodes, ["NOT_ON_HAND"]);
assert.deepEqual(line(catalog, "STB-ZERO-DOES-NOT-EXIST", 1).reasonCodes, ["NO_OFFERING"]);

console.log("store-state.test.mjs ok");
