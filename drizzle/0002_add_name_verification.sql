ALTER TABLE "players" ADD COLUMN "wikidata_id" varchar(16);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "name_ja_verified" boolean DEFAULT false NOT NULL;