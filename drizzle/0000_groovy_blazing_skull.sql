CREATE TYPE "public"."article_category" AS ENUM('interview', 'profile', 'tournament', 'column');--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('scheduled', 'alive', 'won', 'lost', 'champion');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'forwarded', 'closed');--> statement-breakpoint
CREATE TYPE "public"."match_result" AS ENUM('won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."player_category" AS ENUM('pro', 'college', 'futures');--> statement-breakpoint
CREATE TYPE "public"."rank_provider" AS ENUM('jta', 'atp');--> statement-breakpoint
CREATE TYPE "public"."tournament_level" AS ENUM('atp', 'challenger', 'futures_25', 'futures_15', 'jta', 'college');--> statement-breakpoint
CREATE TABLE "article_players" (
	"article_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	CONSTRAINT "article_players_article_id_player_id_pk" PRIMARY KEY("article_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "article_tournaments" (
	"article_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "article_tournaments_article_id_tournament_id_pk" PRIMARY KEY("article_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(96) NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"category" "article_category" NOT NULL,
	"hero_image_url" text,
	"authors" text,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "match_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"tournament_id" integer,
	"opponent" varchar(96),
	"round" varchar(16),
	"result" "match_result" NOT NULL,
	"score_summary" varchar(64),
	"played_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_rank_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"provider" "rank_provider" NOT NULL,
	"rank" integer NOT NULL,
	"snapshot_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name_ja" varchar(64) NOT NULL,
	"name_en" varchar(64) NOT NULL,
	"birth_year" integer,
	"hand" varchar(32),
	"height_cm" integer,
	"category" "player_category" NOT NULL,
	"university" varchar(64),
	"club" varchar(64),
	"current_jta_rank" integer,
	"current_atp_rank" integer,
	"bio" text,
	"photo_url" text,
	"sns" jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"scorecard" jsonb,
	"itf_id" varchar(32),
	"itf_slug" varchar(96),
	"last_scraped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pro_endorsements" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"pro_name" varchar(64) NOT NULL,
	"pro_status" varchar(16) DEFAULT 'active' NOT NULL,
	"quote" text,
	"endorsed_at" timestamp DEFAULT now() NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsorship_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"company_name" varchar(128) NOT NULL,
	"contact_name" varchar(64) NOT NULL,
	"contact_email" varchar(128) NOT NULL,
	"message" text NOT NULL,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"handled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tournament_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"status" "entry_status" NOT NULL,
	"current_round" varchar(16),
	"last_match_summary" text,
	"next_match_at" timestamp,
	"next_opponent" varchar(64),
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(96) NOT NULL,
	"name_ja" varchar(96) NOT NULL,
	"name_en" varchar(96) NOT NULL,
	"level" "tournament_level" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"location" varchar(96),
	"surface" varchar(32),
	"external_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "article_players" ADD CONSTRAINT "article_players_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_players" ADD CONSTRAINT "article_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_tournaments" ADD CONSTRAINT "article_tournaments_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_tournaments" ADD CONSTRAINT "article_tournaments_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_records" ADD CONSTRAINT "match_records_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_records" ADD CONSTRAINT "match_records_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_rank_snapshots" ADD CONSTRAINT "player_rank_snapshots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_endorsements" ADD CONSTRAINT "pro_endorsements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_inquiries" ADD CONSTRAINT "sponsorship_inquiries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "player_tournament_unique" ON "tournament_entries" USING btree ("player_id","tournament_id");