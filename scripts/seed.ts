/**
 * Seed sample data. Idempotent: truncates main tables before inserting.
 * Run: npm run db:seed
 */

import "@/lib/load-env";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  players, proEndorsements, tournaments, tournamentEntries,
  articles, articlePlayers, playerRankSnapshots, matchRecords,
} from "@/lib/db/schema";

function monthsAgo(n: number, day = 1): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  d.setUTCDate(day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("seeding…");

  await db.execute(sql`TRUNCATE TABLE
    match_records, player_rank_snapshots, sponsorship_inquiries,
    article_tournaments, article_players, articles,
    tournament_entries, tournaments, pro_endorsements, players
    RESTART IDENTITY CASCADE`);

  const insertedPlayers = await db.insert(players).values([
    {
      slug: "yamada-sho", nameJa: "山田 翔", nameEn: "Yamada Sho", birthYear: 2004,
      hand: "右利き / 両手BH", heightCm: 178, category: "college", university: "慶應義塾大学",
      currentJtaRank: 12, currentAtpRank: null, featured: true, displayOrder: 1,
      sns: { ig: 4200, ig_er: 6.8, x: 1850, x_er: 3.2, tiktok: 980 },
      scorecard: {
        sns: { ig: 4200, ig_er: 6.8, x: 1850, x_er: 3.2, tiktok: 980 },
        personal: {
          languages: ["英語(中級)"],
          interests: ["ファッション", "音楽(HIPHOP)", "ゲーム"],
          posting_style: "試合前後のVlog投稿 · 週2回",
        },
        currentSponsors: ["YONEX(ラケット)", "○○薬局(ローカル)"],
        asks: ["海外遠征費の支援(ATPポイント獲得のため)", "ストリングス契約", "ウェア提供"],
      },
    },
    {
      slug: "sato-aoi", nameJa: "佐藤 葵", nameEn: "Sato Aoi", birthYear: 2003,
      category: "futures", currentAtpRank: 812, featured: true, displayOrder: 2,
      sns: { ig: 1800 },
      scorecard: { sns: { ig: 1800 }, personal: {}, currentSponsors: [], asks: ["ウェア提供"] },
    },
    {
      slug: "nakamura-taku", nameJa: "中村 拓", nameEn: "Nakamura Taku", birthYear: 2002,
      category: "college", university: "早稲田大学", currentJtaRank: 28,
      featured: true, displayOrder: 3, sns: { ig: 2100 },
      scorecard: { sns: { ig: 2100 }, personal: {}, currentSponsors: [], asks: [] },
    },
    {
      slug: "nishioka-yoshihito", nameJa: "西岡 良仁", nameEn: "Yoshihito Nishioka",
      birthYear: 1995, hand: "左利き", heightCm: 170, category: "pro",
      atpPlayerId: 106415, currentAtpRank: 175,
    },
    {
      slug: "daniel-taro", nameJa: "ダニエル 太郎", nameEn: "Taro Daniel",
      birthYear: 1993, hand: "右利き", heightCm: 191, category: "pro",
      atpPlayerId: 106121, currentAtpRank: 335,
    },
    {
      slug: "nishikori-kei", nameJa: "錦織 圭", nameEn: "Kei Nishikori",
      birthYear: 1989, hand: "右利き", heightCm: 178, category: "pro",
      atpPlayerId: 105453,
    },
    {
      slug: "sugita-yuichi", nameJa: "杉田 祐一", nameEn: "Yuichi Sugita",
      birthYear: 1988, hand: "右利き", heightCm: 173, category: "pro",
      atpPlayerId: 105216,
    },
  ]).returning();

  const [yamada, sato, nakamura, nishioka, daniel, nishikori, sugita] = insertedPlayers;

  await db.insert(proEndorsements).values([
    { playerId: yamada.id, proName: "西岡 良仁", proStatus: "active", displayOrder: 1,
      quote: "フォアの威力は同世代でトップクラス。あとは経験。海外で戦えば化ける。" },
    { playerId: sato.id, proName: "添田 豪", proStatus: "retired", displayOrder: 1 },
    { playerId: nakamura.id, proName: "杉田 祐一", proStatus: "active", displayOrder: 1 },
  ]);

  void nishikori; void sugita; // referenced below if needed

  const insertedTournaments = await db.insert(tournaments).values([
    {
      slug: "roanne-challenger-2026",
      nameJa: "Roanne Challenger", nameEn: "Roanne Challenger",
      level: "challenger", location: "France",
      startDate: new Date("2026-05-08"), endDate: new Date("2026-05-14"),
    },
    {
      slug: "yokkaichi-f1-2026",
      nameJa: "四日市 F1", nameEn: "Yokkaichi F1",
      level: "futures_25", location: "三重",
      startDate: new Date("2026-05-10"), endDate: new Date("2026-05-16"),
    },
    {
      slug: "hiroshima-f4-2026",
      nameJa: "広島 F4", nameEn: "Hiroshima F4",
      level: "futures_15", location: "広島",
      startDate: new Date("2026-05-10"), endDate: new Date("2026-05-15"),
    },
  ]).returning();

  const [roanne, yokkaichi, hiroshima] = insertedTournaments;

  await db.insert(tournamentEntries).values([
    { playerId: daniel.id, tournamentId: roanne.id, status: "alive", currentRound: "QF",
      lastMatchSummary: "2回戦突破", nextMatchAt: new Date("2026-05-13T14:00:00+09:00") },
    { playerId: sato.id, tournamentId: yokkaichi.id, status: "alive", currentRound: "R16",
      lastMatchSummary: "1回戦突破" },
    { playerId: yamada.id, tournamentId: hiroshima.id, status: "alive", currentRound: "R32",
      nextMatchAt: new Date("2026-05-12T14:00:00+09:00"), nextOpponent: "田中 誠" },
    { playerId: nishioka.id, tournamentId: roanne.id, status: "won",
      currentRound: "QF", lastMatchSummary: "1回戦突破 → QFへ",
      lastUpdatedAt: new Date(Date.now() - 8 * 3600 * 1000) },
  ]);

  const [article] = await db.insert(articles).values([
    {
      slug: "nishioka-yamada-talk",
      title: "「俺もここで泣いた」西岡が、F級で戦う後輩へ。",
      excerpt: "西岡良仁 × 山田翔 / 6,200字 — F級時代に味わった挫折と、いま挑む後輩への言葉。",
      body: "# placeholder\n本文はMDXファイルから同期されます。",
      category: "interview",
      authors: "編集部",
      publishedAt: new Date("2026-05-12"),
    },
  ]).returning();

  await db.insert(articlePlayers).values([
    { articleId: article.id, playerId: yamada.id },
    { articleId: article.id, playerId: nishioka.id },
  ]);

  // 12 monthly rank snapshots for Yamada (rank trending from 50 → 12)
  const yamadaTrend = [50, 45, 40, 38, 30, 28, 25, 22, 18, 15, 13, 12];
  await db.insert(playerRankSnapshots).values(
    yamadaTrend.map((rank, i) => ({
      playerId: yamada.id,
      provider: "jta" as const,
      rank,
      snapshotAt: monthsAgo(11 - i, 1),
    })),
  );

  // Yamada's recent matches — aim for 28-12 W-L over 6 months
  const yamadaMatches: Array<{ result: "won" | "lost"; daysAgo: number; opponent: string; round: string; score: string }> = [
    { result: "won", daysAgo: 5, opponent: "田中 誠", round: "R32", score: "6-4 6-2" },
    { result: "won", daysAgo: 12, opponent: "山口 健", round: "R64", score: "7-5 6-3" },
    { result: "lost", daysAgo: 25, opponent: "佐々木 翔", round: "QF", score: "4-6 5-7" },
    { result: "won", daysAgo: 40, opponent: "林 大輔", round: "R16", score: "6-2 6-4" },
    { result: "won", daysAgo: 55, opponent: "森田 涼", round: "R32", score: "6-3 6-1" },
    { result: "won", daysAgo: 70, opponent: "大野 颯", round: "R64", score: "7-6 6-4" },
  ];
  const padCount = 28 + 12 - yamadaMatches.length;
  for (let i = 0; i < padCount; i++) {
    const dayOffset = 80 + i * 4;
    const isWin = i % 3 !== 0;
    yamadaMatches.push({
      result: isWin ? "won" : "lost",
      daysAgo: dayOffset,
      opponent: `対戦相手 ${i + 1}`,
      round: "R32",
      score: isWin ? "6-3 6-4" : "4-6 3-6",
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

  console.log("seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
