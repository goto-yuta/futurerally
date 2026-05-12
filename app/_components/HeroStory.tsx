import Link from "next/link";

export function HeroStory({
  kicker, title, meta, href,
}: { kicker: string; title: string; meta: string; href: string }) {
  return (
    <article className="bg-bg-panel p-5 border-r border-line">
      <div className="text-[9px] tracking-widest text-signal-orange font-extrabold mb-2">
        ★ TODAY&apos;S STORY · {kicker}
      </div>
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-fg mb-3">
        {title}
      </h2>
      <p className="text-[10px] text-fg-muted mb-3">{meta}</p>
      <Link
        href={href}
        className="inline-block bg-signal-yellow text-bg px-3 py-1.5 text-[11px] font-extrabold tracking-widest"
      >
        READ STORY →
      </Link>
    </article>
  );
}
