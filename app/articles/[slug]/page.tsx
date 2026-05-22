import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { ArticleHero } from "@/app/_components/article/ArticleHero";
import { ArticleBody } from "@/app/_components/article/ArticleBody";
import { TaggedPlayersSidebar } from "@/app/_components/article/TaggedPlayersSidebar";
import { selectArticleDetail } from "@/lib/queries/article-detail";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await selectArticleDetail(slug);
  if (!a) return {};
  return {
    title: `${a.title} | Ultimate Forehand`,
    description: a.excerpt,
    openGraph: {
      title: a.title,
      description: a.excerpt,
      type: "article",
      images: a.heroImageUrl ? [a.heroImageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: a.title,
      description: a.excerpt,
    },
  };
}

export default async function ArticlePage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await selectArticleDetail(slug);
  if (!a) notFound();

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/articles" />
      <ArticleHero
        title={a.title} excerpt={a.excerpt} category={a.category}
        authors={a.authors} publishedAt={a.publishedAt}
        readMinutes={a.readMinutes} heroImageUrl={a.heroImageUrl}
      />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0 md:gap-6 px-0 md:px-4 py-0 md:py-6 max-w-5xl md:mx-auto">
        <ArticleBody source={a.body} />
        <TaggedPlayersSidebar players={a.taggedPlayers} />
      </div>
    </main>
  );
}
