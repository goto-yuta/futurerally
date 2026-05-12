# FutureRally Plan 4: Tournaments + Live Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tournaments first-class. Build `/tournaments` (calendar/list view of active + upcoming + past) and `/tournaments/[slug]` (single tournament with all Japanese entries grouped by status). Add rank-history tracking so the player profile sparkline shows real data. Track match-by-match W-L so the "直近6ヶ月 W-L" stat is computed, not hardcoded.

**Architecture:** Two new pages plus two new schema tables: `player_rank_snapshots` (one row per player per month) and `match_records` (one row per match the player has played). Both are populated by the scraper in Plan 5; for this plan we add the schema, helper queries, and seed sample data so the player profile reads real values.

**Tech Stack:** Same as prior plans. No new dependencies.

**Prerequisites:** Plans 1, 2, 3 complete.

**Related Spec:** `docs/superpowers/specs/2026-05-12-futurerally-tennis-media-design.md` sections 3.4, 4 (Tournament/TournamentEntry), 5.4.

---

## File Structure

```
lib/
├── db/
│   └── schema.ts                             # +2 tables: playerRankSnapshots, matchRecords
├── queries/
│   ├── tournament-index.ts                   # SELECT tournaments grouped by status
│   ├── tournament-detail.ts                  # SELECT tournament + entries with players
│   ├── player-rank-history.ts                # 12-month rank sparkline
│   └── player-recent-wl.ts                   # W-L over 6 months
app/
├── tournaments/
│   ├── page.tsx                              # /tournaments
│   └── [slug]/
│       └── page.tsx                          # /tournaments/<slug>
└── _components/
    └── tournament/
        ├── TournamentBadge.tsx               # Level chip (color-coded)
        ├── TournamentListCard.tsx
        └── TournamentEntriesTable.tsx
drizzle/
└── 0001_*.sql                                # Generated migration for new tables
tests/
├── unit/
│   ├── components/tournament/
│   │   └── TournamentBadge.test.tsx
│   ├── queries/
│   │   ├── tournament-index.test.ts
│   │   ├── player-rank-history.test.ts
│   │   └── player-recent-wl.test.ts
└── e2e/
    └── tournaments.spec.ts
```

---

## Task 1: Add `playerRankSnapshots` + `matchRecords` schema

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0001_*.sql` (generated)

- [ ] **Step 1: Append new tables to `lib/db/schema.ts`**

Append at the end:
```ts
export const rankProvider = pgEnum('rank_provider', ['jta', 'atp']);

