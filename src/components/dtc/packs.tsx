import { useState } from "react";
import { PACKS, RARITY_LABEL, THEMES, type ThemeFilter } from "@/lib/dtc/catalog";
import { expectedValue, money, topSlab } from "@/lib/dtc/engine";
import { useDesk } from "@/lib/dtc/store";
import type { PackDef } from "@/lib/dtc/types";

export function Packs() {
  const [theme, setTheme] = useState<ThemeFilter>("All");
  const [packId, setPackId] = useState(PACKS[1]?.id ?? PACKS[0].id);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const usdc = useDesk((s) => s.usdc);
  const openPack = useDesk((s) => s.openPack);
  const visible = PACKS.filter((pack) => theme === "All" || pack.theme === theme);
  const selected = visible.find((pack) => pack.id === packId) ?? visible[0] ?? PACKS[0];

  async function open() {
    setBusy(true);
    try {
      await openPack(selected.id, qty);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs tracking-seal text-brass uppercase">Machines</p>
        <h1 className="mt-2 font-serif text-4xl text-ivory">Pick a seal.</h1>
      </header>
      <div className="flex gap-2 overflow-x-auto">
        {THEMES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTheme(item)}
            className={`min-h-11 shrink-0 px-3 text-sm ${
              theme === item ? "bg-brass text-ink" : "border border-line text-ivory"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          {visible.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => setPackId(pack.id)}
              className={`rounded-slab border p-4 text-left ${
                selected.id === pack.id ? "border-brass bg-raised" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-serif text-2xl text-ivory">{pack.name}</span>
                <span className="num text-brass">{money(pack.price)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{pack.tagline}</p>
            </button>
          ))}
        </div>
        <MachineDetail pack={selected} qty={qty} setQty={setQty} usdc={usdc} busy={busy} onOpen={() => void open()} />
      </div>
    </div>
  );
}

function MachineDetail({
  pack,
  qty,
  setQty,
  usdc,
  busy,
  onOpen,
}: {
  pack: PackDef;
  qty: number;
  setQty: (n: number) => void;
  usdc: number;
  busy: boolean;
  onOpen: () => void;
}) {
  const ev = expectedValue(pack);
  const edge = ((pack.price - ev) / pack.price) * 100;
  const chase = topSlab(pack);
  const cost = pack.price * qty;
  const short = usdc + 1e-9 < cost;

  return (
    <section className="rounded-slab border border-line bg-surface p-5">
      <p className="text-xs tracking-seal text-muted uppercase">
        {pack.press} · {pack.theme}
      </p>
      <h2 className="mt-2 font-serif text-4xl text-ivory">{pack.name}</h2>
      <p className="mt-2 text-sm text-muted">{pack.tagline}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted">Price</dt>
          <dd className="num text-lg text-ivory">{money(pack.price)}</dd>
        </div>
        <div>
          <dt className="text-muted">Index EV</dt>
          <dd className="num text-lg text-ivory">{money(ev)}</dd>
        </div>
        <div>
          <dt className="text-muted">Buyback</dt>
          <dd className="text-ivory">
            {Math.round(pack.buybackRate * 100)}% · {pack.buybackDays} days
          </dd>
        </div>
        <div>
          <dt className="text-muted">House edge at index</dt>
          <dd className="num text-ivory">{edge.toFixed(0)}%</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted">
        Top of the pool: <span className="text-ivory">{chase.name}</span>, index {money(chase.usd)}.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        {pack.odds.map((row) => (
          <div key={row.rarity} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-muted">{RARITY_LABEL[row.rarity]}</span>
            <span className="h-1.5 flex-1 bg-raised">
              <span className="block h-1.5 bg-brass" style={{ width: `${row.bps / 100}%` }} />
            </span>
            <span className="num w-14 text-right text-ivory">{(row.bps / 100).toFixed(2)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {[1, 3, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setQty(n)}
            className={`min-h-11 min-w-11 px-3 text-sm ${qty === n ? "bg-brass text-ink" : "border border-line text-ivory"}`}
          >
            ×{n}
          </button>
        ))}
        <button
          type="button"
          disabled={busy || short}
          onClick={onOpen}
          className="min-h-11 bg-brass px-5 text-sm font-medium text-ink disabled:opacity-40"
        >
          {busy ? "Sealing…" : `Open · ${money(cost)}`}
        </button>
      </div>
      {short ? <p className="mt-3 text-sm text-brass">The blotter is short {money(cost - usdc)}.</p> : null}
      <p className="mt-4 text-xs text-muted">
        A paper network fee of 0.000005 SOL is nicked per pack. It never leaves this browser.
      </p>
    </section>
  );
}
