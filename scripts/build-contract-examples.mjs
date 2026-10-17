import {testManifest} from "../tests/fixtures/manifest.mjs";
// Builds contracts/examples: complete serialized requests for every request type, the definitions Store refuses
// and why, and the Project 1 accepted job packet with the packets Store refuses. Deterministic: fixed clock,
// the frozen recorded catalog, and the acceptance release. `npm run build:examples` writes them;
// acceptance/contracts fails if a committed example differs from what this produces.
import { project1Demand } from "../tests/fixtures/project-1.mjs";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { evaluateStoreRequest } from "../src/requests/store-request.mjs";
import { JOB_PACKET_SCHEMA } from "../src/contracts/job-packet.mjs";
import { lowerJobPacket, motionRecords } from "../src/machine/lowering.mjs";
import { physicalAdmission, runVirtual } from "../src/machine/virtual-run.mjs";
import { recordedCatalog } from "../acceptance/fixtures/recorded-catalog.mjs";
import { USER1_DIMENSIONAL_TRAVEL_DEMAND } from "../tests/fixtures/user1-dimensional-travel-fixture.mjs";
import { alcoveCutPackages } from "../tests/fixtures/alcove-cut-packages.mjs";
import { sourceDigest } from "../src/service/server.mjs";
import { loadCatalog } from "../src/evaluation/catalog.mjs";
import { loadMachineConfig, machineConfigHash } from "../src/machine/configuration.mjs";
import { verifyJobPacket } from "../src/contracts/job-packet.mjs";

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
        { packageId: "ANGLED", material: PT(2, 6, "ground-contact"), endCut: { angleDeg: 25,endRelation:"parallel",lengthDatum:"long-long-outer-edge",plane:"miter-face" }, parts: many("A", 4, 31.375) },
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

for(const request of Object.values(REQUEST_EXAMPLES)){if(request.requestType!=="OFFERING_LOOKUP")request.manifest=testManifest(request.requestType,request.demand);}

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
  manifest:testManifest("USER_DEFINED_BOARD_V1",PROJECT_1.demand),
  requirements: { endRelation: "parallel", lengthDatum: "long-long-outer-edge" }
};

const at = { release: EXAMPLE_RELEASE, catalog: recordedCatalog(), now: () => EXAMPLE_CLOCK };
const answerFor = (request) => JSON.parse(JSON.stringify(evaluateStoreRequest({...request,manifest:testManifest(request.requestType,request.demand)}, at)));

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
const spot = (featureId, xIn, acrossWidthRule, insetFromEdgeIn) => ({ featureId, kind: "SPOT_ON_LOCATION", xIn, acrossWidthRule, ...(insetFromEdgeIn ? { insetFromEdgeIn } : {}) });
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
    definition: { definitionId: "BRACKET-SET", revisionId: "BRACKET-SET-v1", requestType: "USER_DEFINED_BOARD_V1", demand: SECOND_JOB_DEMAND, manifest:testManifest("USER_DEFINED_BOARD_V1",SECOND_JOB_DEMAND), requirements: { endRelation: "parallel", lengthDatum: "long-long-outer-edge" } },
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
    ["price edited after the answer", edit((p) => { p.storeAnswer.Q = 9.99; })],
    ["receipt edited", edit((p) => { p.storeAnswer.evaluationReceipt.evaluatedAt = "2026-10-09T00:00:00.000Z"; })],
    ["definition changed after the answer", edit((p) => { p.definition.demand.parts[0].lengthIn = 17; })],
    ["answer from another Store", edit((p) => { p.storeAnswer = JSON.parse(JSON.stringify(evaluateStoreRequest({ requestType: "USER_DEFINED_BOARD_V1", requestId: "PROJECT-1-INQUIRY-0001", demand: PROJECT_1.demand,manifest:testManifest("USER_DEFINED_BOARD_V1",PROJECT_1.demand) }, { ...at, release: "some-other-store" }))); })],
    ["refused answer", edit((p) => { const d = { ...PROJECT_1.demand, sawAngleDeg: 46 }; p.definition.demand = d; p.storeAnswer = answerFor({ requestType: "USER_DEFINED_BOARD_V1", requestId: "PROJECT-1-INQUIRY-0001", demand: d }); })]
  ].map(([name, packet]) => ({ name, packet }));
}

