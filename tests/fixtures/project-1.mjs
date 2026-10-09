// Project 1's definition, read from the sealed evidence, with the grade it was priced at.
// The review's inquiry named no grade. Treated 2x4 comes in more than one, and the grade is the customer's choice,
// so the sealed inquiry is now asked for one; the board the review priced is above-ground. With that grade named,
// this Store gives the review's whole answer, hashes included (acceptance/project-1).
import { readFileSync } from "node:fs";

export const PROJECT_1_GRADE = "above-ground";
export const sealedProject1Demand = () =>
  JSON.parse(readFileSync(new URL("../../acceptance/project-1/from-evidence/definition-and-demand.json", import.meta.url), "utf8")).demand;
export const project1Demand = () => {
  const demand = sealedProject1Demand();
  return { ...demand, materialDemand: { ...demand.materialDemand, grade: PROJECT_1_GRADE } };
};
