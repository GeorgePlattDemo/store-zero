import test from "node:test";
import assert from "node:assert/strict";
import { STENCIL_TAB_POLICY_V0, planArchedStencilTabs, planSplitStencilTabs } from "../src/evaluation/engine/stencil-tab-policy.mjs";
import { referenceArchedAperture } from "../src/evaluation/engine/circular-segment.mjs";

// The reference aperture: 36 in chord, 12 in rise, 19.5 in radius, 36 in straight sides.
const ref = referenceArchedAperture();
const geometry = { chord_in: ref.chord_in, rise_in: ref.rise_in, radius_in: ref.radius_in, straightHeight_in: ref.apertureStraightH_in };
const plan = () => planArchedStencilTabs({ ...geometry, requestedTabCount: 4 });
const r6 = (v) => Number(v.toFixed(6));

// Hand geometry: arc = 39·asin(12/13) = 45.864203; perimeter = 36 + 2·36 + arc = 153.864203; 5 tabs → spacing 30.772841.
// Transitions sit at s = 0, 36, 72, 117.864203; their residues mod the spacing are 0, 5.227159, 10.454319, 25.545681, so the
// widest residue gap is 10.454319 → 25.545681 and the phase is its middle, 18 in (the bottom center).
const ARC = 39 * Math.asin(12 / 13);
const PERIMETER = 36 + 72 + ARC;
const SPACING = PERIMETER / 5;
// Arch points: center at y = 36 + 12 − 19.5 = 28.5, arc starts at angle atan2(19.5 − 12, 18) and advances (s − 72)/19.5 rad.
// (The hand point uses the 6-place arclength, so it agrees with the planner to within 2e-6 in.)
const assertArchPoint = (s, tab) => {
  const angle = Math.atan2(7.5, 18) + (s - 72) / 19.5;
  assert.ok(Math.abs(19.5 * Math.cos(angle) - tab.x_in) < 2e-6, `x at s=${s}`);
  assert.ok(Math.abs(28.5 + 19.5 * Math.sin(angle) - tab.y_in) < 2e-6, `y at s=${s}`);
};

test("the reference aperture plans 4 base tabs plus 1 reserve tab at equal arclength spacing", () => {
  // Rule: plannedTabCount = max(requested, referenceBaseCount 4 + planningReserveTabs 1); spacing = perimeter / count.
  assert.equal(ref.radius_in, 19.5);
  const p = plan();
  assert.equal(p.ok, true);
  assert.equal(STENCIL_TAB_POLICY_V0.referenceBaseCount + STENCIL_TAB_POLICY_V0.planningReserveTabs, 5);
  assert.equal(p.plannedTabCount, 5);
  assert.equal(p.arcLength_in, r6(ARC));
  assert.equal(p.arcLength_in, 45.864203);
  assert.equal(p.perimeter_in, r6(PERIMETER));
  assert.equal(p.perimeter_in, 153.864203);
  assert.equal(p.nominalSpacing_in, 30.772841);
  assert.ok(p.candidates.every((tab, i) => Math.abs(tab.arclength_in - r6(18 + i * SPACING)) < 1e-6));
});

test("golden coordinates of the equal-spacing candidate tabs for the reference aperture", () => {
  // Rule: tab i sits at s = 18 + (i − 1)·30.772841 and is mapped onto bottom → right side → arch → left side.
  const tabs = plan().candidates;
  // Tab 1: s = 18 is on the bottom (0 ≤ s < 36), x = −18 + 18 = 0, y = 0: the bottom center, on the split line.
  assert.deepEqual(pick(tabs[0]), { index: 1, arclength_in: 18, segment: "BOTTOM", curved: false, x_in: 0, y_in: 0 });
  // Tab 2: s = 48.772841 is on the right side (36 ≤ s < 72), x = 18, y = s − 36 = 12.772841.
  assert.deepEqual(pick(tabs[1]), { index: 2, arclength_in: 48.772841, segment: "RIGHT_SIDE", curved: false, x_in: 18, y_in: 12.772841 });
  // Tab 3: s = 79.545681 is 7.545681 in into the arch, angle atan2(7.5, 18) + 7.545681/19.5 → (13.838805, 42.238176).
  assert.deepEqual(pick(tabs[2]), { index: 3, arclength_in: 79.545681, segment: "ARCH", curved: true, x_in: 13.838805, y_in: 42.238176 });
  assertArchPoint(79.545681, tabs[2]);
  // Tab 4: s = 110.318522 mirrors tab 3 about the apex (apex at s = 72 + 45.864203/2 = 94.932101), so x flips sign.
  assert.deepEqual(pick(tabs[3]), { index: 4, arclength_in: 110.318522, segment: "ARCH", curved: true, x_in: -13.838805, y_in: 42.238176 });
  assertArchPoint(110.318522, tabs[3]);
  // Tab 5: s = 141.091362 is on the left side (s ≥ 117.864203), x = −18, y = 36 − (141.091362 − 117.864203) = 12.772841.
  assert.deepEqual(pick(tabs[4]), { index: 5, arclength_in: 141.091362, segment: "LEFT_SIDE", curved: false, x_in: -18, y_in: 12.772841 });
  // Distances to the nearest transition: 18 to s=0/36, 12.772841 to s=36/153.86, 7.545681 to s=72/117.86.
  assert.deepEqual(tabs.map((t) => t.distanceToNearestTransition_in), [18, 12.772841, 7.545681, 7.545681, 12.772841]);
});

