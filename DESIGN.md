# DESIGN.md — Verso

Panduan desain untuk Universal Web & Paper Knowledge Vault.

## 1. Prinsip Desain

Verso adalah aplikasi untuk **membaca dan menemukan**, bukan aplikasi produktivitas yang riuh. Desainnya harus terasa seperti perpustakaan pribadi yang tenang, bukan dashboard SaaS.

1. **Kertas, bukan kaca.** Hindari glassmorphism, gradient ungu-biru generik, dan neon glow — itu ciri khas "AI slop" yang sudah terlalu sering dipakai. Verso memakai bahasa visual kertas/manuskrip: permukaan datar, warna hangat, tepi tajam.
2. **Teks adalah bintang utama.** Semua keputusan desain (warna, spacing, tipografi) tunduk pada keterbacaan artikel dan PDF.
3. **Diam sampai dibutuhkan.** UI chrome (sidebar, toolbar) minim, rendah kontras, mundur ke belakang saat pengguna masuk ke reader mode.
4. **Gerakan bermakna, bukan hiasan.** Framer Motion dipakai untuk memberi konteks spasial (dari mana kartu ini muncul, ke mana modal ini pergi), bukan sekadar "supaya keren".
5. **Satu aksen, dipakai hemat.** Satu warna aksen untuk seluruh aplikasi. Warna dipakai untuk menandai state (starred, unread), bukan dekorasi.

## 2. Tipografi

Tiga peran huruf, tidak lebih:

| Peran | Font | Penggunaan |
|---|---|---|
| **Display / heading** | `Fraunces` (serif, variable, sedikit editorial) | Judul dokumen di reader mode, judul halaman, judul kartu besar |
| **UI / body** | `Inter` | Navigasi, tombol, label, body teks di dashboard |
| **Meta / mono** | `IBM Plex Mono` | Timestamp, reading time, URL sumber, badge tipe dokumen (ARTICLE/PDF) |

**Kenapa bukan satu font sans generik untuk semuanya?** Kombinasi serif editorial + sans UI menciptakan hierarki "ini adalah bacaan" vs "ini adalah kontrol aplikasi" — pola yang dipakai publikasi seperti Read/Longform, bukan template dashboard admin.

Skala tipe (rem, base 16px):

```
--text-xs:   0.75rem   /* meta, badge */
--text-sm:   0.875rem  /* label, secondary text */
--text-base: 1rem      /* body UI */
--text-lg:   1.125rem  /* card title */
--text-xl:   1.5rem    /* section heading */
--text-2xl:  2rem      /* page title */
--text-3xl:  2.75rem   /* reader mode article title */
```

Reader mode artikel: `font-size: 1.125rem`, `line-height: 1.75`, `max-width: 68ch`. Ini bukan angka sembarang — 68ch adalah rentang optimal keterbacaan untuk paragraf panjang.

## 3. Warna

Palet dua-mode (light/dark), berbasis kertas dan tinta — **bukan** abu-abu netral generik dari Tailwind default.

### Light mode ("Paper")
```
--bg:            #FAF7F0   /* kertas krem hangat, bukan putih #FFFFFF */
--bg-elevated:   #FFFFFF   /* kartu, modal */
--border:        #E8E1D3
--text-primary:  #1F1B16   /* hitam hangat, bukan #000 */
--text-secondary:#6B6355
--text-muted:    #9C9484
--accent:        #B5502E   /* terracotta / merah bata — aksen tunggal */
--accent-soft:   #F1DDD2   /* background badge/highlight aksen */
```

### Dark mode ("Ink")
```
--bg:            #16140F   /* hitam kecoklatan, bukan #000 atau navy */
--bg-elevated:   #201D17
--border:        #34302A
--text-primary:  #F2ECDF
--text-secondary:#B4AB98
--text-muted:    #756D5E
--accent:        #E08A5C   /* terracotta versi terang untuk kontras dark */
--accent-soft:   #3A2A22
```

### Warna status (dipakai minimal, hanya untuk badge status dokumen)
```
--status-unread:  var(--accent)
--status-read:    var(--text-muted)
--status-starred: #C99A2E   /* amber muted, bukan kuning terang */
```

Aturan pemakaian: **maksimal satu warna aksen aktif per layar.** Tidak ada gradient. Border tipis (1px) lebih diutamakan daripada shadow tebal untuk memisahkan elemen.

## 4. Spacing & Grid

Skala 4px, konsisten di seluruh aplikasi:

```
--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 24px  --space-6: 32px  --space-7: 48px  --space-8: 64px
```

- Dashboard grid kartu: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, gap `--space-5`.
- Reader mode: kolom tunggal, `max-width: 68ch`, margin atas-bawah generous (`--space-8`) agar terasa seperti membaca buku, bukan scroll web app.
- Sidebar: lebar tetap `240px`, collapsible ke ikon-saja di layar sempit.

## 5. Komponen Kunci

### Kartu Dokumen (Document Card)
- Latar `--bg-elevated`, border 1px `--border`, radius `8px` (sudut lembut tapi tidak "bubble" — hindari radius besar 20px+ yang terkesan playful/anak-anak).
- Badge tipe dokumen (`ARTICLE` / `PDF`) memakai font mono, huruf kecil, tracking lebar, warna `--text-muted` — bukan pill berwarna solid.
- Hover: `translateY(-2px)` + border berubah ke `--accent` opacity 40%. Tanpa shadow besar/glow.
- Cover image (jika ada) rasio 16:9, object-fit cover, sedikit desaturate (`filter: saturate(0.9)`) agar tetap konsisten dengan palet hangat meski gambar aslinya kontras.

