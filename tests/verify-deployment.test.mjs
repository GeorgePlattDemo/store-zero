// The deployment verification procedure, run against a real started service on this machine. A hosted candidate
// is verified with the same procedure (scripts/verify-deployment.mjs); passing here is not a hosted result.
import test from "node:test";
import assert from "node:assert/strict";
import { startServer, sourceDigest } from "../src/service/server.mjs";
import { verifyDeployment } from "../scripts/verify-deployment.mjs";

async function started(commit) {
  const { server, port } = await startServer({ env: { RENDER_GIT_COMMIT: commit, HOST: "127.0.0.1", PORT: "0" } });
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

test("a Store built from this checkout passes every deployment check", async () => {
  const { base, close } = await started("candidate-commit");
  try {
    const checks = await verifyDeployment({ base, commit: "candidate-commit", localSource: sourceDigest() });
    assert.deepEqual(checks.filter((c) => !c.pass), []);
    assert.ok(checks.length >= 18);
  } finally {
    await close();
  }
});

test("a Store that names another commit, or runs other code, fails its identity checks", async () => {
  const { base, close } = await started("some-other-commit");
  try {
    const checks = await verifyDeployment({ base, commit: "candidate-commit", localSource: { ...sourceDigest(), digest: "0".repeat(64) } });
    const failed = new Set(checks.filter((c) => !c.pass).map((c) => c.name));
    assert.ok(failed.has("release is the commit"));
    assert.ok(failed.has("running code is that commit's code"));
    assert.ok(failed.has("Project 1: response bound to the exact bytes sent"), "an answer from another release is not accepted as this one's");
  } finally {
    await close();
  }
});

test("a response altered on the way is caught: the caller checks the digest of the bytes it sent", async () => {
  const { base, close } = await started("candidate-commit");
  const tampering = async (url, init) => {
    const res = await fetch(url, init);
    if (!String(url).endsWith("/v1/requests")) return res;
    const body = await res.json();
    if (body.answer?.estimate?.totals) body.answer.estimate.totals.Q = 1;
    body.payloadDigest = "f".repeat(64);
    return new Response(JSON.stringify(body), { status: res.status, headers: res.headers });
  };
  try {
    const checks = await verifyDeployment({ base, commit: "candidate-commit", localSource: sourceDigest(), fetchImpl: tampering });
    const failed = new Set(checks.filter((c) => !c.pass).map((c) => c.name));
    assert.ok(failed.has("Project 1: SUPPORTABLE, Q $11.09"));
    assert.ok(failed.has("Project 1: response bound to the exact bytes sent"));
  } finally {
    await close();
  }
});
