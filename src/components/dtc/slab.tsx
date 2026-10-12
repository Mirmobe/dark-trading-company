import { RARITY_LABEL } from "@/lib/dtc/catalog";
import type { CardDef } from "@/lib/dtc/types";

export function Monogram({ motif }: { motif: CardDef["motif"] }) {
  const fill = motif === "ember" ? "#ff8a3d" : motif === "eclipse" ? "#3ec0ff" : motif === "ash" ? "#f3eadf" : "#ffe14a";
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      <path d="M32 4 54 26 32 60 10 26Z" fill={fill} stroke="#14120c" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M10 26h44" stroke="#14120c" strokeWidth="3" />
      <path d="M32 4 22 26 32 60 42 26Z" fill="#fff" opacity="0.45" />
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
