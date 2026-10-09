// Project 1's definition, read from the sealed evidence, with the facts it was priced on now stated.
// The review's inquiry named no grade and carried its end geometry beside the demand (the review, "Ends and length datum":
// parallel face miters, long-long outer edge). Store now reads both in the definition, so the sealed inquiry
// is asked for them; stated, this Store gives the review's whole answer, hashes included (acceptance/project-1).
import { readFileSync } from "node:fs";

export const PROJECT_1_GRADE = "above-ground";
export const PROJECT_1_GEOMETRY = Object.freeze({ endRelation: "parallel", lengthDatum: "long-long-outer-edge" });
export const sealedProject1Demand = () =>
  JSON.parse(readFileSync(new URL("../../acceptance/project-1/from-evidence/definition-and-demand.json", import.meta.url), "utf8")).demand;
export const project1Demand = () => {
  const demand = sealedProject1Demand();
  return { ...demand, ...PROJECT_1_GEOMETRY, materialDemand: { ...demand.materialDemand, grade: PROJECT_1_GRADE } };
};
