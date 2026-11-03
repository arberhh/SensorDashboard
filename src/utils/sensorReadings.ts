import type { Sensor } from "@/types/sensor";

// Same ±8% spread as the generator's deviationPercent
// (scripts/genSensorData.js), so live deviations stay in the seed data's
// range instead of swinging across the whole reading range for a type.
const MAX_DRIFT = 0.08;

// A new random currentReading within ±8% of a sensor's baseline, rounded to
// 2 decimals — what the local feed's 5s tick applies to every sensor.
export function generateReading(baseline: number): number {
  const drift = (Math.random() * 2 - 1) * MAX_DRIFT;
  return parseFloat((baseline * (1 + drift)).toFixed(2));
}

// The reading a sensor's deviationPercent is measured against, recovered
// from its seed data (deviationPercent = (reading - baseline) / baseline).
// A -100% seed has no recoverable baseline (it would divide by zero), so
// the current reading stands in and later deviations measure from it.
export function baselineReading(
  sensor: Pick<Sensor, "currentReading" | "deviationPercent">,
): number {
  const ratio = 1 + sensor.deviationPercent / 100;
  return ratio === 0 ? sensor.currentReading : sensor.currentReading / ratio;
}

// Percent change of `reading` from `baseline`, rounded to 2 decimals like
// the generator's deviationPercent.
export function calculateDeviation(reading: number, baseline: number): number {
  return parseFloat((((reading - baseline) / baseline) * 100).toFixed(2));
}
