import React, { useEffect, useState } from 'react';

import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';

import initialSensors from '../data/sensor_readings.json';
import { SafeAreaView } from 'react-native-safe-area-context';

type TSensor = (typeof initialSensors)[number][];

type TypeFilter = 'all' | 'temperature' | 'humidity';

const HomeScreen: React.FC = () => {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

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

  function handleSortAsc(): void {
    const sorted = [...sensors].sort(
      (a, b) => a.deviationPercent - b.deviationPercent,
    );
    console.log('Object.is(sensors, sorted):', Object.is(sensors, sorted));
    setSensors(sorted);
  }

  function handleSortDesc(): void {
    const sorted = [...sensors].sort(
      (a, b) => b.deviationPercent - a.deviationPercent,
    );
    console.log('Object.is(sensors, sorted):', Object.is(sensors, sorted));
    setSensors(sorted);
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
              onPress={handleSortAsc}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Asc ↑</Text>
            </Pressable>
            <Pressable
              onPress={handleSortDesc}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
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
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
                pressed && styles.sortChipPressed,
              ]}
            >
              <Text style={styles.sortChipText}>Asc ↑</Text>
            </Pressable>
            <Pressable
              hitSlop={6}
              style={({ pressed }) => [
                styles.sortChip,
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
    backgroundColor: '#151544',
  },
  sortBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sortGroup: {
    gap: 6,
  },
  sortGroupLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sortChipPressed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  sortChipActive: {
    backgroundColor: '#4a5cff',
  },
  sortChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  itemContainer: {
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 10,
    borderRadius: 5,
  },
  itemLabel: {
    color: '#fff',
    fontSize: 14,
  },
  itemValue: {
    fontWeight: 'bold',
  },
});

export default HomeScreen;
