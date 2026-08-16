# landing-page.md — Verso

Spesifikasi konten & layout untuk landing page publik Verso (`verso.app` / domain pilihan). Dokumen ini mengacu langsung ke token dan prinsip di `DESIGN.md` — bukan brief terpisah.

## 0. Prinsip Copywriting (anti-AI-slop)

Sebelum masuk ke section, ini aturan nada bicara yang berlaku di **seluruh halaman**:

**Dilarang dipakai** — kata/pola yang bikin landing page terasa dibuat template AI:
- ❌ "Revolutionize", "supercharge", "unlock the power of", "game-changer", "seamless", "elevate your workflow"
- ❌ Emoji sebagai bullet point (🚀 ✨ 💡) atau di headline
- ❌ Headline generik pola "The [Adjective] Way to [Verb]" (mis. "The Smartest Way to Read")
- ❌ Bullet 3-kolom "Fast. Secure. Reliable." tanpa konteks konkret
- ❌ Tanda seru berlebihan, terutama di lebih dari satu tempat per section
- ❌ Testimonial palsu / logo perusahaan fiktif ("Trusted by teams at...") — Verso adalah tool personal, tidak berpura-pura B2B

**Dipakai sebagai gantinya:**
- Kalimat deklaratif, spesifik, kadang agak personal — seperti seseorang menjelaskan tool yang dia bikin untuk dirinya sendiri, bukan copywriter menjual SaaS.
- Angka dan detail konkret (mis. "tersimpan permanen", "dicari dalam hitungan milidetik") daripada klaim abstrak ("powerful", "amazing").
- Boleh menyebut masalah yang jujur & spesifik: tab menumpuk, PDF hilang di folder Downloads, link yang mati.

## 1. Sitemap Halaman

```
1. Nav (sticky, minimal)
2. Hero
3. Masalah (Problem framing)
4. Cara Kerja (3 langkah)
5. Fitur — Full-Text Search (showcase Cmd+K)
6. Fitur — Dual Reader Mode
7. Fitur — Chrome Extension
8. Preview Dashboard (screenshot besar)
9. FAQ singkat
10. CTA penutup
11. Footer
```

Tidak ada section "Pricing" atau "Testimonials" — Verso di v1 adalah proyek personal/self-hosted, bukan produk komersial. Jangan tambahkan section itu hanya karena "biasanya landing page punya itu".

---

## 2. Nav

**Layout**: sticky top, background `--bg` dengan `backdrop-filter` **tidak dipakai** (hindari glassmorphism sesuai DESIGN.md) — cukup border-bottom 1px `--border` yang muncul setelah scroll > 40px.

- Kiri: logotype "Verso" — pakai `Fraunces`, weight 500, bukan logo ikon rumit.
- Kanan: link "Cara Kerja", "Fitur", link ke GitHub (jika open-source), tombol "Masuk" (outline style, bukan solid).

Tidak ada mega-menu, tidak ada dropdown. Nav ini untuk aplikasi personal, bukan produk enterprise.

---

## 3. Hero

**Layout**: teks rata kiri (bukan center — center-aligned hero adalah salah satu pola paling umum di landing page generik/AI-generated). Grid 2 kolom di desktop: teks di kiri (60%), screenshot reader mode di kanan (40%), sedikit rotasi/offset natural (bukan mockup device frame mengambang dengan shadow besar).

**Headline** (Fraunces, `--text-3xl` atau lebih besar di hero, `text-primary`):

> Semua yang kamu baca, tetap ada.

**Subhead** (Inter, `--text-lg`, `text-secondary`, maks ~60 karakter per baris):

> Verso menyimpan artikel dan paper PDF di satu tempat, lalu membuatnya bisa dicari — sampai ke isi paragrafnya — dalam hitungan milidetik.

**CTA primer**: tombol solid `--accent`, teks "Mulai simpan arsipmu" (bukan "Get Started" generik / "Try it Free" — tidak relevan untuk tool personal/self-host).
**CTA sekunder**: teks link biasa (bukan tombol), "Lihat cara kerjanya ↓" — scroll ke section 4.

**Visual kanan**: screenshot nyata dari reader mode (bukan ilustrasi abstrak/3D blob khas AI-generated hero image). Beri sedikit `box-shadow` tipis + border 1px `--border`, radius `8px` sesuai token kartu di DESIGN.md — bukan mockup laptop/browser chrome palsu.

