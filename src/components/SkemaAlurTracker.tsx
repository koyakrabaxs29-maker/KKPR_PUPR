import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw, 
  FileText, UserCheck, ShieldCheck, Download, UploadCloud, 
  ChevronRight, Calendar, ArrowRight, Eye, Sparkles, Check, 
  MapPin, HelpCircle, History, FileCheck, Layers, ExternalLink
} from 'lucide-react';
import { KKPRSubmission, VerificationLog, formatRegNumber } from '../types';

interface SkemaAlurTrackerProps {
  submission: KKPRSubmission;
  token: string;
  onOpenResubmit?: (sub: KKPRSubmission) => void;
  onRefreshSubmission?: () => void;
}

export function SkemaAlurTracker({
  submission,
  token,
  onOpenResubmit,
  onRefreshSubmission
}: SkemaAlurTrackerProps) {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<'stepper' | 'logs' | 'docs'>('stepper');

  const fetchLogs = async () => {
    if (!submission?.id) return;
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/kkpr/submissions/${submission.id}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        // Sort descending by date
        const sorted = [...data.logs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLogs(sorted);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [submission?.id, submission?.updatedAt]);

  // Document Verification Statistics
  const totalDocs = submission.documents?.length || 0;
  const approvedDocs = submission.documents?.filter(d => d.status === 'Disetujui').length || 0;
  const rejectedDocs = submission.documents?.filter(d => d.status === 'Ditolak').length || 0;
  const pendingDocs = submission.documents?.filter(d => d.status === 'Pending').length || 0;

  // Determine Current Alur Stage (1 to 5)
  // Stage 1: Pendaftaran & Pengajuan Dokumen
  // Stage 2: Verifikasi Kelengkapan Administrasi (Verifikator)
  // Stage 3: Telaah Teknis Tata Ruang (Verifikator)
  // Stage 4: Klarifikasi / Perbaikan Berkas (Jika Ditolak atau Ada Revisi)
  // Stage 5: Keputusan Akhir & Penerbitan Dokumen Resmi KKPR
  
  let currentStage = 1;
  let stageStatus: 'completed' | 'in_progress' | 'needs_action' | 'rejected' = 'in_progress';

  if (submission.status === 'Disetujui') {
    currentStage = 5;
    stageStatus = 'completed';
  } else if (submission.status === 'Ditolak' || rejectedDocs > 0) {
    currentStage = 4;
    stageStatus = 'needs_action';
  } else if (submission.hasRevision) {
    currentStage = 4;
    stageStatus = 'in_progress';
  } else if (submission.status === 'Diproses') {
    // If some docs are already approved, we are in technical review / stage 3
    if (approvedDocs > 0) {
      currentStage = 3;
    } else {
      currentStage = 2;
    }
    stageStatus = 'in_progress';
  } else {
    // Status 'Pending'
    currentStage = 2;
    stageStatus = 'in_progress';
  }

  const stages = [
    {
      step: 1,
      title: 'Pengajuan Berkas',
      actor: 'Pemohon',
      desc: 'Formulir data & 12 dokumen persyaratan berhasil dikirim.'
    },
    {
      step: 2,
      title: 'Verifikasi Administrasi',
      actor: 'Verifikator Dinas',
      desc: 'Pemeriksaan keabsahan identitas, surat pernyataan & legalitas berkas.'
    },
    {
      step: 3,
      title: 'Telaah Teknis Tata Ruang',
      actor: 'Verifikator & Tim Teknis',
      desc: 'Analisis titik koordinat spasial terhadap peta zonasi RTRW/RDTR & PTP.'
    },
    {
      step: 4,
      title: 'Klarifikasi / Perbaikan',
      actor: 'Pemohon & Verifikator',
      desc: 'Penanganan perbaikan dokumen jika terdapat catatan penolakan dinas.'
    },
    {
      step: 5,
      title: 'Penerbitan Dokumen KKPR',
      actor: 'Dinas Penataan Ruang',
      desc: 'Penerbitan surat keputusan resmi KKPR siap unduh.'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5" id={`skema-alur-${submission.id}`}>
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#1B355A] text-white rounded-xl shadow-2xs">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-slate-900">
                Skema Alur & Pantauan Proses Verifikator
              </h4>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {formatRegNumber(submission)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau tahapan dan tindak lanjut pemeriksaan yang dilakukan oleh Petugas Verifikator Dinas.
            </p>
          </div>
        </div>

        {/* Action / Refresh button */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              fetchLogs();
              if (onRefreshSubmission) onRefreshSubmission();
            }}
            disabled={loadingLogs}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
            title="Muat ulang catatan aktivitas verifikator"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>Segarkan Log</span>
          </button>

          {/* If there are rejected docs, button to fix */}
          {rejectedDocs > 0 && onOpenResubmit && (
            <button
              type="button"
              onClick={() => onOpenResubmit(submission)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Lengkapi Berkas ({rejectedDocs})</span>
            </button>
          )}

          {/* If approved, button to download final doc */}
          {submission.status === 'Disetujui' && submission.completedDocumentUrl && (
            <a
              href={submission.completedDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Dokumen KKPR</span>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('stepper')}
          className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all flex items-center space-x-1.5 ${
            activeTab === 'stepper'
              ? 'border-[#1B355A] text-[#1B355A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Skema 5 Tahapan Alur</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all flex items-center space-x-1.5 ${
            activeTab === 'logs'
              ? 'border-[#1B355A] text-[#1B355A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Riwayat Tindakan Verifikator</span>
          {logs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full">
              {logs.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all flex items-center space-x-1.5 ${
            activeTab === 'docs'
              ? 'border-[#1B355A] text-[#1B355A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="h-3.5 w-3.5" />
          <span>Hasil Telaah 12 Berkas</span>
          <span className="ml-1 text-[10px] text-slate-400">
            ({approvedDocs}/{totalDocs} Lolos)
          </span>
        </button>
      </div>

      {/* TAB 1: 5-STEP WORKFLOW STEPPER */}
      {activeTab === 'stepper' && (
        <div className="space-y-4">
          {/* Stepper Visual Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {stages.map((st) => {
              const isPast = st.step < currentStage;
              const isCurrent = st.step === currentStage;
              const isFuture = st.step > currentStage;

              let cardBg = 'bg-white border-slate-200 text-slate-600';
              let badgeBg = 'bg-slate-100 text-slate-500';
              let statusLabel = 'Belum Dimulai';

              if (isPast) {
                cardBg = 'bg-emerald-50/40 border-emerald-200 text-emerald-950';
                badgeBg = 'bg-emerald-600 text-white';
                statusLabel = 'Selesai';
              } else if (isCurrent) {
                if (stageStatus === 'needs_action') {
                  cardBg = 'bg-rose-50/70 border-rose-300 text-rose-950 ring-2 ring-rose-200';
                  badgeBg = 'bg-rose-600 text-white';
                  statusLabel = 'Perlu Tindakan';
                } else if (stageStatus === 'completed') {
                  cardBg = 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-200';
                  badgeBg = 'bg-emerald-600 text-white';
                  statusLabel = 'Selesai & Sah';
                } else {
                  cardBg = 'bg-blue-50/80 border-blue-300 text-blue-950 ring-2 ring-blue-200';
                  badgeBg = 'bg-[#1B355A] text-white';
                  statusLabel = 'Sedang Diproses';
                }
              }

              return (
                <div
                  key={st.step}
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all duration-200 relative ${cardBg}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${badgeBg}`}>
                        {isPast ? <Check className="h-3 w-3" /> : st.step}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isPast
                          ? 'bg-emerald-100/70 text-emerald-800'
                          : isCurrent
                          ? stageStatus === 'needs_action'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold leading-snug">
                      {st.title}
                    </h5>

                    <span className="text-[10px] font-semibold text-slate-400 block">
                      {st.actor}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Current Stage Detailed Guidance Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            stageStatus === 'needs_action'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : stageStatus === 'completed'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-start space-x-3">
              {stageStatus === 'needs_action' ? (
                <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : stageStatus === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}

              <div className="space-y-1">
                <span className="font-bold text-xs block">
                  {stageStatus === 'needs_action'
                    ? 'Petugas Verifikator Meminta Perbaikan Berkas Persyaratan'
                    : stageStatus === 'completed'
                    ? 'Selamat! Permohonan Telah Disetujui & Dokumen Resmi Terbit'
                    : `Permohonan Berada di Tahap ${currentStage}: ${stages[currentStage - 1]?.title}`}
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {stageStatus === 'needs_action'
                    ? `Terdapat ${rejectedDocs} berkas yang ditolak oleh petugas verifikator dinas. Mohon periksa alasan penolakan pada tab "Hasil Telaah 12 Berkas" atau klik tombol Lengkapi Berkas.`
                    : stageStatus === 'completed'
                    ? 'Seluruh berkas persyaratan dan analisis teknis tata ruang telah diverifikasi dan disetujui. Dokumen resmi KKPR telah diterbitkan dan dapat diunduh.'
                    : currentStage === 2
                    ? 'Petugas Verifikator Dinas sedang melakukan pemeriksaan kelengkapan dan keabsahan berkas permohonan yang Anda kirimkan.'
                    : currentStage === 3
                    ? 'Petugas Verifikator dan Tim Teknis sedang melakukan analisis kesesuaian spasial terhadap peta zonasi RTRW Kabupaten Karimun dan PTP Pertanahan.'
                    : 'Berkas perbaikan Anda telah dikirimkan ke petugas verifikator dan saat ini sedang dalam proses verifikasi ulang.'}
                </p>
              </div>
            </div>

            {/* Stage Action Button */}
            {stageStatus === 'needs_action' && onOpenResubmit && (
              <button
                type="button"
                onClick={() => onOpenResubmit(submission)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 cursor-pointer self-start sm:self-center"
              >
                Perbaiki Berkas Sekarang
              </button>
            )}

            {stageStatus === 'completed' && submission.completedDocumentUrl && (
              <a
                href={submission.completedDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#1B355A] hover:bg-[#0F223D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 inline-flex items-center space-x-1.5 self-start sm:self-center"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Dokumen KKPR</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFIER AUDIT LOGS TIMELINE */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Catatan & Riwayat Aktivitas Petugas Verifikator ({logs.length} Catatan)
            </span>
            <span className="text-[11px] text-slate-400">
              Tercatat otomatis oleh sistem audit dinas
            </span>
          </div>

          {loadingLogs ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-slate-400 mb-2" />
              <span className="text-xs">Memuat riwayat verifikasi...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <Clock className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Belum Ada Aktivitas Verifikator</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Permohonan Anda baru didaftarkan dan sedang menunggu antrean pemeriksaan oleh Petugas Verifikator Dinas.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => {
                const isVerifier = log.verifierName.toLowerCase().includes('petugas') || 
                                   log.verifierName.toLowerCase().includes('dinas') ||
                                   log.verifierName.toLowerCase().includes('aminah');
                const isRejected = log.notes.includes('Ditolak') || log.status === 'Ditolak';
                const isApproved = log.notes.includes('Disetujui') || log.status === 'Disetujui';

                return (
                  <div key={log.id} className="relative group">
                    {/* Bullet */}
                    <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-2xs ${
                      isRejected 
                        ? 'bg-rose-500 ring-2 ring-rose-200' 
                        : isApproved 
                        ? 'bg-emerald-500 ring-2 ring-emerald-200' 
                        : 'bg-blue-500 ring-2 ring-blue-200'
                    }`} />

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-3.5 w-3.5 text-[#1B355A]" />
                          <span className="text-xs font-bold text-slate-800">
                            {log.verifierName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            isRejected
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {log.status}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                          {new Date(log.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        {log.notes}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENT VERIFICATION STATUS LIST */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Status Pemeriksaan Kelengkapan Berkas oleh Petugas
            </span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-emerald-700 font-bold">
                ✓ {approvedDocs} Lolos
              </span>
              <span className="text-rose-700 font-bold">
                ✗ {rejectedDocs} Ditolak
              </span>
              <span className="text-amber-700 font-bold">
                ⏳ {pendingDocs} Menunggu
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {submission.documents.map((doc) => {
              const isDocApproved = doc.status === 'Disetujui';
              const isDocRejected = doc.status === 'Ditolak';

              return (
                <div
                  key={doc.id}
                  className={`border rounded-xl p-3 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDocApproved
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : isDocRejected
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className={`h-4 w-4 flex-shrink-0 ${
                        isDocApproved ? 'text-emerald-600' : isDocRejected ? 'text-rose-600' : 'text-slate-400'
                      }`} />
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {doc.name}
                      </span>
                      {doc.isRevised && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full flex-shrink-0">
                          Sudah Direvisi
                        </span>
                      )}
                    </div>

                    {isDocRejected && doc.rejectionReason && (
                      <div className="text-[11px] text-rose-800 bg-rose-100/70 border border-rose-200 p-2 rounded-lg font-medium">
                        <span className="font-bold block text-rose-900">Catatan Petugas Verifikator:</span>
                        "{doc.rejectionReason}"
                      </div>
                    )}

                    {doc.previousRejectionReason && !isDocRejected && (
                      <span className="text-[10px] text-slate-400 block">
                        Catatan sebelumnya telah diperbaiki: "{doc.previousRejectionReason}"
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 self-start sm:self-center">
                    {/* Status badge */}
                    {isDocApproved ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        Lolos Verifikasi
                      </span>
                    ) : isDocRejected ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                          Ditolak / Kurang
                        </span>
                        {onOpenResubmit && (
                          <button
                            type="button"
                            onClick={() => onOpenResubmit(submission)}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            Perbaiki
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />
                        Menunggu Pemeriksaan
                      </span>
                    )}

                    {/* Preview link if file exists */}
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-xs"
                        title="Lihat Berkas"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
