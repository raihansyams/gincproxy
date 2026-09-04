# gincproxy

Proxy generik ala **corsproxy.io** — nerima parameter `?url=`, ambil isinya
dari server (bukan dari browser), jadi bebas CORS.

## Isi folder
- `api/proxy.js` — Vercel Function (format non-framework `export default { fetch(request) {...} }`)
- `vercel.json` — rewrite supaya bisa diakses dari root domain juga, bukan cuma `/api/proxy`
- `package.json` — penanda `"type": "module"` supaya sintaks di atas jalan

## Cara pakai (sama seperti corsproxy.io dulu)

```
https://gincproxy.vercel.app/?url=<url tujuan, HARUS di-encode>
https://gincproxy.vercel.app/api/proxy?url=<url tujuan, HARUS di-encode>
```

Contoh persis punyamu:
```
https://gincproxy.vercel.app/?url=https%3A%2F%2Fenka.network%2Fapi%2Fuid%2F8102988371
```

Di JavaScript, cara encode yang benar:
```js
const target = "https://enka.network/api/uid/8102988371";
const proxied = "https://gincproxy.vercel.app/?url=" + encodeURIComponent(target);
```
(Jangan tempel URL tujuan mentah-mentah tanpa `encodeURIComponent` — nanti `&`
atau `?` di dalamnya bikin parsing query string berantakan.)

## Allowlist host

Supaya proxy ini tidak dipakai orang lain jadi proxy umum/anonim (yang bisa
menghabiskan kuota atau tagihan Vercel-mu), host tujuan dibatasi di `api/proxy.js`:

```js
const ALLOWED_HOSTS = [
  "enka.network",
];
```

Kalau nanti butuh proxy ke situs lain juga, tinggal tambah ke array itu, contoh:
```js
const ALLOWED_HOSTS = [
  "enka.network",
  "api.ambr.top",
];
```
Kalau kamu memang mau proxy ini benar-benar terbuka untuk URL apa saja (persis
seperti corsproxy.io asli, tanpa batasan), hapus saja pengecekan
`ALLOWED_HOSTS` di `api/proxy.js` — tapi risikonya proxy-mu bisa disalahgunakan
siapa saja yang menemukan URL-nya.

## Cara deploy ke Vercel

**Opsi A — lewat CLI:**
```bash
npm i -g vercel
cd gincproxy
vercel deploy --prod
```

**Opsi B — lewat dashboard Vercel:**
1. Push folder ini ke repo GitHub baru.
2. Di dashboard Vercel: **Add New → Project → Import** repo tersebut.
3. Framework Preset: *Other* (otomatis terdeteksi), langsung **Deploy**.

## Tes setelah deploy

```bash
curl "https://gincproxy.vercel.app/?url=https%3A%2F%2Fenka.network%2Fapi%2Fuid%2F8102988371"
```
Harus balas JSON data pemain dari Enka (ada field `playerInfo` di dalamnya).

## Update ke app yang sudah live (ginamecard.vercel.app)

Di app lamamu, cari baris yang memanggil `corsproxy.io/?url=...` dan ganti
domainnya saja jadi `gincproxy.vercel.app/?url=...` (format parameternya sama
persis, jadi biasanya cukup ganti satu baris/satu constant URL).
