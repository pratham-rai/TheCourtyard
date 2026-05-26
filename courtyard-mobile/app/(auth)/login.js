import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Alert, ScrollView, Modal, Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Panels
  const [showForgot, setShowForgot] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resending, setResending] = useState(false);

  // Google Auth
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  console.log('--- GOOGLE OAUTH REDIRECT URI ---', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '555927128946-rvr0tss9dobt1antobjfbv6f89kfr9sr.apps.googleusercontent.com',
    androidClientId: '555927128946-rvr0tss9dobt1antobjfbv6f89kfr9sr.apps.googleusercontent.com',
    iosClientId: '555927128946-rvr0tss9dobt1antobjfbv6f89kfr9sr.apps.googleusercontent.com',
    redirectUri,
  });

  // Use useEffect to handle Google Auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.accessToken);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google Sign-In failed or was cancelled.');
    }
  }, [response]);

  const handleGoogleLogin = async (token) => {
    setLoading(true);
    try {
      await loginWithGoogle(token);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email.toLowerCase().trim(), password);
      } else {
        const res = await api.post('/api/auth/signup', { name, email, password });
        if (res.data.requiresVerification) {
          setVerifyEmail(res.data.email || email);
          setShowVerification(true);
        }
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/verify-email', {
        email: verifyEmail,
        code: verificationCode,
      });
      setShowVerification(false);
      Alert.alert('Success', 'Email verified! Please sign in.');
      setIsLogin(true);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      await api.post('/api/auth/resend-verification', { email: verifyEmail });
      Alert.alert('Sent', 'OTP resent. Check your backend console.');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend.');
    } finally {
      setResending(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      Alert.alert('Sent', 'Password reset link sent. Check your backend console.');
      setShowForgot(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>THE COURTYARD</Text>
          <Text style={styles.brandTagline}>Premium Racket Sports Club</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Title */}
          <Text style={styles.cardTitle}>
            {showVerification ? 'Verify Email'
              : showForgot ? 'Reset Password'
              : isLogin ? 'Sign In'
              : 'Join Club'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {showVerification ? 'Enter the OTP sent to your email'
              : showForgot ? 'Enter your registered email to recover'
              : isLogin ? 'Unlock the luxury court parameters'
              : 'Register a premium sports profile'}
          </Text>

          <View style={styles.divider} />

          {/* ── OTP Verification Panel ── */}
          {showVerification ? (
            <View style={styles.section}>
              <View style={styles.otpBox}>
                <Text style={styles.otpIcon}>🔑</Text>
                <Text style={styles.otpDesc}>
                  Verification code sent to{'\n'}
                  <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold' }}>{verifyEmail}</Text>
                </Text>
                <Text style={styles.otpHint}>
                  Dev mode: Check your backend server console for the OTP code.
                </Text>
              </View>

              <Label>6-Digit OTP Code</Label>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor="#3f3f46"
                value={verificationCode}
                onChangeText={(t) => setVerificationCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.neonGreen }]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={[styles.primaryBtnText, { color: '#000' }]}>Verify & Enter</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkBtn} onPress={handleResendOTP} disabled={resending}>
                <Text style={styles.linkBtnText}>
                  {resending ? 'Resending...' : '↻  Resend Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkBtn} onPress={() => setShowVerification(false)}>
                <Text style={[styles.linkBtnText, { color: colors.muted }]}>Cancel and Sign In</Text>
              </TouchableOpacity>
            </View>

          ) : showForgot ? (
          /* ── Forgot Password Panel ── */
            <View style={styles.section}>
              <Label>Email Address</Label>
              <TextInput
                style={styles.input}
                placeholder="player@thecourtyard.in"
                placeholderTextColor="#3f3f46"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.neonGreen }]}
                onPress={handleForgot}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={[styles.primaryBtnText, { color: '#000' }]}>Send Recovery Link</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkBtn} onPress={() => setShowForgot(false)}>
                <Text style={[styles.linkBtnText, { color: colors.muted }]}>← Back to Sign In</Text>
              </TouchableOpacity>
            </View>

          ) : (
          /* ── Standard Login / Register ── */
            <View style={styles.section}>

              {/* Login / Register Tabs */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tab, isLogin && styles.tabActive]}
                  onPress={() => setIsLogin(true)}
                >
                  <Text style={[styles.tabText, isLogin && { color: colors.neonGreen }]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, !isLogin && styles.tabActive]}
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={[styles.tabText, !isLogin && { color: colors.neonGreen }]}>Register</Text>
                </TouchableOpacity>
              </View>

              {/* Name (register only) */}
              {!isLogin && (
                <View style={styles.fieldGroup}>
                  <Label>Full Name</Label>
                  <TextInput
                    style={styles.input}
                    placeholder="Pratham Raj"
                    placeholderTextColor="#3f3f46"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Label>Email Address</Label>
                <TextInput
                  style={styles.input}
                  placeholder="player@thecourtyard.in"
                  placeholderTextColor="#3f3f46"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.passwordLabelRow}>
                  <Label>Password</Label>
                  {isLogin && (
                    <TouchableOpacity onPress={() => setShowForgot(true)}>
                      <Text style={styles.forgotText}>Forgot?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="••••••••"
                    placeholderTextColor="#3f3f46"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.neonGreen }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={[styles.primaryBtnText, { color: '#000' }]}>
                      {isLogin ? 'Access Club →' : 'Join Club House →'}
                    </Text>}
              </TouchableOpacity>

              {/* Or separator */}
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>Or Continue With</Text>
                <View style={styles.orLine} />
              </View>

              {/* Google button */}
              <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request || loading}>
                <Text style={styles.googleBtnText}>🔵  Sign in with Google</Text>
              </TouchableOpacity>

            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.shieldText}>🔒 Secure JWT SSL encrypted gateway</Text>
        </View>

        <View style={styles.bottomBadge}>
          <Text style={styles.bottomBadgeText}>The Courtyard Platform v2.0</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ children }) {
  return <Text style={labelStyle}>{children}</Text>;
}

