/**
 * @format
 */

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import theme from "@/theme";
import { SensorFeedProvider } from "@/context/SensorFeedContext";
import SensorFeedModeToggle from "@/components/SensorFeedModeToggle";
import HomeScreen from "@/screens/HomeScreen";
import SensorDetailScreen from "@/screens/SensorDetailScreen";

export type RootStackParamList = {
  Home: undefined;
  SensorDetail: { sensorId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SensorFeedProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
              headerRight: SensorFeedModeToggle,
              // iOS 26 wraps header items in a glass capsule; hide it so the
              // toggle's own pill is the only background.
              unstable_headerRightItems: () => [
                { type: "custom", element: <SensorFeedModeToggle />, hidesSharedBackground: true },
              ],
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "Sensor Dashboard" }}
            />
            <Stack.Screen
              name="SensorDetail"
              component={SensorDetailScreen}
              options={{ title: "" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SensorFeedProvider>
    </SafeAreaProvider>
  );
}

type RootStackType = typeof Stack;

declare module "@react-navigation/native" {
  interface RootNavigator extends RootStackType {}
}

export default RootStack;
