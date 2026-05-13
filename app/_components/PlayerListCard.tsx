import Link from "next/link";
import type { PlayerListItem } from "@/lib/queries/player-index";

export function PlayerListCard({ player }: { player: PlayerListItem }) {
  const rankLabel = player.currentJtaRank
    ? `JTA #${player.currentJtaRank}`
    : player.currentAtpRank ? `ATP ${player.currentAtpRank}` : "—";
  return (
    <Link
      href={`/players/${player.slug}`}
      className={`bg-bg-card px-3 py-3.5 block border-l-2 min-h-[64px] flex flex-col justify-center ${
        player.featured ? "border-signal-orange" : "border-line"
      } hover:border-fg-muted active:bg-bg`}
    >
      <div className="text-[13px] font-extrabold text-fg leading-tight">{player.nameJa}</div>
      <div className="text-[10px] text-fg-muted mt-1">
        {player.university ?? (player.category === "pro" ? "プロ" : "フューチャーズ")}
        <span className="ml-2 tabular">{rankLabel}</span>
      </div>
    </Link>
  );
}
