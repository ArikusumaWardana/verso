# Verso

Verso adalah arsip pribadi untuk menyimpan artikel web dan paper PDF. Artikel dibersihkan menjadi tampilan baca, PDF disimpan bersama teks hasil ekstraksi, dan seluruh isi dapat dicari melalui full-text search PostgreSQL.

## Fitur

- Menyimpan artikel dari URL dengan Mozilla Readability.
- Menyimpan PDF dari URL langsung, landing page jurnal, atau upload lokal.
- Mengarsipkan gambar artikel sebagai WebP di Supabase Storage.
- Full-text search berbasis `tsvector` dan GIN index.
- Reader artikel dan embedded PDF viewer.
- Status belum dibaca, sudah dibaca, berbintang, dan diarsipkan.
- Tema paper dan ink tanpa flash tema saat halaman dimuat.
- Chrome Extension Manifest V3 untuk menyimpan tab aktif.
- Supabase Auth, private Storage, dan Row Level Security per pengguna.

## Teknologi

- Next.js 16 dan React 19
- Supabase Database, Auth, dan Storage
- PostgreSQL full-text search
- Mozilla Readability dan JSDOM
- `pdf-parse`
- Sharp
- Framer Motion

## Prasyarat

- Node.js 22 atau lebih baru
- npm
- Project Supabase
- Google Chrome atau browser Chromium untuk extension

## Menyiapkan Supabase

### 1. Buat project

