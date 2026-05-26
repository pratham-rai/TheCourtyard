import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function AdminUsersScreen() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editMembership, setEditMembership] = useState('None');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Fetch users error:', err);
      Alert.alert('Error', 'Failed to retrieve user list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const handleEditOpen = (userItem) => {
    setSelectedUser(userItem);
    setEditName(userItem.name || '');
    setEditEmail(userItem.email || '');
    setEditRole(userItem.role || 'user');
    setEditMembership(userItem.membership || 'None');
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and Email are required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/api/admin/users/${selectedUser._id}`, {
        name: editName.trim(),
        email: editEmail.toLowerCase().trim(),
        role: editRole,
        membership: editMembership
      });
      
      Alert.alert('Success 🎉', 'User details updated.');
      setEditModalVisible(false);
      fetchUsers();
    } catch (err) {
      Alert.alert('Failed', err?.response?.data?.error || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId, name) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to permanently delete user account "${name}"? This action is irreversible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.delete(`/api/admin/users/${userId}`);
              Alert.alert('Success', 'User profile deleted.');
              setEditModalVisible(false);
              fetchUsers();
            } catch (err) {
              Alert.alert('Failed', 'Failed to delete user.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(
    u => u.name?.toLowerCase().includes(search.toLowerCase()) || 
         u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
        <Text style={styles.loadingText}>Opening directory records...</Text>
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
        <Text style={styles.headerTitle}>User Directory</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search box */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email address..."
          placeholderTextColor="#71717a"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />
        }
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((item) => (
            <TouchableOpacity key={item._id} activeOpacity={0.8} onPress={() => handleEditOpen(item)}>
              <GlassPanel style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name?.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{item.role}</Text>
                  </View>
                </View>

                <View style={styles.divider} />
                
                <View style={styles.userMetaRow}>
                  <Text style={styles.metaLabel}>Tier: <Text style={{ color: colors.electricBlue, fontFamily: 'Outfit_700Bold' }}>{item.membership}</Text></Text>
                  <Text style={styles.metaLabel}>Wallet: <Text style={{ color: colors.neonGreen, fontFamily: 'Outfit_700Bold' }}>₹{item.walletBalance || 0}</Text></Text>
                  <Text style={styles.metaLabel}>Tab: <Text style={{ color: '#facc15', fontFamily: 'Outfit_700Bold' }}>₹{item.tabBalance || 0}</Text></Text>
                </View>
              </GlassPanel>
            </TouchableOpacity>
          ))
        ) : (
          <GlassPanel style={styles.emptyState}>
            <Text style={styles.emptyText}>No users matched your search criteria.</Text>
          </GlassPanel>
        )}
      </ScrollView>

      {/* Edit User Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configure User Account</Text>
            <View style={styles.modalDivider} />

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFields}>
                <Label>Full Name</Label>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                />

                <Label style={{ marginTop: 8 }}>Email Address</Label>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Label style={{ marginTop: 8 }}>System Role</Label>
                <View style={styles.selectRow}>
                  {['user', 'coach', 'reception', 'admin'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.selectBtn, editRole === r && styles.selectBtnActive]}
                      onPress={() => setEditRole(r)}
                    >
                      <Text style={styles.selectBtnText}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Label style={{ marginTop: 8 }}>Membership Pass Tier</Label>
                <View style={styles.selectRow}>
                  {['None', 'Basic', 'Pro', 'Elite'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.selectBtn, editMembership === t && styles.selectBtnActive]}
                      onPress={() => setEditMembership(t)}
                    >
                      <Text style={styles.selectBtnText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalDivider} />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleUpdate}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>Save Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(selectedUser?._id, selectedUser?.name)}
                disabled={submitting}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
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

  searchBar: { paddingHorizontal: 16, marginTop: 16 },
  searchInput: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: '#fff', fontFamily: 'Outfit_400Regular', fontSize: 13,
  },

  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  userCard: { padding: 16, borderRadius: 16 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 13 },
  userName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase' },
  userEmail: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  roleBadgeText: { color: '#d1d5db', fontSize: 9, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  userMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_600SemiBold' },

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
  
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  selectBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  selectBtnActive: {
    backgroundColor: 'rgba(57,255,20,0.15)', borderColor: colors.neonGreen,
  },
  selectBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase' },

  formActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  submitBtn: { flex: 2, backgroundColor: colors.neonGreen, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  submitBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  
  deleteBtn: { flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  deleteBtnText: { color: '#ef4444', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
});
