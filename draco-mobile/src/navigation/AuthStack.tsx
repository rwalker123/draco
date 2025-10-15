import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { LoadingScreen } from '../screens/LoadingScreen';

type AuthStackParamList = {
  Login: undefined;
  Loading: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthStackProps = {
  screen: keyof AuthStackParamList;
};

export function AuthStack({ screen }: AuthStackProps): JSX.Element {
  return (
    <Stack.Navigator
      key={screen}
      initialRouteName={screen}
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Loading" component={LoadingScreen} />
    </Stack.Navigator>
  );
}
