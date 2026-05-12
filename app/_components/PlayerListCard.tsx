import Link from "next/link";
import type { PlayerListItem } from "@/lib/queries/player-index";

export function PlayerListCard({ player }: { player: PlayerListItem }) {
  const rankLabel = player.currentJtaRank
    ? `JTA #${player.currentJtaRank}`
    : player.currentAtpRank ? `ATP ${player.currentAtpRank}` : "—";
  return (
    <Link
      href={`/players/${player.slug}`}
      className={`bg-bg-card p-2.5 block border-l-2 ${player.featured ? "border-signal-orange" : "border-line"} hover:border-fg-muted`}
    >
      <div className="text-[12px] font-extrabold text-fg">{player.nameJa}</div>
      <div className="text-[9px] text-fg-muted mt-0.5">
        {player.university ?? (player.category === "pro" ? "プロ" : "フューチャーズ")}
      </div>
      <div className="text-[9px] tabular text-fg-muted mt-1">{rankLabel}</div>
    </Link>
  );
}
