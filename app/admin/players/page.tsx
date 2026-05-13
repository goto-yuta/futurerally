import { db } from "@/lib/db/client";
import { players } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function toggleFeatured(fd: FormData) {
  "use server";
  const id = Number(fd.get("id"));
  const next = fd.get("featured") === "true";
  await db.update(players).set({ featured: next, displayOrder: next ? 99 : 0 }).where(eq(players.id, id));
  revalidatePath("/admin/players");
}

async function updateOrder(fd: FormData) {
  "use server";
  const id = Number(fd.get("id"));
  const order = Number(fd.get("order"));
  await db.update(players).set({ displayOrder: order }).where(eq(players.id, id));
  revalidatePath("/admin/players");
}

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>;
}) {
  const sp = await searchParams;
  const tour = sp.tour === "wta" ? "wta" : "atp";

  const rows = await db.select({
    id: players.id,
    slug: players.slug,
    nameJa: players.nameJa,
    nameEn: players.nameEn,
    tour: players.tour,
    currentAtpRank: players.currentAtpRank,
    featured: players.featured,
    displayOrder: players.displayOrder,
    nameJaVerified: players.nameJaVerified,
    category: players.category,
  })
    .from(players)
    .where(eq(players.tour, tour))
    .orderBy(asc(players.currentAtpRank));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-fg font-bold text-lg">選手</h1>
        <div className="flex gap-1">
          {(["atp", "wta"] as const).map((t) => (
            <a
              key={t}
              href={`?tour=${t}`}
              className={`text-[11px] font-bold px-3 py-1 rounded-sm transition-colors ${
                tour === t
                  ? "bg-signal-yellow text-bg"
                  : "bg-bg-panel border border-line text-fg-muted hover:text-fg"
              }`}
            >
              {t.toUpperCase()}
            </a>
          ))}
        </div>
        <span className="text-fg-quiet text-[11px] ml-auto">{rows.length}名</span>
      </div>

      <div className="bg-bg-panel border border-line rounded-sm overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-fg-quiet text-[10px] uppercase tracking-wider">
              <th className="text-left px-3 py-2 w-12">Rank</th>
              <th className="text-left px-3 py-2">選手名</th>
              <th className="text-left px-3 py-2 hidden sm:table-cell">Slug</th>
              <th className="text-center px-3 py-2 w-20">漢字確認</th>
              <th className="text-center px-3 py-2 w-24">Featured</th>
              <th className="text-center px-3 py-2 w-20">順序</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className={`border-b border-line hover:bg-bg-card ${i % 2 === 0 ? "" : "bg-bg/30"}`}>
                <td className="px-3 py-2 text-fg-muted tabular-nums">
                  {p.currentAtpRank ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="text-fg font-medium">{p.nameJa}</div>
                  <div className="text-fg-quiet text-[10px]">{p.nameEn}</div>
                </td>
                <td className="px-3 py-2 text-fg-quiet hidden sm:table-cell font-mono text-[11px]">
                  {p.slug}
                </td>
                <td className="px-3 py-2 text-center">
                  {p.nameJaVerified ? (
                    <span className="text-signal-green text-[11px]">✓</span>
                  ) : (
                    <span className="text-fg-quiet text-[11px]">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <form action={toggleFeatured}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="featured" value={String(!p.featured)} />
                    <button
                      type="submit"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-sm transition-colors ${
                        p.featured
                          ? "bg-signal-yellow/20 text-signal-yellow hover:bg-signal-yellow/30"
                          : "bg-bg border border-line text-fg-quiet hover:text-fg"
                      }`}
                    >
                      {p.featured ? "★ ON" : "OFF"}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2 text-center">
                  {p.featured ? (
                    <form action={updateOrder} className="flex items-center justify-center gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="number"
                        name="order"
                        defaultValue={p.displayOrder}
                        min={1}
                        max={99}
                        className="w-12 bg-bg border border-line text-fg text-center text-[11px] py-0.5 rounded-sm"
                      />
                      <button type="submit" className="text-[10px] text-fg-quiet hover:text-fg">✓</button>
                    </form>
                  ) : (
                    <span className="text-fg-quiet">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
