import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { PlayerHero } from "@/app/_components/player/PlayerHero";
import { CurrentStatusStrip } from "@/app/_components/player/CurrentStatusStrip";
import { RankingBlock } from "@/app/_components/player/RankingBlock";
import { SchedulePanel } from "@/app/_components/player/SchedulePanel";
import { RelatedArticles } from "@/app/_components/player/RelatedArticles";
import { ProQuoteCard } from "@/app/_components/player/ProQuoteCard";
import { ProfileClientShell } from "./ProfileClientShell";
import { selectPlayerProfile } from "@/lib/queries/player-profile";

export const revalidate = 1800;

export default async function PlayerProfilePage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await selectPlayerProfile(slug);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-bg">
      <SiteHeader active="/players" />
      <div className="text-[9px] text-fg-quiet px-4 py-2 border-b border-line">
        選手 / {data.player.university ? "大学生" : "プロ"} / {data.player.nameJa}
      </div>

      <PlayerHero
        nameJa={data.player.nameJa}
        nameEn={data.player.nameEn}
        university={data.player.university}
        hand={data.player.hand}
        age={data.player.age}
        heightCm={data.player.heightCm}
        birthplace={data.player.birthplace}
        photoUrl={data.player.photoUrl}
        endorsements={data.endorsements.map((e) => e.proName)}
      />

      {data.currentTournament && (
        <CurrentStatusStrip
          tournamentName={data.currentTournament.tournamentName}
          currentRound={data.currentTournament.currentRound}
          nextMatchAt={data.currentTournament.nextMatchAt}
          nextOpponent={data.currentTournament.nextOpponent}
        />
      )}

      {/* Mobile: Scorecard first (order-1), desktop: right column (order-2) */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-px bg-line">
        <div className="bg-bg p-3.5 flex flex-col gap-2.5 order-2 md:order-1">
          <RankingBlock
            jtaRank={data.player.currentJtaRank}
            atpRank={data.player.currentAtpRank}
            recentWL={data.recentWL}
            sparkline={data.sparkline}
          />
          <SchedulePanel entries={data.schedule} />
          <RelatedArticles articles={data.relatedArticles} />
        </div>
        <div className="bg-bg p-3.5 flex flex-col gap-2.5 order-1 md:order-2">
          <ProfileClientShell
            playerSlug={data.player.slug}
            playerName={data.player.nameJa}
            scorecard={data.player.scorecard}
          />
          {data.endorsements[0]?.quote && (
            <ProQuoteCard
              proName={data.endorsements[0].proName}
              quote={data.endorsements[0].quote}
            />
          )}
        </div>
      </div>
    </main>
  );
}
