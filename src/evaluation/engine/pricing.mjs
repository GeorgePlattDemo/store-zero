/**
 * Store Zero Stage-2 pricing: the identities of the price and cycle models, and the complete Q for one
 * identified user-defined board.
 *
 * Complete dimensional Q exists only for identified travel demand (parts, features, angle, plane, Datum C).
 * There is no count-only estimate: a request that cannot name its parts and features is answered by the
 * request layer as not a clean definition, never priced from counts.
 */
import { findSku } from "../catalog.mjs";
import {
  D001_TRAVEL_STANDARD,
  evaluateD001UserDefinedBoard,
  sawFeedInPerMin,
  storeMachineSellRate
} from "./d001-travel-standard.mjs";

export const ENGINE = Object.freeze({
  id: "STB-STORE-ZERO-PRICE-1",
  version: "0.3.0",
  clock: "2026-09-22",
  documentKind: "BudgetaryEstimate",
  governingStandard: D001_TRAVEL_STANDARD.standardFile
});

export const CYCLE_MODEL = Object.freeze({
  id: D001_TRAVEL_STANDARD.id,
  version: D001_TRAVEL_STANDARD.version,
  basis: D001_TRAVEL_STANDARD.basis,
  measured: false,
  commissioned: false,
  purpose: "one declared kinematic/travel model for complete dimensional Store economics"
});

export const ECONOMICS_MODEL = Object.freeze({
  ...D001_TRAVEL_STANDARD.economics,
  ...storeMachineSellRate()
});

function round(n, p = 2) {
  const m = 10 ** p;
  return Math.round((Number(n) + Number.EPSILON) * m) / m;
}

// Surface speed and feed reported with a complete cycle; they restate the declared saw model, nothing more.
function sfm(saw = D001_TRAVEL_STANDARD.saw) {
  return (Math.PI * saw.diameterIn * saw.rpm) / 12;
}

function feedFpm(saw = D001_TRAVEL_STANDARD.saw) {
  return sawFeedInPerMin(saw) / 12;
}

export function estimateUserDefinedBoardTravel(catalog, {
  title = "User-defined Board",
  classId = "user_defined_board",
  configurationId,
  configurationVersion,
  storeSku,
  definedWorkpieceLengthIn,
  sawAngleDeg,
  cutPlane = "miter-face",
  datumCMethod = "REFERENCE_CUT",
  parts,
  declaredSawCuts = null,
  declaredSpotCount = null,
  unresolvedConditions = [],
  storeRevision = null
} = {}) {
  const item = findSku(catalog, storeSku);
  if (!item) return { status: "UNRESOLVED", complete: false, reason: "BOARD_OFFERING_REQUIRED", title };

  const evaluated = evaluateD001UserDefinedBoard({
    item,
    storeRevision,
    demand: {
      configurationId,
      configurationVersion,
      classId,
      definedWorkpieceLengthIn,
      cut: {
        angleDeg: sawAngleDeg,
        plane: cutPlane,
        kerfIn: D001_TRAVEL_STANDARD.control.kerfIn
      },
      datumC: {
        method: datumCMethod,
        stationId: D001_TRAVEL_STANDARD.stations.sawMiter.id
      },
      parts,
      declaredSawCuts,
      declaredSpotCount,
      unresolvedConditions
    }
  });

  return {
    ...evaluated,
    title,
    classId,
    documentKind: ENGINE.documentKind,
    engine: ENGINE,
    cycle: evaluated.complete
      ? {
          model: CYCLE_MODEL.id,
          version: CYCLE_MODEL.version,
          basis: CYCLE_MODEL.basis,
          measured: false,
          commissioned: false,
          T_job_min: evaluated.travel.time.T_MACHINE_min,
          T_job_hr: evaluated.travel.time.T_MACHINE_hr,
          SFM: round(sfm(), 0),
          feed_fpm: round(feedFpm(), 2)
        }
      : null
  };
}
