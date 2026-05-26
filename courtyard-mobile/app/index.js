import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color={colors.neonGreen} />
      </View>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Redirect href="/(admin)/dashboard" />;
    if (user.role === 'reception') return <Redirect href="/(reception)/dashboard" />;
    if (user.role === 'coach') return <Redirect href="/(coach)/dashboard" />;
  }

  return <Redirect href="/home" />;
}