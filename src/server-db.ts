import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, KKPRSubmission, VerificationLog } from './types';

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  submissions: KKPRSubmission[];
  logs: VerificationLog[];
}

const isServerless = !!process.env.VERCEL;
const DB_PATH = isServerless 
  ? path.join('/tmp', 'database.json') 
  : path.join(process.cwd(), 'database.json');

// Helper to encrypt passwords using Node.js crypto
export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', 'kkpr-salt-key').update(password).digest('hex');
}

const initialData: DatabaseSchema = {
  users: [
    {
      id: 'usr_pemohon1',
      email: 'pemohon@gmail.com',
      name: 'Budi Santoso (CV. Maju Jaya)',
      role: 'Pemohon',
      passwordHash: hashPassword('pemohon123'),
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_verifikator1',
      email: 'petugas@kkpr.go.id',
      name: 'Siti Aminah, S.T. (Dinas Tata Ruang)',
      role: 'Petugas Verifikator',
      passwordHash: hashPassword('petugas123'),
      createdAt: new Date().toISOString()
    }
  ],
  submissions: [],
  logs: []
};

// Initialize DB_PATH in serverless environment from bundled database.json or initialData
if (isServerless && !fs.existsSync(DB_PATH)) {
  const bundledDbPath = path.join(process.cwd(), 'database.json');
  try {
    if (fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, DB_PATH);
    } else {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    }
  } catch (err) {
    console.error('Error copying bundled database to tmp:', err);
  }
}

export function getDb(): DatabaseSchema {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, returning initial:', err);
    return initialData;
  }
}

export function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}
