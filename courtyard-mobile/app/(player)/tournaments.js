import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function TournamentsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'my'

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/api/tournaments');
      setTournaments(res.data || []);
    } catch (err) {
      console.error('Fetch tournaments error:', err);
      Alert.alert('Error', 'Failed to retrieve tournaments list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTournaments();
  }, []);

  const handleRegister = async (tournamentId, title) => {
    Alert.alert(
      'Register for Tournament',
      `Would you like to register for "${title}"?\n\nEntry fee will be managed on-spot or verified by club managers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register Now',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post(`/api/tournaments/register/${tournamentId}`);
              Alert.alert('Registered 🎉', `You have registered for ${title}! Good luck on the courts.`);
              fetchTournaments();
            } catch (err) {
              Alert.alert('Failed', err?.response?.data?.error || 'Registration failed.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const upcomingTournaments = tournaments.filter(t => !t.registrations?.includes(user?.id));
  const registeredTournaments = tournaments.filter(t => t.registrations?.includes(user?.id));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonPink} />
        <Text style={styles.loadingText}>Opening tournament board...</Text>
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
        <Text style={styles.headerTitle}>Tournaments</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'upcoming' && { color: colors.neonPink }]}>Upcoming Events</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my' && styles.tabBtnActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'my' && { color: colors.neonPink }]}>My Entries ({registeredTournaments.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonPink} />
        }
      >
        {activeTab === 'upcoming' ? (
          upcomingTournaments.length > 0 ? (
            upcomingTournaments.map((tournament) => (
              <GlassPanel key={tournament._id} style={styles.tourCard}>
                <Image source={{ uri: tournament.image }} style={styles.tourImage} />
                <View style={styles.tourContent}>
                  <View style={styles.dateRow}>
                    <Text style={styles.tourDate}>📅 {new Date(tournament.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    <Text style={styles.feeLabel}>Entry: ₹{tournament.entryFee}</Text>
                  </View>
                  
                  <Text style={styles.tourTitle}>{tournament.title}</Text>
                  <Text style={styles.tourDesc}>{tournament.description}</Text>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.prizeRow}>
                    <View>
                      <Label>Prize Pool</Label>
                      <NeonText style={styles.prizeAmt} color={colors.neonPink}>{tournament.prizePool}</NeonText>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.registerBtn}
                      onPress={() => handleRegister(tournament._id, tournament.title)}
                      disabled={submitting}
                    >
                      <Text style={styles.registerBtnText}>Join Battle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassPanel>
            ))
          ) : (
            <GlassPanel style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming tournaments scheduled. Check back later!</Text>
            </GlassPanel>
          )
        ) : (
          registeredTournaments.length > 0 ? (
            registeredTournaments.map((tournament) => (
              <GlassPanel key={tournament._id} style={styles.tourCard}>
                <Image source={{ uri: tournament.image }} style={[styles.tourImage, { opacity: 0.8 }]} />
                <View style={styles.tourContent}>
                  <View style={styles.dateRow}>
                    <Text style={styles.tourDate}>📅 {new Date(tournament.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    <View style={styles.registeredBadge}>
                      <Text style={styles.registeredBadgeText}>Registered</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.tourTitle}>{tournament.title}</Text>
                  <Text style={styles.tourDesc}>{tournament.description}</Text>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.prizeRow}>
                    <View>
                      <Label>Estimated Prize Pool</Label>
                      <NeonText style={styles.prizeAmt} color={colors.neonPink}>{tournament.prizePool}</NeonText>
                    </View>
                    
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Ready to Play</Text>
                    </View>
                  </View>
                </View>
              </GlassPanel>
            ))
          ) : (
            <GlassPanel style={styles.emptyState}>
              <Text style={styles.emptyText}>You haven't registered for any tournaments yet.</Text>
            </GlassPanel>
          )
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
  backText: { color: colors.neonPink, fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 },

  tabsRow: {
    flexDirection: 'row', padding: 4, marginHorizontal: 16, marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabBtnText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  tourCard: { borderRadius: 18, overflow: 'hidden' },
  tourImage: { width: '100%', height: 150, objectFit: 'cover' },
  tourContent: { padding: 16 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tourDate: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 11 },
  feeLabel: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  
  tourTitle: { color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  tourDesc: { color: colors.muted, fontSize: 12, fontFamily: 'Outfit_400Regular', marginTop: 4, lineHeight: 18 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  
  prizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prizeAmt: { fontSize: 16, fontFamily: 'Outfit_700Bold' },
  
  registerBtn: {
    backgroundColor: colors.neonPink, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: colors.neonPink, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  registerBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  registeredBadge: { backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  registeredBadgeText: { color: colors.neonGreen, fontSize: 9, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  statusText: { color: '#d1d5db', fontSize: 10, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

  emptyState: { padding: 40, alignItems: 'center', borderRadius: 16 },
  emptyText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
});
