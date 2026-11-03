import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSensorFeedContext } from "@/context/SensorFeedContext";
import theme from "@/theme";

const STATUS_COLORS = {
  connected: theme.colors.statusConnected,
  connecting: theme.colors.statusConnecting,
  error: theme.colors.statusOffline,
};

// Header-right pill: current mode + connection status dot. Tapping switches
// between the local simulation and the backend feed.
function SensorFeedModeToggle() {
  const { mode, status, toggleMode } = useSensorFeedContext();

  return (
    <Pressable
      testID="feed-mode-toggle"
      onPress={toggleMode}
      hitSlop={6}
      style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
    >
      <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} />
      <Text style={styles.text}>{mode === "local" ? "LOCAL" : "LIVE"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: theme.radii.pill,
    height: theme.spacing.sm,
    width: theme.spacing.sm,
  },
  pill: {
    alignItems: "center",
    backgroundColor: theme.colors.chipBackground,
    borderRadius: theme.radii.pill,
    flexDirection: "row",
    gap: theme.spacing.sm - theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
    paddingVertical: theme.spacing.xs + 2,
  },
  pillPressed: {
    backgroundColor: theme.colors.chipPressed,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});

export default SensorFeedModeToggle;
