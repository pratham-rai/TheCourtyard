import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [simCode, setSimCode] = useState('');
  
  // Scanned result card details
  const [result, setResult] = useState(null);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
        <Text style={styles.loadingText}>Configuring lens parameters...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to scan member check-in vouchers.</Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Authorize Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Desk</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || scanning) return;
    processCheckin(data);
  };

  const processCheckin = async (codeString) => {
    setScanned(true);
    setScanning(true);
    try {
      const res = await api.post('/api/admin/scan-qr', { qrCode: codeString });
      
      const payload = res.data;
      if (payload.valid) {
        setResult({
          success: true,
          title: payload.isCoaching ? 'Coaching Attendance Logged' : 'Court Check-in Successful',
          name: payload.isCoaching ? payload.enrollment.user?.name : payload.booking?.user?.name,
          details: payload.isCoaching 
            ? `Course: ${payload.enrollment.course?.title}\nAttended: ${payload.enrollment.attendance?.length || 0} Sessions`
            : `Court: ${payload.booking.court?.name}\nDate: ${payload.booking.date}\nSlots: ${payload.booking.slots?.map(s => `${s}:00`).join(', ')}`,
          membership: payload.isCoaching ? payload.enrollment.user?.membership : payload.booking.user?.membership
        });
      } else {
        setResult({
          success: false,
          title: 'Check-in Rejected',
          details: 'Pass has expired, is cancelled, or contains invalid credentials.'
        });
      }
    } catch (err) {
      console.error('Scan QR verification error:', err);
      setResult({
        success: false,
        title: 'Check-in Error',
        details: err?.response?.data?.error || 'No database entry matches this check-in pass.'
      });
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setScanned(false);
    setSimCode('');
  };

  return (
    <View style={styles.container}>
      {/* HUD Scanner View */}
      {!scanned ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Overlay Box */}
          <View style={styles.overlayContainer}>
            <View style={styles.hudHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.hudBackBtn}>
                <Text style={styles.hudBackText}>← Exit</Text>
              </TouchableOpacity>
              <Text style={styles.hudTitle}>Camera Scan HUD</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Glowing Focus Box */}
            <View style={styles.focusFrameContainer}>
              <View style={styles.focusFrame}>
                {/* Visual Laser Sweeper */}
                <View style={styles.laserLine} />
              </View>
              <Text style={styles.focusHint}>Align member QR check-in pass within focus box</Text>
            </View>

            {/* Simulator Simulation Entry fallback */}
            <GlassPanel style={styles.simCard}>
              <Label style={{ marginBottom: 4 }}>Dev Simulation Box</Label>
              <View style={styles.simRow}>
                <TextInput
                  style={styles.simInput}
                  placeholder="Paste QR/Booking ID (e.g. 6a1212...)"
                  placeholderTextColor="#71717a"
                  value={simCode}
                  onChangeText={setSimCode}
                />
                <TouchableOpacity
                  style={styles.simBtn}
                  onPress={() => processCheckin(simCode)}
                  disabled={!simCode.trim() || scanning}
                >
                  <Text style={styles.simBtnText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </GlassPanel>
          </View>
        </CameraView>
      ) : (
        // Results Display
        <View style={styles.resultContainer}>
          <GlassPanel style={[
            styles.resultCard,
            result?.success ? { borderColor: colors.neonGreen } : { borderColor: colors.neonPink }
          ]}>
            <Text style={styles.resultEmoji}>{result?.success ? '✅' : '❌'}</Text>
            <Text style={[styles.resultTitle, result?.success ? { color: colors.neonGreen } : { color: colors.neonPink }]}>
              {result?.title}
            </Text>
            
            {result?.success && (
              <View style={styles.userSection}>
                <Text style={styles.userName}>{result.name}</Text>
                <View style={styles.membershipBadge}>
                  <Text style={styles.membershipBadgeText}>{result.membership} Member</Text>
                </View>
              </View>
            )}

            <View style={styles.resultDivider} />
            
            <Text style={styles.resultDetails}>{result?.details}</Text>

            <TouchableOpacity style={styles.scanAgainBtn} onPress={handleReset}>
              <Text style={styles.scanAgainBtnText}>Scan Next Pass</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Text style={styles.closeBtnText}>Return to Desk</Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  
  permissionContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
  permissionText: { color: colors.muted, fontSize: 13, fontFamily: 'Outfit_400Regular', textAlign: 'center', lineHeight: 22 },
  grantBtn: { backgroundColor: colors.neonGreen, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  grantBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  backBtn: { paddingVertical: 10 },
  backText: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  // HUD
  overlayContainer: { flex: 1, justifyContent: 'space-between', padding: 20, paddingVertical: 50 },
  hudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudBackBtn: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  hudBackText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  hudTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 },

  focusFrameContainer: { alignItems: 'center', gap: 14 },
  focusFrame: {
    width: 250, height: 250, borderRadius: 20,
    borderWidth: 2, borderColor: colors.neonGreen,
    backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden',
  },
  laserLine: {
    height: 2, width: '100%', backgroundColor: colors.neonGreen,
    shadowColor: colors.neonGreen, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10, elevation: 6,
    position: 'absolute', top: '40%'
  },
  focusHint: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Outfit_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },

  simCard: { padding: 14, borderRadius: 14 },
  simRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  simInput: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 12,
  },
  simBtn: { backgroundColor: colors.neonGreen, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  simBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  // Results
  resultContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultCard: { width: '100%', padding: 24, borderRadius: 24, alignItems: 'center', gap: 10 },
  resultEmoji: { fontSize: 44, marginBottom: 4 },
  resultTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  userSection: { alignItems: 'center', gap: 4 },
  userName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 20, textTransform: 'uppercase' },
  membershipBadge: { backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  membershipBadgeText: { color: colors.electricBlue, fontSize: 10, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase' },
  resultDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%', marginVertical: 10 },
  resultDetails: { color: '#d1d5db', fontSize: 12, fontFamily: 'Outfit_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  scanAgainBtn: { backgroundColor: colors.neonGreen, borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', shadowColor: colors.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  scanAgainBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});
