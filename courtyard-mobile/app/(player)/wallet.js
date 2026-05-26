import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function WalletScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [walletBalance, setWalletBalance] = useState(0);
  const [tabBalance, setTabBalance] = useState(0);
  const [topupAmount, setTopupAmount] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWalletDetails = async () => {
    try {
      const meRes = await api.get('/api/auth/me');
      setWalletBalance(meRes.data.walletBalance || 0);
      setTabBalance(meRes.data.tabBalance || 0);

      const ledgerRes = await api.get('/api/payments/my-ledger');
      setLedger(ledgerRes.data.payments || []);
    } catch (err) {
      console.error('Fetch wallet error:', err);
      Alert.alert('Error', 'Failed to retrieve wallet information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWalletDetails();
  }, []);

  const handleTopup = async (presetAmt) => {
    const amt = presetAmt || Number(topupAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid top-up amount.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/users/wallet/topup', { amount: amt });
      Alert.alert('Success 🎉', `Deposited ₹${amt} into your club prepaid wallet.`);
      setTopupAmount('');
      fetchWalletDetails();
    } catch (err) {
      Alert.alert('Topup Failed', err?.response?.data?.error || 'Failed to complete transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleTab = async (useWalletVal) => {
    const amt = Number(settleAmount) || tabBalance;
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'No outstanding tab balance to settle.');
      return;
    }

    if (useWalletVal && walletBalance < amt) {
      Alert.alert('Insufficient Wallet', 'Your wallet balance is less than the settlement amount.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/users/settle-tab', {
        amount: amt,
        useWallet: useWalletVal,
        paymentMethod: useWalletVal ? 'wallet' : 'card'
      });
      Alert.alert('Success 🎉', `Settled ₹${amt} of your active tab balance.`);
      setSettleAmount('');
      fetchWalletDetails();
    } catch (err) {
      Alert.alert('Settlement Failed', err?.response?.data?.error || 'Failed to complete settlement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
        <Text style={styles.loadingText}>Opening secure gateway...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Club Wallet</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />
        }
      >
        {/* Balances Display */}
        <View style={styles.balancesContainer}>
          <GlassPanel style={[styles.balanceCard, { borderColor: 'rgba(57,255,20,0.2)' }]}>
            <Label>Prepaid Wallet</Label>
            <NeonText style={styles.balanceAmount} color={colors.neonGreen}>
              ₹{walletBalance}
            </NeonText>
            <Text style={styles.cardHint}>Used for direct booking discounts</Text>
          </GlassPanel>

          <GlassPanel style={[styles.balanceCard, { borderColor: 'rgba(255,165,0,0.2)' }]}>
            <Label>Active Club Tab</Label>
            <NeonText style={styles.balanceAmount} color="#facc15">
              ₹{tabBalance}
            </NeonText>
            <Text style={styles.cardHint}>Accumulated club services fees</Text>
          </GlassPanel>
        </View>

        {/* Top-up Form */}
        <GlassPanel style={styles.actionCard}>
          <Label style={{ marginBottom: 12 }}>Prepaid Wallet Recharge</Label>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter top-up amount"
              placeholderTextColor="#3f3f46"
              value={topupAmount}
              onChangeText={setTopupAmount}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleTopup()}
              disabled={submitting}
            >
              <Text style={styles.actionBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Quick presets */}
          <View style={styles.presetsRow}>
            {[500, 1000, 2000, 5000].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={styles.presetBtn}
                onPress={() => handleTopup(preset)}
                disabled={submitting}
              >
                <Text style={styles.presetText}>+₹{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassPanel>

        {/* Tab Settlement Form */}
        {tabBalance > 0 && (
          <GlassPanel style={styles.actionCard}>
            <Label style={{ marginBottom: 12 }}>Settle Active Tab</Label>
            <Text style={styles.tabDesc}>
              Settle outstanding fees. You can pay using your prepaid wallet or a simulated credit card.
            </Text>
            
            <View style={styles.inputRow}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder={`Settle full amount (₹${tabBalance})`}
                placeholderTextColor="#3f3f46"
                value={settleAmount}
                onChangeText={setSettleAmount}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settlementActions}>
              <TouchableOpacity
                style={[styles.settleBtn, styles.settleCardBtn]}
                onPress={() => handleSettleTab(false)}
                disabled={submitting}
              >
                <Text style={styles.settleBtnText}>Simulate Card Pay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settleBtn, styles.settleWalletBtn, walletBalance < (Number(settleAmount) || tabBalance) && styles.settleWalletDisabled]}
                onPress={() => handleSettleTab(true)}
                disabled={submitting || walletBalance < (Number(settleAmount) || tabBalance)}
              >
                <Text style={[styles.settleBtnText, { color: '#000' }]}>Pay with Wallet</Text>
              </TouchableOpacity>
            </View>
          </GlassPanel>
        )}

        {/* Ledger Transaction History */}
        <Label style={{ marginTop: 8 }}>Ledger & Transaction Logs</Label>
        {ledger.length > 0 ? (
          ledger.map((item, idx) => (
            <GlassPanel key={idx} style={styles.ledgerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ledgerDesc}>{item.type}</Text>
                <Text style={styles.ledgerDate}>
                  {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.ledgerMethod}>Method: {item.paymentMethod || 'Razorpay'}</Text>
              </View>
              <NeonText style={styles.ledgerAmount} color={item.amount > 0 ? colors.neonGreen : '#ef4444'}>
                {item.amount > 0 ? '+' : ''}₹{item.amount}
              </NeonText>
            </GlassPanel>
          ))
        ) : (
          <GlassPanel style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions recorded on this ledger.</Text>
          </GlassPanel>
        )}
      </ScrollView>
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
  backText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  // Balances
  balancesContainer: { flexDirection: 'row', gap: 12 },
  balanceCard: { flex: 1, padding: 16, borderRadius: 16, gap: 4 },
  balanceAmount: { fontSize: 24, fontFamily: 'Outfit_700Bold', marginTop: 4 },
  cardHint: { color: colors.muted, fontSize: 9, fontFamily: 'Outfit_400Regular' },

  // Actions
  actionCard: { padding: 20, borderRadius: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  currencyPrefix: { color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold' },
  input: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: '#fff', fontFamily: 'Outfit_400Regular', fontSize: 14,
  },
  actionBtn: {
    backgroundColor: colors.neonGreen, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  actionBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  
  presetsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  presetBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  presetText: { color: '#fff', fontSize: 10, fontFamily: 'Outfit_700Bold' },

  // Tab Settlement
  tabDesc: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular', lineHeight: 16, marginBottom: 8 },
  settlementActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  settleBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  settleCardBtn: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  settleWalletBtn: { backgroundColor: colors.neonGreen },
  settleWalletDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  settleBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Ledger
  ledgerRow: { padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  ledgerDesc: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  ledgerDate: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 2 },
  ledgerMethod: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  ledgerAmount: { fontSize: 16, fontFamily: 'Outfit_700Bold' },

  emptyState: { padding: 40, alignItems: 'center', borderRadius: 16 },
  emptyText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
});
