import { useEffect, useState } from "react";

import initialSensors from "@/data/sensor_readings.json";
import type { SensorFeedResult } from "@/types/feed";
import type { TSensor } from "@/types/sensor";
import { generateReading } from "@/utils/sensorReadings";

// The static-JSON-plus-5s-tick simulation, unchanged from when it lived
// inline in HomeScreen. Deliberately NOT deferred via requestIdleCallback:
// delaying live data would make it stale while someone's watching it.
export function useLocalSensorFeed(enabled: boolean): SensorFeedResult {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => ({
          ...sensor,
          currentReading: generateReading(sensor.type),
        })),
      );
    }, 5000);

    return () => clearInterval(intervalId);
  }, [enabled]);

  return { sensors, status: "connected" };
}
