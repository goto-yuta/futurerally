export function RankingSparkline({
  points, highlightLast,
}: { points: number[]; highlightLast: number }) {
  if (points.length === 0) {
    return <div className="text-fg-quiet text-[9px]">データなし</div>;
  }
  const max = Math.max(...points);
  return (
    <div className="flex items-end gap-0.5 h-9">
      {points.map((v, i) => {
        const heightPct = ((max - v) / max) * 100;
        const highlighted = i >= points.length - highlightLast;
        return (
          <div
            key={i}
            className={`spark-bar flex-1 ${highlighted ? "bg-signal-yellow" : "bg-bg-card"}`}
            style={{ height: `${Math.max(heightPct, 5)}%` }}
          />
        );
      })}
    </div>
  );
}
