import Link from "next/link";

export type TournamentEntryRow = {
  playerSlug: string;
  playerName: string;
  status: "alive" | "scheduled" | "won" | "lost" | "champion";
  currentRound: string | null;
  lastMatchSummary: string | null;
};

const STATUS_COPY: Record<TournamentEntryRow["status"], { color: string; label: string; textColor: string }> = {
  alive:     { color: "border-signal-red",    label: "出場中",   textColor: "text-signal-red" },
  scheduled: { color: "border-line",           label: "出場予定", textColor: "text-fg-muted" },
  won:       { color: "border-signal-green",   label: "勝ち抜き", textColor: "text-signal-green" },
  lost:      { color: "border-fg-quiet",       label: "敗退",     textColor: "text-fg-quiet" },
  champion:  { color: "border-signal-yellow",  label: "優勝",     textColor: "text-signal-yellow" },
};

export function TournamentEntriesTable({ entries }: { entries: TournamentEntryRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-1">
      {entries.map((e) => {
        const cfg = STATUS_COPY[e.status];
        return (
          <Link
            href={`/players/${e.playerSlug}`}
            key={e.playerSlug}
            className={`flex items-center gap-3 bg-bg-panel border-l-2 ${cfg.color} px-3 py-3 hover:bg-bg-card min-h-[52px]`}
          >
            <span className="text-fg font-bold text-[13px] flex-1 min-w-0 truncate">{e.playerName}</span>
            <span className={`text-[10px] font-bold shrink-0 ${cfg.textColor}`}>{cfg.label}</span>
            {(e.currentRound || e.lastMatchSummary) && (
              <span className="text-fg-muted text-[10px] hidden sm:block shrink-0">
                {e.currentRound ? `${e.currentRound}` : ""}
                {e.lastMatchSummary ? ` · ${e.lastMatchSummary.split(" ").slice(0, 2).join(" ")}` : ""}
              </span>
            )}
          </Link>
        );
      })}
      {entries.length === 0 && (
        <div className="text-fg-muted text-[11px] p-3">日本人選手の出場記録はありません。</div>
      )}
    </div>
  );
}