const labelStyle = {
  fontSize: 9,
  color: '#71717a',
  textTransform: 'uppercase',
  letterSpacing: 2,
  fontFamily: 'Outfit_700Bold',
  marginBottom: 8,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 },

  // Logo
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(57,255,20,0.08)',
    borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  logoImage: { width: 70, height: 70, borderRadius: 14 },
  brandName: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 20, letterSpacing: 4, textTransform: 'uppercase' },
  brandTagline: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24, padding: 24,
  },
  cardTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 20, textTransform: 'uppercase', letterSpacing: 1 },
  cardSubtitle: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },

  section: { gap: 12 },

  // OTP
  otpBox: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 16, alignItems: 'center', gap: 8,
  },
  otpIcon: { fontSize: 28 },
  otpDesc: { color: '#d1d5db', fontFamily: 'Outfit_400Regular', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  otpHint: {
    color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10,
    textAlign: 'center', borderWidth: 1, borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, marginTop: 4,
  },
  otpInput: { textAlign: 'center', fontSize: 20, letterSpacing: 12, color: colors.neonGreen, fontFamily: 'Outfit_700Bold' },

  // Tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 4, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabText: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

  // Fields
  fieldGroup: { gap: 0 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontFamily: 'Outfit_400Regular', fontSize: 14,
  },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotText: { color: colors.electricBlue, fontFamily: 'Outfit_600SemiBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  passwordRow: { flexDirection: 'row', gap: 8 },
  eyeBtn: {
    padding: 14, backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
  },
  eyeText: { fontSize: 16 },

  // Buttons
  primaryBtn: {
    borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  primaryBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkBtnText: { color: colors.electricBlue, fontFamily: 'Outfit_600SemiBold', fontSize: 12 },

  // Or
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  orText: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },

  // Google
  googleBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  googleBtnText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 13 },

  shieldText: { color: '#3f3f46', fontFamily: 'Outfit_400Regular', fontSize: 10, textAlign: 'center' },
  bottomBadge: { alignItems: 'center', marginTop: 24 },
  bottomBadgeText: { color: '#27272a', fontFamily: 'Outfit_400Regular', fontSize: 10, letterSpacing: 1 },
});