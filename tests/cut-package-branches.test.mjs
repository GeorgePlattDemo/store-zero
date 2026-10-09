import test from "node:test";
import assert from "node:assert/strict";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { evaluateCutPackageJob, RIP_RULE } from "../src/evaluation/evaluators/cut-package.mjs";
import { evaluateD001DimensionalBatch } from "../src/evaluation/engine/d001-travel-standard.mjs";

// Neutral branch tests for the cut-package evaluator, against the frozen recorded catalog.
const SPF_2X4 = Object.freeze({ species: "spf", form: "board", nominalT: 2, nominalW: 4, grade: "construction" });
const PINE_1X8 = Object.freeze({ species: "pine", form: "board", nominalT: 1, nominalW: 8, grade: "select" });
const DECLARED_REQUIREMENT_ID = "ALCOVE-PINS-AND-SCREWS";

const run = (cutPackages = [], itemLines = [], catalog = recordedCatalog()) =>
  evaluateCutPackageJob(catalog, { configurationId: "BRANCH-TEST", configurationVersion: "1", cutPackages, itemLines });
const onlyPackage = (pkg, catalog) => run([pkg], [], catalog).packages[0];
const onlyItem = (itemLine, catalog) => run([], [itemLine], catalog).items[0];
const pkg = (packageId, material, extra = {}) => ({ packageId, material, endCut: { angleDeg: 0 }, parts: [{ partId: "P1", lengthIn: 30 }], ...extra });
const centered = (xIn, featureId = "P1-SPOT-1") => ({ featureId, xIn, acrossWidthRule: "CENTERED_ON_WIDE_FACE" });
const inset = (xIn, insetFromEdgeIn, featureId = "P1-SPOT-1") => ({ featureId, xIn, acrossWidthRule: "INSET_FROM_EDGE", insetFromEdgeIn });

function withRows(mutate) {
  const catalog = recordedCatalog();
  mutate(catalog);
  return catalog;
}
const rowOf = (catalog, storeSku) => catalog.offerings.find((o) => o.storeSku === storeSku);
const cloneRow = (catalog, storeSku, overrides) => ({ ...structuredClone(rowOf(catalog, storeSku)), ...overrides });

// ---------------------------------------------------------------------------------------------
// 1. End-cut angle
// ---------------------------------------------------------------------------------------------

test("end-cut angle: a missing or blank angle is unresolved, never a square cut", () => {
  // Rule: an end cut must state a numeric angle; absent, null, {} or blank never defaults to 0.
  const shapes = {
    MISSING: {},
    NULL_END_CUT: { endCut: null },
    EMPTY_END_CUT: { endCut: {} },
    NULL_ANGLE: { endCut: { angleDeg: null } },
    BLANK_ANGLE: { endCut: { angleDeg: "" } },
    WORD_ANGLE: { endCut: { angleDeg: "square" } }
  };
  for (const [id, shape] of Object.entries(shapes)) {
    const p = { packageId: id, material: SPF_2X4, parts: [{ partId: "P1", lengthIn: 30 }], ...shape };
    if (!("endCut" in shape)) delete p.endCut;
    const answer = onlyPackage(p);
    assert.equal(answer.status, "UNRESOLVED", id);
    assert.deepEqual(answer.reasonCodes, ["END_CUT_ANGLE_REQUIRED"], id);
    assert.equal(answer.Q, null, id);
    assert.equal(answer.storeSku, undefined, id);
    assert.notEqual(answer.endCut.angleDeg, 0, `${id} is not answered as a square cut`);
  }
});

test("end-cut angle: explicit 0 and a valid miter are supportable and echo the angle", () => {
  // Rule: a stated angle within 0-45 is cut as stated; 0 is a crosscut, anything else a limited miter.
  const square = onlyPackage(pkg("SQUARE", SPF_2X4, { endCut: { angleDeg: 0 } }));
  assert.equal(square.status, "SUPPORTABLE");
  assert.equal(square.endCut.angleDeg, 0);
  assert.deepEqual(square.requiredOps, ["CROSSCUT"]);
  const miter = onlyPackage(pkg("MITER", SPF_2X4, { endCut: { angleDeg: 30 } }));
  assert.equal(miter.status, "SUPPORTABLE");
  assert.equal(miter.endCut.angleDeg, 30);
  assert.deepEqual(miter.requiredOps, ["MITER_LIMITED"]);
  assert.ok(miter.Q > 0);
});

