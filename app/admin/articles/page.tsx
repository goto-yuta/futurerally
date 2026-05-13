import { db } from "@/lib/db/client";
import { articles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  interview: "インタビュー",
  profile: "プロフィール",
  tournament: "大会レポート",
  column: "コラム",
};

export default async function AdminArticlesPage() {
  const rows = await db.select({
    id: articles.id,
    slug: articles.slug,
    title: articles.title,
    category: articles.category,
    authors: articles.authors,
    publishedAt: articles.publishedAt,
  })
    .from(articles)
    .orderBy(desc(articles.publishedAt));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-fg font-bold text-lg">記事</h1>
        <span className="text-fg-quiet text-[11px] ml-auto">{rows.length}件</span>
      </div>

      {rows.length === 0 ? (
        <div className="bg-bg-panel border border-line rounded-sm p-6 text-fg-muted text-[13px]">
          記事がありません。<code className="bg-bg px-1">content/articles/</code> に MDX ファイルを追加して{" "}
          <code className="bg-bg px-1">npm run articles:sync</code> を実行してください。
        </div>
      ) : (
        <div className="bg-bg-panel border border-line rounded-sm overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-fg-quiet text-[10px] uppercase tracking-wider">
                <th className="text-left px-3 py-2">タイトル</th>
                <th className="text-left px-3 py-2 w-28">カテゴリ</th>
                <th className="text-left px-3 py-2 w-28 hidden sm:table-cell">公開日</th>
                <th className="text-left px-3 py-2 w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={a.id} className={`border-b border-line hover:bg-bg-card ${i % 2 === 0 ? "" : "bg-bg/30"}`}>
                  <td className="px-3 py-2">
                    <div className="text-fg">{a.title}</div>
                    <div className="text-fg-quiet text-[10px] font-mono">{a.slug}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-fg-muted text-[10px] font-bold uppercase">
                      {CATEGORY_LABEL[a.category] ?? a.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-fg-muted tabular-nums hidden sm:table-cell">
                    {a.publishedAt.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/articles/${a.slug}`}
                      target="_blank"
                      className="text-[10px] text-fg-quiet hover:text-signal-yellow transition-colors"
                    >
                      表示 ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 bg-bg-panel border border-line rounded-sm p-4 text-[12px] text-fg-muted">
        記事の追加・編集は MDX ファイルで行い、<code className="bg-bg px-1">npm run articles:sync</code> でDBに反映されます。
      </div>
    </div>
  );
}
