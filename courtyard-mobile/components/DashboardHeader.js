/**
 * Shared Dashboard Header Component
 * Used by all role dashboards (Admin, Coach, Reception, Player)
 * Shows the club logo, user role/name, and logout button
 */
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function DashboardHeader({ role, name, onLogout, accentColor }) {
  const accent = accentColor || colors.neonGreen;

  return (
    <View style={styles.header}>
      {/* Logo + Club Name */}
      <View style={styles.left}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={[styles.roleLabel, { color: accent }]}>{role}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, { borderColor: 'rgba(255,0,127,0.35)' }]} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: colors.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  roleLabel: {
    fontSize: 8,
    fontFamily: 'Outfit_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  name: {
    color: '#fff',
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#FF007F',
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
