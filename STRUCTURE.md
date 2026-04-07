# humasbpkh — Final Structure Document
**Created:** 29 March 2026
**Status:** PLANNING (belum coding)

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MySQL |
| Cache | Redis |
| Auth | JWT + bcrypt |
| File Upload | Tus Protocol / Chunk Upload |
| Storage | Google Drive via Maton.ai |
| QR Code | qrcode.js |
| Laporan | PDFKit + json2csv |
| Config | .env |

## Tema Warna

```
Primary:    Hijau Daun  #2E7D32 / #4CAF50
Secondary:  Emas        #FFC107 / #FFD54F
Background: #FAFAFA (light) / #1B1B1B (dark)
Text:       #212121 (dark) / #FFFFFF (light)
```

## Port: 1987

---

## Login

- **Username:** agoeng
- **Password:** Admin123

---

## 3 Modul

| Modul | Nama | Deskripsi |
|-------|------|-----------|
| 🗂️ Arkiven | Arsip Dokumentasi | Upload & kelola arsip dokumentasi ke Google Drive |
| 📱 Sociapulse | Social Media Hub | All-in-one social media management (IG, FB, TikTok) |
| 📰 Pressport | Media Cetak | Upload & kelola media cetak (banner, kaos, spanduk, poster, dll) |

---

## Alur Aplikasi

```
Login
└── Dashboard Utama (Card 3 Modul + Statistik Ringkas)
    │
    ├── 🗂️ Arkiven
    ├── 📱 Sociapulse
    ├── 📰 Pressport
    ├── 📄 Laporan
    ├── ⚙️ Settings
    └── 📋 Activity Logs
```

---

## Database Schema (MySQL)

### Users & Auth

```sql
users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Settings

```sql
settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Settings keys:**
- `logo_url` — Logo BPKH (upload via settings)
- `humas_nama` — Nama Humas
- `humas_jabatan` — Jabatan Humas
- `humas_nip` — NIP Humas
- `pimpinan_nama` — Nama Pimpinan (diisi sebelum cetak)
- `pimpinan_jabatan` — Jabatan Pimpinan
- `pimpinan_nip` — NIP Pimpinan

### Activity Logs

```sql
activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  modul ENUM('arkiven','sociapulse','pressport','settings','auth'),
  action VARCHAR(50),
  description TEXT,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Dynamic Categories (Per Modul)

```sql
categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modul ENUM('arkiven','sociapulse','pressport') NOT NULL,
  nama VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Default Kategori Arkiven:**
- Dokumentasi Kegiatan
- Video/Liputan
- Foto Resmi
- Surat/Memo
- Infografis

**Default Kategori Sociapulse:**
- Instagram Post
- Instagram Story
- Instagram Reel
- Facebook Post
- Facebook Video
- TikTok Video

**Default Kategori Pressport:**
- Banner / Spanduk
- Poster
- Backdrop / Photobooth
- Roll Banner
- Stiker / Label
- Standing Banner
- Name Tag / ID Card
- Undangan
- Brosur / Flyer
- Plakat / Trophy
- Kaos / Apparel
- Packaging / Merchandise
- Layout Lainnya

> Kategori bisa ditambah/diubah via menu Kategori Management di masing-masing modul.

---

### MODUL: Arkiven (Arsip Dokumentasi)

```sql
arkiven_arsip (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  kategori_id INT,
  tanggal DATE NOT NULL,
  deskripsi TEXT,
  triwulan TINYINT GENERATED ALWAYS AS (QUARTER(tanggal)),
  tahun YEAR GENERATED ALWAYS AS (YEAR(tanggal)),
  qr_code_link VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES categories(id) ON DELETE SET NULL
);

arkiven_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  arsip_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  file_drive_id VARCHAR(500),
  file_drive_link VARCHAR(500),
  upload_status ENUM('uploading','done','failed') DEFAULT 'uploading',
  uploaded_at DATETIME,
  FOREIGN KEY (arsip_id) REFERENCES arkiven_arsip(id) ON DELETE CASCADE
);
```

