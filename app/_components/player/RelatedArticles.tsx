import Link from "next/link";

export type RelatedArticle = {
  slug: string;
  title: string;
  publishedAt: string;
};

export function RelatedArticles({ articles }: { articles: RelatedArticle[] }) {
  return (
    <div className="bg-bg-panel border border-line p-3.5">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-2.5">
        — 関連記事 / {articles.length}本
      </div>
      <ul className="flex flex-col gap-1.5">
        {articles.map((a) => (
          <li key={a.slug} className="border-b border-line pb-1.5 last:border-b-0">
            <Link href={`/articles/${a.slug}`} className="text-[11px] text-fg font-semibold hover:text-signal-yellow">
              {a.title}
            </Link>
            <span className="text-fg-quiet text-[9px] ml-1.5">({a.publishedAt})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
