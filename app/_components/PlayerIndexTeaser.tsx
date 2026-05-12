import Link from "next/link";

export type CategoryCount = {
  label: string;
  href: string;
  count: number;
  active?: boolean;
};

export function PlayerIndexTeaser({
  totalCount, categories,
}: { totalCount: number; categories: CategoryCount[] }) {
  return (
    <section>
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="text-[9px] tracking-widest text-fg-muted font-extrabold">
          — PLAYER INDEX · 全{totalCount}名
        </div>
        <Link href="/players" className="text-[9px] text-signal-yellow font-bold">
          選手一覧 ＞
        </Link>
      </div>
      <div className="flex gap-1.5 flex-wrap px-4 pb-5">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`bg-bg-card text-[9px] px-2.5 py-1 tracking-wide font-bold ${
              c.active ? "text-signal-yellow" : "text-fg-muted"
            }`}
          >
            {c.label} · {c.count}人
          </Link>
        ))}
      </div>
    </section>
  );
}
