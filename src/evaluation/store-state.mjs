/**
 * Store Zero Stage-2 state answers: stock, price, capability, and candidate ordering.
 * Ask for the answer, not the database.
 *
 * Job dispositions declared at Stage 2:
 *   UNRESOLVED  a required fact is missing (SKU, price, capability input)
 *   REFUSED     the defined request is outside a declared material, operation or cell rule
 *   UNAVAILABLE declared available stock < quantity needed (ON_HAND_SHORT and NOT_ON_HAND both fail)
 *   SUPPORTABLE every required line is priced, capable, and sufficient
 *
 * Line stock facts remain: ON_HAND_SUFFICIENT | ON_HAND_SHORT | NOT_ON_HAND.
 * A synthetic supplierPath does not convert a shortage into SUPPORTABLE.
 * `asOf` is the catalog clock of the catalog the item came from; it is passed in, never assumed.
 */
import { envelopeCheck } from "./envelopes/d001-stage2-envelope.mjs";
import { offerMaterial } from "./catalog.mjs";

export const STAGE2_JOB_DISPOSITIONS = Object.freeze(["SUPPORTABLE", "UNRESOLVED", "REFUSED", "UNAVAILABLE"]);

/**
 * The grades Store offers for a wood (species, form, nominal size), sorted. The one rule for grade choice: when this
 * lists more than one grade and the definition names none, the answer asks for it (GRADE_CHOICE_REQUIRED).
 */
export function offeredGrades(catalog, material = {}) {
  const rows = offerMaterial(catalog, { species: material.species, form: material.form || "board", nominalT: material.nominalT, nominalW: material.nominalW });
  return [...new Set(rows.map((item) => item.grade))].sort();
}

export function matchingBoardOfferings(catalog, demand = {}) {
  const minimumWorkpieceLengthIn = Number(demand.definedWorkpieceLengthIn);
  return offerMaterial(catalog, {
    species: demand.species,
    form: demand.form || "board",
    nominalT: demand.nominalT,
    nominalW: demand.nominalW
  })
    .filter((item) => demand.grade == null || item.grade === demand.grade)
    .filter((item) =>
      Number.isFinite(minimumWorkpieceLengthIn)
        ? Number(item.stockL_in) >= minimumWorkpieceLengthIn
        : true
    )
    .sort((a, b) =>
      Number(a.stockL_in) - Number(b.stockL_in) ||
      Number(a.sellingPrice) - Number(b.sellingPrice) ||
      String(a.storeSku).localeCompare(String(b.storeSku))
    );
}

export function stockAnswer(item, qtyNeeded, asOf) {
  if (!item) return { status: "UNAVAILABLE", reason: "SKU_NOT_OFFERED" };
  const available = item.onHand - item.allocated;
  return {
    status: available >= qtyNeeded ? "ON_HAND_SUFFICIENT" : available > 0 ? "ON_HAND_SHORT" : "NOT_ON_HAND",
    offered: item.offered,
    fixtureDeclaredOnHand: item.onHand,
    allocatedSimulated: item.allocated,
    available,
    qtyNeeded,
    sufficient: available >= qtyNeeded,
    supplierPath: item.supplierPath,
    assertions: {
      onHand: item.assertions.onHand,
      allocation: item.assertions.allocation,
      supplierPath: item.assertions.supplierPath
    },
    asOf
  };
}

export function priceAnswer(item, asOf) {
  if (!item || item.sellingPrice == null) return { status: "UNRESOLVED", reason: "MISSING_PRICE" };
  return {
    status: "STORE_ZERO_SELLING_PRICE",
    list_reference: item.list_reference,
    listReferenceBasis: item.listReferenceBasis,
    mark_on: item.mark_on,
    sellingPrice: item.sellingPrice,
    sellingPriceBasis: "CALCULATED",
    observationId: item.observationId || null,
    asOf,
    note: "Budgetary fixture price. Not a commercial quote."
  };
}

export function capabilityAnswer(item, requiredOps = [], feature = {}) {
  if (!item) return { status: "REFUSED", reason: "NO_OFFERING" };
  const env = envelopeCheck(item, { requiredOps, ...feature });
  if (env.status === "SOURCED") {
    return { status: "SOURCED", envelope: env };
  }
  if (env.status === "REFUSED") {
    return {
      status: "REFUSED",
      missing: env.reasons,
      declared: item.supportedOps,
      cellFamily: item.cellFamily,
      basis: "DECLARED_STAGE2_CAPABILITY",
      envelope: env
    };
  }
  if (env.status === "UNRESOLVED") {
    return {
      status: "UNRESOLVED",
      unresolved: env.unresolved,
      declared: item.supportedOps,
      cellFamily: item.cellFamily,
      basis: "DECLARED_STAGE2_CAPABILITY",
      envelope: env
    };
  }
  return {
    status: "SUPPORTABLE",
    declared: item.supportedOps,
    cellFamily: item.cellFamily,
    limitations: item.limitations || [],
    basis: "DECLARED_STAGE2_CAPABILITY",
    envelope: env
  };
}
