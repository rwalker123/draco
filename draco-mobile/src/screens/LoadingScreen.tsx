import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';

export function LoadingScreen() {
  return (
    <ScreenContainer>
      <View style={styles.container} accessibilityRole="progressbar">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </ScreenContainer>
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
