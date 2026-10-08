import fs from 'node:fs';
import { createHash } from 'node:crypto';
let depth = 0;
const out = process.env.RECORD_FILE;
const source = process.env.RECORD_SOURCE || process.argv[1]?.split('/').pop();
const base = JSON.parse(fs.readFileSync(new URL('./store-zero-catalog.json', import.meta.url), 'utf8'));
const baseBySku = new Map(base.offerings.map((o) => [o.storeSku, JSON.stringify(o)]));
const baseTop = JSON.stringify({ ...base, offerings: null });
function catalogDelta(c) {
  const changed = [];
  const present = new Set();
  for (const o of c.offerings) {
    present.add(o.storeSku);
    if (baseBySku.get(o.storeSku) !== JSON.stringify(o)) changed.push(o);
  }
  const removed = [...baseBySku.keys()].filter((s) => !present.has(s));
  const order = c.offerings.map((o) => o.storeSku);
  const sameOrder = order.length === base.offerings.length && order.every((s, i) => s === base.offerings[i].storeSku);
  const top = JSON.stringify({ ...c, offerings: null }) === baseTop ? null : { ...c, offerings: undefined };
  return { $catalog: { changed, removed, order: sameOrder ? null : order, top } };
}
export function encode(value) {
  return JSON.stringify(value, (k, v) => {
    if (typeof v === 'number' && !Number.isFinite(v)) return { $num: String(v) };
    if (v && typeof v === 'object' && Array.isArray(v.offerings) && v.documentKind === base.documentKind) return catalogDelta(v);
    return v;
  });
}
export function __record(name, fn, args) {
  if (depth > 0 || !out) return fn(...args);
  const input = encode(args);
  // Evaluate exactly what is recorded: a JSON round trip drops undefined fields and keeps NaN as NaN, so the
  // recorded output always belongs to the recorded input.
  const exact = JSON.parse(JSON.stringify(args, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? { $num: String(v) } : v)), (k, v) => (v && typeof v === 'object' && '$num' in v ? Number(v.$num) : v));
  depth += 1;
  let result;
  try { result = fn(...exact); } finally { depth -= 1; }
  const output = encode(result);
  const key = createHash('sha256').update(name + input).digest('hex');
  fs.appendFileSync(out, JSON.stringify({ name, key, source, input, output }) + '\n');
  return result;
}
