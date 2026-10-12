import { useEffect, useState } from "react";
import { getCard, getPack } from "@/lib/dtc/catalog";
import { buybackQuote, gainPct, money, verifyPull } from "@/lib/dtc/engine";
import { pullPost, xIntent } from "@/lib/dtc/links";
import { useDesk } from "@/lib/dtc/store";
import { SlabFace } from "@/components/dtc/slab";
const MOTES = [
  ["12%", "22%", "0ms"],
  ["22%", "70%", "180ms"],
  ["78%", "18%", "90ms"],
  ["84%", "58%", "320ms"],
  ["48%", "12%", "40ms"],
  ["36%", "78%", "260ms"],
  ["64%", "40%", "140ms"],
  ["8%", "46%", "400ms"],
  ["92%", "36%", "220ms"],
  ["54%", "84%", "300ms"],
  ["30%", "34%", "60ms"],
  ["70%", "76%", "160ms"],
] as const;

function GhostChomp() {
  return (
    <svg viewBox="0 0 200 180" className="ghost-chomp pointer-events-none absolute bottom-[6%] left-[4%] z-20 w-[min(46%,28rem)]" aria-hidden>
      <path
        d="M24 78c0-42 34-64 76-64s76 22 76 64v62l-16-12-14 12-14-12-14 12-14-12-14 12-14-12-14 12-16-12-16 12V78Z"
        fill="#3ec0ff"
        stroke="#14120c"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="72" r="11" fill="#14120c" />
      <circle cx="128" cy="72" r="11" fill="#14120c" />
      <circle cx="82" cy="68" r="4" fill="#fff" />
      <circle cx="132" cy="68" r="4" fill="#fff" />
      <path className="ghost-jaw" d="M58 98h88l-12 32H72Z" fill="#14120c" />
      <path className="ghost-jaw" d="M80 116h44l-6 12H86Z" fill="#ff4d6d" />
    </svg>
  );
}

function VoidSpectacle({ leaving }: { leaving?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {leaving ? null : (
        <img src="/hyperspace.jpg" alt="" className="void-hyper absolute inset-0 h-full w-full object-cover" />
      )}
      <img
        src="/reaper.jpg"
        alt=""
        className={
          leaving
            ? "reaper-eaten absolute bottom-0 left-1/2 h-full w-auto max-w-none"
            : "void-reaper absolute bottom-0 left-1/2 w-auto max-w-none"
        }
      />
      {leaving
        ? null
        : MOTES.map(([left, top, delay]) => (
            <span
              key={`${left}-${top}`}
              className="mote absolute h-0.5 w-0.5 rounded-full bg-ivory"
              style={{ left, top, animationDelay: delay }}
            />
          ))}
    </div>
  );
}

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
    const timer = window.setTimeout(() => showOpening(), reduce ? 280 : 3600);
    return () => window.clearTimeout(timer);
  }, [opening, showOpening]);

  useEffect(() => {
    if (!opening || opening.stage !== "open") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => dismissOpening(), reduce ? 1200 : 4600);
    return () => window.clearTimeout(timer);
  }, [opening, dismissOpening]);

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
    <div className="fixed inset-0 z-50 bg-ink" role="dialog" aria-modal>
      {opening.stage === "sealed" || !pack ? (
        <div className="relative h-full w-full overflow-hidden">
          <VoidSpectacle />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent px-6 pt-24 pb-10 text-center">
            <p className="text-xs tracking-seal text-brass uppercase">Seal locked</p>
            <h2 className="mt-3 font-serif text-4xl text-ivory">{pack?.name ?? "Machine"}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              {slabs.length} commit{slabs.length === 1 ? "" : "s"} fixed in the dark. The flip cannot change them.
            </p>
            <p className="num mx-auto mt-4 max-w-lg truncate text-xs text-brass-deep">{slabs[0]?.commitment}</p>
          </div>
        </div>
      ) : (
        <div className="relative flex h-full items-end justify-center overflow-y-auto p-4 md:items-center">
          <VoidSpectacle leaving />
          <GhostChomp />
          <div className="relative z-10 max-h-full w-full max-w-5xl">
            <div>
              <p className="text-xs tracking-seal text-brass uppercase">{pack.name}</p>
              <h2 className="font-serif text-4xl text-ivory">You cracked it.</h2>
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
        </div>
      )}
    </div>
  );
}
