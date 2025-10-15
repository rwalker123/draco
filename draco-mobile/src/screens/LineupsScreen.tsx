import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function LineupsScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Lineups</Text>
      <Text style={styles.body}>Manage lineup templates from this tab in upcoming work.</Text>
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
