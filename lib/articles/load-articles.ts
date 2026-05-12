import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { articleFrontmatterSchema, type ArticleFrontmatter } from "./frontmatter-schema";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export type LoadedArticle = ArticleFrontmatter & {
  slug: string;
  body: string;
  readMinutes: number;
};

async function readArticleFile(filePath: string): Promise<LoadedArticle> {
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fm = articleFrontmatterSchema.parse(data);
  const slug = path.basename(filePath, ".mdx");
  const stats = readingTime(content);
  return {
    ...fm,
    slug,
    body: content,
    readMinutes: Math.max(1, Math.round(stats.minutes)),
  };
}

export async function loadAllArticles(): Promise<LoadedArticle[]> {
  const entries = await fs.readdir(ARTICLES_DIR);
  const mdxFiles = entries.filter((e) => e.endsWith(".mdx"));
  const articles = await Promise.all(
    mdxFiles.map((f) => readArticleFile(path.join(ARTICLES_DIR, f))),
  );
  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function loadArticleBySlug(slug: string): Promise<LoadedArticle | null> {
  try {
    return await readArticleFile(path.join(ARTICLES_DIR, `${slug}.mdx`));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "ENOENT") {
      return null;
    }
    throw e;
  }
}
