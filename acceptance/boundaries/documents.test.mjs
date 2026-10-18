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

const OUR_DOCUMENTS = ["README.md", "AGENTS.md", "STORE-ZERO-MASTER.md", "docs/project-1-digital-trail/current-proof.md", SPEC, "docs/patents/README.md", "PROJECT-1-CURRENT-DIGITAL-MANUFACTURING-PROOF.md"];

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
  assert.ok(cited.size > 10);
  for (const path of cited) {
    if (path.includes("*")) continue;
    assert.ok(existsSync(join(ROOT, path.replace(/\/$/, ""))), `${SPEC} cites missing ${path}`);
  }
});

test("the specification's module index is exactly the modules under src", () => {
  const list = (dir) => readdirSync(join(ROOT, dir)).flatMap((n) => (statSync(join(ROOT, dir, n)).isDirectory() ? list(join(dir, n)) : /\.(mjs|js)$/.test(n) ? [join(dir, n)] : []));
  const indexed = read(SPEC).split("# Appendix C. Module index")[1].split("# Appendix D")[0];
  const named = new Set([...indexed.matchAll(/`(src\/[^`]+\.(?:mjs|js))`/g)].map((m) => m[1]));
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

// This task's owner-approved freeze is separate from historical publication custody.
test('the repository root README retains its approved frozen bytes',()=>{
 const bytes=readFileSync(join(ROOT,'README.md'));
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),'3d8f4dd2f055599b822d68741d8f74c5ebc8d08b');
});


test('complete published Project 1 proof matches current Store generated operations and totals',()=>{
  const md=read('PROJECT-1-CURRENT-DIGITAL-MANUFACTURING-PROOF.md');
  const cur=JSON.parse(read('docs/project-1-digital-trail/current-proof.json'));
  assert.equal(cur.specimens.length,3);
  assert.equal(cur.specimens.map(s=>s.id).join(','),'16,18,18-selected');
  assert.ok(md.includes(cur.source.digest));
  const qs='| **Whole-job manufacturing Q** | '+cur.specimens.map(s=>'**$'+s.packet.storeAnswer.Q.toFixed(2)+'**').join(' | ')+' |';
  const seconds='| Modeled hourly seconds | '+cur.specimens.map(s=>s.packet.storeAnswer.time.totalSeconds).join(' | ')+' |';
  assert.ok(md.includes(qs),'Store Q mismatch');
  assert.ok(md.includes(seconds),'Store occupancy mismatch');
  for(const [index,s] of cur.specimens.entries()){
    const start='### 14.'+(index+1)+' ',from=md.indexOf(start);
    const end=index<2?md.indexOf('### 14.'+(index+2)+' ',from+start.length):md.indexOf('## 15.',from+start.length);
    assert.ok(from>=0&&end>from,'Missing full ledger '+s.id);
    const block=md.slice(from,end),answer=s.packet.storeAnswer;
    assert.ok(block.includes(answer.calculationIdentity.inputHash));
    assert.ok(block.includes(answer.calculationIdentity.resultHash));
    assert.equal(answer.operations.length,51);
    assert.equal(answer.operations.filter(o=>o.kind==='MOVE').length,22);
    for(const [i,op] of answer.operations.entries()){
      const action=op.kind+(op.axis?' '+op.axis+' '+op.from+' → '+op.target:'');
      const row='| '+(i+1)+' | '+action+' | '+op.subject+' | '+op.seconds+' |';
      assert.ok(block.includes(row),s.id+' ledger operation '+(i+1)+' mismatch');
    }
  }
});
