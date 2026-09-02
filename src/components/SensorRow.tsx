import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import theme from '../theme';
import type { Sensor } from '../types/sensor';

// Sensor names are drawn from a closed list of 20 in genSensorData.js
// (e.g. "Warehouse A - Zone 1", "Cold Storage Room 2") — not arbitrary
// freeform text, so keyword-matching against that fixed set is reliable
// rather than fragile. Order doesn't matter here since the categories
// are distinct, non-overlapping substrings.
function getLocationIcon(name: string): string {
  if (name.includes('Warehouse')) return '🏭';
  if (name.includes('Cold Storage')) return '🧊';
  if (name.includes('Greenhouse')) return '🌿';
  if (name.includes('Server Room')) return '🖥️';
  if (name.includes('Office')) return '🏢';
  if (name.includes('Production Line')) return '⚙️';
  if (name.includes('Loading Bay')) return '🚛';
  if (name.includes('Rooftop')) return '🏙️';
  if (name.includes('Basement')) return '🗄️';
  if (name.includes('Packaging')) return '📦';
  if (name.includes('Cleanroom')) return '🧪';
  return '📍';
}

function RenderRow({ item: sensor }: { item: Sensor }) {
  const readingColor =
    sensor.type === 'temperature'
      ? theme.colors.temperature
      : theme.colors.humidity;
  const readingIcon = sensor.type === 'temperature' ? '🌡️' : '💧';
  const locationIcon = getLocationIcon(sensor.name);

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeaderRow}>
        <Text style={styles.itemIcon}>{locationIcon}</Text>
        <Text style={styles.itemName} numberOfLines={1}>
          {sensor.name}
        </Text>
      </View>
      <View style={styles.itemStatsRow}>
        <View style={styles.itemStat}>
          <Text style={styles.itemStatLabel}>{readingIcon} READING</Text>
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
export function renderSensorRow({ item }: { item: Sensor }) {
  return <RenderRow item={item} />;
}

const styles = StyleSheet.create({
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
