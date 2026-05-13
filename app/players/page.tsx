import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { PlayerListCard } from "@/app/_components/PlayerListCard";
import { selectPlayerIndex } from "@/lib/queries/player-index";

export const revalidate = 1800;

const TABS = [
  { key: undefined, label: "全て" },
  { key: "pro", label: "プロ / Jr ATPランカー" },
  { key: "college", label: "大学生" },
  { key: "futures", label: "フューチャーズ" },
  { key: "wta", label: "WTA女子" },
] as const;

type Cat = "pro" | "college" | "futures" | "wta";

export default async function PlayersIndexPage({
  searchParams,
}: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const filter: Cat | undefined =
    category === "pro" || category === "college" || category === "futures" || category === "wta"
      ? (category as Cat)
      : undefined;
  const data = await selectPlayerIndex(filter);

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/players" />
      <div className="px-4 py-4">
        <h1 className="text-fg font-extrabold text-lg mb-3">選手一覧</h1>
        {/* Tab bar — horizontal scroll on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4 -mx-4 px-4 scrollbar-none">
          {TABS.map((t) => {
            const count = t.key === "wta"
              ? data.counts.wta
              : t.key
                ? data.counts[t.key as keyof typeof data.counts]
                : data.counts.total;
            return (
              <Link
                key={t.key ?? "all"}
                href={t.key ? `/players?category=${t.key}` : "/players"}
                className={`shrink-0 px-3 py-2 text-[10px] tracking-wide font-bold bg-bg-card min-h-[44px] flex items-center ${
                  filter === t.key ? "text-signal-yellow" : "text-fg-muted"
                }`}
              >
                {t.label}&nbsp;·&nbsp;{count}
              </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {data.players.map((p) => <PlayerListCard key={p.slug} player={p} />)}
          {data.players.length === 0 && (
            <div className="text-fg-muted text-[12px]">該当する選手はありません。</div>
          )}
        </div>
      </div>
    </main>
  );
}
