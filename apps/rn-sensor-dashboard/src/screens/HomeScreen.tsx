import React, { useMemo, useState } from "react";

import { View, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";

import { SafeAreaView } from "react-native-safe-area-context";
import theme from "@/theme";
import { filterSensorsByType, type TypeFilter, type Sensor } from "sensor-core";
import { renderSensorRow } from "@/components/SensorRow";
import { Chip, ChipGroup, SortGroups } from "@/components/SortChips";
import { useSensorFeedContext } from "@/context/SensorFeedContext";
import { useSensorSort } from "@/hooks/useSensorSort";

const HomeScreen: React.FC = () => {
  const { sensors } = useSensorFeedContext();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const { activeSort, ordered, pressSort } = useSensorSort(sensors);

  // Deferred so switching the type filter doesn't fight an in-flight
  // scroll/momentum animation for frame budget — requestIdleCallback runs
  // the actual list-swap once the JS thread is idle. This is scoped to
  // the filter specifically, a discrete user action where a brief delay
  // is invisible; the live-reading feed (useSensorFeed) is deliberately NOT
  // deferred the same way, since delaying that would make "current
  // reading" go stale while someone's actively watching it.
  // Pressing the active filter toggles it back off (to "all"); pressing
  // "all" while already on "all" is still a no-op.
  function pressTypeFilter(filter: TypeFilter): void {
    requestIdleCallback(() => {
      setTypeFilter((current) => (current === filter ? "all" : filter));
    });
  }

  const filteredSensors = useMemo(
    () => filterSensorsByType(ordered, typeFilter),
    [ordered, typeFilter],
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={styles.sortBar}>
        <ChipGroup label="TYPE">
          <Chip
            testID="type-filter-all"
            label="All"
            active={typeFilter === "all"}
            onPress={() => pressTypeFilter("all")}
          />
          <Chip
            testID="type-filter-temperature"
            label="Temperature"
            active={typeFilter === "temperature"}
            onPress={() => pressTypeFilter("temperature")}
          />
          <Chip
            testID="type-filter-humidity"
            label="Humidity"
            active={typeFilter === "humidity"}
            onPress={() => pressTypeFilter("humidity")}
          />
        </ChipGroup>
        <SortGroups activeSort={activeSort} onPress={pressSort} />
      </View>
      <FlashList
        testID="sensor-list"
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
    borderRadius: theme.radii.m,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.m,
    marginHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
  },
});

export default HomeScreen;