// ---------------------------------------------------------------------------------------------
// 2. Equal material-extension ties
// ---------------------------------------------------------------------------------------------

test("tie: equal extension and equal stock length are ordered by SKU, not catalog order", () => {
  // Rule: among supportable boards at the same cost and length, the lowest SKU wins.
  const original = "STB-ZERO-SPF-2X4-60-001";
  const earlier = "STB-ZERO-SPF-2X4-60-000";
  const later = "STB-ZERO-SPF-2X4-60-002";
  const appended = withRows((c) => c.offerings.push(cloneRow(c, original, { storeSku: earlier })));
  const prepended = withRows((c) => c.offerings.unshift(cloneRow(c, original, { storeSku: earlier })));
  assert.equal(onlyPackage(pkg("A", SPF_2X4), appended).storeSku, earlier);
  assert.equal(onlyPackage(pkg("A", SPF_2X4), prepended).storeSku, earlier);
  const laterFirst = withRows((c) => c.offerings.unshift(cloneRow(c, original, { storeSku: later })));
  assert.equal(onlyPackage(pkg("A", SPF_2X4), laterFirst).storeSku, original);
});

test("tie: equal extension with different stock lengths picks the shorter board", () => {
  // Rule: at equal material cost the shorter stocked board wins, even against an earlier-sorting SKU.
  const shorter = "STB-ZERO-SPF-2X4-60-001";
  const longerTie = "STB-ZERO-SPF-2X4-00-TIE";
  const catalog = withRows((c) => {
    const price = rowOf(c, shorter).sellingPrice;
    c.offerings.unshift(cloneRow(c, "STB-ZERO-SPF-2X4-72-001", { storeSku: longerTie, sellingPrice: price }));
  });
  const answer = onlyPackage(pkg("A", SPF_2X4), catalog);
  assert.equal(answer.status, "SUPPORTABLE");
  assert.equal(answer.storeSku, shorter);
  assert.equal(answer.stockLengthIn, 60);
  const tied = answer.considered.filter((c) => c.status === "SUPPORTABLE" && c.materialExtension === answer.totals.material);
  assert.deepEqual(tied.map((c) => c.storeSku).sort(), [longerTie, shorter].sort(), "the tie is real");
});

// ---------------------------------------------------------------------------------------------
// 3. Propagated D-001 machine failures
// ---------------------------------------------------------------------------------------------

test("D-001: a spot outside a long part is refused with the batch code", () => {
  // Rule: a spot past the component end is refused by the D-001 batch and the line carries that code.
  const answer = onlyPackage(pkg("OUT", SPF_2X4, { parts: [{ partId: "P1", lengthIn: 60, spots: [centered(65)] }] }));
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["SPOT_LOCATION_OUTSIDE_COMPONENT"]);
  assert.equal(answer.reasonRecord.category, "CAPABILITY_GAP");
  assert.equal(answer.Q, null);
  assert.deepEqual(answer.machineRefusals[0], { storeSku: "STB-ZERO-SPF-2X4-72-001", refused: ["SPOT_LOCATION_OUTSIDE_COMPONENT"], unresolved: [] });
});

test("D-001: an undeclared spot inset is refused on the long-part path", () => {
  // Rule: only the declared 1 1/2 in and 2 in insets are run; any other inset is refused, not rounded.
  const answer = onlyPackage(pkg("INSET", SPF_2X4, { parts: [{ partId: "P1", lengthIn: 60, spots: [inset(10, 1.75)] }] }));
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["SPOT_INSET_NOT_DECLARED"]);
  assert.equal(answer.machineRefusals[0].storeSku, "STB-ZERO-SPF-2X4-72-001");
  assert.ok(answer.machineRefusals.every((m) => m.refused.includes("SPOT_INSET_NOT_DECLARED")));
  const declared = onlyPackage(pkg("INSET", SPF_2X4, { parts: [{ partId: "P1", lengthIn: 60, spots: [inset(10, 2)] }] }));
  assert.equal(declared.status, "SUPPORTABLE");
  assert.equal(declared.cutPlan[0].path, "LONG_PART");
});

