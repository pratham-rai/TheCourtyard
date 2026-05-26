import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';
import { useRouter } from 'expo-router';

export default function AdminBookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('active'); // active, past
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/admin/bookings');
      setBookings(res.data || []);
    } catch (err) {
      console.error('Admin bookings fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const now = new Date();
  
  // Basic separation logic; assumes booking.date is 'YYYY-MM-DD'
  // and booking.timeSlot is like '14:00 - 15:00'
  const filteredBookings = bookings.filter(b => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    // Simple rough check for active vs past (can be improved with exact time)
    const isPast = bookingDate < new Date(now.toDateString());
    return activeTab === 'active' ? !isPast : isPast;
  });

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Bookings Log" 
        subtitle="Admin Control" 
        onRefresh={onRefresh}
      />

      <View style={styles.tabHeader}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'active' && styles.activeTabBtn]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'past' && styles.activeTabBtn]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.neonGreen} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
        >
          {filteredBookings.length === 0 ? (
            <Text style={styles.emptyText}>No {activeTab} bookings found.</Text>
          ) : (
            filteredBookings.map((b) => (
              <GlassPanel key={b._id} style={styles.bookingCard}>
                <View style={styles.row}>
                  <View>
                    <Label>User</Label>
                    <Text style={styles.valText}>{b.user?.name || 'Unknown'}</Text>
                    <Text style={styles.subText}>{b.user?.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Label>Court</Label>
                    <NeonText>{b.court?.name || 'Spot Booking'}</NeonText>
                  </View>
                </View>
                <View style={[styles.row, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                  <View>
                    <Label>Schedule</Label>
                    <Text style={styles.valText}>{b.date}</Text>
                    <Text style={styles.subText}>{b.timeSlot}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Label>Payment</Label>
                    <Text style={styles.valText}>₹{b.amount}</Text>
                    <Text style={[styles.statusTag, { color: b.paymentStatus === 'completed' ? colors.neonGreen : '#facc15' }]}>
                      {b.paymentStatus?.toUpperCase() || 'PAID'}
                    </Text>
                  </View>
                </View>
              </GlassPanel>
            ))
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
  bookingCard: { padding: 16, borderRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  valText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit_700Bold' },
  subText: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular', marginTop: 2 },
  statusTag: { fontSize: 10, fontFamily: 'Outfit_700Bold', marginTop: 4 },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Outfit_400Regular', fontSize: 12 },
});
