import {
  pgTable, serial, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, primaryKey, uniqueIndex,
} from "drizzle-orm/pg-core";

export const playerCategory = pgEnum("player_category", ["pro", "college", "futures"]);
export const tournamentLevel = pgEnum("tournament_level", [
  "atp", "challenger", "futures_25", "futures_15", "jta", "college",
]);
export const entryStatus = pgEnum("entry_status", [
  "scheduled", "alive", "won", "lost", "champion",
]);
export const articleCategory = pgEnum("article_category", [
  "interview", "profile", "tournament", "column",
]);
export const inquiryStatus = pgEnum("inquiry_status", ["new", "forwarded", "closed"]);
export const rankProvider = pgEnum("rank_provider", ["jta", "atp"]);
export const matchResult = pgEnum("match_result", ["won", "lost"]);

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nameJa: varchar("name_ja", { length: 64 }).notNull(),
  nameEn: varchar("name_en", { length: 64 }).notNull(),
  birthYear: integer("birth_year"),
  hand: varchar("hand", { length: 32 }),
  heightCm: integer("height_cm"),
  category: playerCategory("category").notNull(),
  university: varchar("university", { length: 64 }),
  club: varchar("club", { length: 64 }),
  currentJtaRank: integer("current_jta_rank"),
  currentAtpRank: integer("current_atp_rank"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  sns: jsonb("sns"),
  featured: boolean("featured").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  scorecard: jsonb("scorecard"),
  itfId: varchar("itf_id", { length: 32 }),
  itfSlug: varchar("itf_slug", { length: 96 }),
  lastScrapedAt: timestamp("last_scraped_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const proEndorsements = pgTable("pro_endorsements", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  proName: varchar("pro_name", { length: 64 }).notNull(),
  proStatus: varchar("pro_status", { length: 16 }).notNull().default("active"),
  quote: text("quote"),
  endorsedAt: timestamp("endorsed_at").defaultNow().notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  nameJa: varchar("name_ja", { length: 96 }).notNull(),
  nameEn: varchar("name_en", { length: 96 }).notNull(),
  level: tournamentLevel("level").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: varchar("location", { length: 96 }),
  surface: varchar("surface", { length: 32 }),
  externalUrl: text("external_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tournamentEntries = pgTable(
  "tournament_entries",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    status: entryStatus("status").notNull(),
    currentRound: varchar("current_round", { length: 16 }),
    lastMatchSummary: text("last_match_summary"),
    nextMatchAt: timestamp("next_match_at"),
    nextOpponent: varchar("next_opponent", { length: 64 }),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("player_tournament_unique").on(t.playerId, t.tournamentId)],
);

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  category: articleCategory("category").notNull(),
  heroImageUrl: text("hero_image_url"),
  authors: text("authors"),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const articlePlayers = pgTable(
  "article_players",
  {
    articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.playerId] })],
);

export const articleTournaments = pgTable(
  "article_tournaments",
  {
    articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.tournamentId] })],
);

export const sponsorshipInquiries = pgTable("sponsorship_inquiries", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 128 }).notNull(),
  contactName: varchar("contact_name", { length: 64 }).notNull(),
  contactEmail: varchar("contact_email", { length: 128 }).notNull(),
  message: text("message").notNull(),
  status: inquiryStatus("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  handledAt: timestamp("handled_at"),
});

export const playerRankSnapshots = pgTable("player_rank_snapshots", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  provider: rankProvider("provider").notNull(),
  rank: integer("rank").notNull(),
  snapshotAt: timestamp("snapshot_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matchRecords = pgTable("match_records", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  tournamentId: integer("tournament_id").references(() => tournaments.id, { onDelete: "set null" }),
  opponent: varchar("opponent", { length: 96 }),
  round: varchar("round", { length: 16 }),
  result: matchResult("result").notNull(),
  scoreSummary: varchar("score_summary", { length: 64 }),
  playedAt: timestamp("played_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