test("D-001: a spot with no numeric location is unresolved", () => {
  // Rule: a machine-side unresolved fact makes the line UNRESOLVED with that code, not REFUSED.
  const answer = onlyPackage(pkg("LOC", SPF_2X4, { parts: [{ partId: "P1", lengthIn: 60, spots: [centered("near the end")] }] }));
  assert.equal(answer.status, "UNRESOLVED");
  assert.deepEqual(answer.reasonCodes, ["SPOT_LOCATION_REQUIRED"]);
  assert.deepEqual(answer.machineRefusals[0], { storeSku: "STB-ZERO-SPF-2X4-72-001", refused: [], unresolved: ["SPOT_LOCATION_REQUIRED"] });
});

test("D-001: a miter angle outside 0-45 is refused", () => {
  // Rule: the end cut is limited to the declared 0-45 degree miter envelope.
  for (const angleDeg of [50, -5]) {
    const answer = onlyPackage(pkg(`ANGLE${angleDeg}`, SPF_2X4, { endCut: { angleDeg } }));
    assert.equal(answer.status, "REFUSED", String(angleDeg));
    assert.deepEqual(answer.reasonCodes, ["MITER_ANGLE_OUTSIDE_D001_STAGE2_ENVELOPE"], String(angleDeg));
    assert.equal(answer.endCut.angleDeg, angleDeg);
  }
  assert.equal(onlyPackage(pkg("ANGLE45", SPF_2X4, { endCut: { angleDeg: 45 } })).status, "SUPPORTABLE");
});

test("D-001: a long-path component below two-roller control is refused", () => {
  // Rule: a part the cell must run on its own needs the 24 in two-roller control length.
  const shortStock = withRows((c) => {
    c.offerings.push(cloneRow(c, "STB-ZERO-SPF-2X4-60-001", { storeSku: "STB-ZERO-SPF-2X4-40-SHORT", stockL_in: 40, grade: "short-stock" }));
  });
  const answer = onlyPackage(pkg("SHORT", { ...SPF_2X4, grade: "short-stock" }, { parts: [{ partId: "P1", lengthIn: 20 }] }), shortStock);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["COMPONENT_LENGTH_BELOW_TWO_ROLLER_CONTROL"]);
  // The same code the D-001 batch itself gives for that component.
  const batch = evaluateD001DimensionalBatch({
    componentRuns: [{ item: rowOf(shortStock, "STB-ZERO-SPF-2X4-40-SHORT"), component: { componentId: "P1", finishedLengthIn: 20, finishedWidthIn: 3.5, features: [] } }]
  });
  assert.equal(batch.status, "REFUSED");
  assert.deepEqual(batch.reasons, ["COMPONENT_LENGTH_BELOW_TWO_ROLLER_CONTROL"]);
});

test("D-001: when the cheapest board's machine run fails, the next supportable board of the same wood is used", () => {
  // Rule: a machine refusal on one candidate falls through to the next candidate; the wood never changes.
  const narrow = "STB-ZERO-SPF-2X4-72-NARROW";
  const catalog = withRows((c) => {
    c.offerings.unshift(cloneRow(c, "STB-ZERO-SPF-2X4-72-001", { storeSku: narrow, actualW: 1.75, sellingPrice: 1 }));
  });
  const answer = onlyPackage(pkg("FALLBACK", SPF_2X4, { parts: [{ partId: "P1", lengthIn: 60, spots: [inset(10, 2)] }] }), catalog);
  assert.equal(answer.status, "SUPPORTABLE");
  assert.equal(answer.storeSku, "STB-ZERO-SPF-2X4-72-001");
  const first = answer.considered.find((c) => c.storeSku === narrow);
  assert.equal(first.status, "SUPPORTABLE", "the cheaper board passed every pre-machine check");
  assert.ok(first.materialExtension < answer.totals.material);
  // That candidate's own machine answer is the refusal that forced the fall-through.
  const alone = withRows((c) => {
    c.offerings.push(cloneRow(c, "STB-ZERO-SPF-2X4-72-001", { storeSku: narrow, actualW: 1.75, grade: "narrow-only" }));
  });
  const refused = onlyPackage(pkg("NARROW", { ...SPF_2X4, grade: "narrow-only" }, { parts: [{ partId: "P1", lengthIn: 60, spots: [inset(10, 2)] }] }), alone);
  assert.equal(refused.status, "REFUSED");
  assert.deepEqual(refused.reasonCodes, ["SPOT_INSET_OUTSIDE_BOARD_WIDTH"]);
});

