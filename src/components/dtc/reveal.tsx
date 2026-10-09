import { useEffect, useState } from "react";
import { getCard, getPack } from "@/lib/dtc/catalog";
import { buybackQuote, gainPct, money, verifyPull } from "@/lib/dtc/engine";
import { pullPost, xIntent } from "@/lib/dtc/links";
import { useDesk } from "@/lib/dtc/store";
import { SlabFace } from "@/components/dtc/slab";

export function Reveal() {
  const opening = useDesk((s) => s.opening);
  const inventory = useDesk((s) => s.inventory);
  const showOpening = useDesk((s) => s.showOpening);
  const dismissOpening = useDesk((s) => s.dismissOpening);
  const buyback = useDesk((s) => s.buyback);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!opening || opening.stage !== "sealed") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => showOpening(), reduce ? 240 : 1100);
    return () => window.clearTimeout(timer);
  }, [opening, showOpening]);

  useEffect(() => {
    if (!opening || opening.stage !== "open") return;
    let cancel = false;
    void (async () => {
      const next: Record<string, boolean> = {};
      for (const id of opening.pullIds) {
        const slab = useDesk.getState().inventory.find((item) => item.id === id);
        if (!slab?.seed || !slab.commitment || !slab.packId) continue;
        next[id] = await verifyPull(slab.seed, slab.commitment, slab.packId, slab.cardId);
      }
      if (!cancel) setChecks(next);
    })();
    return () => {
      cancel = true;
    };
  }, [opening]);

  if (!opening) return null;
  const pack = getPack(opening.packId);
  const slabs = opening.pullIds
    .map((id) => inventory.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/92 p-4 md:items-center" role="dialog" aria-modal>
      <div className="max-h-full w-full max-w-5xl overflow-y-auto rounded-slab border border-line bg-ink p-4 md:p-6">
        {opening.stage === "sealed" || !pack ? (
          <div className="pack-shake px-2 py-10 text-center">
            <p className="text-xs tracking-seal text-brass uppercase">Seal locked</p>
            <h2 className="mt-3 font-serif text-4xl text-ivory">{pack?.name ?? "Machine"}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              {slabs.length} commit{slabs.length === 1 ? "" : "s"} fixed. The flip cannot change them.
            </p>
            <p className="num mx-auto mt-4 max-w-lg truncate text-xs text-brass-deep">
              {slabs[0]?.commitment}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-seal text-brass uppercase">{pack.name}</p>
                <h2 className="font-serif text-3xl text-ivory">The seal broke.</h2>
              </div>
              <button type="button" onClick={dismissOpening} className="min-h-11 px-3 text-sm text-ivory">
                Close
              </button>
            </div>
            <div className={`mt-5 grid gap-4 ${slabs.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "mx-auto max-w-xs"}`}>
              {slabs.map((slab, index) => {
                const card = getCard(slab.cardId);
                const gain = slab.packPrice ? gainPct(card.usd, slab.packPrice) : 0;
                const quote = buybackQuote(slab.packId, slab.cardId, slab.pulledAt);
                const post = pullPost({
                  cardName: card.name,
                  grade: card.grade,
                  indexed: money(card.usd),
                  packName: pack.name,
                  gain: `${gain >= 0 ? "+" : ""}${gain.toFixed(0)}%`,
                });
                return (
                  <div key={slab.id} className="flex flex-col gap-3">
                    <SlabFace
                      card={card}
                      delay={index * 90}
                      footer={`${gain >= 0 ? "+" : ""}${gain.toFixed(0)}% vs pack · ${money(card.usd)}`}
                    />
                    <p className="text-xs text-muted">
                      {checks[slab.id] ? "Commit matches this slab." : "Checking the commit…"}
                      {slab.signature ? " Phantom witnessed it." : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quote != null && slab.status === "vault" ? (
                        <button
                          type="button"
                          onClick={() => buyback(slab.id)}
                          className="min-h-11 border border-line px-3 text-sm text-ivory"
                        >
                          Buy back {money(quote)}
                        </button>
                      ) : null}
                      <a
                        href={xIntent(post)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center bg-brass px-3 text-sm text-ink"
                      >
                        Share on X
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
