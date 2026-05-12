export type ScheduleEntry = {
  tournamentSlug: string;
  tournamentName: string;
  status: "alive" | "scheduled" | "won" | "lost" | "champion";
  startDate: string;
  endDate: string;
};

const STATUS_COLOR: Record<ScheduleEntry["status"], string> = {
  alive: "border-signal-red",
  scheduled: "border-line",
  won: "border-signal-green",
  lost: "border-signal-red",
  champion: "border-signal-yellow",
};

const STATUS_LABEL: Record<ScheduleEntry["status"], { text: string; color: string }> = {
  alive: { text: "出場中", color: "text-signal-red" },
  scheduled: { text: "予定", color: "text-fg-muted" },
  won: { text: "勝ち抜き", color: "text-signal-green" },
  lost: { text: "敗退", color: "text-fg-muted" },
  champion: { text: "優勝", color: "text-signal-yellow" },
};

export function SchedulePanel({ entries }: { entries: ScheduleEntry[] }) {
  return (
    <div className="bg-bg-panel border border-line p-3.5">
      <div className="text-[9px] tracking-widest text-fg-muted font-extrabold mb-2.5">
        — 出場予定 / TOURNAMENT SCHEDULE
      </div>
      <ul className="flex flex-col gap-1.5">
        {entries.map((e) => {
          const label = STATUS_LABEL[e.status];
          return (
            <li
              key={e.tournamentSlug}
              className={`grid grid-cols-[60px_1fr_80px] gap-2 text-[10px] py-1.5 px-2 bg-bg border-l-2 ${STATUS_COLOR[e.status]}`}
            >
              <span className={`${label.color} font-extrabold text-[9px]`}>{label.text}</span>
              <span className="text-fg">{e.tournamentName}</span>
              <span className="text-fg-muted text-[9px]">{e.startDate}-{e.endDate}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
