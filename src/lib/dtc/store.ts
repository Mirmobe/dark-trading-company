import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getCard, getPack } from "@/lib/dtc/catalog";
import { buybackQuote, randomSeed, rollCard, round2, sha256Hex, toHex } from "@/lib/dtc/engine";
import type { FeedItem, Listing, Opening, OwnedSlab, WalletLink } from "@/lib/dtc/types";
import { getPhantom } from "@/lib/dtc/wallet";

const HOUR = 60 * 60 * 1000;
const now = Date.now();

const seedFeed: FeedItem[] = [
  { id: "tape-1", who: "cinder", cardId: "em-bell", packId: "ember", at: now - 8 * 60000 },
  { id: "tape-2", who: "umbra", cardId: "nc-chit", packId: "night-clerk", at: now - 14 * 60000 },
  { id: "tape-3", who: "pit ghost", cardId: "ec-principal", packId: "black-ledger", at: now - 26 * 60000 },
  { id: "tape-4", who: "afterbell", cardId: "nc-fill", packId: "brass", at: now - 41 * 60000 },
  { id: "tape-5", who: "marrow", cardId: "relic-book", packId: "black-ledger", at: now - 2 * HOUR },
  { id: "tape-6", who: "lane desk", cardId: "ash-warrant", packId: "brass", at: now - 3 * HOUR },
  { id: "tape-7", who: "cinder", cardId: "em-crown", packId: "ember", at: now - 5 * HOUR },
  { id: "tape-8", who: "umbra", cardId: "nc-seal", packId: "reliquary", at: now - 8 * HOUR },
];

const seedListings: Listing[] = [
  { id: "m-1", cardId: "ec-moon", price: 134, seller: "umbra", house: true },
  { id: "m-2", cardId: "em-note", price: 33, seller: "cinder", house: true },
  { id: "m-3", cardId: "nc-seal", price: 158, seller: "lane desk", house: true },
  { id: "m-4", cardId: "ash-closed", price: 372, seller: "pit ghost", house: true },
  { id: "m-5", cardId: "nc-warrant", price: 26, seller: "afterbell", house: true },
  { id: "m-6", cardId: "em-bell", price: 455, seller: "cinder", house: true },
  { id: "m-7", cardId: "relic-book", price: 1490, seller: "marrow", house: true },
  { id: "m-8", cardId: "ec-ring", price: 36, seller: "umbra", house: true },
];

type DeskData = {
  usdc: number;
  sol: number;
  inventory: OwnedSlab[];
  listings: Listing[];
  feed: FeedItem[];
  opened: number;
  volume: number;
  opening: Opening | null;
  wallet: WalletLink | null;
  notice: string | null;
};

const fresh = (): DeskData => ({
  usdc: 500,
  sol: 0.85,
  inventory: [],
  listings: seedListings,
  feed: seedFeed,
  opened: 0,
  volume: 0,
  opening: null,
  wallet: null,
  notice: null,
});

type DeskActions = {
  hydrate: () => void;
  clearNotice: () => void;
  faucet: () => void;
  reset: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  openPack: (packId: string, qty: number) => Promise<boolean>;
  showOpening: () => void;
  dismissOpening: () => void;
  buyback: (ownedId: string) => void;
  listSlab: (ownedId: string, price: number) => void;
  cancelListing: (listingId: string) => void;
  buyListing: (listingId: string) => void;
  redeem: (ownedId: string) => void;
};

