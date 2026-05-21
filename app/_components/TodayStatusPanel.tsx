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
  alive: _alive, recent,
}: { alive: AliveEntry[]; recent: RecentResultEntry[] }) {
  return (
    <aside className="bg-bg p-3">
      <div className="text-[8px] tracking-widest text-fg-muted font-bold mb-1.5">
        最近の結果
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
        {recent.length === 0 && (
          <li className="text-fg-quiet text-[10px] py-1">最近の試合なし</li>
        )}
      </ul>
    </aside>
  );
}
