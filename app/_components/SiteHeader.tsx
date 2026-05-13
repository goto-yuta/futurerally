import Link from "next/link";
import { MobileMenuButton } from "./MobileMenu";

const NAV = [
  { href: "/", label: "HOME" },
  { href: "/rankings", label: "ランキング" },
  { href: "/players", label: "選手" },
  { href: "/tournaments", label: "大会" },
  { href: "/articles", label: "記事" },
];

export function SiteHeader({ active }: { active: string }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-line bg-bg sticky top-0 z-40">
      <Link href="/" className="text-fg font-extrabold text-xs tracking-widest">
        FUTURERALLY
      </Link>

      {/* Desktop nav — hidden on mobile */}
      <nav className="hidden md:flex gap-4 text-[9px] tracking-widest">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={n.href === active ? "text-signal-yellow" : "text-fg-muted hover:text-fg"}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger — hidden on desktop */}
      <MobileMenuButton active={active} />
    </header>
  );
}
