import type { CardDef, PackDef, Rarity } from "@/lib/dtc/types";

export const CARDS: CardDef[] = [
  { id: "nc-slip", name: "Rose Quartz", set: "Pebble Tray", rarity: "chit", usd: 2.4, grade: "TUMBLED", motif: "ledger", line: "A real pink quartz pebble. Soft color, harder than glass." },
  { id: "nc-stub", name: "Smoky Quartz", set: "Pebble Tray", rarity: "chit", usd: 3.1, grade: "CHIP", motif: "ledger", line: "Brown quartz from heat and radiation in the rock, not dye." },
  { id: "nc-chit", name: "Red Jasper", set: "Pebble Tray", rarity: "chit", usd: 3.8, grade: "TUMBLED", motif: "ledger", line: "An opaque quartz pebble. Iron gives it the red." },
  { id: "ash-dust", name: "Basalt Chip", set: "River Rock", rarity: "chit", usd: 2.8, grade: "CHIP", motif: "ash", line: "Cooled lava, fine-grained and heavy for its size." },
  { id: "em-coal", name: "Obsidian Flake", set: "Geode Shelf", rarity: "chit", usd: 3.4, grade: "FLAKE", motif: "ember", line: "Volcanic glass. Edges stay sharp." },
  { id: "nc-bid", name: "Amethyst Point", set: "Pebble Tray", rarity: "common", usd: 9, grade: "POINT", motif: "ledger", line: "Purple quartz. The color is iron in the crystal." },
  { id: "nc-margin", name: "Citrine Point", set: "Pebble Tray", rarity: "common", usd: 11, grade: "POINT", motif: "ledger", line: "Yellow quartz. A real point, not a painted one." },
  { id: "em-spark", name: "Tiger's Eye", set: "Geode Shelf", rarity: "common", usd: 12, grade: "CAB", motif: "ember", line: "Quartz that replaced crocidolite. The bands chatoy." },
  { id: "ec-mask", name: "Fluorite Cube", set: "Cabinet Row", rarity: "common", usd: 10, grade: "CUBE", motif: "eclipse", line: "A real cube from the mineral's own cleavage." },
  { id: "ash-chip", name: "Pyrite Cube", set: "River Rock", rarity: "common", usd: 13, grade: "CUBE", motif: "ash", line: "Iron sulfide. Fool's gold, and a real crystal." },
  { id: "nc-fill", name: "Hematite", set: "Pebble Tray", rarity: "common", usd: 8.5, grade: "NUGGET", motif: "ledger", line: "Iron oxide. Metallic, dense, and streaked red." },
  { id: "nc-warrant", name: "Quartz Geode", set: "Pebble Tray", rarity: "uncommon", usd: 28, grade: "HALF", motif: "ledger", line: "A split nodule lined with real quartz crystals." },
  { id: "em-note", name: "Labradorite", set: "Geode Shelf", rarity: "uncommon", usd: 34, grade: "SLAB", motif: "ember", line: "Feldspar that flashes blue when the light turns." },
  { id: "ec-umbra", name: "Malachite", set: "Cabinet Row", rarity: "uncommon", usd: 32, grade: "BAND", motif: "eclipse", line: "Copper carbonate. The green bands are the crystal habit." },
  { id: "ash-warrant", name: "Selenite", set: "River Rock", rarity: "uncommon", usd: 26, grade: "PLATE", motif: "ash", line: "Clear gypsum. One good bend and it splits into sheets." },
  { id: "em-cinder", name: "Aquamarine", set: "Geode Shelf", rarity: "uncommon", usd: 40, grade: "CRYSTAL", motif: "ember", line: "Blue beryl. A real crystal, not a bead." },
  { id: "ec-ring", name: "Lapis Lazuli", set: "Cabinet Row", rarity: "uncommon", usd: 38, grade: "CHUNK", motif: "eclipse", line: "A rock of lazurite, calcite, and pyrite." },
  { id: "nc-redact", name: "Herkimer Quartz", set: "Pebble Tray", rarity: "rare", usd: 86, grade: "POINT", motif: "ledger", line: "A double-terminated quartz from Herkimer County." },
  { id: "em-crown", name: "Tourmaline", set: "Geode Shelf", rarity: "rare", usd: 110, grade: "CRYSTAL", motif: "ember", line: "A striated crystal. The color runs the length of it." },
  { id: "ec-moon", name: "Garnet Cluster", set: "Cabinet Row", rarity: "rare", usd: 128, grade: "CLUSTER", motif: "eclipse", line: "Dodecahedral garnets sitting on the host rock." },
  { id: "ash-pit", name: "Azurite", set: "River Rock", rarity: "rare", usd: 96, grade: "CLUSTER", motif: "ash", line: "Deep blue copper carbonate. It dulls if you soak it." },
  { id: "nc-seal", name: "Opal", set: "Pebble Tray", rarity: "rare", usd: 150, grade: "CHIP", motif: "ledger", line: "Hydrated silica. The fire is diffraction, not paint." },
  { id: "ec-principal", name: "Elbaite", set: "Cabinet Row", rarity: "mythic", usd: 280, grade: "CRYSTAL", motif: "eclipse", line: "The gem tourmaline. A cabinet crystal, not a chip." },
  { id: "em-bell", name: "Boulder Opal", set: "Geode Shelf", rarity: "mythic", usd: 420, grade: "SPECIMEN", motif: "ember", line: "Opal still on the ironstone it grew in." },
  { id: "ash-closed", name: "Vanadinite", set: "River Rock", rarity: "mythic", usd: 360, grade: "CLUSTER", motif: "ash", line: "Red hexagonal crystals on matrix. Lead vanadate." },
  { id: "nc-key", name: "Topaz", set: "Pebble Tray", rarity: "mythic", usd: 240, grade: "CRYSTAL", motif: "ledger", line: "A terminated topaz. Harder than quartz." },
  { id: "relic-book", name: "Amethyst Cathedral", set: "The Vein", rarity: "relic", usd: 1400, grade: "CABINET", motif: "ledger", line: "A standing geode. This tier is a real crystal when claims open." },
  { id: "relic-candle", name: "Quartz Cathedral", set: "The Vein", rarity: "relic", usd: 2200, grade: "CABINET", motif: "ember", line: "A tall clear quartz cluster. The vein prize, not a picture of one." },
  { id: "relic-desk", name: "Mineral Cabinet", set: "The Vein", rarity: "relic", usd: 4800, grade: "CABINET", motif: "eclipse", line: "The grail pull. A real cabinet specimen when the desk ships claims." },
];

