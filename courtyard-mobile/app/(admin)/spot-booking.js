import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';
import { useRouter } from 'expo-router';

export default function AdminSpotBooking() {
  const router = useRouter();
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Simple hardcoded hours for demo
  const allHours = Array.from({ length: 17 }, (_, i) => i + 6);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courtsRes, usersRes] = await Promise.all([
          api.get('/api/courts'),
          api.get('/api/admin/users') // assuming endpoint returns list of users for selection
        ]);
        setCourts(courtsRes.data || []);
        setUsers(usersRes.data || []);
      } catch (err) {
        console.error('Spot booking data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleSlot = (hour) => {
    if (selectedSlots.includes(hour)) setSelectedSlots(selectedSlots.filter(s => s !== hour));
    else setSelectedSlots([...selectedSlots, hour]);
  };

  const handleCheckout = async () => {
    if (!selectedCourt || !selectedUser || selectedSlots.length === 0) {
      Alert.alert('Incomplete', 'Please select a user, a court, and at least one slot.');
      return;
    }

    setSubmitting(true);
    try {
      // In a real POS, we'd hit a dedicated spot-booking API
      // Here we simulate standard booking bypass
      await api.post('/api/admin/spot-booking', {
        userId: selectedUser._id,
        courtId: selectedCourt._id,
        date: new Date().toISOString().split('T')[0],
        slots: selectedSlots,
        paymentMethod: 'cash'
      });
      Alert.alert('POS Success', 'Spot booking confirmed.');
      setSelectedSlots([]);
      setSelectedCourt(null);
      setSelectedUser(null);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to process POS booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Spot Booking POS" 
        subtitle="Walk-in Manager" 
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.neonGreen} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <GlassPanel style={styles.card}>
            <Label>1. Select User / Member</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              <TouchableOpacity
                 style={[styles.userBtn, !selectedUser && styles.activeUserBtn]}
                 onPress={() => setSelectedUser({ _id: 'guest', name: 'Guest Walk-in' })}
              >
                <Text style={[styles.userText, !selectedUser && { color: '#000' }]}>Guest Walk-in</Text>
              </TouchableOpacity>
              {users.slice(0, 5).map((u) => (
                <TouchableOpacity
                  key={u._id}
                  style={[styles.userBtn, selectedUser?._id === u._id && styles.activeUserBtn]}
                  onPress={() => setSelectedUser(u)}
                >
                  <Text style={[styles.userText, selectedUser?._id === u._id && { color: '#000' }]}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Label style={{ marginTop: 16 }}>2. Select Court</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {courts.map((court) => (
                <TouchableOpacity
                  key={court._id}
                  style={[styles.courtBtn, selectedCourt?._id === court._id && styles.activeCourtBtn]}
                  onPress={() => setSelectedCourt(court)}
                >
                  <Text style={[styles.courtText, selectedCourt?._id === court._id && styles.activeCourtText]}>
                    {court.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Label style={{ marginTop: 16 }}>3. Available Time Slots (Today)</Label>
            <View style={styles.slotsGrid}>
              {allHours.map((hour) => {
                const isSelected = selectedSlots.includes(hour);
                return (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.slotBtn, isSelected && styles.activeSlotBtn]}
                    onPress={() => toggleSlot(hour)}
                  >
                    <Text style={[styles.slotText, isSelected && { color: '#000' }]}>
                      {hour}:00
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Bill</Text>
              <NeonText style={styles.summaryTotal}>
                ₹{selectedCourt ? selectedCourt.basePrice * selectedSlots.length : 0}
              </NeonText>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.5 }]} 
              onPress={handleCheckout}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>Process Cash Payment</Text>
            </TouchableOpacity>
          </GlassPanel>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 16 },
  
  userBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeUserBtn: { backgroundColor: colors.electricBlue, borderColor: colors.electricBlue },
  userText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  
  courtBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeCourtBtn: { backgroundColor: 'rgba(57,255,20,0.15)', borderColor: colors.neonGreen },
  courtText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  activeCourtText: { color: colors.neonGreen },
  
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  slotBtn: { width: '22%', paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeSlotBtn: { backgroundColor: colors.neonGreen, borderColor: colors.neonGreen },
  slotText: { color: '#d1d5db', fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  summaryTotal: { fontSize: 28 },
  
  submitBtn: { backgroundColor: colors.electricBlue, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});
