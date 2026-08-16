"use client";

import { AlignLeft, FileText } from "lucide-react";
import { useId, useRef, useState } from "react";

type PdfView = "original" | "text";

export function PdfReader({ title, pdfUrl, pageCount, contentText }: { title: string; pdfUrl: string | null; pageCount: number | null; contentText: string }) {
  const hasText = Boolean(contentText.trim());
  const [view, setView] = useState<PdfView>(pdfUrl ? "original" : "text");
  const originalTab = useRef<HTMLButtonElement>(null);
  const textTab = useRef<HTMLButtonElement>(null);
  const id = useId();

  function selectView(nextView: PdfView) {
    if ((nextView === "original" && !pdfUrl) || (nextView === "text" && !hasText)) return;
    setView(nextView);
  }

  function handleTabKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextView = view === "original" ? "text" : "original";
    if ((nextView === "original" && !pdfUrl) || (nextView === "text" && !hasText)) return;
    setView(nextView);
    (nextView === "original" ? originalTab : textTab).current?.focus();
  }

  return (
    <section className="pdf-reader" aria-label="Pembaca PDF">
      <div className="pdf-mode-switch" role="tablist" aria-label="Mode baca PDF" onKeyDown={handleTabKey}>
        <button ref={originalTab} id={`${id}-original-tab`} type="button" role="tab" aria-selected={view === "original"} aria-controls={`${id}-original-panel`} tabIndex={view === "original" ? 0 : -1} disabled={!pdfUrl} onClick={() => selectView("original")}><FileText size={17} strokeWidth={1.5} />PDF asli</button>
        <button ref={textTab} id={`${id}-text-tab`} type="button" role="tab" aria-selected={view === "text"} aria-controls={`${id}-text-panel`} tabIndex={view === "text" ? 0 : -1} disabled={!hasText} onClick={() => selectView("text")}><AlignLeft size={17} strokeWidth={1.5} />Teks ekstraksi</button>
      </div>

      <div id={`${id}-original-panel`} className="pdf-panel" role="tabpanel" aria-labelledby={`${id}-original-tab`} hidden={view !== "original"}>
        {pdfUrl ? (
          <>
            <div className="pdf-label"><FileText size={18} strokeWidth={1.5} /><span>{pageCount ? `PDF asli, ${pageCount} halaman` : "PDF asli"}</span></div>
            <iframe title={title} src={pdfUrl} />
          </>
        ) : <p className="pdf-unavailable">Berkas PDF tidak dapat dibuka. Gunakan teks ekstraksi untuk membaca dokumen ini.</p>}
      </div>

      <div id={`${id}-text-panel`} className="pdf-panel" role="tabpanel" aria-labelledby={`${id}-text-tab`} hidden={view !== "text"}>
        {hasText ? <div className="reader-text">{contentText}</div> : <p className="pdf-unavailable">Teks tidak ditemukan dalam PDF ini.</p>}
      </div>
    </section>
  );
}
