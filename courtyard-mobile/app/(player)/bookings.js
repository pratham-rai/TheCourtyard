import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import QRCode from 'react-native-qrcode-svg';
import InvoiceModal from '../../components/InvoiceModal';

export default function BookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [useWallet, setUseWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileUser, setProfileUser] = useState(user);

  // New states for parity
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [gstRate, setGstRate] = useState(18);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const slotsList = Array.from({ length: 16 }, (_, i) => i + 6);

  useEffect(() => {
    fetchCourtsAndProfile();
    fetchGstRate();
  }, []);

  const fetchCourtsAndProfile = async () => {
    try {
      const courtsRes = await api.get('/api/courts');
      setCourts(courtsRes.data);
      if (courtsRes.data.length > 0) {
        setSelectedCourt(courtsRes.data[0]);
        setSelectedDate(dates[0]);
        fetchAvailability(courtsRes.data[0]._id, dates[0]);
      }
      const meRes = await api.get('/api/auth/me');
      setProfileUser(meRes.data);
    } catch (err) {
      console.error('Fetch courts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGstRate = async () => {
    try {
      const sRes = await api.get('/api/admin/settings');
      if (sRes.data?.tax_rate !== undefined) setGstRate(sRes.data.tax_rate);
    } catch (e) { console.error(e); }
  };

  const fetchAvailability = async (courtId, date) => {
    try {
      const res = await api.get(`/api/courts/availability?courtId=${courtId}&date=${date}`);
      setBookedSlots(res.data.bookedSlots || []);
      setSelectedSlots([]);
    } catch (err) {
      console.error('Fetch availability error:', err);
    }
  };

  const handleCourtChange = (court) => {
    setSelectedCourt(court);
    if (selectedDate) fetchAvailability(court._id, selectedDate);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedCourt) fetchAvailability(selectedCourt._id, date);
  };

  const handleSlotToggle = (slot) => {
    if (bookedSlots.includes(slot)) return;
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot].sort((a, b) => a - b));
    }
  };

  const calculatePricing = () => {
    if (!selectedCourt) return { total: 0, discountAmount: 0, finalAmount: 0 };
    let total = 0;
    selectedSlots.forEach(slot => {
      const isPeak = (slot >= 6 && slot < 9) || (slot >= 17 && slot < 22);
      total += isPeak ? selectedCourt.peakPrice : selectedCourt.basePrice;
    });

    let discount = 0;
    if (profileUser?.membership === 'Basic') discount = 0.10;
    else if (profileUser?.membership === 'Pro') discount = 0.25;
    else if (profileUser?.membership === 'Elite') discount = 1.00;

    const discountAmount = total * discount;
    const finalAmount = total - discountAmount;
    return { total, discountAmount, finalAmount };
  };

  const { total, discountAmount, finalAmount } = calculatePricing();
  
  // Wallet split logic
  const netPayable = useWallet ? Math.max(0, finalAmount - (profileUser?.walletBalance || 0)) : finalAmount;

  const handleInitiatePayment = () => {
    if (selectedSlots.length === 0) {
      Alert.alert('Error', 'Please select at least one time slot.');
      return;
    }
    const isFullWallet = useWallet && (profileUser?.walletBalance || 0) >= finalAmount;
    if (isFullWallet) {
      handleCompletePayment('WALLET-FULL');
    } else {
      setShowRazorpayModal(true);
    }
  };

  const handleCompletePayment = async (paymentId = '') => {
    setShowRazorpayModal(false);
    setSubmitting(true);
    try {
      const res = await api.post('/api/bookings', {
        courtId: selectedCourt._id,
        date: selectedDate,
        slots: selectedSlots,
        useWallet: useWallet,
        paymentId: paymentId || `pay_rzp_${Date.now().toString().slice(5)}`
      });
      
      setBookingConfirmed(res.data.booking);
      
      // Refresh profile for updated wallet balance
      const meRes = await api.get('/api/auth/me');
      setProfileUser(meRes.data);
    } catch (err) {
      Alert.alert('Booking Failed', err?.response?.data?.error || 'Failed to complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewInvoice = () => {
    if (!bookingConfirmed) return;
    const finalAmt = bookingConfirmed.totalAmount;
    const computedSubtotal = finalAmt / (1 + gstRate / 100);
    const lineItems = [{
      description: `Court Reservation: ${selectedCourt?.name || 'Arena'} (${bookingConfirmed.date})`,
      qty: bookingConfirmed.slots?.length || 1,
      rate: computedSubtotal / (bookingConfirmed.slots?.length || 1)
    }];
    
    setInvoiceData({
      invoiceNo: `INV-${bookingConfirmed._id?.slice(-6).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date(bookingConfirmed.createdAt || Date.now()).toLocaleDateString(),
      type: 'Court Booking',
      member: { name: profileUser?.name, email: profileUser?.email, membership: profileUser?.membership || 'None' },
      items: lineItems,
      subtotal: computedSubtotal,
      discount: discountAmount,
      taxRate: gstRate,
      total: finalAmt,
      paymentMethod: bookingConfirmed.paymentId ? 'card' : 'wallet',
      status: 'success'
    });
    setInvoiceModalOpen(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
        <Text style={styles.loadingText}>Structuring courts catalog...</Text>
      </View>
    );
  }

  // --- RENDER BOOKING CONFIRMED PASS ---
  if (bookingConfirmed) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={[styles.scroll, { justifyContent: 'center', flexGrow: 1 }]}>
          <GlassPanel style={styles.passCard}>
            <View style={styles.passCheckIcon}>
              <Text style={{ fontSize: 32 }}>✓</Text>
            </View>
            <Text style={styles.passTitle}>Booking Confirmed!</Text>
            <Text style={styles.passSubtitle}>Your check-in pass has been activated</Text>

            <View style={styles.passDivider} />

            <View style={styles.passGrid}>
              <View style={styles.passGridCol}>
                <Text style={styles.passGridLabel}>Court Arena</Text>
                <Text style={styles.passGridValue}>{selectedCourt.name}</Text>
              </View>
              <View style={styles.passGridCol}>
                <Text style={styles.passGridLabel}>Date of Play</Text>
                <Text style={[styles.passGridValue, { color: colors.neonGreen }]}>{bookingConfirmed.date}</Text>
              </View>
              <View style={styles.passGridCol}>
                <Text style={styles.passGridLabel}>Hourly Slots</Text>
                <Text style={styles.passGridValue}>
                  {bookingConfirmed.slots.map(s => `${s}:00`).join(', ')}
                </Text>
              </View>
              <View style={styles.passGridCol}>
                <Text style={styles.passGridLabel}>Amount Settled</Text>
                <Text style={[styles.passGridValue, { color: colors.electricBlue }]}>₹{bookingConfirmed.totalAmount}</Text>
              </View>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <QRCode
                  value={bookingConfirmed.qrCodeData || bookingConfirmed._id}
                  size={140}
                  color="black"
                  backgroundColor="white"
                />
              </View>
              <Text style={styles.qrText}>{bookingConfirmed.qrCodeData || bookingConfirmed._id}</Text>
            </View>

            <Text style={styles.passHint}>Present this digital pass at the reception desk upon arrival.</Text>

            <View style={styles.passActions}>
              <TouchableOpacity style={styles.invoiceBtn} onPress={handleViewInvoice}>
                <Text style={styles.invoiceBtnText}>📄 Download Invoice</Text>
              </TouchableOpacity>
              <View style={styles.passRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setBookingConfirmed(null)}>
                  <Text style={styles.secondaryBtnText}>Book Another</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(player)/dashboard')}>
                  <Text style={styles.secondaryBtnText}>Dashboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          </GlassPanel>
        </ScrollView>
        <InvoiceModal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} invoiceData={invoiceData} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reserve Court</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Court selection */}
        <Label style={styles.sectionLabel}>1. Select Court Surface</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courtsContainer}>
          {courts.map((court) => {
            const isSelected = selectedCourt?._id === court._id;
            return (
              <TouchableOpacity key={court._id} onPress={() => handleCourtChange(court)} activeOpacity={0.8}>
                <GlassPanel style={[styles.courtCard, isSelected && { borderColor: colors.neonGreen }]}>
                  <Image source={{ uri: court.image }} style={styles.courtImage} />
                  <View style={styles.courtInfo}>
                    <Text style={styles.courtName}>{court.name}</Text>
                    {isSelected && <View style={styles.checkIcon}><Text style={{ color: '#000', fontSize: 10 }}>✓</Text></View>}
                    <Text style={styles.courtDetail}>Surface: {court.surface}</Text>
                    <Text style={styles.courtRate}>
                      ₹{court.basePrice}/hr Base · <Text style={{ color: colors.electricBlue }}>₹{court.peakPrice}/hr Peak</Text>
                    </Text>
                  </View>
                </GlassPanel>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Label style={styles.sectionLabel}>2. Select Date</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
          {dates.map((date) => {
            const isSelected = selectedDate === date;
            const formatted = new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
            return (
              <TouchableOpacity key={date} onPress={() => handleDateChange(date)} style={[styles.dateBtn, isSelected && styles.dateBtnActive]}>
                <Text style={[styles.dateText, isSelected && { color: colors.neonGreen }]}>{formatted}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Label style={styles.sectionLabel}>3. Choose Hours (6:00 AM - 10:00 PM)</Label>
        <Text style={styles.subtext}>* Peak hours (6-9 AM, 5-10 PM) are marked with ⚡ and colored blue</Text>
        
        <View style={styles.slotsGrid}>
          {slotsList.map((slot) => {
            const isBooked = bookedSlots.includes(slot);
            const isSelected = selectedSlots.includes(slot);
            const isPeak = (slot >= 6 && slot < 9) || (slot >= 17 && slot < 22);
            let btnStyle = styles.slotBtn;
            let textStyle = styles.slotBtnText;
            if (isBooked) { btnStyle = [styles.slotBtn, styles.slotBooked]; textStyle = [styles.slotBtnText, styles.slotBookedText]; }
            else if (isSelected) { btnStyle = [styles.slotBtn, styles.slotSelected]; textStyle = [styles.slotBtnText, styles.slotSelectedText]; }
            else if (isPeak) { btnStyle = [styles.slotBtn, styles.slotPeak]; textStyle = [styles.slotBtnText, styles.slotPeakText]; }

            return (
              <TouchableOpacity key={slot} onPress={() => handleSlotToggle(slot)} disabled={isBooked} style={btnStyle} activeOpacity={0.7}>
                <Text style={textStyle}>
                  {slot >= 12 ? `${slot === 12 ? 12 : slot - 12} PM` : `${slot} AM`}
                  {isPeak && ' ⚡'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary Invoice */}
        <GlassPanel style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary Invoice</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Play Subtotal</Text>
            <Text style={styles.summaryValue}>₹{total}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
               <Text style={styles.summaryLabel}>{profileUser?.membership} Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.neonGreen }]}>-₹{discountAmount}</Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.totalLabel]}>Final Amount</Text>
            <NeonText style={styles.totalValue}>₹{finalAmount}</NeonText>
          </View>

          {/* Wallet Split System */}
          <View style={styles.walletBox}>
            <View style={styles.walletHeader}>
              <TouchableOpacity
                style={[styles.checkbox, useWallet && styles.checkboxChecked, (profileUser?.walletBalance || 0) <= 0 && { opacity: 0.5 }]}
                onPress={() => setUseWallet(!useWallet)}
                disabled={(profileUser?.walletBalance || 0) <= 0}
              >
                {useWallet && <Text style={styles.checkTick}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.walletText}>
                {(profileUser?.walletBalance || 0) <= 0 
                  ? 'Wallet empty (Top up to use)' 
                  : `Pay portion with Wallet (₹${profileUser.walletBalance})`}
              </Text>
            </View>

            {useWallet && (profileUser?.walletBalance || 0) > 0 && (
              <View style={styles.walletDetails}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Wallet Deduction:</Text>
                  <Text style={[styles.summaryValue, { color: colors.neonGreen }]}>-₹{Math.min(profileUser.walletBalance, finalAmount)}</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={[styles.summaryLabel, { color: '#fff' }]}>Net Payable Online:</Text>
                  <Text style={styles.summaryValue}>₹{netPayable}</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.bookBtn, selectedSlots.length === 0 && styles.bookBtnDisabled]}
            onPress={handleInitiatePayment}
            disabled={selectedSlots.length === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.bookBtnText}>Pay & Confirm Online →</Text>
            )}
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>

      {/* RAZORPAY SIMULATION MODAL */}
      <Modal visible={showRazorpayModal} transparent animationType="fade">
        <View style={styles.rzpOverlay}>
          <View style={styles.rzpModal}>
            <View style={styles.rzpHeader}>
              <View style={styles.rzpLogo}>
                <Text style={styles.rzpLogoText}>R</Text>
              </View>
              <Text style={styles.rzpTitle}>Razorpay Checkout</Text>
              <TouchableOpacity onPress={() => setShowRazorpayModal(false)}>
                <Text style={{ color: '#666', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rzpAmountBox}>
              <Text style={styles.rzpLabel}>Payable Amount</Text>
              <Text style={styles.rzpAmount}>₹{netPayable}</Text>
              <Text style={styles.rzpSub}>To: The Courtyard Sports Club House</Text>
            </View>

            <Text style={styles.rzpDesc}>
              This is a fully integrated local transaction simulator. Completing this simulation registers a confirmed active play lock.
            </Text>

            <View style={styles.rzpActions}>
              <TouchableOpacity style={styles.rzpCancel} onPress={() => setShowRazorpayModal(false)}>
                <Text style={styles.rzpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rzpSuccess} onPress={() => handleCompletePayment()}>
                <Text style={styles.rzpSuccessText}>Simulate Success</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <InvoiceModal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} invoiceData={invoiceData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { padding: 4 },
  backText: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, color: '#fff', marginBottom: 4, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  subtext: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_400Regular', marginTop: -6, marginBottom: 4 },
  
  courtsContainer: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  courtCard: { width: 280, padding: 12, marginRight: 12, position: 'relative' },
  courtImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 8 },
  courtInfo: { gap: 2 },
  courtName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 15, textTransform: 'uppercase' },
  courtDetail: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 11 },
  courtRate: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12, marginTop: 4 },
  checkIcon: { position: 'absolute', top: 16, right: 16, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.neonGreen, alignItems: 'center', justifyContent: 'center' },

  datesContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dateBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginRight: 8,
  },
  dateBtnActive: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: 'rgba(57,255,20,0.3)' },
  dateText: { color: '#d1d5db', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  slotBtn: {
    width: '31%', paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center',
  },
  slotBtnText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 11 },
  slotBooked: { backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.02)' },
  slotBookedText: { color: '#3f3f46', textDecorationLine: 'line-through' },
  slotSelected: { backgroundColor: 'rgba(57,255,20,0.15)', borderColor: colors.neonGreen },
  slotSelectedText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold' },
  slotPeak: { backgroundColor: 'rgba(0,229,255,0.05)', borderColor: 'rgba(0,229,255,0.2)' },
  slotPeakText: { color: colors.electricBlue },

  summaryCard: { padding: 20 },
  summaryTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 16, textTransform: 'uppercase', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12 },
  summaryValue: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  totalLabel: { fontSize: 14, fontFamily: 'Outfit_700Bold', color: '#fff', textTransform: 'uppercase' },
  totalValue: { fontSize: 20 },

  walletBox: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 },
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: colors.neonGreen },
  checkTick: { color: colors.neonGreen, fontSize: 12, fontWeight: 'bold' },
  walletText: { color: '#d1d5db', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  walletDetails: { marginTop: 12, paddingLeft: 32 },

  bookBtn: {
    backgroundColor: colors.neonGreen, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24,
    shadowColor: colors.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  bookBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', shadowOpacity: 0, elevation: 0 },
  bookBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },

  // Pass View
  passCard: { padding: 24, alignItems: 'center', borderColor: 'rgba(57,255,20,0.3)', position: 'relative', overflow: 'hidden' },
  passCheckIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  passTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 24, textTransform: 'uppercase', letterSpacing: 1 },
  passSubtitle: { color: colors.muted, fontFamily: 'Outfit_600SemiBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  passDivider: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 24 },
  passGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 16, marginBottom: 24 },
  passGridCol: { width: '45%' },
  passGridLabel: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  passGridValue: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 13, marginTop: 4 },
  
  qrContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  qrBox: { backgroundColor: '#fff', padding: 8, borderRadius: 8 },
  qrText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 10, marginTop: 12, letterSpacing: 2 },
  passHint: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  
  passActions: { width: '100%', gap: 12 },
  invoiceBtn: { backgroundColor: colors.neonGreen, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  invoiceBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  passRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

  // Razorpay
  rzpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  rzpModal: { backgroundColor: '#111116', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 24 },
  rzpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rzpLogo: { width: 24, height: 24, backgroundColor: '#2563eb', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rzpLogoText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12 },
  rzpTitle: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  rzpAmountBox: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 24 },
  rzpLabel: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  rzpAmount: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 28, marginTop: 4 },
  rzpSub: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10, marginTop: 4 },
  rzpDesc: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, marginBottom: 24 },
  rzpActions: { flexDirection: 'row', gap: 12 },
  rzpCancel: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  rzpCancelText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  rzpSuccess: { flex: 1.5, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  rzpSuccessText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
});
