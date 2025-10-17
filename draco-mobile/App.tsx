import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { AuthProvider } from './src/providers/AuthProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

function SystemUiInitializer(): null {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#111827').catch(() => {
      // no-op if the platform does not support customizing the system UI background
    });
  }, []);

  return null;
}

export default function App() {
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
