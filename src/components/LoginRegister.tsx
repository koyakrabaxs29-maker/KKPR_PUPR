import React, { useState } from 'react';
import { User, ShieldAlert, Building, Key, Mail, UserPlus, Info, FileText, CheckCircle, MapPin, HelpCircle, Download, BookOpen } from 'lucide-react';
import { Role } from '../types';

interface LoginRegisterProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Pemohon');
  const [reqTab, setReqTab] = useState<'dokumen' | 'alur' | 'bantuan'>('dokumen');
  
  // Enriched registration states for Pemohon
  const [identityType, setIdentityType] = useState<'KTP' | 'SIM' | 'Paspor'>('KTP');
  const [identityNumber, setIdentityNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { 
          email, 
          password, 
          name, 
          role,
          identityType: role === 'Pemohon' ? identityType : undefined,
          identityNumber: role === 'Pemohon' ? identityNumber : undefined,
          phoneNumber: role === 'Pemohon' ? phoneNumber : undefined,
          address: role === 'Pemohon' ? address : undefined,
          companyName: role === 'Pemohon' ? companyName : undefined
        };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan sistem.');
      }

      if (isLogin) {
        onLoginSuccess(data.token, data.user);
      } else {
        setSuccess('Registrasi berhasil! Silakan masuk dengan akun Anda.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50" id="login-container">
      <div className="w-full max-w-xl lg:max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start" id="login-grid">
        
        {/* The Login/Register Portal Form */}
        <div className="lg:col-span-5 space-y-8" id="auth-form-column">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/logo_karimun.gif"
                alt="Logo Kabupaten Karimun"
                className="h-20 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              PUPR KAB. KARIMUN - KKPR
            </h2>
            <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
              Akses portal pengajuan dan verifikasi Kesesuaian Kegiatan Pemanfaatan Ruang secara digital.
            </p>
          </div>

          {/* Demo Credentials Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-2.5" id="demo-credentials">
            <div className="flex items-center space-x-2 font-semibold">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Akun Demo untuk Pengujian Cepat:</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemoAccount('pemohon@gmail.com', 'pemohon123')}
                className={`text-left p-2.5 rounded border transition-all duration-150 ${
                  email === 'pemohon@gmail.com'
                    ? 'bg-[#1B355A] text-white border-[#EAB630] shadow-sm'
                    : 'bg-white hover:bg-amber-100 text-slate-700 border-amber-200/60'
                }`}
              >
                <span className={`font-semibold block ${email === 'pemohon@gmail.com' ? 'text-[#EAB630]' : 'text-slate-700'}`}>1. Pemohon (Masyarakat)</span>
                <span className={`text-[10px] block ${email === 'pemohon@gmail.com' ? 'text-slate-200' : 'text-slate-500'}`}>Email: pemohon@gmail.com</span>
                <span className={`text-[10px] block ${email === 'pemohon@gmail.com' ? 'text-slate-200' : 'text-slate-500'}`}>Pass: pemohon123</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('petugas@kkpr.go.id', 'petugas123')}
                className={`text-left p-2.5 rounded border transition-all duration-150 ${
                  email === 'petugas@kkpr.go.id'
                    ? 'bg-[#1B355A] text-white border-[#EAB630] shadow-sm'
                    : 'bg-white hover:bg-amber-100 text-slate-700 border-amber-200/60'
                }`}
              >
                <span className={`font-semibold block ${email === 'petugas@kkpr.go.id' ? 'text-[#EAB630]' : 'text-slate-700'}`}>2. Petugas Verifikator</span>
                <span className={`text-[10px] block ${email === 'petugas@kkpr.go.id' ? 'text-slate-200' : 'text-slate-500'}`}>Email: petugas@kkpr.go.id</span>
                <span className={`text-[10px] block ${email === 'petugas@kkpr.go.id' ? 'text-slate-200' : 'text-slate-500'}`}>Pass: petugas123</span>
              </button>
            </div>
          </div>

          <div className="bg-white shadow-md border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Form Selector Tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200/50">
              <button
                onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-all duration-200 border ${
                  isLogin
                    ? 'bg-[#1B355A] text-white border-[#EAB630] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
                id="tab-login"
              >
                Masuk
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-all duration-200 border ${
                  !isLogin
                    ? 'bg-[#1B355A] text-white border-[#EAB630] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
                id="tab-register"
              >
                Daftar Akun
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg p-3 flex items-start space-x-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap / Instansi</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. CV. Maju Sentosa / Ahmad"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all duration-150 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Peran (Role)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('Pemohon')}
                        className={`flex items-center justify-center space-x-2 p-2.5 border rounded-xl text-xs font-medium transition-all duration-200 ${
                          role === 'Pemohon'
                            ? 'border-[#1B355A] bg-[#1B355A]/5 text-[#1B355A] ring-2 ring-[#1B355A]/10'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <User className="h-4 w-4" />
                        <span>Pemohon</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('Petugas Verifikator')}
                        className={`flex items-center justify-center space-x-2 p-2.5 border rounded-xl text-xs font-medium transition-all duration-200 ${
                          role === 'Petugas Verifikator'
                            ? 'border-[#1B355A] bg-[#1B355A]/5 text-[#1B355A] ring-2 ring-[#1B355A]/10'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Building className="h-4 w-4" />
                        <span>Petugas Dinas</span>
                      </button>
                    </div>
                  </div>

                  {role === 'Pemohon' && (
                    <div className="space-y-4 p-4 border border-slate-200 bg-slate-50/60 rounded-2xl mt-4" id="pemohon-identity-fields">
                      <span className="text-xs font-bold text-[#1B355A] block pb-2 border-b border-slate-200">Informasi Identitas Pemohon</span>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Identitas</label>
                          <select
                            value={identityType}
                            onChange={(e) => setIdentityType(e.target.value as any)}
                            className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                          >
                            <option value="KTP">KTP</option>
                            <option value="SIM">SIM</option>
                            <option value="Paspor">Paspor</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">No. Identitas ({identityType})</label>
                          <input
                            type="text"
                            required={role === 'Pemohon'}
                            value={identityNumber}
                            onChange={(e) => setIdentityNumber(e.target.value)}
                            placeholder={`No. ${identityType}`}
                            className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                          />
                        </div>
                      </div>

                       <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">No. Telepon / WhatsApp</label>
                        <input
                          type="tel"
                          required={role === 'Pemohon'}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 08123456789"
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nama Perusahaan / Instansi (Opsional)</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. PT. Karimun Indah"
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Alamat Lengkap (Sesuai Identitas)</label>
                        <textarea
                          rows={2}
                          required={role === 'Pemohon'}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. Jl. Jenderal Sudirman No. 10, Karimun"
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all duration-150 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kata Sandi (Password)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B355A]/10 focus:border-[#1B355A] transition-all duration-150 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#1B355A] hover:bg-[#0F223D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B355A] disabled:opacity-50 transition-all duration-200 cursor-pointer"
                id="submit-auth"
              >
                {loading ? (
                  <span>Memproses...</span>
                ) : isLogin ? (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Masuk Portal</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Daftarkan Akun</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Persyaratan Perizinan KKPR (Sits Below Form) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white shadow-md border border-slate-200 rounded-2xl p-6 sm:p-8 min-h-[550px]" id="persyaratan-panel">
          <div>
            <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-[#1B355A]/5 text-[#1B355A] rounded-xl mt-1">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
                  Kelengkapan Persyaratan KKPR
                </h3>
                <p className="text-[10px] text-[#1B355A] font-bold mt-1 leading-relaxed">
                  Sesuai Permen ATR/BPN No. 13 Tahun 2021, Juknis Kegiatan Berusaha No. 6/Juknis-PF.01/VIII/2023 & SE Kemen ATR/BPN No. 10/SE-PF.01/VII/2024
                </p>
              </div>
            </div>

            {/* Inner Tabs */}
            <div className="flex space-x-2 mt-4 p-1 bg-slate-100 rounded-lg border border-slate-200/40">
              <button
                type="button"
                onClick={() => setReqTab('dokumen')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 ${
                  reqTab === 'dokumen'
                    ? 'bg-white text-[#1B355A] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Dokumen Syarat (1 - 13)
              </button>
              <button
                type="button"
                onClick={() => setReqTab('alur')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 ${
                  reqTab === 'alur'
                    ? 'bg-white text-[#1B355A] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Alur Pengajuan
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 space-y-4">
              {reqTab === 'dokumen' && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  
                  {[
                    { no: "1", title: "Koordinat Lokasi", desc: "Koordinat lokasi yang dimohon (berdasarkan Peta Bidang Tanah/PTP yang diterbitkan dari Kantor Pertanahan Kabupaten Karimun)" },
                    { no: "2", title: "Pernyataan Sempadan Tanah", desc: "Pernyataan Sempadan Tanah dan Alamat yang Benar dari kelurahan/desa setempat (ditandatangani di atas materai)" },
                    { no: "3", title: "Kebutuhan Luas Lahan", desc: "Kebutuhan luas lahan kegiatan pemanfaatan ruang" },
                    { no: "4", title: "Informasi Penguasaan Tanah", desc: "1. Sertipikat bagi pemohon yang memiliki tanah, 2. Akta Notaris/PPAT (cantumkan no sertipikat alas hak), 3. Bukti sewa/pinjam-meminjam (notaril/bermaterai, cantumkan no sertipikat alas hak), 4. Surat pengakuan/pelepasan/pengalihan hak (notaril/bermaterai, cantumkan no sertipikat alas hak)" },
                    { no: "5", title: "Informasi Bangunan", desc: "a. Memerlukan bangunan baru/rekonstruksi, b. Memiliki bangunan sebelumnya (lampirkan foto), c. Memiliki perizinan sebelumnya (dilampirkan), d. Perubahan/pengembangan bangunan (tergambar dalam rencana teknis terinci)" },
                    { no: "6", title: "Informasi Jenis Kegiatan/Usaha", desc: "a. Akta Pendirian/SK Kumham, b. NPWP Badan Usaha, c. Identitas & NPWP Direktur/Pemohon, d. Email, e. Kontrak kerja, f. Sertifikat Standar Pelaku Konstruksi (1. SBU sendiri/lain, 2. SKA 1 orang & SKT 1 orang jika belum SBU)" },
                    { no: "7", title: "Rencana Teknis Terinci", desc: "a. Rencana Tapak (titik ikat koordinat & alamat benar), b. Denah Bangunan, c. Tampak Bangunan (Depan, Belakang, Kanan, Kiri), d. Potongan Bangunan (Memanjang & Melintang), e. Spesifikasi Teknis Bangunan" },
                    { no: "8", title: "Pernyataan Mandiri UMK", desc: "Pernyataan Mandiri Pelaku Usaha UMK yang telah diterbitkan secara online (Otomatis)" },
                    { no: "9", title: "KKPR Online", desc: "KKPR yang telah diterbitkan secara online (Otomatis)" },
                    { no: "10", title: "Bukti Pembayaran PNbP", desc: "Bukti pembayaran PNbP Peta Bidang Tanah/Pengukuran Bidang Tanah/PTP" },
                    { no: "11", title: "Pertimbangan Teknis Pertanahan", desc: "Pertimbangan Teknis Pertanahan" },
                    { no: "12", title: "Pernyataan Kebenaran Data", desc: "Pernyataan Kebenaran Data dan Informasi serta dapat dipertanggungjawabkan (ditandatangani di atas materai)" },
                    { no: "13", title: "Jenis Data", desc: "Jenis Data (PDF)" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="text-xs font-bold text-[#1B355A] bg-[#1B355A]/5 px-2 py-0.5 rounded-md flex-shrink-0">{item.no}</span>
                        <h4 className="text-xs font-bold text-slate-800 mt-0.5">{item.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-7 leading-relaxed whitespace-pre-line">
                        {item.desc}
                      </p>
                    </div>
                  ))}

                  {/* Catatan Hukum / Legal Note */}
                  <div className="p-3.5 border border-[#EAB630]/30 bg-[#EAB630]/5 text-slate-700 rounded-xl mt-4">
                    <div className="flex items-center space-x-1.5 text-[#1B355A] text-xs font-bold mb-1">
                      <Info className="h-4 w-4 text-[#EAB630] flex-shrink-0" />
                      <span>Catatan Penting:</span>
                    </div>
                    <p className="text-[10.5px] leading-relaxed text-slate-600">
                      Peta hasil verifikasi lokasi (Peta Persetujuan KKPR) diterbitkan setelah berkas dinyatakan lengkap dan sudah memenuhi persyaratan dan standar teknis pemanfaatan ruang mengacu pada rencana tata ruang dan peraturan perundang-undangan yang berlaku.
                    </p>
                  </div>
                </div>
              )}

              {reqTab === 'alur' && (
                <div className="relative border-l-2 border-[#1B355A]/10 ml-3 pl-6 space-y-5 py-1">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-[#1B355A] border-4 border-white shadow-sm"></div>
                    <span className="text-[9px] font-bold text-[#EAB630] uppercase tracking-wider block">Langkah 1</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Pembuatan Akun Pemohon</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Masyarakat mendaftarkan akun pemohon menggunakan email aktif dan nomor KTP yang sah pada portal.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-[#1B355A] border-4 border-white shadow-sm"></div>
                    <span className="text-[9px] font-bold text-[#EAB630] uppercase tracking-wider block">Langkah 2</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Pengisian & Unggah Dokumen</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mengisi data usulan (luas tanah, rencana usaha) dan mengunggah dokumen persyaratan digital.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-[#EAB630] border-4 border-white shadow-sm"></div>
                    <span className="text-[9px] font-bold text-[#EAB630] uppercase tracking-wider block">Langkah 3</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Proses Verifikasi Dinas</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Petugas Dinas PUPR menelaah kesesuaian koordinat dengan peta RDTR/RTRW secara digital.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">Langkah 4</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Penerbitan Keputusan KKPR</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Dokumen persetujuan/penolakan KKPR resmi diterbitkan dan diunduh langsung dari dashboard pemohon.</p>
                  </div>
                </div>
              )}

              {reqTab === 'bantuan' && (
                <div className="space-y-4">
                  <div className="p-3.5 border border-amber-100 bg-amber-50/50 rounded-xl">
                    <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold mb-1">
                      <HelpCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>Belum Memiliki Berkas Shapefile (.SHP)?</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Jangan khawatir! Sistem portal kami mendukung **Plotting Lokasi Mandiri** menggunakan peta interaktif Google Maps. Anda cukup mengklik titik koordinat langsung di peta yang kami sediakan untuk menggambar wilayah lahan Anda secara presisi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Unduhan Dokumen Pendukung:</span>
                    
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert('Mengunduh Template Surat Pernyataan Kebenaran Dokumen...'); }}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all duration-150 text-slate-700 group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-[#1B355A]/5 text-[#1B355A] rounded-lg">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold">Surat Pernyataan Kebenaran Dokumen.pdf</span>
                      </div>
                      <Download className="h-4 w-4 text-slate-400 group-hover:text-[#1B355A] transition-colors" />
                    </a>

                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert('Mengunduh Template Format Surat Kuasa Pengurusan KKPR...'); }}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all duration-150 text-slate-700 group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-[#1B355A]/5 text-[#1B355A] rounded-lg">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold">Surat Kuasa Pengurusan KKPR.docx</span>
                      </div>
                      <Download className="h-4 w-4 text-slate-400 group-hover:text-[#1B355A] transition-colors" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-6">
            <span className="font-medium">Butuh bantuan?</span>
            <a 
              href="https://wa.me/6281276716684" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1B355A] font-bold hover:underline cursor-pointer"
            >
              Contact Person : +62 812-7671-6684
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
