# Panduan Setup Lokal di VS Code & Desain Arsitektur Sistem Informasi KKPR

Dokumen ini ditulis sebagai panduan komprehensif bagi developer dan arsitek perangkat lunak untuk menjalankan, memahami, serta memigrasikan sistem ini ke lingkungan produksi lokal menggunakan **Node.js (Express)**, **React (Vite)**, dan database **PostgreSQL**.

---

## 📂 1. Struktur Folder Proyek yang Rapi (Tidy Folder Tree)

Struktur berikut memisahkan tanggung jawab (Separation of Concerns) secara bersih antara frontend, backend, dan konfigurasi database:

```text
SISTEM-INFORMASI-KKPR/
├── dist/                     # Hasil kompilasi/build siap produksi (Production assets)
├── uploads/                  # Penyimpanan lokal file persyaratan (PDF & Gambar)
├── database.json             # File Database simulasi untuk pengembangan lokal cepat
├── server.ts                 # Entry point Backend Express (API, Auth & Upload Controllers)
├── tsconfig.json             # Konfigurasi TypeScript global
├── package.json              # Daftar ketergantungan pustaka (npm dependencies)
├── vite.config.ts            # Konfigurasi bundler Vite + Tailwind CSS
├── src/                      # Source code Frontend (React.js)
│   ├── main.tsx              # Entry point inisialisasi aplikasi React
│   ├── index.css             # Entry point style Tailwind CSS v4
│   ├── App.tsx               # State Engine, Session Router, & Root Component
│   ├── types.ts              # Definisi tipe & interface TypeScript (Shared Types)
│   ├── server-db.ts          # Integrasi database JSON backend (FS helper)
│   └── components/           # Kumpulan reusable component modular
│       ├── Navbar.tsx        # Navigasi & Badge Informasi Role Akun
│       ├── LoginRegister.tsx # Form Auth & Informasi Akun Demo Pengujian
│       ├── DashboardPemohon.tsx   # Portal Pemohon (Form, upload Base64, Riwayat status)
│       └── DashboardVerifikator.tsx # Portal Dinas (Inspeksi berkas, verifikasi dokumen, keputusan final)
```

---

## 🗄️ 2. Skema Database Relasional (SQL PostgreSQL)

Berikut adalah skema SQL standar DDL (*Data Definition Language*) lengkap dengan relasi, kunci asing (*Foreign Keys*), batasan (*Constraints*), dan indeksasi untuk kueri berkinerja tinggi:

```sql
-- Aktivasi ekstensi UUID untuk ID yang aman dan tidak dapat ditebak secara sekuensial
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Pengguna (Users / RBAC)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'usr_' || substring(uuid_generate_v4()::text, 1, 8),
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Pemohon', 'Petugas Verifikator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeksasi pencarian login berdasarkan email
CREATE INDEX idx_users_email ON users(email);


-- 2. Tabel Pengajuan KKPR (Submissions)
CREATE TABLE submissions (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'sub_' || substring(uuid_generate_v4()::text, 1, 8),
    user_id VARCHAR(50) NOT NULL,
    applicant_name VARCHAR(150) NOT NULL,
    applicant_address TEXT NOT NULL,
    coordinates VARCHAR(100) NOT NULL, -- Format: "latitude, longitude"
    polygon_gis TEXT, -- Menyimpan data polygon string atau koordinat multipoint
    land_area DECIMAL(12,2) NOT NULL, -- Luas Lahan dalam m²
    planned_activity VARCHAR(255) NOT NULL, -- Kegiatan pemanfaatan ruang yang direncanakan
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Diproses', 'Disetujui', 'Ditolak')),
    rejection_reason TEXT, -- Alasan penolakan pengajuan keseluruhan oleh petugas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indeksasi untuk pencarian dan pemantauan cepat status pengajuan
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);


-- 3. Tabel Dokumen Persyaratan KKPR (Documents)
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'doc_' || substring(uuid_generate_v4()::text, 1, 8),
    submission_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., "KTP Pemohon", "Sertifikat Tanah"
    file_type VARCHAR(100) NOT NULL, -- e.g., "application/pdf", "image/png"
    file_size INT NOT NULL, -- dalam byte
    file_url TEXT NOT NULL, -- URL path unduh file lokal atau S3 bucket
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Disetujui', 'Ditolak')),
    rejection_reason TEXT, -- Alasan penolakan berkas ini oleh petugas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Indeksasi untuk verifikasi berkas per pengajuan
CREATE INDEX idx_documents_submission_id ON documents(submission_id);


-- 4. Tabel Log Riwayat Audit Verifikasi (Audit Logs)
CREATE TABLE verification_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'log_' || substring(uuid_generate_v4()::text, 1, 8),
    submission_id VARCHAR(50) NOT NULL,
    verifier_name VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_verification_logs_submission_id ON verification_logs(submission_id);
```

