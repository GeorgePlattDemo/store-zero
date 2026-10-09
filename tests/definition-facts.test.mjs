// Unstated facts stay unstated. Each fact below is tried missing, null, blank, whitespace, explicit zero, valid,
// negative and out of range, through the request layer, for every request type that reads it. A missing fact never
// becomes a value, a malformed one is refused at admission, and only a stated value is priced.
import test from "node:test";
import assert from "node:assert/strict";
import { evaluateStoreRequest } from "../src/requests/store-request.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND as USER1 } from "./fixtures/user1-dimensional-travel-fixture.mjs";

const ask = (requestType, demand) => evaluateStoreRequest({ requestType, requestId: "FACTS", demand }, { release: "facts" });
const board = (edit = (d) => d) => edit(structuredClone(USER1));
const withSpots = (features, extra = {}) => board((d) => ({ ...d, ...extra, parts: [{ ...d.parts[0], features }, d.parts[1]] }));
const spot = (fields) => ({ kind: "SPOT_ON_LOCATION", locationRule: "CENTERED_ON_PART", acrossWidthRule: "CENTERED_ON_WIDE_FACE", featureId: "S1", xIn: 8, ...fields });
const without = (object, key) => { const copy = { ...object }; delete copy[key]; return copy; };
const pkg = (spots, material = {}) => ({
  configurationId: "C", configurationVersion: "1", itemLines: [],
  cutPackages: [{ packageId: "P", material: { species: "spf", form: "board", nominalT: 2, nominalW: 4, grade: "construction", ...material }, endCut: { angleDeg: 0 }, parts: [{ partId: "A", lengthIn: 30, spots }] }]
});
const line = (answer) => answer.packages[0];
const notPriced = (answer, label) => {
  assert.notEqual(answer.status, "SUPPORTABLE", label);
  assert.equal(answer.estimate?.totals?.Q ?? null, null, label);
};

test("a spot location that is not stated is never a spot at 0 in; a stated 0 is", () => {
  const square = board().parts[0];
  // Board: the first part's spot.
  for (const [label, xIn] of [["missing", undefined], ["null", null]]) {
    const answer = ask("USER_DEFINED_BOARD_V1", board((d) => ({ ...d, parts: [{ ...square, features: square.features.map((f) => (xIn === undefined ? without(f, "xIn") : { ...f, xIn })) }, d.parts[1]] })));
    notPriced(answer, `board ${label}`);
    assert.equal(answer.status, "UNRESOLVED", `board ${label}`);
  }
  for (const [label, xIn] of [["blank", ""], ["whitespace", " "]]) {
    const answer = ask("USER_DEFINED_BOARD_V1", board((d) => ({ ...d, parts: [{ ...square, features: square.features.map((f) => ({ ...f, xIn })) }, d.parts[1]] })));
    assert.deepEqual([answer.status, answer.freshEvaluation], ["REFUSED", false], `board ${label} is an admission refusal`);
  }
  const at = (xIn) => ask("USER_DEFINED_BOARD_V1", board((d) => ({ ...d, parts: [{ ...square, features: square.features.map((f) => ({ ...f, xIn })) }, d.parts[1]] })));
  assert.equal(at(0).status, "SUPPORTABLE", "a spot stated at 0 in is a real spot at the reference end");
  assert.equal(at(8).estimate.totals.Q, 8.54);
  assert.notEqual(at(0).estimate.totals.Q, at(8).estimate.totals.Q, "0 and 8 in are different spots, priced as such");
  notPriced(at(-1), "board negative");
  notPriced(at(16.5), "board beyond the part");

  // Cut package: the same rule on the package path.
  const cut = (fields) => line(ask("CUT_PACKAGE_V1", pkg([{ featureId: "S1", acrossWidthRule: "CENTERED_ON_WIDE_FACE", ...fields }])));
  assert.deepEqual([cut({}).status, cut({}).reasonCodes], ["UNRESOLVED", ["SPOT_LOCATION_REQUIRED"]], "cut missing");
  assert.deepEqual([cut({ xIn: null }).status, cut({ xIn: null }).reasonCodes], ["UNRESOLVED", ["SPOT_LOCATION_REQUIRED"]], "cut null is not 0");
  assert.equal(cut({ xIn: null }).Q, null);
  for (const xIn of ["", " "]) assert.equal(ask("CUT_PACKAGE_V1", pkg([{ featureId: "S1", acrossWidthRule: "CENTERED_ON_WIDE_FACE", xIn }])).freshEvaluation, false);
  assert.equal(cut({ xIn: 0 }).status, "SUPPORTABLE");
  assert.equal(cut({ xIn: 15 }).status, "SUPPORTABLE");
  assert.notEqual(cut({ xIn: 0 }).Q, cut({ xIn: 15 }).Q);
  assert.deepEqual(cut({ xIn: -1 }).reasonCodes, ["SPOT_LOCATION_OUTSIDE_PART"]);
  assert.deepEqual(cut({ xIn: 40 }).reasonCodes, ["SPOT_LOCATION_OUTSIDE_PART"]);
});

