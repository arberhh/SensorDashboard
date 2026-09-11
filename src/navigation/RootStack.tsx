/**
 * @format
 */

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import theme from "../theme";
import HomeScreen from "../screens/HomeScreen";
import SensorDetailScreen from "../screens/SensorDetailScreen";

export type RootStackParamList = {
  Home: undefined;
  SensorDetail: { sensorId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
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
    </SafeAreaProvider>
  );
}

type RootStackType = typeof Stack;

declare module "@react-navigation/native" {
  interface RootNavigator extends RootStackType {}
}

export default RootStack;
