import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';
import { useRouter } from 'expo-router';

export default function AdminBlockSlots() {
  const router = useRouter();
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hardcode hours 6-22 for this demo
  const allHours = Array.from({ length: 17 }, (_, i) => i + 6);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await api.get('/api/courts');
        setCourts(res.data || []);
        if (res.data?.length > 0) setSelectedCourt(res.data[0]._id);
      } catch (err) {
        console.error('Fetch courts error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  const toggleSlot = (hour) => {
    if (selectedSlots.includes(hour)) {
      setSelectedSlots(selectedSlots.filter(s => s !== hour));
    } else {
      setSelectedSlots([...selectedSlots, hour]);
    }
  };

  const handleBlockSubmit = async () => {
    if (!selectedCourt || !blockDate || selectedSlots.length === 0) {
      Alert.alert('Error', 'Please select a court, date, and at least one slot.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/admin/block', {
        courtId: selectedCourt,
        date: blockDate,
        slots: selectedSlots
      });
      Alert.alert('Success', 'Slots blocked successfully.');
      setSelectedSlots([]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to block slots.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Block Slots" 
        subtitle="Schedule Override" 
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.neonGreen} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassPanel style={styles.card}>
            <Label>Select Court</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {courts.map((court) => (
                <TouchableOpacity
                  key={court._id}
                  style={[styles.courtBtn, selectedCourt === court._id && styles.activeCourtBtn]}
                  onPress={() => setSelectedCourt(court._id)}
                >
                  <Text style={[styles.courtText, selectedCourt === court._id && styles.activeCourtText]}>
                    {court.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Label style={{ marginTop: 16 }}>Date (YYYY-MM-DD)</Label>
            <TextInput
              style={styles.input}
              value={blockDate}
              onChangeText={setBlockDate}
            />

            <Label style={{ marginTop: 16 }}>Select Hours to Block</Label>
            <View style={styles.slotsGrid}>
              {allHours.map((hour) => {
                const isSelected = selectedSlots.includes(hour);
                return (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.slotBtn, isSelected && styles.activeSlotBtn]}
                    onPress={() => toggleSlot(hour)}
                  >
                    <Text style={[styles.slotText, isSelected && styles.activeSlotText]}>
                      {hour}:00
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.5 }]} 
              onPress={handleBlockSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>Confirm Block</Text>
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
  courtBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeCourtBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' },
  courtText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  activeCourtText: { color: '#ef4444' },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: '#fff', marginTop: 4, fontFamily: 'Outfit_400Regular' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  slotBtn: { width: '22%', paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeSlotBtn: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  slotText: { color: '#d1d5db', fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  activeSlotText: { color: '#ef4444' },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});