test("an inset spot keeps its stated inset; a missing inset is asked for, never 0", () => {
  const inset = (insetFromEdgeIn) => ask("USER_DEFINED_BOARD_V1", board((d) => ({ ...d, parts: d.parts.map((p) => ({ ...p, features: p.features.map((f) => ({ ...f, acrossWidthRule: "INSET_FROM_EDGE", insetFromEdgeIn })) })) })));
  // Before the fix the board path dropped the inset, so even a declared 1.5 or 2 in inset was refused.
  assert.equal(inset(1.5).status, "SUPPORTABLE");
  assert.equal(inset(2).status, "SUPPORTABLE");
  assert.equal(inset(1.75).status, "REFUSED");
  const missing = inset(null);
  assert.equal(missing.status, "UNRESOLVED");
  assert.ok(missing.materialResolution.consideredCandidates.every((c) => c.reason === "SPOT_INSET_REQUIRED"));
  const cut = (insetFromEdgeIn) => line(ask("CUT_PACKAGE_V1", pkg([{ featureId: "S1", xIn: 10, acrossWidthRule: "INSET_FROM_EDGE", insetFromEdgeIn }])));
  assert.equal(cut(1.5).status, "SUPPORTABLE");
  assert.deepEqual(cut(1.75).reasonCodes, ["SPOT_INSET_NOT_DECLARED"]);
  assert.deepEqual([cut(null).status, cut(null).reasonCodes], ["UNRESOLVED", ["SPOT_INSET_REQUIRED"]]);
});

test("a spot without its featureId is asked for it, never given a name by Store; no two requested spots can merge", () => {
  const ops = (answer) => answer.estimate.travel.operationPlan.filter((o) => o.kind === "SPOT_ON_LOCATION").map((o) => o.opId);
  const named = ask("USER_DEFINED_BOARD_V1", withSpots([spot({ featureId: "S1", xIn: 4 }), spot({ featureId: "S2", xIn: 12 })], { declaredSpotCount: 3 }));
  assert.equal(named.status, "SUPPORTABLE");
  assert.deepEqual(ops(named), ["S1", "S2", "SPOT-2"], "each requested spot is its own operation, under the name the definition gives it");
  for (const [label, featureId] of [["missing", undefined], ["null", null], ["blank", ""], ["whitespace", " "]]) {
    const answer = ask("USER_DEFINED_BOARD_V1", withSpots([spot({ featureId: "S1", xIn: 4 }), spot({ featureId, xIn: 12 })], { declaredSpotCount: 3 }));
    assert.equal(answer.status, "UNRESOLVED", `board ${label}`);
    assert.ok(answer.materialResolution.consideredCandidates.every((c) => c.reason === "FEATURE_ID_REQUIRED"), `board ${label}`);
    notPriced(answer, `board ${label}`);
  }
  const twice = ask("USER_DEFINED_BOARD_V1", withSpots([spot({ featureId: "S", xIn: 4 }), spot({ featureId: "S", xIn: 12 })], { declaredSpotCount: 3 }));
  assert.equal(twice.status, "UNRESOLVED");
  assert.ok(twice.materialResolution.consideredCandidates.every((c) => c.reason === "UNIQUE_FEATURE_ID_REQUIRED"));
  notPriced(twice, "the same name twice");

  const cut = (ids) => line(ask("CUT_PACKAGE_V1", pkg(ids.map((featureId, i) => ({ ...(featureId === undefined ? {} : { featureId }), xIn: 5 + i * 10, acrossWidthRule: "CENTERED_ON_WIDE_FACE" })))));
  assert.deepEqual([cut(["S1", "S2"]).status, cut(["S1", "S2"]).spotCount], ["SUPPORTABLE", 2], "both named spots are kept");
  for (const [label, featureId] of [["missing", undefined], ["null", null], ["blank", ""], ["whitespace", " "]]) {
    const answer = line(ask("CUT_PACKAGE_V1", pkg([{ featureId: "S1", xIn: 5, acrossWidthRule: "CENTERED_ON_WIDE_FACE" }, { ...(featureId === undefined ? {} : { featureId }), xIn: 15, acrossWidthRule: "CENTERED_ON_WIDE_FACE" }])));
    assert.deepEqual([answer.status, answer.reasonCodes, answer.Q], ["UNRESOLVED", ["FEATURE_ID_REQUIRED"], null], `cut ${label}`);
  }
  assert.deepEqual(cut(["S", "S"]).reasonCodes, ["UNIQUE_FEATURE_ID_REQUIRED"]);
  // A name that once collided with a Store-made positional name is now just a name.
  assert.equal(cut(["A-SPOT-2", "S2"]).status, "SUPPORTABLE");
});

