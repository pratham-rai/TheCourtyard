// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\auth\reset\page.js
'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, showToast } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      showToast('Invalid or missing recovery token!', 'error');
      router.push('/auth');
    }
  }, [token, router, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      showToast('Please enter and confirm your new password!', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long!', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);

    if (result && result.success) {
      router.push('/auth');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">New Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Confirm Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full py-4 rounded-xl bg-neon-green text-black font-extrabold text-sm uppercase tracking-wider shadow-lg hover:shadow-neon-green/20 hover:scale-102 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2 group neon-glow"
      >
        {loading ? 'Updating Password...' : 'Update Password'}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <section className="flex-1 flex items-center justify-center pt-28 pb-16 px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-sport-charcoal via-sport-dark to-sport-dark">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-neon-green/5 filter blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-electric-blue/5 filter blur-[100px]" />

        <div className="max-w-md w-full relative z-10">
          <div className="glass-panel p-8 rounded-3xl border-white/5 shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden bg-black/50 border border-neon-green/30 shadow-lg neon-glow mb-4">
                <img src="/logo.png" alt="The Courtyard Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-3xl font-extrabold text-white uppercase tracking-wider">
                Reset Password
              </h2>
              <p className="text-xs text-gray-400 mt-1.5 uppercase tracking-widest font-semibold">
                Setup new access credentials for your premium account
              </p>
            </div>

            <Suspense fallback={
              <div className="text-center py-8 text-gray-400 text-sm">
                Loading recovery configuration...
              </div>
            }>
              <ResetPasswordForm />
            </Suspense>

            {/* Shield disclaimer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
              Secure cryptographic hashing reset portal.
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
