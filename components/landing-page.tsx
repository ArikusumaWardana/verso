"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown, BookOpen, Check, ChevronDown, Chrome, ExternalLink, FileSearch, FileText, Github, Search, Upload
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.4, ease }
};

const faqs = [
  ["Apakah Verso menyimpan artikel di balik paywall?", "Verso hanya dapat menyimpan konten yang bisa diakses oleh proses pengarsipan. Situs dengan login, paywall ketat, atau perlindungan bot mungkin tidak dapat diekstrak utuh."],
  ["Bagaimana dengan PDF hasil scan?", "Versi saat ini membaca PDF yang teksnya dapat dipilih. PDF berbasis gambar membutuhkan OCR dan belum didukung."],
  ["Apakah data saya privat?", "Ya. Dokumen dan berkas berada di bucket privat Supabase. Row Level Security membatasi setiap data ke pemilik akunnya."],
  ["Bisakah saya menjalankannya sendiri?", "Bisa. Verso dibangun dengan Next.js dan Supabase, serta menyertakan migration dan panduan instalasi di repository."],
] as const;

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();
  const revealMotion = reduceMotion ? {
    initial: { opacity: 1, y: 0 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0 }
  } : reveal;

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <main className="landing-page">
      <motion.nav className={`landing-nav ${scrolled ? "landing-nav-scrolled" : ""}`} aria-label="Navigasi landing page" initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.25, ease }}>
        <Link className="landing-logo" href="/">Verso</Link>
        <div className="landing-nav-links">
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#fitur">Fitur</a>
          <a href="https://github.com/ArikusumaWardana/verso" target="_blank" rel="noreferrer">GitHub</a>
          <Link className="landing-login" href="/login">Masuk</Link>
        </div>
      </motion.nav>

      <section className="landing-hero">
        <motion.div className="landing-hero-copy" initial={reduceMotion ? false : "hidden"} animate="show" variants={{ show: { transition: { staggerChildren: reduceMotion ? 0 : 0.05 } } }}>
          <motion.p className="eyebrow" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease } } }}>Arsip artikel & paper</motion.p>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease } } }}>Semua yang kamu baca, tetap ada.</motion.h1>
          <motion.p className="landing-lead" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease } } }}>Verso menyimpan artikel dan paper PDF di satu tempat, lalu membuatnya bisa dicari sampai ke isi paragrafnya dalam hitungan milidetik.</motion.p>
          <motion.div className="landing-hero-actions" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease } } }}>
            <Link className="primary-button" href="/login">Mulai simpan arsipmu</Link>
            <a href="#cara-kerja">Lihat cara kerjanya <ArrowDown size={15} /></a>
          </motion.div>
        </motion.div>
        <motion.div className="reader-preview" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.25, ease }} whileHover={reduceMotion ? undefined : { y: -2, rotate: 0.5 }} aria-label="Cuplikan reader artikel Verso">
          <motion.div className="preview-progress" initial={reduceMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.45, ease }} />
          <span className="preview-label">AEON · 12 MENIT BACA</span>
          <h2>The quiet architecture of attention</h2>
          <p>What we choose to keep shapes what we are able to remember. A personal archive makes that choice deliberate.</p>
          <p>Reading becomes more useful when a half-remembered sentence can lead us back to its source.</p>
        </motion.div>
      </section>

      <section className="landing-section problem-section" aria-labelledby="problem-title">
        <motion.div className="problem-heading" {...revealMotion}>
          <p className="section-kicker">Masalah yang sebenarnya</p>
          <h2 className="section-title" id="problem-title">Menyimpan itu mudah. Menemukan kembali yang sulit.</h2>
          <p className="problem-intro">Bacaan tidak benar-benar tersimpan jika kamu lupa letaknya atau sumber aslinya sudah hilang.</p>
        </motion.div>
        <div className="problem-list">
          {[
            ["Tab", "Tab menumpuk sampai puluhan, dan kamu tahu tidak akan pernah dibaca ulang."],
            ["PDF", "Paper tersimpan di folder Downloads, tanpa cara mencari isinya."],
            ["Tautan", "Bookmark yang kamu simpan tahun lalu sekarang membuka halaman 404."]
          ].map(([label, text], index) => <motion.article className="problem-row" key={label} {...revealMotion} transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.07, ease }}><span className="problem-number">0{index + 1}</span><div><small>{label}</small><p>{text}</p></div></motion.article>)}
        </div>
      </section>

      <section className="landing-section" id="cara-kerja">
        <motion.p className="section-kicker" {...revealMotion}>Dari tab ke arsip</motion.p>
        <motion.h2 className="section-title" {...revealMotion}>Cara kerjanya</motion.h2>
        <div className="steps-grid">
          {[
            [Upload, "01", "Simpan", "Klik ikon Verso di Chrome, tempel tautan, atau unggah PDF dari dashboard."],
            [FileText, "02", "Diproses", "Artikel dibersihkan, gambar dikompresi, dan teks paper diekstrak di belakang layar."],
            [FileSearch, "03", "Cari & baca", "Tekan Cmd+K untuk menemukan kalimat spesifik, lalu baca dalam mode yang bersih."]
          ].map(([Icon, number, title, body], index) => {
            const StepIcon = Icon as typeof Upload;
            return <motion.article className="landing-step" key={String(number)} {...revealMotion} transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.08, ease }} whileHover={reduceMotion ? undefined : { y: -2 }}><StepIcon size={24} strokeWidth={1.5} /><span>{String(number)}</span><h3>{String(title)}</h3><p>{String(body)}</p></motion.article>;
          })}
        </div>
      </section>

      <section className="landing-section feature-section" id="fitur">
        <motion.div className="feature-copy" {...revealMotion}>
          <p className="section-kicker">Pencarian</p>
          <h2 className="section-title">Cari sampai ke isi paragrafnya</h2>
          <p>PostgreSQL full-text search mengindeks judul, penulis, dan seluruh isi dokumen. Hasil menampilkan cuplikan kalimat yang cocok, dengan kecocokan judul diberi peringkat lebih tinggi.</p>
        </motion.div>
        <motion.div className="search-preview" {...revealMotion} aria-label="Cuplikan pencarian Verso">
          <div className="search-preview-input"><Search size={18} /><span>arsitektur perhatian</span><kbd>⌘ K</kbd></div>
          <motion.div className="search-preview-result" initial={reduceMotion ? false : { opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.12, ease }}><BookOpen size={20} /><div><strong>The quiet architecture of attention</strong><p>…membentuk <b>arsitektur perhatian</b> yang menentukan apa yang kita ingat…</p></div></motion.div>
          <motion.div className="search-preview-result" initial={reduceMotion ? false : { opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.18, ease }}><FileText size={20} /><div><strong>Attention and long-term memory</strong><p>…sebuah model untuk memahami perhatian dan proses penyimpanan…</p></div></motion.div>
        </motion.div>
      </section>

      <section className="landing-section reader-feature">
        <p className="section-kicker">Membaca</p>
        <h2 className="section-title">Satu mode baca untuk artikel, satu lagi untuk paper aslinya</h2>
        <div className="reader-cards">
          <motion.article {...revealMotion} whileHover={reduceMotion ? undefined : { y: -2 }}><div className="mini-article"><span>ARTIKEL · 08 MENIT</span><strong>Membaca tanpa halaman yang berisik</strong><i /><i /><i /></div><h3>Artikel</h3><p>Teks bersih, tanpa iklan dan sidebar. Progress bar mengikuti seberapa jauh kamu membaca.</p></motion.article>
          <motion.article {...revealMotion} transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.08, ease }} whileHover={reduceMotion ? undefined : { y: -2 }}><div className="mini-pdf"><div><span>PDF asli</span><span>Teks ekstraksi</span></div><strong>14</strong><i /><i /><i /><small>14 / 14</small></div><h3>PDF</h3><p>Beralih antara teks hasil ekstraksi atau layout asli jurnal, lengkap dengan halaman dan gambarnya.</p></motion.article>
        </div>
      </section>

      <section className="landing-section feature-section extension-section">
        <motion.div className="feature-copy" {...revealMotion}><p className="section-kicker">Ekstensi & handphone</p><h2 className="section-title">Simpan dari browser yang sedang dipakai</h2><p>Di desktop, klik ikon Verso pada toolbar. Di Android, bagikan halaman ke Verso lalu konfirmasi tautannya. Keduanya memakai pipeline arsip yang sama.</p><small>Manifest V3 · Web Share Target</small></motion.div>
        <motion.div className="extension-preview" {...revealMotion} whileHover={reduceMotion ? undefined : { y: -2 }}><div className="extension-head"><Chrome size={19} /><span>Verso</span></div><p>Simpan halaman ini ke arsip bacaanmu.</p><div className="extension-page">aeon.co · The quiet architecture…</div><motion.button type="button" whileTap={reduceMotion ? undefined : { y: 1 }}><Check size={17} /> Simpan tab ini</motion.button></motion.div>
      </section>

      <section className="landing-section dashboard-section">
        <p className="section-kicker">Arsipmu</p><h2 className="section-title">Satu rak untuk semua bacaan</h2>
        <motion.div className="dashboard-preview" {...revealMotion}>
          <aside><strong>Verso</strong><span>Semua bacaan</span><span>Artikel</span><span>Paper</span><span>Berbintang</span></aside>
          <div><div className="dashboard-preview-head"><span>Semua bacaan</span><span>⌘ K</span></div><div className="preview-card-grid">{["The quiet architecture of attention", "A field guide to memory", "Designing for long-form reading"].map((title, index) => <motion.article key={title} initial={reduceMotion ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : index * 0.05, ease }} whileHover={reduceMotion ? undefined : { y: -2 }}><small>{index === 1 ? "PDF" : "ARTICLE"}</small><b>{title}</b><p>Catatan dan cuplikan bacaan tersimpan di sini.</p></motion.article>)}</div></div>
        </motion.div>
        <p className="dashboard-caption">Tampilan langsung antarmuka Verso.</p>
      </section>

      <section className="landing-section faq-section">
        <motion.div className="faq-heading" {...revealMotion}>
          <p className="section-kicker">Pertanyaan umum</p>
          <h2 className="section-title">Sebelum mulai</h2>
          <p>Hal penting tentang ekstraksi, privasi data, dan cara menjalankan Verso.</p>
        </motion.div>
        <motion.div className="faq-list" {...revealMotion}>
          {faqs.map(([question, answer], index) => {
            const expanded = openFaq === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div className={`faq-item ${expanded ? "faq-item-open" : ""}`} key={question}>
                <button type="button" onClick={() => setOpenFaq(expanded ? null : index)} aria-expanded={expanded} aria-controls={panelId}>
                  <span><small>0{index + 1}</small>{question}</span>
                  <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.2, ease }} aria-hidden="true"><ChevronDown size={19} strokeWidth={1.5} /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div id={panelId} className="faq-answer" role="region" aria-label={question} initial={reduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ height: { duration: reduceMotion ? 0 : 0.3, ease }, opacity: { duration: reduceMotion ? 0 : 0.2 } }}>
                      <p>{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </section>

      <motion.section className="landing-cta" initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: reduceMotion ? 0 : 0.4, ease }}><motion.h2 initial={reduceMotion ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.4, ease }}>Arsipmu, dicari dalam sekejap.</motion.h2><motion.div whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { y: 1 }}><Link className="primary-button" href="/login">Mulai simpan arsipmu</Link></motion.div></motion.section>
      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand"><Link className="landing-logo" href="/">Verso</Link><p>Arsip pribadi untuk artikel dan paper yang ingin kamu temukan kembali.</p></div>
          <nav className="footer-links" aria-label="Navigasi footer"><strong>Jelajahi</strong><a href="#cara-kerja">Cara kerja</a><a href="#fitur">Fitur</a><Link href="/login">Masuk</Link></nav>
          <div className="footer-project"><strong>Proyek</strong><a href="https://github.com/ArikusumaWardana/verso" target="_blank" rel="noreferrer"><Github size={16} />Kode sumber<ExternalLink size={13} /></a><span>Next.js · Supabase</span><span>Data privat, siap self-host.</span></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Verso</span><span>Dibuat untuk membaca, bukan menambah kebisingan.</span></div>
      </footer>
    </main>
  );
}
