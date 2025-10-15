import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/providers/AuthProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';

function SystemUiInitializer(): null {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#111827').catch(() => {
      // no-op if the platform does not support customizing the system UI background
    });
  }, []);

  return null;
}

export default function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SystemUiInitializer />
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