export const useDesk = create<DeskData & DeskActions>()(
  persist(
    (set, get) => ({
      ...fresh(),
      hydrate: () => {
        void useDesk.persist.rehydrate();
      },
      clearNotice: () => set({ notice: null }),
      faucet: () => set((s) => ({ sol: round2(s.sol + 0.25), notice: "Desk faucet dropped 0.25 paper SOL." })),
      reset: () => {
        const wallet = get().wallet;
        set({ ...fresh(), wallet, notice: "Desk cleared. 500 paper USDC is back on the blotter." });
      },
      connectWallet: async () => {
        const phantom = getPhantom();
        if (!phantom) {
          set({
            notice: "Phantom is not in this browser. The paper desk still opens packs. Install Phantom to sign commits.",
          });
          return;
        }
        try {
          const res = await phantom.connect();
          set({
            wallet: { publicKey: res.publicKey.toString(), name: "Phantom" },
            notice: "Phantom linked. The next seal can be signed. No SOL is spent.",
          });
        } catch {
          set({ notice: "Phantom closed the connect request." });
        }
      },
      disconnectWallet: async () => {
        try {
          await getPhantom()?.disconnect();
        } catch {
          /* already gone */
        }
        set({ wallet: null, notice: "Wallet unlinked." });
      },
      openPack: async (packId, qty) => {
        const pack = getPack(packId);
        if (!pack) {
          set({ notice: "That machine is not on the floor." });
          return false;
        }
        if (get().opening) {
          set({ notice: "Finish the seal that is already open." });
          return false;
        }
        const cost = round2(pack.price * qty);
        const fee = 0.000005 * qty;
        const state = get();
        if (state.usdc + 1e-9 < cost) {
          set({ notice: `Need ${cost.toFixed(2)} paper USDC. The blotter has ${state.usdc.toFixed(2)}.` });
          return false;
        }
        if (state.sol < fee) {
          set({ notice: "Paper SOL is too thin for the network fee. Hit the desk faucet." });
          return false;
        }

        const made: OwnedSlab[] = [];
        const commits: string[] = [];
        for (let i = 0; i < qty; i += 1) {
          const seed = randomSeed();
          const commitment = await sha256Hex(seed);
          commits.push(commitment);
          const card = rollCard(pack, seed);
          made.push({
            id: `pull-${seed.slice(0, 10)}-${i}`,
            cardId: card.id,
            packId: pack.id,
            seed,
            commitment,
            signature: null,
            pulledAt: Date.now(),
            packPrice: pack.price,
            status: "vault",
            source: "pull",
            ticket: null,
          });
        }

        let signature: string | null = null;
        const phantom = getPhantom();
        if (state.wallet && phantom?.signMessage) {
          try {
            const message = new TextEncoder().encode(
              `Dark Trading Company\ncommits:\n${commits.join("\n")}\nNo transfer. Witness only.`,
            );
            const signed = await phantom.signMessage(message, "utf8");
            signature = toHex(signed.signature);
          } catch {
            signature = null;
          }
        }
        if (signature) {
          for (const pull of made) pull.signature = signature;
        }

        set((s) => ({
          usdc: round2(s.usdc - cost),
          sol: s.sol - fee,
          opened: s.opened + qty,
          volume: round2(s.volume + cost),
          inventory: [...made, ...s.inventory],
          feed: [
            ...made.map((pull) => ({
              id: pull.id,
              who: "you",
              cardId: pull.cardId,
              packId: pack.id,
              at: pull.pulledAt,
            })),
            ...s.feed,
          ].slice(0, 48),
          opening: { packId: pack.id, pullIds: made.map((pull) => pull.id), stage: "sealed" },
          notice: signature
            ? "Commit signed in Phantom. The card was already fixed."
            : s.wallet
              ? "Seal locked locally. Phantom did not sign this one."
              : null,
        }));
        return true;
      },
      showOpening: () =>
        set((s) => (s.opening ? { opening: { ...s.opening, stage: "open" } } : {})),
      dismissOpening: () => set({ opening: null }),
      buyback: (ownedId) => {
        const slab = get().inventory.find((item) => item.id === ownedId);
        if (!slab || slab.status !== "vault" || slab.source !== "pull" || !slab.packId) {
          set({ notice: "Only a fresh pull still inside the window can be sold back." });
          return;
        }
        const quote = buybackQuote(slab.packId, slab.cardId, slab.pulledAt);
        if (quote == null) {
          set({ notice: "The buyback window on that slab is closed." });
          return;
        }
        set((s) => ({
          usdc: round2(s.usdc + quote),
          inventory: s.inventory.filter((item) => item.id !== ownedId),
          notice: `Bought back for ${quote.toFixed(2)} paper USDC.`,
        }));
      },
      listSlab: (ownedId, price) => {
        const clean = round2(price);
        if (!Number.isFinite(clean) || clean < 1) {
          set({ notice: "List at 1 USDC or more." });
          return;
        }
        const slab = get().inventory.find((item) => item.id === ownedId);
        if (!slab || slab.status !== "vault") {
          set({ notice: "That slab is not free to list." });
          return;
        }
        const card = getCard(slab.cardId);
        set((s) => ({
          inventory: s.inventory.map((item) =>
            item.id === ownedId ? { ...item, status: "listed" } : item,
          ),
          listings: [
            {
              id: `ask-${ownedId}`,
              cardId: card.id,
              price: clean,
              seller: "you",
              ownedId,
              house: false,
            },
            ...s.listings.filter((listing) => listing.ownedId !== ownedId),
          ],
          notice: `${card.name} is in the pit at ${clean.toFixed(2)} USDC.`,
        }));
      },
      cancelListing: (listingId) => {
        const listing = get().listings.find((item) => item.id === listingId);
        if (!listing?.ownedId) return;
        set((s) => ({
          listings: s.listings.filter((item) => item.id !== listingId),
          inventory: s.inventory.map((item) =>
            item.id === listing.ownedId ? { ...item, status: "vault" } : item,
          ),
          notice: "Ask pulled. The slab is back in the vault.",
        }));
      },
      buyListing: (listingId) => {
        const listing = get().listings.find((item) => item.id === listingId);
        if (!listing || !listing.house) {
          set({ notice: "That ask is yours. Cancel it from the vault." });
          return;
        }
        if (get().usdc + 1e-9 < listing.price) {
          set({ notice: "Not enough paper USDC for that ask." });
          return;
        }
        const bought: OwnedSlab = {
          id: `pit-${listing.id}-${Date.now().toString(36)}`,
          cardId: listing.cardId,
          packId: null,
          seed: null,
          commitment: null,
          signature: null,
          pulledAt: Date.now(),
          packPrice: null,
          status: "vault",
          source: "pit",
          ticket: null,
        };
        set((s) => ({
          usdc: round2(s.usdc - listing.price),
          listings: s.listings.filter((item) => item.id !== listingId),
          inventory: [bought, ...s.inventory],
          notice: `Took ${getCard(listing.cardId).name} off the pit.`,
        }));
      },
      redeem: (ownedId) => {
        const slab = get().inventory.find((item) => item.id === ownedId);
        if (!slab || slab.status !== "vault") {
          set({ notice: "Only a vaulted slab can be ticketed." });
          return;
        }
        const ticket = `DTC-${slab.id.slice(-6).toUpperCase()}`;
        set((s) => ({
          inventory: s.inventory.map((item) =>
            item.id === ownedId ? { ...item, status: "redeemed", ticket } : item,
          ),
          notice: `Vault ticket ${ticket} cut. Demo only — nothing ships.`,
        }));
      },
    }),
    {
      name: "dtc-desk-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        usdc: state.usdc,
        sol: state.sol,
        inventory: state.inventory,
        listings: state.listings,
        feed: state.feed,
        opened: state.opened,
        volume: state.volume,
      }),
    },
  ),
);
