import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Image, Modal, TextInput
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';
import QRCode from 'react-native-qrcode-svg';
import InvoiceModal from '../../components/InvoiceModal';

export default function PlayerDashboard() {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('courts');
  const [bookings, setBookings] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [ledgerData, setLedgerData] = useState({ payments: [], transactions: [] });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [profileUser, setProfileUser] = useState(user);

  // New parity states
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [gstRate, setGstRate] = useState(18);

  const fetchDashboardData = async () => {
    try {
      // Fetch latest profile
      const meRes = await api.get('/api/auth/me');
      setProfileUser(meRes.data);
      setUser(meRes.data);

      // Fetch bookings
      const bookingsRes = await api.get('/api/bookings/my');
      setBookings(bookingsRes.data);

      // Fetch enrollments
      const enrollRes = await api.get('/api/coaching/my-enrollments');
      setEnrollments(enrollRes.data);

      // Fetch ledger
      const ledgerRes = await api.get('/api/payments/my-ledger');
      setLedgerData(ledgerRes.data);

      // Fetch notifications
      const notifRes = await api.get('/api/notifications');
      setNotifications(notifRes.data);

      // Fetch GST
      const setRes = await api.get('/api/admin/settings');
      if (setRes.data?.tax_rate !== undefined) setGstRate(setRes.data.tax_rate);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const isPastBooking = (booking) => {
    if (booking.status === 'cancelled') return true;
    if (!booking.date) return false;
    const maxSlot = Math.max(...(booking.slots || [12]));
    const endTime = new Date(`${booking.date}T${String(maxSlot).padStart(2, '0')}:00:00`);
    return endTime < new Date();
  };

  const activeBookings = bookings.filter(b => !isPastBooking(b));
  const pastBookings = bookings.filter(b => isPastBooking(b));
  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const pastEnrollments = enrollments.filter(e => e.status !== 'active');

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure? Full refund will be credited to your wallet.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/bookings/cancel/${bookingId}`);
              Alert.alert('Success', 'Booking cancelled successfully.');
              fetchDashboardData();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to cancel.');
            }
          }
        }
      ]
    );
  };

  const handleUpgrade = async (tier) => {
    const pricing = { Basic: 999, Pro: 1999, Elite: 4999 };
    Alert.alert(
      'Upgrade Membership',
      `Purchase ${tier} Membership for ₹${pricing[tier]}/month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.post('/api/memberships/buy', { tier });
              fetchDashboardData();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || 'Upgrade failed.');
            }
          }
        }
      ]
    );
  };

  const handleTopUpWallet = async () => {
    if (!topupAmount || Number(topupAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount!');
      return;
    }
    setTopupLoading(true);
    try {
      await api.post('/api/users/wallet/topup', { amount: Number(topupAmount) });
      Alert.alert('Success', `Successfully topped up ₹${topupAmount}!`);
      setTopupAmount('');
      fetchDashboardData();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Top-up failed');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleSettleTab = async (method) => {
    if (!profileUser || profileUser.tabBalance <= 0) return;
    
    if (method === 'wallet') {
      if ((profileUser.walletBalance || 0) < profileUser.tabBalance) {
        Alert.alert('Error', 'Insufficient wallet balance. Top up first!');
        return;
      }
    }
    
    Alert.alert(
      'Settle Tab',
      `Settle your tab balance of ₹${profileUser.tabBalance} via ${method}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSettleLoading(true);
            try {
              const payload = method === 'wallet' 
                ? { amount: profileUser.tabBalance, useWallet: true }
                : { amount: profileUser.tabBalance, paymentMethod: 'card' };
                
              await api.post('/api/users/settle-tab', payload);
              Alert.alert('Success', 'Tab balance successfully settled!');
              fetchDashboardData();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || 'Settle tab failed');
            } finally {
              setSettleLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleViewInvoice = (item, invoiceType) => {
    if (invoiceType === 'Wallet Top-Up') {
      const finalAmount = item.amount;
      setInvoiceData({
        invoiceNo: `INV-${item.id?.slice(-6).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date(item.date).toLocaleDateString(),
        type: 'Wallet Top-Up',
        member: { name: user?.name, email: user?.email, membership: user?.membership || 'None' },
        items: [{ description: 'Prepaid Wallet Load / Club top-up', qty: 1, rate: finalAmount }],
        subtotal: finalAmount,
        discount: 0,
        taxRate: 0,
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
      ? [{ description: `Academy Course: ${item.course?.title || 'Coaching'}`, qty: 1, rate: computedSubtotal }]
      : [{ description: `Court Reservation: ${item.court?.name || 'Court'} (${item.date})`, qty: item.slots?.length || 1, rate: computedSubtotal / (item.slots?.length || 1) }];
    
    setInvoiceData({
      invoiceNo: `INV-${item._id?.slice(-6).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date(isCoaching ? item.enrolledAt : item.createdAt || Date.now()).toLocaleDateString(),
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

  const getCombinedLedger = () => {
    const list = [];
    if (ledgerData?.payments) {
      ledgerData.payments.forEach(p => {
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

    if (ledgerData?.transactions) {
      ledgerData.transactions.forEach(t => {
        if (t.type === 'topup') {
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

  const tabs = [
    { key: 'courts', label: `Courts (${activeBookings.length})`, color: colors.neonGreen },
    { key: 'coaching', label: `Academy (${activeEnrollments.length})`, color: colors.electricBlue },
    { key: 'past', label: `Past (${pastBookings.length + pastEnrollments.length})`, color: colors.foreground },
    { key: 'ledger', label: `Ledger (${ledgerList.length})`, color: colors.neonGreen },
  ];

  return (
    <View style={styles.container}>
      <DashboardHeader role="Club Member Area" name={user?.name} onLogout={logout} accentColor={colors.neonGreen} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
      >
        <View style={styles.content}>

          {/* ── Membership Card ── */}
          <GlassPanel style={styles.membershipCard}>
            <View style={styles.membershipHeader}>
              <Label>Active Pass Tier</Label>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            </View>
            <Text style={styles.membershipTitle}>
              {profileUser?.membership === 'None' ? 'Guest Player' : `${profileUser?.membership} Tier`}
            </Text>
            <Text style={styles.membershipDesc}>
              {profileUser?.membership === 'Elite'
                ? '100% free courts, 20% coaching discount, VIP access.'
                : profileUser?.membership === 'Pro'
                ? '25% off courts, 10% off coaching, priority bookings.'
                : profileUser?.membership === 'Basic'
                ? '10% court discounts and weekend recreational passes.'
                : 'Play standard rates. Upgrade to enjoy premium perks.'}
            </Text>

            <View style={styles.divider} />

            <Label style={{ marginBottom: 10 }}>Upgrade Membership</Label>
            <View style={styles.tierRow}>
              {['Basic', 'Pro', 'Elite'].map((tier) => {
                const isCurrent = profileUser?.membership === tier;
                return (
                  <TouchableOpacity
                    key={tier}
                    onPress={() => !isCurrent && handleUpgrade(tier)}
                    style={[styles.tierBtn, isCurrent && styles.tierBtnActive]}
                  >
                    <Text style={[styles.tierBtnText, isCurrent && { color: colors.neonGreen }]}>{tier}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassPanel>

          {/* ── Wallet & Tab Balances Parity ── */}
          <GlassPanel style={styles.membershipCard}>
            <Label style={{ marginBottom: 10 }}>Club Account Balances</Label>
            <View style={styles.balanceRow}>
              <View style={[styles.balanceCardNative, { borderColor: 'rgba(57,255,20,0.2)' }]}>
                <Text style={styles.balanceNativeLabel}>Prepaid Wallet</Text>
                <NeonText style={styles.balanceAmount} color={colors.neonGreen}>
                  ₹{profileUser?.walletBalance || 0}
                </NeonText>
              </View>
              <View style={[styles.balanceCardNative, { borderColor: 'rgba(255,165,0,0.2)' }]}>
                <Text style={styles.balanceNativeLabel}>Active Postpaid Tab</Text>
                <NeonText style={styles.balanceAmount} color="#facc15">
                  ₹{profileUser?.tabBalance || 0}
                </NeonText>
              </View>
            </View>

            {/* Postpaid Tab Settle */}
            {(profileUser?.tabBalance || 0) > 0 && (
              <View style={styles.tabSettleSection}>
                <Text style={styles.tabSettleWarning}>Outstanding Tab: ₹{profileUser.tabBalance}</Text>
                <Text style={styles.tabSettleHint}>Settle your postpaid tab online using wallet or Razorpay.</Text>
                <View style={styles.tabSettleRow}>
                  <TouchableOpacity style={styles.tabSettleBtnWallet} onPress={() => handleSettleTab('wallet')}>
                    <Text style={styles.tabSettleBtnTextWallet}>Settle via Wallet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.tabSettleBtnRzp} onPress={() => handleSettleTab('card')}>
                    <Text style={styles.tabSettleBtnTextRzp}>Pay via Razorpay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Wallet Top-up */}
            <Label style={{ marginBottom: 10 }}>Top Up Club Wallet</Label>
            <View style={styles.topupPresetsRow}>
              {['200', '500', '1000'].map(preset => (
                <TouchableOpacity key={preset} style={styles.topupPresetBtn} onPress={() => setTopupAmount(preset)}>
                  <Text style={styles.topupPresetText}>+₹{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.topupInputWrapper}>
              <Text style={styles.topupCurrency}>₹</Text>
              <TextInput
                style={styles.topupInput}
                placeholder="Enter amount..."
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={topupAmount}
                onChangeText={setTopupAmount}
              />
            </View>
            <TouchableOpacity style={styles.topupBtn} onPress={handleTopUpWallet} disabled={topupLoading}>
              {topupLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.topupBtnText}>Top Up via Razorpay</Text>}
            </TouchableOpacity>
          </GlassPanel>

          {/* ── Notifications ── */}
          {notifications.length > 0 && (
            <GlassPanel style={styles.notifCard}>
              <Label style={{ marginBottom: 12 }}>🔔 Club Announcements</Label>
              {notifications.slice(0, 3).map((notif) => (
                <View key={notif._id} style={styles.notifItem}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifMsg}>{notif.message}</Text>
                </View>
              ))}
            </GlassPanel>
          )}

          {/* ── Quick Actions ── */}
          <View style={styles.quickActions}>
            {[
              { label: '🏸 Book Court', route: '/(player)/bookings' },
              { label: '🎾 Coaching', route: '/(player)/coaching' },
            ].map((item) => (
              <TouchableOpacity key={item.route} style={styles.quickBtn} onPress={() => router.push(item.route)}>
                <Text style={styles.quickBtnText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Tab Bar ── */}
          <GlassPanel style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </GlassPanel>

          {/* ── Tab Content ── */}
          {loading ? (
            <GlassPanel style={styles.emptyState}>
              <ActivityIndicator color={colors.neonGreen} />
              <Text style={styles.emptyText}>Loading...</Text>
            </GlassPanel>
          ) : activeTab === 'courts' ? (
            activeBookings.length ? activeBookings.map((booking) => (
              <GlassPanel key={booking._id} style={styles.bookingCard}>
                <Image
                  source={{ uri: booking.court?.image || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=400' }}
                  style={styles.courtImage}
                />
                <View style={styles.bookingInfo}>
                  <Label>Date: {booking.date}</Label>
                  <Text style={styles.courtName}>{booking.court?.name || 'Center Court'}</Text>
                  <Text style={styles.slotText}>
                    🕐 {booking.slots.map(s => `${s}:00`).join(', ')}
                  </Text>
                  <View style={styles.bookingFooter}>
                    <NeonText style={styles.price}>₹{booking.totalAmount}</NeonText>
                    <View style={styles.bookingActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewInvoice(booking, 'Court Booking')}>
                        <Text style={styles.actionBtnText}>Invoice</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedTicket(booking)}>
                        <Text style={styles.actionBtnText}>Pass</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: 'rgba(239,68,68,0.3)' }]}
                        onPress={() => handleCancelBooking(booking._id)}
                      >
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </GlassPanel>
            )) : (
              <GlassPanel style={styles.emptyState}>
                <Text style={styles.emptyText}>No active court reservations.{'\n'}Book a court to get started.</Text>
              </GlassPanel>
            )
          ) : activeTab === 'coaching' ? (
            activeEnrollments.length ? activeEnrollments.map((enrollment) => {
              const course = enrollment.course;
              if (!course) return null;
              const attended = enrollment.attendance?.length || 0;
              const total = 10;
              const percent = Math.min((attended / total) * 100, 100);
              return (
                <GlassPanel key={enrollment._id} style={styles.bookingCard}>
                  <Image
                    source={{ uri: course.image || 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=400' }}
                    style={styles.courtImage}
                  />
                  <View style={styles.bookingInfo}>
                    <Label>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</Label>
                    <Text style={styles.courtName}>{course.title}</Text>
                    <Text style={styles.slotText}>Coach {course.coach?.name}</Text>
                    <Text style={styles.slotText}>{course.schedule}</Text>

                    {/* Attendance bar */}
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Attendance: {attended}/{total}</Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${percent}%` }]} />
                    </View>

                    <View style={styles.bookingFooter}>
                      <NeonText style={styles.price}>₹{enrollment.amountPaid}</NeonText>
                      <View style={styles.bookingActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewInvoice(enrollment, 'Coaching Program')}>
                          <Text style={styles.actionBtnText}>Invoice</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedTicket(enrollment)}>
                          <Text style={styles.actionBtnText}>Pass</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </GlassPanel>
              );
            }) : (
              <GlassPanel style={styles.emptyState}>
                <Text style={styles.emptyText}>No active enrollments.{'\n'}Join an academy course!</Text>
              </GlassPanel>
            )
          ) : activeTab === 'past' ? (
            (pastBookings.length || pastEnrollments.length) ? (
              <>
                {pastBookings.map((booking) => (
                  <GlassPanel key={booking._id} style={[styles.bookingCard, { opacity: 0.6 }]}>
                    <Image
                      source={{ uri: booking.court?.image || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=400' }}
                      style={[styles.courtImage, { opacity: 0.5 }]}
                    />
                    <View style={styles.bookingInfo}>
                      <Label>{booking.date} — Completed</Label>
                      <Text style={styles.courtName}>{booking.court?.name}</Text>
                      <Text style={styles.slotText}>🕐 {booking.slots.map(s => `${s}:00`).join(', ')}</Text>
                      <View style={styles.bookingFooter}>
                        <Text style={[styles.price, { color: colors.muted }]}>₹{booking.totalAmount}</Text>
                        <View style={styles.bookingActions}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewInvoice(booking, 'Court Booking')}>
                            <Text style={styles.actionBtnText}>Invoice</Text>
                          </TouchableOpacity>
                          <View style={[styles.actionBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={[styles.actionBtnText, { color: colors.muted }]}>
                              {booking.status === 'cancelled' ? 'Cancelled' : 'Finished'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </GlassPanel>
                ))}
                {pastEnrollments.map((enrollment) => {
                  const course = enrollment.course;
                  if (!course) return null;
                  return (
                    <GlassPanel key={enrollment._id} style={[styles.bookingCard, { opacity: 0.6 }]}>
                      <Image
                        source={{ uri: course.image }}
                        style={[styles.courtImage, { opacity: 0.5 }]}
                      />
                      <View style={styles.bookingInfo}>
                        <Label>Academy — {enrollment.status}</Label>
                        <Text style={styles.courtName}>{course.title}</Text>
                        <Text style={styles.slotText}>Coach {course.coach?.name}</Text>
                        <View style={styles.bookingFooter}>
                          <Text style={[styles.price, { color: colors.muted }]}>₹{enrollment.amountPaid}</Text>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewInvoice(enrollment, 'Coaching Program')}>
                            <Text style={styles.actionBtnText}>Invoice</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassPanel>
                  );
                })}
              </>
            ) : (
              <GlassPanel style={styles.emptyState}>
                <Text style={styles.emptyText}>No past reservations found.</Text>
              </GlassPanel>
            )
          ) : (
            // Ledger tab
            ledgerList.length ? (
              ledgerList.map((item, idx) => (
                <GlassPanel key={idx} style={styles.ledgerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerDesc}>{item.description}</Text>
                    <Text style={styles.ledgerDate}>{item.date.toLocaleDateString()}</Text>
                    <Text style={styles.ledgerMethod}>{item.paymentMethod.toUpperCase()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <NeonText style={styles.ledgerAmount} color={item.itemType === 'Debit' ? '#ef4444' : colors.neonGreen}>
                      {item.itemType === 'Debit' ? '-' : '+'}₹{item.amount}
                    </NeonText>
                    {item.itemType === 'Wallet Top-Up' && (
                      <TouchableOpacity style={{ marginTop: 4 }} onPress={() => handleViewInvoice(item, 'Wallet Top-Up')}>
                        <Text style={{ color: colors.electricBlue, fontSize: 10, fontFamily: 'Outfit_700Bold' }}>INVOICE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </GlassPanel>
              ))
            ) : (
              <GlassPanel style={styles.emptyState}>
                <Text style={styles.emptyText}>No ledger entries found.</Text>
              </GlassPanel>
            )
          )}

        </View>

        {/* ── QR Ticket Modal ── */}
        <Modal visible={!!selectedTicket} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassPanel style={styles.modalCard}>
              <Text style={styles.modalTitle}>Check-In Pass</Text>
              <Text style={styles.modalSub}>The Courtyard Entry Voucher</Text>
              <View style={styles.modalDivider} />

              {selectedTicket?.course ? (
                <View style={styles.modalGrid}>
                  <View style={styles.modalField}>
                    <Label>Program</Label>
                    <Text style={styles.modalValue}>{selectedTicket.course?.title}</Text>
                  </View>
                  <View style={styles.modalField}>
                    <Label>Coach</Label>
                    <NeonText>{selectedTicket.course?.coach?.name}</NeonText>
                  </View>
                  <View style={styles.modalField}>
                    <Label>Schedule</Label>
                    <Text style={[styles.modalValue, { color: colors.electricBlue }]}>{selectedTicket.course?.schedule}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.modalGrid}>
                  <View style={styles.modalField}>
                    <Label>Court</Label>
                    <Text style={styles.modalValue}>{selectedTicket?.court?.name}</Text>
                  </View>
                  <View style={styles.modalField}>
                    <Label>Date</Label>
                    <NeonText>{selectedTicket?.date}</NeonText>
                  </View>
                  <View style={styles.modalField}>
                    <Label>Slots</Label>
                    <Text style={styles.modalValue}>{selectedTicket?.slots?.map(s => `${s}:00`).join(', ')}</Text>
                  </View>
                </View>
              )}

              <View style={styles.qrBox}>
                {(() => {
                  const qrValue = selectedTicket?.qrCodeData || selectedTicket?._id || '';
                  return qrValue ? (
                    <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 12, marginVertical: 4 }}>
                      <QRCode value={qrValue} size={160} color="black" backgroundColor="white" />
                    </View>
                  ) : <ActivityIndicator color={colors.electricBlue} />;
                })()}
                <Text style={styles.qrHint}>Show this to reception for check-in</Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTicket(null)}>
                <Text style={styles.closeBtnText}>Close Pass</Text>
              </TouchableOpacity>
            </GlassPanel>
          </View>
        </Modal>

        {/* ── Invoice Modal ── */}
        <InvoiceModal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} invoiceData={invoiceData} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16 },
  
  // Membership Card
  membershipCard: { padding: 20, borderRadius: 16 },
  membershipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  liveBadge: { backgroundColor: colors.neonGreen, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  liveBadgeText: { color: '#000', fontSize: 8, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  membershipTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 22, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  membershipDesc: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  tierRow: { flexDirection: 'row', gap: 8 },
  tierBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center' },
  tierBtnActive: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: 'rgba(57,255,20,0.3)' },
  tierBtnText: { color: '#d1d5db', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

  // Balances
  balanceRow: { flexDirection: 'row', gap: 12 },
  balanceCardNative: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  balanceNativeLabel: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 22, fontFamily: 'Outfit_700Bold', marginTop: 4 },

  // Tab Settle
  tabSettleSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  tabSettleWarning: { color: '#facc15', fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  tabSettleHint: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10, marginTop: 2, marginBottom: 8 },
  tabSettleRow: { flexDirection: 'row', gap: 8 },
  tabSettleBtnWallet: { flex: 1, backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabSettleBtnTextWallet: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase' },
  tabSettleBtnRzp: { flex: 1, backgroundColor: 'rgba(250,204,21,0.1)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.2)', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabSettleBtnTextRzp: { color: '#facc15', fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase' },

  // Top Up
  topupPresetsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  topupPresetBtn: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  topupPresetText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 10 },
  topupInputWrapper: { position: 'relative', marginBottom: 12 },
  topupCurrency: { position: 'absolute', left: 14, top: 12, color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 14, zIndex: 1 },
  topupInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 10, paddingLeft: 32, paddingRight: 14, color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  topupBtn: { backgroundColor: colors.electricBlue, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  topupBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { width: '47%', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, alignItems: 'center' },
  quickBtnText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  
  bookingCard: { padding: 16, borderRadius: 16, gap: 12 },
  courtImage: { width: '100%', height: 140, borderRadius: 12, objectFit: 'cover' },
  bookingInfo: { gap: 4 },
  courtName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  slotText: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12 },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontSize: 18, fontFamily: 'Outfit_700Bold' },
  bookingActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
  actionBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase' },
  
  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  attendanceLabel: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.electricBlue },
  
  ledgerRow: { padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  ledgerDesc: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  ledgerDate: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 2 },
  ledgerMethod: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  ledgerAmount: { fontSize: 16, fontFamily: 'Outfit_700Bold' },
  
  emptyState: { padding: 40, alignItems: 'center', borderRadius: 16, gap: 12 },
  emptyText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  
  notifCard: { padding: 20, borderRadius: 16, gap: 0 },
  notifItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  notifTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12 },
  notifMsg: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 2, lineHeight: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', padding: 24, borderRadius: 24 },
  modalTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 22, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  modalSub: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  modalGrid: { gap: 12, marginBottom: 16 },
  modalField: { gap: 4 },
  modalValue: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  qrBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  qrHint: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10, marginTop: 6 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});