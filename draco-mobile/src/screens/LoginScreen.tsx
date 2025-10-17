import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { ScreenContainer } from '../components/ScreenContainer';

const webFormStyle: CSSProperties = Platform.OS === 'web' ? { width: '100%' } : {};

export function LoginScreen() {
  const { login, error, status } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [accountId, setAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!userName || !password) {
      Alert.alert('Missing credentials', 'Enter both username and password.');
      return;
    }

    setSubmitting(true);
    const normalizedAccountId = accountId.trim();
    const sanitizedAccountId = normalizedAccountId.length > 0 && /^\d+$/.test(normalizedAccountId)
      ? normalizedAccountId
      : undefined;

    try {
      await login({
        userName,
        password,
        accountId: sanitizedAccountId
      });
    } catch (requestError) {
      if (requestError instanceof Error) {
        Alert.alert('Login failed', requestError.message);
      } else {
        Alert.alert('Login failed', 'Unable to authenticate.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    await submit();
  };

  const cardContent = (
    <View style={styles.card}>
      <Text style={styles.heading}>Scorekeeper Login</Text>
      <Text style={styles.subtitle}>
        Sign in with your Draco Sports Manager credentials to access assignments and scorecards.
      </Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          importantForAutofill="yes"
          placeholder="scorekeeper@example.com"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          textContentType="username"
          returnKeyType="next"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          importantForAutofill="yes"
          placeholder="••••••••"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          textContentType="password"
          onSubmitEditing={() => {
            void submit();
          }}
          returnKeyType="done"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Account ID (optional)</Text>
        <TextInput
          value={accountId}
          onChangeText={setAccountId}
          keyboardType="number-pad"
          importantForAutofill="no"
          autoComplete="off"
          placeholder="1234"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
        />
      </View>
      {error && status !== 'authenticated' ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}
        onPress={() => {
          void submit();
        }}
        accessibilityRole="button"
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Sign In'}</Text>
      </Pressable>
      {Platform.OS === 'web' ? <input type="submit" hidden /> : null}
    </View>
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      {Platform.OS === 'web' ? (
        <form style={webFormStyle} onSubmit={handleSubmit}>
          {cardContent}
        </form>
      ) : (
        cardContent
      )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.18)'
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 12 },
        elevation: 6
      }
    })
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedText
  },
  formGroup: {
    gap: 8
  },
  label: {
    color: colors.primaryText,
    fontWeight: '600'
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.primaryText
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600'
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonPressed: {
    opacity: 0.85
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.primaryText,
    fontWeight: '700'
  }
});
