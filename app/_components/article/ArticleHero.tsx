import Image from "next/image";

const CATEGORY_LABEL: Record<string, string> = {
  interview: "PRO INTERVIEW",
  profile: "PROFILE",
  tournament: "TOURNAMENT",
  column: "COLUMN",
};

export function ArticleHero({
  title, excerpt, category, authors, publishedAt, readMinutes, heroImageUrl,
}: {
  title: string;
  excerpt: string;
  category: string;
  authors: string;
  publishedAt: string;
  readMinutes: number;
  heroImageUrl: string | null;
}) {
  return (
    <header className="px-4 py-8 bg-bg-panel border-b border-line">
      <div className="text-[10px] tracking-widest text-signal-orange font-extrabold mb-3">
        {CATEGORY_LABEL[category] ?? category.toUpperCase()}
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-fg tracking-tighter leading-tight max-w-3xl">
        {title}
      </h1>
      <p className="text-fg-muted text-base mt-4 max-w-2xl">{excerpt}</p>
      <div className="text-[10px] text-fg-quiet mt-4 flex gap-3">
        <span>{authors}</span>
        <span>·</span>
        <span>{publishedAt}</span>
        <span>·</span>
        <span>{readMinutes}分</span>
      </div>
      {heroImageUrl && (
        <Image src={heroImageUrl} alt={title} width={1200} height={630} className="mt-6 w-full" />
      )}
    </header>
  );
}
