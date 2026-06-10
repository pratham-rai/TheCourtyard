// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\bookings\page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Calendar as CalIcon, Clock, CreditCard, CheckCircle, Ticket, Info, AlertTriangle, ArrowRight, ShieldCheck, Award, FileText } from 'lucide-react';
import QRCode from 'react-qr-code';
import InvoiceModal from '@/components/InvoiceModal';

const getISTTime = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const hour = istTime.getUTCHours();
  return { dateStr, hour };
};

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

export default function Bookings() {
  const router = useRouter();
  const { user, setUser, token, API_BASE_URL, showToast } = useApp();

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalData, setInvoiceModalData] = useState(null);
  const [gstRate, setGstRate] = useState(18);

  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null); // stores booking ticket details
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [useWallet, setUseWallet] = useState(false);

  // Fallback courts if server offline
  const fallbackCourts = [
    { _id: '1', name: 'Court 1', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=400' },
    { _id: '2', name: 'Court 2', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=400' },
    { _id: '3', name: 'Court 3', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=400' }
  ];

  // Fetch courts on mount
  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    async function fetchCourts() {
      try {
        const res = await fetch(`${API_BASE_URL}/courts`);
        if (res.ok) {
          const data = await res.json();
          if (data.length) {
            setCourts(data);
            setSelectedCourt(data[0]);
          } else {
            setCourts(fallbackCourts);
            setSelectedCourt(fallbackCourts[0]);
          }
        }
      } catch (err) {
        setCourts(fallbackCourts);
        setSelectedCourt(fallbackCourts[0]);
      }
    }
    fetchCourts();

    async function fetchGstRate() {
      if (!token) return;
      try {
        const sRes = await fetch(`${API_BASE_URL}/admin/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData?.tax_rate !== undefined) setGstRate(sData.tax_rate);
        }
      } catch (e) { console.error(e); }
    }
    fetchGstRate();

    async function fetchUserProfile() {
      if (!token) return;
      try {
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData);
          localStorage.setItem('cy_user', JSON.stringify(meData));
        }
      } catch (err) {
        console.error("Error refreshing user profile in bookings:", err);
      }
    }
    fetchUserProfile();

    // Default to tomorrow's date
    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const tomorrowIST = new Date(tomorrow.getTime() + (5.5 * 60 * 60 * 1000));
    const year = tomorrowIST.getUTCFullYear();
    const month = String(tomorrowIST.getUTCMonth() + 1).padStart(2, '0');
    const day = String(tomorrowIST.getUTCDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }, [token, router]);

  // Fetch availability when court or date changes
  useEffect(() => {
    if (!selectedCourt || !selectedDate) return;

    async function fetchAvailability() {
      try {
        const res = await fetch(`${API_BASE_URL}/courts/availability?courtId=${selectedCourt._id}&date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data.bookedSlots || []);
        } else {
          setBookedSlots([]);
        }
      } catch (err) {
        setBookedSlots([]);
      }
      setSelectedSlots([]); // reset selection
    }
    fetchAvailability();
  }, [selectedCourt, selectedDate]);

  // Handle slot click
  const handleSlotToggle = (hour) => {
    const { dateStr: todayStr, hour: currentHour } = getISTTime();
    const isPast = selectedDate < todayStr || (selectedDate === todayStr && hour <= currentHour);
    if (bookedSlots.includes(hour) || isPast) return; // disabled
    
    if (selectedSlots.includes(hour)) {
      setSelectedSlots(prev => prev.filter(s => s !== hour));
    } else {
      setSelectedSlots(prev => [...prev, hour].sort((a, b) => a - b));
    }
  };

  // Pricing engine calculations
  const calculatePricing = () => {
    if (!selectedCourt || !selectedSlots.length) return { subtotal: 0, discount: 0, total: 0 };
    
    let subtotal = 0;
    selectedSlots.forEach(slot => {
      // Peak Hours: 6am-9am, 5pm-10pm (slots: 6, 7, 8, 17, 18, 19, 20, 21)
      const isPeak = (slot >= 6 && slot < 9) || (slot >= 17 && slot < 22);
      subtotal += isPeak ? selectedCourt.peakPrice : selectedCourt.basePrice;
    });

    let discountPercent = 0;
    if (user) {
      if (user.membership === 'Basic') discountPercent = 0.10;
      else if (user.membership === 'Pro') discountPercent = 0.25;
      else if (user.membership === 'Elite') discountPercent = 1.00; // Free
    }

    const discount = subtotal * discountPercent;
    const total = subtotal - discount;

    return { subtotal, discount, total };
  };

  const { subtotal, discount, total } = calculatePricing();
  const netPayable = useWallet ? Math.max(0, total - (user?.walletBalance || 0)) : total;

  // Booking submit validation
  const handleInitiatePayment = () => {
    if (!user) {
      showToast('Please sign in to proceed with court bookings!', 'error');
      router.push('/auth');
      return;
    }

    if (!selectedSlots.length) {
      showToast('Please select at least one hourly play slot!', 'error');
      return;
    }

    const { total } = calculatePricing();
    const isFullWallet = useWallet && (user.walletBalance || 0) >= total;

    if (isFullWallet) {
      // Direct full-wallet checkout, no Razorpay simulation needed!
      handleCompletePayment('WALLET-FULL');
    } else {
      setShowRazorpayModal(true);
    }
  };

  // Confirm and save booking to database
  const handleCompletePayment = async (paymentId = '') => {
    setShowRazorpayModal(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courtId: selectedCourt._id,
          date: selectedDate,
          slots: selectedSlots,
          useWallet: useWallet,
          paymentId: paymentId || `MOCK-PAY-${Date.now().toString().slice(6)}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Booking reservation failed');
      }

      setBookingConfirmed(data.booking);
      showToast('Court Booking Successfully Confirmed!', 'success');

      // Refresh profile data to update wallet balances in context
      try {
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData);
          localStorage.setItem('cy_user', JSON.stringify(meData));
        }
      } catch (err) {
        console.error("Error refreshing profile after booking:", err);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper: format hour integer to 12h representation
  const formatHour = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${period}`;
  };

  const handleViewInvoice = () => {
    if (!bookingConfirmed) return;
    
    const finalAmount = bookingConfirmed.totalAmount;
    const computedSubtotal = finalAmount / (1 + gstRate / 100);
    const lineItems = [{
      description: `Court Reservation: ${selectedCourt?.name || 'Badminton Arena'} (${formatDateDMY(bookingConfirmed.date)})`,
      qty: bookingConfirmed.slots?.length || 1,
      rate: computedSubtotal / (bookingConfirmed.slots?.length || 1)
    }];
    
    setInvoiceModalData({
      invoiceNo: `INV-${bookingConfirmed._id?.slice(-6).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`,
      date: formatDateDMY(bookingConfirmed.createdAt || Date.now()),
      type: 'Court Booking',
      member: { name: user?.name, email: user?.email, membership: user?.membership || 'None' },
      items: lineItems,
      subtotal: computedSubtotal,
      discount: 0,
      taxRate: gstRate,
      total: finalAmount,
      paymentMethod: bookingConfirmed.paymentId ? 'card' : 'wallet',
      status: 'success'
    });
    setInvoiceModalOpen(true);
  };

  // Generate a mock grid of 16 active play hours (6 AM to 10 PM)
  const activeHours = Array.from({ length: 16 }, (_, i) => i + 6);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full relative">
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/5 rounded-full filter blur-[120px]" />

        {bookingConfirmed ? (
          /* ================= STEP 6: BOOKING CONFIRMED PASS CARD ================= */
          <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-neon-green/30 shadow-2xl relative overflow-hidden text-center animate-bounce-short z-10 my-10">
            <div className="absolute inset-0 bg-gradient-to-b from-neon-green/[0.01] to-transparent pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/30 flex items-center justify-center mx-auto mb-6 neon-glow">
              <CheckCircle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="text-3xl font-black text-white uppercase tracking-wider">Booking Confirmed!</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Your check-in pass has been activated</p>

            <hr className="border-white/5 my-8" />

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-2 gap-6 text-left mb-8 max-w-md mx-auto">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Court Arena</span>
                <span className="text-sm font-bold text-white mt-0.5">{selectedCourt.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Date of Play</span>
                <span className="text-sm font-bold text-neon-green mt-0.5">{formatDateDMY(bookingConfirmed.date)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Hourly Slots</span>
                <span className="text-sm font-bold text-white mt-0.5">
                  {bookingConfirmed.slots.map(s => `${s}:00`).join(', ')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Amount Settled</span>
                <span className="text-sm font-bold text-electric-blue mt-0.5">₹{bookingConfirmed.totalAmount}</span>
              </div>
            </div>

            {/* Actual Check-in Scannable QR code */}
            <div className="glass-panel p-5 rounded-2xl border-white/10 inline-flex flex-col items-center bg-white mb-6">
              <div className="bg-white p-2 rounded">
                <QRCode
                  value={bookingConfirmed.qrCodeData}
                  size={140}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <span className="text-[10px] font-black tracking-widest text-black uppercase mt-3">
                {bookingConfirmed.qrCodeData}
              </span>
            </div>

            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-8">
              Present this digital pass at the reception desk upon arrival. Ball sets and custom racket rentals are accessible.
            </p>

            <div className="flex flex-col gap-3 max-w-xs mx-auto mt-6">
              <button
                onClick={handleViewInvoice}
                className="w-full py-3 bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-neon-green/30 hover:scale-103 flex items-center justify-center gap-1.5 cursor-pointer font-bold"
              >
                <FileText className="w-4 h-4" />
                Download Invoice
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setBookingConfirmed(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Book Another
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center"
                >
                  Go Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ================= STANDARD STEP BOOKING FLOW LAYOUT ================= */
          <div className="relative z-10">
            {/* Page Header */}
            <div className="mb-10">
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-neon-green">Live Court Reservation</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white mt-1">Book a Court</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Form Parameter Panels (2/3 width) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* STEP 1: SELECT COURT */}
                <div className="glass-panel p-6 rounded-2xl border-white/5">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-neon-green" />
                    Step 1: Choose Your Court
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">All courts feature identical professional acrylic cushion surfaces, LED floodlights, and tournament-grade boundary markings.</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {courts.map((court) => {
                      const isSel = selectedCourt && selectedCourt._id === court._id;
                      return (
                        <button
                          key={court._id}
                          onClick={() => setSelectedCourt(court)}
                          className={`relative py-5 px-4 rounded-xl border font-extrabold text-sm uppercase tracking-wider transition-all duration-300 transform hover:scale-102 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            isSel 
                              ? 'border-neon-green/60 bg-neon-green/[0.06] text-neon-green neon-glow scale-102' 
                              : 'border-white/10 bg-black/40 text-gray-300 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <span className="text-lg font-black">{court.name}</span>
                          {isSel && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-neon-green rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-black stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Uniform rate badge */}
                  <div className="mt-4 flex items-center gap-2.5 text-xs bg-black/40 border border-white/5 rounded-xl px-4 py-3">
                    <Info className="w-4 h-4 text-neon-green shrink-0" />
                    <span className="text-gray-400">
                      Uniform Rate: <span className="text-white font-bold">₹{courts[0]?.basePrice || 800}/hr</span> (Off-Peak) · <span className="text-yellow-500 font-bold">₹{courts[0]?.peakPrice || 1200}/hr</span> (Peak)
                    </span>
                  </div>
                </div>

                {/* STEP 2: SELECT DATE */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CalIcon className="w-5 h-5 text-neon-green" />
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                      Step 2: Play Date
                    </h3>
                  </div>
                  <div className="relative min-w-[160px]">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getISTTime().dateStr}
                      className="bg-black/50 border border-white/10 hover:border-white/20 focus:border-neon-green/50 text-transparent rounded-xl px-4 py-3 text-sm outline-none transition-all cursor-pointer font-bold w-full"
                      style={{ color: 'transparent' }}
                    />
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white font-bold text-sm">
                      {formatDateDMY(selectedDate) || 'Select Date'}
                    </div>
                  </div>
                </div>

                {/* STEP 3: SELECT TIME SLOT GRID */}
                <div className="glass-panel p-6 rounded-2xl border-white/5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-5 h-5 text-neon-green" />
                      Step 3: Hourly Play Slots
                    </h3>
                    
                    {/* Color indicators */}
                    <div className="flex gap-4 text-[9px] uppercase font-bold tracking-wider text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-black/50 border border-white/10" />
                        Off-Peak
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-yellow-500/10 border border-yellow-500/30" />
                        Peak
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-neon-green" />
                        Selected
                      </div>
                    </div>
                  </div>

                  {/* Hours Selection Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {activeHours.map((hour) => {
                      const isBooked = bookedSlots.includes(hour);
                      const isSel = selectedSlots.includes(hour);
                      // Peak hours are early morning 6am-9am & evening 5pm-10pm
                      const isPeak = (hour >= 6 && hour < 9) || (hour >= 17 && hour < 22);
                      const { dateStr: todayStr, hour: currentHour } = getISTTime();
                      const isPast = selectedDate < todayStr || (selectedDate === todayStr && hour <= currentHour);
                      const isDisabled = isBooked || isPast;

                      return (
                        <button
                          key={hour}
                          onClick={() => handleSlotToggle(hour)}
                          disabled={isDisabled}
                          className={`py-3.5 px-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                            isBooked
                              ? 'bg-red-500/5 border-red-500/10 text-red-500/40 line-through cursor-not-allowed'
                              : isPast
                              ? 'bg-gray-500/5 border-gray-500/10 text-gray-500/30 line-through cursor-not-allowed'
                              : isSel
                              ? 'bg-neon-green text-black border-neon-green neon-glow scale-102'
                              : isPeak
                              ? 'bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:border-yellow-500/40'
                              : 'bg-black/40 hover:bg-black/60 border-white/5 text-gray-300 hover:border-white/10'
                          }`}
                        >
                          <span>{formatHour(hour)}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isSel ? 'text-black/60' : 'text-gray-500'}`}>
                            {isBooked ? 'Locked' : isPast ? 'Passed' : isPeak ? `Peak (₹${selectedCourt?.peakPrice})` : `Base (₹${selectedCourt?.basePrice})`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Legend Info */}
                  <div className="mt-6 flex items-start gap-2.5 text-xs text-gray-500 border-t border-white/5 pt-5">
                    <Info className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
                    <span>
                      Peak hours utilize automated stadium LED lights. Early mornings and high-demand evening slots attract peak rates.
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Booking Sidebar Summary Panel (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="glass-panel p-6 rounded-2xl border-white/5 sticky top-28 shadow-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-neon-green" />
                      Summary Invoice
                    </h3>

                    {/* Active Court details */}
                    {selectedCourt && (
                      <div className="flex items-center gap-3 mb-6 bg-black/40 border border-white/5 p-3.5 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                          <Award className="w-5 h-5 text-neon-green" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Selected Court</span>
                          <span className="text-sm font-bold text-white mt-0.5">{selectedCourt.name}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 text-sm mb-6 border-b border-white/5 pb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Target Date</span>
                        <span className="text-white font-semibold">{formatDateDMY(selectedDate) || 'Select...'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Session Slots</span>
                        <span className="text-white font-semibold text-right max-w-[160px] truncate">
                          {selectedSlots.length 
                            ? selectedSlots.map(s => `${s}:00`).join(', ') 
                            : 'None Selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Membership</span>
                        <span className="text-neon-green font-bold uppercase tracking-wider text-xs">
                          {user ? `${user.membership} Member` : 'Guest Play'}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Breakout */}
                    <div className="space-y-3.5 text-sm mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Play Subtotal</span>
                        <span className="text-white font-bold">₹{subtotal}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-neon-green font-bold text-xs uppercase tracking-wider">
                          <span>{user?.membership} Club Discount</span>
                          <span>-₹{discount}</span>
                        </div>
                      )}

                      <hr className="border-white/5" />

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-white font-extrabold uppercase tracking-wide">Final Amount</span>
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-white">
                          ₹{total}
                        </span>
                      </div>
                    </div>

                    {/* Wallet Split checkout options */}
                    {user && (
                      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="use-wallet-checkbox"
                            checked={useWallet}
                            disabled={(user.walletBalance || 0) <= 0}
                            onChange={(e) => setUseWallet(e.target.checked)}
                            className="w-4 h-4 rounded text-neon-green bg-black border-white/20 focus:ring-neon-green disabled:opacity-50"
                          />
                          <label 
                            htmlFor="use-wallet-checkbox" 
                            className={`text-xs font-bold uppercase cursor-pointer select-none ${(user.walletBalance || 0) <= 0 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300'}`}
                          >
                            {(user.walletBalance || 0) <= 0 
                              ? `Pay portion with Club Wallet (Available balance: ₹0 - top up in your Member Area to use)`
                              : `Pay portion with Club Wallet (Available: ₹${user.walletBalance})`
                            }
                          </label>
                        </div>
                        {useWallet && (user.walletBalance || 0) > 0 && (
                          <div className="text-xs text-gray-400 mt-2 pl-7 space-y-1">
                            <div className="flex justify-between">
                              <span>Wallet Deduction:</span>
                              <span className="text-neon-green font-bold">-₹{Math.min(user.walletBalance, total)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-white border-t border-white/5 pt-1 mt-1">
                              <span>Net Payable Online:</span>
                              <span>₹{Math.max(0, total - user.walletBalance)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Payment checkout CTA */}
                  <div>
                    <button
                      onClick={handleInitiatePayment}
                      disabled={loading || !selectedSlots.length}
                      className="w-full py-4 bg-neon-green text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-neon-green/30 hover:scale-102 active:scale-98 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 flex items-center justify-center gap-2 group neon-glow cursor-pointer"
                    >
                      {loading ? 'Confirming...' : 'Pay & Confirm Online'}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
                      Razorpay secure transaction gates
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* ================= RAZORPAY GATEWAY SIMULATION POPUP ================= */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="max-w-md w-full bg-[#111116] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            
            {/* Header branding */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs">R</div>
                <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-gray-400">Razorpay Checkout</span>
              </div>
              <button
                onClick={() => setShowRazorpayModal(false)}
                className="text-gray-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Invoicing summary */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl mb-6">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Payable Amount</span>
              <span className="text-3xl font-black text-white">₹{netPayable}</span>
              <span className="text-xs text-gray-400 block mt-1">To: The Courtyard Sports Club House</span>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-xs text-gray-400 leading-relaxed">
                This is a fully integrated local transaction simulator. Completing this simulation registers a confirmed active play lock on your Atlas database.
              </p>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-400 text-xs">
                <Info className="w-5 h-5 shrink-0" />
                <span>Simulated Order ID: order_cy_{Date.now().toString().slice(6)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowRazorpayModal(false)}
                className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompletePayment(`pay_rzp_${Date.now().toString().slice(5)}`)}
                className="flex-1 py-3.5 bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Simulate Success
              </button>
            </div>

          </div>
        </div>
      )}

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setInvoiceModalData(null);
        }}
        invoiceData={invoiceModalData}
      />
      <Footer />
      <BottomNav />
    </div>
  );
}