// The current reference proof follows current executable bytes and current catalog. Its release label is
// explicitly content-addressed, not an assertion that a hosted process runs a particular git commit.
// System's Chromium gate supplies the complementary actual published-application/HTTP evidence.
export function currentProject1Proof() {
  const source=sourceDigest(),release='source-sha256:'+source.digest;
  const context={release,catalog:loadCatalog(),now:()=>EXAMPLE_CLOCK};
  const specimens=[{id:'16',lengthIn:16},{id:'18',lengthIn:18},{id:'18-selected',lengthIn:18,selected:true}].map(({id,lengthIn,selected})=>{
    const demand=structuredClone(USER1_DIMENSIONAL_TRAVEL_DEMAND);
    demand.configurationVersion='current-'+id;
    demand.sawAngleDeg=Number((Math.asin(8/lengthIn)*180/Math.PI).toFixed(12));
    for(const [i,part] of demand.parts.entries()){part.lengthIn=lengthIn;part.features[0].xIn=selected?[5.25,10.25][i]:lengthIn/2;
      if(selected)Object.assign(part.features[0],{locationRule:'PART_RELATIVE_FROM_START',fullDiameterDepthIn:[0.125,0.0625][i]});}
    const request={requestType:'USER_DEFINED_BOARD_V1',requestId:'CURRENT-PROJECT-1-'+id,demand,manifest:testManifest('USER_DEFINED_BOARD_V1',demand)};
    const answer=evaluateStoreRequest(request,context);
    const packet={schema:JOB_PACKET_SCHEMA,packetId:'PACKET-'+request.requestId,
      project:{projectId:'PROJECT-1-CURRENT-'+id,classId:demand.classId,title:demand.title},
      definition:{definitionId:demand.configurationId,revisionId:demand.configurationVersion,requestType:request.requestType,demand,manifest:request.manifest,requirements:{endRelation:demand.endRelation,lengthDatum:demand.lengthDatum}},
      storeAnswer:answer,decision:{decisionId:'DECISION-'+request.requestId,kind:'ACCEPTED',offerId:'OFFER-'+request.requestId,decidedAt:'2026-10-08T12:05:00.000Z',evidenceClass:'SIMULATED'},authority:{physicalRelease:false,evidenceClass:'SIMULATED'}};
    const verification=verifyJobPacket(packet,context),lowered=lowerJobPacket(packet,context);
    if(verification.status!=='VERIFIED'||lowered.status!=='LOWERED')throw Error('Current Project 1 cannot verify/lower: '+lengthIn);
    const records=motionRecords(lowered.localJob),run=runVirtual(records,{expected:records.binding}),admission=physicalAdmission(lowered.localJob);
    if(run.status!=='VIRTUAL_MODEL_COMPLETE'||admission.status!=='BLOCKED'||admission.motionCommands!==0)throw Error('Current Project 1 evidence boundary failed');
    return {id,lengthIn,request,packet,verification,localJob:lowered.localJob,records,run,admission};
  });
  return {schema:'PROJECT-1-CURRENT-PROOF-1',source,release,scope:'Current Store reference replay; simulated acceptance; predicted occupancy only',specimens};
}