**Notes:**
- 1 arsip bisa punya banyak file (bulk upload)
- File bisa ratusan MB sampai 10GB+
- Upload pakai chunk (Tus Protocol)
- Progress bar real-time

---

### MODUL: Sociapulse (Social Media Hub)

```sql
sociapulse_konten (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  content_type ENUM('post','story','reel','video','carousel','thread'),
  status ENUM('ide','draft','review','approved','scheduled','published') DEFAULT 'ide',
  caption TEXT,
  hashtags TEXT,
  tanggal_post DATE,
  notes TEXT,
  kampanye_id INT,
  triwulan TINYINT GENERATED ALWAYS AS (QUARTER(tanggal_post)),
  tahun YEAR GENERATED ALWAYS AS (YEAR(tanggal_post)),
  qr_code_link VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kampanye_id) REFERENCES sociapulse_kampanye(id) ON DELETE SET NULL
);

sociapulse_platforms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  konten_id INT NOT NULL,
  platform ENUM('instagram','facebook','tiktok') NOT NULL,
  link_post VARCHAR(500),
  posted_at DATETIME,
  FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE CASCADE
);
```

**Note:** 1 konten bisa diposting di beberapa platform (multi-platform).

```sql
sociapulse_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  konten_id INT NOT NULL,
  platform ENUM('instagram','facebook','tiktok'),
  tanggal_cek DATE NOT NULL,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  reach INT DEFAULT 0,
  views INT DEFAULT 0,
  saves INT DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE CASCADE
);
```

**Note:** Input metrics manual setiap Jumat (cron reminder).

```sql
sociapulse_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  konten_id INT,
  nama VARCHAR(255) NOT NULL,
  kategori ENUM('foto','video','desain','template'),
  file_drive_id VARCHAR(500),
  file_drive_link VARCHAR(500),
  file_name VARCHAR(255),
  file_size BIGINT,
  file_type VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE SET NULL
);

sociapulse_kampanye (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  status ENUM('planning','active','selesai') DEFAULT 'planning',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

sociapulse_calendar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  konten_id INT NOT NULL,
  tanggal_plan DATE NOT NULL,
  jam_plan TIME,
  platform ENUM('instagram','facebook','tiktok'),
  status ENUM('pending','published','missed') DEFAULT 'pending',
  notes TEXT,
  FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE CASCADE
);
```

**Sociapulse Flow:**
1. Content Pipeline: Ide → Draft → Review → Approved → Scheduled → Published
2. Multi-platform per konten (IG, FB, TikTok)
3. Campaign tracking
4. Content calendar
5. Assets library (upload ke Drive)
6. Metrics input manual (Jumat reminder)
7. Repliz.com untuk auto-reply komentar (manual sync, belum ada API)

---

### MODUL: Pressport (Media Cetak)

```sql
pressport_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  kategori_id INT,
  tanggal DATE NOT NULL,
  deskripsi TEXT,
  triwulan TINYINT GENERATED ALWAYS AS (QUARTER(tanggal)),
  tahun YEAR GENERATED ALWAYS AS (YEAR(tanggal)),
  qr_code_link VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES categories(id) ON DELETE SET NULL
);

pressport_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  media_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  file_drive_id VARCHAR(500),
  file_drive_link VARCHAR(500),
  upload_status ENUM('uploading','done','failed') DEFAULT 'uploading',
  uploaded_at DATETIME,
  FOREIGN KEY (media_id) REFERENCES pressport_media(id) ON DELETE CASCADE
);
```

**Note:** Bulk upload, bisa untuk banner, spanduk, kaos, poster, dll.

---

## Google Drive Folder Structure