// ---------------------------------------------------------------------------------------------
// 4. Rip rule
// ---------------------------------------------------------------------------------------------

test("rip rule: exactly 1 in removed is an edge mill pass-through, no offcut", () => {
  // Rule: up to the router's 1 in cut width the far edge is milled away.
  const answer = onlyPackage(pkg("EDGE", PINE_1X8, { finishedWidthIn: 6.25 }));
  assert.equal(answer.status, "SUPPORTABLE");
  assert.equal(answer.edgeMill.mode, "EDGE_MILL_PASS_THROUGH");
  assert.equal(answer.edgeMill.removedIn, 1);
  assert.equal(answer.edgeMill.offcut, undefined);
  assert.equal(answer.edgeMill.rule, undefined);
  assert.ok(answer.cutPlan.every((b) => b.edgeMill.kind === "EDGE_MILL_PASS_THROUGH"));
});

test("rip rule: just over 1 in removed is ripped at the finished width with the offcut returned", () => {
  // Rule (STB-CUT-PACKAGE-RIP-0.1): more than 1 in removed is a rip; offcut width = actual - finished.
  const answer = onlyPackage(pkg("RIP", PINE_1X8, { finishedWidthIn: 6.24 }));
  assert.equal(answer.status, "SUPPORTABLE");
  assert.equal(answer.edgeMill.mode, "RIP_AT_FINISHED_WIDTH");
  assert.equal(answer.edgeMill.mode, RIP_RULE.mode);
  assert.equal(answer.edgeMill.rule, "STB-CUT-PACKAGE-RIP-0.1");
  assert.equal(answer.edgeMill.boardWidthIn, 7.25);
  assert.ok(Math.abs(answer.edgeMill.offcut.widthBeforeRouterCutIn - (answer.edgeMill.boardWidthIn - 6.24)) < 1e-9);
  assert.ok(Math.abs(answer.edgeMill.offcut.widthBeforeRouterCutIn - 1.01) < 1e-9);
  assert.equal(answer.edgeMill.offcut.disposition, "RETURNED_TO_OWNER");
  assert.equal(answer.edgeMill.offcut.lengthIn, answer.stockLengthIn);
  assert.ok(answer.cutPlan.every((b) => b.edgeMill.kind === "RIP_AT_FINISHED_WIDTH"));
});

test("rip rule: a finished width above the board width is refused", () => {
  // Rule: a board is never made wider; finished width over actual width is refused.
  const answer = onlyPackage(pkg("WIDE", PINE_1X8, { finishedWidthIn: 7.5 }));
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["FINISHED_WIDTH_EXCEEDS_BOARD_WIDTH"]);
  assert.equal(answer.Q, null);
});

// ---------------------------------------------------------------------------------------------
// 5. Functional-requirement item lines
// ---------------------------------------------------------------------------------------------

test("functional requirement: no declaring offering is refused", () => {
  // Rule: only an offering whose row declares the requirement can answer it; no nearest item.
  const answer = onlyItem({ lineId: "R", qty: 1, requirementId: "NO-SUCH-REQUIREMENT" });
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["NO_OFFERING_FOR_REQUIREMENT"]);
  assert.equal(answer.storeSku, null);
  assert.equal(answer.Q, null);
});

test("functional requirement: the declared item is priced at selling price times quantity", () => {
  // Rule: a declared, offered, priced, in-stock item answers the requirement at its catalog price.
  const catalog = recordedCatalog();
  const row = catalog.offerings.find((o) => o.satisfiesRequirementIds?.includes(DECLARED_REQUIREMENT_ID));
  const answer = onlyItem({ lineId: "R", qty: 2, requirementId: DECLARED_REQUIREMENT_ID }, catalog);
  assert.equal(answer.status, "SUPPORTABLE");
  assert.equal(answer.storeSku, row.storeSku);
  assert.equal(answer.Q, Math.round(row.sellingPrice * 2 * 100) / 100);
});

