// Seluruh data di bawah adalah contoh. Ganti sebelum membagikan undangan.
export const wedding = {
  bride: { short: 'Aruna', full: 'Aruna Kirana', parents: 'Bapak Surya & Ibu Ratna', role: 'Putri pertama', photo: '/photos/aruna.jpg' },
  groom: { short: 'Bima', full: 'Bima Pradipta', parents: 'Bapak Aditya & Ibu Laras', role: 'Putra kedua', photo: '/photos/bima.jpg' },
  date: '2027-06-20', timezone: 'Asia/Jakarta', offset: '+07:00', dateLabel: 'Minggu, 20 Juni 2027',
  ceremony: { label: 'Akad nikah', start: '08:00', end: '09:00' },
  reception: { label: 'Resepsi', start: '11:00', end: '14:00' },
  venue: 'Taman Sekar', address: 'Bandung, Jawa Barat', venueNote: 'Venue dan alamat masih contoh. Detail lokasi akan diperbarui.',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bandung%2C%20Jawa%20Barat',
  whatsapp: '', // Isi nomor internasional, misalnya 62812xxxxxxxx, untuk mengaktifkan pengiriman RSVP.
  gift: { enabled: false, bank: 'Nama bank', number: '', owner: 'Nama pemilik rekening' },
  gallery: [{ src: '/photos/prewedding-jalan-taman.jpg', caption: 'Langkah pertama bersama' }, { src: '/photos/prewedding-bangku-taman.jpg', caption: 'Bahagia yang sederhana' }, { src: '/photos/prewedding-gazebo.jpg', caption: 'Menuju selamanya' }],
  story: [ { year: '2021', title: 'Pertemuan kecil', text: 'Di antara banyak jalan, semesta mempertemukan kami. Obrolan sederhana menjadi awal cerita.' }, { year: '2024', title: 'Teman satu perjalanan', text: 'Kami belajar bahwa rumah bisa berupa seseorang. Bersama, perjalanan terasa lebih hangat.' }, { year: '2027', title: 'Petualangan selamanya', text: 'Kini kami memilih melangkah bersama. Dan kami ingin kamu menjadi bagian dari hari bahagia ini.' } ],
}
export type StopId = 'welcome' | 'couple' | 'event' | 'location' | 'story' | 'rsvp' | 'gift'
export const stops: { id: StopId; name: string; action: string; icon: string; x: number; y: number; color: number; subtitle: string }[] = [
  { id: 'welcome', name: 'Surat untukmu', action: 'Buka undangan', icon: '✉', x: 400, y: 1080, color: 0xe8b79e, subtitle: 'Awal perjalanan' },
  { id: 'couple', name: 'Dua karakter utama', action: 'Kenali mempelai', icon: '♥', x: 264, y: 860, color: 0xe5acb5, subtitle: `${wedding.bride.short} & ${wedding.groom.short}` },
  { id: 'event', name: 'Hari bahagia', action: 'Lihat jadwal', icon: '◷', x: 536, y: 860, color: 0xe6cd8b, subtitle: 'Akad & resepsi' },
  { id: 'location', name: 'Tempat kita bertemu', action: 'Lihat lokasi', icon: '⚑', x: 264, y: 620, color: 0xaecbc3, subtitle: 'Lokasi acara' },
  { id: 'story', name: 'Jejak cerita', action: 'Baca cerita', icon: '✦', x: 536, y: 620, color: 0xbdb8d9, subtitle: 'Kisah & kenangan' },
  { id: 'rsvp', name: 'Kursi untukmu', action: 'Isi buku tamu', icon: '▤', x: 264, y: 380, color: 0xe5be8e, subtitle: 'RSVP & ucapan' },
  { id: 'gift', name: 'Tanda kasih', action: 'Buka tanda kasih', icon: '◇', x: 536, y: 380, color: 0xb8c78e, subtitle: 'Hadiah pernikahan' },
]
