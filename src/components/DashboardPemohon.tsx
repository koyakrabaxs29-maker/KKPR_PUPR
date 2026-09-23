import React, { useState, useEffect } from 'react';
import { 
  Plus, MapPin, Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle, 
  Map, User, Landmark, HelpCircle, Eye, ChevronDown, ChevronUp, RefreshCw, Send, Download,
  FileCheck, ShieldCheck, Check, Sparkles, Building2, Info, Paperclip, UploadCloud,
  Layers, GitFork, Workflow, ArrowRight, Phone, Trash2
} from 'lucide-react';
import { KKPRSubmission, KKPRDocument, DocumentStatus, SubmissionStatus, formatRegNumber } from '../types';
import { ModalLengkapiBerkas } from './ModalLengkapiBerkas';
import { SkemaAlurTracker } from './SkemaAlurTracker';
import { DOCUMENT_REQUIREMENTS, DocRequirement } from '../data/documentRequirements';
export { DOCUMENT_REQUIREMENTS, type DocRequirement };

export interface UploadedDocFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface DashboardPemohonProps {
  token: string;
  user: any;
}

export default function DashboardPemohon({ token, user }: DashboardPemohonProps) {
  const [submissions, setSubmissions] = useState<KKPRSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 10 ISIAN DATA PEMOHON
  const [applicantName, setApplicantName] = useState(user?.name || ''); // 1. Nama Pemohon
  const [applicantAddress, setApplicantAddress] = useState(user?.address || ''); // 2. Alamat Pemohon
  const [identityType, setIdentityType] = useState<'KTP' | 'SIM' | 'Paspor'>(user?.identityType || 'KTP');
  const [identityNumber, setIdentityNumber] = useState(user?.identityNumber || ''); // 3. No. Identitas Pemohon
  const [npwp, setNpwp] = useState(user?.npwp || ''); // 4. NPWP
  const [companyName, setCompanyName] = useState(user?.companyName || ''); // 5. Nama Perusahaan (Opsional)
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [coordinates, setCoordinates] = useState(''); // 6. Koordinat Lokasi (Latitude, Longitude)*
  const [polygonGIS, setPolygonGIS] = useState(''); // 7. Koordinat Polygon Opsional
  const [landArea, setLandArea] = useState(''); // 8. Luas Lahan (M²)
  const [plannedActivity, setPlannedActivity] = useState(''); // 9. Rencana Kegiatan Pemanfaatan*
  const [technicalDetails, setTechnicalDetails] = useState(''); // 10. Data Teknis Tambahan (Opsional)
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');
  
  // 12 PERSYARATAN UNGGAH DOKUMEN STATE
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocFile>>({});
  const [autoConfirmed, setAutoConfirmed] = useState<Record<string, boolean>>({
    doc_8: true,
    doc_9: true
  });
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Modal Lengkapi Berkas yang Ditolak State
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [selectedSubForResubmit, setSelectedSubForResubmit] = useState<KKPRSubmission | null>(null);
  const [resubmitSuccessBanner, setResubmitSuccessBanner] = useState<string | null>(null);

  const handleOpenResubmit = (sub: KKPRSubmission) => {
    setSelectedSubForResubmit(sub);
    setResubmitModalOpen(true);
  };

  const handleResubmitSuccess = (updatedSub: KKPRSubmission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updatedSub.id ? updatedSub : s)));
    setResubmitSuccessBanner(
      `Berkas perbaikan untuk pengajuan No. ${formatRegNumber(updatedSub)} berhasil dikirimkan ke Petugas Verifikator. Status pengajuan kini beralih menjadi "Diproses" untuk verifikasi ulang.`
    );
    // Auto-expand the updated submission to inspect it
    setExpandedId(updatedSub.id);
    fetchSubmissions();
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
        throw new Error(data.message || 'Gagal memuat daftar pengajuan.');
      }
      setSubmissions(data.submissions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`Ukuran file "${file.name}" melebihi batas maksimal 5MB.`);
      return;
    }

    setUploadingDocKey(docKey);

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
            fileType: file.type || 'application/octet-stream',
            fileData: base64Data
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal mengunggah file.');
        }

        setUploadedDocs(prev => ({
          ...prev,
          [docKey]: {
            name: file.name,
            url: data.fileUrl,
            size: file.size,
            type: file.type || 'application/pdf'
          }
        }));
      } catch (err: any) {
        alert(err.message || 'Error uploading file.');
      } finally {
        setUploadingDocKey(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docKey: string) => {
    setUploadedDocs(prev => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validate Isian Data Pemohon (Required: 1, 2, 3, 4, 6, 8, 9)
    if (!applicantName || !applicantAddress || !identityNumber || !phoneNumber || !coordinates || !landArea || !plannedActivity) {
      setFormError('Harap lengkapi semua isian Data Pemohon yang bertanda wajib (*).');
      return;
    }

    // Prepare documents from uploaded docs and automatic confirmed items
    const finalDocuments: { name: string; type: string; size: number; fileUrl: string }[] = [];

    DOCUMENT_REQUIREMENTS.forEach(req => {
      if (uploadedDocs[req.id]) {
        finalDocuments.push({
          name: `${req.number}. ${req.title}`,
          type: uploadedDocs[req.id].type,
          size: uploadedDocs[req.id].size,
          fileUrl: uploadedDocs[req.id].url
        });
      } else if (req.isAutomatic && autoConfirmed[req.id]) {
        finalDocuments.push({
          name: `${req.number}. ${req.title} [Terbit Otomatis Sistem OSS]`,
          type: 'application/pdf',
          size: 64200,
          fileUrl: `/uploads/sistem_oss_${req.id}.pdf`
        });
      }
    });

    // Include dedicated building technical specifications document if uploaded
    if (uploadedDocs['doc_7_spec']) {
      finalDocuments.push({
        name: '7.e. Berkas Dokumen Spesifikasi Teknis Bangunan',
        type: uploadedDocs['doc_7_spec'].type,
        size: uploadedDocs['doc_7_spec'].size,
        fileUrl: uploadedDocs['doc_7_spec'].url
      });
    }

    if (finalDocuments.length === 0) {
      setFormError('Harap unggah minimal dokumen persyaratan wajib (seperti Peta Bidang/PTP, Pernyataan Sempadan, Informasi Penguasaan Tanah, atau Pernyataan Kebenaran Data).');
      return;
    }

    const payload = {
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
      documents: finalDocuments
    };

    try {
      const response = await fetch('/api/kkpr/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengirim pengajuan.');
      }

      setFormSuccess('Pengajuan KKPR Anda berhasil dikirim dengan seluruh berkas persyaratan terlampir!');
      setShowForm(false);
      
      // Reset Form states
      setApplicantName(user?.name || '');
      setApplicantAddress(user?.address || '');
      setIdentityNumber(user?.identityNumber || '');
      setCoordinates('');
      setPolygonGIS('');
      setLandArea('');
      setPlannedActivity('');
      setTechnicalSpecifications('');
      setTechnicalDetails('');
      setUploadedDocs({});

      // Refresh list
      fetchSubmissions();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteSubmission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengajuan KKPR ini?')) {
      return;
    }
    try {
      const res = await fetch(`/api/kkpr/submissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal menghapus pengajuan.');
      }
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus pengajuan.');
    }
  };

  // Status badge styles
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
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="h-3 w-3 mr-1" />Lolos Verifikasi</span>;
      case 'Ditolak':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Ditolak / Perlu Revisi</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"><Clock className="h-3 w-3 mr-1" />Menunggu Verifikasi</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="pemohon-dashboard">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Pemohon</h1>
          <p className="text-sm text-slate-500 mt-1">Buat pengajuan KKPR baru dan pantau status kelengkapan verifikasi Anda.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSubmissions}
            className="inline-flex items-center justify-center p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-all duration-200 cursor-pointer shadow-2xs"
            title="Muat Ulang"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => { setShowForm(!showForm); setFormError(null); }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#1B355A] hover:bg-[#0F223D] text-white rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer"
            id="btn-tambah-pengajuan"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Pengajuan KKPR</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" id="metrics-grid">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Pengajuan</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{submissions.length}</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Disetujui Dinas</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {submissions.filter(s => s.status === 'Disetujui').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ditolak / Perlu Revisi</span>
          <span className="text-2xl font-bold text-red-600 mt-1 block">
            {submissions.filter(s => s.status === 'Ditolak').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Menunggu Verifikasi</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {submissions.filter(s => s.status === 'Pending' || s.status === 'Diproses').length}
          </span>
        </div>
      </div>

      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl p-4 mb-6 flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* NEW KKPR APPLICATION FORM */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm" id="form-pengajuan">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
            <h3 className="text-lg font-bold text-slate-800">Formulir Pengajuan KKPR Baru</h3>
            <button 
              onClick={() => setShowForm(false)} 
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
            >
              Batalkan
            </button>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3.5 mb-6 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: 10 ISIAN DATA PEMOHON */}
              <div className="lg:col-span-5 space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bagian 1</span>
                  <h4 className="text-base font-bold text-slate-800">Isian Data Pemohon</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Lengkapi 10 butir data administrasi dan teknis permohonan</p>
                </div>

                {/* 1. Nama Pemohon */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Nama Pemohon <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Nama Lengkap Pemohon"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all text-slate-800"
                  />
                </div>

                {/* 2. Alamat Pemohon */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Alamat Pemohon <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    placeholder="Alamat Lengkap Pemohon sesuai identitas resmi"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all text-slate-800"
                  />
                </div>

                {/* 3. No. Identitas Pemohon */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis ID</label>
                    <select
                      value={identityType}
                      onChange={(e) => setIdentityType(e.target.value as any)}
                      className="block w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800 font-medium"
                    >
                      <option value="KTP">KTP</option>
                      <option value="SIM">SIM</option>
                      <option value="Paspor">Paspor</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. No. Identitas Pemohon <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      placeholder={`Nomor ${identityType}`}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                    />
                  </div>
                </div>

                {/* 4. No. Telepon / WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    4. No. Telepon / WhatsApp <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                  />
                </div>

                {/* 5. NPWP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    5. NPWP
                  </label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    placeholder="Contoh: 00.000.000.0-000.000"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                  />
                </div>

                {/* 6. Nama Perusahaan (Opsional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6. Nama Perusahaan <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nama Perusahaan / Badan Usaha (jika ada)"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                  />
                </div>

                {/* 6. Koordinat Lokasi (Latitude, Longitude)* */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6. Koordinat Lokasi (Latitude, Longitude) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    placeholder="Contoh: 0.9924, 103.4281"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Sesuai titik ikat Peta Bidang Tanah / PTP Kantor Pertanahan</span>
                </div>

                {/* 7. Koordinat Polygon (Format GeoJSON atau Array Koordinat) Opsional */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    7. Koordinat Polygon (Format GeoJSON atau Array Koordinat) <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={polygonGIS}
                    onChange={(e) => setPolygonGIS(e.target.value)}
                    placeholder="[[0.9920, 103.4275], [0.9930, 103.4285], ...] atau GeoJSON Polygon"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all text-slate-800"
                  />
                </div>

                {/* 8. Luas Lahan (M²) & 9. Rencana Kegiatan Pemanfaatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      8. Luas Lahan (M²) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="e.g. 1200"
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      9. Rencana Kegiatan Pemanfaatan <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={plannedActivity}
                      onChange={(e) => setPlannedActivity(e.target.value)}
                      placeholder="e.g. Pembangunan Gudang Logistik"
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* 10. Data Teknis Tambahan (Opsional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    10. Data Teknis Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={technicalDetails}
                    onChange={(e) => setTechnicalDetails(e.target.value)}
                    placeholder="Uraian teknis tambahan mengenai rencana pemanfaatan ruang, ketinggian bangunan, koefisien dasar bangunan (KDB), dll."
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Right Column: 12 PERSYARATAN UNGGAH DOKUMEN */}
              <div className="lg:col-span-7 space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bagian 2</span>
                    <h4 className="text-base font-bold text-slate-800">Persyaratan Unggah Dokumen (Wajib)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Unggah 12 berkas persyaratan sesuai ketentuan resmi Kabupaten Karimun</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B355A]/10 text-[#1B355A]">
                      {Object.keys(uploadedDocs).length} / 12 Terunggah
                    </span>
                  </div>
                </div>

                {/* 12 Document Cards List */}
                <div className="space-y-3.5 max-h-[780px] overflow-y-auto pr-1.5 scrollbar-thin">
                  {DOCUMENT_REQUIREMENTS.map((req) => {
                    const uploaded = uploadedDocs[req.id];
                    const isUploading = uploadingDocKey === req.id;

                    return (
                      <div 
                        key={req.id} 
                        className={`border rounded-xl p-4 transition-all duration-150 ${
                          uploaded 
                            ? 'bg-emerald-50/40 border-emerald-200' 
                            : req.isAutomatic 
                              ? 'bg-purple-50/30 border-purple-200' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Header: Number, Title, Tag */}
                        <div className="flex items-start justify-between gap-2.5 mb-2">
                          <div className="flex items-start space-x-2.5">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#1B355A] text-white text-xs font-bold mt-0.5">
                              {req.number}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-slate-800 leading-snug">
                                {req.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {req.subtitle}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${req.tagColor}`}>
                            {req.tag}
                          </span>
                        </div>

                        {/* Sub-items (if present, e.g. for doc 6 & doc 7) */}
                        {req.subItems && (
                          <div className="my-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-600 space-y-1">
                            {req.subItems.map((sub, sIdx) => (
                              <div key={sIdx}>
                                <span className="font-medium">{sub.text}</span>
                                {sub.subList && (
                                  <ul className="pl-4 mt-0.5 space-y-0.5 text-slate-500">
                                    {sub.subList.map((itm, iIdx) => (
                                      <li key={iIdx}>• {itm}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Automatic OSS note for doc 8 & doc 9 */}
                        {req.isAutomatic && (
                          <div className="my-2 p-2.5 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              <span className="text-purple-800 font-medium">Diterbitkan otomatis secara online dari OSS-RBA</span>
                            </div>
                            <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={autoConfirmed[req.id] || false}
                                onChange={(e) => setAutoConfirmed(prev => ({ ...prev, [req.id]: e.target.checked }))}
                                className="rounded text-[#1B355A] focus:ring-[#1B355A]"
                              />
                              <span className="text-[11px] text-purple-900 font-semibold">Gunakan Dokumen OSS Otomatis</span>
                            </label>
                          </div>
                        )}

                        {/* Upload Status / Upload Box */}
                        {uploaded ? (
                          <div className="mt-2 bg-white border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate">
                              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              <span className="text-xs font-semibold text-slate-800 truncate">{uploaded.name}</span>
                              <span className="text-[10px] text-slate-400">
                                ({(uploaded.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                              <a
                                href={uploaded.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-semibold text-[#1B355A] hover:underline"
                              >
                                Lihat
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(req.id)}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <label className="relative border-2 border-dashed border-slate-200 hover:border-[#1B355A] rounded-lg p-3 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50">
                              <input
                                type="file"
                                accept={req.acceptedTypes || '.pdf,.jpg,.jpeg,.png,.zip'}
                                onChange={(e) => handleFileUpload(e, req.id)}
                                disabled={isUploading}
                                className="sr-only"
                              />
                              <div className="flex items-center space-x-2">
                                <Upload className="h-4 w-4 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-700">
                                  {isUploading ? 'Sedang Mengunggah Dokumen...' : 'Pilih / Unggah Berkas Gambar Rencana Teknis'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                Format: {req.acceptedTypes || 'PDF, JPG, PNG'} • Maksimal 5 MB
                              </span>
                            </label>
                          </div>
                        )}

                        {/* Dedicated Kolom Unggah Berkas Dokumen untuk Spesifikasi Teknis Bangunan */}
                        {req.id === 'doc_7' && (
                          <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200" id="kolom-spesifikasi-teknis-bangunan">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-[#1B355A]" />
                                <span className="text-xs font-bold text-slate-800">
                                  Spesifikasi Teknis Bangunan
                                </span>
                              </div>
                            </div>

                            {/* Kolom Unggah Berkas Dokumen Spesifikasi Teknis */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Unggah Berkas Dokumen Spesifikasi Teknis Bangunan
                              </label>
                              {uploadedDocs['doc_7_spec'] ? (
                                <div className="bg-white border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                                  <div className="flex items-center space-x-2 truncate">
                                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                      {uploadedDocs['doc_7_spec'].name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      ({(uploadedDocs['doc_7_spec'].size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                    <a
                                      href={uploadedDocs['doc_7_spec'].url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-semibold text-[#1B355A] hover:underline"
                                    >
                                      Lihat
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDoc('doc_7_spec')}
                                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="relative border-2 border-dashed border-slate-200 hover:border-[#1B355A] rounded-lg p-2.5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-white hover:bg-slate-50">
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                                    onChange={(e) => handleFileUpload(e, 'doc_7_spec')}
                                    disabled={uploadingDocKey === 'doc_7_spec'}
                                    className="sr-only"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Upload className="h-4 w-4 text-slate-500" />
                                    <span className="text-xs font-semibold text-slate-700">
                                      {uploadingDocKey === 'doc_7_spec' ? 'Sedang Mengunggah Berkas...' : 'Unggah Dokumen Spesifikasi Teknis Bangunan'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    Format: PDF, Word (DOC/DOCX), Excel, ZIP • Maksimal 5 MB
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={uploadingDocKey !== null}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#1B355A] hover:bg-[#0F223D] text-white font-semibold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                id="btn-kirim-permohonan"
              >
                <Send className="h-4 w-4" />
                <span>Kirim Permohonan KKPR</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resubmit Success Banner */}
      {resubmitSuccessBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-4 rounded-2xl flex items-start justify-between space-x-3 shadow-xs animate-fadeIn">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-medium">
              {resubmitSuccessBanner}
            </div>
          </div>
          <button
            onClick={() => setResubmitSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50 cursor-pointer"
          >
            <span className="text-xs font-bold">&times;</span>
          </button>
        </div>
      )}

      {/* SUBMISSIONS LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="daftar-pengajuan">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Daftar Pengajuan KKPR Anda</h3>
          <span className="text-xs text-slate-500 font-medium">{submissions.length} Pengajuan</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="block font-medium">Memuat data pengajuan...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Map className="h-10 w-10 text-slate-300 mx-auto" />
            <span className="block font-semibold text-slate-700">Belum ada pengajuan KKPR</span>
            <span className="block text-xs text-slate-400 max-w-xs mx-auto">
              Silakan buat pengajuan KKPR baru dengan menekan tombol "Buat Pengajuan KKPR" di kanan atas.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              const hasRejectedDocs = sub.status === 'Ditolak' || sub.documents.some((d) => d.status === 'Ditolak');
              const rejectedCount = sub.documents.filter((d) => d.status === 'Ditolak').length;

              return (
                <div key={sub.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  {/* Submission Header Row */}
                  <div 
                    onClick={() => toggleExpand(sub.id)}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer space-y-4 sm:space-y-0"
                  >
                    <div className="space-y-1.5 pr-4 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 font-mono">No. Registrasi: {formatRegNumber(sub)}</span>
                        {getStatusBadge(sub.status)}
                        {sub.hasRevision && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Revisi Terkirim
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center text-xs text-slate-400 gap-y-1 sm:gap-x-4">
                        <span className="font-semibold text-slate-600 block">{sub.plannedActivity}</span>
                        <span className="hidden sm:inline text-slate-300">|</span>
                        <span>Luas: {sub.landArea} m²</span>
                        <span className="hidden sm:inline text-slate-300">|</span>
                        <span>Diajukan: {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start sm:self-center flex-shrink-0">
                      {/* Button Pantau Proses Verifikator */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(sub.id);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-blue-200 rounded-lg text-xs font-bold text-[#1B355A] bg-blue-50/80 hover:bg-blue-100/80 cursor-pointer shadow-2xs transition-colors"
                        title="Pantau seluruh proses dan catatan tindakan verifikator"
                      >
                        <Layers className="h-3.5 w-3.5 text-[#1B355A]" />
                        <span>Pantau Proses Verifikator</span>
                      </button>

                      {hasRejectedDocs && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenResubmit(sub);
                          }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          title="Lengkapi berkas yang ditolak oleh petugas dinas"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>Lengkapi Berkas {rejectedCount > 0 ? `(${rejectedCount})` : ''}</span>
                        </button>
                      )}

                      <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSubmission(sub.id, e)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-rose-200 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 cursor-pointer transition-colors"
                        title="Hapus pengajuan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </button>

                      <div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700 animate-fadeIn">
                      {/* Skema Alur & Pantauan Proses Verifikator (Real-time Live Tracker) */}
                      <div className="col-span-1 md:col-span-2">
                        <SkemaAlurTracker
                          submission={sub}
                          token={token}
                          onOpenResubmit={handleOpenResubmit}
                          onRefreshSubmission={fetchSubmissions}
                        />
                      </div>

                      {/* Lengkapi Berkas Attention Banner */}
                      {hasRejectedDocs && (
                        <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
                          <div className="flex items-start space-x-3.5">
                            <div className="p-2.5 bg-amber-100/90 text-amber-800 rounded-xl mt-0.5 flex-shrink-0 border border-amber-200">
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                                Perhatian: Terdapat Berkas Persyaratan yang Perlu Dilengkapi
                              </h5>
                              <p className="text-xs text-amber-900/85 leading-relaxed">
                                Petugas Verifikator Dinas memberikan catatan penolakan pada berkas persyaratan permohonan ini. Silakan tinjau catatan penolakan dan unggah berkas perbaikan agar proses permohonan dapat dilanjutkan.
                              </p>
                              {sub.hasRevision && (
                                <span className="inline-flex items-center text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded mt-1">
                                  <Clock className="h-3 w-3 mr-1 text-blue-600" />
                                  Terakhir diperbaiki pada {new Date(sub.revisedAt || sub.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  {sub.revisionNotes && ` - Catatan Pemohon: "${sub.revisionNotes}"`}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenResubmit(sub)}
                            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all flex-shrink-0 cursor-pointer self-start sm:self-center"
                          >
                            <UploadCloud className="h-4 w-4" />
                            <span>Lengkapi Berkas yang Ditolak</span>
                          </button>
                        </div>
                      )}

                      {/* Left: Input Details */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Informasi Lokasi & Teknis</h4>
                        
                        <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Pemohon</span>
                          <span className="col-span-2 text-slate-800 font-semibold">{sub.applicantName}</span>
                        </div>

                        {sub.identityType && sub.identityNumber && (
                          <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Identitas ({sub.identityType})</span>
                            <span className="col-span-2 text-slate-800 font-mono font-medium">{sub.identityNumber}</span>
                          </div>
                        )}

                        {sub.phoneNumber && (
                          <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">No. Telepon</span>
                            <span className="col-span-2 text-slate-800">{sub.phoneNumber}</span>
                          </div>
                        )}

                        {sub.companyName && (
                          <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Perusahaan</span>
                            <span className="col-span-2 text-slate-800">{sub.companyName}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Alamat</span>
                          <span className="col-span-2 text-slate-800">{sub.applicantAddress}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Koordinat</span>
                          <span className="col-span-2 text-slate-800 font-mono font-medium">{sub.coordinates}</span>
                        </div>

                        {sub.polygonGIS && (
                          <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Polygon GIS</span>
                            <span className="col-span-2 text-slate-700 font-mono text-[10px] truncate block">{sub.polygonGIS}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Luas Lahan</span>
                          <span className="col-span-2 text-slate-800 font-semibold">{sub.landArea} m²</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Rencana Guna</span>
                          <span className="col-span-2 text-slate-800 font-semibold text-[#1B355A]">{sub.plannedActivity}</span>
                        </div>

                        {sub.technicalSpecifications && (
                          <div className="grid grid-cols-3 gap-2.5 text-xs py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Spesifikasi Teknis</span>
                            <span className="col-span-2 text-slate-800 font-medium">{sub.technicalSpecifications}</span>
                          </div>
                        )}

                        {sub.status === 'Ditolak' && sub.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs space-y-1">
                            <span className="font-bold flex items-center"><XCircle className="h-4 w-4 mr-1 text-red-500" /> Catatan Penolakan Dinas:</span>
                            <p className="font-medium">{sub.rejectionReason}</p>
                          </div>
                        )}

                        {sub.status === 'Disetujui' && sub.completedDocumentUrl && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs space-y-2.5">
                            <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                              <CheckCircle className="h-4 w-4.5 text-emerald-600 flex-shrink-0" />
                              <span>Dokumen KKPR Hasil Selesai & Resmi Terbit!</span>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed">Petugas Dinas telah menerbitkan berkas resmi KKPR Anda. Silakan klik tombol di bawah untuk mengunduh dokumen tersebut.</p>
                            <div className="pt-1">
                              <a
                                href={sub.completedDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-[#1B355A] hover:bg-[#0F223D] text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Unduh Sertifikat / Dokumen KKPR
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Uploaded documents verification status */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Status Dokumen Persyaratan</h4>

                        <div className="space-y-3">
                          {sub.documents.map((doc) => {
                            const isDocRejected = doc.status === 'Ditolak';
                            return (
                              <div
                                key={doc.id}
                                className={`border p-3.5 rounded-xl flex flex-col space-y-2.5 transition-all ${
                                  isDocRejected
                                    ? 'border-red-200 bg-red-50/40 shadow-2xs'
                                    : doc.isRevised
                                    ? 'border-blue-200 bg-blue-50/30'
                                    : 'border-slate-100 bg-slate-50/50'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start space-x-2.5">
                                    <FileText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDocRejected ? 'text-red-500' : 'text-slate-500'}`} />
                                    <div>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-xs font-bold text-slate-700 block leading-tight">{doc.name}</span>
                                        {doc.isRevised && (
                                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded inline-flex items-center">
                                            <Check className="h-3 w-3 mr-0.5" />
                                            Revisi
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {(doc.size / (1024 * 1024)).toFixed(2)} MB
                                      </span>
                                    </div>
                                  </div>
                                  {getDocStatusBadge(doc.status)}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1.5 border-t border-slate-200/50">
                                  <a 
                                    href={doc.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[#1B355A] hover:text-[#0F223D] font-semibold inline-flex items-center space-x-1"
                                  >
                                    <Eye className="h-3 w-3 mr-0.5" />
                                    <span>Buka / Pratinjau</span>
                                  </a>

                                  {isDocRejected && (
                                    <div className="flex items-center space-x-2">
                                      {doc.rejectionReason && (
                                        <span className="text-[10px] font-medium text-red-600 bg-red-100/70 px-2 py-0.5 rounded">
                                          Ket: {doc.rejectionReason}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenResubmit(sub)}
                                        className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-1 rounded-md inline-flex items-center space-x-1 cursor-pointer transition-colors"
                                      >
                                        <UploadCloud className="h-3 w-3" />
                                        <span>Lengkapi Berkas</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Lengkapi Berkas yang Ditolak */}
      <ModalLengkapiBerkas
        isOpen={resubmitModalOpen}
        onClose={() => setResubmitModalOpen(false)}
        submission={selectedSubForResubmit}
        onSuccess={handleResubmitSuccess}
        token={token}
      />
    </div>
  );
}
