CREATE UNIQUE INDEX "players_atp_player_id_unique" ON "players" ("atp_player_id") WHERE "atp_player_id" IS NOT NULL;
