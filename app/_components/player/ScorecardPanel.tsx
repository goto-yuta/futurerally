export type Scorecard = {
  sns: { ig?: number; ig_er?: number; x?: number; x_er?: number; tiktok?: number; tiktok_er?: number };
  personal: { languages?: string[]; interests?: string[]; posting_style?: string };
  currentSponsors: string[];
  asks: string[];
};

export function ScorecardPanel({
  scorecard, onInquire,
}: { scorecard: Scorecard; onInquire: () => void }) {
  const s = scorecard;
  return (
    <div
      className="border border-signal-yellow p-3.5"
      style={{ background: "linear-gradient(180deg, #1f1d12 0%, #16191f 100%)" }}
    >
      <div className="text-[9px] tracking-widest text-signal-yellow font-extrabold mb-3">
        ★ SPONSORSHIP SCORECARD
      </div>

      <Section title="SNS REACH">
        <div className="grid grid-cols-3 gap-1.5">
          <SnsCell label="Instagram" count={s.sns.ig} er={s.sns.ig_er} />
          <SnsCell label="X (Twitter)" count={s.sns.x} er={s.sns.x_er} />
          <SnsCell label="TikTok" count={s.sns.tiktok} er={s.sns.tiktok_er} />
        </div>
      </Section>

      <Section title="PERSONAL">
        <div className="text-[10px] text-fg leading-relaxed">
          {s.personal.languages && s.personal.languages.length > 0 ? <>語学: {s.personal.languages.join(" / ")}<br /></> : null}
          {s.personal.interests && s.personal.interests.length > 0 ? <>興味: {s.personal.interests.join(" · ")}<br /></> : null}
          {s.personal.posting_style ? <>発信スタイル: {s.personal.posting_style}</> : null}
          {!s.personal.languages?.length && !s.personal.interests?.length && !s.personal.posting_style && "—"}
        </div>
      </Section>

      <Section title="CURRENT SPONSORS">
        <div className="flex gap-1 flex-wrap">
          {s.currentSponsors.length === 0
            ? <span className="text-fg-muted text-[10px]">—</span>
            : s.currentSponsors.map((c) => (
              <span key={c} className="bg-bg text-[9px] px-1.5 py-0.5 text-fg border border-line">{c}</span>
            ))}
        </div>
      </Section>

      <Section title="SPONSORSHIP ASK / 求めているもの">
        {s.asks.length === 0
          ? <div className="text-fg-muted text-[10px]">—</div>
          : <ul className="flex flex-col gap-0.5">
              {s.asks.map((a) => <li key={a} className="text-fg text-[10px]">▸ {a}</li>)}
            </ul>}
      </Section>

      <button
        onClick={onInquire}
        className="w-full bg-signal-yellow text-bg py-2.5 font-extrabold text-[11px] tracking-widest mt-2"
      >
        ▸ スポンサー候補として問い合わせる
      </button>
      <div className="text-[8px] text-fg-muted text-center mt-1.5">問い合わせは編集部経由 → 選手本人へ</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <div className="text-[8px] tracking-widest text-fg-muted mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function SnsCell({ label, count, er }: { label: string; count?: number; er?: number }) {
  return (
    <div className="bg-bg p-1.5 border border-line">
      <div className="text-[8px] text-fg-muted">{label}</div>
      <div className="tabular text-[14px] font-extrabold text-fg">
        {count ? count.toLocaleString() : "—"}
      </div>
      <div className="text-[8px] text-signal-green">{er ? `ER ${er}%` : "—"}</div>
    </div>
  );
}
