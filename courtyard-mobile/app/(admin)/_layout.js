import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';

const ADMIN_TABS = [
  { label: 'Dashboard', icon: '📊', route: '/(admin)/dashboard' },
  { label: 'Bookings',  icon: '📅', route: '/(admin)/bookings' },
  { label: 'Scanner',   icon: '📷', route: '/(admin)/scanner' },
  { label: 'More',      icon: '⚙️', route: '/(admin)/settings' }, // Will route to a settings menu later
];

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <BottomTabBar customTabs={ADMIN_TABS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080c',
  },
  content: {
    flex: 1,
  },
});
