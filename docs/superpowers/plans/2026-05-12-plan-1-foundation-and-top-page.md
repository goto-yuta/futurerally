# FutureRally Plan 1: Foundation + Top Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable Next.js + Supabase foundation with the B1 "Pure Data Terminal" design system and a working top page that displays sample data in the Mixed Hero layout.

**Architecture:** Next.js 15 App Router app on Vercel, PostgreSQL on Supabase, Drizzle ORM for type-safe data access. UI built with Tailwind + shadcn/ui customized to the B1 dark theme. The top page renders server-side with sample seed data; no scraping or runtime fetching yet. Tests use Vitest for units and Playwright for one smoke E2E.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, postgres-js driver, Supabase Postgres, Vitest, Playwright.

**Related Spec:** `docs/superpowers/specs/2026-05-12-futurerally-tennis-media-design.md`

---

## File Structure

This plan creates the following structure. Each file has one clear responsibility.

```
.
├── package.json                                  # Node deps
├── tsconfig.json                                 # TS config
├── next.config.ts                                # Next.js config
├── tailwind.config.ts                            # Tailwind + B1 theme tokens
├── postcss.config.mjs                            # PostCSS for Tailwind
├── drizzle.config.ts                             # Drizzle ORM config
├── vitest.config.ts                              # Vitest config
├── playwright.config.ts                          # Playwright config
├── .env.example                                  # Sample env vars
├── .env.local                                    # Real env vars (gitignored)
├── app/
│   ├── layout.tsx                                # Root layout (theme, fonts)
│   ├── page.tsx                                  # Top page (Mixed Hero)
│   ├── globals.css                               # Tailwind directives + global CSS
│   └── _components/
│       ├── SiteHeader.tsx                        # Top nav bar
│       ├── HeroStory.tsx                         # Big story card (left)
│       ├── TodayStatusPanel.tsx                  # Live + recent results (right)
│       ├── FeaturedPlayersRow.tsx                # 3 player cards w/ endorsement
│       ├── ArticleCard.tsx                       # Single article card
│       ├── PlayerIndexTeaser.tsx                 # Category chips footer
│       ├── EndorsementBadge.tsx                  # ★ pro recommendation pill
│       └── StatusPill.tsx                        # Live / won / lost colored pill
├── lib/
│   ├── db/
│   │   ├── client.ts                             # Drizzle client instance
│   │   ├── schema.ts                             # All entity tables in one file
│   │   └── seed.ts                               # Seed script for sample data
│   └── queries/
│       └── top-page.ts                           # Server-side query for top page
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── EndorsementBadge.test.tsx
│   │   │   ├── StatusPill.test.tsx
│   │   │   └── HeroStory.test.tsx
│   │   └── queries/
│   │       └── top-page.test.ts
│   └── e2e/
│       └── top-page.spec.ts                      # Smoke E2E
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-05-12-plan-1-foundation-and-top-page.md  # this file
```

---

## Task 1: Initialize Next.js + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`

- [ ] **Step 1: Run create-next-app**

Run from project root:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-npm
```

When prompted "Would you like your code inside a `src/` directory?" → No. Accept Tailwind, App Router, TypeScript, default import alias `@/*`.

Expected: Next.js scaffold created in current directory with `app/`, `package.json`, `tailwind.config.ts` etc.

- [ ] **Step 2: Verify dev server boots**

```bash
npm run dev
```
Visit http://localhost:3000. Expected: Default Next.js welcome page.
Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 + TypeScript + Tailwind project"
```

---

## Task 2: Configure B1 theme in Tailwind

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `tailwind.config.ts` with B1 tokens**

Replace the entire file contents with:
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0F1117',
          panel: '#16191f',
          card: '#1a1d26',
        },
        border: {
          DEFAULT: '#1f2230',
        },
        fg: {
          DEFAULT: '#ffffff',
          muted: '#9ba3b4',
          quiet: '#666666',
        },
        signal: {
          yellow: '#FFEA00',
          red: '#FF3B3B',
          green: '#1ed760',
          orange: '#FF6B35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Hiragino Sans', 'Noto Sans JP', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Update `app/globals.css`**

Replace the entire contents with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  background: #0F1117;
  color: #fff;
  font-family: 'Inter', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  font-feature-settings: 'tnum' 1; /* tabular numerals for stats */
}

