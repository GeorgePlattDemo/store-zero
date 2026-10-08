// The live catalog is data held to rules. Adding an offering is adding a row; this file proves that a correct
// row needs no code change and that each kind of incorrect row is refused before any answer is given.
import test from "node:test";
import assert from "node:assert/strict";
import { catalogProblems, loadCatalog, sellingPriceFor, validateCatalog } from "../../src/evaluation/catalog.mjs";
import { evaluateStoreRequest } from "../../src/requests/store-request.mjs";
import { evaluateDimensionalTravelJob } from "../../src/evaluation/evaluators/user-defined-board.mjs";

const live = loadCatalog();
const row = (sku) => structuredClone(live.offerings.find((o) => o.storeSku === sku));
const withRow = (o) => ({ ...structuredClone(live), offerings: [...structuredClone(live.offerings), o] });
const withChanged = (sku, change) => ({
  ...structuredClone(live),
  offerings: structuredClone(live.offerings).map((o) => (o.storeSku === sku ? change(o) : o))
});

// A new 84 in SPF 2x4, priced by the declared rule from its list reference.
function newBoard() {
  const o = row("STB-ZERO-SPF-2X4-96-001");
  o.storeSku = "STB-ZERO-SPF-2X4-84-001";
  o.stockL_in = 84;
  o.description = "2x4 x 84 in SPF construction";
  o.list_reference = 3.48;
  o.sellingPrice = sellingPriceFor(3.48);
  o.listReferenceBasis = "PLAUSIBLE";
  o.observationId = null;
  o.assertions.externalListPrice = { basis: "PLAUSIBLE", value: 3.48, note: "Owner's plausible price for a new length." };
  return o;
}

test("the live catalog is valid", () => {
  assert.deepEqual(catalogProblems(live), []);
});

test("a correct new offering is accepted and answered with no code change", () => {
  const catalog = withRow(newBoard());
  assert.deepEqual(catalogProblems(catalog), []);
  const answer = evaluateStoreRequest(
    { requestType: "OFFERING_LOOKUP", requestId: "LOOKUP-NEW", demand: { storeSku: "STB-ZERO-SPF-2X4-84-001" } },
    { release: "catalog-test", catalog, observations: { observations: [] } }
  );
  assert.equal(answer.found, true);
  assert.equal(answer.offering.sellingPrice, 3.65);
});

test("a new offering can legitimately change a live answer, and only through the declared selection rule", () => {
  // A 64 in treated board is shorter than the 72 in parent and still leaves the 24 in control length for two
  // 18 in parts, so the shortest-complete rule now selects it. The recorded Project 1 answer is reproduced
  // against the frozen recorded catalog (acceptance/project-1), so it does not move.
  const o = row("STB-ZERO-PTAG-2X4-72-001");
  o.storeSku = "STB-ZERO-PTAG-2X4-64-001";
  o.stockL_in = 64;
  o.description = "2x4 x 64 in treated SYP above-ground";
  o.list_reference = 4.39;
  o.sellingPrice = sellingPriceFor(4.39);
  o.listReferenceBasis = "PLAUSIBLE";
  o.observationId = null;
  o.assertions.externalListPrice = { basis: "PLAUSIBLE", value: 4.39, note: "Test row." };
  delete o.assertions.listReferenceDerivation;
  const catalog = withRow(o);
  assert.deepEqual(catalogProblems(catalog), []);
  const demand = {
    configurationId: "SYO-USER1-XBRACE", configurationVersion: "0.2", classId: "app.user-defined-board.v1",
    materialDemand: { species: "syp-treated", form: "board", nominalT: 2, nominalW: 4 },
    definedWorkpieceLengthIn: 60, requiredOps: ["MITER_LIMITED", "SPOT_ON_LOCATION"], sawAngleDeg: 26.387799961243,
    cutPlane: "miter-face", datumCMethod: "REFERENCE_CUT", declaredSawCuts: 3, declaredSpotCount: 2, unresolvedConditions: [],
    parts: [1, 2].map((n) => ({ partId: `PART-${n}`, lengthIn: 18, features: [{ featureId: `SPOT-${n}`, kind: "SPOT_ON_LOCATION", xIn: 9, locationRule: "CENTERED_ON_PART", acrossWidthRule: "CENTERED_ON_WIDE_FACE" }] }))
  };
  assert.equal(evaluateDimensionalTravelJob(live, demand).materialResolution.storeSku, "STB-ZERO-PTAG-2X4-72-001");
  assert.equal(evaluateDimensionalTravelJob(catalog, demand).materialResolution.storeSku, "STB-ZERO-PTAG-2X4-64-001");
});

const broken = {
  "a duplicate SKU": () => withRow(row("STB-ZERO-SPF-2X4-96-001")),
  "a selling price that does not follow the mark-on rule": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, sellingPrice: o.sellingPrice + 0.01 })),
  "a board without its actual width": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, actualW: null })),
  "a sheet carrying a board length": () => withChanged("STB-ZERO-PLY-050-48X96-001", (o) => ({ ...o, stockL_in: 96 })),
  "an undeclared operation": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, supportedOps: [...o.supportedOps, "LASER_ENGRAVE"] })),
  "a board outside the D-001 cell family": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, cellFamily: ["S-001"] })),
  "allocation above on-hand": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, allocated: o.onHand + 1 })),
  "fractional stock": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, onHand: 2.5 })),
  "a missing stock assertion": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => { const { onHand, ...rest } = o.assertions; return { ...o, assertions: rest }; }),
  "an unknown field": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, color: "blue" })),
  "an observed price that is not the observation": () => withChanged("STB-ZERO-SPF-2X4-96-001", (o) => ({ ...o, assertions: { ...o.assertions, externalListPrice: { ...o.assertions.externalListPrice, value: 9.99 } } })),
  "a requirement satisfied by two offerings": () => withChanged("STB-ZERO-HW-SHELFPIN-5MM-100-001", (o) => ({ ...o, satisfiesRequirementIds: ["ALCOVE-PINS-AND-SCREWS"] })),
  "a hand-maintained count": () => ({ ...structuredClone(live), skuCount: live.offerings.length })
};

for (const [what, make] of Object.entries(broken)) {
  test(`refused before any answer: ${what}`, () => {
    const catalog = make();
    assert.ok(catalogProblems(catalog).length > 0);
    assert.throws(() => validateCatalog(catalog), { code: "STORE_CATALOG_INVALID" });
    assert.throws(
      () => evaluateStoreRequest({ requestType: "OFFERING_LOOKUP", requestId: "R", demand: { searchText: "2x4" } }, { release: "catalog-test", catalog }),
      { code: "STORE_CATALOG_INVALID" }
    );
  });
}