```
BPKH Humas/
├── 2026/
│   ├── Triwulan 1 (Jan-Mar)/
│   │   ├── Arkiven/
│   │   ├── Sociapulse/
│   │   └── Pressport/
│   ├── Triwulan 2 (Apr-Jun)/
│   │   ├── Arkiven/
│   │   ├── Sociapulse/
│   │   └── Pressport/
│   ├── Triwulan 3 (Jul-Sep)/
│   └── Triwulan 4 (Okt-Des)/
├── 2027/
│   └── ...
```

> Folder otomatis dibuat saat upload pertama kali di triwulan tsb.

---

## Large File Upload Strategy

```
Browser
  │
  ├── Chunk Upload (Tus Protocol)
  │   ├── Split file jadi chunks (5-10MB per chunk)
  │   ├── Upload paralel + resumeable
  │   └── Progress bar real-time
  │
  ▼
Backend API
  │
  ├── Temporary storage: /tmp/humasbpkh-uploads/
  ├── Setelah semua chunks complete → merge
  ├── Upload ke Google Drive (resumable)
  └── Hapus temporary file
```

---

## Menu Structure

```
Login
└── Dashboard Utama (Card 3 Modul)
    │
    ├── 🗂️ Arkiven
    │   ├── Dashboard (statistik)
    │   ├── List Arsip (table + filter + search + pagination)
    │   ├── Tambah Arsip (bulk upload, progress bar)
    │   ├── Detail Arsip (+ QR Code)
    │   ├── Laporan Triwulan & Tahunan
    │   └── Kategori Management
    │
    ├── 📱 Sociapulse
    │   ├── Dashboard (pipeline, scheduled today, top post)
    │   ├── Content List
    │   ├── Tambah Konten (multi-platform)
    │   ├── Content Calendar
    │   ├── Kampanye
    │   ├── Metrics Input
    │   ├── Assets Library
    │   ├── Detail (+ QR Code)
    │   ├── Laporan Triwulan & Tahunan
    │   └── Kategori Management
    │
    ├── 📰 Pressport
    │   ├── Dashboard (statistik)
    │   ├── List Media (table + filter + search + pagination)
    │   ├── Tambah Media (bulk upload, progress bar)
    │   ├── Detail (+ QR Code)
    │   ├── Laporan Triwulan & Tahunan
    │   └── Kategori Management
    │
    ├── 📄 Laporan
    │   ├── Per Modul (triwulan + tahunan)
    │   └── Export PDF / CSV
    │
    ├── ⚙️ Settings
    │   ├── Profil
    │   ├── Ubah Password
    │   ├── Nama/Jabatan/NIP Humas
    │   ├── Nama/Jabatan/NIP Pimpinan (diisi sebelum cetak)
    │   ├── Logo BPKH (upload)
    │   └── Laporan Template Settings
    │
    └── 📋 Activity Logs
        └── Semua perubahan (filter by modul/action/date)
```

---

## Laporan Format

### PDF Template
```
┌─────────────────────────────────────┐
│         [LOGO BPKH]                 │
│                                     │
│   LAPORAN ARSIP DOKUMENTASI         │
│   TRIWULAN 1 - TAHUN 2026           │
│   BADAN PEMBIAYAAN PEMBANGUNAN      │
│   KEUANGAN DAERAH                   │
│                                     │
│   ─────────────────────────         │
│                                     │
│   [Tabel Data]                      │
│   [Statistik]                       │
│   [Summary]                         │
│                                     │
│   ─────────────────────────         │
│                                     │
│   Mengetahui,                       │
│                                     │
│   [Nama Pimpinan]  [Nama Humas]     │
│   [Jabatan]         [Jabatan]       │
│   NIP. [xxx]        NIP. [xxx]      │
│                                     │
└─────────────────────────────────────┘
```

**Note:** TTD tidak diupload. Sebelum cetak, isi form:
- Nama Pimpinan, Jabatan, NIP
- Nama Humas, Jabatan, NIP (bisa disimpan di settings)

### Export Formats
- **PDF** — dengan header BPKH + tabel + TTD
- **CSV** — data raw untuk analisis

---

## UI/UX Features

