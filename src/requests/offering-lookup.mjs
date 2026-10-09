/**
 * OFFERING_LOOKUP: catalog discovery. It reports offered Store rows; it never evaluates fabrication, never
 * selects a board for a job, and never produces machine time or Q.
 *
 * Search is deterministic retrieval over the catalog's own structured fields and description: no fuzzy
 * matching, no synonyms, no inference of capability or job fit. `1x6`, `1 x 6` and `1×6` are one token.
 * Rank 0 exact SKU, rank 1 SKU prefix, rank 2 every query token is a row token (AND); catalog order breaks ties.
 */
import { CATALOG_RULES, findSku, offerMaterial } from "../evaluation/catalog.mjs";

export const OFFERING_SEARCH_LIMITS = Object.freeze({ maxSearchTextLength: 80, maxResults: 20 });

export function normalizeOfferingSearchText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/(\d)\s*x\s*(?=\d)/g, "$1x")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokens(text) {
  const tokens = new Set();
  for (const token of normalizeOfferingSearchText(text).split(/[\s()—,;:]+/)) {
    if (!token) continue;
    tokens.add(token);
    if (token.includes("-")) token.split("-").filter(Boolean).forEach((part) => tokens.add(part));
  }
  return tokens;
}

function offeringSearchTokens(item) {
  const tokens = searchTokens(item.description ?? "");
  for (const value of [item.species, item.grade, item.form]) {
    if (typeof value === "string" && value) searchTokens(value).forEach((token) => tokens.add(token));
  }
  if (item.nominalT != null && item.nominalW != null) tokens.add(`${item.nominalT}x${item.nominalW}`);
  if (item.stockL_in != null) tokens.add(String(item.stockL_in));
  if (item.sheetW_in != null && item.sheetL_in != null) tokens.add(`${item.sheetW_in}x${item.sheetL_in}`);
  const sku = String(item.storeSku ?? "").toLowerCase();
  tokens.add(sku);
  sku.split("-").filter(Boolean).forEach((part) => tokens.add(part));
  return tokens;
}

export function searchOfferedCatalog(catalog, searchText, limit = OFFERING_SEARCH_LIMITS.maxResults) {
  const query = normalizeOfferingSearchText(searchText);
  const queryTokens = [...searchTokens(searchText)];
  const matches = [];
  if (!query || queryTokens.length === 0) return { matches, totalMatches: 0 };
  catalog.offerings.forEach((item, index) => {
    if (!item || item.offered !== true) return;
    const sku = String(item.storeSku ?? "").toLowerCase();
    let rank = null;
    if (sku === query) rank = 0;
    else if (!query.includes(" ") && sku.startsWith(query)) rank = 1;
    else {
      const rowTokens = offeringSearchTokens(item);
      if (queryTokens.every((token) => rowTokens.has(token))) rank = 2;
    }
    if (rank !== null) matches.push({ item, rank, index });
  });
  matches.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return { matches: matches.slice(0, limit).map((match) => match.item), totalMatches: matches.length };
}

function observationReference(observations, observationId) {
  if (!observationId || !Array.isArray(observations?.observations)) return null;
  const found = observations.observations.find((entry) => entry.id === observationId);
  return found ? { id: found.id, desc: found.desc ?? null, mapsTo: found.mapsTo ?? null, uom: found.uom ?? null } : null;
}

