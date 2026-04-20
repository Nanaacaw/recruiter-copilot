# Cloudflare Access Setup (Recommended)

Panduan ini mengunci website agar tidak bisa diakses publik bebas, tanpa menaruh API key di frontend.

Target domain:

- `app.nanacaw.my.id` -> frontend (Next.js)
- `api.nanacaw.my.id` -> backend (FastAPI)

## Why this is better than frontend API key

- API key di browser tidak benar-benar rahasia.
- Cloudflare Access menambahkan login gate di edge sebelum request masuk ke origin lokal kamu.
- Cocok untuk local machine + Cloudflare Tunnel (tanpa VPS).

## Prerequisites

- Tunnel sudah sehat (`docker compose ps`, status connector `running`)
- Published application routes sudah ada di Tunnel:
  - `app.nanacaw.my.id` -> `http://host.docker.internal:3000`
  - `api.nanacaw.my.id` -> `http://host.docker.internal:8000`
- Domain sudah aktif di Cloudflare

## Step-by-step (Dashboard)

Catatan: per April 2026, menu bisa muncul sebagai:

- `Cloudflare One > Access controls > Applications`
- atau jalur serupa di dashboard Zero Trust

### 1) Protect frontend hostname (`app.nanacaw.my.id`)

1. Buka `Cloudflare One` dashboard.
2. Masuk ke `Access controls` -> `Applications`.
3. Klik `Add an application`.
4. Pilih `Self-hosted`.
5. Isi:
   - Application name: `recruiter-copilot-app`
   - Session duration: `24h` (atau sesuai kebijakan tim)
6. Tambah public hostname:
   - Domain: `nanacaw.my.id`
   - Subdomain: `app`
   - Path: `*`
7. Buat policy `Allow`:
   - Rule: `Include`
   - Selector:
     - `Emails` (recommended) atau `Emails ending in`
   - Value:
     - email tim HR/dev yang boleh akses
8. Simpan aplikasi.

### 2) Protect API hostname (`api.nanacaw.my.id`)

1. Ulangi langkah tambah aplikasi `Self-hosted`.
2. Isi:
   - Application name: `recruiter-copilot-api`
   - Hostname: `api.nanacaw.my.id`
3. Policy awal yang direkomendasikan:
   - `Allow` hanya email tim internal yang sama.
4. Simpan.

### 3) (Optional but strong) Enable default-deny for hostnames

Fitur ini mencegah hostname baru terbuka tanpa sengaja.

1. Buka `Zero Trust` -> `Access controls` -> `Access settings`.
2. Aktifkan `Require Cloudflare Access Protection`.
3. Konfirmasi perubahan.
4. Tambahkan exemption hanya untuk hostname yang memang harus public tanpa login.

Catatan: setelah aktif, hostname tanpa Access application akan otomatis diblokir.

## Recommended policy baseline

Untuk kedua aplikasi:

- Action: `Allow`
- Include: email internal saja
- Exclude: akun non-karyawan (kalau perlu)
- Hindari rule yang terlalu longgar seperti `Include Everyone`.

## Important app behavior note

Untuk aplikasi ini, paling aman frontend memanggil backend lewat path same-origin:

```env
NEXT_PUBLIC_API_URL=/backend-api
```

Alasan:

- browser hanya ke `app.nanacaw.my.id`
- Next.js proxy ke backend
- menghindari edge-case CORS/auth antar-subdomain saat `api.*` juga dilindungi Access

## Verification checklist

1. Buka mode incognito -> akses `https://app.nanacaw.my.id`.
2. Harus muncul halaman login Cloudflare Access.
3. Login dengan email yang diizinkan -> app terbuka normal.
4. Login dengan email di luar policy -> akses ditolak.
5. Cek screening/upload tetap jalan setelah login.
6. Opsional: akses langsung `https://api.nanacaw.my.id/docs`:
   - harus ikut login gate Access,
   - user yang tidak diizinkan harus ditolak.

## Troubleshooting

### A) App tetap publik tanpa login

- Cek apakah Access application sudah benar hostname (`app` vs `api` tertukar).
- Cek policy tidak mengandung `Include Everyone`.
- Pastikan host yang diuji memang proxied Cloudflare (orange cloud).

### B) Setelah Access aktif, frontend error fetch/CORS

- Gunakan `NEXT_PUBLIC_API_URL=/backend-api` (recommended untuk app ini).
- Restart frontend setelah ubah env.
- Pastikan backend CORS tetap mengizinkan origin frontend kalau ada direct API call.

### C) 502 dari Cloudflare

- Cek origin service di Tunnel route.
- Cek aplikasi lokal benar-benar listen di port:
  - frontend `3000`
  - backend `8000`
- Cek container log: `docker compose logs -f cloudflared`.

### D) 429 saat screening

- Ini biasanya limit AI provider (OpenAI-compatible/gateway), bukan Cloudflare Access.
- Kurangi batch size, pakai model lebih ringan, dan pastikan retry/backoff backend aktif.

## Official references

- Publish a self-hosted app with Access:  
  https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- Access policies (Allow / Exclude / Require / Bypass / Service Auth):  
  https://developers.cloudflare.com/cloudflare-one/access-controls/policies/
- Require Cloudflare Access Protection (default-deny):  
  https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/require-access-protection/
