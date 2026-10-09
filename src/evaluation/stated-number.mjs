/**
 * What counts as a stated number in a definition. A number is stated when it is a finite number, or text that is a
 * number. null, undefined, blank or whitespace text, booleans, lists and objects are not supplied: they are never
 * read as 0. Every evaluator reads a manufacturing number through this one rule.
 */
export function statedNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}
