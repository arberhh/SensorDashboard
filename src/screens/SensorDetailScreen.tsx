import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SensorDetail">;

const SensorDetailScreen: React.FC<Props> = ({ route }) => {
  const { sensorId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Sensor Detail — id {sensorId}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151544",
    padding: 16,
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
});

export default SensorDetailScreen;
