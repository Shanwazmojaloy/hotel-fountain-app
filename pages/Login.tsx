import React, { useState, useRef } from 'react';
import { Eye, EyeOff, User, Lock, ShieldAlert } from 'lucide-react';
import { Role, User as UserType } from '../types';
import { useDatabase } from '../context/DatabaseContext';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { users, login } = useDatabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleDemoLogin = (role: Role) => {
    // Find the default user for this role
    const user = users.find(u => u.role === role);
    if (user) {
      // Set the identifier but do not log in immediately
      // This forces the user to provide the Administrative Key
      setEmail(user.email);
      setPassword('');
      setError('');
      // Smoothly focus the password field to prompt for input
      setTimeout(() => passwordRef.current?.focus(), 100);
    } else {
      setError(`NO USER FOUND WITH ROLE: ${role}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate against system users list
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (foundUser) {
      login(foundUser); // Update context state with full user
      onLogin(foundUser); // Update App state (isAuthenticated)
    } else {
      setError('AUTHENTICATION FAILED. INVALID CREDENTIALS.');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2070")' }}
    >
      {/* High-contrast dark overlay */}
      <div className="absolute inset-0 bg-[#140D07]/90 backdrop-blur-md"></div>

      <div className="w-full max-w-[580px] z-10 animate-professional">
        {/* Main Glassmorphic Card */}
        <div className="bg-black/20 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-14 shadow-[0_60px_120px_-20px_rgba(0,0,0,1)] border border-white/10 flex flex-col items-center">

          {/* Header Section */}
          <div className="flex flex-col items-center mb-14 w-full">
            <h1 className="text-white text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none text-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">Hotel Fountain</h1>
            <div className="flex items-center gap-5 mt-5 w-full justify-center">
              <div className="h-[1.5px] w-16 bg-[#D3AF37]/40"></div>
              <p className="text-[#D3AF37] text-[10px] font-black tracking-[0.6em] uppercase whitespace-nowrap">Luxury in Comfort</p>
              <div className="h-[1.5px] w-16 bg-[#D3AF37]/40"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-10">
            {/* Identifier Input */}
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-5">Authorized Identifier</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#D3AF37] transition-colors duration-300">
                  <User size={22} strokeWidth={2.5} />
                </div>
                <input
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-white font-bold focus:bg-white/10 focus:border-[#D3AF37]/50 outline-none transition-all duration-300 placeholder:text-white/20 text-xs tracking-widest uppercase"
                  placeholder="Work Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Key/Password Input */}
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-5">Administrative Key</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#D3AF37] transition-colors duration-300">
                  <Lock size={22} strokeWidth={2.5} />
                </div>
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-16 py-5 text-white font-bold focus:bg-white/10 focus:border-[#D3AF37]/50 outline-none transition-all duration-300 placeholder:text-white/20 text-xs tracking-widest uppercase"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#D3AF37] transition-all duration-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-950/40 border border-rose-500/20 px-6 py-4 rounded-2xl flex items-center gap-4">
                <ShieldAlert className="text-rose-500 flex-shrink-0" size={18} />
                <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest leading-none">{error}</p>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full bg-[#4B3621] hover:bg-[#3D2C1B] text-white py-6 rounded-2xl font-black text-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-500 active:scale-[0.98] uppercase tracking-[0.5em] mt-4 border border-white/5 border-t-white/10"
            >
              Authenticate
            </button>
          </form>

          {/* Quick Login Tray */}
          <div className="mt-16 w-full">
            <div className="flex justify-center gap-8 px-10 py-5 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-lg">
              <button
                onClick={() => handleDemoLogin(Role.ADMIN)}
                className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] hover:text-[#D3AF37] transition-all"
              >
                Admin Session
              </button>
              <div className="w-[1.5px] h-3 bg-white/10 self-center"></div>
              <button
                onClick={() => handleDemoLogin(Role.FRONT_DESK)}
                className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] hover:text-[#D3AF37] transition-all"
              >
                Front Desk
              </button>
              <div className="w-[1.5px] h-3 bg-white/10 self-center"></div>
              <button
                onClick={() => handleDemoLogin(Role.ACCOUNTANT)}
                className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] hover:text-[#D3AF37] transition-all"
              >
                Accountant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};