---

## 💻 3. Potongan Kode Utama Controller (Anotasi Indonesia)

Berikut adalah controller utama di dalam Express untuk mengontrol unggah file lokal dan verifikasi dokumen dengan status otomatis:

### A. Controller Unggah Berkas Persyaratan (Local Upload & Sanitasi)

```typescript
// Controller unggah berkas menggunakan buffer Base64
app.post('/api/kkpr/upload', authenticateToken, (req: any, res: any) => {
  const { fileName, fileType, fileData } = req.body;
  
  if (!fileName || !fileType || !fileData) {
    return res.status(400).json({ message: 'Data upload file tidak lengkap.' });
  }
  
  // 1. Ekstraksi base64 string
  const base64Data = fileData.includes(';base64,') ? fileData.split(';base64,')[1] : fileData;
  const fileBuffer = Buffer.from(base64Data, 'base64');
  
  // 2. Validasi Batasan Ukuran Maksimal 5MB (5,242,880 Byte)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (fileBuffer.length > MAX_SIZE) {
    return res.status(400).json({ message: 'Ukuran file melebihi batas maksimal 5MB.' });
  }
  
  // 3. Validasi Tipe Berkas (Hanya PDF, JPG, PNG)
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(fileType)) {
    return res.status(400).json({ message: 'Format file tidak didukung. Gunakan PDF atau Gambar.' });
  }
  
  // 4. Sanitasi Nama File & Penambahan ID Unik untuk mencegah eksploitasi Directory Traversal
  const uniqueId = crypto.randomUUID().substring(0, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const diskFileName = `${uniqueId}_${sanitizedName}`;
  const destPath = path.join(UPLOADS_DIR, diskFileName);
  
  try {
    fs.writeFileSync(destPath, fileBuffer);
    const fileUrl = `/uploads/${diskFileName}`;
    
    res.json({
      message: 'File berhasil diunggah secara lokal.',
      fileUrl,
      fileName,
      fileSize: fileBuffer.length
    });
  } catch (err: any) {
    console.error('Gagal menulis berkas:', err);
    res.status(500).json({ message: 'Terjadi kesalahan internal unggah file.' });
  }
});
```

### B. Controller Verifikasi Dokumen & Logika Status Otomatis

