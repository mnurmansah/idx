# IDX Swing — hasil build

Repo ini berisi **hasil build**, bukan sumbernya. Halaman dibangun di mesin lokal oleh
`tradingview-mcp/scripts/site/build.mjs`, disalin ke sini, lalu di-push. Tidak ada proses build
yang berjalan di sisi hosting.

## Dua alamat, satu sumber

| Peran | Alamat | Keterangan |
|---|---|---|
| **Utama** | https://loremipsumidx.netlify.app/ | Alamat yang dipakai sehari-hari. Terbit otomatis dari branch `main`. |
| Cadangan | https://mnurmansah.github.io/idx/ | Tetap terbit tiap push. Dipakai kalau yang utama bermasalah. |

Isi keduanya **selalu kembar** karena sumbernya repo yang sama; yang berbeda hanya perannya.
Tiap halaman menampilkan sendiri ia sedang disajikan dari mana, di bar atas dan di footer.
Halaman cadangan menautkan ke alamat utama.

Seluruh tautan di halaman bersifat **relatif**, sehingga sama benarnya saat disajikan dari akar
domain (Netlify) maupun dari sub-folder `/idx/` (GitHub Pages). Jangan memasukkan jalur absolut.

## Cara memperbarui

Perbaruan berjalan otomatis lewat `IDX-RescanAfterClose`, Senin sampai Jumat pukul 17:15 WIB:
scan penuh → screener turunan → buku paper → build → salin ke repo ini → commit → push.
Netlify dan GitHub Pages ikut menerbitkan dari push yang sama.

## Catatan teknis

- `netlify.toml` mengatur cache: huruf disimpan setahun, HTML dan JS selalu divalidasi ulang.
  Ini penting karena `scope-*.js` ditulis ulang tiap hari dengan nama berkas yang sama.
- `fonts/` berisi IBM Plex Serif subset latin yang di-host sendiri. Situs ini sengaja tidak
  memanggil CDN mana pun.
- Berkas terbesar `scope-intra.js` (~7 MB) hanya diunduh saat halaman Per saham dibuka, dan di
  layar ponsel baru diunduh ketika panelnya digulir ke layar.

Harga tertunda kurang lebih 15 menit. Bukan rekomendasi investasi.
