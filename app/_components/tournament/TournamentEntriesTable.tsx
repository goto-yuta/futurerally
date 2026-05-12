import Link from "next/link";

export type TournamentEntryRow = {
  playerSlug: string;
  playerName: string;
  status: "alive" | "scheduled" | "won" | "lost" | "champion";
  currentRound: string | null;
  lastMatchSummary: string | null;
};

const STATUS_COPY: Record<TournamentEntryRow["status"], { color: string; label: string }> = {
  alive: { color: "border-signal-red", label: "出場中" },
  scheduled: { color: "border-line", label: "出場予定" },
  won: { color: "border-signal-green", label: "勝ち抜き" },
  lost: { color: "border-fg-quiet", label: "敗退" },
  champion: { color: "border-signal-yellow", label: "優勝" },
};

export function TournamentEntriesTable({ entries }: { entries: TournamentEntryRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {entries.map((e) => {
        const cfg = STATUS_COPY[e.status];
        return (
          <Link
            href={`/players/${e.playerSlug}`}
            key={e.playerSlug}
            className={`grid grid-cols-[120px_80px_1fr] gap-3 items-center bg-bg-panel border-l-2 ${cfg.color} px-3 py-2 hover:bg-bg-card`}
          >
            <span className="text-fg font-bold text-[12px]">{e.playerName}</span>
            <span className="text-fg-muted text-[10px]">{cfg.label}</span>
            <span className="text-fg-muted text-[10px]">
              {e.currentRound ? `残${e.currentRound}` : ""}
              {e.lastMatchSummary ? ` · ${e.lastMatchSummary}` : ""}
            </span>
          </Link>
        );
      })}
      {entries.length === 0 && (
        <div className="text-fg-muted text-[11px] p-3">日本人選手の出場記録はありません。</div>
      )}
    </div>
  );
}
