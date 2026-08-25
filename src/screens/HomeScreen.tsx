import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Button,
} from "react-native";

import initialSensors from "../data/sensor_readings.json";

type TSensor = (typeof initialSensors)[number][];

const HomeScreen: React.FC = () => {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);

  useEffect(() => {
    setInterval(() => {
      setSensors(
        sensors.map(sensor => ({
          ...sensor,
          currentReading: parseFloat((Math.random() * 80 + 10).toFixed(2)),
        })),
      );
    }, 5000);
  }, [sensors]);

  const handleSortAsc = (): void =>
    setSensors(
      sensors.sort((a, b) => a.deviationPercent - b.deviationPercent),
    );

  const handleSortDesc = (): void =>
    setSensors(
      sensors.sort((a, b) => b.deviationPercent - a.deviationPercent),
    );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sorting:</Text>
      <View style={styles.betweenContainer}>
        <Button title={"Sort Trend asc"} onPress={handleSortAsc} />
        <Button title={"Sort Trend desc"} onPress={handleSortDesc} />
        <Button title={"Sort Name asc"} />
        <Button title={"Sort Name desc"} />
      </View>
      <FlatList
        keyExtractor={sensor => `${sensor.id}`}
        data={sensors}
        renderItem={({ item: sensor }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemLabel}>
              {"Sensor Name: "}
              <Text style={styles.itemValue}>{sensor.name}</Text>
            </Text>
            <Text style={styles.itemLabel}>
              {"Current Reading: "}
              <Text style={styles.itemValue}>
                {sensor.currentReading}
                {sensor.unit}
              </Text>
            </Text>
            <Text style={styles.itemLabel}>
              {"DP: "}
              <Text style={styles.itemValue}>{sensor.deviationPercent}</Text>
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151544",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  itemContainer: {
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    margin: 10,
    borderRadius: 5,
  },
  itemLabel: {
    color: "#fff",
    fontSize: 14,
  },
  itemValue: {
    fontWeight: "bold",
  },
  betweenContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
});

export default HomeScreen;
