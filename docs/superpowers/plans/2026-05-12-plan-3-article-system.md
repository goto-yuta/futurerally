# FutureRally Plan 3: Article System (MDX) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the article system: authors write MDX files in `/content/articles/`, the site renders them with B1-styled typography, tagged players auto-link to their profile pages, and `/articles` provides a category-filterable index.

**Architecture:** Articles live as `.mdx` files in `content/articles/` with frontmatter (title, excerpt, category, hero_image, authors, published_at, tagged_players, tagged_pros, tagged_tournaments). On build the loader parses all frontmatter, syncs `articles` + `article_players` + `article_tournaments` rows to the DB, then `/articles/[slug]` renders with `next-mdx-remote/rsc`. Custom MDX components apply B1 theme to `h2`/`h3`/`blockquote`/etc.

**Tech Stack:** `next-mdx-remote` v5+, `gray-matter` (frontmatter), `zod`, `reading-time` (estimate).

**Prerequisites:** Plans 1 and 2 complete.

**Related Spec:** `docs/superpowers/specs/2026-05-12-futurerally-tennis-media-design.md` sections 3.3, 4 (Article model), 7.1.

---

## File Structure

```
content/
└── articles/
    ├── nishioka-yamada-talk.mdx              # Sample article (migrated from seed)
    └── README.md                              # Author guide
app/
├── articles/
│   ├── page.tsx                              # /articles index
│   └── [slug]/
│       └── page.tsx                          # /articles/<slug>
└── _components/
    └── article/
        ├── ArticleHero.tsx                   # Title + hero image + meta
        ├── ArticleBody.tsx                   # MDX renderer with theme
        ├── TaggedPlayersSidebar.tsx          # Mini player cards
        ├── ArticleListCard.tsx               # Used on /articles index
        └── MdxComponents.tsx                 # B1-styled h1/h2/p/blockquote/etc.
lib/
├── articles/
│   ├── frontmatter-schema.ts                 # Zod schema for frontmatter
│   ├── load-articles.ts                      # Filesystem reader
│   └── sync-articles.ts                      # Sync MDX → DB
├── queries/
│   ├── article-detail.ts                     # SELECT article + tagged players
│   └── article-index.ts                      # SELECT articles by category
scripts/
└── sync-articles.ts                          # CLI to run sync (called by npm run + on deploy)
tests/
├── unit/
│   ├── articles/
│   │   ├── frontmatter-schema.test.ts
│   │   └── load-articles.test.ts
│   ├── components/article/
│   │   └── MdxComponents.test.tsx
│   └── queries/
│       ├── article-detail.test.ts
│       └── article-index.test.ts
└── e2e/
    └── article-pages.spec.ts
```

---

## Task 1: Install MDX deps

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
npm install next-mdx-remote gray-matter reading-time
npm install -D @types/mdx
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install MDX deps (next-mdx-remote, gray-matter, reading-time)"
```

---

## Task 2: Frontmatter zod schema + tests

**Files:**
- Create: `lib/articles/frontmatter-schema.ts`
- Test: `tests/unit/articles/frontmatter-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { articleFrontmatterSchema } from '@/lib/articles/frontmatter-schema';

