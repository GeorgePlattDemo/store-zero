// Verifies a running Store Zero against a commit, from the outside, using only its public HTTP interface.
//
//   node scripts/verify-deployment.mjs <base-url> --commit <sha>
//
// Run it from a clean checkout of <sha>: the checkout's own source digest is what the running Store must report.
// Every check is printed with PASS or FAIL; the exit code is non-zero if any check fails. Nothing here changes
// the service or any host setting.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { sourceDigest } from "../src/service/server.mjs";
import { REQUEST_EXAMPLES, project1Packet } from "./build-contract-examples.mjs";

const FRESHNESS = "STB-STORE-FRESH-EVALUATION-0.1";

export async function verifyDeployment({ base, commit, localSource, fetchImpl = fetch }) {
  const checks = [];
  const check = (name, pass, detail = "") => checks.push({ name, pass: Boolean(pass), detail });
  const post = async (path, body) => {
    const raw = JSON.stringify(body);
    const res = await fetchImpl(new URL(path, base), { method: "POST", headers: { "Content-Type": "application/json" }, body: raw });
    const wrapper = await res.json().catch(() => null);
    const digestMatches = wrapper?.payloadDigest === createHash("sha256").update(raw).digest("hex");
    const fromThisStore = wrapper?.storeRelease === commit;
    return { status: res.status, wrapper, answer: wrapper?.answer, bound: digestMatches && fromThisStore };
  };
  const ask = (example) => post("/v1/requests", REQUEST_EXAMPLES[example]);

  // 1. Identity: the commit it names, and the code it actually runs.
  const healthRes = await fetchImpl(new URL("/health", base));
  const health = await healthRes.json().catch(() => null);
  check("health answers", healthRes.status === 200 && health?.status === "ok", `HTTP ${healthRes.status}`);
  check("release is the commit", health?.release === commit, `reports ${health?.release}`);
  check("running code is that commit's code", health?.source?.digest === localSource.digest && health?.source?.files === localSource.files,
    `running ${health?.source?.digest} (${health?.source?.files} files), checkout ${localSource.digest} (${localSource.files} files)`);
  check("advertised request types", JSON.stringify(health?.requestTypes) === JSON.stringify(["USER_DEFINED_BOARD_V1", "CUT_PACKAGE_V1", "SHEET_PACKAGE_V1", "OFFERING_LOOKUP"]), JSON.stringify(health?.requestTypes));
  const evidence = health?.machineEvidence ?? {};
  check("machine evidence advertised without physical authority", evidence.physicalAuthority === false && evidence.machineConfigId && /^[0-9a-f]{64}$/.test(evidence.machineConfigHash ?? ""), evidence.machineConfigId);

  // 2. Fresh evaluation of Project 1, bound to the bytes sent and to this release.
  const p1 = await ask("user-defined-board.project-1");
  const receipt = p1.answer?.evaluationReceipt;
  check("Project 1: SUPPORTABLE, Q $11.09", p1.answer?.status === "SUPPORTABLE" && p1.answer?.estimate?.totals?.Q === 11.09, `${p1.answer?.status} ${p1.answer?.estimate?.totals?.Q}`);
  check("Project 1: fresh receipt names this release", p1.answer?.freshEvaluation === true && receipt?.freshnessRule === FRESHNESS && receipt?.authority?.storeRevision === commit, receipt?.authority?.storeRevision);
  check("Project 1: response bound to the exact bytes sent", p1.bound);
  const sealed = await ask("user-defined-board.grade-not-named");
  check("Project 1 without its grade: Store asks for it", sealed.answer?.status === "UNRESOLVED" && sealed.answer?.materialResolution?.reason === "GRADE_CHOICE_REQUIRED");

  // 3. A second user-defined board, a cut package and a sheet package.
  const spf = await ask("user-defined-board.default-spf");
  check("second board (SPF, two 16 in parts, 30°): Q $8.54", spf.answer?.status === "SUPPORTABLE" && spf.answer?.estimate?.totals?.Q === 8.54 && spf.bound, `${spf.answer?.estimate?.totals?.Q}`);
  const cut = await ask("cut-package.alcove-pine");
  check("dimensional cut package: SUPPORTABLE, $429.16", cut.answer?.status === "SUPPORTABLE" && cut.answer?.totals?.sumOfSupportableLines === 429.16 && cut.bound, `${cut.answer?.totals?.sumOfSupportableLines}`);
  const sheet = await ask("sheet-package.playhouse");
  check("sheet package: SUPPORTABLE, $65.04", sheet.answer?.status === "SUPPORTABLE" && sheet.answer?.totals?.Q === 65.04 && sheet.bound, `${sheet.answer?.totals?.Q}`);

  // 4. Genuine refusals and definition gaps are answers, not errors.
  const square = await post("/v1/requests", { requestType: "BOARD_SQUARE_V1", requestId: "VERIFY-REFUSE", demand: {} });
  check("count-only ticket refused with its reason", square.status === 200 && square.answer?.status === "REFUSED" && JSON.stringify(square.answer?.reasonCodes) === '["REQUEST_TYPE_NOT_ACCEPTED"]');
  const noAngle = structuredClone(REQUEST_EXAMPLES["cut-package.alcove-pine"]);
  delete noAngle.demand.cutPackages[0].endCut;
  const gap = await post("/v1/requests", { ...noAngle, requestId: "VERIFY-NO-ANGLE" });
  check("a missing end-cut angle is asked for, never assumed square", gap.answer?.packages?.[0]?.reasonCodes?.[0] === "END_CUT_ANGLE_REQUIRED");

  // 5. Machine evidence from the hosted answer: virtual only, physical admission blocked.
  // The user's acceptance comes after the answer it accepts, even if the host's clock runs ahead of this one.
  const decidedAt = new Date(Math.max(Date.now(), Date.parse(receipt?.evaluatedAt ?? 0) + 1000)).toISOString();
  const template = project1Packet();
  const packet = { ...template, storeAnswer: p1.answer, decision: { ...template.decision, decidedAt } };
  const expected = { expectedMachineConfigId: evidence.machineConfigId, expectedMachineConfigHash: evidence.machineConfigHash };
  const ready = await post("/v1/machine-evidence", { packet, ...expected });
  const run = ready.answer?.run;
  check("machine evidence: VIRTUAL_EVIDENCE_READY, 45 records, 86.469536 s", ready.answer?.status === "VIRTUAL_EVIDENCE_READY" && ready.answer?.records?.sequence?.length === 45 && Math.abs((run?.timeSec ?? 0) - 86.469536) < 1e-6, `${ready.answer?.status} ${run?.timeSec}`);
  check("machine evidence: physical authority false, admission BLOCKED", ready.answer?.physicalAuthority === false && ready.answer?.admission?.status === "BLOCKED" && ready.bound);

  // 6. An altered answer and an answer from another release are refused, never lowered.
  const altered = structuredClone(packet);
  altered.storeAnswer.estimate.totals.Q = 9.99;
  const alteredRes = await post("/v1/machine-evidence", { packet: altered, ...expected });
  check("altered answer refused", alteredRes.answer?.status === "REFUSED" && !alteredRes.answer?.records, JSON.stringify(alteredRes.answer?.reasonCodes));
  const otherRelease = structuredClone(packet);
  otherRelease.storeAnswer.evaluationReceipt.authority.storeRevision = "not-this-store";
  const otherRes = await post("/v1/machine-evidence", { packet: otherRelease, ...expected });
  check("answer from another release refused", otherRes.answer?.status === "REFUSED" && !otherRes.answer?.records, JSON.stringify(otherRes.answer?.reasonCodes));
  const wrongConfig = await post("/v1/machine-evidence", { packet, expectedMachineConfigId: evidence.machineConfigId, expectedMachineConfigHash: "0".repeat(64) });
  check("wrong machine configuration refused", JSON.stringify(wrongConfig.answer?.reasonCodes) === '["MACHINE_CONFIGURATION_IDENTITY_MISMATCH"]');

  return checks;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [base, flag, commit] = process.argv.slice(2);
  if (!base || flag !== "--commit" || !commit) {
    console.error("usage: node scripts/verify-deployment.mjs <base-url> --commit <sha>");
    process.exit(2);
  }
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  if (git("rev-parse", "HEAD") !== commit) {
    console.error(`Check out ${commit} first: the checkout's source digest is the reference (HEAD is ${git("rev-parse", "HEAD")}).`);
    process.exit(2);
  }
  if (git("status", "--porcelain", "--", "package.json", "src", "data")) {
    console.error("The shipped files (package.json, src/, data/) have local changes; the digest would not be the commit's.");
    process.exit(2);
  }
  const checks = await verifyDeployment({ base, commit, localSource: sourceDigest() });
  for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.detail ? `  (${c.detail})` : ""}`);
  const failed = checks.filter((c) => !c.pass).length;
  console.log(failed ? `${failed} of ${checks.length} checks FAILED against ${base}` : `All ${checks.length} checks passed against ${base} at ${commit}`);
  process.exit(failed ? 1 : 0);
}
