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
] as const;

type Cat = "pro" | "college" | "futures";

export default async function PlayersIndexPage({
  searchParams,
}: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const filter: Cat | undefined =
    category === "pro" || category === "college" || category === "futures"
      ? (category as Cat)
      : undefined;
  const data = await selectPlayerIndex(filter);

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/players" />
      <div className="px-4 py-4">
        <h1 className="text-fg font-extrabold text-lg mb-3">選手一覧</h1>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {TABS.map((t) => {
            const count = t.key ? data.counts[t.key] : data.counts.total;
            return (
              <Link
                key={t.key ?? "all"}
                href={t.key ? `/players?category=${t.key}` : "/players"}
                className={`px-2.5 py-1 text-[10px] tracking-wide font-bold bg-bg-card ${
                  filter === t.key ? "text-signal-yellow" : "text-fg-muted"
                }`}
              >
                {t.label} · {count}人
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
