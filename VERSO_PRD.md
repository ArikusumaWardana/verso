# PRD — Verso
### Universal Web & Paper Knowledge Vault

| | |
|---|---|
| **Status** | Draft v1.0 |
| **Owner** | — |
| **Tanggal** | 16 Agustus 2026 |
| **Nama produk** | Verso |

> **Kenapa "Verso"?** Verso adalah istilah tipografi/percetakan untuk halaman sebelah kiri (halaman "belakang") pada buku atau manuskrip — lawan dari *recto*. Namanya pendek, punya akar literer yang pas untuk arsip artikel & jurnal, dan tidak terdengar seperti nama produk SaaS generik.

---

## 1. Ringkasan Eksekutif

Verso adalah aplikasi web personal (self-hosted / serverless) yang berfungsi sebagai **arsip permanen** sekaligus **mesin pencari teks lengkap (full-text search)** untuk dua jenis sumber pengetahuan: artikel web dan dokumen jurnal ilmiah (PDF).

Masalah yang diselesaikan: tab browser yang menumpuk, bookmark yang mati (link rot), dan PDF jurnal yang tersebar di banyak folder tanpa cara mencari isinya secara instan. Verso menyatukan semuanya dalam satu vault yang bisa dicari dalam hitungan milidetik, dengan proses penyimpanan yang secepat satu klik dari browser.

## 2. Latar Belakang & Masalah

- Artikel web yang dibaca sering hilang karena paywall berubah, situs redesign, atau link mati.
- PDF jurnal yang diunduh menumpuk di folder "Downloads" tanpa struktur, tanpa indeks, dan sulit dicari isinya.
- Tidak ada satu tempat yang memperlakukan artikel web dan paper akademik dengan cara yang sama: disimpan, dibersihkan dari noise (iklan/sidebar), dan bisa dicari full-text.
- Alat existing (Pocket, Instapaper, Zotero, Notion) masing-masing hanya menutupi separuh masalah — reading list *atau* reference manager, jarang keduanya sekaligus dengan full-text search yang cepat.

## 3. Tujuan Produk

1. Menyediakan **satu vault tunggal** untuk artikel web dan paper PDF, tersimpan permanen di storage milik sendiri (Supabase).
2. Proses penyimpanan **satu klik** dari tab aktif browser, tanpa perlu membuka dashboard.
3. Pencarian **instan** (Cmd+K) ke seluruh isi teks dokumen, bukan hanya judul.
4. Pengalaman membaca yang bersih dan nyaman untuk kedua tipe konten (reader mode khusus artikel, PDF viewer khusus jurnal).
5. Sistem ringan, murah dijalankan (serverless), dan cepat dikembangkan solo/small-team.

### Non-tujuan (Out of Scope v1)
- Kolaborasi multi-user / sharing publik.
- Anotasi/highlight kolaboratif real-time.
- Sinkronisasi mobile native app (cukup responsive web).
- OCR untuk PDF hasil scan gambar (v1 asumsikan PDF berbasis teks/selectable).
- Integrasi citation manager (BibTeX, Zotero export) — dipertimbangkan untuk v2.

## 4. Target Pengguna & Persona

**Persona utama: "The Independent Researcher / Power Reader"**
- Peneliti, penulis, developer, mahasiswa pascasarjana, atau siapa pun yang rutin membaca 10–30 artikel/paper per minggu.
- Terbiasa dengan tools teknis (nyaman self-host, tidak takut Chrome Extension).
- Butuh recall cepat: "artikel yang saya baca soal X bulan lalu itu apa judulnya?"

## 5. Fitur Utama

### 5.1 Dual-Source Ingestion
| Sumber | Perlakuan |
|---|---|
| Artikel web (HTML) | Ekstraksi teks bersih bebas iklan via `@mozilla/readability` + `jsdom` |
| File PDF diunggah langsung | Disimpan mentah + ekstraksi teks via `pdf-parse` |
| Link langsung `.pdf` (mis. arXiv) | Diunduh otomatis, diperlakukan sebagai PDF |
| Landing page jurnal akademik | Deteksi otomatis meta tag `citation_pdf_url` → unduh PDF asli → ekstraksi teks |

### 5.2 Chrome Extension (Manifest V3)
- Tombol "Simpan" pada toolbar untuk menyimpan tab aktif langsung ke Verso tanpa membuka dashboard.
- Feedback visual instan (toast sukses/gagal) di dalam popup extension.
- Autentikasi tersambung ke sesi akun Verso pengguna.

### 5.3 Selective Image Archiving & Compression
- Hanya gambar di dalam kontainer artikel hasil filter Readability yang diproses (bukan iklan/tracker/ikon sidebar).
- Kompresi via `sharp`: resize maks. 1200px, konversi ke WebP, quality 75.
- Upload ke Supabase Storage bucket `article-images`, lalu `src` di HTML artikel diganti ke URL storage baru.

