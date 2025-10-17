import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

export function SettingsScreen() {
  const { session, logout, refreshSession } = useAuth();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.heading}>Account</Text>
          <Text style={styles.label}>User</Text>
          <Text style={styles.value}>{session?.user.userName ?? 'Unknown'}</Text>
          {session?.user.contactName ? (
            <>
              <Text style={styles.label}>Contact</Text>
              <Text style={styles.value}>{session.user.contactName}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Session Controls</Text>
          <Pressable style={styles.button} onPress={() => refreshSession()}>
            <Text style={styles.buttonText}>Refresh Token</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.logoutButton]} onPress={() => logout()}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
    backgroundColor: colors.background
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 12
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText
  },
  label: {
    color: colors.mutedText,
    fontSize: 14,
    textTransform: 'uppercase'
  },
  value: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600'
  },
  button: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  logoutButton: {
    backgroundColor: colors.danger
  },
  buttonText: {
    color: colors.primaryText,
    fontWeight: '700'
  }
});
