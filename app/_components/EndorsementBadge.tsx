export function EndorsementBadge({ proName }: { proName: string }) {
  return (
    <span className="inline-block bg-signal-yellow text-bg px-2.5 py-1 text-[10px] font-extrabold tracking-wide">
      ★ {proName}
    </span>
  );
}