export function currentProject1Review(proof=currentProject1Proof()) {
  const lines=['# Project 1 current digital proof','',
    'Project 1 proves the current manufacturing chain for the two-brace SPF job: identified definition and independent manifest → fresh Store answer → simulated accepted packet → independent verification → registered lowering → complete virtual replay. The 16-inch default, 18-inch centered variation and 18-inch selected-location specimen share an eight-inch horizontal span. The third specimen independently requests 1/8-inch and 1/16-inch full-diameter depths at X=5.25 and 10.25 inches. No angle, coordinate, stock choice or Q is re-entered after acceptance.','',
    'The complete serialized requests, answers, packets, local plans, records, replay and admission results are in [current-proof.json](current-proof.json). `npm run build:examples` regenerates this proof from current code and catalog; `npm test` rejects any byte disagreement. Changing executable inputs requires regeneration and review of the resulting evidence.','',
    '**Source identity:** `'+proof.source.digest+'` ('+proof.source.files+' package, source and data files). The reference release label is this source digest, not a deployed git identity. Fixed example times make reproduction deterministic; they are not transaction dates.','',
    'System supplies the live integration counterpart in its required Chromium job: the published nested application derives default, length and selected-location/depth revisions, receives real HTTP Store answers, records customer acceptance, exports each exact packet and submits it to the pinned Store machine-evidence endpoint. The workflow publishes the full requests, commercial source events, accepted packets and virtual evidence under its actual System and Store revisions. A reference replay alone does not establish that browser handoff.','',
    '| Requirement or result | 16-inch default | 18-inch variation | 18-inch selected locations/depths |','| --- | ---: | ---: | ---: |'];
  const registration=loadMachineConfig().model.dimensional.spot;
  const pointHeight=(registration.diameterIn/2)/Math.tan(registration.pointAngleDeg*Math.PI/360);
  const values=proof.specimens.map(s=>({length:s.lengthIn,angle:s.request.demand.sawAngleDeg,spots:s.request.demand.parts.flatMap(p=>p.features),answer:s.packet.storeAnswer}));
  const row=(label,fn)=>lines.push('| '+label+' | '+values.map(fn).join(' | ')+' |');
  row('Face miter magnitude',s=>s.angle+'°');row('Part-relative spot X (parts 1 / 2)',s=>s.spots.map(f=>f.xIn+' in').join(' / '));
  row('Registered spot drill diameter',()=>registration.diameterIn+' in');
  row('Drill-point included angle',()=>registration.pointAngleDeg+'°');
  row('Registered nominal / maximum full-diameter depth',()=>registration.fullDiameterDepthIn+' / '+registration.maximumFullDiameterDepthIn+' in');
  row('Requested full-diameter depth (parts 1 / 2)',s=>s.spots.map(f=>(f.fullDiameterDepthIn??registration.fullDiameterDepthIn)+' in').join(' / '));
  row('Modeled total drill-tip plunge (parts 1 / 2)',s=>s.spots.map(f=>Number(((f.fullDiameterDepthIn??registration.fullDiameterDepthIn)+pointHeight).toFixed(9))+' in').join(' / '));
  row('Selected parent',s=>s.answer.selectedStock[0].storeSku);row('Material',s=>'$'+s.answer.totals.material.toFixed(2));
  row('Modeled machine service',s=>'$'+s.answer.totals.machine_service.toFixed(2));row('Manufacturing Q',s=>'$'+s.answer.Q.toFixed(2));
  row('Occupied seconds',s=>s.answer.time.totalSeconds);row('Ledger records',s=>s.answer.operations.length);row('Modeled move events',s=>s.answer.operations.filter(o=>o.kind==='MOVE').length);
  lines.push('', '## Evidence and authority','',
    'The D-001 feature is an identified-location shallow pointed-drill spot (\`SPOT_ON_LOCATION\`), not a flat-bottom spotface, through-hole or general fastening pilot. The centered longitudinal position follows the System project rule \`L/2\` from the customer\'s selected brace length; it is not separately re-entered. Registered tool diameter is 3/16 in. Nominal full-diameter depth and maximum are separately registered at 3/16 in, measured beyond the 118° drill point. Each explicitly selected positive depth up to the maximum governs its own plunge and time; omission on the named standard spot uses the nominal. Invalid or excessive depths and incompatible physical functions are refused. The complete accepted Store plan supplies the spot Z moves. Physical inspection and commissioning remain outstanding.','',
    'The receipt binds demand, manifest, catalog, machine configuration, model and calculation. Packet verification checks that binding and independently evaluates the current definition. Lowering carries the exact selected parents and operation ledger; virtual replay consumes those records without another stock search or pricing engine. Tests reject changed definitions, altered receipts and motion records, foreign release identities and physical-release claims.','',
    'All operation times and resulting component dimensions are modeled. Datum capture is nominal; retained-face/kerf registration, saw stroke and stock-control qualification remain physical gaps. Physical admission is BLOCKED and permits zero physical motion commands. No compiled controller runtime, inspected parts, live stock reservation, actual payment or commercial return is established. The current machine functions and operating envelope are governed by Store master chapters 5, 6 and 9.','',
    '## Complete evaluated ledgers','');
  for(const s of proof.specimens){lines.push('### '+s.id+' inch specimen','',
    'Calculation input `'+s.packet.storeAnswer.calculationIdentity.inputHash+'`; result `'+s.packet.storeAnswer.calculationIdentity.resultHash+'`.','',
    '| Sequence | Operation | Subject | Seconds |','| ---: | --- | --- | ---: |');
    for(const [i,op] of s.packet.storeAnswer.operations.entries())lines.push('| '+(i+1)+' | '+op.kind+(op.axis?' '+op.axis+' '+op.from+' → '+op.target:'')+' | '+op.subject+' | '+op.seconds+' |');
    lines.push('');}
  return lines.join('\n')+'\n';
}

