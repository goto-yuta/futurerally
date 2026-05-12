import { SiteHeader } from "@/app/_components/SiteHeader";
import { TournamentListCard } from "@/app/_components/tournament/TournamentListCard";
import { selectTournamentIndex } from "@/lib/queries/tournament-index";

export const revalidate = 1800;

export default async function TournamentsIndexPage() {
  const data = await selectTournamentIndex();

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/tournaments" />
      <div className="px-4 py-4 max-w-5xl mx-auto">
        <h1 className="text-fg font-extrabold text-lg mb-3">大会一覧</h1>

        {data.active.length > 0 && (
          <Section title={`開催中 (${data.active.length})`} colorCls="text-signal-red">
            {data.active.map((t) => <TournamentListCard key={t.slug} t={t} />)}
          </Section>
        )}

        {data.upcoming.length > 0 && (
          <Section title={`予定 (${data.upcoming.length})`} colorCls="text-signal-yellow">
            {data.upcoming.map((t) => <TournamentListCard key={t.slug} t={t} />)}
          </Section>
        )}

        {data.past.length > 0 && (
          <Section title={`終了 (${data.past.length})`} colorCls="text-fg-quiet">
            {data.past.slice(0, 12).map((t) => <TournamentListCard key={t.slug} t={t} />)}
          </Section>
        )}

        {data.active.length === 0 && data.upcoming.length === 0 && data.past.length === 0 && (
          <div className="text-fg-muted text-[12px]">大会データはありません。</div>
        )}
      </div>
    </main>
  );
}

function Section({
  title, colorCls, children,
}: { title: string; colorCls: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className={`text-[10px] tracking-widest font-extrabold mb-2 ${colorCls}`}>— {title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {children}
      </div>
    </section>
  );
}
