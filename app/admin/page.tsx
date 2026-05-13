import { db } from "@/lib/db/client";
import { players, articles, sponsorshipInquiries } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [[{ total: playerCount }], [{ total: articleCount }], [{ total: inquiryCount }], [{ total: newInquiries }]] =
    await Promise.all([
      db.select({ total: count() }).from(players),
      db.select({ total: count() }).from(articles),
      db.select({ total: count() }).from(sponsorshipInquiries),
      db.select({ total: count() }).from(sponsorshipInquiries).where(eq(sponsorshipInquiries.status, "new")),
    ]);

  const stats = [
    { label: "選手", value: playerCount, href: "/admin/players" },
    { label: "記事", value: articleCount, href: "/admin/articles" },
    { label: "問い合わせ", value: inquiryCount, href: "/admin/inquiries", badge: newInquiries > 0 ? `${newInquiries} 新着` : null },
  ];

  return (
    <div>
      <h1 className="text-fg font-bold text-lg mb-6">ダッシュボード</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {stats.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-bg-panel border border-line rounded-sm p-5 hover:border-fg-quiet transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="text-[11px] text-fg-muted font-bold tracking-wider uppercase">{s.label}</div>
              {s.badge && (
                <span className="text-[10px] font-bold text-signal-red bg-signal-red/10 px-2 py-0.5 rounded-sm">
                  {s.badge}
                </span>
              )}
            </div>
            <div className="text-fg font-bold text-3xl mt-2 tabular-nums">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="bg-bg-panel border border-line rounded-sm p-4 text-[12px] text-fg-muted">
        <div className="font-bold text-fg-quiet mb-2">クイックアクション</div>
        <ul className="space-y-1">
          <li>記事を追加: <code className="text-fg-muted bg-bg px-1">content/articles/</code> に MDX ファイルを作成して <code className="text-fg-muted bg-bg px-1">npm run articles:sync</code></li>
          <li>選手を追加: <code className="text-fg-muted bg-bg px-1">npm run player:add -- --atp &lt;ID&gt;</code></li>
          <li>ランキング更新: <code className="text-fg-muted bg-bg px-1">npm run rankings:sync</code></li>
        </ul>
      </div>
    </div>
  );
}
