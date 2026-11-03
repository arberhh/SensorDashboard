import { useEffect, useState } from "react";

import initialSensors from "@/data/sensor_readings.json";
import type { SensorFeedResult } from "@/types/feed";
import type { TSensor } from "@/types/sensor";
import { baselineReading, calculateDeviation, generateReading } from "@/utils/sensorReadings";

// Fixed per sensor for the app's lifetime, so deviationPercent keeps
// measuring against the same baseline as the readings fluctuate.
const baselines = new Map(initialSensors.map((sensor) => [sensor.id, baselineReading(sensor)]));

// The static-JSON-plus-5s-tick simulation: each tick draws a new reading
// and recomputes deviationPercent from it. Deliberately NOT deferred via requestIdleCallback:
// delaying live data would make it stale while someone's watching it.
export function useLocalSensorFeed(enabled: boolean): SensorFeedResult {
  const [sensors, setSensors] = useState<TSensor>(initialSensors);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          const currentReading = generateReading(sensor.type);
          const baseline = baselines.get(sensor.id) ?? currentReading;
          return {
            ...sensor,
            currentReading,
            deviationPercent: calculateDeviation(currentReading, baseline),
          };
        }),
      );
    }, 5000);

    return () => clearInterval(intervalId);
  }, [enabled]);

  return { sensors, status: "connected" };
}
