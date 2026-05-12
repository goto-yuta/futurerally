import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { inquirySchema } from "@/lib/validation/inquiry-schema";
import { db } from "@/lib/db/client";
import { players, sponsorshipInquiries } from "@/lib/db/schema";
import { sendInquiryEmail } from "@/lib/email/send-inquiry-email";

export const runtime = "nodejs";

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Allow local dev when no secret is configured.
  if (!secret) return process.env.NODE_ENV !== "production";

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const json = (await res.json()) as { success: boolean };
  return json.success;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = inquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ok = await verifyTurnstile(payload.turnstileToken, ip);
  if (!ok) return NextResponse.json({ error: "turnstile failed" }, { status: 403 });

  const [player] = await db.select().from(players).where(eq(players.slug, payload.playerSlug)).limit(1);
  if (!player) return NextResponse.json({ error: "player not found" }, { status: 404 });

  await db.insert(sponsorshipInquiries).values({
    playerId: player.id,
    companyName: payload.companyName,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    message: payload.message,
  });

  try {
    if (process.env.RESEND_API_KEY) {
      await sendInquiryEmail({
        playerName: player.nameJa,
        companyName: payload.companyName,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
        message: payload.message,
      });
    } else {
      console.log("[inquiry] RESEND_API_KEY not set; row saved but email skipped.");
    }
  } catch (e) {
    console.error("email send failed", e);
  }

  return NextResponse.json({ ok: true });
}
