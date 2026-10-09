/**
 * The exact definition each evaluated request type accepts: every field at every level, and its type.
 * These are the shapes System already sends (its admission validates the same fields); Store refuses anything
 * outside them before an evaluator sees it. Values are checked by the evaluators, which answer with reasons.
 */

const strings = { array: "string" };

const USER_DEFINED_BOARD_V1 = {
  object: {
    title: "string",
    configurationId: "string",
    configurationVersion: "string",
    classId: "string",
    // No grade: this definition names a material class, and the Store selects among its grades by length.
    materialDemand: { object: { species: "string", form: "string", nominalT: "number", nominalW: "number" } },
    definedWorkpieceLengthIn: "number",
    requiredOps: strings,
    sawAngleDeg: "number",
    cutPlane: "string",
    datumCMethod: "string",
    declaredSawCuts: "integer",
    declaredSpotCount: "integer",
    unresolvedConditions: strings,
    parts: {
      array: {
        object: {
          partId: "string",
          lengthIn: "number",
          features: {
            array: {
              object: {
                featureId: "string",
                kind: "string",
                xIn: "number",
                locationRule: "string",
                acrossWidthRule: "string",
                insetFromEdgeIn: "number"
              }
            }
          }
        }
      }
    }
  }
};

const BOARD_MATERIAL = { object: { species: "string", form: "string", nominalT: "number", nominalW: "number", grade: "string" } };

const CUT_PACKAGE_V1 = {
  object: {
    classId: "string",
    configurationId: "string",
    configurationVersion: "string",
    cutPackages: {
      array: {
        object: {
          packageId: "string",
          material: BOARD_MATERIAL,
          endCut: { object: { angleDeg: "number" } },
          finishedWidthIn: "number",
          parts: {
            array: {
              object: {
                partId: "string",
                lengthIn: "number",
                spots: { array: { object: { featureId: "string", xIn: "number", acrossWidthRule: "string", insetFromEdgeIn: "number" } } }
              }
            }
          }
        }
      }
    },
    itemLines: {
      array: {
        object: {
          lineId: "string",
          storeSku: "string",
          requirementId: "string",
          qty: "integer",
          requirement: { object: { kind: "string", gauge: "string", diameterIn: "number", lengthIn: "number", finish: "string", unit: "string" } }
        }
      }
    }
  }
};

const SHEET_PACKAGE_V1 = {
  object: {
    configurationId: "string",
    configurationVersion: "string",
    sheet: { object: { thicknessIn: "number", lengthIn: "number", widthIn: "number", species: "string", grade: "string" } },
    features: {
      array: {
        object: {
          featureId: "string",
          kind: "string",
          placement: "string",
          widthIn: "number",
          straightHeightIn: "number",
          riseIn: "number",
          retain: "string",
          requestedTabCount: "integer",
          within: "string",
          line: "string",
          fromEnd: "string",
          distanceIn: "number"
        }
      }
    },
    returnAllPieces: "boolean",
    exteriorRatingRequested: "boolean"
  }
};

export const DEFINITION_SHAPES = Object.freeze({ USER_DEFINED_BOARD_V1, CUT_PACKAGE_V1, SHEET_PACKAGE_V1 });
