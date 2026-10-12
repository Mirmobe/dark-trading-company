export const GITHUB_REPO = "https://github.com/Mirmobe/dark-trading-company";

export const X_TAGS = "#DarkTradingCompany #Solana #DTC";

export function xIntent(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

export function pullPost(input: {
  cardName: string;
  grade: string;
  indexed: string;
  packName: string;
  gain: string;
}): string {
  return [
    `Broke a ${input.packName} sack at Dark Trading Company.`,
    `Pulled ${input.cardName} (${input.grade}) — index ${input.indexed}, ${input.gain} vs the sack.`,
    `Real mineral specimens. A vein win is a real crystal when claims open.`,
    X_TAGS,
  ].join("\n");
}

export const LAUNCH_POSTS: { title: string; body: string }[] = [
  {
    title: "Launch",
    body: [
      "Dark Trading Company is open.",
      "A Solana pack desk for original vault slabs — not someone else's cards.",
      "Pick a machine. Lock a commit. Flip the slab. Buy it back, list it in the pit, or keep the ticket.",
      "Paper USDC in the desk so you can learn the night shift before you wire anything real.",
      X_TAGS,
    ].join("\n"),
  },
  {
    title: "How a pull works",
    body: [
      "Every Dark Trading Company pull is fixed before you see it.",
      "The desk hashes a seed, shows you the commit, then reveals. You can recompute the hash and the rarity walk yourself.",
      "Phantom on Solana can sign that commit. The signature does not choose the card. It witnesses the seal.",
      X_TAGS,
    ].join("\n"),
  },
  {
    title: "The four exits",
    body: [
      "You pull a slab at Dark Trading Company. Then four doors:",
      "Hold it.",
      "Sell it back for USDC inside the buyback window.",
      "List it in the pit.",
      "Cut a vault ticket and take it off the tape.",
      "Odds are printed on the machine. The house edge is not a secret.",
      X_TAGS,
    ].join("\n"),
  },
  {
    title: "Black Ledger",
    body: [
      "Black Ledger is the house machine.",
      "100 USDC. Worse buyback. The syndicate, the bell, and two relics in the pool.",
      "If you only open one pack tonight, read the odds first.",
      X_TAGS,
    ].join("\n"),
  },
  {
    title: "Grail",
    body: [
      "The Night Desk is a relic.",
      "Indexed like a closed exchange. It only lives in the Reliquary.",
      "Most seals will not be it. That is the point of a desk.",
      X_TAGS,
    ].join("\n"),
  },
  {
    title: "Builders",
    body: [
      "Dark Trading Company is on GitHub.",
      GITHUB_REPO,
      "Commit-reveal in the open. Original slabs. A pit, a vault, and a broadcast desk aimed at X.",
      "Not affiliated with Jupiter. Inspired by pack desks on Solana — built as its own house.",
      X_TAGS,
    ].join("\n"),
  },
];
