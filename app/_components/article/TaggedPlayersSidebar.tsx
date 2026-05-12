import Link from "next/link";

export type TaggedPlayerSummary = {
  slug: string;
  nameJa: string;
  meta: string;
  endorsedBy: string | null;
};

export function TaggedPlayersSidebar({ players }: { players: TaggedPlayerSummary[] }) {
  if (players.length === 0) return null;
  return (
    <aside className="bg-bg-panel border border-line p-4">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-3">
        — 記事に登場した選手
      </div>
      <ul className="flex flex-col gap-2">
        {players.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/players/${p.slug}`}
              className="block bg-bg p-2.5 border-l-2 border-signal-orange hover:border-signal-yellow"
            >
              <div className="text-[12px] font-extrabold text-fg">{p.nameJa}</div>
              <div className="text-[9px] text-fg-muted mt-0.5">{p.meta}</div>
              {p.endorsedBy && (
                <div className="text-[9px] text-signal-yellow mt-1">★ {p.endorsedBy} 推薦</div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
