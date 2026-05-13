import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { selectJpRankings, selectRankingsUpdatedAt } from "@/lib/queries/jp-rankings";

export const revalidate = 1800;

const CATEGORY_BADGE: Record<string, string> = {
  pro: "PRO",
  college: "大学",
  futures: "FUT",
};

const CATEGORY_COLOR: Record<string, string> = {
  pro: "text-signal-yellow",
  college: "text-signal-orange",
  futures: "text-signal-green",
};

type Tour = "atp" | "wta";

export default async function RankingsPage({
  searchParams,
}: { searchParams: Promise<{ tour?: string }> }) {
  const { tour: tourParam } = await searchParams;
  const tour: Tour = tourParam === "wta" ? "wta" : "atp";

  const [rankings, updatedAt] = await Promise.all([
    selectJpRankings(tour),
    selectRankingsUpdatedAt(tour),
  ]);

  const tourLabel = tour === "wta" ? "WTA" : "ATP";
  const sourceRepo = tour === "wta" ? "tennis_wta" : "tennis_atp";
  const sourceUrl = `https://github.com/JeffSackmann/${sourceRepo}`;

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/rankings" />

      {/* Header */}
      <div className="bg-bg-panel border-b border-line px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-1">
            {tourLabel} RANKINGS · JAPANESE PLAYERS
          </div>
          <h1 className="text-2xl font-black text-fg tracking-tighter">
            日本人選手 {tourLabel}ランキング
          </h1>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-fg-muted">
            <span>{rankings.length}名</span>
            <span>·</span>
            <span>
              更新:{" "}
              <span className="text-fg">
                {updatedAt ?? "—"} (毎週月曜更新)
              </span>
            </span>
            <span>·</span>
            <span>Source: Jeff Sackmann {sourceRepo}</span>
          </div>
        </div>
      </div>

      {/* ATP / WTA tabs */}
      <div className="bg-bg-panel border-b border-line px-4">
        <div className="max-w-4xl mx-auto flex gap-0">
          <Link
            href="/rankings?tour=atp"
            className={`px-4 py-2.5 text-[11px] font-extrabold tracking-widest border-b-2 transition-colors ${
              tour === "atp"
                ? "border-signal-yellow text-signal-yellow"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            ATP 男子
          </Link>
          <Link
            href="/rankings?tour=wta"
            className={`px-4 py-2.5 text-[11px] font-extrabold tracking-widest border-b-2 transition-colors ${
              tour === "wta"
                ? "border-signal-yellow text-signal-yellow"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            WTA 女子
          </Link>
        </div>
      </div>

      {/* Rankings table */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line text-[9px] tracking-widest text-fg-muted font-extrabold text-left">
              <th className="py-2 pr-4 w-16">RANK</th>
              <th className="py-2 pr-4">PLAYER</th>
              <th className="py-2 pr-4 w-24 text-right hidden md:table-cell">カテゴリ</th>
              <th className="py-2 text-right w-20 hidden md:table-cell">所属</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((p, i) => {
              const prevRank = i > 0 ? rankings[i - 1].atpRank : null;
              const showDivider =
                prevRank !== null && (
                  (p.atpRank > 100 && prevRank <= 100) ||
                  (p.atpRank > 200 && prevRank <= 200) ||
                  (p.atpRank > 300 && prevRank <= 300) ||
                  (p.atpRank > 500 && prevRank <= 500)
                );

              return (
                <>
                  {showDivider && (
                    <tr key={`div-${p.slug}`}>
                      <td colSpan={4} className="border-t border-line opacity-30 py-0" />
                    </tr>
                  )}
                  <tr
                    key={p.slug}
                    className="border-b border-line hover:bg-bg-panel transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <span className="tabular text-[16px] font-black text-fg">
                        {p.atpRank}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/players/${p.slug}`}
                        className="group flex items-center gap-2"
                      >
                        <span
                          className={`text-[11px] font-bold ${
                            p.nameJaVerified
                              ? "text-fg group-hover:text-signal-yellow"
                              : "text-fg-muted group-hover:text-fg"
                          }`}
                        >
                          {p.nameJa}
                        </span>
                        {!p.nameJaVerified && (
                          <span className="text-[8px] text-fg-quiet tracking-wide">
                            {p.nameEn}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-right hidden md:table-cell">
                      <span
                        className={`text-[9px] font-extrabold tracking-widest ${
                          CATEGORY_COLOR[p.category] ?? "text-fg-muted"
                        }`}
                      >
                        {CATEGORY_BADGE[p.category] ?? p.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right hidden md:table-cell">
                      <span className="text-[10px] text-fg-muted">
                        {p.university ?? "—"}
                      </span>
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 text-[10px] text-fg-quiet text-center">
          Match data &amp; rankings via{" "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener"
            className="underline hover:text-signal-yellow"
          >
            {sourceRepo} by Jeff Sackmann
          </a>{" "}
          (CC BY-NC-SA 4.0) · 毎週月曜自動更新
        </div>
      </div>
    </main>
  );
}
