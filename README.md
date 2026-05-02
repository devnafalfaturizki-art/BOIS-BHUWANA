# BOIS — Battalion Organizational Intelligence System

> **"Data organisasi tidak boleh hilang — hanya berubah status, dan sejarahnya harus tetap tercatat."**

BOIS adalah sistem informasi manajemen satuan batalyon berbasis web yang dirancang untuk mengelola struktur organisasi, personel, berita, dan dokumentasi secara dinamis dengan sistem histori otomatis dan audit-ready.

---

## Mengapa BOIS?

Sistem manajemen satuan konvensional sering kali memiliki masalah mendasar: **data lama tertimpa saat terjadi pergantian jabatan**. BOIS hadir dengan pendekatan *event-based organizational tracking* — setiap perubahan menghasilkan record baru, tidak ada data yang dihapus.

---

## Arsitektur: Dua Aplikasi, Bukan Satu

BOIS **bukan** satu aplikasi dengan halaman admin tersembunyi di balik login. BOIS terdiri dari empat komponen independen yang di-deploy secara terpisah:

```
┌───────────────────────┐       ┌────────────────────────┐
│    PUBLIC WEBSITE     │       │    ADMIN DASHBOARD     │
│   bois.satuan.mil     │       │  Jaringan internal/VPN │
│  (Next.js / SSG)      │       │     (React SPA)        │
└──────────┬────────────┘       └───────────┬────────────┘
           │                                │
           │ HTTPS (read-only)              │ HTTPS (full access)
           │                                │
┌──────────▼────────────┐       ┌───────────▼────────────┐
│    PUBLIC API         │       │     ADMIN API          │
│  api.satuan.mil       │       │  api-admin.internal    │
│  (Node.js, read-only) │       │  (Node.js, IP whitelist│
└──────────┬────────────┘       └───────────┬────────────┘
           │                                │
           └────────────────┬───────────────┘
                            │
                 ┌──────────▼──────────┐
                 │     PostgreSQL      │
                 │     S3 Storage      │
                 └─────────────────────┘
```

Public Website hanya tahu Public API. Admin Dashboard hanya tahu Admin API. Keduanya tidak berbagi codebase, tidak berbagi domain, dan tidak berbagi routing. Ini bukan preferensi gaya — ini keputusan keamanan.

---

## Kenapa Harus Dipisah Total?

Pendekatan "satu app, satu `/admin` route" memiliki risiko nyata:

- Bundle JavaScript public site bisa mengekspos nama endpoint, struktur router, atau komponen admin
- Satu celah XSS di halaman publik berpotensi menjangkau sesi admin
- Server-side rendering public site dan admin berbagi context yang tidak perlu
- Scope serangan menjadi luas — satu kerentanan bisa berdampak ke seluruh sistem

Dengan pemisahan penuh, blast radius setiap kerentanan terisolasi per komponen.

---

## Komponen Sistem

### `bois-public` — Public Website
Dapat diakses siapa saja, tanpa autentikasi, tanpa endpoint mutasi:
- Profil dan informasi umum satuan
- Berita & dokumentasi kegiatan
- Struktur organisasi & histori jabatan
- Pencarian personel dan berita

### `bois-admin` — Admin Dashboard
Akses dibatasi jaringan internal / VPN. Autentikasi wajib sebelum halaman apapun dimuat:
- Manajemen struktur organisasi dan jabatan
- Manajemen personel dan histori penugasan
- CMS berita dan media
- Audit log seluruh perubahan sistem

### `bois-api-public` — Public API
- Hanya menyediakan endpoint GET (read-only)
- Tidak ada endpoint POST/PUT/DELETE yang terbuka
- Rate limiting aktif untuk mencegah scraping
- Tidak mengetahui keberadaan Admin API

