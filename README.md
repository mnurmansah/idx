# IDX Swing — hasil build

Repo ini berisi **hasil build**, bukan sumbernya. Halaman dibangun di mesin lokal oleh
`tradingview-mcp/scripts/site/build.mjs`, disalin ke sini, lalu di-push. Tidak ada proses build
yang berjalan di sisi hosting.

## Alamat

| Status | Alamat | Keterangan |
|---|---|---|
| **Aktif** | https://loremipsumidx.netlify.app/ | Satu-satunya alamat yang dipakai. Terbit otomatis dari branch `main`. |
| Dimatikan | ~~https://mnurmansah.github.io/idx/~~ | GitHub Pages dinonaktifkan 21 Sep 2026 agar fokus di satu tempat. |

> **Penting: repo ini TETAP di-push setiap hari.** Netlify membangun DARI repo ini, jadi
> menghentikan push berarti menghentikan pembaruan situs. Yang dimatikan hanya layanan GitHub
> Pages (Settings → Pages → Source: None), bukan repo-nya dan bukan langkah deploy di `scan_all`.

Seluruh tautan di halaman bersifat **relatif**, sehingga benar baik disajikan dari akar domain
maupun dari sub-folder. Jangan memasukkan jalur absolut.

Tiap halaman menampilkan sendiri ia sedang disajikan dari mana, di bar atas dan di footer. Kalau
suatu saat Pages tersaji lagi dari cache peramban, halamannya menandai diri sebagai **Arsip ·
tidak diperbarui** dan menautkan ke alamat Netlify.

## Cara memperbarui

Otomatis lewat `IDX-RescanAfterClose`, Senin sampai Jumat pukul 17:15 WIB:
scan penuh → screener turunan → buku paper → build → salin ke repo ini → commit → push →
Netlify membangun sendiri satu sampai dua menit kemudian.

## Catatan teknis

- `netlify.toml` mengatur cache: huruf disimpan setahun, HTML dan JS selalu divalidasi ulang.
  Ini penting karena `scope-*.js` ditulis ulang tiap hari dengan nama berkas yang sama.
- `fonts/` berisi IBM Plex Serif subset latin yang di-host sendiri. Situs ini sengaja tidak
  memanggil CDN mana pun.
- `.nojekyll` sengaja dipertahankan kalau-kalau Pages perlu dihidupkan lagi.
- Berkas terbesar `scope-intra.js` (~7 MB) hanya diunduh saat halaman Per saham dibuka, dan di
  layar ponsel baru diunduh ketika panelnya digulir ke layar.
- Halaman `bandar.html` dan sebagian laporan di `riset.html` sengaja disembunyikan dari navigasi
  lewat penanda `sembunyi` di sumbernya; berkasnya tetap ada.

Harga tertunda kurang lebih 15 menit. Bukan rekomendasi investasi.
