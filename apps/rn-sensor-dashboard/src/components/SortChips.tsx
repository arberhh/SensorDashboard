import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import theme from "@/theme";
import type { ActiveSort, SortDirection, SortField } from "sensor-core";

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
};

export function Chip({ label, active, onPress, testID }: ChipProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: "trend", label: "TREND" },
  { field: "name", label: "NAME" },
];
const SORT_DIRECTIONS: { direction: SortDirection; label: string }[] = [
  { direction: "asc", label: "Asc ↑" },
  { direction: "desc", label: "Desc ↓" },
];

type SortGroupsProps = {
  activeSort: ActiveSort;
  onPress: (field: SortField, direction: SortDirection) => void;
};

// The TREND and NAME groups, the same on the home and the detail screen.
export function SortGroups({ activeSort, onPress }: SortGroupsProps) {
  return (
    <>
      {SORT_FIELDS.map(({ field, label }) => (
        <ChipGroup key={field} label={label}>
          {SORT_DIRECTIONS.map(({ direction, label: chipLabel }) => (
            <Chip
              key={direction}
              testID={`sort-${field}-${direction}`}
              label={chipLabel}
              active={activeSort?.field === field && activeSort.direction === direction}
              onPress={() => onPress(field, direction)}
            />
          ))}
        </ChipGroup>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: theme.colors.chipBackground,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
    paddingVertical: theme.spacing.xs + 2,
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
  },
  chipPressed: {
    backgroundColor: theme.colors.chipPressed,
  },
  chipRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.m,
    fontWeight: "600",
  },
  group: {
    gap: theme.spacing.xs + 2,
  },
  groupLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});
