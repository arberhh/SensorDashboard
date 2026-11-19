/**
 * @format
 */

import { baselineReading, calculateDeviation, generateReading } from "@/utils/sensorReadings";

// Statistical, not exact — generateReading is a random-in-range formula,
// so these assert the invariants that must hold for every call (within ±8%
// of the baseline, at most 2 decimal places) across many samples rather
// than any single value.
const SAMPLE_SIZE = 500;

describe("generateReading", () => {
  test("readings stay within ±8% of the baseline", () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const reading = generateReading(50);
      expect(reading).toBeGreaterThanOrEqual(46);
      expect(reading).toBeLessThanOrEqual(54);
    }
  });

  test("the extremes of Math.random map to the edges of the ±8% band", () => {
    jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.5);
    expect(generateReading(50)).toBe(46);
    expect(generateReading(50)).toBe(50);
    jest.restoreAllMocks();
  });

  test("readings are rounded to at most 2 decimal places", () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const reading = generateReading(21.982673754676114);
      const decimalPlaces = (String(reading).split(".")[1] ?? "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    }
  });

  test("does not return the exact same value on every call (sanity check that it's actually random)", () => {
    const readings = new Set(Array.from({ length: 20 }, () => generateReading(25)));
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
    const sensor = { currentReading: 22.33, deviationPercent: 1.58 };
    const baseline = baselineReading(sensor);
    expect(calculateDeviation(sensor.currentReading, baseline)).toBe(1.58);
  });

  test("falls back to the current reading for a -100% seed instead of Infinity", () => {
    expect(baselineReading({ currentReading: 30, deviationPercent: -100 })).toBe(30);
  });
});
