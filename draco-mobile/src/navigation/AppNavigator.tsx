import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { colors } from '../theme/colors';

export function AppNavigator() {
  const { status } = useAuth();

  const screens = useMemo(() => {
    if (status === 'authenticated') {
      return <MainTabs />;
    }

    if (status === 'loading') {
      return <AuthStack screen="Loading" />;
    }

    return <AuthStack screen="Login" />;
  }, [status]);

  const navigationTheme = useMemo(() => ({
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.primaryText,
      border: colors.surface,
      notification: colors.primary
    }
  }), []);

  return (
    <NavigationContainer theme={navigationTheme}>
      {screens}
    </NavigationContainer>
  );
}