| Feature | Detail |
|---------|--------|
| 🎨 Clean Design | Minimalis, hijau daun + emas |
| 🌙 Dark/Light Mode | Toggle |
| 📱 PWA | Installable di HP/Desktop |
| 💀 Skeleton Loading | Setiap data load |
| 🔄 Loading Spinner | Button & action |
| 🔔 Toast Notification | Success/Error/Warning/Info |
| 📋 Activity Logs | Semua perubahan tercatat |
| ⚙️ Settings | Profil, password, nama, jabatan, NIP, logo |
| 🔍 Search & Filter | Per modul |
| 📄 Pagination | List data |

---

## API Documentation

Base URL: `http://localhost:1987/api`

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Arkiven
```
GET    /api/arkiven              # List (pagination, filter, search)
POST   /api/arkiven              # Create
GET    /api/arkiven/:id          # Detail
PUT    /api/arkiven/:id          # Update
DELETE /api/arkiven/:id          # Delete
POST   /api/arkiven/:id/upload   # Upload files (chunk)
DELETE /api/arkiven/:id/files/:fileId  # Delete file
```

### Sociapulse
```
GET    /api/sociapulse           # List
POST   /api/sociapulse           # Create
GET    /api/sociapulse/:id
PUT    /api/sociapulse/:id
DELETE /api/sociapulse/:id
POST   /api/sociapulse/:id/upload
POST   /api/sociapulse/:id/metrics    # Input metrics
GET    /api/sociapulse/calendar        # Calendar view
GET    /api/sociapulse/dashboard       # Dashboard stats
```

### Pressport
```
GET    /api/pressport
POST   /api/pressport
GET    /api/pressport/:id
PUT    /api/pressport/:id
DELETE /api/pressport/:id
POST   /api/pressport/:id/upload
DELETE /api/pressport/:id/files/:fileId
```

### Categories
```
GET    /api/categories?modul=arkiven
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

### Reports
```
GET    /api/laporan/arkiven?triwulan=1&tahun=2026&format=pdf
GET    /api/laporan/arkiven?triwulan=1&tahun=2026&format=csv
GET    /api/laporan/sociapulse?triwulan=1&tahun=2026&format=pdf
GET    /api/laporan/sociapulse?triwulan=1&tahun=2026&format=csv
GET    /api/laporan/pressport?triwulan=1&tahun=2026&format=pdf
GET    /api/laporan/pressport?triwulan=1&tahun=2026&format=csv
GET    /api/laporan/tahunan?modul=arkiven&tahun=2026&format=pdf
```

### Settings
```
GET    /api/settings
PUT    /api/settings
POST   /api/settings/logo          # Upload logo
```

### Activity Logs
```
GET    /api/logs?modul=arkiven&action=create&date=2026-03-29
```

### Drive
```
GET    /api/drive/tree              # Lihat folder structure
POST   /api/drive/init-folder       # Buat folder jika belum ada
```

---

## .env Structure

```env
# App
APP_PORT=1987
APP_SECRET=your-secret-key-here
APP_ENV=production
APP_URL=http://localhost:1987

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=humasbpkh
DB_USER=humasbpkh
DB_PASS=secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PREFIX=humasbpkh:

# Google Drive (Maton.ai)
MATON_API_KEY=xxx
MATON_BASE_URL=https://gateway.maton.ai/google-drive/drive/v3/
DRIVE_ROOT_FOLDER=BPKH Humas

# Upload
MAX_FILE_SIZE=10737418240
CHUNK_SIZE=10485760
TEMP_UPLOAD_DIR=/tmp/humasbpkh-uploads

