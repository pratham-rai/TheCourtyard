// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\page.js
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { useApp } from '@/context/AppContext';
import { Calendar, User, Award, Shield, ArrowRight, Star, CheckCircle, HelpCircle, MapPin, Compass, Play } from 'lucide-react';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(
  () => import('@/components/LeafletMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full bg-[#0e0f14] flex items-center justify-center rounded-2xl border border-white/5 min-h-[320px]">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500 animate-pulse font-semibold">Initializing Interactive Map...</span>
      </div>
    )
  }
);

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

export default function Home() {
  const router = useRouter();
  const { user, API_BASE_URL, showToast } = useApp();
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);

  // Fallback mock data if server is loading or offline
  const mockCourts = [
    { name: 'Court 1', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600' },
    { name: 'Court 2', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600' },
    { name: 'Court 3', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=600' }
  ];

  const mockCoaches = [
    { name: 'Coach Pratham Raj', specialization: ['Advanced Dinking', 'Spin Serves'], experience: 8, rating: 4.9, pricePerSession: 1500, image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=600' },
    { name: 'Coach Sarah Jenkins', specialization: ['Beginner Foundations', 'Tactical Positioning'], experience: 6, rating: 4.8, pricePerSession: 1200, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600' },
    { name: 'Coach David Miller', specialization: ['Kitchen Reflex Battles', 'Tournament Mindset'], experience: 10, rating: 5.0, pricePerSession: 1800, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600' }
  ];

  const mockTournaments = [
    { title: 'The Courtyard Summer Smash 2026', date: '2026-06-15', prizePool: '₹50,000 Cash + Trophy', entryFee: 999, image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600', status: 'upcoming' },
    { title: 'Kitchen Finesse & Dink Master Cup', date: '2026-07-02', prizePool: '₹25,000 Gear', entryFee: 499, image: 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=600', status: 'upcoming' }
  ];

  useEffect(() => {
    // Phase 1: Complete UI Isolation - Redirect admin away from consumer homepage
    if (user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    async function fetchData() {
      try {
        const courtsRes = await fetch(`${API_BASE_URL}/courts`);
        if (courtsRes.ok) {
          const courtsData = await courtsRes.json();
          if (courtsData.length) setCourts(courtsData);
        }

        const coachesRes = await fetch(`${API_BASE_URL}/coaching/coaches`);
        if (coachesRes.ok) {
          const coachesData = await coachesRes.json();
          if (coachesData.length) setCoaches(coachesData);
        }

        const tourRes = await fetch(`${API_BASE_URL}/tournaments`);
        if (tourRes.ok) {
          const tourData = await tourRes.json();
          if (tourData.length) setTournaments(tourData);
        }
      } catch (err) {
        console.log('Using mock fallbacks. Backend connection pending.');
        setCourts(mockCourts);
        setCoaches(mockCoaches);
        setTournaments(mockTournaments);
      }
    }
    fetchData();
  }, []);

  const faqData = [
    { q: 'How do I book a court slot at The Courtyard?', a: 'Head to our "Book Courts" tab, select your preferred court (Indoor Glass, Panoramic Sky, or Clay), choose your play date, select the hourly slot, log in, and complete the instant Razorpay payment. You will receive an instant dynamic check-in QR code!' },
    { q: 'What are the off-peak vs peak hours?', a: 'Off-peak timings are 9:00 AM - 5:00 PM. Peak hours occur early mornings (6:00 AM - 9:00 AM) and evenings (5:00 PM - 10:00 PM), which attract slightly higher rates due to extreme demand and live floodlight configurations.' },
    { q: 'Can I cancel or reschedule my reservation?', a: 'Absolutely! Cancellations done up to 12 hours before your scheduled play session can be initiated directly from your User Dashboard under the "Upcoming Bookings" drawer.' },
    { q: 'Do you offer paddle and ball rentals?', a: 'Yes! We provide complimentary tournament-grade pickleball balls and have premium carbon-fiber paddles available for rent at ₹100 per session directly at the club desk.' },
    { q: 'How do membership discounts work?', a: 'We offer Basic (10% discount), Pro (25% discount), and Elite (100% off court bookings!) tiers. Once active, the pricing engine on the Booking Calendar automatically recalculates and applies your discount!' }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sport-charcoal via-sport-dark to-sport-dark">
        {/* Cinematic abstract background overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        
        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/10 w-80 h-80 rounded-full bg-neon-green/10 filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-electric-blue/10 filter blur-[120px] animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          {/* Tagline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-neon-green/20 text-neon-green text-xs font-bold uppercase tracking-widest mb-6 animate-bounce-short">
            <Compass className="w-3.5 h-3.5" />
            Redefining Sports Luxury
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold uppercase tracking-tight text-white mb-6 leading-none">
            Welcome to <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-white to-electric-blue">
              The Courtyard
            </span>
          </h1>

          <p className="text-gray-300 max-w-2xl text-base sm:text-xl leading-relaxed mb-10 tracking-wide">
            Step onto pristine glass cushion surfaces, enjoy elite professional coaching, unlock global membership perks, and join Mangaluru's ultimate pickleball community.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mb-16">
            <Link
              href="/bookings"
              className="px-8 py-4 rounded-xl bg-neon-green text-black font-extrabold text-base uppercase tracking-wider shadow-lg hover:shadow-neon-green/45 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group neon-glow"
            >
              <Calendar className="w-5 h-5 stroke-[2.5]" />
              Book a Court
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/coaching"
              className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-extrabold text-base uppercase tracking-wider border border-white/10 hover:border-electric-blue/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group blue-glow"
            >
              <Compass className="w-5 h-5" />
              Explore Coaching
            </Link>
          </div>

          {/* Quick Stats in Natural Flow (prevents overlaps on all viewports!) */}
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-2xl border-white/5 text-center">
              <h4 className="text-neon-green font-bold text-3xl">3 Pro</h4>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Acrylic & Clay Courts</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-white/5 text-center">
              <h4 className="text-electric-blue font-bold text-3xl">3 Expert</h4>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Certified Coaches</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-white/5 text-center">
              <h4 className="text-white font-bold text-3xl">24/7</h4>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Online Live Bookings</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COURT PREVIEW SECTION ================= */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green">Live Court Selection</span>
          <h2 className="text-4xl font-extrabold uppercase text-white mt-2">Arena Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(courts.length ? courts : mockCourts).map((court, idx) => (
            <div key={idx} className="glass-panel rounded-2xl overflow-hidden glass-panel-hover transition-all duration-300 flex flex-col group">
              <div className="relative h-60 overflow-hidden bg-sport-charcoal">
                <img
                  src={court.image}
                  alt={court.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/75 backdrop-blur-md rounded-lg border border-neon-green/30 text-neon-green text-xs font-bold uppercase tracking-wider">
                  Live Available
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white group-hover:text-neon-green transition-colors">{court.name}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-semibold">{court.surface}</p>
                <p className="text-sm text-gray-400 leading-relaxed mt-3 flex-1">
                  {court.description || 'Pristine, state-of-the-art play parameters, custom shock absorption, and high-contrast visuals.'}
                </p>
                <div className="flex justify-between items-center border-t border-white/5 pt-5 mt-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Hourly Price</span>
                    <span className="text-xl font-black text-white">₹{court.basePrice} <span className="text-xs text-gray-400 font-normal">/ hr</span></span>
                  </div>
                  <Link
                    href="/bookings"
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-neon-green hover:text-black hover:border-neon-green hover:neon-glow transition-all duration-300"
                  >
                    Reserve Slot
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= COACHING SECTION ================= */}
      <section className="py-24 bg-sport-charcoal/50 border-y border-white/5 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-electric-blue/5 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-electric-blue">Championship Formations</span>
            <h2 className="text-4xl font-extrabold uppercase text-white mt-2">Certified Coach Listing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(coaches.length ? coaches : mockCoaches).map((coach, idx) => (
              <div key={idx} className="glass-panel rounded-2xl overflow-hidden glass-panel-hover transition-all duration-300 flex flex-col group border-white/5">
                <div className="relative h-72 overflow-hidden bg-sport-dark">
                  <img
                    src={coach.image}
                    alt={coach.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/75 backdrop-blur-md rounded-lg border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {coach.rating || 4.9}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white group-hover:text-electric-blue transition-colors">{coach.name}</h3>
                  <span className="text-xs text-electric-blue uppercase tracking-widest mt-0.5 font-bold">
                    {coach.experience}+ Years Experience
                  </span>
                  
                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(coach.specialization || []).map((spec, sIdx) => (
                      <span key={sIdx} className="px-2.5 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5 text-[10px] font-semibold tracking-wide uppercase">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-400 leading-relaxed mt-4 flex-1">
                    {coach.bio || 'Dynamic coaching progressions customized specifically for beginner dink fundamentals to competitive match tactics.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MEMBERSHIP PLANS ================= */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green">Exclusive Access Perks</span>
          <h2 className="text-4xl font-extrabold uppercase text-white mt-2">Membership Plans</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Basic */}
          <div className="glass-panel p-8 rounded-2xl border-white/5 flex flex-col relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Basic Tier</h3>
            <span className="text-xs text-gray-400 tracking-wider">Perfect for weekend recreational play</span>
            <div className="my-6">
              <span className="text-4xl font-black text-white">₹999</span>
              <span className="text-sm text-gray-400"> / month</span>
            </div>
            <hr className="border-white/5 mb-6" />
            <ul className="space-y-4 text-sm text-gray-300 flex-1">
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> 10% discount on all court bookings</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> Book up to 3 days in advance</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> 1 free monthly guest pass</li>
            </ul>
            <Link
              href="/dashboard"
              className="w-full text-center py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider border border-white/10 transition-all duration-300 mt-8"
            >
              Join Basic
            </Link>
          </div>

          {/* Pro */}
          <div className="glass-panel p-8 rounded-2xl border-electric-blue/30 flex flex-col relative overflow-hidden group hover:border-electric-blue/60 transition-all duration-300 blue-glow bg-gradient-to-b from-electric-blue/[0.02] to-transparent">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-electric-blue text-black font-extrabold text-[10px] uppercase tracking-widest rounded-bl-xl">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Pro Tier</h3>
            <span className="text-xs text-electric-blue tracking-wider font-semibold">For dedicated competitive athletes</span>
            <div className="my-6">
              <span className="text-4xl font-black text-white">₹1,999</span>
              <span className="text-sm text-gray-400"> / month</span>
            </div>
            <hr className="border-white/5 mb-6" />
            <ul className="space-y-4 text-sm text-gray-200 flex-1">
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-electric-blue mt-0.5" /> 25% discount on court bookings</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-electric-blue mt-0.5" /> 10% discount on coaching sessions</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-electric-blue mt-0.5" /> Book up to 7 days in advance</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-electric-blue mt-0.5" /> Premium locker & shower access</li>
            </ul>
            <Link
              href="/dashboard"
              className="w-full text-center py-3.5 rounded-xl bg-electric-blue text-black font-extrabold text-xs uppercase tracking-wider transition-all duration-300 mt-8 shadow-lg hover:shadow-electric-blue/30"
            >
              Upgrade to Pro
            </Link>
          </div>

          {/* Elite */}
          <div className="glass-panel p-8 rounded-2xl border-neon-green/30 flex flex-col relative overflow-hidden group hover:border-neon-green/60 transition-all duration-300 neon-glow bg-gradient-to-b from-neon-green/[0.02] to-transparent">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-neon-green text-black font-extrabold text-[10px] uppercase tracking-widest rounded-bl-xl">
              Ultimate
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Elite Club</h3>
            <span className="text-xs text-neon-green tracking-wider font-semibold">Ultimate sports luxury & freedom</span>
            <div className="my-6">
              <span className="text-4xl font-black text-white">₹4,999</span>
              <span className="text-sm text-gray-400"> / month</span>
            </div>
            <hr className="border-white/5 mb-6" />
            <ul className="space-y-4 text-sm text-gray-200 flex-1">
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> 100% FREE court bookings (off-peak)</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> 20% discount on all coaching programs</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> Book up to 14 days in advance</li>
              <li className="flex items-start gap-2.5"><CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> Free entries to upcoming tournaments</li>
            </ul>
            <Link
              href="/dashboard"
              className="w-full text-center py-3.5 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider transition-all duration-300 mt-8 shadow-lg hover:shadow-neon-green/30"
            >
              Unlock Elite Club
            </Link>
          </div>
        </div>
      </section>

      {/* ================= TOURNAMENTS SECTION ================= */}
      <section className="py-24 bg-sport-charcoal/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green">Live Tournament Cups</span>
            <h2 className="text-4xl font-extrabold uppercase text-white mt-2">Events & Leagues</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(tournaments.length ? tournaments : mockTournaments).map((tour, idx) => (
              <div key={idx} className="glass-panel rounded-2xl overflow-hidden glass-panel-hover transition-all duration-300 flex flex-col sm:flex-row group border-white/5">
                <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden bg-sport-dark">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-neon-green text-black text-[9px] font-extrabold uppercase tracking-wider rounded">
                    Open
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-neon-green uppercase tracking-widest font-bold">
                      📅 Date: {formatDateDMY(tour.date)}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1 group-hover:text-neon-green transition-colors">
                      {tour.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {tour.description || 'Battle top-tier pairings for high stakes prize pools, equipment kits and the club summer smash trophies.'}
                    </p>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block tracking-wider">Prize Pool</span>
                      <span className="text-base font-extrabold text-white">{tour.prizePool}</span>
                    </div>
                    <Link
                      href="/tournaments"
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-neon-green hover:text-black hover:border-neon-green transition-all duration-300"
                    >
                      Enter Event
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CLUB MAP AND CONTACTS ================= */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-electric-blue">Find The Club</span>
          <h2 className="text-4xl font-extrabold uppercase text-white mt-2">Location & Schedule</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Info Details */}
          <div className="space-y-8">
            <div className="glass-panel p-6 rounded-2xl border-white/5 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-electric-blue/10 flex items-center justify-center text-electric-blue shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wider">Location Address</h4>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                  📍 Megina Mane, Kandettu Rd, Kadri Hills, Bikarnakatte Kaikamba, Padavu, Mangaluru, Karnataka 575005
                </p>
                <a
                  href="https://maps.app.goo.gl/pwoVYiwghnCQ6jkc8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-electric-blue font-bold uppercase tracking-wider mt-2.5 hover:underline"
                >
                  Get Directions <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center text-neon-green shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wider">Play Timings</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Monday – Sunday: <span className="text-white font-semibold">6:00 AM – 10:00 PM</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Active floodlights operate 5:00 PM - 10:00 PM. Reservations operate 7 days a week.
                </p>
              </div>
            </div>
          </div>

          {/* Real Leaflet Dark Map Integration */}
          <div className="glass-panel rounded-2xl overflow-hidden border-white/5 h-80 relative group shadow-2xl cursor-pointer">
            <LeafletMap />
            
            {/* Overlay Glass Card */}
            <div className="absolute bottom-4 left-4 right-4 z-[1001] glass-panel border-white/10 p-4 rounded-xl flex items-center justify-between pointer-events-auto">
              <span className="text-xs text-white font-bold tracking-wider uppercase">Bikarnakatte Club Arena</span>
              <a
                href="https://maps.app.goo.gl/pwoVYiwghnCQ6jkc8"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-neon-green text-black text-[10px] font-extrabold rounded-lg uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
              >
                Find Route
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-24 bg-sport-charcoal/50 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green">Have Queries?</span>
            <h2 className="text-4xl font-extrabold uppercase text-white mt-2">Club FAQs</h2>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="glass-panel rounded-2xl border-white/5 overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex justify-between items-center text-white hover:text-neon-green transition-colors duration-300"
                  >
                    <span className="font-bold text-base tracking-wide flex items-center gap-3">
                      <HelpCircle className={`w-5 h-5 shrink-0 ${isOpen ? 'text-neon-green' : 'text-gray-400'}`} />
                      {faq.q}
                    </span>
                    <span className="text-xl font-bold text-gray-500 ml-4">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-sm text-gray-400 leading-relaxed border-t border-white/5 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
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
