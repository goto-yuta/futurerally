"use server";

import { redirect } from "next/navigation";
import { setAdminCookie } from "@/lib/admin/auth";

async function loginAction(fd: FormData) {
  "use server";
  const pw = fd.get("password") as string;
  const ok = await setAdminCookie(pw);
  if (ok) redirect("/admin");
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm bg-bg-panel border border-line rounded-sm p-8">
        <div className="font-bold tracking-widest text-fg-muted text-[11px] mb-6">
          FUTURERALLY · ADMIN
        </div>
        <form action={loginAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder="パスワード"
            required
            autoFocus
            className="bg-bg border border-line text-fg text-sm px-3 py-2 rounded-sm outline-none focus:border-signal-yellow placeholder:text-fg-quiet"
          />
          <button
            type="submit"
            className="bg-signal-yellow text-bg font-bold text-sm py-2 rounded-sm hover:opacity-90 transition-opacity"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
