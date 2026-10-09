import { useState } from "react";
import { RARITY_LABEL, getCard, getPack } from "@/lib/dtc/catalog";
import { buybackQuote, money } from "@/lib/dtc/engine";
import { useDesk } from "@/lib/dtc/store";
import { SlabFace } from "@/components/dtc/slab";

export function Vault() {
  const inventory = useDesk((s) => s.inventory);
  const buyback = useDesk((s) => s.buyback);
  const listSlab = useDesk((s) => s.listSlab);
  const cancelListing = useDesk((s) => s.cancelListing);
  const redeem = useDesk((s) => s.redeem);
  const listings = useDesk((s) => s.listings);
  const [ask, setAsk] = useState<Record<string, string>>({});

  const held = inventory.filter((slab) => slab.status !== "listed");
  const listed = inventory.filter((slab) => slab.status === "listed");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs tracking-seal text-brass uppercase">Vault</p>
        <h1 className="mt-2 font-serif text-4xl text-ivory">What the desk owes you.</h1>
      </header>
      {inventory.length === 0 ? (
        <p className="rounded-slab border border-line bg-surface p-5 text-sm text-muted">
          The vault is empty. Open a machine or take something off the pit.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {held.map((slab) => {
          const card = getCard(slab.cardId);
          const quote = slab.source === "pull" ? buybackQuote(slab.packId, slab.cardId, slab.pulledAt) : null;
          const pack = slab.packId ? getPack(slab.packId) : undefined;
          return (
            <div key={slab.id} className="flex flex-col gap-3">
              <SlabFace
                card={card}
                footer={
                  slab.status === "redeemed"
                    ? `Ticket ${slab.ticket ?? ""}`
                    : `Index ${money(card.usd)}`
                }
              />
              <p className="text-xs tracking-seal text-muted uppercase">
                {RARITY_LABEL[card.rarity]}
                {pack ? ` · ${pack.name}` : " · Pit"}
                {slab.source === "pit" ? " · bought" : ""}
              </p>
              {slab.status === "vault" ? (
                <div className="flex flex-col gap-2">
                  {quote != null ? (
                    <button
                      type="button"
                      onClick={() => buyback(slab.id)}
                      className="min-h-11 border border-line text-sm text-ivory"
                    >
                      Buy back · {money(quote)}
                    </button>
                  ) : (
                    <p className="text-xs text-muted">
                      {slab.source === "pit" ? "Pit buys are not bought back." : "Buyback window closed."}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <label className="sr-only" htmlFor={`ask-${slab.id}`}>
                      Ask in USDC
                    </label>
                    <input
                      id={`ask-${slab.id}`}
                      inputMode="decimal"
                      value={ask[slab.id] ?? ""}
                      placeholder={money(card.usd)}
                      onChange={(event) => setAsk((prev) => ({ ...prev, [slab.id]: event.target.value }))}
                      className="num min-h-11 w-full border border-line bg-ink px-3 text-sm text-ivory placeholder:text-muted"
                    />
                    <button
                      type="button"
                      onClick={() => listSlab(slab.id, Number(ask[slab.id] || card.usd))}
                      className="min-h-11 shrink-0 bg-brass px-4 text-sm text-ink"
                    >
                      List
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => redeem(slab.id)}
                    className="min-h-11 text-left text-sm text-muted"
                  >
                    Cut a vault ticket
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted">Off the tape. Demo ticket only.</p>
              )}
            </div>
          );
        })}
      </div>
      {listed.length > 0 ? (
        <section>
          <h2 className="font-serif text-3xl text-ivory">Your asks</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {listed.map((slab) => {
              const card = getCard(slab.cardId);
              const listing = listings.find((item) => item.ownedId === slab.id);
              return (
                <li key={slab.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-ivory">{card.name}</p>
                    <p className="num text-sm text-muted">{listing ? money(listing.price) : "—"}</p>
                  </div>
                  {listing ? (
                    <button
                      type="button"
                      onClick={() => cancelListing(listing.id)}
                      className="min-h-11 px-3 text-sm text-brass"
                    >
                      Pull ask
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
