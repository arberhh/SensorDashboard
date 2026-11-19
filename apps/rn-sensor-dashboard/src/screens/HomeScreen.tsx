import React, { useMemo, useReducer } from "react";

import { View, Text, StyleSheet, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";

import { SafeAreaView } from "react-native-safe-area-context";
import theme from "@/theme";
import {
  filterSensorsByType,
  orderByIds,
  sortSensors,
  type ActiveSort,
  type SortDirection,
  type SortField,
  type TypeFilter,
  type Sensor,
} from "sensor-core";
import { renderSensorRow } from "@/components/SensorRow";
import { useSensorFeedContext } from "@/context/SensorFeedContext";

type HomeState = {
  typeFilter: TypeFilter;
  activeSort: ActiveSort;
  sortedIds: number[] | null;
};

type HomeAction =
  | { type: "typeFilterPressed"; filter: TypeFilter }
  | { type: "sortPressed"; field: SortField; direction: SortDirection; ids: number[] };

const initialState: HomeState = { typeFilter: "all", activeSort: null, sortedIds: null };

// Reducer rather than separate useState: activeSort and sortedIds must change
// together, and a press is one transition instead of two setters.
function homeReducer(state: HomeState, action: HomeAction): HomeState {
  switch (action.type) {
    case "typeFilterPressed":
      // Pressing the active filter toggles it back off (to "all").
      return {
        ...state,
        typeFilter: state.typeFilter === action.filter ? "all" : action.filter,
      };
    case "sortPressed": {
      const { activeSort } = state;
      if (activeSort?.field === action.field && activeSort.direction === action.direction) {
        return { ...state, activeSort: null, sortedIds: null };
      }
      return {
        ...state,
        activeSort: { field: action.field, direction: action.direction },
        sortedIds: action.ids,
      };
    }
  }
}

const HomeScreen: React.FC = () => {
  const { sensors } = useSensorFeedContext();
  const [{ typeFilter, activeSort, sortedIds }, dispatch] = useReducer(homeReducer, initialState);

  // Deferred so switching the type filter doesn't fight an in-flight
  // scroll/momentum animation for frame budget — requestIdleCallback runs
  // the actual list-swap once the JS thread is idle. This is scoped to
  // the filter specifically, a discrete user action where a brief delay
  // is invisible; the live-reading feed (useSensorFeed) is deliberately NOT
  // deferred the same way, since delaying that would make "current
  // reading" go stale while someone's actively watching it.
  // Pressing "all" while already on "all" is still a no-op.
  function setTypeFilterDeferred(filter: TypeFilter): void {
    requestIdleCallback(() => {
      dispatch({ type: "typeFilterPressed", filter });
    });
  }

  // Pressing the already-active sort chip clears it. The order is captured
  // at press time rather than re-derived every tick: deviationPercent is
  // live, so re-sorting on each 5s tick would reshuffle rows under the
  // user's finger. Row values stay live; the order changes only on a press.
  function applySort(field: SortField, direction: SortDirection): void {
    const ids = sortSensors(sensors, field, direction).map((sensor) => sensor.id);
    dispatch({ type: "sortPressed", field, direction, ids });
  }

  const filteredSensors = useMemo(() => {
    const ordered = sortedIds ? orderByIds(sensors, sortedIds) : sensors;
    return filterSensorsByType(ordered, typeFilter);
  }, [sensors, typeFilter, sortedIds]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={styles.sortBar}>
        <View style={styles.sortGroup}>
          <Text style={styles.sortGroupLabel}>TYPE</Text>
          <View style={styles.sortChipRow}>
            <Pressable
              testID="type-filter-all"
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
              testID="type-filter-temperature"
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
              testID="type-filter-humidity"
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
              testID="sort-trend-asc"
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
              testID="sort-trend-desc"
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
              testID="sort-name-asc"
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
              testID="sort-name-desc"
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
  sortChip: {
    backgroundColor: theme.colors.chipBackground,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
    paddingVertical: theme.spacing.xs + 2,
  },
  sortChipActive: {
    backgroundColor: theme.colors.accent,
  },
  sortChipPressed: {
    backgroundColor: theme.colors.chipPressed,
  },
  sortChipRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  sortChipText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
    fontWeight: "600",
  },
  sortGroup: {
    gap: theme.spacing.xs + 2,
  },
  sortGroupLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});

export default HomeScreen;
