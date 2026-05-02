# Spesifikasi Teknis — BOIS
## Battalion Organizational Intelligence System

**Versi Dokumen:** 2.0
**Status:** Draft
**Audience:** Developer, System Architect, Tech Lead

---

## Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Deployment & Network Topology](#2-deployment--network-topology)
3. [Struktur Database](#3-struktur-database)
4. [Public API](#4-public-api)
5. [Admin API](#5-admin-api)
6. [Business Logic](#6-business-logic)
7. [Autentikasi & Otorisasi](#7-autentikasi--otorisasi)
8. [Frontend Architecture](#8-frontend-architecture)
9. [File & Media Management](#9-file--media-management)
10. [Error Handling & Logging](#10-error-handling--logging)
11. [Panduan Setup & Development](#11-panduan-setup--development)
12. [Conventions & Code Style](#12-conventions--code-style)

---

## 1. Arsitektur Sistem

### Prinsip Utama

BOIS dibangun di atas empat prinsip yang tidak boleh dilanggar selama development:

**1. Hard Separation** — Public dan Admin adalah dua aplikasi berbeda. Tidak ada shared routing, tidak ada shared bundle, tidak ada shared middleware antara keduanya.

**2. Immutable History** — Data jabatan tidak pernah di-overwrite. Setiap perubahan menghasilkan record baru. Tidak ada hard delete pada data utama.

**3. Least Privilege** — Public API hanya bisa baca. Admin API hanya bisa diakses dari jaringan terpercaya. Setiap role hanya punya akses minimum yang diperlukan.

**4. Audit-Ready** — Setiap perubahan data di Admin API dicatat: siapa, apa, kapan, dari mana.

---

### Diagram Komponen

```
Internet (Public)                    Jaringan Internal / VPN
─────────────────────                ──────────────────────────────

┌─────────────────────┐              ┌──────────────────────────┐
│   bois-public       │              │   bois-admin             │
│   (Next.js SSG/SSR) │              │   (React SPA / Vite)     │
│   bois.satuan.mil   │              │   admin.satuan.internal  │
└──────────┬──────────┘              └────────────┬─────────────┘
           │ HTTPS                                │ HTTPS
           │ GET only                             │ All methods + JWT
           │                                      │
┌──────────▼──────────┐              ┌────────────▼─────────────┐
│   bois-api-public   │              │   bois-api-admin         │
│   Node.js (NestJS)  │              │   Node.js (NestJS)       │
│   api.satuan.mil    │              │   IP Whitelist Only      │
│   Rate limited      │              │   JWT required           │
│   Read-only routes  │              │   All CRUD routes        │
└──────────┬──────────┘              └────────────┬─────────────┘
           │                                      │
           └──────────────┬───────────────────────┘
                          │
              ┌───────────▼───────────┐
              │     PostgreSQL        │
              │     (Single DB)       │
              ├───────────────────────┤
              │     S3 / MinIO        │
              │     (Media Storage)   │
              └───────────────────────┘
```

### Keputusan Arsitektur Kritis

**Mengapa dua API terpisah, bukan satu API dengan middleware auth?**

Dengan satu API, endpoint admin tetap terdaftar di routing table dan dapat di-probe meskipun terlindungi auth. Memisahkan API secara fisik memastikan endpoint admin tidak pernah merespons dari jaringan publik, bahkan dengan request yang tidak terautentikasi sekalipun.

**Mengapa Admin Dashboard bukan route `/admin` di Next.js?**

Next.js me-bundle semua route dan komponen dalam satu manifest. Route `/admin` yang tersembunyi di balik middleware masih mengekspos nama halaman, struktur komponen, dan potensi endpoint di bundle JavaScript publik. Memisahkan menjadi SPA berbeda memastikan zero leak dari sisi public website.

---

## 2. Deployment & Network Topology

### Topologi Jaringan

```
         [Internet]
              │
    ┌─────────▼──────────┐
    │   Reverse Proxy     │  (Nginx / Caddy)
    │   bois.satuan.mil   │
    └─────────┬───────────┘
              │
    ┌─────────▼───────────┐      ┌────────────────────────────┐
    │  bois-public        │      │  Internal Network / VPN    │
    │  :3000              │      │  ┌─────────────────────┐   │
    └─────────────────────┘      │  │  bois-admin  :3001  │   │
    ┌─────────────────────┐      │  └──────────┬──────────┘   │
    │  bois-api-public    │      │  ┌──────────▼──────────┐   │
    │  :4000              │      │  │  bois-api-admin     │   │
    └─────────────────────┘      │  │  :4001              │   │
                                 │  └─────────────────────┘   │
                                 └────────────────────────────┘
```

### Aturan Firewall

| Source | Destination | Port | Status |
|--------|------------|------|--------|
| Internet | bois-public (:3000) | 80/443 | ALLOW |
| Internet | bois-api-public (:4000) | 443 | ALLOW |
| Internet | bois-admin (:3001) | ANY | **BLOCK** |
| Internet | bois-api-admin (:4001) | ANY | **BLOCK** |
| Internal/VPN | bois-admin (:3001) | 443 | ALLOW |
| Internal/VPN | bois-api-admin (:4001) | 443 | ALLOW |
| bois-public | bois-api-admin | ANY | **BLOCK** |

### Domain Convention

```
bois.satuan.mil             → Public Website
api.satuan.mil              → Public API
admin.satuan.internal       → Admin Dashboard (internal only)
api-admin.satuan.internal   → Admin API (internal only)
```

---

## 3. Struktur Database

Database tunggal digunakan bersama oleh kedua API dengan credential berbeda:

```sql
-- User untuk Public API: read-only
CREATE USER bois_public WITH PASSWORD '...';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bois_public;

-- User untuk Admin API: full access
CREATE USER bois_admin WITH PASSWORD '...';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bois_admin;
```

### Schema Overview

```sql
positions       -- Struktur jabatan / posisi dalam organisasi
officers        -- Data personel / prajurit
assignments     -- Relasi jabatan & histori penugasan (CORE)
posts           -- Berita, artikel, pengumuman
media           -- File, foto, video dokumentasi
users           -- Akun admin sistem
audit_logs      -- Log setiap perubahan data
```

---

### Tabel: `positions`

```sql
CREATE TABLE positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,           -- e.g. "Komandan Batalyon"
  code          VARCHAR(50) UNIQUE,              -- e.g. "DANYON"
  parent_id     UUID REFERENCES positions(id),   -- NULL jika jabatan teratas
  level         INTEGER NOT NULL DEFAULT 0,      -- Kedalaman hierarki (0 = root)
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

Catatan:
- `parent_id` membentuk struktur tree rekursif
- Jabatan tidak pernah didelete, cukup `is_active = FALSE`

---

### Tabel: `officers`

```sql
CREATE TABLE officers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nrp           VARCHAR(20) UNIQUE NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  rank          VARCHAR(100) NOT NULL,
  photo_url     VARCHAR(500),
  status        VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'transferred', 'retired')),
  joined_at     DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `assignments` (CORE)

Jantung sistem. Menyimpan seluruh histori penugasan jabatan — tidak ada record yang dihapus.

```sql
CREATE TABLE assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id    UUID NOT NULL REFERENCES officers(id),
  position_id   UUID NOT NULL REFERENCES positions(id),
  start_date    DATE NOT NULL,
  end_date      DATE,                            -- NULL = masih aktif menjabat
  notes         TEXT,                            -- Nomor SK, keterangan, dll
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assignments_position ON assignments(position_id);
CREATE INDEX idx_assignments_officer  ON assignments(officer_id);
CREATE INDEX idx_assignments_active   ON assignments(position_id)
  WHERE end_date IS NULL;

-- Constraint: satu jabatan hanya boleh punya satu pejabat aktif
CREATE UNIQUE INDEX idx_one_active_per_position
  ON assignments(position_id)
  WHERE end_date IS NULL;
```

Aturan bisnis:
- Satu jabatan hanya boleh memiliki **satu record aktif** (`end_date IS NULL`) dalam satu waktu — dijamin oleh partial unique index di atas
- Record tidak pernah didelete, hanya ditutup dengan mengisi `end_date`

---

### Tabel: `posts`

```sql
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(500) NOT NULL,
  slug          VARCHAR(500) UNIQUE NOT NULL,
  content       TEXT NOT NULL,
  excerpt       TEXT,
  category      VARCHAR(100)
                CHECK (category IN ('latihan', 'operasi', 'upacara', 'umum')),
  cover_image   VARCHAR(500),
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft', 'published', 'archived')),
  published_at  TIMESTAMPTZ,
  author_id     UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_status    ON posts(status);
CREATE INDEX idx_posts_category  ON posts(category);
CREATE INDEX idx_posts_published ON posts(published_at DESC);
```

---

### Tabel: `media`

```sql
CREATE TABLE media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_type     VARCHAR(20)
                CHECK (file_type IN ('image', 'video', 'document')),
  mime_type     VARCHAR(100),
  file_size     BIGINT,
  storage_path  VARCHAR(500) NOT NULL,
  public_url    VARCHAR(500),
  post_id       UUID REFERENCES posts(id),
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,          -- bcrypt, min cost 12
  role          VARCHAR(50) DEFAULT 'editor'
                CHECK (role IN ('superadmin', 'admin', 'editor', 'viewer')),
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES users(id),
  action        VARCHAR(50) NOT NULL,            -- CREATE | UPDATE | DELETE | LOGIN | LOGOUT
  entity        VARCHAR(100) NOT NULL,
  entity_id     UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor    ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity   ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created  ON audit_logs(created_at DESC);
```

Audit log tidak pernah diedit atau didelete oleh siapapun, termasuk superadmin.

---

## 4. Public API

### Base URL
```
https://api.satuan.mil/v1
```

### Karakteristik
- Semua endpoint hanya GET (read-only)
- Tidak ada endpoint yang memerlukan autentikasi
- Rate limit: 60 request/menit per IP
- Response di-cache dengan TTL yang sesuai

### Endpoints

#### Positions (Jabatan)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/positions` | Seluruh jabatan dalam struktur tree |
| GET | `/positions/:id` | Detail satu jabatan |
| GET | `/positions/:id/current-officer` | Pejabat yang saat ini menjabat |
| GET | `/positions/:id/history` | Seluruh histori pejabat pada jabatan ini |

#### Officers (Personel)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/officers` | Daftar personel aktif |
| GET | `/officers/:id` | Detail satu personel |
| GET | `/officers/:id/assignments` | Riwayat seluruh jabatan personel ini |

#### Posts (Berita)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/posts` | Daftar berita published |
| GET | `/posts/:slug` | Detail satu berita |

Query params untuk `/posts`: `?category=latihan&year=2024&page=1&limit=10`

#### Search

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/search` | Pencarian global |

Query params: `?q=keyword&type=officers|positions|posts|all`

---

## 5. Admin API

### Base URL
```
https://api-admin.satuan.internal/v1
```

### Karakteristik
- Hanya dapat diakses dari IP whitelist (jaringan internal / VPN)
- Setiap request wajib membawa JWT di header `Authorization: Bearer <token>`
- Setiap aksi mutasi (POST/PUT/PATCH/DELETE) menulis ke `audit_logs`
- Tidak ada endpoint yang terbuka tanpa autentikasi, termasuk endpoint health check publik

### Endpoints

#### Auth

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login, return access + refresh token | — |
| POST | `/auth/logout` | Invalidate refresh token | Any |
| GET | `/auth/me` | Profil user aktif | Any |
| POST | `/auth/refresh` | Perbarui access token | Any |

#### Positions

| Method | Endpoint | Deskripsi | Min Role |
|--------|----------|-----------|----------|
| GET | `/positions` | Daftar jabatan (tree, termasuk nonaktif) | viewer |
| GET | `/positions/:id` | Detail jabatan | viewer |
| GET | `/positions/:id/history` | Histori pejabat | viewer |
| POST | `/positions` | Buat jabatan baru | admin |
| PUT | `/positions/:id` | Update jabatan | admin |
| PATCH | `/positions/:id/deactivate` | Nonaktifkan jabatan | admin |

#### Officers

| Method | Endpoint | Deskripsi | Min Role |
|--------|----------|-----------|----------|
| GET | `/officers` | Daftar semua personel | viewer |
| GET | `/officers/:id` | Detail personel | viewer |
| POST | `/officers` | Tambah personel | admin |
| PUT | `/officers/:id` | Update data personel | admin |
| PATCH | `/officers/:id/status` | Update status personel | admin |

#### Assignments

| Method | Endpoint | Deskripsi | Min Role |
|--------|----------|-----------|----------|
| GET | `/assignments/active` | Semua penugasan aktif | viewer |
| GET | `/assignments/history` | Seluruh histori | viewer |
| POST | `/assignments` | Buat penugasan baru (rotasi jabatan) | admin |
| PATCH | `/assignments/:id/close` | Tutup penugasan manual | admin |

**Request body POST `/assignments`:**
```json
{
  "officer_id": "uuid",
  "position_id": "uuid",
  "start_date": "2025-01-15",
  "notes": "Berdasarkan SK No. XXX/2025"
}
```

#### Posts (CMS)

| Method | Endpoint | Deskripsi | Min Role |
|--------|----------|-----------|----------|
| GET | `/posts` | Daftar semua berita (termasuk draft) | viewer |
| GET | `/posts/:id` | Detail berita | viewer |
| POST | `/posts` | Buat berita baru | editor |
| PUT | `/posts/:id` | Update berita | editor |
| PATCH | `/posts/:id/publish` | Publish berita | editor |
| PATCH | `/posts/:id/archive` | Arsipkan berita | editor |
| DELETE | `/posts/:id` | Hapus berita (soft delete) | admin |

#### Media

| Method | Endpoint | Deskripsi | Min Role |
|--------|----------|-----------|----------|
| GET | `/media` | Daftar semua media | viewer |
| POST | `/media/upload` | Upload file | editor |
| DELETE | `/media/:id` | Hapus file | admin |

#### Users

| Method | Endpoint | Deskripsi | Min Role |
|--------|----------|-----------|----------|
| GET | `/users` | Daftar user admin | superadmin |
| POST | `/users` | Buat akun admin baru | superadmin |
| PUT | `/users/:id` | Update akun | superadmin |
| PATCH | `/users/:id/deactivate` | Nonaktifkan akun | superadmin |

#### Audit Logs

| Method | Endpoint | Deskripsi | Min Role |
|--------|----------|-----------|----------|
| GET | `/audit-logs` | Riwayat seluruh perubahan | admin |

Query params: `?actor_id=&entity=&from=&to=&page=1&limit=50`

---

## 6. Business Logic

### 6.1 Assignment Rotation (Pergantian Jabatan)

Saat `POST /assignments` dipanggil, Admin API menjalankan alur berikut dalam satu transaksi database:

```
1. Validasi: officer_id dan position_id harus exist dan aktif
2. Validasi: start_date tidak boleh sebelum start_date assignment aktif sebelumnya
3. BEGIN TRANSACTION
   a. Cari assignment aktif (end_date IS NULL) untuk position_id ini
   b. Jika ada → UPDATE end_date = start_date_baru - 1 hari
   c. INSERT assignment baru dengan end_date = NULL
   d. Tulis ke audit_log
4. COMMIT
5. Return assignment baru + data officer + data position
```

Seluruh operasi ini atomic. Jika salah satu langkah gagal, tidak ada perubahan yang tersimpan.

### 6.2 Validasi Integritas Jabatan

- Satu jabatan hanya boleh punya satu record aktif — dijamin oleh partial unique index
- Posisi tidak dapat dinonaktifkan jika masih memiliki pejabat aktif
- Officer dengan status `transferred` atau `retired` tidak dapat dibuat assignment baru

### 6.3 Slug Generation untuk Posts

```
slug = title
     → to lowercase
     → ganti spasi dan karakter non-alphanumeric dengan '-'
     → hapus tanda hubung berulang
     → jika slug sudah exist → tambahkan suffix '-YYYYMMDD'
```

### 6.4 Soft Delete

Tidak ada hard delete untuk data utama:

| Entitas | Mekanisme |
|---------|-----------|
| `positions` | `is_active = FALSE` |
| `officers` | `status = 'transferred'` atau `'retired'` |
| `posts` | `status = 'archived'` |
| `users` | `is_active = FALSE` |
| `assignments` | Dilarang — record hanya ditutup via `end_date` |
| `audit_logs` | Dilarang sepenuhnya |

### 6.5 Account Lockout

Setelah 5 kali gagal login berturut-turut, akun dikunci selama 30 menit. Setiap percobaan login yang gagal tetap dicatat di `audit_logs`.

---

## 7. Autentikasi & Otorisasi

### JWT Configuration

```
Algorithm            : HS256
Access Token Expiry  : 15 menit
Refresh Token Expiry : 8 jam (satu shift kerja)
Password Hashing     : bcrypt, cost factor 12
```

Refresh token disimpan di database (tabel `refresh_tokens`) dan dapat direvoke. Saat logout, refresh token dihapus dari database sehingga tidak dapat digunakan kembali.

### Role & Permission Matrix

| Permission | superadmin | admin | editor | viewer |
|---|:---:|:---:|:---:|:---:|
| Kelola akun user | ✅ | ❌ | ❌ | ❌ |
| Lihat audit log | ✅ | ✅ | ❌ | ❌ |
| Kelola jabatan & posisi | ✅ | ✅ | ❌ | ❌ |
| Kelola personel | ✅ | ✅ | ❌ | ❌ |
| Kelola assignment / rotasi | ✅ | ✅ | ❌ | ❌ |
| Buat & edit berita | ✅ | ✅ | ✅ | ❌ |
| Upload & hapus media | ✅ | ✅ | ✅ | ❌ |
| Akses read-only seluruh data | ✅ | ✅ | ✅ | ✅ |

---

## 8. Frontend Architecture

### `bois-public` (Next.js)

Dibangun dengan Next.js menggunakan kombinasi SSG dan ISR untuk performa dan SEO optimal.

```
bois-public/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Beranda
│   │   ├── berita/
│   │   │   ├── page.tsx        # Daftar berita
│   │   │   └── [slug]/page.tsx # Detail berita
│   │   ├── struktur/
│   │   │   └── page.tsx        # Visualisasi org chart
│   │   └── personel/
│   │       └── [id]/page.tsx   # Profil personel
│   ├── components/
│   │   ├── ui/                 # Komponen dasar
│   │   ├── org-chart/          # React Flow visualisasi
│   │   └── layout/             # Header, footer
│   ├── lib/
│   │   ├── api.ts              # HTTP client ke Public API
│   │   └── utils.ts
│   └── types/
└── next.config.ts
```

Catatan: tidak ada direktori `admin`, tidak ada komponen auth, tidak ada reference ke Admin API URL di seluruh codebase ini.

### `bois-admin` (React SPA)

Dibangun dengan Vite + React. SPA murni yang hanya dapat diakses dari jaringan internal.

```
bois-admin/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx       # Satu-satunya halaman tanpa auth guard
│   │   ├── DashboardPage.tsx
│   │   ├── positions/
│   │   ├── officers/
│   │   ├── assignments/
│   │   ├── posts/
│   │   ├── media/
│   │   └── audit/
│   ├── components/
│   │   ├── ui/
│   │   ├── AuthGuard.tsx       # Wrapper semua protected routes
│   │   └── layout/
│   ├── lib/
│   │   ├── api.ts              # HTTP client ke Admin API
│   │   ├── auth.ts             # Token management
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   └── store/                  # Zustand
└── vite.config.ts
```

Seluruh halaman kecuali `LoginPage` dibungkus `AuthGuard`. Jika token tidak valid, redirect langsung ke `/login` — tidak ada halaman yang dapat diakses tanpa autentikasi.

### Visualisasi Struktur Organisasi

Menggunakan **React Flow** (di `bois-public`) untuk rendering diagram hierarki:

```typescript
type PositionNode = {
  id: string
  type: 'positionCard'
  data: {
    positionName: string
    officerName: string | null
    rank: string | null
    photoUrl: string | null
  }
  position: { x: number; y: number }
}
```

Layout tree di-generate dari data `positions` menggunakan BFS berdasarkan `parent_id`.

---

## 9. File & Media Management

### Upload Flow (Admin API)

```
Admin → POST /media/upload (multipart/form-data)
      → Validasi tipe & ukuran file
      → Generate nama unik: {uuid}.{ext}
      → Upload ke S3 bucket: /{year}/{month}/{uuid}.{ext}
      → Simpan metadata ke tabel media
      → Return: { id, public_url }
```

### Konfigurasi

```
Max size gambar  : 10 MB
Max size video   : 100 MB
Max size dokumen : 20 MB
Format gambar    : jpg, jpeg, png, webp
Format video     : mp4, mov
Format dokumen   : pdf
Path di S3       : /{year}/{month}/{uuid}.{ext}
```

### Akses File

File media di-serve langsung dari S3 dengan URL publik. Admin API tidak menjadi proxy untuk file — setelah upload, file diakses via URL S3/CDN secara langsung.

---

## 10. Error Handling & Logging

### Format Response API (berlaku untuk kedua API)

**Sukses:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ACTIVE_ASSIGNMENT",
    "message": "Jabatan ini sudah memiliki pejabat aktif",
    "details": []
  }
}
```

### HTTP Status Codes

| Code | Kondisi |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 401 | Token tidak ada atau expired |
| 403 | Role tidak cukup atau akses dari IP yang tidak diizinkan |
| 404 | Resource tidak ditemukan |
| 409 | Conflict (constraint violation) |
| 429 | Rate limit exceeded (Public API) |
| 500 | Internal server error |

### Internal Error Codes

| Code | Deskripsi |
|------|-----------|
| `DUPLICATE_ACTIVE_ASSIGNMENT` | Jabatan sudah memiliki pejabat aktif |
| `OFFICER_INACTIVE` | Personel tidak aktif, tidak dapat ditugaskan |
| `POSITION_INACTIVE` | Jabatan tidak aktif |
| `INVALID_DATE_RANGE` | Tanggal tidak valid atau overlap |
| `ACCOUNT_LOCKED` | Akun terkunci karena terlalu banyak percobaan login gagal |
| `TOKEN_EXPIRED` | JWT expired |
| `INSUFFICIENT_ROLE` | Role tidak memiliki permission untuk aksi ini |

---

## 11. Panduan Setup & Development

### Prerequisites

```
Node.js    >= 20.x
npm        >= 10.x
PostgreSQL >= 15
```

### Struktur Repositori

```
bois/
├── bois-public/        # Public website
├── bois-admin/         # Admin dashboard
├── bois-api-public/    # Public API
├── bois-api-admin/     # Admin API
└── bois-db/            # Skema & migrasi database
    └── migrations/
        ├── 001_create_positions.sql
        ├── 002_create_officers.sql
        ├── 003_create_assignments.sql
        ├── 004_create_posts.sql
        ├── 005_create_media.sql
        ├── 006_create_users.sql
        ├── 007_create_audit_logs.sql
        └── 008_create_refresh_tokens.sql
```

### Environment Variables

**`bois-api-public/.env`**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://bois_public:password@localhost:5432/bois_db
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

**`bois-api-admin/.env`**
```env
NODE_ENV=development
PORT=4001
DATABASE_URL=postgresql://bois_admin:password@localhost:5432/bois_db
JWT_SECRET=min-32-char-secret-key-here
JWT_REFRESH_SECRET=another-min-32-char-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=8h
ALLOWED_IPS=127.0.0.1,10.0.0.0/8,192.168.0.0/16
S3_ENDPOINT=https://s3.your-provider.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=bois-media
```

**`bois-public/.env.local`**
```env
NEXT_PUBLIC_API_URL=https://api.satuan.mil/v1
```

**`bois-admin/.env`**
```env
VITE_ADMIN_API_URL=https://api-admin.satuan.internal/v1
```

### Setup Development

```bash
# 1. Setup database
cd bois-db
psql -U postgres -c "CREATE DATABASE bois_db"
psql -U postgres -c "CREATE USER bois_public WITH PASSWORD 'dev_password'"
psql -U postgres -c "CREATE USER bois_admin WITH PASSWORD 'dev_password'"
npm run migrate

# 2. Jalankan Admin API
cd bois-api-admin
npm install && npm run dev    # berjalan di :4001

# 3. Jalankan Public API
cd bois-api-public
npm install && npm run dev    # berjalan di :4000

# 4. Jalankan Public Website
cd bois-public
npm install && npm run dev    # berjalan di :3000

# 5. Jalankan Admin Dashboard
cd bois-admin
npm install && npm run dev    # berjalan di :3001
```

---

## 12. Conventions & Code Style

### Penamaan

| Konteks | Convention | Contoh |
|---------|-----------|--------|
| Database table | snake_case | `audit_logs` |
| Database column | snake_case | `created_at` |
| API endpoint | kebab-case | `/current-officer` |
| TypeScript type/interface | PascalCase | `PositionNode` |
| React component | PascalCase | `OrgChartCard` |
| Fungsi / variable | camelCase | `getActiveAssignment` |
| Konstanta | UPPER_SNAKE | `MAX_FILE_SIZE` |
| Env variable | UPPER_SNAKE | `JWT_SECRET` |

### Git Commit Convention

Format: `type(scope): deskripsi singkat`

| Type | Digunakan untuk |
|------|----------------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Perubahan dokumentasi |
| `refactor` | Refaktor tanpa perubahan perilaku |
| `test` | Penambahan / perbaikan test |
| `chore` | Maintenance, update dependency |
| `security` | Perbaikan keamanan |

Contoh:
```
feat(assignment): tambah validasi duplikasi jabatan aktif
fix(auth): perbaiki refresh token tidak terinvalidasi saat logout
security(api-admin): tambah IP whitelist middleware
docs(spec): update deployment topology diagram
```

### Testing Priorities

Urutan prioritas pengujian yang harus diselesaikan sebelum release:

1. **Unit test** — business logic assignment rotation (termasuk edge case tanggal overlap)
2. **Unit test** — auth middleware: JWT validation, role check, IP whitelist
3. **Integration test** — alur pergantian jabatan end-to-end via Admin API
4. **Integration test** — semua endpoint Public API mengembalikan data yang benar
5. **Security test** — verifikasi bahwa Admin API menolak seluruh request dari IP eksternal
6. **Security test** — verifikasi bahwa Public API tidak memiliki endpoint mutasi yang aktif

---

## Changelog

| Versi | Tanggal | Deskripsi |
|-------|---------|-----------|
| 2.0 | 2025-07 | Arsitektur diubah ke dual-app separation penuh |
| 1.0 | 2025-07 | Initial specification draft |

---

*Dokumen ini bersifat living document dan akan diperbarui seiring perkembangan proyek.*
