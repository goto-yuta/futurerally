"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export function InquiryForm({
  playerSlug, playerName, onSuccess,
}: { playerSlug: string; playerName: string; onSuccess: () => void }) {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  // When no site key is configured (e.g. local dev), allow submission without the widget.
  const turnstileReady = !siteKey || !!token;
  const canSubmit = turnstileReady && !!company && !!name && !!email && !!message && !sending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerSlug,
        companyName: company,
        contactName: name,
        contactEmail: email,
        message,
        turnstileToken: token || "local-dev",
      }),
    });
    setSending(false);
    if (res.ok) {
      onSuccess();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "送信に失敗しました");
    }
  }

  const fieldCls = "w-full bg-bg border border-line px-2 py-1.5 text-[11px] text-fg";
  const labelCls = "text-[9px] tracking-widest text-fg-muted font-bold mb-1 block";

  return (
    <form onSubmit={onSubmit} className="bg-bg-panel border border-line p-4 flex flex-col gap-2.5">
      <h3 className="text-fg font-extrabold text-sm mb-1.5">{playerName} へ問い合わせ</h3>

      <div>
        <label className={labelCls} htmlFor="company">会社名</label>
        <input id="company" className={fieldCls} value={company} onChange={(e) => setCompany(e.target.value)} required />
      </div>
      <div>
        <label className={labelCls} htmlFor="name">担当者名</label>
        <input id="name" className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className={labelCls} htmlFor="email">メールアドレス</label>
        <input id="email" type="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className={labelCls} htmlFor="message">メッセージ</label>
        <textarea id="message" rows={5} className={fieldCls} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>

      {siteKey && (
        <Turnstile siteKey={siteKey} onSuccess={setToken} options={{ theme: "dark" }} />
      )}

      {error && <div className="text-signal-red text-[10px]">{error}</div>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-signal-yellow text-bg py-2.5 font-extrabold text-[11px] tracking-widest disabled:opacity-40"
      >
        {sending ? "送信中…" : "送信する"}
      </button>
    </form>
  );
}
