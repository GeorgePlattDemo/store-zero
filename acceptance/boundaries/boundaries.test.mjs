// Structural rules the code must keep. Each one closes a door a workaround would otherwise use.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
function files(dir) {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(ROOT, path)).isDirectory() ? files(path) : path.endsWith(".mjs") ? [path] : [];
  });
}
const SRC = files("src");
const source = (path) => readFileSync(join(ROOT, path), "utf8");
const imports = (path) => [...source(path).matchAll(/^\s*(?:import|export)[^"']*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);

test("Store code depends only on itself and Node built-ins: no other repository, package or network", () => {
  for (const path of SRC) {
    for (const spec of imports(path)) {
      assert.ok(spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("node:"), `${path} imports ${spec}`);
      if (!spec.startsWith("node:")) {
        const target = relative(ROOT, join(ROOT, path, "..", spec));
        assert.ok(target.startsWith("src/") || target.startsWith("data/"), `${path} reaches outside src: ${spec}`);
      }
    }
    // Only the service listens for connections; nothing in Store calls out or starts a process.
    const network = path.startsWith("src/service/") ? /\bfetch\s*\(|node:https\b|node:net\b|node:child_process\b/ : /\bfetch\s*\(|node:https?\b|node:net\b|node:child_process\b/;
    assert.ok(!network.test(source(path)), `${path} reaches the network or a process`);
  }
});

test("the service only carries requests: evaluation and evidence use their bounded entry points", () => {
  for (const path of SRC.filter((p) => p.startsWith("src/service/"))) {
    for (const spec of imports(path).filter((s) => !s.startsWith("node:"))) {
      assert.ok(["../requests/store-request.mjs", "../evaluation/catalog.mjs", "../machine/evidence.mjs"].includes(spec), `${path} imports ${spec}`);
    }
  }
});

test("evaluation never depends on the request layer", () => {
  for (const path of SRC.filter((p) => p.startsWith("src/evaluation/"))) {
    for (const spec of imports(path)) {
      assert.ok(!spec.includes("requests/"), `${path} imports ${spec}`);
    }
  }
});

test("the machine side is downstream: only the service may call the evidence entry point", () => {
  for (const path of SRC.filter((p) => !p.startsWith("src/machine/") && !p.startsWith("src/service/"))) {
    for (const spec of imports(path)) assert.ok(!spec.includes("machine/"), `${path} imports ${spec}`);
  }
});

test("evaluation and the machine side are deterministic: no clock, randomness or environment inside them", () => {
  for (const path of SRC.filter((p) => p.startsWith("src/evaluation/") || p.startsWith("src/machine/"))) {
    const text = source(path);
    for (const pattern of [/new Date\(/, /Date\.now\(/, /Math\.random\(/, /process\.env/]) {
      assert.ok(!pattern.test(text), `${path} uses ${pattern}`);
    }
  }
});

test("no project or tile names anywhere in Store code", () => {
  // Machine words such as the support table or the bench step are not project names; tile and project names are.
  const PROJECT_WORDS = /picnic|window[ -]seat|playhouse|outdoor|alcove|start your own|ana white|myoutdoor/i;
  for (const path of SRC) {
    const lines = source(path).split("\n").filter((line) => PROJECT_WORDS.test(line));
    assert.deepEqual(lines, [], `${path} names a project`);
  }
});

test("no count-only or compatibility pricing path exists", () => {
  for (const path of SRC) {
    const text = source(path);
    for (const retired of ["estimateJob", "estimateBoardSequence", "estimatePineAlcove", "estimateCut001", "estimatePicnic", "TRAVEL_STANDARD_INPUT_REQUIRED", "BOARD_SQUARE", "LEGACY_EXPLICIT_STORE_SKU", "LOCAL_UNPINNED_STORE_REVISION", "STB_STORE_REVISION", "ALCOVE_INSERT", "evaluateAlcoveJob", "PARTIAL_BUDGETARY_ESTIMATE", "PARENT_LENGTH_REQUIRES_UNDECLARED_EXTERNAL_SUPPORT", "WithoutExternalSupport"]) {
      assert.ok(!text.includes(retired), `${path} still carries ${retired}`);
    }
  }
});

test("one request layer: no evaluator issues its own receipt", () => {
  for (const path of SRC.filter((p) => p.startsWith("src/evaluation/"))) {
    assert.ok(!/evaluationReceipt|receiptHash|freshEvaluation/.test(source(path)), `${path} issues a receipt`);
  }
});

test("Store Zero keeps no definitions file of its own: System owns shared definitions", () => {
  const top = readdirSync(ROOT).concat(readdirSync(join(ROOT, "docs")));
  assert.ok(!top.some((name) => /^definitions?(\.md)?$/i.test(name)), "a definitions file exists in Store");
});
