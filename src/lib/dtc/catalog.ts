import type { CardDef, PackDef, Rarity } from "@/lib/dtc/types";

export const CARDS: CardDef[] = [
  { id: "nc-slip", name: "Unfiled Slip", set: "Night Desk", rarity: "chit", usd: 2.4, grade: "RAW", motif: "ledger", line: "A scrap that never made the blotter." },
  { id: "nc-stub", name: "Brass Stub", set: "Night Desk", rarity: "chit", usd: 3.1, grade: "RAW", motif: "ledger", line: "Torn from a book that closed at dawn." },
  { id: "nc-chit", name: "Clerk's Chit", set: "Night Desk", rarity: "chit", usd: 3.8, grade: "RAW", motif: "ledger", line: "Good for one quiet favor on the floor." },
  { id: "ash-dust", name: "Court Dust", set: "Ash Court", rarity: "chit", usd: 2.8, grade: "RAW", motif: "ash", line: "What the pit left when the bell died." },
  { id: "em-coal", name: "Coal Receipt", set: "Ember Vault", rarity: "chit", usd: 3.4, grade: "RAW", motif: "ember", line: "Proof something burned, not what." },
  { id: "nc-bid", name: "Quiet Bid", set: "Night Desk", rarity: "common", usd: 9, grade: "DTC 8", motif: "ledger", line: "A bid so soft the tape barely moved." },
  { id: "nc-margin", name: "Margin Scrap", set: "Night Desk", rarity: "common", usd: 11, grade: "DTC 7", motif: "ledger", line: "Collateral from a desk that blinked." },
  { id: "em-spark", name: "Spark Lot", set: "Ember Vault", rarity: "common", usd: 12, grade: "DTC 8", motif: "ember", line: "A lot number still warm at the edges." },
  { id: "ec-mask", name: "Paper Mask", set: "Eclipse Syndicate", rarity: "common", usd: 10, grade: "DTC 8", motif: "eclipse", line: "Worn once, then filed under nobody." },
  { id: "ash-chip", name: "Gavel Chip", set: "Ash Court", rarity: "common", usd: 13, grade: "DTC 8", motif: "ash", line: "Struck when the court still had a roof." },
  { id: "nc-fill", name: "Partial Fill", set: "Night Desk", rarity: "common", usd: 8.5, grade: "DTC 7", motif: "ledger", line: "Half a promise, stamped anyway." },
  { id: "nc-warrant", name: "After-Hours Warrant", set: "Night Desk", rarity: "uncommon", usd: 28, grade: "DTC 9", motif: "ledger", line: "Executable only while the city is dark." },
  { id: "em-note", name: "Furnace Note", set: "Ember Vault", rarity: "uncommon", usd: 34, grade: "DTC 9", motif: "ember", line: "Bears interest in heat, paid in silence." },
  { id: "ec-umbra", name: "Umbra Option", set: "Eclipse Syndicate", rarity: "uncommon", usd: 32, grade: "DTC 9", motif: "eclipse", line: "The right to disappear from a print." },
  { id: "ash-warrant", name: "Ash Warrant", set: "Ash Court", rarity: "uncommon", usd: 26, grade: "DTC 8", motif: "ash", line: "A claim on a building that is mostly smoke." },
  { id: "em-cinder", name: "Cinder Certificate", set: "Ember Vault", rarity: "uncommon", usd: 40, grade: "DTC 9", motif: "ember", line: "Graded while the wax was still soft." },
  { id: "ec-ring", name: "Syndicate Ring Copy", set: "Eclipse Syndicate", rarity: "uncommon", usd: 38, grade: "DTC 9", motif: "eclipse", line: "Not the ring. The impression it left." },
  { id: "nc-redact", name: "Redacted Fill", set: "Night Desk", rarity: "rare", usd: 86, grade: "DTC 10", motif: "ledger", line: "The name is gone. The size is not." },
  { id: "em-crown", name: "Ember Crown Stub", set: "Ember Vault", rarity: "rare", usd: 110, grade: "DTC 10", motif: "ember", line: "A crown reduced to a tradable stub." },
  { id: "ec-moon", name: "New Moon Warrant", set: "Eclipse Syndicate", rarity: "rare", usd: 128, grade: "DTC 10", motif: "eclipse", line: "Settles only when no one is watching." },
  { id: "ash-pit", name: "Ruined Pit Token", set: "Ash Court", rarity: "rare", usd: 96, grade: "DTC 9", motif: "ash", line: "Admission to an exchange that no longer opens." },
  { id: "nc-seal", name: "The Unbroken Seal", set: "Night Desk", rarity: "rare", usd: 150, grade: "DTC 10", motif: "ledger", line: "Never cracked. Still worth opening." },
  { id: "ec-principal", name: "Masked Principal", set: "Eclipse Syndicate", rarity: "mythic", usd: 280, grade: "DTC 10", motif: "eclipse", line: "The desk's favorite ghost. Still signs." },
  { id: "em-bell", name: "The Last Bell", set: "Ember Vault", rarity: "mythic", usd: 420, grade: "DTC 10", motif: "ember", line: "Rung once. The tape has not recovered." },
  { id: "ash-closed", name: "The Closed Exchange", set: "Ash Court", rarity: "mythic", usd: 360, grade: "DTC 10", motif: "ash", line: "A whole floor, slabbed and numbered." },
  { id: "nc-key", name: "Key of Ledger Lane", set: "Night Desk", rarity: "mythic", usd: 240, grade: "DTC 10", motif: "ledger", line: "Opens a drawer that should not exist." },
  { id: "relic-book", name: "Founder's Black Book", set: "House Relics", rarity: "relic", usd: 1400, grade: "DTC PRISTINE", motif: "ledger", line: "Every desk loss, written in the founder's hand." },
  { id: "relic-candle", name: "Hour Candle", set: "House Relics", rarity: "relic", usd: 2200, grade: "DTC PRISTINE", motif: "ember", line: "Burns for one trading hour and never shorter." },
  { id: "relic-desk", name: "The Night Desk", set: "House Relics", rarity: "relic", usd: 4800, grade: "DTC PRISTINE", motif: "eclipse", line: "The original blotter. The company is named for what happened on it." },
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
    name: "Night Clerk",
    price: 10,
    buybackRate: 0.9,
    buybackDays: 3,
    press: "House Press",
    theme: "Night",
    tagline: "Practice slips and the occasional warrant. The door into the desk.",
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
    name: "Brass",
    price: 25,
    buybackRate: 0.88,
    buybackDays: 7,
    press: "House Press",
    theme: "Night",
    tagline: "The working machine. Most nights pay the blotter. Some nights don't.",
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
    name: "Ember Vault",
    price: 50,
    buybackRate: 0.88,
    buybackDays: 7,
    press: "Night Vault",
    theme: "Ember",
    tagline: "Heat-sealed instruments. The Last Bell lives in this pool.",
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
    name: "Black Ledger",
    price: 100,
    buybackRate: 0.85,
    buybackDays: 7,
    press: "Night Vault",
    theme: "Eclipse",
    tagline: "House exclusive. Worse buyback, louder chase. The syndicate prints here.",
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
    name: "Reliquary",
    price: 250,
    buybackRate: 0.92,
    buybackDays: 7,
    press: "Night Vault",
    theme: "Relics",
    tagline: "The grail machine. The Night Desk itself is in the pool. Buyback is kinder.",
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
  chit: "Chit",
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  mythic: "Mythic",
  relic: "Relic",
};

export const THEMES = ["All", "Night", "Ember", "Eclipse", "Relics"] as const;
export type ThemeFilter = (typeof THEMES)[number];
