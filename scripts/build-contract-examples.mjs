// Builds contracts/examples: complete serialized requests for every request type, the definitions Store refuses
// and why, and the Project 1 accepted job packet with the packets Store refuses. Deterministic: fixed clock,
// the frozen recorded catalog, and the acceptance release. `npm run build:examples` writes them;
// acceptance/contracts fails if a committed example differs from what this produces.
import { project1Demand } from "../tests/fixtures/project-1.mjs";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { evaluateStoreRequest } from "../src/requests/store-request.mjs";
import { JOB_PACKET_SCHEMA } from "../src/contracts/job-packet.mjs";
import { lowerJobPacket, motionRecords } from "../src/machine/lowering.mjs";
import { physicalAdmission, runVirtual } from "../src/machine/virtual-run.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "../tests/fixtures/user1-dimensional-travel-fixture.mjs";
import { alcoveCutPackages } from "../tests/fixtures/alcove-cut-packages.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const EXAMPLE_RELEASE = "store-zero-acceptance";
export const EXAMPLE_CLOCK = "2026-10-08T12:00:00.000Z";
const PROJECT_1 = { ...JSON.parse(readFileSync(join(ROOT, "acceptance/project-1/from-evidence/definition-and-demand.json"), "utf8")), demand: project1Demand() };

const PT = (nominalT, nominalW, grade) => ({ species: "syp-treated", form: "board", nominalT, nominalW, grade });
// Every spot is named by the definition; each part's spots carry their own names.
const many = (prefix, count, lengthIn, spots = []) =>
  Array.from({ length: count }, (_, i) => {
    const partId = `${prefix}-${String(i + 1).padStart(2, "0")}`;
    return { partId, lengthIn, spots: spots.map((spot, n) => ({ featureId: `${partId}-SPOT-${n + 1}`, ...spot })) };
  });
const centered = (xs) => xs.map((xIn) => ({ xIn, acrossWidthRule: "CENTERED_ON_WIDE_FACE" }));

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
  "user-defined-board.grade-not-named": { requestType: "USER_DEFINED_BOARD_V1", requestId: "EXAMPLE-NO-GRADE", demand: (({ materialDemand: { grade, ...material }, ...demand }) => ({ ...demand, materialDemand: material }))(project1Demand()) },
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
  "cut-package.alcove-pine": { requestType: "CUT_PACKAGE_V1", requestId: "EXAMPLE-ALCOVE", demand: alcoveCutPackages() },
  "sheet-package.playhouse": { requestType: "SHEET_PACKAGE_V1", requestId: "EXAMPLE-SHEET", demand: playhouse },
  "offering-lookup.search": { requestType: "OFFERING_LOOKUP", requestId: "EXAMPLE-SEARCH", demand: { searchText: "2x4 treated 72" } },
  "offering-lookup.sku": { requestType: "OFFERING_LOOKUP", requestId: "EXAMPLE-SKU", demand: { storeSku: "STB-ZERO-PTAG-2X4-72-001" } }
};

