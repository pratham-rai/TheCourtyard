import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

const TABS = [
  { label: 'Home',      icon: '🏠', route: '/home' },
  { label: 'Book',      icon: '📅', route: '/(player)/bookings' },
  { label: 'Coaching',  icon: '🎾', route: '/(player)/coaching' },
  { label: 'Wallet',    icon: '💳', route: '/(player)/wallet' },
  { label: 'Dashboard', icon: '👤', route: '/(player)/dashboard' },
];

export default function BottomTabBar({ customTabs }) {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();

  const isActive = (route) => {
    if (route === '/home') return pathname === '/home' || pathname === '/';
    return pathname.startsWith(route.replace('/index', ''));
  };

  const tabsToRender = customTabs || TABS;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
      {tabsToRender.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => router.push(tab.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Text style={styles.icon}>{tab.icon}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8,8,12,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 40,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(57,255,20,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.2)',
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Outfit_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.muted,
  },
  labelActive: {
    color: colors.neonGreen,
  },
});
