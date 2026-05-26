// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\admin/page.js
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Shield, BarChart3, Users, Calendar, AlertTriangle, Send, RefreshCw, Layers, DollarSign, Clock, HelpCircle, Lock, ScanLine, CheckCircle, XCircle, Camera, Search, Award, Settings, PlusCircle, Download, Filter, Package, ShoppingBag, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import InvoiceModal from '@/components/InvoiceModal';

const getSessionCount = (duration) => {
  if (!duration) return 10;
  const durStr = duration.toLowerCase();
  
  const daysMatch = durStr.match(/(\d+)\s*(days?|sessions?|classes?)/);
  if (daysMatch) return parseInt(daysMatch[1], 10);
  
  const monthsMatch = durStr.match(/(\d+)\s*(months?|mths?)/);
  if (monthsMatch) return parseInt(monthsMatch[1], 10) * 8; // standard 2 classes/week
  
  const weeksMatch = durStr.match(/(\d+)\s*(weeks?|wks?)/);
  if (weeksMatch) return parseInt(weeksMatch[1], 10) * 2;
  
  const numMatch = durStr.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  
  return 10;
};



export default function Admin() {
  const router = useRouter();
  const { user, token, API_BASE_URL, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, bookings, coaching, scanner, block, promo, users, settings
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [coachingList, setCoachingList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [courtsList, setCourtsList] = useState([]);
  const [coachesList, setCoachesList] = useState([]);
  const [tournamentsList, setTournamentsList] = useState([]);

  // Enrollments CRUD State
  const [enrollmentsList, setEnrollmentsList] = useState([]);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    id: '',
    userId: '',
    courseId: '',
    amountPaid: '',
    status: 'active',
    attendance: []
  });
  const [selectedBookingForQr, setSelectedBookingForQr] = useState(null);
  const [selectedEnrollmentForQr, setSelectedEnrollmentForQr] = useState(null);

  // Custom states for attendance logging, past bookings, and split POS
  const [bookingSubTab, setBookingSubTab] = useState('active'); // active, past
  const [selectedEnrollmentForAttendance, setSelectedEnrollmentForAttendance] = useState(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceDatePicker, setAttendanceDatePicker] = useState(new Date().toISOString().split('T')[0]);
  const [posUseWallet, setPosUseWallet] = useState(false);
  const [spotGuestEmail, setSpotGuestEmail] = useState('');

  // Sub-tabs
  const [coachingSubTab, setCoachingSubTab] = useState('courses'); // courses, logs, coaches
  const [courtSubTab, setCourtSubTab] = useState('pricing'); // pricing, manage

  // Coaching Course Modals/Editor
  const [isCoachingCourseModalOpen, setIsCoachingCourseModalOpen] = useState(false);
  const [coachingCourseForm, setCoachingCourseForm] = useState({
    id: '',
    title: '',
    description: '',
    duration: '',
    startDate: '',
    endDate: '',
    price: '',
    slotsTotal: '',
    coach: '',
    schedule: '',
    image: '',
    status: 'upcoming'
  });

  // Court Modals/Editor
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [courtForm, setCourtForm] = useState({ id: '', name: '', surface: '', basePrice: '', peakPrice: '', image: '', description: '', isActive: true });

  // Coach Modals/Editor
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [coachForm, setCoachForm] = useState({ id: '', name: '', image: '', bio: '', specialization: '', experience: '', pricePerSession: '' });

  // Tournament Modals/Editor
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({ id: '', title: '', description: '', date: '', prizePool: '', entryFee: '', image: '', status: 'upcoming', winners: '' });

  // User Modals/Editor
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ id: '', name: '', email: '', role: 'user', membership: 'None' });

  // Court Settings form state
  const [selectedCourtForPricing, setSelectedCourtForPricing] = useState('');
  const [basePriceInput, setBasePriceInput] = useState('');
  const [peakPriceInput, setPeakPriceInput] = useState('');
  
  // Slot Blocking form state
  const [blockCourt, setBlockCourt] = useState('');
  const [blockDate, setBlockDate] = useState('');
  const [blockSlots, setBlockSlots] = useState([]);

  // Promo Broadcast form state
  const [promoTitle, setPromoTitle] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [promoType, setPromoType] = useState('promo');

  // Extra Premium Suite States
  const [gstRate, setGstRate] = useState(18);
  const [ledgerList, setLedgerList] = useState([]);
  const [ledgerStats, setLedgerStats] = useState(null);
  const [payoutsList, setPayoutsList] = useState([]);
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState('all');
  const [ledgerTimeFilter, setLedgerTimeFilter] = useState('all');
  const [ledgerSelectedMonth, setLedgerSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [ledgerSelectedYear, setLedgerSelectedYear] = useState(new Date().getFullYear().toString());
  const [spotSearchQuery, setSpotSearchQuery] = useState('');
  const [spotSelectedUser, setSpotSelectedUser] = useState(null);
  const [spotCart, setSpotCart] = useState([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('cash');
  
  // Inventory Management states
  const [inventoryItems, setInventoryItems] = useState([]);
  const [spotCustomName, setSpotCustomName] = useState('');
  const [spotCustomPrice, setSpotCustomPrice] = useState('');
  const [spotInventorySearch, setSpotInventorySearch] = useState('');
  const [invItemName, setInvItemName] = useState('');
  const [invItemPrice, setInvItemPrice] = useState('');
  const [invItemStock, setInvItemStock] = useState('');
  const [invItemIsActive, setInvItemIsActive] = useState(true);
  const [editingInvItem, setEditingInvItem] = useState(null);
  const [showInvModal, setShowInvModal] = useState(false);
  
  // Spot Court Booking Scheduler States
  const [spotSelectedCourt, setSpotSelectedCourt] = useState('');
  const [spotBookingDate, setSpotBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [spotSelectedSlots, setSpotSelectedSlots] = useState([]);
  const [spotPriceOverride, setSpotPriceOverride] = useState('');
  const [courtGridData, setCourtGridData] = useState([]);
  const [qcAnalytics, setQcAnalytics] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalData, setInvoiceModalData] = useState(null);
  const [systemSettingsSubTab, setSystemSettingsSubTab] = useState('pricing'); // pricing, manage, tax_comm
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // QR Scanner state
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null); // { valid, booking, ... }
  const [scanLoading, setScanLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const [loading, setLoading] = useState(true);

  // Fallback dummy analytics if server connections pending
  const fallbackStats = {
    summary: {
      totalBookings: 12,
      totalCoaching: 8,
      totalMembers: 4,
      totalRevenue: 34850,
      courtRevenue: 15400,
      coachingRevenue: 10250,
      membershipRevenue: 9200
    },
    courtUtilization: 48,
    peakBookingHours: [
      { hour: '17:00', bookings: 12 },
      { hour: '18:00', bookings: 10 },
      { hour: '19:00', bookings: 9 },
      { hour: '07:00', bookings: 7 },
      { hour: '08:00', bookings: 5 }
    ],
    membershipGrowth: { Basic: 2, Pro: 1, Elite: 1 },
    mostBookedCoach: 'Coach David Miller'
  };

  async function fetchAdminData() {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Analytics stats
      if (user && user.role !== 'reception') {
        const statsRes = await fetch(`${API_BASE_URL}/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          setStats(fallbackStats);
        }
      } else {
        setStats(fallbackStats);
      }

      // 2. Fetch Users lists
      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }

      // 3. Fetch courts (try admin endpoint first to get all courts, fallback to public)
      let courtsData = [];
      const adminCourtsRes = await fetch(`${API_BASE_URL}/admin/courts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (adminCourtsRes.ok) {
        courtsData = await adminCourtsRes.json();
      } else {
        const courtsRes = await fetch(`${API_BASE_URL}/courts`);
        if (courtsRes.ok) {
          courtsData = await courtsRes.json();
        }
      }
      setCourtsList(courtsData);
      if (courtsData.length && !blockCourt) {
        setBlockCourt(courtsData[0]._id);
      }

      // 4. Fetch all bookings for admin management
      const bookingsRes = await fetch(`${API_BASE_URL}/admin/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookingsList(bookingsData);
      }

      // 5. Fetch all coaching logs
      const coachingRes = await fetch(`${API_BASE_URL}/admin/coaching`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coachingRes.ok) {
        const coachingData = await coachingRes.json();
        setCoachingList(coachingData);
      }

      // 6. Fetch coaches list for CRUD
      const coachesRes = await fetch(`${API_BASE_URL}/coaching/coaches`);
      if (coachesRes.ok) {
        const coachesData = await coachesRes.json();
        setCoachesList(coachesData);
      }

      // 7. Fetch tournaments list for CRUD
      const tournamentsRes = await fetch(`${API_BASE_URL}/tournaments`);
      if (tournamentsRes.ok) {
        const tournamentsData = await tournamentsRes.json();
        setTournamentsList(tournamentsData);
      }

      // 8. Fetch coaching courses list for Planner CRUD
      const coursesRes = await fetch(`${API_BASE_URL}/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCoursesList(coursesData);
      }

      // 9. Fetch coaching enrollments list for CRUD
      const enrollmentsRes = await fetch(`${API_BASE_URL}/admin/enrollments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setEnrollmentsList(enrollmentsData);
      }

      // 10. Fetch inventory items
      const inventoryRes = await fetch(`${API_BASE_URL}/admin/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setInventoryItems(inventoryData);
      }

    } catch (err) {
      setStats(fallbackStats);
      showToast('Backend offline. Displaying custom offline mock metrics.', 'info');
    } finally {
      setLoading(false);
    }
  }

  // Load additional premium tools when active tab changes
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'ledger') {
      fetchLedgerData();
    } else if (activeTab === 'settings') {
      fetchGSTSettings();
    } else if (activeTab === 'analytics') {
      fetchQCData();
    } else if (activeTab === 'grid') {
      fetchCourtGridData();
      const interval = setInterval(fetchCourtGridData, 15000); // 15 seconds refresh
      return () => clearInterval(interval);
    }
  }, [activeTab, token]);

  const fetchGSTSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGstRate(data.tax_rate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLedgerData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/ledger`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLedgerList(data.transactions || []);
        setLedgerStats(data.summary || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQCData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/coaching/quality-control`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQcAnalytics(data || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourtGridData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const bookings = await res.json();
        setCourtGridData(bookings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Spot Court Booking Scheduler Logic
  const calculateDynamicPrice = () => {
    if (!spotSelectedCourt || spotSelectedSlots.length === 0) return 0;
    const court = courtsList.find(c => c._id === spotSelectedCourt);
    if (!court) return 0;

    let total = 0;
    spotSelectedSlots.forEach(hour => {
      const isPeak = (hour >= 6 && hour < 9) || (hour >= 17 && hour < 22);
      total += isPeak ? court.peakPrice : court.basePrice;
    });

    // Apply membership discount based on selected user
    let discount = 0;
    if (spotSelectedUser) {
      const tier = spotSelectedUser.membership;
      if (tier === 'Elite') discount = 1.0;
      else if (tier === 'Pro') discount = 0.25;
      else if (tier === 'Basic') discount = 0.10;
    }

    return total * (1 - discount);
  };

  const toggleSlot = (hour) => {
    setSpotSelectedSlots(prev => {
      let updated;
      if (prev.includes(hour)) {
        updated = prev.filter(h => h !== hour);
      } else {
        updated = [...prev, hour].sort((a, b) => a - b);
      }
      setSpotPriceOverride('');
      return updated;
    });
  };

  const handleAddSpotBookingToCart = () => {
    if (!spotSelectedUser) {
      showToast('Please select a player first!', 'error');
      return;
    }
    if (!spotSelectedCourt) {
      showToast('Please select a court!', 'error');
      return;
    }
    if (spotSelectedSlots.length === 0) {
      showToast('Please select at least one hour slot!', 'error');
      return;
    }

    const court = courtsList.find(c => c._id === spotSelectedCourt);
    const courtName = court ? court.name : 'Court';
    const finalPrice = spotPriceOverride !== '' ? Number(spotPriceOverride) : calculateDynamicPrice();
    
    const slotsString = spotSelectedSlots.map(s => `${String(s).padStart(2, '0')}:00`).join(', ');
    
    const cartItem = {
      id: `court_booking_${Date.now()}`,
      name: `Spot Booking: ${courtName}`,
      description: `${courtName} booking on ${spotBookingDate} at ${slotsString}`,
      price: finalPrice,
      rate: finalPrice,
      qty: 1,
      isCourtBooking: true,
      courtId: spotSelectedCourt,
      date: spotBookingDate,
      slots: spotSelectedSlots
    };

    setSpotCart(prev => [...prev, cartItem]);
    showToast('Spot court booking added to cart successfully!', 'success');

    // Reset spot scheduler selection
    setSpotSelectedCourt('');
    setSpotSelectedSlots([]);
    setSpotPriceOverride('');
  };

  const handleSpotTopUpSubmit = async (e) => {
    e.preventDefault();
    if (!spotSelectedUser || !topupAmount || topupAmount <= 0) {
      showToast('Please select a player and enter a valid positive topup amount!', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: spotSelectedUser._id,
          amount: Number(topupAmount),
          paymentMethod: topupMethod
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Top-up failed');
      
      showToast(`Successfully credited ₹${topupAmount} to ${spotSelectedUser.name}'s wallet!`, 'success');
      setTopupAmount('');
      
      // Refresh balance
      const balRes = await fetch(`${API_BASE_URL}/admin/users/${spotSelectedUser._id}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (balRes.ok) {
        const balData = await balRes.json();
        setSpotSelectedUser(prev => ({
          ...prev,
          walletBalance: balData.walletBalance,
          tabBalance: balData.tabBalance
        }));
      }
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSpotCheckoutSubmit = async (paymentMethod) => {
    if (!spotSelectedUser) {
      showToast('Please select a player first!', 'error');
      return;
    }
    if (spotSelectedUser.isGuest) {
      if (paymentMethod === 'wallet' || paymentMethod === 'tab') {
        showToast('Unregistered guest players can only pay via Cash or Card POS.', 'error');
        return;
      }
      if (!spotGuestEmail || !spotGuestEmail.trim()) {
        showToast('Guest contact email is required!', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(spotGuestEmail.trim())) {
        showToast('Please enter a valid guest contact email!', 'error');
        return;
      }
    }
    if (spotCart.length === 0) {
      showToast('Please select at least one item from the catalog!', 'error');
      return;
    }
    
    const totalAmount = spotCart.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/wallet/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: spotSelectedUser._id,
          guestName: spotSelectedUser.isGuest ? spotSelectedUser.name : undefined,
          guestEmail: spotSelectedUser.isGuest ? (spotGuestEmail || undefined) : undefined,
          items: spotCart,
          useWallet: posUseWallet,
          paymentMethod
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Spot charge failed');
      
      showToast(`Spot charge processed successfully via ${paymentMethod}!`, 'success');
      
      // Trigger print invoice modal
      setInvoiceModalData({
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString(),
        type: 'Spot Purchase',
        member: {
          name: spotSelectedUser.name,
          email: spotSelectedUser.isGuest ? (spotGuestEmail || 'Walk-In Guest') : spotSelectedUser.email,
          membership: spotSelectedUser.isGuest ? 'Guest' : spotSelectedUser.membership
        },
        items: spotCart,
        subtotal: totalAmount,
        discount: 0,
        taxRate: gstRate,
        total: totalAmount * (1 + gstRate / 100),
        paymentMethod: posUseWallet ? `split (${paymentMethod})` : paymentMethod,
        status: 'success'
      });
      setInvoiceModalOpen(true);
      
      // Clear cart, wallet flag and guest email
      setSpotCart([]);
      setPosUseWallet(false);
      setSpotGuestEmail('');
      
      // Refresh balance
      if (spotSelectedUser && !spotSelectedUser.isGuest) {
        const balRes = await fetch(`${API_BASE_URL}/admin/users/${spotSelectedUser._id}/balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (balRes.ok) {
          const balData = await balRes.json();
          setSpotSelectedUser(prev => ({
            ...prev,
            walletBalance: balData.walletBalance,
            tabBalance: balData.tabBalance
          }));
        }
      } else {
        setSpotSelectedUser(null);
      }
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSpotSettleTab = async (paymentMethod) => {
    if (!spotSelectedUser || spotSelectedUser.isGuest || spotSelectedUser.tabBalance <= 0) return;
    if (!window.confirm(`Confirm desk settlement of ₹${spotSelectedUser.tabBalance} outstanding tab for ${spotSelectedUser.name} via ${paymentMethod === 'cash' ? 'Cash' : 'Card POS'}?`)) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${spotSelectedUser._id}/settle-tab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: spotSelectedUser.tabBalance, paymentMethod })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Desk tab settlement failed');
      
      showToast(`Tab balance settled successfully via ${paymentMethod === 'cash' ? 'Cash' : 'Card POS'}!`, 'success');
      
      // Refresh balance
      const balRes = await fetch(`${API_BASE_URL}/admin/users/${spotSelectedUser._id}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (balRes.ok) {
        const balData = await balRes.json();
        setSpotSelectedUser(prev => ({
          ...prev,
          walletBalance: balData.walletBalance,
          tabBalance: balData.tabBalance
        }));
      }
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRefundOverrideSubmit = async (e) => {
    e.preventDefault();
    const uId = e.target.elements.userId.value;
    const amt = Number(e.target.elements.amount.value);
    const desc = e.target.elements.description.value;
    
    if (!uId || !amt || amt <= 0 || !desc) {
      showToast('Please fill in all refund fields correctly.', 'error');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/wallet/refund-override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: uId, amount: amt, description: desc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund override failed');
      
      showToast('Manual ledger override applied successfully!', 'success');
      e.target.reset();
      fetchLedgerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleGSTUpdate = async (e) => {
    e.preventDefault();
    const newRate = Number(e.target.elements.taxRate.value);
    if (newRate === undefined || isNaN(newRate)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tax_rate: newRate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update GST settings');
      showToast('Custom GST Tax Rate updated successfully!', 'success');
      setGstRate(data.tax_rate);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };



  useEffect(() => {
    if (!token && !loading) {
      router.push('/auth');
      return;
    }
    
    if (user && user.role !== 'admin' && user.role !== 'reception') {
      showToast('Desk privileges required!', 'error');
      router.push('/dashboard');
      return;
    }

    if (user && user.role === 'reception' && activeTab === 'analytics') {
      setActiveTab('scanner');
    }

    fetchAdminData();
    
    // Default block date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBlockDate(tomorrow.toISOString().split('T')[0]);
  }, [token, user, router]);

  // Fetch availability for the admin lock slots tab
  const [bookedSlotsAdmin, setBookedSlotsAdmin] = useState([]);
  
  const fetchAvailability = async () => {
    if (!blockCourt || !blockDate) return;
    try {
      const res = await fetch(`${API_BASE_URL}/courts/availability?courtId=${blockCourt}&date=${blockDate}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlotsAdmin(data.bookedSlots || []);
      }
    } catch (err) {
      setBookedSlotsAdmin([]);
    }
  };

  useEffect(() => {
    fetchAvailability();
    setBlockSlots([]); // Reset admin block selection when date/court changes
  }, [blockCourt, blockDate, API_BASE_URL]);

  const handleBlockSlotsSubmit = async (e) => {
    e.preventDefault();
    if (!blockCourt || !blockDate || !blockSlots.length) {
      showToast('Please select court, date, and slots to lock.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/block-slot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courtId: blockCourt, date: blockDate, slots: blockSlots })
      });

      if (res.ok) {
        showToast('Slots successfully locked for maintenance.', 'success');
        setBlockSlots([]);
        fetchAdminData();
        fetchAvailability(); // Refresh locked slots instantly
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to lock slots');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePricingUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCourtForPricing || !basePriceInput || !peakPriceInput) {
      showToast('Please select a court and enter both prices.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/courts/${selectedCourtForPricing}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ basePrice: Number(basePriceInput), peakPrice: Number(peakPriceInput) })
      });

      if (res.ok) {
        showToast('Court pricing updated successfully.', 'success');
        fetchAdminData();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update pricing');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAdminCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bookings/cancel/${bookingId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast('Booking Cancelled successfully.', 'success');
        fetchAdminData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!promoTitle || !promoMsg) {
      showToast('Please fill in title and message body!', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: promoTitle,
          message: promoMsg,
          type: promoType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch broadcast');
      }

      showToast('Global club notification broadcast successfully dispatched!', 'success');
      setPromoTitle('');
      setPromoMsg('');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Court CRUD Submit & Delete
  const handleCourtSubmit = async (e) => {
    e.preventDefault();
    if (!courtForm.name || !courtForm.surface || !courtForm.basePrice || !courtForm.peakPrice || !courtForm.image) {
      showToast('All fields except description are required.', 'error');
      return;
    }

    const payload = {
      name: courtForm.name,
      surface: courtForm.surface,
      basePrice: Number(courtForm.basePrice),
      peakPrice: Number(courtForm.peakPrice),
      image: courtForm.image,
      description: courtForm.description,
      isActive: courtForm.isActive
    };

    try {
      const url = courtForm.id 
        ? `${API_BASE_URL}/admin/courts/${courtForm.id}` 
        : `${API_BASE_URL}/admin/courts`;
      const method = courtForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save court');

      showToast(courtForm.id ? 'Court updated successfully' : 'Court created successfully', 'success');
      setIsCourtModalOpen(false);
      setCourtForm({ id: '', name: '', surface: '', basePrice: '', peakPrice: '', image: '', description: '', isActive: true });
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCourtDelete = async (courtId) => {
    if (!window.confirm('Are you sure you want to delete this court? All corresponding schedules will be impacted.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/courts/${courtId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete court');

      showToast('Court deleted successfully', 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Coach CRUD Submit & Delete
  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    if (!coachForm.name || !coachForm.image || !coachForm.bio || !coachForm.experience || !coachForm.pricePerSession) {
      showToast('All fields are required.', 'error');
      return;
    }

    const specArray = typeof coachForm.specialization === 'string'
      ? coachForm.specialization.split(',').map(s => s.trim()).filter(Boolean)
      : coachForm.specialization;

    const payload = {
      name: coachForm.name,
      image: coachForm.image,
      bio: coachForm.bio,
      specialization: specArray || [],
      experience: Number(coachForm.experience),
      pricePerSession: Number(coachForm.pricePerSession)
    };

    try {
      const url = coachForm.id 
        ? `${API_BASE_URL}/admin/coaches/${coachForm.id}` 
        : `${API_BASE_URL}/admin/coaches`;
      const method = coachForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save coach profile');

      showToast(coachForm.id ? 'Coach profile updated successfully' : 'Coach profile created successfully', 'success');
      setIsCoachModalOpen(false);
      setCoachForm({ id: '', name: '', image: '', bio: '', specialization: '', experience: '', pricePerSession: '' });
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCoachDelete = async (coachId) => {
    if (!window.confirm('Are you sure you want to delete this coach?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/coaches/${coachId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete coach');

      showToast('Coach profile deleted successfully', 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Inventory Management CRUD Handlers
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    if (!invItemName.trim() || !invItemPrice || Number(invItemPrice) <= 0 || invItemStock === '') {
      showToast('Please fill in all fields with valid values.', 'error');
      return;
    }

    try {
      const url = editingInvItem
        ? `${API_BASE_URL}/admin/inventory/${editingInvItem._id}`
        : `${API_BASE_URL}/admin/inventory`;
      const method = editingInvItem ? 'PUT' : 'POST';
      const payload = {
        name: invItemName.trim(),
        price: Number(invItemPrice),
        stock: Number(invItemStock),
        isActive: invItemIsActive
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save inventory item');

      showToast(editingInvItem ? 'Inventory item updated successfully' : 'Inventory item created successfully', 'success');
      setShowInvModal(false);
      setEditingInvItem(null);
      setInvItemName('');
      setInvItemPrice('');
      setInvItemStock('');
      setInvItemIsActive(true);
      fetchAdminData(); // Refresh list
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleInventoryDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/inventory/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete inventory item');

      showToast('Inventory item deleted successfully', 'success');
      fetchAdminData(); // Refresh list
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Tournament CRUD Submit & Delete
  const handleTournamentSubmit = async (e) => {
    e.preventDefault();
    if (!tournamentForm.title || !tournamentForm.description || !tournamentForm.date || !tournamentForm.prizePool || !tournamentForm.entryFee || !tournamentForm.image) {
      showToast('All fields are required.', 'error');
      return;
    }

    const payload = {
      title: tournamentForm.title,
      description: tournamentForm.description,
      date: tournamentForm.date,
      prizePool: tournamentForm.prizePool,
      entryFee: Number(tournamentForm.entryFee),
      image: tournamentForm.image,
      status: tournamentForm.status,
      winners: tournamentForm.winners
    };

    try {
      const url = tournamentForm.id 
        ? `${API_BASE_URL}/admin/tournaments/${tournamentForm.id}` 
        : `${API_BASE_URL}/admin/tournaments`;
      const method = tournamentForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save tournament');

      showToast(tournamentForm.id ? 'Tournament updated successfully' : 'Tournament created successfully', 'success');
      setIsTournamentModalOpen(false);
      setTournamentForm({ id: '', title: '', description: '', date: '', prizePool: '', entryFee: '', image: '', status: 'upcoming', winners: '' });
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTournamentDelete = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tournament');

      showToast('Tournament deleted successfully', 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // User CRUD Submit & Delete
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      showToast('Name and email are required.', 'error');
      return;
    }

    const payload = {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      membership: userForm.membership
    };

    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      showToast('User profile updated successfully', 'success');
      setIsUserModalOpen(false);
      setUserForm({ id: '', name: '', email: '', role: 'user', membership: 'None' });
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      showToast('User permanently deleted', 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Coaching Course CRUD Submit & Delete
  const handleCoachingCourseSubmit = async (e) => {
    e.preventDefault();
    if (
      !coachingCourseForm.title ||
      !coachingCourseForm.description ||
      !coachingCourseForm.duration ||
      !coachingCourseForm.startDate ||
      !coachingCourseForm.endDate ||
      !coachingCourseForm.price ||
      !coachingCourseForm.slotsTotal ||
      !coachingCourseForm.coach ||
      !coachingCourseForm.schedule ||
      !coachingCourseForm.image
    ) {
      showToast('All course fields are required.', 'error');
      return;
    }

    const payload = {
      title: coachingCourseForm.title,
      description: coachingCourseForm.description,
      duration: coachingCourseForm.duration,
      startDate: coachingCourseForm.startDate,
      endDate: coachingCourseForm.endDate,
      price: Number(coachingCourseForm.price),
      slotsTotal: Number(coachingCourseForm.slotsTotal),
      coach: coachingCourseForm.coach,
      schedule: coachingCourseForm.schedule,
      image: coachingCourseForm.image,
      status: coachingCourseForm.status || 'upcoming'
    };

    try {
      const url = coachingCourseForm.id 
        ? `${API_BASE_URL}/admin/courses/${coachingCourseForm.id}` 
        : `${API_BASE_URL}/admin/courses`;
      const method = coachingCourseForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save coaching course');

      showToast(coachingCourseForm.id ? 'Coaching course updated successfully' : 'Coaching course created successfully', 'success');
      setIsCoachingCourseModalOpen(false);
      setCoachingCourseForm({ id: '', title: '', description: '', duration: '', startDate: '', endDate: '', price: '', slotsTotal: '', coach: '', schedule: '', image: '', status: 'upcoming' });
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCoachingCourseDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to permanently delete this coaching course? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete coaching course');

      showToast('Coaching course deleted successfully', 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Coaching Enrollment CRUD Submit & Delete
  const handleCoachingEnrollmentSubmit = async (e) => {
    e.preventDefault();
    if (!enrollmentForm.userId || !enrollmentForm.courseId || !enrollmentForm.amountPaid) {
      showToast('Player, Course, and Amount Paid are required.', 'error');
      return;
    }

    const payload = {
      userId: enrollmentForm.userId,
      courseId: enrollmentForm.courseId,
      amountPaid: Number(enrollmentForm.amountPaid),
      status: enrollmentForm.status || 'active',
      attendance: enrollmentForm.attendance || []
    };

    try {
      const url = enrollmentForm.id 
        ? `${API_BASE_URL}/admin/enrollments/${enrollmentForm.id}` 
        : `${API_BASE_URL}/admin/enrollments`;
      const method = enrollmentForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save enrollment');

      showToast(enrollmentForm.id ? 'Enrollment updated successfully' : 'Enrollment created successfully', 'success');
      setIsEnrollmentModalOpen(false);
      setEnrollmentForm({ id: '', userId: '', courseId: '', amountPaid: '', status: 'active', attendance: [] });
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCoachingEnrollmentDelete = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to delete this course enrollment? Slots capacity will be updated.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete enrollment');

      showToast('Enrollment deleted successfully', 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleBlockSlot = (hour) => {
    if (blockSlots.includes(hour)) {
      setBlockSlots(prev => prev.filter(h => h !== hour));
    } else {
      setBlockSlots(prev => [...prev, hour].sort((a, b) => a - b));
    }
  };

  // QR Scanner Functions
  const handleQrScan = async (code) => {
    if (!code || !code.trim()) {
      showToast('Please enter or scan a QR code!', 'error');
      return;
    }

    setScanLoading(true);
    setScanResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/scan-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrCode: code.trim() })
      });

      const data = await res.json();
      setScanResult(data);
      
      if (data.valid) {
        showToast('Check-in verified successfully!', 'success');
      } else {
        showToast(data.error || 'Invalid or expired booking pass', 'error');
      }
    } catch (err) {
      showToast('Failed to verify QR code', 'error');
      setScanResult({ valid: false, error: 'Connection failed' });
    } finally {
      setScanLoading(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      // Stop camera
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) { /* ignore cleanup errors */ }
        html5QrCodeRef.current = null;
      }
      setCameraActive(false);
    } else {
      // Start camera
      setCameraActive(true);
      
      // Dynamically import html5-qrcode to avoid SSR issues
      setTimeout(async () => {
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          const scannerId = scannerRef.current;
          if (!scannerId) return;

          // Give the element an ID if it doesn't have one
          if (!scannerId.id) scannerId.id = 'qr-scanner-viewport';

          const html5QrCode = new Html5Qrcode(scannerId.id);
          html5QrCodeRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            (decodedText) => {
              // On successful scan
              setQrInput(decodedText);
              handleQrScan(decodedText);
              
              // Stop camera after successful scan
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
                html5QrCodeRef.current = null;
                setCameraActive(false);
              }).catch(() => {});
            },
            () => { /* Ignore scan failures (no QR found in frame) */ }
          );
        } catch (err) {
          console.error('Camera Error:', err);
          showToast('Camera access denied or unavailable. Use manual input instead.', 'error');
          setCameraActive(false);
        }
      }, 300);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const activeHours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM - 10 PM
  const activeStats = stats || fallbackStats;

  // Bookings filtering helpers for active vs past
  const isPastBooking = (booking) => {
    if (booking.status === 'cancelled') return true;
    if (!booking.date) return false;
    const maxSlot = Math.max(...(booking.slots || [12]));
    const endTime = new Date(`${booking.date}T${String(maxSlot).padStart(2, '0')}:00:00`);
    return endTime < new Date();
  };

  const activeAdminBookings = bookingsList.filter(b => !isPastBooking(b));
  const pastAdminBookings = bookingsList.filter(b => isPastBooking(b));

  // ===================== CSV EXPORT UTILITY =====================
  const downloadCSV = (headers, dataRows, filename) => {
    const csvRows = [headers.join(',')];
    dataRows.forEach(row => {
      const escapedRow = row.map(val => {
        const stringVal = val === null || val === undefined ? '' : String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      });
      csvRows.push(escapedRow.join(','));
    });
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${dataRows.length} records to ${filename}.csv`, 'success');
  };

  // ===================== LEDGER FILTERING ENGINE =====================
  const getFilteredLedger = () => {
    let filtered = [...ledgerList];

    // Category filter
    if (ledgerCategoryFilter !== 'all') {
      filtered = filtered.filter(tx => {
        const desc = (tx.description || '').toLowerCase();
        if (ledgerCategoryFilter === 'court') {
          return desc.includes('court') || desc.includes('reservation') || desc.includes('booking') || desc.includes('spot');
        } else if (ledgerCategoryFilter === 'membership') {
          return desc.includes('membership') || desc.includes('upgrade') || desc.includes('top-up') || desc.includes('topup') || desc.includes('wallet');
        } else if (ledgerCategoryFilter === 'coaching') {
          return desc.includes('academy') || desc.includes('enrollment') || desc.includes('coaching') || desc.includes('course') || desc.includes('coach');
        } else if (ledgerCategoryFilter === 'amenity') {
          return desc.includes('amenities') || desc.includes('amenity') || desc.includes('purchase');
        }
        return true;
      });
    }

    // Time filter
    if (ledgerTimeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.createdAt);
        if (ledgerTimeFilter === '1w') {
          const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
          return txDate >= weekAgo;
        } else if (ledgerTimeFilter === '1m') {
          const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
          return txDate >= monthAgo;
        } else if (ledgerTimeFilter === '3m') {
          const qtrAgo = new Date(now); qtrAgo.setMonth(qtrAgo.getMonth() - 3);
          return txDate >= qtrAgo;
        } else if (ledgerTimeFilter === '1y') {
          const yearAgo = new Date(now); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return txDate >= yearAgo;
        } else if (ledgerTimeFilter === 'custom') {
          const txMonth = (txDate.getMonth() + 1).toString().padStart(2, '0');
          const txYear = txDate.getFullYear().toString();
          return txMonth === ledgerSelectedMonth && txYear === ledgerSelectedYear;
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredLedger = getFilteredLedger();
  const filteredGrossRevenue = filteredLedger.reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-electric-blue/[0.01] to-transparent pointer-events-none" />

        {user && (user.role === 'admin' || user.role === 'reception') && (
          <div className="relative z-10">
            
            {/* Header banner */}
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-extrabold text-lg border border-electric-blue/20">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                    {user.role === 'reception' ? 'Club Desk Control' : 'Club Master Control'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {user.role === 'reception' ? 'Receptionist session initialized securely' : 'Administrator session initialized securely'}
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics Numeric Highlights Row */}
            {user.role !== 'reception' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div className="glass-panel p-5 rounded-2xl border-white/5 relative overflow-hidden">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Club Gross Revenue</span>
                  <h4 className="text-3xl font-black text-white mt-1">₹{activeStats.summary.totalRevenue}</h4>
                  <p className="text-[9px] text-neon-green mt-1 uppercase font-bold tracking-wide">Secure SSL checkout totals</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-white/5 relative overflow-hidden">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Court Utilization</span>
                  <h4 className="text-3xl font-black text-electric-blue mt-1">{activeStats.courtUtilization}%</h4>
                  <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wide">Booked vs capacity limits</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-white/5 relative overflow-hidden">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Elite Members Tally</span>
                  <h4 className="text-3xl font-black text-white mt-1">{activeStats.summary.totalMembers}</h4>
                  <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wide">Active Basic / Pro / Elite subscriptions</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-white/5 relative overflow-hidden">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Most Booked Coach</span>
                  <h4 className="text-xl font-bold text-white mt-2 truncate">{activeStats.mostBookedCoach}</h4>
                  <p className="text-[9px] text-neon-green mt-1.5 uppercase font-bold tracking-wide">Instructor session peak</p>
                </div>
              </div>
            )}

            {/* Admin Tabs Navigation */}
            <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1.5 gap-2 max-w-2xl mb-8 overflow-x-auto">
              {(user?.role === 'reception'
                ? [
                    { id: 'grid', label: 'Court Grid', icon: Layers },
                    { id: 'pos', label: 'Spot POS & Wallet', icon: DollarSign },
                    { id: 'scanner', label: 'QR Check-In', icon: ScanLine },
                    { id: 'bookings', label: 'All Bookings', icon: Calendar },
                    { id: 'coaching', label: 'Coaching Log', icon: Award },
                    { id: 'block', label: 'Lock Slots', icon: Lock }
                  ]
                : [
                    { id: 'analytics', label: 'Club Analytics', icon: BarChart3 },
                    { id: 'grid', label: 'Court Grid', icon: Layers },
                    { id: 'pos', label: 'Spot POS & Wallet', icon: DollarSign },
                    { id: 'ledger', label: 'Master Ledger', icon: DollarSign },
                    { id: 'inventory', label: 'Inventory Management', icon: Package },
                    { id: 'bookings', label: 'All Bookings', icon: Calendar },
                    { id: 'coaching', label: 'Coaching Log', icon: Award },
                    { id: 'tournaments', label: 'Tournaments', icon: Layers },
                    { id: 'scanner', label: 'QR Check-In', icon: ScanLine },
                    { id: 'block', label: 'Lock Slots', icon: Lock },
                    { id: 'settings', label: 'Court Settings', icon: Settings },
                    { id: 'promo', label: 'Broadcast Promotion', icon: Send },
                    { id: 'users', label: 'Users Directory', icon: Users }
                  ]
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all ${
                      isActive
                        ? 'bg-white/5 border border-white/10 text-neon-green font-extrabold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab contents */}
            <div className="space-y-8">
              {loading ? (
                <div className="glass-panel p-12 rounded-2xl text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-electric-blue" />
                  Warming admin connections...
                </div>
              ) : activeTab === 'analytics' ? (
                /* ================= TAB 1: ANALYTICS GRAPHS ================= */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Revenue Breakout Custom SVG Chart */}
                  <div className="glass-panel p-6 rounded-2xl border-white/5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neon-green" />
                      Revenue Stream Summary
                    </h3>
                    
                    {/* SVG Chart */}
                    <div className="h-64 flex items-end justify-around pb-6 border-b border-white/5 relative">
                      {/* Fake vertical grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                        <hr className="border-white" />
                        <hr className="border-white" />
                        <hr className="border-white" />
                        <hr className="border-white" />
                      </div>

                      {/* Bar 1: Court bookings */}
                      <div className="flex flex-col items-center w-16">
                        <span className="text-[10px] text-white font-bold mb-2">₹{activeStats.summary.courtRevenue}</span>
                        <div className="w-8 bg-neon-green rounded-t-lg neon-glow" style={{ height: `${Math.max(Math.round((activeStats.summary.courtRevenue / activeStats.summary.totalRevenue) * 150), 20)}px` }} />
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black mt-3">Courts</span>
                      </div>

                      {/* Bar 2: Coaching sessions */}
                      <div className="flex flex-col items-center w-16">
                        <span className="text-[10px] text-white font-bold mb-2">₹{activeStats.summary.coachingRevenue}</span>
                        <div className="w-8 bg-electric-blue rounded-t-lg blue-glow" style={{ height: `${Math.max(Math.round((activeStats.summary.coachingRevenue / activeStats.summary.totalRevenue) * 150), 20)}px` }} />
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black mt-3">Academy</span>
                      </div>

                      {/* Bar 3: Memberships */}
                      <div className="flex flex-col items-center w-16">
                        <span className="text-[10px] text-white font-bold mb-2">₹{activeStats.summary.membershipRevenue}</span>
                        <div className="w-8 bg-white rounded-t-lg" style={{ height: `${Math.max(Math.round((activeStats.summary.membershipRevenue / activeStats.summary.totalRevenue) * 150), 20)}px` }} />
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black mt-3">Passes</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider text-center mt-4">
                      Categorized gross billing summary logs.
                    </p>
                  </div>

                  {/* Peak Booking Hours Heatmap Custom SVG Chart */}
                  <div className="glass-panel p-6 rounded-2xl border-white/5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-electric-blue" />
                      Peak Play Hours Heatmap
                    </h3>
                    
                    {/* SVG bar chart */}
                    <div className="h-64 flex items-end justify-around pb-6 border-b border-white/5 relative">
                      {activeStats.peakBookingHours.map((ph, idx) => {
                        const heights = [140, 110, 95, 75, 50]; // sorted visual heights
                        return (
                          <div key={idx} className="flex flex-col items-center w-12">
                            <span className="text-[9px] text-white font-bold mb-2">{ph.bookings}</span>
                            <div className="w-6 bg-gradient-to-t from-electric-blue/40 to-electric-blue rounded-t" style={{ height: `${heights[idx] || 40}px` }} />
                            <span className="text-[9px] text-gray-400 font-bold mt-3">{ph.hour}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider text-center mt-4">
                      Most reserved hourly slots across a 7-day play capacity window.
                    </p>
                  </div>

                  {/* Coaching Academy Quality Control Analytics */}
                  <div className="glass-panel p-6 rounded-2xl border-white/5 lg:col-span-2 mt-8">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Award className="w-4 h-4 text-electric-blue" />
                      Academy Course Quality Control & Student Retention
                    </h3>
                    {qcAnalytics && qcAnalytics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Class Size Capacity Rates Chart */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-4">Course Enrollment Capacity Rates</span>
                          <div className="space-y-4">
                            {qcAnalytics.map((item, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-white">
                                  <span>{item.title} ({item.coachName})</span>
                                  <span className="text-neon-green">{item.enrolledCount} / {item.slotsTotal} ({item.capacityRate}%)</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-neon-green h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(item.capacityRate, 100)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Student Attendance & Retention Rates */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-4">Average Student Attendance / Retention Rates</span>
                          <div className="space-y-4">
                            {qcAnalytics.map((item, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-white">
                                  <span>{item.title}</span>
                                  <span className="text-electric-blue">{item.averageAttendanceRate}% Attendance</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                  <div className="bg-electric-blue h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(item.averageAttendanceRate, 100)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-wider">
                        No active coaching courses to audit quality control metrics.
                      </div>
                    )}
                  </div>

                </div>
                            ) : activeTab === 'grid' ? (
                /* ================= COURT OCCUPANCY GRID ================= */
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-5 h-5 text-neon-green" />
                        Live Arena Floor Grid
                      </h3>
                      <p className="text-xs text-gray-500">Real-time occupancy control board for receptionist desk. Refreshes every 15 seconds.</p>
                    </div>
                    <div className="glass-panel py-2 px-4 rounded-xl border-white/5 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-neon-green" />
                      <span className="text-sm font-mono font-bold text-white">
                        {currentTime.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courtsList.map(court => {
                      const localY = currentTime.getFullYear();
                      const localM = String(currentTime.getMonth() + 1).padStart(2, '0');
                      const localD = String(currentTime.getDate()).padStart(2, '0');
                      const localDateStr = `${localY}-${localM}-${localD}`;
                      const curHour = currentTime.getHours();
                      const curMin = currentTime.getMinutes();
                      const curSec = currentTime.getSeconds();

                      const activeBooking = courtGridData.find(b => 
                        b.court?._id === court._id && 
                        b.date === localDateStr && 
                        b.slots?.includes(curHour) &&
                        b.status !== 'cancelled'
                      );

                      let isBlocked = !court.isActive || (activeBooking && activeBooking.status === 'blocked');
                      let isOccupied = activeBooking && activeBooking.status === 'confirmed' && curMin < 55;
                      let isCleanup = activeBooking && activeBooking.status === 'confirmed' && curMin >= 55;
                      let isAvailable = !isBlocked && !isOccupied && !isCleanup;

                      let cardClass = 'border-white/5 bg-charcoal/80';
                      let statusText = 'Available';
                      let badgeClass = 'bg-neon-green/10 text-neon-green border-neon-green/30';
                      let glowClass = '';

                      if (isBlocked) {
                        cardClass = 'border-red-500/20 bg-charcoal/80';
                        statusText = 'Maintenance';
                        badgeClass = 'bg-red-500/10 text-red-400 border-red-500/30';
                        glowClass = 'shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]';
                      } else if (isOccupied) {
                        cardClass = 'border-electric-blue/30 bg-charcoal/80';
                        statusText = 'Occupied';
                        badgeClass = 'bg-electric-blue/10 text-electric-blue border-electric-blue/30';
                        glowClass = 'shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]';
                      } else if (isCleanup) {
                        cardClass = 'border-yellow-500/30 bg-charcoal/80';
                        statusText = 'Clean-Up Buffer';
                        badgeClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
                        glowClass = 'shadow-[inset_0_0_20px_rgba(234,179,8,0.05)] animate-pulse';
                      } else {
                        cardClass = 'border-neon-green/20 bg-charcoal/80';
                        glowClass = 'shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]';
                      }

                      let timerString = '--:--';
                      if (isOccupied) {
                        const remMin = 54 - curMin;
                        const remSec = 59 - curSec;
                        timerString = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
                      } else if (isCleanup) {
                        const remMin = 59 - curMin;
                        const remSec = 59 - curSec;
                        timerString = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
                      }

                      return (
                        <div key={court._id} className={`glass-panel border p-6 rounded-3xl relative transition-all duration-300 ${cardClass} ${glowClass}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-base font-black text-white uppercase tracking-wider">{court.name}</h4>
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{court.surface} Surface</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${badgeClass}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="h-28 rounded-2xl overflow-hidden mb-4 relative border border-white/5">
                            <img src={court.image} alt={court.name} className="w-full h-full object-cover opacity-60" />
                            {isBlocked && (
                              <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-red-400" />
                              </div>
                            )}
                            {isOccupied && activeBooking?.user?.image && (
                              <div className="absolute top-2 right-2 border border-white/10 rounded-full overflow-hidden w-10 h-10">
                                <img src={activeBooking.user.image} alt={activeBooking.user.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-4 min-h-[90px]">
                            {isBlocked && (
                              <p className="text-xs text-red-300/80 font-bold uppercase tracking-wider animate-pulse">
                                Court has been flagged for maintenance or slot blocking lockouts.
                              </p>
                            )}

                            {isAvailable && (
                              <div className="text-center py-4">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Status: Open</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">₹{court.basePrice}/hr Off-Peak • ₹{court.peakPrice}/hr Peak</span>
                              </div>
                            )}

                            {isOccupied && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-400 font-bold uppercase">Active Player</span>
                                  <span className="text-white font-extrabold">{activeBooking.user?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-400 font-bold uppercase">Email Address</span>
                                  <span className="text-gray-400 lowercase font-medium">{activeBooking.user?.email}</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs">
                                  <span className="text-gray-400 font-bold uppercase">Cleanup in:</span>
                                  <span className="font-mono text-electric-blue font-extrabold text-sm">{timerString}</span>
                                </div>
                              </div>
                            )}

                            {isCleanup && (
                              <div className="space-y-2">
                                <div className="text-center">
                                  <span className="text-xs text-yellow-400 font-black uppercase tracking-wider block animate-pulse">CLEANING IN PROGRESS</span>
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 block">Preparing arena for slot: {curHour + 1}:00</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs mt-2">
                                  <span className="text-gray-400 font-bold uppercase">Next slot countdown:</span>
                                  <span className="font-mono text-yellow-400 font-extrabold text-sm">{timerString}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeTab === 'pos' ? (
                /* ================= SPOT POS & WALLET DESK ================= */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-neon-green" />
                      Receptionist POS & Spot Billing Desk
                    </h3>
                    <p className="text-xs text-gray-500">Take manual payments, credit player wallets, or bill extra amenities (rackets, water) to player profiles.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">1. Search Club Member / Player</label>
                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={spotSearchQuery}
                            onChange={(e) => setSpotSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none transition-all"
                          />
                        </div>

                        {spotSearchQuery && (
                          <div className="bg-black/80 border border-white/10 rounded-2xl p-2 max-h-56 overflow-y-auto divide-y divide-white/5 z-10 relative">
                            {/* Guest billing option - click opens email collection below */}
                            <button
                              type="button"
                              onClick={() => {
                                setSpotSelectedUser({
                                  _id: 'guest',
                                  name: spotSearchQuery,
                                  email: '',
                                  membership: 'None',
                                  walletBalance: 0,
                                  tabBalance: 0,
                                  isGuest: true
                                });
                                setSpotGuestEmail('');
                                setSpotSearchQuery('');
                              }}
                              className="w-full py-2 px-3 text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-neon-green font-bold text-xs"
                            >
                              <PlusCircle className="w-4.5 h-4.5 text-neon-green" />
                              <span>Bill as Walk-In Guest: &quot;{spotSearchQuery}&quot;</span>
                            </button>

                            {usersList
                              .filter(u => u.name?.toLowerCase().includes(spotSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(spotSearchQuery.toLowerCase()))
                              .slice(0, 5)
                              .map(u => (
                                <button
                                  key={u._id}
                                  onClick={() => {
                                    setSpotSelectedUser(u);
                                    setSpotSearchQuery('');
                                  }}
                                  className="w-full py-2.5 px-3 text-left hover:bg-white/5 transition-colors flex justify-between items-center"
                                >
                                  <div>
                                    <span className="text-white text-xs font-bold block">{u.name}</span>
                                    <span className="text-gray-500 text-[10px] font-medium lowercase block">{u.email}</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[8px] bg-white/5 border border-white/10 text-gray-400 uppercase font-black">
                                    {u.membership || 'Standard'}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}

                        {spotSelectedUser ? (
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {spotSelectedUser.image ? (
                                  <img src={spotSelectedUser.image} alt={spotSelectedUser.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green border border-neon-green/20">
                                    <Users className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <span className="text-white text-sm font-black block">{spotSelectedUser.name}</span>
                                  <span className="text-gray-500 text-[10px] lowercase block">
                                    {spotSelectedUser.isGuest ? (
                                      <span className="text-yellow-400/80 font-bold uppercase tracking-wider text-[9px]">Walk-In Guest</span>
                                    ) : spotSelectedUser.email}
                                  </span>
                                  {!spotSelectedUser.isGuest && (
                                    <span className="text-[9px] text-gray-400 uppercase tracking-wider block mt-1 font-bold">
                                      Membership: <span className="text-electric-blue">{spotSelectedUser.membership || 'None'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {!spotSelectedUser.isGuest && (
                                <div className="flex flex-row md:flex-col justify-around md:justify-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4 min-w-[120px]">
                                  <div>
                                    <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black block">Wallet Credit</span>
                                    <span className="text-xs font-extrabold text-neon-green font-mono">₹{spotSelectedUser.walletBalance || 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black block">Outstanding Tab</span>
                                    <span className="text-xs font-extrabold text-yellow-400 font-mono">₹{spotSelectedUser.tabBalance || 0}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Guest email collection — shown only for walk-in guests */}
                            {spotSelectedUser.isGuest && (
                              <div className="border-t border-white/5 pt-3 space-y-2">
                                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">
                                  Guest Contact Email <span className="text-red-400 font-bold">*</span> <span className="text-gray-600 normal-case font-normal">(required — linked to profile)</span>
                                </label>
                                <input
                                  type="email"
                                  placeholder="guest@email.com"
                                  value={spotGuestEmail}
                                  onChange={(e) => setSpotGuestEmail(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-2.5 px-4 text-xs text-white outline-none transition-all placeholder-gray-600"
                                  required
                                />
                                <p className="text-[9px] text-gray-600 font-medium">
                                  Guest can only pay via Cash or Card POS. Wallet, tab &amp; split options are not available. Transactions will be stored under this email profile.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-xs text-gray-500 uppercase tracking-wider">
                            Select a club member to load topups or spot checkouts.
                          </div>
                        )}
                      </div>

                      {/* SPOT COURT BOOKING SCHEDULER */}
                      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">1.5. Spot Court Booking Scheduler</label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Select Arena / Court</label>
                            <select
                              value={spotSelectedCourt}
                              onChange={(e) => {
                                setSpotSelectedCourt(e.target.value);
                                setSpotSelectedSlots([]);
                                setSpotPriceOverride('');
                              }}
                              disabled={!spotSelectedUser}
                              className="w-full bg-black/40 border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:pointer-events-none rounded-xl py-3 px-4 text-xs text-white outline-none transition-all"
                            >
                              <option value="">-- Choose Court --</option>
                              {courtsList.map(court => (
                                <option key={court._id} value={court._id}>{court.name} ({court.surface})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Booking Date</label>
                            <input
                              type="date"
                              value={spotBookingDate}
                              onChange={(e) => {
                                setSpotBookingDate(e.target.value);
                                setSpotSelectedSlots([]);
                                setSpotPriceOverride('');
                              }}
                              disabled={!spotSelectedUser}
                              className="w-full bg-black/40 border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:pointer-events-none rounded-xl py-3 px-4 text-xs text-white outline-none transition-all"
                            />
                          </div>
                        </div>

                        {spotSelectedCourt && (
                          <div className="space-y-4 border-t border-white/5 pt-4">
                            <div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Available Slots (06:00 - 22:00)</span>
                              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(hour => {
                                  // Peak Check
                                  const isPeak = (hour >= 6 && hour < 9) || (hour >= 17 && hour < 22);
                                  
                                  // Occupancy Check in courtGridData
                                  const isOccupied = courtGridData.some(b => 
                                    b.court?._id === spotSelectedCourt && 
                                    b.date === spotBookingDate && 
                                    b.slots?.includes(hour) && 
                                    b.status !== 'cancelled'
                                  );

                                  const isSelected = spotSelectedSlots.includes(hour);

                                  let btnClass = 'bg-black/20 hover:bg-black/40 text-gray-300 border border-white/5';
                                  if (isOccupied) {
                                    btnClass = 'bg-red-500/10 text-red-400 border border-red-500/30 cursor-not-allowed';
                                  } else if (isSelected) {
                                    btnClass = 'bg-neon-green text-black border border-neon-green font-black shadow-[0_0_15px_rgba(34,197,94,0.3)]';
                                  }

                                  return (
                                    <button
                                      key={hour}
                                      type="button"
                                      disabled={isOccupied}
                                      onClick={() => toggleSlot(hour)}
                                      className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all ${btnClass} flex flex-col items-center justify-center`}
                                    >
                                      <span className="font-mono">{String(hour).padStart(2, '0')}:00</span>
                                      {isPeak && !isOccupied && !isSelected && (
                                        <span className="text-[7px] text-yellow-500 font-extrabold uppercase mt-0.5 tracking-tighter">Peak</span>
                                      )}
                                      {isOccupied && (
                                        <span className="text-[7px] text-red-500 font-extrabold uppercase mt-0.5 tracking-tighter">Booked</span>
                                      )}
                                      {isSelected && (
                                        <span className="text-[7px] text-black font-extrabold uppercase mt-0.5 tracking-tighter">Active</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {spotSelectedSlots.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block">Selected Slots</span>
                                  <p className="text-white text-xs font-bold leading-relaxed">
                                    {spotSelectedSlots.map(s => `${String(s).padStart(2, '0')}:00`).join(', ')}
                                  </p>
                                  <p className="text-[9px] text-gray-500 leading-tight">
                                    ({spotSelectedSlots.length} hour{spotSelectedSlots.length > 1 ? 's' : ''} total)
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block">Editable Booking Price (₹ Pre-Tax)</label>
                                  <div className="relative">
                                    <span className="text-xs font-bold text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                                    <input
                                      type="number"
                                      value={spotPriceOverride !== '' ? spotPriceOverride : calculateDynamicPrice()}
                                      onChange={(e) => setSpotPriceOverride(e.target.value)}
                                      placeholder="Custom price..."
                                      className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-2 pl-7 pr-3 text-xs text-white outline-none font-mono transition-all"
                                    />
                                  </div>
                                  <p className="text-[8px] text-gray-500 font-medium">
                                    Standard calculated: ₹{calculateDynamicPrice().toFixed(2)} (Factors peak hours and {spotSelectedUser?.membership || 'None'} tier discount)
                                  </p>
                                </div>
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={spotSelectedSlots.length === 0}
                              onClick={handleAddSpotBookingToCart}
                              className="w-full py-3 rounded-xl bg-electric-blue hover:bg-electric-blue/90 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 transition-all shadow-[0_4px_20px_rgba(59,130,246,0.25)] flex items-center justify-center gap-2"
                            >
                              <Layers className="w-4 h-4" />
                              Add Spot Booking to Cart
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">2. Club Amenities &amp; Inventory</label>
                        
                        {/* Traditional Search Box */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Write amenity name to filter catalog..."
                            value={spotInventorySearch}
                            onChange={(e) => setSpotInventorySearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-2 pl-9 pr-8 text-xs text-white outline-none transition-all placeholder-gray-600"
                          />
                          {spotInventorySearch && (
                            <button
                              type="button"
                              onClick={() => setSpotInventorySearch('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white text-xs select-none"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Inventory matching search list */}
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                          {inventoryItems
                            .filter(inv => inv.isActive && (!spotInventorySearch.trim() || inv.name.toLowerCase().includes(spotInventorySearch.toLowerCase().trim())))
                            .map(inv => (
                              <button
                                key={inv._id}
                                disabled={!spotSelectedUser || inv.stock <= 0}
                                type="button"
                                onClick={() => {
                                  setSpotCart(prev => {
                                    const existing = prev.find(i => i.id === inv._id);
                                    if (existing) {
                                      if (existing.qty >= inv.stock) {
                                        showToast(`Max stock (${inv.stock}) reached for ${inv.name}`, 'error');
                                        return prev;
                                      }
                                      return prev.map(i => i.id === inv._id ? { ...i, qty: i.qty + 1 } : i);
                                    } else {
                                      return [...prev, { id: inv._id, name: inv.name, description: inv.name, price: inv.price, rate: inv.price, qty: 1 }];
                                    }
                                  });
                                }}
                                className="w-full flex items-center justify-between bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 disabled:opacity-30 disabled:pointer-events-none rounded-xl px-4 py-2 transition-all hover:scale-[1.01] group text-left"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Layers className="w-4 h-4 text-electric-blue shrink-0" />
                                  <span className="text-white text-xs font-bold truncate">{inv.name}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${inv.stock <= 3 ? 'text-red-400' : 'text-gray-500'}`}>{inv.stock} left</span>
                                  <span className="text-neon-green text-xs font-black font-mono font-bold">₹{inv.price}</span>
                                </div>
                              </button>
                            ))}
                          {inventoryItems.filter(inv => inv.isActive).length === 0 && (
                            <p className="text-center text-[10px] text-gray-600 py-3">No inventory items yet. Add them in Inventory Management.</p>
                          )}
                          {inventoryItems.filter(inv => inv.isActive).length > 0 &&
                           inventoryItems.filter(inv => inv.isActive && (!spotInventorySearch.trim() || inv.name.toLowerCase().includes(spotInventorySearch.toLowerCase().trim()))).length === 0 && (
                            <p className="text-center text-[10px] text-gray-500 py-3">No matching inventory items found.</p>
                          )}
                        </div>

                        {/* Custom item entry */}
                        <div className="border-t border-white/5 pt-3 space-y-2">
                          <label className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Add Custom Amenity</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Item name..."
                              value={spotCustomName}
                              onChange={(e) => setSpotCustomName(e.target.value)}
                              className="flex-1 bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-2 px-3 text-xs text-white outline-none transition-all placeholder-gray-600"
                            />
                            <input
                              type="number"
                              placeholder="₹ Price"
                              min="1"
                              value={spotCustomPrice}
                              onChange={(e) => setSpotCustomPrice(e.target.value)}
                              className="w-24 bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-2 px-3 text-xs text-white outline-none transition-all placeholder-gray-600 font-mono"
                            />
                            <button
                              type="button"
                              disabled={!spotSelectedUser || !spotCustomName.trim() || !spotCustomPrice || Number(spotCustomPrice) <= 0}
                              onClick={() => {
                                const customId = `custom_${Date.now()}`;
                                const price = Number(spotCustomPrice);
                                setSpotCart(prev => [...prev, { id: customId, name: spotCustomName.trim(), description: spotCustomName.trim(), price, rate: price, qty: 1 }]);
                                setSpotCustomName('');
                                setSpotCustomPrice('');
                              }}
                              className="px-4 py-2 rounded-xl bg-electric-blue/80 hover:bg-electric-blue disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold text-[10px] uppercase tracking-wider transition-all"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* RECEPTIONIST TAB BALANCE SETTLEMENT CARD */}
                      {spotSelectedUser && !spotSelectedUser.isGuest && spotSelectedUser.tabBalance > 0 && (
                        <div className="glass-panel p-6 rounded-3xl border-yellow-500/10 bg-gradient-to-br from-yellow-500/[0.02] to-transparent space-y-4">
                          <div>
                            <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-black block">Active Outstanding Tab Balance</span>
                            <span className="text-xl font-black text-white mt-1 block">₹{spotSelectedUser.tabBalance}</span>
                            <p className="text-[9px] text-gray-500 mt-1">Clear this member's accumulated post-paid room-tab balances.</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleSpotSettleTab('cash')}
                              className="py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Settle via Cash
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSpotSettleTab('card')}
                              className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Settle via Card POS
                            </button>
                          </div>
                        </div>
                      )}

                      {spotSelectedUser && !spotSelectedUser.isGuest && (
                        <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">3. Manual Wallet Top-Up</label>
                          
                          <form onSubmit={handleSpotTopUpSubmit} className="space-y-4">
                            <div className="flex gap-2">
                              {['500', '1000', '2000'].map(preset => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setTopupAmount(preset)}
                                  className="flex-1 bg-black/40 border border-white/10 hover:border-white/20 text-white rounded-lg py-1.5 text-[10px] font-black uppercase tracking-wider"
                                >
                                  ₹{preset}
                                </button>
                              ))}
                            </div>
                            
                            <div className="relative">
                              <span className="text-sm font-bold text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2">₹</span>
                              <input
                                type="number"
                                placeholder="Custom topup amount..."
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 pl-8 pr-4 text-sm text-white outline-none"
                                required
                              />
                            </div>

                            <select
                              value={topupMethod}
                              onChange={(e) => setTopupMethod(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white outline-none appearance-none"
                            >
                              <option value="cash">Cash Desk POS</option>
                              <option value="card">Credit/Debit Card</option>
                            </select>

                            <button
                              type="submit"
                              className="w-full py-3 rounded-xl bg-neon-green hover:bg-neon-green/90 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 transition-all neon-glow"
                            >
                              Load Top-up Balance
                            </button>
                          </form>
                        </div>
                      )}
 
                       <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4 flex flex-col">
                         <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">4. Spot Purchase Checkout Cart</label>
                         
                         {spotCart.length > 0 ? (
                           <div className="flex-1 space-y-4">
                             <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                               {spotCart.map(item => (
                                 <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                                   <div>
                                     <span className="text-white font-bold block">{item.name}</span>
                                     <span className="text-gray-500 text-[10px] font-mono">₹{item.price} each</span>
                                   </div>
                                   
                                   <div className="flex items-center gap-3">
                                     <div className="flex items-center bg-black/35 rounded-lg border border-white/10 px-2 py-0.5 gap-2">
                                       <button
                                         onClick={() => {
                                           setSpotCart(prev => 
                                             prev.map(i => i.id === item.id ? { ...i, qty: Math.max(i.qty - 1, 1) } : i)
                                           );
                                         }}
                                         className="text-gray-400 hover:text-white text-xs font-black"
                                       >
                                         -
                                       </button>
                                       <span className="text-white font-bold font-mono text-[10px]">{item.qty}</span>
                                       <button
                                         onClick={() => {
                                           setSpotCart(prev => 
                                             prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                                           );
                                         }}
                                         className="text-gray-400 hover:text-white text-xs font-black"
                                       >
                                         +
                                       </button>
                                     </div>
                                     <button
                                       onClick={() => {
                                         setSpotCart(prev => prev.filter(i => i.id !== item.id));
                                       }}
                                       className="text-red-400 hover:text-red-300 font-bold"
                                     >
                                       Remove
                                     </button>
                                   </div>
                                 </div>
                               ))}
                             </div>
 
                             <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
                               {(() => {
                                 const subtotal = spotCart.reduce((sum, item) => sum + (item.qty * item.price), 0);
                                 const tax = subtotal * (gstRate / 100);
                                 const total = subtotal + tax;
                                 return (
                                   <>
                                     <div className="flex justify-between text-gray-400">
                                       <span>Cart Subtotal</span>
                                       <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between text-gray-400">
                                       <span>GST Tax ({gstRate}%)</span>
                                       <span className="font-mono">₹{tax.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between text-white font-extrabold text-sm border-t border-white/5 pt-2">
                                       <span>Grand Total</span>
                                       <span className="font-mono text-neon-green">₹{total.toFixed(2)}</span>
                                     </div>
                                   </>
                                 );
                               })()}
                             </div>

                             {/* Wallet Split — only for registered members with wallet balance */}
                             {spotSelectedUser && !spotSelectedUser.isGuest && (spotSelectedUser.walletBalance || 0) > 0 && (
                               <div className="p-3 mb-2 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5 text-xs text-left">
                                 <div className="flex items-center gap-2">
                                   <input
                                     type="checkbox"
                                     id="pos-wallet-checkbox"
                                     checked={posUseWallet}
                                     onChange={(e) => setPosUseWallet(e.target.checked)}
                                     className="w-3.5 h-3.5 rounded text-neon-green bg-black border-white/20 focus:ring-neon-green"
                                   />
                                   <label htmlFor="pos-wallet-checkbox" className="font-bold text-gray-300 uppercase cursor-pointer select-none">
                                     Pay portion using Wallet (Bal: ₹{spotSelectedUser.walletBalance})
                                   </label>
                                 </div>
                                 {posUseWallet && (() => {
                                   const subtotal = spotCart.reduce((sum, item) => sum + (item.qty * item.price), 0);
                                   const tax = subtotal * (gstRate / 100);
                                   const total = subtotal + tax;
                                   const walletDed = Math.min(spotSelectedUser.walletBalance, total);
                                   const netP = Math.max(0, total - walletDed);
                                   return (
                                     <div className="pl-6 text-[10px] text-gray-400 space-y-0.5 mt-1 border-t border-white/5 pt-1">
                                       <div className="flex justify-between">
                                         <span>Wallet deduction:</span>
                                         <span className="text-neon-green font-bold">-₹{walletDed.toFixed(2)}</span>
                                       </div>
                                       <div className="flex justify-between font-bold text-white">
                                         <span>Net Cash / Card POS:</span>
                                         <span>₹{netP.toFixed(2)}</span>
                                       </div>
                                     </div>
                                   );
                                 })()}
                               </div>
                             )}

                             <div className="space-y-2 border-t border-white/5 pt-4">
                                {(() => {
                                  const subtotal = spotCart.reduce((sum, item) => sum + (item.qty * item.price), 0);
                                  const tax = subtotal * (gstRate / 100);
                                  const total = subtotal + tax;
                                  const isGuest = spotSelectedUser?.isGuest;
                                  const isCoveredByWallet = !isGuest && posUseWallet && (spotSelectedUser?.walletBalance || 0) >= total;

                                  // GUEST: only cash or card
                                  if (isGuest) {
                                    return (
                                      <>
                                        <button
                                          onClick={() => handleSpotCheckoutSubmit('cash')}
                                          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
                                        >
                                          Settle via Cash
                                        </button>
                                        <button
                                          onClick={() => handleSpotCheckoutSubmit('card')}
                                          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
                                        >
                                          Settle via Card POS
                                        </button>
                                      </>
                                    );
                                  }

                                  // REGISTERED MEMBER: full options
                                  if (isCoveredByWallet) {
                                    return (
                                      <button
                                        onClick={() => handleSpotCheckoutSubmit('wallet')}
                                        className="w-full py-2.5 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider transition-all neon-glow"
                                      >
                                        Settle Fully via Wallet
                                      </button>
                                    );
                                  }

                                  return (
                                    <>
                                      <button
                                        onClick={() => handleSpotCheckoutSubmit('cash')}
                                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
                                      >
                                        {posUseWallet ? 'Settle Remainder via Cash' : 'Settle via Cash'}
                                      </button>
                                      <button
                                        onClick={() => handleSpotCheckoutSubmit('card')}
                                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
                                      >
                                        {posUseWallet ? 'Settle Remainder via Card POS' : 'Settle via Card POS'}
                                      </button>
                                      {/* Tab is only for registered members, NOT guests */}
                                      {spotSelectedUser && !spotSelectedUser.isGuest && (
                                        <button
                                          onClick={() => handleSpotCheckoutSubmit('tab')}
                                          className="w-full py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold text-xs uppercase tracking-wider transition-all"
                                        >
                                          Charge to Profile Tab
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                             </div>
                           </div>
                         ) : (
                           <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-wider">
                             Cart is empty. Add items from catalog.
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
              ) : activeTab === 'ledger' ? (
                /* ================= TAB: MASTER LEDGER & OVERRIDES ================= */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-neon-green" />
                        Club Master Ledger & Revenue Audit
                      </h3>
                      <p className="text-xs text-gray-500">Oversee administrative transaction streams, audit club billing records, and filter by category or time period.</p>
                    </div>
                    <button
                      onClick={() => {
                        const headers = ['Date', 'Time', 'Player Name', 'Player Email', 'Description', 'Payment Method', 'Amount (₹)'];
                        const rows = filteredLedger.map(tx => [
                          new Date(tx.createdAt).toLocaleDateString(),
                          new Date(tx.createdAt).toLocaleTimeString(),
                          tx.user?.name || 'Guest',
                          tx.user?.email || 'N/A',
                          tx.description || '',
                          tx.paymentMethod || '',
                          tx.amount
                        ]);
                        downloadCSV(headers, rows, 'master_ledger');
                      }}
                      className="px-4 py-2.5 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export to Excel
                    </button>
                  </div>

                  {/* ---- FILTER BAR ---- */}
                  <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0">
                      <Filter className="w-3.5 h-3.5 text-neon-green" />
                      Filters
                    </div>

                    <select
                      value={ledgerCategoryFilter}
                      onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                      className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="court">Court Bookings</option>
                      <option value="membership">Memberships & Wallet</option>
                      <option value="coaching">Coaching & Academy</option>
                      <option value="amenities">Club Amenities</option>
                    </select>

                    <select
                      value={ledgerTimeFilter}
                      onChange={(e) => setLedgerTimeFilter(e.target.value)}
                      className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all cursor-pointer"
                    >
                      <option value="all">All Time</option>
                      <option value="1w">Past 1 Week</option>
                      <option value="1m">Past 1 Month</option>
                      <option value="3m">Past 3 Months</option>
                      <option value="1y">Past 1 Year</option>
                      <option value="custom">Specific Month & Year</option>
                    </select>

                    {ledgerTimeFilter === 'custom' && (
                      <div className="flex gap-2 items-center">
                        <select
                          value={ledgerSelectedMonth}
                          onChange={(e) => setLedgerSelectedMonth(e.target.value)}
                          className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all cursor-pointer"
                        >
                          {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                            <option key={m} value={m}>{new Date(2026, parseInt(m) - 1).toLocaleString('default', { month: 'long' })}</option>
                          ))}
                        </select>
                        <select
                          value={ledgerSelectedYear}
                          onChange={(e) => setLedgerSelectedYear(e.target.value)}
                          className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all cursor-pointer"
                        >
                          {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(ledgerCategoryFilter !== 'all' || ledgerTimeFilter !== 'all') && (
                      <button
                        onClick={() => { setLedgerCategoryFilter('all'); setLedgerTimeFilter('all'); }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-all"
                      >
                        ✕ Clear Filters
                      </button>
                    )}
                  </div>

                  {/* ---- REVENUE STAT CARDS ---- */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-panel p-5 rounded-2xl border-white/5 relative overflow-hidden bg-gradient-to-r from-neon-green/5 to-transparent">
                      <div className="absolute top-3 right-3 text-neon-green/20">
                        <DollarSign className="w-10 h-10 animate-pulse" />
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Total Gross Revenue</span>
                      <span className="text-3xl font-black text-white font-mono mt-1.5 block">
                        ₹{(ledgerStats?.grossRevenue || 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1 block">All-time across all streams</span>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border-white/5 relative overflow-hidden bg-gradient-to-r from-electric-blue/5 to-transparent">
                      <div className="absolute top-3 right-3 text-electric-blue/20">
                        <Filter className="w-10 h-10" />
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Filtered Revenue</span>
                      <span className="text-3xl font-black text-white font-mono mt-1.5 block">
                        ₹{filteredGrossRevenue.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1 block">
                        {filteredLedger.length} transaction{filteredLedger.length !== 1 ? 's' : ''} matching current filters
                      </span>
                    </div>
                  </div>

                  {/* ---- TRANSACTION TABLE ---- */}
                  <div className="glass-panel p-6 rounded-3xl border-white/5 overflow-hidden">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-neon-green" />
                      Transaction Audit Stream ({filteredLedger.length})
                    </h4>

                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                          <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                            <th className="py-3 px-2">Date</th>
                            <th className="py-3 px-2">Player</th>
                            <th className="py-3 px-2">Description</th>
                            <th className="py-3 px-2">Method</th>
                            <th className="py-3 px-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                          {filteredLedger.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-gray-500 text-xs normal-case">
                                No transactions match the selected filters.
                              </td>
                            </tr>
                          ) : (
                            filteredLedger.map((tx) => (
                              <tr key={tx._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-3 px-2 font-mono text-[9px] text-gray-400">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex flex-col">
                                    <span className="text-white text-xs">{tx.user?.name || 'Guest'}</span>
                                    <span className="text-[8px] text-gray-500 lowercase mt-0.5">{tx.user?.email || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-[10px] normal-case text-gray-400 truncate max-w-xs">{tx.description}</td>
                                <td className="py-3 px-2 font-mono text-[10px] text-gray-400">{tx.paymentMethod}</td>
                                <td className={`py-3 px-2 text-right font-mono ${tx.amount > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                                  {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'scanner' ? (
                /* ================= TAB 2: QR SCANNER CHECK-IN ================= */
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="glass-panel p-8 rounded-3xl border-white/5 shadow-2xl">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ScanLine className="w-5 h-5 text-neon-green" />
                      QR Code Check-In Scanner
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">Scan or enter the QR code from a player's booking pass to verify their check-in.</p>

                    {/* Manual QR Input */}
                    <div className="flex gap-3 mb-6">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          value={qrInput}
                          onChange={(e) => setQrInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleQrScan(qrInput); }}
                          placeholder="Enter QR code (e.g. CY-CENT-TOD-0910)"
                          className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300"
                        />
                      </div>
                      <button
                        onClick={() => handleQrScan(qrInput)}
                        disabled={scanLoading || !qrInput.trim()}
                        className="px-6 py-3.5 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider hover:scale-102 disabled:opacity-50 transition-all duration-300 neon-glow flex items-center gap-2"
                      >
                        {scanLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                        Verify
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                      <hr className="flex-1 border-white/5" />
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Or Use Camera</span>
                      <hr className="flex-1 border-white/5" />
                    </div>

                    {/* Camera Scanner Toggle */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => toggleCamera()}
                        className={`px-6 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                          cameraActive
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                            : 'bg-white/5 border border-white/10 text-white hover:border-neon-green/30 hover:text-neon-green'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        {cameraActive ? 'Stop Camera' : 'Open Camera Scanner'}
                      </button>

                      {/* Camera viewport */}
                      <div
                        ref={scannerRef}
                        className={`mt-6 w-full max-w-sm rounded-2xl overflow-hidden border transition-all duration-300 ${
                          cameraActive ? 'border-neon-green/30 h-72' : 'border-white/5 h-0'
                        }`}
                        style={{ minHeight: cameraActive ? '288px' : '0' }}
                      />
                    </div>
                  </div>

                  {/* Scan Result Card */}
                  {scanResult && (
                    <div className={`glass-panel p-8 rounded-3xl shadow-2xl border relative overflow-hidden animate-bounce-short ${
                      !scanResult.valid
                        ? 'border-red-500/40'
                        : scanResult.isCoaching
                        ? scanResult.alreadyMarked
                          ? 'border-electric-blue/40'
                          : 'border-neon-green/40'
                        : 'border-neon-green/40'
                    }`}>
                      <div className={`absolute inset-0 pointer-events-none ${
                        !scanResult.valid
                          ? 'bg-gradient-to-b from-red-500/[0.02] to-transparent'
                          : scanResult.isCoaching
                          ? scanResult.alreadyMarked
                            ? 'bg-gradient-to-b from-electric-blue/[0.02] to-transparent'
                            : 'bg-gradient-to-b from-neon-green/[0.02] to-transparent'
                          : 'bg-gradient-to-b from-neon-green/[0.02] to-transparent'
                      }`} />

                      <div className="relative z-10">
                        {/* Status Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                            !scanResult.valid
                              ? 'bg-red-500/10 border border-red-500/30'
                              : scanResult.isCoaching
                              ? scanResult.alreadyMarked
                                ? 'bg-electric-blue/10 border border-electric-blue/30 blue-glow'
                                : 'bg-neon-green/10 border border-neon-green/30 neon-glow'
                              : 'bg-neon-green/10 border border-neon-green/30 neon-glow'
                          }`}>
                            {!scanResult.valid ? (
                              <XCircle className="w-7 h-7 text-red-400 stroke-[2.5]" />
                            ) : scanResult.isCoaching ? (
                              scanResult.alreadyMarked ? (
                                <CheckCircle className="w-7 h-7 text-electric-blue stroke-[2.5]" />
                              ) : (
                                <CheckCircle className="w-7 h-7 text-neon-green stroke-[2.5]" />
                              )
                            ) : (
                              <CheckCircle className="w-7 h-7 text-neon-green stroke-[2.5]" />
                            )}
                          </div>
                          <div>
                            <h4 className={`text-xl font-black uppercase tracking-wider ${
                              !scanResult.valid
                                ? 'text-red-400'
                                : scanResult.isCoaching
                                ? scanResult.alreadyMarked
                                  ? 'text-electric-blue'
                                  : 'text-neon-green'
                                : 'text-neon-green'
                            }`}>
                              {!scanResult.valid
                                ? scanResult.isExpired
                                  ? 'Booking Expired'
                                  : 'Invalid Pass'
                                : scanResult.isCoaching
                                ? scanResult.attendanceAdded
                                  ? 'Attendance Logged ✓'
                                  : scanResult.alreadyMarked
                                  ? 'Already Checked In ✓'
                                  : 'Check-In Verified ✓'
                                : 'Check-In Verified ✓'}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {!scanResult.valid
                                ? scanResult.status === 'cancelled'
                                  ? 'This booking has been cancelled.'
                                  : 'QR code does not match any active booking.'
                                : scanResult.isCoaching
                                ? scanResult.attendanceAdded
                                  ? 'Attendance has been recorded successfully.'
                                  : scanResult.alreadyMarked
                                  ? 'Attendance was already logged today.'
                                  : 'Coaching pass is currently active and valid.'
                                : 'Player is cleared for court access.'}
                            </p>
                          </div>
                        </div>

                        {scanResult.isCoaching && scanResult.enrollment && (() => {
                          const totalSessions = getSessionCount(scanResult.enrollment.course?.duration);
                          const attendedSessions = scanResult.enrollment.attendance?.length || 0;
                          const attendancePercentage = totalSessions > 0 ? Math.min((attendedSessions / totalSessions) * 100, 100) : 0;
                          
                          return (
                            <>
                              <hr className="border-white/5 mb-6" />
                              <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Player Name</span>
                                  <span className="text-sm font-bold text-white mt-0.5">{scanResult.enrollment.user?.name || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Email</span>
                                  <span className="text-sm font-bold text-white mt-0.5 lowercase">{scanResult.enrollment.user?.email || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Course Program</span>
                                  <span className="text-sm font-bold text-neon-green mt-0.5">{scanResult.enrollment.course?.title || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Assigned Coach</span>
                                  <span className="text-sm font-bold text-white mt-0.5">{scanResult.enrollment.course?.coachName || 'Unassigned'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Course Schedule</span>
                                  <span className="text-sm font-bold text-white mt-0.5">{scanResult.enrollment.course?.schedule || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Membership Status</span>
                                  <span className={`text-sm font-bold mt-0.5 ${
                                    scanResult.enrollment.user?.membership === 'Elite' ? 'text-neon-green'
                                    : scanResult.enrollment.user?.membership === 'Pro' ? 'text-electric-blue'
                                    : 'text-white'
                                  }`}>{scanResult.enrollment.user?.membership || 'None'}</span>
                                </div>
                                <div className="flex flex-col col-span-2">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Pass Reference</span>
                                  <span className="text-[10px] font-bold text-gray-400 mt-1 font-mono">{scanResult.enrollment.qrCodeData}</span>
                                </div>
                              </div>

                              <div className="mt-6 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-gray-400">
                                  <span>Attendance Progress</span>
                                  <span className="text-neon-green font-mono">{attendedSessions} / {totalSessions} sessions ({Math.round(attendancePercentage)}%)</span>
                                </div>
                                <div className="w-full bg-white/5 border border-white/10 rounded-full h-3.5 overflow-hidden p-0.5">
                                  <div 
                                    className="bg-gradient-to-r from-neon-green to-electric-blue h-full rounded-full transition-all duration-500 neon-glow"
                                    style={{ width: `${attendancePercentage}%` }}
                                  />
                                </div>
                              </div>
                            </>
                          );
                        })()}

                        {!scanResult.isCoaching && scanResult.booking && (
                          <>
                            <hr className="border-white/5 mb-6" />
                            {/* Booking Details Grid */}
                            <div className="grid grid-cols-2 gap-5">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Player Name</span>
                                <span className="text-sm font-bold text-white mt-0.5">{scanResult.booking.user?.name || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Email</span>
                                <span className="text-sm font-bold text-white mt-0.5 lowercase">{scanResult.booking.user?.email || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Court</span>
                                <span className="text-sm font-bold text-white mt-0.5">{scanResult.booking.court?.name || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Date of Play</span>
                                <span className="text-sm font-bold text-neon-green mt-0.5">{scanResult.booking.date}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Time Slots</span>
                                <span className="text-sm font-bold text-white mt-0.5">
                                  {scanResult.booking.slots?.map(s => `${s}:00`).join(', ')}
                                </span>
                              </div>
                              {user?.role !== 'reception' && (
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Amount Paid</span>
                                  <span className="text-sm font-bold text-electric-blue mt-0.5">₹{scanResult.booking.totalAmount}</span>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Membership</span>
                                <span className={`text-sm font-bold mt-0.5 ${
                                  scanResult.booking.user?.membership === 'Elite' ? 'text-neon-green'
                                  : scanResult.booking.user?.membership === 'Pro' ? 'text-electric-blue'
                                  : 'text-white'
                                }`}>
                                  {scanResult.booking.user?.membership || 'None'}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">QR Reference</span>
                                <span className="text-[10px] font-bold text-gray-400 mt-1 font-mono">{scanResult.booking.qrCodeData}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Clear button */}
                        <button
                          onClick={() => { setScanResult(null); setQrInput(''); }}
                          className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
                        >
                          Clear & Scan Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'block' ? (
                /* ================= TAB 3: LOCK SLOTS ================= */
                <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-white/5 shadow-2xl">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-neon-green" />
                    Block unavailable slots
                  </h3>
                  
                  <form onSubmit={handleBlockSlotsSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Choose Court</label>
                        <select
                          value={blockCourt}
                          onChange={(e) => setBlockCourt(e.target.value)}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none cursor-pointer font-bold uppercase tracking-wider"
                        >
                          {courtsList.map((c) => (
                            <option key={c._id} value={c._id} className="bg-sport-dark text-white uppercase">{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Choose Date</label>
                        <input
                          type="date"
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none cursor-pointer font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Select Slots to Block</label>
                      <div className="grid grid-cols-4 gap-2">
                        {activeHours.map((hour) => {
                          const isBlocked = blockSlots.includes(hour) || bookedSlotsAdmin.includes(hour);
                          const isAlreadyBooked = bookedSlotsAdmin.includes(hour);
                          return (
                            <button
                              key={hour}
                              type="button"
                              onClick={() => !isAlreadyBooked && toggleBlockSlot(hour)}
                              disabled={isAlreadyBooked}
                              className={`py-2.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                isAlreadyBooked
                                  ? 'bg-red-500/5 text-red-500/40 border-red-500/10 line-through cursor-not-allowed'
                                  : blockSlots.includes(hour)
                                  ? 'bg-neon-green text-black border-neon-green font-extrabold neon-glow'
                                  : 'bg-black/40 hover:bg-black/60 border-white/5 text-gray-300'
                              }`}
                            >
                              {hour}:00
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 transition-all duration-300 neon-glow"
                    >
                      Enforce Block Locks
                    </button>
                  </form>
                </div>
              ) : activeTab === 'settings' ? (
                /* ================= TAB: COURT SETTINGS & PRICING ================= */
                <div className="space-y-6">
                  {/* Sub-tab Navigation */}
                  <div className="flex bg-black/30 border border-white/5 rounded-xl p-1 gap-2 w-max">
                    <button
                      onClick={() => setSystemSettingsSubTab('pricing')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        systemSettingsSubTab === 'pricing'
                          ? 'bg-white/5 text-neon-green font-extrabold border border-white/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Pricing Engine
                    </button>
                    <button
                      onClick={() => setSystemSettingsSubTab('manage')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        systemSettingsSubTab === 'manage'
                          ? 'bg-white/5 text-neon-green font-extrabold border border-white/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Manage Arenas
                    </button>
                    <button
                      onClick={() => setSystemSettingsSubTab('tax_comm')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        systemSettingsSubTab === 'tax_comm'
                          ? 'bg-white/5 text-neon-green font-extrabold border border-white/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Tax Configurations
                    </button>
                  </div>

                  {systemSettingsSubTab === 'pricing' ? (
                    <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-white/5 shadow-2xl">
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neon-green" />
                        Dynamic Pricing Adjustments
                      </h3>

                      <form onSubmit={handlePricingUpdate} className="space-y-6">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Select Arena to Modify</label>
                          <select
                            value={selectedCourtForPricing}
                            onChange={(e) => {
                              setSelectedCourtForPricing(e.target.value);
                              const court = courtsList.find(c => c._id === e.target.value);
                              if (court) {
                                setBasePriceInput(court.basePrice);
                                setPeakPriceInput(court.peakPrice);
                              }
                            }}
                            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white appearance-none outline-none transition-all w-full"
                          >
                            <option value="">-- Choose a court --</option>
                            {courtsList.map(court => (
                              <option key={court._id} value={court._id}>{court.name}</option>
                            ))}
                          </select>
                        </div>

                        {selectedCourtForPricing && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Base Price (Off-Peak) (₹)</label>
                              <input
                                type="number"
                                value={basePriceInput}
                                onChange={(e) => setBasePriceInput(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white outline-none w-full"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Peak Price (₹)</label>
                              <input
                                type="number"
                                value={peakPriceInput}
                                onChange={(e) => setPeakPriceInput(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white outline-none w-full"
                                required
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={!selectedCourtForPricing}
                          className="w-full py-4 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 transition-all duration-300 disabled:opacity-50 neon-glow"
                        >
                          Update Court Pricing
                        </button>
                      </form>
                    </div>
                  ) : systemSettingsSubTab === 'manage' ? (
                    <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-neon-green" />
                          Club Arenas Database ({courtsList.length})
                        </h3>
                        <button
                          onClick={() => {
                            setCourtForm({ id: '', name: '', surface: '', basePrice: '', peakPrice: '', image: '', description: '', isActive: true });
                            setIsCourtModalOpen(true);
                          }}
                          className="px-4 py-2 bg-neon-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:scale-102 transition-all neon-glow"
                        >
                          + Add Arena
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                              <th className="py-4 px-3">Arena</th>
                              <th className="py-4 px-3">Surface</th>
                              <th className="py-4 px-3">Pricing (Base / Peak)</th>
                              <th className="py-4 px-3">Status</th>
                              <th className="py-4 px-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                            {courtsList.map((c) => (
                              <tr key={c._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-3">
                                    <img src={c.image} alt={c.name} className="w-12 h-8 rounded-lg object-cover border border-white/10" />
                                    <div className="flex flex-col">
                                      <span className="text-white font-extrabold">{c.name}</span>
                                      <span className="text-[9px] text-gray-500 normal-case truncate max-w-xs">{c.description || 'No description'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-gray-400">{c.surface}</td>
                                <td className="py-4 px-3 text-white font-mono">₹{c.basePrice} / ₹{c.peakPrice}</td>
                                <td className="py-4 px-3">
                                  {c.isActive ? (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-neon-green/10 text-neon-green border border-neon-green/30">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-white/5 text-gray-500 border border-white/10">
                                      Disabled
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setCourtForm({ id: c._id, name: c.name, surface: c.surface, basePrice: c.basePrice, peakPrice: c.peakPrice, image: c.image, description: c.description || '', isActive: c.isActive });
                                        setIsCourtModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-all"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleCourtDelete(c._id)}
                                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-all"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* ================= SUB-TAB: TAX CONFIGURATIONS ================= */
                    <div className="space-y-8">
                      <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-white/5 shadow-2xl">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-neon-green" />
                          Custom Club GST Tax Configurations
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">Modify the flat rate GST applied to all checkout bookings, invoice layouts, and receptionist POS transactions.</p>
                        
                        <form onSubmit={handleGSTUpdate} className="space-y-4">
                          <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2 block">GST Flat Tax Rate (%)</label>
                            <input
                              type="number"
                              name="taxRate"
                              defaultValue={gstRate}
                              className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white outline-none w-full"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 transition-all neon-glow"
                          >
                            Apply GST Flat Rate
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'bookings' ? (
                /* ================= TAB 3: ADMIN BOOKINGS LIST ================= */
                <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neon-green" />
                      Global Bookings Database ({bookingsList.length})
                    </h3>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const displayedBookings = bookingSubTab === 'active' ? activeAdminBookings : pastAdminBookings;
                          const headers = ['Player Name', 'Player Email', 'Court', 'Date', 'Slots', 'Amount (₹)', 'Status', 'Checked In'];
                          const rows = displayedBookings.map(b => [
                            b.user?.name || 'Guest',
                            b.user?.email || 'N/A',
                            b.court?.name || 'N/A',
                            b.date || '',
                            b.slots?.map(s => `${s}:00`).join(' | ') || '',
                            b.totalAmount || 0,
                            b.status || '',
                            b.checkedIn ? 'Yes' : 'No'
                          ]);
                          downloadCSV(headers, rows, `bookings_${bookingSubTab}`);
                        }}
                        className="px-3 py-2 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export
                      </button>

                      {/* Booking Sub-tabs */}
                      <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
                        <button
                          onClick={() => setBookingSubTab('active')}
                          className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            bookingSubTab === 'active'
                              ? 'bg-white/5 text-neon-green border border-white/10 font-black'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Active ({activeAdminBookings.length})
                        </button>
                        <button
                          onClick={() => setBookingSubTab('past')}
                          className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            bookingSubTab === 'past'
                              ? 'bg-white/5 text-white border border-white/10 font-black'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Past ({pastAdminBookings.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                          <th className="py-4 px-3">Player</th>
                          <th className="py-4 px-3">Court & Date</th>
                          <th className="py-4 px-3">Slots</th>
                          <th className="py-4 px-3">Status</th>
                          <th className="py-4 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                        {(bookingSubTab === 'active' ? activeAdminBookings : pastAdminBookings).map((b) => (
                          <tr key={b._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-3">
                              <div className="flex flex-col">
                                <span className="text-white font-extrabold">{b.user?.name || 'System Admin'}</span>
                                <span className="text-[9px] text-gray-500 lowercase mt-0.5">{b.user?.email || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex flex-col">
                                <span className="text-neon-green font-extrabold">{b.court?.name || 'N/A'}</span>
                                <span className="text-[9px] text-gray-400 mt-0.5">{b.date}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3">{b.slots?.map(s => `${s}:00`).join(', ')}</td>
                            <td className="py-4 px-3">
                              {b.status === 'confirmed' ? (
                                b.checkedIn ? (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-electric-blue/10 text-electric-blue border border-electric-blue/30 flex items-center gap-1 w-max">
                                    <CheckCircle className="w-3 h-3" />
                                    Checked-In
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-neon-green/10 text-neon-green border border-neon-green/30">
                                    Confirmed
                                  </span>
                                )
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/30">
                                  Cancelled
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3">
                              {b.status === 'confirmed' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setSelectedBookingForQr(b)}
                                    className="p-1.5 bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue border border-electric-blue/20 hover:border-electric-blue/40 rounded-lg transition-all cursor-pointer"
                                    title="View Booking QR Code Pass"
                                  >
                                    <ScanLine className="w-4 h-4" />
                                  </button>
                                  {user?.role !== 'reception' && (
                                    <button
                                      onClick={() => handleAdminCancelBooking(b._id)}
                                      className="p-1.5 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
                                      title="Cancel Booking"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeTab === 'coaching' ? (
                /* ================= TAB: COACHING LOGS & COACH CRUD ================= */
                <div className="space-y-6">
                  {/* Sub-tab Navigation */}
                  <div className="flex bg-black/30 border border-white/5 rounded-xl p-1 gap-2 w-max">
                    <button
                      onClick={() => setCoachingSubTab('courses')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        coachingSubTab === 'courses'
                          ? 'bg-white/5 text-neon-green font-extrabold border border-white/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Course Planner
                    </button>
                    <button
                      onClick={() => setCoachingSubTab('coaches')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        coachingSubTab === 'coaches'
                          ? 'bg-white/5 text-neon-green font-extrabold border border-white/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Manage Coaches
                    </button>
                    <button
                      onClick={() => setCoachingSubTab('logs')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        coachingSubTab === 'logs'
                          ? 'bg-white/5 text-neon-green font-extrabold border border-white/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Coaching Sessions
                    </button>
                    <button
                      onClick={() => setCoachingSubTab('enrollments')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        coachingSubTab === 'enrollments'
                          ? 'bg-white/5 text-neon-green font-extrabold border border-white/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Player Enrollments
                    </button>
                  </div>

                  {coachingSubTab === 'courses' ? (
                    <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-neon-green" />
                          Coaching Courses Planner ({coursesList.length})
                        </h3>
                        {user?.role !== 'reception' && (
                          <button
                            onClick={() => {
                              setCoachingCourseForm({ id: '', title: '', description: '', duration: '', startDate: '', endDate: '', price: '', slotsTotal: '', coach: coachesList[0]?._id || '', schedule: '', image: '', status: 'upcoming' });
                              setIsCoachingCourseModalOpen(true);
                            }}
                            className="px-4 py-2 bg-neon-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:scale-102 transition-all neon-glow"
                          >
                            + Create Course
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                              <th className="py-4 px-3">Course</th>
                              <th className="py-4 px-3">Coach</th>
                              <th className="py-4 px-3">Schedule & Dates</th>
                              <th className="py-4 px-3">Capacity</th>
                              {user?.role !== 'reception' && <th className="py-4 px-3">Price</th>}
                              <th className="py-4 px-3">Status</th>
                              {user?.role !== 'reception' && <th className="py-4 px-3">Action</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                            {coursesList.map((course) => (
                              <tr key={course._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-3">
                                    <img src={course.image} alt={course.title} className="w-12 h-8 rounded-lg object-cover border border-white/10" />
                                    <div className="flex flex-col">
                                      <span className="text-white font-extrabold">{course.title}</span>
                                      <span className="text-[9px] text-gray-500 normal-case line-clamp-2 max-w-xs">{course.description}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  {course.coach ? (
                                    <div className="flex items-center gap-2">
                                      <img src={course.coach.image} alt={course.coach.name} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                                      <span className="text-white font-extrabold text-[10px]">{course.coach.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 italic">Unassigned</span>
                                  )}
                                </td>
                                <td className="py-4 px-3">
                                  <div className="flex flex-col">
                                    <span className="text-white font-extrabold">{course.schedule}</span>
                                    <span className="text-[9px] text-gray-400 mt-0.5">{course.startDate} to {course.endDate} ({course.duration})</span>
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                                      course.slotsEnrolled >= course.slotsTotal 
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                        : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                                    }`}>
                                      {course.slotsEnrolled} / {course.slotsTotal}
                                    </span>
                                    <span className="text-[9px] text-gray-500 uppercase">Enrolled</span>
                                  </div>
                                </td>
                                {user?.role !== 'reception' && <td className="py-4 px-3 text-white font-mono">₹{course.price}</td>}
                                <td className="py-4 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                    course.status === 'active'
                                      ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                                      : course.status === 'completed'
                                      ? 'bg-white/5 text-gray-500 border-white/10'
                                      : 'bg-electric-blue/10 text-electric-blue border-electric-blue/30'
                                  }`}>
                                    {course.status}
                                  </span>
                                </td>
                                {user?.role !== 'reception' && (
                                  <td className="py-4 px-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setCoachingCourseForm({
                                            id: course._id,
                                            title: course.title,
                                            description: course.description,
                                            duration: course.duration,
                                            startDate: course.startDate,
                                            endDate: course.endDate,
                                            price: course.price,
                                            slotsTotal: course.slotsTotal,
                                            coach: course.coach?._id || course.coach || '',
                                            schedule: course.schedule,
                                            image: course.image,
                                            status: course.status
                                          });
                                          setIsCoachingCourseModalOpen(true);
                                        }}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-all"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleCoachingCourseDelete(course._id)}
                                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-all"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : coachingSubTab === 'logs' ? (
                    <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Award className="w-4 h-4 text-neon-green" />
                        Global Coaching Logs ({coachingList.length})
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                              <th className="py-4 px-3">Player</th>
                              <th className="py-4 px-3">Coach</th>
                              <th className="py-4 px-3">Program</th>
                              <th className="py-4 px-3">Date & Slot</th>
                              <th className="py-4 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                            {coachingList.map((c) => (
                              <tr key={c._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-3">
                                  <div className="flex flex-col">
                                    <span className="text-white font-extrabold">{c.user?.name || 'Unknown'}</span>
                                    <span className="text-[9px] text-gray-500 lowercase mt-0.5">{c.user?.email || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-electric-blue">{c.coach?.name || 'N/A'}</td>
                                <td className="py-4 px-3">{c.programType}</td>
                                <td className="py-4 px-3">
                                  <div className="flex flex-col">
                                    <span className="text-white font-extrabold">{c.date}</span>
                                    <span className="text-[9px] text-gray-400 mt-0.5">{c.slot}:00</span>
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-electric-blue/10 text-electric-blue border border-electric-blue/30">
                                    {c.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : coachingSubTab === 'enrollments' ? (
                    <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-neon-green" />
                          Player Course Enrollments ({enrollmentsList.length})
                        </h3>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const headers = ['Player Name', 'Player Email', 'Course', 'Coach', 'Schedule', 'Amount Paid (₹)', 'Attendance', 'Status'];
                              const rows = enrollmentsList.map(e => [
                                e.user?.name || 'N/A',
                                e.user?.email || 'N/A',
                                e.course?.title || 'Deleted Course',
                                e.course?.coach?.name || 'Unassigned',
                                e.course?.schedule || 'N/A',
                                e.amountPaid || 0,
                                `${e.attendance?.length || 0} sessions`,
                                e.status || ''
                              ]);
                              downloadCSV(headers, rows, 'coaching_enrollments');
                            }}
                            className="px-3 py-2 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export
                          </button>
                          <button
                            onClick={() => {
                              setEnrollmentForm({ id: '', userId: '', courseId: '', amountPaid: '', status: 'active', attendance: [] });
                              setIsEnrollmentModalOpen(true);
                            }}
                            className="px-4 py-2 bg-neon-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:scale-102 transition-all neon-glow"
                          >
                            + Enroll Player
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                              <th className="py-4 px-3">Player</th>
                              <th className="py-4 px-3">Course Program</th>
                              {user?.role !== 'reception' && <th className="py-4 px-3">Amount Paid</th>}
                              <th className="py-4 px-3">Attendance</th>
                              <th className="py-4 px-3">Status</th>
                              <th className="py-4 px-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                            {enrollmentsList.map((enrollment) => {
                              const totalSessions = getSessionCount(enrollment.course?.duration);
                              const attendedSessions = enrollment.attendance?.length || 0;
                              const attendancePercentage = totalSessions > 0 ? Math.min((attendedSessions / totalSessions) * 100, 100) : 0;
                              
                              return (
                                <tr key={enrollment._id} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="py-4 px-3">
                                    <div className="flex flex-col">
                                      <span className="text-white font-extrabold">{enrollment.user?.name || 'N/A'}</span>
                                      <span className="text-[9px] text-gray-500 lowercase mt-0.5">{enrollment.user?.email || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-3">
                                    <div className="flex flex-col">
                                      <span className="text-neon-green font-extrabold">{enrollment.course?.title || 'Deleted Course'}</span>
                                      <span className="text-[9px] text-gray-400 mt-0.5">{enrollment.course?.coach?.name || enrollment.course?.coachName || 'Unassigned Coach'} | {enrollment.course?.schedule || 'N/A'}</span>
                                    </div>
                                  </td>
                                  {user?.role !== 'reception' && <td className="py-4 px-3 text-white font-mono">₹{enrollment.amountPaid}</td>}
                                  <td className="py-4 px-3 min-w-[150px]">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] text-gray-400 font-bold">{attendedSessions} / {totalSessions} Sessions ({Math.round(attendancePercentage)}%)</span>
                                      <div className="w-full bg-white/5 border border-white/10 rounded-full h-2 overflow-hidden p-0.5">
                                        <div 
                                          className="bg-gradient-to-r from-neon-green to-electric-blue h-full rounded-full transition-all duration-300"
                                          style={{ width: `${attendancePercentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                      enrollment.status === 'active'
                                        ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                                        : enrollment.status === 'completed'
                                        ? 'bg-white/5 text-gray-500 border-white/10'
                                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                                    }`}>
                                      {enrollment.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedEnrollmentForQr(enrollment);
                                        }}
                                        className="px-2 py-1 bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue border border-electric-blue/20 rounded text-[10px] transition-all"
                                      >
                                        Pass
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedEnrollmentForAttendance(enrollment);
                                          setIsAttendanceModalOpen(true);
                                        }}
                                        className="px-2 py-1 bg-neon-green/10 hover:bg-neon-green/20 text-neon-green border border-neon-green/20 rounded text-[10px] transition-all cursor-pointer font-bold uppercase tracking-wider"
                                      >
                                        Attendance
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEnrollmentForm({
                                            id: enrollment._id,
                                            userId: enrollment.user?._id || enrollment.user || '',
                                            courseId: enrollment.course?._id || enrollment.course || '',
                                            amountPaid: enrollment.amountPaid,
                                            status: enrollment.status,
                                            attendance: enrollment.attendance || []
                                          });
                                          setIsEnrollmentModalOpen(true);
                                        }}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-all"
                                      >
                                        Edit
                                      </button>
                                      {user?.role !== 'reception' && (
                                        <button
                                          onClick={() => handleCoachingEnrollmentDelete(enrollment._id)}
                                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-all"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-neon-green" />
                          Coaches Registry ({coachesList.length})
                        </h3>
                        <button
                          onClick={() => {
                            setCoachForm({ id: '', name: '', image: '', bio: '', specialization: '', experience: '', pricePerSession: '' });
                            setIsCoachModalOpen(true);
                          }}
                          className="px-4 py-2 bg-neon-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:scale-102 transition-all neon-glow"
                        >
                          + Add Coach Profile
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                              <th className="py-4 px-3">Coach</th>
                              <th className="py-4 px-3">Specialization</th>
                              <th className="py-4 px-3">Experience</th>
                              <th className="py-4 px-3">Session Rate</th>
                              <th className="py-4 px-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                            {coachesList.map((coach) => (
                              <tr key={coach._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-3">
                                    <img src={coach.image} alt={coach.name} className="w-10 h-10 rounded-full object-cover border border-white/10 animate-fade-in" />
                                    <div className="flex flex-col flex-1 min-w-[200px]">
                                      <span className="text-white font-extrabold">{coach.name}</span>
                                      <span className="text-[9px] text-gray-500 normal-case line-clamp-2 max-w-sm">{coach.bio}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  <div className="flex flex-wrap gap-1">
                                    {coach.specialization?.map((spec, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-electric-blue/10 text-electric-blue rounded text-[9px] normal-case border border-electric-blue/20">
                                        {spec}
                                      </span>
                                    )) || <span className="text-gray-500">None</span>}
                                  </div>
                                </td>
                                <td className="py-4 px-3 font-mono text-gray-400">{coach.experience} Yrs</td>
                                <td className="py-4 px-3 text-white font-mono">₹{coach.pricePerSession}</td>
                                <td className="py-4 px-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setCoachForm({ id: coach._id, name: coach.name, image: coach.image, bio: coach.bio, specialization: coach.specialization?.join(', ') || '', experience: coach.experience, pricePerSession: coach.pricePerSession });
                                        setIsCoachModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-all"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleCoachDelete(coach._id)}
                                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-all"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'promo' ? (
                /* ================= TAB 3: DISPATCH PROMO ALERTS ================= */
                <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-white/5 shadow-2xl">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Send className="w-5 h-5 text-neon-green" />
                    Dispatch Broadcast promotion
                  </h3>

                  <form onSubmit={handleBroadcastSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Alert Title</label>
                        <input
                          type="text"
                          value={promoTitle}
                          onChange={(e) => setPromoTitle(e.target.value)}
                          placeholder="Summer Smash Tournament Cup Open!"
                          className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 text-xs rounded-xl py-3.5 px-4 text-white outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Promo Type</label>
                        <select
                          value={promoType}
                          onChange={(e) => setPromoType(e.target.value)}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none cursor-pointer font-bold uppercase tracking-wider"
                        >
                          <option value="promo" className="bg-sport-dark text-white uppercase">Promo Alert</option>
                          <option value="info" className="bg-sport-dark text-white uppercase">General Info</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Broadcast Message Description</label>
                      <textarea
                        value={promoMsg}
                        onChange={(e) => setPromoMsg(e.target.value)}
                        placeholder="Detail the promotion, discount vouchers, or upcoming matches list..."
                        rows="4"
                        className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-neon-green/50 text-xs rounded-xl py-3.5 px-4 text-white outline-none transition-all"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 transition-all duration-300 neon-glow"
                    >
                      Broadcast to dashboards
                    </button>
                  </form>
                </div>
              ) : activeTab === 'tournaments' ? (
                /* ================= TAB: TOURNAMENTS REGISTRY ================= */
                <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-neon-green" />
                      Club Tournaments Registry ({tournamentsList.length})
                    </h3>
                    <button
                      onClick={() => {
                        setTournamentForm({ id: '', title: '', description: '', date: '', prizePool: '', entryFee: '', image: '', status: 'upcoming', winners: '' });
                        setIsTournamentModalOpen(true);
                      }}
                      className="px-4 py-2 bg-neon-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:scale-102 transition-all neon-glow"
                    >
                      + Add Tournament
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                          <th className="py-4 px-3">Tournament</th>
                          <th className="py-4 px-3">Date</th>
                          <th className="py-4 px-3">Prize Pool</th>
                          <th className="py-4 px-3">Entry Fee</th>
                          <th className="py-4 px-3">Status</th>
                          <th className="py-4 px-3">Registrations</th>
                          <th className="py-4 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                        {tournamentsList.map((t) => (
                          <tr key={t._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-3">
                                <img src={t.image} alt={t.title} className="w-12 h-8 rounded-lg object-cover border border-white/10" />
                                <div className="flex flex-col">
                                  <span className="text-white font-extrabold">{t.title}</span>
                                  <span className="text-[9px] text-gray-500 normal-case truncate max-w-xs">{t.description}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-gray-400 font-mono">{t.date}</td>
                            <td className="py-4 px-3 text-neon-green">{t.prizePool}</td>
                            <td className="py-4 px-3 font-mono text-white">₹{t.entryFee}</td>
                            <td className="py-4 px-3">
                              {t.status === 'upcoming' ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-white/5 text-gray-400 border border-white/10">
                                  Upcoming
                                </span>
                              ) : t.status === 'active' ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-neon-green/10 text-neon-green border border-neon-green/30">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-electric-blue/10 text-electric-blue border border-electric-blue/30">
                                  Completed
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-white font-mono">{t.registrations?.length || 0} Players</td>
                            <td className="py-4 px-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setTournamentForm({ id: t._id, title: t.title, description: t.description, date: t.date, prizePool: t.prizePool, entryFee: t.entryFee, image: t.image, status: t.status, winners: t.winners || '' });
                                    setIsTournamentModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleTournamentDelete(t._id)}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeTab === 'inventory' ? (
                /* ================= TAB: INVENTORY ================= */
                <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-neon-green" />
                      Inventory Management ({inventoryItems.length})
                    </h3>
                    <button
                      onClick={() => {
                        setInvItemName('');
                        setInvItemPrice('');
                        setInvItemStock('');
                        setEditingInvItem(null);
                        setShowInvModal(true);
                      }}
                      className="px-4 py-2 bg-neon-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:scale-102 transition-all neon-glow"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                          <th className="py-4 px-3">Item Name</th>
                          <th className="py-4 px-3">Price</th>
                          <th className="py-4 px-3">Stock Level</th>
                          <th className="py-4 px-3">Status</th>
                          <th className="py-4 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                        {inventoryItems.map((item) => (
                          <tr key={item._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-3 text-white font-extrabold">{item.name}</td>
                            <td className="py-4 px-3 text-neon-green font-mono">₹{item.price}</td>
                            <td className="py-4 px-3 font-mono">
                              {item.stock} <span className="text-gray-500 text-[10px]">units</span>
                            </td>
                            <td className="py-4 px-3">
                              {item.stock > 10 ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-neon-green/10 text-neon-green border border-neon-green/30">In Stock</span>
                              ) : item.stock > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">Low Stock</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/30">Out of Stock</span>
                              )}
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setInvItemName(item.name);
                                    setInvItemPrice(item.price);
                                    setInvItemStock(item.stock);
                                    setEditingInvItem(item);
                                    setShowInvModal(true);
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleInventoryDelete(item._id)}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ================= TAB 4: USERS DIRECTORY ================= */
                <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-neon-green" />
                      Registered Club Members ({usersList.length})
                    </h3>
                    <button
                      onClick={() => {
                        const headers = ['Name', 'Email', 'Role', 'Membership Tier', 'Joined Date'];
                        const rows = usersList.map(m => [
                          m.name || '',
                          m.email || '',
                          m.role || 'user',
                          m.membership || 'None',
                          new Date(m.createdAt).toLocaleDateString()
                        ]);
                        downloadCSV(headers, rows, 'registered_members');
                      }}
                      className="px-3 py-2 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export to Excel
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 uppercase font-black tracking-widest">
                          <th className="py-4 px-3">Name</th>
                          <th className="py-4 px-3">Email Address</th>
                          <th className="py-4 px-3">Role</th>
                          <th className="py-4 px-3">Active Membership</th>
                          <th className="py-4 px-3">Upgrade Date</th>
                          <th className="py-4 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300 font-bold uppercase tracking-wider">
                        {usersList.map((m) => (
                          <tr key={m._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-3 text-white font-extrabold">{m.name}</td>
                            <td className="py-4 px-3 lowercase font-normal">{m.email}</td>
                            <td className="py-4 px-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                m.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-gray-400'
                              }`}>
                                {m.role}
                              </span>
                            </td>
                            <td className="py-4 px-3">
                              <span className={`text-[10px] font-extrabold ${
                                m.membership === 'Elite'
                                  ? 'text-neon-green'
                                  : m.membership === 'Pro'
                                  ? 'text-electric-blue'
                                  : m.membership === 'Basic'
                                  ? 'text-white'
                                  : 'text-gray-500'
                              }`}>
                                {m.membership}
                              </span>
                            </td>
                            <td className="py-4 px-3 font-normal text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setUserForm({ id: m._id, name: m.name, email: m.email, role: m.role, membership: m.membership });
                                    setIsUserModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleUserDelete(m._id)}
                                  disabled={user && user.id === m._id}
                                  className={`px-2 py-1 rounded text-[10px] transition-all ${
                                    user && user.id === m._id 
                                      ? 'opacity-30 cursor-not-allowed bg-gray-500/10 text-gray-500' 
                                      : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================== */}
            {/* CRUD OVERLAY GLASSMOPHISM MODALS */}
            {/* ========================================== */}

            {/* 1. COURT / ARENA MODAL */}
            {isCourtModalOpen && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border-white/10 shadow-2xl relative">
                  <button 
                    onClick={() => setIsCourtModalOpen(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-neon-green" />
                    {courtForm.id ? 'Edit Arena Details' : 'Add New Arena'}
                  </h3>
                  
                  <form onSubmit={handleCourtSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Arena Name</label>
                        <input 
                          type="text"
                          value={courtForm.name}
                          onChange={(e) => setCourtForm({...courtForm, name: e.target.value})}
                          placeholder="e.g. Center Court"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Surface Type</label>
                        <select
                          value={courtForm.surface}
                          onChange={(e) => setCourtForm({...courtForm, surface: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                          required
                        >
                          <option value="">Select Surface</option>
                          <option value="Acrylic" className="bg-sport-dark text-white">Acrylic Hard</option>
                          <option value="Cushion Acrylic" className="bg-sport-dark text-white">Cushion Acrylic</option>
                          <option value="Outdoor Turf" className="bg-sport-dark text-white">Outdoor Turf</option>
                          <option value="Clay" className="bg-sport-dark text-white">Clay</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Base Price (₹/hr)</label>
                        <input 
                          type="number"
                          value={courtForm.basePrice}
                          onChange={(e) => setCourtForm({...courtForm, basePrice: e.target.value})}
                          placeholder="600"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Peak Price (₹/hr)</label>
                        <input 
                          type="number"
                          value={courtForm.peakPrice}
                          onChange={(e) => setCourtForm({...courtForm, peakPrice: e.target.value})}
                          placeholder="1000"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Image URL</label>
                      <input 
                        type="text"
                        value={courtForm.image}
                        onChange={(e) => setCourtForm({...courtForm, image: e.target.value})}
                        placeholder="/images/court-center.jpg or online URL"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Description</label>
                      <textarea 
                        value={courtForm.description}
                        onChange={(e) => setCourtForm({...courtForm, description: e.target.value})}
                        placeholder="Provide a stunning showcase tagline..."
                        rows="3"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input 
                        type="checkbox"
                        id="court-active"
                        checked={courtForm.isActive}
                        onChange={(e) => setCourtForm({...courtForm, isActive: e.target.checked})}
                        className="w-4 h-4 rounded border-white/10 bg-black/50 text-neon-green focus:ring-0 outline-none cursor-pointer"
                      />
                      <label htmlFor="court-active" className="text-[10px] text-white uppercase tracking-wider font-bold cursor-pointer select-none">
                        Arena Active (Visible for public booking)
                      </label>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setIsCourtModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-neon-green text-black text-xs font-extrabold uppercase tracking-wider rounded-xl hover:scale-102 transition-all neon-glow"
                      >
                        Save Arena
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 2. COACH PROFILE MODAL */}
            {isCoachModalOpen && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border-white/10 shadow-2xl relative">
                  <button 
                    onClick={() => setIsCoachModalOpen(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-neon-green" />
                    {coachForm.id ? 'Edit Coach Profile' : 'Add Coach Profile'}
                  </h3>
                  
                  <form onSubmit={handleCoachSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Coach Name</label>
                        <input 
                          type="text"
                          value={coachForm.name}
                          onChange={(e) => setCoachForm({...coachForm, name: e.target.value})}
                          placeholder="e.g. John Doe"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Experience (Years)</label>
                        <input 
                          type="number"
                          value={coachForm.experience}
                          onChange={(e) => setCoachForm({...coachForm, experience: e.target.value})}
                          placeholder="8"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Session Rate (₹)</label>
                        <input 
                          type="number"
                          value={coachForm.pricePerSession}
                          onChange={(e) => setCoachForm({...coachForm, pricePerSession: e.target.value})}
                          placeholder="1500"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Specialization (Comma separated)</label>
                        <input 
                          type="text"
                          value={coachForm.specialization}
                          onChange={(e) => setCoachForm({...coachForm, specialization: e.target.value})}
                          placeholder="Pickleball, Tennis, Tactics"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Avatar Image URL</label>
                      <input 
                        type="text"
                        value={coachForm.image}
                        onChange={(e) => setCoachForm({...coachForm, image: e.target.value})}
                        placeholder="/images/coach-david.jpg or online URL"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Biography</label>
                      <textarea 
                        value={coachForm.bio}
                        onChange={(e) => setCoachForm({...coachForm, bio: e.target.value})}
                        placeholder="Tell players about their qualifications..."
                        rows="4"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                        required
                      />
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setIsCoachModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-neon-green text-black text-xs font-extrabold uppercase tracking-wider rounded-xl hover:scale-102 transition-all neon-glow"
                      >
                        Save Profile
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 3. TOURNAMENT MODAL */}
            {isTournamentModalOpen && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border-white/10 shadow-2xl relative">
                  <button 
                    onClick={() => setIsTournamentModalOpen(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-neon-green" />
                    {tournamentForm.id ? 'Edit Tournament Details' : 'Launch New Tournament'}
                  </h3>
                  
                  <form onSubmit={handleTournamentSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Tournament Title</label>
                        <input 
                          type="text"
                          value={tournamentForm.title}
                          onChange={(e) => setTournamentForm({...tournamentForm, title: e.target.value})}
                          placeholder="e.g. Summer Smash Cup"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Tournament Date</label>
                        <input 
                          type="date"
                          value={tournamentForm.date}
                          onChange={(e) => setTournamentForm({...tournamentForm, date: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Prize Pool Description</label>
                        <input 
                          type="text"
                          value={tournamentForm.prizePool}
                          onChange={(e) => setTournamentForm({...tournamentForm, prizePool: e.target.value})}
                          placeholder="e.g. ₹50,000 Cash Prize"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Entry Fee (₹)</label>
                        <input 
                          type="number"
                          value={tournamentForm.entryFee}
                          onChange={(e) => setTournamentForm({...tournamentForm, entryFee: e.target.value})}
                          placeholder="e.g. 500"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Status</label>
                        <select
                          value={tournamentForm.status}
                          onChange={(e) => setTournamentForm({...tournamentForm, status: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                          required
                        >
                          <option value="upcoming" className="bg-sport-dark text-white">Upcoming</option>
                          <option value="active" className="bg-sport-dark text-white">Active / Ongoing</option>
                          <option value="completed" className="bg-sport-dark text-white">Completed</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Winners (Optional)</label>
                        <input 
                          type="text"
                          value={tournamentForm.winners}
                          onChange={(e) => setTournamentForm({...tournamentForm, winners: e.target.value})}
                          placeholder="e.g. John Doe & Jane Smith"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Image Poster URL</label>
                      <input 
                        type="text"
                        value={tournamentForm.image}
                        onChange={(e) => setTournamentForm({...tournamentForm, image: e.target.value})}
                        placeholder="/images/tournament-banner.jpg or online URL"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Description</label>
                      <textarea 
                        value={tournamentForm.description}
                        onChange={(e) => setTournamentForm({...tournamentForm, description: e.target.value})}
                        placeholder="Detail tournament format, rules, dynamic schedules list, and terms..."
                        rows="3"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                        required
                      />
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setIsTournamentModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-neon-green text-black text-xs font-extrabold uppercase tracking-wider rounded-xl hover:scale-102 transition-all neon-glow"
                      >
                        Save Tournament
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 4. USER ACCESS & PASS MODAL */}
            {isUserModalOpen && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-md p-8 rounded-3xl border-white/10 shadow-2xl relative">
                  <button 
                    onClick={() => setIsUserModalOpen(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-green" />
                    Edit Member Profile
                  </h3>
                  
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Member Name</label>
                      <input 
                        type="text"
                        value={userForm.name}
                        className="bg-white/5 border border-white/5 text-gray-400 rounded-xl px-4 py-3 text-xs outline-none cursor-not-allowed font-bold"
                        readOnly
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Email Address</label>
                      <input 
                        type="text"
                        value={userForm.email}
                        className="bg-white/5 border border-white/5 text-gray-400 rounded-xl px-4 py-3 text-xs outline-none cursor-not-allowed"
                        readOnly
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Access Role</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                          required
                        >
                          <option value="user" className="bg-sport-dark text-white">Regular Member (User)</option>
                          <option value="admin" className="bg-sport-dark text-white">Club Administrator (Admin)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Active Membership</label>
                        <select
                          value={userForm.membership}
                          onChange={(e) => setUserForm({...userForm, membership: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                          required
                        >
                          <option value="None" className="bg-sport-dark text-white">No Active Pass (None)</option>
                          <option value="Basic" className="bg-sport-dark text-white">Basic Play Pass (Basic)</option>
                          <option value="Pro" className="bg-sport-dark text-white">Pro Elite Pass (Pro)</option>
                          <option value="Elite" className="bg-sport-dark text-white">Elite Unlimited Pass (Elite)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setIsUserModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-neon-green text-black text-xs font-extrabold uppercase tracking-wider rounded-xl hover:scale-102 transition-all neon-glow"
                      >
                        Save Profile
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* INVENTORY ITEM MODAL */}
            {showInvModal && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border-white/10 shadow-2xl relative animate-fade-in">
                  <button 
                    onClick={() => setShowInvModal(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-xl font-black text-white uppercase tracking-wider mb-8">
                    {editingInvItem ? 'Edit Inventory Item' : 'New Inventory Item'}
                  </h3>

                  <form onSubmit={handleInventorySubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Name</label>
                      <input 
                        type="text" 
                        required
                        value={invItemName}
                        onChange={(e) => setInvItemName(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 outline-none transition-all"
                        placeholder="e.g. Premium Racket"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          value={invItemPrice}
                          onChange={(e) => setInvItemPrice(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          value={invItemStock}
                          onChange={(e) => setInvItemStock(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-sm text-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setShowInvModal(false)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-neon-green text-black text-xs font-extrabold uppercase tracking-wider rounded-xl hover:scale-102 transition-all neon-glow"
                      >
                        Save Item
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 5. COACHING COURSE MODAL */}
            {isCoachingCourseModalOpen && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border-white/10 shadow-2xl relative animate-fade-in">
                  <button 
                    onClick={() => setIsCoachingCourseModalOpen(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-neon-green" />
                    {coachingCourseForm.id ? 'Edit Coaching Course' : 'Create Coaching Course'}
                  </h3>
                  
                  <form onSubmit={handleCoachingCourseSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Course Title</label>
                        <input 
                          type="text"
                          value={coachingCourseForm.title}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, title: e.target.value})}
                          placeholder="e.g. 10 Days Badminton Summer Camp"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Duration Description</label>
                        <input 
                          type="text"
                          value={coachingCourseForm.duration}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, duration: e.target.value})}
                          placeholder="e.g. 10 Days, 2 Months"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Schedule Info</label>
                        <input 
                          type="text"
                          value={coachingCourseForm.schedule}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, schedule: e.target.value})}
                          placeholder="e.g. Mon, Wed, Fri 4:00 PM"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Start Date</label>
                        <input 
                          type="date"
                          value={coachingCourseForm.startDate}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, startDate: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">End Date</label>
                        <input 
                          type="date"
                          value={coachingCourseForm.endDate}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, endDate: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Price (₹)</label>
                        <input 
                          type="number"
                          value={coachingCourseForm.price}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, price: e.target.value})}
                          placeholder="3000"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Capacity Slots</label>
                        <input 
                          type="number"
                          value={coachingCourseForm.slotsTotal}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, slotsTotal: e.target.value})}
                          placeholder="20"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Status</label>
                        <select
                          value={coachingCourseForm.status}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, status: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                          required
                        >
                          <option value="upcoming" className="bg-sport-dark text-white">Upcoming</option>
                          <option value="active" className="bg-sport-dark text-white">Active</option>
                          <option value="completed" className="bg-sport-dark text-white">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Assign Coach</label>
                        <select
                          value={coachingCourseForm.coach}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, coach: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                          required
                        >
                          <option value="">-- Select Coach --</option>
                          {coachesList.map((coach) => (
                            <option key={coach._id} value={coach._id} className="bg-sport-dark text-white">
                              {coach.name} ({coach.specialization?.join(', ') || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Image URL</label>
                        <input 
                          type="text"
                          value={coachingCourseForm.image}
                          onChange={(e) => setCoachingCourseForm({...coachingCourseForm, image: e.target.value})}
                          placeholder="/images/course-badminton.jpg"
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Course Description</label>
                      <textarea 
                        value={coachingCourseForm.description}
                        onChange={(e) => setCoachingCourseForm({...coachingCourseForm, description: e.target.value})}
                        placeholder="Detail training syllabus, level required, gear and requirements..."
                        rows="3"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all"
                        required
                      />
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setIsCoachingCourseModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-neon-green text-black text-xs font-extrabold uppercase tracking-wider rounded-xl hover:scale-102 transition-all neon-glow"
                      >
                        Save Course
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 6. COACHING ENROLLMENT CRUD FORM MODAL */}
            {isEnrollmentModalOpen && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-md p-8 rounded-3xl border-white/10 shadow-2xl relative animate-fade-in">
                  <button 
                    onClick={() => setIsEnrollmentModalOpen(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-green" />
                    {enrollmentForm.id ? 'Modify Course Enrollment' : 'Enroll Player in Course'}
                  </h3>
                  
                  <form onSubmit={handleCoachingEnrollmentSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Select Player (Member)</label>
                      <select
                        value={enrollmentForm.userId}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, userId: e.target.value})}
                        disabled={!!enrollmentForm.id} // User ID is read-only on update
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider disabled:opacity-50"
                        required
                      >
                        <option value="">-- Choose Member --</option>
                        {usersList.map((usr) => (
                          <option key={usr._id} value={usr._id} className="bg-sport-dark text-white">
                            {usr.name} ({usr.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Choose Academy Course</label>
                      <select
                        value={enrollmentForm.courseId}
                        onChange={(e) => {
                          const course = coursesList.find(c => c._id === e.target.value);
                          setEnrollmentForm({
                            ...enrollmentForm,
                            courseId: e.target.value,
                            amountPaid: course ? (user?.role === 'reception' ? 0 : course.price) : enrollmentForm.amountPaid
                          });
                        }}
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                        required
                      >
                        <option value="">-- Choose Course --</option>
                        {coursesList.map((course) => (
                          <option key={course._id} value={course._id} className="bg-sport-dark text-white">
                            {course.title} ({user?.role === 'reception' ? '' : `₹${course.price} | `}{course.slotsEnrolled}/{course.slotsTotal} Slots)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={`grid ${user?.role === 'reception' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                      {user?.role !== 'reception' && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Amount Paid (₹)</label>
                          <input 
                            type="number"
                            value={enrollmentForm.amountPaid}
                            onChange={(e) => setEnrollmentForm({...enrollmentForm, amountPaid: e.target.value})}
                            placeholder="e.g. 3000"
                            className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                            required={user?.role !== 'reception'}
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Enrollment Status</label>
                        <select
                          value={enrollmentForm.status}
                          onChange={(e) => setEnrollmentForm({...enrollmentForm, status: e.target.value})}
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-neon-green/50 cursor-pointer font-bold uppercase tracking-wider"
                          required
                        >
                          <option value="active" className="bg-sport-dark text-white">Active</option>
                          <option value="completed" className="bg-sport-dark text-white">Completed</option>
                          <option value="cancelled" className="bg-sport-dark text-white">Cancelled</option>
                          <option value="inactive" className="bg-sport-dark text-white">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {enrollmentForm.id && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Attendance Dates Log (JSON Array format)</label>
                        <input 
                          type="text"
                          value={JSON.stringify(enrollmentForm.attendance || [])}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              if (Array.isArray(parsed)) {
                                setEnrollmentForm({...enrollmentForm, attendance: parsed});
                              }
                            } catch (err) { /* ignore partial invalid input typing */ }
                          }}
                          placeholder='["2026-05-21"]'
                          className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-green/50 transition-all font-mono"
                        />
                      </div>
                    )}

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setIsEnrollmentModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-neon-green text-black text-xs font-extrabold uppercase tracking-wider rounded-xl hover:scale-102 transition-all neon-glow"
                      >
                        {enrollmentForm.id ? 'Save Changes' : 'Confirm Enrollment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 7. MANUAL STUDENT ATTENDANCE LOG MODAL */}
            {isAttendanceModalOpen && selectedEnrollmentForAttendance && (
              <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/75 backdrop-blur-md overflow-y-auto transition-all duration-300">
                <div className="glass-panel w-full max-w-md p-8 rounded-3xl border-white/10 shadow-2xl relative animate-fade-in text-left">
                  <button 
                    onClick={() => {
                      setIsAttendanceModalOpen(false);
                      setSelectedEnrollmentForAttendance(null);
                    }}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-green/10 text-neon-green flex items-center justify-center font-extrabold border border-neon-green/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">Attendance Register</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Academy Coaching Program logs</p>
                    </div>
                  </div>

                  <div className="bg-black/45 p-4 rounded-xl border border-white/5 mb-6 text-xs space-y-1">
                    <div>
                      <span className="text-gray-500 uppercase tracking-widest text-[8px] font-bold">Student Name</span>
                      <p className="text-white font-extrabold">{selectedEnrollmentForAttendance.user?.name || 'Valued student'}</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-gray-500 uppercase tracking-widest text-[8px] font-bold">Course Program</span>
                      <p className="text-neon-green font-extrabold">{selectedEnrollmentForAttendance.course?.title || 'Academy coaching'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Select Date to Check-In</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={attendanceDatePicker}
                          onChange={(e) => setAttendanceDatePicker(e.target.value)}
                          className="flex-1 bg-black/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-green/50 transition-all font-mono font-bold"
                        />
                        <button
                          onClick={async () => {
                            if (!attendanceDatePicker) return;
                            if (selectedEnrollmentForAttendance.attendance?.includes(attendanceDatePicker)) {
                              showToast("Student is already checked in for this date!", "error");
                              return;
                            }
                            const updated = [...(selectedEnrollmentForAttendance.attendance || []), attendanceDatePicker];
                            
                            try {
                              const res = await fetch(`${API_BASE_URL}/admin/enrollments/${selectedEnrollmentForAttendance._id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ attendance: updated })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setSelectedEnrollmentForAttendance(data.enrollment);
                                showToast(`Checked in present for ${attendanceDatePicker}!`, 'success');
                                fetchAdminData(); // refresh admin view list
                              } else {
                                const err = await res.json();
                                showToast(err.error || "Failed to log attendance", "error");
                              }
                            } catch (e) {
                              showToast("Connection failed", "error");
                            }
                          }}
                          className="px-4 bg-neon-green hover:bg-neon-green/90 text-charcoal font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Check In
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block mb-3">Attendance Biodata log dates</span>
                      {selectedEnrollmentForAttendance.attendance && selectedEnrollmentForAttendance.attendance.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {selectedEnrollmentForAttendance.attendance.map((dateStr) => (
                            <div key={dateStr} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs">
                              <span className="font-mono font-bold text-white">{dateStr}</span>
                              <button
                                  onClick={async () => {
                                    const updated = selectedEnrollmentForAttendance.attendance.filter(d => d !== dateStr);
                                    try {
                                      const res = await fetch(`${API_BASE_URL}/admin/enrollments/${selectedEnrollmentForAttendance._id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ attendance: updated })
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        setSelectedEnrollmentForAttendance(data.enrollment);
                                        showToast(`Removed check-in date: ${dateStr}!`, 'success');
                                        fetchAdminData(); // refresh list
                                      } else {
                                        const err = await res.json();
                                        showToast(err.error || "Failed to remove date", "error");
                                      }
                                    } catch (e) {
                                      showToast("Connection failed", "error");
                                    }
                                  }}
                                className="text-red-400 hover:text-red-300 font-bold transition-all text-[10px]"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-gray-500 font-bold uppercase tracking-wider border border-dashed border-white/10 rounded-xl">
                          No dates recorded yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4">
                    <button
                      onClick={() => {
                        setIsAttendanceModalOpen(false);
                        setSelectedEnrollmentForAttendance(null);
                      }}
                      className="w-full py-3 bg-white/5 border border-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Done / Close logs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 8. PREMIUM DETAILED INVOICE PDF OVERLAY MODAL */}
            <InvoiceModal
              isOpen={invoiceModalOpen}
              onClose={() => {
                setInvoiceModalOpen(false);
                setInvoiceModalData(null);
              }}
              invoiceData={invoiceModalData}
            />

            {/* 7. PREMIUM GLASSMORPHIC QR CODE PASS PREVIEW MODAL */}
            {(selectedBookingForQr || selectedEnrollmentForQr) && (() => {
              const passTitle = selectedBookingForQr ? 'Court Reservation Pass' : 'Coaching Program Pass';
              const playerName = selectedBookingForQr ? (selectedBookingForQr.user?.name || 'System Admin') : (selectedEnrollmentForQr.user?.name || 'N/A');
              const playerEmail = selectedBookingForQr ? (selectedBookingForQr.user?.email || 'N/A') : (selectedEnrollmentForQr.user?.email || 'N/A');
              const qrValue = selectedBookingForQr ? (selectedBookingForQr.qrCodeData || `CY-CENT-${selectedBookingForQr._id}`) : (selectedEnrollmentForQr.qrCodeData || `CY-ENROLL-${selectedEnrollmentForQr.course?._id || selectedEnrollmentForQr.course}-${selectedEnrollmentForQr.user?._id || selectedEnrollmentForQr.user}`);
              const detail1 = selectedBookingForQr ? `Arena: ${selectedBookingForQr.court?.name || 'N/A'}` : `Course: ${selectedEnrollmentForQr.course?.title || 'N/A'}`;
              const detail2 = selectedBookingForQr ? `Play Date: ${selectedBookingForQr.date}` : `Schedule: ${selectedEnrollmentForQr.course?.schedule || 'N/A'}`;
              const detail3 = selectedBookingForQr ? `Time Slots: ${selectedBookingForQr.slots?.map(s => `${s}:00`).join(', ')}` : `Assigned Coach: ${selectedEnrollmentForQr.course?.coach?.name || selectedEnrollmentForQr.course?.coachName || 'Unassigned'}`;
              const passId = selectedBookingForQr ? `CY-BOOKING-${selectedBookingForQr._id.substring(18)}` : `CY-ENROLLMENT-${selectedEnrollmentForQr._id.substring(18)}`;

              return (
                <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/80 backdrop-blur-md overflow-y-auto transition-all duration-300">
                  <div className="glass-panel w-full max-w-sm p-8 rounded-[2rem] border-white/10 shadow-2xl relative text-center overflow-hidden animate-fade-in border-neon-green/30">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-neon-green to-electric-blue" />
                    
                    <button 
                      onClick={() => {
                        setSelectedBookingForQr(null);
                        setSelectedEnrollmentForQr(null);
                      }}
                      className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>

                    <span className="text-[9px] text-neon-green uppercase tracking-widest font-black block mt-2">{passTitle}</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mt-1">{playerName}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 lowercase">{playerEmail}</p>

                    {/* QR Code Container */}
                    <div className="my-8 mx-auto p-4 bg-white rounded-3xl w-max shadow-2xl border-4 border-electric-blue/40 neon-glow">
                      <QRCode 
                        value={qrValue} 
                        size={180} 
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                      />
                    </div>

                    {/* QR String info */}
                    <span className="text-[10px] font-mono font-bold text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl uppercase block w-full truncate">
                      {qrValue}
                    </span>

                    {/* Details Box */}
                    <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/5 text-left space-y-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Service</span>
                        <span className="text-white truncate max-w-[200px]">{detail1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Schedule</span>
                        <span className="text-white">{detail2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Details</span>
                        <span className="text-neon-green truncate max-w-[200px]">{detail3}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/5 text-[9px] text-gray-500 font-mono">
                        <span>PASS ID</span>
                        <span>{passId}</span>
                      </div>
                    </div>

                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-6">
                      Verify check-in by scanning this pass at frontdesk
                    </p>
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
