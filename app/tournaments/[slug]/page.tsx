import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { TournamentBadge } from "@/app/_components/tournament/TournamentBadge";
import { TournamentEntriesTable } from "@/app/_components/tournament/TournamentEntriesTable";
import { selectTournamentDetail } from "@/lib/queries/tournament-detail";

export const revalidate = 1800;

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  active: { text: "開催中", color: "text-signal-red" },
  upcoming: { text: "開催予定", color: "text-fg-muted" },
  past: { text: "終了", color: "text-fg-quiet" },
};

export default async function TournamentDetailPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await selectTournamentDetail(slug);
  if (!t) notFound();
  const status = STATUS_LABEL[t.status];

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/tournaments" />
      <header className="bg-bg-panel border-b border-line px-4 py-6">
        <div className="flex gap-2 items-center mb-2">
          <TournamentBadge level={t.level} />
          <span className={`text-[10px] font-extrabold ${status.color}`}>● {status.text}</span>
        </div>
        <h1 className="text-2xl font-black text-fg tracking-tighter">{t.nameJa}</h1>
        <div className="text-fg-muted text-[11px] mt-1">
          {t.nameEn} · {t.location ?? "—"} · {t.surface ?? "—"} · {t.startDate}-{t.endDate}
        </div>
        {t.externalUrl && (
          <a
            href={t.externalUrl}
            target="_blank"
            rel="noopener"
            className="text-signal-yellow text-[10px] mt-2 inline-block underline"
          >
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
