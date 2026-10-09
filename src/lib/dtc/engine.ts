import { getCard, getPack } from "@/lib/dtc/catalog";
import type { CardDef, PackDef, Rarity } from "@/lib/dtc/types";

export function money(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function compactAge(at: number, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - at) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function shortKey(key: string): string {
  if (key.length < 10) return key;
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function randomSeed(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(buf));
}

function mix(seed: string, offset: number): number {
  const slice = seed.slice(offset, offset + 8).padEnd(8, "0");
  return parseInt(slice, 16) >>> 0;
}

export function rollCard(pack: PackDef, seed: string): CardDef {
  const ticket = mix(seed, 0) % 10000;
  let cursor = 0;
  let rarity: Rarity = pack.odds[0]?.rarity ?? "chit";
  for (const row of pack.odds) {
    cursor += row.bps;
    if (ticket < cursor) {
      rarity = row.rarity;
      break;
    }
  }
  const pool = poolFor(pack, rarity);
  const cardId = pool[mix(seed, 8) % pool.length] ?? pool[0];
  if (!cardId) throw new Error(`Empty pool on ${pack.id}`);
  return getCard(cardId);
}

function poolFor(pack: PackDef, rarity: Rarity): string[] {
  const direct = pack.pools[rarity];
  if (direct && direct.length > 0) return direct;
  for (const row of [...pack.odds].reverse()) {
    const fallback = pack.pools[row.rarity];
    if (fallback && fallback.length > 0) return fallback;
  }
  return [];
}

export function expectedValue(pack: PackDef): number {
  let ev = 0;
  for (const row of pack.odds) {
    const pool = pack.pools[row.rarity] ?? [];
    if (pool.length === 0) continue;
    const avg = pool.reduce((sum, id) => sum + getCard(id).usd, 0) / pool.length;
    ev += (row.bps / 10000) * avg;
  }
  return ev;
}

export function topSlab(pack: PackDef): CardDef {
  const ids = Object.values(pack.pools).flatMap((pool) => pool ?? []);
  let best = getCard(ids[0] ?? "nc-slip");
  for (const id of ids) {
    const card = getCard(id);
    if (card.usd > best.usd) best = card;
  }
  return best;
}

export function buybackQuote(packId: string | null, cardId: string, pulledAt: number, now = Date.now()): number | null {
  if (!packId) return null;
  const pack = getPack(packId);
  if (!pack) return null;
  const windowMs = pack.buybackDays * 24 * 60 * 60 * 1000;
  if (now - pulledAt > windowMs) return null;
  return round2(getCard(cardId).usd * pack.buybackRate);
}

export function gainPct(indexed: number, spent: number): number {
  if (spent <= 0) return 0;
  return ((indexed - spent) / spent) * 100;
}

export async function verifyPull(seed: string, commitment: string, packId: string, cardId: string): Promise<boolean> {
  const pack = getPack(packId);
  if (!pack) return false;
  const hash = await sha256Hex(seed);
  if (hash !== commitment) return false;
  return rollCard(pack, seed).id === cardId;
}
