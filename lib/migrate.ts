import getDb, { run } from './db'
import bcrypt from 'bcryptjs'

async function migrate() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      modul TEXT CHECK(modul IN ('arkiven','sociapulse','pressport','settings','auth')),
      action TEXT,
      description TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modul TEXT CHECK(modul IN ('arkiven','sociapulse','pressport')) NOT NULL,
      nama TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS arkiven_arsip (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      kategori_id INTEGER,
      tanggal DATE NOT NULL,
      deskripsi TEXT,
      qr_code_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kategori_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS arkiven_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arsip_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      file_drive_id TEXT,
      file_drive_link TEXT,
      upload_status TEXT CHECK(upload_status IN ('uploading','done','failed')) DEFAULT 'uploading',
      uploaded_at DATETIME,
      FOREIGN KEY (arsip_id) REFERENCES arkiven_arsip(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sociapulse_kampanye (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      deskripsi TEXT,
      tanggal_mulai DATE,
      tanggal_selesai DATE,
      status TEXT CHECK(status IN ('planning','active','selesai')) DEFAULT 'planning',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sociapulse_konten (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      content_type TEXT CHECK(content_type IN ('post','story','reel','video','carousel','thread')),
      status TEXT CHECK(status IN ('ide','draft','review','approved','scheduled','published')) DEFAULT 'ide',
      caption TEXT,
      hashtags TEXT,
      tanggal_post DATE,
      notes TEXT,
      kampanye_id INTEGER,
      qr_code_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kampanye_id) REFERENCES sociapulse_kampanye(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sociapulse_platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      konten_id INTEGER NOT NULL,
      platform TEXT CHECK(platform IN ('instagram','facebook','tiktok')) NOT NULL,
      link_post TEXT,
      posted_at DATETIME,
      FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sociapulse_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      konten_id INTEGER NOT NULL,
      platform TEXT CHECK(platform IN ('instagram','facebook','tiktok')),
      tanggal_cek DATE NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sociapulse_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      konten_id INTEGER,
      nama TEXT NOT NULL,
      kategori TEXT CHECK(kategori IN ('foto','video','desain','template')),
      file_drive_id TEXT,
      file_drive_link TEXT,
      file_name TEXT,
      file_size INTEGER,
      file_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sociapulse_calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      konten_id INTEGER NOT NULL,
      tanggal_plan DATE NOT NULL,
      jam_plan TEXT,
      platform TEXT CHECK(platform IN ('instagram','facebook','tiktok')),
      status TEXT CHECK(status IN ('pending','published','missed')) DEFAULT 'pending',
      notes TEXT,
      FOREIGN KEY (konten_id) REFERENCES sociapulse_konten(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pressport_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      kategori_id INTEGER,
      tanggal DATE NOT NULL,
      deskripsi TEXT,
      qr_code_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kategori_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS pressport_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      file_drive_id TEXT,
      file_drive_link TEXT,
      upload_status TEXT CHECK(upload_status IN ('uploading','done','failed')) DEFAULT 'uploading',
      uploaded_at DATETIME,
      FOREIGN KEY (media_id) REFERENCES pressport_media(id) ON DELETE CASCADE
    );
  `)

  console.log('✅ Tables created')

  // Seed default user
  const existing: any = db.prepare('SELECT id FROM users WHERE username = ?').get('agoeng')
  if (!existing) {
    const hash = bcrypt.hashSync('Admin123', 12)
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('agoeng', hash)
    console.log('✅ Default user: agoeng / Admin123')
  }

  // Seed categories
  const cats = [
    { modul: 'arkiven', items: ['Dokumentasi Kegiatan', 'Video/Liputan', 'Foto Resmi', 'Surat/Memo', 'Infografis'] },
    { modul: 'sociapulse', items: ['Instagram Post', 'Instagram Story', 'Instagram Reel', 'Facebook Post', 'Facebook Video', 'TikTok Video'] },
    { modul: 'pressport', items: ['Banner / Spanduk', 'Poster', 'Backdrop / Photobooth', 'Roll Banner', 'Stiker / Label', 'Standing Banner', 'Name Tag / ID Card', 'Undangan', 'Brosur / Flyer', 'Plakat / Trophy', 'Kaos / Apparel', 'Packaging / Merchandise', 'Layout Lainnya'] },
  ]
  for (const group of cats) {
    for (let i = 0; i < group.items.length; i++) {
      const ex: any = db.prepare('SELECT id FROM categories WHERE modul = ? AND nama = ?').get(group.modul, group.items[i])
      if (!ex) {
        db.prepare('INSERT INTO categories (modul, nama, sort_order) VALUES (?, ?, ?)').run(group.modul, group.items[i], i)
      }
    }
  }
  console.log('✅ Categories seeded')

  // Seed settings
  const settings = ['humas_nama', 'humas_jabatan', 'humas_nip', 'pimpinan_nama', 'pimpinan_jabatan', 'pimpinan_nip', 'logo_url']
  for (const key of settings) {
    const ex: any = db.prepare('SELECT id FROM settings WHERE setting_key = ?').get(key)
    if (!ex) {
      db.prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)').run(key, '')
    }
  }
  console.log('✅ Settings seeded')

  console.log('🎉 Migration complete!')
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