test("Store never picks a wood or a size: missing material is asked for on both board paths", () => {
  for (const [label, edit] of [
    ["no material", (m) => undefined], ["species missing", (m) => without(m, "species")], ["species null", (m) => ({ ...m, species: null })],
    ["species blank", (m) => ({ ...m, species: " " })], ["thickness null", (m) => ({ ...m, nominalT: null })], ["width missing", (m) => without(m, "nominalW")], ["thickness 0", (m) => ({ ...m, nominalT: 0 })]
  ]) {
    const answer = ask("USER_DEFINED_BOARD_V1", board((d) => ({ ...d, materialDemand: edit(d.materialDemand) })));
    if (answer.freshEvaluation === false) { assert.equal(answer.status, "REFUSED", label); continue; }
    assert.deepEqual([answer.status, answer.materialResolution.reason, answer.estimate], ["UNRESOLVED", "MATERIAL_CHOICE_REQUIRED", null], label);
  }
  for (const [label, material] of [["species null", { species: null }], ["thickness null", { nominalT: null }], ["width 0", { nominalW: 0 }]]) {
    assert.deepEqual(line(ask("CUT_PACKAGE_V1", pkg([], material))).reasonCodes, ["MATERIAL_CHOICE_REQUIRED"], label);
  }
});

test("material form: a form that is not stated is asked for; a stated form is matched as given, never replaced", () => {
  const priced = (form) => ask("USER_DEFINED_BOARD_V1", board((d) => {
    const materialDemand = { ...d.materialDemand };
    if (form === undefined) delete materialDemand.form; else materialDemand.form = form;
    return { ...d, materialDemand };
  }));
  assert.equal(priced("board").estimate?.totals?.Q, 8.54);
  // Not stated (absent, null, blank, whitespace) is UNRESOLVED; Store does not fill in board.
  for (const form of [undefined, null, "", " "]) {
    const answer = priced(form);
    assert.deepEqual([answer.status, answer.materialResolution.reason, answer.estimate], ["UNRESOLVED", "MATERIAL_FORM_REQUIRED", null], JSON.stringify(form));
  }
  const cutForm = (form) => {
    const demand = pkg([]);
    if (form === undefined) delete demand.cutPackages[0].material.form; else demand.cutPackages[0].material.form = form;
    return ask("CUT_PACKAGE_V1", demand);
  };
  assert.equal(line(cutForm("board")).status, "SUPPORTABLE");
  for (const form of [undefined, null, "", " "]) {
    const answer = cutForm(form);
    assert.deepEqual([line(answer).status, line(answer).reasonCodes, line(answer).Q], ["UNRESOLVED", ["MATERIAL_FORM_REQUIRED"], null], `cut ${JSON.stringify(form)}`);
    assert.notEqual(answer.status, "SUPPORTABLE");
  }
  // A contradictory stated form is honoured, and no board answers it.
  notPriced(priced("sheet"), "board request stating sheet");
  assert.equal(priced("sheet").materialResolution.reason, "NO_MATCHING_BOARD_OFFERING");
  assert.deepEqual(line(ask("CUT_PACKAGE_V1", pkg([], { form: "sheet" }))).reasonCodes, ["NO_MATCHING_BOARD_OFFERING"]);
  // A grade left blank is a choice still to make, as when it is absent.
  const treated = ask("USER_DEFINED_BOARD_V1", board((d) => ({ ...d, materialDemand: { ...d.materialDemand, species: "syp-treated", grade: " " } })));
  assert.equal(treated.materialResolution.reason, "GRADE_CHOICE_REQUIRED");
});

