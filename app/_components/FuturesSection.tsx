import Link from "next/link";
import type { FuturesRecentData } from "@/lib/queries/futures-recent";

const LEVEL_LABEL: Record<string, string> = {
  futures_25: "M25",
  futures_15: "M15",
};

const LEVEL_COLOR: Record<string, string> = {
  futures_25: "text-signal-yellow border-signal-yellow",
  futures_15: "text-fg-muted border-line",
};

const STATUS_ICON: Record<string, string> = {
  alive: "🟡",
  champion: "🏆",
  won: "✓",
  lost: "✗",
  scheduled: "◦",
};

const STATUS_COLOR: Record<string, string> = {
  alive: "text-signal-yellow font-extrabold",
  champion: "text-signal-yellow font-extrabold",
  won: "text-signal-green",
  lost: "text-fg-quiet",
  scheduled: "text-fg-muted",
};

export function FuturesSection({ data }: { data: FuturesRecentData }) {
  if (data.blocks.length === 0) return null;

  // Separate ongoing (has alive entries) from completed
  const ongoing = data.blocks.filter((b) => b.entries.some((e) => e.status === "alive"));
  const recent = data.blocks.filter((b) => !b.entries.some((e) => e.status === "alive")).slice(0, 3);

  return (
    <section className="border-t border-line">
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="text-[9px] tracking-widest text-fg-muted font-extrabold flex items-center gap-2">
          — FUTURES · 日本人出場情報
        </div>
        <div className="flex items-center gap-3">
          {data.dataAsOf && (
            <span className="text-[8px] text-fg-quiet tracking-wide">
              Sackmann更新: {data.dataAsOf}
            </span>
          )}
          <Link href="/rankings?tour=atp" className="text-[9px] text-signal-yellow font-bold">
            ランキング ＞
          </Link>
        </div>
      </div>

      <div className="px-4 pb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Ongoing tournaments first */}
        {ongoing.map((block) => (
          <TournamentCard key={block.tournamentSlug} block={block} isOngoing />
        ))}
        {/* Recent completed */}
        {recent.map((block) => (
          <TournamentCard key={block.tournamentSlug} block={block} isOngoing={false} />
        ))}
      </div>

      <div className="px-4 pb-3 text-[9px] text-fg-quiet">
        ※ フューチャーズのライブデータはITF公式が非公開のため、Sackmann weekly CSV（毎週月曜自動更新）を使用しています。
        試合中の最新スコアは
        <a
          href="https://www.flashscore.com"
          target="_blank"
          rel="noopener"
          className="underline ml-1 hover:text-signal-yellow"
        >
          Flashscore
        </a>
        でご確認ください。
      </div>
    </section>
  );
}

function TournamentCard({
  block, isOngoing,
}: {
  block: FuturesRecentData["blocks"][number];
  isOngoing: boolean;
}) {
  const levelCls = LEVEL_COLOR[block.level] ?? "text-fg-muted border-line";

  return (
    <div
      className={`bg-bg-panel border-l-2 p-3 ${
        isOngoing ? "border-signal-yellow" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`text-[9px] font-extrabold tracking-widest px-1 py-0.5 border ${levelCls}`}
            >
              {LEVEL_LABEL[block.level] ?? block.level.toUpperCase()}
            </span>
            {isOngoing && (
              <span className="text-[9px] text-signal-yellow font-extrabold tracking-widest">
                ● 進行中
              </span>
            )}
          </div>
          <div className="text-[12px] font-bold text-fg leading-tight">{block.tournamentNameJa}</div>
        </div>
        <div className="text-[9px] text-fg-quiet shrink-0">{block.startDate}</div>
      </div>

      <ul className="flex flex-col gap-1">
        {block.entries.slice(0, 5).map((e) => (
          <li key={e.playerSlug} className="flex items-center justify-between gap-2">
            <Link
              href={`/players/${e.playerSlug}`}
              className={`text-[11px] font-semibold ${
                e.status === "alive" || e.status === "champion"
                  ? "text-fg hover:text-signal-yellow"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {e.playerNameJa}
            </Link>
            <span className={`text-[10px] tabular shrink-0 ${STATUS_COLOR[e.status] ?? "text-fg-muted"}`}>
              {STATUS_ICON[e.status]} {e.currentRound ?? ""}
              {e.lastMatchSummary && e.status !== "alive"
                ? ` (${e.lastMatchSummary.split(" ").slice(0, 2).join(" ")})`
                : ""}
            </span>
          </li>
        ))}
        {block.entries.length > 5 && (
          <li className="text-[9px] text-fg-quiet">+{block.entries.length - 5}名</li>
        )}
      </ul>
    </div>
  );
}
