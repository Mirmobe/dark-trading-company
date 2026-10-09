export type Rarity = "chit" | "common" | "uncommon" | "rare" | "mythic" | "relic";

export type Motif = "ledger" | "ember" | "eclipse" | "ash";

export type CardDef = {
  id: string;
  name: string;
  set: string;
  rarity: Rarity;
  usd: number;
  grade: string;
  motif: Motif;
  line: string;
};

export type OddsRow = {
  rarity: Rarity;
  bps: number;
};

export type PackDef = {
  id: string;
  name: string;
  price: number;
  buybackRate: number;
  buybackDays: number;
  press: string;
  theme: "Night" | "Ember" | "Eclipse" | "Relics";
  tagline: string;
  odds: OddsRow[];
  pools: Partial<Record<Rarity, string[]>>;
};

export type PullSource = "pull" | "pit";

export type OwnedSlab = {
  id: string;
  cardId: string;
  packId: string | null;
  seed: string | null;
  commitment: string | null;
  signature: string | null;
  pulledAt: number;
  packPrice: number | null;
  status: "vault" | "listed" | "redeemed";
  source: PullSource;
  ticket: string | null;
};

export type Listing = {
  id: string;
  cardId: string;
  price: number;
  seller: string;
  ownedId?: string;
  house: boolean;
};

export type FeedItem = {
  id: string;
  who: string;
  cardId: string;
  packId: string;
  at: number;
};

export type Opening = {
  packId: string;
  pullIds: string[];
  stage: "sealed" | "open";
};

export type WalletLink = {
  publicKey: string;
  name: "Phantom";
};