test("a malformed lookup filter is refused, never dropped to widen discovery", () => {
  const lookup = (query) => ask("OFFERING_LOOKUP", { query });
  for (const [query, field] of [
    [{ species: "" }, "species"], [{ species: null }, "species"], [{ species: "  " }, "species"], [{ species: 7 }, "species"],
    [{ form: "plank" }, "form"], [{ form: null }, "form"], [{ nominalT: "2" }, "nominalT"], [{ nominalT: 0 }, "nominalT"],
    [{ nominalW: -4 }, "nominalW"], [{ stockL_in: true }, "stockL_in"], [{ stockL_in: Number.POSITIVE_INFINITY }, "stockL_in"]
  ]) {
    const answer = lookup(query);
    assert.deepEqual([answer.status, answer.reasonCodes], ["REFUSED", [`LOOKUP_QUERY_FIELD_INVALID:${field}`]], JSON.stringify(query));
    assert.equal(answer.offering, undefined);
  }
  // A valid query returns only an offering that meets every constraint; a contradictory one finds nothing.
  const exact = lookup({ species: "spf", form: "board", nominalT: 2, nominalW: 4, stockL_in: 60 });
  assert.deepEqual([exact.found, exact.offering.storeSku], [true, "STB-ZERO-SPF-2X4-60-001"]);
  assert.equal(lookup({ species: "spf", form: "sheet", nominalT: 2, nominalW: 4, stockL_in: 60 }).found, false);
  assert.equal(lookup({ species: "spf", form: "board", nominalT: 2, nominalW: 4, stockL_in: 61 }).found, false, "no nearest length");
});

test("item quantities and hardware requirements are stated or the line is not priced", () => {
  const items = (itemLines) => ask("CUT_PACKAGE_V1", { configurationId: "C", configurationVersion: "1", cutPackages: [], itemLines }).items[0];
  for (const qty of [null, 0, -1]) {
    assert.deepEqual(items([{ lineId: "L", storeSku: "STB-ZERO-HW-CARRIAGE-BOLT-PACK-001", qty }]).reasonCodes, ["WHOLE_QUANTITY_REQUIRED"], String(qty));
  }
  // A fractional count is not an integer: refused at admission, before any evaluator.
  const fractional = ask("CUT_PACKAGE_V1", { configurationId: "C", configurationVersion: "1", cutPackages: [], itemLines: [{ lineId: "L", storeSku: "STB-ZERO-HW-CARRIAGE-BOLT-PACK-001", qty: 1.5 }] });
  assert.deepEqual([fractional.status, fractional.freshEvaluation, fractional.reasonCodes], ["REFUSED", false, ["DEFINITION_FIELD_TYPE:itemLines[0].qty:integer"]]);
  assert.equal(items([{ lineId: "L", storeSku: "STB-ZERO-HW-CARRIAGE-BOLT-PACK-001", qty: 1 }]).status, "SUPPORTABLE");
  const missingKind = items([{ lineId: "H", qty: 4, requirement: { gauge: "8", lengthIn: 2, finish: "exterior", unit: "piece" } }]);
  assert.deepEqual([missingKind.status, missingKind.reasonCodes], ["UNRESOLVED", ["HARDWARE_REQUIREMENT_INCOMPLETE"]]);
  assert.equal(missingKind.Q, null);
});
