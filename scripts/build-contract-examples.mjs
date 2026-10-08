// Builds contracts/examples: complete serialized requests for every request type, the definitions Store refuses
// and why, and the Project 1 accepted job packet with the packets Store refuses. Deterministic: fixed clock,
// the frozen recorded catalog, and the acceptance release. `npm run build:examples` writes them;
// acceptance/contracts fails if a committed example differs from what this produces.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { evaluateStoreRequest } from "../src/requests/store-request.mjs";
import { JOB_PACKET_SCHEMA } from "../src/contracts/job-packet.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "../tests/fixtures/user1-dimensional-travel-fixture.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const EXAMPLE_RELEASE = "store-zero-acceptance";
export const EXAMPLE_CLOCK = "2026-10-08T12:00:00.000Z";
const PROJECT_1 = JSON.parse(readFileSync(join(ROOT, "acceptance/project-1/from-evidence/definition-and-demand.json"), "utf8"));

const PT = (nominalT, nominalW, grade) => ({ species: "syp-treated", form: "board", nominalT, nominalW, grade });
const many = (prefix, count, lengthIn, spots = []) =>
  Array.from({ length: count }, (_, i) => ({ partId: `${prefix}-${String(i + 1).padStart(2, "0")}`, lengthIn, spots }));
const centered = (xs) => xs.map((xIn) => ({ xIn, acrossWidthRule: "CENTERED_ON_WIDE_FACE" }));

function alcoveDemand() {
  const programs = [];
  for (let i = 0; i < 4; i += 1) {
    programs.push({ componentId: `ALCOVE-UPRIGHT-${String(i + 1).padStart(2, "0")}`, requirementId: "ALCOVE-UPRIGHT-PARENTS", finishedLengthIn: 65, finishedWidthIn: 5.5, features: [] });
  }
  for (let shelf = 0; shelf < 5; shelf += 1) {
    for (let strip = 0; strip < 3; strip += 1) {
      const w = Math.min(5.5, 14 - 5.5 * strip);
      programs.push({
        componentId: `ALCOVE-SHELF-${String(shelf + 1).padStart(2, "0")}-STRIP-${String(strip + 1).padStart(2, "0")}`,
        requirementId: "ALCOVE-SHELF-PARENTS",
        finishedLengthIn: 44,
        finishedWidthIn: w,
        features: w < 5.5 ? [{ featureId: `ALCOVE-SHELF-${String(shelf + 1).padStart(2, "0")}-RIP`, kind: "MILL_LONGITUDINAL_PROFILE", pathLengthIn: 44, yIn: w, totalDepthIn: 0.75 }] : []
      });
    }
  }
  return {
    title: "Alcove insert",
    classId: "alcove.insert.square_shelves",
    configurationId: "ALCOVE-EXAMPLE",
    configurationVersion: "1",
    materialDemand: { species: "pine", form: "board", nominalT: 1, nominalW: 6, grade: "select" },
    boardRequirements: [
      { requirementId: "ALCOVE-UPRIGHT-PARENTS", role: "UPRIGHTS", requiredOps: ["CROSSCUT"], carriesSpotDemand: false, selectionAuthority: "STORE_ZERO" },
      { requirementId: "ALCOVE-SHELF-PARENTS", role: "SHELVES", requiredOps: ["CROSSCUT"], carriesSpotDemand: false, selectionAuthority: "STORE_ZERO" }
    ],
    componentPrograms: programs,
    hardwareDemand: { requirementId: "ALCOVE-PINS-AND-SCREWS", description: "pins + screws", qty: 1, selectionAuthority: "STORE_ZERO" },
    spotDemand: null,
    unresolvedConditions: [],
    materialSource: "STORE_ZERO"
  };
}

const playhouse = {
  configurationId: "PLAYHOUSE-ARCHED-WINDOW",
  configurationVersion: "w36-h24-r12-c18/18",
  sheet: { thicknessIn: 0.5, lengthIn: 96, widthIn: 48 },
  features: [
    { featureId: "OPENING", kind: "ARCHED_APERTURE", placement: "CENTERED", widthIn: 36, straightHeightIn: 24, riseIn: 12, retain: "TABS", requestedTabCount: 4 },
    { featureId: "CENTER-SPLIT", kind: "STRAIGHT_SPLIT", within: "OPENING", line: "VERTICAL_CENTERLINE" },
    { featureId: "CUT-LEFT", kind: "CROSSCUT", fromEnd: "LEFT", distanceIn: 18 },
    { featureId: "CUT-RIGHT", kind: "CROSSCUT", fromEnd: "RIGHT", distanceIn: 18 }
  ],
  returnAllPieces: true
};