### Command Palette (Cmd+K)
- Modal center, lebar maks `640px`, backdrop gelap solid opacity rendah (bukan blur berlebihan).
- Input search besar (`--text-lg`), placeholder: "Cari di seluruh arsip…"
- Hasil pencarian menampilkan cuplikan teks dengan kata kunci di-*bold*, bukan di-highlight warna terang — supaya tetap tenang secara visual.
- Icon tipe dokumen kecil di kiri tiap hasil (garis/outline, bukan filled/emoji).

### Reader Mode
- Progress bar baca: garis tipis 2px di atas viewport, warna `--accent`, tanpa animasi bounce — hanya mengikuti scroll linear.
- Toolbar aksi (Favorite/Archive/Delete): melayang di kanan bawah atau kanan atas, ikon outline saja, muncul saat idle, memudar saat scroll aktif membaca.
- PDF viewer: bingkai minim, kontrol zoom/halaman di toolbar bawah yang menyatu dengan warna `--bg-elevated`, bukan overlay gelap generik dari library PDF default.

### Empty & Loading States
- Empty state dashboard: ilustrasi garis sederhana (line art, satu warna `--text-muted`), bukan mascot 3D atau ilustrasi flat-design berwarna-warni. Teks singkat + CTA "Simpan artikel pertamamu".
- Loading skeleton: blok abu-abu hangat dengan shimmer halus, bentuk mengikuti layout kartu asli (bukan skeleton generik kotak-kotak).

## 6. Motion (Framer Motion)

Gerakan harus terasa presisi, bukan "bouncy". Gunakan easing custom, hindari `spring` default yang terlalu kenyal untuk konteks aplikasi baca.

```js
// token motion standar
export const motion_tokens = {
  duration: { fast: 0.15, base: 0.25, slow: 0.4 },
  ease: [0.22, 1, 0.36, 1], // ease-out kuat, terasa "presisi" bukan "playful"
};
```

| Interaksi | Perilaku |
|---|---|
| Staggered entrance grid kartu | `opacity 0→1`, `translateY 8px→0`, delay antar-kartu `0.03s`, durasi `base` |
| Buka Command Palette | Backdrop fade `fast`; panel `scale 0.98→1` + `opacity`, durasi `base` |
| Transisi halaman | Cross-fade sederhana `opacity`, tanpa slide horizontal (slide terasa seperti mobile app, bukan reading app) |
| Hover kartu | `translateY(-2px)` durasi `fast`, tanpa scale (scale-on-hover terlihat murah/generik) |
| Toast konfirmasi simpan (dari extension) | Slide-in dari bawah kanan, auto-dismiss 3 detik, ikon centang outline sederhana |
| Progress bar baca | Tanpa transition-easing tambahan — harus 1:1 dengan posisi scroll, easing di sini justru terasa "lag" |

**Aturan umum**: tidak ada animasi berulang/loop (tidak ada elemen yang terus berdenyut atau berputar tanpa alasan). Motion hanya terjadi sebagai respons langsung terhadap aksi pengguna.

## 7. Ikonografi

- Gunakan set ikon outline konsisten (mis. Lucide) — **stroke width seragam 1.5px** di seluruh aplikasi.
- Tidak memakai emoji sebagai ikon fungsional.
- Ikon tipe dokumen: garis dokumen sederhana untuk artikel, garis dengan sudut terlipat untuk PDF — dibedakan lewat bentuk, bukan warna.

## 8. Dark Mode

Toggle manual di sidebar (bukan hanya ikut sistem), tersimpan di preferensi user. Transisi antar mode: fade `--bg`/`--text` durasi `slow` agar tidak menyilaukan mata saat berpindah saat membaca malam hari.

## 9. Yang Dihindari (Anti-pola "AI Slop")

Daftar eksplisit agar konsisten di seluruh tim/iterasi desain:

- ❌ Gradient ungu-ke-biru atau ungu-ke-pink sebagai background hero.
- ❌ Glassmorphism (blur + transparansi berlebihan) pada kartu/panel.
- ❌ Radius sudut sangat besar (pill-shaped card, bubble button) di konteks non-playful.
- ❌ Shadow tebal berwarna (`box-shadow` dengan warna aksen menyala di sekeliling elemen).
- ❌ Font sans generik tunggal untuk headline dan body sekaligus (Inter/Roboto dipakai untuk semuanya).
- ❌ Ilustrasi mascot 3D atau flat-illustration generik di empty state.
- ❌ Animasi bouncy/spring berlebihan pada tiap interaksi kecil.
- ❌ Badge/status berwarna solid terang (hijau/merah terang khas dashboard SaaS).

## 10. Ringkasan Rasa Desain

Kalau harus dirangkum dalam satu kalimat: **Verso terasa seperti aplikasi katalog perpustakaan modern yang dijalankan oleh seseorang yang serius soal membaca** — hangat lewat warna kertas, tegas lewat tipografi editorial, dan tenang lewat gerakan yang presisi, bukan lucu.