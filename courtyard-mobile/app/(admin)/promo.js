import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { GlassPanel, Label } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';
import { useRouter } from 'expo-router';

export default function AdminPromo() {
  const router = useRouter();
  const [promoType, setPromoType] = useState('promo'); // promo, alert
  const [promoTitle, setPromoTitle] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSendBroadcast = async () => {
    if (!promoTitle.trim() || !promoMsg.trim()) {
      Alert.alert('Error', 'Please enter both a title and a message.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/admin/broadcast', {
        title: promoTitle.trim(),
        message: promoMsg.trim(),
        type: promoType
      });
      Alert.alert('Success', 'Broadcast message sent to all active users.');
      setPromoTitle('');
      setPromoMsg('');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to send broadcast.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Broadcast System" 
        subtitle="Mass Communication" 
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassPanel style={styles.card}>
          <Label>Message Type</Label>
          <View style={styles.typeRow}>
            <TouchableOpacity 
              style={[styles.typeBtn, promoType === 'promo' && styles.typeBtnPromoActive]}
              onPress={() => setPromoType('promo')}
            >
              <Text style={[styles.typeBtnText, promoType === 'promo' && { color: '#000' }]}>Promo / Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, promoType === 'alert' && styles.typeBtnAlertActive]}
              onPress={() => setPromoType('alert')}
            >
              <Text style={[styles.typeBtnText, promoType === 'alert' && { color: '#000' }]}>Important Alert</Text>
            </TouchableOpacity>
          </View>

          <Label style={{ marginTop: 20 }}>Title / Subject</Label>
          <TextInput
            style={styles.input}
            placeholder="e.g. Flash Sale: 50% Off Courts!"
            placeholderTextColor="#71717a"
            value={promoTitle}
            onChangeText={setPromoTitle}
          />

          <Label style={{ marginTop: 20 }}>Detailed Message</Label>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Describe the offer or alert here..."
            placeholderTextColor="#71717a"
            value={promoMsg}
            onChangeText={setPromoMsg}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && { opacity: 0.5 }]} 
            onPress={handleSendBroadcast}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>Broadcast to Network</Text>
            )}
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
  typeBtnText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 11, textTransform: 'uppercase' },
  typeBtnPromoActive: { backgroundColor: colors.electricBlue, borderColor: colors.electricBlue },
  typeBtnAlertActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 13 },
  submitBtn: { backgroundColor: colors.neonGreen, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});
