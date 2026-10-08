/**
 * Store Zero callable catalog: load, validate, look up.
 *
 * The catalog is data. Adding an offering means adding one row to data/store-zero-catalog.json and running
 * `npm run check:catalog`; no code changes. A catalog that fails validation is never evaluated: every
 * evaluator reads catalog rows directly, so a malformed row would otherwise become a malformed answer.
 */
import { readFileSync } from "node:fs";

const CATALOG_URL = new URL("../../data/store-zero-catalog.json", import.meta.url);
const OBSERVATIONS_URL = new URL("../../data/sources/store-zero-observations.json", import.meta.url);

export const CATALOG_RULES = Object.freeze({
  documentKind: "StoreZeroCallableCatalog",
  markOn: 0.05,
  forms: Object.freeze(["board", "sheet", "hardware"]),
  cellFamilies: Object.freeze({ board: ["D-001"], sheet: ["S-001"], hardware: [] }),
  supportedOps: Object.freeze([
    "CROSSCUT", "MITER_LIMITED", "SPOT_ON_LOCATION", "DRILL", "MILL_LONGITUDINAL_PROFILE",
    "MILL_END_PROFILE", "DADO", "GROOVE", "RABBET", "RIP", "ROUTE_PROFILE"
  ]),
  uom: Object.freeze(["ea", "pkg", "box", "kit", "pr"]),
  listReferenceBasis: Object.freeze(["OBSERVED", "CALCULATED", "REPORTED", "PLAUSIBLE"]),
  requiredAssertions: Object.freeze([
    "externalListPrice", "materialMapping", "sellingPrice", "pricingRule",
    "onHand", "allocation", "supplierPath", "cellCompatibility"
  ]),
  optionalAssertions: Object.freeze(["listReferenceDerivation", "routeProfile"]),
  fastenerKeys: Object.freeze(["kind", "lengthIn", "tier", "piecesPerPackage", "treatedLumberRated"])
});

const TOP_KEYS = ["documentKind", "stage", "store", "clock", "markOn", "pricingRule", "onHandLanguage", "offerings"];
const OFFERING_KEYS = [
  "storeSku", "offered", "form", "species", "grade", "nominalT", "nominalW", "actualT", "actualW", "stockL_in",
  "sheetW_in", "sheetL_in", "uom", "list_reference", "mark_on", "sellingPrice", "onHand", "allocated",
  "supplierPath", "cellFamily", "supportedOps", "priceBasis", "observationId", "limitations", "description",
  "assertions", "listReferenceBasis"
];
const OPTIONAL_OFFERING_KEYS = ["fastener", "satisfiesRequirementIds"];

// Which dimensional fields each form carries. A number where a form has none, or null where it needs one, fails.
const FORM_FIELDS = {
  board: { number: ["nominalT", "nominalW", "actualT", "actualW", "stockL_in"], nullish: ["sheetW_in", "sheetL_in"], text: ["species", "grade"] },
  sheet: { number: ["actualT", "sheetW_in", "sheetL_in"], nullish: ["nominalT", "nominalW", "actualW", "stockL_in"], text: ["species", "grade"] },
  hardware: { number: [], nullish: ["species", "grade", "nominalT", "nominalW", "actualT", "actualW", "stockL_in", "sheetW_in", "sheetL_in"], text: [] }
};

const positive = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
const wholeAtLeastZero = (v) => Number.isInteger(v) && v >= 0;
const text = (v) => typeof v === "string" && v.trim().length > 0;

export function sellingPriceFor(listReference, markOn = CATALOG_RULES.markOn) {
  return Math.round(listReference * (1 + markOn) * 100) / 100;
}

