"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive, ArchiveRestore, BookOpen, CheckCircle2, ChevronRight, FileText, Library, Menu, Moon, Plus,
  LogOut, Search, Star, Sun, Trash2, Upload, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Document, DocumentType } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { withSignedCoverUrls } from "@/lib/document-covers";

type Filter = "all" | DocumentType | "starred" | "archived";
type SearchResult = Document & { headline?: string | null; highlighted_title?: string | null; rank?: number };

const filters: { id: Filter; label: string; icon: typeof Library }[] = [
  { id: "all", label: "Semua bacaan", icon: Library },
  { id: "article", label: "Artikel", icon: BookOpen },
  { id: "pdf", label: "Paper", icon: FileText },
  { id: "starred", label: "Berbintang", icon: Star },
  { id: "archived", label: "Diarsipkan", icon: Archive }
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Vault({ initialDocuments = [], userEmail, loadError }: { initialDocuments?: Document[] | null; userEmail?: string; loadError?: string }) {
  const router = useRouter();
  const [allDocuments, setAllDocuments] = useState<Document[]>(() => Array.isArray(initialDocuments) ? initialDocuments : []);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setUploadOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const documents = useMemo(() => (Array.isArray(allDocuments) ? allDocuments : []).filter((document) => {
    if (filter === "all") return document.status !== "archived";
    if (filter === "starred") return document.status === "starred";
    if (filter === "archived") return document.status === "archived";
    return document.type === filter && document.status !== "archived";
  }), [allDocuments, filter]);

  async function updateDocument(id: string, status: Document["status"]) {
    setPendingDocumentId(id);
    setActionError(null);
    try {
      const response = await fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setActionError(result?.error || "Status bacaan tidak dapat diubah. Coba lagi.");
        return;
      }
      setAllDocuments((items) => (Array.isArray(items) ? items : []).map((item) => item.id === id ? { ...item, status } : item));
      if (status === "archived") setSuccessMessage("Bacaan dipindahkan ke arsip.");
      if (filter === "archived" && status === "unread") setSuccessMessage("Bacaan dipulihkan ke Semua bacaan.");
      router.refresh();
    } finally {
      setPendingDocumentId(null);
    }
  }

  async function deleteDocument(id: string) {
    if (!window.confirm("Hapus bacaan ini beserta berkas tersimpannya?")) return;
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setAllDocuments((items) => (Array.isArray(items) ? items : []).filter((item) => item.id !== id));
    router.refresh();
  }

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("verso-theme", next);
  };

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setActionError(null);
    const supabase = createBrowserClient();

    if (!supabase) {
      setActionError("Sesi belum dapat ditutup. Muat ulang halaman lalu coba lagi.");
      setLoggingOut(false);
      return;
    }

    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      setActionError("Sesi belum dapat ditutup. Coba lagi.");
      setLoggingOut(false);
      return;
    }

    window.location.replace("/login");
  }

  async function handleSaved() {
    setUploadOpen(false);
    setSuccessMessage("Bacaan berhasil disimpan.");
    const supabase = createBrowserClient();
    if (supabase) {
      const { data } = await supabase
        .from("documents")
        .select("id,type,status,title,author,site_name,source_url,excerpt,reading_time_minutes,page_count,cover_image_path,created_at")
        .order("created_at", { ascending: false });
      if (data) setAllDocuments(await withSignedCoverUrls(supabase, data));
    }
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label="Navigasi utama">
        <div className="wordmark"><span aria-hidden="true">V</span><strong>Verso</strong></div>
        <nav className="nav-list">
          {filters.map(({ id, label, icon: Icon }) => (
            <button key={id} className={filter === id ? "nav-item active" : "nav-item"} onClick={() => { setFilter(id); setMenuOpen(false); }}>
              <Icon size={18} strokeWidth={1.5} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {userEmail && <p className="account-email" title={userEmail}>{userEmail}</p>}
          <button className="nav-item" onClick={() => setUploadOpen(true)}><Upload size={18} strokeWidth={1.5} /><span>Tambahkan bacaan</span></button>
          <button className="nav-item theme-toggle" onClick={toggleTheme} aria-label="Ubah tema warna">
            <Moon className="theme-light-control" size={18} strokeWidth={1.5} /><Sun className="theme-dark-control" size={18} strokeWidth={1.5} />
            <span className="theme-light-control">Mode gelap</span><span className="theme-dark-control">Mode terang</span>
          </button>
          <button className="nav-item" type="button" onClick={handleLogout} disabled={loggingOut} aria-busy={loggingOut}>
            <LogOut size={18} strokeWidth={1.5} /><span>{loggingOut ? "Sedang keluar…" : "Keluar"}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
            <Menu size={19} strokeWidth={1.5} /><span>Menu</span>
          </button>
          <button className="search-trigger" onClick={() => setSearchOpen(true)}>
            <Search size={18} strokeWidth={1.5} /><span>Cari judul, penulis, atau isi…</span><kbd>⌘ K</kbd>
          </button>
          <button className="icon-button mobile-theme theme-toggle" onClick={toggleTheme} aria-label="Ubah tema warna">
            <Moon className="theme-light-control" size={19} strokeWidth={1.5} /><Sun className="theme-dark-control" size={19} strokeWidth={1.5} />
          </button>
        </header>

        <section className="page-heading">
          <div><p className="eyebrow">Arsip pribadi</p><h1>{filters.find((item) => item.id === filter)?.label}</h1></div>
          <button className="primary-button" onClick={() => setUploadOpen(true)}><Plus size={18} strokeWidth={1.5} />Simpan bacaan</button>
        </section>

        <div className="rule"><span>{documents.length} tersimpan</span><span>Terbaru dahulu</span></div>

        {(loadError || actionError) && <p className="load-error" role="alert">{actionError || "Arsip belum dapat dimuat. Coba segarkan halaman."}</p>}

        {documents.length ? (
          <motion.section className="document-grid" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
            {documents.map((document) => <DocumentCard key={document.id} document={document} busy={pendingDocumentId === document.id} onStatus={updateDocument} onDelete={deleteDocument} />)}
          </motion.section>
        ) : (
          <EmptyState archived={filter === "archived"} onAdd={() => setUploadOpen(true)} />
        )}
      </main>

      <AnimatePresence>
        {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
        {uploadOpen && <AddDialog onClose={() => setUploadOpen(false)} onSaved={handleSaved} />}
        {successMessage && (
          <motion.div
            className="success-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease }}
          >
            <CheckCircle2 size={19} strokeWidth={1.5} aria-hidden="true" />
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} aria-label="Tutup pesan"><X size={17} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocumentCard({ document, busy, onStatus, onDelete }: { document: Document; busy: boolean; onStatus: (id: string, status: Document["status"]) => void; onDelete: (id: string) => void }) {
  const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(document.created_at));
  return (
    <motion.article className="document-card" variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease } } }} whileHover={{ y: -2 }}>
      {document.cover_url ? <div className="card-cover"><Image src={document.cover_url} alt="" width={640} height={360} unoptimized /></div> : <div className="card-index" aria-hidden="true">{document.type === "article" ? "Aa" : "§"}</div>}
      <div className="card-meta"><span>{document.type === "article" ? "ARTICLE" : "PDF"}</span><span>{date}</span></div>
      <h2>{document.title}</h2>
      <p className="byline">{document.author}{document.site_name ? ` · ${document.site_name}` : ""}</p>
      <p className="excerpt">{document.excerpt}</p>
      <div className="card-footer">
        <span>{document.page_count ? `${document.page_count} halaman` : `${document.reading_time_minutes} menit baca`}</span>
        <span className={`status status-${document.status}`}>{statusLabel(document.status)}</span>
        <div className="card-actions">
          {document.status === "archived" ? (
            <button disabled={busy} onClick={() => onStatus(document.id, "unread")} aria-label="Pulihkan bacaan"><ArchiveRestore size={16} /></button>
          ) : (
            <>
              <button disabled={busy} onClick={() => onStatus(document.id, document.status === "starred" ? "unread" : "starred")} aria-label={document.status === "starred" ? "Hapus tanda bintang" : "Tandai berbintang"}><Star size={16} fill={document.status === "starred" ? "currentColor" : "none"} /></button>
              <button disabled={busy} onClick={() => onStatus(document.id, "archived")} aria-label="Arsipkan"><Archive size={16} /></button>
            </>
          )}
          <button disabled={busy} onClick={() => onDelete(document.id)} aria-label="Hapus"><Trash2 size={16} /></button>
          <Link href={`/read/${document.id}`} aria-label={`Buka ${document.title}`}><ChevronRight size={18} strokeWidth={1.5} /></Link>
        </div>
      </div>
    </motion.article>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!query.trim()) { setResults([]); setSearching(false); setSearchError(false); return; }
      setSearching(true);
      setSearchError(false);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Pencarian gagal");
        setResults(await response.json());
        setSelectedIndex(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") { setResults([]); setSearchError(true); }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    document.getElementById(`search-result-${selectedIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!query.trim() || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % results.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + results.length) % results.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[selectedIndex];
      if (selected) { onClose(); router.push(`/read/${selected.id}`); }
    }
  }

  return (
    <motion.div className="dialog-backdrop" onMouseDown={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <motion.div className="search-dialog" role="dialog" aria-modal="true" aria-label="Cari arsip" onKeyDown={handleKeyDown} onMouseDown={(event) => event.stopPropagation()} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25, ease }}>
        <div className="dialog-search"><Search size={20} strokeWidth={1.5} /><input autoFocus role="combobox" aria-controls="search-results" aria-expanded={Boolean(query.trim())} aria-activedescendant={results.length ? `search-result-${selectedIndex}` : undefined} value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setResults([]); setSelectedIndex(0); setSearchError(false); setSearching(Boolean(value.trim())); }} placeholder="Cari di seluruh arsip…" /><button onClick={onClose} aria-label="Tutup pencarian"><X size={18} /></button></div>
        <div className="search-results" id="search-results" role="listbox" aria-label="Hasil pencarian" aria-busy={searching}>
          {!query.trim() ? <p className="search-hint">Mulai dengan judul, nama penulis, atau frasa yang kamu ingat.</p> : searching ? <p className="search-hint">Mencari di seluruh isi bacaan…</p> : searchError ? <p className="search-hint" role="alert">Pencarian belum dapat dijalankan. Coba lagi.</p> : results.length ? results.map((item, index) => (
            <Link id={`search-result-${index}`} role="option" aria-selected={selectedIndex === index} className={selectedIndex === index ? "search-result selected" : "search-result"} href={`/read/${item.id}`} key={item.id} onMouseEnter={() => setSelectedIndex(index)} onClick={onClose}><span className="result-icon">{item.type === "article" ? <BookOpen size={18} /> : <FileText size={18} />}</span><span><strong><HighlightedText value={item.highlighted_title || item.title} /></strong><small><HighlightedText value={item.headline || item.excerpt || ""} /></small></span><ChevronRight size={17} /></Link>
          )) : <p className="search-hint">Tidak ada bacaan yang cocok. Coba kata yang lebih pendek.</p>}
        </div>
        <footer className="dialog-footer"><span>↑↓ untuk memilih · Enter untuk membuka</span><span>Esc untuk menutup</span></footer>
      </motion.div>
    </motion.div>
  );
}

