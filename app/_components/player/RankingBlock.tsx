import { RankingSparkline } from "./RankingSparkline";

const COLOR_CLS: Record<string, string> = {
  yellow: "text-signal-yellow",
  fg: "text-fg",
  green: "text-signal-green",
};

export function RankingBlock({
  jtaRank, atpRank, recentWL, sparkline,
}: {
  jtaRank: number | null;
  atpRank: number | null;
  recentWL: { wins: number; losses: number };
  sparkline: number[];
}) {
  return (
    <div className="bg-bg-panel border border-line p-3.5">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-2.5">
        — RANKING & 直近成績
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="JTA" value={jtaRank ? `#${jtaRank}` : "—"} color="yellow" />
        <Stat label="ATP" value={atpRank ? `${atpRank}` : "—"} color="fg" />
        <Stat label="直近6ヶ月 W-L" value={`${recentWL.wins}-${recentWL.losses}`} color="green" />
      </div>
      <div className="text-[8px] text-fg-muted mb-1">JTAランキング推移(12ヶ月)</div>
      <RankingSparkline points={sparkline} highlightLast={3} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[9px] text-fg-muted">{label}</div>
      <div className={`tabular text-[22px] font-black ${COLOR_CLS[color] ?? "text-fg"}`}>{value}</div>
    </div>
  );
}
