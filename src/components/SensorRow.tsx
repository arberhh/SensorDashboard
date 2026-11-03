import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import theme from "@/theme";
import type { Sensor } from "@/types/sensor";
import { formatDeviation, getLocationIcon } from "@/utils/sensorDisplay";

function RenderRow({ item: sensor }: { item: Sensor }) {
  const navigation = useNavigation();
  const readingColor =
    sensor.type === "temperature" ? theme.colors.temperature : theme.colors.humidity;
  const readingIcon = sensor.type === "temperature" ? "🌡️" : "💧";
  const locationIcon = getLocationIcon(sensor.name);

  function onSensorPress() {
    navigation.navigate("SensorDetail", { sensorId: sensor.id });
  }

  return (
    <Pressable
      testID={`sensor-row-${sensor.id}`}
      onPress={onSensorPress}
      style={styles.itemContainer}
    >
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
          <Text style={styles.itemStatValue}>{formatDeviation(sensor.deviationPercent)}</Text>
        </View>
      </View>
    </Pressable>
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.l,
    elevation: 8,
    margin: theme.spacing.sm,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  itemHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.m,
  },
  itemIcon: {
    fontSize: theme.fontSizes.xl,
  },
  itemName: {
    color: theme.colors.text,
    flex: 1,
    fontSize: theme.fontSizes.l,
    fontWeight: "700",
  },
  itemStat: {
    gap: theme.spacing.xs,
  },
  itemStatLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  itemStatValue: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
    fontWeight: "700",
  },
  itemStatsRow: {
    flexDirection: "row",
    gap: theme.spacing.xl,
  },
});
