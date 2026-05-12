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
    <div className="grid grid-cols-[120px_1fr_auto] gap-4 p-4 bg-bg-panel border-b border-line items-center">
      <div className="w-[120px] h-[120px] bg-bg-card border border-line flex items-center justify-center text-fg-quiet text-[9px]">
        {p.photoUrl ? (
          <Image src={p.photoUrl} alt={p.nameJa} width={120} height={120} className="object-cover w-full h-full" />
        ) : "PHOTO"}
      </div>
      <div>
        <div className="text-[10px] text-fg-muted tracking-widest mb-1.5">{p.nameEn} · {p.nameJa}</div>
        <h1 className="text-3xl font-black tracking-tighter text-fg leading-none mb-2.5">{p.nameJa}</h1>
        <div className="flex gap-2 flex-wrap text-[9px]">
          {p.university && <Pill>{p.university}</Pill>}
          {p.hand && <Pill>{p.hand}</Pill>}
          {p.age !== null && <Pill>{p.age}歳{p.heightCm ? ` / ${p.heightCm}cm` : ""}</Pill>}
          {p.birthplace && <Pill>出身: {p.birthplace}</Pill>}
        </div>
      </div>
      {p.endorsements.length > 0 && (
        <div className="text-right">
          <div className="text-[8px] tracking-widest text-signal-yellow font-extrabold mb-2">★ PRO ENDORSED</div>
          <div className="flex flex-col gap-1">
            {p.endorsements.map((e) => (
              <EndorsementBadge key={e} proName={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="bg-bg px-2 py-1 text-fg-muted border border-line">{children}</span>;
}
