/**
 * @format
 */

import { act, renderHook } from "@testing-library/react-native";

import initialSensors from "@/data/sensor_readings.json";
import { useLocalSensorFeed } from "@/hooks/useLocalSensorFeed";

describe("useLocalSensorFeed", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("a tick replaces each reading and recomputes deviation from the seed baseline", async () => {
    jest.useFakeTimers();
    // 0.75 maps to a +4% drift from each sensor's baseline.
    jest.spyOn(Math, "random").mockReturnValue(0.75);
    const { result } = await renderHook(() => useLocalSensorFeed(true));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    const byId = new Map(result.current.sensors.map((s) => [s.id, s]));
    for (const seed of initialSensors) {
      expect(byId.get(seed.id)?.currentReading).not.toBe(seed.currentReading);
    }
    // Sensor 1 is seeded as humidity 22.33 at +1.58%, so its baseline is
    // 22.33 / 1.0158 = 21.98; +4% of that rounds to 22.86, which is +3.99%.
    expect(initialSensors[0]).toMatchObject({
      id: 1,
      currentReading: 22.33,
      deviationPercent: 1.58,
    });
    expect(byId.get(1)).toMatchObject({ currentReading: 22.86, deviationPercent: 3.99 });
  });

  test("does not tick while disabled", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useLocalSensorFeed(false));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.sensors).toBe(initialSensors);
  });
});