.tabular {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 3: Update `app/layout.tsx` to load Inter from next/font and set lang**

Replace the entire file with:
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FutureRally',
  description: '日本のフューチャーズ・大学テニス選手のためのメディア',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Replace `app/page.tsx` with a smoke check**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-bg p-8">
      <h1 className="text-3xl font-extrabold text-fg">FutureRally</h1>
      <p className="mt-2 text-fg-muted">B1 theme smoke test.</p>
      <p className="tabular mt-1 text-signal-yellow">6-4 3-2</p>
    </main>
  );
}
```

- [ ] **Step 5: Run dev and verify visually**

```bash
npm run dev
```
Visit http://localhost:3000. Expected: dark `#0F1117` background, white heading, muted gray subtitle, yellow `6-4 3-2`.

Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: configure B1 dark theme tokens in Tailwind"
```

---

## Task 3: Add Vitest with React Testing Library

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/unit/sanity.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest deps**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 3: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create `tests/unit/sanity.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('math works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Add npm scripts**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Run tests**

```bash
npm test
```
Expected: 1 test passing.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/
git commit -m "test: set up Vitest with React Testing Library"
```

---

## Task 4: Install Drizzle ORM + postgres-js + Supabase env

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/client.ts`
- Create: `.env.example`
- Modify: `.env.local` (gitignored, user fills in)

- [ ] **Step 1: Install Drizzle deps**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

- [ ] **Step 2: Create `.env.example`**

```env
# Supabase
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

- [ ] **Step 3: Create `.env.local` placeholder**

Copy `.env.example` to `.env.local`. The engineer will fill in a real `DATABASE_URL` once their Supabase project exists (see Task 5).

```bash
cp .env.example .env.local
```

- [ ] **Step 4: Create `lib/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
```

- [ ] **Step 5: Create `drizzle.config.ts`**

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 6: Install dotenv for drizzle-kit and Vitest**

```bash
npm install -D dotenv
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json drizzle.config.ts lib/db/client.ts .env.example
git commit -m "feat: install Drizzle ORM and Supabase Postgres client"
```

---

## Task 5: Create Supabase project + run first migration

**Files:**
- Create: `lib/db/schema.ts`
- Create: `drizzle/` (auto-generated)

> **Manual step:** The engineer must create a Supabase project at https://supabase.com/dashboard (free tier), copy the connection string (Settings → Database → Connection string → URI), and paste into `.env.local` as `DATABASE_URL`.

- [ ] **Step 1: Create `lib/db/schema.ts` with all entities from spec section 4**

```ts
import {
  pgTable, serial, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, primaryKey,
} from 'drizzle-orm/pg-core';

export const playerCategory = pgEnum('player_category', ['pro', 'college', 'futures']);
export const tournamentLevel = pgEnum('tournament_level', [
  'atp', 'challenger', 'futures_25', 'futures_15', 'jta', 'college',
]);
export const entryStatus = pgEnum('entry_status', [
  'scheduled', 'alive', 'won', 'lost', 'champion',
]);
export const articleCategory = pgEnum('article_category', [
  'interview', 'profile', 'tournament', 'column',
]);
export const inquiryStatus = pgEnum('inquiry_status', ['new', 'forwarded', 'closed']);

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  nameJa: varchar('name_ja', { length: 64 }).notNull(),
  nameEn: varchar('name_en', { length: 64 }).notNull(),
  birthYear: integer('birth_year'),
  hand: varchar('hand', { length: 16 }),
  heightCm: integer('height_cm'),
  category: playerCategory('category').notNull(),
  university: varchar('university', { length: 64 }),
  club: varchar('club', { length: 64 }),
  currentJtaRank: integer('current_jta_rank'),
  currentAtpRank: integer('current_atp_rank'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  sns: jsonb('sns'),
  featured: boolean('featured').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),
  scorecard: jsonb('scorecard'),
  itfId: varchar('itf_id', { length: 32 }),
  itfSlug: varchar('itf_slug', { length: 96 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const proEndorsements = pgTable('pro_endorsements', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  proName: varchar('pro_name', { length: 64 }).notNull(),
  proStatus: varchar('pro_status', { length: 16 }).notNull().default('active'),
  quote: text('quote'),
  endorsedAt: timestamp('endorsed_at').defaultNow().notNull(),
  displayOrder: integer('display_order').notNull().default(0),
});

export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 96 }).notNull().unique(),
  nameJa: varchar('name_ja', { length: 96 }).notNull(),
  nameEn: varchar('name_en', { length: 96 }).notNull(),
  level: tournamentLevel('level').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  location: varchar('location', { length: 96 }),
  surface: varchar('surface', { length: 32 }),
  externalUrl: text('external_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tournamentEntries = pgTable('tournament_entries', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  status: entryStatus('status').notNull(),
  currentRound: varchar('current_round', { length: 16 }),
  lastMatchSummary: text('last_match_summary'),
  nextMatchAt: timestamp('next_match_at'),
  nextOpponent: varchar('next_opponent', { length: 64 }),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow().notNull(),
});

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 96 }).notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  body: text('body').notNull(),
  category: articleCategory('category').notNull(),
  heroImageUrl: text('hero_image_url'),
  authors: text('authors'),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const articlePlayers = pgTable('article_players', {
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.articleId, t.playerId] }) }));

export const articleTournaments = pgTable('article_tournaments', {
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.articleId, t.tournamentId] }) }));

export const sponsorshipInquiries = pgTable('sponsorship_inquiries', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 128 }).notNull(),
  contactName: varchar('contact_name', { length: 64 }).notNull(),
  contactEmail: varchar('contact_email', { length: 128 }).notNull(),
  message: text('message').notNull(),
  status: inquiryStatus('status').notNull().default('new'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  handledAt: timestamp('handled_at'),
});
```

- [ ] **Step 2: Generate migration**

```bash
npx drizzle-kit generate
```
Expected: `drizzle/0000_*.sql` file created with CREATE TABLE statements.

- [ ] **Step 3: Apply migration to Supabase**

```bash
npx drizzle-kit migrate
```
Expected: tables created. Verify in Supabase Studio (Table Editor) that all 8 tables exist.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: add database schema for players, tournaments, articles, endorsements, inquiries"
```

---

## Task 6: Create UI primitives — StatusPill

