# Pencatatan Keuangan (Fullstack Web App + Prisma & Supabase)

Aplikasi web pencatatan keuangan yang dibangun dengan frontend **Vite + React** dan backend REST API **Node.js (`server.js`)** menggunakan **Prisma ORM** yang terhubung ke database **PostgreSQL (Supabase)** (`ncaihsawbnyzptxtstwy`). Aplikasi ini mendukung manajemen autentikasi/sesi pengguna (`app_users` dan `app_sessions`), operasi CRUD data secara permanen di database, serta endpoint query lanjutan (`where` / `count`).

## Teknologi Utama
* **Frontend:** React, Vite (`http://localhost:5173`)
* **Backend REST API:** Node.js (`server.js` di `http://localhost:3001`), Prisma Client
* **Database:** PostgreSQL via Supabase (`aws-0-ap-northeast-1.pooler.supabase.com`)

## Konfigurasi Environment (`.env`)
Pastikan file `.env` sudah terisi dengan kredensial proyek Supabase Anda (jangan unggah `.env` berisi kredensial asli ke repository publik):

```env
VITE_SUPABASE_URL=[https://ncaihsawbnyzptxtstwy.supabase.co](https://ncaihsawbnyzptxtstwy.supabase.co)
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
DATABASE_URL="postgresql://postgres.ncaihsawbnyzptxtstwy:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
DIRECT_URL="postgresql://postgres.ncaihsawbnyzptxtstwy:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?schema=public"
PORT=3001
```

## Menjalankan Aplikasi
1. Install dependensi:
   ```bash
   npm install
   ```
2. Generate Prisma Client dan sinkronkan skema database:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```
3. Jalankan backend API dan frontend Vite secara bersamaan:
   ```bash
   npm run dev:all
   ```

## Dokumentasi & Screenshot Tahapan
Simpan seluruh gambar tangkapan layar di folder `docs/screenshots/` dan sesuaikan nama filenya di bawah ini:

* **Prisma Generate, Push & Menjalankan Server (`dev:all`):**
  ![Prisma Generate dan Push](docs/screenshots/prisma-generate-push.png)
  ![Server API dan Vite Berjalan](docs/screenshots/dev-all-running.png)
* **Struktur & Data Tabel di Supabase (`app_users` & `app_sessions`):**
  ![Tabel app_users](docs/screenshots/supabase-app-users.png)
  ![Tabel app_sessions](docs/screenshots/supabase-app-sessions.png)
* **Pengujian CRUD & Persistensi Data Setelah Restart Server:**
  ![CRUD dan Persistensi Data](docs/screenshots/crud-persistence.png)
* **Tampilan Desktop:**
  ![Tampilan Desktop](docs/screenshots/desktop-view.png)
* **Tampilan Mobile:**
  ![Tampilan Mobile](docs/screenshots/mobile-view.png)