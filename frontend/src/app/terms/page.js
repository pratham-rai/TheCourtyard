// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\terms\page.js
'use client';
import React from 'react';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { ScrollText, ShieldAlert, Clock, Scale } from 'lucide-react';

export default function TermsAndConditions() {
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
              <Scale className="w-4 h-4" /> Legal Parameters
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase text-white mt-2">
              Terms & Conditions
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
                <ScrollText className="w-5 h-5 text-neon-green" /> 1. Acceptance of Terms
              </h3>
              <p>
                By registering an account, booking courts, or purchasing memberships at The Courtyard, you agree to be bound by these Terms and Conditions. If you do not agree, you must refrain from using the facilities and online services.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold uppercase tracking-wider text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-neon-green" /> 2. Booking and Check-in Rules
              </h3>
              <p>
                All court reservations represent specific hourly slots. To maintain operations and ensure court integrity:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                <li>Check-ins open <span className="text-white font-bold">10 minutes prior</span> to the booked slot start time.</li>
                <li>Players must present their simulated QR code at the reception scanner to confirm check-in.</li>
                <li>Late check-ins after the slot has ended are considered expired and non-refundable.</li>
                <li>Past slots on the current date or any past dates cannot be booked or reserved.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold uppercase tracking-wider text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-neon-green" /> 3. Membership & Cancellation Policies
              </h3>
              <p>
                We offer Basic, Pro, and Elite membership tiers. Each tier unlocks specific discount parameters:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                <li>Elite members enjoy free entry passes to select tournaments and premium booking privileges.</li>
                <li>Cancellation requests must be submitted through the User Club Dashboard at least 24 hours prior to the slot time to receive wallet balance credits.</li>
                <li>Refunds are processed strictly as simulated credits to your club wallet and are non-transferable.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold uppercase tracking-wider text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-neon-green" /> 4. Health, Safety & Liability Release
              </h3>
              <p>
                Pickleball is an active physical sport. By using our shock-absorbent Acrylic Cushion courts and floodlit facilities:
              </p>
              <p className="text-gray-400">
                You confirm you are in good health and physical condition to play. The Courtyard Club is not liable for personal injuries, health incidents, or lost personal belongings within the club premises. Proper non-marking sports footwear is mandatory on all courts.
              </p>
            </div>

            {/* Bottom Note */}
            <div className="border-t border-white/5 pt-6 text-center text-xs text-gray-500">
              <p>For questions or assistance regarding these terms, please visit our <a href="/contact" className="text-neon-green hover:underline">Contact Support</a> page.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
