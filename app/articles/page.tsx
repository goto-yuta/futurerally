import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { ArticleListCard } from "@/app/_components/article/ArticleListCard";
import { selectArticleIndex } from "@/lib/queries/article-index";

export const revalidate = 1800;

const CATEGORY_TABS = [
  { key: undefined, label: "全て" },
  { key: "interview", label: "インタビュー" },
  { key: "profile", label: "プロフィール" },
  { key: "tournament", label: "大会" },
  { key: "column", label: "コラム" },
] as const;

type Cat = "interview" | "profile" | "tournament" | "column";

export default async function ArticlesIndexPage({
  searchParams,
}: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const filter: Cat | undefined =
    category === "interview" || category === "profile" || category === "tournament" || category === "column"
      ? (category as Cat)
      : undefined;
  const data = await selectArticleIndex(filter);

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/articles" />
      <div className="px-4 py-4 max-w-5xl mx-auto">
        <h1 className="text-fg font-extrabold text-lg mb-3">記事一覧 ({data.counts.total})</h1>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {CATEGORY_TABS.map((t) => {
            const count = t.key ? data.counts[t.key] : data.counts.total;
            return (
              <Link
                key={t.key ?? "all"}
                href={t.key ? `/articles?category=${t.key}` : "/articles"}
                className={`px-2.5 py-1 text-[10px] tracking-wide font-bold bg-bg-card ${
                  filter === t.key ? "text-signal-yellow" : "text-fg-muted"
                }`}
              >
                {t.label} · {count}
              </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.articles.map((a) => <ArticleListCard key={a.slug} a={a} />)}
          {data.articles.length === 0 && (
            <div className="text-fg-muted text-[12px]">該当する記事はありません。</div>
          )}
        </div>
      </div>
    </main>
  );
}