export function currentMasterExamples(text=readFileSync(join(ROOT,'STORE-ZERO-MASTER.md'),'utf8')) {
  const source=sourceDigest(),release='source-sha256:'+source.digest;
  const answers=[];
  text=text.replace(/<!-- current-request ([\w-]+) -->\n```json\n([^]*?)\n```\n\n<!-- current-result \1 -->\n```json\n[^]*?\n```/g,(_whole,id,input)=>{
    const request=JSON.parse(input),answer=evaluateStoreRequest(request,{release,now:()=>EXAMPLE_CLOCK});
    const summary=Object.fromEntries(['status','complete','Q','reasonCodes','totals','time','selectedStock','optimization','calculationIdentity','evaluationReceipt'].filter(k=>answer[k]!==undefined).map(k=>[k,answer[k]]));
    summary.ledgerRecords=answer.operations?.length??0;summary.physicalAuthority=false;
    answers.push({id,answer});
    return '<!-- current-request '+id+' -->\n```json\n'+JSON.stringify(request,null,2)+'\n```\n\n<!-- current-result '+id+' -->\n```json\n'+JSON.stringify(summary,null,2)+'\n```';
  });
  if(answers.length!==6)throw Error('The master requires six complete current reference requests');
  const table=['| Reference inquiry | Status | Manufacturing Q USD | Modeled seconds | Search complete |',
    '| --- | --- | ---: | ---: | --- |',...answers.map(({id,answer:a})=>'| '+id+' | '+a.status+' | '+(a.Q??'absent')+' | '+(a.time?.totalSeconds??'absent')+' | '+(a.optimization?.searchComplete??'not evaluated')+' |')].join('\n');
  const ledger=['| Reference inquiry | Ledger records | Modeled moves | Occupied seconds | Physical authority |',
    '| --- | ---: | ---: | ---: | --- |',...answers.map(({id,answer:a})=>'| '+id+' | '+(a.operations?.length??'absent')+' | '+(a.operations?.filter(o=>o.kind==='MOVE').length??'absent')+' | '+(a.time?.totalSeconds??'absent')+' | false |')].join('\n');
  const specimen=currentProject1Proof().specimens[1];
  const machine={status:'VIRTUAL_EVIDENCE_READY',physicalAuthority:false,recordsBinding:specimen.records.binding,evidenceClass:specimen.records.evidenceClass,expectedSeconds:specimen.records.expectedSeconds,run:specimen.run,admission:specimen.admission};
  const list=dir=>readdirSync(join(ROOT,dir)).flatMap(name=>{const path=dir+'/'+name;return statSync(join(ROOT,path)).isDirectory()?list(path):[path];});
  const inventory=['package.json',...list('src'),...list('data')].sort().map(path=>{const bytes=readFileSync(join(ROOT,path));return '| `'+path+'` | '+bytes.length+' | `'+createHash('sha256').update(bytes).digest('hex')+'` | `'+createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')+'` |';}).join('\n');
  text=text.replace(/The current digest is `[a-f0-9]+` over \d+ files\./,'The current digest is `'+source.digest+'` over '+source.files+' files.');
  text=text.replace(/The current registered configuration hash is `[a-f0-9]+`/,'The current registered configuration hash is `'+machineConfigHash(loadMachineConfig())+'`');
  text=text.replace(/(### 14\.4 Content identities[^]*?\| --- \| ---: \| --- \| --- \|\n)[^]*?(\n\nPatents and original)/,'$1'+inventory+'$2');
  return text.replace(/<!-- current-examples-table -->[^]*?<!-- end-current-examples-table -->/,'<!-- current-examples-table -->\n'+table+'\n<!-- end-current-examples-table -->')
    .replace(/<!-- current-ledger-table -->[^]*?<!-- end-current-ledger-table -->/,'<!-- current-ledger-table -->\n'+ledger+'\n<!-- end-current-ledger-table -->')
    .replace(/<!-- current-machine-example -->[^]*?<!-- end-current-machine-example -->/,'<!-- current-machine-example -->\n```json\n'+JSON.stringify(machine,null,2)+'\n```\n<!-- end-current-machine-example -->');
}

// This committed refused-packet specimen represents the original sealed packet,
// not a new live message. Its former fields/hashes are not retroactively rewritten.
// The real evaluator still returns reasonMessage and reasonRecords[].message.
function sealedRefusedPackets() {
  return refusedPackets().map(({name,packet})=>{
    if(name!=='refused answer')return {name,packet};
    const preserved=structuredClone(packet), answer=preserved.storeAnswer;
    delete answer.reasonMessage;
    delete answer.requestedAngleDeg;
    delete answer.registeredMaximumAngleDeg;
    for(const record of answer.reasonRecords??[])delete record.message;
    return {name,packet:preserved};
  });
}
export function buildExamples() {
  const files = {};
  const put = (path, value) => { files[path] = JSON.stringify(value, null, 2) + "\n"; };
  for (const [name, request] of Object.entries(REQUEST_EXAMPLES)) put(`contracts/examples/requests/${name}.json`, request);
  put("contracts/examples/requests/refused.json", REFUSED_EXAMPLES.map(({ name, request }) => {
    const answer = evaluateStoreRequest({...request,manifest:testManifest(request.requestType,request.demand)}, at);
    return { name, request, answer: { status: answer.status, reasonCodes: answer.reasonCodes } };
  }));
  put("contracts/examples/packets/project-1.accepted.json", project1Packet());
  put("contracts/examples/packets/refused.json", sealedRefusedPackets());
  put("contracts/examples/packets/second-job.accepted.json", secondJobPacket());
  for (const [name, packet] of [["project-1", project1Packet()], ["second-job", secondJobPacket()]]) {
    const out = machineOutputs(packet);
    put(`contracts/examples/machine/${name}.local-job.json`, out.localJob);
    put(`contracts/examples/machine/${name}.motion-records.json`, out.records);
    put(`contracts/examples/machine/${name}.virtual-run.json`, out.run);
    put(`contracts/examples/machine/${name}.physical-admission.json`, out.admission);
  }
  const proof=currentProject1Proof();
  put('docs/project-1-digital-trail/current-proof.json',proof);
  files['docs/project-1-digital-trail/current-proof.md']=currentProject1Review(proof);
  files['STORE-ZERO-MASTER.md']=currentMasterExamples();
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  for (const [path, text] of Object.entries(buildExamples())) {
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    writeFileSync(join(ROOT, path), text);
    console.log("wrote", path);
  }
}
