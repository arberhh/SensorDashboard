import type { TSensor } from "sensor-core";

export type FeedMode = "local" | "live";
export type ConnectionStatus = "connecting" | "connected" | "error";

export type SensorFeedResult = {
  sensors: TSensor;
  status: ConnectionStatus;
};
