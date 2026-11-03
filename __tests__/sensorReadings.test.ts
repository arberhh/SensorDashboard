/**
 * @format
 */

import { baselineReading, calculateDeviation, generateReading } from "@/utils/sensorReadings";

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

describe("calculateDeviation", () => {
  test("is the percent change from the baseline", () => {
    expect(calculateDeviation(110, 100)).toBe(10);
    expect(calculateDeviation(90, 100)).toBe(-10);
    expect(calculateDeviation(100, 100)).toBe(0);
  });

  test("rounds to 2 decimal places", () => {
    expect(calculateDeviation(21, 19)).toBe(10.53);
  });
});

describe("baselineReading", () => {
  test("inverts calculateDeviation for a seeded sensor", () => {
    const sensor = { currentReading: 22.33, deviationPercent: 1.58 } as Parameters<
      typeof baselineReading
    >[0];
    const baseline = baselineReading(sensor);
    expect(calculateDeviation(sensor.currentReading, baseline)).toBe(1.58);
  });
});