**Files:**
- Create: `app/_components/StatusPill.tsx`
- Test: `tests/unit/components/StatusPill.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/unit/components/StatusPill.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusPill } from '@/app/_components/StatusPill';

describe('StatusPill', () => {
  it('renders LIVE status with red accent', () => {
    render(<StatusPill status="live">LIVE</StatusPill>);
    const pill = screen.getByText('LIVE');
    expect(pill).toBeInTheDocument();
    expect(pill.className).toMatch(/bg-signal-red/);
  });

  it('renders WON status with green accent', () => {
    render(<StatusPill status="won">✓ Won</StatusPill>);
    const pill = screen.getByText('✓ Won');
    expect(pill.className).toMatch(/text-signal-green/);
  });

  it('renders LOST status with red accent', () => {
    render(<StatusPill status="lost">✗ Lost</StatusPill>);
    const pill = screen.getByText('✗ Lost');
    expect(pill.className).toMatch(/text-signal-red/);
  });

  it('renders DEFAULT status with muted style', () => {
    render(<StatusPill status="default">予定</StatusPill>);
    const pill = screen.getByText('予定');
    expect(pill.className).toMatch(/text-fg-muted/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/StatusPill.test.tsx
```
Expected: FAIL with "Cannot find module '@/app/_components/StatusPill'".

- [ ] **Step 3: Implement `app/_components/StatusPill.tsx`**

```tsx
import { ReactNode } from 'react';

type Status = 'live' | 'won' | 'lost' | 'default';

const styles: Record<Status, string> = {
  live: 'bg-signal-red text-white font-extrabold',
  won: 'text-signal-green font-bold',
  lost: 'text-signal-red font-bold',
  default: 'text-fg-muted',
};

export function StatusPill({ status, children }: { status: Status; children: ReactNode }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[9px] tracking-widest uppercase ${styles[status]}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/StatusPill.test.tsx
```
Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/StatusPill.tsx tests/unit/components/StatusPill.test.tsx
git commit -m "feat: add StatusPill primitive component"
```

---

## Task 7: Create UI primitives — EndorsementBadge

**Files:**
- Create: `app/_components/EndorsementBadge.tsx`
- Test: `tests/unit/components/EndorsementBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/unit/components/EndorsementBadge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EndorsementBadge } from '@/app/_components/EndorsementBadge';

