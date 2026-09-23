import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UploadCloud,
  AlertCircle,
  FileText,
  CheckCircle2,
  Eye,
  Trash2,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Info
} from 'lucide-react';
import { KKPRSubmission, KKPRDocument, formatRegNumber } from '../types';

interface ModalLengkapiBerkasProps {
  isOpen: boolean;
  onClose: () => void;
  submission: KKPRSubmission | null;
  onSuccess: (updatedSubmission: KKPRSubmission) => void;
  token: string;
}

interface RevisedFileState {
  documentId: string;
  name: string;
  fileUrl: string;
  type: string;
  size: number;
  fileName: string;
}

export function ModalLengkapiBerkas({
  isOpen,
  onClose,
  submission,
  onSuccess,
  token
}: ModalLengkapiBerkasProps) {
  const [revisedFiles, setRevisedFiles] = useState<Record<string, RevisedFileState>>({});
  const [applicantNotes, setApplicantNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRevisedFiles({});
      setApplicantNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, submission]);

  if (!isOpen || !submission) return null;

  // Find documents that are rejected, or all documents if whole submission is rejected
  const rejectedDocs = submission.documents.filter((d) => d.status === 'Ditolak');
  const targetDocs = rejectedDocs.length > 0 ? rejectedDocs : submission.documents;

  const handleFileChange = (doc: KKPRDocument, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`Ukuran berkas ${file.name} melebihi batas maksimum 10MB.`);
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRevisedFiles((prev) => ({
        ...prev,
        [doc.id]: {
          documentId: doc.id,
          name: doc.name,
          fileUrl: dataUrl,
          type: file.type || 'application/octet-stream',
          size: file.size,
          fileName: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (docId: string) => {
    setRevisedFiles((prev) => {
      const copy = { ...prev };
      delete copy[docId];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDocuments = Object.values(revisedFiles);

    if (updatedDocuments.length === 0) {
      setErrorMessage('Harap unggah minimal 1 (satu) berkas perbaikan sebelum mengirim.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/kkpr/submissions/${submission.id}/resubmit-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          updatedDocuments,
          applicantNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengirimkan berkas perbaikan.');
      }

      onSuccess(data.submission);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengirim berkas perbaikan.');
    } finally {
      setSubmitting(false);
    }
  };

  const countReady = Object.keys(revisedFiles).length;
  const totalNeedFix = targetDocs.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="px-6 py-5 bg-[#1B355A] text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Lengkapi Berkas yang Ditolak</h3>
                <p className="text-xs text-slate-300">
                  No. Registrasi: <span className="font-mono font-semibold text-amber-300">{formatRegNumber(submission)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
            {/* General Submission Rejection Banner (if exists) */}
            {submission.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 text-red-900">
                <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wide text-red-800 block">
                    Catatan Penolakan oleh Petugas Verifikator:
                  </span>
                  <p className="text-xs leading-relaxed text-red-700">{submission.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Instruction Notice */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-amber-900">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-amber-800">
                Silakan tinjau alasan penolakan pada tiap berkas berikut, lalu unggah dokumen revisi terbaru yang telah disesuaikan. Berkas yang diperbaiki akan langsung diteruskan ke Petugas Verifikator untuk diverifikasi ulang.
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Rejected Documents List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Daftar Berkas yang Perlu Dilengkapi ({targetDocs.length})
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">
                  {countReady} dari {totalNeedFix} berkas pengganti siap
                </span>
              </div>

              <div className="space-y-4">
                {targetDocs.map((doc, index) => {
                  const revisedItem = revisedFiles[doc.id];
                  const isReady = !!revisedItem;

                  return (
                    <div
                      key={doc.id}
                      className={`border rounded-xl p-4.5 transition-all ${
                        isReady
                          ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                          : 'border-red-200 bg-white shadow-xs'
                      }`}
                    >
                      {/* Document Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div className="flex items-start space-x-2.5">
                          <div className={`p-2 rounded-lg mt-0.5 ${isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-800 text-xs">
                                {index + 1}. {doc.name}
                              </span>
                              {isReady ? (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Siap Dikirim
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Perlu Perbaikan
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Ukuran berkas sebelumnya: {(doc.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>

                        {/* View Previous File Button */}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-[#1B355A] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg self-start transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Lihat Berkas Sebelumnya
                        </a>
                      </div>

                      {/* Rejection Note Box */}
                      <div className="bg-red-50/80 border border-red-200/80 rounded-lg p-3 mb-3.5 text-xs text-red-800 space-y-1">
                        <span className="font-bold text-[11px] uppercase tracking-wide text-red-700 block">
                          Catatan Penolakan Berkas:
                        </span>
                        <p className="leading-relaxed">
                          {doc.rejectionReason || doc.previousRejectionReason || 'Dokumen belum memenuhi syarat teknis verifikasi dinas.'}
                        </p>
                      </div>

                      {/* Replacement Upload Area */}
                      {isReady ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 truncate max-w-[80%]">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-bold text-emerald-900 block truncate">
                                {revisedItem.fileName}
                              </span>
                              <span className="text-[10px] text-emerald-700">
                                {(revisedItem.size / (1024 * 1024)).toFixed(2)} MB - Berkas pengganti terpilih
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(doc.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                            title="Hapus dan ganti berkas"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-[#1B355A] bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                          <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-[#1B355A] mb-1.5 transition-colors" />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-[#1B355A] transition-colors">
                            Pilih atau Tarik Berkas Perbaikan Baru
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Format PDF, JPG, PNG, atau ZIP (Maks. 10MB)
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.zip,.dwg"
                            onChange={(e) => handleFileChange(doc, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Applicant Notes Textarea */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Catatan Tambahan untuk Petugas Verifikator (Opsional)
              </label>
              <textarea
                value={applicantNotes}
                onChange={(e) => setApplicantNotes(e.target.value)}
                placeholder="Contoh: Dokumen telah diperbarui sesuai arahan, sudah dilengkapi legalisir stempel basah dan koordinat peta revisi."
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B355A] focus:border-transparent outline-hidden resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || countReady === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                countReady > 0 && !submitting
                  ? 'bg-[#1B355A] hover:bg-[#0F223D] text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                  <span>Mengirimkan Berkas...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Kirim Berkas Perbaikan ({countReady})</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
