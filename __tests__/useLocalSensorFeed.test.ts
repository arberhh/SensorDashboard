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
    // 0.5 lands mid-range: temperature 15-35 -> 25, humidity 20-90 -> 55.
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    const { result } = await renderHook(() => useLocalSensorFeed(true));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    const byId = new Map(result.current.sensors.map((s) => [s.id, s]));
    for (const seed of initialSensors) {
      expect(byId.get(seed.id)?.currentReading).toBe(seed.type === "temperature" ? 25 : 55);
    }
    // Sensor 1 is seeded as humidity 22.33 at +1.58%, so its baseline is
    // 22.33 / 1.0158 = 21.98; a 55 reading is +150.2% from that.
    expect(initialSensors[0]).toMatchObject({
      id: 1,
      currentReading: 22.33,
      deviationPercent: 1.58,
    });
    expect(byId.get(1)?.deviationPercent).toBe(150.2);
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
