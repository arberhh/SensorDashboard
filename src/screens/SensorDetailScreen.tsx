import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import theme from "@/theme";
import initialSensors from "@/data/sensor_readings.json";
import type { Sensor } from "@/types/sensor";
import { formatDeviation, getLocationIcon, getTypeStyle } from "@/utils/sensorDisplay";
import {
  filterSimilarSensors,
  sortSensors,
  type ActiveSort,
  type SortDirection,
  type SortField,
} from "@/utils/sensorList";
import type { RootStackParamList } from "@/navigation/RootStack";

type SensorDetailScreenProps = NativeStackScreenProps<RootStackParamList, "SensorDetail">;

// Non-pressable by design (ARB-10: "Does not navigate when a child item is
// pressed") — unlike the Home screen's SensorRow, this is a plain View.
function SimilarSensorRow({ sensor }: { sensor: Sensor }) {
  const typeStyle = getTypeStyle(sensor.type);
  const locationIcon = getLocationIcon(sensor.name);

  return (
    <View style={styles.similarRow}>
      <Text style={styles.similarIcon}>{locationIcon}</Text>
      <View style={styles.similarNameContainer}>
        <Text style={styles.similarName} numberOfLines={1}>
          {sensor.name}
        </Text>
        <Text style={styles.similarSensorId}>{sensor.sensorId}</Text>
      </View>
      <View style={styles.similarStats}>
        <Text style={[styles.similarReading, { color: typeStyle.color }]}>
          {sensor.currentReading}
          {sensor.unit}
        </Text>
        <Text style={styles.similarDeviation}>{formatDeviation(sensor.deviationPercent)}</Text>
      </View>
    </View>
  );
}

