import React, { useEffect, useState } from 'react';

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import initialSensors from '../data/sensor_readings.json';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';

type Sensor = (typeof initialSensors)[number];
type TSensor = Sensor[];

type TypeFilter = 'all' | 'temperature' | 'humidity';
type SortField = 'trend' | 'name';
type SortDirection = 'asc' | 'desc';
type ActiveSort = { field: SortField; direction: SortDirection } | null;

function RenderRow({ item: sensor }: { item: Sensor }) {
  const readingColor =
    sensor.type === 'temperature'
      ? theme.colors.temperature
      : theme.colors.humidity;
  const icon = sensor.type === 'temperature' ? '🌡️' : '💧';

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeaderRow}>
        <Text style={styles.itemIcon}>{icon}</Text>
        <Text style={styles.itemName} numberOfLines={1}>
          {sensor.name}
        </Text>
      </View>
      <View style={styles.itemStatsRow}>
        <View style={styles.itemStat}>
          <Text style={styles.itemStatLabel}>READING</Text>
          <Text style={[styles.itemStatValue, { color: readingColor }]}>
            {sensor.currentReading}
            {sensor.unit}
          </Text>
        </View>
        <View style={styles.itemStat}>
          <Text style={styles.itemStatLabel}>DEVIATION</Text>
          <Text style={styles.itemStatValue}>{sensor.deviationPercent}</Text>
        </View>
      </View>
    </View>
  );
}

// No memo here: FlashList's own ViewHolder already gates on `item`
// reference equality (both via its own React.memo comparator and via a
// useMemo wrapping the renderItem call itself), so renderItem is only
// ever invoked when `item` has actually changed. Memoizing this row on
// top of that would just re-check something FlashList already
// guarantees — real, necessary protection under FlatList, redundant
// under FlashList. Still module scope so this stays a stable function
// reference across every HomeScreen render.
function renderSensorRow({ item }: { item: Sensor }) {
  return <RenderRow item={item} />;
}

const HomeScreen: React.FC = () => {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [activeSort, setActiveSort] = useState<ActiveSort>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSensors(prevSensors =>
        prevSensors.map(sensor => {
          const { min, max } =
            sensor.type === 'temperature'
              ? { min: 15, max: 35 }
              : { min: 20, max: 90 };

          return {
            ...sensor,
            currentReading: parseFloat(
              (Math.random() * (max - min) + min).toFixed(2),
            ),
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
  function setTypeFilterDeferred(next: TypeFilter): void {
    requestIdleCallback(() => setTypeFilter(next));
  }

  function applySort(field: SortField, direction: SortDirection): void {
    const sorted = [...sensors].sort((a, b) => {
      if (field === 'trend') {
        return direction === 'asc'
          ? a.deviationPercent - b.deviationPercent
          : b.deviationPercent - a.deviationPercent;
      }
      return direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
    setSensors(sorted);
    setActiveSort({ field, direction });
  }

  const filteredSensors =
    typeFilter === 'all'
      ? sensors
      : sensors.filter(sensor => sensor.type === typeFilter);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.sortBar}>
        <View style={styles.sortGroup}>
          <Text style={styles.sortGroupLabel}>TYPE</Text>
          <View style={styles.sortChipRow}>
            <Pressable
              onPress={() => setTypeFilterDeferred('all')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                typeFilter === 'all' && styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>All</Text>
            </Pressable>
            <Pressable
              onPress={() => setTypeFilterDeferred('temperature')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                typeFilter === 'temperature' && styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Temperature</Text>
            </Pressable>
            <Pressable
              onPress={() => setTypeFilterDeferred('humidity')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                typeFilter === 'humidity' && styles.sortChipActive,
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
              onPress={() => applySort('trend', 'asc')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === 'trend' &&
                  activeSort.direction === 'asc' &&
                  styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Asc ↑</Text>
            </Pressable>
            <Pressable
              onPress={() => applySort('trend', 'desc')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === 'trend' &&
                  activeSort.direction === 'desc' &&
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
              onPress={() => applySort('name', 'asc')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === 'name' &&
                  activeSort.direction === 'asc' &&
                  styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Asc ↑</Text>
            </Pressable>
            <Pressable
              onPress={() => applySort('name', 'desc')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                activeSort?.field === 'name' &&
                  activeSort.direction === 'desc' &&
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
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  sortBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  sortGroup: {
    gap: 6,
  },
  sortGroupLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sortChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.chipBackground,
  },
  sortChipPressed: {
    backgroundColor: theme.colors.chipPressed,
  },
  sortChipActive: {
    backgroundColor: theme.colors.accent,
  },
  sortChipText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
    fontWeight: '600',
  },
  itemContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.sm,
    borderRadius: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.m,
  },
  itemIcon: {
    fontSize: theme.fontSizes.xl,
  },
  itemName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSizes.l,
    fontWeight: '700',
  },
  itemStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
  },
  itemStat: {
    gap: theme.spacing.xs,
  },
  itemStatLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  itemStatValue: {
    fontSize: theme.fontSizes.m,
    color: theme.colors.text,
    fontWeight: '700',
  },
});

export default HomeScreen;
