import React from 'react';
import { 
  X, CheckCircle2, Clock, FileCheck, MapPin, ShieldCheck, 
  HelpCircle, AlertTriangle, ArrowRight, UserCheck, FileText, 
  Send, ExternalLink, Sparkles, Building2, Landmark, Check
} from 'lucide-react';

interface SkemaAlurSOPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkemaAlurSOPModal({ isOpen, onClose }: SkemaAlurSOPModalProps) {
  if (!isOpen) return null;

  const alurTahapan = [
    {
      step: 1,
      title: 'Pendaftaran & Pengajuan Dokumen',
      actor: 'Pemohon',
      actorBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      duration: 'Mandiri (1 Hari)',
      icon: Send,
      description: 'Pemohon mengisi 10 rincian data legalitas dan lokasi, mengunggah titik koordinat GIS, serta melampirkan 12 berkas persyaratan dokumen sesuai SOP Kabupaten Karimun.',
      keyTasks: [
        'Pengisian data pemohon, NIK/NIB, NPWP, dan nomor kontak aktif',
        'Input titik koordinat lokasi (Latitude, Longitude) dan luas lahan',
        'Unggah 12 berkas persyaratan (Peta Bidang/PTP, Sempadan Tanah bermaterai, Informasi Penguasaan Tanah, Pernyataan Kebenaran Data, dll.)',
        'Penerbitan otomatis Nomor Registrasi Permohonan (RegKKPR-XXX-Bulan-Tahun)'
      ]
    },
    {
      step: 2,
      title: 'Pemeriksaan & Validasi Administrasi',
      actor: 'Petugas Verifikator Dinas',
      actorBadge: 'bg-[#1B355A]/10 text-[#1B355A] border-[#1B355A]/20',
      duration: '1 - 2 Hari Kerja',
      icon: FileCheck,
      description: 'Petugas Verifikator Dinas Tata Ruang menerima berkas, memeriksa kelengkapan administrasi, kesesuaian identitas, dan keabsahan legalitas dokumen pemohon.',
      keyTasks: [
        'Pemeriksaan kelengkapan 12 dokumen persyaratan SOP',
        'Validasi format dan keterbacaan dokumen yang diunggah',
        'Pengecekan keabsahan surat pernyataan bermaterai dan identitas pemohon',
        'Verifikator menandai status masing-masing berkas (Lolos atau Ditolak)'
      ]
    },
    {
      step: 3,
      title: 'Telaah Teknis Tata Ruang & PTP Pertanahan',
      actor: 'Petugas Verifikator & Tim Teknis',
      actorBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      duration: '3 - 5 Hari Kerja',
      icon: MapPin,
      description: 'Verifikator melakukan analisis spasial terhadap titik koordinat permohonan menggunakan Peta Rencana Tata Ruang Wilayah (RTRW) / RDTR Kabupaten Karimun.',
      keyTasks: [
        'Pengecekan overlay koordinat lokasi terhadap peta pola ruang & zonasi',
        'Analisis batas sempadan (jalan, sungai, pantai, atau cagar budaya)',
        'Penilaian kesesuaian rencana kegiatan pemanfaatan ruang (KBLI/non-usaha)',
        'Sinkronisasi dengan Pertimbangan Teknis Pertanahan (PTP) Kantor Pertanahan'
      ]
    },
    {
      step: 4,
      title: 'Klarifikasi / Perbaikan Berkas (Jika Ada Catatan)',
      actor: 'Pemohon & Verifikator',
      actorBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      duration: 'Maks. 3 Hari Kerja',
      icon: AlertTriangle,
      description: 'Jika terdapat berkas yang tidak sesuai atau kurang lengkap, Verifikator memberikan catatan penolakan spesifik dan pemohon dapat langsung memperbaikinya via fitur Lengkapi Berkas.',
      keyTasks: [
        'Verifikator menerbitkan catatan revisi spesifik pada dokumen terkait',
        'Notifikasi status "Ditolak / Perlu Revisi" muncul di dashboard pemohon',
        'Pemohon mengunggah berkas perbaikan tanpa perlu membuat permohonan baru',
        'Verifikator melakukan verifikasi ulang secara instan terhadap berkas perbaikan'
      ]
    },
    {
      step: 5,
      title: 'Keputusan Akhir & Penerbitan Dokumen Resmi KKPR',
      actor: 'Petugas Verifikator / Kepala Dinas',
      actorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      duration: '1 - 2 Hari Kerja',
      icon: ShieldCheck,
      description: 'Apabila seluruh berkas dinyatakan sah dan telaah tata ruang terpenuhi, Verifikator menetapkan status "Disetujui" dan menerbitkan Dokumen Resmi KKPR ber-barcode/registrasi sah.',
      keyTasks: [
        'Penetapan keputusan akhir persetujuan pemanfaatan ruang',
        'Penerbitan Surat Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR)',
        'Pengunggahan dokumen hasil resmi oleh petugas verifikator',
        'Pemohon dapat langsung mengunduh sertifikat resmi KKPR berformat PDF'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#1B355A] to-[#2A4D7A] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Skema Alur Pengajuan Permohonan KKPR
              </h3>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Standar Operasional Prosedur (SOP) Dinas Penataan Ruang & Pertanahan Kab. Karimun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">
          {/* Quick Notice Banner */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900">
            <HelpCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-blue-950">
                Transparansi & Pemantauan Proses Verifikator
              </span>
              <p className="text-blue-800 leading-relaxed">
                Setiap tindakan, pemeriksaan berkas, dan keputusan yang dilakukan oleh Petugas Verifikator Dinas tercatat secara transparan di dashboard Anda. Anda dapat memantau progres permohonan Anda secara real-time pada kartu pengajuan di bawah.
              </p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              5 Tahapan Utama Alur Verifikasi KKPR
            </h4>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {alurTahapan.map((tahap) => {
                const Icon = tahap.icon;
                return (
                  <div key={tahap.step} className="relative group">
                    {/* Step Icon Badge */}
                    <div className="absolute -left-6 sm:-left-8 top-0.5 flex items-center justify-center w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-[#1B355A] text-white text-xs font-bold shadow-xs ring-4 ring-white">
                      {tahap.step}
                    </div>

                    {/* Step Content Card */}
                    <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 mb-2.5">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-[#1B355A]" />
                          <h5 className="font-bold text-slate-900 text-sm">
                            {tahap.title}
                          </h5>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tahap.actorBadge}`}>
                            Pelaksana: {tahap.actor}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center">
                            <Clock className="h-2.5 w-2.5 mr-1 text-slate-400" />
                            {tahap.duration}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {tahap.description}
                      </p>

                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/70 text-[11px] space-y-1.5">
                        <span className="font-bold text-slate-700 block">Aktivitas Utama:</span>
                        <ul className="space-y-1 text-slate-600">
                          {tahap.keyTasks.map((task, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <Check className="h-3 w-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legal basis & SLA */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-800">
              <Landmark className="h-4 w-4 text-[#1B355A]" />
              <span>Dasar Hukum & Ketentuan Pelayanan</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Penerbitan Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) diatur dalam Peraturan Pemerintah No. 21 Tahun 2021 tentang Penyelenggaraan Penataan Ruang dan Permen ATR/BPN No. 13 Tahun 2021. Seluruh proses verifikasi tidak dipungut biaya retribusi daerah (Gratis) kecuali kewajiban PNBP sesuai peraturan yang berlaku.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1B355A] hover:bg-[#0F223D] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Tutup Informasi Alur
          </button>
        </div>
      </div>
    </div>
  );
}
