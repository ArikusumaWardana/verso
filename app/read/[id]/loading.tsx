import { ArrowLeft, BookOpen } from "lucide-react";

export default function ReaderLoading() {
  return (
    <main className="reader-page reader-loading" aria-busy="true" aria-live="polite">
      <div className="reader-loading-progress" aria-hidden="true" />
      <header className="reader-header">
        <span className="reader-back reader-loading-back"><ArrowLeft size={18} />Kembali ke arsip</span>
      </header>
      <section className="reader-loading-state" role="status">
        <div className="reader-loading-mark" aria-hidden="true"><BookOpen size={30} strokeWidth={1.25} /></div>
        <p className="eyebrow">Reader</p>
        <h1>Menyiapkan bacaan</h1>
        <p>Verso sedang mengambil teks dan berkas tersimpan.</p>
      </section>
    </main>
  );
}
