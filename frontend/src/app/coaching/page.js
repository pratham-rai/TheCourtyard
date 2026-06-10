// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\coaching\page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Star, Calendar, Clock, CheckCircle, BookOpen, ArrowRight, ShieldCheck, RefreshCw, Sparkles, User, Users } from 'lucide-react';

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

export default function Coaching() {
  const router = useRouter();
  const { user, setUser, token, API_BASE_URL, showToast } = useApp();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [enrollmentConfirmed, setEnrollmentConfirmed] = useState(null);
  const [useWallet, setUseWallet] = useState(false);

  // Fallback courses in case backend is loading or offline
  const fallbackCourses = [
    {
      _id: 'c1',
      title: '10 Days Summer Camp',
      description: 'Master the kitchen, perfect your paddle positioning, and dominate baseline battles in this intense summer training camp.',
      duration: '10 Days',
      startDate: '2026-06-01',
      endDate: '2026-06-10',
      price: 3000,
      slotsTotal: 15,
      slotsEnrolled: 4,
      coach: { name: 'Coach Sarah Jenkins', rating: 4.8, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', experience: 6 },
      schedule: 'Mon, Wed, Fri @ 16:00-17:30',
      image: 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=600',
      status: 'active'
    },
    {
      _id: 'c2',
      title: '2 Months Professional Course',
      description: 'An elite 2-month professional course focusing on high-speed kitchen reflex counter attacks, advanced spin serves, and tactical championship mindset.',
      duration: '2 Months',
      startDate: '2026-06-15',
      endDate: '2026-08-15',
      price: 12000,
      slotsTotal: 10,
      slotsEnrolled: 2,
      coach: { name: 'Coach Pratham Raj', rating: 4.9, image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=400', experience: 8 },
      schedule: 'Tue, Thu, Sat @ 18:00-19:30',
      image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600',
      status: 'upcoming'
    }
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    async function fetchCourses() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/coaching/courses`);
        if (res.ok) {
          const data = await res.json();
          if (data.length) {
            setCourses(data);
            setSelectedCourse(data[0]);
          } else {
            setCourses(fallbackCourses);
            setSelectedCourse(fallbackCourses[0]);
          }
        } else {
          setCourses(fallbackCourses);
          setSelectedCourse(fallbackCourses[0]);
        }
      } catch (err) {
        setCourses(fallbackCourses);
        setSelectedCourse(fallbackCourses[0]);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();

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
        console.error("Error refreshing user profile in coaching:", err);
      }
    }
    fetchUserProfile();
  }, [token, router]);

  const calculatePricing = () => {
    if (!selectedCourse) return { base: 0, discount: 0, final: 0 };
    const base = selectedCourse.price;
    let discountPercent = 0;

    if (user) {
      if (user.membership === 'Pro') discountPercent = 0.10; // 10%
      else if (user.membership === 'Elite') discountPercent = 0.20; // 20%
    }

    const discount = base * discountPercent;
    const final = base - discount;
    return { base, discount, final };
  };

  const { base, discount, final } = calculatePricing();
  const netPayable = useWallet ? Math.max(0, final - (user?.walletBalance || 0)) : final;

  const handleEnrollClick = () => {
    if (!user) {
      showToast('Please sign in to enroll in coaching courses!', 'error');
      router.push('/auth');
      return;
    }

    if (!selectedCourse) {
      showToast('Please select a course first!', 'error');
      return;
    }

    if (selectedCourse.slotsEnrolled >= selectedCourse.slotsTotal) {
      showToast('This course is already fully enrolled!', 'error');
      return;
    }

    const { final } = calculatePricing();
    const isFullWallet = useWallet && (user.walletBalance || 0) >= final;

    if (isFullWallet) {
      // Direct full-wallet checkout, no Razorpay simulation needed!
      handleConfirmEnrollment('WALLET-FULL');
    } else {
      setCheckoutModal(true);
    }
  };

  const handleConfirmEnrollment = async (paymentId = '') => {
    setCheckoutModal(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/coaching/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          useWallet: useWallet,
          paymentId: paymentId || `MOCK-ENROLL-${Date.now().toString().slice(6)}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enroll in coaching course');
      }

      setEnrollmentConfirmed(data.enrollment);
      // Update local slotsEnrolled
      setCourses(courses.map(c => c._id === selectedCourse._id ? { ...c, slotsEnrolled: c.slotsEnrolled + 1 } : c));
      setSelectedCourse({ ...selectedCourse, slotsEnrolled: selectedCourse.slotsEnrolled + 1 });
      showToast('Successfully Enrolled in Course!', 'success');

      // Refresh profile data to update wallet balances in AppContext
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
        console.error("Error refreshing profile after coaching enrollment:", err);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-electric-blue/[0.03] to-transparent pointer-events-none" />

        {enrollmentConfirmed ? (
          /* ================= SUCCESS CONFIRMATION DRAW ================= */
          <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-electric-blue/30 shadow-2xl text-center relative overflow-hidden animate-bounce-short z-10 my-10">
            <div className="w-16 h-16 rounded-full bg-electric-blue/10 text-electric-blue border border-electric-blue/30 flex items-center justify-center mx-auto mb-6 blue-glow">
              <CheckCircle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="text-3xl font-black text-white uppercase tracking-wider">Enrollment Complete!</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Your Training Pass is Active</p>

            <hr className="border-white/5 my-8" />

            <div className="grid grid-cols-2 gap-6 text-left mb-8 max-w-md mx-auto">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Course Title</span>
                <span className="text-sm font-bold text-white mt-0.5">{selectedCourse.title}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Assigned Coach</span>
                <span className="text-sm font-bold text-electric-blue mt-0.5">{selectedCourse.coach?.name || 'Unassigned'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Schedule</span>
                <span className="text-sm font-bold text-white mt-0.5">{selectedCourse.schedule}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Amount Paid</span>
                <span className="text-sm font-bold text-neon-green mt-0.5">₹{enrollmentConfirmed.amountPaid}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-8">
              Congratulations! Your check-in pass has been activated. Please access your user dashboard to view your QR check-in voucher and attendance tracker.
            </p>

            <div className="flex gap-4 max-w-xs mx-auto">
              <button
                onClick={() => setEnrollmentConfirmed(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Browse Courses
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 bg-electric-blue text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-electric-blue/30 text-center flex items-center justify-center font-bold"
              >
                Go Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ================= STANDARD COURSE LISTINGS CONTENT ================= */
          <div className="relative z-10">
            
            {/* Header */}
            <div className="mb-10">
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-electric-blue">Elite Pickleball Academy</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white mt-1">Academy Coaching Programs</h2>
              <p className="text-sm text-gray-400 mt-2">Enroll in our professional courses and multi-day camps. Train with direct coaching, group dynamics, and tracked QR attendance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Side: Courses listings (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                {loading ? (
                  <div className="glass-panel p-12 rounded-2xl text-center text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-electric-blue" />
                    Syncing courses registry...
                  </div>
                ) : courses.length ? (
                  courses.map((course) => {
                    const isSel = selectedCourse && selectedCourse._id === course._id;
                    const spotsLeft = course.slotsTotal - course.slotsEnrolled;
                    return (
                      <div
                        key={course._id}
                        onClick={() => setSelectedCourse(course)}
                        className={`cursor-pointer glass-panel p-6 rounded-2xl border transition-all duration-300 transform hover:scale-101 flex flex-col md:flex-row gap-6 items-stretch ${
                          isSel ? 'border-electric-blue/60 bg-electric-blue/[0.01] blue-glow' : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="w-full md:w-52 h-44 rounded-xl overflow-hidden bg-sport-dark shrink-0 relative">
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 px-2 py-1 bg-black/75 backdrop-blur-sm rounded text-[9px] font-black uppercase tracking-wider text-electric-blue border border-electric-blue/20">
                            {course.duration}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                                {course.title}
                              </h3>
                              <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-neon-green text-[10px] font-black uppercase tracking-wider rounded">
                                ₹{course.price}
                              </span>
                            </div>

                            <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">
                              {course.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-4 text-[10px] text-gray-400">
                              <div className="flex items-center gap-1.5 font-bold uppercase">
                                <Calendar className="w-3.5 h-3.5 text-electric-blue" />
                                <span>{formatDateDMY(course.startDate)} to {formatDateDMY(course.endDate)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-bold uppercase">
                                <Clock className="w-3.5 h-3.5 text-electric-blue" />
                                <span>{course.schedule}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/5">
                            {/* Assigned Coach details */}
                            {course.coach ? (
                              <div className="flex items-center gap-2">
                                <img src={course.coach.image} alt={course.coach.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                <div className="flex flex-col">
                                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Lead Coach</span>
                                  <span className="text-xs text-white font-extrabold">{course.coach.name}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-bold uppercase">Coach Assigned Soon</span>
                            )}

                            {/* Capacity Tag */}
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              spotsLeft <= 3 
                                ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                                : 'bg-neon-green/10 border border-neon-green/20 text-neon-green'
                            }`}>
                              {spotsLeft === 0 ? 'Sold Out' : spotsLeft <= 3 ? `Only ${spotsLeft} Spots Left!` : `${spotsLeft} Spots Available`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="glass-panel p-12 rounded-2xl text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
                    No active coaching programs found. Check back soon!
                  </div>
                )}

                {/* Information Callout */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-gradient-to-r from-electric-blue/[0.02] to-transparent flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-electric-blue/10 text-electric-blue border border-electric-blue/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Academy Smart Attendance System</h4>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      Our new Coaching Registry runs on a daily check-in system. Upon enrollment, you will receive a digital training voucher. Simply present the QR code at the desk or to your coach before the session starts to log your attendance in real-time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Visual Checkout Panel (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="glass-panel p-6 rounded-2xl border-white/5 sticky top-28 shadow-2xl flex flex-col">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-electric-blue" />
                    Enrollment Planner
                  </h3>

                  {selectedCourse ? (
                    <div className="flex flex-col h-full">
                      {/* Selected Course Overview */}
                      <div className="bg-black/40 border border-white/5 p-4 rounded-xl mb-6">
                        <span className="text-[9px] text-electric-blue uppercase tracking-widest font-bold block mb-1">Selected Program</span>
                        <h4 className="text-base font-black text-white uppercase leading-snug">{selectedCourse.title}</h4>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-3">{selectedCourse.description}</p>
                        
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-[10px] text-gray-400">
                          <div className="flex justify-between">
                            <span>Duration</span>
                            <span className="text-white font-bold">{selectedCourse.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Schedule</span>
                            <span className="text-white font-bold">{selectedCourse.schedule}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Instructor</span>
                            <span className="text-electric-blue font-bold">{selectedCourse.coach?.name || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing discount box */}
                      <div className="space-y-3.5 text-xs mb-6 border-t border-white/5 pt-5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Program Tuition Fee</span>
                          <span className="text-white font-bold">₹{base}</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between text-neon-green font-bold uppercase tracking-wider">
                            <span>{user?.membership} Membership Drop</span>
                            <span>-₹{discount}</span>
                          </div>
                        )}

                        <hr className="border-white/5" />

                        <div className="flex justify-between items-center pt-1 text-sm">
                          <span className="text-white font-extrabold uppercase">Total Tuition</span>
                          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-white">
                            ₹{final}
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
                              className="w-4 h-4 rounded text-electric-blue bg-black border-white/20 focus:ring-electric-blue disabled:opacity-50"
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
                                <span className="text-neon-green font-bold">-₹{Math.min(user.walletBalance, final)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-white border-t border-white/5 pt-1 mt-1">
                                <span>Net Payable Online:</span>
                                <span>₹{Math.max(0, final - user.walletBalance)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleEnrollClick}
                        disabled={loading || selectedCourse.slotsEnrolled >= selectedCourse.slotsTotal}
                        className="w-full py-3.5 bg-electric-blue text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-electric-blue/30 hover:scale-102 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer neon-glow font-bold"
                      >
                        {loading ? 'Processing...' : selectedCourse.slotsEnrolled >= selectedCourse.slotsTotal ? 'Course Sold Out' : 'Enroll & Reserve Spot'}
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="mt-4 flex items-center justify-center gap-1 text-[8px] text-gray-500 uppercase tracking-widest font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" />
                        SSL Secured Mock Checkout Orders
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs text-gray-500 font-bold uppercase">
                      Select a course program from the directory list to activate enrollment.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* ================= RAZORPAY GATEWAY POPUP SIMULATOR ================= */}
      {checkoutModal && selectedCourse && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-28 pb-12 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="max-w-md w-full bg-[#111116] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs">R</div>
                <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-gray-400">Razorpay Checkout</span>
              </div>
              <button onClick={() => setCheckoutModal(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-xl mb-6">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Tuition Fee</span>
              <span className="text-3xl font-black text-white">₹{netPayable}</span>
              <span className="text-xs text-gray-400 block mt-1">To: The Courtyard Pickleball Academy</span>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-xs text-gray-400 leading-relaxed">
                You are purchasing direct enrollment into <strong>{selectedCourse.title}</strong> led by instructor {selectedCourse.coach?.name || 'Assigned Coach'}. This creates a secure enrollment record and logs the transaction.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCheckoutModal(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmEnrollment(`pay_rzp_${Date.now().toString().slice(5)}`)}
                className="flex-1 py-3 bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-600/30 transition-all font-bold"
              >
                Simulate Success
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
