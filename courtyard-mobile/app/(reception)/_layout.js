import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';

const RECEPTION_TABS = [
  { label: 'Dashboard', icon: '📊', route: '/(reception)/dashboard' },
  { label: 'Bookings',  icon: '📅', route: '/(reception)/bookings' },
  { label: 'Scanner',   icon: '📷', route: '/(reception)/scanner' },
  { label: 'Inventory', icon: '📦', route: '/(reception)/inventory' },
];

export default function ReceptionLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <BottomTabBar customTabs={RECEPTION_TABS} />
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
