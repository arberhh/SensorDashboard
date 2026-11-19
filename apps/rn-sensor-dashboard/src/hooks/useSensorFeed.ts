import { useBackendSensorFeed } from "@/hooks/useBackendSensorFeed";
import { useLocalSensorFeed } from "@/hooks/useLocalSensorFeed";
import type { FeedMode, SensorFeedResult } from "@/types/feed";

// Both hooks are always called (rules of hooks); each is a no-op while its
// mode isn't active.
export function useSensorFeed(mode: FeedMode): SensorFeedResult {
  const local = useLocalSensorFeed(mode === "local");
  const backend = useBackendSensorFeed(mode === "live");
  return mode === "local" ? local : backend;
}
