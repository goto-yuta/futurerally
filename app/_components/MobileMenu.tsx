"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "HOME" },
  { href: "/rankings", label: "ランキング" },
  { href: "/players", label: "選手" },
  { href: "/tournaments", label: "大会" },
  { href: "/articles", label: "記事" },
];

export function MobileMenuButton({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        aria-label="メニューを開く"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col gap-[5px] p-2 md:hidden"
      >
        <span
          className={`block h-[2px] w-5 bg-fg transition-all duration-200 origin-center ${
            open ? "rotate-45 translate-y-[7px]" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-5 bg-fg transition-all duration-200 ${
            open ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-5 bg-fg transition-all duration-200 origin-center ${
            open ? "-rotate-45 -translate-y-[7px]" : ""
          }`}
        />
      </button>

      {/* Overlay + slide-in drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <nav className="absolute right-0 top-0 bottom-0 w-64 bg-bg-panel border-l border-line flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <span className="text-fg font-extrabold text-xs tracking-widest">ULTIMATE FOREHAND</span>
              <button
                aria-label="閉じる"
                onClick={() => setOpen(false)}
                className="text-fg-muted text-xl leading-none"
              >
                ×
              </button>
            </div>
            {/* Nav links */}
            <ul className="flex flex-col py-2">
              {NAV.map((n) => {
                const isActive = n.href === "/" ? active === "/" : active.startsWith(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      className={`flex items-center gap-3 px-5 py-4 text-[13px] font-bold tracking-widest border-l-2 transition-colors ${
                        isActive
                          ? "border-signal-yellow text-signal-yellow bg-bg"
                          : "border-transparent text-fg-muted hover:text-fg hover:bg-bg"
                      }`}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
