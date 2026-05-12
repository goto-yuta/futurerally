import { ReactNode } from "react";

type Status = "live" | "won" | "lost" | "default";

const styles: Record<Status, string> = {
  live: "bg-signal-red text-white font-extrabold",
  won: "text-signal-green font-bold",
  lost: "text-signal-red font-bold",
  default: "text-fg-muted",
};

export function StatusPill({ status, children }: { status: Status; children: ReactNode }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[9px] tracking-widest uppercase ${styles[status]}`}
    >
      {children}
    </span>
  );
}
