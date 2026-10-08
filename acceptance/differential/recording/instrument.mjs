// Copies the pinned Store into a recording copy whose job-level evaluators log (input, output) pairs.
import fs from 'node:fs';
import path from 'node:path';
const [src, dst] = process.argv.slice(2);
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: (p) => !p.includes('/.git') });
const TARGETS = {
  'store-zero-stage2-store.mjs': ['evaluateDimensionalTravelJob'],
  'alcove-store-evaluator.mjs': ['evaluateAlcoveJob'],
  'cut-package-evaluator.mjs': ['evaluateCutPackageJob'],
  'sheet-package-evaluator.mjs': ['evaluateSheetPackageJob'],
  'd001-travel-standard.mjs': ['evaluateD001UserDefinedBoard', 'evaluateD001DimensionalBatch'],
  'd001-stage2-envelope.mjs': ['envelopeCheck'],
  'circular-segment.mjs': ['evaluateCircularSegment'],
  'stencil-tab-policy.mjs': ['archedAperturePerimeter', 'planArchedStencilTabs', 'planSplitStencilTabs'],
};
fs.copyFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'recorder.mjs'), path.join(dst, '__recorder.mjs'));
for (const [file, names] of Object.entries(TARGETS)) {
  const p = path.join(dst, file);
  let text = fs.readFileSync(p, 'utf8');
  let tail = `\nimport { __record } from "./__recorder.mjs";\n`;
  for (const name of names) {
    const re = new RegExp(`export function ${name}\\(`);
    if (!re.test(text)) throw new Error(`${name} not in ${file}`);
    text = text.replace(re, `function __orig_${name}(`);
    tail += `export function ${name}(...args) { return __record(${JSON.stringify(name)}, __orig_${name}, args); }\n`;
  }
  fs.writeFileSync(p, text + tail);
}
