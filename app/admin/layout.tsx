import Link from "next/link";
import { clearAdminCookie } from "@/lib/admin/auth";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  await clearAdminCookie();
  redirect("/admin/login");
}

const NAV = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/players", label: "選手" },
  { href: "/admin/articles", label: "記事" },
  { href: "/admin/inquiries", label: "問い合わせ" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-bg-panel border-b border-line px-4 py-3 flex items-center gap-6">
        <span className="font-bold tracking-widest text-fg-muted text-[11px] shrink-0">
          FUTURERALLY · ADMIN
        </span>
        <nav className="flex gap-1 flex-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[12px] text-fg-muted hover:text-fg px-2 py-1 rounded-sm hover:bg-bg-card transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-[11px] text-fg-quiet hover:text-fg-muted transition-colors"
          >
            ログアウト
          </button>
        </form>
      </header>
      <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
