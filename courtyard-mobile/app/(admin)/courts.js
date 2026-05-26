import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function AdminCourtsScreen() {
  const router = useRouter();

  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [surface, setSurface] = useState('Professional Acrylic Cushion');
  const [basePrice, setBasePrice] = useState('800');
  const [peakPrice, setPeakPrice] = useState('1200');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCourts = async () => {
    try {
      const res = await api.get('/api/courts');
      setCourts(res.data || []);
    } catch (err) {
      console.error('Fetch courts error:', err);
      Alert.alert('Error', 'Failed to retrieve courts catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourts();
  }, []);

  const handleOpenEdit = (court) => {
    setIsNew(false);
    setSelectedCourt(court);
    setName(court.name || '');
    setSurface(court.surface || 'Professional Acrylic Cushion');
    setBasePrice(String(court.basePrice || '800'));
    setPeakPrice(String(court.peakPrice || '1200'));
    setImage(court.image || '');
    setDescription(court.description || '');
    setIsActive(court.isActive !== false);
    setModalVisible(true);
  };

  const handleOpenAdd = () => {
    setIsNew(true);
    setSelectedCourt(null);
    setName('');
    setSurface('Professional Acrylic Cushion');
    setBasePrice('800');
    setPeakPrice('1200');
    setImage('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600');
    setDescription('Premium indoor pickleball court with tournament-grade LED stadium floodlights.');
    setIsActive(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !surface.trim() || !basePrice.trim() || !peakPrice.trim() || !image.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        surface: surface.trim(),
        basePrice: Number(basePrice),
        peakPrice: Number(peakPrice),
        image: image.trim(),
        description: description.trim(),
        isActive
      };

      if (isNew) {
        await api.post('/api/admin/courts', payload);
        Alert.alert('Created 🎉', 'New court added successfully.');
      } else {
        await api.put(`/api/admin/courts/${selectedCourt._id}`, payload);
        Alert.alert('Updated 🎉', 'Court details updated.');
      }

      setModalVisible(false);
      fetchCourts();
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.error || 'Failed to save court.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courtId, courtName) => {
    Alert.alert(
      'Delete Court',
      `Delete "${courtName}"? This will affect bookings currently tied to this court.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.delete(`/api/admin/courts/${courtId}`);
              Alert.alert('Deleted', 'Court removed.');
              setModalVisible(false);
              fetchCourts();
            } catch (err) {
              Alert.alert('Failed', 'Failed to remove court.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
        <Text style={styles.loadingText}>Fetching courts layout...</Text>
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
        <Text style={styles.headerTitle}>Courts Settings</Text>
        <TouchableOpacity onPress={handleOpenAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />
        }
      >
        {courts.length > 0 ? (
          courts.map((court) => (
            <TouchableOpacity key={court._id} activeOpacity={0.8} onPress={() => handleOpenEdit(court)}>
              <GlassPanel style={[styles.courtCard, !court.isActive && { opacity: 0.5 }]}>
                <View style={styles.courtRow}>
                  <Text style={styles.courtName}>{court.name}</Text>
                  <View style={[styles.statusBadge, court.isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>{court.isActive ? 'Active' : 'Disabled'}</Text>
                  </View>
                </View>
                <Text style={styles.courtDesc}>{court.description}</Text>
                
                <View style={styles.divider} />
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base: <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold' }}>₹{court.basePrice}</Text></Text>
                  <Text style={styles.priceLabel}>Peak: <Text style={{ color: colors.electricBlue, fontFamily: 'Outfit_700Bold' }}>₹{court.peakPrice}</Text></Text>
                  <Text style={styles.surfaceLabel}>{court.surface}</Text>
                </View>
              </GlassPanel>
            </TouchableOpacity>
          ))
        ) : (
          <GlassPanel style={styles.emptyState}>
            <Text style={styles.emptyText}>No courts registered. Add a court to unlock booking availability.</Text>
          </GlassPanel>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isNew ? 'Create New Court' : 'Modify Court Settings'}</Text>
            <View style={styles.modalDivider} />

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFields}>
                <Label>Court Name</Label>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Center Court 1"
                  placeholderTextColor="#71717a"
                  value={name}
                  onChangeText={setName}
                />

                <Label style={{ marginTop: 8 }}>Surface Type</Label>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Professional Acrylic Cushion"
                  placeholderTextColor="#71717a"
                  value={surface}
                  onChangeText={setSurface}
                />

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Label>Base Price (₹/hr)</Label>
                    <TextInput
                      style={styles.input}
                      value={basePrice}
                      onChangeText={setBasePrice}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Label>Peak Price (₹/hr)</Label>
                    <TextInput
                      style={styles.input}
                      value={peakPrice}
                      onChangeText={setPeakPrice}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <Label style={{ marginTop: 8 }}>Cover Image URL</Label>
                <TextInput
                  style={styles.input}
                  placeholder="Image URL link..."
                  placeholderTextColor="#71717a"
                  value={image}
                  onChangeText={setImage}
                />

                <Label style={{ marginTop: 8 }}>Court Description</Label>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="Premium amenities details..."
                  placeholderTextColor="#71717a"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <View style={styles.switchRow}>
                  <Label>Court Active & Reservable</Label>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: '#27272a', true: 'rgba(57,255,20,0.3)' }}
                    thumbColor={isActive ? colors.neonGreen : '#71717a'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalDivider} />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>Save</Text>
              </TouchableOpacity>
              
              {!isNew && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(selectedCourt?._id, selectedCourt?.name)}
                  disabled={submitting}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </GlassPanel>
        </View>
      </Modal>
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
  addBtn: { backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  courtCard: { padding: 16, borderRadius: 16, gap: 4 },
  courtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courtName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 15, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusActive: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: 'rgba(57,255,20,0.2)' },
  statusInactive: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' },
  statusText: { color: '#fff', fontSize: 9, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  courtDesc: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  surfaceLabel: { color: colors.electricBlue, fontSize: 10, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

  emptyState: { padding: 40, alignItems: 'center', borderRadius: 16 },
  emptyText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', padding: 24, borderRadius: 24 },
  modalTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  modalFields: { gap: 10 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: '#fff', fontFamily: 'Outfit_400Regular', fontSize: 13,
  },
  rowFields: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },

  formActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  submitBtn: { flex: 2, backgroundColor: colors.neonGreen, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  submitBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  
  deleteBtn: { flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  deleteBtnText: { color: '#ef4444', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
});
