// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\privacy\page.js
'use client';
import React from 'react';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Shield, Eye, Lock, Database } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-sport-dark text-white">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-4xl mx-auto w-full relative">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-neon-green/5 filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-electric-blue/5 filter blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" /> Data Protection
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase text-white mt-2">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider">
              Last Updated: June 2026 • The Courtyard Play Guidelines
            </p>
          </div>

          {/* Content Card */}
          <div className="glass-panel p-6 sm:p-10 rounded-3xl border-white/5 shadow-2xl space-y-8 text-sm text-gray-300 leading-relaxed">
            
            {/* Section 1 */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold uppercase tracking-wider text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-neon-green" /> 1. Data Collection
              </h3>
              <p>
                To provide premium sports sanctuary services, we collect profile details when you register or interact with the platform:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                <li><span className="text-white font-bold">Identity Data:</span> Full Name and Email Address.</li>
                <li><span className="text-white font-bold">Transaction History:</span> Booking records, invoices, check-in logs, and wallet transaction ledgers.</li>
                <li><span className="text-white font-bold">Authentication:</span> Secure password hashes and Google OAuth authorization tokens.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold uppercase tracking-wider text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-neon-green" /> 2. How We Use Data
              </h3>
              <p>
                Your collected credentials are used strictly for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                <li>Processing court reservations, coaching programs, and tournament entries.</li>
                <li>Managing club wallets, processing GST-compliant invoicing, and receipts.</li>
                <li>Verifying player identities at court entrances using simulated check-in QR codes.</li>
                <li>Delivering announcements and notifications about schedule updates.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold uppercase tracking-wider text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-neon-green" /> 3. Security and Storage
              </h3>
              <p>
                Your security is our absolute priority. We employ high-performance industry practices:
              </p>
              <p className="text-gray-400">
                All passwords are fully hashed with salt properties prior to database records storage. Sessions are authenticated using signed JSON Web Tokens (JWT) and SSL transport layers, blocking unauthorized API calls. We do not sell or lease player profiles to third-party marketing services.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold uppercase tracking-wider text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-neon-green" /> 4. Cookies & Session Storage
              </h3>
              <p>
                We use browser Local Storage and Cookies to preserve login session states. This allows you to stay signed in to your User Club Dashboard. You can disable cookies in browser options, but it may require logging in on every visit.
              </p>
            </div>

            {/* Bottom Note */}
            <div className="border-t border-white/5 pt-6 text-center text-xs text-gray-500">
              <p>For questions or assistance regarding data privacy, please contact the club administrative officers at <span className="text-white font-bold">play@thecourtyard.com</span>.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
