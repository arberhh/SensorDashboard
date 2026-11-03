/**
 * @format
 */

import { act, renderHook } from "@testing-library/react-native";

import initialSensors from "@/data/sensor_readings.json";
import { useLocalSensorFeed } from "@/hooks/useLocalSensorFeed";
import { baselineReading, calculateDeviation } from "@/utils/sensorReadings";

describe("useLocalSensorFeed", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("each tick recomputes deviationPercent against the sensor's fixed baseline", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useLocalSensorFeed(true));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    result.current.sensors.forEach((sensor, index) => {
      const baseline = baselineReading(initialSensors[index]);
      expect(sensor.deviationPercent).toBe(calculateDeviation(sensor.currentReading, baseline));
    });
  });
});