function offeringProblems(o, index) {
  const at = `offerings[${index}]${o && text(o.storeSku) ? ` ${o.storeSku}` : ""}`;
  if (!o || typeof o !== "object" || Array.isArray(o)) return [`${at}: not an object`];
  const problems = [];
  const keys = Object.keys(o);
  for (const key of OFFERING_KEYS) if (!keys.includes(key)) problems.push(`${at}: missing ${key}`);
  for (const key of keys) if (!OFFERING_KEYS.includes(key) && !OPTIONAL_OFFERING_KEYS.includes(key)) problems.push(`${at}: unknown field ${key}`);

  if (!/^STB-ZERO-[A-Z0-9][A-Z0-9-]*$/.test(String(o.storeSku))) problems.push(`${at}: storeSku must match STB-ZERO-…`);
  if (typeof o.offered !== "boolean") problems.push(`${at}: offered must be true or false`);
  if (!CATALOG_RULES.forms.includes(o.form)) {
    problems.push(`${at}: form must be one of ${CATALOG_RULES.forms.join(", ")}`);
    return problems;
  }
  const shape = FORM_FIELDS[o.form];
  for (const key of shape.number) if (!positive(o[key])) problems.push(`${at}: ${key} must be a positive number for ${o.form}`);
  for (const key of shape.nullish) if (o[key] !== null) problems.push(`${at}: ${key} must be null for ${o.form}`);
  for (const key of shape.text) if (!text(o[key])) problems.push(`${at}: ${key} is required for ${o.form}`);
  if (o.form === "board" && positive(o.actualT) && positive(o.actualW) && o.actualT > o.actualW) {
    problems.push(`${at}: actualT may not exceed actualW`);
  }

  if (!CATALOG_RULES.uom.includes(o.uom)) problems.push(`${at}: uom must be one of ${CATALOG_RULES.uom.join(", ")}`);
  if (!positive(o.list_reference)) problems.push(`${at}: list_reference must be a positive number`);
  if (o.mark_on !== CATALOG_RULES.markOn) problems.push(`${at}: mark_on must be ${CATALOG_RULES.markOn}`);
  if (positive(o.list_reference) && o.sellingPrice !== sellingPriceFor(o.list_reference)) {
    problems.push(`${at}: sellingPrice must be ${sellingPriceFor(o.list_reference)} (ROUND(list_reference × 1.05, 2))`);
  }
  if (o.priceBasis !== "CALCULATED") problems.push(`${at}: priceBasis must be CALCULATED`);
  if (!CATALOG_RULES.listReferenceBasis.includes(o.listReferenceBasis)) problems.push(`${at}: listReferenceBasis is not declared`);
  if (!wholeAtLeastZero(o.onHand)) problems.push(`${at}: onHand must be a whole number ≥ 0`);
  if (!wholeAtLeastZero(o.allocated)) problems.push(`${at}: allocated must be a whole number ≥ 0`);
  if (wholeAtLeastZero(o.onHand) && wholeAtLeastZero(o.allocated) && o.allocated > o.onHand) problems.push(`${at}: allocated exceeds onHand`);
  if (o.supplierPath !== "SPECIAL_ORDER_REPRESENTED") problems.push(`${at}: supplierPath must be SPECIAL_ORDER_REPRESENTED`);
  if (!text(o.description)) problems.push(`${at}: description is required`);
  if (o.observationId !== null && !/^OBS-\d{3}$/.test(String(o.observationId))) problems.push(`${at}: observationId must be OBS-nnn or null`);

  const families = CATALOG_RULES.cellFamilies[o.form];
  if (!Array.isArray(o.cellFamily) || o.cellFamily.length !== families.length || o.cellFamily.some((f, i) => f !== families[i])) {
    problems.push(`${at}: cellFamily must be ${JSON.stringify(families)} for ${o.form}`);
  }
  if (!Array.isArray(o.supportedOps) || o.supportedOps.some((op) => !CATALOG_RULES.supportedOps.includes(op))) {
    problems.push(`${at}: supportedOps may only name declared operations`);
  } else if (new Set(o.supportedOps).size !== o.supportedOps.length) {
    problems.push(`${at}: supportedOps repeats an operation`);
  } else if (o.form === "hardware" && o.supportedOps.length) {
    problems.push(`${at}: hardware is sourced, not fabricated; supportedOps must be empty`);
  }
  if (!Array.isArray(o.limitations) || o.limitations.some((l) => !text(l))) problems.push(`${at}: limitations must be a list of text`);

  const assertions = o.assertions;
  if (!assertions || typeof assertions !== "object") {
    problems.push(`${at}: assertions are required`);
  } else {
    for (const key of CATALOG_RULES.requiredAssertions) {
      if (!assertions[key] || !text(assertions[key].basis)) problems.push(`${at}: assertions.${key}.basis is required`);
    }
    for (const key of Object.keys(assertions)) {
      if (!CATALOG_RULES.requiredAssertions.includes(key) && !CATALOG_RULES.optionalAssertions.includes(key)) {
        problems.push(`${at}: unknown assertion ${key}`);
      }
    }
    // An observed, reported or plausible list reference is the external value itself. A calculated one is not
    // an observation: it either names no external value or states the derivation from the one it came from.
    const external = assertions.externalListPrice;
    if (external && o.listReferenceBasis !== "CALCULATED" && external.value !== o.list_reference) {
      problems.push(`${at}: assertions.externalListPrice.value must equal list_reference for a ${o.listReferenceBasis} price`);
    }
    if (external && o.listReferenceBasis === "CALCULATED" && external.value !== null && !assertions.listReferenceDerivation) {
      problems.push(`${at}: a CALCULATED list_reference needs assertions.listReferenceDerivation`);
    }
  }

  if (o.fastener !== undefined) {
    const f = o.fastener;
    if (o.form !== "hardware") problems.push(`${at}: only hardware carries fastener facts`);
    else if (!f || typeof f !== "object") problems.push(`${at}: fastener must be an object`);
    else {
      for (const key of Object.keys(f)) if (!CATALOG_RULES.fastenerKeys.includes(key)) problems.push(`${at}: unknown fastener field ${key}`);
      if (!text(f.kind) || !text(f.tier)) problems.push(`${at}: fastener kind and tier are required`);
      if (!positive(f.lengthIn)) problems.push(`${at}: fastener lengthIn must be positive`);
      if (!Number.isInteger(f.piecesPerPackage) || f.piecesPerPackage < 1) problems.push(`${at}: fastener piecesPerPackage must be a whole number ≥ 1`);
      if (typeof f.treatedLumberRated !== "boolean") problems.push(`${at}: fastener treatedLumberRated must be true or false`);
    }
  }
  if (o.satisfiesRequirementIds !== undefined) {
    if (o.form !== "hardware") problems.push(`${at}: only hardware satisfies functional hardware requirements`);
    if (!Array.isArray(o.satisfiesRequirementIds) || !o.satisfiesRequirementIds.length || o.satisfiesRequirementIds.some((id) => !text(id))) {
      problems.push(`${at}: satisfiesRequirementIds must be a nonempty list of requirement ids`);
    }
  }
  return problems;
}

