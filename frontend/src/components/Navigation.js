// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\components\Navigation.js
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Home, Calendar, Award, User, LogOut, Compass, MessageSquare, Shield, HelpCircle, PhoneCall } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useApp();

  const playerLinks = [
    { name: 'Home', path: '/' },
    { name: 'Book Courts', path: '/bookings' },
    { name: 'Coaching', path: '/coaching' },
    { name: 'Tournaments', path: '/tournaments' },
    { name: 'Contact', path: '/contact' },
  ];

  const adminLinks = [];

  const navLinks = (user?.role === 'admin' || user?.role === 'reception') ? adminLinks : playerLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand Logo */}
          <Link href={(user?.role === 'admin' || user?.role === 'reception') ? "/admin" : "/"} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 flex items-center justify-center border border-neon-green/30 group-hover:border-neon-green shadow-lg neon-glow transition-all duration-300 group-hover:rotate-6">
              <img src="/logo.png" alt="The Courtyard Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider text-white uppercase group-hover:text-neon-green transition-colors duration-300">
                The Courtyard
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neon-green">
                Pickleball Luxury
              </span>
            </div>
          </Link>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`relative text-sm font-semibold tracking-wider transition-all duration-300 py-2 uppercase ${
                    isActive ? 'text-neon-green' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-green neon-glow rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {(user.role === 'admin' || user.role === 'reception') ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-green text-black text-sm font-extrabold uppercase hover:scale-105 transition-all duration-300 neon-glow"
                  >
                    <Shield className="w-4 h-4" />
                    {user.role === 'reception' ? 'Desk Portal' : 'Admin Portal'}
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-neon-green/30 text-white hover:text-neon-green text-sm font-bold uppercase transition-all duration-300"
                  >
                    <User className="w-4 h-4" />
                    {user.name.split(' ')[0]}
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-6 py-2.5 rounded-xl bg-neon-green text-black font-extrabold text-sm uppercase shadow-lg hover:shadow-neon-green/30 transition-all duration-300 hover:scale-105 active:scale-95 neon-glow"
              >
                Join Club
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useApp();

  const mobileLinks = (user?.role === 'admin' || user?.role === 'reception') ? [
    { name: user?.role === 'reception' ? 'Desk' : 'Admin', path: '/admin', icon: Shield },
  ] : [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Book', path: '/bookings', icon: Calendar },
    { name: 'Coaching', path: '/coaching', icon: Compass },
    { name: 'Events', path: '/tournaments', icon: Award },
    { name: 'Profile', path: '/dashboard', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-sport-dark via-sport-dark/95 to-transparent">
      <div className="glass-panel rounded-2xl flex items-center justify-around h-16 shadow-2xl border-white/5">
        {mobileLinks.map((link) => {
          const isActive = pathname === link.path;
          const Icon = link.icon;
          
          if (link.name === 'Book') {
            return (
              <Link key={link.name} href={link.path} className="relative -top-4 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-neon-green text-black flex items-center justify-center shadow-lg neon-glow border-4 border-sport-dark hover:scale-110 active:scale-95 transition-all duration-300">
                  <Icon className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-[10px] font-extrabold text-neon-green uppercase tracking-wide mt-1">
                  Book
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={link.name}
              href={link.path}
              className={`flex flex-col items-center justify-center w-12 h-full transition-all duration-300 ${
                isActive ? 'text-neon-green scale-110' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              <span className="text-[9px] font-semibold mt-1 uppercase tracking-wide">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Footer() {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin' || user?.role === 'reception';

  return (
    <footer className="bg-sport-dark border-t border-white/5 pt-16 pb-24 md:pb-12 text-gray-400 relative overflow-hidden">
      {/* Decorative light streaks */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full filter blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric-blue/5 rounded-full filter blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-12`}>
          {/* Logo & Description */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 flex items-center justify-center border border-white/10 shadow-lg">
                <img src="/logo.png" alt="The Courtyard Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-wider text-white uppercase">The Courtyard</span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neon-green">Pickleball Luxury</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mt-2">
              Redefining sports luxury with pristine panoramic courts, championship coaching, global memberships, and competitive tournament action.
            </p>
          </div>

          {!isAdmin && (
            <>
              {/* Quick Links */}
              <div>
                <h4 className="text-white font-semibold uppercase tracking-wider text-sm mb-4">Explore</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/bookings" className="hover:text-neon-green transition-colors">Book Court</Link></li>
                  <li><Link href="/coaching" className="hover:text-neon-green transition-colors">Join Coaching</Link></li>
                  <li><Link href="/tournaments" className="hover:text-neon-green transition-colors">Upcoming Tournaments</Link></li>
                  <li><Link href="/dashboard" className="hover:text-neon-green transition-colors">User Club Dashboard</Link></li>
                </ul>
              </div>

              {/* Support / FAQ */}
              <div>
                <h4 className="text-white font-semibold uppercase tracking-wider text-sm mb-4">Support & Help</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/contact" className="hover:text-neon-green transition-colors flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5" /> Contact Support</Link></li>
                  <li><a href="#faq" className="hover:text-neon-green transition-colors flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Club FAQs</a></li>
                  <li><a href="https://wa.me/919900990099" target="_blank" rel="noopener noreferrer" className="hover:text-neon-green transition-colors flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Chat</a></li>
                </ul>
              </div>
            </>
          )}

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-sm mb-4">The Club</h4>
            <p className="text-sm leading-relaxed text-gray-400">
              📍 Megina Mane, Kandettu Rd, Kadri Hills, Bikarnakatte Kaikamba, Padavu, Mangaluru, Karnataka 575005
            </p>
            <p className="text-sm mt-3 font-semibold text-white">
              📞 +91 99009 90099
            </p>
            <p className="text-sm text-neon-green font-semibold">
              ✉️ play@thecourtyard.com
            </p>
          </div>
        </div>

        <hr className="border-white/5 my-10" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} The Courtyard Club. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Club Play</Link>
            <a href="#" className="hover:text-white transition-colors">Razorpay Terms</a>
          </div>
        </div>
      </div>

      {/* Floating Call to Action WhatsApp Widget */}
      <a
        href="https://wa.me/919900990099"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 md:bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group blue-glow"
        title="WhatsApp Support"
      >
        <MessageSquare className="w-6 h-6 stroke-[2]" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out text-sm font-bold ml-0 group-hover:ml-2 uppercase tracking-wider whitespace-nowrap">
          Chat with Us
        </span>
      </a>
    </footer>
  );
}
