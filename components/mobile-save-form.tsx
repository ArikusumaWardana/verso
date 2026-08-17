"use client";

import { ArrowLeft, CheckCircle2, Link2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function MobileSaveForm({ initialUrl, sharedTitle }: { initialUrl: string; sharedTitle: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), source: "manual_url" })
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error || "Bacaan belum dapat disimpan. Coba lagi.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Koneksi terputus saat menyimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mobile-save-page">
      <header className="mobile-save-header">
        <Link href="/" aria-label="Kembali ke arsip"><ArrowLeft size={19} strokeWidth={1.5} />Kembali</Link>
        <strong>Verso</strong>
      </header>
      <section className="mobile-save-panel">
        {saved ? (
          <div className="mobile-save-success" role="status">
            <CheckCircle2 size={28} strokeWidth={1.5} aria-hidden="true" />
            <p className="eyebrow">Tersimpan</p>
            <h1>Bacaan masuk ke arsipmu.</h1>
            <p>Verso sudah menyimpan dan mengindeks isi bacaan tersebut.</p>
            <Link className="primary-button" href="/">Buka arsip</Link>
          </div>
        ) : (
          <form className="mobile-save-form" onSubmit={handleSubmit}>
            <div className="mobile-save-mark" aria-hidden="true"><Link2 size={24} strokeWidth={1.5} /></div>
            <p className="eyebrow">Dibagikan ke Verso</p>
            <h1>Simpan bacaan ini?</h1>
            <p>Periksa tautannya sebelum Verso mengunduh dan memasukkannya ke arsip.</p>
            {sharedTitle && <p className="shared-page-title">{sharedTitle}</p>}
            <label htmlFor="shared-url">Tautan bacaan</label>
            <input id="shared-url" name="url" type="url" inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://contoh.com/artikel" required disabled={pending} />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={!url.trim() || pending} aria-busy={pending}>{pending ? "Menyimpan bacaan…" : "Simpan ke Verso"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
