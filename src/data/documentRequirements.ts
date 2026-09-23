export interface DocRequirement {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  required?: boolean;
  acceptedTypes?: string;
  isAutomatic?: boolean;
  subItems?: { text: string; subList?: string[] }[];
}

export const DOCUMENT_REQUIREMENTS: DocRequirement[] = [
  {
    id: 'doc_1',
    number: 1,
    title: 'Koordinat lokasi yang dimohon (berdasarkan Peta Bidang Tanah/PTP yang diterbitkan dari Kantor Pertanahan Kabupaten Karimun)',
    subtitle: 'Wajib melampirkan Peta Bidang Tanah / PTP resmi dari Kantor Pertanahan Kab. Karimun',
    tag: 'Wajib',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_2',
    number: 2,
    title: 'Pernyataan Sempadan Tanah dan Alamat yang Benar dari kelurahan/desa setempat (ditandatangani di atas materai)',
    subtitle: 'Surat pernyataan batas sempadan tanah dan kebenaran alamat yang sah bertandatangan di atas materai',
    tag: 'Wajib (Materai)',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_3',
    number: 3,
    title: 'Kebutuhan luas lahan kegiatan pemanfaatan ruang (M²)',
    subtitle: 'Rincian / justifikasi teknis kebutuhan luasan lahan yang dimohonkan untuk kegiatan',
    tag: 'Wajib',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_4',
    number: 4,
    title: 'Informasi penguasaan tanah',
    subtitle: 'Sertipikat hak atas tanah, akta PPAT/notaris, perjanjian sewa, atau bukti penguasaan tanah yang sah',
    tag: 'Wajib',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_5',
    number: 5,
    title: 'Informasi bangunan',
    subtitle: 'Informasi deskripsi/detail kondisi eksisting serta rencana fisik bangunan yang akan didirikan',
    tag: 'Wajib',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_6',
    number: 6,
    title: 'Informasi jenis kegiatan/usaha (jika atas nama perusahaan perseorangan/badan usaha/lembaga milik sendiri atau pihak lain/atas dasar balas jasa fee/kontrak kerja)',
    subtitle: 'Kelengkapan legalitas badan usaha, kontrak kerja, dan sertifikat standar pelaksana konstruksi',
    tag: 'Khusus Badan Usaha / Mitra',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    required: false,
    acceptedTypes: '.pdf,.zip,.rar',
    subItems: [
      { text: 'a. Akta Pendirian/Perubahan Badan Usaha/SK. Kumham/ Keputusan Pembentukan Badan Usaha/Lembaga' },
      { text: 'b. NPWP Badan Usaha/Lembaga' },
      { text: 'c. Identitas dan NPWP Direktur/Pemohon' },
      { text: 'd. Email Perseorangan/Perusahaan' },
      { text: 'e. Kontrak kerja (jika menggunakan jasa pelaksana konstruksi pembangunan baru/rehab/penambahan)' },
      {
        text: 'f. Pemenuhan Sertifikat Standar Pelaku Konstruksi (khusus untuk yang akan melakukan konstruksi):',
        subList: [
          '1) SBU milik sendiri / org. Lain berdasarkan kontrak kerja',
          '2) SKA 1 orang dan SKT 1 orang (bagi yang belum memenuhi persyaratan SBU)'
        ]
      }
    ]
  },
  {
    id: 'doc_7',
    number: 7,
    title: 'Rencana Teknis Terinci',
    subtitle: 'Gambar arsitektur dan spesifikasi teknis lengkap pekerjaan konstruksi/pemanfaatan ruang',
    tag: 'Wajib',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.zip',
    subItems: [
      { text: 'a. Rencana Tapak dilengkapi titik ikat koordinat tanah dan alamat yang benar berdasarkan Pernyataan Sempadan' },
      { text: 'b. Denah Bangunan Lengkap' },
      { text: 'c. Tampak Bangunan (Depan, Belakang, Kanan, Kiri)' },
      { text: 'd. Potongan Bangunan (Memanjang dan Melintang)' },
      { text: 'e. Spesifikasi Teknis Bangunan (sesuai spesifikasi pekerjaan)' }
    ]
  },
  {
    id: 'doc_8',
    number: 8,
    title: 'Pernyataan Mandiri Pelaku Usaha UMK yang telah diterbitkan secara online (Otomatis) (Khusus Badan Usaha)',
    subtitle: 'Pernyataan mandiri dari sistem perizinan berusaha OSS (Diterbitkan otomatis bagi UMK)',
    tag: 'Otomatis (Badan Usaha)',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    isAutomatic: true,
    required: false,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_9',
    number: 9,
    title: 'KKPR yang telah diterbitkan secara online (Otomatis) (Khusus Badan Usaha)',
    subtitle: 'Dokumen KKPR online yang diterbitkan melalui portal OSS-RBA (Otomatis)',
    tag: 'Otomatis (Badan Usaha)',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    isAutomatic: true,
    required: false,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_10',
    number: 10,
    title: 'Bukti pembayaran penerimaan negara (PNbP) Peta Bidang Tanah/Pengukuran Bidang Tanah/ PTP',
    subtitle: 'Kuitansi / Bukti setor PNBP Peta Bidang Tanah atau Pengukuran dari Kantor Pertanahan',
    tag: 'Wajib',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_11',
    number: 11,
    title: 'Pertimbangan Teknis Pertanahan',
    subtitle: 'Dokumen telaahan teknis pertanahan (PTP) dari Kantor Pertanahan',
    tag: 'Wajib',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  },
  {
    id: 'doc_12',
    number: 12,
    title: 'Pernyataan Kebenaran Data dan Informasi serta dapat dipertanggungjawabkan (ditandatangani di atas materai)',
    subtitle: 'Surat pernyataan keabsahan bermaterai bahwa seluruh data dan berkas yang disampaikan adalah benar',
    tag: 'Wajib (Materai)',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png'
  }
];
