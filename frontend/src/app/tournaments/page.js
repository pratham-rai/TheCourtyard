// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\tournaments\page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Award, Calendar, DollarSign, Users, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';

const formatDateDMY = (dateInput) => {
  if (!dateInput) return '';
  const dateStr = String(dateInput);
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export default function Tournaments() {
  const router = useRouter();
  const { user, token, API_BASE_URL, showToast } = useApp();

  const [tournaments, setTournaments] = useState([]);
  const [loadingRegister, setLoadingRegister] = useState(null); // stores active tournament ID being registered

  // Fallbacks if backend server pending
  const fallbackTournaments = [
    { _id: 't1', title: 'The Courtyard Summer Smash 2026', description: 'Our flagship double-elimination battle. Bring your best partner, compete under our high-performance stadium lights, and contest for the prestigious gold cup.', date: '2026-06-15', prizePool: '₹50,000 Cash + Trophy', entryFee: 999, image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600', status: 'upcoming', registrations: [] },
    { _id: 't2', title: 'Kitchen Finesse & Dink Master Cup', description: 'A specialized championship testing patience, dink angles, and soft drops. Standard doubles format with separate brackets for intermediate and pro level pairings.', date: '2026-07-02', prizePool: '₹25,000 Pickleball Equipment Gear', entryFee: 499, image: 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=600', status: 'upcoming', registrations: [] }
  ];

  async function fetchTournaments() {
    try {
      const res = await fetch(`${API_BASE_URL}/tournaments`);
      if (res.ok) {
        const data = await res.json();
        if (data.length) setTournaments(data);
        else setTournaments(fallbackTournaments);
      } else {
        setTournaments(fallbackTournaments);
      }
    } catch (err) {
      setTournaments(fallbackTournaments);
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin');
      return;
    }
    fetchTournaments();
  }, [user, router]);

  const handleRegister = async (tourId) => {
    if (!user) {
      showToast('Please sign in to register for tournaments!', 'error');
      router.push('/auth');
      return;
    }

    setLoadingRegister(tourId);
    try {
      const res = await fetch(`${API_BASE_URL}/tournaments/register/${tourId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tournament registration failed');
      }

      showToast(`Registered for ${data.tournament.title}!`, 'success');
      fetchTournaments(); // refresh count
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingRegister(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-green/[0.02] to-transparent pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-12">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green">Championship Leagues</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white mt-1">Tournaments & Events</h2>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tournaments.map((tour) => {
              const isRegistered = user && tour.registrations.includes(user.id);
              const isEliteUser = user && user.membership === 'Elite';
              // Elite gets free registration!
              const finalFee = isEliteUser ? 0 : tour.entryFee;

              return (
                <div key={tour._id} className="glass-panel rounded-3xl overflow-hidden glass-panel-hover transition-all duration-300 border-white/5 flex flex-col group shadow-2xl">
                  
                  {/* Banner Image */}
                  <div className="relative h-64 overflow-hidden bg-sport-dark">
                    <img src={tour.image} alt={tour.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <div className="absolute top-4 left-4 px-3 py-1 bg-neon-green text-black text-xs font-black uppercase tracking-widest rounded-lg neon-glow">
                      {tour.status}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="flex items-center gap-1.5 text-xs text-neon-green font-bold uppercase tracking-widest">
                        <Calendar className="w-4 h-4" />
                        {formatDateDMY(tour.date)}
                      </div>
                      <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-lg border border-white/10 text-white text-xs font-bold uppercase flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-electric-blue" />
                        {tour.registrations.length} Teams Registered
                      </div>
                    </div>
                  </div>

                  {/* Body description */}
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-extrabold text-white group-hover:text-neon-green transition-colors uppercase tracking-wide">
                        {tour.title}
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed mt-3">
                        {tour.description}
                      </p>
                    </div>

                    {/* Footer invoice details & register CTA */}
                    <div className="border-t border-white/5 pt-6 mt-8 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Prize Pool</span>
                        <span className="text-lg font-black text-white flex items-center gap-1">
                          <Award className="w-5 h-5 text-yellow-400" />
                          {tour.prizePool}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Entry Fee</span>
                          {isEliteUser ? (
                            <span className="text-xs font-black text-neon-green uppercase tracking-wide">Elite Free Pass</span>
                          ) : (
                            <span className="text-base font-black text-white">₹{tour.entryFee}</span>
                          )}
                        </div>

                        {isRegistered ? (
                          <div className="px-5 py-3 rounded-xl bg-neon-green/10 text-neon-green border border-neon-green/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            Registered
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRegister(tour._id)}
                            disabled={loadingRegister === tour._id}
                            className="px-6 py-3 bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-neon-green/30 hover:scale-103 transition-all duration-300 flex items-center gap-1.5 cursor-pointer neon-glow"
                          >
                            {loadingRegister === tour._id ? 'Registering...' : 'Register Entry'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
