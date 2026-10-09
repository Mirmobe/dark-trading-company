import { getCard } from "@/lib/dtc/catalog";
import { money } from "@/lib/dtc/engine";
import { useDesk } from "@/lib/dtc/store";
import { SlabFace } from "@/components/dtc/slab";

export function Pit() {
  const listings = useDesk((s) => s.listings);
  const buyListing = useDesk((s) => s.buyListing);
  const usdc = useDesk((s) => s.usdc);
  const ordered = [...listings].sort((a, b) => a.price - b.price);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-seal text-brass uppercase">The pit</p>
          <h1 className="mt-2 font-serif text-4xl text-ivory">Asks on the tape.</h1>
        </div>
        <p className="num text-sm text-muted">Blotter {money(usdc)}</p>
      </header>
      {ordered.length === 0 ? (
        <p className="text-sm text-muted">The pit is quiet. List a slab from the vault.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((listing) => {
            const card = getCard(listing.cardId);
            const vs = listing.price - card.usd;
            return (
              <div key={listing.id} className="flex flex-col gap-3">
                <SlabFace card={card} footer={`Index ${money(card.usd)}`} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{listing.seller}</p>
                    <p className="num text-ivory">{money(listing.price)}</p>
                    <p className="num text-xs text-muted">
                      {vs === 0 ? "At index" : `${vs > 0 ? "+" : ""}${money(vs)} vs index`}
                    </p>
                  </div>
                  {listing.house ? (
                    <button
                      type="button"
                      onClick={() => buyListing(listing.id)}
                      disabled={usdc + 1e-9 < listing.price}
                      className="min-h-11 bg-brass px-4 text-sm text-ink disabled:opacity-40"
                    >
                      Take
                    </button>
                  ) : (
                    <p className="text-xs tracking-seal text-brass uppercase">Your ask</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
