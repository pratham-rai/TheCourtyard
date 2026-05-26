import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function EvaluationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { enrollmentId, studentName, courseTitle } = params;

  const [skills, setSkills] = useState({
    footwork: 3,
    serve: 3,
    dinking: 3,
    backhand: 3,
    stamina: 3
  });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const skillKeys = [
    { key: 'footwork', label: 'Footwork & Speed' },
    { key: 'serve', label: 'Serve & Return Precision' },
    { key: 'dinking', label: 'Kitchen Dink Battles' },
    { key: 'backhand', label: 'Backhand Control & Angle' },
    { key: 'stamina', label: 'Conditioning & Stamina' }
  ];

  const handleStarPress = (key, val) => {
    setSkills({
      ...skills,
      [key]: val
    });
  };

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      Alert.alert('Remarks Required', 'Please provide a feedback remark to help the student improve.');
      return;
    }

    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await api.post('/api/coach/log-progress', {
        enrollmentId,
        date: todayStr,
        remarks: remarks.trim(),
        skills
      });

      Alert.alert('Evaluation Saved 🎉', `Logged skill check-in for ${studentName} successfully.`, [
        { text: 'Done', onPress: () => router.replace('/(coach)/dashboard') }
      ]);
    } catch (err) {
      console.error('Submit evaluation error:', err);
      Alert.alert('Failed', err?.response?.data?.error || 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (key, currentValue) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((val) => {
          const active = val <= currentValue;
          return (
            <TouchableOpacity
              key={val}
              onPress={() => handleStarPress(key, val)}
              style={styles.starBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.starText, active && { color: colors.electricBlue }]}>
                {active ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evaluation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Student summary */}
        <GlassPanel style={styles.studentHeaderCard}>
          <Label>Academy Student</Label>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.courseTitle}>{courseTitle}</Text>
        </GlassPanel>

        {/* Skill Grading */}
        <GlassPanel style={styles.formCard}>
          <Text style={styles.formTitle}>Skill Grading Checklist</Text>
          <Text style={styles.formSub}>Tap stars to grade current session competency level (1-5):</Text>
          
          <View style={styles.skillsGrid}>
            {skillKeys.map((item) => (
              <View key={item.key} style={styles.skillRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.skillLabel}>{item.label}</Text>
                  <Text style={styles.skillScore}>Score: {skills[item.key]} / 5</Text>
                </View>
                {renderStars(item.key, skills[item.key])}
              </View>
            ))}
          </View>
        </GlassPanel>

        {/* Remarks Form */}
        <GlassPanel style={styles.formCard}>
          <Label style={{ marginBottom: 8 }}>Coach Feedback Remarks</Label>
          <TextInput
            style={styles.remarksInput}
            placeholder="Write constructive coaching notes (e.g. 'Volley reflexes are getting faster, work on baseline drops next...')"
            placeholderTextColor="#3f3f46"
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Grade & Attendance</Text>
            )}
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { padding: 4 },
  backText: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  
  studentHeaderCard: { padding: 16, borderRadius: 16, gap: 2 },
  studentName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase' },
  courseTitle: { color: colors.electricBlue, fontSize: 12, fontFamily: 'Outfit_600SemiBold', textTransform: 'uppercase', marginTop: 2 },

  formCard: { padding: 20, borderRadius: 18 },
  formTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 15, textTransform: 'uppercase' },
  formSub: { color: colors.muted, fontSize: 11, fontFamily: 'Outfit_400Regular', marginTop: 2, marginBottom: 12 },
  
  skillsGrid: { gap: 16 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillLabel: { color: '#fff', fontSize: 13, fontFamily: 'Outfit_700Bold' },
  skillScore: { color: colors.muted, fontSize: 10, fontFamily: 'Outfit_600SemiBold', marginTop: 2 },
  
  starsRow: { flexDirection: 'row', gap: 4 },
  starBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  starText: { fontSize: 24, color: '#27272a' }, // Unlit color

  remarksInput: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 16,
    color: '#fff', fontFamily: 'Outfit_400Regular', fontSize: 13,
    height: 100,
  },
  submitBtn: {
    backgroundColor: colors.electricBlue, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
    shadowColor: colors.electricBlue, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});
