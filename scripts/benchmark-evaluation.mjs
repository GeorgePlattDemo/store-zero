#!/usr/bin/env node
// Read-only performance baseline for Store's real request/receipt path.
// No mocked evaluator, cached answer, altered search limit or benchmark-only model.
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { evaluateStoreRequest } from '../src/requests/store-request.mjs';

const CASES = [
  'user-defined-board.project-1',
  'user-defined-board.default-spf',
  'cut-package.alcove-pine',
  'cut-package.mixed',
  'sheet-package.playhouse',
  'user-defined-board.grade-not-named',
  'offering-lookup.search'
];
const samples = Number(process.env.STORE_BENCH_SAMPLES ?? 3);
if (!Number.isInteger(samples) || samples < 1 || samples > 12) throw new Error('STORE_BENCH_SAMPLES must be between 1 and 12');
const results = [];
for (const name of CASES) {
  const request = JSON.parse(readFileSync(new URL('../contracts/examples/requests/' + name + '.json', import.meta.url)));
  const options = { release: process.env.STORE_BENCH_RELEASE ?? 'store-zero-benchmark', now: () => '2026-10-12T12:00:00.000Z' };
  evaluateStoreRequest(request, options);
  const measurements = [];
  let baseline = null;
  for (let run = 0; run < samples; run++) {
    const started = performance.now();
    const answer = evaluateStoreRequest(request, options);
    const durationMs = performance.now() - started;
    const summary = {
      status: answer.status, Q: answer.Q ?? null,
      nodes: answer.optimization?.nodes ?? null,
      searchComplete: answer.optimization?.searchComplete ?? null,
      selectedStock: answer.selectedStock?.map(({ storeSku, qty }) => ({ storeSku, qty })) ?? [],
      occupiedSeconds: answer.time?.totalSeconds ?? null,
      reasonCodes: answer.reasonCodes ?? []
    };
    const fingerprint = JSON.stringify(summary);
    if (baseline !== null && fingerprint !== baseline) throw new Error(name + ': repeated evaluation changed its answer');
    baseline = fingerprint;
    measurements.push(Math.round(durationMs * 100) / 100);
  }
  const sorted = [...measurements].sort((a, b) => a - b);
  const result = { name, medianMs: sorted[Math.floor(sorted.length / 2)], minMs: sorted[0],
    maxMs: sorted.at(-1), samples, answer: JSON.parse(baseline) };
  results.push(result);
  console.log(JSON.stringify(result));
}
if (!results.some(r => r.answer.nodes !== null)) throw new Error('No manufacturing search was exercised');