export const playerRankSnapshots = pgTable('player_rank_snapshots', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  provider: rankProvider('provider').notNull(),
  rank: integer('rank').notNull(),
  snapshotAt: timestamp('snapshot_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const matchResult = pgEnum('match_result', ['won', 'lost']);

export const matchRecords = pgTable('match_records', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  tournamentId: integer('tournament_id').references(() => tournaments.id, { onDelete: 'set null' }),
  opponent: varchar('opponent', { length: 96 }),
  round: varchar('round', { length: 16 }),
  result: matchResult('result').notNull(),
  scoreSummary: varchar('score_summary', { length: 64 }),
  playedAt: timestamp('played_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

- [ ] **Step 2: Generate migration**

```bash
npx drizzle-kit generate
```
Expected: `drizzle/0001_*.sql` created.

- [ ] **Step 3: Apply migration to Supabase**

```bash
npx drizzle-kit migrate
```
Expected: tables created. Verify in Supabase Studio.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: add playerRankSnapshots and matchRecords tables"
```

---

## Task 2: Extend seed with rank snapshots and matches

**Files:**
- Modify: `lib/db/seed.ts`

- [ ] **Step 1: Append snapshot + match inserts to `lib/db/seed.ts`** (before the final `console.log('seed complete.')`)

Add a helper above `main`:
```ts
function monthsAgo(n: number, day = 1): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  d.setUTCDate(day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
```

Replace `import` of new tables and add inserts inside `main()`:
```ts
import { players, proEndorsements, tournaments, tournamentEntries, articles, articlePlayers, playerRankSnapshots, matchRecords } from './schema';
```

Add at the bottom of `main()` (just before `console.log('seed complete.')`):
```ts
// 12 monthly rank snapshots for Yamada (rank trending from 50 → 12)
const yamadaTrend = [50, 45, 40, 38, 30, 28, 25, 22, 18, 15, 13, 12];
await db.insert(playerRankSnapshots).values(
  yamadaTrend.map((rank, i) => ({
    playerId: yamada.id,
    provider: 'jta' as const,
    rank,
    snapshotAt: monthsAgo(11 - i, 1),
  })),
);

// Sample match records for the last 6 months for Yamada
const yamadaMatches: Array<{ result: 'won' | 'lost'; daysAgo: number; opponent: string; round: string; score: string }> = [
  { result: 'won', daysAgo: 5, opponent: '田中 誠', round: 'R32', score: '6-4 6-2' },
  { result: 'won', daysAgo: 12, opponent: '山口 健', round: 'R64', score: '7-5 6-3' },
  { result: 'lost', daysAgo: 25, opponent: '佐々木 翔', round: 'QF', score: '4-6 5-7' },
  { result: 'won', daysAgo: 40, opponent: '林 大輔', round: 'R16', score: '6-2 6-4' },
  { result: 'won', daysAgo: 55, opponent: '森田 涼', round: 'R32', score: '6-3 6-1' },
  { result: 'won', daysAgo: 70, opponent: '大野 颯', round: 'R64', score: '7-6 6-4' },
  // ... pad with more for stat: aim for ~28 wins, 12 losses over 6mo
];
const padCount = 28 + 12 - yamadaMatches.length;
for (let i = 0; i < padCount; i++) {
  const dayOffset = 80 + i * 4;
  const isWin = i % 3 !== 0;
  yamadaMatches.push({
    result: isWin ? 'won' : 'lost',
    daysAgo: dayOffset,
    opponent: `対戦相手 ${i + 1}`,
    round: 'R32',
    score: isWin ? '6-3 6-4' : '4-6 3-6',
  });
}
await db.insert(matchRecords).values(
  yamadaMatches.map((m) => ({
    playerId: yamada.id,
    tournamentId: null,
    opponent: m.opponent,
    round: m.round,
    result: m.result,
    scoreSummary: m.score,
    playedAt: new Date(Date.now() - m.daysAgo * 86400000),
  })),
);
```

- [ ] **Step 2: Make seed idempotent — clear existing snapshots/matches before inserting**

Add before the new inserts:
```ts
await db.delete(playerRankSnapshots);
await db.delete(matchRecords);
```

- [ ] **Step 3: Run seed**

```bash
npm run db:seed
```
Expected: completes without error. Verify in Supabase Studio that `player_rank_snapshots` has 12 rows and `match_records` has 40 rows for Yamada.

- [ ] **Step 4: Commit**

```bash
git add lib/db/seed.ts
git commit -m "chore: seed rank snapshots and match records for Yamada"
```

---

## Task 3: player-rank-history + player-recent-wl queries

**Files:**
- Create: `lib/queries/player-rank-history.ts`
- Create: `lib/queries/player-recent-wl.ts`

- [ ] **Step 1: Implement `lib/queries/player-rank-history.ts`**

```ts
import { and, eq, gte, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { playerRankSnapshots } from '@/lib/db/schema';

export async function selectRankHistory(playerId: number): Promise<number[]> {
  const yearAgo = new Date();
  yearAgo.setMonth(yearAgo.getMonth() - 12);

  const rows = await db
    .select({ rank: playerRankSnapshots.rank, snapshotAt: playerRankSnapshots.snapshotAt })
    .from(playerRankSnapshots)
    .where(
      and(
        eq(playerRankSnapshots.playerId, playerId),
        eq(playerRankSnapshots.provider, 'jta'),
        gte(playerRankSnapshots.snapshotAt, yearAgo),
      ),
    )
    .orderBy(playerRankSnapshots.snapshotAt);

  return rows.map((r) => r.rank);
}
```

- [ ] **Step 2: Implement `lib/queries/player-recent-wl.ts`**

```ts
import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { matchRecords } from '@/lib/db/schema';

export async function selectRecentWL(playerId: number): Promise<{ wins: number; losses: number }> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const rows = await db
    .select({ result: matchRecords.result, c: sql<number>`count(*)::int` })
    .from(matchRecords)
    .where(
      and(
        eq(matchRecords.playerId, playerId),
        gte(matchRecords.playedAt, sixMonthsAgo),
      ),
    )
    .groupBy(matchRecords.result);

  let wins = 0;
  let losses = 0;
  for (const r of rows) {
    if (r.result === 'won') wins = r.c;
    if (r.result === 'lost') losses = r.c;
  }
  return { wins, losses };
}
```

- [ ] **Step 3: Add shape contract tests**

`tests/unit/queries/player-rank-history.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectRankHistory } from '@/lib/queries/player-rank-history';
describe('selectRankHistory', () => {
  it('is a function', () => expect(typeof selectRankHistory).toBe('function'));
});
```

`tests/unit/queries/player-recent-wl.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectRecentWL } from '@/lib/queries/player-recent-wl';
describe('selectRecentWL', () => {
  it('is a function', () => expect(typeof selectRecentWL).toBe('function'));
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/unit/queries/player-rank-history.test.ts tests/unit/queries/player-recent-wl.test.ts
```
Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/player-rank-history.ts lib/queries/player-recent-wl.ts tests/unit/queries/player-rank-history.test.ts tests/unit/queries/player-recent-wl.test.ts
git commit -m "feat: add player-rank-history and player-recent-wl queries"
```

---

## Task 4: Wire real rank + W-L data into player profile

**Files:**
- Modify: `lib/queries/player-profile.ts`
- Modify: `app/players/[slug]/page.tsx`

- [ ] **Step 1: Update `lib/queries/player-profile.ts`**

Add the new imports:
```ts
import { selectRankHistory } from './player-rank-history';
import { selectRecentWL } from './player-recent-wl';
```

In `PlayerProfileData`, replace `sparkline: number[]` (already present) with:
```ts
sparkline: number[];           // last 12 months of JTA rank
recentWL: { wins: number; losses: number };
```

Replace the placeholder sparkline section with real query:
```ts
const sparkline = await selectRankHistory(p.id);
const recentWL = await selectRecentWL(p.id);
```

Add `recentWL` to the returned object alongside `sparkline`. Update `selectPlayerProfile.shapeKeys`:
```ts
selectPlayerProfile.shapeKeys = [
  'player', 'endorsements', 'currentTournament', 'schedule', 'relatedArticles', 'sparkline', 'recentWL',
] as const;
```

- [ ] **Step 2: Update `app/players/[slug]/page.tsx`**

Remove the hardcoded `recentWL` and use `data.recentWL`:
```tsx
// Delete this line:
//   const recentWL = { wins: 28, losses: 12 };

// Then in the RankingBlock:
<RankingBlock
  jtaRank={data.player.currentJtaRank}
  atpRank={data.player.currentAtpRank}
  recentWL={data.recentWL}
  sparkline={data.sparkline}
/>
```

- [ ] **Step 3: Run dev and verify**

```bash
npm run dev
```
Visit http://localhost:3000/players/yamada-sho. Expected: sparkline shows 12 bars rising left-to-right (50 → 12). W-L stat shows `28-12`.

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add lib/queries/player-profile.ts app/players/[slug]/page.tsx
git commit -m "feat: wire real rank history and W-L stats into player profile"
```

---

## Task 5: TournamentBadge component

**Files:**
- Create: `app/_components/tournament/TournamentBadge.tsx`
- Test: `tests/unit/components/tournament/TournamentBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TournamentBadge } from '@/app/_components/tournament/TournamentBadge';

describe('TournamentBadge', () => {
  it('renders ATP with yellow accent', () => {
    render(<TournamentBadge level="atp" />);
    expect(screen.getByText('ATP')).toBeInTheDocument();
    expect(screen.getByText('ATP').className).toMatch(/bg-signal-yellow/);
  });

  it('renders Challenger with orange', () => {
    render(<TournamentBadge level="challenger" />);
    expect(screen.getByText('CHALLENGER').className).toMatch(/bg-signal-orange/);
  });

  it('renders futures_25 as F25', () => {
    render(<TournamentBadge level="futures_25" />);
    expect(screen.getByText('F25')).toBeInTheDocument();
  });

  it('renders college level', () => {
    render(<TournamentBadge level="college" />);
    expect(screen.getByText('COLLEGE')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/tournament/TournamentBadge.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement `app/_components/tournament/TournamentBadge.tsx`**

```tsx
export type TournamentLevel = 'atp' | 'challenger' | 'futures_25' | 'futures_15' | 'jta' | 'college';

const LEVEL_CONFIG: Record<TournamentLevel, { label: string; cls: string }> = {
  atp: { label: 'ATP', cls: 'bg-signal-yellow text-bg' },
  challenger: { label: 'CHALLENGER', cls: 'bg-signal-orange text-bg' },
  futures_25: { label: 'F25', cls: 'bg-bg-card text-fg border border-signal-yellow' },
  futures_15: { label: 'F15', cls: 'bg-bg-card text-fg border border-border' },
  jta: { label: 'JTA', cls: 'bg-bg-card text-fg-muted border border-border' },
  college: { label: 'COLLEGE', cls: 'bg-bg-card text-fg-muted border border-border' },
};

export function TournamentBadge({ level }: { level: TournamentLevel }) {
  const cfg = LEVEL_CONFIG[level];
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold tracking-widest ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/tournament/TournamentBadge.test.tsx
```
Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/tournament/TournamentBadge.tsx tests/unit/components/tournament/TournamentBadge.test.tsx
git commit -m "feat: add TournamentBadge component with level color coding"
```

---

## Task 6: TournamentListCard + TournamentEntriesTable

**Files:**
- Create: `app/_components/tournament/TournamentListCard.tsx`
- Create: `app/_components/tournament/TournamentEntriesTable.tsx`

- [ ] **Step 1: Implement `app/_components/tournament/TournamentListCard.tsx`**

```tsx
import Link from 'next/link';
import { TournamentBadge, type TournamentLevel } from './TournamentBadge';

export type TournamentSummary = {
  slug: string;
  nameJa: string;
  level: TournamentLevel;
  location: string | null;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'past';
  japaneseEntryCount: number;
};

const STATUS_LABEL: Record<TournamentSummary['status'], { text: string; color: string }> = {
  active: { text: '開催中', color: 'text-signal-red' },
  upcoming: { text: '予定', color: 'text-fg-muted' },
  past: { text: '終了', color: 'text-fg-quiet' },
};

export function TournamentListCard({ t }: { t: TournamentSummary }) {
  const status = STATUS_LABEL[t.status];
  return (
    <Link href={`/tournaments/${t.slug}`} className="bg-bg-panel border border-border p-3.5 block hover:border-fg-muted">
      <div className="flex justify-between items-start mb-2">
        <TournamentBadge level={t.level} />
        <span className={`text-[9px] font-extrabold ${status.color}`}>● {status.text}</span>
      </div>
      <div className="text-fg font-extrabold text-base">{t.nameJa}</div>
      <div className="text-fg-muted text-[10px] mt-1">
        {t.location ?? '—'} · {t.startDate}-{t.endDate}
      </div>
      <div className="text-fg-quiet text-[9px] mt-2">日本人選手 {t.japaneseEntryCount}名</div>
    </Link>
  );
}
```

- [ ] **Step 2: Implement `app/_components/tournament/TournamentEntriesTable.tsx`**

```tsx
import Link from 'next/link';
import { StatusPill } from '../StatusPill';

export type TournamentEntryRow = {
  playerSlug: string;
  playerName: string;
  status: 'alive' | 'scheduled' | 'won' | 'lost' | 'champion';
  currentRound: string | null;
  lastMatchSummary: string | null;
};

const STATUS_COPY: Record<TournamentEntryRow['status'], { color: string; label: string }> = {
  alive: { color: 'border-signal-red', label: '出場中' },
  scheduled: { color: 'border-border', label: '出場予定' },
  won: { color: 'border-signal-green', label: '勝ち抜き' },
  lost: { color: 'border-fg-quiet', label: '敗退' },
  champion: { color: 'border-signal-yellow', label: '優勝' },
};

export function TournamentEntriesTable({ entries }: { entries: TournamentEntryRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {entries.map((e) => {
        const cfg = STATUS_COPY[e.status];
        return (
          <Link
            href={`/players/${e.playerSlug}`}
            key={e.playerSlug}
            className={`grid grid-cols-[120px_80px_1fr] gap-3 items-center bg-bg-panel border-l-2 ${cfg.color} px-3 py-2 hover:bg-bg-card`}
          >
            <span className="text-fg font-bold text-[12px]">{e.playerName}</span>
            <span className="text-fg-muted text-[10px]">{cfg.label}</span>
            <span className="text-fg-muted text-[10px]">
              {e.currentRound ? `残${e.currentRound}` : ''}
              {e.lastMatchSummary ? ` · ${e.lastMatchSummary}` : ''}
            </span>
          </Link>
        );
      })}
      {entries.length === 0 && (
        <div className="text-fg-muted text-[11px] p-3">日本人選手の出場記録はありません。</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/_components/tournament/TournamentListCard.tsx app/_components/tournament/TournamentEntriesTable.tsx
git commit -m "feat: add TournamentListCard and TournamentEntriesTable"
```

---

## Task 7: Tournament queries

**Files:**
- Create: `lib/queries/tournament-index.ts`
- Create: `lib/queries/tournament-detail.ts`

- [ ] **Step 1: Implement `lib/queries/tournament-index.ts`**

```ts
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { tournaments, tournamentEntries } from '@/lib/db/schema';
import type { TournamentSummary } from '@/app/_components/tournament/TournamentListCard';

export async function selectTournamentIndex(): Promise<{
  active: TournamentSummary[];
  upcoming: TournamentSummary[];
  past: TournamentSummary[];
}> {
  const now = new Date();
  const rows = await db
    .select({
      slug: tournaments.slug,
      nameJa: tournaments.nameJa,
      level: tournaments.level,
      location: tournaments.location,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      entryCount: sql<number>`count(${tournamentEntries.id})::int`,
    })
    .from(tournaments)
    .leftJoin(tournamentEntries, eq(tournamentEntries.tournamentId, tournaments.id))
    .groupBy(tournaments.id)
    .orderBy(desc(tournaments.startDate));

  const fmt = (d: Date) => d.toISOString().slice(5, 10).replace('-', '/');

  const summaries: TournamentSummary[] = rows.map((t) => {
    const status: TournamentSummary['status'] =
      t.endDate < now ? 'past'
      : t.startDate > now ? 'upcoming'
      : 'active';
    return {
      slug: t.slug, nameJa: t.nameJa,
      level: t.level as TournamentSummary['level'],
      location: t.location,
      startDate: fmt(t.startDate), endDate: fmt(t.endDate),
      status,
      japaneseEntryCount: t.entryCount,
    };
  });

  return {
    active: summaries.filter((s) => s.status === 'active'),
    upcoming: summaries.filter((s) => s.status === 'upcoming'),
    past: summaries.filter((s) => s.status === 'past'),
  };
}
```

- [ ] **Step 2: Implement `lib/queries/tournament-detail.ts`**

```ts
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { tournaments, tournamentEntries, players } from '@/lib/db/schema';
import type { TournamentLevel } from '@/app/_components/tournament/TournamentBadge';
import type { TournamentEntryRow } from '@/app/_components/tournament/TournamentEntriesTable';

export type TournamentDetail = {
  slug: string;
  nameJa: string;
  nameEn: string;
  level: TournamentLevel;
  location: string | null;
  surface: string | null;
  startDate: string;
  endDate: string;
  externalUrl: string | null;
  status: 'active' | 'upcoming' | 'past';
  entries: TournamentEntryRow[];
};

const STATUS_ORDER: Record<TournamentEntryRow['status'], number> = {
  alive: 0, scheduled: 1, champion: 2, won: 3, lost: 4,
};

export async function selectTournamentDetail(slug: string): Promise<TournamentDetail | null> {
  const [t] = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1);
  if (!t) return null;

  const rows = await db
    .select({
      playerSlug: players.slug,
      playerName: players.nameJa,
      status: tournamentEntries.status,
      currentRound: tournamentEntries.currentRound,
      lastMatchSummary: tournamentEntries.lastMatchSummary,
    })
    .from(tournamentEntries)
    .innerJoin(players, eq(tournamentEntries.playerId, players.id))
    .where(eq(tournamentEntries.tournamentId, t.id));

  const entries: TournamentEntryRow[] = rows
    .map((r) => ({
      playerSlug: r.playerSlug,
      playerName: r.playerName,
      status: r.status as TournamentEntryRow['status'],
      currentRound: r.currentRound,
      lastMatchSummary: r.lastMatchSummary,
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const now = new Date();
  const status: TournamentDetail['status'] =
    t.endDate < now ? 'past'
    : t.startDate > now ? 'upcoming'
    : 'active';
  const fmt = (d: Date) => d.toISOString().slice(5, 10).replace('-', '/');

  return {
    slug: t.slug, nameJa: t.nameJa, nameEn: t.nameEn,
    level: t.level as TournamentLevel,
    location: t.location, surface: t.surface,
    startDate: fmt(t.startDate), endDate: fmt(t.endDate),
    externalUrl: t.externalUrl,
    status,
    entries,
  };
}
```

- [ ] **Step 3: Add shape contract tests**

`tests/unit/queries/tournament-index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectTournamentIndex } from '@/lib/queries/tournament-index';
describe('selectTournamentIndex', () => {
  it('is a function', () => expect(typeof selectTournamentIndex).toBe('function'));
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/unit/queries/tournament-index.test.ts
```
Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/tournament-index.ts lib/queries/tournament-detail.ts tests/unit/queries/tournament-index.test.ts
git commit -m "feat: add tournament-index and tournament-detail queries"
```

---

## Task 8: /tournaments index page

**Files:**
- Create: `app/tournaments/page.tsx`

- [ ] **Step 1: Implement `app/tournaments/page.tsx`**

```tsx
import { SiteHeader } from '@/app/_components/SiteHeader';
import { TournamentListCard } from '@/app/_components/tournament/TournamentListCard';
import { selectTournamentIndex } from '@/lib/queries/tournament-index';

export const revalidate = 1800;

export default async function TournamentsIndexPage() {
  const data = await selectTournamentIndex();

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/tournaments" />
      <div className="px-4 py-4 max-w-5xl mx-auto">
        <h1 className="text-fg font-extrabold text-lg mb-3">大会一覧</h1>

        {data.active.length > 0 && (
          <Section title={`開催中 (${data.active.length})`} accent="signal-red">
            {data.active.map((t) => <TournamentListCard key={t.slug} t={t} />)}
          </Section>
        )}

        {data.upcoming.length > 0 && (
          <Section title={`予定 (${data.upcoming.length})`} accent="signal-yellow">
            {data.upcoming.map((t) => <TournamentListCard key={t.slug} t={t} />)}
          </Section>
        )}

        {data.past.length > 0 && (
          <Section title={`終了 (${data.past.length})`} accent="fg-quiet">
            {data.past.slice(0, 12).map((t) => <TournamentListCard key={t.slug} t={t} />)}
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className={`text-[10px] tracking-widest font-extrabold mb-2 text-${accent}`}>— {title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run dev and verify**

```bash
npm run dev
```
Visit http://localhost:3000/tournaments.

Expected: "開催中" section with 3 cards (Roanne Challenger, 四日市 F1, 広島 F4), badges color-coded by level, status pills, entry counts.

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/tournaments/page.tsx
git commit -m "feat: implement /tournaments index page"
```

---

## Task 9: /tournaments/[slug] page

**Files:**
- Create: `app/tournaments/[slug]/page.tsx`

- [ ] **Step 1: Implement `app/tournaments/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { TournamentBadge } from '@/app/_components/tournament/TournamentBadge';
import { TournamentEntriesTable } from '@/app/_components/tournament/TournamentEntriesTable';
import { selectTournamentDetail } from '@/lib/queries/tournament-detail';

export const revalidate = 1800;

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  active: { text: '開催中', color: 'text-signal-red' },
  upcoming: { text: '開催予定', color: 'text-fg-muted' },
  past: { text: '終了', color: 'text-fg-quiet' },
};

export default async function TournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await selectTournamentDetail(slug);
  if (!t) notFound();
  const status = STATUS_LABEL[t.status];

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/tournaments" />
      <header className="bg-bg-panel border-b border-border px-4 py-6">
        <div className="flex gap-2 items-center mb-2">
          <TournamentBadge level={t.level} />
          <span className={`text-[10px] font-extrabold ${status.color}`}>● {status.text}</span>
        </div>
        <h1 className="text-2xl font-black text-fg tracking-tighter">{t.nameJa}</h1>
        <div className="text-fg-muted text-[11px] mt-1">
          {t.nameEn} · {t.location ?? '—'} · {t.surface ?? '—'} · {t.startDate}-{t.endDate}
        </div>
        {t.externalUrl && (
          <a href={t.externalUrl} target="_blank" rel="noopener" className="text-signal-yellow text-[10px] mt-2 inline-block underline">
            公式サイト →
          </a>
        )}
      </header>

      <div className="px-4 py-4 max-w-5xl mx-auto">
        <h2 className="text-[10px] tracking-widest text-fg-muted font-extrabold mb-2.5">
          — 日本人選手の出場記録 ({t.entries.length})
        </h2>
        <TournamentEntriesTable entries={t.entries} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run dev and verify**

```bash
npm run dev
```
Visit http://localhost:3000/tournaments/roanne-challenger-2026.

Expected: orange CHALLENGER badge, 開催中 status, "Roanne Challenger" title, entries table with ダニエル 太郎 (alive) and 西岡 良仁 (won).

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/tournaments/
git commit -m "feat: implement /tournaments/[slug] detail page"
```

---

## Task 10: Deep-link tournament names from top page Today panel

**Files:**
- Modify: `app/_components/TodayStatusPanel.tsx`
- Modify: `lib/queries/top-page.ts`

- [ ] **Step 1: Update `AliveEntry`/`RecentResultEntry` types in `TodayStatusPanel.tsx`**

Append `tournamentSlug: string` to both types:
```ts
export type AliveEntry = {
  playerSlug: string;
  playerName: string;
  tournamentSlug: string;
  tournamentName: string;
  currentRound: string;
  note?: string;
};

export type RecentResultEntry = {
  playerSlug: string;
  playerName: string;
  tournamentSlug: string;
  tournamentName: string;
  result: 'won' | 'lost';
  summary: string;
};
```

Wrap each `{e.tournamentName}` mention in a `<Link>`:
```tsx
<Link href={`/tournaments/${e.tournamentSlug}`} className="hover:text-signal-yellow">{e.tournamentName}</Link>
```

- [ ] **Step 2: Update `lib/queries/top-page.ts` to include slugs**

In both `getAlive` and `getRecent`, add `tournamentSlug: tournaments.slug` to the select and to the returned object.

Update `TopPageData['aliveEntries']` and `recentResults` type definitions to include `tournamentSlug: string`.

- [ ] **Step 3: Run dev and verify**

```bash
npm run dev
```
Click "広島 F4" in the top page Today panel. Should navigate to `/tournaments/hiroshima-f4-2026`.

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add app/_components/TodayStatusPanel.tsx lib/queries/top-page.ts
git commit -m "feat: link tournament names from top page to detail pages"
```

---

## Task 11: Playwright E2E for tournaments

**Files:**
- Create: `tests/e2e/tournaments.spec.ts`

- [ ] **Step 1: Create `tests/e2e/tournaments.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('tournaments index lists active and upcoming', async ({ page }) => {
  await page.goto('/tournaments');
  await expect(page.getByRole('heading', { name: '大会一覧' })).toBeVisible();
  await expect(page.getByText(/開催中/)).toBeVisible();
  await expect(page.getByText('Roanne Challenger')).toBeVisible();
  await expect(page.getByText('広島 F4')).toBeVisible();
});

test('tournament detail page shows entries grouped by status', async ({ page }) => {
  await page.goto('/tournaments/roanne-challenger-2026');
  await expect(page.getByRole('heading', { name: 'Roanne Challenger' })).toBeVisible();
  await expect(page.getByText('CHALLENGER')).toBeVisible();
  await expect(page.getByText('ダニエル 太郎')).toBeVisible();
  await expect(page.getByText('西岡 良仁')).toBeVisible();
});

test('clicking entry navigates to player profile', async ({ page }) => {
  await page.goto('/tournaments/roanne-challenger-2026');
  await page.getByRole('link', { name: /ダニエル 太郎/ }).click();
  await expect(page).toHaveURL(/\/players\/daniel-taro/);
});

test('top page Today panel links to tournament', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '広島 F4' }).first().click();
  await expect(page).toHaveURL(/\/tournaments\/hiroshima-f4-2026/);
});

test('404 for unknown tournament', async ({ page }) => {
  const res = await page.goto('/tournaments/nope');
  expect(res?.status()).toBe(404);
});
```

- [ ] **Step 2: Run E2E**

```bash
npm run test:e2e
```
Expected: all tests passing.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/tournaments.spec.ts
git commit -m "test: add Playwright E2E for tournament pages"
```

---

## Self-Review Checklist

- [x] Spec coverage:
  - Section 3.4 (tournament list/calendar): Tasks 5-8
  - Section 4 (Tournament + TournamentEntry tables already in Plan 1; new rank/match tables added here): Task 1
  - Section 5.4 (alive/won/lost logic): Tasks 7, 9
- [x] Placeholder scan:
  - Hardcoded `recentWL` from Plan 2 is now replaced with the real query (Task 4).
  - Hardcoded sparkline from Plan 2 is now replaced with `selectRankHistory` (Task 4).
  - No remaining placeholders.
- [x] Type consistency:
  - `TournamentLevel` union matches the `tournamentLevel` pg enum
  - `TournamentEntryRow.status` union matches `tournamentEntries.status` pg enum
  - `TournamentSummary` shared between query and component
  - `AliveEntry`/`RecentResultEntry` updated consistently in component, query, and top page consumer
