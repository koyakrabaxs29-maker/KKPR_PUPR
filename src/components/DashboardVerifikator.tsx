import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, Map, Eye, Download, FileText, 
  Search, ShieldCheck, ListFilter, ArrowLeft, Send, RefreshCw, Layers, Upload, Trash2,
  AlertCircle, Phone, FileCheck, Check
} from 'lucide-react';
import { KKPRSubmission, KKPRDocument, SubmissionStatus, DocumentStatus, formatRegNumber } from '../types';
import { DOCUMENT_REQUIREMENTS, DocRequirement } from '../data/documentRequirements';

interface DashboardVerifikatorProps {
  token: string;
  user: any;
}

export default function DashboardVerifikator({ token, user }: DashboardVerifikatorProps) {
  const [submissions, setSubmissions] = useState<KKPRSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<KKPRSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'uploaded' | 'missing' | 'pending'>('all');

  // Active verification item states
  const [rejectionReasons, setRejectionReasons] = useState<{ [docId: string]: string }>({});
  const [showRejectInput, setShowRejectInput] = useState<{ [docId: string]: boolean }>({});
  const [submittingVerify, setSubmittingVerify] = useState<string | null>(null); // docId

  // Final manual decision states
  const [finalStatus, setFinalStatus] = useState<'Disetujui' | 'Ditolak'>('Disetujui');
  const [finalReason, setFinalReason] = useState('');
  const [submittingFinal, setSubmittingFinal] = useState(false);

  // Final issued KKPR document states
  const [completedFileUrl, setCompletedFileUrl] = useState<string | null>(null);
  const [completedFileName, setCompletedFileName] = useState<string | null>(null);
  const [completedFileSize, setCompletedFileSize] = useState<number | null>(null);
  const [uploadingCompletedDoc, setUploadingCompletedDoc] = useState(false);

  // Active Preview Document states
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string | null>(null);

  const handleSelectSubmission = (sub: KKPRSubmission | null) => {
    setSelectedSub(sub);
    setPreviewDocUrl(null);
    if (sub) {
      setCompletedFileUrl(sub.completedDocumentUrl || null);
      setCompletedFileName(sub.completedDocumentName || null);
      setCompletedFileSize(sub.completedDocumentSize || null);
      setFinalStatus(sub.status === 'Ditolak' ? 'Ditolak' : 'Disetujui');
      setFinalReason(sub.rejectionReason || '');
    } else {
      setCompletedFileUrl(null);
      setCompletedFileName(null);
      setCompletedFileSize(null);
      setFinalStatus('Disetujui');
      setFinalReason('');
    }
  };

  const handleCompletedDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`Ukuran file "${file.name}" melebihi batas maksimal 5MB.`);
      return;
    }

    // Validate type (PDF or Image)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert(`Format file "${file.name}" tidak didukung. Harap unggah format PDF, JPG, atau PNG.`);
      return;
    }

    setUploadingCompletedDoc(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        const res = await fetch('/api/kkpr/upload', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal mengunggah file.');
        }

        setCompletedFileUrl(data.fileUrl);
        setCompletedFileName(file.name);
        setCompletedFileSize(file.size);
      } catch (err: any) {
        alert(err.message || 'Error uploading file.');
      } finally {
        setUploadingCompletedDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/kkpr/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat seluruh pengajuan.');
      }
      setSubmissions(data.submissions);
      
      // Keep selected submission updated if already open
      setSelectedSub(prev => {
        if (!prev) return null;
        return data.submissions.find((s: any) => s.id === prev.id) || prev;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDocForRequirement = (req: DocRequirement, docs?: KKPRDocument[]) => {
    if (!docs || !Array.isArray(docs)) return undefined;
    // 1. Direct ID match
    let found = docs.find(d => d.id === req.id);
    if (found) return found;

    // 2. Prefix number match in name, e.g. "1." or "1 "
    found = docs.find(d => {
      const name = d.name.trim();
      return name.startsWith(`${req.number}.`) || name.startsWith(`${req.number} `);
    });
    if (found) return found;

    // 3. Keyword semantic match for the standard 12 items
    found = docs.find(d => {
      const docLower = d.name.toLowerCase();
      if (req.number === 1 && (docLower.includes('peta bidang') || docLower.includes('koordinat'))) return true;
      if (req.number === 2 && docLower.includes('sempadan')) return true;
      if (req.number === 3 && docLower.includes('luas lahan')) return true;
      if (req.number === 4 && (docLower.includes('penguasaan') || docLower.includes('sertipikat') || docLower.includes('sertifikat') || docLower.includes('tanah'))) return true;
      if (req.number === 5 && docLower.includes('informasi bangunan')) return true;
      if (req.number === 6 && (docLower.includes('kegiatan/usaha') || docLower.includes('badan usaha') || docLower.includes('akta') || docLower.includes('nib'))) return true;
      if (req.number === 7 && (docLower.includes('rencana teknis') || docLower.includes('tampak') || docLower.includes('denah'))) return true;
      if (req.number === 8 && (docLower.includes('mandiri') || docLower.includes('umk'))) return true;
      if (req.number === 9 && (docLower.includes('online') || docLower.includes('oss'))) return true;
      if (req.number === 10 && (docLower.includes('pnbp') || docLower.includes('penerimaan negara'))) return true;
      if (req.number === 11 && (docLower.includes('pertimbangan teknis') || docLower.includes('ptp'))) return true;
      if (req.number === 12 && docLower.includes('kebenaran data')) return true;
      return false;
    });
    return found;
  };

  const reqStats = useMemo(() => {
    if (!selectedSub) return { total: 12, uploaded: 0, missingRequired: 0, missingOptional: 0, approved: 0, rejected: 0, pending: 0 };
    let uploaded = 0;
    let missingRequired = 0;
    let missingOptional = 0;
    let approved = 0;
    let rejected = 0;
    let pending = 0;

    DOCUMENT_REQUIREMENTS.forEach(req => {
      const doc = getDocForRequirement(req, selectedSub.documents);
      if (doc && doc.fileUrl) {
        uploaded++;
        if (doc.status === 'Disetujui') approved++;
        else if (doc.status === 'Ditolak') rejected++;
        else pending++;
      } else {
        if (req.required) missingRequired++;
        else missingOptional++;
        if (doc?.status === 'Ditolak') rejected++;
      }
    });

    return {
      total: DOCUMENT_REQUIREMENTS.length,
      uploaded,
      missingRequired,
      missingOptional,
      approved,
      rejected,
      pending
    };
  }, [selectedSub]);

  const matchedIds = useMemo(() => {
    if (!selectedSub || !selectedSub.documents) return new Set<string>();
    const ids = new Set<string>();
    DOCUMENT_REQUIREMENTS.forEach(req => {
      const doc = getDocForRequirement(req, selectedSub.documents);
      if (doc && doc.id) ids.add(doc.id);
    });
    return ids;
  }, [selectedSub]);

  const extraDocuments = useMemo(() => {
    if (!selectedSub || !selectedSub.documents) return [];
    return selectedSub.documents.filter(d => !matchedIds.has(d.id));
  }, [selectedSub, matchedIds]);

  const filteredReqs = useMemo(() => {
    return DOCUMENT_REQUIREMENTS.filter(req => {
      const doc = selectedSub ? getDocForRequirement(req, selectedSub.documents) : undefined;
      const isUploaded = Boolean(doc && doc.fileUrl);
      if (docFilter === 'uploaded') return isUploaded;
      if (docFilter === 'missing') return !isUploaded;
      if (docFilter === 'pending') return isUploaded && doc?.status === 'Pending';
      return true;
    });
  }, [selectedSub, docFilter]);

  const handleDocumentVerify = async (
    docId: string, 
    status: 'Disetujui' | 'Ditolak',
    documentName?: string,
    customReason?: string
  ) => {
    if (!selectedSub) return;
    
    const reason = customReason || rejectionReasons[docId];
    if (status === 'Ditolak' && !reason) {
      alert('Alasan penolakan dokumen harus diisi.');
      return;
    }

    setSubmittingVerify(docId);
    try {
      const response = await fetch(`/api/kkpr/submissions/${selectedSub.id}/verify-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: docId,
          status,
          rejectionReason: status === 'Ditolak' ? reason : undefined,
          documentName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui verifikasi dokumen.');
      }

      setShowRejectInput(prev => ({ ...prev, [docId]: false }));
      // Refresh list & local selection
      await fetchSubmissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingVerify(null);
    }
  };

  const handleRejectMissingRequirement = (req: DocRequirement) => {
    const defaultReason = `Berkas persyaratan nomor ${req.number} (${req.title}) belum dilampirkan oleh pemohon. Harap lengkapi dan unggah berkas ini.`;
    setRejectionReasons(prev => ({ ...prev, [req.id]: defaultReason }));
    setShowRejectInput(prev => ({ ...prev, [req.id]: true }));
  };

  const handleFlagAllMissingRequirements = async () => {
    if (!selectedSub) return;
    const missingReqs = DOCUMENT_REQUIREMENTS.filter(req => {
      if (!req.required) return false;
      const doc = getDocForRequirement(req, selectedSub.documents);
      return !doc || !doc.fileUrl;
    });

    if (missingReqs.length === 0) {
      alert('Seluruh berkas persyaratan wajib sudah dilampirkan.');
      return;
    }

    const confirmFlag = window.confirm(
      `Terdapat ${missingReqs.length} persyaratan wajib yang belum dilampirkan. Tandai semua sebagai "Perlu Dilengkapi" dan minta pemohon melengkapi?`
    );
    if (!confirmFlag) return;

    setSubmittingVerify('bulk_missing');
    try {
      for (const req of missingReqs) {
        const defaultReason = `Berkas persyaratan nomor ${req.number} (${req.title}) wajib dilampirkan namun belum diunggah oleh pemohon. Harap lengkapi berkas ini.`;
        await fetch(`/api/kkpr/submissions/${selectedSub.id}/verify-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            documentId: req.id,
            status: 'Ditolak',
            rejectionReason: defaultReason,
            documentName: `${req.number}. ${req.title}`
          })
        });
      }
      alert(`${missingReqs.length} persyaratan yang belum lengkap telah ditandai. Pemohon dapat memperbaikinya via tombol Lengkapi Berkas.`);
      await fetchSubmissions();
    } catch (err: any) {
      alert(err.message || 'Gagal menandai berkas.');
    } finally {
      setSubmittingVerify(null);
    }
  };

  const handleFinalDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    if (finalStatus === 'Ditolak' && !finalReason) {
      alert('Harap isi alasan penolakan secara keseluruhan.');
      return;
    }

    setSubmittingFinal(true);
    try {
      const response = await fetch(`/api/kkpr/submissions/${selectedSub.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: finalStatus,
          rejectionReason: finalStatus === 'Ditolak' ? finalReason : undefined,
          completedDocumentUrl: finalStatus === 'Disetujui' ? completedFileUrl : undefined,
          completedDocumentName: finalStatus === 'Disetujui' ? completedFileName : undefined,
          completedDocumentSize: finalStatus === 'Disetujui' ? completedFileSize : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengirimkan keputusan final.');
      }

      alert('Keputusan verifikasi final berhasil ditetapkan.');
      setFinalReason('');
      await fetchSubmissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingFinal(false);
    }
  };

  const handleResetAllSubmissions = async () => {
    const confirmReset = window.confirm(
      'Apakah Anda yakin ingin mereset/menghapus seluruh data permohonan KKPR? Tindakan ini akan mengosongkan seluruh antrean pengajuan.'
    );
    if (!confirmReset) return;

    try {
      const res = await fetch('/api/kkpr/submissions/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal mereset permohonan.');
      }
      alert('Seluruh data permohonan berhasil direset.');
      setSelectedSub(null);
      await fetchSubmissions();
    } catch (err: any) {
      alert(err.message || 'Gagal mereset data permohonan.');
    }
  };

  // Submissions filter logic
  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = filter === 'All' || sub.status === filter;
    const matchesSearch = 
      sub.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plannedActivity.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'Disetujui':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-500" />Disetujui</span>;
      case 'Ditolak':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100"><XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />Ditolak</span>;
      case 'Diproses':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"><Clock className="h-3.5 w-3.5 mr-1 text-blue-500" />Diproses</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100"><Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />Pending</span>;
    }
  };

  const getDocStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Disetujui':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="h-3 w-3 mr-1" />Lolos</span>;
      case 'Ditolak':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Ditolak</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="verifikator-dashboard">
      
      {/* Detail view is rendered when a submission is selected */}
      {selectedSub ? (
        <div className="space-y-6" id="detail-submission-panel">
          <button
            onClick={() => handleSelectSubmission(null)}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-[#1B355A] hover:text-[#0F223D] mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Pengajuan</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Applicant Information Sheet & Document Checklist (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Revision Alert Banner for Verifier */}
              {selectedSub.hasRevision && (
                <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4.5 flex items-start space-x-3.5 shadow-2xs animate-fadeIn">
                  <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl mt-0.5 flex-shrink-0">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin-once" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-blue-950 uppercase tracking-wider block">
                      Pemohon Telah Melengkapi Berkas Revisi
                    </span>
                    <p className="text-blue-900 leading-relaxed">
                      Pemohon telah mengunggah berkas perbaikan untuk dokumen yang sebelumnya ditolak pada{' '}
                      {new Date(selectedSub.revisedAt || selectedSub.updatedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      . Silakan verifikasi ulang berkas bertanda <strong className="text-blue-700">"Diperbarui Pemohon"</strong> di bawah.
                    </p>
                    {selectedSub.revisionNotes && (
                      <div className="text-[11px] text-blue-900 bg-white/90 p-2.5 rounded-lg border border-blue-200 mt-2">
                        <strong>Catatan Pemohon:</strong> "{selectedSub.revisionNotes}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-4 border-b border-slate-100 mb-6 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold tracking-wider uppercase block">Detail Pengajuan KKPR</span>
                    <h2 className="text-xl font-bold text-slate-800 mt-1">Registrasi: {formatRegNumber(selectedSub)}</h2>
                  </div>
                  <div>{getStatusBadge(selectedSub.status)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-700">
                  {/* Profil & Legalitas Pemohon */}
                  <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">
                      Profil & Legalitas
                    </span>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nama Pemohon</span>
                      <span className="text-slate-800 font-bold text-sm block mt-0.5">{selectedSub.applicantName}</span>
                    </div>

                    {selectedSub.identityType && selectedSub.identityNumber && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Identitas ({selectedSub.identityType})</span>
                        <span className="text-slate-800 font-mono font-medium text-xs block mt-0.5">{selectedSub.identityNumber}</span>
                      </div>
                    )}

                    {selectedSub.npwp && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">NPWP</span>
                        <span className="text-slate-800 font-mono font-medium text-xs block mt-0.5">{selectedSub.npwp}</span>
                      </div>
                    )}

                    {selectedSub.companyName && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Perusahaan / Instansi</span>
                        <span className="text-[#1B355A] font-bold text-xs block mt-0.5">{selectedSub.companyName}</span>
                      </div>
                    )}

                    {selectedSub.phoneNumber && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kontak / WhatsApp Pemohon</span>
                        <a 
                          href={`https://wa.me/${selectedSub.phoneNumber.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#1B355A] font-mono font-bold text-xs hover:underline flex items-center space-x-1.5 mt-0.5"
                        >
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{selectedSub.phoneNumber}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-sans font-medium">Chat WA</span>
                        </a>
                      </div>
                    )}

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Alamat Pemohon</span>
                      <span className="text-slate-700 text-xs block mt-0.5 leading-relaxed">{selectedSub.applicantAddress}</span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rencana Kegiatan</span>
                      <span className="text-[#1B355A] font-bold text-xs block mt-0.5">{selectedSub.plannedActivity}</span>
                    </div>
                  </div>

                  {/* Data Lokasi & Spesifikasi Teknis */}
                  <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">
                      Data Teknis & Lokasi
                    </span>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Koordinat Titik Lokasi</span>
                      <span className="text-slate-800 font-mono font-medium text-xs block mt-0.5">{selectedSub.coordinates}</span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Luas Lahan</span>
                      <span className="text-slate-800 font-bold text-sm block mt-0.5">{selectedSub.landArea} m²</span>
                    </div>

                    {selectedSub.polygonGIS && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Koordinat Polygon GIS</span>
                        <code className="text-[10px] bg-white border border-slate-200 rounded p-1.5 block truncate max-w-full font-mono mt-0.5 text-slate-700">{selectedSub.polygonGIS}</code>
                      </div>
                    )}

                    {selectedSub.technicalSpecifications && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Spesifikasi Teknis Bangunan</span>
                        <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-0.5 leading-relaxed">{selectedSub.technicalSpecifications}</p>
                      </div>
                    )}

                    {selectedSub.technicalDetails && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Data Teknis Tambahan</span>
                        <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-0.5 leading-relaxed">{selectedSub.technicalDetails}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSub.completedDocumentUrl && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Dokumen Hasil KKPR Resmi Terbit</span>
                      <span className="text-xs font-bold text-slate-800 block mt-1">{selectedSub.completedDocumentName}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Diunggah pada {new Date(selectedSub.completedDocumentUploadedAt || selectedSub.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <a
                      href={selectedSub.completedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#1B355A] hover:bg-[#0F223D] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer self-start sm:self-center"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Unduh Dokumen Hasil
                    </a>
                  </div>
                )}
              </div>

              {/* Document List and Verification Checklist */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">Verifikasi Berkas Persyaratan KKPR</h3>
                      <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        12 Persyaratan SOP
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Pemeriksaan kelengkapan berkas legalitas dan teknis sesuai Standar Pelayanan KKPR Kab. Karimun.
                    </p>
                  </div>

                  {/* Completeness Quick Summary Pill */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${
                      reqStats.missingRequired > 0 
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {reqStats.missingRequired > 0 ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                          Berkas Belum Lengkap ({reqStats.missingRequired} Wajib Kurang)
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                          Semua Persyaratan Wajib Terpenuhi
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Completeness Metric Progress Bar */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-700">Tingkat Kelengkapan Berkas:</span>
                      <span className="font-extrabold text-[#1B355A]">{reqStats.uploaded} dari 12 Berkas Diunggah</span>
                      <span className="text-slate-400 font-mono text-[11px]">({Math.round((reqStats.uploaded / 12) * 100)}%)</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px]">
                      <span className="text-emerald-700 font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 inline-block"></span>
                        {reqStats.approved} Lolos
                      </span>
                      <span className="text-rose-700 font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5 inline-block"></span>
                        {reqStats.rejected} Ditolak
                      </span>
                      <span className="text-amber-700 font-semibold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 inline-block"></span>
                        {reqStats.pending} Menunggu
                      </span>
                    </div>
                  </div>

                  {/* Progress bar visual */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300" 
                      style={{ width: `${(reqStats.approved / 12) * 100}%` }}
                      title={`${reqStats.approved} Berkas Lolos`}
                    />
                    <div 
                      className="bg-rose-500 h-full transition-all duration-300" 
                      style={{ width: `${(reqStats.rejected / 12) * 100}%` }}
                      title={`${reqStats.rejected} Berkas Ditolak`}
                    />
                    <div 
                      className="bg-amber-400 h-full transition-all duration-300" 
                      style={{ width: `${(reqStats.pending / 12) * 100}%` }}
                      title={`${reqStats.pending} Berkas Menunggu`}
                    />
                  </div>

                  {/* If mandatory files are missing: Alert Banner with Action */}
                  {reqStats.missingRequired > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-100/70 border border-amber-300/80 rounded-lg p-3 text-xs text-amber-900 mt-2">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Perhatian Verifikator:</span>
                          <span>Terdapat {reqStats.missingRequired} berkas persyaratan wajib yang belum dilampirkan oleh pemohon. Anda dapat menandai berkas ini agar pemohon melengkapinya via fitur Lengkapi Berkas.</span>
                        </div>
                      </div>
                      <button
                        onClick={handleFlagAllMissingRequirements}
                        disabled={submittingVerify === 'bulk_missing'}
                        className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer flex-shrink-0 self-start sm:self-center"
                      >
                        {submittingVerify === 'bulk_missing' ? 'Memproses...' : 'Minta Lengkapi Semua Berkas Kurang'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter Tabs for Document List */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
                  <button
                    onClick={() => setDocFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      docFilter === 'all'
                        ? 'bg-[#1B355A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua 12 Persyaratan
                  </button>
                  <button
                    onClick={() => setDocFilter('uploaded')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      docFilter === 'uploaded'
                        ? 'bg-[#1B355A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sudah Diunggah ({reqStats.uploaded})
                  </button>
                  <button
                    onClick={() => setDocFilter('missing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      docFilter === 'missing'
                        ? 'bg-[#1B355A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Belum Dilampirkan ({reqStats.missingRequired + reqStats.missingOptional})
                  </button>
                  <button
                    onClick={() => setDocFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      docFilter === 'pending'
                        ? 'bg-[#1B355A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Perlu Diverifikasi ({reqStats.pending})
                  </button>
                </div>

                {/* 12 Official Requirements Checklist */}
                <div className="space-y-4">
                  {filteredReqs.map(req => {
                    const doc = getDocForRequirement(req, selectedSub.documents);
                    const isUploaded = Boolean(doc && doc.fileUrl);
                    const hasReasonInput = showRejectInput[req.id] || (doc && showRejectInput[doc.id]);
                    const docIdToUse = doc ? doc.id : req.id;

                    return (
                      <div 
                        key={req.id} 
                        className={`border rounded-xl p-4 transition-all duration-150 ${
                          isUploaded
                            ? doc?.status === 'Disetujui'
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : doc?.status === 'Ditolak'
                              ? 'border-rose-200 bg-rose-50/20'
                              : 'border-slate-200 bg-white'
                            : doc?.status === 'Ditolak'
                            ? 'border-rose-200 bg-rose-50/30'
                            : req.required
                            ? 'border-amber-200/90 bg-amber-50/20'
                            : 'border-slate-200/70 bg-slate-50/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Number, Tag, & Title */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-slate-900">
                                {req.number}. {req.title}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${req.tagColor}`}>
                                {req.tag}
                              </span>
                              {doc?.isRevised && (
                                <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                                  <RefreshCw className="h-2.5 w-2.5 mr-1 text-blue-600 animate-spin-once" /> Diperbarui Pemohon
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                              {req.subtitle}
                            </p>

                            {/* Sub items if applicable */}
                            {req.subItems && req.subItems.length > 0 && (
                              <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60 text-[11px] text-slate-600 space-y-1 mt-2">
                                <span className="font-semibold text-slate-700 block">Rincian Dokumen yang Diperiksa:</span>
                                {req.subItems.map((sub, sIdx) => (
                                  <div key={sIdx} className="pl-1">
                                    <span>{sub.text}</span>
                                    {sub.subList && (
                                      <ul className="pl-4 list-disc space-y-0.5 text-slate-500">
                                        {sub.subList.map((li, lIdx) => (
                                          <li key={lIdx}>{li}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* File Upload Details or Missing Notice */}
                            {isUploaded && doc ? (
                              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 pt-1">
                                <span className="inline-flex items-center font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  <FileText className="h-3 w-3 mr-1 text-slate-500" />
                                  Format: {doc.type || 'Dokumen'}
                                </span>
                                {doc.size > 0 && (
                                  <span className="text-slate-500">
                                    Ukuran: {(doc.size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                )}
                                {doc.previousRejectionReason && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded block w-full mt-1">
                                    Catatan penolakan sebelumnya: "{doc.previousRejectionReason}"
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="pt-1">
                                {doc?.status === 'Ditolak' ? (
                                  <div className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200 px-2.5 py-1 rounded-lg">
                                    <XCircle className="h-3.5 w-3.5 mr-1.5 text-rose-600 flex-shrink-0" />
                                    <span>Telah ditolak / diminta melengkapi: "{doc.rejectionReason}"</span>
                                  </div>
                                ) : (
                                  <div className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
                                    req.required
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500 flex-shrink-0" />
                                    <span>Berkas belum diunggah oleh pemohon dalam sistem {req.required ? '(Persyaratan Wajib)' : '(Opsional)'}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right Side: Status Badge & Preview/Download */}
                          <div className="flex sm:flex-col items-end gap-2 flex-shrink-0 self-start">
                            {isUploaded && doc ? (
                              <>
                                <div>{getDocStatusBadge(doc.status)}</div>
                                <div className="flex items-center space-x-1.5 mt-1">
                                  <button
                                    onClick={() => {
                                      setPreviewDocUrl(doc.fileUrl);
                                      setPreviewDocName(doc.name);
                                    }}
                                    className="inline-flex items-center px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                                    title="Lihat Dokumen"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                    Pratinjau
                                  </button>
                                  <a
                                    href={doc.fileUrl}
                                    download={doc.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                                    title="Unduh Berkas"
                                  >
                                    <Download className="h-3.5 w-3.5 text-slate-500" />
                                  </a>
                                </div>
                              </>
                            ) : (
                              <div>
                                {doc?.status === 'Ditolak' ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" /> Perlu Dilengkapi
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    Belum Diunggah
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Verification Action Bar */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/60 mt-3">
                          {isUploaded && doc ? (
                            <>
                              <button
                                onClick={() => handleDocumentVerify(doc.id, 'Disetujui', `${req.number}. ${req.title}`)}
                                disabled={submittingVerify === doc.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                                  doc.status === 'Disetujui'
                                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                                }`}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Lolos Verifikasi</span>
                              </button>

                              <button
                                onClick={() => {
                                  setShowRejectInput({ ...showRejectInput, [doc.id]: !hasReasonInput });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                                  doc.status === 'Ditolak'
                                    ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-600/30'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                                }`}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Tolak Berkas</span>
                              </button>

                              {doc.rejectionReason && (
                                <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                                  Catatan Penolakan: "{doc.rejectionReason}"
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRejectMissingRequirement(req)}
                                disabled={submittingVerify === req.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 shadow-2xs"
                              >
                                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                <span>Tolak & Minta Pemohon Lengkapi</span>
                              </button>
                            </>
                          )}
                        </div>

                        {/* Rejection Input Drawer */}
                        {hasReasonInput && (
                          <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2.5 mt-3 shadow-2xs animate-fadeIn">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Alasan Penolakan / Catatan Perbaikan Persyaratan No. {req.number} *
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder={`e.g. Berkas ${req.title} belum dilampirkan atau tidak sah.`}
                                value={rejectionReasons[docIdToUse] || ''}
                                onChange={(e) => setRejectionReasons({ ...rejectionReasons, [docIdToUse]: e.target.value })}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1B355A]/30 focus:border-[#1B355A] text-slate-800"
                              />
                              <button
                                onClick={() => {
                                  handleDocumentVerify(
                                    docIdToUse, 
                                    'Ditolak', 
                                    `${req.number}. ${req.title}`,
                                    rejectionReasons[docIdToUse]
                                  );
                                  setShowRejectInput({ ...showRejectInput, [docIdToUse]: false });
                                }}
                                disabled={submittingVerify === docIdToUse}
                                className="bg-[#1B355A] hover:bg-[#0F223D] text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Simpan Keputusan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Extra Uploaded Documents Section if any */}
                {extraDocuments.length > 0 && (
                  <div className="pt-6 border-t border-slate-200/80 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Lampiran & Dokumen Teknis Tambahan</h4>
                      <p className="text-xs text-slate-500">Dokumen pendukung lainnya yang diunggah oleh pemohon di luar 12 berkas utama.</p>
                    </div>

                    <div className="space-y-3">
                      {extraDocuments.map(doc => {
                        const hasReasonInput = showRejectInput[doc.id];
                        return (
                          <div key={doc.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center space-x-3 truncate">
                                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                <div className="truncate">
                                  <span className="text-xs font-bold text-slate-800 block truncate">{doc.name}</span>
                                  <span className="text-[10px] text-slate-400">
                                    Format: {doc.type} | Ukuran: {(doc.size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {getDocStatusBadge(doc.status)}
                                <button
                                  onClick={() => {
                                    setPreviewDocUrl(doc.fileUrl);
                                    setPreviewDocName(doc.name);
                                  }}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Pratinjau
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-2 border-t border-slate-200/50">
                              <button
                                onClick={() => handleDocumentVerify(doc.id, 'Disetujui', doc.name)}
                                disabled={submittingVerify === doc.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                                  doc.status === 'Disetujui'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Lolos Verifikasi</span>
                              </button>

                              <button
                                onClick={() => setShowRejectInput({ ...showRejectInput, [doc.id]: !hasReasonInput })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                                  doc.status === 'Ditolak'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700'
                                }`}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Tolak Berkas</span>
                              </button>

                              {doc.rejectionReason && (
                                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                                  Alasan: "{doc.rejectionReason}"
                                </span>
                              )}
                            </div>

                            {hasReasonInput && (
                              <div className="bg-white border border-slate-200 p-3 rounded-lg flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Alasan penolakan dokumen lampiran..."
                                  value={rejectionReasons[doc.id] || ''}
                                  onChange={(e) => setRejectionReasons({ ...rejectionReasons, [doc.id]: e.target.value })}
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                                />
                                <button
                                  onClick={() => {
                                    handleDocumentVerify(doc.id, 'Ditolak', doc.name, rejectionReasons[doc.id]);
                                    setShowRejectInput({ ...showRejectInput, [doc.id]: false });
                                  }}
                                  disabled={submittingVerify === doc.id}
                                  className="bg-[#1B355A] hover:bg-[#0F223D] text-white font-bold text-xs px-3 py-1.5 rounded-lg"
                                >
                                  Kirim
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: File Preview Frame & Final Decision Panel (5 Cols, Sticky) */}
            <div className="w-full lg:col-span-5 space-y-6 lg:sticky lg:top-6 lg:self-start">
              
              {/* Document Live Preview Panel */}
              {previewDocUrl && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-[220px]">{previewDocName}</span>
                    <button 
                      onClick={() => setPreviewDocUrl(null)} 
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Tutup Preview
                    </button>
                  </div>
                  
                  {previewDocUrl.endsWith('.pdf') || previewDocUrl.includes('pdf') ? (
                    <div className="h-64 border border-slate-200 bg-slate-50 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                      <FileText className="h-10 w-10 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-600 font-bold">Simulasi File PDF Terunggah</span>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1">Sistem berjalan di container preview sandbox.</p>
                      <a 
                        href={previewDocUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="mt-3 inline-flex items-center text-xs text-[#1B355A] font-bold bg-sky-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Unduh PDF
                      </a>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-3 h-64">
                      {/* Using fallback referrer policy for security constraint */}
                      <img 
                        src={previewDocUrl} 
                        alt="Doc Preview" 
                        className="max-h-full max-w-full object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Manual/Finalize Verification Override Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3.5 flex items-center">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#1B355A] mr-1.5" />
                  Keputusan Verifikasi Final
                </h3>
                
                <form onSubmit={handleFinalDecision} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1.5">Tentukan Keputusan</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFinalStatus('Disetujui')}
                        className={`py-2.5 px-3 border rounded-xl font-bold text-center transition-all cursor-pointer ${
                          finalStatus === 'Disetujui'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/10'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Setujui KKPR
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinalStatus('Ditolak')}
                        className={`py-2.5 px-3 border rounded-xl font-bold text-center transition-all cursor-pointer ${
                          finalStatus === 'Ditolak'
                            ? 'border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/10'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Tolak KKPR
                      </button>
                    </div>
                  </div>

                  {finalStatus !== 'Disetujui' && (
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1.5">Catatan / Alasan (Wajib jika menolak)</label>
                      <textarea
                        rows={3}
                        value={finalReason}
                        onChange={(e) => setFinalReason(e.target.value)}
                        placeholder="Masukkan alasan lengkap penolakan atau catatan kesesuaian ruang..."
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                      />
                    </div>
                  )}

                  {finalStatus === 'Disetujui' && (
                    <div className="space-y-2 border border-slate-200/60 bg-slate-50/50 p-3.5 rounded-xl">
                      <span className="block text-slate-700 font-bold mb-1">Upload Dokumen KKPR Hasil (PDF / Gambar)</span>
                      <span className="block text-[10px] text-slate-500 leading-tight">Unggah berkas kesesuaian ruang resmi yang telah disahkan dinas agar pemohon dapat mengunduhnya.</span>
                      
                      {completedFileUrl ? (
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1.5 truncate max-w-[200px]">
                            <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-[11px] text-slate-700 font-medium truncate">{completedFileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCompletedFileUrl(null);
                              setCompletedFileName(null);
                              setCompletedFileSize(null);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer ml-1"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed border-slate-300 rounded-lg hover:border-[#1B355A] transition-colors p-3.5 mt-2 text-center bg-white">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleCompletedDocUpload}
                            disabled={uploadingCompletedDoc}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <Upload className="h-4 w-4 text-slate-400" />
                            <span className="text-[10px] text-slate-600 font-semibold">
                              {uploadingCompletedDoc ? 'Mengunggah...' : 'Klik untuk unggah Dokumen KKPR'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingFinal || uploadingCompletedDoc}
                    className="w-full py-2.5 bg-[#1B355A] hover:bg-[#0F223D] text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                    id="btn-final-decision"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Kirim Keputusan Final</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LIST OF INCOMING KKPR REQUESTS */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Verifikator Dinas</h1>
              <p className="text-sm text-slate-500 mt-1">Lakukan pemeriksaan dokumen legalitas KKPR pemohon dan berikan keputusan kesesuaian.</p>
            </div>
            <div className="flex items-center space-x-2.5 self-start md:self-center">
              <button
                onClick={handleResetAllSubmissions}
                className="inline-flex items-center space-x-1.5 px-3 py-2 border border-red-200 rounded-xl bg-white hover:bg-red-50 text-red-600 transition-all text-xs font-bold cursor-pointer shadow-2xs"
                title="Reset/Hapus Seluruh Permohonan"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span>Reset Semua Permohonan</span>
              </button>
              <button
                onClick={fetchSubmissions}
                className="inline-flex items-center justify-center p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-all duration-200 shadow-2xs cursor-pointer"
                title="Muat Ulang"
              >
                <RefreshCw className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Quick Search & Filters Row */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="filters-row">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pemohon, nomor registrasi, atau rencana kegiatan..."
                className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2">
              <ListFilter className="h-4 w-4 text-slate-400" />
              <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/50 text-xs font-semibold">
                {(['All', 'Pending', 'Diproses', 'Disetujui', 'Ditolak'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer border ${
                      filter === status
                        ? 'bg-[#1B355A] text-white border-[#EAB630] shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 border-transparent'
                    }`}
                  >
                    {status === 'All' ? 'Semua' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submissions Table / Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="table-pengajuan-masuk">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Daftar Berkas Masuk</h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <span>Memuat seluruh berkas KKPR...</span>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Layers className="h-10 w-10 text-slate-300 mx-auto" />
                <span className="block font-semibold">Tidak ada pengajuan berkas</span>
                <span className="block text-xs text-slate-400 max-w-sm mx-auto">
                  Belum ada berkas masuk yang sesuai dengan filter pencarian saat ini.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">ID Reg</th>
                      <th className="px-6 py-3.5">Nama Pemohon</th>
                      <th className="px-6 py-3.5">Rencana Kegiatan</th>
                      <th className="px-6 py-3.5 text-center">Luas Lahan</th>
                      <th className="px-6 py-3.5">Tanggal Berkas</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                          <div className="flex items-center space-x-1.5">
                            <span>{formatRegNumber(sub)}</span>
                            {sub.hasRevision && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                Revisi
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800 block">{sub.applicantName}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{sub.applicantAddress}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#1B355A]">{sub.plannedActivity}</td>
                        <td className="px-6 py-4 text-center font-semibold">{sub.landArea} m²</td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSelectSubmission(sub)}
                            className="inline-flex items-center px-3 py-1.5 bg-[#1B355A]/5 hover:bg-[#1B355A]/10 text-[#1B355A] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Periksa Berkas
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
