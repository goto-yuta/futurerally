import Link from "next/link";
import { EndorsementBadge } from "./EndorsementBadge";

export type FeaturedPlayer = {
  slug: string;
  nameJa: string;
  meta: string;
  endorsedBy: string;
  stats: string;
};

export function FeaturedPlayersRow({ players }: { players: FeaturedPlayer[] }) {
  return (
    <section>
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="text-[9px] tracking-widest text-fg-muted font-extrabold">
          ★ FEATURED PLAYERS / 編集部の今月の注目選手
        </div>
        <Link href="/players?featured=1" className="text-[9px] text-signal-yellow font-bold">
          全選手 ＞
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 px-4 pb-4">
        {players.map((p) => (
          <Link key={p.slug} href={`/players/${p.slug}`} className="bg-bg-card p-2.5 border-l-2 border-signal-orange block">
            {p.endorsedBy && (
              <div className="mb-1.5">
                <EndorsementBadge proName={p.endorsedBy} />
              </div>
            )}
            <div className="text-[13px] font-extrabold text-fg">{p.nameJa}</div>
            <div className="text-[9px] text-fg-muted mt-0.5">{p.meta}</div>
            <div className="text-[9px] text-fg-muted mt-1.5 tabular">{p.stats}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