export const REQUEST_EXAMPLES = {
  "user-defined-board.project-1": { requestType: "USER_DEFINED_BOARD_V1", requestId: "EXAMPLE-PROJECT-1", demand: PROJECT_1.demand },
  "user-defined-board.default-spf": { requestType: "USER_DEFINED_BOARD_V1", requestId: "EXAMPLE-DEFAULT-SPF", demand: structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND) },
  "cut-package.mixed": {
    requestType: "CUT_PACKAGE_V1",
    requestId: "EXAMPLE-CUT-PACKAGE",
    demand: {
      classId: "cut_package.v1",
      configurationId: "CUT-EXAMPLE",
      configurationVersion: "1",
      cutPackages: [
        { packageId: "LONG", material: PT(2, 6, "ground-contact"), endCut: { angleDeg: 0 }, parts: many("L", 6, 71.5, centered([4.75, 35.75, 66.75])) },
        { packageId: "ANGLED", material: PT(2, 6, "ground-contact"), endCut: { angleDeg: 25 }, parts: many("A", 4, 31.375) },
        { packageId: "TOO-LONG", material: PT(2, 6, "ground-contact"), endCut: { angleDeg: 0 }, parts: many("Y", 1, 200) }
      ],
      itemLines: [
        { lineId: "BOLTS", storeSku: "STB-ZERO-HW-CARRIAGE-BOLT-PACK-001", qty: 2 },
        { lineId: "SCREWS", qty: 40, requirement: { kind: "wood-screw", gauge: "#10", lengthIn: 2.5, finish: "coated", unit: "piece" } }
      ]
    }
  },
  "alcove-insert.pine": { requestType: "ALCOVE_INSERT_V1", requestId: "EXAMPLE-ALCOVE", demand: alcoveDemand() },
  "sheet-package.playhouse": { requestType: "SHEET_PACKAGE_V1", requestId: "EXAMPLE-SHEET", demand: playhouse },
  "offering-lookup.search": { requestType: "OFFERING_LOOKUP", requestId: "EXAMPLE-SEARCH", demand: { searchText: "2x4 treated 72" } },
  "offering-lookup.sku": { requestType: "OFFERING_LOOKUP", requestId: "EXAMPLE-SKU", demand: { storeSku: "STB-ZERO-PTAG-2X4-72-001" } }
};

const p1 = () => structuredClone(PROJECT_1.demand);
export const REFUSED_EXAMPLES = [
  ["count-only Board ticket", { requestType: "BOARD_SQUARE_V1", requestId: "R1", demand: { storeSku: "STB-ZERO-SPF-2X4-96-001", qty: 1 } }],
  ["Store identity sent by the caller", { requestType: "USER_DEFINED_BOARD_V1", requestId: "R2", demand: { ...p1(), storeRevision: "9c62d9d" } }],
  ["grade on a user-defined board", { requestType: "USER_DEFINED_BOARD_V1", requestId: "R3", demand: { ...p1(), materialDemand: { ...p1().materialDemand, grade: "ground-contact" } } }],
  ["undeclared part field", { requestType: "USER_DEFINED_BOARD_V1", requestId: "R4", demand: { ...p1(), parts: p1().parts.map((p) => ({ ...p, finish: "stain" })) } }],
  ["part length as text", { requestType: "USER_DEFINED_BOARD_V1", requestId: "R5", demand: { ...p1(), parts: p1().parts.map((p) => ({ ...p, lengthIn: "18" })) } }],
  ["machine-local language", { requestType: "SHEET_PACKAGE_V1", requestId: "R6", demand: { ...playhouse, toolpath: "G1 X10" } }],
  ["project naming a Store SKU", { requestType: "ALCOVE_INSERT_V1", requestId: "R7", demand: { ...alcoveDemand(), hardwareDemand: { requirementId: "ALCOVE-PINS-AND-SCREWS", qty: 1, storeSku: "STB-ZERO-HW-ALCOVE-PACK-001" } } }],
  ["fractional hardware count", { requestType: "CUT_PACKAGE_V1", requestId: "R8", demand: { configurationId: "C", configurationVersion: "1", cutPackages: [], itemLines: [{ lineId: "L", storeSku: "STB-ZERO-HW-CARRIAGE-BOLT-PACK-001", qty: 1.5 }] } }],
  ["missing request id", { requestType: "CUT_PACKAGE_V1", demand: { configurationId: "C", configurationVersion: "1" } }]
].map(([name, request]) => ({ name, request }));

