import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export function LoadingScreen(): JSX.Element {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  }
});
