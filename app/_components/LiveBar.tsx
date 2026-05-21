import Link from "next/link";
import type { TopPageData } from "@/lib/queries/top-page";

const LEVEL_LABEL: Record<string, string> = {
  atp: "ATP",
  challenger: "CH",
  futures_25: "M25",
  futures_15: "M15",
};

const LEVEL_COLOR: Record<string, string> = {
  atp: "text-signal-yellow border-signal-yellow",
  challenger: "text-signal-orange border-signal-orange",
  futures_25: "text-signal-yellow border-signal-yellow",
  futures_15: "text-fg-muted border-line",
};

const ROUND_JA: Record<string, string> = {
  F: "決勝", SF: "準決勝", QF: "準々決勝",
  R16: "ベスト16", R32: "R32", R64: "R64", R128: "R128",
};

export function LiveBar({ entries }: { entries: TopPageData["aliveEntries"] }) {
  if (entries.length === 0) return null;

  return (
    <div className="border-b border-line bg-bg-panel">
      <div className="flex items-start gap-x-4 gap-y-1 flex-wrap px-4 py-2.5">
        <span className="text-[9px] font-extrabold tracking-widest text-signal-red shrink-0 mt-0.5">
          ● LIVE
        </span>
        {entries.map((e) => {
          const levelCls = LEVEL_COLOR[e.tournamentLevel] ?? "text-fg-muted border-line";
          const roundJa = ROUND_JA[e.currentRound] ?? e.currentRound;
          return (
            <div key={e.playerSlug} className="flex items-center gap-1.5 text-[11px]">
              <Link
                href={`/players/${e.playerSlug}`}
                className="font-bold text-fg hover:text-signal-yellow transition-colors"
              >
                {e.playerName}
              </Link>
              <span className={`text-[9px] font-bold border px-1 py-px leading-none ${levelCls}`}>
                {LEVEL_LABEL[e.tournamentLevel] ?? e.tournamentLevel.toUpperCase()}
              </span>
              <Link
                href={`/tournaments/${e.tournamentSlug}`}
                className="text-fg-muted hover:text-fg transition-colors truncate max-w-[120px]"
              >
                {e.tournamentName}
              </Link>
              <span className="text-fg-quiet">·</span>
              <span className="text-fg-muted">{roundJa}</span>
            </div>
          );
        })}
        <a
          href="https://www.flashscore.com/tennis"
          target="_blank"
          rel="noopener"
          className="text-[9px] text-fg-quiet hover:text-signal-yellow transition-colors ml-auto shrink-0 self-center"
        >
          スコア → Flashscore
        </a>
      </div>
    </div>
  );
}
