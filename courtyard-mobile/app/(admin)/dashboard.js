import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Fetch admin analytics error:', err);
      Alert.alert('Error', 'Failed to retrieve administrative analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
        <Text style={styles.loadingText}>Structuring corporate ledger...</Text>
      </View>
    );
  }

  const { summary, courtUtilization, peakBookingHours, membershipGrowth, mostBookedCoach } = analytics || {};

  return (
    <View style={styles.container}>
      <DashboardHeader role="Club Administrator" name={user?.name} onLogout={logout} accentColor={colors.neonGreen} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />
        }
      >
        {/* Main Revenue Counter */}
        <GlassPanel style={styles.revenueCard}>
          <Label>Gross Accumulated Revenue</Label>
          <NeonText style={styles.revenueText}>₹{summary?.totalRevenue || 0}</NeonText>
          
          <View style={styles.revenueBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Courts</Text>
              <Text style={styles.breakdownValue}>₹{summary?.courtRevenue || 0}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Coaching</Text>
              <Text style={styles.breakdownValue}>₹{summary?.coachingRevenue || 0}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Memberships</Text>
              <Text style={styles.breakdownValue}>₹{summary?.membershipRevenue || 0}</Text>
            </View>
          </View>
        </GlassPanel>

        {/* Quick management shortcuts */}
        <Label>Management Control Panels</Label>
        <View style={styles.quickGrid}>
          {[
            { label: '👥 Users', route: '/(admin)/users', desc: 'Roles & balances' },
            { label: '🏟️ Courts', route: '/(admin)/courts', desc: 'Pricing & info' },
            { label: '📅 Bookings', route: '/(admin)/bookings', desc: 'Active & Past' },
            { label: '🎾 Coaching', route: '/(admin)/coaching', desc: 'Courses & Logs' },
            { label: '📷 Scanner', route: '/(admin)/scanner', desc: 'QR Check-in' },
            { label: '🔒 Block Slots', route: '/(admin)/block', desc: 'Override schedule' },
            { label: '📢 Broadcast', route: '/(admin)/promo', desc: 'Send Promos' },
            { label: '📈 Ledger', route: '/(admin)/ledger', desc: 'Financials & GST' },
            { label: '⚡ Spot Booking', route: '/(admin)/spot-booking', desc: 'POS/Walk-ins' },
            { label: '📦 Inventory', route: '/(admin)/inventory', desc: 'Rental stock' },
          ].map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.quickBtn}
              onPress={() => router.push(item.route)}
            >
              <Text style={styles.quickBtnText}>{item.label}</Text>
              <Text style={styles.quickBtnDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Analytics Breakdown Grid */}
        <Label>Club Health Metrics</Label>
        <View style={styles.metricsContainer}>
          {/* Court Utilization */}
          <GlassPanel style={styles.metricCard}>
            <Label>Court Utilization</Label>
            <NeonText style={styles.metricValue} color={colors.electricBlue}>
              {courtUtilization || 0}%
            </NeonText>
            <Text style={styles.metricDesc}>Booked hours vs total open capacity</Text>
          </GlassPanel>

          {/* Membership tier counts */}
          <GlassPanel style={styles.metricCard}>
            <Label>Club Membership Tiers</Label>
            <View style={styles.membershipTiersGrid}>
              <View style={styles.tierRow}>
                <Text style={styles.tierLabel}>Elite</Text>
                <Text style={styles.tierValue}>{membershipGrowth?.Elite || 0}</Text>
              </View>
              <View style={styles.tierRow}>
                <Text style={styles.tierLabel}>Pro</Text>
                <Text style={styles.tierValue}>{membershipGrowth?.Pro || 0}</Text>
              </View>
              <View style={styles.tierRow}>
                <Text style={styles.tierLabel}>Basic</Text>
                <Text style={styles.tierValue}>{membershipGrowth?.Basic || 0}</Text>
              </View>
            </View>
          </GlassPanel>
        </View>

        {/* Peak Hours & Coach Tally */}
        <View style={styles.metricsContainer}>
          {/* Peak Hours Heatmap */}
          <GlassPanel style={[styles.metricCard, { flex: 1.3 }]}>
            <Label>Peak Play Hours</Label>
            <View style={styles.listContainer}>
              {peakBookingHours?.length > 0 ? (
                peakBookingHours.map((entry, idx) => (
                  <View key={idx} style={styles.listRow}>
                    <Text style={styles.listKey}>{entry.hour}</Text>
                    <Text style={styles.listVal}>{entry.bookings} Bookings</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No slots reserved yet.</Text>
              )}
            </View>
          </GlassPanel>

          {/* Most popular Coach */}
          <GlassPanel style={[styles.metricCard, { flex: 1 }]}>
            <Label>Popular Coach</Label>
            <NeonText style={styles.coachNameText} color="#facc15">
              {mostBookedCoach === 'N/A' ? 'None' : mostBookedCoach}
            </NeonText>
            <Text style={styles.metricDesc}>Instructor leading the most scheduled classes</Text>
          </GlassPanel>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  


  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  // Gross Revenue Card
  revenueCard: { padding: 20, borderRadius: 18, gap: 4 },
  revenueText: { fontSize: 32, fontFamily: 'Outfit_700Bold' },
  revenueBreakdown: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 14, paddingTop: 14 },
  breakdownItem: { gap: 2 },
  breakdownLabel: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_600SemiBold', textTransform: 'uppercase' },
  breakdownValue: { color: '#fff', fontSize: 13, fontFamily: 'Outfit_700Bold' },

  // Shortcuts Grid
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: {
    width: '48%', backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 16, gap: 4,
  },
  quickBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 13 },
  quickBtnDesc: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_400Regular' },

  // Metrics
  metricsContainer: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, padding: 16, borderRadius: 16, gap: 6 },
  metricValue: { fontSize: 24, fontFamily: 'Outfit_700Bold' },
  metricDesc: { color: colors.muted, fontSize: 9, fontFamily: 'Outfit_400Regular', lineHeight: 14 },

  membershipTiersGrid: { gap: 4, marginTop: 4 },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierLabel: { color: '#d1d5db', fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  tierValue: { color: colors.neonGreen, fontSize: 12, fontFamily: 'Outfit_700Bold' },

  // Lists
  listContainer: { gap: 6, marginTop: 4 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between' },
  listKey: { color: '#d1d5db', fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  listVal: { color: colors.electricBlue, fontSize: 11, fontFamily: 'Outfit_700Bold' },
  noDataText: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular', fontStyle: 'italic' },
  
  coachNameText: { fontSize: 16, marginTop: 4, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' }
});
