import React, { useEffect, useState } from "react";

import { View, Text, StyleSheet, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";

import initialSensors from "../data/sensor_readings.json";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../theme";
import type { Sensor, TSensor } from "../types/sensor";
import { renderSensorRow } from "../components/SensorRow";

type TypeFilter = "all" | "temperature" | "humidity";
type SortField = "trend" | "name";
type SortDirection = "asc" | "desc";
type ActiveSort = { field: SortField; direction: SortDirection } | null;

const HomeScreen: React.FC = () => {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [activeSort, setActiveSort] = useState<ActiveSort>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          const { min, max } =
            sensor.type === "temperature" ? { min: 15, max: 35 } : { min: 20, max: 90 };

          return {
            ...sensor,
            currentReading: parseFloat((Math.random() * (max - min) + min).toFixed(2)),
          };
        }),
      );
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Deferred so switching the type filter doesn't fight an in-flight
  // scroll/momentum animation for frame budget — requestIdleCallback runs
  // the actual list-swap once the JS thread is idle. This is scoped to
  // the filter specifically, a discrete user action where a brief delay
  // is invisible; the live-reading interval above is deliberately NOT
  // deferred the same way, since delaying that would make "current
  // reading" go stale while someone's actively watching it.
  // Pressing the already-active filter toggles it back off (to "all")
  // instead of being a no-op; pressing "all" while already on "all" is
  // still a no-op, since there's nothing to toggle off.
  function setTypeFilterDeferred(next: TypeFilter): void {
    requestIdleCallback(() => {
      setTypeFilter((current) => (current === next ? "all" : next));
    });
  }

  function applySort(field: SortField, direction: SortDirection): void {
    if (activeSort?.field === field && activeSort?.direction === direction) {
      setSensors(sensors);
      setActiveSort(null);
      return;
    }
    const sorted = [...sensors].sort((a, b) => {
      if (field === "trend") {
        return direction === "asc"
          ? a.deviationPercent - b.deviationPercent
          : b.deviationPercent - a.deviationPercent;
      }
      return direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    setSensors(sorted);
    setActiveSort({ field, direction });
  }

  const filteredSensors =
    typeFilter === "all" ? sensors : sensors.filter((sensor) => sensor.type === typeFilter);

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={styles.sortBar}>
        <View style={styles.sortGroup}>
          <Text style={styles.sortGroupLabel}>TYPE</Text>
          <View style={styles.sortChipRow}>
            <Pressable
              onPress={() => setTypeFilterDeferred("all")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                typeFilter === "all" && styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>All</Text>
            </Pressable>
            <Pressable
              onPress={() => setTypeFilterDeferred("temperature")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                typeFilter === "temperature" && styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Temperature</Text>
            </Pressable>
            <Pressable
              onPress={() => setTypeFilterDeferred("humidity")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                typeFilter === "humidity" && styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Humidity</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sortGroup}>
          <Text style={styles.sortGroupLabel}>TREND</Text>
          <View style={styles.sortChipRow}>
            <Pressable
              onPress={() => applySort("trend", "asc")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === "trend" &&
                  activeSort.direction === "asc" &&
                  styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Asc ↑</Text>
            </Pressable>
            <Pressable
              onPress={() => applySort("trend", "desc")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === "trend" &&
                  activeSort.direction === "desc" &&
                  styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Desc ↓</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sortGroup}>
          <Text style={styles.sortGroupLabel}>NAME</Text>
          <View style={styles.sortChipRow}>
            <Pressable
              onPress={() => applySort("name", "asc")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === "name" &&
                  activeSort.direction === "asc" &&
                  styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Asc ↑</Text>
            </Pressable>
            <Pressable
              onPress={() => applySort("name", "desc")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === "name" &&
                  activeSort.direction === "desc" &&
                  styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Desc ↓</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <FlashList
        keyExtractor={(sensor: Sensor) => `${sensor.id}`}
        data={filteredSensors}
        renderItem={renderSensorRow}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  sortBar: {
    backgroundColor: theme.colors.cardBackground,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginHorizontal: 10,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sortChip: {
    backgroundColor: theme.colors.chipBackground,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortChipActive: {
    backgroundColor: theme.colors.accent,
  },
  sortChipPressed: {
    backgroundColor: theme.colors.chipPressed,
  },
  sortChipRow: {
    flexDirection: "row",
    gap: 8,
  },
  sortChipText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
    fontWeight: "600",
  },
  sortGroup: {
    gap: 6,
  },
  sortGroupLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});

export default HomeScreen;
