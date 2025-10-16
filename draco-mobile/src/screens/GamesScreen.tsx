import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function GamesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Games</Text>
      <Text style={styles.body}>Live scoring will be available in a future milestone.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    gap: 16
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText
  },
  body: {
    fontSize: 16,
    color: colors.mutedText
  }
});
