import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function AdminCoursesScreen() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('10 Days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState('3000');
  const [slotsTotal, setSlotsTotal] = useState('15');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [schedule, setSchedule] = useState('Mon, Wed, Fri @ 16:00-17:30');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('active'); // 'active', 'upcoming', 'completed'

  const fetchCoursesAndCoaches = async () => {
    try {
      const coursesRes = await api.get('/api/admin/courses');
      setCourses(coursesRes.data || []);

      const coachesRes = await api.get('/api/coaching/coaches');
      setCoaches(coachesRes.data || []);
    } catch (err) {
      console.error('Fetch courses/coaches error:', err);
      Alert.alert('Error', 'Failed to retrieve coaching academy schedules.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndCoaches();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCoursesAndCoaches();
  }, []);

  const handleOpenEdit = (course) => {
    setIsNew(false);
    setSelectedCourse(course);
    setTitle(course.title || '');
    setDescription(course.description || '');
    setDuration(course.duration || '10 Days');
    setStartDate(course.startDate || '');
    setEndDate(course.endDate || '');
    setPrice(String(course.price || '3000'));
    setSlotsTotal(String(course.slotsTotal || '15'));
    setSelectedCoachId(course.coach?._id || course.coach || '');
    setSchedule(course.schedule || 'Mon, Wed, Fri @ 16:00-17:30');
    setImage(course.image || '');
    setStatus(course.status || 'active');
    setModalVisible(true);
  };

  const handleOpenAdd = () => {
    setIsNew(true);
    setSelectedCourse(null);
    setTitle('');
    setDescription('Master the kitchen, perfect your paddle positioning, and dominate baseline battles.');
    setDuration('10 Days');
    
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(nextWeek);
    
    setPrice('3000');
    setSlotsTotal('15');
    setSelectedCoachId(coaches.length > 0 ? coaches[0]._id : '');
    setSchedule('Mon, Wed, Fri @ 16:00-17:30');
    setImage('https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=600');
    setStatus('active');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !duration.trim() || !startDate.trim() || !endDate.trim() || !price.trim() || !slotsTotal.trim() || !selectedCoachId || !schedule.trim() || !image.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        duration: duration.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        price: Number(price),
        slotsTotal: Number(slotsTotal),
        coach: selectedCoachId,
        schedule: schedule.trim(),
        image: image.trim(),
        status
      };

      if (isNew) {
        await api.post('/api/admin/courses', payload);
        Alert.alert('Created 🎉', 'New academy course added.');
      } else {
        await api.put(`/api/admin/courses/${selectedCourse._id}`, payload);
        Alert.alert('Updated 🎉', 'Academy course updated.');
      }

      setModalVisible(false);
      fetchCoursesAndCoaches();
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.error || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId, courseTitle) => {
    Alert.alert(
      'Delete Course',
      `Delete "${courseTitle}"? This will cancel all student enrollments in this course.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.delete(`/api/admin/courses/${courseId}`);
              Alert.alert('Deleted', 'Course removed from academy records.');
              setModalVisible(false);
              fetchCoursesAndCoaches();
            } catch (err) {
              Alert.alert('Failed', 'Failed to remove course.');
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
        <Text style={styles.loadingText}>Fetching academy records...</Text>
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
        <Text style={styles.headerTitle}>Academy Manager</Text>
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
        {courses.length > 0 ? (
          courses.map((course) => {
            const enrolled = course.slotsEnrolled || 0;
            const total = course.slotsTotal || 15;
            
            return (
              <TouchableOpacity key={course._id} activeOpacity={0.8} onPress={() => handleOpenEdit(course)}>
                <GlassPanel style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <View style={[styles.statusBadge, styles[`status_${course.status}`]]}>
                      <Text style={styles.statusText}>{course.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.courseCoach}>Coach: {course.coach?.name || 'Unassigned'}</Text>
                  <Text style={styles.courseSchedule}>Schedule: {course.schedule}</Text>

                  <View style={styles.divider} />

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Roster: <Text style={{ color: colors.electricBlue }}>{enrolled}/{total}</Text></Text>
                    <Text style={styles.metaText}>Fee: <Text style={{ color: colors.neonGreen }}>₹{course.price}</Text></Text>
                    <Text style={styles.durationText}>{course.duration}</Text>
                  </View>
                </GlassPanel>
              </TouchableOpacity>
            );
          })
        ) : (
          <GlassPanel style={styles.emptyState}>
            <Text style={styles.emptyText}>No academy courses registered. Add a course to start enrollments.</Text>
          </GlassPanel>
        )}
      </ScrollView>

      {/* Edit/Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isNew ? 'Create Academy Course' : 'Edit Course Details'}</Text>
            <View style={styles.modalDivider} />

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFields}>
                <Label>Course Title</Label>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10 Days Summer Camp"
                  placeholderTextColor="#71717a"
                  value={title}
                  onChangeText={setTitle}
                />

                <Label style={{ marginTop: 8 }}>Course Description</Label>
                <TextInput
                  style={[styles.input, { height: 50 }]}
                  placeholder="Focus areas, competencies..."
                  placeholderTextColor="#71717a"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Label>Duration</Label>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 10 Days"
                      value={duration}
                      onChangeText={setDuration}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Label>Enrollment Fee (₹)</Label>
                    <TextInput
                      style={styles.input}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Label>Capacity (slots)</Label>
                    <TextInput
                      style={styles.input}
                      value={slotsTotal}
                      onChangeText={setSlotsTotal}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Label>Weekly Schedule</Label>
                    <TextInput
                      style={styles.input}
                      placeholder="Mon, Wed @ 16:00"
                      value={schedule}
                      onChangeText={setSchedule}
                    />
                  </View>
                </View>

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Label>Start Date (YYYY-MM-DD)</Label>
                    <TextInput
                      style={styles.input}
                      placeholder="2026-06-01"
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Label>End Date (YYYY-MM-DD)</Label>
                    <TextInput
                      style={styles.input}
                      placeholder="2026-06-15"
                      value={endDate}
                      onChangeText={setEndDate}
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

                <Label style={{ marginTop: 8 }}>Assign Coach</Label>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coachSelector}>
                  {coaches.map((c) => {
                    const isSelected = selectedCoachId === c._id;
                    return (
                      <TouchableOpacity
                        key={c._id}
                        onPress={() => setSelectedCoachId(c._id)}
                        style={[styles.coachBtn, isSelected && styles.coachBtnActive]}
                      >
                        <Text style={[styles.coachBtnText, isSelected && { color: colors.electricBlue }]}>{c.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Label style={{ marginTop: 8 }}>Course Status</Label>
                <View style={styles.statusSelectRow}>
                  {['upcoming', 'active', 'completed'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusSelectBtn, status === st && styles.statusSelectBtnActive]}
                      onPress={() => setStatus(st)}
                    >
                      <Text style={styles.statusSelectText}>{st.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
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
                  onPress={() => handleDelete(selectedCourse?._id, selectedCourse?.title)}
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

  courseCard: { padding: 16, borderRadius: 16, gap: 4 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  courseTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 15, textTransform: 'uppercase', flex: 1 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  status_active: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: 'rgba(57,255,20,0.2)' },
  status_upcoming: { backgroundColor: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.2)' },
  status_completed: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' },
  statusText: { color: '#fff', fontSize: 8, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

  courseCoach: { color: '#d1d5db', fontSize: 12, fontFamily: 'Outfit_600SemiBold', marginTop: 4 },
  courseSchedule: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  durationText: { color: colors.electricBlue, fontSize: 10, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },

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
  
  coachSelector: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  coachBtn: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    marginRight: 8,
  },
  coachBtnActive: {
    backgroundColor: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.3)',
  },
  coachBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 10 },

  statusSelectRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  statusSelectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  statusSelectBtnActive: {
    backgroundColor: 'rgba(57,255,20,0.15)', borderColor: colors.neonGreen,
  },
  statusSelectText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 0.5 },

  formActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  submitBtn: { flex: 2, backgroundColor: colors.neonGreen, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  submitBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  
  deleteBtn: { flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  deleteBtnText: { color: '#ef4444', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
});