Buat project baru melalui [Supabase Dashboard](https://supabase.com/dashboard). Simpan Project URL dan publishable key dari halaman pengaturan API.

Jangan gunakan secret key atau `service_role` key pada environment variable yang diawali `NEXT_PUBLIC_`.

### 2. Jalankan migration

Jalankan file berikut secara berurutan melalui SQL Editor Supabase:

1. [`supabase/migrations/20260816000000_initial_schema.sql`](supabase/migrations/20260816000000_initial_schema.sql)
2. [`supabase/migrations/20260816001000_add_fk_covering_indexes.sql`](supabase/migrations/20260816001000_add_fk_covering_indexes.sql)

Migration tersebut membuat:

- tabel `documents`, `document_images`, `tags`, `document_tags`, dan `ingestion_jobs`;
- enum status dan tipe dokumen;
- fungsi full-text search;
- trigger `updated_at`;
- index pencarian dan foreign key;
- policy RLS untuk data pengguna;
- bucket privat `raw-documents`, `article-images`, dan `covers`;
- policy Storage berbasis folder pengguna.

### 3. Atur Auth

Email dan password digunakan untuk login. Periksa pengaturan email confirmation di **Authentication → Providers → Email**.

Jika email confirmation aktif, pengguna harus membuka tautan konfirmasi sebelum login. Tambahkan URL aplikasi ke daftar redirect URL Supabase bila aplikasi dijalankan pada domain production.

## Konfigurasi aplikasi

Salin contoh environment:

```bash
cp .env.example .env.local
```

Isi nilainya:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Install dependency dan jalankan development server:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu buat akun melalui halaman login.

## Deploy ke Vercel

### 1. Impor repository

Push project ke GitHub, lalu buka [Vercel](https://vercel.com/new) dan pilih repository Verso. Framework Preset akan terdeteksi sebagai Next.js. Biarkan Build Command menggunakan `npm run build`.

### 2. Tambahkan environment variable

Di **Project Settings > Environment Variables**, tambahkan dua nilai berikut untuk Production dan Preview:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Nilainya sama dengan `.env.local`. Jangan menambahkan secret key atau `service_role` key ke variable yang diawali `NEXT_PUBLIC_`.

### 3. Deploy

Klik **Deploy**. Setelah build selesai, salin domain production, misalnya `https://verso.example.com` atau domain `vercel.app` yang diberikan Vercel.

### 4. Perbarui URL Supabase Auth

Buka **Supabase Dashboard > Authentication > URL Configuration**:

- isi **Site URL** dengan origin production tanpa path;
- tambahkan `http://localhost:3000/**` untuk development;
- tambahkan origin production dengan akhiran `/**` pada **Redirect URLs**;
- bila Preview Deployment digunakan, tambahkan pola preview Vercel yang sesuai dengan akun atau team Anda.

Gunakan URL production yang persis untuk produksi. Wildcard sebaiknya hanya dipakai untuk localhost dan preview deployment.

### 5. Hubungkan Chrome Extension

Buka popup extension, pilih **Ganti alamat server**, masukkan origin deployment tanpa garis miring di akhir, lalu setujui izin origin baru dari Chrome.

Upload PDF dilakukan langsung dari browser ke bucket privat Supabase. Route Vercel hanya menerima metadata dan memproses file dari Storage, sehingga PDF tidak melewati batas request body Serverless Function.

## Perintah project

```bash
npm run dev       # development server
npm run lint      # ESLint
npx tsc --noEmit  # type-check
npm run build     # production build
npm run start     # menjalankan production build
```

## Menyimpan bacaan

### Artikel atau link PDF

1. Klik **Simpan bacaan**.
2. Masukkan URL artikel, PDF langsung, atau landing page jurnal.
3. Klik **Simpan tautan**.

Verso akan mendeteksi tipe sumber. Landing page jurnal dengan `citation_pdf_url` diproses sebagai PDF. Gambar yang berada di dalam konten Readability dikompresi menjadi WebP sebelum disimpan.

### Upload PDF

1. Buka tab **Unggah PDF**.
2. Pilih atau jatuhkan PDF ke area upload.
3. Pastikan nama dan ukuran file sudah benar.
4. Klik **Simpan PDF** untuk memulai ekstraksi dan penyimpanan.

Memilih file tidak langsung mengirim atau memasukkan data. Request baru dijalankan setelah tombol **Simpan PDF** ditekan. Ukuran maksimal PDF adalah 50 MB dan PDF harus memiliki teks yang dapat dipilih.

PDF asli disimpan pada bucket privat dengan path:

```text
raw-documents/{user_id}/{document_id}/original.pdf
```

## Menyiapkan Chrome Extension

Extension berada di folder [`extension`](extension). Chrome tidak mengizinkan website memasang extension lokal secara otomatis, sehingga versi development harus dipasang melalui halaman extension Chrome.

### 1. Jalankan dan login ke Verso

Jalankan aplikasi:

```bash
npm run dev
```

Buka `http://localhost:3000` dan login menggunakan profil Chrome yang akan memakai extension.

### 2. Muat extension

1. Buka `chrome://extensions`.
2. Aktifkan **Developer mode** di kanan atas.
3. Klik **Load unpacked**.
4. Pilih folder `extension` di dalam repository ini.
5. Buka menu Extensions pada toolbar Chrome dan pin **Verso**.

Folder yang dipilih harus berisi `manifest.json`, bukan root repository.

### 3. Hubungkan extension ke aplikasi

1. Klik ikon Verso pada toolbar.
2. Isi alamat server dengan `http://localhost:3000`.
3. Klik **Simpan alamat**.
4. Setujui izin origin yang ditampilkan Chrome.

Extension mendeklarasikan host sebagai optional permission. Izin diminta hanya untuk origin yang dimasukkan, bukan otomatis untuk seluruh website yang dibuka.

### 4. Simpan tab aktif

1. Buka artikel atau PDF melalui URL HTTP/HTTPS.
2. Klik ikon Verso.
3. Klik **Simpan tab ini**.
4. Tunggu pesan **Tersimpan di arsip.**

Extension memanggil `/api/archive` dengan sesi login Verso pada profil Chrome yang sama. Jika popup menampilkan pesan sesi berakhir, klik **Masuk ke Verso**, login, lalu buka kembali popup.

### Menggunakan server production

Buka popup extension, pilih **Ganti alamat server**, lalu masukkan origin deployment, misalnya:

```text
https://verso.example.com
```

Gunakan HTTPS pada deployment production. Chrome akan meminta izin untuk origin baru tersebut.

### Memuat perubahan extension

Setelah mengubah file dalam folder `extension`:

1. Buka `chrome://extensions`.
2. Cari Verso.
3. Klik tombol **Reload** pada kartu extension.
4. Tutup dan buka kembali popup.

### Menghapus extension

Buka `chrome://extensions`, cari Verso, lalu klik **Remove**. Tindakan ini tidak menghapus dokumen yang sudah tersimpan di Supabase.

## Penyimpanan dan keamanan

- Semua tabel publik memakai RLS.
- Semua operasi dokumen dibatasi dengan `auth.uid()`.
- Bucket PDF dan gambar bersifat privat.
- Reader membuat signed URL dengan masa berlaku satu jam.
- Secret key Supabase tidak digunakan di browser.
- URL ingestion diperiksa untuk mencegah akses ke alamat jaringan privat.
- Menghapus dokumen melalui Verso juga membersihkan PDF dan gambar terkait dari Storage.

## Struktur utama

```text
app/
  api/archive/          ingestion artikel dan link PDF
  api/upload-pdf/       upload PDF lokal
  api/search/           full-text search
  read/[id]/            reader artikel dan PDF
components/
  vault.tsx             dashboard, pencarian, dan dialog upload
extension/              Chrome Extension Manifest V3
lib/
  ingestion.ts          ekstraksi artikel, PDF, dan gambar
  supabase/             client Supabase browser dan server
supabase/migrations/    schema, RLS, Storage, fungsi, dan index
```

## Batasan

- Tidak ada OCR untuk PDF hasil scan.
- Situs dengan paywall atau proteksi bot dapat menolak ekstraksi.
- Artikel yang seluruh isinya dibuat oleh JavaScript setelah halaman dibuka mungkin tidak menyediakan teks lengkap kepada server.
- Beberapa CDN dapat menolak pengunduhan gambar dari server.
- Extension development harus dipasang manual melalui `Load unpacked`.

## Troubleshooting

### PDF worker tidak ditemukan

Pastikan dependency sudah terpasang dan restart development server:

```bash
npm install
npm run dev
```

Konfigurasi worker dan server package berada di [`lib/ingestion.ts`](lib/ingestion.ts) dan [`next.config.ts`](next.config.ts).

### Extension tidak dapat menyimpan tab

- Pastikan tab menggunakan URL HTTP atau HTTPS.
- Pastikan aplikasi sedang berjalan.
- Pastikan alamat server pada popup tepat.
- Pastikan profil Chrome yang sama sudah login ke Verso.
- Periksa izin origin pada detail extension.
- Reload extension setelah mengubah source code.

### Artikel tersimpan tanpa gambar

Periksa terminal Next.js. Pipeline mencatat jumlah gambar yang ditemukan, berhasil diarsipkan, dan dilewati. Gambar di atas 15 MB, SVG, alamat privat, atau sumber yang menolak request server tidak akan disimpan.

### Status masih belum dibaca

Dokumen berubah menjadi **Sudah dibaca** ketika halaman reader `/read/[id]` dibuka. Kembali ke dashboard untuk mengambil status terbaru.
