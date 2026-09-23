import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginRegister from './components/LoginRegister';
import DashboardPemohon from './components/DashboardPemohon';
import DashboardVerifikator from './components/DashboardVerifikator';
import { User } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('kkpr_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Token kedaluwarsa.');
      }
      setUser(data.user);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      // Clear invalid token
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string, loggedInUser: User) => {
    localStorage.setItem('kkpr_token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('kkpr_token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium text-sm">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1B355A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span>Memverifikasi Sesi Masuk...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800" id="app-root">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="pb-12">
        {!user || !token ? (
          <LoginRegister onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'Petugas Verifikator' ? (
          <DashboardVerifikator token={token} user={user} />
        ) : (
          <DashboardPemohon token={token} user={user} />
        )}
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span>&copy; {new Date().getFullYear()} Sistem Informasi KKPR Portal. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