### 5.4 Instant Full-Text Search (Cmd+K)
- Command palette (`cmdk`) dengan pencarian real-time.
- Backend: PostgreSQL `tsvector` + GIN index di Supabase — pencarian leksikal di seluruh isi paragraf artikel maupun jurnal.
- Menampilkan cuplikan (snippet) hasil pencarian dengan kata kunci di-highlight.

### 5.5 Dual Reader Mode
- **Artikel web**: tampilan distraction-free, tipografi rapi (`@tailwindcss/typography`), progress bar baca, gambar lokal terkompresi.
- **Jurnal PDF**: toggle antara ringkasan teks hasil ekstraksi ↔ Embedded PDF Viewer interaktif untuk membaca layout asli.

### 5.6 Manajemen Dokumen
- Status: Unread / Read / Starred.
- Aksi: Favorite, Archive, Delete.
- Filter per tipe: Semua / Artikel / Jurnal.
- Estimasi waktu baca (dihitung dari word count artikel; untuk PDF dari jumlah halaman/kata hasil ekstraksi).

### 5.7 Micro-interactions (Framer Motion)
- Animasi transisi antar halaman.
- Staggered entrance pada grid kartu dokumen.
- Animasi modal command palette (scale + fade).
- Feedback animasi saat data berhasil disimpan (mis. tab dari extension → toast).
- Hover lift pada kartu dokumen.

## 6. Alur Kerja Sistem

```
[1. Pemicu Input]
  ├── A. Chrome Extension (klik "Simpan" pada tab aktif)
  ├── B. Input manual URL (artikel web atau URL jurnal/PDF)
  └── C. Drag & drop file PDF ke dashboard
      │
      ▼
[2. Next.js Route Handler / Processing Pipeline]
      │
      ├── Cek MIME type / ekstensi
      │   ├── JALUR A — Dokumen PDF (upload / direct link / meta tag akademik)
      │   │     ├── Simpan file asli ke Supabase Storage (bucket: raw-documents)
      │   │     └── Ekstrak teks & metadata via pdf-parse
      │   │
      │   └── JALUR B — Artikel web HTML
      │         ├── Ekstraksi teks bersih via @mozilla/readability + jsdom
      │         └── Image pipeline:
      │               1. Ambil semua <img> dalam kontainer artikel hasil filter
      │               2. Download binary & kompresi via sharp (maks 1200px, WebP, q75)
      │               3. Upload ke Supabase Storage (bucket: article-images)
      │               4. Ganti src di HTML artikel dengan URL Supabase Storage
      ▼
[3. Database Supabase PostgreSQL]
      ├── Simpan record ke tabel documents (tipe: 'article' | 'pdf')
      └── Kolom fts (tsvector) otomatis terindeks via GIN index
      ▼
[4. Frontend Next.js + Framer Motion]
      ├── Muncul di dashboard feed dengan animasi stagger
      └── Siap dicari via Cmd+K atau dibaca di Reader Mode
```

## 7. Struktur Halaman

```
app/
├── (auth)/
│   └── login/                  # Otentikasi login pribadi
├── (dashboard)/
│   ├── layout.tsx              # Sidebar, search trigger, theme toggle
│   ├── page.tsx                # Feed gabungan artikel & jurnal
│   ├── articles/page.tsx       # Filter khusus artikel web
│   ├── papers/page.tsx         # Filter khusus jurnal & PDF
│   ├── read/[id]/page.tsx      # Reader mode
│   └── upload/page.tsx         # Input URL manual & drag-and-drop PDF
└── api/
    ├── archive/route.ts        # Endpoint dari Chrome Extension & web
    └── upload-pdf/route.ts     # Endpoint multipart file upload PDF
```

## 8. Skema Database & Storage Supabase

Karena aplikasi ini dipakai oleh **satu pengguna (diri sendiri)**, skema dibuat single-tenant secara penggunaan tapi tetap **multi-tenant secara struktur** (memakai `auth.uid()` + RLS) — supaya aman by default kalau suatu saat di-deploy publik atau diakses dari device lain, dan supaya Supabase Auth bisa langsung dipakai tanpa refactor.

### 8.1 Enum Types

```sql
create type document_type as enum ('article', 'pdf');
create type document_status as enum ('unread', 'read', 'starred', 'archived');
create type ingestion_source as enum ('extension', 'manual_url', 'file_upload');
```

### 8.2 Tabel `documents`

Tabel inti — satu baris per artikel/paper.

