import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb, hashPassword } from '../src/server-db';
import { User, KKPRSubmission, KKPRDocument, SubmissionStatus, DocumentStatus } from '../src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload size limit to accommodate PDF/Image base64 uploads up to 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Setup local uploads storage directory with serverless fallback
const isServerless = !!process.env.VERCEL || !!process.env.PORT || process.env.NODE_ENV === 'production';
const UPLOADS_DIR = isServerless
  ? path.join('/tmp', 'uploads')
  : path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// JWT Secrets & Utility Functions
const JWT_SECRET = process.env.JWT_SECRET || 'kkpr-super-secret-security-key-2026';

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str) : str;
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) {
    s += '=';
  }
  return Buffer.from(s, 'base64').toString();
}

export function signJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlEncode(hmac.digest());
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): any {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) return null;
    
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${encodedHeader}.${encodedPayload}`);
    const expectedSignature = base64UrlEncode(hmac.digest());
    
    if (signature !== expectedSignature) return null;
    
    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return null;
  }
}

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }
  
  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
  
  req.user = decoded;
  next();
}

// Role Authorization Middleware
function requireRole(role: 'Pemohon' | 'Petugas Verifikator') {
  return (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: `Akses ditolak. Peran '${role}' diperlukan.` });
    }
    next();
  };
}

// Placeholder files generation for mock data previewing
function generatePlaceholders() {
  const placePath = path.join(process.cwd(), 'uploads');
  const files = ['ktp.pdf', 'sertifikat.png', 'peta.png', 'ktp2.pdf', 'sertifikat2.png', 'peta2.png'];
  files.forEach(f => {
    const filePath = path.join(placePath, f);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `Mock file content for ${f}. Simulated uploaded file.`);
    }
  });
}
generatePlaceholders();

// ==================== API ENDPOINTS ====================

// 1. AUTENTIKASI API

// Register User (Pemohon / Verifikator)
app.post('/api/auth/register', (req: any, res: any) => {
  const { email, password, name, role, identityType, identityNumber, phoneNumber, address, companyName } = req.body;
  
  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Semua kolom input wajib diisi.' });
  }
  
  if (role !== 'Pemohon' && role !== 'Petugas Verifikator') {
    return res.status(400).json({ message: 'Role harus berupa "Pemohon" atau "Petugas Verifikator".' });
  }

  if (role === 'Pemohon') {
    if (!identityType || !identityNumber || !phoneNumber || !address) {
      return res.status(400).json({ message: 'Untuk Pemohon, Jenis Identitas, No. Identitas, No. Telepon, dan Alamat wajib diisi.' });
    }
  }
  
  const db = getDb();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (existingUser) {
    return res.status(400).json({ message: 'Email sudah terdaftar di sistem.' });
  }
  
  const newUser = {
    id: 'usr_' + crypto.randomUUID().substring(0, 8),
    email: email.toLowerCase(),
    name,
    role: role as any,
    identityType: role === 'Pemohon' ? identityType : undefined,
    identityNumber: role === 'Pemohon' ? identityNumber : undefined,
    phoneNumber: role === 'Pemohon' ? phoneNumber : undefined,
    address: role === 'Pemohon' ? address : undefined,
    companyName: role === 'Pemohon' ? companyName : undefined,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  saveDb(db);
  
  const token = signJwt({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
  
  res.status(201).json({
    message: 'Registrasi berhasil!',
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      identityType: newUser.identityType,
      identityNumber: newUser.identityNumber,
      phoneNumber: newUser.phoneNumber,
      address: newUser.address,
      companyName: newUser.companyName,
      createdAt: newUser.createdAt
    }
  });
});

// Login User
app.post('/api/auth/login', (req: any, res: any) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }
  
  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }
  
  const token = signJwt({ id: user.id, email: user.email, name: user.name, role: user.role });
  
  res.json({
    message: 'Login berhasil!',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      identityType: user.identityType,
      identityNumber: user.identityNumber,
      phoneNumber: user.phoneNumber,
      address: user.address,
      companyName: user.companyName,
      createdAt: user.createdAt
    }
  });
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req: any, res: any) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: 'Profil pengguna tidak ditemukan.' });
  }
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      identityType: user.identityType,
      identityNumber: user.identityNumber,
      phoneNumber: user.phoneNumber,
      address: user.address,
      companyName: user.companyName,
      createdAt: user.createdAt
    }
  });
});

// Placeholder File Route to simulate mock files
app.get('/api/placeholder/:filename', (req: any, res: any) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});


// 2. FILE UPLOAD CONTROLLER & API

// Upload Document Endpoint (Base64 file uploader, limit 5MB check)
app.post('/api/kkpr/upload', authenticateToken, (req: any, res: any) => {
  const { fileName, fileType, fileData } = req.body;
  
  if (!fileName || !fileType || !fileData) {
    return res.status(400).json({ message: 'Data upload file tidak lengkap.' });
  }
  
  // Clean base64 header if present (e.g., "data:application/pdf;base64,...")
  const base64Data = fileData.includes(';base64,') ? fileData.split(';base64,')[1] : fileData;
  const fileBuffer = Buffer.from(base64Data, 'base64');
  
  // Validate file size (max 5MB = 5,242,880 bytes)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (fileBuffer.length > MAX_SIZE) {
    return res.status(400).json({ message: 'Ukuran file melebihi batas maksimal 5MB.' });
  }
  
  // Validate file format (PDF, Images, ZIP, GeoJSON, etc.)
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'image/jpg', 
    'image/webp',
    'application/zip', 
    'application/x-zip-compressed',
    'application/octet-stream',
    'application/json',
    'application/geo+json'
  ];
  if (!allowedTypes.includes(fileType) && !fileName.endsWith('.zip') && !fileName.endsWith('.pdf') && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
    return res.status(400).json({ message: 'Format file tidak didukung. Gunakan PDF, JPG, PNG, atau ZIP.' });
  }
  
  // Create secure, sanitized filename to prevent Directory Traversal
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
      fileType,
      fileSize: fileBuffer.length
    });
  } catch (err: any) {
    console.error('Error saving file:', err);
    res.status(500).json({ message: 'Gagal mengunggah file di server lokal.' });
  }
});


// 3. PENGAJUAN KKPR API (DASHBOARD PEMOHON)

// Submit KKPR Application
app.post('/api/kkpr/submit', authenticateToken, requireRole('Pemohon'), (req: any, res: any) => {
  const { 
    applicantName, 
    applicantAddress, 
    coordinates, 
    polygonGIS, 
    landArea, 
    plannedActivity, 
    documents,
    identityType,
    identityNumber,
    phoneNumber,
    companyName,
    npwp,
    technicalSpecifications,
    technicalDetails
  } = req.body;
  
  if (!applicantName || !applicantAddress || !coordinates || !landArea || !plannedActivity) {
    return res.status(400).json({ message: 'Mohon isi semua data formulir pengajuan KKPR yang wajib.' });
  }
  
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({ message: 'Dokumen persyaratan wajib diunggah.' });
  }
  
  const db = getDb();
  
  const newSubmission: KKPRSubmission = {
    id: (() => {
      const seqNumber = String(db.submissions.length + 1).padStart(3, '0');
      const dateObj = new Date();
      const romanArray = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const romanMonth = romanArray[dateObj.getMonth()] || 'I';
      const yearStr = String(dateObj.getFullYear());
      return `RegKKPR-${seqNumber}-${romanMonth}-${yearStr}`;
    })(),
    userId: req.user.id,
    applicantName,
    applicantAddress,
    identityType,
    identityNumber,
    phoneNumber,
    companyName,
    npwp,
    coordinates,
    polygonGIS,
    landArea: Number(landArea),
    plannedActivity,
    technicalSpecifications,
    technicalDetails,
    status: 'Pending',
    documents: documents.map((doc: any) => ({
      id: doc.id || 'doc_' + crypto.randomUUID().substring(0, 8),
      name: doc.name,
      type: doc.type || 'application/pdf',
      size: doc.size || 0,
      fileUrl: doc.fileUrl,
      status: 'Pending'
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Catat log registrasi permohonan ke dalam sistem
  const initialLog = {
    id: 'log_' + crypto.randomUUID().substring(0, 8),
    submissionId: newSubmission.id,
    verifierName: 'Sistem KKPR',
    status: 'Pending' as SubmissionStatus,
    notes: `Permohonan baru berhasil diajukan oleh pemohon (${newSubmission.applicantName}). Menunggu proses verifikasi kelengkapan berkas oleh Petugas Verifikator Dinas.`,
    createdAt: newSubmission.createdAt
  };
  db.logs.push(initialLog);

  db.submissions.unshift(newSubmission);
  saveDb(db);
  
  res.status(201).json({
    message: 'Pengajuan KKPR berhasil dikirim dan siap diverifikasi!',
    submission: newSubmission
  });
});

// Get User's Submissions (Pemohon sees their own; Verifikator sees all)
app.get('/api/kkpr/submissions', authenticateToken, (req: any, res: any) => {
  const db = getDb();

  const enrichSubmissions = (subs: any[]) => {
    return subs.map(sub => {
      const applicantUser = db.users.find(u => u.id === sub.userId);
      if (applicantUser) {
        return {
          ...sub,
          identityType: sub.identityType || applicantUser.identityType || 'KTP',
          identityNumber: sub.identityNumber || applicantUser.identityNumber || '',
          phoneNumber: sub.phoneNumber || applicantUser.phoneNumber || '',
          companyName: sub.companyName || applicantUser.companyName || ''
        };
      }
      return sub;
    });
  };

  if (req.user.role === 'Petugas Verifikator') {
    res.json({ submissions: enrichSubmissions(db.submissions) });
  } else {
    const userSubmissions = db.submissions.filter(s => s.userId === req.user.id);
    res.json({ submissions: enrichSubmissions(userSubmissions) });
  }
});

// Get Detail of single submission
app.get('/api/kkpr/submissions/:id', authenticateToken, (req: any, res: any) => {
  const db = getDb();
  const submission = db.submissions.find(s => s.id === req.params.id);
  
  if (!submission) {
    return res.status(404).json({ message: 'Pengajuan KKPR tidak ditemukan.' });
  }
  
  // Pemohon can only view their own submissions
  if (req.user.role === 'Pemohon' && submission.userId !== req.user.id) {
    return res.status(403).json({ message: 'Anda tidak memiliki hak untuk melihat pengajuan ini.' });
  }

  const applicantUser = db.users.find(u => u.id === submission.userId);
  const enriched = applicantUser ? {
    ...submission,
    identityType: submission.identityType || applicantUser.identityType || 'KTP',
    identityNumber: submission.identityNumber || applicantUser.identityNumber || '',
    phoneNumber: submission.phoneNumber || applicantUser.phoneNumber || '',
    companyName: submission.companyName || applicantUser.companyName || ''
  } : submission;
  
  res.json({ submission: enriched });
});

// Delete submission endpoint
app.delete('/api/kkpr/submissions/:id', authenticateToken, (req: any, res: any) => {
  const db = getDb();
  const submissionIndex = db.submissions.findIndex(s => s.id === req.params.id);
  
  if (submissionIndex === -1) {
    return res.status(404).json({ message: 'Pengajuan KKPR tidak ditemukan.' });
  }
  
  const submission = db.submissions[submissionIndex];
  if (req.user.role === 'Pemohon' && submission.userId !== req.user.id) {
    return res.status(403).json({ message: 'Anda tidak memiliki hak untuk menghapus pengajuan ini.' });
  }
  
  db.submissions.splice(submissionIndex, 1);
  db.logs = db.logs.filter(l => l.submissionId !== req.params.id);
  saveDb(db);
  
  res.json({ message: 'Pengajuan KKPR berhasil dihapus.' });
});


// 4. VERIFIKASI & ACTION API (DASHBOARD PETUGAS VERIFIKATOR)

// Verify single document (Setuju / Tolak)
app.post('/api/kkpr/submissions/:id/verify-document', authenticateToken, requireRole('Petugas Verifikator'), (req: any, res: any) => {
  const submissionId = req.params.id;
  const { documentId, status, rejectionReason, documentName } = req.body; // status: 'Disetujui' | 'Ditolak'
  
  if (!documentId || !status) {
    return res.status(400).json({ message: 'Parameter verifikasi dokumen tidak lengkap.' });
  }
  
  if (status !== 'Disetujui' && status !== 'Ditolak') {
    return res.status(400).json({ message: 'Status verifikasi harus "Disetujui" atau "Ditolak".' });
  }
  
  if (status === 'Ditolak' && !rejectionReason) {
    return res.status(400).json({ message: 'Alasan penolakan dokumen wajib diisi.' });
  }
  
  const db = getDb();
  const submissionIndex = db.submissions.findIndex(s => s.id === submissionId);
  
  if (submissionIndex === -1) {
    return res.status(404).json({ message: 'Pengajuan KKPR tidak ditemukan.' });
  }
  
  const submission = db.submissions[submissionIndex];
  let doc = submission.documents.find(d => d.id === documentId);
  
  if (!doc) {
    // Jika berkas belum dilampirkan oleh pemohon, buat entri dokumen persyaratan
    doc = {
      id: documentId,
      name: documentName || `Persyaratan Berkas ${documentId}`,
      type: 'application/pdf',
      size: 0,
      fileUrl: '',
      status: status,
      rejectionReason: status === 'Ditolak' ? rejectionReason : undefined
    };
    submission.documents.push(doc);
  } else {
    // Update document verification status
    doc.status = status;
    doc.rejectionReason = status === 'Ditolak' ? rejectionReason : undefined;
  }
  submission.updatedAt = new Date().toISOString();
  
  // LOGIKA STATUS OTOMATIS:
  // Jika seluruh dokumen di-verifikasi:
  // 1. Jika ada yang Ditolak -> status pengajuan diubah menjadi 'Ditolak'
  // 2. Jika seluruh dokumen statusnya 'Disetujui' -> status pengajuan otomatis berubah menjadi 'Disetujui'
  // 3. Jika masih ada yang 'Pending' atau campuran, ubah status pengajuan menjadi 'Diproses'
  
  const totalDocs = submission.documents.length;
  const approvedDocs = submission.documents.filter(d => d.status === 'Disetujui').length;
  const rejectedDocs = submission.documents.filter(d => d.status === 'Ditolak').length;
  const pendingDocs = submission.documents.filter(d => d.status === 'Pending').length;
  
  let newSubmissionStatus: SubmissionStatus = 'Diproses';
  
  if (approvedDocs === totalDocs) {
    newSubmissionStatus = 'Disetujui';
  } else if (rejectedDocs > 0 && pendingDocs === 0) {
    // If there is any rejected doc and zero pending docs remaining
    newSubmissionStatus = 'Ditolak';
  } else if (rejectedDocs > 0) {
    // Has some rejections but still has pending
    newSubmissionStatus = 'Diproses';
  }
  
  submission.status = newSubmissionStatus;
  
  // Create a system audit log for the action
  const log = {
    id: 'log_' + crypto.randomUUID().substring(0, 8),
    submissionId,
    verifierName: req.user.name,
    status: newSubmissionStatus,
    notes: `Verifikasi berkas: "${doc.name}" diubah menjadi [${status}]. ${status === 'Ditolak' ? 'Alasan: ' + rejectionReason : ''}`,
    createdAt: new Date().toISOString()
  };
  db.logs.push(log);
  saveDb(db);
  
  res.json({
    message: `Verifikasi dokumen "${doc.name}" berhasil diperbarui.`,
    submission,
    log
  });
});

// Finalize verification decision manually (optional override/final action button)
app.post('/api/kkpr/submissions/:id/finalize', authenticateToken, requireRole('Petugas Verifikator'), (req: any, res: any) => {
  const submissionId = req.params.id;
  const { status, rejectionReason, completedDocumentUrl, completedDocumentName, completedDocumentSize } = req.body; // status: 'Disetujui' | 'Ditolak'
  
  if (status !== 'Disetujui' && status !== 'Ditolak') {
    return res.status(400).json({ message: 'Status finalisasi harus "Disetujui" atau "Ditolak".' });
  }
  
  if (status === 'Ditolak' && !rejectionReason) {
    return res.status(400).json({ message: 'Alasan penolakan final wajib diisi.' });
  }
  
  const db = getDb();
  const submissionIndex = db.submissions.findIndex(s => s.id === submissionId);
  
  if (submissionIndex === -1) {
    return res.status(404).json({ message: 'Pengajuan KKPR tidak ditemukan.' });
  }
  
  const submission = db.submissions[submissionIndex];
  
  // Apply manual finalization override
  submission.status = status;
  submission.rejectionReason = status === 'Ditolak' ? rejectionReason : undefined;
  
  if (status === 'Disetujui') {
    submission.completedDocumentUrl = completedDocumentUrl;
    submission.completedDocumentName = completedDocumentName;
    submission.completedDocumentSize = completedDocumentSize;
    submission.completedDocumentUploadedAt = new Date().toISOString();
  } else {
    // Clear if rejected
    submission.completedDocumentUrl = undefined;
    submission.completedDocumentName = undefined;
    submission.completedDocumentSize = undefined;
    submission.completedDocumentUploadedAt = undefined;
  }
  
  submission.updatedAt = new Date().toISOString();
  
  // Log the action
  const log = {
    id: 'log_' + crypto.randomUUID().substring(0, 8),
    submissionId,
    verifierName: req.user.name,
    status,
    notes: `Keputusan Final oleh Petugas: status permohonan ditetapkan menjadi [${status}]. ${status === 'Ditolak' ? 'Alasan: ' + rejectionReason : ''}${completedDocumentUrl ? ' (Dokumen KKPR Hasil berhasil diunggah)' : ''}`,
    createdAt: new Date().toISOString()
  };
  
  db.logs.push(log);
  saveDb(db);
  
  res.json({
    message: `Status pengajuan KKPR berhasil diubah secara final menjadi ${status}.`,
    submission,
    log
  });
});

// 5. LENGKAPI / PERBAIKI BERKAS YANG DITOLAK (PEMOHON)
app.post('/api/kkpr/submissions/:id/resubmit-documents', authenticateToken, (req: any, res: any) => {
  const submissionId = req.params.id;
  const { updatedDocuments, applicantNotes } = req.body;
  // updatedDocuments: Array<{ documentId: string; fileUrl: string; name: string; type: string; size: number }>

  if (!updatedDocuments || !Array.isArray(updatedDocuments) || updatedDocuments.length === 0) {
    return res.status(400).json({ message: 'Tidak ada berkas perbaikan yang dikirimkan.' });
  }

  const db = getDb();
  const submissionIndex = db.submissions.findIndex(s => s.id === submissionId);

  if (submissionIndex === -1) {
    return res.status(404).json({ message: 'Pengajuan KKPR tidak ditemukan.' });
  }

  const submission = db.submissions[submissionIndex];

  // Pemohon must own the submission, unless Petugas Verifikator assists
  if (req.user.role === 'Pemohon' && submission.userId !== req.user.id) {
    return res.status(403).json({ message: 'Anda tidak memiliki hak untuk memperbarui pengajuan ini.' });
  }

  const updatedDocNames: string[] = [];

  for (const item of updatedDocuments) {
    let doc = submission.documents.find(d => d.id === item.documentId);
    if (doc) {
      // Simpan catatan penolakan sebelumnya agar tetap tercatat jika diperlukan
      if (doc.rejectionReason) {
        doc.previousRejectionReason = doc.rejectionReason;
      }
      doc.fileUrl = item.fileUrl;
      if (item.name) doc.name = item.name;
      if (item.type) doc.type = item.type;
      if (item.size) doc.size = item.size;
      doc.status = 'Pending'; // Kembalikan ke Pending agar dapat diverifikasi ulang
      doc.rejectionReason = undefined; // Hapus penolakan aktif
      doc.isRevised = true;
      doc.revisedAt = new Date().toISOString();
      updatedDocNames.push(doc.name);
    } else {
      const newDoc = {
        id: item.documentId || 'doc_' + crypto.randomUUID().substring(0, 8),
        name: item.name || `Persyaratan Berkas`,
        type: item.type || 'application/pdf',
        size: item.size || 0,
        fileUrl: item.fileUrl,
        status: 'Pending' as const,
        isRevised: true,
        revisedAt: new Date().toISOString()
      };
      submission.documents.push(newDoc);
      updatedDocNames.push(newDoc.name);
    }
  }

  // Update overall submission status: ubah dari 'Ditolak' ke 'Diproses'
  submission.status = 'Diproses';
  submission.hasRevision = true;
  submission.revisionNotes = applicantNotes;
  submission.revisedAt = new Date().toISOString();
  submission.updatedAt = new Date().toISOString();

  // Buat audit log
  const log = {
    id: 'log_' + crypto.randomUUID().substring(0, 8),
    submissionId,
    verifierName: req.user.name,
    status: 'Diproses' as SubmissionStatus,
    notes: `Pemohon (${req.user.name}) telah melengkapi berkas perbaikan: ${updatedDocNames.join(', ')}.${applicantNotes ? ` Catatan: "${applicantNotes}"` : ''}`,
    createdAt: new Date().toISOString()
  };

  db.logs.push(log);
  saveDb(db);

  res.json({
    message: 'Berkas perbaikan berhasil dikirimkan! Pengajuan kini kembali diproses untuk verifikasi dinas.',
    submission,
    log
  });
});

// Get Audit Logs for a submission
app.get('/api/kkpr/submissions/:id/logs', authenticateToken, (req: any, res: any) => {
  const db = getDb();
  const filteredLogs = db.logs.filter(l => l.submissionId === req.params.id);
  res.json({ logs: filteredLogs });
});

// Reset semua permohonan & log
app.post('/api/kkpr/submissions/reset', authenticateToken, (req: any, res: any) => {
  const db = getDb();
  db.submissions = [];
  db.logs = [];
  saveDb(db);
  res.json({ message: 'Semua permohonan berhasil direset.', count: 0 });
});


// ==================== VITE & PORT INGRESS INTEGRATION ====================

function serveStatic() {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    app.get('*', (req, res) => {
      res.status(404).send('Direktori build "dist" tidak ditemukan. Pastikan Anda menjalankan "npm run build" terlebih dahulu.');
    });
  }
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.PORT || fs.existsSync(path.join(process.cwd(), 'dist'));
  if (!isProduction) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Gagal memulai Vite dev middleware, fallback ke static serving:', e);
      serveStatic();
    }
  } else {
    serveStatic();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Sistem Informasi KKPR berjalan di http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
