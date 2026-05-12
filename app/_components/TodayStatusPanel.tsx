import Link from "next/link";
import { StatusPill } from "./StatusPill";

export type AliveEntry = {
  playerSlug: string;
  playerName: string;
  tournamentSlug: string;
  tournamentName: string;
  currentRound: string;
  note?: string;
};

export type RecentResultEntry = {
  playerSlug: string;
  playerName: string;
  tournamentSlug: string;
  tournamentName: string;
  result: "won" | "lost";
  summary: string;
};

export function TodayStatusPanel({
  alive, recent,
}: { alive: AliveEntry[]; recent: RecentResultEntry[] }) {
  return (
    <aside className="bg-bg p-3">
      <div className="text-[9px] tracking-widest text-signal-red font-extrabold mb-2">
        ● TODAY · 大会出場中
      </div>
      <ul className="flex flex-col gap-1 mb-3">
        {alive.map((e, i) => (
          <li key={i} className="bg-bg border-l-2 border-signal-yellow px-2.5 py-2 text-[10px]">
            <div className="text-fg font-bold">
              <Link href={`/players/${e.playerSlug}`} className="hover:text-signal-yellow">
                {e.playerName}
              </Link>
            </div>
            <div className="text-fg-muted text-[9px] mt-0.5">
              <Link href={`/tournaments/${e.tournamentSlug}`} className="hover:text-signal-yellow">
                {e.tournamentName}
              </Link>
              {" "}· 残{e.currentRound}
              {e.note ? ` · ${e.note}` : ""}
            </div>
          </li>
        ))}
      </ul>
      <div className="text-[8px] tracking-widest text-fg-muted font-bold pt-2 mb-1.5 border-t border-line">
        昨日の結果
      </div>
      <ul className="flex flex-col gap-1">
        {recent.map((e, i) => (
          <li
            key={i}
            className={`bg-bg border-l-2 px-2.5 py-2 text-[10px] ${
              e.result === "won" ? "border-signal-green opacity-70" : "border-signal-red opacity-50"
            }`}
          >
            <div className="text-fg font-bold flex gap-1.5 items-center">
              <Link href={`/players/${e.playerSlug}`} className="hover:text-signal-yellow">
                {e.playerName}
              </Link>
              <StatusPill status={e.result}>
                {e.result === "won" ? "✓ Won" : "✗ Lost"}
              </StatusPill>
            </div>
            <div className="text-fg-muted text-[9px] mt-0.5">
              <Link href={`/tournaments/${e.tournamentSlug}`} className="hover:text-signal-yellow">
                {e.tournamentName}
              </Link>
              {" "}· {e.summary}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
