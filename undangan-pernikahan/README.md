# Janji Sepixel

Undangan pernikahan berbentuk game retro 16-bit, dibuat terpisah dari proyek agency `../pixelverse`. Vue 3 + TypeScript + Phaser + Vite. Seluruh gambar dunia digambar melalui kode sehingga tidak membutuhkan unduhan aset gambar saat bermain.

## Menjalankan

```powershell
cd F:\CODE\16bit\undangan-pernikahan
npm install
npm run dev
```

Untuk mengakses dari HP di jaringan yang sama: `npm run dev -- --host 0.0.0.0`, lalu buka alamat Network yang ditampilkan Vite. Musik membutuhkan ketukan pengguna; tombol speaker menyalakannya.

```powershell
npm run build
npm run preview
npm test
```

`npm test` memakai Chrome yang sudah terpasang dan menjalankan server sendiri di port 5180. Hasil screenshot ada di `test-results/`.

## Cara bermain

1. Gerakkan karakter menggunakan joystick, ketuk jalan, atau gunakan WASD/panah setelah memfokuskan canvas.
2. Dekati amplop di gerbang. Tombol **BUKA** aktif setelah karakter masuk radius interaksi.
3. Tekan BUKA atau E untuk membaca. Game berhenti selama panel terbuka; Escape menutupnya.
4. Temukan gazebo mempelai, papan acara, peta, taman kenangan, meja RSVP, dan peti hadiah.
5. Buku Undangan hanya membuka kembali halaman yang telah ditemukan. Kompas memandu karakter berjalan ke checkpoint berikutnya, tanpa membuka konten secara otomatis.

Surat pertama harus dibuka sebelum checkpoint lainnya. Tidak ada combat, batas waktu, atau kondisi kalah. Posisi dan penemuan disimpan di localStorage perangkat, dengan prefix `janji-sepixel:` yang terpisah dari agency.

## Mengganti isi undangan

Edit `src/data/wedding.ts`:

- Nama pendek/lengkap, orang tua dan keterangan mempelai.
- Tanggal ISO, label tanggal, waktu akad/resepsi, dan offset zona waktu (contoh menggunakan WIB).
- Venue, alamat, catatan venue, tautan Google Maps yang sebenarnya.
- `bride.photo`, `groom.photo` dan `gallery[].src`: path foto seperti `/photos/pasangan.jpg`. Letakkan file di `public/photos/`. Foto kosong menggunakan ilustrasi.
- Cerita pasangan pada `story`.
- `whatsapp`: nomor tujuan dengan kode negara tanpa `+` atau spasi. Saat kosong, RSVP hanya menyimpan draf lokal. Setelah nomor diisi, tamu menyimpan draf lalu menekan tautan WhatsApp untuk mengirim sendiri.
- `gift`: isi data rekening dan ubah `enabled` menjadi `true` untuk menampilkan fitur salin rekening. Secara default dimatikan agar tidak menampilkan rekening fiktif.

Nama tamu dibaca dari URL, misalnya `/?to=Nadia%20%26%20Keluarga`. Nama ditampilkan sebagai teks, tidak dieksekusi sebagai HTML. Nama tersebut adalah personalisasi, bukan autentikasi.

**Data Aruna & Bima, cerita, venue, dan tanggal adalah contoh.** Peta bawaan menuju kota Bandung; ganti sebelum undangan dibagikan. Profil dan galeri memakai foto AI dari pasangan fiktif untuk demo.

## Foto demo

Lima foto dibuat dengan built-in image generation dan sudah dihubungkan dalam konfigurasi. Versi JPEG siap web berada di `public/photos/` (total sekitar 1,35 MB); PNG asli disimpan di `assets-source/photos/` dan tidak masuk build publik. Prompt serta catatan generasi tersedia di `assets-source/photos/PROMPTS.md`.

- `aruna.jpg`: potret mempelai wanita.
- `bima.jpg`: potret mempelai pria.
- `prewedding-jalan-taman.jpg`: berjalan bersama di taman.
- `prewedding-bangku-taman.jpg`: duduk bersama di bangku taman.
- `prewedding-gazebo.jpg`: pasangan di gazebo.

Foto galeri dimuat saat panel dibuka dengan lazy loading; potret hanya dimuat saat panel mempelai dibuka. Ganti file atau path konfigurasi ketika foto pasangan asli sudah tersedia.

## RSVP dan ucapan

Versi ini tidak memiliki backend. Draf RSVP/ucapan tersimpan hanya di browser tamu, tidak dikirim otomatis dan tidak dibagikan kepada tamu lain. WhatsApp menjadi opsi pengiriman ketika nomor tujuan telah dikonfigurasi. Untuk buku tamu bersama atau rekap otomatis, tambahkan layanan penyimpanan/API.

## Build dan aksesibilitas

- `dist/` adalah hasil static build, siap untuk hosting statis. Belum dipublikasikan.
- Phaser dimuat terpisah saat game dimulai. Bundel engine sekitar 320 KB gzip.
- Layout mendukung portrait, landscape, desktop, serta safe area HP.
- Panel mendukung fokus keyboard, focus trap, Escape, label form dan reduced motion. Canvas game tetap membutuhkan interaksi spasial; versi ini belum menyediakan pengalaman setara sepenuhnya untuk pengguna pembaca layar.
- Tipografi memakai Google Fonts dengan fallback sistem; game dan isi undangan tetap berjalan jika font eksternal tidak tersedia.
- Tombol kompas menjadi bantuan berjalan. Tombol kembali ke gerbang menyelesaikan situasi ketika pemain kesulitan menemukan jalan.

Tes browser mencakup pembukaan lewat kedekatan, semua tujuh rute, joystick/keyboard, pause panel, penyimpanan progres, unduh kalender, RSVP lokal, musik, serta ukuran HP kecil dan landscape.