```typescript
// Controller Verifikasi Dokumen Tunggal dengan Sinkronisasi Status Otomatis
app.post('/api/kkpr/submissions/:id/verify-document', authenticateToken, requireRole('Petugas Verifikator'), (req: any, res: any) => {
  const submissionId = req.params.id;
  const { documentId, status, rejectionReason } = req.body; // status: 'Disetujui' | 'Ditolak'
  
  if (!documentId || !status) {
    return res.status(400).json({ message: 'Parameter verifikasi dokumen tidak lengkap.' });
  }
  
  const db = getDb();
  const submission = db.submissions.find(s => s.id === submissionId);
  
  if (!submission) {
    return res.status(404).json({ message: 'Pengajuan KKPR tidak ditemukan.' });
  }
  
  const doc = submission.documents.find(d => d.id === documentId);
  if (!doc) {
    return res.status(404).json({ message: 'Dokumen tidak ditemukan dalam pengajuan.' });
  }
  
  // 1. Perbarui status dokumen spesifik
  doc.status = status;
  doc.rejectionReason = status === 'Ditolak' ? rejectionReason : undefined;
  submission.updatedAt = new Date().toISOString();
  
  // 2. LOGIKA STATUS OTOMATIS:
  // Hitung jumlah berkas terverifikasi untuk menentukan status permohonan induk
  const totalDocs = submission.documents.length;
  const approvedDocs = submission.documents.filter(d => d.status === 'Disetujui').length;
  const rejectedDocs = submission.documents.filter(d => d.status === 'Ditolak').length;
  const pendingDocs = submission.documents.filter(d => d.status === 'Pending').length;
  
  let newSubmissionStatus: SubmissionStatus = 'Diproses';
  
  if (approvedDocs === totalDocs) {
    // A. Semua dokumen berstatus 'Disetujui' -> Status permohonan otomatis 'Disetujui'
    newSubmissionStatus = 'Disetujui';
  } else if (rejectedDocs > 0 && pendingDocs === 0) {
    // B. Ada berkas ditolak dan tidak ada berkas tersisa yang pending -> Status otomatis 'Ditolak'
    newSubmissionStatus = 'Ditolak';
  } else if (rejectedDocs > 0) {
    // C. Masih ada proses verifikasi tersisa namun ada yang ditolak -> Masih berstatus 'Diproses'
    newSubmissionStatus = 'Diproses';
  }
  
  submission.status = newSubmissionStatus;
  
  // 3. Tambahkan Audit Log Sistem
  const log = {
    id: 'log_' + crypto.randomUUID().substring(0, 8),
    submissionId,
    verifierName: req.user.name,
    status: newSubmissionStatus,
    notes: `Dokumen "${doc.name}" diverifikasi menjadi [${status}]. ${status === 'Ditolak' ? 'Alasan: ' + rejectionReason : ''}`,
    createdAt: new Date().toISOString()
  };
  db.logs.push(log);
  saveDb(db);
  
  res.json({ message: 'Verifikasi berhasil diperbarui.', submission });
});
```

---

## 🛠️ 4. Panduan Setup Langkah Demi Langkah (VS Code)

Ikuti langkah berikut untuk memasang dan menjalankan proyek secara utuh di VS Code komputer Anda:

### Langkah 1: Kebutuhan Prasyarat (Prerequisites)
Pastikan komputer Anda sudah terpasang:
- **Node.js** (Rekomendasi Versi 18 ke atas / LTS)
- **Git**
- **VS Code** beserta ekstensi **TypeScript** dan **Tailwind CSS IntelliSense**.

### Langkah 2: Klon / Salin Kode Sumber
Buka terminal VS Code Anda, buat folder proyek dan masuk ke dalamnya:
```bash
git clone <url-repository> kkpr-sistem-informasi
cd kkpr-sistem-informasi
```

### Langkah 3: Konfigurasi File Environment
Salin file `.env.example` menjadi `.env` di direktori utama:
```bash
cp .env.example .env
```
Isi konfigurasi kunci keamanan token JWT dan API tambahan jika diperlukan:
```env
PORT=3000
JWT_SECRET=kkpr-super-secret-security-key-2026
```

### Langkah 4: Pasang Dependensi Node.js
Jalankan perintah penginstal paket npm di terminal:
```bash
npm install
```

### Langkah 5: Jalankan Server Mode Pengembangan (Dev Mode)
Jalankan server gabungan (full-stack) secara lokal dengan satu perintah:
```bash
npm run dev
```
Setelah perintah dijalankan:
- Server backend Express akan mendengarkan di port `3000`.
- Server frontend Vite akan berjalan melalui middleware terintegrasi Express.
- Buka peramban (browser) Anda dan akses alamat: **`http://localhost:3000`**.

### Langkah 6: Cara Menjalankan Produksi (Production Build & Start)
Jika ingin melakukan deployment / rilis produksi lokal:
```bash
# 1. Kompilasi build frontend & backend
npm run build

# 2. Jalankan aplikasi produksi
npm start
```
Aplikasi Anda sekarang siap melayani pemohon dan verifikator dengan performa maksimal!
