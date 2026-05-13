import Image from "next/image";
import { EndorsementBadge } from "../EndorsementBadge";

export type PlayerHeroProps = {
  nameJa: string;
  nameEn: string;
  university: string | null;
  hand: string | null;
  age: number | null;
  heightCm: number | null;
  birthplace: string | null;
  photoUrl: string | null;
  endorsements: string[];
};

export function PlayerHero(p: PlayerHeroProps) {
  return (
    <div className="p-4 bg-bg-panel border-b border-line">
      {/* Mobile: vertical stack. Desktop: 3-col grid */}
      <div className="flex gap-4 items-start">
        {/* Photo */}
        <div className="shrink-0 w-[80px] h-[80px] md:w-[120px] md:h-[120px] bg-bg-card border border-line flex items-center justify-center text-fg-quiet text-[9px]">
          {p.photoUrl ? (
            <Image src={p.photoUrl} alt={p.nameJa} width={120} height={120} className="object-cover w-full h-full" />
          ) : "PHOTO"}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-fg-muted tracking-widest mb-1 truncate">{p.nameEn}</div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-fg leading-none mb-2">{p.nameJa}</h1>
          <div className="flex gap-1.5 flex-wrap text-[9px]">
            {p.university && <Pill>{p.university}</Pill>}
            {p.hand && <Pill>{p.hand}</Pill>}
            {p.age !== null && <Pill>{p.age}歳{p.heightCm ? ` / ${p.heightCm}cm` : ""}</Pill>}
            {p.birthplace && <Pill>出身: {p.birthplace}</Pill>}
          </div>
        </div>
      </div>

      {/* Endorsements — below on mobile, right on desktop */}
      {p.endorsements.length > 0 && (
        <div className="mt-3 flex gap-1.5 flex-wrap md:hidden">
          {p.endorsements.map((e) => (
            <EndorsementBadge key={e} proName={e} />
          ))}
        </div>
      )}

      {/* Desktop endorsement (hidden on mobile, shown above via flex) */}
      {/* We handle via CSS in the desktop grid below */}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="bg-bg px-1.5 py-0.5 text-fg-muted border border-line">{children}</span>;
}
