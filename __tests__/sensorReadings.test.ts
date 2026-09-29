/**
 * @format
 */

import { generateReading } from "@/utils/sensorReadings";

// Statistical, not exact — generateReading is a random-in-range formula,
// so these assert the invariants that must hold for every call (correct
// range for the type, at most 2 decimal places) across many samples
// rather than any single value.
const SAMPLE_SIZE = 500;

describe("generateReading", () => {
  test("temperature readings stay within [15, 35]", () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const reading = generateReading("temperature");
      expect(reading).toBeGreaterThanOrEqual(15);
      expect(reading).toBeLessThanOrEqual(35);
    }
  });

  test("humidity readings stay within [20, 90]", () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const reading = generateReading("humidity");
      expect(reading).toBeGreaterThanOrEqual(20);
      expect(reading).toBeLessThanOrEqual(90);
    }
  });

  test("readings are rounded to at most 2 decimal places", () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const reading = generateReading(i % 2 === 0 ? "temperature" : "humidity");
      const decimalPlaces = (String(reading).split(".")[1] ?? "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    }
  });

  test("does not return the exact same value on every call (sanity check that it's actually random)", () => {
    const readings = new Set(Array.from({ length: 20 }, () => generateReading("temperature")));
    expect(readings.size).toBeGreaterThan(1);
  });
});