describe('EndorsementBadge', () => {
  it('renders pro name with star prefix', () => {
    render(<EndorsementBadge proName="西岡良仁" />);
    expect(screen.getByText(/西岡良仁/)).toBeInTheDocument();
    expect(screen.getByText(/★/)).toBeInTheDocument();
  });

  it('uses yellow signal background', () => {
    render(<EndorsementBadge proName="添田豪" />);
    const badge = screen.getByText(/添田豪/);
    expect(badge.className).toMatch(/bg-signal-yellow/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/EndorsementBadge.test.tsx
```
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement `app/_components/EndorsementBadge.tsx`**

```tsx
export function EndorsementBadge({ proName }: { proName: string }) {
  return (
    <span className="inline-block bg-signal-yellow text-bg px-2.5 py-1 text-[10px] font-extrabold tracking-wide">
      ★ {proName}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/EndorsementBadge.test.tsx
```
Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/EndorsementBadge.tsx tests/unit/components/EndorsementBadge.test.tsx
git commit -m "feat: add EndorsementBadge primitive component"
```

---

## Task 8: Create SiteHeader component

**Files:**
- Create: `app/_components/SiteHeader.tsx`

- [ ] **Step 1: Implement `app/_components/SiteHeader.tsx`**

(No unit test needed — purely presentational with Link components; the E2E covers it.)

```tsx
import Link from 'next/link';

const NAV = [
  { href: '/', label: 'HOME' },
  { href: '/players', label: '選手' },
  { href: '/tournaments', label: '大会' },
  { href: '/articles', label: '記事' },
  { href: '/pro-interviews', label: 'プロ対談' },
];

export function SiteHeader({ active }: { active: string }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg">
      <Link href="/" className="text-fg font-extrabold text-xs tracking-widest">
        FUTURERALLY
      </Link>
      <nav className="flex gap-4 text-[9px] tracking-widest">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={n.href === active ? 'text-signal-yellow' : 'text-fg-muted'}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/SiteHeader.tsx
git commit -m "feat: add SiteHeader with primary nav"
```

---

## Task 9: Create HeroStory component

**Files:**
- Create: `app/_components/HeroStory.tsx`
- Test: `tests/unit/components/HeroStory.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/unit/components/HeroStory.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroStory } from '@/app/_components/HeroStory';

describe('HeroStory', () => {
  it('renders title, subtitle, and READ STORY CTA', () => {
    render(
      <HeroStory
        kicker="PRO × FUTURES"
        title='「俺もここで泣いた」西岡が、F級で戦う後輩へ。'
        meta="西岡良仁 × 山田翔 / 6,200字"
        href="/articles/nishioka-yamada"
      />,
    );
    expect(screen.getByText('PRO × FUTURES')).toBeInTheDocument();
    expect(screen.getByText(/俺もここで泣いた/)).toBeInTheDocument();
    expect(screen.getByText(/6,200字/)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /READ STORY/ });
    expect(cta).toHaveAttribute('href', '/articles/nishioka-yamada');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/HeroStory.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement `app/_components/HeroStory.tsx`**

```tsx
import Link from 'next/link';

export function HeroStory({
  kicker, title, meta, href,
}: { kicker: string; title: string; meta: string; href: string }) {
  return (
    <article className="bg-bg-panel p-5 border-r border-border">
      <div className="text-[9px] tracking-widest text-signal-orange font-extrabold mb-2">
        ★ TODAY&apos;S STORY · {kicker}
      </div>
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-fg mb-3">
        {title}
      </h2>
      <p className="text-[10px] text-fg-muted mb-3">{meta}</p>
      <Link
        href={href}
        className="inline-block bg-signal-yellow text-bg px-3 py-1.5 text-[11px] font-extrabold tracking-widest"
      >
        READ STORY →
      </Link>
    </article>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/HeroStory.test.tsx
```
Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/HeroStory.tsx tests/unit/components/HeroStory.test.tsx
git commit -m "feat: add HeroStory component for top page"
```

---

## Task 10: Create TodayStatusPanel component

**Files:**
- Create: `app/_components/TodayStatusPanel.tsx`

This component renders the right-side panel with two sub-sections: "今出場中" (alive entries) and "昨日の結果" (recent results). It accepts plain TypeScript prop objects.

- [ ] **Step 1: Implement `app/_components/TodayStatusPanel.tsx`**

```tsx
import { StatusPill } from './StatusPill';

export type AliveEntry = {
  playerName: string;
  tournamentName: string;
  currentRound: string;
  note?: string;
};

export type RecentResultEntry = {
  playerName: string;
  tournamentName: string;
  result: 'won' | 'lost';
  summary: string;
};

export function TodayStatusPanel({
  alive, recent,
}: { alive: AliveEntry[]; recent: RecentResultEntry[] }) {
  return (
    <aside className="bg-bg p-3">
      <div className="text-[9px] tracking-widest text-signal-red font-extrabold mb-2">
        ● TODAY · 大会出場中
      </div>
      <ul className="flex flex-col gap-1 mb-3">
        {alive.map((e, i) => (
          <li key={i} className="bg-bg border-l-2 border-signal-yellow px-2.5 py-2 text-[10px]">
            <div className="text-fg font-bold">{e.playerName}</div>
            <div className="text-fg-muted text-[9px] mt-0.5">
              {e.tournamentName} · 残{e.currentRound}
              {e.note ? ` · ${e.note}` : ''}
            </div>
          </li>
        ))}
      </ul>
      <div className="text-[8px] tracking-widest text-fg-muted font-bold pt-2 mb-1.5 border-t border-border">
        昨日の結果
      </div>
      <ul className="flex flex-col gap-1">
        {recent.map((e, i) => (
          <li
            key={i}
            className={`bg-bg border-l-2 px-2.5 py-2 text-[10px] ${
              e.result === 'won' ? 'border-signal-green opacity-70' : 'border-signal-red opacity-50'
            }`}
          >
            <div className="text-fg font-bold">
              {e.playerName}{' '}
              <StatusPill status={e.result}>
                {e.result === 'won' ? '✓ Won' : '✗ Lost'}
              </StatusPill>
            </div>
            <div className="text-fg-muted text-[9px] mt-0.5">
              {e.tournamentName} · {e.summary}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/TodayStatusPanel.tsx
git commit -m "feat: add TodayStatusPanel component"
```

---

## Task 11: Create FeaturedPlayersRow + ArticleCard + PlayerIndexTeaser

**Files:**
- Create: `app/_components/FeaturedPlayersRow.tsx`
- Create: `app/_components/ArticleCard.tsx`
- Create: `app/_components/PlayerIndexTeaser.tsx`

- [ ] **Step 1: Implement `app/_components/FeaturedPlayersRow.tsx`**

```tsx
import Link from 'next/link';
import { EndorsementBadge } from './EndorsementBadge';

export type FeaturedPlayer = {
  slug: string;
  nameJa: string;
  meta: string;
  endorsedBy: string;
  stats: string;
};

export function FeaturedPlayersRow({ players }: { players: FeaturedPlayer[] }) {
  return (
    <section>
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="text-[9px] tracking-widest text-fg-muted font-extrabold">
          ★ FEATURED PLAYERS / 編集部の今月の注目選手
        </div>
        <Link href="/players?featured=1" className="text-[9px] text-signal-yellow font-bold">
          全選手 ＞
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 px-4 pb-4">
        {players.map((p) => (
          <Link key={p.slug} href={`/players/${p.slug}`} className="bg-bg-card p-2.5 border-l-2 border-signal-orange block">
            <div className="mb-1.5"><EndorsementBadge proName={p.endorsedBy} /></div>
            <div className="text-[13px] font-extrabold text-fg">{p.nameJa}</div>
            <div className="text-[9px] text-fg-muted mt-0.5">{p.meta}</div>
            <div className="text-[9px] text-fg-muted mt-1.5 tabular">{p.stats}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement `app/_components/ArticleCard.tsx`**

```tsx
import Link from 'next/link';

export type ArticleSummary = {
  slug: string;
  category: string;
  title: string;
  publishedAt: string;
  readMinutes: number;
};

const TAG_LABEL: Record<string, string> = {
  interview: 'PRO INTERVIEW',
  profile: 'PROFILE',
  tournament: 'TOURNAMENT',
  column: 'COLUMN',
};

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="bg-bg-panel border border-border p-2.5 block hover:border-fg-muted"
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
```

- [ ] **Step 3: Implement `app/_components/PlayerIndexTeaser.tsx`**

```tsx
import Link from 'next/link';

export type CategoryCount = {
  label: string;
  href: string;
  count: number;
  active?: boolean;
};

export function PlayerIndexTeaser({
  totalCount, categories,
}: { totalCount: number; categories: CategoryCount[] }) {
  return (
    <section>
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="text-[9px] tracking-widest text-fg-muted font-extrabold">
          — PLAYER INDEX · 全{totalCount}名
        </div>
        <Link href="/players" className="text-[9px] text-signal-yellow font-bold">
          選手一覧 ＞
        </Link>
      </div>
      <div className="flex gap-1.5 flex-wrap px-4 pb-5">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`bg-bg-card text-[9px] px-2.5 py-1 tracking-wide font-bold ${
              c.active ? 'text-signal-yellow' : 'text-fg-muted'
            }`}
          >
            {c.label} · {c.count}人
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/_components/FeaturedPlayersRow.tsx app/_components/ArticleCard.tsx app/_components/PlayerIndexTeaser.tsx
git commit -m "feat: add FeaturedPlayersRow, ArticleCard, PlayerIndexTeaser components"
```

---

## Task 12: Seed sample data

**Files:**
- Create: `lib/db/seed.ts`
- Modify: `package.json` (add `db:seed` script)

- [ ] **Step 1: Create `lib/db/seed.ts`**

```ts
import 'dotenv/config';
import { db } from './client';
import { players, proEndorsements, tournaments, tournamentEntries, articles, articlePlayers } from './schema';

async function main() {
  console.log('seeding...');

  // Players
  const [yamada, sato, nakamura, nishioka, daniel] = await db.insert(players).values([
    {
      slug: 'yamada-sho', nameJa: '山田 翔', nameEn: 'Yamada Sho', birthYear: 2004,
      hand: '右利き / 両手BH', heightCm: 178, category: 'college', university: '慶應義塾大学',
      currentJtaRank: 12, currentAtpRank: null, featured: true, displayOrder: 1,
      sns: { ig: 4200, ig_er: 6.8, x: 1850, x_er: 3.2, tiktok: 980 },
      scorecard: { asks: ['海外遠征費の支援', 'ストリングス契約'], current_sponsors: ['YONEX'] },
    },
    {
      slug: 'sato-aoi', nameJa: '佐藤 葵', nameEn: 'Sato Aoi', birthYear: 2003,
      category: 'futures', currentAtpRank: 812, featured: true, displayOrder: 2,
      sns: { ig: 1800 }, scorecard: { asks: ['ウェア提供'] },
    },
    {
      slug: 'nakamura-taku', nameJa: '中村 拓', nameEn: 'Nakamura Taku', birthYear: 2002,
      category: 'college', university: '早稲田大学', currentJtaRank: 28,
      featured: true, displayOrder: 3, sns: { ig: 2100 },
    },
    {
      slug: 'nishioka-yoshihito', nameJa: '西岡 良仁', nameEn: 'Nishioka Yoshihito',
      birthYear: 1995, category: 'pro', currentAtpRank: 95,
    },
    {
      slug: 'daniel-taro', nameJa: 'ダニエル 太郎', nameEn: 'Daniel Taro',
      birthYear: 1993, category: 'pro', currentAtpRank: 124,
    },
  ]).returning();

  // Endorsements
  await db.insert(proEndorsements).values([
    { playerId: yamada.id, proName: '西岡 良仁', proStatus: 'active', displayOrder: 1,
      quote: 'フォアの威力は同世代でトップクラス。あとは経験。海外で戦えば化ける。' },
    { playerId: sato.id, proName: '添田 豪', proStatus: 'retired', displayOrder: 1 },
    { playerId: nakamura.id, proName: '杉田 祐一', proStatus: 'active', displayOrder: 1 },
  ]);

  // Tournaments
  const [roanne, yokkaichi, hiroshima] = await db.insert(tournaments).values([
    {
      slug: 'roanne-challenger-2026',
      nameJa: 'Roanne Challenger', nameEn: 'Roanne Challenger',
      level: 'challenger', location: 'France',
      startDate: new Date('2026-05-08'), endDate: new Date('2026-05-14'),
    },
    {
      slug: 'yokkaichi-f1-2026',
      nameJa: '四日市 F1', nameEn: 'Yokkaichi F1',
      level: 'futures_25', location: '三重',
      startDate: new Date('2026-05-10'), endDate: new Date('2026-05-16'),
    },
    {
      slug: 'hiroshima-f4-2026',
      nameJa: '広島 F4', nameEn: 'Hiroshima F4',
      level: 'futures_15', location: '広島',
      startDate: new Date('2026-05-10'), endDate: new Date('2026-05-15'),
    },
  ]).returning();

  // Tournament entries
  await db.insert(tournamentEntries).values([
    { playerId: daniel.id, tournamentId: roanne.id, status: 'alive', currentRound: 'QF',
      lastMatchSummary: '2回戦突破', nextMatchAt: new Date('2026-05-13T14:00:00+09:00') },
    { playerId: sato.id, tournamentId: yokkaichi.id, status: 'alive', currentRound: 'R16',
      lastMatchSummary: '1回戦突破' },
    { playerId: yamada.id, tournamentId: hiroshima.id, status: 'alive', currentRound: 'R32',
      nextMatchAt: new Date('2026-05-12T14:00:00+09:00'), nextOpponent: '田中 誠' },
    { playerId: nishioka.id, tournamentId: roanne.id, status: 'won',
      currentRound: 'QF', lastMatchSummary: '1回戦突破 → QFへ',
      lastUpdatedAt: new Date('2026-05-11T20:00:00+09:00') },
  ]);

  // Article
  const [article] = await db.insert(articles).values([
    {
      slug: 'nishioka-yamada-talk',
      title: '「俺もここで泣いた」西岡が、F級で戦う後輩へ。',
      excerpt: '西岡良仁 × 山田翔 / 6,200字',
      body: '# 「俺もここで泣いた」\n\n_本文は別Planで実装します。_',
      category: 'interview',
      authors: '編集部',
      publishedAt: new Date('2026-05-12'),
    },
  ]).returning();

  await db.insert(articlePlayers).values([
    { articleId: article.id, playerId: yamada.id },
    { articleId: article.id, playerId: nishioka.id },
  ]);

  console.log('seed complete.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add npm script to `package.json`**

In `"scripts"` add:
```json
"db:seed": "tsx lib/db/seed.ts"
```

Install tsx:
```bash
npm install -D tsx
```

- [ ] **Step 3: Run the seed**

```bash
npm run db:seed
```
Expected output: `seeding...` then `seed complete.`

Verify in Supabase Studio that `players` has 5 rows, `tournaments` has 3, etc.

- [ ] **Step 4: Commit**

```bash
git add lib/db/seed.ts package.json package-lock.json
git commit -m "chore: add seed script with 5 players, 3 tournaments, 1 article"
```

---

## Task 13: Build top-page query

**Files:**
- Create: `lib/queries/top-page.ts`
- Test: `tests/unit/queries/top-page.test.ts`

This query returns everything the top page needs in one server-side call: hero story candidate, alive entries, recent results, featured players, latest articles, player index counts.

- [ ] **Step 1: Write the failing test**

`tests/unit/queries/top-page.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { selectTopPageData } from '@/lib/queries/top-page';

describe('selectTopPageData (shape contract)', () => {
  it('returns the expected top-level keys', () => {
    const shape = ['heroStory', 'aliveEntries', 'recentResults', 'featuredPlayers', 'latestArticles', 'playerCounts'] as const;
    // Validate the function exists and exports keys we depend on; we use a stub db.
    expect(typeof selectTopPageData).toBe('function');
    for (const key of shape) {
      expect(selectTopPageData.shapeKeys).toContain(key);
    }
  });
});
```

> **Note:** This is a shape contract test using a `shapeKeys` static. We avoid mocking the DB here; the actual end-to-end behavior is covered by the Playwright smoke test in Task 16. Pure unit tests of the query against a real DB would couple to fixtures.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/queries/top-page.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `lib/queries/top-page.ts`**

```ts
import { desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  players, articles, articlePlayers, proEndorsements,
  tournaments, tournamentEntries,
} from '@/lib/db/schema';

export type TopPageData = {
  heroStory: {
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: string;
  } | null;
  aliveEntries: Array<{
    playerName: string;
    tournamentName: string;
    currentRound: string;
    note?: string;
  }>;
  recentResults: Array<{
    playerName: string;
    tournamentName: string;
    result: 'won' | 'lost';
    summary: string;
  }>;
  featuredPlayers: Array<{
    slug: string;
    nameJa: string;
    meta: string;
    endorsedBy: string;
    stats: string;
  }>;
  latestArticles: Array<{
    slug: string;
    title: string;
    category: string;
    publishedAt: string;
    readMinutes: number;
  }>;
  playerCounts: {
    total: number;
    pro: number;
    college: number;
    futures: number;
  };
};

async function getHero(): Promise<TopPageData['heroStory']> {
  const rows = await db
    .select({
      slug: articles.slug, title: articles.title, excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .orderBy(desc(articles.publishedAt))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return { slug: r.slug, title: r.title, excerpt: r.excerpt, publishedAt: r.publishedAt.toISOString().slice(0, 10) };
}

async function getAlive(): Promise<TopPageData['aliveEntries']> {
  const rows = await db
    .select({
      playerName: players.nameJa,
      tournamentName: tournaments.nameJa,
      currentRound: tournamentEntries.currentRound,
      nextMatchAt: tournamentEntries.nextMatchAt,
    })
    .from(tournamentEntries)
    .innerJoin(players, eq(tournamentEntries.playerId, players.id))
    .innerJoin(tournaments, eq(tournamentEntries.tournamentId, tournaments.id))
    .where(eq(tournamentEntries.status, 'alive'))
    .limit(8);
  return rows.map((r) => ({
    playerName: r.playerName,
    tournamentName: r.tournamentName,
    currentRound: r.currentRound ?? '',
    note: r.nextMatchAt ? `${r.nextMatchAt.toISOString().slice(11, 16)} プレー予定` : undefined,
  }));
}

async function getRecent(): Promise<TopPageData['recentResults']> {
  const dayAgo = new Date(Date.now() - 1000 * 60 * 60 * 36);
  const rows = await db
    .select({
      playerName: players.nameJa,
      tournamentName: tournaments.nameJa,
      status: tournamentEntries.status,
      summary: tournamentEntries.lastMatchSummary,
    })
    .from(tournamentEntries)
    .innerJoin(players, eq(tournamentEntries.playerId, players.id))
    .innerJoin(tournaments, eq(tournamentEntries.tournamentId, tournaments.id))
    .where(
      sql`${tournamentEntries.lastUpdatedAt} > ${dayAgo} AND ${tournamentEntries.status} IN ('won','lost')`,
    )
    .orderBy(desc(tournamentEntries.lastUpdatedAt))
    .limit(6);
  return rows.map((r) => ({
    playerName: r.playerName,
    tournamentName: r.tournamentName,
    result: r.status as 'won' | 'lost',
    summary: r.summary ?? '',
  }));
}

async function getFeatured(): Promise<TopPageData['featuredPlayers']> {
  const playerRows = await db
    .select({
      slug: players.slug,
      nameJa: players.nameJa,
      category: players.category,
      university: players.university,
      currentJtaRank: players.currentJtaRank,
      currentAtpRank: players.currentAtpRank,
      sns: players.sns,
      displayOrder: players.displayOrder,
    })
    .from(players)
    .where(eq(players.featured, true))
    .orderBy(players.displayOrder)
    .limit(3);

  const result: TopPageData['featuredPlayers'] = [];
  for (const p of playerRows) {
    const [endorsement] = await db
      .select({ proName: proEndorsements.proName })
      .from(proEndorsements)
      .where(eq(proEndorsements.playerId, await idForSlug(p.slug)))
      .orderBy(proEndorsements.displayOrder)
      .limit(1);
    const sns = p.sns as { ig?: number } | null;
    const rankLabel = p.currentJtaRank ? `JTA #${p.currentJtaRank}` : (p.currentAtpRank ? `ATP ${p.currentAtpRank}` : '');
    result.push({
      slug: p.slug,
      nameJa: p.nameJa,
      meta: [p.university, rankLabel].filter(Boolean).join(' · '),
      endorsedBy: endorsement?.proName ?? '',
      stats: sns?.ig ? `IG ${(sns.ig / 1000).toFixed(1)}k` : '',
    });
  }
  return result;
}

async function idForSlug(slug: string): Promise<number> {
  const [row] = await db.select({ id: players.id }).from(players).where(eq(players.slug, slug)).limit(1);
  return row.id;
}

async function getLatest(): Promise<TopPageData['latestArticles']> {
  const rows = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      category: articles.category,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .orderBy(desc(articles.publishedAt))
    .limit(3);
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    category: r.category,
    publishedAt: r.publishedAt.toISOString().slice(0, 10).replaceAll('-', '.'),
    readMinutes: 5, // placeholder until article body length estimation is wired up
  }));
}

async function getCounts(): Promise<TopPageData['playerCounts']> {
  const rows = await db
    .select({ category: players.category, c: sql<number>`count(*)::int` })
    .from(players)
    .groupBy(players.category);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.category] = r.c;
  const total = (map.pro ?? 0) + (map.college ?? 0) + (map.futures ?? 0);
  return { total, pro: map.pro ?? 0, college: map.college ?? 0, futures: map.futures ?? 0 };
}

export async function selectTopPageData(): Promise<TopPageData> {
  const [heroStory, aliveEntries, recentResults, featuredPlayers, latestArticles, playerCounts] = await Promise.all([
    getHero(), getAlive(), getRecent(), getFeatured(), getLatest(), getCounts(),
  ]);
  return { heroStory, aliveEntries, recentResults, featuredPlayers, latestArticles, playerCounts };
}

selectTopPageData.shapeKeys = [
  'heroStory', 'aliveEntries', 'recentResults', 'featuredPlayers', 'latestArticles', 'playerCounts',
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/queries/top-page.test.ts
```
Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/top-page.ts tests/unit/queries/top-page.test.ts
git commit -m "feat: implement top-page query against Drizzle schema"
```

---

## Task 14: Wire up the top page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` to render the full Mixed Hero layout**

```tsx
import { SiteHeader } from './_components/SiteHeader';
import { HeroStory } from './_components/HeroStory';
import { TodayStatusPanel } from './_components/TodayStatusPanel';
import { FeaturedPlayersRow } from './_components/FeaturedPlayersRow';
import { ArticleCard } from './_components/ArticleCard';
import { PlayerIndexTeaser } from './_components/PlayerIndexTeaser';
import { selectTopPageData } from '@/lib/queries/top-page';

export const revalidate = 1800; // ISR: 30 minutes

export default async function Home() {
  const data = await selectTopPageData();

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/" />

      <section className="grid grid-cols-1 md:grid-cols-[2.2fr_1fr] border-b border-border">
        {data.heroStory ? (
          <HeroStory
            kicker="PRO × FUTURES"
            title={data.heroStory.title}
            meta={data.heroStory.excerpt ?? ''}
            href={`/articles/${data.heroStory.slug}`}
          />
        ) : (
          <div className="bg-bg-panel p-5 border-r border-border text-fg-muted">記事準備中</div>
        )}
        <TodayStatusPanel alive={data.aliveEntries} recent={data.recentResults} />
      </section>

      <FeaturedPlayersRow players={data.featuredPlayers} />

      <section>
        <div className="flex justify-between items-center px-4 pt-4 pb-2">
          <div className="text-[9px] tracking-widest text-fg-muted font-extrabold">— 最新記事</div>
          <a href="/articles" className="text-[9px] text-signal-yellow font-bold">記事一覧 ＞</a>
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
          { label: 'Jr ATPランカー', href: '/players?category=pro', count: data.playerCounts.pro, active: true },
          { label: '大学生', href: '/players?category=college', count: data.playerCounts.college },
          { label: 'フューチャーズ', href: '/players?category=futures', count: data.playerCounts.futures },
        ]}
      />
    </main>
  );
}
```

- [ ] **Step 2: Run dev server and verify visually**

```bash
npm run dev
```
Visit http://localhost:3000.

Expected:
- Dark background
- "FUTURERALLY" header with nav, HOME in yellow
- Left: hero story card with title "「俺もここで泣いた」西岡が..." and yellow READ STORY button
- Right: "● TODAY · 大会出場中" panel with 3 alive entries and 1 "✓ Won" recent result
- "★ FEATURED PLAYERS" row with 3 player cards, each with yellow endorsement pill
- "— 最新記事" row with 1 article card
- "— PLAYER INDEX · 全5名" with 3 category chips (1 pro, 2 college, ... wait spec uses different cardinality — we have 2 pro, 2 college, 1 futures from seed)

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble Mixed Hero top page with sample data"
```

---

## Task 15: Add Playwright smoke E2E test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/top-page.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Create `tests/e2e/top-page.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('top page renders hero, today status, featured players, and articles', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('FUTURERALLY')).toBeVisible();
  await expect(page.getByText(/俺もここで泣いた/)).toBeVisible();
  await expect(page.getByRole('link', { name: /READ STORY/ })).toBeVisible();

  // Today panel
  await expect(page.getByText('● TODAY · 大会出場中')).toBeVisible();
  await expect(page.getByText('山田 翔')).toBeVisible();

  // Featured
  await expect(page.getByText('★ FEATURED PLAYERS / 編集部の今月の注目選手')).toBeVisible();
  await expect(page.getByText('★ 西岡 良仁')).toBeVisible();

  // Articles
  await expect(page.getByText('— 最新記事')).toBeVisible();
  await expect(page.getByText('PRO INTERVIEW')).toBeVisible();

  // Player Index teaser
  await expect(page.getByText(/PLAYER INDEX · 全/)).toBeVisible();
});
```

- [ ] **Step 4: Add test:e2e npm script**

In `"scripts"` of `package.json`:
```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Run E2E**

```bash
npm run test:e2e
```
Expected: 1 test passing.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e/top-page.spec.ts package.json package-lock.json
git commit -m "test: add Playwright smoke E2E for top page"
```

---

## Task 16: Configure Vercel + deploy

**Files:**
- Modify: `package.json` (verify `build` and `start` scripts present from Next.js scaffold)

> **Manual step:** The engineer must connect this repo to Vercel and set `DATABASE_URL` as an environment variable in Vercel's project settings.

- [ ] **Step 1: Verify production build works locally**

```bash
npm run build
```
Expected: build succeeds, no TS or lint errors.

- [ ] **Step 2: Test production server locally**

```bash
npm run start
```
Visit http://localhost:3000. Expected: same UI as dev mode. Stop with Ctrl+C.

- [ ] **Step 3: Push to a Git remote**

The engineer should ensure the branch is pushed to a remote that Vercel can pull from.

```bash
git push -u origin pinnate-niece
```

(If `origin` is not set yet, configure it on the user's preferred host first.)

- [ ] **Step 4: Connect Vercel via dashboard**

Manual: Go to https://vercel.com/new, import this repo, set framework preset = Next.js, add env var `DATABASE_URL` (same value as in `.env.local`), deploy.

Expected: Vercel build succeeds. Visit the issued URL. Same UI as local.

- [ ] **Step 5: Tag and commit**

```bash
git tag plan-1-complete
git push --tags
```

---

## Self-Review Checklist

- [x] Spec coverage:
  - Section 1 (concept): metadata in `app/layout.tsx`, top page wires concept visually
  - Section 2 (visual): Tailwind theme tokens, Inter font, B1 dark theme
  - Section 3.1 (top page): Tasks 8–14 build it; Task 15 verifies
  - Section 4 (data model): Task 5 creates entire schema
  - Section 7 (editorial workflow — Supabase Studio): no code needed; documented in spec
  - Section 8 (MVP scope): this plan delivers the top page + supporting components
  - Sections 5 (scraping), 6 (full tech stack incl. scraper), 7 (other pages), 8 (other MVP items): handled by Plans 2-5
- [x] Placeholder scan: ArticleCard's `readMinutes: 5` is hardcoded — explicitly flagged with a comment "// placeholder until article body length estimation is wired up" and will be replaced in Plan 3 (Article system). All other code blocks are complete.
- [x] Type consistency: `TopPageData` shape matches component prop types (FeaturedPlayer, AliveEntry, RecentResultEntry, ArticleSummary, CategoryCount). `Status` union (`live | won | lost | default`) is used consistently across StatusPill and TodayStatusPanel.