const byId = new Map(CARDS.map((card) => [card.id, card]));

export function getCard(id: string): CardDef {
  const card = byId.get(id);
  if (!card) throw new Error(`Unknown slab ${id}`);
  return card;
}

export const PACKS: PackDef[] = [
  {
    id: "night-clerk",
    name: "Pebble Sack",
    price: 10,
    buybackRate: 0.9,
    buybackDays: 3,
    press: "House Press",
    theme: "Night",
    tagline: "Tumbled pebbles, and once in a while a real point. The first sack.",
    odds: [
      { rarity: "chit", bps: 7200 },
      { rarity: "common", bps: 2000 },
      { rarity: "uncommon", bps: 600 },
      { rarity: "rare", bps: 160 },
      { rarity: "mythic", bps: 40 },
    ],
    pools: {
      chit: ["nc-slip", "nc-stub", "ash-dust"],
      common: ["nc-fill", "nc-bid", "nc-margin"],
      uncommon: ["nc-warrant"],
      rare: ["nc-redact"],
      mythic: ["nc-key"],
    },
  },
  {
    id: "brass",
    name: "Rock Shop",
    price: 25,
    buybackRate: 0.88,
    buybackDays: 7,
    press: "House Press",
    theme: "Night",
    tagline: "The everyday sack. Mostly stones. A crystal hides in the odds.",
    odds: [
      { rarity: "chit", bps: 2410 },
      { rarity: "common", bps: 5000 },
      { rarity: "uncommon", bps: 2000 },
      { rarity: "rare", bps: 500 },
      { rarity: "mythic", bps: 80 },
      { rarity: "relic", bps: 10 },
    ],
    pools: {
      chit: ["nc-slip", "nc-stub", "nc-chit", "ash-dust", "em-coal"],
      common: ["nc-bid", "nc-margin", "em-spark", "ec-mask", "ash-chip", "nc-fill"],
      uncommon: ["nc-warrant", "ash-warrant", "ec-umbra"],
      rare: ["nc-redact", "ash-pit", "em-crown"],
      mythic: ["nc-key", "ec-principal"],
      relic: ["relic-book"],
    },
  },
  {
    id: "ember",
    name: "Geode Crack",
    price: 50,
    buybackRate: 0.88,
    buybackDays: 7,
    press: "Night Vault",
    theme: "Ember",
    tagline: "Crack a geode. Boulder opal lives in this pool.",
    odds: [
      { rarity: "chit", bps: 1580 },
      { rarity: "common", bps: 5000 },
      { rarity: "uncommon", bps: 2200 },
      { rarity: "rare", bps: 900 },
      { rarity: "mythic", bps: 280 },
      { rarity: "relic", bps: 40 },
    ],
    pools: {
      chit: ["em-coal", "nc-stub"],
      common: ["em-spark", "ash-chip", "nc-margin", "ec-mask"],
      uncommon: ["em-note", "em-cinder"],
      rare: ["em-crown", "ash-pit"],
      mythic: ["em-bell"],
      relic: ["relic-candle"],
    },
  },
  {
    id: "black-ledger",
    name: "The Cabinet",
    price: 100,
    buybackRate: 0.85,
    buybackDays: 7,
    press: "Night Vault",
    theme: "Eclipse",
    tagline: "Cabinet specimens. Worse buyback, better crystals.",
    odds: [
      { rarity: "chit", bps: 800 },
      { rarity: "common", bps: 3600 },
      { rarity: "uncommon", bps: 3200 },
      { rarity: "rare", bps: 1600 },
      { rarity: "mythic", bps: 650 },
      { rarity: "relic", bps: 150 },
    ],
    pools: {
      chit: ["nc-chit", "nc-slip"],
      common: ["nc-bid", "nc-margin", "em-spark", "ec-mask", "ash-chip", "nc-fill"],
      uncommon: ["ec-ring", "em-cinder", "em-note", "ec-umbra"],
      rare: ["nc-seal", "ec-moon", "em-crown", "nc-redact"],
      mythic: ["ec-principal", "em-bell", "ash-closed", "nc-key"],
      relic: ["relic-book", "relic-candle"],
    },
  },
  {
    id: "reliquary",
    name: "The Vein",
    price: 250,
    buybackRate: 0.92,
    buybackDays: 7,
    press: "Night Vault",
    theme: "Relics",
    tagline: "The grail sack. A vein win is a real crystal when claims open.",
    odds: [
      { rarity: "chit", bps: 400 },
      { rarity: "common", bps: 2000 },
      { rarity: "uncommon", bps: 3000 },
      { rarity: "rare", bps: 2800 },
      { rarity: "mythic", bps: 1400 },
      { rarity: "relic", bps: 400 },
    ],
    pools: {
      chit: ["em-coal", "nc-chit"],
      common: ["ash-chip", "em-spark", "nc-margin"],
      uncommon: ["nc-warrant", "em-note", "ec-umbra", "ash-warrant", "em-cinder", "ec-ring"],
      rare: ["nc-redact", "em-crown", "ec-moon", "ash-pit", "nc-seal"],
      mythic: ["ec-principal", "em-bell", "ash-closed", "nc-key"],
      relic: ["relic-book", "relic-candle", "relic-desk"],
    },
  },
];

const packById = new Map(PACKS.map((pack) => [pack.id, pack]));

export function getPack(id: string): PackDef | undefined {
  return packById.get(id);
}

export const RARITY_LABEL: Record<Rarity, string> = {
  chit: "Pebble",
  common: "Stone",
  uncommon: "Crystal",
  rare: "Cluster",
  mythic: "Cabinet",
  relic: "Vein",
};

export const THEMES = ["All", "Night", "Ember", "Eclipse", "Relics"] as const;
export type ThemeFilter = (typeof THEMES)[number];
