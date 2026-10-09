import { useEffect, useState } from "react";
import { Cast } from "@/components/dtc/cast";
import { Floor } from "@/components/dtc/floor";
import { Packs } from "@/components/dtc/packs";
import { Pit } from "@/components/dtc/pit";
import { Reveal } from "@/components/dtc/reveal";
import { Vault } from "@/components/dtc/vault";
import { money, shortKey } from "@/lib/dtc/engine";
import { useDesk } from "@/lib/dtc/store";

type View = "floor" | "packs" | "vault" | "pit" | "cast";

const NAV: { id: View; label: string }[] = [
  { id: "floor", label: "Floor" },
  { id: "packs", label: "Packs" },
  { id: "vault", label: "Vault" },
  { id: "pit", label: "Pit" },
  { id: "cast", label: "Cast" },
];

export function DeskApp() {
  const [view, setView] = useState<View>("floor");
  const hydrate = useDesk((s) => s.hydrate);
  const usdc = useDesk((s) => s.usdc);
  const sol = useDesk((s) => s.sol);
  const wallet = useDesk((s) => s.wallet);
  const notice = useDesk((s) => s.notice);
  const connectWallet = useDesk((s) => s.connectWallet);
  const disconnectWallet = useDesk((s) => s.disconnectWallet);
  const clearNotice = useDesk((s) => s.clearNotice);
  const faucet = useDesk((s) => s.faucet);
  const reset = useDesk((s) => s.reset);
  const vaultCount = useDesk((s) => s.inventory.filter((item) => item.status === "vault").length);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-screen overflow-x-hidden pb-24 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-brass/40 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <button type="button" onClick={() => setView("floor")} className="flex items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center border border-brass font-serif text-xl text-brass">
              D
            </span>
            <span className="leading-tight">
              <span className="block text-xs tracking-seal text-muted uppercase">Dark Trading</span>
              <span className="block font-serif text-lg text-ivory">Company</span>
            </span>
          </button>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`min-h-11 px-3 text-sm ${view === item.id ? "text-brass" : "text-muted"}`}
              >
                {item.label}
                {item.id === "vault" && vaultCount > 0 ? (
                  <span className="num ml-1 text-xs text-brass">{vaultCount}</span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <p className="num text-right text-xs leading-tight text-ivory">
              <span className="block">{money(usdc)}</span>
              <span className="hidden text-muted sm:block">{sol.toFixed(4)} SOL</span>
            </p>
            <button
              type="button"
              onClick={() => void (wallet ? disconnectWallet() : connectWallet())}
              className="min-h-11 border border-line px-3 text-sm text-ivory"
            >
              {wallet ? shortKey(wallet.publicKey) : "Phantom"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {view === "floor" ? <Floor onOpenPacks={() => setView("packs")} /> : null}
        {view === "packs" ? <Packs /> : null}
        {view === "vault" ? <Vault /> : null}
        {view === "pit" ? <Pit /> : null}
        {view === "cast" ? <Cast /> : null}
        <footer className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-muted">
          <span className="num sm:hidden">
            {money(usdc)} · {sol.toFixed(4)} SOL
          </span>
          <button type="button" onClick={faucet} className="min-h-11 text-left">
            Desk faucet
          </button>
          <button type="button" onClick={reset} className="min-h-11 text-left">
            Reset blotter
          </button>
          <span>Paper funds. Solana commit witness only.</span>
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-ink md:hidden">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={`min-h-14 text-sm ${view === item.id ? "text-brass" : "text-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {notice ? (
        <div className="fixed right-4 bottom-20 left-4 z-40 md:bottom-6 md:left-auto md:max-w-sm">
          <button
            type="button"
            onClick={clearNotice}
            className="w-full rounded-slab border border-line bg-raised px-4 py-3 text-left text-sm text-ivory"
          >
            {notice}
          </button>
        </div>
      ) : null}
      <Reveal />
    </div>
  );
}