describe('articleFrontmatterSchema', () => {
  const valid = {
    title: 'タイトル',
    excerpt: 'リード',
    category: 'interview',
    authors: '編集部',
    publishedAt: '2026-05-12',
    heroImage: 'https://cdn/img.jpg',
    taggedPlayers: ['yamada-sho', 'nishioka-yoshihito'],
    taggedPros: ['西岡良仁'],
    taggedTournaments: ['roanne-challenger-2026'],
  };

  it('accepts valid frontmatter', () => {
    expect(articleFrontmatterSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown category', () => {
    expect(articleFrontmatterSchema.safeParse({ ...valid, category: 'gossip' }).success).toBe(false);
  });

  it('rejects bad date', () => {
    expect(articleFrontmatterSchema.safeParse({ ...valid, publishedAt: 'not-a-date' }).success).toBe(false);
  });

  it('treats arrays as optional with default []', () => {
    const { title, excerpt, category, authors, publishedAt } = valid;
    const r = articleFrontmatterSchema.parse({ title, excerpt, category, authors, publishedAt });
    expect(r.taggedPlayers).toEqual([]);
    expect(r.taggedPros).toEqual([]);
    expect(r.taggedTournaments).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/articles/frontmatter-schema.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `lib/articles/frontmatter-schema.ts`**

```ts
import { z } from 'zod';

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'invalid date' });

export const articleFrontmatterSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.enum(['interview', 'profile', 'tournament', 'column']),
  authors: z.string().min(1),
  publishedAt: isoDate,
  heroImage: z.string().url().optional(),
  taggedPlayers: z.array(z.string()).default([]),
  taggedPros: z.array(z.string()).default([]),
  taggedTournaments: z.array(z.string()).default([]),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/articles/frontmatter-schema.test.ts
```
Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/articles/frontmatter-schema.ts tests/unit/articles/frontmatter-schema.test.ts
git commit -m "feat: add article frontmatter zod schema"
```

---

## Task 3: Filesystem article loader

**Files:**
- Create: `lib/articles/load-articles.ts`
- Test: `tests/unit/articles/load-articles.test.ts`
- Create: `content/articles/` (directory)

- [ ] **Step 1: Create the content directory and a sample MDX**

```bash
mkdir -p content/articles
```

Create `content/articles/nishioka-yamada-talk.mdx`:
```mdx
---
title: '「俺もここで泣いた」西岡が、F級で戦う後輩へ。'
excerpt: '西岡良仁 × 山田翔 / 6,200字 — F級時代に味わった挫折と、いま挑む後輩への言葉。'
category: interview
authors: 編集部
publishedAt: 2026-05-12
taggedPlayers:
  - yamada-sho
  - nishioka-yoshihito
taggedPros:
  - 西岡 良仁
---

## なぜいま、後輩を訪ねたのか

西岡: 「俺が20歳のころ、誰かに同じことを言ってほしかった」

## F級で泣いた日のこと

山田: 「正直、辞めようと思った夜は何回もありました」

> 「フォアの威力は同世代でトップクラス。あとは経験。海外で戦えば化ける。」
> — 西岡 良仁

## ここから、どう動くか

山田: 「来週からヨーロッパ遠征に出ます」
```

- [ ] **Step 2: Write the failing test for the loader**

`tests/unit/articles/load-articles.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadAllArticles, loadArticleBySlug } from '@/lib/articles/load-articles';

describe('loadAllArticles', () => {
  it('reads MDX files from content/articles', async () => {
    const articles = await loadAllArticles();
    expect(articles.length).toBeGreaterThan(0);
    const sample = articles.find((a) => a.slug === 'nishioka-yamada-talk');
    expect(sample).toBeTruthy();
    expect(sample!.title).toContain('俺もここで泣いた');
    expect(sample!.category).toBe('interview');
  });

  it('computes readMinutes from body length', async () => {
    const article = await loadArticleBySlug('nishioka-yamada-talk');
    expect(article).not.toBeNull();
    expect(article!.readMinutes).toBeGreaterThanOrEqual(1);
  });

  it('returns null for missing slug', async () => {
    const a = await loadArticleBySlug('nope');
    expect(a).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- tests/unit/articles/load-articles.test.ts
```
Expected: FAIL.

- [ ] **Step 4: Implement `lib/articles/load-articles.ts`**

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { articleFrontmatterSchema, type ArticleFrontmatter } from './frontmatter-schema';

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

export type LoadedArticle = ArticleFrontmatter & {
  slug: string;
  body: string;
  readMinutes: number;
};

async function readArticleFile(filePath: string): Promise<LoadedArticle> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const fm = articleFrontmatterSchema.parse(data);
  const slug = path.basename(filePath, '.mdx');
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
  const mdxFiles = entries.filter((e) => e.endsWith('.mdx'));
  const articles = await Promise.all(
    mdxFiles.map((f) => readArticleFile(path.join(ARTICLES_DIR, f))),
  );
  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function loadArticleBySlug(slug: string): Promise<LoadedArticle | null> {
  try {
    return await readArticleFile(path.join(ARTICLES_DIR, `${slug}.mdx`));
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'ENOENT') return null;
    throw e;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/articles/load-articles.test.ts
```
Expected: 3 tests passing.

- [ ] **Step 6: Create `content/articles/README.md`**

```md
# Articles

Each article is a single `.mdx` file in this directory. The filename (without `.mdx`) becomes the slug.

## Frontmatter

```yaml
---
title: 'タイトル'
excerpt: 'リード文(150文字程度)'
category: interview | profile | tournament | column
authors: 著者名
publishedAt: 2026-05-12
heroImage: https://cdn.example/image.jpg     # optional
taggedPlayers:                                # optional, list of player slugs
  - yamada-sho
taggedPros:                                   # optional, free-text pro names
  - 西岡 良仁
taggedTournaments:                            # optional, tournament slugs
  - roanne-challenger-2026
---
```

## After Editing

Run `npm run articles:sync` to upsert into the database. CI does this automatically on deploy.
```

- [ ] **Step 7: Commit**

```bash
git add content/ lib/articles/load-articles.ts tests/unit/articles/load-articles.test.ts
git commit -m "feat: add filesystem article loader with frontmatter parsing"
```

---

## Task 4: Sync MDX articles to DB

**Files:**
- Create: `lib/articles/sync-articles.ts`
- Create: `scripts/sync-articles.ts`
- Modify: `package.json` (add `articles:sync` script)

- [ ] **Step 1: Implement `lib/articles/sync-articles.ts`**

```ts
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { articles, articlePlayers, articleTournaments, players, tournaments } from '@/lib/db/schema';
import { loadAllArticles } from './load-articles';

export async function syncArticles(): Promise<{ inserted: number; updated: number; skipped: string[] }> {
  const loaded = await loadAllArticles();
  let inserted = 0;
  let updated = 0;
  const skipped: string[] = [];

  for (const a of loaded) {
    const playerIds = await resolveSlugIds(a.taggedPlayers, players);
    const tournamentIds = await resolveSlugIds(a.taggedTournaments, tournaments);

    if (a.taggedPlayers.length !== playerIds.length) {
      const missing = a.taggedPlayers.filter((_, i) => playerIds[i] === undefined);
      skipped.push(`${a.slug}: missing player slugs ${missing.join(', ')}`);
    }

    const [existing] = await db.select().from(articles).where(eq(articles.slug, a.slug)).limit(1);

    const payload = {
      slug: a.slug, title: a.title, excerpt: a.excerpt, body: a.body,
      category: a.category, heroImageUrl: a.heroImage ?? null,
      authors: a.authors, publishedAt: new Date(a.publishedAt),
      updatedAt: new Date(),
    };

    let articleId: number;
    if (existing) {
      await db.update(articles).set(payload).where(eq(articles.id, existing.id));
      articleId = existing.id;
      updated++;
    } else {
      const [row] = await db.insert(articles).values(payload).returning();
      articleId = row.id;
      inserted++;
    }

    await db.delete(articlePlayers).where(eq(articlePlayers.articleId, articleId));
    if (playerIds.length > 0) {
      await db.insert(articlePlayers).values(
        playerIds.filter((id): id is number => id !== undefined).map((playerId) => ({ articleId, playerId })),
      );
    }

    await db.delete(articleTournaments).where(eq(articleTournaments.articleId, articleId));
    if (tournamentIds.length > 0) {
      await db.insert(articleTournaments).values(
        tournamentIds.filter((id): id is number => id !== undefined).map((tournamentId) => ({ articleId, tournamentId })),
      );
    }
  }

  return { inserted, updated, skipped };
}

async function resolveSlugIds<T extends { slug: typeof players.slug; id: typeof players.id }>(
  slugs: string[],
  table: { slug: typeof players.slug; id: typeof players.id } | { slug: typeof tournaments.slug; id: typeof tournaments.id },
): Promise<(number | undefined)[]> {
  if (slugs.length === 0) return [];
  const rows = await db
    .select({ id: (table as any).id, slug: (table as any).slug })
    .from(table as any);
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.slug, r.id);
  return slugs.map((s) => map.get(s));
}
```

- [ ] **Step 2: Implement `scripts/sync-articles.ts`**

```ts
import 'dotenv/config';
import { syncArticles } from '@/lib/articles/sync-articles';

async function main() {
  const result = await syncArticles();
  console.log(`Articles sync: ${result.inserted} inserted, ${result.updated} updated`);
  if (result.skipped.length > 0) {
    console.warn('Warnings:');
    for (const w of result.skipped) console.warn(' -', w);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Add npm script in `package.json`**

```json
"articles:sync": "tsx scripts/sync-articles.ts"
```

- [ ] **Step 4: Run the sync**

```bash
npm run articles:sync
```
Expected: `Articles sync: 0 inserted, 1 updated` (because the seed already inserted the row in Plan 1 Task 12). Body is now replaced with MDX content from filesystem.

Verify in Supabase Studio that `articles.body` of `nishioka-yamada-talk` now contains the MDX with `## なぜいま、後輩を訪ねたのか`.

- [ ] **Step 5: Commit**

```bash
git add lib/articles/sync-articles.ts scripts/sync-articles.ts package.json
git commit -m "feat: add article sync — MDX files → DB rows"
```

---

## Task 5: MdxComponents (B1-themed)

**Files:**
- Create: `app/_components/article/MdxComponents.tsx`
- Test: `tests/unit/components/article/MdxComponents.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { mdxComponents } from '@/app/_components/article/MdxComponents';

describe('mdxComponents', () => {
  it('renders h2 with B1 style', () => {
    const H2 = mdxComponents.h2;
    render(<H2>見出し</H2>);
    const h = screen.getByRole('heading', { level: 2 });
    expect(h.className).toMatch(/text-fg/);
    expect(h.className).toMatch(/font-extrabold/);
  });

  it('renders blockquote with yellow left border', () => {
    const Bq = mdxComponents.blockquote;
    render(<Bq>引用</Bq>);
    const bq = screen.getByText('引用').closest('blockquote');
    expect(bq?.className).toMatch(/border-signal-yellow/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/article/MdxComponents.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement `app/_components/article/MdxComponents.tsx`**

```tsx
import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';

export const mdxComponents: MDXComponents = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="text-3xl font-black text-fg tracking-tighter mt-8 mb-4" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-2xl font-extrabold text-fg tracking-tight mt-8 mb-3 border-l-4 border-signal-yellow pl-3" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-lg font-bold text-fg mt-6 mb-2" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="text-fg text-[15px] leading-7 my-3" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-signal-yellow underline underline-offset-2 hover:text-signal-orange" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc pl-6 my-3 text-fg" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal pl-6 my-3 text-fg" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="my-1" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="border-l-4 border-signal-yellow pl-4 my-5 text-fg italic text-[16px] leading-7" {...props} />
  ),
  hr: () => <hr className="border-border my-8" />,
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code className="bg-bg-card text-signal-yellow px-1 py-0.5 text-[13px]" {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="bg-bg-card border border-border p-3 my-4 text-[13px] text-fg overflow-x-auto" {...props} />
  ),
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/article/MdxComponents.test.tsx
```
Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/article/MdxComponents.tsx tests/unit/components/article/MdxComponents.test.tsx
git commit -m "feat: add B1-themed MDX components"
```

---

## Task 6: ArticleHero + ArticleBody + TaggedPlayersSidebar + ArticleListCard

**Files:**
- Create: `app/_components/article/ArticleHero.tsx`
- Create: `app/_components/article/ArticleBody.tsx`
- Create: `app/_components/article/TaggedPlayersSidebar.tsx`
- Create: `app/_components/article/ArticleListCard.tsx`

- [ ] **Step 1: Implement `app/_components/article/ArticleHero.tsx`**

```tsx
import Image from 'next/image';

const CATEGORY_LABEL: Record<string, string> = {
  interview: 'PRO INTERVIEW',
  profile: 'PROFILE',
  tournament: 'TOURNAMENT',
  column: 'COLUMN',
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
    <header className="px-4 py-8 bg-bg-panel border-b border-border">
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
```

- [ ] **Step 2: Implement `app/_components/article/ArticleBody.tsx`**

```tsx
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from './MdxComponents';

export function ArticleBody({ source }: { source: string }) {
  return (
    <article className="px-4 py-8 max-w-3xl mx-auto">
      <MDXRemote source={source} components={mdxComponents} />
    </article>
  );
}
```

- [ ] **Step 3: Implement `app/_components/article/TaggedPlayersSidebar.tsx`**

```tsx
import Link from 'next/link';

export type TaggedPlayerSummary = {
  slug: string;
  nameJa: string;
  meta: string;
  endorsedBy: string | null;
};

export function TaggedPlayersSidebar({ players }: { players: TaggedPlayerSummary[] }) {
  if (players.length === 0) return null;
  return (
    <aside className="bg-bg-panel border border-border p-4">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-3">
        — 記事に登場した選手
      </div>
      <ul className="flex flex-col gap-2">
        {players.map((p) => (
          <li key={p.slug}>
            <Link href={`/players/${p.slug}`} className="block bg-bg p-2.5 border-l-2 border-signal-orange">
              <div className="text-[12px] font-extrabold text-fg">{p.nameJa}</div>
              <div className="text-[9px] text-fg-muted mt-0.5">{p.meta}</div>
              {p.endorsedBy && (
                <div className="text-[9px] text-signal-yellow mt-1">★ {p.endorsedBy} 推薦</div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 4: Implement `app/_components/article/ArticleListCard.tsx`**

```tsx
import Link from 'next/link';

const TAG_LABEL: Record<string, string> = {
  interview: 'PRO INTERVIEW',
  profile: 'PROFILE',
  tournament: 'TOURNAMENT',
  column: 'COLUMN',
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
    <Link href={`/articles/${a.slug}`} className="bg-bg-panel border border-border p-4 block hover:border-fg-muted">
      <div className="text-signal-orange text-[9px] tracking-widest font-extrabold">
        {TAG_LABEL[a.category] ?? a.category.toUpperCase()}
      </div>
      <h2 className="text-fg font-extrabold text-lg mt-1.5">{a.title}</h2>
      <p className="text-fg-muted text-[12px] mt-1.5 line-clamp-2">{a.excerpt}</p>
      <div className="text-fg-quiet text-[10px] mt-3">{a.publishedAt} · {a.readMinutes}分 · {a.authors}</div>
    </Link>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/_components/article/
git commit -m "feat: add ArticleHero, ArticleBody, TaggedPlayersSidebar, ArticleListCard"
```

---

## Task 7: Article queries

**Files:**
- Create: `lib/queries/article-detail.ts`
- Create: `lib/queries/article-index.ts`

- [ ] **Step 1: Implement `lib/queries/article-detail.ts`**

```ts
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { articles, articlePlayers, players, proEndorsements } from '@/lib/db/schema';
import type { TaggedPlayerSummary } from '@/app/_components/article/TaggedPlayersSidebar';

export type ArticleDetail = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  authors: string;
  publishedAt: string;
  readMinutes: number;
  heroImageUrl: string | null;
  taggedPlayers: TaggedPlayerSummary[];
};

export async function selectArticleDetail(slug: string): Promise<ArticleDetail | null> {
  const [a] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!a) return null;

  const playerRows = await db
    .select({
      slug: players.slug, nameJa: players.nameJa, university: players.university,
      currentJtaRank: players.currentJtaRank, currentAtpRank: players.currentAtpRank,
      playerId: players.id,
    })
    .from(articlePlayers)
    .innerJoin(players, eq(articlePlayers.playerId, players.id))
    .where(eq(articlePlayers.articleId, a.id));

  const taggedPlayers: TaggedPlayerSummary[] = [];
  for (const p of playerRows) {
    const [end] = await db
      .select({ proName: proEndorsements.proName })
      .from(proEndorsements)
      .where(eq(proEndorsements.playerId, p.playerId))
      .limit(1);
    const rankLabel = p.currentJtaRank ? `JTA #${p.currentJtaRank}` : (p.currentAtpRank ? `ATP ${p.currentAtpRank}` : '');
    taggedPlayers.push({
      slug: p.slug,
      nameJa: p.nameJa,
      meta: [p.university, rankLabel].filter(Boolean).join(' · '),
      endorsedBy: end?.proName ?? null,
    });
  }

  // Read minutes: derive from body length using a simple words-per-minute estimate.
  const words = a.body.split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(words / 400));

  return {
    slug: a.slug, title: a.title, excerpt: a.excerpt ?? '', body: a.body,
    category: a.category, authors: a.authors ?? '編集部',
    publishedAt: a.publishedAt.toISOString().slice(0, 10),
    readMinutes,
    heroImageUrl: a.heroImageUrl,
    taggedPlayers,
  };
}
```

- [ ] **Step 2: Implement `lib/queries/article-index.ts`**

```ts
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import type { ArticleListItem } from '@/app/_components/article/ArticleListCard';

export type ArticleIndexData = {
  articles: ArticleListItem[];
  counts: { total: number; interview: number; profile: number; tournament: number; column: number };
};

export async function selectArticleIndex(
  filter?: 'interview' | 'profile' | 'tournament' | 'column',
): Promise<ArticleIndexData> {
  const rows = filter
    ? await db.select().from(articles).where(eq(articles.category, filter)).orderBy(desc(articles.publishedAt))
    : await db.select().from(articles).orderBy(desc(articles.publishedAt));

  const list: ArticleListItem[] = rows.map((a) => {
    const words = a.body.split(/\s+/).length;
    return {
      slug: a.slug, title: a.title, excerpt: a.excerpt ?? '',
      category: a.category, authors: a.authors ?? '編集部',
      publishedAt: a.publishedAt.toISOString().slice(0, 10),
      readMinutes: Math.max(1, Math.round(words / 400)),
    };
  });

  const countRows = await db
    .select({ category: articles.category, c: sql<number>`count(*)::int` })
    .from(articles)
    .groupBy(articles.category);
  const m: Record<string, number> = {};
  for (const r of countRows) m[r.category] = r.c;
  const total = Object.values(m).reduce((s, v) => s + v, 0);

  return {
    articles: list,
    counts: {
      total,
      interview: m.interview ?? 0,
      profile: m.profile ?? 0,
      tournament: m.tournament ?? 0,
      column: m.column ?? 0,
    },
  };
}
```

- [ ] **Step 3: Add shape contract tests**

`tests/unit/queries/article-detail.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectArticleDetail } from '@/lib/queries/article-detail';

describe('selectArticleDetail', () => {
  it('is a function', () => {
    expect(typeof selectArticleDetail).toBe('function');
  });
});
```

`tests/unit/queries/article-index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectArticleIndex } from '@/lib/queries/article-index';

describe('selectArticleIndex', () => {
  it('is a function', () => {
    expect(typeof selectArticleIndex).toBe('function');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/unit/queries/article-detail.test.ts tests/unit/queries/article-index.test.ts
```
Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/article-detail.ts lib/queries/article-index.ts tests/unit/queries/article-detail.test.ts tests/unit/queries/article-index.test.ts
git commit -m "feat: add article-detail and article-index queries"
```

---

## Task 8: /articles/[slug] page with SEO

**Files:**
- Create: `app/articles/[slug]/page.tsx`

- [ ] **Step 1: Implement `app/articles/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { ArticleHero } from '@/app/_components/article/ArticleHero';
import { ArticleBody } from '@/app/_components/article/ArticleBody';
import { TaggedPlayersSidebar } from '@/app/_components/article/TaggedPlayersSidebar';
import { selectArticleDetail } from '@/lib/queries/article-detail';

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await selectArticleDetail(slug);
  if (!a) return {};
  return {
    title: `${a.title} | FutureRally`,
    description: a.excerpt,
    openGraph: {
      title: a.title,
      description: a.excerpt,
      type: 'article',
      images: a.heroImageUrl ? [a.heroImageUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: a.title,
      description: a.excerpt,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 px-4 py-6 max-w-5xl mx-auto">
        <ArticleBody source={a.body} />
        <TaggedPlayersSidebar players={a.taggedPlayers} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run dev and verify**

```bash
npm run dev
```
Visit http://localhost:3000/articles/nishioka-yamada-talk.

Expected:
- Hero with orange "PRO INTERVIEW" kicker, title large, excerpt, author/date/N分
- Body with H2s having yellow left border
- Blockquote with yellow left border and italic
- Right sidebar showing tagged players (山田 翔, 西岡 良仁)

Visit the URL with `view-source:` prefix and confirm OpenGraph meta tags present.

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/articles/
git commit -m "feat: implement /articles/[slug] page with MDX rendering and SEO"
```

---

## Task 9: /articles index page

**Files:**
- Create: `app/articles/page.tsx`

- [ ] **Step 1: Implement `app/articles/page.tsx`**

```tsx
import Link from 'next/link';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { ArticleListCard } from '@/app/_components/article/ArticleListCard';
import { selectArticleIndex } from '@/lib/queries/article-index';

export const revalidate = 1800;

const CATEGORY_TABS = [
  { key: undefined, label: '全て' },
  { key: 'interview', label: 'インタビュー' },
  { key: 'profile', label: 'プロフィール' },
  { key: 'tournament', label: '大会' },
  { key: 'column', label: 'コラム' },
] as const;

export default async function ArticlesIndexPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const filter = (category === 'interview' || category === 'profile' || category === 'tournament' || category === 'column')
    ? category : undefined;
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
                key={t.key ?? 'all'}
                href={t.key ? `/articles?category=${t.key}` : '/articles'}
                className={`px-2.5 py-1 text-[10px] tracking-wide font-bold bg-bg-card ${
                  filter === t.key ? 'text-signal-yellow' : 'text-fg-muted'
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
```

- [ ] **Step 2: Run dev and verify**

```bash
npm run dev
```
Visit http://localhost:3000/articles. Expected: 5 category tabs, 1 article card (nishioka-yamada-talk). Click "インタビュー" tab → URL becomes `?category=interview`.

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/articles/page.tsx
git commit -m "feat: implement /articles index page with category filter"
```

---

## Task 10: Wire articles:sync into build

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update `build` script in `package.json`**

```json
"build": "npm run articles:sync && next build"
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```
Expected: First runs sync (`0 inserted, 1 updated`), then Next.js build succeeds.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: run articles:sync as part of build"
```

---

## Task 11: Playwright E2E for articles

**Files:**
- Create: `tests/e2e/article-pages.spec.ts`

- [ ] **Step 1: Create `tests/e2e/article-pages.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('article detail renders hero, body, and tagged players sidebar', async ({ page }) => {
  await page.goto('/articles/nishioka-yamada-talk');

  await expect(page.getByText('PRO INTERVIEW')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('俺もここで泣いた');
  await expect(page.getByRole('heading', { level: 2 })).toContainText('なぜいま、後輩を訪ねたのか');
  await expect(page.getByText(/フォアの威力は同世代でトップクラス/)).toBeVisible();

  // Sidebar
  await expect(page.getByText('— 記事に登場した選手')).toBeVisible();
  await expect(page.getByText('山田 翔')).toBeVisible();
});

test('article index lists articles with categories', async ({ page }) => {
  await page.goto('/articles');
  await expect(page.getByRole('heading', { name: /記事一覧/ })).toBeVisible();
  await expect(page.getByText(/俺もここで泣いた/)).toBeVisible();
});

test('clicking a tagged player navigates to profile', async ({ page }) => {
  await page.goto('/articles/nishioka-yamada-talk');
  await page.getByRole('link', { name: /山田 翔/ }).click();
  await expect(page).toHaveURL(/\/players\/yamada-sho/);
});

test('404 for unknown article', async ({ page }) => {
  const res = await page.goto('/articles/nope');
  expect(res?.status()).toBe(404);
});
```

- [ ] **Step 2: Run E2E**

```bash
npm run test:e2e
```
Expected: 4 tests passing.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/article-pages.spec.ts
git commit -m "test: add Playwright E2E for article pages"
```

---

## Self-Review Checklist

- [x] Spec coverage:
  - Section 3.3 (article page): Tasks 5-8
  - Section 3 article index: Task 9
  - Section 4 (article + tagging join tables): Tasks 4 (sync upserts joins)
  - Section 7.1 (MDX in Git + revalidation): Tasks 1-4, 10
- [x] Placeholder scan:
  - Read time estimate uses 400 words/minute heuristic — this is a sensible default for Japanese text, but documented inline. Engineer can tune.
  - No TBDs or empty handlers.
- [x] Type consistency:
  - `TaggedPlayerSummary` type defined in `TaggedPlayersSidebar.tsx` reused in `article-detail.ts`
  - `ArticleListItem` defined in `ArticleListCard.tsx` reused in `article-index.ts`
  - `category` enum string aligns with `pgEnum articleCategory` defined in Plan 1 schema
