import Link from "next/link";

const TAG_LABEL: Record<string, string> = {
  interview: "PRO INTERVIEW",
  profile: "PROFILE",
  tournament: "TOURNAMENT",
  column: "COLUMN",
};

export type ArticleListItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  authors: string;
  publishedAt: string;
  readMinutes: number;
};

export function ArticleListCard({ a }: { a: ArticleListItem }) {
  return (
    <Link href={`/articles/${a.slug}`} className="bg-bg-panel border border-line p-4 block hover:border-fg-muted">
      <div className="text-signal-orange text-[9px] tracking-widest font-extrabold">
        {TAG_LABEL[a.category] ?? a.category.toUpperCase()}
      </div>
      <h2 className="text-fg font-extrabold text-lg mt-1.5">{a.title}</h2>
      <p className="text-fg-muted text-[12px] mt-1.5 line-clamp-2">{a.excerpt}</p>
      <div className="text-fg-quiet text-[10px] mt-3">{a.publishedAt} · {a.readMinutes}分 · {a.authors}</div>
    </Link>
  );
}