**Motion**: saat halaman load, headline + subhead + CTA masuk dengan stagger ringan (`translateY 8px→0`, `opacity 0→1`, delay antar elemen `0.05s`, `ease` dari `motion_tokens`). Screenshot kanan fade-in `0.1s` lebih lambat. Tidak ada parallax scroll — parallax di hero adalah pola lain yang terasa generik/templated.

---

## 4. Masalah (Problem Framing)

**Layout**: 3 baris pernyataan singkat, bukan 3-kolom kartu ikon (pola "Fast. Secure. Reliable." yang dilarang di atas). Format seperti daftar yang dibaca berurutan, dengan angka kecil mono-font di kiri tiap baris.

**Heading kecil** (`--text-sm`, mono, `--text-muted`, uppercase, letter-spacing lebar): "MASALAH YANG SEBENARNYA"

**Isi** (masing-masing 1-2 kalimat, `--text-xl`, `Fraunces`, `text-primary`):

```
01  Tab menumpuk sampai puluhan, dan kamu tahu tidak akan pernah dibaca ulang.
02  PDF paper tersimpan di folder Downloads, tanpa cara mencari isinya.
03  Bookmark yang kamu simpan tahun lalu sekarang membuka halaman 404.
```

Tidak perlu ilustrasi untuk section ini — biarkan teks yang bicara, sesuai prinsip "teks adalah bintang utama" di DESIGN.md.

---

## 5. Cara Kerja (3 Langkah)

**Layout**: 3 kolom horizontal di desktop (stack vertikal di mobile), dipisah garis vertikal tipis `--border`, bukan kartu terpisah dengan shadow masing-masing.

**Heading section**: "Cara kerjanya" (`--text-2xl`, Fraunces)

| # | Judul | Deskripsi |
|---|---|---|
| 01 | Simpan | Klik ikon Verso di toolbar Chrome, atau tempel link/upload PDF langsung dari dashboard. |
| 02 | Diproses | Verso membersihkan artikel dari iklan, mengompresi gambar, dan mengekstrak teks paper — otomatis, di belakang layar. |
| 03 | Cari & baca | Tekan `Cmd+K` kapan saja untuk menemukan kalimat spesifik dari ratusan dokumen, lalu baca dalam mode bersih. |

**Visual per langkah**: ikon outline sederhana (Lucide, stroke 1.5px sesuai DESIGN.md) — bukan ilustrasi berwarna-warni per langkah.

**Motion**: masing-masing langkah fade-in + translateY saat masuk viewport (scroll-triggered), stagger `0.08s` antar kolom, sekali saja (tidak re-trigger tiap scroll naik-turun).

---

## 6. Fitur — Full-Text Search (Cmd+K)

**Layout**: teks di kiri, demo visual interaktif/GIF-style di kanan menunjukkan command palette sungguhan (bukan mockup search bar generik).

**Heading kecil mono**: "PENCARIAN"

**Headline** (`--text-2xl`, Fraunces): "Cari sampai ke isi paragrafnya"

**Body**: Menjelaskan singkat bahwa pencarian pakai PostgreSQL full-text search (`tsvector` + GIN index), hasil muncul dengan cuplikan kalimat yang match, judul di-rank lebih tinggi dari isi body — 2-3 kalimat, boleh sedikit teknis karena target user paham istilah ini (developer/researcher), jangan didumb-down berlebihan.

**Visual**: rekaman/screenshot command palette sungguhan dengan hasil pencarian nyata (bukan lorem ipsum) dan snippet bold pada kata kunci — persis sesuai spesifikasi komponen Command Palette di DESIGN.md.

---

## 7. Fitur — Dual Reader Mode

**Layout**: 2 kartu berdampingan (side-by-side), satu menunjukkan reader mode artikel (tipografi serif, progress bar), satu menunjukkan PDF embedded viewer. Border 1px, radius 8px, tanpa shadow tebal — konsisten dengan token Document Card di DESIGN.md.

**Heading kecil mono**: "MEMBACA"

**Headline**: "Satu mode baca untuk artikel, satu lagi untuk paper aslinya"

**Copy kartu kiri (Artikel)**: "Teks bersih, tanpa iklan, tanpa sidebar. Progress bar mengikuti seberapa jauh kamu membaca."

**Copy kartu kanan (PDF)**: "Beralih antara ringkasan teks hasil ekstraksi atau membaca layout asli jurnal — lengkap dengan nomor halaman dan gambar aslinya."

---

## 8. Fitur — Chrome Extension

**Layout**: satu baris, teks kiri + visual kanan menunjukkan popup extension sungguhan menempel di toolbar browser (screenshot asli, bukan ilustrasi browser generik).

**Heading kecil mono**: "EKSTENSI CHROME"