```sql
create table documents (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,

  type                  document_type not null,
  status                document_status not null default 'unread',
  source                ingestion_source not null default 'manual_url',

  title                 text not null,
  author                text,
  site_name             text,              -- nama publisher/situs (mis. "arXiv", "The Atlantic")
  source_url            text,              -- nullable: null jika file upload langsung tanpa URL
  canonical_pdf_url     text,              -- hasil deteksi citation_pdf_url, jika ada

  content_html          text,              -- hasil bersih Readability (khusus artikel)
  content_text          text not null,     -- teks polos, dipakai untuk fts & reading time (artikel & pdf)
  excerpt               text,              -- ringkasan pendek/snippet default (150 kata pertama)

  raw_file_path         text,              -- path di bucket raw-documents (khusus pdf)
  raw_file_size_bytes    bigint,
  page_count            int,               -- khusus pdf

  cover_image_path      text,              -- path di bucket article-images, thumbnail kartu
  reading_time_minutes  int not null default 0,

  fts tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content_text, '')), 'C')
  ) stored,

  starred_at            timestamptz,
  read_at                timestamptz,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index documents_fts_idx        on documents using gin (fts);
create index documents_user_id_idx    on documents (user_id);
create index documents_type_idx       on documents (user_id, type);
create index documents_status_idx     on documents (user_id, status);
create index documents_created_at_idx on documents (user_id, created_at desc);

-- unique per user, hindari duplikat simpan URL yang sama dua kali
create unique index documents_user_source_url_unique
  on documents (user_id, source_url) where source_url is not null;
```

> `fts` dibobot bertingkat (A=judul, B=penulis, C=isi) supaya hasil pencarian yang match di judul otomatis rank lebih tinggi daripada yang cuma match di body — tanpa ini, pencarian nama pendek/umum akan terasa acak hasilnya.

### 8.3 Tabel `document_images`

Melacak tiap gambar hasil pipeline kompresi secara individual — dibutuhkan untuk audit ukuran storage, cleanup saat dokumen dihapus, dan supaya urutan gambar di artikel tetap terjaga.

```sql
create table document_images (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,

  original_url    text,           -- URL gambar asli sebelum diunduh
  storage_path    text not null,  -- path final di bucket article-images
  position        int not null default 0,  -- urutan kemunculan dalam artikel

  width           int,
  height          int,
  size_bytes      int,
  format          text default 'webp',

  created_at      timestamptz not null default now()
);

create index document_images_document_id_idx on document_images (document_id);
```

### 8.4 Tabel `tags` & `document_tags` (opsional, disiapkan untuk v2)

Skema disiapkan dari awal walau UI tagging belum ada di v1, supaya tidak perlu migrasi besar nanti.

```sql
create table tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text default '#B5502E',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table document_tags (
  document_id uuid not null references documents(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (document_id, tag_id)
);
```

### 8.5 Tabel `ingestion_jobs`

Melacak status pipeline async (penting karena ekstraksi PDF/artikel besar tidak selalu instan) — sumber data untuk toast/status di UI ("sedang diproses" → "berhasil"/"gagal").

```sql
create type job_status as enum ('pending', 'processing', 'succeeded', 'failed');

create table ingestion_jobs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  document_id   uuid references documents(id) on delete cascade, -- null selama masih diproses
  input_url     text,
  status        job_status not null default 'pending',
  error_message text,
  created_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index ingestion_jobs_user_status_idx on ingestion_jobs (user_id, status);
```

### 8.6 Trigger `updated_at`

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_set_updated_at
before update on documents
for each row execute function set_updated_at();
```

### 8.7 Row Level Security (RLS)

RLS **wajib aktif** di semua tabel meski hanya dipakai sendiri — mencegah kebocoran data kalau `anon key` ter-expose di client (Chrome Extension & Next.js keduanya memanggil Supabase dari sisi client).

```sql
alter table documents        enable row level security;
alter table document_images  enable row level security;
alter table tags             enable row level security;
alter table document_tags    enable row level security;
alter table ingestion_jobs   enable row level security;

-- pola sama untuk setiap tabel yang punya kolom user_id
create policy "select own documents" on documents
  for select using (auth.uid() = user_id);
create policy "insert own documents" on documents
  for insert with check (auth.uid() = user_id);
create policy "update own documents" on documents
  for update using (auth.uid() = user_id);
create policy "delete own documents" on documents
  for delete using (auth.uid() = user_id);

-- document_tags tidak punya user_id langsung, cek lewat join ke documents
create policy "manage own document_tags" on document_tags
  for all using (
    exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid())
  );
