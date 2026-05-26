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

export default function CoachingScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'enrolled'
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileUser, setProfileUser] = useState(user);

  const fetchData = async () => {
    try {
      // Fetch available courses
      const coursesRes = await api.get('/api/coaching/courses');
      setCourses(coursesRes.data);

      // Fetch my enrollments
      const enrollRes = await api.get('/api/coaching/my-enrollments');
      setEnrollments(enrollRes.data);

      // Fetch user profile
      const meRes = await api.get('/api/auth/me');
      setProfileUser(meRes.data);
    } catch (err) {
      console.error('Coaching fetch error:', err);
      Alert.alert('Error', 'Failed to retrieve coaching data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getDiscountedPrice = (price) => {
    let factor = 1;
    if (profileUser?.membership === 'Pro') factor = 0.90; // 10% off
    else if (profileUser?.membership === 'Elite') factor = 0.80; // 20% off
    return price * factor;
  };

  const handleEnroll = async (course) => {
    const finalPrice = getDiscountedPrice(course.price);

    Alert.alert(
      'Enroll in Academy Course',
      `Join "${course.title}" for ₹${finalPrice}?\n\nWallet Balance: ₹${profileUser.walletBalance || 0}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Enroll',
          onPress: async () => {
            if (profileUser.walletBalance < finalPrice) {
              Alert.alert(
                'Insufficient Balance',
                `Your wallet balance (₹${profileUser.walletBalance}) is insufficient for this course (₹${finalPrice}).\n\nWould you like to recharge?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Recharge', onPress: () => router.push('/(player)/wallet') }
                ]
              );
              return;
            }

            setSubmitting(true);
            try {
              await api.post('/api/coaching/enroll', {
                courseId: course._id,
                useWallet: true
              });
              Alert.alert('Success 🎉', 'Enrolled successfully! Enjoy the premium academy training.');
              fetchData();
            } catch (err) {
              Alert.alert('Enrollment Failed', err?.response?.data?.error || 'Failed to complete registration.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Skill progress chart rendering helper
  const renderSkillStars = (value) => {
    return '★'.repeat(value) + '☆'.repeat(5 - value);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academy</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'browse' && styles.tabBtnActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'browse' && { color: colors.electricBlue }]}>Browse Camps</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'enrolled' && styles.tabBtnActive]}
          onPress={() => setActiveTab('enrolled')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'enrolled' && { color: colors.electricBlue }]}>My Classes ({enrollments.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.electricBlue} />
          <Text style={styles.loadingText}>Fetching coaching programs...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.electricBlue} />
          }
        >
          {activeTab === 'browse' ? (
            courses.length > 0 ? (
              courses.map((course) => {
                const remaining = course.slotsTotal - course.slotsEnrolled;
                const finalPrice = getDiscountedPrice(course.price);
                const isDiscounted = finalPrice < course.price;
                const isFull = remaining <= 0;

                return (
                  <GlassPanel key={course._id} style={styles.courseCard}>
                    <Image source={{ uri: course.image }} style={styles.courseImage} />
                    <View style={styles.courseContent}>
                      <View style={styles.badgeRow}>
                        <View style={styles.slotsBadge}>
                          <Text style={styles.slotsText}>{remaining} slots left</Text>
                        </View>
                        <Text style={styles.durationBadge}>{course.duration}</Text>
                      </View>

                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseDesc}>{course.description}</Text>
                      
                      <View style={styles.divider} />
                      
                      <View style={styles.metaGrid}>
                        <View style={styles.metaItem}>
                          <Label>Coach</Label>
                          <Text style={styles.metaValue}>{course.coach?.name || 'Assigned Instructor'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Label>Schedule</Label>
                          <Text style={styles.metaValue}>{course.schedule}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Label>Date Limit</Label>
                          <Text style={styles.metaValue}>{course.startDate} to {course.endDate}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.divider} />
                      
                      <View style={styles.priceRow}>
                        <View>
                          <Label>Registration Fee</Label>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {isDiscounted && (
                              <Text style={styles.strikePrice}>₹{course.price}</Text>
                            )}
                            <NeonText style={styles.finalPrice} color={colors.electricBlue}>
                              ₹{finalPrice}
                            </NeonText>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          style={[styles.enrollBtn, isFull && styles.enrollBtnDisabled]}
                          disabled={isFull || submitting}
                          onPress={() => handleEnroll(course)}
                        >
                          <Text style={styles.enrollBtnText}>{isFull ? 'Sold Out' : 'Enroll Now'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </GlassPanel>
                );
              })
            ) : (
              <GlassPanel style={styles.emptyState}>
                <Text style={styles.emptyText}>No coaching courses currently scheduled.</Text>
              </GlassPanel>
            )
          ) : (
            // Enrolled classes view (with grading results)
            enrollments.length > 0 ? (
              enrollments.map((enrollment) => {
                const course = enrollment.course;
                if (!course) return null;
                const progress = enrollment.progressLogs || [];
                const latestProgress = progress[progress.length - 1];

                return (
                  <GlassPanel key={enrollment._id} style={styles.enrollmentCard}>
                    <View style={styles.enrollHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.enrollTitle}>{course.title}</Text>
                        <Text style={styles.enrollCoach}>Led by Coach {course.coach?.name}</Text>
                      </View>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{enrollment.status}</Text>
                      </View>
                    </View>

                    <Text style={styles.progressHeader}>Attendance Check-ins ({enrollment.attendance?.length || 0}/10 Sessions)</Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${Math.min(((enrollment.attendance?.length || 0)/10)*100, 100)}%` }]} />
                    </View>

                    {/* Skill Grades */}
                    <Text style={[styles.progressHeader, { marginTop: 16 }]}>Academy Skill Evaluations</Text>
                    {latestProgress ? (
                      <View style={styles.skillsGrid}>
                        {[
                          { label: 'Footwork', val: latestProgress.skills?.footwork || 3 },
                          { label: 'Serve', val: latestProgress.skills?.serve || 3 },
                          { label: 'Dinking', val: latestProgress.skills?.dinking || 3 },
                          { label: 'Backhand', val: latestProgress.skills?.backhand || 3 },
                          { label: 'Stamina', val: latestProgress.skills?.stamina || 3 },
                        ].map((skill, idx) => (
                          <View key={idx} style={styles.skillRow}>
                            <Text style={styles.skillLabel}>{skill.label}</Text>
                            <Text style={styles.skillValue}>{renderSkillStars(skill.val)}</Text>
                          </View>
                        ))}

                        <View style={styles.remarksBox}>
                          <Label>Latest Coach Evaluation Remarks ({latestProgress.date})</Label>
                          <Text style={styles.remarksText}>"{latestProgress.remarks || 'Keep working hard on your paddle angles.'}"</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.skillsPlaceholder}>
                        <Text style={styles.skillsPlaceholderText}>No evaluations submitted yet. Attend a session to request check-in progress metrics.</Text>
                      </View>
                    )}
                  </GlassPanel>
                );
              })
            ) : (
              <GlassPanel style={styles.emptyState}>
                <Text style={styles.emptyText}>You are not registered in any coaching classes.{'\n'}Browse classes to register.</Text>
              </GlassPanel>
            )
          )}
        </ScrollView>
      )}
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
  backText: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
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

  // Course card browse
  courseCard: { borderRadius: 18, overflow: 'hidden' },
  courseImage: { width: '100%', height: 160, objectFit: 'cover' },
  courseContent: { padding: 16 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  slotsBadge: { backgroundColor: 'rgba(0,229,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)' },
  slotsText: { color: colors.electricBlue, fontSize: 10, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  durationBadge: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  courseTitle: { color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  courseDesc: { color: colors.muted, fontSize: 12, fontFamily: 'Outfit_400Regular', marginTop: 4, lineHeight: 18 },
  
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaItem: { width: '47%', gap: 2 },
  metaValue: { color: '#fff', fontSize: 12, fontFamily: 'Outfit_600SemiBold' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strikePrice: { color: colors.muted, fontSize: 11, textDecorationLine: 'line-through' },
  finalPrice: { fontSize: 20 },
  
  enrollBtn: {
    backgroundColor: colors.electricBlue, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: colors.electricBlue, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  enrollBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  enrollBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  // Enrolled card
  enrollmentCard: { padding: 16, borderRadius: 16 },
  enrollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  enrollTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 16, textTransform: 'uppercase' },
  enrollCoach: { color: colors.muted, fontSize: 11, marginTop: 2 },
  activeBadge: { backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { color: colors.neonGreen, fontSize: 9, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  
  progressHeader: { color: '#d1d5db', fontSize: 11, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.electricBlue },

  // Skills
  skillsGrid: { marginTop: 12, gap: 8 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillLabel: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  skillValue: { color: colors.electricBlue, fontSize: 13 },
  remarksBox: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10, padding: 12, marginTop: 8, gap: 4,
  },
  remarksText: { color: '#d1d5db', fontSize: 11, fontFamily: 'Outfit_400Regular', fontStyle: 'italic', lineHeight: 16 },
  skillsPlaceholder: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10 },
  skillsPlaceholderText: { color: colors.muted, fontSize: 10, textAlign: 'center', lineHeight: 16 },

  emptyState: { padding: 40, alignItems: 'center', borderRadius: 16 },
  emptyText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
});
