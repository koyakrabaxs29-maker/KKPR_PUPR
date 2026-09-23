import React from 'react';
import { LogOut, User, Building } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-[#1B355A] border-b-4 border-[#EAB630] sticky top-0 z-50 shadow-md" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 flex items-center justify-center bg-white rounded-lg p-1 border border-slate-100 shadow-sm" id="pupr-logo-container">
              <img
                src="/logo_karimun.gif"
                alt="Logo Kabupaten Karimun"
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight block">PUPR KAB. KARIMUN - KKPR</span>
              <span className="text-[10px] text-slate-300 font-medium block uppercase tracking-wider">
                Sistem Informasi Kesesuaian Ruang
              </span>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 border-r border-[#EAB630]/30 pr-4">
                <div className="text-right">
                  <span className="text-sm font-semibold text-white block">{user.name}</span>
                  <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAB630]/20 text-[#EAB630] border border-[#EAB630]/30">
                      {user.role === 'Petugas Verifikator' ? (
                        <span className="flex items-center space-x-1">
                          <Building className="h-3 w-3 mr-0.5" />
                          Verifikator
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3 mr-0.5" />
                          Pemohon
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100/10 border border-white/20 flex items-center justify-center text-white">
                  <User className="h-5 w-5" />
                </div>
              </div>

              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-2 px-3.5 py-2 border border-white/20 text-sm font-bold rounded-lg text-white hover:text-[#EAB630] hover:bg-white/10 hover:border-[#EAB630] transition-all duration-200"
                id="btn-logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
