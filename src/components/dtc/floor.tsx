import { PACKS, getCard, getPack } from "@/lib/dtc/catalog";
import { compactAge, expectedValue, gainPct, money, topSlab } from "@/lib/dtc/engine";
import { useDesk } from "@/lib/dtc/store";

export function Floor({ onOpenPacks }: { onOpenPacks: () => void }) {
  const feed = useDesk((s) => s.feed);
  const opened = useDesk((s) => s.opened);
  const volume = useDesk((s) => s.volume);
  const inventory = useDesk((s) => s.inventory);
  const best = inventory.reduce((top, slab) => {
    const card = getCard(slab.cardId);
    return !top || card.usd > top.usd ? card : top;
  }, null as ReturnType<typeof getCard> | null);

  const tape = feed.slice(0, 10);

  return (
    <div className="flex flex-col gap-10">
      <section className="grid items-end gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs tracking-seal text-brass uppercase">Solana paper desk · original slabs</p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-none text-ivory md:text-6xl">
            Open the night desk.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted">
            Dark Trading Company seals original vault slabs — contracts, bells, and one ruined exchange.
            Lock a commit, flip the card, then hold it, sell it back, or throw it in the pit.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenPacks}
              className="min-h-11 bg-brass px-5 text-sm font-medium tracking-wide text-ink"
            >
              Choose a machine
            </button>
            <p className="flex min-h-11 items-center text-sm text-muted">You start with 500 paper USDC.</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-slab border border-line bg-line">
          <Stat k="Your opens" v={String(opened)} />
          <Stat k="Volume" v={money(volume)} />
          <Stat k="In the book" v={String(inventory.filter((s) => s.status !== "listed").length)} />
          <Stat k="Best hold" v={best ? best.name : "—"} />
        </dl>
      </section>

      <div className="overflow-hidden border-y border-line">
        <div className="ticker-track flex w-max gap-10 py-3">
          {[...tape, ...tape].map((item, index) => {
            const card = getCard(item.cardId);
            const pack = getPack(item.packId);
            const gain = pack ? gainPct(card.usd, pack.price) : 0;
            return (
              <p key={`${item.id}-${index}`} className="text-sm whitespace-nowrap text-muted">
                <span className="text-ivory">{item.who}</span>
                {" pulled "}
                <span className="text-ivory">{card.name}</span>
                {" · "}
                <span className="num text-brass">
                  {gain >= 0 ? "+" : ""}
                  {gain.toFixed(0)}%
                </span>
                <span className="text-muted"> · {compactAge(item.at)}</span>
              </p>
            );
          })}
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-3xl text-ivory">Machines on the floor</h2>
          <button type="button" onClick={onOpenPacks} className="min-h-11 text-sm text-brass">
            All odds
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {PACKS.slice(0, 3).map((pack) => {
            const chase = topSlab(pack);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={onOpenPacks}
                className="min-w-64 shrink-0 rounded-slab border border-line bg-surface p-4 text-left md:min-w-0"
              >
                <p className="text-xs tracking-seal text-muted uppercase">{pack.press}</p>
                <p className="mt-2 font-serif text-3xl text-ivory">{pack.name}</p>
                <p className="num mt-3 text-lg text-brass">{money(pack.price)}</p>
                <p className="mt-3 text-sm text-muted">
                  Chase <span className="text-ivory">{chase.name}</span> · index {money(chase.usd)}
                </p>
                <p className="num mt-1 text-sm text-muted">Index EV {money(expectedValue(pack))}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["Hold", "The slab stays in your vault. Index is a mark, not a bid."],
          ["Buy back", "Inside the window, the desk pays a published percent of index in paper USDC."],
          ["The pit", "List any vaulted slab. Other desks are already asking."],
          ["Ticket", "Cut a vault ticket and pull it off the tape. Nothing physical ships from this demo."],
        ].map(([title, copy]) => (
          <article key={title} className="border-t border-line pt-3">
            <h3 className="font-serif text-2xl text-ivory">{title}</h3>
            <p className="mt-2 text-sm text-muted">{copy}</p>
          </article>
        ))}
      </section>

      <section className="rounded-slab border border-line bg-surface p-5">
        <h2 className="font-serif text-3xl text-ivory">What you are actually holding</h2>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          This is a paper desk in your browser. Balances are not USDC on Solana and these slabs are original
          fiction — not graded cards from any other company, and not affiliated with Jupiter. Odds and index
          values are printed before you pay. A Phantom signature, when you choose it, witnesses the commit. It
          does not move funds.
        </p>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-surface px-4 py-4">
      <dt className="text-xs tracking-seal text-muted uppercase">{k}</dt>
      <dd className="num mt-1 truncate font-serif text-2xl text-ivory">{v}</dd>
    </div>
  );
}