# Auth
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
```

---

## Cron Jobs

| Schedule | Task |
|----------|------|
| Setiap Jumat 08:00 WIB (01:00 UTC) | Reminder input metrics Sociapulse |
| Setiap hari 00:01 WIB (17:01 UTC) | Auto-cleanup temp uploads |

---

## Project Structure

```
humasbpkh/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Login
│   ├── globals.css
│   ├── manifest.json                   # PWA
│   ├── dashboard/
│   │   └── page.tsx                    # Dashboard utama (card modul)
│   ├── arkiven/
│   │   ├── page.tsx                    # Dashboard Arkiven
│   │   ├── tambah/page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── laporan/page.tsx
│   │   └── kategori/page.tsx
│   ├── sociapulse/
│   │   ├── page.tsx                    # Dashboard Sociapulse
│   │   ├── tambah/page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── kampanye/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── laporan/page.tsx
│   │   └── kategori/page.tsx
│   ├── pressport/
│   │   ├── page.tsx                    # Dashboard Pressport
│   │   ├── tambah/page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── laporan/page.tsx
│   │   └── kategori/page.tsx
│   ├── laporan/
│   │   └── page.tsx                    # Laporan pusat
│   ├── settings/
│   │   └── page.tsx                    # Settings
│   ├── logs/
│   │   └── page.tsx                    # Activity logs
│   └── api/
│       ├── auth/route.ts
│       ├── arkiven/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── upload/route.ts
│       ├── sociapulse/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   ├── route.ts
│       │   │   ├── upload/route.ts
│       │   │   └── metrics/route.ts
│       │   ├── calendar/route.ts
│       │   └── dashboard/route.ts
│       ├── pressport/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── upload/route.ts
│       ├── categories/route.ts
│       ├── laporan/
│       │   └── [modul]/route.ts
│       ├── settings/route.ts
│       ├── logs/route.ts
│       └── drive/
│           ├── tree/route.ts
│           └── init-folder/route.ts
├── lib/
│   ├── db.ts                          # MySQL connection pool
│   ├── redis.ts                       # Redis client
│   ├── auth.ts                        # JWT helpers
│   ├── drive.ts                       # Google Drive via Maton.ai
│   ├── qr.ts                          # QR code generator
│   ├── upload.ts                      # Chunk upload handler
│   ├── laporan.ts                     # PDF/CSV generator
│   ├── logger.ts                      # Activity logger
│   └── toast.ts                       # Toast helpers
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx
│   │   ├── Pagination.tsx
│   │   └── SearchFilter.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   ├── modul/
│   │   ├── arkiven/
│   │   ├── sociapulse/
│   │   └── pressport/
│   └── shared/
│       ├── FileUpload.tsx             # Chunk upload with progress
│       ├── QRCode.tsx
│       └── LaporanForm.tsx
├── public/
│   ├── icons/                         # PWA icons
│   └── sw.js                          # Service worker
├── package.json
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
├── .env.local                         # Local env (gitignored)
├── .env.example                       # Template env
└── STRUCTURE.md                       # This file
```

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "mysql2": "^3",
    "ioredis": "^5",
    "bcryptjs": "^2",
    "jsonwebtoken": "^9",
    "qrcode": "^1",
    "pdfkit": "^0.13",
    "json2csv": "^5",
    "tus-node-server": "^0.3",
    "uuid": "^9",
    "dotenv": "^16",
    "next-pwa": "^5"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/node": "^20",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## Deployment

- **Host:** Odin (same server as OpenClaw)
- **Runtime:** Node.js v25.7.0
- **Process Manager:** PM2 (auto-restart)
- **Port:** 1987
- **MySQL:** Install via apt or Docker
- **Redis:** Install via apt or Docker

---

## Notes

- **Approval System:** Semua coding session butuh approve bozz dulu
- **Iterative Development:** Build modul per modul, test, then next
- **Repliz Integration:** Sociapulse ready untuk integrasi, tapi Repliz belum punya public API. Manual sync dulu.
- **Kompetitor Tracking:** Tidak perlu (sosmed instansi, bukan bisnis)
- **Metrics Input:** Manual, setiap Jumat (cron reminder via Telegram)
- **TTD:** Tidak diupload. Diisi form sebelum cetak (nama, jabatan, NIP). Humas bisa disimpan di settings.

---

_This document is the single source of truth for humasbpkh development._
_Last updated: 29 March 2026_
