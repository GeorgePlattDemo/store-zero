// An alcove insert expressed as neutral cut packages: four uprights, shelves made of strips laid across the depth,
// and the pins-and-screws kit as a functional requirement. Store knows nothing about alcoves.
//
// The shelf layout is the user's choice, not the yard's. The same depth can be reached many ways from the widths on
// offer: whole boards that land a little over or under it, or boards brought to an exact width by an edge mill or a
// rip. Each layout is its own definition and gets its own answer. System shows them against the user's acceptance
// criteria and the user chooses. `shelfStrips` names a layout: one entry per strip across the depth, each a nominal
// width and, when the strip is brought to width, its finished width. Without it, the layout is 1x6 strips with the
// last one brought to width, which is one layout among many, used as the default in these tests.
const SHELF_ELEVATIONS = [12, 24, 36, 45, 65];
const ACTUAL_WIDTH_IN = { 2: 1.5, 3: 2.5, 4: 3.5, 6: 5.5, 8: 7.25, 10: 9.25, 12: 11.25 };

export function stripsToDepth(depth, nominalW = 6) {
  const width = ACTUAL_WIDTH_IN[nominalW];
  const full = Math.floor(depth / width + 1e-9);
  const last = Math.round((depth - full * width) * 1e6) / 1e6;
  return [...Array.from({ length: full }, () => ({ nominalW })), ...(last > 1e-9 ? [{ nominalW, finishedWidthIn: last }] : [])];
}

export function shelfDepthIn(shelfStrips) {
  return Math.round(shelfStrips.reduce((sum, s) => sum + (s.finishedWidthIn ?? ACTUAL_WIDTH_IN[s.nominalW]), 0) * 1e6) / 1e6;
}

export function alcoveCutPackages({
  species = "pine",
  grade = "select",
  height = 65,
  depth = 14,
  span = 44,
  shelfCount = 5,
  shelfStrips = stripsToDepth(depth),
  upright = {},
  configurationVersion = "1"
} = {}) {
  const material = (nominalW) => ({ species, form: "board", nominalT: 1, nominalW, grade });
  const spots = upright.inset
    ? SHELF_ELEVATIONS.slice(0, shelfCount).map((xIn, i) => ({ featureId: `SHELF-${i + 1}`, xIn: upright.xIn ?? xIn, acrossWidthRule: "INSET_FROM_EDGE", insetFromEdgeIn: upright.inset }))
    : [];
  const parts = (prefix, n, lengthIn, withSpots = []) =>
    Array.from({ length: n }, (_, i) => ({ partId: `${prefix}-${String(i + 1).padStart(2, "0")}`, lengthIn, spots: withSpots.map((s) => ({ ...s, featureId: `${prefix}-${i + 1}-${s.featureId}` })) }));
  // One package per kind of strip: the same nominal width, brought to the same finished width or left as it is.
  const kinds = new Map();
  for (const strip of shelfStrips) {
    const packageId = `SHELF-1X${strip.nominalW}${strip.finishedWidthIn ? `-TO-${strip.finishedWidthIn}` : ""}`;
    kinds.set(packageId, { ...strip, perShelf: (kinds.get(packageId)?.perShelf ?? 0) + 1 });
  }
  const cutPackages = [
    { packageId: "UPRIGHTS", material: material(6), endCut: { angleDeg: 0 }, parts: parts("UPRIGHT", 4, height, spots) },
    ...[...kinds].map(([packageId, k]) => ({
      packageId,
      material: material(k.nominalW),
      endCut: { angleDeg: 0 },
      ...(k.finishedWidthIn ? { finishedWidthIn: k.finishedWidthIn } : {}),
      parts: parts(packageId, shelfCount * k.perShelf, span)
    }))
  ];
  return {
    configurationId: "ALCOVE-INSERT",
    configurationVersion,
    cutPackages,
    itemLines: [{ lineId: "PINS-AND-SCREWS", qty: 1, requirementId: "ALCOVE-PINS-AND-SCREWS" }]
  };
}
