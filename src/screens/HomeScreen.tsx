import React, { useEffect, useState } from 'react';

import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';

import initialSensors from '../data/sensor_readings.json';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';

type TSensor = (typeof initialSensors)[number][];

type TypeFilter = 'all' | 'temperature' | 'humidity';
type SortField = 'trend' | 'name';
type SortDirection = 'asc' | 'desc';
type ActiveSort = { field: SortField; direction: SortDirection } | null;

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
              onPress={() => setTypeFilter('all')}
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
              onPress={() => setTypeFilter('temperature')}
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
              onPress={() => setTypeFilter('humidity')}
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
      <FlatList
        keyExtractor={sensor => `${sensor.id}`}
        data={filteredSensors}
        renderItem={({ item: sensor }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemLabel}>
              {'Sensor Name: '}
              <Text style={styles.itemValue}>{sensor.name}</Text>
            </Text>
            <Text style={styles.itemLabel}>
              {'Current Reading: '}
              <Text style={styles.itemValue}>
                {sensor.currentReading}
                {sensor.unit}
              </Text>
            </Text>
            <Text style={styles.itemLabel}>
              {'DP: '}
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
    padding: 15,
    backgroundColor: theme.colors.cardBackground,
    margin: 10,
    borderRadius: 5,
  },
  itemLabel: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
  },
  itemValue: {
    fontWeight: 'bold',
  },
});

export default HomeScreen;
