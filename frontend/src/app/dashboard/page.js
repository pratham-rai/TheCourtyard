// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\dashboard/page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Award, Calendar, Clock, CreditCard, Shield, User, HelpCircle, Bell, ArrowUpRight, LogOut, Ticket, RefreshCw, XCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import QRCode from 'react-qr-code';
import InvoiceModal from '@/components/InvoiceModal';

const getSessionCount = (durationStr) => {
  if (!durationStr) return 10;
  const match = durationStr.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (durationStr.toLowerCase().includes('month')) {
      return num * 8; // e.g. 2 Months => 16 sessions (twice a week)
    }
    return num; // e.g. 10 Days => 10 sessions
  }
  return 10;
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

export default function Dashboard() {
  const router = useRouter();
  const { user, setUser, token, loading: appLoading, API_BASE_URL, buyMembership, logout, showToast, createPassword } = useApp();

  const [activeTab, setActiveTab] = useState('courts'); // courts, coaching, past, ledger
  const [bookings, setBookings] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [ledgerData, setLedgerData] = useState({ payments: [], transactions: [] });

  // Create Password states for Google users
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleCreatePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long!', 'error');
      return;
    }
    setPwdLoading(true);
    const result = await createPassword(newPassword);
    setPwdLoading(false);
    if (result && result.success) {
      setNewPassword('');
    }
  };

  // Profile balances and settlements state
  const [profileUser, setProfileUser] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileUser(user);
    }
  }, [user]);

  const handleTopUpWallet = async (e) => {
    e.preventDefault();
    if (!topupAmount || Number(topupAmount) <= 0) {
      showToast('Please enter a valid positive topup amount!', 'error');
      return;
    }
    setTopupLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(topupAmount) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Top-up failed');
      
      showToast(`Successfully topped up ₹${topupAmount} in your club wallet!`, 'success');
      setTopupAmount('');
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleSettleTab = async (method) => {
    if (!profileUser || profileUser.tabBalance <= 0) return;
    
    if (method === 'wallet') {
      if ((profileUser.walletBalance || 0) < profileUser.tabBalance) {
        showToast('Insufficient wallet balance to pay tab! Please top up your wallet first.', 'error');
        return;
      }
      if (!window.confirm(`Confirm settling your tab balance of ₹${profileUser.tabBalance} using your club wallet funds?`)) return;
    } else {
      if (!window.confirm(`Initiate mock Razorpay payment of ₹${profileUser.tabBalance} to settle your outstanding tab?`)) return;
    }
    
    setSettleLoading(true);
    try {
      const payload = method === 'wallet' 
        ? { amount: profileUser.tabBalance, useWallet: true }
        : { amount: profileUser.tabBalance, paymentMethod: 'card' };
        
      const res = await fetch(`${API_BASE_URL}/users/settle-tab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Settle tab failed');
      
      showToast(data.message || 'Tab balance successfully settled!', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSettleLoading(false);
    }
  };
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null); // dynamic pass print modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalData, setInvoiceModalData] = useState(null);
  const [gstRate, setGstRate] = useState(18);

  async function fetchDashboardData() {
    if (!token) return;
    setLoading(true);
    try {
      // 0. Fetch latest user details (balances, membership, etc.)
      try {
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setProfileUser(meData);
          setUser(meData);
          localStorage.setItem('cy_user', JSON.stringify(meData));
        }
      } catch (err) {
        console.error("Error fetching latest profile details:", err);
      }

      // 1. Fetch court bookings
      const bookingsRes = await fetch(`${API_BASE_URL}/bookings/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }

      // 2. Fetch active course enrollments
      const coachingRes = await fetch(`${API_BASE_URL}/coaching/my-enrollments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coachingRes.ok) {
        const data = await coachingRes.json();
        setEnrollments(data);
      }

      // 2.5 Fetch ledger & billing transactions
      try {
        const ledgerRes = await fetch(`${API_BASE_URL}/payments/my-ledger`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ledgerRes.ok) {
          const data = await ledgerRes.json();
          setLedgerData(data);
        }
      } catch (err) {
        console.error("Error fetching ledger data:", err);
      }

      // 3. Fetch notifications
      const notifRes = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data);
      }

      // 4. Fetch GST/Tax Rate settings
      try {
        const settingsRes = await fetch(`${API_BASE_URL}/admin/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData && settingsData.tax_rate !== undefined) {
            setGstRate(settingsData.tax_rate);
          }
        }
      } catch (err) {
        console.error("Error fetching GST rate settings:", err);
      }
    } catch (err) {
      showToast('Offline mode active. Using local cached parameters.', 'info');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (appLoading) return;

    if (!token) {
      router.push('/auth');
    } else if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      fetchDashboardData();
    }
  }, [token, appLoading, router]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this court reservation? Full refund will be credited.')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/cancel/${bookingId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel court booking');
      }

      showToast('Booking Cancelled. Refunding and releasing slots in real-time!', 'success');
      fetchDashboardData(); // reload
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpgrade = async (tier) => {
    const pricing = { 'Basic': 999, 'Pro': 1999, 'Elite': 4999 };
    if (!window.confirm(`Initiate purchase for ${tier} Membership at ₹${pricing[tier]}/month?`)) return;
    
    const result = await buyMembership(tier);
    if (result && result.success) {
      fetchDashboardData();
    }
  };

  const handleViewInvoice = (item, invoiceType) => {
    if (invoiceType === 'Wallet Top-Up') {
      const finalAmount = item.amount;
      setInvoiceModalData({
        invoiceNo: `INV-${item.id?.slice(-6).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`,
        date: formatDateDMY(item.date),
        type: 'Wallet Top-Up',
        member: { name: user?.name, email: user?.email, membership: user?.membership || 'None' },
        items: [{ description: 'Prepaid Wallet Load / Club top-up', qty: 1, rate: finalAmount }],
        subtotal: finalAmount,
        discount: 0,
        taxRate: 0, // 0% tax for top-ups to avoid double-taxation!
        total: finalAmount,
        paymentMethod: item.paymentMethod || 'card',
        status: 'success'
      });
      setInvoiceModalOpen(true);
      return;
    }

    const isCoaching = invoiceType === 'Coaching Program';
    const finalAmount = isCoaching ? item.amountPaid : item.totalAmount;
    const computedSubtotal = finalAmount / (1 + gstRate / 100);
    const lineItems = isCoaching 
      ? [{ description: `Academy Course: ${item.course?.title || 'Coaching Program'}`, qty: 1, rate: computedSubtotal }]
      : [{ description: `Court Reservation: ${item.court?.name || 'Badminton Arena'} (${formatDateDMY(item.date)})`, qty: item.slots?.length || 1, rate: computedSubtotal / (item.slots?.length || 1) }];
    
    setInvoiceModalData({
      invoiceNo: `INV-${item._id?.slice(-6).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`,
      date: formatDateDMY(isCoaching ? item.enrolledAt : item.createdAt || Date.now()),
      type: invoiceType,
      member: { name: user?.name, email: user?.email, membership: user?.membership || 'None' },
      items: lineItems,
      subtotal: computedSubtotal,
      discount: 0,
      taxRate: gstRate,
      total: finalAmount,
      paymentMethod: (item.paymentId || '').includes('wallet') || (item.paymentId === '') ? 'wallet' : 'card',
      status: 'success'
    });
    setInvoiceModalOpen(true);
  };

  // Filter active and past bookings
  const isPastBooking = (booking) => {
    if (booking.status === 'cancelled') return true;
    if (!booking.date) return false;
    // Slots are integers representing hours, e.g. 15 for 15:00-16:00
    const maxSlot = Math.max(...(booking.slots || [12]));
    const endTime = new Date(`${booking.date}T${String(maxSlot).padStart(2, '0')}:00:00`);
    return endTime < new Date();
  };

  const activeBookings = bookings.filter(b => !isPastBooking(b));
  const pastBookings = bookings.filter(b => isPastBooking(b));

  const isPastCourse = (enrollment) => {
    if (enrollment.status === 'completed' || enrollment.status === 'cancelled') return true;
    if (enrollment.course && enrollment.course.endDate) {
      return new Date(enrollment.course.endDate) < new Date();
    }
    return false;
  };

  const activeEnrollments = enrollments.filter(e => !isPastCourse(e));
  const pastEnrollments = enrollments.filter(e => isPastCourse(e));

  // Compute a unified combined payments and transactions ledger list
  const getCombinedLedger = () => {
    const list = [];
    
    // Add Payment records (online bookings, memberships, coaching)
    if (ledgerData && ledgerData.payments) {
      ledgerData.payments.forEach(p => {
        // Use stored paymentMethod if available, else infer from razorpayPaymentId
        let method = p.paymentMethod || 'online';
        if (method === 'online') {
          const pid = (p.razorpayPaymentId || '').toLowerCase();
          if (pid.includes('wallet')) method = 'wallet';
          else if (pid.includes('cash')) method = 'cash';
          else if (pid.includes('split')) method = 'split';
          else if (pid.includes('tab')) method = 'tab';
        }
        list.push({
          id: p._id,
          date: new Date(p.createdAt),
          description: p.type === 'Membership' && p.referenceId ? 'Prepaid Wallet Top-Up' : `${p.type} Fee`,
          amount: p.amount,
          paymentMethod: method,
          status: p.status,
          raw: p,
          itemType: p.type === 'Membership' && p.referenceId ? 'Wallet Top-Up' : p.type
        });
      });
    }

    // Add all wallet transactions (topups, spot billing, court bookings, coaching, refunds)
    if (ledgerData && ledgerData.transactions) {
      ledgerData.transactions.forEach(t => {
        if (t.type === 'topup') {
          // Avoid duplicate if there's already a Payment record for this topup
          const exists = list.some(item => item.raw?.referenceId?.toString() === t._id?.toString() || item.id === t._id);
          if (!exists) {
            list.push({
              id: t._id,
              date: new Date(t.createdAt),
              description: t.description || 'Prepaid Wallet Top-Up',
              amount: t.amount,
              paymentMethod: t.paymentMethod || 'cash',
              status: 'success',
              raw: t,
              itemType: 'Wallet Top-Up'
            });
          }
        } else if (t.type === 'refund') {
          list.push({
            id: t._id,
            date: new Date(t.createdAt),
            description: t.description || 'Refund / Credit',
            amount: t.amount,
            paymentMethod: t.paymentMethod || 'wallet',
            status: 'success',
            raw: t,
            itemType: 'Refund'
          });
        } else {
          // spot_billing, court_booking, coaching_enrollment — all debit types
          // Use the actual paymentMethod stored on the wallet transaction
          list.push({
            id: t._id,
            date: new Date(t.createdAt),
            description: t.description || 'Club Charge',
            amount: Math.abs(t.amount),
            paymentMethod: t.paymentMethod || 'wallet',
            status: 'success',
            raw: t,
            itemType: t.amount < 0 ? 'Debit' : 'Credit'
          });
        }
      });
    }

    return list.sort((a, b) => b.date - a.date);
  };

  const ledgerList = getCombinedLedger();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-green/[0.01] to-transparent pointer-events-none" />

        {user && (
          <div className="relative z-10">
            
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neon-green/10 text-neon-green flex items-center justify-center font-extrabold text-lg border border-neon-green/20">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">Club Member Area</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Welcome home, {user.name} ({user.email})</p>
                </div>
              </div>

              <div className="flex gap-3">
                {user.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-5 py-2.5 rounded-xl border border-electric-blue/40 text-electric-blue text-xs font-bold uppercase tracking-wider hover:bg-electric-blue/5 transition-all"
                  >
                    Admin Analytics
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Profile Tiers & Alerts (1/3 width) */}
              <div className="lg:col-span-1 space-y-8">
                
                {/* Membership Status card */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 relative overflow-hidden bg-gradient-to-br from-neon-green/[0.02] to-transparent">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Active Pass Tier</span>
                    <span className="px-2 py-0.5 bg-neon-green text-black text-[9px] font-black uppercase tracking-wider rounded">
                      Live
                    </span>
                  </div>

                  <h3 className="text-3xl font-black text-white mt-1 uppercase tracking-wider">
                    {user.membership === 'None' ? 'Guest Player' : `${user.membership} Tier`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    {user.membership === 'Elite' 
                      ? 'Enjoy 100% free off-peak court bookings, 20% training discounts, and tournament passes.'
                      : user.membership === 'Pro'
                      ? 'Enjoy 25% discount on courts, 10% on coaching, and 7-day priority pre-bookings.'
                      : user.membership === 'Basic'
                      ? 'Enjoy 10% court booking discounts and weekend recreational passes.'
                      : 'Play standard base rates. Upgrade below to enjoy sports luxury perks.'}
                  </p>

                  <hr className="border-white/5 my-5" />

                  {/* Membership upgrade toggles */}
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-3">Upgrade Membership Tier</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Basic', 'Pro', 'Elite'].map((tier) => {
                        const isCurrent = user.membership === tier;
                        return (
                          <button
                            key={tier}
                            onClick={() => handleUpgrade(tier)}
                            disabled={isCurrent}
                            className={`py-2 text-[9px] rounded-lg border font-black uppercase tracking-widest transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-neon-green/10 border-neon-green/30 text-neon-green font-extrabold cursor-not-allowed'
                                : 'bg-black/40 hover:bg-black/60 border-white/5 text-gray-300'
                            }`}
                          >
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* My Wallet & Account Balances Card */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-6 bg-gradient-to-br from-electric-blue/[0.01] to-transparent">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Club Account Balances</span>
                    <h3 className="text-lg font-black text-white mt-1 uppercase tracking-wider">My Wallets & Tabs</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block">Prepaid Wallet</span>
                      <span className="text-xl font-mono font-black text-neon-green mt-1 block">₹{profileUser?.walletBalance || 0}</span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block">Active Postpaid Tab</span>
                      <span className="text-xl font-mono font-black text-yellow-400 mt-1 block">₹{profileUser?.tabBalance || 0}</span>
                    </div>
                  </div>

                  {/* ACTIVE TAB SETTLEMENT SECTION */}
                  {profileUser?.tabBalance > 0 && (
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div>
                        <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-wide block">Outstanding Tab Balance: ₹{profileUser.tabBalance}</span>
                        <p className="text-[9px] text-gray-500 mt-0.5">Pay off your postpaid tab online using your wallet or mock Razorpay payment.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={settleLoading}
                          onClick={() => handleSettleTab('wallet')}
                          className="py-2.5 rounded-xl bg-neon-green/10 hover:bg-neon-green/20 text-neon-green border border-neon-green/20 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                        >
                          Settle via Wallet
                        </button>
                        <button
                          type="button"
                          disabled={settleLoading}
                          onClick={() => handleSettleTab('card')}
                          className="py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                        >
                          Pay via Razorpay
                        </button>
                      </div>
                    </div>
                  )}

                  {/* WALLET TOP-UP FORM */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block">Top Up Club Wallet Online</span>
                    
                    <form onSubmit={handleTopUpWallet} className="space-y-3">
                      <div className="flex gap-2">
                        {['200', '500', '1000'].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setTopupAmount(preset)}
                            className="flex-1 bg-black/40 border border-white/10 hover:border-white/20 text-white rounded-lg py-1.5 text-[9px] font-black uppercase tracking-wider"
                          >
                            +₹{preset}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <span className="text-xs font-bold text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2">₹</span>
                        <input
                          type="number"
                          placeholder="Enter topup amount..."
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 pl-8 pr-4 text-xs text-white outline-none"
                          required
                          min={1}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={topupLoading}
                        className="w-full py-3 rounded-xl bg-electric-blue hover:bg-electric-blue/90 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 transition-all duration-300"
                      >
                        {topupLoading ? 'Processing...' : 'Top Up Wallet (Razorpay)'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Create Password Panel for Google Users without custom passwords */}
                {user?.isGoogleUser && !user?.hasCreatedPassword && (
                  <div className="glass-panel p-6 rounded-2xl border-white/5 bg-gradient-to-br from-electric-blue/[0.02] to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-electric-blue/5 filter blur-2xl" />
                    
                    <span className="text-[10px] text-electric-blue uppercase tracking-widest font-bold block mb-1">Account Security</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-electric-blue" />
                      Create Account Password
                    </h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Unlock standard credential login for this email address. You can still use Google Login anytime.
                    </p>

                    <form onSubmit={handleCreatePasswordSubmit} className="space-y-4">
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                        <input
                          type={showPwd ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Create secure password"
                          className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-electric-blue/50 focus:neon-glow rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={pwdLoading}
                        className="w-full py-3.5 rounded-xl bg-electric-blue hover:bg-electric-blue/80 text-white font-extrabold text-xs uppercase tracking-wider hover:scale-102 transition-all duration-300 shadow-lg shadow-electric-blue/20"
                      >
                        {pwdLoading ? 'Saving...' : 'Set Password'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Notifications & Promotions Drawer */}
                <div className="glass-panel p-6 rounded-2xl border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-neon-green" />
                    Club Announcements
                  </h3>
                  {loading ? (
                    <span className="text-xs text-gray-500 font-bold">Syncing alerts...</span>
                  ) : notifications.length ? (
                    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                      {notifications.map((notif) => (
                        <div key={notif._id} className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                          <h4 className="text-xs font-bold text-white flex justify-between items-center">
                            {notif.title}
                            <span className="text-[8px] font-normal text-gray-500">{formatDateDMY(notif.createdAt)}</span>
                          </h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 font-bold">No active global notifications.</span>
                  )}
                </div>

              </div>

              {/* Right Column: Tab drawers (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Navigation Tabs */}
                <div className="flex flex-wrap bg-black/40 border border-white/5 rounded-2xl p-1 gap-1 w-full">
                  <button
                    onClick={() => setActiveTab('courts')}
                    className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeTab === 'courts'
                        ? 'bg-white/5 border border-white/10 text-neon-green font-extrabold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Active Courts ({activeBookings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('coaching')}
                    className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeTab === 'coaching'
                        ? 'bg-white/5 border border-white/10 text-electric-blue font-extrabold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Active Academy ({activeEnrollments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeTab === 'past'
                        ? 'bg-white/5 border border-white/10 text-white font-extrabold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Past Reserves ({pastBookings.length + pastEnrollments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeTab === 'ledger'
                        ? 'bg-white/5 border border-white/10 text-neon-green font-extrabold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Billing Ledger ({ledgerList.length})
                  </button>
                </div>

                {/* Tab content displays */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="glass-panel p-12 rounded-2xl text-center text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-neon-green" />
                      Warming database connection...
                    </div>
                  ) : activeTab === 'courts' ? (
                    /* Active/Upcoming Courts reserving list */
                    activeBookings.length ? (
                      activeBookings.map((booking) => (
                        <div key={booking._id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-5">
                          <div className="flex gap-4">
                            <img src={booking.court?.image || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=200'} alt={booking.court?.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                            <div className="flex flex-col justify-center">
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Booking Date: {formatDateDMY(booking.date)}</span>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-white uppercase tracking-wide">{booking.court?.name || 'Center Court'}</h4>
                                {booking.checkedIn && (
                                  <span className="px-1.5 py-0.5 bg-neon-green/20 border border-neon-green/40 text-neon-green text-[8px] font-black uppercase rounded flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Verified Entry
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                <Clock className="w-3.5 h-3.5 text-neon-green" />
                                {booking.slots.map(s => `${s}:00`).join(', ')}
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            <span className="text-base font-extrabold text-neon-green">₹{booking.totalAmount}</span>
                            
                            <div className="flex gap-2">
                              {booking.status === 'confirmed' ? (
                                <>
                                  <button
                                    onClick={() => handleViewInvoice(booking, 'Court Booking')}
                                    className="px-3.5 py-2 bg-white/5 border border-white/10 hover:border-neon-green/30 text-white hover:text-neon-green text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                  >
                                    Invoice
                                  </button>
                                  <button
                                    onClick={() => setSelectedTicket(booking)}
                                    className="px-3.5 py-2 bg-white/5 border border-white/10 hover:border-neon-green/30 text-white hover:text-neon-green text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                  >
                                    Pass
                                  </button>
                                  <button
                                    onClick={() => handleCancelBooking(booking._id)}
                                    className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
                                    title="Cancel Session"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase rounded">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="glass-panel p-12 rounded-2xl border-white/5 text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
                        No active court reservations. Select "Book Courts" to lock a slot.
                      </div>
                    )
                  ) : activeTab === 'coaching' ? (
                    /* Active academy training list */
                    activeEnrollments.length ? (
                      activeEnrollments.map((enrollment) => {
                        const course = enrollment.course;
                        if (!course) return null;
                        const totalSessions = getSessionCount(course.duration);
                        const attendedSessions = enrollment.attendance ? enrollment.attendance.length : 0;
                        const percentAttended = Math.min(Math.round((attendedSessions / totalSessions) * 100), 100);

                        return (
                          <div key={enrollment._id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-5">
                            <div className="flex flex-1 gap-4">
                              <img src={course.image || 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=200'} alt={course.title} className="w-16 h-16 rounded-xl object-cover bg-sport-dark shrink-0" />
                              <div className="flex-1 flex flex-col justify-center">
                                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Enrolled: {formatDateDMY(enrollment.enrolledAt)}</span>
                                <h4 className="text-base font-bold text-white uppercase tracking-wide">{course.title}</h4>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 items-center mt-1 text-xs text-gray-400">
                                  <span className="text-electric-blue font-bold uppercase">Coach {course.coach?.name || 'Unassigned'}</span>
                                  <span className="text-[10px] text-gray-500">•</span>
                                  <span>{course.schedule}</span>
                                </div>
                                
                                {/* Visual Attendance Tracker */}
                                <div className="mt-3.5 max-w-md">
                                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 mb-1">
                                    <span>Attendance Tracker</span>
                                    <span className="text-electric-blue">{attendedSessions}/{totalSessions} Sessions</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-electric-blue to-neon-green transition-all duration-500" 
                                      style={{ width: `${percentAttended}%` }} 
                                    />
                                  </div>
                                </div>

                                {/* Student Attendance Biodata Dates */}
                                {enrollment.attendance && enrollment.attendance.length > 0 ? (
                                  <div className="mt-4 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                                    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block mb-2">Check-in Biodata Logs</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {enrollment.attendance.map((dateStr) => (
                                        <span key={dateStr} className="px-2.5 py-0.5 bg-electric-blue/10 border border-electric-blue/20 text-electric-blue text-[9px] font-bold uppercase rounded font-mono">
                                          {formatDateDMY(dateStr)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                                    No check-in dates logged yet. Verified by coach at entry.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 shrink-0">
                              <div className="text-left md:text-right">
                                <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold block">Tuition Paid</span>
                                <span className="text-base font-extrabold text-neon-green">₹{enrollment.amountPaid}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewInvoice(enrollment, 'Coaching Program')}
                                  className="px-4 py-2 bg-white/5 border border-white/10 hover:border-electric-blue/30 text-white hover:text-electric-blue text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                >
                                  Invoice
                                </button>
                                <button
                                  onClick={() => setSelectedTicket(enrollment)}
                                  className="px-4 py-2 bg-white/5 border border-white/10 hover:border-electric-blue/30 text-white hover:text-electric-blue text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                >
                                  Pass
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="glass-panel p-12 rounded-2xl border-white/5 text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
                        No active coaching enrollments. Join Academy courses under "Coaching"!
                      </div>
                    )
                  ) : activeTab === 'past' ? (
                    /* Past Reserves (Finished Court Bookings & Completed courses) */
                    (pastBookings.length || pastEnrollments.length) ? (
                      <div className="space-y-4">
                        {pastBookings.map((booking) => (
                          <div key={booking._id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-5 opacity-60 hover:opacity-100 transition-all">
                            <div className="flex gap-4">
                              <img src={booking.court?.image || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=200'} alt={booking.court?.name} className="w-16 h-16 rounded-xl object-cover shrink-0 grayscale" />
                              <div className="flex flex-col justify-center">
                                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Booking Date: {formatDateDMY(booking.date)} (Completed)</span>
                                <h4 className="text-base font-bold text-white uppercase tracking-wide">{booking.court?.name || 'Center Court'}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                                  {booking.slots.map(s => `${s}:00`).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                              <span className="text-base font-extrabold text-gray-400">₹{booking.totalAmount}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewInvoice(booking, 'Court Booking')}
                                  className="px-3.5 py-2 bg-white/5 border border-white/10 hover:border-neon-green/30 text-white hover:text-neon-green text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                >
                                  Invoice
                                </button>
                                <span className="px-3 py-2 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase rounded">
                                  Finished
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {pastEnrollments.map((enrollment) => {
                          const course = enrollment.course;
                          if (!course) return null;
                          return (
                            <div key={enrollment._id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-5 opacity-60 hover:opacity-100 transition-all">
                              <div className="flex flex-1 gap-4">
                                <img src={course.image || 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=200'} alt={course.title} className="w-16 h-16 rounded-xl object-cover bg-sport-dark shrink-0 grayscale" />
                                <div className="flex-1 flex flex-col justify-center">
                                  <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Academy course (Completed)</span>
                                  <h4 className="text-base font-bold text-white uppercase tracking-wide">{course.title}</h4>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-center mt-1 text-xs text-gray-500">
                                    <span className="text-gray-400 font-bold uppercase">Coach {course.coach?.name || 'Unassigned'}</span>
                                    <span className="text-[10px] text-gray-600">•</span>
                                    <span>{course.schedule}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 shrink-0">
                                <div className="text-left md:text-right">
                                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold block">Tuition Paid</span>
                                  <span className="text-base font-extrabold text-gray-400">₹{enrollment.amountPaid}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewInvoice(enrollment, 'Coaching Program')}
                                    className="px-4 py-2 bg-white/5 border border-white/10 hover:border-electric-blue/30 text-white hover:text-electric-blue text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                  >
                                    Invoice
                                  </button>
                                  <span className="px-3 py-2 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase rounded">
                                    {enrollment.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="glass-panel p-12 rounded-2xl border-white/5 text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
                        No past reservations or completed logs found.
                      </div>
                    )
                  ) : (
                    /* Billing Ledger & Invoices tab */
                    ledgerList.length ? (
                      <div className="glass-panel rounded-2xl border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                                <th className="py-4 px-5">Date</th>
                                <th className="py-4 px-5">Transaction description</th>
                                <th className="py-4 px-5">Channel</th>
                                <th className="py-4 px-5 text-right">Amount</th>
                                <th className="py-4 px-5 text-center">Receipt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ledgerList.map((item, idx) => {
                                const isDebit = item.amount < 0 || item.itemType === 'Wallet Debit' || item.itemType === 'Debit' || item.description.toLowerCase().includes('spent');
                                return (
                                  <tr key={idx} className="border-b border-white/5 text-white hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-5 font-mono text-gray-400">{formatDateDMY(item.date)}</td>
                                    <td className="py-4 px-5 font-bold">
                                      {item.description}
                                      {item.itemType === 'Wallet Top-Up' && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-neon-green/10 border border-neon-green/20 text-neon-green text-[8px] font-black uppercase rounded">
                                          Topup
                                        </span>
                                      )}
                                      {isDebit && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-[8px] font-black uppercase rounded">
                                          Deducted
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-4 px-5 uppercase font-semibold text-[10px]">
                                       {(() => {
                                         const m = item.paymentMethod;
                                         if (m === 'wallet') return <span className="text-neon-green">Wallet Balance</span>;
                                         if (m === 'cash') return <span className="text-yellow-400">Cash POS</span>;
                                         if (m === 'card') return <span className="text-electric-blue">Card POS</span>;
                                         if (m === 'tab') return <span className="text-orange-400">Profile Tab</span>;
                                         if (m === 'split') return <span className="text-purple-400">Split (Wallet+Cash)</span>;
                                         return <span className="text-electric-blue">Online / Razorpay</span>;
                                       })()}
                                    </td>
                                    <td className={`py-4 px-5 text-right font-mono font-black ${isDebit ? 'text-gray-400' : 'text-neon-green'}`}>
                                      {isDebit ? `-₹${item.amount}` : `+₹${item.amount}`}
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                      {item.itemType !== 'Wallet Debit' ? (
                                        <button
                                          onClick={() => handleViewInvoice(item.raw, item.itemType)}
                                          className="p-1.5 bg-white/5 border border-white/10 hover:border-neon-green/30 text-gray-400 hover:text-neon-green rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold"
                                        >
                                          Invoice
                                        </button>
                                      ) : (
                                        <span className="text-gray-500 font-mono">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-panel p-12 rounded-2xl border-white/5 text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
                        No transaction or ledger logs found.
                      </div>
                    )
                  )}
                </div>

              </div>

            </div>
          </div>
        )}
      </section>

      {/* ================= PORTABLE TICKET PRINT MODAL ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#111116] border border-white/10 rounded-3xl shadow-2xl p-6 relative overflow-hidden text-center">
            
            <div className="w-12 h-12 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/30 flex items-center justify-center mx-auto mb-4 neon-glow">
              <Ticket className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-wider">Print check-in pass</h3>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest font-semibold">The Courtyard check-in voucher</p>

            <hr className="border-white/5 my-6" />

            <div className="grid grid-cols-2 gap-4 text-left mb-6 text-xs max-w-sm mx-auto">
              {selectedTicket.course ? (
                <>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Coaching Program</span>
                    <p className="font-bold text-white mt-0.5">{selectedTicket.course.title}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Assigned Coach</span>
                    <p className="font-bold text-neon-green mt-0.5">{selectedTicket.course.coach?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Duration</span>
                    <p className="font-bold text-white mt-0.5">{selectedTicket.course.duration}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Schedule</span>
                    <p className="font-bold text-electric-blue mt-0.5">{selectedTicket.course.schedule}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Arena Court</span>
                    <p className="font-bold text-white mt-0.5">{selectedTicket.court?.name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Session Date</span>
                    <p className="font-bold text-neon-green mt-0.5">{formatDateDMY(selectedTicket.date)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Hourly Slots</span>
                    <p className="font-bold text-white mt-0.5">{selectedTicket.slots.map(s => `${s}:00`).join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Secure ID</span>
                    <p className="font-bold text-electric-blue mt-0.5">{selectedTicket.paymentId.slice(0, 16)}</p>
                  </div>
                </>
              )}
            </div>

            {/* Actual scannable QR Code */}
            <div className="glass-panel p-4 rounded-xl border-white/10 inline-flex flex-col items-center bg-white mb-6">
              <div className="bg-white p-2 rounded">
                <QRCode
                  value={selectedTicket.qrCodeData}
                  size={140}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <span className="text-[8px] font-black text-black uppercase mt-2">{selectedTicket.qrCodeData}</span>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-extrabold text-xs uppercase tracking-wider transition-all"
            >
              Close Pass
            </button>

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
