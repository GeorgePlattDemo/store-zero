// The documents point at things that exist, and the preserved artifacts are the artifacts.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(join(ROOT, path), "utf8");
const sha256 = (path) => createHash("sha256").update(readFileSync(join(ROOT, path))).digest("hex");
const SPEC = "docs/STORE-ZERO-SPECIFICATION.md";

// GitHub's heading anchors: lower case, punctuation removed, spaces to hyphens.
const anchorsOf = (markdown) =>
  new Set(markdown.split("\n").filter((l) => /^#{1,6} /.test(l)).map((l) => l.replace(/^#+ /, "").trim().toLowerCase().replace(/[^\p{L}\p{N}\- _]/gu, "").replace(/ /g, "-")));

const OUR_DOCUMENTS = ["README.md", "AGENTS.md", SPEC, "docs/patents/README.md", "docs/project-1-digital-trail/README.md"];

test("every relative link in our documents reaches a file, and every anchor a heading", () => {
  for (const doc of OUR_DOCUMENTS) {
    for (const [, target] of read(doc).matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:)/.test(target)) continue;
      const [file, anchor] = target.split("#");
      const path = file ? relative(ROOT, join(ROOT, dirname(doc), file)) : doc;
      assert.ok(existsSync(join(ROOT, path)), `${doc} links to missing ${target}`);
      if (anchor) assert.ok(anchorsOf(read(path)).has(anchor), `${doc} links to missing heading ${target}`);
    }
  }
});

test("every repository path the specification cites exists", () => {
  // Paths written as "System `…`" are System's files and are not checked here.
  const cited = new Set([...read(SPEC).matchAll(/(System )?`((?:src|tests|acceptance|data|docs|scripts)\/[A-Za-z0-9_./*-]+)`/g)].filter((m) => !m[1]).map((m) => m[2]));
  assert.ok(cited.size > 40);
  for (const path of cited) {
    if (path.includes("*")) continue;
    assert.ok(existsSync(join(ROOT, path.replace(/\/$/, ""))), `${SPEC} cites missing ${path}`);
  }
});

test("the specification's module index is exactly the modules under src", () => {
  const list = (dir) => readdirSync(join(ROOT, dir)).flatMap((n) => (statSync(join(ROOT, dir, n)).isDirectory() ? list(join(dir, n)) : n.endsWith(".mjs") ? [join(dir, n)] : []));
  const indexed = read(SPEC).split("# Appendix C. Module index")[1].split("# Appendix D")[0];
  const named = new Set([...indexed.matchAll(/`(src\/[^`]+\.mjs)`/g)].map((m) => m[1]));
  assert.deepEqual([...named].sort(), list("src").sort());
});

test("the Project 1 trail is the published trail, byte for byte", () => {
  const identities = JSON.parse(read("docs/project-1-digital-trail/publication-identities.json"));
  for (const [name, { sha256: expected, bytes }] of Object.entries(identities.artifacts)) {
    const path = `docs/project-1-digital-trail/${name}`;
    assert.equal(sha256(path), expected, name);
    assert.equal(statSync(join(ROOT, path)).size, bytes, name);
  }
});

test("the issued patents are the issued patents", () => {
  for (const line of read("docs/patents/SHA256SUMS.txt").trim().split("\n")) {
    const [expected, name] = line.split(/\s+/);
    assert.equal(sha256(`docs/patents/${name}`), expected, name);
  }
  assert.ok(existsSync(join(ROOT, "docs/patents/US9720401B2.pdf")) && existsSync(join(ROOT, "docs/patents/US10768609B2.pdf")));
});
