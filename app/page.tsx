import Link from "next/link";
import { SiteHeader } from "./_components/SiteHeader";
import { HeroStory } from "./_components/HeroStory";
import { TodayStatusPanel } from "./_components/TodayStatusPanel";
import { FeaturedPlayersRow } from "./_components/FeaturedPlayersRow";
import { ArticleCard } from "./_components/ArticleCard";
import { PlayerIndexTeaser } from "./_components/PlayerIndexTeaser";
import { FuturesSection } from "./_components/FuturesSection";
import { selectTopPageData } from "@/lib/queries/top-page";
import { selectFuturesRecent } from "@/lib/queries/futures-recent";

export const revalidate = 1800;

export default async function Home() {
  const [data, futuresData] = await Promise.all([
    selectTopPageData(),
    selectFuturesRecent(3),
  ]);

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/" />

      <section className="grid grid-cols-1 md:grid-cols-[2.2fr_1fr] border-b border-line">
        {data.heroStory ? (
          <HeroStory
            kicker="PRO × FUTURES"
            title={data.heroStory.title}
            meta={data.heroStory.excerpt ?? ""}
            href={`/articles/${data.heroStory.slug}`}
          />
        ) : (
          <div className="bg-bg-panel p-5 border-r border-line text-fg-muted">記事準備中</div>
        )}
        <TodayStatusPanel alive={data.aliveEntries} recent={data.recentResults} />
      </section>

      <FeaturedPlayersRow players={data.featuredPlayers} />

      <FuturesSection data={futuresData} />

      <section>
        <div className="flex justify-between items-center px-4 pt-4 pb-2">
          <div className="text-[9px] tracking-widest text-fg-muted font-extrabold">— 最新記事</div>
          <Link href="/articles" className="text-[9px] text-signal-yellow font-bold">記事一覧 ＞</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 px-4 pb-4">
          {data.latestArticles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      <PlayerIndexTeaser
        totalCount={data.playerCounts.total}
        categories={[
          { label: "プロ", href: "/players?category=pro", count: data.playerCounts.pro },
          { label: "大学生", href: "/players?category=college", count: data.playerCounts.college },
          { label: "フューチャーズ", href: "/players?category=futures", count: data.playerCounts.futures },
        ]}
      />
    </main>
  );
}