```

### 8.8 Supabase Storage — Buckets

| Bucket | Akses | Isi | Naming path |
|---|---|---|---|
| `raw-documents` | **Private** | File PDF asli (upload langsung / hasil download dari `citation_pdf_url`) | `{user_id}/{document_id}/original.pdf` |
| `article-images` | **Private** (akses via signed URL, bukan public bucket) | Gambar artikel hasil kompresi WebP | `{user_id}/{document_id}/images/{document_image_id}.webp` |
| `covers` | **Private** | Thumbnail/cover untuk kartu dashboard (gambar pertama artikel, atau halaman pertama PDF di-render jadi gambar) | `{user_id}/{document_id}/cover.webp` |

**Kenapa semua private, bukan public bucket?** Karena isi dokumen adalah bacaan pribadi (bisa termasuk paper berbayar/berlisensi) — akses selalu lewat **signed URL berumur pendek** (mis. 1 jam) yang di-generate saat request reader mode, bukan URL publik permanen.

Storage policy (contoh untuk `raw-documents`, pola sama untuk bucket lain):

```sql
create policy "read own raw documents"
  on storage.objects for select
  using (
    bucket_id = 'raw-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "upload own raw documents"
  on storage.objects for insert
  with check (
    bucket_id = 'raw-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own raw documents"
  on storage.objects for delete
  using (
    bucket_id = 'raw-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 8.9 Batasan & Konfigurasi Storage

| Item | Batas |
|---|---|
| Ukuran maks. upload PDF | 50 MB per file |
| Ukuran maks. gambar sebelum kompresi | 15 MB per gambar (di-skip jika lebih, bukan gagal total) |
| Format gambar output | WebP, quality 75, lebar maks 1200px |
| Umur signed URL | 3600 detik (1 jam), di-refresh otomatis oleh frontend saat reader mode dibuka |
| Retensi `ingestion_jobs` gagal | dibersihkan otomatis (cron/edge function) setelah 30 hari |

### 8.10 Cleanup saat Dokumen Dihapus

Karena Storage Supabase **tidak** otomatis ikut terhapus lewat `on delete cascade` di Postgres (itu hanya berlaku untuk baris tabel, bukan objek storage), dibutuhkan trigger via **Supabase Edge Function** (dipicu Database Webhook on `DELETE documents`) yang menghapus:
1. Objek di `raw-documents/{user_id}/{document_id}/`
2. Objek di `article-images/{user_id}/{document_id}/`
3. Objek di `covers/{user_id}/{document_id}/`

sebelum baris `document_images` ikut terhapus lewat cascade.

## 9. Kebutuhan Non-Fungsional

- **Performa pencarian**: hasil Cmd+K tampil < 300ms untuk vault hingga puluhan ribu dokumen.
- **Keandalan ingestion**: kegagalan ekstraksi (paywall, PDF terenkripsi) harus gagal dengan pesan jelas, bukan silent fail.
- **Biaya operasional**: tetap dalam batas free/hobby tier Supabase & Vercel untuk penggunaan personal.
- **Keamanan**: akses hanya untuk pemilik akun (login pribadi), Row Level Security aktif di Supabase.
- **Aksesibilitas**: reader mode memenuhi kontras WCAG AA, navigasi keyboard penuh untuk command palette.

## 10. Metrik Keberhasilan

- Waktu dari klik "Simpan" di extension hingga dokumen muncul di dashboard: **< 5 detik** untuk artikel, **< 15 detik** untuk PDF.
- Tingkat keberhasilan ekstraksi teks bersih: **> 90%** dari artikel web umum.
- Search recall: pengguna menemukan dokumen yang dicari dalam **≤ 2 query** pencarian.

## 11. Fase Pengembangan (Roadmap)

| Fase | Cakupan |
|---|---|
| **v0.1 (MVP)** | Login, upload manual URL/PDF, ekstraksi teks, penyimpanan Supabase, reader mode dasar, search sederhana (ILIKE) |
| **v0.2** | Full-text search tsvector + GIN, Cmd+K command palette, Framer Motion micro-interactions |
| **v0.3** | Chrome Extension one-click save, image pipeline (sharp + WebP) |
| **v0.4** | Dual reader mode penuh (PDF embedded viewer + toggle), status management (unread/read/starred) |
| **v2 (future)** | Ekspor BibTeX, tagging, OCR untuk PDF scan, PWA offline reading |

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Situs web memblokir scraping (bot detection) | Fallback: simpan HTML mentah, tampilkan pesan "gagal ekstraksi bersih, lihat versi asli" |
| PDF terproteksi password / hasil scan (image-only) | Deteksi di awal, tandai status "butuh OCR" untuk v2, jangan gagal total |
| Biaya storage membengkak (gambar & PDF) | Kompresi WebP wajib untuk gambar; batas ukuran file PDF per upload |
| Meta tag `citation_pdf_url` tidak konsisten antar publisher | Siapkan daftar fallback selector umum (Elsevier, Springer, arXiv, dsb.) |