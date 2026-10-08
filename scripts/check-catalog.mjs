// Validates data/store-zero-catalog.json and lists every problem. Run after adding or changing an offering.
import { readFileSync } from "node:fs";
import { catalogProblems } from "../src/evaluation/catalog.mjs";

const catalog = JSON.parse(readFileSync(new URL("../data/store-zero-catalog.json", import.meta.url), "utf8"));
const problems = catalogProblems(catalog);
if (problems.length) {
  console.error(`Catalog has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
const forms = catalog.offerings.reduce((n, o) => ({ ...n, [o.form]: (n[o.form] ?? 0) + 1 }), {});
console.log(`Catalog valid: ${catalog.offerings.length} offerings (${Object.entries(forms).map(([f, n]) => `${n} ${f}`).join(", ")}), clock ${catalog.clock}.`);