/** Every reason this catalog cannot be evaluated against. Empty means valid. */
export function catalogProblems(catalog) {
  if (!catalog || typeof catalog !== "object") return ["catalog: not an object"];
  const problems = [];
  for (const key of TOP_KEYS) if (!(key in catalog)) problems.push(`catalog: missing ${key}`);
  for (const key of Object.keys(catalog)) if (!TOP_KEYS.includes(key)) problems.push(`catalog: unknown field ${key}`);
  if (catalog.documentKind !== CATALOG_RULES.documentKind) problems.push(`catalog: documentKind must be ${CATALOG_RULES.documentKind}`);
  if (catalog.markOn !== CATALOG_RULES.markOn) problems.push(`catalog: markOn must be ${CATALOG_RULES.markOn}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(catalog.clock))) problems.push("catalog: clock must be YYYY-MM-DD");
  if (!Array.isArray(catalog.offerings) || !catalog.offerings.length) return [...problems, "catalog: offerings must be a nonempty list"];

  const seen = new Set();
  const requirementOwners = new Map();
  catalog.offerings.forEach((o, index) => {
    problems.push(...offeringProblems(o, index));
    if (o && seen.has(o.storeSku)) problems.push(`offerings[${index}] ${o.storeSku}: duplicate storeSku`);
    if (o) seen.add(o.storeSku);
    for (const id of Array.isArray(o?.satisfiesRequirementIds) ? o.satisfiesRequirementIds : []) {
      if (requirementOwners.has(id)) problems.push(`offerings[${index}] ${o.storeSku}: requirement ${id} is already satisfied by ${requirementOwners.get(id)}`);
      requirementOwners.set(id, o.storeSku);
    }
  });
  return problems;
}

export function validateCatalog(catalog) {
  const problems = catalogProblems(catalog);
  if (problems.length) {
    const error = new Error(`Store catalog is invalid (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n  ${problems.join("\n  ")}`);
    error.code = "STORE_CATALOG_INVALID";
    error.problems = problems;
    throw error;
  }
  return catalog;
}

/** Reads and validates the catalog from disk. Called for every formal request so each answer sees current data. */
export function loadCatalog(url = CATALOG_URL) {
  return validateCatalog(JSON.parse(readFileSync(url, "utf8")));
}

export function loadObservations(url = OBSERVATIONS_URL) {
  return JSON.parse(readFileSync(url, "utf8"));
}

export function findSku(catalog, storeSku) {
  return catalog.offerings.find((o) => o.storeSku === storeSku) || null;
}

export function offerMaterial(catalog, q) {
  return catalog.offerings.filter((o) => {
    if (q.species && o.species !== q.species) return false;
    if (q.form && o.form !== q.form) return false;
    if (q.nominalT != null && o.nominalT !== q.nominalT) return false;
    if (q.nominalW != null && o.nominalW !== q.nominalW) return false;
    if (q.stockL_in != null && o.stockL_in !== q.stockL_in) return false;
    return o.offered;
  });
}

/** The one hardware offering that declares it satisfies a functional requirement id, or null. */
export function offeringForRequirement(catalog, requirementId) {
  return catalog.offerings.find((o) => Array.isArray(o.satisfiesRequirementIds) && o.satisfiesRequirementIds.includes(requirementId)) || null;
}
