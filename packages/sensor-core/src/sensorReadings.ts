import type { Sensor } from "./sensor";

// Same ±8% spread as the generator's deviationPercent
// (scripts/genSensorData.js), so live deviations stay in the seed data's
// range instead of swinging across the whole reading range for a type.
const MAX_DRIFT = 0.08;

// A new currentReading within ±8% of a sensor's baseline, rounded to 2
// decimals — what the local feed's 5s tick applies to every sensor. `roll`
// is a random number in [0, 1), passed in because Exact's data module has no
// Math.random.
export function generateReading(baseline: number, roll: number): number {
  const drift = (roll * 2 - 1) * MAX_DRIFT;
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
