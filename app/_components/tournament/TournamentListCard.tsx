import Link from "next/link";
import { TournamentBadge, type TournamentLevel } from "./TournamentBadge";

export type TournamentSummary = {
  slug: string;
  nameJa: string;
  level: TournamentLevel;
  location: string | null;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "past";
  japaneseEntryCount: number;
};

const STATUS_LABEL: Record<TournamentSummary["status"], { text: string; color: string }> = {
  active: { text: "開催中", color: "text-signal-red" },
  upcoming: { text: "予定", color: "text-fg-muted" },
  past: { text: "終了", color: "text-fg-quiet" },
};

export function TournamentListCard({ t }: { t: TournamentSummary }) {
  const status = STATUS_LABEL[t.status];
  return (
    <Link href={`/tournaments/${t.slug}`} className="bg-bg-panel border border-line p-3.5 block hover:border-fg-muted">
      <div className="flex justify-between items-start mb-2">
        <TournamentBadge level={t.level} />
        <span className={`text-[9px] font-extrabold ${status.color}`}>● {status.text}</span>
      </div>
      <div className="text-fg font-extrabold text-base">{t.nameJa}</div>
      <div className="text-fg-muted text-[10px] mt-1">
        {t.location ?? "—"} · {t.startDate}-{t.endDate}
      </div>
      <div className="text-fg-quiet text-[9px] mt-2">日本人選手 {t.japaneseEntryCount}名</div>
    </Link>
  );
}