test("functional requirement: a declared item that is not offered is refused", () => {
  // Rule: a listed but not-offered item is never sold.
  let sku;
  const catalog = withRows((c) => {
    const i = c.offerings.findIndex((o) => o.satisfiesRequirementIds?.includes(DECLARED_REQUIREMENT_ID));
    sku = c.offerings[i].storeSku;
    c.offerings[i] = { ...structuredClone(c.offerings[i]), offered: false };
  });
  const answer = onlyItem({ lineId: "R", qty: 1, requirementId: DECLARED_REQUIREMENT_ID }, catalog);
  assert.equal(answer.status, "REFUSED");
  assert.deepEqual(answer.reasonCodes, ["NOT_OFFERED"]);
  assert.equal(answer.storeSku, sku);
  assert.equal(answer.Q, null);
});

test("functional requirement: a declared item with no selling price is unresolved", () => {
  // Rule: no price, no answer; the line is UNRESOLVED MISSING_PRICE.
  const catalog = withRows((c) => {
    const i = c.offerings.findIndex((o) => o.satisfiesRequirementIds?.includes(DECLARED_REQUIREMENT_ID));
    c.offerings[i] = { ...structuredClone(c.offerings[i]), sellingPrice: null };
  });
  const answer = onlyItem({ lineId: "R", qty: 1, requirementId: DECLARED_REQUIREMENT_ID }, catalog);
  assert.equal(answer.status, "UNRESOLVED");
  assert.deepEqual(answer.reasonCodes, ["MISSING_PRICE"]);
  assert.equal(answer.Q, null);
});

test("functional requirement: a quantity over available stock is unavailable", () => {
  // Rule: the quantity must be on hand (onHand - allocated); one more than that is UNAVAILABLE.
  const catalog = recordedCatalog();
  const row = catalog.offerings.find((o) => o.satisfiesRequirementIds?.includes(DECLARED_REQUIREMENT_ID));
  const available = row.onHand - row.allocated;
  assert.equal(onlyItem({ lineId: "R", qty: available, requirementId: DECLARED_REQUIREMENT_ID }, catalog).status, "SUPPORTABLE");
  const short = onlyItem({ lineId: "R", qty: available + 1, requirementId: DECLARED_REQUIREMENT_ID }, catalog);
  assert.equal(short.status, "UNAVAILABLE");
  assert.deepEqual(short.reasonCodes, ["ON_HAND_SHORT"]);
  assert.equal(short.storeSku, row.storeSku);
  assert.equal(short.Q, null);
});

test("functional requirement: a non-whole quantity is unresolved", () => {
  // Rule: a functional requirement needs a positive whole-number quantity.
  for (const qty of [1.5, 0, -1, "two"]) {
    const answer = onlyItem({ lineId: "R", qty, requirementId: DECLARED_REQUIREMENT_ID });
    assert.equal(answer.status, "UNRESOLVED", String(qty));
    assert.deepEqual(answer.reasonCodes, ["WHOLE_QUANTITY_REQUIRED"], String(qty));
  }
});

test("functional requirement: naming a requirementId and another item is unresolved", () => {
  // Rule: an item line names exactly one of storeSku, requirement, requirementId.
  const structured = { kind: "wood-screw", gauge: "#10", lengthIn: 2.5, finish: "coated", unit: "piece" };
  for (const extra of [{ requirement: structured }, { storeSku: "STB-ZERO-HW-CARRIAGE-BOLT-PACK-001" }]) {
    const answer = onlyItem({ lineId: "R", qty: 1, requirementId: DECLARED_REQUIREMENT_ID, ...extra });
    assert.equal(answer.status, "UNRESOLVED");
    assert.deepEqual(answer.reasonCodes, ["ITEM_LINE_NAMES_MORE_THAN_ONE_ITEM"]);
    assert.equal(answer.storeSku, null);
    assert.equal(answer.Q, null);
  }
});
