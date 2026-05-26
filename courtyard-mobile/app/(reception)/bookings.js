import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';
import { useRouter } from 'expo-router';

export default function ReceptionBookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('daily'); // daily, pos
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash or card
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookingsRes = await api.get('/api/admin/bookings');
      // Filter for today's bookings for Reception
      const todayBookings = bookingsRes.data.filter(b => b.date === today) || [];
      setBookings(todayBookings);

      const usersRes = await api.get('/api/admin/users');
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Reception bookings fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleManualTopup = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a club member first.');
      return;
    }
    const amt = Number(topupAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/admin/wallet/topup', {
        userId: selectedUser._id,
        amount: amt,
        paymentMethod
      });
      Alert.alert('Success 🎉', `Deposited ₹${amt} into ${selectedUser.name}'s wallet.`);
      setTopupAmount('');
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      Alert.alert('Failed', err?.response?.data?.error || 'Manual topup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleTab = async (student) => {
    if (!student.tabBalance || student.tabBalance <= 0) {
      Alert.alert('Zero Balance', 'Member has no outstanding tab.');
      return;
    }

    Alert.alert(
      'Settle Tab Balance',
      `Clear ₹${student.tabBalance} tab for ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Tab (Paid)',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post(`/api/admin/users/${student._id}/settle-tab`, {
                amount: student.tabBalance
              });
              Alert.alert('Success', `Tab settled for ${student.name}.`);
              fetchData();
            } catch (err) {
              Alert.alert('Failed', 'Failed to settle tab.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const toggleCheckIn = async (booking) => {
    // Basic mock check-in handler for receptionist
    Alert.alert('Check-in', `Manually toggle check-in for ${booking.user?.name || 'Walk-in'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Check-in toggled (Mock for now)') }
    ]);
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Bookings & Desk" 
        subtitle="Reception" 
        onRefresh={onRefresh}
      />

      <View style={styles.tabHeader}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'daily' && styles.activeTabBtn]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>Daily Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'pos' && styles.activeTabBtn]}
          onPress={() => setActiveTab('pos')}
        >
          <Text style={[styles.tabText, activeTab === 'pos' && styles.activeTabText]}>Spot Booking & POS</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.neonGreen} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
        >
          {activeTab === 'daily' ? (
            <>
              {bookings.length === 0 ? (
                <Text style={styles.emptyText}>No bookings reserved for today yet.</Text>
              ) : (
                bookings.map((b) => (
                  <GlassPanel key={b._id} style={styles.bookingCard}>
                    <View style={styles.row}>
                      <View>
                        <Label>Player</Label>
                        <Text style={styles.valText}>{b.user?.name || 'Walk-in Member'}</Text>
                        <Text style={styles.subText}>{b.user?.email || 'N/A'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Label>Court</Label>
                        <NeonText>{b.court?.name || 'Spot Booking'}</NeonText>
                        <View style={[styles.statusBadge, b.checkedIn && styles.statusCheckedIn]}>
                          <Text style={styles.statusText}>{b.checkedIn ? 'Checked-In' : 'Pending'}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.row, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }]}>
                      <View>
                        <Label>Schedule</Label>
                        <Text style={styles.valText}>
                          {b.slots?.map(s => `${s}:00`).join(', ') || b.timeSlot}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.checkInBtn} onPress={() => toggleCheckIn(b)}>
                        <Text style={styles.checkInBtnText}>Toggle Check-in</Text>
                      </TouchableOpacity>
                    </View>
                  </GlassPanel>
                ))
              )}
            </>
          ) : (
            <GlassPanel style={styles.card}>
              <Label>Member Desk & POS</Label>
              {selectedUser ? (
                <View style={styles.topupForm}>
                  <Text style={styles.formTitle}>Recharge for: {selectedUser.name}</Text>
                  <Text style={styles.formSub}>Current Wallet: ₹{selectedUser.walletBalance || 0}</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Cash/Card amount"
                    placeholderTextColor="#3f3f46"
                    value={topupAmount}
                    onChangeText={setTopupAmount}
                    keyboardType="number-pad"
                  />

                  <View style={styles.methodRow}>
                    {['cash', 'card'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[styles.methodBtn, paymentMethod === method && styles.methodBtnActive]}
                        onPress={() => setPaymentMethod(method)}
                      >
                        <Text style={styles.methodBtnText}>{method.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                      onPress={handleManualTopup}
                      disabled={submitting}
                    >
                      <Text style={styles.submitBtnText}>Deposit Cash/Card</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setSelectedUser(null)}
                    >
                      <Text style={styles.cancelBtnText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.memberList}>
                  <Text style={styles.searchDesc}>Select a member to top-up wallet or settle tab balance:</Text>
                  <ScrollView nestedScrollEnabled style={styles.memberScroll}>
                    {users.map((member) => (
                      <View key={member._id} style={styles.memberRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberWallet}>Wallet: ₹{member.walletBalance || 0} · Tab: ₹{member.tabBalance || 0}</Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.memberActionBtn}
                            onPress={() => setSelectedUser(member)}
                          >
                            <Text style={styles.memberActionBtnText}>Top-Up</Text>
                          </TouchableOpacity>

                          {member.tabBalance > 0 && (
                            <TouchableOpacity
                              style={[styles.memberActionBtn, { borderColor: 'rgba(250,204,21,0.3)' }]}
                              onPress={() => handleSettleTab(member)}
                            >
                              <Text style={[styles.memberActionBtnText, { color: '#facc15' }]}>Settle Tab</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              <TouchableOpacity style={styles.spotBookBtn} onPress={() => Alert.alert('Spot Booking', 'Mock: Navigate to spot booking flow (Standard Prices Only).')}>
                <Text style={styles.spotBookBtnText}>+ New Spot Booking (Walk-in)</Text>
              </TouchableOpacity>
            </GlassPanel>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTabBtn: { backgroundColor: 'rgba(57,255,20,0.1)' },
  tabText: { color: colors.muted, fontFamily: 'Outfit_600SemiBold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  activeTabText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 16 },

  // Bookings cards
  bookingCard: { padding: 16, borderRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  valText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit_700Bold' },
  subText: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular', marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(255,165,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,165,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-end' },
  statusCheckedIn: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: 'rgba(57,255,20,0.2)' },
  statusText: { color: '#fff', fontSize: 8, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  checkInBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  checkInBtnText: { color: '#fff', fontSize: 10, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Outfit_400Regular', fontSize: 12 },

  // Manual payment Desk
  topupForm: { gap: 10, marginTop: 12 },
  formTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase' },
  formSub: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: '#fff', fontFamily: 'Outfit_400Regular', fontSize: 13,
  },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  methodBtnActive: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: 'rgba(57,255,20,0.3)' },
  methodBtnText: { color: '#fff', fontSize: 10, fontFamily: 'Outfit_700Bold' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  submitBtn: {
    flex: 2, backgroundColor: colors.neonGreen, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  submitBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  cancelBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  // Member search scroll
  searchDesc: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular', marginBottom: 8, marginTop: 12 },
  memberScroll: { maxHeight: 180 },
  memberRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  memberName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  memberWallet: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_400Regular', marginTop: 1 },
  memberActionBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.02)',
  },
  memberActionBtnText: { color: '#fff', fontSize: 9, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

  spotBookBtn: {
    marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center'
  },
  spotBookBtnText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 13, textTransform: 'uppercase' }
});
