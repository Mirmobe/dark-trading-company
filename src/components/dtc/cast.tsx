import { useState } from "react";
import { GITHUB_REPO, LAUNCH_POSTS, X_TAGS, xIntent } from "@/lib/dtc/links";
import { useDesk } from "@/lib/dtc/store";
import { getCard, getPack } from "@/lib/dtc/catalog";
import { gainPct, money } from "@/lib/dtc/engine";
import { pullPost } from "@/lib/dtc/links";

export function Cast() {
  const [copied, setCopied] = useState<string | null>(null);
  const inventory = useDesk((s) => s.inventory);
  const latest = inventory.find((slab) => slab.source === "pull");
  const latestCard = latest ? getCard(latest.cardId) : null;
  const latestPack = latest?.packId ? getPack(latest.packId) : undefined;
  const latestBody =
    latest && latestCard && latestPack && latest.packPrice
      ? pullPost({
          cardName: latestCard.name,
          grade: latestCard.grade,
          indexed: money(latestCard.usd),
          packName: latestPack.name,
          gain: `${gainPct(latestCard.usd, latest.packPrice) >= 0 ? "+" : ""}${gainPct(latestCard.usd, latest.packPrice).toFixed(0)}%`,
        })
      : null;

  async function copy(id: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(id);
    } catch {
      setCopied("no");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs tracking-seal text-brass uppercase">Broadcast</p>
        <h1 className="mt-2 font-serif text-4xl text-ivory">Put the desk on X.</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          These posts are ready. Post opens on X with the copy filled in — nothing is sent until you hit Post
          there. Tag the work {X_TAGS}. The house repo is public.
        </p>
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center text-sm text-brass"
        >
          {GITHUB_REPO.replace("https://", "")}
        </a>
      </header>

      {latestBody ? (
        <PostCard
          title="Your last pull"
          body={latestBody}
          copied={copied === "last"}
          onCopy={() => void copy("last", latestBody)}
        />
      ) : (
        <p className="text-sm text-muted">Open a pack and this desk will draft the pull for X.</p>
      )}

      <div className="flex flex-col gap-4">
        {LAUNCH_POSTS.map((post) => (
          <PostCard
            key={post.title}
            title={post.title}
            body={post.body}
            copied={copied === post.title}
            onCopy={() => void copy(post.title, post.body)}
          />
        ))}
      </div>
      {copied === "no" ? <p className="text-sm text-muted">Clipboard blocked. Use Post on X instead.</p> : null}
    </div>
  );
}

function PostCard({
  title,
  body,
  copied,
  onCopy,
}: {
  title: string;
  body: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <article className="rounded-slab border border-line bg-surface p-4">
      <h2 className="font-serif text-2xl text-ivory">{title}</h2>
      <pre className="mt-3 font-sans text-sm leading-relaxed whitespace-pre-wrap text-muted">{body}</pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={xIntent(body)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center bg-brass px-4 text-sm font-medium text-ink"
        >
          Post on X
        </a>
        <button type="button" onClick={onCopy} className="min-h-11 border border-line px-4 text-sm text-ivory">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </article>
  );
}
