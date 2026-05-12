import Link from "next/link";

export type ArticleSummary = {
  slug: string;
  category: string;
  title: string;
  publishedAt: string;
  readMinutes: number;
};

const TAG_LABEL: Record<string, string> = {
  interview: "PRO INTERVIEW",
  profile: "PROFILE",
  tournament: "TOURNAMENT",
  column: "COLUMN",
};

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="bg-bg-panel border border-line p-2.5 block hover:border-fg-muted"
    >
      <div className="text-signal-orange text-[8px] tracking-widest font-extrabold">
        {TAG_LABEL[article.category] ?? article.category.toUpperCase()}
      </div>
      <div className="text-fg font-semibold text-[11px] mt-1">{article.title}</div>
      <div className="text-fg-quiet text-[8px] mt-1.5">
        {article.publishedAt} · {article.readMinutes}分
      </div>
    </Link>
  );
}
