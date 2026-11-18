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
        // Ignore a malformed frame; the next snapshot replaces it anyway.
        try {
          const snapshot: unknown = JSON.parse(event.data);
          if (!Array.isArray(snapshot)) return;
          setSensors(snapshot);
          setStatus("connected");
        } catch {}
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
        // close() is async, so unhook both: a late frame or close must not touch state.
        socket.onmessage = null;
        socket.onclose = null;
        socket.close();
      }
    };
  }, [enabled]);

  return { sensors, status };
}
