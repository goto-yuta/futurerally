export function ProQuoteCard({ proName, quote }: { proName: string; quote: string }) {
  return (
    <div className="bg-bg-panel border border-line p-3.5">
      <div className="text-[9px] tracking-widest text-signal-yellow font-extrabold mb-2.5">
        ★ プロのコメント
      </div>
      <blockquote className="border-l-2 border-signal-yellow pl-2.5 text-[10px] text-fg leading-relaxed italic mb-1.5">
        「{quote}」
      </blockquote>
      <div className="text-[9px] text-fg-muted">— {proName}</div>
    </div>
  );
}
