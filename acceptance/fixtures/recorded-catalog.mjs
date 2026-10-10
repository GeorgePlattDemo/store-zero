// The catalog the live Store (pin 9c62d9d) evaluated against, frozen, in this repository's catalog schema.
//
// Recorded answers — the differential corpus and the Project 1 specimen — are reproduced against this frozen
// catalog, never against data/store-zero-catalog.json. Adding or repricing a SKU in the live catalog can
// legitimately change a live answer (the evaluator may now find a better board); it must never change a
// recorded one. The live catalog is held to its rules by acceptance/catalog instead.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { CATALOG_RULES } from "../../src/evaluation/catalog.mjs";

export const RECORDED_STORE_PIN = "9c62d9d6f7775deef83d47196d32c9b5174a352c";

export function recordedCatalogAsRead() {
  return JSON.parse(gunzipSync(readFileSync(new URL("./pin-9c62d9d-catalog.json.gz", import.meta.url))).toString("utf8"));
}

// The three deliberate catalog changes, and nothing else:
//   - the hand-maintained top-level skuCount is gone (the catalog is validated, not counted);
//   - the Alcove hardware pack row declares the requirement it satisfies, replacing a SKU table in code;
//   - offered operations are reduced to Store's operation vocabulary (approved change NO-UNMODELED-OPERATION): the
//     recorded Store listed operations no evaluator here or there ever modeled. The frozen file itself is unchanged.
// Offered operations reduced to Store's operation vocabulary; the order is kept.
export function currentOperations(ops) {
  return ops.filter((op) => CATALOG_RULES.supportedOps.includes(op));
}

export function toCurrentSchema(catalog) {
  const { skuCount, ...rest } = catalog;
  return {
    ...rest,
    offerings: rest.offerings.map((o) => {
      const row = o.storeSku === "STB-ZERO-HW-ALCOVE-PACK-001" && !o.satisfiesRequirementIds
        ? { ...o, satisfiesRequirementIds: ["ALCOVE-PINS-AND-SCREWS"] }
        : o;
      return Array.isArray(row.supportedOps) ? { ...row, supportedOps: currentOperations(row.supportedOps) } : row;
    })
  };
}

export function recordedCatalog() {
  return toCurrentSchema(recordedCatalogAsRead());
}
