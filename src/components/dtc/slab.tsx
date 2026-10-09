import { RARITY_LABEL } from "@/lib/dtc/catalog";
import type { CardDef } from "@/lib/dtc/types";

export function Monogram({ motif }: { motif: CardDef["motif"] }) {
  const common = "stroke-brass fill-none";
  if (motif === "ember") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
        <path d="M32 8 52 32 32 56 12 32Z" className={common} strokeWidth="1.4" />
        <path d="M32 20 44 32 32 44 20 32Z" className={common} strokeWidth="1.4" />
        <path d="M32 28v12" className={common} strokeWidth="1.4" />
      </svg>
    );
  }
  if (motif === "eclipse") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
        <circle cx="28" cy="32" r="14" className={common} strokeWidth="1.4" />
        <circle cx="38" cy="32" r="14" className={common} strokeWidth="1.4" />
        <path d="M32 14v36" className={common} strokeWidth="1.2" />
      </svg>
    );
  }
  if (motif === "ash") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
        <path d="M14 18h22M14 18v22M50 46H28M50 46V24" className={common} strokeWidth="1.4" />
        <path d="M24 32h16" className={common} strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      <rect x="16" y="14" width="32" height="36" className={common} strokeWidth="1.4" />
      <path d="M22 24h20M22 32h20M22 40h12" className={common} strokeWidth="1.4" />
    </svg>
  );
}

export function SlabFace({
  card,
  footer,
  delay = 0,
}: {
  card: CardDef;
  footer?: string;
  delay?: number;
}) {
  const relic = card.rarity === "relic" || card.rarity === "mythic";
  return (
    <article
      className={`slab-in flex aspect-slab w-full flex-col justify-between rounded-slab border bg-surface p-4 ${
        relic ? "border-brass" : "border-line"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-seal text-muted uppercase">{card.grade}</p>
        <p className="text-xs tracking-seal text-brass uppercase">{RARITY_LABEL[card.rarity]}</p>
      </header>
      <div className="mx-auto h-16 w-16">
        <Monogram motif={card.motif} />
      </div>
      <div>
        <h3 className="font-serif text-2xl leading-tight text-ivory">{card.name}</h3>
        <p className="mt-1 text-sm text-muted">{card.set}</p>
        <p className="mt-3 text-sm leading-snug text-ivory">{card.line}</p>
        {footer ? <p className="num mt-3 text-sm text-brass">{footer}</p> : null}
      </div>
    </article>
  );
}
