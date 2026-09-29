import { useEffect, useState } from "react";

import { BACKEND_HTTP_URL, BACKEND_WS_URL } from "@/config";
import initialSensors from "@/data/sensor_readings.json";
import type { ConnectionStatus, SensorFeedResult } from "@/types/feed";
import type { TSensor } from "@/types/sensor";

const FETCH_TIMEOUT_MS = 3000;
const RETRY_INTERVAL_MS = 5000;

// Bootstraps from GET /sensors, then keeps up via a WebSocket at /ws whose
// messages are full sensor-array snapshots. On any failure it flips to
// "error" and retries on a flat cadence. `sensors` is never cleared on a
// drop, so the last-known values stay on screen while reconnecting.
export function useBackendSensorFeed(enabled: boolean): SensorFeedResult {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let retryId: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    function fail(): void {
      if (cancelled) return;
      setStatus("error");
      clearTimeout(retryId);
      retryId = setTimeout(connect, RETRY_INTERVAL_MS);
    }

    function openSocket(): void {
      socket = new WebSocket(`${BACKEND_WS_URL}/ws`);
      socket.onopen = () => setStatus("connected");
      socket.onmessage = (event) => {
        try {
          setSensors(JSON.parse(event.data));
        } catch {
          // Ignore a malformed frame; the next snapshot replaces it anyway.
        }
      };
      socket.onerror = fail;
      socket.onclose = fail;
    }

    function connect(): void {
      setStatus("connecting");
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      fetch(`${BACKEND_HTTP_URL}/sensors`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data: TSensor) => {
          if (cancelled) return;
          setSensors(data);
          openSocket();
        })
        .catch(fail)
        .finally(() => clearTimeout(timeoutId));
    }

    connect();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(retryId);
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
    };
  }, [enabled]);

  return { sensors, status };
}
