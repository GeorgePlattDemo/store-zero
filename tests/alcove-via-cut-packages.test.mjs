// An alcove insert is an ordinary cut-package job: the shared model decides the sequence. Boards are brought to
// width first, then cut, under the same retained-control rule as every job; the kit is a functional requirement.
import assert from "node:assert/strict";
import { evaluateCutPackageJob } from "../src/evaluation/evaluators/cut-package.mjs";
import { evaluateStoreRequest } from "../src/requests/store-request.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { alcoveCutPackages, shelfDepthIn } from "./fixtures/alcove-cut-packages.mjs";

const catalog = recordedCatalog();
const answer = (options) => evaluateCutPackageJob(catalog, alcoveCutPackages(options));
const line = (a, id) => [...a.packages, ...a.items].find((l) => (l.packageId ?? l.lineId) === id);

// The pine alcove: every line supportable, every board from the chosen wood, the narrow strips ripped first.
const pine = answer({});
assert.equal(pine.status, "SUPPORTABLE");
assert.deepEqual(
  [...pine.packages].map((p) => [p.packageId, p.storeSku, p.boards]),
  [["UPRIGHTS", "STB-ZERO-PINE-1X6-72-001", 4], ["SHELF-1X6", "STB-ZERO-PINE-1X6-120-001", 5], ["SHELF-1X6-TO-3", "STB-ZERO-PINE-1X6-72-001", 5]]
);
const narrow = line(pine, "SHELF-1X6-TO-3");
assert.equal(narrow.edgeMill.mode, "RIP_AT_FINISHED_WIDTH");
assert.equal(narrow.edgeMill.finishedWidthIn, 3);
assert.equal(narrow.edgeMill.offcut.widthBeforeRouterCutIn, 2.5);
assert.ok(narrow.cutPlan.every((board) => board.edgeMill.kind === "RIP_AT_FINISHED_WIDTH"), "every board is brought to width before its parts are cut");
// Every board keeps the two-roller control length while it is cut; the stubs are returned.
assert.ok(pine.packages.flatMap((p) => p.stubs).every((s) => s.stubIn >= 24));
// The kit is the item the catalog declares for the requirement; the project never names its SKU.
const kit = line(pine, "PINS-AND-SCREWS");
assert.deepEqual([kit.status, kit.storeSku, kit.resolvedBy, kit.Q], ["SUPPORTABLE", "STB-ZERO-HW-ALCOVE-PACK-001", "FUNCTIONAL_REQUIREMENT_DECLARED_BY_OFFERING", 18]);
// The answer: material 272.86, machine service 138.30, kit 18.00, total 429.16.
assert.equal(pine.totals.material, 272.86);
assert.equal(pine.totals.machine_service, 138.3);
assert.equal(pine.totals.sumOfSupportableLines, 429.16);

// Another wood reprices every line and keeps the wood; a wood the cell cannot mill is refused on that line only.
assert.ok(answer({ species: "poplar" }).totals.sumOfSupportableLines > pine.totals.sumOfSupportableLines);
const oak = answer({ species: "oak" });
assert.equal(line(oak, "SHELF-1X6-TO-3").status, "REFUSED");
assert.deepEqual(line(oak, "SHELF-1X6-TO-3").reasonCodes, ["OP_NOT_ON_OFFERING:MILL_LONGITUDINAL_PROFILE"]);
assert.equal(line(oak, "UPRIGHTS").status, "SUPPORTABLE");
assert.deepEqual(line(answer({ species: "walnut" }), "UPRIGHTS").reasonCodes, ["NO_MATCHING_BOARD_OFFERING"]);

// Taller uprights need a longer board; a depth that is whole boards needs no rip.
assert.equal(line(answer({ height: 72 }), "UPRIGHTS").storeSku, "STB-ZERO-PINE-1X6-96-001");
assert.ok(answer({ depth: 11 }).packages.every((p) => p.edgeMill == null), "two whole 1x6 strips make 11 in with no milling");

