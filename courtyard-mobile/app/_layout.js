import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inReceptionGroup = segments[0] === '(reception)';
    const inCoachGroup = segments[0] === '(coach)';
    const inPlayerGroup = segments[0] === '(player)';
    const inProtectedGroup = inAdminGroup || inReceptionGroup || inCoachGroup || inPlayerGroup;

    // Redirect away from protected routes if not logged in
    if (!user && inProtectedGroup) {
      router.replace('/(auth)/login');
    }

    // Redirect away from auth if already logged in
    if (user && inAuthGroup) {
      if (user.role === 'admin') router.replace('/(admin)/dashboard');
      else if (user.role === 'reception') router.replace('/(reception)/dashboard');
      else if (user.role === 'coach') router.replace('/(coach)/dashboard');
      else router.replace('/(player)/dashboard');
    }
  }, [user, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}