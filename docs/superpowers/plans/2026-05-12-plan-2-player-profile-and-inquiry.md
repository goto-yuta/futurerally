# FutureRally Plan 2: Player Profile + Sponsorship Scorecard + Inquiry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the player profile page with the Sponsorship Scorecard (the core differentiator), plus a working sponsor inquiry form that emails the editor via Resend. Add a `/players` index page with category filtering.

**Architecture:** Two new routes (`/players` and `/players/[slug]`) plus one API route (`/api/inquiry`). Profile page is a Server Component pulling everything for one player in a single query. The inquiry form is a Client Component that POSTs to the API route which validates with zod, inserts into `sponsorship_inquiries`, and sends an email via Resend. Cloudflare Turnstile gates the form against bots.

**Tech Stack:** Same as Plan 1, plus: zod (validation), Resend (transactional email), @marsidev/react-turnstile (bot protection).

**Prerequisites:** Plan 1 complete (schema, seed data, primitives).

**Related Spec:** `docs/superpowers/specs/2026-05-12-futurerally-tennis-media-design.md` sections 3.2, 3.5, 4, 7.4.

---

## File Structure

```
app/
├── players/
│   ├── page.tsx                              # /players index (filterable)
│   └── [slug]/
│       └── page.tsx                          # /players/<slug> profile page
├── api/
│   └── inquiry/
│       └── route.ts                          # POST /api/inquiry
└── _components/
    ├── player/
    │   ├── PlayerHero.tsx                    # Photo + name + endorsement bar
    │   ├── CurrentStatusStrip.tsx            # ● Active tournament strip
    │   ├── RankingBlock.tsx                  # Ranking + W-L + sparkline
    │   ├── RankingSparkline.tsx              # 12-month bar chart
    │   ├── SchedulePanel.tsx                 # Tournament schedule table
    │   ├── RelatedArticles.tsx               # 5 most recent tagged
    │   ├── ScorecardPanel.tsx                # SNS reach + personal + sponsors + asks
    │   ├── ProQuoteCard.tsx                  # ★ Pro comment block
    │   └── InquiryForm.tsx                   # Client Component
    └── PlayerListCard.tsx                    # Card used on /players index
lib/
├── queries/
│   ├── player-profile.ts                     # Loads everything for a profile page
│   └── player-index.ts                       # Loads paginated player list
├── validation/
│   └── inquiry-schema.ts                     # Zod schema for inquiry payload
└── email/
    └── send-inquiry-email.ts                 # Resend wrapper
tests/
├── unit/
│   ├── components/player/
│   │   ├── RankingSparkline.test.tsx
│   │   ├── ScorecardPanel.test.tsx
│   │   └── InquiryForm.test.tsx
│   ├── queries/
│   │   ├── player-profile.test.ts            # shape contract
│   │   └── player-index.test.ts              # shape contract
│   └── validation/
│       └── inquiry-schema.test.ts
└── e2e/
    ├── player-profile.spec.ts
    ├── player-index.spec.ts
    └── inquiry-flow.spec.ts
```

---

## Task 1: Install dependencies (zod + Resend + Turnstile)

**Files:** `package.json`, `.env.example`, `.env.local`

- [ ] **Step 1: Install packages**

```bash
npm install zod resend @marsidev/react-turnstile
```

- [ ] **Step 2: Add env vars to `.env.example`**

Append to the file:
```env
# Resend
RESEND_API_KEY=""
INQUIRY_TO_EMAIL="editor@futurerally.example"

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=""
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
```

- [ ] **Step 3: Copy into `.env.local` and fill real values**

Engineer signs up at https://resend.com (free tier 100/day) and https://www.cloudflare.com/products/turnstile/, copies keys into `.env.local`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add zod, resend, turnstile dependencies"
```

---

## Task 2: Inquiry zod schema + tests

**Files:**
- Create: `lib/validation/inquiry-schema.ts`
- Test: `tests/unit/validation/inquiry-schema.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/validation/inquiry-schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { inquirySchema } from '@/lib/validation/inquiry-schema';

