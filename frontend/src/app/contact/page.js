// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\contact\page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { useApp } from '@/context/AppContext';
import { Mail, Phone, MapPin, Send, HelpCircle, ShieldAlert, MessageSquare } from 'lucide-react';

export default function Contact() {
  const router = useRouter();
  const { user, showToast } = useApp();

  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin');
    }
  }, [user, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast('Please fill in all inputs!', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      showToast('Enquiry successfully dispatched. Our club desk will connect shortly!', 'success');
      setName('');
      setEmail('');
      setMessage('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-green/[0.02] to-transparent pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-12">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green">Get In Touch</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white mt-1">Contact & Support</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Info cards (1/3 width) */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="glass-panel p-6 rounded-2xl border-white/5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-neon-green/10 text-neon-green flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">The Court House</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    📍 Megina Mane, Kandettu Rd, Kadri Hills, Bikarnakatte Kaikamba, Padavu, Mangaluru, Karnataka 575005
                  </p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">Call Support</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    📞 +91 99009 90099
                  </p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 text-gray-300 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">Write Email</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    ✉️ play@thecourtyard.com
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/919900990099"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel p-6 rounded-2xl border-emerald-500/30 flex gap-4 hover:border-emerald-500/60 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Instant WhatsApp</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    🟢 Chat live with reception desk.
                  </p>
                </div>
              </a>

            </div>

            {/* Support Enquiry Form (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="glass-panel p-8 rounded-3xl border-white/5 shadow-2xl">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Send className="w-5 h-5 text-neon-green" />
                  Dispatch Club Inquiry
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Your Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Pratham Raj"
                        className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 px-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="player@gmail.com"
                        className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 px-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Message Details</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Specify booking issues, membership upgrades, corporate reservations, or coaching doubts..."
                      rows="5"
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 focus:neon-glow rounded-xl py-3.5 px-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-4 px-8 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-neon-green/20 hover:scale-102 transition-all duration-300 flex items-center justify-center gap-2 group neon-glow cursor-pointer"
                  >
                    {loading ? 'Sending...' : 'Dispatch Inquiry'}
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
