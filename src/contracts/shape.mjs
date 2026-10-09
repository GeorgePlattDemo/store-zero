/**
 * A small, exact shape checker for Store contracts. A shape names every field an object may carry and the type
 * of each; anything else is a problem with its path. It checks shape only — whether a value is supportable is
 * the evaluator's answer, with its own reason codes.
 *
 * Node forms:
 *   { object: { field: node, ... }, codes?: { field: "CODE" } }   only these fields; `codes` names a field that
 *                                                                 is refused with its own reason code
 *   { array: node }                                               every item has the shape
 *   "string" | "number" | "integer" | "boolean"                   the JSON type (number is finite)
 *   { enum: [...], code? }                                        one of these values
 *   { any: true }                                                 anything (used only for an embedded Store answer)
 *
 * `null` stands for "not supplied" and is accepted for any field; required facts are the evaluator's to demand.
 */

const describe = (value) => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value);

function check(value, node, path, problems, prefix) {
  if (value === null || value === undefined) return;
  if (typeof node === "string") {
    const ok =
      node === "string" ? typeof value === "string" :
      node === "number" ? typeof value === "number" && Number.isFinite(value) :
      node === "integer" ? Number.isInteger(value) :
      node === "boolean" ? typeof value === "boolean" : false;
    if (!ok) problems.push(`${prefix}_FIELD_TYPE:${path}:${node}`);
    return;
  }
  if (node.any) return;
  if (node.enum) {
    if (!node.enum.includes(value)) problems.push(node.code ?? `${prefix}_FIELD_VALUE:${path}`);
    return;
  }
  if (node.array) {
    if (!Array.isArray(value)) return problems.push(`${prefix}_FIELD_TYPE:${path}:array`);
    value.forEach((item, i) => check(item, node.array, `${path}[${i}]`, problems, prefix));
    return;
  }
  if (node.object) {
    if (describe(value) !== "object") return problems.push(`${prefix}_FIELD_TYPE:${path || "(root)"}:object`);
    for (const key of Object.keys(value)) {
      const at = path ? `${path}.${key}` : key;
      if (Object.hasOwn(node.object, key)) check(value[key], node.object[key], at, problems, prefix);
      else problems.push(node.codes?.[key] ?? `${prefix}_FIELD_NOT_DECLARED:${at}`);
    }
  }
}

/** Every way `value` departs from `node`, as reason codes; empty when it fits. */
export function shapeProblems(value, node, prefix = "DEFINITION") {
  const problems = [];
  check(value, node, "", problems, prefix);
  return problems;
}