**Headline**: "Satu klik dari tab manapun"

**Body**: "Tidak perlu membuka dashboard dulu. Klik ikon Verso, halaman yang sedang kamu baca langsung tersimpan — lengkap dengan gambar dan teksnya."

**Micro-detail** (`--text-sm`, mono, `--text-muted`): "Manifest V3 · Chrome & browser berbasis Chromium"

---

## 9. Preview Dashboard

Satu screenshot besar, full-width (dengan margin, bukan edge-to-edge), menunjukkan dashboard feed asli dengan grid kartu dokumen — mendemonstrasikan langsung staggered entrance animation dan badge tipe dokumen dari DESIGN.md, bukan dijelaskan lewat teks.

**Caption kecil di bawah screenshot** (`--text-sm`, `--text-muted`, italic): "Dashboard asli Verso — bukan mockup."

Kalimat ini sengaja eksplisit untuk membedakan dari kebiasaan landing page yang pakai mockup Photoshop tidak akurat.

---

## 10. FAQ Singkat

**Layout**: accordion sederhana, maksimal 4-5 pertanyaan, teks polos tanpa ikon plus/minus berwarna mencolok — garis tipis `--border` sebagai pemisah antar item.

Contoh pertanyaan (isi jawaban aktual disesuaikan saat implementasi):
1. Apakah Verso menyimpan artikel di balik paywall?
2. Bagaimana Verso menangani PDF hasil scan (bukan teks)?
3. Apakah data saya privat?
4. Bisakah saya self-host Verso sendiri?

---

## 11. CTA Penutup

**Layout**: centang tunggal, background sedikit berbeda dari section lain (`--bg-elevated` atau `--accent-soft` sangat tipis) — bukan background gradient warna-warni.

**Headline**: "Arsipmu, dicari dalam sekejap."

**CTA**: tombol solid sama seperti hero, teks "Mulai simpan arsipmu".

Tidak perlu sub-teks tambahan di sini — cukup satu headline dan satu tombol, jangan diulang-ulang argumen yang sudah dijelaskan di section sebelumnya.

---

## 12. Footer

**Layout**: minimal, satu baris di desktop.

```
Verso · [tahun] · [link GitHub jika ada] · [link kontak/email]
```

Tidak perlu kolom sitemap 4-kolom khas footer korporat (Product / Company / Resources / Legal) — landing page ini kecil dan personal, footer besar hanya menambah noise visual yang bertentangan dengan prinsip "diam sampai dibutuhkan" di DESIGN.md.

---

## 13. Referensi Visual Konsisten dengan DESIGN.md

| Elemen | Aturan |
|---|---|
| Warna | Hanya `--bg`, `--bg-elevated`, `--text-primary/secondary/muted`, dan **satu** `--accent`. Tidak ada warna baru khusus landing page. |
| Font | Fraunces untuk semua headline section, Inter untuk body, IBM Plex Mono untuk label kecil/eyebrow text ("MASALAH YANG SEBENARNYA", dsb.) |
| Spacing antar section | `--space-8` (64px) minimum secara vertikal, agar tiap section terasa "bernafas" seperti membaca buku, bukan feed yang padat |
| Radius | `8px` konsisten di semua kartu/screenshot frame |
| Shadow | Tipis atau tidak ada sama sekali — border 1px `--border` jadi pemisah utama |
| Motion | Semua transisi pakai `motion_tokens.ease` dari DESIGN.md, tidak ada spring/bounce |
| Gambar | Hanya screenshot produk asli. Tidak ada stock photo, tidak ada ilustrasi 3D/blob, tidak ada mockup device palsu |

## 14. Responsive

- Breakpoint utama: mobile (< 640px) — semua grid 2 kolom jadi 1 kolom, urutan visual: teks dulu baru screenshot (bukan sebaliknya).
- Nav di mobile: link "Cara Kerja"/"Fitur" disembunyikan, hanya logo + tombol "Masuk" yang tersisa (tidak perlu hamburger menu untuk 2 link saja).
- Hero di mobile: headline turun ke `--text-2xl` agar tidak wrap terlalu banyak baris.

## 15. Meta / SEO (draft)

```html
<title>Verso — Arsip artikel & paper yang bisa dicari sampai ke isinya</title>
<meta name="description" content="Verso menyimpan artikel web dan paper PDF di satu tempat, lalu membuatnya bisa dicari secara penuh — dari judul sampai isi paragraf — dalam hitungan milidetik." />
```

Open Graph image: screenshot dashboard asli (sama seperti section 9), bukan banner teks besar yang dibuat khusus untuk share card.
