# Dark Trading Company

A Solana pack desk for **original** vault slabs. Open a machine, lock a commit, flip the card, then hold it, sell it back, or list it in the pit.

Not affiliated with Jupiter or any trading-card company. The slabs are fiction. The blotter is paper USDC in your browser — nothing is charged and nothing ships.

## The night shift

| Machine | Price | Buyback | Window |
| --- | --- | --- | --- |
| Night Clerk | 10 USDC | 90% | 3 days |
| Brass | 25 USDC | 88% | 7 days |
| Ember Vault | 50 USDC | 88% | 7 days |
| Black Ledger | 100 USDC | 85% | 7 days |
| Reliquary | 250 USDC | 92% | 7 days |

Odds and index expected value are printed on every machine before you pay. The house edge is not a secret.

## How a pull is fixed

1. The desk draws a 32-byte seed and shows `SHA-256(seed)` before the flip.
2. Rarity is `seed[0..4] % 10000` walked across the published basis points.
3. The card inside that tier is `seed[4..8] % pool`.
4. After the flip you can recompute both steps. They have to match.
5. If Phantom is installed, it may **sign** the commit. That signature witnesses the seal. It does not choose the card and it does not move SOL.

A live chain program would lock the same walk in a Solana VRF. This desk keeps the procedure in the open so you can read it.

## On X

The Cast tab drafts launch posts and a pull post. **Post on X** opens the compose window with the copy filled in. Nothing is sent until you post it.

`#DarkTradingCompany #Solana #DTC`

## Source map

- `src/lib/dtc/catalog.ts` — slabs, machines, odds
- `src/lib/dtc/engine.ts` — commit, roll, buyback, expected value
- `src/lib/dtc/store.ts` — blotter, vault, pit
- `src/components/dtc/` — floor, machines, vault, pit, reveal, broadcast

Paper state stays in this browser under `dtc-desk-v1`.
