"use client";

import { useState } from "react";
import { ScorecardPanel, type Scorecard } from "@/app/_components/player/ScorecardPanel";
import { InquiryForm } from "@/app/_components/player/InquiryForm";

export function ProfileClientShell({
  playerSlug, playerName, scorecard,
}: { playerSlug: string; playerName: string; scorecard: Scorecard }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <ScorecardPanel scorecard={scorecard} onInquire={() => { setOpen(true); setSubmitted(false); }} />
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {submitted ? (
              <div className="bg-bg-panel border border-signal-green p-5 text-fg text-center">
                ✓ 送信しました。編集部から折り返しご連絡します。
                <button
                  className="block mx-auto mt-3 text-[11px] text-fg-muted underline"
                  onClick={() => setOpen(false)}
                >
                  閉じる
                </button>
              </div>
            ) : (
              <InquiryForm
                playerSlug={playerSlug}
                playerName={playerName}
                onSuccess={() => setSubmitted(true)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