// The layout is the user's choice, not the yard's. The same 14 in shelf can be made many ways from the widths on
// offer; each is its own definition and gets its own answer, with the operations it needs and its price. Store
// answers every one and picks none: whole boards a little over or under the depth need no milling, and bringing
// boards to an exact depth costs machine time. An inch here or there changes what is done and what it costs.
const LAYOUTS = {
  "1x8 + 1x8": { strips: [{ nominalW: 8 }, { nominalW: 8 }], depth: 14.5, operation: null, Q: 301.86 },
  "1x6 + 1x6 + 1x3": { strips: [{ nominalW: 6 }, { nominalW: 6 }, { nominalW: 3 }], depth: 13.5, operation: null, Q: 303.45 },
  "1x6 + 1x6 + 1x4": { strips: [{ nominalW: 6 }, { nominalW: 6 }, { nominalW: 4 }], depth: 14.5, operation: null, Q: 327.74 },
  "1x10 + 1x6": { strips: [{ nominalW: 10 }, { nominalW: 6 }], depth: 14.75, operation: null, Q: 353.28 },
  "1x6 + 1x6 + 1x4 milled to 3": { strips: [{ nominalW: 6 }, { nominalW: 6 }, { nominalW: 4, finishedWidthIn: 3 }], depth: 14, operation: "EDGE_MILL_PASS_THROUGH", Q: 393.71 },
  "1x8 + 1x8 milled to 7": { strips: [{ nominalW: 8, finishedWidthIn: 7 }, { nominalW: 8, finishedWidthIn: 7 }], depth: 14, operation: "EDGE_MILL_PASS_THROUGH", Q: 411.94 },
  "1x6 + 1x6 + 1x6 ripped to 3": { strips: [{ nominalW: 6 }, { nominalW: 6 }, { nominalW: 6, finishedWidthIn: 3 }], depth: 14, operation: "RIP_AT_FINISHED_WIDTH", Q: 429.16 }
};
for (const [name, expected] of Object.entries(LAYOUTS)) {
  const a = answer({ shelfStrips: expected.strips });
  assert.equal(shelfDepthIn(expected.strips), expected.depth, name);
  assert.equal(a.status, "SUPPORTABLE", name);
  const operations = [...new Set(a.packages.filter((p) => p.edgeMill).map((p) => p.edgeMill.mode))];
  assert.deepEqual(operations, expected.operation ? [expected.operation] : [], name);
  assert.equal(a.totals.sumOfSupportableLines, expected.Q, name);
}
// Each answer is for the layout it was sent: the default pine answer is the rip layout, not a choice Store made.
assert.equal(answer({ shelfStrips: LAYOUTS["1x6 + 1x6 + 1x6 ripped to 3"].strips }).totals.sumOfSupportableLines, pine.totals.sumOfSupportableLines);

// A functional requirement the catalog does not declare is refused; naming two items in one line is not a definition.
const unknownKit = evaluateCutPackageJob(catalog, { configurationId: "K", configurationVersion: "1", cutPackages: [], itemLines: [{ lineId: "KIT", qty: 1, requirementId: "NO-SUCH-KIT" }] });
assert.deepEqual(unknownKit.items[0].reasonCodes, ["NO_OFFERING_FOR_REQUIREMENT"]);
const both = evaluateCutPackageJob(catalog, { configurationId: "K", configurationVersion: "1", cutPackages: [], itemLines: [{ lineId: "KIT", qty: 1, requirementId: "ALCOVE-PINS-AND-SCREWS", storeSku: "STB-ZERO-HW-ALCOVE-PACK-001" }] });
assert.deepEqual(both.items[0].reasonCodes, ["ITEM_LINE_NAMES_MORE_THAN_ONE_ITEM"]);

// The retired project-shaped request type is refused.
assert.deepEqual(evaluateStoreRequest({ requestType: "ALCOVE_INSERT_V1", requestId: "A", demand: {} }, { release: "t", catalog }).reasonCodes, ["REQUEST_TYPE_NOT_ACCEPTED"]);
// Through the request layer the alcove is a clean cut-package definition.
const formal = evaluateStoreRequest({ requestType: "CUT_PACKAGE_V1", requestId: "ALCOVE", demand: alcoveCutPackages({}) }, { release: "t", catalog });
assert.equal(formal.status, "SUPPORTABLE");

console.log("alcove-via-cut-packages: ok", { Q: pine.totals.sumOfSupportableLines, material: pine.totals.material, machine: pine.totals.machine_service });