const SensorDetailScreen: React.FC<SensorDetailScreenProps> = ({ route }) => {
  const { sensorId } = route.params;
  const sensor = initialSensors.find((s) => s.id === sensorId);
  const [activeSort, setActiveSort] = useState<ActiveSort>(null);

  const similarSensors = useMemo(() => {
    if (!sensor) return [];
    const others = filterSimilarSensors(initialSensors, sensor);
    return activeSort ? sortSensors(others, activeSort.field, activeSort.direction) : others;
    // sensor is read once above from a stable, static import — re-reading
    // it here on every render would defeat the memo, so it's intentionally
    // omitted from deps in favor of the (also static) sensorId + activeSort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorId, activeSort]);

  // Same toggle-off behavior as HomeScreen's applySort: pressing the
  // already-active chip clears the sort rather than being a no-op.
  function applySort(field: SortField, direction: SortDirection): void {
    setActiveSort((current) =>
      current?.field === field && current.direction === direction ? null : { field, direction },
    );
  }

  if (!sensor) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundIcon}>🔍</Text>
          <Text style={styles.notFoundText}>Sensor not found</Text>
          <Text style={styles.notFoundSubtext}>
            No sensor with ID {sensorId} exists in the current dataset.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeStyle = getTypeStyle(sensor.type);
  const locationIcon = getLocationIcon(sensor.name);

  const listHeader = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.headerRow}>
          <Text style={styles.locationIcon}>{locationIcon}</Text>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.sensorName}>{sensor.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeStyle.tint }]}>
              <Text style={[styles.typeBadgeText, { color: typeStyle.color }]}>
                {typeStyle.icon} {typeStyle.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.readingBlock}>
          <Text style={styles.readingLabel}>CURRENT READING</Text>
          <Text style={[styles.readingValue, { color: typeStyle.color }]}>
            {sensor.currentReading}
            <Text style={styles.readingUnit}>{sensor.unit}</Text>
          </Text>
          <Text style={styles.deviationValue}>
            {formatDeviation(sensor.deviationPercent)} deviation
          </Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Sensor Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sensor ID</Text>
          <Text style={styles.detailValue}>{sensor.sensorId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{typeStyle.label}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Unit</Text>
          <Text style={styles.detailValue}>{sensor.unit}</Text>
        </View>
        <View style={[styles.detailRow, styles.noBorder]}>
          <Text style={styles.detailLabel}>Deviation</Text>
          <Text style={styles.detailValue}>{formatDeviation(sensor.deviationPercent)}</Text>
        </View>
      </View>

      <View style={styles.similarHeaderRow}>
        <Text style={styles.sectionTitle}>Similar Sensors</Text>
        <Text style={styles.similarCount}>{similarSensors.length}</Text>
      </View>

      <View style={styles.sortBar}>
        <View style={styles.sortGroup}>
          <Text style={styles.sortGroupLabel}>TREND</Text>
          <View style={styles.sortChipRow}>
            <SortChip
              label="Asc ↑"
              active={activeSort?.field === "trend" && activeSort.direction === "asc"}
              onPress={() => applySort("trend", "asc")}
            />
            <SortChip
              label="Desc ↓"
              active={activeSort?.field === "trend" && activeSort.direction === "desc"}
              onPress={() => applySort("trend", "desc")}
            />
          </View>
        </View>

        <View style={styles.sortGroup}>
          <Text style={styles.sortGroupLabel}>NAME</Text>
          <View style={styles.sortChipRow}>
            <SortChip
              label="Asc ↑"
              active={activeSort?.field === "name" && activeSort.direction === "asc"}
              onPress={() => applySort("name", "asc")}
            />
            <SortChip
              label="Desc ↓"
              active={activeSort?.field === "name" && activeSort.direction === "desc"}
              onPress={() => applySort("name", "desc")}
            />
          </View>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <FlashList
        data={similarSensors}
        keyExtractor={(item: Sensor) => `${item.id}`}
        renderItem={({ item }: { item: Sensor }) => <SimilarSensorRow sensor={item} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No other {typeStyle.label.toLowerCase()} sensors</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }: { pressed: boolean }) => [
        styles.sortChip,
        active && styles.sortChipActive,
        pressed && styles.sortChipPressed,
      ]}
    >
      <Text style={styles.sortChipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  detailLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.m,
  },
  detailRow: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.m,
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.m,
    padding: theme.spacing.l,
  },
  deviationValue: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.m,
    fontWeight: "600",
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.m,
    padding: theme.spacing.l,
    textAlign: "center",
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  headerTitleContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    elevation: 8,
    margin: theme.spacing.sm,
    padding: theme.spacing.l,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  listContent: {
    paddingBottom: theme.spacing.l,
  },
  locationIcon: {
    fontSize: theme.fontSizes.display,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  notFound: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.xs,
    justifyContent: "center",
    padding: theme.spacing.l,
  },
  notFoundIcon: {
    fontSize: theme.fontSizes.display,
    marginBottom: theme.spacing.sm,
  },
  notFoundSubtext: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.m,
    textAlign: "center",
  },
  notFoundText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: "700",
  },
  readingBlock: {
    gap: theme.spacing.xs,
  },
  readingLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  readingUnit: {
    fontSize: theme.fontSizes.xl,
  },
  readingValue: {
    fontSize: theme.fontSizes.display,
    fontWeight: "700",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.l,
    fontWeight: "700",
  },
  sensorName: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: "700",
  },
  similarCount: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.m,
    fontWeight: "600",
  },
  similarDeviation: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
  similarHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.l,
  },
  similarIcon: {
    fontSize: theme.fontSizes.xl,
  },
  similarName: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
    fontWeight: "600",
  },
  similarNameContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  similarReading: {
    fontSize: theme.fontSizes.m,
    fontWeight: "700",
  },
  similarRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.m,
  },
  similarSensorId: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
  },
  similarStats: {
    alignItems: "flex-end",
  },
  sortBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.m,
    marginHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  sortChip: {
    backgroundColor: theme.colors.chipBackground,
    borderRadius: 999,
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
    gap: theme.spacing.sm - theme.spacing.xs,
  },
  sortGroupLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  typeBadgeText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
  },
});

export default SensorDetailScreen;