### `bois-api-admin` — Admin API
- Semua endpoint wajib JWT
- Hanya dapat diakses dari IP internal / whitelist
- Setiap aksi tercatat di audit log dengan actor dan timestamp
- Tidak pernah di-expose ke jaringan publik

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| Struktur Organisasi Dinamis | Hierarki jabatan dengan visualisasi interaktif tree/diagram |
| Sistem Historis Jabatan | Setiap pergantian pejabat tercatat otomatis, timeline lengkap |
| Manajemen Personel | Data prajurit, pangkat, NRP, dan riwayat penugasan |
| CMS Berita & Kegiatan | Editor rich text, kategori kegiatan, upload media |
| Dokumentasi & Media | Album kegiatan, foto/video dokumentasi |
| Search & Filter | Pencarian personel, jabatan, berita; filter tahun/kategori |

---

## Cara Kerja Sistem Jabatan

Setiap jabatan dikelola melalui tabel `assignments`:

```
Pejabat baru dilantik  →  INSERT record baru (start_date = hari ini)
Pejabat lama diganti   →  UPDATE end_date pada record lama
                       →  INSERT record baru untuk pejabat baru
```

Tidak ada data yang di-overwrite. Seluruh histori tersimpan permanen dan dapat diaudit.

---

## Tech Stack

| Komponen | Stack |
|----------|-------|
| Public Website | Next.js, Tailwind CSS, React Flow |
| Admin Dashboard | React (Vite), Tailwind CSS, React Query |
| Public API | Node.js (NestJS), REST |
| Admin API | Node.js (NestJS), REST |
| Database | PostgreSQL |
| Storage | S3-compatible (MinIO / Cloudflare R2) |
| Auth | JWT + Refresh Token, RBAC |

---

## Struktur Repositori

| Repo | Deskripsi |
|------|-----------|
| `bois-public` | Public website (Next.js) |
| `bois-admin` | Admin dashboard (React SPA) |
| `bois-api-public` | Public API — read-only |
| `bois-api-admin` | Admin API — full access, internal only |
| `bois-db` | Skema database, migrasi, seed |

---

## Rencana Pengembangan

- [ ] PWA / mobile app (Android & iOS via Capacitor)
- [ ] Export laporan PDF struktur organisasi
- [ ] Analytics dashboard satuan
- [ ] API integration antar satuan
- [ ] AI-assisted document & archive search

---

## Setup Development Environment

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### Install Dependencies
```bash
# Install for all components
npm install --prefix bois-api-public
npm install --prefix bois-api-admin
npm install --prefix bois-public
npm install --prefix bois-admin
```

### Setup Database
1. Start PostgreSQL:
   ```bash
   cd docker
   docker-compose up -d
   ```

2. Database akan tersedia di `localhost:5432` dengan:
   - DB: bois
   - User: postgres
   - Password: password

### Setup Components

#### 1. bois-api-public (Public API)
```bash
cd bois-api-public
cp .env.example .env
# Edit .env with database URL
npm run start:dev
```
Server akan berjalan di `http://localhost:4000`

#### 2. bois-api-admin (Admin API)
```bash
cd bois-api-admin
cp .env.example .env
# Edit .env with database URL and JWT secret
npm run start:dev
```
Server akan berjalan di `http://localhost:4001`

#### 3. bois-public (Public Website)
```bash
cd bois-public
npm run dev
```
Website akan berjalan di `http://localhost:3000`

#### 4. bois-admin (Admin Dashboard)
```bash
cd bois-admin
npm run dev
```
Dashboard akan berjalan di `http://localhost:3001`

### Environment Variables

#### bois-api-public/.env
```
DATABASE_URL=postgresql://bois_public:public_password@localhost:5432/bois
PORT=4000
```

#### bois-api-admin/.env
```
DATABASE_URL=postgresql://bois_admin:admin_password@localhost:5432/bois
JWT_SECRET=your_jwt_secret_here
PORT=4001
```

## Lisensi

Private / Internal Use Only

---

## Kontak

Project maintained by: **LANG LANG BHUWANA**
