import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';

const COACH_TABS = [
  { label: 'Dashboard',   icon: '📊', route: '/(coach)/dashboard' },
  { label: 'Evaluations', icon: '📝', route: '/(coach)/evaluation' },
  { label: 'Schedule',    icon: '📅', route: '/(coach)/schedule' },
];

export default function CoachLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <BottomTabBar customTabs={COACH_TABS} />
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
