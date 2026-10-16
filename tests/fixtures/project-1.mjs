// Treated-lumber comparison derived from the sealed source specimen with explicit grade/end geometry.
// Its current core answer has its own Q and calculation identities. Current SPF Project 1 proof is generated
// by scripts/build-contract-examples.mjs for both public settings. Original evidence remains unchanged.
import { readFileSync } from "node:fs";

export const PROJECT_1_GRADE = "above-ground";
export const PROJECT_1_GEOMETRY = Object.freeze({ endRelation: "parallel", lengthDatum: "long-long-outer-edge" });
export const sealedProject1Demand = () =>
  JSON.parse(readFileSync(new URL("../../acceptance/project-1/from-evidence/definition-and-demand.json", import.meta.url), "utf8")).demand;
export const project1Demand = () => {
  const demand = sealedProject1Demand();
  return { ...demand, ...PROJECT_1_GEOMETRY, materialDemand: { ...demand.materialDemand, grade: PROJECT_1_GRADE } };
};
