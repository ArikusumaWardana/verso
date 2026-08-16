"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive, BookOpen, ChevronRight, FileText, Library, Menu, Moon, Plus,
  LogOut, Search, Star, Sun, Trash2, Upload, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Document, DocumentType } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

type Filter = "all" | DocumentType | "starred";

const filters: { id: Filter; label: string; icon: typeof Library }[] = [
  { id: "all", label: "Semua bacaan", icon: Library },
  { id: "article", label: "Artikel", icon: BookOpen },
  { id: "pdf", label: "Paper", icon: FileText },
  { id: "starred", label: "Berbintang", icon: Star }
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Vault({ initialDocuments = [], userEmail, loadError }: { initialDocuments?: Document[] | null; userEmail?: string; loadError?: string }) {
  const router = useRouter();
  const [allDocuments, setAllDocuments] = useState<Document[]>(() => Array.isArray(initialDocuments) ? initialDocuments : []);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    return document.type === filter && document.status !== "archived";
  }), [allDocuments, filter]);

  async function updateDocument(id: string, status: Document["status"]) {
    const response = await fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) return;
    setAllDocuments((items) => (Array.isArray(items) ? items : []).map((item) => item.id === id ? { ...item, status } : item));
    router.refresh();
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
          <form action={logout}><button className="nav-item" type="submit"><LogOut size={18} strokeWidth={1.5} /><span>Keluar</span></button></form>
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

        {loadError && <p className="load-error" role="alert">Arsip belum dapat dimuat. Coba segarkan halaman.</p>}

        {documents.length ? (
          <motion.section className="document-grid" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
            {documents.map((document) => <DocumentCard key={document.id} document={document} onStatus={updateDocument} onDelete={deleteDocument} />)}
          </motion.section>
        ) : (
          <EmptyState onAdd={() => setUploadOpen(true)} />
        )}
      </main>

      <AnimatePresence>
        {searchOpen && <SearchDialog documents={allDocuments} onClose={() => setSearchOpen(false)} />}
        {uploadOpen && <AddDialog onClose={() => setUploadOpen(false)} onSaved={() => window.location.reload()} />}
      </AnimatePresence>
    </div>
  );
}

function DocumentCard({ document, onStatus, onDelete }: { document: Document; onStatus: (id: string, status: Document["status"]) => void; onDelete: (id: string) => void }) {
  const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(document.created_at));
  return (
    <motion.article className="document-card" variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease } } }} whileHover={{ y: -2 }}>
      <div className="card-index" aria-hidden="true">{document.type === "article" ? "Aa" : "§"}</div>
      <div className="card-meta"><span>{document.type === "article" ? "ARTICLE" : "PDF"}</span><span>{date}</span></div>
      <h2>{document.title}</h2>
      <p className="byline">{document.author}{document.site_name ? ` · ${document.site_name}` : ""}</p>
      <p className="excerpt">{document.excerpt}</p>
      <div className="card-footer">
        <span>{document.page_count ? `${document.page_count} halaman` : `${document.reading_time_minutes} menit baca`}</span>
        <span className={`status status-${document.status}`}>{statusLabel(document.status)}</span>
        <div className="card-actions">
          <button onClick={() => onStatus(document.id, document.status === "starred" ? "unread" : "starred")} aria-label={document.status === "starred" ? "Hapus tanda bintang" : "Tandai berbintang"}><Star size={16} fill={document.status === "starred" ? "currentColor" : "none"} /></button>
          <button onClick={() => onStatus(document.id, "archived")} aria-label="Arsipkan"><Archive size={16} /></button>
          <button onClick={() => onDelete(document.id)} aria-label="Hapus"><Trash2 size={16} /></button>
          <Link href={`/read/${document.id}`} aria-label={`Buka ${document.title}`}><ChevronRight size={18} strokeWidth={1.5} /></Link>
        </div>
      </div>
    </motion.article>
  );
}

function SearchDialog({ documents, onClose }: { documents: Document[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Document[]>(() => Array.isArray(documents) ? documents : []);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!query.trim()) { setResults(Array.isArray(documents) ? documents : []); return; }
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) setResults(await response.json());
    }, 180);
    return () => window.clearTimeout(timer);
  }, [documents, query]);
  return (
    <motion.div className="dialog-backdrop" onMouseDown={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <motion.div className="search-dialog" role="dialog" aria-modal="true" aria-label="Cari arsip" onMouseDown={(event) => event.stopPropagation()} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25, ease }}>
        <div className="dialog-search"><Search size={20} strokeWidth={1.5} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari di seluruh arsip…" /><button onClick={onClose} aria-label="Tutup pencarian"><X size={18} /></button></div>
        <div className="search-results">
          {!query ? <p className="search-hint">Mulai dengan judul, nama penulis, atau frasa yang kamu ingat.</p> : results.length ? results.map((item) => (
            <Link className="search-result" href={`/read/${item.id}`} key={item.id}><span className="result-icon">{item.type === "article" ? <BookOpen size={18} /> : <FileText size={18} />}</span><span><strong>{item.title}</strong><small>{item.excerpt}</small></span><ChevronRight size={17} /></Link>
          )) : <p className="search-hint">Tidak ada bacaan yang cocok. Coba kata yang lebih pendek.</p>}
        </div>
        <footer className="dialog-footer"><span>Enter untuk membuka</span><span>Esc untuk menutup</span></footer>
      </motion.div>
    </motion.div>
  );
}

function AddDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<"url" | "pdf">("url");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);

  async function saveUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: data.get("url") }) });
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
        {tab === "url" ? <form onSubmit={saveUrl} className="url-form"><label htmlFor="source-url">Alamat artikel atau paper</label><input id="source-url" name="url" type="url" required placeholder="https://…" disabled={busy} /><p>Verso akan mengambil teks yang bisa dibaca dan menyimpan salinannya.</p><button className="primary-button" type="submit" disabled={busy}>{busy ? "Sedang menyimpan…" : "Simpan tautan"}</button></form> : (
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <section className="empty-state"><div className="empty-mark"><Archive size={32} strokeWidth={1.25} /></div><h2>Rak ini masih kosong</h2><p>Simpan satu artikel atau paper. Teksnya akan ikut masuk ke pencarian.</p><button className="primary-button" onClick={onAdd}>Simpan bacaan pertama</button></section>;
}

function statusLabel(status: Document["status"]) {
  return { unread: "Belum dibaca", read: "Sudah dibaca", starred: "Berbintang", archived: "Diarsipkan" }[status];
}