/** The Store facts a lookup may disclose about one offered row, with its price and stock basis. */
export function attributedOffering(item, catalog, observations) {
  if (!item) return null;
  return {
    storeSku: item.storeSku,
    description: item.description,
    form: item.form,
    species: item.species,
    grade: item.grade,
    nominalT: item.nominalT,
    nominalW: item.nominalW,
    actualT: item.actualT,
    actualW: item.actualW,
    stockL_in: item.stockL_in,
    sheetW_in: item.sheetW_in,
    sheetL_in: item.sheetL_in,
    uom: item.uom,
    offered: item.offered === true,
    supportedOps: item.supportedOps,
    cellFamily: item.cellFamily,
    limitations: item.limitations,
    list_reference: item.list_reference,
    listReferenceBasis: item.listReferenceBasis,
    mark_on: item.mark_on,
    sellingPrice: item.sellingPrice,
    priceBasis: item.priceBasis,
    onHand: item.onHand,
    allocated: item.allocated,
    supplierPath: item.supplierPath,
    assertions: item.assertions,
    observationId: item.observationId,
    observation: observationReference(observations, item.observationId),
    catalogClock: catalog.clock
  };
}

const QUERY_FIELDS = ["species", "form", "nominalT", "nominalW", "stockL_in"];

const nonblankText = (v) => typeof v === "string" && v.trim() !== "";
const positiveNumber = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
const QUERY_VALUE_RULES = Object.freeze({
  species: nonblankText,
  form: (v) => CATALOG_RULES.forms.includes(v),
  nominalT: positiveNumber,
  nominalW: positiveNumber,
  stockL_in: positiveNumber
});

/**
 * Exactly one of { searchText }, { storeSku }, or { query } is a clean lookup. Anything else is refused with
 * the reason, so a malformed lookup is never mistaken for "nothing found".
 */
export function lookupProblems(demand) {
  if (!demand || typeof demand !== "object" || Array.isArray(demand)) return ["LOOKUP_DEMAND_REQUIRED"];
  const keys = Object.keys(demand);
  if (keys.length !== 1 || !["searchText", "storeSku", "query"].includes(keys[0])) return ["LOOKUP_NEEDS_EXACTLY_ONE_OF_SEARCHTEXT_STORESKU_QUERY"];
  if (keys[0] === "searchText") {
    const text = demand.searchText;
    if (typeof text !== "string" || !text.trim() || text.length > OFFERING_SEARCH_LIMITS.maxSearchTextLength) return ["SEARCH_TEXT_MUST_BE_1_TO_80_CHARACTERS"];
  }
  if (keys[0] === "storeSku" && (typeof demand.storeSku !== "string" || !demand.storeSku.trim())) return ["STORE_SKU_REQUIRED"];
  if (keys[0] === "query") {
    const q = demand.query;
    if (!q || typeof q !== "object" || Array.isArray(q) || !Object.keys(q).length) return ["LOOKUP_QUERY_REQUIRED"];
    const extra = Object.keys(q).filter((k) => !QUERY_FIELDS.includes(k));
    if (extra.length) return extra.map((k) => `LOOKUP_QUERY_FIELD_NOT_DECLARED:${k}`);
    // Every given filter must be a real constraint; a malformed one is refused, never dropped to widen the lookup.
    const invalid = Object.keys(q).filter((k) => !QUERY_VALUE_RULES[k](q[k]));
    if (invalid.length) return invalid.map((k) => `LOOKUP_QUERY_FIELD_INVALID:${k}`);
  }
  return [];
}

export function lookupOfferings(catalog, observations, demand) {
  if ("searchText" in demand) {
    const { matches, totalMatches } = searchOfferedCatalog(catalog, demand.searchText);
    const offerings = matches.map((item) => attributedOffering(item, catalog, observations));
    return { status: "ANSWERED", kind: "SEARCH", offerings, totalMatches, truncated: totalMatches > offerings.length };
  }
  // An exact lookup reports a row only when exactly one offered row answers it.
  const item = "storeSku" in demand ? findSku(catalog, demand.storeSku) : null;
  const matches = "query" in demand ? offerMaterial(catalog, demand.query) : null;
  const one = item ?? (matches?.length === 1 ? matches[0] : null);
  const offering = one && one.offered === true ? attributedOffering(one, catalog, observations) : null;
  return { status: "ANSWERED", kind: "storeSku" in demand ? "SKU" : "QUERY", found: offering !== null, offering };
}
