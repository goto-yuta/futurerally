import { db } from "@/lib/db/client";
import { sponsorshipInquiries, players } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function updateStatus(fd: FormData) {
  "use server";
  const id = Number(fd.get("id"));
  const status = fd.get("status") as "new" | "forwarded" | "closed";
  await db.update(sponsorshipInquiries)
    .set({ status, handledAt: status !== "new" ? new Date() : null })
    .where(eq(sponsorshipInquiries.id, id));
  revalidatePath("/admin/inquiries");
}

const STATUS_COLOR: Record<string, string> = {
  new: "text-signal-red",
  forwarded: "text-signal-yellow",
  closed: "text-fg-quiet",
};
const STATUS_LABEL: Record<string, string> = {
  new: "新着",
  forwarded: "転送済",
  closed: "完了",
};

export default async function AdminInquiriesPage() {
  const rows = await db.select({
    id: sponsorshipInquiries.id,
    companyName: sponsorshipInquiries.companyName,
    contactName: sponsorshipInquiries.contactName,
    contactEmail: sponsorshipInquiries.contactEmail,
    message: sponsorshipInquiries.message,
    status: sponsorshipInquiries.status,
    createdAt: sponsorshipInquiries.createdAt,
    handledAt: sponsorshipInquiries.handledAt,
    playerNameJa: players.nameJa,
  })
    .from(sponsorshipInquiries)
    .leftJoin(players, eq(sponsorshipInquiries.playerId, players.id))
    .orderBy(desc(sponsorshipInquiries.createdAt));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-fg font-bold text-lg">問い合わせ</h1>
        <span className="text-fg-quiet text-[11px] ml-auto">{rows.length}件</span>
      </div>

      {rows.length === 0 ? (
        <div className="bg-bg-panel border border-line rounded-sm p-6 text-fg-muted text-[13px]">
          問い合わせはまだありません。
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-bg-panel border border-line rounded-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className={`text-[10px] font-bold ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  <span className="text-fg font-medium text-[13px] ml-2">{r.companyName}</span>
                  {r.playerNameJa && (
                    <span className="text-fg-muted text-[11px] ml-2">→ {r.playerNameJa}</span>
                  )}
                </div>
                <span className="text-fg-quiet text-[10px] shrink-0 tabular-nums">
                  {r.createdAt.toLocaleDateString("ja-JP")}
                </span>
              </div>
              <div className="text-fg-muted text-[11px] mb-1">
                {r.contactName} &lt;{r.contactEmail}&gt;
              </div>
              <div className="text-fg text-[12px] whitespace-pre-wrap mb-3">{r.message}</div>
              <form action={updateStatus} className="flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                {(["new", "forwarded", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    type="submit"
                    name="status"
                    value={s}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border transition-colors ${
                      r.status === s
                        ? "border-signal-yellow text-signal-yellow"
                        : "border-line text-fg-quiet hover:text-fg"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
