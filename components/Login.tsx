import React, { useState } from 'react';
import { loginUser } from '../services/storageService';
import { LogIn, Sparkles, AlertCircle, Lock, User } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Use custom table login
    const result = await loginUser(username.trim().toLowerCase(), password);

    if (result.success) {
        onLoginSuccess();
    } else {
        setError(result.error || 'Giriş başarısız.');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dto-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-dto-700">
        
        {/* Header Section */}
        <div className="bg-dto-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500 rounded-full mix-blend-overlay opacity-20 -mr-8 -mt-8 blur-2xl"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-dto-700 rounded-full flex items-center justify-center text-gold-500 mx-auto mb-4 shadow-lg border border-dto-600">
              <Sparkles size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">DTÖ Dijital Rehberi</h1>
            <p className="text-dto-300 text-sm mt-2">Kullanıcı Girişi</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dto-700 mb-2">Kullanıcı Adı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-dto-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  className="w-full p-3 pl-10 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="örn: ahmet"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dto-700 mb-2">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-dto-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-pulse">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:scale-100"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              {!loading && <LogIn size={20} />}
            </button>
          </form>
          <div className="mt-4 text-center text-xs text-dto-400">
             Kullanıcı adı ve şifrenizi yöneticinizden temin ediniz.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;