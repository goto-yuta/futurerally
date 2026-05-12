import { z } from "zod";

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), {
  message: "invalid date",
});

const looseDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  isoDate,
);

export const articleFrontmatterSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.enum(["interview", "profile", "tournament", "column"]),
  authors: z.string().min(1),
  publishedAt: looseDate,
  heroImage: z.string().url().optional(),
  taggedPlayers: z.array(z.string()).default([]),
  taggedPros: z.array(z.string()).default([]),
  taggedTournaments: z.array(z.string()).default([]),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