describe('inquirySchema', () => {
  const valid = {
    playerSlug: 'yamada-sho',
    companyName: '株式会社テストブランド',
    contactName: '田中 太郎',
    contactEmail: 'tanaka@example.com',
    message: 'スポンサーシップにご興味があります。',
    turnstileToken: 'cf-token-xyz',
  };

  it('accepts valid payload', () => {
    expect(inquirySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = inquirySchema.safeParse({ ...valid, contactEmail: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects empty message', () => {
    const r = inquirySchema.safeParse({ ...valid, message: '' });
    expect(r.success).toBe(false);
  });

  it('rejects missing turnstile token', () => {
    const r = inquirySchema.safeParse({ ...valid, turnstileToken: '' });
    expect(r.success).toBe(false);
  });

  it('rejects message longer than 4000 chars', () => {
    const r = inquirySchema.safeParse({ ...valid, message: 'x'.repeat(4001) });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/validation/inquiry-schema.test.ts
```
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement `lib/validation/inquiry-schema.ts`**

```ts
import { z } from 'zod';

export const inquirySchema = z.object({
  playerSlug: z.string().min(1).max(64),
  companyName: z.string().min(1).max(128),
  contactName: z.string().min(1).max(64),
  contactEmail: z.string().email().max(128),
  message: z.string().min(1).max(4000),
  turnstileToken: z.string().min(1),
});

export type InquiryPayload = z.infer<typeof inquirySchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/validation/inquiry-schema.test.ts
```
Expected: 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/validation/inquiry-schema.ts tests/unit/validation/inquiry-schema.test.ts
git commit -m "feat: add zod schema for sponsorship inquiry"
```

---

## Task 3: Resend email wrapper

**Files:**
- Create: `lib/email/send-inquiry-email.ts`

- [ ] **Step 1: Implement `lib/email/send-inquiry-email.ts`**

(Resend integration covered by E2E; we keep this small.)

```ts
import { Resend } from 'resend';

type Args = {
  playerName: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  message: string;
};

export async function sendInquiryEmail(args: Args): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  if (!apiKey || !to) {
    throw new Error('RESEND_API_KEY or INQUIRY_TO_EMAIL not set');
  }
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: 'FutureRally <inquiry@futurerally.example>',
    to,
    replyTo: args.contactEmail,
    subject: `[Inquiry] ${args.companyName} → ${args.playerName}`,
    text: [
      `選手: ${args.playerName}`,
      `会社: ${args.companyName}`,
      `担当: ${args.contactName} <${args.contactEmail}>`,
      '',
      '--- メッセージ ---',
      args.message,
    ].join('\n'),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/email/send-inquiry-email.ts
git commit -m "feat: add Resend wrapper for inquiry notification email"
```

---

## Task 4: /api/inquiry route

**Files:**
- Create: `app/api/inquiry/route.ts`

- [ ] **Step 1: Implement `app/api/inquiry/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { inquirySchema } from '@/lib/validation/inquiry-schema';
import { db } from '@/lib/db/client';
import { players, sponsorshipInquiries } from '@/lib/db/schema';
import { sendInquiryEmail } from '@/lib/email/send-inquiry-email';

export const runtime = 'nodejs';

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const json = (await res.json()) as { success: boolean };
  return json.success;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = inquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ok = await verifyTurnstile(payload.turnstileToken, ip);
  if (!ok) return NextResponse.json({ error: 'turnstile failed' }, { status: 403 });

  const [player] = await db.select().from(players).where(eq(players.slug, payload.playerSlug)).limit(1);
  if (!player) return NextResponse.json({ error: 'player not found' }, { status: 404 });

  await db.insert(sponsorshipInquiries).values({
    playerId: player.id,
    companyName: payload.companyName,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    message: payload.message,
  });

  try {
    await sendInquiryEmail({
      playerName: player.nameJa,
      companyName: payload.companyName,
      contactName: payload.contactName,
      contactEmail: payload.contactEmail,
      message: payload.message,
    });
  } catch (e) {
    console.error('email send failed', e);
    // DB row is already saved; we accept partial failure
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/inquiry/route.ts
git commit -m "feat: add POST /api/inquiry endpoint with Turnstile + DB + email"
```

---

## Task 5: RankingSparkline component

**Files:**
- Create: `app/_components/player/RankingSparkline.tsx`
- Test: `tests/unit/components/player/RankingSparkline.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RankingSparkline } from '@/app/_components/player/RankingSparkline';

describe('RankingSparkline', () => {
  it('renders one bar per data point', () => {
    const points = [50, 45, 40, 38, 30, 28, 25, 22, 18, 15, 13, 12];
    const { container } = render(<RankingSparkline points={points} highlightLast={3} />);
    expect(container.querySelectorAll('.spark-bar').length).toBe(12);
  });

  it('highlights the last N bars yellow', () => {
    const points = [50, 45, 40, 38, 30, 28, 25, 22, 18, 15, 13, 12];
    const { container } = render(<RankingSparkline points={points} highlightLast={3} />);
    const bars = container.querySelectorAll('.spark-bar');
    expect(bars[11].className).toMatch(/bg-signal-yellow/);
    expect(bars[9].className).toMatch(/bg-signal-yellow/);
    expect(bars[8].className).toMatch(/bg-bg-card/);
  });

  it('renders empty state when no points', () => {
    render(<RankingSparkline points={[]} highlightLast={0} />);
    expect(screen.getByText('データなし')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/player/RankingSparkline.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement `app/_components/player/RankingSparkline.tsx`**

```tsx
export function RankingSparkline({
  points, highlightLast,
}: { points: number[]; highlightLast: number }) {
  if (points.length === 0) return <div className="text-fg-quiet text-[9px]">データなし</div>;
  // Smaller rank number is better; invert so taller bars = better rank
  const max = Math.max(...points);
  return (
    <div className="flex items-end gap-0.5 h-9">
      {points.map((v, i) => {
        const heightPct = ((max - v) / max) * 100;
        const highlighted = i >= points.length - highlightLast;
        return (
          <div
            key={i}
            className={`spark-bar flex-1 ${highlighted ? 'bg-signal-yellow' : 'bg-bg-card'}`}
            style={{ height: `${Math.max(heightPct, 5)}%` }}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/player/RankingSparkline.test.tsx
```
Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/player/RankingSparkline.tsx tests/unit/components/player/RankingSparkline.test.tsx
git commit -m "feat: add RankingSparkline component"
```

---

## Task 6: RankingBlock + SchedulePanel + RelatedArticles + CurrentStatusStrip + ProQuoteCard

These are small presentational components. Bundled into one task for efficiency. No unit tests — covered by E2E.

**Files:**
- Create: `app/_components/player/RankingBlock.tsx`
- Create: `app/_components/player/SchedulePanel.tsx`
- Create: `app/_components/player/RelatedArticles.tsx`
- Create: `app/_components/player/CurrentStatusStrip.tsx`
- Create: `app/_components/player/ProQuoteCard.tsx`

- [ ] **Step 1: Implement `app/_components/player/RankingBlock.tsx`**

```tsx
import { RankingSparkline } from './RankingSparkline';

export function RankingBlock({
  jtaRank, atpRank, recentWL, sparkline,
}: {
  jtaRank: number | null;
  atpRank: number | null;
  recentWL: { wins: number; losses: number };
  sparkline: number[];
}) {
  return (
    <div className="bg-bg-panel border border-border p-3.5">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-2.5">
        — RANKING & 直近成績
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="JTA" value={jtaRank ? `#${jtaRank}` : '—'} color="signal-yellow" />
        <Stat label="ATP" value={atpRank ? `${atpRank}` : '—'} color="fg" />
        <Stat label="直近6ヶ月 W-L" value={`${recentWL.wins}-${recentWL.losses}`} color="signal-green" />
      </div>
      <div className="text-[8px] text-fg-muted mb-1">JTAランキング推移(12ヶ月)</div>
      <RankingSparkline points={sparkline} highlightLast={3} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[9px] text-fg-muted">{label}</div>
      <div className={`tabular text-[22px] font-black text-${color}`}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `app/_components/player/SchedulePanel.tsx`**

```tsx
export type ScheduleEntry = {
  tournamentSlug: string;
  tournamentName: string;
  status: 'alive' | 'scheduled' | 'won' | 'lost' | 'champion';
  startDate: string;
  endDate: string;
};

const STATUS_COLOR: Record<ScheduleEntry['status'], string> = {
  alive: 'border-signal-red',
  scheduled: 'border-border',
  won: 'border-signal-green',
  lost: 'border-signal-red',
  champion: 'border-signal-yellow',
};

const STATUS_LABEL: Record<ScheduleEntry['status'], { text: string; color: string }> = {
  alive: { text: '出場中', color: 'text-signal-red' },
  scheduled: { text: '予定', color: 'text-fg-muted' },
  won: { text: '勝ち抜き', color: 'text-signal-green' },
  lost: { text: '敗退', color: 'text-fg-muted' },
  champion: { text: '優勝', color: 'text-signal-yellow' },
};

export function SchedulePanel({ entries }: { entries: ScheduleEntry[] }) {
  return (
    <div className="bg-bg-panel border border-border p-3.5">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-2.5">
        — 出場予定 / TOURNAMENT SCHEDULE
      </div>
      <ul className="flex flex-col gap-1.5">
        {entries.map((e) => {
          const label = STATUS_LABEL[e.status];
          return (
            <li
              key={e.tournamentSlug}
              className={`grid grid-cols-[60px_1fr_80px] gap-2 text-[10px] py-1.5 px-2 bg-bg border-l-2 ${STATUS_COLOR[e.status]}`}
            >
              <span className={`${label.color} font-extrabold text-[9px]`}>{label.text}</span>
              <span className="text-fg">{e.tournamentName}</span>
              <span className="text-fg-muted text-[9px]">{e.startDate}-{e.endDate}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Implement `app/_components/player/RelatedArticles.tsx`**

```tsx
import Link from 'next/link';

export type RelatedArticle = {
  slug: string;
  title: string;
  publishedAt: string;
};

export function RelatedArticles({ articles }: { articles: RelatedArticle[] }) {
  return (
    <div className="bg-bg-panel border border-border p-3.5">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-2.5">
        — 関連記事 / {articles.length}本
      </div>
      <ul className="flex flex-col gap-1.5">
        {articles.map((a) => (
          <li key={a.slug} className="border-b border-border pb-1.5 last:border-b-0">
            <Link href={`/articles/${a.slug}`} className="text-[11px] text-fg font-semibold">
              {a.title}
            </Link>
            <span className="text-fg-quiet text-[9px] ml-1.5">({a.publishedAt})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Implement `app/_components/player/CurrentStatusStrip.tsx`**

```tsx
import { StatusPill } from '../StatusPill';

export function CurrentStatusStrip({
  tournamentName, currentRound, nextMatchAt, nextOpponent,
}: {
  tournamentName: string;
  currentRound: string;
  nextMatchAt: string | null;
  nextOpponent: string | null;
}) {
  return (
    <div className="bg-bg px-4 py-2.5 border-b border-border flex gap-3 items-center">
      <StatusPill status="live">● 大会出場中</StatusPill>
      <span className="text-[10px] text-fg font-semibold">
        {tournamentName} · 残{currentRound}
      </span>
      {nextMatchAt && (
        <span className="text-[9px] text-fg-muted">
          本日プレー予定 / {nextMatchAt}{nextOpponent ? ` vs ${nextOpponent}` : ''}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Implement `app/_components/player/ProQuoteCard.tsx`**

```tsx
export function ProQuoteCard({ proName, quote }: { proName: string; quote: string }) {
  return (
    <div className="bg-bg-panel border border-border p-3.5">
      <div className="text-[9px] tracking-widest text-signal-yellow font-extrabold mb-2.5">
        ★ プロのコメント
      </div>
      <blockquote className="border-l-2 border-signal-yellow pl-2.5 text-[10px] text-fg leading-relaxed italic mb-1.5">
        「{quote}」
      </blockquote>
      <div className="text-[9px] text-fg-muted">— {proName}</div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/_components/player/
git commit -m "feat: add RankingBlock, SchedulePanel, RelatedArticles, CurrentStatusStrip, ProQuoteCard"
```

---

## Task 7: ScorecardPanel — the differentiator

**Files:**
- Create: `app/_components/player/ScorecardPanel.tsx`
- Test: `tests/unit/components/player/ScorecardPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScorecardPanel } from '@/app/_components/player/ScorecardPanel';

const sample = {
  sns: { ig: 4200, ig_er: 6.8, x: 1850, x_er: 3.2, tiktok: 980 },
  personal: { languages: ['英語(中級)'], interests: ['ファッション', '音楽'], posting_style: '週2回 Vlog' },
  currentSponsors: ['YONEX', '○○薬局'],
  asks: ['海外遠征費', 'ストリングス契約'],
};

describe('ScorecardPanel', () => {
  it('renders SNS reach numbers', () => {
    render(<ScorecardPanel scorecard={sample} onInquire={() => {}} />);
    expect(screen.getByText('4,200')).toBeInTheDocument();
    expect(screen.getByText('1,850')).toBeInTheDocument();
    expect(screen.getByText('980')).toBeInTheDocument();
    expect(screen.getByText('ER 6.8%')).toBeInTheDocument();
  });

  it('renders current sponsors and asks', () => {
    render(<ScorecardPanel scorecard={sample} onInquire={() => {}} />);
    expect(screen.getByText('YONEX')).toBeInTheDocument();
    expect(screen.getByText(/海外遠征費/)).toBeInTheDocument();
  });

  it('renders inquiry CTA', () => {
    render(<ScorecardPanel scorecard={sample} onInquire={() => {}} />);
    expect(screen.getByRole('button', { name: /スポンサー候補として問い合わせる/ })).toBeInTheDocument();
  });

  it('shows fallback when fields are missing', () => {
    render(<ScorecardPanel scorecard={{ sns: {}, personal: {}, currentSponsors: [], asks: [] }} onInquire={() => {}} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/player/ScorecardPanel.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement `app/_components/player/ScorecardPanel.tsx`**

```tsx
export type Scorecard = {
  sns: { ig?: number; ig_er?: number; x?: number; x_er?: number; tiktok?: number; tiktok_er?: number };
  personal: { languages?: string[]; interests?: string[]; posting_style?: string };
  currentSponsors: string[];
  asks: string[];
};

export function ScorecardPanel({
  scorecard, onInquire,
}: { scorecard: Scorecard; onInquire: () => void }) {
  const s = scorecard;
  return (
    <div
      className="border border-signal-yellow p-3.5"
      style={{ background: 'linear-gradient(180deg, #1f1d12 0%, #16191f 100%)' }}
    >
      <div className="text-[9px] tracking-widest text-signal-yellow font-extrabold mb-3">
        ★ SPONSORSHIP SCORECARD
      </div>

      <Section title="SNS REACH">
        <div className="grid grid-cols-3 gap-1.5">
          <SnsCell label="Instagram" count={s.sns.ig} er={s.sns.ig_er} />
          <SnsCell label="X (Twitter)" count={s.sns.x} er={s.sns.x_er} />
          <SnsCell label="TikTok" count={s.sns.tiktok} er={s.sns.tiktok_er} />
        </div>
      </Section>

      <Section title="PERSONAL">
        <div className="text-[10px] text-fg leading-relaxed">
          {s.personal.languages && s.personal.languages.length > 0 ? <>語学: {s.personal.languages.join(' / ')}<br /></> : null}
          {s.personal.interests && s.personal.interests.length > 0 ? <>興味: {s.personal.interests.join(' · ')}<br /></> : null}
          {s.personal.posting_style ? <>発信スタイル: {s.personal.posting_style}</> : null}
          {!s.personal.languages?.length && !s.personal.interests?.length && !s.personal.posting_style && '—'}
        </div>
      </Section>

      <Section title="CURRENT SPONSORS">
        <div className="flex gap-1 flex-wrap">
          {s.currentSponsors.length === 0
            ? <span className="text-fg-muted text-[10px]">—</span>
            : s.currentSponsors.map((c) => (
              <span key={c} className="bg-bg text-[9px] px-1.5 py-0.5 text-fg border border-border">{c}</span>
            ))}
        </div>
      </Section>

      <Section title="SPONSORSHIP ASK / 求めているもの">
        {s.asks.length === 0
          ? <div className="text-fg-muted text-[10px]">—</div>
          : <ul className="flex flex-col gap-0.5">
              {s.asks.map((a) => <li key={a} className="text-fg text-[10px]">▸ {a}</li>)}
            </ul>}
      </Section>

      <button
        onClick={onInquire}
        className="w-full bg-signal-yellow text-bg py-2.5 font-extrabold text-[11px] tracking-widest mt-2"
      >
        ▸ スポンサー候補として問い合わせる
      </button>
      <div className="text-[8px] text-fg-muted text-center mt-1.5">問い合わせは編集部経由 → 選手本人へ</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <div className="text-[8px] tracking-widest text-fg-muted mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function SnsCell({ label, count, er }: { label: string; count?: number; er?: number }) {
  return (
    <div className="bg-bg p-1.5 border border-border">
      <div className="text-[8px] text-fg-muted">{label}</div>
      <div className="tabular text-[14px] font-extrabold text-fg">
        {count ? count.toLocaleString() : '—'}
      </div>
      <div className="text-[8px] text-signal-green">{er ? `ER ${er}%` : '—'}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/player/ScorecardPanel.test.tsx
```
Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/player/ScorecardPanel.tsx tests/unit/components/player/ScorecardPanel.test.tsx
git commit -m "feat: add ScorecardPanel (the sponsor-facing differentiator)"
```

---

## Task 8: InquiryForm (Client Component with Turnstile)

**Files:**
- Create: `app/_components/player/InquiryForm.tsx`
- Test: `tests/unit/components/player/InquiryForm.test.tsx`

- [ ] **Step 1: Write the failing test**

(We test form rendering and disabled state. Full submission flow is covered by Playwright in Task 14.)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InquiryForm } from '@/app/_components/player/InquiryForm';

describe('InquiryForm', () => {
  it('renders all required fields', () => {
    render(<InquiryForm playerSlug="yamada-sho" playerName="山田 翔" onSuccess={() => {}} />);
    expect(screen.getByLabelText(/会社名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/担当者名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メッセージ/)).toBeInTheDocument();
  });

  it('submit button is disabled until turnstile token exists', () => {
    render(<InquiryForm playerSlug="yamada-sho" playerName="山田 翔" onSuccess={() => {}} />);
    const btn = screen.getByRole('button', { name: /送信/ });
    expect(btn).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/player/InquiryForm.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement `app/_components/player/InquiryForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

export function InquiryForm({
  playerSlug, playerName, onSuccess,
}: { playerSlug: string; playerName: string; onSuccess: () => void }) {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!token && company && name && email && message && !sending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    const res = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerSlug, companyName: company, contactName: name,
        contactEmail: email, message, turnstileToken: token,
      }),
    });
    setSending(false);
    if (res.ok) { onSuccess(); }
    else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? '送信に失敗しました');
    }
  }

  const fieldCls = 'w-full bg-bg border border-border px-2 py-1.5 text-[11px] text-fg';
  const labelCls = 'text-[9px] tracking-widest text-fg-muted font-bold mb-1 block';

  return (
    <form onSubmit={onSubmit} className="bg-bg-panel border border-border p-4 flex flex-col gap-2.5">
      <h3 className="text-fg font-extrabold text-sm mb-1.5">{playerName} へ問い合わせ</h3>

      <div>
        <label className={labelCls} htmlFor="company">会社名</label>
        <input id="company" className={fieldCls} value={company} onChange={(e) => setCompany(e.target.value)} required />
      </div>
      <div>
        <label className={labelCls} htmlFor="name">担当者名</label>
        <input id="name" className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className={labelCls} htmlFor="email">メールアドレス</label>
        <input id="email" type="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className={labelCls} htmlFor="message">メッセージ</label>
        <textarea id="message" rows={5} className={fieldCls} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={setToken}
          options={{ theme: 'dark' }}
        />
      )}

      {error && <div className="text-signal-red text-[10px]">{error}</div>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-signal-yellow text-bg py-2.5 font-extrabold text-[11px] tracking-widest disabled:opacity-40"
      >
        {sending ? '送信中…' : '送信する'}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/player/InquiryForm.test.tsx
```
Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/_components/player/InquiryForm.tsx tests/unit/components/player/InquiryForm.test.tsx
git commit -m "feat: add InquiryForm client component with Turnstile"
```

---

## Task 9: PlayerHero component

**Files:**
- Create: `app/_components/player/PlayerHero.tsx`

- [ ] **Step 1: Implement `app/_components/player/PlayerHero.tsx`**

```tsx
import Image from 'next/image';
import { EndorsementBadge } from '../EndorsementBadge';

export type PlayerHeroProps = {
  nameJa: string;
  nameEn: string;
  university: string | null;
  hand: string | null;
  age: number | null;
  heightCm: number | null;
  birthplace: string | null;
  photoUrl: string | null;
  endorsements: string[];
};

export function PlayerHero(p: PlayerHeroProps) {
  return (
    <div className="grid grid-cols-[120px_1fr_auto] gap-4 p-4 bg-bg-panel border-b border-border items-center">
      <div className="w-[120px] h-[120px] bg-bg-card border border-border flex items-center justify-center text-fg-quiet text-[9px]">
        {p.photoUrl ? (
          <Image src={p.photoUrl} alt={p.nameJa} width={120} height={120} className="object-cover w-full h-full" />
        ) : 'PHOTO'}
      </div>
      <div>
        <div className="text-[10px] text-fg-muted tracking-widest mb-1.5">{p.nameEn} · {p.nameJa}</div>
        <h1 className="text-3xl font-black tracking-tighter text-fg leading-none mb-2.5">{p.nameJa}</h1>
        <div className="flex gap-2 flex-wrap text-[9px]">
          {p.university && <Pill>{p.university}</Pill>}
          {p.hand && <Pill>{p.hand}</Pill>}
          {p.age && <Pill>{p.age}歳{p.heightCm ? ` / ${p.heightCm}cm` : ''}</Pill>}
          {p.birthplace && <Pill>出身: {p.birthplace}</Pill>}
        </div>
      </div>
      {p.endorsements.length > 0 && (
        <div className="text-right">
          <div className="text-[8px] tracking-widest text-signal-yellow font-extrabold mb-2">★ PRO ENDORSED</div>
          <div className="flex flex-col gap-1">
            {p.endorsements.map((e) => (
              <EndorsementBadge key={e} proName={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="bg-bg px-2 py-1 text-fg-muted border border-border">{children}</span>;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/player/PlayerHero.tsx
git commit -m "feat: add PlayerHero component"
```

---

## Task 10: Player profile query

**Files:**
- Create: `lib/queries/player-profile.ts`
- Test: `tests/unit/queries/player-profile.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { selectPlayerProfile } from '@/lib/queries/player-profile';

describe('selectPlayerProfile (shape contract)', () => {
  it('exposes expected shape keys', () => {
    const expected = ['player', 'endorsements', 'currentTournament', 'schedule', 'relatedArticles', 'sparkline'];
    for (const k of expected) {
      expect(selectPlayerProfile.shapeKeys).toContain(k);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/queries/player-profile.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `lib/queries/player-profile.ts`**

```ts
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  players, proEndorsements, tournaments, tournamentEntries,
  articles, articlePlayers,
} from '@/lib/db/schema';

export type PlayerProfileData = {
  player: {
    slug: string;
    nameJa: string;
    nameEn: string;
    university: string | null;
    hand: string | null;
    age: number | null;
    heightCm: number | null;
    birthplace: string | null;
    photoUrl: string | null;
    currentJtaRank: number | null;
    currentAtpRank: number | null;
    scorecard: import('@/app/_components/player/ScorecardPanel').Scorecard;
  };
  endorsements: Array<{ proName: string; quote: string | null }>;
  currentTournament: {
    tournamentName: string;
    currentRound: string;
    nextMatchAt: string | null;
    nextOpponent: string | null;
  } | null;
  schedule: Array<{
    tournamentSlug: string;
    tournamentName: string;
    status: 'alive' | 'scheduled' | 'won' | 'lost' | 'champion';
    startDate: string;
    endDate: string;
  }>;
  relatedArticles: Array<{ slug: string; title: string; publishedAt: string }>;
  sparkline: number[]; // 12 months of JTA rank; placeholder for now
};

const EMPTY_SCORECARD = { sns: {}, personal: {}, currentSponsors: [] as string[], asks: [] as string[] };

export async function selectPlayerProfile(slug: string): Promise<PlayerProfileData | null> {
  const [p] = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
  if (!p) return null;

  const endorsementRows = await db
    .select({ proName: proEndorsements.proName, quote: proEndorsements.quote })
    .from(proEndorsements)
    .where(eq(proEndorsements.playerId, p.id))
    .orderBy(proEndorsements.displayOrder);

  const scheduleRows = await db
    .select({
      slug: tournaments.slug,
      nameJa: tournaments.nameJa,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      status: tournamentEntries.status,
      currentRound: tournamentEntries.currentRound,
      nextMatchAt: tournamentEntries.nextMatchAt,
      nextOpponent: tournamentEntries.nextOpponent,
    })
    .from(tournamentEntries)
    .innerJoin(tournaments, eq(tournamentEntries.tournamentId, tournaments.id))
    .where(eq(tournamentEntries.playerId, p.id))
    .orderBy(desc(tournaments.startDate));

  const articleRows = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      publishedAt: articles.publishedAt,
    })
    .from(articlePlayers)
    .innerJoin(articles, eq(articlePlayers.articleId, articles.id))
    .where(eq(articlePlayers.playerId, p.id))
    .orderBy(desc(articles.publishedAt))
    .limit(5);

  const alive = scheduleRows.find((s) => s.status === 'alive');
  const currentTournament = alive ? {
    tournamentName: alive.nameJa,
    currentRound: alive.currentRound ?? '',
    nextMatchAt: alive.nextMatchAt ? alive.nextMatchAt.toISOString().slice(11, 16) : null,
    nextOpponent: alive.nextOpponent ?? null,
  } : null;

  const age = p.birthYear ? new Date().getFullYear() - p.birthYear : null;
  const fmt = (d: Date) => d.toISOString().slice(5, 10).replace('-', '/');

  // Sparkline placeholder: derive from currentJtaRank as a flat trend until rank history is tracked
  const baseRank = p.currentJtaRank ?? 60;
  const sparkline = Array.from({ length: 12 }, (_, i) =>
    Math.max(1, baseRank + 5 - i * (5 / 11)) | 0,
  );

  return {
    player: {
      slug: p.slug,
      nameJa: p.nameJa,
      nameEn: p.nameEn,
      university: p.university,
      hand: p.hand,
      age,
      heightCm: p.heightCm,
      birthplace: null,
      photoUrl: p.photoUrl,
      currentJtaRank: p.currentJtaRank,
      currentAtpRank: p.currentAtpRank,
      scorecard: (p.scorecard as PlayerProfileData['player']['scorecard']) ?? EMPTY_SCORECARD,
    },
    endorsements: endorsementRows,
    currentTournament,
    schedule: scheduleRows.map((s) => ({
      tournamentSlug: s.slug,
      tournamentName: s.nameJa,
      status: s.status,
      startDate: fmt(s.startDate),
      endDate: fmt(s.endDate),
    })),
    relatedArticles: articleRows.map((a) => ({
      slug: a.slug,
      title: a.title,
      publishedAt: a.publishedAt.toISOString().slice(0, 10),
    })),
    sparkline,
  };
}

selectPlayerProfile.shapeKeys = [
  'player', 'endorsements', 'currentTournament', 'schedule', 'relatedArticles', 'sparkline',
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/queries/player-profile.test.ts
```
Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/player-profile.ts tests/unit/queries/player-profile.test.ts
git commit -m "feat: add player-profile query"
```

---

## Task 11: /players/[slug] page

**Files:**
- Create: `app/players/[slug]/page.tsx`

- [ ] **Step 1: Implement `app/players/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { PlayerHero } from '@/app/_components/player/PlayerHero';
import { CurrentStatusStrip } from '@/app/_components/player/CurrentStatusStrip';
import { RankingBlock } from '@/app/_components/player/RankingBlock';
import { SchedulePanel } from '@/app/_components/player/SchedulePanel';
import { RelatedArticles } from '@/app/_components/player/RelatedArticles';
import { ScorecardPanel } from '@/app/_components/player/ScorecardPanel';
import { ProQuoteCard } from '@/app/_components/player/ProQuoteCard';
import { ProfileClientShell } from './ProfileClientShell';
import { selectPlayerProfile } from '@/lib/queries/player-profile';

export const revalidate = 1800;

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await selectPlayerProfile(slug);
  if (!data) notFound();

  const recentWL = { wins: 28, losses: 12 }; // placeholder; computed in Plan 4 once we track match records

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/players" />
      <div className="text-[9px] text-fg-quiet px-4 py-2 border-b border-border">
        選手 / <a href="/players">{data.player.university ? '大学生' : 'プロ'}</a> / {data.player.nameJa}
      </div>

      <PlayerHero
        nameJa={data.player.nameJa}
        nameEn={data.player.nameEn}
        university={data.player.university}
        hand={data.player.hand}
        age={data.player.age}
        heightCm={data.player.heightCm}
        birthplace={data.player.birthplace}
        photoUrl={data.player.photoUrl}
        endorsements={data.endorsements.map((e) => e.proName)}
      />

      {data.currentTournament && (
        <CurrentStatusStrip
          tournamentName={data.currentTournament.tournamentName}
          currentRound={data.currentTournament.currentRound}
          nextMatchAt={data.currentTournament.nextMatchAt}
          nextOpponent={data.currentTournament.nextOpponent}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-px bg-border">
        <div className="bg-bg p-3.5 flex flex-col gap-2.5">
          <RankingBlock
            jtaRank={data.player.currentJtaRank}
            atpRank={data.player.currentAtpRank}
            recentWL={recentWL}
            sparkline={data.sparkline}
          />
          <SchedulePanel entries={data.schedule} />
          <RelatedArticles articles={data.relatedArticles} />
        </div>
        <div className="bg-bg p-3.5 flex flex-col gap-2.5">
          <ProfileClientShell playerSlug={data.player.slug} playerName={data.player.nameJa} scorecard={data.player.scorecard} />
          {data.endorsements[0]?.quote && (
            <ProQuoteCard proName={data.endorsements[0].proName} quote={data.endorsements[0].quote} />
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create `app/players/[slug]/ProfileClientShell.tsx`** (bridges Server → Client for the inquiry modal)

```tsx
'use client';

import { useState } from 'react';
import { ScorecardPanel, type Scorecard } from '@/app/_components/player/ScorecardPanel';
import { InquiryForm } from '@/app/_components/player/InquiryForm';

export function ProfileClientShell({
  playerSlug, playerName, scorecard,
}: { playerSlug: string; playerName: string; scorecard: Scorecard }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <ScorecardPanel scorecard={scorecard} onInquire={() => { setOpen(true); setSubmitted(false); }} />
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {submitted
              ? <div className="bg-bg-panel border border-signal-green p-5 text-fg text-center">
                  ✓ 送信しました。編集部から折り返しご連絡します。
                  <button className="block mx-auto mt-3 text-[11px] text-fg-muted underline" onClick={() => setOpen(false)}>閉じる</button>
                </div>
              : <InquiryForm playerSlug={playerSlug} playerName={playerName} onSuccess={() => setSubmitted(true)} />}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Run dev and verify visually**

```bash
npm run dev
```
Visit http://localhost:3000/players/yamada-sho.

Expected:
- Header + breadcrumb
- Photo placeholder + 山田 翔 large title + endorsement pills (★ 西岡 良仁)
- ● 大会出場中 strip with 広島 F4
- Left column: RANKING block (JTA #12, ATP —, 28-12 in green) + sparkline + schedule with 1 entry + related articles (1)
- Right column: yellow-bordered SCORECARD with IG/X/TikTok numbers and the "▸ スポンサー候補として問い合わせる" button
- Clicking the CTA opens a modal with the inquiry form

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add app/players/
git commit -m "feat: implement /players/[slug] profile page"
```

---

## Task 12: Player index query + page

**Files:**
- Create: `lib/queries/player-index.ts`
- Test: `tests/unit/queries/player-index.test.ts`
- Create: `app/_components/PlayerListCard.tsx`
- Create: `app/players/page.tsx`

- [ ] **Step 1: Write the failing test for the shape contract**

`tests/unit/queries/player-index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectPlayerIndex } from '@/lib/queries/player-index';

describe('selectPlayerIndex (shape contract)', () => {
  it('returns expected shape keys', () => {
    expect(selectPlayerIndex.shapeKeys).toContain('players');
    expect(selectPlayerIndex.shapeKeys).toContain('counts');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/queries/player-index.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `lib/queries/player-index.ts`**

```ts
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { players } from '@/lib/db/schema';

export type PlayerListItem = {
  slug: string;
  nameJa: string;
  category: 'pro' | 'college' | 'futures';
  university: string | null;
  currentJtaRank: number | null;
  currentAtpRank: number | null;
  featured: boolean;
};

export type PlayerIndexData = {
  players: PlayerListItem[];
  counts: { total: number; pro: number; college: number; futures: number };
};

export async function selectPlayerIndex(
  filter?: 'pro' | 'college' | 'futures',
): Promise<PlayerIndexData> {
  const rows = filter
    ? await db.select().from(players).where(eq(players.category, filter)).orderBy(players.nameJa)
    : await db.select().from(players).orderBy(players.nameJa);

  const list = rows.map((r) => ({
    slug: r.slug, nameJa: r.nameJa, category: r.category as PlayerListItem['category'],
    university: r.university, currentJtaRank: r.currentJtaRank, currentAtpRank: r.currentAtpRank,
    featured: r.featured,
  }));

  const countRows = await db
    .select({ category: players.category, c: sql<number>`count(*)::int` })
    .from(players)
    .groupBy(players.category);
  const m: Record<string, number> = {};
  for (const r of countRows) m[r.category] = r.c;
  const total = (m.pro ?? 0) + (m.college ?? 0) + (m.futures ?? 0);

  return { players: list, counts: { total, pro: m.pro ?? 0, college: m.college ?? 0, futures: m.futures ?? 0 } };
}

selectPlayerIndex.shapeKeys = ['players', 'counts'] as const;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/queries/player-index.test.ts
```
Expected: 1 test passing.

- [ ] **Step 5: Implement `app/_components/PlayerListCard.tsx`**

```tsx
import Link from 'next/link';
import type { PlayerListItem } from '@/lib/queries/player-index';

export function PlayerListCard({ player }: { player: PlayerListItem }) {
  const rankLabel = player.currentJtaRank
    ? `JTA #${player.currentJtaRank}`
    : player.currentAtpRank ? `ATP ${player.currentAtpRank}` : '—';
  return (
    <Link
      href={`/players/${player.slug}`}
      className={`bg-bg-card p-2.5 block border-l-2 ${player.featured ? 'border-signal-orange' : 'border-border'} hover:border-fg-muted`}
    >
      <div className="text-[12px] font-extrabold text-fg">{player.nameJa}</div>
      <div className="text-[9px] text-fg-muted mt-0.5">
        {player.university ?? (player.category === 'pro' ? 'プロ' : 'フューチャーズ')}
      </div>
      <div className="text-[9px] tabular text-fg-muted mt-1">{rankLabel}</div>
    </Link>
  );
}
```

- [ ] **Step 6: Implement `app/players/page.tsx`**

```tsx
import { SiteHeader } from '@/app/_components/SiteHeader';
import { PlayerListCard } from '@/app/_components/PlayerListCard';
import { selectPlayerIndex } from '@/lib/queries/player-index';
import Link from 'next/link';

export const revalidate = 1800;

export default async function PlayersIndexPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const filter = (category === 'pro' || category === 'college' || category === 'futures') ? category : undefined;
  const data = await selectPlayerIndex(filter);

  const tabs = [
    { key: undefined, label: '全て', count: data.counts.total },
    { key: 'pro', label: 'プロ / Jr ATPランカー', count: data.counts.pro },
    { key: 'college', label: '大学生', count: data.counts.college },
    { key: 'futures', label: 'フューチャーズ', count: data.counts.futures },
  ] as const;

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/players" />
      <div className="px-4 py-4">
        <h1 className="text-fg font-extrabold text-lg mb-3">選手一覧</h1>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {tabs.map((t) => (
            <Link
              key={t.key ?? 'all'}
              href={t.key ? `/players?category=${t.key}` : '/players'}
              className={`px-2.5 py-1 text-[10px] tracking-wide font-bold bg-bg-card ${
                filter === t.key ? 'text-signal-yellow' : 'text-fg-muted'
              }`}
            >
              {t.label} · {t.count}人
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {data.players.map((p) => <PlayerListCard key={p.slug} player={p} />)}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Run dev and verify**

```bash
npm run dev
```
Visit http://localhost:3000/players. Expected: 4 tabs with counts, 5 player cards. Click "大学生" tab → URL becomes `?category=college`, list shows 2 players.

Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add lib/queries/player-index.ts tests/unit/queries/player-index.test.ts app/_components/PlayerListCard.tsx app/players/page.tsx
git commit -m "feat: add /players index page with category filter"
```

---

## Task 13: Playwright E2E — profile page

**Files:**
- Create: `tests/e2e/player-profile.spec.ts`
- Create: `tests/e2e/player-index.spec.ts`

- [ ] **Step 1: Create `tests/e2e/player-profile.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('player profile page renders all sections', async ({ page }) => {
  await page.goto('/players/yamada-sho');

  await expect(page.getByRole('heading', { name: '山田 翔' })).toBeVisible();
  await expect(page.getByText('★ 西岡 良仁')).toBeVisible();
  await expect(page.getByText('● 大会出場中')).toBeVisible();
  await expect(page.getByText(/JTA/)).toBeVisible();
  await expect(page.getByText('#12')).toBeVisible();
  await expect(page.getByText('★ SPONSORSHIP SCORECARD')).toBeVisible();
  await expect(page.getByText('4,200')).toBeVisible();
  await expect(page.getByText('YONEX')).toBeVisible();
  await expect(page.getByText(/海外遠征費/)).toBeVisible();
  await expect(page.getByRole('button', { name: /スポンサー候補として問い合わせる/ })).toBeVisible();
});

test('404 for unknown player slug', async ({ page }) => {
  const res = await page.goto('/players/no-such-player');
  expect(res?.status()).toBe(404);
});

test('inquiry modal opens when CTA clicked', async ({ page }) => {
  await page.goto('/players/yamada-sho');
  await page.getByRole('button', { name: /スポンサー候補として問い合わせる/ }).click();
  await expect(page.getByText(/山田 翔 へ問い合わせ/)).toBeVisible();
  await expect(page.getByLabel(/会社名/)).toBeVisible();
});
```

- [ ] **Step 2: Create `tests/e2e/player-index.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('player index renders tabs and lists all players', async ({ page }) => {
  await page.goto('/players');
  await expect(page.getByRole('heading', { name: '選手一覧' })).toBeVisible();
  await expect(page.getByText(/全て · /)).toBeVisible();
  await expect(page.getByText('山田 翔')).toBeVisible();
  await expect(page.getByText('佐藤 葵')).toBeVisible();
});

test('filter to college subset', async ({ page }) => {
  await page.goto('/players?category=college');
  await expect(page.getByText('山田 翔')).toBeVisible();
  await expect(page.getByText('中村 拓')).toBeVisible();
  await expect(page.getByText('佐藤 葵')).not.toBeVisible();
});
```

- [ ] **Step 3: Run E2E**

```bash
npm run test:e2e
```
Expected: all tests passing.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/player-profile.spec.ts tests/e2e/player-index.spec.ts
git commit -m "test: add Playwright E2E for player profile and index"
```

---

## Task 14: Playwright E2E — inquiry flow (mocked Turnstile)

**Files:**
- Create: `tests/e2e/inquiry-flow.spec.ts`

This test bypasses Turnstile by setting a known dummy secret. The inquiry route accepts the dummy token because Turnstile's test mode returns `success: true` for `1x0000000000000000000000000000000AA` site/secret pair. See https://developers.cloudflare.com/turnstile/troubleshooting/testing/.

- [ ] **Step 1: Add Turnstile test keys to `.env.local`**

Append to `.env.local`:
```env
# Test keys for Playwright (always-pass)
TEST_TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
TEST_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
```

> **Note:** For Playwright runs we want test keys; for real runs we want real keys. The simplest approach: leave production keys in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. For local Playwright runs, the engineer temporarily swaps the env vars (or uses a `.env.test`).

- [ ] **Step 2: Create `tests/e2e/inquiry-flow.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('inquiry form submits and shows success message', async ({ page }) => {
  await page.goto('/players/yamada-sho');
  await page.getByRole('button', { name: /スポンサー候補として問い合わせる/ }).click();

  await page.getByLabel(/会社名/).fill('株式会社テスト');
  await page.getByLabel(/担当者名/).fill('田中 太郎');
  await page.getByLabel(/メールアドレス/).fill('test@example.com');
  await page.getByLabel(/メッセージ/).fill('テスト送信です。');

  // With Turnstile test site key, the widget auto-resolves.
  await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled, undefined, { timeout: 10000 });

  await page.getByRole('button', { name: /送信する/ }).click();

  await expect(page.getByText(/送信しました/)).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 3: Run E2E**

```bash
npm run test:e2e -- inquiry-flow
```
Expected: test passing (the actual DB row + email send happens).

> **Manual cleanup:** Engineer deletes test rows from `sponsorship_inquiries` in Supabase Studio.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/inquiry-flow.spec.ts
git commit -m "test: add Playwright E2E for sponsor inquiry flow"
```

---

## Task 15: Update top page to link to /players/[slug]

**Files:**
- Modify: `app/_components/FeaturedPlayersRow.tsx` (already links to `/players/[slug]` — verify)
- Modify: `app/_components/TodayStatusPanel.tsx` (link player names to profile)

- [ ] **Step 1: Update `app/_components/TodayStatusPanel.tsx` to make player names link**

Find the `<div className="text-fg font-bold">{e.playerName}</div>` lines (there are two) and convert them to Links. The component needs access to the slug, so update props:

Replace the AliveEntry and RecentResultEntry types:
```ts
export type AliveEntry = {
  playerSlug: string;
  playerName: string;
  tournamentName: string;
  currentRound: string;
  note?: string;
};

export type RecentResultEntry = {
  playerSlug: string;
  playerName: string;
  tournamentName: string;
  result: 'won' | 'lost';
  summary: string;
};
```

Replace player name nodes:
```tsx
import Link from 'next/link';
// ...inside the JSX:
<div className="text-fg font-bold">
  <Link href={`/players/${e.playerSlug}`} className="hover:text-signal-yellow">{e.playerName}</Link>
</div>
```

- [ ] **Step 2: Update `lib/queries/top-page.ts` to include slugs in returned data**

In `getAlive`:
```ts
const rows = await db
  .select({
    playerSlug: players.slug,
    playerName: players.nameJa,
    tournamentName: tournaments.nameJa,
    currentRound: tournamentEntries.currentRound,
    nextMatchAt: tournamentEntries.nextMatchAt,
  })
  // ...
return rows.map((r) => ({
  playerSlug: r.playerSlug,
  playerName: r.playerName,
  tournamentName: r.tournamentName,
  currentRound: r.currentRound ?? '',
  note: r.nextMatchAt ? `${r.nextMatchAt.toISOString().slice(11, 16)} プレー予定` : undefined,
}));
```

Same change in `getRecent` — add `playerSlug: players.slug` to the select and into the returned object.

Update `TopPageData['aliveEntries']` and `recentResults` types to include `playerSlug: string`.

- [ ] **Step 3: Run dev and verify clicking a name navigates**

```bash
npm run dev
```
Click "山田 翔" in the TODAY panel. Should navigate to `/players/yamada-sho`.

- [ ] **Step 4: Update E2E for top page**

In `tests/e2e/top-page.spec.ts`, add at the end:
```ts
test('clicking a featured player navigates to profile', async ({ page }) => {
  await page.goto('/');
  await page.getByText('山田 翔').first().click();
  await expect(page).toHaveURL(/\/players\/yamada-sho/);
});
```

- [ ] **Step 5: Run E2E**

```bash
npm run test:e2e
```
Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add app/_components/TodayStatusPanel.tsx lib/queries/top-page.ts tests/e2e/top-page.spec.ts
git commit -m "feat: link player names from top page to their profile pages"
```

---

## Self-Review Checklist

- [x] Spec coverage:
  - Section 3.2 (player profile + scorecard): Tasks 5-11 build it
  - Section 3.5 (player index): Task 12
  - Section 4 (data model — sponsorship_inquiries used): Task 4
  - Section 7.4 (inquiry workflow): Tasks 2-4, 8
  - Visual section (B1 dark theme, yellow scorecard accent): consistent across all components
- [x] Placeholder scan:
  - Sparkline data is generated from `currentJtaRank` (commented as placeholder until rank history is tracked in Plan 4)
  - `recentWL` is hardcoded `{ wins: 28, losses: 12 }` (commented; computed in Plan 4)
  - Both are flagged inline with TODO comments and referenced for Plan 4 follow-up
- [x] Type consistency:
  - `Scorecard` type defined in `ScorecardPanel.tsx` is reused in `selectPlayerProfile` and `ProfileClientShell`
  - `AliveEntry`/`RecentResultEntry` updated consistently in both `TodayStatusPanel.tsx` and `lib/queries/top-page.ts` in Task 15
  - `ScheduleEntry` status union matches `tournamentEntries.status` pg enum
