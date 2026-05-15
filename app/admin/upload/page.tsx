"use client";

import { useRef, useState } from "react";

export default function AdminUploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "エラーが発生しました"); return; }
      setResult(data);
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function copyUrl(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-fg font-bold text-lg mb-6">画像アップロード</h1>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-line hover:border-fg-quiet transition-colors rounded-sm p-12 text-center cursor-pointer"
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        {uploading ? (
          <span className="text-fg-muted text-[13px]">アップロード中...</span>
        ) : (
          <>
            <div className="text-fg-muted text-[13px] mb-1">クリックまたはドラッグ&ドロップ</div>
            <div className="text-fg-quiet text-[11px]">JPEG / PNG / WebP / GIF · 5MB以下</div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-signal-red/10 border border-signal-red text-signal-red text-[12px] px-3 py-2 rounded-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 bg-bg-panel border border-line rounded-sm p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="アップロード済み" className="w-full rounded-sm mb-3" />

          <div className="text-[11px] text-fg-muted mb-1">ヒーロー画像 (frontmatter)</div>
          <div className="flex gap-2 mb-3">
            <code className="flex-1 bg-bg text-fg-muted text-[11px] px-2 py-1.5 rounded-sm break-all">
              heroImage: {result.url}
            </code>
            <button onClick={() => copyUrl(`heroImage: ${result.url}`)} className="shrink-0 text-[10px] font-bold px-2 py-1 bg-bg border border-line rounded-sm hover:border-signal-yellow text-fg-quiet hover:text-signal-yellow transition-colors">
              {copied ? "✓" : "コピー"}
            </button>
          </div>

          <div className="text-[11px] text-fg-muted mb-1">本文埋め込み (MDX)</div>
          <div className="flex gap-2">
            <code className="flex-1 bg-bg text-fg-muted text-[11px] px-2 py-1.5 rounded-sm break-all">
              ![説明文]({result.url})
            </code>
            <button onClick={() => copyUrl(`![説明文](${result.url})`)} className="shrink-0 text-[10px] font-bold px-2 py-1 bg-bg border border-line rounded-sm hover:border-signal-yellow text-fg-quiet hover:text-signal-yellow transition-colors">
              {copied ? "✓" : "コピー"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-[11px] text-fg-quiet space-y-1">
        <div>· ヒーロー画像は frontmatter の <code className="bg-bg px-1">heroImage:</code> に URL を貼る</div>
        <div>· 本文に埋め込むには MDX の <code className="bg-bg px-1">![alt](url)</code> 構文を使う</div>
      </div>
    </div>
  );
}
