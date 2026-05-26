import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function AdminInventoryScreen() {
  const router = useRouter();

  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('100');
  const [stock, setStock] = useState('20');
  const [isActive, setIsActive] = useState(true);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/api/admin/inventory');
      setInventory(res.data || []);
    } catch (err) {
      console.error('Fetch inventory error:', err);
      Alert.alert('Error', 'Failed to retrieve gear inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInventory();
  }, []);

  const handleOpenEdit = (item) => {
    setIsNew(false);
    setSelectedItem(item);
    setName(item.name || '');
    setPrice(String(item.price || '100'));
    setStock(String(item.stock || '20'));
    setIsActive(item.isActive !== false);
    setModalVisible(true);
  };

  const handleOpenAdd = () => {
    setIsNew(true);
    setSelectedItem(null);
    setName('');
    setPrice('100');
    setStock('20');
    setIsActive(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !stock.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        isActive
      };

      if (isNew) {
        await api.post('/api/admin/inventory', payload);
        Alert.alert('Added 🎉', 'Product registered successfully.');
      } else {
        await api.put(`/api/admin/inventory/${selectedItem._id}`, payload);
        Alert.alert('Success 🎉', 'Product details updated.');
      }

      setModalVisible(false);
      fetchInventory();
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.error || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId, itemName) => {
    Alert.alert(
      'Remove Product',
      `Delete "${itemName}" permanently from inventory records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.delete(`/api/admin/inventory/${itemId}`);
              Alert.alert('Success', 'Product removed.');
              setModalVisible(false);
              fetchInventory();
            } catch (err) {
              Alert.alert('Failed', 'Failed to remove product.');
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
        <Text style={styles.loadingText}>Counting inventory sheets...</Text>
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
        <Text style={styles.headerTitle}>Gear Inventory</Text>
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
        {inventory.length > 0 ? (
          inventory.map((item) => {
            const isLowStock = item.stock < 5;
            return (
              <TouchableOpacity key={item._id} activeOpacity={0.8} onPress={() => handleOpenEdit(item)}>
                <GlassPanel style={[
                  styles.itemCard,
                  !item.isActive && { opacity: 0.5 },
                  isLowStock && { borderColor: 'rgba(239,68,68,0.4)' }
                ]}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {isLowStock ? (
                      <View style={styles.lowStockBadge}>
                        <Text style={styles.lowStockText}>Low Stock ({item.stock})</Text>
                      </View>
                    ) : (
                      <Text style={styles.stockText}>Stock: {item.stock}</Text>
                    )}
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.footerRow}>
                    <Text style={styles.priceText}>Price: <Text style={{ color: colors.neonGreen, fontFamily: 'Outfit_700Bold' }}>₹{item.price}</Text></Text>
                    <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Disabled'}</Text>
                  </View>
                </GlassPanel>
              </TouchableOpacity>
            );
          })
        ) : (
          <GlassPanel style={styles.emptyState}>
            <Text style={styles.emptyText}>No items currently registered in club inventory.</Text>
          </GlassPanel>
        )}
      </ScrollView>

      {/* Edit/Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isNew ? 'Register Product' : 'Configure Product'}</Text>
            <View style={styles.modalDivider} />

            <View style={styles.modalFields}>
              <Label>Product Name</Label>
              <TextInput
                style={styles.input}
                placeholder="e.g. Pro Carbon Paddle"
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={setName}
              />

              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Label>Unit Price (₹)</Label>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Label>Stock Quantity</Label>
                  <TextInput
                    style={styles.input}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Label>Product Available for Rentals/Sales</Label>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#27272a', true: 'rgba(57,255,20,0.3)' }}
                  thumbColor={isActive ? colors.neonGreen : '#71717a'}
                />
              </View>
            </View>

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
                  onPress={() => handleDelete(selectedItem?._id, selectedItem?.name)}
                  disabled={submitting}
                >
                  <Text style={styles.deleteBtnText}>Remove</Text>
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

  itemCard: { padding: 16, borderRadius: 16, gap: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase' },
  stockText: { color: '#d1d5db', fontSize: 11, fontFamily: 'Outfit_700Bold' },
  
  lowStockBadge: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lowStockText: { color: '#ef4444', fontSize: 9, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  statusText: { color: colors.electricBlue, fontSize: 9, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

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
