# Frontend (Next.js)

Frontend untuk AI Screening Copilot.

Untuk setup project dari nol, pakai README utama di root:

- [`../README.md`](../README.md)

## Local Commands

```bash
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`.

## Environment

Buat `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=/backend-api
```

Nilai default tersebut membuat frontend call backend via Next.js rewrite (`/backend-api/*` -> `http://127.0.0.1:8000/api/*`).

## Production-style Local Run

Untuk skenario Cloudflare Tunnel (tanpa dev HMR issue):

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```