test("a symmetric reference plan already holds each split half with two tabs, so nothing is added", () => {
  // Rule: a split keeps at least 2 tabs per half; tabs within 0.5 in of x = 0 count for neither half.
  const split = planSplitStencilTabs(plan(), geometry);
  assert.equal(split.split.leftPieceTabs, 2);
  assert.equal(split.split.rightPieceTabs, 2);
  assert.equal(split.split.tabsOnSplitLine, 1);
  assert.deepEqual(split.split.addedForSplit, []);
  assert.equal(split.plannedTabCount, 5);
});

test("a split whose right half has no tabs gets two added at the middle of its largest open stretch", () => {
  // Rule: missing tabs are added one at a time at the midpoint of the widest gap in that half's arclength span.
  const base = plan();
  // Keep the bottom-center tab and the two left-half tabs (renumbered 1..3), leaving the right half (s ∈ 18 → 94.932101) empty.
  const kept = [base.candidates[0], base.candidates[3], base.candidates[4]].map((tab, i) => ({ ...tab, index: i + 1 }));
  const result = planSplitStencilTabs({ ...base, candidates: kept }, geometry);
  const added = result.candidates.filter((tab) => tab.addedForSplit);
  // First: the right half is one open stretch 18 → 94.932101, middle s = 56.466051 on the right side, y = 56.466051 − 36.
  assert.deepEqual(pick(added[0]), { index: 4, arclength_in: 56.466051, segment: "RIGHT_SIDE", curved: false, x_in: 18, y_in: 20.466051 });
  // Second: the stretches 18 → 56.466051 and 56.466051 → 94.932101 tie at 38.466; the first wins, middle s = 37.233025, y = 1.233025.
  assert.deepEqual(pick(added[1]), { index: 5, arclength_in: 37.233025, segment: "RIGHT_SIDE", curved: false, x_in: 18, y_in: 1.233025 });
  assert.equal(added.length, 2);
  assert.deepEqual(result.split.addedForSplit, [4, 5]);
  assert.equal(result.split.rightPieceTabs, 2);
  assert.equal(result.split.leftPieceTabs, 2);
  assert.equal(result.plannedTabCount, 5);
});

test("a split whose left half has no tabs gets two added at the middle of its largest open stretch", () => {
  // Rule: the left half spans apex 94.932101 → bottom center one lap later, 153.864203 + 18 = 171.864203.
  const base = plan();
  const result = planSplitStencilTabs({ ...base, candidates: base.candidates.slice(0, 3) }, geometry);
  const added = result.candidates.filter((tab) => tab.addedForSplit);
  // First: middle of 94.932101 → 171.864203 is s = 133.398152 on the left side, y = 36 − (133.398152 − 117.864203) = 20.466051.
  assert.deepEqual(pick(added[0]), { index: 4, arclength_in: 133.398152, segment: "LEFT_SIDE", curved: false, x_in: -18, y_in: 20.466051 });
  // Second: 133.398152 → 171.864203 (38.466051) beats 94.932101 → 133.398152 (38.4660505) after rounding; middle s = 152.631178.
  assert.deepEqual(pick(added[1]), { index: 5, arclength_in: 152.631178, segment: "LEFT_SIDE", curved: false, x_in: -18, y_in: 1.233026 });
  assert.deepEqual(result.split.addedForSplit, [4, 5]);
  assert.equal(result.split.leftPieceTabs, 2);
  assert.equal(result.split.rightPieceTabs, 2);
});

function pick(tab) {
  const { index, arclength_in, segment, curved, x_in, y_in } = tab;
  return { index, arclength_in, segment, curved, x_in, y_in };
}
