import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';

export default function ReceptionDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceptionData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookingsRes = await api.get('/api/admin/bookings');
      const todayBookings = bookingsRes.data.filter(b => b.date === today) || [];
      setBookings(todayBookings);
    } catch (err) {
      console.error('Fetch reception data error:', err);
      Alert.alert('Error', 'Failed to fetch reception logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceptionData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReceptionData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
        <Text style={styles.loadingText}>Opening reception desk...</Text>
      </View>
    );
  }

  const activeCheckIns = bookings.filter(b => b.checkedIn).length;
  const totalBookings = bookings.length;
  const upcomingBookings = totalBookings - activeCheckIns;

  return (
    <View style={styles.container}>
      <DashboardHeader role="Club Reception" name={user?.name} onLogout={logout} accentColor={colors.neonGreen} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />
        }
      >
        <Label>Club Desk Control</Label>
        
        <View style={styles.metricsContainer}>
          <GlassPanel style={styles.metricCard}>
            <Label>Active Check-Ins</Label>
            <NeonText style={styles.metricValue} color={colors.neonGreen}>
              {activeCheckIns}
            </NeonText>
            <Text style={styles.metricDesc}>Players currently checked in</Text>
          </GlassPanel>

          <GlassPanel style={styles.metricCard}>
            <Label>Upcoming / Pending</Label>
            <NeonText style={styles.metricValue} color={colors.electricBlue}>
              {upcomingBookings}
            </NeonText>
            <Text style={styles.metricDesc}>Bookings yet to check in today</Text>
          </GlassPanel>
        </View>

        <GlassPanel style={[styles.metricCard, { marginTop: 12 }]}>
          <Label>Total Daily Bookings</Label>
          <NeonText style={styles.metricValue} color="#facc15">
            {totalBookings}
          </NeonText>
        </GlassPanel>

        <Label style={{ marginTop: 20 }}>Reception Utilities</Label>
        <View style={styles.quickGrid}>
          {[
            { label: '📅 Bookings', route: '/(reception)/bookings', desc: 'Daily Schedule & POS' },
            { label: '📷 Scanner', route: '/(reception)/scanner', desc: 'Check-in QR Scanner' },
            { label: '📦 Inventory', route: '/(reception)/inventory', desc: 'Rentals & Stock' },
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

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  metricsContainer: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, padding: 16, borderRadius: 16, gap: 6 },
  metricValue: { fontSize: 32, fontFamily: 'Outfit_700Bold' },
  metricDesc: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_400Regular', lineHeight: 14 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: {
    width: '48%', backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 16, gap: 4,
  },
  quickBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 13 },
  quickBtnDesc: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_400Regular' },
});
