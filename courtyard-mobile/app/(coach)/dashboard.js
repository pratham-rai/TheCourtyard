import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCoachData = async () => {
    try {
      const res = await api.get('/api/coach/my-students');
      setCourses(res.data.courses || []);
      setEnrollments(res.data.enrollments || []);
      if (res.data.courses?.length > 0 && !selectedCourse) {
        setSelectedCourse(res.data.courses[0]);
      }
    } catch (err) {
      console.error('Fetch coach students error:', err);
      Alert.alert('Access Denied', err?.response?.data?.error || 'Failed to retrieve students.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCoachData();
  }, []);

  const filteredEnrollments = enrollments.filter(
    e => e.course?._id === selectedCourse?._id
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.electricBlue} />
        <Text style={styles.loadingText}>Synchronizing roster...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader role="Academy Coach" name={user?.name} onLogout={logout} accentColor={colors.electricBlue} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.electricBlue} />
        }
      >
        {/* Banner */}
        <GlassPanel style={styles.banner}>
          <Text style={styles.bannerTitle}>Academy Roster & Logs</Text>
          <Text style={styles.bannerDesc}>
            Select your assigned course to view the enrollment sheet, mark session attendance, and log skill evaluations.
          </Text>
        </GlassPanel>

        {/* Assigned Courses Tabs */}
        <Label style={{ marginBottom: 4 }}>Assigned Coaching Courses</Label>
        {courses.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursesRow}>
            {courses.map((course) => {
              const isSelected = selectedCourse?._id === course._id;
              return (
                <TouchableOpacity
                  key={course._id}
                  onPress={() => setSelectedCourse(course)}
                  style={[
                    styles.courseTab,
                    isSelected && styles.courseTabActive
                  ]}
                >
                  <Text style={[styles.courseTabText, isSelected && { color: colors.electricBlue }]}>
                    {course.title}
                  </Text>
                  <Text style={styles.courseTabSchedule}>{course.schedule}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <GlassPanel style={styles.emptyState}>
            <Text style={styles.emptyText}>You are not assigned to any active coaching courses.</Text>
          </GlassPanel>
        )}

        {/* Roster list */}
        {selectedCourse && (
          <View style={styles.rosterSection}>
            <View style={styles.rosterHeader}>
              <Label>Enrolled Student Roster ({filteredEnrollments.length})</Label>
            </View>

            {filteredEnrollments.length > 0 ? (
              filteredEnrollments.map((enrollment) => {
                const student = enrollment.user;
                if (!student) return null;
                const progressCount = enrollment.progressLogs?.length || 0;
                
                return (
                  <GlassPanel key={enrollment._id} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{student.name?.slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentEmail}>{student.email}</Text>
                        <Text style={styles.studentMeta}>
                          Pass: <Text style={{ color: colors.neonGreen }}>{student.membership}</Text> · Evals logged: {progressCount}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.studentActions}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attendanceText}>
                          Attendance: {enrollment.attendance?.length || 0} Sessions
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.evaluateBtn}
                        onPress={() => router.push({
                          pathname: '/(coach)/evaluation',
                          params: {
                            enrollmentId: enrollment._id,
                            studentName: student.name,
                            courseTitle: selectedCourse.title
                          }
                        })}
                      >
                        <Text style={styles.evaluateBtnText}>Evaluate & Check-In</Text>
                      </TouchableOpacity>
                    </View>
                  </GlassPanel>
                );
              })
            ) : (
              <GlassPanel style={styles.emptyState}>
                <Text style={styles.emptyText}>No students currently enrolled in this class.</Text>
              </GlassPanel>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  


  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  
  banner: { padding: 20, borderRadius: 16, gap: 4 },
  bannerTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase' },
  bannerDesc: { color: colors.muted, fontSize: 12, fontFamily: 'Outfit_400Regular', lineHeight: 18 },

  coursesRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  courseTab: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    marginRight: 10, width: 220, gap: 2,
  },
  courseTabActive: {
    backgroundColor: 'rgba(0,229,255,0.05)', borderColor: 'rgba(0,229,255,0.2)',
  },
  courseTabText: { color: '#d1d5db', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  courseTabSchedule: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_400Regular' },

  rosterSection: { gap: 12 },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  studentCard: { padding: 16, borderRadius: 16 },
  studentInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 14 },
  studentName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase' },
  studentEmail: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular' },
  studentMeta: { color: '#a1a1aa', fontSize: 10, fontFamily: 'Outfit_600SemiBold', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  
  studentActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendanceText: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  evaluateBtn: {
    backgroundColor: colors.electricBlue, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  evaluateBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase' },

  emptyState: { padding: 30, alignItems: 'center', borderRadius: 12 },
  emptyText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase', textAlign: 'center' },
});
