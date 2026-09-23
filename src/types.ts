export type Role = 'Pemohon' | 'Petugas Verifikator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  identityType?: 'KTP' | 'SIM' | 'Paspor';
  identityNumber?: string;
  phoneNumber?: string;
  address?: string;
  companyName?: string;
  createdAt: string;
}

export type SubmissionStatus = 'Pending' | 'Diproses' | 'Disetujui' | 'Ditolak';

export type DocumentStatus = 'Pending' | 'Disetujui' | 'Ditolak';

export interface KKPRDocument {
  id: string;
  name: string; // e.g. "KTP Pemohon", "Sertifikat Tanah", "Peta Lokasi & Koordinat", "Rencana Teknis Bangunan"
  type: string; // mime type
  size: number; // size in bytes
  fileUrl: string; // downloadable / previewable URL (data URI or endpoint)
  status: DocumentStatus;
  rejectionReason?: string;
  isRevised?: boolean;
  revisedAt?: string;
  previousRejectionReason?: string;
}

export interface KKPRSubmission {
  id: string;
  userId: string;
  applicantName: string;
  applicantAddress: string;
  identityType?: 'KTP' | 'SIM' | 'Paspor';
  identityNumber?: string;
  phoneNumber?: string;
  companyName?: string;
  npwp?: string;
  coordinates: string; // e.g., "-6.2088, 106.8456"
  polygonGIS?: string; // e.g., "[[-6.208, 106.845], [-6.209, 106.846], ...]"
  landArea: number; // in square meters
  plannedActivity: string;
  technicalSpecifications?: string;
  technicalDetails?: string;
  status: SubmissionStatus;
  documents: KKPRDocument[];
  rejectionReason?: string; // Overall verification notes/rejection reason
  hasRevision?: boolean;
  revisionNotes?: string;
  revisedAt?: string;
  completedDocumentUrl?: string; // Final KKPR document uploaded by Verifikator
  completedDocumentName?: string;
  completedDocumentSize?: number;
  completedDocumentUploadedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationLog {
  id: string;
  submissionId: string;
  verifierName: string;
  status: SubmissionStatus;
  notes: string;
  createdAt: string;
}

export function getRomanMonth(monthNum: number): string {
  const romanArray = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanArray[monthNum - 1] || 'I';
}

export function formatRegNumber(sub: { id: string; createdAt: string }): string {
  if (sub.id.startsWith('RegKKPR-')) {
    const parts = sub.id.split('-');
    if (parts.length === 4 && !isNaN(Number(parts[2]))) {
      const monthNum = parseInt(parts[2], 10);
      if (monthNum >= 1 && monthNum <= 12) {
        const roman = getRomanMonth(monthNum);
        return `RegKKPR-${parts[1]}-${roman}-${parts[3]}`;
      }
    }
    return sub.id;
  }
  const digits = sub.id.replace(/\D/g, '');
  const seqNumber = digits ? digits.slice(-3).padStart(3, '0') : '001';
  const dateObj = new Date(sub.createdAt);
  const romanMonth = getRomanMonth(dateObj.getMonth() + 1);
  const yearStr = String(dateObj.getFullYear());
  return `RegKKPR-${seqNumber}-${romanMonth}-${yearStr}`;
}