export const PACKET_DEFINITION = {
  definitionId: PROJECT_1.definitionId,
  revisionId: PROJECT_1.definitionRevision,
  requestType: "USER_DEFINED_BOARD_V1",
  demand: PROJECT_1.demand,
  requirements: { endRelation: "parallel", lengthDatum: "long-long-outer-edge" }
};

const at = { release: EXAMPLE_RELEASE, catalog: recordedCatalog(), now: () => EXAMPLE_CLOCK };
const answerFor = (request) => JSON.parse(JSON.stringify(evaluateStoreRequest(request, at)));

export function project1Packet() {
  return {
    schema: JOB_PACKET_SCHEMA,
    packetId: "PACKET-PROJECT-1-0001",
    project: { projectId: "PROJECT-1-SPECIMEN", classId: PROJECT_1.demand.classId, title: PROJECT_1.demand.title },
    definition: PACKET_DEFINITION,
    storeAnswer: answerFor({ requestType: "USER_DEFINED_BOARD_V1", requestId: "PROJECT-1-INQUIRY-0001", demand: PROJECT_1.demand }),
    decision: { decisionId: "DECISION-PROJECT-1-0001", kind: "ACCEPTED", offerId: "OFFER-PROJECT-1-0001", decidedAt: "2026-10-08T12:05:00.000Z", evidenceClass: "SIMULATED" },
    authority: { physicalRelease: false, evidenceClass: "SIMULATED" }
  };
}

export function refusedPackets() {
  const base = project1Packet();
  const edit = (fn) => { const p = structuredClone(base); fn(p); return p; };
  return [
    ["declined offer", edit((p) => { p.decision.kind = "DECLINED"; })],
    ["physical release claimed", edit((p) => { p.authority.physicalRelease = true; })],
    ["price edited after the answer", edit((p) => { p.storeAnswer.estimate.totals.Q = 9.99; })],
    ["receipt edited", edit((p) => { p.storeAnswer.evaluationReceipt.evaluatedAt = "2026-10-09T00:00:00.000Z"; })],
    ["definition changed after the answer", edit((p) => { p.definition.demand.parts[0].lengthIn = 17; })],
    ["answer from another Store", edit((p) => { p.storeAnswer = JSON.parse(JSON.stringify(evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId: "PROJECT-1-INQUIRY-0001", demand: PROJECT_1.demand }, { ...at, release: "some-other-store" }))); })],
    ["refused answer", edit((p) => { const d = { ...PROJECT_1.demand, sawAngleDeg: 46 }; p.definition.demand = d; p.storeAnswer = answerFor({ requestType: "USER_DEFINED_BOARD_V1", requestId: "PROJECT-1-INQUIRY-0001", demand: d }); })]
  ].map(([name, packet]) => ({ name, packet }));
}

export function buildExamples() {
  const files = {};
  const put = (path, value) => { files[path] = JSON.stringify(value, null, 2) + "\n"; };
  for (const [name, request] of Object.entries(REQUEST_EXAMPLES)) put(`contracts/examples/requests/${name}.json`, request);
  put("contracts/examples/requests/refused.json", REFUSED_EXAMPLES.map(({ name, request }) => {
    const answer = evaluateStoreRequest(request, at);
    return { name, request, answer: { status: answer.status, reasonCodes: answer.reasonCodes } };
  }));
  put("contracts/examples/packets/project-1.accepted.json", project1Packet());
  put("contracts/examples/packets/refused.json", refusedPackets());
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  for (const [path, text] of Object.entries(buildExamples())) {
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    writeFileSync(join(ROOT, path), text);
    console.log("wrote", path);
  }
}