const p1 = () => structuredClone(PROJECT_1.demand);
export const REFUSED_EXAMPLES = [
  ["count-only Board ticket", { requestType: "BOARD_SQUARE_V1", requestId: "R1", demand: { storeSku: "STB-ZERO-SPF-2X4-96-001", qty: 1 } }],
  ["Store identity sent by the caller", { requestType: "USER_DEFINED_BOARD_V1", requestId: "R2", demand: { ...p1(), storeRevision: "9c62d9d" } }],
  ["undeclared part field", { requestType: "USER_DEFINED_BOARD_V1", requestId: "R4", demand: { ...p1(), parts: p1().parts.map((p) => ({ ...p, finish: "stain" })) } }],
  ["part length as text", { requestType: "USER_DEFINED_BOARD_V1", requestId: "R5", demand: { ...p1(), parts: p1().parts.map((p) => ({ ...p, lengthIn: "18" })) } }],
  ["machine-local language", { requestType: "SHEET_PACKAGE_V1", requestId: "R6", demand: { ...playhouse, toolpath: "G1 X10" } }],
  ["retired project-shaped request type", { requestType: "ALCOVE_INSERT_V1", requestId: "R7", demand: { configurationId: "A", configurationVersion: "1" } }],
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

// The second job: a different supported arrangement on a different board — three parts, a 15 degree miter,
// centred and inset spots, and a part with none. It proves the machine side is not a Project 1 replay.
const spot = (featureId, xIn, acrossWidthRule, insetFromEdgeIn) => ({ featureId, kind: "SPOT_ON_LOCATION", xIn, locationRule: "CENTERED_ON_PART", acrossWidthRule, ...(insetFromEdgeIn ? { insetFromEdgeIn } : {}) });
export const SECOND_JOB_DEMAND = {
  title: "Three-part bracket set",
  configurationId: "BRACKET-SET",
  configurationVersion: "1",
  classId: "app.user-defined-board.v1",
  materialDemand: { species: "spf", form: "board", nominalT: 2, nominalW: 6 },
  definedWorkpieceLengthIn: 72,
  requiredOps: ["MITER_LIMITED", "SPOT_ON_LOCATION"],
  sawAngleDeg: 15,
  cutPlane: "miter-face",
  datumCMethod: "REFERENCE_CUT",
  endRelation: "parallel",
  lengthDatum: "long-long-outer-edge",
  declaredSawCuts: 4,
  declaredSpotCount: 3,
  unresolvedConditions: [],
  parts: [
    { partId: "BRACKET-A", lengthIn: 20, features: [spot("A-1", 5, "CENTERED_ON_WIDE_FACE"), spot("A-2", 15, "CENTERED_ON_WIDE_FACE")] },
    { partId: "BRACKET-B", lengthIn: 14, features: [] },
    { partId: "BRACKET-C", lengthIn: 16, features: [spot("C-1", 8, "INSET_FROM_EDGE", 1.5)] }
  ]
};

export function secondJobPacket() {
  return {
    schema: JOB_PACKET_SCHEMA,
    packetId: "PACKET-BRACKET-SET-0001",
    project: { projectId: "BRACKET-SET-CUSTOMER-0001", classId: SECOND_JOB_DEMAND.classId, title: SECOND_JOB_DEMAND.title },
    definition: { definitionId: "BRACKET-SET", revisionId: "BRACKET-SET-v1", requestType: "USER_DEFINED_BOARD_V1", demand: SECOND_JOB_DEMAND, requirements: { endRelation: "parallel", lengthDatum: "long-long-outer-edge" } },
    storeAnswer: answerFor({ requestType: "USER_DEFINED_BOARD_V1", requestId: "BRACKET-SET-INQUIRY-0001", demand: SECOND_JOB_DEMAND }),
    decision: { decisionId: "DECISION-BRACKET-SET-0001", kind: "ACCEPTED", offerId: "OFFER-BRACKET-SET-0001", decidedAt: "2026-10-08T12:10:00.000Z", evidenceClass: "SIMULATED" },
    authority: { physicalRelease: false, evidenceClass: "SIMULATED" }
  };
}

/** Lowered job, motion records, virtual run and admission for a packet, as the machine side produces them. */
export function machineOutputs(packet) {
  const lowered = lowerJobPacket(packet, at);
  if (lowered.status !== "LOWERED") throw new Error(`example packet did not lower: ${lowered.reasonCodes}`);
  const records = motionRecords(lowered.localJob);
  return { localJob: lowered.localJob, records, run: runVirtual(records, { expected: records.binding }), admission: physicalAdmission(lowered.localJob) };
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
  put("contracts/examples/packets/second-job.accepted.json", secondJobPacket());
  for (const [name, packet] of [["project-1", project1Packet()], ["second-job", secondJobPacket()]]) {
    const out = machineOutputs(packet);
    put(`contracts/examples/machine/${name}.local-job.json`, out.localJob);
    put(`contracts/examples/machine/${name}.motion-records.json`, out.records);
    put(`contracts/examples/machine/${name}.virtual-run.json`, out.run);
    put(`contracts/examples/machine/${name}.physical-admission.json`, out.admission);
  }
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  for (const [path, text] of Object.entries(buildExamples())) {
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    writeFileSync(join(ROOT, path), text);
    console.log("wrote", path);
  }
}
