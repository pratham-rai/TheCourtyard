import { View, Text, StyleSheet } from 'react-native';
import { GlassPanel } from '../../components/ui';
import { colors } from '../../constants/theme';
import DashboardHeader from '../../components/DashboardHeader';
import { useAuth } from '../../context/AuthContext';

export default function ScheduleScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.container}>
      <DashboardHeader role="Academy Coach" name={user?.name} onLogout={logout} accentColor={colors.electricBlue} />
      <View style={styles.content}>
        <GlassPanel style={styles.panel}>
          <Text style={styles.text}>Schedule feature coming soon!</Text>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  panel: { padding: 24, alignItems: 'center' },
  text: { color: colors.muted, fontFamily: 'Outfit_600SemiBold' },
});
