import { useEffect, useState } from "react";

import { BACKEND_WS_URL } from "@/config";
import initialSensors from "@/data/sensor_readings.json";
import type { ConnectionStatus, SensorFeedResult } from "@/types/feed";
import type { TSensor } from "@/types/sensor";

const RETRY_INTERVAL_MS = 5000;

// Follows the WebSocket at /ws, which sends the full sensor array on connect
// and again on every tick. On a drop it flips to "error" and retries on a
// flat cadence. `sensors` is never cleared, so the last-known values stay on
// screen while reconnecting.
export function useBackendSensorFeed(enabled: boolean): SensorFeedResult {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let retryId: ReturnType<typeof setTimeout> | undefined;

    function connect(): void {
      setStatus("connecting");
      socket = new WebSocket(`${BACKEND_WS_URL}/ws`);
      socket.onmessage = (event) => {
        try {
          setSensors(JSON.parse(event.data));
          setStatus("connected");
        } catch {
          // Ignore a malformed frame; the next snapshot replaces it anyway.
        }
      };
      // A failed or dropped socket always ends in close, so no onerror.
      socket.onclose = () => {
        setStatus("error");
        retryId = setTimeout(connect, RETRY_INTERVAL_MS);
      };
    }

    connect();

    return () => {
      clearTimeout(retryId);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [enabled]);

  return { sensors, status };
}
