import { StatusPill } from "../StatusPill";

export function CurrentStatusStrip({
  tournamentName, currentRound, nextMatchAt, nextOpponent,
}: {
  tournamentName: string;
  currentRound: string;
  nextMatchAt: string | null;
  nextOpponent: string | null;
}) {
  return (
    <div className="bg-bg px-4 py-2.5 border-b border-line flex gap-3 items-center flex-wrap">
      <StatusPill status="live">● 大会出場中</StatusPill>
      <span className="text-[10px] text-fg font-semibold">
        {tournamentName} · 残{currentRound}
      </span>
      {nextMatchAt && (
        <span className="text-[9px] text-fg-muted">
          本日プレー予定 / {nextMatchAt}{nextOpponent ? ` vs ${nextOpponent}` : ""}
        </span>
      )}
    </div>
  );
}
