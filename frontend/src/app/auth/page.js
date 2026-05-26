// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\auth\page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Mail, Lock, User, ArrowRight, ShieldCheck, HelpCircle, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Auth() {
  const router = useRouter();
  const { user, login, signup, loginWithGoogle, forgotPassword, showToast, verifyEmail, resendVerification } = useApp();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Email Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verifyEmailAddress, setVerifyEmailAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resending, setResending] = useState(false);

  // Password Visibility state
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to appropriate portal
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'reception') {
        router.push('/admin');
      } else if (user.role === 'coach') {
        router.push('/coach');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      showToast('Please fill in all required fields!', 'error');
      return;
    }

    setLoading(true);
    let result;
    if (isLogin) {
      result = await login(email, password);
    } else {
      result = await signup(name, email, password);
    }
    setLoading(false);

    if (result && result.success) {
      if (result.requiresVerification) {
        setVerifyEmailAddress(result.email || email);
        setShowVerification(true);
        showToast('Verification code simulated in terminal console!', 'info');
      } else {
        setTimeout(() => {
          if (result.user?.role === 'admin' || result.user?.role === 'reception') router.push('/admin');
          else if (result.user?.role === 'coach') router.push('/coach');
          else router.push('/dashboard');
        }, 100);
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Please enter the 6-digit OTP code!', 'error');
      return;
    }
    setLoading(true);
    const result = await verifyEmail(verifyEmailAddress, verificationCode);
    setLoading(false);
    if (result && result.success) {
      setShowVerification(false);
      setTimeout(() => {
        if (result.user?.role === 'admin' || result.user?.role === 'reception') router.push('/admin');
        else if (result.user?.role === 'coach') router.push('/coach');
        else router.push('/dashboard');
      }, 100);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    const result = await resendVerification(verifyEmailAddress);
    setResending(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your registered email address!', 'error');
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res && res.success) {
      setShowForgot(false);
      if (res.devResetUrl) {
        console.log(`[DEV ONLY] Here is your password recovery link: ${res.devResetUrl}`);
      }
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      const result = await loginWithGoogle(tokenResponse.access_token);
      setLoading(false);
      // Wait for React state to update context, then redirect based on role
      if (result && result.success) {
        setTimeout(() => {
          if (result.user?.role === 'admin' || result.user?.role === 'reception') {
            router.push('/admin');
          } else if (result.user?.role === 'coach') {
            router.push('/coach');
          } else {
            router.push('/dashboard');
          }
        }, 100);
      }
    },
    onError: () => {
      showToast('Google Sign-In failed. Please try again.', 'error');
      setLoading(false);
    }
  });

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
                {showVerification ? 'Verify' : showForgot ? 'Reset Pass' : isLogin ? 'Sign In' : 'Join Club'}
              </h2>
              <p className="text-xs text-gray-400 mt-1.5 uppercase tracking-widest font-semibold">
                {showVerification
                  ? 'Confirm your simulated identity'
                  : showForgot 
                  ? 'Enter details to recover credential' 
                  : isLogin 
                  ? 'Unlock the luxury court parameters' 
                  : 'Register a premium sports profile'}
              </p>
            </div>

            {showVerification ? (
              /* OTP Verification panel */
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div className="flex flex-col gap-1.5 text-center mb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green mx-auto mb-2 animate-pulse">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-300">
                    A verification code has been sent to
                  </p>
                  <span className="text-sm font-semibold text-white break-all">{verifyEmailAddress}</span>
                  <p className="text-[10px] text-gray-400 border border-dashed border-white/10 rounded-lg p-2.5 bg-black/20 mt-1">
                    ℹ️ Local Dev: Look for the code printed in the backend server console.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">6-Digit Code</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 pl-11 pr-4 text-center text-lg font-bold tracking-[0.5em] text-neon-green placeholder-gray-600 outline-none transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-neon-green text-black font-extrabold text-sm uppercase tracking-wider hover:scale-102 transition-all duration-300 neon-glow flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify Email & Enter'}
                </button>

                <div className="flex flex-col items-center gap-2 mt-4 text-xs">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resending}
                    className="text-electric-blue hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Resending...' : 'Resend Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowVerification(false)}
                    className="text-gray-400 hover:text-white uppercase tracking-wider text-[10px] font-bold mt-2"
                  >
                    Cancel and Login
                  </button>
                </div>
              </form>
            ) : showForgot ? (
              /* Forgot Password panel */
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@gmail.com"
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-neon-green text-black font-extrabold text-sm uppercase tracking-wider hover:scale-102 transition-all duration-300 neon-glow"
                >
                  Send Recovery Link
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full text-center text-xs text-gray-400 hover:text-white uppercase tracking-wider font-semibold mt-2 transition-all"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              /* Standard Auth Forms */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tabs */}
                <div className="grid grid-cols-2 bg-black/40 border border-white/5 rounded-xl p-1 mb-2">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setShowForgot(false); }}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      isLogin ? 'bg-white/5 border border-white/10 text-neon-green font-extrabold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setShowForgot(false); }}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      !isLogin ? 'bg-white/5 border border-white/10 text-neon-green font-extrabold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Name (Register only) */}
                {!isLogin && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Pratham Raj"
                        className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@thecourtyard.com"
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[10px] text-electric-blue hover:underline uppercase tracking-wider font-semibold"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-neon-green text-black font-extrabold text-sm uppercase tracking-wider shadow-lg hover:shadow-neon-green/20 hover:scale-102 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2 group neon-glow"
                >
                  {loading ? 'Processing...' : isLogin ? 'Access Club' : 'Join Club House'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Google OAuth Separator */}
                <div className="flex items-center gap-3 my-6">
                  <hr className="flex-1 border-white/5" />
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Or Continue With</span>
                  <hr className="flex-1 border-white/5" />
                </div>

                {/* Google Sign in Button */}
                <button
                  type="button"
                  onClick={triggerGoogleLogin}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-102 group active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.48 0-6.305-2.825-6.305-6.305s2.825-6.305 6.305-6.305c1.513 0 2.898.536 3.985 1.424l3.109-3.109C18.99 2.222 15.82 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.48 0 11.24-4.56 11.24-11.24 0-.765-.078-1.503-.223-2.235H12.24z" />
                  </svg>
                  Sign in with Google
                </button>
              </form>
            )}

            {/* Shield disclaimer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
              Secure JWT SSL encrypted gateway operations.
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
