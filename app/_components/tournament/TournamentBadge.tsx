export type TournamentLevel = "atp" | "challenger" | "futures_25" | "futures_15" | "jta" | "college";

const LEVEL_CONFIG: Record<TournamentLevel, { label: string; cls: string }> = {
  atp: { label: "ATP", cls: "bg-signal-yellow text-bg" },
  challenger: { label: "CHALLENGER", cls: "bg-signal-orange text-bg" },
  futures_25: { label: "F25", cls: "bg-bg-card text-fg border border-signal-yellow" },
  futures_15: { label: "F15", cls: "bg-bg-card text-fg border border-line" },
  jta: { label: "JTA", cls: "bg-bg-card text-fg-muted border border-line" },
  college: { label: "COLLEGE", cls: "bg-bg-card text-fg-muted border border-line" },
};

export function TournamentBadge({ level }: { level: TournamentLevel }) {
  const cfg = LEVEL_CONFIG[level];
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold tracking-widest ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
