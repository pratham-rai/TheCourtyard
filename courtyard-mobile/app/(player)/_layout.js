import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';

export default function PlayerLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <BottomTabBar />
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
