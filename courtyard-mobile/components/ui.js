import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export function GlassPanel({ children, style }) {
  return (
    <View style={[styles.glass, style]}>
      {children}
    </View>
  );
}

export function Label({ children, style }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function NeonText({ children, style, color }) {
  return <Text style={[styles.neon, { color: color || colors.neonGreen }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
  },
  label: {
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Outfit_700Bold',
  },
  neon: {
    fontFamily: 'Outfit_700Bold',
    color: colors.neonGreen,
  },
});