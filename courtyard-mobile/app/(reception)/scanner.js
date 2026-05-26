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
  };  const handleReset = () => {
    setResult(null);
    setScanned(false);
    setSimCode('');
  };

  return (
    <View style={styles.container}>
      {/* HUD Scanner View */}
      {!scanned ? (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Overlay Box */}
          <View style={styles.overlayContainer}>
            {/* Top Header */}
            <View style={styles.topSection}>
              <View style={styles.hudHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.hudBackBtn}>
                  <Text style={styles.hudBackText}>← Exit</Text>
                </TouchableOpacity>
                <Text style={styles.hudTitle}>Scan Pass</Text>
                <View style={{ width: 60 }} />
              </View>
            </View>

            {/* Middle Section with Cutout */}
            <View style={styles.middleSection}>
              {/* Glowing Focus Box */}
              <View style={styles.focusFrameContainer}>
                <View style={styles.focusFrameCorners}>
                  {/* Corner brackets for premium look */}
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </View>
                <View style={styles.focusFrame}>
                  {/* Visual Laser Sweeper */}
                  <View style={styles.laserLine} />
                </View>
              </View>
              <Text style={styles.focusHint}>Align QR code within the frame</Text>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <GlassPanel style={styles.simCard}>
                <Label style={{ marginBottom: 4 }}>Dev Simulation Box</Label>
                <View style={styles.simRow}>
                  <TextInput
                    style={styles.simInput}
                    placeholder="Paste QR/Booking ID..."
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
  camera: { flex: 1, width: '100%', height: '100%' },
  
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  
  permissionContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
  permissionText: { color: colors.muted, fontSize: 13, fontFamily: 'Outfit_400Regular', textAlign: 'center', lineHeight: 22 },
  grantBtn: { backgroundColor: colors.neonGreen, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  grantBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  backBtn: { paddingVertical: 10 },
  backText: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },

  // HUD
  overlayContainer: { flex: 1, justifyContent: 'space-between' },
  
  topSection: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  hudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudBackBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  hudBackText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase' },
  hudTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2 },

  middleSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  focusFrameContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  focusFrameCorners: {
    position: 'absolute',
    width: 280, height: 280,
    zIndex: 10,
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: colors.neonGreen },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 24 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 24 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 24 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 24 },
  
  focusFrame: {
    width: 280, height: 280, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)'
  },
  laserLine: {
    height: 2, width: '100%', backgroundColor: colors.neonGreen,
    shadowColor: colors.neonGreen, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 6,
    position: 'absolute', top: '50%'
  },
  focusHint: { 
    color: '#fff', fontSize: 12, fontFamily: 'Outfit_600SemiBold', 
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 40,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    overflow: 'hidden'
  },

  bottomSection: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20, paddingBottom: 40,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  simCard: { padding: 16, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  simRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  simInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 13, fontFamily: 'Outfit_400Regular'
  },
  simBtn: { backgroundColor: colors.neonGreen, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  simBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },

  // Results
  resultContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultCard: { width: '100%', padding: 28, borderRadius: 28, alignItems: 'center', gap: 12, borderWidth: 2 },
  resultEmoji: { fontSize: 50, marginBottom: 8 },
  resultTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  userSection: { alignItems: 'center', gap: 6, marginTop: 8 },
  userName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 24, textTransform: 'uppercase' },
  membershipBadge: { backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  membershipBadgeText: { color: colors.electricBlue, fontSize: 11, fontFamily: 'Outfit_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  resultDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginVertical: 16 },
  resultDetails: { color: '#d1d5db', fontSize: 14, fontFamily: 'Outfit_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  scanAgainBtn: { backgroundColor: colors.neonGreen, borderRadius: 16, paddingVertical: 16, width: '100%', alignItems: 'center', shadowColor: colors.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  scanAgainBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent', borderRadius: 16, paddingVertical: 16, width: '100%', alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#a1a1aa', fontFamily: 'Outfit_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
});