function HighlightedText({ value }: { value: string }) {
  return <>{value.split(/(<b>[\s\S]*?<\/b>)/gi).map((part, index) => part.toLowerCase().startsWith("<b>")
    ? <b key={index}>{part.slice(3, -4)}</b>
    : part
  )}</>;
}

function AddDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<"url" | "pdf">("url");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);

  async function saveUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const response = await fetch("/api/archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setError(result.error || "Tautan tidak dapat disimpan"); return; }
    onSaved();
  }

  function selectPdf(file?: File) {
    setError(null);
    if (!file) { setSelectedPdf(null); return; }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setSelectedPdf(null);
      setError("Pilih berkas PDF yang valid");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setSelectedPdf(null);
      setError("PDF maksimal 50 MB");
      return;
    }
    setSelectedPdf(file);
  }

  async function uploadPdf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPdf) { setError("Pilih PDF sebelum menyimpan"); return; }
    setBusy(true); setError(null);
    const supabase = createBrowserClient();
    if (!supabase) {
      setBusy(false);
      setError("Konfigurasi Supabase belum tersedia");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setBusy(false);
      setError("Sesi sudah berakhir. Masuk kembali.");
      return;
    }

    const documentId = crypto.randomUUID();
    const storagePath = `${userData.user.id}/${documentId}/original.pdf`;
    const { error: uploadError } = await supabase.storage.from("raw-documents").upload(storagePath, selectedPdf, {
      contentType: "application/pdf",
      upsert: false
    });
    if (uploadError) {
      setBusy(false);
      setError(uploadError.message || "PDF tidak dapat diunggah");
      return;
    }

    const response = await fetch("/api/upload-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, fileName: selectedPdf.name, fileSize: selectedPdf.size })
    });
    const result = await response.json();
    if (!response.ok) {
      await supabase.storage.from("raw-documents").remove([storagePath]);
      setBusy(false);
      setError(result.error || "PDF tidak dapat diproses");
      return;
    }
    setBusy(false);
    onSaved();
  }
  return (
    <motion.div className="dialog-backdrop" onMouseDown={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="add-dialog" role="dialog" aria-modal="true" aria-labelledby="add-title" onMouseDown={(event) => event.stopPropagation()} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
        <div className="dialog-title"><div><p className="eyebrow">Tambahkan ke arsip</p><h2 id="add-title">Simpan bacaan</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={19} /></button></div>
        <div className="tab-list" role="tablist"><button type="button" role="tab" aria-selected={tab === "url"} className={tab === "url" ? "active" : ""} onClick={() => setTab("url")}>Tautan</button><button type="button" role="tab" aria-selected={tab === "pdf"} className={tab === "pdf" ? "active" : ""} onClick={() => setTab("pdf")}>Unggah PDF</button></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {tab === "url" ? <form onSubmit={saveUrl} className="url-form"><label htmlFor="source-url">Alamat artikel atau paper</label><input id="source-url" name="url" type="url" required placeholder="https://…" disabled={busy} value={url} onChange={(event) => { setUrl(event.target.value); setError(null); }} /><p>Verso akan mengambil teks yang bisa dibaca dan menyimpan salinannya.</p><button className="primary-button" type="submit" disabled={busy || !url.trim()}>{busy ? "Sedang menyimpan…" : "Simpan tautan"}</button></form> : (
          <form className="pdf-form" onSubmit={uploadPdf}>
            <div className={`dropzone ${selectedPdf ? "has-file" : ""}`}>
              {selectedPdf ? <FileText size={26} strokeWidth={1.5} /> : <Upload size={26} strokeWidth={1.5} />}
              <strong>{selectedPdf?.name ?? "Letakkan PDF di sini"}</strong>
              <span>{selectedPdf ? `${(selectedPdf.size / 1024 / 1024).toFixed(1)} MB · klik untuk mengganti` : "atau pilih berkas, maksimal 50 MB"}</span>
              <input aria-label={selectedPdf ? "Ganti PDF" : "Pilih PDF"} type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => selectPdf(event.target.files?.[0])} />
            </div>
            <button className="primary-button" type="submit" disabled={busy || !selectedPdf}>{busy ? "Sedang memproses PDF…" : "Simpan PDF"}</button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function EmptyState({ archived, onAdd }: { archived: boolean; onAdd: () => void }) {
  if (archived) {
    return <section className="empty-state"><div className="empty-mark"><Archive size={32} strokeWidth={1.25} /></div><h2>Belum ada bacaan diarsipkan</h2><p>Bacaan yang kamu arsipkan akan tetap tersimpan dan dapat dipulihkan dari sini.</p></section>;
  }
  return <section className="empty-state"><div className="empty-mark"><Archive size={32} strokeWidth={1.25} /></div><h2>Rak ini masih kosong</h2><p>Simpan satu artikel atau paper. Teksnya akan ikut masuk ke pencarian.</p><button className="primary-button" onClick={onAdd}>Simpan bacaan pertama</button></section>;
}

function statusLabel(status: Document["status"]) {
  return { unread: "Belum dibaca", read: "Sudah dibaca", starred: "Berbintang", archived: "Diarsipkan" }[status];
}
